"use client";
// Social Money pools. Testnet NEAR only.
// Bounty pool: pledges are locked in the pool contract and paid out by the contract after the DAO approves the
// work, or refunded by each pledger after the deadline. Every money call is unsigned from the API and signed in
// the user's own wallet.
// Group run: members pay their share to the organizer; the organizer's device re-seals the opened answer to each
// member's device key and uploads only ciphertext; each member opens it on their own device.
import { useEffect, useState } from "react";
import { backend } from "../lib/backend/client";
import { useNearAuth, type ContractCall } from "../lib/near/auth";
import { newDeviceKey, sealForMember, openAsMember } from "../lib/backend/group-seal.js";
import { walletError } from "./wallet-review";
import { icon } from "./shell";
import s from "./pool-money.module.css";

type Proposal = { proposal_id: number; receiver_id: string; status: string };
type Pool = {
  id: number; title: string; dao_bounty_id: number; creator: string; contract: string; created_at: string; deadline: string;
  state: "open" | "checking" | "released" | "refunding"; refund_reason: string | null; released_to: string | null;
  locked_near: string; pledgers: string[]; my_pledge_near: string | null; approved_proposal: Proposal | null; pending_proposal: Proposal | null;
  allowed_actions: string[];
};
type Sealed = { v: string; to: string; epk: string; nonce: string; ct: string; run_id: string };
type Member = { account_id: string; share_tx: string | null; explorer: string | null; device_key: string | null; result_sealed: boolean };
type Group = {
  id: string; title: string; organizer: string; state: string; price_near: string; share_near: string; collected_near: string;
  members: Member[]; run: { run_id: string; explorer: string } | null; share_call: ContractCall | null; allowed_actions: string[]; my_sealed_result: Sealed | null;
};

function hashOf(out: unknown): string | null {
  const first = Array.isArray(out) ? out[0] : out;
  const h = (first as { transaction?: { hash?: string } })?.transaction?.hash;
  return typeof h === "string" ? h : null;
}
const enc = encodeURIComponent;
const day = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const short = (a: string) => (a.length > 26 ? `${a.slice(0, 12)}...${a.slice(-10)}` : a);

function poolSay(p: Pool) {
  if (p.state === "released") return { title: `Paid out to ${p.released_to}`, line: "The DAO approved the work and the contract sent the whole pool to the contributor." };
  if (p.state === "refunding") return { title: "Refunds are open", line: p.refund_reason === "work_rejected" ? "The DAO rejected the work. Each pledger takes their own NEAR back from the contract." : "The deadline passed before the DAO approved the work. Each pledger takes their own NEAR back from the contract." };
  if (p.approved_proposal) return { title: "The DAO approved the work", line: `Anyone can now trigger the payout to ${p.approved_proposal.receiver_id}. The contract checks the approval itself.` };
  if (p.pending_proposal) return { title: "Waiting for the council vote", line: `The contributor asked for payment (DAO proposal ${p.pending_proposal.proposal_id}). The NEAR stays locked until the vote.` };
  return { title: "Locked until the work is approved", line: `If the DAO has not approved the work by ${day(p.deadline)}, every pledger can take their NEAR back.` };
}
const stepOf = (p: Pool) => (p.state === "released" || p.state === "refunding" ? 2 : p.approved_proposal || p.pending_proposal ? 1 : 0);

