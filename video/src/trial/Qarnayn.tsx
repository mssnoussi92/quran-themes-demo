// Silhouettes of the Dhul-Qarnayn film (content/trial/west.yaml, tribute.yaml, barrier.yaml; docs/themes.md):
// three tests of power, and nobody drawn. A people is its dwellings (dark, then lit when each one is treated
// as he deserves); a tribute is a chest left on the ground; the barrier is blocks of iron laid between two
// walls of rock, the fire blown under them, molten copper run into their joints. Gog and Magog are never drawn,
// nor the barrier levelled (the promise of the end is not pictured). Backlit shapes over filmed skies.
const INK = "#05060d";
const LIGHT = "#ffd9a0";
const COPPER = "#ffb35a";

/** The dwellings of a people: low flat-roofed houses side by side. (x, y): the middle of their foot on the
 * ground. `lit`: how many of their windows are lit (0: none; they light from the middle outwards). */
export const Dwellings: React.FC<{ id: string; x: number; y: number; scale: number; t: number; lit: number; rim?: string }> = ({ id, x, y, scale, t, lit, rim = "#ffc98a" }) => {
  // [left, width, height, order in which its window lights]
  const houses: [number, number, number, number][] = [[-330, 130, 150, 3], [-190, 160, 214, 1], [-20, 120, 132, 4], [110, 180, 186, 0], [300, 130, 146, 2]];
  const flicker = (d: number) => 0.9 + 0.1 * Math.sin(t * 2.1 + d) * Math.sin(t * 0.6 + 2 * d);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <filter id={`${id}-glow`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      {lit > 0 ? <ellipse cx={30} cy={26} rx={120 + 60 * Math.min(lit, 5)} ry={30} fill={LIGHT} opacity={0.14} filter={`url(#${id}-soft)`} /> : null}
      {houses.map(([left, w, h, order], i) => {
        const cx = left + w / 2;
        const cy = -h * 0.55;
        const shape = `M ${cx - 16} ${cy + 26} L ${cx - 16} ${cy - 8} A 16 16 0 0 1 ${cx + 16} ${cy - 8} L ${cx + 16} ${cy + 26} Z`;
        return (
          <g key={i}>
            <path d={`M ${left} 0 L ${left} ${-h} L ${left + 16} ${-h} L ${left + 16} ${-h - 12} L ${left + w - 16} ${-h - 12} L ${left + w - 16} ${-h} L ${left + w} ${-h} L ${left + w} 0 Z`} fill={INK} />
            <path d={`M ${left + 16} ${-h - 12} L ${left + w - 16} ${-h - 12} M ${left + w} ${-h} L ${left + w} 0`} stroke={rim} strokeWidth={3} opacity={0.42} />
            {order < lit ? (
              <g opacity={flicker(i * 1.3)}>
                <path d={shape} fill={LIGHT} filter={`url(#${id}-glow)`} />
                <path d={shape} fill="#ffe9c4" />
              </g>
            ) : (
              <path d={shape} fill="#0d1020" stroke={rim} strokeWidth={2} strokeOpacity={0.2} />
            )}
          </g>
        );
      })}
    </g>
  );
};

/** One wall of rock, drawn from its outer edge (x = 0) to its foot in the pass (x = w): a dark body, a plane that
 * faces the pass and takes the light of the sky, cracks, a line of light along its top. `glow`: how much of the
 * fire it takes on that plane (0 to 1). `tilt`: a small change of its outline, so the two walls are not twins. */
