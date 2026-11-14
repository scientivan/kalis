// Social Money pools (BUILD_STATUS 6.x "Pools"). Two features, both NON-CUSTODIAL: Kalis never holds anyone's NEAR.
//
// 1. Crowdfunded bounty (pledge-then-pay). People pledge an amount toward a method improvement. A pledge moves
//    no money. When the DAO approves a BountyDone proposal for the linked bounty (read from the Sputnik DAO on
//    chain), every pledger gets an unsigned transfer to the contributor the DAO paid, signs it in their own
//    wallet, and the backend checks the transaction on chain. If the deadline passes first, or the pool is
//    cancelled, the pledges are released. Nothing was moved, so nothing has to be refunded.
//    Honest limit: a pledge is a promise, not a lock. A pledger can still decline to pay after completion;
//    the pool shows who paid and who did not.
// 2. Group purchase of a run. An organizer names the members and the price. Each member sends their share to
//    the organizer as a plain NEAR transfer (checked on chain). The organizer then pays the run through the
//    normal escrow (pay_for_run) and links the run here. The run executes once in the TEE. Its answer is sealed
//    to the organizer's data key, so members do not get it automatically; the organizer shares it.
import { config } from "./config.js";
import { view, rpc } from "./near.js";
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
  const all = [...Object.values(db.all("bounty_pools")).flatMap((p) => p.pledges.map((x) => x.paid_tx)), ...Object.values(db.all("group_runs")).flatMap((g) => g.members.map((m) => m.share_tx))];
  if (all.includes(txHash)) throw new ApiError(409, "tx_already_used", "This transaction is already counted in a pool");
}

// ---------- crowdfunded bounty ----------
async function daoId() { return (await view(config.market, "get_config")).dao; }

/** BountyDone proposals for a DAO bounty submitted after `sinceIso`, read from chain. */
async function doneProposals(dao, bountyId, sinceIso) {
  const since = BigInt(Date.parse(sinceIso)) * 1_000_000n;
  const last = await view(dao, "get_last_proposal_id");
  const out = [];
  for (let i = 0; i < last; i += 50) {
    const ps = await view(dao, "get_proposals", { from_index: i, limit: 50 });
    out.push(...ps.filter((p) => p.kind?.BountyDone && Number(p.kind.BountyDone.bounty_id) === Number(bountyId) && BigInt(p.submission_time) >= since));
  }
  return out.map((p) => ({ proposal_id: p.id, receiver_id: p.kind.BountyDone.receiver_id, status: p.status }));
}

async function refreshPool(p) {
  if (p.state !== "open") return p;
  const dones = await doneProposals(p.dao, p.dao_bounty_id, p.created_at).catch(() => null);
  const done = dones?.find((d) => d.status === "Approved");
  if (done) return db.update("bounty_pools", p.id, (x) => ({ ...x, state: "completed", recipient: done.receiver_id, done_proposal_id: done.proposal_id, completed_at: db.nowIso() }));
  const rejected = dones?.find((d) => ["Rejected", "Removed", "Expired"].includes(d.status));
  if (rejected) return db.update("bounty_pools", p.id, (x) => ({ ...x, state: "released", released_reason: "work_rejected", done_proposal_id: rejected.proposal_id, released_at: db.nowIso() }));
  if (Date.parse(p.deadline) < Date.now()) return db.update("bounty_pools", p.id, (x) => ({ ...x, state: "released", released_reason: "deadline_passed", released_at: db.nowIso() }));
  const pending = dones?.find((d) => d.status === "InProgress");
  return pending ? { ...p, pending_done: pending } : p;
}

