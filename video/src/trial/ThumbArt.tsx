// Thumbnails drawn for themselves (owner, 2026-11-21: « il ne faut pas toujours choisir des images du film, on essaie de
// créer une » image ; his choice among three: « entièrement dessinée »). A scene drawn for the 16:9 thumbnail alone: a vivid
// sky, ONE thing in large, the light made for a picture seen 170 px wide; the film's own silhouettes (Qarnayn.tsx) drawn
// bigger and brighter. Nobody drawn, nothing unseen. Drawn in 1920x1080 (TrialThumbFrame scales it to 1280x720); the text
// side of the option (`place`) is left calm, and the bottom right corner holds nothing that matters (YouTube's duration).
import { Barrier, Chest, Cliffs, Dwellings } from "./Qarnayn";
import { Chair, Cup, Jacket, Pendant } from "./Hayyin";
import { Praying, QIYAM } from "./Sahw";
import { POSES, Stick } from "./Sahib";
import { FONT } from "../fonts";

const W = 1920;
const H = 1080;
const T = 2.4; // a still: the moment of the flickers

/** Small sparks over a fire: deterministic, rising and fading. */
const Embers: React.FC<{ x: number; y: number; spread: number; rise: number; count: number; seed: number }> = ({ x, y, spread, rise, count, seed }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const a = Math.sin(i * 12.9898 + seed) * 43758.5453;
      const b = Math.sin(i * 78.233 + seed * 3) * 12543.123;
      const u = a - Math.floor(a);
      const v = b - Math.floor(b);
      const h = v * rise;
      return <circle key={i} cx={x + (u - 0.5) * spread * (1 - 0.4 * v)} cy={y - h} r={2 + 4 * (1 - v)} fill={v < 0.5 ? "#ffd27a" : "#ff9a3a"} opacity={0.95 - 0.7 * v} />;
    })}
  </g>
);

/** A sky at dusk, from `top` to the horizon, and a few stars. */
const Sky: React.FC<{ id: string; horizon: number; stops: [number, string][]; stars?: number }> = ({ id, horizon, stops, stars = 0 }) => (
  <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2={horizon} gradientUnits="userSpaceOnUse">
        {stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
      </linearGradient>
    </defs>
    <rect width={W} height={horizon + 4} fill={`url(#${id}-sky)`} />
    {Array.from({ length: stars }, (_, i) => {
      const a = Math.sin(i * 91.7) * 9876.5;
      const b = Math.sin(i * 37.3) * 5432.1;
      return <circle key={i} cx={(a - Math.floor(a)) * W} cy={(b - Math.floor(b)) * horizon * 0.45} r={1.6} fill="#fff" opacity={0.25 + 0.4 * (b - Math.floor(b))} />;
    })}
  </g>
);

/** Dhul-Qarnayn, 18:96: the barrier of iron between the two walls of rock, the fire blown under it, the copper run in. */
const QarnaynBarrier: React.FC = () => {
  const horizon = 760;
  const middle = 1290;
  const gap = 520;
  const base = horizon + 80;
  const top = base - 7 * 54;                         // seven courses: the sky shows above it
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <radialGradient id="ta-fire" cx={middle} cy={base - 60} r={620} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffc060" stopOpacity="1" />
          <stop offset=".3" stopColor="#ff7a2a" stopOpacity=".6" />
          <stop offset="1" stopColor="#ff5a2a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ta-molten" x1="0" y1={base} x2="0" y2={top} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff6a1a" stopOpacity=".95" />
          <stop offset=".55" stopColor="#ff8a2e" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffc060" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id="ta-ground" x1="0" y1={horizon} x2="0" y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2a140f" />
          <stop offset="1" stopColor="#07060c" />
        </linearGradient>
        <filter id="ta-blur" x="-20%" y="-300%" width="140%" height="700%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <Sky id="ta-b" horizon={horizon} stars={60} stops={[[0, "#120d33"], [0.4, "#3b2470"], [0.72, "#a13f73"], [0.9, "#f0703f"], [1, "#ffb15a"]]} />
      <rect y={horizon} width={W} height={H - horizon} fill="url(#ta-ground)" />
      <ellipse cx={middle} cy={base - 60} rx={760} ry={460} fill="url(#ta-fire)" />
      <Cliffs id="ta-cl" horizon={horizon} middle={middle} gap={gap} height={640} rim="#ffc58a" width={W} glow={1} />
      <Barrier id="ta-ba" x={middle} y={base} span={gap} full={7 * 54} level={1} heat={1} copper={1} t={T} rim="#ffd7a6" />
      {/* the iron red-hot under the copper: the light the film took from its clip, drawn */}
      <rect x={middle - gap / 2} y={top} width={gap} height={base - top} fill="url(#ta-molten)" style={{ mixBlendMode: "screen" }} />
      <rect x={middle - gap / 2} y={top - 6} width={gap} height={12} rx={6} fill="#ffd98a" filter="url(#ta-blur)" />
      <rect x={middle - gap / 2} y={top - 3} width={gap} height={6} rx={3} fill="#fff0c4" />
      <Embers x={middle} y={top + 40} spread={gap * 1.2} rise={420} count={90} seed={1.3} />
    </svg>
  );
};

