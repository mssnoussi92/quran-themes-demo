// Backgrounds of the "scene" template: the closed catalog of content/backgrounds.yaml, drawn as flat
// shapes with the same black line as Open Peeps. No text, no people.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { INK } from "../characters/Character";

export type BackgroundProps = {
  width: number;
  height: number;
  floorY: number;
  /** Top of the seats, when someone sits (waiting room). */
  seatTop: number | null;
};

const LINE = 6;

/** A row of joined seats from x1 to x2, seat top at `top`, standing on the floor. */
const Bench: React.FC<{ x1: number; x2: number; top: number; floorY: number }> = ({ x1, x2, top, floorY }) => {
  const seat = 28;
  const back = 150;
  const legs = [x1 + 40, (x1 + x2) / 2, x2 - 40];
  return (
    <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
      <rect x={x1 + 20} y={top - back} width={x2 - x1 - 40} height={back - 18} rx={18} fill="#8FB3C4" />
      {legs.map((x) => (
        <line key={x} x1={x} y1={top + seat} x2={x} y2={floorY} />
      ))}
      <rect x={x1} y={top} width={x2 - x1} height={seat} rx={10} fill="#7FA3B6" />
    </g>
  );
};

const WaitingRoom: React.FC<BackgroundProps> = ({ width: w, height: h, floorY, seatTop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = Math.min(w, h) * 0.07;
  const cx = w * 0.8;
  const cy = floorY - Math.min(w, h) * 0.72;
  const seconds = (frame / fps) * 6; // the second hand turns: time passes, slowly
  const hand = (deg: number, len: number, width: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return <line x1={cx} y1={cy} x2={cx + Math.cos(a) * len} y2={cy + Math.sin(a) * len} stroke={INK} strokeWidth={width} strokeLinecap="round" />;
  };
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
      <rect width={w} height={floorY} fill="#EADCC4" />
      <rect y={floorY - 240} width={w} height={240} fill="#D7BF97" />
      <line x1={0} y1={floorY - 240} x2={w} y2={floorY - 240} stroke={INK} strokeWidth={LINE} />
      <rect y={floorY} width={w} height={h - floorY} fill="#B48D61" />
      <line x1={0} y1={floorY} x2={w} y2={floorY} stroke={INK} strokeWidth={LINE} />
      {/* door */}
      <rect x={w * 0.05} y={floorY - h * 0.33} width={Math.min(w, h) * 0.2} height={h * 0.33} fill="#C59C6E" stroke={INK} strokeWidth={LINE} />
      <circle cx={w * 0.05 + Math.min(w, h) * 0.17} cy={floorY - h * 0.15} r={9} fill={INK} />
      {/* clock */}
      <circle cx={cx} cy={cy} r={r} fill="#FFFDF8" stroke={INK} strokeWidth={LINE} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={cx + Math.cos(a) * r * 0.78} y1={cy + Math.sin(a) * r * 0.78} x2={cx + Math.cos(a) * r * 0.9} y2={cy + Math.sin(a) * r * 0.9} stroke={INK} strokeWidth={4} />;
      })}
      {hand(300, r * 0.5, 7)}
      {hand(60, r * 0.72, 5)}
      {hand(seconds, r * 0.8, 2.5)}
      <circle cx={cx} cy={cy} r={6} fill={INK} />
      {seatTop !== null ? <Bench x1={w * 0.18} x2={w * 0.94} top={seatTop} floorY={floorY} /> : null}
    </svg>
  );
};

const Street: React.FC<BackgroundProps> = ({ width: w, height: h, floorY }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = 0.75 + 0.25 * Math.sin((frame / fps) * Math.PI);
  const unit = Math.min(w, h);
  const buildings = [
    { x: -0.02, w: 0.3, top: 0.38, fill: "#F2C9A1" },
    { x: 0.26, w: 0.26, top: 0.24, fill: "#E9D7B5" },
    { x: 0.5, w: 0.28, top: 0.32, fill: "#C9DCC8" },
    { x: 0.76, w: 0.28, top: 0.2, fill: "#F0B9A8" },
  ];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
      <rect width={w} height={floorY} fill="#D6EAF3" />
      {buildings.map((b, i) => {
        const x = b.x * w;
        const bw = b.w * w;
        const top = b.top * floorY;
        const cols = 3;
        const rows = Math.floor((floorY - top - unit * 0.12) / (unit * 0.13));
        return (
          <g key={i}>
            <rect x={x} y={top} width={bw} height={floorY - top} fill={b.fill} stroke={INK} strokeWidth={LINE} />
            {Array.from({ length: rows * cols }, (_, k) => (
              <rect key={k} x={x + bw * (0.12 + 0.3 * (k % cols))} y={top + unit * 0.05 + unit * 0.13 * Math.floor(k / cols)} width={bw * 0.18} height={unit * 0.07} fill="#FFFDF5" stroke={INK} strokeWidth={4} />
            ))}
          </g>
        );
      })}
      {/* lit shop window: the thing you want */}
      <rect x={w * 0.6} y={floorY - unit * 0.42} width={w * 0.34} height={unit * 0.34} fill="#FFF3C8" stroke={INK} strokeWidth={LINE} />
      <rect x={w * 0.6 + 8} y={floorY - unit * 0.42 + 8} width={w * 0.34 - 16} height={unit * 0.34 - 16} fill="#FFD866" fillOpacity={glow} />
      <rect x={w * 0.6} y={floorY - unit * 0.08} width={w * 0.34} height={unit * 0.08} fill="#E9D7B5" stroke={INK} strokeWidth={LINE} />
      <rect y={floorY} width={w} height={h - floorY} fill="#D8D1C2" />
      <line x1={0} y1={floorY} x2={w} y2={floorY} stroke={INK} strokeWidth={LINE} />
    </svg>
  );
};

const Plain: React.FC<BackgroundProps> = ({ width: w, height: h }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="plain-light" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#F4EBDC" />
        <stop offset="100%" stopColor="#E2D2B8" />
      </radialGradient>
    </defs>
    <rect width={w} height={h} fill="url(#plain-light)" />
  </svg>
);

export const BACKGROUNDS: Record<string, React.FC<BackgroundProps>> = {
  "waiting-room": WaitingRoom,
  street: Street,
  plain: Plain,
};
