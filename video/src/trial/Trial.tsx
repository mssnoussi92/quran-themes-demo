// Trial shorts of 2026-11-11 (docs/retention.md, content/trial/*.yaml): the model proposed to the owner,
// to be judged on a video before anything is rebuilt. One continuous picture (a filmed sky or sea, the drawn
// silhouette of what the verse tells), the voice going on over it, each verse recited over the scene with
// its word lit as it is recited. Session only: its data and the filmed clip are prepared by
// tools/trial/prepare.py into public/trial/ (not in the repository).
import { Fragment } from "react";
import type { CalculateMetadataFunction } from "remotion";
import { AbsoluteFill, Easing, Html5Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, loadFonts } from "../fonts";
import { subtitleChunks } from "../templates/Subtitles";
import type { WordTiming } from "../types";
import { Caravan, Footprints, Gate, Lantern, Palm, Rain, Sermon, Stars } from "./Ayah";
import { Boat, Fleet } from "./Boat";
import { Call, Niche, Whale } from "./Dua";
import { House, Land } from "./Home";
import { Barrier, Chest, Cliffs, Dwellings } from "./Qarnayn";
import { Village, Wall } from "./Wall";

loadFonts();

/** An English text. Lora draws it; what Lora lacks is drawn with Amiri, which ships with the project too, never
 * by the machine's own font (« the Prophet ﷺ » came out as a pixel font in a session and as an empty box on a
 * GitHub runner, 2026-11-11). An Arabic sign is upright and a little larger. A dotted letter of a transliteration
 * (« al-Khiḍr », « Muḥammad ») is asked from Amiri first: Lora has no such letter and would draw its own « d »
 * and a loose dot, which lands under the next letter. tools/trial/rules.py refuses a sign neither font has. */
const ENGLISH = `${FONT.latin}, ${FONT.arabic}`;
const NOT_LORA = /([\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]+|[\u1E00-\u1E9F])/;
export const English: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(NOT_LORA).map((part, i) =>
      i % 2 === 0 ? part
        : part.charCodeAt(0) < 0x1e00 || part.charCodeAt(0) > 0x1e9f
          ? <span key={i} lang="ar" style={{ fontFamily: FONT.arabic, fontStyle: "normal", fontSize: "1.25em", lineHeight: 0 }}>{part}</span>
          : <span key={i} style={{ fontFamily: `${FONT.arabic}, ${FONT.latin}` }}>{part}</span>)}
  </>
);

type Phrase = { text: string; start: number };
type Line = { ar: string; en: string; phrases: Phrase[]; end: number };
/** `file` is null in a draft: the script and the scenes are looked at before any voice says them. */
/** `refs`: what the lines rest on (the report the narration tells in its own words, the tafsir its meaning comes
 * from): a reference written small while they are said, never read (tools/trial/sources.py, `references`). */
export type Narration = { kind: "narration"; scene: string; start: number; seconds: number; file: string | null; lines: Line[]; refs?: { ar: string; en: string } };
/** `verses`: a passage (verses recited without a break, tools/trial/sources.py `passage`): where each verse starts
 * and ends among the words, and its translation. The pages turn between two verses. */
export type Verse = {
  kind: "verse"; scene: string; start: number; seconds: number; file: string;
  reference: string; text: string; en: string; words: WordTiming[]; credit: string;
  verses?: { en: string; first: number; last: number }[];
};
/** A hadith read by a real voice (the registry's recording); `file` is null in a draft when no reading is found yet. */
export type Reading = {
  kind: "reading"; scene: string; start: number; seconds: number; file: string | null;
  reference: string; text: string; en: string; credit: string;
};
type Segment = Narration | Verse | Reading;
/** How the filmed clip sits in the frame: where it is cropped, how far down (or up) it is moved to leave the
 * text its place, how dark, the colour behind it, where its horizon is (the picture grows around it). */
/** `veil`: how much of the dark veil behind the text is laid over the top of the clip (1 when not said; less for a
 * picture in full daylight, whose sky must stay a day sky). */
export type Picture = { position?: string; shift?: number; brightness?: number; ground?: string; horizon?: number; rate?: number; veil?: number };
export type TrialData = {
  trial: string; voice: string; voice_name: string; handle: string; handles?: Record<string, string>;
  clip: string; clip_seconds: number; picture?: Picture; seconds: number; segments: Segment[];
  /** The ambience under the narration, as long as the video and already silent under each verse (tools/trial/ambience.py). */
  ambience?: string;
  /** The 9:16 cover of the short: the scene it shows, its title in large, a tag above it. */
  cover?: { scene: string; title: string; tag: string; focus?: number; at?: number } | null;
};
/** `platform`: where the page has another name (TikTok: content/publish.yaml, `handles`), the video is signed with it. */
export type TrialProps = { trial: string; voice: string; platform?: string; data: TrialData | null };

