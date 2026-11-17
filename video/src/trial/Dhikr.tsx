// The series « ذكر وحكايته » (content/trial/dhikr.yaml: aqrab, qul, dathur; docs/themes.md): a dhikr and the story of its
// hadith. Nobody is drawn: not the Prophet ﷺ, not the man stung, not the Companion of the rainy night, not the poor nor
// the rich (people of a hadith). Things and places only: the scorpion on its stone at nightfall and a door shut for the
// night (aqrab); the rain, a lantern on the way, then three keys for three surahs (qul); coins and a purse, prayer beads
// counted 33 · 33 · 33, a track that runs to the horizon at dawn, a prayer mat (dathur). Nothing is drawn while a
// surah that speaks of Allah is recited (112): the clip alone. Backlit shapes over a filmed sky, like every drawing of
// the model; nothing of the unseen (Paradise, named in 57:21, is text and recitation only).
import React from "react";
import { Easing, interpolate } from "remotion";
import { FONT } from "../fonts";
import { Lantern, Purse, Rain, Stars } from "./Ayah";
import { House, Land } from "./Home";
import type { Drawn } from "./Trial";

const W = 1080;
const INK = "#05060d";
const LIGHT = "#ffd9a0";
const GOLD = "#f0c46a";
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
/** 0 before `a`, 1 after `b`, eased between. */
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...CLAMP, easing: ease });
/** A number between 0 and 1 from an index: the same at every frame (the render draws frames in any order). */
const chance = (i: number, salt = 0) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** When each scene starts. In the video: when its segment first starts. On a cover (every scene starts at 0 and only
 * the cover's own scene is shown), the scenes before the cover's are long over and the ones after it far away. */
const timeline = (order: string[], show: (id: string) => number, since: (id: string) => number) => {
  const cover = since(order[0]) === since(order[order.length - 1]) ? order.find((id) => show(id) === 1) : undefined;
  const at = (id: string) => (cover === undefined ? since(id) : (order.indexOf(id) - order.indexOf(cover)) * 100);
  return Object.assign(at, { cover: cover !== undefined });
};

/** A point on a cubic curve. */
const bez = (p: [number, number][], u: number): [number, number] => {
  const v = 1 - u;
  const f = (i: 0 | 1) => v * v * v * p[0][i] + 3 * v * v * u * p[1][i] + 3 * v * u * u * p[2][i] + u * u * u * p[3][i];
  return [f(0), f(1)];
};

// ------------------------------------------------------------------------------------------------------------ pieces

/** A flat stone lying on the ground, lit along its top. (x, y): the middle of its foot. */
const Stone: React.FC<{ x: number; y: number; scale: number; rim: string }> = ({ x, y, scale, rim }) => {
  const top = "M -210 4 C -200 -40 -150 -70 -70 -78 C 10 -86 110 -80 170 -56 C 210 -40 226 -16 228 4";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={`${top} L 228 18 L -210 18 Z`} fill={INK} />
      <path d={top} fill="none" stroke={rim} strokeWidth={3} opacity={0.45} />
    </g>
  );
};

/** A scorpion, side on, facing left, its tail raised over its back and swaying a little. (x, y): where its legs stand.
 * `rim`: the light on its back. */
