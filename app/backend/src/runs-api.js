// Buyer run lifecycle: drafts, quotes, idempotent payment, execution (sync or async), settlement,
// timeout reclaim, run list, events and operations. See ../API.md "Runs".
//
// State lives in two places:
// - the market contract (authoritative for money: Paid, Released, Refunded), and
// - data/db/*.json (who created the run, phases, operations, idempotency keys).
// The server never stores plaintext buyer data or the buyer's decryption secret.
import { config } from "./config.js";
import { view, callMarket, serverAccountId } from "./near.js";
import { callRunner, checkAttestation } from "./outlayer.js";
import { sha256Hex, fromB64, verifyCompletion } from "./kalis-crypto.js";
import * as db from "./db.js";
import { principal } from "./principal.js";
import { payRoyalty } from "./social-api.js";
import {
  ApiError, HASH, toNear, money, STORAGE_DEPOSIT_YOCTO, PLATFORM_SHARE_PCT,
  getMethod, getVersion, manifestByHash, sealedMethodByHash, chainRun, readExecution, writeExecution,
} from "./market.js";

const QUOTE_TTL_MS = 15 * 60 * 1000;
const GAS_TGAS = 100;
const GAS_PRICE_YOCTO_PER_TGAS = 10n ** 20n; // 0.0001 NEAR per Tgas at the testnet minimum gas price

// ---------- helpers ----------
function idemKey(req, body) {
  const k = body?.idempotency_key || req.headers["idempotency-key"];
  if (k === undefined) return null;
  if (!/^[A-Za-z0-9_.:-]{8,128}$/.test(String(k))) throw new ApiError(400, "bad_idempotency_key", "idempotency_key must be 8-128 letters, digits or . _ : -");
  return String(k);
}

/**
 * Run `fn` once per (principal, scope, key). Same key and same payload returns the stored operation.
 * Same key with a different payload is refused.
 */
async function idempotent(p, scope, key, payload, kind, fn) {
  const hash = db.payloadHash(payload);
  const ik = `${p.id}|${scope}|${key}`;
  if (key) {
    const seen = db.get("idempotency", ik);
    if (seen) {
      if (seen.request_hash !== hash) throw new ApiError(409, "idempotency_conflict", "This idempotency key was already used with a different request");
      const op = db.get("operations", seen.operation_id);
      return { operation: op, replayed: true };
    }
  }
  const opId = db.newId("op");
  const op = db.put("operations", opId, { id: opId, kind, principal: p.id, created_at: db.nowIso(), updated_at: db.nowIso(), status: "pending", idempotency_key: key, request_hash: hash, run_id: payload.run_id || null, result: null, error: null });
  if (key) db.put("idempotency", ik, { operation_id: op.id, request_hash: hash, created_at: op.created_at });
  try {
    const result = await fn(op);
    return { operation: db.update("operations", op.id, (o) => ({ ...o, status: "succeeded", result, updated_at: db.nowIso() })), replayed: false };
  } catch (e) {
    const status = e.outcomeUnknown ? "unknown" : "failed";
    db.update("operations", op.id, (o) => ({ ...o, status, error: { code: e.code || "internal", message: e.message }, updated_at: db.nowIso() }));
    throw e;
  }
}

function addEvent(runId, phase, detail = {}) {
  return db.update("runs", runId, (r) => r && ({ ...r, phase, updated_at: db.nowIso(), events: [...(r.events || []), { phase, at: db.nowIso(), ...detail }] }));
}

function ownRun(p, runId) {
  const r = db.get("runs", runId);
  if (!r) throw new ApiError(404, "unknown_run", `No run "${runId}" on this server`);
  if (r.principal !== p.id) throw new ApiError(403, "not_your_run", "This run belongs to another principal");
  return r;
}

