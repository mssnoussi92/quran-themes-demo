// The series « خريطة كلمة » (content/trial/map.yaml; docs/themes.md; script docs/scripts/map.md): the map of one word in
// the 6,236 verses, in the counting style (docs/model.md, « Le style compteur »). A silent, fast opening (owner's request,
// 2026-11-14): the grid scanned row after row while a counter ticks up, the number landing in particles; the verses that
// hold the word, the same dots gathered by form and by surah (a unit chart: one dot, one time the word comes). Then the
// voice: the first time (and the last) ringed, locked or joined, a light going out; the verse of the answer at rest.
// One factory for every word (EPISODES). Every number comes from tools/trial/wordmap.py (mapData.ts), never typed here;
// the scan keeps the times of tools/trial/sfx.py, whose ticks fall on it. Nobody is drawn; nothing of the unseen.
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

type Place = { surah: number; ayah: number; index: number; name: string };
type Word = {
  total: number; verses: number; lit: readonly number[]; each: readonly (readonly [number, string, number])[];
  forms: Record<string, number>; top: readonly { surah: number; name: string; n: number }[];
  first: Place; last: Place; marks: readonly Place[]; particles: Record<string, Shape>;
};

// ---- the grid of the verses, the word lit in it ------------------------------------------------------------------------

// The scan of the opening (the same times as tools/trial/sfx.py, whose ticks fall on the rows it reaches): it starts at
// the first frame, SCAN_LEAD before its segment, and goes 0.5x + 0.5x² of the rows in x of its time, faster and faster.
const COLS = 96;
const ROWS = Math.floor((MAP.verses - 1) / COLS);
const SCAN_LEAD = 0.5;
const SCAN = 3.3;
const rowOf = (k: number) => Math.floor(k / COLS);
const scanRow = (t: number, since: number) => {
  const x = clamp((t - since + SCAN_LEAD) / SCAN);
  return (0.5 * x + 0.5 * x * x) * ROWS;
};

/** `lit`: the verses that hold the word; `upto`: the row the scan has reached (its line drawn, what it passed lit);
 * `bright`: how bright they are; `breathe`: a slow pulse, three groups out of phase. */
const MapGrid: React.FC<{ t: number; lit: readonly number[]; upto?: number; bright?: number; breathe?: number }> = ({ t, lit, upto, bright = 1, breathe = 0 }) => {
  const shown = upto === undefined ? [...lit] : lit.filter((k) => rowOf(k) <= upto);
  const fresh = upto !== undefined ? shown.filter((k) => rowOf(k) > upto - 1.5) : [];
  const lineY = upto === undefined ? 0 : GRID_TOP + upto * (GRID_BOTTOM - GRID_TOP) / ROWS;
  const scanning = upto !== undefined && upto < ROWS;
  return (
    <g>
      <rect x={GRID_LEFT - 30} y={GRID_TOP - 30} width={W - 2 * GRID_LEFT + 60} height={GRID_BOTTOM - GRID_TOP + 60} rx={24} fill={INK} opacity={0.6} />
      <path d={BASE} fill={PALE} opacity={0.16} />
      {scanning ? (
        <g>
          <rect x={GRID_LEFT - 24} y={lineY - 70} width={W - 2 * GRID_LEFT + 48} height={70} fill="url(#wm-scan)" />
          <line x1={GRID_LEFT - 24} y1={lineY} x2={W - GRID_LEFT + 24} y2={lineY} stroke={GOLD} strokeWidth={3} opacity={0.9} />
        </g>
      ) : null}
      <path d={dots(shown, 8)} fill={GOLD} opacity={0.13 * bright} />
      {[0, 1, 2].map((g) => (
        <path key={g} d={dots(shown.filter((_, i) => i % 3 === g), 3.4)} fill={GOLD}
              opacity={bright * (1 - breathe * 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + g * 2.1)))} />
      ))}
      {fresh.length ? <path d={dots(fresh, 6)} fill={GOLD} opacity={0.9} /> : null}
    </g>
  );
};

// ---- the same dots, gathered: by form, then by surah ----------------------------------------------------------------

