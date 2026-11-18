// The People of the Cave in short version (content/trial/kahf.yaml: refuge, sunpath, awake; docs/themes.md). Nobody is
// drawn, ever: not the young men (people of a story of the Quran), not their number. Their way is a single trail of
// steps, so that no count is suggested (18:22: « ربي أعلم بعدتهم »). Things and places only: the city behind, the rock
// and the mouth of the cave, the light of the sun on its walls, the years counted in gold, the city again at dawn.
// Backlit shapes over a filmed sky, like every drawing of the model; nothing of the unseen.
import React from "react";
import { Easing, interpolate } from "remotion";
import { FONT } from "../fonts";
import { Footprints } from "./Ayah";
import { Land } from "./Home";
import { Dwellings } from "./Qarnayn";
import type { Drawn } from "./Trial";

const W = 1080;
const H = 1920;
const INK = "#05060d";
const LIGHT = "#ffd9a0";
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
const arabic = (n: number) => String(n);      // the owner, 2026-11-17: numbers are written 1 2 3, never 1 2 3 (CLAUDE.md)

/** When each scene starts. In the video: when its segment first starts. On a cover (every scene starts at 0 and only
 * the cover's own scene is shown), the scenes before the cover's are long over and the ones after it far away. */
const timeline = (order: string[], show: (id: string) => number, since: (id: string) => number) => {
  const cover = since(order[0]) === since(order[order.length - 1]) ? order.find((id) => show(id) === 1) : undefined;
  const at = (id: string) => (cover === undefined ? since(id) : (order.indexOf(id) - order.indexOf(cover)) * 100);
  return Object.assign(at, { cover: cover !== undefined });
};

// ------------------------------------------------------------------------------------------------------------ rock

// The outline of a rock, in its own units, the middle of the cave's mouth at (0, 0) on the ground: `hill` rises on the
// right of its mouth and runs out of the frame; `crag` stands on both sides of it.
const OUTLINE = {
  hill: "M -430 24 C -370 -40 -310 -120 -240 -170 C -190 -206 -150 -200 -108 -240 C -66 -280 -14 -302 40 -292 C 110 -278 152 -322 212 -332 C 282 -344 344 -302 404 -262 C 464 -222 524 -202 640 -192",
  crag: "M -580 30 C -520 -10 -480 -110 -410 -150 L -340 -142 C -300 -220 -232 -292 -150 -304 L -100 -276 C -50 -326 30 -348 104 -318 C 164 -296 206 -246 258 -238 C 330 -226 382 -176 424 -116 C 470 -58 520 -12 580 30",
};
const MOUTH = "M -72 14 L -72 -58 C -72 -118 72 -118 72 -58 L 72 14 Z";

/** A rock and the mouth of a cave at its foot. (x, y): the middle of the mouth on the ground. `inner`: a warm light
 * inside the mouth (0: none); `air`: pale motes drifting in and out of it (0: none); `left`, `right`: the sun on that
 * side of the rock (0 to 1), never inside the mouth. */
