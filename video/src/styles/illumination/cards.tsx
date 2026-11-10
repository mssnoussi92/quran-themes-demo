// The cards in the illumination style (docs/styles.md): the parchment page behind them, with the
// rosette that draws itself; the framed folio of a verse or a hadith; the gold cartouche of a name
// and of the narration line, written in naskh (Amiri) phrase by phrase as the voice says it.
// The text of a verse or a hadith is drawn by templates/cards.tsx: here it only gets a plain ivory
// ground, a frame and its ink (palette.ts), nothing over or under it.
import React, { useContext, useId } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AudioStart } from "../../audioStart";
import { FONT } from "../../fonts";
import { SUBTITLE_RESERVE, type Format } from "../../formats";
import type { KitProps, StyleKit, TitlePhrase } from "../kit";
import { SAFE, widthOf } from "./advance";
import { Border, FRAMES, Glint, glintAt, Gold, Headpiece, Parchment, Patch, Rosette, ROSETTES, Star, Still } from "./ornament";
import { C, GOLD_CSS, INK, MARKS, seedOf } from "./palette";

/** The rosette is centred on the stage, where the card is (above the subtitles' space). */
const RESERVE = SUBTITLE_RESERVE;

const stageOf = (format: Format) => {
  const top = format.safe.top;
  const bottom = format.height - format.safe.bottom - RESERVE[format.id];
  return { cx: format.width / 2, cy: (top + bottom) / 2, w: format.width - format.safe.left - format.safe.right, h: bottom - top };
};

/** The page behind a card: parchment, the gold and lapis border, a rosette that draws itself once
 * behind the card as the scene comes in (1.5 s, then it stays), the glint on the gold now and then.
 * The rosette's star, its size and its turn come from the scene's id: two pages in a row differ. */
