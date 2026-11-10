// What is written on the board (docs/styles.md, « Tableau à la craie »): the board behind a card, the
// narration line of a title card in ruqaa, written from right to left when the voice reaches each
// phrase, and the chalk frame of a quotation.
//
// A verse or a hadith is never touched: templates/cards.tsx draws it inside the Panel, in the
// colours of `INK`, and the Panel only draws a frame behind it (the roughness is on the frame's own
// element, which has no child).
import React, { useContext, useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AudioStart } from "../../audioStart";
import { FONT } from "../../fonts";
import { SUBTITLE_RESERVE, type Format, toFrames } from "../../formats";
import { splitPhrases } from "../../phrases";
import type { KitProps, PanelKind, TitlePhrase } from "../kit";
import { BOARD, CHALK, CHALK_SOFT, Defs, Dust, Frame, RoughFilter, Sweep, eased, idOf, progress, seedOf, wipesOf } from "./board";

/** With the safe area, the stage a card is centred in. */
const RESERVE = SUBTITLE_RESERVE;

const stageOf = (format: Format) => {
  const top = format.safe.top;
  const bottom = format.height - format.safe.bottom - RESERVE[format.id];
  return { width: format.width - format.safe.left - format.safe.right, height: bottom - top, centre: { x: format.width / 2, y: (top + bottom) / 2 } };
};

/** Behind a card: the board in its frame. The eraser has been here: one sentence was wiped where
 * the card writes its own (the false idea, then the right one at the same place), others elsewhere,
 * different on every card. */
export const ChalkBackdrop: React.FC<KitProps> = ({ scene, format }) => {
  const seed = seedOf(scene.id);
  const { width: w, height: h } = format;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: BOARD }}>
      <Dust w={w} h={h} seed={seed} id={idOf("ckb", scene.id)} wipes={wipesOf(w, h, seed, 2 + (seed % 2), stageOf(format).centre)} />
      <Frame w={w} h={h} />
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// The narration line

const RUQAA = `"${FONT.ruqaa}", "${FONT.arabic}"`;
/** Width of a ruqaa letter, in em, on average over a phrase (measured on the lines of the episodes;
 * spaces count, vowel signs do not). */
const LETTER = 0.33;
const LINE_HEIGHT = 1.5;

const letters = (text: string) => text.replace(/[\u064B-\u0652\u0670]/g, "").length;

/** The size of the hand: as large as a short phrase allows, each phrase on one line when that keeps
 * it readable on a phone, else on two or three lines that still fit the stage. */
const sizeOf = (lines: string[], format: Format): number => {
  const stage = stageOf(format);
  const [max, min] = format.id === "reel" ? [118, 82] : [108, 78];
  const width = stage.width * 0.94;
  const longest = Math.max(1, ...lines.map(letters));
  const oneLine = width / (LETTER * longest);
  if (oneLine >= min) return Math.round(Math.min(max, oneLine));
  // Phrases wrap: the largest size at which all the rows fit 80 % of the stage's height.
  for (let size = min; size > 40; size -= 2) {
    const rows = lines.reduce((n, line) => n + Math.ceil((LETTER * letters(line) * size * 1.08) / width), 0);
    if (rows * LINE_HEIGHT * size <= stage.height * 0.8) return size;
  }
  return 40;
};

/** A line drawn by hand under a phrase, from right to left. */
const Underline: React.FC<{ filter: string; color: string; shown: number }> = ({ filter, color, shown }) => (
  <div style={{ position: "absolute", left: "-3%", right: "-3%", top: "calc(100% - 0.26em)" }}>
    <Sweep from={1 - shown} pad="8px">
      <svg viewBox="0 0 1000 44" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 44, overflow: "visible" }}>
        <path d="M992 20 Q760 34 520 22 Q270 10 8 26" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" filter={`url(#${filter})`} />
      </svg>
    </Sweep>
  </div>
);

