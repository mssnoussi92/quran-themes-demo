// Style lab: illumination (manuscript page). A parchment page with a gold and lapis border of
// eight-pointed stars; the scene sits in a pointed arch, painted flat in jewel colours (lapis,
// turquoise, vermilion, malachite, ochre) with a fine ink outline, walls and floors patterned,
// rocks in the soft pinks and lilacs of the painted manuscripts. Text in naskh inside a gold
// cartouche. Native moves: a geometric rosette draws itself, a glint of light runs over the gold.
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CAVE_BEAM, LINE, type Layer, type SceneSpec, type Shape } from "./geometry";
import { groups, H, Handle, Shapes, Subtitle, W } from "./shapes";

const C = {
  parchment: "#f1e5c6", ink: "#2b211a", gold: "#c9a24a", goldLight: "#f3dc8e", lapis: "#1f3d73",
  turquoise: "#2b8a8a", vermilion: "#c2452d", malachite: "#3e7b4f", ochre: "#d39b4a", ivory: "#f8f1de",
  lilac: "#b493b4", rose: "#dca487", sienna: "#a8643f", plum: "#7c4a6b",
};

const ARCH = "M150 1392 L150 660 Q150 540 290 470 Q470 380 540 300 Q610 380 790 470 Q930 540 930 660 L930 1392 Z";

const InkFilter: React.FC<{ id: string; color: string; width: number }> = ({ id, color, width }) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
    <feMorphology in="SourceAlpha" operator="dilate" radius={width} result="d" />
    <feComposite in="d" in2="SourceAlpha" operator="out" result="ring" />
    <feFlood floodColor={color} />
    <feComposite in2="ring" operator="in" />
  </filter>
);

/** The khatam: two squares turned 45° make an eight-pointed star; a small cross between the stars. */
const Khatam: React.FC<{ id: string; size: number; ground: string; star: string; line: string; width?: number }> = ({ id, size, ground, star, line, width = 2 }) => {
  const c = size / 2;
  const a = size * 0.3;
  const sq = `M${c - a} ${c - a} H${c + a} V${c + a} H${c - a} Z`;
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={size} height={size}>
      <rect width={size} height={size} fill={ground} />
      <path d={sq} fill={star} stroke={line} strokeWidth={width} />
      <path d={sq} fill={star} stroke={line} strokeWidth={width} transform={`rotate(45 ${c} ${c})`} />
      <circle cx={c} cy={c} r={size * 0.09} fill={line} />
      <path d={`M0 ${size * 0.1} L${size * 0.1} 0 M${size} ${size * 0.1} L${size * 0.9} 0 M0 ${size * 0.9} L${size * 0.1} ${size} M${size} ${size * 0.9} L${size * 0.9} ${size}`} stroke={line} strokeWidth={width} />
    </pattern>
  );
};

const Defs: React.FC = () => (
  <defs>
    <filter id="il-page" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={4} seed={21} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.25  0.22 0 0 0 0" />
    </filter>
    <linearGradient id="il-gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#b8892f" />
      <stop offset="0.45" stopColor={C.goldLight} />
      <stop offset="0.55" stopColor="#d9b15a" />
      <stop offset="1" stopColor="#9c7428" />
    </linearGradient>
    <linearGradient id="il-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f6e9b9" />
      <stop offset="1" stopColor="#e3b55c" />
    </linearGradient>
    <Khatam id="il-border" size={56} ground={C.lapis} star={C.lapis} line={C.gold} />
    <Khatam id="il-wall" size={70} ground="#efe0bb" star="#e6d1a3" line="#d2b77d" width={1.5} />
    <Khatam id="il-spandrel" size={44} ground={C.lapis} star={C.turquoise} line={C.gold} width={1.5} />
    <pattern id="il-carpet" patternUnits="userSpaceOnUse" width={48} height={48}>
      <rect width={48} height={48} fill={C.vermilion} />
      <path d="M24 6 L42 24 L24 42 L6 24 Z" fill="none" stroke={C.ivory} strokeWidth={2} opacity={0.7} />
      <circle cx={24} cy={24} r={4} fill={C.gold} />
    </pattern>
    <pattern id="il-rug" patternUnits="userSpaceOnUse" width={26} height={26}>
      <rect width={26} height={26} fill={C.malachite} />
      <path d="M13 3 L23 13 L13 23 L3 13 Z" fill={C.gold} opacity={0.75} />
    </pattern>
    <InkFilter id="il-ink" color={C.ink} width={2.2} />
    <InkFilter id="il-gold-line" color={C.gold} width={3} />
    <clipPath id="il-arch">
      <path d={ARCH} />
    </clipPath>
  </defs>
);

