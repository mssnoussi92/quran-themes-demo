// Places of the paper-cut style (content/backgrounds.yaml, `styles: [paper]`): each one is layers of
// plain shapes laid out for any frame (reel 1080x1920 or episode 1920x1080), from the floor line and
// u = the frame's short side. No person in a place: people are catalog characters (silhouettes.ts).
import type { Layer, Shape } from "../geometry";
import { rand } from "../shapes";

/** Colours by depth (stops from far to near) and the light of a place. */
export type PaperPalette = {
  sky: [string, string];
  ladder: [number, string][];
  accent: [string, string];
  light: string;
  frame: string;
};

export type Seat = { x: number; y: number; dir: number; hidden?: boolean };
export type Glow = { cx: number; cy: number; rx: number; ry: number };

export type Place = {
  layers: Layer[];
  palette: PaperPalette;
  /** Where a sitting character sits (a chair, the bed); `hidden`: behind a desk (legs hidden). */
  seats: Seat[];
  /** Depth at which the characters stand: in front of the layers behind it, behind the others. */
  figureDepth: number;
  /** Small lit windows (paper cut away), with the depth of the layer they are cut in. */
  lit?: { shapes: Shape[]; depth: number };
  /** A beam of light (the cave, 18:17) and where it falls. */
  beam?: { d: string; patch: Glow };
  /** Height in pixels of a standing person the place is drawn around, when it is not the silhouettes'
   * (0.6 of the frame's short side): the places built for the Open Peeps figures, who stand taller.
   * A style that draws those figures brings them to the place's scale (styles/chalk/scene.tsx). */
  person?: number;
};

type Builder = (w: number, h: number, f: number) => Place;

const R = (x: number, y: number, w: number, h: number, r = 0): Shape => ({ kind: "rect", x, y, w, h, r });
const P = (d: string): Shape => ({ kind: "path", d });
const hole = (outer: string, inner: string): Shape => P(`${outer} ${inner}`);
const box = (x: number, y: number, w: number, h: number) => `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
const arch = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z`;

/** Lit windows in a block of buildings, in rows, some dark. */
const windows = (x: number, y: number, w: number, h: number, seed: number, cell = 30): Shape[] => {
  const out: Shape[] = [];
  for (let r = 0; (r + 1) * cell * 1.2 < h - 10; r++) {
    for (let c = 0; (c + 1) * cell < w - 8; c++) {
      if (rand(seed + r * 17 + c * 3) < 0.45) continue;
      out.push(R(x + 10 + c * cell, y + 14 + r * cell * 1.2, cell * 0.4, cell * 0.55));
    }
  }
  return out;
};

const WARM: PaperPalette = {
  sky: ["#fff3d2", "#ffb065"],
  ladder: [[0, "#ffd9a0"], [0.3, "#efb57a"], [0.45, "#d48a4f"], [0.6, "#9c5630"], [0.8, "#62321b"], [1, "#2a140a"]],
  accent: ["#16605a", "#a3322a"],
  light: "#ffe6a8",
  frame: "#170c07",
};

/** At work (kahf hook): a window on the city, desks, a lamp, a plant in front. */
const office: Builder = (w, h, f) => {
  const u = Math.min(w, h);
  const cx = w / 2;
  const ww = Math.min(0.78 * u, 0.6 * w);
  const wx = cx - ww / 2;
  const wTop = f - 0.78 * u;
  const wBot = f - 0.3 * u;
  const floorTop = f - 0.1 * u;
  const blocks: Shape[] = [];
  let bx = wx;
  for (let i = 0; bx < wx + ww; i++) {
    const bw = (0.07 + 0.06 * rand(i + 3)) * u;
    const bh = (0.18 + 0.28 * rand(i + 11)) * u;
    blocks.push(R(bx, wBot - bh, bw, bh));
    bx += bw + 0.008 * u;
  }
  const lit = blocks.flatMap((b, i) => (b.kind === "rect" ? windows(b.x, b.y, b.w, b.h, i * 41, 0.026 * u) : []));
  const desk = (x0: number, dw: number): Layer => ({
    id: `desk-${Math.round(x0)}`,
    role: "object",
    depth: 0.62,
    shapes: [
      R(x0, f - 0.27 * u, dw, 0.024 * u, 4),
      R(x0 + 0.02 * u, f - 0.246 * u, dw - 0.04 * u, 0.246 * u),
      R(x0 + 0.04 * u, f - 0.44 * u, 0.16 * u, 0.11 * u, 8),
      R(x0 + 0.11 * u, f - 0.33 * u, 0.018 * u, 0.06 * u),
      R(x0 + 0.075 * u, f - 0.278 * u, 0.09 * u, 0.01 * u, 3),
    ],
  });
  const deskW = 0.42 * u;
  const deskL = Math.max(0.02 * u, cx - 0.5 * u);
  const layers: Layer[] = [
    { id: "sky", role: "sky", depth: 0, shapes: [R(wx, wTop, ww, wBot - wTop)] },
    { id: "skyline", role: "far", depth: 0.15, shapes: blocks },
    { id: "wall", role: "wall", depth: 0.3, shapes: [hole(box(0, 0, w, floorTop), box(wx, wTop, ww, wBot - wTop))] },
    {
      id: "window", role: "object", depth: 0.35, tint: 1,
      shapes: [
        hole(box(wx - 16, wTop - 16, ww + 32, wBot - wTop + 32), box(wx, wTop, ww, wBot - wTop)),
        R(cx - 9, wTop, 18, wBot - wTop),
        R(wx, (wTop + wBot) / 2 - 9, ww, 18),
      ],
    },
    { id: "floor", role: "floor", depth: 0.45, shapes: [R(0, floorTop, w, h - floorTop)] },
    desk(deskL, deskW),
  ];
  if (w > 1.4 * u) layers.push({ ...desk(w - deskL - deskW, deskW), id: "desk-right" });
  if (wTop - 0.2 * u > 40) {
    layers.splice(4, 0, {
      id: "lamp", role: "object", depth: 0.4,
      shapes: [R(cx - 2, 0, 4, wTop - 0.16 * u), P(`M${cx - 0.065 * u} ${wTop - 0.08 * u} L${cx + 0.065 * u} ${wTop - 0.08 * u} L${cx + 0.037 * u} ${wTop - 0.16 * u} L${cx - 0.037 * u} ${wTop - 0.16 * u} Z`)],
    });
  }
  const pot = Math.max(0.03 * u, cx - 0.48 * u);
  layers.push({
    id: "plant", role: "front", depth: 0.95,
    shapes: [
      ...[-48, -26, -6, 14, 34, 52].map((a, i) => ({
        kind: "ellipse" as const, cx: pot + 0.07 * u + Math.sin((a * Math.PI) / 180) * 0.09 * u,
        cy: h - 0.2 * u - Math.cos((a * Math.PI) / 180) * 0.09 * u, rx: 0.022 * u, ry: 0.09 * u, rotate: a + i * 0,
      })),
      P(`M${pot} ${h - 0.2 * u} H${pot + 0.14 * u} L${pot + 0.125 * u} ${h} H${pot + 0.015 * u} Z`),
    ],
  });
  return {
    layers,
    palette: WARM,
    seats: [{ x: deskL + deskW * 0.62, y: f - 0.24 * u, dir: 1, hidden: true }],
    figureDepth: 0.68,
    lit: { shapes: lit, depth: 0.15 },
  };
};

