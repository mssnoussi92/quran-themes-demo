// Covers of the trial videos (docs/retention.md, 2026-11-11), proposed to the owner:
// - TrialCover916: the 9:16 cover of a short (Reels, TikTok, Shorts), the scene of its story, its title in
//   large and a tag above it (`cover` of content/trial/<id>.yaml). Title and silhouette stay inside the square
//   in the middle of the frame: that is what a profile grid shows.
// - TrialThumb169: the YouTube thumbnail of the long film (1280x720), the three stories side by side (the
//   first on the right, as Arabic is read), the name of the story in large (`thumbnail` of film.yaml).
// Same rules as the other thumbnails: readable at 170 px wide, three to five words, nothing in the bottom
// right corner of the 16:9 one (YouTube writes the duration there). Session only, like the trial itself.
import type { CalculateMetadataFunction } from "remotion";
import { AbsoluteFill, staticFile } from "remotion";
import { FONT, loadFonts } from "../fonts";
import { Clip, GOLD, H, PICTURES, W } from "./Trial";
import type { TrialData } from "./Trial";

loadFonts();

const INK_SHADOW = "0 4px 30px rgba(4,7,20,.95), 0 0 80px rgba(4,7,20,.8)";

const load = async (trial: string, voice: string, signal: AbortSignal) => {
  const res = await fetch(staticFile(`trial/${trial}-${voice}.json`), { signal });
  if (!res.ok) throw new Error(`public/trial/${trial}-${voice}.json is missing: run tools/trial/prepare.py (--draft is enough)`);
  return (await res.json()) as TrialData;
};

/** The picture of a short at one of its scenes: its clip, what is drawn over it, the same veil as in the video. */
const Scene: React.FC<{ data: TrialData; scene: string }> = ({ data, scene }) => {
  const picture = data.picture ?? {};
  const Drawing = PICTURES[data.trial];
  if (!Drawing) throw new Error(`no picture is drawn for the trial « ${data.trial} »`);
  return (
    <AbsoluteFill style={{ width: W, height: H, background: picture.ground ?? "#04070f" }}>
      <Clip src={data.clip} clipSeconds={data.clip_seconds} picture={picture} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Drawing t={2} show={(id) => (id === scene ? 1 : 0)} since={() => 0} horizon={picture.horizon ?? 1300} />
      </svg>
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ text: string; size: number }> = ({ text, size }) => (
  <div dir="rtl" lang="ar" style={{ display: "inline-block", padding: `${size * 0.16}px ${size * 0.6}px ${size * 0.26}px`, borderRadius: size * 0.36, background: GOLD, color: "#141006", fontFamily: FONT.arabic, fontWeight: 700, fontSize: size, lineHeight: 1.3 }}>
    {text}
  </div>
);

export type CoverProps = { trial: string; voice: string; data: TrialData | null };
export const coverMetadata: CalculateMetadataFunction<CoverProps> = async ({ props, abortSignal }) => ({
  props: { ...props, data: await load(props.trial, props.voice, abortSignal) },
});

export const TrialCover: React.FC<CoverProps> = ({ data }) => {
  if (!data) throw new Error("no trial data: calculateMetadata did not run");
  if (!data.cover) throw new Error(`content/trial/${data.trial}.yaml has no cover`);
  const { scene, title, tag } = data.cover;
  const size = Math.round(Math.min(190, (W - 120) / (title.length * 0.43)));
  return (
    <AbsoluteFill style={{ background: "#04070f" }}>
      <Scene data={data} scene={scene} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,7,20,.82) 0%, rgba(4,7,20,.62) 34%, rgba(4,7,20,.06) 56%, rgba(4,7,20,.45) 100%)" }} />
      <div style={{ position: "absolute", top: 450, left: 50, right: 50, textAlign: "center" }}>
        <Tag text={tag} size={50} />
        <div dir="rtl" lang="ar" style={{ marginTop: 26, fontFamily: FONT.arabic, fontWeight: 700, fontSize: size, lineHeight: 1.35, color: "#fff", textShadow: INK_SHADOW, textWrap: "balance" }}>
          {title}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 300, left: 0, right: 0, textAlign: "center", fontFamily: FONT.latin, fontWeight: 600, fontSize: 36, color: GOLD, opacity: 0.92, textShadow: INK_SHADOW }}>
        {data.handle}
      </div>
    </AbsoluteFill>
  );
};

export const THUMB = { width: 1280, height: 720 };
type Film = { title: { ar: string; en: string }; handle: string; thumbnail: { title: string; tag: string; panels: string[] } };
export type ThumbProps = { voice: string; film: Film | null; panels: TrialData[] | null };
export const thumbMetadata: CalculateMetadataFunction<ThumbProps> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile("trial/film.json"), { signal: abortSignal });
  if (!res.ok) throw new Error("public/trial/film.json is missing: run tools/trial/prepare.py --film");
  const film = (await res.json()) as Film;
  const panels = await Promise.all(film.thumbnail.panels.map((trial) => load(trial, props.voice, abortSignal)));
  return { props: { ...props, film, panels } };
};

export const TrialThumb: React.FC<ThumbProps> = ({ film, panels }) => {
  if (!film || !panels) throw new Error("no film data: calculateMetadata did not run");
  const width = THUMB.width / panels.length;
  // Each panel is the 9:16 picture of a short, reduced and a little enlarged around what is drawn (`focus` of
  // its cover: the height of the middle of the subject in the picture), which sits at two thirds of the height.
  const scale = (width / W) * 1.15;
  return (
    <AbsoluteFill style={{ background: "#04070f" }}>
      {panels.map((data, i) => (
        // the first story on the right
        <div key={data.trial} style={{ position: "absolute", top: 0, left: THUMB.width - (i + 1) * width, width, height: THUMB.height, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: THUMB.height * 0.66 - (data.cover?.focus ?? 1200) * scale, left: (width - W * scale) / 2, width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            <Scene data={data} scene={data.cover?.scene ?? ""} />
          </div>
          {i > 0 ? <div style={{ position: "absolute", top: 0, bottom: 0, right: -2, width: 4, background: GOLD, opacity: 0.85 }} /> : null}
        </div>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,7,20,.9) 0%, rgba(4,7,20,.72) 30%, rgba(4,7,20,.12) 52%, rgba(4,7,20,.3) 100%)" }} />
      <div style={{ position: "absolute", top: 22, left: 30, right: 30, textAlign: "center" }}>
        <Tag text={film.thumbnail.tag} size={60} />
        <div dir="rtl" lang="ar" style={{ marginTop: -6, fontFamily: FONT.arabic, fontWeight: 700, fontSize: 176, lineHeight: 1.25, color: "#fff", textShadow: INK_SHADOW }}>
          {film.thumbnail.title}
        </div>
      </div>
    </AbsoluteFill>
  );
};