/** Dhul-Qarnayn, 18:94-95: the tribute they offered him, a chest of gold, before the dwellings of a people. */
const QarnaynChest: React.FC = () => {
  const horizon = 700;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <radialGradient id="tc-gold" cx={1200} cy={790} r={520} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd27a" stopOpacity=".9" />
          <stop offset=".4" stopColor="#ffb04a" stopOpacity=".35" />
          <stop offset="1" stopColor="#ff8a2e" stopOpacity="0" />
        </radialGradient>
        <filter id="tc-blur" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <linearGradient id="tc-ground" x1="0" y1={horizon} x2="0" y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3a2018" />
          <stop offset="1" stopColor="#0d0808" />
        </linearGradient>
      </defs>
      <Sky id="tc-s" horizon={horizon} stars={30} stops={[[0, "#1d1645"], [0.45, "#5a2f78"], [0.78, "#d0597a"], [1, "#ffb562"]]} />
      <Cliffs id="tc-cl" horizon={horizon - 40} middle={980} gap={1240} height={380} rim="#ffc58a" width={W} glow={0.35} />
      <rect y={horizon} width={W} height={H - horizon} fill="url(#tc-ground)" />
      <Dwellings id="tc-d" x={560} y={horizon + 150} scale={1.15} t={T} lit={5} />
      <ellipse cx={1200} cy={830} rx={700} ry={380} fill="url(#tc-gold)" />
      <Chest id="tc-c" x={1200} y={1010} scale={1.9} t={T} open rim="#ffd27a" />
      {/* the gold catching the light: drawn brighter than in the film, where the clip lit it */}
      <ellipse cx={1200} cy={1010 - 104 * 1.9} rx={150} ry={50} fill="#ffe7a8" opacity={0.75} filter="url(#tc-blur)" />
    </svg>
  );
};

/** Dhul-Qarnayn, 18:86: the sun found setting in a spring of dark mud, and a people by it. */
const QarnaynSunset: React.FC = () => {
  const horizon = 720;
  const sun = { x: 600, r: 190 };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <radialGradient id="ts-halo" cx={sun.x} cy={horizon} r={760} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff1c4" stopOpacity=".95" />
          <stop offset=".25" stopColor="#ffb04a" stopOpacity=".6" />
          <stop offset="1" stopColor="#ff6a3a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ts-mud" x1="0" y1={horizon} x2="0" y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b2114" />
          <stop offset=".5" stopColor="#1d100b" />
          <stop offset="1" stopColor="#090605" />
        </linearGradient>
        <clipPath id="ts-above">
          <rect width={W} height={horizon} />
        </clipPath>
      </defs>
      <Sky id="ts-s" horizon={horizon} stops={[[0, "#2a1a4d"], [0.4, "#8a3a6a"], [0.75, "#f06a3a"], [1, "#ffc062"]]} />
      <ellipse cx={sun.x} cy={horizon} rx={900} ry={520} fill="url(#ts-halo)" />
      <circle cx={sun.x} cy={horizon + 40} r={sun.r} fill="#fff0c0" clipPath="url(#ts-above)" />
      <rect y={horizon} width={W} height={H - horizon} fill="url(#ts-mud)" />
      {/* its light on the dark water, in broken strokes */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={sun.x - (240 - i * 22) / 2 + Math.sin(i * 2.3) * 30} y={horizon + 18 + i * 26} width={240 - i * 22} height={7} rx={3} fill="#ffcf7a" opacity={0.75 - i * 0.07} />
      ))}
      <Dwellings id="ts-d" x={1330} y={horizon + 190} scale={1.25} t={T} lit={5} />
    </svg>
  );
};