/** Fold the on-chain status into the stored phase (wallet payments and external settlement). */
async function syncPhase(row, onChain) {
  if (!row) return row;
  const target = !onChain ? null : onChain.status === "Paid" ? null : onChain.status === "Released" ? "released" : "refunded";
  if (onChain && row.phase === "payment_pending") row = addEvent(row.id, "paid", { source: "chain" });
  if (target && row.phase !== target) row = addEvent(row.id, target, { source: "chain", reason: onChain.reason });
  return row;
}

async function runView(runId, p) {
  const onChain = await chainRun(runId);
  let row = db.get("runs", runId);
  if (!onChain && !row) throw new ApiError(404, "unknown_run", `No run "${runId}"`);
  row = await syncPhase(row, onChain);
  const cfg = await view(config.market, "get_config");
  const exec = readExecution(runId);
  const owner = row && p && row.principal === p.id;
  const deadlineNs = onChain ? (BigInt(onChain.paid_at_ns) + BigInt(cfg.timeout_ns)).toString() : null;
  return {
    run_id: runId,
    method_id: onChain?.method_id || row?.method_id,
    version: onChain?.version ?? row?.version,
    buyer: onChain?.buyer || null,
    status: onChain?.status || "NotPaid",
    reason: onChain?.reason || null,
    amount: onChain ? money(onChain.amount) : null,
    amount_near: onChain ? toNear(onChain.amount) : null,
    data_ct_sha256: onChain?.data_ct_sha256 || row?.data_ct_sha256,
    paid_at_ns: onChain ? String(onChain.paid_at_ns) : null,
    reclaim_after_ns: deadlineNs,
    reclaimable: Boolean(onChain && onChain.status === "Paid" && BigInt(Date.now()) * 1_000_000n >= BigInt(deadlineNs)),
    phase: row?.phase || (onChain ? onChain.status.toLowerCase() : "unknown"),
    payment: row?.payment || null,
    pay_tx: row?.pay_tx || null,
    pay_tx_url: row?.pay_tx ? `${config.explorer}/transactions/${row.pay_tx}` : null,
    settle_tx: row?.settle_tx || null,
    reclaim_tx: row?.reclaim_tx || null,
    snapshot: row?.snapshot || null,
    input_sources: owner ? (row?.input_sources || []) : undefined,
    owned_by_caller: Boolean(owner),
    execution: exec?.failed ? { failed: exec.failed } : exec ? { call_id: exec.call_id, completion: exec.completion, attestation: exec.attestation, chain: exec.chain, at: exec.at } : null,
    decryption_note: "The answer can only be opened with the secret kept on the buyer's device. The server never has it, so a reload without that secret cannot open the answer.",
  };
}

// ---------- drafts and quotes ----------
function modelChoice(manifest, requested) {
  const allowed = manifest?.ai?.allowed || [];
  if (!allowed.length) {
    if (requested?.length) throw new ApiError(400, "method_uses_no_ai", "This method uses no AI model, so there is nothing to choose");
    return { uses_ai: false, models: [] };
  }
  const models = requested?.length ? requested : allowed;
  const extra = models.filter((m) => !allowed.includes(m));
  if (extra.length) throw new ApiError(400, "model_not_allowed", `Not in the seller's allowlist: ${extra.join(", ")}. A buyer can narrow the list, never widen it.`);
  return { uses_ai: true, models, note: "The runner enforces the seller allowlist from the paid manifest, and a narrower buyer list is passed to the runner as ai_restrict." };
}

function snapshotOf(methodId, v) {
  return { method_id: methodId, version: v.number, code_hash: v.code_hash, manifest_hash: v.manifest_hash, runner_hash: v.runner_hash, price: v.price, dao_share_pct: v.dao_share_pct, kind: v.method_kind?.kind || "wasm" };
}

