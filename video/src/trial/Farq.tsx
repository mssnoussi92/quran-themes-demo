// The series « لاحظت الفرق؟ » (content/trial/farq.yaml, rizq.yaml, adab.yaml, qist.yaml; docs/scripts/farq.md), in the
// counting style (docs/model.md; style frames docs/retention/farq-style.jpg): two verses face to face, what differs in
// gold and in mint, the words that change place travelling from one verse to the other, then what each means. The
// words are those of the registry (farqData.ts, made by tools/trial/farq.py): nothing of the Quran is typed here. The
// labels of meaning are the session's words, never a word of the verse. Nobody is drawn.
import type React from "react";
import { FONT } from "../fonts";
import { FARQ } from "./farqData";
import { Stars, clamp } from "./Signs";
import type { Drawn, LayoutOverride } from "./Trial";

const W = 1080;
const GOLD = "#f0c46a";
const MINT = "#9fe3c8";
const PALE = "#f4efe2";
const DIM = "rgba(244,239,226,.38)";
const AR = (n: number) => String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

const ease = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
const after = (t: number, from: number, seconds: number) => ease((t - from) / seconds);

type Piece = { surah: number; ayah: number; name: string; words: readonly string[]; gold: readonly number[] };
type Went = { from: number; to: number; colour: string };
type Episode = { long: readonly Piece[]; short: readonly Piece[]; went: readonly Went[] };
const DATA = FARQ as unknown as Record<string, Episode>;

/** The colour of a word: dim when both verses have it at that place; gold, or the colour of the word that moved. */
const colourOf = (ep: Episode, side: 0 | 1, k: number) => {
  if (!ep.short[side].gold.includes(k)) return DIM;
  const went = ep.went.find((w) => (side === 0 ? w.from : w.to) === k);
  return went?.colour === "mint" ? MINT : GOLD;
};

/** A card: the reference, then the words of the piece in rows (right to left), the words that differ lit. */
const Card: React.FC<{ piece: Piece; y: number; size: number; lit: number; dx?: number; opacity?: number; perRow?: number; colours?: (k: number) => string; label?: string; labelOn?: number }> = ({ piece, y, size, lit, dx = 0, opacity = 1, perRow = 5, colours, label, labelOn = 0 }) => {
  // Rows of words that fit the card: a letter of the Quran's face is about 0.42 em wide (marks take no room).
  const room = (W - 200) / (0.42 * size);
  const rows: number[][] = [[]];
  let used = 0;
  piece.words.forEach((word, k) => {
    const n = word.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").length + 1;
    if (used + n > room && rows[rows.length - 1].length) {
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1].push(k);
    used += n;
  });
  void perRow;
  const h = 70 + rows.length * size * 1.55 + (label ? 64 : 0);
  return (
    <g opacity={opacity} transform={`translate(${dx} 0)`}>
      <rect x={60} y={y} width={W - 120} height={h} rx={26} fill="#060a18" fillOpacity={0.86} stroke={GOLD} strokeOpacity={0.35} strokeWidth={2} />
      <text x={W / 2} y={y + 44} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={GOLD} opacity={0.85}>
        {`${piece.name} · ${AR(piece.ayah)}`}
      </text>
      {rows.map((row, r) => (
        <text key={r} x={W / 2} y={y + 70 + (r + 0.78) * size * 1.55} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={size}>
          {row.map((k) => {
            const on = piece.gold.includes(k);
            const fill = on ? (colours ? colours(k) : GOLD) : DIM;
            return <tspan key={k} fill={on && lit < 1 ? `rgba(244,239,226,${0.38 + 0.6 * lit})` : fill}>{piece.words[k] + " "}</tspan>;
          })}
        </text>
      ))}
      {label ? (
        <text x={W / 2} y={y + h - 26} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={38} fill={MINT} opacity={labelOn}>{label}</text>
      ) : null}
    </g>
  );
};

/** The words of a short piece on fixed places, right to left, so that a word can be seen leaving one verse for the other. */
const slots = (n: number) => {
  const gap = n <= 3 ? 290 : 225;
  return Array.from({ length: n }, (_, k) => W / 2 + ((n - 1) / 2) * gap - k * gap);
};

