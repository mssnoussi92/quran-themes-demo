// The catalog's characters traced in chalk (docs/styles.md): the Open Peeps figures as they are, with
// their face and their mood (characters/Character.tsx: the mouth still opens with the voice), turned
// from black ink on white into chalk on slate by one filter:
//   - the ink (black) becomes chalk of the character's colour, with the gaps of a chalk line;
//   - the white inside becomes slate, opaque: it hides what is drawn behind the person, as the
//     prototype's figures did;
//   - what is filled with ink (hair, a hijab, a dark shirt) is not a slab of chalk: it becomes
//     hatching inside its own outline, like every fill of the style (« hachures légères au lieu des
//     aplats »).
//
// Render cost. This filter is the dearest thing of the style (a blur, a hatching, a grain over a
// figure: 0.1 s for a standing person, 0.5 s for the narrator's bust, on a machine without a
// graphics card), so it must not run on every frame. A CharacterView breathes (it stretches by
// 0.6 % and back, on every frame): here the breath is taken out of what is filtered (STILL) and
// given back to the filtered drawing, as a transform of its layer. What is left to redraw is the
// mouth of a character who talks, when it opens or closes.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { CharacterView, placement } from "../../characters/Character";
import type { Character } from "../../types";
import { BOARD, CHALK, type ChalkName } from "./board";

/** The people we follow are in yellow chalk; the others (the narrator) in white. */
export const MAIN = new Set(["amir", "salma"]);
export const chalkOf = (c: Character): ChalkName => (MAIN.has(c.id) ? "yellow" : "white");

const channels = (color: string) => [1, 3, 5].map((i) => (parseInt(color.slice(i, i + 2), 16) / 255).toFixed(4));

/** Diagonal hatching made inside a filter, without an image to load: a staircase of one-pixel
 * floods in a tile of `gap` pixels, tiled. Lines lean like the hatching of the places (////). */
const Stripes: React.FC<{ gap: number; width: number }> = ({ gap, width }) => {
  const floods: { x: number; y: number; w: number }[] = [];
  for (let y = 0; y < gap; y++) {
    const x = gap - 1 - y;
    if (x + width <= gap) floods.push({ x, y, w: width });
    else floods.push({ x, y, w: gap - x }, { x: 0, y, w: x + width - gap });
  }
  return (
    <>
      {floods.map((f, i) => (
        <feFlood key={i} floodColor="#fff" x={f.x} y={f.y} width={f.w} height={1} result={`stripe-${i}`} />
      ))}
      <feMerge x={0} y={0} width={gap} height={gap} result="stripes-tile">
        {floods.map((_, i) => (
          <feMergeNode key={i} in={`stripe-${i}`} />
        ))}
      </feMerge>
      <feTile in="stripes-tile" result="hatch" />
    </>
  );
};

/** The filter of a figure in chalk of one colour, for figures drawn at `scale` (pixels per Open
 * Peeps unit: its lines are about 11 units wide, so 4 px for a standing person of a reel, 12 px
 * for the narrator's bust). */
