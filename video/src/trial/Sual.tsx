// The series « سؤال صعب » (content/trial/sual.yaml; docs/scripts/sual.md): a hard question a verse raises, answered first
// by the verse's own meaning and then by another verse. The montage (chosen by the session, 2026-11-15, the owner's
// « choisis le meilleur montage »): the filmed clip is the world the question comes from (a city's lights, rain on a
// window, a dawn over the fog); what is drawn over it is the reasoning. A pause mark that turns into « play » when the
// verse starts (the owner's « لحظة… ركّز في الآية دي »); the question as a card with a « ؟ » and the things it names; the
// answer inside (a house lit outside and a knot within; a small window with a calm lamp); the two verses face to face,
// the second answering the first (their words from the registry: tools/trial/sual.py, sualData.ts, never typed here);
// a scene of everyday life. Nobody is drawn; nothing of the unseen.
import type React from "react";
import { FONT } from "../fonts";
import { SUAL } from "./sualData";
import { clamp } from "./Signs";
import type { Drawn, LayoutOverride } from "./Trial";

const W = 1080;
const GOLD = "#f0c46a";
const INK = "#050814";
const PALE = "#f4efe2";
const DIM = "#9aa3b8";
const ROSE = "#e08a7a";

const ease = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
const after = (t: number, from: number, seconds: number) => ease((t - from) / seconds);
const AR = (n: number) => String(n);      // the owner, 2026-11-17: numbers are written 1 2 3, never 1 2 3 (CLAUDE.md)

type Phrase = (id: string, n: number) => number;

// ---- the pause that turns into « play » ----------------------------------------------------------------------------

const PauseMark: React.FC<{ t: number; play: number; opacity: number; cy?: number; r?: number }> = ({ t, play, opacity, cy = 1000, r = 120 }) => {
  if (opacity <= 0) return null;
  const pulse = 1 + 0.035 * Math.sin(t * 3.2);
  const bar = (x: number) => <rect x={x} y={-52} width={30} height={104} rx={8} fill={GOLD} />;
  return (
    <g transform={`translate(540 ${cy}) scale(${pulse * (r / 120)})`} opacity={opacity}>
      <circle r={150} fill={INK} fillOpacity={0.55} />
      <circle r={120} fill="none" stroke={GOLD} strokeWidth={6} />
      <circle r={120 + 26 * ((t * 0.6) % 1)} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.6 * (1 - ((t * 0.6) % 1))} />
      <g opacity={1 - play}>{bar(-42)}{bar(12)}</g>
      <path d="M -34 -58 L 62 0 L -34 58 Z" fill={GOLD} opacity={play} />
    </g>
  );
};

// ---- the things a question names, drawn small ----------------------------------------------------------------------

