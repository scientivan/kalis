"use client";
// Every rail page except Marketplace, built from the approved template (FRONTEND_GUIDE.md section 9):
// one head card (title on the left, (i) and refresh on the right), then one main card with a toolbar
// and rows. All data comes from the backend; nothing here is invented.
import { statusLabel, useMethodTitles } from "../lib/labels";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { backend } from "../lib/backend/client";
import { useNearAuth } from "../lib/near/auth";
import { AppShell, icon } from "./shell";
import { PageInfo, Segmented } from "./controls";
import { CommunityWorkspace } from "./community-workspace";
import { ConnectionCreate, DocumentUpload, DocumentDetails, NoteCreate, NoteEdit } from "./data-tools";
import { AccountEditors, PaymentHistory } from "./account-tools";
import { Capability } from "./capability";

type Money = { display?: string };
function useApi<T>(path: string | null, rev: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!path) return;
    let on = true; setError("");
    backend<T>(path).then(x => { if (on) setData(x); }).catch(e => { if (on) setError(e.message); });
    return () => { on = false; };
  }, [path, rev]);
  return { data, error, loading: !data && !error };
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
const ENTRY: Record<string, string> = { escrow_hold: "Paid into escrow", release: "Released to the expert", stage_refund: "Refunded, a step failed", timeout_reclaim: "Reclaimed after timeout" };
type Job = { id:string;method_id:string;version:number;phase:string;created_at:string;pay_tx?:string };
export function MyRunsPage({ section = "Ongoing" }: { section?: "Ongoing" | "Results" }) {
  const [rev,setRev]=useState(0),[jobs,setJobs]=useState<Job[]>([]),[cursor,setCursor]=useState<string|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  async function load(next?:string){setLoading(true);setError("");try{const page=await backend<{items:Job[];next_cursor:string|null}>(`runs?limit=50${next?`&cursor=${encodeURIComponent(next)}`:""}`);setJobs(old=>next?[...old,...page.items.filter(x=>!old.some(y=>y.id===x.id))]:page.items);setCursor(page.next_cursor);}catch(e){setError(e instanceof Error?e.message:"Could not load jobs.");}finally{setLoading(false);}}
  useEffect(()=>{void load();},[rev]);
  const title=useMethodTitles();
  const shown=jobs.filter(job=>section === "Results" ? ["executed","released","refunded"].includes(job.phase) : !["executed","released","refunded"].includes(job.phase));
  return <Page active={section} title={section} onRefresh={()=>setRev(n=>n+1)} info={{title:section === "Ongoing"?"Jobs in progress":"Completed jobs",points:[["play",section === "Ongoing"?"Review actions waiting for your approval and follow jobs that are still in progress.":"Review completed jobs, their checks and payment records. Decrypted answers remain available only in the tab that holds their key."],["lock","Your answer-opening key is never sent to the server."]]}}>
    {section === "Ongoing"&&<ApprovalPanel key={rev}/>}
    <Main><State loading={loading&&!jobs.length} error={error} empty={!shown.length} emptyText={section === "Results"?"No completed jobs in the loaded history.":"No ongoing jobs in the loaded history."} action={<Link className="primary-btn link-btn" href="/marketplace">Find a method</Link>}/>
      {error&&<button className="view" onClick={()=>void load()}>Retry loading</button>}
      <div className="rows">{shown.map(job=><Link className="row link-row" href={`/runs/${encodeURIComponent(job.id)}`} key={job.id}><span className="okdot">{icon("play")}</span><span className="two"><b>{title(job.method_id)}</b><span>Version {job.version}</span><span>{when(job.created_at)}</span></span><Badge tone={job.phase==="execution_failed"?"warn":undefined}>{statusLabel(job.phase)}</Badge></Link>)}</div>
      {cursor&&<button className="view" disabled={loading} onClick={()=>void load(cursor)}>{loading?"Loading":"Load more jobs"}</button>}
    </Main>
  </Page>;
}