const Rock: React.FC<{ id: string; x: number; y: number; scale: number; shape: keyof typeof OUTLINE; rim: string; t: number; inner?: number; air?: number; left?: number; right?: number }> = ({ id, x, y, scale, shape, rim, t, inner = 0, air = 0, left = 0, right = 0 }) => {
  const top = OUTLINE[shape];
  const end = shape === "hill" ? 640 : 580;  // the crag stands on both sides of its mouth
  const body = `${top} L ${end} 90 L ${shape === "hill" ? -430 : -580} 90 Z`;
  const flicker = 0.88 + 0.12 * Math.sin(t * 1.7) * Math.sin(t * 0.5 + 1);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <clipPath id={`${id}-body`}>
          <path d={body} />
        </clipPath>
        <radialGradient id={`${id}-in`} cx="50%" cy="85%" r="75%">
          <stop offset="0" stopColor={LIGHT} stopOpacity={0.85} />
          <stop offset="1" stopColor={LIGHT} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-r`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={LIGHT} stopOpacity={0.55} />
          <stop offset=".55" stopColor={LIGHT} stopOpacity={0.08} />
          <stop offset="1" stopColor={LIGHT} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffb877" stopOpacity={0.55} />
          <stop offset=".55" stopColor="#ffb877" stopOpacity={0.08} />
          <stop offset="1" stopColor="#ffb877" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={body} fill={INK} />
      {/* the sun on one wall of the rock: a warm wash on that side, never past the mouth */}
      <g clipPath={`url(#${id}-body)`}>
        <rect x={80} y={-420} width={600} height={520} fill={`url(#${id}-r)`} opacity={right} />
        <rect x={-680} y={-420} width={600} height={520} fill={`url(#${id}-l)`} opacity={left} />
        {/* cracks and ledges of the rock */}
        {Array.from({ length: 9 }, (_, k) => {
          const cx = (chance(k, 3) - 0.5) * (shape === "hill" ? 900 : 1000) + (shape === "hill" ? 120 : 0);
          const cy = -40 - chance(k, 4) * 240;
          return <path key={k} d={`M ${cx} ${cy} l ${18 + 30 * chance(k, 5)} ${-14 - 20 * chance(k, 6)} l ${20 * chance(k, 7)} ${-12}`} stroke={rim} strokeWidth={2} fill="none" opacity={0.14} />;
        })}
      </g>
      <path d={top} fill="none" stroke={rim} strokeWidth={3.2} opacity={0.5} />
      <path d={top} fill="none" stroke={LIGHT} strokeWidth={3.2} opacity={0.55 * Math.max(left, right)} />
      {/* the mouth: dark, whatever the sun does */}
      <path d={MOUTH} fill="#010103" />
      {inner > 0 ? <path d={MOUTH} fill={`url(#${id}-in)`} opacity={inner * flicker} /> : null}
      {air > 0
        ? Array.from({ length: 14 }, (_, k) => {
            // a mote crosses the mouth slowly, in and out, each at its own height and pace
            const pace = 0.05 + 0.05 * chance(k, 1);
            const u = (t * pace + chance(k, 2)) % 1;
            const mx = -110 + 220 * u;
            const my = -12 - 82 * chance(k, 3) + 6 * Math.sin(t * 0.9 + k);
            return <circle key={k} cx={mx} cy={my} r={2 + 2 * chance(k, 4)} fill="#dfe8ff" opacity={air * 0.55 * Math.sin(Math.PI * u)} />;
          })
        : null}
      <path d={MOUTH} fill="none" stroke={rim} strokeWidth={2.2} opacity={0.4} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------- refuge

/** Short 1 (18:10): `leave`, the city at night behind, a trail of steps going away from it towards the rock; `cave`,
 * the steps reach the mouth, a warm light inside it (the mercy they asked for); `dawn`, the sky lightens over the rock.
 * One trail of steps, never several: their number is not told. */
const RefugePicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(["leave", "cave", "dawn"], show, since);
  const rim = "#b9c6e6";
  const going = at.cover ? 0.55 : interpolate(t - at("leave"), [0, 9], [0.14, 0.86], { ...CLAMP, easing: Easing.out(Easing.quad) });
  const walked = Math.min(1, Math.max(going, show("cave") + show("dawn")));
  const inner = 0.45 * show("cave") + 0.75 * show("dawn");
  const dawn = show("dawn") * ramp(t - at("dawn"), 0, 6);
  return (
    <>
      <defs>
        <linearGradient id="kr-dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb877" stopOpacity={0} />
          <stop offset=".7" stopColor="#ffb877" stopOpacity={0.22} />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <rect x={0} y={horizon - 620} width={W} height={640} fill="url(#kr-dawn)" opacity={dawn} />
      <Dwellings id="kr-city" x={170} y={horizon + 18} scale={0.34} t={t} lit={dawn > 0.5 ? 2 : 5} rim={rim} />
      <Land id="kr-land" horizon={horizon} rim={rim} />
      <Rock id="kr-rock" x={800} y={horizon + 30} scale={1.22} shape="hill" rim={rim} t={t} inner={inner} />
      <Footprints trails={[{ from: [270, horizon + 40], to: [770, horizon + 44], bend: 74 }]} shown={walked} ink="#cdd6ee" />
    </>
  );
};

// --------------------------------------------------------------------------------------------------------- sunpath

/** Short 2 (18:17): `rise`, the sun low on one side of the rock, its light on that wall only; `path`, during the verse
 * the sun goes over and down on the other side, the light passes from one wall to the other and never enters the
 * mouth; `inside`, the sun gone down, the mouth wide and dark, a breath of air going in and out of it. The filmed sun
 * stays behind the rock (its glow is the rock's backlight): only the drawn one moves. */
const SunpathPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(["rise", "path", "inside"], show, since);
  const rim = "#ffd2a0";
  // how far the sun has gone over the sky, 0 low on the right, 1 down on the left
  const rising = at.cover ? 0.1 : interpolate(t - at("rise"), [0, 12], [0.04, 0.12], CLAMP);
  const crossing = at.cover ? 0.12 : interpolate(t - at("path"), [0, 30], [0.12, 0.97], { ...CLAMP, easing: Easing.inOut(Easing.sin) });
  const u = show("inside") > 0.5 ? 1.08 : Math.max(rising, show("path") > 0 ? crossing : rising);
  const sx = 540 + 460 * Math.cos(Math.PI * u);
  const sy = horizon - 70 - 480 * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
  // its path over the sky, dashed, while the verse says it
  const arc = `M 1000 ${horizon - 70} A 460 480 0 0 0 80 ${horizon - 70}`;
  const up = interpolate(u, [1, 1.06], [1, 0], CLAMP);
  const right = Math.max(0, Math.cos(Math.PI * u)) * up;
  const left = Math.max(0, -Math.cos(Math.PI * u)) * up;
  return (
    <>
      <defs>
        <radialGradient id="ks-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff4dc" />
          <stop offset=".35" stopColor="#ffd9a0" stopOpacity={0.9} />
          <stop offset="1" stopColor="#ffb877" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={arc} fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray="4 16" strokeLinecap="round" opacity={0.45 * show("path")} />
      <g opacity={up}>
        <circle cx={sx} cy={sy} r={180} fill="url(#ks-sun)" opacity={0.6} />
        <circle cx={sx} cy={sy} r={42} fill="#fff1d6" />
      </g>
      <Land id="ks-land" horizon={horizon} rim={rim} top="#140f0b" />
      <Rock id="ks-rock" x={560} y={horizon + 34} scale={0.9} shape="crag" rim={rim} t={t} right={right} left={left} air={show("inside")} />
    </>
  );
};