/** Escrowed crowdfunded pools for one DAO bounty. Shown on the bounty detail. */
export function BountyPools({ bountyId }: { bountyId: number | string }) {
  const auth = useNearAuth();
  const [pools, setPools] = useState<Pool[]>([]);
  const [amount, setAmount] = useState("0.1");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const load = async () => setPools((await backend<{ items: Pool[] }>(`pools/bounties?dao_bounty_id=${enc(String(bountyId))}`)).items);
  useEffect(() => { load().catch(() => setPools([])); }, [bountyId, auth.session]); // eslint-disable-line react-hooks/exhaustive-deps
  const signFrom = (label: string, path: string, body: Record<string, unknown>, done: string) => async () => {
    setBusy(label); setMsg("");
    try {
      const r = await backend<{ contract_call: ContractCall }>(path, body);
      await auth.signCalls([r.contract_call]);
      setMsg(done); await load();
    } catch (e) { setMsg(walletError(e)); } finally { setBusy(""); }
  };
  const live = pools.find((p) => p.state === "open");

  return <section className={`card ${s.wrap}`} aria-label="Crowdfunded bounty">
    <div className={s.head}>
      <span className={s.ic}>{icon("lock")}</span>
      <div className={s.body}>
        <b>Chip in on this bounty</b>
        <span>Your NEAR is locked in a public contract, not held by Kalis. It goes to the contributor only when the DAO council approves the finished work. If that does not happen by the deadline, you take it back yourself.</span>
      </div>
    </div>
    {[...pools].filter((p) => !(p.state === "refunding" && p.locked_near === "0")).sort((a, b) => Number(b.state === "open") - Number(a.state === "open")).map((p) => {
      const say = poolSay(p); const step = stepOf(p);
      return <article className={s.pool} key={p.id} aria-label={`Pool ${p.id}`}>
        <div className={s.panel}>
          <div className={s.stats}>
            <span className={s.stat}><b>{p.locked_near} NEAR</b>Locked in the contract</span>
            <span className={s.stat}><b>{p.pledgers.length}</b>{p.pledgers.length === 1 ? "Person chipped in" : "People chipped in"}</span>
            <span className={s.stat}><b>{p.my_pledge_near ?? "0"} NEAR</b>Your pledge</span>
          </div>
          <ol className={s.steps} aria-label="Pool progress">
            {["NEAR locked", p.state === "refunding" ? (p.refund_reason === "work_rejected" ? "Work rejected" : "Not approved in time") : "Council vote", p.state === "refunding" ? "Refunds open" : "Paid to contributor"].map((t, i) =>
              <li key={t} className={i < step ? s.done : i === step ? s.now : ""} aria-current={i === step ? "step" : undefined}>{icon(i < step ? "check" : i === 0 ? "lock" : i === 1 ? "people" : "coins")}<span>{t}</span></li>)}
          </ol>
          {!!p.pledgers.length && <ul className={s.rows}>{p.pledgers.map((a) => <li key={a}><span>{short(a)}</span><b>{a === auth.session?.account_id ? "You" : "Pledged"}</b></li>)}</ul>}
        </div>
        <div className={s.say}><b>{say.title}</b><span>{say.line}</span></div>
        {!!auth.session && <div className={s.form}>
          {p.allowed_actions.includes("pledge") && <>
            <label className={s.amt}><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Pledge in NEAR" /><span>NEAR</span></label>
            <button className="view" disabled={!!busy} onClick={signFrom("pledge", `pools/bounties/${p.id}/pledges`, { amount_near: amount }, `${amount} NEAR is now locked in the pool.`)}>{busy === "pledge" ? "Waiting for wallet" : "Lock my pledge"}</button>
          </>}
          {p.allowed_actions.includes("release") && <button className="view" disabled={!!busy} onClick={signFrom("release", `pools/bounties/${p.id}/release`, {}, "Payout sent. The contract checked the DAO approval.")}>{busy === "release" ? "Waiting for wallet" : `Pay ${p.locked_near} NEAR to ${short(p.approved_proposal!.receiver_id)}`}</button>}
          {p.allowed_actions.includes("mark_rejected") && <button className="use" disabled={!!busy} onClick={signFrom("reject", `pools/bounties/${p.id}/mark-rejected`, {}, "Refunds are open.")}>Open refunds (work rejected)</button>}
          {p.allowed_actions.includes("refund") && <button className="view" disabled={!!busy} onClick={signFrom("refund", `pools/bounties/${p.id}/refund`, {}, "Your NEAR is back in your wallet.")}>{busy === "refund" ? "Waiting for wallet" : `Take back my ${p.my_pledge_near} NEAR`}</button>}
          <a className="use" href={`https://testnet.nearblocks.io/address/${p.contract}`} target="_blank" rel="noreferrer">View the contract</a>
        </div>}
      </article>;
    })}
    {!live && <div className={s.form} style={{ padding: 0 }}>
      <button className="view" disabled={!auth.session || !!busy} onClick={signFrom("start", "pools/bounties", { dao_bounty_id: Number(bountyId), deadline_days: 7 }, "Pool started. It takes pledges for 7 days.")}>{busy === "start" ? "Waiting for wallet" : "Start a pool"}</button>
    </div>}
    {!auth.session && <div className={s.note}>{icon("info")}<span><b>Sign in with your NEAR account to chip in.</b> Pledging and refunds are signed in your own wallet.</span></div>}
    {msg && <span className={s.msg} role="status">{msg}</span>}
  </section>;
}

const KEY_PREFIX = "kalis-group-device-key:";
function deviceKey(account: string) {
  try {
    const k = localStorage.getItem(KEY_PREFIX + account);
    if (k) return JSON.parse(k) as { secret_hex: string; public_hex: string };
    const n = newDeviceKey(); localStorage.setItem(KEY_PREFIX + account, JSON.stringify(n)); return n;
  } catch { return null; }
}