// ---------- Waiting for my approval ----------
type Outbound = { id: string; method_id?: string; destination: string; content: string; params?: unknown; status: string; action_hash?: string; reason?: string; private_values_found?: {label?: string}[]; allowed_actions?: string[]; receipt?: unknown; created_at?: string };
export function ApprovalsPage() { return <MyRunsPage section="Ongoing" />; }
function ApprovalPanel() {
  const [rev, setRev] = useState(0), [err, setErr] = useState(""), [busy, setBusy] = useState(""), [message, setMessage] = useState("");
  const r = useApi<Outbound[] | { items: Outbound[] }>("protections/outbound", rev);
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
      setMessage(action === "execute" ? (result.status === "sent" ? "The labelled mock portal confirmed receipt." : "The send did not complete. Review its status before another attempt.") : action === "approve" ? "Approved. Choose Send to mock portal to send the exact approved content." : "Action rejected.");
    } catch(e) { setErr(e instanceof Error ? e.message : "Action failed. Refresh before trying again."); }
    finally {setBusy("");setRev(n=>n+1);}
  }
  return <Main title="Needs your approval" tools={<Segmented label="Status" options={["Waiting", "Done", "All"]} value={tab} onChange={setTab} />}>
    {err && <p className="form-error" role="alert">{err}</p>}{message && <Limit>{message}</Limit>}
    <State {...r} empty={!shown.length} emptyText={tab === "Waiting" ? "Nothing is waiting for your approval." : "No approvals yet."} />
    <div className="rows">{shown.map(o => <div className="row approve" key={o.id}>
      <span className="two"><b>{o.destination}</b><span>{o.method_id || "Held action"}{o.created_at ? `, ${when(o.created_at)}` : ""}</span><code className="exact">{o.content}</code>
        {!!o.private_values_found?.length && <span className="warn-line">Contains marked private values ({o.private_values_found.map(x=>x.label || "private data").join(", ")}). Approval is disabled. Create a new action without those values.</span>}
        {o.reason && <span>{o.reason}</span>}<span>Only the labelled mock procurement portal can receive submissions in this demo.</span>
        {!!o.params && <details><summary>Submission details</summary><pre className="backend-data">{JSON.stringify(o.params,null,2)}</pre></details>}
        {!!o.receipt && <details><summary>Portal receipt</summary><pre className="backend-data">{JSON.stringify(o.receipt,null,2)}</pre></details>}
      </span><span className="acts"><Badge tone={o.status === "approved" || o.status === "sent" ? "blue" : "warn"}>{o.status.replaceAll("_", " ")}</Badge>
      {["pending","held","held_for_approval"].includes(o.status) && <><button className="view" disabled={!!busy || !permitted(o,"reject")} onClick={()=>void act(o,"reject")}>Reject</button><button className="primary-btn" disabled={!!busy || !o.action_hash || !!o.private_values_found?.length || !permitted(o,"approve")} onClick={()=>void act(o,"approve")}>Approve exact content</button></>}
      {o.status === "approved" && <button className="primary-btn" disabled={!!busy || !permitted(o,"execute")} onClick={()=>void act(o,"execute")}>Send to mock portal</button>}
      </span></div>)}</div>
  </Main>;
}

