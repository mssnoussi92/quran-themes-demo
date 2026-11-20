// Scenes played by stick figures with simple faces in shorts that were made before (the audit of 2026-11-20,
// docs/scripts/audit-apres-verset.md). The owner: « sur toute la vidéo, si on peut jouer une scène, on la joue ». Same
// style as « الصاحب ساحب » and AyahPlayed.tsx; anonymous people of a typical scene of today only, never anyone of the story
// the short tells. `variant`: « tease », a few seconds of the scene in the opening, on the line that speaks to the viewer;
// « us », the line « وإحنا كده » played in grey (what we do wrong); « ex », the example played in white (the right way).
// `u`: seconds since the scene came; `at(n)`: when the n-th phrase of its narration is said, in the same seconds.
import React from "react";
import { FLOOR, H, INK, PELVIS, S, W, lerp, lp, ramp, walking, type P2, type Played } from "./AyahPlayed";
import { Bubble, Burst, Coin, Heart, Phone, POSES, Stick, type Face } from "./Sahib";

const shoulderY = PELVIS - 106 * S;
const headY = PELVIS - 182 * S;

/** A plain room: a wall, a skirting, a floor; `tint` the wall. */
const Room: React.FC<{ wall: string; floor?: string; dark?: number }> = ({ wall, floor = "#6b5440", dark = 0 }) => (
  <g>
    <rect width={W} height={H} fill={wall} />
    <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill={floor} />
    <rect x={0} y={FLOOR - 14} width={W} height={18} fill="#00000022" />
    <rect x={0} y={FLOOR} width={W} height={8} fill={INK} opacity={0.55} />
    {dark > 0 ? <rect width={W} height={H} fill="#050914" opacity={dark} /> : null}
  </g>
);

/** Hands folded on the chest, for a figure facing `facing` at `x` (standing in prayer). */
const folded = (x: number, facing: 1 | -1): { handF: P2; handB: P2 } => ({
  handF: [x + facing * 34, shoulderY + 46],
  handB: [x + facing * 26, shoulderY + 62],
});

// ------------------------------------------------------------------------------------------- 62:11, the caravan

/** « زي الأدان يأذّن وإنت في نص شغل… وتقول: أخلّص اللي في إيدي الأول. » at his desk, the adhan comes through the window,
 * he raises a hand without looking: wait. « أو الموبايل يهزّ في جيبك وإنت بتصلي… وقلبك يروحله. » on his rug, in prayer, the
 * phone buzzes in his pocket, his head turns to it, a small heart goes towards it. « الشغل مش هيطير… » the buzzing stops,
 * he stands calm, eyes closed. Phrases: 0-2 the first line, 3-4 the second, 5-6 the third. */
