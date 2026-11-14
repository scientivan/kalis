"use client";
// Shared card grid built from the approved Marketplace card (.mcard): icon top left, status chip top right,
// bold title, up to two lines of text, a divided meta line and a footer with one main figure and one action.
// Every list page uses this one grid (auto-fill, 270px minimum), so no page has its own breakpoints.
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { icon } from "./shell";

const IDS = ["tender-bid", "portfolio-rebalance", "salary-counteroffer", "cash-runway-13w", "defi-liquidation-guard", "token-unlock-sell-plan", "supplier-concession-plan", "term-sheet-dilution", "perp-risk-limit-fit", "token-scam-screen", "large-swap-split", "strategy-robustness-audit"];
// ryux-ignore RX-DS-03: method identity palette copied from the approved Marketplace card (marketplace-next.tsx)
const COLORS = ["#FF5F04", "#0038FF", "#FF77CD", "#FEE897", "#9FA9F5", "#F44A32", "#FF5F04", "#FEE897", "#0038FF", "#F44A32", "#9FA9F5", "#FF77CD"];
const ICONS = ["m-doc", "m-chart", "m-person", "m-cash", "m-shield", "m-rocket", "m-hand", "m-pie", "m-shield", "m-shield", "m-chart", "m-pie"];
/** Same colour and picture a method has in the Marketplace, so a job is recognisable at a glance. */
export function methodIdentity(id?: string | null) {
  const i = Math.max(0, IDS.indexOf(id || ""));
  const color = COLORS[i];
  return { color, ink: ["#FEE897", "#9FA9F5", "#FF77CD"].includes(color) ? "#101010" : "#fff", icon: ICONS[i] };
}

export function TileGrid({ label, children }: { label: string; children: ReactNode }) {
  return <div className="mcards tgrid" role="list" aria-label={label}>{children}</div>;
}

export function TileIcon({ name, color = "#0038FF", ink = "#fff" }: { name: string; color?: string; ink?: string }) {
  return <span className="mcard-icon tile-icon" style={{ background: color, color: ink }}>{icon(name)}</span>;
}

export function Chip({ tone, children }: { tone?: "blue" | "warn" | "pink" | "grey" | "orange"; children: ReactNode }) {
  return <span className={`kchip tchip ${tone ? `is-${tone}` : ""}`}><i aria-hidden="true" />{children}</span>;
}

export function Tile({ iconNode, chip, title, href, desc, meta, foot, children, className = "" }: {
  iconNode: ReactNode; chip?: ReactNode; title: ReactNode; href?: string; desc?: ReactNode; meta?: ReactNode[]; foot?: ReactNode; children?: ReactNode; className?: string;
}) {
  const shownMeta = (meta || []).filter(Boolean);
  return <article className={`mcard tile ${className}`} role="listitem">
    <div className="mcard-top">{iconNode}{chip}</div>
    <h3>{href ? <Link href={href}>{title}</Link> : title}</h3>
    {desc && <p className="mcard-desc">{desc}</p>}
    {children}
    {!!shownMeta.length && <div className="mcard-meta">{shownMeta.map((m, i) => <span key={i}>{m}</span>)}</div>}
    {foot && <div className="mcard-foot">{foot}</div>}
  </article>;
}

export function AddTile({ title, desc, href, onClick, disabled }: { title: string; desc: string; href?: string; onClick?: () => void; disabled?: boolean }) {
  const inner = <><span className="add-plus" aria-hidden="true">{icon("plus")}</span><b>{title}</b><span>{desc}</span></>;
  return <div role="listitem" className="add-cell">{href ? <Link className="mcard add-tile" href={href}>{inner}</Link> : <button type="button" className="mcard add-tile" onClick={onClick} disabled={disabled}>{inner}</button>}</div>;
}

export function SkeletonTiles({ count = 4 }: { count?: number }) {
  return <>{Array.from({ length: count }, (_, i) => <div className="mcard tile-skeleton" role="listitem" aria-hidden="true" key={i}><span /><span /><span /><span /></div>)}<span className="sr" role="status">Loading</span></>;
}

