// The series « معاك ٥ ثواني » (content/trial/quiz.yaml; docs/scripts/quiz.md, validated by the owner on 2026-11-17): a
// question on the first frame, three choices, a countdown of five seconds, the answer; then the reciter says the verse
// and the voice gives its meaning. What must not move (the question's words, the countdown, the choices, the two
// speakers face to face) is drawn above the veil (QUIZ_OVERLAYS); the picture under it (QUIZ_PICTURES) is the place:
// a well and a caravan at dusk (the word « سَيَّارَةٌ »), a night that slowly grows light, a plain. Every Quranic word
// comes from the registry (tools/trial/quiz.py, quizData.ts), never typed here; the Egyptian choices come from the
// short's file. Nobody is drawn, nothing of the unseen, no violence.
import type React from "react";
import { FONT } from "../fonts";
import { QUIZ } from "./quizData";
import { clamp } from "./Signs";
import type { Drawn, LayoutOverride } from "./Trial";

const W = 1080;
const GOLD = "#f0c46a";
const INK = "#050814";
const PALE = "#f4efe2";
const DIM = "#9aa3b8";
const ROSE = "#e08a7a";
const SECONDS = 5;                                 // the countdown (tools/trial/sfx.py `count`: one tick a second)

const ease = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
const after = (t: number, from: number, seconds: number) => ease((t - from) / seconds);
/** A right-to-left text in SVG: a right-to-left mark at both ends, so that a quote or a number at its edge sits on the
 * side Arabic puts it (Chromium's SVG text starts a paragraph left to right whatever `direction` says). */
const RTL = (text: string) => `\u200F${text}\u200F`;
const AR = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
/** The letters a line of Quranic text takes on its row: its marks and vowels take no width. */
const letters = (text: string) => text.replace(/[ً-ٰٟۖ-ۭـ]/g, "").length;
/** The largest size, up to `most`, at which `text` stays within `width` (a letter of Amiri Quran is about 0.42 em). */
const fitQuran = (text: string, most: number, width = 900) => Math.min(most, Math.floor(width / (0.42 * Math.max(1, letters(text)))));

type Piece = { surah: number; ayah: number; name: string; first: number; last: number; words: readonly string[] };
type Choice = { ar: string | null; en: string; right: boolean; icon: string | null; quran?: Piece };
type Quiz = { head: Piece; choices: readonly Choice[]; both: boolean; blank?: Piece; speakers?: readonly { ar: string; en: string; quran: Piece }[] };
type Id = keyof typeof QUIZ;
const data = (id: Id) => QUIZ[id] as unknown as Quiz;
const N: Record<Id, string> = { sayyara: "١", khatima: "٢", qalaha: "٣" };

// ---- the countdown -------------------------------------------------------------------------------------------------

/** A ring that empties over five seconds, the second that is left written in it; it beats at each tick. */
const Countdown: React.FC<{ t: number; start: number; opacity: number; cy: number }> = ({ t, start, opacity, cy }) => {
  if (opacity <= 0) return null;
  const gone = clamp((t - start) / SECONDS);
  const left = Math.max(1, SECONDS - Math.floor(Math.max(0, t - start)));
  const beat = t >= start && gone < 1 ? 1 + 0.07 * Math.exp(-((t - start) % 1) * 7) : 1;    // a beat at each tick
  const r = 64;
  const length = 2 * Math.PI * r;
  const late = gone > 0.6;                         // the last two seconds: the ring turns rose
  return (
    <g transform={`translate(540 ${cy}) scale(${beat})`} opacity={opacity}>
      <circle r={r + 18} fill={INK} fillOpacity={0.78} />
      <circle r={r} fill="none" stroke={PALE} strokeOpacity={0.18} strokeWidth={12} />
      <circle r={r} fill="none" stroke={late ? ROSE : GOLD} strokeWidth={12} strokeLinecap="round"
              strokeDasharray={`${length * (1 - gone)} ${length}`} transform="rotate(-90)" />
      <text y={30} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={86} fill={late ? ROSE : GOLD}>{AR(left)}</text>
    </g>
  );
};

// ---- the choices ---------------------------------------------------------------------------------------------------

