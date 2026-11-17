// « مخيّر ولا مسيّر؟ » (content/trial/qadar.yaml: amal, shaa, law; docs/themes.md). Each short opens on an everyday
// scene played by an anonymous figure with no face (the owner's rule since 2026-11-15, and his request of 2026-11-17:
// « un cas de vie réel (situation) acté »): a typical scene, never a true story. The figure is the one of « بص تاني »
// (Lens.tsx): black, backlit, a round head, no eyes, no mouth. Nobody of a story is drawn: at the funeral of Bukhari
// 4949 only the place is (palms, a fresh grave, lines traced in the sand, no hand, no stick). Nothing of the unseen:
// the « book » of 57:22 is never pictured, nor paradise or hell named by the hadith; the two roads of 92:5-10 are two
// paths on the earth, one that lights up, one of stones.
import React from "react";
import { Easing, interpolate } from "remotion";
import { FONT } from "../fonts";
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

const MORE: Record<string, Pose> = {
  // at the desk, leaning back, one arm stretched out pushing the book away: « why bother »
  loll: { torso: -16, head: 4, armF: [78, -6], armB: [8, 10], legF: [84, -70], legB: [80, -76] },
  // at the desk, bent over the open book, writing
  study: { torso: 22, head: -26, armF: [70, 34], armB: [60, 40], legF: [88, -88], legB: [84, -84] },
  // sitting on a step, the elbows on the knees, the head in the hands
  despair: { torso: 34, head: -36, armF: [64, 112], armB: [58, 116], legF: [86, -96], legB: [80, -92] },
  // sitting on the edge of the bed, the feet on the floor
  edge: { torso: 4, head: -6, armF: [16, 10], armB: [-12, 10], legF: [86, -84], legB: [82, -82] },
  // standing, the hands raised to the ears: the start of a prayer
  takbir: { torso: 0, head: -4, armF: [150, 40], armB: [146, 44], legF: [4, -2], legB: [-4, -2] },
};

// ----------------------------------------------------------------------------------------------------- pieces

/** Stars, twinkling, between `top` and `bottom`; `bright` from 0 to 1. */
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

/** A window on the sky: `dawn` from 0 (night) to 1 (morning light). */
const Window: React.FC<{ id: string; x: number; y: number; w: number; h: number; t: number; dawn: number; moon?: boolean }> = ({ id, x, y, w, h, t, dawn, moon = true }) => (
  <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={`rgb(${4 + 60 * dawn},${8 + 90 * dawn},${26 + 150 * dawn})`} />
        <stop offset="1" stopColor={`rgb(${20 + 220 * dawn},${32 + 140 * dawn},${70 + 60 * dawn})`} />
      </linearGradient>
      <clipPath id={`${id}-clip`}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}-clip)`}>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} />
      <Stars t={t} bright={1 - dawn * 1.3} top={y} bottom={y + h * 0.7} left={x} right={x + w} count={34} />
      {moon ? <circle cx={x + w * 0.72} cy={y + h * 0.26} r={26} fill="#e8eefc" opacity={1 - dawn} /> : null}
      {/* the roofs across the street */}
      <path d={`M ${x} ${y + h} L ${x} ${y + h * 0.78} L ${x + w * 0.2} ${y + h * 0.78} L ${x + w * 0.2} ${y + h * 0.7} L ${x + w * 0.45} ${y + h * 0.7} L ${x + w * 0.45} ${y + h * 0.82} L ${x + w * 0.7} ${y + h * 0.82} L ${x + w * 0.7} ${y + h * 0.74} L ${x + w} ${y + h * 0.74} L ${x + w} ${y + h} Z`} fill="#070a14" />
    </g>
    <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={24} />
    <path d={`M ${x + w / 2} ${y} L ${x + w / 2} ${y + h} M ${x} ${y + h * 0.5} L ${x + w} ${y + h * 0.5}`} stroke={INK} strokeWidth={12} />
    {/* the light of the morning on the sill */}
    <rect x={x - 20} y={y + h + 8} width={w + 40} height={14} fill={LAMP} opacity={0.35 * dawn} />
  </g>
);

/** A wall clock; `minutes` turns its hands. */
const Clock: React.FC<{ x: number; y: number; r: number; minutes: number }> = ({ x, y, r, minutes }) => {
  const hand = (deg: number, len: number, w: number) => (
    <path d={`M ${x} ${y} L ${x + len * Math.sin((deg * Math.PI) / 180)} ${y - len * Math.cos((deg * Math.PI) / 180)}`} stroke={RIM} strokeWidth={w} strokeLinecap="round" opacity={0.85} />
  );
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#0b0f1c" stroke={RIM} strokeWidth={4} opacity={0.9} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <circle key={i} cx={x + (r - 12) * Math.sin(a)} cy={y - (r - 12) * Math.cos(a)} r={3} fill={RIM} opacity={0.7} />;
      })}
      {hand((minutes / 60) * 30 + 300, r * 0.5, 7)}
      {hand(minutes * 6, r * 0.78, 4)}
    </g>
  );
};

/** A desk lamp and its glow; `on` 0 to 1. (x, y): the foot of the lamp on the desk. */
const Lamp: React.FC<{ id: string; x: number; y: number; on: number }> = ({ id, x, y, on }) => (
  <g>
    <defs>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" stopColor={LAMP} stopOpacity=".6" />
        <stop offset="1" stopColor={LAMP} stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx={x + 70} cy={y - 40} rx={300} ry={190} fill={`url(#${id}-glow)`} opacity={on} />
    <rect x={x - 34} y={y - 10} width={68} height={10} rx={4} fill={INK} />
    <path d={`M ${x} ${y - 10} L ${x - 22} ${y - 120} L ${x + 50} ${y - 170}`} stroke={INK} strokeWidth={9} fill="none" strokeLinejoin="round" />
    <path d={`M ${x + 30} ${y - 196} L ${x + 104} ${y - 150} L ${x + 76} ${y - 128} Z`} fill={INK} />
    <path d={`M ${x + 104} ${y - 150} L ${x + 76} ${y - 128}`} stroke={LAMP} strokeWidth={5} opacity={on} />
  </g>
);

