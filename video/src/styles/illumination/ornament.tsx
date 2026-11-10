// Ornaments of the illuminated page (docs/styles.md): the gold and lapis border of eight-pointed
// stars (khatam), the pointed arch, the rosette that draws itself, the glint of light on the gold.
// No SVG filter anywhere but in the parchment's tile: the paper style showed what they cost.
//
// Render cost, measured (2026-11-10, tawba-03): the renderer draws again, for every frame, whatever
// is not in a layer of its own; a layer (will-change: transform) is drawn once and kept. So what
// never moves on a page (parchment, border, headpiece) is one layer (Still); what moves is small and
// apart: the rosette in a layer of its own size, the glint in four thin strips over the border.
// Without that the same pages took twice the time of the flat style, with nothing moving on them.
import React from "react";
import { C } from "./palette";

/** The page's border: an outer gold line, a lapis band of stars, an inner gold line. */
export type Frame = { gold: number; band: number };
export const FRAMES = {
  /** Reel: 48 px, inside the 90 px no text ever uses. */
  reel: { gold: 10, band: 28 },
  /** Episode: 40 px, clear of the signature (top 50 px). */
  episode: { gold: 8, band: 24 },
  /** Thumbnail (1280x720). */
  thumb: { gold: 7, band: 20 },
} satisfies Record<string, Frame>;
export const thickness = (f: Frame) => 2 * f.gold + f.band;

/** Gold leaf, as the prototype: a diagonal sheen over each shape it fills. `box` [x, y, width,
 * height]: the sheen runs over that square of the picture instead of over each shape's own box, for
 * strokes (a straight line has no box: a gradient in its own box does not paint it at all). */
export const Gold: React.FC<{ id: string; box?: [number, number, number, number] }> = ({ id, box }) => (
  <linearGradient
    id={id}
    {...(box ? { gradientUnits: "userSpaceOnUse", x1: box[0], y1: box[1], x2: box[0] + box[2], y2: box[1] + box[3] } : { x1: "0", y1: "0", x2: "1", y2: "1" })}
  >
    <stop offset="0" stopColor="#b8892f" />
    <stop offset="0.45" stopColor={C.goldLight} />
    <stop offset="0.55" stopColor="#d9b15a" />
    <stop offset="1" stopColor={C.goldDark} />
  </linearGradient>
);

/** The khatam: two squares turned 45° make an eight-pointed star, s wide from point to point.
 * `inner`: the squares keep their crossing lines (the lattice of the prototype's walls); without, the
 * star is one shape with one outline (the border's small stars stay clean on a phone). */
export const Star: React.FC<{ cx: number; cy: number; s: number; fill: string; line: string; width?: number; dot?: boolean; inner?: boolean }> = ({
  cx, cy, s, fill, line, width = 1.5, dot = true, inner = false,
}) => {
  const a = s * 0.354;
  const sq = `M${cx - a} ${cy - a} H${cx + a} V${cy + a} H${cx - a} Z`;
  const turn = `rotate(45 ${cx} ${cy})`;
  return (
    <>
      {inner ? (
        <>
          <path d={sq} fill={fill} stroke={line} strokeWidth={width} />
          <path d={sq} fill={fill} stroke={line} strokeWidth={width} transform={turn} />
        </>
      ) : (
        <>
          <path d={sq} fill={line} stroke={line} strokeWidth={2 * width} strokeLinejoin="round" />
          <path d={sq} fill={line} stroke={line} strokeWidth={2 * width} strokeLinejoin="round" transform={turn} />
          <path d={sq} fill={fill} />
          <path d={sq} fill={fill} transform={turn} />
        </>
      )}
      {dot ? <circle cx={cx} cy={cy} r={s * 0.09} fill={line} /> : null}
    </>
  );
};

/** A field of stars and crosses (a wall, a spandrel): one star in a square tile, lines to its
 * neighbours. */
export const Khatam: React.FC<{ id: string; size: number; ground: string; star: string; line: string; width?: number; dot?: boolean; x?: number; y?: number }> = ({
  id, size, ground, star, line, width = 1.5, dot = true, x = 0, y = 0,
}) => {
  const c = size / 2;
  const k = size * 0.1;
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" x={x} y={y} width={size} height={size}>
      <rect width={size} height={size} fill={ground} />
      <Star cx={c} cy={c} s={size * 0.86} fill={star} line={line} width={width} dot={dot} inner />
      <path d={`M0 ${k} L${k} 0 M${size} ${k} L${size - k} 0 M0 ${size - k} L${k} ${size} M${size} ${size - k} L${size - k} ${size}`} stroke={line} strokeWidth={width} />
    </pattern>
  );
};

