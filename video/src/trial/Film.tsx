// The long film of the trial (content/trial/film.yaml, docs/retention.md, 2026-11-11): the whole story of
// Moses and al-Khidr in 16:9, built on the three shorts. Same picture as the shorts (a filmed sky or sea, the
// drawn silhouette of what the verse tells), laid out for a wide frame: what is drawn on one side, the
// Arabic text on the other, the translation under them. Its timeline comes from tools/trial/prepare.py
// --film (public/trial/film-<voice>.json): segments (narration, verse, hadith read by a real voice), shots
// (which picture and scene from when), chapters, and when the subscribe reminder passes.
import type { CalculateMetadataFunction } from "remotion";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, loadFonts } from "../fonts";
import { Boat, Fleet } from "./Boat";
import { subtitleChunks } from "../templates/Subtitles";
import { House, Land } from "./Home";
import { Clip, GOLD, NarrationText, SHADOW, TRIAL_FPS, VerseText, fit, sceneOpacity } from "./Trial";
import type { Layout, Narration, Verse } from "./Trial";
import { Village, Wall } from "./Wall";

loadFonts();

const W = 1920;
const H = 1080;

type Side = "left" | "right";
/** `center`: a line said over several pictures in a row (the opening): its text stays in the middle. */
type Column = Side | "center";
/** A filmed clip in the wide frame: the side of what is drawn over it, its horizon, how it is moved and darkened. */
type FilmPicture = { clip: string; clip_seconds: number; side: Side; horizon: number; shift?: number; brightness?: number; ground?: string; rate?: number };
type Reading = { kind: "reading"; start: number; seconds: number; file: string; reference: string; text: string; en: string; credit: string };
type FilmSegment = ((Omit<Narration, "scene"> | Omit<Verse, "scene">) | Reading) & { chapter: string; center?: boolean };
type Shot = { start: number; picture: string; scene: string };
type Chapter = { id: string; title: { ar: string; en: string }; number: number | null; start: number };
export type FilmData = {
  film: string; voice: string; voice_name: string; handle: string; title: { ar: string; en: string };
  seconds: number; outro: number; chapters: Chapter[]; pictures: Record<string, FilmPicture>;
  shots: Shot[]; subscribe: number[]; segments: FilmSegment[];
};
export type FilmProps = { voice: string; data: FilmData | null };

export const filmMetadata: CalculateMetadataFunction<FilmProps> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile(`trial/film-${props.voice}.json`), { signal: abortSignal });
  if (!res.ok) throw new Error(`public/trial/film-${props.voice}.json is missing: run tools/trial/prepare.py --film`);
  const data = (await res.json()) as FilmData;
  return { durationInFrames: Math.ceil(data.seconds * TRIAL_FPS), props: { ...props, data } };
};

/** The column of the text: the side the picture leaves free. */
const layoutFor = (side: Column): Layout => ({
  width: W,
  left: side === "left" ? 900 : side === "center" ? 330 : 80,
  right: side === "left" ? 80 : side === "center" ? 330 : 900,
  top: side === "center" ? 150 : 176, size: 90, height: side === "center" ? 420 : 600,
  verseTop: 150, verseSize: 60, verseComfortable: 110,
  sub: { top: 936, left: 250, right: 250, size: 40, rows: 2 },
  credit: { top: 846, size: 26 },
});

type Drawn = React.FC<{ t: number; show: (id: string) => number; since: (id: string) => number; horizon: number }>;

/** The boat, on the left of the wide frame: `holed`, `fleet` (the king's ships on the horizon), `sail`,
 * `bird` (the sparrow of the hadith on its edge, before anything was torn), `sea` (the sea alone). */