type Icon = "coins" | "house" | "star" | "purse" | "hourglass" | "knot" | "road" | "clock";
const IconShape: React.FC<{ icon: Icon; x: number; y: number; on: number }> = ({ icon, x, y, on }) => {
  const s = { fill: "none", stroke: GOLD, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const shapes: Record<Icon, React.ReactNode> = {
    coins: <g {...s}>{[30, 10, -10].map((dy, k) => <ellipse key={k} cx={0} cy={dy} rx={48} ry={16} fill={INK} />)}<path d="M -48 30 V 42 M 48 30 V 42" /></g>,
    house: <g {...s}><path d="M -56 -6 L 0 -54 L 56 -6" /><path d="M -42 -14 V 48 H 42 V -14" /><rect x={-12} y={14} width={24} height={34} fill={GOLD} fillOpacity={0.5} /></g>,
    star: <g {...s}><path d="M 0 -54 L 14 -14 L 54 0 L 14 14 L 0 54 L -14 14 L -54 0 L -14 -14 Z" fill={GOLD} fillOpacity={0.35} /></g>,
    purse: <g {...s}><rect x={-50} y={-24} width={100} height={66} rx={12} /><path d="M -50 -6 H 50" /><circle cx={30} cy={14} r={6} fill={GOLD} /></g>,
    hourglass: <g {...s}><path d="M -36 -50 H 36 M -36 50 H 36 M -28 -50 C -28 -10 28 10 28 50 M 28 -50 C 28 -10 -28 10 -28 50" /></g>,
    knot: <g {...s}><path d="M -50 10 C -30 -40 10 40 30 -10 C 50 -50 -10 -40 0 0 C 10 40 50 20 40 40 C 20 60 -40 50 -20 20" /></g>,
    road: <g {...s}><path d="M -50 46 C -20 10 20 -10 50 -46" /><path d="M 30 -46 H 50 V -26" /></g>,
    clock: <g {...s}><circle r={48} /><path d="M 0 0 V -30 M 0 0 L 22 14" /></g>,
  };
  return <g transform={`translate(${x} ${y + 24 * (1 - on)})`} opacity={on}>{shapes[icon]}</g>;
};

/** The question as a card: dashed, a « ؟ » on its corner, the things it names appearing with the phrases that say them. */
const QuestionCard: React.FC<{ t: number; icons: readonly Icon[]; at: number[]; opacity: number }> = ({ t, icons, at, opacity }) => {
  if (opacity <= 0) return null;
  const sway = Math.sin(t * 0.9) * 0.7;
  const xs = icons.length === 2 ? [700, 380] : [760, 540, 320];
  return (
    <g opacity={opacity}>
      <g transform={`rotate(${-2 + sway} 540 1000)`}>
        <rect x={130} y={780} width={820} height={440} rx={30} fill={INK} fillOpacity={0.88} stroke={GOLD} strokeOpacity={0.8} strokeWidth={3} strokeDasharray="12 9" />
        {icons.map((icon, k) => <IconShape key={k} icon={icon} x={xs[k]} y={1000} on={after(t, at[k] - 0.15, 0.4)} />)}
      </g>
      <g transform={`translate(918 800) rotate(12) scale(${1 + 0.05 * Math.sin(t * 5)})`}>
        <circle r={66} fill={INK} stroke={GOLD} strokeWidth={5} />
        <text y={36} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={104} fill={GOLD}>؟</text>
      </g>
    </g>
  );
};

// ---- the answer inside ---------------------------------------------------------------------------------------------

/** A house lit from outside; a lens comes over a window, and inside it a knot draws itself (episode 1). */
const LitHouse: React.FC<{ t: number; lens: number; knot: number }> = ({ t, lens, knot }) => {
  const windows = [[-150, -10], [-50, -10], [50, -10], [150, -10], [-150, 90], [150, 90]];
  return (
    <g>
      <g transform="translate(540 1040)">
        <path d="M -260 -70 L 0 -230 L 260 -70 Z" fill="#0b0f1d" stroke={GOLD} strokeWidth={3} strokeOpacity={0.6} />
        <rect x={-230} y={-70} width={460} height={250} fill="#0b0f1d" stroke={GOLD} strokeWidth={3} strokeOpacity={0.6} />
        {windows.map(([x, y], k) => (
          <rect key={k} x={x - 30} y={y - 30} width={60} height={64} rx={4} fill={GOLD} opacity={0.75 + 0.2 * Math.sin(t * 2 + k)} />
        ))}
        <rect x={-34} y={80} width={68} height={100} rx={6} fill={GOLD} opacity={0.5} />
      </g>
      {lens > 0 ? (
        <g opacity={lens}>
          <line x1={540 + 100 * lens} y1={1030 + 100 * lens} x2={540 + 170 * lens} y2={1100 + 170 * lens} stroke={PALE} strokeWidth={12} strokeLinecap="round" strokeOpacity={0.8} />
          <circle cx={540} cy={1030} r={135 * lens} fill={INK} fillOpacity={0.95} stroke={PALE} strokeWidth={6} strokeOpacity={0.85} />
          <g transform="translate(540 1030) scale(0.62) translate(-540 -975)">
            <path d="M 420 980 C 470 860 560 1080 600 940 C 650 800 480 840 520 960 C 560 1080 680 1020 640 1060 C 600 1110 450 1080 480 1010 C 500 950 620 900 660 960"
                  fill="none" stroke={ROSE} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - knot} opacity={lens} />
          </g>
        </g>
      ) : null}
    </g>
  );
};