// ----------------------------------------------------------------------------------------------------------- awake

/** Short 3 (18:19, 18:25): seen from inside the cave, its mouth a great arch on the filmed sky. `years`, days and
 * nights go by in the arch while the years are counted in gold up to ٣٠٩ (the count of 18:25, said by the hook);
 * `wake`, the light comes in on the floor; `dawn`, the old city far off under the sunrise, the count gone. */
const AwakePicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(["years", "wake", "dawn"], show, since);
  const floor = horizon + 70;
  const arch = `M 170 ${floor} L 170 ${floor - 420} C 170 ${floor - 700} 360 ${floor - 800} 540 ${floor - 800} C 720 ${floor - 800} 910 ${floor - 700} 910 ${floor - 420} L 910 ${floor} Z`;
  // the count: from the first frame, slower and slower, up to 309 at three seconds; held after
  const p = at.cover ? 1 : interpolate(t - at("years"), [0.15, 3.0], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const years = Math.max(1, Math.round(309 * p));
  // days and nights in the arch while it counts: fast, then slower, then still
  const turning = at.cover ? 0 : (1 - p) * show("years");
  const night = turning * (0.5 + 0.5 * Math.sin(2 * Math.PI * (1.6 * (t - at("years")) + 3.2 * p)));
  const counted = show("years");
  const light = show("wake") + show("dawn");
  const city = show("dawn") * ramp(t - at("dawn"), 0.3, 3);
  return (
    <>
      <defs>
        <clipPath id="ka-arch">
          <path d={arch} />
        </clipPath>
        <linearGradient id="ka-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LIGHT} stopOpacity={0.5} />
          <stop offset="1" stopColor={LIGHT} stopOpacity={0} />
        </linearGradient>
        <filter id="ka-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      {/* the days and nights going by, inside the arch only */}
      <g clipPath="url(#ka-arch)">
        <rect x={0} y={0} width={W} height={H} fill="#02030a" opacity={0.78 * night} />
        <g opacity={city}>
          <Dwellings id="ka-city" x={540} y={floor - 30} scale={0.3} t={t} lit={0} rim="#ffd2a0" />
        </g>
      </g>
      {/* the cave around the arch: its walls, its ceiling, its floor */}
      <path d={`M -20 -20 H ${W + 20} V ${H + 20} H -20 Z ${arch}`} fill={INK} fillRule="evenodd" opacity={0.96} />
      <path d={arch} fill="none" stroke="#b9c6e6" strokeWidth={3.5} opacity={0.45} />
      {/* the light coming in on the floor */}
      <path d={`M 170 ${floor} L 910 ${floor} L ${W + 40} ${H} L -40 ${H} Z`} fill="url(#ka-beam)" opacity={0.75 * light} />
      {/* the years, in gold */}
      <g opacity={counted}>
        <text x={540} y={floor - 330} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={210} fill={GOLD} filter="url(#ka-glow)" opacity={0.6}>
          {arabic(years)}
        </text>
        <text x={540} y={floor - 330} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={210} fill={GOLD}>
          {arabic(years)}
        </text>
      </g>
    </>
  );
};

