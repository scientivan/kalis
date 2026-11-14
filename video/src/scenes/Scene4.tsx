import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Bell, Code2, Lock, Store, User } from "lucide-react";
import { C, fontFamily, shadow } from "../lib/style";
import { Caption } from "../lib/Caption";
import { Arrow, Card, Chip, Grid, Head, Panel, Row, Title, cueAt, enterStyle, useSpring } from "../lib/kit";
import { VO } from "../vo-data";

// Scene 4. Arif's side. Strategy becomes a sealed method published on NEAR, earns per use, and
// an issue from Sari arrives at the end, which is the bridge into the community scene.
const CUES = VO.scene4.cues;
const at = (i: number, off = 0) => cueAt(CUES, i, off);
export const Scene4 = () => {
  const frame = useCurrentFrame();
  const a = useSpring(4), code = useSpring(at(1)), seal = useSpring(at(1, 1.6)), pub = useSpring(at(1, 3.2));
  const earn = useSpring(at(2));
  const uses = Math.round(interpolate(frame, [at(2), at(3)], [9, 14], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const issue = useSpring(at(3, 0.4), 18);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      <Grid />
      <Audio src={staticFile("vo/scene4.mp3")} />
      <Title style={{ left: 96, top: 70, ...enterStyle(a) }}>Arif sells his method, never his rules</Title>
      <Card style={{ left: 96, top: 200, width: 560, ...enterStyle(code) }}>
        <Head icon={<Code2 size={30} />} title="Method editor" sub="Five guided steps" dark />
        <Panel>
          {["Describe the result", "Inputs and checks", "Code or prompt", "Price and DAO share"].map((t, i) => <Row key={i} label={`Step ${i + 1}`} value={t} />)}
          <div style={{ opacity: seal }}><Chip><Lock size={20} />Code sealed before upload</Chip></div>
        </Panel>
      </Card>
      <Arrow p={pub} style={{ left: 676, top: 430 }} />
      <Card style={{ left: 786, top: 230, width: 560, ...enterStyle(pub) }}>
        <Head icon={<Store size={30} />} title="Published on NEAR" sub="market.scientivan.testnet" />
        <Panel>
          <Row label="Price" value="0.1 NEAR per use" />
          <div style={{ display: "flex", height: 44, borderRadius: 10, overflow: "hidden", fontWeight: 800, fontSize: 20, color: "#fff" }}>
            <div style={{ flex: 80, background: C.ink, display: "grid", placeItems: "center" }}>Arif 80%</div>
            <div style={{ flex: 10, background: C.blue, display: "grid", placeItems: "center" }}>DAO</div>
            <div style={{ flex: 10, background: C.ink2, display: "grid", placeItems: "center" }}>10%</div>
          </div>
        </Panel>
      </Card>
      <Card style={{ left: 1420, top: 270, width: 400, ...enterStyle(earn) }}>
        <Head icon={<User size={30} />} title="Arif earns" sub="Every successful use" dark />
        <Panel><div style={{ fontWeight: 800, fontSize: 64, color: C.ink }}>{uses} uses</div><Chip tone="blue">Rules never revealed</Chip></Panel>
      </Card>
      <div style={{ position: "absolute", right: 96, top: 640, ...enterStyle(issue, -20), display: "flex", alignItems: "center", gap: 16, background: C.card, border: `2px solid ${C.orange}`, borderRadius: 16, padding: "16px 22px", boxShadow: shadow }}>
        <Bell size={28} color={C.orange} />
        <span style={{ fontWeight: 800, fontSize: 26, color: C.ink }}>New issue from Sari: misses a cash limit case</span>
      </div>
      <Caption cues={CUES as any} />
    </AbsoluteFill>
  );
};