export const Backdrop: React.FC<KitProps> = ({ scene, format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width: w, height: h } = format;
  const prefix = `il-${scene.id}`;
  const seed = seedOf(scene.id);
  const stage = stageOf(format);
  const [n, step, inner] = ROSETTES[seed % ROSETTES.length];
  // The rosette shows above and under the card; it stays under the headpiece and inside the page.
  const most = format.id === "reel" ? 384 : 300;
  const r = most * (0.9 + 0.1 * ((seed % 5) / 4));
  const p = interpolate(frame, [3, 3 + 1.5 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glint = glintAt(frame, fps, seed);
  const gold = `url(#${prefix}-rgold)`;
  return (
    <AbsoluteFill>
      <Still>
        <Parchment />
        <Headpiece id={format.id} w={w} h={h} prefix={prefix} />
        <Border w={w} h={h} f={FRAMES[format.id]} prefix={prefix} />
        {/* Reel: the page goes on under the subtitles; a small rosette closes it (the scenes have it too). */}
        {format.id === "reel" ? (
          <Patch x={w / 2 - 64} y={1608} w={128} h={128}>
            <Rosette cx={w / 2} cy={1672} r={58} n={8} step={3} p={1} stroke={C.gold} width={3} opacity={0.85} />
          </Patch>
        ) : null}
      </Still>
      <Patch x={stage.cx - r - 4} y={stage.cy - r - 4} w={2 * r + 8} h={2 * r + 8} layer>
        <defs>
          <Gold id={`${prefix}-rgold`} box={[stage.cx - r, stage.cy - r, 2 * r, 2 * r]} />
        </defs>
        <Rosette cx={stage.cx} cy={stage.cy} r={r} n={n} step={step} turn={(seed % 2) * (Math.PI / n)} p={p} stroke={gold} width={4} opacity={0.9} />
        <Rosette cx={stage.cx} cy={stage.cy} r={r * (0.64 + 0.08 * ((seed % 3) / 2))} n={n} step={inner} turn={((seed >> 2) % 2) * (Math.PI / n)} p={p} stroke={gold} width={3} opacity={0.9} />
      </Patch>
      {glint !== null ? <Glint w={w} h={h} f={FRAMES[format.id]} p={glint} prefix={prefix} /> : null}
    </AbsoluteFill>
  );
};

/** A corner piece of a folio's frame: a gold square, a star on lapis. No id inside (several panels
 * can be on screen): flat gold. */
const Corner: React.FC<{ at: React.CSSProperties; size: number }> = ({ at, size }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", ...at }}>
    <rect width={size} height={size} fill={C.ink} opacity={0.6} />
    <rect x={1.2} y={1.2} width={size - 2.4} height={size - 2.4} fill="#d9b15a" />
    <rect x={5.5} y={5.5} width={size - 11} height={size - 11} fill={C.lapis} />
    <Star cx={size / 2} cy={size / 2} s={(size - 11) * 0.86} fill={C.turquoise} line={C.goldLight} width={1.3} />
  </svg>
);

const HAIR = "rgba(43, 33, 26, 0.6)";

/** A verse: the signs of pause (ۚ ۖ) are marks that the browser attaches to the space before them,
 * and that space belongs to the line, not to a word: templates/cards.tsx gives the line the cards'
 * usual light colour (and each word the kit's ink), so on ivory the signs would be drawn light on
 * light, a verse shown without its pauses. The line itself takes the ink here. (To remove when
 * cards.tsx gives the line the kit's ink.) */
const AYAH_INK = `.il-ayah [lang="ar"] { color: ${INK.text} !important; }`;

/** The framed page of a verse or a hadith: an ivory ground, plain; a double gold line with a thin
 * lapis band between; corner pieces. The children are laid out as in the other styles (a column,
 * 30 px apart) and keep the same room for the text. */
const Folio: React.FC<{ ayah: boolean; children: React.ReactNode }> = ({ ayah, children }) => (
  <div style={{ position: "relative", margin: "0 5px", padding: 5, background: GOLD_CSS, boxShadow: `0 0 0 1.5px ${HAIR}, 0 9px 0 rgba(84, 56, 14, 0.16)` }}>
    {ayah ? <style>{AYAH_INK}</style> : null}
    <div style={{ padding: 6, background: C.lapis }}>
      <div style={{ padding: 3, background: "#d9b15a" }}>
        <div
          className={ayah ? "il-ayah" : undefined}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, padding: "40px 32px 38px", background: C.ivory, boxShadow: `inset 0 0 0 1px ${HAIR}` }}
        >
          {children}
        </div>
      </div>
    </div>
    <Corner size={38} at={{ left: -4, top: -4 }} />
    <Corner size={38} at={{ right: -4, top: -4 }} />
    <Corner size={38} at={{ left: -4, bottom: -4 }} />
    <Corner size={38} at={{ right: -4, bottom: -4 }} />
  </div>
);

/** One lobed end of a cartouche: it covers the straight part of the box's side and swells out of
 * it. Stretched to the box's height (the line keeps its width: non-scaling stroke). */
