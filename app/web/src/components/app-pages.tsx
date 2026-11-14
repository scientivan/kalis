"use client";
// Every rail page except Marketplace, built from the approved template (FRONTEND_GUIDE.md section 9):
// one head card (title on the left, (i) and refresh on the right), then one main card with a toolbar
// and rows. All data comes from the backend; nothing here is invented.
import { statusLabel, useMethodTitles } from "../lib/labels";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { backend, plainError } from "../lib/backend/client";
import { cachedPrivate } from "../lib/backend/private-client";
import { useNearAuth } from "../lib/near/auth";
import { AppShell, icon } from "./shell";
import { PageInfo, Segmented } from "./controls";
import { CommunityWorkspace } from "./community-workspace";
import { ConnectionCreate, DocumentUpload, DocumentDetails, NoteCreate, NoteEdit } from "./data-tools";
import { AccountEditors, PaymentHistory } from "./account-tools";
import { Capability } from "./capability";
import { AddTile, Chip, DayCards, ErrorPanel, SkeletonTiles, StatePanel, StepTrack, Summary, Tile, TileGrid, TileIcon, methodIdentity } from "./tiles";
import { nearFromYocto } from "./wallet-review";

type Money = { display?: string };
function useApi<T>(path: string | null, rev: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [slow, setSlow] = useState(false);
  const isPrivate = !!path && path.startsWith("protections/");
  useEffect(() => {
    if (!path) return;
    let on = true, done = false; setError(""); setSlow(false);
    // Private pages wait for the TEE queue. Show what this device decrypted earlier, then refresh.
    if (isPrivate) cachedPrivate<T>(path).then(c => { if (on && c && !done) { setData(c.value); setStale(true); } });
    const timer = setTimeout(() => { if (on && !done) setSlow(true); }, 5000);
    backend<T>(path).then(x => { done = true; if (on) { setData(x); setStale(false); setSlow(false); } }).catch(e => { done = true; if (on) { setError(e.message); setSlow(false); } });
    return () => { on = false; clearTimeout(timer); };
  }, [path, rev, isPrivate]);
  return { data, error, loading: !data && !error, stale, slow, isPrivate };
}
/** Status for pages whose data is decrypted only inside the TEE. Replaces a silent skeleton. */
function PrivateWait({ r, count }: { r: { loading: boolean; stale: boolean; slow: boolean; error: string }; count: number }) {
  if (r.error) return null;
  if (r.stale) return <StatePanel title="Showing what this device saved earlier" text="Refreshing from the secure runner. On NEAR testnet this can take a few minutes."/>;
  if (!r.loading) return null;
  return <>
    <StatePanel title="Opening your private data in the secure runner" text={r.slow ? "Your data is decrypted only inside the TEE. The NEAR testnet queue is slow right now and this can take a few minutes. You can leave this page open." : "Your data is decrypted only inside the TEE, never on our server."}/>
    <SkeletonTiles count={count}/>
  </>;
}
/** Split chain text like "Title | Accept if: rule [kalis:prop-x]" into a clean title and detail. */
const clean = (t: string) => { const x = t.replace(/\s*\[kalis:[^\]]*\]/g, "").replace(/^Bounty:\s*/i, "").trim(); const [a, ...b] = x.split(/\s*\|\s*/); return { title: a, detail: b.join(". ") }; };
const when = (iso?: string) => iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
const Refresh = ({ onClick }: { onClick: () => void }) => <button className="ghost-ic" aria-label="Refresh" title="Refresh" onClick={onClick}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>;

function Page({ active, title, info, onRefresh, children }: { active: string; title: string; info: { title: string; points: [string, string][] }; onRefresh: () => void; children: ReactNode }) {
  return <AppShell active={active}>
    <section className="card ph"><div className="ph-title"><h1>{title}</h1></div>
      <div className="ph-actions"><PageInfo title={info.title} points={info.points.map(([ic, text]) => ({ icon: icon(ic), text }))} /><Refresh onClick={onRefresh} /></div><div className="page-purpose">{icon(info.points[0][0])}<p>{info.points[0][1]}</p></div></section>
    {children}
  </AppShell>;
}
function Main({ title, tools, children }: { title?: string; tools?: ReactNode; children: ReactNode }) {
  return <section className="card list-card">{(title || tools) && <div className="toolbar">{title && <h2 className="list-title">{title}</h2>}{tools}</div>}<div className="dpane">{children}</div></section>;
}
function State({ loading, error, empty, emptyText, action }: { loading: boolean; error: string; empty: boolean; emptyText: string; action?: ReactNode }) {
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (loading) return <div className="note-row">{icon("info")}<span>Loading</span></div>;
  if (empty) return <div className="note-row empty-context">{icon("info")}<div className="empty-context-body"><p>{emptyText}</p>{action && <div className="context-action">{action}</div>}</div></div>;
  return null;
}
const Limit = ({ children }: { children: ReactNode }) => <div className="note-row">{icon("info")}<span>{children}</span></div>;
const Badge = ({ tone, children }: { tone?: "blue" | "warn" | "bad"; children: ReactNode }) => <span className={`tag ${tone === "blue" ? "req" : tone || ""}`}>{children}</span>;
async function post(path: string, body: unknown, after: () => void, setErr: (s: string) => void) {
  try { await backend(path, body); after(); } catch (e) { setErr(e instanceof Error ? e.message : "Request failed."); }
}

