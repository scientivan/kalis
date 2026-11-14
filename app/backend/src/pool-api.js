// Social Money pools (docs-social-money.md "Pools").
//
// 1. Crowdfunded bounty, ESCROWED (v2). Pledges are NEAR locked in the pool contract (app/pool-contract,
//    POOL_CONTRACT, default kalis-pools-1114.testnet). The chain is the only record: this API reads pools from
//    the contract and returns UNSIGNED calls (create_pool, pledge, release, refund, mark_rejected) that the
//    user's own wallet signs. The contract pays the whole pool to the receiver of a BountyDone proposal for the
//    pool's bounty only after reading it as Approved from the DAO; after the deadline each pledger refunds
//    their own pledge. Kalis holds no key that can move pool funds.
// 2. Group purchase of a run. Members send their share to the organizer (checked on chain), the organizer pays
//    one run through the market escrow. The answer is sealed to the organizer's tab. The organizer's device then
//    re-seals it to each member's device key (X25519, app/web/src/lib/backend/group-seal.js) and uploads only
//    ciphertext here; each member opens it on their own device. Re-sealing happens on the organizer's device,
//    not in the TEE.
import { config } from "./config.js";
import { view, rpc, clearReadCache } from "./near.js";
import * as db from "./db.js";
import { principal } from "./principal.js";
import { ApiError } from "./market.js";

const YOCTO = 10n ** 24n;
const ACCOUNT_RE = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
const toYocto = (near) => {
  const s = String(near ?? "").trim();
  if (!/^\d+(\.\d{1,6})?$/.test(s)) throw new ApiError(400, "bad_amount", "Amount must be a NEAR number with at most 6 decimals");
  const [w, f = ""] = s.split(".");
  const y = BigInt(w) * YOCTO + BigInt((f + "000000").slice(0, 6)) * 10n ** 18n;
  if (y <= 0n) throw new ApiError(400, "bad_amount", "Amount must be above zero");
  return y;
};
const fmt = (y) => { const b = BigInt(y); const w = b / YOCTO; const f = (b % YOCTO).toString().padStart(24, "0").slice(0, 6).replace(/0+$/, ""); return f ? `${w}.${f}` : `${w}`; };
const explorer = (tx) => `https://testnet.nearblocks.io/txns/${tx}`;

function needAccount(req, what) {
  const p = principal(req);
  if (p.kind !== "near_account") throw new ApiError(401, "login_required", `Sign in with your NEAR account to ${what}. A demo workspace cannot do it.`);
  return p.account_id;
}
function checkAccount(a) {
  if (typeof a !== "string" || a.length < 2 || a.length > 64 || !ACCOUNT_RE.test(a)) throw new ApiError(400, "bad_account", `${a} is not a NEAR account id`);
  return a;
}

/** Read a transaction on chain and return the NEAR it moved from `signer` to `receiver` (yocto), or throw. */
export async function verifyTransfer(txHash, signer, receiver) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(String(txHash))) throw new ApiError(400, "bad_tx", "tx_hash is not a NEAR transaction hash");
  let r;
  try { r = await rpc("tx", { tx_hash: txHash, sender_account_id: signer, wait_until: "FINAL" }); }
  catch (e) { throw new ApiError(404, "tx_not_found", `Transaction ${txHash} signed by ${signer} was not found on testnet (${e.message})`); }
  if (!r.status || r.status.Failure) throw new ApiError(400, "tx_failed", "The transaction failed on chain");
  const t = r.transaction;
  if (t.signer_id !== signer) throw new ApiError(400, "tx_wrong_signer", `The transaction was signed by ${t.signer_id}, not ${signer}`);
  if (t.receiver_id !== receiver) throw new ApiError(400, "tx_wrong_receiver", `The transaction went to ${t.receiver_id}, not ${receiver}`);
  const sum = t.actions.reduce((s, a) => s + (a.Transfer ? BigInt(a.Transfer.deposit) : 0n), 0n);
  if (sum === 0n) throw new ApiError(400, "tx_no_transfer", "The transaction has no NEAR transfer");
  return sum;
}
function usedTx(txHash) {
  const all = Object.values(db.all("group_runs")).flatMap((g) => g.members.map((m) => m.share_tx));
  if (all.includes(txHash)) throw new ApiError(409, "tx_already_used", "This transaction is already counted in a pool");
}