export const WorkPlayed: Played = ({ u, t, at }) => {
  const desk = { x: 760, top: 1040 };
  const adhan = ramp(u, at(0) - 0.2, at(0) + 0.6) * (1 - ramp(u, at(3) - 0.6, at(3) - 0.1));
  const wait = ramp(u, at(2), at(2) + 0.4) * (1 - ramp(u, at(3) - 0.6, at(3) - 0.2));
  const atDesk = 1 - ramp(u, at(3) - 0.5, at(3) - 0.1);
  const buzz = u > at(3) + 0.3 && u < at(5) ? 1 : 0;
  const drawn = ramp(u, at(4), at(4) + 0.5) * (1 - ramp(u, at(5), at(5) + 0.6));
  const x0 = desk.x - 150;
  const xp = 360;
  const hand = folded(xp, 1);
  const pocket: P2 = [xp + 8, PELVIS + 18];
  const heart: P2 = lp([xp + 30, shoulderY + 20], [pocket[0] + 30, pocket[1] - 10], ramp(u, at(4) + 0.2, at(4) + 1.4));
  return (
    <g>
      <Room wall="#d9dde4" floor="#7a6a58" />
      {/* the window and the minaret outside, the call to prayer in waves */}
      <rect x={90} y={620} width={300} height={330} fill="#8fb6dc" stroke={INK} strokeWidth={10} />
      <g fill="#5d6e88" stroke={INK} strokeWidth={5}>
        <rect x={250} y={700} width={46} height={250} />
        <path d="M 240 716 L 306 716 L 300 734 L 246 734 Z" />
        <path d="M 254 700 Q 273 660 292 700 Z" />
      </g>
      <path d="M 240 950 L 240 620 M 90 785 L 390 785" stroke={INK} strokeWidth={7} />
      <g opacity={adhan} stroke="#2f6b4f" strokeWidth={6} fill="none" strokeLinecap="round">
        {[0, 1, 2].map((i) => {
          const r = 40 + ((u * 60 + i * 40) % 120);
          return <path key={i} d={`M ${273 + r * 0.7} ${690 - r * 0.7} A ${r} ${r} 0 0 1 ${273 + r * 0.7} ${690 + r * 0.7}`} opacity={1 - ((u * 60 + i * 40) % 120) / 120} />;
        })}
      </g>
      {/* the desk, the laptop */}
      <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
        <rect x={desk.x - 120} y={desk.top} width={330} height={26} fill="#a87b55" />
        <path d={`M ${desk.x - 100} ${desk.top + 26} L ${desk.x - 100} ${FLOOR} M ${desk.x + 190} ${desk.top + 26} L ${desk.x + 190} ${FLOOR}`} />
        <path d={`M ${desk.x - 20} ${desk.top} L ${desk.x + 110} ${desk.top} L ${desk.x + 96} ${desk.top - 100} L ${desk.x - 6} ${desk.top - 100} Z`} fill="#3b4a63" />
      </g>
      <rect x={desk.x + 4} y={desk.top - 90} width={86} height={70} fill="#cfe6ff" opacity={0.85} />
      {/* the prayer rug */}
      <path d={`M ${xp - 150} ${FLOOR - 6} L ${xp + 130} ${FLOOR - 6} L ${xp + 160} ${FLOOR + 50} L ${xp - 180} ${FLOOR + 50} Z`} fill="#8a2f3a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${xp - 130} ${FLOOR + 4} L ${xp + 110} ${FLOOR + 4} L ${xp + 132} ${FLOOR + 40} L ${xp - 156} ${FLOOR + 40} Z`} fill="none" stroke="#e7c76a" strokeWidth={5} strokeLinejoin="round" />
      {/* at the desk, typing; his hand up: wait */}
      <g opacity={atDesk}>
        <Stick x={x0} y={PELVIS} s={S} facing={1} tone="white" face={wait > 0.5 ? "smirk" : "neutral"} pose={{ ...POSES.stand, torso: 6, head: -6 }}
          handF={[desk.x + 10 + 6 * Math.sin(t * 18), desk.top - 8]} bendF={1}
          handB={lp([desk.x - 10, desk.top - 6], [x0 - 70, shoulderY - 110], wait)} bendB={1} />
      </g>
      {/* on the rug, in prayer; the phone in his pocket */}
      <g opacity={1 - atDesk}>
        <Stick x={xp} y={PELVIS} s={S} facing={1} tone="white" face={drawn > 0.5 ? "worried" : u > at(5) + 0.4 ? "calm" : "neutral"}
          pose={{ ...POSES.stand, head: lerp(-6, -22, drawn) }} handF={hand.handF} bendF={1} handB={hand.handB} bendB={1} look={drawn > 0.5 ? -1 : 1} />
        <g transform={`translate(${pocket[0] + (buzz ? 2 * Math.sin(t * 60) : 0)} ${pocket[1]}) scale(0.7)`}>
          <Phone glow={buzz > 0} />
        </g>
        {buzz ? (
          <g stroke="#e0533f" strokeWidth={5} strokeLinecap="round" opacity={0.6 + 0.4 * Math.sin(t * 20)}>
            <path d={`M ${pocket[0] - 34} ${pocket[1] - 30} l -14 -10 M ${pocket[0] - 38} ${pocket[1]} l -18 0 M ${pocket[0] - 34} ${pocket[1] + 30} l -14 10`} />
          </g>
        ) : null}
        {drawn > 0.01 ? <g opacity={drawn}><Heart x={heart[0]} y={heart[1]} k={drawn} /></g> : null}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------ 18:86-88, power over people

/** An office: a desk, a boss, two employees. `tease`: the boss at his desk, the two before him. `us` (grey) « وإحنا كده:
 * شوية سلطة… وننسى إن إحنا كمان هنتحاسب. »: the boss shouts, the two shrink. `ex` (white) « زي لما يبقى في إيدك سلطة… في
 * شغلك… أو في بيتك. اللي بيغلط يتحاسب… واللي بيتعب تقوله: شكرًا. »: a broken cup on the floor, the boss points at it calmly,
 * the one who broke it looks down; at « شكرًا » he shakes the other's hand. Phrases of `ex`: 0-2, then 3 « اللي بيغلط
 * يتحاسب… », 4 « واللي بيتعب تقوله: », 5 « شكرًا. ». */
export const OfficePlayed: Played = ({ u, t, at, variant }) => {
  const grey = variant === "us";
  const boss = 760;
  const a = 250;
  const b = 430;
  const shout = grey ? ramp(u, 0.3, 0.8) : 0;
  const point = variant === "ex" ? ramp(u, at(3), at(3) + 0.5) * (1 - ramp(u, at(4), at(4) + 0.4)) : 0;
  const thanks = variant === "ex" ? ramp(u, at(5) - 0.3, at(5) + 0.4) : 0;
  const bossX = lerp(boss, b + 150, thanks);
  const faceA: Face = grey ? "worried" : point > 0.3 || variant === "ex" && u > at(3) ? "worried" : "neutral";
  const faceB: Face = grey ? "worried" : thanks > 0.5 ? "happy" : "neutral";
  const bossFace: Face = grey ? "angry" : thanks > 0.5 ? "smile" : point > 0.3 ? "neutral" : "kind";
  return (
    <g>
      <Room wall="#cfd6e2" floor="#5e6472" />
      <rect x={560} y={600} width={380} height={300} fill="#9cc1e4" stroke={INK} strokeWidth={10} />
      <path d="M 750 600 L 750 900" stroke={INK} strokeWidth={7} />
      {/* the boss's desk */}
      <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
        <rect x={660} y={1100} width={340} height={220} fill="#7a4b2a" />
        <rect x={700} y={1140} width={260} height={12} fill="#5c3a22" />
        <rect x={720} y={1060} width={90} height={40} fill="#f6f3ec" />
      </g>
      {/* the plant */}
      <g stroke={INK} strokeWidth={6}>
        <path d="M 90 1320 L 110 1220 L 190 1220 L 210 1320 Z" fill="#c46a3c" />
        <path d="M 150 1220 Q 120 1120 80 1100 M 150 1220 Q 160 1100 200 1080 M 150 1220 Q 150 1130 140 1060" fill="none" stroke="#2f6b4f" strokeWidth={14} />
      </g>
      {variant === "ex" ? (
        <g opacity={ramp(u, 0, 0.4)}>
          {/* the broken cup on the floor, between the boss and the one who broke it */}
          <g transform="translate(560 1318) scale(1.7)">
            <path d="M -40 0 l 30 -26 l 22 20 l 18 -16 l 14 22 Z" fill="#f6f3ec" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <path d="M 34 -2 l 16 -14 l 12 14 Z" fill="#f6f3ec" stroke={INK} strokeWidth={3.5} />
            <path d="M -28 -8 l 10 -8" stroke="#c46a3c" strokeWidth={4} />
          </g>
        </g>
      ) : null}
      <Stick x={a} y={PELVIS} s={S * 0.92} facing={1} tone="white" face={faceA} cap="#3d7cc9" pose={{ ...POSES.stand, head: faceA === "worried" ? -14 : 0, torso: grey ? -6 * shout : 0 }} />
      <Stick x={b} y={PELVIS} s={S * 0.92} facing={1} tone="white" face={faceB} cap="#3fa36b" pose={{ ...POSES.stand, head: faceB === "worried" ? -14 : 0, torso: grey ? -6 * shout : 0 }}
        handF={thanks > 0.01 ? lp([b + 40, PELVIS + 20], [b + 96, shoulderY + 70], thanks) : undefined} bendF={-1} />
      <Stick x={bossX} y={PELVIS} s={S} facing={-1} tone={grey ? "grey" : "white"} face={bossFace} pose={{ ...POSES.stand, torso: grey ? 10 * shout : 0, head: grey ? 6 : 0 }}
        handF={grey ? [bossX - 140, shoulderY - 60 - 20 * Math.sin(t * 9) * shout] : point > 0.01 ? lp([bossX - 30, PELVIS + 20], [bossX - 150, PELVIS + 70], point) : thanks > 0.01 ? lp([bossX - 30, PELVIS + 20], [bossX - 110, shoulderY + 70], thanks) : undefined}
        bendF={1} />
      {grey ? <Burst x={bossX - 190} y={headY - 120} k={shout} /> : null}
      {thanks > 0.5 ? <Heart x={b + 120} y={headY - 150} k={ramp(u, at(5) + 0.2, at(5) + 0.7)} /> : null}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ 18:93-95, the one in need

/** A workshop: tools on the wall, a bench, a plank. `tease`: someone at the door, his cap in his hands. `us` (grey)
 * « وإحنا كده: يا نستغل المحتاج… يا نشيل عنه كل حاجة. »: the craftsman holds out his palm for coins; then he works alone while
 * the other sits idle. `ex` (white) « زي لما حد محتاج يطلب منك مساعدة… وإنت تقدر تستغله. أو تساعده… وتعلّمه يقف على
 * رجله. »: a coin floats over the craftsman's head, he shakes it away; he puts a hammer in the other's hand; they work
 * together. Phrases of `us`: 0 « وإحنا كده: », 1 the first way, 2 the second, 3 « وهو خلّاهم… »; of `ex`: 0, 1, 2, 3. */
export const WorkshopPlayed: Played = ({ u, t, at, variant }) => {
  const grey = variant === "us";
  const bench = { x: 520, y: 1150 };
  const crafts = 720;
  const needy = variant === "tease" ? lerp(80, 170, ramp(u, 0, 1.2)) : 330;
  const second = grey ? ramp(u, at(2) - 0.2, at(2) + 0.4) : 0;
  const tempt = variant === "ex" ? ramp(u, at(1) - 0.2, at(1) + 0.4) * (1 - ramp(u, at(2) - 0.6, at(2) - 0.1)) : 0;
  const give = variant === "ex" ? ramp(u, at(2), at(2) + 0.8) : 0;
  const together = variant === "ex" ? ramp(u, at(3), at(3) + 0.4) : 0;
  const swing = (phase: number) => Math.max(0, Math.sin(t * 7 + phase)) * 40;
  const hammer = (
    <g transform="rotate(-20)">
      <rect x={-6} y={-60} width={12} height={70} rx={4} fill="#a87b55" stroke={INK} strokeWidth={4} />
      <rect x={-26} y={-76} width={52} height={22} rx={4} fill="#6d7686" stroke={INK} strokeWidth={4} />
    </g>
  );
  return (
    <g>
      <Room wall="#e2d3b8" floor="#6b5440" />
      {/* the door on the left, the tools on the wall */}
      <rect x={40} y={760} width={170} height={560} fill={variant === "tease" ? "#f4e2b8" : "#7a4b2a"} stroke={INK} strokeWidth={8} />
      <g stroke={INK} strokeWidth={6} strokeLinejoin="round" fill="#6d7686">
        <path d="M 440 700 L 640 700" stroke="#7a4b2a" strokeWidth={14} />
        <path d="M 470 700 L 470 800 L 500 820 L 500 700" fill="#c9ced8" />
        <path d="M 560 700 L 560 790" stroke="#a87b55" strokeWidth={12} />
        <rect x={540} y={780} width={40} height={18} />
        <path d="M 610 700 L 610 830 L 640 830" fill="none" />
      </g>
      {/* the bench and its plank */}
      <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
        <rect x={bench.x - 40} y={bench.y} width={420} height={30} fill="#a87b55" />
        <path d={`M ${bench.x - 20} ${bench.y + 30} L ${bench.x - 20} ${FLOOR} M ${bench.x + 360} ${bench.y + 30} L ${bench.x + 360} ${FLOOR}`} />
        <rect x={bench.x + 20} y={bench.y - 22} width={300} height={22} fill="#d9a873" />
      </g>
      {grey && second > 0.5 ? (
        // the second way: he does it all, the other sits on a stool, idle
        <g>
          <rect x={needy - 50} y={FLOOR - 120} width={100} height={18} fill="#a87b55" stroke={INK} strokeWidth={5} />
          <path d={`M ${needy - 40} ${FLOOR - 102} L ${needy - 40} ${FLOOR} M ${needy + 40} ${FLOOR - 102} L ${needy + 40} ${FLOOR}`} stroke={INK} strokeWidth={6} />
          <Stick x={needy} y={FLOOR - 120 - 22} s={S * 0.9} facing={1} tone="white" face="neutral" cap="#3d7cc9" pose={POSES.seat} />
        </g>
      ) : (
        <Stick x={needy} y={PELVIS} s={S * 0.92} facing={1} tone="white" cap="#3d7cc9"
          face={together > 0.5 ? "happy" : give > 0.5 ? "smile" : "worried"}
          pose={variant === "tease" && u < 1.2 ? { ...walking(u, 0, 1.2, 80, 170).pose } : { ...POSES.stand, head: give > 0.5 ? 0 : -10 }}
          handF={together > 0.5 ? [bench.x + 60, bench.y - 40 - swing(1.5)] : give > 0.5 ? [needy + 110, shoulderY + 40] : [needy + 50, shoulderY + 30]} bendF={-1}
          heldF={give > 0.5 ? hammer : undefined} />
      )}
      <Stick x={crafts} y={PELVIS} s={S} facing={grey && second > 0.5 ? 1 : -1} tone={grey ? "grey" : "white"}
        face={grey ? (second > 0.5 ? "neutral" : "smirk") : together > 0.5 ? "happy" : tempt > 0.5 ? "neutral" : "kind"}
        pose={{ ...POSES.stand, head: 0 }}
        handF={grey && second < 0.5 ? [crafts - 140, shoulderY + 30] : grey ? [bench.x + 260, bench.y - 40 - swing(0)] : together > 0.5 ? [bench.x + 230, bench.y - 40 - swing(0)] : give > 0.01 ? lp([crafts - 30, PELVIS + 20], [crafts - 150, shoulderY + 40], give) : undefined}
        bendF={1} heldF={(grey && second > 0.5) || together > 0.5 ? hammer : undefined} />
      {grey && second < 0.5 ? (
        // the first way: his open palm, the coins asked for
        <g opacity={ramp(u, at(1) - 0.2, at(1) + 0.3)} transform={`translate(${crafts - 150} ${shoulderY + 10}) scale(2.2)`}>
          <Coin x={0} y={4} />
          <Coin x={6} y={-4} />
          <Coin x={-4} y={-10} />
        </g>
      ) : null}
      {tempt > 0.01 ? (
        <g opacity={tempt}>
          <Bubble x={crafts - 30} y={headY - 170} text="" k={tempt} tail={1} size={60} />
          <g transform={`translate(${crafts - 30} ${headY - 172}) scale(2)`}><Coin x={0} y={0} /></g>
          <path d={`M ${crafts - 70} ${headY - 200} L ${crafts + 10} ${headY - 140}`} stroke="#c0392b" strokeWidth={8} opacity={ramp(u, at(1) + 0.5, at(1) + 0.9)} strokeLinecap="round" />
        </g>
      ) : null}
      {together > 0.5 ? <Heart x={needy + 40} y={headY - 140} k={ramp(u, at(3) + 0.6, at(3) + 1.1)} /> : null}
    </g>
  );
};

// -------------------------------------------------------------------------------------- 18:96-98, after a success

/** A hall: a red curtain, a stage, the backs of the audience in the dark. `tease`: on the stage he is handed a
 * certificate. `us` (grey) « وإحنا كده: أول ما ننجح… نقول: ده تعبي… ده شطارتي. »: he lifts it high, his thumb to his chest,
 * a smirk. `ex` (white) « زي لما تنجح… والناس تسقف لك. وقلبك بيقول: الحمد لله… ده من ربنا. »: the hands of the audience
 * clap; at « الحمد لله » he lifts his eyes, his hand on his heart. Phrases of `ex`: 0, 1 « والناس تسقف لك. », 2, 3
 * « الحمد لله… », 4. */
export const StagePlayed: Played = ({ u, t, at, variant }) => {
  const grey = variant === "us";
  const x = 560;
  const stage = FLOOR - 40;
  const pelvis = stage - 154 * S;
  const sh = pelvis - 106 * S;
  const clap = variant === "ex" ? ramp(u, at(1) - 0.2, at(1) + 0.3) : variant === "tease" ? ramp(u, 0.6, 1.2) : 0;
  const thanks = variant === "ex" ? ramp(u, at(3) - 0.2, at(3) + 0.5) : 0;
  const proud = grey ? ramp(u, 0.2, 0.8) : 0;
  const thumb = grey ? ramp(u, at(2), at(2) + 0.4) : 0;
  const certificate = (
    <g transform="rotate(-8)">
      <rect x={-34} y={-46} width={68} height={50} fill="#fffaf0" stroke={INK} strokeWidth={4} />
      <circle cx={18} cy={-6} r={8} fill="#c0392b" stroke={INK} strokeWidth={3} />
      <path d="M -22 -32 L 14 -32 M -22 -20 L 6 -20" stroke="#8a8478" strokeWidth={4} />
    </g>
  );
  return (
    <g>
      <rect width={W} height={H} fill="#1c1a2c" />
      {/* the curtain and the light on the stage */}
      <g stroke={INK} strokeWidth={6}>
        <rect x={60} y={560} width={960} height={stage - 560} fill="#7a1f2b" />
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M ${110 + i * 105} 560 L ${110 + i * 105} ${stage}`} stroke="#5c1520" strokeWidth={10} />)}
        <path d="M 60 560 Q 300 640 540 560 Q 780 640 1020 560 L 1020 530 L 60 530 Z" fill="#9e2a36" />
      </g>
      <ellipse cx={x} cy={stage} rx={300} ry={60} fill="#ffe7a8" opacity={0.25} />
      <path d={`M ${x - 140} 530 L ${x + 140} 530 L ${x + 320} ${stage} L ${x - 320} ${stage} Z`} fill="#ffe7a8" opacity={0.12} />
      <rect x={0} y={stage} width={W} height={60} fill="#5c3a22" stroke={INK} strokeWidth={6} />
      {/* the man on the stage */}
      <Stick x={x} y={pelvis} s={S} facing={1} tone={grey ? "grey" : "white"}
        face={grey ? "smirk" : thanks > 0.5 ? "calm" : clap > 0.5 ? "smile" : "neutral"}
        pose={{ ...POSES.stand, torso: grey ? -8 * proud : 0, head: grey ? 10 * proud : thanks > 0.5 ? 16 : 0 }}
        handF={grey ? [x + 60, sh - 160 * proud] : [x + 90, sh + 40]} bendF={-1} heldF={certificate}
        handB={grey ? lp([x - 20, pelvis + 20], [x + 10, sh + 34], thumb) : thanks > 0.01 ? lp([x - 20, pelvis + 20], [x + 16, sh + 40], thanks) : undefined} bendB={1} />
      {/* the audience: backs of heads along the front of the stage, on both sides, and hands that clap */}
      <rect x={0} y={stage + 60} width={W} height={H - stage - 60} fill="#141322" />
      {[60, 170, 280, 840, 950, 1060].map((hx, i) => {
        const hy = stage + 30 + (i % 2) * 16;
        const up = clap * (0.6 + 0.4 * Math.abs(Math.sin(t * 10 + i)));
        return (
          <g key={i}>
            <circle cx={hx} cy={hy} r={48} fill="#2b2a40" stroke={INK} strokeWidth={5} />
            {up > 0.05 ? (
              <g fill="#f6f3ec" stroke={INK} strokeWidth={4}>
                <ellipse cx={hx - 18 + 6 * Math.sin(t * 20 + i)} cy={hy - 70 * up} rx={12} ry={16} />
                <ellipse cx={hx + 18 - 6 * Math.sin(t * 20 + i)} cy={hy - 70 * up} rx={12} ry={16} />
              </g>
            ) : null}
          </g>
        );
      })}
      {thanks > 0.5 ? <circle cx={x + 30} cy={headY - 120} r={60} fill="#ffe7a8" opacity={0.15 * thanks} /> : null}
    </g>
  );
};

// ------------------------------------------------------------------------------------- 51:47, the sky widened

/** « اللي وسّع السما… قادر يوسّع عليك. »: a narrow room, a low ceiling, he counts a few coins in his palm, worried; at
 * « قادر يوسّع عليك » the walls slide apart and the ceiling lifts on a sky full of stars; he looks up and smiles. */
export const WallsPlayed: Played = ({ u, t, at }) => {
  const open = ramp(u, at(1), at(1) + 1.6);
  const x = 540;
  const left = lerp(300, -260, open);
  const right = lerp(780, 1340, open);
  const ceiling = lerp(700, -300, open);
  return (
    <g>
      <rect width={W} height={H} fill="#0b1230" />
      {Array.from({ length: 70 }, (_, i) => (
        <circle key={i} cx={(i * 137.5) % W} cy={80 + ((i * 89) % 1100)} r={1.5 + (i % 3)} fill="#e8eefc" opacity={open * (0.5 + 0.4 * Math.sin(t * 1.3 + i))} />
      ))}
      <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill="#3a3346" />
      <rect x={0} y={FLOOR} width={W} height={8} fill={INK} opacity={0.6} />
      {/* the walls and the ceiling of the narrow room */}
      <g stroke={INK} strokeWidth={8}>
        <rect x={left - 400} y={-400} width={400} height={FLOOR + 400} fill="#4a4560" />
        <rect x={right} y={-400} width={400} height={FLOOR + 400} fill="#4a4560" />
        <rect x={left - 400} y={ceiling - 400} width={right - left + 800} height={400} fill="#3d3852" />
      </g>
      <Stick x={x} y={PELVIS} s={S} facing={1} tone="white" face={open > 0.5 ? "smile" : "worried"}
        pose={{ ...POSES.stand, head: lerp(-16, 18, open) }} handF={[x + 70, shoulderY + 60]} bendF={-1} />
      <g opacity={1 - open} transform={`translate(${x + 78} ${shoulderY + 44}) scale(1.6)`}>
        <Coin x={0} y={0} />
        <Coin x={8} y={-6} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------- 18:10, the one who refuses

/** A classroom: desks, a blackboard. `ex` « زي لما تبقى الوحيد في الشلة… اللي رافض حاجة غلط. ابعد خطوة… واطلب من ربنا
 * يثبّتك. »: two classmates pass a crib sheet; it is held out to him, he raises his palm: no; he steps aside, and raises
 * his hands. `tease`: they laugh over the sheet, he stands apart, unsure. `dua` « ولما تحس إنك لوحدك… ادعي بدعوتهم »: alone
 * in the empty classroom, his hands raised. */
export const CheatPlayed: Played = ({ u, at, variant }) => {
  const ex = variant === "ex" || variant === undefined;
  const alone = variant === "dua";
  const offer = ex ? ramp(u, at(1) - 0.4, at(1)) : 0;
  const no = ex ? ramp(u, at(1), at(1) + 0.4) : 0;
  const step = ex ? walking(u, at(2), at(2) + 1.0, 700, 860) : { x: variant === "tease" ? 820 : 600, pose: POSES.stand };
  const pray = alone ? ramp(u, 0, 0.6) : ex ? ramp(u, at(3), at(3) + 0.6) : 0;
  const x = step.x;
  const palms: P2[] = [[x - 70, shoulderY - 20], [x - 40, shoulderY - 8]];
  const sheet = (
    <g transform="rotate(-6)">
      <rect x={-22} y={-30} width={44} height={56} fill="#fffaf0" stroke={INK} strokeWidth={4} />
      <path d="M -14 -18 L 14 -18 M -14 -8 L 10 -8 M -14 2 L 14 2 M -14 12 L 6 12" stroke="#3d7cc9" strokeWidth={3} />
    </g>
  );
  return (
    <g>
      <Room wall="#d8dcc8" floor="#6b6252" />
      <rect x={140} y={600} width={800} height={300} fill="#2f4a3a" stroke="#7a4b2a" strokeWidth={16} />
      <path d="M 200 680 l 120 0 M 200 730 l 200 0 M 200 780 l 90 0" stroke="#e8e6e0" strokeWidth={6} opacity={0.6} />
      {/* desks */}
      {[160, 420].map((dx) => (
        <g key={dx} stroke={INK} strokeWidth={6}>
          <rect x={dx} y={1150} width={220} height={22} fill="#a87b55" />
          <path d={`M ${dx + 20} 1172 L ${dx + 20} ${FLOOR} M ${dx + 200} 1172 L ${dx + 200} ${FLOOR}`} />
        </g>
      ))}
      {!alone ? (
        <>
          <Stick x={220} y={PELVIS} s={S * 0.92} facing={1} tone="white" cap="#3d7cc9" face={variant === "tease" ? "laugh" : "smirk"} pose={POSES.stand}
            handF={[300, shoulderY + 30]} bendF={-1} heldF={offer < 0.5 ? sheet : undefined} />
          <Stick x={440} y={PELVIS} s={S * 0.92} facing={1} tone="white" cap="#e88a3a" face={variant === "tease" ? "laugh" : "smirk"} pose={POSES.stand}
            handF={lp([500, shoulderY + 40], [600, shoulderY + 20], offer)} bendF={-1} heldF={offer > 0.5 ? sheet : undefined} />
        </>
      ) : null}
      <Stick x={x} y={PELVIS} s={S} facing={-1} tone="white"
        face={pray > 0.5 ? "calm" : variant === "tease" ? "worried" : no > 0.5 ? "neutral" : "neutral"}
        pose={step.pose}
        {...(pray > 0.01 ? { handF: lp([x - 6, PELVIS + 20], palms[0], pray), bendF: 1, handB: lp([x + 4, PELVIS + 24], palms[1], pray), bendB: 1 } : no > 0.01 && u < at(2) ? { handF: lp([x - 6, PELVIS + 20], [x - 70, shoulderY - 96], no), bendF: 1, look: -1 as const } : {})} />
      {pray > 0.5 ? (
        <g opacity={ramp(pray, 0.7, 1)}>
          {palms.map(([px, py], i) => (
            <path key={i} d={`M ${px - 22} ${py - 8} Q ${px - 18} ${py + 14} ${px} ${py + 14} Q ${px + 18} ${py + 14} ${px + 22} ${py - 8}`} fill="#f6f3ec" stroke={INK} strokeWidth={5} />
          ))}
        </g>
      ) : null}
      {variant === "tease" ? <g transform="translate(330 1000)">{sheet}</g> : null}
      {no > 0.01 && u < at(2) + 0.6 ? (
        <g opacity={no} stroke="#c0392b" strokeWidth={12} strokeLinecap="round">
          <path d={`M ${600 + 10} ${shoulderY - 10} l 50 50 M ${600 + 60} ${shoulderY - 10} l -50 50`} />
        </g>
      ) : null}
    </g>
  );
};

// ----------------------------------------------------------------------------------- 18:17, the answer unseen

/** A balcony at night: « زي دعوة بقالك سنين بتدعيها… ومفيش حاجة اتغيرت. »: he raises his hands to the sky, then his face
 * falls; « يمكن إجابتها شغالة… في تفاصيل إنت مش شايفها. »: behind him, where he does not look, a seed sprouts in a pot, a
 * window lights across the street, a door opens a little. `tease`: his hands raised, the details not there yet. */
export const BalconyPlayed: Played = ({ u, t, at, variant }) => {
  const tease = variant === "tease";
  const x = 700;
  const fall = tease ? 0 : ramp(u, at(1), at(1) + 0.5);
  const sprout = tease ? 0 : ramp(u, at(2), at(2) + 1.2);
  const lamp = tease ? 0 : ramp(u, at(2) + 0.9, at(2) + 1.4);
  const door = tease ? 0 : ramp(u, at(3), at(3) + 1.0);
  const palms: P2[] = [[x + 118, shoulderY + 4], [x + 86, shoulderY + 20]];
  return (
    <g>
      <rect width={W} height={H} fill="#141a3a" />
      {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 211) % W} cy={70 + ((i * 97) % 520)} r={1.5 + (i % 2)} fill="#e8eefc" opacity={0.5 + 0.3 * Math.sin(t + i)} />)}
      <circle cx={900} cy={420} r={46} fill="#f3eccf" opacity={0.9} />
      {/* the building across the street, its windows; one lights */}
      <rect x={40} y={640} width={420} height={680} fill="#262b48" stroke={INK} strokeWidth={6} />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={80 + c * 130} y={690 + r * 150} width={70} height={90} fill="#ffcf7a" opacity={r === 1 && c === 1 ? 0.08 + 0.8 * lamp : 0.08} />
      )))}
      {/* the door behind him, ajar */}
      <rect x={480} y={900} width={150} height={FLOOR - 900} fill="#3a2c22" stroke={INK} strokeWidth={6} />
      <path d={`M 480 900 L ${480 + 150 * (1 - 0.35 * door)} ${900 - 10 * door} L ${480 + 150 * (1 - 0.35 * door)} ${FLOOR + 10 * door} L 480 ${FLOOR} Z`} fill="#5c3a22" stroke={INK} strokeWidth={5} />
      <rect x={480 + 150 * (1 - 0.35 * door)} y={900} width={150 * 0.35 * door} height={FLOOR - 900} fill="#ffe2a8" opacity={0.9} />
      {/* the balcony floor and railing */}
      <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill="#2c2b38" />
      <path d={`M 660 ${FLOOR - 160} L 1080 ${FLOOR - 160}`} stroke={INK} strokeWidth={10} />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M ${680 + i * 50} ${FLOOR - 160} L ${680 + i * 50} ${FLOOR}`} stroke={INK} strokeWidth={6} />)}
      {/* the pot and its sprout */}
      <path d={`M 400 ${FLOOR} L 384 ${FLOOR - 70} L 456 ${FLOOR - 70} L 440 ${FLOOR} Z`} fill="#c46a3c" stroke={INK} strokeWidth={5} />
      <g opacity={sprout > 0.01 ? 1 : 0}>
        <path d={`M 420 ${FLOOR - 70} L 420 ${FLOOR - 70 - 90 * sprout}`} stroke="#3fa36b" strokeWidth={8} strokeLinecap="round" />
        <ellipse cx={420 - 20 * sprout} cy={FLOOR - 70 - 70 * sprout} rx={22 * sprout} ry={10 * sprout} fill="#3fa36b" stroke={INK} strokeWidth={3} />
        <ellipse cx={420 + 22 * sprout} cy={FLOOR - 70 - 90 * sprout} rx={22 * sprout} ry={10 * sprout} fill="#3fa36b" stroke={INK} strokeWidth={3} />
      </g>
      <Stick x={x} y={PELVIS} s={S} facing={1} tone="white" face={fall > 0.5 ? "worried" : "calm"} pose={{ ...POSES.stand, head: lerp(14, -6, fall) }}
        handF={palms[0]} bendF={1} handB={palms[1]} bendB={1} />
      {palms.map(([px, py], i) => (
        <path key={i} d={`M ${px - 22} ${py - 8} Q ${px - 18} ${py + 14} ${px} ${py + 14} Q ${px + 18} ${py + 14} ${px + 22} ${py - 8}`} fill="#f6f3ec" stroke={INK} strokeWidth={5} />
      ))}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ 18:19, waking up

/** A bedroom in the morning. `ex` « وإحنا… أول ما نصحى بنمسك الموبايل. قبل أي حاجة… قول الدعاء ده… واحمد ربنا إنه
 * رجّعك. »: the alarm rings on the night table, his hand goes to the phone; it stops; he sits up, raises his hands, smiles.
 * `tease`: the alarm rings, he opens his eyes. Phrases of `ex`: 0 « وإحنا… », 1 the phone, 2 « قبل أي حاجة… », 3, 4. */
export const BedPlayed: Played = ({ u, t, at, variant }) => {
  const tease = variant === "tease";
  const reach = tease ? 0 : ramp(u, at(1), at(1) + 0.7) * (1 - ramp(u, at(2), at(2) + 0.5));
  const up = tease ? 0 : ramp(u, at(2) + 0.3, at(2) + 0.9);
  const pray = tease ? 0 : ramp(u, at(3), at(3) + 0.6);
  const ring = tease ? u < 3 : u < at(2);
  const bed = { x: 260, y: 1180, w: 560 };
  const lyingY = bed.y - 40;
  const seatY = bed.y - 20;
  const sx = bed.x + 380;
  const palms: P2[] = [[sx + 104, seatY - 106 * S * 0.95 + 26], [sx + 76, seatY - 106 * S * 0.95 + 40]];
  return (
    <g>
      <Room wall="#e9dcc3" floor="#8a6a4a" />
      <rect x={640} y={600} width={300} height={300} fill="#ffd9a0" stroke={INK} strokeWidth={10} />
      <circle cx={790} cy={760} r={50} fill="#ffb347" opacity={0.8} />
      <path d="M 790 600 L 790 900 M 640 750 L 940 750" stroke={INK} strokeWidth={7} />
      {/* the night table and the phone */}
      <rect x={90} y={1130} width={140} height={190} fill="#a87b55" stroke={INK} strokeWidth={6} />
      <g transform={`translate(${160 + (ring ? 3 * Math.sin(t * 50) : 0)} 1110) rotate(90) scale(0.9)`}><Phone glow={ring} /></g>
      {ring ? (
        <g stroke="#e0533f" strokeWidth={5} strokeLinecap="round" opacity={0.7}>
          <path d="M 110 1060 l -16 -16 M 160 1050 l 0 -22 M 210 1060 l 16 -16" />
        </g>
      ) : null}
      {/* the bed */}
      <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
        <rect x={bed.x} y={bed.y} width={bed.w} height={90} fill="#f6f3ec" />
        <rect x={bed.x - 20} y={bed.y - 120} width={30} height={260} fill="#7a4b2a" />
        <rect x={bed.x + bed.w - 10} y={bed.y - 40} width={30} height={180} fill="#7a4b2a" />
        <rect x={bed.x + 20} y={bed.y - 40} width={120} height={46} rx={18} fill="#fffaf0" />
      </g>
      {/* lying, then sitting up */}
      <g opacity={1 - up}>
        <g transform={`rotate(-90 ${bed.x + 260} ${lyingY})`}>
          <Stick x={bed.x + 260} y={lyingY} s={S * 0.95} facing={1} tone="white" face={tease && u < 1 ? "calm" : "neutral"}
            pose={POSES.stand} handF={reach > 0.01 ? lp([bed.x + 290, lyingY + 40], [bed.x + 120, lyingY + 260], reach) : undefined} bendF={1} />
        </g>
        <rect x={bed.x + 160} y={bed.y - 30} width={bed.w - 170} height={50} rx={14} fill="#9cc1e4" stroke={INK} strokeWidth={6} />
      </g>
      <g opacity={up}>
        <Stick x={sx} y={seatY} s={S * 0.95} facing={1} tone="white" face={u > at(4) ? "smile" : pray > 0.5 ? "calm" : "neutral"}
          pose={POSES.seat} {...(pray > 0.01 ? { handF: lp([sx + 40, seatY], palms[0], pray), bendF: 1, handB: lp([sx + 30, seatY], palms[1], pray), bendB: 1 } : {})} />
        {pray > 0.5 ? palms.map(([px, py], i) => (
          <path key={i} d={`M ${px - 22} ${py - 8} Q ${px - 18} ${py + 14} ${px} ${py + 14} Q ${px + 18} ${py + 14} ${px + 22} ${py - 8}`} fill="#f6f3ec" stroke={INK} strokeWidth={5} />
        )) : null}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------- small shared props

const Icon: React.FC<{ x: number; y: number; kind: "heart" | "plate" | "house" | "crack"; k: number; mark?: "ok" | "no" }> = ({ x, y, kind, k, mark }) => {
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * k})`} opacity={k}>
      <circle r={52} fill="#fffaf0" stroke={INK} strokeWidth={5} />
      {kind === "heart" ? <path d="M 0 22 C -40 -6 -26 -36 0 -16 C 26 -36 40 -6 0 22 Z" fill="#e0533f" stroke={INK} strokeWidth={4} /> : null}
      {kind === "plate" ? (
        <g stroke={INK} strokeWidth={4}>
          <ellipse cx={0} cy={8} rx={34} ry={12} fill="#f6f3ec" />
          <path d="M -22 4 Q 0 -30 22 4 Z" fill="#e8a33a" />
        </g>
      ) : null}
      {kind === "house" ? <path d="M -26 24 L -26 -4 L 0 -26 L 26 -4 L 26 24 Z M -8 24 L -8 6 L 8 6 L 8 24" fill="#d9a873" stroke={INK} strokeWidth={4} strokeLinejoin="round" /> : null}
      {kind === "crack" ? (
        <g>
          <rect x={-18} y={-30} width={36} height={60} rx={6} fill="#3b4a63" stroke={INK} strokeWidth={4} />
          <path d="M -12 -20 L 2 -4 L -6 6 L 10 22" stroke="#fffaf0" strokeWidth={4} fill="none" />
        </g>
      ) : null}
      {mark === "ok" ? <path d="M 26 30 l 12 12 l 22 -26" stroke="#3fa36b" strokeWidth={9} fill="none" strokeLinecap="round" /> : null}
      {mark === "no" ? <path d="M 30 22 l 26 26 M 56 22 l -26 26" stroke="#c0392b" strokeWidth={9} strokeLinecap="round" /> : null}
    </g>
  );
};

const Palms: React.FC<{ palms: P2[]; k?: number }> = ({ palms, k = 1 }) => (
  <g opacity={k}>
    {palms.map(([px, py], i) => (
      <path key={i} d={`M ${px - 22} ${py - 8} Q ${px - 18} ${py + 14} ${px} ${py + 14} Q ${px + 18} ${py + 14} ${px + 22} ${py - 8}`} fill="#f6f3ec" stroke={INK} strokeWidth={5} />
    ))}
  </g>
);

// ---------------------------------------------------------------------------- 100:6, the one who counts misfortunes

/** A living room. `tease` (on « …بتوصف اللي بيعدّ المصايب… وينسى النعم »): he counts on his fingers, three red crosses.
 * `ledger` « المصيبة… بنفتكرها باليوم والساعة. والنعمة… بنعيش جواها كل يوم… ومش شايفينها. »: he writes the broken thing
 * and its hour in a notebook; around him the sun, the meal, the family picture light up, and he does not look up.
 * `day` « زي يوم عدّى كله كويس: صحة… وأكل… وبيت. وحاجة واحدة بس باظت. وبالليل… الحاجة الوحيدة اللي بتحكيها… هي اللي
 * باظت. »: health, food, home, each ticked; one cracked phone; at night, on the phone with a friend, only the crack in
 * his bubble. `count` « قبل ما تعدّ اللي راح… عدّ اللي لسه معاك. … قول تلات نعم. »: he counts three blessings, smiling. */
export const DayPlayed: Played = ({ u, t, at, variant }) => {
  const x = 640;
  const night = variant === "day" ? ramp(u, at(5) - 0.3, at(5) + 0.3) : variant === "count" ? 1 : 0;
  const icons: { kind: "heart" | "plate" | "house" | "crack"; k: number; mark?: "ok" | "no" }[] =
    variant === "day" ? [
      { kind: "heart", k: ramp(u, at(1), at(1) + 0.3) * (1 - 0.7 * night), mark: "ok" },
      { kind: "plate", k: ramp(u, at(2), at(2) + 0.3) * (1 - 0.7 * night), mark: "ok" },
      { kind: "house", k: ramp(u, at(3), at(3) + 0.3) * (1 - 0.7 * night), mark: "ok" },
      { kind: "crack", k: ramp(u, at(4), at(4) + 0.3), mark: "no" },
    ] : variant === "count" ? [
      { kind: "heart", k: ramp(u, at(4), at(4) + 0.3), mark: "ok" },
      { kind: "plate", k: ramp(u, at(4) + 0.5, at(4) + 0.8), mark: "ok" },
      { kind: "house", k: ramp(u, at(4) + 1.0, at(4) + 1.3), mark: "ok" },
    ] : variant === "tease" ? [
      { kind: "crack", k: ramp(u, 0, 0.3), mark: "no" },
      { kind: "crack", k: ramp(u, 0.4, 0.7), mark: "no" },
      { kind: "crack", k: ramp(u, 0.8, 1.1), mark: "no" },
    ] : [];
  const blessings = variant === "ledger" ? ramp(u, at(2), at(3)) : 0;
  const writing = variant === "ledger";
  const call = variant === "day" ? ramp(u, at(6) - 0.2, at(6) + 0.3) : 0;
  const face: Face = variant === "count" ? (u > at(4) + 1.2 ? "smile" : "kind") : variant === "ledger" ? "cross" : variant === "tease" ? "cross" : call > 0.5 ? "cross" : u > at(4) ? "worried" : "smile";
  return (
    <g>
      <Room wall="#e6d6bd" floor="#8a6a4a" />
      {/* the window: day, then night */}
      <rect x={760} y={620} width={260} height={260} fill="#8fc6f2" stroke={INK} strokeWidth={10} />
      <rect x={760} y={620} width={260} height={260} fill="#0b1230" opacity={night} />
      <circle cx={840} cy={700} r={34} fill="#ffd36b" stroke={INK} strokeWidth={5} opacity={(1 - night) * (variant === "ledger" ? 0.4 + 0.6 * blessings : 1)} />
      <path d="M 890 620 L 890 880 M 760 750 L 1020 750" stroke={INK} strokeWidth={7} />
      {/* the family picture and the meal: they glow in `ledger` */}
      <rect x={90} y={640} width={150} height={120} fill="#fffaf0" stroke={INK} strokeWidth={6} />
      <g opacity={0.5 + 0.5 * blessings}>
        <circle cx={135} cy={690} r={16} fill="#f6f3ec" stroke={INK} strokeWidth={3} />
        <circle cx={190} cy={692} r={13} fill="#f6f3ec" stroke={INK} strokeWidth={3} />
      </g>
      {variant === "ledger" ? (
        <g>
          <circle cx={165} cy={700} r={110} fill="#ffe7a8" opacity={0.25 * blessings} />
          <circle cx={840} cy={700} r={90} fill="#ffe7a8" opacity={0.25 * blessings} />
          {/* the desk, the notebook, the hour he writes */}
          <rect x={x - 80} y={1120} width={420} height={24} fill="#a87b55" stroke={INK} strokeWidth={6} />
          <path d={`M ${x - 60} 1144 L ${x - 60} ${FLOOR} M ${x + 320} 1144 L ${x + 320} ${FLOOR}`} stroke={INK} strokeWidth={6} />
          <rect x={x + 90} y={1060} width={150} height={60} fill="#fffaf0" stroke={INK} strokeWidth={5} />
          <text x={x + 165} y={1102} textAnchor="middle" fontFamily="Lora, serif" fontWeight={700} fontSize={34} fill="#c0392b" opacity={ramp(u, at(1) - 0.2, at(1) + 0.3)}>12:30</text>
          <g transform={`translate(${x + 290} 1080) scale(0.9)`} opacity={blessings}>
            <ellipse cx={0} cy={8} rx={34} ry={12} fill="#f6f3ec" stroke={INK} strokeWidth={4} />
            <path d="M -22 4 Q 0 -30 22 4 Z" fill="#e8a33a" stroke={INK} strokeWidth={4} />
          </g>
        </g>
      ) : null}
      <Stick x={x} y={PELVIS} s={S} facing={1} tone="white" face={face}
        pose={{ ...POSES.stand, head: writing ? -18 : face === "smile" ? 8 : 0, torso: writing ? 10 : 0 }}
        {...(writing ? { handF: [x + 160 + 10 * Math.sin(t * 8), 1080] as P2, bendF: -1 }
          : call > 0.01 ? { handF: lp([x + 40, PELVIS + 20], [x + 20, headY + 20], call), bendF: -1, heldF: <Phone glow /> }
          : variant === "count" || variant === "tease" ? { handF: [x + 110, shoulderY - 60] as P2, bendF: -1 } : {})} />
      {icons.map((ic, i) => <Icon key={i} x={110 + i * 125} y={i === 3 ? 1130 : 990} kind={ic.kind} k={ic.k} mark={ic.mark} />)}
      {call > 0.5 ? (
        <g opacity={ramp(u, at(6), at(6) + 0.4)}>
          <Bubble x={x + 230} y={headY - 150} text="" k={1} tail={-1} size={70} />
          <g transform={`translate(${x + 230} ${headY - 156}) scale(0.7)`}>
            <rect x={-18} y={-30} width={36} height={60} rx={6} fill="#3b4a63" stroke={INK} strokeWidth={4} />
            <path d="M -12 -20 L 2 -4 L -6 6 L 10 22" stroke="#fffaf0" strokeWidth={4} fill="none" />
          </g>
        </g>
      ) : null}
    </g>
  );
};

// --------------------------------------------------------------------------------- 4:124, a glass of water

/** « زي كوباية مية… ادّيتها لعطشان… ومحدش شافك. عند ربنا… مش هتضيع ولا قد النقرة. »: a hot street, a worker sits
 * exhausted on the kerb; he walks up and holds out a glass of water; nobody else is there; at « عند ربنا » a small light. */
export const CupPlayed: Played = ({ u, t, at }) => {
  const walk = walking(u, 0, Math.max(0.6, at(1) - 0.2), 1180, 720);
  const give = ramp(u, at(1), at(1) + 0.6);
  const drink = ramp(u, at(2), at(2) + 0.6);
  const light = ramp(u, at(3), at(3) + 0.8);
  const seated = { x: 420, y: FLOOR - 70 - 22 };
  const glass = (
    <g>
      <path d="M -16 -34 L -12 18 L 12 18 L 16 -34 Z" fill="#cfe6ff" stroke={INK} strokeWidth={4} />
      <path d="M -14 -14 L -12 16 L 12 16 L 14 -14 Z" fill="#7fb6e6" opacity={1 - 0.7 * drink} />
    </g>
  );
  return (
    <g>
      <rect width={W} height={H} fill="#f2c27a" />
      <circle cx={860} cy={520} r={90} fill="#fff1b8" stroke={INK} strokeWidth={6} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d={`M ${860 + Math.cos(i * 0.785) * 110} ${520 + Math.sin(i * 0.785) * 110} l ${Math.cos(i * 0.785) * 40} ${Math.sin(i * 0.785) * 40}`} stroke="#fff1b8" strokeWidth={8} strokeLinecap="round" />)}
      <rect x={0} y={760} width={W} height={FLOOR - 760} fill="#d9a873" />
      {[0, 1, 2].map((i) => <rect key={i} x={60 + i * 330} y={820} width={240} height={330} fill="#c99a5e" stroke={INK} strokeWidth={6} />)}
      <rect x={0} y={FLOOR - 70} width={W} height={70} fill="#b9b2a2" stroke={INK} strokeWidth={6} />
      <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill="#6d7686" />
      {/* the worker on the kerb */}
      <Stick x={seated.x} y={seated.y} s={S * 0.92} facing={1} tone="white" cap="#e88a3a" face={drink > 0.5 ? "smile" : "worried"} pose={POSES.seat}
        handF={give > 0.5 ? [seated.x + 70, headY + 40] : [seated.x + 60, seated.y]} bendF={-1} heldF={give > 0.5 ? glass : undefined} />
      {drink < 0.5 ? [0, 1].map((i) => <path key={i} d={`M ${seated.x + 60 + i * 30} ${headY - 30 + ((t * 40 + i * 20) % 40)} q 6 10 0 16 q -6 -6 0 -16`} fill="#7fb6e6" />) : null}
      {/* the one who gives */}
      <Stick x={walk.x} y={PELVIS} s={S} facing={-1} tone="white" face={light > 0.5 ? "kind" : "neutral"} pose={walk.pose}
        handF={give < 0.5 ? lp([walk.x - 40, PELVIS + 10], [walk.x - 130, shoulderY + 70], give * 2) : [walk.x - 40, PELVIS + 20]} bendF={1}
        heldF={give < 0.5 && u > 0 ? glass : undefined} />
      {light > 0.01 ? <g opacity={light}><circle cx={seated.x + 90} cy={headY - 40} r={50 + 6 * Math.sin(t * 4)} fill="#fff1b8" opacity={0.5} /><circle cx={seated.x + 90} cy={headY - 40} r={10} fill="#fff8dc" /></g> : null}
    </g>
  );
};

// ------------------------------------------------------------------------------------ 70:19-23, the late salary

/** A home. `salary` « زي واحد مرتبه اتأخر يومين… فقلب البيت. ولما نزل… مسكه… ومحدش شاف منه حاجة. »: his phone shows
 * nothing, he shouts; a child watches; the money comes, he clutches his wallet; the child's hand stays empty. `cure` « …
 * والقرآن كتب علاجه في نفس المكان: الصلاة. لما تلاقي نفسك بتنهار… أو إيدك ماسكة… ارجع لصلاتك. »: he prays, calm. */
export const SalaryPlayed: Played = ({ u, at, variant }) => {
  const x = 520;
  const cure = variant === "cure";
  const angry = cure ? 0 : ramp(u, at(0) + 0.6, at(1) + 0.3) * (1 - ramp(u, at(2) - 0.3, at(2)));
  const paid = cure ? 0 : ramp(u, at(2), at(2) + 0.4);
  const clutch = cure ? 0 : ramp(u, at(3), at(3) + 0.4);
  const turned = cure ? 0 : ramp(u, at(4), at(4) + 0.4);
  const wallet = (
    <g>
      <rect x={-26} y={-18} width={52} height={36} rx={6} fill="#7a4b2a" stroke={INK} strokeWidth={4} />
      <rect x={-20} y={-26} width={36} height={14} fill="#3fa36b" stroke={INK} strokeWidth={3} />
    </g>
  );
  return (
    <g>
      <Room wall="#dcd3c3" floor="#7a6a58" />
      <rect x={720} y={640} width={240} height={220} fill="#9cc1e4" stroke={INK} strokeWidth={10} />
      {cure ? (
        <g>
          <path d={`M ${x - 150} ${FLOOR - 6} L ${x + 130} ${FLOOR - 6} L ${x + 160} ${FLOOR + 50} L ${x - 180} ${FLOOR + 50} Z`} fill="#2f6b4f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <circle cx={x} cy={headY} r={150} fill="#fff1b8" opacity={0.2 * ramp(u, at(5) - 0.3, at(5) + 0.5)} />
          <Stick x={x} y={PELVIS} s={S} facing={-1} tone="white" face="calm" pose={{ ...POSES.stand, head: -4 }}
            handF={[x - 34, shoulderY + 46]} bendF={1} handB={[x - 26, shoulderY + 62]} bendB={1} />
          <g opacity={ramp(u, at(3), at(3) + 0.3) * (1 - ramp(u, at(5) - 0.4, at(5)))}>
            <Burst x={x + 250} y={headY - 120} k={1} />
          </g>
          <g opacity={ramp(u, at(4), at(4) + 0.3) * (1 - ramp(u, at(5) - 0.4, at(5)))} transform={`translate(${x + 250} ${headY + 60})`}>{wallet}</g>
        </g>
      ) : (
        <g>
          {/* the child */}
          <Stick x={860} y={FLOOR - 154 * S * 0.62} s={S * 0.62} facing={-1} tone="white" face={turned > 0.5 ? "worried" : angry > 0.5 ? "shock" : "neutral"} pose={POSES.stand}
            handF={turned > 0.01 ? lp([840, FLOOR - 60], [740, shoulderY + 160], ramp(u, at(3), at(3) + 0.5)) : undefined} bendF={1} />
          <Stick x={x} y={PELVIS} s={S} facing={turned > 0.5 ? -1 : 1} tone="white" face={turned > 0.5 ? "smirk" : clutch > 0.5 ? "smirk" : angry > 0.5 ? "angry" : "worried"}
            pose={{ ...POSES.stand, torso: angry > 0.5 ? 8 : 0 }}
            handF={clutch > 0.5 ? [x + (turned > 0.5 ? -24 : 24), shoulderY + 50] : [x + 70, headY + 40]} bendF={-1}
            heldF={clutch > 0.5 ? wallet : <Phone glow={paid > 0.5} />} />
          {angry > 0.01 ? <Burst x={x + 180} y={headY - 140} k={angry} /> : null}
          {paid > 0.01 && clutch < 0.5 ? (
            <g opacity={paid} transform={`translate(${x + 100} ${headY - 70}) scale(2)`}>
              <Coin x={0} y={0} />
              <Coin x={10} y={-8} />
            </g>
          ) : null}
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------------------------ 6:125, the chest widened

/** « اطلب من ربنا يشرح صدرك. »: a dim room; his hand on his chest, grey lines tight around it; he raises his hands, the
 * lines loosen, a soft light opens from his chest. */
export const BreathPlayed: Played = ({ u }) => {
  const x = 540;
  const open = ramp(u, 0.9, 2.2);
  const palms: P2[] = [[x + 118, shoulderY + 4], [x + 86, shoulderY + 20]];
  return (
    <g>
      <Room wall="#2b2f52" floor="#3a3346" dark={0.2 * (1 - open)} />
      <circle cx={x + 10} cy={shoulderY + 40} r={60 + 160 * open} fill="#fff1b8" opacity={0.25 * open} />
      <Stick x={x} y={PELVIS} s={S} facing={1} tone="white" face={open > 0.5 ? "calm" : "worried"} pose={{ ...POSES.stand, head: lerp(-10, 14, open) }}
        handF={open > 0.3 ? palms[0] : [x + 20, shoulderY + 40]} bendF={1} handB={open > 0.3 ? palms[1] : undefined} bendB={1} />
      {open > 0.3 ? <Palms palms={palms} k={ramp(open, 0.3, 0.6)} /> : null}
      <g opacity={1 - open} stroke="#9aa0b4" strokeWidth={6} fill="none">
        <ellipse cx={x + 6} cy={shoulderY + 40} rx={60} ry={40} />
        <ellipse cx={x + 6} cy={shoulderY + 40} rx={80} ry={56} opacity={0.6} />
      </g>
    </g>
  );
};

// ----------------------------------------------------------------------------------- 23:14, look in the mirror

/** « بص في المراية… أول آية شفتها في حياتك… هي إنت. »: he stands before a mirror; his reflection; surprise, then a smile. */
export const MirrorPlayed: Played = ({ u, at }) => {
  const x = 380;
  const mirror = { x: 680, y: 640, w: 300, h: 620 };
  const wonder = ramp(u, at(1), at(1) + 0.4);
  const smile = ramp(u, at(2), at(2) + 0.4);
  const face: Face = smile > 0.5 ? "smile" : wonder > 0.5 ? "shock" : "neutral";
  return (
    <g>
      <Room wall="#cfd8e2" floor="#7a6a58" />
      <rect x={mirror.x - 16} y={mirror.y - 16} width={mirror.w + 32} height={mirror.h + 32} rx={20} fill="#a87b55" stroke={INK} strokeWidth={8} />
      <clipPath id="mirror-glass"><rect x={mirror.x} y={mirror.y} width={mirror.w} height={mirror.h} rx={10} /></clipPath>
      <rect x={mirror.x} y={mirror.y} width={mirror.w} height={mirror.h} rx={10} fill="#dfeaf4" />
      <g clipPath="url(#mirror-glass)">
        <g opacity={0.85}>
          <Stick x={mirror.x + 150} y={PELVIS} s={S} facing={-1} tone="white" face={face} pose={{ ...POSES.stand, head: 4 }} />
        </g>
        <path d={`M ${mirror.x + 40} ${mirror.y + 40} l 60 -30 M ${mirror.x + 40} ${mirror.y + 90} l 120 -60`} stroke="#ffffff" strokeWidth={10} opacity={0.6} />
      </g>
      <circle cx={mirror.x + 150} cy={headY} r={120} fill="#fff1b8" opacity={0.25 * smile} />
      <Stick x={x} y={PELVIS} s={S} facing={1} tone="white" face={face} pose={{ ...POSES.stand, head: 4 }} />
    </g>
  );
};
