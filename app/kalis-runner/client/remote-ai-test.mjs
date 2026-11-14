// Runner v0.5 on OutLayer testnet: prompt method and a wasm method that calls AI.
// Proves the NEAR AI call happens inside the OutLayer TEE (network allowlist cloud-api.near.ai)
// and that OutLayer sees only ciphertext. Usage: node client/remote-ai-test.mjs <expected runner sha256>
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import { sealMethod, sealData, openAnswer, verifyCompletion } from "./kalis.mjs";

const [runnerSha] = process.argv.slice(2);
const API = "https://testnet-api.outlayer.ai";
const PK = JSON.parse(fs.readFileSync(`${os.homedir()}/.outlayer/testnet/payment-keys.json`, "utf8"))["testnet:scientivan.testnet:payment-key:1"];
const headers = { "X-Payment-Key": PK, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(input) {
  const body = { input, secrets_ref: { profile: "default", account_id: "scientivan.testnet" }, async: true };
  const r = await (await fetch(`${API}/call/scientivan.testnet/kalis-runner`, { method: "POST", headers, body: JSON.stringify(body) })).json();
  if (!r.call_id) throw new Error(JSON.stringify(r));
  for (let i = 0; i < 60; i++) {
    const s = await (await fetch(`${API}/calls/${r.call_id}`, { headers })).json();
    if (!["pending", "running", "queued"].includes(s.status)) return s;
    await sleep(6000);
  }
  throw new Error("timeout");
}
async function attestation(id) {
  for (let i = 0; i < 10; i++) { const t = await (await fetch(`${API}/attestations/by-call/${id}`)).text(); if (t) return JSON.parse(t); await sleep(5000); }
  return null;
}

const pk = await call({ cmd: "pubkey" });
console.log("pubkey", JSON.stringify(pk.output));
const tee = pk.output.tee_pubkey;
const dir = new URL("../../methods/salary-counteroffer/", import.meta.url);
const runs = [
  { name: "prompt method", manifest: fs.readFileSync(new URL("manifest.json", dir), "utf8"), method: fs.readFileSync(new URL("seller-private/prompt.txt", dir)),
    data: { role: "Backend engineer", offer_salary: 30000000, currency: "IDR per month", walk_away: 28000000, competing_offer: 31000000, market_median: 32000000, offer_has: { remote_days: 1, learning_budget: 0, leave_days: 12 } } },
  { name: "wasm method calling AI", manifest: JSON.stringify({ kind: "wasm", ai: { allowed: ["deepseek-ai/DeepSeek-V4.1-Flash-1017"] }, steps: [{ id: "ask_ai" }] }),
    method: fs.readFileSync(new URL("../../guest-ai-test/target/wasm32-unknown-unknown/release/guest_ai_test.wasm", import.meta.url)),
    data: { question: "Reply with the single word OK." } },
];
const results = [];
for (const r of runs) {
  const { sealed, secret } = sealData(tee, r.data);
  const input = { cmd: "run", run_id: `ai-remote-${Date.now()}`, manifest: r.manifest, method: sealMethod(tee, r.method), data: sealed };
  const res = await call(input);
  if (res.status !== "completed" || !res.output?.ok) { console.log(r.name, "FAILED", JSON.stringify(res).slice(0, 600)); results.push({ name: r.name, failed: res }); continue; }
  const opened = openAnswer(secret, res.output);
  const wire = JSON.stringify({ input, output: res.output });
  const att = await attestation(res.call_id);
  const row = {
    name: r.name, call_id: res.call_id, instructions: res.instructions, time_ms: res.time_ms,
    plaintext_seen_by_outlayer: ["28000000", "walk_away", "Take the highest", "single word OK"].filter((w) => wire.includes(w)),
    report_all_ok: opened.report.all_ok, answer: opened.answer,
    ai_calls: opened.report.ai_calls, completion_signature_valid: verifyCompletion(res.output).sigOk,
    executed_build_ok: att ? att.executed_wasm_sha256 === runnerSha : "no attestation yet",
  };
  console.log(JSON.stringify(row, null, 1).slice(0, 1500));
  results.push(row);
}
fs.writeFileSync(new URL("../remote-ai-test-latest.json", import.meta.url), JSON.stringify({ at: new Date().toISOString(), runner: runnerSha, results }, null, 2));
