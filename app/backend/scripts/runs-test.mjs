// Group A acceptance tests through the HTTP API (spends about 0.3 NEAR testnet from the demo buyer).
// Usage: node scripts/runs-test.mjs [base url]
// Leaves one run Paid and unexecuted, recorded in data/reclaim-pending.json, so
// scripts/reclaim-test.mjs can check the timeout reclaim after 30 minutes.
import fs from "node:fs";
import path from "node:path";
import * as kalis from "../src/kalis-crypto.js";

const BASE = process.argv[2] || "http://localhost:8787";
const WS = `runs-${Date.now().toString(36)}`;
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); };
async function api(method, p, body, ws = WS, headers = {}) {
  const r = await fetch(BASE + p, { method, headers: { "Content-Type": "application/json", "X-Kalis-Workspace": ws, ...headers }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  return { status: r.status, body: j };
}
const code = (r) => r.body?.error?.code;

const cfg = (await api("GET", "/api/config")).body;
const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
const { id: _, ...data } = cases.find((c) => c.id === "C03");
const sealedA = kalis.sealData(cfg.runner.tee_pubkey, data);

// capabilities
const caps = (await api("GET", "/api/capabilities")).body;
check("capabilities list features with status and reason", caps.features.every((f) => f.status && f.reason));

// draft, consent, quote
const draft = await api("POST", "/api/run-drafts", { method_id: "portfolio-rebalance", name: "Rebalance before market open", data_ct_sha256: sealedA.dataCtSha256 });
check("draft pins a version snapshot", draft.status === 200 && draft.body.snapshot.code_hash && draft.body.revision === 1, `v${draft.body.snapshot?.version}`);
check("a method without AI has no model choice", draft.body.models.uses_ai === false);
const badModel = await api("POST", "/api/run-drafts", { method_id: "salary-counteroffer", models: ["openai/gpt-5"] });
check("buyer cannot widen the model allowlist", code(badModel) === "model_not_allowed");
await api("POST", `/api/run-drafts/${draft.body.id}/consents`, { revision: 1, kind: "method_terms" });
const other = await api("GET", `/api/run-drafts/${draft.body.id}`, null, `${WS}-other`);
check("another principal cannot read the draft", code(other) === "not_your_draft");
const stale = await api("PATCH", `/api/run-drafts/${draft.body.id}`, { expected_revision: 9, name: "x" });
check("edit with a stale revision is refused", code(stale) === "revision_conflict");
const sealedB = kalis.sealData(cfg.runner.tee_pubkey, data);
const patched = await api("PATCH", `/api/run-drafts/${draft.body.id}`, { expected_revision: 1, data_ct_sha256: sealedB.dataCtSha256 });
check("changing the data clears earlier consent", patched.body.revision === 2 && patched.body.consents.length === 0);
const quote = await api("POST", `/api/run-drafts/${draft.body.id}/quote`, { expected_revision: 2 });
check("quote separates price, storage, infra and gas in yocto strings", quote.body.method_price?.value && quote.body.storage_deposit?.value === "10000000000000000000000" && quote.body.infra_fee?.value === "0" && quote.body.allocation_base?.applies_to === "method_price");

// idempotent payment
const key = `pay-${Date.now()}`;
const paid = await api("POST", "/api/runs", { quote_id: quote.body.id, payment: "demo_topup", idempotency_key: key });
check("payment through the quote succeeds", paid.status === 200 && paid.body.run?.status === "Paid", paid.body.pay_tx);
const replay = await api("POST", "/api/runs", { quote_id: quote.body.id, payment: "demo_topup", idempotency_key: key });
check("retry with the same key does not pay again", replay.body.replayed === true && replay.body.run_id === paid.body.run_id && replay.body.pay_tx === paid.body.pay_tx);
const conflict = await api("POST", "/api/runs", { method_id: "portfolio-rebalance", data_ct_sha256: sealedA.dataCtSha256, payment: "demo_topup", idempotency_key: key });
check("same key with a different payload is refused", code(conflict) === "idempotency_conflict");
const reuse = await api("POST", "/api/runs", { quote_id: quote.body.id, payment: "demo_topup", idempotency_key: `${key}-2` });
check("a paid draft cannot be paid again with a new key", code(reuse) === "draft_closed");
const op = await api("GET", `/api/operations/${paid.body.operation_id}`);
check("payment operation can be read back", op.body.status === "succeeded" && op.body.result.run_id === paid.body.run_id);
const opOther = await api("GET", `/api/operations/${paid.body.operation_id}`, null, `${WS}-other`);
check("another principal cannot read the operation", code(opOther) === "unknown_operation");

// list and privacy
const list = await api("GET", "/api/runs?limit=10");
check("run list shows the caller's run", list.body.items.some((r) => r.id === paid.body.run_id));
const listOther = await api("GET", "/api/runs", null, `${WS}-other`);
check("run list does not show another principal's run", !listOther.body.items.some((r) => r.id === paid.body.run_id));
const ev = await api("GET", `/api/runs/${paid.body.run_id}/events`, null, `${WS}-other`);
check("another principal cannot read run events", code(ev) === "not_your_run");

// wrong data, async execution, settle
const wrong = await api("POST", `/api/runs/${paid.body.run_id}/execute`, { data: sealedA.sealed });
check("sealed data that the payment did not commit to is refused", code(wrong) === "data_mismatch");
const early = await api("POST", `/api/runs/${paid.body.run_id}/reclaim`, {});
check("reclaim before the timeout is refused with the deadline", code(early) === "not_expired" && early.body.error.details?.reclaim_after_ns);
const ex = await api("POST", `/api/runs/${paid.body.run_id}/execute`, { data: sealedB.sealed, async: true });
check("async execution returns an operation", ex.body.status === "pending" && ex.body.operation_id);
let opx;
for (let i = 0; i < 60; i++) { opx = (await api("GET", `/api/operations/${ex.body.operation_id}`)).body; if (opx.status !== "pending") break; await new Promise((r) => setTimeout(r, 5000)); }
check("execution operation finishes", opx.status === "succeeded" && opx.result.all_ok === true, opx.error?.message);
const exec = (await api("GET", `/api/runs/${paid.body.run_id}/execution`)).body;
const opened = kalis.openAnswer(sealedB.secret, exec.output);
check("buyer opens the answer from the stored execution", opened.report.all_ok && opened.answer.status === "feasible");
const st = await api("POST", `/api/runs/${paid.body.run_id}/settle`);
check("settle releases the escrow", st.body.status === "Released", st.body.settle_tx);
const events = (await api("GET", `/api/runs/${paid.body.run_id}/events`)).body;
check("events record every phase", ["payment_pending", "paid", "executing", "executed", "settling", "released"].every((ph) => events.events.some((e) => e.phase === ph)), events.events.map((e) => e.phase).join(" > "));
const st2 = await api("POST", `/api/runs/${paid.body.run_id}/settle`);
check("settling twice changes nothing", st2.body.already_settled === true);

// leave one run unexecuted for the timeout reclaim test
const sealedC = kalis.sealData(cfg.runner.tee_pubkey, data);
const idle = await api("POST", "/api/runs", { method_id: "portfolio-rebalance", data_ct_sha256: sealedC.dataCtSha256, payment: "demo_topup", idempotency_key: `idle-${Date.now()}` });
check("second run paid and left for the reclaim test", idle.body.run?.status === "Paid", idle.body.run_id);
fs.writeFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname), "../data/reclaim-pending.json"), JSON.stringify({ workspace: WS, run_id: idle.body.run_id, at: new Date().toISOString() }));

console.log(`\n${pass} passed, ${fail} failed (workspace ${WS})`);
process.exit(fail ? 1 : 0);