const PANEL = 215;
const TOP_PANEL = 752;     // under the longest line of narration (five phrases), with a margin
const BOTTOM_PANEL = 1100;
/** The two short pieces face to face; each word that changed place travels from under its place in the upper verse to
 * above its place in the lower one (`travel`), leaving its trace; `labels`: what each verse means, in the session's words. */
const FaceToFace: React.FC<{ ep: Episode; t: number; since: number; travel: number; labels?: readonly string[]; labelsOn?: number }> = ({ ep, t, since, travel, labels, labelsOn = 0 }) => {
  const [top, bottom] = ep.short;
  const size = Math.max(top.words.length, bottom.words.length) <= 3 ? 84 : 70;
  const xsTop = slots(top.words.length);
  const xsBottom = slots(bottom.words.length);
  const glow = after(t, since + 0.2, 0.6);
  const panel = (piece: Piece, side: 0 | 1, y0: number, xs: number[], label?: string) => (
    <g>
      <rect x={50} y={y0} width={W - 100} height={PANEL} rx={26} fill="#060a18" fillOpacity={0.86} stroke={GOLD} strokeOpacity={0.35} strokeWidth={2} />
      <text x={W - 84} y={y0 + 36} textAnchor="end" fontFamily={FONT.arabic} fontWeight={700} fontSize={28} fill={GOLD} opacity={0.8}>{`${piece.name} · ${AR(piece.ayah)}`}</text>
      {piece.words.map((word, k) => (
        <text key={k} x={xs[k]} y={y0 + 132} textAnchor="middle" fontFamily={FONT.quran} fontSize={size}
              fill={piece.gold.includes(k) && glow > 0 ? colourOf(ep, side, k) : DIM} opacity={piece.gold.includes(k) ? 0.4 + 0.6 * glow : 1}>
          {word}
        </text>
      ))}
      {label ? <text x={W / 2} y={y0 + PANEL - 22} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={38} fill={MINT} opacity={labelsOn}>{label}</text> : null}
    </g>
  );
  return (
    <g>
      {panel(top, 0, TOP_PANEL, xsTop, labels?.[0])}
      {panel(bottom, 1, BOTTOM_PANEL, xsBottom, labels?.[1])}
      {ep.went.map((w, i) => {
        const colour = w.colour === "mint" ? MINT : GOLD;
        const x1 = xsTop[w.from];
        const x2 = xsBottom[w.to];
        const y1 = TOP_PANEL + PANEL + 8;
        const y2 = BOTTOM_PANEL - 12;
        const p = ease(clamp(travel * 1.6 - i * 0.6));          // the second word leaves a little after the first
        const my = (y1 + y2) / 2;
        const at = (u: number) => {
          const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u ** 2, d = u ** 3;
          return { x: (a + b) * x1 + (c + d) * x2, y: a * y1 + (b + c) * my + d * y2 };
        };
        const n = 24;
        const trace = Array.from({ length: Math.max(2, Math.round(n * p)) }, (_, j) => at((j / (n - 1)) * p)).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" L ");
        const head = at(p);
        return p > 0 ? (
          <g key={i}>
            <path d={`M ${trace}`} fill="none" stroke={colour} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
            {p < 1 ? (
              <text x={head.x} y={head.y + 16} textAnchor="middle" fontFamily={FONT.quran} fontSize={size * 0.6} fill={colour} opacity={0.95}>{top.words[w.from]}</text>
            ) : (
              <path d={`M ${x2 - 12} ${y2 - 16} L ${x2} ${y2} L ${x2 + 12} ${y2 - 16}`} fill="none" stroke={colour} strokeWidth={4} strokeLinecap="round" />
            )}
          </g>
        ) : null;
      })}
    </g>
  );
};

// ---- the drawings of the examples ------------------------------------------------------------------------------------