const BoatWide: Drawn = ({ t, show, since, horizon }) => (
  <>
    <g opacity={show("fleet")}>
      <g transform="translate(-250 0)">
        <Fleet horizon={horizon} t={t} />
      </g>
      <Boat id="fb-fleet" x={330} y={horizon + 320} scale={0.58} t={t} holed splash={false} plank={false} />
    </g>
    <g opacity={show("holed")}>
      <Boat id="fb-holed" x={500} y={horizon + 292} scale={0.74} t={t} holed splash />
    </g>
    <g opacity={show("bird")}>
      <Boat id="fb-bird" x={500} y={horizon + 292} scale={0.74} t={t} holed={false} splash={false} plank={false} bird />
    </g>
    <g opacity={show("sail")}>
      <Boat id="fb-sail" x={560 - 3 * Math.min(60, Math.max(0, t - since("sail")))} y={horizon + 270} scale={0.64} t={t} holed splash={false} plank={false} />
    </g>
  </>
);

/** The parents' house, on the right of the wide frame, under the filmed moon. */
const HomeWide: Drawn = ({ t, show, horizon }) => (
  <>
    <Land id="fl-home" horizon={horizon} rim="#9fb6e6" width={W} />
    <g opacity={show("home")}>
      <House id="fh-home" x={1450} y={horizon + 34} scale={0.95} t={t} lights={1} />
    </g>
    <g opacity={show("given")}>
      <House id="fh-given" x={1450} y={horizon + 34} scale={0.95} t={t} lights={2} />
    </g>
    <g opacity={show("far")}>
      <House id="fh-far" x={1500} y={horizon + 30} scale={0.5} t={t} lights={2} />
    </g>
  </>
);

/** The wall, on the left of the wide frame, the town behind it across the whole width. */
const WallWide: Drawn = ({ t, show, horizon }) => (
  <>
    <g opacity={Math.max(show("leaning"), show("raised"), show("treasure"))}>
      <Village horizon={horizon} wide />
    </g>
    <Land id="fl-wall" horizon={horizon + 16} rim="#ffbe7a" width={W} />
    <g opacity={show("leaning")}>
      <Wall id="fw-leaning" x={520} y={horizon + 30} scale={0.86} t={t} leaning />
    </g>
    <g opacity={show("raised")}>
      <Wall id="fw-raised" x={520} y={horizon + 30} scale={0.86} t={t} />
    </g>
    <g opacity={show("treasure")}>
      <Wall id="fw-treasure" x={520} y={horizon + 30} scale={0.86} t={t} treasure />
    </g>
    <g opacity={show("far")}>
      <Wall id="fw-far" x={560} y={horizon + 26} scale={0.46} t={t} treasure />
    </g>
  </>
);

const WIDE: Record<string, Drawn> = { boat: BoatWide, boy: HomeWide, wall: WallWide };