// ---------- My runs ----------
type Entry = { type: string; run_id: string; method_id: string; version?: number; amount?: Money; tx_url?: string; occurred_at: string; status?: string };
type Job = { id:string;method_id:string;version:number;phase:string;created_at:string;updated_at?:string;pay_tx?:string;snapshot?:{price?:string};last_event?:{phase?:string;error?:string;all_ok?:boolean;reason?:string} };
type MethodInfo = { method_id:string; title?:string; latest?:{ number:number; manifest?:{ steps?:unknown[]; listing?:{ outcome?:string; title?:string } } }; versions?:{ number:number; manifest?:{ steps?:unknown[] } }[] };
const DONE = ["executed","released","refunded","reclaimed"];
const near = (y?: string) => y ? `${nearFromYocto(y)} NEAR` : "";
/** Job lifecycle the run API reports: paid, running in the chip, answer ready, payment settled. */
const LIFE = ["Paid into escrow", "Running in the locked chip", "Answer ready", "Payment settled"];
function progress(job: Job): { done: number; failed: boolean; text: string } {
  const p = job.phase;
  if (p === "created" || p === "payment_pending" || p === "awaiting_signature") return { done: 0, failed: false, text: "Waiting for your payment" };
  if (p === "paid") return { done: 1, failed: false, text: "Paid. Open the job to run it on this device" };
  if (p === "executing") return { done: 1, failed: false, text: "Running in the locked chip" };
  if (p === "execution_failed") return { done: 1, failed: true, text: "Stopped while running. Retry or take your payment back" };
  if (p === "executed" || p === "settling") return { done: 3, failed: false, text: "Answer ready, payment being settled" };
  if (p === "released" || p === "refunded" || p === "reclaimed") return { done: 4, failed: false, text: p === "released" ? "Done, paid to the expert" : p === "refunded" ? "Done, refunded to you" : "Done, payment taken back" };
  if (p === "payment_failed" || p === "settle_failed") return { done: 0, failed: true, text: statusLabel(p) };
  return { done: 0, failed: false, text: statusLabel(p) };
}
const SHORT: Record<string, string> = { execution_failed: "Stopped", executing: "Running", paid: "Paid", released: "Paid to expert", refunded: "Refunded", reclaimed: "Taken back", created: "Not paid yet", payment_pending: "Not paid yet", awaiting_signature: "Not signed yet", executed: "Answer ready", settling: "Settling" };
const chipText = (p: string) => SHORT[p] || statusLabel(p);
/** Run errors can carry provider text and call ids; show one plain sentence instead. */
const plainRunError = (e?: string) => !e ? "" : /outlayer|did not finish|timeout|call [0-9a-f-]{8}/i.test(e) ? "The locked chip took too long and stopped. Run it again or take your payment back." : /restarted/i.test(e) ? "The server restarted during the run. Run it again or take your payment back." : plainError(e);
const tone = (p: string) => p === "execution_failed" || p.endsWith("_failed") ? "warn" as const : p === "released" ? "blue" as const : p === "refunded" || p === "reclaimed" ? "pink" as const : p === "executing" ? "orange" as const : "grey" as const;
export function MyRunsPage({ section = "Ongoing" }: { section?: "Ongoing" | "Results" }) {
  const [rev,setRev]=useState(0),[jobs,setJobs]=useState<Job[]>([]),[cursor,setCursor]=useState<string|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[filter,setFilter]=useState("All");
  const [methods,setMethods]=useState<Record<string,MethodInfo>>({});
  async function load(next?:string){setLoading(true);setError("");try{const page=await backend<{items:Job[];next_cursor:string|null}>(`runs?limit=50${next?`&cursor=${encodeURIComponent(next)}`:""}`);setJobs(old=>next?[...old,...page.items.filter(x=>!old.some(y=>y.id===x.id))]:page.items);setCursor(page.next_cursor);}catch(e){setError(e instanceof Error?e.message:"Could not load jobs.");}finally{setLoading(false);}}
  useEffect(()=>{void load();},[rev]);
  useEffect(()=>{backend<MethodInfo[]>("methods").then(ms=>setMethods(Object.fromEntries(ms.map(m=>[m.method_id,m])))).catch(()=>{});},[rev]);
  const title=useMethodTitles();
  const steps=(j:Job)=>{const m=methods[j.method_id];const v=m?.versions?.find(x=>x.number===j.version)||m?.latest;return Array.isArray(v?.manifest?.steps)?v!.manifest!.steps!.length:null;};
  const outcome=(j:Job)=>methods[j.method_id]?.latest?.manifest?.listing?.outcome;
  const shown=jobs.filter(job=>section === "Results" ? DONE.includes(job.phase) && (filter==="All"||(filter==="Paid"?job.phase==="released":job.phase!=="released")) : !DONE.includes(job.phase));
  return <Page active={section} title={section} onRefresh={()=>setRev(n=>n+1)} info={{title:section === "Ongoing"?"Jobs in progress":"Completed jobs",points:[["play",section === "Ongoing"?"Review actions waiting for your approval and follow jobs that are still in progress.":"Review completed jobs, their checks and payment records. Decrypted answers remain available only in the tab that holds their key."],["lock","Your answer-opening key is never sent to the server."]]}}>
    {section === "Ongoing"&&<ApprovalPanel key={rev}/>}
    <Main title={section === "Ongoing" ? "Jobs in progress" : undefined} tools={section === "Results" ? <Segmented label="Payment" options={["All","Paid","Refunded"]} value={filter} onChange={setFilter}/> : undefined}>
      <TileGrid label={section === "Ongoing" ? "Jobs in progress" : "Completed jobs"}>
        {loading&&!jobs.length&&<SkeletonTiles/>}
        {error&&<ErrorPanel message={error} onRetry={()=>void load()} title="We could not load your jobs"/>}
        {!loading&&!error&&!shown.length&&<StatePanel title={section === "Results" ? (filter==="All"?"No completed jobs yet":`No ${filter.toLowerCase()} jobs`) : "No jobs in progress"} text={section === "Results"?"A job appears here once its answer is ready and the payment is settled.":"Jobs you pay for appear here until their answer is ready."} action={<Link className="primary-btn link-btn" href="/marketplace">Find a method</Link>}/>}
        {shown.map(job=>{const id=methodIdentity(job.method_id);const pr=progress(job);const n=steps(job);const failNote=job.phase==="execution_failed"?plainRunError(job.last_event?.error):"";
          return <Tile key={job.id} className={job.phase==="executing"?"is-live":""} iconNode={<TileIcon name={id.icon} color={id.color} ink={id.ink}/>} chip={<Chip tone={tone(job.phase)}>{chipText(job.phase)}</Chip>}
            title={title(job.method_id)} href={`/runs/${encodeURIComponent(job.id)}`}
            desc={section==="Results" ? (job.last_event?.all_ok===false||job.phase==="refunded" ? "A step did not pass, so your payment came back to you." : job.phase==="released" ? "Every step passed and the expert was paid." : outcome(job)) : (failNote || outcome(job))}
            meta={[`Version ${job.version}`, when(job.created_at), n!==null ? `${n} ${n===1?"step":"steps"}` : ""]}
            foot={<><span className="mcard-price">{near(job.snapshot?.price)}</span><Link className="view" href={`/runs/${encodeURIComponent(job.id)}`}>{section==="Results"?"View result":job.phase==="execution_failed"?"Retry or reclaim":"Open"}</Link></>}>
            {section==="Ongoing"&&<StepTrack total={LIFE.length} done={pr.done} failed={pr.failed} label={pr.text}/>}
          </Tile>;})}
        {section==="Ongoing"&&!!shown.length&&<StatePanel title="How to read the progress bar" text="Its four parts are payment, the run in the locked chip, the answer and the payment settlement. The chip reports the method's own steps only when the run ends, so step by step progress inside a run is not available yet."/>}
      </TileGrid>
      {cursor&&<div className="pager"><span>Showing {shown.length} jobs</span><button className="view" disabled={loading} onClick={()=>void load(cursor)}>{loading?"Loading":"Load older jobs"}</button></div>}
    </Main>
  </Page>;
}

