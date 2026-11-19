// « الصاحب ساحب » (docs/scripts/sahib.md; docs/themes.md): two friends, the same everyday moments played twice, the
// one who does wrong in grey, the one who does right in white, the hero in white with his terracotta scarf. A drawn
// set of its own (the owner's choice, 2026-11-19), flat figures outlined in ink, and simple faces: the owner allows a
// face on an anonymous person when the expression shows the difference (2026-11-19). Nobody of a hadith is drawn: the
// musk carrier and the blacksmith are only the companions of a typical scene. No music, no narration.
//
// The style images (one still per short, `SahibStyle`, validated by the owner on 2026-11-19), then the shorts: each moment
// drawn at the seconds since its scene started (content/trial/<short>.yaml, `pause`), the label of the moment in an
// overlay above the veil (`SAHIB_OVERLAYS`).
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { FONT, loadFonts } from "../fonts";
import { walk } from "./Lens";
import type { Drawn } from "./Trial";

loadFonts();

const W = 1080;
const H = 1920;
const INK = "#17181d";
const WHITE = "#f6f3ec";
const GREY = "#a3a7b0";
const SCARF = "#c0573e";
const GOLD = "#f2c66d";

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

export type Face = "neutral" | "smile" | "happy" | "shock" | "smirk" | "kind" | "puff" | "angry" | "worried" | "laugh" | "calm";

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
    case "angry":
      // shouting: brows down to the middle, the mouth open wide
      return (
        <>
          {eye(-15, 5.5, 6)}{eye(15, 5.5, 6)}
          {line(`M ${c - 27} -27 L ${c - 6} -17`, 6)}{line(`M ${c + 6} -17 L ${c + 27} -27`, 6)}
          <path d={`M ${c - 15} 12 L ${c + 15} 12 L ${c + 10} 30 L ${c - 10} 30 Z`} fill={INK} />
        </>
      );
    case "worried":
      // sad and unsure: brows up in the middle, the mouth down
      return <>{eye(-15)}{eye(15)}{line(`M ${c - 26} -20 L ${c - 7} -28`)}{line(`M ${c + 7} -28 L ${c + 26} -20`)}{line(`M ${c - 12} 22 Q ${c} 13 ${c + 12} 22`)}</>;
    case "laugh":
      // laughing: the eyes shut in two arches, the mouth wide open
      return (
        <>
          {line(`M ${c - 22} -3 Q ${c - 15} -13 ${c - 8} -3`)}{line(`M ${c + 8} -3 Q ${c + 15} -13 ${c + 22} -3`)}
          {line(`M ${c - 26} -24 Q ${c - 16} -31 ${c - 6} -26`)}{line(`M ${c + 6} -26 Q ${c + 16} -31 ${c + 26} -24`)}
          <path d={`M ${c - 18} 9 Q ${c} 11 ${c + 18} 9 Q ${c + 13} 34 ${c} 34 Q ${c - 13} 34 ${c - 18} 9 Z`} fill={INK} />
          <path d={`M ${c - 8} 28 Q ${c} 22 ${c + 8} 28 Q ${c} 33 ${c - 8} 28 Z`} fill="#e07a6a" />
        </>
      );
    case "calm":
      // at peace: the eyes closed, a small smile (the one who says his dhikr)
      return <>{line(`M ${c - 22} -5 Q ${c - 15} 1 ${c - 8} -5`)}{line(`M ${c + 8} -5 Q ${c + 15} 1 ${c + 22} -5`)}{line(`M ${c - 25} -22 Q ${c - 16} -26 ${c - 7} -23`)}{line(`M ${c + 7} -23 Q ${c + 16} -26 ${c + 25} -22`)}{line(`M ${c - 10} 16 Q ${c} 23 ${c + 10} 16`)}</>;
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

// ------------------------------------------------------------------------------------------------- small props

const Phone: React.FC<{ glow?: boolean; r?: number; flash?: number }> = ({ glow, r = 0, flash = 0 }) => (
  <g transform={`rotate(${r})`}>
    {glow ? <rect x={-34} y={-58} width={68} height={116} rx={18} fill="#bfe3ff" opacity={0.35} /> : null}
    {flash > 0 ? <circle cx={0} cy={-30} r={70} fill="#ffffff" opacity={0.85 * flash} /> : null}
    <rect x={-22} y={-40} width={44} height={80} rx={9} fill={INK} />
    <rect x={-17} y={-33} width={34} height={64} rx={4} fill={glow ? "#dff1ff" : "#3b4a63"} />
  </g>
);

/** A small flask of musk, gold and brown, its cap. */
const Musk: React.FC = () => (
  <g stroke={INK} strokeWidth={3.5} strokeLinejoin="round">
    <path d="M -12 -6 L 12 -6 L 15 26 Q 0 34 -15 26 Z" fill="#b8742a" />
    <rect x={-6} y={-18} width={12} height={12} rx={2} fill="#f2c66d" />
  </g>
);

/** A string of prayer beads hanging from the hand; `k` moves the beads along it. */
const Misbaha: React.FC<{ k: number }> = ({ k }) => (
  <g>
    {Array.from({ length: 11 }, (_, i) => {
      const a = (i / 11) * Math.PI * 2 + k;
      return <circle key={i} cx={Math.sin(a) * 18} cy={30 + Math.cos(a) * 26} r={6.5} fill="#7a3f2a" stroke={INK} strokeWidth={2.5} />;
    })}
    <path d="M 0 56 L 0 74" stroke="#7a3f2a" strokeWidth={5} strokeLinecap="round" />
  </g>
);

const Tray: React.FC<{ cup?: boolean }> = ({ cup = true }) => (
  <g stroke={INK} strokeWidth={4} strokeLinejoin="round">
    <ellipse cx={0} cy={0} rx={50} ry={10} fill="#c99a3e" />
    {cup ? (
      <g>
        <path d="M -14 -4 L -12 -36 L 12 -36 L 14 -4 Z" fill="#6b3d22" />
        <path d="M 12 -30 q 12 4 2 16" fill="none" />
      </g>
    ) : null}
  </g>
);

const Sandwich: React.FC = () => (
  <g stroke={INK} strokeWidth={3.5} strokeLinejoin="round">
    <path d="M -30 -8 Q 0 -22 30 -8 L 30 6 Q 0 16 -30 6 Z" fill="#e3b873" />
    <path d="M -26 -2 Q 0 -8 26 -2" stroke="#7a4a20" strokeWidth={5} fill="none" />
  </g>
);

const Coin: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <ellipse cx={x} cy={y} rx={13} ry={6} fill="#e8c35a" stroke={INK} strokeWidth={3} />
    <ellipse cx={x - 3} cy={y - 1} rx={4} ry={2} fill="#fff1b8" />
  </g>
);

/** Little four-pointed stars of gold around a point: the musk, the good that stays on you. `k`: how many, 0 to 1. */
const Sparkles: React.FC<{ x: number; y: number; k: number; t: number; spread?: number; seed?: number }> = ({ x, y, k, t, spread = 90, seed = 0 }) => (
  <g>
    {Array.from({ length: 14 }, (_, i) => {
      const on = k * 14 - i;
      if (on <= 0) return null;
      const a = chance(i, seed) * Math.PI * 2;
      const r = spread * (0.35 + 0.65 * chance(i, seed + 1));
      const rise = ((t * 0.6 + chance(i, seed + 2)) % 1) * 60;
      const cx = x + Math.cos(a) * r;
      const cy = y + Math.sin(a) * r * 0.7 - rise;
      const size = 7 + 9 * chance(i, seed + 3);
      const tw = 0.55 + 0.45 * Math.sin(t * 5 + i);
      return (
        <path key={i} d={`M ${cx} ${cy - size} L ${cx + size * 0.28} ${cy - size * 0.28} L ${cx + size} ${cy} L ${cx + size * 0.28} ${cy + size * 0.28} L ${cx} ${cy + size} L ${cx - size * 0.28} ${cy + size * 0.28} L ${cx - size} ${cy} L ${cx - size * 0.28} ${cy - size * 0.28} Z`}
          fill={GOLD} opacity={Math.min(1, on) * tw} />
      );
    })}
  </g>
);

