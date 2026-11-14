import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, fontFamily, shadow } from "./style";

export const F = (sec: number) => Math.round(sec * 30);
// Frame where cue i starts (plus an optional offset in seconds).
export const cueAt = (cues: readonly { from: number }[], i: number, off = 0) => F(cues[Math.min(i, cues.length - 1)].from + off);

export const useSpring = (at: number, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping } });
};
export const enterStyle = (p: number, dy = 24): React.CSSProperties => ({ opacity: p, transform: `translateY(${(1 - p) * dy}px)` });
// Visible between two frames with short fades at both ends.
export const useWindow = (from: number, to: number, fade = 8) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, from + fade, to - fade, to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

export const Grid = () => (
  <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: "32px 32px", opacity: 0.55 }} />
);
export const Card = ({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) => (
  <div style={{ position: "absolute", background: C.card, borderRadius: 18, padding: 8, boxShadow: shadow, border: `1px solid ${C.line}`, fontFamily, ...style }}>{children}</div>
);
export const Panel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.bg, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 12, ...style }}>{children}</div>
);
export const Head = ({ icon, title, sub, dark }: { icon: React.ReactNode; title: string; sub?: string; dark?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px" }}>
    <div style={{ width: 60, height: 60, borderRadius: 16, background: dark ? C.ink : C.card, border: `1px solid ${C.line}`, display: "grid", placeItems: "center", color: dark ? "#fff" : C.ink }}>{icon}</div>
    <div><div style={{ fontWeight: 800, fontSize: 32, color: C.ink }}>{title}</div>{sub && <div style={{ fontWeight: 600, fontSize: 21, color: C.ink2 }}>{sub}</div>}</div>
  </div>
);
type Tone = "ink" | "blue" | "orange" | "yellow" | "white";
const tones: Record<Tone, [string, string]> = { ink: [C.ink, "#fff"], blue: [C.blue, "#fff"], orange: [C.orange, "#fff"], yellow: [C.yellow, C.ink], white: ["#fff", C.ink] };
export const Chip = ({ children, tone = "ink", style }: { children: React.ReactNode; tone?: Tone; style?: React.CSSProperties }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, fontWeight: 700, fontSize: 22, background: tones[tone][0], color: tones[tone][1], border: tone === "white" ? `1px solid ${C.line}` : "none", alignSelf: "flex-start", fontFamily, ...style }}>{children}</span>
);
export const Row = ({ label, value, blur = 0, right }: { label: string; value?: string; blur?: number; right?: React.ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "14px 18px", border: `1px solid ${C.line}`, borderRadius: 12, background: "#fff" }}>
    <span style={{ fontWeight: 600, fontSize: 23, color: C.ink2 }}>{label}</span>
    {right ?? <span style={{ fontWeight: 800, fontSize: 24, color: C.ink, filter: `blur(${blur}px)` }}>{value}</span>}
  </div>
);
export const Title = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ position: "absolute", fontFamily, fontWeight: 800, fontSize: 56, letterSpacing: "-0.02em", color: C.ink, ...style }}>{children}</div>
);
// A real page of the live app inside a browser frame, slowly scrolled like a screen recording.
export const Screen = ({ src, url, from, to, scroll = 400, style }: { src: string; url: string; from: number; to: number; scroll?: number; style?: React.CSSProperties }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [from, to], [0, -scroll], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", background: "#fff", borderRadius: 18, boxShadow: shadow, border: `1px solid ${C.line}`, overflow: "hidden", fontFamily, ...style }}>
      <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: `1px solid ${C.line}`, background: "#FAFAFA" }}>
        {["#E4E4E7", "#E4E4E7", "#E4E4E7"].map((c, i) => <span key={i} style={{ width: 14, height: 14, borderRadius: 999, background: c }} />)}
        <span style={{ marginLeft: 14, padding: "6px 16px", borderRadius: 999, background: "#fff", border: `1px solid ${C.line}`, fontWeight: 600, fontSize: 20, color: C.ink2 }}>{url}</span>
      </div>
      <div style={{ position: "relative", height: "calc(100% - 52px)", overflow: "hidden" }}>
        <Img src={staticFile(src)} style={{ width: "100%", transform: `translateY(${y}px)` }} />
      </div>
    </div>
  );
};
export const Arrow = ({ style, p = 1 }: { style?: React.CSSProperties; p?: number }) => (
  <svg width="90" height="30" viewBox="0 0 90 30" style={{ position: "absolute", opacity: p, ...style }}>
    <path d={`M4 15 H${4 + 74 * p}`} stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
    {p > 0.95 && <path d="M70 5 L82 15 L70 25" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);