/** At home at dawn (kahf wake-life): the bed, the window where the sun rises, curtains. */
const bedroom: Builder = (w, h, f) => {
  const u = Math.min(w, h);
  const cx = w / 2;
  const wx = cx + 0.06 * u;
  const ww = Math.min(0.36 * u, w - wx - 0.06 * u);
  const wTop = f - 0.76 * u;
  const wBot = f - 0.34 * u;
  const floorTop = f - 0.1 * u;
  const bedX = Math.max(0.02 * u, cx - 0.56 * u);
  const bedR = cx + 0.02 * u;
  const top = f - 0.22 * u;
  return {
    palette: {
      sky: ["#ffe3c2", "#f59a7a"],
      ladder: [[0, "#ffd6b0"], [0.3, "#e9b08a"], [0.45, "#c98463"], [0.6, "#8f5440"], [0.8, "#5a3027"], [1, "#2a1410"]],
      accent: ["#16605a", "#a3322a"],
      light: "#ffe2b8",
      frame: "#1a0d0a",
    },
    layers: [
      { id: "sky", role: "sky", depth: 0, shapes: [R(wx, wTop, ww, wBot - wTop)] },
      { id: "sun", role: "light", depth: 0.05, shapes: [{ kind: "circle", cx: wx + ww * 0.62, cy: wBot - 0.03 * u, r: 0.06 * u }] },
      { id: "roofs", role: "far", depth: 0.15, shapes: [P(`M${wx} ${wBot} V${wBot - 0.06 * u} H${wx + ww * 0.3} V${wBot - 0.1 * u} H${wx + ww * 0.55} V${wBot - 0.05 * u} H${wx + ww} V${wBot} Z`)] },
      { id: "wall", role: "wall", depth: 0.3, shapes: [hole(box(0, 0, w, floorTop), box(wx, wTop, ww, wBot - wTop))] },
      {
        id: "curtains", role: "object", depth: 0.38, tint: 1,
        shapes: [
          P(`M${wx - 0.05 * u} ${wTop - 0.04 * u} H${wx + 0.06 * u} Q${wx + 0.02 * u} ${(wTop + wBot) / 2} ${wx + 0.07 * u} ${wBot + 0.06 * u} H${wx - 0.05 * u} Z`),
          P(`M${wx + ww + 0.05 * u} ${wTop - 0.04 * u} H${wx + ww - 0.06 * u} Q${wx + ww - 0.02 * u} ${(wTop + wBot) / 2} ${wx + ww - 0.07 * u} ${wBot + 0.06 * u} H${wx + ww + 0.05 * u} Z`),
          R(wx - 0.07 * u, wTop - 0.05 * u, ww + 0.14 * u, 0.012 * u, 4),
        ],
      },
      { id: "floor", role: "floor", depth: 0.45, shapes: [R(0, floorTop, w, h - floorTop)] },
      { id: "rug", role: "accent", tint: 1, depth: 0.5, shapes: [P(`M${cx - 0.2 * u} ${f + 0.03 * u} H${cx + 0.36 * u} L${cx + 0.32 * u} ${f - 0.02 * u} H${cx - 0.16 * u} Z`)] },
      {
        id: "bed", role: "object", depth: 0.66,
        shapes: [
          R(bedX, top - 0.2 * u, 0.04 * u, 0.42 * u, 6),
          R(bedX, top, bedR - bedX, 0.075 * u, 10),
          R(bedX + 0.02 * u, top + 0.075 * u, bedR - bedX - 0.04 * u, 0.06 * u),
          R(bedX + 0.03 * u, top + 0.13 * u, 0.025 * u, f - top - 0.13 * u),
          R(bedR - 0.055 * u, top + 0.13 * u, 0.025 * u, f - top - 0.13 * u),
          { kind: "ellipse", cx: bedX + 0.12 * u, cy: top - 0.02 * u, rx: 0.08 * u, ry: 0.035 * u },
        ],
      },
      { id: "table", role: "object", depth: 0.7, tint: 1, shapes: [R(bedR + 0.02 * u, f - 0.2 * u, 0.12 * u, 0.2 * u, 4), R(bedR + 0.06 * u, f - 0.27 * u, 0.04 * u, 0.07 * u, 3)] },
    ],
    seats: [{ x: bedR - 0.12 * u, y: top + 0.01 * u, dir: 1 }],
    figureDepth: 0.72,
  };
};