const UNIT = 20;
const BAR_COLS = 8;
const BASELINE = 1215;
/** The k-th dot of a bar of n: from the bottom row up, right to left. */
const slot = (cx: number, k: number, n: number): P => {
  const cols = Math.min(BAR_COLS, n);
  return { x: cx + ((cols - 1) / 2 - (k % cols)) * UNIT, y: BASELINE - Math.floor(k / cols) * UNIT };
};
const barTop = (n: number) => BASELINE - (Math.ceil(n / Math.min(BAR_COLS, n)) - 1) * UNIT;
/** Where the bars stand, right to left, for two or three forms. */
const BAR_X: Record<number, number[]> = { 1: [540], 2: [720, 360], 3: [800, 540, 280] };

const ROW_Y = [905, 1030, 1155];
const ROW_RIGHT = 845;
const ROW_PITCH = 25;

type Bar = { form: string; word: string };
type Dot = { grid: P; inBar: P | null; inRow: P | null; delay: number };

const gather = (q: Word, bars: readonly Bar[]): Dot[] => {
  const ranks = new Map<string, number>();
  const xs = BAR_X[bars.length] ?? [];
  return q.each.map(([verse, form, surah], i) => {
    const k = ranks.get(form) ?? 0;
    ranks.set(form, k + 1);
    const b = bars.findIndex((x) => x.form === form);
    const row = q.top.findIndex((s) => s.surah === surah);
    const before = q.each.slice(0, i).filter(([, , s]) => s === surah).length;
    return {
      grid: at(verse),
      inBar: b < 0 ? null : slot(xs[b], k, q.forms[form]),
      inRow: row < 0 ? null : { x: ROW_RIGHT - before * ROW_PITCH, y: ROW_Y[row] },
      delay: chance(i, 61) * 0.7,
    };
  });
};

/** The dots fly from the grid into the bars of the forms (`forms`: when that scene starts, null if the episode has none),
 * then into the rows of the three surahs where the word comes most (`rows`); the dots of the other surahs fade. */