/** « وتحسبونه هيّنًا »: the empty café chair in its own light, a jacket on its back, its cup still steaming at the edge of
 * the table, the keys by it: the one spoken about is not there. The text on the left, in the dark of the café. */
const HayyinChair: React.FC = () => {
  const floor = 1000;
  const s = 2.6;
  const x = 1330;
  const seat = floor - 92 * 1.2 * s;
  const top = floor - 128 * 1.2 * s;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="th-wall" x1="0" y1="0" x2="0" y2={floor} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0d0a10" />
          <stop offset="1" stopColor="#3a2416" />
        </linearGradient>
        <radialGradient id="th-pool" cx={x} cy={floor} r={520} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={floor} fill="url(#th-wall)" />
      <rect y={floor} width={W} height={H - floor} fill="#0a0708" />
      <Pendant id="th-p" x={x} top={0} y={150} to={floor + 70} spread={470} on={1} t={T} />
      <ellipse cx={x} cy={floor} rx={520} ry={80} fill="url(#th-pool)" />
      {/* the edge of the table on the left of the chair, his cup, his keys */}
      <path d={`M 900 ${top} L 1150 ${top} L 1132 ${top + 120} L 900 ${top + 120} Z`} fill="#0c0d14" />
      <path d={`M 900 ${top} L 1152 ${top}`} stroke="#ffd9a0" strokeWidth={5} opacity={0.6} />
      <g transform={`translate(1080 ${top - 6}) scale(2.2) translate(-1080 ${-(top - 6)})`}><Cup x={1080} y={top - 6} t={T} i={2} /></g>
      <circle cx={960} cy={top - 13} r={12} fill="none" stroke="#f0c46a" strokeWidth={4} />
      <path d={`M 960 ${top - 13} l -30 5`} stroke="#f0c46a" strokeWidth={5} />
      <Chair x={x} seat={seat} floor={floor} facing={-1} lit={1} s={s} />
      <Jacket x={x + 72 * s} y={seat - 210 * s} facing={-1} shown={1} s={s} />
    </svg>
  );
};

/** « سؤال صعب »: a rich man's bedroom at night, everything in it, and he lies awake, eyes open, his hand on his chest.
 * Anonymous, a stick figure with a simple face (the owner's rule of 2026-11-19). The text on the left. */
const SualBed: React.FC = () => {
  const lie = { x: 1270, y: 640, s: 2.2 };          // his pelvis; rotated, his head lies on the pillow on the right
  const shoulder = lie.y - 106 * lie.s;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <radialGradient id="tb-moon" cx={1260} cy={240} r={560} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b9c8ff" stopOpacity=".45" />
          <stop offset="1" stopColor="#b9c8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#141836" />
      <rect y={820} width={W} height={H - 820} fill="#0e1028" />
      <ellipse cx={1260} cy={240} rx={640} ry={420} fill="url(#tb-moon)" />
      {/* the window and its moon between heavy curtains, a gold chandelier */}
      <rect x={1110} y={70} width={300} height={320} fill="#0b1230" stroke="#17181d" strokeWidth={12} />
      <circle cx={1330} cy={150} r={38} fill="#f3eccf" />
      <path d="M 1090 60 Q 1070 240 1100 420 L 1130 420 Q 1110 240 1130 60 Z M 1430 60 Q 1450 240 1420 420 L 1390 420 Q 1410 240 1390 60 Z" fill="#6a2f5a" stroke="#17181d" strokeWidth={6} />
      <g stroke="#f0c46a" strokeWidth={5} fill="none" opacity={0.9}>
        <path d="M 1640 0 L 1640 80 M 1550 110 Q 1640 160 1730 110 M 1570 110 L 1570 140 M 1640 120 L 1640 155 M 1710 110 L 1710 140" />
      </g>
      {/* the bed: the mattress, its foot on the left, a gold headboard on the right */}
      <rect x={900} y={640} width={930} height={110} rx={20} fill="#efe6d4" stroke="#17181d" strokeWidth={8} />
      <rect x={900} y={740} width={930} height={80} fill="#5c3a22" stroke="#17181d" strokeWidth={8} />
      <rect x={1810} y={420} width={60} height={420} rx={16} fill="#c99a3a" stroke="#17181d" strokeWidth={8} />
      <rect x={1640} y={590} width={170} height={60} rx={26} fill="#fffaf0" stroke="#17181d" strokeWidth={6} />
      <g transform={`rotate(90 ${lie.x} ${lie.y})`}>
        <Stick x={lie.x} y={lie.y} s={lie.s} facing={-1} tone="white" face="worried" pose={POSES.stand}
          handF={[lie.x - 60, shoulder + 90]} bendF={1} />
      </g>
      <rect x={960} y={600} width={600} height={110} rx={34} fill="#5a4a8a" stroke="#17181d" strokeWidth={8} />
      {/* gold on the floor by the bed: what he has */}
      {[0, 1, 2, 3, 4].map((k) => <ellipse key={k} cx={1060 + 26 * (k % 2)} cy={900 - 12 * k} rx={40} ry={12} fill="#f2c66d" stroke="#17181d" strokeWidth={4} />)}
      {/* the worry over him */}
      {[0, 1, 2].map((i) => <path key={i} d={`M ${1500 - i * 70} ${420 - 14 * i} q 30 -40 60 0 q 30 40 60 0`} stroke="#8a87a8" strokeWidth={10} fill="none" strokeLinecap="round" />)}
    </svg>
  );
};

