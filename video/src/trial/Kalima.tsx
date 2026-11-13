// The series « كلمة من القرآن » (content/trial/kalima.yaml, kanud.yaml, stone.yaml, haluu.yaml; script validated by the
// owner: docs/scripts/kalima.md). One rare word of the Quran an episode: the word written large in gold from the first
// frame (never said by the synthetic voice: the reciter says it first), and backlit silhouettes of what the lines say,
// over a filmed clip. Nobody is drawn: horses with no rider (100:1-5), a date stone and its three parts (4:49, 4:124,
// 35:13), a prayer rug facing a niche and no one on it (70:22-23), a notebook, a glass of water, an envelope.
import type React from "react";
import { interpolate } from "remotion";
import { FONT } from "../fonts";
import type { Drawn } from "./Trial";

const W = 1080;
const GOLD = "#f0c46a";
const INK = "#07060a";
const PALE = "#f4efe2";

/** A number between 0 and 1 from an index: the same at every frame (the render draws frames in any order). */
const chance = (i: number, salt = 0) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const clamp = (x: number) => Math.min(1, Math.max(0, x));
/** 0 before `at`, then up to 1 over `over` seconds. */
const after = (t: number, at: number, over = 0.8) => clamp((t - at) / over);

const Defs: React.FC = () => (
  <defs>
    <radialGradient id="kw-glow"><stop offset="0" stopColor="#fff2c8" stopOpacity={0.55} /><stop offset="1" stopColor="#f0c46a" stopOpacity={0} /></radialGradient>
    <radialGradient id="kw-stone" cx=".38" cy=".32"><stop offset="0" stopColor="#8a5a34" /><stop offset=".55" stopColor="#4f2f19" /><stop offset="1" stopColor="#24140a" /></radialGradient>
    <linearGradient id="kw-rug" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a1f22" /><stop offset="1" stopColor="#2a0c0e" /></linearGradient>
    <filter id="kw-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16" /></filter>
    <filter id="kw-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
  </defs>
);

/** The word of the episode, large and in gold, with a halo: the first thing the eye finds. */
const Word: React.FC<{ text: string; y: number; size?: number; opacity?: number }> = ({ text, y, size = 230, opacity = 1 }) => (
  <g opacity={opacity}>
    <ellipse cx={W / 2} cy={y - size * 0.3} rx={size * 2} ry={size * 0.9} fill="url(#kw-glow)" />
    <text x={W / 2} y={y} textAnchor="middle" fontFamily={FONT.quran} fontSize={size} fill={GOLD}
      style={{ filter: "drop-shadow(0 4px 18px rgba(4,7,20,.95))" }}>{text}</text>
  </g>
);

// ---- 1. كنود (100:1-8): horses at dawn, then a notebook of misfortunes and blessings ---------------------------------

/** A horse at full gallop, facing left, feet at (0, 0); 300 px long at scale 1. A silhouette, no rider, no harness. */
const HORSE =
  "M 112 -172 C 60 -186 -20 -186 -70 -178 C -95 -196 -120 -226 -142 -252 L -150 -270 L -158 -290 L -166 -272 " +
  "C -178 -276 -192 -272 -204 -262 C -222 -246 -240 -228 -252 -212 C -258 -204 -254 -194 -244 -194 C -230 -194 -214 -200 -200 -206 " +
  "C -186 -196 -158 -172 -132 -148 C -120 -132 -112 -118 -104 -108 L -160 -66 L -206 -30 L -230 -16 L -222 -4 L -196 -16 " +
  "L -146 -50 L -94 -92 L -94 -56 L -80 -14 L -64 -4 L -56 -14 L -72 -30 L -78 -62 L -66 -100 C -20 -106 30 -106 66 -104 " +
  "L 104 -66 L 152 -36 L 206 -14 L 212 -26 L 162 -50 L 116 -96 L 108 -58 L 96 -10 L 106 0 L 120 -10 L 122 -62 L 128 -104 " +
  "C 140 -122 138 -150 112 -172 Z";
const TAIL = "M 116 -168 C 156 -172 190 -150 220 -132 C 198 -154 166 -184 122 -182 Z";
const MANE = "M -142 -252 C -116 -236 -96 -210 -78 -182 C -106 -204 -128 -226 -150 -262 Z";

