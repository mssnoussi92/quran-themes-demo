// Style lab: chalkboard. A dark green board in a wooden frame; everything drawn in chalk: the outline
// of each thing (one line around a person, not one per body part), rough edges and gaps where the
// chalk skipped, light hatching instead of fills, one accent colour per role (yellow for the one we
// follow, pink for a detail, blue for the sky and the light). Text in Ruqaa, the hand Egyptians
// write in. Native moves: the drawing appears line by line, a phrase is written, wiped, rewritten.
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CAVE_BEAM, LINE, type Layer, type SceneSpec, type Shape } from "./geometry";
import { groups, H, Handle, rand, Shapes, Subtitle, W } from "./shapes";

const BOARD = "#1c2723";
const CHALK = { white: "#efede4", yellow: "#f3d36b", pink: "#f2958a", blue: "#9fcbe0" };

/** The chalk outline around the shapes it is applied to: a ring outside their union, roughened, with gaps. */
const OutlineFilter: React.FC<{ id: string; color: string; seed: number; width?: number }> = ({ id, color, seed, width = 3.5 }) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
    <feMorphology in="SourceAlpha" operator="dilate" radius={width} result="d" />
    <feComposite in="d" in2="SourceAlpha" operator="out" result="ring" />
    <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves={2} seed={seed} result="wobble" />
    <feDisplacementMap in="ring" in2="wobble" scale={6} xChannelSelector="R" yChannelSelector="G" result="rough" />
    <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={1} seed={seed + 3} result="grain" />
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 1.85" result="gaps" />
    <feComposite in="rough" in2="gaps" operator="in" result="chalk" />
    <feFlood floodColor={color} />
    <feComposite in2="chalk" operator="in" />
  </filter>
);

/** Chalk on what is drawn itself (lines, hatching, letters): rough edges and gaps. */
const ChalkFilter: React.FC<{ id: string; seed: number; scale?: number }> = ({ id, seed, scale = 4 }) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={2} seed={seed} result="wobble" />
    <feDisplacementMap in="SourceGraphic" in2="wobble" scale={scale} xChannelSelector="R" yChannelSelector="G" result="rough" />
    <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves={1} seed={seed + 5} result="grain" />
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.75" result="gaps" />
    <feComposite in="rough" in2="gaps" operator="in" />
  </filter>
);

const Hatch: React.FC<{ id: string; color: string; gap?: number; angle?: number; opacity?: number }> = ({ id, color, gap = 16, angle = 35, opacity = 0.55 }) => (
  <pattern id={id} patternUnits="userSpaceOnUse" width={gap} height={gap} patternTransform={`rotate(${angle})`}>
    <line x1={0} y1={0} x2={0} y2={gap} stroke={color} strokeWidth={3} opacity={opacity} />
  </pattern>
);

const Board: React.FC = () => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={BOARD} />
    <rect x={0} y={0} width={W} height={H} filter="url(#ck-board)" opacity={0.55} />
    {Array.from({ length: 7 }, (_, i) => (
      <ellipse key={i} cx={120 + rand(i) * 840} cy={200 + rand(i + 9) * 1500} rx={160 + rand(i + 3) * 220} ry={60 + rand(i + 5) * 90}
        fill="#cfd8d2" opacity={0.035 + rand(i + 7) * 0.03} filter="url(#ck-smudge)" transform={`rotate(${-20 + rand(i + 11) * 40} 540 960)`} />
    ))}
  </>
);

const Frame: React.FC = () => (
  <path d={`M0 0 H${W} V${H} H0 Z M28 28 H${W - 28} V${H - 28} H28 Z`} fill="#6b4a2f" fillRule="evenodd" stroke="#3f2a19" strokeWidth={3} />
);

const Defs: React.FC = () => (
  <defs>
    <filter id="ck-board" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={2} seed={4} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.9  0 0 0 0 0.88  0.12 0 0 0 0" />
    </filter>
    <filter id="ck-smudge" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={40} />
    </filter>
    {Object.entries(CHALK).map(([name, color], i) => (
      <OutlineFilter key={name} id={`ck-o-${name}`} color={color} seed={11 + i * 7} />
    ))}
    <ChalkFilter id="ck-c" seed={3} />
    <ChalkFilter id="ck-text" seed={8} scale={3} />
    {Object.entries(CHALK).map(([name, color]) => (
      <Hatch key={name} id={`ck-h-${name}`} color={color} />
    ))}
    <Hatch id="ck-h-yellow-dense" color={CHALK.yellow} gap={11} angle={-30} opacity={0.7} />
  </defs>
);

type Ink = { line?: keyof typeof CHALK; hatch?: keyof typeof CHALK };

