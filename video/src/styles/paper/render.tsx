// The paper-cut style in the episodes (docs/styles.md): a place of the catalog (places.ts) with the
// scene's characters as silhouettes (silhouettes.ts), drawn as sheets of cut paper lit from behind;
// and the backdrop of the cards. Every frame can be drawn alone (no state, seeded randomness).
import React, { createContext } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Format } from "../../formats";
import type { ResolvedScene, VisualStyle } from "../../types";
import type { Layer, Shape } from "../geometry";
import { mix, rand, Shapes } from "../shapes";
import { PAPER_PLACES, type PaperPalette, type Place } from "./places";
import { silhouette } from "./silhouettes";

/** The episode's visual style, for every template (Video.tsx provides it). */
export const StyleContext = createContext<VisualStyle>("flat");

/** Where the floor is, per format (the same as the flat scenes: the subtitles stay below). */
const FLOOR = { reel: 1360, episode: 880 };
/** Main characters wear the accent colour; the others are dark silhouettes. */
const MAIN = new Set(["amir", "salma"]);

export const ladderAt = (p: PaperPalette, depth: number): string => {
  const stops = p.ladder;
  for (let i = 1; i < stops.length; i++) {
    if (depth <= stops[i][0]) {
      const [d0, c0] = stops[i - 1];
      const [d1, c1] = stops[i];
      return mix(c0, c1, (depth - d0) / (d1 - d0));
    }
  }
  return stops[stops.length - 1][1];
};

const colourOf = (layer: Layer, p: PaperPalette): string => {
  const dark = p.ladder[p.ladder.length - 1][1];
  if (layer.role === "accent") return p.accent[layer.tint ?? 0];
  const base = ladderAt(p, layer.depth);
  if (layer.role === "figure") return mix(base, dark, 0.66 + 0.12 * (layer.tint ?? 0));
  return layer.tint ? mix(base, dark, 0.12 * layer.tint) : base;
};

/** Fibre, rim light on the top edge, dark band at the bottom edge, shadow on the sheets behind. */
const SheetFilter: React.FC<{ id: string; seed: number; rim: string; u: number }> = ({ id, seed, rim, u }) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="125%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={seed} result="fine" />
    <feColorMatrix in="fine" type="saturate" values="0" result="fineGrey" />
    <feComponentTransfer in="fineGrey" result="fineSoft">
      <feFuncR type="linear" slope={0.12} intercept={0.44} />
      <feFuncG type="linear" slope={0.12} intercept={0.44} />
      <feFuncB type="linear" slope={0.12} intercept={0.44} />
    </feComponentTransfer>
    <feBlend in="SourceGraphic" in2="fineSoft" mode="soft-light" result="fibre" />
    <feComposite in="fibre" in2="SourceAlpha" operator="in" result="sheet" />
    <feOffset in="SourceAlpha" dy={0.004 * u} result="down" />
    <feComposite in="SourceAlpha" in2="down" operator="out" result="topEdge" />
    <feFlood floodColor={rim} floodOpacity={0.85} />
    <feComposite in2="topEdge" operator="in" result="rim" />
    <feOffset in="SourceAlpha" dy={-0.006 * u} result="up" />
    <feComposite in="SourceAlpha" in2="up" operator="out" result="bottomEdge" />
    <feFlood floodColor="#000" floodOpacity={0.28} />
    <feComposite in2="bottomEdge" operator="in" result="dark" />
    <feGaussianBlur in="SourceAlpha" stdDeviation={0.01 * u} result="blur" />
    <feOffset in="blur" dx={0.004 * u} dy={0.015 * u} result="drop" />
    <feFlood floodColor="#1a0800" floodOpacity={0.6} />
    <feComposite in2="drop" operator="in" result="shadow" />
    <feMerge>
      <feMergeNode in="shadow" />
      <feMergeNode in="sheet" />
      <feMergeNode in="dark" />
      <feMergeNode in="rim" />
    </feMerge>
  </filter>
);

