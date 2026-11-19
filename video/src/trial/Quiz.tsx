// The series « معاك 5 ثواني » (content/trial/quiz.yaml; docs/scripts/quiz.md, validated by the owner on 2026-11-17): a
// question on the first frame, three choices, a countdown of five seconds, the answer; then the reciter says the verse
// and the voice gives its meaning. What must not move (the question's words, the countdown, the choices, the two
// speakers face to face) is drawn above the veil (QUIZ_OVERLAYS); the picture under it (QUIZ_PICTURES) is the place:
// a well and a caravan at dusk (the word « سَيَّارَةٌ »), a night that slowly grows light, a plain; then (shorts 4 to 6)
// the arches of a hall and a staff that the termite eats, a dawn, a hoopoe that comes to a branch. Every Quranic word
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
/** Numbers are written 1 2 3, never ١ ٢ ٣ (the owner, 2026-11-17: « les nombres doivent être 123 et non pas ١٢٣ »). */
const NUM = (n: number) => String(n);
/** The letters a line of Quranic text takes on its row: its marks and vowels take no width. */
const letters = (text: string) => text.replace(/[ً-ٰٟۖ-ۭـ]/g, "").length;
/** The largest size, up to `most`, at which `text` stays within `width` (a letter of Amiri Quran is about 0.42 em). */
const fitQuran = (text: string, most: number, width = 900) => Math.min(most, Math.floor(width / (0.42 * Math.max(1, letters(text)))));

type Piece = { surah: number; ayah: number; name: string; first: number; last: number; words: readonly string[] };
/** `note`: a wrong choice that is true elsewhere (a real meaning in another verse, real words said another time): at the
 * answer it is not struck through, it fades and its reference is written under it instead of its English. */