// ---------- Waiting for my approval ----------
type Outbound = { id: string; method_id?: string; destination: string; content: string; params?: unknown; status: string; action_hash?: string; reason?: string; private_values_found?: {label?: string}[]; allowed_actions?: string[]; receipt?: unknown; created_at?: string };
export function ApprovalsPage() { return <MyRunsPage section="Ongoing" />; }
function ApprovalPanel() {
  const [rev, setRev] = useState(0), [err, setErr] = useState(""), [busy, setBusy] = useState(""), [message, setMessage] = useState("");
  const r = useApi<Outbound[] | { items: Outbound[] }>("protections/outbound", rev);
  const title = useMethodTitles();
  const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
  const [tab, setTab] = useState("Waiting");
  const waiting = (o: Outbound) => ["pending", "held", "held_for_approval", "approved"].includes(o.status);
  const shown = items.filter(o => tab === "All" || (tab === "Waiting" ? waiting(o) : !waiting(o)));
  const permitted = (o: Outbound, action: string) => !o.allowed_actions || o.allowed_actions.includes(action);
  async function act(o: Outbound, action: "approve" | "reject" | "execute") {
    setBusy(o.id); setErr(""); setMessage("");
    try {
      const fresh = await backend<Outbound[] | { items: Outbound[] }>("protections/outbound");
      const current = (Array.isArray(fresh) ? fresh : fresh.items || []).find(x => x.id === o.id);
      if (!current || current.action_hash !== o.action_hash || current.content !== o.content || current.destination !== o.destination || JSON.stringify(current.params) !== JSON.stringify(o.params) || current.status !== o.status) throw new Error("This action changed. Review the refreshed content before choosing again.");
      if (action === "approve" && (!o.action_hash || o.private_values_found?.length || o.status === "blocked")) throw new Error("This action cannot be approved. Create a new proposal without private values.");
      const result = await backend<Outbound>(`protections/outbound/${encodeURIComponent(o.id)}/${action}`, action === "approve" ? {action_hash:o.action_hash} : {});
      setMessage(action === "execute" ? (result.status === "sent" ? "The private mock submission was recorded. No external service was contacted." : "The send did not complete. Review its status before another attempt.") : action === "approve" ? "Approved. Choose Send to mock portal to send the exact approved content." : "Action rejected.");
    } catch(e) { setErr(e instanceof Error ? e.message : "Action failed. Refresh before trying again."); }
    finally {setBusy("");setRev(n=>n+1);}
  }
  return <Main title="Needs your approval" tools={<Segmented label="Status" options={["Waiting", "Done", "All"]} value={tab} onChange={setTab} />}>
    {(err || message) && <div className="tgrid-note">{err ? <ErrorPanel message={err} onRetry={() => setRev(n => n + 1)} title="That action did not go through"/> : <StatePanel title={message}/>}</div>}
    <TileGrid label="Actions waiting for your approval">
      <PrivateWait r={r} count={2}/>
      {r.error && <ErrorPanel message={r.error} onRetry={() => setRev(n => n + 1)} title="We could not load your approvals"/>}
      {!r.loading && !r.error && !shown.length && <StatePanel title={tab === "Waiting" ? "Nothing is waiting for your approval" : "No approvals yet"} text="When a method wants to send something outside Kalis, it waits here until you read and approve the exact text."/>}
      {shown.map(o => { const open = ["pending","held","held_for_approval"].includes(o.status); return <Tile key={o.id} className={open || o.status === "approved" ? "is-wide" : ""} iconNode={<TileIcon name="pulse" color="#FF5F04"/>} chip={<Chip tone={o.status === "approved" || o.status === "sent" ? "blue" : "warn"}>{statusLabel(o.status)}</Chip>}
        title={`Send to ${o.destination}`} desc={`${o.method_id ? title(o.method_id) : "Held action"}${o.created_at ? `, ${when(o.created_at)}` : ""}. Only the labelled mock procurement portal can receive submissions in this demo.`}
        foot={<>{open && <><span className="foot-left">Read the exact text before you choose</span><button className="view" disabled={!!busy || !permitted(o,"reject")} onClick={()=>void act(o,"reject")}>Reject</button><button className="primary-btn" disabled={!!busy || !o.action_hash || !!o.private_values_found?.length || !permitted(o,"approve")} onClick={()=>void act(o,"approve")}>Approve exact text</button></>}
          {o.status === "approved" && <><span className="foot-left">Approved, not sent yet</span><button className="primary-btn" disabled={!!busy || !permitted(o,"execute")} onClick={()=>void act(o,"execute")}>Send to mock portal</button></>}
          {!open && o.status !== "approved" && <span className="foot-left">{statusLabel(o.status)}</span>}</>}>
        <pre className="tile-code" aria-label="Exact text that will be sent">{o.content}</pre>
        {!!o.private_values_found?.length && <p className="tile-warn">Contains marked private values ({o.private_values_found.map(x=>x.label || "private data").join(", ")}). Approval is off. Create a new action without those values.</p>}
        {o.reason && <p className="tile-text">{o.reason}</p>}
        {!!o.params && <details><summary>Submission details</summary><pre className="backend-data">{JSON.stringify(o.params,null,2)}</pre></details>}
        {!!o.receipt && <details><summary>Portal receipt</summary><pre className="backend-data">{JSON.stringify(o.receipt,null,2)}</pre></details>}
      </Tile>; })}
    </TileGrid>
  </Main>;
}