/** Grey puffs of smoke that stay around someone: the smell he leaves with. `k`: how thick, 0 to 1. */
const Fumes: React.FC<{ x: number; y: number; k: number; t: number; seed?: number }> = ({ x, y, k, t, seed = 0 }) => (
  <g opacity={0.75 * k}>
    {Array.from({ length: 7 }, (_, i) => {
      const a = chance(i, seed) * Math.PI * 2 + t * 0.4;
      const r = 70 * (0.4 + 0.6 * chance(i, seed + 1));
      return <circle key={i} cx={x + Math.cos(a) * r} cy={y + Math.sin(a) * r * 0.6 - 20} r={(18 + 16 * chance(i, seed + 2)) * (0.6 + 0.4 * k)} fill="#8d9097" />;
    })}
    {[0, 1, 2].map((i) => (
      <path key={`w${i}`} d={`M ${x - 50 + i * 50} ${y - 90} q 14 -20 0 -40 q -14 -20 0 -40`} stroke="#7d8270" strokeWidth={5} fill="none" strokeLinecap="round"
        transform={`translate(0 ${-((t * 30 + i * 20) % 30)})`} />
    ))}
  </g>
);

const chance = (i: number, salt = 0) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** A speech bubble with our words in it, its tail towards the one who speaks; `k` makes it pop in (0 to 1). */
const Bubble: React.FC<{ x: number; y: number; text: string; k: number; tail?: number; size?: number }> = ({ x, y, text, k, tail = -1, size = 46 }) => {
  if (k <= 0) return null;
  const w = Math.max(150, text.length * size * 0.46 + 60);
  const h = size * 1.7;
  const s = Math.min(1, 0.4 + 0.6 * k + 0.12 * Math.sin(Math.PI * Math.min(1, k)));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, k * 2)}>
      <path d={`M ${-w / 2 + 18} ${-h / 2} L ${w / 2 - 18} ${-h / 2} Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 18} L ${w / 2} ${h / 2 - 18} Q ${w / 2} ${h / 2} ${w / 2 - 18} ${h / 2}
        L ${tail * 20 + 16} ${h / 2} L ${tail * 46} ${h / 2 + 34} L ${tail * 20 - 16} ${h / 2} L ${-w / 2 + 18} ${h / 2} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 18} L ${-w / 2} ${-h / 2 + 18} Q ${-w / 2} ${-h / 2} ${-w / 2 + 18} ${-h / 2} Z`}
        fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={size} fill={INK} style={{ direction: "rtl" }}>{text}</text>
    </g>
  );
};

/** A jagged bubble of shouting: signs, never words. */
const Burst: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => {
  if (k <= 0) return null;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 ? 46 : 74;
    return `${(Math.cos(a) * r * 1.3).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.min(1, 0.5 + 0.5 * k)})`} opacity={Math.min(1, k * 2)}>
      <path d={`M ${pts.join(" L ")} Z`} fill="#ffdf6b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <text x={0} y={14} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={40} fill="#c0392b">#@!</text>
    </g>
  );
};