/** An empty cradle under a lamp, waiting (episode 1: a father who counts what a child will cost). Nobody in it. */
const Cradle: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <ellipse cx={540} cy={1060} rx={330} ry={240} fill="url(#fq-glow)" opacity={0.35 + 0.05 * Math.sin(t * 1.3)} />
    <line x1={540} y1={700} x2={540} y2={800} stroke={PALE} strokeWidth={2} opacity={0.5} />
    <path d="M 500 800 L 580 800 L 610 850 L 470 850 Z" fill="#0b0f1c" stroke={GOLD} strokeWidth={2} />
    <circle cx={540} cy={862} r={14} fill={GOLD} opacity={0.9} />
    <g transform={`rotate(${Math.sin(t * 0.9) * 3} 540 1240)`}>
      <path d="M 330 1040 Q 540 1180 750 1040 L 720 1160 Q 540 1240 360 1160 Z" fill="#0b0f1c" stroke={GOLD} strokeWidth={3} />
      <path d="M 300 1250 Q 540 1330 780 1250" fill="none" stroke={GOLD} strokeWidth={4} />
      {[0, 1, 2, 3, 4, 5].map((k) => <line key={k} x1={380 + k * 64} y1={1060 + Math.abs(2.5 - k) * 6} x2={385 + k * 62} y2={1175 - Math.abs(2.5 - k) * 4} stroke={GOLD} strokeWidth={1.5} opacity={0.5} />)}
    </g>
  </g>
);

/** A boat at its mooring, a plank missing from its side (episode 2, 18:79). Nobody aboard. */
const Boat: React.FC<{ t: number }> = ({ t }) => {
  const bob = Math.sin(t * 1.1) * 6;
  return (
    <g>
      {[0, 1, 2, 3].map((k) => <path key={k} d={`M 0 ${1180 + k * 36} Q 270 ${1166 + k * 36 + Math.sin(t + k) * 8} 540 ${1180 + k * 36} T 1080 ${1180 + k * 36}`} fill="none" stroke="#7fa6d9" strokeWidth={2} opacity={0.35 - k * 0.06} />)}
      <g transform={`translate(0 ${bob})`}>
        <path d="M 300 1080 L 780 1080 L 720 1170 L 360 1170 Z" fill="#0b0f1c" stroke={GOLD} strokeWidth={3} />
        <rect x={520} y={1100} width={70} height={26} fill="#1a2440" stroke="#e07a5f" strokeWidth={2} strokeDasharray="6 5" />
        <line x1={540} y1={1080} x2={540} y2={860} stroke={GOLD} strokeWidth={4} />
        <path d="M 546 870 L 680 1060 L 546 1060 Z" fill="#0b0f1c" stroke={GOLD} strokeWidth={2} opacity={0.9} />
      </g>
    </g>
  );
};

/** A wall set straight at dusk, a small chest under it (episode 2, 18:82). Nobody near it. */
const Wall: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <ellipse cx={540} cy={1150} rx={420} ry={180} fill="url(#fq-glow)" opacity={0.22 + 0.04 * Math.sin(t)} />
    {Array.from({ length: 6 }, (_, r) => Array.from({ length: 7 }, (_, c) => (
      <rect key={`${r}-${c}`} x={250 + c * 84 + (r % 2) * 42 - 42} y={880 + r * 52} width={80} height={48} rx={4} fill="#0b0f1c" stroke={GOLD} strokeWidth={1.5} opacity={0.9} />
    )))}
    <rect x={160} y={1192} width={760} height={6} fill={GOLD} opacity={0.5} />
    <g opacity={0.95}>
      <rect x={480} y={1220} width={120} height={70} rx={8} fill="#0b0f1c" stroke={GOLD} strokeWidth={2.5} />
      <path d="M 480 1240 L 600 1240" stroke={GOLD} strokeWidth={2} />
      <circle cx={540} cy={1258} r={7} fill={GOLD} />
    </g>
  </g>
);