// ---------- Activity ----------
type Act = { id: string; resource_type: string; kind: string; status?: string; occurred_at: string; summary: string };
const ACT_TABS: Record<string, string> = { All: "", Runs: "run", Approvals: "outbound", Notes: "memory", Documents: "documents", Reviews: "review" };
const ACT_ICON: Record<string, string> = { run: "play", outbound: "pulse", memory: "note", documents: "file", review: "check", credentials: "link", browser: "store" };
/** Activity summaries name methods by id ("Rated portfolio-rebalance v1"); show the method title instead. */
function readable(summary: string, title: (id: string) => string) { return summary.replace(/\b([a-z0-9]+(?:-[a-z0-9]+)+)\b(?=\s+v\d|\s|:|$)/g, (m) => { const t = title(m); return t && t !== m ? t : m; }).replace(/\bv(\d+)\b/g, "version $1"); }
export function ActivityPage() {
  const [rev, setRev] = useState(0); const [tab, setTab] = useState("All"); const [limit, setLimit] = useState(50);
  useEffect(() => setLimit(50), [tab]);
  const r = useApi<{ items: Act[] }>(`activity?limit=${limit}${ACT_TABS[tab] ? `&resource_type=${ACT_TABS[tab]}` : ""}`, rev);
  const title = useMethodTitles();
  const items = r.data?.items || [];
  const today = new Date().toLocaleDateString("en-CA");
  const count = (t: string) => items.filter(a => a.resource_type === t).length;
  return <Page active="Activity" title="Activity" onRefresh={() => setRev(n => n + 1)} info={{ title: "Everything that happened", points: [["pulse", "Runs, approvals, notes, documents and reviews, one card per day."], ["lock", "Summaries only. No data, answers or tokens are shown."]] }}>
    <Main tools={<Segmented label="Type" options={Object.keys(ACT_TABS)} value={tab} onChange={setTab} />}>
      {!!items.length && <Summary cells={[["Shown", items.length], ["Today", items.filter(a => new Date(a.occurred_at).toLocaleDateString("en-CA") === today).length], ["Job events", count("run")], ["Reviews", count("review")]]}/>}
      {r.loading && <TileGrid label="Loading activity"><SkeletonTiles/></TileGrid>}
      {r.error && <TileGrid label="Activity"><ErrorPanel message={r.error} onRetry={() => setRev(n => n + 1)} title="We could not load your activity"/></TileGrid>}
      {!r.loading && !r.error && !items.length && <TileGrid label="Activity"><StatePanel title="No activity yet" text="Runs, approvals, notes, documents and reviews appear here as they happen." action={<Link className="view" href="/marketplace">Find a method</Link>}/></TileGrid>}
      {!!items.length && <DayCards label="Activity by day" unit={["event", "events"]} lines={items.map(a => ({ id: a.id, at: a.occurred_at, icon: ACT_ICON[a.resource_type] || "info", text: readable(a.status ? a.summary.replace(/:\s*[a-z_ ]+$/, "") : a.summary, title), aside: a.status && a.status !== "created" ? statusLabel(a.status) : undefined }))}/>}
      {!!items.length && <div className="pager"><span>Showing the latest {items.length} events</span>{items.length >= limit && <button className="view" disabled={r.loading} onClick={() => setLimit(l => l + 50)}>Show older events</button>}</div>}
    </Main>
  </Page>;
}

