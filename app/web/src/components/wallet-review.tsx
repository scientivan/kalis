"use client";
// Review panel shown before any wallet window opens. The person sees who receives the call, what it does,
// the deposit in NEAR and who must sign, in plain words, then chooses Confirm or Cancel.
import type { ContractCall } from "../lib/near/auth";
import { icon } from "./shell";

export function nearFromYocto(y?: string | null) {
  if (!y) return "0";
  try { const v = BigInt(y); const w = v / 10n ** 24n; const f = (v % 10n ** 24n).toString().padStart(24, "0").replace(/0+$/, "").slice(0, 6); return f ? `${w}.${f}` : `${w}`; } catch { return y; }
}

/** Plain sentence for wallet failures. A closed window is not an error the person caused. */
export function walletError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e || "");
  if (/closed the window|user rejected|rejected|cancel|denied|closed/i.test(m)) return "You closed the wallet before signing, so nothing was sent and nothing was paid. Choose the sign button again when you are ready.";
  if (/rate.?limit|fastnear|rpc|fetch failed|timeout/i.test(m)) return "The NEAR network service is busy right now. Nothing was sent. Wait a moment, then try again.";
  return m || "The wallet did not finish. Nothing was sent. Try again.";
}

const ACTIONS: Record<string, string> = {
  pay: "Pays the method price into escrow", hold: "Pays the method price into escrow", create_run: "Pays the method price into escrow",
  reclaim: "Takes your escrow payment back", add_proposal: "Creates the funding proposal on the DAO", act_proposal: "Records your council vote",
  publish: "Publishes the method version", claim: "Claims the bounty",
};
export function actionLabel(method: string) { return ACTIONS[method] || method.replace(/_/g, " ").replace(/^./, c => c.toUpperCase()); }

export function WalletReview({ call, title, explanation, signer, busy, error, confirmLabel = "Confirm and open wallet", onConfirm, onCancel }: {
  call: ContractCall; title: string; explanation: string; signer?: string | null; busy?: boolean; error?: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const need = call.signer_must_be || signer || "Your connected NEAR account";
  const wrong = !!call.signer_must_be && !!signer && call.signer_must_be !== signer;
  const rows: [string, string, string][] = [
    ["wallet", "Sent to", call.receiver_id],
    ["pulse", "What it does", `${actionLabel(call.method_name)} (contract method ${call.method_name})`],
    ["coins", "Deposit", `${nearFromYocto(call.deposit_yocto)} NEAR, plus network gas of at most ${call.gas_tgas} Tgas`],
    ["user", "Signed by", need],
  ];
  return <section className="wreview" role="region" aria-label={title}>
    <div className="wreview-head"><span className="wreview-ic">{icon("lock")}</span><div><h2>{title}</h2><p>{explanation}</p></div></div>
    <div className="wreview-rows">{rows.map(([ic, k, v]) => <div className="wreview-row" key={k}>{icon(ic)}<span>{k}</span><b>{v}</b></div>)}</div>
    {wrong && <p className="form-error" role="alert">This request must be signed by {call.signer_must_be}. Sign in with that account first.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="wreview-foot"><span>Your wallet opens only after you confirm. Check the same details there before you approve.</span><button className="view" onClick={onCancel} disabled={busy}>Cancel</button><button className="primary-btn" onClick={onConfirm} disabled={busy || wrong}>{busy ? "Waiting for wallet" : confirmLabel}</button></div>
  </section>;
}
