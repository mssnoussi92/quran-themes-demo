// Backgrounds of the stories of Al-Kahf: Musa and al-Khidr (18:60-82, episode khidr) and Dhul-Qarnayn
// (18:83-98, episode qarnayn). Places and things only, never a person (a prophet, Dhul-Qarnayn and the
// peoples he met are never drawn; the boy is never shown). Same flat shapes and black
// line as the other backgrounds. Each SVG names its gradients after itself: two backgrounds are on
// screen together during a transition.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { INK } from "../characters/Character";
import type { BackgroundProps } from "./Backgrounds";

const LINE = 6;

const Svg: React.FC<{ w: number; h: number; children: React.ReactNode }> = ({ w, h, children }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

/** Seconds since the scene started (animations). */
const useSeconds = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const Sky: React.FC<{ id: string; w: number; to: number; top: string; bottom: string }> = ({ id, w, to, top, bottom }) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={top} />
        <stop offset="100%" stopColor={bottom} />
      </linearGradient>
    </defs>
    <rect width={w} height={to} fill={`url(#${id})`} />
  </>
);

/** A wave line from x0 to x1 around y, drifting with time. */
const wave = (x0: number, x1: number, y: number, amp: number, len: number, phase: number) => {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 12) pts.push(`${x.toFixed(1)},${(y + amp * Math.sin((x / len) * 2 * Math.PI + phase)).toFixed(1)}`);
  return `M ${pts.join(" L ")}`;
};

/** Rows of short white wave strokes over a sea, from `top` to `bottom`. */
const Waves: React.FC<{ x0: number; x1: number; top: number; bottom: number; t: number; color?: string }> = ({
  x0, x1, top, bottom, t, color = "#EAF6FB",
}) => {
  const rows = 6;
  return (
    <g fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.85}>
      {Array.from({ length: rows }, (_, i) => {
        const y = top + ((bottom - top) * (i + 0.5)) / rows;
        const len = 140 + 30 * i;
        const shift = ((t * (18 + 4 * i) + i * 97) % (len * 2)) - len;
        // Short dashes rather than one long line: lighter, like the flat style of the other drawings.
        return (
          <path key={i} d={wave(x0 + shift, x1 + len, y, 6 + i, len, t * 1.2 + i)} strokeDasharray={`${60 + 10 * i} ${120 + 20 * i}`} />
        );
      })}
    </g>
  );
};

/** Where the two seas meet (مجمع البحرين): two waters of two colours, a sandy shore, the rock where
 * they slept and the basket that held the fish (Bukhari 122). */
const Confluence: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const horizon = floorY - 0.45 * u;
  const shore = floorY - 0.04 * u;
  const seamTop = w * 0.56;
  const seamBottom = w * 0.38;
  const seam = (y: number) => seamTop + ((seamBottom - seamTop) * (y - horizon)) / (shore - horizon);
  const seamPath = Array.from({ length: 30 }, (_, i) => {
    const y = horizon + ((shore - horizon) * i) / 29;
    return `${(seam(y) + 10 * Math.sin(i * 0.9 + t * 1.5)).toFixed(1)},${y.toFixed(1)}`;
  });
  const rockX = w * 0.5 + 0.2 * u;
  return (
    <Svg w={w} h={h}>
      <Sky id="confluence-sky" w={w} to={horizon} top="#CFE6F1" bottom="#F7EEDA" />
      <polygon points={`0,${horizon} ${seamTop},${horizon} ${seamBottom},${shore} 0,${shore}`} fill="#7CC0DF" />
      <polygon points={`${seamTop},${horizon} ${w},${horizon} ${w},${shore} ${seamBottom},${shore}`} fill="#2F7E8E" />
      <Waves x0={0} x1={seamTop} top={horizon + 20} bottom={shore - 10} t={t} />
      <Waves x0={seamBottom} x1={w} top={horizon + 20} bottom={shore - 10} t={t + 3} color="#BFE3E6" />
      <polyline points={seamPath.join(" ")} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.9} />
      <line x1={0} y1={horizon} x2={w} y2={horizon} stroke={INK} strokeWidth={LINE} />
      {/* the shore */}
      <path d={`M 0 ${shore} Q ${w * 0.5} ${shore - 0.05 * u} ${w} ${shore} L ${w} ${h} L 0 ${h} Z`} fill="#E9D4A4" stroke={INK} strokeWidth={LINE} />
      {/* the rock */}
      <path
        d={`M ${rockX - 0.2 * u} ${floorY + 0.02 * u}
            C ${rockX - 0.22 * u} ${floorY - 0.14 * u}, ${rockX - 0.12 * u} ${floorY - 0.27 * u}, ${rockX + 0.02 * u} ${floorY - 0.26 * u}
            C ${rockX + 0.16 * u} ${floorY - 0.25 * u}, ${rockX + 0.22 * u} ${floorY - 0.12 * u}, ${rockX + 0.2 * u} ${floorY + 0.02 * u} Z`}
        fill="#A49482"
        stroke={INK}
        strokeWidth={LINE}
        strokeLinejoin="round"
      />
      <path d={`M ${rockX - 0.08 * u} ${floorY - 0.2 * u} Q ${rockX} ${floorY - 0.23 * u} ${rockX + 0.07 * u} ${floorY - 0.19 * u}`} fill="none" stroke="#C9BBA9" strokeWidth={8} strokeLinecap="round" />
      {/* the basket (مكتل), by the rock */}
      <g stroke={INK} strokeWidth={4} strokeLinejoin="round">
        <path d={`M ${rockX - 0.36 * u} ${floorY - 0.1 * u} L ${rockX - 0.24 * u} ${floorY - 0.1 * u} L ${rockX - 0.26 * u} ${floorY} L ${rockX - 0.34 * u} ${floorY} Z`} fill="#C99A5B" />
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={rockX - 0.36 * u + 0.12 * u * f} y1={floorY - 0.1 * u} x2={rockX - 0.34 * u + 0.08 * u * f} y2={floorY} />
        ))}
        <line x1={rockX - 0.355 * u} y1={floorY - 0.05 * u} x2={rockX - 0.245 * u} y2={floorY - 0.05 * u} />
      </g>
    </Svg>
  );
};

