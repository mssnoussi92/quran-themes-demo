// A place of the catalog (styles/paper/places.ts: layers of plain shapes) painted as a manuscript
// miniature: flat jewel colours under a fine ink outline, patterned walls and carpets, rocks in the
// pinks and lilacs of painted manuscripts with their contour lines; the scene's characters as
// silhouettes with no face (styles/paper/silhouettes.ts). The prototype coloured two hand-written
// scenes by the id of each layer; here a rule works for any place: the role of a layer, its tint and
// its depth, then what its id says (a lamp, a plant, bread), then the hints of the place (HINTS).
// Everything here is drawn once per scene: nothing depends on the frame.
import React from "react";
import type { ResolvedScene } from "../../types";
import type { Layer, Shape } from "../geometry";
import { PAPER_PLACES, type Place } from "../paper/places";
import { LOOKS, silhouette } from "../paper/silhouettes";
import { mix, Shapes } from "../shapes";
import { Gold, Khatam } from "./ornament";
import { C } from "./palette";

/** What kind of place this is: it decides the walls and the floor. */
type Kind = "interior" | "outdoor" | "rock" | "plain";
type Sky = "gold" | "dawn" | "night";
type Hint = { kind: Kind; sky?: Sky; fills?: Record<string, string>; unit?: "floor" };

/** Hints per place (the id of a background, content/backgrounds.yaml). An interior has a patterned
 * wall and a carpet, a street has painted houses and sand, a cave has rocks. `fills`: the colour of
 * one layer where the rule gives a wrong one. `unit: "floor"`: the place takes its unit from the
 * height of its floor line, not from the frame's short side (the two places drawn for the big Open
 * Peeps figures): see modelOf. A place missing here is painted as an outdoor one. */
const HINTS: Record<string, Hint> = {
  plain: { kind: "plain" },
  office: { kind: "interior" },
  bedroom: { kind: "interior", sky: "dawn", fills: { bed: C.turquoise, table: C.sienna } },
  cafe: { kind: "interior", sky: "night", fills: { cord: C.wood } },
  "waiting-room": { kind: "interior", unit: "floor", fills: { clock: C.ivory, door: C.malachite } },
  mosque: { kind: "interior", unit: "floor", fills: { mihrab: C.turquoise, tiles: C.ochre } },
  street: { kind: "outdoor", fills: { far: C.turquoise } },
  "old-city": { kind: "outdoor", fills: { domes: C.turquoise, "awning-2": C.ivory, stall: C.sienna } },
  "cave-entrance": { kind: "rock" },
  "cave-inside": { kind: "rock" },
};

/** How a layer is painted. `flat`: its colour without pattern (what its contour lines are mixed from). */
type Paint = { fill: string; flat: string; outline: "ink" | "soft" | "none"; contours?: boolean };

const says = (id: string, words: RegExp) => words.test(id);

