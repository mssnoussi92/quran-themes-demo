// « الصاحب ساحب » (docs/scripts/sahib.md; docs/themes.md): two friends, the same everyday moments played twice, the
// one who does wrong in grey, the one who does right in white, the hero in white with his terracotta scarf. A drawn
// set of its own (the owner's choice, 2026-11-19), flat figures outlined in ink, and simple faces: the owner allows a
// face on an anonymous person when the expression shows the difference (2026-11-19). Nobody of a hadith is drawn: the
// musk carrier and the blacksmith are only the companions of a typical scene. No music, no narration.
//
// For now: the style images (one still per short, `SahibStyle`), to be validated before anything is animated.
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT, loadFonts } from "../fonts";

loadFonts();

const W = 1080;
const H = 1920;
const INK = "#17181d";
const WHITE = "#f6f3ec";
const GREY = "#a3a7b0";
const SCARF = "#c0573e";

// ---------------------------------------------------------------------------------------------------- the figures

/** Angles in degrees. Limbs: [first segment from straight down, positive forward; bend of the second segment].
 * `torso`: lean forward from upright; `head`: tilt of the head, positive up. */
export type Pose = { torso: number; head: number; armF: [number, number]; armB: [number, number]; legF: [number, number]; legB: [number, number] };

const SEG = { torso: 122, neck: 8, head: 52, upper: 64, fore: 60, thigh: 78, shin: 76 };
const rad = (d: number) => (d * Math.PI) / 180;
const down = (deg: number): [number, number] => [Math.sin(rad(deg)), Math.cos(rad(deg))];
type P2 = [number, number];
const add = (o: P2, d: P2, l: number): P2 => [o[0] + d[0] * l, o[1] + d[1] * l];

export const POSES = {
  stand: { torso: 0, head: 0, armF: [8, 6], armB: [-8, 6], legF: [6, -4], legB: [-6, -2] } as Pose,
  seat: { torso: -4, head: 0, armF: [30, 50], armB: [14, 30], legF: [86, -84], legB: [80, -80] } as Pose,
  stride: { torso: 14, head: 4, armF: [30, 20], armB: [-30, 10], legF: [32, -10], legB: [-26, -18] } as Pose,
  bent: { torso: 16, head: 10, armF: [24, 30], armB: [-6, 8], legF: [10, -14], legB: [-8, -10] } as Pose,
};

type Face = "neutral" | "smile" | "happy" | "shock" | "smirk" | "kind" | "puff";

/** A simple face, drawn looking to +x (the figure's front); (0, 0) is the centre of the head. */
const FaceMarks: React.FC<{ face: Face }> = ({ face }) => {
  const c = 14; // the face sits a little to the front of the head
  const eye = (dx: number, rx = 5.5, ry = 7.5) => <ellipse cx={c + dx} cy={-6} rx={rx} ry={ry} fill={INK} />;
  const line = (d: string, w = 5) => <path d={d} stroke={INK} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  switch (face) {
    case "smile":
      return <>{eye(-15)}{eye(15)}{line(`M ${c - 27} -24 Q ${c - 16} -30 ${c - 6} -25`)}{line(`M ${c + 6} -25 Q ${c + 16} -30 ${c + 27} -24`)}{line(`M ${c - 14} 14 Q ${c} 27 ${c + 14} 14`)}</>;
    case "happy":
      return (
        <>
          {eye(-15, 6, 8)}{eye(15, 6, 8)}
          {line(`M ${c - 27} -27 Q ${c - 16} -35 ${c - 6} -28`)}{line(`M ${c + 6} -28 Q ${c + 16} -35 ${c + 27} -27`)}
          <path d={`M ${c - 17} 11 Q ${c} 13 ${c + 17} 11 Q ${c + 12} 33 ${c} 33 Q ${c - 12} 33 ${c - 17} 11 Z`} fill={INK} />
          <path d={`M ${c - 7} 27 Q ${c} 22 ${c + 7} 27 Q ${c} 32 ${c - 7} 27 Z`} fill="#e07a6a" />
        </>
      );
    case "shock":
      return (
        <>
          <circle cx={c - 15} cy={-6} r={9} fill={INK} /><circle cx={c + 15} cy={-6} r={9} fill={INK} />
          <circle cx={c - 12} cy={-9} r={2.6} fill={WHITE} /><circle cx={c + 18} cy={-9} r={2.6} fill={WHITE} />
          {line(`M ${c - 28} -30 Q ${c - 17} -40 ${c - 6} -32`)}{line(`M ${c + 6} -32 Q ${c + 17} -40 ${c + 28} -30`)}
          <ellipse cx={c} cy={21} rx={7} ry={9.5} fill={INK} />
        </>
      );
    case "smirk":
      // half-closed eyes, one brow up, the mouth up on one side: pleased with himself, careless
      return (
        <>
          <path d={`M ${c - 21} -6 Q ${c - 15} 2 ${c - 9} -6 Z`} fill={INK} />
          <path d={`M ${c + 9} -6 Q ${c + 15} 2 ${c + 21} -6 Z`} fill={INK} />
          {line(`M ${c - 23} -7 L ${c - 7} -7`, 4.5)}{line(`M ${c + 7} -7 L ${c + 23} -7`, 4.5)}
          {line(`M ${c - 26} -20 L ${c - 7} -18`)}{line(`M ${c + 7} -26 Q ${c + 17} -33 ${c + 27} -27`)}
          {line(`M ${c - 12} 18 Q ${c + 2} 22 ${c + 15} 10`)}
        </>
      );
    case "kind":
      // calm and warm: soft brows, a small closed smile
      return <>{eye(-15)}{eye(15)}{line(`M ${c - 26} -23 Q ${c - 16} -27 ${c - 7} -24`)}{line(`M ${c + 7} -24 Q ${c + 16} -27 ${c + 26} -23`)}{line(`M ${c - 12} 15 Q ${c} 25 ${c + 12} 15`)}</>;
    case "puff":
      // blowing out smoke, the eyes shut with pleasure
      return (
        <>
          {line(`M ${c - 22} -5 Q ${c - 15} 1 ${c - 8} -5`)}{line(`M ${c + 8} -5 Q ${c + 15} 1 ${c + 22} -5`)}
          {line(`M ${c - 25} -21 L ${c - 8} -20`)}{line(`M ${c + 8} -26 Q ${c + 17} -31 ${c + 26} -25`)}
          <circle cx={c + 6} cy={18} r={5.5} fill="none" stroke={INK} strokeWidth={4.5} />
        </>
      );
    default:
      return <>{eye(-15)}{eye(15)}{line(`M ${c - 25} -22 L ${c - 7} -22`)}{line(`M ${c + 7} -22 L ${c + 25} -22`)}{line(`M ${c - 9} 17 L ${c + 9} 17`)}</>;
  }
};