const Scorpion: React.FC<{ id: string; x: number; y: number; scale: number; t: number; rim: string }> = ({ id, x, y, scale, t, rim }) => {
  const sway = 6 * Math.sin(t * 1.3) + 3 * Math.sin(t * 0.7 + 1);
  const tail: [number, number][] = [[58, -30], [150, -60], [140 + sway * 0.4, -210], [30 + sway, -196]];
  const joints = Array.from({ length: 6 }, (_, k) => bez(tail, k / 5));
  const tip = joints[5];
  const legs = [-34, -12, 10, 32].map((lx, k) => {
    const lift = 3 * Math.sin(t * 2.1 + k * 1.7);
    return `M ${lx} -22 C ${lx - 10} -46 ${lx - 34 + k * 4} -40 ${lx - 30 + k * 6} ${-2 + lift * 0.3} M ${lx + 4} -20 C ${lx + 14} -42 ${lx + 34 - k * 2} -34 ${lx + 40 - k * 3} ${-1 - lift * 0.2}`;
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <filter id={`${id}-soft`} x="-50%" y="-300%" width="200%" height="700%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <ellipse cx={10} cy={2} rx={130} ry={9} fill="#000" opacity={0.5} filter={`url(#${id}-soft)`} />
      {/* legs, four on the side seen */}
      {legs.map((d, k) => <path key={k} d={d} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />)}
      {/* the claws, held forward */}
      <path d="M -70 -30 C -98 -34 -116 -46 -126 -62 M -66 -24 C -96 -16 -118 -18 -134 -26" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M -126 -62 C -150 -70 -170 -62 -176 -50 C -160 -56 -146 -54 -136 -48 C -150 -46 -160 -38 -162 -30 C -146 -40 -132 -46 -122 -56 Z" fill={INK} />
      <path d="M -134 -26 C -158 -30 -178 -20 -184 -8 C -168 -14 -154 -12 -144 -8 C -158 -4 -166 4 -168 10 C -152 2 -138 -8 -130 -20 Z" fill={INK} />
      {/* head and body */}
      <path d="M -92 -26 C -90 -42 -74 -50 -54 -48 C -20 -54 30 -50 60 -38 C 72 -32 72 -18 60 -14 C 30 -6 -20 -4 -54 -8 C -76 -8 -92 -14 -92 -26 Z" fill={INK} />
      <path d="M -88 -34 C -76 -48 -58 -50 -40 -50 C -10 -54 30 -50 60 -38" fill="none" stroke={rim} strokeWidth={4} opacity={0.9} />
      <path d="M -126 -62 C -150 -70 -170 -62 -176 -50 M -134 -26 C -158 -30 -178 -20 -184 -8 M -70 -30 C -98 -34 -116 -46 -126 -62" fill="none" stroke={rim} strokeWidth={3} opacity={0.75} />
      {/* the tail: five thick segments, tapering, a joint between each, then the bulb and its sting */}
      {joints.slice(0, 5).map(([jx, jy], k) => {
        const [nx, ny] = joints[k + 1];
        return <path key={`s${k}`} d={`M ${jx} ${jy} L ${nx} ${ny}`} stroke={INK} strokeWidth={30 - k * 3.2} strokeLinecap="round" />;
      })}
      {joints.slice(1, 5).map(([jx, jy], k) => <circle key={`j${k}`} cx={jx} cy={jy} r={16 - k * 1.5} fill={INK} />)}
      <path d={joints.map(([jx, jy], k) => `${k ? "L" : "M"} ${jx + 2} ${jy - (15 - k * 1.6)}`).join(" ")} fill="none" stroke={rim} strokeWidth={3.4} strokeLinejoin="round" opacity={0.9} />
      <ellipse cx={tip[0] - 6} cy={tip[1] + 4} rx={22} ry={15} transform={`rotate(-20 ${tip[0] - 6} ${tip[1] + 4})`} fill={INK} />
      <path d={`M ${tip[0] - 22} ${tip[1] + 2} C ${tip[0] - 44} ${tip[1] + 6} ${tip[0] - 54} ${tip[1] + 22} ${tip[0] - 52} ${tip[1] + 40} C ${tip[0] - 44} ${tip[1] + 24} ${tip[0] - 34} ${tip[1] + 16} ${tip[0] - 18} ${tip[1] + 14} Z`} fill={INK} />
      <path d={`M ${tip[0] + 10} ${tip[1] - 6} C ${tip[0] - 10} ${tip[1] - 16} ${tip[0] - 40} ${tip[1] - 8} ${tip[0] - 50} ${tip[1] + 14} L ${tip[0] - 52} ${tip[1] + 40}`} fill="none" stroke={rim} strokeWidth={3.2} opacity={0.9} />
    </g>
  );
};

/** The last light of the day low behind a thing, so that its silhouette reads even once the sky is dark. */
const Afterglow: React.FC<{ id: string; x: number; y: number; rx: number; ry: number; color: string; strength: number }> = ({ id, x, y, rx, ry, color, strength }) => (
  <g>
    <defs>
      <radialGradient id={`${id}-g`}>
        <stop offset="0" stopColor={color} stopOpacity={0.55} />
        <stop offset=".5" stopColor={color} stopOpacity={0.18} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id}-g)`} opacity={strength} />
  </g>
);

/** Three keys on a ring, hanging and swinging a little: three surahs carried for years. `glow`: their edges in gold. */
const Keys: React.FC<{ id: string; x: number; y: number; scale: number; t: number; glow: number }> = ({ id, x, y, scale, t, glow }) => {
  const swing = 4 * Math.sin(t * 0.9);
  const key = (k: number) => (
    <g key={k} transform={`rotate(${(k - 1) * 24 + swing * (0.6 + 0.2 * k)})`}>
      <path d="M -6 40 L -6 250 L 6 250 L 6 40 Z" fill={INK} stroke={GOLD} strokeWidth={2.5} strokeOpacity={0.35 + 0.5 * glow} />
      <path d="M 6 196 L 34 196 L 34 212 L 22 212 L 22 226 L 34 226 L 34 244 L 6 244" fill={INK} stroke={GOLD} strokeWidth={2.5} strokeOpacity={0.35 + 0.5 * glow} />
      <circle cx={0} cy={58} r={30} fill={INK} stroke={GOLD} strokeWidth={3} strokeOpacity={0.4 + 0.5 * glow} />
      <circle cx={0} cy={58} r={12} fill="#0d1020" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>
      <ellipse cx={0} cy={150} rx={170} ry={170} fill={GOLD} opacity={0.18 * glow} filter={`url(#${id}-glow)`} />
      {/* the nail and the ring */}
      <path d="M -8 -40 L 8 -40 L 4 -6 L -4 -6 Z" fill={INK} />
      <circle cx={0} cy={6} r={34} fill="none" stroke={INK} strokeWidth={8} />
      <circle cx={0} cy={6} r={34} fill="none" stroke={GOLD} strokeWidth={2.5} opacity={0.35 + 0.5 * glow} />
      <g transform="translate(0 6)">{[0, 1, 2].map(key)}</g>
    </g>
  );
};