/** A small window at night, rain on it, and a lamp inside that glows calm (episode 2). */
const CalmWindow: React.FC<{ t: number; glow: number }> = ({ t, glow }) => (
  <g transform="translate(540 1010)">
    <rect x={-210} y={-190} width={420} height={380} rx={18} fill="#0a0e1b" fillOpacity={0.9} stroke={PALE} strokeOpacity={0.6} strokeWidth={6} />
    <path d="M 0 -190 V 190 M -210 0 H 210" stroke={PALE} strokeOpacity={0.5} strokeWidth={5} />
    <circle cx={0} cy={10} r={150} fill={GOLD} opacity={0.1 + 0.18 * glow * (0.85 + 0.15 * Math.sin(t * 1.4))} />
    <g opacity={0.3 + 0.7 * glow}>
      <path d="M -40 -20 H 40 L 26 40 H -26 Z" fill={GOLD} />
      <path d="M 0 40 V 110 M -36 110 H 36" stroke={GOLD} strokeWidth={6} strokeLinecap="round" />
    </g>
    {Array.from({ length: 14 }, (_, k) => {
      const x = -190 + (k * 29) % 380;
      const y = ((t * 220 + k * 97) % 420) - 200;
      return <path key={k} d={`M ${x} ${y} l -6 22`} stroke={DIM} strokeWidth={3} strokeLinecap="round" opacity={0.55} />;
    })}
  </g>
);

// ---- the two verses face to face -----------------------------------------------------------------------------------

type Piece = { surah: number; ayah: number; name: string; words: readonly string[] };
const rows = (words: readonly string[]) => {
  const per = words.length > 6 ? Math.ceil(words.length / 2) : words.length;
  const out: string[] = [];
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "));
  return out;
};

const Panel: React.FC<{ piece: Piece; y: number; colour: string; on: number; label: string }> = ({ piece, y, colour, on, label }) => {
  const lines = rows(piece.words);
  const size = lines.length > 1 ? 54 : piece.words.length > 4 ? 60 : 72;
  const h = 96 + lines.length * size * 1.35;
  return (
    <g opacity={on}>
      <rect x={60} y={y} width={W - 120} height={h} rx={26} fill={INK} fillOpacity={0.9} stroke={colour} strokeOpacity={0.6} strokeWidth={3} />
      <text x={W - 94} y={y + 44} textAnchor="end" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={colour} opacity={0.9}>{`${piece.name} · ${AR(piece.ayah)}`}</text>
      <text x={94} y={y + 44} textAnchor="start" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={colour} opacity={0.75}>{label}</text>
      {lines.map((line, k) => (
        <text key={k} x={W / 2} y={y + 96 + (k + 0.8) * size * 1.3} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={size} fill={colour}>{line}</text>
      ))}
    </g>
  );
};

const Facing: React.FC<{ t: number; ep: keyof typeof SUAL; since: number; answer: number | null }> = ({ t, ep, since, answer }) => {
  const [ask, reply] = SUAL[ep] as unknown as [Piece, Piece];
  const top = 740;
  const bottom = 1040;
  const shown = answer === null ? 0 : after(t, answer - 0.1, 0.6);
  return (
    <g>
      <Panel piece={ask} y={top} colour={PALE} on={after(t, since, 0.5)} label="السؤال" />
      <g opacity={after(t, since + 0.3, 0.5) * (1 - shown)}>
        <rect x={60} y={bottom} width={W - 120} height={200} rx={26} fill={INK} fillOpacity={0.7} stroke={GOLD} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="12 9" />
        <text x={W / 2} y={bottom + 136} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={110} fill={GOLD} opacity={0.6 + 0.4 * Math.sin(t * 4) ** 2}>؟</text>
      </g>
      <path d={`M 540 ${bottom - 52} V ${bottom - 12} M 520 ${bottom - 34} L 540 ${bottom - 12} L 560 ${bottom - 34}`} stroke={GOLD} strokeWidth={5} fill="none" strokeLinecap="round" opacity={after(t, since + 0.3, 0.5)} />
      <Panel piece={reply} y={bottom} colour={GOLD} on={shown} label="الرد" />
    </g>
  );
};

