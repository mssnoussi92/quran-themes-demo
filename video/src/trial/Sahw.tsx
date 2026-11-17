// The series « إزاي أعملها؟ » (content/trial/sahw.yaml; docs/scripts/sahw.md), pilot سجود السهو. The montage the owner
// validated on four stills (docs/retention/sahw-style*.jpg, 2026-11-17, « je valide sauf je veux utiliser les numéros
// 1 2 3 et non pas ١ ٢ ٣ »): a prayer room at dawn drawn here (window, beam, floor, rug) over a generated ground; an
// anonymous faceless figure that prays (the figure of « بص تاني »; his rule of 2026-11-15) and makes the mistake in the
// first second; the track of the prayer above (one tile per rak'ah, tashahhud and salam, right to left, the numbers in
// 1 2 3); the two prostrations sliding in, before or after the salam; the card of the four schools, each with its view
// as the Kuwaiti Encyclopedia gives it (the narration says it, the reference is written under it). Never the Prophet ﷺ
// nor a Companion: their prayer is the track alone and rows of lights. Nothing of the unseen (no shape for the whisperer).
// The words of the verse written large come from the registry (tools/trial/sahw.py, sahwData.ts), never typed here.
import React from "react";
import { Easing, interpolate } from "remotion";
import { FONT } from "../fonts";
import { Figure, mix, SEG, type Pose } from "./Lens";
import { SAHW_WORDS } from "./sahwData";
import type { Drawn, LayoutOverride } from "./Trial";

const W = 1080;
const H = 1920;
const GOLD = "#f2c75c";
const PALE = "#f4efe6";
const DIM = "#8a8f9e";
const RED = "#ff6b6b";
const INK = "#0b0e18";
const FLOOR = 1250;          // where the floor starts; the rug and the figure stand on it
const FEET = 1336;           // the line the figure's lowest point rests on
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...CLAMP, easing: ease });
const rad = (d: number) => (d * Math.PI) / 180;
const chance = (i: number, salt = 0) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

type Phrase = (id: string, n: number) => number;

// ---------------------------------------------------------------------------------------------------- the figure

/** The positions of the prayer, facing the qibla (to the right). */
const PRAYER: Record<string, Pose> = {
  qiyam: { torso: 0, head: -10, armF: [12, -160], armB: [8, -158], legF: [3, -2], legB: [-3, -1] },
  ruku: { torso: 90, head: 0, armF: [-52, 0], armB: [-48, 2], legF: [2, 0], legB: [-2, 0] },
  julus: { torso: 0, head: -12, armF: [24, 52], armB: [20, 56], legF: [90, -178], legB: [86, -176] },
  sujud: { torso: 124, head: -22, armF: [18, 70], armB: [12, 74], legF: [12, -102], legB: [8, -98] },
  dua: { torso: 0, head: -6, armF: [36, 112], armB: [30, 116], legF: [90, -178], legB: [86, -176] },
  think: { torso: 6, head: -24, armF: [22, 56], armB: [18, 60], legF: [90, -178], legB: [86, -176] },
};

/** How far below the pelvis the lowest point of a pose is (a foot, a knee, a hand, the head on the ground). */
const lowest = (p: Pose) => {
  const down = (d: number): [number, number] => [Math.sin(rad(d)), Math.cos(rad(d))];
  const at = (o: [number, number], d: [number, number], l: number): [number, number] => [o[0] + d[0] * l, o[1] + d[1] * l];
  const up: [number, number] = [Math.sin(rad(p.torso)), -Math.cos(rad(p.torso))];
  const neck = at([0, 0], up, SEG.torso);
  const shoulder = at([0, 0], up, SEG.torso - 12);
  const headDir: [number, number] = [Math.sin(rad(p.torso - p.head)), -Math.cos(rad(p.torso - p.head))];
  const head = at(neck, headDir, SEG.neck + SEG.head * 0.8);
  const limb = (o: [number, number], [a, b]: [number, number], l1: number, l2: number) => {
    const j = at(o, down(a), l1);
    return [j, at(j, down(a + b), l2)];
  };
  const pts = [...limb(shoulder, p.armF, SEG.upper, SEG.fore), ...limb(shoulder, p.armB, SEG.upper, SEG.fore),
    ...limb([0, 0], p.legF, SEG.thigh, SEG.shin), ...limb([0, 0], p.legB, SEG.thigh, SEG.shin), [head[0], head[1] + SEG.head]];
  return Math.max(...pts.map((q) => q[1])) + 13;
};

