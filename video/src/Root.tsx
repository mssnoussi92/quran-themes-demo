import { Composition } from "remotion";
import { calculateMetadata } from "./data";
import type { VideoProps } from "./data";
import { FORMATS, FPS } from "./formats";
import { EpisodeVideo } from "./Video";

// One composition per format, both fed by the same episode script.
// Pick another episode or reel with --props, e.g. --props='{"episode":"dua","reel":"dua-01"}'.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel916"
      component={EpisodeVideo}
      width={FORMATS.reel.width}
      height={FORMATS.reel.height}
      fps={FPS}
      durationInFrames={1}
      defaultProps={{ episode: "dua", reel: "dua-01", format: "reel", data: null } satisfies VideoProps}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="Episode169"
      component={EpisodeVideo}
      width={FORMATS.episode.width}
      height={FORMATS.episode.height}
      fps={FPS}
      durationInFrames={1}
      defaultProps={{ episode: "dua", reel: null, format: "episode", data: null } satisfies VideoProps}
      calculateMetadata={calculateMetadata}
    />
  </>
);