/** Coins in small piles beside the purse: what the rich could give. (x, y): the foot of the piles. */
const Coins: React.FC<{ x: number; y: number; scale: number; t: number; glow: number }> = ({ x, y, scale, t, glow }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {[[-90, 6], [-20, 9], [70, 4]].map(([px, n], p) =>
      Array.from({ length: n }, (_, k) => (
        <g key={`${p}-${k}`}>
          <ellipse cx={px + 3 * Math.sin(k * 2.1 + p)} cy={-k * 12} rx={34} ry={11} fill={INK} stroke={GOLD} strokeWidth={2.4} strokeOpacity={0.45 + 0.4 * glow * (0.85 + 0.15 * Math.sin(t * 1.5 + k + p))} />
        </g>
      )),
    )}
  </g>
);

/** A road seen from where you stand, narrowing to the horizon, lit along its edges, small lights going up it (the race;
 * nobody drawn). */
const Road: React.FC<{ id: string; horizon: number; t: number; rim: string; motes?: boolean }> = ({ id, horizon, t, rim, motes = true }) => {
  const near = 1940;
  const left = (y: number) => interpolate(y, [horizon, near], [528, 250]);
  const right = (y: number) => interpolate(y, [horizon, near], [552, 830]);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rim} stopOpacity={0.55} />
          <stop offset=".35" stopColor={rim} stopOpacity={0.2} />
          <stop offset="1" stopColor={rim} stopOpacity={0.06} />
        </linearGradient>
      </defs>
      <path d={`M ${left(horizon)} ${horizon} L ${right(horizon)} ${horizon} L ${right(near)} ${near} L ${left(near)} ${near} Z`} fill={`url(#${id}-g)`} />
      <path d={`M ${left(horizon)} ${horizon} L ${left(near)} ${near} M ${right(horizon)} ${horizon} L ${right(near)} ${near}`} stroke={rim} strokeWidth={4} opacity={0.6} />
      {(motes ? Array.from({ length: 9 }) : []).map((_, k) => {
        const u = (t * (0.05 + 0.03 * chance(k, 1)) + chance(k, 2)) % 1;       // 0 near, 1 at the horizon
        const y = near - (near - horizon) * (1 - (1 - u) * (1 - u));
        const lane = 0.3 + 0.4 * chance(k, 3);
        const x = left(y) + (right(y) - left(y)) * lane;
        const size = interpolate(y, [horizon, near], [3, 22]);
        return <circle key={k} cx={x} cy={y} r={size} fill={LIGHT} opacity={0.85 * Math.sin(Math.PI * Math.min(1, u * 1.1))} />;
      })}
    </g>
  );
};

