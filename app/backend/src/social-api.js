// Social Money (testnet only, no token, no yield):
// 1. Contributor royalty. When a released run paid for a version whose on-chain `contributors` list is not
//    empty (a version published from an accepted bounty contribution), the platform account pays
//    ROYALTY_PCT of the run price to those contributors in a separate NEAR transfer. The market contract
//    does not pay contributors itself (its settle splits only seller, DAO, platform), so this royalty comes
//    out of the platform's 10% fee, signed by the platform account. The seller's and DAO's shares are untouched.
// 2. Tip. After a released run, the buyer may tip the seller or a contributor. The backend returns an
//    unsigned NEAR transfer; the buyer's wallet signs it. The tip is recorded only after the backend
//    reads the transaction on chain (signer = on-chain buyer of the run, receiver, amount).
// 3. Stake-backed rating. A review may carry a 0.01 to 0.1 NEAR stake, sent by the run's buyer to the
//    Kalis community fund (Sputnik DAO). It is a donation: it is not returned and earns nothing. It only
//    shows conviction next to the rating. Recorded after the transfer is read on chain.
import { connect, keyStores, KeyPair } from "near-api-js";
import * as db from "./db.js";
import { config } from "./config.js";
import { rpc, view, clearReadCache } from "./near.js";
import { ApiError, toNear, money, chainRun, getMethod, YOCTO } from "./market.js";

export const ROYALTY_PCT = 5; // of the run price, paid from the platform's 10% fee
const TIP_MIN = 10n ** 22n, TIP_MAX = 10n ** 24n;          // 0.01 to 1 NEAR
const STAKE_MIN = 10n ** 22n, STAKE_MAX = 10n ** 23n;      // 0.01 to 0.1 NEAR
const TX = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;
const explorer = (h) => `${config.explorer}/transactions/${h}`;

function parseNear(s, min, max, what) {
  const m = String(s ?? "").trim().match(/^(\d{1,3})(?:\.(\d{1,5}))?$/);
  if (!m) throw new ApiError(400, "bad_amount", `${what} must be a NEAR amount like 0.05`);
  const y = BigInt(m[1]) * YOCTO + BigInt((m[2] || "").padEnd(24, "0").slice(0, 24) || "0");
  if (y < min || y > max) throw new ApiError(400, "amount_out_of_range", `${what} must be between ${toNear(min)} and ${toNear(max)} NEAR`);
  return y;
}

const transferCall = (receiver_id, yocto, signer) => ({ kind: "transfer", receiver_id, method_name: "", args: {}, deposit_yocto: yocto.toString(), gas_tgas: 1, signer_must_be: signer });

async function daoId() { return (await view(config.market, "get_config")).dao; }

async function releasedRun(runId) {
  const run = await chainRun(runId);
  if (!run) throw new ApiError(404, "unknown_run", `No run "${runId}" on ${config.market}`);
  if (run.status !== "Released") throw new ApiError(409, "not_released", "Only a released run (the method succeeded and the seller was paid) can carry tips, royalties or staked ratings");
  const method = await getMethod(run.method_id);
  const v = method.versions.find((x) => x.number === run.version);
  return { run, method, v };
}

/** Read a transaction on chain and check it is one successful plain transfer. */
async function readTransfer(txHash, signer) {
  if (!TX.test(txHash || "")) throw new ApiError(400, "bad_tx_hash", "tx_hash must be a base58 NEAR transaction hash");
  const r = await rpc("tx", { tx_hash: txHash, sender_account_id: signer, wait_until: "EXECUTED_OPTIMISTIC" }).catch((e) => { throw new ApiError(404, "tx_not_found", `Transaction not found for signer ${signer}: ${e.message}`); });
  const t = r.transaction;
  const acts = t.actions || [];
  if (acts.length !== 1 || !acts[0].Transfer) throw new ApiError(422, "not_a_transfer", "The transaction must be one plain NEAR transfer");
  if (!("SuccessValue" in (r.status || {}))) throw new ApiError(422, "tx_failed", "The transaction did not succeed");
  return { signer: t.signer_id, receiver: t.receiver_id, yocto: BigInt(acts[0].Transfer.deposit), tx_hash: txHash };
}

let platformAcct;
async function platformAccount() {
  const s = config.secrets.settler;
  if (!s?.key) throw new ApiError(503, "not_configured", "The platform account is not configured on this server");
  if (platformAcct) return platformAcct;
  const ks = new keyStores.InMemoryKeyStore();
  await ks.setKey(config.network, s.accountId, KeyPair.fromString(s.key));
  platformAcct = await (await connect({ networkId: config.network, nodeUrl: config.rpc, keyStore: ks })).account(s.accountId);
  return platformAcct;
}

const locks = new Map();
async function once(key, fn) {
  while (locks.has(key)) await locks.get(key);
  let done; locks.set(key, new Promise((r) => (done = r)));
  try { return await fn(); } finally { locks.delete(key); done(); }
}

