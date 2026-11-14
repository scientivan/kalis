// One OutLayer testnet smoke per new method on the deployed runner v0.5 (HTTPS path).
// Checks: every stage ok, signed completion, attested build, buyer checks, and no plaintext seen by OutLayer.
// Usage: node client/methods-remote-test.mjs <expected runner sha256> [method_id ...]
import fs from "node:fs";
import os from "node:os";
import { sealMethod, sealData, openAnswer, verifyCompletion } from "./kalis.mjs";
import { runChecks } from "../../backend/src/checks.js";

const [runnerSha, ...only] = process.argv.slice(2);
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
const PLAINTEXT = { "defi-liquidation-guard": ["26500", "stable_available"], "cash-runway-13w": ["420000000", "Gula Prima"], "supplier-concession-plan": ["398000", "walk_away"], "token-unlock-sell-plan": ["7000000", "tokens_to_sell"], "term-sheet-dilution": ["4200000", "founders_floor_pct"] };
const tee = (await call({ cmd: "pubkey" })).output.tee_pubkey;
const out = [];
for (const id of Object.keys(PLAINTEXT).filter((x) => !only.length || only.includes(x))) {
  const dir = new URL(`../../methods/${id}/`, import.meta.url);
  const manifestText = fs.readFileSync(new URL("manifest.json", dir), "utf8");
  const manifest = JSON.parse(manifestText);
  const method = fs.readFileSync(new URL(manifest.kind === "prompt" ? "seller-private/prompt.txt" : "method.wasm", dir));
  const data = JSON.parse(fs.readFileSync(new URL("fixtures/sample-input.json", dir)));
  const { sealed, secret } = sealData(tee, data);
  const input = { cmd: "run", run_id: `mr-${id}`.slice(0, 40) + `-${Date.now().toString(36)}`, manifest: manifestText, method: sealMethod(tee, method), data: sealed };
  const res = await call(input);
  if (res.status !== "completed" || !res.output?.ok) { console.log(id, "FAILED", JSON.stringify(res).slice(0, 400)); out.push({ id, failed: true }); continue; }
  const opened = openAnswer(secret, res.output);
  const checks = runChecks(manifest, data, opened.answer);
  const wire = JSON.stringify({ input, output: res.output });
  const att = await attestation(res.call_id);
  const row = { id, call_id: res.call_id, time_ms: res.time_ms, all_ok: opened.report.all_ok, completion_signed: verifyCompletion(res.output).sigOk,
    executed_build_ok: att ? att.executed_wasm_sha256 === runnerSha : "no attestation", plaintext_seen: PLAINTEXT[id].filter((w) => wire.includes(w)),
    checks: checks.counts, ai_signed: (opened.report.ai_calls || []).map((c) => c.proof?.signature_valid) };
  console.log(JSON.stringify(row));
  out.push(row);
}
fs.writeFileSync(new URL("../methods-remote-test-latest.json", import.meta.url), JSON.stringify({ at: new Date().toISOString(), runner: runnerSha, out }, null, 2));