/** An Egyptian street at dusk (kahf cave-life): old buildings with balconies, a mashrabiya, a minaret
 * far away, a doorway lit at the end of the street. */
const street: Builder = (w, h, f) => {
  const u = Math.min(w, h);
  const cx = w / 2;
  const ground = f - 0.08 * u;
  const lx = cx - 0.24 * u;
  const rx = cx + 0.24 * u;
  const leftTop = f - 1.15 * u;
  const rightTop = f - 1.0 * u;
  const balcony = (x: number, y: number, bw: number): Shape[] => [R(x, y, bw, 0.014 * u), ...[0, 1, 2, 3, 4].map((i) => R(x + 6 + i * (bw - 12) / 4, y, 5, 0.06 * u)), R(x, y + 0.06 * u, bw, 0.012 * u)];
  const lit = [
    ...windows(0.02 * u, leftTop + 0.1 * u, lx - 0.05 * u, f - leftTop - 0.4 * u, 7, 0.07 * u),
    ...windows(rx + 0.03 * u, rightTop + 0.1 * u, w - rx - 0.05 * u, f - rightTop - 0.45 * u, 19, 0.07 * u),
  ];
  return {
    palette: {
      sky: ["#ffd9a8", "#c9708a"],
      ladder: [[0, "#f3b48a"], [0.15, "#c98a86"], [0.35, "#b0705a"], [0.45, "#94583e"], [0.6, "#6a3a28"], [0.85, "#3a1f16"], [1, "#1f0f0a"]],
      accent: ["#16605a", "#a3322a"],
      light: "#ffd88f",
      frame: "#140a08",
    },
    layers: [
      { id: "sky", role: "sky", depth: 0, shapes: [R(0, 0, w, f)] },
      {
        id: "far", role: "far", depth: 0.15,
        shapes: [
          R(cx + 0.02 * u, f - 0.62 * u, 0.04 * u, 0.5 * u),
          P(`M${cx + 0.01 * u} ${f - 0.62 * u} H${cx + 0.07 * u} L${cx + 0.04 * u} ${f - 0.72 * u} Z`),
          { kind: "ellipse", cx: cx - 0.06 * u, cy: f - 0.3 * u, rx: 0.1 * u, ry: 0.09 * u },
          R(cx - 0.2 * u, f - 0.3 * u, 0.4 * u, 0.3 * u),
        ],
      },
      { id: "door", role: "light", depth: 0.2, shapes: [P(arch(cx - 0.05 * u, ground - 0.2 * u, 0.1 * u, 0.2 * u))] },
      { id: "ground", role: "floor", depth: 0.3, shapes: [P(`M0 ${ground} H${w} V${h} H0 Z`)] },
      {
        id: "left", role: "wall", depth: 0.38,
        shapes: [R(0, leftTop, lx, ground - leftTop + 0.04 * u), ...balcony(lx - 0.18 * u, f - 0.66 * u, 0.2 * u)],
      },
      {
        id: "right", role: "wall", depth: 0.42, tint: 1,
        shapes: [R(rx, rightTop, w - rx, ground - rightTop + 0.04 * u), ...balcony(rx - 0.02 * u, f - 0.58 * u, 0.2 * u)],
      },
      {
        // A mashrabiya: a wooden screen window, its lattice cut open.
        id: "mashrabiya", role: "object", depth: 0.46,
        shapes: [hole(box(rx + 0.05 * u, f - 0.86 * u, 0.16 * u, 0.2 * u), [0, 1, 2, 3].map((i) => [0, 1, 2, 3, 4].map((j) => box(rx + 0.065 * u + i * 0.034 * u, f - 0.845 * u + j * 0.034 * u, 0.02 * u, 0.02 * u)).join(" ")).join(" "))],
      },
      {
        id: "lamp-post", role: "front", depth: 0.9,
        shapes: [R(w - 0.12 * u, f - 0.86 * u, 0.025 * u, h - f + 0.86 * u), P(`M${w - 0.16 * u} ${f - 0.86 * u} H${w - 0.07 * u} L${w - 0.09 * u} ${f - 0.95 * u} H${w - 0.14 * u} Z`)],
      },
      { id: "lamp-glow", role: "light", depth: 0.9, shapes: [{ kind: "ellipse", cx: w - 0.11 * u, cy: f - 0.84 * u, rx: 0.04 * u, ry: 0.02 * u }] },
    ],
    seats: [],
    figureDepth: 0.6,
    lit: { shapes: lit, depth: 0.4 },
  };
};