const ring = (w: number, h: number, o: number, i: number) =>
  `M${o} ${o} H${w - o} V${h - o} H${o} Z M${i} ${i} V${h - i} H${w - i} V${i} Z`;

/** The two gold lines of the border, and its corner squares: what the glint lights. */
const goldLines = (w: number, h: number, f: Frame) => `${ring(w, h, 0, f.gold)} ${ring(w, h, f.gold + f.band, thickness(f))}`;
const goldCorners = (w: number, h: number, f: Frame) => {
  const B = thickness(f);
  return `M0 0 H${B} V${B} H0 Z M${w - B} 0 H${w} V${B} H${w - B} Z M0 ${h - B} H${B} V${h} H0 Z M${w - B} ${h - B} H${w} V${h} H${w - B} Z`;
};

/** The page's border, drawn once: whole stars all the way round (the tile is stretched by a pixel
 * or so to fit a whole number of them between the corners), a bigger star in each corner. */
export const Border = React.memo<{ w: number; h: number; f: Frame; prefix: string }>(({ w, h, f, prefix }) => {
  const { gold: g, band: b } = f;
  const B = thickness(f);
  const tw = (w - 2 * B) / Math.max(1, Math.round((w - 2 * B) / b));
  const th = (h - 2 * B) / Math.max(1, Math.round((h - 2 * B) / b));
  const gold = `url(#${prefix}-gold)`;
  const diamond = (x: number, y: number) => `M${x - 0.1 * b} ${y} L${x} ${y - 0.1 * b} L${x + 0.1 * b} ${y} L${x} ${y + 0.1 * b} Z`;
  const corners: [number, number][] = [[0, 0], [w - B, 0], [0, h - B], [w - B, h - B]];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <Gold id={`${prefix}-gold`} />
        {/* The tile is as high as the page between the two bands: it starts again exactly on the
            bottom band (and the right one), so one pattern draws both. */}
        <pattern id={`${prefix}-bh`} patternUnits="userSpaceOnUse" x={B} y={g} width={tw} height={h - 2 * g - b}>
          <Star cx={tw / 2} cy={b / 2} s={b * 0.8} fill={C.lapisLight} line={C.gold} width={1.4} />
          <path d={`${diamond(0, b / 2)} ${diamond(tw, b / 2)}`} fill={C.gold} />
        </pattern>
        <pattern id={`${prefix}-bv`} patternUnits="userSpaceOnUse" x={g} y={B} width={w - 2 * g - b} height={th}>
          <Star cx={b / 2} cy={th / 2} s={b * 0.8} fill={C.lapisLight} line={C.gold} width={1.4} />
          <path d={`${diamond(b / 2, 0)} ${diamond(b / 2, th)}`} fill={C.gold} />
        </pattern>
      </defs>
      <path d={ring(w, h, 0, B)} fill={C.lapis} fillRule="evenodd" />
      <rect x={B} y={g} width={w - 2 * B} height={h - 2 * g} fill={`url(#${prefix}-bh)`} />
      <rect x={g} y={B} width={w - 2 * g} height={h - 2 * B} fill={`url(#${prefix}-bv)`} />
      <path d={ring(w, h, 0, g)} fill={gold} fillRule="evenodd" />
      <path d={ring(w, h, g + b, B)} fill={gold} fillRule="evenodd" />
      {corners.map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={B} height={B} fill={gold} />
          <rect x={x + g * 0.6} y={y + g * 0.6} width={B - g * 1.2} height={B - g * 1.2} fill={C.lapis} stroke={C.ink} strokeWidth={0.8} strokeOpacity={0.5} />
          <Star cx={x + B / 2} cy={y + B / 2} s={(B - g * 1.2) * 0.84} fill={C.turquoise} line={C.goldLight} width={1.4} />
        </g>
      ))}
      {/* The fine ink line that closes every painted thing, and a hairline of gold on the page. */}
      <rect x={B + 0.5} y={B + 0.5} width={w - 2 * B - 1} height={h - 2 * B - 1} fill="none" stroke={C.ink} strokeWidth={1.2} strokeOpacity={0.55} />
      <rect x={B + 7} y={B + 7} width={w - 2 * B - 14} height={h - 2 * B - 14} fill="none" stroke={C.gold} strokeWidth={1.5} strokeOpacity={0.7} />
    </svg>
  );
});

