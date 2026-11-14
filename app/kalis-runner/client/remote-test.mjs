// End-to-end test of kalis-runner on OutLayer testnet over HTTPS.
// For each case: seller-sealed method + buyer-sealed data -> runner -> buyer opens,
// reads the execution report, rechecks the answer on the device, and matches the
// TEE attestation's input/output hashes and executed build with what was sent and received.
// Usage: node client/remote-test.mjs <tee_pubkey_hex> <guest wasm> <expected runner sha256> <caseId> [caseId...]
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import { sealMethod, sealData, openAnswer, recheckPortfolio, verifyCompletion } from "./kalis.mjs";

const [teePub, guestPath, runnerSha, ...ids] = process.argv.slice(2);
const API = "https://testnet-api.outlayer.ai";
const PK = JSON.parse(fs.readFileSync(`${os.homedir()}/.outlayer/testnet/payment-keys.json`, "utf8"))["testnet:scientivan.testnet:payment-key:1"];
const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
const manifest = fs.readFileSync(new URL("../../methods/portfolio-rebalance/manifest.json", import.meta.url), "utf8");
const guest = fs.readFileSync(guestPath);
const method = sealMethod(teePub, guest);
const headers = { "X-Payment-Key": PK, "Content-Type": "application/json" };
const sha = (x) => crypto.createHash("sha256").update(x).digest("hex");

// JSON with object keys sorted, as Rust serde_json::Value prints by default.
const sorted = (v) => Array.isArray(v) ? v.map(sorted) : v && typeof v === "object"
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted(v[k])])) : v;

async function call(input) {
  const body = { input, secrets_ref: { profile: "default", account_id: "scientivan.testnet" }, async: true };
  const r = await (await fetch(`${API}/call/scientivan.testnet/kalis-runner`, { method: "POST", headers, body: JSON.stringify(body) })).json();
  if (!r.call_id) throw new Error(JSON.stringify(r));
  for (let i = 0; i < 60; i++) {
    const s = await (await fetch(`${API}/calls/${r.call_id}`, { headers })).json();
    if (!["pending", "running", "queued"].includes(s.status)) return s;
    await new Promise((res) => setTimeout(res, 6000));
  }
  throw new Error("timeout");
}

async function attestation(callId) {
  for (let i = 0; i < 10; i++) {
    const t = await (await fetch(`${API}/attestations/by-call/${callId}`)).text();
    if (t) return JSON.parse(t);
    await new Promise((res) => setTimeout(res, 5000));
  }
  return null;
}

console.log(`method sha256 ${sha(guest)}, manifest sha256 ${sha(manifest)}`);
for (const id of ids) {
  const { id: _, ...data } = cases.find((c) => c.id === id);
  const { sealed, secret } = sealData(teePub, data);
  const input = { cmd: "run", run_id: `${process.env.RUN_PREFIX || "test"}-${id}`, manifest, method, data: sealed };
  const res = await call(input);
  if (res.status !== "completed") { console.log(id, "FAILED", JSON.stringify(res).slice(0, 400)); continue; }
  const opened = openAnswer(secret, res.output);
  const recheck = recheckPortfolio(data, opened.answer);
  const wire = JSON.stringify({ input, output: res.output });
  const leak = ["holdings", "fee_rates", "delta", JSON.stringify(data.holdings)].filter((w) => wire.includes(w));

  const att = await attestation(res.call_id);
  const inCandidates = { sent: JSON.stringify(input), sorted: JSON.stringify(sorted(input)) };
  const outText = JSON.stringify(sorted(res.output));
  const outCandidates = { sorted: outText, sorted_newline: outText + "\n", as_received: JSON.stringify(res.output) };
  const inMatch = att && Object.entries(inCandidates).find(([, v]) => sha(v) === att.input_hash)?.[0];
  const outMatch = att && Object.entries(outCandidates).find(([, v]) => sha(v) === att.output_hash)?.[0];

  console.log(JSON.stringify({
    id, call_id: res.call_id, instructions: res.instructions, time_ms: res.time_ms,
    words_seen_by_outlayer: leak,
    answer: opened.answer,
    report_all_ok: opened.report.all_ok,
    completion: res.output.completion, completion_signature_valid: verifyCompletion(res.output).sigOk, completion_pubkey: res.output.completion_pubkey,
    failed_stages: opened.report.runner_stages.filter((s) => !s.ok).map((s) => s.id),
    method_steps_missing: opened.report.method_steps.missing,
    recheck_passed: recheck.passed,
    method_hash_ok: opened.method_sha256 === sha(guest),
    manifest_hash_ok: opened.manifest_sha256 === sha(manifest),
    attestation: att ? {
      executed_build_ok: att.executed_wasm_sha256 === runnerSha,
      input_hash_matches: inMatch || "no match",
      output_hash_matches: outMatch || "no match",
      tdx_quote_chars: (att.tdx_quote || "").length,
    } : "not available",
  }));
}