const Lobe: React.FC<{ side: "left" | "right"; out: number; g: number; r: number; most: number; ground: string; id: string }> = ({ side, out, g, r, most, ground, id }) => {
  const wv = out + g;
  const x0 = g / 2 + 2.5;
  const x1 = wv - g / 2;
  const curve = `Q${x0} 22 ${x0} 50 Q${x0} 78 ${x1} 100`;
  return (
    <div
      style={{
        // The whole side of a low box; the middle of the side of a high one (`most` px at most).
        position: "absolute", top: `max(${r - g}px, calc(50% - ${most / 2}px))`, bottom: `max(${r - g}px, calc(50% - ${most / 2}px))`, width: wv, [side]: -wv,
        transform: side === "right" ? "scaleX(-1)" : undefined,
      }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${wv} 100`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
        <path d={`M${wv + 1} 0 L${x1} 0 ${curve} L${wv + 1} 100 Z`} fill={ground} />
        <path d={`M${x1} 0 ${curve}`} fill="none" stroke={HAIR} strokeWidth={g + 3} vectorEffect="non-scaling-stroke" />
        <path d={`M${x1} 0 ${curve}`} fill="none" stroke={`url(#${id})`} strokeWidth={g} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
};

/** Measures of a cartouche, from the size of its text: its gold line, and what one side takes of
 * the width inside the box (the line and the padding). */
const lineOf = (em: number) => Math.max(6, Math.round(0.1 * em));
const cartoucheSide = (em: number) => lineOf(em) + Math.round(0.4 * em);
/** How far a lobe swells out of the box, on each side. */
const lobeOf = (em: number) => Math.round(0.44 * em);

/** A gold cartouche sized by what it holds: a rounded box with a gold line, a lobe at each end.
 * `em`: the size of its text, which every measure follows. `shine`: the glint passing over its gold
 * line (0 to 1), or null. */
const Cartouche: React.FC<{ em: number; ground: string; hair: string; maxWidth: number | string; shine?: number | null; children: React.ReactNode }> = ({
  em, ground, hair, maxWidth, shine = null, children,
}) => {
  const id = `il${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const g = lineOf(em);
  const r = Math.round(0.5 * em);
  const out = lobeOf(em);
  const light = shine === null ? "" : `linear-gradient(105deg, rgba(255, 251, 230, 0) 42%, rgba(255, 251, 230, 0.95) 50%, rgba(255, 251, 230, 0) 58%) ${(140 - 180 * shine).toFixed(1)}% 0 / 350% 100% no-repeat border-box, `;
  return (
    <div
      style={{
        position: "relative", display: "inline-block", boxSizing: "border-box", maxWidth, verticalAlign: "top",
        padding: `${Math.round(0.2 * em)}px ${Math.round(0.4 * em)}px ${Math.round(0.3 * em)}px`,
        border: `${g}px solid transparent`, borderRadius: r,
        background: `linear-gradient(${ground}, ${ground}) padding-box, ${light}${GOLD_CSS} border-box`,
        // A flat shadow, as painted: a blurred one is computed again for every frame.
        boxShadow: `0 0 0 1.5px ${HAIR}, 0 ${Math.round(0.12 * em)}px 0 rgba(84, 56, 14, 0.18)`,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ecd281" />
            <stop offset="1" stopColor="#c69a3f" />
          </linearGradient>
        </defs>
      </svg>
      <Lobe side="left" out={out} g={g} r={r} most={Math.round(3.4 * em)} ground={ground} id={id} />
      <Lobe side="right" out={out} g={g} r={r} most={Math.round(3.4 * em)} ground={ground} id={id} />
      {/* The fine line inside the gold one, as in the prototype. */}
      <div style={{ position: "absolute", inset: Math.round(0.07 * em), border: `1.5px solid ${hair}`, borderRadius: r - g - Math.round(0.07 * em) }} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};

/** The frame of a quotation. A verse or a hadith: a folio. A name (someone never drawn): an ivory
 * cartouche, the name in the same ink. */
export const Panel: StyleKit["Panel"] = ({ kind, children }) => {
  if (kind !== "name") return <Folio ayah={kind === "ayah"}>{children}</Folio>;
  return (
    <div style={{ padding: "0 44px" }}>
      <Cartouche em={96} ground={C.ivory} hair={C.lapis} maxWidth="100%">
        {children}
      </Cartouche>
    </div>
  );
};

const letters = (text: string) => [...text.replace(MARKS, "")].length;

/** A phrase as lines of about the same width that fit `room` (in em: advance.ts). A phrase is never
 * cut inside a word; should a line still be too wide (the estimate, a long word), it wraps by itself. */
const breakPhrase = (text: string, room: number): string[] => {
  const words = text.trim().split(/\s+/);
  const total = widthOf(text) * SAFE;
  if (total <= room || words.length < 2) return [text.trim()];
  for (let count = Math.ceil(total / room); count <= words.length; count++) {
    const lines: string[] = [];
    let line: string[] = [];
    let done = 0;
    for (const word of words) {
      const width = widthOf(line.join(" "));
      // The share of the phrase the lines so far should hold: the line closes when the next word
      // would take it further from that share than it is now.
      const target = (widthOf(text) * (lines.length + 1)) / count;
      if (line.length && lines.length < count - 1 && Math.abs(done + widthOf([...line, word].join(" ")) - target) > Math.abs(done + width - target)) {
        lines.push(line.join(" "));
        done += width;
        line = [];
      }
      line.push(word);
    }
    lines.push(line.join(" "));
    if (lines.every((l) => widthOf(l) * SAFE <= room || !l.includes(" "))) return lines;
  }
  return words;
};

/** The narration line of a title card: Amiri bold, ivory on the lapis of a gold cartouche, one
 * phrase per line (a long one on two or three), each written when the voice reaches it: the
 * cartouche opens by a line. The last phrase of a lesson or a conclusion is in light gold. */
export const Title: React.FC<KitProps & { phrases: TitlePhrase[] }> = ({ scene, format, phrases }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lead = useContext(AudioStart);
  const reel = format.id === "reel";
  const stage = stageOf(format);
  // The size follows the length of the whole line, as the other styles' cards (fitSize): a short
  // line is big, a long one stays readable on a phone (54 px at least on the 1080 px of a reel).
  const total = phrases.reduce((n, p) => n + letters(p.text), 0);
  const base = reel ? 82 : 88;
  const least = reel ? 54 : 60;
  const sized = Math.round(Math.max(least, base * Math.min(1, Math.sqrt((reel ? 62 : 90) / Math.max(1, total)))));
  // Reel: the box nearly as wide as the stage, its lobes in the margin (no text ever goes there).
  const maxBox = reel ? stage.w - 30 : Math.min(stage.w - 140, 1400);
  // One phrase, one line, where a slightly smaller size is enough for the widest phrase to fit the
  // box (its two sides take one em); else that size, and the long phrases on two lines.
  const fit = Math.floor(maxBox / (Math.max(...phrases.map((p) => widthOf(p.text))) * SAFE + 1.02));
  const em = fit >= Math.max(least, 0.8 * sized) ? Math.min(sized, fit) : sized;
  const room = (maxBox - 2 * cartoucheSide(em)) / em;
  const strong = scene.role === "lesson" || scene.role === "conclusion";
  const seed = seedOf(scene.id);
  // The card comes in with a short spring, as the other cards; not the first card of a video, whose
  // first frame is what the platforms show.
  const enter = lead > 0 ? spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 }) : 1;
  return (
    <div dir="rtl" lang="ar" style={{ transform: `scale(${(0.94 + 0.06 * enter).toFixed(4)})`, opacity: enter }}>
      <Cartouche em={em} ground={C.lapis} hair="rgba(243, 220, 142, 0.5)" maxWidth={maxBox} shine={glintAt(frame, fps, seed)}>
        {phrases.map((phrase, i) => {
          const t = i === 0 || frame >= phrase.at + 10 ? 1 : frame < phrase.at ? 0 : spring({ frame: frame - phrase.at, fps, config: { damping: 200 }, durationInFrames: 10 });
          const gold = strong && phrases.length > 1 && i === phrases.length - 1;
          return (
            // A grid row of `t` fr is that share of the phrase's height: the cartouche opens for it.
            <div key={i} style={{ display: "grid", gridTemplateRows: `${t.toFixed(3)}fr`, opacity: t }}>
              <div style={{ overflow: "hidden", minHeight: 0 }}>
                {breakPhrase(phrase.text, room).map((line, k) => (
                  <div key={k} style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: em, lineHeight: 1.5, color: gold ? C.goldLight : C.ivory, textAlign: "center" }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Cartouche>
    </div>
  );
};