const Horse: React.FC<{ x: number; y: number; scale: number; t: number; phase: number; rim?: string }> = ({ x, y, scale, t, phase, rim = "#ffcf8a" }) => {
  const bob = 7 * Math.sin(t * 9 + phase);
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${scale})`}>
      <ellipse cx={-10} cy={6 - bob / scale} rx={190} ry={14} fill="#000" opacity={0.35} filter="url(#kw-soft)" />
      <path d={TAIL} fill={INK} />
      <path d={HORSE} fill={INK} />
      <path d={MANE} fill={INK} />
      <path d="M -70 -178 C -20 -186 60 -186 112 -172" fill="none" stroke={rim} strokeWidth={4} opacity={0.6} />
      <path d="M -166 -272 C -178 -276 -192 -272 -204 -262 C -222 -246 -240 -228 -252 -212" fill="none" stroke={rim} strokeWidth={4} opacity={0.45} />
    </g>
  );
};

/** Sparks struck from the stones by the hooves (100:2), flickering under the herd. */
const Sparks: React.FC<{ x: number; y: number; t: number; salt: number }> = ({ x, y, t, salt }) => (
  <g>
    {Array.from({ length: 9 }, (_, i) => {
      const life = (t * 3 + chance(i, salt)) % 1;
      const dx = (chance(i, salt + 1) - 0.5) * 120 + life * 40;
      const dy = -life * (30 + 50 * chance(i, salt + 2));
      return <circle key={i} cx={x + dx} cy={y + dy} r={3 + 3 * (1 - life)} fill="#ffb24a" opacity={(1 - life) * 0.9} />;
    })}
  </g>
);

/** The dust the charge raises (100:4): soft clouds behind the horses, drifting and growing. */
const Dust: React.FC<{ y: number; t: number; amount: number }> = ({ y, t, amount }) => (
  <g opacity={amount} filter="url(#kw-blur)">
    {Array.from({ length: 7 }, (_, i) => {
      const drift = ((t * 26 + i * 170) % 1300) - 100;
      return <ellipse key={i} cx={drift} cy={y - 40 - 30 * chance(i, 3)} rx={150 + 60 * chance(i, 4)} ry={60 + 20 * chance(i, 5)} fill="#c99a62" opacity={0.45} />;
    })}
  </g>
);

const Herd: React.FC<{ t: number; horizon: number; since: number }> = ({ t, horizon, since }) => {
  const run = (t - since) * 70;
  const xs = [760, 520, 940, 300];
  return (
    <g>
      <Dust y={horizon + 30} t={t} amount={clamp((t - since) / 6)} />
      {xs.map((x0, k) => {
        const x = ((x0 - run - k * 40) % 1500 + 1500) % 1500 - 200;
        const y = horizon + 40 + (k % 2) * 70;
        const s = 0.62 + (k % 2) * 0.12;
        return (
          <g key={k}>
            <Sparks x={x - 200 * s} y={y} t={t + k} salt={k * 7} />
            <Horse x={x} y={y} scale={s} t={t} phase={k * 1.7} />
          </g>
        );
      })}
    </g>
  );
};

/** An open notebook: a page of tally marks (the misfortunes counted) and a page left blank (the blessings), and
 * around it what the blank page forgets: bread, a glass of water, a lamp, a lit window. `marks`: the gold marks
 * written on the blank page, 0 to 3. */
const Notebook: React.FC<{ y: number; marks: number; things: number }> = ({ y, marks, things }) => (
  <g>
    <g opacity={things}>
      {/* a lit window, a lamp, a glass of water, a loaf of bread */}
      <rect x={90} y={y - 330} width={130} height={160} rx={6} fill="#ffd9a0" opacity={0.85} />
      <path d={`M 155 ${y - 330} L 155 ${y - 170} M 90 ${y - 250} L 220 ${y - 250}`} stroke={INK} strokeWidth={8} />
      <path d={`M 880 ${y - 230} L 920 ${y - 230} L 932 ${y - 180} L 868 ${y - 180} Z`} fill={INK} />
      <ellipse cx={900} cy={y - 260} rx={60} ry={60} fill="url(#kw-glow)" />
      <path d={`M 893 ${y - 230} C 888 ${y - 250} 912 ${y - 252} 907 ${y - 230} Z`} fill="#ffcf8a" />
      <path d={`M 150 ${y + 150} L 200 ${y + 150} L 194 ${y + 250} L 156 ${y + 250} Z`} fill="#9fc6e8" opacity={0.55} stroke={PALE} strokeWidth={3} />
      <path d={`M 800 ${y + 250} C 790 ${y + 190} 860 ${y + 160} 930 ${y + 170} C 990 ${y + 180} 1010 ${y + 230} 990 ${y + 250} Z`} fill="#b7834c" />
    </g>
    <g transform={`translate(${W / 2} ${y})`}>
      <path d="M -330 -170 L -10 -150 L -10 190 L -330 170 Z" fill="#e9e0cb" />
      <path d="M 10 -150 L 330 -170 L 330 170 L 10 190 Z" fill="#f4efe2" />
      <path d="M -10 -150 L 10 -150 L 10 190 L -10 190 Z" fill="#b9ad93" />
      {/* the misfortunes: a full page of marks */}
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 4 }, (_, g) => (
          <g key={`${row}-${g}`} stroke="#3a2a1a" strokeWidth={4} strokeLinecap="round">
            {[0, 1, 2, 3].map((m) => <path key={m} d={`M ${-300 + g * 70 + m * 12} ${-120 + row * 36} l 0 24`} />)}
            <path d={`M ${-304 + g * 70} ${-104 + row * 36} l 46 -14`} />
          </g>
        )),
      )}
      {/* the blessings: three gold marks, once counted */}
      {[0, 1, 2].map((m) => (
        <path key={m} d={`M ${110 + m * 60} -60 l 0 ${110 * clamp(marks - m)}`} stroke={GOLD} strokeWidth={14} strokeLinecap="round" opacity={marks - m > 0.02 ? 1 : 0} />
      ))}
    </g>
  </g>
);

/** A day in things: the sun, bread, a house; and one cracked cup. */
const Day: React.FC<{ y: number }> = ({ y }) => (
  <g>
    <circle cx={200} cy={y - 160} r={70} fill="#ffd27a" />
    <circle cx={200} cy={y - 160} r={150} fill="url(#kw-glow)" />
    <path d={`M 380 ${y + 10} C 370 ${y - 50} 440 ${y - 80} 510 ${y - 70} C 570 ${y - 60} 590 ${y - 10} 570 ${y + 10} Z`} fill="#b7834c" />
    <path d={`M 650 ${y + 10} L 650 ${y - 120} L 760 ${y - 200} L 870 ${y - 120} L 870 ${y + 10} Z`} fill={INK} />
    <rect x={735} y={y - 90} width={50} height={60} fill="#ffd9a0" />
    <g transform={`translate(540 ${y + 210})`}>
      <path d="M -60 -70 L 60 -70 L 50 40 L -50 40 Z" fill={PALE} />
      <path d="M 60 -45 C 100 -45 100 10 55 10" fill="none" stroke={PALE} strokeWidth={10} />
      <path d="M -10 -70 L 5 -30 L -12 0 L 6 40" fill="none" stroke={INK} strokeWidth={5} />
    </g>
  </g>
);

const KanudPicture: Drawn = ({ t, show, since, horizon }) => {
  const notebook = Math.max(show("ledger"), show("count"));
  return (
    <g>
      <Defs />
      <g opacity={show("horses")}><Herd t={t} horizon={horizon} since={since("horses")} /></g>
      <g opacity={Math.max(show("word"), show("meaning"))}>
        <g opacity={0.5}><Herd t={t} horizon={horizon} since={0} /></g>
        <Word text="كَنُود" y={1120} />
      </g>
      <g opacity={notebook}><Notebook y={1060} marks={show("count") * 3 * after(t, since("count") + 1, 4)} things={1} /></g>
      <g opacity={show("day")}><Day y={1060} /></g>
      <g opacity={show("next")}><Stone cx={W / 2} cy={1080} scale={0.7} t={t} lit={{}} /></g>
    </g>
  );
};

// ---- 2. نواة التمرة (4:49, 4:124, 35:13): one date stone, its three parts lit one after the other -----------------------

/** A date stone, long and rounded, its groove along one side (with the thread in it: فتيل), a small dent on its back
 * (نقير) and the thin white skin around it (قطمير). `lit`: how lit each part is, 0 to 1. */
const Stone: React.FC<{ cx: number; cy: number; scale: number; t: number; lit: { thread?: number; speck?: number; skin?: number } }> = ({ cx, cy, scale, t, lit }) => {
  const breathe = 1 + 0.01 * Math.sin(t * 1.2);
  const skin = lit.skin ?? 0;
  const thread = lit.thread ?? 0;
  const speck = lit.speck ?? 0;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(-18) scale(${scale * breathe})`}>
      <ellipse cx={0} cy={150} rx={300} ry={30} fill="#000" opacity={0.4} filter="url(#kw-soft)" />
      {/* the skin around it */}
      <ellipse cx={0} cy={0} rx={312} ry={126} fill={PALE} opacity={0.12 + 0.25 * skin} />
      <ellipse cx={0} cy={0} rx={312} ry={126} fill="none" stroke={skin > 0 ? GOLD : PALE} strokeWidth={4 + 6 * skin} opacity={0.35 + 0.65 * skin} />
      {/* the stone */}
      <ellipse cx={0} cy={0} rx={296} ry={110} fill="url(#kw-stone)" />
      <path d="M -270 -40 C -150 -95 120 -100 270 -36" fill="none" stroke="#a87a4e" strokeWidth={6} opacity={0.5} />
      {/* the groove along its side, and the thread in it */}
      <path d="M -250 18 C -120 40 120 40 250 16" fill="none" stroke="#1a0d05" strokeWidth={22} strokeLinecap="round" />
      <path d="M -240 18 C -120 38 120 38 240 16" fill="none" stroke={thread > 0 ? GOLD : "#6b4a2c"} strokeWidth={4 + 4 * thread} strokeLinecap="round" opacity={0.6 + 0.4 * thread} />
      {/* the dent on its back */}
      <circle cx={60} cy={-52} r={13} fill="#1a0d05" />
      <circle cx={60} cy={-52} r={13 + 26 * speck} fill="none" stroke={GOLD} strokeWidth={5} opacity={speck} />
      <circle cx={60} cy={-52} r={6} fill={GOLD} opacity={speck} />
      {/* the glow of the part being named */}
      <ellipse cx={0} cy={20} rx={300} ry={60} fill="url(#kw-glow)" opacity={thread * 0.6} />
      <circle cx={60} cy={-52} r={90} fill="url(#kw-glow)" opacity={speck * 0.8} />
    </g>
  );
};