/** The hull and sail of the boat that carried them for nothing (Bukhari 122), bobbing. */
const Boat: React.FC<{ cx: number; water: number; u: number; t: number }> = ({ cx, water, u, t }) => {
  const bob = 6 * Math.sin(t * 1.6);
  const tilt = 1.5 * Math.sin(t * 1.1);
  const half = 0.32 * u;
  const deck = water - 0.09 * u;
  return (
    <g transform={`translate(0 ${bob}) rotate(${tilt} ${cx} ${water})`} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
      {/* mast and sail */}
      <line x1={cx} y1={deck} x2={cx} y2={deck - 0.44 * u} />
      <path d={`M ${cx + 6} ${deck - 0.42 * u} Q ${cx + 0.26 * u} ${deck - 0.24 * u} ${cx + 6} ${deck - 0.04 * u} Z`} fill="#F7F1E3" />
      <path d={`M ${cx} ${deck - 0.44 * u} L ${cx - 0.06 * u} ${deck - 0.41 * u} L ${cx} ${deck - 0.38 * u}`} fill="#D9644C" />
      {/* hull */}
      <path
        d={`M ${cx - half} ${deck} L ${cx + half} ${deck} Q ${cx + half * 0.9} ${water + 0.03 * u} ${cx + half * 0.55} ${water + 0.05 * u}
            L ${cx - half * 0.55} ${water + 0.05 * u} Q ${cx - half * 0.9} ${water + 0.03 * u} ${cx - half} ${deck} Z`}
        fill="#A8693B"
      />
      <line x1={cx - half * 0.95} y1={deck + 0.035 * u} x2={cx + half * 0.95} y2={deck + 0.035 * u} strokeWidth={4} />
      <line x1={cx - half * 0.8} y1={deck + 0.075 * u} x2={cx + half * 0.8} y2={deck + 0.075 * u} strokeWidth={4} />
    </g>
  );
};

/** The open sea and the boat (السفينة): the event and what it meant. */
const SeaBoat: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const horizon = floorY - 0.4 * u;
  const water = floorY - 0.06 * u;
  return (
    <Svg w={w} h={h}>
      <Sky id="sea-boat-sky" w={w} to={horizon} top="#BFE2F0" bottom="#FCF1DA" />
      <circle cx={w * 0.5 + 0.34 * u} cy={horizon - 0.3 * u} r={0.07 * u} fill="#FFD866" stroke={INK} strokeWidth={LINE} />
      <rect y={horizon} width={w} height={h - horizon} fill="#4F9DC8" />
      <line x1={0} y1={horizon} x2={w} y2={horizon} stroke={INK} strokeWidth={LINE} />
      <Waves x0={0} x1={w} top={horizon + 20} bottom={water - 0.02 * u} t={t} />
      <Boat cx={w / 2} water={water} u={u} t={t} />
      <rect y={water + 0.03 * u} width={w} height={h - water} fill="#3F86B0" />
      <Waves x0={0} x1={w} top={water + 0.05 * u} bottom={h} t={t + 5} />
    </Svg>
  );
};

/** Close on the edge of the boat: the sparrow that pecked the sea once or twice (Bukhari 122, 3401). */
const SeaBird: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const horizon = floorY - 0.55 * u;
  const water = floorY - 0.1 * u;
  const edge = water - 0.05 * u; // top of the gunwale, just above the water
  const end = w * 0.5 + 0.16 * u; // the boat's edge ends here, the sea beyond
  // One peck every 2.6 s: the bird leans down to the water and comes back up.
  const cycle = t % 2.6;
  const dip = cycle > 1.6 && cycle < 2.2 ? Math.sin(((cycle - 1.6) / 0.6) * Math.PI) : 0;
  const ripple = cycle > 1.9 ? (cycle - 1.9) / 0.7 : cycle < 0.6 ? (cycle + 0.7) / 0.7 : -1;
  const b = 1.9 * u; // the bird is drawn larger than life: it is what the scene is about
  const bx = end - 0.05 * b;
  const by = edge - 0.045 * b;
  const tip = { x: end + 0.05 * b, y: water + 0.005 * b };
  return (
    <Svg w={w} h={h}>
      <Sky id="sea-bird-sky" w={w} to={horizon} top="#BFE2F0" bottom="#FCF1DA" />
      <rect y={horizon} width={w} height={h - horizon} fill="#4F9DC8" />
      <line x1={0} y1={horizon} x2={w} y2={horizon} stroke={INK} strokeWidth={LINE} />
      <Waves x0={0} x1={w} top={horizon + 20} bottom={h} t={t} />
      {ripple >= 0 && ripple <= 1 ? (
        <ellipse cx={tip.x} cy={tip.y} rx={0.02 * u + 0.09 * u * ripple} ry={0.006 * u + 0.025 * u * ripple} fill="none" stroke="#EAF6FB" strokeWidth={5} opacity={1 - ripple} />
      ) : null}
      {/* the boat's side and its gunwale, seen from close */}
      <path d={`M 0 ${edge} L ${end} ${edge} Q ${end + 0.02 * u} ${water + 0.12 * u} ${end - 0.1 * u} ${h} L 0 ${h} Z`} fill="#A8693B" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <rect x={-LINE} y={edge - 0.025 * u} width={end + LINE + 0.01 * u} height={0.035 * u} rx={8} fill="#8A5530" stroke={INK} strokeWidth={LINE} />
      {[0.06, 0.13].map((f) => (
        <line key={f} x1={0} y1={edge + f * u} x2={end - 0.01 * u * f * 10} y2={edge + f * u} stroke={INK} strokeWidth={4} />
      ))}
      {/* the sparrow */}
      <g transform={`rotate(${50 * dip} ${bx} ${by + 0.03 * b})`} stroke={INK} strokeWidth={4} strokeLinejoin="round">
        <path d={`M ${bx - 0.07 * b} ${by - 0.005 * b} L ${bx - 0.115 * b} ${by - 0.03 * b} L ${bx - 0.105 * b} ${by + 0.005 * b} Z`} fill="#7A5236" />
        <ellipse cx={bx - 0.02 * b} cy={by} rx={0.055 * b} ry={0.035 * b} fill="#9A6B45" />
        <path d={`M ${bx - 0.06 * b} ${by + 0.01 * b} Q ${bx - 0.02 * b} ${by + 0.04 * b} ${bx + 0.025 * b} ${by + 0.012 * b}`} fill="#E8D2AA" />
        <path d={`M ${bx - 0.045 * b} ${by - 0.012 * b} Q ${bx - 0.02 * b} ${by - 0.03 * b} ${bx + 0.005 * b} ${by - 0.01 * b}`} fill="none" stroke={INK} strokeWidth={3} />
        <circle cx={bx + 0.03 * b} cy={by - 0.03 * b} r={0.026 * b} fill="#9A6B45" />
        <circle cx={bx + 0.04 * b} cy={by - 0.035 * b} r={0.005 * b} fill={INK} stroke="none" />
        <path d={`M ${bx + 0.053 * b} ${by - 0.032 * b} L ${bx + 0.075 * b} ${by - 0.024 * b} L ${bx + 0.052 * b} ${by - 0.019 * b} Z`} fill="#E9B44C" />
        <line x1={bx - 0.02 * b} y1={by + 0.034 * b} x2={bx - 0.025 * b} y2={edge - 0.025 * u} />
        <line x1={bx} y1={by + 0.033 * b} x2={bx + 0.002 * b} y2={edge - 0.025 * u} />
      </g>
    </Svg>
  );
};

