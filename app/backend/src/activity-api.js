// Transactions, earnings, balance and the activity feed (group F of BACKEND_REQUIREMENTS_FOR_CLAUDE.md).
// Money comes from the market contract (authoritative) joined with the run rows this server keeps.
// Amounts are integer yoctoNEAR strings. Nothing here returns buyer data, answers or tokens.
import { config } from "./config.js";
import { view } from "./near.js";
import * as db from "./db.js";
import { principal } from "./principal.js";
import { load } from "./protections/store.js";
import { ApiError, money, chainRun, PLATFORM_SHARE_PCT } from "./market.js";

const txUrl = (h) => (h ? `${config.explorer}/transactions/${h}` : null);
const nsToIso = (ns) => new Date(Number(BigInt(ns) / 1_000_000n)).toISOString();

function split(amount, daoPct) {
  const total = BigInt(amount);
  const seller = total * BigInt(100 - daoPct - PLATFORM_SHARE_PCT) / 100n;
  const dao = total * BigInt(daoPct) / 100n;
  return { seller, dao, platform: total - seller - dao };
}

/** Ledger entries for one run, from chain state plus the server's run row. */
function runEntries(row, onChain) {
  if (!onChain) return [];
  const amount = onChain.amount;
  const funding = row.payment === "demo_topup" ? "mock_fiat_topup" : "buyer_wallet";
  const base = { run_id: row.id, method_id: onChain.method_id, version: onChain.version, network: config.network };
  const out = [{
    ...base, id: `${row.id}:hold`, type: "escrow_hold", direction: "out", status: "confirmed",
    amount: money(amount), funding, funding_note: funding === "mock_fiat_topup" ? "Mock fiat top-up: a platform-held testnet account paid. No real money moved." : null,
    tx: row.pay_tx || null, tx_url: txUrl(row.pay_tx), occurred_at: nsToIso(onChain.paid_at_ns),
    note: "The method price is held by the market contract until settlement.",
  }];
  const settledAt = [...(row.events || [])].reverse().find((e) => ["released", "refunded"].includes(e.phase))?.at || null;
  if (onChain.status === "Released") {
    const s = split(amount, row.snapshot?.dao_share_pct ?? 10);
    out.push({ ...base, id: `${row.id}:release`, type: "release", direction: "none", status: "confirmed", amount: money(amount),
      split: { seller: money(s.seller), dao: money(s.dao), platform: money(s.platform) },
      tx: row.settle_tx || null, tx_url: txUrl(row.settle_tx), occurred_at: settledAt, note: "Every stage succeeded, so the escrow paid the seller, the DAO fund and the platform." });
  } else if (onChain.status === "Refunded") {
    const timeout = /timeout/.test(onChain.reason || "") || Boolean(row.reclaim_tx);
    out.push({ ...base, id: `${row.id}:refund`, type: timeout ? "timeout_reclaim" : "stage_refund", direction: "in", status: "confirmed", amount: money(amount),
      tx: (timeout ? row.reclaim_tx : row.settle_tx) || null, tx_url: txUrl(timeout ? row.reclaim_tx : row.settle_tx), occurred_at: settledAt, note: onChain.reason });
  }
  return out;
}

async function myRuns(p) {
  const rows = Object.values(db.all("runs")).filter((r) => r.principal === p.id);
  return Promise.all(rows.map(async (r) => ({ row: r, onChain: await chainRun(r.id).catch(() => null) })));
}

const sortDesc = (items) => items.sort((a, b) => String(b.occurred_at || "").localeCompare(String(a.occurred_at || "")) || String(b.id).localeCompare(String(a.id)));

function pageBy(items, q) {
  const rows = items.map((x) => ({ ...x, created_at: x.occurred_at || "", id: String(x.id) }));
  const page = db.paginate(rows, { cursor: q.get("cursor"), limit: q.get("limit") });
  return { items: page.items.map(({ created_at: _c, ...x }) => x), next_cursor: page.next_cursor };
}

