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
import { Boat, Fleet } from "./Boat";
import { House, Land } from "./Home";
import { Village, Wall } from "./Wall";

loadFonts();

type Phrase = { text: string; start: number };
type Line = { ar: string; en: string; phrases: Phrase[]; end: number };
/** `file` is null in a draft: the script and the scenes are looked at before any voice says them. */
type Narration = { kind: "narration"; scene: string; start: number; seconds: number; file: string | null; lines: Line[] };
type Verse = {
  kind: "verse"; scene: string; start: number; seconds: number; file: string;
  reference: string; text: string; en: string; words: WordTiming[]; credit: string;
};
type Segment = Narration | Verse;
/** How the filmed clip sits in the frame: where it is cropped, how far down (or up) it is moved to leave the
 * text its place, how dark, the colour behind it, where its horizon is (the picture grows around it). */
type Picture = { position?: string; shift?: number; brightness?: number; ground?: string; horizon?: number; rate?: number };
export type TrialData = {
  trial: string; voice: string; voice_name: string; handle: string;
  clip: string; clip_seconds: number; picture?: Picture; seconds: number; segments: Segment[];
};
export type TrialProps = { trial: string; voice: string; data: TrialData | null };

export const TRIAL_FPS = 30;
export const trialMetadata: CalculateMetadataFunction<TrialProps> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile(`trial/${props.trial}-${props.voice}.json`), { signal: abortSignal });
  if (!res.ok) throw new Error(`public/trial/${props.trial}-${props.voice}.json is missing: run tools/trial/prepare.py`);
  const data = (await res.json()) as TrialData;
  return { durationInFrames: Math.ceil(data.seconds * TRIAL_FPS), props: { ...props, data } };
};

const W = 1080;
const H = 1920;
const GOLD = "#ffcf6a";
const SHADOW = "0 2px 24px rgba(4,7,20,.9), 0 0 60px rgba(4,7,20,.7)";
const FADE = 0.6;
/** Most words of a verse on screen at once: a long verse is shown page by page, as it is recited. */
const VERSE_PAGE = 14;

