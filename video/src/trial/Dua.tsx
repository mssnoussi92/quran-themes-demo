// Silhouettes of the du'a film (content/trial/asked.yaml, written.yaml, waited.yaml; docs/themes.md): three
// calls of Surat al-Anbiya, and nobody drawn. Ayyub's is the house of `Home.tsx`, dark, then lit. Here: the great
// fish of Yunus (a creature the text names: its tail going down into a dark sea, then a light under the water
// where the call comes from), and the place where Zakariyya prays (a small domed room, its niche lit by a lamp,
// then a second light when the verse says what he is given). Backlit shapes over a filmed sea and a filmed moon.
const INK = "#05060d";
const LIGHT = "#ffd9a0";

/** The tail of the great fish, going down. (x, y): where it enters the water. `sink`: 0 standing, 1 gone under. */
export const Whale: React.FC<{ id: string; x: number; y: number; scale: number; t: number; sink?: number }> = ({ id, x, y, scale, t, sink = 0 }) => {
  const sway = 3 * Math.sin(t * 0.7);
  const down = 300 * sink;
  const fluke = "M -44 20 C -30 -110 -30 -210 -12 -290 C -64 -322 -150 -348 -246 -326 C -182 -392 -76 -404 0 -352 C 76 -404 182 -392 246 -326 C 150 -348 64 -322 12 -290 C 30 -210 30 -110 44 20 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <clipPath id={`${id}-above`}>
          <rect x={-400} y={-600} width={800} height={600} />
        </clipPath>
        <filter id={`${id}-soft`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      {/* what the water keeps of it: a dark trace under the surface */}
      <ellipse cx={0} cy={26} rx={190} ry={30} fill="#000" opacity={0.5} filter={`url(#${id}-soft)`} />
      <g clipPath={`url(#${id}-above)`}>
        <g transform={`translate(0 ${down}) rotate(${sway} 0 0)`}>
          <path d={fluke} fill={INK} />
          {/* the last light of the sky along one edge */}
          <path d="M 12 -290 C 64 -322 150 -348 246 -326 C 182 -392 76 -404 0 -352 C -76 -404 -182 -392 -246 -326" fill="none" stroke="#ffb98a" strokeWidth={4} opacity={0.75} />
          <path d="M 44 20 C 30 -110 30 -210 12 -290" fill="none" stroke="#ffb98a" strokeWidth={3} opacity={0.55} />
        </g>
      </g>
      {/* the rings it leaves on the water */}
      {[0, 1, 2].map((k) => {
        const p = (t * 0.25 + k / 3) % 1;
        return <ellipse key={k} cx={0} cy={8} rx={70 + 240 * p} ry={10 + 26 * p} fill="none" stroke="#cfd8ff" strokeWidth={3} opacity={0.32 * (1 - p)} />;
      })}
    </g>
  );
};

/** A light under the water, where the call comes from: it breathes, and thin rays rise from it. */
export const Call: React.FC<{ id: string; x: number; y: number; t: number }> = ({ id, x, y, t }) => {
  const breath = 0.8 + 0.2 * Math.sin(t * 1.4);
  return (
    <g transform={`translate(${x} ${y})`} opacity={breath}>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#fff3cf" stopOpacity="1" />
          <stop offset=".35" stopColor={LIGHT} stopOpacity=".55" />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ray`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={LIGHT} stopOpacity=".5" />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[-34, -12, 10, 30].map((a, i) => (
        <path key={i} d="M -9 0 L -3 -520 L 3 -520 L 9 0 Z" fill={`url(#${id}-ray)`} opacity={0.5 + 0.3 * Math.sin(t * 0.9 + i)} transform={`rotate(${a})`} />
      ))}
      <ellipse cx={0} cy={0} rx={250} ry={90} fill={`url(#${id}-glow)`} />
      <ellipse cx={0} cy={0} rx={46} ry={14} fill="#fff7dd" />
    </g>
  );
};

/** The place of prayer: a small domed room, its arched niche lit from inside by a hanging lamp. (x, y): the
 * middle of its foot. `lights`: 1, the lamp of the niche; 2, a second light beside it (what he is given). */
export const Niche: React.FC<{ id: string; x: number; y: number; scale: number; t: number; lights: 1 | 2 }> = ({ id, x, y, scale, t, lights }) => {
  const flicker = (d: number) => 0.9 + 0.1 * Math.sin(t * 2.1 + d) * Math.sin(t * 0.8 + 2 * d);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <filter id={`${id}-glow`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <linearGradient id={`${id}-inside`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9c4" />
          <stop offset="1" stopColor="#f0b565" />
        </linearGradient>
      </defs>
      {/* the light the niche throws on the ground */}
      <ellipse cx={0} cy={26} rx={lights === 2 ? 250 : 180} ry={30} fill={LIGHT} opacity={0.18} filter={`url(#${id}-soft)`} />
      {/* the room, its dome and the small finial on it */}
      <path d="M -170 0 L -170 -230 L 170 -230 L 170 0 Z" fill={INK} />
      <path d="M -120 -230 A 120 120 0 0 1 120 -230 Z" fill={INK} />
      <path d="M -5 -350 L 0 -392 L 5 -350 Z" fill={INK} />
      {/* moonlight on the edges that face the moon */}
      <path d="M 170 -230 L 170 0" stroke="#9fb6e6" strokeWidth={3} opacity={0.5} />
      <path d="M 0 -350 A 120 120 0 0 1 120 -230 L 170 -230" fill="none" stroke="#9fb6e6" strokeWidth={3} opacity={0.4} />
      {/* the niche: an arch full of warm light, the lamp hanging in it */}
      <g opacity={flicker(0)}>
        <path d="M -58 0 L -58 -112 A 58 58 0 0 1 58 -112 L 58 0 Z" fill={LIGHT} filter={`url(#${id}-glow)`} />
        <path d="M -58 0 L -58 -112 A 58 58 0 0 1 58 -112 L 58 0 Z" fill={`url(#${id}-inside)`} />
      </g>
      <path d="M 0 -170 L 0 -128" stroke={INK} strokeWidth={3} />
      <path d="M -13 -128 L 13 -128 L 18 -104 C 18 -86 -18 -86 -18 -104 Z" fill={INK} />
      <ellipse cx={0} cy={-106} rx={7} ry={10} fill="#fffbe8" opacity={flicker(1.3)} />
      {/* a second light, lower and smaller, beside the first */}
      {lights === 2 ? (
        <g opacity={flicker(2.1)}>
          <path d="M 96 -60 L 96 -112 A 22 22 0 0 1 140 -112 L 140 -60 Z" fill={LIGHT} filter={`url(#${id}-glow)`} />
          <path d="M 96 -60 L 96 -112 A 22 22 0 0 1 140 -112 L 140 -60 Z" fill="#ffe9c4" />
        </g>
      ) : null}
    </g>
  );
};
