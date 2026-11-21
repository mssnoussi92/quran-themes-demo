// The dedicated thumbnail of a film (owner's decision, 2026-11-21): ONE scene of the film at full resolution, none of
// the film's text, a hook in two lines. The long film's 2.54 % click-through on YouTube (6 963 impressions, mostly as a
// suggested video, where the thumbnail is about 170 px wide) is why the three panels of TrialThumb169 (Cover.tsx) are
// not the only choice any more. The options are declared in the film's file (`thumbnail.options`) and rendered by the
// workflow `film` (`only: thumbnail`, or with `all` and `film`); the picture is the film itself, `clean` (Film.tsx:
// no text layer, no sound), frozen at the option's moment.
import type { CalculateMetadataFunction } from "remotion";
import { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Freeze, staticFile, useVideoConfig } from "remotion";
import { FONT } from "../fonts";
import { INK_SHADOW, Tag, THUMB } from "./Cover";
import { Film } from "./Film";
import type { FilmData } from "./Film";
import { GOLD, TRIAL_FPS } from "./Trial";
import { ThumbArt } from "./ThumbArt";

export type ThumbOption = {
  name: string;
  /** A moment of the film: "5:40", "1:05:10" or a number of seconds (the picture is the clean film then). */
  at?: string | number;
  /** Or a scene drawn for the thumbnail alone (ThumbArt.tsx: « qarnayn-barrier »…; the owner, 2026-11-21: « entièrement
   * dessinée », not always a picture of the film). */
  art?: string;
  /** Two lines of Arabic: the first white, the second gold. */
  lines: [string, string];
  tag: string;
  /** Where the text goes: `top` (centred), `left` or `right` (a block of about 45 % of the width, right-aligned). */
  place: "top" | "left" | "right";
  /** 1 by default; more than 1 brightens the picture only, never the text. */
  brightness?: number;
  file?: string;
};
export type ThumbFrameData = { film: FilmData | null; option: ThumbOption };
export type ThumbFrameProps = { film: string; voice: string; option: string; data: ThumbFrameData | null };

/** "5:40" -> 340, "1:05:10" -> 3910, a number of seconds stays. */
export const momentOf = (at: string | number): number => {
  if (typeof at === "number") return at;
  const parts = String(at).split(":").map(Number);
  if (parts.some((p) => !Number.isFinite(p))) throw new Error(`thumbnail option: « ${at} » is not a time (5:40 or seconds)`);
  return parts.reduce((sum, p) => sum * 60 + p, 0);
};

export const thumbFrameMetadata: CalculateMetadataFunction<ThumbFrameProps> = async ({ props, abortSignal }) => {
  const get = async (file: string, hint: string) => {
    const res = await fetch(staticFile(`trial/${file}`), { signal: abortSignal });
    if (!res.ok) throw new Error(`public/trial/${file} is missing: ${hint}`);
    return res.json();
  };
  // A moment of the film is drawn by the film's own sequences: the composition lasts as long as the film, or a sequence
  // that starts after its 60 frames is never shown (every moment came out as the film's opening, 2026-11-21).
  const lasting = (film: FilmData | null) => (film ? { durationInFrames: Math.max(60, Math.ceil(film.seconds * TRIAL_FPS) + 1) } : {});
  if (props.data) return { props, ...lasting(props.data.film) };   // given whole (a still rendered in a session: --props)
  // The thumbnail data (tools/trial/film.py) and, for a moment of the film, its timeline: both by prepare.py --film.
  const shown = (await get(`${props.film}.json`, `run tools/trial/prepare.py --film ${props.film}`)) as { thumbnail: { options?: ThumbOption[] } };
  const option = (shown.thumbnail.options ?? []).find((o) => o.name === props.option);
  if (!option) throw new Error(`content/trial/${props.film}.yaml: no thumbnail option « ${props.option} » (thumbnail.options)`);
  if (option.art) return { props: { ...props, data: { film: null, option } } };
  if (option.at === undefined) throw new Error(`thumbnail option « ${option.name} »: neither \`art\` nor \`at\``);
  momentOf(option.at);
  const film = (await get(`${props.film}-${props.voice}.json`, `run tools/trial/prepare.py --film ${props.film} --voice ${props.voice}`)) as FilmData;
  return { props: { ...props, data: { film, option } }, ...lasting(film) };
};

