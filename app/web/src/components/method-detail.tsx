"use client";
// Method detail at /marketplace/<id>[/<tab>]. Built from the approved Marketplace template
// (FRONTEND_GUIDE.md section 9): head card, one main card with a segmented switch, one side card.
import Link from "next/link";
import { StakeBadge } from "./social-money";
import { VersionEvidence } from "./version-evidence";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { backend, type ApiVersion } from "../lib/backend/client";
import { AppShell, icon } from "./shell";
import { Segmented, NearTech, PageInfo } from "./controls";
import { NEAR_TECH } from "../lib/near-tech";

type Field = { id: string; label: string; type?: string; required?: boolean; private?: boolean; source?: string; help?: string; unit?: string };
type Manifest = {
  listing?: { outcome?: string; category?: string; seller?: { display_name?: string; role?: string } };
  inputs?: { fields?: Field[]; documents?: string[] };
  outputs?: { fields?: Field[] };
  steps?: { id: string; what: string }[];
  buyer_checks?: { id: string; description: string }[];
  ai?: { allowed?: string[]; proprietary?: boolean };
  connectors?: { id: string; what: string }[];
  outbound?: { host: string; what: string }[];
  browser?: { enabled?: boolean; domains?: string[] };
  memory?: { read?: boolean; write?: string };
  disclosures?: string[];
};
type Version = ApiVersion & { manifest: Manifest; published_at_ns?: string; price_amount?: { display?: string }; note?: string };
type Detail = { method_id: string; owner: string; title: string; versions: Version[]; cover_url?: string | null };
type Summary = { count: number; average: number | null; distribution: Record<string, number>; label: string; note?: string };
type Review = { id: string; rating: number; comment?: string; created_at: string; version?: number };

