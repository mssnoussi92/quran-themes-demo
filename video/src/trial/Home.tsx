// Silhouettes of the second trial short (the boy, 18:74 and 18:80-81; docs/retention.md): nobody is drawn,
// neither the boy nor his parents. A house under the moon with a lit window says « a father and a mother »;
// a second light says what the verse promises them in his place. Backlit shapes over a filmed sky, the same
// family as the boat.
const INK = "#05060d";
const LIGHT = "#ffd9a0";

/** The ground lit (owner, 2026-11-22, the Sunday review; first on the cave's shorts): Facebook marks a reel « vidéo avec
 * bordures » when the bottom of the frame is a dark band that never moves, and the land of the model was one (about 620
 * px from the horizon down, near black). Here it is a dim ground the moon or the sun can be seen on: a gradient of the
 * rock's own colour, a grain and patches of texture (fractal noise), a brighter strip under the edge, and two banks of
 * mist drifting across it at their own pace, so that the bottom of the frame is never still nor flat. The subtitles
 * stay readable on it (their shadow). */
export const LitGround: React.FC<{ id: string; edge: string; right: number; horizon: number; width: number; rim: string; warm: boolean; t: number }> = ({ id, edge, right, horizon, width, rim, warm, t }) => {
  const shape = `${edge} L ${right} 1960 L -20 1960 Z`;
  const [hi, mid, low] = warm ? ["#4a382c", "#33271f", "#261d18"] : ["#323a55", "#262c42", "#1c2134"];
  const mist = (k: number, y: number, speed: number, rx: number, alpha: number) => {
    const span = width + 2 * rx;
    const cx = ((t * speed + k * 0.37 * span) % span) - rx;
    return <ellipse key={k} cx={cx} cy={y} rx={rx} ry={rx * 0.11} fill={rim} opacity={alpha} filter={`url(#${id}-soft)`} />;
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-lit`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset=".3" stopColor={mid} />
          <stop offset="1" stopColor={low} />
        </linearGradient>
        <linearGradient id={`${id}-glow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rim} stopOpacity={0.26} />
          <stop offset="1" stopColor={rim} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={shape} />
        </clipPath>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.034" numOctaves={4} seed={7} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.25 -0.5" />
        </filter>
        <filter id={`${id}-fine`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={3} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 -0.45" />
        </filter>
        <filter id={`${id}-soft`} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      <path d={shape} fill={`url(#${id}-lit)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={-20} y={horizon - 60} width={width + 40} height={1980 - horizon} filter={`url(#${id}-grain)`} opacity={0.2} />
        <rect x={-20} y={horizon - 60} width={width + 40} height={1980 - horizon} filter={`url(#${id}-fine)`} opacity={0.07} />
        <rect x={-20} y={horizon - 60} width={width + 40} height={260} fill={`url(#${id}-glow)`} />
        {mist(0, horizon + 170, 9, 560, 0.16)}
        {mist(1, horizon + 380, 14, 720, 0.13)}
        {mist(2, horizon + 560, 6, 640, 0.1)}
      </g>
    </g>
  );
};

/** The land every scene stands on: a dark rise drawn over the bottom of the clip, lit along its edge (`rim`:
 * moonlight or the last light of the sun); `path`: a pale track coming up to the middle of the rise. */
export const Land: React.FC<{ id: string; horizon: number; rim: string; path?: boolean; width?: number; top?: string; lit?: boolean; warm?: boolean; t?: number }> = ({ id, horizon, rim, path = false, width = 1080, top = "#0b0e1c", lit = false, warm = false, t = 0 }) => {
  const x = (v: number) => Math.round((v * width) / 1080);
  const edge = `M -20 ${horizon + 46} C ${x(180)} ${horizon + 8} ${x(420)} ${horizon + 2} ${x(600)} ${horizon + 20} C ${x(800)} ${horizon + 40} ${x(960)} ${horizon + 6} ${x(1100)} ${horizon - 12}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-land`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset=".35" stopColor={INK} />
          <stop offset="1" stopColor="#030308" />
        </linearGradient>
        <linearGradient id={`${id}-path`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rim} stopOpacity=".2" />
          <stop offset=".5" stopColor={rim} stopOpacity=".07" />
          <stop offset="1" stopColor={rim} stopOpacity="0" />
        </linearGradient>
      </defs>
      {lit ? <LitGround id={id} edge={edge} right={x(1100)} horizon={horizon} width={width} rim={rim} warm={warm} t={t} /> : (
        <path d={`${edge} L ${x(1100)} 1960 L -20 1960 Z`} fill={`url(#${id}-land)`} />
      )}
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