/** The filmed clip, played a little slower than life and looped with a cross-fade. */
const Clip: React.FC<{ src: string; clipSeconds: number; picture: Picture }> = ({ src, clipSeconds, picture }) => {
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
const sceneOpacity = (segments: Segment[], id: string, t: number) => {
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
type Drawn = React.FC<{ t: number; show: (id: string) => number; since: (id: string) => number; horizon: number }>;

/** The boat (18:71, 18:79): `holed` close, `fleet` the king's ships behind it, `sail` going on its way, `sea` the sea alone. */
const BoatPicture: Drawn = ({ t, show, since, horizon }) => (
  <>
    <g opacity={show("fleet")}>
      <Fleet horizon={horizon} t={t} />
      <Boat id="b-fleet" x={370} y={1235} scale={0.56} t={t} holed splash={false} plank={false} />
    </g>
    <g opacity={show("holed")}>
      <Boat id="b-holed" x={500} y={1185} scale={0.72} t={t} holed splash />
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

const PICTURES: Record<string, Drawn> = { boat: BoatPicture, boy: HomePicture, wall: WallPicture };

const hasLetter = (token: string) => /\p{L}/u.test(token);
const fit = (base: number, text: string, comfortable: number) => Math.round(base * Math.min(1, Math.sqrt(comfortable / Math.max(1, text.length))));

/** The largest size at which the phrases of a line, each on its own row (a long one on two), stay above
 * the picture: at most 450 px of text under the top margin. A letter of the bold Arabic face is about 0.41 em wide. */
const narrationSize = (phrases: string[]) => {
  for (let size = 104; size > 50; size -= 2) {
    const rows = phrases.reduce((n, text) => n + Math.ceil((text.length * 0.41 * size) / (W - 140)), 0);
    if (rows * size * 1.5 <= 450) return size;
  }
  return 50;
};

const NarrationText: React.FC<{ seg: Narration; t: number; last: boolean; handle: string }> = ({ seg, t, last, handle }) => {
  const { fps } = useVideoConfig();
  const local = t - seg.start;
  const index = seg.lines.findIndex((l, i) => local < l.end || i === seg.lines.length - 1);
  const line = seg.lines[index];
  const lineStart = line.phrases[0].start;
  const lineEnd = index === seg.lines.length - 1 ? seg.seconds + (last ? 5 : 0.25) : line.end;
  // The first line of the video is written on its first frame, before the voice: it is what stops the thumb.
  const opening = seg.start < 1 && index === 0;
  const show = interpolate(local, [opening ? -10 : lineStart - 0.25, opening ? -9 : lineStart - 0.05, lineEnd - 0.2, lineEnd], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const size = narrationSize(line.phrases.map((p) => p.text));
  return (
    <>
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: 340, left: 70, right: 70, textAlign: "center", opacity: show, fontFamily: FONT.arabic, fontWeight: 700, fontSize: size, lineHeight: 1.5, color: "#fff", textShadow: SHADOW }}>
        {line.phrases.map((phrase, i) => {
          // The very first phrase of the video is on its first frame; the others come as the voice reaches them.
          const first = opening && i === 0;
          const k = first ? 1 : spring({ frame: Math.round((local - phrase.start + 0.1) * fps), fps, config: { damping: 200 }, durationInFrames: 8 });
          const point = line.phrases.length > 1 && i === line.phrases.length - 1;
          return (
            <div key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * 18}px)`, color: point ? GOLD : "#fff", textWrap: "balance" }}>
              {phrase.text}
            </div>
          );
        })}
        {/* The last line of the short is its call to follow: the page to follow is written under it, large. */}
        {last && index === seg.lines.length - 1 ? (
          <div dir="ltr" style={{ display: "inline-block", marginTop: 34, padding: "10px 44px", borderRadius: 999, border: `3px solid ${GOLD}`, background: "rgba(4,7,20,.55)", fontFamily: FONT.latin, fontWeight: 600, fontSize: 50, lineHeight: 1.4, color: GOLD, textShadow: "none", opacity: interpolate(local, [lineStart + 0.2, lineStart + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            {handle}
          </div>
        ) : null}
      </div>
      <div lang="en" style={{ position: "absolute", top: 1490, left: 80, right: 80, textAlign: "center", opacity: show, fontFamily: FONT.latin, fontStyle: "italic", fontSize: 44, lineHeight: 1.4, color: "rgba(255,255,255,.92)", textShadow: SHADOW, textWrap: "balance" }}>
        {line.en}
      </div>
    </>
  );
};

const VerseText: React.FC<{ seg: Verse; t: number }> = ({ seg, t }) => {
  const local = t - seg.start;
  const show = interpolate(local, [-0.3, 0.1, seg.seconds - 0.1, seg.seconds + 0.3], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const active = seg.words.find((w) => local >= w.start && local < w.end)?.position;
  let position = 0;
  const tokens = seg.text.split(/\s+/).map((token) => ({ token, position: hasLetter(token) ? ++position : null }));
  // A long verse is shown page by page (pages of the same size), each one from the moment its first word is recited.
  const count = position;
  const pages = Math.ceil(count / VERSE_PAGE);
  const perPage = Math.ceil(count / pages);
  const pageOf = (p: number) => Math.min(pages - 1, Math.floor((p - 1) / perPage));
  const reached = [...seg.words].reverse().find((w) => local >= w.start)?.position ?? 1;
  const page = pageOf(reached);
  let lastPosition = 1;
  const shown = tokens.filter(({ position: p }) => {
    lastPosition = p ?? lastPosition;          // a mark with no letter (۞, a pause sign) stays with the word before it
    return pageOf(lastPosition) === page;
  });
  const pageStart = page === 0 ? -1 : seg.words.find((w) => w.position === page * perPage + 1)?.start ?? 0;
  const turn = interpolate(local, [pageStart - 0.05, pageStart + 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const longestPage = Math.max(...Array.from({ length: pages }, (_, k) => tokens.filter(({ position: p }) => p !== null && pageOf(p) === k).reduce((n, x) => n + x.token.length + 1, 0)));
  // The translation in short chunks, each starting with the recited word at the same place in the verse.
  const chunks = subtitleChunks(seg.en);
  const total = chunks.reduce((n, c) => n + c.length, 0) || 1;
  let done = 0;
  const cues = chunks.map((text) => {
    const word = seg.words[Math.min(seg.words.length - 1, Math.floor((seg.words.length * done) / total))];
    const start = done === 0 ? 0 : word.start;
    done += text.length;
    return { text, start };
  });
  const cue = [...cues].reverse().find((c) => local >= c.start) ?? cues[0];
  return (
    <div style={{ opacity: show }}>
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: 316, left: 0, right: 0, textAlign: "center", fontFamily: FONT.arabic, fontSize: 34, color: "rgba(255,255,255,.72)", textShadow: SHADOW }}>
        {seg.reference}
      </div>
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: 366, left: 64, right: 64, textAlign: "center", opacity: turn, fontFamily: FONT.quran, fontSize: fit(66, "x".repeat(longestPage), 150), lineHeight: 1.95, color: "#fff", textShadow: SHADOW, textWrap: "balance" }}>
        {shown.map(({ token, position: p }, i) => (
          <Fragment key={`${page}-${i}`}>
            {i > 0 ? " " : null}
            <span style={{ color: p !== null && p === active ? GOLD : "#fff" }}>{token}</span>
          </Fragment>
        ))}
      </div>
      <div lang="en" style={{ position: "absolute", top: 1490, left: 80, right: 80, textAlign: "center", fontFamily: FONT.latin, fontStyle: "italic", fontSize: 44, lineHeight: 1.4, color: "rgba(255,255,255,.92)", textShadow: SHADOW, textWrap: "balance" }}>
        {cue.text}
      </div>
      <div style={{ position: "absolute", top: 1716, left: 0, right: 0, textAlign: "center", fontFamily: FONT.latin, fontSize: 30, color: "rgba(255,255,255,.62)", textShadow: SHADOW }}>
        {seg.credit}
      </div>
    </div>
  );
};

export const Trial: React.FC<TrialProps> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  if (!data) throw new Error("no trial data: calculateMetadata did not run");
  const t = frame / fps;
  const picture = data.picture ?? {};
  const horizon = picture.horizon ?? 1300;
  const Drawing = PICTURES[data.trial];
  if (!Drawing) throw new Error(`no picture is drawn for the trial « ${data.trial} »`);
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
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,7,20,.78) 0%, rgba(4,7,20,.45) 30%, rgba(4,7,20,.05) 52%, rgba(4,7,20,.38) 100%)" }} />
      {data.segments.map((seg, i) =>
        seg.file ? (
          <Sequence key={i} from={Math.round(seg.start * fps)} durationInFrames={Math.ceil(seg.seconds * fps) + 2} layout="none">
            <Html5Audio src={staticFile(seg.file)} />
          </Sequence>
        ) : null,
      )}
      {current.kind === "narration" ? (
        <NarrationText seg={current} t={t} last={current === data.segments[data.segments.length - 1]} handle={data.handle} />
      ) : (
        <VerseText seg={current} t={t} />
      )}
      <div style={{ position: "absolute", top: 250, right: 90, fontFamily: FONT.latin, fontWeight: 600, fontSize: 30, color: GOLD, opacity: 0.9, textShadow: SHADOW }}>
        {data.handle}
      </div>
    </AbsoluteFill>
  );
};