/** A lamp lit again (episode 2: when good comes, say it is from God). */
const Lamp: React.FC<{ t: number; since: number }> = ({ t, since }) => {
  const on = after(t, since + 0.8, 1.5);
  return (
    <g>
      <ellipse cx={540} cy={980} rx={300 * on + 40} ry={260 * on + 40} fill="url(#fq-glow)" opacity={0.15 + 0.5 * on} />
      <path d="M 470 1250 L 610 1250 L 580 1100 L 500 1100 Z" fill="#0b0f1c" stroke={GOLD} strokeWidth={3} />
      <path d="M 500 1100 Q 540 930 580 1100 Z" fill="none" stroke={GOLD} strokeWidth={2.5} />
      <path d={`M 540 ${1010 - 30 * on} Q ${556 + Math.sin(t * 7) * 3} 1040 540 1070 Q ${524 - Math.sin(t * 6) * 3} 1040 540 ${1010 - 30 * on}`} fill={GOLD} opacity={on} />
    </g>
  );
};

/** A pair of scales that settles level (episode 3). */
const Scales: React.FC<{ t: number; since: number }> = ({ t, since }) => {
  const tilt = 14 * (1 - after(t, since + 0.6, 2.2)) + Math.sin(t * 1.4) * 0.6;
  return (
    <g>
      <ellipse cx={540} cy={1060} rx={360} ry={230} fill="url(#fq-glow)" opacity={0.25} />
      <rect x={532} y={860} width={16} height={380} fill="#0b0f1c" stroke={GOLD} strokeWidth={2} />
      <path d="M 450 1250 L 630 1250 L 600 1222 L 480 1222 Z" fill="#0b0f1c" stroke={GOLD} strokeWidth={2} />
      <g transform={`rotate(${tilt} 540 880)`}>
        <line x1={300} y1={880} x2={780} y2={880} stroke={GOLD} strokeWidth={6} strokeLinecap="round" />
        {[300, 780].map((x) => (
          <g key={x}>
            <line x1={x} y1={880} x2={x - 60} y2={1010} stroke={GOLD} strokeWidth={1.5} />
            <line x1={x} y1={880} x2={x + 60} y2={1010} stroke={GOLD} strokeWidth={1.5} />
            <path d={`M ${x - 80} 1010 Q ${x} 1060 ${x + 80} 1010 Z`} fill="#0b0f1c" stroke={GOLD} strokeWidth={2.5} />
          </g>
        ))}
      </g>
      <circle cx={540} cy={880} r={12} fill={GOLD} />
    </g>
  );
};

// ---- the episodes ------------------------------------------------------------------------------------------------------

const FarqDefs: React.FC = () => (
  <defs>
    <radialGradient id="fq-glow"><stop offset="0" stopColor="#fff6dc" stopOpacity={0.85} /><stop offset=".5" stopColor="#ffd9a0" stopOpacity={0.3} /><stop offset="1" stopColor="#ffd9a0" stopOpacity={0} /></radialGradient>
  </defs>
);

/** What each verse means, in the session's words (never a word of the verse): written under its card. */
const MEANINGS: Record<string, readonly string[]> = {
  rizq: ["الفقر موجود… فطمّنك إنت الأول", "الخوف من فقر جاي… فطمّنك عليهم"],
  adab: ["العيب… نسبه لنفسه", "الخير… نسبه لربنا"],
  qist: ["حتى على نفسك… واللي بتحبهم", "حتى مع اللي بتكرهه"],
};

/** The two long pieces face to face: the upper one comes from the right, the lower one from the left, unless the scene
 * opens the video (its first frame shows them in place, the first line over them). */
const Faces: React.FC<{ ep: Episode; t: number; since: number; arrive: boolean }> = ({ ep, t, since, arrive }) => {
  const [top, bottom] = ep.long;
  const come = arrive ? after(t, since, 0.9) : 1;
  const lit = arrive ? after(t, since + 0.9, 0.6) : 1;
  const colours = (side: 0 | 1) => (k: number) => {
    const piece = ep.long[side];
    const word = piece.words[k];
    const short = ep.short[side];
    const j = short.words.indexOf(word);
    const went = ep.went.find((w) => (side === 0 ? w.from : w.to) === j);
    return went?.colour === "mint" ? MINT : GOLD;
  };
  const size = Math.max(top.words.length, bottom.words.length) > 6 ? 60 : 68;
  return (
    <g>
      <Card piece={top} y={720} size={size} lit={lit} dx={(1 - come) * 700} opacity={come} colours={colours(0)} perRow={5} />
      <Card piece={bottom} y={1025} size={size} lit={lit} dx={-(1 - come) * 700} opacity={come} colours={colours(1)} perRow={5} />
    </g>
  );
};