/** The sun and the moon on their courses above the stone (35:13). */
const Lights: React.FC<{ t: number; since: number }> = ({ t, since }) => {
  const k = clamp((t - since) / 30);
  return (
    <g>
      {/* below the verse's text: the sun goes down on the left while the moon rises on the right */}
      <circle cx={interpolate(k, [0, 1], [150, 300])} cy={interpolate(k, [0, 1], [850, 930])} r={46} fill="#ffd27a" opacity={1 - 0.6 * k} />
      <circle cx={interpolate(k, [0, 1], [150, 300])} cy={interpolate(k, [0, 1], [850, 930])} r={120} fill="url(#kw-glow)" opacity={1 - 0.6 * k} />
      <g opacity={0.3 + 0.7 * k}>
        <circle cx={interpolate(k, [0, 1], [940, 800])} cy={interpolate(k, [0, 1], [930, 850])} r={40} fill={PALE} />
        <circle cx={interpolate(k, [0, 1], [956, 816])} cy={interpolate(k, [0, 1], [919, 839])} r={36} fill="#14162a" />
      </g>
    </g>
  );
};

/** The three words around the stone, each in gold while its part is named. */
const Labels: React.FC<{ thread: number; speck: number; skin: number; all: number }> = ({ thread, speck, skin, all }) => {
  const word = (text: string, x: number, y: number, on: number) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={FONT.quran} fontSize={92} fill={on > 0.01 ? GOLD : PALE}
      opacity={0.35 + 0.65 * Math.max(on, all)} style={{ filter: "drop-shadow(0 3px 12px rgba(4,7,20,.95))" }}>{text}</text>
  );
  return (
    <g>
      {word("فَتِيل", 250, 1330, thread)}
      {word("نَقِير", 620, 890, speck)}
      {word("قِطْمِير", 850, 1310, skin)}
    </g>
  );
};

