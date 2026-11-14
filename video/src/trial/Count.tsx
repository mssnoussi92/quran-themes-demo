// The counting style (docs/model.md, « Le style compteur »; style frames validated by the owner, 2026-11-13:
// docs/retention/count-style-yawm.jpg and count-style-yawm-board.jpg), for the fifth episode of « سنريهم آياتنا »
// (content/trial/days.yaml): a claim shown as a claim (a dashed card, « ❝ بيقولوا », a « ؟ » on it), numbers made of
// particles, the grid of the 6,236 verses where a word lights up, the strip of the rules a counter needs for 365, the
// board of eight claims under three fixed rules, a page of numbers anyone can write and a page that stays blank, the
// two verses a counter of 19 took out and that come back. Every number comes from tools/trial/count.py
// (countData.ts), never typed here. Nobody is drawn; nothing of the unseen.
import type React from "react";
import { FONT } from "../fonts";
import { COUNT } from "./countData";
import { Badge, Defs, Signature, Stars, chance, clamp } from "./Signs";
import type { Drawn, LayoutOverride } from "./Trial";

const W = 1080;
const GOLD = "#f0c46a";
const INK = "#03050d";
const PALE = "#f4efe2";
const OFF = "#8a98bd";       // a verse a rule took out: an empty ring

const ease = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
const after = (t: number, from: number, seconds: number) => ease((t - from) / seconds);

// ---- the grid of the 6,236 verses, in the order of the mushaf, read right to left ---------------------------------

const COLS = 96;
const PITCH = 9.2;
export const GRID_TOP = 712;
export const GRID_LEFT = (W - (COLS - 1) * PITCH) / 2;
export const at = (k: number) => ({ x: W - GRID_LEFT - (k % COLS) * PITCH, y: GRID_TOP + Math.floor(k / COLS) * PITCH });
export const GRID_BOTTOM = at(COUNT.verses - 1).y;
export const GRID_MIDDLE = (GRID_TOP + GRID_BOTTOM) / 2;