/** Two segments from `o` to the point `t`, the joint bent to the side `bend` (1 or -1); all in local units. */
const reach = (o: P2, t: P2, l1: number, l2: number, bend: number): readonly [P2, P2, P2] => {
  const dx = t[0] - o[0];
  const dy = t[1] - o[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1), l1 + l2 - 0.5);
  const base = Math.atan2(dy, dx);
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const j: P2 = [o[0] + l1 * Math.cos(base + bend * a), o[1] + l1 * Math.sin(base + bend * a)];
  const end: P2 = [o[0] + (dx / Math.hypot(dx, dy)) * d, o[1] + (dy / Math.hypot(dx, dy)) * d];
  return [o, j, end] as const;
};

export type StickProps = {
  x: number;
  y: number; // the pelvis
  s?: number;
  pose: Pose;
  facing?: 1 | -1;
  tone?: "white" | "grey";
  face?: Face;
  /** World points the front or back hand reaches (overrides the pose's arm), and the side the elbow bends to. */
  handF?: P2;
  handB?: P2;
  bendF?: number;
  bendB?: number;
  scarf?: boolean;
  /** Something held in the front hand, drawn at the hand in world units (not turned). */
  heldF?: React.ReactNode;
  heldB?: React.ReactNode;
  /** Drawn over the scarf: the burnt hole. */
  burn?: boolean;
  beard?: boolean;
  cap?: string;
  /** -1: the head looks back over the shoulder while the body goes on. */
  look?: 1 | -1;
};

