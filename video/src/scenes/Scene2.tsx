import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { C, fontFamily, shadow } from "../lib/style";
import { Caption } from "../lib/Caption";
import { KMark } from "../lib/KMark";
import { Chip, Grid, Screen, cueAt, enterStyle, useSpring } from "../lib/kit";
import { VO } from "../vo-data";

// Scene 2. The mark from scene 1 opens into the live Marketplace (a short screen recording),
// with three promises appearing beside it. Ends by zooming toward the first card, into Sari's day.
const CUES = VO.scene2.cues;
export const Scene2 = () => {
  const frame = useCurrentFrame();
  const end = Math.round((VO.scene2.duration + 0.6) * 30);
  const logo = useSpring(0);
  const shrink = useSpring(cueAt(CUES, 0, 0.9));
  const screen = useSpring(cueAt(CUES, 0, 1.2));
  const promises = [1, 2, 3].map(i => useSpring(cueAt(CUES, i)));
  const zoom = interpolate(frame, [cueAt(CUES, 4), end], [1, 1.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      <Grid />
      <Audio src={staticFile("vo/scene2.mp3")} />
      <div style={{ position: "absolute", left: interpolate(shrink, [0, 1], [880, 96]), top: interpolate(shrink, [0, 1], [390, 64]), display: "flex", alignItems: "center", gap: 18, transform: `scale(${interpolate(shrink, [0, 1], [1, 0.55])})`, transformOrigin: "left top", opacity: logo }}>
        <div style={{ width: 160, height: 160, borderRadius: 36, background: C.card, boxShadow: shadow, border: `1px solid ${C.line}`, display: "grid", placeItems: "center" }}><KMark size={110} /></div>
        <span style={{ fontWeight: 800, fontSize: 96, color: C.ink, opacity: shrink }}>Kalis</span>
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "30% 30%" }}>
        <div style={{ ...enterStyle(screen, 40) }}>
          <Screen src="screens/marketplace.png" url="app.kalis.scientivan.dev/marketplace" from={cueAt(CUES, 0, 1.2)} to={end} scroll={260} style={{ left: 96, top: 190, width: 1180, height: 640 }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 1340, top: 260, display: "flex", flexDirection: "column", gap: 26 }}>
        {[["The expert's method stays secret", <Lock size={26} />, "ink"], ["The buyer's data stays private", <ShieldCheck size={26} />, "blue"], ["The result is still the best", <Sparkles size={26} />, "white"]].map(([t, ic, tone], i) => (
          <div key={i} style={{ ...enterStyle(promises[i]), background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 22, boxShadow: shadow, width: 480 }}>
            <Chip tone={tone as any}>{ic as any}</Chip>
            <div style={{ fontWeight: 800, fontSize: 30, color: C.ink, marginTop: 14, lineHeight: 1.2 }}>{t as string}</div>
          </div>
        ))}
      </div>
      <Caption cues={CUES as any} />
    </AbsoluteFill>
  );
};