export const PeepFilter: React.FC<{ id: string; color: string; seed: number; scale: number }> = ({ id, color, seed, scale }) => {
  const [r, g, b] = channels(color);
  // Thin lines are thickened by a pixel: a 3 px line does not read on a phone.
  const thicken = scale < 0.6 ? 1 : 0;
  // Hatching: lighter than the line around it, a line every 9 to 20 px.
  const gap = Math.round(Math.min(20, Math.max(9, 22 * scale + 4)));
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      {/* The ink: alpha where the drawing is dark (ink is #1d1d1d, the inside is white). */}
      <feColorMatrix in="SourceGraphic" type="matrix" colorInterpolationFilters="sRGB" values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  -1.13 0 0 1.13 0`} result="ink" />
      {/* What is filled with ink: after a blur as wide as a line, a line is weak and a filled area
          stays full; the threshold keeps the areas, a line's width inside their edge. */}
      <feGaussianBlur in="ink" stdDeviation={Math.max(2.5, 13.3 * scale)} result="soft" />
      <feColorMatrix in="soft" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 9 -7.4" result="area" />
      <Stripes gap={gap} width={scale < 0.3 ? 2 : scale < 0.6 ? 3 : 4} />
      {/* The areas lose their chalk between the hatching lines; the line around them stays. */}
      <feComposite in="area" in2="hatch" operator="out" result="holes" />
      {thicken ? <feMorphology in="ink" operator="dilate" radius={thicken} result="bold" /> : <feOffset in="ink" result="bold" />}
      <feComposite in="bold" in2="holes" operator="out" result="thick" />
      {/* The chalk's grain. */}
      <feTurbulence type="fractalNoise" baseFrequency={1.1} numOctaves={1} seed={seed + 3} stitchTiles="stitch" x={0} y={0} width={256} height={256} result="grain-tile" />
      <feColorMatrix in="grain-tile" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 1.85" result="gaps-tile" />
      <feTile in="gaps-tile" result="gaps" />
      <feComposite in="thick" in2="gaps" operator="in" result="chalk" />
      {/* The slate inside the figure. */}
      <feFlood floodColor={BOARD} colorInterpolationFilters="sRGB" result="slate" />
      <feComposite in="slate" in2="SourceAlpha" operator="in" result="body" />
      <feMerge>
        <feMergeNode in="body" />
        <feMergeNode in="chalk" />
      </feMerge>
    </filter>
  );
};

/** What a figure needs to be drawn: who, where, how big. */
export type Placed = { c: Character; x: number; floorY: number; scale: number; flip?: boolean };

const filterId = (prefix: string, p: Placed) => `${prefix}-peep-${chalkOf(p.c)}-${Math.round(p.scale * 1000)}`;

/** Filters of the figures of a scene: one per chalk colour and size. */
export const PeepFilters: React.FC<{ prefix: string; seed: number; figures: Placed[] }> = ({ prefix, seed, figures }) => {
  const byId = new Map(figures.map((p) => [filterId(prefix, p), p]));
  return (
    <>
      {[...byId].map(([id, p], i) => (
        <PeepFilter key={id} id={id} color={CHALK[chalkOf(p.c)]} seed={seed + 17 * i} scale={p.scale} />
      ))}
    </>
  );
};

/** The breath of CharacterView (characters/Character.tsx) is a transform of its outer element, set
 * on every frame: this rule holds it still inside the filter (a style sheet's !important wins over
 * an inline style). The same breath is applied outside, by ChalkFigure. */
const STILL = "ck-still";
export const PeepStyles: React.FC = () => <style>{`.${STILL} > div { transform: none !important; }`}</style>;

/** A character in chalk, its feet (or the bottom of its bust) on `floorY`, centred on `x` (on its
 * hips when it sits). `clip`: the frame, so that the filter does not work on what is cut off (a bust
 * is three times larger and goes below the frame). Needs PeepFilters and PeepStyles once around. */
export const ChalkFigure: React.FC<{ p: Placed; audio: string | null; prefix: string; clip: { w: number; h: number } }> = ({ p, audio, prefix, clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const box = placement(p.c, p.x, p.floorY, p.scale);
  // Room for the breath (the figure stretches upward by 0.6 %) and the thickened line.
  const m = 14;
  const left = Math.max(0, Math.floor(box.left - m));
  const top = Math.max(0, Math.floor(box.top - m));
  const right = Math.min(clip.w, Math.ceil(box.left + box.width + m));
  const bottom = Math.min(clip.h, Math.ceil(box.top + box.height + m));
  if (right <= left || bottom <= top) return null;
  // The same slow breath as CharacterView, from the same line (the bottom of its box).
  const breath = 1 + 0.006 * Math.sin((frame / fps) * Math.PI * 0.5);
  return (
    <div
      style={{
        position: "absolute", left, top, width: right - left, height: bottom - top,
        transform: `scaleY(${breath.toFixed(5)})`, transformOrigin: `50% ${(box.top + box.height - top).toFixed(1)}px`, willChange: "transform",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: `url(#${filterId(prefix, p)})` }}>
        <div className={STILL} style={{ position: "absolute", inset: 0, transform: p.flip ? "scaleX(-1)" : undefined, transformOrigin: `${p.x - left}px 50%` }}>
          <CharacterView c={p.c} x={p.x - left} floorY={p.floorY - top} scale={p.scale} audio={audio} />
        </div>
      </div>
    </div>
  );
};
