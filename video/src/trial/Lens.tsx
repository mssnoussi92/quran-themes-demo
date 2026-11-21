// The series « une image, puis le verset » (content/trial/lens.yaml; docs/themes.md): a metaphor that moves, with no
// voice, then the verse recited on its scene, then our method. Each episode is drawn twice (`cast`, the owner's A and
// B, 2026-11-15): `pov`, the viewer is the camera and only things move; `figure`, an anonymous stick figure with no
// face does what the viewer does (his rule since that day: never a prophet, a Companion, a known person or someone of
// a story). The figure is black and backlit like every drawing of the model: a round head, no eyes, no mouth.
import React from "react";
import { Easing, interpolate } from "remotion";
import { FONT } from "../fonts";
import { Rain } from "./Ayah";
import type { Drawn } from "./Trial";

const W = 1080;
const H = 1920;
const INK = "#05060d";
const FAR = "#0c0f1c";
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
/** 0 before `a`, 1 after `b`, eased between. */
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...CLAMP, easing: ease });
/** A number between 0 and 1 from an index: the same at every frame. */
const chance = (i: number, salt = 0) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const rad = (d: number) => (d * Math.PI) / 180;

/** When each scene starts. In the video: when its segment starts. On a cover (every scene starts at 0 and only the
 * cover's own scene is shown), the scenes before the cover's are long over and the ones after it far away, so that
 * the cover shows its scene two seconds in, as the video does. */
const timeline = (order: string[], show: (id: string) => number, since: (id: string) => number) => {
  const cover = since(order[0]) === since(order[order.length - 1]) ? order.find((id) => show(id) === 1) : undefined;
  const at = (id: string) => (cover === undefined ? since(id) : (order.indexOf(id) - order.indexOf(cover)) * 100);
  return Object.assign(at, { cover: cover !== undefined });
};

// ---------------------------------------------------------------------------------------------------------- figure

/** A pose: angles in degrees. Limbs are measured from straight down, positive towards where the figure faces; the
 * torso leans forward when positive; the head tilts back (looks up) when positive. [upper, lower] for each limb. */
export type Pose = { torso: number; head: number; armF: [number, number]; armB: [number, number]; legF: [number, number]; legB: [number, number] };

export const SEG = { torso: 118, neck: 18, head: 34, upper: 64, fore: 60, thigh: 76, shin: 74 };
/** From the pelvis to the sole, standing. */
export const LEGS = SEG.thigh + SEG.shin;

export const POSES: Record<string, Pose> = {
  stand: { torso: 0, head: 0, armF: [8, 4], armB: [-8, 4], legF: [5, -3], legB: [-5, -2] },
  desk: { torso: 8, head: -4, armF: [62, 30], armB: [56, 32], legF: [88, -88], legB: [84, -84] },
  jolt: { torso: -10, head: 8, armF: [30, 20], armB: [26, 20], legF: [88, -88], legB: [84, -84] },
  slump: { torso: 30, head: -38, armF: [18, 6], armB: [12, 6], legF: [88, -88], legB: [84, -84] },
  lookup: { torso: -8, head: 22, armF: [150, 12], armB: [-10, 4], legF: [6, -3], legB: [-6, -2] },
  // sitting on the floor, leaning back on its hands, the head back: looking at the sky
  gaze: { torso: -30, head: 10, armF: [-30, -4], armB: [-40, -4], legF: [112, -118], legB: [100, -100] },
  crouch: { torso: 38, head: -22, armF: [40, 30], armB: [30, 34], legF: [82, -86], legB: [-6, -84] },
  hope: { torso: 2, head: 30, armF: [118, 28], armB: [28, 28], legF: [82, -86], legB: [-6, -84] },
  hug: { torso: 30, head: -30, armF: [76, 64], armB: [70, 66], legF: [128, -124], legB: [122, -120] },
  joy: { torso: -8, head: 22, armF: [158, 8], armB: [-158, -8], legF: [6, -3], legB: [-6, -2] },
  // sitting on a sofa, bent over the phone held in both hands; then the head raised towards the window
  hunch: { torso: 26, head: -34, armF: [36, 86], armB: [30, 90], legF: [88, -88], legB: [84, -84] },
  raise: { torso: 2, head: 14, armF: [20, 40], armB: [16, 44], legF: [88, -88], legB: [84, -84] },
};

/** A pose between two others (k from 0 to 1). */
export const mix = (a: Pose, b: Pose, k: number): Pose => {
  const m = (x: number, y: number) => x + (y - x) * k;
  const m2 = (x: [number, number], y: [number, number]): [number, number] => [m(x[0], y[0]), m(x[1], y[1])];
  return { torso: m(a.torso, b.torso), head: m(a.head, b.head), armF: m2(a.armF, b.armF), armB: m2(a.armB, b.armB), legF: m2(a.legF, b.legF), legB: m2(a.legB, b.legB) };
};

/** A step of a walk: `phase` in radians grows with the distance walked. */
export const walk = (phase: number): Pose => {
  const s = Math.sin(phase);
  const bendF = -38 * Math.max(0, -Math.cos(phase));
  const bendB = -38 * Math.max(0, Math.cos(phase));
  return { torso: 5, head: 0, armF: [-22 * s, 16], armB: [22 * s, 16], legF: [26 * s, bendF], legB: [-26 * s, bendB] };
};

const down = (deg: number): [number, number] => [Math.sin(rad(deg)), Math.cos(rad(deg))];

