// The dedicated thumbnail of a film (owner's decision, 2026-11-21): ONE scene of the film at full resolution, none of
// the film's text, a hook in two lines. The long film's 2.54 % click-through on YouTube (6 963 impressions, mostly as a
// suggested video, where the thumbnail is about 170 px wide) is why the three panels of TrialThumb169 (Cover.tsx) are
// not the only choice any more. The options are declared in the film's file (`thumbnail.options`) and rendered by the
// workflow `film` (`only: thumbnail`, or with `all` and `film`); the picture is the film itself, `clean` (Film.tsx:
// no text layer, no sound), frozen at the option's moment.
import type { CalculateMetadataFunction } from "remotion";
import { AbsoluteFill, Freeze, staticFile, useVideoConfig } from "remotion";
import { FONT } from "../fonts";
import { INK_SHADOW, Tag, THUMB } from "./Cover";
import { Film } from "./Film";
import type { FilmData } from "./Film";
import { GOLD } from "./Trial";

export type ThumbOption = {
  name: string;
  /** A moment of the film: "5:40", "1:05:10" or a number of seconds. */
  at: string | number;
  /** Two lines of Arabic: the first white, the second gold. */
  lines: [string, string];
  tag: string;
  /** Where the text goes: `top` (centred), `left` or `right` (a block of about 45 % of the width, right-aligned). */
  place: "top" | "left" | "right";
  /** 1 by default; more than 1 brightens the picture only, never the text. */
  brightness?: number;
  file?: string;
};
export type ThumbFrameData = { film: FilmData; option: ThumbOption };
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
  // The timeline (what the clean film shows) and the thumbnail data (tools/trial/film.py): both by prepare.py --film.
  const film = (await get(`${props.film}-${props.voice}.json`, `run tools/trial/prepare.py --film ${props.film} --voice ${props.voice}`)) as FilmData;
  const shown = (await get(`${props.film}.json`, `run tools/trial/prepare.py --film ${props.film}`)) as { thumbnail: { options?: ThumbOption[] } };
  const option = (shown.thumbnail.options ?? []).find((o) => o.name === props.option);
  if (!option) throw new Error(`content/trial/${props.film}.yaml: no thumbnail option « ${props.option} » (thumbnail.options)`);
  momentOf(option.at);
  return { props: { ...props, data: { film, option } } };
};

export const TrialThumbFrame: React.FC<ThumbFrameProps> = ({ film: id, voice, data }) => {
  const { fps } = useVideoConfig();
  if (!data) throw new Error("no thumbnail data: calculateMetadata did not run");
  const { option } = data;
  const at = momentOf(option.at);
  if (at < 0 || at >= data.film.seconds) throw new Error(`thumbnail option « ${option.name} »: ${option.at} is outside the film (${Math.floor(data.film.seconds)} s)`);
  const scale = THUMB.width / 1920;                  // the film is 1920x1080, reduced to 1280x720
  const side = option.place !== "top";
  const [first, second] = option.lines;
  // Arabic in this font is about 0.38 em a letter, spaces included: a line that would leave its block is reduced.
  const room = side ? THUMB.width * 0.47 : THUMB.width - 80;
  const size = Math.round(Math.min(122, room / (Math.max(first.length, second.length) * 0.38)));
  const veil = option.place === "left"
    ? "linear-gradient(90deg, rgba(4,7,20,.78) 0%, rgba(4,7,20,.55) 40%, rgba(4,7,20,0) 62%)"
    : option.place === "right"
      ? "linear-gradient(270deg, rgba(4,7,20,.78) 0%, rgba(4,7,20,.55) 40%, rgba(4,7,20,0) 62%)"
      : "linear-gradient(180deg, rgba(4,7,20,.8) 0%, rgba(4,7,20,.55) 34%, rgba(4,7,20,0) 58%)";
  // The bottom right corner stays empty: YouTube writes the duration there.
  const block: React.CSSProperties = side
    ? { position: "absolute", top: 120, [option.place]: 40, width: THUMB.width * 0.47, textAlign: "right" }
    : { position: "absolute", top: 26, left: 40, right: 40, textAlign: "center" };
  const line: React.CSSProperties = { fontFamily: FONT.arabic, fontWeight: 700, fontSize: size, lineHeight: 1.12, textShadow: INK_SHADOW, whiteSpace: "nowrap" };
  return (
    <AbsoluteFill style={{ background: "#04070f" }}>
      <AbsoluteFill style={{ filter: option.brightness && option.brightness !== 1 ? `brightness(${option.brightness})` : undefined }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <Freeze frame={Math.round(at * fps)}>
            <Film film={id} voice={voice} data={data.film} clean />
          </Freeze>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: veil }} />
      <div style={block}>
        <Tag text={option.tag} size={50} />
        <div dir="rtl" lang="ar" style={{ marginTop: 14 }}>
          <div style={{ ...line, color: "#fff" }}>{first}</div>
          <div style={{ ...line, color: GOLD }}>{second}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
