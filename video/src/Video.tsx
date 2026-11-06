import { TransitionSeries, springTiming } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { iris } from "@remotion/transitions/iris";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { AbsoluteFill, Easing, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AudioStart } from "./audioStart";
import { selectScenes } from "./data";
import type { VideoProps } from "./data";
import { FONT, loadFonts } from "./fonts";
import { DEFAULT_TRANSITION, FORMATS, toFrames } from "./formats";
import type { Format, TransitionStyle } from "./formats";
import { AyahCard, NameCard, SceneCard, SourceCard, TitleCard } from "./templates/cards";
import { Subtitles } from "./templates/Subtitles";
import { COLOR } from "./theme";
import type { ResolvedScene } from "./types";

loadFonts();

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

// Timeline: scene i shows its content for `content` frames; between two scenes, a silent transition of
// `overlap` frames during which both are on screen. A scene's sequence is [lead-in | content | exit]:
// the lead-in and exit are the transitions shared with its neighbours, its voice starts after the
// lead-in, and its subtitles show only during its content. No transition before the first scene.
type Slot = { scene: ResolvedScene; lead: number; content: number; exit: number; total: number };

function slots(scenes: ResolvedScene[], overlap: number): Slot[] {
  return scenes.map((scene, i) => {
    const lead = i > 0 ? overlap : 0;
    const content = toFrames(scene.duration.seconds);
    const exit = i < scenes.length - 1 ? overlap : 0;
    return { scene, lead, content, exit, total: lead + content + exit };
  });
}

const BACKGROUND = `linear-gradient(180deg, ${COLOR.backgroundTop} 0%, ${COLOR.backgroundBottom} 100%)`;

/** What the scene shows and plays, whatever the transition engine. Each scene is opaque (its own
 * background), so during a transition the scene coming in covers the one going out instead of
 * printing its text over it. */
const SceneBody: React.FC<{ slot: Slot; format: Format }> = ({ slot, format }) => {
  const { scene, lead, content } = slot;
  return (
    <AudioStart.Provider value={lead}>
      <AbsoluteFill style={{ background: BACKGROUND }} />
      {scene.media ? (
        <Sequence from={lead} layout="none">
          <Html5Audio src={staticFile(scene.media.file)} />
        </Sequence>
      ) : null}
      <Card scene={scene} format={format} />
      {/* No subtitle during a transition: nobody speaks, and two boxes would overlap. */}
      <Sequence from={lead} durationInFrames={content} layout="none">
        <Subtitles scene={scene} format={format} />
      </Sequence>
      {scene.duration.provisional ? <DraftBadge format={format} /> : null}
    </AudioStart.Provider>
  );
};

/** Between two "scene" templates the move is a slide (or wipe); around cards, a fade (or iris). */
const isSceneToScene = (a: ResolvedScene, b: ResolvedScene) =>
  a.visual.template === "scene" && b.visual.template === "scene";

// ---- "own": slide from the left (Arabic reads right to left) / cross-fade, ease in-out ----------------
// Cross-fade: the scene coming in (drawn on top) fades in over the one going out, which stays as is.

type Move = "slide" | "fade" | null;

const OwnMove: React.FC<{ enter: Move; exit: Move; slot: Slot; width: number; children: React.ReactNode }> = ({
  enter,
  exit,
  slot,
  width,
  children,
}) => {
  const frame = useCurrentFrame();
  const progress = (from: number, length: number) =>
    interpolate(frame, [from, from + length], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
  let style: React.CSSProperties = {};
  if (enter && frame < slot.lead) {
    const p = progress(0, slot.lead);
    style = enter === "slide" ? { transform: `translateX(${(p - 1) * width}px)` } : { opacity: p };
  } else if (exit && frame >= slot.total - slot.exit) {
    const q = progress(slot.total - slot.exit, slot.exit);
    if (exit === "slide") style = { transform: `translateX(${q * width}px)` };
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

const OwnTimeline: React.FC<{ list: Slot[]; format: Format }> = ({ list, format }) => {
  let from = 0;
  return (
    <>
      {list.map((slot, i) => {
        // A scene starts where the previous one's content ends: its lead-in is that scene's exit.
        const start = from;
        from += slot.lead + slot.content;
        const move = (a: ResolvedScene, b: ResolvedScene): Move => (isSceneToScene(a, b) ? "slide" : "fade");
        return (
          <Sequence key={slot.scene.id} name={slot.scene.id} from={start} durationInFrames={slot.total}>
            <OwnMove
              enter={i > 0 ? move(list[i - 1].scene, slot.scene) : null}
              exit={i < list.length - 1 ? move(slot.scene, list[i + 1].scene) : null}
              slot={slot}
              width={format.width}
            >
              <SceneBody slot={slot} format={format} />
            </OwnMove>
          </Sequence>
        );
      })}
    </>
  );
};

// ---- "remotion" / "remotion-wipe-iris": @remotion/transitions, spring timing ------------------------

const remotionMove = (style: TransitionStyle, a: ResolvedScene, b: ResolvedScene, format: Format) => {
  const sceneToScene = isSceneToScene(a, b);
  if (style === "remotion-wipe-iris") {
    return (sceneToScene ? wipe({ direction: "from-left" }) : iris({ width: format.width, height: format.height })) as TransitionPresentation<Record<string, unknown>>;
  }
  return (sceneToScene ? slide({ direction: "from-left" }) : fade()) as TransitionPresentation<Record<string, unknown>>;
};

const RemotionTimeline: React.FC<{ list: Slot[]; format: Format; style: TransitionStyle; overlap: number }> = ({
  list,
  format,
  style,
  overlap,
}) => (
  <TransitionSeries>
    {list.flatMap((slot, i) => [
      i > 0 ? (
        <TransitionSeries.Transition
          key={`t-${slot.scene.id}`}
          presentation={remotionMove(style, list[i - 1].scene, slot.scene, format)}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: overlap })}
        />
      ) : null,
      <TransitionSeries.Sequence key={slot.scene.id} name={slot.scene.id} durationInFrames={slot.total}>
        <SceneBody slot={slot} format={format} />
      </TransitionSeries.Sequence>,
    ])}
  </TransitionSeries>
);

export const EpisodeVideo: React.FC<VideoProps> = ({ data, reel, format: formatId, transition }) => {
  if (!data) throw new Error("no episode data: calculateMetadata did not run");
  const format = FORMATS[formatId];
  const choice = transition ?? DEFAULT_TRANSITION;
  const overlap = toFrames(choice.seconds);
  const list = slots(selectScenes(data, reel), overlap);
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      {choice.style === "own" ? (
        <OwnTimeline list={list} format={format} />
      ) : (
        <RemotionTimeline list={list} format={format} style={choice.style} overlap={overlap} />
      )}
    </AbsoluteFill>
  );
};