const Rock: React.FC<{ id: string; w: number; h: number; base: number; rim: string; glow: number; tilt: number; slope?: boolean }> = ({ id, w, h, base, rim, glow, tilt, slope = false }) => {
  const top = base - h;
  const y = (k: number, d = 0) => top + h * k + d * tilt;
  // the outline, from the outer foot, over the top, down the face that looks into the pass
  // `slope`: its outer side is in the frame (the wide film): it climbs from the ground instead of standing cut
  const rise = slope ? `L ${w * 0.07} ${y(0.62, 0)} L ${w * 0.04} ${y(0.4, 0)} L ${w * 0.13} ${y(0.14, 8)}` : `L 0 ${y(0.1, 14)}`;
  const crest = `${rise} L ${w * 0.2} ${y(0.02, -10)} L ${w * 0.36} ${y(0.09, 12)} L ${w * 0.54} ${y(0.03, -8)} L ${w * 0.72} ${y(0.12, 10)} L ${w * 0.86} ${y(0.2, 0)}`;
  const face = `L ${w * 0.8} ${y(0.4, 8)} L ${w * 0.93} ${y(0.47, 0)} L ${w * 0.88} ${y(0.68, -6)} L ${w * 0.97} ${y(0.75, 0)} L ${w} ${base}`;
  const plane = `M ${w * 0.86} ${y(0.2, 0)} ${face} L ${w * 0.78} ${base} L ${w * 0.7} ${y(0.72, 0)} L ${w * 0.74} ${y(0.5, 0)} L ${w * 0.62} ${y(0.38, 6)} L ${w * 0.7} ${y(0.24, 0)} Z`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e1326" />
          <stop offset=".55" stopColor="#070912" />
          <stop offset="1" stopColor="#030308" />
        </linearGradient>
        <linearGradient id={`${id}-plane`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b2440" />
          <stop offset="1" stopColor="#0b0f1e" />
        </linearGradient>
        <linearGradient id={`${id}-lit`} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff8a2e" stopOpacity=".75" />
          <stop offset=".6" stopColor="#ff9a3a" stopOpacity=".22" />
          <stop offset="1" stopColor="#ffb35a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M 0 ${base} ${crest} ${face} Z`} fill={`url(#${id}-body)`} />
      {/* the plane that faces the pass: the light of the sky, then the light of the fire */}
      <path d={plane} fill={`url(#${id}-plane)`} opacity={0.9} />
      {glow > 0 ? <path d={plane} fill={`url(#${id}-lit)`} opacity={glow} /> : null}
      {/* a second, fainter plane higher up, and the cracks of the rock */}
      <path d={`M ${w * 0.2} ${y(0.02, -10)} L ${w * 0.36} ${y(0.09, 12)} L ${w * 0.3} ${y(0.34, 0)} L ${w * 0.12} ${y(0.26, 0)} Z`} fill="#141b30" opacity={0.55} />
      <path d={`M ${w * 0.54} ${y(0.03, -8)} L ${w * 0.5} ${y(0.3, 0)} L ${w * 0.58} ${y(0.52, 0)} M ${w * 0.3} ${y(0.34, 0)} L ${w * 0.36} ${y(0.6, 0)} L ${w * 0.28} ${y(0.82, 0)} M ${w * 0.12} ${y(0.26, 0)} L ${w * 0.08} ${y(0.55, 0)}`} fill="none" stroke={rim} strokeWidth={2} opacity={0.13} />
      {/* the line of light: along the top, and down the edge of the pass */}
      <path d={`M 0 ${base} ${crest}`} fill="none" stroke={rim} strokeWidth={3} opacity={slope ? 0.42 : 0} />
      {slope ? null : <path d={`M 0 ${y(0.1, 14)} ${crest.slice(crest.indexOf("L", 2))}`} fill="none" stroke={rim} strokeWidth={3} opacity={0.42} />}
      <path d={`M ${w * 0.86} ${y(0.2, 0)} ${face}`} fill="none" stroke={glow > 0.05 ? COPPER : rim} strokeWidth={3} opacity={0.45 + 0.3 * glow} />
    </g>
  );
};

/** Two walls of rock and the pass between them, for a frame `width` wide. `middle`: the middle of the pass;
 * `gap`: its width at the ground; `height`: how high the walls stand over the horizon; `glow`: the fire on the
 * faces that look into the pass (0 to 1); `open`: the outer side of the left wall is in the frame (the film).
 * A little mist lies at their foot, as in the filmed sky behind. */
export const Cliffs: React.FC<{ id: string; horizon: number; middle: number; gap: number; height: number; rim: string; width?: number; glow?: number; open?: boolean }> = ({ id, horizon, middle, gap, height, rim, width = 1080, glow = 0, open = false }) => {
  const l = middle - gap / 2;
  const r = middle + gap / 2;
  const base = horizon + 80;
  return (
    <g>
      <defs>
        <filter id={`${id}-mist`} x="-20%" y="-150%" width="140%" height="400%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>
      <g transform="translate(-40 0)">
        <Rock id={`${id}-l`} w={l + 40} h={height + 80} base={base} rim={rim} glow={glow} tilt={1} slope={open} />
      </g>
      <g transform={`translate(${width + 40} 0) scale(-1 1)`}>
        <Rock id={`${id}-r`} w={width + 40 - r} h={(height + 80) * 0.93} base={base} rim={rim} glow={glow} tilt={-1.4} />
      </g>
      <ellipse cx={middle} cy={horizon + 4} rx={gap * 1.3} ry={46} fill="#c9d4f0" opacity={0.1} filter={`url(#${id}-mist)`} />
    </g>
  );
};

/** The tribute they offer: a chest on the ground. `open`: its lid up, the coins catching the light; closed and
 * dull when it is refused. (x, y): the middle of its foot. */
