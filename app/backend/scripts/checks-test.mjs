// Tests for manifest v5 buyer checks (src/checks.js) and the manifest validator.
// 1. Portfolio v5 checks agree with the hand-written recheckPortfolio on the 12 reference cases,
//    the tampered answer and many random trade lists (overall pass/fail and failing categories).
// 2. Unit cases: cannot_check, not_applicable, tolerance, json_in_text, digits.
// 3. Validator accepts the v5 manifests and rejects broken ones.
// Usage: node scripts/checks-test.mjs [base url to also test POST /api/manifests/validate]
import fs from "node:fs";
import { runChecks, recheckPortfolio, runVerdict } from "../src/kalis-crypto.js";
import { validateManifest } from "../src/manifest-validate.js";

const BASE = process.argv[2];
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); };
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");

const pf = JSON.parse(read("../../methods/portfolio-rebalance/manifest-v5.json"));
const cases = JSON.parse(read("../../../validation/portfolio-method-02/cases.json"));
const results = JSON.parse(read("../../../validation/portfolio-method-02/method-results.json"));

// Map recheckPortfolio check ids to v5 check ids.
const legacyCat = (id) => id.replace(/_\d+$/, "").replace(/^share$/, "shares").replace(/^no_short$/, "no_short");
function agree(data, answer) {
  const legacy = recheckPortfolio(data, answer);
  const v5 = runChecks(pf, data, answer);
  const lf = new Set(legacy.checks.filter((c) => !c.ok).map((c) => legacyCat(c.id)));
  const vf = new Set(v5.results.filter((c) => c.status === "fail" || c.status === "cannot_check").map((c) => c.id));
  // recheckPortfolio stops at a bad shape or status; v5 then also reports cannot_check on later checks.
  const early = lf.has("shape") || lf.has("status");
  const same = legacy.passed === v5.passed && (early ? [...lf].every((x) => vf.has(x)) : [...lf].every((x) => vf.has(x)) && [...vf].every((x) => lf.has(x)));
  return { same, legacy, v5, lf: [...lf], vf: [...vf] };
}

// 1a. the 12 reference answers
for (const r of results) {
  const { id: _, ...data } = cases.find((c) => c.id === r.id);
  const answer = r.output.status === "feasible" ? { status: "feasible", delta: r.output.delta, cost: r.output.audit.cost } : { status: "infeasible" };
  const a = agree(data, answer);
  const unv = a.v5.unverifiable.join(",");
  check(`portfolio ${r.id} v5 checks match recheckPortfolio`, a.same && a.v5.passed, `${answer.status}${unv ? `, unverifiable ${unv}` : ""}`);
}
// 1b. the tampered answer from client/local-test.mjs
const c03 = (({ id, ...d }) => d)(cases.find((c) => c.id === "C03"));
const tam = agree(c03, { status: "feasible", delta: [-6, 0, 5], cost: 0.18 });
check("tampered answer (sell 6 A, buy 5 C) fails in both", tam.same && !tam.v5.passed, `fails: ${tam.vf.join(", ")}`);
const msg = tam.v5.results.find((c) => c.id === "cost_matches").message;
check("failure messages carry the device-computed numbers", /0\.18/.test(msg) && /0\.30/.test(msg), msg);
// 1c. random trade lists on every case
let rnd = 0, rndSame = 0, rndFails = 0;
let seed = 7;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
for (const c of cases) {
  const { id: _, ...data } = c;
  for (let k = 0; k < 120; k++) {
    const delta = k % 2 ? data.holdings.map((h) => Math.floor(rand() * (h + 8)) - h - 1) : data.holdings.map(() => Math.floor(rand() * 5) - 2);
    const realCost = delta.reduce((s, x, i) => s + Math.abs(x) * data.prices[i] * data.fee_rates[i] + (x ? data.fixed_fees[i] : 0), 0);
    const cost = rand() < 0.2 ? realCost + 0.5 : realCost;
    const a = agree(data, { status: "feasible", delta, cost });
    rnd++; if (a.same) rndSame++; if (!a.v5.passed) rndFails++;
    if (!a.same && rnd - rndSame <= 3) console.log("  mismatch", c.id, JSON.stringify(delta), "legacy", a.lf, "v5", a.vf);
  }
}
check("random trade lists: v5 and recheckPortfolio agree on every one", rndSame === rnd, `${rndSame}/${rnd} agree, ${rndFails} fail`);
const badShape = agree(c03, { status: "feasible", delta: [1.5, 0], cost: 0 });
check("partial units or wrong length fail in both", badShape.same && !badShape.v5.passed, badShape.vf.join(", "));
const noStatus = agree(c03, { cost: 1 });
check("answer without a status fails in both", noStatus.same && !noStatus.v5.passed);