/** The figure in a pose, resting on the floor line. */
const Praying: React.FC<{ id: string; x: number; pose: Pose; scale?: number; rim?: string }> = ({ id, x, pose, scale = 1.42, rim = "#f3c98b" }) => (
  <Figure id={id} x={x} y={FEET - lowest(pose) * scale} scale={scale} pose={pose} rim={rim} />
);

/** Two prostrations, sitting between them, from `from` seconds: the pose at time `t`. */
const twoProstrations = (t: number, from: number): Pose => {
  const keys: [number, keyof typeof PRAYER][] = [[0, "julus"], [0.9, "julus"], [1.4, "sujud"], [2.5, "sujud"], [3.0, "julus"], [3.6, "julus"], [4.1, "sujud"], [5.2, "sujud"], [5.7, "julus"]];
  const u = t - from;
  if (u <= 0) return PRAYER.julus;
  for (let k = 1; k < keys.length; k++) {
    if (u <= keys[k][0]) return mix(PRAYER[keys[k - 1][1]], PRAYER[keys[k][1]], ease((u - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0])));
  }
  return PRAYER.julus;
};

// ---------------------------------------------------------------------------------------------------- the room

/** A prayer room at dawn: an arched window on the right (the qibla), its beam on the floor, a rug. */
const Room: React.FC<{ t: number; dim?: number; rug?: boolean }> = ({ t, dim = 0, rug = true }) => {
  const breathe = 0.9 + 0.1 * Math.sin(t * 0.5);
  return (
    <g>
      <defs>
        <radialGradient id="sahw-glow" cx="0.68" cy="0.48" r="0.5">
          <stop offset="0" stopColor="#ffc47a" stopOpacity={0.42 * breathe} />
          <stop offset="1" stopColor="#ffc47a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="sahw-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe2b0" />
          <stop offset="0.55" stopColor="#f6b46b" />
          <stop offset="1" stopColor="#d98a4e" />
        </linearGradient>
        <linearGradient id="sahw-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2a2c" />
          <stop offset="1" stopColor="#140f13" />
        </linearGradient>
        <linearGradient id="sahw-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd296" stopOpacity={0.28} />
          <stop offset="1" stopColor="#ffd296" stopOpacity={0} />
        </linearGradient>
        <filter id="sahw-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#sahw-glow)" />
      <path d="M 600 1230 L 600 960 A 140 140 0 0 1 880 960 L 880 1230 Z" fill="url(#sahw-window)" opacity={0.5 * breathe} filter="url(#sahw-soft)" />
      <path d="M 600 1230 L 600 960 A 140 140 0 0 1 880 960 L 880 1230" fill="none" stroke="#e8b878" strokeOpacity={0.35} strokeWidth={4} />
      <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill="url(#sahw-floor)" />
      <path d={`M 600 ${FLOOR} L 880 ${FLOOR} L 1000 ${H} L 300 ${H} Z`} fill="url(#sahw-beam)" />
      {Array.from({ length: 26 }, (_, i) => {
        const x = 610 + 260 * chance(i, 1) + 30 * Math.sin(t * 0.3 + i);
        const y = 900 + ((chance(i, 2) * 420 + t * (6 + 8 * chance(i, 3))) % 420);
        return <circle key={i} cx={x} cy={y} r={1.6 + 2 * chance(i, 4)} fill="#ffe8c4" opacity={0.25 + 0.35 * chance(i, 5)} />;
      })}
      {rug ? (
        <g>
          <path d={`M 250 ${FEET - 26} L 830 ${FEET - 26} L 880 ${FEET + 30} L 200 ${FEET + 30} Z`} fill="#6a2328" stroke="#b8894c" strokeWidth={3} />
          <path d={`M 268 ${FEET - 18} L 812 ${FEET - 18} L 856 ${FEET + 22} L 224 ${FEET + 22} Z`} fill="none" stroke="#b8894c" strokeOpacity={0.6} strokeWidth={2} />
        </g>
      ) : null}
      {dim > 0 ? <rect x={0} y={0} width={W} height={H} fill="#05060d" opacity={dim} /> : null}
    </g>
  );
};

