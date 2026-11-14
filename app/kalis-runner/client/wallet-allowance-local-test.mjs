// Local test of wallet-allowance-guard on the native runner with the real NEAR AI Cloud.
// Needs NEAR_API_KEY (Product/.env). Usage: node client/wallet-allowance-local-test.mjs [native runner]
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { sealMethod, sealData, openAnswer } from "./kalis.mjs";
import { runChecks } from "../../backend/src/checks.js";

const env0 = Object.fromEntries(fs.readFileSync(new URL("../../../.env", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const bin = process.argv[2] || new URL("../target/release/kalis-runner", import.meta.url).pathname;
const env = { ...process.env, ...env0, NEAR_AI_API_KEY: env0.NEAR_API_KEY, PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex") };
const call = (o) => JSON.parse(execFileSync(bin, { input: JSON.stringify(o), env, maxBuffer: 1 << 26 }).toString());
const { tee_pubkey } = call({ cmd: "pubkey" });
const dir = new URL("../../methods/wallet-allowance-guard/", import.meta.url);
const manifestText = fs.readFileSync(new URL("manifest.json", dir), "utf8");
const manifest = JSON.parse(manifestText);
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
const out = {};
for (const f of ["sample-input.json", "attack-input.json"]) {
  const { _note, ...data } = JSON.parse(fs.readFileSync(new URL(`fixtures/${f}`, dir)));
  const { sealed, secret } = sealData(tee_pubkey, data);
  const r = call({ cmd: "run", run_id: `wag-${Date.now()}`, manifest: manifestText, method: sealMethod(tee_pubkey, fs.readFileSync(new URL("method.wasm", dir))), data: sealed });
  if (!r.ok) throw new Error(r.error);
  const o = openAnswer(secret, r);
  const c = runChecks(manifest, data, o.answer);
  out[f] = { answer: o.answer, all_ok: o.report.all_ok, checks: c.counts };
  console.log(f, o.answer.verdict, JSON.stringify(o.answer.actions.map((a) => [a.id, a.verdict, a.reasons.map((x) => x.rule).join(",")])), JSON.stringify(c.counts));
  check(`${f}: all stages ok`, o.report.all_ok);
  check(`${f}: buyer checks pass`, c.passed && !c.has_cannot_check, JSON.stringify(c.results.filter((x) => x.status !== "pass").map((x) => x.id + ":" + x.status)));
  if (f === "attack-input.json") {
    check("attack: overall BLOCK", o.answer.verdict === "BLOCK");
    check("attack: drain action a2 BLOCK", o.answer.actions.find((a) => a.id === "a2").verdict === "BLOCK");
    check("attack: a2 not approvable", !o.answer.approvable.some((a) => a.id === "a2"));
    const tampered = { ...o.answer, approvable: [...o.answer.approvable, { id: "a2", verdict: "ALLOW", receiver: "refund-desk-near.testnet", amount_near: 0.128, needs_owner_approval: true }], approved_total_near: o.answer.approved_total_near + 0.128 };
    check("tampered answer that approves the drain fails a device check", !runChecks(manifest, data, tampered).passed);
  } else check("sample: invoice ALLOW", o.answer.verdict === "ALLOW" && o.answer.approvable.length === 1);
}
console.log(`\n${pass} passed, ${fail} failed`);
fs.writeFileSync(new URL("../wallet-allowance-local-test-latest.json", import.meta.url), JSON.stringify({ at: new Date().toISOString(), pass, fail, out }, null, 2));
process.exit(fail ? 1 : 0);
