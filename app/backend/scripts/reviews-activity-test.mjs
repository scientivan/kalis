// Ratings, transactions and activity acceptance tests through the HTTP API.
// Makes one real paid and executed portfolio run (about 0.1 NEAR testnet from the demo buyer).
// Usage: node scripts/reviews-activity-test.mjs [base url]
import fs from "node:fs";
import * as kalis from "../src/kalis-crypto.js";

const BASE = process.argv[2] || "http://localhost:8787";
const WS = `rev-${Date.now().toString(36)}`;
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); };
async function api(method, p, body, ws = WS) {
  const r = await fetch(BASE + p, { method, headers: { "Content-Type": "application/json", "X-Kalis-Workspace": ws }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const code = (r) => r.body?.error?.code;

const cfg = (await api("GET", "/api/config")).body;
const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
const { id: _, ...data } = cases.find((c) => c.id === "C03");
const sealed = kalis.sealData(cfg.runner.tee_pubkey, data);

const paid = await api("POST", "/api/runs", { method_id: "portfolio-rebalance", data_ct_sha256: sealed.dataCtSha256, payment: "demo_topup", idempotency_key: `rev-pay-${Date.now()}` });
check("setup: run paid", paid.body.run?.status === "Paid", paid.body.run_id);
const runId = paid.body.run_id;

const before = await api("GET", `/api/runs/${runId}/review-eligibility`);
check("not eligible before the run is executed", before.body.eligible === false && before.body.reason === "not_executed");
const early = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 5, privacy_acknowledged: true });
check("review before execution is refused", code(early) === "not_executed");

const ex = await api("POST", `/api/runs/${runId}/execute`, { data: sealed.sealed });
check("setup: run executed", ex.body.completion?.record?.all_ok === true, ex.body.error?.message);
const st = await api("POST", `/api/runs/${runId}/settle`);
check("setup: run settled", st.body.status === "Released", st.body.settle_tx);

const el = await api("GET", `/api/runs/${runId}/review-eligibility`);
check("buyer of an executed run is eligible", el.body.eligible === true && el.body.version === paid.body.version);
const elOther = await api("GET", `/api/runs/${runId}/review-eligibility`, null, `${WS}-other`);
check("another principal is not eligible", elOther.body.eligible === false && elOther.body.reason === "not_your_run");
const zero = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 0, privacy_acknowledged: true });
check("rating outside 1-5 is refused", code(zero) === "bad_rating");
const half = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 4.5, privacy_acknowledged: true });
check("fractional rating is refused", code(half) === "bad_rating");
const noAck = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 4 });
check("review without the privacy acknowledgment is refused", code(noAck) === "privacy_not_acknowledged");
const long = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 4, comment: "x".repeat(1001), privacy_acknowledged: true });
check("comment over 1000 characters is refused", code(long) === "comment_too_long");
const wrongMethod = await api("POST", "/api/methods/salary-counteroffer/reviews", { run_id: runId, rating: 4, privacy_acknowledged: true });
check("review on another method is refused", code(wrongMethod) === "wrong_method");
const otherBuyer = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 1, privacy_acknowledged: true }, `${WS}-other`);
check("another principal cannot review this run", code(otherBuyer) === "not_your_run");

const key = `rev-${Date.now()}`;
const ok = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 4, comment: "Clear steps, the cost matched my own sum.", privacy_acknowledged: true, idempotency_key: key });
check("review is saved and bound to the paid version", ok.body.review?.version === paid.body.version && ok.body.review.purchase_verified === true && !("principal" in ok.body.review));
check("comment holds only what the buyer typed", ok.body.review?.comment === "Clear steps, the cost matched my own sum." && !JSON.stringify(ok.body).includes(JSON.stringify(data.holdings)));
const replay = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 4, comment: "Clear steps, the cost matched my own sum.", privacy_acknowledged: true, idempotency_key: key });
check("retry with the same key returns the same review", replay.body.replayed === true && replay.body.review.id === ok.body.review.id);
const conflict = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 2, privacy_acknowledged: true, idempotency_key: key });
check("same key with another payload is refused", code(conflict) === "idempotency_conflict");
const second = await api("POST", "/api/methods/portfolio-rebalance/reviews", { run_id: runId, rating: 2, privacy_acknowledged: true, idempotency_key: `${key}-b` });
check("a second review of the same run is refused", code(second) === "already_reviewed" && second.body.error.details?.existing_review_id === ok.body.review.id);

