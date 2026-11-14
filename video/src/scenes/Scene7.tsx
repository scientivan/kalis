import { AbsoluteFill, Audio, staticFile } from "remotion";
import { C, fontFamily, shadow } from "../lib/style";
import { KMark } from "../lib/KMark";
import { Chip, Grid, cueAt, enterStyle, useSpring } from "../lib/kit";
import { VO } from "../vo-data";

// Scene 7. Close on the mark, the promise and where to try it.
const CUES = VO.scene7.cues;
export const Scene7 = () => {
  const a = useSpring(0, 16), b = useSpring(cueAt(CUES, 1)), c = useSpring(cueAt(CUES, 1, 1.4));
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, alignItems: "center", justifyContent: "center" }}>
      <Grid />
      <Audio src={staticFile("vo/scene7.mp3")} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28, ...enterStyle(a) }}>
          <div style={{ width: 170, height: 170, borderRadius: 38, background: C.card, boxShadow: shadow, border: `1px solid ${C.line}`, display: "grid", placeItems: "center" }}><KMark size={118} /></div>
          <span style={{ fontWeight: 800, fontSize: 120, color: C.ink, letterSpacing: "-0.03em" }}>Kalis</span>
        </div>
        <div style={{ fontWeight: 800, fontSize: 46, color: C.ink, ...enterStyle(b) }}>Expertise, traded privately and improved together.</div>
        <div style={{ display: "flex", gap: 16, ...enterStyle(c) }}>
          <Chip tone="blue">app.kalis.scientivan.dev</Chip><Chip tone="white">github.com/scientivan/kalis</Chip><Chip>Live on NEAR testnet</Chip>
        </div>
      </div>
    </AbsoluteFill>
  );
};