export const TrialThumbFrame: React.FC<ThumbFrameProps> = ({ film: id, voice, data }) => {
  const { fps } = useVideoConfig();
  if (!data) throw new Error("no thumbnail data: calculateMetadata did not run");
  const { option } = data;
  const at = option.art ? 0 : momentOf(option.at ?? -1);
  if (!option.art && (!data.film || at < 0 || at >= data.film.seconds))
    throw new Error(`thumbnail option « ${option.name} »: ${option.at} is outside the film`);
  const scale = THUMB.width / 1920;                  // the film is 1920x1080, reduced to 1280x720
  const side = option.place !== "top";
  const [first, second] = option.lines;
  const room = side ? THUMB.width * 0.47 : THUMB.width - 80;
  // A drawn scene leaves its text side calm already: a lighter veil, so that its colours stay.
  const k = option.art ? 0.6 : 1;
  const ink = (a: number) => `rgba(4,7,20,${(a * k).toFixed(2)})`;
  const veil = option.place === "left"
    ? `linear-gradient(90deg, ${ink(0.78)} 0%, ${ink(0.55)} 40%, rgba(4,7,20,0) 62%)`
    : option.place === "right"
      ? `linear-gradient(270deg, ${ink(0.78)} 0%, ${ink(0.55)} 40%, rgba(4,7,20,0) 62%)`
      : `linear-gradient(180deg, ${ink(0.8)} 0%, ${ink(0.55)} 34%, rgba(4,7,20,0) 58%)`;
  // The bottom right corner stays empty: YouTube writes the duration there.
  const block: React.CSSProperties = side
    ? { position: "absolute", top: 120, [option.place]: 40, width: THUMB.width * 0.47, textAlign: "right" }
    : { position: "absolute", top: 26, left: 40, right: 40, textAlign: "center" };
  return (
    <AbsoluteFill style={{ background: "#04070f" }}>
      <AbsoluteFill style={{ filter: option.brightness && option.brightness !== 1 ? `brightness(${option.brightness})` : undefined }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          {option.art ? <ThumbArt art={option.art} /> : (
            <Freeze frame={Math.round(at * fps)}>
              <Film film={id} voice={voice} data={data.film} clean />
            </Freeze>
          )}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: veil }} />
      <div style={block}>
        <Tag text={option.tag} size={50} />
        <HookLines first={first} second={second} room={room} align={side ? "right" : "center"} />
      </div>
    </AbsoluteFill>
  );
};

/** The two lines of hook at 122 px, both reduced by the same factor when the longer one would leave its block: measured
 * once the fonts are loaded (2026-11-21: « وقال: مش مني! », sized by an estimate of 0.38 em a letter, ran 30 px past its
 * block and touched the edge of the frame). */
const HookLines: React.FC<{ first: string; second: string; room: number; align: "right" | "center" }> = ({ first, second, room, align }) => {
  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const [k, setK] = useState(1);
  const [handle] = useState(() => delayRender("thumbnail: measuring the hook"));
  useLayoutEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      const widest = Math.max(...refs.map((r) => r.current?.scrollWidth ?? 0));
      setK(widest > room ? room / widest : 1);
      continueRender(handle);
    });
    return () => {
      live = false;
    };
  }, [first, second, room, handle]);   // eslint-disable-line react-hooks/exhaustive-deps
  const line: React.CSSProperties = { fontFamily: FONT.arabic, fontWeight: 700, fontSize: 122 * k, lineHeight: 1.12, textShadow: INK_SHADOW,
    whiteSpace: "nowrap", width: "max-content", marginLeft: "auto", marginRight: align === "center" ? "auto" : 0 };
  return (
    <div dir="rtl" lang="ar" style={{ marginTop: 14 }}>
      <div ref={refs[0]} style={{ ...line, color: "#fff" }}>{first}</div>
      <div ref={refs[1]} style={{ ...line, color: GOLD }}>{second}</div>
    </div>
  );
};