// 2. unit cases
const unit = (checks, extra = {}) => ({ manifest_version: 5, buyer_checks: checks, ...extra });
let r = runChecks(unit([{ id: "x", rule: { ">=": [{ var: "answer.price" }, { var: "input.floor" }] }, message: "low" }]), { floor: 10 }, {});
check("missing value gives cannot_check, not pass or fail", r.results[0].status === "cannot_check" && r.passed && r.has_cannot_check, r.results[0].message);
r = runChecks(unit([{ id: "x", rule: { ">=": [{ var: "answer.price" }, 5] }, message: "low" }]), {}, { price: "a lot" });
check("a non-number gives cannot_check", r.results[0].status === "cannot_check");
r = runChecks(unit([{ id: "x", when: { "==": [{ var: "answer.status" }, "ok"] }, rule: false, message: "m" }]), {}, { status: "withheld" });
check("when false gives not_applicable", r.results[0].status === "not_applicable" && r.passed);
r = runChecks(unit([{ id: "x", rule: { ">=": [{ var: "answer.v" }, 1] }, tolerance: 0.001, message: "m" }]), {}, { v: 0.9995 });
check("tolerance relaxes >= by the stated amount", r.results[0].status === "pass");
r = runChecks(unit([{ id: "x", rule: { ">=": [{ var: "answer.v" }, 1] }, message: "m" }]), {}, { v: 0.9995 });
check("without tolerance the same value fails", r.results[0].status === "fail" && !r.passed);
r = runChecks(unit([{ id: "x", rule: { var: "answer.ok" }, message: "m" }]), {}, {});
check("checks never pass when a value is missing (no silent pass)", r.results[0].status === "cannot_check");
r = runChecks(unit([], {}), {}, {});
check("no checks is reported as no_checks, not as a pass of anything", r.no_checks && r.results.length === 0);
r = runChecks(unit([{ id: "x", rule: { eval: "1" }, message: "m" }]), {}, {});
check("unknown operators are refused (no eval)", r.results[0].status === "cannot_check" && /unknown operator/.test(r.results[0].message));

const sal = JSON.parse(read("../../methods/salary-counteroffer/manifest-v5.json"));
const offer = sal.inputs.sample;
// ryux-ignore RX-CD-02: fixture model answer in a test, not interface copy
const good = { status: "ok", text: '```json\n{"counter_salary":35200000,"signing_bonus":0,"non_salary_asks":["remote days","learning budget"],"reply":"I would like to propose IDR 35,200,000 per month.","why":"x"}\n```' };
r = runChecks(sal, offer, good);
check("json_in_text: prompt answer parsed and all salary checks pass", r.passed && r.counts.pass === 6, JSON.stringify(r.counts));
const leaky = { status: "ok", text: JSON.stringify({ counter_salary: 35200000, signing_bonus: 0, non_salary_asks: ["a", "b"], reply: "I could go as low as 28.000.000 if needed.", why: "x" }) };
r = runChecks(sal, offer, leaky);
check("salary: a reply that reveals the walk-away number fails", r.results.find((c) => c.id === "reply_hides_walk_away").status === "fail");
const near = { status: "ok", text: JSON.stringify({ counter_salary: 35200000, signing_bonus: 0, non_salary_asks: ["a", "b"], reply: "Budget 128,000,000 per year for the team.", why: "x" }) };
r = runChecks(sal, offer, near);
check("salary: 128,000,000 does not count as revealing 28,000,000", r.results.find((c) => c.id === "reply_hides_walk_away").status === "pass");
r = runChecks(sal, offer, { status: "ok", text: "Sorry, I cannot help with that." });
check("json_in_text: a non-JSON answer fails the format check and the rest cannot be checked", r.results[0].status === "fail" && r.has_cannot_check);
r = runChecks(sal, offer, { status: "withheld", reason: "the answer quoted the method text" });
check("withheld prompt answer is not reported as passing", !r.passed || r.has_cannot_check);

