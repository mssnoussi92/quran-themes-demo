// Silhouettes of the series « آية وحكايتها » (content/trial/ayah.yaml, caravan.yaml, duha.yaml, hope.yaml;
// docs/themes.md): one verse and the report of its revelation, and nobody drawn. The caravan of 62:11 is its
// loaded camels (a creature the report names: « عير تحمل طعاما ») and the place of the Friday sermon is palm
// trunks, a roof and the steps of a minbar, empty, with lamps that go out until twelve are left (the twelve men
// who stayed, by their count only). Ad-Duha is a night that lifts, then three lights for what the surah recalls
// (a shelter, a guidance, a provision). Az-Zumar 39:53 is a road in the rain and a gate that opens.
// Backlit shapes over a filmed desert, a filmed dawn and a filmed storm sky.
const INK = "#05060d";
const LIGHT = "#ffd9a0";

/** A number between 0 and 1 from an index: the same at every frame (the render draws frames in any order). */
const chance = (i: number, salt = 0) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const CAMEL =
  "M 14 -168 C 2 -172 -12 -166 -16 -154 L -6 -146 C 6 -146 12 -140 16 -128 C 22 -104 32 -90 50 -84 L 52 -44 L 47 0 L 58 0 L 63 -46 " +
  "L 70 -48 L 74 0 L 85 0 L 83 -54 C 100 -48 124 -48 140 -56 L 137 0 L 148 0 L 153 -50 L 160 -48 L 165 0 L 176 0 L 172 -64 " +
  "C 180 -78 178 -96 168 -106 C 158 -112 146 -110 136 -118 C 126 -150 98 -152 88 -120 C 76 -108 62 -106 54 -112 C 44 -122 38 -138 34 -156 C 30 -166 22 -170 14 -168 Z";

/** A line of loaded camels, tied one to the next, walking to the left, or to the right with `right` (the line is
 * then drawn mirrored). (x, y): the feet of the first one. `rim`: the colour of the light on their backs. */
export const Caravan: React.FC<{ id: string; x: number; y: number; scale: number; t: number; count?: number; rim?: string; right?: boolean }> = ({ id, x, y, scale, t, count = 3, rim = "#ffd9a0", right = false }) => (
  <g transform={`translate(${x} ${y}) scale(${right ? -scale : scale} ${scale})`}>
    <defs>
      <filter id={`${id}-soft`} x="-20%" y="-300%" width="140%" height="700%">
        <feGaussianBlur stdDeviation="8" />
      </filter>
    </defs>
    {Array.from({ length: count }, (_, k) => {
      const step = 3 * Math.sin(t * 1.6 + k * 1.3);
      const at = k * 232;
      return (
        <g key={k} transform={`translate(${at} ${step * 0.4})`}>
          <ellipse cx={90} cy={6} rx={110} ry={12} fill="#000" opacity={0.45} filter={`url(#${id}-soft)`} />
          {/* the rope to the camel behind */}
          {k < count - 1 ? <path d={`M 172 -86 C 196 -70 212 -120 ${232 - 14} ${-150 + (3 * Math.sin(t * 1.6 + (k + 1) * 1.3) - step) * 0.4}`} fill="none" stroke={INK} strokeWidth={4} /> : null}
          <path d={CAMEL} fill={INK} />
          {/* its load: two sacks over the hump */}
          <path d="M 70 -122 C 66 -150 86 -170 110 -170 C 136 -170 156 -150 152 -122 C 150 -104 130 -98 110 -98 C 92 -98 72 -104 70 -122 Z" fill={INK} />
          <path d="M 110 -170 L 110 -98" stroke="#1a1c2a" strokeWidth={3} />
          {/* the light along its back and its load */}
          <path d="M 70 -122 C 66 -150 86 -170 110 -170 C 136 -170 156 -150 152 -122" fill="none" stroke={rim} strokeWidth={3} opacity={0.6} />
          <path d="M 34 -156 C 30 -166 22 -170 14 -168 C 2 -172 -12 -166 -16 -154" fill="none" stroke={rim} strokeWidth={3} opacity={0.6} />
          <path d="M 168 -106 C 178 -96 180 -78 172 -64" fill="none" stroke={rim} strokeWidth={3} opacity={0.4} />
        </g>
      );
    })}
  </g>
);