/** A flat figure outlined in ink, a round head with a simple face. */
export const Stick: React.FC<StickProps> = ({ x, y, s = 1.3, pose, facing = 1, tone = "white", face = "neutral", handF, handB, bendF = -1, bendB = -1, scarf, heldF, heldB, burn, beard, cap, look = 1 }) => {
  const fill = tone === "grey" ? GREY : WHITE;
  const P: P2 = [0, 0];
  const up: P2 = [Math.sin(rad(pose.torso)), -Math.cos(rad(pose.torso))];
  const neck = add(P, up, SEG.torso);
  const shoulder = add(P, up, SEG.torso - 16);
  const headDir: P2 = [Math.sin(rad(pose.torso - pose.head)), -Math.cos(rad(pose.torso - pose.head))];
  const head = add(neck, headDir, SEG.neck + SEG.head);
  const limb = (o: P2, [a, b]: [number, number], l1: number, l2: number): readonly [P2, P2, P2] => {
    const j = add(o, down(a), l1);
    return [o, j, add(j, down(a + b), l2)] as const;
  };
  const local = (w: P2): P2 => [(w[0] - x) / (facing * s), (w[1] - y) / s];
  const armF = handF ? reach(shoulder, local(handF), SEG.upper, SEG.fore, bendF) : limb(shoulder, pose.armF, SEG.upper, SEG.fore);
  const armB = handB ? reach(shoulder, local(handB), SEG.upper, SEG.fore, bendB) : limb(shoulder, pose.armB, SEG.upper, SEG.fore);
  const legF = limb(P, pose.legF, SEG.thigh, SEG.shin);
  const legB = limb(P, pose.legB, SEG.thigh, SEG.shin);
  const path = (pts: readonly P2[]) => `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")}`;
  const part = (pts: readonly P2[], w: number, color = fill) => (
    <>
      <path d={path(pts)} stroke={INK} strokeWidth={w + 11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path(pts)} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
  const back = tone === "grey" ? "#8d9199" : "#dcd8ce";
  const world = (p: P2) => [x + p[0] * facing * s, y + p[1] * s] as const;
  const hF = world(armF[2]);
  const hB = world(armB[2]);
  const tilt = (Math.atan2(headDir[1], headDir[0]) * 180) / Math.PI + 90;
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${facing * s} ${s})`}>
        {part(legB, 26, back)}
        {part(armB, 23, back)}
        {part([P, neck], 30)}
        {part(legF, 26)}
        {scarf ? (
          <g>
            <path d={`M ${neck[0] - 30} ${neck[1] + 14} Q ${neck[0]} ${neck[1] + 30} ${neck[0] + 30} ${neck[1] + 12}`} stroke={INK} strokeWidth={30} fill="none" strokeLinecap="round" />
            <path d={`M ${neck[0] - 30} ${neck[1] + 14} Q ${neck[0]} ${neck[1] + 30} ${neck[0] + 30} ${neck[1] + 12}`} stroke={SCARF} strokeWidth={20} fill="none" strokeLinecap="round" />
            <path d={`M ${neck[0] + 22} ${neck[1] + 18} L ${neck[0] + 26} ${neck[1] + 76} L ${neck[0] + 50} ${neck[1] + 72} L ${neck[0] + 36} ${neck[1] + 16} Z`} fill={SCARF} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d={`M ${neck[0] + 30} ${neck[1] + 70} l -2 8 M ${neck[0] + 37} ${neck[1] + 69} l 0 8 M ${neck[0] + 44} ${neck[1] + 67} l 2 8`} stroke={SCARF} strokeWidth={3} strokeLinecap="round" />
            {burn ? (
              <g>
                <ellipse cx={neck[0] + 36} cy={neck[1] + 46} rx={15} ry={12} fill="#2b1a14" stroke="#ff8a3d" strokeWidth={5} />
                <ellipse cx={neck[0] + 36} cy={neck[1] + 46} rx={22} ry={18} fill="none" stroke="#5a2b1c" strokeWidth={5} opacity={0.75} />
                <circle cx={neck[0] + 40} cy={neck[1] + 42} r={4} fill="#ffb347" />
              </g>
            ) : null}
          </g>
        ) : null}
        {part(armF, 23)}
        <circle cx={head[0]} cy={head[1]} r={SEG.head} fill={fill} stroke={INK} strokeWidth={6} />
        <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt}) scale(${look} 1)`}>
          <FaceMarks face={face} />
          {beard ? <path d="M 0 28 Q 16 50 34 26" stroke="#e8e6e0" strokeWidth={9} fill="none" strokeLinecap="round" /> : null}
          {cap ? <path d={`M -50 -16 Q -46 -58 6 -60 Q 50 -58 52 -16 Z M 30 -20 L 74 -16`} fill={cap} stroke={INK} strokeWidth={5} strokeLinejoin="round" /> : null}
        </g>
      </g>
      {heldF ? <g transform={`translate(${hF[0].toFixed(1)} ${hF[1].toFixed(1)})`}>{heldF}</g> : null}
      {heldB ? <g transform={`translate(${hB[0].toFixed(1)} ${hB[1].toFixed(1)})`}>{heldB}</g> : null}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------------ the label

/** The label of the moment, at the top: Arabic, the English under it, and the companion's colour. */
export const Label: React.FC<{ ar: string; en: string; tone: "white" | "grey" }> = ({ ar, en, tone }) => (
  <div style={{ position: "absolute", top: 290, left: 0, width: W, textAlign: "center" }}>
    <div style={{ display: "inline-flex", alignItems: "center", gap: 22, direction: "rtl" }}>
      <span style={{ width: 30, height: 30, borderRadius: 15, background: tone === "grey" ? GREY : WHITE, border: `5px solid ${INK}`, boxShadow: "0 0 0 3px rgba(255,255,255,.35)" }} />
      <span style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: 84, color: "#fffaf0", textShadow: "0 4px 18px rgba(0,0,0,.55)", lineHeight: 1.1 }}>{ar}</span>
    </div>
    <div style={{ fontFamily: FONT.latin, fontSize: 30, letterSpacing: 7, color: "#fffaf0", opacity: 0.78, marginTop: 10, textShadow: "0 3px 12px rgba(0,0,0,.6)" }}>{en.toUpperCase()}</div>
  </div>
);

// ------------------------------------------------------------------------------------------------- 1. the ahwa