/** Small drawings beside the Egyptian choices of the first short: a car, a camel, a planet. */
const Icon: React.FC<{ icon: string; x: number; y: number; colour: string }> = ({ icon, x, y, colour }) => {
  const s = { fill: "none", stroke: colour, strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (icon === "car") {
    return (
      <g transform={`translate(${x} ${y})`} {...s}>
        <path d="M -40 8 V -4 L -28 -8 L -16 -24 H 18 L 32 -8 L 42 -4 V 8 Z" />
        <circle cx={-22} cy={10} r={9} fill={INK} /><circle cx={24} cy={10} r={9} fill={INK} />
      </g>
    );
  }
  if (icon === "caravan") return <g transform={`translate(${x} ${y + 26}) scale(0.48)`}><Camel colour={colour} legs={0} /></g>;
  return (
    <g transform={`translate(${x} ${y})`} {...s}>
      <circle r={20} fill={colour} fillOpacity={0.3} />
      <ellipse rx={42} ry={11} transform="rotate(-18)" />
    </g>
  );
};

/** One choice: a pill with its words (an Egyptian phrase, or names taken from a verse) and the English under them.
 * Before the answer it breathes; at the answer a right one turns gold, a wrong one is struck through and fades. */
const ChoicePill: React.FC<{ choice: Choice; y: number; t: number; k: number; answer: number; both: boolean; last: boolean }> = ({ choice, y, t, k, answer, both, last }) => {
  const shown = after(t, answer, 0.35);
  const right = choice.right;
  const breath = 1 + 0.012 * Math.sin(t * 2.4 + k * 1.3) * (1 - shown);
  const pop = right ? 1 + 0.06 * Math.sin(Math.PI * clamp((t - answer) / 0.45)) : 1;
  const fade = right ? 1 : 1 - 0.62 * shown;
  const colour = right && shown > 0 ? GOLD : PALE;
  const quran = choice.quran ? choice.quran.words.join(" ") : null;
  const text = quran ?? choice.ar ?? "";
  const strike = right ? 0 : after(t, answer + 0.1, 0.3);
  const x0 = 120;
  const w = 840;
  const h = 122;
  const textX = choice.icon ? 560 : 540;
  return (
    <g transform={`translate(540 ${y}) scale(${breath * pop}) translate(-540 ${-y})`} opacity={fade}>
      <rect x={x0} y={y - h / 2} width={w} height={h} rx={h / 2} fill={right && shown > 0 ? GOLD : INK} fillOpacity={right && shown > 0 ? 0.2 : 0.8}
            stroke={colour} strokeOpacity={right && shown > 0 ? 1 : 0.55} strokeWidth={right && shown > 0 ? (both && last ? 7 : 5) : 3} />
      {choice.icon ? <Icon icon={choice.icon} x={x0 + 86} y={y - 4} colour={colour} /> : null}
      <text x={textX} y={quran ? y - 2 : y + 8} textAnchor="middle" direction="rtl" fontFamily={quran ? FONT.quran : FONT.arabic} fontWeight={quran ? 400 : 700}
            fontSize={quran ? 52 : 52} fill={colour}>{RTL(text)}</text>
      <text x={textX} y={y + 48} textAnchor="middle" fontFamily={FONT.latin} fontStyle="italic" fontSize={24} fill={DIM}>{choice.en}</text>
      {strike > 0 ? <line x1={textX + 180} y1={y - 4} x2={textX + 180 - 360 * strike} y2={y - 4} stroke={ROSE} strokeWidth={6} strokeLinecap="round" /> : null}
    </g>
  );
};

// ---- the words of the question -------------------------------------------------------------------------------------

/** The Quranic words of the question, in gold between « », with their reference; the verse to finish has a blank
 * after them, which only the right end fills, at the answer. */
const Head: React.FC<{ quiz: Quiz; t: number; answer: number; opacity: number }> = ({ quiz, t, answer, opacity }) => {
  if (opacity <= 0) return null;
  const head = quiz.head.words.join(" ");
  const ref = `${quiz.head.name} · ${AR(quiz.head.ayah)}`;
  if (!quiz.blank) {
    const size = fitQuran(`«${head}»`, quiz.head.words.length === 1 ? 128 : 70);
    return (
      <g opacity={opacity}>
        <text x={540} y={quiz.head.words.length === 1 ? 470 : 450} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={size} fill={GOLD}
              style={{ filter: "drop-shadow(0 2px 14px rgba(4,7,20,.9))" }}>{RTL(`«${head}»`)}</text>
        <text x={540} y={quiz.head.words.length === 1 ? 528 : 512} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={PALE} opacity={0.7}>{RTL(ref)}</text>
      </g>
    );
  }
  const end = quiz.blank.words.join(" ");
  const filled = after(t, answer + 0.15, 0.5);
  return (
    <g opacity={opacity}>
      <text x={540} y={410} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={fitQuran(head, 62)} fill={PALE}
            style={{ filter: "drop-shadow(0 2px 14px rgba(4,7,20,.9))" }}>{RTL(`«${head}`)}</text>
      <g opacity={1 - filled}>
        <rect x={330} y={444} width={420} height={92} rx={18} fill={INK} fillOpacity={0.6} stroke={GOLD} strokeOpacity={0.7} strokeWidth={3} strokeDasharray="12 9" />
        <text x={540} y={514} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={72} fill={GOLD} opacity={0.55 + 0.45 * Math.sin(t * 4) ** 2}>؟</text>
      </g>
      <text x={540} y={516} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={fitQuran(end, 70)} fill={GOLD} opacity={filled}
            style={{ filter: "drop-shadow(0 2px 14px rgba(4,7,20,.9))" }}>{RTL(`${end}»`)}</text>
      <text x={540} y={570} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={28} fill={PALE} opacity={0.7}>{RTL(ref)}</text>
    </g>
  );
};

// ---- who said it: the two speakers face to face --------------------------------------------------------------------

const Speaker: React.FC<{ s: { ar: string; en: string; quran: Piece }; y: number; lit: number }> = ({ s, y, lit }) => {
  const colour = lit > 0.5 ? GOLD : PALE;
  const words = s.quran.words.join(" ");
  return (
    <g opacity={0.35 + 0.65 * lit}>
      <rect x={70} y={y} width={W - 140} height={178} rx={26} fill={INK} fillOpacity={0.86} stroke={colour} strokeOpacity={0.4 + 0.6 * lit} strokeWidth={3 + 2 * lit} />
      <text x={W - 104} y={y + 56} textAnchor="start" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={44} fill={colour}>{RTL(s.ar)}</text>
      <text x={104} y={y + 52} textAnchor="end" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={28} fill={colour} opacity={0.8}>{RTL(`${s.quran.name} · ${AR(s.quran.ayah)}`)}</text>
      <text x={104} y={y + 86} textAnchor="start" fontFamily={FONT.latin} fontStyle="italic" fontSize={24} fill={DIM}>{s.en}</text>
      <text x={540} y={y + 148} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={fitQuran(`«${words}»`, 56, 860)} fill={colour}>{RTL(`«${words}»`)}</text>
    </g>
  );
};

// ---- the overlay of each short -------------------------------------------------------------------------------------

const PILLS = [1050, 1185, 1320];

const makeOverlay = (id: Id): Drawn => {
  const quiz = data(id);
  return function QuizOverlay({ t, show, since }) {
    const start = since("ask");
    const answer = start + SECONDS;
    const asking = show("ask");
    const answered = show("answer");
    const choices = Math.max(asking, answered);
    const meaning = show("meaning");
    const head = Math.max(asking, answered * (quiz.speakers ? 0 : 1), meaning);
    const speakers = quiz.speakers
      ? Math.max(show("abel"), show("satan"), show("abel-meaning"), show("satan-meaning"))
      : 0;
    const lit = (k: number) => (k === 0 ? Math.max(show("abel"), show("abel-meaning")) : Math.max(show("satan"), show("satan-meaning")));
    return (
      <g>
        {/* the name of the series, a stopwatch and the number of the episode */}
        <g>
          <circle cx={114} cy={268} r={24} fill="none" stroke={GOLD} strokeWidth={2.5} />
          <text x={114} y={281} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={GOLD}>{N[id]}</text>
          <text x={152} y={280} fontFamily={FONT.arabic} fontWeight={700} fontSize={34} fill={GOLD} style={{ filter: "drop-shadow(0 2px 10px rgba(4,7,20,.9))" }}>معاك ٥ ثواني</text>
        </g>
        <Head quiz={quiz} t={t} answer={answer} opacity={head} />
        <Countdown t={t} start={start} opacity={asking * (1 - after(t, answer + 0.1, 0.4))} cy={900} />
        {choices > 0 ? (
          <g opacity={choices}>
            {quiz.choices.map((c, k) => (
              <ChoicePill key={k} choice={c} y={PILLS[k]} t={t} k={k} answer={answer} both={quiz.both} last={k === quiz.choices.length - 1} />
            ))}
          </g>
        ) : null}
        {quiz.speakers && speakers > 0 ? (
          <g opacity={speakers}>
            {quiz.speakers.map((s, k) => <Speaker key={k} s={s} y={990 + k * 205} lit={lit(k)} />)}
          </g>
        ) : null}
      </g>
    );
  };
};

// ---- the pictures under the veil -----------------------------------------------------------------------------------

const STARS = Array.from({ length: 40 }, (_, k) => ({ x: (k * 263) % W, y: 120 + ((k * 151) % 900), r: 1.4 + (k % 3) * 0.7, p: k * 0.7 }));
const Stars: React.FC<{ t: number; opacity: number }> = ({ t, opacity }) => (
  <g opacity={opacity}>
    {STARS.map((s, k) => <circle key={k} cx={s.x} cy={s.y} r={s.r} fill={PALE} opacity={0.35 + 0.35 * Math.sin(t * 1.3 + s.p) ** 2} />)}
  </g>
);

/** The ground: a low ridge of sand from the horizon down, dark against the sky. */
const Ground: React.FC<{ horizon: number }> = ({ horizon }) => (
  <path d={`M 0 ${horizon + 18} C 260 ${horizon - 8} 520 ${horizon + 26} 760 ${horizon + 6} C 900 ${horizon - 6} 1000 ${horizon + 4} ${W} ${horizon} V 1920 H 0 Z`} fill="#03050c" />
);

/** A camel seen from the side, walking to the left, a load on its hump; `legs` swings them (0: still). Feet at y 0. */
const Camel: React.FC<{ colour?: string; legs: number }> = ({ colour = "#03050c", legs }) => {
  const swing = (k: number) => 9 * Math.sin(legs + k * Math.PI);
  return (
    <g fill={colour}>
      <path d="M -46 -64 C -48 -84 -30 -92 -12 -90 C -4 -112 22 -114 32 -94 C 44 -92 56 -84 54 -66 C 52 -54 40 -50 30 -50 L -34 -50 C -42 -52 -46 -58 -46 -64 Z" />
      <path d="M -40 -70 C -54 -74 -62 -92 -66 -106 C -68 -112 -74 -116 -84 -114 L -94 -110 C -96 -104 -92 -102 -86 -102 L -78 -102 C -74 -88 -66 -68 -52 -56 Z" />
      <path d="M 52 -74 C 62 -72 64 -60 60 -50" stroke={colour} strokeWidth={4} fill="none" />
      <rect x={-6} y={-122} width={34} height={22} rx={6} />
      {[-34, -20, 24, 38].map((x, k) => (
        <rect key={k} x={x - 4} y={-54} width={8} height={54} rx={3} transform={`rotate(${swing(k)} ${x} -52)`} />
      ))}
    </g>
  );
};

/** The well, its frame, the rope and the bucket that goes down (`down` 0 to 1). */
const Well: React.FC<{ x: number; y: number; down: number }> = ({ x, y, down }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -150 -150 V 40 H 150 V -150" fill="#0a0d18" stroke={PALE} strokeOpacity={0.35} strokeWidth={4} />
    {[-110, -40, 30, 100].map((bx, k) => <rect key={k} x={bx - 30} y={-120 + (k % 2) * 60} width={64} height={52} rx={6} fill="none" stroke={PALE} strokeOpacity={0.18} strokeWidth={3} />)}
    <ellipse cx={0} cy={-150} rx={150} ry={34} fill="#060812" stroke={PALE} strokeOpacity={0.5} strokeWidth={4} />
    <path d="M -128 -150 V -380 M 128 -150 V -380 M -146 -380 H 146" stroke="#2a2216" strokeWidth={16} strokeLinecap="round" />
    <circle cx={0} cy={-380} r={22} fill="#0a0d18" stroke={GOLD} strokeOpacity={0.8} strokeWidth={5} />
    <line x1={0} y1={-358} x2={0} y2={-300 + 150 * down} stroke={GOLD} strokeOpacity={0.85} strokeWidth={4} />
    <g transform={`translate(0 ${-300 + 150 * down})`} opacity={1 - clamp((down - 0.85) / 0.15)}>
      <path d="M -26 0 L 26 0 L 20 46 L -20 46 Z" fill="#2a2216" stroke={GOLD} strokeOpacity={0.8} strokeWidth={4} />
      <path d="M -26 0 C -26 -26 26 -26 26 0" fill="none" stroke={GOLD} strokeOpacity={0.8} strokeWidth={3} />
    </g>
  </g>
);

/** The well at dusk and a caravan on the horizon (short 1): the bucket goes down with the verse, comes up with its meaning. */
const SayyaraPicture: Drawn = ({ t, show, since, horizon }) => {
  const place = Math.max(show("listen"), show("meaning"), 0.3 * show("close"));
  const down = show("listen") > 0 && show("meaning") === 0 ? after(t, since("listen") + 4.5, 2.2) : 1 - after(t, since("meaning") + 3.5, 2.5);
  return (
    <g>
      <defs>
        <radialGradient id="quiz-dusk" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#d9895a" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#d9895a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={horizon - 520} width={W} height={540} fill="url(#quiz-dusk)" />
      <Stars t={t} opacity={0.6} />
      {[0, 1, 2, 3].map((k) => (
        <g key={k} transform={`translate(${940 + k * 140 - 16 * t} ${horizon + 10}) scale(${0.62 - k * 0.04})`} opacity={0.45 + 0.55 * place}>
          <Camel legs={t * 3.4 + k} />
        </g>
      ))}
      <Ground horizon={horizon} />
      <g opacity={place}><Well x={540} y={horizon + 80} down={place > 0 ? down : 0} /></g>
    </g>
  );
};

/** A night that grows light from the horizon, slowly, through the verse and its meaning (short 2): nothing else, the
 * verse is a word of the Day of Judgment and is never pictured. */
const KhatimaPicture: Drawn = ({ t, show, since, horizon }) => {
  const light = Math.max(show("listen") * after(t, since("listen"), 16), show("meaning"), show("close"));
  return (
    <g>
      <defs>
        <radialGradient id="quiz-dawn" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="#8fa6d9" stopOpacity={0.6} />
          <stop offset="60%" stopColor="#3a4f86" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#3a4f86" stopOpacity={0} />
        </radialGradient>
      </defs>
      <Stars t={t} opacity={0.9 - 0.6 * light} />
      <rect x={0} y={horizon - 900} width={W} height={920} fill="url(#quiz-dawn)" opacity={0.15 + 0.85 * light} />
      <Ground horizon={horizon} />
    </g>
  );
};

/** A plain under a low light (short 3): the verses are face to face above it; nobody is drawn. */
const QalahaPicture: Drawn = ({ t, horizon }) => (
  <g>
    <defs>
      <radialGradient id="quiz-low" cx="50%" cy="100%" r="75%">
        <stop offset="0%" stopColor="#c47a52" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#c47a52" stopOpacity={0} />
      </radialGradient>
    </defs>
    <Stars t={t} opacity={0.5} />
    <rect x={0} y={horizon - 500} width={W} height={520} fill="url(#quiz-low)" />
    <Ground horizon={horizon} />
  </g>
);

const IDS = Object.keys(QUIZ) as Id[];
export const QUIZ_PICTURES: Record<string, Drawn> = { sayyara: SayyaraPicture, khatima: KhatimaPicture, qalaha: QalahaPicture };
export const QUIZ_OVERLAYS: Record<string, Drawn> = Object.fromEntries(IDS.map((id) => [id, makeOverlay(id)]));
/** The question and the lines of the voice under the words of the question (to 600); the countdown, the choices and the
 * speakers in the middle of the frame; the translation and the references under them. */
const LAYOUT: LayoutOverride = { top: 600, size: 76, height: 200, sub: { top: 1490 }, credit: { top: 1700, size: 26 } };
export const QUIZ_LAYOUTS: Record<string, LayoutOverride> = Object.fromEntries(IDS.map((id) => [id, LAYOUT]));