/** A book on the desk: `open` 0 (shut) to 1 (open flat); (x, y) the middle of its spine on the desk. */
const Book: React.FC<{ x: number; y: number; open: number; lit: number }> = ({ x, y, open, lit }) => {
  // the cover on the right rises and falls to the left: shut, it lies on the left half
  const a = Math.PI * (1 - open);
  const len = 130;
  const tip = [x + len * Math.cos(a), y - 10 - len * Math.sin(a) * 0.55];
  return (
    <g>
      <path d={`M ${x - len} ${y} L ${x} ${y} L ${x} ${y - 18} L ${x - len} ${y - 18} Z`} fill="#1b2238" stroke={RIM} strokeWidth={2} strokeOpacity={0.4} />
      <path d={`M ${x - len + 8} ${y - 18} L ${x - 6} ${y - 18}`} stroke="#e9dcc0" strokeWidth={6} opacity={0.3 + 0.6 * lit * open} />
      <path d={`M ${x} ${y - 16} L ${tip[0]} ${tip[1]}`} stroke="#222a44" strokeWidth={18} strokeLinecap="round" />
      <path d={`M ${x + 6} ${y - 22} L ${tip[0]} ${tip[1] - 6}`} stroke="#e9dcc0" strokeWidth={5} opacity={(0.3 + 0.6 * lit) * open} />
    </g>
  );
};

/** The study at night: a window, a clock, the desk, the lamp, the book, a chair; the figure sits at the desk. */
const Study: React.FC<{ t: number; horizon: number; pose: Pose; open: number; dawn: number; minutes: number; lamp: number; px?: number; py?: number; seated?: boolean }> = ({ t, horizon, pose, open, dawn, minutes, lamp, px, py, seated = true }) => {
  const S = 1.3;
  const floor = horizon + 120;
  const deskX = 610;
  const top = floor - 130 * S;
  const seat = floor - 92 * S;
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={`rgb(${16 + 20 * dawn},${20 + 18 * dawn},${36 + 14 * dawn})`} />
      <Window id="qd-win" x={560} y={horizon - 760} w={400} h={460} t={t} dawn={dawn} />
      <Clock x={200} y={horizon - 620} r={70} minutes={minutes} />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#05070d" />
      <path d={`M 0 ${floor} L ${W} ${floor}`} stroke={RIM} strokeWidth={2} opacity={0.25} />
      {/* the window's light on the floor, at dawn */}
      <path d={`M 560 ${floor} L 960 ${floor} L 1080 ${floor + 260} L 640 ${floor + 260} Z`} fill={LAMP} opacity={0.12 * dawn} />
      {/* the chair */}
      <path d={`M ${300} ${seat} L ${410} ${seat}`} stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d={`M ${306} ${seat} L ${296} ${floor} M ${404} ${seat} L ${410} ${floor} M ${300} ${seat} L ${282} ${seat - 170}`} stroke={INK} strokeWidth={12} strokeLinecap="round" />
      {/* the desk */}
      <rect x={deskX - 190} y={top} width={420} height={16} rx={4} fill={INK} />
      <rect x={deskX - 176} y={top + 16} width={14} height={floor - top - 16} fill={INK} />
      <rect x={deskX + 200} y={top + 16} width={14} height={floor - top - 16} fill={INK} />
      <Lamp id="qd-lamp" x={deskX + 150} y={top} on={lamp} />
      {/* a stack of books: the effort already made */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={deskX - 172 + 6 * chance(i, 50)} y={top - 22 * (i + 1)} width={120 - 10 * chance(i, 51)} height={20} rx={3} fill={i % 2 ? "#1b2238" : "#232b46"} stroke={RIM} strokeWidth={1.5} strokeOpacity={0.35} />
      ))}
      <Book x={deskX - 20} y={top} open={open} lit={lamp} />
      <Figure id="qd-fig" x={px ?? 350} y={py ?? (seated ? seat : floor - LEGS * S)} scale={S} pose={pose} rim={RIM} lit={0.6 * lamp} light={LAMP} />
    </g>
  );
};

