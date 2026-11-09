// Style lab (owner's request, 2026-11-09): the same scenes drawn in several visual styles, so the
// owner can choose. A scene is described once, as layers of plain shapes (what is where), and each
// style decides how a layer looks (paper, chalk, gold and lapis, watercolor). Not used by the
// episodes yet. Frame: 1080x1920 (reel). People are silhouettes with no face; the youths of the
// cave are never shown (the episode's rule), only the cave, the light and the dog of 18:18.

export type Shape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; r?: number; rotate?: [number, number, number] }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; rotate?: number }
  | { kind: "path"; d: string };

/** What a layer is: each style colours it by its role and its depth (0 far, 1 near). */
export type Role = "sky" | "far" | "wall" | "object" | "floor" | "figure" | "accent" | "light" | "front";

export type Layer = {
  id: string;
  role: Role;
  depth: number;
  /** Filled shapes; a "path" with two subpaths and fill-rule evenodd cuts a hole (a window). */
  shapes: Shape[];
  /** Lines inside the layer that a line style draws (a drawer, a fringe, a mullion). */
  lines?: string[];
  /** Shapes drawn over the layer as their own group, with their own outline (an arm over a body). */
  over?: Shape[];
  /** A tint inside the role's colours: 0 the base colour, 1 the role's second colour. */
  tint?: number;
};

export type SceneSpec = { id: string; title: { ar: string; en: string }; layers: Layer[] };

const leaves = (cx: number, cy: number, angles: number[], rx: number, ry: number): Shape[] =>
  angles.map((a) => ({
    kind: "ellipse" as const,
    cx: cx + Math.sin((a * Math.PI) / 180) * ry,
    cy: cy - Math.cos((a * Math.PI) / 180) * ry,
    rx,
    ry,
    rotate: a,
  }));

/** kahf hook-1: « لما تكون الوحيد اللي بيصلي في الشغل… », at work, not in a waiting room. Feet on the
 * floor line at about 1340, above the subtitles (as in the current scenes). */
