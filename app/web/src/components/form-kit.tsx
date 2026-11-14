"use client";
// Shared pieces of the step form style first built for the method editor (`.se-*` classes in reference.css).
import type { ReactNode } from "react";
import { icon } from "./shell";

export function Fx({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return <label className="se-fx"><span className="se-fx-l">{label}</span>{children}{hint && <span className="se-fx-h">{hint}</span>}</label>;
}

export type RailStep = { id: string; title: string; hint: string };
/** Left step rail with numbered status dots. `done` and `bad` mark finished and failing steps. */
export function StepRail({ steps, current, done = {}, bad = {}, disabled = {}, onPick, label, extra }: { steps: RailStep[]; current: string; done?: Record<string, boolean>; bad?: Record<string, boolean>; disabled?: Record<string, boolean>; onPick: (id: string) => void; label: string; extra?: ReactNode }) {
  return <nav className="se-steps" aria-label={label}>{steps.map((s, i) => {
    const isBad = !!bad[s.id]; const isDone = !!done[s.id] && !isBad;
    return <button key={s.id} type="button" disabled={!!disabled[s.id]} aria-current={current === s.id ? "step" : undefined} className={`se-step ${current === s.id ? "on" : ""} ${isBad ? "bad" : isDone ? "ok" : ""}`} onClick={() => onPick(s.id)}>
      <span className="se-dot">{isDone ? icon("check") : i + 1}</span><span className="se-step-t"><b>{s.title}</b><span>{isBad ? "Needs a fix" : s.hint}</span></span>
    </button>;
  })}{extra}</nav>;
}

export function Msg({ error, text }: { error?: string; text?: string }) {
  if (!error && !text) return null;
  return <div className={`se-msg ${error ? "bad" : ""}`} role={error ? "alert" : "status"}>{icon(error ? "info" : "check")}<span>{error || text}</span></div>;
}
