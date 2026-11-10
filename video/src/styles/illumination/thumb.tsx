// The YouTube thumbnail in the illumination style (1280x720, read at 170 px wide on a phone): the
// page and its border; on the left the episode's character in a small arch (or a rosette when it has
// none); on the right the words, the subject biggest (`big`: ivory on the lapis of a gold cartouche),
// the other line above it in the red ink of a manuscript's headings, the English line small.
// Nothing in the bottom-right corner (YouTube's duration badge). A still: nothing moves.
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "../../fonts";
import type { Character, ResolvedScene, ThumbnailData } from "../../types";
import { archPath, Border, FRAMES, Gold, Khatam, Parchment, Rosette } from "./ornament";
import { modelOf, PaintDefs, Plane } from "./paint";
import { SAFE, widthOf } from "./advance";
import { C, GOLD_CSS, INK } from "./palette";

const W = 1280;
const H = 720;
const PREFIX = "il-thumb";

/** The arch on the left: x from 66 to 430, its point at 70, its foot at 654. */
const ARCH = { x0: 78, x1: 418, apex: 82, spring: 232, bottom: 642 };
const BLOCK = { x: 66, y: 66, w: 364, h: 588 };

/** The character alone on a turquoise ground (ivory on gold is too pale at 170 px), standing (a
 * silhouette, no face), seen from close: cut at
 * the thighs by the arch's foot, so that the head is big enough to be a person at 170 px. */
const Vignette: React.FC<{ c: Character }> = ({ c }) => {
  const visual = { template: "scene", background: "plain", icon: null, highlight: "none", characters: [{ ...c, pose: "standing", kind: "standing" }] } as ResolvedScene["visual"];
  const box = { x: ARCH.x0 - 4, y: ARCH.apex - 4, w: ARCH.x1 - ARCH.x0 + 8, h: ARCH.bottom - ARCH.apex + 8, f: 846 - ARCH.apex, person: 660 };
  const model = modelOf(visual, box, PREFIX, 0.47);
  const arch = archPath(ARCH.x0, ARCH.x1, ARCH.apex, ARCH.spring, ARCH.bottom);
  return (
    <>
      <div style={{ position: "absolute", left: BLOCK.x, top: BLOCK.y, width: BLOCK.w, height: BLOCK.h, overflow: "hidden", background: C.lapis }}>
        <div style={{ position: "absolute", left: -BLOCK.x, top: -BLOCK.y, width: W, height: H }}>
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <PaintDefs prefix={PREFIX} sky={model.sky} ground="turquoise" />
          </svg>
          <Plane model={model} prefix={PREFIX} w={W} h={H} part="back" />
        </div>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <Gold id={`${PREFIX}-pgold`} />
          <Khatam id={`${PREFIX}-spandrel`} size={44} ground={C.lapis} star={C.lapisLight} line={C.gold} width={1.3} x={(ARCH.x0 + ARCH.x1) / 2 - 22} y={BLOCK.y + 4} />
        </defs>
        <path d={`M${BLOCK.x} ${BLOCK.y} H${BLOCK.x + BLOCK.w} V${BLOCK.y + BLOCK.h} H${BLOCK.x} Z ${arch}`} fill={`url(#${PREFIX}-spandrel)`} fillRule="evenodd" />
        <rect x={BLOCK.x} y={BLOCK.y} width={BLOCK.w} height={BLOCK.h} fill="none" stroke={C.ink} strokeWidth={8} strokeOpacity={0.75} />
        <rect x={BLOCK.x} y={BLOCK.y} width={BLOCK.w} height={BLOCK.h} fill="none" stroke={`url(#${PREFIX}-pgold)`} strokeWidth={5.5} />
        <path d={arch} fill="none" stroke={C.ink} strokeWidth={11} strokeLinejoin="round" />
        <path d={arch} fill="none" stroke={`url(#${PREFIX}-pgold)`} strokeWidth={8} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/** No character: a shamsa, the rosette of a manuscript's first page, gold on lapis. */
const Shamsa: React.FC = () => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <Gold id={`${PREFIX}-pgold`} />
    </defs>
    <circle cx={250} cy={360} r={196} fill={C.ink} opacity={0.7} />
    <circle cx={250} cy={360} r={193} fill={`url(#${PREFIX}-pgold)`} />
    <circle cx={250} cy={360} r={182} fill={C.lapis} />
    <Rosette cx={250} cy={360} r={170} n={16} step={5} p={1} stroke={C.goldLight} width={4} />
    <Rosette cx={250} cy={360} r={104} n={8} step={3} p={1} stroke={C.goldLight} width={3.5} />
  </svg>
);

export const Thumb: React.FC<{ t: ThumbnailData; c: Character | null }> = ({ t, c }) => {
  // The line that says the subject (« عن التوبة » rather than « ٣ أفكار غلط »): the kicker when the
  // episode says so, else the headline; without a kicker the headline is the only line.
  const subject = t.big === "kicker" && t.kicker ? t.kicker : t.headline;
  const left = 478;
  const column = W - 62 - left;
  // The subject as big as the column lets it be: its own width (advance.ts) and the cartouche's
  // padding and line (0.9 em); 176 px at most, so that the three lines fit the height. No lobes
  // here: at 170 px wide every pixel of the column goes to the letters.
  const em = Math.floor(Math.min(176, column / (widthOf(subject.ar) * SAFE + 0.9)));
  const g = Math.max(6, Math.round(0.07 * em));
  const english = `${t.headline.en}${t.kicker ? ` ${t.kicker.en}` : ""}`;
  return (
    <AbsoluteFill>
      <Parchment />
      {c ? <Vignette c={c} /> : <Shamsa />}
      <Border w={W} h={H} f={FRAMES.thumb} prefix={PREFIX} />
      {/* The words end 84 px above the bottom: the duration badge covers the corner under them. */}
      <div style={{ position: "absolute", left, top: 50, width: column, bottom: 84, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {/* In reading order: the headline, then the kicker; whichever says the subject is the big one. */}
        {[t.headline, t.kicker].map((line, i) =>
          line === null ? null : line === subject ? (
            <div
              key={i}
              dir="rtl"
              style={{
                position: "relative", margin: "10px 0 6px", padding: `0 ${Math.round(0.36 * em)}px ${Math.round(0.12 * em)}px`, border: `${g}px solid transparent`, borderRadius: Math.round(0.3 * em),
                background: `linear-gradient(${C.lapis}, ${C.lapis}) padding-box, ${GOLD_CSS} border-box`,
                boxShadow: "0 0 0 2px rgba(43, 33, 26, 0.7), 0 12px 0 rgba(84, 56, 14, 0.2)",
                fontFamily: FONT.arabic, fontWeight: 700, fontSize: em, lineHeight: 1.36, color: C.ivory, whiteSpace: "nowrap",
              }}
            >
              <div style={{ position: "absolute", inset: 6, border: "1.5px solid rgba(243, 220, 142, 0.5)", borderRadius: Math.round(0.3 * em) - g - 6 }} />
              {line.ar}
            </div>
          ) : (
            <div key={i} dir="rtl" style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: Math.floor(Math.min(88, column / (widthOf(line.ar) * SAFE))), lineHeight: 1.3, color: INK.highlight, whiteSpace: "nowrap" }}>
              {line.ar}
            </div>
          ),
        )}
        {/* Lora advances half an em a letter: the line never leaves the column. */}
        <div style={{ marginTop: 16, fontFamily: FONT.latin, fontSize: Math.floor(Math.min(38, column / (0.53 * english.length))), fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>
          {english}
        </div>
      </div>
    </AbsoluteFill>
  );
};
