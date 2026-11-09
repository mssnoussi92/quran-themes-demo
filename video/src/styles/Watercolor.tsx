// Style lab: pen and watercolour (a sketchbook page). Warm white cold-press paper; a fine ink line
// around each thing, a little shaky; transparent washes laid slightly off the line, darker at their
// edges, grainy, glazing where they overlap, fading out towards the page's edges; the paper left
// white where the light is (the one who prays, the sunbeam). Native moves: the wash blooms in, the
// pen line runs across the page.
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CAVE_BEAM, LINE, type Layer, type SceneSpec } from "./geometry";
import { groups, H, Handle, Shapes, Subtitle, W } from "./shapes";

const PAPER = "#f7f1e3";
const INK = "#2b2722";

const WASH: Record<string, Record<string, string>> = {
  office: {
    sky: "#8fc3e0", skyline: "#93a3bd", wall: "#e8c38f", window: "#7a8fa8", lamp: "#6d6a63", "lamp-light": "#f2cf6b",
    floor: "#c98f5a", "colleague-seated": "#4b5d90", desk: "#a8653f", rug: "#bf3b2e", praying: "#cfd9e4",
    "colleague-standing": "#7d8c4b", plant: "#5f8f3e",
  },
  cave: {
    outside: "#f0c66c", hills: "#86a86a", "back-wall": "#c99a6a", walls: "#a9774f", floor: "#d0a676", dog: "#5b4330",
    "inner-rocks": "#6a422b", "front-rocks": "#3f2a1e",
  },
};

const WashFilter: React.FC<{ id: string; seed: number; warp: number }> = ({ id, seed, warp }) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={seed} result="flow" />
    <feDisplacementMap in="SourceGraphic" in2="flow" scale={warp} xChannelSelector="R" yChannelSelector="G" result="wash" />
    <feMorphology in="wash" operator="erode" radius={5} result="inner" />
    <feComposite in="wash" in2="inner" operator="out" result="edge" />
    <feColorMatrix in="edge" type="matrix" values="0.72 0 0 0 0  0 0.72 0 0 0  0 0 0.72 0 0  0 0 0 0.55 0" result="darkEdge" />
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed + 2} result="gran" />
    <feColorMatrix in="gran" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.9 0 0 0 1.15" result="granA" />
    <feComposite in="wash" in2="granA" operator="in" result="grainy" />
    <feColorMatrix in="grainy" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.78 0" result="glaze" />
    <feMerge>
      <feMergeNode in="glaze" />
      <feMergeNode in="darkEdge" />
    </feMerge>
  </filter>
);

const PenFilter: React.FC<{ id: string; seed: number }> = ({ id, seed }) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
    <feMorphology in="SourceAlpha" operator="dilate" radius={1.8} result="d" />
    <feComposite in="d" in2="SourceAlpha" operator="out" result="ring" />
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={seed} result="shake" />
    <feDisplacementMap in="ring" in2="shake" scale={4} xChannelSelector="R" yChannelSelector="G" result="line" />
    <feFlood floodColor={INK} />
    <feComposite in2="line" operator="in" />
  </filter>
);

const Defs: React.FC<{ warp: number }> = ({ warp }) => (
  <defs>
    <filter id="wc-paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={5} seed={2} result="n" />
      <feDiffuseLighting in="n" surfaceScale={1.6} lightingColor="#fff" result="relief">
        <feDistantLight azimuth={45} elevation={58} />
      </feDiffuseLighting>
      <feColorMatrix in="relief" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.32  -0.35 0 0 0 0.3" />
    </filter>
    {Array.from({ length: 16 }, (_, i) => (
      <WashFilter key={i} id={`wc-w${i}`} seed={5 + i * 9} warp={warp} />
    ))}
    <PenFilter id="wc-pen" seed={13} />
    <radialGradient id="wc-fade" cx="0.5" cy="0.45" r="0.62">
      <stop offset="0.55" stopColor="#fff" />
      <stop offset="1" stopColor="#000" />
    </radialGradient>
    <mask id="wc-vignette">
      <rect x={0} y={0} width={W} height={H} fill="url(#wc-fade)" />
    </mask>
    <radialGradient id="wc-fade-wide" cx="0.5" cy="0.5" r="0.85">
      <stop offset="0.7" stopColor="#fff" />
      <stop offset="1" stopColor="#555" />
    </radialGradient>
    <mask id="wc-vignette-wide">
      <rect x={0} y={0} width={W} height={H} fill="url(#wc-fade-wide)" />
    </mask>
    <pattern id="wc-hatch" patternUnits="userSpaceOnUse" width={12} height={12} patternTransform="rotate(40)">
      <line x1={0} y1={0} x2={0} y2={12} stroke={INK} strokeWidth={1.4} opacity={0.5} />
    </pattern>
  </defs>
);

const Page: React.FC = () => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={PAPER} />
    <rect x={0} y={0} width={W} height={H} filter="url(#wc-paper)" />
  </>
);