/** The road they walked on (فانطلقا): hills, an empty path, nobody on it. */
const Road: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const u = Math.min(w, h);
  const horizon = floorY - 0.38 * u;
  const cx = w / 2;
  return (
    <Svg w={w} h={h}>
      <Sky id="road-sky" w={w} to={horizon} top="#F6D7B3" bottom="#FBEFD9" />
      <circle cx={cx - 0.3 * u} cy={horizon - 0.12 * u} r={0.08 * u} fill="#F7B267" stroke={INK} strokeWidth={LINE} />
      <path d={`M 0 ${horizon} Q ${w * 0.25} ${horizon - 0.2 * u} ${w * 0.55} ${horizon} Z`} fill="#C7B086" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <path d={`M ${w * 0.4} ${horizon} Q ${w * 0.75} ${horizon - 0.26 * u} ${w} ${horizon - 0.06 * u} L ${w} ${horizon} Z`} fill="#B49B6E" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <rect y={horizon} width={w} height={h - horizon} fill="#E0C998" />
      <line x1={0} y1={horizon} x2={w} y2={horizon} stroke={INK} strokeWidth={LINE} />
      <path d={`M ${cx - 0.03 * u} ${horizon} L ${cx + 0.03 * u} ${horizon} L ${cx + 0.36 * u} ${h} L ${cx - 0.36 * u} ${h} Z`} fill="#F0DFB8" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      {[
        { x: cx - 0.42 * u, y: floorY - 0.12 * u, r: 0.06 * u },
        { x: cx + 0.4 * u, y: floorY - 0.2 * u, r: 0.045 * u },
      ].map((b, i) => (
        <g key={i} stroke={INK} strokeWidth={LINE}>
          <ellipse cx={b.x} cy={b.y} rx={b.r * 1.3} ry={b.r} fill="#8FAE6B" />
          <ellipse cx={b.x - b.r * 0.4} cy={b.y - b.r * 0.4} rx={b.r * 0.8} ry={b.r * 0.6} fill="#A3C27D" />
        </g>
      ))}
      <ellipse cx={cx + 0.3 * u} cy={floorY + 0.01 * u} rx={0.06 * u} ry={0.03 * u} fill="#A49482" stroke={INK} strokeWidth={LINE} />
    </Svg>
  );
};

