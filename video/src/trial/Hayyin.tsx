// « وتحسبونه هيّنًا » (content/trial/hayyin.yaml: ghiba, namima, riya; docs/themes.md). Each short opens on an everyday
// scene played by anonymous figures with no face (the owner's rule since 2026-11-15; the figure of « بص تاني », Lens.tsx):
// a typical scene, never a true story. Nothing of the unseen is drawn: no good deeds passing from one person to
// another, no scales, nothing inside the graves of Bukhari 216, nobody of the hadith (only the place: palms, two graves).
// The Prophet ﷺ is never drawn. The rock of 2:264 is a thing of the earth: a smooth stone, its dust, the rain.
import React from "react";
import { Easing, interpolate } from "remotion";
import { FONT } from "../fonts";
import { Rain } from "./Ayah";
import { Figure, LEGS, POSES, mix, walk, type Pose } from "./Lens";
import type { Drawn } from "./Trial";

const W = 1080;
const H = 1920;
const INK = "#05060d";
const RIM = "#9fb6e6";
const LAMP = "#ffd9a0";
const GOLD = "#f0c46a";
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
/** 0 before `a`, 1 after `b`, eased between. */
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...CLAMP, easing: ease });
/** A number between 0 and 1 from an index: the same at every frame. */
const chance = (i: number, salt = 0) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** When each scene starts (as in Lens.tsx): in the video, when its segment starts; on a cover, two seconds into the
 * cover's own scene, the others long over or far away. */
const timeline = (order: string[], show: (id: string) => number, since: (id: string) => number) => {
  const cover = since(order[0]) === since(order[order.length - 1]) ? order.find((id) => show(id) === 1) : undefined;
  const at = (id: string) => (cover === undefined ? since(id) : (order.indexOf(id) - order.indexOf(cover)) * 100);
  return Object.assign(at, { cover: cover !== undefined });
};

const SEATED: Record<string, Pose> = {
  // seated, leaning in over the table, the forearm raised: the one who speaks
  speak: { torso: 22, head: -6, armF: [74, -58], armB: [52, 30], legF: [88, -88], legB: [84, -84] },
  // seated, leaning in to listen, the forearms on the table
  listen: { torso: 26, head: -12, armF: [66, 26], armB: [58, 30], legF: [88, -88], legB: [84, -84] },
  // seated, leaning back, a cup in the hand
  sip: { torso: -6, head: 4, armF: [40, 92], armB: [20, 10], legF: [88, -88], legB: [84, -84] },
};
const STANDING: Record<string, Pose> = {
  // standing, one hand held out to shake another
  offer: { torso: 4, head: -4, armF: [66, 10], armB: [-8, 4], legF: [5, -3], legB: [-5, -2] },
  // standing, the front arm raised with a phone (held), the back arm stretched to the slot of a box, the head up to the phone
  film: { torso: 6, head: 14, armF: [150, 10], armB: [100, 0], legF: [5, -3], legB: [-5, -2] },
  // standing, the front arm stretched to the slot of a box, the head bowed
  give: { torso: 8, head: -24, armF: [100, 0], armB: [-6, 4], legF: [5, -3], legB: [-5, -2] },
};

// ----------------------------------------------------------------------------------------------------- pieces

/** Stars, twinkling, between `top` and `bottom`. */
const Stars: React.FC<{ t: number; bright: number; top: number; bottom: number; left?: number; right?: number; count?: number }> = ({ t, bright, top, bottom, left = 0, right = W, count = 90 }) => (
  <g opacity={bright}>
    {Array.from({ length: count }, (_, i) => {
      const x = left + chance(i, 1) * (right - left);
      const y = top + chance(i, 2) * (bottom - top);
      const r = 1 + 2.2 * chance(i, 3) ** 3;
      const tw = 0.55 + 0.45 * Math.sin(t * (1 + 2 * chance(i, 4)) + 6 * chance(i, 5));
      return <circle key={i} cx={x} cy={y} r={r} fill="#e8eefc" opacity={tw} />;
    })}
  </g>
);

/** A café chair seen from the side, its back on the side opposite to `facing`. (x, seat): the middle of the seat. */
const Chair: React.FC<{ x: number; seat: number; floor: number; facing: number; lit?: number; s?: number }> = ({ x, seat, floor, facing, lit = 0, s = 1 }) => {
  const back = -facing * 58;
  const leg = (floor - seat) / s;
  return (
    <g transform={`translate(${x} ${seat}) scale(${s})`}>
      <path d="M -62 0 L 62 0" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d={`M -52 0 L -60 ${leg} M 52 0 L 60 ${leg} M ${back} 0 L ${back - facing * 14} -210`} stroke={INK} strokeWidth={12} strokeLinecap="round" />
      <path d={`M ${back - facing * 6} -120 L ${back - facing * 12} -196`} stroke={INK} strokeWidth={30} strokeLinecap="round" />
      {lit > 0 ? (
        <path d={`M -62 -8 L 62 -8 M ${back - facing * 14} -210 L ${back} 0`} stroke={LAMP} strokeWidth={4 / s} opacity={0.8 * lit} fill="none" strokeLinecap="round" />
      ) : null}
    </g>
  );
};

/** A small cup on a saucer, its steam rising. (x, y): its foot on the table. */
const Cup: React.FC<{ x: number; y: number; t: number; steam?: number; i?: number }> = ({ x, y, t, steam = 1, i = 0 }) => (
  <g>
    <path d={`M ${x - 26} ${y} L ${x + 26} ${y}`} stroke={RIM} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
    <path d={`M ${x - 16} ${y - 4} L ${x - 13} ${y - 34} L ${x + 13} ${y - 34} L ${x + 16} ${y - 4} Z`} fill="#e9dcc0" opacity={0.85} />
    <path d={`M ${x + 14} ${y - 28} q 14 4 2 16`} stroke="#e9dcc0" strokeWidth={4} fill="none" opacity={0.85} />
    {[0, 1].map((k) => {
      const p = (t * 0.35 + k * 0.5 + 0.3 * i) % 1;
      return <path key={k} d={`M ${x - 4 + 8 * k} ${y - 40 - 70 * p} q 10 -14 0 -28 q -10 -14 0 -28`} stroke="#e9dcc0" strokeWidth={3} fill="none" opacity={steam * 0.35 * Math.sin(Math.PI * p)} />;
    })}
  </g>
);

/** A pendant lamp hanging from the top and its cone of warm light down to `to`. */
const Pendant: React.FC<{ id: string; x: number; top: number; y: number; to: number; spread: number; on: number; t: number }> = ({ id, x, top, y, to, spread, on, t }) => {
  const flicker = 0.94 + 0.06 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LAMP} stopOpacity=".42" />
          <stop offset="1" stopColor={LAMP} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-bulb`}>
          <stop offset="0" stopColor="#fff3d6" stopOpacity="1" />
          <stop offset="1" stopColor={LAMP} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={`M ${x - 40} ${y + 30} L ${x + 40} ${y + 30} L ${x + spread} ${to} L ${x - spread} ${to} Z`} fill={`url(#${id}-cone)`} opacity={on * flicker} />
      <path d={`M ${x} ${top} L ${x} ${y - 30}`} stroke={INK} strokeWidth={4} />
      <path d={`M ${x - 52} ${y + 28} Q ${x} ${y - 52} ${x + 52} ${y + 28} Z`} fill={INK} stroke={LAMP} strokeWidth={2} strokeOpacity={0.5} />
      <circle cx={x} cy={y + 34} r={46} fill={`url(#${id}-bulb)`} opacity={on * flicker} />
    </g>
  );
};