/** Grey panel with the message first and the button under it (FRONTEND_GUIDE.md section 10). */
export function StatePanel({ tone = "empty", title, text, action }: { tone?: "empty" | "error"; title: string; text?: string; action?: ReactNode }) {
  return <div className={`state-panel ${tone === "error" ? "is-error" : ""}`} role={tone === "error" ? "alert" : undefined}>
    {icon(tone === "error" ? "info" : "spark")}<div><b>{title}</b>{text && <p>{text}</p>}{action && <div className="state-action">{action}</div>}</div>
  </div>;
}

export function ErrorPanel({ message, onRetry, title = "We could not load this" }: { message: string; onRetry: () => void; title?: string }) {
  return <StatePanel tone="error" title={title} text={message} action={<button className="view" onClick={onRetry}>Try again</button>} />;
}

/** Step track for a job: one segment per manifest step. Done segments are blue, a failed one is red. */
export function StepTrack({ total, done, failed, label }: { total: number; done: number; failed?: boolean; label: string }) {
  if (!total) return <div className="step-track-note">{label}</div>;
  return <div className="step-track" aria-label={label} role="img">
    <div className="step-bars">{Array.from({ length: total }, (_, i) => <i key={i} className={i < done ? "on" : failed && i === done ? "bad" : ""} />)}</div>
    <span>{label}</span>
  </div>;
}

export type DayLine = { id: string; at?: string; icon: string; text: ReactNode; aside?: ReactNode };
const dayKey = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-CA") : "unknown";
function dayTitle(key: string) {
  if (key === "unknown") return "Date not recorded";
  const today = new Date().toLocaleDateString("en-CA");
  const y = new Date(Date.now() - 864e5).toLocaleDateString("en-CA");
  const d = new Date(key + "T12:00:00");
  const long = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
  return key === today ? `Today, ${long.split(" ").slice(1).join(" ")}` : key === y ? `Yesterday, ${long.split(" ").slice(1).join(" ")}` : long;
}
/** One compact card per day. Long days show their first lines and open the rest on request. */
export function DayCards({ lines, unit, label }: { lines: DayLine[]; unit: [string, string]; label: string }) {
  const groups: { key: string; items: DayLine[] }[] = [];
  for (const l of lines) { const k = dayKey(l.at); const g = groups.find(x => x.key === k); if (g) g.items.push(l); else groups.push({ key: k, items: [l] }); }
  return <TileGrid label={label}>{groups.map(g => <DayCard key={g.key} title={dayTitle(g.key)} items={g.items} unit={unit} wide={g.items.length > 6 && groups.length === 1 ? "full" : g.items.length > 8 && groups.length < 4 ? "wide" : ""} />)}</TileGrid>;
}
function DayCard({ title, items, unit, wide }: { title: string; items: DayLine[]; unit: [string, string]; wide: string }) {
  const [all, setAll] = useState(false);
  const limit = wide === "full" ? 18 : wide ? 12 : 6;
  const shown = all ? items : items.slice(0, limit);
  return <Tile className={`day-card ${wide ? `is-${wide}` : ""}`} iconNode={<TileIcon name="clock" />} chip={<Chip>{items.length} {items.length === 1 ? unit[0] : unit[1]}</Chip>} title={title}
    foot={items.length > limit ? <><span className="foot-left">{all ? `Showing all ${items.length}` : `Showing ${limit} of ${items.length}`}</span><button className="view" onClick={() => setAll(!all)}>{all ? "Show fewer" : "Show all"}</button></> : undefined}>
    <ul className="day-lines">{shown.map(l => <li key={l.id}>{icon(l.icon)}<span className="line-t" title={typeof l.text === "string" ? l.text : undefined}>{l.text}</span><em>{l.aside}{l.at ? `${l.aside ? ", " : ""}${new Date(l.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}</em></li>)}</ul>
  </Tile>;
}

export function Summary({ cells }: { cells: [string, ReactNode][] }) {
  return <div className="sum-row">{cells.map(([k, v]) => <div className="sum-cell" key={k}><small>{k}</small><b>{v}</b></div>)}</div>;
}
