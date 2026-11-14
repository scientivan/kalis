"use client";
import { statusLabel, useMethodTitles } from "../lib/labels";
import { Fx } from "./form-kit";
import { Chip, ErrorPanel, SkeletonTiles, StatePanel, Tile, TileGrid, TileIcon, methodIdentity } from "./tiles";
import { WalletReview, walletError, actionLabel } from "./wallet-review";
import { plainError } from "../lib/backend/client";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { backend } from "../lib/backend/client";
import { useNearAuth } from "../lib/near/auth";
import { sealData, sealMethod, sha256Hex } from "../lib/backend/crypto";
import { AppShell, icon } from "./shell";
import { Dropdown, NearTech, PageInfo } from "./controls";
import { NEAR_TECH } from "../lib/near-tech";
import { FundSocialMoney } from "./social-money";

type Obj = Record<string, any>;
type Section = "Fund" | "Proposals" | "Bounties" | "Issues";
const id = (x: unknown) => encodeURIComponent(String(x));
const pretty = (x: unknown) => JSON.stringify(x, null, 2);
const list = (x: any): Obj[] => Array.isArray(x) ? x : x?.items || [];
/** Human title for an issue, proposal or bounty. Strips chain tags and the "Bounty for x v2 (module):" prefix. */
const title = (x: Obj) => { const t = String(x.problem || x.description || x.label || "").replace(/\s*\[kalis:[^\]]*\]/g, "").split(" | ")[0].replace(/^Bounty(?: for [\w-]+ v\d+(?: \([^)]*\))?)?:\s*/i, "").trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1) : (String(x.id || "").startsWith("prop-") ? "Funding proposal" : typeof x.id === "number" ? `Bounty ${x.id}` : "Community record"); };
const allowed = (x: Obj, action: string) => Array.isArray(x.allowed_actions) && x.allowed_actions.includes(action);
function Field({ label, hint, value, onChange, required, type = "text", multiline = false, cls }: { label: string; hint?: string; value: string; onChange: (s: string) => void; required?: boolean; type?: string; multiline?: boolean; cls?: string }) {
  return <div className={cls ?? (multiline ? "rp-wide" : "")}><Fx label={label} hint={hint}>{multiline ? <textarea required={required} rows={2} value={value} onChange={e => onChange(e.target.value)} /> : <input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} />}</Fx></div>;
}
function Note({ children }: { children: ReactNode }) { return <div className="se-note rp-wide">{icon("info")}<span>{children}</span></div>; }
function Proof({ label, value }: { label: string; value: unknown }) { return <details className="dblock"><summary>{label}</summary><pre className="backend-data">{pretty(value)}</pre></details>; }
function moneyToYocto(value: string) {
  if (!/^\d+(\.\d{1,24})?$/.test(value)) throw new Error("Enter a positive NEAR amount with up to 24 decimal places.");
  const [whole, fraction = ""] = value.split("."); const amount = BigInt(whole) * 10n ** 24n + BigInt(fraction.padEnd(24, "0"));
  if (amount <= 0n) throw new Error("The budget must be greater than zero."); return amount.toString();
}
const explanations: Record<Section, string> = {
  Fund: "See the shared budget and the council responsible for funding method improvements.",
  Proposals: "Propose a funded fix and follow the council’s decision. Acceptance rules are fixed before work starts.",
  Bounties: "Find funded improvements, submit a sealed candidate and follow testing, review and payment.",
  Issues: "Report a problem with a method and follow it from investigation to a funded improvement.",
};