/** A jacket hung over the back of a chair: a panel falls on each side of the back, a sleeve hangs on the seat's side;
 * dark cloth, its edges in the lamp's light. (x, y): the top of the back; `facing` -1 when the seat is on the left. */
const Jacket: React.FC<{ x: number; y: number; facing: number; shown: number; s?: number }> = ({ x, y, facing, shown, s = 1 }) => (
  <g opacity={shown} transform={`translate(${x} ${y}) scale(${-facing * s} ${s})`}>
    {/* the panel behind the back */}
    <path d="M 4 -2 C 14 -2 22 6 26 20 L 34 150 C 26 158 12 160 4 156 Z" fill="#0f1422" stroke={LAMP} strokeWidth={2} strokeOpacity={0.35} />
    {/* the panel on the seat's side, its lapel */}
    <path d="M -2 -4 C -16 -4 -26 8 -30 24 L -46 138 C -34 150 -16 152 -4 146 L -2 40 Z" fill="#161c30" stroke={LAMP} strokeWidth={3} strokeOpacity={0.6} />
    <path d="M -6 2 L -22 60" stroke={LAMP} strokeWidth={2.5} opacity={0.45} />
    {/* the sleeve that hangs */}
    <path d="M -30 34 C -44 70 -50 110 -44 172" stroke="#161c30" strokeWidth={18} fill="none" strokeLinecap="round" />
    <path d="M -38 40 C -50 76 -56 114 -52 172" stroke={LAMP} strokeWidth={2} fill="none" opacity={0.35} />
    {/* the collar over the top of the back */}
    <path d="M -14 -2 Q 0 -16 14 -2" stroke="#161c30" strokeWidth={10} fill="none" strokeLinecap="round" />
  </g>
);

// --------------------------------------------------------------------------------------- 1. الغيبة, the café

/** The café in the evening: a dark wall, a window on the street, a round table under a pendant lamp; three figures
 * lean in over the table, one of them speaks; the fourth chair is empty, in its own light. `people` 0 to 1: how much
 * of the three figures shows (they fade out in `alone`). */
const Cafe: React.FC<{ t: number; horizon: number; people: number; jacket: number; spot: number; talk: number }> = ({ t, horizon, people, jacket, spot, talk }) => {
  const S = 1.5;
  const floor = horizon + 200;
  const seat = floor - 92 * S;
  const top = floor - 128 * S;
  const tableX = 470;
  const chairX = 935;
  const nod = Math.sin(t * 2.2);
  const gesture = talk * (14 * Math.sin(t * 3.4) + 6 * Math.sin(t * 5.1));
  const speak: Pose = { ...SEATED.speak, armF: [SEATED.speak.armF[0] + gesture, SEATED.speak.armF[1] - gesture * 0.6], head: SEATED.speak.head + 3 * nod * talk };
  const lean = (k: number): Pose => ({ ...SEATED.listen, torso: SEATED.listen.torso + 3 * Math.sin(t * 1.3 + k) * talk, head: SEATED.listen.head + 2 * Math.sin(t * 1.7 + k) });
  return (
    <g>
      <defs>
        <linearGradient id="hy-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c0a10" />
          <stop offset="1" stopColor="#2a1d16" />
        </linearGradient>
        <radialGradient id="hy-spot">
          <stop offset="0" stopColor={LAMP} stopOpacity=".45" />
          <stop offset="1" stopColor={LAMP} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={floor} fill="url(#hy-wall)" />
      {/* the window on the street, at night: the houses across */}
      <g>
        <rect x={40} y={horizon - 470} width={300} height={330} fill="#0b1226" />
        <Stars t={t} bright={0.8} top={horizon - 460} bottom={horizon - 320} left={50} right={330} count={16} />
        <path d={`M 40 ${horizon - 140} L 40 ${horizon - 230} L 130 ${horizon - 230} L 130 ${horizon - 270} L 240 ${horizon - 270} L 240 ${horizon - 210} L 340 ${horizon - 210} L 340 ${horizon - 140} Z`} fill="#070a14" />
        {[0, 1, 2].map((k) => <rect key={k} x={80 + 95 * k} y={horizon - 196 + 14 * (k % 2)} width={20} height={26} fill={LAMP} opacity={0.5 + 0.2 * chance(k, 3)} />)}
        <rect x={40} y={horizon - 470} width={300} height={330} fill="none" stroke={INK} strokeWidth={20} />
        <path d={`M 190 ${horizon - 470} L 190 ${horizon - 140}`} stroke={INK} strokeWidth={10} />
      </g>
      {/* a shelf of cups on the wall */}
      <path d={`M 560 ${horizon - 380} L 780 ${horizon - 380}`} stroke={INK} strokeWidth={14} />
      {[0, 1, 2, 3].map((k) => <path key={k} d={`M ${578 + 52 * k} ${horizon - 387} l 4 -32 l 28 0 l 4 32 Z`} fill="#1a1f30" stroke={RIM} strokeWidth={1.5} strokeOpacity={0.3} />)}
      <rect x={0} y={floor} width={W} height={H - floor} fill="#07060a" />
      <path d={`M 0 ${floor} L ${W} ${floor}`} stroke={LAMP} strokeWidth={2} opacity={0.18} />
      <Pendant id="hy-p1" x={tableX} top={0} y={horizon - 400} to={floor + 40} spread={330} on={0.85} t={t} />
      <Pendant id="hy-p3" x={chairX} top={0} y={horizon - 470} to={floor + 30} spread={190} on={0.35 + 0.65 * spot} t={t + 1.3} />
      {/* the two who listen, behind the table */}
      <g opacity={people}>
        <Figure id="hy-c2" x={480} y={seat} scale={S} pose={lean(1)} facing={-1} rim={LAMP} lit={0.25} light={LAMP} />
        <Figure id="hy-c3" x={690} y={seat} scale={S} pose={lean(2)} facing={-1} rim={LAMP} lit={0.2} light={LAMP} />
      </g>
      {/* the round table: its top, its cloth, its foot */}
      <path d={`M ${tableX - 250} ${top} L ${tableX + 250} ${top} L ${tableX + 232} ${top + 76} L ${tableX - 232} ${top + 76} Z`} fill="#0a0b12" />
      <ellipse cx={tableX} cy={top} rx={252} ry={24} fill="#141726" stroke={LAMP} strokeWidth={2} strokeOpacity={0.45} />
      <rect x={tableX - 13} y={top + 76} width={26} height={floor - top - 80} fill={INK} />
      <ellipse cx={tableX} cy={floor - 4} rx={96} ry={10} fill={INK} />
      {/* the one who speaks, in front on the left */}
      <g opacity={people}>
        <Chair x={110} seat={seat} floor={floor} facing={1} s={1.2} />
        <Figure id="hy-c1" x={110} y={seat} scale={S} pose={speak} facing={1} rim={LAMP} lit={0.35} light={LAMP} />
      </g>
      {/* the empty chair, on the right, in its own light */}
      <ellipse cx={chairX} cy={floor - 8} rx={190} ry={38} fill="url(#hy-spot)" opacity={spot} />
      <Chair x={chairX} seat={seat} floor={floor} facing={-1} lit={spot} s={1.25} />
      <Jacket x={chairX + 72 * 1.25} y={seat - 210 * 1.25} facing={-1} shown={jacket} s={1.25} />
      {/* the cups: one at each place, the empty place's too */}
      {[290, 410, 560, 690].map((x, k) => <Cup key={k} x={x} y={top - 6} t={t} i={k} steam={k === 3 ? 1 : 0.7} />)}
    </g>
  );
};

