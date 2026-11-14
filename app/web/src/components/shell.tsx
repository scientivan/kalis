"use client";
// Shared app shell: the capsule icon rail (Kalis mark, search, navigation, notifications, network, wallet).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useNearAuth } from "../lib/near/auth";
import "./reference.css";
const groups = [
  ["Buying", "Find a method and run it on your data", [["Marketplace", "/marketplace"], ["Runs", "/runs"], ["Approvals", "/approvals"]]],
  ["Private Data", "What methods may read, under your control", [["Connections", "/connections"], ["Documents", "/workspace/files"], ["Notes", "/workspace/memory"]]],
  ["Selling", "For experts and contributors", [["Listings", "/marketplace/mine"], ["Fund", "/community"], ["Bounties", "/community/bounties"]]],
  ["Profile", "Your account and history", [["Account", "/account"], ["Activity", "/activity"]]],
] as const;
export const icon = (name: string, cls = "i") => <svg className={cls} aria-hidden="true"><use href={`/marketplace-icons.svg#${name}`}/></svg>;
const navIcons = ["store","play","check","link","file","note","tag","people","wrench","wallet","pulse"];

export function AppShell({ active, query, onQuery, children }: { active: string; query?: string; onQuery?: (q: string) => void; children: ReactNode }) {
  const auth = useNearAuth();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [local, setLocal] = useState("");
  const q = onQuery ? query || "" : local;
  const setQuery = (v: string) => onQuery ? onQuery(v) : setLocal(v);
  let navIndex = 0;
  return <div className="reference"><div className="shell">
    <aside className={`side ${menu ? "mobile-open" : ""}`} aria-label="Main navigation"><div className="rail-top"><Link className="rail-logo" href="/marketplace" aria-label="Kalis"><span>K</span><b>Kalis</b></Link><label className="rail-search" htmlFor="q">{icon("search")}<span className="sr">Search methods</span><input id="q" type="search" value={q} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !onQuery) router.push(`/marketplace?q=${encodeURIComponent(q)}`); }} placeholder="Search methods"/></label></div><div className="rail-navigation">{groups.map(([name, description, links]) => <nav className="group" aria-label={name} key={name}><div className="gh"><b>{name}</b><span>{description}</span></div>{links.map(([label,href]) => <Link className={`nav ${label === active ? "active" : ""}`} href={href} key={label} aria-label={label} title={label} aria-current={label === active ? "page" : undefined}>{icon(navIcons[navIndex++])}{label}</Link>)}</nav>)}</div><div className="rail-bottom"><Link className="rail-control" href="/activity" title="Notifications" aria-label="Notifications">{icon("bell")}<span>Notifications</span></Link><div className="rail-control rail-network" title="NEAR testnet" aria-label="Current network NEAR testnet">{icon("globe")}<span>NEAR testnet</span></div>{auth.session ? <button className="rail-control rail-wallet on" onClick={auth.signOut} title={`Signed in as ${auth.session.account_id}. Click to sign out.`} aria-label={`Signed in as ${auth.session.account_id}. Sign out`}>{icon("wallet")}<span>{auth.session.account_id}</span></button> : <button className="rail-control rail-wallet" onClick={auth.signIn} disabled={auth.busy} title={auth.error ? `Sign in failed. ${auth.error}` : "Sign in with NEAR"} aria-label="Sign in with NEAR">{icon("wallet")}<span>{auth.busy ? "Waiting for wallet" : "Sign in with NEAR"}</span></button>}</div></aside>
    <div className="main"><button className="mobile-nav-toggle" aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{icon("store")}</button>
    <main className="content">{children}</main></div></div></div>;
}
