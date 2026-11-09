// Paper-cut silhouettes of the catalog characters (content/characters.yaml, `paper_poses`): one flat
// shape per person, no face, recognisable by its outline (Amir's short beard, Salma's hijab, Karim's
// flat cap and paunch). The arms are their own group, over the body. Emotion is in the posture.
// Coordinates are in percent of the standing height, from the feet (x to where the person looks).
import type { Shape } from "../geometry";

export type Build = "man" | "woman";
export type Look = { build: Build; beard?: boolean; cap?: boolean; stout?: boolean; tall?: number };

/** Silhouette looks of the catalog characters. */
export const LOOKS: Record<string, Look> = {
  amir: { build: "man", beard: true },
  salma: { build: "woman" },
  youssef: { build: "man", tall: 1.04 },
  hoda: { build: "woman", tall: 0.97 },
  karim: { build: "man", beard: true, cap: true, stout: true, tall: 0.98 },
  narrator: { build: "man", beard: true },
};

export type Figure = { body: Shape[]; arms: Shape[] };

type Cmd = [string, ...number[]];

/** A path from commands in percent of the height (M, L, Q, C, Z), mirrored by `dir`. */
const pathOf = (cmds: Cmd[], x: number, floorY: number, k: number, dir: number): Shape => ({
  kind: "path",
  d: cmds
    .map(([c, ...n]) => {
      const pts: string[] = [];
      for (let i = 0; i < n.length; i += 2) pts.push(`${(x + dir * n[i] * k).toFixed(1)} ${(floorY - n[i + 1] * k).toFixed(1)}`);
      return `${c}${pts.join(" ")}`;
    })
    .join(" "),
});

/** A tapered limb from (x1, y1) to (x2, y2), w1 wide at the start and w2 at the end. */
const limb = (x1: number, y1: number, x2: number, y2: number, w1: number, w2: number): Cmd[] => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return [
    ["M", x1 + (nx * w1) / 2, y1 + (ny * w1) / 2],
    ["L", x2 + (nx * w2) / 2, y2 + (ny * w2) / 2],
    ["Q", x2 + (dx / len) * w2 * 0.9, y2 + (dy / len) * w2 * 0.9, x2 - (nx * w2) / 2, y2 - (ny * w2) / 2],
    ["L", x1 - (nx * w1) / 2, y1 - (ny * w1) / 2],
    ["Q", x1 - (dx / len) * w1 * 0.7, y1 - (dy / len) * w1 * 0.7, x1 + (nx * w1) / 2, y1 + (ny * w1) / 2],
    ["Z"],
  ];
};

/** The head: nose toward where the person looks, beard, cap, or the hijab around it. */
const head = (look: Look, hx: number, hy: number, bow = 0): Cmd[][] => {
  const out: Cmd[][] = [];
  if (look.build === "woman") {
    // The hijab: round over the head, falling over the shoulders like a short cape.
    out.push([
      ["M", hx - 7.4, hy - 3], ["Q", hx - 8.6, hy + 8.4, hx + 0.4, hy + 8], ["Q", hx + 8.8, hy + 8.2, hx + 7.6, hy - 2.5],
      ["Q", hx + 8.2, hy - 7.5, hx + 12, hy - 10], ["Q", hx + 13.5, hy - 12, hx + 12.5, hy - 16],
      ["L", hx - 12.5, hy - 16], ["Q", hx - 13.5, hy - 12, hx - 12, hy - 10], ["Q", hx - 8.4, hy - 7.6, hx - 7.4, hy - 3], ["Z"],
    ]);
    out.push([["M", hx + 6.2, hy + 0.5], ["Q", hx + 8.6, hy - 1.2, hx + 7.4, hy - 3.2], ["L", hx + 5.6, hy - 2], ["Z"]]);
    return out;
  }
  out.push([["M", hx + 5.6, hy + 1.6 - bow], ["L", hx + 8.6, hy - 1 - bow], ["L", hx + 5.8, hy - 2.4 - bow], ["Z"]]);
  if (look.beard) out.push([["M", hx - 3, hy - 3], ["Q", hx - 1, hy - 8.8 - bow, hx + 4.6, hy - 6.6 - bow], ["Q", hx + 6.6, hy - 4.6 - bow, hx + 6, hy - 2.4 - bow], ["L", hx + 1, hy - 1], ["Z"]]);
  // Hair: a little tuft at the back of the head.
  out.push([["M", hx - 6.4, hy + 1.8], ["Q", hx - 7.4, hy + 5.4, hx - 3.4, hy + 7.2], ["Q", hx - 6, hy + 6.8, hx - 6.6, hy + 4], ["Z"]]);
  if (look.cap)
    out.push([["M", hx - 6.8, hy + 2.2], ["Q", hx - 6.4, hy + 8.6, hx + 0.6, hy + 8.4], ["Q", hx + 6.2, hy + 8, hx + 6.8, hy + 3.2], ["L", hx + 10.6, hy + 2], ["L", hx + 6.4, hy + 1], ["Z"]]);
  return out;
};