// ---------- Activity ----------
type Act = { id: string; resource_type: string; kind: string; status?: string; occurred_at: string; summary: string };
const ACT_TABS: Record<string, string> = { All: "", Runs: "run", Approvals: "outbound", Notes: "memory", Documents: "documents", Reviews: "review" };
const ACT_ICON: Record<string, string> = { run: "play", outbound: "pulse", memory: "note", documents: "file", review: "check", credentials: "link", browser: "store" };
export function ActivityPage() {
  const [rev, setRev] = useState(0); const [tab, setTab] = useState("All");
  const r = useApi<{ items: Act[] }>(`activity?limit=50${ACT_TABS[tab] ? `&resource_type=${ACT_TABS[tab]}` : ""}`, rev);
  return <Page active="Activity" title="Activity" onRefresh={() => setRev(n => n + 1)} info={{ title: "Everything that happened", points: [["pulse", "Runs, approvals, notes, documents and reviews in one list."], ["lock", "Summaries only. No data, answers or tokens are shown."]] }}>
    <Main tools={<Segmented label="Type" options={Object.keys(ACT_TABS)} value={tab} onChange={setTab} />}>
      <State {...r} empty={!r.data?.items.length} emptyText="No activity yet." />
      <div className="rows">{(r.data?.items || []).map(a => <div className="row" key={a.id}><span className="okdot" aria-hidden="true">{icon(ACT_ICON[a.resource_type] || "info")}</span><span className="two"><b>{a.summary}</b><span>{when(a.occurred_at)}</span></span>{a.status && <Badge>{statusLabel(a.status)}</Badge>}</div>)}</div>
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
type Cred = { effective_state?: string; allowed_actions?: string[]; id: string; connector: string; scopes: string[]; expires_at?: string; last_used_at?: string | null; revoked?: boolean; status?: string };
const CONNECTOR: Record<string, string> = { broker_mock: "Broker", sheets_mock: "Spreadsheet", docs_mock: "Documents", wallet_mock: "Lending wallet" };
export function ConnectionsPage() {
  const [rev, setRev] = useState(0); const [err, setErr] = useState("");
  const r = useApi<Cred[] | { items: Cred[] }>("protections/credentials", rev);
  const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
  return <Page active="Connections" title="Connections" onRefresh={() => setRev(n => n + 1)} info={{ title: "Apps a method may read from", points: [["link", "Read-only access, for a limited time, that you can revoke."], ["lock", "Methods never get your token. They get only what they declared."], ["info", "Connections are held on the Kalis server, not in a locked chip."]] }}>
    <Capability id="five_protections"><ConnectionCreate onChanged={() => setRev(n => n + 1)} /></Capability>
    <Main title="Your connections">
      {err && <p className="form-error">{err}</p>}
      <State {...r} empty={!items.length} emptyText="No apps connected. A method asks for a connection when it needs one." action={<Link className="view" href="/marketplace">Find a method</Link>} />
      <div className="rows">{items.map(c => { const state = c.effective_state || (c.revoked || c.status === "revoked" ? "revoked" : c.expires_at && Date.parse(c.expires_at) <= Date.now() ? "expired" : "active"); const off = state !== "active"; return <div className="row" key={c.id}><span className="okdot" aria-hidden="true">{icon("link")}</span><span className="two"><b>{CONNECTOR[c.connector] || c.connector} (mock)</b><span>{c.scopes.join(", ")} access{c.expires_at ? `, until ${when(c.expires_at)}` : ""}{c.last_used_at ? `, last used ${when(c.last_used_at)}` : ", never used"}</span></span>{off ? <Badge>{statusLabel(state)}</Badge> : (!c.allowed_actions || c.allowed_actions.includes("revoke")) && <button className="view" onClick={() => post(`protections/credentials/${c.id}/revoke`, {}, () => setRev(n => n + 1), setErr)}>Revoke</button>}</div>; })}</div>
      <Limit>Every connection here is a labelled mock service. No real broker, sheet or wallet is connected.</Limit>
    </Main>
  </Page>;
}

// ---------- Documents ----------
type Doc = { id: string; filename: string; method_id?: string; processed_by?: string; pii_spans?: unknown[]; instruction_like?: boolean; created_at?: string; text_chars?: number };
export function DocumentsPage() {
  const [rev, setRev] = useState(0);
  const r = useApi<Doc[] | { items: Doc[] }>("protections/documents", rev);
  const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
  return <Page active="Documents" title="Documents" onRefresh={() => setRev(n => n + 1)} info={{ title: "Documents a method read", points: [["file", "Text is read from your file, then sealed into the run."], ["lock", "The server keeps only a fingerprint, not the text."], ["info", "Files pass through the Kalis server on the way to the private AI."]] }}>
    <Capability id="five_protections"><DocumentUpload onChanged={() => setRev(n => n + 1)} /></Capability>
    <Main title="Read documents">
      <State {...r} empty={!items.length} emptyText="No documents yet. You add one while preparing a run that reads files." action={<Link className="view" href="/marketplace">Find a method</Link>} />
      <div className="rows">{items.map(x => <div className="row" key={x.id}><span className="okdot" aria-hidden="true">{icon("file")}</span><span className="two"><b>{x.filename}</b><span>{x.method_id ? `${x.method_id}, ` : ""}{x.text_chars ? `${x.text_chars} characters, ` : ""}{when(x.created_at)}</span></span>{!!x.pii_spans?.length && <Badge tone="warn">Personal data found</Badge>}{x.instruction_like && <Badge tone="warn">Hidden instructions found</Badge>}<DocumentDetails id={x.id} /></div>)}</div>
    </Main>
  </Page>;
}

// ---------- Saved notes ----------
type Note = { effective_state?: string; allowed_actions?: string[]; given_to_methods?: unknown[]; id: string; text: string; status: string; source?: { kind: string; ref?: string }; instruction_like?: boolean; created_at?: string };
export function NotesPage() {
  const [rev, setRev] = useState(0); const [err, setErr] = useState(""); const [tab, setTab] = useState("Saved");
  const r = useApi<Note[] | { items: Note[] }>("protections/memory", rev);
  const items = (Array.isArray(r.data) ? r.data : r.data?.items || []).filter(n => tab === "Saved" ? n.status === "approved" || n.status === "active" : n.status === "pending");
  return <Page active="Notes" title="Notes" onRefresh={() => setRev(n => n + 1)} info={{ title: "Notes methods may remember", points: [["note", "A method can only suggest a note. You decide what is saved."], ["check", "Methods that declare it may read your saved notes."], ["info", "Notes are kept on the Kalis server, not in a locked chip."]] }}>
    <Capability id="five_protections"><NoteCreate onChanged={() => setRev(n => n + 1)} /></Capability>
    <Main tools={<Segmented label="Status" options={["Saved", "Suggested"]} value={tab} onChange={setTab} />}>
      {err && <p className="form-error">{err}</p>}
      <State {...r} empty={!items.length} emptyText={tab === "Saved" ? "No saved notes." : "No suggestions waiting."} />
      <div className="rows">{items.map(n => <div className="row" key={n.id}><span className="okdot" aria-hidden="true">{icon("note")}</span><span className="two"><b>{n.text}</b><span>{n.source ? `From ${n.source.kind}` : ""}{n.created_at ? `, ${when(n.created_at)}` : ""}</span>{n.instruction_like && <span className="warn-line">This looks like an instruction to a model. Check it before saving.</span>}</span>
        {(!n.allowed_actions || n.allowed_actions.includes("edit")) && <NoteEdit id={n.id} text={n.text} onChanged={() => setRev(x => x + 1)} />}{!!n.given_to_methods?.length && <details><summary>Usage history</summary><pre className="backend-data">{JSON.stringify(n.given_to_methods,null,2)}</pre></details>}<span className="acts">{n.status === "pending" ? <><button className="view" onClick={() => post(`protections/memory/${n.id}/reject`, {}, () => setRev(x => x + 1), setErr)}>Discard</button><button className="primary-btn" onClick={() => post(`protections/memory/${n.id}/approve`, {}, () => setRev(x => x + 1), setErr)}>Save</button></> : <button className="view" onClick={() => post(`protections/memory/${n.id}/delete`, {}, () => setRev(x => x + 1), setErr)}>Delete</button>}</span></div>)}</div>
    </Main>
  </Page>;
}
