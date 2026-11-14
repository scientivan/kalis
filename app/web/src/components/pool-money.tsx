"use client";
// Social Money pools: crowdfunded bounty (pledge-then-pay) and group purchase of a run. Testnet NEAR only.
// Kalis holds no NEAR in either flow. Every payment is a plain transfer signed in the payer's own wallet and
// counted only after the backend reads it on chain.
import { useEffect, useState } from "react";
import { backend, request } from "../lib/backend/client";
import { useNearAuth, type ContractCall } from "../lib/near/auth";
import { walletError } from "./wallet-review";
import { icon } from "./shell";
import s from "./social-money.module.css";

type Pledge = { account_id: string; amount_near: string; paid_tx: string | null; explorer: string | null };
type Pool = {
  id: string; title: string; dao_bounty_id: number; creator: string; deadline: string; state: "open" | "completed" | "released";
  recipient: string | null; released_reason: string | null; pending_done: { proposal_id: number } | null;
  target_near: string; pledged_near: string; paid_near: string; pledges: Pledge[];
  my_pledge: { amount_near: string; paid_tx: string | null } | null; pay_call: ContractCall | null; allowed_actions: string[];
};
type Member = { account_id: string; share_tx: string | null; explorer: string | null };
type Group = {
  id: string; title: string; organizer: string; state: string; price_near: string; share_near: string; collected_near: string;
  members: Member[]; run: { run_id: string; explorer: string } | null; share_call: ContractCall | null; allowed_actions: string[];
};

function hashOf(out: unknown): string | null {
  const first = Array.isArray(out) ? out[0] : out;
  const h = (first as { transaction?: { hash?: string } })?.transaction?.hash;
  return typeof h === "string" ? h : null;
}
const enc = encodeURIComponent;
const day = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function stateLine(p: Pool) {
  if (p.state === "completed") return `The DAO approved the work and paid ${p.recipient}. Each pledger now sends their pledge to ${p.recipient}.`;
  if (p.state === "released") return p.released_reason === "cancelled" ? "The pool was cancelled. No NEAR was moved, so nobody needs a refund."
    : p.released_reason === "work_rejected" ? "The DAO rejected the work. No NEAR was moved, so nobody needs a refund."
    : "The deadline passed before the work was approved. No NEAR was moved, so nobody needs a refund.";
  if (p.pending_done) return `A payout request (DAO proposal ${p.pending_done.proposal_id}) is waiting for the council vote. Pledges are due only if it is approved.`;
  return `Open until ${day(p.deadline)}. If the DAO has not approved the work by then, every pledge is void.`;
}