/** A café at night (kahf end-life): arched windows on the night, lanterns, two tables and chairs. */
const cafe: Builder = (w, h, f) => {
  const u = Math.min(w, h);
  const cx = w / 2;
  const floorTop = f - 0.1 * u;
  const aw = 0.24 * u;
  const ah = 0.4 * u;
  const aTop = f - 0.8 * u;
  const arches = [cx - 0.36 * u, cx + 0.12 * u].concat(w > 1.4 * u ? [cx - 0.84 * u, cx + 0.6 * u] : []);
  const table = (x: number): Shape[] => [
    { kind: "ellipse", cx: x, cy: f - 0.25 * u, rx: 0.11 * u, ry: 0.022 * u },
    R(x - 0.012 * u, f - 0.25 * u, 0.024 * u, 0.23 * u),
    { kind: "ellipse", cx: x, cy: f - 0.015 * u, rx: 0.06 * u, ry: 0.014 * u },
    P(`M${x - 0.03 * u} ${f - 0.27 * u} L${x - 0.024 * u} ${f - 0.32 * u} H${x - 0.006 * u} L${x} ${f - 0.27 * u} Z`),
  ];
  const chair = (x: number, dir: number): Shape[] => [
    R(x - 0.06 * u, f - 0.2 * u, 0.12 * u, 0.02 * u, 3),
    R(x - dir * 0.06 * u - 0.01 * u, f - 0.42 * u, 0.02 * u, 0.42 * u, 3),
    R(x + dir * 0.05 * u - 0.01 * u, f - 0.2 * u, 0.02 * u, 0.2 * u, 3),
  ];
  const lanterns = Array.from({ length: Math.round(w / (0.16 * u)) }, (_, i) => ({ x: (i + 0.5) * 0.16 * u, y: aTop - 0.12 * u + 0.03 * u * Math.sin(i * 1.7) }));
  return {
    palette: {
      sky: ["#2c3f74", "#14203f"],
      ladder: [[0, "#33467a"], [0.3, "#c7864f"], [0.45, "#a9673b"], [0.6, "#7a4426"], [0.8, "#4a2516"], [1, "#22100a"]],
      accent: ["#16605a", "#a3322a"],
      light: "#ffd890",
      frame: "#120906",
    },
    layers: [
      { id: "night", role: "sky", depth: 0, shapes: arches.map((x) => P(arch(x, aTop, aw, ah))) },
      { id: "moon", role: "light", depth: 0.05, shapes: [P(`M${cx - 0.27 * u} ${aTop + 0.1 * u} a${0.04 * u} ${0.04 * u} 0 1 0 ${0.03 * u} ${0.075 * u} a${0.032 * u} ${0.032 * u} 0 1 1 ${-0.03 * u} ${-0.075 * u} Z`)] },
      { id: "wall", role: "wall", depth: 0.3, shapes: [P(`M0 0 H${w} V${floorTop} H0 Z ${arches.map((x) => arch(x, aTop, aw, ah)).join(" ")}`)] },
      { id: "cord", role: "object", depth: 0.35, shapes: [P(`M0 ${aTop - 0.13 * u} Q${w / 2} ${aTop - 0.05 * u} ${w} ${aTop - 0.13 * u} V${aTop - 0.125 * u} Q${w / 2} ${aTop - 0.045 * u} 0 ${aTop - 0.125 * u} Z`)] },
      { id: "lanterns", role: "light", depth: 0.36, shapes: lanterns.map((l) => ({ kind: "ellipse" as const, cx: l.x, cy: l.y + 0.03 * u, rx: 0.016 * u, ry: 0.024 * u })) },
      { id: "floor", role: "floor", depth: 0.45, shapes: [R(0, floorTop, w, h - floorTop)] },
      { id: "chairs", role: "object", depth: 0.55, tint: 1, shapes: [...chair(cx - 0.3 * u, -1), ...chair(cx + 0.3 * u, 1)] },
      { id: "table", role: "object", depth: 0.75, shapes: table(cx) },
    ],
    seats: [
      { x: cx - 0.3 * u, y: f - 0.2 * u, dir: 1 },
      { x: cx + 0.3 * u, y: f - 0.2 * u, dir: -1 },
    ],
    figureDepth: 0.65,
  };
};

