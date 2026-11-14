// Local test of the runner `evaluate` command (private test of a bounty candidate).
// Usage: node client/evaluate-local-test.mjs <native runner>
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { sealMethod, sealData } from "./kalis.mjs";

const [bin] = process.argv.slice(2);
const env = { ...process.env, PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex") };
const call = (o) => JSON.parse(execFileSync(bin, { input: JSON.stringify(o), env, maxBuffer: 1 << 26 }).toString());
const { tee_pubkey, completion_pubkey } = call({ cmd: "pubkey" });
const methods = new URL("../../methods/portfolio-rebalance/", import.meta.url);
const manifest = fs.readFileSync(new URL("manifest-v5.json", methods), "utf8");
const base = fs.readFileSync(new URL("method-v2-pruning.wasm", methods));
const fx = (n) => fs.readFileSync(new URL(`fixtures/eval-candidates/${n}`, import.meta.url));
const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
const { id: _, ...c03 } = cases.find((c) => c.id === "C03");
const compare = { fields: ["status", "cost", "delta"], tolerance: 1e-6 };
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
const verify = (out) => crypto.verify(null, Buffer.from("kalis-evaluation:v1:" + out.evaluation),
  crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(out.evaluation_pubkey, "hex")]), format: "der", type: "spki" }),
  Buffer.from(out.evaluation_sig, "hex"));
function evaluate(candidate) {
  const { sealed } = sealData(tee_pubkey, c03);
  return call({ cmd: "evaluate", run_id: `eval-${Date.now()}`, manifest, baseline: sealMethod(tee_pubkey, base), candidate: sealMethod(tee_pubkey, candidate), case: sealed, compare });
}
const st = (o) => o.per_check.map((p) => `${p.field}:${p.status}`).join(" ");

const same = evaluate(base);
check("same build: every field passes and both reports ok", same.ok && same.counts.fail === 0 && same.both_reports_ok, st(same));
check("evaluation record is signed by the TEE completion key", verify(same) && same.evaluation_pubkey === completion_pubkey);
const rec = JSON.parse(same.evaluation);
check("record binds baseline, candidate, manifest and case hashes", [rec.baseline_sha256, rec.candidate_sha256, rec.manifest_sha256, rec.case_ct_sha256].every((h) => /^[0-9a-f]{64}$/.test(h)) && rec.all_pass === true);
const wrong = evaluate(fx("wrong-cost.wasm"));
check("candidate with a wrong cost fails the cost field only", wrong.per_check.find((p) => p.field === "cost").status === "fail" && wrong.per_check.find((p) => p.field === "status").status === "pass" && JSON.parse(wrong.evaluation).all_pass === false, st(wrong));
const lazy = evaluate(fx("lazy.wasm"));
check("candidate that skips a declared step: reports not ok, so not all_pass", lazy.both_reports_ok === false && JSON.parse(lazy.evaluation).all_pass === false, st(lazy));
const ai = evaluate(fs.readFileSync(new URL("../../guest-ai-test/target/wasm32-unknown-unknown/release/guest_ai_test.wasm", import.meta.url)));
check("candidate importing AI where the manifest allows none: status fails", ai.per_check.find((p) => p.field === "status").status === "fail" && !ai.both_reports_ok, st(ai));
const wire = JSON.stringify([same, wrong, lazy, ai]);
const leaks = ["holdings", "fee_rates", "0.18", "\"delta\":[", JSON.stringify(c03.holdings), "feasible"].filter((w) => wire.includes(w));
check("output holds no answer values or case data", leaks.length === 0, leaks.join(", "));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
