// The chalkboard (docs/styles.md, « Tableau à la craie »): the slate and its grain, what the eraser
// left on it, the wooden frame; and the two things every drawing of the style goes through: the chalk
// filters (rough edges, gaps where the chalk skipped) and the sweep that writes from right to left.
//
// Render cost. A noise redrawn on every frame is what makes a style slow (the paper style: four
// times the flat one). Here every noise is a small tile (feTurbulence over 256 or 512 px, then
// feTile), and whatever is drawn in chalk stays the same from frame to frame: it is painted once, in
// its own layer (will-change: transform), and what moves is around it: a transform, an opacity, a
// clip made of two opposite translations (Sweep). No filter reads the frame number.
import React from "react";
import { rand } from "../shapes";

export const BOARD = "#1c2723";
export const CHALK = { white: "#efede4", yellow: "#f3d36b", pink: "#f2958a", blue: "#9fcbe0" } as const;
export type ChalkName = keyof typeof CHALK;
/** A softer white: the second line under a quotation, the ghost of a wiped word. */
export const CHALK_SOFT = "#b4c0b9";
const WOOD = { face: "#6b4a2f", edge: "#3f2a19", light: "#84603f" };
/** Width of the wooden frame. */
export const FRAME = 28;

/** A number from a scene id: its smudges, its noise (two scenes are on screen during a transition,
 * and two cards in a row must not look the same). */
export const seedOf = (id: string): number => [...id].reduce((n, c, i) => (n * 31 + c.charCodeAt(0) * (i + 1)) % 9973, 7);

/** An id usable in url(#…) from anything (scene ids are plain, but nothing says so). */
export const idOf = (...parts: string[]): string => parts.join("-").replace(/[^A-Za-z0-9_-]/g, "_");

// ---------------------------------------------------------------------------------------------
// Filters

/** Where a filter works, and where its noise tiles start: a tile is cut by the filter's region, so
 * it must lie inside it (`tile`: a point of the region, in the user space of what is filtered). */
export type Region = {
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  filterUnits?: "userSpaceOnUse" | "objectBoundingBox";
  tile?: [number, number];
};

/** The whole frame, for filters used by thin or small things: a horizontal line has an empty
 * bounding box, a coin a margin of one pixel, and a region in percent of the box would cut them. */
export const frameRegion = (w: number, h: number): Region => ({ filterUnits: "userSpaceOnUse", x: -24, y: -24, width: w + 48, height: h + 48, tile: [-24, -24] });
/** Around the box of what is filtered (an HTML element: its user space starts at its corner). */
const BOX: Region = { x: "-6%", y: "-12%", width: "112%", height: "124%" };

const attrs = ({ tile: _tile, ...region }: Region) => region;

/** Noise tiles: the wobble of the hand (low frequency) and the grain of the slate (high frequency). */
const Wobble: React.FC<{ seed: number; frequency?: number; at?: [number, number] }> = ({ seed, frequency = 0.08, at = [0, 0] }) => (
  <>
    <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={2} seed={seed} stitchTiles="stitch" x={at[0]} y={at[1]} width={512} height={512} result="wobble-tile" />
    <feTile in="wobble-tile" result="wobble" />
  </>
);

/** Where the chalk holds (alpha 1) and where it skipped (alpha 0): `values` is the prototype's
 * threshold on the noise. */
const Gaps: React.FC<{ seed: number; frequency: number; values: string; at?: [number, number] }> = ({ seed, frequency, values, at = [0, 0] }) => (
  <>
    <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={1} seed={seed} stitchTiles="stitch" x={at[0]} y={at[1]} width={256} height={256} result="grain-tile" />
    <feColorMatrix in="grain-tile" type="matrix" values={values} result="gaps-tile" />
    <feTile in="gaps-tile" result="gaps" />
  </>
);

/** The chalk outline around the shapes it is applied to: a ring outside their union (one line around
 * a thing, not one per part), roughened, with gaps. */
export const OutlineFilter: React.FC<{ id: string; color: string; seed: number; width?: number; region: Region }> = ({ id, color, seed, width = 3.5, region }) => (
  <filter id={id} {...attrs(region)}>
    <feMorphology in="SourceAlpha" operator="dilate" radius={width} result="d" />
    <feComposite in="d" in2="SourceAlpha" operator="out" result="ring" />
    <Wobble seed={seed} at={region.tile} />
    <feDisplacementMap in="ring" in2="wobble" scale={6} xChannelSelector="R" yChannelSelector="G" result="rough" />
    <Gaps seed={seed + 3} frequency={1.1} values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 1.85" at={region.tile} />
    <feComposite in="rough" in2="gaps" operator="in" result="chalk" />
    <feFlood floodColor={color} />
    <feComposite in2="chalk" operator="in" />
  </filter>
);