/** The figure: (x, y) is its pelvis; `facing` 1 to the right, -1 to the left; `turn` turns the whole body (degrees);
 * `rim`: the colour of the light behind it; `lit`: a light in front of it (a screen) on its edges, 0 to 1. */
/** A simple face drawn in light on the dark head, looking to +x (the figure's front); (0, 0) the centre of the head. The
 * owner, 2026-11-20 (audit): a face on the anonymous silhouette when the feeling shows the difference (his rule of
 * 2026-11-19). */
export type FigureFace = "neutral" | "worried" | "calm" | "smile" | "shock";
export const LightFace: React.FC<{ face: FigureFace; color: string }> = ({ face, color }) => {
  const c = 9;
  const line = (d: string, w = 4) => <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  const eye = (dx: number, rx = 3.6, ry = 4.8) => <ellipse cx={c + dx} cy={-4} rx={rx} ry={ry} fill={color} />;
  switch (face) {
    case "worried":
      return <>{eye(-9)}{eye(9)}{line(`M ${c - 16} -12 L ${c - 4} -17`)}{line(`M ${c + 4} -17 L ${c + 16} -12`)}{line(`M ${c - 8} 14 Q ${c} 8 ${c + 8} 14`)}</>;
    case "calm":
      return <>{line(`M ${c - 14} -3 Q ${c - 9} 1 ${c - 4} -3`)}{line(`M ${c + 4} -3 Q ${c + 9} 1 ${c + 14} -3`)}{line(`M ${c - 6} 10 Q ${c} 15 ${c + 6} 10`)}</>;
    case "smile":
      return <>{eye(-9)}{eye(9)}{line(`M ${c - 9} 9 Q ${c} 18 ${c + 9} 9`)}</>;
    case "shock":
      return <>{eye(-9, 4.2, 5.6)}{eye(9, 4.2, 5.6)}<ellipse cx={c} cy={12} rx={5} ry={6.5} fill={color} /></>;
    default:
      return <>{eye(-9)}{eye(9)}{line(`M ${c - 6} 11 L ${c + 6} 11`)}</>;
  }
};

export const Figure: React.FC<{ id: string; x: number; y: number; scale: number; pose: Pose; facing?: number; turn?: number; rim?: string; lit?: number; light?: string; held?: React.ReactNode; face?: FigureFace }> = ({ id, x, y, scale, pose, facing = 1, turn = 0, rim = "#9fb6e6", lit = 0, light = "#ffd9a0", held, face: feeling }) => {
  const P: [number, number] = [0, 0];
  const up: [number, number] = [Math.sin(rad(pose.torso)), -Math.cos(rad(pose.torso))];
  const at = (o: [number, number], d: [number, number], len: number): [number, number] => [o[0] + d[0] * len, o[1] + d[1] * len];
  const neck = at(P, up, SEG.torso);
  const shoulder = at(P, up, SEG.torso - 12);
  const headDir: [number, number] = [Math.sin(rad(pose.torso - pose.head)), -Math.cos(rad(pose.torso - pose.head))];
  const head = at(neck, headDir, SEG.neck + SEG.head * 0.8);
  const limb = (o: [number, number], [a, b]: [number, number], l1: number, l2: number) => {
    const j = at(o, down(a), l1);
    return [o, j, at(j, down(a + b), l2)] as const;
  };
  const armF = limb(shoulder, pose.armF, SEG.upper, SEG.fore);
  const armB = limb(shoulder, pose.armB, SEG.upper, SEG.fore);
  const legF = limb(P, pose.legF, SEG.thigh, SEG.shin);
  const legB = limb(P, pose.legB, SEG.thigh, SEG.shin);
  // where the face is: square to the line from the neck to the head, on the side the figure faces
  const look = Math.atan2(headDir[1], headDir[0]) + Math.PI / 2;
  const r = SEG.head - 2;
  const arcAt = (k: number) => [head[0] + r * Math.cos(look + k), head[1] + r * Math.sin(look + k)].map((v) => v.toFixed(1)).join(" ");
  const face = `M ${arcAt(-0.75)} A ${r} ${r} 0 0 1 ${arcAt(0.75)}`;
  const path = (pts: readonly (readonly [number, number])[]) => `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")}`;
  const body = (stroke: string, extra: number, back: string) => (
    <>
      <path d={path(legB)} stroke={back} strokeWidth={26 + extra} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path(armB)} stroke={back} strokeWidth={22 + extra} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path([P, neck])} stroke={stroke} strokeWidth={44 + extra} fill="none" strokeLinecap="round" />
      <path d={path(legF)} stroke={stroke} strokeWidth={27 + extra} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path(armF)} stroke={stroke} strokeWidth={23 + extra} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={head[0]} cy={head[1]} r={SEG.head + extra / 2} fill={stroke} />
    </>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${facing * scale} ${scale})`}>
      <defs>
        <filter id={`${id}-rim`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <g filter={`url(#${id}-rim)`} opacity={0.8}>{body(rim, 12, rim)}</g>
      {lit > 0 ? <g filter={`url(#${id}-rim)`} opacity={0.85 * lit} transform="translate(7 3)">{body(light, 7, light)}</g> : null}
      {body(INK, 0, FAR)}
      <path d={face} stroke={rim} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.75} />
      {lit > 0 ? <path d={face} stroke={light} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.9 * lit} /> : null}
      {feeling ? (
        <g transform={`translate(${head[0].toFixed(1)} ${head[1].toFixed(1)}) rotate(${((look * 180) / Math.PI).toFixed(1)})`}>
          <LightFace face={feeling} color="#e6ecfa" />
        </g>
      ) : null}
      {held ? <g transform={`translate(${armF[2][0].toFixed(1)} ${armF[2][1].toFixed(1)})`}>{held}</g> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------- pieces

/** Stars over the whole sky, twinkling; `bright`: how many of them show (0 to 1, the faint ones last). */
const Stars: React.FC<{ t: number; bright: number; top: number; bottom: number; count?: number }> = ({ t, bright, top, bottom, count = 240 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const order = chance(i, 7);
      const shown = interpolate(bright, [order * 0.8, order * 0.8 + 0.2], [0, 1], CLAMP);
      if (shown <= 0) return null;
      const r = 1.3 + 3.4 * chance(i, 2) ** 3;
      const twinkle = 0.7 + 0.3 * Math.sin(t * (1.5 + 2 * chance(i, 3)) + 6 * chance(i, 4));
      const cx = chance(i) * W;
      const cy = top + chance(i, 1) * (bottom - top);
      const big = chance(i, 6) > 0.93;
      return (
        <g key={i} opacity={shown * twinkle * (0.55 + 0.45 * chance(i, 5))}>
          {big ? <circle cx={cx} cy={cy} r={r * 4} fill="#cfdcff" opacity={0.18} /> : null}
          {big ? <path d={`M ${cx - r * 5} ${cy} L ${cx + r * 5} ${cy} M ${cx} ${cy - r * 5} L ${cx} ${cy + r * 5}`} stroke="#eef3ff" strokeWidth={1.2} opacity={0.5} /> : null}
          <circle cx={cx} cy={cy} r={r} fill="#f4f7ff" />
        </g>
      );
    })}
  </g>
);