const R_HEAD = 6.6;

/** Standing, seen three-quarters; `point`: the near arm raised toward where the person looks. */
type Drawn = { body: Cmd[][]; arms: Cmd[][]; head: [number, number] };

const standing = (look: Look, point: boolean): Drawn => {
  const s = look.stout ? 1.12 : 1;
  const hx = 1;
  const hy = 91;
  const body: Cmd[][] = [];
  if (look.build === "woman") {
    body.push([
      ["M", -11.5, 79.5], ["Q", 0, 82.6, 11.5, 79.5], ["Q", 13.6, 78, 12.6, 72], ["L", 11, 56], ["Q", 12.6, 30, 14.2, 2.2],
      ["L", -14.2, 2.2], ["Q", -12.6, 30, -11, 56], ["L", -12.6, 72], ["Q", -13.6, 78, -11.5, 79.5], ["Z"],
    ]);
    body.push([["M", 2, 2.6], ["Q", 6, 4, 10.4, 2.2], ["Q", 10, 0.2, 6, 0.4], ["Q", 2.4, 0.6, 2, 2.6], ["Z"]]);
  } else {
    body.push([["M", -2.2, 86.4], ["L", -2.6, 80], ["L", 3.2, 80], ["L", 3, 86.4], ["Z"]]);
    body.push([
      ["M", -11.5 * s, 80.6], ["Q", -4, 83.4, 0.4, 83], ["Q", 4.6, 83.4, 11.5 * s, 80.6], ["Q", 13.8 * s, 79.4, 12.8 * s, 73.6],
      ["L", 10.4 * s, 57], ["Q", 11.6 * s + (look.stout ? 1.6 : 0), 51, 10.4 * s, 46.4], ["L", 9.4, 3.4], ["Q", 8.6, 2.2, 6.6, 2.4], ["L", 2.4, 2.6],
      ["L", 1.2, 42.6], ["Q", 0, 44.2, -1.2, 42.6], ["L", -2.6, 2.6], ["L", -7, 2.4], ["Q", -9.2, 2.4, -9.6, 3.4],
      ["L", -10.4 * s, 46.4], ["Q", -11.2 * s, 51, -10.2 * s, 57], ["L", -12.6 * s, 73.6], ["Q", -13.8 * s, 79.4, -11.5 * s, 80.6], ["Z"],
    ]);
    // Shoes, pointing where the person looks.
    body.push([["M", -9.4, 3.2], ["Q", -9.6, 0, -6, 0], ["L", -1, 0], ["Q", 0.6, 1.8, -2.4, 3.4], ["Z"]]);
    body.push([["M", 2.2, 3.4], ["Q", 2, 0, 6, 0], ["L", 11.4, 0], ["Q", 12.4, 2.4, 9.4, 3.4], ["Z"]]);
  }
  body.push(...head(look, hx, hy));
  const arms: Cmd[][] = [
    [...limb(-12 * s, 77, -13.6 * s, 61, 4.6, 3.8), ...limb(-13.6 * s, 61, -13 * s, 47.5, 3.8, 3.2)],
    point
      ? [...limb(12 * s, 77.5, 22, 79, 4.4, 3.8), ...limb(22, 79, 31, 82.5, 3.8, 3)]
      : [...limb(12 * s, 77, 13.8 * s, 61, 4.6, 3.8), ...limb(13.8 * s, 61, 13.4 * s, 47.5, 3.8, 3.2)],
  ];
  return { body, arms, head: [hx, hy] };
};

