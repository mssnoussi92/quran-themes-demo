// Thumbnails drawn for themselves (owner, 2026-11-21: « il ne faut pas toujours choisir des images du film, on essaie de
// créer une » image ; his choice among three: « entièrement dessinée »). A scene drawn for the 16:9 thumbnail alone: a vivid
// sky, ONE thing in large, the light made for a picture seen 170 px wide; the film's own silhouettes (Qarnayn.tsx) drawn
// bigger and brighter. Nobody drawn, nothing unseen. Drawn in 1920x1080 (TrialThumbFrame scales it to 1280x720); the text
// side of the option (`place`) is left calm, and the bottom right corner holds nothing that matters (YouTube's duration).
import { Barrier, Chest, Cliffs, Dwellings } from "./Qarnayn";

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

const ART: Record<string, React.FC> = {
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
