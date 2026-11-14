"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode, type FormEvent } from "react";
import { useMock, newId } from "../lib/store";
import {
  money,
  type Method,
  type Run,
  type Scenario,
  type RouteModel,
  type Bounty,
} from "../lib/domain";
import {
  Form,
  Field,
  Check,
  Facts,
  Panel,
  Heading,
  Go,
  Empty,
  Status,
  Cover,
  Rating,
  Tabs,
  workspaceTabs,
  communityTabs,
  FormValues,
} from "./ui";
import { Workspace, RunPage } from "./workspace";
import { Marketplace } from "./marketplace";
import { Community } from "./community";
import { Balance, Activity } from "./balance";
import { Settings } from "./settings";
import { Onboarding } from "./protections";
import { Connected } from "./connected";
import { BackendPages } from "./backend-pages";

export function KalisApp() {
  const { state, ready, error, clearError } = useMock();
  const path = usePathname() || "/workspace";
  const [search, setSearch] = useState("");
  const [backendMode, setBackendMode] = useState(true);
  const base = path.split("/")[1] || "workspace";
  if (!ready)
    return (
      <main className="recovery" role="status">
        Loading your mock workspace…
      </main>
    );
  if (!state.onboarded && !backendMode) return <Onboarding />;
  return (
    <div className="production-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <Link className="brand" href="/workspace">
          <span className="kalis-logo-mark"><svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true" focusable="false"><rect x="10" y="8" width="11" height="48" rx="3" fill="#101010"/><path d="M24 32 L44 9 L56 9 L36 32 Z" fill="#0038FF"/><path d="M24 32 L36 32 L56 55 L44 55 Z" fill="#0038FF"/><path d="M27 32.5 l3.2 3.4 l6.2-7.2" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Kalis
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {["Workspace", "Marketplace", "Community", "Activity", "Balance"].map(
            (n) => (
              <Link
                key={n}
                href={"/" + n.toLowerCase()}
                aria-current={base === n.toLowerCase() ? "page" : undefined}
              >
                {n}
              </Link>
            ),
          )}
        </nav>
        <details className="account-dropdown">
          <summary>{state.name}</summary>
          <nav aria-label="Your account">
            <Link href="/account">Account</Link>
            <Link href="/connections">Connections</Link>
            <Link href="/preferences">Permissions & preferences</Link>
          </nav>
        </details>
      </header>
      <div className="mock-banner">
        {backendMode || base === "connected"
          ? "Backend mode. Use synthetic data only. Testnet payments require explicit consent."
          : "Mock demo. Data and operations here are simulated."}{" "}
        <button
          className="button secondary small"
          onClick={() => setBackendMode(!backendMode)}
        >
          {backendMode ? "Switch to isolated mock demo" : "Use backend data"}
        </button>
      </div>
      <aside className="utility-rail" aria-label="Quick actions">
        <Link href="/marketplace" aria-label="Find a method">
          ⌕
        </Link>
        <Link href="/workspace/new" aria-label="New work">
          ＋
        </Link>
        <Link href="/workspace/files" aria-label="Files">
          ▤
        </Link>
      </aside>
      {!backendMode && (
        <div className="quick-search">
          <label htmlFor="global-search">Find work or methods</label>
          <input
            id="global-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Kalis"
          />
          {search && (
            <div className="search-results">
              {[
                ...state.methods.map((m) => ({
                  name: m.name,
                  url: "/marketplace/" + m.id,
                })),
                ...state.runs.map((r) => ({
                  name: r.name,
                  url: "/workspace/run/" + r.id,
                })),
              ]
                .filter((x) =>
                  x.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((x) => (
                  <Link href={x.url} key={x.url} onClick={() => setSearch("")}>
                    {x.name}
                  </Link>
                ))}
            </div>
          )}
        </div>
      )}
      <main id="main" tabIndex={-1}>
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button
              type="button"
              onClick={clearError}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}
        {backendMode && base !== "connected" ? (
          <BackendPages path={path} />
        ) : (
          <Screen path={path} />
        )}
      </main>
      <footer className="app-footer">
        <span>Next.js application</span>
        <span>
          {backendMode
            ? "Backend workspace / testnet"
            : "Mock data stays in this browser"}
        </span>
        <Link href="/preferences">Reset or inspect demo data</Link>
      </footer>
    </div>
  );
}
function Screen({ path }: { path: string }) {
  const p = path.split("/").filter(Boolean);
  if (p[0] === "connected") return <Connected section={p[1] || "methods"} />;
  if (!p.length || p[0] === "workspace") {
    if (p[1] === "run") return <RunPage id={p[2]} />;
    return <Workspace section={p[1]} />;
  }
  if (p[0] === "marketplace") return <Marketplace parts={p.slice(1)} />;
  if (p[0] === "community") return <Community parts={p.slice(1)} />;
  if (p[0] === "balance") return <Balance parts={p.slice(1)} />;
  if (p[0] === "activity") return <Activity />;
  if (["account", "connections", "preferences"].includes(p[0]))
    return <Settings page={p[0]} />;
  return (
    <>
      <Heading title="Page not found" />
      <Go to="/workspace">Back to workspace</Go>
    </>
  );
}