// verdict
const opened = { report: { all_ok: true, kind: "wasm", ai_calls: [] }, method_sha256: "a", manifest_sha256: "b" };
const ctx = { opened, completion: { sigOk: true }, attestation: { executed_build_ok: true, input_hash_ok: true, output_hash_ok: true }, chain: { method_sha256: "a", manifest_sha256: "b" } };
const goodC03 = { status: "feasible", delta: [-3, 0, 2], cost: 0.18 };
check("verdict: v5 checks all pass gives safe", runVerdict({ ...ctx, checks: runChecks(pf, c03, goodC03) }).status === "safe");
check("verdict: a failed check gives do_not_use", runVerdict({ ...ctx, checks: runChecks(pf, c03, { status: "feasible", delta: [-6, 0, 5], cost: 0.18 }) }).status === "do_not_use");
check("verdict: infeasible gives attention", runVerdict({ ...ctx, checks: runChecks(pf, c03, { status: "infeasible" }) }).status === "attention");
check("verdict: cannot_check gives attention", runVerdict({ ...ctx, checks: runChecks(unit([{ id: "x", rule: { var: "answer.q" }, message: "m" }]), {}, {}) }).status === "attention");
const promptCtx = { ...ctx, opened: { ...opened, report: { ...opened.report, kind: "prompt" } } };
check("verdict: prompt with all checks passing is still only attention", runVerdict({ ...promptCtx, checks: runChecks(sal, offer, good) }).status === "attention");

// 3. validator
for (const p of ["portfolio-rebalance/manifest-v5.json", "salary-counteroffer/manifest-v5.json"]) {
  const raw = read(`../../methods/${p}`);
  const v = validateManifest({ raw });
  check(`validator accepts ${p}`, v.ok, v.errors.map((e) => `${e.path}: ${e.message}`).join("; "));
}
const old = validateManifest({ raw: read("../../methods/portfolio-rebalance/manifest-v4.json") });
check("validator accepts a v4 manifest with a warning", old.ok && old.warnings.some((w) => w.path === "manifest_version"));
const bad = (mutate, re, name) => {
  const m = JSON.parse(JSON.stringify(sal)); mutate(m);
  const v = validateManifest({ manifest: m });
  check(`validator rejects ${name}`, !v.ok && v.errors.some((e) => re.test(`${e.path} ${e.message}`)), v.errors.map((e) => e.message).join("; ").slice(0, 140));
};
bad((m) => { m.ai.allowed = []; }, /prompt method must list/, "a prompt without a model");
bad((m) => { m.connectors = [{ id: "gmail_real", operations: ["read"] }]; }, /not served/, "an unknown connector");
bad((m) => { m.buyer_checks[1].rule = { ">=": [{ var: "answer.counter_salary" }, { var: "input.secret_floor" }] }; }, /input\.secret_floor/, "a check that reads an undeclared variable");
bad((m) => { m.dao_share_percent = 9; }, /dao_share_percent/, "a DAO share of 9%");
bad((m) => { m.ai.allowed = ["openai/gpt-5"]; }, /not a model this runner can attest/, "a model the runner cannot attest");
bad((m) => { m.kind = "python"; }, /kind/, "an unknown kind");
bad((m) => { delete m.listing.urgency; }, /listing\.urgency/, "a missing listing field");
bad((m) => { m.inputs.fields[0].source = "connector:sheets_mock.read_range"; }, /not declared in connectors/, "an input source from an undeclared connector");
bad((m) => { m.buyer_checks[0].rule = { eval: "x" }; }, /unknown operator/, "an unknown operator in a rule");

if (BASE) {
  const raw = read("../../methods/salary-counteroffer/manifest-v5.json");
  const r1 = await (await fetch(`${BASE}/api/manifests/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raw }) })).json();
  const { createHash } = await import("node:crypto");
  check("POST /api/manifests/validate returns ok and the hash of the exact bytes", r1.ok && r1.manifest_hash === createHash("sha256").update(raw).digest("hex"), r1.manifest_hash);
  const r2 = await (await fetch(`${BASE}/api/manifests/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ manifest: { ...JSON.parse(raw), dao_share_percent: 5 } }) })).json();
  check("POST /api/manifests/validate reports field errors", !r2.ok && r2.errors.some((e) => e.path === "dao_share_percent"));
  const js = await fetch(`${BASE}/checks.js`);
  check("GET /checks.js serves the checker for browsers", js.ok && /kalis-checks\/1/.test(await js.text()));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