// ---------- crowdfunded bounty (escrow contract) ----------
const POOLS = process.env.POOL_CONTRACT || "kalis-pools-1114.testnet";
const call = (receiver_id, method_name, args, deposit_yocto, gas_tgas, signer) => ({ receiver_id, method_name, args, deposit_yocto: String(deposit_yocto), gas_tgas, ...(signer ? { signer_must_be: signer } : {}) });
const nsToIso = (ns) => new Date(Number(BigInt(ns) / 1_000_000n)).toISOString();

/** BountyDone proposals for a DAO bounty submitted at or after `sinceNs`, read from chain. */
async function doneProposals(dao, bountyId, sinceNs) {
  const since = BigInt(sinceNs);
  const last = await view(dao, "get_last_proposal_id");
  const out = [];
  for (let i = 0; i < last; i += 50) {
    const ps = await view(dao, "get_proposals", { from_index: i, limit: 50 });
    out.push(...ps.filter((p) => p.kind?.BountyDone && Number(p.kind.BountyDone.bounty_id) === Number(bountyId) && BigInt(p.submission_time) >= since));
  }
  return out.map((p) => ({ proposal_id: p.id, receiver_id: p.kind.BountyDone.receiver_id, status: p.status }));
}

async function poolView(p, dao, who) {
  const dones = await doneProposals(dao, p.bounty_id, p.created_ns).catch(() => []);
  const approved = dones.find((d) => d.status === "Approved");
  const rejected = dones.find((d) => ["Rejected", "Removed", "Expired"].includes(d.status));
  const pending = dones.find((d) => d.status === "InProgress");
  const pastDeadline = Date.now() * 1e6 >= Number(p.deadline_ns);
  const mine = who ? BigInt(await view(POOLS, "get_pledge", { pool_id: p.id, account_id: who })) : 0n;
  const state = p.state === "Open" && pastDeadline ? "refunding" : p.state.toLowerCase();
  const calls = {};
  if (who && p.state === "Open" && !pastDeadline) calls.pledge = { method: "pledge", note: "attach the amount you lock" };
  if (who && p.state === "Open" && approved && BigInt(p.total) > 0n) calls.release = call(POOLS, "release", { pool_id: p.id, proposal_id: approved.proposal_id }, 0, 100);
  if (who && p.state === "Open" && !approved && rejected) calls.mark_rejected = call(POOLS, "mark_rejected", { pool_id: p.id, proposal_id: rejected.proposal_id }, 0, 100);
  if (who && mine > 0n && (p.state === "Refunding" || (p.state === "Open" && pastDeadline))) calls.refund = call(POOLS, "refund", { pool_id: p.id }, 0, 30, who);
  return {
    id: p.id, title: p.title, dao, dao_bounty_id: p.bounty_id, creator: p.creator, contract: POOLS,
    created_at: nsToIso(p.created_ns), deadline: nsToIso(p.deadline_ns), state, refund_reason: p.refund_reason || (state === "refunding" && p.state === "Open" ? "deadline_passed" : null),
    released_to: p.released_to || null, release_proposal_id: p.proposal_id ?? null,
    custody: `escrow: pledged NEAR is locked in ${POOLS}. It goes to the contributor only after the DAO approves their BountyDone; after the deadline each pledger takes their own pledge back.`,
    locked_near: fmt(p.total), pledgers: p.pledgers, my_pledge_near: mine > 0n ? fmt(mine) : null,
    proposals: dones, approved_proposal: approved || null, pending_proposal: pending || null,
    contract_calls: calls, allowed_actions: Object.keys(calls),
  };
}
const me = (req) => { const p = principal(req); return p.kind === "near_account" ? p.account_id : null; };
async function chainPool(id) {
  clearReadCache(); // pool state changes with every signed pledge or refund; read it fresh
  const p = Number.isInteger(Number(id)) ? await view(POOLS, "get_pool", { pool_id: Number(id) }) : null;
  if (!p) throw new ApiError(404, "unknown_pool", "No such bounty pool on the pool contract");
  return p;
}
const poolDao = async () => view(POOLS, "get_dao");