export function registerActivityRoutes(route) {
  route("GET", /^\/api\/me\/transactions$/, async (q, _m, _b, req) => {
    const p = principal(req);
    let items = (await myRuns(p)).flatMap(({ row, onChain }) => runEntries(row, onChain));
    if (q.get("type")) items = items.filter((x) => x.type === q.get("type"));
    return { principal: { id: p.id, demo: p.demo }, ...pageBy(sortDesc(items), q), order: "occurred_at desc",
      note: "From the market contract and this server's run records. Storage deposit refunds and gas are not listed." };
  });

  // Seller income: escrow releases for methods the account owns, plus DAO bounty payouts it received.
  route("GET", /^\/api\/me\/earnings$/, async (q, _m, _b, req) => {
    const p = principal(req);
    const account = p.kind === "near_account" ? p.account_id : q.get("account");
    if (!account) return { status: "unavailable", reason: "Sign in with a NEAR account, or pass ?account=<seller account> for the public read-only view. A demo workspace owns no methods." };
    if (!/^[a-z0-9._-]{2,64}$/.test(account)) throw new ApiError(400, "bad_account", "account is not a NEAR account id");
    const methods = await view(config.market, "list_methods", { from_index: 0, limit: 200 });
    const owned = new Set(methods.filter((m) => m.owner === account).map((m) => m.method_id));
    const sales = [];
    for (const r of Object.values(db.all("runs")).filter((x) => owned.has(x.method_id))) {
      const onChain = await chainRun(r.id).catch(() => null);
      if (onChain?.status !== "Released") continue;
      const s = split(onChain.amount, r.snapshot?.dao_share_pct ?? 10);
      sales.push({ id: `${r.id}:seller`, type: "seller_allocation", run_id: r.id, method_id: r.method_id, version: onChain.version, amount: money(s.seller), status: "paid", tx_url: txUrl(r.settle_tx), occurred_at: [...(r.events || [])].reverse().find((e) => e.phase === "released")?.at || null });
    }
    const dao = (await view(config.market, "get_config")).dao;
    const last = await view(dao, "get_last_proposal_id");
    const proposals = last ? await view(dao, "get_proposals", { from_index: 0, limit: Math.min(last, 200) }) : [];
    const bounties = await view(dao, "get_bounties", { from_index: 0, limit: 100 });
    const bounty = [];
    for (const pr of proposals) {
      const k = pr.kind?.BountyDone;
      if (!k || k.receiver_id !== account) continue;
      const b = bounties.find((x) => x.id === k.bounty_id);
      bounty.push({ id: `proposal-${pr.id}`, type: "bounty_income", proposal_id: pr.id, bounty_id: k.bounty_id, amount: b ? money(b.amount) : null, status: pr.status === "Approved" ? "paid" : String(pr.status).toLowerCase(), occurred_at: pr.submission_time ? nsToIso(pr.submission_time) : null });
    }
    const sum = (xs) => xs.filter((x) => x.status === "paid" && x.amount).reduce((a, x) => a + BigInt(x.amount.value), 0n);
    return {
      account, view: p.kind === "near_account" ? "owner" : "public_read_only",
      seller_allocations: { items: sortDesc(sales), total_paid: money(sum(sales)), scope: "Runs settled through this server" },
      bounty_income: { items: sortDesc(bounty), total_paid: money(sum(bounty)), scope: `BountyDone proposals in ${dao}` },
      note: "Seller income and bounty income are listed separately and never added together. Bounty payouts are not royalties.",
    };
  });

  route("GET", /^\/api\/me\/balance$/, async () => ({
    status: "unavailable",
    reason: "Kalis keeps no custodial ledger. Payments go straight into the on-chain escrow, and the mock fiat top-up is a platform testnet account, not a balance you own. See /api/me/transactions.",
  }));

  // Safe activity feed for the caller: run phases, protection audit events of the same demo workspace, and reviews.
  route("GET", /^\/api\/activity$/, async (q, _m, _b, req) => {
    const p = principal(req);
    const items = [];
    for (const r of Object.values(db.all("runs")).filter((x) => x.principal === p.id)) {
      (r.events || []).forEach((e, i) => items.push({ id: `${r.id}:${i}`, resource_type: "run", resource_id: r.id, kind: `run.${e.phase}`, actor: p.id, status: e.phase, occurred_at: e.at,
        summary: `Run of ${r.method_id} v${r.version}: ${e.phase.replace(/_/g, " ")}${e.tx ? " (on chain)" : ""}` }));
    }
    if (p.kind === "demo_workspace" && p.id !== "demo:anonymous") {
      const ws = p.id.slice(5);
      for (const [i, a] of load(ws, "audit").entries()) {
        items.push({ id: `audit:${i}`, resource_type: a.protection, resource_id: a.id || null, kind: `protection.${a.protection}.${a.event}`, actor: p.id, status: a.event, occurred_at: a.at,
          summary: `${a.protection}: ${String(a.event).replace(/_/g, " ")}` });
      }
    }
    for (const rv of Object.values(db.all("reviews")).filter((x) => x.principal === p.id)) {
      items.push({ id: rv.id, resource_type: "review", resource_id: rv.id, kind: "review.created", actor: p.id, status: "created", occurred_at: rv.created_at, summary: `Rated ${rv.method_id} v${rv.version}: ${rv.rating} of 5` });
    }
    let list = sortDesc(items);
    if (q.get("resource_type")) list = list.filter((x) => x.resource_type === q.get("resource_type"));
    return { principal: { id: p.id, demo: p.demo }, ...pageBy(list, q), order: "occurred_at desc", note: "Summaries only. No buyer data, answers, prompts or tokens." };
  });
}