/** Rows of small lights facing the window: a congregation, never drawn as people. `rise` lifts them a little (they
 * stood up with him); `whisper` makes ripples run between them. */
const Rows: React.FC<{ t: number; rise?: number; whisper?: number; opacity?: number }> = ({ t, rise = 0, whisper = 0, opacity = 1 }) => (
  <g opacity={opacity}>
    {[0, 1, 2].map((r) => (
      <g key={r}>
        {Array.from({ length: 7 - r }, (_, i) => {
          const x = 170 + r * 40 + i * (96 - r * 6);
          const y = FEET - 30 - r * 70 - 26 * rise * (1 - r * 0.2);
          const glow = 0.65 + 0.25 * Math.sin(t * 1.4 + i * 0.9 + r);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={20 - r * 3} fill="#ffd38a" opacity={0.18 * glow} />
              <circle cx={x} cy={y} r={8 - r} fill="#ffe2b0" opacity={glow} />
              {whisper > 0 && i < 6 - r ? (
                <path d={`M ${x + 14} ${y - 18} q ${(96 - r * 6) / 2 - 14} ${-26 - 10 * Math.sin(t * 6 + i)} ${96 - r * 6 - 28} 0`}
                      fill="none" stroke={PALE} strokeWidth={2.5} strokeDasharray="4 7" opacity={whisper * (0.35 + 0.35 * Math.sin(t * 5 + i * 1.7))} />
              ) : null}
            </g>
          );
        })}
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------------------------------------------- the track

type TileState = "plain" | "done" | "now" | "miss" | "gold";
type Tile = { label: string; sub?: string; state: TileState; on?: number; wide?: boolean };

/** The track of the prayer, right to left, above the text: one tile per rak'ah, tashahhud and salam. */
const Track: React.FC<{ tiles: Tile[]; y?: number; t: number; opacity?: number }> = ({ tiles, y = 300, t, opacity = 1 }) => {
  const shown = tiles.filter((x) => (x.on ?? 1) > 0);
  const width = (x: Tile) => (x.wide ? 150 : x.sub && x.label.length > 2 ? 118 : 92);
  const gap = 10;
  const total = shown.reduce((s, x) => s + width(x), 0) + gap * Math.max(0, shown.length - 1);
  let right = W / 2 + total / 2;
  const colors: Record<TileState, { fill: string; stroke: string; text: string; dash?: string }> = {
    plain: { fill: "rgba(255,255,255,0.07)", stroke: "rgba(255,255,255,0.25)", text: PALE },
    done: { fill: "rgba(233,196,106,0.16)", stroke: "#e9c46a", text: PALE },
    now: { fill: "rgba(233,196,106,0.34)", stroke: "#ffd77a", text: PALE },
    miss: { fill: "rgba(230,70,70,0.24)", stroke: RED, text: "#ffb3b3", dash: "9 7" },
    gold: { fill: "rgba(242,199,92,0.42)", stroke: "#ffe08a", text: "#fff3cf" },
  };
  return (
    <g opacity={opacity}>
      {shown.map((x, k) => {
        const w = width(x);
        right -= w;
        const c = colors[x.state];
        const on = x.on ?? 1;
        const pulse = x.state === "now" || x.state === "miss" || x.state === "gold" ? 0.5 + 0.5 * Math.sin(t * 4) : 0;
        const left = right;
        right -= gap;
        return (
          <g key={k} opacity={on} transform={`translate(0 ${-18 * (1 - on)})`}>
            {pulse > 0 ? <rect x={left - 4} y={y - 4} width={w + 8} height={92} rx={18} fill="none" stroke={c.stroke} strokeOpacity={0.35 * pulse} strokeWidth={6} /> : null}
            <rect x={left} y={y} width={w} height={84} rx={15} fill={c.fill} stroke={c.stroke} strokeWidth={x.state === "miss" ? 3 : 2} strokeDasharray={c.dash} />
            <text x={left + w / 2} y={y + (x.sub ? 44 : 57)} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700}
                  fontSize={x.label.length > 3 ? 32 : 42} fill={c.text}>{x.label}</text>
            {x.sub ? <text x={left + w / 2} y={y + 72} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontSize={21} fill={c.text} opacity={0.85}>{x.sub}</text> : null}
          </g>
        );
      })}
    </g>
  );
};

const R = (n: number, state: TileState, on?: number): Tile => ({ label: String(n), state, on });
const TASH = (state: TileState, on?: number): Tile => ({ label: "◦", sub: "تشهد", state, on });
const SALAM = (state: TileState, sub?: string, on?: number): Tile => ({ label: "سلام", sub, state, on, wide: !!sub });
const SUJUD = (on: number): Tile => ({ label: "سجدتين", sub: "للسهو", state: "gold", on, wide: true });

// ---------------------------------------------------------------------------------------------------- the schools

type Lane = { school: string; cells: Tile[]; on: number; note?: string };

/** The card of the four schools: one row each, the school's name on the right and its view drawn as a short track
 * (or written, for the doubt). */
const Lanes: React.FC<{ t: number; lanes: Lane[]; top?: number }> = ({ t, lanes, top = 850 }) => (
  <g>
    <rect x={48} y={top - 30} width={W - 96} height={lanes.length * 128 + 40} rx={28} fill={INK} fillOpacity={0.82} stroke={GOLD} strokeOpacity={0.35} strokeWidth={2} />
    {lanes.map((lane, k) => {
      const y = top + k * 128;
      return (
        <g key={lane.school} opacity={0.25 + 0.75 * lane.on} transform={`translate(${24 * (1 - lane.on)} 0)`}>
          <text x={W - 92} y={y + 58} textAnchor="start" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={44} fill={GOLD}>{lane.school}</text>
          {lane.note ? (
            <text x={W - 300} y={y + 56} textAnchor="start" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={38} fill={PALE} opacity={lane.on}>{lane.note}</text>
          ) : (
            <g transform={`translate(${-120} 0)`}><Track tiles={lane.cells} t={t} y={y} /></g>
          )}
        </g>
      );
    })}
  </g>
);

const before = (on: number): Tile[] => [TASH("done"), SUJUD(1), SALAM("done")].map((x) => ({ ...x, on }));
const after = (on: number): Tile[] => [TASH("done"), SALAM("done"), SUJUD(1)].map((x) => ({ ...x, on }));
const hanafiAfter = (on: number): Tile[] => [TASH("done"), SALAM("done", "مرة واحدة"), SUJUD(1), TASH("done"), SALAM("done")].map((x) => ({ ...x, on }));

// ---------------------------------------------------------------------------------------------------- the words

const BigWords: React.FC<{ t: number; wayl: number; letter: number; an: number; fi: number }> = ({ t, wayl, letter, an, fi }) => (
  <g>
    <g opacity={wayl} transform={`translate(540 ${1010 - 70 * letter}) scale(${1 - 0.4 * letter})`}>
      <text x={0} y={0} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={190} fill={GOLD}
            style={{ filter: `drop-shadow(0 0 ${30 + 10 * Math.sin(t * 2)}px rgba(242,199,92,0.55))` }}>{SAHW_WORDS.wayl}</text>
    </g>
    <g opacity={letter}>
      <g opacity={an}>
        <text x={700} y={1160} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={150} fill={GOLD}>{SAHW_WORDS.an}</text>
        <rect x={610} y={1200} width={180 * an} height={9} rx={4} fill={GOLD} />
      </g>
      <g opacity={fi}>
        <text x={380} y={1160} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={130} fill={DIM}>في</text>
        <rect x={300} y={1112} width={160 * fi} height={10} rx={5} fill={DIM} />
      </g>
      <text x={540} y={1300} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={64} fill="#cfc7b8">{SAHW_WORDS.salatihim}</text>
    </g>
  </g>
);

/** The counter of the doubt: « 3 » and « 4 » taking turns, a « ؟ » between; `settle` stops it on 3. */
const Counter: React.FC<{ t: number; settle: number }> = ({ t, settle }) => {
  const swing = 0.5 + 0.5 * Math.sin(t * 5.2);
  const three = settle + (1 - settle) * swing;
  const four = (1 - settle) * (1 - swing);
  return (
    <g transform="translate(540 1010)">
      <circle r={150} fill={INK} fillOpacity={0.6} stroke={GOLD} strokeOpacity={0.5} strokeWidth={3} />
      <text x={0} y={70} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={200} fill={PALE} opacity={three}>3</text>
      <text x={0} y={70} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={200} fill={PALE} opacity={four}>4</text>
      <text x={130} y={-100} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={96} fill={GOLD} opacity={1 - settle}>؟</text>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------- the episodes

type Ctx = { t: number; show: (id: string) => number; since: (id: string) => number; phrase: Phrase };
const FIG_X = 440;

const SahunPicture: Drawn = ({ t, show, since, phrase: said }) => {
  const phrase: Phrase = said ?? ((id, n) => since(id) + n);
  const letter = show("letter");
  const room = Math.max(show("room"), show("dua"), show("end"));
  const pose = show("dua") > 0 ? mix(PRAYER.think, PRAYER.dua, ramp(t, since("dua") + 0.3, since("dua") + 1.4)) : show("end") > 0 ? twoProstrations(t, since("end") + 0.6) : PRAYER.think;
  return (
    <g>
      <Room t={t} dim={0.55 * (t < since("word") + 0.5 ? 1 : Math.max(show("word"), letter))} />
      <g opacity={room}><Praying id="sh-fig" x={FIG_X} pose={pose} /></g>
      <BigWords t={t} wayl={t < since("word") + 0.5 ? 1 : Math.max(show("word"), letter)} letter={letter}
                an={ramp(t, phrase("letter", 1) - 0.2, phrase("letter", 1) + 0.4)} fi={ramp(t, phrase("letter", 2) - 0.2, phrase("letter", 2) + 0.4)} />
    </g>
  );
};

const KhamsPicture: Drawn = ({ t, show, since, phrase: said }) => {
  const phrase: Phrase = said ?? ((id, n) => since(id) + n);
  const rows = Math.max(show("track5"), show("rows"), show("voice"));
  const end = show("end");
  return (
    <g>
      <Room t={t} dim={0.35 * show("lanes")} rug={end > 0} />
      <Rows t={t} opacity={rows} whisper={show("rows") * ramp(t, since("rows"), since("rows") + 0.6) * (1 - ramp(t, phrase("rows", 6) - 0.3, phrase("rows", 6) + 0.3))} />
      <g opacity={end}><Praying id="kh-fig" x={FIG_X} pose={twoProstrations(t, since("end") + 0.6)} /></g>
      {show("lanes") > 0 ? (
        <g opacity={show("lanes")}>
          <Lanes t={t} lanes={[
            { school: "الحنفي", cells: after(1), on: ramp(t, phrase("lanes", 3) - 0.2, phrase("lanes", 3) + 0.4) },
            { school: "المالكي", cells: after(1), on: ramp(t, phrase("lanes", 4) - 0.2, phrase("lanes", 4) + 0.4) },
            { school: "الشافعي", cells: before(1), on: ramp(t, phrase("lanes", 6) - 0.2, phrase("lanes", 6) + 0.4) },
            { school: "الحنبلي", cells: before(1), on: ramp(t, phrase("lanes", 7) - 0.2, phrase("lanes", 7) + 0.4) },
          ]} />
        </g>
      ) : null}
    </g>
  );
};

const NasitPicture: Drawn = ({ t, show, since, phrase: said }) => {
  const phrase: Phrase = said ?? ((id, n) => since(id) + n);
  const stand = show("stand");
  const rise = ramp(t, since("stand") + 0.15, since("stand") + 1.0);
  const ghost = ramp(t, since("stand") + 0.9, since("stand") + 1.4);
  const fix = show("fix");
  const room = Math.max(show("room"), show("end"));
  const pose = stand > 0 ? mix(PRAYER.julus, PRAYER.qiyam, rise) : fix > 0 ? twoProstrations(t, since("fix") + 0.3)
    : show("end") > 0 ? twoProstrations(t, since("end") + 0.6) : PRAYER.julus;
  const lanes = show("lanes");
  const hanafi = show("hanafi");
  return (
    <g>
      <Room t={t} dim={0.35 * Math.max(lanes, hanafi)} />
      <Rows t={t} opacity={show("rows")} rise={ramp(t, phrase("rows", 0) + 0.6, phrase("rows", 0) + 1.6)} />
      <g opacity={stand * ghost * 0.32}><Praying id="na-ghost" x={FIG_X - 70} pose={PRAYER.julus} rim={RED} /></g>
      <g opacity={Math.max(stand, fix, room)}><Praying id="na-fig" x={FIG_X} pose={pose} /></g>
      {lanes > 0 ? (
        <g opacity={lanes}>
          <Lanes t={t} lanes={[
            { school: "المالكي", cells: before(1), on: ramp(t, phrase("lanes", 1) - 0.2, phrase("lanes", 1) + 0.4) },
            { school: "الشافعي", cells: before(1), on: ramp(t, phrase("lanes", 2) - 0.2, phrase("lanes", 2) + 0.4) },
            { school: "الحنبلي", cells: before(1), on: ramp(t, phrase("lanes", 3) - 0.2, phrase("lanes", 3) + 0.4) },
            { school: "الحنفي", cells: [], note: "…", on: 0 },
          ]} />
        </g>
      ) : null}
      {hanafi > 0 ? (
        <g opacity={hanafi}>
          <Lanes t={t} top={980} lanes={[{
            school: "الحنفي", on: 1,
            cells: hanafiAfter(1).map((c, k) => ({ ...c, state: t >= phrase("hanafi", 2 + k) - 0.1 ? (c.state === "gold" ? "gold" : "now") : "plain", on: 0.35 + 0.65 * ramp(t, phrase("hanafi", 2 + k) - 0.2, phrase("hanafi", 2 + k) + 0.3) })),
          }]} />
        </g>
      ) : null}
    </g>
  );
};

const ShakkPicture: Drawn = ({ t, show, since, phrase: said }) => {
  const phrase: Phrase = said ?? ((id, n) => since(id) + n);
  const count = Math.max(show("count"), show("voice"));
  const fix = show("fix");
  const settle = fix > 0 ? ramp(t, phrase("fix", 3) - 0.3, phrase("fix", 3) + 0.3) : 0;
  const pose = fix > 0 ? (t < phrase("fix", 5) ? PRAYER.qiyam : twoProstrations(t, phrase("fix", 5))) : show("end") > 0 ? twoProstrations(t, since("end") + 0.6) : PRAYER.qiyam;
  const lanes = show("lanes");
  return (
    <g>
      <Room t={t} dim={0.4 * Math.max(lanes, count * 0.6)} />
      <g opacity={Math.max(count, fix, show("room"), show("end"))}><Praying id="sk-fig" x={FIG_X - 40} pose={pose} /></g>
      <g opacity={Math.max(count, fix * (1 - ramp(t, phrase("fix", 4), phrase("fix", 4) + 0.6)))}>
        <g transform="translate(382 253) scale(0.7)"><Counter t={t} settle={settle} /></g>
      </g>
      {lanes > 0 ? (
        <g opacity={lanes}>
          <Lanes t={t} lanes={[
            { school: "المالكي", cells: [], note: "تبني على الأقل", on: ramp(t, phrase("lanes", 0) - 0.2, phrase("lanes", 0) + 0.4) },
            { school: "الشافعي", cells: [], note: "تبني على الأقل", on: ramp(t, phrase("lanes", 1) - 0.2, phrase("lanes", 1) + 0.4) },
            { school: "الحنبلي", cells: [], note: "لوحدك: الأقل", on: ramp(t, phrase("lanes", 2) - 0.2, phrase("lanes", 2) + 0.4) },
            { school: "الحنفي", cells: [], note: t >= phrase("lanes", 8) - 0.1 ? "مفيش ظن: الأقل" : t >= phrase("lanes", 6) - 0.1 ? "كتير: غالب ظنك" : "أول مرة: تعيد",
              on: ramp(t, phrase("lanes", 3) - 0.2, phrase("lanes", 3) + 0.4) },
          ]} />
        </g>
      ) : null}
    </g>
  );
};

export const SAHW_PICTURES: Record<string, Drawn> = { sahun: SahunPicture, khams: KhamsPicture, nasit: NasitPicture, shakk: ShakkPicture };

// ---------------------------------------------------------------------------------------------------- the track, still

/** The track above the text, in the scenes where the prayer is followed step by step. */
const tracks: Record<string, (c: Ctx) => { tiles: Tile[]; opacity: number }> = {
  khams: ({ t, show, since, phrase }) => {
    const on = (k: number) => ramp(t, since("track5") + 0.1 + 0.14 * k, since("track5") + 0.3 + 0.14 * k);
    const fifth = t >= since("track5") + 0.9 ? "miss" : "now";
    const sujud = ramp(t, phrase("rows", 6) - 0.1, phrase("rows", 6) + 0.5);
    return {
      opacity: Math.max(show("track5"), show("rows")),
      tiles: [R(1, "done", on(0)), R(2, "done", on(1)), TASH("done", on(2)), R(3, "done", on(3)), R(4, "done", on(4)), R(5, fifth, on(5)), SALAM("done", undefined, on(6)), SUJUD(sujud)],
    };
  },
  nasit: ({ t, show, since, phrase }) => {
    const missed = t >= since("stand") + 0.9 ? "miss" : "now";
    const up = t >= since("stand") + 0.9;
    const fix = show("fix") > 0 ? 1 : 0;
    const sujud = fix ? ramp(t, since("fix") - 0.1, since("fix") + 0.5) : show("rows") > 0 ? ramp(t, phrase("rows", 4) - 0.1, phrase("rows", 4) + 0.5) : 0;
    const far = sujud > 0 ? "done" : "plain";
    return {
      opacity: Math.max(show("stand"), show("rows"), show("fix")),
      tiles: [R(1, "done"), R(2, "done"), TASH(missed), R(3, sujud > 0 ? "done" : up ? "now" : "plain"), R(4, far), TASH(far), SUJUD(sujud), SALAM(sujud > 0.9 ? "done" : "plain")],
    };
  },
  shakk: ({ t, show, since, phrase }) => {
    const fix = show("fix") > 0;
    const four = fix ? ramp(t, phrase("fix", 4) - 0.1, phrase("fix", 4) + 0.4) : 0;
    const sujud = fix ? ramp(t, phrase("fix", 5) - 0.1, phrase("fix", 5) + 0.5) : 0;
    const doubt: Tile = { label: "؟", state: "miss", on: 1 - (fix ? ramp(t, since("fix"), since("fix") + 0.5) : 0) };
    return {
      opacity: Math.max(show("count"), show("fix")),
      tiles: [R(1, "done"), R(2, "done"), TASH("done"), ...(fix ? [R(3, "done", 1), R(4, four > 0.5 ? "done" : "now", 0.3 + 0.7 * four), SUJUD(sujud), SALAM("plain")] : [doubt])],
    };
  },
};

const overlay = (id: string): Drawn =>
  function SahwTrack({ t, show, since, phrase: said }) {
    const phrase: Phrase = said ?? ((s, n) => since(s) + n);
    const make = tracks[id];
    if (!make) return null;
    const { tiles, opacity } = make({ t, show, since, phrase });
    return opacity > 0 ? <Track tiles={tiles} t={t} opacity={opacity} /> : null;
  };

export const SAHW_OVERLAYS: Record<string, Drawn> = Object.fromEntries(["khams", "nasit", "shakk"].map((id) => [id, overlay(id)]));
/** The text under the track (300 to 384): from 432; the picture from 820; the translation and the reference under it. */
const LAYOUT: LayoutOverride = { top: 432, height: 390, size: 90 };
export const SAHW_LAYOUTS: Record<string, LayoutOverride> = Object.fromEntries(["sahun", "khams", "nasit", "shakk"].map((id) => [id, LAYOUT]));