/** The empty chair, close: the edge of the table on the left, the cup at its place, the lamp right above it; `things`:
 * his jacket on the back of the chair, his keys at his place (he stepped out, he is coming back). */
const ChairClose: React.FC<{ t: number; horizon: number; things: number; others: number }> = ({ t, horizon, things, others }) => {
  const floor = horizon + 230;
  const s = 2;
  const seat = floor - 92 * 1.2 * s;
  const top = floor - 128 * 1.2 * s;
  const cx = 700;
  return (
    <g>
      <defs>
        <linearGradient id="hy-wall2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b090e" />
          <stop offset="1" stopColor="#24180f" />
        </linearGradient>
        <radialGradient id="hy-pool">
          <stop offset="0" stopColor={LAMP} stopOpacity=".42" />
          <stop offset="1" stopColor={LAMP} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={floor} fill="url(#hy-wall2)" />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#07060a" />
      <Pendant id="hy-p2" x={cx} top={0} y={horizon - 560} to={floor + 60} spread={380} on={0.95} t={t} />
      <ellipse cx={cx} cy={floor} rx={320} ry={64} fill="url(#hy-pool)" />
      {/* the others, dark at the edge of the light, on the left */}
      <g opacity={0.7 * others}>
        <Figure id="hy-o1" x={-10} y={seat + 30} scale={2.1} pose={SEATED.listen} facing={1} rim="#4a3a40" />
      </g>
      {/* the edge of the table, his cup, his keys */}
      <path d={`M 0 ${top} L 420 ${top} L 400 ${top + 110} L 0 ${top + 110} Z`} fill="#0a0b12" />
      <path d={`M 0 ${top} L 422 ${top}`} stroke={LAMP} strokeWidth={4} opacity={0.5} />
      <g transform={`translate(330 ${top - 6}) scale(1.8) translate(-330 ${-(top - 6)})`}>
        <Cup x={330} y={top - 6} t={t} i={5} />
      </g>
      <g opacity={things}>
        <rect x={150} y={top - 14} width={110} height={12} rx={4} fill="#1a2034" stroke={RIM} strokeWidth={1.5} strokeOpacity={0.5} />
        <circle cx={110} cy={top - 12} r={10} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.85} />
        <path d={`M 110 ${top - 12} l -26 4`} stroke={GOLD} strokeWidth={4} opacity={0.85} />
      </g>
      <Chair x={cx} seat={seat} floor={floor} facing={-1} lit={1} s={s} />
      <Jacket x={cx + 72 * s} y={seat - 210 * s} facing={-1} shown={things} s={s} />
    </g>
  );
};

/** The café seen from across the street at night: its lit window, small figures inside, the empty chair. */
const CafeOutside: React.FC<{ t: number; horizon: number }> = ({ t, horizon }) => {
  const street = horizon + 120;
  return (
    <g>
      <defs>
        <linearGradient id="hy-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04060f" />
          <stop offset="1" stopColor="#141a36" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={street} fill="url(#hy-night)" />
      <Stars t={t} bright={0.9} top={40} bottom={horizon - 560} count={120} />
      {/* the building and its lit window */}
      <path d={`M 120 ${street} L 120 ${horizon - 470} L 960 ${horizon - 470} L 960 ${street} Z`} fill="#070912" />
      <rect x={210} y={horizon - 330} width={660} height={350} fill="#3a2614" />
      <rect x={210} y={horizon - 330} width={660} height={350} fill={LAMP} opacity={0.22 + 0.03 * Math.sin(t * 2)} />
      <g transform={`translate(540 ${horizon + 20}) scale(0.42) translate(-540 ${-(horizon + 160)})`}>
        <Figure id="hy-w1" x={330} y={horizon + 160 - 92 * 1.2} scale={1.2} pose={SEATED.speak} facing={1} rim={LAMP} />
        <Figure id="hy-w2" x={560} y={horizon + 160 - 92 * 1.2} scale={1.2} pose={SEATED.listen} facing={-1} rim={LAMP} />
        <Figure id="hy-w3" x={720} y={horizon + 160 - 92 * 1.2} scale={1.2} pose={SEATED.listen} facing={-1} rim={LAMP} />
        <ellipse cx={530} cy={horizon + 160 - 128 * 1.2} rx={232} ry={22} fill={INK} />
        <Chair x={930} seat={horizon + 160 - 92 * 1.2} floor={horizon + 160} facing={-1} lit={1} />
      </g>
      <rect x={210} y={horizon - 330} width={660} height={350} fill="none" stroke={INK} strokeWidth={20} />
      <path d={`M 540 ${horizon - 330} L 540 ${horizon + 20}`} stroke={INK} strokeWidth={10} />
      <rect x={0} y={street} width={W} height={H - street} fill="#06070c" />
      <path d={`M 210 ${street} L 870 ${street} L 1000 ${H} L 80 ${H} Z`} fill={LAMP} opacity={0.06} />
    </g>
  );
};

/** The morning, in the street before the café: two figures meet, one holds out his hand. */
const Morning: React.FC<{ horizon: number; shake: number }> = ({ horizon, shake }) => {
  const S = 1.35;
  const floor = horizon + 150;
  const reach = shake;
  const a: Pose = mix(POSES.stand, STANDING.offer, reach);
  const b: Pose = mix(POSES.stand, STANDING.offer, ramp(reach, 0.4, 1));
  return (
    <g>
      <defs>
        <linearGradient id="hy-dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2a5a" />
          <stop offset=".6" stopColor="#c27a62" />
          <stop offset="1" stopColor="#f2c48a" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={floor} fill="url(#hy-dawn)" />
      <circle cx={540} cy={floor - 40} r={120} fill="#fff1c8" opacity={0.5} />
      <path d={`M 0 ${floor} L 0 ${horizon - 300} L 200 ${horizon - 300} L 200 ${horizon - 360} L 330 ${horizon - 360} L 330 ${floor} Z`} fill="#0b0d16" />
      <path d={`M 760 ${floor} L 760 ${horizon - 380} L 920 ${horizon - 380} L 920 ${horizon - 320} L 1080 ${horizon - 320} L 1080 ${floor} Z`} fill="#0b0d16" />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#0a0a10" />
      <Figure id="hy-m1" x={370} y={floor - LEGS * S} scale={S} pose={a} facing={1} rim="#ffd2a0" />
      <Figure id="hy-m2" x={710} y={floor - LEGS * S} scale={S} pose={b} facing={-1} rim="#ffd2a0" />
    </g>
  );
};

const GHIBA = ["cafe", "chair", "table", "night", "alone", "dawn"];

const GhibaPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(GHIBA, show, since);
  const cafe = Math.max(show("cafe"), show("alone"));
  // alone: the three fade out and leave the empty chair alone in its light
  const people = 1 - show("alone") * (at.cover ? 1 : ramp(t, at("alone"), at("alone") + 2.5));
  const close = Math.max(show("chair"), show("table"));
  return (
    <>
      <g opacity={cafe}>
        <Cafe t={t} horizon={horizon} people={people} jacket={0} spot={0.6 + 0.4 * show("alone")} talk={1 - show("alone")} />
      </g>
      <g opacity={close}>
        <ChairClose t={t} horizon={horizon} things={show("table")} others={show("chair")} />
      </g>
      <g opacity={show("night")}>
        <CafeOutside t={t} horizon={horizon} />
      </g>
      <g opacity={show("dawn")}>
        <Morning horizon={horizon} shake={at.cover ? 1 : ramp(t, at("dawn") + 1, at("dawn") + 3)} />
      </g>
    </>
  );
};

// --------------------------------------------------------------------------------------- 2. النميمة, the phone

/** A chat bubble: `mine` on the right in blue, else on the left in grey. */
const Bubble: React.FC<{ x: number; y: number; w: number; mine: boolean; lines?: number }> = ({ x, y, w, mine, lines = 1 }) => (
  <g>
    <rect x={x} y={y} width={w} height={30 + 26 * lines} rx={22} fill={mine ? "#2b5bd7" : "#2a3142"} />
    {Array.from({ length: lines }, (_, j) => <rect key={j} x={x + 22} y={y + 20 + 26 * j} width={(w - 44) * (j === lines - 1 ? 0.6 : 0.95)} height={10} rx={5} fill={mine ? "#cfe0ff" : "#8a93a8"} opacity={0.8} />)}
  </g>
);

/** The screen of a phone: a chat; `shot` 0 to 1 the screenshot (a flash, the picture shrinks to a corner), `share` the
 * forward sheet, `sent` the picture flies away. (x, y, w, h): the screen. */
