"use client";
// Every rail page except Marketplace, built from the approved template (FRONTEND_GUIDE.md section 9):
// one head card (title on the left, (i) and refresh on the right), then one main card with a toolbar
// and rows. All data comes from the backend; nothing here is invented.
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { backend } from "../lib/backend/client";
import { useNearAuth } from "../lib/near/auth";
import { AppShell, icon } from "./shell";
import { PageInfo, Segmented } from "./controls";

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
      <div className="ph-actions"><PageInfo title={info.title} points={info.points.map(([ic, text]) => ({ icon: icon(ic), text }))} /><Refresh onClick={onRefresh} /></div></section>
    {children}
  </AppShell>;
}
function Main({ title, tools, children }: { title?: string; tools?: ReactNode; children: ReactNode }) {
  return <section className="card list-card">{(title || tools) && <div className="toolbar">{title && <h2 className="list-title">{title}</h2>}{tools}</div>}<div className="dpane">{children}</div></section>;
}
function State({ loading, error, empty, emptyText }: { loading: boolean; error: string; empty: boolean; emptyText: string }) {
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (loading) return <div className="note-row">{icon("info")}<span>Loading</span></div>;
  if (empty) return <div className="note-row">{icon("info")}<span>{emptyText}</span></div>;
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
export function MyRunsPage() {
  const [rev, setRev] = useState(0);
  const r = useApi<{ items: Entry[] }>("me/transactions?limit=50", rev);
  const runs = new Map<string, Entry[]>();
  for (const e of r.data?.items || []) runs.set(e.run_id, [...(runs.get(e.run_id) || []), e]);
  return <Page active="Runs" title="Runs" onRefresh={() => setRev(n => n + 1)} info={{ title: "Your private runs", points: [["lock", "Each run sealed your data in your browser."], ["coins", "Payments wait in escrow until every step works."], ["play", "Open a run to see its escrow status and links on NEAR."]] }}>
    <Main title="Runs from this browser" tools={<Link className="primary-btn link-btn" href="/marketplace">Find a method</Link>}>
      <State {...r} empty={!runs.size} emptyText="No runs yet from this browser. Pick a method in the Marketplace to start one." />
      <div className="rows">{[...runs.entries()].map(([id, es]) => { const last = es[0]; return <Link className="row link-row" href={`/runs/${encodeURIComponent(id)}`} key={id}>
        <span className="okdot" aria-hidden="true">{icon("play")}</span>
        <span className="two"><b>{last.method_id}{last.version ? `, v${last.version}` : ""}</b><span>{ENTRY[last.type] || last.type}, {when(last.occurred_at)}</span></span>
        <span className="num">{es.find(e => e.type === "escrow_hold")?.amount?.display || ""}</span>
        <Badge tone={last.type === "release" ? "blue" : last.type === "escrow_hold" ? undefined : "warn"}>{last.type === "escrow_hold" ? "Held" : last.type === "release" ? "Done" : "Refunded"}</Badge>
      </Link>; })}</div>
    </Main>
  </Page>;
}

// ---------- Waiting for my approval ----------
type Outbound = { id: string; method_id: string; destination: string; content: string; status: string; action_hash?: string; reason?: string; private_values_found?: string[]; created_at?: string };
export function ApprovalsPage() {
  const [rev, setRev] = useState(0); const [err, setErr] = useState("");
  const r = useApi<Outbound[] | { items: Outbound[] }>("protections/outbound", rev);
  const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
  const [tab, setTab] = useState("Waiting");
  const shown = items.filter(o => tab === "All" || (tab === "Waiting" ? o.status === "pending" || o.status === "held" : o.status !== "pending" && o.status !== "held"));
  return <Page active="Approvals" title="Approvals" onRefresh={() => setRev(n => n + 1)} info={{ title: "Nothing is sent without you", points: [["pulse", "A method that wants to send something is held here first."], ["check", "You approve the exact text. Any change needs a new approval."], ["info", "This step runs on the Kalis server, not in a locked chip."]] }}>
    <Main tools={<Segmented label="Status" options={["Waiting", "Done", "All"]} value={tab} onChange={setTab} />}>
      {err && <p className="form-error">{err}</p>}
      <State {...r} empty={!shown.length} emptyText={tab === "Waiting" ? "Nothing is waiting for your approval." : "No approvals yet."} />
      <div className="rows">{shown.map(o => <div className="row approve" key={o.id}>
        <span className="two"><b>{o.destination}</b><span>{o.method_id}{o.created_at ? `, ${when(o.created_at)}` : ""}</span><code className="exact">{o.content}</code>
          {!!o.private_values_found?.length && <span className="warn-line">Contains your private values ({o.private_values_found.join(", ")}). It is blocked.</span>}{o.reason && <span>{o.reason}</span>}</span>
        {(o.status === "pending" || o.status === "held") ? <span className="acts"><button className="view" onClick={() => post(`protections/outbound/${o.id}/reject`, {}, () => setRev(n => n + 1), setErr)}>Reject</button><button className="primary-btn" onClick={() => post(`protections/outbound/${o.id}/approve`, { action_hash: o.action_hash }, () => setRev(n => n + 1), setErr)}>Approve</button></span> : <Badge tone={o.status === "approved" || o.status === "sent" ? "blue" : "warn"}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</Badge>}
      </div>)}</div>
    </Main>
  </Page>;
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
      <div className="rows">{(r.data?.items || []).map(a => <div className="row" key={a.id}><span className="okdot" aria-hidden="true">{icon(ACT_ICON[a.resource_type] || "info")}</span><span className="two"><b>{a.summary}</b><span>{when(a.occurred_at)}</span></span>{a.status && <Badge>{a.status}</Badge>}</div>)}</div>
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
        {tab === "Payments" && <><State {...tx} empty={!tx.data?.items.length} emptyText="No payments from this browser yet." />
          <div className="rows">{(tx.data?.items || []).map((e, i) => <div className="row" key={i}><span className="two"><b>{ENTRY[e.type] || e.type}</b><span>{e.method_id}, {when(e.occurred_at)}</span></span><span className="num">{e.amount?.display}</span>{e.tx_url && <a className="view" href={e.tx_url} target="_blank" rel="noreferrer">On NEAR</a>}</div>)}</div></>}
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
  </Page>;
}

// ---------- Community fund ----------
type Dao = { dao: string; balance_near: string; available_near?: string; council: string[]; bounties: { id: number; description: string; amount_near: string; times: number }[]; proposals: { id: number; proposer: string; description: string; kind: string; status: string }[] };
export function CommunityPage() {
  const [rev, setRev] = useState(0); const [tab, setTab] = useState("Proposals");
  const r = useApi<Dao>("dao", rev);
  const d = r.data;
  return <Page active="Fund" title="Fund" onRefresh={() => setRev(n => n + 1)} info={{ title: "A fund owned by its members", points: [["coins", "Part of every run goes to this fund on NEAR."], ["people", "The council votes on proposals to pay for improvements."], ["wrench", "Paid improvements become new method versions."]] }}>
    <div className="detail">
      <Main tools={<Segmented label="Section" options={["Proposals", "Council"]} value={tab} onChange={setTab} />}>
        <State {...r} empty={false} emptyText="" />
        {d && tab === "Proposals" && <div className="rows">{[...d.proposals].reverse().map(p => <div className="row" key={p.id}><span className="vn">#{p.id}</span><span className="two"><b>{clean(p.description).title}</b><span>{clean(p.description).detail ? `${clean(p.description).detail}. ` : ""}{p.kind.replace(/([a-z])([A-Z])/g, "$1 $2")} by {p.proposer}</span></span><Badge tone={p.status === "Approved" ? "blue" : p.status === "Rejected" ? "bad" : undefined}>{p.status.replace(/([a-z])([A-Z])/g, "$1 $2")}</Badge></div>)}</div>}
        {d && tab === "Council" && <div className="rows">{d.council.map(c => <div className="row" key={c}><span className="avatar sm" aria-hidden="true">{c.slice(0, 1).toUpperCase()}</span><span className="two"><b>{c}</b></span></div>)}</div>}
      </Main>
      <aside className="card dside">
        <div className="dprice"><small>Fund balance</small><b>{d ? `${d.balance_near} NEAR` : "Loading"}</b></div>
        {d?.available_near && <div className="row"><span className="two"><span>Available for bounties</span><b>{d.available_near} NEAR</b></span></div>}
        <div className="row"><span className="two"><span>Open bounties</span><b>{d?.bounties.length ?? ""}</b></span></div>
        {d && <a className="use" href={`https://testnet.nearblocks.io/address/${d.dao}`} target="_blank" rel="noreferrer">{icon("link")}Fund on NEAR</a>}
        <div className="dside-foot"><Link className="primary-btn wide" href="/community/bounties">See paid improvements</Link></div>
      </aside>
    </div>
  </Page>;
}

// ---------- Paid improvements ----------
type Bounty = { id: number; description: string; amount?: Money; amount_near?: string; times?: number; max_deadline?: string; issue_id?: string | null };
type Issue = { id: string; method_id: string; problem: string; state: string; created_at?: string };
export function ImprovementsPage() {
  const [rev, setRev] = useState(0); const [tab, setTab] = useState("Bounties");
  const b = useApi<Bounty[] | { items: Bounty[] }>("bounties", rev);
  const i = useApi<Issue[] | { items: Issue[] }>("issues", rev);
  const bounties = Array.isArray(b.data) ? b.data : b.data?.items || [];
  const issues = Array.isArray(i.data) ? i.data : i.data?.items || [];
  return <Page active="Bounties" title="Bounties" onRefresh={() => setRev(n => n + 1)} info={{ title: "Get paid to improve a method", points: [["note", "Anyone can report a problem with a method."], ["coins", "The fund posts a bounty for a fix."], ["check", "A fix is tested on private cases before it is paid."]] }}>
    <Main tools={<Segmented label="Section" options={["Bounties", "Reported problems"]} value={tab} onChange={setTab} />}>
      {tab === "Bounties" ? <><State {...b} empty={!bounties.length} emptyText="No open bounties." />
        <div className="rows">{bounties.map(x => <div className="row" key={x.id}><span className="vn">#{x.id}</span><span className="two"><b>{clean(x.description).title}</b><span>{clean(x.description).detail ? `${clean(x.description).detail}. ` : ""}{x.times ? `Claimed ${x.times} ${x.times === 1 ? "time" : "times"}` : "Not claimed yet"}</span></span><span className="num">{x.amount?.display || (x.amount_near ? `${x.amount_near} NEAR` : "")}</span></div>)}</div></>
        : <><State {...i} empty={!issues.length} emptyText="No problems reported yet." />
          <div className="rows">{issues.map(x => <div className="row" key={x.id}><span className="two"><b>{x.problem}</b><span>{x.method_id}{x.created_at ? `, ${when(x.created_at)}` : ""}</span></span><Badge tone={x.state === "open" ? "blue" : undefined}>{x.state.charAt(0).toUpperCase() + x.state.slice(1)}</Badge></div>)}</div></>}
      <Limit>Claiming a bounty and sending a fix need a signed-in NEAR account. Those steps are not in this app yet.</Limit>
    </Main>
  </Page>;
}

// ---------- Connected apps ----------
type Cred = { id: string; connector: string; scopes: string[]; expires_at?: string; last_used_at?: string | null; revoked?: boolean; status?: string };
const CONNECTOR: Record<string, string> = { broker_mock: "Broker", sheets_mock: "Spreadsheet", docs_mock: "Documents", wallet_mock: "Lending wallet" };
export function ConnectionsPage() {
  const [rev, setRev] = useState(0); const [err, setErr] = useState("");
  const r = useApi<Cred[] | { items: Cred[] }>("protections/credentials", rev);
  const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
  return <Page active="Connections" title="Connections" onRefresh={() => setRev(n => n + 1)} info={{ title: "Apps a method may read from", points: [["link", "Read-only access, for a limited time, that you can revoke."], ["lock", "Methods never get your token. They get only what they declared."], ["info", "Connections are held on the Kalis server, not in a locked chip."]] }}>
    <Main title="Your connections">
      {err && <p className="form-error">{err}</p>}
      <State {...r} empty={!items.length} emptyText="No apps connected. A method asks for a connection when it needs one." />
      <div className="rows">{items.map(c => { const off = c.revoked || c.status === "revoked"; return <div className="row" key={c.id}><span className="okdot" aria-hidden="true">{icon("link")}</span><span className="two"><b>{CONNECTOR[c.connector] || c.connector} (mock)</b><span>{c.scopes.join(", ")} access{c.expires_at ? `, until ${when(c.expires_at)}` : ""}{c.last_used_at ? `, last used ${when(c.last_used_at)}` : ", never used"}</span></span>{off ? <Badge>Revoked</Badge> : <button className="view" onClick={() => post(`protections/credentials/${c.id}/revoke`, {}, () => setRev(n => n + 1), setErr)}>Revoke</button>}</div>; })}</div>
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
    <Main title="Read documents">
      <State {...r} empty={!items.length} emptyText="No documents yet. You add one while preparing a run that reads files." />
      <div className="rows">{items.map(x => <div className="row" key={x.id}><span className="okdot" aria-hidden="true">{icon("file")}</span><span className="two"><b>{x.filename}</b><span>{x.method_id ? `${x.method_id}, ` : ""}{x.text_chars ? `${x.text_chars} characters, ` : ""}{when(x.created_at)}</span></span>{!!x.pii_spans?.length && <Badge tone="warn">Personal data found</Badge>}{x.instruction_like && <Badge tone="warn">Hidden instructions found</Badge>}</div>)}</div>
    </Main>
  </Page>;
}

// ---------- Saved notes ----------
type Note = { id: string; text: string; status: string; source?: { kind: string; ref?: string }; instruction_like?: boolean; created_at?: string };
export function NotesPage() {
  const [rev, setRev] = useState(0); const [err, setErr] = useState(""); const [tab, setTab] = useState("Saved");
  const r = useApi<Note[] | { items: Note[] }>("protections/memory", rev);
  const items = (Array.isArray(r.data) ? r.data : r.data?.items || []).filter(n => tab === "Saved" ? n.status === "approved" || n.status === "active" : n.status === "pending");
  return <Page active="Notes" title="Notes" onRefresh={() => setRev(n => n + 1)} info={{ title: "Notes methods may remember", points: [["note", "A method can only suggest a note. You decide what is saved."], ["check", "Methods that declare it may read your saved notes."], ["info", "Notes are kept on the Kalis server, not in a locked chip."]] }}>
    <Main tools={<Segmented label="Status" options={["Saved", "Suggested"]} value={tab} onChange={setTab} />}>
      {err && <p className="form-error">{err}</p>}
      <State {...r} empty={!items.length} emptyText={tab === "Saved" ? "No saved notes." : "No suggestions waiting."} />
      <div className="rows">{items.map(n => <div className="row" key={n.id}><span className="okdot" aria-hidden="true">{icon("note")}</span><span className="two"><b>{n.text}</b><span>{n.source ? `From ${n.source.kind}` : ""}{n.created_at ? `, ${when(n.created_at)}` : ""}</span>{n.instruction_like && <span className="warn-line">This looks like an instruction to a model. Check it before saving.</span>}</span>
        <span className="acts">{n.status === "pending" ? <><button className="view" onClick={() => post(`protections/memory/${n.id}/reject`, {}, () => setRev(x => x + 1), setErr)}>Discard</button><button className="primary-btn" onClick={() => post(`protections/memory/${n.id}/approve`, {}, () => setRev(x => x + 1), setErr)}>Save</button></> : <button className="view" onClick={() => post(`protections/memory/${n.id}/delete`, {}, () => setRev(x => x + 1), setErr)}>Delete</button>}</span></div>)}</div>
    </Main>
  </Page>;
}