/** Flat-roofed houses of the village, behind the wall. */
const Houses: React.FC<{ w: number; base: number; u: number; scale?: number }> = ({ w, base, u, scale = 1 }) => {
  const houses = [
    { x: -0.05, hw: 0.3, top: 0.5, fill: "#DDBE91" },
    { x: 0.22, hw: 0.24, top: 0.62, fill: "#CFA978" },
    { x: 0.43, hw: 0.3, top: 0.46, fill: "#E5CA9F" },
    { x: 0.7, hw: 0.36, top: 0.56, fill: "#D4B183" },
  ];
  return (
    <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
      {houses.map((b, i) => {
        const x = b.x * w;
        const bw = b.hw * w;
        const top = base - b.top * u * scale;
        return (
          <g key={i}>
            <rect x={x} y={top} width={bw} height={base - top} fill={b.fill} />
            <rect x={x + bw * 0.3} y={top + 0.08 * u} width={0.05 * u} height={0.07 * u} fill="#5B4636" strokeWidth={4} />
            <rect x={x + bw * 0.6} y={top + 0.08 * u} width={0.05 * u} height={0.07 * u} fill="#5B4636" strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
};

/** A brick wall from x1 to x2 standing at `base`, `tall` high. */
const BrickWall: React.FC<{ x1: number; x2: number; base: number; tall: number; u: number; fill: string; cracked: boolean }> = ({
  x1, x2, base, tall, u, fill, cracked,
}) => {
  const rows = 6;
  const rh = tall / rows;
  const bw = 0.12 * u;
  return (
    <g stroke={INK} strokeLinejoin="round">
      <rect x={x1} y={base - tall} width={x2 - x1} height={tall} fill={fill} strokeWidth={LINE} />
      {Array.from({ length: rows - 1 }, (_, r) => (
        <line key={`r${r}`} x1={x1} y1={base - rh * (r + 1)} x2={x2} y2={base - rh * (r + 1)} strokeWidth={3} />
      ))}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: Math.ceil((x2 - x1) / bw) }, (_, k) => {
          const x = x1 + k * bw + (r % 2 ? bw / 2 : 0);
          return x > x1 && x < x2 ? <line key={`b${r}-${k}`} x1={x} y1={base - rh * r} x2={x} y2={base - rh * (r + 1)} strokeWidth={3} /> : null;
        }),
      )}
      {cracked ? (
        <path
          d={`M ${x1 + (x2 - x1) * 0.62} ${base - tall} L ${x1 + (x2 - x1) * 0.58} ${base - tall * 0.7} L ${x1 + (x2 - x1) * 0.65} ${base - tall * 0.5}
              L ${x1 + (x2 - x1) * 0.6} ${base - tall * 0.2}`}
          fill="none"
          strokeWidth={7}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
};

/** The village that refused them food, and the wall about to fall down (يريد أن ينقض). */
const VillageWall: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const u = Math.min(w, h);
  const x1 = w * 0.5 - 0.44 * u;
  const x2 = w * 0.5 + 0.44 * u;
  const tall = 0.3 * u;
  return (
    <Svg w={w} h={h}>
      <Sky id="village-wall-sky" w={w} to={floorY} top="#CFE6F1" bottom="#F6EEDC" />
      <Houses w={w} base={floorY - 0.1 * u} u={u} />
      <rect y={floorY - 0.1 * u} width={w} height={h - floorY + 0.1 * u} fill="#DCC59A" />
      <line x1={0} y1={floorY - 0.1 * u} x2={w} y2={floorY - 0.1 * u} stroke={INK} strokeWidth={LINE} />
      <g transform={`rotate(5 ${x1} ${floorY})`}>
        <BrickWall x1={x1} x2={x2} base={floorY} tall={tall} u={u} fill="#C98F5E" cracked />
      </g>
      {/* fallen bricks */}
      {[0.1, 0.22, 0.7].map((f, i) => (
        <rect key={i} x={x1 + (x2 - x1) * f} y={floorY + 0.01 * u + i * 6} width={0.09 * u} height={0.04 * u} rx={4} fill="#C98F5E" stroke={INK} strokeWidth={4} transform={`rotate(${i * 9 - 6} ${x1 + (x2 - x1) * f} ${floorY})`} />
      ))}
    </Svg>
  );
};

/** The wall set straight, and what it kept: the orphans' treasure in the ground beneath (18:82). */
const WallTreasure: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const ground = floorY - 0.3 * u;
  const x1 = w * 0.5 - 0.44 * u;
  const x2 = w * 0.5 + 0.44 * u;
  const cx = w / 2;
  const c = 1.5 * u; // the chest, drawn large
  const chestTop = ground + 0.07 * u;
  const glow = 0.6 + 0.4 * Math.sin(t * 2.4);
  return (
    <Svg w={w} h={h}>
      <Sky id="wall-treasure-sky" w={w} to={ground} top="#CFE6F1" bottom="#F6EEDC" />
      <Houses w={w} base={ground - 0.08 * u} u={u} scale={0.62} />
      <rect y={ground - 0.08 * u} width={w} height={0.08 * u} fill="#DCC59A" />
      <line x1={0} y1={ground - 0.08 * u} x2={w} y2={ground - 0.08 * u} stroke={INK} strokeWidth={LINE} />
      <BrickWall x1={x1} x2={x2} base={ground} tall={0.3 * u} u={u} fill="#D39A68" cracked={false} />
      {/* the ground cut open: earth, and the treasure under the wall */}
      <rect y={ground} width={w} height={h - ground} fill="#B98A5A" />
      <line x1={0} y1={ground} x2={w} y2={ground} stroke={INK} strokeWidth={LINE} />
      {[0.06, 0.24].map((f) => (
        <path key={f} d={wave(0, w, ground + (f + 0.3) * u, 8, 260, f * 9)} fill="none" stroke="#A47549" strokeWidth={10} />
      ))}
      <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
        <ellipse cx={cx} cy={chestTop + 0.07 * c} rx={0.2 * c} ry={0.1 * c} fill="#FFE08A" opacity={0.35 * glow} stroke="none" />
        <rect x={cx - 0.12 * c} y={chestTop + 0.04 * c} width={0.24 * c} height={0.1 * c} rx={6} fill="#8A5530" />
        <path d={`M ${cx - 0.12 * c} ${chestTop + 0.04 * c} Q ${cx} ${chestTop - 0.04 * c} ${cx + 0.12 * c} ${chestTop + 0.04 * c} Z`} fill="#A8693B" />
        <rect x={cx - 0.02 * c} y={chestTop + 0.03 * c} width={0.04 * c} height={0.045 * c} fill="#E9B44C" strokeWidth={4} />
        {[-0.08, 0.08].map((f) => (
          <line key={f} x1={cx + f * c} y1={chestTop + 0.005 * c} x2={cx + f * c} y2={chestTop + 0.14 * c} strokeWidth={4} />
        ))}
      </g>
      {[-0.17, 0.15, 0.19].map((f, i) => (
        <circle key={i} cx={cx + f * c} cy={chestTop + (0.02 + 0.03 * i) * c} r={6 + 3 * glow} fill="#FFF3C8" opacity={glow} />
      ))}
    </Svg>
  );
};

// ---- Dhul-Qarnayn (18:83-98) --------------------------------------------------------------------

/** Where the sun sets (مغرب الشمس): he found it setting, as it seemed to him, in a spring of dark mud
 * (عين حمئة), and a people near it: their tents only, nobody drawn. The sun sinks slowly. */
const SunsetSpring: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const horizon = floorY - 0.34 * u;
  const cx = w / 2;
  const sink = Math.min(t, 8) * 0.004 * u;
  const pool = { cx, cy: horizon + 0.05 * u, rx: 0.5 * u, ry: 0.07 * u };
  return (
    <Svg w={w} h={h}>
      <Sky id="sunset-spring-sky" w={w} to={horizon} top="#F2A65A" bottom="#FBD7A1" />
      <defs>
        <clipPath id={`sunset-spring-above-${w}x${h}`}>
          <rect width={w} height={pool.cy - 2} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={horizon - 0.02 * u + sink} r={0.12 * u} fill="#F26B3A" stroke={INK} strokeWidth={LINE} clipPath={`url(#sunset-spring-above-${w}x${h})`} />
      <rect y={horizon} width={w} height={h - horizon} fill="#C9A26E" />
      <line x1={0} y1={horizon} x2={w} y2={horizon} stroke={INK} strokeWidth={LINE} />
      {/* the dark spring, the sun's glow on it */}
      <ellipse cx={pool.cx} cy={pool.cy} rx={pool.rx + 0.03 * u} ry={pool.ry + 0.02 * u} fill="#8C6A45" stroke={INK} strokeWidth={LINE} />
      <ellipse cx={pool.cx} cy={pool.cy} rx={pool.rx} ry={pool.ry} fill="#3E3A2C" stroke={INK} strokeWidth={4} />
      <ellipse cx={pool.cx} cy={pool.cy - 0.01 * u} rx={0.16 * u} ry={0.018 * u} fill="#F26B3A" opacity={0.55 + 0.15 * Math.sin(t * 1.3)} />
      {[0.25, 0.7].map((f, i) => (
        <path key={i} d={wave(pool.cx - pool.rx * 0.7, pool.cx + pool.rx * 0.7, pool.cy + (0.02 + 0.025 * i) * u, 3, 120, t * 0.8 + f * 5)} fill="none" stroke="#6B5E44" strokeWidth={4} strokeDasharray="50 90" />
      ))}
      {/* the people's tents, on the near shore */}
      {[
        { x: cx - 0.42 * u, s: 1 },
        { x: cx - 0.3 * u, s: 0.75 },
        { x: cx + 0.36 * u, s: 0.9 },
      ].map((tent, i) => {
        const base = floorY - 0.02 * u;
        const tw = 0.12 * u * tent.s;
        const th = 0.1 * u * tent.s;
        return (
          <g key={i} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
            <path d={`M ${tent.x - tw} ${base} L ${tent.x} ${base - th} L ${tent.x + tw} ${base} Z`} fill={i % 2 ? "#B5835A" : "#9E6F4A"} />
            <path d={`M ${tent.x} ${base - th} L ${tent.x - tw * 0.25} ${base} L ${tent.x + tw * 0.25} ${base} Z`} fill="#4A3526" />
          </g>
        );
      })}
    </Svg>
  );
};

/** Where the sun rises (مطلع الشمس): a bare plain, nothing to shelter from it (لم نجعل لهم من دونها
 * سترا). The sun climbs, heat lines shimmer above the ground. */
const SunrisePlain: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const horizon = floorY - 0.3 * u;
  const cx = w / 2 + 0.22 * u;
  const rise = Math.min(t, 8) * 0.005 * u;
  return (
    <Svg w={w} h={h}>
      <Sky id="sunrise-plain-sky" w={w} to={horizon} top="#BFDDEB" bottom="#FFE3B0" />
      <defs>
        <clipPath id={`sunrise-plain-above-${w}x${h}`}>
          <rect width={w} height={horizon} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={horizon + 0.03 * u - rise} r={0.11 * u} fill="#FFC94D" stroke={INK} strokeWidth={LINE} clipPath={`url(#sunrise-plain-above-${w}x${h})`} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = Math.PI + (i / 7) * Math.PI;
        const r0 = 0.15 * u;
        const r1 = 0.2 * u;
        const cy = horizon + 0.03 * u - rise;
        return <line key={i} x1={cx + r0 * Math.cos(a)} y1={cy + r0 * Math.sin(a)} x2={cx + r1 * Math.cos(a)} y2={cy + r1 * Math.sin(a)} stroke="#F2A93B" strokeWidth={7} strokeLinecap="round" clipPath={`url(#sunrise-plain-above-${w}x${h})`} />;
      })}
      <rect y={horizon} width={w} height={h - horizon} fill="#E7C98F" />
      <line x1={0} y1={horizon} x2={w} y2={horizon} stroke={INK} strokeWidth={LINE} />
      {[0.08, 0.16, 0.24].map((f, i) => (
        <path key={i} d={wave(0, w, horizon + f * u, 4, 180, t * 2 + i)} fill="none" stroke="#F5DDAE" strokeWidth={5} strokeDasharray="70 140" opacity={0.8} />
      ))}
      {[
        { x: w / 2 - 0.36 * u, y: floorY + 0.01 * u, r: 0.035 * u },
        { x: w / 2 + 0.08 * u, y: floorY + 0.05 * u, r: 0.025 * u },
      ].map((st, i) => (
        <ellipse key={i} cx={st.x} cy={st.y} rx={st.r * 1.5} ry={st.r} fill="#B9A585" stroke={INK} strokeWidth={4} />
      ))}
    </Svg>
  );
};