export const Chest: React.FC<{ id: string; x: number; y: number; scale: number; t: number; open: boolean; rim?: string }> = ({ id, x, y, scale, t, open, rim = "#cfd8e6" }) => {
  const shine = 0.85 + 0.15 * Math.sin(t * 1.7);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <filter id={`${id}-glow`} x="-150%" y="-250%" width="400%" height="600%">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>
      <ellipse cx={0} cy={10} rx={150} ry={16} fill="#000" opacity={0.45} />
      {open ? (
        <>
          <ellipse cx={0} cy={-104} rx={120} ry={44} fill={LIGHT} opacity={0.5 * shine} filter={`url(#${id}-glow)`} />
          {/* the lid, thrown back */}
          <path d="M -104 -96 L -92 -176 C -40 -206 40 -206 92 -176 L 104 -96 Z" fill={INK} stroke={rim} strokeWidth={2.5} strokeOpacity={0.35} />
          {/* the coins, heaped over the rim */}
          <path d="M -92 -92 C -60 -134 60 -134 92 -92 Z" fill="#f6c873" opacity={shine} />
          {[-62, -34, -6, 22, 50].map((cx, i) => (
            <ellipse key={i} cx={cx} cy={-104 - (i % 2) * 10} rx={17} ry={7} fill="#ffe2a6" opacity={0.9 * shine} />
          ))}
        </>
      ) : (
        <path d="M -108 -96 C -104 -150 104 -150 108 -96 Z" fill="#0b0e1c" stroke={rim} strokeWidth={3} strokeOpacity={0.6} />
      )}
      <path d="M -104 0 L -104 -96 L 104 -96 L 104 0 Z" fill="#0b0e1c" stroke={rim} strokeWidth={3} strokeOpacity={0.55} />
      <path d="M -104 -62 L 104 -62 M -40 -96 L -40 0 M 40 -96 L 40 0" stroke={rim} strokeWidth={2.5} opacity={0.32} />
      <rect x={-14} y={-108} width={28} height={30} rx={4} fill="#0b0e1c" stroke={rim} strokeWidth={2.5} strokeOpacity={0.5} />
    </g>
  );
};

/** Blocks of iron laid between the two walls, course on course. (x, y): the middle of the foot of the barrier;
 * `span`: its width; `full`: its height when finished. `level`: how much of it is laid (0 to 1). `heat`: the
 * fire blown under it (0 to 1). `copper`: the molten copper run into the joints, from the top down (0 to 1);
 * once cold it stays as a dull seam. */
export const Barrier: React.FC<{ id: string; x: number; y: number; span: number; full: number; level: number; heat: number; copper: number; t: number; rim: string }> = ({ id, x, y, span, full, level, heat, copper, t, rim }) => {
  const course = 54;
  const rows = Math.ceil(full / course);
  const laid = Math.max(0, Math.min(1, level)) * rows;
  const flick = 0.82 + 0.18 * Math.sin(t * 5.3) * Math.sin(t * 2.1 + 1);
  const blocks: React.ReactNode[] = [];
  const seams: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    const there = Math.max(0, Math.min(1, laid - row));        // the course being laid comes in from the left
    if (there <= 0) break;
    const top = -(row + 1) * course;
    const count = 4;
    const w = span / count;
    const shift = row % 2 ? w / 2 : 0;
    for (let k = -1; k <= count; k++) {
      const bx = -span / 2 + k * w + shift;
      const a = Math.max(-span / 2, bx);
      const b = Math.min(span / 2, bx + w);
      if (b - a < 6 || (a + span / 2) / span > there) continue;
      const shade = ["#0a0d19", "#0c1020", "#090b16", "#0d1122"][(row * 3 + k + 8) % 4];
      blocks.push(
        <g key={`${row}-${k}`}>
          <rect x={a + 2} y={top + 2} width={b - a - 4} height={course - 4} rx={3} fill={shade} stroke={rim} strokeWidth={1.5} strokeOpacity={0.2} />
          <path d={`M ${a + 6} ${top + 5} L ${b - 6} ${top + 5}`} stroke={rim} strokeWidth={2} opacity={0.14} />
        </g>,
      );
      // how far the copper has run down: the top courses first
      const reached = Math.max(0, Math.min(1, copper * rows - (rows - 1 - row)));
      if (reached > 0) {
        seams.push(<path key={`s-${row}-${k}`} d={`M ${a} ${top} L ${b} ${top} M ${a} ${top} L ${a} ${top + course * reached}`} stroke={COPPER} strokeWidth={4} strokeLinecap="round" opacity={0.25 + 0.6 * heat * flick + 0.12 * (1 - heat)} />);
      }
    }
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${id}-heat`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff7a2a" stopOpacity=".85" />
          <stop offset=".55" stopColor="#ff9a3a" stopOpacity=".3" />
          <stop offset="1" stopColor="#ffb35a" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-fire`} x="-60%" y="-200%" width="220%" height="500%">
          <feGaussianBlur stdDeviation="34" />
        </filter>
      </defs>
      {heat > 0 ? <ellipse cx={0} cy={-10} rx={span * 0.62} ry={90} fill="#ff8a2e" opacity={0.55 * heat * flick} filter={`url(#${id}-fire)`} /> : null}
      {blocks}
      {heat > 0 ? <rect x={-span / 2} y={-Math.min(laid, rows) * course} width={span} height={Math.min(laid, rows) * course} fill={`url(#${id}-heat)`} opacity={0.75 * heat * flick} /> : null}
      {seams}
      {/* the light of the sky along its top, once it stands */}
      {laid >= rows ? <path d={`M ${-span / 2} ${-rows * course} L ${span / 2} ${-rows * course}`} stroke={rim} strokeWidth={3} opacity={0.5} /> : null}
    </g>
  );
};