const makePicture = (id: string): Drawn =>
  function FarqPicture({ t, show, since }) {
    const ep = DATA[id];
    const top = ep.long[0];
    const faces = show("faces");
    const again = show("again");
    const swap = Math.max(show("swap"), show("meanings"));
    const meanings = show("meanings");
    return (
      <g>
        <FarqDefs />
        <Stars n={120} opacity={0.6} salt={700} />
        {faces > 0 ? <g opacity={faces}><Faces ep={ep} t={t} since={since("faces")} arrive={false} /></g> : null}
        {again > 0 ? <g opacity={again}><Faces ep={ep} t={t} since={since("again")} arrive /></g> : null}
        {/* While the first verse is recited, the place of the second waits empty; while the second is, the first faces it. */}
        {show("top") > 0 ? (
          <g opacity={show("top")}>
            <rect x={60} y={1030} width={W - 120} height={230} rx={26} fill="none" stroke={GOLD} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="10 8" />
            <text x={W / 2} y={1180} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={96} fill={GOLD} opacity={0.5}>؟</text>
          </g>
        ) : null}
        {show("bottom") > 0 ? <g opacity={show("bottom")}><Card piece={top} y={1000} size={50} lit={1} opacity={0.9} perRow={5} colours={() => GOLD} /></g> : null}
        {swap > 0 ? (
          <g opacity={swap}>
            <FaceToFace ep={ep} t={t} since={since("swap") || since("meanings")} travel={meanings > 0.5 ? 1 : after(t, since("swap") + 0.6, 2.6)}
                        labels={MEANINGS[id]} labelsOn={meanings > 0 ? after(t, since("meanings") + 0.3, 0.8) * meanings : 0} />
          </g>
        ) : null}
        {show("boat") > 0 ? <g opacity={show("boat")}><Boat t={t} /></g> : null}
        {show("wall") > 0 ? <g opacity={show("wall")}><Wall t={t} /></g> : null}
        {show("cradle") > 0 ? <g opacity={show("cradle")}><Cradle t={t} /></g> : null}
        {show("lamp") > 0 ? <g opacity={show("lamp")}><Lamp t={t} since={since("lamp")} /></g> : null}
        {show("scales") > 0 ? <g opacity={show("scales")}><Scales t={t} since={since("scales")} /></g> : null}
      </g>
    );
  };

/** The name of the series and the number of the episode in a ring, above the veil, still. */
const badge = (n: string): Drawn =>
  function FarqBadge() {
    return (
      <g>
        <circle cx={114} cy={268} r={24} fill="none" stroke={GOLD} strokeWidth={2.5} />
        <text x={114} y={281} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={GOLD}>{n}</text>
        <text x={152} y={280} fontFamily={FONT.arabic} fontWeight={700} fontSize={34} fill={GOLD} style={{ filter: "drop-shadow(0 2px 10px rgba(4,7,20,.9))" }}>لاحظت الفرق؟</text>
      </g>
    );
  };

export const FARQ_PICTURES: Record<string, Drawn> = { rizq: makePicture("rizq"), adab: makePicture("adab"), qist: makePicture("qist") };
export const FARQ_OVERLAYS: Record<string, Drawn> = { rizq: badge("١"), adab: badge("٢"), qist: badge("٣") };
const LAYOUT: LayoutOverride = { top: 300, height: 360, size: 92, sub: { top: 1350 }, credit: { top: 1545, size: 26 } };
export const FARQ_LAYOUTS: Record<string, LayoutOverride> = { rizq: LAYOUT, adab: LAYOUT, qist: LAYOUT };