export const KAHF_PICTURES: Record<string, Drawn> = { refuge: RefugePicture, sunpath: SunpathPicture, awake: AwakePicture };

// ------------------------------------------------------------------------------------------------------------ wide

// The same drawings for the film (16:9, 1920 x 1080): on the left of the frame, the text on the right.
const WW = 1920;

/** Short 1, wide: the city on the far left, the trail, the rock and its mouth. */
const RefugeWide: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(["leave", "cave", "dawn"], show, since);
  const rim = "#b9c6e6";
  const going = at.cover ? 0.55 : interpolate(t - at("leave"), [0, 9], [0.14, 0.86], { ...CLAMP, easing: Easing.out(Easing.quad) });
  const walked = Math.min(1, Math.max(going, show("cave") + show("dawn")));
  const dawn = show("dawn") * ramp(t - at("dawn"), 0, 6);
  return (
    <>
      <defs>
        <linearGradient id="krw-dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb877" stopOpacity={0} />
          <stop offset=".7" stopColor="#ffb877" stopOpacity={0.22} />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <rect x={0} y={horizon - 520} width={WW} height={540} fill="url(#krw-dawn)" opacity={dawn} />
      <Dwellings id="krw-city" x={190} y={horizon + 14} scale={0.3} t={t} lit={dawn > 0.5 ? 2 : 5} rim={rim} />
      <Land id="krw-land" horizon={horizon} rim={rim} width={WW} />
      <Rock id="krw-rock" x={760} y={horizon + 24} scale={0.95} shape="hill" rim={rim} t={t} inner={0.45 * show("cave") + 0.75 * show("dawn")} />
      <Footprints trails={[{ from: [250, horizon + 30], to: [740, horizon + 34], bend: 48 }]} shown={walked} ink="#cdd6ee" />
    </>
  );
};

/** Short 2, wide: the crag in front of the filmed sun (the whole clip shows here: the rock hides its sun and takes its
 * backlight), the drawn sun going over it along its dashed path. */
