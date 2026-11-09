// Style lab: paper-cut lightbox. Sheets of cut card stacked in a shallow box and lit from behind:
// each layer one flat colour (far layers light, near ones dark: the value ladder is the depth), paper
// fibre, a thin rim of light on its top edge, a soft shadow cast on the layers behind; what is open
// (a window, the cave's mouth, cut-out letters) glows. Native moves: the camera drifts between the
// layers (parallax), the light breathes, dust floats in a beam.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { CAVE_BEAM, LINE, type Layer, type SceneSpec } from "./geometry";
import { H, Handle, mix, rand, Shapes, Subtitle, W } from "./shapes";

/** ladder: colours by depth (stops from far to near), warm and saturated like a lit paper lamp. */
type Palette = { sky: [string, string]; ladder: [number, string][]; accent: [string, string]; light: string; frame: string };

const PALETTES: Record<string, Palette> = {
  office: {
    sky: ["#fff3d2", "#ffb065"],
    ladder: [[0, "#ffd9a0"], [0.3, "#efb57a"], [0.45, "#d48a4f"], [0.6, "#9c5630"], [0.8, "#62321b"], [1, "#2a140a"]],
    accent: ["#16605a", "#a3322a"], light: "#ffe6a8", frame: "#170c07",
  },
  cave: {
    sky: ["#fff6d8", "#ffbe6e"],
    ladder: [[0, "#e0a25f"], [0.12, "#b9783f"], [0.2, "#dc9a5e"], [0.35, "#a9653a"], [0.42, "#c27e4c"], [0.6, "#5c3019"], [1, "#1a0c05"]],
    accent: ["#16605a", "#a3322a"], light: "#ffdc90", frame: "#120a06",
  },
  line: {
    sky: ["#fff3cf", "#ffa95a"],
    ladder: [[0, "#ffd39a"], [0.35, "#e39c5e"], [0.6, "#a2582f"], [0.85, "#5a2c16"], [1, "#2a140a"]],
    accent: ["#16605a", "#a3322a"], light: "#ffe2a0", frame: "#150b06",
  },
};

const ladderAt = (p: Palette, depth: number): string => {
  const stops = p.ladder;
  for (let i = 1; i < stops.length; i++) {
    if (depth <= stops[i][0]) {
      const [d0, c0] = stops[i - 1];
      const [d1, c1] = stops[i];
      return mix(c0, c1, (depth - d0) / (d1 - d0));
    }
  }
  return stops[stops.length - 1][1];
};

const colour = (layer: Layer, p: Palette): string => {
  if (layer.role === "accent") return p.accent[layer.tint ?? 0];
  const base = ladderAt(p, layer.depth);
  if (layer.role === "figure") return mix(base, p.ladder[p.ladder.length - 1][1], 0.45 + 0.15 * (layer.tint ?? 0));
  return layer.tint ? mix(base, p.ladder[p.ladder.length - 1][1], 0.12 * layer.tint) : base;
};

/** Fibre, rim light on the top edge, dark band at the bottom edge, shadow on the layers behind. */
const PaperFilter: React.FC<{ id: string; seed: number; rim: string }> = ({ id, seed, rim }) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="125%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={seed} result="fine" />
    <feColorMatrix in="fine" type="saturate" values="0" result="fineGrey" />
    <feComponentTransfer in="fineGrey" result="fineSoft">
      <feFuncR type="linear" slope={0.12} intercept={0.44} />
      <feFuncG type="linear" slope={0.12} intercept={0.44} />
      <feFuncB type="linear" slope={0.12} intercept={0.44} />
    </feComponentTransfer>
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={seed + 1} result="cloud" />
    <feColorMatrix in="cloud" type="saturate" values="0" result="cloudGrey" />
    <feComponentTransfer in="cloudGrey" result="cloudSoft">
      <feFuncR type="linear" slope={0.08} intercept={0.46} />
      <feFuncG type="linear" slope={0.08} intercept={0.46} />
      <feFuncB type="linear" slope={0.08} intercept={0.46} />
    </feComponentTransfer>
    <feBlend in="SourceGraphic" in2="cloudSoft" mode="soft-light" result="mottled" />
    <feBlend in="mottled" in2="fineSoft" mode="soft-light" result="fibre" />
    <feComposite in="fibre" in2="SourceAlpha" operator="in" result="sheet" />
    <feOffset in="SourceAlpha" dy={4} result="down" />
    <feComposite in="SourceAlpha" in2="down" operator="out" result="topEdge" />
    <feFlood floodColor={rim} floodOpacity={0.85} />
    <feComposite in2="topEdge" operator="in" result="rim" />
    <feOffset in="SourceAlpha" dy={-6} result="up" />
    <feComposite in="SourceAlpha" in2="up" operator="out" result="bottomEdge" />
    <feFlood floodColor="#000" floodOpacity={0.28} />
    <feComposite in2="bottomEdge" operator="in" result="dark" />
    <feGaussianBlur in="SourceAlpha" stdDeviation={10} result="blur" />
    <feOffset in="blur" dx={4} dy={16} result="drop" />
    <feFlood floodColor="#1a0800" floodOpacity={0.62} />
    <feComposite in2="drop" operator="in" result="shadow" />
    <feMerge>
      <feMergeNode in="shadow" />
      <feMergeNode in="sheet" />
      <feMergeNode in="dark" />
      <feMergeNode in="rim" />
    </feMerge>
  </filter>
);