const fillOf = (layer: Layer, scene: string): string | null => {
  const cave = scene === "cave";
  switch (layer.id) {
    case "sky":
    case "outside":
      return "url(#il-sky)";
    case "skyline":
      return C.turquoise;
    case "hills":
      return C.malachite;
    case "wall":
      return "url(#il-wall)";
    case "back-wall":
      return C.rose;
    case "walls":
      return C.lilac;
    case "window":
      return C.lapis;
    case "lamp":
      return "url(#il-gold)";
    case "lamp-light":
      return C.goldLight;
    case "floor":
      return cave ? "#d8b07a" : "url(#il-carpet)";
    case "colleague-seated":
      return C.vermilion;
    case "desk":
      return C.sienna;
    case "rug":
      return "url(#il-rug)";
    case "praying":
      return C.ivory;
    case "colleague-standing":
      return C.turquoise;
    case "plant":
      return C.malachite;
    case "dog":
      return C.ink;
    case "inner-rocks":
      return C.plum;
    case "front-rocks":
      return "#5e3552";
    default:
      return null;
  }
};

/** Rocks of the painted manuscripts: soft layered contour lines inside each rock. */
const RockLines: React.FC<{ shapes: Shape[] }> = ({ shapes }) => (
  <g opacity={0.35}>
    {shapes.map((s, i) =>
      s.kind === "path" ? (
        <g key={i}>
          {[0.94, 0.86, 0.78].map((k) => (
            <path key={k} d={s.d} fill="none" stroke={C.ivory} strokeWidth={3}
              transform={`translate(540 960) scale(${k}) translate(-540 -960)`} />
          ))}
        </g>
      ) : null,
    )}
  </g>
);

const Border: React.FC<{ glint: number }> = ({ glint }) => (
  <>
    <path d={`M0 0 H${W} V${H} H0 Z M60 60 H${W - 60} V${H - 60} H60 Z`} fill="url(#il-border)" fillRule="evenodd" />
    <path d={`M44 44 H${W - 44} V${H - 44} H44 Z M60 60 H${W - 60} V${H - 60} H60 Z`} fill="url(#il-gold)" fillRule="evenodd" />
    <path d={`M0 0 H${W} V${H} H0 Z M14 14 H${W - 14} V${H - 14} H14 Z`} fill="url(#il-gold)" fillRule="evenodd" />
    <rect x={-200} y={-200} width={160} height={H + 400} fill="#fff" opacity={0.28}
      transform={`translate(${glint} 0) rotate(18 0 ${H / 2})`} style={{ mixBlendMode: "overlay" }} />
  </>
);

const useMotion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return { t, glint: interpolate(t % 6, [0, 6], [-300, W + 600]), push: 1 + 0.01 * t };
};

