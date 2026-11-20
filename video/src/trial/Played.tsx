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