/** Many dots as one path: a circle is two arcs. */
export const dots = (ks: readonly number[], r: number) =>
  ks.map((k) => {
    const { x, y } = at(k);
    return `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }).join("");
const ALL = Array.from({ length: COUNT.verses }, (_, k) => k);
export const BASE = dots(ALL, 2);
export const BASE_GOLD = dots(ALL, 2.6);
const LIT = COUNT.lit.map((ks) => [...ks]);
const GONE = LIT.map((ks) => LIT[0].filter((k) => !ks.includes(k)));

/** `stage`: how many rules of the strip are applied (0: every form); `appear`: how much of the first count is lit yet;
 * `whole`: every verse lit, from the top down; `removed`: how far the two verses 9:128-129 are taken out (0 to 1). */
const Grid: React.FC<{ opacity: number; stage?: number; appear?: number; whole?: number; removed?: number; mark?: number }> = ({ opacity, stage = -1, appear = 1, whole = 0, removed = 0, mark = 0 }) => {
  if (opacity <= 0) return null;
  const lit = stage < 0 ? [] : LIT[stage];
  const shown = stage === 0 && appear < 1 ? lit.slice(0, Math.round(lit.length * appear)) : lit;
  const [a, b] = COUNT.removed.map(at);
  return (
    <g opacity={opacity}>
      <rect x={GRID_LEFT - 30} y={GRID_TOP - 30} width={W - 2 * GRID_LEFT + 60} height={GRID_BOTTOM - GRID_TOP + 60} rx={24} fill={INK} opacity={0.55} />
      <path d={BASE} fill={PALE} opacity={0.16} />
      {whole > 0 ? (
        <g>
          <clipPath id="ct-wave"><rect x={0} y={GRID_TOP - 10} width={W} height={(GRID_BOTTOM - GRID_TOP + 20) * whole} /></clipPath>
          <path d={BASE_GOLD} fill={GOLD} opacity={0.75} clipPath="url(#ct-wave)" />
        </g>
      ) : null}
      {stage > 0 ? <path d={dots(GONE[stage], 3.2)} fill="none" stroke={OFF} strokeWidth={1.4} /> : null}
      {shown.length ? <path d={dots(shown, 3.6)} fill={GOLD} /> : null}
      {mark > 0 ? (
        <g opacity={mark}>
          {[a, b].map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4.5} fill={GOLD} opacity={1 - removed} />
              <circle cx={p.x} cy={p.y} r={4.5} fill="none" stroke="#e07a5f" strokeWidth={1.6} opacity={removed} />
            </g>
          ))}
          <circle cx={(a.x + b.x) / 2} cy={a.y} r={22} fill="none" stroke={removed > 0.5 ? "#e07a5f" : GOLD} strokeWidth={2.5} />
          <line x1={(a.x + b.x) / 2} y1={a.y - 22} x2={(a.x + b.x) / 2} y2={a.y - 70} stroke={PALE} strokeWidth={1.5} opacity={0.7} />
          <text x={(a.x + b.x) / 2} y={a.y - 80} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={PALE}>التوبة ١٢٨–١٢٩</text>
          <Taken removed={removed} from={{ x: (a.x + b.x) / 2, y: a.y }} />
        </g>
      ) : null}
    </g>
  );
};

/** The two verses, large, in the middle of the grid: gold while they are there, dashed red rings once taken out. */
const Taken: React.FC<{ removed: number; from: { x: number; y: number } }> = ({ removed, from }) => {
  const cy = 1030;
  return (
    <g>
      <line x1={from.x} y1={from.y + 22} x2={640} y2={cy - 80} stroke={PALE} strokeWidth={1.5} strokeDasharray="6 6" opacity={0.6} />
      <rect x={300} y={cy - 110} width={480} height={230} rx={24} fill={INK} opacity={0.92} stroke={GOLD} strokeOpacity={0.4} />
      <text x={540} y={cy - 62} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={36} fill={PALE}>سورة التوبة</text>
      {[{ x: 640, n: "١٢٨" }, { x: 440, n: "١٢٩" }].map((v, i) => (
        <g key={i}>
          <circle cx={v.x} cy={cy + 10} r={40} fill={GOLD} opacity={1 - removed} />
          <circle cx={v.x} cy={cy + 10} r={40} fill="none" stroke="#e07a5f" strokeWidth={4} strokeDasharray="10 8" opacity={removed} />
          <text x={v.x} y={cy + 96} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={32} fill={removed > 0.5 ? "#e07a5f" : GOLD}>{v.n}</text>
        </g>
      ))}
    </g>
  );
};

// ---- numbers made of particles ---------------------------------------------------------------------------------------

export type Shape = { aspect: number; points: readonly (readonly number[])[] };
const SHAPES = COUNT.particles as unknown as Record<string, Shape>;
const place = (shape: Shape, i: number, cx: number, cy: number, h: number) => {
  const [px, py] = shape.points[i];
  return { x: cx + (px / 1000 - 0.5) * h * shape.aspect, y: cy + (py / 1000 - 0.5) * h };
};

/** A number made of particles: gathered from a cloud (`gather` 0 to 1), or turned from another number (`from`, `turn`),
 * or falling apart (`crumble` 0 to 1). The particles keep a small tremor, so that a still number is alive. */
export const Particles: React.FC<{ to: string; from?: string; turn?: number; gather?: number; crumble?: number; cx: number; cy: number; h: number; t: number; colour?: string; shapes?: Record<string, Shape> }> = ({ to, from, turn = 1, gather = 1, crumble = 0, cx, cy, h, t, colour = GOLD, shapes = SHAPES }) => {
  const target = shapes[to];
  const source = from ? shapes[from] : null;
  const k = ease(turn);
  const paths = ["", "", ""];
  for (let i = 0; i < target.points.length; i++) {
    let { x, y } = place(target, i, cx, cy, h);
    if (source) {
      const s = place(source, i, cx, cy, h);
      x = s.x + (x - s.x) * k;
      y = s.y + (y - s.y) * k;
    }
    if (gather < 1) {
      const a = chance(i, 7) * Math.PI * 2;
      const d = h * (0.8 + chance(i, 8) * 1.6);
      const g = ease(gather);
      x = cx + Math.cos(a) * d * 1.3 + (x - cx - Math.cos(a) * d * 1.3) * g;
      y = cy + Math.sin(a) * d * 0.7 + (y - cy - Math.sin(a) * d * 0.7) * g;
    }
    if (crumble > 0) {
      const c = clamp(crumble * 1.3 - chance(i, 9) * 0.3);
      x += (chance(i, 10) - 0.5) * 160 * c;
      y += c * c * (260 + chance(i, 11) * 520);
    }
    x += Math.sin(t * 2.1 + i) * 0.9;
    y += Math.cos(t * 1.7 + i * 1.3) * 0.9;
    const r = h / 120 + chance(i, 12) * (h / 150);
    paths[i % 3] += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
  }
  const fade = 1 - clamp(crumble * 1.2 - 0.2);
  return (
    <g opacity={fade}>
      <ellipse cx={cx} cy={cy} rx={h * 1.25} ry={h * 0.62} fill="url(#ct-halo)" />
      {paths.map((d, i) => <path key={i} d={d} fill={colour} opacity={[1, 0.82, 0.64][i]} />)}
    </g>
  );
};

// ---- the claim, shown as a claim -------------------------------------------------------------------------------------

const DASH = "10 8";
const CardFrame: React.FC<{ x: number; y: number; w: number; h: number; angle: number; label?: string; glow?: number }> = ({ x, y, w, h, angle, label, glow = 0 }) => (
  <g transform={`rotate(${angle} ${x + w / 2} ${y + h / 2})`}>
    <rect x={x} y={y} width={w} height={h} rx={28} fill="#070c1d" fillOpacity={0.95} stroke={GOLD} strokeOpacity={0.45 + 0.5 * glow} strokeWidth={2 + 2 * glow} strokeDasharray={DASH} />
    {label ? (
      <text x={x + w / 2} y={y + 46} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={34} fill={glow > 0.5 ? GOLD : PALE} opacity={0.88}>{label}</text>
    ) : null}
  </g>
);

/** The pile of claims of the first frame: 365 in front, « شهر » and « الدنيا والآخرة » behind; each card brightens as the
 * voice names it (`lit`: 0 the front card, 1 « شهر », 2 « الدنيا والآخرة »). `crumble`: the front number falls apart. */
const Claims: React.FC<{ t: number; lit?: number; crumble?: number; backs?: number; ask?: number }> = ({ t, lit = -1, crumble = 0, backs = 1, ask = 0 }) => {
  const sway = Math.sin(t * 0.8) * 0.6;
  return (
    <g>
      <g opacity={backs}>
        <CardFrame x={230} y={684} w={620} h={470} angle={-4 + sway} label="بيقولوا: «الدنيا» و«الآخرة»… 115 و115" glow={lit === 2 ? 1 : 0} />
        <CardFrame x={190} y={770} w={700} h={480} angle={3 - sway} label="بيقولوا: «شهر»… 12 مرة" glow={lit === 1 ? 1 : 0} />
      </g>
      <CardFrame x={150} y={860} w={780} h={460} angle={-2.5} glow={lit === 0 ? 1 : 0} />
      <g transform="rotate(-2.5 540 1090)">
        <text x={890} y={924} textAnchor="start" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={40} fill={PALE} opacity={0.85}>❝ بيقولوا</text>
        <text x={540} y={1290} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={42} fill={PALE}>كلمة «يوم»… زي أيام السنة</text>
      </g>
      <Particles to="365" cx={540} cy={1090} h={240} t={t} crumble={crumble} />
      <g transform={`translate(196 ${864}) rotate(-14) scale(${1 + 0.35 * ask + 0.06 * ask * Math.sin(t * 6)})`}>
        <circle r={60} fill="#03050d" fillOpacity={0.9} stroke={GOLD} strokeWidth={4} />
        <text y={34} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={96} fill={GOLD}>؟</text>
      </g>
    </g>
  );
};

// ---- the strip of the rules for 365, and the board of the claims ---------------------------------------------------

/** How far the rules scene has gone: the stage (0 to 3) and how much of the turn to it is done. */
const rulesAt = (t: number, since: number) => {
  const x = (t - since - 1.1) / 0.8;          // the voice says « لازم تشيل 110… » a second into the scene
  const stage = Math.max(0, Math.min(3, Math.floor(x) + 1));
  const turn = stage === 0 ? 1 : clamp((x - (stage - 1)) / 0.6);
  return { stage, turn };
};

const Strip: React.FC<{ stage: number; opacity: number }> = ({ stage, opacity }) => {
  if (opacity <= 0) return null;
  const y = 1724;
  const x0 = 120;
  const x1 = 960;
  return (
    <g opacity={opacity}>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={GOLD} strokeWidth={2} opacity={0.5} />
      {COUNT.steps.map((n, k) => {
        const x = x1 - (k * (x1 - x0)) / 3;
        const on = k === stage ? 1 : 0;
        return (
          <g key={k}>
            <circle cx={x} cy={y} r={30} fill={GOLD} opacity={0.22 * on} />
            <circle cx={x} cy={y} r={7 + 6 * on} fill={k <= stage ? GOLD : INK} stroke={GOLD} strokeWidth={3} />
            <text x={x} y={y - 32} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={30 + 12 * on} fill={GOLD} opacity={0.6 + 0.4 * on}>{n}</text>
            <text x={x} y={y + 50} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontSize={25} fill={PALE} opacity={0.5 + 0.45 * on}>{COUNT.stepLabels[k]}</text>
          </g>
        );
      })}
    </g>
  );
};

const BOARD_TOP = 724;
const ROW = 62;
const COLUMN = [628, 466, 306, 146];         // the number said, then the three rules
const Board: React.FC<{ t: number; since: number; sweep: number; sweepSince: number }> = ({ t, since, sweep, sweepSince }) => {
  const rows = COUNT.board;
  const shown = (r: number) => after(t, since + 0.15 + r * 0.22, 0.3);
  const hits = after(t, since + 0.4 + rows.length * 0.22, 0.6);
  // The sweep: one rule after the other over every row; the rows it does not hold for go dark.
  const ruleNow = sweep > 0 ? Math.min(2, Math.floor((t - sweepSince) / 1.1)) : -1;
  const sweepOn = sweep > 0 && t - sweepSince < 3.3;
  return (
    <g>
      <rect x={40} y={BOARD_TOP - 50} width={W - 80} height={ROW * (rows.length + 1) + 30} rx={22} fill={INK} opacity={0.6} />
      {["بيقولوا", ...COUNT.rules].map((h, k) => (
        <text key={k} x={COLUMN[k]} y={BOARD_TOP} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={28} fill={PALE} opacity={sweepOn && k - 1 === ruleNow ? 1 : 0.7}>{h}</text>
      ))}
      {sweepOn ? <rect x={COLUMN[ruleNow + 1] - 78} y={BOARD_TOP - 40} width={156} height={ROW * (rows.length + 1) + 10} rx={16} fill={GOLD} opacity={0.1} /> : null}
      {rows.map((row, r) => {
        const y = BOARD_TOP + ROW * (r + 1);
        const falls = sweepOn && !row.holds[ruleNow];
        return (
          <g key={r} opacity={shown(r) * (falls ? 0.3 : 1)}>
            <line x1={60} y1={y - 42} x2={W - 60} y2={y - 42} stroke={PALE} strokeOpacity={0.1} />
            <text x={1010} y={y} textAnchor="start" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={36} fill={PALE}>{row.words.join(" = ")}</text>
            <text x={COLUMN[0]} y={y} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={32} fill={PALE}>{row.said}</text>
            {row.cells.map((cell, k) => {
              const hit = row.holds[k];
              const lit = hit ? hits : 0;
              return (
                <g key={k}>
                  {lit > 0 ? <rect x={COLUMN[k + 1] - 70} y={y - 38} width={140} height={52} rx={12} fill={GOLD} opacity={0.16 * lit} /> : null}
                  <text x={COLUMN[k + 1]} y={y} textAnchor="middle" direction="rtl" fontFamily={FONT.latin} fontWeight={hit ? 700 : 400} fontSize={30}
                        fill={lit > 0.5 ? GOLD : PALE} opacity={0.4 + 0.6 * lit}>{cell.join(" · ")}</text>
                </g>
              );
            })}
            {falls ? <line x1={80} y1={y - 12} x2={W - 80} y2={y - 12} stroke="#e07a5f" strokeWidth={2} opacity={0.8} /> : null}
          </g>
        );
      })}
      {sweep > 0 ? (
        COUNT.rules.map((_, k) => {
          const held = rows.filter((row) => row.holds[k]).length;
          const on = after(t, sweepSince + k * 1.1 + 0.4, 0.3);
          return (
            <text key={k} x={COLUMN[k + 1]} y={BOARD_TOP + ROW * (rows.length + 1) - 4} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={30}
                  fill={held === rows.length ? GOLD : "#e07a5f"} opacity={on}>{`${held}/${rows.length}`}</text>
          );
        })
      ) : null}
    </g>
  );
};

// ---- a page of numbers anyone can write, and the page that stays blank ------------------------------------------------

const Page: React.FC<{ t: number; since: number; filled: boolean }> = ({ t, since, filled }) => {
  const rows = 9;
  const written = filled ? after(t, since + 0.2, 4) : 0;
  return (
    <g transform="rotate(-3 540 1010)">
      <rect x={290} y={740} width={500} height={540} rx={10} fill="#efe6cf" opacity={0.93} />
      <rect x={290} y={740} width={500} height={540} rx={10} fill="none" stroke={GOLD} strokeOpacity={0.5} strokeWidth={2} />
      {Array.from({ length: rows }, (_, r) => {
        const y = 800 + r * 52;
        const line = Array.from({ length: 6 }, (_, c) => String(Math.floor(chance(r * 6 + c, 40) * 990) + 10)).join("  ");
        const shown = clamp(written * rows - r);
        return (
          <g key={r}>
            <line x1={320} y1={y + 12} x2={760} y2={y + 12} stroke="#b9a77d" strokeWidth={1} opacity={0.6} />
            {shown > 0 ? (
              <text x={330} y={y} fontFamily={FONT.latin} fontSize={30} fill="#2b2418" opacity={0.85} textLength={420 * shown} lengthAdjust="spacingAndGlyphs">
                {line.slice(0, Math.max(1, Math.round(line.length * shown)))}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/** A quill above its inkwell: the page under it stays blank (17:88: they could not bring the like of it). */
const Quill: React.FC<{ t: number }> = ({ t }) => {
  const lift = Math.sin(t * 0.9) * 8;
  return (
    <g>
      <Page t={t} since={0} filled={false} />
      <g transform={`translate(0 ${lift}) rotate(28 700 900)`}>
        <path d="M 700 700 C 760 760 770 900 712 1040 L 700 1040 C 690 900 650 780 700 700 Z" fill="#0b0f1c" stroke={GOLD} strokeWidth={2} />
        <line x1={704} y1={760} x2={706} y2={1110} stroke={GOLD} strokeWidth={2} opacity={0.8} />
      </g>
      <g>
        <path d="M 820 1230 L 920 1230 L 910 1300 L 830 1300 Z" fill="#0b0f1c" stroke={GOLD} strokeWidth={2} />
        <ellipse cx={870} cy={1230} rx={50} ry={10} fill="#0b0f1c" stroke={GOLD} strokeWidth={2} />
      </g>
    </g>
  );
};

// ---- the episode -----------------------------------------------------------------------------------------------------

export const CountDefs: React.FC = () => (
  <defs>
    <radialGradient id="ct-halo"><stop offset="0" stopColor={INK} stopOpacity={0.97} /><stop offset=".72" stopColor={INK} stopOpacity={0.85} /><stop offset="1" stopColor={INK} stopOpacity={0} /></radialGradient>
  </defs>
);

/** When the voice names each claim of the first line (seconds from the start): the cards brighten in turn. */
const NAMED = [0, 4.6, 5.55];

const DaysPicture: Drawn = ({ t, show, since }) => {
  const rules = rulesAt(t, since("rules"));
  const inRules = show("rules");
  const named = NAMED.reduce((k, s, i) => (t >= s ? i : k), 0);
  const cards = show("cards");
  const ask = show("ask");
  const board = Math.max(show("board"), show("sweep"));
  const gridSeen = Math.max(show("grid"), inRules);
  const removedSeen = Math.max(show("removed"), show("restored"));
  return (
    <g>
      <Defs />
      <CountDefs />
      <Stars n={120} opacity={0.6} salt={500} />
      {cards > 0 ? <g opacity={cards}><Claims t={t} lit={named} /></g> : null}
      {gridSeen > 0 ? (
        <g opacity={gridSeen}>
          <Grid opacity={1} stage={inRules > 0.5 ? rules.stage : 0} appear={after(t, since("grid") + 0.3, 2.4)} />
          <Particles to={inRules > 0.5 && rules.stage > 0 ? String(COUNT.steps[rules.stage]) : "475"}
                     from={inRules > 0.5 && rules.stage > 0 ? String(COUNT.steps[rules.stage - 1]) : undefined}
                     turn={inRules > 0.5 ? rules.turn : 1} gather={inRules > 0.5 ? 1 : after(t, since("grid"), 1.4)}
                     cx={540} cy={GRID_MIDDLE} h={210} t={t} />
        </g>
      ) : null}
      {board > 0 ? <g opacity={board}><Board t={t} since={since("board")} sweep={show("sweep")} sweepSince={since("sweep")} /></g> : null}
      {show("page") > 0 ? <g opacity={show("page")}><Page t={t} since={since("page")} filled /></g> : null}
      {show("quill") > 0 ? <g opacity={show("quill")}><Quill t={t} /></g> : null}
      {show("crumble") > 0 ? <g opacity={show("crumble")}><Claims t={t} backs={0} crumble={after(t, since("crumble") + 0.6, 2.6)} /></g> : null}
      {removedSeen > 0 ? (
        <g opacity={removedSeen}>
          <Grid opacity={1} mark={1} removed={show("restored") > 0.5 ? 1 - after(t, since("restored") + 0.5, 1.2) : after(t, since("removed") + 3.2, 1.2)} />
        </g>
      ) : null}
      {ask > 0 ? <g opacity={ask}><Claims t={t} backs={0.6} ask={1} /></g> : null}
      {show("whole") > 0 ? <g opacity={show("whole")}><Grid opacity={1} whole={after(t, since("whole") + 0.3, 3.5)} /></g> : null}
      <Signature show={show("signs")} t={t} since={since("signs")} />
    </g>
  );
};

/** Above the veil, still: the badge of the series; the strip of the rules while « يوم » is counted; the number of the
 * verses while two of them are taken out and come back. */
const DaysOverlay: Drawn = ({ t, show, since }) => {
  const rules = rulesAt(t, since("rules"));
  const strip = Math.max(show("grid"), show("rules"));
  const out = show("removed");
  const back = show("restored");
  const taken = out > 0.5 ? after(t, since("removed") + 3.2, 1.2) : back > 0.5 ? 1 - after(t, since("restored") + 0.5, 1.2) : 0;
  const counter = Math.max(out, back);
  return (
    <>
      <Badge n="٥" />
      <Strip stage={show("rules") > 0.5 ? rules.stage : 0} opacity={strip} />
      {counter > 0 ? (
        <g opacity={counter}>
          <text x={W / 2} y={1745} textAnchor="middle" fontFamily={FONT.latin} fontWeight={700} fontSize={84} fill={taken > 0.5 ? "#e07a5f" : GOLD}>
            {taken > 0.5 ? COUNT.verses - 2 : COUNT.verses}
          </text>
          <text x={W / 2} y={1800} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontSize={30} fill={PALE} opacity={0.8}>آية</text>
        </g>
      ) : null}
    </>
  );
};

export const COUNT_PICTURES: Record<string, Drawn> = { days: DaysPicture };
export const COUNT_OVERLAYS: Record<string, Drawn> = { days: DaysOverlay };
/** The narration sits a little higher and smaller (the picture takes 700 to 1320), the translation and the reference
 * above the strip, as in the other episodes of the series. */
export const COUNT_LAYOUTS: Record<string, LayoutOverride> = {
  days: { top: 300, height: 360, size: 92, sub: { top: 1350 }, credit: { top: 1545, size: 26 } },
};