const Fanoos: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <defs>
      <radialGradient id="fanoos-glow">
        <stop offset="0" stopColor="#ffd38a" stopOpacity=".75" />
        <stop offset=".45" stopColor="#ffb55c" stopOpacity=".22" />
        <stop offset="1" stopColor="#ffb55c" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y + 60} r={420} fill="url(#fanoos-glow)" />
    <path d={`M ${x} 0 L ${x} ${y - 30}`} stroke={INK} strokeWidth={5} />
    <path d={`M ${x - 22} ${y - 30} L ${x + 22} ${y - 30} L ${x + 8} ${y - 52} L ${x - 8} ${y - 52} Z`} fill="#b8862f" stroke={INK} strokeWidth={4} />
    <path d={`M ${x - 46} ${y} L ${x - 22} ${y - 30} L ${x + 22} ${y - 30} L ${x + 46} ${y} L ${x + 38} ${y + 110} L ${x - 38} ${y + 110} Z`} fill="#ffcf7a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d={`M ${x - 16} ${y - 28} L ${x - 14} ${y + 110} M ${x + 16} ${y - 28} L ${x + 14} ${y + 110} M ${x - 44} ${y + 30} L ${x + 44} ${y + 30} M ${x - 40} ${y + 80} L ${x + 40} ${y + 80}`} stroke="#b8862f" strokeWidth={4} />
    <path d={`M ${x - 4} ${y + 34} L ${x + 4} ${y + 34} L ${x + 2} ${y + 76} L ${x - 2} ${y + 76} Z`} fill="#d9493b" opacity={0.6} />
    <path d={`M ${x - 38} ${y + 110} L ${x + 38} ${y + 110} L ${x} ${y + 150} Z`} fill="#b8862f" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/** An ahwa chair seen from the side: woven seat, its back away from the table. */