const Defs: React.FC<{ p: PaperPalette; n: number; u: number; prefix: string }> = ({ p, n, u, prefix }) => (
  <defs>
    <linearGradient id={`${prefix}-sky`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={p.sky[0]} />
      <stop offset="1" stopColor={p.sky[1]} />
    </linearGradient>
    <radialGradient id={`${prefix}-vignette`} cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stopColor="#000" stopOpacity={0} />
      <stop offset="1" stopColor="#000" stopOpacity={0.35} />
    </radialGradient>
    {Array.from({ length: n }, (_, i) => (
      <SheetFilter key={i} id={`${prefix}-f${i}`} seed={7 + i * 13} rim={p.light} u={u} />
    ))}
    <filter id={`${prefix}-bloom`} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation={0.02 * u} />
    </filter>
    <filter id={`${prefix}-soft`} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation={0.013 * u} />
    </filter>
  </defs>
);

/** The box: a dark frame with rounded inner corners, and a light vignette. */
export const PaperFrame: React.FC<{ w: number; h: number; color: string; prefix: string }> = ({ w, h, color, prefix }) => {
  const b = 24;
  const r = 34;
  return (
    <>
      <rect x={0} y={0} width={w} height={h} fill={`url(#${prefix}-vignette)`} />
      <path
        d={`M0 0 H${w} V${h} H0 Z M${b} ${b + r} Q${b} ${b} ${b + r} ${b} H${w - b - r} Q${w - b} ${b} ${w - b} ${b + r} V${h - b - r} Q${w - b} ${h - b} ${w - b - r} ${h - b} H${b + r} Q${b} ${h - b} ${b} ${h - b - r} Z`}
        fill={color} fillRule="evenodd" filter={`url(#${prefix}-f0)`}
      />
    </>
  );
};

type Drawn = Layer & { light?: boolean };

/** The scene's characters as layers: sitting ones on the place's seats, the others standing, spread. */
const figures = (scene: ResolvedScene, place: Place, w: number, f: number, u: number, t: number, size: number, at?: number): Drawn[] => {
  const chars = scene.visual.characters;
  const seats = [...place.seats];
  const standing = chars.filter((c) => c.pose !== "sitting");
  const H = size * u;
  const out: Drawn[] = [];
  let k = 0;
  chars.forEach((c) => {
    const sway = 1 + 0.006 * Math.sin(t * Math.PI * 0.5 + k);
    if (c.pose === "sitting" && seats.length) {
      const seat = seats.shift()!;
      const fig = silhouette(c.id, "sitting", seat.x, f, H, seat.dir, seat.y);
      out.push({ id: `fig-${c.id}`, role: MAIN.has(c.id) ? "accent" : "figure", depth: seat.hidden ? 0.58 : place.figureDepth, shapes: fig.body, over: fig.arms });
    } else {
      const i = standing.indexOf(c);
      const x = at !== undefined ? at * w : (w * (i + 1)) / (standing.length + 1) + (seats.length === 0 && standing.length === 1 ? 0.12 * u : 0);
      const dir = at !== undefined ? (x < w / 2 ? 1 : -1) : standing.length === 1 ? -1 : x < w / 2 ? 1 : -1;
      const fig = silhouette(c.id, c.pose, x, f, H * sway, dir);
      // Someone praying stands on a prayer rug: it says what the pose is at a glance.
      if (c.pose === "praying")
        out.push({
          id: `rug-${c.id}`, role: "accent", tint: 1, depth: place.figureDepth - 0.005,
          shapes: [{ kind: "path", d: `M${x - 0.2 * u} ${f + 0.02 * u} H${x + 0.24 * u} L${x + 0.21 * u} ${f - 0.015 * u} H${x - 0.17 * u} Z` }],
        });
      out.push({ id: `fig-${c.id}`, role: MAIN.has(c.id) ? "accent" : "figure", depth: place.figureDepth + 0.01 * i, shapes: fig.body, over: fig.arms });
    }
    k++;
  });
  return out;
};

const isSmall = (shapes: Shape[], w: number, h: number) =>
  shapes.every((s) => (s.kind === "rect" ? s.w * s.h < 0.5 * w * h : true));

/** A place of the catalog in paper, with the scene's characters. `floor` and `figure` (the size of
 * a standing person, in u) change the framing: the thumbnail is seen from closer. */
export const PaperScene: React.FC<{ scene: ResolvedScene; format: Format; floor?: number; figure?: number; figureX?: number }> = ({ scene, format, floor, figure, figureX }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const w = format.width;
  const h = format.height;
  const u = Math.min(w, h);
  const f = floor ?? FLOOR[format.id];
  const id = scene.visual.background ?? "";
  const build = PAPER_PLACES[id];
  if (!build) throw new Error(`background '${id}' has no paper drawing in src/styles/paper/places.ts`);
  const place = build(w, h, f);
  const p = place.palette;
  const layers: Drawn[] = [...place.layers, ...figures(scene, place, w, f, u, t, figure ?? 0.6, figureX)].sort((a, b) => a.depth - b.depth);
  const sheets = layers.filter((l) => l.role !== "sky" && l.role !== "light");
  const push = interpolate(frame, [0, durationInFrames], [1, 1.035]);
  const drift = (depth: number) => (depth - 0.5) * 0.024 * u * Math.sin(t * 0.35);
  const breathe = 0.84 + 0.1 * Math.sin(t * 1.3);
  const prefix = `ps-${scene.id}`;
  const wall = [...sheets].reverse().find((l) => l.role === "wall" && l.depth <= 0.35);
  const skyLayers = layers.filter((l) => l.role === "sky");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
      <Defs p={p} n={sheets.length + 1} u={u} prefix={prefix} />
      <g transform={`translate(${w / 2} ${h * 0.6}) scale(${push}) translate(${-w / 2} ${-h * 0.6})`}>
        <rect x={-40} y={-40} width={w + 80} height={h + 80} fill={`url(#${prefix}-sky)`} />
        {layers.map((l) => {
          if (l.role === "sky") return <Shapes key={l.id} shapes={l.shapes} fill={`url(#${prefix}-sky)`} />;
          if (l.role === "light")
            return (
              <g key={l.id} transform={`translate(${drift(l.depth)} 0)`}>
                <g style={{ mixBlendMode: "screen" }} opacity={0.6 * breathe} filter={`url(#${prefix}-bloom)`}>
                  <Shapes shapes={l.shapes} fill={p.light} />
                </g>
                <Shapes shapes={l.shapes} fill={p.light} opacity={breathe} />
              </g>
            );
          const i = sheets.indexOf(l);
          return (
            <React.Fragment key={l.id}>
              <g transform={`translate(${drift(l.depth)} 0)`} filter={`url(#${prefix}-f${i + 1})`}>
                <Shapes shapes={l.shapes} fill={colourOf(l, p)} />
                {l.over ? <Shapes shapes={l.over} fill={colourOf(l, p)} /> : null}
              </g>
              {place.lit && Math.abs(place.lit.depth - l.depth) < 0.03 ? (
                <g transform={`translate(${drift(l.depth)} 0)`}>
                  {place.lit.shapes.map((s, k) => (
                    <Shapes key={k} shapes={[s]} fill={p.light} opacity={0.6 + 0.4 * Math.sin(t * 0.8 + k)} />
                  ))}
                </g>
              ) : null}
              {/* The light spills over the edge of the opening, onto the sheet that has the hole. */}
              {l === wall && skyLayers.length && isSmall(skyLayers.flatMap((s) => s.shapes), w, h)
                ? skyLayers.map((s) => (
                    <g key={`b-${s.id}`} style={{ mixBlendMode: "screen" }} opacity={0.4 * breathe} filter={`url(#${prefix}-bloom)`}>
                      <Shapes shapes={s.shapes} fill={p.light} />
                    </g>
                  ))
                : null}
              {place.beam && l.depth <= 0.6 && (sheets[i + 1]?.depth ?? 1) > 0.6 ? <Beam beam={place.beam} p={p} t={t} u={u} prefix={prefix} /> : null}
            </React.Fragment>
          );
        })}
      </g>
      <PaperFrame w={w} h={h} color={p.frame} prefix={prefix} />
    </svg>
  );
};

