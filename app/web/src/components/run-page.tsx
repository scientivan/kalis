"use client";
// Run a method privately: /runs/new?method=<id>&version=<n>, and an existing run at /runs/<run id>.
// Data is sealed in this browser (crypto.sealData) before anything is sent. The answer is opened here,
// the runner signature and chip attestation are compared, and the seller's checks run on this device.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { backend, type ApiConfig } from "../lib/backend/client";
import * as kc from "../lib/backend/crypto";
import { runChecks } from "../lib/backend/checks";
import { AppShell, icon } from "./shell";
import { useNearAuth, type ContractCall } from "../lib/near/auth";
import { WalletReview, walletError } from "./wallet-review";
import { PreparationSources } from "./data-tools";
import { Capability } from "./capability";
import { PageInfo, Dropdown } from "./controls";
import { Fx, StepRail, Msg } from "./form-kit";
import { ManifestInput, type ManifestField } from "./manifest-fields";
import { statusLabel } from "../lib/labels";

type Field = { id: string; label: string; type?: string; unit?: string; required?: boolean; private?: boolean; help?: string; enum?: string[]; items?: { type?: string }; display?: string; source?: string; min?: number; max?: number };
type Manifest = { inputs?: { fields?: Field[]; sample?: Record<string, unknown> }; outputs?: { fields?: Field[]; status_field?: string }; steps?: { id: string; what: string }[]; buyer_checks?: unknown[]; ai?: { allowed?: string[] }; listing?: { outcome?: string } };
type Version = { number: number; code_hash: string; manifest_hash: string; runner_hash: string; runnable: boolean; price_near: string; price_amount?: { display?: string; source?: string; min?: number; max?: number }; manifest: Manifest; method_kind?: { kind: string } };
type Detail = { method_id: string; title: string; owner: string; versions: Version[] };
type Execution = { output: Parameters<typeof kc.openAnswer>[1]; attestation: { executed_build_ok: boolean; input_hash_ok: boolean; output_hash_ok: boolean } | null };
type Source = { kind:string;ref?:string;sha256?:string;revision?:number;reviewed_by_buyer?:boolean };
type Quote = {id:string;expires_at:string;method_price:{display:string};storage_deposit:{display:string};infra_fee:{display:string};gas:{display:string};max_total:{display:string};allocation_base:{seller_pct:number;dao_pct:number;platform_pct:number}};
type Sealed = ReturnType<typeof kc.sealData>;
type Verdict = { status: string; reasons: string[] };
type CheckResult = { results: { id: string; description: string; status: string; message: string }[] };

const STAGES = ["Your data", "Pay", "Run", "Result"];
const STAGE_TITLE: Record<string, string> = { "Your data": "Your Data", Pay: "Pay", Run: "Run", Result: "Result" };
const STAGE_HINT: Record<string, string> = { "Your data": "Fill in your values, they stay sealed", Pay: "Check the cost and pay into escrow", Run: "The method runs in a locked chip", Result: "Open, check and release payment" };
const ESCROW: Record<string, string> = { NotPaid: "Not paid yet", Paid: "Held in escrow", Released: "Paid to the expert", Refunded: "Refunded to you", Reclaimed: "Taken back by you" };
const VERDICT_TEXT: Record<string, string> = { safe: "Safe to use", attention: "Needs your attention", do_not_use: "Do not use" };
// The sealing secret lives only in this tab's memory. It is never stored or sent.
const secrets = new Map<string, { sealed: Sealed; input: Record<string, unknown>; version: Version; manifest: Manifest; completionKey: string }>();

function initialValues(m: Manifest): Record<string, string> {
  const sample = m.inputs?.sample || {};
  const out: Record<string, string> = {};
  for (const f of m.inputs?.fields || []) {
    const v = sample[f.id];
    out[f.id] = v === undefined ? "" : Array.isArray(v) && v.every(x => typeof x !== "object") ? v.join(", ") : typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}
function parseValue(f: Field, raw: string): unknown {
  const t = raw.trim();
  if (!t) { if (f.required) throw new Error(`${f.label} is required.`); return undefined; }
  if (f.type === "array" || f.type === "object") { try { return JSON.parse(t.startsWith("[") || t.startsWith("{") ? t : `[${t}]`); } catch { throw new Error(`${f.label} must be a list of values separated by commas.`); } }
  if (["number", "integer", "money", "percent"].includes(f.type || "")) { const n = Number(t); if (!Number.isFinite(n)) throw new Error(`${f.label} must be a number.`); if (f.type === "integer" && !Number.isInteger(n)) throw new Error(`${f.label} must be a whole number.`); if ((f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max)) throw new Error(`${f.label} is outside its allowed range.`); return n; }
  if (f.type === "boolean") return t === "true";
  return t;
}
const show = (v: unknown) => v === undefined || v === null ? "Not given" : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v);

