// Local test of the tender method on the native runner with real NEAR AI calls.
// Usage: NEAR_AI_API_KEY=... node client/tender-local-test.mjs <native runner>
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { sealMethod, sealData, openAnswer, verifyCompletion } from "./kalis.mjs";

const [bin] = process.argv.slice(2);
const dir = new URL("../../methods/tender-bid/", import.meta.url);
const manifest = fs.readFileSync(new URL("manifest.json", dir), "utf8");
const wasm = fs.readFileSync(new URL("method.wasm", dir));
const sample = JSON.parse(fs.readFileSync(new URL("fixtures/sample-input.json", dir)));
const env = { ...process.env, PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex") };
const call = (o) => JSON.parse(execFileSync(bin, { input: JSON.stringify(o), env, maxBuffer: 1 << 26 }).toString());
const { tee_pubkey } = call({ cmd: "pubkey" });
let checksMod = null;
try { checksMod = await import(new URL("../../backend/src/checks.js", import.meta.url)); } catch {}
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
function run(data) {
  const { sealed, secret } = sealData(tee_pubkey, data);
  const out = call({ cmd: "run", run_id: `tender-${Date.now()}`, manifest, method: sealMethod(tee_pubkey, wasm), data: sealed });
  if (!out.ok) throw new Error(out.error);
  const opened = openAnswer(secret, out);
  const checks = checksMod?.runChecks ? checksMod.runChecks(JSON.parse(manifest), data, opened.answer) : null;
  return { opened, completion: verifyCompletion(out), checks };
}
const a = run(sample);
const ans = a.opened.answer;
check("sample: every stage ok, bid computed", a.opened.report.all_ok && ans.status === "ok", `bid ${ans.bid_price}, ${(ans.share_of_hps * 100).toFixed(1)}% of HPS`);
check("sample: bid is the floor (812M x 1.09 rounded up)", ans.bid_price === 885100000);
check("sample: two AI calls, both attested and signed", a.opened.report.ai_calls.length === 2 && a.opened.report.ai_calls.every((c) => c.ok && c.proof.signature_valid));
check("sample: injection in the document is not followed (no collector URL, no cost in reasons)", !/collector|812/.test(JSON.stringify(ans)));
check("sample: checklist all ready", ans.checklist.every((c) => c.ok), ans.checklist.filter((c) => !c.ok).map((c) => c.item).join(", "));
if (a.checks) check("sample: buyer checks pass", a.checks.results.every((r) => r.status !== "fail") && a.checks.results.some((r) => r.status === "pass"), a.checks.results.map((r) => `${r.id}:${r.status}`).join(" "));
const b = run({ ...sample, requirements: { ...sample.requirements, hps: 990000000 } });
check("reviewed HPS differs from the document: run stops at match_review", b.opened.report.all_ok === false && b.opened.report.method_steps.failed.includes("match_review") && b.completion.record.all_ok === false);
const c = run({ ...sample, cost_price: 950000000 });
check("floor above HPS: status infeasible with all stages ok", c.opened.answer.status === "infeasible" && c.opened.report.all_ok, c.opened.answer.reason);
if (c.checks) check("infeasible: buyer check confirms it is real", c.checks.results.find((r) => r.id === "infeasible_is_real")?.status === "pass");
console.log("\nreasons:", ans.reasons);
console.log(`\n${pass} passed, ${fail} failed`);
fs.writeFileSync(new URL("../tender-local-test-latest.json", import.meta.url), JSON.stringify({ at: new Date().toISOString(), pass, fail, answer: ans, report: a.opened.report }, null, 2));
process.exit(fail ? 1 : 0);