/** Group purchase of one run, shown at run checkout. `answer` is the opened answer of `runId` in this tab, if any. */
export function GroupRun({ methodId, runId: openRunId, answer }: { methodId: string; runId?: string | null; answer?: unknown }) {
  const auth = useNearAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState("");
  const [runId, setRunId] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [opened, setOpened] = useState<Record<string, unknown>>({});
  const who = auth.session?.account_id || "";
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
      <div className={s.note}>{icon("lock")}<span><b>Everyone gets the answer on their own device.</b> Members pay their share to the organizer, who pays one run. The organizer's device then seals the answer separately to each member's device key. Kalis stores only the sealed copies and cannot read them.</span></div>
      <div className={s.form} style={{ padding: 0 }}>
        <label className={s.field}><span>Member NEAR accounts</span><input value={members} onChange={(e) => setMembers(e.target.value)} placeholder="alice.testnet, bob.testnet" /></label>
        <button className="view" disabled={!members.trim() || !!busy} onClick={create} style={{ alignSelf: "end" }}>{busy === "create" ? "Starting" : "Start group"}</button>
      </div>
      {groups.map((g) => {
        const me = g.members.find((m) => m.account_id === who);
        const local = me ? deviceKey(who) : null;
        const keyStale = !!me && !!local && me.device_key !== local.public_hex;
        const canSeal = who === g.organizer && g.run && openRunId === g.run.run_id && answer != null && g.members.some((m) => m.device_key && !m.result_sealed);
        const step = g.run ? (g.members.every((m) => m.result_sealed) ? 2 : 1) : 0;
        return <article className={s.pool} key={g.id}>
          <div className={s.panel}>
            <div className={s.stats}>
              <span className={s.stat}><b>{g.collected_near} NEAR</b>Collected of {g.price_near}</span>
              <span className={s.stat}><b>{g.share_near} NEAR</b>Share per person</span>
              <span className={s.stat}><b>{g.members.filter((m) => m.result_sealed).length} of {g.members.length}</b>Answers sealed</span>
            </div>
            <ol className={s.steps} aria-label="Group progress">
              {["Shares paid", "Run paid once", "Answer sealed to each member"].map((t, i) =>
                <li key={t} className={i < step ? s.done : i === step ? s.now : ""}>{icon(i < step ? "check" : i === 0 ? "coins" : i === 1 ? "play" : "lock")}<span>{t}</span></li>)}
            </ol>
            <ul className={s.rows}>{g.members.map((m) => <li key={m.account_id}><span>{short(m.account_id)}{m.account_id === who ? " (you)" : ""}</span>
              <b>{m.result_sealed ? "Answer sealed" : m.device_key ? "Device ready" : m.share_tx ? "Share paid" : "Not paid yet"}</b></li>)}</ul>
          </div>
          <div className={s.say}><b>{g.title}</b><span>Organized by {g.organizer}. {g.run ? `Run ${g.run.run_id} was paid once through the escrow.` : g.state === "funded" ? "Every member paid. The organizer can pay the run and link it." : "Waiting for member shares."}</span></div>
          <div className={s.form}>
            {g.share_call && <button className="view" disabled={!!busy} onClick={act("share", async () => {
              const h = hashOf(await auth.signCalls([g.share_call!]));
              if (!h) throw new Error("The wallet did not return a transaction hash.");
              await backend(`pools/group-runs/${enc(g.id)}/shares`, { tx_hash: h }); setMsg("Share checked on chain.");
            })}>{busy === "share" ? "Waiting for wallet" : `Send my ${g.share_near} NEAR share`}</button>}
            {me && local && (!me.device_key || keyStale) && <button className="view" disabled={!!busy} onClick={act("key", async () => {
              await backend(`pools/group-runs/${enc(g.id)}/device-key`, { x25519_pub: local.public_hex }); setMsg("This device can now receive the answer.");
            })}>{keyStale ? "Use this device instead" : "Receive the answer on this device"}</button>}
            {g.allowed_actions.includes("link_run") && <>
              <label className={s.field}><span>Run id after you pay below</span><input value={runId} onChange={(e) => setRunId(e.target.value)} placeholder="run-..." /></label>
              <button className="view" style={{ alignSelf: "end" }} disabled={!runId || !!busy} onClick={act("link", async () => { await backend(`pools/group-runs/${enc(g.id)}/run`, { run_id: runId }); })}>Link run</button>
            </>}
            {canSeal && <button className="view" disabled={!!busy} onClick={act("seal", async () => {
              const items = g.members.filter((m) => m.device_key && !m.result_sealed).map((m) => ({ account_id: m.account_id, sealed: sealForMember(m.device_key!, answer, { group_id: g.id, run_id: g.run!.run_id, account_id: m.account_id }) }));
              await backend(`pools/group-runs/${enc(g.id)}/sealed-results`, { items }); setMsg(`Sealed for ${items.length} member${items.length === 1 ? "" : "s"} on this device.`);
            })}>{busy === "seal" ? "Sealing" : "Seal the answer for my team"}</button>}
            {g.my_sealed_result && local && !keyStale && !opened[g.id] && <button className="view" disabled={!!busy} onClick={act("open", async () => {
              setOpened((o) => ({ ...o, [g.id]: openAsMember(local.secret_hex, g.my_sealed_result, { group_id: g.id, run_id: g.my_sealed_result!.run_id, account_id: who }) }));
            })}>Open my answer</button>}
          </div>
          {who === g.organizer && g.run && openRunId !== g.run.run_id && g.members.some((m) => m.device_key && !m.result_sealed) && <div className={s.note}>{icon("info")}<span><b>Open run {g.run.run_id} in this tab to seal it.</b> Only the tab that paid the run holds the key that opens the answer.</span></div>}
          {opened[g.id] != null && <pre className={s.answer} aria-label="Your answer">{JSON.stringify((opened[g.id] as { answer?: unknown }).answer ?? opened[g.id], null, 2)}</pre>}
        </article>;
      })}
      {msg && <span className={s.msg} role="status">{msg}</span>}
    </div>
  </section>;
}