/** Crowdfunded bounty pools for one DAO bounty. Shown on the bounty detail. */
export function BountyPools({ bountyId }: { bountyId: number | string }) {
  const auth = useNearAuth();
  const [pools, setPools] = useState<Pool[]>([]);
  const [amount, setAmount] = useState("0.01");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [manual, setManual] = useState("");
  const load = async () => {
    const r = await backend<{ items: Pool[] }>("pools/bounties");
    setPools(r.items.filter((p) => String(p.dao_bounty_id) === String(bountyId)));
  };
  useEffect(() => { load().catch(() => setPools([])); }, [bountyId]); // eslint-disable-line react-hooks/exhaustive-deps
  const act = (label: string, fn: () => Promise<void>) => async () => {
    setBusy(label); setMsg("");
    try { await fn(); setManual(""); await load(); } catch (e) { setMsg(walletError(e)); } finally { setBusy(""); }
  };
  const open = pools.find((p) => p.state === "open");
  const start = act("start", async () => { await backend("pools/bounties", { dao_bounty_id: Number(bountyId), target_near: "0.1", deadline_days: 7 }); setMsg("Pool started. Pledges are open for 7 days."); });

  return <section className={`card ${s.wrap}`} aria-label="Crowdfunded bounty">
    <div className={s.row}>
      <span className={s.ic}>{icon("people")}</span>
      <div className={s.body}>
        <b>Chip in on this bounty</b>
        <span>Several people can add to the reward. A pledge moves no NEAR. You pay only after the DAO council approves the finished work, straight to the contributor. If the work is rejected or the deadline passes, your pledge simply ends.</span>
        {!open && <div className={s.form}><button className="view" disabled={!auth.session || !!busy} onClick={start}>{busy === "start" ? "Starting" : "Start a pool"}</button></div>}
      </div>
    </div>
    {pools.map((p) => <div className={s.row} key={p.id}>
      <span className={s.ic}>{icon(p.state === "completed" ? "check" : "coins")}</span>
      <div className={s.body}>
        <b>{p.pledged_near} of {p.target_near} NEAR pledged, {p.paid_near} NEAR paid</b>
        <span>{stateLine(p)}</span>
        {!!p.pledges.length && <ul className={s.list}>{p.pledges.map((x) => <li key={x.account_id}><b>{x.amount_near} NEAR</b><span>{x.account_id}</span>{x.explorer ? <a href={x.explorer} target="_blank" rel="noreferrer">Paid, view on NEAR</a> : <span>{p.state === "completed" ? "Not paid yet" : "Pledged"}</span>}</li>)}</ul>}
        {p.allowed_actions.includes("pledge") && <div className={s.form}>
          <label className={s.amt}><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Pledge in NEAR" /><span>NEAR</span></label>
          <button className="view" disabled={!!busy} onClick={act("pledge", async () => { await backend(`pools/bounties/${enc(p.id)}/pledges`, { amount_near: amount }); setMsg("Pledge recorded. Nothing left your wallet."); })}>{busy === "pledge" ? "Saving" : "Pledge"}</button>
        </div>}
        {p.allowed_actions.includes("withdraw_pledge") && <div className={s.form}><button className="use" disabled={!!busy} onClick={act("withdraw", async () => { await request(`pools/bounties/${enc(p.id)}/pledges/me`, "DELETE"); })}>Withdraw my pledge</button></div>}
        {p.pay_call && <div className={s.form}><button className="view" disabled={!!busy} onClick={act("pay", async () => {
          const h = manual.trim() || hashOf(await auth.signCalls([p.pay_call!]));
          if (!h) throw new Error("The wallet did not return a transaction hash. Paste it below to record the payment.");
          await backend(`pools/bounties/${enc(p.id)}/pledges/me/paid`, { tx_hash: h }); setMsg("Payment checked on chain.");
        })}>{busy === "pay" ? "Waiting for wallet" : `Pay ${p.my_pledge?.amount_near} NEAR to ${p.recipient}`}</button></div>}
      </div>
    </div>)}
    <div className={s.foot}>
      {!auth.session && <span>Sign in with your NEAR account to pledge.</span>}
      {pools.some((p) => p.pay_call) && <label className={s.manual}><span>Wallet sent you away and back? Paste the transaction hash to record it.</span><input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Transaction hash" /></label>}
      {msg && <span className={s.msg} role="status">{msg}</span>}
    </div>
  </section>;
}

/** Group purchase of one run, shown at run checkout. */
export function GroupRun({ methodId }: { methodId: string }) {
  const auth = useNearAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState("");
  const [runId, setRunId] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const load = async () => setGroups((await backend<{ items: Group[] }>(`pools/group-runs?method_id=${enc(methodId)}`)).items);
  useEffect(() => { if (auth.session) load().catch(() => setGroups([])); }, [methodId, auth.session]); // eslint-disable-line react-hooks/exhaustive-deps
  const act = (label: string, fn: () => Promise<void>) => async () => {
    setBusy(label); setMsg("");
    try { await fn(); await load(); } catch (e) { setMsg(walletError(e)); } finally { setBusy(""); }
  };
  if (!auth.session) return null;
  const create = act("create", async () => {
    await backend("pools/group-runs", { method_id: methodId, members: members.split(/[\s,]+/).filter(Boolean) });
    setMembers(""); setMsg("Group started. Each member now sends their share to you.");
  });

  return <section className="se-box" aria-label="Buy this run as a team">
    <header><b>{icon("people")}Buy This Run as a Team</b></header>
    <div className={s.wrap} style={{ marginTop: 0, padding: 0 }}>
      <div className={s.row}>
        <div className={s.body}>
          <b>Split the price with your team</b>
          <span>Members send their share to you, the organizer. You pay the run once through the escrow and it runs once in the private runner. The answer is sealed to your data key, so you share it with your team yourself.</span>
          <div className={s.form}>
            <label className={s.manual} style={{ flex: 1 }}><span>Member NEAR accounts</span><input value={members} onChange={(e) => setMembers(e.target.value)} placeholder="alice.testnet, bob.testnet" /></label>
            <button className="view" disabled={!members.trim() || !!busy} onClick={create}>{busy === "create" ? "Starting" : "Start group"}</button>
          </div>
        </div>
      </div>
      {groups.map((g) => <div className={s.row} key={g.id}>
        <span className={s.ic}>{icon(g.run ? "check" : "coins")}</span>
        <div className={s.body}>
          <b>{g.collected_near} of {g.price_near} NEAR collected, {g.share_near} NEAR each</b>
          <span>{g.run ? `Run ${g.run.run_id} was paid by ${g.organizer} and linked to this group.` : g.state === "funded" ? "Every member paid. The organizer can now pay the run and link it here." : `Organized by ${g.organizer}. Waiting for member shares.`}</span>
          <ul className={s.list}>{g.members.map((m) => <li key={m.account_id}><span>{m.account_id}</span>{m.explorer ? <a href={m.explorer} target="_blank" rel="noreferrer">Share paid, view on NEAR</a> : <span>Not paid yet</span>}</li>)}</ul>
          {g.run && <a href={g.run.explorer} target="_blank" rel="noreferrer">Escrow payment on NEAR</a>}
          {g.share_call && <div className={s.form}><button className="view" disabled={!!busy} onClick={act("share", async () => {
            const h = hashOf(await auth.signCalls([g.share_call!]));
            if (!h) throw new Error("The wallet did not return a transaction hash.");
            await backend(`pools/group-runs/${enc(g.id)}/shares`, { tx_hash: h }); setMsg("Share checked on chain.");
          })}>{busy === "share" ? "Waiting for wallet" : `Send my ${g.share_near} NEAR share`}</button></div>}
          {g.allowed_actions.includes("link_run") && <div className={s.form}>
            <label className={s.manual} style={{ flex: 1 }}><span>Run id after you pay below</span><input value={runId} onChange={(e) => setRunId(e.target.value)} placeholder="run-..." /></label>
            <button className="view" disabled={!runId || !!busy} onClick={act("link", async () => { await backend(`pools/group-runs/${enc(g.id)}/run`, { run_id: runId }); })}>Link run</button>
          </div>}
        </div>
      </div>)}
      {msg && <div className={s.foot}><span className={s.msg} role="status">{msg}</span></div>}
    </div>
  </section>;
}