// ---- a scene of everyday life --------------------------------------------------------------------------------------

/** Doors that open one after the other, light behind them (episode 1: « فتحنا عليهم أبواب كل شيء »). */
const Doors: React.FC<{ t: number; since: number }> = ({ t, since }) => (
  <g>
    {[0, 1, 2].map((k) => {
      const x = 820 - k * 280;                                   // right to left, as the line is read
      const open = after(t, since + 0.4 + k * 0.7, 0.8);
      const arch = "M -90 170 V -100 A 90 90 0 0 1 90 -100 V 170 Z";
      const leaf = 180 * (1 - 0.8 * open);
      return (
        <g key={k} transform={`translate(${x} 1010)`}>
          <path d={arch} fill={GOLD} opacity={0.15 + 0.7 * open} />
          <clipPath id={`sual-door-${k}`}><path d={arch} /></clipPath>
          <g clipPath={`url(#sual-door-${k})`}>
            <path d={`M -90 -190 L ${-90 + leaf} ${-190 + 30 * open} L ${-90 + leaf} ${170 - 30 * open} L -90 170 Z`} fill="#1a2033" stroke={PALE} strokeWidth={3} strokeOpacity={0.5} />
            <circle cx={-90 + leaf - 22} cy={20} r={8} fill={GOLD} opacity={1 - open} />
          </g>
          <path d={arch} fill="none" stroke={PALE} strokeWidth={6} strokeOpacity={0.8} />
          <rect x={-110} y={170} width={220} height={12} rx={4} fill={PALE} opacity={0.6} />
        </g>
      );
    })}
  </g>
);

/** An exam paper and a pen that writes on (episode 2). */
const Exam: React.FC<{ t: number; since: number }> = ({ t, since }) => {
  const written = after(t, since + 0.3, 4);
  return (
    <g transform="rotate(-4 540 1010)">
      <rect x={300} y={760} width={480} height={500} rx={10} fill="#efe6cf" opacity={0.95} />
      {Array.from({ length: 8 }, (_, r) => (
        <g key={r}>
          <line x1={340} y1={840 + r * 52} x2={740} y2={840 + r * 52} stroke="#b9a77d" strokeWidth={2} />
          <line x1={340} y1={830 + r * 52} x2={340 + 380 * clamp(written * 8 - r)} y2={830 + r * 52} stroke="#2b2418" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
        </g>
      ))}
      <g transform={`translate(${340 + 380 * ((written * 8) % 1)} ${830 + 52 * Math.min(7, Math.floor(written * 8))}) rotate(-35)`}>
        <rect x={-6} y={-90} width={12} height={90} rx={3} fill="#1f3a6b" /><path d="M -6 0 L 0 14 L 6 0 Z" fill="#1f3a6b" />
      </g>
    </g>
  );
};

/** A calendar whose page reads « بكرة » again and again (episode 3). */
const Tomorrow: React.FC<{ t: number; since: number }> = ({ t, since }) => {
  const cycle = ((t - since) / 1.6) % 1;                         // a page every 1.6 s: it turns in a quarter, then it holds
  const flip = cycle < 0.22 ? cycle / 0.22 : 0;
  return (
    <g transform="translate(540 1010)">
      <rect x={-200} y={-200} width={400} height={400} rx={22} fill="#efe6cf" opacity={0.95} />
      <rect x={-200} y={-200} width={400} height={90} rx={22} fill={ROSE} opacity={0.85} />
      <g transform={`scale(1 ${Math.abs(Math.cos(Math.PI * flip))})`}>
        <text y={70} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={120} fill="#2b2418">بكرة</text>
      </g>
    </g>
  );
};

// ---- the episodes --------------------------------------------------------------------------------------------------