const ChatPhone: React.FC<{ x: number; y: number; w: number; h: number; shot: number; share: number; sent: number }> = ({ x, y, w, h, shot, share, sent }) => {
  const flash = Math.max(0, 1 - Math.abs(shot - 0.15) * 7);
  const thumb = ramp(shot, 0.2, 0.9);
  const tw = w * (1 - 0.66 * thumb);
  const th = h * (1 - 0.66 * thumb);
  const fly = sent;
  const tx = x + (w - tw) * thumb * 0.92 + fly * 520;
  const ty = y + (h - th) * thumb * 0.62 - fly * 720;
  const chat = (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#10141f" />
      <rect x={x} y={y} width={w} height={92} fill="#1a2030" />
      <circle cx={x + 60} cy={y + 46} r={26} fill="#56607a" />
      <rect x={x + 100} y={y + 30} width={150} height={14} rx={7} fill="#c9d0de" />
      <rect x={x + 100} y={y + 54} width={90} height={10} rx={5} fill="#6a7390" />
      <Bubble x={x + 30} y={y + 130} w={w * 0.62} mine={false} lines={2} />
      <Bubble x={x + w * 0.34} y={y + 230} w={w * 0.6} mine lines={1} />
      <Bubble x={x + 30} y={y + 304} w={w * 0.7} mine={false} lines={3} />
      <Bubble x={x + w * 0.42} y={y + 434} w={w * 0.52} mine lines={1} />
      <Bubble x={x + 30} y={y + 508} w={w * 0.55} mine={false} lines={2} />
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id="hy-screen">
          <rect x={x} y={y} width={w} height={h} rx={44} />
        </clipPath>
      </defs>
      <rect x={x - 16} y={y - 16} width={w + 32} height={h + 32} rx={58} fill="#0b0d14" stroke="#3a4258" strokeWidth={3} />
      <g clipPath="url(#hy-screen)">
        {chat}
        {/* the screenshot: the same chat, shrinking into a picture */}
        <g opacity={shot > 0.2 ? 1 - ramp(fly, 0.6, 1) : 0}>
          <rect x={x} y={y} width={w} height={h} fill="#05070c" opacity={0.55 * thumb} />
          <g transform={`translate(${tx} ${ty}) scale(${tw / w} ${th / h}) translate(${-x} ${-y})`} opacity={1 - ramp(fly, 0.3, 0.7)}>
            {chat}
            <rect x={x} y={y} width={w} height={h} fill="none" stroke="#e9edf6" strokeWidth={10} />
          </g>
        </g>
        {/* the sheet: forward to… */}
        <g transform={`translate(0 ${(1 - share) * 320})`} opacity={share * (1 - fly)}>
          <rect x={x} y={y + h - 300} width={w} height={300} rx={30} fill="#1d2333" />
          {[0, 1, 2, 3].map((k) => (
            <g key={k}>
              <circle cx={x + 90 + k * ((w - 120) / 4)} cy={y + h - 200} r={40} fill={k === 1 ? "#2b5bd7" : "#3a4258"} />
              <rect x={x + 60 + k * ((w - 120) / 4)} y={y + h - 140} width={60} height={10} rx={5} fill="#8a93a8" />
            </g>
          ))}
          {/* the forward arrow on the chosen contact */}
          <path d={`M ${x + 90 + (w - 120) / 4 - 18} ${y + h - 192} q 6 -26 34 -26 l 0 -12 l 22 22 l -22 22 l 0 -12 q -22 0 -34 6 Z`} fill="#e9edf6" />
        </g>
        <rect x={x} y={y} width={w} height={h} fill="#ffffff" opacity={0.85 * flash} />
      </g>
      {/* sent: a toast with the forward arrow and a tick */}
      <g opacity={ramp(sent, 0.5, 1)} transform={`translate(${x + w / 2} ${y + h - 90})`}>
        <rect x={-110} y={-36} width={220} height={72} rx={36} fill="#e9edf6" />
        <path d="M -62 10 q 6 -26 34 -26 l 0 -12 l 22 22 l -22 22 l 0 -12 q -22 0 -34 6 Z" fill="#2b5bd7" />
        <path d="M 22 0 l 16 16 l 34 -34" stroke="#2b5bd7" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

/** A dark room at night: a figure on a sofa, a phone in its hands lit on its face; `light` 0 to 1 the screen's glow. */
const Sofa: React.FC<{ t: number; horizon: number; light: number; pose: Pose; x: number; facing: number; id: string }> = ({ t, horizon, light, pose, x, facing, id }) => {
  const S = 1.35;
  const floor = horizon + 160;
  const seat = floor - 92 * S;
  return (
    <g>
      <rect x={0} y={0} width={W} height={floor} fill="#080a12" />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#040509" />
      <Stars t={t} bright={0.6} top={horizon - 640} bottom={horizon - 380} left={640} right={980} count={14} />
      <rect x={640} y={horizon - 640} width={340} height={300} fill="none" stroke="#141a2a" strokeWidth={18} />
      {/* the sofa */}
      <path d={`M ${x - 220} ${seat + 4} L ${x + 220} ${seat + 4} L ${x + 220} ${floor - 20} L ${x - 220} ${floor - 20} Z`} fill="#0e1220" />
      <path d={`M ${x - facing * 230} ${seat + 10} L ${x - facing * 230} ${seat - 170} Q ${x - facing * 230} ${seat - 200} ${x - facing * 200} ${seat - 200} L ${x - facing * 140} ${seat - 200}`} stroke="#0e1220" strokeWidth={60} fill="none" strokeLinecap="round" />
      <ellipse cx={x + facing * 70} cy={seat - 110} rx={260 * light} ry={200 * light} fill="#cfe0ff" opacity={0.12 * light} />
      <Figure id={id} x={x} y={seat} scale={S} pose={pose} facing={facing} rim="#2a3350" lit={light} light="#cfe0ff" held={<rect x={-8} y={-30} width={22} height={40} rx={5} fill="#0b0d14" stroke="#cfe0ff" strokeWidth={3} opacity={0.4 + 0.6 * light} />} />
    </g>
  );
};

/** Two houses on two hills at night, a path between them; `walker` 0 to 1 how far a figure has walked from the left
 * house to the right one (null: nobody), `dark` 0 to 1 the right house's window goes out, `broken` the path fades. */
const Houses: React.FC<{ t: number; horizon: number; walker: number | null; dark: number; broken: number; steps: number }> = ({ t, horizon, walker, dark, broken, steps }) => {
  const path = `M 250 ${horizon + 40} C 380 ${horizon + 250} 560 ${horizon + 260} 640 ${horizon + 160} S 800 ${horizon + 20} 850 ${horizon - 10}`;
  const at = (u: number) => {
    // a few points along the path, interpolated (enough for a walker at this size)
    const pts = [[250, horizon + 40], [360, horizon + 190], [470, horizon + 236], [560, horizon + 220], [640, horizon + 160], [720, horizon + 70], [850, horizon - 10]];
    const f = Math.min(pts.length - 1.001, u * (pts.length - 1));
    const i = Math.floor(f);
    const k = f - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
  };
  const house = (x: number, y: number, s: number, lit: number, k: number) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -110 0 L -110 -150 L 0 -240 L 110 -150 L 110 0 Z" fill={INK} stroke={RIM} strokeWidth={2} strokeOpacity={0.3} />
      <rect x={-40} y={-120} width={80} height={70} fill={LAMP} opacity={lit * (0.85 + 0.1 * Math.sin(t * 2 + k))} />
      <path d="M 0 -120 L 0 -50 M -40 -85 L 40 -85" stroke={INK} strokeWidth={6} />
      <ellipse cx={0} cy={-85} rx={140 * lit} ry={110 * lit} fill={LAMP} opacity={0.08 * lit} />
    </g>
  );
  const S = 0.8;
  const [wx, wy] = walker === null ? [0, 0] : at(walker);
  return (
    <g>
      <defs>
        <linearGradient id="hy-hills" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03050c" />
          <stop offset="1" stopColor="#18203e" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={horizon} fill="url(#hy-hills)" />
      <Stars t={t} bright={1} top={40} bottom={horizon - 300} count={140} />
      <path d={`M 0 ${horizon + 80} Q 220 ${horizon - 40} 380 ${horizon + 60} Q 600 ${horizon + 300} 760 ${horizon + 30} Q 900 ${horizon - 80} ${W} ${horizon - 10} L ${W} ${H} L 0 ${H} Z`} fill="#070912" />
      <path d={path} stroke="#c9b48a" strokeWidth={10} fill="none" opacity={0.35 * (1 - broken)} strokeDasharray={broken > 0 ? `${40 * (1 - broken) + 4} 30` : undefined} />
      {/* footprints, lit one after the other behind the walker */}
      {Array.from({ length: 16 }, (_, i) => {
        const u = (i + 0.5) / 16;
        if (u > steps) return null;
        const [px, py] = at(u);
        return <ellipse key={i} cx={px + (i % 2 ? 6 : -6)} cy={py + 4} rx={7} ry={4} fill={GOLD} opacity={0.75 * (1 - broken)} />;
      })}
      {house(200, horizon + 70, 1.3, 1, 0)}
      {house(880, horizon + 10, 1.2, 1 - dark, 1)}
      {walker !== null ? (
        <Figure id="hy-walker" x={wx} y={wy - LEGS * S} scale={S} pose={walk(walker * 26 * Math.PI)} facing={1} rim={RIM} held={<rect x={-4} y={-14} width={20} height={14} rx={2} fill={GOLD} opacity={0.9} />} />
      ) : null}
    </g>
  );
};

/** Al-Baqi' or the gardens of Madina at dusk (Bukhari 216): palms, a low wall, two graves side by side; nobody. */
const Graves: React.FC<{ t: number; horizon: number }> = ({ t, horizon }) => {
  const palm = (x: number, y: number, h: number, lean: number, i: number) => {
    const sway = 6 * Math.sin(t * 0.7 + i);
    const topX = x + lean + sway;
    const topY = y - h;
    return (
      <g key={i}>
        <path d={`M ${x - 9} ${y} Q ${x + lean * 0.3} ${y - h * 0.5} ${topX - 5} ${topY} L ${topX + 5} ${topY} Q ${x + lean * 0.3 + 14} ${y - h * 0.5} ${x + 9} ${y} Z`} fill={INK} />
        {Array.from({ length: 9 }, (_, k) => {
          const a = -Math.PI + (k / 8) * Math.PI + 0.1 * Math.sin(t * 0.9 + k + i);
          const len = 120 + 30 * chance(k, i);
          return <path key={k} d={`M ${topX} ${topY} Q ${topX + len * 0.55 * Math.cos(a)} ${topY + len * 0.5 * Math.sin(a) - 18} ${topX + len * Math.cos(a)} ${topY + len * Math.sin(a) * 0.55 + 46}`} stroke={INK} strokeWidth={10 - k * 0.3} fill="none" strokeLinecap="round" />;
        })}
      </g>
    );
  };
  const grave = (x: number) => (
    <g>
      <path d={`M ${x - 200} ${horizon + 190} C ${x - 160} ${horizon + 100} ${x + 160} ${horizon + 100} ${x + 200} ${horizon + 190} Z`} fill="#4a3020" />
      <path d={`M ${x - 200} ${horizon + 190} C ${x - 160} ${horizon + 100} ${x + 160} ${horizon + 100} ${x + 200} ${horizon + 190}`} stroke="#f0aa62" strokeWidth={4} fill="none" opacity={0.75} />
      <rect x={x + 168} y={horizon + 70} width={26} height={120} rx={8} fill="#0b0807" stroke="#f0aa62" strokeWidth={3} strokeOpacity={0.6} />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id="hy-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0f24" />
          <stop offset=".55" stopColor="#3a2a3e" />
          <stop offset=".85" stopColor="#a8603a" />
          <stop offset="1" stopColor="#e09a52" />
        </linearGradient>
        <linearGradient id="hy-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1c14" />
          <stop offset="1" stopColor="#0c0806" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={horizon} fill="url(#hy-dusk)" />
      {palm(120, horizon + 10, 440, 40, 1)}
      {palm(250, horizon + 20, 320, -30, 2)}
      {palm(900, horizon + 10, 460, -50, 3)}
      <path d={`M 0 ${horizon - 40} L ${W} ${horizon - 30} L ${W} ${horizon + 20} L 0 ${horizon + 20} Z`} fill="#0b0807" />
      <rect x={0} y={horizon + 10} width={W} height={H - horizon} fill="url(#hy-sand)" />
      <g transform={`translate(760 ${horizon + 190}) scale(0.8) translate(-760 ${-(horizon + 190)}) translate(0 -40)`}>{grave(760)}</g>
      {grave(330)}
    </g>
  );
};

/** A phone face down on a table, a thin glow at its edges, the light of the morning through a window. */
const Still: React.FC<{ t: number; horizon: number; dawn: number }> = ({ t, horizon, dawn }) => {
  const top = horizon + 40;
  return (
    <g>
      <rect x={0} y={0} width={W} height={top} fill={`rgb(${14 + 30 * dawn},${16 + 24 * dawn},${28 + 20 * dawn})`} />
      <rect x={620} y={horizon - 440} width={360} height={400} fill={`rgb(${40 + 180 * dawn},${50 + 120 * dawn},${90 + 60 * dawn})`} />
      <rect x={620} y={horizon - 440} width={360} height={400} fill="none" stroke={INK} strokeWidth={22} />
      <path d={`M 800 ${horizon - 440} L 800 ${horizon - 40} M 620 ${horizon - 240} L 980 ${horizon - 240}`} stroke={INK} strokeWidth={10} />
      <rect x={0} y={top} width={W} height={H - top} fill="#100c0a" />
      <path d={`M 0 ${top} L ${W} ${top}`} stroke={LAMP} strokeWidth={3} opacity={0.3} />
      <path d={`M 560 ${top} L 960 ${top} L 1080 ${top + 300} L 600 ${top + 300} Z`} fill={LAMP} opacity={0.12 * dawn} />
      {/* the phone, face down, a faint glow at its edges that dies */}
      <g transform={`translate(440 ${top + 150}) rotate(-8) scale(1.7)`}>
        <rect x={-150} y={-60} width={300} height={120} rx={24} fill="#cfe0ff" opacity={0.18 * (1 - dawn) * (0.7 + 0.3 * Math.sin(t * 2))} filter="url(#hy-soft)" />
        <rect x={-140} y={-52} width={280} height={104} rx={22} fill="#0b0d14" stroke="#3a4258" strokeWidth={3} />
        <circle cx={-90} cy={-20} r={14} fill="#1a2030" stroke="#3a4258" strokeWidth={2} />
      </g>
      <defs>
        <filter id="hy-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
    </g>
  );
};

const NAMIMA = ["phone", "sent", "path", "steps", "graves", "split", "still"];

const NamimaPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(NAMIMA, show, since);
  // phone (« شوف فلان قال عليك إيه »): the chat, the screenshot's flash, the sheet, the picture flies away
  const shot = at.cover ? 1 : ramp(t, at("phone") + 0.3, at("phone") + 0.9);
  const share = at.cover ? 1 : ramp(t, at("phone") + 1.0, at("phone") + 1.4);
  const sent = at.cover ? 0 : ramp(t, at("phone") + 1.6, at("phone") + 2.3);
  // sent: another room, the phone lights up in the hands of the one it was sent to, who sits up
  const lit = at.cover ? 1 : ramp(t, at("sent") + 0.2, at("sent") + 0.7);
  const jolt = at.cover ? 1 : ramp(t, at("sent") + 1.2, at("sent") + 1.8);
  const recv: Pose = mix(POSES.slump, POSES.jolt, jolt);
  const walker = show("steps") > 0 ? (at.cover ? 0.55 : interpolate(t, [at("steps") + 0.3, at("steps") + 9], [0, 1], CLAMP)) : null;
  const houses = Math.max(show("path"), show("steps"), show("split"));
  const broken = show("split") * (at.cover ? 1 : ramp(t, at("split") + 1, at("split") + 5));
  const phoneScene = show("phone");
  return (
    <>
      <g opacity={phoneScene}>
        <rect x={0} y={0} width={W} height={H} fill="#06080f" />
        <ellipse cx={540} cy={1150} rx={520} ry={600} fill="#cfe0ff" opacity={0.05} />
        <ChatPhone x={240} y={820} w={600} h={640} shot={shot} share={share} sent={sent} />
      </g>
      <g opacity={show("sent")}>
        <Sofa t={t} horizon={horizon} light={lit} pose={recv} x={560} facing={-1} id="hy-recv" />
      </g>
      <g opacity={houses}>
        <Houses t={t} horizon={horizon} walker={show("steps") > 0.01 ? walker : null} dark={broken} broken={broken} steps={show("steps") > 0 ? (walker ?? 0) : show("split") > 0 ? 1 : 0} />
      </g>
      <g opacity={show("graves")}>
        <Graves t={t} horizon={horizon} />
      </g>
      <g opacity={show("still")}>
        <Still t={t} horizon={horizon} dawn={at.cover ? 0.6 : ramp(t, at("still") + 1, at("still") + 8)} />
      </g>
    </>
  );
};