/** A glass of water, given with no one watching. */
const Glass: React.FC<{ y: number; t: number }> = ({ y, t }) => (
  <g transform={`translate(${W / 2} ${y})`}>
    <ellipse cx={0} cy={0} rx={260} ry={260} fill="url(#kw-glow)" opacity={0.6} />
    <path d="M -90 -150 L 90 -150 L 70 150 L -70 150 Z" fill="#9fc6e8" opacity={0.25} stroke={PALE} strokeWidth={6} />
    <path d={`M -82 ${-70 + 4 * Math.sin(t * 2)} C -30 ${-80 + 4 * Math.sin(t * 2 + 1)} 30 ${-60 + 4 * Math.sin(t * 2 + 2)} 82 ${-70 + 4 * Math.sin(t * 2 + 3)} L 70 150 L -70 150 Z`} fill="#7fb6e6" opacity={0.55} />
    <path d="M -60 -130 L -46 120" stroke={PALE} strokeWidth={6} opacity={0.5} />
  </g>
);

const StonePicture: Drawn = ({ t, show, since }) => {
  const thread = show("thread");
  const speck = show("speck");
  const skin = show("skin");
  const all = Math.max(show("stone"), show("remember"));
  return (
    <g>
      <Defs />
      <g opacity={skin}><Lights t={t} since={since("skin")} /></g>
      <g opacity={1 - Math.max(show("cup"), show("next"))}>
        <Stone cx={W / 2} cy={1100} scale={1} t={t} lit={{ thread: Math.max(thread, all), speck: Math.max(speck, all), skin: Math.max(skin * after(t, since("skin") + 26, 2), all) }} />
        <Labels thread={thread} speck={speck} skin={skin} all={all} />
      </g>
      <g opacity={show("cup")}><Glass y={1080} t={t} /></g>
      <g opacity={show("next")}><Word text="؟" y={1160} size={260} /></g>
    </g>
  );
};

