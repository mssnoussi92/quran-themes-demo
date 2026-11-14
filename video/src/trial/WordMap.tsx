// The series « خريطة كلمة » (content/trial/map.yaml; docs/themes.md), a voiceless pilot: the text is on the screen and
// the picture is the map of one word in the 6,236 verses, in the counting style (docs/model.md, « Le style compteur »).
// Its number made of particles, the grid where the verses that hold it light up in the order of the mushaf, the same
// dots gathered by form and then by surah (a unit chart: one dot, one time the word comes), the first and the last time
// ringed then locked, the verse of the answer at rest. Every number comes from tools/trial/wordmap.py (mapData.ts),
// never typed here. Nobody is drawn; nothing of the unseen.
import type React from "react";
import { FONT } from "../fonts";
import { MAP } from "./mapData";
import { BASE, CountDefs, GRID_BOTTOM, GRID_LEFT, GRID_MIDDLE, GRID_TOP, Particles, type Shape, at, dots } from "./Count";
import { Defs, Stars, chance, clamp } from "./Signs";
import type { Drawn, LayoutOverride } from "./Trial";

const W = 1080;
const GOLD = "#f0c46a";
const INK = "#03050d";
const PALE = "#f4efe2";

const ease = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
const after = (t: number, from: number, seconds: number) => ease((t - from) / seconds);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

