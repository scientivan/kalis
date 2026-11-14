// Local test of the five new marketplace methods on the native runner v0.5.
// Prompt methods call the real NEAR AI Cloud: set NEAR_AI_API_KEY (from Product/.env NEAR_API_KEY).
// For each method: the sample input runs with every stage ok and the buyer checks are evaluated;
// a hard input gives status infeasible (wasm, token plan) and a tampered answer makes the checks fail.
// Usage: node client/methods-local-test.mjs [native runner] [method_id ...]
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { sealMethod, sealData, openAnswer, verifyCompletion } from "./kalis.mjs";
import { runChecks } from "../../backend/src/checks.js";

const args = process.argv.slice(2);
const bin = args[0] && !args[0].includes("-") ? args.shift() : new URL("../target/release/kalis-runner", import.meta.url).pathname;
const only = args;
const env = { ...process.env, PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex") };
const call = (o) => JSON.parse(execFileSync(bin, { input: JSON.stringify(o), env, maxBuffer: 1 << 26 }).toString());
const { tee_pubkey } = call({ cmd: "pubkey" });
const M = (id) => new URL(`../../methods/${id}/`, import.meta.url);
const read = (id, f) => fs.readFileSync(new URL(f, M(id)));
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); };
const summary = (c) => `${c.counts.pass} pass, ${c.counts.fail} fail, ${c.counts.cannot_check} cannot check, ${c.counts.not_applicable} n/a${c.results.filter((r) => r.status === "fail").map((r) => ` [fail ${r.id}]`).join("")}`;

function run(id, data) {
  const manifestText = read(id, "manifest.json").toString();
  const manifest = JSON.parse(manifestText);
  const method = manifest.kind === "prompt" ? read(id, "seller-private/prompt.txt") : read(id, "method.wasm");
  const { sealed, secret } = sealData(tee_pubkey, data);
  const out = call({ cmd: "run", run_id: `m-${id}-${Date.now()}`.slice(0, 64), manifest: manifestText, method: sealMethod(tee_pubkey, method), data: sealed });
  if (!out.ok) throw new Error(`${id}: ${out.error}`);
  const opened = openAnswer(secret, out);
  return { manifest, opened, completion: verifyCompletion(out), checks: runChecks(manifest, data, opened.answer) };
}

// Tampering an answer must make at least one check fail. Each function returns a changed copy.
const TAMPER = {
  "defi-liquidation-guard": (a) => ({ ...a, health_factor_after: a.health_factor_after + 0.4 }),
  "cash-runway-13w": (a) => ({ ...a, payments: a.payments.slice(1) }),
  "supplier-concession-plan": (a) => ({ ...a, final_terms: { ...a.final_terms, unit_price: 405000 } }),
  "token-unlock-sell-plan": (a) => ({ ...a, schedule: (a.schedule || []).slice(1) }),
  "term-sheet-dilution": (a) => ({ ...a, ownership: a.ownership.map((o, i) => (i === 0 ? { ...o, pct: o.pct + 0.05 } : o)) }),
};
const INFEASIBLE = { "defi-liquidation-guard": "status", "cash-runway-13w": "status", "token-unlock-sell-plan": "plan_status" };
const results = {};

for (const id of ["defi-liquidation-guard", "cash-runway-13w", "supplier-concession-plan", "token-unlock-sell-plan", "term-sheet-dilution"].filter((x) => !only.length || only.includes(x))) {
  const sample = JSON.parse(read(id, "fixtures/sample-input.json"));
  const r = run(id, sample);
  const kind = r.manifest.kind;
  check(`${id}: sample runs with every stage ok`, r.opened.report.all_ok && r.completion.sigOk && r.completion.record.all_ok, kind === "prompt" ? `${r.opened.report.ai_calls?.length} AI call, signed ${r.opened.report.ai_calls?.[0]?.proof?.signature_valid}` : `fuel ${r.opened.report.method_fuel_used}`);
  const parsed = r.checks.answer;
  check(`${id}: answer parses into the declared outputs`, !parsed?._parse_error, parsed?._parse_error || "");
  if (kind === "wasm") check(`${id}: buyer checks pass on the sample`, r.checks.passed && !r.checks.has_cannot_check, summary(r.checks));
  else console.log(`INFO  ${id}: buyer checks on the AI answer: ${summary(r.checks)}`);
  results[id] = { kind, all_ok: r.opened.report.all_ok, checks: r.checks.results.map(({ id: cid, status }) => ({ id: cid, status })), answer: parsed };

  const t = TAMPER[id](parsed);
  const tc = runChecks(r.manifest, sample, kind === "prompt" ? { status: "ok", text: JSON.stringify(t) } : t);
  check(`${id}: a tampered answer fails a buyer check`, tc.counts.fail > 0, summary(tc));

  if (INFEASIBLE[id]) {
    const hard = JSON.parse(read(id, "fixtures/infeasible-input.json"));
    const h = run(id, hard);
    const st = h.checks.answer?.[INFEASIBLE[id]];
    check(`${id}: a hard input is reported infeasible, not forced`, h.opened.report.all_ok && st === "infeasible", (h.checks.answer?.reason || "").slice(0, 140));
    results[id].infeasible = { status: st, reason: h.checks.answer?.reason, checks: summary(h.checks) };
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
fs.writeFileSync(new URL("../methods-local-test-latest.json", import.meta.url), JSON.stringify({ at: new Date().toISOString(), pass, fail, results }, null, 2));
process.exit(fail ? 1 : 0);