const royaltyView = (r) => r && ({ ...r, amount: money(r.yocto), tx_url: r.tx_hash ? explorer(r.tx_hash) : null });

/** Pay the contributor royalty for one released run. Idempotent: one royalty per run. */
export async function payRoyalty(runId) {
  return once(`royalty:${runId}`, async () => {
    const prior = db.get("royalties", runId);
    if (prior?.tx_hash) return { ...royaltyView(prior), replayed: true };
    const { run, method, v } = await releasedRun(runId);
    const contributors = v?.contributors || [];
    if (!contributors.length) return { run_id: runId, applies: false, reason: "This version has no community contributors, so no royalty is due." };
    const total = BigInt(run.amount) * BigInt(ROYALTY_PCT) / 100n;
    const each = total / BigInt(contributors.length);
    const acct = await platformAccount();
    const transfers = [];
    for (const c of contributors) {
      const out = await acct.sendMoney(c, each);
      transfers.push({ account: c, yocto: each.toString(), tx_hash: out.transaction.hash, tx_url: explorer(out.transaction.hash) });
    }
    clearReadCache();
    const row = { run_id: runId, applies: true, method_id: run.method_id, version: run.version, seller: method.owner, payer: acct.accountId,
      pct_of_price: ROYALTY_PCT, funded_from: "platform_fee", yocto: total.toString(), transfers, tx_hash: transfers[0].tx_hash, paid_at: db.nowIso(),
      note: `The market contract pays seller, DAO and platform. Kalis then sends ${ROYALTY_PCT}% of the price from its own 10% platform fee to the contributors of this version, in a separate transfer. Testnet NEAR.` };
    db.put("royalties", runId, row);
    return { ...royaltyView(row), replayed: false };
  });
}

const reviewStake = (reviewId) => Object.values(db.all("review_stakes")).find((s) => s.review_id === reviewId) || null;