function poolView(p, me) {
  const live = p.pledges.filter((x) => !x.withdrawn);
  const pledged = live.reduce((s, x) => s + BigInt(x.amount_yocto), 0n);
  const paid = live.filter((x) => x.paid_tx).reduce((s, x) => s + BigInt(x.paid_yocto), 0n);
  const mine = live.find((x) => x.account_id === me) || null;
  const allowed = [];
  if (p.state === "open" && me) allowed.push(mine ? "withdraw_pledge" : "pledge");
  if (p.state === "open" && me === p.creator) allowed.push("cancel");
  if (p.state === "completed" && mine && !mine.paid_tx) allowed.push("pay_pledge");
  return {
    id: p.id, title: p.title, issue_id: p.issue_id, dao: p.dao, dao_bounty_id: p.dao_bounty_id, creator: p.creator, created_at: p.created_at,
    deadline: p.deadline, state: p.state, recipient: p.recipient || null, done_proposal_id: p.done_proposal_id ?? null, pending_done: p.pending_done || null, released_reason: p.released_reason || null,
    custody: "none: pledges move no NEAR until the DAO approves the work, then each pledger pays the contributor directly",
    target_near: fmt(p.target_yocto), pledged_near: fmt(pledged), paid_near: fmt(paid),
    pledges: live.map((x) => ({ account_id: x.account_id, amount_near: fmt(x.amount_yocto), created_at: x.created_at, paid_tx: x.paid_tx || null, paid_near: x.paid_yocto ? fmt(x.paid_yocto) : null, explorer: x.paid_tx ? explorer(x.paid_tx) : null })),
    my_pledge: mine ? { amount_near: fmt(mine.amount_yocto), paid_tx: mine.paid_tx || null } : null,
    pay_call: p.state === "completed" && mine && !mine.paid_tx ? { kind: "transfer", receiver_id: p.recipient, deposit_yocto: mine.amount_yocto, signer_must_be: me } : null,
    allowed_actions: allowed,
  };
}
const me = (req) => { const p = principal(req); return p.kind === "near_account" ? p.account_id : null; };
function getPool(id) { const p = db.get("bounty_pools", id); if (!p) throw new ApiError(404, "unknown_pool", "No such bounty pool"); return p; }

// ---------- group run ----------
function groupView(g, who) {
  const share = BigInt(g.share_yocto);
  const collected = g.members.filter((m) => m.share_tx).reduce((s, m) => s + BigInt(m.share_paid_yocto), 0n);
  const mine = g.members.find((m) => m.account_id === who) || null;
  const allPaid = g.members.every((m) => m.share_tx);
  const allowed = [];
  if (mine && !mine.share_tx && g.state === "collecting") allowed.push("pay_share");
  if (who === g.organizer && allPaid && !g.run_id) allowed.push("link_run");
  return {
    id: g.id, title: g.title, method_id: g.method_id, organizer: g.organizer, created_at: g.created_at, state: g.state,
    custody: "the organizer: members send their share to the organizer's own account, the organizer pays the run through the market escrow",
    price_near: fmt(g.price_yocto), share_near: fmt(share), collected_near: fmt(collected), organizer_share_near: fmt(BigInt(g.price_yocto) - share * BigInt(g.members.length)),
    members: g.members.map((m) => ({ account_id: m.account_id, share_tx: m.share_tx || null, explorer: m.share_tx ? explorer(m.share_tx) : null })),
    run: g.run_id ? { run_id: g.run_id, pay_tx: g.run_pay_tx, explorer: explorer(g.run_pay_tx), phase: g.run_phase } : null,
    result_sharing: "The run's answer is sealed to the organizer's data key. Members get it when the organizer shares it; Kalis does not re-seal it per member yet.",
    share_call: mine && !mine.share_tx ? { kind: "transfer", receiver_id: g.organizer, deposit_yocto: g.share_yocto, signer_must_be: who } : null,
    allowed_actions: allowed,
  };
}
function getGroup(id) { const g = db.get("group_runs", id); if (!g) throw new ApiError(404, "unknown_group_run", "No such group purchase"); return g; }