// ---------- group run ----------
function groupView(g, who) {
  const share = BigInt(g.share_yocto);
  const collected = g.members.filter((m) => m.share_tx).reduce((s, m) => s + BigInt(m.share_paid_yocto), 0n);
  const mine = g.members.find((m) => m.account_id === who) || null;
  const allPaid = g.members.every((m) => m.share_tx);
  const allowed = [];
  if (mine && !mine.share_tx && g.state === "collecting") allowed.push("pay_share");
  if (who === g.organizer && allPaid && !g.run_id) allowed.push("link_run");
  if (mine) allowed.push("set_device_key");
  if (who === g.organizer && g.run_id && g.members.some((m) => m.device_key && !g.sealed_results?.[m.account_id])) allowed.push("seal_results");
  return {
    id: g.id, title: g.title, method_id: g.method_id, organizer: g.organizer, created_at: g.created_at, state: g.state,
    custody: "the organizer: members send their share to the organizer's own account, the organizer pays the run through the market escrow",
    price_near: fmt(g.price_yocto), share_near: fmt(share), collected_near: fmt(collected), organizer_share_near: fmt(BigInt(g.price_yocto) - share * BigInt(g.members.length)),
    members: g.members.map((m) => ({ account_id: m.account_id, share_tx: m.share_tx || null, explorer: m.share_tx ? explorer(m.share_tx) : null, device_key: m.device_key || null, result_sealed: !!g.sealed_results?.[m.account_id] })),
    run: g.run_id ? { run_id: g.run_id, pay_tx: g.run_pay_tx, explorer: explorer(g.run_pay_tx), phase: g.run_phase } : null,
    result_sharing: "The run's answer is sealed to the organizer's tab. The organizer's device re-seals it to each member's device key and uploads only ciphertext; each member opens it on their own device. The re-sealing happens on the organizer's device, not inside the TEE.",
    my_sealed_result: mine && g.sealed_results?.[mine.account_id] ? g.sealed_results[mine.account_id] : null,
    share_call: mine && !mine.share_tx ? { kind: "transfer", receiver_id: g.organizer, deposit_yocto: g.share_yocto, signer_must_be: who } : null,
    allowed_actions: allowed,
  };
}
function getGroup(id) { const g = db.get("group_runs", id); if (!g) throw new ApiError(404, "unknown_group_run", "No such group purchase"); return g; }

