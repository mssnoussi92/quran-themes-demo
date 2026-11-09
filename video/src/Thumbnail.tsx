// YouTube thumbnail of the whole 16:9 episode, 1280x720 (content/episodes/<episode>.yaml, `thumbnail`):
//   npm run still -- Thumbnail169 out/dua-thumbnail.png
// Made only of the episode's own pieces: a catalog character and background, Amiri and Lora, the
// colours of the cards. Read at about 170 px wide on a phone, so: a big face, three to five words,
// strong contrast, nothing in the bottom-right corner (YouTube's duration badge).
// Layouts (closed catalog, `thumbnail.layout`); try another one without editing the episode:
//   npm run still -- Thumbnail169 out/t.png --props='{"episode":"dua","layout":"title","data":null}'
import { AbsoluteFill, staticFile } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { BACKGROUNDS } from "./backgrounds/Backgrounds";
import { CharacterView, placement } from "./characters/Character";
import { FONT, loadFonts } from "./fonts";
import { PAPER_SHEET, PaperScene } from "./styles/paper/render";
import { PAPER_PLACES } from "./styles/paper/places";
import { COLOR } from "./theme";
import type { Character, EpisodeData, ThumbnailData, ThumbnailLayout } from "./types";

loadFonts();

export const THUMBNAIL_SIZE = { width: 1280, height: 720 };

export type ThumbnailProps = {
  episode: string;
  /** Overrides the episode's layout, to compare the layouts before choosing one. */
  layout: ThumbnailLayout | null;
  data: EpisodeData | null;
};

export const thumbnailMetadata: CalculateMetadataFunction<ThumbnailProps> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile(`data/${props.episode}.json`), { signal: abortSignal });
  if (!res.ok) throw new Error(`public/data/${props.episode}.json is missing: run "npm run data" in video/`);
  const data = (await res.json()) as EpisodeData;
  if (!data.thumbnail) throw new Error(`content/episodes/${props.episode}.yaml has no thumbnail`);
  return { props: { ...props, data } };
};

const W = THUMBNAIL_SIZE.width;
const H = THUMBNAIL_SIZE.height;
const NAVY = COLOR.backgroundTop;
const GOLD = COLOR.accent;

/** The thumbnail's words: headline, kicker on a dark pill, English line. Right-aligned (Arabic). */
const Words: React.FC<{ t: ThumbnailData; tone: "light" | "dark"; size: number; right: number; top: number; width: number }> = ({
  t,
  tone,
  size,
  right,
  top,
  width,
}) => {
  const ink = tone === "light" ? NAVY : COLOR.text;
  return (
    <div style={{ position: "absolute", right, top, width, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <div
        dir="rtl"
        style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: size, lineHeight: 1.15, color: ink, textAlign: "right", whiteSpace: "nowrap" }}
      >
        {t.headline.ar}
      </div>
      {t.kicker ? (
        <div
          dir="rtl"
          style={{
            marginTop: size * 0.12,
            padding: `${size * 0.02}px ${size * 0.22}px ${size * 0.1}px`,
            borderRadius: size * 0.16,
            background: tone === "light" ? NAVY : "rgba(216, 178, 106, 0.14)",
            border: `3px solid ${GOLD}`,
            fontFamily: FONT.arabic,
            fontWeight: 700,
            fontSize: size * 0.6,
            lineHeight: 1.3,
            color: GOLD,
            whiteSpace: "nowrap",
          }}
        >
          {t.kicker.ar}
        </div>
      ) : null}
      <div
        style={{
          marginTop: size * 0.2,
          fontFamily: FONT.latin,
          fontSize: size * 0.26,
          letterSpacing: 0.5,
          color: tone === "light" ? "#3b4a5a" : COLOR.muted,
          textAlign: "right",
        }}
      >
        {t.headline.en}
        {t.kicker ? ` ${t.kicker.en}` : ""}
      </div>
    </div>
  );
};

/** A big face next to the words: the figure cut at the chest by the bottom of the image. */
const CloseUp: React.FC<{ t: ThumbnailData; c: Character }> = ({ t, c }) => {
  const Background = BACKGROUNDS[t.background];
  const scale = 0.62;
  const [, , , bh] = c.box;
  const figureTop = 36;
  const floorY = figureTop + (bh + 80) * scale;
  return (
    <AbsoluteFill>
      {/* The room is seen from close: its floor sits just under the image, the clock above the words. */}
      <Background width={W} height={H} floorY={H + 40} seatTop={null} />
      <CharacterView c={c} x={300} floorY={floorY} scale={scale} audio={null} />
      {/* Under the clock (its bottom edge is at y = 295), clear of the duration badge. */}
      <Words t={t} tone="light" size={124} right={64} top={318} width={720} />
    </AbsoluteFill>
  );
};