/** The headpiece of a page of text (the band of ornament at the head of a manuscript's page): gold
 * lattice on lapis, where the spandrels of a scene's arch begin, so that the page keeps its head from
 * a scene to a card; and the page's signature (Video.tsx writes it there, light on a dark pill) sits
 * on it instead of on the parchment. Reel: under the top safe area; episode: under the border. */
export const HEADPIECE = {
  reel: { x: 70, y: 232, w: 940, h: 82 },
  episode: { x: 40, y: 40, w: 1840, h: 62 },
};

export const Headpiece = React.memo<{ id: "reel" | "episode"; w: number; h: number; prefix: string }>(({ id, w, h, prefix }) => {
  const b = HEADPIECE[id];
  const flush = id === "episode";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <Gold id={`${prefix}-hgold`} />
        <Khatam id={`${prefix}-head`} size={56} ground={C.lapis} star="#234680" line="#a88f4f" width={1.3} dot={false} x={w / 2 - 28} y={b.y + 6} />
      </defs>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={`url(#${prefix}-head)`} />
      {flush ? (
        <>
          <rect x={b.x} y={b.y + b.h - 4} width={b.w} height={7} fill={C.ink} opacity={0.75} />
          <rect x={b.x} y={b.y + b.h - 3} width={b.w} height={5} fill={`url(#${prefix}-hgold)`} />
        </>
      ) : (
        <>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke={C.ink} strokeWidth={8.5} strokeOpacity={0.75} />
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke={`url(#${prefix}-hgold)`} strokeWidth={6} />
        </>
      )}
    </svg>
  );
});

/** When the light passes over the gold, and how far it has got (0 to 1), or null between two
 * passes: now and then, not at the same moment on every page (seed), never as a scene comes in. */
export const glintAt = (frame: number, fps: number, seed: number): number | null => {
  const first = 0.9 + 3.4 * (((seed * 7) % 11) / 11);
  const period = 6.4 + 2 * (((seed * 5) % 7) / 7);
  const length = 1.3;
  const t = frame / fps - first;
  if (t < 0) return null;
  const k = t % period;
  return k < length ? k / length : null;
};

/** A piece of the picture as its own small SVG, in the picture's coordinates: what changes in it
 * is drawn again over its own surface only. */
export const Patch: React.FC<{ x: number; y: number; w: number; h: number; layer?: boolean; children: React.ReactNode }> = ({ x, y, w, h, layer = false, children }) => (
  <svg
    width={w} height={h} viewBox={`${x} ${y} ${w} ${h}`}
    style={{ position: "absolute", left: x, top: y, pointerEvents: "none", willChange: layer ? "transform" : undefined }}
  >
    {children}
  </svg>
);

/** The glint: a soft slanted band of light that shows only where there is gold. Over the border: one
 * thin strip a side (its two gold lines); and over the lines given in `lines`, stroked, in the box
 * `around` them (the arch of a scene). Mounted only while it passes. */
export const Glint: React.FC<{ w: number; h: number; f: Frame; p: number; prefix: string; lines?: { d: string; width: number }[]; around?: [number, number, number, number] }> = ({
  w, h, f, p, prefix, lines = [], around,
}) => {
  // The band leans by a third: it must start left of the page and end right of its bottom corner.
  const x = -260 + p * (w + h / 3 + 520);
  const B = thickness(f);
  const light = (id: string) => (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x - 150} y1={0} x2={x + 150} y2={100}>
        <stop offset="0" stopColor="#fffbe6" stopOpacity={0} />
        <stop offset="0.5" stopColor="#fffbe6" stopOpacity={0.92} />
        <stop offset="1" stopColor="#fffbe6" stopOpacity={0} />
      </linearGradient>
    </defs>
  );
  const strips: [number, number, number, number][] = [[0, 0, w, B], [0, h - B, w, B], [0, B, B, h - 2 * B], [w - B, B, B, h - 2 * B]];
  return (
    <>
      {strips.map(([sx, sy, sw, sh], i) => (
        <Patch key={i} x={sx} y={sy} w={sw} h={sh}>
          {light(`${prefix}-glint${i}`)}
          <path d={goldLines(w, h, f)} fill={`url(#${prefix}-glint${i})`} fillRule="evenodd" />
          <path d={goldCorners(w, h, f)} fill={`url(#${prefix}-glint${i})`} opacity={0.6} />
        </Patch>
      ))}
      {around && lines.length ? (
        <Patch x={around[0]} y={around[1]} w={around[2]} h={around[3]}>
          {light(`${prefix}-glint4`)}
          {lines.map((l, i) => (
            <path key={i} d={l.d} fill="none" stroke={`url(#${prefix}-glint4)`} strokeWidth={l.width} />
          ))}
        </Patch>
      ) : null}
    </>
  );
};