/** « إزاي أعملها؟ » · سجود السهو: the prayer room at dawn, the figure standing on its rug, and the question over it in large:
 * 3 or 4? (numbers in 1 2 3, the owner's rule). Nobody known drawn: an anonymous figure, as in the shorts. */
const SahwDoubt: React.FC = () => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <defs>
      <radialGradient id="td-glow" cx={1380} cy={560} r={700} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffc47a" stopOpacity=".55" />
        <stop offset="1" stopColor="#ffc47a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="td-window" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe2b0" />
        <stop offset="0.55" stopColor="#f6b46b" />
        <stop offset="1" stopColor="#d98a4e" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="#120f18" />
    <rect width={W} height={H} fill="url(#td-glow)" />
    <path d="M 1240 860 L 1240 420 A 200 200 0 0 1 1640 420 L 1640 860 Z" fill="url(#td-window)" opacity={0.75} />
    <rect y={860} width={W} height={H - 860} fill="#2a1d1f" />
    <path d="M 1240 860 L 1640 860 L 1820 1080 L 1080 1080 Z" fill="#ffd296" opacity={0.18} />
    <path d="M 760 940 L 1440 940 L 1500 1010 L 700 1010 Z" fill="#6a2328" stroke="#b8894c" strokeWidth={4} />
    <g transform="translate(560 -520) scale(1.12)"><Praying id="td-fig" body={QIYAM} face="worried" /></g>
    {/* the question, large: 3 or 4 */}
    <g transform="translate(1420 330)">
      <circle r={190} fill="#0b0e18" fillOpacity={0.72} stroke="#f2c75c" strokeWidth={6} />
      <text x={70} y={70} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={190} fill="#f4efe6">3</text>
      <text x={-78} y={70} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={190} fill="#f4efe6" opacity={0.45}>4</text>
      <text x={150} y={-110} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={130} fill="#f2c75c">؟</text>
    </g>
  </svg>
);

const ART: Record<string, React.FC> = {
  "hayyin-chair": HayyinChair,
  "sual-bed": SualBed,
  "sahw-doubt": SahwDoubt,
  "qarnayn-barrier": QarnaynBarrier,
  "qarnayn-chest": QarnaynChest,
  "qarnayn-sunset": QarnaynSunset,
};

export const ART_NAMES = Object.keys(ART);

/** The drawn scene `art` (a key of ART), 1920x1080. */
export const ThumbArt: React.FC<{ art: string }> = ({ art }) => {
  const Scene = ART[art];
  if (!Scene) throw new Error(`thumbnail art « ${art} »: not one of ${ART_NAMES.join(", ")} (video/src/trial/ThumbArt.tsx)`);
  return <Scene />;
};