// ---- 3. هلوعا (70:19-23): a storm, a closed chest, then a prayer rug facing a niche at dawn ------------------------------

/** Rain in slanted streaks, the same at every frame for a given time. */
const Rain: React.FC<{ t: number; amount: number }> = ({ t, amount }) => (
  <g opacity={amount} stroke="#cfe3f2" strokeWidth={2.5}>
    {Array.from({ length: 70 }, (_, i) => {
      const x = chance(i, 1) * 1300 - 100;
      const y = ((chance(i, 2) * 1920 + t * 900) % 1920);
      return <path key={i} d={`M ${x} ${y} l -18 60`} opacity={0.25 + 0.4 * chance(i, 3)} />;
    })}
  </g>
);

/** A chest shut tight, its clasp closed: the good kept back (70:21). */
const Chest: React.FC<{ x: number; y: number; scale: number }> = ({ x, y, scale }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M -160 0 L 160 0 L 160 -150 L -160 -150 Z" fill={INK} />
    <path d="M -160 -150 C -160 -230 160 -230 160 -150 Z" fill="#120c08" />
    <path d="M -160 -150 L 160 -150" stroke="#b07a3e" strokeWidth={8} />
    <rect x={-22} y={-170} width={44} height={56} rx={6} fill="#b07a3e" />
    <path d="M -10 -128 a 10 10 0 1 1 20 0 l -4 14 l -12 0 Z" fill={INK} />
  </g>
);

/** A prayer rug laid toward a niche, at dawn, no one on it (70:22-23). */
const Prayer: React.FC<{ y: number; light: number }> = ({ y, light }) => (
  <g>
    <ellipse cx={W / 2} cy={y - 360} rx={420} ry={300} fill="url(#kw-glow)" opacity={0.4 + 0.6 * light} />
    <path d={`M 360 ${y - 140} L 360 ${y - 470} C 360 ${y - 600} 720 ${y - 600} 720 ${y - 470} L 720 ${y - 140} Z`} fill={INK} />
    <path d={`M 400 ${y - 140} L 400 ${y - 450} C 400 ${y - 550} 680 ${y - 550} 680 ${y - 450} L 680 ${y - 140} Z`} fill="#ffd9a0" opacity={0.35 + 0.5 * light} />
    <path d={`M 380 ${y - 110} L 700 ${y - 110} L 780 ${y + 230} L 300 ${y + 230} Z`} fill="url(#kw-rug)" />
    <path d={`M 400 ${y - 90} L 680 ${y - 90} L 744 ${y + 205} L 336 ${y + 205} Z`} fill="none" stroke={GOLD} strokeWidth={5} opacity={0.7} />
    <path d={`M 540 ${y - 70} C 500 ${y - 20} 500 ${y + 20} 540 ${y + 40} C 580 ${y + 20} 580 ${y - 20} 540 ${y - 70} Z`} fill="none" stroke={GOLD} strokeWidth={4} opacity={0.7} />
  </g>
);

