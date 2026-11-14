import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Copy, Lock, User, Users, X } from "lucide-react";
import { C, fontFamily, shadow } from "../lib/style";
import { Caption } from "../lib/Caption";
import { VO } from "../vo-data";
import { KMark } from "../lib/KMark";

// Scene 1. Two sides of the problem. Arif (author) cannot sell his strategy without it being copied,
// Sari (consumer) cannot use expertise without exposing her portfolio. The dashed line between them
// closes into the Kalis mark at "Until now", which is the bridge into scene 2.
const CUES = VO.scene1.cues;
// Beats follow the voiceover sentences (cue starts), so retiming the voice retimes the scene.
const s = (t: number) => {
  const c = CUES.map(x => x.from);
  const old = [0, 4.72, 9.29, 15.85, 18.59];
  let i = old.length - 1; while (i > 0 && t < old[i]) i--;
  return Math.round((c[i] + (t - old[i]) * 0.8) * 30);
};
const useEnter = (at: number, dy = 24) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 200 } });
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` };
};

const Tile = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ width: 64, height: 64, borderRadius: 16, background: dark ? C.ink : C.card, border: `1px solid ${C.line}`, display: "grid", placeItems: "center", boxShadow: shadow }}>{children}</div>
);
const Chip = ({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "orange" | "blue" }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, fontWeight: 700, fontSize: 22, background: tone === "ink" ? C.ink : tone === "orange" ? C.orange : C.blue, color: "#fff" }}>{children}</span>
);
const Row = ({ label, value, blur = 0 }: { label: string; value: string; blur?: number }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", border: `1px solid ${C.line}`, borderRadius: 12, background: "#fff" }}>
    <span style={{ fontWeight: 600, fontSize: 24, color: C.ink2 }}>{label}</span>
    <span style={{ fontWeight: 800, fontSize: 26, color: C.ink, filter: `blur(${blur}px)` }}>{value}</span>
  </div>
);

const Person = ({ name, role, dark }: { name: string; role: string; dark?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
    <Tile dark={dark}><User size={34} color={dark ? "#fff" : C.ink} /></Tile>
    <div>
      <div style={{ fontWeight: 800, fontSize: 36, color: C.ink }}>{name}</div>
      <div style={{ fontWeight: 600, fontSize: 22, color: C.ink2 }}>{role}</div>
    </div>
  </div>
);

export const Scene1 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arif = useEnter(6);
  const copyAt = s(4.9);
  const sari = useEnter(s(9.3));
  const meet = s(15.9);
  const until = s(18.6);

  const copies = [0, 1, 2].map(i => spring({ frame: frame - copyAt - i * 8, fps, config: { damping: 200 } }));
  const copyLabel = useEnter(copyAt + 30);
  const strangerLabel = useEnter(s(11.6));
  const stranger = spring({ frame: frame - s(10.6), fps, config: { damping: 200 } });

  // Dashed line appears, then the gap closes and the cards make room for the mark.
  const line = interpolate(frame, [meet, meet + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const close = spring({ frame: frame - until, fps, config: { damping: 200 } });
  const gap = interpolate(close, [0, 1], [120, 0]);
  const sideFade = interpolate(frame, [meet, meet + 12], [1, 0.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mark = spring({ frame: frame - until - 6, fps, config: { damping: 14 } });

  const card = { position: "absolute" as const, top: 150, width: 720, background: C.card, borderRadius: 18, padding: 8, boxShadow: shadow, border: `1px solid ${C.line}` };
  const panel = { background: C.bg, borderRadius: 12, padding: 28, display: "flex", flexDirection: "column" as const, gap: 14 };

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      {/* Clean 32 px cell grid texture, as in the approved Kalis direction. */}
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: "32px 32px", opacity: 0.55 }} />
      <Audio src={staticFile("vo/scene1.mp3")} />

      {/* Arif, the author */}
      <div style={{ ...card, left: 120, ...arif }}>
        <div style={{ padding: "22px 24px" }}><Person name="Arif" role="Strategy author" dark /></div>
        <div style={panel}>
          <div style={{ fontWeight: 700, fontSize: 24, color: C.ink }}>Rebalancing strategy</div>
          <Row label="Rule 1" value="Trim any asset 3% over target" blur={0} />
          <Row label="Rule 2" value="Skip trades under 2x the fee" blur={0} />
          <Row label="Rule 3" value="Keep 5% cash before buying" blur={0} />
          <div style={{ marginTop: 6, ...copyLabel }}><Chip tone="orange"><Copy size={22} />Sell it and lose it.</Chip></div>
        </div>
      </div>

      {/* Copies of Arif's rules flying away to anyone */}
      {copies.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: 120 + 520 + i * 70, top: 230 + i * 120, opacity: p * interpolate(frame, [s(8.6), s(9.2)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), transform: `translate(${p * 160}px, ${-p * 30}px) rotate(${(i - 1) * 4}deg)`, background: C.card, border: `1px dashed ${C.orange}`, borderRadius: 14, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center", boxShadow: shadow }}>
          <Users size={26} color={C.orange} />
          <span style={{ fontWeight: 700, fontSize: 22, color: C.ink }}>Copied rules</span>
        </div>
      ))}

      {/* Sari, the portfolio owner */}
      <div style={{ ...card, left: 1080, ...sari }}>
        <div style={{ padding: "22px 24px" }}><Person name="Sari" role="Portfolio owner" /></div>
        <div style={panel}>
          <div style={{ fontWeight: 700, fontSize: 24, color: C.ink, display: "flex", alignItems: "center", gap: 10 }}><Lock size={24} color={C.blue} />My portfolio</div>
          <Row label="Balance" value="$84,200" blur={interpolate(frame, [s(11), s(12)], [0, 9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          <Row label="Positions" value="7 assets, 3 accounts" blur={interpolate(frame, [s(11.2), s(12.2)], [0, 9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          <Row label="Risk limit" value="12% per asset" blur={interpolate(frame, [s(11.4), s(12.4)], [0, 9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          <div style={{ marginTop: 6, ...strangerLabel }}><Chip tone="blue"><Lock size={22} />Use it and expose yourself.</Chip></div>
        </div>
      </div>

      {/* A stranger asking for Sari's data, refused */}
      <div style={{ position: "absolute", right: 70, top: 760, opacity: stranger * sideFade, transform: `translateY(${(1 - stranger) * 20}px)`, display: "flex", alignItems: "center", gap: 14, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 18px", boxShadow: shadow }}>
        <Tile><User size={30} color={C.ink2} /></Tile>
        <span style={{ fontWeight: 700, fontSize: 22, color: C.ink }}>A stranger wants her data</span>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: C.ink, display: "grid", placeItems: "center" }}><X size={24} color="#fff" /></div>
      </div>

      {/* The bridge. A dashed line that never connects, until the Kalis mark closes it. */}
      <div style={{ position: "absolute", left: 840, right: 840, top: 470, height: 0, opacity: line }}>
        <div style={{ position: "absolute", left: 0, width: `calc(50% - ${gap}px)`, borderTop: `4px ${close > 0.98 ? "solid" : "dashed"} ${C.ink}` }} />
        <div style={{ position: "absolute", right: 0, width: `calc(50% - ${gap}px)`, borderTop: `4px ${close > 0.98 ? "solid" : "dashed"} ${C.ink}` }} />
      </div>
      <div style={{ position: "absolute", left: 960 - 80, top: 470 - 80, width: 160, height: 160, borderRadius: 36, background: C.card, boxShadow: shadow, border: `1px solid ${C.line}`, display: "grid", placeItems: "center", opacity: mark, transform: `scale(${0.6 + 0.4 * mark})` }}>
        <KMark size={110} />
      </div>

      <Caption cues={CUES as any} />
    </AbsoluteFill>
  );
};