const Defs: React.FC<{ p: Palette; n: number }> = ({ p, n }) => (
  <defs>
    <linearGradient id="pp-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={p.sky[0]} />
      <stop offset="1" stopColor={p.sky[1]} />
    </linearGradient>
    <radialGradient id="pp-back" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stopColor={p.sky[0]} />
      <stop offset="1" stopColor={p.sky[1]} />
    </radialGradient>
    {Array.from({ length: n }, (_, i) => (
      <PaperFilter key={i} id={`pp-f${i}`} seed={7 + i * 13} rim={p.light} />
    ))}
    <filter id="pp-bloom" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation={22} />
    </filter>
    <filter id="pp-soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation={14} />
    </filter>
  </defs>
);

/** The box: a dark frame with rounded inner corners, its shadow falling inwards; a light vignette. */
const BoxFrame: React.FC<{ p: Palette }> = ({ p }) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill="url(#pp-vignette)" />
    <path d={`M0 0 H${W} V${H} H0 Z M34 74 Q34 34 74 34 H${W - 74} Q${W - 34} 34 ${W - 34} 74 V${H - 74} Q${W - 34} ${H - 34} ${W - 74} ${H - 34} H74 Q34 ${H - 34} 34 ${H - 74} Z`}
      fill={p.frame} fillRule="evenodd" filter="url(#pp-f0)" />
  </>
);

const useCamera = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return { t, push: 1 + 0.012 * t, drift: (depth: number) => (depth - 0.5) * 26 * Math.sin(t * 0.35) };
};

const Scene: React.FC<{ spec: SceneSpec; p: Palette }> = ({ spec, p }) => {
  const { t, push, drift } = useCamera();
  const layers = spec.layers.filter((l) => l.role !== "light" && l.role !== "sky");
  const lights = spec.layers.filter((l) => l.role === "light" || l.role === "sky");
  const breathe = 0.82 + 0.1 * Math.sin(t * 1.3);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <Defs p={p} n={layers.length + 1} />
      <radialGradient id="pp-vignette" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.6" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.35} />
      </radialGradient>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${push}) translate(${-W / 2} ${-H / 2})`}>
        <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="url(#pp-back)" />
        {lights.filter((l) => l.role === "sky").map((l) => (
          <Shapes key={l.id} shapes={l.shapes} fill="url(#pp-sky)" />
        ))}
        {layers.map((l, i) => (
          <React.Fragment key={l.id}>
            <g transform={`translate(${drift(l.depth)} 0)`} filter={`url(#pp-f${i + 1})`}>
              <Shapes shapes={l.shapes} fill={colour(l, p)} />
              {l.over ? <Shapes shapes={l.over} fill={colour(l, p)} /> : null}
            </g>
            {l.id === "skyline" ? <OfficeWindows t={t} p={p} drift={drift(0.15)} /> : null}
            {/* The light spills over the edge of the opening, onto the sheet that has the hole, and no further. */}
            {l.id === "wall" || l.id === "back-wall"
              ? lights.filter((x) => x.role === "sky").map((x) => (
                  <g key={`b-${x.id}`} style={{ mixBlendMode: "screen" }} opacity={0.4 * breathe} filter="url(#pp-bloom)">
                    <Shapes shapes={x.shapes} fill={p.light} />
                  </g>
                ))
              : null}
          </React.Fragment>
        ))}
        {spec.id === "cave" ? <Beam t={t} p={p} /> : null}
        {lights.filter((l) => l.role === "light").map((l) => (
          <g key={`b-${l.id}`} style={{ mixBlendMode: "screen" }} opacity={0.5 * breathe} filter="url(#pp-bloom)">
            <Shapes shapes={l.shapes} fill={p.light} />
          </g>
        ))}
        {lights.filter((l) => l.role === "light").map((l) => (
          <Shapes key={`c-${l.id}`} shapes={l.shapes} fill={p.light} opacity={breathe} />
        ))}
      </g>
      <BoxFrame p={p} />
    </svg>
  );
};

/** Lit windows cut in the far buildings. */
const OfficeWindows: React.FC<{ t: number; p: Palette; drift: number }> = ({ t, p, drift }) => {
  const dots: React.ReactNode[] = [];
  const blocks = [[150, 760, 90, 220], [245, 700, 70, 280], [320, 800, 110, 180], [525, 740, 120, 240], [650, 690, 70, 290], [725, 780, 100, 200], [830, 720, 110, 260]];
  blocks.forEach(([x, y, w, h], b) => {
    for (let row = 0; row * 34 + 24 < h - 20; row++) {
      for (let col = 0; col * 26 + 16 < w - 10; col++) {
        const k = b * 100 + row * 10 + col;
        if (rand(k) < 0.42) continue;
        const on = 0.65 + 0.35 * Math.sin(t * 0.8 + k);
        dots.push(<rect key={k} x={x + 12 + col * 26} y={y + 18 + row * 34} width={10} height={14} fill={p.light} opacity={on} />);
      }
    }
  });
  return <g transform={`translate(${drift} 0)`}>{dots}</g>;
};