const SunpathWide: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(["rise", "path", "inside"], show, since);
  const rim = "#ffd2a0";
  const cx = 900;
  const rising = at.cover ? 0.1 : interpolate(t - at("rise"), [0, 12], [0.04, 0.12], CLAMP);
  const crossing = at.cover ? 0.12 : interpolate(t - at("path"), [0, 30], [0.12, 0.97], { ...CLAMP, easing: Easing.inOut(Easing.sin) });
  const u = show("inside") > 0.5 ? 1.08 : Math.max(rising, show("path") > 0 ? crossing : rising);
  const sx = cx + 400 * Math.cos(Math.PI * u);
  const sy = horizon - 60 - 400 * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
  const up = interpolate(u, [1, 1.06], [1, 0], CLAMP);
  return (
    <>
      <defs>
        <radialGradient id="ksw-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff4dc" />
          <stop offset=".35" stopColor="#ffd9a0" stopOpacity={0.9} />
          <stop offset="1" stopColor="#ffb877" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={`M ${cx + 400} ${horizon - 60} A 400 400 0 0 0 ${cx - 400} ${horizon - 60}`} fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray="4 16" strokeLinecap="round" opacity={0.45 * show("path")} />
      <g opacity={up}>
        <circle cx={sx} cy={sy} r={150} fill="url(#ksw-sun)" opacity={0.6} />
        <circle cx={sx} cy={sy} r={34} fill="#fff1d6" />
      </g>
      <Land id="ksw-land" horizon={horizon} rim={rim} top="#140f0b" width={WW} />
      <Rock id="ksw-rock" x={cx} y={horizon + 30} scale={1.05} shape="crag" rim={rim} t={t} right={Math.max(0, Math.cos(Math.PI * u)) * up} left={Math.max(0, -Math.cos(Math.PI * u)) * up} air={show("inside")} />
    </>
  );
};

/** Short 3, wide: the arch of the cave's mouth on the left, the count in it; the rest of the frame is the cave. */
const AwakeWide: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(["years", "wake", "dawn"], show, since);
  const floor = horizon + 40;
  const arch = `M 240 ${floor} L 240 ${floor - 300} C 240 ${floor - 500} 400 ${floor - 580} 570 ${floor - 580} C 740 ${floor - 580} 900 ${floor - 500} 900 ${floor - 300} L 900 ${floor} Z`;
  const p = at.cover ? 1 : interpolate(t - at("years"), [0.15, 3.0], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const years = Math.max(1, Math.round(309 * p));
  const turning = at.cover ? 0 : (1 - p) * show("years");
  const night = turning * (0.5 + 0.5 * Math.sin(2 * Math.PI * (1.6 * (t - at("years")) + 3.2 * p)));
  const light = show("wake") + show("dawn");
  const city = show("dawn") * ramp(t - at("dawn"), 0.3, 3);
  return (
    <>
      <defs>
        <clipPath id="kaw-arch">
          <path d={arch} />
        </clipPath>
        <linearGradient id="kaw-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LIGHT} stopOpacity={0.5} />
          <stop offset="1" stopColor={LIGHT} stopOpacity={0} />
        </linearGradient>
        <filter id="kaw-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <g clipPath="url(#kaw-arch)">
        <rect x={0} y={0} width={WW} height={1080} fill="#02030a" opacity={0.78 * night} />
        <g opacity={city}>
          <Dwellings id="kaw-city" x={570} y={floor - 24} scale={0.26} t={t} lit={0} rim="#ffd2a0" />
        </g>
      </g>
      <path d={`M -20 -20 H ${WW + 20} V 1100 H -20 Z ${arch}`} fill={INK} fillRule="evenodd" opacity={0.96} />
      <path d={arch} fill="none" stroke="#b9c6e6" strokeWidth={3} opacity={0.45} />
      <path d={`M 240 ${floor} L 900 ${floor} L 1020 1080 L 120 1080 Z`} fill="url(#kaw-beam)" opacity={0.75 * light} />
      <g opacity={show("years")}>
        <text x={570} y={floor - 230} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={170} fill={GOLD} filter="url(#kaw-glow)" opacity={0.6}>
          {arabic(years)}
        </text>
        <text x={570} y={floor - 230} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={170} fill={GOLD}>
          {arabic(years)}
        </text>
      </g>
    </>
  );
};

export const KAHF_WIDE: Record<string, Drawn> = { refuge: RefugeWide, sunpath: SunpathWide, awake: AwakeWide };