/** A date palm: a bent trunk and its fronds. (x, y): its foot. */
const Palm: React.FC<{ x: number; y: number; h: number; lean: number; t: number; i: number }> = ({ x, y, h, lean, t, i }) => {
  const sway = 6 * Math.sin(t * 0.7 + i);
  const topX = x + lean + sway;
  const topY = y - h;
  return (
    <g>
      <path d={`M ${x - 9} ${y} Q ${x + lean * 0.3} ${y - h * 0.5} ${topX - 5} ${topY} L ${topX + 5} ${topY} Q ${x + lean * 0.3 + 14} ${y - h * 0.5} ${x + 9} ${y} Z`} fill={INK} />
      {Array.from({ length: 9 }, (_, k) => {
        const a = -Math.PI + (k / 8) * Math.PI + 0.1 * Math.sin(t * 0.9 + k + i);
        const len = 120 + 30 * chance(k, i);
        const ex = topX + len * Math.cos(a);
        const ey = topY + len * Math.sin(a) * 0.55 + 46;
        const cx = topX + len * 0.55 * Math.cos(a);
        const cy = topY + len * 0.55 * Math.sin(a) * 0.9 - 18;
        return <path key={k} d={`M ${topX} ${topY} Q ${cx} ${cy} ${ex} ${ey}`} stroke={INK} strokeWidth={10 - k * 0.3} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Al-Baqi' at dusk (Bukhari 4949): palms, a low wall, a fresh grave and its stone, lines traced in the sand one after
 * the other; nobody. `trace` 0 to 1: how much of the lines is drawn. */
const Ground: React.FC<{ t: number; horizon: number; trace: number }> = ({ t, horizon, trace }) => {
  const lines = Array.from({ length: 7 }, (_, i) => {
    const y = horizon + 110 + i * 22 + 8 * chance(i, 8);
    const x0 = 120 + 60 * chance(i, 9);
    const len = 260 + 120 * chance(i, 10);
    return { d: `M ${x0} ${y} q ${len * 0.3} ${-10 + 20 * chance(i, 11)} ${len * 0.55} ${-4} t ${len * 0.45} ${6 * chance(i, 12)}`, len: len * 1.08, k: i / 7 };
  });
  return (
    <g>
      <defs>
        <linearGradient id="qd-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0f24" />
          <stop offset=".55" stopColor="#3a2a3e" />
          <stop offset=".85" stopColor="#a8603a" />
          <stop offset="1" stopColor="#e09a52" />
        </linearGradient>
        <linearGradient id="qd-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1c14" />
          <stop offset="1" stopColor="#0c0806" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={horizon} fill="url(#qd-dusk)" />
      <Palm x={140} y={horizon + 10} h={430} lean={40} t={t} i={1} />
      <Palm x={260} y={horizon + 20} h={330} lean={-30} t={t} i={2} />
      <Palm x={880} y={horizon + 10} h={470} lean={-50} t={t} i={3} />
      <Palm x={980} y={horizon + 30} h={300} lean={20} t={t} i={4} />
      {/* the low wall of mud brick */}
      <path d={`M 0 ${horizon - 40} L ${W} ${horizon - 30} L ${W} ${horizon + 20} L 0 ${horizon + 20} Z`} fill="#0b0807" />
      <rect x={0} y={horizon + 10} width={W} height={H - horizon} fill="url(#qd-sand)" />
      {/* a fresh grave: a long mound and its stone */}
      <path d={`M 600 ${horizon + 120} Q 790 ${horizon + 66} 980 ${horizon + 120} Z`} fill="#3a2618" />
      <path d={`M 600 ${horizon + 120} Q 790 ${horizon + 66} 980 ${horizon + 120}`} stroke="#e09a52" strokeWidth={3} fill="none" opacity={0.6} />
      <rect x={962} y={horizon + 62} width={20} height={58} rx={6} fill="#0b0807" stroke="#e09a52" strokeWidth={2} strokeOpacity={0.4} />
      {/* the lines traced in the sand, one after the other */}
      {lines.map((l, i) => {
        const shown = Math.min(1, Math.max(0, trace * 7 - i));
        return <path key={i} d={l.d} stroke="#e8b27a" strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={`${l.len * shown} ${l.len}`} opacity={0.75} />;
      })}
    </g>
  );
};

/** Two paths (92:5-10): one road from the bottom of the frame, where the viewer stands, parts in two. The left one
 * rises smooth to a light on the horizon (« لليسرى ») and its edges light up as the light runs up it; the right one goes
 * down among stones into the dark (« للعسرى »). Two roads on the earth, nothing of the unseen. */
const Paths: React.FC<{ t: number; horizon: number; glow: number; hard: number }> = ({ t, horizon, glow, hard }) => {
  const fork = horizon + 320;
  const stem = `M 330 ${H} L 750 ${H} L 600 ${fork} L 480 ${fork} Z`;
  const left = `M 480 ${fork} L 560 ${fork} L 300 ${horizon + 4} L 262 ${horizon + 4} Z`;
  const right = `M 530 ${fork} L 600 ${fork} L 1080 ${horizon + 330} L 1080 ${horizon + 230} Z`;
  const leftMid = `M 520 ${fork} L 281 ${horizon + 4}`;
  return (
    <g>
      <defs>
        <linearGradient id="qd-pre" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05091a" />
          <stop offset=".75" stopColor="#1c2448" />
          <stop offset="1" stopColor="#6a5a6a" />
        </linearGradient>
        <radialGradient id="qd-aim">
          <stop offset="0" stopColor="#fff1c8" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff1c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="qd-dark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".85" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={horizon} fill="url(#qd-pre)" />
      <Stars t={t} bright={0.7} top={60} bottom={horizon - 200} />
      <ellipse cx={281} cy={horizon - 10} rx={240} ry={110} fill="url(#qd-aim)" opacity={0.3 + 0.7 * glow} />
      <rect x={0} y={horizon} width={W} height={H - horizon} fill="#06070c" />
      {/* the common road, then the fork */}
      <path d={stem} fill="#2a2b34" />
      <path d={left} fill={`rgb(${50 + 40 * glow},${46 + 34 * glow},${44 + 18 * glow})`} />
      <path d={right} fill="#262a38" />
      <path d={`M 330 ${H} L 480 ${fork} L 262 ${horizon + 4} M 750 ${H} L 600 ${fork} L 1080 ${horizon + 330}`} stroke={RIM} strokeWidth={3} fill="none" opacity={0.35} />
      {/* the left road lights up from the fork to the light */}
      <path d={`M 480 ${fork} L 262 ${horizon + 4} M 560 ${fork} L 300 ${horizon + 4}`} stroke={GOLD} strokeWidth={5} fill="none" strokeDasharray={`${560 * glow} 600`} opacity={0.9} />
      <path d={leftMid} stroke="#fff1c8" strokeWidth={3} fill="none" strokeDasharray="10 22" strokeDashoffset={-t * 30} opacity={0.5 * glow} />
      {/* the right road: stones, and the dark it goes into */}
      {Array.from({ length: 14 }, (_, i) => {
        const u = (i + 0.5) / 14;
        const x = 565 + (1040 - 565) * u + 30 * (chance(i, 20) - 0.5);
        const y = fork - (fork - (horizon + 280)) * u + 20 * (chance(i, 21) - 0.5);
        const r = (26 - 14 * u) * (0.7 + 0.6 * chance(i, 22));
        return <path key={i} d={`M ${x - r} ${y} L ${x - r * 0.4} ${y - r * 0.9} L ${x + r * 0.6} ${y - r * 0.7} L ${x + r} ${y} Z`} fill="#3a4058" stroke="#a8b0d4" strokeWidth={2.5} opacity={0.85 + 0.15 * hard} />;
      })}
      <path d={right} fill="url(#qd-dark)" opacity={0.3 + 0.4 * hard} />
    </g>
  );
};

// --------------------------------------------------------------------------------- 1. « النتيجة مكتوبة »

const AMAL = ["shut", "ground", "paths", "desk", "open", "dawn"];

const AmalPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(AMAL, show, since);
  // shut (« لو كل حاجة مكتوبة… أتعب ليه؟ »): bent over the book beside a stack of books, it writes, stops, closes it and
  // pushes it away; desk: it looks at the closed book; open: it opens it and writes; dawn: the morning, it stands up
  const close = ramp(t, at("shut") + 1.0, at("shut") + 1.6);
  const back = ramp(t, at("shut") + 1.5, at("shut") + 2.3);
  const reopen = ramp(t, at("open") + 0.3, at("open") + 1.2);
  const effort = 3 * Math.sin(t * 9) * (1 - close) * show("shut");
  let pose: Pose = mix({ ...MORE.study, armF: [MORE.study.armF[0] + effort, MORE.study.armF[1]] }, MORE.loll, back);
  pose = mix(pose, { ...POSES.desk, head: -18, torso: 12 }, show("desk") * (1 - reopen));
  const writing = 3 * Math.sin(t * 9) * reopen;
  pose = mix(pose, { ...MORE.study, armF: [MORE.study.armF[0] + writing, MORE.study.armF[1]] }, reopen);
  const rise = show("dawn") * ramp(t, at("dawn") + 0.6, at("dawn") + 1.6);
  pose = mix(pose, POSES.stand, rise);
  const open = (1 - close) * (1 - show("desk")) + reopen;
  const room = Math.max(show("shut"), show("desk"), show("open"), show("dawn"));
  const S = 1.3;
  const floor = horizon + 120;
  const seat = floor - 92 * S;
  const py = seat - (LEGS * S - 92 * S) * rise;
  const minutes = 23 * 60 + 10 + 60 * show("desk") + 300 * reopen + 120 * show("dawn") + (t - at("shut")) * 2;
  return (
    <>
      <g opacity={room}>
        <Study t={t} horizon={horizon} pose={pose} open={Math.min(1, open)} dawn={show("dawn")} minutes={minutes} lamp={1 - 0.6 * show("dawn")} py={py} px={350 + 30 * rise} />
      </g>
      <g opacity={show("ground")}>
        <Ground t={t} horizon={horizon} trace={at.cover ? 0.7 : ramp(t, at("ground") + 0.3, at("ground") + 9)} />
      </g>
      <g opacity={show("paths")}>
        <Paths t={t} horizon={horizon} glow={at.cover ? 0.6 : ramp(t, at("paths") + 1.5, at("paths") + 12)} hard={ramp(t, at("paths") + 10, at("paths") + 18)} />
      </g>
    </>
  );
};

// --------------------------------------------------------------------------------- 2. « لما ربنا يهديني »

/** The bedroom before dawn: the bed along the floor, the night table and its phone, the window, a prayer mat.
 * `ring` makes the phone shine and shake; `turned`: the figure has turned its back to the phone (0 to 1);
 * `up`: it sits up, then stands on the mat (0 to 2). */
const Bedroom: React.FC<{ t: number; horizon: number; dawn: number; ring: number; looked: number; turned: number; up: number; mat: number }> = ({ t, horizon, dawn, ring, looked, turned, up, mat }) => {
  const floor = horizon + 140;
  const bedTop = floor - 120;
  const S = 1.25;
  const shake = ring > 0 ? 3 * Math.sin(t * 60) * ring : 0;
  // lying: the figure on its back, the head on the pillow at the left; curled towards the wall when it turns away
  const sit = Math.min(1, up);
  const stand = Math.max(0, up - 1);
  const lying = mix({ ...POSES.stand, armF: [14, 20], armB: [8, 20] }, { ...POSES.stand, head: -10, armF: [150, 30], armB: [8, 20], legF: [30, -50], legB: [26, -46] }, turned);
  let pose = mix(lying, { ...lying, head: -34, torso: 8 }, looked * (1 - turned));
  pose = mix(pose, MORE.edge, sit);
  pose = mix(pose, POSES.stand, stand);
  const turn = -90 * (1 - sit);
  // lying on the mattress, then sitting on its edge, then standing on the mat
  const lieY = bedTop - 22;
  const sitY = bedTop + 6;
  const standY = floor + 60 - LEGS * S;
  const px = 444 + (640 - 444) * sit + (850 - 640) * stand;
  const py = lieY + (sitY - lieY) * sit + (standY - sitY) * stand;
  const facing = 1;
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={`rgb(${12 + 22 * dawn},${16 + 22 * dawn},${32 + 20 * dawn})`} />
      <Window id="qs-win" x={620} y={horizon - 780} w={360} h={440} t={t} dawn={dawn} moon={false} />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#05070d" />
      <path d={`M 620 ${floor} L 980 ${floor} L 1080 ${floor + 240} L 700 ${floor + 240} Z`} fill={LAMP} opacity={0.14 * dawn} />
      {/* the prayer mat, rolled and standing in the corner (what it « can't start »), then unrolled on the floor */}
      <g opacity={1 - mat}>
        <rect x={1000} y={floor - 230} width={46} height={230} rx={22} fill="#3a1f2a" stroke={GOLD} strokeWidth={3} strokeOpacity={0.35 + 0.4 * looked} />
        <ellipse cx={1023} cy={floor - 228} rx={22} ry={8} fill="#2a1520" stroke={GOLD} strokeWidth={2} strokeOpacity={0.6} />
        <ellipse cx={1023} cy={floor - 120} rx={70} ry={150} fill={GOLD} opacity={0.08 * looked} />
      </g>
      <g opacity={mat}>
        <path d={`M 690 ${floor + 30} L 1010 ${floor + 30} L 1060 ${floor + 150} L 650 ${floor + 150} Z`} fill="#3a1f2a" />
        <path d={`M 760 ${floor + 140} Q 850 ${floor + 40} 940 ${floor + 140}`} stroke={GOLD} strokeWidth={4} fill="none" opacity={0.7} />
      </g>
      {/* the bed */}
      <rect x={150} y={bedTop} width={560} height={60} rx={14} fill="#0e1322" />
      <rect x={140} y={bedTop + 50} width={580} height={30} rx={8} fill={INK} />
      <rect x={150} y={bedTop + 80} width={16} height={floor - bedTop - 80} fill={INK} />
      <rect x={694} y={bedTop + 80} width={16} height={floor - bedTop - 80} fill={INK} />
      <rect x={140} y={bedTop - 150} width={26} height={230} rx={8} fill={INK} />
      <ellipse cx={230} cy={bedTop - 6} rx={70} ry={26} fill="#151b30" />
      <Figure id="qs-fig" x={px} y={py} scale={S} pose={pose} facing={facing} turn={turn} rim={RIM} lit={0.7 * ring * (1 - turned * 0.6)} light="#cfe0ff" />
      {/* the blanket over the lying figure, gone once it sits up */}
      <path d={`M ${300 - 130 * turned} ${bedTop + 4} Q ${300 - 110 * turned} ${bedTop - 60 - 40 * turned} ${430 - 40 * turned} ${bedTop - 64 - 16 * turned} Q 600 ${bedTop - 70} 690 ${bedTop - 10} L 700 ${bedTop + 40} L ${300 - 130 * turned} ${bedTop + 40} Z`} fill="#1a2140" stroke={RIM} strokeWidth={2} strokeOpacity={0.35} opacity={1 - sit} />
      {/* the night table and the phone */}
      <rect x={30} y={floor - 170} width={100} height={170} fill={INK} />
      <g transform={`translate(${80 + shake} ${floor - 186})`}>
        <ellipse cx={0} cy={-30} rx={90 * ring} ry={60 * ring} fill="#cfe0ff" opacity={0.25 * ring} />
        <rect x={-18} y={-34} width={36} height={60} rx={6} fill="#0a0d18" />
        <rect x={-14} y={-30} width={28} height={50} rx={4} fill="#cfe0ff" opacity={0.15 + 0.8 * ring} />
      </g>
    </g>
  );
};

const SHAA = ["turn", "words", "rise"];

const ShaaPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(SHAA, show, since);
  // turn: the phone rings, the figure turns away; words: the window, the end of the night; rise: the phone rings again,
  // it sits up, stands on the mat, raises its hands; the morning comes
  const ring1 = show("turn") * (at.cover ? 1 : ramp(t, at("turn"), at("turn") + 0.3) * (1 - ramp(t, at("turn") + 2.6, at("turn") + 3.0)));
  // the hook (« عارف إنك لازم تصلي… ومش قادر تبدأ؟ »): the phone rings, it raises its head towards the rolled mat, then
  // pulls the blanket over its head
  const looked = show("turn") * (at.cover ? 1 : ramp(t, at("turn") + 0.5, at("turn") + 1.1));
  const turned = Math.max(ramp(t, at("turn") + 1.7, at("turn") + 2.5) * (1 - show("rise")), show("words") * (1 - show("rise")));
  const ring2 = show("rise") * ramp(t, at("rise"), at("rise") + 0.3) * (1 - ramp(t, at("rise") + 1.6, at("rise") + 2.0));
  // it sits up, unrolls the mat, stands on it
  const up = show("rise") * (ramp(t, at("rise") + 1.6, at("rise") + 2.4) + ramp(t, at("rise") + 3.2, at("rise") + 4.2));
  const unrolled = show("rise") * ramp(t, at("rise") + 2.4, at("rise") + 3.2);
  const dawn = show("rise") * ramp(t, at("rise") + 1.0, at("rise") + 10);
  const close = show("words");
  return (
    <>
      <g opacity={1 - close}>
        <Bedroom t={t} horizon={horizon} dawn={dawn} ring={Math.max(ring1, ring2)} looked={looked} turned={turned} up={up} mat={unrolled} />
      </g>
      <g opacity={close}>
        {/* close on the window: the last stars, the first light along the roofs */}
        <rect x={0} y={0} width={W} height={H} fill="#0a0e1c" />
        <Window id="qs-near" x={90} y={horizon - 980} w={900} h={1000} t={t} dawn={0.18 * ramp(t, at("words"), at("words") + 20)} moon={false} />
      </g>
    </>
  );
};

// --------------------------------------------------------------------------------------------- 3. « لو »

/** A street at night: a building, the shop with its shutter down, a street lamp, the step where the figure sits. */
const Street: React.FC<{ t: number; horizon: number; dawn: number; lamp: number; tilt: number }> = ({ t, horizon, dawn, lamp, tilt }) => {
  const floor = horizon + 160;
  return (
    <g transform={`translate(0 ${tilt})`}>
      <defs>
        <linearGradient id="ql-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`rgb(${3 + 40 * dawn},${6 + 70 * dawn},${20 + 130 * dawn})`} />
          <stop offset="1" stopColor={`rgb(${16 + 210 * dawn},${24 + 130 * dawn},${56 + 60 * dawn})`} />
        </linearGradient>
        <radialGradient id="ql-cone">
          <stop offset="0" stopColor={LAMP} stopOpacity=".55" />
          <stop offset="1" stopColor={LAMP} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={-1400} width={W} height={1400 + horizon} fill="url(#ql-sky)" />
      <Stars t={t} bright={(1 - dawn * 1.4) * 0.9} top={-1350} bottom={horizon - 900} count={160} />
      {/* the building */}
      <rect x={60} y={horizon - 1000} width={960} height={1000 + 160} fill="#0b0e18" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={140 + (i % 3) * 300} y={horizon - 900 + Math.floor(i / 3) * 220} width={120} height={150} fill={chance(i, 30) > 0.6 ? "#3a3020" : "#05070d"} opacity={0.9} />
      ))}
      {/* the shop: its sign, its shutter down */}
      <rect x={220} y={horizon - 420} width={640} height={70} fill="#070910" stroke="#2a3150" strokeWidth={3} />
      <rect x={240} y={horizon - 340} width={600} height={floor - (horizon - 340)} fill="#141826" />
      {Array.from({ length: 22 }, (_, i) => (
        <path key={i} d={`M 240 ${horizon - 330 + i * 22} L 840 ${horizon - 330 + i * 22}`} stroke="#2a3048" strokeWidth={4} />
      ))}
      <rect x={520} y={floor - 30} width={40} height={14} rx={4} fill="#5a5f70" />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#04050a" />
      <rect x={0} y={floor - 6} width={W} height={46} fill="#0a0c14" />
      {/* the street lamp */}
      <ellipse cx={940} cy={floor - 40} rx={320} ry={150} fill="url(#ql-cone)" opacity={lamp} />
      <path d={`M 990 ${floor} L 990 ${horizon - 560} Q 990 ${horizon - 620} 930 ${horizon - 620}`} stroke={INK} strokeWidth={14} fill="none" />
      <path d={`M 900 ${horizon - 625} L 960 ${horizon - 625} L 945 ${horizon - 600} L 915 ${horizon - 600} Z`} fill={INK} />
      <ellipse cx={930} cy={horizon - 596} rx={18} ry={6} fill={LAMP} opacity={lamp} />
    </g>
  );
};