export const OFFICE: SceneSpec = {
  id: "office",
  title: { ar: "لما تكون الوحيد اللي بيصلي في الشغل…", en: "When you're the only one who prays at work…" },
  layers: [
    { id: "sky", role: "sky", depth: 0, shapes: [{ kind: "rect", x: 140, y: 380, w: 800, h: 600 }] },
    {
      id: "skyline",
      role: "far",
      depth: 0.15,
      shapes: [
        [150, 760, 90, 220], [245, 700, 70, 280], [320, 800, 110, 180], [440, 650, 80, 330],
        [525, 740, 120, 240], [650, 690, 70, 290], [725, 780, 100, 200], [830, 720, 110, 260],
      ].map(([x, y, w, h]) => ({ kind: "rect" as const, x, y, w, h })),
      lines: ["M460 690 V960", "M480 690 V960", "M545 770 H625", "M545 820 H625", "M545 870 H625"],
    },
    {
      id: "wall",
      role: "wall",
      depth: 0.3,
      shapes: [{ kind: "path", d: "M0 0 H1080 V1240 H0 Z M140 380 H940 V980 H140 Z" }],
      lines: ["M0 1228 H1080"],
    },
    {
      id: "window",
      role: "object",
      depth: 0.35,
      tint: 1,
      shapes: [
        { kind: "path", d: "M124 364 H956 V996 H124 Z M140 380 H940 V980 H140 Z" },
        { kind: "rect", x: 531, y: 380, w: 18, h: 600 },
        { kind: "rect", x: 140, y: 671, w: 800, h: 18 },
      ],
    },
    {
      id: "lamp",
      role: "object",
      depth: 0.4,
      shapes: [
        { kind: "rect", x: 538, y: 0, w: 4, h: 252 },
        { kind: "path", d: "M470 332 L610 332 L580 250 L500 250 Z" },
      ],
    },
    { id: "lamp-light", role: "light", depth: 0.4, shapes: [{ kind: "ellipse", cx: 540, cy: 338, rx: 46, ry: 14 }] },
    {
      id: "floor",
      role: "floor",
      depth: 0.45,
      shapes: [{ kind: "rect", x: 0, y: 1240, w: 1080, h: 680 }],
      lines: ["M0 1450 H1080", "M0 1690 H1080"],
    },
    {
      // Seated behind the desk, the body toward the screen, the head turned to the one who prays.
      id: "colleague-seated",
      role: "figure",
      depth: 0.55,
      shapes: [
        { kind: "circle", cx: 334, cy: 920, r: 38 },
        { kind: "path", d: "M368 912 L384 926 L368 934 Z" },
        { kind: "rect", x: 322, y: 950, w: 24, h: 24 },
        { kind: "path", d: "M262 1000 Q262 972 300 966 L366 966 Q404 972 404 1000 L410 1100 L252 1100 Z" },
      ],
    },
    {
      id: "desk",
      role: "object",
      depth: 0.6,
      shapes: [
        { kind: "rect", x: 30, y: 1078, w: 440, h: 26, r: 4 },
        { kind: "rect", x: 52, y: 1104, w: 396, h: 226 },
        { kind: "rect", x: 76, y: 914, w: 176, h: 122, r: 8 },
        { kind: "rect", x: 155, y: 1036, w: 20, h: 36 },
        { kind: "rect", x: 118, y: 1068, w: 94, h: 10, r: 3 },
      ],
      lines: ["M52 1210 H448", "M250 1104 V1330", "M200 1160 H300", "M92 930 H236 V1020 H92 Z"],
    },
    {
      id: "rug",
      role: "accent",
      depth: 0.7,
      tint: 1,
      shapes: [{ kind: "path", d: "M430 1366 L744 1366 L716 1330 L456 1330 Z" }],
      lines: ["M470 1348 H704", "M430 1366 l-10 10 M470 1366 l-6 10 M510 1366 l-4 10 M550 1366 l-2 10 M590 1366 v10 M630 1366 l2 10 M670 1366 l4 10 M710 1366 l6 10 M744 1366 l10 10"],
    },
    {
      // Standing in prayer (qiyam), seen from the side, facing right: a long thobe, the head a little
      // bowed, the near arm folded so the hands rest on the chest.
      id: "praying",
      role: "accent",
      depth: 0.75,
      shapes: [
        { kind: "circle", cx: 612, cy: 816, r: 40 },
        { kind: "path", d: "M590 846 Q560 856 552 884 Q546 930 546 1000 L540 1332 L670 1332 Q664 1150 662 1010 Q664 930 652 892 Q644 860 628 848 Z" },
        { kind: "ellipse", cx: 600, cy: 1340, rx: 30, ry: 9 },
        { kind: "ellipse", cx: 644, cy: 1340, rx: 30, ry: 9 },
      ],
      over: [
        { kind: "rect", x: 588, y: 878, w: 30, h: 118, r: 15, rotate: [6, 603, 880] },
        { kind: "rect", x: 600, y: 970, w: 76, h: 28, r: 14, rotate: [-54, 614, 984] },
        { kind: "circle", cx: 656, cy: 932, r: 14 },
      ],
    },
    {
      // Standing, looking at the one who prays (facing left).
      id: "colleague-standing",
      role: "figure",
      depth: 0.8,
      tint: 1,
      shapes: [
        { kind: "circle", cx: 960, cy: 770, r: 40 },
        { kind: "path", d: "M924 762 L908 776 L924 784 Z" },
        { kind: "rect", x: 948, y: 804, w: 24, h: 22 },
        { kind: "path", d: "M934 822 Q900 826 898 860 L902 1090 L908 1090 L912 1336 L954 1336 L958 1130 L964 1130 L968 1336 L1010 1336 L1014 1090 L1020 1090 L1022 860 Q1020 826 986 822 Z" },
      ],
      over: [{ kind: "rect", x: 892, y: 836, w: 28, h: 232, r: 14, rotate: [5, 906, 840] }],
    },
    {
      id: "plant",
      role: "front",
      depth: 0.95,
      shapes: [
        ...leaves(116, 1650, [-48, -26, -6, 14, 34, 52], 24, 96),
        { kind: "path", d: "M40 1648 L192 1648 L174 1806 L58 1806 Z" },
      ],
      lines: ["M44 1676 H188"],
    },
  ],
};

/** kahf cave-1 (18:17): the sun inclines away to the right when it rises, the middle stays in shade;
 * the dog at the threshold, its forelegs stretched (18:18). The youths are never shown. */