const paintOf = (layer: Layer, hint: Hint, prefix: string): Paint => {
  const { id, role } = layer;
  const tint = layer.tint ?? 0;
  const url = (name: string) => `url(#${prefix}-${name})`;
  const flat = (c: string, more: Partial<Paint> = {}): Paint => ({ fill: c, flat: c, outline: "ink", ...more });
  const own = hint.fills?.[id];
  if (own) return flat(own);
  const rock = hint.kind === "rock";
  const inside = hint.kind === "interior" || hint.kind === "plain";
  switch (role) {
    case "sky":
      return { fill: url("sky"), flat: C.goldLight, outline: "none" };
    case "light":
      // The sun, a coin: gold leaf with its line; a glow (the moon, a lamp, a lit door): light gold.
      return says(id, /sun|coin/) ? { fill: url("gold"), flat: C.gold, outline: "ink" } : { fill: C.goldLight, flat: C.goldLight, outline: "soft" };
    case "far":
      // Hills are malachite; what is built far away (a skyline, roofs, a dome) is turquoise, lighter
      // the further it is.
      if (rock || says(id, /hill|mount|dune|field|garden|tree|palm/)) return flat(C.malachite);
      return flat(mix(C.turquoise, C.ivory, Math.max(0, 0.2 - layer.depth) * 0.8));
    case "wall":
      if (says(id, /dark|shadow/)) return flat(C.shade);
      if (rock) return flat(tint ? C.lilac : C.rose, { contours: true });
      if (hint.kind === "interior") return { fill: url("wall"), flat: "#efe0bb", outline: "ink" };
      if (hint.kind === "plain") return { fill: url("ground"), flat: "#e6c67c", outline: "ink" };
      return flat(tint ? C.ochre : C.rose);
    case "floor":
      if (inside) return { fill: url("carpet"), flat: C.vermilion, outline: "ink" };
      return flat(tint ? mix(C.sand, C.sienna, 0.25) : C.sand);
    case "object":
      if (rock && !says(id, /dog|jar|lamp/)) return flat(C.plum, { contours: true });
      if (says(id, /lamp|lantern/)) return { fill: url("gold"), flat: C.gold, outline: "ink" };
      if (says(id, /plant|tree|leaf|palm/)) return flat(C.malachite);
      if (says(id, /loaf|loaves|bread|jar|pot/)) return flat(C.ochre);
      return flat(tint ? C.lapis : C.sienna);
    case "figure":
      // A figure of the place itself (the dog of 18:18): ink, as in the prototype.
      return flat(C.ink);
    case "accent":
      if (says(id, /awning|flag|banner/)) return flat(C.vermilion);
      return tint ? { fill: url("rug"), flat: C.malachite, outline: "ink" } : flat(C.turquoise);
    case "front":
      if (says(id, /plant|tree|leaf|palm/)) return flat(C.malachite);
      if (rock || says(id, /rock|stone/)) return flat(C.plumDark, { contours: true });
      if (says(id, /lamp|post/)) return flat(C.night);
      if (says(id, /jar|pot/)) return flat(C.turquoise);
      return flat(C.wood);
  }
};

/** People we follow wear ivory with a gold line (the one who prays in the prototype); the others a
 * jewel colour each. A character missing here takes one by its place in the scene. */
const ROBES: Record<string, string> = {
  youssef: C.vermilion,
  // Not turquoise (the prototype's second colleague): she sits in front of the turquoise skyline.
  hoda: C.plum,
  karim: C.malachite,
  narrator: C.lapis,
};
const MAIN = new Set(["amir", "salma"]);
const OTHER_ROBES = [C.vermilion, C.turquoise, C.malachite, C.plum, C.lapis];

/** Something to paint: a layer of the place with its paint, or a character. */
export type Painted =
  | { kind: "layer"; depth: number; layer: Layer; paint: Paint }
  | { kind: "person"; depth: number; id: string; body: Shape[]; arms: Shape[]; robe: string; main: boolean };

export type Model = {
  /** Back to front; `split`: how many come before the lit windows (they twinkle between the two). */
  items: Painted[];
  split: number;
  lit: Shape[];
  /** Where the lit windows are, in the picture [x, y, width, height]: their planes are no bigger. */
  litBox: [number, number, number, number];
  beam: Place["beam"] | null;
  sky: Sky;
  /** The frame the place was laid out for, in the picture: its corner, and its floor line. */
  x: number;
  y: number;
};

/** Where the place goes in the picture: its corner, its size, the floor line (from its top), the
 * height of someone standing. */
export type PlaceBox = { x: number; y: number; w: number; h: number; f: number; person: number };

const R = (x: number, y: number, w: number, h: number, r = 0): Shape => ({ kind: "rect", x, y, w, h, r });

/** No place (background « plain », or none): a gold ground and a carpet, as a figure alone on a page. */
const plainPlace = (w: number, h: number, f: number): Place => {
  const top = f - 0.1 * Math.min(w, h);
  return {
    layers: [
      { id: "ground", role: "wall", depth: 0.3, shapes: [R(0, 0, w, top)] },
      { id: "floor", role: "floor", depth: 0.45, shapes: [R(0, top, w, h - top)] },
    ],
    palette: { sky: ["#000000", "#000000"], ladder: [], accent: ["#000000", "#000000"], light: "#000000", frame: "#000000" },
    seats: [],
    figureDepth: 0.6,
  };
};