/** The old city (18:19): houses and domes, a bread stall, the silver coin on its counter. */
const oldCity: Builder = (w, h, f) => {
  const u = Math.min(w, h);
  const cx = w / 2;
  const ground = f - 0.06 * u;
  const houses: Shape[] = [];
  for (let x = -0.05 * u, i = 0; x < w; i++) {
    const hw = (0.2 + 0.08 * rand(i + 5)) * u;
    const hh = (0.36 + 0.22 * rand(i + 9)) * u;
    houses.push(R(x, ground - hh, hw, hh + 0.02 * u));
    if (rand(i + 13) > 0.45) houses.push({ kind: "ellipse", cx: x + hw / 2, cy: ground - hh, rx: hw * 0.32, ry: hw * 0.3 });
    x += hw + 0.01 * u;
  }
  const doors = houses.filter((s) => s.kind === "rect").map((s) => (s.kind === "rect" ? P(arch(s.x + s.w * 0.35, ground - 0.16 * u, s.w * 0.3, 0.16 * u)) : s));
  const stallX = cx - 0.22 * u;
  const stallW = 0.44 * u;
  const counter = f - 0.3 * u;
  const awning = Array.from({ length: 8 }, (_, i) => R(stallX - 0.03 * u + (i * (stallW + 0.06 * u)) / 8, counter - 0.36 * u, (stallW + 0.06 * u) / 8, 0.08 * u));
  return {
    palette: {
      sky: ["#fff0c4", "#f2b25e"],
      ladder: [[0, "#f7cf92"], [0.15, "#e7b178"], [0.35, "#d79a5e"], [0.5, "#b8743f"], [0.7, "#7d4626"], [1, "#2a140a"]],
      accent: ["#16605a", "#a3322a"],
      light: "#ffe6a8",
      frame: "#170c07",
    },
    layers: [
      { id: "sky", role: "sky", depth: 0, shapes: [R(0, 0, w, f)] },
      {
        id: "domes", role: "far", depth: 0.12,
        shapes: [
          { kind: "ellipse", cx: cx - 0.3 * u, cy: ground - 0.5 * u, rx: 0.12 * u, ry: 0.11 * u },
          R(cx - 0.42 * u, ground - 0.5 * u, 0.24 * u, 0.5 * u),
          R(cx + 0.3 * u, ground - 0.66 * u, 0.05 * u, 0.66 * u),
          P(`M${cx + 0.29 * u} ${ground - 0.66 * u} H${cx + 0.36 * u} L${cx + 0.325 * u} ${ground - 0.76 * u} Z`),
        ],
      },
      { id: "houses", role: "wall", depth: 0.3, shapes: houses },
      { id: "doors", role: "object", depth: 0.33, tint: 1, shapes: doors },
      { id: "ground", role: "floor", depth: 0.42, shapes: [P(`M0 ${ground} H${w} V${h} H0 Z`)] },
      {
        id: "stall", role: "object", depth: 0.6,
        shapes: [
          R(stallX, counter, stallW, f - counter),
          R(stallX - 0.02 * u, counter - 0.018 * u, stallW + 0.04 * u, 0.022 * u, 4),
          R(stallX, counter - 0.28 * u, 0.018 * u, 0.28 * u),
          R(stallX + stallW - 0.018 * u, counter - 0.28 * u, 0.018 * u, 0.28 * u),
        ],
      },
      { id: "awning", role: "accent", depth: 0.62, tint: 1, shapes: awning.filter((_, i) => i % 2 === 0) },
      { id: "awning-2", role: "object", depth: 0.62, shapes: awning.filter((_, i) => i % 2 === 1) },
      {
        id: "loaves", role: "object", depth: 0.64, tint: 1,
        shapes: [0, 1, 2, 3].map((i) => ({ kind: "ellipse" as const, cx: stallX + 0.08 * u + i * 0.08 * u, cy: counter - 0.04 * u, rx: 0.036 * u, ry: 0.022 * u })),
      },
      { id: "coin", role: "light", depth: 0.66, shapes: [{ kind: "circle", cx: stallX + stallW - 0.07 * u, cy: counter - 0.03 * u, r: 0.024 * u }] },
      { id: "jar", role: "front", depth: 0.92, shapes: [P(`M${0.06 * u} ${h} Q${0.02 * u} ${h - 0.12 * u} ${0.07 * u} ${h - 0.2 * u} H${0.15 * u} Q${0.2 * u} ${h - 0.12 * u} ${0.16 * u} ${h} Z`)] },
    ],
    seats: [],
    figureDepth: 0.55,
  };
};

/** The cave's mouth in the hill at dawn, the dog at its threshold, forelegs stretched (18:18). */
const caveEntrance: Builder = (w, h, f) => {
  const u = Math.min(w, h);
  const cx = w / 2;
  const mw = 0.34 * u;
  const mTop = f - 0.5 * u;
  const mouth = arch(cx - mw / 2, mTop, mw, f - 0.04 * u - mTop);
  const dx = cx - 0.02 * u;
  const dy = f - 0.06 * u;
  const s = 0.0013 * u;
  return {
    palette: {
      sky: ["#ffe9c4", "#f7a868"],
      ladder: [[0, "#f6c58c"], [0.1, "#d9a070"], [0.2, "#3a1d10"], [0.35, "#b9773f"], [0.45, "#9a5a32"], [0.6, "#6a3a20"], [1, "#1c0d06"]],
      accent: ["#16605a", "#a3322a"],
      light: "#ffe2a0",
      frame: "#150b06",
    },
    layers: [
      { id: "sky", role: "sky", depth: 0, shapes: [R(0, 0, w, f)] },
      { id: "sun", role: "light", depth: 0.02, shapes: [{ kind: "circle", cx: cx + 0.36 * u, cy: f - 0.62 * u, r: 0.06 * u }] },
      { id: "hills", role: "far", depth: 0.1, shapes: [P(`M0 ${f - 0.4 * u} Q${w * 0.25} ${f - 0.62 * u} ${w * 0.5} ${f - 0.46 * u} Q${w * 0.75} ${f - 0.6 * u} ${w} ${f - 0.42 * u} V${h} H0 Z`)] },
      { id: "dark", role: "wall", depth: 0.2, shapes: [P(mouth)] },
      {
        id: "hill", role: "wall", depth: 0.35,
        shapes: [P(`M${-0.1 * u} ${h} V${f - 0.55 * u} Q${cx - 0.45 * u} ${f - 0.98 * u} ${cx} ${f - 0.9 * u} Q${cx + 0.5 * u} ${f - 0.84 * u} ${w + 0.1 * u} ${f - 0.5 * u} V${h} Z ${mouth}`)],
      },
      { id: "ground", role: "floor", depth: 0.42, shapes: [P(`M0 ${f - 0.04 * u} Q${cx} ${f - 0.1 * u} ${w} ${f - 0.03 * u} V${h} H0 Z`)] },
      {
        id: "dog", role: "figure", depth: 0.48,
        shapes: [
          { kind: "ellipse", cx: dx - 70 * s, cy: dy - 6 * s, rx: 100 * s, ry: 30 * s },
          { kind: "circle", cx: dx + 32 * s, cy: dy - 28 * s, r: 28 * s },
          { kind: "ellipse", cx: dx + 60 * s, cy: dy - 18 * s, rx: 20 * s, ry: 11 * s },
          P(`M${dx + 20 * s} ${dy - 48 * s} L${dx + 12 * s} ${dy - 82 * s} L${dx + 42 * s} ${dy - 52 * s} Z`),
          R(dx + 12 * s, dy + 4 * s, 86 * s, 13 * s, 6 * s),
          P(`M${dx - 164 * s} ${dy - 8 * s} Q${dx - 204 * s} ${dy - 26 * s} ${dx - 218 * s} ${dy + 4 * s} Q${dx - 192 * s} ${dy - 6 * s} ${dx - 166 * s} ${dy + 8 * s} Z`),
        ],
      },
      {
        id: "rocks", role: "front", depth: 0.9,
        shapes: [
          P(`M0 ${h} V${h - 0.16 * u} Q${0.12 * u} ${h - 0.26 * u} ${0.26 * u} ${h - 0.18 * u} Q${0.36 * u} ${h - 0.22 * u} ${0.42 * u} ${h} Z`),
          P(`M${w} ${h} V${h - 0.2 * u} Q${w - 0.14 * u} ${h - 0.28 * u} ${w - 0.3 * u} ${h - 0.16 * u} L${w - 0.34 * u} ${h} Z`),
          ...[0, 1, 2, 3, 4].map((i) => ({ kind: "ellipse" as const, cx: w - 0.2 * u + i * 0.03 * u, cy: h - 0.27 * u - (i % 2) * 0.02 * u, rx: 0.012 * u, ry: 0.06 * u, rotate: -30 + i * 15 })),
        ],
      },
    ],
    seats: [],
    figureDepth: 0.5,
  };
};