/** The shop with its shutter down, small: a memory in the dark room. (x, y): its middle; `shown` 0 to 1. */
const ShopMemory: React.FC<{ x: number; y: number; shown: number; t: number }> = ({ x, y, shown, t }) => (
  <g opacity={shown * (0.75 + 0.1 * Math.sin(t * 1.3))}>
    <defs>
      <radialGradient id="ql-mem">
        <stop offset="0" stopColor="#2a3150" stopOpacity=".9" />
        <stop offset="1" stopColor="#2a3150" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y} rx={260} ry={170} fill="url(#ql-mem)" />
    <rect x={x - 150} y={y - 110} width={300} height={34} fill="#070910" stroke="#5a6488" strokeWidth={2} />
    <rect x={x - 140} y={y - 70} width={280} height={170} fill="#141826" stroke="#5a6488" strokeWidth={2} />
    {Array.from({ length: 11 }, (_, i) => (
      <path key={i} d={`M ${x - 140} ${y - 60 + i * 15} L ${x + 140} ${y - 60 + i * 15}`} stroke="#3a4262" strokeWidth={3} />
    ))}
  </g>
);

/** A bedroom at three in the morning: a small window and its curtains, the clock at 3:00, the bed on the right; the
 * figure sits on its edge, the head in its hands. */