/** The scene as in the video (the character in its room), the words on a dark band on the right. */
const Scene: React.FC<{ t: ThumbnailData; c: Character }> = ({ t, c }) => {
  const Background = BACKGROUNDS[t.background];
  const scale = 0.2;
  const floorY = 640;
  const x = 300;
  const seatTop = c.seat ? floorY - placement(c, x, floorY, scale).seatHeight : null;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: -260, top: 0, width: W, height: H }}>
        <Background width={W} height={H} floorY={floorY} seatTop={seatTop} />
        <CharacterView c={c} x={x + 260} floorY={floorY} scale={scale} audio={null} />
      </div>
      <div style={{ position: "absolute", right: 0, top: 0, width: 640, height: H, background: `linear-gradient(180deg, ${COLOR.backgroundTop}, ${COLOR.backgroundBottom})`, borderLeft: `6px solid ${GOLD}` }} />
      <Words t={t} tone="dark" size={112} right={60} top={220} width={560} />
    </AbsoluteFill>
  );
};

/** The words alone, on the dark blue of the video's cards, framed like them. */
const Title: React.FC<{ t: ThumbnailData }> = ({ t }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COLOR.backgroundTop}, ${COLOR.backgroundBottom})` }}>
    <div style={{ position: "absolute", inset: 28, border: `3px solid ${COLOR.panelBorder}`, borderRadius: 28 }} />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div dir="rtl" style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: 190, lineHeight: 1.1, color: COLOR.text }}>
        {t.headline.ar}
      </div>
      {t.kicker ? (
        <div dir="rtl" style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: 120, lineHeight: 1.3, color: GOLD }}>
          {t.kicker.ar}
        </div>
      ) : null}
      <div style={{ marginTop: 18, fontFamily: FONT.latin, fontSize: 40, color: COLOR.muted }}>
        {t.headline.en}
        {t.kicker ? ` ${t.kicker.en}` : ""}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

/** Paper-cut style (docs/styles.md): a place of the episode in paper, the character's silhouette seen
 * from close on the left, the words cut in a strip of dark paper on the right. */
const PaperThumb: React.FC<{ t: ThumbnailData; c: Character | null }> = ({ t, c }) => {
  const place = t.background in PAPER_PLACES ? t.background : "cave-entrance";
  const scene = {
    id: "thumbnail", visual: { template: "scene", background: place, icon: null, highlight: "none", characters: c ? [{ ...c, pose: c.pose === "sitting" ? "standing" : c.pose }] : [] },
  } as unknown as Parameters<typeof PaperScene>[0]["scene"];
  // The place is drawn wider than the image and moved left: its centre (the cave's mouth) sits on the
  // left half, the person beside it, the words on the right.
  const shift = 280;
  const format = { id: "episode", width: W + shift, height: H, safe: { top: 40, right: 60, bottom: 40, left: 60 } } as Parameters<typeof PaperScene>[0]["format"];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: -shift, top: 0, width: W + shift, height: H }}>
        <PaperScene scene={scene} format={format} floor={H - 24} figure={0.86} figureX={(shift + 170) / (W + shift)} />
      </div>
      <div style={{ position: "absolute", right: 48, top: 46, ...PAPER_SHEET, padding: "26px 40px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div dir="rtl" style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: 118, lineHeight: 1.15, color: "#ffe9bf", textShadow: "0 0 18px rgba(255, 214, 140, 0.55)", whiteSpace: "nowrap" }}>
          {t.headline.ar}
        </div>
        {t.kicker ? (
          <div dir="rtl" style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: 64, lineHeight: 1.3, color: GOLD, whiteSpace: "nowrap" }}>
            {t.kicker.ar}
          </div>
        ) : null}
        <div style={{ marginTop: 6, fontFamily: FONT.latin, fontSize: 30, color: "#f1e2c4" }}>
          {t.headline.en}
          {t.kicker ? ` ${t.kicker.en}` : ""}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Thumbnail: React.FC<ThumbnailProps> = ({ data, layout }) => {
  const t = data?.thumbnail;
  if (!t) return null;
  if (data?.style === "paper") return <PaperThumb t={t} c={t.character ?? null} />;
  const chosen = layout ?? t.layout;
  if (chosen === "title" || !t.character) return <Title t={t} />;
  return chosen === "close-up" ? <CloseUp t={t} c={t.character} /> : <Scene t={t} c={t.character} />;
};