/** One stretch of the film on the same clip: the clip, what is drawn over it scene after scene, a slow zoom. */
const Stage: React.FC<{ picture: FilmPicture; name: string; shots: Shot[]; from: number; fade: number }> = ({ picture, name, shots, from, fade }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = from + frame / fps;
  const Drawing = WIDE[name];
  if (!Drawing) throw new Error(`no wide picture is drawn for « ${name} »`);
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.05]);
  // The text side is darkened, the side of the drawing is left clear.
  const veil = picture.side === "left"
    ? "linear-gradient(90deg, rgba(4,7,20,.12) 0%, rgba(4,7,20,.2) 38%, rgba(4,7,20,.72) 62%, rgba(4,7,20,.8) 100%)"
    : "linear-gradient(270deg, rgba(4,7,20,.12) 0%, rgba(4,7,20,.2) 38%, rgba(4,7,20,.72) 62%, rgba(4,7,20,.8) 100%)";
  return (
    <AbsoluteFill style={{ background: picture.ground ?? "#04070f", opacity: fade ? interpolate(frame, [0, fade * fps], [0, 1], { extrapolateRight: "clamp" }) : 1 }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${picture.side === "left" ? 28 : 72}% ${(picture.horizon / H) * 100}%` }}>
        <Clip src={picture.clip} clipSeconds={picture.clip_seconds} picture={{ shift: picture.shift, brightness: picture.brightness, rate: picture.rate }} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <Drawing t={t} show={(id) => sceneOpacity(shots, id, t)} since={(id) => shots.find((s) => s.scene === id)?.start ?? from} horizon={picture.horizon} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: veil }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,7,20,.5) 0%, rgba(4,7,20,0) 16%, rgba(4,7,20,0) 74%, rgba(4,7,20,.72) 100%)" }} />
    </AbsoluteFill>
  );
};

/** A hadith read by a real voice: its words between « », its reference above, the reader and the translator under. */
const ReadingText: React.FC<{ seg: Reading; t: number; layout: Layout }> = ({ seg, t, layout }) => {
  const local = t - seg.start;
  const show = interpolate(local, [-0.3, 0.1, seg.seconds - 0.1, seg.seconds + 0.3], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The translation in short chunks, each for its share of the reading (there are no word times for a reader).
  const chunks = subtitleChunks(seg.en);
  const total = chunks.reduce((n, c) => n + c.length, 0) || 1;
  let done = 0;
  const cue = chunks.find((c) => (done += c.length) / total > local / seg.seconds) ?? chunks[chunks.length - 1];
  return (
    <div style={{ opacity: show }}>
      <div style={{ position: "absolute", top: layout.verseTop, left: layout.left, right: layout.right, textAlign: "center", fontFamily: FONT.latin, fontSize: 30, color: "rgba(255,255,255,.72)", textShadow: SHADOW }}>
        {seg.reference}
      </div>
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: layout.verseTop + 56, left: layout.left, right: layout.right, textAlign: "center", fontFamily: FONT.arabic, fontSize: fit(64, seg.text, 90), lineHeight: 1.8, color: "#fff", textShadow: SHADOW, textWrap: "balance" }}>
        « {seg.text} »
      </div>
      <div lang="en" style={{ position: "absolute", top: layout.sub.top, left: layout.sub.left, right: layout.sub.right, textAlign: "center", fontFamily: FONT.latin, fontStyle: "italic", fontSize: layout.sub.size, lineHeight: 1.4, color: "rgba(255,255,255,.92)", textShadow: SHADOW, textWrap: "balance" }}>
        {cue}
      </div>
      <div style={{ position: "absolute", top: layout.credit.top, left: layout.left, right: layout.right, textAlign: "center", fontFamily: FONT.latin, fontSize: layout.credit.size, color: "rgba(255,255,255,.62)", textShadow: SHADOW }}>
        {seg.credit}
      </div>
    </div>
  );
};

const BELL = "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z";

/** The name of the page, top right; when the subscribe reminder passes it becomes the button for four
 * seconds: « اشترك · Subscribe » and a bell, which fills with gold and reads « مشترك ✓ » as the bell swings,
 * then the name comes back. No pointer, no sound. (Bell: Material Icons, Apache 2.0, as in the other videos.) */
const Signature: React.FC<{ handle: string; reminders: number[]; t: number }> = ({ handle, reminders, t }) => {
  const { fps } = useVideoConfig();
  const at = reminders.find((r) => t >= r - 0.1 && t < r + 4.3);
  const local = at === undefined ? -1 : t - at;
  const open = at === undefined ? 0 : Math.min(spring({ frame: Math.round(local * fps), fps, config: { damping: 200 }, durationInFrames: 10 }), interpolate(local, [3.7, 4.1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const pressed = interpolate(local, [1.5, 1.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = 1 - 0.07 * Math.sin(Math.PI * interpolate(local, [1.4, 1.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const swing = local > 1.75 && local < 3.2 ? 16 * Math.sin((local - 1.75) * 14) * Math.exp(-(local - 1.75) * 2.2) : 0;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * pressed);
  return (
    <div style={{ position: "absolute", top: 40, right: 70, height: 84, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", right: 0, fontFamily: FONT.latin, fontWeight: 600, fontSize: 30, color: GOLD, opacity: 0.9 * (1 - open), textShadow: SHADOW, whiteSpace: "nowrap" }}>
        {handle}
      </div>
      <div style={{
        opacity: open, transform: `scale(${(0.9 + 0.1 * open) * press})`, transformOrigin: "100% 50%", display: "flex", alignItems: "center", gap: 18, padding: "12px 36px 14px 28px",
        borderRadius: 999, border: `3px solid ${GOLD}`, background: `rgba(${mix(4, 255)},${mix(7, 207)},${mix(20, 106)},${0.6 + 0.4 * pressed})`,
        color: `rgb(${mix(255, 20)},${mix(207, 16)},${mix(106, 6)})`, whiteSpace: "nowrap",
      }}>
        <svg width={48} height={48} viewBox="0 0 24 24" style={{ transform: `rotate(${swing}deg)`, transformOrigin: "50% 12%" }}>
          <path d={BELL} fill="currentColor" />
        </svg>
        <span dir="rtl" lang="ar" style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: 50, lineHeight: 1.2 }}>{pressed > 0.5 ? "مشترك ✓" : "اشترك"}</span>
        <span style={{ fontFamily: FONT.latin, fontWeight: 600, fontSize: 34, opacity: 0.85 }}>{pressed > 0.5 ? "Subscribed" : "Subscribe"}</span>
      </div>
    </div>
  );
};

export const Film: React.FC<FilmProps> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!data) throw new Error("no film data: calculateMetadata did not run");
  const t = frame / fps;
  // Stretches of the film on the same clip: each one fades in over the one before.
  const runs: { name: string; from: number; shots: Shot[] }[] = [];
  for (const shot of data.shots) {
    const last = runs[runs.length - 1];
    if (last && last.name === shot.picture) last.shots.push(shot);
    else runs.push({ name: shot.picture, from: shot.start, shots: [shot] });
  }
  const FADE = 0.7;
  const current = [...data.segments].reverse().find((s) => t >= s.start - 0.3) ?? data.segments[0];
  const shot = [...data.shots].reverse().find((s) => t >= s.start) ?? data.shots[0];
  const layout = layoutFor(current.center ? "center" : data.pictures[shot.picture].side);
  const chapter = [...data.chapters].reverse().find((c) => t >= c.start) ?? data.chapters[0];
  const chapterIn = interpolate(t - chapter.start, [0.2, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ended = t > data.seconds - data.outro + 4.6;      // the last line stays while the reminder passes, then the picture alone
  return (
    <AbsoluteFill style={{ background: "#04070f" }}>
      {runs.map((run, i) => {
        const first = i === 0;
        const start = first ? 0 : run.from - FADE / 2;
        const end = i + 1 < runs.length ? runs[i + 1].from + FADE : data.seconds;
        return (
          <Sequence key={i} from={Math.round(start * fps)} durationInFrames={Math.ceil((end - start) * fps)} layout="none">
            <Stage picture={data.pictures[run.name]} name={run.name} shots={run.shots} from={start} fade={first ? 0 : FADE} />
          </Sequence>
        );
      })}
      {data.segments.map((seg, i) =>
        seg.file ? (
          <Sequence key={i} from={Math.round(seg.start * fps)} durationInFrames={Math.ceil(seg.seconds * fps) + 2} layout="none">
            <Html5Audio src={staticFile(seg.file)} />
          </Sequence>
        ) : null,
      )}
      {ended ? null : current.kind === "narration" ? (
        <NarrationText seg={{ ...current, scene: shot.scene }} t={t} last={current === data.segments[data.segments.length - 1]} handle="" layout={layout} />
      ) : current.kind === "verse" ? (
        <VerseText seg={{ ...current, scene: shot.scene }} t={t} layout={layout} />
      ) : (
        <ReadingText seg={current} t={t} layout={layout} />
      )}
      {/* where we are in the story: the chapter, top left */}
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: 50, left: 70, opacity: 0.86 * chapterIn * (ended ? 0 : 1), fontFamily: FONT.arabic, fontWeight: 700, fontSize: 36, color: GOLD, textShadow: SHADOW }}>
        {chapter.number ? `${["٠", "١", "٢", "٣", "٤", "٥"][chapter.number]} · ` : ""}{chapter.title.ar}
      </div>
      <Signature handle={data.handle} reminders={data.subscribe} t={t} />
    </AbsoluteFill>
  );
};
