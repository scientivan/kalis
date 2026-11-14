"use client";
// Wallet allowance form. The owner sets the cap, period, allowed recipients, contracts and methods,
// per-action max and expiry. It produces the sandbox sub-account commands and the `allowance` input
// for the wallet-allowance-guard method. The agent only ever gets the sandbox key.
import { useMemo, useState } from "react";
import { Fx, Msg } from "./form-kit";
import { createSandboxCall, hasDeviceKey, sandboxBalance, defaultPolicy, guardInput, policyErrors, sandboxAccount, setupCommands, splitList, STORAGE_RESERVE_NEAR, type AllowancePeriod, type AllowancePolicy } from "../lib/wallet-allowance";

export function WalletAllowanceForm({ owner = "", onPolicy, signCalls }: { owner?: string; onPolicy?: (allowance: ReturnType<typeof guardInput>) => void; signCalls?: (calls: Awaited<ReturnType<typeof createSandboxCall>>[]) => Promise<unknown> }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [state, setState] = useState<{ busy?: boolean; error?: string; done?: string }>({});
  const [p, setP] = useState<AllowancePolicy>(() => defaultPolicy(owner));
  const [lists, setLists] = useState({ recipients: "", contracts: "", methods: "" });
  const policy = useMemo(() => ({ ...p, allowed_recipients: splitList(lists.recipients), allowed_contracts: splitList(lists.contracts), allowed_methods: splitList(lists.methods) }), [p, lists]);
  const errors = policyErrors(policy);
  const cmds = setupCommands(policy);
  const input = guardInput(policy, balance ?? Math.max(0, policy.cap_near - STORAGE_RESERVE_NEAR));
  const set = <K extends keyof AllowancePolicy>(k: K, v: AllowancePolicy[K]) => setP(x => ({ ...x, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v));
  const account = sandboxAccount(policy);
  async function refresh() { setBalance(await sandboxBalance(account).catch(() => null)); }
  async function create() {
    setState({ busy: true });
    try {
      if (!signCalls) throw new Error("Sign in with NEAR first.");
      await signCalls([await createSandboxCall(policy)]);
      await refresh();
      setState({ done: `${account} was created and funded. Its key is kept only in this browser.` });
    } catch (e) { setState({ error: e instanceof Error ? e.message : "The wallet did not create the sandbox." }); }
  }

  return <section className="card list-card se" aria-labelledby="wa-title">
    <header className="se-head"><div><h2 id="wa-title">Add a wallet allowance</h2></div></header>
    <div className="dpane"><div className="note-row"><p>Your agent pays from {sandboxAccount(policy) || "a sandbox wallet"}, funded with exactly the cap. It can never spend more than that balance, and every payment is checked by the allowance guard before you approve it.</p></div>
    <form className="se-form" onSubmit={e => e.preventDefault()}>
    <Fx label="Your wallet"><input value={p.owner} onChange={e => set("owner", e.target.value.trim().toLowerCase())} placeholder="you.testnet" /></Fx>
    <Fx label="Sandbox name" hint={`Creates ${sandboxAccount(policy)}`}><input value={p.name} onChange={e => set("name", e.target.value.trim().toLowerCase())} /></Fx>
    <Fx label="Cap (NEAR)" hint="The sandbox is funded with this amount and nothing more."><input type="number" min="0" step="0.01" value={p.cap_near} onChange={e => set("cap_near", num(e.target.value))} /></Fx>
    <Fx label="Period"><select value={p.period} onChange={e => set("period", e.target.value as AllowancePeriod)}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></Fx>
    <Fx label="Most per action (NEAR)"><input type="number" min="0" step="0.01" value={p.per_action_max_near} onChange={e => set("per_action_max_near", num(e.target.value))} /></Fx>
    <Fx label="Allowed recipients" hint="Accounts the agent may pay, separated by commas."><input value={lists.recipients} onChange={e => setLists(l => ({ ...l, recipients: e.target.value }))} placeholder="shop.testnet, invoices.testnet" /></Fx>
    <Fx label="Allowed contracts"><input value={lists.contracts} onChange={e => setLists(l => ({ ...l, contracts: e.target.value }))} placeholder="wrap.testnet" /></Fx>
    <Fx label="Allowed methods"><input value={lists.methods} onChange={e => setLists(l => ({ ...l, methods: e.target.value }))} placeholder="near_deposit" /></Fx>
    <Fx label="Expires at (UTC)"><input type="date" value={p.expires_at.slice(0, 10)} onChange={e => set("expires_at", `${e.target.value}T00:00:00Z`)} /></Fx>
    {errors.length > 0 && <Msg error={errors[0]} />}
    {errors.length === 0 && <>
      <div className="se-nav rp-wide"><button type="button" className="se-btn primary-btn" disabled={state.busy} onClick={create}>{state.busy ? "Waiting for your wallet" : "Create sandbox with my wallet"}</button><button type="button" className="se-btn" onClick={refresh}>Check balance on chain</button></div>
      {balance !== null && <Msg text={`${account} holds ${balance.toFixed(4)} NEAR on NEAR testnet${hasDeviceKey(account) ? ", and this browser holds its key." : "."}`} />}
      {state.error && <Msg error={state.error} />}
      {state.done && <Msg text={state.done} />}
      <Fx label="Or create it from a terminal" hint="Same result with near-cli-rs. Only the new sandbox key goes to the agent."><textarea readOnly rows={3} value={cmds.create} /></Fx>
      <Fx label="Revoke at any time" hint="Deletes the sandbox and returns what is left to your wallet."><textarea readOnly rows={2} value={cmds.revoke} /></Fx>
      <button type="button" className="se-btn" onClick={() => onPolicy?.(input)}>Use this allowance in the guard</button>
      <Msg text="Kalis never holds your main key. Your wallet creates the sandbox, and you approve each payment hash the guard allows." />
    </>}
  </form></div>
  </section>;
}