export const TRIAL_FPS = 30;
export const trialMetadata: CalculateMetadataFunction<TrialProps> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile(`trial/${props.trial}-${props.voice}.json`), { signal: abortSignal });
  if (!res.ok) throw new Error(`public/trial/${props.trial}-${props.voice}.json is missing: run tools/trial/prepare.py`);
  const data = (await res.json()) as TrialData;
  return { durationInFrames: Math.ceil(data.seconds * TRIAL_FPS), props: { ...props, data } };
};

export const W = 1080;
export const H = 1920;
export const GOLD = "#ffcf6a";
export const SHADOW = "0 2px 24px rgba(4,7,20,.9), 0 0 60px rgba(4,7,20,.7)";
const FADE = 0.6;
/** Most words of a verse on screen at once: a long verse is shown page by page, as it is recited. */
const VERSE_PAGE = 14;

/** The filmed clip, played a little slower than life and looped with a cross-fade. */
export const Clip: React.FC<{ src: string; clipSeconds: number; picture: Picture }> = ({ src, clipSeconds, picture }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rate = picture.rate ?? 0.85;
  const shift = picture.shift ?? 0;
  const length = Math.floor((clipSeconds / rate) * fps) - 3;
  const cross = fps;
  const step = length - cross;
  const copies = Math.ceil(durationInFrames / step);
  // A clip moved down leaves its top edge in the frame (moved up: its bottom edge): it fades into the ground colour.
  const mask = shift > 0 ? "linear-gradient(180deg, transparent 0, #000 260px)" : shift < 0 ? "linear-gradient(0deg, transparent 0, #000 200px)" : undefined;
  return (
    <AbsoluteFill style={{ transform: `translateY(${shift}px)`, maskImage: mask, WebkitMaskImage: mask }}>
      {Array.from({ length: copies }, (_, i) => (
        <Sequence key={i} from={i * step} durationInFrames={length} layout="none">
          <OffthreadVideo
            muted
            src={staticFile(src)}
            playbackRate={rate}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: picture.position ?? "50% 50%",
              filter: `blur(1.5px) brightness(${picture.brightness ?? 0.8}) saturate(1.1)`,
              opacity: i === 0 ? 1 : interpolate(frame - i * step, [0, cross], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** How much of a scene shows at time t: scenes follow one another with a cross-fade. */
export const sceneOpacity = (segments: { scene: string; start: number }[], id: string, t: number) => {
  let shown = 0;
  let current: string | null = null;
  for (const seg of segments) {
    if (seg.scene === current) continue;
    const at = current === null ? -1 : seg.start - 0.2;
    const p = interpolate(t, [at - FADE / 2, at + FADE / 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    shown = seg.scene === id ? Math.max(shown, p) : shown * (1 - p);
    current = seg.scene;
  }
  return shown;
};

/** What a short draws over its clip. `show(id)`: how much of that scene is there now; `since(id)`: when it first came. */
export type Drawn = React.FC<{ t: number; show: (id: string) => number; since: (id: string) => number; horizon: number }>;

/** The boat (18:71, 18:79): `holed` close, `fleet` the king's ships behind it, `sail` going on its way, `sea` the sea alone;
 * `bird`: the sparrow of the hadith on its edge, before anything was torn (a scene of the film, shown by its vertical version). */
const BoatPicture: Drawn = ({ t, show, since, horizon }) => (
  <>
    <g opacity={show("fleet")}>
      <Fleet horizon={horizon} t={t} />
      <Boat id="b-fleet" x={370} y={1235} scale={0.56} t={t} holed splash={false} plank={false} />
    </g>
    <g opacity={show("holed")}>
      <Boat id="b-holed" x={500} y={1185} scale={0.72} t={t} holed splash />
    </g>
    <g opacity={show("bird")}>
      <Boat id="b-bird" x={500} y={1185} scale={0.72} t={t} holed={false} splash={false} plank={false} bird />
    </g>
    <g opacity={show("sail")}>
      <Boat id="b-sail" x={560 - 4 * Math.max(0, t - since("sail"))} y={1170} scale={0.66} t={t} holed splash={false} plank={false} />
    </g>
  </>
);

/** The boy (18:74, 18:80-81): nobody is drawn. `home`: the parents' house under the moon, one window lit;
 * `given`: a second light (18:81, what they are given in his place); `far`: the house from afar; `sky`: the land alone. */
const HomePicture: Drawn = ({ t, show, horizon }) => (
  <>
    <Land id="l-home" horizon={horizon} rim="#9fb6e6" path />
    <g opacity={show("home")}>
      <House id="h-home" x={340} y={horizon + 34} scale={1} t={t} lights={1} />
    </g>
    <g opacity={show("given")}>
      <House id="h-given" x={340} y={horizon + 34} scale={1} t={t} lights={2} />
    </g>
    <g opacity={show("far")}>
      <House id="h-far" x={300} y={horizon + 22} scale={0.52} t={t} lights={2} />
    </g>
  </>
);

/** The wall (18:77, 18:82): `leaning` in a town with no light at its windows; `raised`; `treasure`: the
 * glow of what lies under it; `far`: the wall from afar, the glow still there; `land`: the land alone. */
const WallPicture: Drawn = ({ t, show, horizon }) => (
  <>
    <g opacity={Math.max(show("leaning"), show("raised"), show("treasure"))}>
      <Village horizon={horizon} />
    </g>
    <Land id="l-wall" horizon={horizon + 16} rim="#ffbe7a" />
    <g opacity={show("leaning")}>
      <Wall id="w-leaning" x={600} y={horizon + 40} scale={1} t={t} leaning />
    </g>
    <g opacity={show("raised")}>
      <Wall id="w-raised" x={600} y={horizon + 40} scale={1} t={t} />
    </g>
    <g opacity={show("treasure")}>
      <Wall id="w-treasure" x={600} y={horizon + 40} scale={1} t={t} treasure />
    </g>
    <g opacity={show("far")}>
      <Wall id="w-far" x={560} y={horizon + 34} scale={0.5} t={t} treasure />
    </g>
  </>
);

/** The du'a, first call (21:83-84): a house alone at dawn. `dark`: no light at its windows; `call`: one window lit;
 * `lit`: every window lit, and another house beside it (his family, and as many again); `land`: the land alone. */
const AskedPicture: Drawn = ({ t, show, horizon }) => (
  <>
    <Land id="l-asked" horizon={horizon} rim="#ffc98a" />
    <g opacity={show("lit")}>
      <House id="a-more" x={900} y={horizon + 4} scale={0.5} t={t + 3} lights={2} rim="#ffc98a" />
    </g>
    <g opacity={show("dark")}>
      <House id="a-dark" x={470} y={horizon + 34} scale={1} t={t} lights={0} rim="#ffc98a" />
    </g>
    <g opacity={show("call")}>
      <House id="a-call" x={470} y={horizon + 34} scale={1} t={t} lights={1} rim="#ffc98a" />
    </g>
    <g opacity={show("lit")}>
      <House id="a-lit" x={470} y={horizon + 34} scale={1} t={t} lights={2} rim="#ffc98a" />
    </g>
  </>
);

/** The du'a, second call (21:87-88, 37:143-144): the sea, and nobody. `deep`: the dark closes on the tail of the
 * great fish going down; `light`: a light under the water, where the call comes from; `shore`, `sea`: the sea alone. */
const WrittenPicture: Drawn = ({ t, show, since, horizon }) => {
  const dark = Math.max(show("deep"), show("light"));
  return (
    <>
      <rect x={-60} y={-60} width={W + 120} height={H + 120} fill="#02030a" opacity={0.42 * dark} />
      <g opacity={show("light")}>
        <Call id="w-call" x={560} y={horizon + 170} t={t} />
      </g>
      <g opacity={show("deep")}>
        <Whale id="w-deep" x={560} y={horizon + 150} scale={1.5} t={t} sink={Math.min(1, Math.max(0, (t - since("deep") - 9) / 14))} />
      </g>
    </>
  );
};

/** The du'a, third call (19:4, 21:89-90): the place where he prays, under the stars. `niche`: its lamp; `two`: a
 * second light beside it (what he is given); `far`: the same from afar; `sky`: the land alone. */
const WaitedPicture: Drawn = ({ t, show, horizon }) => (
  <>
    <Land id="l-waited" horizon={horizon} rim="#9fb6e6" path />
    <g opacity={show("niche")}>
      <Niche id="n-niche" x={340} y={horizon + 34} scale={1} t={t} lights={1} />
    </g>
    <g opacity={show("two")}>
      <Niche id="n-two" x={340} y={horizon + 34} scale={1} t={t} lights={2} />
    </g>
    <g opacity={show("far")}>
      <Niche id="n-far" x={300} y={horizon + 22} scale={0.52} t={t} lights={2} />
    </g>
  </>
);

const both = (a: number, b: number) => Math.min(1, a + b);

/** Dhul-Qarnayn, the west (18:86-88): a people is its dwellings by the water where the sun goes down. `sun`,
 * `choice`: dark, their fate not yet said; `just`: lit, each one treated as he deserves; `land`: the lake alone. */
const WestPicture: Drawn = ({ t, show, horizon }) => (
  <>
    <Land id="l-west" horizon={horizon} rim="#ffc98a" />
    <g opacity={both(show("sun"), show("choice"))}>
      <Dwellings id="d-dark" x={470} y={horizon + 36} scale={1.02} t={t} lit={0} />
    </g>
    <g opacity={show("just")}>
      <Dwellings id="d-just" x={470} y={horizon + 36} scale={1.02} t={t} lit={5} />
    </g>
  </>
);

/** Dhul-Qarnayn, the tribute refused (18:93-95): the filmed gorge is the pass between the two mountains. `pass`:
 * the dwellings of the people at its foot; `offer`: the chest they offer, open; `refused`: the chest closed and
 * left aside, the first blocks of iron laid by their hands; `land`: the gorge alone. */
const TributePicture: Drawn = ({ t, show, since, horizon }) => (
  <>
    <Land id="l-tribute" horizon={horizon} rim="#cfd8e6" />
    <g opacity={Math.min(1, show("pass") + show("offer") + show("refused"))}>
      <Dwellings id="d-pass" x={270} y={horizon + 30} scale={0.6} t={t} lit={2} rim="#cfd8e6" />
    </g>
    <g opacity={show("offer")}>
      <Chest id="c-offer" x={610} y={horizon + 150} scale={1.3} t={t} open />
    </g>
    <g opacity={show("refused")}>
      <Chest id="c-left" x={610} y={horizon + 150} scale={1.3} t={t} open={false} />
      <Barrier id="b-first" x={900} y={horizon + 70} span={270} full={216} level={Math.min(1, Math.max(0, (t - since("refused") - 1.5) / 9))} heat={0} copper={0} t={t} rim="#cfd8e6" />
    </g>
  </>
);

/** Dhul-Qarnayn, the barrier (18:96-98): two walls of rock, and what is built between them. `blocks`: the courses
 * of iron going up; `fire`: the fire blown, the copper run into the joints; `done`, `land`: the barrier standing. */
const BarrierPicture: Drawn = ({ t, show, since, horizon }) => {
  const ground = horizon + 46;
  // The walls stand lower than the text and leave the filmed mist above them; the barrier is laid from one to
  // the other (the rock covers its ends) up to their shoulders; the fire lights the faces that look into the pass.
  const wall = { x: 540, y: ground, span: 640, full: 540, t, rim: "#b9c6e6" };
  const fire = show("fire") * Math.min(1, Math.max(0, t - since("fire")) / 3);
  const rock = <Cliffs id="k-barrier" horizon={horizon} middle={540} gap={400} height={600} rim="#b9c6e6" glow={fire} />;
  return (
    <>
      <g opacity={show("blocks")}>
        <Barrier id="b-rise" {...wall} level={Math.min(1, 0.3 + Math.max(0, t - since("blocks")) / 14)} heat={0} copper={0} />
      </g>
      <g opacity={show("fire")}>
        <Barrier id="b-fire" {...wall} level={1} heat={Math.min(1, Math.max(0, t - since("fire")) / 3)} copper={Math.min(1, Math.max(0, t - since("fire") - 7) / 9)} />
      </g>
      <g opacity={both(show("done"), show("land"))}>
        <Barrier id="b-done" {...wall} level={1} heat={0} copper={1} />
      </g>
      {rock}
      <Land id="l-barrier" horizon={horizon + 30} rim="#b9c6e6" />
    </>
  );
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** « آية وحكايتها », the caravan (62:11), at midday (the Friday prayer): where the sermon is given, in full daylight
 * (`sermon`: palm trunks, a roof of leaves, the steps of a minbar); the loaded camels come in while the verse is
 * recited and tracks leave the shade for them (`caravan`, `twelve`); any other scene (`phone`): the desert alone, the
 * viewer's own day. Nobody is drawn, and nothing counts those who left: the report gives only the twelve who stayed. */
const CaravanPicture: Drawn = ({ t, show, since, horizon }) => {
  const came = Math.max(show("caravan"), show("twelve"));
  const there = Math.max(show("sermon"), came);
  const sinceCaravan = t - since("caravan");
  const enter = interpolate(sinceCaravan, [0, 7], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const left = interpolate(sinceCaravan, [3, 17], [0, 1], CLAMP);
  const y = horizon + 30;
  return (
    <>
      <g opacity={there}>
        <Land id="l-caravan" horizon={horizon} rim="#fff0d2" top="#a48a5e" />
        <g opacity={came}>
          <Footprints shown={left} trails={[
            { from: [520, y + 22], to: [150, y + 58], bend: 10 }, { from: [640, y + 30], to: [250, y + 84], bend: 14 },
            { from: [760, y + 24], to: [60, y + 96], bend: 20 }, { from: [860, y + 36], to: [330, y + 112], bend: 12 },
            { from: [960, y + 28], to: [180, y + 128], bend: 22 }, { from: [580, y + 44], to: [20, y + 74], bend: 8 },
          ]} />
        </g>
        <Sermon id="s-caravan" x={452} y={y} scale={0.98} rim="#fff0d2" />
      </g>
      <g opacity={came}>
        <Caravan id="c-caravan" x={470 - 560 * (1 - enter)} y={y} scale={0.7} t={t} count={3} right rim="#fff0d2" />
      </g>
    </>
  );
};

/** « آية وحكايتها », Ad-Duha (93:1-8): a still night over a dark house (`night`: a veil and its stars); the veil
 * lifts and the filmed dawn is there (`dawn`); then three lights, one for each thing the surah recalls, each when
 * its verse is recited (`day`: the house lit, a shelter; a lantern, a guidance; a palm heavy with dates, a
 * provision). They stay lit when the night comes back. */
const DuhaPicture: Drawn = ({ t, show, since, horizon }) => {
  const night = show("night");
  const day = t - since("day");
  const lit = (at: number) => interpolate(day, [at, at + 1.4], [0, 1], CLAMP);
  return (
    <>
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="#03050f" opacity={0.6 * night} />
      <Stars t={t} night={night} />
      <Land id="l-duha" horizon={horizon} rim="#ffb9a0" />
      <g opacity={1 - lit(0)}>
        <House id="d-dark" x={250} y={horizon + 40} scale={0.78} t={t} lights={0} rim="#ffb9a0" />
      </g>
      <g opacity={lit(0)}>
        <House id="d-lit" x={250} y={horizon + 40} scale={0.78} t={t} lights={1} rim="#ffb9a0" />
      </g>
      <Lantern id="d-lantern" x={590} y={horizon + 28} scale={0.95} t={t} lit={lit(4.2)} rim="#ffb9a0" />
      <Palm id="d-palm" x={880} y={horizon + 16} scale={0.95} t={t} fruit={lit(9.16)} rim="#ffb9a0" />
    </>
  );
};

/** « آية وحكايتها », Az-Zumar 39:53: a road in the dark, a gate at its end, closed (`road`); the rain comes
 * (`rain`, while the verse is recited and its meaning said); the gate opens and its light pours down the road
 * (`gate`). Nobody on the road: the viewer is the one who comes back. */
const HopePicture: Drawn = ({ t, show, horizon }) => (
  <>
    <Land id="l-hope" horizon={horizon} rim="#9fb6e6" path />
    <Gate id="g-hope" x={490} y={horizon + 24} scale={0.92} t={t} open={show("gate")} />
    <g opacity={show("rain")}>
      <Rain t={t} />
    </g>
  </>
);

export const PICTURES: Record<string, Drawn> = {
  boat: BoatPicture, boy: HomePicture, wall: WallPicture,
  asked: AskedPicture, written: WrittenPicture, waited: WaitedPicture,
  west: WestPicture, tribute: TributePicture, barrier: BarrierPicture,
  caravan: CaravanPicture, duha: DuhaPicture, hope: HopePicture,
};

/** What a short draws above its veil, under its texts, outside the slowly growing picture: a timeline, a badge,
 * anything that must not move. None by default; a short registers its own here. */
export const OVERLAYS: Record<string, Drawn> = {};

const hasLetter = (token: string) => /\p{L}/u.test(token);
export const fit = (base: number, text: string, comfortable: number) => Math.round(base * Math.min(1, Math.sqrt(comfortable / Math.max(1, text.length))));

/** Where the texts sit in the frame: the column of the Arabic text (the whole width of a short, the side of
 * the frame the picture leaves free in the 16:9 film), the translation under the picture, the credit. */
export type Layout = {
  width: number; left: number; right: number;
  /** A narration line: its top, its largest size, the most height it may take. */
  top: number; size: number; height: number;
  /** A verse: the top of its reference, its largest size, the length it is comfortable at that size. */
  verseTop: number; verseSize: number; verseComfortable: number;
  /** The translation: `rows`, the most rows it may take before the bottom of the frame (it is written smaller to fit). */
  sub: { top: number; left: number; right: number; size: number; rows?: number };
  credit: { top: number; size: number };
  /** The length a hadith's text is comfortable at, at its largest size (90 when not said: the film). */
  readingComfortable?: number;
};
export const PORTRAIT: Layout = {
  width: W, left: 70, right: 70, top: 340, size: 104, height: 450, verseTop: 316, verseSize: 66, verseComfortable: 150,
  sub: { top: 1490, left: 80, right: 80, size: 44 }, credit: { top: 1716, size: 30 }, readingComfortable: 120,
};

/** A short that needs its texts elsewhere (a timeline above the picture, a narrower column) says so here: what it
 * gives is merged over PORTRAIT (`sub` and `credit` one level deeper, so that `sub: { top }` keeps the rest). */
export type LayoutOverride = Omit<Partial<Layout>, "sub" | "credit"> & { sub?: Partial<Layout["sub"]>; credit?: Partial<Layout["credit"]> };
export const LAYOUTS: Record<string, LayoutOverride> = {};
const layoutOf = (trial: string): Layout => {
  const own = LAYOUTS[trial];
  return own ? { ...PORTRAIT, ...own, sub: { ...PORTRAIT.sub, ...own.sub }, credit: { ...PORTRAIT.credit, ...own.credit } } : PORTRAIT;
};

/** The largest size at which the phrases of a line, each on its own row (a long one on two), stay above
 * the picture: at most 450 px of text under the top margin. A letter of the bold Arabic face is about 0.41 em wide. */
const narrationSize = (phrases: string[], layout: Layout) => {
  const width = layout.width - layout.left - layout.right;
  for (let size = layout.size; size > 50; size -= 2) {
    const rows = phrases.reduce((n, text) => n + Math.ceil((text.length * 0.41 * size) / width), 0);
    if (rows * size * 1.5 <= layout.height) return size;
  }
  return 50;
};

/** The size of a translation: the layout's, or smaller when the line would take more rows than the layout has
 * under it (the film has two before the bottom of the frame). A letter of the italic Latin face is about 0.49 em wide;
 * 8 % is kept for the words that do not fill their row. */
const subSize = (text: string, layout: Layout) => {
  if (!layout.sub.rows) return layout.sub.size;
  const width = layout.width - layout.sub.left - layout.sub.right;
  return Math.min(layout.sub.size, Math.floor((layout.sub.rows * width * 0.92) / (0.49 * Math.max(1, text.length))));
};

/** A formula of blessing is never cut between two rows: its spaces do not break (seen on the first frame of a
 * short, 2026-11-12: « صلى الله عليه » on one row and « وسلم » on the next). */
const FORMULAS = ["صلى الله عليه وسلم", "عليه السلام", "عليهم السلام", "رضي الله عنه", "رضي الله عنها", "رضي الله عنهم"];
const whole = (text: string) => FORMULAS.reduce((out, formula) => out.split(formula).join(formula.replace(/ /g, " ")), text);

export const NarrationText: React.FC<{ seg: Narration; t: number; last: boolean; handle: string; layout?: Layout }> = ({ seg, t, last, handle, layout = PORTRAIT }) => {
  const { fps } = useVideoConfig();
  const local = t - seg.start;
  const index = seg.lines.findIndex((l, i) => local < l.end || i === seg.lines.length - 1);
  const line = seg.lines[index];
  const lineStart = line.phrases[0].start;
  const lineEnd = index === seg.lines.length - 1 ? seg.seconds + (last ? 5 : 0.25) : line.end;
  // The first line of the video is written on its first frame, before the voice: it is what stops the thumb.
  const opening = seg.start < 1 && index === 0;
  const show = interpolate(local, [opening ? -10 : lineStart - 0.25, opening ? -9 : lineStart - 0.05, lineEnd - 0.2, lineEnd], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const size = narrationSize(line.phrases.map((p) => p.text), layout);
  return (
    <>
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: layout.top, left: layout.left, right: layout.right, textAlign: "center", opacity: show, fontFamily: FONT.arabic, fontWeight: 700, fontSize: size, lineHeight: 1.5, color: "#fff", textShadow: SHADOW }}>
        {line.phrases.map((phrase, i) => {
          // The very first phrase of the video is on its first frame; the others come as the voice reaches them.
          const first = opening && i === 0;
          const k = first ? 1 : spring({ frame: Math.round((local - phrase.start + 0.1) * fps), fps, config: { damping: 200 }, durationInFrames: 8 });
          const point = line.phrases.length > 1 && i === line.phrases.length - 1;
          return (
            <div key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * 18}px)`, color: point ? GOLD : "#fff", textWrap: "balance" }}>
              {whole(phrase.text)}
            </div>
          );
        })}
        {/* The last line of the short is its call to follow: the page to follow is written under it, large. */}
        {last && handle && index === seg.lines.length - 1 ? (
          <div dir="ltr" style={{ display: "inline-block", marginTop: 34, padding: "10px 44px", borderRadius: 999, border: `3px solid ${GOLD}`, background: "rgba(4,7,20,.55)", fontFamily: FONT.latin, fontWeight: 600, fontSize: 50, lineHeight: 1.4, color: GOLD, textShadow: "none", opacity: interpolate(local, [lineStart + 0.2, lineStart + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            {handle}
          </div>
        ) : null}
      </div>
      <div lang="en" style={{ position: "absolute", top: layout.sub.top, left: layout.sub.left, right: layout.sub.right, textAlign: "center", opacity: show, fontFamily: ENGLISH, fontStyle: "italic", fontSize: subSize(line.en, layout), lineHeight: 1.4, color: "rgba(255,255,255,.92)", textShadow: SHADOW, textWrap: "balance" }}>
        <English text={line.en} />
      </div>
      {/* What these lines rest on, where a verse has its credit: there for the whole segment, not line by line. */}
      {seg.refs ? (
        <div style={{ position: "absolute", top: layout.credit.top, left: layout.left, right: layout.right, textAlign: "center", fontSize: layout.credit.size, color: "rgba(255,255,255,.62)", textShadow: SHADOW, opacity: interpolate(local, [0, 0.4, seg.seconds - 0.1, seg.seconds + 0.25], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <span dir="rtl" lang="ar" style={{ fontFamily: FONT.arabic, fontSize: layout.credit.size * 1.15 }}>{seg.refs.ar}</span>
          <span style={{ fontFamily: FONT.latin }}>{`  ·  ${seg.refs.en}`}</span>
        </div>
      ) : null}
    </>
  );
};

export const VerseText: React.FC<{ seg: Verse; t: number; layout?: Layout }> = ({ seg, t, layout = PORTRAIT }) => {
  const local = t - seg.start;
  const show = interpolate(local, [-0.3, 0.1, seg.seconds - 0.1, seg.seconds + 0.3], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const active = seg.words.find((w) => local >= w.start && local < w.end)?.position;
  let position = 0;
  const tokens = seg.text.split(/\s+/).map((token) => ({ token, position: hasLetter(token) ? ++position : null }));
  // A long verse is shown page by page (pages of the same size), each one from the moment its first word is recited.
  // A passage turns its pages between two verses: whole verses, pages of about the same size.
  const count = position;
  const firsts: number[] = [1];                // the first word of each page of a passage
  let onPage = 0;
  const even = count / Math.ceil(count / VERSE_PAGE);       // pages of about the same size
  for (const v of seg.verses ?? []) {
    const size = v.last - v.first + 1;
    if (onPage > 0 && (onPage + size > VERSE_PAGE || onPage >= even)) {
      firsts.push(v.first);
      onPage = 0;
    }
    onPage += size;
  }
  const pages = seg.verses ? firsts.length : Math.ceil(count / VERSE_PAGE);
  const perPage = Math.ceil(count / pages);
  const pageOf = (p: number) => (seg.verses ? firsts.filter((f) => f <= p).length - 1 : Math.min(pages - 1, Math.floor((p - 1) / perPage)));
  const firstOf = (k: number) => (seg.verses ? firsts[k] : k * perPage + 1);
  const reached = [...seg.words].reverse().find((w) => local >= w.start)?.position ?? 1;
  const page = pageOf(reached);
  let lastPosition = 1;
  const shown = tokens.filter(({ position: p }) => {
    lastPosition = p ?? lastPosition;          // a mark with no letter (۞, a pause sign) stays with the word before it
    return pageOf(lastPosition) === page;
  });
  const pageStart = page === 0 ? -1 : seg.words.find((w) => w.position === firstOf(page))?.start ?? 0;
  const turn = interpolate(local, [pageStart - 0.05, pageStart + 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const longestPage = Math.max(...Array.from({ length: pages }, (_, k) => tokens.filter(({ position: p }) => p !== null && pageOf(p) === k).reduce((n, x) => n + x.token.length + 1, 0)));
  // The translation in short chunks, each starting with the recited word at the same place in the verse.
  // In a passage each verse has its own translation, cut the same way among its own words.
  const cues = (seg.verses ?? [{ en: seg.en, first: 1, last: seg.words.length }]).flatMap((verse, n) => {
    const words = seg.words.filter((w) => w.position >= verse.first && w.position <= verse.last);
    const chunks = subtitleChunks(verse.en);
    const total = chunks.reduce((sum, c) => sum + c.length, 0) || 1;
    let done = 0;
    return chunks.map((text) => {
      const word = words[Math.min(words.length - 1, Math.floor((words.length * done) / total))];
      const start = done === 0 ? (n === 0 ? 0 : (words[0]?.start ?? 0)) : (word?.start ?? 0);
      done += text.length;
      return { text, start };
    });
  });
  const cue = [...cues].reverse().find((c) => local >= c.start) ?? cues[0];
  return (
    <div style={{ opacity: show }}>
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: layout.verseTop, left: layout.left, right: layout.right, textAlign: "center", fontFamily: FONT.arabic, fontSize: 34, color: "rgba(255,255,255,.72)", textShadow: SHADOW }}>
        {seg.reference}
      </div>
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: layout.verseTop + 50, left: layout.left - 6, right: layout.right - 6, textAlign: "center", opacity: turn, fontFamily: FONT.quran, fontSize: fit(layout.verseSize, "x".repeat(longestPage), layout.verseComfortable), lineHeight: 1.95, color: "#fff", textShadow: SHADOW, textWrap: "balance" }}>
        {shown.map(({ token, position: p }, i) => (
          <Fragment key={`${page}-${i}`}>
            {i > 0 ? " " : null}
            <span style={{ color: p !== null && p === active ? GOLD : "#fff" }}>{token}</span>
          </Fragment>
        ))}
      </div>
      <div lang="en" style={{ position: "absolute", top: layout.sub.top, left: layout.sub.left, right: layout.sub.right, textAlign: "center", fontFamily: ENGLISH, fontStyle: "italic", fontSize: layout.sub.size, lineHeight: 1.4, color: "rgba(255,255,255,.92)", textShadow: SHADOW, textWrap: "balance" }}>
        <English text={cue.text} />
      </div>
      <div style={{ position: "absolute", top: layout.credit.top, left: layout.left, right: layout.right, textAlign: "center", fontFamily: FONT.latin, fontSize: layout.credit.size, color: "rgba(255,255,255,.62)", textShadow: SHADOW }}>
        {seg.credit}
      </div>
    </div>
  );
};

/** A hadith read by a real voice: its words between « », its reference above, the reader and the translator under. */
export const ReadingText: React.FC<{ seg: Reading; t: number; layout?: Layout }> = ({ seg, t, layout = PORTRAIT }) => {
  const local = t - seg.start;
  const show = interpolate(local, [-0.3, 0.1, seg.seconds - 0.1, seg.seconds + 0.3], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The translation in short chunks, each for its share of the reading (there are no word times for a reader).
  const chunks = subtitleChunks(seg.en);
  const total = chunks.reduce((n, c) => n + c.length, 0) || 1;
  let done = 0;
  const cue = chunks.find((c) => (done += c.length) / total > local / seg.seconds) ?? chunks[chunks.length - 1];
  // A hadith of a few words (« الدعاء هو العبادة ») is read in under two seconds: written large, it is read at a glance.
  const brief = seg.text.replace(/[^\u0621-\u064A]/g, "").length <= 24;
  return (
    <div style={{ opacity: show }}>
      <div style={{ position: "absolute", top: layout.verseTop, left: layout.left, right: layout.right, textAlign: "center", fontFamily: FONT.latin, fontSize: 30, color: "rgba(255,255,255,.72)", textShadow: SHADOW }}>
        {seg.reference}
      </div>
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: layout.verseTop + 56, left: layout.left, right: layout.right, textAlign: "center", fontFamily: FONT.arabic, fontSize: brief ? 96 : fit(64, seg.text, layout.readingComfortable ?? 90), lineHeight: 1.8, color: "#fff", textShadow: SHADOW, textWrap: "balance" }}>
        « {seg.text} »
      </div>
      <div lang="en" style={{ position: "absolute", top: layout.sub.top, left: layout.sub.left, right: layout.sub.right, textAlign: "center", fontFamily: ENGLISH, fontStyle: "italic", fontSize: layout.sub.size, lineHeight: 1.4, color: "rgba(255,255,255,.92)", textShadow: SHADOW, textWrap: "balance" }}>
        <English text={cue} />
      </div>
      <div style={{ position: "absolute", top: layout.credit.top, left: layout.left, right: layout.right, textAlign: "center", fontFamily: FONT.latin, fontSize: layout.credit.size, color: "rgba(255,255,255,.62)", textShadow: SHADOW }}>
        {seg.credit}
      </div>
    </div>
  );
};

export const Trial: React.FC<TrialProps> = ({ data, platform }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  if (!data) throw new Error("no trial data: calculateMetadata did not run");
  // A platform with no name of its own in `handles` fails the render rather than sign with the wrong account.
  const handle = platform ? data.handles?.[platform] : data.handle;
  if (!handle) throw new Error(`no handle for the platform « ${platform} » (content/publish.yaml, handles)`);
  const t = frame / fps;
  const picture = data.picture ?? {};
  const horizon = picture.horizon ?? 1300;
  const Drawing = PICTURES[data.trial];
  if (!Drawing) throw new Error(`no picture is drawn for the trial « ${data.trial} »`);
  const Overlay = OVERLAYS[data.trial];
  const layout = layoutOf(data.trial);
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.07]);
  const current = [...data.segments].reverse().find((s) => t >= s.start - 0.3) ?? data.segments[0];
  const show = (id: string) => sceneOpacity(data.segments, id, t);
  const since = (id: string) => data.segments.find((s) => s.scene === id)?.start ?? 0;
  return (
    <AbsoluteFill style={{ background: picture.ground ?? "#04070f" }}>
      {/* the picture: it grows slowly around the horizon, the texts never move */}
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `50% ${(horizon / H) * 100}%` }}>
        <Clip src={data.clip} clipSeconds={data.clip_seconds} picture={picture} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <Drawing t={t} show={show} since={since} horizon={horizon} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(4,7,20,${0.78 * (picture.veil ?? 1)}) 0%, rgba(4,7,20,${0.45 * (picture.veil ?? 1)}) 30%, rgba(4,7,20,.05) 52%, rgba(4,7,20,.38) 100%)` }} />
      {Overlay ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <Overlay t={t} show={show} since={since} horizon={horizon} />
        </svg>
      ) : null}
      {data.ambience ? <Html5Audio src={staticFile(data.ambience)} /> : null}
      {data.segments.map((seg, i) =>
        seg.file ? (
          <Sequence key={i} from={Math.round(seg.start * fps)} durationInFrames={Math.ceil(seg.seconds * fps) + 2} layout="none">
            <Html5Audio src={staticFile(seg.file)} />
          </Sequence>
        ) : null,
      )}
      {current.kind === "narration" ? (
        <NarrationText seg={current} t={t} last={current === data.segments[data.segments.length - 1]} handle={handle} layout={layout} />
      ) : current.kind === "verse" ? (
        <VerseText seg={current} t={t} layout={layout} />
      ) : (
        <ReadingText seg={current} t={t} layout={layout} />
      )}
      <div style={{ position: "absolute", top: 250, right: 90, fontFamily: FONT.latin, fontWeight: 600, fontSize: 30, color: GOLD, opacity: 0.9, textShadow: SHADOW }}>
        {handle}
      </div>
    </AbsoluteFill>
  );
};
