// Local test of the three Web3 trading consulting methods on the native runner.
// For each method: the sample runs with every stage ok, the buyer checks pass on this device,
// and a tampered answer makes at least one check fail. No network is used.
// Usage: node client/trading-methods-local-test.mjs [native runner]
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { sealMethod, sealData, openAnswer, verifyCompletion } from "./kalis.mjs";
import { runChecks } from "../../backend/src/checks.js";

const bin = process.argv[2] || new URL("../target/release/kalis-runner", import.meta.url).pathname;
const env = { ...process.env, PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex") };
const call = (o) => JSON.parse(execFileSync(bin, { input: JSON.stringify(o), env, maxBuffer: 1 << 26 }).toString());
const { tee_pubkey } = call({ cmd: "pubkey" });
const M = (id) => new URL(`../../methods/${id}/`, import.meta.url);
const read = (id, f) => fs.readFileSync(new URL(f, M(id)));
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); };
const summary = (c) => `${c.counts.pass} pass, ${c.counts.fail} fail, ${c.counts.cannot_check} cannot check, ${c.counts.not_applicable} n/a${c.results.filter((r) => r.status === "fail").map((r) => ` [fail ${r.id}]`).join("")}`;
const input = (id, f) => { const { _note, ...d } = JSON.parse(read(id, `fixtures/${f}`)); return d; };

function run(id, data) {
  const manifestText = read(id, "manifest.json").toString();
  const manifest = JSON.parse(manifestText);
  const { sealed, secret } = sealData(tee_pubkey, data);
  const out = call({ cmd: "run", run_id: `t-${id}-${Date.now()}`.slice(0, 64), manifest: manifestText, method: sealMethod(tee_pubkey, read(id, "method.wasm")), data: sealed });
  if (!out.ok) throw new Error(`${id}: ${out.error}`);
  const opened = openAnswer(secret, out);
  return { manifest, opened, completion: verifyCompletion(out), checks: runChecks(manifest, data, opened.answer) };
}

// Each tamper is what a compromised method or relay would do: let a blocked order or token through.
const TAMPER = {
  "perp-risk-limit-fit": (a) => ({ ...a, verdict: "ALLOW", decisions: a.decisions.map((d) => ({ ...d, verdict: "ALLOW" })) }),
  "strategy-robustness-audit": (a) => ({ ...a, verdict: "robust" }),
  "large-swap-split": (a) => ({ ...a, allocations: [...a.allocations, { step: 9, venue: "KuCoin NEAR/USDT order book", amount: 1000, received_quote: 3190, min_received_quote: 3170 }] }),
  "token-scam-screen": (a) => ({ ...a, verdict: "ALLOW", max_amount_usd: 25000 }),
};
const CASES = { "perp-risk-limit-fit": ["sample-input.json"], "strategy-robustness-audit": ["sample-input.json"], "large-swap-split": ["sample-input.json"], "token-scam-screen": ["sample-input.json", "attack-input.json"] };
const EXPECT = { "perp-risk-limit-fit/sample-input.json": "BLOCK", "large-swap-split/sample-input.json": "WARN", "token-scam-screen/sample-input.json": "WARN", "token-scam-screen/attack-input.json": "BLOCK", "strategy-robustness-audit/sample-input.json": "fragile" };
const results = {};
for (const [id, files] of Object.entries(CASES)) {
  for (const f of files) {
    const data = input(id, f);
    const r = run(id, data);
    check(`${id} ${f}: every stage ok and completion signed`, r.opened.report.all_ok && r.completion.sigOk && r.completion.record.all_ok, `fuel ${r.opened.report.method_fuel_used}`);
    check(`${id} ${f}: buyer checks pass on this device`, r.checks.passed && !r.checks.has_cannot_check, summary(r.checks));
    const status = r.checks.answer[r.manifest.outputs.status_field];
    console.log(`INFO  ${id} ${f}: ${r.manifest.outputs.status_field} = ${status}`);
    check(`${id} ${f}: verdict is ${EXPECT[`${id}/${f}`]}`, status === EXPECT[`${id}/${f}`], String(status));
    results[`${id}/${f}`] = { status, checks: r.checks.results.map(({ id: cid, status: s }) => ({ id: cid, status: s })) };
    if (f === (id === "token-scam-screen" ? "attack-input.json" : "sample-input.json")) {
      const tc = runChecks(r.manifest, data, TAMPER[id](r.checks.answer));
      check(`${id}: a tampered answer fails a buyer check`, tc.counts.fail > 0, summary(tc));
    }
  }
}
fs.writeFileSync(new URL("../trading-methods-local-test-latest.json", import.meta.url), JSON.stringify({ at: new Date().toISOString(), pass, fail, results }, null, 2));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