/** Inside the cave (18:17): its mouth at the back, the rising sun turning away to the right, the
 * middle in shade; the dog at the threshold. The youths are never shown. */
const caveInside: Builder = (w, h, f) => {
  const u = Math.min(w, h);
  const cx = w / 2;
  const mw = 0.3 * u;
  const mx = cx - 0.05 * u - mw / 2;
  const mBot = f - 0.06 * u;
  const mTop = f - 0.44 * u;
  const mouth = arch(mx, mTop, mw, mBot - mTop);
  const wallL = cx - 0.3 * u;
  const wallR = cx + 0.3 * u;
  const dx = mx + mw * 0.55;
  const s = 0.0011 * u;
  return {
    palette: {
      sky: ["#fff6d8", "#ffbe6e"],
      ladder: [[0, "#e0a25f"], [0.12, "#b9783f"], [0.2, "#dc9a5e"], [0.35, "#a9653a"], [0.42, "#c27e4c"], [0.6, "#5c3019"], [1, "#1a0c05"]],
      accent: ["#16605a", "#a3322a"],
      light: "#ffdc90",
      frame: "#120a06",
    },
    layers: [
      { id: "outside", role: "sky", depth: 0, shapes: [R(mx - 20, mTop - 20, mw + 40, mBot - mTop + 40)] },
      { id: "hills", role: "far", depth: 0.12, shapes: [P(`M${mx} ${mBot - 0.12 * u} Q${mx + mw * 0.3} ${mBot - 0.2 * u} ${mx + mw * 0.5} ${mBot - 0.15 * u} Q${mx + mw * 0.75} ${mBot - 0.22 * u} ${mx + mw} ${mBot - 0.13 * u} V${mBot + 10} H${mx} Z`)] },
      { id: "back-wall", role: "wall", depth: 0.2, shapes: [hole(box(0, 0, w, h), mouth)] },
      {
        id: "walls", role: "wall", depth: 0.35, tint: 1,
        shapes: [
          P(`M0 0 L${wallL + 0.06 * u} 0 Q${wallL - 0.02 * u} ${f * 0.3} ${wallL - 0.06 * u} ${f * 0.6} Q${wallL - 0.1 * u} ${f * 0.85} ${wallL - 0.08 * u} ${f} L${wallL - 0.14 * u} ${h} L0 ${h} Z`),
          P(`M${w} 0 L${wallR - 0.06 * u} 0 Q${wallR + 0.04 * u} ${f * 0.3} ${wallR + 0.08 * u} ${f * 0.6} Q${wallR + 0.12 * u} ${f * 0.85} ${wallR + 0.08 * u} ${f} L${wallR + 0.16 * u} ${h} L${w} ${h} Z`),
          P(`M0 0 H${w} V${Math.max(40, f - 1.1 * u)} Q${w * 0.8} ${f - 1.0 * u} ${w * 0.65} ${f - 1.06 * u} Q${w * 0.5} ${f - 0.98 * u} ${w * 0.35} ${f - 1.05 * u} Q${w * 0.18} ${f - 0.98 * u} 0 ${f - 1.04 * u} Z`),
        ],
      },
      { id: "floor", role: "floor", depth: 0.4, shapes: [P(`M0 ${f + 0.12 * u} Q${w * 0.28} ${f - 0.05 * u} ${cx} ${f - 0.055 * u} Q${w * 0.74} ${f - 0.05 * u} ${w} ${f + 0.1 * u} V${h} H0 Z`)] },
      {
        id: "dog", role: "figure", depth: 0.45,
        shapes: [
          { kind: "ellipse", cx: dx - 70 * s, cy: mBot - 8 * s, rx: 100 * s, ry: 30 * s },
          { kind: "circle", cx: dx + 32 * s, cy: mBot - 30 * s, r: 28 * s },
          { kind: "ellipse", cx: dx + 60 * s, cy: mBot - 20 * s, rx: 20 * s, ry: 11 * s },
          P(`M${dx + 20 * s} ${mBot - 50 * s} L${dx + 12 * s} ${mBot - 84 * s} L${dx + 42 * s} ${mBot - 54 * s} Z`),
          R(dx + 12 * s, mBot + 2 * s, 86 * s, 13 * s, 6 * s),
        ],
      },
      {
        id: "inner-rocks", role: "object", depth: 0.6,
        shapes: [
          P(`M0 0 H${wallL - 0.2 * u} Q${wallL - 0.32 * u} ${f * 0.4} ${wallL - 0.36 * u} ${f * 0.8} L${wallL - 0.4 * u} ${h} H0 Z`),
          P(`M${w} 0 H${wallR + 0.22 * u} Q${wallR + 0.34 * u} ${f * 0.4} ${wallR + 0.38 * u} ${f * 0.8} L${wallR + 0.42 * u} ${h} H${w} Z`),
        ],
      },
      {
        id: "front-rocks", role: "front", depth: 0.92,
        shapes: [
          P(`M0 ${h} V${h - 0.2 * u} Q${0.14 * u} ${h - 0.28 * u} ${0.28 * u} ${h - 0.21 * u} Q${0.4 * u} ${h - 0.26 * u} ${0.48 * u} ${h - 0.18 * u} L${0.5 * u} ${h} Z`),
          P(`M${w} ${h} V${h - 0.25 * u} Q${w - 0.14 * u} ${h - 0.3 * u} ${w - 0.25 * u} ${h - 0.2 * u} Q${w - 0.31 * u} ${h - 0.14 * u} ${w - 0.31 * u} ${h} Z`),
        ],
      },
    ],
    seats: [],
    figureDepth: 0.5,
    beam: {
      d: `M${mx + mw * 0.6} ${mTop + 0.06 * u} L${mx + mw} ${mBot - 0.05 * u} L${wallR + 0.12 * u} ${f + 0.06 * u} L${wallR + 0.1 * u} ${mTop - 0.08 * u} Z`,
      patch: { cx: wallR + 0.1 * u, cy: (mTop + f) / 2, rx: 0.05 * u, ry: 0.26 * u },
    },
  };
};