const Gathered: React.FC<{ t: number; dots: Dot[]; forms: number | null; rows: number | null }> = ({ t, dots: all, forms, rows }) => {
  const near: string[] = [];
  const far: string[] = [];
  all.forEach((d) => {
    const from = forms !== null && d.inBar ? d.inBar : d.grid;
    const r0 = forms !== null && d.inBar ? 6.8 : 3.4;
    if (rows === null || t < rows) {
      if (forms === null || !d.inBar) return;
      const k = after(t, forms + 0.15 + d.delay, 0.9);
      near.push(circle({ x: mix(d.grid.x, d.inBar.x, k), y: mix(d.grid.y, d.inBar.y, k) - Math.sin(Math.PI * k) * 60 }, 3.4 + 3.4 * k));
    } else {
      const k = after(t, rows + 0.1 + d.delay * 0.8, 0.9);
      if (d.inRow) near.push(circle({ x: mix(from.x, d.inRow.x, k), y: mix(from.y, d.inRow.y, k) - Math.sin(Math.PI * k) * 40 }, r0 + (9 - r0) * k));
      else far.push(circle({ x: from.x, y: from.y + 30 * k }, r0));
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

const FormLabels: React.FC<{ t: number; since: number; q: Word; bars: readonly Bar[] }> = ({ t, since, q, bars }) => (
  <g>
    <line x1={130} y1={BASELINE + 16} x2={W - 130} y2={BASELINE + 16} stroke={PALE} strokeOpacity={0.25} strokeWidth={2} />
    {bars.map((b, i) => {
      const n = q.forms[b.form];
      const x = BAR_X[bars.length][i];
      const counted = after(t, since + 0.6 + i * 0.25, 1.1);
      return (
        <g key={b.form}>
          <text x={x} y={barTop(n) - 30} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={56} fill={GOLD} opacity={clamp(counted * 3)}>
            {Math.round(n * counted)}
          </text>
          <text x={x} y={BASELINE + 74} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={48} fill={PALE}>
            {`«${b.word}»`}
          </text>
        </g>
      );
    })}
  </g>
);

const SurahLabels: React.FC<{ t: number; since: number; q: Word }> = ({ t, since, q }) => (
  <g>
    {q.top.map((s, i) => {
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

// ---- the first and the last time, ringed then locked or joined; a light that goes out; the verse of the answer --------

/** A pill with a place in the mushaf (« البقرة 7 »), to the left of its dot, or to its right near the left edge. */
const Tag: React.FC<{ p: P; text: string; opacity: number }> = ({ p, text, opacity }) => {
  const w = text.length * 22 + 40;
  const right = p.x - 36 - w < 40;
  const x = right ? p.x + 36 : p.x - 36 - w;
  return (
    <g opacity={opacity}>
      <rect x={x} y={p.y - 30} width={w} height={60} rx={30} fill={INK} fillOpacity={0.9} stroke={GOLD} strokeOpacity={0.7} strokeWidth={2} />
      <text x={x + w - 20} y={p.y + 13} textAnchor="end" fontFamily={FONT.arabic} fontWeight={700} fontSize={38} fill={GOLD}>{text}</text>
    </g>
  );
};

/** A ring on a dot; `out` 0 to 1: its light goes out (the dot dark, the ring grey). */
const Ring: React.FC<{ p: P; t: number; opacity: number; out?: number }> = ({ p, t, opacity, out = 0 }) => {
  const r = (t * 0.7) % 1;
  const colour = out > 0.5 ? "#6b7180" : GOLD;
  return (
    <g opacity={opacity}>
      <circle cx={p.x} cy={p.y} r={14 + 34 * r} fill="none" stroke={GOLD} strokeWidth={3} opacity={(1 - r) * (1 - out)} />
      <circle cx={p.x} cy={p.y} r={34} fill={GOLD} opacity={0.18 * (1 - out)} />
      <circle cx={p.x} cy={p.y} r={16} fill="none" stroke={colour} strokeWidth={4} opacity={1 - 0.4 * out} />
      <circle cx={p.x} cy={p.y} r={6} fill={GOLD} opacity={1 - out} />
      <circle cx={p.x} cy={p.y} r={6} fill="#20232c" opacity={out} />
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

const placeOf = (s: { name: string; ayah: number }) => `${s.name} ${s.ayah}`;

// ---- the episodes ------------------------------------------------------------------------------------------------------

/** For each word: the number of its badge, its bars (the forms the corpus gives, written as the word), how the first and
 * the last time end (`pair`: « locks » closed on the phrases of the scene `closed`, « rings » joined on the scene
 * `pair`, none), and `fade`: the phrase of the scene `fade` on which the light of the first time goes out. */
type Episode = { n: string; bars: readonly Bar[]; pair?: "locks" | "rings"; fade?: number };
const EPISODES: Record<keyof typeof MAP.words, Episode> = {
  qalb: { n: "١", bars: [{ form: "plural", word: "قلوب" }, { form: "singular", word: "قلب" }, { form: "dual", word: "قلبين" }], pair: "locks" },
  nur: { n: "٢", bars: [], fade: 4 },
  sadr: { n: "٣", bars: [{ form: "plural", word: "صدور" }, { form: "singular", word: "صدر" }], pair: "rings" },
};

const makePicture = (word: keyof typeof MAP.words): Drawn => {
  const q = MAP.words[word] as unknown as Word;
  const ep = EPISODES[word];
  const all = gather(q, ep.bars);
  const FIRST = at(q.first.index);
  const LAST = at(q.last.index);
  const REST = at(q.marks[0].index);
  return function WordMapPicture({ t, show, since, phrase: said }) {
    const phrase = said ?? ((id: string, n: number) => since(id) + n);
    const land = show("land");
    const fall = show("grid") > 0 ? after(t, since("grid") + 0.1, 1.3) : 0;
    const scan = show("scan");
    const closing = Math.max(show("closed"), show("pair"));
    const grid = Math.max(show("grid"), show("first"), show("last"), closing, show("fade"), show("rest"), show("end"));
    const knock = after(t, since("land") + 0.3, 0.7);         // the knock of tools/trial/sfx.py (`impact` at 0.3 s)
    const gathered = Math.max(show("forms"), show("surahs"));
    const travel = after(t, since("last") + 0.1, 1.4);
    const moving = { x: mix(FIRST.x, LAST.x, travel), y: mix(FIRST.y, LAST.y, travel) };
    const calm = Math.max(show("rest"), show("end"));
    const dim = Math.max(show("first"), show("last"), closing, show("fade"));
    const out = ep.fade !== undefined ? after(t, phrase("fade", ep.fade) - 0.1, 1.0) : 0;
    const marks = Math.max(show("first"), show("last"), show("fade"));
    return (
      <g>
        <Defs />
        <CountDefs />
        <Stars n={120} opacity={0.6} salt={700} />
        <defs>
          <linearGradient id="wm-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GOLD} stopOpacity={0} /><stop offset="1" stopColor={GOLD} stopOpacity={0.22} /></linearGradient>
        </defs>
        {scan > 0 || land > 0 ? (
          <g opacity={Math.max(scan, land)}>
            <MapGrid t={t} lit={q.lit} upto={land > 0.5 ? ROWS : scanRow(t, since("scan"))} bright={1 - 0.7 * land} />
          </g>
        ) : null}
        {grid > 0 ? (
          <g opacity={grid}>
            <MapGrid t={t} lit={q.lit} bright={1 - 0.62 * dim} breathe={calm} />
          </g>
        ) : null}
        {land > 0 || (fall > 0 && fall < 1) ? (
          <g opacity={land > 0 && fall === 0 ? after(t, since("land") - 0.1, 0.2) : 1}>
            {knock > 0 && knock < 1 ? <circle cx={540} cy={GRID_MIDDLE} r={60 + 520 * knock} fill="none" stroke={GOLD} strokeWidth={6 * (1 - knock)} opacity={0.8 * (1 - knock)} /> : null}
            <Particles to={String(q.total)} shapes={q.particles} cx={540} cy={GRID_MIDDLE} h={300} t={t} crumble={fall}
                       gather={land > 0 && fall === 0 ? after(t, since("land"), 0.35) : 1} />
          </g>
        ) : null}
        {gathered > 0 ? (
          <g opacity={gathered}>
            <rect x={60} y={760} width={W - 120} height={590} rx={26} fill={INK} opacity={0.5} />
            <Gathered t={t} dots={all} forms={ep.bars.length ? since("forms") : null} rows={show("surahs") > 0 ? since("surahs") : null} />
            {show("forms") > 0 && ep.bars.length ? <g opacity={show("forms")}><FormLabels t={t} since={since("forms")} q={q} bars={ep.bars} /></g> : null}
            {show("surahs") > 0 ? <g opacity={show("surahs")}><SurahLabels t={t} since={since("surahs")} q={q} /></g> : null}
          </g>
        ) : null}
        {marks > 0 ? (
          <g opacity={marks}>
            <Ring p={FIRST} t={t} opacity={show("last") > 0.5 ? 0.55 : 1} out={show("fade") > 0 ? out : 0} />
            <Tag p={FIRST} text={placeOf(q.first)} opacity={Math.max(show("first") * after(t, since("first") + 0.4, 0.5), show("fade"))} />
            {show("last") > 0 ? (
              <g opacity={show("last")}>
                <line x1={FIRST.x} y1={FIRST.y} x2={moving.x} y2={moving.y} stroke={GOLD} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} />
                <Ring p={moving} t={t} opacity={1} />
                <Tag p={LAST} text={placeOf(q.last)} opacity={after(t, since("last") + 1.5, 0.5)} />
              </g>
            ) : null}
          </g>
        ) : null}
        {show("closed") > 0 && ep.pair === "locks" ? (
          <g opacity={show("closed")}>
            <line x1={FIRST.x} y1={FIRST.y} x2={LAST.x} y2={LAST.y} stroke={GOLD} strokeWidth={2} strokeDasharray="6 8" opacity={0.35} />
            <Lock p={FIRST} shut={after(t, phrase("closed", 2) - 0.1, 0.3)} opacity={after(t, phrase("closed", 0) - 0.2, 0.4)} />
            <Lock p={LAST} shut={after(t, phrase("closed", 2) - 0.1, 0.3)} opacity={after(t, phrase("closed", 1) - 0.2, 0.4)} />
          </g>
        ) : null}
        {show("pair") > 0 && ep.pair === "rings" ? (
          <g opacity={show("pair")}>
            <line x1={FIRST.x} y1={FIRST.y} x2={LAST.x} y2={LAST.y} stroke={GOLD} strokeWidth={2} strokeDasharray="6 8" opacity={0.35} />
            <Ring p={FIRST} t={t} opacity={0.45 + 0.55 * after(t, phrase("pair", 0) - 0.2, 0.4)} />
            <Tag p={FIRST} text={placeOf(q.first)} opacity={1} />
            <Ring p={LAST} t={t} opacity={0.45 + 0.55 * after(t, phrase("pair", 4) - 0.2, 0.4)} />
            <Tag p={LAST} text={placeOf(q.last)} opacity={1} />
          </g>
        ) : null}
        {calm > 0 ? (
          <g opacity={calm}>
            <Calm p={REST} t={t} opacity={1} />
            <Tag p={REST} text={placeOf(q.marks[0])} opacity={show("rest") * after(t, since("rest") + 0.6, 0.6)} />
          </g>
        ) : null}
      </g>
    );
  };
};

/** Above the veil, still: the badge of the series; the counter of the scan (how many times the word, so far), then how
 * many verses. */
const makeOverlay = (word: keyof typeof MAP.words): Drawn => {
  const q = MAP.words[word] as unknown as Word;
  const n = EPISODES[word].n;
  return function WordMapOverlay({ t, show, since }) {
    const counting = show("grid");
    const lit = Math.round(q.verses * after(t, since("grid"), 0.8));
    const scan = Math.max(show("scan"), show("land") * (1 - after(t, since("land") + 0.2, 0.4)));
    const row = scanRow(t, since("scan"));
    const found = q.each.filter(([k]) => rowOf(k) <= row).length;
    return (
      <>
        <g>
          <circle cx={114} cy={268} r={24} fill="none" stroke={GOLD} strokeWidth={2.5} />
          <text x={114} y={281} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={GOLD}>{n}</text>
          <text x={152} y={280} fontFamily={FONT.arabic} fontWeight={700} fontSize={34} fill={GOLD} style={{ filter: "drop-shadow(0 2px 10px rgba(4,7,20,.9))" }}>خريطة كلمة</text>
        </g>
        {scan > 0 ? (
          <g opacity={scan}>
            <text x={W / 2} y={1745} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={150} fill={GOLD}
                  style={{ filter: "drop-shadow(0 0 18px rgba(240,196,106,.45))" }}>{found}</text>
          </g>
        ) : null}
        {counting > 0 ? (
          <g opacity={counting}>
            <text x={W / 2} y={1740} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={90} fill={GOLD}>{lit}</text>
            <text x={W / 2} y={1800} textAnchor="middle" fontFamily={FONT.latin} fontSize={34} fill={PALE} opacity={0.8}>{`/ ${MAP.verses}`}</text>
          </g>
        ) : null}
      </>
    );
  };
};

const WORDS = Object.keys(EPISODES) as (keyof typeof MAP.words)[];
export const MAP_PICTURES: Record<string, Drawn> = Object.fromEntries(WORDS.map((w) => [w, makePicture(w)]));
export const MAP_OVERLAYS: Record<string, Drawn> = Object.fromEntries(WORDS.map((w) => [w, makeOverlay(w)]));
/** The text sits above the grid (700 to 1330), the translation and the reference under it, as in the counting style. */
const LAYOUT: LayoutOverride = { top: 300, height: 360, size: 92, sub: { top: 1380 }, credit: { top: 1560, size: 26 } };
export const MAP_LAYOUTS: Record<string, LayoutOverride> = Object.fromEntries(WORDS.map((w) => [w, LAYOUT]));