/** Two steep mountains (السدّين) and the pass between them. */
const Mountains: React.FC<{ w: number; base: number; u: number; gap: number }> = ({ w, base, u, gap }) => {
  const cx = w / 2;
  const peak = base - 0.62 * u;
  return (
    <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
      <path d={`M ${-0.1 * u} ${base} L ${cx - 0.55 * u} ${peak + 0.05 * u} L ${cx - 0.36 * u} ${peak} L ${cx - gap} ${base - 0.1 * u} L ${cx - gap} ${base} Z`} fill="#8E8174" />
      <path d={`M ${cx - 0.55 * u} ${peak + 0.05 * u} L ${cx - 0.46 * u} ${peak + 0.12 * u} L ${cx - 0.36 * u} ${peak} Z`} fill="#F4F1EA" strokeWidth={4} />
      <path d={`M ${w + 0.1 * u} ${base} L ${cx + 0.58 * u} ${peak + 0.02 * u} L ${cx + 0.4 * u} ${peak + 0.06 * u} L ${cx + gap} ${base - 0.1 * u} L ${cx + gap} ${base} Z`} fill="#7D7166" />
      <path d={`M ${cx + 0.58 * u} ${peak + 0.02 * u} L ${cx + 0.49 * u} ${peak + 0.1 * u} L ${cx + 0.4 * u} ${peak + 0.06 * u} Z`} fill="#F4F1EA" strokeWidth={4} />
      {[0.3, 0.45].map((f) => (
        <g key={f}>
          <line x1={cx - 0.5 * u * f - gap} y1={base - 0.3 * u * f} x2={cx - 0.4 * u * f - gap} y2={base - 0.15 * u * f} strokeWidth={4} />
          <line x1={cx + 0.5 * u * f + gap} y1={base - 0.32 * u * f} x2={cx + 0.42 * u * f + gap} y2={base - 0.16 * u * f} strokeWidth={4} />
        </g>
      ))}
    </g>
  );
};

