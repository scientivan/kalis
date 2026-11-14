import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Check, Coins, GitPullRequest, Landmark, Lock, Vote } from "lucide-react";
import { C, fontFamily } from "../lib/style";
import { Caption } from "../lib/Caption";
import { Arrow, Card, Chip, Grid, Head, Panel, Row, Screen, Title, cueAt, enterStyle, useSpring, useWindow } from "../lib/kit";
import { VO } from "../vo-data";

// Scene 5. The shared community: a glimpse of Fund, then pooled escrow bounty, DAO approval,
// and the contract-paid contributor royalty on the next version.
const CUES = VO.scene5.cues;
const at = (i: number, off = 0) => cueAt(CUES, i, off);
const END = Math.round((VO.scene5.duration + 0.6) * 30);
export const Scene5 = () => {
  const first = useWindow(0, at(2));
  const fund = useSpring(at(1));
  const second = useWindow(at(2), END);
  const p1 = useSpring(at(2, 0.4)), p2 = useSpring(at(2, 1.0)), esc = useSpring(at(2, 1.8)), vote = useSpring(at(2, 3.6)), paid = useSpring(at(2, 5.2));
  const ver = useSpring(at(3)), roy = useSpring(at(3, 2.4));
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      <Grid />
      <Audio src={staticFile("vo/scene5.mp3")} />
      <div style={{ opacity: first }}>
        <Screen src="screens/community.png" url="app.kalis.scientivan.dev/community" from={0} to={at(2)} scroll={140} style={{ left: 96, top: 120, width: 1100, height: 700 }} />
        <Card style={{ left: 1260, top: 220, width: 560, ...enterStyle(fund) }}>
          <Head icon={<Landmark size={30} />} title="Community fund" sub="Sputnik DAO on NEAR" dark />
          <Panel><Row label="From every use" value="10%" /><Row label="Spent on" value="Issues, bounties, fixes" /></Panel>
        </Card>
      </div>
      <div style={{ opacity: second }}>
        <Title style={{ left: 96, top: 60 }}>Fund the fix together</Title>
        <div style={{ position: "absolute", left: 96, top: 190, display: "flex", flexDirection: "column", gap: 16 }}>
          {[p1, p2].map((p, i) => <div key={i} style={enterStyle(p)}><Chip tone="white"><Coins size={20} />{i ? "Another user pledges 0.5 NEAR" : "Sari pledges 0.5 NEAR"}</Chip></div>)}
        </div>
        <Card style={{ left: 96, top: 330, width: 460, ...enterStyle(esc) }}>
          <Head icon={<Lock size={30} />} title="Escrow contract" sub="kalis-pools-1114.testnet" dark />
          <Panel><div style={{ fontWeight: 800, fontSize: 52 }}>1 NEAR locked</div><div style={{ fontWeight: 600, fontSize: 21, color: C.ink2 }}>Refunded to everyone if the fix is not approved in time</div></Panel>
        </Card>
        <Arrow p={vote} style={{ left: 576, top: 470 }} />
        <Card style={{ left: 686, top: 360, width: 420, ...enterStyle(vote) }}>
          <Head icon={<Vote size={30} />} title="DAO vote" sub="BountyDone proposal" />
          <Panel><Chip tone="blue"><Check size={20} />Approved</Chip><div style={{ opacity: paid }}><Chip><Coins size={20} />Escrow paid 1 NEAR</Chip></div></Panel>
        </Card>
        <Card style={{ left: 1180, top: 190, width: 640, ...enterStyle(ver) }}>
          <Head icon={<GitPullRequest size={30} />} title="Arif's method, next version" sub="Fix from a contributor" />
          <Panel>
            <Row label="Version" value="v2 to v3" />
            <div style={{ opacity: roy }}><Row label="Every run pays" right={<Chip tone="blue">Contributor royalty</Chip>} /></div>
            <div style={{ opacity: roy, fontWeight: 600, fontSize: 21, color: C.ink2 }}>Paid by the market contract at settle, on NEAR testnet</div>
          </Panel>
        </Card>
      </div>
      <Caption cues={CUES as any} />
    </AbsoluteFill>
  );
};
