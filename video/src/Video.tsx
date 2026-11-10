import { useContext } from "react";
import { AbsoluteFill, Easing, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AudioStart } from "./audioStart";
import type { VideoProps } from "./data";
import { FONT, loadFonts } from "./fonts";
import { FORMATS, REMINDER_SECONDS, TRANSITION_SECONDS, toFrames } from "./formats";
import type { Format } from "./formats";
import { reminderStarts, selectScenes } from "./scenes.ts";
import { StyleContext } from "./styles/context";
import { KITS } from "./styles/kits";
import { PaperBackdrop } from "./styles/paper/render";
import { AyahCard, NameCard, SceneCaption, SceneCard, SourceCard, TitleCard } from "./templates/cards";
import { SubscribeReminder } from "./templates/SubscribeReminder";
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

/** What the scene shows and plays. Each scene is opaque (its own background), so during a transition
 * the scene coming in covers the one going out instead of printing its text over it. */
/** A number from a scene id, to vary the cards' backdrops. */
const variantOf = (id: string) => [...id].reduce((n, c) => n + c.charCodeAt(0), 0);

const SceneBody: React.FC<{ slot: Slot; format: Format }> = ({ slot, format }) => {
  const { scene, lead, content } = slot;
  const style = useContext(StyleContext);
  const kit = KITS[style];
  return (
    <AudioStart.Provider value={lead}>
      {scene.visual.template === "scene" ? (
        <AbsoluteFill style={{ background: BACKGROUND }} />
      ) : kit ? (
        <kit.Backdrop scene={scene} format={format} />
      ) : style === "paper" ? (
        <PaperBackdrop format={format} variant={variantOf(scene.id)} prefix={`pb-${scene.id}`} />
      ) : (
        <AbsoluteFill style={{ background: BACKGROUND }} />
      )}
      {scene.media ? (
        <Sequence from={lead} durationInFrames={content} layout="none">
          <Html5Audio src={staticFile(scene.media.file)} />
        </Sequence>
      ) : null}
      <Card scene={scene} format={format} />
      {scene.visual.template === "scene" && scene.visual.caption ? <SceneCaption scene={scene} format={format} /> : null}
      {/* No subtitle during a transition: nobody speaks, and two boxes would overlap. */}
      <Sequence from={lead} durationInFrames={content} layout="none">
        <Subtitles scene={scene} format={format} />
      </Sequence>
      {scene.duration.provisional ? <DraftBadge format={format} /> : null}
    </AudioStart.Provider>
  );
};

// Between two "scene" templates the next one slides in from the left (Arabic reads right to left) and
// pushes the other out; around cards, a cross-fade: the scene coming in (drawn on top) fades in over the
// one going out, which stays as is. Ease in-out.

type MoveKind = "slide" | "fade" | null;

const Move: React.FC<{ enter: MoveKind; exit: MoveKind; slot: Slot; width: number; children: React.ReactNode }> = ({
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

const Timeline: React.FC<{ list: Slot[]; format: Format }> = ({ list, format }) => {
  let from = 0;
  return (
    <>
      {list.map((slot, i) => {
        // A scene starts where the previous one's content ends: its lead-in is that scene's exit.
        const start = from;
        from += slot.lead + slot.content;
        const move = (a: ResolvedScene, b: ResolvedScene): MoveKind =>
          a.visual.template === "scene" && b.visual.template === "scene" ? "slide" : "fade";
        return (
          <Sequence key={slot.scene.id} name={slot.scene.id} from={start} durationInFrames={slot.total}>
            <Move
              enter={i > 0 ? move(list[i - 1].scene, slot.scene) : null}
              exit={i < list.length - 1 ? move(slot.scene, list[i + 1].scene) : null}
              slot={slot}
              width={format.width}
            >
              <SceneBody slot={slot} format={format} />
            </Move>
          </Sequence>
        );
      })}
    </>
  );
};

/** The page's name, small, in the top-right corner of the safe area, on every frame: it stays still
 * during the transitions, and a reposted video keeps its source (as quran-reels signs its reels). */
const Handle: React.FC<{ handle: string; format: Format }> = ({ handle, format }) => (
  <div
    style={{
      position: "absolute",
      top: format.safe.top - (format.id === "reel" ? 0 : 30),
      right: format.safe.right - (format.id === "reel" ? 0 : 80),
      fontFamily: FONT.latin,
      fontSize: format.id === "reel" ? 30 : 28,
      fontWeight: 600,
      letterSpacing: 0.5,
      color: COLOR.text,
      opacity: 0.85,
      // A light pill, as the subtitles: readable on the light backgrounds (street, narrator) too.
      background: "rgba(10, 14, 35, 0.35)",
      padding: "4px 14px",
      borderRadius: 12,
    }}
  >
    {handle}
  </div>
);

export const EpisodeVideo: React.FC<VideoProps> = ({ data, reel, format: formatId, style, platform }) => {
  if (!data) throw new Error("no episode data: calculateMetadata did not run");
  // A version made for a platform is signed with the page's name there, or not made at all: a video
  // signed with someone else's account is worse than a failed render.
  if (platform && !data.handles?.[platform]) throw new Error(`no handle for the platform '${platform}' in content/publish.yaml (handles)`);
  const handle = platform ? data.handles![platform] : data.handle;
  const format = FORMATS[formatId];
  const scenes = selectScenes(data, reel);
  const list = slots(scenes, toFrames(TRANSITION_SECONDS));
  // The reminder is for YouTube: the whole episode in 16:9 only (the reels' platforms have their own buttons).
  const reminders = format.id === "episode" && reel === null ? reminderStarts(scenes) : [];
  return (
    <StyleContext.Provider value={style ?? data.style ?? "flat"}>
    <AbsoluteFill style={{ background: BACKGROUND }}>
      <Timeline list={list} format={format} />
      {handle ? <Handle handle={handle} format={format} /> : null}
      {reminders.map((from) => (
        <Sequence key={from} from={from} durationInFrames={toFrames(REMINDER_SECONDS)} layout="none">
          <SubscribeReminder format={format} />
        </Sequence>
      ))}
    </AbsoluteFill>
    </StyleContext.Provider>
  );
};