/** Two headlights coming up the road from the horizon at night, slowly, again and again: driving home in the dark. */
const Headlights: React.FC<{ id: string; horizon: number; t: number }> = ({ id, horizon, t }) => {
  const v = (t / 7) % 1;
  const u = 0.32 + 0.68 * v;                              // never a pair of dots at the horizon (they read as eyes)
  const y = horizon + (1700 - horizon) * u * u;
  const half = interpolate(y, [horizon, 1700], [4, 110]);
  const r = interpolate(y, [horizon, 1700], [3, 34]);
  const fade = Math.min(1, v * 6) * (1 - ramp(v, 0.85, 1));
  return (
    <g opacity={fade}>
      <defs>
        <filter id={`${id}-glow`} x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation={6 + r} />
        </filter>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2d0" stopOpacity={0.5} />
          <stop offset="1" stopColor="#fff2d0" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* the beams on the road ahead of them, towards the viewer */}
      <path d={`M ${540 - half - r} ${y} L ${540 + half + r} ${y} L ${540 + half * 2.6} ${y + 120 + half * 2} L ${540 - half * 2.6} ${y + 120 + half * 2} Z`} fill={`url(#${id}-beam)`} opacity={0.6} />
      {[-1, 1].map((side) => (
        <g key={side}>
          <circle cx={540 + side * half} cy={y} r={r * 2.4} fill="#fff2d0" opacity={0.55} filter={`url(#${id}-glow)`} />
          <circle cx={540 + side * half} cy={y} r={r} fill="#fffaf0" />
        </g>
      ))}
    </g>
  );
};

/** Prayer beads in a loop, lit one by one as they are counted: `counted` beads of 33 lit, gold. (x, y): the middle. */
const Beads: React.FC<{ id: string; x: number; y: number; r: number; counted: number }> = ({ id, x, y, r, counted }) => (
  <g transform={`translate(${x} ${y})`}>
    <defs>
      <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
    <ellipse cx={0} cy={0} rx={r} ry={r * 0.62} fill="none" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 33 }, (_, k) => {
      const a = -Math.PI / 2 + (k / 33) * Math.PI * 2;
      const bx = r * Math.cos(a);
      const by = r * 0.62 * Math.sin(a);
      const lit = Math.max(0, Math.min(1, counted - k));
      return (
        <g key={k}>
          {lit > 0 ? <circle cx={bx} cy={by} r={15} fill={GOLD} opacity={0.5 * lit} filter={`url(#${id}-glow)`} /> : null}
          <circle cx={bx} cy={by} r={13} fill={lit > 0.5 ? "#3a2a10" : INK} stroke={GOLD} strokeWidth={2.4} strokeOpacity={0.25 + 0.7 * lit} />
        </g>
      );
    })}
    {/* the tassel, hanging under the first bead */}
    <path d={`M 0 ${-r * 0.62 - 14} L 0 ${-r * 0.62 - 64} M -10 ${-r * 0.62 - 64} L 10 ${-r * 0.62 - 64}`} stroke={INK} strokeWidth={6} />
  </g>
);