type Char = ResolvedScene["visual"]["characters"][number];

/** Silhouettes exist standing, sitting, praying and pointing. A character written for another style
 * may carry another pose (open-hands) or be a bust: it stands. */
const poseOf = (c: Char): "standing" | "sitting" | "praying" | "pointing" =>
  c.pose === "sitting" || c.kind === "sitting" ? "sitting" : c.pose === "praying" || c.pose === "pointing" ? c.pose : "standing";

/** The scene's characters (as figures() of the paper style): those who sit take the place's seats,
 * in order, or a stool of their own where the place has none left; the others stand, spread out.
 * `at`: one character, at this share of the width (the thumbnail). */
const people = (chars: Char[], place: Place, box: PlaceBox, hint: Hint, prefix: string, at?: number): Painted[] => {
  const { w, f, person: H } = box;
  const seats = [...place.seats];
  const seated = new Map<Char, Place["seats"][number]>();
  for (const c of chars) if (poseOf(c) === "sitting" && seats.length) seated.set(c, seats.shift()!);
  const free = chars.filter((c) => !seated.has(c));
  const out: Painted[] = [];
  chars.forEach((c, n) => {
    const robe = ROBES[c.id] ?? OTHER_ROBES[n % OTHER_ROBES.length];
    const main = MAIN.has(c.id);
    const person = (depth: number, fig: { body: Shape[]; arms: Shape[] }): Painted => ({ kind: "person", depth, id: c.id, body: fig.body, arms: fig.arms, robe, main });
    const seat = seated.get(c);
    if (seat) {
      // A silhouette sits at 18 % of its height or more: on a lower seat it would float above it.
      // It is set down by the difference instead, its feet a little forward on the floor.
      const k = (H * (LOOKS[c.id]?.tall ?? 1)) / 100;
      const down = Math.max(0, 18 * k - (f - seat.y));
      out.push(person(seat.hidden ? 0.58 : place.figureDepth, silhouette(c.id, "sitting", seat.x, f + down, H, seat.dir, seat.y)));
      return;
    }
    const i = free.indexOf(c);
    const alone = free.length === 1 && seats.length === 0 && seated.size === 0;
    const x = at !== undefined ? at * w : (w * (i + 1)) / (free.length + 1) + (alone ? 0.2 * H : 0);
    const dir = at !== undefined ? 1 : free.length === 1 ? -1 : x < w / 2 ? 1 : -1;
    const depth = place.figureDepth + 0.01 * i;
    const pose = poseOf(c);
    if (pose === "sitting") {
      // A stool of the painter's own: a cushion on a low wooden seat.
      const top = f - 0.27 * H;
      const stool: Layer = { id: `stool-${c.id}`, role: "object", depth, shapes: [R(x - 0.15 * H, top + 0.045 * H, 0.05 * H, 0.225 * H), R(x + 0.1 * H, top + 0.045 * H, 0.05 * H, 0.225 * H), R(x - 0.19 * H, top + 0.03 * H, 0.38 * H, 0.05 * H, 4)] };
      const cushion: Layer = { id: `cushion-${c.id}`, role: "accent", depth, shapes: [R(x - 0.17 * H, top - 0.012 * H, 0.34 * H, 0.05 * H, 0.025 * H)] };
      out.push({ kind: "layer", depth: depth - 0.004, layer: stool, paint: paintOf(stool, hint, prefix) });
      out.push({ kind: "layer", depth: depth - 0.003, layer: cushion, paint: { fill: C.lapis, flat: C.lapis, outline: "ink" } });
      out.push(person(depth, silhouette(c.id, "sitting", x, f, H, dir, top)));
      return;
    }
    if (pose === "praying") {
      // Someone praying stands on a prayer rug: it says what the pose is at a glance.
      const rug: Layer = {
        id: `rug-${c.id}`, role: "accent", tint: 1, depth,
        shapes: [{ kind: "path", d: `M${x - 0.36 * H} ${f + 0.035 * H} H${x + 0.42 * H} L${x + 0.37 * H} ${f - 0.03 * H} H${x - 0.31 * H} Z` }],
      };
      out.push({ kind: "layer", depth: depth - 0.005, layer: rug, paint: paintOf(rug, hint, prefix) });
    }
    out.push(person(depth, silhouette(c.id, pose, x, f, H, dir)));
  });
  return out;
};

