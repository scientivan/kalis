import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Bot, Briefcase, ShieldAlert } from "lucide-react";
import { C, fontFamily } from "../lib/style";
import { Caption } from "../lib/Caption";
import { Card, Chip, Grid, Head, Panel, Title, cueAt, enterStyle, useSpring, useWindow } from "../lib/kit";
import { VO } from "../vo-data";

// Scene 6. Demand with sourced numbers, then the money flow of one use.
const CUES = VO.scene6.cues;
const at = (i: number, off = 0) => cueAt(CUES, i, off);
const END = Math.round((VO.scene6.duration + 0.6) * 30);
const Stat = ({ p, icon, big, line, src, left }: { p: number; icon: React.ReactNode; big: string; line: string; src: string; left: number }) => (
  <Card style={{ left, top: 230, width: 540, ...enterStyle(p) }}>
    <Panel style={{ minHeight: 380 }}>
      <Chip tone="ink">{icon}</Chip>
      <div style={{ fontWeight: 800, fontSize: 72, color: C.ink, letterSpacing: "-0.02em" }}>{big}</div>
      <div style={{ fontWeight: 700, fontSize: 28, color: C.ink, lineHeight: 1.25 }}>{line}</div>
      <div style={{ marginTop: "auto", fontWeight: 600, fontSize: 19, color: C.ink2 }}>{src}</div>
    </Panel>
  </Card>
);
export const Scene6 = () => {
  const stats = useWindow(0, at(5));
  const s1 = useSpring(at(2)), s2 = useSpring(at(3)), s3 = useSpring(at(4));
  const flow = useWindow(at(5), END);
  const f = [useSpring(at(5, 0.3)), useSpring(at(6)), useSpring(at(6, 1.2)), useSpring(at(6, 2.4))];
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      <Grid />
      <Audio src={staticFile("vo/scene6.mp3")} />
      <div style={{ opacity: stats }}>
        <Title style={{ left: 96, top: 80 }}>People need this</Title>
        <Stat p={s1} left={96} icon={<ShieldAlert size={22} />} big="48% / 27%" line="put non-public company data into AI tools, and organisations that banned them" src="Cisco Data Privacy Benchmark 2024" />
        <Stat p={s2} left={690} icon={<Briefcase size={22} />} big="$2.5B+" line="spent on expert networks in 2024 alone" src="Inex One, 2024" />
        <Stat p={s3} left={1284} icon={<Bot size={22} />} big="AI agents" line="can be manipulated into sending crypto they should not" src="Princeton, AI Agents in Cryptoland, 2025" />
      </div>
      <div style={{ opacity: flow }}>
        <Title style={{ left: 96, top: 80 }}>Every use funds the marketplace</Title>
        <Card style={{ left: 96, top: 240, width: 420, ...enterStyle(f[0]) }}><Head icon={<Briefcase size={30} />} title="One use" sub="Paid into escrow on NEAR" dark /></Card>
        {[["Seller", "80%", "ink"], ["Community fund", "10%", "blue"], ["Platform", "10%", "white"]].map(([n, v, t], i) => (
          <Card key={n} style={{ left: 620, top: 220 + i * 150, width: 560, ...enterStyle(f[1 + Math.min(i, 2)]) }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}><span style={{ fontWeight: 800, fontSize: 32 }}>{n}</span><Chip tone={t as any}>{v}</Chip></div>
          </Card>
        ))}
        <Card style={{ left: 1260, top: 300, width: 560, ...enterStyle(f[3]) }}>
          <Panel><div style={{ fontWeight: 800, fontSize: 30 }}>Contributors earn a royalty from the seller share</div><div style={{ fontWeight: 600, fontSize: 22, color: C.ink2 }}>So better methods keep getting funded</div></Panel>
        </Card>
      </div>
      <Caption cues={CUES as any} />
    </AbsoluteFill>
  );
};