export function registerSocialRoutes(route) {
  // What a released run offers: royalty status, who can be tipped, terms.
  route("GET", /^\/api\/runs\/([^/]+)\/social$/, async (_q, [id]) => {
    const run = await chainRun(id);
    if (!run) throw new ApiError(404, "unknown_run", `No run "${id}"`);
    const method = await getMethod(run.method_id);
    const v = method.versions.find((x) => x.number === run.version);
    const tips = Object.values(db.all("tips")).filter((t) => t.run_id === id);
    return {
      run_id: id, status: run.status, buyer: run.buyer, seller: method.owner, contributors: v?.contributors || [],
      royalty: royaltyView(db.get("royalties", id)) || { applies: (v?.contributors || []).length > 0, paid: false, pct_of_price: ROYALTY_PCT, funded_from: "platform_fee" },
      tips: tips.map((t) => ({ ...t, amount: money(t.yocto), tx_url: explorer(t.tx_hash) })),
      tip_terms: { min_near: toNear(TIP_MIN), max_near: toNear(TIP_MAX), signer: run.buyer, note: "A tip is a plain NEAR transfer from your wallet to the person you pick. Kalis takes nothing from it. Testnet NEAR." },
    };
  });

  route("POST", /^\/api\/runs\/([^/]+)\/royalty$/, async (_q, [id]) => payRoyalty(id));

  // Tip: unsigned transfer for the buyer's wallet.
  route("POST", /^\/api\/runs\/([^/]+)\/tip$/, async (_q, [id], b) => {
    const { run, method, v } = await releasedRun(id);
    const to = b?.to || method.owner;
    const allowed = [method.owner, ...(v?.contributors || [])];
    if (!allowed.includes(to)) throw new ApiError(400, "bad_recipient", `A tip goes to the seller (${method.owner}) or a contributor of this version`);
    const yocto = parseNear(b?.amount_near, TIP_MIN, TIP_MAX, "amount_near");
    return { run_id: id, to, role: to === method.owner ? "seller" : "contributor", amount: money(yocto), contract_call: transferCall(to, yocto, run.buyer),
      next: `After the wallet signs, POST /api/runs/${id}/tips with {tx_hash} so Kalis reads the transfer on chain and shows it.` };
  });

  route("POST", /^\/api\/runs\/([^/]+)\/tips$/, async (_q, [id], b) => {
    const { run, method, v } = await releasedRun(id);
    const prior = db.get("tips", b?.tx_hash);
    if (prior) return { tip: { ...prior, amount: money(prior.yocto), tx_url: explorer(prior.tx_hash) }, replayed: true };
    const t = await readTransfer(b?.tx_hash, run.buyer);
    if (t.signer !== run.buyer) throw new ApiError(403, "not_buyer", "The tip must be signed by the account that paid for the run");
    if (![method.owner, ...(v?.contributors || [])].includes(t.receiver)) throw new ApiError(422, "bad_recipient", "The transfer did not go to the seller or a contributor");
    if (t.yocto < TIP_MIN || t.yocto > TIP_MAX) throw new ApiError(422, "amount_out_of_range", "The tip amount is outside 0.01 to 1 NEAR");
    const row = db.put("tips", t.tx_hash, { id: t.tx_hash, run_id: id, method_id: run.method_id, version: run.version, from: t.signer, to: t.receiver,
      role: t.receiver === method.owner ? "seller" : "contributor", yocto: t.yocto.toString(), tx_hash: t.tx_hash, created_at: db.nowIso() });
    return { tip: { ...row, amount: money(row.yocto), tx_url: explorer(row.tx_hash) }, replayed: false };
  });

  route("GET", /^\/api\/methods\/([^/]+)\/social$/, async (_q, [mid]) => {
    const tips = Object.values(db.all("tips")).filter((t) => t.method_id === mid);
    const roy = Object.values(db.all("royalties")).filter((r) => r.method_id === mid && r.tx_hash);
    const sum = (rows) => rows.reduce((a, r) => a + BigInt(r.yocto), 0n);
    const stakes = Object.values(db.all("review_stakes")).filter((s) => s.method_id === mid);
    return { method_id: mid, tips: { count: tips.length, total: money(sum(tips)) }, royalties: { count: roy.length, total: money(sum(roy)), items: roy.map(royaltyView) },
      stakes: { count: stakes.length, total: money(sum(stakes)), by_review: Object.fromEntries(stakes.map((s) => [s.review_id, { ...s, amount: money(s.yocto), tx_url: explorer(s.tx_hash) }])) } };
  });

  route("GET", /^\/api\/social\/summary$/, async () => {
    const sum = (c) => { const rows = Object.values(db.all(c)).filter((r) => r.tx_hash); return { count: rows.length, total: money(rows.reduce((a, r) => a + BigInt(r.yocto), 0n)), latest: rows.sort((x, y) => String(y.created_at || y.paid_at).localeCompare(String(x.created_at || x.paid_at))).slice(0, 5).map((r) => ({ ...r, amount: money(r.yocto), tx_url: explorer(r.tx_hash) })) }; };
    return { network: config.network, royalties: sum("royalties"), tips: sum("tips"), stakes: sum("review_stakes"), royalty_pct_of_price: ROYALTY_PCT };
  });

  // Stake-backed rating: donation to the community fund, attached to an existing review.
  route("POST", /^\/api\/reviews\/([^/]+)\/stake$/, async (_q, [rid], b) => {
    const rv = db.get("reviews", rid);
    if (!rv) throw new ApiError(404, "unknown_review", "No such review");
    if (reviewStake(rid)) throw new ApiError(409, "already_staked", "This review already carries a stake");
    const { run } = await releasedRun(rv.run_id);
    const yocto = parseNear(b?.amount_near, STAKE_MIN, STAKE_MAX, "amount_near");
    const dao = await daoId();
    return { review_id: rid, amount: money(yocto), contract_call: transferCall(dao, yocto, run.buyer),
      terms: `The stake is a donation to the Kalis community fund (${dao}). It is not returned and earns nothing. It only shows how sure you are about this rating. Testnet NEAR.`,
      next: `After the wallet signs, POST /api/reviews/${rid}/stake/confirm with {tx_hash}.` };
  });

  route("POST", /^\/api\/reviews\/([^/]+)\/stake\/confirm$/, async (_q, [rid], b) => {
    const rv = db.get("reviews", rid);
    if (!rv) throw new ApiError(404, "unknown_review", "No such review");
    const existing = reviewStake(rid);
    if (existing) { if (existing.tx_hash === b?.tx_hash) return { stake: { ...existing, amount: money(existing.yocto), tx_url: explorer(existing.tx_hash) }, replayed: true }; throw new ApiError(409, "already_staked", "This review already carries a stake"); }
    if (db.get("review_stakes", b?.tx_hash)) throw new ApiError(409, "tx_used", "This transaction already backs another review");
    const { run } = await releasedRun(rv.run_id);
    const t = await readTransfer(b?.tx_hash, run.buyer);
    const dao = await daoId();
    if (t.receiver !== dao) throw new ApiError(422, "bad_recipient", `The stake must go to the community fund ${dao}`);
    if (t.yocto < STAKE_MIN || t.yocto > STAKE_MAX) throw new ApiError(422, "amount_out_of_range", "The stake is outside 0.01 to 0.1 NEAR");
    const row = db.put("review_stakes", t.tx_hash, { id: t.tx_hash, review_id: rid, run_id: rv.run_id, method_id: rv.method_id, from: t.signer, to: dao,
      yocto: t.yocto.toString(), tx_hash: t.tx_hash, kind: "donation_to_fund", created_at: db.nowIso() });
    return { stake: { ...row, amount: money(row.yocto), tx_url: explorer(row.tx_hash) }, replayed: false };
  });
}