const Beam: React.FC<{ beam: NonNullable<Place["beam"]>; p: PaperPalette; t: number; u: number; prefix: string }> = ({ beam, p, t, u, prefix }) => {
  const xs = beam.d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const minX = Math.min(xs[0], xs[2], xs[4], xs[6]);
  const maxX = Math.max(xs[0], xs[2], xs[4], xs[6]);
  const minY = Math.min(xs[1], xs[3], xs[5], xs[7]);
  const maxY = Math.max(xs[1], xs[3], xs[5], xs[7]);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <path d={beam.d} fill={p.light} opacity={0.45} filter={`url(#${prefix}-soft)`} />
      <ellipse {...beam.patch} fill={p.light} opacity={0.55} filter={`url(#${prefix}-soft)`} />
      {Array.from({ length: 40 }, (_, i) => {
        const x = minX + rand(i * 3.1) * (maxX - minX) + 0.012 * u * Math.sin(t * 0.4 + i);
        const y = minY + rand(i * 7.7) * (maxY - minY) + ((t * 9 + i * 13) % 60) - 30;
        return <circle key={i} cx={x} cy={y} r={0.0015 * u + rand(i) * 0.002 * u} fill={p.light} opacity={0.3 + 0.4 * rand(i * 2)} />;
      })}
    </g>
  );
};