export function RunPage({ runId: initialRun }: { runId?: string }) {
  const auth = useNearAuth();
  const [quote,setQuote] = useState<Quote | null>(null);
  const prepared = useRef<Sealed | null>(null);
  const paymentAttempt = useRef<string | null>(null);
  const [payment,setPayment]=useState("demo_topup");
  const [promptConsent,setPromptConsent]=useState(false);
  const [operation,setOperation]=useState("");
  const [pendingCall,setPendingCall]=useState<ContractCall|null>(null);
  const [reviewing,setReviewing]=useState<"pay"|"reclaim"|null>(null); const [walletErr,setWalletErr]=useState(""); const [walletBusy,setWalletBusy]=useState(false); const lastMode=useRef<"pay"|"reclaim">("pay"); useEffect(()=>{if(reviewing)lastMode.current=reviewing;},[reviewing]);
  const [events,setEvents]=useState<{phase:string;at:string;error?:string}[]>([]);
  const [aiCalls,setAiCalls]=useState<unknown[]>([]);
  const [eligibility,setEligibility]=useState<{eligible:boolean;message:string}|null>(null);
  const [sources,setSources]=useState<Record<string,Source>>({});
  const [models,setModels]=useState<string[]>([]);
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [d, setD] = useState<Detail | null>(null);
  const [versionN, setVersionN] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [runId, setRunId] = useState(initialRun || "");
  const [chain, setChain] = useState<{ status?: string; amount_near?: string; method_id?: string; reason?: string; reclaimable?: boolean; reclaim_after_ns?: string; version?: number } | null>(null);
  const [answer, setAnswer] = useState<Record<string, unknown> | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [checks, setChecks] = useState<CheckResult | null>(null);
  const [proof, setProof] = useState<{ label: string; ok: boolean }[]>([]);
  const [settled, setSettled] = useState<{ status?: string; settle_tx_url?: string; payouts?: Record<string, string> } | null>(null);
  const [payTx, setPayTx] = useState("");
  const [busy, setBusy] = useState(""); const [error, setError] = useState("");
  const [rating, setRating] = useState(0); const [comment, setComment] = useState(""); const [rated, setRated] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const method = q.get("method");
    backend<ApiConfig>("config").then(setConfig).catch(e => setError(e.message));
    if (initialRun) {
      backend<typeof chain & { method_id: string }>(`runs/${encodeURIComponent(initialRun)}`).then(r => { setChain(r); if (r?.method_id) load(r.method_id, r.version || null); }).catch(e => setError(e.message));
    } else if (method) load(method, Number(q.get("version")) || null);
    else setError("Choose a method in the Marketplace first.");
    function load(id: string, n: number | null = null) {
      backend<Detail>(`methods/${encodeURIComponent(id)}`).then(x => { setD(x); const v = x.versions.find(v => v.number === n) || x.versions[x.versions.length - 1]; setVersionN(v.number); setValues(initialValues(v.manifest)); setModels(v.manifest.ai?.allowed || []); }).catch(e => setError(e.message));
    }
  }, [initialRun]);

  const v = d?.versions.find(x => x.number === versionN) || null;
  const m: Manifest = v?.manifest || {};
  const stage = answer ? 3 : runId && secrets.has(runId) ? 2 : runId ? 3 : 0;
  const [view, setView] = useState<string | null>(null);
  const [dataPage, setDataPage] = useState(0);
  const current = view || STAGES[Math.min(stage, 3)];
  useEffect(() => { setView(null); }, [stage]);

  async function act(label: string, fn: () => Promise<void>) {
    setBusy(label); setError("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(""); }
  }
  const input = useMemo(() => {
    try { const o: Record<string, unknown> = {}; for (const f of m.inputs?.fields || []) { const x = parseValue(f, values[f.id] || ""); if (x !== undefined) o[f.id] = x; } return { ok: true as const, o }; }
    catch (e) { return { ok: false as const, message: e instanceof Error ? e.message : "Check your data." }; }
  }, [values, m]);

  useEffect(() => { setConsent(false); setPromptConsent(false); setQuote(null); prepared.current=null; }, [values, models, auth.session?.account_id]);
  useEffect(() => {
    if (!runId) return;
    let live=true;
    const refresh=()=>{
      backend<{events:{phase:string;at:string;error?:string}[]}>(`runs/${encodeURIComponent(runId)}/events`).then(x=>{if(live)setEvents(x.events);}).catch(()=>{});
      backend<NonNullable<typeof chain>>(`runs/${encodeURIComponent(runId)}`).then(x=>{if(live)setChain(x);}).catch(()=>{});
      backend<{eligible:boolean;message:string}>(`runs/${encodeURIComponent(runId)}/review-eligibility`).then(x=>{if(live)setEligibility(x);}).catch(()=>{});
    }; refresh(); const timer=setInterval(refresh,5000); return()=>{live=false;clearInterval(timer);};
  },[runId]);
  const prepareQuote = () => act("Checking cost", async()=>{
    if(!d||!v||!config||!input.ok) throw new Error("Check your input first.");
    if(m.ai?.allowed?.length && !models.length)throw new Error("Keep at least one model selected.");
    if(!consent || (v.method_kind?.kind === "prompt" && !promptConsent)) throw new Error("Review and accept the method terms first.");
    const sealed=kc.sealData(config.runner.tee_pubkey,input.o); prepared.current=sealed;
    const draft=await backend<{id:string;revision:number}>("run-drafts",{method_id:d.method_id,version:v.number,data_ct_sha256:sealed.dataCtSha256,models,input_sources:(m.inputs?.fields||[]).map(f=>({field:f.id,...(sources[f.id]||{kind:"typed",reviewed_by_buyer:true})}))});
    for(const kind of ["method_terms","permissions",...(v.method_kind?.kind === "prompt"?["prompt_method_nature"]:[])]) await backend(`run-drafts/${draft.id}/consents`,{revision:draft.revision,kind});
    const q=await backend<Quote>(`run-drafts/${draft.id}/quote`,{expected_revision:draft.revision}); setQuote(q); setView("Pay");
  });
  const recoverPayment = () => act("Checking payment",async()=>{
    if(operation){const op=await backend<{status:string;result?:{run_id?:string}}>(`operations/${operation}`); if(op.result?.run_id)setRunId(op.result.run_id); if(op.status!=="succeeded")throw new Error(`Payment status is ${op.status}. Do not pay again.`);}
    else {const list=await backend<{items:{id:string;data_ct_sha256?:string}[]}>("runs?limit=100"); const found=list.items.find(x=>x.data_ct_sha256===prepared.current?.dataCtSha256); if(!found)throw new Error("No matching payment is visible yet. Do not pay again while its outcome is uncertain."); setRunId(found.id); if(prepared.current&&v&&config&&input.ok)secrets.set(found.id,{sealed:prepared.current,input:input.o,version:v,manifest:m,completionKey:config.runner.completion_pubkey});}
  });
  const pay = () => act("Sealing and paying", async () => {
    if (!config || !v || !d || !input.ok || !quote || !prepared.current) throw new Error("Request a current quote first.");
    if(Date.parse(quote.expires_at)<=Date.now())throw new Error("This quote expired. Return to your data and request another.");
    if(paymentAttempt.current)throw new Error("A payment was already submitted. Check its status instead of paying again.");
    const sealed=prepared.current;
    const privateValues=(m.inputs?.fields||[]).filter(f=>f.private).flatMap(f=>{const val=input.o[f.id];return val===undefined?[]:[typeof val === "string" ? val : JSON.stringify(val)];});
    if(privateValues.length)await backend("protections/private-values",{label:d.title,values:privateValues});
    const key=crypto.randomUUID(); paymentAttempt.current=key;
    const created = await backend<{ run_id: string; operation_id?:string; run?: typeof chain; pay_tx_url?: string; contract_call?:ContractCall }>("runs", { quote_id:quote.id,data_ct_sha256:sealed.dataCtSha256,payment,idempotency_key:key });
    if(!created.run_id)throw new Error("Payment outcome is pending. Do not submit a new payment.");
    setOperation(created.operation_id||"");
    secrets.set(created.run_id, { sealed, input: input.o, version: v, manifest: m, completionKey: config.runner.completion_pubkey });
    setRunId(created.run_id); setChain(created.run || null); setPayTx(created.pay_tx_url || "");
    window.history.replaceState(null, "", `/runs/${encodeURIComponent(created.run_id)}`);
    if(created.contract_call){setPendingCall(created.contract_call);setWalletErr("");setReviewing("pay");}
  });

  const execute = () => act("Running in the locked chip", async () => {
    const s = secrets.get(runId);
    if (!s) throw new Error("This tab no longer holds the key for this run. Do not pay again. The escrow refunds after its timeout.");
    if(chain?.status !== "Paid")throw new Error("Wait for the payment to be confirmed before running.");
    const started=await backend<{operation_id:string}>(`runs/${encodeURIComponent(runId)}/execute`,{data:s.sealed.sealed,async:true}); setOperation(started.operation_id);
    let complete=false;
    for(let i=0;i<150;i++){
      const op=await backend<{status:string;error?:{message:string}}>(`operations/${started.operation_id}`);
      if(op.status === "succeeded"){complete=true;break;}
      if(op.status === "failed" || op.status === "unknown")throw new Error(/did not finish in time/.test(op.error?.message||"")?"The locked chip is still busy. Press Run privately again to keep waiting for the same job. You will not pay again.":op.error?.message||`Execution ${op.status}`);
      await new Promise(resolve=>setTimeout(resolve,2000));
    }
    if(!complete)throw new Error("Execution is still pending. Check the operation status before starting it again.");
    const ex = await backend<Execution>(`runs/${encodeURIComponent(runId)}/execution`);
    displayExecution(s,ex);
    setChain(await backend(`runs/${encodeURIComponent(runId)}`));
    setView("Result");
  });

  function displayExecution(s:NonNullable<ReturnType<typeof secrets.get>>,ex:Execution){
    const opened = kc.openAnswer(s.sealed.secret, ex.output);
    const sig = kc.verifyCompletion(ex.output, s.completionKey);
    const sigOk = sig.sigOk && sig.keyOk && sig.record.run_id === runId && sig.record.data_ct_sha256 === s.sealed.dataCtSha256 && sig.record.method_sha256 === s.version.code_hash && sig.record.manifest_sha256 === s.version.manifest_hash;
    const ck = (s.manifest.buyer_checks || []).length ? runChecks(s.manifest, s.input, opened.answer) : null;
    const vd = kc.runVerdict({ opened, recheck: null, checks: ck, completion: { sigOk }, attestation: ex.attestation, chain: { method_sha256: s.version.code_hash, manifest_sha256: s.version.manifest_hash, runner_hash: s.version.runner_hash } });
    setAnswer(ck?.answer || opened.answer); setChecks(ck); setVerdict(vd); setAiCalls(opened.report?.ai_calls || []);
    setProof([
      { label: "Signed by the Kalis runner", ok: sigOk },
      { label: "The version you paid for ran", ok: opened.method_sha256 === s.version.code_hash && opened.manifest_sha256 === s.version.manifest_hash },
      { label: "Chip runs the published runner build", ok: !!ex.attestation?.executed_build_ok },
      { label: "Chip received and returned exactly this data", ok: !!ex.attestation?.input_hash_ok && !!ex.attestation?.output_hash_ok },
      { label: "Every stage succeeded", ok: !!opened.report?.all_ok },
    ]);
  }
  const openExisting = () => act("Opening answer",async()=>{
    const s=secrets.get(runId); if(!s)throw new Error("This tab no longer holds the answer key. The server cannot recover it.");
    const ex=await backend<Execution>(`runs/${encodeURIComponent(runId)}/execution`); displayExecution(s,ex); setView("Result");
  });
  const settle = () => act("Releasing payment", async () => {
    const r = await backend<{ status?: string; settle_tx_url?: string; payouts?: Record<string, string>; run?: typeof chain }>(`runs/${encodeURIComponent(runId)}/settle`, {});
    setSettled(r); if (r.run) setChain(r.run);
  });

  const reclaim = () => act("Taking payment back",async()=>{
    const r=await backend<{contract_call?:ContractCall;run?:typeof chain;tx_url?:string}>(`runs/${encodeURIComponent(runId)}/reclaim`,{idempotency_key:`reclaim-${runId}`});
    if(r.contract_call){setPendingCall(r.contract_call);setWalletErr("");setReviewing("reclaim");return;}
    setChain(await backend(`runs/${encodeURIComponent(runId)}`)); if(r.tx_url)setPayTx(r.tx_url);
  });
  async function confirmWallet(){
    if(!pendingCall)return; setWalletBusy(true); setWalletErr("");
    try { await auth.signCalls([pendingCall]); setReviewing(null); if(runId) setChain(await backend(`runs/${encodeURIComponent(runId)}`)); }
    catch(e){ setWalletErr(walletError(e)); }
    finally { setWalletBusy(false); }
  }
  const rate = () => act("Saving rating", async () => {
    if (!d || !eligibility?.eligible) throw new Error("This job is not eligible for a review.");
    await backend(`methods/${encodeURIComponent(d.method_id)}/reviews`, { run_id: runId, rating, comment: comment || undefined, privacy_acknowledged: true });
    setRated("Thanks. Your rating is saved.");
  });

  const status = settled?.status || chain?.status;
  const escrowText = status ? ESCROW[status] || statusLabel(status.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()) : "Not paid yet";
  const price = v?.price_amount?.display || (v ? `${v.price_near} NEAR` : "");
  const fields = m.inputs?.fields || [];
  const complex = (f: Field) => f.type === "object" || (f.type === "array" && !!(f as ManifestField).items?.fields);
  const setField = (id: string, x: string) => { setValues(old => ({ ...old, [id]: x })); setSources(old => ({ ...old, [id]: { kind: "typed", reviewed_by_buyer: true } })); };
  const fieldInput = (f: Field) => {
    const hint = [f.unit, f.required ? "" : "Optional", f.type === "array" ? "Separate values with commas" : ""].filter(Boolean).join(", ");
    const hintNode = (hint || f.help || f.private) ? <>{f.private && <span className="rp-priv">{icon("lock")}Private</span>}{hint}{hint && f.help ? ". " : ""}{f.help}</> : undefined;
    const label = f.label;
    if (f.type === "boolean" || f.enum) return <div className="se-fx" key={f.id}><span className="se-fx-l">{label}</span><Dropdown label={f.label} value={values[f.id] || (f.enum ? f.enum[0] : "false")} onChange={x => setField(f.id, x)} options={f.enum ? f.enum.map(o => ({ value: o, label: o.charAt(0).toUpperCase() + o.slice(1) })) : [{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} />{hintNode && <span className="se-fx-h">{hintNode}</span>}</div>;
    return <div className={f.type === "text" ? "rp-wide" : ""} key={f.id}><Fx label={label} hint={hintNode}>{f.type === "text" ? <textarea rows={2} value={values[f.id] || ""} onChange={e => setField(f.id, e.target.value)} /> : <input inputMode={f.type === "array" || f.type === "string" ? "text" : "decimal"} value={values[f.id] || ""} onChange={e => setField(f.id, e.target.value)} />}</Fx></div>;
  };
  const privateFields = fields.filter(f => f.private && !complex(f)), plainFields = fields.filter(f => !f.private && !complex(f)), groups = fields.filter(complex);
  const groupValue = (f: Field) => { try { return JSON.parse(values[f.id] || ""); } catch { return undefined; } };
  const dataPages = [
    ...(privateFields.length ? [{ id: "d:private", title: "Private Values", hint: "Sealed on this device before anything is sent" }] : []),
    ...(plainFields.length ? [{ id: "d:details", title: "Other Details", hint: "Also sealed, used to shape the answer" }] : []),
    ...groups.map(g => ({ id: `d:${g.id}`, title: g.label, hint: g.help || (g.type === "array" ? "A list you can add rows to" : `${((g as ManifestField).fields || []).length} related values`) })),
  ];
  const page = dataPages[Math.min(dataPage, Math.max(0, dataPages.length - 1))];
  const railId = current === "Your data" ? page?.id || "Your data" : current;
  const reachable = (s: string) => STAGES.indexOf(s) <= stage || (s === "Pay" && consent);
  const idx = STAGES.indexOf(current);
  const allowed = (s: string) => reachable(s) && setView(s);
  const termsOk = consent && input.ok && (v?.method_kind?.kind !== "prompt" || promptConsent);
  const statusCard = <section className="se-split-card rp-status" aria-label="Run status">
    <b className="se-cap">Run Status</b>
    <dl>
      <div><dt>Price per run</dt><dd>{price}</dd></div>
      <div><dt>Your payment</dt><dd>{escrowText}</dd></div>
      <div><dt>Method version</dt><dd>Version {v?.number}</dd></div>
      {!!events.length && <div><dt>Latest progress</dt><dd>{statusLabel(events[events.length - 1].phase)}<small>{new Date(events[events.length - 1].at).toLocaleTimeString()}</small></dd></div>}
    </dl>
    {(payTx || settled?.settle_tx_url) && <div className="uses">{payTx && <a className="use" href={payTx} target="_blank" rel="noreferrer">{icon("link")}Payment on NEAR</a>}{settled?.settle_tx_url && <a className="use" href={settled.settle_tx_url} target="_blank" rel="noreferrer">{icon("link")}Settlement on NEAR</a>}</div>}
    {chain?.reclaimable && <button className="view" disabled={!!busy} onClick={reclaim}>Take my payment back</button>}
    {chain?.reclaim_after_ns && chain.status === "Paid" && <span className="se-foot-note">You can take the payment back after {new Date(Number(BigInt(chain.reclaim_after_ns)/1000000n)).toLocaleString()} if the run does not finish.</span>}
    {operation && <button className="view" disabled={!!busy} onClick={()=>act("Checking progress",async()=>{const op=await backend<{status:string;kind:string;error?:{message:string}}>(`operations/${operation}`);if(op.status === "succeeded"&&op.kind === "execution"){const s=secrets.get(runId);if(s){displayExecution(s,await backend<Execution>(`runs/${encodeURIComponent(runId)}/execution`));setView("Result");}}else if(op.status !== "succeeded")throw new Error(op.error?.message||`The job is ${statusLabel(op.status).toLowerCase()}.`);})}>Check progress again</button>}
    <span className="se-foot-note">Your data and answer never leave this browser unsealed.</span>
  </section>;

  return <Capability id="run_drafts_quotes"><AppShell active={status === "Released" || status === "Refunded" ? "Results" : "Ongoing"}>
    {error && !d && <section className="card ph" role="alert"><p className="form-error">{error}</p></section>}
    {d && v && <section className="card list-card se rp">
      <header className="se-head">
        <div className="ph-title"><Link className="ghost-ic" href={`/marketplace/${encodeURIComponent(d.method_id)}`} aria-label="Back to the method" title="Back to the method"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></Link><div><h2>{d.title}</h2><span>Private run of version {v.number}</span></div></div>
        <div className="se-head-acts"><span className={`kchip ${status === "Released" ? "" : "se-chip-wait"}`}>{escrowText}</span><PageInfo title="What Happens in a Private Run" points={[{ icon: icon("lock"), text: "Your data is sealed in this browser. Only ciphertext leaves." }, { icon: icon("coins"), text: "Your payment waits in escrow until every step works." }, { icon: icon("check"), text: "The answer opens here, and your device checks it." }]} /></div>
      </header>
      <div className="se-body">
        <StepRail label="Run steps" steps={[...dataPages, ...STAGES.slice(1).map(s => ({ id: s, title: STAGE_TITLE[s], hint: STAGE_HINT[s] }))]} current={railId} done={Object.fromEntries([...dataPages.map(p => [p.id, stage > 0 || !!quote]), ...STAGES.map((s, i) => [s, i < stage || (s === "Result" && !!answer)])])} disabled={Object.fromEntries(STAGES.map(s => [s, !reachable(s)]))} onPick={id => { const i = dataPages.findIndex(p => p.id === id); if (i >= 0) { setDataPage(i); setView("Your data"); } else allowed(id); }} />
        <div className="se-panel">
          <div className="se-panel-head"><h3>{current === "Your data" && page ? page.title : STAGE_TITLE[current]}</h3><p>{current === "Your data" && page ? `${page.hint}. Part ${dataPage + 1} of ${dataPages.length} of your data.` : `${STAGE_HINT[current]}.`}</p></div>
          <div className="se-split">
            <div className="se-fields">
              {current === "Your data" && <>
                {dataPage === 0 && <PreparationSources methodId={d.method_id} runId={runId || undefined} fields={fields} onValue={(fieldId,value,source)=>{setValues(old=>({...old,[fieldId]:typeof value === "string" ? value : JSON.stringify(value)}));setSources(old=>({...old,[fieldId]:source}));}}/>}
                {page?.id === "d:private" && <div className="rp-grid">{privateFields.map(fieldInput)}</div>}
                {page?.id === "d:details" && <div className="rp-grid">{plainFields.map(fieldInput)}</div>}
                {groups.filter(f => page?.id === `d:${f.id}`).map(f => { const mf = f as ManifestField; const gv = groupValue(f); const obj = gv && typeof gv === "object" && !Array.isArray(gv) ? gv as Record<string, unknown> : {};
                  return mf.type === "object" ? <div className="rp-grid" key={f.id}>{(mf.fields || []).map(child => <ManifestInput key={child.id} field={child} value={obj[child.id]} onChange={next => setField(f.id, JSON.stringify({ ...obj, [child.id]: next }))} />)}</div>
                    : <ManifestInput key={f.id} field={{ ...mf, label: "Items", help: undefined }} value={gv} onChange={next => setField(f.id, next === undefined ? "" : JSON.stringify(next))} />; })}
              </>}
              {current === "Pay" && <>
                <Dropdown label="Payment" value={payment} onChange={setPayment} options={[{value:"demo_topup",label:"Test top-up (no real money)"},{value:"wallet",label:"NEAR wallet"}]}/>
                {quote ? <section className="se-box"><header><b>{icon("coins")}Cost of This Run</b><span>This quote is valid until {new Date(quote.expires_at).toLocaleTimeString()}.</span></header>
                  <dl className="rp-dl">{Object.entries({"Method price":quote.method_price,"Storage deposit":quote.storage_deposit,"Infrastructure, paid by Kalis":quote.infra_fee,"Network fee, at most":quote.gas,"Most you can pay":quote.max_total}).map(([label,money])=><div key={label}><dt>{label}</dt><dd>{money?.display || "Unavailable"}</dd></div>)}</dl></section>
                  : <p className="se-empty">Go back to Your Data and press See the cost first.</p>}
                <div className="se-note">{icon("info")}<span>Wallet payment needs your connected NEAR testnet account. A submitted payment is never retried automatically.</span></div>
              </>}
              {current === "Run" && <section className="se-box"><header><b>{icon("play")}{busy ? "Running in the Locked Chip" : "Steps That Will Run"}</b><span>{busy ? "This can take up to four minutes. Keep this tab open." : "Keep this tab open. The key that opens your answer lives only here."}</span></header>
                <ol className={`steps ${busy ? "live" : ""}`}>{(m.steps || []).map((s, i) => <li key={s.id} style={{ "--i": i } as React.CSSProperties}><span className="sn">{i + 1}</span><span>{s.what}</span></li>)}</ol></section>}
              {current === "Result" && <>
                {!answer && <div className="se-note">{icon("info")}<span>{runId && !secrets.has(runId) ? "This tab did not seal this run, so it cannot open the answer. Your payment status is on the right." : "The answer appears here after the run."}</span></div>}
                {verdict && <div className={`verdict v-${verdict.status}`}><b>{VERDICT_TEXT[verdict.status] || statusLabel(verdict.status)}</b>{verdict.reasons.map(r => <span key={r}>{r}</span>)}</div>}
                {answer && <section className="se-box"><header><b>{icon("file")}Your Answer</b></header><dl className="rp-dl">{(m.outputs?.fields || []).map(f => <div key={f.id}><dt>{f.label}</dt><dd>{show(answer[f.id])}{f.unit && answer[f.id] !== undefined ? ` ${f.unit}` : ""}</dd></div>)}</dl></section>}
                {checks && <section className="se-box"><header><b>{icon("shield")}Your Checks</b></header><div className="rows">{checks.results.map(c => <div className="row" key={c.id}><span className={`okdot s-${c.status}`} aria-hidden="true">{icon(c.status === "pass" ? "check" : "info")}</span><span className="two"><b>{c.description}</b><span>{c.status === "pass" ? "Passed" : c.status === "not_applicable" ? "Does not apply to this answer" : c.message}</span></span></div>)}</div></section>}
                {proof.length > 0 && <section className="se-box"><header><b>{icon("check")}Proof</b></header><div className="uses">{proof.map(p => <span className={`use ${p.ok ? "" : "bad"}`} key={p.label}>{icon(p.ok ? "check" : "info")}{p.label}</span>)}</div></section>}
                {!!aiCalls.length && <details className="se-more"><summary>Private AI call evidence</summary><pre className="backend-data">{JSON.stringify(aiCalls,null,2)}</pre></details>}
              </>}
              {runId && !answer && secrets.has(runId) && <button className="view" disabled={!!busy} onClick={openExisting}>Open completed answer on this device</button>}
              {pendingCall && !reviewing && chain?.status !== "Paid" && chain?.status !== "Reclaimed" && <div className="se-warn"><p>{walletErr || "The payment is prepared but not signed yet. Nothing has been paid."}</p><div className="se-actions"><button className="primary-btn" disabled={walletBusy} onClick={() => setReviewing(lastMode.current)}>Review and sign</button></div></div>}
              {pendingCall && !reviewing && chain?.status !== "Paid" && <div className="se-note">{icon("info")}<span>If you already signed, the payment may still be confirming on chain. Check its status before signing again. <button className="view" disabled={!!busy} onClick={()=>act("Checking wallet payment",async()=>setChain(await backend(`runs/${encodeURIComponent(runId)}`)))}>Check payment status</button></span></div>}
              {!!paymentAttempt.current && !runId && <button className="view" onClick={recoverPayment} disabled={!!busy}>Check payment status</button>}
            </div>
            <aside className="rp-side">
              {current === "Your data" && <section className="se-split-card rp-terms" aria-label="Before you pay">
                <div className="rp-cap-row"><b className="se-cap">Before You Pay</b><b className="rp-price">{price}</b></div>
                {!!m.ai?.allowed?.length && <div className="rp-models"><span className="se-fx-l">Private Models</span>{m.ai.allowed.map(model=><label className="consent" key={model}><input type="checkbox" checked={models.includes(model)} onChange={e=>setModels(old=>e.target.checked?[...old,model]:old.filter(x=>x!==model))}/><span>{model}</span></label>)}</div>}
                {v.method_kind?.kind === "prompt" && <label className="consent"><input type="checkbox" checked={promptConsent} onChange={e=>setPromptConsent(e.target.checked)}/><span>I understand this is an AI prompt. Following the seller’s rules cannot be proven, and its answer is at best Needs your attention.</span></label>}
                <label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I checked my data and agree to pay {price} into escrow.</span></label>
                {!input.ok && <span className="se-foot-note rp-bad">{input.message}</span>}
                <span className="se-foot-note">The example values are synthetic. Replace them with your own. They are sealed here and never shown to the expert.</span>
              </section>}
              {current === "Pay" && quote && <section className="se-split-card" aria-label="Where the money goes">
                <b className="se-cap">Where the Method Price Goes</b>
                <div className="se-bar" role="img" aria-label={`Expert ${quote.allocation_base.seller_pct}%, community ${quote.allocation_base.dao_pct}%, platform ${quote.allocation_base.platform_pct}%`}><i style={{ flex: quote.allocation_base.seller_pct }} className="b1" /><i style={{ flex: quote.allocation_base.dao_pct }} className="b2" /><i style={{ flex: quote.allocation_base.platform_pct }} className="b3" /></div>
                <dl><div><dt><i className="b1" />Expert</dt><dd>{quote.allocation_base.seller_pct}%</dd></div><div><dt><i className="b2" />Community fund</dt><dd>{quote.allocation_base.dao_pct}%</dd></div><div><dt><i className="b3" />Kalis platform</dt><dd>{quote.allocation_base.platform_pct}%</dd></div></dl>
                <span className="se-foot-note">{price} waits in the escrow contract. It is released only if every step works. Otherwise you can take it back after the timeout.</span>
              </section>}
              {current === "Result" && answer && eligibility?.eligible && !rated && <section className="se-split-card" aria-label="Rate this method">
                <b className="se-cap">Rate This Method</b>
                <div className="rate">{[1, 2, 3, 4, 5].map(n => <button key={n} className={n <= rating ? "on" : ""} aria-label={`${n} out of 5`} onClick={() => setRating(n)}>★</button>)}</div>
                <Fx label="Comment" hint="Optional. Leave out your private data."><textarea rows={2} maxLength={500} value={comment} onChange={e => setComment(e.target.value)} /></Fx>
                <button className="view" disabled={!rating || !!busy} onClick={rate}>Save rating</button>
              </section>}
              {rated && <div className="se-msg">{icon("check")}<span>{rated}</span></div>}
              {current !== "Your data" && statusCard}
            </aside>
          </div>
          <Msg error={d && v ? error : ""} text={busy} />
          <footer className="se-nav">
            <button className="view" disabled={idx <= 0 && dataPage === 0} onClick={() => { if (current === "Your data") setDataPage(Math.max(0, dataPage - 1)); else { setView(STAGES[Math.max(0, idx - 1)]); if (idx === 1) setDataPage(Math.max(0, dataPages.length - 1)); } }}>Back</button>
            <span>{escrowText}</span>
            {current === "Your data" && dataPage < dataPages.length - 1 && <button className="primary-btn" onClick={() => setDataPage(dataPage + 1)}>Continue</button>}
            {current === "Your data" && dataPage >= dataPages.length - 1 && <button className="primary-btn" disabled={!!busy || !termsOk} onClick={prepareQuote}>{busy || "See the cost"}</button>}
            {current === "Pay" && <button className="primary-btn" disabled={!!busy || !consent || !!runId || !!paymentAttempt.current || (payment === "wallet" && !auth.session)} onClick={pay}>{icon("lock")}{busy || (payment === "wallet" ? "Seal and review payment" : "Seal and pay")}</button>}
            {current === "Run" && <button className="primary-btn" disabled={!!busy || chain?.status !== "Paid" || !secrets.has(runId) || !!answer} onClick={execute}>{icon("play")}{busy || "Run privately"}</button>}
            {current === "Result" && answer && !settled && <button className="primary-btn" disabled={!!busy} onClick={settle}>{busy || "Release payment"}</button>}
          </footer>
        </div>
      </div>
      {pendingCall && reviewing && <WalletReview call={pendingCall} signer={auth.session?.account_id} busy={walletBusy} error={walletErr}
        title={reviewing === "pay" ? "Review Your Payment" : "Review Taking Your Payment Back"}
        explanation={reviewing === "pay" ? `You are about to pay for one private run of ${d?.title || "this method"}, version ${v?.number ?? ""}. The money goes into the Kalis escrow contract, not to the expert. It is released only if every step succeeds, otherwise you can take it back after the timeout.` : "This asks the escrow contract to return your payment for this run to your account. It works only after the timeout has passed."}
        onConfirm={() => void confirmWallet()} onCancel={() => { setReviewing(null); setWalletErr(""); }}/>}
    </section>}
  </AppShell></Capability>;
}