// --------------------------------------------------------------------------------------- 3. الرياء, the box

/** A charity box on its stand, a slot on top, « صدقة » on its face. (x, y): the foot of the stand. */
const Box: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-14} y={-260} width={28} height={260} fill={INK} />
    <ellipse cx={0} cy={0} rx={80} ry={12} fill={INK} />
    <rect x={-120} y={-460} width={240} height={200} rx={10} fill="#2a1a10" stroke={GOLD} strokeWidth={4} />
    <rect x={-60} y={-470} width={120} height={14} rx={7} fill="#0b0806" stroke={GOLD} strokeWidth={2} />
    <text x={0} y={-340} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={70} fill={GOLD} opacity={0.9}>صدقة</text>
  </g>
);

/** A heart, filled; (x, y) its middle. */
const Heart: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M 0 10 C -10 -4 -30 0 -26 18 C -22 32 -6 40 0 48 C 6 40 22 32 26 18 C 30 0 10 -4 0 10 Z" fill="#ff4d6d" opacity={o} />
);

/** A phone held up in the figure's hand (Figure `held`, local units), its screen towards us: the box, a red dot. */
const FilmingPhone: React.FC<{ t: number }> = ({ t }) => (
  <g transform="rotate(-14)">
    <rect x={-34} y={-100} width={68} height={120} rx={11} fill="#0b0d14" stroke="#cfe0ff" strokeWidth={2.5} />
    <rect x={-28} y={-93} width={56} height={106} rx={7} fill="#1a1622" />
    <rect x={-13} y={-50} width={26} height={24} rx={2} fill="#2a1a10" stroke={GOLD} strokeWidth={1.5} />
    <circle cx={-16} cy={-80} r={5} fill="#ff3b30" opacity={0.6 + 0.4 * Math.sin(t * 6)} />
  </g>
);

/** The street in the evening: a mosque's wall, a lamp, the box; the figure gives with one hand and films with the
 * other; hearts rise from the phone and a counter grows. */
