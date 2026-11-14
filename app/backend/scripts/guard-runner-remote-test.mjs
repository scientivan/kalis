// Separate verification of the guard runner (scientivan.testnet/kalis-guard-runner) on OutLayer testnet:
// the runner reads NEAR testnet state over RPC inside the TEE before the guard method runs. Runs straight
// against the OutLayer project (no market escrow, no settlement): the market contract verifies one runner
// completion key, and this project's key is different. Usage: node scripts/guard-runner-remote-test.mjs
import fs from "node:fs";
import { callRunner, checkAttestation } from "../src/outlayer.js";
import * as kalis from "../src/kalis-crypto.js";

const PROJECT = "scientivan.testnet/kalis-guard-runner";
const BUILD = "57abddb0f9069d02ab5cc3b7bf0d5a802daf342e0d53a9d82d9c28ceed2aa896";
const secretsRef = { profile: "guard", account_id: "scientivan.testnet" };
const M = new URL("../../methods/", import.meta.url);
const outFile = new URL("../../methods/wallet-allowance-guard/evidence/guard-runner-remote.json", import.meta.url);
const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : { project: PROJECT, build: BUILD, runs: [] };
const save = () => fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
const opts = { project: PROJECT, secretsRef, timeoutMs: 900000 };

if (!out.tee_pubkey) {
  const r = await callRunner({ cmd: "pubkey" }, opts);
  out.pubkey_call = r.call_id; out.tee_pubkey = r.output?.tee_pubkey; out.completion_pubkey = r.output?.completion_pubkey || null;
  out.pubkey_attestation = await checkAttestation(r.call_id, { inputText: r.inputText, output: r.output, runnerHash: BUILD });
  save(); console.log("pubkey", r.call_id, out.tee_pubkey);
}
const fx = (m, f) => { const { _note, ...d } = JSON.parse(fs.readFileSync(new URL(`${m}/fixtures/${f}`, M))); return d; };
const wallet = fx("wallet-allowance-guard", "attack-input.json");
const benign = fx("wallet-allowance-guard", "sample-input.json");
const token = fx("token-scam-screen", "sample-input.json");
const cases = [
  { name: "wallet_attack_chain", method: "wallet-allowance-guard", wasm: "method-v3.wasm", data: { ...wallet, onchain_request: { account: wallet.allowance.sandbox_account } } },
  { name: "wallet_benign_chain", method: "wallet-allowance-guard", wasm: "method-v3.wasm", data: { ...benign, allowance: { ...benign.allowance, balance_near: 0.12 }, onchain_request: { account: benign.allowance.sandbox_account } } },
  { name: "wallet_typed_balance_lie", method: "wallet-allowance-guard", wasm: "method-v3.wasm", data: { ...benign, allowance: { ...benign.allowance, balance_near: 5 }, onchain_request: { account: benign.allowance.sandbox_account } } },
  { name: "token_wrap_testnet", method: "token-scam-screen", wasm: "method-guard.wasm", data: { ...token, token: { ...token.token, symbol: "wNEAR", contract: "wrap.testnet", deployer: "wrap.testnet", owner_can_mint: false, owner_can_pause: false }, agent_request: { amount_usd: 50, instruction: "Buy 50 USD of wNEAR for the owner's rebalance." }, onchain_request: { token: "wrap.testnet" } } },
  { name: "token_not_a_token", method: "token-scam-screen", wasm: "method-guard.wasm", data: { ...token, token: { ...token.token, symbol: "SCI", contract: "scientivan.testnet", deployer: "scientivan.testnet" }, agent_request: { amount_usd: 50, instruction: "Buy SCI." }, onchain_request: { token: "scientivan.testnet" } } },
];
const only = process.argv.slice(2);
await Promise.all(cases.filter((c) => !only.length || only.includes(c.name)).map(async (c) => {
  const rec = { name: c.name, method: c.method, at: new Date().toISOString() };
  try {
    const manifestText = fs.readFileSync(new URL(`${c.method}/manifest.json`, M), "utf8");
    const { sealed, secret } = kalis.sealData(out.tee_pubkey, c.data);
    const input = { cmd: "run", run_id: `guard-${c.name}-${Date.now()}`, manifest: manifestText, method: kalis.sealMethod(out.tee_pubkey, new Uint8Array(fs.readFileSync(new URL(`${c.method}/${c.wasm}`, M)))), data: sealed };
    const r = await callRunner(input, { ...opts, onStarted: (id) => { rec.call_id = id; console.log(c.name, "started", id); } });
    if (!r.output?.ok) throw new Error(r.error || r.output?.error || r.status);
    const o = kalis.openAnswer(secret, r.output);
    rec.attestation = await checkAttestation(r.call_id, { inputText: r.inputText, output: r.output, runnerHash: BUILD });
    const a = o.answer;
    rec.verdict = a.verdict; rec.chain_read = a.chain_read; rec.all_ok = o.report.all_ok;
    rec.read_chain_stage = o.report.runner_stages.find((s) => s.id === "read_chain")?.detail || null;
    rec.method_read_chain = (o.report.method_steps?.steps || o.report.method_steps?.list || []).find?.((s) => s.id === "read_chain") || null;
    rec.reasons = (a.actions ? a.actions.map((x) => ({ id: x.id, verdict: x.verdict, rules: x.reasons.map((y) => y.rule) })) : a.reasons.map((y) => y.rule));
    rec.ai_calls = (o.report.ai_calls || []).length;
    console.log(c.name, "done", r.call_id, a.verdict, JSON.stringify(rec.reasons).slice(0, 300));
  } catch (e) { rec.error = String(e.message).slice(0, 300); console.log("ERR", c.name, rec.error); }
  out.runs.push(rec); save();
}));
