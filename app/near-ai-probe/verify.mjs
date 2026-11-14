// NEAR AI Cloud private-inference check, following
// https://docs.near.ai/cloud/verification/cloud-api/response-signatures.md
// 1. preflight: fresh nonce -> gateway + model attestation, check the nonce and
//    signing key are bound inside the TDX quote report_data
// 2. completion with exact request bytes kept
// 3. fetch signature, verify ed25519 over "<model>:<sha256(req)>:<sha256(resp)>"
//    with the key from the verified preflight report
// Usage: node app/near-ai-probe/verify.mjs   (reads NEAR_API_KEY from Product/.env)
import crypto from "node:crypto";
import fs from "node:fs";

const env = Object.fromEntries(fs.readFileSync(new URL("../../.env", import.meta.url), "utf8")
  .split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const KEY = env.NEAR_API_KEY;
const MODEL = process.argv[2] || "deepseek-ai/DeepSeek-V4.1-Flash-1017";
const BASE = "https://cloud-api.near.ai/v1";
const ALGO = "ed25519";
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const check = (label, ok) => { console.log(ok ? "PASS" : "FAIL", label); if (!ok) process.exitCode = 1; return ok; };

// TDX quote v4: 48-byte header, report body REPORTDATA at offset 568, 64 bytes
const quoteReportData = (hexQuote) => Buffer.from(hexQuote, "hex").subarray(568, 632).toString("hex");

function checkReport(name, r, nonce) {
  const rd = quoteReportData(r.intel_quote);
  check(`${name}: nonce echoed`, r.request_nonce === nonce);
  check(`${name}: quote report_data = [signing key | nonce]`,
    rd.slice(0, 64) === r.signing_address.toLowerCase().padEnd(64, "0").slice(0, 64) && rd.slice(64) === nonce);
}

const nonce = crypto.randomBytes(32).toString("hex");
const pre = await (await fetch(`${BASE}/attestation/report?nonce=${nonce}&signing_algo=${ALGO}&model=${encodeURIComponent(MODEL)}&provider=near`)).json();
if (pre.error) throw new Error(pre.error.message);
checkReport("gateway", pre.gateway_attestation, nonce);
const models = pre.model_attestations || [];
check("exactly one model report", models.length === 1);
const m = models[0];
checkReport("model", m, nonce);
check("model report has NVIDIA GPU evidence", !!m.nvidia_payload && JSON.parse(m.nvidia_payload).nonce === nonce);

// Synthetic sensitive-looking prompt (fictional company, fictional numbers)
const reqBytes = Buffer.from(JSON.stringify({
  model: MODEL,
  messages: [{ role: "user", content: "Fictional test. CV Maju has cost price 812 million IDR and minimum margin 9%. Reply with only the minimum bid price in million IDR, one number." }],
  max_tokens: 2000,
  stream: false,
}));
const resp = await fetch(`${BASE}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${KEY}`, "x-no-aliasing": "true", "Accept-Encoding": "identity" },
  body: reqBytes,
});
const respBytes = Buffer.from(await resp.arrayBuffer());
if (!resp.ok) throw new Error(`completion ${resp.status}: ${respBytes.toString().slice(0, 300)}`);
const completion = JSON.parse(respBytes);
console.log("model answer:", JSON.stringify(completion.choices?.[0]?.message?.content).slice(0, 200));

let sig;
for (let i = 0; i < 6; i++) {
  const r = await fetch(`${BASE}/signature/${completion.id}?signing_algo=${ALGO}`, { headers: { "Authorization": `Bearer ${KEY}`, "Accept": "application/json" } });
  if (r.status === 200) { sig = await r.json(); if (!sig.error_code) break; }
  await new Promise((s) => setTimeout(s, 2000));
}
if (!sig || sig.error_code) throw new Error(`signature unavailable: ${JSON.stringify(sig)}`);
console.log("signature_kind:", sig.signature_kind);

const expectedText = sig.signature_kind === "provider_tee"
  ? `${MODEL}:${sha(reqBytes)}:${sha(respBytes)}`
  : `${sha(reqBytes)}:${sha(respBytes)}`;
const signer = sig.signature_kind === "provider_tee" ? m : pre.gateway_attestation;
check("signed text = hash of exact request and response", sig.text === expectedText);
check("signer = key from verified preflight report", sig.signing_address?.toLowerCase() === signer.signing_address.toLowerCase() && sig.signing_algo === ALGO);
const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(signer.signing_address, "hex")]), format: "der", type: "spki" });
const sigBytes = Buffer.from(sig.signature.replace(/^0x/, ""), "hex");
check("ed25519 signature valid", crypto.verify(null, Buffer.from(sig.text, "utf8"), pub, sigBytes));
console.log("usage:", JSON.stringify(completion.usage));
console.log("NOT checked here: Intel and NVIDIA certificate chains of the quotes (use the NEAR AI Verification Center).");
