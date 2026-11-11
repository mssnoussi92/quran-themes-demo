// Silhouettes of the second trial short (the boy, 18:74 and 18:80-81; docs/retention.md): nobody is drawn,
// neither the boy nor his parents. A house under the moon with a lit window says « a father and a mother »;
// a second light says what the verse promises them in his place. Backlit shapes over a filmed sky, the same
// family as the boat.
const INK = "#05060d";
const LIGHT = "#ffd9a0";

/** The land every scene stands on: a dark rise drawn over the bottom of the clip, lit along its edge (`rim`:
 * moonlight or the last light of the sun); `path`: a pale track coming up to the middle of the rise. */
export const Land: React.FC<{ id: string; horizon: number; rim: string; path?: boolean; width?: number }> = ({ id, horizon, rim, path = false, width = 1080 }) => {
  const x = (v: number) => Math.round((v * width) / 1080);
  const edge = `M -20 ${horizon + 46} C ${x(180)} ${horizon + 8} ${x(420)} ${horizon + 2} ${x(600)} ${horizon + 20} C ${x(800)} ${horizon + 40} ${x(960)} ${horizon + 6} ${x(1100)} ${horizon - 12}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-land`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0e1c" />
          <stop offset=".35" stopColor={INK} />
          <stop offset="1" stopColor="#030308" />
        </linearGradient>
        <linearGradient id={`${id}-path`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rim} stopOpacity=".2" />
          <stop offset=".5" stopColor={rim} stopOpacity=".07" />
          <stop offset="1" stopColor={rim} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${edge} L ${x(1100)} 1960 L -20 1960 Z`} fill={`url(#${id}-land)`} />
      <path d={edge} fill="none" stroke={rim} strokeWidth={3} opacity={0.35} />
      {path ? (
        <path d={`M 474 ${horizon + 24} C 540 ${horizon + 130} 600 ${horizon + 300} 470 1960 L 760 1960 C 760 ${horizon + 320} 620 ${horizon + 130} 504 ${horizon + 22} Z`} fill={`url(#${id}-path)`} />
      ) : null}
    </g>
  );
};

/** A flat-roofed house and its lower wing, a palm beside it. (x, y): the middle of its foot on the ground.
 * `lights`: 1, the window of the house; 2, the window of the wing as well; 0, no light at all (nobody answers yet).
 * `rim`: the colour of the light on its edges (the moon by default; a warm one at dawn). */
export const House: React.FC<{ id: string; x: number; y: number; scale: number; t: number; lights: 0 | 1 | 2; rim?: string }> = ({ id, x, y, scale, t, lights, rim = "#9fb6e6" }) => {
  const flicker = (d: number) => 0.9 + 0.1 * Math.sin(t * 2.3 + d) * Math.sin(t * 0.7 + 2 * d);
  const window = (cx: number, cy: number, d: number) => (
    <g opacity={flicker(d)}>
      <path d={`M ${cx - 22} ${cy + 34} L ${cx - 22} ${cy - 12} A 22 22 0 0 1 ${cx + 22} ${cy - 12} L ${cx + 22} ${cy + 34} Z`} fill={LIGHT} filter={`url(#${id}-glow)`} />
      <path d={`M ${cx - 22} ${cy + 34} L ${cx - 22} ${cy - 12} A 22 22 0 0 1 ${cx + 22} ${cy - 12} L ${cx + 22} ${cy + 34} Z`} fill="#ffe9c4" />
      <path d={`M ${cx} ${cy - 34} L ${cx} ${cy + 34} M ${cx - 22} ${cy + 2} L ${cx + 22} ${cy + 2}`} stroke={INK} strokeWidth={4} />
    </g>
  );
  const unlit = (cx: number, cy: number) => (
    <path d={`M ${cx - 22} ${cy + 34} L ${cx - 22} ${cy - 12} A 22 22 0 0 1 ${cx + 22} ${cy - 12} L ${cx + 22} ${cy + 34} Z`} fill="#0d1020" stroke={rim} strokeWidth={2} strokeOpacity={0.2} />
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <filter id={`${id}-glow`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      {/* the warm light the windows throw on the ground in front of the house */}
      {lights > 0 ? <ellipse cx={lights === 2 ? 40 : -30} cy={26} rx={lights === 2 ? 260 : 170} ry={30} fill={LIGHT} opacity={0.16} filter={`url(#${id}-soft)`} /> : null}
      {/* the palm, behind the house */}
      <g transform="translate(-250 0)">
        <path d="M -8 0 C -2 -110 6 -220 26 -330 L 40 -328 C 24 -220 18 -110 12 0 Z" fill={INK} />
        {[-78, -50, -24, 0, 26, 54, 82].map((a, i) => (
          <path key={i} d="M 0 0 C 50 -44 120 -50 176 -8 C 116 -26 56 -18 0 0 Z" fill={INK} transform={`translate(32 -330) rotate(${a - 90 + 2 * Math.sin(t * 0.8 + i)})`} />
        ))}
      </g>
      {/* the house: its main block, the parapet of its roof, a lower wing on the right */}
      <path d="M -170 0 L -170 -236 L -150 -236 L -150 -252 L -110 -252 L -110 -236 L 50 -236 L 50 -252 L 90 -252 L 90 -236 L 110 -236 L 110 0 Z" fill={INK} />
      <path d="M 110 0 L 110 -150 L 126 -150 L 126 -162 L 290 -162 L 290 -150 L 306 -150 L 306 0 Z" fill={INK} />
      {/* moonlight on the edges that face the moon */}
      <path d="M 110 -236 L 110 -150 M 306 -150 L 306 0" stroke={rim} strokeWidth={3} opacity={0.5} />
      <path d="M -150 -252 L -110 -252 M 50 -252 L 90 -252 M 126 -162 L 290 -162" stroke={rim} strokeWidth={3} opacity={0.4} />
      {/* the door, closed */}
      <path d="M -62 0 L -62 -96 A 34 34 0 0 1 6 -96 L 6 0 Z" fill="#0d1020" stroke={rim} strokeWidth={2} strokeOpacity={0.25} />
      {lights > 0 ? window(-110, -150, 0) : unlit(-110, -150)}
      {lights === 2 ? window(208, -84, 1.7) : lights === 0 ? unlit(208, -84) : null}
    </g>
  );
};
