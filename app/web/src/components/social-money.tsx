"use client";
// Social Money panels: contributor royalty, buyer tip, stake-backed rating. Testnet NEAR only.
// Money moves in plain NEAR transfers. Tips and stakes are signed by the buyer's wallet; Kalis records them
// only after the backend reads the transfer on chain.
import { useEffect, useState } from "react";
import { backend } from "../lib/backend/client";
import { useNearAuth, type ContractCall } from "../lib/near/auth";
import { walletError } from "./wallet-review";
import { icon } from "./shell";
import s from "./social-money.module.css";

type Amount = { display: string; value: string };
type Royalty = { applies: boolean; paid?: boolean; amount?: Amount; transfers?: { account: string; tx_url: string }[]; tx_url?: string; pct_of_price: number };
type Tip = { id: string; to: string; role: string; amount: Amount; tx_url: string };
type Social = { status: string; buyer: string; seller: string; contributors: string[]; royalty: Royalty; tips: Tip[] };
type Stake = { amount: Amount; tx_url: string };

function hashOf(out: unknown): string | null {
  const first = Array.isArray(out) ? out[0] : out;
  const h = (first as { transaction?: { hash?: string } })?.transaction?.hash;
  return typeof h === "string" ? h : null;
}

function useSign() {
  const auth = useNearAuth();
  return async (call: ContractCall, confirm: (hash: string) => Promise<void>, manual: string) => {
    if (manual.trim()) return confirm(manual.trim());
    const out = await auth.signCalls([call]);
    const h = hashOf(out);
    if (!h) throw new Error("The wallet did not return a transaction hash. Paste the hash from your wallet below to record it.");
    await confirm(h);
  };
}