/** A prayer mat on the floor, seen at a slant, its niche towards the horizon. (x, y): the middle of its near edge. */
const Mat: React.FC<{ id: string; x: number; y: number; scale: number; t: number; rim: string }> = ({ id, x, y, scale, t, rim }) => {
  const breath = 0.85 + 0.15 * Math.sin(t * 0.8);
  // lying flat: a wide near edge, a narrow far edge, little height
  const edge = (u: number, v: number): [number, number] => [(1 - 0.38 * v) * u * 300, -v * 170];
  const quad = (inset: number) => {
    const pts = [edge(-1 + inset, inset), edge(1 - inset, inset), edge(1 - inset, 1 - inset), edge(-1 + inset, 1 - inset)];
    return `M ${pts.map(([px, py]) => `${px} ${py}`).join(" L ")} Z`;
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={quad(0)} fill="#0b0a12" stroke={rim} strokeWidth={3} strokeOpacity={0.45} />
      <path d={quad(0.08)} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.55 * breath} />
      <path d={quad(0.14)} fill="none" stroke={GOLD} strokeWidth={1.6} opacity={0.4 * breath} />
      {/* the niche, flattened by the slant, near the far edge */}
      <path d={`M -64 -126 C -64 -150 64 -150 64 -126`} fill="none" stroke={GOLD} strokeWidth={3.5} opacity={0.7 * breath} />
      <path d="M -64 -126 L -66 -100 M 64 -126 L 66 -100" stroke={GOLD} strokeWidth={3} opacity={0.6 * breath} />
      {/* fringes at both ends */}
      {Array.from({ length: 15 }, (_, k) => {
        const u = -1 + (2 * k) / 14;
        const [nx, ny] = edge(u, 0);
        const [fx, fy] = edge(u, 1);
        return (
          <g key={k} stroke={rim} strokeWidth={2.4} opacity={0.5}>
            <path d={`M ${nx} ${ny} L ${nx * 1.02} ${ny + 18}`} />
            <path d={`M ${fx} ${fy} L ${fx * 1.02} ${fy - 10}`} />
          </g>
        );
      })}
      {/* prayer beads left on it */}
      <g transform="translate(150 -40) scale(1 0.5)">
        {Array.from({ length: 33 }, (_, k) => {
          const a = (k / 33) * Math.PI * 2;
          return <circle key={k} cx={46 * Math.cos(a)} cy={46 * Math.sin(a)} r={7} fill={INK} stroke={GOLD} strokeWidth={2} strokeOpacity={0.7} />;
        })}
      </g>
      <defs>
        <filter id={`${id}-soft`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
    </g>
  );
};

/** The counter under the beads: « 33 » three times, each written when its turn comes (`n`: 0 to 3 shown), the first on
 * the right (read from right to left, as the Arabic above it). */
const Counter: React.FC<{ y: number; n: number }> = ({ y, n }) => (
  <g>
    {[0, 1, 2].map((k) => (
      <text key={k} x={W / 2 + (1 - k) * 220} y={y} textAnchor="middle" fontFamily={FONT.latin} fontSize={96} fontWeight={700} fill={GOLD} opacity={Math.max(0, Math.min(1, n - k))} style={{ paintOrder: "stroke" }} stroke={INK} strokeWidth={10}>
        33
      </text>
    ))}
  </g>
);

// ------------------------------------------------------------------------------------------------------------ aqrab

/** Short 1 (Muslim 2709, the evening): `sting`, nightfall, a scorpion on the ground, its tail raised; `dusk`, the
 * scorpion gone, the first stars over a stone (the dhikr said by Jibril, 113:1-3 recited); `drive`, a road at night and
 * headlights coming home (the example of today); `door`, a house shut for the night, one window lit. The clip: a sunset
 * that becomes night. */
const AqrabPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(["sting", "dusk", "drive", "door"], show, since);
  const rim = "#e8c2a8";
  const night = Math.max(0.25, at.cover ? 0.5 : ramp(t, 4, 60));
  return (
    <>
      <Stars t={t} night={night * Math.max(show("dusk"), 0.5 * show("sting"), 0.7 * show("door"))} height={700} />
      <Afterglow id="dq-glow" x={560} y={horizon} rx={520} ry={260} color="#ff9f6e" strength={show("sting") + 0.6 * show("dusk")} />
      <Land id="dq-land" horizon={horizon} rim={rim} />
      <g opacity={show("dusk")}>
        <Stone x={560} y={horizon + 60} scale={1.1} rim={rim} />
      </g>
      <g opacity={show("sting")}>
        <Scorpion id="dq-scorpion" x={590} y={horizon + 30} scale={1.85} t={t} rim={rim} />
      </g>
      <g opacity={show("drive")}>
        <Road id="dq-road" horizon={horizon} t={t} rim="#9fb6e6" motes={false} />
        <Headlights id="dq-lights" horizon={horizon} t={t - at("drive")} />
      </g>
      <g opacity={show("door")}>
        <Afterglow id="dq-door-glow" x={540} y={horizon - 40} rx={420} ry={240} color="#9fb6e6" strength={0.7} />
        <House id="dq-house" x={540} y={horizon + 50} scale={1.3} t={t} lights={1} rim={rim} />
      </g>
    </>
  );
};

// -------------------------------------------------------------------------------------------------------------- qul

/** Short 2 (Tirmidhi 3575, morning and evening): `rain`, a night of rain over the land, a lantern lit on the way;
 * `sky`, the storm sky alone while the surahs are recited (nothing is drawn while a surah speaks of Allah); `keys`,
 * three keys on a ring, their edges turning gold: three surahs carried for years. */
const QulPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(["rain", "sky", "keys"], show, since);
  const rim = "#9fb6e6";
  const golden = at.cover ? 0.6 : ramp(t - at("keys"), 1, 6);
  return (
    <>
      <g opacity={show("rain")}>
        <Rain t={t} />
      </g>
      <Land id="dl-land" horizon={horizon} rim={rim} path />
      <g opacity={show("rain")}>
        <Lantern id="dl-lantern" x={250} y={horizon + 40} scale={1.5} t={t} lit={1} />
      </g>
      <g opacity={show("keys")}>
        <Keys id="dl-keys" x={W / 2} y={830} scale={1.6} t={t} glow={golden} />
      </g>
    </>
  );
};

// ----------------------------------------------------------------------------------------------------------- dathur

/** Short 3 (Muslim 595, after the prayer; 57:21): `coins`, a purse and piles of coins in gold, what the rich could
 * give; `beads`, prayer beads lit one by one, « 33 » written three times as they are counted (the answer read);
 * `road`, a track running to the horizon at dawn, lights going up it (« سابقوا ») ; `mat`, a prayer mat on the floor,
 * the moment after the salam. The clip: a dawn in fast motion. */
const DathurPicture: Drawn = ({ t, show, since, horizon }) => {
  const at = timeline(["coins", "beads", "road", "mat"], show, since);
  const rim = "#ffd2a0";
  // the beads are counted three times over the reading of the answer (about 23 s), then stay lit
  const s = at.cover ? 99 : t - at("beads");
  const rounds = interpolate(s, [10, 22], [0, 3], CLAMP);
  const counted = rounds >= 3 ? 33 : 33 * (rounds % 1);
  return (
    <>
      <Land id="dd-land" horizon={horizon} rim={rim} />
      <g opacity={show("coins")}>
        <Coins x={330} y={horizon + 90} scale={1.4} t={t} glow={1} />
        <Purse id="dd-purse" x={760} y={horizon + 96} scale={2.6} t={t} glow={0.9} />
      </g>
      <g opacity={show("beads")}>
        <Beads id="dd-beads" x={W / 2} y={1120} r={300} counted={counted} />
        <Counter y={1135} n={at.cover ? 3 : interpolate(s, [11, 12, 15, 16, 19, 20], [0, 1, 1, 2, 2, 3], CLAMP)} />
      </g>
      <g opacity={show("road")}>
        <Road id="dd-road" horizon={horizon} t={t} rim={rim} />
      </g>
      <g opacity={show("mat")}>
        <Mat id="dd-mat" x={W / 2} y={horizon + 150} scale={1.35} t={t} rim={rim} />
      </g>
    </>
  );
};

export const DHIKR_PICTURES: Record<string, Drawn> = { aqrab: AqrabPicture, qul: QulPicture, dathur: DathurPicture };