const Insomnia: React.FC<{ t: number; horizon: number; pose: Pose }> = ({ t, horizon, pose }) => {
  const floor = horizon + 140;
  const bedTop = floor - 120;
  const S = 1.25;
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill="#0c1020" />
      <Window id="ql-win" x={110} y={horizon - 560} w={260} h={320} t={t} dawn={0} moon={false} />
      <path d={`M 90 ${horizon - 580} Q 130 ${horizon - 380} 100 ${horizon - 220} L 80 ${horizon - 220} L 80 ${horizon - 580} Z M 390 ${horizon - 580} Q 350 ${horizon - 380} 380 ${horizon - 220} L 400 ${horizon - 220} L 400 ${horizon - 580} Z`} fill="#1a1f36" />
      <Clock x={900} y={horizon - 470} r={62} minutes={180} />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#05070d" />
      {/* the bed, the figure on its edge */}
      <rect x={480} y={bedTop} width={580} height={60} rx={14} fill="#0e1322" />
      <rect x={470} y={bedTop + 50} width={600} height={30} rx={8} fill={INK} />
      <rect x={484} y={bedTop + 80} width={16} height={floor - bedTop - 80} fill={INK} />
      <rect x={1040} y={bedTop - 150} width={26} height={230} rx={8} fill={INK} />
      <ellipse cx={960} cy={bedTop - 6} rx={70} ry={26} fill="#151b30" />
      <path d={`M 700 ${bedTop + 4} Q 820 ${bedTop - 30} 1000 ${bedTop - 4} L 1010 ${bedTop + 40} L 700 ${bedTop + 40} Z`} fill="#1a2140" />
      <Figure id="ql-fig-room" x={560} y={bedTop + 8} scale={S} pose={pose} facing={-1} rim={RIM} lit={0.25} light="#cfe0ff" />
    </g>
  );
};