export function RunSocialMoney({ runId }: { runId: string }) {
  const auth = useNearAuth();
  const sign = useSign();
  const [d, setD] = useState<Social | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [stake, setStake] = useState<Stake | null>(null);
  const [to, setTo] = useState("");
  const [tip, setTip] = useState("0.05");
  const [stakeAmt, setStakeAmt] = useState("0.02");
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const load = async () => {
    const x = await backend<Social>(`runs/${encodeURIComponent(runId)}/social`);
    setD(x); setTo((t) => t || x.seller);
    const e = await backend<{ existing_review_id: string | null; method_id?: string }>(`runs/${encodeURIComponent(runId)}/review-eligibility`).catch(() => null);
    setReviewId(e?.existing_review_id || null);
    if (e?.existing_review_id && e.method_id) {
      const m = await backend<{ stakes: { by_review: Record<string, Stake> } }>(`methods/${encodeURIComponent(e.method_id)}/social`).catch(() => null);
      setStake(m?.stakes.by_review[e.existing_review_id] || null);
    }
  };
  useEffect(() => { load().catch(() => setD(null)); }, [runId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!d || d.status !== "Released") return null;
  const mine = auth.session?.account_id === d.buyer;

  const run = (label: string, fn: () => Promise<void>) => async () => {
    setBusy(label); setMsg("");
    try { await fn(); setManual(""); await load(); } catch (e) { setMsg(walletError(e)); } finally { setBusy(""); }
  };
  const sendTip = run("Sending tip", async () => {
    const r = await backend<{ contract_call: ContractCall }>(`runs/${encodeURIComponent(runId)}/tip`, { amount_near: tip, to });
    await sign(r.contract_call, async (h) => { await backend(`runs/${encodeURIComponent(runId)}/tips`, { tx_hash: h }); setMsg("Tip recorded from the chain."); }, manual);
  });
  const sendStake = run("Backing rating", async () => {
    if (!reviewId) return;
    const r = await backend<{ contract_call: ContractCall }>(`reviews/${encodeURIComponent(reviewId)}/stake`, { amount_near: stakeAmt });
    await sign(r.contract_call, async (h) => { await backend(`reviews/${encodeURIComponent(reviewId)}/stake/confirm`, { tx_hash: h }); setMsg("Stake recorded from the chain."); }, manual);
  });

  const roy = d.royalty;
  return <section className={`card ${s.wrap}`} aria-label="Royalty, tips and rating stake">
    <div className={s.row}>
      <span className={s.ic}>{icon("people")}</span>
      <div className={s.body}>
        <b>Contributor royalty</b>
        {roy.applies && roy.amount
          ? <span>{roy.amount.display} went to {roy.transfers?.map((t) => t.account).join(", ")}, who improved this version through a bounty. Kalis paid it from its own 10% fee, so the seller and fund shares stay the same.</span>
          : roy.applies ? <span>This version has community contributors. Their {roy.pct_of_price}% royalty is paid from the Kalis fee when the run settles.</span>
          : <span>No community contributor worked on this version, so no royalty applies.</span>}
      </div>
      {roy.tx_url && <a className="use" href={roy.tx_url} target="_blank" rel="noreferrer">{icon("link")}Royalty on NEAR</a>}
    </div>

    <div className={s.row}>
      <span className={s.ic}>{icon("coins")}</span>
      <div className={s.body}>
        <b>Say thanks with a tip</b>
        <span>A plain transfer from your wallet, 0.01 to 1 testnet NEAR. Kalis takes nothing from it.</span>
        <div className={s.form}>
          <div className={s.pick} role="radiogroup" aria-label="Tip goes to">
            {[d.seller, ...d.contributors].map((a) => <button type="button" role="radio" aria-checked={to === a} key={a} className={to === a ? s.on : ""} onClick={() => setTo(a)}>{a === d.seller ? "Seller" : "Contributor"} <small>{a}</small></button>)}
          </div>
          <label className={s.amt}><input inputMode="decimal" value={tip} onChange={(e) => setTip(e.target.value)} aria-label="Tip in NEAR" /><span>NEAR</span></label>
          <button className="view" disabled={!mine || !!busy} onClick={sendTip}>{busy === "Sending tip" ? "Waiting for wallet" : "Tip"}</button>
        </div>
        {!!d.tips.length && <ul className={s.list}>{d.tips.map((t) => <li key={t.id}><b>{t.amount.display}</b><span>to {t.role} {t.to}</span><a href={t.tx_url} target="_blank" rel="noreferrer">View on NEAR</a></li>)}</ul>}
      </div>
    </div>

    <div className={s.row}>
      <span className={s.ic}>{icon("check")}</span>
      <div className={s.body}>
        <b>Back your rating with NEAR</b>
        {stake ? <span>Your rating carries {stake.amount.display}, given to the Kalis community fund. <a href={stake.tx_url} target="_blank" rel="noreferrer">View on NEAR</a></span>
          : <span>{reviewId ? "Give 0.01 to 0.1 testnet NEAR to the community fund to show you stand behind your rating. It is a donation. It is not returned and earns nothing." : "Rate this run first. Then you can back the rating with a small donation to the community fund."}</span>}
        {reviewId && !stake && <div className={s.form}>
          <label className={s.amt}><input inputMode="decimal" value={stakeAmt} onChange={(e) => setStakeAmt(e.target.value)} aria-label="Stake in NEAR" /><span>NEAR</span></label>
          <button className="view" disabled={!mine || !!busy} onClick={sendStake}>{busy === "Backing rating" ? "Waiting for wallet" : "Back rating"}</button>
        </div>}
      </div>
    </div>

    <div className={s.foot}>
      {!mine && <span>Sign in as {d.buyer}, the account that paid for this run, to tip or back a rating.</span>}
      {mine && <label className={s.manual}><span>Wallet sent you away and back? Paste the transaction hash to record it.</span><input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Transaction hash" /></label>}
      {msg && <span role="status" className={s.msg}>{msg}</span>}
    </div>
  </section>;
}

const methodCache = new Map<string, Promise<Record<string, Stake>>>();
export function StakeBadge({ methodId, reviewId }: { methodId: string; reviewId: string }) {
  const [st, setSt] = useState<Stake | null>(null);
  useEffect(() => {
    if (!methodCache.has(methodId)) methodCache.set(methodId, backend<{ stakes: { by_review: Record<string, Stake> } }>(`methods/${encodeURIComponent(methodId)}/social`).then((x) => x.stakes.by_review).catch(() => ({})));
    methodCache.get(methodId)!.then((m) => setSt(m[reviewId] || null));
  }, [methodId, reviewId]);
  if (!st) return null;
  return <a className={s.badge} href={st.tx_url} target="_blank" rel="noreferrer" title="The reviewer gave this amount to the community fund to stand behind the rating. Not returned, no yield.">{icon("coins")}Backed by {st.amount.display}</a>;
}

type Sum = { count: number; total: Amount };
export function FundSocialMoney() {
  const [d, setD] = useState<{ royalties: Sum; tips: Sum; stakes: Sum; royalty_pct_of_price: number } | null>(null);
  useEffect(() => { backend<typeof d>("social/summary").then(setD).catch(() => setD(null)); }, []);
  if (!d) return null;
  const cells: [string, Sum, string][] = [
    ["Royalties to contributors", d.royalties, `${d.royalty_pct_of_price}% of each paid run on an improved version, paid from the Kalis fee.`],
    ["Tips from buyers", d.tips, "Sent straight from buyer wallets to sellers and contributors."],
    ["Rating stakes given to the fund", d.stakes, "Donations that back a rating. Not returned, no yield."],
  ];
  return <div className={s.fund} aria-label="Social money on testnet">
    {cells.map(([t, x, note]) => <div className={s.cell} key={t}><b className={s.num}>{x.total.display}</b><b>{t}</b><span>{x.count} on testnet. {note}</span></div>)}
  </div>;
}