// H5: where each input came from. A changed source (new document revision, re-extraction, edited
// value) clears consent like any other change of terms. Values themselves are never stored.
const SOURCE_KINDS = ["typed", "document", "connector", "memory", "browser", "file_import"];
function inputSources(list) {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list) || list.length > 50) throw new ApiError(400, "bad_input_sources", "input_sources must be an array of at most 50 items");
  return list.map((x, i) => {
    if (!SOURCE_KINDS.includes(x?.kind)) throw new ApiError(400, "bad_input_sources", `input_sources[${i}].kind must be one of ${SOURCE_KINDS.join(", ")}`);
    if (x.sha256 && !HASH.test(x.sha256)) throw new ApiError(400, "bad_input_sources", `input_sources[${i}].sha256 must be 64 hex chars`);
    return { field: String(x.field || "").slice(0, 80), kind: x.kind, ref: String(x.ref || "").slice(0, 120) || null, sha256: x.sha256 || null,
      revision: Number.isInteger(x.revision) ? x.revision : 1, reviewed_by_buyer: x.reviewed_by_buyer === true,
      note: x.kind === "document" && x.reviewed_by_buyer !== true ? "Extraction not reviewed by the buyer yet. It must not be treated as fact." : null };
  });
}

function ownDraft(p, id) {
  const d = db.get("run_drafts", id);
  if (!d) throw new ApiError(404, "unknown_draft", "No such draft");
  if (d.principal !== p.id) throw new ApiError(403, "not_your_draft", "This draft belongs to another principal");
  return d;
}

function quoteFor(d) {
  const price = BigInt(d.snapshot.price);
  const gasBound = BigInt(GAS_TGAS) * GAS_PRICE_YOCTO_PER_TGAS;
  return {
    method_price: money(price, { note: "Held in escrow, then split on success or refunded on a failed stage." }),
    storage_deposit: money(STORAGE_DEPOSIT_YOCTO, { note: "Attached with the payment. The contract keeps only the storage the run record uses and refunds the rest in the same transaction." }),
    infra_fee: money(0, { note: "Not charged in this MVP. The platform pays OutLayer and NEAR AI usage from its own keys." }),
    gas: money(gasBound, { note: `Upper bound for ${GAS_TGAS} Tgas. With the mock fiat top-up the platform demo account pays it; with a wallet the buyer pays it.` }),
    max_total: money(price + STORAGE_DEPOSIT_YOCTO + gasBound),
    attach_deposit: money(price + STORAGE_DEPOSIT_YOCTO),
    allocation_base: { applies_to: "method_price", seller_pct: 100 - d.snapshot.dao_share_pct - PLATFORM_SHARE_PCT, dao_pct: d.snapshot.dao_share_pct, platform_pct: PLATFORM_SHARE_PCT, note: "Only the method price is split. Storage, gas and infrastructure are not." },
  };
}

// ---------- payment ----------
async function createRun(p, { method_id, version, data_ct_sha256, payment, draft, quote }) {
  const { v } = await getVersion(method_id, version);
  if (!v.runnable) throw new ApiError(409, "not_runnable", "This version has no published sealed build or manifest on this server");
  const run_id = db.newId("run").slice(0, 64);
  const deposit = (BigInt(v.price) + STORAGE_DEPOSIT_YOCTO).toString();
  const args = { run_id, method_id, version: v.number, data_ct_sha256 };
  const snapshot = snapshotOf(method_id, v);
  db.put("runs", run_id, { id: run_id, created_at: db.nowIso(), updated_at: db.nowIso(), principal: p.id, method_id, version: v.number, data_ct_sha256, payment, draft_id: draft?.id || null, quote_id: quote?.id || null, snapshot, input_sources: draft?.input_sources || [], phase: "payment_pending", events: [{ phase: "payment_pending", at: db.nowIso() }] });
  if (payment === "wallet") {
    return { run_id, payment, version: v.number, price_near: v.price_near, snapshot,
      contract_call: { receiver_id: config.market, method_name: "pay_for_run", args, deposit_yocto: deposit, gas_tgas: GAS_TGAS },
      next: "Sign this call with the buyer's NEAR wallet, then poll GET /api/runs/:id until status is Paid." };
  }
  let r;
  try {
    r = await callMarket("demoBuyer", "pay_for_run", args, deposit);
  } catch (e) {
    // The request may have reached the chain. Look before declaring failure, so a retry never pays twice.
    const onChain = await chainRun(run_id).catch(() => null);
    if (onChain) { addEvent(run_id, "paid", { source: "chain_after_error" }); return { run_id, payment, version: v.number, snapshot, recovered: true, run: onChain }; }
    addEvent(run_id, "payment_failed", { error: e.message });
    throw Object.assign(new ApiError(502, "payment_failed", `pay_for_run failed: ${e.message}`), { outcomeUnknown: false });
  }
  if (r.failure) { addEvent(run_id, "payment_failed", { error: r.failure }); throw new ApiError(502, "payment_failed", `pay_for_run failed: ${r.failure}`); }
  db.update("runs", run_id, (x) => ({ ...x, pay_tx: r.txHash }));
  addEvent(run_id, "paid", { tx: r.txHash });
  return { run_id, payment, payment_label: "Mock fiat top-up. Paid on NEAR testnet by the platform demo buyer account.",
    version: v.number, price_near: v.price_near, snapshot, pay_tx: r.txHash, pay_tx_url: `${config.explorer}/transactions/${r.txHash}`,
    run: await chainRun(run_id) };
}