/** Behind the cards: a paper landscape, one of three by the scene (so two cards in a row differ). */
export const PaperBackdrop: React.FC<{ format: Format; variant: number; prefix: string }> = ({ format, variant, prefix }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const w = format.width;
  const h = format.height;
  const u = Math.min(w, h);
  const drift = (d: number) => (d - 0.5) * 0.02 * u * Math.sin(t * 0.35);
  const breathe = 0.85 + 0.12 * Math.sin(t * 1.3);
  const v = variant % 3;
  const p: PaperPalette =
    v === 1
      ? { sky: ["#2d4579", "#101a36"], ladder: [[0, "#3a5288"], [0.5, "#243766"], [1, "#0b1226"]], accent: ["#16605a", "#a3322a"], light: "#ffe2a0", frame: "#0a0f1e" }
      : v === 2
        ? { sky: ["#ffe7c4", "#f19a6a"], ladder: [[0, "#f2b07c"], [0.5, "#b8673f"], [1, "#2a120a"]], accent: ["#16605a", "#a3322a"], light: "#ffe2a0", frame: "#150b06" }
        : { sky: ["#fff3cf", "#ffa95a"], ladder: [[0, "#ffd39a"], [0.35, "#e39c5e"], [0.6, "#a2582f"], [0.85, "#5a2c16"], [1, "#2a140a"]], accent: ["#16605a", "#a3322a"], light: "#ffe2a0", frame: "#150b06" };
  const hills = [0.35, 0.6, 0.85].map((d, i) => ({
    d: `M0 ${h - (0.3 - i * 0.08) * u} Q${w * 0.25} ${h - (0.42 - i * 0.08) * u} ${w * 0.5} ${h - (0.33 - i * 0.08) * u} Q${w * 0.78} ${h - (0.45 - i * 0.08) * u} ${w} ${h - (0.34 - i * 0.08) * u} V${h} H0 Z`,
    depth: d,
  }));
  const lanterns = v === 0 ? [{ x: 0.2 * w, y: 0.27 * h, s: 0.85 }, { x: 0.82 * w, y: 0.2 * h, s: 0.7 }] : [];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
      <Defs p={p} n={6} u={u} prefix={prefix} />
      <rect x={0} y={0} width={w} height={h} fill={`url(#${prefix}-sky)`} />
      {v === 1 ? (
        <g>
          <path d={`M${0.74 * w} ${0.16 * h} a${0.06 * u} ${0.06 * u} 0 1 0 ${0.05 * u} ${0.11 * u} a${0.05 * u} ${0.05 * u} 0 1 1 ${-0.05 * u} ${-0.11 * u} Z`} fill={p.light} opacity={breathe} />
          {Array.from({ length: 26 }, (_, i) => (
            <circle key={i} cx={rand(i) * w} cy={rand(i + 50) * h * 0.55} r={2 + rand(i + 9) * 3} fill={p.light} opacity={0.4 + 0.5 * Math.abs(Math.sin(t + i))} />
          ))}
        </g>
      ) : (
        <circle cx={w / 2} cy={h * 0.3} r={0.14 * u} fill={p.light} opacity={0.5} filter={`url(#${prefix}-bloom)`} />
      )}
      {hills.map((hl, i) => (
        <path key={i} d={hl.d} transform={`translate(${drift(hl.depth)} 0)`} fill={ladderAt(p, hl.depth)} filter={`url(#${prefix}-f${i + 1})`} />
      ))}
      {lanterns.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) scale(${(l.s * u) / 1080})`} filter={`url(#${prefix}-f4)`}>
          <rect x={-1.5} y={-900} width={3} height={900} fill={ladderAt(p, 0.8)} />
          <circle cx={0} cy={6} r={10} fill="none" stroke={ladderAt(p, 0.8)} strokeWidth={5} />
          <path d="M-28 52 L0 14 L28 52 Z M-44 60 H44 L36 150 L0 186 L-36 150 Z" fill={ladderAt(p, 0.8)} />
          <path d="M-26 74 H-6 V140 H-26 Z M6 74 H26 V140 H6 Z" fill={p.light} opacity={breathe} />
        </g>
      ))}
      <PaperFrame w={w} h={h} color={p.frame} prefix={prefix} />
    </svg>
  );
};

/** The look of the dark paper sheet that holds a card's text (verse, hadith, title). */
export const PAPER_SHEET: React.CSSProperties = {
  background:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\"), #173b39",
  borderRadius: 18,
  border: "none",
  borderTop: "3px solid rgba(255, 226, 160, 0.75)",
  boxShadow: "0 22px 40px rgba(20, 8, 0, 0.55), inset 0 -8px 0 rgba(0, 0, 0, 0.22)",
};