/** The sunbeam (18:17): from the mouth to the right-hand wall, dust floating in it. */
const Beam: React.FC<{ t: number; p: Palette }> = ({ t, p }) => {
  const motes = Array.from({ length: 46 }, (_, i) => {
    const u = rand(i * 3.1), v = rand(i * 7.7);
    const x = 620 + u * 250 + 14 * Math.sin(t * 0.4 + i);
    const y = 900 + v * 480 + ((t * 9 + i * 13) % 60) - 30 + (x - 620) * 0.35;
    return <circle key={i} cx={x} cy={y} r={1.6 + rand(i) * 2.2} fill={p.light} opacity={0.35 + 0.4 * rand(i * 2)} />;
  });
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <path d={CAVE_BEAM.d} fill={p.light} opacity={0.5} filter="url(#pp-soft)" />
      <ellipse {...CAVE_BEAM.patch} fill={p.light} opacity={0.6} filter="url(#pp-soft)" />
      {motes}
    </g>
  );
};

/** An Egyptian Ramadan lantern (fanous), cut in paper, its windows lit. */
const Lantern: React.FC<{ x: number; y: number; s: number; fill: string; light: string; on: number }> = ({ x, y, s, fill, light, on }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-1.5} y={-400} width={3} height={400} fill={fill} />
    <circle cx={0} cy={6} r={10} fill="none" stroke={fill} strokeWidth={5} />
    <path d="M-28 52 L0 14 L28 52 Z M-44 60 H44 L36 150 L0 186 L-36 150 Z" fill={fill} />
    <path d="M-26 74 H-6 V140 H-26 Z M6 74 H26 V140 H6 Z" fill={light} opacity={on} />
    <path d="M-18 156 L0 174 L18 156 Z" fill={light} opacity={on * 0.8} />
  </g>
);

const LineCard: React.FC<{ p: Palette }> = ({ p }) => {
  const { t, drift } = useCamera();
  const breathe = 0.85 + 0.12 * Math.sin(t * 1.3);
  const hills = [
    { d: "M0 1380 Q240 1240 520 1330 Q800 1200 1080 1310 V1920 H0 Z", depth: 0.35 },
    { d: "M0 1520 Q300 1400 600 1500 Q860 1410 1080 1480 V1920 H0 Z", depth: 0.6 },
    { d: "M0 1680 Q260 1600 540 1690 Q820 1610 1080 1660 V1920 H0 Z", depth: 0.85 },
  ];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <Defs p={p} n={6} />
      <radialGradient id="pp-vignette" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.6" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.35} />
      </radialGradient>
      <mask id="pp-letters">
        <rect x={0} y={0} width={W} height={H} fill="#fff" />
        {LINE.ar.map((line, i) => (
          <text key={i} x={W / 2} y={820 + i * 150} fontFamily="Aref Ruqaa" fontWeight={700} fontSize={i ? 92 : 80}
            textAnchor="middle" direction="rtl" fill="#000">{line}</text>
        ))}
      </mask>
      <rect x={0} y={0} width={W} height={H} fill="url(#pp-back)" />
      <circle cx={W / 2} cy={560} r={150} fill={p.light} opacity={0.5} filter="url(#pp-bloom)" />
      {hills.map((h, i) => (
        <path key={i} d={h.d} transform={`translate(${drift(h.depth)} 0)`} fill={ladderAt(p, h.depth)} filter={`url(#pp-f${i + 1})`} />
      ))}
      <g filter="url(#pp-f4)">
        <Lantern x={210} y={520} s={0.9} fill={ladderAt(p, 0.8)} light={p.light} on={breathe} />
        <Lantern x={880} y={430} s={0.75} fill={ladderAt(p, 0.8)} light={p.light} on={breathe} />
      </g>
      <g filter="url(#pp-f5)">
        <rect x={90} y={700} width={W - 180} height={330} rx={26} fill={p.accent[0]} mask="url(#pp-letters)" />
      </g>
      <BoxFrame p={p} />
    </svg>
  );
};

export const PaperStyle: React.FC<{ shot: "office" | "cave" | "line"; spec?: SceneSpec; subtitle: string }> = ({ shot, spec, subtitle }) => (
  <div style={{ position: "absolute", inset: 0, background: "#000" }}>
    {shot === "line" ? <LineCard p={PALETTES.line} /> : <Scene spec={spec!} p={PALETTES[shot]} />}
    <Handle color="#fff3d6" font="Lora" />
    <Subtitle text={subtitle} />
  </div>
);
