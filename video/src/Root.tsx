import { Composition, Series } from "remotion";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { Scene7 } from "./scenes/Scene7";
import { VO } from "./vo-data";

// 1920x1080, 30 fps. Each scene lasts its voiceover (Ava, 1.25x) plus a short hold.
const len = (k: keyof typeof VO, hold = 0.6) => Math.ceil((VO[k].duration + hold) * 30);
const SCENES = [
  [Scene1, len("scene1", 1.0)], [Scene2, len("scene2")], [Scene3, len("scene3")], [Scene4, len("scene4")],
  [Scene5, len("scene5")], [Scene6, len("scene6")], [Scene7, len("scene7", 2.0)],
] as const;
const Full = () => (
  <Series>{SCENES.map(([S, d], i) => <Series.Sequence key={i} durationInFrames={d}><S /></Series.Sequence>)}</Series>
);
export const Root = () => (
  <>
    <Composition id="Full" component={Full} width={1920} height={1080} fps={30} durationInFrames={SCENES.reduce((a, [, d]) => a + d, 0)} />
    {SCENES.map(([S, d], i) => <Composition key={i} id={`Scene${i + 1}`} component={S} width={1920} height={1080} fps={30} durationInFrames={d} />)}
  </>
);