/** The « لو » around the figure: `count` how many have come (0 to N); `fade` 0 to 1 takes them away. */
const Ifs: React.FC<{ t: number; horizon: number; count: number; fade: number }> = ({ t, horizon, count, fade }) => (
  <g>
    {Array.from({ length: 16 }, (_, i) => {
      const shown = Math.min(1, Math.max(0, count - i));
      if (shown <= 0) return null;
      const x = 120 + 840 * chance(i, 40);
      const y = horizon - 520 + 620 * chance(i, 41) - 12 * Math.sin(t * 0.8 + i);
      const size = (80 + 110 * chance(i, 42)) * (0.6 + 0.4 * shown);
      const o = shown * (1 - fade) * (0.6 + 0.4 * chance(i, 43));
      return (
        <text key={i} x={x} y={y + 30 * fade * (1 + chance(i, 44))} fontFamily={FONT.arabic} fontSize={size} fill="#e8eefc" opacity={o} textAnchor="middle">
          لو
        </text>
      );
    })}
  </g>
);

const LAW = ["shop", "law", "night", "calm", "dawn"];

const LawPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(LAW, show, since);
  // shop (« بتفضل تعيد اللي حصل في دماغك… كل ليلة؟ »): 3 a.m., on the edge of the bed, the head sinks into the hands, the
  // closed shop comes as a memory; law: the « لو » come one after the other; night: the sky through the window (57:22);
  // calm: back in the street at the shop, it locks the shutter; dawn: it walks away
  const S = 1.3;
  const floor = horizon + 160;
  const sink = at.cover ? 1 : ramp(t, at("shop") + 0.3, at("shop") + 1.4);
  const roomPose = mix(MORE.edge, MORE.despair, sink);
  const memory = at.cover ? 0.8 : Math.max(show("shop") * ramp(t, at("shop") + 1.2, at("shop") + 2.4), show("law"));
  const count = at.cover ? (show("law") ? 12 : 0) : show("law") > 0 ? ramp(t, at("law") - 0.2, at("law") + 2.2) * 9 + ramp(t, at("law") + 2.2, at("law") + 12) * 7 : 0;
  const room = Math.max(show("shop"), show("law"));
  const street = Math.max(show("calm"), show("dawn"));
  // in the street: bent to the lock, then upright, then walking away
  const lock = show("calm") * (1 - ramp(t, at("calm") + 9, at("calm") + 10.5));
  const go = show("dawn") * interpolate(t, [at("dawn") + 0.5, at("dawn") + 6], [0, 1], CLAMP);
  let pose: Pose = mix(POSES.stand, { torso: 28, head: -24, armF: [38, 30], armB: [18, 14], legF: [6, -4], legB: [-6, -2] }, lock);
  if (go > 0 && go < 1) pose = walk(go * 9 * Math.PI);
  const px = 540 + 440 * go;
  const py = floor - LEGS * S;
  const dawn = show("dawn") * ramp(t, at("dawn"), at("dawn") + 6);
  return (
    <>
      <g opacity={street}>
        <Street t={t} horizon={horizon} dawn={dawn} lamp={1 - dawn} tilt={0} />
        <Figure id="ql-fig" x={px} y={py} scale={S} pose={pose} facing={1} rim={RIM} lit={0.5 * (1 - dawn)} light={LAMP} />
      </g>
      <g opacity={show("night")}>
        {/* close on the window of the room: the sky of three in the morning, the moon */}
        <rect x={0} y={0} width={W} height={H} fill="#0a0e1c" />
        <Window id="ql-near" x={90} y={horizon - 980} w={900} h={1000} t={t} dawn={0} moon={false} />
      </g>
      <g opacity={room}>
        <Insomnia t={t} horizon={horizon} pose={roomPose} />
        <ShopMemory x={540} y={horizon - 300} shown={memory} t={t} />
        <Ifs t={t} horizon={horizon} count={count} fade={0} />
      </g>
    </>
  );
};

