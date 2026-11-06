import { AbsoluteFill, Easing, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AudioStart } from "./audioStart";
import { selectScenes } from "./data";
import type { VideoProps } from "./data";
import { FONT, loadFonts } from "./fonts";
import { FORMATS, TRANSITION_SECONDS, toFrames } from "./formats";
import type { Format } from "./formats";
import { AyahCard, NameCard, SceneCard, SourceCard, TitleCard } from "./templates/cards";
import { Subtitles } from "./templates/Subtitles";
import { COLOR } from "./theme";
import type { ResolvedScene } from "./types";

loadFonts();

// Transitions: each scene starts TRANSITION_SECONDS before the previous one ends, and both move during
// that overlap, in silence (the previous line ends with that much silence, the next voice starts when
// the movement ends). Between two "scene" templates the new one slides in from the left (Arabic reads
// right to left) and pushes the old one out; around cards the two cross-fade. No transition before
// the first scene: its first frame is the hook.
type Move = "slide" | "fade" | null;

const moveBetween = (a: ResolvedScene, b: ResolvedScene): Move =>
  a.visual.template === "scene" && b.visual.template === "scene" ? "slide" : "fade";

const Transition: React.FC<{
  enter: Move;
  exit: Move;
  overlap: number;
  total: number;
  width: number;
  children: React.ReactNode;
}> = ({ enter, exit, overlap, total, width, children }) => {
  const frame = useCurrentFrame();
  const progress = (from: number) =>
    interpolate(frame, [from, from + overlap], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
  let style: React.CSSProperties = {};
  if (enter && frame < overlap) {
    const p = progress(0);
    style = enter === "slide" ? { transform: `translateX(${(p - 1) * width}px)` } : { opacity: p };
  } else if (exit && frame >= total - overlap) {
    const q = progress(total - overlap);
    style = exit === "slide" ? { transform: `translateX(${q * width}px)` } : { opacity: 1 - q };
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
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

const OVERLAP = toFrames(TRANSITION_SECONDS);

/** Where each scene sits: it starts OVERLAP frames before the previous one ends and gets those frames
 * as a silent lead-in, so the total length is still the sum of the scene durations (calculateMetadata). */
function timeline(scenes: ResolvedScene[]) {
  let from = 0;
  return scenes.map((scene, i) => {
    const lead = i > 0 ? OVERLAP : 0;
    const total = lead + toFrames(scene.duration.seconds);
    const item = {
      scene,
      from: from - lead,
      lead,
      total,
      enter: i > 0 ? moveBetween(scenes[i - 1], scene) : null,
      exit: i < scenes.length - 1 ? moveBetween(scene, scenes[i + 1]) : null,
    };
    from += total - lead;
    return item;
  });
}

export const EpisodeVideo: React.FC<VideoProps> = ({ data, reel, format: formatId }) => {
  if (!data) throw new Error("no episode data: calculateMetadata did not run");
  const format = FORMATS[formatId];
  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(180deg, ${COLOR.backgroundTop} 0%, ${COLOR.backgroundBottom} 100%)` }}
    >
      {timeline(selectScenes(data, reel)).map(({ scene, from, lead, total, enter, exit }) => (
        <Sequence key={scene.id} name={scene.id} from={from} durationInFrames={total}>
          <AudioStart.Provider value={lead}>
            {scene.media ? (
              <Sequence from={lead} layout="none">
                <Html5Audio src={staticFile(scene.media.file)} />
              </Sequence>
            ) : null}
            <Transition enter={enter} exit={exit} overlap={OVERLAP} total={total} width={format.width}>
              <Card scene={scene} format={format} />
              {/* No subtitle during a transition: nobody speaks, and two boxes would overlap. */}
              <Sequence from={lead} durationInFrames={total - lead - (exit ? OVERLAP : 0)} layout="none">
                <Subtitles scene={scene} format={format} />
              </Sequence>
              {scene.duration.provisional ? <DraftBadge format={format} /> : null}
            </Transition>
          </AudioStart.Provider>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