/** The felt eraser, seen from its wooden back, as tall as what it wipes. */
const Eraser: React.FC<{ at: number }> = ({ at }) => (
  <div style={{ position: "absolute", top: "-0.35em", bottom: "-0.35em", left: `${(at * 100).toFixed(2)}%`, width: 0, minHeight: "1.6em" }}>
    <div
      style={{
        position: "absolute", top: 0, bottom: 0, left: -46, width: 92, transform: "rotate(-6deg)", borderRadius: 12,
        background: "linear-gradient(90deg, #d9d5c8 0, #d9d5c8 14px, #5a3d25 14px, #8a6541 26px, #7a5738 70px, #5a3d25 92px)",
        boxShadow: "0 6px 14px rgba(0, 0, 0, 0.35), 26px 0 30px 6px rgba(215, 223, 218, 0.13)",
      }}
    />
  </div>
);

/** The narration line of a title card: ruqaa, one phrase under the other, each written from right to
 * left when the voice reaches it. By the scene's role: a `misconception` is the false idea, struck
 * through in pink as the voice ends it, then wiped (its ghost stays on the board); the last phrase
 * of a `lesson` or a `conclusion` is in yellow, underlined by hand. */
export const ChalkTitle: React.FC<KitProps & { phrases: TitlePhrase[] }> = ({ scene, format, phrases }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const lead = useContext(AudioStart);
  if (phrases.length === 0) return null;
  // A line without timing comes as one phrase: still one phrase per row, written one after the other
  // at once (a card whose text does not match the take's phrases is shown in one piece).
  const untimed = phrases.length === 1;
  const lines = untimed ? splitPhrases(phrases[0].text).map((text) => ({ text, at: phrases[0].at })) : phrases;
  if (lines.length === 0) return null;
  const size = sizeOf(lines.map((l) => l.text), format);
  // The first phrase is written as the card comes in, so that the voice finds it there; a card that
  // opens a video (no transition) has it from its first frame, the frame that may be its cover.
  const first = lead === 0 ? -30 : lead - 10;
  const starts = lines.map((line, i) => (untimed ? line.at + first + i * 7 : i === 0 ? first : line.at));
  const content = toFrames(scene.duration.seconds);
  const end = lead + content;
  const exit = Math.max(0, durationInFrames - end);
  const last = lines.length - 1;
  // The false idea: struck through over the last word, then wiped while the next scene comes in
  // over it (or just before the end, when nothing follows).
  const wrong = scene.role === "misconception";
  const STRIKE = 8;
  const WIPE = 10;
  let wipeAt = exit >= WIPE ? end - 2 : durationInFrames - WIPE - 4;
  let strikeAt = wipeAt - STRIKE - 1;
  if (strikeAt < starts[last] + 5) {
    strikeAt = starts[last] + 5;
    wipeAt = strikeAt + STRIKE + 1;
  }
  const lengths = lines.map((line, i) => {
    const natural = Math.min(15, Math.max(6, Math.round(fps * (0.2 + 0.012 * letters(line.text)))));
    const until = i < last ? starts[i + 1] : wrong ? strikeAt : Infinity;
    return Math.max(4, Math.min(natural, until - starts[i]));
  });
  const struck = wrong ? eased(frame, strikeAt, STRIKE) : 0;
  const wiped = wrong ? progress(frame, wipeAt, WIPE) : 0;
  const keyed = scene.role === "lesson" || scene.role === "conclusion";
  const underlined = keyed ? eased(frame, starts[last] + lengths[last] + 2, 9) : 0;
  const rough = idOf("ckt", scene.id);
  const pad = "0.45em";
  const row: React.CSSProperties = { position: "relative", display: "flex", flexDirection: "column", width: "fit-content", maxWidth: "100%" };
  const column: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.08em" };
  return (
    <div
      dir="rtl"
      lang="ar"
      style={{ position: "relative", width: "100%", fontFamily: RUQAA, fontWeight: 700, fontSize: size, lineHeight: LINE_HEIGHT, color: CHALK.white, textWrap: "balance" }}
    >
      <Defs>
        <RoughFilter id={rough} seed={8 + (seedOf(scene.id) % 9)} scale={3} dense />
      </Defs>
      <Sweep to={1 - wiped} pad={pad}>
        <div style={column}>
          {lines.map((line, i) => (
            <div key={i} style={row}>
              <Sweep from={1 - eased(frame, starts[i], lengths[i])} pad={pad}>
                <div style={{ filter: `url(#${rough})`, color: keyed && i === last ? CHALK.yellow : CHALK.white }}>{line.text}</div>
              </Sweep>
              {struck > 0 ? (
                // The same phrase, its letters invisible, its strike-through visible: one rough pink
                // line through every row of the phrase, wherever the phrase wraps.
                <div style={{ position: "absolute", inset: 0 }} aria-hidden>
                  <Sweep from={1 - struck} pad={pad}>
                    <div style={{ filter: `url(#${rough})`, color: "transparent", textDecoration: `line-through ${CHALK.pink}`, textDecorationThickness: "0.1em" }}>{line.text}</div>
                  </Sweep>
                </div>
              ) : null}
              {keyed && i === last && underlined > 0 ? <Underline filter={rough} color={CHALK.yellow} shown={underlined} /> : null}
            </div>
          ))}
        </div>
      </Sweep>
      {wiped > 0 ? (
        // What the eraser leaves: the ghost of the letters, in a cloud of dust.
        <div style={{ position: "absolute", inset: 0 }} aria-hidden>
          <Sweep from={1 - wiped} pad={pad}>
            <div style={{ ...column, background: "radial-gradient(ellipse 58% 62% at 50% 50%, rgba(215, 223, 218, 0.13), rgba(215, 223, 218, 0) 100%)" }}>
              {lines.map((line, i) => (
                <div key={i} style={{ ...row, color: CHALK_SOFT, opacity: 0.2, filter: "blur(2.5px)" }}>
                  {line.text}
                </div>
              ))}
            </div>
          </Sweep>
        </div>
      ) : null}
      {wiped > 0 && wiped < 1 ? <Eraser at={1 - wiped} /> : null}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// The frame of a quotation

/** Colours of what cards.tsx draws inside the Panel: chalk white, a softer white, yellow for the
 * reference and for the word being recited. */
export const INK = { text: CHALK.white, muted: CHALK_SOFT, accent: CHALK.yellow, highlight: CHALK.yellow };

const corner = (v: "top" | "bottom", s: "left" | "right", inset: number, size: number, width: number): React.CSSProperties => ({
  position: "absolute", [v]: inset, [s]: inset, width: size, height: size,
  [`border${v === "top" ? "Top" : "Bottom"}`]: `${width}px solid ${CHALK.white}`,
  [`border${s === "left" ? "Left" : "Right"}`]: `${width}px solid ${CHALK.white}`,
});

/** The frame of a verse, a hadith or a name, drawn in chalk on a part of the slate wiped clean for
 * it: a double line for a verse, a line with marked corners for a hadith, a line above and one
 * under a name. The text is laid out by cards.tsx, in a column, and stays as it is published. */
export const ChalkPanel: React.FC<{ kind: PanelKind; format: Format; children: React.ReactNode }> = ({ kind, children }) => {
  const rough = idOf("ckp", useId());
  const line = `4px solid ${CHALK.white}`;
  return (
    <div style={{ position: "relative", isolation: "isolate", display: "flex", flexDirection: "column", alignItems: "center", gap: 30, padding: kind === "name" ? "52px 48px" : "60px 54px" }}>
      <Defs>
        <RoughFilter id={rough} seed={kind === "ayah" ? 21 : kind === "hadith" ? 34 : 47} scale={5} />
      </Defs>
      <div style={{ position: "absolute", inset: 0, zIndex: -1, willChange: "transform" }}>
        <div style={{ position: "absolute", inset: 8, borderRadius: 16, background: BOARD, opacity: kind === "name" ? 0 : 0.55 }} />
        <div style={{ position: "absolute", inset: 0, filter: `url(#${rough})` }}>
          {kind === "name" ? (
            <div style={{ position: "absolute", inset: "8px 14%", borderTop: line, borderBottom: line }} />
          ) : (
            <div style={{ position: "absolute", inset: 8, border: line, borderRadius: 16 }} />
          )}
          {kind === "ayah" ? <div style={{ position: "absolute", inset: 22, border: `2.5px solid ${CHALK.white}`, borderRadius: 8, opacity: 0.75 }} /> : null}
          {kind === "hadith"
            ? (["top", "bottom"] as const).flatMap((v) => (["left", "right"] as const).map((s) => <div key={v + s} style={corner(v, s, 24, 36, 3)} />))
            : null}
        </div>
      </div>
      {children}
    </div>
  );
};
