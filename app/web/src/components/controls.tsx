"use client";
// Shared controls in the segmented style: a sliding segmented switch, a dropdown that matches it,
// and a page info popover that packages a page's one-line explanation.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function Segmented({ options, value, onChange, label }: { options: string[]; value: string; onChange: (v: string) => void; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const el = track.current?.querySelector<HTMLButtonElement>(`[data-v="${CSS.escape(value)}"]`);
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, options]);
  return <div className="seg2" role="radiogroup" aria-label={label} ref={track}>
    <span className="seg2-pill" aria-hidden="true" style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} />
    {options.map(o => <button key={o} data-v={o} role="radio" aria-checked={value === o} className={value === o ? "on" : ""} onClick={() => onChange(o)}>{o}</button>)}
  </div>;
}

export function Dropdown({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value) || options[0];
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const pick = (v: string) => { onChange(v); setOpen(false); };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(Math.max(0, options.indexOf(current))); return; }
      setActive(a => (a + (e.key === "ArrowDown" ? 1 : options.length - 1)) % options.length);
    }
    if ((e.key === "Enter" || e.key === " ") && open) { e.preventDefault(); pick(options[active].value); }
  };
  return <div className={`dd ${open ? "open" : ""}`} ref={root} onKeyDown={key}>
    <button className="dd-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen(!open); setActive(Math.max(0, options.indexOf(current))); }}>
      <span className="dd-label">{label}</span><span className="dd-value" key={current.value}>{current.label}</span>
      <svg className="dd-chev" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 5.5 7 9l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    <ul className="dd-menu" role="listbox" aria-label={label} hidden={!open}>
      {options.map((o, i) => <li key={o.value} role="option" aria-selected={o.value === value} className={`${o.value === value ? "on" : ""} ${i === active ? "act" : ""}`} onMouseEnter={() => setActive(i)} onClick={() => pick(o.value)}>{o.label}</li>)}
    </ul>
  </div>;
}

export function PageInfo({ title, points }: { title: string; points: { icon: ReactNode; text: string }[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return <div className={`pinfo ${open ? "open" : ""}`} ref={root}>
    <button className="pinfo-btn" aria-expanded={open} aria-label="How it works" title="How it works" onClick={() => setOpen(!open)}>
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7.2v3.6M8 5.1v.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
    </button>
    <div className="pinfo-pop" role="dialog" aria-label={title} hidden={!open}>
      <b>{title}</b>
      {points.map((p, i) => <div className="pinfo-row" key={i} style={{ "--i": i } as React.CSSProperties}><span className="pinfo-ic">{p.icon}</span><span>{p.text}</span></div>)}
    </div>
  </div>;
}
