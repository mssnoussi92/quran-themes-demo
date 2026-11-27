// The channel's trailer (content/trial/trailer.yaml; owner, 2026-11-22: « décrit nos contenus de façon animée et qui
// attire »), in 16:9 (Trailer169, the YouTube trailer) and 9:16 (Trailer916, to pin on the other platforms). Seven beats,
// as validated: the word « أبابيل » and its question, the reel's 105:3 recited and its meaning, a passage every morning
// (a dot per passage, 1887), the stories (the thumbnails drawn for the films), the series (their covers), the sources,
// the call. Every time and text comes from trailerData.ts (tools/trial/trailer.py); the sound is one mix (audio.wav).
// Nobody drawn, nothing of the unseen; numbers in 123.
import type React from "react";
import { AbsoluteFill, Html5Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, loadFonts } from "../fonts";
import { ThumbArt } from "./ThumbArt";
import { TRAILER as D } from "./trailerData";

loadFonts();

const GOLD = "#f0c46a";
const PALE = "#f4efe2";
const MUTED = "#b9c3dc";
const INK = "#03050d";
const T = D.t;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
/** 0 → 1 from `at`, over `seconds`. */
const rise = (t: number, at: number, seconds = 0.35) => smooth((t - at) / seconds);
/** Shown from `a` to `b`, fading `edge` seconds at each end. */
const window_ = (t: number, a: number, b: number, edge = 0.3) => Math.min(rise(t, a, edge), 1 - rise(t, b - edge, edge));
/** A spring-like overshoot, 0 → 1. */
const pop = (t: number, at: number, seconds = 0.45) => {
  const x = clamp((t - at) / seconds);
  return x >= 1 ? 1 : 1 - Math.cos(x * Math.PI * 2.2) * Math.exp(-5 * x);
};
const chance = (i: number, salt = 0) => {
  const a = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return a - Math.floor(a);
};

// ------------------------------------------------------------------------------------------------- the canvas

const Canvas: React.FC<{ t: number; w: number; h: number }> = ({ t, w, h }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 38%, #18204a 0%, #0a1030 45%, ${INK} 100%)` }}>
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 140 }, (_, i) => {
        const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + chance(i, 4)) + i);
        return <circle key={i} cx={chance(i, 1) * w} cy={chance(i, 2) * h} r={0.6 + chance(i, 3) * 1.6} fill="#fff" opacity={(0.12 + 0.55 * chance(i, 5)) * (0.5 + 0.5 * tw)} />;
      })}
      {/* gold dust drifting up */}
      {Array.from({ length: 36 }, (_, i) => {
        const speed = 18 + 30 * chance(i, 7);
        const y = (h + 40 - ((t * speed + chance(i, 8) * h) % (h + 80)));
        const x = chance(i, 9) * w + 20 * Math.sin(t * 0.7 + i);
        return <circle key={`d${i}`} cx={x} cy={y} r={1.2 + 2.2 * chance(i, 10)} fill={GOLD} opacity={0.18 + 0.3 * chance(i, 11)} />;
      })}
    </svg>
  </AbsoluteFill>
);

// ------------------------------------------------------------------------------------------------- the words

