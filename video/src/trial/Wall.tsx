// Silhouettes of the third trial short (the wall, 18:77 and 18:82; docs/retention.md): a town that gave
// them nothing (no light at any window), a wall about to fall, the same wall set upright, and under it the
// glow of what was kept for two orphans. Things only, never a person. Backlit shapes over a filmed sunset.
const INK = "#05060d";
const FAR = "#0c0d18";
const LIGHT = "#ffd9a0";
const GOLD = "#ffcf6a";

/** The town on the horizon: flat-roofed houses with dark doors and windows, a few palms. */
export const Village: React.FC<{ horizon: number }> = ({ horizon }) => {
  const house = (x: number, w: number, h: number, key: number) => (
    <g key={key}>
      <rect x={x} y={horizon + 20 - h} width={w} height={h + 20} fill={FAR} />
      <rect x={x + w * 0.18} y={horizon + 20 - h - 10} width={w * 0.2} height={12} fill={FAR} />
      <rect x={x + w * 0.62} y={horizon + 20 - h - 10} width={w * 0.2} height={12} fill={FAR} />
      {/* a window and a door, both dark: nobody opened */}
      <rect x={x + w * 0.2} y={horizon + 20 - h * 0.72} width={w * 0.16} height={h * 0.2} fill="#03040a" />
      <path d={`M ${x + w * 0.56} ${horizon + 22} L ${x + w * 0.56} ${horizon + 20 - h * 0.42} A ${w * 0.11} ${w * 0.11} 0 0 1 ${x + w * 0.78} ${horizon + 20 - h * 0.42} L ${x + w * 0.78} ${horizon + 22} Z`} fill="#03040a" />
    </g>
  );
  const palm = (x: number, h: number, key: number) => (
    <g key={key} transform={`translate(${x} ${horizon + 20})`}>
      <path d={`M -4 0 C 0 ${-h / 3} 2 ${(-h * 2) / 3} 8 ${-h} L 14 ${-h} C 10 ${(-h * 2) / 3} 8 ${-h / 3} 6 0 Z`} fill={FAR} />
      {[-70, -40, -12, 14, 42, 72].map((a, i) => (
        <path key={i} d="M 0 0 C 22 -20 54 -22 80 -4 C 52 -12 24 -8 0 0 Z" fill={FAR} transform={`translate(11 ${-h}) rotate(${a - 90})`} />
      ))}
    </g>
  );
  return (
    <g>
      {[[18, 150, 120], [150, 120, 176], [262, 150, 104], [398, 96, 138], [770, 130, 150], [884, 110, 96], [976, 120, 170]].map(([x, w, h], i) => house(x, w, h, i))}
      {[[130, 190], [700, 150], [868, 210]].map(([x, h], i) => palm(x, h, 10 + i))}
    </g>
  );
};

/** The wall of 18:77. (x, y): the middle of its foot. `leaning`: about to fall, its top broken, stones at its
 * foot; otherwise set upright and whole (« فأقامه »). `treasure`: the glow of what lies under it (18:82). */
export const Wall: React.FC<{ id: string; x: number; y: number; scale: number; t: number; leaning?: boolean; treasure?: boolean }> = ({
  id, x, y, scale, t, leaning = false, treasure = false,
}) => {
  const rows = [0, 1, 2, 3, 4, 5];
  const tilt = leaning ? -13 + 0.6 * Math.sin(t * 1.1) : 0;
  const top = leaning
    ? "M -210 0 L -210 -262 L -150 -262 L -150 -300 L -64 -300 L -64 -276 L 4 -276 L 4 -238 L 70 -238 L 70 -196 L 132 -196 L 132 -150 L 210 -150 L 210 0 Z"
    : "M -210 0 L -210 -300 L 210 -300 L 210 0 Z";
  const pulse = 0.82 + 0.18 * Math.sin(t * 1.6);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <filter id={`${id}-glow`} x="-100%" y="-200%" width="300%" height="500%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <clipPath id={`${id}-shape`}>
          <path d={top} />
        </clipPath>
      </defs>
      {/* its shadow on the ground */}
      <ellipse cx={leaning ? -70 : 0} cy={14} rx={300} ry={22} fill="#000" opacity={0.45} filter={`url(#${id}-soft)`} />
      <g transform={`rotate(${tilt} 210 0)`}>
        <path d={top} fill={INK} />
        {/* the courses of its stones, caught by the low light */}
        <g clipPath={`url(#${id}-shape)`} stroke="#ffbe7a" strokeOpacity={0.16} strokeWidth={2.5}>
          {rows.map((r) => (
            <g key={r}>
              <line x1={-210} y1={-50 * (r + 1)} x2={210} y2={-50 * (r + 1)} />
              {[-140, -70, 0, 70, 140].map((c) => (
                <line key={c} x1={c + (r % 2 ? 35 : 0)} y1={-50 * r} x2={c + (r % 2 ? 35 : 0)} y2={-50 * (r + 1)} />
              ))}
            </g>
          ))}
        </g>
        {/* the light of the sun along the edge that faces it */}
        <path d={leaning ? "M -210 0 L -210 -262 L -150 -262 L -150 -300 L -64 -300" : "M -210 0 L -210 -300 L 210 -300"} fill="none" stroke="#ffc98a" strokeWidth={3.5} opacity={0.55} />
        {leaning ? <path d="M 30 -238 L 16 -170 L 44 -120 L 26 -40" fill="none" stroke="#ffbe7a" strokeWidth={3} opacity={0.5} /> : null}
      </g>
      {/* the stones already fallen from it */}
      {leaning
        ? [[-330, -8, 54, 34, -12], [-268, 4, 40, 26, 18], [-386, 6, 34, 24, 30]].map(([sx, sy, w, h, a], i) => (
            <rect key={i} x={sx} y={sy - h} width={w} height={h} rx={5} fill={INK} stroke="#ffbe7a" strokeOpacity={0.3} strokeWidth={2} transform={`rotate(${a} ${sx + w / 2} ${sy - h / 2})`} />
          ))
        : null}
      {/* what was kept under it: a jar of gold in the ground, its light coming up along the foot of the wall */}
      {treasure ? (
        <g opacity={pulse} transform="translate(0 -18)">
          <ellipse cx={0} cy={86} rx={250} ry={80} fill={GOLD} opacity={0.5} filter={`url(#${id}-glow)`} />
          <ellipse cx={0} cy={22} rx={230} ry={10} fill={LIGHT} opacity={0.75} filter={`url(#${id}-soft)`} />
          <path d="M -42 150 C -66 122 -62 78 -30 62 L -30 46 L 30 46 L 30 62 C 62 78 66 122 42 150 Z" fill="#1a1206" stroke={GOLD} strokeWidth={4} />
          <ellipse cx={0} cy={46} rx={30} ry={9} fill={GOLD} />
          {[[-16, 30], [8, 24], [22, 34], [-4, 36]].map(([cx, cy], i) => (
            <ellipse key={i} cx={cx} cy={cy} rx={11} ry={5} fill="#ffe9a8" />
          ))}
          {[[-70, 40, 0], [64, 26, 1.3], [-20, 4, 2.2], [36, -4, 3.1]].map(([cx, cy, d], i) => (
            <circle key={i} cx={cx} cy={cy - 14 * ((t * 0.5 + d) % 1)} r={3.2} fill="#fff3cf" opacity={1 - ((t * 0.5 + d) % 1)} />
          ))}
        </g>
      ) : null}
    </g>
  );
};
