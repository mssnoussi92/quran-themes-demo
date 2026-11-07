import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../fonts";
import { REMINDER_SECONDS } from "../formats";
import type { Format } from "../formats";
import { COLOR } from "../theme";

// "Like and subscribe" reminder of the YouTube video (owner's request, 2026-11-07): a pill that
// slides in, a pointer that taps the like button (it fills), the subscribe button (it turns into
// "subscribed") and the bell (it swings), then slides out. Silent, ~4 s, only in the whole episode
// in 16:9, only over narration scenes (never over a verse or a hadith: Video.tsx places it).
// Icons: Material Icons (Google, Apache 2.0), paths copied as is.

const THUMB =
  "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z";
const BELL =
  "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z";

// When the pointer taps each button (seconds from the start).
const TAP = { like: 1.0, subscribe: 1.9, bell: 2.8 };
const NAVY = COLOR.backgroundTop;
const GOLD = COLOR.accent;

/** 0 before a tap, then a quick press (down) and release (springy), as a scale. */
function press(frame: number, fps: number, at: number): number {
  const t = frame - at * fps;
  if (t < 0) return 1;
  const down = interpolate(t, [0, 3], [1, 0.86], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const up = spring({ frame: t - 3, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
  return t < 3 ? down : 0.86 + 0.14 * up;
}

/** A soft ring growing out of a tapped button. */
const Ripple: React.FC<{ frame: number; fps: number; at: number; size: number }> = ({ frame, fps, at, size }) => {
  const t = (frame - at * fps) / fps;
  if (t < 0 || t > 0.6) return null;
  const k = interpolate(t, [0, 0.6], [0, 1], { easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        margin: "auto",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid ${GOLD}`,
        transform: `scale(${1 + k * 0.9})`,
        opacity: 0.7 * (1 - k),
      }}
    />
  );
};

export const SubscribeReminder: React.FC<{ format: Format }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const total = REMINDER_SECONDS;

  // Slide in from the left with a soft spring, slide down and fade out at the end.
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120, mass: 0.8 } });
  const exit = interpolate(t, [total - 0.5, total], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const x = interpolate(enter, [0, 1], [-60, 0]);
  const y = interpolate(exit, [0, 1], [0, 24]);
  const opacity = Math.min(enter, 1 - exit);

  // Button states after their tap.
  const liked = interpolate(t, [TAP.like + 0.05, TAP.like + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subscribed = interpolate(t, [TAP.subscribe + 0.08, TAP.subscribe + 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const swing = t > TAP.bell ? Math.sin((t - TAP.bell) * 26) * 18 * Math.exp(-(t - TAP.bell) * 4) : 0;

  // The pointer glides from one button to the next (ease in-out), dips a little on each tap.
  const BUTTON_X = { like: 44, subscribe: 250, bell: 468 };
  const px = interpolate(
    t,
    [0.45, TAP.like - 0.05, TAP.like + 0.25, TAP.subscribe - 0.05, TAP.subscribe + 0.25, TAP.bell - 0.05],
    [BUTTON_X.like - 70, BUTTON_X.like, BUTTON_X.like, BUTTON_X.subscribe, BUTTON_X.subscribe, BUTTON_X.bell],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );
  const pointerIn = interpolate(t, [0.4, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pointerOut = interpolate(t, [TAP.bell + 0.45, TAP.bell + 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pointerScale = Math.min(press(frame, fps, TAP.like), press(frame, fps, TAP.subscribe), press(frame, fps, TAP.bell));

  const round: React.CSSProperties = {
    position: "relative",
    width: 64,
    height: 64,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `2px solid ${GOLD}`,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: format.safe.left,
        bottom: format.safe.bottom + 170,
        opacity,
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "12px 16px",
          borderRadius: 999,
          background: COLOR.subtitleBox,
          border: `1px solid ${COLOR.panelBorder}`,
          boxShadow: "0 8px 30px rgba(0,0,0,.35)",
        }}
      >
        {/* Like */}
        <div style={{ ...round, transform: `scale(${press(frame, fps, TAP.like)})`, background: `rgba(216,178,106,${liked})` }}>
          <Ripple frame={frame} fps={fps} at={TAP.like} size={64} />
          <svg viewBox="0 0 24 24" width={32} height={32}>
            <path d={THUMB} fill={liked > 0.5 ? NAVY : "none"} stroke={liked > 0.5 ? NAVY : GOLD} strokeWidth={1.6} />
          </svg>
        </div>
        {/* Subscribe -> subscribed */}
        <div
          style={{
            position: "relative",
            height: 64,
            width: 300,
            borderRadius: 999,
            transform: `scale(${press(frame, fps, TAP.subscribe)})`,
            background: subscribed < 1 ? `rgba(216,178,106,${1 - subscribed})` : "transparent",
            border: `2px solid ${GOLD}`,
            overflow: "hidden",
          }}
        >
          <Ripple frame={frame} fps={fps} at={TAP.subscribe} size={64} />
          {/* The label rolls: the old one leaves upwards, the new one comes from below. */}
          <Label shift={-subscribed} opacity={1 - subscribed} color={NAVY} ar="اشترك" en="Subscribe" />
          <Label shift={1 - subscribed} opacity={subscribed} color={GOLD} ar="مشترك ✓" en="Subscribed" />
        </div>
        {/* Bell */}
        <div style={{ ...round, transform: `scale(${press(frame, fps, TAP.bell)})` }}>
          <Ripple frame={frame} fps={fps} at={TAP.bell} size={64} />
          <svg viewBox="0 0 24 24" width={30} height={30} style={{ transform: `rotate(${swing}deg)`, transformOrigin: "50% 15%" }}>
            <path d={BELL} fill={GOLD} />
          </svg>
        </div>
        {/* Pointer */}
        <div
          style={{
            position: "absolute",
            left: px,
            top: 52,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "rgba(255,255,255,.92)",
            boxShadow: "0 2px 8px rgba(0,0,0,.45)",
            opacity: Math.min(pointerIn, 1 - pointerOut),
            transform: `scale(${pointerScale})`,
          }}
        />
      </div>
    </div>
  );
};

const Label: React.FC<{ shift: number; opacity: number; color: string; ar: string; en: string }> = ({
  shift,
  opacity,
  color,
  ar,
  en,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transform: `translateY(${shift * 46}px)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      opacity,
      color,
      whiteSpace: "nowrap",
    }}
  >
    <span dir="rtl" style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: 30 }}>
      {ar}
    </span>
    <span style={{ fontFamily: FONT.latin, fontWeight: 600, fontSize: 24 }}>· {en}</span>
  </div>
);