// ---------- Account and balance ----------
type Me = { kind: string; account_id: string | null; demo: boolean; display_name?: string; session_expires_at?: string | null };
type Earn = { seller_allocations?: { total_paid?: Money; items?: unknown[] }; bounty_income?: { total_paid?: Money; items?: unknown[] }; status?: string; reason?: string };
export function AccountPage() {
  const [rev, setRev] = useState(0);
  const auth = useNearAuth();
  const me = useApi<Me>("me", rev + (auth.session ? 1000 : 0));
  const tx = useApi<{ items: Entry[] }>("me/transactions?limit=20", rev);
  const earn = useApi<Earn>(auth.session ? "me/earnings" : null, rev);
  const [tab, setTab] = useState("Payments");
  return <Page active="Account" title="Account" onRefresh={() => setRev(n => n + 1)} info={{ title: "Your account", points: [["wallet", "Sign in with NEAR to sell methods and see your earnings."], ["coins", "Kalis holds no balance for you. Payments go straight to escrow."]] }}>
    <div className="detail">
      <Main tools={<Segmented label="Section" options={["Payments", "Earnings"]} value={tab} onChange={setTab} />}>
        {tab === "Payments" && <PaymentHistory key={String(rev) + (auth.session?.account_id || "demo")} />}
        {tab === "Earnings" && (!auth.session ? <Limit>Sign in with NEAR to see what your methods and bounties earned.</Limit> : <><State {...earn} empty={false} emptyText="" />
          {earn.data && <div className="stat-row"><div className="stat2"><small>From your methods</small><b>{earn.data.seller_allocations?.total_paid?.display || "0 NEAR"}</b></div><div className="stat2"><small>From bounties</small><b>{earn.data.bounty_income?.total_paid?.display || "0 NEAR"}</b></div></div>}
          <Limit>The two totals are kept apart. Bounty income is not a royalty.</Limit></>)}
      </Main>
      <aside className="card dside">
        <div className="dside-top"><span className="avatar" aria-hidden="true">{(me.data?.account_id || "D").slice(0, 1).toUpperCase()}</span>{auth.session ? <Badge tone="blue">Signed in</Badge> : <Badge>Demo browser</Badge>}</div>
        <div className="dprice"><small>{auth.session ? "NEAR account" : "Identity"}</small><b className="acct">{me.data?.account_id || "Not signed in"}</b></div>
        <Limit>Balance is not available. Kalis keeps no account balance, and the test top-up is not money you hold.</Limit>
        <div className="dside-foot">{auth.session ? <button className="view" onClick={auth.signOut}>Sign out</button> : <button className="primary-btn wide" onClick={auth.signIn} disabled={auth.busy}>{auth.busy ? "Waiting for wallet" : "Sign in with NEAR"}</button>}{auth.error && <span className="form-error">{auth.error}</span>}</div>
      </aside>
    </div>
    <Capability id="profiles_preferences"><AccountEditors /></Capability>
  </Page>;
}