/** The band of the galaxy across the sky, faint dust of stars along it. */
const MilkyWay: React.FC<{ id: string; t: number; shown: number; y: number }> = ({ id, t, shown, y }) => (
  <g opacity={shown} transform={`rotate(-28 540 ${y})`}>
    <defs>
      <radialGradient id={`${id}-band`}>
        <stop offset="0" stopColor="#d6e0ff" stopOpacity=".5" />
        <stop offset=".5" stopColor="#8fa2e0" stopOpacity=".2" />
        <stop offset="1" stopColor="#8fa2e0" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-soft`} x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
    </defs>
    <ellipse cx={540} cy={y} rx={900} ry={150} fill={`url(#${id}-band)`} filter={`url(#${id}-soft)`} />
    <ellipse cx={600} cy={y + 10} rx={520} ry={46} fill="#e8edff" opacity={0.08} filter={`url(#${id}-soft)`} />
    {Array.from({ length: 260 }, (_, i) => {
      const along = (chance(i, 11) - 0.5) * 1900;
      const across = (chance(i, 12) + chance(i, 13) + chance(i, 14) - 1.5) * 110;
      return <circle key={i} cx={540 + along} cy={y + across} r={0.6 + 1.2 * chance(i, 15)} fill="#f2f5ff" opacity={(0.25 + 0.5 * chance(i, 16)) * (0.75 + 0.25 * Math.sin(t * 2 + i))} />;
    })}
  </g>
);

// ---------------------------------------------------------------------------------------------- 1. the blackout

const CITY = Array.from({ length: 17 }, (_, i) => {
  const width = 54 + 70 * chance(i, 21);
  return { width, height: 90 + 200 * chance(i, 22) ** 1.3, gap: 4 + 10 * chance(i, 23) };
});

/** The city: towers along the horizon, their windows lit; `off(x, i)`: from 0 (lit) to 1 (dark) for a window. */
const City: React.FC<{ horizon: number; off: (x: number, i: number) => number }> = ({ horizon, off }) => {
  let x = -20;
  const windows: React.ReactNode[] = [];
  const towers: React.ReactNode[] = [];
  CITY.forEach((b, i) => {
    const top = horizon - b.height;
    towers.push(<rect key={`t${i}`} x={x} y={top} width={b.width} height={b.height + 60} fill={i % 2 ? "#070a14" : "#0a0e1b"} />);
    for (let wy = top + 18; wy < horizon - 14; wy += 26) {
      for (let wx = x + 9; wx < x + b.width - 14; wx += 19) {
        const k = windows.length;
        if (chance(k, 31) < 0.42) continue;
        const dark = off(wx, k);
        if (dark >= 1) continue;
        windows.push(<rect key={`w${k}`} x={wx} y={wy} width={9} height={13} fill={chance(k, 32) < 0.8 ? "#ffd38a" : "#bfe0ff"} opacity={(1 - dark) * (0.55 + 0.45 * chance(k, 33))} />);
      }
    }
    x += b.width + b.gap;
  });
  return (
    <g>
      {towers}
      {windows}
    </g>
  );
};

/** A desk and a laptop on the roof; `on`: its screen lit, 0 to 1. (x, y): the foot of the desk, on the floor. */
const Desk: React.FC<{ id: string; x: number; y: number; on: number; scale?: number }> = ({ id, x, y, on, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" stopColor="#dbe8ff" stopOpacity=".55" />
        <stop offset="1" stopColor="#dbe8ff" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx={-30} cy={-150} rx={210} ry={150} fill={`url(#${id}-glow)`} opacity={on} />
    <rect x={-110} y={-108} width={220} height={14} rx={4} fill={INK} />
    <rect x={-96} y={-94} width={12} height={94} fill={INK} />
    <rect x={84} y={-94} width={12} height={94} fill={INK} />
    {/* the laptop, its screen towards the figure on the left */}
    <path d="M -64 -108 L 40 -108 L 44 -114 L -60 -114 Z" fill={INK} />
    <path d="M -60 -114 L -82 -196 L -76 -198 L -54 -114 Z" fill={INK} />
    <path d="M -66 -118 L -84 -190 L -80 -192 L -62 -118 Z" fill="#cfe0ff" opacity={on * 0.9} />
  </g>
);

const BLACKOUT = ["lit", "dark", "up", "stars", "sky"];

const BlackoutPicture: Drawn = ({ t, show, since, horizon, cast }) => {
  const at = timeline(BLACKOUT, show, since);
  // the sound of the cut (`sfx` of the hook) at 0.75 s; the cover shows the city half gone out
  const cut = at.cover ? 1.78 : at("lit") + 0.75;
  const off = (x: number, i: number) => interpolate(t, [cut + (x / W) * 0.45 + 0.06 * chance(i, 34), cut + (x / W) * 0.45 + 0.06 * chance(i, 34) + 0.12], [0, 1], CLAMP);
  const dark = ramp(t, cut, cut + 0.7);
  const figure = cast === "figure";
  // looking up: the figure raises its head, then the camera follows it (A: the camera alone)
  const lookAt = at("up") + (figure ? 2.0 : 0.3);
  const tilt = ramp(t, lookAt, lookAt + 1.6) * (figure ? 170 : 420);
  const stars = Math.max(ramp(t, lookAt + 0.3, lookAt + 2.2) * 0.55, ramp(t, at("stars"), at("stars") + 2.2));
  const galaxy = ramp(t, at("stars") + 0.4, at("stars") + 3.2);
  const night = Math.max(stars, 0.35 * dark);           // the deep blue of a sky with no city light
  const floor = horizon + 70;
  const S = 1.35;
  const seat = floor - 96 * S;
  // the figure: at the desk; the cut makes it jump back; it slumps; it stands, walks to the edge, looks up; it sits
  let pose: Pose = POSES.desk;
  let px = 300;
  let py = seat;
  const lit = 1 - ramp(t, cut, cut + 0.12);
  if (figure) {
    const typing = 4 * Math.sin(t * 22) * (1 - dark);
    pose = { ...POSES.desk, armF: [POSES.desk.armF[0] + typing, POSES.desk.armF[1]], armB: [POSES.desk.armB[0] - typing, POSES.desk.armB[1]] };
    pose = mix(pose, POSES.jolt, ramp(t, cut, cut + 0.18) * (1 - ramp(t, cut + 0.5, cut + 1.1)));
    pose = mix(pose, POSES.slump, ramp(t, at("dark") - 0.2, at("dark") + 0.7));
    const rise = ramp(t, at("up"), at("up") + 0.5);
    pose = mix(pose, POSES.stand, rise);
    py = seat - (LEGS * S - 96 * S) * rise;
    const go = interpolate(t, [at("up") + 0.45, at("up") + 1.85], [0, 1], CLAMP);
    px = 300 + 300 * go;
    if (go > 0 && go < 1) pose = walk(go * 4 * Math.PI);
    pose = mix(pose, POSES.lookup, ramp(t, lookAt, lookAt + 0.8));
    const sit = ramp(t, at("sky"), at("sky") + 1.0);
    pose = mix(pose, POSES.gaze, sit);
    py = py + (LEGS * S - 10) * sit;
  }
  return (
    <>
      <defs>
        <linearGradient id="bo-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#01030b" />
          <stop offset=".6" stopColor="#060b1e" />
          <stop offset="1" stopColor="#0c1532" />
        </linearGradient>
        <linearGradient id="bo-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#040a22" />
          <stop offset=".55" stopColor="#0d1c48" />
          <stop offset="1" stopColor="#24386e" />
        </linearGradient>
        <linearGradient id="bo-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3a24" stopOpacity="0" />
          <stop offset=".55" stopColor="#8a5428" stopOpacity=".5" />
          <stop offset="1" stopColor="#e08a3e" stopOpacity=".95" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#bo-sky)" />
      <g transform={`translate(0 ${tilt})`}>
        <rect x={0} y={-600} width={W} height={horizon + 600} fill="url(#bo-night)" opacity={night} />
        {/* the sky the lights hide: stars, the galaxy (higher up, seen once the camera looks up) */}
        <Stars t={t} bright={stars} top={-460} bottom={horizon - 40} />
        <MilkyWay id="bo" t={t} shown={galaxy} y={260} />
        <rect x={0} y={horizon - 900} width={W} height={900} fill="url(#bo-haze)" opacity={1 - dark * 0.95} />
        <City horizon={horizon} off={off} />
        {/* the roof, its parapet at the far edge */}
        <rect x={0} y={horizon} width={W} height={H} fill={INK} />
        <rect x={0} y={horizon - 6} width={W} height={10} fill="#11162a" />
        <path d={`M 0 ${horizon + 4} L ${W} ${horizon + 4}`} stroke="#9fb6e6" strokeWidth={2} opacity={0.3 + 0.2 * (1 - dark)} />
        <Desk id="bo-desk" x={figure ? 470 : 760} y={floor} scale={S} on={1 - ramp(t, cut, cut + 0.1)} />
        {figure ? <Figure id="bo-fig" x={px} y={py} scale={S} pose={pose} rim="#9fb6e6" lit={lit} light="#dbe8ff"
          face={at.cover ? "worried" : t > at("sky") ? "calm" : t > lookAt + 0.6 ? "smile" : t > at("dark") ? "worried" : t > cut ? "shock" : "neutral"} /> : null}
      </g>
    </>
  );
};

// ---------------------------------------------------------------------------------------------- 2. the drought

/** A cloud: overlapping round puffs, lit from above. (x, y): its middle. */
const Cloud: React.FC<{ x: number; y: number; scale: number; tone?: string; top?: string }> = ({ x, y, scale, tone = "#3d4352", top = "#7c8496" }) => {
  const puffs = [[-150, 20, 70], [-80, -20, 95], [10, -45, 115], [110, -15, 90], [175, 25, 62], [-30, 30, 80], [70, 35, 75]];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {puffs.map(([px, py, r], i) => <circle key={`l${i}`} cx={px} cy={py - 6} r={r} fill={top} />)}
      {puffs.map(([px, py, r], i) => <circle key={`d${i}`} cx={px} cy={py + 4} r={r - 4} fill={tone} />)}
    </g>
  );
};

/** Cracked dry earth from the horizon down; `wet`: 0 dry, 1 soaked (the cracks close, the ground darkens). */
const Earth: React.FC<{ horizon: number; wet: number; green: number; t: number }> = ({ horizon, wet, green, t }) => {
  const cracks = Array.from({ length: 46 }, (_, i) => {
    const x0 = chance(i, 41) * W;
    const y0 = horizon + 30 + chance(i, 42) * 520;
    const depth = (y0 - horizon) / 560;
    const len = 50 + 120 * depth;
    let d = `M ${x0} ${y0}`;
    let x = x0;
    let y = y0;
    for (let k = 0; k < 4; k++) {
      x += (chance(i * 7 + k, 43) - 0.5) * len;
      y += (chance(i * 7 + k, 44) - 0.4) * len * 0.35;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return <path key={i} d={d} stroke="#140c07" strokeWidth={1.5 + 3 * depth} fill="none" strokeLinejoin="round" opacity={0.85 * (1 - wet * 0.85)} />;
  });
  const grass = Array.from({ length: 70 }, (_, i) => {
    const x = chance(i, 51) * W;
    const y = horizon + 20 + chance(i, 52) ** 1.4 * 540;
    const h = (14 + 26 * chance(i, 53)) * (0.5 + (y - horizon) / 560) * interpolate(green, [chance(i, 54) * 0.5, chance(i, 54) * 0.5 + 0.5], [0, 1], CLAMP);
    const sway = 3 * Math.sin(t * 2 + i);
    return <path key={i} d={`M ${x} ${y} q ${sway} ${-h / 2} ${sway * 2 + 4} ${-h}`} stroke="#4f8a3a" strokeWidth={3} fill="none" strokeLinecap="round" />;
  });
  return (
    <g>
      <defs>
        <linearGradient id="dr-earth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e4f36" />
          <stop offset=".25" stopColor="#4c3423" />
          <stop offset="1" stopColor="#1d130c" />
        </linearGradient>
      </defs>
      <rect x={0} y={horizon} width={W} height={H - horizon} fill="url(#dr-earth)" />
      <rect x={0} y={horizon} width={W} height={H - horizon} fill="#120c09" opacity={0.55 * wet} />
      {cracks}
      {grass}
    </g>
  );
};

/** The seed in its little mound, and what grows from it (`grow`: 0 nothing, 1 a sprout, 2 a plant). */
const Sprout: React.FC<{ x: number; y: number; grow: number; t: number }> = ({ x, y, grow, t }) => {
  const stem = Math.min(1, grow) * 70 + Math.max(0, grow - 1) * 70;
  const sway = 2 * Math.sin(t * 1.8);
  const leaf = (k: number, side: number, h: number) => (
    <path key={`${k}${side}`} d={`M 0 ${-h} q ${side * 26} ${-14} ${side * 42} ${-4} q ${-side * 18} ${12} ${-side * 42} ${4} Z`} fill="#5fa046" opacity={interpolate(grow, [k * 0.5, k * 0.5 + 0.4], [0, 1], CLAMP)} />
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={6} rx={46} ry={12} fill="#2a1c12" />
      <ellipse cx={0} cy={0} rx={12} ry={7} fill="#c49a5c" opacity={1 - Math.min(1, grow * 2)} />
      <g transform={`rotate(${sway})`}>
        {stem > 0 ? <path d={`M 0 0 L 0 ${-stem}`} stroke="#5fa046" strokeWidth={5} strokeLinecap="round" /> : null}
        {leaf(1, 1, stem * 0.55)}
        {leaf(1.2, -1, stem * 0.75)}
        {leaf(2, 1, stem * 0.95)}
        {leaf(2.4, -1, stem)}
      </g>
    </g>
  );
};

const DROUGHT = ["wait", "pass", "again", "gave", "rain", "green"];

const DroughtPicture: Drawn = ({ t, show, since, horizon, cast }) => {
  const at = timeline(DROUGHT, show, since);
  const figure = cast === "figure";
  const thunder = at("gave") + 2.0;                      // the sound of the thunder (`sfx` of `gave`) at 2.0 s
  const gather = ramp(t, at("gave") + 0.4, thunder);
  const rain = ramp(t, at("rain") - 0.6, at("rain") + 0.8) * (1 - ramp(t, at("green") + 1.5, at("green") + 4));
  const wet = ramp(t, at("rain"), at("rain") + 6);
  const green = ramp(t, at("green"), at("green") + 4);
  const grow = ramp(t, at("rain") + 4, at("rain") + 10) + green;
  const flash = interpolate(t, [thunder, thunder + 0.05, thunder + 0.22], [0, 0.45, 0], CLAMP);
  const crossing = (start: number) => interpolate(t, [start - 0.2, start + 2.6], [-420, W + 420], CLAMP);
  const c1 = crossing(at("pass"));
  const c2 = crossing(at("again"));
  const seed = { x: 610, y: horizon + 150 };
  // the figure kneels by the seed; looks up each time a cloud comes, down when it goes; sits and hides its head; the
  // thunder lifts its head; it stands in the rain, arms open; then looks at what grew
  let pose: Pose = POSES.crouch;
  let py = horizon + 160 - 70 * 1.3;
  if (figure) {
    const looks = (start: number) => ramp(t, start, start + 0.7) * (1 - ramp(t, start + 1.9, start + 2.5));
    pose = mix(pose, POSES.hope, Math.max(looks(at("pass")), looks(at("again"))));
    const sink = ramp(t, at("gave") - 0.1, at("gave") + 0.9);
    pose = mix(pose, POSES.hug, sink);
    py = py + 70 * sink;
    pose = mix(pose, { ...POSES.hug, head: 20, torso: 6 }, ramp(t, thunder, thunder + 0.4));
    const up = ramp(t, at("rain") + 0.4, at("rain") + 1.4);
    pose = mix(pose, POSES.joy, up);
    py = py - (70 + LEGS * 1.3 - 70 * 1.3 - 4) * up;
    pose = mix(pose, { ...POSES.stand, head: -22, torso: 10 }, green);
  }
  const sky = 1 - gather * 0.75;
  return (
    <>
      <defs>
        <linearGradient id="dr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1226" />
          <stop offset=".55" stopColor="#4a3340" />
          <stop offset="1" stopColor="#d58a4a" />
        </linearGradient>
        <linearGradient id="dr-storm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0d16" />
          <stop offset="1" stopColor="#3a4250" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={horizon + 4} fill="url(#dr-sky)" opacity={sky} />
      <rect x={0} y={0} width={W} height={horizon + 4} fill="url(#dr-storm)" opacity={1 - sky + green * 0.0} />
      <circle cx={820} cy={horizon - 90} r={70} fill="#ffcf8a" opacity={0.75 * (1 - gather)} />
      {/* the two clouds that pass by, and the shadow each drags over the earth */}
      <Cloud x={c1} y={790} scale={1.1} />
      <Cloud x={c2} y={730} scale={0.95} />
      {/* the storm that comes at last */}
      <g opacity={gather * (1 - green * 0.6)}>
        <Cloud x={interpolate(gather, [0, 1], [-300, 180])} y={700} scale={1.6} tone="#232835" top="#4a5164" />
        <Cloud x={interpolate(gather, [0, 1], [1380, 860])} y={760} scale={1.5} tone="#232835" top="#4a5164" />
        <Cloud x={540} y={interpolate(gather, [0, 1], [380, 640])} scale={1.8} tone="#1b1f2a" top="#3c4356" />
      </g>
      <Earth horizon={horizon} wet={wet} green={green} t={t} />
      <ellipse cx={c1} cy={horizon + 230} rx={300} ry={40} fill="#000" opacity={0.25} />
      <ellipse cx={c2} cy={horizon + 200} rx={260} ry={34} fill="#000" opacity={0.22} />
      <g transform={`translate(${seed.x} ${seed.y}) scale(1.9) translate(${-seed.x} ${-seed.y})`}>
        <Sprout x={seed.x} y={seed.y} grow={grow} t={t} />
      </g>
      {figure ? <Figure id="dr-fig" x={440} y={py} scale={1.3} pose={pose} rim={gather > 0.5 ? "#9fb6e6" : "#ffc98a"} /> : null}
      <g opacity={rain}>
        <Rain t={t} />
      </g>
      <rect x={0} y={0} width={W} height={H} fill="#eef3ff" opacity={flash} />
    </>
  );
};

// ---------------------------------------------------------------------------------------------- 3. the scroll

const FEED = Array.from({ length: 24 }, (_, i) => ({
  tall: chance(i, 61) < 0.55 ? 320 : 150,
  hue: ["#3b4a6b", "#5b3b4a", "#2f5a55", "#6b5a35", "#46365e", "#2c4566"][i % 6],
  lines: 1 + Math.floor(chance(i, 62) * 3),
}));
const FEED_LOOP = FEED.reduce((s, c) => s + c.tall + 110, 0);

/** The screen of a phone: the feed going up, its clock and its battery. (x, y): its top left; `scroll`: pixels
 * scrolled; `minutes` since 21:04; `battery` in percent; `on`: 1 lit, 0 black. */
const Phone: React.FC<{ x: number; y: number; w: number; h: number; scroll: number; minutes: number; battery: number; on: number }> = ({ x, y, w, h, scroll, minutes, battery, on }) => {
  const clock = 21 * 60 + 4 + Math.floor(minutes);
  const hh = String(Math.floor(clock / 60) % 24).padStart(2, "0");
  const mm = String(clock % 60).padStart(2, "0");
  let cy = y + 96 - (scroll % FEED_LOOP);
  const cards: React.ReactNode[] = [];
  for (let k = 0; k < FEED.length * 2; k++) {
    const c = FEED[k % FEED.length];
    if (cy + c.tall + 110 > y + 60 && cy < y + h) {
      cards.push(
        <g key={k}>
          <circle cx={x + 64} cy={cy + 26} r={20} fill="#56607a" />
          <rect x={x + 96} y={cy + 14} width={170} height={12} rx={6} fill="#8a93a8" />
          <rect x={x + 40} y={cy + 60} width={w - 80} height={c.tall} rx={18} fill={c.hue} />
          {Array.from({ length: c.lines }, (_, j) => <rect key={j} x={x + 40} y={cy + 76 + c.tall + j * 22} width={(w - 80) * (0.9 - 0.25 * j)} height={11} rx={5} fill="#5d6680" />)}
        </g>,
      );
    }
    cy += c.tall + 110 + c.lines * 22;
  }
  return (
    <g>
      <defs>
        <clipPath id="ph-screen">
          <rect x={x} y={y} width={w} height={h} rx={56} />
        </clipPath>
        <linearGradient id="ph-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".07" />
          <stop offset=".5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={x - 18} y={y - 18} width={w + 36} height={h + 36} rx={72} fill="#0b0d14" stroke="#2a3040" strokeWidth={3} />
      <g clipPath="url(#ph-screen)">
        <rect x={x} y={y} width={w} height={h} fill="#141925" />
        <g opacity={on}>
          {cards}
          <rect x={x} y={y} width={w} height={70} fill="#141925" />
          <text x={x + 52} y={y + 50} fontFamily={FONT.latin} fontWeight={600} fontSize={30} fill="#e9edf6">{`${hh}:${mm}`}</text>
          <rect x={x + w - 110} y={y + 28} width={56} height={26} rx={6} fill="none" stroke="#e9edf6" strokeWidth={2.5} />
          <rect x={x + w - 106} y={y + 32} width={48 * Math.max(0.03, battery / 100)} height={18} rx={3} fill={battery < 15 ? "#ff5a4a" : "#e9edf6"} />
          <text x={x + w - 122} y={y + 50} textAnchor="end" fontFamily={FONT.latin} fontSize={24} fill={battery < 15 ? "#ff8a7a" : "#c9d0de"}>{`${Math.round(battery)}%`}</text>
        </g>
        <rect x={x} y={y} width={w} height={h} fill="url(#ph-glass)" />
        <rect x={x} y={y} width={w} height={h} fill="#000" opacity={(1 - on) * 0.85} />
      </g>
    </g>
  );
};

/** An hourglass, the sand running from the top to the bottom (`run`: 0 full above, 1 all below). (x, y): its middle. */
const Hourglass: React.FC<{ x: number; y: number; scale: number; run: number; t: number }> = ({ x, y, scale, run, t }) => {
  const top = 1 - run;
  const glass = "M -150 -250 C -150 -110 -22 -50 -16 0 C -22 50 -150 110 -150 250 L 150 250 C 150 110 22 50 16 0 C 22 -50 150 -110 150 -250 Z";
  const sandTop = 210 * top;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <clipPath id="hg-in">
          <path d={glass} />
        </clipPath>
        <radialGradient id="hg-glow">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity=".28" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={0} cy={0} r={420} fill="url(#hg-glow)" />
      <g clipPath="url(#hg-in)">
        {/* the sand left above: a heap that sinks in its middle */}
        <path d={`M -160 ${-10 - sandTop} Q 0 ${-10 - sandTop + 40 * top} 160 ${-10 - sandTop} L 160 0 L -160 0 Z`} fill="#e3b36a" />
        {/* the heap below */}
        <path d={`M -160 250 L -160 ${250 - 30 * run} Q 0 ${250 - 230 * run} 160 ${250 - 30 * run} L 160 250 Z`} fill="#d9a65c" />
        {run < 1 ? <rect x={-3} y={-4} width={6} height={254 - 200 * run} fill="#e3b36a" opacity={0.9 + 0.1 * Math.sin(t * 30)} /> : null}
      </g>
      <path d={glass} fill="#cfe0ff" fillOpacity={0.06} stroke="#cfe0ff" strokeOpacity={0.55} strokeWidth={5} />
      <rect x={-190} y={-282} width={380} height={34} rx={10} fill={INK} stroke="#ffd9a0" strokeOpacity={0.5} strokeWidth={3} />
      <rect x={-190} y={248} width={380} height={34} rx={10} fill={INK} stroke="#ffd9a0" strokeOpacity={0.5} strokeWidth={3} />
      <rect x={-172} y={-252} width={12} height={502} fill={INK} />
      <rect x={160} y={-252} width={12} height={502} fill={INK} />
    </g>
  );
};

/** A clock on the wall, its hands turning `minutes` minutes past nine. */
const WallClock: React.FC<{ x: number; y: number; r: number; minutes: number }> = ({ x, y, r, minutes }) => {
  const m = (minutes % 60) * 6;
  const h = ((21 * 60 + minutes) / 60) * 30;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#10141f" stroke="#9fb6e6" strokeOpacity={0.6} strokeWidth={5} />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={-2} y={-r + 8} width={4} height={12} fill="#9fb6e6" opacity={0.6} transform={`rotate(${i * 30})`} />)}
      <rect x={-4} y={-r * 0.5} width={8} height={r * 0.5} rx={4} fill="#e9edf6" transform={`rotate(${h})`} />
      <rect x={-3} y={-r * 0.78} width={6} height={r * 0.78} rx={3} fill="#e9edf6" transform={`rotate(${m})`} />
      <circle r={7} fill="#e9edf6" />
    </g>
  );
};

