"use client";
// Shared app shell: the capsule icon rail (Kalis mark, search, navigation, notifications, network, wallet).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useNearAuth } from "../lib/near/auth";
import { Dropdown } from "./controls";
import "./reference.css";
type NavParent = { label: string; icon: string; items: { label: string; href: string; active: string }[] };
const shared: NavParent[] = [
  { label: "Community", icon: "people", items: [{ label: "Fund", href: "/community", active: "Fund" }, { label: "Proposals", href: "/community/proposals", active: "Proposals" }, { label: "Bounties", href: "/community/bounties", active: "Bounties" }, { label: "Issues", href: "/community/issues", active: "Issues" }] },
  { label: "Activity", icon: "pulse", items: [{ label: "History", href: "/activity", active: "Activity" }] },
];
const navigation: Record<string, NavParent[]> = {
  Consumer: [
    { label: "Marketplace", icon: "store", items: [{ label: "Methods", href: "/marketplace", active: "Marketplace" }] },
    { label: "Jobs", icon: "play", items: [{ label: "Ongoing", href: "/runs/ongoing", active: "Ongoing" }, { label: "Results", href: "/runs/results", active: "Results" }] },
    { label: "Data", icon: "link", items: [{ label: "Connections", href: "/connections", active: "Connections" }, { label: "Documents", href: "/workspace/files", active: "Documents" }, { label: "Notes", href: "/workspace/memory", active: "Notes" }] }, ...shared,
  ],
  Author: [
    { label: "Methods", icon: "tag", items: [{ label: "Drafts", href: "/marketplace/publish", active: "Drafts" }, { label: "Published", href: "/marketplace/mine", active: "Published" }] }, ...shared,
  ],
};
export const icon = (name: string, cls = "i") => <svg className={cls} aria-hidden="true"><use href={`/marketplace-icons.svg#${name}`}/></svg>;

export function AppShell({ active, query, onQuery, children }: { active: string; query?: string; onQuery?: (q: string) => void; children: ReactNode }) {
  const auth = useNearAuth();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [local, setLocal] = useState("");
  const q = onQuery ? query || "" : local;
  const setQuery = (v: string) => onQuery ? onQuery(v) : setLocal(v);
  const [role, setRole] = useState("Consumer");
  useEffect(() => {
    const saved = sessionStorage.getItem("kalis-navigation-role");
    setRole(["Drafts", "Published"].includes(active) ? "Author" : saved === "Author" ? "Author" : "Consumer");
  }, [active]);
  const changeRole = (value: string) => {
    setRole(value);
    sessionStorage.setItem("kalis-navigation-role", value);
  };
  return <div className="reference"><div className="shell">
    <aside className={`side ${menu ? "mobile-open" : ""}`} aria-label="Main navigation"><div className="rail-top"><Link className="rail-logo" href="/marketplace" aria-label="Kalis"><span>K</span><b>Kalis</b></Link><label className="rail-search" htmlFor="q">{icon("search")}<span className="sr">Search methods</span><input id="q" type="search" value={q} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !onQuery) router.push(`/marketplace?q=${encodeURIComponent(q)}`); }} placeholder="Search methods"/></label></div><div className="role-picker"><span className="role-symbol" title={role} aria-hidden="true">{role === "Author" ? icon("tag") : icon("user")}</span><Dropdown label="Role" value={role} options={[{value:"Consumer",label:"Consumer"},{value:"Author",label:"Author"}]} onChange={changeRole}/></div><nav className="rail-navigation hierarchy" aria-label={`${role} navigation`} key={role}>{navigation[role].map(parent => <section className="nav-parent" key={`${parent.label}-${active}`} aria-label={parent.label}><div className={`nav parent-control ${parent.items.some(item => item.active === active) ? "active" : ""}`} title={parent.label} aria-label={parent.label}>{icon(parent.icon)}<span>{parent.label}</span></div><div className="nav-children">{parent.items.map(item => <Link className={`child-link ${item.active === active ? "active" : ""}`} key={item.href} href={item.href} aria-current={item.active === active ? "page" : undefined}>{item.label}</Link>)}</div></section>)}<Link className="rail-control" href="/activity" title="Notifications" aria-label="Notifications">{icon("bell")}<span>Notifications</span></Link></nav><div className="rail-bottom"><div className="rail-control rail-network" title="NEAR testnet" aria-label="Current network NEAR testnet">{icon("globe")}<span className="network-label"><strong>NEAR testnet</strong><small>Chain ID · testnet</small></span></div>{auth.session ? <details className="wallet-account"><summary className="rail-control rail-wallet on" title={`Connected as ${auth.session.account_id}`} aria-label={`Connected as ${auth.session.account_id}. Open account menu`}>{icon("wallet")}<span className="wallet-label"><strong>Connected</strong><small>{auth.session.account_id}</small></span><i className="connected-dot" aria-hidden="true"/></summary><div className="wallet-account-menu"><p>Connected account</p><strong>{auth.session.account_id}</strong><Link href="/account">Account</Link><button onClick={() => { void auth.signOut(); }}>Sign out</button></div></details> : <button className="rail-control rail-wallet" onClick={auth.signIn} disabled={auth.busy} title={auth.error ? `Sign in failed. ${auth.error}` : "Sign in with NEAR"} aria-label="Sign in with NEAR">{icon("wallet")}<span>{auth.busy ? "Waiting for wallet" : "Sign in with NEAR"}</span></button>}</div></aside>
    <div className="main"><button className="mobile-nav-toggle" aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{icon("store")}</button>
    <main className="content">{children}</main></div></div></div>;
}