/** Chalk on what is drawn itself (lines, hatching, letters of our own text): rough edges and gaps. */
export const RoughFilter: React.FC<{ id: string; seed: number; scale?: number; region?: Region; dense?: boolean }> = ({ id, seed, scale = 4, region = BOX, dense = false }) => (
  <filter id={id} {...attrs(region)}>
    <Wobble seed={seed} frequency={0.09} at={region.tile} />
    <feDisplacementMap in="SourceGraphic" in2="wobble" scale={scale} xChannelSelector="R" yChannelSelector="G" result="rough" />
    {/* `dense`: letters. The prototype's threshold leaves a third of a stroke empty, fine for a line
        3.5 px wide seen whole, too much for ruqaa letters read at phone size (docs/styles.md, pitfalls:
        « traits trop fins illisibles sur téléphone »): the chalk thins there, it does not skip. */}
    <Gaps seed={seed + 5} frequency={1.2} values={dense ? "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.5 0 0 0 1.72" : "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.75"} at={region.tile} />
    <feComposite in="rough" in2="gaps" operator="in" />
  </filter>
);

/** Light hatching instead of a fill. */
export const Hatch: React.FC<{ id: string; color: string; gap?: number; angle?: number; opacity?: number; width?: number }> = ({ id, color, gap = 16, angle = 35, opacity = 0.55, width = 3 }) => (
  <pattern id={id} patternUnits="userSpaceOnUse" width={gap} height={gap} patternTransform={`rotate(${angle})`}>
    <line x1={0} y1={0} x2={0} y2={gap} stroke={color} strokeWidth={width} opacity={opacity} />
  </pattern>
);

/** Filters that live outside the drawing that uses them (HTML text, the frame of a panel). */
export const Defs: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>{children}</defs>
  </svg>
);

// ---------------------------------------------------------------------------------------------
// The slate

const svgUrl = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

/** The slate's grain: the prototype's noise (frequency 0.6, 12 % of 55 %), as one small tile. */
const GRAIN = svgUrl(
  "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n' x='0' y='0' width='100%' height='100%'>" +
    "<feTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' seed='4' stitchTiles='stitch'/>" +
    "<feColorMatrix type='matrix' values='0 0 0 0 0.85  0 0 0 0 0.9  0 0 0 0 0.88  0.066 0 0 0 0'/></filter>" +
    "<rect width='320' height='320' filter='url(#n)'/></svg>",
);

/** A sentence that was written here and wiped: where its centre was, how wide, how tilted. */
export type Wipe = { x: number; y: number; width: number; height: number; angle: number };

/** What is left on the slate: the grain, clouds of chalk dust, and the bands the eraser left where a
 * sentence was wiped (a board too clean does not look like one: docs/styles.md, « Pièges »).
 * Gradients only, no blur: drawn once and cheap. `strength` lowers everything under a drawing. */