const Giving: React.FC<{ t: number; horizon: number; drop: number; hearts: number; count: number }> = ({ t, horizon, drop, hearts, count }) => {
  const S = 1.35;
  const floor = horizon + 160;
  const fx = 430;
  const fy = floor - LEGS * S;
  // where the hands are (Lens.tsx's figure, torso 6°): the raised one with the phone, the one at the slot
  const phoneX = fx + 86;
  const phoneY = fy - 300;
  const slotX = fx + 182;
  const slotY = fy - 172;
  return (
    <g>
      <defs>
        <linearGradient id="hy-eve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07091a" />
          <stop offset="1" stopColor="#24203a" />
        </linearGradient>
        <radialGradient id="hy-street-lamp">
          <stop offset="0" stopColor={LAMP} stopOpacity=".45" />
          <stop offset="1" stopColor={LAMP} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={floor} fill="url(#hy-eve)" />
      {/* a mosque's wall and its arched door, the lamp above */}
      <path d={`M 0 ${floor} L 0 ${horizon - 520} L ${W} ${horizon - 520} L ${W} ${floor} Z`} fill="#0b0d18" />
      <path d={`M 800 ${floor} L 800 ${horizon - 210} Q 900 ${horizon - 340} 1000 ${horizon - 210} L 1000 ${floor} Z`} fill="#1a1420" stroke={LAMP} strokeWidth={2} strokeOpacity={0.3} />
      <circle cx={900} cy={horizon - 420} r={150} fill="url(#hy-street-lamp)" />
      <circle cx={900} cy={horizon - 420} r={12} fill="#fff1c8" />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#07070c" />
      <Box x={slotX + 12} y={floor} s={0.8} />
      {/* the note going from the hand into the slot */}
      <g opacity={1 - ramp(drop, 0.85, 1)}>
        <rect x={slotX - 30} y={slotY - 50 + 36 * drop} width={60} height={32} rx={3} fill="#9fd4a0" stroke="#e9f5e0" strokeWidth={2} />
      </g>
      <Figure id="hy-giver" x={fx} y={fy} scale={S} pose={STANDING.film} facing={1} rim={LAMP} lit={0.35} light="#cfe0ff" held={<FilmingPhone t={t} />} />
      {/* the hearts and the counter */}
      <g opacity={hearts}>
        {Array.from({ length: 14 }, (_, i) => {
          const p = (t * (0.35 + 0.25 * chance(i, 1)) + chance(i, 2)) % 1;
          return <Heart key={i} x={phoneX + 40 + 220 * chance(i, 3) + 24 * Math.sin(t * 2 + i)} y={phoneY + 40 - 220 * p} s={0.7 + 0.9 * chance(i, 4)} o={Math.sin(Math.PI * p)} />;
        })}
        <g transform={`translate(${phoneX - 230} ${phoneY - 40})`}>
          <rect x={-10} y={-44} width={210} height={62} rx={31} fill="#000" opacity={0.55} />
          <Heart x={26} y={-34} s={0.8} o={1} />
          <text x={58} y={4} fontFamily={FONT.latin} fontWeight={700} fontSize={40} fill="#ffffff">{count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(Math.round(count))}</text>
        </g>
      </g>
    </g>
  );
};

/** The rock of 2:264, a smooth stone (« صفوان »), the dust on it (« عليه تراب »), the heavy rain (« فأصابه وابل ») that
 * leaves it bare (« فتركه صلدا »). `dust` 1 to 0, `rain` 0 to 1, `wet` 0 to 1, `cut` 0 to 1: a slice that shows the
 * thin dust over the stone (« الناس شافوا التراب… وربنا شايف الصخرة »); `sprouts`: what the eye takes for good soil. */
const Rock: React.FC<{ t: number; horizon: number; dust: number; rain: number; wet: number; cut: number; sprouts: number }> = ({ t, horizon, dust, rain, wet, cut, sprouts }) => {
  const base = horizon + 210;
  const cx = 545;
  const half = 410;
  const tall = 400;
  // the top of the boulder: a flattened half ellipse with a few soft bumps, the same function for the stone and its dust
  const top = (x: number) => {
    const u = Math.max(-1, Math.min(1, (x - cx) / half));
    return base - tall * Math.pow(1 - u * u, 0.58) + 14 * Math.sin(x / 70) * (1 - u * u);
  };
  const xs = Array.from({ length: 81 }, (_, i) => cx - half + (2 * half * i) / 80);
  const outline = `M ${cx - half} ${base} ` + xs.map((x) => `L ${x.toFixed(1)} ${top(x).toFixed(1)}`).join(" ") + ` L ${cx + half} ${base} Z`;
  const ridge = xs.filter((x) => x > cx - half * 0.86 && x < cx + half * 0.3).map((x, i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${(top(x) + 4).toFixed(1)}`).join(" ");
  // the dust: a cap on the top, thickest in the middle, thinner as the rain washes it
  const dx = xs.filter((x) => Math.abs(x - cx) < half * 0.78);
  const th = (x: number) => 52 * dust * (1 - ((x - cx) / (half * 0.78)) ** 2);
  const cap = `M ${dx[0].toFixed(1)} ${(top(dx[0]) - 4).toFixed(1)} ` + dx.map((x) => `L ${x.toFixed(1)} ${(top(x) - 6).toFixed(1)}`).join(" ") + " " + [...dx].reverse().map((x) => `L ${x.toFixed(1)} ${(top(x) + th(x)).toFixed(1)}`).join(" ") + " Z";
  const washing = Math.min(1, rain * 2) * Math.sin(Math.PI * Math.min(1, Math.max(0, 1 - dust)));
  return (
    <g>
      <defs>
        <linearGradient id="hy-storm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rain > 0.3 ? "#141824" : "#1a2034"} />
          <stop offset="1" stopColor={rain > 0.3 ? "#3a4152" : "#4a4f62"} />
        </linearGradient>
        <linearGradient id="hy-stone" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#8a90a2" />
          <stop offset=".45" stopColor="#5a6072" />
          <stop offset="1" stopColor="#23262f" />
        </linearGradient>
        <clipPath id="hy-rock">
          <path d={outline} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={base} fill="url(#hy-storm)" />
      {/* clouds, low and heavy */}
      {[0, 1, 2, 3, 4].map((k) => (
        <ellipse key={k} cx={((120 + 260 * k + t * (10 + 4 * k)) % 1400) - 160} cy={horizon - 420 + 50 * chance(k, 6)} rx={240 + 60 * chance(k, 7)} ry={60} fill="#262c3c" opacity={0.55 + 0.35 * rain} />
      ))}
      {/* the ground: flat, dark, wet when the rain falls */}
      <rect x={0} y={base} width={W} height={H - base} fill="#0b0c11" />
      <path d={`M 0 ${base} L ${W} ${base}`} stroke={RIM} strokeWidth={2} opacity={0.2 + 0.3 * wet} />
      <ellipse cx={cx} cy={base + 8} rx={half + 60} ry={22} fill="#000" opacity={0.5} />
      {/* the stone */}
      <path d={outline} fill="url(#hy-stone)" />
      <g clipPath="url(#hy-rock)">
        {/* soft facets and a crack: a stone, not a dome */}
        <path d={`M ${cx + 120} ${base} C ${cx + 90} ${base - 120} ${cx + 160} ${base - 210} ${cx + 230} ${base - 260}`} stroke="#2a2e38" strokeWidth={6} fill="none" opacity={0.7} />
        <path d={`M ${cx - 260} ${base} C ${cx - 220} ${base - 90} ${cx - 120} ${base - 140} ${cx - 60} ${base - 150}`} stroke="#2f3440" strokeWidth={4} fill="none" opacity={0.6} />
        <ellipse cx={cx + 200} cy={base - 40} rx={300} ry={160} fill="#14161c" opacity={0.25} />
        {/* the dust, its grains */}
        <path d={cap} fill="#8a6038" opacity={dust > 0.01 ? 1 : 0} />
        {Array.from({ length: 90 }, (_, i) => {
          const x = cx - half * 0.74 + 2 * half * 0.74 * chance(i, 30);
          const y = top(x) - 2 + th(x) * chance(i, 31);
          return <circle key={i} cx={x} cy={y} r={2 + 3 * chance(i, 33)} fill={chance(i, 34) > 0.5 ? "#b08458" : "#5e3e22"} opacity={dust} />;
        })}
        {/* muddy streaks running down the sides while the rain washes it */}
        {Array.from({ length: 12 }, (_, i) => {
          const x = cx - half * 0.8 + 2 * half * 0.8 * chance(i, 40);
          const len = 80 + 160 * chance(i, 41);
          const off = (t * 220 + 300 * chance(i, 42)) % (len + 120);
          return <path key={i} d={`M ${x} ${top(x) + 10} L ${x + (x - cx) * 0.08} ${top(x) + 10 + len}`} stroke="#7a5634" strokeWidth={6} strokeDasharray={`40 ${len}`} strokeDashoffset={-off} opacity={0.7 * washing} />;
        })}
      </g>
      {/* the light on its ridge, brighter when wet */}
      <path d={ridge} stroke="#e8eefc" strokeWidth={4 + 3 * wet} fill="none" strokeLinecap="round" opacity={0.25 + 0.55 * wet * (1 - dust)} />
      {/* tiny sprouts on the dust */}
      <g opacity={sprouts * dust}>
        {[cx - 230, cx - 110, cx + 20, cx + 150, cx + 260].map((x, k) => {
          const y = top(x) - 4;
          return <path key={k} d={`M ${x} ${y} q -4 -26 6 -40 M ${x} ${y - 20} q -18 -6 -24 -20 M ${x + 2} ${y - 28} q 16 -4 22 -18`} stroke="#7fbf6a" strokeWidth={4} fill="none" strokeLinecap="round" />;
        })}
      </g>
      {/* the slice: a cut through the rock, the thin dust over the deep stone */}
      <g opacity={cut}>
        <rect x={cx - 70} y={top(cx) - 14} width={140} height={base - top(cx) + 14} fill="#3a3f4e" />
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M ${cx - 70} ${top(cx) + 50 + 42 * i} L ${cx + 70} ${top(cx) + 62 + 42 * i}`} stroke="#2a2e3a" strokeWidth={4} />)}
        <rect x={cx - 70} y={top(cx) - 14} width={140} height={th(cx) + 10} fill="#8a6038" />
        <rect x={cx - 70} y={top(cx) - 14} width={140} height={base - top(cx) + 14} fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="14 10" />
      </g>
      {/* the water running off at the foot */}
      <path d={`M ${cx - half - 20} ${base + 24} Q ${cx} ${base + 60} ${cx + half + 20} ${base + 24}`} stroke="#7a5634" strokeWidth={12} fill="none" opacity={0.6 * washing} strokeDasharray="40 30" strokeDashoffset={-t * 120} />
      <g opacity={rain}>
        <Rain t={t * 1.6} />
        <Rain t={t * 1.6 + 0.37} />
      </g>
    </g>
  );
};