export const QADAR_PICTURES: Record<string, Drawn> = { amal: AmalPicture, shaa: ShaaPicture, law: LawPicture };

// ------------------------------------------------------------------------------------- the film (16:9)

/** The same scenes in the film (1920 x 1080): the vertical drawing, cut around its action (the window, the figure,
 * the floor: y 640 to 1990 of the 9:16 frame, below the chapter tag) and scaled to the height of the frame, on the left; its right edge
 * fades into the night, the text sits on the right. The drawing keeps its own horizon (the 9:16 one). */
const WIDE_SCALE = 0.8;
const WIDE_TOP = 640;
const WIDE_HORIZON = 1260;
const wide = (Picture: Drawn, ground: string): Drawn => {
  const Wide: Drawn = (props) => {
    const right = W * WIDE_SCALE;
    return (
      <>
        <defs>
          <linearGradient id={`qw-edge-${ground.slice(1)}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={ground} stopOpacity={0} />
            <stop offset="1" stopColor={ground} stopOpacity={1} />
          </linearGradient>
        </defs>
        <g transform={`translate(0 ${-WIDE_TOP * WIDE_SCALE}) scale(${WIDE_SCALE})`}>
          <Picture {...props} horizon={WIDE_HORIZON} />
        </g>
        <rect x={right - 160} y={0} width={162} height={1080} fill={`url(#qw-edge-${ground.slice(1)})`} />
      </>
    );
  };
  return Wide;
};

export const QADAR_WIDE: Record<string, Drawn> = { amal: wide(AmalPicture, "#0a1230"), shaa: wide(ShaaPicture, "#0a1230"), law: wide(LawPicture, "#0a1230") };
