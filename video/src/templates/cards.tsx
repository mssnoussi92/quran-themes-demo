// Cards (task 4): title, verse with the recited word highlighted, hadith, name; and the "scene"
// template with its background and characters (task 5).
import { Fragment, useContext } from "react";
import { AudioStart } from "../audioStart";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BACKGROUNDS } from "../backgrounds/Backgrounds";
import { CharacterView, placement } from "../characters/Character";
import { FONT } from "../fonts";
import { STAGE, SUBTITLE_RESERVE, type Format } from "../formats";
import { COLOR } from "../theme";
import { splitPhrases } from "../phrases";
import type { PhraseTiming, ResolvedScene, WordTiming } from "../types";
import { StyleContext } from "../styles/context";
import type { PanelKind, TitlePhrase } from "../styles/kit";
import { KITS } from "../styles/kits";
import { PAPER_SHEET, PaperScene } from "../styles/paper/render";

type CardProps = { scene: ResolvedScene; format: Format };


const hasLetter = (token: string) => /\p{L}/u.test(token);

/** The card enters with a short spring (scale and opacity). */
const Enter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 });
  return <div style={{ transform: `scale(${0.94 + 0.06 * t})`, opacity: t, width: "100%" }}>{children}</div>;
};

const Stage: React.FC<{ format: Format; enter?: boolean; children: React.ReactNode }> = ({ format, enter = true, children }) => (
  <div
    style={{
      position: "absolute",
      top: format.safe.top,
      left: format.safe.left,
      right: format.safe.right,
      bottom: format.safe.bottom + SUBTITLE_RESERVE[format.id],
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    }}
  >
    {enter ? <Enter>{children}</Enter> : <div style={{ width: "100%" }}>{children}</div>}
  </div>
);

/** Colours of a card's texts: the style's own ink (styles/kit.ts), or the cards' usual colours. */
const useInk = () => {
  const kit = KITS[useContext(StyleContext)];
  return kit?.ink ?? { text: COLOR.text, muted: COLOR.muted, accent: COLOR.accent, highlight: COLOR.accent };
};

/** A framed panel for quotations: verses and hadiths. */
const Panel: React.FC<{ kind: PanelKind; format: Format; children: React.ReactNode }> = ({ kind, format, children }) => {
  // Paper style: the same layout on a sheet of dark paper, lit on its top edge (docs/styles.md).
  // A style built as a kit frames the same layout its own way (slate, gold).
  const style = useContext(StyleContext);
  const kit = KITS[style];
  if (kit) return <kit.Panel kind={kind} format={format}>{children}</kit.Panel>;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 30,
        padding: "48px 44px",
        borderRadius: 32,
        background: COLOR.panel,
        border: `2px solid ${COLOR.panelBorder}`,
        ...(style === "paper" ? PAPER_SHEET : {}),
      }}
    >
      {children}
    </div>
  );
};

/** Long texts get a smaller size. */
const fitSize = (base: number, text: string, comfortable: number) =>
  Math.round(base * Math.min(1, Math.sqrt(comfortable / Math.max(1, text.length))));

const arabicStyle = (family: string, size: number, weight = 400, lineHeight = 1.8): React.CSSProperties => ({
  fontFamily: family,
  fontSize: size,
  fontWeight: weight,
  lineHeight,
  color: COLOR.text,
  textWrap: "balance",
});

