// Full escrow flow on NEAR testnet + OutLayer testnet.
// Buyer seals data, pays the market contract for one run, the runner executes
// in the TEE and returns a signed completion, anyone submits it with `settle`,
// and the contract releases (split seller / DAO / platform) or refunds.
// Usage: node client/escrow-e2e.mjs <success|failure> <guest wasm>
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import { sealMethod, sealData, openAnswer, verifyCompletion } from "./kalis.mjs";

const [scenario, guestPath] = process.argv.slice(2);
const MARKET = "market.scientivan.testnet", BUYER = "kalis-buyer.testnet";
const SELLER = "scientivan.testnet", DAO = "kalis-fund.sputnik-v2.testnet", PLATFORM = "platform.scientivan.testnet";
const TEE = "d4dd5b661d908c178ab83ab17e1317b42d9521f37d5220fb51ad8d1f2ce3753e";
const API = "https://testnet-api.outlayer.ai";
const PK = JSON.parse(fs.readFileSync(`${os.homedir()}/.outlayer/testnet/payment-keys.json`, "utf8"))["testnet:scientivan.testnet:payment-key:1"];
const manifest = fs.readFileSync(new URL("../../methods/portfolio-rebalance/manifest.json", import.meta.url), "utf8");
const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
const sha = (x) => crypto.createHash("sha256").update(x).digest("hex");
const rpc = async (method, params) => (await (await fetch("https://rpc.testnet.fastnear.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) })).json()).result;
const balance = async (a) => BigInt((await rpc("query", { request_type: "view_account", finality: "final", account_id: a })).amount);
const view = async (m, args) => JSON.parse(Buffer.from((await rpc("query", { request_type: "call_function", finality: "final", account_id: MARKET, method_name: m, args_base64: Buffer.from(JSON.stringify(args)).toString("base64") })).result).toString());
const near = (signer, method, args, deposit) => {
  const r = spawnSync("near", ["contract", "call-function", "as-transaction", MARKET, method, "json-args", JSON.stringify(args),
    "prepaid-gas", "100 Tgas", "attached-deposit", deposit, "sign-as", signer, "network-config", "testnet", "sign-with-keychain", "send"], { encoding: "utf8" });
  return `${r.stdout}${r.stderr}`.match(/Transaction ID: (\w+)/)?.[1];
};
const fmt = (y) => (Number(y) / 1e24).toFixed(5);

// Buyer data. The failure scenario sends limits the method rejects (lower above upper).
const { id: _, ...data } = cases.find((c) => c.id === "C03");
if (scenario === "failure") data.lower = [0.5, 0.5, 0.5];
const runId = `e2e-${scenario}-${Date.now()}`;
const { sealed, secret } = sealData(TEE, data);
const dataHash = sha(Buffer.from(sealed.ct, "base64"));
const version = (await view("get_method", { method_id: "portfolio-rebalance" })).version_count;

const who = { seller: SELLER, dao: DAO, platform: PLATFORM, buyer: BUYER };
const before = Object.fromEntries(await Promise.all(Object.entries(who).map(async ([k, a]) => [k, await balance(a)])));

console.log(`run ${runId}, method version ${version}`);
const payTx = near(BUYER, "pay_for_run", { run_id: runId, method_id: "portfolio-rebalance", version, data_ct_sha256: dataHash }, "0.11 NEAR");
console.log("1 paid, tx", payTx, "status", (await view("get_run", { run_id: runId })).status);

const headers = { "X-Payment-Key": PK, "Content-Type": "application/json" };
const body = { input: { cmd: "run", run_id: runId, manifest, method: sealMethod(TEE, fs.readFileSync(guestPath)), data: sealed },
  secrets_ref: { profile: "default", account_id: "scientivan.testnet" }, async: true };
const started = await (await fetch(`${API}/call/scientivan.testnet/kalis-runner`, { method: "POST", headers, body: JSON.stringify(body) })).json();
let res;
for (let i = 0; i < 60; i++) {
  res = await (await fetch(`${API}/calls/${started.call_id}`, { headers })).json();
  if (!["pending", "running", "queued"].includes(res.status)) break;
  await new Promise((r) => setTimeout(r, 6000));
}
const out = res.output;
const comp = verifyCompletion(out);
const opened = openAnswer(secret, out);
console.log("2 ran in TEE, call", started.call_id, "completion", out.completion, "signature valid", comp.sigOk);
console.log("  buyer opened", JSON.stringify(opened.answer), "report all_ok", opened.report.all_ok,
  "failed method steps", JSON.stringify(opened.report.method_steps.failed), "missing", JSON.stringify(opened.report.method_steps.missing));

const settleTx = near(BUYER, "settle", { run_id: runId, completion: out.completion, signature: out.completion_sig }, "0 NEAR");
const run = await view("get_run", { run_id: runId });
console.log("3 settled, tx", settleTx, "status", run.status, "reason", run.reason);
await new Promise((r) => setTimeout(r, 4000));
const after = Object.fromEntries(await Promise.all(Object.entries(who).map(async ([k, a]) => [k, await balance(a)])));
for (const k of Object.keys(who)) console.log(`  ${k.padEnd(8)} ${who[k].padEnd(32)} change ${fmt(after[k] - before[k])} NEAR`);