/** Which lamps stay lit last: lamp `k` is lit while `lit` is over its rank. */
const RANK = [7, 19, 2, 13, 22, 5, 16, 10, 0, 21, 8, 14, 3, 18, 11, 23, 6, 15, 1, 20, 9, 12, 4, 17];

/** Where a sermon is given: palm trunks, a roof of palm, the steps of a minbar (empty: nobody is drawn), and
 * twenty-four lamps under the roof. `lit`: how many burn (24: everyone is there; 12: those who stayed); a
 * fraction is a lamp going out. (x, y): the foot of its first trunk. */
export const Sermon: React.FC<{ id: string; x: number; y: number; scale: number; t: number; lit: number; rim?: string }> = ({ id, x, y, scale, t, lit, rim = "#ffd9a0" }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" stopColor="#fff3cf" stopOpacity=".95" />
        <stop offset=".3" stopColor={LIGHT} stopOpacity=".5" />
        <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-soft`} x="-20%" y="-300%" width="140%" height="700%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
    </defs>
    <ellipse cx={290} cy={10} rx={360} ry={18} fill="#000" opacity={0.5} filter={`url(#${id}-soft)`} />
    {/* the roof: a beam and the palm leaves laid over it */}
    <path d={`M -34 -372 L 614 -372 L 606 -346 L -26 -346 Z`} fill={INK} />
    <path d={Array.from({ length: 22 }, (_, k) => `M ${-30 + k * 30} -372 l ${10 + 8 * chance(k)} ${-18 - 16 * chance(k, 1)} l ${12 + 6 * chance(k, 2)} ${18 + 16 * chance(k, 1)} Z`).join(" ")} fill={INK} />
    <path d="M -34 -372 L 614 -372" stroke={rim} strokeWidth={3} opacity={0.45} />
    {/* the trunks */}
    {[0, 145, 290, 435, 580].map((cx, k) => (
      <g key={k}>
        <path d={`M ${cx - 13} 4 L ${cx - 9} -348 L ${cx + 9} -348 L ${cx + 13} 4 Z`} fill={INK} />
        <path d={`M ${cx + 9} -348 L ${cx + 13} 4`} stroke={rim} strokeWidth={2.5} opacity={0.4} />
      </g>
    ))}
    {/* the minbar: three steps and its post, nobody on it */}
    <path d="M 452 4 L 452 -44 L 486 -44 L 486 -88 L 520 -88 L 520 -132 L 556 -132 L 556 4 Z" fill={INK} />
    <path d="M 550 -132 L 550 -218 L 562 -218 L 562 4 L 550 4 Z" fill={INK} />
    <path d="M 452 -44 L 486 -44 L 486 -88 L 520 -88 L 520 -132 L 556 -132" fill="none" stroke={rim} strokeWidth={2.5} opacity={0.5} />
    {/* the lamps: three rows under the roof */}
    {Array.from({ length: 24 }, (_, k) => {
      const row = Math.floor(k / 8);
      const cx = 22 + (k % 8) * 58 + (row === 1 ? 29 : 0);
      const cy = -306 + row * 62;
      const on = Math.max(0, Math.min(1, lit - RANK[k]));
      const flicker = 0.88 + 0.12 * Math.sin(t * 2.1 + k * 1.7) * Math.sin(t * 0.8 + k);
      return (
        <g key={k}>
          <path d={`M ${cx} -346 L ${cx} ${cy - 9}`} stroke={INK} strokeWidth={2} />
          <circle cx={cx} cy={cy} r={9} fill="#141624" stroke="#2a2d40" strokeWidth={1.5} />
          <g opacity={on * flicker}>
            <circle cx={cx} cy={cy} r={38} fill={`url(#${id}-glow)`} />
            <circle cx={cx} cy={cy} r={8} fill="#fff1cc" />
          </g>
        </g>
      );
    })}
  </g>
);

/** Stars of a still night, in the upper part of the frame: they pale as `night` goes to 0. */
export const Stars: React.FC<{ t: number; night: number; width?: number; height?: number }> = ({ t, night, width = 1080, height = 1150 }) => (
  <g opacity={night}>
    {Array.from({ length: 70 }, (_, k) => {
      const twinkle = 0.55 + 0.45 * Math.sin(t * (0.6 + chance(k, 3)) + k);
      return <circle key={k} cx={chance(k) * width} cy={90 + chance(k, 1) * height} r={1.8 + 2.8 * chance(k, 2)} fill="#eef2ff" opacity={0.9 * twinkle} />;
    })}
  </g>
);

/** A lantern on its post: a guidance. `lit`: 0 dark, 1 burning. (x, y): the foot of the post. */
export const Lantern: React.FC<{ id: string; x: number; y: number; scale: number; t: number; lit: number; rim?: string }> = ({ id, x, y, scale, t, lit, rim = "#ffc98a" }) => {
  const breath = 0.88 + 0.12 * Math.sin(t * 1.9);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#fff3cf" stopOpacity=".95" />
          <stop offset=".3" stopColor={LIGHT} stopOpacity=".5" />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M -7 6 L -5 -250 C -5 -282 20 -296 44 -290 L 44 -280 C 26 -284 6 -274 6 -250 L 8 6 Z" fill={INK} />
      <path d="M 6 -250 L 8 6" stroke={rim} strokeWidth={2.5} opacity={0.4} />
      <path d="M 44 -284 L 44 -262" stroke={INK} strokeWidth={3} />
      <g opacity={lit * breath}>
        <circle cx={44} cy={-232} r={150} fill={`url(#${id}-glow)`} />
      </g>
      <path d="M 26 -262 L 62 -262 L 56 -206 L 32 -206 Z" fill={lit > 0.5 ? "#ffe9c4" : "#101220"} stroke={INK} strokeWidth={5} opacity={1} />
      <path d="M 22 -262 L 44 -276 L 66 -262 Z M 30 -206 L 58 -206 L 54 -198 L 34 -198 Z" fill={INK} />
    </g>
  );
};