type P = { x: number; y: number };
const circle = (p: P, r: number) =>
  `M${(p.x - r).toFixed(1)} ${p.y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const Q = MAP.words.qalb;
const SHAPES = Q.particles as unknown as Record<string, Shape>;
const LIT = [...Q.lit];
const FORMS = Q.forms as Record<string, number>;

// ---- the grid of the verses, the word lit in it ------------------------------------------------------------------------

/** `appear`: how much of the verses that hold the word are lit yet, in the order of the mushaf; `lit`: how bright they are;
 * `breathe`: a slow pulse, three groups out of phase. */
const MapGrid: React.FC<{ t: number; appear?: number; lit?: number; breathe?: number }> = ({ t, appear = 1, lit = 1, breathe = 0 }) => {
  const shown = LIT.slice(0, Math.round(LIT.length * appear));
  const fresh = appear < 1 ? shown.slice(-6) : [];
  return (
    <g>
      <rect x={GRID_LEFT - 30} y={GRID_TOP - 30} width={W - 2 * GRID_LEFT + 60} height={GRID_BOTTOM - GRID_TOP + 60} rx={24} fill={INK} opacity={0.6} />
      <path d={BASE} fill={PALE} opacity={0.16} />
      <path d={dots(shown, 8)} fill={GOLD} opacity={0.13 * lit} />
      {[0, 1, 2].map((g) => (
        <path key={g} d={dots(shown.filter((_, i) => i % 3 === g), 3.4)} fill={GOLD}
              opacity={lit * (1 - breathe * 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + g * 2.1)))} />
      ))}
      {fresh.length ? <path d={dots(fresh, 6)} fill={GOLD} opacity={0.9} /> : null}
    </g>
  );
};

// ---- the same dots, gathered: by form, then by surah ----------------------------------------------------------------

const UNIT = 20;
const BAR_COLS = 8;
const BASELINE = 1215;
/** The three bars, right to left: « قلوب », « قلب », « قلبين » (the forms the corpus gives, plural, singular, dual). */
const BARS = [
  { form: "plural", word: "قلوب", x: 800 },
  { form: "singular", word: "قلب", x: 540 },
  { form: "dual", word: "قلبين", x: 280 },
] as const;
/** The k-th dot of a bar of n: from the bottom row up, right to left. */
const slot = (cx: number, k: number, n: number): P => {
  const cols = Math.min(BAR_COLS, n);
  return { x: cx + ((cols - 1) / 2 - (k % cols)) * UNIT, y: BASELINE - Math.floor(k / cols) * UNIT };
};
const barTop = (n: number) => BASELINE - (Math.ceil(n / Math.min(BAR_COLS, n)) - 1) * UNIT;

const ROW_Y = [905, 1030, 1155];
const ROW_RIGHT = 845;
const ROW_PITCH = 25;

const ranks = new Map<string, number>();
const EACH = Q.each.map(([verse, form, surah], i) => {
  const k = ranks.get(form) ?? 0;
  ranks.set(form, k + 1);
  const bar = BARS.find((b) => b.form === form);
  const inBar = slot(bar ? bar.x : W / 2, k, FORMS[form]);
  const row = Q.top.findIndex((s) => s.surah === surah);
  const before = Q.each.slice(0, i).filter(([, , s]) => s === surah).length;
  const inRow = row < 0 ? null : { x: ROW_RIGHT - before * ROW_PITCH, y: ROW_Y[row] };
  return { grid: at(verse), inBar, inRow, delay: chance(i, 61) * 0.7 };
});

/** The dots fly from the grid into the bars of the forms (`since` the scene of the forms), then into the rows of the
 * three surahs where the word comes most (`rows` the scene of the surahs); the dots of the other surahs fade. */
const Gathered: React.FC<{ t: number; since: number; rows: number | null }> = ({ t, since, rows }) => {
  const near: string[] = [];
  const far: string[] = [];
  EACH.forEach((d) => {
    if (rows === null || t < rows) {
      const k = after(t, since + 0.15 + d.delay, 0.9);
      near.push(circle({ x: mix(d.grid.x, d.inBar.x, k), y: mix(d.grid.y, d.inBar.y, k) - Math.sin(Math.PI * k) * 60 }, 3.4 + 3.4 * k));
    } else {
      const k = after(t, rows + 0.1 + d.delay * 0.8, 0.9);
      if (d.inRow) near.push(circle({ x: mix(d.inBar.x, d.inRow.x, k), y: mix(d.inBar.y, d.inRow.y, k) - Math.sin(Math.PI * k) * 40 }, 6.8 + 2.2 * k));
      else far.push(circle({ x: d.inBar.x, y: d.inBar.y + 30 * k }, 6.8));
    }
  });
  const fading = rows === null ? 0 : after(t, rows + 0.1, 0.9);
  return (
    <g>
      {far.length ? <path d={far.join("")} fill={GOLD} opacity={1 - fading} /> : null}
      <path d={near.join("")} fill={GOLD} />
    </g>
  );
};

const FormLabels: React.FC<{ t: number; since: number }> = ({ t, since }) => (
  <g>
    <line x1={130} y1={BASELINE + 16} x2={W - 130} y2={BASELINE + 16} stroke={PALE} strokeOpacity={0.25} strokeWidth={2} />
    {BARS.map((b, i) => {
      const n = FORMS[b.form];
      const counted = after(t, since + 0.6 + i * 0.25, 1.1);
      return (
        <g key={b.form}>
          <text x={b.x} y={barTop(n) - 30} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={56} fill={GOLD} opacity={clamp(counted * 3)}>
            {Math.round(n * counted)}
          </text>
          <text x={b.x} y={BASELINE + 74} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={48} fill={PALE}>
            {`«${b.word}»`}
          </text>
        </g>
      );
    })}
  </g>
);

const SurahLabels: React.FC<{ t: number; since: number }> = ({ t, since }) => (
  <g>
    {Q.top.map((s, i) => {
      const on = after(t, since + 0.9 + i * 0.2, 0.5);
      const left = ROW_RIGHT - (s.n - 1) * ROW_PITCH;
      return (
        <g key={s.surah} opacity={on}>
          <text x={1010} y={ROW_Y[i] + 15} textAnchor="end" fontFamily={FONT.arabic} fontWeight={700} fontSize={44} fill={i === 0 ? GOLD : PALE}>{s.name}</text>
          <text x={left - 34} y={ROW_Y[i] + 18} textAnchor="end" fontFamily={FONT.latin} fontWeight={700} fontSize={50} fill={i === 0 ? GOLD : PALE}>{s.n}</text>
        </g>
      );
    })}
  </g>
);

// ---- the first and the last time, ringed then locked; the verse of the answer at rest -----------------------------------

const FIRST = at(Q.first.index);
const LAST = at(Q.last.index);
const REST = at(Q.marks[0].index);

/** A pill with a place in the mushaf (« البقرة 7 »), to the left of its dot. */
const Tag: React.FC<{ p: P; text: string; opacity: number }> = ({ p, text, opacity }) => {
  const w = text.length * 22 + 40;
  return (
    <g opacity={opacity}>
      <rect x={p.x - 36 - w} y={p.y - 30} width={w} height={60} rx={30} fill={INK} fillOpacity={0.9} stroke={GOLD} strokeOpacity={0.7} strokeWidth={2} />
      <text x={p.x - 56} y={p.y + 13} textAnchor="end" fontFamily={FONT.arabic} fontWeight={700} fontSize={38} fill={GOLD}>{text}</text>
    </g>
  );
};

const Ring: React.FC<{ p: P; t: number; opacity: number }> = ({ p, t, opacity }) => {
  const r = (t * 0.7) % 1;
  return (
    <g opacity={opacity}>
      <circle cx={p.x} cy={p.y} r={14 + 34 * r} fill="none" stroke={GOLD} strokeWidth={3} opacity={1 - r} />
      <circle cx={p.x} cy={p.y} r={16} fill="none" stroke={GOLD} strokeWidth={4} />
      <circle cx={p.x} cy={p.y} r={6} fill={GOLD} />
    </g>
  );
};

/** A padlock on a dot; `shut` 0: the shackle up, 1: closed. */
const Lock: React.FC<{ p: P; shut: number; opacity: number }> = ({ p, shut, opacity }) => (
  <g transform={`translate(${p.x} ${p.y}) scale(1.5)`} opacity={opacity}>
    <circle r={30} fill={INK} fillOpacity={0.85} stroke={GOLD} strokeOpacity={0.35 + 0.5 * shut} strokeWidth={1.5} />
    <path d="M -9 -3 V -12 A 9 9 0 0 1 9 -12 V -3" transform={`translate(0 ${-8 * (1 - shut)})`} fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
    <rect x={-14} y={-5} width={28} height={22} rx={4} fill={GOLD} />
    <circle cx={0} cy={4} r={3.2} fill={INK} />
    <rect x={-1.3} y={4} width={2.6} height={7} fill={INK} />
  </g>
);

/** The verse of the answer: its dot glows, slow rings go out from it. */
const Calm: React.FC<{ p: P; t: number; opacity: number }> = ({ p, t, opacity }) => (
  <g opacity={opacity}>
    <circle cx={p.x} cy={p.y} r={46} fill={GOLD} opacity={0.12} />
    {[0, 1, 2].map((k) => {
      const r = (t * 0.32 + k / 3) % 1;
      return <circle key={k} cx={p.x} cy={p.y} r={12 + 120 * r} fill="none" stroke={GOLD} strokeWidth={2.5} opacity={0.7 * (1 - r)} />;
    })}
    <circle cx={p.x} cy={p.y} r={9} fill={GOLD} />
  </g>
);

const place = (s: { name: string; ayah: number }) => `${s.name} ${s.ayah}`;

// ---- the episode -------------------------------------------------------------------------------------------------------

const QalbPicture: Drawn = ({ t, show, since }) => {
  const hook = show("hook");
  const fall = show("grid") > 0 ? after(t, since("grid") + 0.1, 1.3) : 0;     // a cover (scene hook) never crumbles
  const grid = Math.max(show("grid"), show("first"), show("last"), show("closed"), show("rest"), show("end"));
  const gathered = Math.max(show("forms"), show("surahs"));
  const travel = after(t, since("last") + 0.1, 1.4);
  const moving = { x: mix(FIRST.x, LAST.x, travel), y: mix(FIRST.y, LAST.y, travel) };
  const locks = show("closed");
  const shut = after(t, since("closed") + 2.2, 0.35);
  const calm = Math.max(show("rest"), show("end"));
  const dim = Math.max(show("first"), show("last"), locks);
  return (
    <g>
      <Defs />
      <CountDefs />
      <Stars n={120} opacity={0.6} salt={700} />
      {grid > 0 ? (
        <g opacity={grid}>
          <MapGrid t={t} appear={show("grid") > 0.5 ? after(t, since("grid") + 0.4, 2.6) : 1}
                   lit={1 - 0.62 * dim} breathe={calm} />
        </g>
      ) : null}
      {hook > 0 || (fall > 0 && fall < 1) ? (
        <Particles to={String(Q.total)} shapes={SHAPES} cx={540} cy={GRID_MIDDLE} h={300} t={t} crumble={fall}
                   gather={0.9 + 0.1 * after(t, 0, 0.8)} />
      ) : null}
      {gathered > 0 ? (
        <g opacity={gathered}>
          <rect x={60} y={760} width={W - 120} height={590} rx={26} fill={INK} opacity={0.5} />
          <Gathered t={t} since={since("forms")} rows={show("surahs") > 0 ? since("surahs") : null} />
          {show("forms") > 0 ? <g opacity={show("forms")}><FormLabels t={t} since={since("forms")} /></g> : null}
          {show("surahs") > 0 ? <g opacity={show("surahs")}><SurahLabels t={t} since={since("surahs")} /></g> : null}
        </g>
      ) : null}
      {show("first") > 0 || show("last") > 0 ? (
        <g opacity={Math.max(show("first"), show("last"))}>
          <Ring p={FIRST} t={t} opacity={show("last") > 0.5 ? 0.55 : 1} />
          <Tag p={FIRST} text={place(Q.first)} opacity={show("first") * after(t, since("first") + 0.4, 0.5)} />
          {show("last") > 0 ? (
            <g opacity={show("last")}>
              <line x1={FIRST.x} y1={FIRST.y} x2={moving.x} y2={moving.y} stroke={GOLD} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} />
              <Ring p={moving} t={t} opacity={1} />
              <Tag p={LAST} text={place(Q.last)} opacity={after(t, since("last") + 1.5, 0.5)} />
            </g>
          ) : null}
        </g>
      ) : null}
      {locks > 0 ? (
        <g opacity={locks}>
          <line x1={FIRST.x} y1={FIRST.y} x2={LAST.x} y2={LAST.y} stroke={GOLD} strokeWidth={2} strokeDasharray="6 8" opacity={0.35} />
          <Lock p={FIRST} shut={shut} opacity={after(t, since("closed"), 0.4)} />
          <Lock p={LAST} shut={shut} opacity={after(t, since("closed") + 1.0, 0.4)} />
        </g>
      ) : null}
      {calm > 0 ? (
        <g opacity={calm}>
          <Calm p={REST} t={t} opacity={1} />
          <Tag p={REST} text={place(Q.marks[0])} opacity={show("rest") * after(t, since("rest") + 0.6, 0.6)} />
        </g>
      ) : null}
    </g>
  );
};

/** Above the veil, still: the badge of the series; while the verses light up, how many are lit. */
const QalbOverlay: Drawn = ({ t, show, since }) => {
  const counting = show("grid");
  const lit = Math.round(Q.verses * after(t, since("grid") + 0.4, 2.6));
  return (
    <>
      <g>
        <circle cx={114} cy={268} r={24} fill="none" stroke={GOLD} strokeWidth={2.5} />
        <text x={114} y={281} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={GOLD}>١</text>
        <text x={152} y={280} fontFamily={FONT.arabic} fontWeight={700} fontSize={34} fill={GOLD} style={{ filter: "drop-shadow(0 2px 10px rgba(4,7,20,.9))" }}>خريطة كلمة</text>
      </g>
      {counting > 0 ? (
        <g opacity={counting}>
          <text x={W / 2} y={1740} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={90} fill={GOLD}>{lit}</text>
          <text x={W / 2} y={1800} textAnchor="middle" fontFamily={FONT.latin} fontSize={34} fill={PALE} opacity={0.8}>{`/ ${MAP.verses}`}</text>
        </g>
      ) : null}
    </>
  );
};

export const MAP_PICTURES: Record<string, Drawn> = { qalb: QalbPicture };
export const MAP_OVERLAYS: Record<string, Drawn> = { qalb: QalbOverlay };
/** The text sits above the grid (700 to 1330), the translation and the reference under it, as in the counting style. */
export const MAP_LAYOUTS: Record<string, LayoutOverride> = {
  qalb: { top: 300, height: 360, size: 92, sub: { top: 1380 }, credit: { top: 1560, size: 26 } },
};