/** A pointed arch (the keel arch of the prototype): straight sides up to the shoulders, then an
 * ogee to the point; any width (wide and low in 16:9). */
export const archPath = (x0: number, x1: number, apex: number, spring: number, bottom: number): string => {
  const hw = (x1 - x0) / 2;
  const cx = x0 + hw;
  const r = spring - apex;
  return [
    `M${x0} ${bottom} L${x0} ${spring}`,
    `Q${x0} ${spring - 0.333 * r} ${x0 + 0.359 * hw} ${spring - 0.528 * r}`,
    `Q${x0 + 0.82 * hw} ${spring - 0.778 * r} ${cx} ${apex}`,
    `Q${x1 - 0.82 * hw} ${spring - 0.778 * r} ${x1 - 0.359 * hw} ${spring - 0.528 * r}`,
    `Q${x1} ${spring - 0.333 * r} ${x1} ${spring}`,
    `L${x1} ${bottom} Z`,
  ].join(" ");
};

/** Star polygons a compass and a ruler draw: n points on a circle, each joined to the one `step`
 * further. A page has two, one inside the other, of the same n (one rosette, not two): [n, step of
 * the outer one, step of the inner one]. The first is the prototype's. */
export const ROSETTES: [number, number, number][] = [
  [16, 3, 3], [12, 5, 5], [16, 5, 3], [10, 3, 3], [20, 7, 7], [8, 3, 3], [16, 7, 5], [12, 5, 4], [20, 9, 7],
];

/** A rosette that draws itself (p from 0 to 1): the circle first, then chord after chord, as a hand
 * would. Drawn (p = 1), nothing in it changes any more. */
export const Rosette: React.FC<{ cx: number; cy: number; r: number; n: number; step: number; turn?: number; p: number; stroke: string; width: number; opacity?: number }> = ({
  cx, cy, r, n, step, turn = 0, p, stroke, width, opacity = 1,
}) => {
  const done = p >= 1;
  // Each stroke takes a third of the time; they start one after the other (the circle is stroke 0).
  const length = 0.34;
  const at = (k: number) => Math.max(0, Math.min(1, (p - ((1 - length) * k) / n) / length));
  const dash = (q: number) => (done ? {} : { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - q });
  const lines: React.ReactNode[] = [];
  for (let k = 0; k < n; k++) {
    const a = turn + (k * 2 * Math.PI) / n - Math.PI / 2;
    const b = a + (step * 2 * Math.PI) / n;
    const q = at(k + 1);
    if (!done && q <= 0) continue;
    lines.push(
      <path key={k} d={`M${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} L${(cx + r * Math.cos(b)).toFixed(1)} ${(cy + r * Math.sin(b)).toFixed(1)}`} {...dash(q)} />,
    );
  }
  return (
    <g fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} strokeWidth={width * 0.75} transform={`rotate(-90 ${cx} ${cy})`} {...dash(at(0))} />
      {lines}
    </g>
  );
};

/** A noise of parchment (the prototype's turbulence), as one small tile that repeats: an image the
 * browser draws once, where a filter over the page would be computed again for every frame. */
const TILE = encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='640'><filter id='n' x='0' y='0' width='100%' height='100%'>" +
    "<feTurbulence type='fractalNoise' baseFrequency='0.0203' numOctaves='4' seed='21' stitchTiles='stitch'/>" +
    "<feColorMatrix type='matrix' values='0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.25  0.22 0 0 0 0'/></filter>" +
    "<rect width='640' height='640' filter='url(#n)'/></svg>",
);

/** The parchment of the page: fills its parent, never changes. `hole` [x, y, width, height]: left
 * open there (the painting of a scene shows through). */
export const Parchment = React.memo<{ hole?: [number, number, number, number] }>(({ hole }) => {
  const [x, y, w, h] = hole ?? [0, 0, 0, 0];
  return (
    <div
      style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 46%, rgba(255, 250, 232, 0.35) 0%, rgba(255, 250, 232, 0) 48%, rgba(150, 110, 50, 0.16) 100%), url("data:image/svg+xml,${TILE}"), ${C.parchment}`,
        clipPath: hole ? `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x}px ${y}px, ${x}px ${y + h}px, ${x + w}px ${y + h}px, ${x + w}px ${y}px, ${x}px ${y}px)` : undefined,
      }}
    />
  );
});

/** What never moves on a page, as one layer the renderer draws once (see the top of this file). */
export const Still: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, willChange: "transform" }}>{children}</div>
);