// Community workflow uses the shared shell and current API relations.
export function CommunityPage({ section = "Fund" }: { section?: "Fund" | "Proposals" }) { return <CommunityWorkspace section={section} />; }
export function ImprovementsPage({ section = "Bounties" }: { section?: "Bounties" | "Issues" }) { return <CommunityWorkspace section={section} />; }

// ---------- Connected apps ----------
type Cred = { effective_state?: string; allowed_actions?: string[]; id: string; connector: string; scopes: string[]; expires_at?: string; last_used_at?: string | null; revoked?: boolean; status?: string; created_at?: string };
const CONNECTOR: Record<string, [string, string]> = { broker_mock: ["Broker", "m-chart"], sheets_mock: ["Spreadsheet", "file"], docs_mock: ["Documents", "m-doc"], wallet_mock: ["Lending wallet", "wallet"] };
function useAdd(): [boolean, () => void] {
  const [open, setOpen] = useState(false);
  return [open, () => { setOpen(o => !o); setTimeout(() => document.getElementById("add-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }];
}
export function ConnectionsPage() {
  const [rev, setRev] = useState(0); const [err, setErr] = useState(""); const [adding, toggle] = useAdd();
  const r = useApi<Cred[] | { items: Cred[] }>("protections/credentials", rev);
  const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
  return <Page active="Connections" title="Connections" onRefresh={() => setRev(n => n + 1)} info={{ title: "Apps a method may read from", points: [["link", "Read-only access, for a limited time, that you can revoke."], ["lock", "Methods never get your token. They get only what they declared."], ["info", "Private connections use the sealed runner. This browser holds the ownership key."]] }}>
    <Main title="Your connections">
      {err && <ErrorPanel message={err} onRetry={() => { setErr(""); setRev(n => n + 1); }} title="That change did not go through"/>}
      <TileGrid label="Your connections">
        <AddTile title={adding ? "Close the form" : "Add a connection"} desc="Lets a labelled mock app share read-only data with a method, for a limited time." onClick={toggle}/>
        <PrivateWait r={r} count={3}/>
        {r.error && <ErrorPanel message={r.error} onRetry={() => setRev(n => n + 1)} title="We could not load your connections"/>}
        {items.map(c => { const state = c.effective_state || (c.revoked || c.status === "revoked" ? "revoked" : c.expires_at && Date.parse(c.expires_at) <= Date.now() ? "expired" : "active"); const off = state !== "active"; const [name, ic] = CONNECTOR[c.connector] || [c.connector, "link"];
          return <Tile key={c.id} iconNode={<TileIcon name={ic} color={off ? "#5c5c5c" : "#0038FF"}/>} chip={<Chip tone={off ? "grey" : "pink"}>{off ? statusLabel(state) : "Mock app"}</Chip>} title={name}
            desc={`Can ${c.scopes.map(x => x.replace(/_/g, " ")).join(" and ")} your data. It cannot change anything.`}
            meta={[c.expires_at ? `${off ? "Ended" : "Until"} ${when(c.expires_at)}` : "No end date", c.last_used_at ? `Last used ${when(c.last_used_at)}` : "Never used"]}
            foot={off ? <span className="foot-left">No method can read from it now</span> : <><span className="foot-left">{c.created_at ? `Connected ${when(c.created_at)}` : "Active"}</span>{(!c.allowed_actions || c.allowed_actions.includes("revoke")) && <button className="view" onClick={() => post(`protections/credentials/${c.id}/revoke`, {}, () => setRev(n => n + 1), setErr)}>Revoke</button>}</>}/>; })}
        <StatePanel title="Every connection here is a labelled mock service" text="No real broker, sheet or wallet is connected. A method asks for a connection when it needs one."/>
      </TileGrid>
    </Main>
    {adding && <div id="add-form"><Capability id="five_protections"><ConnectionCreate onChanged={() => setRev(n => n + 1)} /></Capability></div>}
  </Page>;
}

// ---------- Documents ----------
type Doc = { id: string; filename: string; method_id?: string; processed_by?: string; pii_spans?: unknown[]; instruction_like?: boolean; created_at?: string; text_chars?: number };
export function DocumentsPage() {
  const [rev, setRev] = useState(0); const [adding, toggle] = useAdd();
  const r = useApi<Doc[] | { items: Doc[] }>("protections/documents", rev);
  const title = useMethodTitles();
  const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
  return <Page active="Documents" title="Documents" onRefresh={() => setRev(n => n + 1)} info={{ title: "Documents a method read", points: [["file", "Text is read from your file, then sealed into the run."], ["lock", "The server keeps only a fingerprint, not the text."], ["info", "Private images are sealed first. Backend extraction requires explicit public-document permission."]] }}>
    <Main title="Read documents">
      <TileGrid label="Read documents">
        <AddTile title={adding ? "Close the form" : "Read a document"} desc="Reads the text of a file so a method can use it. The server keeps only a fingerprint." onClick={toggle}/>
        <PrivateWait r={r} count={3}/>
        {r.error && <ErrorPanel message={r.error} onRetry={() => setRev(n => n + 1)} title="We could not load your documents"/>}
        {!r.loading && !r.error && !items.length && <StatePanel title="No documents yet" text="You add one while preparing a run that reads files." action={<Link className="view" href="/marketplace">Find a method</Link>}/>}
        {items.map(x => { const warn = !!x.pii_spans?.length || x.instruction_like; return <Tile key={x.id} iconNode={<TileIcon name="file" color={warn ? "#FF5F04" : "#0038FF"}/>} chip={<Chip tone={warn ? "warn" : "blue"}>{x.instruction_like ? "Hidden instructions found" : x.pii_spans?.length ? "Personal data found" : "No issues found"}</Chip>} title={x.filename}
          desc={x.method_id ? `Read for ${title(x.method_id)}.` : "Not linked to a method yet."}
          meta={[x.text_chars ? `${x.text_chars.toLocaleString("en-GB")} characters` : "", when(x.created_at)]}
          foot={<><span className="foot-left">Fingerprint kept, text sealed</span><DocumentDetails id={x.id} /></>}/>; })}
      </TileGrid>
    </Main>
    {adding && <div id="add-form"><DocumentUpload onChanged={() => setRev(n => n + 1)} /></div>}
  </Page>;
}

// ---------- Saved notes ----------
type Note = { effective_state?: string; allowed_actions?: string[]; given_to_methods?: unknown[]; id: string; text: string; status: string; source?: { kind: string; ref?: string }; instruction_like?: boolean; created_at?: string };
export function NotesPage() {
  const [rev, setRev] = useState(0); const [err, setErr] = useState(""); const [tab, setTab] = useState("Saved"); const [adding, toggle] = useAdd();
  const r = useApi<Note[] | { items: Note[] }>("protections/memory", rev);
  const items = (Array.isArray(r.data) ? r.data : r.data?.items || []).filter(n => tab === "Saved" ? n.status === "approved" || n.status === "active" : n.status === "pending");
  return <Page active="Notes" title="Notes" onRefresh={() => setRev(n => n + 1)} info={{ title: "Notes methods may remember", points: [["note", "A method can only suggest a note. You decide what is saved."], ["check", "Methods that declare it may read your saved notes."], ["info", "Private notes belong to this browser’s device key. Clearing browser data loses access."]] }}>
    <Main tools={<Segmented label="Status" options={["Saved", "Suggested"]} value={tab} onChange={setTab} />}>
      {err && <ErrorPanel message={err} onRetry={() => { setErr(""); setRev(n => n + 1); }} title="That change did not go through"/>}
      <TileGrid label={tab === "Saved" ? "Saved notes" : "Suggested notes"}>
        {tab === "Saved" && <AddTile title={adding ? "Close the form" : "Add a note"} desc="Save a fact a method may remember, such as your risk limit." onClick={toggle}/>}
        <PrivateWait r={r} count={3}/>
        {r.error && <ErrorPanel message={r.error} onRetry={() => setRev(n => n + 1)} title="We could not load your notes"/>}
        {!r.loading && !r.error && !items.length && <StatePanel title={tab === "Saved" ? "No saved notes" : "No suggestions waiting"} text={tab === "Saved" ? "Notes you save, or suggestions you accept, appear here." : "A method can suggest a note after a run. It waits here until you decide."}/>}
        {items.map(n => <Tile key={n.id} iconNode={<TileIcon name="note" color={n.status === "pending" ? "#FF77CD" : "#0038FF"} ink={n.status === "pending" ? "#101010" : "#fff"}/>} chip={<Chip tone={n.status === "pending" ? "pink" : "blue"}>{n.status === "pending" ? "Suggested" : "Saved"}</Chip>}
          title={n.source ? `From ${n.source.kind.replace(/_/g, " ")}` : "Your note"}
          meta={[when(n.created_at), n.given_to_methods?.length ? `Given to ${n.given_to_methods.length} ${n.given_to_methods.length === 1 ? "method" : "methods"}` : "Not given to a method yet"]}
          foot={n.status === "pending" ? <><span className="foot-left">Save it or discard it</span><button className="view" onClick={() => post(`protections/memory/${n.id}/reject`, {}, () => setRev(x => x + 1), setErr)}>Discard</button><button className="primary-btn" onClick={() => post(`protections/memory/${n.id}/approve`, {}, () => setRev(x => x + 1), setErr)}>Save</button></> : <>{(!n.allowed_actions || n.allowed_actions.includes("edit")) && <NoteEdit id={n.id} text={n.text} onChanged={() => setRev(x => x + 1)} />}<button className="view" onClick={() => post(`protections/memory/${n.id}/delete`, {}, () => setRev(x => x + 1), setErr)}>Delete</button></>}>
          <p className="tile-text">{n.text}</p>
          {n.instruction_like && <p className="tile-warn">This looks like an instruction to a model. Check it before saving.</p>}
          {!!n.given_to_methods?.length && <details><summary>Usage history</summary><pre className="backend-data">{JSON.stringify(n.given_to_methods,null,2)}</pre></details>}
        </Tile>)}
      </TileGrid>
    </Main>
    {adding && tab === "Saved" && <div id="add-form"><Capability id="five_protections"><NoteCreate onChanged={() => setRev(n => n + 1)} /></Capability></div>}
  </Page>;
}