// ---------- execution ----------
const inFlight = new Map();

async function execute(runId, data) {
  const onChain = await chainRun(runId);
  if (!onChain) throw new ApiError(404, "unknown_run", `No run "${runId}"`);
  const cached = readExecution(runId);
  if (cached?.output) return { ...cached, cached: true };
  if (onChain.status !== "Paid") throw new ApiError(409, "not_payable_state", `Run is ${onChain.status}, not Paid`);
  if (!data?.ct || !data?.epk || !data?.nonce) throw new ApiError(400, "bad_sealed_data", "data must be the sealed blob {epk, nonce, ct}");
  if (sha256Hex(fromB64(data.ct)) !== onChain.data_ct_sha256) throw new ApiError(409, "data_mismatch", "This sealed data is not the data the payment committed to");
  if (inFlight.has(runId)) return inFlight.get(runId);
  const job = (async () => {
    const { v } = await getVersion(onChain.method_id, onChain.version);
    const manifestText = manifestByHash(onChain.method_id, v.manifest_hash);
    const sealedMethod = sealedMethodByHash(onChain.method_id, v.code_hash);
    addEvent(runId, "executing");
    const input = { cmd: "run", run_id: runId, manifest: manifestText, method: sealedMethod.sealed, data };
    // H3: a buyer who narrowed the seller's model list on the draft gets that narrower list enforced
    // by the runner (runner 0.6+). Older runners ignore the field, which is why capabilities says read_only until then.
    const row = db.get("runs", runId);
    const draft = row?.draft_id ? db.get("run_drafts", row.draft_id) : null;
    const allowed = JSON.parse(manifestText).ai?.allowed || [];
    if (draft?.models?.uses_ai && draft.models.models.length < allowed.length) input.ai_restrict = draft.models.models;
    let res;
    const pending = db.get("runs", runId)?.pending_call_id || null;
    try { res = await callRunner(input, { resumeCallId: pending }); } catch (e) {
      // OutLayer can queue for minutes on testnet. Keep the call id so a retry resumes the same call.
      if (e.code === "outlayer_timeout" && e.callId) db.update("runs", runId, (r) => ({ ...r, pending_call_id: e.callId, updated_at: db.nowIso() }));
      addEvent(runId, "execution_failed", { error: e.message, call_id: e.callId, retryable: true }); throw e;
    }
    if (pending) db.update("runs", runId, (r) => ({ ...r, pending_call_id: null, updated_at: db.nowIso() }));
    if (res.status !== "completed" || !res.output?.ok) {
      const failed = { status: res.status, error: res.error || res.output?.error || "runner did not complete", call_id: res.call_id };
      writeExecution(runId, { failed, at: new Date().toISOString() });
      addEvent(runId, "execution_failed", { error: failed.error, call_id: res.call_id, retryable: false });
      throw new ApiError(502, "runner_failed", failed.error);
    }
    const completion = verifyCompletion(res.output, (await view(config.market, "get_config")).runner_pubkey);
    const attestation = await checkAttestation(res.call_id, { inputText: res.inputText, output: res.output, runnerHash: v.runner_hash });
    const execution = {
      call_id: res.call_id, instructions: res.instructions, time_ms: res.time_ms, output: res.output,
      completion: { record: completion.record, signature_valid: completion.sigOk, key_matches_market: completion.keyOk },
      attestation, chain: { method_sha256: v.code_hash, manifest_sha256: v.manifest_hash, runner_hash: v.runner_hash },
      at: new Date().toISOString(),
    };
    writeExecution(runId, execution);
    addEvent(runId, "executed", { call_id: res.call_id, all_ok: completion.record.all_ok });
    return execution;
  })();
  inFlight.set(runId, job);
  try { return await job; } finally { inFlight.delete(runId); }
}