const IDS = ["tender-bid", "portfolio-rebalance", "salary-counteroffer", "cash-runway-13w", "defi-liquidation-guard", "token-unlock-sell-plan", "supplier-concession-plan", "term-sheet-dilution", "perp-risk-limit-fit", "token-scam-screen", "large-swap-split", "strategy-robustness-audit"];
const identity = (id: string) => { const i = Math.max(0, IDS.indexOf(id)); const color = ["#FF5F04", "#0038FF", "#FF77CD", "#FEE897", "#9FA9F5", "#F44A32", "#FF5F04", "#FEE897", "#0038FF", "#F44A32", "#9FA9F5", "#FF77CD"][i]; return { color, ink: ["#FEE897", "#9FA9F5", "#FF77CD"].includes(color) ? "#101010" : "#fff", icon: ["m-doc", "m-chart", "m-person", "m-cash", "m-shield", "m-rocket", "m-hand", "m-pie", "m-shield", "m-shield", "m-chart", "m-pie"][i] }; };
const CONNECTOR_NAMES: Record<string, string> = { sheets: "Google Sheets", broker: "Demo broker", docs: "Google Docs", wallet: "Demo lending wallet" };
const connectorName = (id: string) => { const k = id.replace(/_mock$/, ""); return CONNECTOR_NAMES[k] || k.charAt(0).toUpperCase() + k.slice(1); };
const TABS = ["Overview", "Inputs", "Checks", "Versions", "Reviews"];
const nameOf = (d: Detail, m: Manifest) => (m.listing?.seller?.display_name || d.owner).replace(/\s*\(demo seller\)/i, "");
const dateOf = (ns?: string) => ns ? new Date(Number(BigInt(ns) / 1000000n)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Unknown date";
const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-6)}`;
const TYPES: Record<string, string> = { array: "List", object: "Group of values", money: "Amount", number: "Number", integer: "Whole number", percent: "Percent", string: "Text", text: "Long text", boolean: "Yes or no", enum: "Choice", date: "Date" };
const typeText = (f: Field) => `${TYPES[f.type || "string"] || f.type}${f.unit ? ` in ${f.unit}` : ""}`;
// Chain notes were written as fragments ending in "."; drop the doubled punctuation before ", with".
const cleanNote = (n?: string) => (n || "").replace(/\.,/g, ",").trim();
const Stars = ({ n }: { n: number }) => <span className="cl-stars" role="img" aria-label={`${n} out of 5`}>{[1, 2, 3, 4, 5].map(i => <svg key={i} viewBox="0 0 20 20" className={i <= n ? "on" : ""} aria-hidden="true"><path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" /></svg>)}</span>;
const kindOf = (v: Version) => v.method_kind?.kind === "prompt" ? "Prompt" : /AI/.test(v.method_kind?.label || "") ? "Program + AI" : "Program";

export function MethodDetail({ id, tab }: { id: string; tab?: string }) {
  const router = useRouter();
  const [d, setD] = useState<Detail | null>(null); const [showAll, setShowAll] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [revision, setRevision] = useState(0);
  const current = TABS.find(t => t.toLowerCase() === (tab || "overview")) || "Overview";

  useEffect(() => {
    let active = true; setError("");
    backend<Detail>(`methods/${encodeURIComponent(id)}`).then(x => { if (active) setD(x); }).catch(e => { if (active) setError(e.message); });
    backend<{ method_id: string; cover_url?: string | null }[]>("methods").then(list => { const c = list.find(m => m.method_id === id)?.cover_url; if (active) setCover(c && /^\/api\/methods\/[\w-]+\/cover(\?v=\d+)?$/.test(c) ? "/api/backend" + c : null); }).catch(() => undefined);
    backend<{ items: Review[]; summary: Summary }>(`methods/${encodeURIComponent(id)}/reviews?limit=20`).then(r => { if (active) { setReviews(r.items); setSummary(r.summary); } }).catch(() => { if (active) { setReviews([]); setSummary(null); } });
    return () => { active = false; };
  }, [id, revision]);

  const v = d ? d.versions[d.versions.length - 1] : null;
  const m: Manifest = v?.manifest || {};
  const go = (t: string) => router.push(`/marketplace/${encodeURIComponent(id)}${t === "Overview" ? "" : "/" + t.toLowerCase()}`, { scroll: false });
  const runHref = v ? `/runs/new?method=${encodeURIComponent(id)}&version=${v.number}` : "#";

  return <AppShell active="Marketplace">
    <section className="card ph">
      <div className="ph-title">
        <Link className="ghost-ic" href="/marketplace" aria-label="Back to Marketplace" title="Back to Marketplace"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></Link>
        <h1>{d?.title || (error ? "Method unavailable" : "Loading method")}</h1>
      </div>
      <div className="ph-actions">
        <NearTech {...NEAR_TECH.method} />
        <PageInfo title="Running this method privately" points={[{ icon: icon("lock"), text: "Your inputs are sealed on your device before they leave it." }, { icon: icon("chip"), text: "The seller’s code runs in a locked chip. Nobody sees your data or the code." }, { icon: icon("check"), text: "Your device checks the answer against the rules in Checks." }]} />
        <button className="ghost-ic" aria-label="Refresh" title="Refresh" onClick={() => setRevision(n => n + 1)}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
    </section>
    {error && <section className="card ph" role="alert"><div><h2>Could not load this method</h2><p className="form-error">{error}</p></div><button className="view" onClick={() => setRevision(n => n + 1)}>Retry</button></section>}
    {d && v && <div className="detail">
      <section className="card list-card">
        <div className="toolbar"><Segmented label="Section" options={TABS} value={current} onChange={go} /></div>
        <div className="dpane" key={current}>
          {current === "Overview" && <>
            <div className="dblock"><h2 className="h3">What you get</h2><p className="lead">{m.listing?.outcome || "The seller did not describe the result."}</p></div>
            <div className="dblock"><h2 className="h3">{m.steps?.length || 0} steps you can follow while it runs</h2>
              <ol className="sflow" style={{ "--n": Math.min(m.steps?.length || 1, 5), "--n3": Math.min(m.steps?.length || 1, 3) } as React.CSSProperties}>{(m.steps || []).map((s, i) => <li key={s.id} style={{ "--i": i } as React.CSSProperties}><span className="sn">{i + 1}</span><span className="sflow-t">{s.what}</span>{i < (m.steps?.length || 0) - 1 && <svg className="sflow-arrow" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h11M10 4.5 14.5 9 10 13.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}</li>)}</ol></div>
            <div className="dblock"><h2 className="h3">What it may use</h2><div className="uses">
              {(m.ai?.allowed || []).map(a => <span className="use" key={a} title={m.ai?.proprietary ? "Proprietary model" : "Private model with attestation"}>{icon("chip")}Private AI {a.split("/").pop()}</span>)}
              {(m.connectors || []).map(c => <span className="use" key={c.id} title={c.what}>{icon("link")}{connectorName(c.id)} connector{/mock/i.test(c.id + c.what) ? " (mock)" : ""}</span>)}
              {(m.outbound || []).map(o => <span className="use" key={o.host + o.what} title={o.what}>{icon("pulse")}Sends after your approval</span>)}
              {m.browser?.enabled && <span className="use" title={(m.browser.domains || []).join(", ")}>{icon("store")}Opens web pages</span>}
              {m.memory?.read && <span className="use" title={`Writes ${m.memory.write || "nothing"}`}>{icon("note")}Reads your saved notes</span>}
              {(m.inputs?.documents || []).length > 0 && <span className="use">{icon("file")}Reads {(m.inputs!.documents!).map(x => x === "pdf" ? "PDF" : x).join(" and ")} files</span>}
              {!m.ai?.allowed?.length && !m.connectors?.length && !m.outbound?.length && !m.browser?.enabled && !m.memory?.read && <span className="use">{icon("lock")}Only the inputs you give it</span>}
            </div></div>
          </>}
          {current === "Inputs" && <div className="cl-cols">
            <section className="cl-group"><header><h2 className="h3">You Provide</h2><span>{(m.inputs?.fields || []).length} values. Locked ones are sealed on your device and never seen by the seller.</span></header>
              <ul className="cl-grid">{(m.inputs?.fields || []).map(f => <li key={f.id} className="cl-item" title={f.help || undefined}>
                <span className={`cl-ico ${f.private ? "on" : ""}`} aria-label={f.private ? "Private" : "Not private"}>{icon(f.private ? "lock" : "file")}</span>
                <span className="cl-t"><b>{f.label}</b><span>{typeText(f)}{f.required ? "" : ", optional"}</span></span></li>)}</ul></section>
            <section className="cl-group"><header><h2 className="h3">You Get Back</h2><span>{(m.outputs?.fields || []).length} values, opened only on your device.</span></header>
              <ul className="cl-grid one">{(m.outputs?.fields || []).map(f => <li key={f.id} className="cl-item"><span className="cl-ico out">{icon("spark")}</span><span className="cl-t"><b>{f.label}</b><span>{typeText(f)}</span></span></li>)}</ul></section>
          </div>}
          {current === "Checks" && <section className="cl-group"><header><h2 className="h3">{m.buyer_checks?.length || 0} Rules Your Device Checks</h2><span>They run after the answer opens, so you can trust the result without trusting the seller.</span></header>
            <ol className="cl-checks">{(m.buyer_checks || []).map((c, i) => <li key={c.id}><span className="cl-n">{i + 1}</span><span>{c.description}</span></li>)}</ol></section>}
          {current === "Versions" && <section className="cl-group"><header><h2 className="h3">{d.versions.length} Published Versions</h2><span>Every version keeps its own fingerprint on NEAR. New runs use the latest one.</span></header>
            <ol className="cl-timeline">{[...d.versions].reverse().slice(0, showAll ? undefined : 3).map((x, i) => <li key={x.number} className={i === 0 ? "now" : ""}>
              <span className="cl-v">v{x.number}</span>
              <div className="cl-vb"><div className="cl-vh"><b>{dateOf(x.published_at_ns)}</b><span>{x.price_amount?.display || `${x.price_near} NEAR`}</span>{i === 0 && <span className="kchip">Current</span>}{!x.runnable && <span className="kchip">Not runnable</span>}<code className="hash" title={`Code ${x.code_hash}\nManifest ${x.manifest_hash}`}>{short(x.code_hash)}</code></div>
                <p>{cleanNote(x.note) || (x.parent ? `Builds on version ${x.parent}.` : "First version.")}</p>
                {!!x.contributors?.length && <span className="cl-who">{icon("people")}Improved with {x.contributors.join(", ")}</span>}</div>
            </li>)}</ol>
            {d.versions.length > 3 && <button type="button" className="view cl-more" onClick={() => setShowAll(v => !v)}>{showAll ? "Show fewer" : `Show ${d.versions.length - 3} older versions`}</button>}</section>}
          {current === "Reviews" && <section className="cl-group">
            <div className="cl-rev-head"><div className="cl-score"><b>{summary?.average != null ? summary.average.toFixed(1) : "None"}</b><Stars n={Math.round(summary?.average || 0)} /><span>{summary?.count ? `${summary.count} ${summary.count === 1 ? "buyer" : "buyers"}` : "No ratings yet"}</span></div>
              {summary && summary.count > 0 && <div className="dist">{[5, 4, 3, 2, 1].map(n => { const c = summary.distribution[String(n)] || 0; return <div className="drow" key={n}><span>{n}</span><span className="dbar"><i style={{ width: summary.count ? `${(c / summary.count) * 100}%` : "0%" }} /></span><span>{c}</span></div>; })}</div>}</div>
            {reviews && !reviews.length && <div className="note-row">{icon("info")}<span>Only buyers who ran this method can rate it. Ratings are separate from the seller’s own tests.</span></div>}
            <ul className="cl-reviews">{(reviews || []).map(r => <li key={r.id}><div className="cl-rh"><Stars n={r.rating} /><span>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{r.version ? `, version ${r.version}` : ""}</span></div>
              <p className={r.comment ? "" : "muted"}>{r.comment || "Rated without a comment."}</p><StakeBadge methodId={id} reviewId={r.id} /></li>)}</ul>
          </section>}
        </div>
      </section>
      <aside className="card dside" aria-label="Price and seller">
        <div className="dside-top">
          {cover ? <img className="mcard-icon mcard-cover big" src={cover} alt="" /> : <span className="mcard-icon big" aria-hidden="true" style={{ background: identity(id).color, color: identity(id).ink }}>{icon(identity(id).icon)}</span>}
          <span className={`kchip ${kindOf(v) === "Prompt" ? "is-prompt" : kindOf(v) === "Program + AI" ? "is-ai" : ""}`}><i aria-hidden="true" />{kindOf(v)}</span>
        </div>
        <div className="dprice"><small>Price per run</small><b>{v.price_amount?.display || `${v.price_near} NEAR`}</b></div>
        <div className="split-bar" aria-label="Where the payment goes">
          <i style={{ flexGrow: v.payout_split_pct.seller }} /><i style={{ flexGrow: v.payout_split_pct.dao }} /><i style={{ flexGrow: v.payout_split_pct.platform }} />
        </div>
        <div className="split-legend"><span><i className="s1" />Expert {v.payout_split_pct.seller}%</span><span><i className="s2" />Community fund {v.payout_split_pct.dao}%</span><span><i className="s3" />Kalis {v.payout_split_pct.platform}%</span></div>
        <div className="dmeta">
          <Link className="mcard-expert" href={`/experts/${encodeURIComponent(d.owner)}`}><span className="avatar sm" aria-hidden="true">{nameOf(d, m).slice(0, 1)}</span>{nameOf(d, m)}</Link>
          <span>{m.listing?.category}, version {v.number}, {summary?.average != null ? `rated ${summary.average.toFixed(1)}` : "unrated"}</span>
        </div>
        {(m.disclosures || []).length > 0 && <details className="disclose"><summary>{icon("info")}Before you run</summary>{m.disclosures!.map((t, i) => <p key={i}>{t}</p>)}</details>}
        <div className="dside-foot">
          <VersionEvidence methodId={id} version={v.number}/>
          {v.runnable ? <Link className="primary-btn wide" href={runHref}>{icon("lock")}Run privately</Link> : <span className="note-row">{icon("info")}<span>This version cannot run yet. The sealed method is not on this server.</span></span>}
          <span className="hint2">Payment is held and released only if every step works.</span>
        </div>
      </aside>
    </div>}
  </AppShell>;
}