/** A date palm heavy with fruit: a provision. `fruit`: 0 dark, 1 its dates catch the light. (x, y): its foot. */
export const Palm: React.FC<{ id: string; x: number; y: number; scale: number; t: number; fruit: number; rim?: string }> = ({ id, x, y, scale, t, fruit, rim = "#ffc98a" }) => {
  const sway = 1.6 * Math.sin(t * 0.6);
  const frond = (angle: number, length: number, k: number) => {
    const droop = 0.2 * length;
    return (
      <g key={k} transform={`rotate(${angle + sway * (0.4 + 0.2 * k)})`}>
        <path d={`M 0 -6 C ${length * 0.3} ${-length * 0.26} ${length * 0.72} ${-length * 0.2} ${length} ${droop} C ${length * 0.78} ${length * 0.08} ${length * 0.4} ${length * 0.06} 0 18 Z`} fill={INK} />
        <path d={`M 0 -6 C ${length * 0.3} ${-length * 0.26} ${length * 0.72} ${-length * 0.2} ${length} ${droop}`} fill="none" stroke={rim} strokeWidth={2.5} opacity={0.35} />
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#fff3cf" stopOpacity=".9" />
          <stop offset=".35" stopColor={LIGHT} stopOpacity=".45" />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M -16 8 C -6 -120 -22 -240 6 -360 L 26 -356 C 4 -240 18 -120 18 8 Z" fill={INK} />
      <path d="M 26 -356 C 4 -240 18 -120 18 8" fill="none" stroke={rim} strokeWidth={2.5} opacity={0.4} />
      <g transform="translate(16 -362)">
        {[[-8, 250], [-40, 236], [-72, 214], [-104, 196], [-136, 210], [-166, 236], [-196, 250], [22, 214], [-222, 206]].map(([a, l], k) => frond(a, l, k))}
        {/* its dates: two clusters under the crown */}
        <g opacity={fruit}>
          <circle cx={-26} cy={64} r={84} fill={`url(#${id}-glow)`} />
          <circle cx={44} cy={58} r={76} fill={`url(#${id}-glow)`} />
        </g>
        {[[-26, 64], [44, 58]].map(([cx, cy], k) => (
          <g key={k}>
            <path d={`M ${cx > 0 ? 8 : -6} 6 Q ${cx * 0.7} ${cy * 0.4} ${cx} ${cy - 22}`} fill="none" stroke={INK} strokeWidth={4} />
            {Array.from({ length: 11 }, (_, i) => (
              <ellipse key={i} cx={cx - 15 + (i % 4) * 10 + (Math.floor(i / 4) % 2) * 5} cy={cy - 16 + Math.floor(i / 4) * 14} rx={6} ry={8} fill={fruit > 0.5 ? "#ffcf6a" : "#0d0f1b"} opacity={fruit > 0.5 ? 0.55 + 0.45 * fruit : 1} />
            ))}
          </g>
        ))}
      </g>
    </g>
  );
};

/** A gate at the end of the road: a wall, an arched doorway. `open`: 0 dark, 1 its light pours down the road.
 * (x, y): the middle of its threshold. */
export const Gate: React.FC<{ id: string; x: number; y: number; scale: number; t: number; open: number; rim?: string }> = ({ id, x, y, scale, t, open, rim = "#9fb6e6" }) => {
  const breath = 0.9 + 0.1 * Math.sin(t * 1.3);
  const door = "M -62 4 L -62 -150 A 62 62 0 0 1 62 -150 L 62 4 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#fff3cf" stopOpacity=".9" />
          <stop offset=".35" stopColor={LIGHT} stopOpacity=".42" />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-pour`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LIGHT} stopOpacity=".5" />
          <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the light it pours on the road, towards whoever comes */}
      <path d="M -62 4 L -330 760 L 330 760 L 62 4 Z" fill={`url(#${id}-pour)`} opacity={open * breath * 0.75} />
      <circle cx={0} cy={-110} r={330} fill={`url(#${id}-glow)`} opacity={open * breath} />
      {/* the wall and its doorway */}
      <path d={`M -330 6 L -330 -214 L -286 -214 L -286 -240 L -242 -240 L -242 -214 L -150 -214 L -150 -262 L 150 -262 L 150 -214 L 242 -214 L 242 -240 L 286 -240 L 286 -214 L 330 -214 L 330 6 Z ${door}`} fill={INK} fillRule="evenodd" />
      <path d="M -330 -214 L -286 -214 L -286 -240 L -242 -240 L -242 -214 L -150 -214 L -150 -262 L 150 -262 L 150 -214 L 242 -214 L 242 -240 L 286 -240 L 286 -214 L 330 -214" fill="none" stroke={rim} strokeWidth={3} opacity={0.4} />
      {/* the doorway: closed and dark, or full of light */}
      <path d={door} fill="#0b0d18" opacity={1 - open} />
      <path d={door} fill="#ffe9c4" opacity={open * breath} />
      <path d={door} fill="none" stroke={open > 0.5 ? "#ffd9a0" : rim} strokeWidth={3} opacity={0.5} />
    </g>
  );
};

/** Rain: thin streaks falling a little aslant over the whole frame. */
export const Rain: React.FC<{ t: number; width?: number; height?: number }> = ({ t, width = 1080, height = 1920 }) => (
  <g>
    {Array.from({ length: 150 }, (_, k) => {
      const speed = 0.55 + 0.5 * chance(k, 1);
      const p = (t * speed + chance(k, 2)) % 1;
      const x = chance(k) * (width + 200) - 60 - 110 * p;
      const y = -80 + p * (height + 160);
      const length = 34 + 46 * chance(k, 3);
      return <path key={k} d={`M ${x} ${y} l ${-length * 0.12} ${length}`} stroke="#cfe0ff" strokeWidth={1.6 + 1.4 * chance(k, 4)} strokeLinecap="round" opacity={0.16 + 0.3 * chance(k, 5)} />;
    })}
  </g>
);