/** The pass between the two mountains (بين السدّين), open: the way the people feared. */
const MountainPass: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const base = floorY - 0.06 * u;
  const cx = w / 2;
  const gap = 0.12 * u;
  return (
    <Svg w={w} h={h}>
      <Sky id="mountain-pass-sky" w={w} to={base} top="#B9D3E3" bottom="#EFE6D2" />
      {/* dust blowing through the pass */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={wave(cx - gap, cx + gap, base - (0.06 + 0.07 * i) * u, 6, 60, t * 3 + i * 2)} fill="none" stroke="#D8C7A8" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      ))}
      <Mountains w={w} base={base} u={u} gap={gap} />
      <rect y={base} width={w} height={h - base} fill="#CDB68E" />
      <line x1={0} y1={base} x2={w} y2={base} stroke={INK} strokeWidth={LINE} />
      <path d={`M ${cx - 0.6 * gap} ${base} L ${cx + 0.6 * gap} ${base} L ${cx + 0.3 * u} ${h} L ${cx - 0.3 * u} ${h} Z`} fill="#DECAA2" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
    </Svg>
  );
};

/** The barrier (الردم): bars of iron filling the pass from one mountain to the other, molten copper
 * poured over them, glowing (آتوني زبر الحديد… أفرغ عليه قطرا). */
const IronDam: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const base = floorY - 0.06 * u;
  const cx = w / 2;
  const gap = 0.12 * u;
  const top = base - 0.5 * u;
  const glow = 0.55 + 0.45 * Math.sin(t * 2.2);
  const rows = 7;
  const rh = (base - top) / rows;
  const half = gap + 0.32 * u;
  return (
    <Svg w={w} h={h}>
      <Sky id="iron-dam-sky" w={w} to={base} top="#B9D3E3" bottom="#EFE6D2" />
      {/* the dam, between the mountains */}
      <g stroke={INK} strokeLinejoin="round">
        <rect x={cx - half} y={top} width={2 * half} height={base - top} fill="#6E737A" strokeWidth={LINE} />
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: 6 }, (_, k) => {
            const bw = (2 * half) / 5;
            const x = cx - half + k * bw - (r % 2 ? bw / 2 : 0);
            return <rect key={`${r}-${k}`} x={Math.max(x, cx - half)} y={top + r * rh} width={Math.min(bw, cx + half - Math.max(x, cx - half))} height={rh} fill={(r + k) % 2 ? "#7B8189" : "#666B72"} strokeWidth={3} />;
          }),
        )}
        {/* molten copper running down */}
        <path d={`M ${cx - half} ${top} L ${cx + half} ${top} L ${cx + half} ${top + 0.035 * u} Q ${cx} ${top + 0.06 * u} ${cx - half} ${top + 0.035 * u} Z`} fill="#E07B39" strokeWidth={LINE} />
        {[-0.22, -0.05, 0.12, 0.27].map((f, i) => {
          const len = (0.1 + 0.05 * i) * u * (0.8 + 0.2 * Math.sin(t * 1.5 + i));
          const x = cx + f * u;
          return <path key={i} d={`M ${x - 10} ${top + 0.03 * u} L ${x + 10} ${top + 0.03 * u} L ${x + 4} ${top + 0.03 * u + len} Q ${x} ${top + 0.04 * u + len} ${x - 4} ${top + 0.03 * u + len} Z`} fill="#E8893F" strokeWidth={3} />;
        })}
      </g>
      <rect x={cx - half} y={top} width={2 * half} height={base - top} fill="#FF9A3C" opacity={0.18 * glow} />
      <Mountains w={w} base={base} u={u} gap={half - 0.02 * u} />
      <rect y={base} width={w} height={h - base} fill="#CDB68E" />
      <line x1={0} y1={base} x2={w} y2={base} stroke={INK} strokeWidth={LINE} />
    </Svg>
  );
};

// ---- The people of the cave (episode kahf, 18:9-26): the places only, never the youths. -------------