/** A wall calendar with a date circled, and an envelope still closed. */
const Salary: React.FC<{ y: number }> = ({ y }) => (
  <g>
    <rect x={250} y={y - 420} width={380} height={420} rx={14} fill={PALE} />
    <rect x={250} y={y - 420} width={380} height={80} rx={14} fill="#8a2a2a" />
    {Array.from({ length: 20 }, (_, i) => (
      <rect key={i} x={275 + (i % 5) * 70} y={y - 320 + Math.floor(i / 5) * 72} width={46} height={46} rx={4} fill="#d8cfb8" />
    ))}
    <circle cx={298 + 3 * 70} cy={y - 297 + 2 * 72} r={40} fill="none" stroke="#c0392b" strokeWidth={8} />
    <g transform={`translate(760 ${y + 40}) rotate(-8)`}>
      <rect x={-140} y={-90} width={280} height={180} rx={10} fill="#e9dcc0" />
      <path d="M -140 -90 L 0 20 L 140 -90" fill="none" stroke="#8c7a58" strokeWidth={6} />
    </g>
  </g>
);

const HaluuPicture: Drawn = ({ t, show, since }) => {
  const verse = show("storm");
  // the rug comes at « إلا المصلين » (70:22): 13.3 s into the recitation of 70:19-23 (the cuts of 70:19 to 70:21)
  const rug = Math.max(verse * after(t, since("storm") + 13.3, 1.2), show("cure"));
  return (
    <g>
      <Defs />
      <Rain t={t} amount={Math.max(show("word"), verse * (1 - rug), show("meaning")) * 0.8} />
      <g opacity={Math.max(show("word"), verse * (1 - rug))}><Word text="هَلُوعًا" y={1060} /></g>
      <g opacity={Math.max(verse * (1 - rug), show("meaning"))}><Chest x={780} y={1400} scale={0.9} /></g>
      <g opacity={show("meaning")}><Word text="هَلُوعًا" y={1060} size={170} /></g>
      <g opacity={rug}><Prayer y={1250} light={show("cure") * after(t, since("cure"), 6)} /></g>
      <g opacity={show("salary")}><Salary y={1180} /></g>
      <g opacity={show("three")}>
        <Word text="كَنُود" y={880} size={130} />
        <Word text="فَتِيل · نَقِير · قِطْمِير" y={1100} size={96} />
        <Word text="هَلُوعًا" y={1320} size={130} />
      </g>
    </g>
  );
};

// ---- the badge of the series, above the veil ---------------------------------------------------------------------

const Badge: React.FC<{ n: string }> = ({ n }) => (
  <g>
    <circle cx={114} cy={268} r={24} fill="none" stroke={GOLD} strokeWidth={2.5} />
    <text x={114} y={281} textAnchor="middle" fontFamily={FONT.arabic} fontWeight={700} fontSize={30} fill={GOLD}>{n}</text>
    <text x={152} y={280} fontFamily={FONT.arabic} fontWeight={700} fontSize={34} fill={GOLD} style={{ filter: "drop-shadow(0 2px 10px rgba(4,7,20,.9))" }}>كلمة من القرآن</text>
  </g>
);
const badge = (n: string): Drawn => function KalimaBadge() { return <Badge n={n} />; };

// ---- the registries Trial.tsx reads ------------------------------------------------------------------------------

export const KALIMA_PICTURES: Record<string, Drawn> = { kanud: KanudPicture, stone: StonePicture, haluu: HaluuPicture };
export const KALIMA_OVERLAYS: Record<string, Drawn> = { kanud: badge("١"), stone: badge("٢"), haluu: badge("٣") };