const AhwaChair: React.FC<{ x: number; seat: number; floor: number; facing: 1 | -1 }> = ({ x, seat, floor, facing }) => {
  const b = -facing * 52;
  return (
    <g stroke={INK} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M ${x - 54} ${seat} L ${x - 58} ${floor} M ${x + 54} ${seat} L ${x + 58} ${floor}`} strokeWidth={22} />
      <path d={`M ${x - 54} ${seat} L ${x - 58} ${floor} M ${x + 54} ${seat} L ${x + 58} ${floor}`} stroke="#8a5a32" strokeWidth={12} />
      <path d={`M ${x + b} ${seat} L ${x + b - facing * 10} ${seat - 230}`} strokeWidth={22} />
      <path d={`M ${x + b} ${seat} L ${x + b - facing * 10} ${seat - 230}`} stroke="#8a5a32" strokeWidth={12} />
      <path d={`M ${x + b - facing * 4} ${seat - 120} L ${x + b - facing * 9} ${seat - 210}`} stroke="#8a5a32" strokeWidth={34} />
      <rect x={x - 66} y={seat - 12} width={132} height={22} rx={8} fill="#d8b878" strokeWidth={6} />
      <path d={`M ${x - 56} ${seat - 2} L ${x + 56} ${seat - 2}`} stroke="#b89353" strokeWidth={3} strokeDasharray="8 6" />
    </g>
  );
};

/** The shisha on the floor: its glass base, the brass stem, the bowl of live coals at the top. */
const Shisha: React.FC<{ x: number; floor: number; bowl: number }> = ({ x, floor, bowl }) => (
  <g stroke={INK} strokeLinejoin="round">
    <path d={`M ${x - 62} ${floor} Q ${x - 84} ${floor - 90} ${x - 30} ${floor - 140} L ${x + 30} ${floor - 140} Q ${x + 84} ${floor - 90} ${x + 62} ${floor} Z`} fill="#4fa38f" fillOpacity={0.85} strokeWidth={6} />
    <path d={`M ${x - 50} ${floor - 60} Q ${x} ${floor - 48} ${x + 50} ${floor - 60}`} stroke="#9fe0cf" strokeWidth={4} fill="none" opacity={0.7} />
    <rect x={x - 11} y={bowl + 40} width={22} height={floor - 140 - bowl - 40} fill="#c99a3e" strokeWidth={5} />
    <ellipse cx={x} cy={floor - 150} rx={36} ry={10} fill="#c99a3e" strokeWidth={5} />
    <ellipse cx={x} cy={bowl + 120} rx={44} ry={10} fill="#c99a3e" strokeWidth={5} />
    <path d={`M ${x - 34} ${bowl + 8} L ${x + 34} ${bowl + 8} L ${x + 16} ${bowl + 46} L ${x - 16} ${bowl + 46} Z`} fill="#a4472f" strokeWidth={5} />
    <path d={`M ${x - 40} ${bowl + 6} L ${x + 40} ${bowl + 6}`} stroke="#d7d7d7" strokeWidth={8} strokeLinecap="round" />
    <circle cx={x - 16} cy={bowl - 2} r={12} fill="#ff7a2f" stroke="#3a1a0e" strokeWidth={4} />
    <circle cx={x + 12} cy={bowl - 4} r={13} fill="#ff9b3d" stroke="#3a1a0e" strokeWidth={4} />
    <circle cx={x - 2} cy={bowl - 14} r={10} fill="#ffb347" stroke="#3a1a0e" strokeWidth={4} />
  </g>
);

const Smoke: React.FC<{ x: number; y: number; k?: number; o?: number }> = ({ x, y, k = 1, o = 0.55 }) => (
  <g opacity={o} fill="#c9ccd2">
    {[[0, 0, 34], [40, -18, 42], [86, -6, 36], [124, -26, 30], [62, -46, 28], [20, -38, 24]].map(([dx, dy, r], i) => (
      <circle key={i} cx={x + dx * k} cy={y + dy * k} r={r * k} />
    ))}
  </g>
);

const TeaGlass: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g stroke={INK} strokeLinejoin="round">
    <ellipse cx={x} cy={y} rx={30} ry={7} fill="#c99a3e" strokeWidth={4} />
    <path d={`M ${x - 16} ${y - 4} L ${x - 19} ${y - 52} L ${x + 19} ${y - 52} L ${x + 16} ${y - 4} Z`} fill="#c8742a" fillOpacity={0.9} strokeWidth={4.5} />
    <path d={`M ${x - 18} ${y - 44} L ${x + 18} ${y - 44}`} stroke="#ffd59a" strokeWidth={3} />
  </g>
);

const JalisStyle: React.FC = () => {
  const floor = 1400;
  const seat = 1222;
  // the hero, seated on the right, looks down at the hole in his scarf; the grey companion, on the left, leans back
  // with the hose at his lips and blows his smoke at him; a coal has jumped from the bowl onto the scarf
  return (
    <AbsoluteFill style={{ background: "#132623" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ahwa-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#10211f" />
            <stop offset=".55" stopColor="#1f4540" />
            <stop offset="1" stopColor="#173430" />
          </linearGradient>
          <linearGradient id="ahwa-street" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c2350" />
            <stop offset="1" stopColor="#5a3c66" />
          </linearGradient>
          <pattern id="ahwa-tiles" width="64" height="64" patternUnits="userSpaceOnUse">
            <rect width="64" height="64" fill="#2a5a51" />
            <path d="M 32 4 L 60 32 L 32 60 L 4 32 Z" fill="#33695e" />
            <circle cx="32" cy="32" r="7" fill="#c99a3e" opacity=".55" />
          </pattern>
          <pattern id="ahwa-floor" width="120" height="60" patternUnits="userSpaceOnUse">
            <rect width="120" height="60" fill="#2a2019" />
            <rect width="60" height="30" fill="#33271f" />
            <rect x="60" y="30" width="60" height="30" fill="#33271f" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#ahwa-wall)" />
        {/* the arched door on the street, the night outside, a lit shop opposite */}
        <path d="M 760 1170 L 760 640 Q 760 520 900 520 Q 1040 520 1040 640 L 1040 1170 Z" fill="url(#ahwa-street)" stroke="#c99a3e" strokeWidth={10} />
        <rect x={780} y={930} width={240} height={240} fill="#2a1f3a" />
        <rect x={800} y={960} width={200} height={150} fill="#ffcf7a" opacity={0.8} />
        <path d="M 790 930 L 1010 930 L 1000 960 L 800 960 Z" fill="#d9493b" opacity={0.85} />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={810 + i * 48} cy={600 + (i % 2) * 40} r={3} fill="#fff6dd" opacity={0.8} />)}
        {/* the mirror with its gilt frame */}
        <rect x={70} y={560} width={250} height={380} rx={30} fill="#2d4f60" stroke="#c99a3e" strokeWidth={14} />
        <path d="M 110 600 L 200 600 L 110 760 Z" fill="#7fa4b5" opacity={0.35} />
        {/* the tiled dado */}
        <rect x={0} y={1110} width={W} height={floor - 1110} fill="url(#ahwa-tiles)" />
        <rect x={0} y={1100} width={W} height={14} fill="#c99a3e" />
        <rect x={0} y={floor} width={W} height={H - floor} fill="url(#ahwa-floor)" />
        <rect x={0} y={floor} width={W} height={10} fill={INK} opacity={0.6} />
        <Fanoos x={540} y={600} />
        {/* the table and its tea */}
        <path d="M 540 1170 L 540 1390 M 490 1396 L 590 1396" stroke={INK} strokeWidth={22} strokeLinecap="round" />
        <path d="M 540 1170 L 540 1390 M 490 1396 L 590 1396" stroke="#c99a3e" strokeWidth={10} strokeLinecap="round" />
        <ellipse cx={540} cy={1166} rx={130} ry={22} fill="#d9ab4f" stroke={INK} strokeWidth={7} />
        <TeaGlass x={490} y={1160} />
        <TeaGlass x={596} y={1162} />
        <AhwaChair x={300} seat={seat} floor={floor} facing={1} />
        <AhwaChair x={790} seat={seat} floor={floor} facing={-1} />
        <Shisha x={150} floor={floor + 6} bowl={930} />
        {/* the hose, from the stem to his lips */}
        <path d="M 168 1110 C 230 1190 290 1080 304 1004" stroke={INK} strokeWidth={18} fill="none" strokeLinecap="round" />
        <path d="M 168 1110 C 230 1190 290 1080 304 1004" stroke="#7a2f3a" strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray="10 7" />
        <Stick x={300} y={seat - 22} pose={{ torso: -10, head: 12, armF: [0, 0], armB: [12, 40], legF: [84, -84], legB: [78, -80] }} facing={1} tone="grey" face="puff" handF={[300, 1006]} bendF={1} />
        {/* his smoke, blown across the table at the hero */}
        <Smoke x={430} y={930} k={1.1} o={0.6} />
        <Smoke x={600} y={890} k={0.9} o={0.45} />
        {/* the coal that jumped from the bowl, its trail */}
        <path d="M 160 920 Q 470 640 800 960" stroke="#ff9b3d" strokeWidth={5} fill="none" strokeDasharray="4 18" strokeLinecap="round" opacity={0.85} />
        <Stick x={790} y={seat - 22} pose={{ torso: 14, head: -16, armF: [0, 0], armB: [20, 60], legF: [84, -84], legB: [78, -80] }} facing={-1} tone="white" face="shock" scarf burn handF={[736, 1062]} bendF={-1} />
        {/* the smoke rising from the hole */}
        <path d="M 744 1010 q -14 -24 0 -46 q 14 -22 0 -46" stroke="#cfd2d8" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.75} />
        {/* the bad smell around the hero */}
        <path d="M 900 860 q 14 -20 0 -40 q -14 -20 0 -40 M 940 900 q 14 -20 0 -40 q -14 -20 0 -40" stroke="#9aa088" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
      </svg>
      <Label ar="جليس السوء" en="A bad companion" tone="grey" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 2. the bus stop

const Phone: React.FC<{ glow?: boolean; r?: number }> = ({ glow, r = 0 }) => (
  <g transform={`rotate(${r})`}>
    {glow ? <rect x={-34} y={-58} width={68} height={116} rx={18} fill="#bfe3ff" opacity={0.35} /> : null}
    <rect x={-22} y={-40} width={44} height={80} rx={9} fill={INK} />
    <rect x={-17} y={-33} width={34} height={64} rx={4} fill={glow ? "#dff1ff" : "#3b4a63"} />
  </g>
);

const YuhibbStyle: React.FC = () => {
  const floor = 1420;
  return (
    <AbsoluteFill style={{ background: "#a9cbe6" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="morning" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7fb0d8" />
            <stop offset=".6" stopColor="#cfe0ea" />
            <stop offset="1" stopColor="#f6d8b2" />
          </linearGradient>
          <radialGradient id="sun">
            <stop offset="0" stopColor="#fff4d6" stopOpacity="1" />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#morning)" />
        <circle cx={170} cy={760} r={260} fill="url(#sun)" />
        {/* the city behind: blocks, water tanks and dishes on the roofs */}
        <g fill="#c6b8cf" opacity={0.85}>
          <rect x={0} y={900} width={220} height={520} />
          <rect x={230} y={820} width={180} height={600} />
          <rect x={420} y={960} width={240} height={460} />
          <rect x={670} y={860} width={200} height={560} />
          <rect x={880} y={940} width={200} height={480} />
          <rect x={270} y={780} width={40} height={40} />
          <path d="M 720 860 l 0 -40 l 40 0 l 0 40 M 940 940 q 20 -40 40 0" stroke="#c6b8cf" strokeWidth={8} fill="none" />
        </g>
        <g fill="#e9dfe6" opacity={0.7}>
          {Array.from({ length: 28 }, (_, i) => <rect key={i} x={20 + (i % 7) * 150} y={960 + Math.floor(i / 7) * 110} width={36} height={50} rx={4} />)}
        </g>
        {/* the pavement and the road */}
        <rect x={0} y={floor} width={W} height={H - floor} fill="#d9c7a8" />
        <rect x={0} y={floor + 120} width={W} height={H - floor - 120} fill="#4a4f5a" />
        <rect x={0} y={floor + 112} width={W} height={16} fill="#e9e3d6" stroke={INK} strokeWidth={4} />
        {/* the foul cart, at the edge */}
        <g stroke={INK} strokeWidth={6} strokeLinejoin="round">
          <rect x={-40} y={1170} width={200} height={150} rx={10} fill="#3f8a5a" />
          <circle cx={30} cy={1360} r={46} fill="#5a4636" />
          <circle cx={30} cy={1360} r={14} fill="#c99a3e" />
          <path d="M 20 1170 Q 20 1060 80 1050 Q 140 1060 140 1170 Z" fill="#c8813e" />
          <path d="M 64 1050 L 96 1050 L 92 1028 L 68 1028 Z" fill="#a8652d" />
          <ellipse cx={170} cy={1166} rx={44} ry={14} fill="#e5c58f" />
          <ellipse cx={170} cy={1150} rx={40} ry={13} fill="#efd5a6" />
        </g>
        {/* the shelter, its bench, the bus sign, the poster */}
        <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
          <rect x={560} y={760} width={480} height={30} rx={8} fill="#2f6f9e" />
          <path d="M 590 790 L 590 1420 M 1010 790 L 1010 1420" strokeWidth={16} />
          <rect x={604} y={800} width={392} height={330} fill="#cfe6f2" fillOpacity={0.45} strokeWidth={5} />
          <rect x={700} y={1250} width={300} height={22} rx={6} fill="#8a96a8" />
          <path d="M 720 1272 L 720 1420 M 980 1272 L 980 1420" strokeWidth={12} />
        </g>
        <g stroke={INK} strokeWidth={6}>
          <path d="M 520 1420 L 520 640" strokeWidth={14} />
          <circle cx={520} cy={600} r={58} fill="#f2c94c" />
        </g>
        <g transform="translate(520 600)">
          <rect x={-30} y={-22} width={60} height={36} rx={8} fill="#2f6f9e" stroke={INK} strokeWidth={4} />
          <rect x={-22} y={-14} width={18} height={12} fill="#dff1ff" />
          <rect x={4} y={-14} width={18} height={12} fill="#dff1ff" />
          <circle cx={-16} cy={18} r={7} fill={INK} />
          <circle cx={16} cy={18} r={7} fill={INK} />
        </g>
        {/* the poster: « مطلوب », its lines, the tabs to tear off */}
        <g>
          <rect x={640} y={840} width={200} height={250} fill="#fffdf6" stroke={INK} strokeWidth={5} transform="rotate(-3 740 965)" />
          <text x={740} y={915} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={50} fill="#c0392b" transform="rotate(-3 740 965)">مطلوب</text>
          <g transform="rotate(-3 740 965)" fill="#9aa3ad">
            <rect x={670} y={940} width={140} height={10} rx={5} />
            <rect x={680} y={964} width={120} height={10} rx={5} />
            <rect x={670} y={988} width={140} height={10} rx={5} />
            {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={652 + i * 31} y={1040} width={22} height={44} fill="#e8e4d6" stroke={INK} strokeWidth={2} />)}
          </g>
        </g>
        {/* the white friend photographs it, smiling; the hero, by the bench, gets it on his phone */}
        <Stick x={420} y={1215} pose={{ ...POSES.stand, torso: 4, head: 8 }} facing={1} tone="white" face="smile" handF={[560, 965]} bendF={1} handB={[430, 1060]} bendB={-1} heldF={<Phone r={-8} />} />
        <Stick x={880} y={1215} pose={{ ...POSES.stand, torso: 6, head: -10 }} facing={-1} tone="white" face="happy" scarf handF={[800, 1085]} bendF={-1} heldF={<Phone glow r={10} />} />
        {/* the phone buzzes: the message, with the poster */}
        <path d="M 760 1060 l -16 -10 M 756 1090 l -20 0 M 760 1120 l -16 10" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <g transform="translate(930 790)">
          <path d="M -118 -96 L 108 -96 Q 126 -96 126 -78 L 126 -10 Q 126 8 108 8 L -40 8 L -64 34 L -66 8 L -118 8 Q -136 8 -136 -10 L -136 -78 Q -136 -96 -118 -96 Z" fill="#ffffff" stroke={INK} strokeWidth={5} />
          <rect x={-120} y={-82} width={56} height={74} fill="#fffdf6" stroke={INK} strokeWidth={3} />
          <rect x={-112} y={-72} width={40} height={8} fill="#c0392b" />
          <text x={36} y={-30} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={44} fill={INK}>شوف دي!</text>
        </g>
      </svg>
      <Label ar="بيحب لك زي نفسه" en="Loves for you as for himself" tone="white" />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------- 3. the kiosk

const NasrStyle: React.FC = () => {
  const floor = 1420;
  const colors = ["#e85d4a", "#f2c94c", "#3fa36b", "#3d7cc9", "#e88a3a", "#b05fc2", "#f07fa0", "#4cc3c9"];
  // the hero steps forward to pass in front of the old man; the white friend, behind him, takes hold of his hand
  const hand: P2 = [292, 1188];
  return (
    <AbsoluteFill style={{ background: "#1b1f3a" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141836" />
            <stop offset=".7" stopColor="#3a2f5c" />
            <stop offset="1" stopColor="#6a4a6e" />
          </linearGradient>
          <radialGradient id="kiosk-light" cx=".5" cy=".3">
            <stop offset="0" stopColor="#eaf6ff" stopOpacity=".55" />
            <stop offset="1" stopColor="#eaf6ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lamp-pool">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity=".5" />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#dusk)" />
        <rect x={0} y={700} width={W} height={720} fill="#262b48" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={40 + i * 120} y={760} width={70} height={100} rx={6} fill="#ffcf7a" opacity={i === 2 ? 0.08 : 0.22} />)}
        {/* the street lamp on the left and its pool of light */}
        <ellipse cx={150} cy={floor + 40} rx={300} ry={90} fill="url(#lamp-pool)" />
        <path d="M 60 1420 L 60 620 Q 60 580 110 580 L 160 580" stroke={INK} strokeWidth={14} fill="none" />
        <path d="M 140 572 L 200 572 L 190 600 L 150 600 Z" fill="#ffe2a8" stroke={INK} strokeWidth={5} />
        {/* the kiosk: its striped awning, its lit window full of packets, the fridge */}
        <ellipse cx={760} cy={1100} rx={420} ry={420} fill="url(#kiosk-light)" />
        <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
          <rect x={560} y={720} width={500} height={700} fill="#d8d2c4" />
          <rect x={590} y={800} width={440} height={330} fill="#f1f7fb" />
          <rect x={560} y={1130} width={500} height={40} fill="#b9b2a2" />
        </g>
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 9 }, (_, i) => (
            <rect key={`${row}-${i}`} x={604 + i * 47} y={820 + row * 100} width={36} height={58} rx={5} fill={colors[(i + row * 3) % colors.length]} stroke={INK} strokeWidth={3} />
          )),
        )}
        <path d="M 590 884 L 1030 884 M 590 984 L 1030 984 M 590 1084 L 1030 1084" stroke="#8a8478" strokeWidth={6} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <path key={i} d={`M ${540 + i * 54} 640 L ${594 + i * 54} 640 L ${590 + i * 54} 730 L ${544 + i * 54} 730 Z`} fill={i % 2 ? "#f6f3ec" : "#d9493b"} stroke={INK} strokeWidth={5} />
        ))}
        <path d="M 540 730 Q 567 760 594 730 Q 621 760 648 730 Q 675 760 702 730 Q 729 760 756 730 Q 783 760 810 730 Q 837 760 864 730 Q 891 760 918 730 Q 945 760 972 730 Q 999 760 1026 730 Q 1053 760 1080 730" fill="#d9493b" stroke={INK} strokeWidth={5} />
        {/* the shopkeeper behind the counter */}
        <Stick x={900} y={1250} pose={{ ...POSES.stand, head: -4 }} facing={-1} tone="white" face="neutral" cap="#3d7cc9" />
        <rect x={560} y={1170} width={500} height={250} fill="#c46a3c" stroke={INK} strokeWidth={7} />
        <path d="M 560 1230 L 1060 1230" stroke="#9e522c" strokeWidth={6} />
        {/* the pavement */}
        <rect x={0} y={floor} width={W} height={H - floor} fill="#3b3a4a" />
        <path d={Array.from({ length: 9 }, (_, i) => `M ${i * 130} ${floor} L ${i * 130 - 60} ${H}`).join(" ")} stroke="#2c2b38" strokeWidth={4} />
        <rect x={0} y={floor} width={W} height={10} fill={INK} opacity={0.6} />
        {/* the old man at the counter, bent over his cane */}
        <Stick x={600} y={1218} pose={{ ...POSES.bent, armF: [34, 4] }} facing={1} tone="white" face="neutral" beard heldF={<path d="M 0 0 L 6 196" stroke="#6b4a2f" strokeWidth={12} strokeLinecap="round" />} />
        {/* the hero, mid-stride towards the counter, turns his head: his hand is held */}
        <Stick x={420} y={1216} pose={{ ...POSES.stride, head: 8 }} facing={1} tone="white" face="shock" look={-1} scarf handB={hand} bendB={1} handF={[540, 1150]} bendF={1} />
        {/* the white friend, behind, his hand over the hero's hand */}
        <Stick x={200} y={1216} pose={{ ...POSES.stand, torso: -6, head: 6, legF: [16, -6], legB: [-14, -4] }} facing={1} tone="white" face="kind" handF={[hand[0] - 6, hand[1] - 8]} bendF={1} />
        <circle cx={hand[0] - 2} cy={hand[1] - 4} r={20} fill="none" stroke="#ffe7a3" strokeWidth={4} opacity={0.75} />
      </svg>
      <Label ar="بينصرك" en="Truly helps you" tone="white" />
    </AbsoluteFill>
  );
};

// --------------------------------------------------------------------------------------------- the style stills

export type SahibStyleProps = { shot: "jalis" | "yuhibb" | "nasr" };

/** One still per short, for the owner to judge the look before anything moves. */
export const SahibStyle: React.FC<SahibStyleProps> = ({ shot }) => (shot === "jalis" ? <JalisStyle /> : shot === "yuhibb" ? <YuhibbStyle /> : <NasrStyle />);
