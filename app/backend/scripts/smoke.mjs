// End-to-end smoke test through the HTTP API, acting as the browser would.
// Usage: node scripts/smoke.mjs [base url] [success|failure] [portfolio-rebalance|salary-counteroffer]
import fs from "node:fs";
import * as kalis from "../src/kalis-crypto.js";

const BASE = process.argv[2] || "http://localhost:8787";
const scenario = process.argv[3] || "success";
const methodId = process.argv[4] || "portfolio-rebalance";
const api = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(j)}`);
  return j;
};

const cfg = await api("GET", "/api/config");
console.log("config", cfg.market, "dao", cfg.dao, "demo top-up", cfg.demo_topup.enabled);
const methods = await api("GET", "/api/methods");
const m = methods.find((x) => x.method_id === methodId);
console.log("method", m.method_id, "latest v" + m.latest.number, "kind", JSON.stringify(m.latest.method_kind?.label), "price", m.latest.price_near, "NEAR, split", JSON.stringify(m.latest.payout_split_pct), "runnable", m.latest.runnable, "steps", m.latest.manifest.steps.map((s) => s.id).join(","));

// Buyer device: private data, sealed here. The server only ever sees ciphertext.
let data;
if (methodId === "portfolio-rebalance") {
  const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
  const { id: _, ...c } = cases.find((x) => x.id === "C03");
  data = c;
  if (scenario === "failure") data.lower = [0.5, 0.5, 0.5];
} else if (fs.existsSync(new URL(`../../methods/${methodId}/fixtures/sample-input.json`, import.meta.url))) {
  const { _note, ...sample } = JSON.parse(fs.readFileSync(new URL(`../../methods/${methodId}/fixtures/sample-input.json`, import.meta.url)));
  data = sample;
} else {
  // Fictional offer. walk_away and competing_offer are the buyer's private limits.
  data = { role: "Backend engineer", offer_salary: 30000000, currency: "IDR per month", walk_away: 28000000, competing_offer: 31000000, market_median: 32000000, offer_has: { remote_days: 1, learning_budget: 0, leave_days: 12 } };
}
const { sealed, secret, dataCtSha256 } = kalis.sealData(cfg.runner.tee_pubkey, data);

const created = await api("POST", "/api/runs", { method_id: m.method_id, data_ct_sha256: dataCtSha256, payment: "demo_topup" });
console.log("1 paid", created.run_id, created.pay_tx, created.run.status);
const ex = await api("POST", `/api/runs/${created.run_id}/execute`, { data: sealed });
console.log("2 executed call", ex.call_id, "completion", JSON.stringify(ex.completion), "attestation", JSON.stringify({ build: ex.attestation.executed_build_ok, input: ex.attestation.input_hash_ok, output: ex.attestation.output_hash_ok }));

const opened = kalis.openAnswer(secret, ex.output);
const recheck = methodId === "portfolio-rebalance" ? kalis.recheckPortfolio(data, opened.answer) : null;
const checks = m.latest.manifest?.buyer_checks ? kalis.runChecks(m.latest.manifest, data, opened.answer) : null;
if (checks) console.log("  buyer checks", checks.results.map((r) => `${r.id}:${r.status}`).join(" "));
const verdict = kalis.runVerdict({ opened, recheck: checks ? null : recheck, checks, completion: { sigOk: ex.completion.signature_valid }, attestation: ex.attestation, chain: ex.chain });
console.log("  buyer opened", JSON.stringify(opened.answer).slice(0, 600), "\n  ai calls", JSON.stringify((opened.report.ai_calls || []).map((c) => ({ ok: c.ok, model: c.proof?.model, signed: c.proof?.signature_valid }))), "\n  verdict", JSON.stringify(verdict));

const st = await api("POST", `/api/runs/${created.run_id}/settle`);
console.log("3 settled", st.settle_tx, st.status, "-", st.reason, JSON.stringify(st.payouts));
const dao = await api("GET", "/api/dao");
console.log("dao", dao.dao, "balance", dao.balance_near, "available", dao.available_near, "bounties", dao.bounties.length, "proposals", dao.proposals.length);