/** Sitting on a seat `seat` percent high, seen from the side. */
const sitting = (look: Look, seat: number): Drawn => {
  const s = seat;
  const st = look.stout ? 1.6 : 0;
  const body: Cmd[][] = [];
  const hx = 2;
  const hy = s + 52;
  if (look.build === "woman") {
    body.push([
      ["M", -4, s + 44], ["Q", -7.4, s + 42, -7.4, s + 36], ["Q", -8.4, s + 20, -7.4, s + 4], ["Q", -7.4, s - 1.6, -2, s - 1.6],
      ["L", 15, s - 1.6], ["Q", 19, s - 1, 21.6, 2.2], ["L", 11.6, 2.2], ["Q", 13, s - 4, 13.4, s - 2], ["L", 13.4, s - 1.4],
      ["Q", 20.4, s + 0.4, 20.2, s + 3.6], ["Q", 19.6, s + 5.6, 17.4, s + 5.6], ["L", 2.4, s + 6.4],
      ["Q", 6, s + 10, 6.2, s + 20], ["Q", 6.8, s + 32, 4, s + 40], ["Q", 2, s + 44.4, -0.4, s + 44.6], ["Z"],
    ]);
  } else {
    body.push([["M", -1.6, s + 47.6], ["L", -2, s + 42], ["L", 3.6, s + 42], ["L", 3.4, s + 47.6], ["Z"]]);
    body.push([
      ["M", -4, s + 44], ["Q", -7.2, s + 42, -7.2, s + 36], ["Q", -8.2, s + 20, -7, s + 4], ["Q", -7, s - 1.4, -2, s - 1.6],
      ["L", 14, s - 1.6], ["Q", 16.6, s - 2, 16.6, s - 5], ["L", 16, 3.2], ["L", 20.6, 3.2], ["L", 20.4, s - 1],
      ["Q", 21, s + 3.4, 18, s + 4.2], ["L", 2.4, s + 5.6], ["Q", 5.6 + st, s + 10, 6 + st, s + 20], ["Q", 6.6, s + 32, 4.2, s + 40],
      ["Q", 2, s + 44.4, -0.4, s + 44.6], ["Z"],
    ]);
    body.push([["M", 15.6, 3.4], ["Q", 15.4, 0, 19, 0], ["L", 24.6, 0], ["Q", 25.6, 2.4, 21, 3.4], ["Z"]]);
  }
  body.push(...head(look, hx, hy));
  const arms: Cmd[][] = [[...limb(0.6, s + 40, 2, s + 22, 4.4, 3.6), ...limb(2, s + 22, 13, s + 6.6, 3.6, 3.2)]];
  return { body, arms, head: [hx, hy] };
};

/** Standing in prayer (qiyam), seen from the side, the head a little bowed, the hands on the chest. */
const praying = (look: Look): Drawn => {
  const body: Cmd[][] = [
    [["M", -1, 86], ["L", -1.6, 80], ["L", 3.8, 80], ["L", 3.6, 86], ["Z"]],
    [
      ["M", -3, 84], ["Q", -6.8, 82.6, -6.8, 78.6], ["Q", -6.4, 68, -6, 60], ["Q", -7.6, 52, -6.6, 46], ["L", -5, 24],
      ["L", -4.8, 3.2], ["Q", -5, 0, -2, 0], ["L", 8.6, 0], ["Q", 9.6, 2.6, 4.4, 3.4], ["L", 3.6, 24], ["Q", 4.6, 32, 4.4, 44],
      ["Q", 6.2, 52, 6, 58], ["Q", 6.8, 68, 6.6, 76], ["Q", 6, 82.4, 2.6, 84.4], ["Z"],
    ],
    ...head(look, 3.2, 90.4, 1.2),
  ];
  const arms: Cmd[][] = [
    [...limb(0.4, 80, 1, 66.6, 4.4, 3.8), ...limb(1, 66.6, 7.6, 73.4, 3.8, 3.4)],
    [["M", 6, 75.6], ["Q", 9.6, 76.4, 9.6, 73.2], ["Q", 9.2, 70.6, 6.4, 71], ["Z"]],
  ];
  return { body, arms, head: [3.2, 90.4] };
};

export type Pose = "standing" | "sitting" | "praying" | "pointing";

/** A catalog character in a paper pose, `H` tall when standing, feet on floorY, looking to `dir`. */
export const silhouette = (id: string, pose: string, x: number, floorY: number, H: number, dir: number, seatY?: number): Figure => {
  const look = LOOKS[id] ?? { build: "man" as const };
  const k = (H * (look.tall ?? 1)) / 100;
  const seat = Math.max(18, Math.min(40, (floorY - (seatY ?? floorY - 27 * k)) / k));
  const drawn = pose === "sitting" ? sitting(look, seat) : pose === "praying" ? praying(look) : standing(look, pose === "pointing");
  const toShape = (cmds: Cmd[]) => pathOf(cmds, x, floorY, k, dir);
  const [hx, hy] = drawn.head;
  return {
    body: [{ kind: "circle", cx: x + dir * hx * k, cy: floorY - hy * k, r: R_HEAD * k }, ...drawn.body.map(toShape)],
    arms: drawn.arms.map(toShape),
  };
};