async function settle(runId, body) {
  const onChain = await chainRun(runId);
  if (!onChain) throw new ApiError(404, "unknown_run", `No run "${runId}"`);
  if (onChain.status !== "Paid") return { already_settled: true, status: onChain.status, run: await runView(runId) };
  const exec = readExecution(runId);
  const completion = body?.completion || exec?.output?.completion;
  const signature = body?.signature || exec?.output?.completion_sig;
  if (!completion || !signature) throw new ApiError(409, "no_completion", "Execute the run first, or pass {completion, signature}");
  const method = await getMethod(onChain.method_id);
  addEvent(runId, "settling");
  const r = await callMarket("settler", "settle", { run_id: runId, completion, signature }, "0", 100);
  if (r.failure) { addEvent(runId, "settle_failed", { error: r.failure }); throw new ApiError(422, "settle_rejected", `settle was rejected: ${r.failure}`); }
  db.update("runs", runId, (x) => x && ({ ...x, settle_tx: r.txHash }));
  const after = await chainRun(runId);
  addEvent(runId, after.status.toLowerCase(), { tx: r.txHash, reason: after.reason });
  const v = method.versions.find((x) => x.number === onChain.version);
  const total = BigInt(onChain.amount);
  const dao = (await view(config.market, "get_config")).dao;
  const toSeller = total * BigInt(100 - v.dao_share_pct - PLATFORM_SHARE_PCT) / 100n;
  const toDao = total * BigInt(v.dao_share_pct) / 100n;
  const payouts = after.status === "Released"
    ? { seller: { account: method.owner, near: toNear(toSeller), amount: money(toSeller) }, dao: { account: dao, near: toNear(toDao), amount: money(toDao) }, platform: { near: toNear(total - toSeller - toDao), amount: money(total - toSeller - toDao) } }
    : { buyer_refund: { account: onChain.buyer, near: toNear(total), amount: money(total) } };
  const royalty = after.status === "Released" ? await payRoyalty(runId).catch((e) => ({ error: e.message })) : null; // social-api.js: contributor royalty
  return { settle_tx: r.txHash, settle_tx_url: `${config.explorer}/transactions/${r.txHash}`, status: after.status, reason: after.reason, payouts, royalty, run: await runView(runId) };
}