/** Inside the cave, looking at its mouth: the sun's light falls on the right side, then on the left,
 * and never on the open space in the middle where they lie (18:17, « تزاور عن كهفهم ذات اليمين… تقرضهم
 * ذات الشمال وهم في فجوة منه »). The open space stays empty: the youths are never drawn. */
const CaveInside: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const cx = w / 2;
  const mouthY = floorY - 0.6 * u;
  const rx = 0.17 * u;
  const ry = 0.13 * u;
  // One side, then the other: the light swings slowly and turns away before the middle.
  const swing = Math.sin(t * 0.32);
  const side = swing >= 0 ? 1 : -1;
  const far = Math.abs(swing);
  const footX = cx + side * (0.3 * u + 0.12 * u * far);
  const footW = 0.12 * u;
  const glow = 0.25 + 0.2 * far;
  const top = floorY - 0.92 * u;
  const cavity = `M ${cx - 0.75 * u} ${h} L ${cx - 0.62 * u} ${floorY - 0.35 * u} Q ${cx - 0.55 * u} ${top} ${cx} ${top}`
    + ` Q ${cx + 0.55 * u} ${top} ${cx + 0.62 * u} ${floorY - 0.35 * u} L ${cx + 0.75 * u} ${h} Z`;
  return (
    <Svg w={w} h={h}>
      <defs>
        <linearGradient id="cave-inside-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BFE0F0" />
          <stop offset="100%" stopColor="#FFF1CF" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill="#2B211C" />
      <path d={cavity} fill="#4A3B31" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      {/* rock seams */}
      {[[-0.48, 0.2, -0.36, 0.05], [0.44, 0.3, 0.33, 0.12], [-0.3, -0.2, -0.18, -0.32], [0.28, -0.25, 0.18, -0.36]].map(([a, b, c, d], i) => (
        <path key={i} d={`M ${cx + a * u} ${floorY - 0.45 * u + b * u} Q ${cx + ((a + c) / 2) * u} ${floorY - 0.5 * u + ((b + d) / 2) * u} ${cx + c * u} ${floorY - 0.45 * u + d * u}`} fill="none" stroke="#2B211C" strokeWidth={5} strokeLinecap="round" />
      ))}
      <ellipse cx={cx} cy={mouthY} rx={rx} ry={ry} fill="url(#cave-inside-sky)" stroke={INK} strokeWidth={LINE} />
      {/* the floor, and the open space in the middle, in the shade */}
      <path d={`M ${cx - 0.75 * u} ${h} L ${cx - 0.66 * u} ${floorY} L ${cx + 0.66 * u} ${floorY} L ${cx + 0.75 * u} ${h} Z`} fill="#5B4A3D" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <ellipse cx={cx} cy={floorY + 0.08 * u} rx={0.22 * u} ry={0.05 * u} fill="#4D3E33" />
      {/* the sun's light, from the mouth to one side of the floor */}
      <polygon
        points={`${cx - rx * 0.55},${mouthY + ry * 0.4} ${cx + rx * 0.55},${mouthY + ry * 0.4} ${footX + footW},${floorY + 0.06 * u} ${footX - footW},${floorY + 0.06 * u}`}
        fill="#FFE39A"
        fillOpacity={glow}
      />
      <ellipse cx={footX} cy={floorY + 0.06 * u} rx={footW * 1.1} ry={0.035 * u} fill="#F3C96E" fillOpacity={glow + 0.15} />
    </Svg>
  );
};

/** The cave's mouth in the rocky hill, and their dog at the threshold, forelegs stretched out
 * (18:18, « وكلبهم باسط ذراعيه بالوصيد »), breathing slowly. No one else. */
const CaveEntrance: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const cx = w / 2;
  const breath = 1 + 0.035 * Math.sin(t * 1.6);
  const hill = `M ${-0.1 * u} ${floorY} Q ${cx - 0.55 * u} ${floorY - 0.55 * u} ${cx - 0.1 * u} ${floorY - 0.62 * u}`
    + ` Q ${cx + 0.45 * u} ${floorY - 0.7 * u} ${w + 0.1 * u} ${floorY - 0.2 * u} L ${w + 0.1 * u} ${floorY} Z`;
  const mouth = `M ${cx - 0.26 * u} ${floorY} Q ${cx - 0.28 * u} ${floorY - 0.42 * u} ${cx} ${floorY - 0.44 * u}`
    + ` Q ${cx + 0.28 * u} ${floorY - 0.42 * u} ${cx + 0.26 * u} ${floorY} Z`;
  // The dog, lying at the threshold, head to the left, forelegs out in front.
  const dx = cx + 0.03 * u;
  const dy = floorY - 0.035 * u;
  return (
    <Svg w={w} h={h}>
      <Sky id="cave-entrance-sky" w={w} to={floorY} top="#9FC6DA" bottom="#F5E3C3" />
      <path d={hill} fill="#A08463" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <path d={`M ${cx - 0.42 * u} ${floorY - 0.3 * u} q ${0.08 * u} ${-0.05 * u} ${0.16 * u} 0 M ${cx + 0.3 * u} ${floorY - 0.42 * u} q ${0.06 * u} ${-0.04 * u} ${0.13 * u} 0`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d={mouth} fill="#241B16" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <rect y={floorY} width={w} height={h - floorY} fill="#CDB78F" />
      <line x1={0} y1={floorY} x2={w} y2={floorY} stroke={INK} strokeWidth={LINE} />
      <g stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" transform={`translate(${dx} ${floorY}) scale(1.75) translate(${-dx} ${-floorY})`}>
        {/* tail, hind leg, body */}
        <path d={`M ${dx + 0.13 * u} ${dy} q ${0.07 * u} ${-0.01 * u} ${0.08 * u} ${-0.06 * u}`} fill="none" strokeWidth={9} />
        <ellipse cx={dx + 0.08 * u} cy={dy + 0.012 * u} rx={0.05 * u} ry={0.03 * u} fill="#B88A55" />
        <ellipse cx={dx + 0.03 * u} cy={dy - 0.005 * u} rx={0.12 * u} ry={0.042 * u * breath} fill="#C99B63" />
        {/* forelegs stretched forward on the ground */}
        <rect x={dx - 0.21 * u} y={dy + 0.012 * u} width={0.16 * u} height={0.022 * u} rx={0.011 * u} fill="#C99B63" />
        <rect x={dx - 0.19 * u} y={dy + 0.026 * u} width={0.14 * u} height={0.02 * u} rx={0.01 * u} fill="#B88A55" />
        {/* head, resting, with its drooping ear and snout */}
        <ellipse cx={dx - 0.1 * u} cy={dy - 0.03 * u} rx={0.05 * u} ry={0.04 * u} fill="#C99B63" />
        <ellipse cx={dx - 0.15 * u} cy={dy - 0.015 * u} rx={0.03 * u} ry={0.02 * u} fill="#D8AE78" />
        <circle cx={dx - 0.178 * u} cy={dy - 0.02 * u} r={0.008 * u} fill={INK} />
        <path d={`M ${dx - 0.09 * u} ${dy - 0.065 * u} q ${0.04 * u} ${0.0 * u} ${0.035 * u} ${0.05 * u} q ${-0.02 * u} ${0.01 * u} ${-0.035 * u} ${-0.01 * u} Z`} fill="#8E6A42" />
        <path d={`M ${dx - 0.125 * u} ${dy - 0.04 * u} q ${0.01 * u} ${0.006 * u} ${0.02 * u} 0`} fill="none" strokeWidth={4} />
      </g>
    </Svg>
  );
};