/** An Arabic line whose words come up one after the other, right to left. */
const ArWords: React.FC<{ text: string; t: number; at: number; size: number; color?: string; weight?: number; font?: string; step?: number }> = ({
  text, t, at, size, color = PALE, weight = 700, font = FONT.arabic, step = 0.09,
}) => (
  <div style={{ direction: "rtl", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${size * 0.28}px`, lineHeight: 1.45 }}>
    {text.split(" ").map((word, i) => {
      const k = rise(t, at + i * step, 0.32);
      return (
        <span key={i} style={{ fontFamily: font, fontWeight: weight, fontSize: size, color, opacity: k, transform: `translateY(${(1 - k) * size * 0.45}px)`, display: "inline-block", textShadow: "0 4px 24px rgba(0,0,0,.55)" }}>
          {word}
        </span>
      );
    })}
  </div>
);

const En: React.FC<{ text: string; t: number; at: number; size: number; color?: string }> = ({ text, t, at, size, color = MUTED }) => {
  const k = rise(t, at, 0.4);
  return (
    <div style={{ fontFamily: FONT.latin, fontStyle: "italic", fontSize: size, color, opacity: k, transform: `translateY(${(1 - k) * 14}px)`, textAlign: "center", textShadow: "0 3px 16px rgba(0,0,0,.6)" }}>
      {text}
    </div>
  );
};

const Stack: React.FC<{ top: number; width: number; left: number; children: React.ReactNode; opacity?: number; gap?: number }> = ({ top, width, left, children, opacity = 1, gap = 18 }) => (
  <div style={{ position: "absolute", top, left, width, display: "flex", flexDirection: "column", alignItems: "center", gap, opacity }}>{children}</div>
);

// ------------------------------------------------------------------------------------------------- 1. the word

const Hook: React.FC<{ t: number; w: number; h: number; wide: boolean }> = ({ t, w, h, wide }) => {
  const show = window_(t, -1, T.verse, 0.3);
  if (show <= 0) return null;
  const k = pop(t, 0.0, 0.7);
  const glow = 0.5 + 0.5 * Math.sin(t * 3);
  const question = D.hook.ar.split("…").pop()!.trim();
  const ask = T.say1 + D.voice[0].phrases[1];
  return (
    <Stack top={wide ? h * 0.2 : h * 0.3} left={0} width={w} opacity={show} gap={wide ? 6 : 16}>
      <div style={{ fontSize: wide ? 230 : 250, color: GOLD, direction: "rtl", transform: `scale(${0.6 + 0.4 * k})`, filter: `blur(${(1 - clamp(k)) * 8}px)`, textShadow: `0 0 ${30 + 40 * glow}px rgba(240,196,106,.55)`, display: "flex", alignItems: "center" }}>
        {/* the guillemets and the ellipsis in Amiri: Amiri Quran draws « » like two brackets */}
        <span style={{ fontFamily: FONT.arabic, fontSize: "0.55em" }}>«</span>
        <span style={{ fontFamily: FONT.quran }}>{D.word}</span>
        <span style={{ fontFamily: FONT.arabic, fontSize: "0.55em" }}>»…</span>
      </div>
      <ArWords text={question} t={t} at={ask} size={wide ? 96 : 104} />
      <En text={D.hook.en} t={t} at={ask + 0.3} size={wide ? 42 : 44} />
    </Stack>
  );
};

// ------------------------------------------------------------------------------------------------- 2. the verse

/** Where things are on the reel, as shares of its frame: the gloss box and the line of credits. */
const GLOSS = { x: 0.07, y: 0.545, w: 0.86, h: 0.16 };
const CREDIT = { x: 0.2, y: 0.725, w: 0.6, h: 0.06 };

const Verse: React.FC<{ t: number; w: number; h: number; wide: boolean; fps: number }> = ({ t, w, h, wide, fps }) => {
  const show = window_(t, T.verse - 0.05, T.count, 0.3);
  if (show <= 0) return null;
  const enter = pop(t, T.verse - 0.05, 0.5);
  const first = rise(t, T.labels, 0.3) * (1 - rise(t, T.label2 - 0.1, 0.3));
  const second = rise(t, T.label2, 0.3);
  // 16:9: a window on the reel, the reel twice as large as a whole card would be, the camera on what is said: the verse
  // and its translation while it is recited, then the reciter's credit, then the box of the hard word. 9:16: the card.
  const winW = wide ? 1100 : (1180 * 9) / 16;
  const winH = wide ? 1000 : 1180;
  const reelW = wide ? winW * (1 + 0.05 * rise(t, T.verse, D.verseSeconds)) : winW;
  const reelH = (reelW * 16) / 9;
  const focus = 0.33 + (0.745 - 0.33) * rise(t, T.labels - 0.1, 0.6) + (0.625 - 0.745) * rise(t, T.label2 - 0.1, 0.6);
  const offY = wide ? Math.min(0, Math.max(winH - reelH, winH / 2 - focus * reelH)) : 0;
  const offX = (winW - reelW) / 2;
  const slide = rise(t, T.labels - 0.15, 0.5);
  const cx = wide ? w / 2 + slide * (w - 60 - winW / 2 - w / 2) : w / 2;
  const cy = wide ? h / 2 : 140 + winH / 2;
  const box = (r: { x: number; y: number; w: number; h: number }, on: number, key: string) => on <= 0 ? null : (
    <div key={key} style={{ position: "absolute", left: offX + r.x * reelW - 8, top: offY + r.y * reelH - 8, width: r.w * reelW + 16, height: r.h * reelH + 16, border: `5px solid ${GOLD}`, borderRadius: 22, opacity: on, boxShadow: `0 0 ${24 + 16 * Math.sin(t * 5)}px rgba(240,196,106,.7)` }} />
  );
  return (
    <AbsoluteFill style={{ opacity: show }}>
      <div style={{ position: "absolute", left: cx - winW / 2, top: cy - winH / 2, width: winW, height: winH, borderRadius: 34, overflow: "hidden", transform: `scale(${0.85 + 0.15 * enter})`, boxShadow: "0 30px 80px rgba(0,0,0,.6), 0 0 0 3px rgba(240,196,106,.5)", background: INK }}>
        <div style={{ position: "absolute", left: offX, top: offY, width: reelW, height: reelH }}>
          <Sequence from={Math.round(T.verse * fps)} durationInFrames={Math.round(D.verseSeconds * fps)} layout="none">
            <OffthreadVideo src={staticFile("trial/trailer/verse.mp4")} muted style={{ width: reelW, height: reelH }} />
          </Sequence>
          {t >= T.verse_end - 0.02 ? <Img src={staticFile("trial/trailer/verse-end.png")} style={{ position: "absolute", inset: 0, width: reelW, height: reelH }} /> : null}
        </div>
        {box(CREDIT, first, "c")}
        {box(GLOSS, second, "g")}
      </div>
      {/* the labels: on the left in 16:9, under the reel in 9:16 */}
      <div style={{ position: "absolute", left: wide ? 60 : 60, top: wide ? h * 0.26 : cy + winH / 2 + 50, width: wide ? w - winW - 160 : w - 120, display: "flex", flexDirection: "column", gap: wide ? 44 : 30 }}>
        {D.labels.map((l, i) => {
          const at = i === 0 ? T.labels : T.label2;
          const k = pop(t, at, 0.5);
          const on = rise(t, at, 0.25);
          return on <= 0 ? null : (
            <div key={i} style={{ opacity: on, transform: `scale(${0.7 + 0.3 * k})`, transformOrigin: wide ? "right center" : "center", background: "rgba(10,14,34,.72)", border: `2px solid ${i === 1 ? GOLD : "rgba(240,196,106,.45)"}`, borderRadius: 24, padding: wide ? "22px 30px" : "16px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ direction: "rtl", fontFamily: FONT.arabic, fontWeight: 700, fontSize: wide ? 54 : 50, color: i === 1 ? GOLD : PALE, textAlign: "center", lineHeight: 1.4 }}>{l.ar}</div>
              <div style={{ fontFamily: FONT.latin, fontStyle: "italic", fontSize: wide ? 30 : 28, color: MUTED, textAlign: "center" }}>{l.en}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------- 3. a dot a morning

const Count: React.FC<{ t: number; w: number; h: number; wide: boolean }> = ({ t, w, h, wide }) => {
  const show = window_(t, T.count, T.stories, 0.3);
  if (show <= 0) return null;
  const n = D.passages;
  const cols = wide ? 86 : 41;
  const pitch = wide ? 10.5 : 14;
  const rows = Math.ceil(n / cols);
  const gw = (cols - 1) * pitch;
  const gh = (rows - 1) * pitch;
  const gx = (w - gw) / 2;
  const gy = wide ? 250 : 470;
  const fill = rise(t, T.number, 1.15);
  const lit = Math.round(n * fill);
  const land = pop(t, T.number + 1.15, 0.5);
  const shown = Math.round(n * fill);
  const today = T.number - 0.6;           // the first dot alone, a morning
  return (
    <AbsoluteFill style={{ opacity: show }}>
      <Stack top={wide ? 40 : 230} left={0} width={w} gap={8}>
        <ArWords text={D.count.ar[0]} t={t} at={T.say3} size={wide ? 84 : 92} />
        <En text={D.count.en[0]} t={t} at={T.say3 + 0.3} size={wide ? 38 : 42} />
      </Stack>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {/* every passage a dot, right to left as a page of the mushaf is read */}
        {Array.from({ length: n }, (_, k) => {
          const x = gx + gw - (k % cols) * pitch;
          const y = gy + Math.floor(k / cols) * pitch;
          const on = k < lit;
          const first = k === 0 ? rise(t, today, 0.3) : 0;
          return <circle key={k} cx={x} cy={y} r={on || first ? (wide ? 4.2 : 5.6) : wide ? 2.2 : 3} fill={on || first ? GOLD : PALE} opacity={on || first ? 0.95 : 0.13} />;
        })}
      </svg>
      <div style={{ position: "absolute", top: gy + gh + (wide ? 10 : 40), left: 0, width: w, display: "flex", flexDirection: "column", alignItems: "center", gap: wide ? 0 : 6 }}>
        <div style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: wide ? 110 : 150, lineHeight: 1.25, color: GOLD, transform: `scale(${0.9 + 0.1 * land})`, textShadow: "0 0 30px rgba(240,196,106,.5)", opacity: rise(t, T.number, 0.2) }}>
          {shown}
        </div>
        <ArWords text={D.count.ar[1]} t={t} at={T.number} size={wide ? 62 : 70} />
        <En text={D.count.en[1]} t={t} at={T.number + 0.35} size={wide ? 34 : 40} />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------- 4. the stories

const Stories: React.FC<{ t: number; w: number; h: number; wide: boolean }> = ({ t, w, h, wide }) => {
  const show = window_(t, T.stories, T.life + 0.15, 0.25);
  if (show <= 0) return null;
  const scenes = D.stories.scenes;
  return (
    <AbsoluteFill style={{ opacity: show }}>
      {scenes.map((s, i) => {
        const a = T.stories + i * D.scene;
        const b = a + D.scene;
        const on = window_(t, a, b + (i < scenes.length - 1 ? 0.25 : 0), 0.25);
        if (on <= 0) return null;
        const p = clamp((t - a) / (D.scene + 0.25));
        const zoom = 1.03 + 0.07 * p;
        // 16:9: the scene over the whole frame. 9:16: a band across the middle (1200 px high), faded into the night
        // above and below, its subject (`focus`) kept in the middle while it slowly grows; the words above and under it.
        const band = 1200;
        const big = (wide ? w / 1920 : band / 1080) * zoom;
        const art = wide ? (
          <div style={{ position: "absolute", left: -40 * p, top: 0, width: 1920, height: 1080, transform: `scale(${big})`, transformOrigin: "50% 50%" }}>
            <ThumbArt art={s.art} />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 0, top: (h - band) / 2, width: w, height: band, overflow: "hidden", WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%)", maskImage: "linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%)" }}>
            <div style={{ position: "absolute", left: w / 2 - s.focus * big + 30 * (p - 0.5), top: band / 2 - 540 * big, width: 1920, height: 1080, transform: `scale(${big})`, transformOrigin: "0 0" }}>
              <ThumbArt art={s.art} />
            </div>
          </div>
        );
        return (
          <AbsoluteFill key={s.art} style={{ opacity: on, overflow: "hidden" }}>
            {art}
            {wide ? <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,5,13,.78) 0%, rgba(3,5,13,0) 30%, rgba(3,5,13,0) 62%, rgba(3,5,13,.85) 100%)" }} /> : null}
            <Stack top={wide ? h - 230 : (h + band) / 2 - 40} left={0} width={w} gap={4}>
              <div style={{ direction: "rtl", fontFamily: FONT.arabic, fontWeight: 700, fontSize: wide ? 96 : 104, color: GOLD, transform: `scale(${0.85 + 0.15 * pop(t, a + 0.1, 0.5)})`, opacity: rise(t, a + 0.05, 0.25), textShadow: "0 4px 28px rgba(0,0,0,.7)" }}>{s.ar}</div>
              <En text={s.en} t={t} at={a + 0.25} size={wide ? 36 : 40} color={PALE} />
            </Stack>
          </AbsoluteFill>
        );
      })}
      <Stack top={wide ? 50 : 150} left={0} width={w} gap={4}>
        <ArWords text={D.stories.ar} t={t} at={T.say4} size={wide ? 80 : 88} />
        <En text={D.stories.en} t={t} at={T.say4 + 0.3} size={wide ? 36 : 40} color={PALE} />
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------- 4b. the life lessons

/** Situations played by drawn characters (three shorts, muted, cropped to the played scene): side by side in 16:9, one
 * after the other in 9:16; the answers line above, the line on the characters under them. */
const Life: React.FC<{ t: number; w: number; wide: boolean; fps: number }> = ({ t, w, wide, fps }) => {
  const show = window_(t, T.life - 0.1, T.series + 0.1, 0.3);
  if (show <= 0) return null;
  const clips = D.life.clips;
  const ratio = D.life.ratio;
  const played = rise(t, T.say6 - 0.1, 0.4);
  const panel = (file: string, x: number, y: number, pw: number, on: number, from: number) => (
    <div key={file} style={{ position: "absolute", left: x, top: y, width: pw, height: pw / ratio, borderRadius: 26, overflow: "hidden", opacity: on, transform: `scale(${(0.8 + 0.2 * pop(t, from, 0.5)) * (1 + 0.035 * played)})`, boxShadow: played > 0.5 ? `0 0 0 4px ${GOLD}, 0 24px 60px rgba(0,0,0,.6)` : "0 0 0 2px rgba(240,196,106,.45), 0 20px 50px rgba(0,0,0,.55)" }}>
      <Sequence from={Math.round(from * fps)} durationInFrames={Math.round(D.life.seconds * fps)} layout="none">
        <OffthreadVideo src={staticFile(file)} muted style={{ width: pw, height: pw / ratio }} />
      </Sequence>
    </div>
  );
  // 9:16: each line in two, cut where the voice pauses (after the words of its first phrase)
  const cut = (text: string, k: number) => {
    const n = D.voice[k].line.split("…")[0].trim().split(" ").length;
    const words = text.split(" ");
    return [words.slice(0, n).join(" "), words.slice(n).join(" ")];
  };
  const lines = (text: string, k: number, at: number, size: number, color?: string) => wide ? (
    <ArWords text={text} t={t} at={at} size={size} color={color} />
  ) : (
    <>
      <ArWords text={cut(text, k)[0]} t={t} at={at} size={size} color={color} />
      <ArWords text={cut(text, k)[1]} t={t} at={at + D.voice[k].phrases[1]} size={size} color={color} />
    </>
  );
  const top = (
    <Stack top={wide ? 50 : 150} left={60} width={w - 120} gap={wide ? 8 : 0}>
      {lines(D.life.ar[0], 4, T.say5, wide ? 76 : 84)}
      <En text={D.life.en[0]} t={t} at={wide ? T.say5 + 0.4 : T.say5 + D.voice[4].phrases[1] + 0.3} size={wide ? 34 : 38} />
    </Stack>
  );
  if (wide) {
    const pw = 600;
    const gap = 30;
    const x0 = (w - (3 * pw + 2 * gap)) / 2;
    return (
      <AbsoluteFill style={{ opacity: show }}>
        {top}
        {clips.map((file, i) => panel(file, x0 + (clips.length - 1 - i) * (pw + gap), 230, pw, rise(t, T.life + 0.1 + 0.25 * i, 0.3), T.life + 0.1 + 0.25 * i))}
        <Stack top={230 + pw / ratio + 50} left={60} width={w - 120} gap={6}>
          {lines(D.life.ar[1], 5, T.say6, 70, GOLD)}
          <En text={D.life.en[1]} t={t} at={T.say6 + 0.4} size={32} />
        </Stack>
      </AbsoluteFill>
    );
  }
  const slot = (T.series - T.life) / clips.length;
  const pw = w - 80;
  return (
    <AbsoluteFill style={{ opacity: show }}>
      {top}
      {clips.map((file, i) => {
        const a = T.life + i * slot;
        const on = window_(t, a, a + slot + (i < clips.length - 1 ? 0.25 : 0.4), 0.25);
        return on <= 0 ? null : panel(file, 40, 560, pw, on, a);
      })}
      <Stack top={560 + pw / ratio + 50} left={60} width={w - 120} gap={0}>
        {lines(D.life.ar[1], 5, T.say6, 80, GOLD)}
        <En text={D.life.en[1]} t={t} at={T.say6 + D.voice[5].phrases[1] + 0.3} size={38} />
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------- 5. the series

const GROUPS = [[0, 1, 2], [3, 4, 5], [6, 7], [8, 9]];   // 16:9: up to three covers side by side, the first on the right

const Series: React.FC<{ t: number; w: number; wide: boolean }> = ({ t, w, wide }) => {
  const show = window_(t, T.series - 0.1, T.sources, 0.25);
  if (show <= 0) return null;
  const covers = D.series;
  const appear = (k: number) => T.series + k * D.card;
  if (wide) {
    const ch = 720;
    const cw = (ch * 9) / 16;
    const gap = 80;
    return (
      <AbsoluteFill style={{ opacity: show }}>
        {GROUPS.map((group, g) => {
          const a = appear(group[0]);
          const b = g < GROUPS.length - 1 ? appear(GROUPS[g + 1][0]) : T.sources + 0.3;
          const on = window_(t, a - 0.05, b, 0.15);
          if (on <= 0) return null;
          const x0 = (w - (group.length * cw + (group.length - 1) * gap)) / 2;
          return (
            <div key={g} style={{ position: "absolute", inset: 0, opacity: on }}>
              {group.map((k, i) => {
                const c = covers[k];
                const at = appear(k);
                const e = pop(t, at, 0.45);
                const vis = rise(t, at, 0.15);
                return (
                  <div key={c.file} style={{ position: "absolute", left: x0 + (group.length - 1 - i) * (cw + gap), top: 70, width: cw, opacity: vis, transform: `translateY(${(1 - clamp(e)) * 60}px) scale(${0.85 + 0.15 * e})` }}>
                    <div style={{ width: cw, height: ch, borderRadius: 24, overflow: "hidden", boxShadow: `0 0 0 3px ${GOLD}, 0 24px 60px rgba(0,0,0,.6)` }}>
                      <Img src={staticFile(c.file)} style={{ width: cw, height: ch, objectFit: "cover" }} />
                    </div>
                    <div style={{ direction: "rtl", fontFamily: FONT.arabic, fontWeight: 700, fontSize: 52, color: GOLD, textAlign: "center", marginTop: 14, whiteSpace: "nowrap" }}>{c.ar}</div>
                    <div style={{ fontFamily: FONT.latin, fontStyle: "italic", fontSize: 26, color: MUTED, textAlign: "center", whiteSpace: "nowrap" }}>{c.en}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </AbsoluteFill>
    );
  }
  const ch = 1120;
  const cw = (ch * 9) / 16;
  const step = cw * 1.06;
  // the focus moves from one cover to the next, the row sliding the way Arabic is read
  const focus = Math.min(covers.length - 1, Math.max(0, (t - T.series) / D.card - 0.5));
  const eased = Math.floor(focus) + smooth(focus - Math.floor(focus));
  const current = Math.min(covers.length - 1, Math.max(0, Math.floor((t - T.series) / D.card)));
  return (
    <AbsoluteFill style={{ opacity: show }}>
      {covers.map((c, i) => {
        const d = i - eased;
        if (Math.abs(d) > 2) return null;
        const x = w / 2 - d * step - cw / 2;
        const near = clamp(1 - Math.abs(d));
        const s = 0.72 + 0.28 * near;
        const y = 170 + (1 - s) * ch * 0.5;
        return (
          <div key={c.file} style={{ position: "absolute", left: x, top: y, width: cw, height: ch, transform: `scale(${s})`, transformOrigin: "50% 0", opacity: 0.35 + 0.65 * near, borderRadius: 26, overflow: "hidden", boxShadow: near > 0.5 ? `0 0 0 4px ${GOLD}, 0 24px 60px rgba(0,0,0,.6)` : "0 18px 40px rgba(0,0,0,.5)" }}>
            <Img src={staticFile(c.file)} style={{ width: cw, height: ch, objectFit: "cover" }} />
          </div>
        );
      })}
      <Stack top={170 + ch + 40} left={0} width={w} gap={2}>
        <div key={current} style={{ direction: "rtl", fontFamily: FONT.arabic, fontWeight: 700, fontSize: 88, color: GOLD, transform: `scale(${0.85 + 0.15 * pop(t, appear(current), 0.35)})` }}>{covers[current].ar}</div>
        <div style={{ fontFamily: FONT.latin, fontStyle: "italic", fontSize: 38, color: MUTED }}>{covers[current].en}</div>
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------- 6. the sources

const CHIPS = [
  { ar: "صحيح البخاري", en: "Sahih al-Bukhari" },
  { ar: "صحيح مسلم", en: "Sahih Muslim" },
  { ar: "التفسير الميسر", en: "Tafsir al-Muyassar" },
  { ar: "Sahih International", en: "translation" },
];

const Sources: React.FC<{ t: number; w: number; h: number; wide: boolean }> = ({ t, w, h, wide }) => {
  const show = window_(t, T.sources, T.follow, 0.3);
  if (show <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: show }}>
      <Stack top={wide ? h * 0.2 : h * 0.24} left={60} width={w - 120} gap={12}>
        {wide ? <ArWords text={D.sources.ar} t={t} at={T.say7} size={92} /> : (
          // two lines, cut where the voice pauses (« كل آية وكل حديث… من مصدر منشور »)
          <>
            <ArWords text={D.sources.ar.split(" ").slice(0, 4).join(" ")} t={t} at={T.say7} size={100} />
            <ArWords text={D.sources.ar.split(" ").slice(4).join(" ")} t={t} at={T.say7 + D.voice[6].phrases[1]} size={100} />
          </>
        )}
        <En text={D.sources.en} t={t} at={wide ? T.say7 + 0.4 : T.say7 + D.voice[6].phrases[1] + 0.3} size={wide ? 40 : 42} />
      </Stack>
      <div style={{ position: "absolute", top: wide ? h * 0.6 : h * 0.5, left: 60, width: w - 120, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: wide ? 26 : 22, direction: "rtl" }}>
        {CHIPS.map((c, i) => {
          const at = T.sources + 1.0 + i * 0.35;
          const k = pop(t, at, 0.4);
          return (
            <div key={i} style={{ opacity: rise(t, at, 0.15), transform: `scale(${0.6 + 0.4 * k})`, display: "flex", alignItems: "center", gap: 14, background: "rgba(10,14,34,.8)", border: `2px solid ${GOLD}`, borderRadius: 999, padding: wide ? "14px 30px" : "14px 28px" }}>
              <svg width={34} height={34} viewBox="0 0 34 34"><circle cx={17} cy={17} r={16} fill={GOLD} /><path d="M9 17.5l5.5 5.5L25.5 11" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontFamily: /[a-z]/i.test(c.ar) ? FONT.latin : FONT.arabic, fontWeight: 700, fontSize: wide ? 44 : 46, color: PALE, direction: /[a-z]/i.test(c.ar) ? "ltr" : "rtl" }}>{c.ar}</div>
                <div style={{ fontFamily: FONT.latin, fontStyle: "italic", fontSize: wide ? 24 : 26, color: MUTED }}>{c.en}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------- 7. the call

const Follow: React.FC<{ t: number; w: number; h: number; wide: boolean; handle: string }> = ({ t, w, h, wide, handle }) => {
  const show = rise(t, T.follow, 0.35);
  if (show <= 0) return null;
  const second = T.say8 + D.voice[7].phrases[1];
  const pressed = t >= T.press + 0.12;
  const press = t >= T.press && t < T.press + 0.25 ? 0.9 : 1;
  const bell = pressed ? Math.sin((t - T.press) * 26) * Math.exp(-(t - T.press) * 3) * 18 : 0;
  return (
    <AbsoluteFill style={{ opacity: show }}>
      <Stack top={wide ? h * 0.12 : h * 0.2} left={0} width={w} gap={10}>
        <div style={{ direction: "rtl", fontFamily: FONT.arabic, fontWeight: 700, fontSize: wide ? 130 : 150, color: GOLD, transform: `scale(${0.8 + 0.2 * pop(t, T.say8, 0.5)})`, textShadow: "0 0 30px rgba(240,196,106,.45)" }}>{D.follow.ar[0]}</div>
        <ArWords text={D.follow.ar[1]} t={t} at={second} size={wide ? 84 : 92} />
        <En text={`${D.follow.en[0]} ${D.follow.en[1]}`} t={t} at={second + 0.35} size={wide ? 38 : 42} />
      </Stack>
      <div style={{ position: "absolute", top: wide ? h * 0.66 : h * 0.58, left: 0, width: w, display: "flex", flexDirection: "column", alignItems: "center", gap: wide ? 26 : 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, direction: "rtl", transform: `scale(${press * (0.85 + 0.15 * pop(t, T.follow + 0.2, 0.5))})`, opacity: rise(t, T.follow + 0.2, 0.3) }}>
          <div style={{ background: pressed ? "#3a3f55" : "#e62117", color: "#fff", borderRadius: 999, padding: wide ? "20px 46px" : "24px 54px", fontFamily: FONT.latin, fontWeight: 700, fontSize: wide ? 44 : 50, display: "flex", alignItems: "center", gap: 18, boxShadow: "0 14px 40px rgba(0,0,0,.5)", direction: "rtl" }}>
            <span style={{ direction: "rtl", fontFamily: FONT.arabic }}>{pressed ? "مشترك" : "اشترك"}</span>
            <span>·</span>
            <span>{pressed ? "Subscribed" : "Subscribe"}</span>
          </div>
          <svg width={wide ? 70 : 80} height={wide ? 70 : 80} viewBox="0 0 64 64" style={{ transform: `rotate(${bell}deg)`, transformOrigin: "50% 15%", opacity: pressed ? 1 : 0.45 }}>
            <path d="M32 6c-9 0-15 7-15 16v11l-6 9h42l-6-9V22c0-9-6-16-15-16z" fill={pressed ? GOLD : PALE} />
            <circle cx={32} cy={49} r={6} fill={pressed ? GOLD : PALE} />
          </svg>
        </div>
        <div style={{ fontFamily: FONT.latin, fontWeight: 700, fontSize: wide ? 56 : 60, color: GOLD, opacity: rise(t, T.press + 0.3, 0.4) }}>{handle}</div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------- the video

/** `handle`: the page's name at the end; on TikTok the page is `@quran.words.daily` (`@quran_words_daily` is someone
 * else's account there): the 9:16 is rendered a second time signed with it (Trailer916TikTok). */
export type TrailerProps = { handle: string };

export const Trailer: React.FC<TrailerProps> = ({ handle }) => {
  const frame = useCurrentFrame();
  const { fps, width: w, height: h } = useVideoConfig();
  const t = frame / fps;
  const wide = w > h;
  return (
    <AbsoluteFill style={{ background: INK }}>
      <Canvas t={t} w={w} h={h} />
      <Hook t={t} w={w} h={h} wide={wide} />
      <Verse t={t} w={w} h={h} wide={wide} fps={fps} />
      <Count t={t} w={w} h={h} wide={wide} />
      <Stories t={t} w={w} h={h} wide={wide} />
      <Life t={t} w={w} wide={wide} fps={fps} />
      <Series t={t} w={w} wide={wide} />
      <Sources t={t} w={w} h={h} wide={wide} />
      <Follow t={t} w={w} h={h} wide={wide} handle={handle} />
      <Html5Audio src={staticFile("trial/trailer/audio.wav")} />
    </AbsoluteFill>
  );
};

export const TRAILER_FRAMES = Math.ceil(D.seconds * D.fps);
export const TRAILER_FPS = D.fps;
export const TRAILER_HANDLE = D.handle;
export const TIKTOK_HANDLE = "@quran.words.daily";