// ---------- routes ----------
export function registerRunRoutes(route) {
  // A job cannot still be running after a restart: nothing in this process is polling it. Mark it stopped
  // so the buyer sees "retry or reclaim" instead of "Running" forever. Paying again is never needed.
  for (const r of Object.values(db.all("runs"))) {
    if (r.phase === "executing") addEvent(r.id, "execution_failed", { error: "The server restarted while this job was running. Run it again to continue, or reclaim the payment after the escrow timeout.", retryable: true });
  }
  route("GET", /^\/api\/runs$/, async (q, _m, _b, req) => {
    const p = principal(req);
    let rows = Object.values(db.all("runs")).filter((r) => r.principal === p.id);
    if (q.get("method_id")) rows = rows.filter((r) => r.method_id === q.get("method_id"));
    if (q.get("phase")) rows = rows.filter((r) => r.phase === q.get("phase"));
    const page = db.paginate(rows, { cursor: q.get("cursor"), limit: q.get("limit") });
    return { principal: { id: p.id, demo: p.demo }, items: page.items.map(({ events, ...r }) => ({ ...r, last_event: events?.at(-1) || null })), next_cursor: page.next_cursor, order: "created_at desc" };
  });

  // Drafts: metadata only. The sealed data itself is never stored here.
  route("POST", /^\/api\/run-drafts$/, async (_q, _m, b, req) => {
    const p = principal(req);
    const { v } = await getVersion(b?.method_id, b?.version);
    if (b?.data_ct_sha256 && !HASH.test(b.data_ct_sha256)) throw new ApiError(400, "bad_data_hash", "data_ct_sha256 must be 64 lowercase hex chars");
    const id = db.newId("draft");
    return db.put("run_drafts", id, {
      id, principal: p.id, created_at: db.nowIso(), updated_at: db.nowIso(), revision: 1,
      name: String(b?.name || "").slice(0, 120) || null, snapshot: snapshotOf(b.method_id, v),
      data_ct_sha256: b?.data_ct_sha256 || null, models: modelChoice(v.manifest, b?.models), consents: [], state: "draft",
      input_sources: inputSources(b?.input_sources),
    });
  });
  route("GET", /^\/api\/run-drafts\/([^/]+)$/, async (_q, [id], _b, req) => ownDraft(principal(req), id));
  route("PATCH", /^\/api\/run-drafts\/([^/]+)$/, async (_q, [id], b, req) => {
    const p = principal(req);
    const d = ownDraft(p, id);
    if (Number(b?.expected_revision) !== d.revision) throw new ApiError(409, "revision_conflict", `Draft is at revision ${d.revision}`, { revision: d.revision });
    if (d.state !== "draft") throw new ApiError(409, "draft_closed", `Draft is ${d.state}`);
    const next = { ...d, revision: d.revision + 1, updated_at: db.nowIso() };
    let termsChanged = false;
    if (b.version !== undefined && Number(b.version) !== d.snapshot.version) { next.snapshot = snapshotOf(d.snapshot.method_id, (await getVersion(d.snapshot.method_id, b.version)).v); termsChanged = true; }
    if (b.data_ct_sha256 !== undefined) { if (!HASH.test(b.data_ct_sha256)) throw new ApiError(400, "bad_data_hash", "data_ct_sha256 must be 64 lowercase hex chars"); termsChanged ||= b.data_ct_sha256 !== d.data_ct_sha256; next.data_ct_sha256 = b.data_ct_sha256; }
    if (b.models !== undefined) { next.models = modelChoice((await getVersion(d.snapshot.method_id, next.snapshot.version)).v.manifest, b.models); termsChanged = true; }
    if (b.name !== undefined) next.name = String(b.name).slice(0, 120);
    if (b.input_sources !== undefined) { next.input_sources = inputSources(b.input_sources); termsChanged = true; }
    if (termsChanged) { next.consents = []; next.consent_invalidated_at = db.nowIso(); }
    return db.put("run_drafts", id, next);
  });
  // Consent is bound to one revision. Any later change of terms clears it.
  route("POST", /^\/api\/run-drafts\/([^/]+)\/consents$/, async (_q, [id], b, req) => {
    const p = principal(req);
    const d = ownDraft(p, id);
    if (Number(b?.revision) !== d.revision) throw new ApiError(409, "revision_conflict", `Consent must name the current revision ${d.revision}`);
    const kinds = ["method_terms", "permissions", "prompt_method_nature"];
    if (!kinds.includes(b?.kind)) throw new ApiError(400, "bad_consent", `kind must be one of ${kinds.join(", ")}`);
    const c = { id: db.newId("consent"), kind: b.kind, revision: d.revision, manifest_hash: d.snapshot.manifest_hash, actor: p.id, at: db.nowIso() };
    return db.put("run_drafts", id, { ...d, consents: [...d.consents.filter((x) => x.kind !== b.kind), c] });
  });
  route("POST", /^\/api\/run-drafts\/([^/]+)\/quote$/, async (_q, [id], b, req) => {
    const p = principal(req);
    const d = ownDraft(p, id);
    if (Number(b?.expected_revision) !== d.revision) throw new ApiError(409, "revision_conflict", `Draft is at revision ${d.revision}`);
    const qid = db.newId("quote");
    return db.put("quotes", qid, { id: qid, draft_id: id, principal: p.id, revision: d.revision, snapshot: d.snapshot, created_at: db.nowIso(), expires_at: new Date(Date.now() + QUOTE_TTL_MS).toISOString(), ...quoteFor(d) });
  });

  // Create and pay a run. Retry-safe with an idempotency key (body or Idempotency-Key header).
  route("POST", /^\/api\/runs$/, async (_q, _m, body, req) => {
    const p = principal(req);
    let { method_id, version, data_ct_sha256, payment = "demo_topup", quote_id } = body || {};
    if (!["demo_topup", "wallet"].includes(payment)) throw new ApiError(400, "bad_payment", 'payment must be "demo_topup" or "wallet"');
    let draft = null, quote = null;
    // The idempotency payload is the request exactly as sent, so a retry is recognised before any
    // state checks (the draft is already closed by the first payment).
    const key = idemKey(req, body);
    const payload = { method_id: method_id || null, version: version ? Number(version) : null, data_ct_sha256: data_ct_sha256 || null, payment, quote_id: quote_id || null };
    if (key) {
      const seen = db.get("idempotency", `${p.id}|create_run|${key}`);
      if (seen) {
        if (seen.request_hash !== db.payloadHash(payload)) throw new ApiError(409, "idempotency_conflict", "This idempotency key was already used with a different request");
        const op = db.get("operations", seen.operation_id);
        return { ...(op.result || {}), operation_id: op.id, operation_status: op.status, idempotency_key: key, replayed: true };
      }
    }
    if (quote_id) {
      quote = db.get("quotes", quote_id);
      if (!quote || quote.principal !== p.id) throw new ApiError(404, "unknown_quote", "No such quote for this principal");
      if (Date.parse(quote.expires_at) < Date.now()) throw new ApiError(409, "quote_expired", "The quote expired. Request a new one.");
      draft = db.get("run_drafts", quote.draft_id);
      if (draft.revision !== quote.revision) throw new ApiError(409, "draft_changed", "The draft changed after this quote. Request a new quote.");
      if (draft.state !== "draft") throw new ApiError(409, "draft_closed", `Draft is ${draft.state}`);
      method_id = draft.snapshot.method_id; version = draft.snapshot.version; data_ct_sha256 ||= draft.data_ct_sha256;
      if (draft.data_ct_sha256 && data_ct_sha256 !== draft.data_ct_sha256) throw new ApiError(409, "data_changed", "data_ct_sha256 differs from the draft");
    }
    if (!HASH.test(data_ct_sha256 || "")) throw new ApiError(400, "bad_data_hash", "data_ct_sha256 must be 64 lowercase hex chars (sha256 of the sealed data ciphertext)");
    const { operation, replayed } = await idempotent(p, "create_run", key, payload, "payment", () => createRun(p, { method_id, version, data_ct_sha256, payment, draft, quote }));
    if (draft) db.update("run_drafts", draft.id, (d) => ({ ...d, state: "paid", run_id: operation.result.run_id }));
    return { ...operation.result, operation_id: operation.id, idempotency_key: key, replayed };
  });

  route("GET", /^\/api\/operations\/([^/]+)$/, async (_q, [id], _b, req) => {
    const op = db.get("operations", id);
    if (!op || op.principal !== principal(req).id) throw new ApiError(404, "unknown_operation", "No such operation for this principal");
    return op;
  });

  route("GET", /^\/api\/runs\/([^/]+)$/, async (_q, [id], _b, req) => runView(id, principal(req)));

  route("GET", /^\/api\/runs\/([^/]+)\/events$/, async (_q, [id], _b, req) => {
    const r = ownRun(principal(req), id);
    await syncPhase(r, await chainRun(id));
    const row = db.get("runs", id);
    const retryable = ["execution_failed", "payment_failed", "settle_failed"].includes(row.phase) && row.events.at(-1)?.retryable !== false;
    return { run_id: id, phase: row.phase, retryable, events: row.events };
  });

  // Execute. Default waits for the result (10 s to 3 min). With {"async": true} it returns an operation to poll.
  route("POST", /^\/api\/runs\/([^/]+)\/execute$/, async (_q, [id], body, req) => {
    const p = principal(req);
    if (!body?.async) return execute(id, body?.data);
    const opId = db.newId("op");
    db.put("operations", opId, { id: opId, kind: "execution", principal: p.id, run_id: id, created_at: db.nowIso(), updated_at: db.nowIso(), status: "pending", result: null, error: null });
    execute(id, body.data)
      .then((r) => db.update("operations", opId, (o) => ({ ...o, status: "succeeded", result: { run_id: id, call_id: r.call_id, all_ok: r.completion?.record?.all_ok }, updated_at: db.nowIso() })))
      .catch((e) => db.update("operations", opId, (o) => ({ ...o, status: "failed", error: { code: e.code || "internal", message: e.message }, updated_at: db.nowIso() })));
    return { operation_id: opId, status: "pending", poll: `/api/operations/${opId}`, result_at: `/api/runs/${id}/execution` };
  });
  route("GET", /^\/api\/runs\/([^/]+)\/execution$/, async (_q, [id]) => {
    const e = readExecution(id);
    if (!e) throw new ApiError(404, "not_executed", "This run has not been executed yet");
    return e;
  });

  route("POST", /^\/api\/runs\/([^/]+)\/settle$/, async (_q, [id], body) => settle(id, body));

  // Timeout reclaim through the contract's refund_expired. Only the buyer may call it on chain.
  route("POST", /^\/api\/runs\/([^/]+)\/reclaim$/, async (_q, [id], body, req) => {
    const p = principal(req);
    const r = await runView(id, p);
    if (r.status !== "Paid") return { reclaimed: false, status: r.status, reason: r.reason, run: r };
    if (!r.reclaimable) throw new ApiError(409, "not_expired", `The run can be reclaimed after ${new Date(Number(BigInt(r.reclaim_after_ns) / 1_000_000n)).toISOString()}`, { reclaim_after_ns: r.reclaim_after_ns });
    const call = { receiver_id: config.market, method_name: "refund_expired", args: { run_id: id }, deposit_yocto: "0", gas_tgas: 50 };
    if (r.buyer !== serverAccountId("demoBuyer")) return { reclaimed: false, contract_call: call, next: "Sign this call with the buyer's NEAR wallet." };
    const row = db.get("runs", id);
    if (!row || row.principal !== p.id) throw new ApiError(403, "not_your_run", "Only the principal who created this mock top-up run can reclaim it");
    const { operation, replayed } = await idempotent(p, "reclaim", idemKey(req, body) || `reclaim-${id}`, { run_id: id }, "reclaim", async () => {
      const t = await callMarket("demoBuyer", "refund_expired", { run_id: id }, "0", 50);
      if (t.failure) throw new ApiError(422, "reclaim_rejected", `refund_expired was rejected: ${t.failure}`);
      db.update("runs", id, (x) => ({ ...x, reclaim_tx: t.txHash }));
      addEvent(id, "refunded", { tx: t.txHash, reason: "no completion before the timeout" });
      return { tx: t.txHash, tx_url: `${config.explorer}/transactions/${t.txHash}` };
    });
    return { reclaimed: true, ...operation.result, operation_id: operation.id, replayed, run: await runView(id, p) };
  });
}