const summary = (await api("GET", "/api/methods/portfolio-rebalance/rating-summary")).body;
const list = (await api("GET", "/api/methods/portfolio-rebalance/reviews?limit=5")).body;
check("summary counts the review", summary.count >= 1 && summary.average !== null && summary.distribution["4"] >= 1);
check("listing and detail use the same summary", list.summary.count === summary.count && list.summary.average === summary.average);
const none = (await api("GET", "/api/methods/salary-counteroffer/rating-summary?version=999")).body;
check("zero reviews give a null average, not 0", none.count === 0 && none.average === null && none.label === "No ratings yet");

const tx = (await api("GET", "/api/me/transactions")).body;
const mine = tx.items.filter((x) => x.run_id === runId);
check("transactions show the escrow hold and the release split", mine.some((x) => x.type === "escrow_hold" && x.amount.decimals === 24 && /^\d+$/.test(x.amount.value)) && mine.some((x) => x.type === "release" && x.split?.dao?.value));
const r = mine.find((x) => x.type === "release");
check("split adds up exactly in integer yocto", r && BigInt(r.split.seller.value) + BigInt(r.split.dao.value) + BigInt(r.split.platform.value) === BigInt(r.amount.value));
check("mock fiat funding is labelled", mine.find((x) => x.type === "escrow_hold")?.funding === "mock_fiat_topup");
const txOther = (await api("GET", "/api/me/transactions", null, `${WS}-other`)).body;
check("another principal does not see these transactions", !txOther.items.some((x) => x.run_id === runId));

const bal = (await api("GET", "/api/me/balance")).body;
check("balance is unavailable with a reason", bal.status === "unavailable" && /custodial/.test(bal.reason));
const earnNone = (await api("GET", "/api/me/earnings")).body;
check("earnings without sign-in or account is unavailable", earnNone.status === "unavailable");
const earn = (await api("GET", "/api/me/earnings?account=scientivan.testnet")).body;
check("public seller earnings list the release and keep bounty income separate", earn.seller_allocations.items.some((x) => x.run_id === runId) && Array.isArray(earn.bounty_income.items), `seller total ${earn.seller_allocations.total_paid.display}, bounty items ${earn.bounty_income.items.length}`);

await api("POST", "/api/protections/memory", { text: "Prefer trades in asset C when costs tie.", source: { kind: "user" } });
const act = (await api("GET", "/api/activity?limit=50")).body;
check("activity lists run phases, protection audit and the review", ["run.paid", "run.released", "review.created"].every((k) => act.items.some((x) => x.kind === k)) && act.items.some((x) => x.kind.startsWith("protection.memory")), act.items.map((x) => x.kind).slice(0, 8).join(","));
check("activity carries no private values", !JSON.stringify(act).includes("Prefer trades in asset C") && !JSON.stringify(act).includes(JSON.stringify(data.holdings)));
const page1 = (await api("GET", "/api/activity?limit=2")).body;
const page2 = (await api("GET", `/api/activity?limit=2&cursor=${encodeURIComponent(page1.next_cursor)}`)).body;
check("activity pagination does not repeat items", page1.next_cursor && page2.items.length > 0 && !page2.items.some((x) => page1.items.some((y) => y.id === x.id)));

console.log(`\n${pass} passed, ${fail} failed (workspace ${WS}, run ${runId})`);
process.exit(fail ? 1 : 0);