export const Dust: React.FC<{ w: number; h: number; seed: number; id: string; wipes: Wipe[]; strength?: number }> = ({ w, h, seed, id, wipes, strength = 1 }) => {
  const u = Math.min(w, h);
  const r = (k: number) => rand(seed * 0.37 + k * 1.91);
  const clouds = Array.from({ length: 7 }, (_, i) => ({
    cx: (0.1 + 0.8 * r(i)) * w,
    cy: (0.1 + 0.8 * r(i + 9)) * h,
    rx: (0.18 + 0.24 * r(i + 3)) * u,
    ry: (0.07 + 0.1 * r(i + 5)) * u,
    opacity: (0.05 + 0.045 * r(i + 7)) * strength,
    angle: -20 + 40 * r(i + 11),
  }));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, willChange: "transform" }}>
      <defs>
        <radialGradient id={`${id}-cloud`}>
          <stop offset="0" stopColor="#cfd8d2" stopOpacity={1} />
          <stop offset="0.45" stopColor="#cfd8d2" stopOpacity={0.62} />
          <stop offset="1" stopColor="#cfd8d2" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-vignette`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.3} />
        </radialGradient>
      </defs>
      {clouds.map((c, i) => (
        <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={`url(#${id}-cloud)`} opacity={c.opacity} transform={`rotate(${c.angle} ${c.cx} ${c.cy})`} />
      ))}
      {wipes.map((wipe, k) => {
        const q = (n: number) => rand(seed * 0.53 + k * 7.3 + n * 2.17);
        const streaks = Array.from({ length: 5 }, (_, i) => ({
          y: (-0.5 + (i + 0.2 + 0.6 * q(i)) / 5) * wipe.height,
          x: (-0.5 + 0.12 * q(i + 20)) * wipe.width,
          width: (0.72 + 0.26 * q(i + 40)) * wipe.width,
          height: (0.1 + 0.12 * q(i + 60)) * wipe.height,
          opacity: (0.03 + 0.04 * q(i + 80)) * strength,
        }));
        return (
          <g key={k} transform={`translate(${wipe.x} ${wipe.y}) rotate(${wipe.angle})`}>
            <ellipse cx={0} cy={0} rx={wipe.width * 0.62} ry={wipe.height * 0.95} fill={`url(#${id}-cloud)`} opacity={0.085 * strength} />
            {streaks.map((s, i) => (
              <ellipse key={i} cx={s.x + s.width / 2} cy={s.y} rx={s.width / 2} ry={s.height} fill={`url(#${id}-cloud)`} opacity={s.opacity} />
            ))}
          </g>
        );
      })}
      <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-vignette)`} />
    </svg>
  );
};

/** Wiped sentences for a board of this size: `n` of them, seeded; never under the subtitles. */
export const wipesOf = (w: number, h: number, seed: number, n: number, first?: { x: number; y: number }): Wipe[] => {
  const u = Math.min(w, h);
  const r = (k: number) => rand(seed * 0.71 + k * 3.3);
  return Array.from({ length: n }, (_, i) => ({
    x: i === 0 && first ? first.x + (r(1) - 0.5) * 0.06 * u : (0.3 + 0.4 * r(i * 5 + 1)) * w,
    y: i === 0 && first ? first.y + (r(2) - 0.5) * 0.08 * u : (0.14 + 0.5 * r(i * 5 + 2)) * h,
    width: (0.52 + 0.26 * r(i * 5 + 3)) * Math.min(w, 1.5 * u),
    height: (0.1 + 0.06 * r(i * 5 + 4)) * u,
    angle: -5 + 10 * r(i * 5 + 5),
  }));
};

/** The wooden frame, over everything drawn on the board: four boards, a dark edge on each side. */
export const Frame: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const side = (style: React.CSSProperties, vertical: boolean): React.ReactNode => (
    <div
      style={{
        position: "absolute",
        background: `linear-gradient(${vertical ? 90 : 180}deg, ${WOOD.edge} 0, ${WOOD.edge} 3px, ${WOOD.light} 3px, ${WOOD.face} 9px, ${WOOD.face} ${FRAME - 6}px, ${WOOD.edge} ${FRAME - 3}px, ${WOOD.edge} ${FRAME}px)`,
        ...style,
      }}
    />
  );
  return (
    <>
      {side({ left: 0, top: 0, width: w, height: FRAME }, false)}
      {side({ left: 0, top: h - FRAME, width: w, height: FRAME, transform: "scaleY(-1)" }, false)}
      {side({ left: 0, top: 0, width: FRAME, height: h }, true)}
      {side({ left: w - FRAME, top: 0, width: FRAME, height: h, transform: "scaleX(-1)" }, true)}
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// The sweep

/** Shows the part of its children between two fronts, `from` and `to` (0 the left edge, 1 the right
 * one): the hand writes from right to left, the eraser follows. Two boxes that clip, moved by
 * opposite translations, so that what is inside is painted once and never again while it appears.
 * `fill`: the boxes take the whole frame (a drawing); else they take the size of their children
 * (a phrase), with `pad` around it for what overflows the line box (ascenders, the chalk's
 * roughness). */
export const Sweep: React.FC<{ from?: number; to?: number; fill?: boolean; pad?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({
  from = 0,
  to = 1,
  fill = false,
  pad = "0px",
  style,
  children,
}) => {
  const a = Math.min(1, Math.max(0, from)) * 100;
  const b = (1 - Math.min(1, Math.max(0, to))) * 100;
  const box: React.CSSProperties = fill ? { position: "absolute", inset: 0 } : {};
  const pct = (v: number) => `${v.toFixed(3)}%`;
  return (
    <div style={{ ...box, overflow: "hidden", margin: fill ? undefined : `calc(-1 * ${pad})`, transform: `translateX(${pct(a)})`, ...style }}>
      <div style={{ ...box, overflow: "hidden", transform: `translateX(${pct(-a - b)})` }}>
        <div style={{ ...box, padding: fill ? undefined : pad, transform: `translateX(${pct(b)})`, willChange: "transform" }}>{children}</div>
      </div>
    </div>
  );
};

/** Progress 0 → 1 of something that starts at frame `at` and takes `length` frames. */
export const progress = (frame: number, at: number, length: number): number => Math.min(1, Math.max(0, (frame - at) / Math.max(1, length)));

/** The same, eased: the hand starts fast and settles. */
export const eased = (frame: number, at: number, length: number): number => {
  const p = progress(frame, at, length);
  return 1 - (1 - p) * (1 - p);
};
