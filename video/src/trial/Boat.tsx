// Silhouettes of the trial short (docs/retention.md, 2026-11-11): what the verse tells, drawn as backlit
// shapes over filmed sea. Things only, never a person. Coordinates are local: (0, 0) is the middle of the
// boat at its waterline.
const INK = "#06070f";
const LIGHT = "#ffd9a0";

/** The boat of 18:71: a dhow with a lateen sail, bobbing; `holed` shows the plank torn out at the
 * waterline, the light of the sea through the gap and, with `splash`, the water thrown up at it. */
export const Boat: React.FC<{ x: number; y: number; scale: number; t: number; holed?: boolean; splash?: boolean; plank?: boolean; bird?: boolean; id: string }> = ({
  x, y, scale, t, holed = true, splash = true, plank = true, bird = false, id,
}) => {
  const bob = 5 * Math.sin(t * 1.4);
  const tilt = (holed ? -3.5 : -1) + 1.2 * Math.sin(t * 0.9);
  const ring = (d: number) => (t * 0.55 + d) % 1;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-sail`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b0d22" />
          <stop offset=".7" stopColor="#2a2238" />
          <stop offset="1" stopColor="#6a4048" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={`${id}-soft`} x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      {/* its shadow on the water */}
      <ellipse cx={10} cy={34} rx={330} ry={26} fill={INK} opacity={0.32} filter={`url(#${id}-soft)`} />
      {/* rings spreading under the gap */}
      {holed && splash
        ? [0, 0.5].map((d) => {
            const r = ring(d);
            return (
              <ellipse key={d} cx={-78} cy={46} rx={70 + 200 * r} ry={11 + 28 * r} fill="none" stroke={LIGHT} strokeWidth={3} opacity={0.55 * (1 - r)} />
            );
          })
        : null}
      <g transform={`rotate(${tilt})`}>
        <path d="M -178 -324 Q 50 -354 232 -650 Q 170 -330 78 -78 Q -60 -180 -178 -324 Z" fill={`url(#${id}-sail)`} />
        <path d="M -178 -324 Q 50 -354 232 -650" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <path d="M 232 -650 Q 170 -330 78 -78" fill="none" stroke="#ffc98a" strokeWidth={3} opacity={0.5} />
        <line x1={8} y1={-40} x2={36} y2={-568} stroke={INK} strokeWidth={13} strokeLinecap="round" />
        <line x1={36} y1={-568} x2={310} y2={-78} stroke={INK} strokeWidth={3} opacity={0.8} />
        <line x1={36} y1={-568} x2={-274} y2={-100} stroke={INK} strokeWidth={3} opacity={0.8} />
        <path
          d="M -320 -126 C -256 -40 -170 12 -60 16 L 180 16 C 266 12 322 -40 356 -114 L 320 -88 C 250 -48 140 -40 12 -40 C -120 -40 -226 -62 -320 -126 Z"
          fill={INK}
        />
        <path d="M 356 -114 L 320 -88 C 250 -48 140 -40 12 -40" fill="none" stroke="#ffbe7a" strokeWidth={3.5} opacity={0.6} />
        {/* the sparrow of the hadith (Bukhari 3401), on the edge of the boat: it dips its beak towards the sea */}
        {bird ? (
          <g transform={`translate(-262 -112) scale(1.5) rotate(${-8 + 16 * Math.max(0, Math.sin(t * 1.3)) ** 3})`}>
            <ellipse cx={0} cy={-20} rx={24} ry={15} fill={INK} />
            <circle cx={-22} cy={-32} r={11} fill={INK} />
            <path d="M -31 -31 L -47 -26 L -31 -24 Z" fill={INK} />
            <path d="M 18 -24 L 50 -34 L 44 -16 Z" fill={INK} />
            <path d="M -4 -6 L -6 4 M 6 -6 L 6 4" stroke={INK} strokeWidth={3} />
            <path d="M -18 -30 Q 0 -40 22 -26" fill="none" stroke="#ffc98a" strokeWidth={2} opacity={0.6} />
          </g>
        ) : null}
        {holed ? (
          <>
            <polygon points="-140,-28 -108,-40 -84,-24 -50,-38 -22,-18 -32,12 -66,6 -98,16 -134,4" fill={LIGHT} filter={`url(#${id}-glow)`} opacity={splash ? 1 : 0.6} />
            <polygon points="-140,-28 -108,-40 -84,-24 -50,-38 -22,-18 -32,12 -66,6 -98,16 -134,4" fill="#ffe9c4" opacity={splash ? 1 : 0.75} />
            <path d="M -108 -40 l 10 22 M -50 -38 l -8 20 M -98 16 l 8 -18" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          </>
        ) : null}
      </g>
      {/* water thrown up at the gap: drops rising and falling back, one after the other */}
      {holed && splash
        ? Array.from({ length: 8 }, (_, k) => {
            const p = (t * 1.15 + k / 8) % 1;
            const side = (k % 2 ? 1 : -1) * (26 + 16 * (k % 3));
            const cx = -80 + side * (0.4 + 1.5 * p);
            const cy = -14 - (120 + 22 * (k % 4)) * 4 * p * (1 - p);
            return <circle key={k} cx={cx} cy={cy} r={9 * (1 - 0.45 * p)} fill="#ffe6bd" opacity={p > 0.88 ? (1 - p) * 8 : 0.95} />;
          })
        : null}
      {/* the torn plank, drifting away */}
      {holed && plank ? (
        <g transform={`translate(${-300 - 6 * t} ${96 + 4 * Math.sin(t * 1.7)}) rotate(${-16 + 4 * Math.sin(t * 1.2)})`}>
          <rect x={-62} y={-10} width={124} height={20} rx={4} fill={INK} />
          <rect x={-62} y={-10} width={124} height={4} fill="#ffbe7a" opacity={0.5} />
        </g>
      ) : null}
    </g>
  );
};

/** A big ship far away, in the haze of the horizon (18:79: a king who seized every sound ship): a long
 * hull and two lateen sails, the same family of shapes as the boat. */
const Ship: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#0a0c1a">
    <path d="M -210 -22 C -170 14 -110 30 -40 32 L 120 32 C 176 30 214 2 236 -40 L 208 -22 C 160 2 90 6 10 6 C -80 6 -150 -4 -210 -22 Z" />
    <rect x={-66} y={-250} width={7} height={256} />
    <path d="M -160 -150 Q -30 -160 70 -300 Q 34 -150 -10 -40 Q -90 -90 -160 -150 Z" />
    <rect x={84} y={-190} width={6} height={196} />
    <path d="M 20 -110 Q 110 -118 178 -220 Q 152 -110 122 -30 Q 66 -66 20 -110 Z" />
  </g>
);

/** The king's ships, on the horizon behind the boat, coming on slowly. */
export const Fleet: React.FC<{ horizon: number; t: number }> = ({ horizon, t }) => (
  <g opacity={0.8}>
    <Ship x={720 - 4 * t} y={horizon - 2} s={0.3} />
    <Ship x={880 - 3.2 * t} y={horizon - 1} s={0.22} />
    <Ship x={990 - 2.6 * t} y={horizon - 1} s={0.16} />
  </g>
);
