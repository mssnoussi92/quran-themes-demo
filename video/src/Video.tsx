import { AbsoluteFill, Html5Audio, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import { selectScenes } from "./data";
import type { VideoProps } from "./data";
import { FONT, loadFonts } from "./fonts";
import { FORMATS, toFrames } from "./formats";
import type { Format } from "./formats";
import { AyahCard, NameCard, SceneCard, SourceCard, TitleCard } from "./templates/cards";
import { Subtitles } from "./templates/Subtitles";
import { COLOR } from "./theme";
import type { ResolvedScene } from "./types";

loadFonts();

// Scenes change with a cut and a very short fade-in, as in the reference video (a cut every 2-4 s):
// no fade-out, which would dip to the background between two lines.
const FADE_IN = 4; // frames

const Fade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, FADE_IN], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const Card: React.FC<{ scene: ResolvedScene; format: Format }> = ({ scene, format }) => {
  switch (scene.visual.template) {
    case "title-card":
      return <TitleCard scene={scene} format={format} />;
    case "ayah-card":
      return <AyahCard scene={scene} format={format} />;
    case "source-card":
      return <SourceCard scene={scene} format={format} />;
    case "name-card":
      return <NameCard scene={scene} format={format} />;
    case "scene":
      return <SceneCard scene={scene} format={format} />;
  }
};

const DraftBadge: React.FC<{ format: Format }> = ({ format }) => (
  <div
    style={{
      position: "absolute",
      top: format.safe.top - 70,
      left: format.safe.left,
      fontFamily: FONT.latin,
      fontSize: 26,
      color: COLOR.muted,
      letterSpacing: 2,
    }}
  >
    DRAFT · ESTIMATED TIMING
  </div>
);

export const EpisodeVideo: React.FC<VideoProps> = ({ data, reel, format: formatId }) => {
  if (!data) throw new Error("no episode data: calculateMetadata did not run");
  const format = FORMATS[formatId];
  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(180deg, ${COLOR.backgroundTop} 0%, ${COLOR.backgroundBottom} 100%)` }}
    >
      <Series>
        {selectScenes(data, reel).map((scene) => (
          <Series.Sequence key={scene.id} name={scene.id} durationInFrames={toFrames(scene.duration.seconds)}>
            {scene.media ? <Html5Audio src={staticFile(scene.media.file)} /> : null}
            <Fade>
              <Card scene={scene} format={format} />
              <Subtitles scene={scene} format={format} />
              {scene.duration.provisional ? <DraftBadge format={format} /> : null}
            </Fade>
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