const Scene: React.FC<{ spec: SceneSpec }> = ({ spec }) => {
  const { glint, push } = useMotion();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <Defs />
      <rect x={0} y={0} width={W} height={H} fill={C.parchment} />
      <rect x={0} y={0} width={W} height={H} filter="url(#il-page)" />
      {/* Spandrels: the page around the arch, patterned. */}
      <path d={`M90 260 H990 V1440 H90 Z ${ARCH}`} fill="url(#il-border)" fillRule="evenodd" />
      <g clipPath="url(#il-arch)">
        <g transform={`translate(540 1340) scale(${0.8 * push}) translate(-540 -1340)`}>
          {spec.layers.map((l) => {
            const fill = fillOf(l, spec.id);
            if (!fill) return null;
            return (
              <g key={l.id}>
                {groups(l).map((g, i) => (
                  <g key={i}>
                    <Shapes shapes={g} fill={fill} />
                    {l.role !== "sky" && l.role !== "light" ? (
                      <g filter={l.id === "praying" ? "url(#il-gold-line)" : "url(#il-ink)"}>
                        <Shapes shapes={g} fill="#000" />
                      </g>
                    ) : null}
                  </g>
                ))}
                {l.id === "walls" || l.id === "inner-rocks" ? <RockLines shapes={l.shapes} /> : null}
              </g>
            );
          })}
          {spec.id === "cave" ? (
            <g style={{ mixBlendMode: "screen" }} opacity={0.75}>
              {Array.from({ length: 9 }, (_, i) => (
                <path key={i} d={`M620 ${980 + i * 26} L${872 - i * 2} ${880 + i * 62}`} stroke={C.goldLight} strokeWidth={6} strokeLinecap="round" opacity={0.8} />
              ))}
              <path d={CAVE_BEAM.d} fill={C.goldLight} opacity={0.25} />
            </g>
          ) : null}
          {spec.id === "office" ? <circle cx={300} cy={470} r={46} fill="url(#il-gold)" stroke={C.ink} strokeWidth={2} /> : null}
        </g>
      </g>
      <path d={ARCH} fill="none" stroke="url(#il-gold)" strokeWidth={12} />
      <path d={ARCH} fill="none" stroke={C.ink} strokeWidth={2} transform="translate(540 846) scale(1.022) translate(-540 -846)" />
      <rect x={90} y={1440} width={W - 180} height={380} fill={C.parchment} />
      <rect x={90} y={1440} width={W - 180} height={380} filter="url(#il-page)" />
      <rect x={90} y={1440} width={W - 180} height={380} fill="none" stroke="url(#il-gold)" strokeWidth={6} />
      <Rosette cx={540} cy={1700} r={70} p={1} />
      <Border glint={glint} />
    </svg>
  );
};

/** A rosette of eight-fold stars that draws itself line by line around the cartouche. */
const Rosette: React.FC<{ cx: number; cy: number; r: number; p: number }> = ({ cx, cy, r, p }) => {
  const lines: React.ReactNode[] = [];
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8;
    const b = a + (3 * Math.PI) / 8;
    const d = `M${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} L${cx + r * Math.cos(b)} ${cy + r * Math.sin(b)}`;
    lines.push(<path key={k} d={d} stroke="url(#il-gold)" strokeWidth={4} fill="none" strokeDasharray={2 * r} strokeDashoffset={2 * r * (1 - p)} />);
  }
  return (
    <g>
      {lines}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#il-gold)" strokeWidth={3} strokeDasharray={2 * Math.PI * r} strokeDashoffset={2 * Math.PI * r * (1 - p)} />
    </g>
  );
};

const LineCard: React.FC = () => {
  const { t, glint } = useMotion();
  const p = interpolate(t, [0.2, 2.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const text = interpolate(t, [1.6, 2.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cart = "M150 700 Q150 640 210 640 H870 Q930 640 930 700 Q990 760 990 830 Q990 900 930 960 Q930 1020 870 1020 H210 Q150 1020 150 960 Q90 900 90 830 Q90 760 150 700 Z";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <Defs />
      <rect x={0} y={0} width={W} height={H} fill={C.parchment} />
      <rect x={0} y={0} width={W} height={H} filter="url(#il-page)" />
      <Rosette cx={540} cy={830} r={420} p={p} />
      <Rosette cx={540} cy={830} r={300} p={p} />
      <path d={cart} fill={C.lapis} stroke="url(#il-gold)" strokeWidth={10} />
      <path d={cart} fill="none" stroke={C.ink} strokeWidth={2} transform="translate(540 830) scale(0.94) translate(-540 -830)" />
      <g opacity={text}>
        {LINE.ar.map((line, i) => (
          <text key={i} x={W / 2} y={790 + i * 120} fontFamily="Amiri" fontWeight={700} fontSize={i ? 82 : 70}
            textAnchor="middle" direction="rtl" fill={i ? C.goldLight : C.ivory}>{line}</text>
        ))}
      </g>
      <Border glint={glint} />
    </svg>
  );
};

export const IlluminationStyle: React.FC<{ shot: "office" | "cave" | "line"; spec?: SceneSpec; subtitle: string }> = ({ shot, spec, subtitle }) => (
  <div style={{ position: "absolute", inset: 0, background: C.parchment }}>
    {shot === "line" ? <LineCard /> : <Scene spec={spec!} />}
    <Handle color="#f8f1de" font="Lora" shadow="rgba(31, 61, 115, 0.75)" />
    <Subtitle text={subtitle} />
  </div>
);
