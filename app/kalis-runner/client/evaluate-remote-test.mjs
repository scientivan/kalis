// The runner `evaluate` command on OutLayer testnet: baseline = published portfolio method,
// candidate = same method (should pass) and a broken candidate (should fail). Only per-field
// pass/fail and a TEE-signed record come back; no case data, no answers.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import { sealMethod, sealData } from "./kalis.mjs";
const API = "https://testnet-api.outlayer.ai";
const PK = JSON.parse(fs.readFileSync(`${os.homedir()}/.outlayer/testnet/payment-keys.json`, "utf8"))["testnet:scientivan.testnet:payment-key:1"];
const headers = { "X-Payment-Key": PK, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(input) {
  const r = await (await fetch(`${API}/call/scientivan.testnet/kalis-runner`, { method: "POST", headers, body: JSON.stringify({ input, secrets_ref: { profile: "default", account_id: "scientivan.testnet" }, async: true }) })).json();
  for (let i = 0; i < 60; i++) { const s = await (await fetch(`${API}/calls/${r.call_id}`, { headers })).json(); if (!["pending", "running", "queued"].includes(s.status)) return s; await sleep(6000); }
}
const TEE = "d4dd5b661d908c178ab83ab17e1317b42d9521f37d5220fb51ad8d1f2ce3753e";
const methods = new URL("../../methods/portfolio-rebalance/", import.meta.url);
const manifest = fs.readFileSync(new URL("manifest-v5.json", methods), "utf8");
const base = fs.readFileSync(new URL("method-v2-pruning.wasm", methods));
const broken = fs.readFileSync(new URL("fixtures/eval-candidates/wrong-cost.wasm", import.meta.url));
const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
const { id: _, ...c03 } = cases.find((c) => c.id === "C03");
const compare = { fields: ["status", "cost", "delta"], tolerance: 1e-6 };
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
for (const [name, cand, expectPass] of [["same candidate", base, true], ["wrong-cost candidate", broken, false]]) {
  const input = { cmd: "evaluate", run_id: `eval-${Date.now()}`, manifest, baseline: sealMethod(TEE, base), candidate: sealMethod(TEE, cand), case: sealData(TEE, c03).sealed, compare };
  const res = await call(input);
  const out = res.output || {};
  const wire = JSON.stringify(out);
  const sigOk = out.evaluation && crypto.verify(null, Buffer.from("kalis-evaluation:v1:" + out.evaluation), crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(out.evaluation_pubkey, "hex")]), format: "der", type: "spki" }), Buffer.from(out.evaluation_sig, "hex"));
  const allPass = out.per_check?.every((c) => c.status === "pass");
  check(`${name}: ${expectPass ? "passes" : "fails"} on OutLayer`, res.status === "completed" && allPass === expectPass, `${res.call_id} ${JSON.stringify(out.per_check)}`);
  check(`${name}: record signed by the TEE completion key`, sigOk && out.evaluation_pubkey === "8b77ffa184b87d84d0302813f74d7bab21cf96ab8b88a1e781d3af2744f3c7a7");
  check(`${name}: no case data or answer in the output`, !/holdings|fee_rates|"delta":\[/.test(wire));
}
console.log(`\n${pass} passed, ${fail} failed`);