/** A place laid out for a floor line higher than the frame's (see modelOf), set down on the frame's
 * floor: what touched its top edge is drawn up to the frame's top again (the wall, a lamp's cord). */
const lowered = (layers: Layer[], dy: number, w: number): Layer[] => {
  const wall = layers.find((l) => l.role === "wall");
  const up = (sh: Shape): Shape => (sh.kind === "rect" && sh.y === 0 ? { ...sh, y: -dy, h: sh.h + dy } : sh);
  return layers.map((l) => ({ ...l, shapes: [...(l === wall ? [R(0, -dy, w, dy + 2)] : []), ...l.shapes.map(up)] }));
};

/** The place of a scene and its characters, ready to paint. An unknown place is an error, as in the
 * paper style: a scene never falls back on another place in silence. */
export const modelOf = (visual: ResolvedScene["visual"], box: PlaceBox, prefix: string, at?: number): Model => {
  const id = visual.background ?? "plain";
  const build = id === "plain" ? plainPlace : PAPER_PLACES[id];
  if (!build) throw new Error(`background '${id}' has no drawing in src/styles/paper/places.ts (the places the illumination style paints)`);
  const hint = HINTS[id] ?? { kind: "outdoor" as const };
  // A place whose unit is its floor line's height (people 0.8 of that height) is laid out for the
  // floor line that makes a person the size of ours, then set down on our floor line: the same room
  // seen whole, with people of the same size as in the other places.
  const f = hint.unit === "floor" ? Math.min(box.f, (0.75 * box.person) / 0.6) : box.f;
  const dy = box.f - f;
  const built = build(box.w, box.h - dy, f);
  const place = dy > 0 ? { ...built, layers: lowered(built.layers, dy, box.w) } : built;
  const items: Painted[] = [
    ...place.layers.map((layer): Painted => ({ kind: "layer", depth: layer.depth, layer, paint: paintOf(layer, hint, prefix) })),
    ...people(visual.characters, place, { ...box, f }, hint, prefix, at),
  ];
  // A stable sort: layers of the same depth keep the place's order.
  const sorted = items.map((item, i) => ({ item, i })).sort((a, b) => a.item.depth - b.item.depth || a.i - b.i).map(({ item }) => item);
  const litDepth = place.lit?.depth ?? -1;
  const split = place.lit ? sorted.filter((p) => p.depth <= litDepth + 0.03).length : sorted.length;
  const lit = (place.lit?.shapes ?? []).filter((sh) => sh.kind === "rect");
  // The lit windows are small rectangles: the box that holds them all, cut to the frame.
  const edge = (pick: (r: Extract<Shape, { kind: "rect" }>) => number, most: boolean) =>
    lit.reduce((v, sh) => (sh.kind === "rect" ? (most ? Math.max(v, pick(sh)) : Math.min(v, pick(sh))) : v), most ? 0 : Math.max(box.w, box.h));
  const x0 = Math.max(0, edge((r) => r.x, false) - 4);
  const y0 = Math.max(0, edge((r) => r.y, false) - 4);
  const x1 = Math.min(box.w, edge((r) => r.x + r.w, true) + 4);
  const y1 = Math.min(box.h, edge((r) => r.y + r.h, true) + 4);
  return {
    items: sorted, split, lit, litBox: [box.x + x0, box.y + dy + y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)],
    beam: place.beam ?? null, sky: hint.sky ?? "gold", x: box.x, y: box.y + dy,
  };
};

const SKIES: Record<Sky, [string, string]> = {
  gold: ["#f6e9b9", "#e3b55c"],
  dawn: ["#f7e3b4", "#e79a72"],
  night: [C.night, C.lapis],
};

/** Patterns and gradients of a painting, once per scene (their ids carry the scene's prefix: two
 * scenes are on screen during a transition). */
