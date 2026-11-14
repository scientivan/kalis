"use client";
import { UPCOMING_METHODS } from "../lib/upcoming-methods";
import { UseCaseArt, hasUseCaseArt } from "./use-case-art";
import { ConnectorIcons, manifestConnectors } from "./connector-icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { backend, type ApiMethod } from "../lib/backend/client";
import "./reference.css";
import { useNearAuth } from "../lib/near/auth";
import { MyMethods } from "./my-methods";
import { Segmented, Dropdown, NearTech, PageInfo } from "./controls";
import { NEAR_TECH } from "../lib/near-tech";
import { AppShell } from "./shell";
function Icon() { return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="13" height="13" rx="4" fill="currentColor" opacity=".18"/><path d="M8 8h12v12H8zM3 12V3h9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>; }
type Listed = ApiMethod & { listed?: boolean; created_at_ns?: number; latest: ApiMethod["latest"] & { price_amount?: { display?: string } } };
function listing(m: Listed) { return m.latest.manifest.listing as { category?: string; outcome?: string; cover_url?: string; cover_ref?: string; seller?: { display_name?: string } } | undefined; }
const coverOf = (m: Listed) => { const u = (m as { cover_url?: string | null }).cover_url; return u && /^\/api\/methods\/[\w-]+\/cover(\?v=\d+)?$/.test(u) ? "/api/backend" + u : null; };
const price = (m: Listed) => m.latest.price_amount?.display || (m.latest.price_near ? `${m.latest.price_near} NEAR` : "Price unavailable");
const colors = ["#FF5F04", "#FF77CD", "#FEE897", "#9FA9F5", "#F44A32"];
const expertName = (m: Listed) => (listing(m)?.seller?.display_name || m.owner).replace(/\s*\(demo seller\)/i, "");
type Creator = { account_id: string; display_name: string | null; bio: string | null; attribution?: { explorer?: string } };
export function MarketplaceNext({ expert, mine, authorSection = "Published" }: { expert?: string; mine?: boolean; authorSection?: "Drafts" | "Published" } = {}) {
  const auth = useNearAuth();
  const [raw, setRaw] = useState<Record<string, { average: number | null; count: number; runs?: number }>>({});
  const [creator, setCreator] = useState<Creator | null>(null); const [creatorError, setCreatorError] = useState("");
  const [methods, setMethods] = useState<Listed[]>([]);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("");
  const [kind, setKind] = useState("All"); const [sort, setSort] = useState("Newest");
  const [selected, setSelected] = useState(""); const [menu, setMenu] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => { const q = new URLSearchParams(window.location.search).get("q"); if (q) setQuery(q); }, []);
  useEffect(() => { let active = true; setLoading(true); setError("");
    backend<Listed[]>("methods").then(async data => {
      if (!active) return;
      const visible = data.filter(m => m.listed !== false); setMethods(visible);
      await Promise.all(visible.map(async m => { try {
        const r = await backend<{ average: number | null; count: number }>(`methods/${encodeURIComponent(m.method_id)}/rating-summary`);
        if (active) setRaw(old => ({...old, [m.method_id]: r})); if (active) setRatings(old => ({...old, [m.method_id]: r.average === null ? "No ratings yet" : `${r.average} / 5 (${r.count} reviews)`}));
      } catch { if (active) setRatings(old => ({...old, [m.method_id]: "Ratings unavailable"})); } }));
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => { if (!expert) return; let active = true; setCreator(null); setCreatorError("");
    backend<Creator>(`creators/${encodeURIComponent(expert)}`).then(c => { if (active) setCreator(c); }).catch(e => { if (active) setCreatorError(e.message); });
    return () => { active = false; };
  }, [expert, revision]);
  const checks = (m: Listed) => Array.isArray(m.latest.manifest.buyer_checks) ? m.latest.manifest.buyer_checks.length : 0;
  const pool = expert ? methods.filter(m => m.owner === expert) : methods;
  const filtered = pool.filter(m => (!category || listing(m)?.category === category) && (kind === "All" || (m.latest.method_kind?.kind === "prompt" ? kind === "Prompts" : kind === "Programs")) && `${m.title} ${listing(m)?.outcome || ""}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "Lowest price" ? Number(a.latest.price_near)-Number(b.latest.price_near) : sort === "Most used" ? (raw[b.method_id]?.runs ?? 0)-(raw[a.method_id]?.runs ?? 0) : sort === "Oldest" ? Number(a.created_at_ns ?? 0)-Number(b.created_at_ns ?? 0) : Number(b.created_at_ns ?? 0)-Number(a.created_at_ns ?? 0));
  const categories = [...new Set([...methods.map(m => listing(m)?.category), ...UPCOMING_METHODS.map(u => u.category)].filter(Boolean))];
  const icon = (name: string, cls = "i") => <svg className={cls} aria-hidden="true"><use href={`/marketplace-icons.svg#${name}`}/></svg>;
  const identity = (m: Listed) => {
    const names = ["tender-bid", "portfolio-rebalance", "salary-counteroffer", "cash-runway-13w", "defi-liquidation-guard", "token-unlock-sell-plan", "supplier-concession-plan", "term-sheet-dilution", "perp-risk-limit-fit", "token-scam-screen", "large-swap-split", "strategy-robustness-audit"];
    const i = Math.max(0, names.indexOf(m.method_id));
    return { color: ["#FF5F04", "#0038FF", "#FF77CD", "#FEE897", "#9FA9F5", "#F44A32", "#FF5F04", "#FEE897", "#0038FF", "#F44A32", "#9FA9F5", "#FF77CD"][i], tint: ["#ffe3d1", "#dce1f5", "#ffe4f5", "#fff6cf", "#e4e7fb", "#ffe3df", "#ffe3d1", "#fff6cf", "#dce1f5", "#ffe3df", "#e4e7fb", "#ffe4f5"][i], icon: ["m-doc", "m-chart", "m-person", "m-cash", "m-shield", "m-rocket", "m-hand", "m-pie", "m-shield", "m-shield", "m-chart", "m-pie"][i] };
  };
  const coin = (m: Listed) => <span className={`coin ${identity(m).color === "#0038FF" ? "light" : ""}`} style={{background:identity(m).color}}>{icon(identity(m).icon)}</span>;
  const kindOf = (m: Listed) => m.latest.method_kind?.kind === "prompt" ? "Prompt" : !m.latest.method_kind ? "Unknown" : /AI/.test(m.latest.method_kind.label || "") ? "Program + AI" : "Program";
  const kindChip = (m: Listed) => { const k = kindOf(m); return <span className={`kchip ${k === "Prompt" ? "is-prompt" : k === "Program + AI" ? "is-ai" : ""}`}><i aria-hidden="true"/>{k}</span>; };
  const navIcons = ["store","play","check","link","file","note","tag","people","wrench","wallet","pulse"];
  let navIndex = 0;
  const q = query.trim().toLowerCase();
  const upcoming = UPCOMING_METHODS.filter(u => (kind === "All" || (kind === "Programs" ? u.kind !== "Prompt" : u.kind === "Prompt")) && (!category || u.category === category) && (!q || (u.title + " " + u.outcome).toLowerCase().includes(q)));
  return <AppShell active={mine ? authorSection : "Marketplace"} query={query} onQuery={setQuery}>{mine ? <MyMethods section={authorSection} covers={Object.fromEntries(methods.map(m => [m.method_id, coverOf(m)]))} onChanged={() => setRevision(n => n+1)} /> : <>
    {expert ? (() => { const mine = pool; const rated = mine.map(m => raw[m.method_id]).filter(r => r && r.average !== null) as { average: number; count: number }[]; const reviews = rated.reduce((n, r) => n + r.count, 0); const avg = reviews ? (rated.reduce((n, r) => n + r.average * r.count, 0) / reviews).toFixed(1) : null; const name = creator?.display_name || (mine[0] ? expertName(mine[0]) : expert);
      return <section className="card ph expert-head"><div className="expert-id"><Link className="ghost-ic" href="/marketplace" aria-label="Back to Marketplace" title="Back to Marketplace"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></Link><span className="avatar" aria-hidden="true">{name.slice(0,1).toUpperCase()}</span><div><h1>{name}</h1><span className="count-chip">{expert}</span>{creator?.bio && <p>{creator.bio}</p>}{creatorError && <p role="alert">Profile details unavailable. {creatorError}</p>}</div></div><div className="expert-stats"><span><b>{mine.length}</b>Methods</span><span><b>{avg ?? "Not rated"}</b>Average rating</span><span><b>{reviews}</b>Reviews</span>{creator?.attribution?.explorer && <a className="view" href={creator.attribution.explorer} target="_blank" rel="noreferrer">View on NEAR</a>}</div></section>; })() : <>
    <section className="card ph"><div className="ph-title"><h1>Marketplace</h1></div><div className="ph-actions"><NearTech {...NEAR_TECH.marketplace} /><PageInfo title="Run an expert’s method on your own data" points={[{icon: icon("lock"), text: "Your data is sealed on your device. The expert never sees it."}, {icon: icon("chip"), text: "The method runs inside a locked chip. You never see how it works."}, {icon: icon("shield"), text: "You pay only if every step of the run succeeds."}]}/><button className="ghost-ic" aria-label="Refresh methods" title="Refresh methods" onClick={() => setRevision(n => n+1)}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div></section>
    </>}
    {error && <section className="card ph" role="alert"><div><h2>Methods unavailable</h2><p>{error}</p></div><button className="view" onClick={() => setRevision(n => n+1)}>Retry loading</button></section>}
    <section className={`card list-card ${expert ? "no-expert" : ""}`}>{expert ? <div className="toolbar"><h2 className="list-title">Methods by this expert</h2></div> : <div className="toolbar"><Segmented label="Kind" options={["All","Programs","Prompts"]} value={kind} onChange={setKind}/><label className="mk-search" htmlFor="mk-q">{icon("search")}<span className="sr">Search methods</span><input id="mk-q" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search methods"/></label><div className="selects"><Dropdown label="Goal" value={category} onChange={setCategory} options={[{value: "", label: "All goals"}, ...categories.map(c => ({value: c!, label: c!}))]}/><Dropdown label="Sort" value={sort} onChange={setSort} options={["Newest","Oldest","Lowest price","Most used"].map(v => ({value: v, label: v}))}/></div></div>}
    <div className={`mcards ${expert ? "solo" : ""}`} role="list" aria-label="Methods">{filtered.map(m => { const r = raw[m.method_id]; return <article className="mcard" role="listitem" key={m.method_id}>
      {!coverOf(m) && hasUseCaseArt(m.method_id) ? <><div className="mcard-art"><UseCaseArt id={m.method_id}/></div><div className="mcard-kindrow">{kindChip(m)}</div></> : <div className="mcard-top">{coverOf(m) ? <img className="mcard-icon mcard-cover" src={coverOf(m)!} alt="" loading="lazy" referrerPolicy="no-referrer"/> : <span className="mcard-icon" style={{background: identity(m).color, color: ["#FEE897","#9FA9F5","#FF77CD"].includes(identity(m).color) ? "#101010" : "#fff"}}>{icon(identity(m).icon)}</span>}{kindChip(m)}</div>}
      <h3><Link href={`/marketplace/${m.method_id}`}>{m.title}</Link></h3>
      <p className="mcard-desc">{listing(m)?.outcome || listing(m)?.category}</p>
      <div className="mcard-meta"><span className="star">{r && r.average !== null ? <>★ {r.average.toFixed(1)} <em>({r.count})</em></> : "Unrated"}</span><span title="Paid runs of this method on NEAR testnet">{r?.runs ?? 0} {(r?.runs ?? 0) === 1 ? "use" : "uses"}</span><span>{m.latest.manifest.steps.length} steps</span></div>
      {!expert && <Link className="mcard-expert" href={`/experts/${encodeURIComponent(m.owner)}`}><span className="avatar sm" aria-hidden="true">{expertName(m).slice(0,1)}</span>{expertName(m)}</Link>}
      <ConnectorIcons connectors={manifestConnectors(m.latest.manifest)}/>
      <div className="mcard-foot"><span className="mcard-price"><small>From</small>{price(m)}</span><Link className="view" href={`/marketplace/${m.method_id}`}>View</Link></div>
    </article>; })}{!expert && upcoming.map(u => <article className="mcard is-upcoming" role="listitem" key={u.id}>
      <div className="mcard-art"><UseCaseArt id={u.id}/></div>
      <h3>{u.title}</h3>
      <p className="mcard-desc">{u.outcome}</p>
      <p className="mcard-desc">{u.expertise} It stays sealed, and so does your data. {u.privateData.replace(/\.$/, "")} never leave the secure runner.</p>
      <div className="mcard-meta"><span className="upcoming-tag">Upcoming</span><span>{u.kind}</span><span>{u.category}</span></div>
      <div className="mcard-expert is-static"><span className="avatar sm" aria-hidden="true">K</span>Kalis upcoming</div>
      <ConnectorIcons brands={u.apps}/>
      <div className="mcard-foot"><span className="mcard-price"><small>Price</small>Not set</span><button className="view" disabled title="This method is planned and cannot be bought yet.">Not available yet</button></div>
    </article>)}{!loading && !filtered.length && !upcoming.length && <div className="empty-row">No method matches. Try All goals or clear the search.</div>}</div>
    {!expert && <div className="tfoot"><span>{loading ? "Loading methods" : `Showing ${filtered.length} of ${pool.length} methods${!expert && upcoming.length ? `, plus ${upcoming.length} upcoming` : ""}`}</span></div>}</section>
    </>}</AppShell>;
}