const SCROLL = ["feed", "clock", "still", "gone", "sand"];

/** The small phone in the figure's hands, its screen flickering as it scrolls. */
const HeldPhone: React.FC<{ on: number; t: number }> = ({ on, t }) => (
  <g transform="rotate(-30)">
    <rect x={-20} y={-34} width={40} height={68} rx={8} fill="#0b0d14" />
    <rect x={-16} y={-30} width={32} height={60} rx={6} fill="#dbe8ff" opacity={on * (0.8 + 0.2 * Math.sin(t * 13))} />
  </g>
);

const ScrollPicture: Drawn = ({ t, show, since, horizon, cast }) => {
  const at = timeline(SCROLL, show, since);
  const figure = cast === "figure";
  // time runs: a minute a second at first, then forty; the battery goes with it
  const minutes = interpolate(t, [at("feed"), at("clock"), at("clock") + 2.2, at("gone")], [0, 3, 160, 330], CLAMP);
  const battery = interpolate(minutes, [0, 330], [76, 1], CLAMP);
  const dead = at("gone") + 0.2;                         // the sound of the screen locking (`sfx` of `gone`)
  const on = 1 - ramp(t, dead, dead + 0.15);
  const scroll = interpolate(t, [at("feed"), at("clock"), at("gone")], [0, 2600, 16000], CLAMP);
  const sand = ramp(t, at("sand") - 0.6, at("sand") + 0.6);
  const run = interpolate(t, [at("sand"), at("sand") + 34], [0.05, 0.95], CLAMP);
  // the sky in the window: night, day, night again… one day every 165 minutes of the clock, faster and faster
  const day = 0.5 - 0.5 * Math.cos((minutes / 330) * Math.PI * 4);
  const dawn = Math.max(0, 0.6 - Math.abs(day - 0.5) * 2);
  const arc = (minutes / 82.5) % 1;
  const room = 1 - sand;
  const win = { x: 250, y: 560, w: 580, h: 520 };
  // the figure on the sofa, bent over its phone; when the phone dies it raises its head to the window
  const pose = mix(POSES.hunch, POSES.raise, ramp(t, dead + 0.3, dead + 1.1));
  const S = 1.3;
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill="#070a12" />
      {figure ? (
        <g opacity={room}>
          {/* the room: a big window on the sky, a clock on the wall, a sofa; the figure against the window */}
          <rect x={0} y={0} width={W} height={horizon} fill="#121a2c" />
          <defs>
            <clipPath id="sc-win">
              <rect x={win.x} y={win.y} width={win.w} height={win.h} />
            </clipPath>
          </defs>
          <g clipPath="url(#sc-win)">
          <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={`rgb(${12 + 110 * day},${22 + 150 * day},${48 + 180 * day})`} />
          <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="#f0a868" opacity={dawn * 0.7} />
          <circle cx={win.x + win.w * arc} cy={win.y + win.h * 0.55 - win.h * 0.4 * Math.sin(arc * Math.PI)} r={34} fill={day > 0.5 ? "#fff3c9" : "#e8eefc"} />
          <Stars t={t} bright={1 - day * 1.6} top={win.y} bottom={win.y + win.h * 0.5} count={40} />
          </g>
          <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="none" stroke={INK} strokeWidth={26} />
          <path d={`M ${win.x + win.w / 2} ${win.y} L ${win.x + win.w / 2} ${win.y + win.h} M ${win.x} ${win.y + win.h * 0.52} L ${win.x + win.w} ${win.y + win.h * 0.52}`} stroke={INK} strokeWidth={14} />
          <WallClock x={150} y={700} r={78} minutes={minutes} />
          <rect x={0} y={horizon} width={W} height={H} fill="#05070d" />
          {/* the sofa, its back against the window's sill */}
          <rect x={170} y={horizon - 250} width={740} height={150} rx={40} fill="#0d111d" />
          <rect x={150} y={horizon - 120} width={780} height={130} rx={34} fill="#0e1220" />
          <rect x={120} y={horizon - 190} width={90} height={200} rx={36} fill="#0e1220" />
          <rect x={870} y={horizon - 190} width={90} height={200} rx={36} fill="#0e1220" />
          <Figure id="sc-fig" x={470} y={horizon - 120} scale={S} pose={pose} rim="#9fb6e6" lit={on} light="#cfe0ff" held={<HeldPhone on={on} t={t} />}
            face={t > dead + 1.6 ? "worried" : t > dead + 0.2 ? "shock" : "neutral"} />
        </g>
      ) : (
        <g opacity={room}>
          <Phone x={150} y={560} w={780} h={960} scroll={scroll} minutes={minutes} battery={battery} on={on} />
        </g>
      )}
      <g opacity={sand}>
        <Hourglass x={540} y={1060} scale={1.0} run={run} t={t} />
      </g>
    </>
  );
};

export const LENS_PICTURES: Record<string, Drawn> = { blackout: BlackoutPicture, drought: DroughtPicture, scroll: ScrollPicture };
