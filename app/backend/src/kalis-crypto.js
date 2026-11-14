// Kalis client cryptography. Runs unchanged in the browser and in Node 20+.
// Matches app/kalis-runner (X25519 + HKDF-SHA256 + ChaCha20-Poly1305, ed25519 completion records).
//
// Browser use without a bundler (import map):
//   "@noble/curves/": "https://cdn.jsdelivr.net/npm/@noble/curves@1.8.1/",
//   "@noble/ciphers/": "https://cdn.jsdelivr.net/npm/@noble/ciphers@1.2.1/",
//   "@noble/hashes/": "https://cdn.jsdelivr.net/npm/@noble/hashes@1.7.1/"
// then `import * as kalis from "/kalis-crypto.js"` (the backend serves this file at /kalis-crypto.js).
import { x25519, ed25519 } from "@noble/curves/ed25519";
import { chacha20poly1305 } from "@noble/ciphers/chacha";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { randomBytes } from "@noble/hashes/utils";

const enc = new TextEncoder();
const dec = new TextDecoder();
const INFO = { method: enc.encode("kalis/v1/method"), data: enc.encode("kalis/v1/request"), answer: enc.encode("kalis/v1/answer") };
export const COMPLETION_PREFIX = "kalis-completion:v1:";
// Buyer checks for manifest v5 (JSONLogic, evaluated on the device). Served next to this file as /checks.js.
export { runChecks, CHECKER_VERSION } from "./checks.js";

export const toHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
export const fromHex = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));
export function toB64(b) { let s = ""; for (const x of b) s += String.fromCharCode(x); return btoa(s); }
export function fromB64(s) { const t = atob(s); const out = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) out[i] = t.charCodeAt(i); return out; }
export const sha256Hex = (bytes) => toHex(sha256(typeof bytes === "string" ? enc.encode(bytes) : bytes));
const concat = (a, b) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
const derive = (shared, epk, tpk, info) => hkdf(sha256, shared, concat(epk, tpk), info, 32);

function seal(teePubHex, bytes, info) {
  const tpk = fromHex(teePubHex);
  const esk = randomBytes(32);
  const epk = x25519.getPublicKey(esk);
  const shared = x25519.getSharedSecret(esk, tpk);
  const nonce = randomBytes(12);
  const ct = chacha20poly1305(derive(shared, epk, tpk, info), nonce).encrypt(bytes);
  return { sealed: { epk: toB64(epk), nonce: toB64(nonce), ct: toB64(ct) }, secret: { shared, epk, tpk, ct } };
}

/** Seller: seal the method WASM to the runner's TEE key. The result is safe to publish. */
export const sealMethod = (teePubHex, wasmBytes) => seal(teePubHex, wasmBytes, INFO.method).sealed;

/**
 * Buyer: seal the private data. Keep `secret` on the device only; it opens the answer.
 * `dataCtSha256` is what the escrow payment commits to.
 */
export function sealData(teePubHex, dataObj) {
  const { sealed, secret } = seal(teePubHex, enc.encode(JSON.stringify(dataObj)), INFO.data);
  return { sealed, secret, dataCtSha256: sha256Hex(secret.ct) };
}

/** Buyer: open the runner answer. Returns { method_sha256, manifest_sha256, answer, report }. */
export function openAnswer(secret, out) {
  if (!out.ok) throw new Error(`runner error: ${out.error}`);
  if (out.tee_pubkey !== toHex(secret.tpk)) throw new Error("answer came from a different TEE key");
  if (out.data_ct_sha256 !== sha256Hex(secret.ct)) throw new Error("answer is for a different request");
  const key = derive(secret.shared, secret.epk, secret.tpk, INFO.answer);
  const pt = chacha20poly1305(key, fromB64(out.nonce)).decrypt(fromB64(out.ct));
  return JSON.parse(dec.decode(pt).trimEnd());
}

