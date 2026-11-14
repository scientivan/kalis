import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, fontFamily } from "./style";

export type Cue = { from: number; to: number; text: string };
// Black caption box centred at the bottom, like the reference pitch video. Times are seconds.
export const Caption = ({ cues }: { cues: Cue[] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = cues.find(c => t >= c.from && t < c.to);
  if (!cue) return null;
  const local = (t - cue.from) * fps;
  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 84, display: "flex", justifyContent: "center", opacity }}>
      <div style={{ background: C.ink, color: "#fff", fontFamily, fontWeight: 700, fontSize: 34, lineHeight: 1.3, padding: "16px 22px", borderRadius: 10, maxWidth: 1180, textAlign: "center" }}>{cue.text}</div>
    </div>
  );
};