export function registerPoolRoutes(route) {
  route("GET", /^\/api\/pools\/bounties$/, async (q, _m, _b, req) => {
    clearReadCache();
    const dao = await poolDao();
    const rows = await view(POOLS, "get_pools", { from_index: 0, limit: 100 });
    const bid = q.get("dao_bounty_id");
    const items = await Promise.all(rows.filter((p) => bid == null || String(p.bounty_id) === bid).map((p) => poolView(p, dao, me(req))));
    return { contract: POOLS, dao, items: items.sort((a, b) => b.id - a.id) };
  });
  route("GET", /^\/api\/pools\/bounties\/([^/]+)$/, async (_q, [id], _b, req) => poolView(await chainPool(id), await poolDao(), me(req)));

  // Unsigned create_pool. The pool exists once the creator's wallet signs it.
  route("POST", /^\/api\/pools\/bounties$/, async (_q, _m, b, req) => {
    const creator = needAccount(req, "start a bounty pool");
    const dao = await poolDao();
    const bid = Number(b?.dao_bounty_id);
    const bounty = Number.isInteger(bid) ? (await view(dao, "get_bounties", { from_index: 0, limit: 200 })).find((x) => x.id === bid) : null;
    if (!bounty) throw new ApiError(400, "unknown_bounty", `dao_bounty_id must be a bounty that exists in ${dao}`);
    const days = Number(b?.deadline_days ?? 7);
    if (!(days > 0 && days <= 90)) throw new ApiError(400, "bad_deadline", "The deadline must be in the next 90 days");
    const deadline_ns = String(BigInt(Date.now() + Math.round(days * 86400000)) * 1_000_000n);
    return { contract_call: call(POOLS, "create_pool", { bounty_id: bid, title: String(b?.title || bounty.description).slice(0, 200), deadline_ns }, 0, 30, creator) };
  });

  // Unsigned pledge: the deposit is locked in the contract.
  route("POST", /^\/api\/pools\/bounties\/([^/]+)\/pledges$/, async (_q, [id], b, req) => {
    const acct = needAccount(req, "pledge to a bounty");
    const p = await chainPool(id);
    if (p.state !== "Open" || Date.now() * 1e6 >= Number(p.deadline_ns)) throw new ApiError(409, "pool_closed", "This pool takes no new pledges");
    const amount = toYocto(b?.amount_near);
    if (amount < 10n ** 22n) throw new ApiError(400, "bad_amount", "A pledge is at least 0.01 NEAR");
    return { contract_call: call(POOLS, "pledge", { pool_id: p.id }, amount, 30, acct) };
  });

  for (const action of ["release", "refund", "mark_rejected"]) {
    route("POST", new RegExp(`^/api/pools/bounties/([^/]+)/${action.replace("_", "-")}$`), async (_q, [id], _b, req) => {
      const acct = needAccount(req, action.replace("_", " "));
      const v = await poolView(await chainPool(id), await poolDao(), acct);
      const c = v.contract_calls[action];
      if (!c) throw new ApiError(409, `cannot_${action}`, action === "release" ? "The DAO has not approved a BountyDone for this bounty since the pool started" : action === "refund" ? "Refunds open after the deadline or a rejected BountyDone, and only for your own pledge" : "No rejected BountyDone for this bounty");
      return { contract_call: c, pool: v };
    });
  }

  // ---------- group run ----------
  route("GET", /^\/api\/pools\/group-runs$/, async (q, _m, _b, req) => {
    const who = me(req);
    const method = q.get("method_id");
    const rows = Object.values(db.all("group_runs")).filter((g) => (!method || g.method_id === method) && (q.get("all") === "1" || !who || g.organizer === who || g.members.some((m) => m.account_id === who)));
    return { items: rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((g) => groupView(g, who)) };
  });
  route("GET", /^\/api\/pools\/group-runs\/([^/]+)$/, async (_q, [id], _b, req) => groupView(getGroup(id), me(req)));

  route("POST", /^\/api\/pools\/group-runs$/, async (_q, _m, b, req) => {
    const organizer = needAccount(req, "start a group purchase");
    const method = await view(config.market, "get_method", { method_id: String(b?.method_id || "") }).catch(() => null);
    if (!method) throw new ApiError(400, "unknown_method", "method_id is not a method on the market contract");
    const members = [...new Set((b?.members || []).map(checkAccount))].filter((a) => a !== organizer);
    if (members.length < 1 || members.length > 9) throw new ApiError(400, "bad_members", "Name 1 to 9 other members");
    const latest = await view(config.market, "get_version", { method_id: method.method_id });
    if (!latest) throw new ApiError(400, "no_version", "This method has no published version to run");
    const price = b?.price_near ? toYocto(b.price_near) : BigInt(latest.price);
    const share = price / BigInt(members.length + 1);
    const id = db.newId("group");
    return groupView(db.put("group_runs", id, {
      id, title: String(b?.title || `Team run of ${method.method_id}`).slice(0, 200), method_id: method.method_id, organizer,
      price_yocto: String(price), share_yocto: String(share), members: members.map((account_id) => ({ account_id })), state: "collecting", created_at: db.nowIso(),
    }), organizer);
  });

  route("POST", /^\/api\/pools\/group-runs\/([^/]+)\/shares$/, async (_q, [id], b, req) => {
    const acct = needAccount(req, "record your share");
    const g = getGroup(id);
    const m = g.members.find((x) => x.account_id === acct);
    if (!m) throw new ApiError(403, "not_member", "You are not a member of this group purchase");
    if (m.share_tx) throw new ApiError(409, "already_paid", "Your share is already recorded");
    usedTx(b?.tx_hash);
    const moved = await verifyTransfer(b?.tx_hash, acct, g.organizer);
    if (moved < BigInt(g.share_yocto)) throw new ApiError(400, "tx_too_small", `The transfer moved ${fmt(moved)} NEAR, the share is ${fmt(g.share_yocto)} NEAR`);
    return groupView(db.update("group_runs", id, (x) => {
      const members = x.members.map((y) => y.account_id === acct ? { ...y, share_tx: b.tx_hash, share_paid_yocto: String(moved), paid_at: db.nowIso() } : y);
      return { ...x, members, state: members.every((y) => y.share_tx) ? "funded" : "collecting" };
    }), acct);
  });

  route("POST", /^\/api\/pools\/group-runs\/([^/]+)\/run$/, async (_q, [id], b, req) => {
    const acct = needAccount(req, "link the run");
    const g = getGroup(id);
    if (acct !== g.organizer) throw new ApiError(403, "not_organizer", "Only the organizer links the run");
    if (g.run_id) throw new ApiError(409, "already_linked", "A run is already linked");
    if (!g.members.every((m) => m.share_tx)) throw new ApiError(409, "not_funded", "Every member must pay their share first");
    const run = db.get("runs", String(b?.run_id || ""));
    if (!run || run.principal !== `near:${acct}`) throw new ApiError(404, "unknown_run", "No run by this organizer with that id");
    if (run.method_id !== g.method_id) throw new ApiError(400, "wrong_method", "The run is for a different method");
    if (!run.pay_tx) throw new ApiError(409, "run_not_paid", "The run has no escrow payment yet");
    if (Date.parse(run.created_at) < Date.parse(g.created_at)) throw new ApiError(400, "run_too_old", "The run was paid before this group purchase started");
    return groupView(db.update("group_runs", id, (x) => ({ ...x, run_id: run.id, run_pay_tx: run.pay_tx, run_phase: run.phase, state: "run_linked", linked_at: db.nowIso() })), acct);
  });

  // A member registers the X25519 public key of their device. Only the public key reaches Kalis.
  route("POST", /^\/api\/pools\/group-runs\/([^/]+)\/device-key$/, async (_q, [id], b, req) => {
    const acct = needAccount(req, "register your device key");
    const g = getGroup(id);
    if (!g.members.some((m) => m.account_id === acct)) throw new ApiError(403, "not_member", "You are not a member of this group purchase");
    const key = String(b?.x25519_pub || "");
    if (!/^[0-9a-f]{64}$/.test(key)) throw new ApiError(400, "bad_key", "x25519_pub must be 32 bytes in hex");
    return groupView(db.update("group_runs", id, (x) => ({ ...x, members: x.members.map((m) => m.account_id === acct ? { ...m, device_key: key, device_key_at: db.nowIso() } : m), sealed_results: Object.fromEntries(Object.entries(x.sealed_results || {}).filter(([a]) => a !== acct)) })), acct);
  });

  // The organizer uploads the answer re-sealed to each member's device key. Ciphertext only; Kalis cannot open it.
  route("POST", /^\/api\/pools\/group-runs\/([^/]+)\/sealed-results$/, async (_q, [id], b, req) => {
    const acct = needAccount(req, "share the sealed answer");
    const g = getGroup(id);
    if (acct !== g.organizer) throw new ApiError(403, "not_organizer", "Only the organizer shares the answer");
    if (!g.run_id) throw new ApiError(409, "no_run", "Link the paid run first");
    const b64 = (v, max) => typeof v === "string" && v.length <= max && /^[A-Za-z0-9+/]+=*$/.test(v);
    const items = Array.isArray(b?.items) ? b.items : [];
    if (!items.length) throw new ApiError(400, "bad_items", "items must list { account_id, sealed }");
    const add = {};
    for (const it of items) {
      const m = g.members.find((x) => x.account_id === it?.account_id);
      if (!m) throw new ApiError(400, "not_member", `${it?.account_id} is not a member`);
      if (!m.device_key) throw new ApiError(409, "no_device_key", `${m.account_id} has not registered a device key`);
      const sd = it.sealed || {};
      if (sd.to !== m.device_key || !b64(sd.epk, 64) || !b64(sd.nonce, 32) || !b64(sd.ct, 400000) || sd.v !== "kalis/v1/group-answer") throw new ApiError(400, "bad_sealed", `The sealed answer for ${m.account_id} is malformed or not sealed to their current device key`);
      add[m.account_id] = { v: sd.v, to: sd.to, epk: sd.epk, nonce: sd.nonce, ct: sd.ct, run_id: g.run_id, sealed_by: acct, sealed_at: db.nowIso() };
    }
    return groupView(db.update("group_runs", id, (x) => ({ ...x, sealed_results: { ...(x.sealed_results || {}), ...add } })), acct);
  });
}