type Episode = { n: string; icons: readonly Icon[]; iconPhrases: number[]; inside?: "house" | "window"; lens?: number; knot?: number; glow?: number; example: "doors" | "exam" | "tomorrow" };
const EPISODES: Record<keyof typeof SUAL, Episode> = {
  dank: { n: "1", icons: ["coins", "house", "star"], iconPhrases: [3, 4, 5], inside: "house", lens: 3, knot: 7, example: "doors" },
  tayyiba: { n: "2", icons: ["purse", "hourglass", "knot"], iconPhrases: [4, 5, 6], inside: "window", glow: 3, example: "exam" },
  ghafur: { n: "3", icons: ["road", "clock"], iconPhrases: [2, 3], example: "tomorrow" },
};

const makePicture = (ep: keyof typeof SUAL): Drawn => {
  const e = EPISODES[ep];
  return function SualPicture({ t, show, since, phrase: said }) {
    const phrase: Phrase = said ?? ((id, n) => since(id) + n);
    const play = show("listen") > 0 ? after(t, since("listen") - 0.2, 0.4) : 0;     // a cover keeps the pause
    const pause = Math.max(show("pause"), show("listen") * (1 - after(t, since("listen") + 0.5, 0.8)));
    const facing = Math.max(show("facing"), show("answer"));
    return (
      <g>
        <PauseMark t={t} play={play} opacity={pause} />
        <QuestionCard t={t} icons={e.icons} at={e.iconPhrases.map((k) => phrase("ask", k))} opacity={show("ask")} />
        {show("inside") > 0 && e.inside === "house" ? (
          <g opacity={show("inside")}>
            <LitHouse t={t} lens={after(t, phrase("inside", e.lens ?? 0) - 0.2, 0.6)} knot={after(t, phrase("inside", e.knot ?? 0) - 0.1, 1.6)} />
          </g>
        ) : null}
        {show("inside") > 0 && e.inside === "window" ? (
          <g opacity={show("inside")}><CalmWindow t={t} glow={after(t, phrase("inside", e.glow ?? 0) - 0.2, 0.8)} /></g>
        ) : null}
        {facing > 0 ? <g opacity={facing}><Facing t={t} ep={ep} since={since("facing")} answer={show("answer") > 0 ? since("answer") : null} /></g> : null}
        {show("example") > 0 ? (
          <g opacity={show("example")}>
            {e.example === "doors" ? <Doors t={t} since={since("example")} /> : e.example === "exam" ? <Exam t={t} since={since("example")} /> : <Tomorrow t={t} since={since("example")} />}
          </g>
        ) : null}
        <PauseMark t={t} play={1} opacity={show("end") * 0.9} cy={1010} r={90} />
      </g>
    );
  };
};

/** The name of the series and the number of the episode in a ring, above the veil, still. */
const badge = (n: string): Drawn =>
  function SualBadge() {
    return (
      <g>
        <circle cx={114} cy={268} r={24} fill="none" stroke={GOLD} strokeWidth={2.5} />
        <text x={114} y={281} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={GOLD}>{n}</text>
        <text x={152} y={280} fontFamily={FONT.arabic} fontWeight={700} fontSize={34} fill={GOLD} style={{ filter: "drop-shadow(0 2px 10px rgba(4,7,20,.9))" }}>سؤال صعب</text>
      </g>
    );
  };

const IDS = Object.keys(EPISODES) as (keyof typeof SUAL)[];
export const SUAL_PICTURES: Record<string, Drawn> = Object.fromEntries(IDS.map((id) => [id, makePicture(id)]));
export const SUAL_OVERLAYS: Record<string, Drawn> = Object.fromEntries(IDS.map((id) => [id, badge(EPISODES[id].n)]));
/** The text above the picture (700 to 1330), the translation and the reference under it. */
const LAYOUT: LayoutOverride = { top: 300, height: 380, size: 90, sub: { top: 1380 }, credit: { top: 1560, size: 26 } };
export const SUAL_LAYOUTS: Record<string, LayoutOverride> = Object.fromEntries(IDS.map((id) => [id, LAYOUT]));