export const PaintDefs = React.memo<{ prefix: string; sky: Sky; ground?: "gold" | "turquoise" }>(({ prefix, sky, ground = "gold" }) => (
  <defs>
    <Gold id={`${prefix}-gold`} />
    <linearGradient id={`${prefix}-sky`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={SKIES[sky][0]} />
      <stop offset="1" stopColor={SKIES[sky][1]} />
    </linearGradient>
    <Khatam id={`${prefix}-wall`} size={70} ground="#efe0bb" star="#e6d1a3" line="#d2b77d" />
    {ground === "gold" ? (
      <Khatam id={`${prefix}-ground`} size={92} ground="#e6c67c" star="#e9cc88" line="#d6b165" width={1.3} dot={false} />
    ) : (
      <Khatam id={`${prefix}-ground`} size={92} ground={C.turquoise} star="#318f8f" line="#3f9d9b" width={1.3} dot={false} />
    )}
    <pattern id={`${prefix}-carpet`} patternUnits="userSpaceOnUse" width={48} height={48}>
      <rect width={48} height={48} fill={C.vermilion} />
      <path d="M24 6 L42 24 L24 42 L6 24 Z" fill="none" stroke={C.ivory} strokeWidth={2} opacity={0.7} />
      <circle cx={24} cy={24} r={4} fill={C.gold} />
    </pattern>
    <pattern id={`${prefix}-rug`} patternUnits="userSpaceOnUse" width={26} height={26}>
      <rect width={26} height={26} fill={C.malachite} />
      <path d="M13 3 L23 13 L13 23 L3 13 Z" fill={C.gold} opacity={0.75} />
    </pattern>
  </defs>
));

/** Width of the ink line around every painted thing. */
const LINE = 2.2;

/** A group of shapes as one painted thing: the line first (a stroke twice as wide, under), then the
 * colour over it, so that shapes that overlap (a head on a body) share one outline. */
const Inked: React.FC<{ shapes: Shape[]; fill: string; line?: string; width?: number; rule?: "nonzero" | "evenodd" }> = ({
  shapes, fill, line = C.ink, width = LINE, rule = "evenodd",
}) => (
  <>
    <Shapes shapes={shapes} fill={line} stroke={line} strokeWidth={2 * width} strokeLinejoin="round" fillRule={rule} />
    <Shapes shapes={shapes} fill={fill} fillRule={rule} />
  </>
);

/** Rocks of the painted manuscripts: bands that follow the edge of each rock, lighter toward its
 * heart, a pale line between two bands. Strokes of the rock's own outline, clipped to the rock (no
 * filter); a shape that is not a path (a reed) stays flat. */
const Contours: React.FC<{ shapes: Shape[]; colour: string; id: string }> = ({ shapes, colour, id }) => (
  <>
    {shapes.map((s, i) =>
      s.kind === "path" ? (
        <g key={i}>
          <clipPath id={`${id}-${i}`}>
            <path d={s.d} clipRule="evenodd" />
          </clipPath>
          <g clipPath={`url(#${id}-${i})`} fill="none" strokeLinejoin="round">
            <path d={s.d} fill={mix(colour, C.ivory, 0.3)} fillRule="evenodd" />
            {[76, 48, 22].map((d, k) => (
              <React.Fragment key={d}>
                <path d={s.d} stroke={mix(colour, C.ivory, 0.55)} strokeWidth={2 * d + 2.5} />
                <path d={s.d} stroke={mix(colour, C.ivory, 0.2 - 0.1 * k)} strokeWidth={2 * d - 2.5} />
              </React.Fragment>
            ))}
          </g>
        </g>
      ) : null,
    )}
  </>
);

const Item: React.FC<{ p: Painted; prefix: string; n: number }> = ({ p, prefix, n }) => {
  if (p.kind === "person") {
    // A limb is two segments that overlap at the joint: filled whole (non-zero), not cut there.
    // People we follow: a gold line, and a hair of ink outside it (ivory on a pale wall would not
    // hold without).
    if (p.main)
      return (
        <>
          {[p.body, p.arms].map((shapes, i) => (
            <g key={i}>
              <Shapes shapes={shapes} fill={C.ink} stroke={C.ink} strokeWidth={2 * 4.4} strokeLinejoin="round" fillRule="nonzero" />
              <Inked shapes={shapes} fill={C.ivory} line={`url(#${prefix}-gold)`} width={3.2} rule="nonzero" />
            </g>
          ))}
        </>
      );
    return (
      <>
        <Inked shapes={p.body} fill={p.robe} rule="nonzero" />
        <Inked shapes={p.arms} fill={p.robe} rule="nonzero" />
      </>
    );
  }
  const { layer, paint } = p;
  if (paint.outline === "none") return <Shapes shapes={layer.shapes} fill={paint.fill} />;
  const line = paint.outline === "soft" ? C.goldDark : C.ink;
  const width = paint.outline === "soft" ? 1.4 : LINE;
  return (
    <>
      <Inked shapes={layer.shapes} fill={paint.fill} line={line} width={width} />
      {paint.contours ? <Contours shapes={layer.shapes} colour={paint.flat} id={`${prefix}-rock${n}`} /> : null}
      {layer.lines?.map((d, i) => <path key={i} d={d} fill="none" stroke={C.ink} strokeWidth={1.6} strokeOpacity={0.5} />)}
      {layer.over ? <Inked shapes={layer.over} fill={paint.fill} line={line} width={width} /> : null}
    </>
  );
};

/** The sunbeam of the cave (18:17), as in the prototype: rays of light gold from the mouth to the
 * wall where it falls. */
const Beam: React.FC<{ beam: NonNullable<Place["beam"]> }> = ({ beam }) => {
  const n = beam.d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const at = (a: number, b: number, t: number) => [n[a] + (n[b] - n[a]) * t, n[a + 1] + (n[b + 1] - n[a + 1]) * t];
  return (
    <g>
      <path d={beam.d} fill={C.goldLight} opacity={0.22} />
      <ellipse {...beam.patch} fill={C.goldLight} opacity={0.3} />
      {Array.from({ length: 9 }, (_, i) => {
        const [x1, y1] = at(0, 2, (i + 0.5) / 9);
        const [x2, y2] = at(6, 4, (i + 0.5) / 9);
        return <path key={i} d={`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`} stroke={C.goldLight} strokeWidth={5} strokeLinecap="round" opacity={0.75} />;
      })}
    </g>
  );
};

type PlaneProps = { model: Model; prefix: string; w: number; h: number; part: "back" | "front" | 0 | 1 | 2 };

/** One still plane of the painting: what is behind the lit windows, what is in front (a layer of
 * its own: it comes over planes that change), or a third of the lit windows (the scene dims and
 * brightens each third in turn, by its opacity alone; a plane no bigger than the windows). */
export const Plane = React.memo<PlaneProps>(({ model, prefix, w, h, part }) => {
  const from = part === "front" ? model.split : 0;
  const to = part === "back" ? model.split : model.items.length;
  // A third of the lit windows is drawn in the box of the windows (the scene sets it in its place).
  const lit = typeof part === "number";
  const [x, y, bw, bh] = lit ? model.litBox : [0, 0, w, h];
  return (
    <svg
      width={bw} height={bh} viewBox={`${x} ${y} ${bw} ${bh}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: lit ? "hidden" : "visible", willChange: part === "front" ? "transform" : undefined }}
    >
      <g transform={`translate(${model.x} ${model.y})`}>
        {typeof part === "number" ? (
          <Inked shapes={model.lit.filter((_, k) => k % 3 === part)} fill={C.goldLight} line={C.ink} width={1.2} />
        ) : (
          <>
            {model.items.slice(from, to).map((p, i) => (
              <React.Fragment key={from + i}>
                <Item p={p} prefix={prefix} n={from + i} />
                {/* The beam falls behind the rocks of the foreground, in front of everything else. */}
                {model.beam && p.depth <= 0.6 && (model.items[from + i + 1]?.depth ?? 1) > 0.6 ? <Beam beam={model.beam} /> : null}
              </React.Fragment>
            ))}
          </>
        )}
      </g>
    </svg>
  );
});
