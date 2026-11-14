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
import { PageInfo, Segmented, Dropdown } from "./controls";

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
  return <Capability id="run_drafts_quotes"><AppShell active={status === "Released" || status === "Refunded" ? "Results" : "Ongoing"}>
    <section className="card ph">
      <div className="ph-title">
        <Link className="ghost-ic" href={d ? `/marketplace/${encodeURIComponent(d.method_id)}` : "/marketplace"} aria-label="Back" title="Back"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
        <h1>{d ? d.title : "Run privately"}</h1>
      </div>
      <div className="ph-actions"><PageInfo title="What happens in a private run" points={[{ icon: icon("lock"), text: "Your data is sealed in this browser. Only ciphertext leaves." }, { icon: icon("coins"), text: "Your payment waits in escrow until every step works." }, { icon: icon("check"), text: "The answer opens here, and your device checks it." }]} /></div>
    </section>
    {error && <section className="card ph" role="alert"><p className="form-error">{error}</p></section>}
    {d && v && <div className="detail">
      <section className="card list-card">
        <div className="toolbar"><Segmented label="Run stage" options={STAGES} value={current} onChange={s => (STAGES.indexOf(s) <= stage || (s === "Pay" && consent)) && setView(s)} /></div>
        <div className="dpane" key={current}>
          {current === "Your data" && <>
            <div className="dblock">
              <div className="note-row">{icon("lock")}<span>The example values are synthetic. Replace them with your own. They are sealed here and never shown to the expert.</span></div>
              <PreparationSources methodId={d.method_id} runId={runId || undefined} fields={m.inputs?.fields || []} onValue={(fieldId,value,source)=>{setValues(old=>({...old,[fieldId]:typeof value === "string" ? value : JSON.stringify(value)}));setSources(old=>({...old,[fieldId]:source}));}}/>
              <div className="rform">{(m.inputs?.fields || []).map(f => {
                const set = (x: string) => {setValues({ ...values, [f.id]: x }); setSources(old=>({...old,[f.id]:{kind:"typed",reviewed_by_buyer:true}}));};
                const label = `${f.label}${f.unit ? ` (${f.unit})` : ""}${f.required ? "" : ", optional"}${f.private ? ", private" : ""}`;
                if (f.type === "boolean" || f.enum) return <div className="fx-dd" key={f.id} title={f.help}><Dropdown label={label} value={values[f.id] || (f.enum ? f.enum[0] : "false")} onChange={set} options={f.enum ? f.enum.map(o => ({ value: o, label: o.charAt(0).toUpperCase() + o.slice(1) })) : [{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} /></div>;
                return <label className={`fx ${f.type === "text" ? "tall full" : ""}`} key={f.id} title={f.help}>
                  <span className="fx-label">{label}</span>
                  {f.type === "text" ? <textarea rows={3} value={values[f.id] || ""} onChange={e => set(e.target.value)} /> : <input inputMode={f.type === "array" || f.type === "string" ? "text" : "decimal"} value={values[f.id] || ""} onChange={e => set(e.target.value)} placeholder={f.type === "array" ? "Separate with commas" : ""} />}
                </label>;
              })}</div>
              {!input.ok && <p className="form-error">{input.message}</p>}
            </div>
            {v.method_kind?.kind === "prompt" && <label className="consent"><input type="checkbox" checked={promptConsent} onChange={e=>setPromptConsent(e.target.checked)}/><span>I understand this is an AI prompt. Following the seller’s rules cannot be proven, and its answer is at best Needs your attention.</span></label>}
            {!!m.ai?.allowed?.length && <div className="dblock"><h2 className="h3">Private models</h2>{m.ai.allowed.map(model=><label className="consent" key={model}><input type="checkbox" checked={models.includes(model)} onChange={e=>setModels(old=>e.target.checked?[...old,model]:old.filter(x=>x!==model))}/><span>{model}</span></label>)}</div>}
            <div className="nf-foot"><label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I checked my data and agree to pay {v.price_amount?.display || `${v.price_near} NEAR`} into escrow.</span></label><button className="primary-btn" disabled={!!busy || !consent || !input.ok || (v.method_kind?.kind === "prompt" && !promptConsent)} onClick={prepareQuote}>{busy || "See the cost"}</button></div>
          </>}
          {current === "Pay" && <div className="dblock"><h2 className="h3">Pay into escrow</h2>
            <div className="rows">
              <Dropdown label="Payment" value={payment} onChange={setPayment} options={[{value:"demo_topup",label:"Test top-up (no real money)"},{value:"wallet",label:"NEAR wallet"}]}/>
              {quote && Object.entries({"Method price":quote.method_price,"Storage deposit":quote.storage_deposit,"Infrastructure paid by platform":quote.infra_fee,"Gas upper bound":quote.gas,"Maximum total":quote.max_total}).map(([label,money])=><div className="row" key={label}><span>{label}</span><b>{money?.display || "Unavailable"}</b></div>)}
              {quote && <div className="note-row">Method price split {quote.allocation_base.seller_pct}% expert, {quote.allocation_base.dao_pct}% community, {quote.allocation_base.platform_pct}% platform. Quote expires {new Date(quote.expires_at).toLocaleTimeString()}.</div>}
              <div className="row"><span className="two"><b>{v.price_amount?.display || `${v.price_near} NEAR`} held by the escrow contract</b><span>Released to the expert, the community fund and Kalis only if every step works. Otherwise you can reclaim it after the timeout.</span></span></div>
            </div>
            <div className="nf-foot"><span className="note-row">{icon("info")}<span>Wallet payment requires your connected NEAR testnet account. A submitted payment is never retried automatically.</span></span><button className="primary-btn" disabled={!!busy || !consent || !!runId || !!paymentAttempt.current || (payment === "wallet" && !auth.session)} onClick={pay}>{icon("lock")}{busy || (payment === "wallet" ? "Seal and review payment" : "Seal and pay")}</button></div>
          </div>}
          {runId && !answer && secrets.has(runId) && <button className="view" disabled={!!busy} onClick={openExisting}>Open completed answer on this device</button>}
          {pendingCall && reviewing && <WalletReview call={pendingCall} signer={auth.session?.account_id} busy={walletBusy} error={walletErr}
            title={reviewing === "pay" ? "Review your payment" : "Review taking your payment back"}
            explanation={reviewing === "pay" ? `You are about to pay for one private run of ${d?.title || "this method"}, version ${v?.number ?? ""}. The money goes into the Kalis escrow contract, not to the expert. It is released only if every step succeeds, otherwise you can take it back after the timeout.` : "This asks the escrow contract to return your payment for this run to your account. It works only after the timeout has passed."}
            onConfirm={() => void confirmWallet()} onCancel={() => { setReviewing(null); setWalletErr(""); }}/>}
          {pendingCall && !reviewing && chain?.status !== "Paid" && chain?.status !== "Reclaimed" && <div className="note-row"><div><p>{walletErr || "The payment is prepared but not signed yet. Nothing has been paid."}</p><button className="primary-btn" disabled={walletBusy} onClick={() => setReviewing(lastMode.current)}>Review and sign</button></div></div>}
          {pendingCall && !reviewing && chain?.status !== "Paid" && <div className="note-row"><div><p>If you already signed, the payment may still be confirming on chain. Check its status before signing again.</p><button className="view" disabled={!!busy} onClick={()=>act("Checking wallet payment",async()=>setChain(await backend(`runs/${encodeURIComponent(runId)}`)))}>Check payment status</button></div></div>}
          {!!paymentAttempt.current && !runId && <button className="view" onClick={recoverPayment} disabled={!!busy}>Check payment status</button>}
          {current === "Run" && <div className="dblock"><h2 className="h3">{busy ? "Running in the locked chip. This can take up to four minutes." : "Ready to run"}</h2>
            <ol className={`steps ${busy ? "live" : ""}`}>{(m.steps || []).map((s, i) => <li key={s.id} style={{ "--i": i } as React.CSSProperties}><span className="sn">{i + 1}</span><span>{s.what}</span></li>)}</ol>
            <div className="nf-foot"><span className="note-row">{icon("info")}<span>Keep this tab open. The key that opens your answer lives only here.</span></span><button className="primary-btn" disabled={!!busy || chain?.status !== "Paid" || !secrets.has(runId) || !!answer} onClick={execute}>{icon("play")}{busy || "Run privately"}</button></div>
          </div>}
          {current === "Result" && <>
            {!answer && <div className="note-row">{icon("info")}<span>{runId && !secrets.has(runId) ? "This tab did not seal this run, so it cannot open the answer. The escrow status is on the right." : "The answer appears here after the run."}</span></div>}
            {verdict && <div className={`verdict v-${verdict.status}`}><b>{VERDICT_TEXT[verdict.status] || verdict.status}</b>{verdict.reasons.map(r => <span key={r}>{r}</span>)}</div>}
            {answer && <div className="dblock"><h2 className="h3">Your answer</h2><div className="rows">{(m.outputs?.fields || []).map(f => <div className="row" key={f.id}><span className="two"><span>{f.label}</span><b>{show(answer[f.id])}{f.unit && answer[f.id] !== undefined ? ` ${f.unit}` : ""}</b></span></div>)}</div></div>}
            {checks && <div className="dblock"><h2 className="h3">Your checks</h2><div className="rows">{checks.results.map(c => <div className="row" key={c.id}><span className={`okdot s-${c.status}`} aria-hidden="true">{icon(c.status === "pass" ? "check" : "info")}</span><span className="two"><b>{c.description}</b><span>{c.status === "pass" ? "Passed" : c.status === "not_applicable" ? "Does not apply to this answer" : c.message}</span></span></div>)}</div></div>}
            {!!aiCalls.length && <details className="dblock"><summary>Private AI call evidence</summary><pre className="backend-data">{JSON.stringify(aiCalls,null,2)}</pre></details>}
            {proof.length > 0 && <div className="dblock"><h2 className="h3">Proof</h2><div className="uses">{proof.map(p => <span className={`use ${p.ok ? "" : "bad"}`} key={p.label}>{icon(p.ok ? "check" : "info")}{p.label}</span>)}</div></div>}
            {answer && !settled && <div className="nf-foot"><span className="note-row">{icon("coins")}<span>Release the escrow when you are done. A failed run refunds instead.</span></span><button className="primary-btn" disabled={!!busy} onClick={settle}>{busy || "Settle payment"}</button></div>}
            {eligibility?.eligible && !rated && <div className="dblock"><h2 className="h3">Rate this method</h2><div className="rate">{[1, 2, 3, 4, 5].map(n => <button key={n} className={n <= rating ? "on" : ""} aria-label={`${n} out of 5`} onClick={() => setRating(n)}>★</button>)}</div>
              <label className="fx tall full"><span className="fx-label">Comment, optional. Leave out your private data.</span><textarea rows={2} maxLength={500} value={comment} onChange={e => setComment(e.target.value)} /></label>
              <div className="nf-foot"><span /><button className="primary-btn" disabled={!rating || !!busy} onClick={rate}>Save rating</button></div></div>}
            {rated && <div className="note-row">{icon("check")}<span>{rated}</span></div>}
          </>}
        </div>
      </section>
      <aside className="card dside" aria-label="Run summary">
        <div className="dprice"><small>Price per run</small><b>{v.price_amount?.display || `${v.price_near} NEAR`}</b></div>
        <div className="rows">
          <div className="row"><span className="two"><span>Escrow</span><b>{status ? ({ Paid: "Held in escrow", Released: "Released to the expert", Refunded: "Refunded to you" } as Record<string, string>)[status] || status : "Not paid yet"}</b></span></div>
          {runId && <div className="row"><span className="two"><span>Run</span><b className="hash">{runId}</b></span></div>}
          <div className="row"><span className="two"><span>Version</span><b>v{v.number}</b></span></div>
        </div>
        {(payTx || settled?.settle_tx_url) && <div className="uses">{payTx && <a className="use" href={payTx} target="_blank" rel="noreferrer">{icon("link")}Payment on NEAR</a>}{settled?.settle_tx_url && <a className="use" href={settled.settle_tx_url} target="_blank" rel="noreferrer">{icon("link")}Settlement on NEAR</a>}</div>}
        {!!events.length && <div className="dblock"><h2 className="h3">Job progress</h2>{events.map((event,i)=><div className="row" key={`${event.at}-${i}`}><span>{event.phase.replaceAll("_"," ")}</span><small>{new Date(event.at).toLocaleTimeString()}</small></div>)}</div>}
        {chain?.reclaimable && <button className="view" disabled={!!busy} onClick={reclaim}>Take my payment back</button>}
        {chain?.reclaim_after_ns && chain.status === "Paid" && <div className="note-row">Reclaim available after {new Date(Number(BigInt(chain.reclaim_after_ns)/1000000n)).toLocaleString()}.</div>}
        {operation && <div className="note-row"><div><p>Operation {operation}</p><button className="view" disabled={!!busy} onClick={()=>act("Checking operation",async()=>{const op=await backend<{status:string;kind:string;error?:{message:string}}>(`operations/${operation}`);if(op.status === "succeeded"&&op.kind === "execution"){const s=secrets.get(runId);if(s){displayExecution(s,await backend<Execution>(`runs/${encodeURIComponent(runId)}/execution`));setView("Result");}}else if(op.status !== "succeeded")throw new Error(op.error?.message||`Operation is ${op.status}.`);})}>Check operation status</button></div></div>}
        <div className="dside-foot"><span className="hint2">Your data and answer never leave this browser unsealed.</span></div>
      </aside>
    </div>}
  </AppShell></Capability>;
}