/** Anyone: check the public completion record signed inside the TEE. */
export function verifyCompletion(out, expectedPubkeyHex) {
  const sigOk = ed25519.verify(fromHex(out.completion_sig), enc.encode(COMPLETION_PREFIX + out.completion), fromHex(out.completion_pubkey));
  return { sigOk, keyOk: !expectedPubkeyHex || out.completion_pubkey === expectedPubkeyHex, record: JSON.parse(out.completion) };
}

/**
 * Buyer device recheck for the portfolio method (see RANCANGAN_PRODUK.md section 55).
 * Returns { passed, checks: [{ id, ok, message }], unverifiable }. Messages are ready to show.
 */
export function recheckPortfolio(data, answer) {
  const fmt = (x) => Number(x).toFixed(2);
  const checks = [];
  const add = (id, ok, message) => checks.push({ id, ok, message });
  if (answer.status === "infeasible") {
    add("status", true, "The method found no trade that meets every limit. Kalis cannot confirm this on your device, so treat it as the method's claim.");
    return { passed: true, checks, unverifiable: ["infeasible"] };
  }
  if (answer.status !== "feasible" || !Array.isArray(answer.delta)) {
    add("status", false, "The method did not return a usable answer.");
    return { passed: false, checks, unverifiable: [] };
  }
  const d = answer.delta, n = data.holdings.length;
  if (d.length !== n || !d.every(Number.isInteger)) {
    add("shape", false, `The answer lists ${d.length} trades for ${n} assets, or uses partial units.`);
    return { passed: false, checks, unverifiable: [] };
  }
  const name = (i) => `Asset ${String.fromCharCode(65 + i)}`;
  const cost = d.reduce((s, x, i) => s + Math.abs(x) * data.prices[i] * data.fee_rates[i] + (x ? data.fixed_fees[i] : 0), 0);
  const values = data.holdings.map((h, i) => (h + d[i]) * data.prices[i]);
  const cash = data.cash - d.reduce((s, x, i) => s + x * data.prices[i], 0) - cost;
  const nav = values.reduce((a, b) => a + b, 0) + cash;
  const eps = 1e-6;
  d.forEach((x, i) => {
    if (x < -data.holdings[i]) add(`no_short_${i}`, false, `${name(i)} would sell ${-x} units but you only hold ${data.holdings[i]}.`);
    if (x > data.buy_limit) add(`buy_limit_${i}`, false, `${name(i)} would buy ${x} units, above your limit of ${data.buy_limit}.`);
    if (x < 0 && !data.allow_sell) add(`no_sell_${i}`, false, `${name(i)} would be sold, but you did not allow selling.`);
  });
  const cashOk = cash >= data.reserve - eps;
  add("cash_minimum", cashOk, cashOk ? `Cash after the trades is ${fmt(cash)}, at or above your minimum of ${fmt(data.reserve)}.` : `Cash after the trades would be ${fmt(cash)}, below your minimum of ${fmt(data.reserve)}.`);
  values.forEach((v, i) => {
    const share = v / nav, ok = share >= data.lower[i] - eps && share <= data.upper[i] + eps;
    const range = `${data.lower[i] * 100}% to ${data.upper[i] * 100}%`;
    add(`share_${i}`, ok, ok ? `${name(i)} ends at ${(share * 100).toFixed(1)}% of the portfolio, inside your ${range} range.` : `${name(i)} would end at ${(share * 100).toFixed(1)}% of the portfolio, outside your ${range} range.`);
  });
  const sector = (values[0] + values[1]) / nav, sectorOk = sector <= data.sector_cap + eps;
  add("sector_cap", sectorOk, sectorOk ? `Assets A and B together end at ${(sector * 100).toFixed(1)}%, within your ${data.sector_cap * 100}% cap.` : `Assets A and B together would end at ${(sector * 100).toFixed(1)}%, above your ${data.sector_cap * 100}% cap.`);
  const costOk = Math.abs(cost - answer.cost) < 1e-6;
  add("cost_matches", costOk, costOk ? `The stated cost of ${fmt(answer.cost)} matches the cost your device calculated.` : `The method says the cost is ${fmt(answer.cost)}, but your device calculates ${fmt(cost)}.`);
  return { passed: checks.every((c) => c.ok), checks, unverifiable: ["cheapest"] };
}