export const CAVE: SceneSpec = {
  id: "cave",
  title: { ar: "جوه الكهف… الشمس وهي طالعة تميل عنهم يمين…", en: "Inside the cave… the rising sun turned away from them to the right…" },
  layers: [
    { id: "outside", role: "sky", depth: 0, shapes: [{ kind: "rect", x: 300, y: 820, w: 380, h: 500 }] },
    {
      id: "hills",
      role: "far",
      depth: 0.1,
      shapes: [{ kind: "path", d: "M300 1180 Q400 1110 480 1150 Q560 1090 680 1160 V1320 H300 Z" }],
    },
    {
      id: "back-wall",
      role: "wall",
      depth: 0.2,
      shapes: [{ kind: "path", d: "M0 0 H1080 V1920 H0 Z M330 1300 L330 1080 Q330 880 490 870 Q650 880 650 1080 L650 1300 Z" }],
    },
    {
      id: "walls",
      role: "wall",
      depth: 0.35,
      tint: 1,
      shapes: [
        { kind: "path", d: "M0 0 L390 0 Q300 220 250 520 Q205 820 236 1110 L190 1500 L0 1620 Z" },
        { kind: "path", d: "M1080 0 L700 0 Q800 230 832 530 Q880 830 850 1150 L900 1500 L1080 1580 Z" },
        { kind: "path", d: "M0 0 H1080 V190 Q920 270 780 214 Q650 300 540 236 Q410 300 300 206 Q160 270 0 196 Z" },
      ],
      lines: ["M250 600 Q280 640 270 700", "M820 640 Q800 700 830 760", "M760 214 L770 260", "M540 236 L548 290", "M300 206 L306 250"],
    },
    {
      id: "floor",
      role: "floor",
      depth: 0.4,
      shapes: [{ kind: "path", d: "M0 1500 Q300 1316 540 1306 Q800 1316 1080 1470 V1920 H0 Z" }],
      lines: ["M200 1560 Q380 1500 520 1520", "M640 1530 Q800 1520 940 1580"],
    },
    {
      id: "dog",
      role: "figure",
      depth: 0.45,
      shapes: [
        { kind: "ellipse", cx: 478, cy: 1284, rx: 100, ry: 30 },
        { kind: "circle", cx: 580, cy: 1262, r: 28 },
        { kind: "ellipse", cx: 608, cy: 1272, rx: 20, ry: 11 },
        { kind: "path", d: "M568 1242 L560 1208 L590 1238 Z" },
        { kind: "rect", x: 560, y: 1294, w: 86, h: 13, r: 6 },
        { kind: "path", d: "M384 1282 Q344 1264 330 1294 Q356 1284 382 1298 Z" },
      ],
    },
    {
      id: "inner-rocks",
      role: "object",
      depth: 0.6,
      shapes: [
        { kind: "path", d: "M0 0 H232 Q160 300 122 700 Q92 1100 134 1500 L62 1920 H0 Z" },
        { kind: "path", d: "M1080 0 H858 Q958 300 990 700 Q1022 1100 962 1500 L1032 1920 H1080 Z" },
      ],
      lines: ["M140 900 Q120 960 150 1020", "M980 980 Q1000 1040 975 1100"],
    },
    {
      id: "front-rocks",
      role: "front",
      depth: 0.92,
      shapes: [
        { kind: "path", d: "M0 1700 Q150 1620 300 1690 Q420 1640 520 1720 L540 1920 H0 Z" },
        { kind: "path", d: "M1080 1650 Q930 1600 820 1700 Q760 1760 760 1920 H1080 Z" },
      ],
    },
  ],
};

/** The sunbeam of the cave: from the mouth to the right-hand wall; the middle in shade. */
export const CAVE_BEAM = { d: "M600 960 L644 1214 L884 1430 L862 850 Z", patch: { cx: 868, cy: 1140, rx: 52, ry: 260 } };

/** kahf faith-lesson: a line to remember, on its own. */
export const LINE = {
  ar: ["لما تقف لوحدك عشان ربنا…", "ربنا هو اللي بيثبّت قلبك."],
  en: "When you stand alone for God… it is God who steadies your heart.",
};

export const SCENES = { office: OFFICE, cave: CAVE } as const;
export type ShotId = keyof typeof SCENES | "line";