const RIYA = ["box", "hearts", "rock", "bare", "soil", "two", "dawn"];

const RiyaPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(RIYA, show, since);
  const drop = at.cover ? 0.6 : ramp(t, at("box") + 0.4, at("box") + 1.4);
  const hearts = at.cover ? 1 : Math.max(show("box") * ramp(t, at("box") + 1.2, at("box") + 1.8), show("hearts"));
  const count = at.cover ? 1200 : 40 + 1600 * ramp(t, at("box") + 1.3, at("hearts") + 6);
  const giving = Math.max(show("box"), show("hearts"));
  // rock (2:264, 45.5 s): dry until « فأصابه وابل » (about 27.5 s into the verse), then the heavy rain washes the dust
  // away by « فتركه صلدا » (about 32 s); bare: the rain thins, the stone shines; soil: the dust again, a slice through it
  const rain = at.cover ? (show("rock") ? 1 : 0) : show("rock") * ramp(t, at("rock") + 27, at("rock") + 28.5) * (1 - show("bare") * 0.7);
  const dust = at.cover ? (show("rock") ? 0.6 : show("soil") ? 1 : 0) : show("soil") > 0 ? 1 : 1 - ramp(t, at("rock") + 28.5, at("rock") + 32.5);
  const wet = Math.max(show("bare"), show("rock") * ramp(t, at("rock") + 29, at("rock") + 33));
  const cut = show("soil") * (at.cover ? 0 : ramp(t, at("soil") + 4.5, at("soil") + 6));
  const stone = Math.max(show("rock"), show("bare"), show("soil"));
  return (
    <>
      <g opacity={giving}>
        <Giving t={t} horizon={horizon} drop={drop} hearts={hearts} count={count} />
      </g>
      <g opacity={stone}>
        <Rock t={t} horizon={horizon} dust={dust} rain={rain} wet={wet} cut={cut} sprouts={show("soil")} />
      </g>
      <g opacity={show("two")}>
        <TwoGivers t={t} horizon={horizon} />
      </g>
      <g opacity={show("dawn")}>
        <BoxAtDawn t={t} horizon={horizon} />
      </g>
    </>
  );
};

/** Two figures at the same box: on the left one gives, the head bowed; on the right the other gives and films. */
const TwoGivers: React.FC<{ t: number; horizon: number }> = ({ t, horizon }) => {
  const S = 1.2;
  const floor = horizon + 160;
  const fy = floor - LEGS * S;
  return (
    <g>
      <rect x={0} y={0} width={W} height={floor} fill="#0b0d18" />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#07070c" />
      <Box x={540} y={floor} s={0.7} />
      <Figure id="hy-g1" x={340} y={fy} scale={S} pose={STANDING.give} facing={1} rim={LAMP} />
      <Figure id="hy-g2" x={740} y={fy} scale={S} pose={STANDING.film} facing={-1} rim={LAMP} lit={0.5} light="#cfe0ff" held={<FilmingPhone t={t} />} />
    </g>
  );
};

/** The morning: the box alone in the light. */
const BoxAtDawn: React.FC<{ t: number; horizon: number }> = ({ horizon }) => {
  const floor = horizon + 160;
  return (
    <g>
      <defs>
        <linearGradient id="hy-morn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2a5a" />
          <stop offset=".7" stopColor="#c27a62" />
          <stop offset="1" stopColor="#f2c48a" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={floor} fill="url(#hy-morn)" />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#0d0b10" />
      <path d={`M 540 ${floor} L 340 ${floor} L 200 ${H} L 880 ${H} L 740 ${floor} Z`} fill={LAMP} opacity={0.1} />
      <Box x={540} y={floor} s={1.1} />
    </g>
  );
};

export const HAYYIN_PICTURES: Record<string, Drawn> = { ghiba: GhibaPicture, namima: NamimaPicture, riya: RiyaPicture };
