import { Composition } from "remotion";
import { Scene1 } from "./scenes/Scene1";

// 1920x1080, 30 fps. Scene 1 runs 14 s (Ava voiceover at 1.5x is 12.8 s, plus a short hold on the logo).
export const Root = () => (
  <>
    <Composition id="Scene1" component={Scene1} width={1920} height={1080} fps={30} durationInFrames={420} />
  </>
);
