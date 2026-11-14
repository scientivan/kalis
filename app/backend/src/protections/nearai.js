// NEAR AI Cloud client that only uses attested TEE models (see app/near-ai-probe/verify.mjs).
// Every call does a fresh-nonce preflight, checks the nonce and signing key inside the TDX
// report_data, and verifies the provider_tee response signature over the exact bytes.
import crypto from "node:crypto";
import { config } from "../config.js";
import { ProtectionError } from "./store.js";

const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const reportData = (hexQuote) => Buffer.from(hexQuote, "hex").subarray(568, 632).toString("hex");

async function preflight(model) {
  const nonce = crypto.randomBytes(32).toString("hex");
  const r = await fetch(`${config.nearAi.base}/attestation/report?nonce=${nonce}&signing_algo=ed25519&model=${encodeURIComponent(model)}&provider=near`);
  const d = JSON.parse(await r.text(), (k, v) => v);
  if (d.error) throw new ProtectionError(502, "model_not_attested", `${model} has no attestation report: ${d.error.message}`);
  const ms = d.model_attestations || [];
  const ok = (a) => a.request_nonce === nonce && reportData(a.intel_quote).slice(0, 64) === a.signing_address.toLowerCase() && reportData(a.intel_quote).slice(64) === nonce;
  if (!ok(d.gateway_attestation) || !ms.length || !ms.every(ok)) throw new ProtectionError(502, "attestation_failed", `${model} attestation did not bind the fresh nonce`);
  return { nonce, signers: ms.map((m) => m.signing_address.toLowerCase()), gpu_evidence: ms.every((m) => Boolean(m.nvidia_payload)) };
}

function verifySignature(sig, signers, expectedText) {
  if (!sig || sig.error_code) return false;
  if (sig.text !== expectedText || !signers.includes((sig.signing_address || "").toLowerCase())) return false;
  const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(sig.signing_address, "hex")]), format: "der", type: "spki" });
  return crypto.verify(null, Buffer.from(sig.text, "utf8"), pub, Buffer.from(sig.signature.replace(/^0x/, ""), "hex"));
}

/** Chat completion on an attested model. Returns { content, proof }. */
export async function privateChat(model, messages, { maxTokens = 2000 } = {}) {
  const key = config.secrets.nearAiKey;
  if (!key) throw new ProtectionError(503, "not_configured", "NEAR AI key is not configured");
  const pf = await preflight(model);
  const reqBytes = Buffer.from(JSON.stringify({ model, messages, max_tokens: maxTokens, stream: false }));
  const resp = await fetch(`${config.nearAi.base}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "x-no-aliasing": "true", "Accept-Encoding": "identity" }, body: reqBytes });
  const respBytes = Buffer.from(await resp.arrayBuffer());
  if (!resp.ok) throw new ProtectionError(502, "model_error", `${model}: HTTP ${resp.status} ${respBytes.toString().slice(0, 200)}`);
  const out = JSON.parse(respBytes);
  let sig = null;
  for (let i = 0; i < 6 && !sig; i++) {
    const r = await fetch(`${config.nearAi.base}/signature/${out.id}?signing_algo=ed25519`, { headers: { Authorization: `Bearer ${key}` } });
    if (r.status === 200) { const j = await r.json(); if (!j.error_code) sig = j; }
    if (!sig) await new Promise((res) => setTimeout(res, 2000));
  }
  const signed = verifySignature(sig, pf.signers, `${model}:${sha(reqBytes)}:${sha(respBytes)}`);
  if (!signed) throw new ProtectionError(502, "unsigned_response", `${model} response signature could not be verified, so the answer is discarded`);
  return { content: out.choices?.[0]?.message?.content || "", proof: { model, fresh_nonce: pf.nonce, gpu_evidence: pf.gpu_evidence, signature_kind: sig.signature_kind, signature_valid: true, completion_id: out.id } };
}

/** PII spans from the attested privacy-filter model. */
export async function classifyPrivate(text) {
  const key = config.secrets.nearAiKey;
  const pf = await preflight(config.nearAi.piiModel);
  const r = await fetch(`${config.nearAi.base}/privacy/classify`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: config.nearAi.piiModel, input: text }) });
  const j = await r.json();
  if (!r.ok) throw new ProtectionError(502, "pii_error", `privacy-filter: ${JSON.stringify(j).slice(0, 200)}`);
  return { spans: j.data?.[0]?.spans || [], proof: { model: config.nearAi.piiModel, fresh_nonce: pf.nonce, gpu_evidence: pf.gpu_evidence, note: "privacy/classify returns no response signature; only the model attestation is checked" } };
}