export function registerPoolRoutes(route) {
  route("GET", /^\/api\/pools\/bounties$/, async (q, _m, _b, req) => {
    const rows = await Promise.all(Object.values(db.all("bounty_pools")).map(refreshPool));
    const issue = q.get("issue_id");
    return { items: rows.filter((p) => !issue || p.issue_id === issue).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((p) => poolView(p, me(req))) };
  });
  route("GET", /^\/api\/pools\/bounties\/([^/]+)$/, async (_q, [id], _b, req) => poolView(await refreshPool(getPool(id)), me(req)));

  route("POST", /^\/api\/pools\/bounties$/, async (_q, _m, b, req) => {
    const creator = needAccount(req, "start a bounty pool");
    const dao = await daoId();
    const bid = Number(b?.dao_bounty_id);
    const bounty = Number.isInteger(bid) ? (await view(dao, "get_bounties", { from_index: 0, limit: 200 })).find((x) => x.id === bid) : null;
    if (!bounty) throw new ApiError(400, "unknown_bounty", `dao_bounty_id must be a bounty that exists in ${dao}`);
    const days = Number(b?.deadline_days ?? 7);
    const deadline = b?.deadline ? new Date(b.deadline) : new Date(Date.now() + days * 86400000);
    if (!(deadline.getTime() > Date.now()) || deadline.getTime() > Date.now() + 90 * 86400000) throw new ApiError(400, "bad_deadline", "The deadline must be in the next 90 days");
    const id = db.newId("pool");
    return poolView(db.put("bounty_pools", id, {
      id, title: String(b?.title || bounty.description).slice(0, 200), issue_id: b?.issue_id || null, dao, dao_bounty_id: bid, creator,
      target_yocto: String(toYocto(b?.target_near ?? "0.1")), deadline: deadline.toISOString(), state: "open", pledges: [], created_at: db.nowIso(),
    }), creator);
  });

  route("POST", /^\/api\/pools\/bounties\/([^/]+)\/pledges$/, async (_q, [id], b, req) => {
    const acct = needAccount(req, "pledge to a bounty");
    const p = await refreshPool(getPool(id));
    if (p.state !== "open") throw new ApiError(409, "pool_closed", `This pool is ${p.state}; it takes no new pledges`);
    const amount = toYocto(b?.amount_near);
    return poolView(db.update("bounty_pools", id, (x) => ({
      ...x, pledges: [...x.pledges.filter((y) => y.account_id !== acct || y.paid_tx), { account_id: acct, amount_yocto: String(amount), created_at: db.nowIso() }],
    })), acct);
  });

  route("DELETE", /^\/api\/pools\/bounties\/([^/]+)\/pledges\/me$/, async (_q, [id], _b, req) => {
    const acct = needAccount(req, "withdraw a pledge");
    const p = await refreshPool(getPool(id));
    if (p.state !== "open") throw new ApiError(409, "pool_closed", "A pledge can be withdrawn only while the pool is open");
    return poolView(db.update("bounty_pools", id, (x) => ({ ...x, pledges: x.pledges.map((y) => y.account_id === acct ? { ...y, withdrawn: true } : y) })), acct);
  });

  route("POST", /^\/api\/pools\/bounties\/([^/]+)\/cancel$/, async (_q, [id], _b, req) => {
    const acct = needAccount(req, "cancel a pool");
    const p = await refreshPool(getPool(id));
    if (p.creator !== acct) throw new ApiError(403, "not_creator", "Only the account that started the pool can cancel it");
    if (p.state !== "open") throw new ApiError(409, "pool_closed", `This pool is already ${p.state}`);
    return poolView(db.update("bounty_pools", id, (x) => ({ ...x, state: "released", released_reason: "cancelled", released_at: db.nowIso() })), acct);
  });

  route("POST", /^\/api\/pools\/bounties\/([^/]+)\/pledges\/me\/paid$/, async (_q, [id], b, req) => {
    const acct = needAccount(req, "record a pledge payment");
    const p = await refreshPool(getPool(id));
    if (p.state !== "completed") throw new ApiError(409, "not_completed", "The DAO has not approved the work yet, so pledges are not due");
    const pledge = p.pledges.find((x) => x.account_id === acct && !x.withdrawn);
    if (!pledge) throw new ApiError(404, "no_pledge", "You have no pledge in this pool");
    if (pledge.paid_tx) throw new ApiError(409, "already_paid", "This pledge is already paid");
    usedTx(b?.tx_hash);
    const moved = await verifyTransfer(b?.tx_hash, acct, p.recipient);
    if (moved < BigInt(pledge.amount_yocto)) throw new ApiError(400, "tx_too_small", `The transfer moved ${fmt(moved)} NEAR, the pledge is ${fmt(pledge.amount_yocto)} NEAR`);
    return poolView(db.update("bounty_pools", id, (x) => ({ ...x, pledges: x.pledges.map((y) => y.account_id === acct && !y.withdrawn ? { ...y, paid_tx: b.tx_hash, paid_yocto: String(moved), paid_at: db.nowIso() } : y) })), acct);
  });

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
}
