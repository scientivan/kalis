import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, fontFamily } from "./style";

export type Cue = { from: number; to: number; text: string };
// Black caption box at the lower left, like the reference pitch video. Times are seconds.
export const Caption = ({ cues }: { cues: Cue[] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = cues.find(c => t >= c.from && t < c.to);
  if (!cue) return null;
  const local = (t - cue.from) * fps;
  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 96, bottom: 84, maxWidth: 1180, opacity }}>
      <div style={{ background: C.ink, color: "#fff", fontFamily, fontWeight: 700, fontSize: 34, lineHeight: 1.3, padding: "16px 22px", borderRadius: 10 }}>{cue.text}</div>
    </div>
  );
};