export function CommunityWorkspace({ section }: { section: Section }) {
  const auth = useNearAuth();
  const [data, setData] = useState<Obj | null>(null), [config, setConfig] = useState<Obj | null>(null), [capability, setCapability] = useState<Obj | null>(null);
  const [items, setItems] = useState<Obj[]>([]), [selected, setSelected] = useState<Obj | null>(null), [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(""), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [pendingCall, setPendingCallRaw] = useState<Obj | null>(null); const [signError, setSignError] = useState("");
  const setPendingCall = (c: Obj | null) => { setSignError(""); setPendingCallRaw(c); };
  const methodTitle = useMethodTitles();
  const [principal, setPrincipal] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [privateCapability, setPrivateCapability] = useState<Obj | null>(null);
  const endpoint = section === "Fund" ? "dao" : section.toLowerCase();
  const enabled = capability?.status === "enabled" || capability?.status === "demo";
  const council = !!auth.session && (config?.council || []).includes(auth.session.account_id);
  const refresh = async () => {
    setLoading(true); setError("");
    const results = await Promise.allSettled([backend<Obj>(endpoint), backend<Obj>("community/config"), backend<Obj>("capabilities"), backend<Obj>("me")]);
    if (results[0].status === "fulfilled") { setData(results[0].value); setItems(list(results[0].value)); setCursor(results[0].value.next_cursor || null); } else setError(results[0].reason.message);
    if (results[1].status === "fulfilled") setConfig(results[1].value); else setError(results[1].reason.message);
    if (results[2].status === "fulfilled") { setCapability(results[2].value.features?.find((x: Obj) => x.id === "community_write") || { status: "unavailable", reason: "Community capability was not declared." }); setPrivateCapability(results[2].value.features?.find((x: Obj) => x.id === "private_test_cases") || {status:"unavailable",reason:"Private tests were not declared."}); }
    else setCapability({ status: "unavailable", reason: "Capabilities could not be loaded." });
    if (results[3].status === "fulfilled") setPrincipal(results[3].value.id);
    setLoading(false);
  };
  useEffect(() => { setSelected(null); setCreating(section === "Proposals" && new URLSearchParams(window.location.search).has("issue")); setPendingCall(null); void refresh(); }, [section, auth.session?.account_id]);
  async function act(label: string, path: string, body: unknown, selectResult = true) {
    setBusy(label); setError(""); setNotice("");
    try {
      const result = await backend<Obj>(path, body);
      const call = result.contract_call || result.payout?.contract_call || result.publish?.contract_call;
      if (call) { setPendingCall(call); setNotice("Review the contract call, then sign with the required NEAR wallet. Status is not final until confirmed on chain."); }
      if (selectResult && result.id) setSelected(result);
      await refresh(); return result;
    } catch (e) { setError(e instanceof Error ? e.message : "The operation failed."); return null; }
    finally { setBusy(""); }
  }
  async function open(item: Obj) {
    setBusy("Loading details"); setError("");
    try { setSelected(await backend<Obj>(`${endpoint}/${id(item.id)}`)); } catch (e) { setError(e instanceof Error ? e.message : "Details could not be loaded."); } finally { setBusy(""); }
  }
  async function sign() {
    if (!pendingCall) return; setBusy("Waiting for wallet"); setError(""); setSignError("");
    try {
      await auth.signCalls([pendingCall as any]);
      setNotice("Your wallet sent the request. The status updates once NEAR confirms it."); setPendingCall(null); await refresh();
      if (selected?.id) setSelected(await backend<Obj>(`${endpoint}/${id(selected.id)}`));
    } catch (e) { setSignError(walletError(e)); } finally { setBusy(""); }
  }
  const canWrite = enabled && !busy;
  return <AppShell active={section}>
    <section className="card ph"><h1>{section}</h1><div className="ph-actions"><NearTech {...NEAR_TECH.community} /><button className="ghost-ic" aria-label="Refresh" onClick={() => void refresh()}>{icon("pulse")}</button></div><div className="page-purpose">{icon("people")}<p>{explanations[section]}</p><span className="page-purpose-info"><PageInfo title={section} points={[{icon:icon("people"),text:explanations[section]},{icon:icon("wallet"),text:"Money and authority actions require your own testnet wallet signature."}]} /></span></div></section>
    {error && <section className="card list-card"><div className="dpane"><ErrorPanel message={plainError(error)} onRetry={() => void refresh()} title="Something did not load"/></div></section>}
    {notice && <section className="card ph" role="status"><Note>{notice}</Note></section>}
    {pendingCall && <section className="card list-card"><div className="dpane"><WalletReview call={pendingCall as any} signer={auth.session?.account_id} busy={busy === "Waiting for wallet"} error={signError}
      title={`Check before you sign. ${actionLabel(pendingCall.method_name)}`} explanation={`This ${Number(pendingCall.deposit_yocto || 0) > 0 ? "attaches the deposit below" : "attaches no deposit"} and is sent to the community contract on NEAR testnet. ${section === "Proposals" ? "A proposal bond is returned when the council decides." : ""} Nothing happens until you approve it in your wallet.`}
      confirmLabel="Sign with wallet" onConfirm={() => void sign()} onCancel={() => setPendingCall(null)}/><Proof label="Contract arguments" value={pendingCall.args}/></div></section>}
    {capability && !enabled && <section className="card ph"><Note>{capability.reason}</Note></section>}
    {loading && <section className="card ph" role="status">Loading community records</section>}
    {section === "Fund" ? <section className="card list-card"><div className="toolbar"><h2 className="list-title">Community fund</h2></div>
      <TileGrid label="Community fund">
        <Tile iconNode={<TileIcon name="coins"/>} chip={<Chip tone="blue">NEAR testnet</Chip>} title="Fund balance" desc="Part of each paid run goes here. The council uses it to pay for accepted method improvements." foot={<span className="mcard-price">{data ? `${data.balance_near} NEAR` : "Unavailable"}</span>}/>
        <Tile iconNode={<TileIcon name="spark" color="#FF5F04"/>} chip={<Chip tone="orange">For bounties</Chip>} title="Available for improvements" desc="What is left after bounties already promised to contributors." foot={<span className="mcard-price">{data?.available_near ? `${data.available_near} NEAR` : "Unavailable"}</span>}/>
        {(config?.council || []).map((a: string) => <Tile key={a} iconNode={<span className="avatar" aria-hidden="true">{a.slice(0, 1).toUpperCase()}</span>} chip={<Chip tone={auth.session?.account_id === a ? "pink" : "grey"}>{auth.session?.account_id === a ? "You" : "Council"}</Chip>} title={a} desc="Votes on funding proposals and reviews contributed fixes." />)}
      </TileGrid>
      <div className="dpane"><FundSocialMoney /></div>
      <div className="dpane"><Proof label="Council voting policy and bonds" value={config}/>{config?.rules?.map((r: Obj) => <Note key={r.id}>{r.reason}</Note>)}</div></section> : <>
      <section className="card list-card"><div className="toolbar"><h2 className="list-title">{section}</h2>{section === "Issues" && <button className="primary-btn" disabled={!canWrite} onClick={() => { setCreating(!creating); setSelected(null); }}>Report a problem</button>}{section === "Proposals" && <button className="primary-btn" disabled={!canWrite || !auth.session} onClick={() => { setCreating(!creating); setSelected(null); }}>Create proposal</button>}</div>
        <TileGrid label={section}>
          {loading && !items.length && <SkeletonTiles count={3}/>}
          {!loading && !items.length && <StatePanel title={`No ${section.toLowerCase()} yet`} text={section === "Issues" ? "Report a problem with a method to start one." : section === "Proposals" ? "A proposal funds a fix for a reported issue." : "Bounties appear when the council approves a proposal."}/>}
          {items.map(item => { const mid = methodIdentity(item.method_id); const st = item.chain_status || item.state; const status = st === "awaiting_signature" ? "Not signed yet" : statusLabel(st) || (item.open ? "Open" : "Closed");
            return <Tile key={item.id} iconNode={item.method_id ? <TileIcon name={mid.icon} color={mid.color} ink={mid.ink}/> : <TileIcon name={section === "Issues" ? "info" : section === "Proposals" ? "people" : "spark"} color="#5c5c5c"/>}
              chip={<Chip tone={/open|progress|voting|waiting/i.test(status) ? "orange" : /approved|funded|resolved/i.test(status) ? "blue" : /reject|fail|closed|expired/i.test(status) ? "grey" : undefined}>{status}</Chip>}
              title={title(item)} desc={item.method_id ? `For ${methodTitle(item.method_id)}` : item.expected || item.note || item.acceptance_criteria?.[0]}
              meta={[item.base_version || item.version ? `Version ${item.base_version || item.version}` : "", item.module ? `${item.module} part` : ""].filter(Boolean).slice(0, 2)}
              foot={<><span className="mcard-price">{item.amount?.display || item.budget?.display || ""}</span><button className="view" disabled={!!busy} onClick={() => { void open(item); setTimeout(() => document.getElementById("record-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300); }}>Details</button></>}/>; })}
        </TileGrid>
        {cursor && <div className="pager"><span>Showing {items.length}</span><button className="view" disabled={!!busy} onClick={async()=>{setBusy("Loading more");try{const page=await backend<Obj>(`${endpoint}?cursor=${id(cursor)}`);setItems(old=>[...old,...list(page)]);setCursor(page.next_cursor||null);}catch(e){setError(e instanceof Error?e.message:"Could not load more records.");}finally{setBusy("");}}}>Load more</button></div>}
      </section>
      {creating && section === "Issues" && <IssueForm disabled={!canWrite} save={b => act("Reporting problem", "issues", b).then(r => { if(r) setCreating(false); })}/>}
      {creating && section === "Proposals" && <ProposalForm council={config?.council || []} disabled={!canWrite || !auth.session} save={b => act("Preparing proposal", "proposals", b).then(r => { if(r) setCreating(false); })}/>}
      {!auth.session && section !== "Issues" && <section className="card ph"><Note>Sign in with a NEAR account to propose, claim or submit paid work.</Note><button className="primary-btn" disabled={auth.busy} onClick={auth.signIn}>Sign in with NEAR</button></section>}
      {selected && <section className="card list-card" id="record-detail"><div className="toolbar"><h2 className="list-title">{title(selected)}</h2><button className="view" onClick={() => setSelected(null)}>Close details</button></div><div className="dpane">
        <RecordFields record={selected} methodTitle={methodTitle}/>
        {section === "Issues" && <><Note>{selected.expected || "No expected outcome provided."}</Note><Proof label="Synthetic reproduction" value={selected.synthetic_reproduction}/>{selected.owner === principal && allowed(selected,"close") && <ReasonAction label="Close issue" disabled={!canWrite} onSubmit={reason => act("Closing issue",`issues/${id(selected.id)}/close`,{reason})}/>}{allowed(selected,"create_proposal") && <Link className="view" href={`/community/proposals?issue=${id(selected.id)}`}>Propose funding</Link>}</>}
        {section === "Proposals" && <><Proof label="Acceptance criteria and fixed evaluator" value={{acceptance_criteria:selected.acceptance_criteria,evaluator:selected.evaluator,reviewer:selected.reviewer}}/>{allowed(selected,"sign_add_proposal") && <button className="primary-btn" disabled={!canWrite || !auth.session} onClick={() => setPendingCall(selected.contract_call)}>Review and sign proposal</button>}<div className="nf-foot"><button className="view" disabled={!canWrite || !council || !allowed(selected,"vote_reject")} onClick={() => void act("Preparing vote",`proposals/${id(selected.id)}/vote`,{vote:"reject"},false)}>Reject proposal</button><button className="primary-btn" disabled={!canWrite || !council || !allowed(selected,"vote_approve")} onClick={() => void act("Preparing vote",`proposals/${id(selected.id)}/vote`,{vote:"approve"},false)}>Approve proposal</button></div>{!council && <Note>Only members of the DAO council can vote.</Note>}</>}
        {section === "Bounties" && <BountyDetail bounty={selected} enabled={enabled} council={council} busy={!!busy} act={act} onCall={setPendingCall}/>}
      </div></section>}
    </>}
    {section === "Bounties" && (privateCapability?.status === "enabled" || privateCapability?.status === "demo" ? <PrivateCases enabled={true} onError={setError}/> : <section className="card ph"><Note>{privateCapability?.reason || "Checking private-test availability."}</Note></section>)}
  </AppShell>;
}
function RecordFields({record, methodTitle = (x?: string | null) => x || ""}: {record:Obj; methodTitle?:(id?:string|null)=>string}) {
  const show = (k: string) => k === "method_id" ? methodTitle(record[k]) : k === "state" || k === "chain_status" ? statusLabel(record[k]) : k === "budget" || k === "amount" ? record[k]?.display : String(record[k]);
  return <div className="rows">{["method_id","base_version","module","budget","amount","state","chain_status","reviewer","note"].filter(k => record[k] != null && record[k] !== "").map(k => <div className="row" key={k}><span className="two"><span>{({method_id:"Method",base_version:"Base version",module:"Part of the method",budget:"Budget",amount:"Reward",state:"Status",chain_status:"Status on NEAR",reviewer:"Reviewer",note:"Note"} as Obj)[k]}</span><b>{show(k)}</b></span></div>)}</div>; }
function IssueForm({disabled, save}: {disabled:boolean;save:(b:Obj)=>Promise<void>}) {
  const [v,setV] = useState({method_id:"",version:"",module:"core",problem:"",expected:"",synthetic_reproduction:""}); const [error,setError]=useState("");
  return <section className="card list-card se"><header className="se-head"><div><h2>Report a Problem</h2><span>Describe what went wrong with a method, using fictional data only.</span></div></header><form className="se-form se-form6" onSubmit={e => {e.preventDefault();setError("");try {void save({...v,version:v.version ? Number(v.version):undefined,synthetic_reproduction:v.synthetic_reproduction ? JSON.parse(v.synthetic_reproduction):null});}catch{setError("Use valid JSON for the synthetic reproduction.");}}}>{Object.entries(v).map(([k,value])=><Field key={k} label={({method_id:"Method ID",version:"Version",module:"Module",problem:"What Went Wrong",expected:"Expected Outcome",synthetic_reproduction:"Synthetic Reproduction"} as Obj)[k]} hint={({method_id:"As shown in the method link.",version:"Optional. Leave empty for the latest.",module:"The part of the method, for example core.",problem:"What you saw, in plain words.",expected:"What a correct answer would look like.",synthetic_reproduction:"Optional. Fictional input as JSON that shows the problem."} as Obj)[k]} value={value} required={["method_id","problem","expected"].includes(k)} multiline={["problem","expected","synthetic_reproduction"].includes(k)} cls={k==="problem"||k==="expected"?"s3":k==="synthetic_reproduction"?"rp-wide":"s2"} onChange={s=>setV({...v,[k]:s})}/>)}<Note>Use fictional data only. Do not include your private inputs or the seller’s secret method.</Note>{error&&<p className="form-error rp-wide">{error}</p>}<footer className="se-nav rp-wide"><span /><button className="primary-btn" disabled={disabled}>Report problem</button></footer></form></section>;
}
function ProposalForm({council,disabled,save}: {council:string[];disabled:boolean;save:(b:Obj)=>Promise<void>}) {
  const [v,setV]=useState({issue_id:"",budget:"",criteria:"",fields:"",tolerance:"0.000001",min_cases:"1",reviewer:""});const [error,setError]=useState("");
  useEffect(()=>{const issue=new URLSearchParams(window.location.search).get("issue");if(issue)setV(old=>({...old,issue_id:issue}));},[]);
  return <section className="card list-card se"><header className="se-head"><div><h2>Create a Proposal</h2><span>Fund a fix for an issue. The rules you set here decide which contribution is accepted.</span></div></header><form className="se-form" onSubmit={e=>{e.preventDefault();setError("");try {void save({issue_id:v.issue_id,budget_yocto:moneyToYocto(v.budget),acceptance_criteria:v.criteria.split("\n").map(x=>x.trim()).filter(Boolean),evaluator:{compare:{fields:v.fields.split(",").map(x=>x.trim()).filter(Boolean),tolerance:Number(v.tolerance)},min_cases:Number(v.min_cases)},reviewer:v.reviewer});}catch(e){setError(e instanceof Error?e.message:"Check the proposal.");}}}>{Object.entries(v).filter(([k])=>k!=="reviewer").map(([k,value])=><Field key={k} label={({issue_id:"Issue ID",budget:"Budget",criteria:"Acceptance Criteria",fields:"Answer Fields to Compare",tolerance:"Numeric Tolerance",min_cases:"Minimum Private Cases"} as Obj)[k]} hint={({issue_id:"The issue this proposal pays to fix.",budget:"In NEAR, paid from the community fund.",criteria:"One rule per line.",fields:"Separate field IDs with commas.",tolerance:"How far a number may differ and still match.",min_cases:"Private test cases a candidate must pass."} as Obj)[k]} value={value} required onChange={s=>setV({...v,[k]:s})} multiline={k==="criteria"}/>)}<div className="se-fx"><span className="se-fx-l">Reviewer</span><Dropdown label="Reviewer" value={v.reviewer} options={[{value:"",label:"Choose a council member"},...council.map(x=>({value:x,label:x}))]} onChange={s=>setV({...v,reviewer:s})}/><span className="se-fx-h">A council member who checks the result.</span></div><Note>These rules determine acceptance and cannot be replaced by a candidate. Creating the on-chain proposal requires a wallet signature and proposal bond.</Note>{error&&<p className="form-error rp-wide">{error}</p>}<footer className="se-nav rp-wide"><span>Your wallet opens on the next screen, after you review the call.</span><button className="primary-btn" disabled={disabled||!v.reviewer}>Prepare proposal</button></footer></form></section>;
}
function ReasonAction({label,disabled,onSubmit}: {label:string;disabled:boolean;onSubmit:(reason:string)=>unknown}) { const [reason,setReason]=useState(""); return <form className="se-form" onSubmit={e=>{e.preventDefault();onSubmit(reason);}}><Field label="Reason" value={reason} required onChange={setReason}/><button className="view" disabled={disabled}>{label}</button></form>; }
type Action = (label:string,path:string,body:unknown,selectResult?:boolean)=>Promise<Obj|null>;
function BountyDetail({bounty,enabled,council,busy,act,onCall}: {bounty:Obj;enabled:boolean;council:boolean;busy:boolean;act:Action;onCall:(v:Obj)=>void}) {
  const auth=useNearAuth();const [contribution,setContribution]=useState<Obj|null>(null),[pack,setPack]=useState<Obj|null>(null),[report,setReport]=useState<Obj|null>(null);
  const [form,setForm]=useState({target_module:"core",description:"",impact:"",regression_cases:"[]"}),[candidate,setCandidate]=useState<File|null>(null),[grants,setGrants]=useState("");
  const [reason,setReason]=useState(""),[decision,setDecision]=useState("request_changes"),[error,setError]=useState(""),[localBusy,setLocalBusy]=useState(false);
  const disabled=!enabled||busy||localBusy;
  useEffect(()=>{setContribution(null);setPack(null);setReport(null);},[bounty.id]);
  async function loadContribution(value:string) {setError("");try {setContribution(await backend<Obj>(`contributions/${id(value)}`));}catch(e){setError(e instanceof Error?e.message:"Could not load contribution.");}}
  async function submit(e:FormEvent) {e.preventDefault();setError("");setLocalBusy(true);try {if(!candidate)throw new Error("Choose a candidate method file.");if(candidate.size>2_900_000)throw new Error("Use a candidate file below 2.9 MB so its sealed envelope fits the limit.");const config=await backend<Obj>("config");const bytes=new Uint8Array(await candidate.arrayBuffer());const sealed=sealMethod(config.runner.tee_pubkey,bytes);const code_hash=sha256Hex(bytes);const regressions=JSON.parse(form.regression_cases);if(!Array.isArray(regressions))throw new Error("Regression cases must be a JSON array.");const c=await act("Submitting sealed candidate",`bounties/${id(bounty.id)}/contributions`,{candidate:{sealed,code_hash},base_version:bounty.base_version,target_module:form.target_module,description:form.description,impact:form.impact,regression_cases:regressions},false);if(c)setContribution(c);}catch(e){setError(e instanceof Error?e.message:"Candidate submission failed.");}finally{setLocalBusy(false);}}
  async function runTests(){if(!contribution)return;const r=await act("Testing inside the runner",`contributions/${id(contribution.id)}/tests`,{grant_ids:grants.split(/[\s,]+/).filter(Boolean)},false);if(r){setReport(r);if(r.contribution)setContribution(r.contribution);}}
  async function review(e:FormEvent){e.preventDefault();if(!contribution)return;const r=await act("Saving review",`contributions/${id(contribution.id)}/reviews`,{decision,reason,test_run_ids:contribution.test_runs||[]},false);if(r)setContribution(r);}
  async function moneyAction(path:string,label:string,body:unknown){const r=await act(label,path,body,false);if(r){if(r.contribution)setContribution(r.contribution);const call=r.payout?.contract_call||r.publish?.contract_call||r.contract_call;if(call)onCall(call);}}
  return <>
    {bounty.acceptance_criteria&&<div className="dblock"><h2 className="h3">Acceptance Criteria</h2><div className="rows">{bounty.acceptance_criteria.map((x:string,n:number)=><div className="row" key={n}>{x}</div>)}</div></div>}
    {bounty.note&&<Note>{bounty.note}</Note>}
    <div className="nf-foot"><button className="view" disabled={disabled||!bounty.method_id} onClick={async()=>{try {setPack(await backend<Obj>(`methods/${id(bounty.method_id)}/versions/${bounty.base_version}/contribution-package`));}catch(e){setError(e instanceof Error?e.message:"Package unavailable.");}}}>View contribution package</button><button className="primary-btn" disabled={disabled||!auth.session||!allowed(bounty,"claim")} onClick={()=>void moneyAction(`bounties/${id(bounty.id)}/claim`,"Preparing claim",{})}>Claim with wallet</button></div>
    {pack&&<><Note>{pack.private_core_note||"Only modules opened by the seller may be changed."}</Note><Proof label="Interface, synthetic examples and change limits" value={pack}/></>}
    {allowed(bounty,"submit_contribution")&&<details className="dblock"><summary>Submit an Improvement</summary><form className="se-form" onSubmit={submit}><Field label="Target Module" hint="The part of the method you changed." value={form.target_module} onChange={x=>setForm({...form,target_module:x})} required/><Field label="What Changed" value={form.description} onChange={x=>setForm({...form,description:x})} multiline required/><Field label="Expected Impact" value={form.impact} onChange={x=>setForm({...form,impact:x})} multiline/><Field label="Synthetic Regression Cases" hint="A JSON list of fictional inputs and expected answers." value={form.regression_cases} onChange={x=>setForm({...form,regression_cases:x})} multiline/><div className="rp-wide"><Fx label="Candidate Program or Prompt File" hint="Sealed on this device before upload."><input type="file" required onChange={e=>setCandidate(e.target.files?.[0]||null)}/></Fx></div><Note>The candidate is sealed on this device before upload. The evaluator and bounty criteria stay unchanged. A private-core fix may require the owner’s involvement.</Note><footer className="se-nav rp-wide"><span /><button className="primary-btn" disabled={disabled||!candidate||!auth.session}>Seal and submit</button></footer></form></details>}
    <div className="dblock"><h2 className="h3">Contributions</h2><div className="rows">{(bounty.contributions||[]).map((x:string)=><button className="view" key={x} onClick={()=>void loadContribution(x)}>{x}</button>)}</div>{!(bounty.contributions||[]).length&&<Note>No contributions yet.</Note>}</div>
    {contribution&&<div className="dblock"><h2 className="h3">Selected Contribution</h2><RecordFields record={contribution}/><Note>{contribution.validation?.needs_owner_access_reason||contribution.description||"No description."}</Note><Proof label="Candidate validation and review history" value={{candidate:contribution.candidate,validation:contribution.validation,reviews:contribution.reviews,payout:contribution.payout,publish:contribution.publish}}/>
      {allowed(contribution,"run_private_test")&&<form className="se-form" onSubmit={e=>{e.preventDefault();void runTests();}}><Field label="Private Test Grant IDs" hint="Separate with commas or spaces." value={grants} onChange={setGrants} required/><Note>Each owner must explicitly grant testing access. Only per-check status and counts are released to the contributor.</Note><footer className="se-nav rp-wide"><span /><button className="primary-btn" disabled={disabled||contribution.author_account!==auth.session?.account_id}>Run private tests</button></footer></form>}
      <div className="rows">{(contribution.test_runs||[]).map((x:string)=><button className="view" key={x} onClick={async()=>{try{setReport(await backend<Obj>(`test-runs/${id(x)}`));}catch(e){setError(e instanceof Error?e.message:"Test report unavailable.");}}}>Open test {x}</button>)}</div>
      {report&&<><Note>{`Test status ${report.status}. ${report.report?.summary?.passed??0} passed, ${report.report?.summary?.failed??0} failed.`}</Note><Proof label="Signed private test report" value={report}/></>}
      {council&&contribution.author_account!==auth.session?.account_id&&<form className="se-form" onSubmit={review}><div className="se-fx"><span className="se-fx-l">Decision</span><Dropdown label="Decision" value={decision} options={[{value:"request_changes",label:"Request changes"},{value:"reject",label:"Reject"},{value:"accept",label:"Accept"}]} onChange={setDecision}/></div><Field label="Review Reason" value={reason} onChange={setReason} required multiline/><footer className="se-nav rp-wide"><span /><button className="primary-btn" disabled={disabled||(decision==="accept"&&!allowed(contribution,"review"))}>Save review</button></footer></form>}
      {allowed(contribution,"request_payout")&&<button className="primary-btn" disabled={disabled||contribution.author_account!==auth.session?.account_id} onClick={()=>void moneyAction(`bounties/${id(bounty.id)}/payout`,"Preparing payout",{contribution_id:contribution.id})}>Request payout with wallet</button>}
      {allowed(contribution,"request_publish_version")&&<button className="view" disabled={disabled||!auth.session} onClick={()=>void moneyAction(`contributions/${id(contribution.id)}/publish-version`,"Preparing improved version",{})}>Prepare improved version</button>}
    </div>}
    {error&&<p className="form-error" role="alert">{error}</p>}
  </>;
}
function PrivateCases({enabled,onError}: {enabled:boolean;onError:(s:string)=>void}) {
  const [cases,setCases]=useState<Obj[]>([]),[grants,setGrants]=useState<Obj[]>([]),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false);
  const [v,setV]=useState({method_id:"",version:"",label:"",case:"",case_id:"",contribution_id:"",attempt_limit:"1",expires_at:""}),[consent,setConsent]=useState(false),[message,setMessage]=useState("");
  async function refresh(){try{const [c,g]=await Promise.all([backend<Obj>("private-test-cases"),backend<Obj>("test-grants")]);setCases(list(c));setGrants(list(g));setLoaded(true);}catch(e){onError(e instanceof Error?e.message:"Private tests could not load.");}}
  async function task(fn:()=>Promise<void>){setBusy(true);setMessage("");onError("");try{await fn();await refresh();}catch(e){onError(e instanceof Error?e.message:"Private test action failed.");}finally{setBusy(false);}}
  return <section className="card list-card"><div className="toolbar"><h2 className="list-title">Private Test Access</h2><button className="view" disabled={busy} onClick={()=>void refresh()}>Load your cases and grants</button></div><div className="dpane"><Note>Using a method does not allow anyone to test with your data. You control separate, candidate-bound grants and can revoke them.</Note>
    <details className="dblock"><summary>Add a Sealed Test Case</summary><form className="se-form" onSubmit={e=>{e.preventDefault();void task(async()=>{const config=await backend<Obj>("config");const raw=JSON.parse(v.case);const sealed=sealData(config.runner.tee_pubkey,raw);const c=await backend<Obj>("private-test-cases",{method_id:v.method_id,version:v.version?Number(v.version):undefined,label:v.label,sealed_case:sealed.sealed,case_ct_sha256:sealed.dataCtSha256});setV({...v,case:"",case_id:c.id});setMessage("Test case sealed and saved. No grant has been given.");});}}><Field label="Method ID" value={v.method_id} onChange={x=>setV({...v,method_id:x})} required/><Field label="Version" hint="Optional. Leave empty for the latest." value={v.version} onChange={x=>setV({...v,version:x})}/><Field label="Case Label" hint="A name only you see." value={v.label} onChange={x=>setV({...v,label:x})}/><Field label="Test Input" hint="JSON, kept on this device until it is sealed." value={v.case} onChange={x=>setV({...v,case:x})} required multiline/><footer className="se-nav rp-wide"><span /><button className="primary-btn" disabled={!enabled||busy}>Seal and save case</button></footer></form></details>
    {loaded&&<div className="rows">{cases.map(c=><div className="row" key={c.id}><span className="two"><b>{c.label||c.id}</b><span>{c.method_id}, version {c.version}</span></span><button className="view" onClick={()=>setV({...v,case_id:c.id})}>Use for a grant</button></div>)}</div>}
    <details className="dblock" open={!!v.case_id}><summary>Grant Limited Testing Access</summary><form className="se-form" onSubmit={e=>{e.preventDefault();void task(async()=>{await backend(`private-test-cases/${id(v.case_id)}/grants`,{contribution_id:v.contribution_id,purpose:"testing",allowed_output:["per_check_status","counts"],attempt_limit:Number(v.attempt_limit),expires_at:new Date(v.expires_at).toISOString(),explicit_consent:consent});setConsent(false);setMessage("Testing grant saved.");});}}><Field label="Case ID" value={v.case_id} onChange={x=>setV({...v,case_id:x})} required/><Field label="Contribution ID" hint="The one contribution allowed to test." value={v.contribution_id} onChange={x=>setV({...v,contribution_id:x})} required/><Field label="Attempt Limit" hint="From 1 to 20." value={v.attempt_limit} onChange={x=>setV({...v,attempt_limit:x})} type="number" required/><Field label="Expires At" hint="Access ends at this time." value={v.expires_at} onChange={x=>setV({...v,expires_at:x})} type="datetime-local" required/><label className="consent rp-wide"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I allow this exact contribution to test this case until the limit or expiry. Only check outcomes and counts may be released.</span></label><footer className="se-nav rp-wide"><span /><button className="primary-btn" disabled={!enabled||busy||!consent||Number(v.attempt_limit)<1||Number(v.attempt_limit)>20}>Grant testing access</button></footer></form></details>
    {loaded&&<div className="rows">{grants.map(g=><div className="row" key={g.id}><span className="two"><b>{g.id}</b><span>{statusLabel(g.status)}, {g.attempts_used} of {g.attempt_limit} attempts, expires {new Date(g.expires_at).toLocaleString()}</span></span>{allowed(g,"revoke")&&<button className="view" disabled={!enabled||busy} onClick={()=>void task(async()=>{await backend(`test-grants/${id(g.id)}/revoke`,{});setMessage("Grant revoked.");})}>Revoke</button>}</div>)}</div>}
    {message&&<Note>{message}</Note>}
  </div></section>;
}
// Plain NEAR amount for a yocto string, e.g. "1000000000000000000000000" -> "1".
function nearFromYocto(y: string){try{const v=BigInt(y);const w=v/10n**24n;const f=(v%10n**24n).toString().padStart(24,"0").replace(/0+$/,"");return f?`${w}.${f}`:`${w}`;}catch{return y;}}
