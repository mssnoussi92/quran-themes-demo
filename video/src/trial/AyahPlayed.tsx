// « آية وحكايتها », the shorts redone on 2026-11-20 (docs/history.md). The owner, after the first short was published:
// « après le verset on parle trop et l'écran est presque le même… il faut créer la situation dans l'écran avec les
// personnes avec visage ». The life example of each short is played by stick figures with simple faces, in the style of
// « الصاحب ساحب » that he validated on 2026-11-19 (flat figures outlined in ink), on a drawn set of its own that comes
// over the filmed landscape for the example and leaves it again. Anonymous people of a typical scene only, as his rule
// allows: nobody of the story (the Prophet ﷺ, the Companions, Abu Bakr) is ever drawn.
//
// Each set is drawn at `u`, the seconds since its scene came (a `pause` first, then the narration), and `at(n)`, when the
// n-th phrase of the narration on that scene is said, in the same seconds.
import React from "react";
import { Easing, interpolate } from "remotion";
import { Purse } from "./Ayah";
import { walk } from "./Lens";
import { Bubble, Phone, POSES, Stick, type Pose } from "./Sahib";

const W = 1080;
const H = 1920;
const INK = "#17181d";
/** Where the figures stand: above the subtitle, which starts at 1392 (`caption` of the layout, Trial.tsx). */
const FLOOR = 1320;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (u: number, a: number, b: number) => interpolate(u, [a, b], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
type P2 = [number, number];
const lp = (a: P2, b: P2, k: number): P2 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const frac = (v: number) => v - Math.floor(v);
const chance = (i: number, salt = 0) => frac(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453);

export type Played = React.FC<{ u: number; t: number; at: (n: number) => number }>;

/** A figure that walks from `a` to `b` between `u0` and `u1`, its legs in step while it moves. */
const walking = (u: number, u0: number, u1: number, a: number, b: number, rest: Pose = POSES.stand) => {
  const k = interpolate(u, [u0, u1], [0, 1], CLAMP);
  const x = lerp(a, b, k);
  return { x, pose: u > u0 && u < u1 ? { ...walk(Math.abs(x - a) / 30), torso: 6 } : rest };
};

/** The scale of the figures and the height of their pelvis above the floor (thigh and shin, 154 units). */
const S = 1.45;
const PELVIS = FLOOR - 154 * S;

// -------------------------------------------------------------------------------------------- 93: the du'a at night

/** « زي دعوة بتدعيها من شهور… ولسه ما جاتش. », then three seconds with no text. A room at night, a window: a man stands
 * on his prayer rug and raises his hands, hopeful; the sky of the window turns, night, morning, night, again and again;
 * at « ولسه ما جاتش » his eyebrows fall, and his hands stay raised. */
export const PrayPlayed: Played = ({ u, at }) => {
  const start = at(0);
  const phase = Math.max(0, u - start) / 1.7;                  // one night and one day in 1.7 s: months go by
  const day = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);      // 0 at night, 1 at noon
  const raise = ramp(u, 0.2, 1.2);
  const sad = ramp(u, at(1), at(1) + 0.5);
  const x = 700;
  const shoulder: P2 = [x, PELVIS - 106 * S];
  const palmF: P2 = [shoulder[0] - 112, shoulder[1] - 26];       // in front of the chest, at the height of the shoulders
  const palmB: P2 = [shoulder[0] - 66, shoulder[1] - 14];
  const win = { x: 130, y: 640, w: 400, h: 380 };
  const across = (p: number): P2 => [win.x + 30 + frac(p) * (win.w - 60), win.y + win.h * 0.62 - Math.sin(Math.PI * frac(p)) * win.h * 0.42];
  const sun = across(phase - 0.25);
  const moon = across(phase + 0.25);
  return (
    <g>
      <defs>
        <linearGradient id="pray-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1f3c" />
          <stop offset="1" stopColor="#2b2f52" />
        </linearGradient>
        <clipPath id="pray-window"><rect x={win.x} y={win.y} width={win.w} height={win.h} /></clipPath>
        <mask id="pray-crescent">
          <circle cx={moon[0]} cy={moon[1]} r={30} fill="#fff" />
          <circle cx={moon[0] + 13} cy={moon[1] - 8} r={25} fill="#000" />
        </mask>
      </defs>
      <rect width={W} height={H} fill="url(#pray-wall)" />
      {/* the window: its sky turns, the sun and the moon cross it */}
      <g clipPath="url(#pray-window)">
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="#0b1230" />
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="#8fc6f2" opacity={day} />
        {Array.from({ length: 14 }, (_, i) => (
          <circle key={i} cx={win.x + 20 + chance(i, 1) * (win.w - 40)} cy={win.y + 20 + chance(i, 2) * win.h * 0.6} r={2 + 2 * chance(i, 3)} fill="#e8eefc" opacity={(1 - day) * 0.8} />
        ))}
        <circle cx={sun[0]} cy={sun[1]} r={34} fill="#ffd36b" stroke={INK} strokeWidth={5} opacity={ramp(day, 0.35, 0.75)} />
        <circle cx={moon[0]} cy={moon[1]} r={30} fill="#f3eccf" mask="url(#pray-crescent)" opacity={1 - ramp(day, 0.25, 0.65)} />
        {/* roofs of the town under the sky */}
        <path d={`M ${win.x} ${win.y + win.h} L ${win.x} ${win.y + 300} L ${win.x + 70} ${win.y + 300} L ${win.x + 70} ${win.y + 270} L ${win.x + 150} ${win.y + 270} L ${win.x + 150} ${win.y + 310} L ${win.x + 240} ${win.y + 310} L ${win.x + 240} ${win.y + 250} L ${win.x + 330} ${win.y + 250} L ${win.x + 330} ${win.y + 290} L ${win.x + win.w} ${win.y + 290} L ${win.x + win.w} ${win.y + win.h} Z`}
          fill="#141a36" />
        <path d={`M ${win.x} ${win.y + win.h} L ${win.x} ${win.y + 300} L ${win.x + 70} ${win.y + 300} L ${win.x + 70} ${win.y + 270} L ${win.x + 150} ${win.y + 270} L ${win.x + 150} ${win.y + 310} L ${win.x + 240} ${win.y + 310} L ${win.x + 240} ${win.y + 250} L ${win.x + 330} ${win.y + 250} L ${win.x + 330} ${win.y + 290} L ${win.x + win.w} ${win.y + 290} L ${win.x + win.w} ${win.y + win.h} Z`}
          fill="#566b8c" opacity={day} />
      </g>
      <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="none" stroke={INK} strokeWidth={14} />
      <path d={`M ${win.x + win.w / 2} ${win.y} L ${win.x + win.w / 2} ${win.y + win.h} M ${win.x} ${win.y + win.h / 2} L ${win.x + win.w} ${win.y + win.h / 2}`} stroke={INK} strokeWidth={9} />
      <rect x={win.x - 24} y={win.y + win.h} width={win.w + 48} height={22} fill="#6b5a7a" stroke={INK} strokeWidth={6} />
      {/* the floor, the light of the window on it by day */}
      <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill="#3a3346" />
      <rect x={0} y={FLOOR} width={W} height={10} fill={INK} opacity={0.6} />
      <path d={`M ${win.x + 40} ${FLOOR} L ${win.x + win.w + 40} ${FLOOR} L ${win.x + win.w + 260} ${H} L ${win.x + 140} ${H} Z`} fill="#ffe7a8" opacity={0.18 * day} />
      {/* the prayer rug */}
      <path d={`M ${x - 160} ${FLOOR - 6} L ${x + 140} ${FLOOR - 6} L ${x + 170} ${FLOOR + 50} L ${x - 190} ${FLOOR + 50} Z`} fill="#2f6b4f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${x - 140} ${FLOOR + 4} L ${x + 120} ${FLOOR + 4} L ${x + 142} ${FLOOR + 40} L ${x - 166} ${FLOOR + 40} Z`} fill="none" stroke="#e7c76a" strokeWidth={5} strokeLinejoin="round" />
      <Stick x={x} y={PELVIS} s={S} facing={-1} tone="white" face={sad > 0.5 ? "worried" : "calm"}
        pose={{ ...POSES.stand, head: lerp(lerp(0, 10, raise), -8, sad) }}
        handF={lp([x - 6, PELVIS + 20], palmF, raise)} bendF={1}
        handB={lp([x + 4, PELVIS + 24], palmB, raise)} bendB={1} />
      {/* the open hands of a du'a, palms up, once raised */}
      <g opacity={ramp(raise, 0.7, 1)}>
        {[palmB, palmF].map(([px, py], i) => (
          <path key={i} d={`M ${px - 26} ${py - 10} Q ${px - 22} ${py + 16} ${px} ${py + 16} Q ${px + 22} ${py + 16} ${px + 26} ${py - 10}`} fill="#f6f3ec" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        ))}
      </g>
      {/* the room darkens at night */}
      <rect width={W} height={H} fill="#050914" opacity={0.28 * (1 - day)} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------ 39:53: the mosque door

/** 2.5 s with no text: a man walks up the street at night towards the door of a mosque, closed, and stops. « زي واحد
 * ساب الصلاة سنين… وكل ما ييجي يرجع يقول: بعد كل ده؟ »: he steps towards it, then back, his face unsure. « أيوه… »: the
 * door opens and its light falls on the street; « بعد كل ده. »: he walks in. Phrases: 0 « زي واحد… », 1 « وكل ما ييجي
 * يرجع يقول: », 2 « بعد كل ده؟ », 3 « أيوه… », 4 « بعد كل ده. », 5-7 the last line. */
export const DoorPlayed: Played = ({ u, t, at }) => {
  const door = { x: 770, w: 270, top: 720 };
  const open = ramp(u, at(3), at(3) + 1.3);
  // where he is: he comes in, stops; one step forward, one step back; then into the door
  const come = walking(u, 0, 2.2, -90, 290);
  const forth = walking(u, at(1), at(1) + 0.9, 290, 360);
  const back = walking(u, at(2), at(2) + 0.9, 360, 280);
  const goIn = walking(u, at(4), at(4) + 2.6, 280, door.x);
  const x = u < at(1) ? come.x : u < at(2) ? forth.x : u < at(4) ? back.x : goIn.x;
  const pose = u < at(1) ? come.pose : u < at(2) ? forth.pose : u < at(4) ? back.pose : goIn.pose;
  const inside = ramp(u, at(4) + 2.0, at(4) + 2.7);
  const unsure = ramp(u, at(0), at(0) + 0.4) * (1 - ramp(u, at(3) + 0.3, at(3) + 0.8));
  const face = u >= at(3) + 0.5 ? "smile" : unsure > 0.5 ? "worried" : "neutral";
  const arch = (x0: number, w: number, top: number, bottom: number) => `M ${x0 - w / 2} ${bottom} L ${x0 - w / 2} ${top + w / 2} A ${w / 2} ${w / 2} 0 0 1 ${x0 + w / 2} ${top + w / 2} L ${x0 + w / 2} ${bottom} Z`;
  return (
    <g>
      <defs>
        <linearGradient id="door-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1230" />
          <stop offset="1" stopColor="#2a2d55" />
        </linearGradient>
        <radialGradient id="door-light" cx=".5" cy=".9" r=".7">
          <stop offset="0" stopColor="#ffe7a8" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffb85c" stopOpacity=".55" />
        </radialGradient>
        <clipPath id="door-in"><path d={arch(door.x, door.w, door.top, FLOOR)} /></clipPath>
      </defs>
      <rect width={W} height={H} fill="url(#door-sky)" />
      {Array.from({ length: 36 }, (_, i) => (
        <circle key={i} cx={chance(i, 3) * W} cy={60 + chance(i, 4) * 640} r={1.5 + 2 * chance(i, 5)} fill="#e8eefc" opacity={0.35 + 0.35 * Math.sin(t * 1.5 + i)} />
      ))}
      {/* the minaret behind */}
      <g stroke={INK} strokeWidth={7} strokeLinejoin="round" fill="#3a3f68">
        <rect x={960} y={330} width={84} height={300} />
        <path d="M 942 352 L 1062 352 L 1054 378 L 950 378 Z" />
        <path d="M 970 330 Q 1002 250 1034 330 Z" />
      </g>
      <path d="M 1002 250 L 1002 214" stroke={INK} strokeWidth={6} />
      {/* the wall of the mosque, its windows, its door */}
      <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
        <rect x={480} y={600} width={640} height={FLOOR - 600} fill="#d8ccb2" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={480 + i * 100} y={576} width={60} height={28} fill="#d8ccb2" />)}
        <path d={arch(580, 70, 690, 810)} fill="#ffcf7a" fillOpacity={0.55} />
        <path d={arch(990, 70, 690, 810)} fill="#ffcf7a" fillOpacity={0.55} />
        <path d={arch(door.x, door.w + 40, door.top - 20, FLOOR)} fill="#b9a988" />
      </g>
      <g clipPath="url(#door-in)">
        <rect x={door.x - door.w / 2} y={door.top} width={door.w} height={FLOOR - door.top} fill="url(#door-light)" opacity={open} />
        <rect x={door.x - door.w / 2} y={door.top} width={door.w} height={FLOOR - door.top} fill="#120d0a" opacity={1 - open} />
        {/* the two leaves of the door swing open */}
        {[-1, 1].map((side) => {
          const leaf = (door.w / 2) * (1 - 0.82 * open);
          const edge = door.x + side * (door.w / 2);
          return (
            <g key={side}>
              <rect x={side < 0 ? edge : edge - leaf} y={door.top} width={leaf} height={FLOOR - door.top} fill="#7a4b2a" stroke={INK} strokeWidth={6} />
              <circle cx={side < 0 ? edge + leaf - 18 : edge - leaf + 18} cy={1080} r={8} fill="#e7c76a" stroke={INK} strokeWidth={3} />
            </g>
          );
        })}
        <path d={`M ${door.x - 6} ${door.top} L ${door.x + 6} ${door.top}`} stroke="#ffe7a8" strokeWidth={4} opacity={0.6 * (1 - open)} />
      </g>
      <path d={arch(door.x, door.w, door.top, FLOOR)} fill="none" stroke={INK} strokeWidth={8} />
      {/* the lantern over the door */}
      <g stroke={INK} strokeWidth={5} strokeLinejoin="round">
        <path d={`M ${door.x} 626 L ${door.x} 646`} />
        <path d={`M ${door.x - 20} 646 L ${door.x + 20} 646 L ${door.x + 15} 682 L ${door.x - 15} 682 Z`} fill="#ffe2a8" />
      </g>
      <circle cx={door.x} cy={664} r={64} fill="#ffe2a8" opacity={0.18 + 0.04 * Math.sin(t * 2)} />
      {/* the street, and the light of the open door on it */}
      <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill="#34314a" />
      <rect x={0} y={FLOOR} width={W} height={10} fill={INK} opacity={0.6} />
      <path d={`M ${door.x - door.w / 2} ${FLOOR} L ${door.x + door.w / 2} ${FLOOR} L ${door.x + door.w} ${H} L ${door.x - door.w} ${H} Z`} fill="#ffe2a8" opacity={0.35 * open} />
      <g opacity={1 - inside}>
        <Stick x={x} y={PELVIS} s={S} facing={1} tone="white" face={face} pose={{ ...pose, head: lerp(0, -12, unsure) }} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------- 24:22: words behind his back

/** 2 s with no text: a house cut open, two rooms. On the right a relative leans to someone and talks: a bubble of dots,
 * never words. On the left the man in his room, his phone in his hand. « والكلام وصلك. »: the phone lights, he reads,
 * shocked. « فتقول: خلاص… لا هكلّمه… ولا هقف جنبه تاني. »: he turns his back, arms crossed. « ما تقطعش خيرك عنه… »: he turns
 * round, opens the door between the rooms and holds out the purse of the series; the relative's face softens. Phrases:
 * 0 « زي قريب… », 1 « والكلام وصلك. », 2-5 the second line, 6 « ما تقطعش خيرك عنه… », 7 « عشان غلطة. ». */
export const RumorPlayed: Played = ({ u, t, at }) => {
  const wall = 540;
  const ceiling = 660;
  const read = ramp(u, at(1), at(1) + 0.5);
  const away = u >= at(2) + 0.2 && u < at(6);
  const kind = u >= at(6);
  const opened = ramp(u, at(6), at(6) + 0.8);
  const step = walking(u, at(6) + 0.3, at(6) + 1.6, 290, 400);
  const x = kind ? step.x : 290;
  const give = ramp(u, at(6) + 1.0, at(6) + 1.8);
  const talking = u < at(2);
  const listener = 1 - ramp(u, at(2), at(2) + 0.8);
  const relX = lerp(800, 680, ramp(u, at(6) + 0.8, at(6) + 2.0));
  const s = 1.25;
  const pelvis = FLOOR - 154 * s;
  const heroShoulder: P2 = [x, PELVIS - 106 * S];
  const phoneHand: P2 = lp([x + 60, PELVIS + 30], [x + 70, heroShoulder[1] - 30], read);
  return (
    <g>
      <rect width={W} height={H} fill="#1b1f3a" />
      {/* the house cut open: two rooms, a wall between them, a door in it */}
      <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
        <path d={`M 20 ${ceiling} L 540 ${ceiling - 180} L 1060 ${ceiling} Z`} fill="#7a4b3a" />
        <rect x={20} y={ceiling} width={wall - 20} height={FLOOR - ceiling} fill="#efe1c6" />
        <rect x={wall} y={ceiling} width={1060 - wall} height={FLOOR - ceiling} fill="#d3dae8" />
        <rect x={wall - 18} y={ceiling} width={36} height={FLOOR - ceiling} fill="#b9ab90" />
      </g>
      {/* the door between the rooms: shut, then open */}
      <rect x={wall - 18} y={1000} width={36} height={FLOOR - 1000} fill="#5c3a22" opacity={1 - opened} stroke={INK} strokeWidth={5} />
      <rect x={wall - 18} y={1000} width={36} height={FLOOR - 1000} fill="#fff1cf" opacity={opened} />
      {/* a lamp on the left, a window on the right */}
      <g stroke={INK} strokeWidth={5}>
        <path d="M 120 660 L 120 720" />
        <path d="M 88 720 L 152 720 L 140 760 L 100 760 Z" fill="#ffe2a8" />
      </g>
      <circle cx={120} cy={750} r={90} fill="#ffe2a8" opacity={0.2} />
      <rect x={880} y={760} width={130} height={150} fill="#0e1636" stroke={INK} strokeWidth={6} />
      <path d="M 945 760 L 945 910 M 880 835 L 1010 835" stroke={INK} strokeWidth={5} />
      <rect x={20} y={FLOOR} width={1040} height={20} fill="#8a6a4a" stroke={INK} strokeWidth={6} />
      <rect x={0} y={FLOOR + 20} width={W} height={H - FLOOR - 20} fill="#2a2840" />
      {/* the right room: the relative talks to someone */}
      <g opacity={listener}>
        <Stick x={960} y={pelvis} s={s} facing={-1} tone="white" face={u > 1.0 ? "shock" : "neutral"} pose={{ ...POSES.stand, torso: -4 }} cap="#3d7cc9" />
      </g>
      <Stick x={relX} y={pelvis} s={s} facing={1} tone="grey" face={talking ? "smirk" : u >= at(6) + 1.6 ? "kind" : "neutral"}
        pose={{ ...POSES.stand, torso: talking ? 12 : 0, head: talking ? -4 : 0 }}
        handF={talking ? [relX + 66, pelvis - 120 * s] : undefined} bendF={1} />
      {talking ? (
        <g opacity={1 - ramp(u, at(2) - 0.4, at(2))}>
          <Bubble x={relX + 70} y={pelvis - 360 * s} text="…" k={ramp(u, 0.3, 0.8)} tail={-1} size={60} />
        </g>
      ) : null}
      {/* the left room: the man and his phone */}
      <Stick x={x} y={PELVIS} s={S} facing={away ? -1 : 1} tone="white"
        face={kind ? "kind" : away ? "cross" : read > 0.5 ? "shock" : "calm"}
        pose={kind ? step.pose : { ...POSES.stand, head: read > 0.5 && !away ? -10 : 0 }}
        handF={away ? [x - 40, heroShoulder[1] + 40] : kind ? lp([x + 50, PELVIS + 20], [x + 150, heroShoulder[1] + 20], give) : phoneHand} bendF={away ? 1 : -1}
        handB={away ? [x - 46, heroShoulder[1] + 54] : undefined} bendB={1}
        heldF={kind ? <Purse id="r-purse" x={0} y={38} scale={1.05} t={t} glow={0.4 + 0.6 * give} /> : away ? undefined : <Phone glow={read > 0.2} flash={ramp(u, at(1) - 0.1, at(1) + 0.15) * (1 - ramp(u, at(1) + 0.3, at(1) + 0.8))} />} />
    </g>
  );
};