const inkOf = (layer: Layer): Ink | null => {
  switch (layer.role) {
    case "sky":
      return { hatch: "blue" };
    case "accent":
      return layer.tint ? { line: "pink", hatch: "pink" } : { line: "yellow" };
    case "light":
      return { line: "yellow", hatch: "yellow" };
    case "floor":
      return null;
    default:
      return { line: "white" };
  }
};

/** One group: the board's colour inside (it hides what is behind), hatching, then the chalk outline. */
const Group: React.FC<{ shapes: Shape[]; ink: Ink; fill: boolean }> = ({ shapes, ink, fill }) => (
  <>
    {fill ? <Shapes shapes={shapes} fill={BOARD} /> : null}
    {ink.hatch ? (
      <g filter="url(#ck-c)">
        <Shapes shapes={shapes} fill={`url(#ck-h-${ink.hatch})`} />
      </g>
    ) : null}
    {ink.line ? (
      <g filter={`url(#ck-o-${ink.line})`}>
        <Shapes shapes={shapes} fill="#fff" />
      </g>
    ) : null}
  </>
);

/** Reveals the drawing from one side to the other (the hand drawing it). */
const useReveal = (seconds: number, rtl = false) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [6, 6 + seconds * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return rtl ? { x: W * (1 - p), w: W * p } : { x: 0, w: W * p };
};

const Scene: React.FC<{ spec: SceneSpec }> = ({ spec }) => {
  const frame = useCurrentFrame();
  const reveal = useReveal(2.4);
  const push = 1 + 0.0004 * frame;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <Defs />
      <Board />
      <clipPath id="ck-reveal">
        <rect x={reveal.x} y={0} width={reveal.w} height={H} />
      </clipPath>
      <g clipPath="url(#ck-reveal)" transform={`translate(${W / 2} ${H / 2}) scale(${push}) translate(${-W / 2} ${-H / 2})`}>
        {spec.layers.map((l) => {
          const ink = inkOf(l);
          return (
            <g key={l.id}>
              {ink
                ? groups(l).map((g, i) => (
                    <Group key={i} shapes={g} ink={ink} fill={l.role !== "sky" && l.role !== "far" && l.role !== "floor" && l.role !== "light"} />
                  ))
                : null}
              {l.lines ? (
                <g filter="url(#ck-c)">
                  {l.lines.map((d, i) => (
                    <path key={i} d={d} fill="none" stroke={CHALK.white} strokeWidth={3.5} strokeLinecap="round" opacity={0.85} />
                  ))}
                </g>
              ) : null}
            </g>
          );
        })}
        {spec.id === "cave" ? (
          <g>
            <g filter="url(#ck-c)">
              <path d={CAVE_BEAM.d} fill="url(#ck-h-yellow-dense)" />
            </g>
          </g>
        ) : null}
      </g>
      <Frame />
    </svg>
  );
};

const LineCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Written phrase by phrase, right to left, then underlined.
  const first = interpolate(frame, [6, 6 + 1.3 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const second = interpolate(frame, [12 + 1.3 * fps, 12 + 2.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const under = interpolate(frame, [16 + 2.8 * fps, 16 + 3.4 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rows = [
    { text: LINE.ar[0], y: 760, size: 96, color: CHALK.white, p: first },
    { text: LINE.ar[1], y: 940, size: 112, color: CHALK.yellow, p: second },
  ];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <Defs />
      <Board />
      {/* What was wiped before: the board remembers a sentence, rubbed out. */}
      <ellipse cx={560} cy={500} rx={360} ry={70} fill="#d7dfda" opacity={0.07} filter="url(#ck-smudge)" />
      {rows.map((r, i) => (
        <g key={i}>
          <clipPath id={`ck-row-${i}`}>
            <rect x={W - 60 - (W - 120) * r.p} y={r.y - r.size * 1.2} width={(W - 120) * r.p} height={r.size * 1.8} />
          </clipPath>
          <g clipPath={`url(#ck-row-${i})`} filter="url(#ck-text)">
            <text x={W / 2} y={r.y} fontFamily="Aref Ruqaa" fontWeight={700} fontSize={r.size} textAnchor="middle" direction="rtl" fill={r.color}>
              {r.text}
            </text>
          </g>
        </g>
      ))}
      <g filter="url(#ck-c)">
        <path d="M900 1000 Q700 1020 520 1004 Q330 990 190 1012" fill="none" stroke={CHALK.yellow} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={760} strokeDashoffset={760 * (1 - under)} />
      </g>
      <Frame />
    </svg>
  );
};

export const ChalkStyle: React.FC<{ shot: "office" | "cave" | "line"; spec?: SceneSpec; subtitle: string }> = ({ shot, spec, subtitle }) => (
  <div style={{ position: "absolute", inset: 0, background: BOARD }}>
    {shot === "line" ? <LineCard /> : <Scene spec={spec!} />}
    <Handle color="#efede4" font="Lora" />
    <Subtitle text={subtitle} />
  </div>
);