/** The city they sent one of them to with their silver coin, to buy the purest food (18:19): houses,
 * a market stall with bread, and the coin on its counter, glinting. No one in the street. */
const OldCity: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const t = useSeconds();
  const u = Math.min(w, h);
  const cx = w / 2;
  const base = floorY - 0.05 * u;
  const counter = floorY - 0.16 * u;
  const coinX = cx + 0.16 * u;
  const coinY = counter - 0.07 * u;
  const coinR = 0.065 * u;
  const glint = (t * 0.45) % 1.6;
  return (
    <Svg w={w} h={h}>
      <Sky id="old-city-sky" w={w} to={floorY} top="#C8E2EE" bottom="#F8EBD3" />
      <Houses w={w} base={base} u={u} scale={1.1} />
      <rect y={base} width={w} height={h - base} fill="#DCC59A" />
      <line x1={0} y1={base} x2={w} y2={base} stroke={INK} strokeWidth={LINE} />
      <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
        {/* the stall: two posts, a striped awning, a counter with round loaves */}
        <rect x={cx - 0.36 * u} y={counter - 0.3 * u} width={0.03 * u} height={0.3 * u + (floorY - counter)} fill="#8C6A48" />
        <rect x={cx + 0.33 * u} y={counter - 0.3 * u} width={0.03 * u} height={0.3 * u + (floorY - counter)} fill="#8C6A48" />
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d={`M ${cx - 0.4 * u + i * 0.133 * u} ${counter - 0.34 * u} l ${0.133 * u} 0 l 0 ${0.08 * u} q ${-0.066 * u} ${0.04 * u} ${-0.133 * u} 0 Z`} fill={i % 2 ? "#F4EBD8" : "#C8553D"} />
        ))}
        <rect x={cx - 0.4 * u} y={counter} width={0.8 * u} height={0.07 * u} fill="#A47B52" />
        {[-0.3, -0.18, -0.06].map((f, i) => (
          <ellipse key={i} cx={cx + f * u} cy={counter - 0.025 * u} rx={0.05 * u} ry={0.025 * u} fill="#E3B26A" />
        ))}
        {/* the silver coin (ورقكم هذه) */}
        <circle cx={coinX} cy={coinY} r={coinR} fill="#D9DEE3" />
        <circle cx={coinX} cy={coinY} r={coinR * 0.72} fill="#C3C9CF" strokeWidth={4} />
        <path d={`M ${coinX} ${coinY - coinR * 0.4} L ${coinX + coinR * 0.12} ${coinY - coinR * 0.12} L ${coinX + coinR * 0.4} ${coinY} L ${coinX + coinR * 0.12} ${coinY + coinR * 0.12} L ${coinX} ${coinY + coinR * 0.4} L ${coinX - coinR * 0.12} ${coinY + coinR * 0.12} L ${coinX - coinR * 0.4} ${coinY} L ${coinX - coinR * 0.12} ${coinY - coinR * 0.12} Z`} fill="#AEB5BC" strokeWidth={3} />
      </g>
      {glint < 1 ? (
        <path d={`M ${coinX + coinR * 0.5} ${coinY - coinR * 0.95} l ${0.01 * u} ${0.022 * u} l ${0.022 * u} ${0.01 * u} l ${-0.022 * u} ${0.01 * u} l ${-0.01 * u} ${0.022 * u} l ${-0.01 * u} ${-0.022 * u} l ${-0.022 * u} ${-0.01 * u} l ${0.022 * u} ${-0.01 * u} Z`} fill="#FFFFFF" opacity={Math.sin(glint * Math.PI)} />
      ) : null}
    </Svg>
  );
};

export const STORY_BACKGROUNDS: Record<string, React.FC<BackgroundProps>> = {
  "cave-inside": CaveInside,
  "cave-entrance": CaveEntrance,
  "old-city": OldCity,
  confluence: Confluence,
  "sea-boat": SeaBoat,
  "sea-bird": SeaBird,
  road: Road,
  "village-wall": VillageWall,
  "wall-treasure": WallTreasure,
  "sunset-spring": SunsetSpring,
  "sunrise-plain": SunrisePlain,
  "mountain-pass": MountainPass,
  "iron-dam": IronDam,
};