type Note = { ar: string; en: string };
type Choice = { ar: string | null; en: string; right: boolean; icon: string | null; note?: Note | null; quran?: Piece };
type Quiz = { head: Piece; choices: readonly Choice[]; both: boolean; blank?: Piece; speakers?: readonly { ar: string; en: string; quran: Piece }[] };
type Id = keyof typeof QUIZ;
const data = (id: Id) => QUIZ[id] as unknown as Quiz;
/** The scenes where the question's words stay above the lines of the voice (not over a verse being recited). */
const MEANING = ["meaning", "fall", "jinn", "patience", "check", "lesson"];

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
      <text y={30} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={86} fill={late ? ROSE : GOLD}>{NUM(left)}</text>
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
  const fade = right ? 1 : 1 - (choice.note ? 0.45 : 0.62) * shown;
  const colour = right && shown > 0 ? GOLD : PALE;
  const quran = choice.quran ? choice.quran.words.join(" ") : null;
  const text = quran ?? choice.ar ?? "";
  const note = right ? null : choice.note ?? null;
  const strike = right || note ? 0 : after(t, answer + 0.1, 0.3);
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
            fontSize={quran ? fitQuran(text, 52, 700) : 52} fill={colour}>{RTL(text)}</text>
      <text x={textX} y={y + 48} textAnchor="middle" fontFamily={FONT.latin} fontStyle="italic" fontSize={24} fill={DIM} opacity={note ? 1 - shown : 1}>{choice.en}</text>
      {note && shown > 0 ? (
        <text x={textX} y={y + 50} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={28} fill={GOLD} opacity={shown}>{RTL(note.ar)}</text>
      ) : null}
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
  const ref = `${quiz.head.name} · ${NUM(quiz.head.ayah)}`;
  if (!quiz.blank) {
    const short = quiz.head.words.length <= 2;              // a word or two: written large
    const size = fitQuran(`«${head}»`, quiz.head.words.length === 1 ? 128 : short ? 112 : 70);
    return (
      <g opacity={opacity}>
        <text x={540} y={short ? 470 : 450} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={size} fill={GOLD}
              style={{ filter: "drop-shadow(0 2px 14px rgba(4,7,20,.9))" }}>{RTL(`«${head}»`)}</text>
        <text x={540} y={short ? 528 : 512} textAnchor="middle" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={PALE} opacity={0.7}>{RTL(ref)}</text>
      </g>
    );
  }
  const end = quiz.blank.words.join(" ");
  const filled = after(t, answer + 0.15, 0.5);
  return (
    <g opacity={opacity}>
      <text x={540} y={410} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={fitQuran(head, quiz.head.words.length <= 2 ? 84 : 62)} fill={PALE}
            style={{ filter: "drop-shadow(0 2px 14px rgba(4,7,20,.9))" }}>{RTL(`«${head}`)}</text>
      <g opacity={1 - filled}>
        <rect x={330} y={444} width={420} height={92} rx={18} fill={INK} fillOpacity={0.6} stroke={GOLD} strokeOpacity={0.7} strokeWidth={3} strokeDasharray="12 9" />
        <text x={540} y={514} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={72} fill={GOLD} opacity={0.55 + 0.45 * Math.sin(t * 4) ** 2}>؟</text>
      </g>
      <text x={540} y={516} textAnchor="middle" direction="rtl" fontFamily={FONT.quran} fontSize={fitQuran(end, quiz.blank.words.length > 3 ? 58 : 70)} fill={GOLD} opacity={filled}
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
      <text x={104} y={y + 52} textAnchor="end" direction="rtl" fontFamily={FONT.arabic} fontWeight={700} fontSize={28} fill={colour} opacity={0.8}>{RTL(`${s.quran.name} · ${NUM(s.quran.ayah)}`)}</text>
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
    const meaning = Math.max(...MEANING.map((scene) => show(scene)));
    const head = Math.max(asking, answered * (quiz.speakers ? 0 : 1), meaning);
    const speakers = quiz.speakers
      ? Math.max(show("abel"), show("satan"), show("abel-meaning"), show("satan-meaning"))
      : 0;
    const lit = (k: number) => (k === 0 ? Math.max(show("abel"), show("abel-meaning")) : Math.max(show("satan"), show("satan-meaning")));
    return (
      <g>
        {/* the name of the series and a stopwatch; no episode number (owner, 2026-11-18: « supprime le numéro de
            l'épisode sur les prochains rendus », the test page on Meta publishing one quiz a day) */}
        <g>
          <circle cx={114} cy={270} r={22} fill="none" stroke={GOLD} strokeWidth={2.5} />
          <rect x={108} y={240} width={12} height={6} rx={2} fill={GOLD} />
          <path d="M 114 270 L 114 256 M 114 270 L 123 276" stroke={GOLD} strokeWidth={2.5} strokeLinecap="round" />
          <text x={152} y={280} fontFamily={FONT.arabic} fontWeight={700} fontSize={34} fill={GOLD} style={{ filter: "drop-shadow(0 2px 10px rgba(4,7,20,.9))" }}>معاك 5 ثواني</text>
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
      <rect x={0} y={horizon - 520} width={W} height={540} fill="url(#quiz-dusk)" opacity={0.5} />
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

/** A plain under a low light (short 3, over its filmed sunset): the verses are face to face above it; nobody is drawn. */
const QalahaPicture: Drawn = ({ horizon }) => (
  <g>
    <defs>
      <radialGradient id="quiz-low" cx="50%" cy="100%" r="75%">
        <stop offset="0%" stopColor="#c47a52" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#c47a52" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={0} y={horizon - 500} width={W} height={520} fill="url(#quiz-low)" opacity={0.5} />
    <Ground horizon={horizon} />
  </g>
);

/** The arches of a great hall (the « محاريب » the jinn built, 34:13), dark against the evening. */
const Arches: React.FC<{ horizon: number }> = ({ horizon }) => {
  const top = horizon - 560;
  return (
    <g fill="#03050c">
      <path d={`M 0 ${top - 40} H ${W} V ${top + 30} H 0 Z`} />
      {[0, 1, 2, 3].map((k) => {
        const x = 40 + k * 260;
        return (
          <path key={k} d={`M ${x} ${top + 30} H ${x + 220} V ${horizon + 40} H ${x + 196} V ${top + 230} C ${x + 196} ${top + 120} ${x + 24} ${top + 120} ${x + 24} ${top + 230} V ${horizon + 40} H ${x} Z`} />
        );
      })}
      <path d={`M 0 ${horizon + 40} H ${W} V 1920 H 0 Z`} />
    </g>
  );
};

/** A wooden staff standing alone (short 4); the termite eats it from the verse on (`holes` 0 to 1), it breaks and falls
 * with the second line of the voice (`fall` 0 to 1). Nobody leans on it in the picture: Solomon is never drawn. */
const Staff: React.FC<{ x: number; y: number; holes: number; fall: number }> = ({ x, y, holes, fall }) => {
  const length = 430;
  const marks = [0.12, 0.2, 0.31, 0.27, 0.42, 0.16, 0.36, 0.08];
  const shown = Math.floor(holes * marks.length + 0.001);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={4} rx={60} ry={8} fill="#000" opacity={0.5} />
      <g transform={`translate(0 ${66 * fall}) rotate(${-86 * fall} 0 ${-length * 0.18})`}>
        <path d={`M -9 ${-length * 0.18} L -7 ${-length} C -7 ${-length - 38} 40 ${-length - 40} 42 ${-length - 8}`} fill="none" stroke="#3a2c1c" strokeWidth={16} strokeLinecap="round" />
        <path d={`M -9 ${-length * 0.18} L -7 ${-length}`} stroke={GOLD} strokeOpacity={0.35} strokeWidth={3} />
        {marks.slice(0, shown).map((m, k) => (
          <ellipse key={k} cx={k % 2 ? -5 : -11} cy={-length * (0.22 + m * 1.6)} rx={4} ry={6} fill="#0b0805" stroke={GOLD} strokeOpacity={0.5} strokeWidth={1.5} />
        ))}
      </g>
      <path d={`M -9 0 L -9 ${-length * 0.18}`} stroke="#3a2c1c" strokeWidth={16} strokeLinecap="round" />
      {fall > 0.05 ? <path d={`M -20 ${-length * 0.18} l 6 -8 l 6 6 l 7 -9 l 6 8`} fill="none" stroke={GOLD} strokeOpacity={0.6 * fall} strokeWidth={2} /> : null}
    </g>
  );
};

/** Short 4: the evening, the arches, the staff; nothing before the answer that could give it away. */
const DabbaPicture: Drawn = ({ t, show, since, horizon }) => {
  const place = Math.max(show("listen"), ...MEANING.map((scene) => show(scene)), 0.4 * show("close"));
  const holes = show("listen") > 0 && show("meaning") === 0 ? after(t, since("listen") + 2, 10) : 1;
  const fall = show("fall") > 0 ? after(t, since("fall") + 6.5, 1.1) : Math.max(show("jinn"), show("close"));
  return (
    <g>
      <defs>
        <radialGradient id="quiz-hall" cx="50%" cy="100%" r="75%">
          <stop offset="0%" stopColor="#c9855a" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#c9855a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={horizon - 600} width={W} height={620} fill="url(#quiz-hall)" opacity={0.5} />
      <Arches horizon={horizon} />
      <g opacity={place}><Staff x={560} y={horizon + 40} holes={place > 0 ? holes : 0} fall={place > 0 ? fall : 0} /></g>
    </g>
  );
};

/** Short 5, over its filmed dawn: the light grows on the horizon from the answer on (relief when the hardship is at its
 * height, as-Sa'di on 12:83); nothing and nobody is drawn. */
const SabrPicture: Drawn = ({ t, show, since, horizon }) => {
  const light = show("ask") > 0 ? after(t, since("ask") + SECONDS, 3) * 0.5 : Math.max(show("listen") * (0.5 + 0.5 * after(t, since("listen"), 14)), ...MEANING.map((scene) => show(scene)), show("close"));
  return (
    <g>
      <defs>
        <radialGradient id="quiz-rise" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="#f2b77e" stopOpacity={0.6} />
          <stop offset="55%" stopColor="#c9855a" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#c9855a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={horizon - 900} width={W} height={920} fill="url(#quiz-rise)" opacity={0.1 + 0.9 * light} />
      <Ground horizon={horizon} />
    </g>
  );
};

/** A hoopoe in silhouette, its crest open, facing left; `wing` beats (0: folded). Feet at y 0. */
const Hoopoe: React.FC<{ wing: number }> = ({ wing }) => (
  <g fill="#03050c" stroke={PALE} strokeOpacity={0.28} strokeWidth={1.5}>
    <path d="M 46 -40 L 96 -30 L 92 -22 L 44 -26 Z" />
    <ellipse cx={8} cy={-36} rx={44} ry={22} />
    <circle cx={-34} cy={-58} r={15} />
    <path d="M -46 -60 C -66 -60 -88 -56 -106 -50 C -88 -52 -66 -54 -46 -54 Z" />
    {[-60, -40, -20, 0, 20].map((a, k) => (
      <path key={k} d="M -30 -70 L -28 -104 L -24 -70 Z" transform={`rotate(${a} -30 -68)`} />
    ))}
    <g transform={`rotate(${22 - 70 * wing} -6 -44)`}>
      <path d="M -10 -46 C 10 -70 50 -78 74 -66 C 52 -58 30 -46 8 -38 Z" />
      {[0, 1, 2].map((k) => <path key={k} d={`M ${18 + 16 * k} ${-62 + 2 * k} L ${10 + 16 * k} ${-46 + 2 * k}`} stroke={PALE} strokeOpacity={0.35} strokeWidth={4} />)}
    </g>
    <path d="M -2 -16 L -6 0 M 10 -16 L 8 0" stroke="#03050c" strokeWidth={4} />
  </g>
);

/** Short 6: a dry branch on the plain; with the verse a hoopoe comes from far away and lands on it. Before the answer
 * nothing is drawn (it would give it away); nobody else is ever drawn. */
const HudhudPicture: Drawn = ({ t, show, since, horizon }) => {
  const place = Math.max(show("listen"), show("verify"), ...MEANING.map((scene) => show(scene)), 0.5 * show("close"));
  const come = show("listen") > 0 && show("meaning") === 0 ? after(t, since("listen") + 0.5, 6) : 1;
  const bx = 250 + (740 - 250) * come;
  const by = horizon - 420 - 260 * Math.sin(Math.PI * come) * (1 - come) + 158 * come;   // its feet on the top of the branch
  const scale = 0.5 + 0.9 * come;
  const wing = come < 1 ? 0.5 + 0.5 * Math.sin(t * 14) : 0.08 * Math.max(0, Math.sin(t * 2));
  return (
    <g>
      <Ground horizon={horizon} />
      <g opacity={place}>
        <path d={`M 860 ${horizon + 10} C 850 ${horizon - 120} 820 ${horizon - 210} 760 ${horizon - 270} M 812 ${horizon - 190} C 860 ${horizon - 240} 900 ${horizon - 250} 930 ${horizon - 300} M 790 ${horizon - 236} C 720 ${horizon - 260} 690 ${horizon - 250} 650 ${horizon - 290}`}
              fill="none" stroke="#1a1410" strokeWidth={14} strokeLinecap="round" />
        <g transform={`translate(${bx} ${by}) scale(${scale})`}><Hoopoe wing={wing} /></g>
      </g>
    </g>
  );
};

const IDS = Object.keys(QUIZ) as Id[];
export const QUIZ_PICTURES: Record<string, Drawn> = {
  sayyara: SayyaraPicture, khatima: KhatimaPicture, qalaha: QalahaPicture, dabba: DabbaPicture, sabr: SabrPicture, hudhud: HudhudPicture,
};
export const QUIZ_OVERLAYS: Record<string, Drawn> = Object.fromEntries(IDS.map((id) => [id, makeOverlay(id)]));
/** The question and the lines of the voice under the words of the question (to 600); the countdown, the choices and the
 * speakers in the middle of the frame; the translation and the references under them. */
const LAYOUT: LayoutOverride = { top: 600, size: 76, height: 200, sub: { top: 1490 }, credit: { top: 1700, size: 26 } };
export const QUIZ_LAYOUTS: Record<string, LayoutOverride> = Object.fromEntries(IDS.map((id) => [id, LAYOUT]));