/** A small bubble with a heart: a thank-you without a word. */
const Heart: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => {
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.min(1, 0.4 + 0.6 * k)})`} opacity={Math.min(1, k * 2)}>
      <ellipse cx={0} cy={0} rx={52} ry={42} fill="#ffffff" stroke={INK} strokeWidth={5} />
      <path d="M -20 46 L -30 66 L -2 42" fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 0 20 C -40 -6 -26 -34 0 -16 C 26 -34 40 -6 0 20 Z" fill="#e0533f" stroke={INK} strokeWidth={4} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------- the sets

const AHWA = { floor: 1400, seat: 1222, left: 300, right: 790 };

/** The ahwa in the evening: the green wall, the mirror, the arched door on the street, the lantern, the table, two
 * chairs. `glasses`: the tea on the table; `night`: the lights lower (the hadith and the verse are said there). */
const AhwaSet: React.FC<{ glasses?: boolean; night?: number; t?: number }> = ({ glasses = true, night = 0, t = 0 }) => {
  const { floor, seat } = AHWA;
  return (
    <g>
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
      <path d="M 760 1170 L 760 640 Q 760 520 900 520 Q 1040 520 1040 640 L 1040 1170 Z" fill="url(#ahwa-street)" stroke="#c99a3e" strokeWidth={10} />
      <rect x={780} y={930} width={240} height={240} fill="#2a1f3a" />
      <rect x={800} y={960} width={200} height={150} fill="#ffcf7a" opacity={0.8 - 0.4 * night} />
      <path d="M 790 930 L 1010 930 L 1000 960 L 800 960 Z" fill="#d9493b" opacity={0.85} />
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={810 + i * 48} cy={600 + (i % 2) * 40} r={3} fill="#fff6dd" opacity={0.5 + 0.4 * Math.sin(t * 2 + i)} />)}
      <rect x={70} y={560} width={250} height={380} rx={30} fill="#2d4f60" stroke="#c99a3e" strokeWidth={14} />
      <path d="M 110 600 L 200 600 L 110 760 Z" fill="#7fa4b5" opacity={0.35} />
      <rect x={0} y={1110} width={W} height={floor - 1110} fill="url(#ahwa-tiles)" />
      <rect x={0} y={1100} width={W} height={14} fill="#c99a3e" />
      <rect x={0} y={floor} width={W} height={H - floor} fill="url(#ahwa-floor)" />
      <rect x={0} y={floor} width={W} height={10} fill={INK} opacity={0.6} />
      <Fanoos x={540} y={600} />
      <path d="M 540 1170 L 540 1390 M 490 1396 L 590 1396" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d="M 540 1170 L 540 1390 M 490 1396 L 590 1396" stroke="#c99a3e" strokeWidth={10} strokeLinecap="round" />
      <ellipse cx={540} cy={1166} rx={130} ry={22} fill="#d9ab4f" stroke={INK} strokeWidth={7} />
      {glasses ? <TeaGlass x={490} y={1160} /> : null}
      {glasses ? <TeaGlass x={596} y={1162} /> : null}
      <AhwaChair x={AHWA.left} seat={seat} floor={floor} facing={1} />
      <AhwaChair x={AHWA.right} seat={seat} floor={floor} facing={-1} />
      {night > 0 ? <rect width={W} height={H} fill="#050914" opacity={0.35 * night} /> : null}
    </g>
  );
};

const BUS = { floor: 1420, stand: 1220 };

/** The bus stop in the morning: the sky, the city behind, the pavement, the shelter and its bench, the sign. `poster`:
 * the « مطلوب » on the shelter; `cart`: the foul cart at the edge (its own scene draws it nearer). */
const BusStopSet: React.FC<{ poster?: boolean; cart?: boolean; t?: number }> = ({ poster = false, cart = true, t = 0 }) => {
  const { floor } = BUS;
  return (
    <g>
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
      <circle cx={170} cy={760} r={250 + 10 * Math.sin(t * 0.8)} fill="url(#sun)" />
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
      <rect x={0} y={floor} width={W} height={H - floor} fill="#d9c7a8" />
      <rect x={0} y={floor + 120} width={W} height={H - floor - 120} fill="#4a4f5a" />
      <rect x={0} y={floor + 112} width={W} height={16} fill="#e9e3d6" stroke={INK} strokeWidth={4} />
      {cart ? (
        <g stroke={INK} strokeWidth={6} strokeLinejoin="round">
          <rect x={-40} y={1170} width={200} height={150} rx={10} fill="#3f8a5a" />
          <circle cx={30} cy={1360} r={46} fill="#5a4636" />
          <circle cx={30} cy={1360} r={14} fill="#c99a3e" />
          <path d="M 20 1170 Q 20 1060 80 1050 Q 140 1060 140 1170 Z" fill="#c8813e" />
          <path d="M 64 1050 L 96 1050 L 92 1028 L 68 1028 Z" fill="#a8652d" />
        </g>
      ) : null}
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
      {poster ? <Poster /> : null}
    </g>
  );
};

/** « مطلوب » on the shelter: its lines and the tabs to tear off. */
const Poster: React.FC = () => (
  <g transform="rotate(-3 740 965)">
    <rect x={640} y={840} width={200} height={250} fill="#fffdf6" stroke={INK} strokeWidth={5} />
    <text x={740} y={915} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={50} fill="#c0392b">مطلوب</text>
    <g fill="#9aa3ad">
      <rect x={670} y={940} width={140} height={10} rx={5} />
      <rect x={680} y={964} width={120} height={10} rx={5} />
      <rect x={670} y={988} width={140} height={10} rx={5} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={652 + i * 31} y={1040} width={22} height={44} fill="#e8e4d6" stroke={INK} strokeWidth={2} />)}
    </g>
  </g>
);

/** The foul cart, near: the big copper pot, the bread, and what is left on its board. */
const FoulCart: React.FC<{ x: number; left: number }> = ({ x, left }) => (
  <g stroke={INK} strokeWidth={6} strokeLinejoin="round">
    <rect x={x - 150} y={1150} width={300} height={170} rx={12} fill="#3f8a5a" />
    <rect x={x - 160} y={1132} width={320} height={26} rx={6} fill="#c99a3e" />
    <circle cx={x - 90} cy={1362} r={50} fill="#5a4636" />
    <circle cx={x - 90} cy={1362} r={15} fill="#c99a3e" />
    <path d={`M ${x - 120} 1132 Q ${x - 120} 1010 ${x - 50} 1000 Q ${x + 20} 1010 ${x + 20} 1132 Z`} fill="#c8813e" />
    <path d={`M ${x - 66} 1000 L ${x - 34} 1000 L ${x - 38} 976 L ${x - 62} 976 Z`} fill="#a8652d" />
    {left >= 1 ? <g transform={`translate(${x + 70} 1118)`}><Sandwich /></g> : null}
    {left >= 2 ? <g transform={`translate(${x + 120} 1112)`}><Sandwich /></g> : null}
  </g>
);

/** A city bus seen from the side, its door open in the middle, its number on its front. (x): its front. */
const Bus: React.FC<{ x: number; facing?: number; rider?: Face | null }> = ({ x, facing = -1, rider = null }) => (
  <g transform={`translate(${x} 0) scale(${facing === -1 ? 1 : -1} 1)`} stroke={INK} strokeLinejoin="round">
    <rect x={0} y={900} width={760} height={420} rx={30} fill="#f4f1e8" strokeWidth={7} />
    <rect x={0} y={1180} width={760} height={60} fill="#2f6f9e" strokeWidth={0} />
    <rect x={40} y={960} width={150} height={150} rx={10} fill="#bfe0ef" strokeWidth={5} />
    {[0, 1, 2].map((i) => <rect key={i} x={330 + i * 140} y={960} width={120} height={150} rx={10} fill="#bfe0ef" strokeWidth={5} />)}
    <rect x={215} y={960} width={90} height={330} rx={6} fill="#5d6b7a" strokeWidth={5} />
    <rect x={14} y={918} width={90} height={34} rx={6} fill={INK} strokeWidth={0} />
    <text x={59} y={946} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={28} fill="#ffcf3a" stroke="none">7</text>
    <circle cx={150} cy={1325} r={52} fill="#2b2b33" strokeWidth={6} />
    <circle cx={620} cy={1325} r={52} fill="#2b2b33" strokeWidth={6} />
    <circle cx={150} cy={1325} r={18} fill="#9aa3ad" strokeWidth={4} />
    <circle cx={620} cy={1325} r={18} fill="#9aa3ad" strokeWidth={4} />
    {rider ? (
      <g transform="translate(400 1040)">
        <circle cx={0} cy={0} r={46} fill={WHITE} stroke={INK} strokeWidth={6} />
        <g transform="scale(-1 1)"><FaceMarks face={rider} /></g>
        <path d="M -30 46 Q 0 60 30 46" stroke={SCARF} strokeWidth={16} fill="none" strokeLinecap="round" />
      </g>
    ) : null}
  </g>
);

const KIOSK = { floor: 1420, stand: 1218, counter: 640 };

/** The kiosk at nightfall: its striped awning, its lit window full of packets, its counter, the shopkeeper behind
 * it, the street lamp on the left. */
const KioskSet: React.FC<{ keeper?: Face; t?: number; dark?: number }> = ({ keeper = "neutral", t = 0, dark = 0 }) => {
  const { floor } = KIOSK;
  const colors = ["#e85d4a", "#f2c94c", "#3fa36b", "#3d7cc9", "#e88a3a", "#b05fc2", "#f07fa0", "#4cc3c9"];
  return (
    <g>
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
      {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={chance(i, 3) * W} cy={60 + chance(i, 4) * 560} r={1.5 + 2 * chance(i, 5)} fill="#e8eefc" opacity={(0.3 + 0.5 * dark) * (0.6 + 0.4 * Math.sin(t * 1.5 + i))} />)}
      <rect x={0} y={700} width={W} height={720} fill="#262b48" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={40 + i * 120} y={760} width={70} height={100} rx={6} fill="#ffcf7a" opacity={i === 2 ? 0.08 : 0.22} />)}
      <ellipse cx={150} cy={floor + 40} rx={300} ry={90} fill="url(#lamp-pool)" />
      <path d="M 60 1420 L 60 620 Q 60 580 110 580 L 160 580" stroke={INK} strokeWidth={14} fill="none" />
      <path d="M 140 572 L 200 572 L 190 600 L 150 600 Z" fill="#ffe2a8" stroke={INK} strokeWidth={5} />
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
      <Stick x={900} y={1250} pose={{ ...POSES.stand, head: -4 }} facing={-1} tone="white" face={keeper} cap="#3d7cc9" />
      <rect x={560} y={1170} width={500} height={250} fill="#c46a3c" stroke={INK} strokeWidth={7} />
      <path d="M 560 1230 L 1060 1230" stroke="#9e522c" strokeWidth={6} />
      <rect x={0} y={floor} width={W} height={H - floor} fill="#3b3a4a" />
      <path d={Array.from({ length: 9 }, (_, i) => `M ${i * 130} ${floor} L ${i * 130 - 60} ${H}`).join(" ")} stroke="#2c2b38" strokeWidth={4} />
      <rect x={0} y={floor} width={W} height={10} fill={INK} opacity={0.6} />
      {dark > 0 ? <rect width={W} height={H} fill="#050914" opacity={0.3 * dark} /> : null}
    </g>
  );
};

// ------------------------------------------------------------------------------------------- the style stills

const SEATED: Pose = { torso: -4, head: 0, armF: [30, 50], armB: [14, 30], legF: [84, -84], legB: [78, -80] };

const JalisStyle: React.FC = () => (
  <AbsoluteFill style={{ background: "#132623" }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <AhwaSet />
      <JBad1 u={4.2} t={4.2} />
    </svg>
    <Label ar="جليس السوء" en="A bad companion" tone="grey" />
  </AbsoluteFill>
);

const YuhibbStyle: React.FC = () => (
  <AbsoluteFill style={{ background: "#a9cbe6" }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <BusStopSet poster />
      <YGood2 u={4.6} t={4.6} />
    </svg>
    <Label ar="بيحب لك زي نفسه" en="Loves for you as for himself" tone="white" />
  </AbsoluteFill>
);

const NasrStyle: React.FC = () => (
  <AbsoluteFill style={{ background: "#1b1f3a" }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <KioskSet />
      <NGood2 u={3.0} t={3.0} />
    </svg>
    <Label ar="بينصرك" en="Truly helps you" tone="white" />
  </AbsoluteFill>
);

export type SahibStyleProps = { shot: "jalis" | "yuhibb" | "nasr" };

/** One still per short, for the owner to judge the look before anything moves (validated on 2026-11-19). */
export const SahibStyle: React.FC<SahibStyleProps> = ({ shot }) => (shot === "jalis" ? <JalisStyle /> : shot === "yuhibb" ? <YuhibbStyle /> : <NasrStyle />);

// ---------------------------------------------------------------------------------------------- the moments
// Each moment is drawn at `u`, the seconds since its scene started (6 s: tools/trial/prepare.py, `pause`), and `t`,
// the video's clock (for what never stops: smoke, sparkles, steam).

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
/** 0 before `a`, 1 after `b`, eased between. */
const ramp = (u: number, a: number, b: number) => interpolate(u, [a, b], [0, 1], { ...CLAMP, easing: ease });
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lp = (a: P2, b: P2, k: number): P2 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
type Moment = React.FC<{ u: number; t: number }>;

/** Where a figure walks: from `a` to `b` between `u0` and `u1`, its legs in step while it moves. */
const walking = (u: number, u0: number, u1: number, a: number, b: number, rest: Pose = POSES.stand) => {
  const k = interpolate(u, [u0, u1], [0, 1], CLAMP);
  const moving = u > u0 && u < u1;
  const x = lerp(a, b, k);
  return { x, pose: moving ? { ...walk(Math.abs(x - a) / 30), torso: 6 } : rest };
};

// -- 1. الجليس, the ahwa ---------------------------------------------------------------------------------------

const MOUTH_L: P2 = [300, 1006];       // the left companion's mouth, seated
const WRIST_R: P2 = [668, 1120];       // the hero's wrist held out over the table
const SCARF_R: P2 = [705, 1106];       // the hole in the hero's scarf, leaning to look at it

const heroSeated = (lean: number, extra: Partial<StickProps> = {}) => (
  <Stick x={AHWA.right} y={AHWA.seat - 22} pose={{ ...SEATED, torso: lerp(-2, 14, lean), head: lerp(0, -16, lean) }} facing={-1} tone="white" scarf {...extra} />
);

/** The grey companion: his shisha, the coal that jumps onto the hero's scarf; he shrugs. */
const JBad1: Moment = ({ u, t }) => {
  const hop = ramp(u, 1.8, 2.4);
  const burnt = u >= 2.4;
  const shock = ramp(u, 2.4, 2.8);
  const coal = (() => {
    const p0: P2 = [150, 918];
    const c: P2 = [430, 600];
    const p1: P2 = SCARF_R;
    const m = (a: number, b: number, d: number) => (1 - hop) * (1 - hop) * a + 2 * (1 - hop) * hop * b + hop * hop * d;
    return [m(p0[0], c[0], p1[0]), m(p0[1], c[1], p1[1])] as P2;
  })();
  const shrug = ramp(u, 2.8, 3.4);
  return (
    <g>
      <Shisha x={150} floor={AHWA.floor + 6} bowl={930} />
      <path d={`M 168 1110 C 230 1190 290 1080 ${lerp(304, 330, shrug)} ${lerp(1004, 1080, shrug)}`} stroke={INK} strokeWidth={18} fill="none" strokeLinecap="round" />
      <path d={`M 168 1110 C 230 1190 290 1080 ${lerp(304, 330, shrug)} ${lerp(1004, 1080, shrug)}`} stroke="#7a2f3a" strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray="10 7" />
      <Stick x={AHWA.left} y={AHWA.seat - 22} pose={{ ...SEATED, torso: -10, head: 12 }} facing={1} tone="grey" face={u < 2.6 ? "puff" : "smirk"}
        handF={lp(MOUTH_L, [330, 1080], shrug)} bendF={1} handB={lp([250, 1120], [222, 1040], shrug)} bendB={-1} />
      <g opacity={ramp(u, 0.2, 0.8) * (1 - 0.5 * ramp(u, 3.5, 6))}>
        <Smoke x={lerp(330, 430, ramp(u, 0.2, 2.2))} y={930} k={lerp(0.5, 1.1, ramp(u, 0.2, 2.2))} o={0.6} />
        <Smoke x={lerp(420, 600, ramp(u, 0.8, 2.6))} y={890} k={0.9} o={0.45 * ramp(u, 0.8, 1.4)} />
      </g>
      {hop > 0 && hop < 1 ? (
        <g>
          <circle cx={coal[0]} cy={coal[1]} r={14} fill="#ff8a3d" stroke="#3a1a0e" strokeWidth={4} />
          <circle cx={coal[0]} cy={coal[1]} r={26} fill="#ff8a3d" opacity={0.3} />
        </g>
      ) : null}
      {heroSeated(shock, { face: burnt ? "shock" : "neutral", burn: burnt, handF: burnt ? lp([600, 1150], [736, 1062], shock) : [600, 1150], bendF: -1 })}
      {burnt ? (
        <g opacity={ramp(u, 2.4, 2.8)}>
          <path d={`M ${SCARF_R[0] + 40} ${SCARF_R[1] - 96} q -14 -24 0 -46 q 14 -22 0 -46`} stroke="#cfd2d8" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.75}
            transform={`translate(0 ${-((t * 40) % 30)})`} />
          <Fumes x={790} y={960} k={ramp(u, 3.0, 5.0)} t={t} seed={1} />
        </g>
      ) : null}
    </g>
  );
};

/** The white companion: a drop of musk on the hero's wrist; the hero smells it. */
const JGood1: Moment = ({ u, t }) => {
  const out = ramp(u, 0.3, 1.2);
  const across = ramp(u, 1.4, 2.4);
  const back = ramp(u, 3.0, 3.8);
  const hold = ramp(u, 1.0, 1.8) * (1 - back);
  const sniff = ramp(u, 3.2, 4.0);
  const friendHand = across > 0 ? lp([360, 1060], [WRIST_R[0] - 18, WRIST_R[1] - 26], across * (1 - back)) : lp([330, 1170], [360, 1060], out);
  return (
    <g>
      <Stick x={AHWA.left} y={AHWA.seat - 22} pose={{ ...SEATED, torso: lerp(-4, 10, across * (1 - back)), head: 4 }} facing={1} tone="white" face="smile"
        handF={friendHand} bendF={1} heldF={out > 0.6 ? <Musk /> : null} />
      {heroSeated(0, { face: sniff > 0.5 ? "happy" : across > 0.5 ? "smile" : "neutral", handF: sniff > 0 ? lp(WRIST_R, [742, 1000], sniff) : lp([600, 1150], WRIST_R, hold), bendF: -1 })}
      <Sparkles x={lerp(WRIST_R[0], 760, sniff)} y={lerp(WRIST_R[1] - 20, 980, sniff)} k={ramp(u, 2.5, 4.5)} t={t} spread={lerp(40, 110, ramp(u, 2.5, 5))} seed={2} />
    </g>
  );
};

/** The ahwa's waiter, his tarboosh, his tray. */
const Waiter: React.FC<{ u: number; face: Face; leaveFace: Face }> = ({ u, face, leaveFace }) => {
  const come = walking(u, 0, 1.2, 1180, 900);
  const go = walking(u, 4.0, 6.0, 900, 1200);
  const leaving = u >= 4.0;
  const at = leaving ? go : come;
  return (
    <Stick x={at.x} y={AHWA.floor - 200} pose={at.pose} facing={leaving ? 1 : -1} tone="white" face={leaving ? leaveFace : face} cap="#9b2c2c"
      handF={[at.x + (leaving ? 70 : -70), 1110]} bendF={-1} heldF={<Tray cup={u < 1.4 || u > 6} />} />
  );
};

const wrongCup = (u: number) => (u >= 1.4 ? (
  <g transform="translate(640 1150)" stroke={INK} strokeWidth={4} strokeLinejoin="round">
    <path d="M -14 -4 L -12 -36 L 12 -36 L 14 -4 Z" fill="#6b3d22" />
  </g>
) : null);

/** The waiter brings the wrong cup; the grey companion shouts at him, and the hero does the same: the smoke is his. */
const JBad2: Moment = ({ u, t }) => {
  const shout = u > 1.6 && u < 2.8;
  const copy = u > 2.8 && u < 3.8;
  return (
    <g>
      <Shisha x={150} floor={AHWA.floor + 6} bowl={930} />
      {wrongCup(u)}
      <Stick x={AHWA.left} y={AHWA.seat - 22} pose={{ ...SEATED, torso: shout ? 12 : -6, head: 8 }} facing={1} tone="grey" face={shout ? "angry" : u > 2.8 ? "smirk" : "neutral"}
        handF={shout ? [430, 1000] : [380, 1150]} bendF={1} />
      <Burst x={250} y={870} k={shout ? ramp(u, 1.6, 1.9) : 0} />
      {heroSeated(copy ? 0.3 : 0, { face: copy ? "angry" : u > 3.8 ? "worried" : "neutral", handF: copy ? [640, 1000] : [600, 1150], bendF: -1 })}
      <Burst x={830} y={850} k={copy ? ramp(u, 2.8, 3.1) : 0} />
      <Waiter u={u} face={u > 1.6 ? "worried" : "smile"} leaveFace="worried" />
      <Fumes x={790} y={940} k={ramp(u, 3.2, 4.4)} t={t} seed={3} />
    </g>
  );
};

/** The same mistake; the white companion thanks the waiter with a smile, and the hero does the same: the gold is his. */
const JGood2: Moment = ({ u, t }) => {
  const thank = u > 1.6 && u < 2.8;
  const copy = u > 2.8 && u < 3.8;
  return (
    <g>
      {wrongCup(u)}
      <Stick x={AHWA.left} y={AHWA.seat - 22} pose={{ ...SEATED, torso: 0, head: 10 }} facing={1} tone="white" face={u > 1.6 ? "smile" : "neutral"}
        handF={thank ? [420, 1040] : [380, 1150]} bendF={1} />
      <Heart x={260} y={880} k={thank ? ramp(u, 1.6, 1.9) : 0} />
      {heroSeated(0, { face: u > 2.8 ? "happy" : "neutral", handF: copy ? [660, 1040] : [600, 1150], bendF: -1 })}
      <Heart x={830} y={860} k={copy ? ramp(u, 2.8, 3.1) : 0} />
      <Waiter u={u} face={u > 1.6 ? "happy" : "smile"} leaveFace="happy" />
      <Sparkles x={790} y={980} k={ramp(u, 3.3, 5.0)} t={t} seed={4} />
    </g>
  );
};

/** The hero says nothing; the grey companion laughs at someone on his phone. The hero gets up and leaves in his smoke. */
const JBad3: Moment = ({ u, t }) => {
  const up = ramp(u, 4.0, 4.6);
  const leave = walking(u, 4.6, 6.0, AHWA.right, 1180);
  return (
    <g>
      <Shisha x={150} floor={AHWA.floor + 6} bowl={930} />
      <Stick x={AHWA.left} y={AHWA.seat - 22} pose={{ ...SEATED, torso: -14 + 4 * Math.sin(t * 9) * ramp(u, 0.6, 1), head: 14 }} facing={1} tone="grey" face={u > 0.6 ? "laugh" : "smile"}
        handF={[390, 1010]} bendF={1} heldF={<Phone glow r={-12} />} />
      {u > 0.8 ? (
        <g transform="translate(250 840)" opacity={ramp(u, 0.8, 1.2)}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={44} fill="#ffdf6b">ha ha</text>
        </g>
      ) : null}
      {up < 1 && u < 4.6 ? heroSeated(0.35, { face: "worried", handF: [600, 1150], bendF: -1 }) : (
        <Stick x={leave.x} y={AHWA.floor - 200} pose={leave.pose} facing={1} tone="white" face="worried" scarf />
      )}
      <Fumes x={u < 4.6 ? AHWA.right : leave.x} y={u < 4.6 ? 940 : 980} k={ramp(u, 1.4, 4.0)} t={t} seed={5} />
    </g>
  );
};

/** The hero says nothing; the white companion says his dhikr on his beads. The hero gets up and leaves in gold. */
const JGood3: Moment = ({ u, t }) => {
  const leave = walking(u, 4.6, 6.0, AHWA.right, 1180);
  return (
    <g>
      <Stick x={AHWA.left} y={AHWA.seat - 22} pose={{ ...SEATED, torso: -2, head: 4 }} facing={1} tone="white" face="calm" handF={[390, 1090]} bendF={1} heldF={<Misbaha k={t * 1.2} />} />
      {u < 4.6 ? heroSeated(0, { face: u > 2 ? "smile" : "neutral", handF: [600, 1150], bendF: -1 }) : (
        <Stick x={leave.x} y={AHWA.floor - 200} pose={leave.pose} facing={1} tone="white" face="happy" scarf />
      )}
      <Sparkles x={u < 4.6 ? AHWA.right : leave.x} y={980} k={ramp(u, 1.4, 4.0)} t={t} spread={110} seed={6} />
    </g>
  );
};

/** The two heroes side by side: the one in smoke, the one in gold. */
const JEnd: Moment = ({ t }) => (
  <g>
    <Stick x={380} y={AHWA.floor - 200} pose={POSES.stand} facing={1} tone="white" face="happy" scarf />
    <Sparkles x={380} y={1000} k={1} t={t} spread={120} seed={7} />
    <Stick x={720} y={AHWA.floor - 200} pose={POSES.stand} facing={-1} tone="white" face="worried" scarf burn />
    <Fumes x={720} y={960} k={1} t={t} seed={8} />
  </g>
);

/** The hadith is read: the table, the two glasses steaming, nobody. */
const JRead: Moment = ({ t }) => (
  <g>
    {[0, 1].map((i) => {
      const p = (t * 0.35 + i * 0.5) % 1;
      return <path key={i} d={`M ${494 + 104 * i} ${1100 - 80 * p} q 10 -14 0 -28 q -10 -14 0 -28`} stroke="#e9dcc0" strokeWidth={4} fill="none" opacity={0.45 * Math.sin(Math.PI * p)} />;
    })}
  </g>
);

const JALIS: Record<string, Moment> = { "j-bad-1": JBad1, "j-good-1": JGood1, "j-bad-2": JBad2, "j-good-2": JGood2, "j-bad-3": JBad3, "j-good-3": JGood3, "j-end": JEnd, "j-read": JRead };

// -- 2. زي ما تحب لنفسك, the bus stop ----------------------------------------------------------------------------

const CART_X = 230;

/** The two last sandwiches: the grey friend takes both for himself. */
const YBad1: Moment = ({ u }) => {
  const grab = ramp(u, 1.4, 2.2);
  const bite = u > 2.8;
  return (
    <g>
      <FoulCart x={CART_X} left={grab < 0.5 ? 2 : 0} />
      <Stick x={CART_X + 10} y={1236} s={1.2} pose={POSES.stand} facing={1} tone="white" face="neutral" cap="#e2d3a3" />
      <rect x={CART_X - 150} y={1150} width={300} height={170} rx={12} fill="#3f8a5a" stroke={INK} strokeWidth={6} />
      <Stick x={520} y={BUS.stand} pose={{ ...POSES.stand, torso: 6 * grab }} facing={-1} tone="grey" face={bite ? "happy" : grab > 0 ? "smirk" : "neutral"}
        handF={grab < 1 ? lp([480, 1250], [CART_X + 110, 1112], grab) : bite ? [470, 1010] : [470, 1120]} bendF={-1} heldF={grab > 0.5 ? <Sandwich /> : null}
        handB={grab > 0.5 ? [560, 1150] : undefined} heldB={grab > 0.5 ? <Sandwich /> : null} />
      <Stick x={720} y={BUS.stand} pose={POSES.stand} facing={-1} tone="white" face={grab > 0.5 ? "worried" : "neutral"} scarf handF={grab > 0.5 ? [640, 1130] : undefined} />
    </g>
  );
};

/** The same: the white friend takes both, and gives one to the hero. */
const YGood1: Moment = ({ u }) => {
  const grab = ramp(u, 1.4, 2.2);
  const give = ramp(u, 2.6, 3.2);
  const eat = u > 3.6;
  return (
    <g>
      <FoulCart x={CART_X} left={grab < 0.5 ? 2 : 0} />
      <Stick x={CART_X + 10} y={1236} s={1.2} pose={POSES.stand} facing={1} tone="white" face="smile" cap="#e2d3a3" />
      <rect x={CART_X - 150} y={1150} width={300} height={170} rx={12} fill="#3f8a5a" stroke={INK} strokeWidth={6} />
      <Stick x={520} y={BUS.stand} pose={POSES.stand} facing={-1} tone="white" face={grab > 0 ? "smile" : "neutral"}
        handF={grab < 1 ? lp([480, 1250], [CART_X + 110, 1112], grab) : eat ? [470, 1010] : [470, 1120]} bendF={-1} heldF={grab > 0.5 ? <Sandwich /> : null}
        handB={grab > 0.5 ? lp([560, 1150], [640, 1110], give) : undefined} heldB={grab > 0.5 && give < 0.95 ? <Sandwich /> : null} />
      <Stick x={720} y={BUS.stand} pose={POSES.stand} facing={-1} tone="white" face={give > 0.9 ? "happy" : "neutral"} scarf
        handF={give > 0.95 ? (eat ? [690, 1010] : [650, 1110]) : undefined} heldF={give > 0.95 ? <Sandwich /> : null} />
    </g>
  );
};

/** The poster « مطلوب »: the grey friend photographs it, then hides his phone behind his back. */
const YBad2: Moment = ({ u }) => {
  const shoot = ramp(u, 1.0, 2.0);
  const hide = ramp(u, 3.2, 3.9);
  return (
    <g>
      <Stick x={420} y={BUS.stand} pose={{ ...POSES.stand, head: 8 }} facing={1} tone="grey" face={hide > 0 ? "smirk" : "neutral"}
        handF={hide > 0.5 ? undefined : lp([470, 1150], [560, 965], shoot)} bendF={1}
        heldF={hide > 0.5 ? null : <Phone r={-8} flash={u > 2.6 && u < 2.9 ? 1 : 0} />}
        handB={hide > 0.5 ? [360, 1150] : undefined} heldB={hide > 0.5 ? <Phone r={20} /> : null} />
      <Stick x={880} y={BUS.stand} pose={{ ...POSES.stand, head: -14 }} facing={-1} tone="white" face="neutral" scarf handF={[810, 1100]} heldF={<Phone r={10} />} />
    </g>
  );
};

/** The same poster: the white friend photographs it and sends it; the hero's phone buzzes. */
const YGood2: Moment = ({ u }) => {
  const shoot = ramp(u, 0.8, 1.6);
  const ping = u > 3.4;
  const wob = ping ? Math.sin(u * 60) * 4 * (1 - ramp(u, 3.4, 4.4)) : 0;
  return (
    <g>
      <Stick x={420} y={BUS.stand} pose={{ ...POSES.stand, torso: 4, head: 8 }} facing={1} tone="white" face="smile"
        handF={lp([470, 1150], [560, 965], shoot)} bendF={1} handB={[430, 1060]} bendB={-1} heldF={<Phone r={-8} flash={u > 2.2 && u < 2.5 ? 1 : 0} />} />
      <Stick x={880 + wob} y={BUS.stand} pose={{ ...POSES.stand, torso: 6, head: ping ? -10 : -14 }} facing={-1} tone="white" face={ping ? "happy" : "neutral"} scarf
        handF={[800, 1085]} bendF={-1} heldF={<Phone glow={ping} r={10} />} />
      {ping ? <path d="M 760 1060 l -16 -10 M 756 1090 l -20 0 M 760 1120 l -16 10" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={1 - ramp(u, 4.4, 5)} /> : null}
      <Bubble x={900} y={790} text="شوف دي!" k={ramp(u, 3.6, 4.0)} tail={-1} />
    </g>
  );
};

/** The bus comes: the hero climbs into the wrong one; the grey friend saw it, and says nothing. */
const YBad3: Moment = ({ u }) => {
  const come = interpolate(u, [0.2, 2.0], [1150, 300], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const go = interpolate(u, [4.2, 6.0], [0, -900], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const board = ramp(u, 2.4, 3.4);
  return (
    <g>
      <Bus x={come + go} rider={u > 3.6 ? (u > 4.6 ? "worried" : "neutral") : null} />
      {board < 1 ? <Stick x={lerp(820, 600, board)} y={BUS.stand} pose={board > 0 && board < 1 ? walk(board * 6) : POSES.stand} facing={-1} tone="white" face="neutral" scarf /> : null}
      <Stick x={900} y={BUS.stand} pose={POSES.stand} facing={-1} tone="grey" face={u > 2.2 ? "smirk" : "neutral"} handF={u > 4.4 ? [820, 1000] : undefined} />
    </g>
  );
};

/** The same bus: the white friend stops the hero, « مش ده… ». */
const YGood3: Moment = ({ u }) => {
  const come = interpolate(u, [0.2, 2.0], [1150, 300], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const go = interpolate(u, [4.2, 6.0], [0, -900], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const step = ramp(u, 2.2, 2.8);
  const pull = ramp(u, 3.0, 3.6);
  const heroX = lerp(lerp(820, 740, step), 820, pull);
  return (
    <g>
      <Bus x={come + go} />
      <Stick x={heroX} y={BUS.stand} pose={step > 0 && pull < 1 ? walk(step * 4) : POSES.stand} facing={-1} tone="white" face={pull > 0.5 ? "smile" : "neutral"} scarf look={u > 2.8 && u < 4.2 ? -1 : 1}
        handB={u > 2.6 ? [heroX + 60, 1150] : undefined} bendB={1} />
      <Stick x={960} y={BUS.stand} pose={POSES.stand} facing={-1} tone="white" face="kind" handF={u > 2.6 ? [heroX + 66, 1142] : undefined} bendF={-1} />
      <Bubble x={850} y={820} text="مش ده…" k={ramp(u, 2.8, 3.2) * (1 - ramp(u, 5.2, 5.8))} tail={1} />
    </g>
  );
};

/** The two friends side by side at the stop. */
const YEnd: Moment = () => (
  <g>
    <Stick x={430} y={BUS.stand} pose={POSES.stand} facing={1} tone="white" face="smile" />
    <Stick x={700} y={BUS.stand} pose={POSES.stand} facing={-1} tone="white" face="smile" scarf />
  </g>
);

/** The bench, one seat left: the white friend gives it to the hero (59:9 is recited over it). */
const YBench: Moment = ({ u }) => {
  const sit = ramp(u, 1.0, 2.6);
  return (
    <g>
      <Stick x={930} y={1250} pose={SEATED} facing={-1} tone="white" face="neutral" cap="#6b7d8f" />
      <Stick x={lerp(640, 780, sit)} y={lerp(BUS.stand, 1250, sit)} pose={sit < 1 ? POSES.stand : SEATED} facing={-1} tone="white" face="happy" scarf />
      <Stick x={600} y={BUS.stand} pose={{ ...POSES.stand, torso: 6 * (1 - sit) }} facing={1} tone="white" face="smile" handF={sit < 1 ? [700, 1150] : undefined} bendF={1} />
    </g>
  );
};

const YUHIBB: Record<string, Moment> = { "y-bad-1": YBad1, "y-good-1": YGood1, "y-bad-2": YBad2, "y-good-2": YGood2, "y-bad-3": YBad3, "y-good-3": YGood3, "y-end": YEnd, "y-bench": YBench };

// -- 3. انصره ظالمًا, the kiosk ----------------------------------------------------------------------------------

const OLD = (x: number, face: Face) => (
  <Stick x={x} y={KIOSK.stand} pose={{ ...POSES.bent, armF: [34, 4] }} facing={1} tone="white" face={face} beard heldF={<path d="M 0 0 L 6 196" stroke="#6b4a2f" strokeWidth={12} strokeLinecap="round" />} />
);

/** Someone passes in front of the hero; the grey friend laughs and films. */
const NBad1: Moment = ({ u }) => {
  const cut = walking(u, 0.4, 2.0, -100, 640);
  const pushed = ramp(u, 1.6, 2.4);
  return (
    <g>
      <Stick x={lerp(640, 470, pushed)} y={KIOSK.stand} pose={POSES.stand} facing={1} tone="white" face={pushed > 0.5 ? "worried" : "neutral"} scarf look={pushed > 0.5 ? -1 : 1} />
      <Stick x={cut.x} y={KIOSK.stand} pose={cut.pose} facing={1} tone="white" face="neutral" cap="#2f6f9e" />
      <Stick x={230} y={KIOSK.stand} pose={{ ...POSES.stand, torso: -6 }} facing={1} tone="grey" face={u > 2.4 ? "laugh" : "neutral"}
        handF={u > 2.6 ? [300, 1000] : undefined} bendF={1} heldF={u > 2.6 ? <Phone r={-6} flash={u > 3.2 && u < 3.5 ? 1 : 0} /> : null} />
    </g>
  );
};

/** The same: the white friend steps in, « لو سمحت، الدور »; the man goes back to his place. */
const NGood1: Moment = ({ u }) => {
  const cut = walking(u, 0.4, 2.0, -100, 640);
  const pushed = ramp(u, 1.6, 2.2) * (1 - ramp(u, 3.4, 4.2));
  const back = ramp(u, 3.0, 4.2);
  const friend = ramp(u, 1.8, 2.4);
  return (
    <g>
      <Stick x={lerp(640, 470, pushed)} y={KIOSK.stand} pose={POSES.stand} facing={1} tone="white" face={back > 0.5 ? "smile" : pushed > 0.5 ? "worried" : "neutral"} scarf />
      <Stick x={u < 3.0 ? cut.x : lerp(640, 300, back)} y={KIOSK.stand} pose={u < 3.0 ? cut.pose : back > 0 && back < 1 ? walk(back * 6) : POSES.stand} facing={u < 3.0 ? 1 : -1} tone="white" face={back > 0 ? "worried" : "neutral"} cap="#2f6f9e" />
      <Stick x={lerp(230, 380, friend)} y={KIOSK.stand} pose={POSES.stand} facing={1} tone="white" face="kind" handF={friend > 0.5 && back < 0.5 ? [520, 1060] : undefined} bendF={1} />
      <Bubble x={360} y={860} text="لو سمحت، الدور" k={ramp(u, 2.4, 2.8) * (1 - ramp(u, 4.6, 5.2))} tail={-1} size={42} />
    </g>
  );
};

/** The hero passes in front of an old man, pushed by the grey friend: « ادخل! ». */
const NBad2: Moment = ({ u }) => {
  const cut = walking(u, 2.6, 3.6, 450, 760);
  return (
    <g>
      {OLD(600, u > 3.4 ? "worried" : "neutral")}
      <Stick x={cut.x} y={KIOSK.stand} pose={cut.pose} facing={1} tone="white" face={u > 3.6 ? "smirk" : "neutral"} scarf />
      <Stick x={lerp(250, 380, ramp(u, 2.2, 3.2))} y={KIOSK.stand} pose={{ ...POSES.stand, torso: 12 * ramp(u, 2.2, 2.8) }} facing={1} tone="grey" face={u > 2.2 ? "laugh" : "smirk"}
        handF={u > 2.2 && u < 3.4 ? [cut.x - 50, 1080] : undefined} bendF={1} />
      <Bubble x={300} y={880} text="ادخل!" k={ramp(u, 2.4, 2.8) * (1 - ramp(u, 4.8, 5.4))} tail={-1} />
    </g>
  );
};

/** The same: the white friend takes the hero's hand and brings him back behind the old man. */
const NGood2: Moment = ({ u }) => {
  const step = ramp(u, 1.0, 2.2);
  const back = ramp(u, 3.2, 4.4);
  const heroX = lerp(lerp(330, 420, step), 330, back);
  const hand: P2 = [heroX - 128, 1188];
  const held = u > 2.4 && u < 4.6;
  return (
    <g>
      {OLD(600, u > 4.4 ? "smile" : "neutral")}
      <Stick x={heroX} y={KIOSK.stand} pose={step > 0 && step < 1 ? POSES.stride : back > 0 && back < 1 ? walk(back * 5) : POSES.stand} facing={1} tone="white" face={held ? "shock" : u > 4.6 ? "smile" : "neutral"} scarf
        look={held ? -1 : 1} handB={held ? hand : undefined} bendB={1} />
      <Stick x={150} y={KIOSK.stand} pose={{ ...POSES.stand, torso: -6, head: 6, legF: [16, -6], legB: [-14, -4] }} facing={1} tone="white" face="kind"
        handF={held ? [hand[0] - 6, hand[1] - 8] : undefined} bendF={1} />
      {held ? <circle cx={hand[0] - 2} cy={hand[1] - 4} r={20} fill="none" stroke="#ffe7a3" strokeWidth={4} opacity={0.75 * ramp(u, 2.4, 2.7)} /> : null}
    </g>
  );
};

const changeOnCounter = (u: number, taken: number) => (u > 1.6 && taken < 1 ? (
  <g opacity={1 - taken}>
    {[0, 1, 2, 3, 4].map((i) => <Coin key={i} x={700 + i * 22} y={1166 - (i % 2) * 6} />)}
  </g>
) : null);

/** The shopkeeper gives too much change: « اجري! », and the hero runs off with it. */
const NBad3: Moment = ({ u }) => {
  const run = walking(u, 3.4, 5.4, 640, -120);
  return (
    <g>
      {changeOnCounter(u, ramp(u, 2.6, 3.0))}
      <Stick x={run.x} y={KIOSK.stand} pose={run.pose} facing={u > 3.4 ? -1 : 1} tone="white" face={u > 3.2 ? "laugh" : u > 1.8 ? "shock" : "neutral"} scarf
        handF={u > 2.6 ? [run.x + (u > 3.4 ? -70 : 70), 1110] : undefined} heldF={u > 2.8 ? <Coin x={0} y={0} /> : null} />
      <Stick x={300} y={KIOSK.stand} pose={POSES.stand} facing={1} tone="grey" face={u > 2.8 ? "laugh" : "neutral"} handF={u > 2.8 && u < 4.6 ? [400, 1000] : undefined} bendF={1} />
      <Bubble x={300} y={880} text="اجري!" k={ramp(u, 2.9, 3.2) * (1 - ramp(u, 4.8, 5.4))} tail={-1} />
    </g>
  );
};

/** The same: the white friend holds the hero's hand, and the hero gives the money back. */
const NGood3: Moment = ({ u }) => {
  const turn = u > 2.2 && u < 3.0;
  const held = u > 2.6 && u < 3.6;
  const give = ramp(u, 3.6, 4.2);
  const hand: P2 = [560, 1150];
  return (
    <g>
      {changeOnCounter(u, ramp(u, 2.0, 2.3) * (1 - give))}
      <Stick x={640} y={KIOSK.stand} pose={turn ? POSES.stride : POSES.stand} facing={u > 2.0 && u < 3.6 ? -1 : 1} tone="white" face={held ? "shock" : give > 0.5 ? "smile" : "neutral"} scarf
        handF={u > 2.0 && u < 3.6 ? hand : give > 0 ? lp([700, 1150], [720, 1160], give) : undefined} bendF={-1} heldF={u > 2.0 && give < 0.8 ? <Coin x={0} y={0} /> : null} />
      <Stick x={420} y={KIOSK.stand} pose={POSES.stand} facing={1} tone="white" face="kind" handF={held ? [hand[0] + 6, hand[1] - 8] : undefined} bendF={1} />
      {held ? <circle cx={hand[0]} cy={hand[1] - 4} r={20} fill="none" stroke="#ffe7a3" strokeWidth={4} opacity={0.75} /> : null}
      {give > 0.6 ? <g opacity={1 - ramp(u, 5.2, 5.8)}>{[0, 1, 2, 3, 4].map((i) => <Coin key={i} x={760 + i * 22} y={1166 - (i % 2) * 6} />)}</g> : null}
    </g>
  );
};

/** The two friends side by side by the kiosk. */
const NEnd: Moment = () => (
  <g>
    <Stick x={330} y={KIOSK.stand} pose={POSES.stand} facing={1} tone="white" face="kind" />
    <Stick x={520} y={KIOSK.stand} pose={POSES.stand} facing={-1} tone="white" face="smile" scarf />
  </g>
);

/** The hadith is read: the hand over the hand, near. */
const NRead: Moment = ({ t }) => (
  <g>
    <rect width={W} height={H} fill="#141836" opacity={0.55} />
    <g transform="translate(540 1150)">
      <circle cx={0} cy={0} r={220 + 8 * Math.sin(t * 1.4)} fill="#ffe7a3" opacity={0.12} />
      <path d="M -520 120 L -40 20" stroke={INK} strokeWidth={98} strokeLinecap="round" />
      <path d="M -520 120 L -40 20" stroke={WHITE} strokeWidth={84} strokeLinecap="round" />
      <path d="M 560 220 L 60 60" stroke={INK} strokeWidth={98} strokeLinecap="round" />
      <path d="M 560 220 L 60 60" stroke={WHITE} strokeWidth={84} strokeLinecap="round" />
      <path d="M 300 136 Q 240 110 270 160" stroke={SCARF} strokeWidth={30} fill="none" strokeLinecap="round" opacity={0.9} />
      <circle cx={-30} cy={22} r={62} fill={WHITE} stroke={INK} strokeWidth={8} />
      <circle cx={20} cy={-24} r={64} fill={WHITE} stroke={INK} strokeWidth={8} />
      <circle cx={20} cy={-24} r={92} fill="none" stroke="#ffe7a3" strokeWidth={6} opacity={0.6 + 0.2 * Math.sin(t * 2)} />
    </g>
  </g>
);

/** The verse: night has come, the two friends walk away side by side. */
const NNight: Moment = ({ u }) => {
  const x = lerp(260, 820, interpolate(u, [0, 30], [0, 1], CLAMP));
  const phase = (x - 260) / 30;
  return (
    <g>
      <Stick x={x} y={KIOSK.stand + 40} s={1.05} pose={walk(phase)} facing={1} tone="white" face="smile" />
      <Stick x={x - 150} y={KIOSK.stand + 40} s={1.05} pose={walk(phase + 1.5)} facing={1} tone="white" face="smile" scarf />
    </g>
  );
};

const NASR: Record<string, Moment> = { "n-bad-1": NBad1, "n-good-1": NGood1, "n-bad-2": NBad2, "n-good-2": NGood2, "n-bad-3": NBad3, "n-good-3": NGood3, "n-end": NEnd, "n-read": NRead, "n-night": NNight };

// ------------------------------------------------------------------------------------------ pictures and labels

/** On a cover every scene starts at the same time (Cover.tsx: `since` is 0 and `t` is 2): each moment is then drawn at
 * the second that tells it best. */
const COVER_AT: Record<string, number> = { "j-bad-1": 4.2, "y-good-2": 4.6, "n-good-2": 3.0 };

const picture = (set: (t: number, show: (id: string) => number) => React.ReactNode, moments: Record<string, Moment>): Drawn => ({ t, show, since }) => {
  const ids = Object.keys(moments);
  const cover = since(ids[0]) === since(ids[ids.length - 1]);
  return (
    <>
      {set(t, show)}
      {ids.map((id) => {
        const o = show(id);
        if (o <= 0.001) return null;
        const M = moments[id];
        const u = cover ? COVER_AT[id] ?? 4 : t - since(id);
        return <g key={id} opacity={o}><M u={u} t={t} /></g>;
      })}
    </>
  );
};

const JalisPicture = picture((t, show) => <AhwaSet t={t} night={show("j-night")} glasses={show("j-bad-2") + show("j-good-2") < 0.5} />, JALIS);
const YuhibbPicture = picture((t, show) => <BusStopSet t={t} poster={show("y-bad-2") + show("y-good-2") + show("y-read") > 0.01} cart={show("y-bad-1") + show("y-good-1") < 0.99} />, YUHIBB);
const NasrPicture = picture((t, show) => <KioskSet t={t} dark={show("n-night")} keeper={show("n-good-3") > 0.5 ? "smile" : "neutral"} />, NASR);

export const SAHIB_PICTURES: Record<string, Drawn> = { jalis: JalisPicture, yuhibb: YuhibbPicture, nasr: NasrPicture };

/** The label of each moment (above the veil, under the texts): which friend this is, the colour of his figure. */
const LABELS: Record<string, { ar: string; en: string; tone: "white" | "grey"; ids: string[] }[]> = {
  jalis: [
    { ar: "جليس السوء", en: "A bad companion", tone: "grey", ids: ["j-bad-1", "j-bad-2", "j-bad-3"] },
    { ar: "الجليس الصالح", en: "A good companion", tone: "white", ids: ["j-good-1", "j-good-2", "j-good-3"] },
  ],
  yuhibb: [
    { ar: "بيحب لنفسه", en: "Loves for himself", tone: "grey", ids: ["y-bad-1", "y-bad-2", "y-bad-3"] },
    { ar: "بيحب لك زي نفسه", en: "Loves for you as for himself", tone: "white", ids: ["y-good-1", "y-good-2", "y-good-3"] },
  ],
  nasr: [
    { ar: "بيشجّعك", en: "Cheers you on", tone: "grey", ids: ["n-bad-1", "n-bad-2", "n-bad-3"] },
    { ar: "بينصرك", en: "Truly helps you", tone: "white", ids: ["n-good-1", "n-good-2", "n-good-3"] },
  ],
};

const labels = (short: string): Drawn => ({ show }) => (
  <>
    {LABELS[short].map((l) => {
      const o = Math.min(1, l.ids.reduce((sum, id) => sum + show(id), 0));
      if (o <= 0.001) return null;
      const width = l.ar.length * 40 + 60;
      return (
        <g key={l.ar} opacity={o}>
          <text x={W / 2 - 20} y={410} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={84} fill="#fffaf0"
            style={{ direction: "rtl", filter: "drop-shadow(0 4px 10px rgba(0,0,0,.6))" }}>{l.ar}</text>
          <circle cx={W / 2 + width / 2 + 6} cy={384} r={15} fill={l.tone === "grey" ? GREY : WHITE} stroke={INK} strokeWidth={5} />
          <text x={W / 2} y={466} textAnchor="middle" fontFamily={FONT.latin} fontSize={30} letterSpacing={7} fill="#fffaf0" opacity={0.8}
            style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,.6))" }}>{l.en.toUpperCase()}</text>
        </g>
      );
    })}
  </>
);

export const SAHIB_OVERLAYS: Record<string, Drawn> = { jalis: labels("jalis"), yuhibb: labels("yuhibb"), nasr: labels("nasr") };