/**
 * One status per run for the UI (section 55): "safe", "attention" or "do_not_use".
 * `chain` is { method_sha256, manifest_sha256, runner_hash } of the version that was paid for.
 */
/** What the buyer is told about a method's kind before paying. `manifest.kind` is "wasm" (default) or "prompt". */
export function methodKind(manifest) {
  const kind = manifest?.kind === "prompt" ? "prompt" : "wasm";
  const usesAi = (manifest?.ai?.allowed || []).length > 0;
  if (kind === "prompt") return {
    kind, label: "Prompt for an AI model", uses_ai: true,
    buyer_note: "The seller sold a prompt. A private AI model follows it on your data, so the same data can give a different answer, and the runner cannot prove the model followed every rule. Check the numbers yourself.",
  };
  return {
    kind, label: usesAi ? "Program (WASM) that also asks an AI model" : "Program (WASM)", uses_ai: usesAi,
    buyer_note: usesAi
      ? "The seller sold a program. It runs the same steps every time and may ask the private AI models listed below for parts of the work."
      : "The seller sold a program. It runs the same steps every time and uses no AI model.",
  };
}

/** Shown on the seller form when the seller picks "prompt". */
export const PROMPT_SELLER_WARNING = "A prompt can leak. A buyer can hide text in their data that asks the model to repeat your prompt. Kalis tells the model never to reveal it and withholds any answer that repeats 8 or more words of your prompt in a row, but a model can still paraphrase it. Sell a prompt only if you accept that risk.";

/**
 * One status per run: "safe", "attention" or "do_not_use".
 * `checks` is the runChecks() result for manifest v5 methods; `recheck` is the legacy recheckPortfolio() result.
 */
export function runVerdict({ opened, recheck, checks, completion, attestation, chain }) {
  const reasons = [];
  for (const c of opened.report.ai_calls || []) if (!c.ok || c.proof?.signature_valid !== true) reasons.push(`An AI call was refused or not signed by an attested model${c.error ? ` (${c.error})` : ""}.`);
  if (!completion.sigOk) reasons.push("The completion record is not signed by the Kalis runner.");
  if (!opened.report.all_ok) reasons.push("Not every stage of the run succeeded.");
  if (opened.method_sha256 !== chain.method_sha256) reasons.push("The method that ran is not the version you paid for.");
  if (opened.manifest_sha256 !== chain.manifest_sha256) reasons.push("The manifest that ran is not the one published for this version.");
  if (attestation && !attestation.executed_build_ok) reasons.push("The chip attestation names a different runner build.");
  if (attestation && (!attestation.input_hash_ok || !attestation.output_hash_ok)) reasons.push("The chip attestation does not match what was sent and received.");
  if (recheck && !recheck.passed) for (const c of recheck.checks.filter((c) => !c.ok)) reasons.push(c.message);
  if (checks) for (const c of checks.results.filter((c) => c.status === "fail")) reasons.push(c.message);
  if (reasons.length) return { status: "do_not_use", reasons };
  const attention = [];
  if (checks?.has_cannot_check) for (const c of checks.results.filter((c) => c.status === "cannot_check")) attention.push(`${c.description}: ${c.message}`);
  if (checks?.no_checks) attention.push("This method declares no checks your device can run, so the answer is not checked on your device.");
  if (checks?.unverifiable?.length) attention.push(`The method's result "${checks.unverifiable.join(", ")}" cannot be checked on your device. Treat it as the method's claim.`);
  if (opened.report.kind === "prompt") return { status: "attention", reasons: ["This answer was written by an AI model following the seller's prompt. Every stage succeeded and the model was attested, but nothing checked that the model followed the seller's rules. Your own checks cover only your limits.", ...attention] };
  if (attention.length) return { status: "attention", reasons: attention };
  if (recheck && recheck.unverifiable.includes("infeasible")) return { status: "attention", reasons: ["The method says no trade meets every limit. This cannot be checked on your device."] };
  return { status: "safe", reasons: [] };
}