const Reference: React.FC<{ lines: (string | null)[] }> = ({ lines }) => {
  const ink = useInk();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
      {lines.filter(Boolean).map((line, i) => (
        <div
          key={i}
          dir="auto"
          style={{
            fontFamily: `"${FONT.latin}", "${FONT.arabic}"`,
            fontSize: i === 0 ? 34 : 26,
            color: i === 0 ? ink.accent : ink.muted,
            letterSpacing: i === 0 ? 1 : 0.5,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

/** A phrase appears this long before the voice says it, and takes REVEAL_FRAMES to come in. */
const REVEAL_LEAD = 0.1;
const REVEAL_FRAMES = 8;

/** The phrases shown on a title card, each with the time the take says it: the take's phrases are
 * those of the line (or of its say_ar, same words), so they pair one to one. */
const titlePhrases = (scene: ResolvedScene): PhraseTiming[] | null => {
  const timed = scene.media?.phrases ?? [];
  const shown = splitPhrases(scene.narration?.ar ?? "");
  return timed.length > 1 && timed.length === shown.length
    ? shown.map((text, i) => ({ text, start: timed[i].start }))
    : null;
};

/** The line said by the voice, one phrase per line: the first is on the card from the start, the
 * others are written as the voice reaches them (the answer revealed in rhythm, reference video). */
export const TitleCard: React.FC<CardProps> = ({ scene, format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioStart = useContext(AudioStart);
  if (!scene.narration) return null;
  const look = useContext(StyleContext);
  const kit = KITS[look];
  if (kit) {
    // A style built as a kit writes the line in its own hand; each phrase comes when the voice reaches it.
    const timed = titlePhrases(scene);
    const list: TitlePhrase[] = timed
      ? timed.map((p, i) => ({ text: p.text, at: i === 0 ? 0 : Math.max(0, audioStart + Math.round((p.start - REVEAL_LEAD) * fps)) }))
      : [{ text: scene.narration.ar, at: 0 }];
    return (
      <Stage format={format} enter={false}>
        <kit.Title scene={scene} format={format} phrases={list} />
      </Stage>
    );
  }
  const style = arabicStyle(FONT.arabic, fitSize(88, scene.narration.ar, 50), 700, 1.6);
  // Paper style: the letters cut in a strip of dark paper, the light coming through them.
  const paper: React.CSSProperties =
    look === "paper"
      ? { ...PAPER_SHEET, padding: "36px 40px", color: "#ffe9bf", textShadow: "0 0 18px rgba(255, 214, 140, 0.55)" }
      : {};
  const phrases = titlePhrases(scene);
  return (
    <Stage format={format}>
      <div dir="rtl" lang="ar" style={{ ...style, ...paper }}>
        {phrases
          ? phrases.map((phrase, i) => {
              const at = audioStart + Math.round((phrase.start - REVEAL_LEAD) * fps);
              const t =
                i === 0 || frame >= at + REVEAL_FRAMES
                  ? 1
                  : frame < at
                    ? 0
                    : spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: REVEAL_FRAMES });
              return (
                <div key={i} style={{ opacity: t, transform: `translateY(${(1 - t) * 18}px)` }}>
                  {phrase.text}
                </div>
              );
            })
          : scene.narration.ar}
      </div>
    </Stage>
  );
};

/** Word being recited at time t (seconds from the start of the scene), if any. */
const currentWord = (words: WordTiming[], t: number) => words.find((w) => t >= w.start && t < w.end)?.position;

export const AyahCard: React.FC<CardProps> = ({ scene, format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioStart = useContext(AudioStart);
  const source = scene.source;
  if (!source) return null;
  const words = scene.visual.highlight === "words" ? scene.media?.words ?? [] : [];
  const active = currentWord(words, (frame - audioStart) / fps);
  const ink = useInk();
  // Positions count real words only: waqf signs (ۚ ۖ) and ۞ are shown but never highlighted.
  let position = 0;
  const tokens = source.display_ar.split(/\s+/).map((token) => ({
    token,
    position: hasLetter(token) ? ++position : null,
  }));
  return (
    <Stage format={format}>
      <Panel kind="ayah" format={format}>
        <div dir="rtl" lang="ar" style={arabicStyle(FONT.quran, fitSize(format.id === "reel" ? 72 : 66, source.display_ar, 110), 400, 2.1)}>
          {tokens.map(({ token, position: p }, i) => (
            <Fragment key={i}>
              {i > 0 ? " " : null}
              <span style={{ color: p !== null && p === active ? ink.highlight : ink.text }}>{token}</span>
            </Fragment>
          ))}
        </div>
        <Reference lines={[source.reference, scene.media?.credit ?? null]} />
      </Panel>
    </Stage>
  );
};

/** A hadith's words split at its inner quotation marks: the Prophet's words, and what was said in
 * between (a question by the Companions, Muslim 2735c), without stray punctuation. */
const hadithParts = (text: string) =>
  text
    .split('"')
    .map((part) => part.replace(/^[\s.،:؛]+|[\s.،:؛]+$/g, ""))
    .map((part, i) => ({ part, prophet: i % 2 === 0 }))
    .filter(({ part }) => hasLetter(part));

export const SourceCard: React.FC<CardProps> = ({ scene, format }) => {
  const source = scene.source;
  if (!source) return null;
  const parts = source.type === "hadith" ? hadithParts(source.display_ar) : [{ part: source.display_ar, prophet: true }];
  const size = fitSize(format.id === "reel" ? 76 : 68, source.display_ar, 60);
  const ink = useInk();
  return (
    <Stage format={format}>
      <Panel kind="hadith" format={format}>
        {parts.map(({ part, prophet }, i) => (
          <div
            key={i}
            dir="rtl"
            lang="ar"
            style={{
              ...arabicStyle(FONT.arabic, prophet ? size : Math.round(size * 0.7), prophet ? 700 : 400),
              color: prophet ? ink.text : ink.muted,
            }}
          >
            {prophet ? `«${part}»` : part}
          </div>
        ))}
        <Reference lines={[source.reference, source.grade_note, scene.media?.credit ?? null]} />
      </Panel>
    </Stage>
  );
};

export const NameCard: React.FC<CardProps> = ({ scene, format }) => {
  const ink = useInk();
  return (
    <Stage format={format}>
      <Panel kind="name" format={format}>
        <div dir="rtl" lang="ar" style={{ ...arabicStyle(FONT.arabic, 96, 700), color: ink.text }}>
          {scene.mentions.join(" · ")}
        </div>
      </Panel>
    </Stage>
  );
};

const BUST_ZOOM = 3;

/** The "scene" template: a background of the catalog and the scene's characters standing (or
 * sitting) on its floor, with a slow push-in. */
export const SceneCard: React.FC<CardProps> = (props) => {
  const style = useContext(StyleContext);
  const kit = KITS[style];
  if (kit) return <kit.Scene {...props} />;
  return style === "paper" ? <PaperScene {...props} /> : <FlatScene {...props} />;
};

const FlatScene: React.FC<CardProps> = ({ scene, format }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { floorY, scale } = STAGE[format.id];
  const id = scene.visual.background ?? "plain";
  const Background = BACKGROUNDS[id];
  if (!Background) throw new Error(`background '${id}' has no drawing in src/backgrounds/`);
  const chars = scene.visual.characters;
  const xs = chars.map((_, i) => (format.width * (i + 1)) / (chars.length + 1));
  const sitter = chars.findIndex((c) => c.kind === "sitting");
  const seatTop = sitter >= 0 ? floorY - placement(chars[sitter], xs[sitter], floorY, scale).seatHeight : null;
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.04]);
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 65%" }}>
      <Background width={format.width} height={format.height} floorY={floorY} seatTop={seatTop} />
      {chars.map((c, i) => {
        // A bust faces the camera: larger, and cut by the bottom of the frame rather than standing on the floor.
        const bust = c.kind === "bust";
        return (
          <CharacterView
            key={c.id}
            c={c}
            x={xs[i]}
            floorY={bust ? format.height + 20 : floorY}
            scale={bust ? scale * BUST_ZOOM : scale}
            audio={scene.media?.file ?? null}
          />
        );
      })}
    </AbsoluteFill>
  );
};
