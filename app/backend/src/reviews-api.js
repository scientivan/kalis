// Ratings and reviews (RANCANGAN 65.4). Rules:
// - One rating 1-5 per run. Eligible: the caller created the run on this server and the run was
//   executed (an execution record with runner output exists). Released and Refunded both count.
// - The review is bound to the run's paid version. Retry with the same idempotency key and payload
//   returns the same review; a second review of the same run is refused.
// - Zero reviews give a null average, never 0. Comments are typed by the buyer, max 1000 chars;
//   the server never adds the buyer's input or the answer to a review.
// User reviews are kept apart from method evidence (benchmarks), which lives elsewhere.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { METHODS_DIR } from "./config.js";
import * as db from "./db.js";
import { principal } from "./principal.js";
import { ApiError, chainRun, readExecution, getMethod } from "./market.js";

const MAX_COMMENT = 1000;

function authorLabel(p) {
  if (p.kind === "near_account") return p.account_id;
  const tag = crypto.createHash("sha256").update(p.id).digest("hex").slice(0, 6);
  return `Demo buyer ${tag}`;
}

async function eligibility(p, runId) {
  const row = db.get("runs", runId);
  const existing = Object.values(db.all("reviews")).find((r) => r.run_id === runId) || null;
  const base = { run_id: runId, existing_review_id: existing?.id || null };
  if (!row) return { ...base, eligible: false, reason: "unknown_run", message: "This run was not created on this server." };
  if (row.principal !== p.id) return { ...base, eligible: false, reason: "not_your_run", message: "Only the buyer who created the run can review it." };
  const exec = readExecution(runId);
  if (!exec?.output) return { ...base, method_id: row.method_id, version: row.version, eligible: false, reason: "not_executed", message: "The run has not been executed yet, so there is nothing to review." };
  if (p.kind === "near_account" && p.account_id) {
    const method = await getMethod(row.method_id).catch(() => null);
    if (method?.owner && method.owner === p.account_id) return { ...base, method_id: row.method_id, version: row.version, eligible: false, reason: "own_method", message: "You own this method, so you cannot review it. Reviews come from other buyers." };
  }
  const onChain = await chainRun(runId).catch(() => null);
  if (existing) return { ...base, method_id: row.method_id, version: row.version, run_status: onChain?.status || null, eligible: false, reason: "already_reviewed", message: "This run already has a review." };
  return { ...base, method_id: row.method_id, version: row.version, run_status: onChain?.status || null, eligible: true, reason: "executed_run", message: "You ran this method, so you can rate it once." };
}

// Runs paid and released on chain but recorded by other backend instances (local test servers).
// Listed in methods/onchain-runs.json and trusted only after get_run on the market contract says Released.
const chainReleased = [];
(async () => {
  try {
    const file = path.join(METHODS_DIR, "onchain-runs.json");
    const { run_ids = [] } = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const id of run_ids) {
      const run = await chainRun(id).catch(() => null);
      if (run?.status === "Released") chainReleased.push({ run_id: id, method_id: run.method_id, version: run.version });
    }
  } catch { /* no file, nothing to add */ }
})();

function summary(methodId, version) {
  const rows = Object.values(db.all("reviews")).filter((r) => r.method_id === methodId && (version == null || r.version === Number(version)));
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) dist[r.rating]++;
  const count = rows.length;
  // Successful runs of this method (payment released to the seller), shown as "uses" on the Marketplace.
  const ids = new Set(Object.values(db.all("runs")).filter((r) => r.method_id === methodId && r.phase === "released" && (version == null || r.version === Number(version))).map((r) => r.id));
  for (const r of chainReleased) if (r.method_id === methodId && (version == null || r.version === Number(version))) ids.add(r.run_id);
  const runs = ids.size;
  return {
    runs,
    method_id: methodId, scope: version == null ? "all_versions" : `version_${Number(version)}`,
    count, average: count ? Math.round((rows.reduce((a, r) => a + r.rating, 0) / count) * 100) / 100 : null,
    distribution: dist, label: count ? null : "No ratings yet",
    note: "Ratings come from buyers who executed a run. They are separate from the seller's test evidence.",
  };
}

const publicReview = ({ principal: _p, idempotency_key: _k, request_hash: _h, ...r }) => r;

export function registerReviewRoutes(route) {
  route("GET", /^\/api\/methods\/([^/]+)\/reviews$/, async (q, [id]) => {
    let rows = Object.values(db.all("reviews")).filter((r) => r.method_id === id);
    if (q.get("version")) rows = rows.filter((r) => r.version === Number(q.get("version")));
    const page = db.paginate(rows, { cursor: q.get("cursor"), limit: q.get("limit") });
    return { items: page.items.map(publicReview), next_cursor: page.next_cursor, order: "created_at desc", summary: summary(id, q.get("version")) };
  });

  route("GET", /^\/api\/methods\/([^/]+)\/rating-summary$/, async (q, [id]) => summary(id, q.get("version")));

  route("GET", /^\/api\/runs\/([^/]+)\/review-eligibility$/, async (_q, [id], _b, req) => eligibility(principal(req), id));

  route("POST", /^\/api\/methods\/([^/]+)\/reviews$/, async (_q, [id], b, req) => {
    const p = principal(req);
    const rating = Number(b?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError(400, "bad_rating", "rating must be a whole number from 1 to 5");
    const comment = b?.comment == null ? "" : String(b.comment).trim();
    if (comment.length > MAX_COMMENT) throw new ApiError(400, "comment_too_long", `comment is at most ${MAX_COMMENT} characters`);
    if (b?.privacy_acknowledged !== true) throw new ApiError(400, "privacy_not_acknowledged", "Confirm that the comment contains no private input or result (privacy_acknowledged: true). Kalis never adds them for you.");
    const key = b?.idempotency_key || req.headers["idempotency-key"] || null;
    if (key && !/^[A-Za-z0-9_.:-]{8,128}$/.test(String(key))) throw new ApiError(400, "bad_idempotency_key", "idempotency_key must be 8-128 letters, digits or . _ : -");
    const hash = db.payloadHash({ method_id: id, run_id: b?.run_id, rating, comment });
    if (key) {
      const prior = Object.values(db.all("reviews")).find((r) => r.principal === p.id && r.idempotency_key === key);
      if (prior) {
        if (prior.request_hash !== hash) throw new ApiError(409, "idempotency_conflict", "This idempotency key was already used with a different review");
        return { review: publicReview(prior), summary: summary(id), replayed: true };
      }
    }
    const e = await eligibility(p, b?.run_id);
    if (!e.eligible) throw new ApiError(e.reason === "already_reviewed" ? 409 : 403, e.reason, e.message, { existing_review_id: e.existing_review_id });
    if (e.method_id !== id) throw new ApiError(409, "wrong_method", `Run ${b.run_id} was for ${e.method_id}, not ${id}`);
    await getMethod(id);
    const rid = db.newId("review");
    const row = db.put("reviews", rid, {
      id: rid, method_id: id, version: e.version, run_id: b.run_id, rating, comment,
      author: authorLabel(p), author_kind: p.kind, purchase_verified: true, run_status: e.run_status,
      created_at: db.nowIso(), principal: p.id, idempotency_key: key, request_hash: hash,
    });
    return { review: publicReview(row), summary: summary(id), replayed: false };
  });
}
