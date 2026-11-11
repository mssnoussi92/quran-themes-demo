// Trial short of 2026-11-11 (docs/retention.md, content/trial/boat.yaml): the model proposed to the owner,
// to be judged on a video before anything is rebuilt. One continuous picture (filmed sea, the drawn
// silhouette of what the verse tells), the voice going on over it, each verse recited over the scene with
// its word lit as it is recited. Session only: its data and the sea clip are prepared by
// tools/trial/prepare.py into public/trial/ (not in the repository).
import { Fragment } from "react";
import type { CalculateMetadataFunction } from "remotion";
import { AbsoluteFill, Easing, Html5Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, loadFonts } from "../fonts";
import { subtitleChunks } from "../templates/Subtitles";
import type { WordTiming } from "../types";
import { Boat, Fleet } from "./Boat";

loadFonts();

/** `sea`: the sea alone (an example from the viewer's life: nothing of the story is drawn). */
type SceneId = "holed" | "fleet" | "sail" | "sea";
type Phrase = { text: string; start: number };
type Line = { ar: string; en: string; phrases: Phrase[]; end: number };
type Narration = { kind: "narration"; scene: SceneId; start: number; seconds: number; file: string; lines: Line[] };
type Verse = {
  kind: "verse"; scene: SceneId; start: number; seconds: number; file: string;
  reference: string; text: string; en: string; words: WordTiming[]; credit: string;
};
type Segment = Narration | Verse;
export type TrialData = {
  trial: string; voice: string; voice_name: string; handle: string;
  clip: string; clip_seconds: number; seconds: number; segments: Segment[];
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
/** Where the sea meets the sky in the cropped clip (pixels from the top). */
const HORIZON = 827;
const GOLD = "#ffcf6a";
const SHADOW = "0 2px 24px rgba(4,7,20,.9), 0 0 60px rgba(4,7,20,.7)";
const FADE = 0.6;
const RATE = 0.85;

/** The filmed sea, played a little slower than life and looped with a cross-fade. */
const Sea: React.FC<{ src: string; clipSeconds: number }> = ({ src, clipSeconds }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const length = Math.floor((clipSeconds / RATE) * fps) - 3;
  const cross = fps;
  const step = length - cross;
  const copies = Math.ceil(durationInFrames / step);
  return (
    <>
      {Array.from({ length: copies }, (_, i) => (
        <Sequence key={i} from={i * step} durationInFrames={length} layout="none">
          <OffthreadVideo
            muted
            src={staticFile(src)}
            playbackRate={RATE}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "62% 50%",
              filter: "blur(1.5px) brightness(.8) saturate(1.1)",
              opacity: i === 0 ? 1 : interpolate(frame - i * step, [0, cross], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          />
        </Sequence>
      ))}
    </>
  );
};

/** How much of a scene shows at time t: scenes follow one another with a cross-fade. */
const sceneOpacity = (segments: Segment[], id: SceneId, t: number) => {
  let shown = 0;
  let current: SceneId | null = null;
  for (const seg of segments) {
    if (seg.scene === current) continue;
    const at = current === null ? -1 : seg.start - 0.2;
    const p = interpolate(t, [at - FADE / 2, at + FADE / 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    shown = seg.scene === id ? Math.max(shown, p) : shown * (1 - p);
    current = seg.scene;
  }
  return shown;
};

const hasLetter = (token: string) => /\p{L}/u.test(token);
const fit = (base: number, text: string, comfortable: number) => Math.round(base * Math.min(1, Math.sqrt(comfortable / Math.max(1, text.length))));

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
  const longest = line.phrases.reduce((n, p) => Math.max(n, p.text.length), 1);
  const size = fit(104, "x".repeat(longest), 19);
  return (
    <>
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: 340, left: 70, right: 70, textAlign: "center", opacity: show, fontFamily: FONT.arabic, fontWeight: 700, fontSize: size, lineHeight: 1.5, color: "#fff", textShadow: SHADOW }}>
        {line.phrases.map((phrase, i) => {
          // The very first phrase of the video is on its first frame; the others come as the voice reaches them.
          const first = opening && i === 0;
          const k = first ? 1 : spring({ frame: Math.round((local - phrase.start + 0.1) * fps), fps, config: { damping: 200 }, durationInFrames: 8 });
          const point = line.phrases.length > 1 && i === line.phrases.length - 1;
          return (
            <div key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * 18}px)`, color: point ? GOLD : "#fff" }}>
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
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: 366, left: 64, right: 64, textAlign: "center", fontFamily: FONT.quran, fontSize: fit(66, seg.text, 150), lineHeight: 1.95, color: "#fff", textShadow: SHADOW, textWrap: "balance" }}>
        {tokens.map(({ token, position: p }, i) => (
          <Fragment key={i}>
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
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.07]);
  const current = [...data.segments].reverse().find((s) => t >= s.start - 0.3) ?? data.segments[0];
  const holed = sceneOpacity(data.segments, "holed", t);
  const fleet = sceneOpacity(data.segments, "fleet", t);
  const sail = sceneOpacity(data.segments, "sail", t);
  // The boat sails away from the moment its scene first shows.
  const sailFrom = data.segments.find((s) => s.scene === "sail")?.start ?? 0;
  return (
    <AbsoluteFill style={{ background: "#04070f" }}>
      {/* the picture: it grows slowly around the horizon, the texts never move */}
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `50% ${(HORIZON / H) * 100}%` }}>
        <Sea src={data.clip} clipSeconds={data.clip_seconds} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <g opacity={fleet}>
            <Fleet horizon={HORIZON} t={t} />
            <Boat id="b-fleet" x={370} y={1235} scale={0.56} t={t} holed splash={false} plank={false} />
          </g>
          <g opacity={holed}>
            <Boat id="b-holed" x={500} y={1185} scale={0.72} t={t} holed splash />
          </g>
          <g opacity={sail}>
            <Boat id="b-sail" x={560 - 4 * Math.max(0, t - sailFrom)} y={1170} scale={0.66} t={t} holed splash={false} plank={false} />
          </g>
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,7,20,.78) 0%, rgba(4,7,20,.45) 30%, rgba(4,7,20,.05) 52%, rgba(4,7,20,.38) 100%)" }} />
      {data.segments.map((seg) => (
        <Sequence key={seg.file} from={Math.round(seg.start * fps)} durationInFrames={Math.ceil(seg.seconds * fps) + 2} layout="none">
          <Html5Audio src={staticFile(seg.file)} />
        </Sequence>
      ))}
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