const useMotion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return {
    t,
    bloom: (delay: number) => interpolate(t, [delay, delay + 1.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    pen: interpolate(t, [0.1, 2.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    push: 1 + 0.008 * t,
  };
};

const washOf = (layer: Layer, scene: string): string | null => WASH[scene]?.[layer.id] ?? null;

const Scene: React.FC<{ spec: SceneSpec }> = ({ spec }) => {
  const { bloom, pen, push } = useMotion();
  const outlined = (l: Layer) => l.role !== "sky" && l.role !== "light" && l.id !== "wall" && l.id !== "back-wall";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <Defs warp={24} />
      <Page />
      <clipPath id="wc-pen-reveal">
        <rect x={0} y={0} width={W * pen} height={H} />
      </clipPath>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${push}) translate(${-W / 2} ${-H / 2})`}>
        {/* Layer by layer, far to near: the paper kept clear where the thing is (nothing behind shows
            through it), its wash laid a little off the line, then its pen line. */}
        {spec.layers.map((l, i) => {
          const c = washOf(l, spec.id);
          return (
            <g key={l.id}>
              {l.role !== "sky" && l.role !== "light" && l.role !== "far" ? <Shapes shapes={l.shapes} fill={PAPER} /> : null}
              {l.over ? <Shapes shapes={l.over} fill={PAPER} /> : null}
              {c ? (
                <g mask={spec.id === "cave" ? "url(#wc-vignette-wide)" : "url(#wc-vignette)"}>
                  <g filter={`url(#wc-w${i % 16})`} opacity={bloom(0.15 + l.depth * 0.9)} transform="translate(7 6)"
                    style={{ mixBlendMode: "multiply" }}>
                    {groups(l).map((g, k) => (
                      <Shapes key={k} shapes={g} fill={c} />
                    ))}
                  </g>
                </g>
              ) : null}
              {outlined(l) ? (
                <g clipPath="url(#wc-pen-reveal)">
                  {groups(l).map((g, k) => (
                    <g key={k} filter="url(#wc-pen)">
                      <Shapes shapes={g} fill="#000" />
                    </g>
                  ))}
                  {l.lines?.map((d, k) => (
                    <path key={k} d={d} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
                  ))}
                </g>
              ) : null}
            </g>
          );
        })}
        {spec.id === "cave" ? (
          <path d={CAVE_BEAM.d} fill="#f3c95a" opacity={0.7 * bloom(1)} filter="url(#wc-w3)" style={{ mixBlendMode: "multiply" }} />
        ) : null}
        <g clipPath="url(#wc-pen-reveal)">
          {spec.id === "office" ? (
            <path d="M52 1104 H448 V1330 H52 Z" fill="url(#wc-hatch)" opacity={0.6} />
          ) : (
            <path d="M380 1500 Q540 1440 700 1500 Q540 1560 380 1500 Z" fill="url(#wc-hatch)" opacity={0.6} />
          )}
        </g>
      </g>
      {/* The paper's grain over everything: the washes and the ink sit in it. */}
      <rect x={0} y={0} width={W} height={H} filter="url(#wc-paper)" />
    </svg>
  );
};

const LineCard: React.FC = () => {
  const { bloom, t } = useMotion();
  const write = interpolate(t, [0.8, 2.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <Defs warp={60} />
      <Page />
      <g style={{ mixBlendMode: "multiply" }}>
        <ellipse cx={560} cy={820} rx={430} ry={210} fill="#f0c66c" opacity={0.75 * bloom(0.1)} filter="url(#wc-w1)" />
        <ellipse cx={440} cy={900} rx={300} ry={150} fill="#8fc3e0" opacity={0.7 * bloom(0.4)} filter="url(#wc-w2)" />
        <ellipse cx={700} cy={760} rx={220} ry={110} fill="#e39a7a" opacity={0.55 * bloom(0.6)} filter="url(#wc-w4)" />
      </g>
      <clipPath id="wc-write">
        <rect x={W - 80 - (W - 160) * write} y={0} width={(W - 160) * write} height={H} />
      </clipPath>
      <g clipPath="url(#wc-write)">
        {LINE.ar.map((line, i) => (
          <text key={i} x={W / 2} y={790 + i * 150} fontFamily="Aref Ruqaa" fontWeight={700} fontSize={i ? 104 : 88}
            textAnchor="middle" direction="rtl" fill={INK}>{line}</text>
        ))}
      </g>
    </svg>
  );
};

export const WatercolorStyle: React.FC<{ shot: "office" | "cave" | "line"; spec?: SceneSpec; subtitle: string }> = ({ shot, spec, subtitle }) => (
  <div style={{ position: "absolute", inset: 0, background: PAPER }}>
    {shot === "line" ? <LineCard /> : <Scene spec={spec!} />}
    <Handle color="#f7f1e3" font="Lora" shadow="rgba(43, 39, 34, 0.55)" />
    <Subtitle text={subtitle} />
  </div>
);