export const PAPER_PLACES: Record<string, Builder> = {
  office,
  bedroom,
  street,
  cafe,
  "old-city": oldCity,
  "cave-entrance": caveEntrance,
  "cave-inside": caveInside,
};

// ---------------------------------------------------------------------------------------------
// Places of the first episodes (waiting room, mosque), added with the chalk style (2026-11-10), whose
// people are the Open Peeps figures: in both formats a standing one fills four fifths of the height
// above the floor line (formats.ts, STAGE), far more of a reel than the 0.6 u of a paper
// silhouette. So these two take their unit from that height, not from the frame's short side: a
// standing person is still 0.6 u tall, the door is a door for that person and the seat a seat, in a
// reel (seen from close: its middle only) as in an episode. `lines` are what a line style draws
// inside a layer (the hands of the clock, the tiles); the paper style ignores them.

/** The unit of a place drawn for people who fill 0.8 of the height above the floor line. */
const unitOf = (f: number) => f / 0.75;

/** A pointed arch: two curves that meet at the top, over a rectangle (x: its left, y: its top). */
const ogive = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y + h} V${y + 0.55 * w} Q${x} ${y + 0.1 * w} ${x + w / 2} ${y} Q${x + w} ${y + 0.1 * w} ${x + w} ${y + 0.55 * w} V${y + h} Z`;

/** A waiting room (the hooks of the first episodes): a row of seats along the wall, a clock above
 * it (the time that passes), a door. */
const waitingRoom: Builder = (w, h, f) => {
  const u = unitOf(f);
  const cx = w / 2;
  const floorTop = f - 0.07 * u;
  // The row of seats: low (the hips of a sitting person), long enough for two.
  const seatY = f - 0.085 * u;
  const bx = cx - 0.6 * u;
  const bw = 0.78 * u;
  const legs = [bx + 0.05 * u, bx + bw / 2, bx + bw - 0.05 * u];
  // The clock, on the left of whoever sits in the middle (the page's signature is on the right).
  const kx = cx - 0.17 * u;
  const ky = f - 0.6 * u;
  const kr = 0.052 * u;
  const hand = (deg: number, len: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `M${kx} ${ky} L${(kx + Math.cos(a) * len).toFixed(1)} ${(ky + Math.sin(a) * len).toFixed(1)}`;
  };
  const ticks = [0, 90, 180, 270].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return `M${(kx + Math.cos(a) * kr * 0.74).toFixed(1)} ${(ky + Math.sin(a) * kr * 0.74).toFixed(1)} L${(kx + Math.cos(a) * kr * 0.9).toFixed(1)} ${(ky + Math.sin(a) * kr * 0.9).toFixed(1)}`;
  });
  // The door, on the right: its frame, its leaf with a panel, its handle.
  const dx = cx + 0.21 * u;
  const dw = 0.25 * u;
  const dTop = f - 0.68 * u;
  const t = 0.014 * u;
  return {
    palette: WARM,
    layers: [
      { id: "wall", role: "wall", depth: 0.3, shapes: [R(0, 0, w, floorTop)] },
      {
        id: "door", role: "object", depth: 0.33, tint: 1,
        shapes: [R(dx - t, dTop - t, dw + 2 * t, floorTop - dTop + t)],
        over: [R(dx, dTop, dw, floorTop - dTop)],
        lines: [
          `M${dx + 0.035 * u} ${f - 0.36 * u} a${0.011 * u} ${0.011 * u} 0 1 0 0.1 0`,
          `M${dx + 0.05 * u} ${dTop + 0.05 * u} H${dx + dw - 0.05 * u} V${f - 0.42 * u} H${dx + 0.05 * u} Z`,
        ],
      },
      {
        id: "clock", role: "object", depth: 0.34,
        shapes: [{ kind: "circle", cx: kx, cy: ky, r: kr }],
        lines: [hand(300, kr * 0.48), hand(60, kr * 0.7), ...ticks],
      },
      { id: "floor", role: "floor", depth: 0.4, shapes: [R(0, floorTop, w, h - floorTop)] },
      {
        id: "seats", role: "object", depth: 0.55,
        shapes: [
          R(bx + 0.02 * u, seatY - 0.2 * u, bw - 0.04 * u, 0.15 * u, 0.02 * u),
          R(bx, seatY, bw, 0.028 * u, 0.008 * u),
          ...legs.map((x) => R(x - 0.007 * u, seatY + 0.028 * u, 0.014 * u, f - 0.012 * u - seatY - 0.028 * u)),
        ],
      },
    ],
    seats: [
      { x: cx - 0.02 * u, y: seatY, dir: 1 },
      { x: cx - 0.36 * u, y: seatY, dir: 1 },
    ],
    figureDepth: 0.6,
    person: 0.6 * u,
  };
};

/** A mosque (khushu): the mihrab in the middle of the qibla wall, arched windows on each side of it,
 * hanging lamps between them, a tiled band at the foot of the wall, the carpet. No one in it. */
const mosque: Builder = (w, h, f) => {
  const u = unitOf(f);
  const cx = w / 2;
  const floorTop = f - 0.07 * u;
  const gap = 0.215 * u;
  const ww = 0.13 * u;
  const wTop = f - 0.68 * u;
  const wBot = f - 0.28 * u;
  const sides: number[] = [];
  for (let k = 1; cx + k * gap - ww / 2 < w; k++) sides.push(k);
  const windows = sides.flatMap((k) => [cx - k * gap, cx + k * gap]).map((x) => ogive(x - ww / 2, wTop, ww, wBot - wTop));
  // The mihrab: a niche in a frame, down to the floor.
  const mw = 0.2 * u;
  const mTop = f - 0.73 * u;
  // Lamps hang in the gaps: beside the mihrab, then between two windows.
  const lampXs = sides.flatMap((k) => (k === 1 ? [cx - 0.128 * u, cx + 0.128 * u] : [cx - (k - 0.5) * gap, cx + (k - 0.5) * gap]));
  const lampY = f - 0.7 * u;
  const s = 0.022 * u;
  // The tiled band: a row of lozenges between two lines.
  const band = 0.07 * u;
  const tiles = (x0: number, x1: number) => {
    const n = Math.max(1, Math.round((x1 - x0) / (band * 0.9)));
    const step = (x1 - x0) / n;
    let up = `M${x0.toFixed(1)} ${floorTop - band / 2}`;
    let down = up;
    for (let i = 0; i < n; i++) {
      up += ` l${(step / 2).toFixed(1)} ${(-band * 0.32).toFixed(1)} l${(step / 2).toFixed(1)} ${(band * 0.32).toFixed(1)}`;
      down += ` l${(step / 2).toFixed(1)} ${(band * 0.32).toFixed(1)} l${(step / 2).toFixed(1)} ${(-band * 0.32).toFixed(1)}`;
    }
    return [up, down];
  };
  const side = cx - mw / 2 - 0.02 * u;
  return {
    palette: {
      sky: ["#fff6dc", "#f6c98a"],
      ladder: [[0, "#f6dcae"], [0.3, "#e6bd86"], [0.4, "#c9925a"], [0.5, "#a5683a"], [0.8, "#5c3019"], [1, "#27130a"]],
      accent: ["#16605a", "#a3322a"],
      light: "#ffe6a8",
      frame: "#170c07",
    },
    layers: [
      { id: "light", role: "sky", depth: 0, shapes: windows.map(P) },
      { id: "wall", role: "wall", depth: 0.3, shapes: [P(`${box(0, 0, w, floorTop)} ${windows.join(" ")}`)] },
      {
        id: "mihrab", role: "object", depth: 0.34, tint: 1,
        shapes: [P(ogive(cx - mw / 2, mTop, mw, floorTop - mTop))],
        over: [P(ogive(cx - mw / 2 + 0.028 * u, mTop + 0.05 * u, mw - 0.056 * u, floorTop - mTop - 0.05 * u))],
      },
      {
        id: "tiles", role: "object", depth: 0.36,
        shapes: [R(0, floorTop - band, side, band), R(w - side, floorTop - band, side, band)],
        lines: [...tiles(0, side), ...tiles(w - side, w)],
      },
      {
        id: "lamps", role: "object", depth: 0.38,
        shapes: lampXs.flatMap((x) => [
          R(x - 1.5, 0, 3, lampY),
          P(`M${x - s} ${lampY} H${x + s} L${x + s * 0.6} ${lampY + s * 2.4} H${x - s * 0.6} Z`),
        ]),
      },
      { id: "flames", role: "light", depth: 0.39, shapes: lampXs.map((x) => ({ kind: "ellipse" as const, cx: x, cy: lampY + s * 1.2, rx: s * 0.42, ry: s * 0.8 })) },
      {
        id: "floor", role: "floor", depth: 0.4, shapes: [R(0, floorTop, w, h - floorTop)],
        lines: [`M0 ${f + 0.11 * u} H${w}`, `M0 ${f + 0.26 * u} H${w}`],
      },
      { id: "carpet", role: "accent", tint: 1, depth: 0.45, shapes: [R(0, f - 0.018 * u, w, 0.05 * u)] },
    ],
    seats: [],
    figureDepth: 0.6,
    person: 0.6 * u,
  };
};

PAPER_PLACES["waiting-room"] = waitingRoom;
PAPER_PLACES.mosque = mosque;
