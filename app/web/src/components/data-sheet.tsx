"use client";
// Buyer data as a compact sheet: one row per value, label on the left, input on the right.
// Private values carry a lock inside the input, units sit as a suffix, and numbers show thousand separators
// while not being edited. Values stay plain strings or plain data, exactly as the run page validates them.
import { useState, type ReactNode } from "react";
import { icon } from "./shell";

export type SheetField = { id: string; label: string; type?: string; unit?: string; required?: boolean; private?: boolean; help?: string; enum?: (string | number | boolean)[] };
const NUMERIC = ["number", "integer", "money", "percent"];
const pretty = (raw: string) => { const n = Number(raw); return raw.trim() !== "" && Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 8 }) : raw; };

/** One row. `value` is the raw text the user typed (numbers as plain digits). */
export function SheetRow({ field, value, onChange }: { field: SheetField; value: string; onChange: (raw: string) => void }) {
  const [editing, setEditing] = useState(false);
  const numeric = NUMERIC.includes(field.type || "");
  const unit = field.type === "percent" ? "%" : field.unit;
  // Short units (USD, %, IDR) sit inside the input; long ones ("IDR per month") go under the label so the value stays readable.
  const suffix = unit && unit.length <= 4 ? unit : "";
  const unitNote = unit && !suffix ? unit : "";
  const hint = [field.help, field.type === "array" ? "Separate values with commas." : ""].filter(Boolean).join(" ");
  let control: ReactNode;
  if (field.type === "boolean" || field.enum) {
    const opts = field.type === "boolean" ? [["true", "Yes"], ["false", "No"]] : (field.enum || []).map(o => [String(o), String(o).charAt(0).toUpperCase() + String(o).slice(1)]);
    control = <div className="ds-seg" role="radiogroup" aria-label={field.label}>{opts.map(([v, l]) => <button type="button" key={v} role="radio" aria-checked={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}</div>;
  } else if (field.type === "text") {
    control = <textarea className="ds-in" rows={2} value={value} onChange={e => onChange(e.target.value)} aria-label={field.label} />;
  } else {
    control = <span className={`ds-box ${field.private ? "priv" : ""}`}>
      {field.private && <span className="ds-lock" title="Private. Sealed on this device and never shown to the expert.">{icon("lock")}</span>}
      <input className={numeric ? "num" : ""} aria-label={field.label} inputMode={numeric ? "decimal" : "text"} value={numeric && !editing ? pretty(value) : value} onFocus={() => setEditing(true)} onBlur={() => setEditing(false)} onChange={e => onChange(numeric ? e.target.value.replace(/,/g, "") : e.target.value)} />
      {suffix && <span className="ds-unit">{suffix}</span>}
    </span>;
  }
  return <div className="ds-row" title={hint || undefined}>
    <span className="ds-l"><b>{field.label}</b>{(hint || unitNote || !field.required) && <span>{[unitNote ? `In ${unitNote}` : "", !field.required ? "Optional" : "", hint].filter(Boolean).join(". ")}</span>}</span>
    {control}
  </div>;
}

/** A titled group of rows inside one bordered sheet. */
export function Sheet({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return <section className="ds-sheet"><header><b>{title}</b>{note && <span>{note}</span>}</header><div className="ds-rows">{children}</div></section>;
}
