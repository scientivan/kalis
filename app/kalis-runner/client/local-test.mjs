// Local end-to-end test of the Kalis runner with a throwaway seal key.
// 1. 12 cases: answer matches the Python oracle, execution report is all ok,
//    buyer recheck passes, sealed answer size is constant.
// 2. A "lazy" method build that skips its declared self_check step is flagged.
// 3. A tampered answer (wrong trades) is caught by the buyer recheck.
// Usage: node client/local-test.mjs <native runner> <guest wasm> [lazy guest wasm]
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { sealMethod, sealData, openAnswer, recheckPortfolio, verifyCompletion } from "./kalis.mjs";

const [bin, guestPath, lazyPath] = process.argv.slice(2);
const root = new URL("../../../validation/portfolio-method-02/", import.meta.url);
const cases = JSON.parse(fs.readFileSync(new URL("cases.json", root)));
const expected = JSON.parse(fs.readFileSync(new URL("method-results.json", root)));
const manifest = fs.readFileSync(new URL("../../methods/portfolio-rebalance/manifest.json", import.meta.url), "utf8");
const env = { ...process.env, PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex") };
const call = (obj) => JSON.parse(execFileSync(bin, { input: JSON.stringify(obj), env, maxBuffer: 1 << 26 }).toString());
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");

const { tee_pubkey } = call({ cmd: "pubkey" });
const guest = fs.readFileSync(guestPath);
const method = sealMethod(tee_pubkey, guest);
let pass = 0; const sizes = new Set();
for (const c of cases) {
  const { id, ...data } = c;
  const { sealed, secret } = sealData(tee_pubkey, data);
  const out = call({ cmd: "run", run_id: `local-${id}`, manifest, method, data: sealed });
  const comp = verifyCompletion(out);
  if (!comp.sigOk || comp.record.run_id !== `local-${id}` || comp.record.all_ok !== true || comp.record.data_ct_sha256 !== out.data_ct_sha256) throw new Error(`bad completion for ${id}`);
  sizes.add(out.ct.length);
  const opened = openAnswer(secret, out);
  const exp = expected.find((e) => e.id === id);
  const correct = opened.answer.status === (exp.oracle ? "feasible" : "infeasible")
    && (opened.answer.status === "infeasible" || Math.abs(opened.answer.cost - exp.oracle.cost) < 1e-6);
  const recheck = recheckPortfolio(data, opened.answer);
  const ok = correct && opened.report.all_ok && recheck.passed && opened.method_sha256 === sha(guest) && opened.manifest_sha256 === sha(manifest);
  pass += ok;
  console.log(id, ok ? "OK" : "PROBLEM", opened.answer.status, opened.answer.delta ?? "", `report ${opened.report.all_ok ? "all ok" : "NOT ok"}`, `recheck ${recheck.passed ? "passed" : "FAILED"}`);
}
console.log(`${pass}/${cases.length} correct, fully reported, recheck passed; distinct sealed answer sizes ${[...sizes].join(", ")}`);

const { id: _, ...c03 } = cases.find((c) => c.id === "C03");
{
  const { sealed, secret } = sealData(tee_pubkey, c03);
  const opened = openAnswer(secret, call({ cmd: "run", run_id: "local-x", manifest, method, data: sealed }));
  console.log("\nExecution report for C03");
  for (const s of opened.report.runner_stages) console.log(`  runner  ${s.ok ? "ok  " : "FAIL"} ${s.id}  ${s.detail}`);
  for (const s of opened.report.method_steps.reported) console.log(`  method  ${s.ok ? "ok  " : "FAIL"} ${s.id}  ${s.detail}`);
  const bad = { ...opened.answer, delta: [-6, 0, 5], cost: 0.18 };
  const r = recheckPortfolio(c03, bad);
  console.log("\nTampered answer (sell 6 A, buy 5 C) recheck:", r.passed ? "passed (unexpected)" : "FAILED as expected");
  for (const x of r.checks.filter((x) => !x.ok)) console.log("  warning:", x.message);
}
if (lazyPath) {
  const lazy = sealMethod(tee_pubkey, fs.readFileSync(lazyPath));
  const { sealed, secret } = sealData(tee_pubkey, c03);
  const opened = openAnswer(secret, call({ cmd: "run", run_id: "local-lazy", manifest, method: lazy, data: sealed }));
  const ms = opened.report.method_steps;
  console.log(`\nLazy method: report all_ok=${opened.report.all_ok}, missing steps ${JSON.stringify(ms.missing)}`);
}
