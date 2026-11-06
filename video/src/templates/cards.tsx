// Cards (task 4): title, verse with the recited word highlighted, hadith, name; and the "scene"
// template with its background and characters (task 5).
import { Fragment } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BACKGROUNDS } from "../backgrounds/Backgrounds";
import { CharacterView, placement } from "../characters/Character";
import { FONT } from "../fonts";
import type { Format } from "../formats";
import { COLOR } from "../theme";
import type { ResolvedScene, WordTiming } from "../types";

type CardProps = { scene: ResolvedScene; format: Format };

/** Space left for the subtitles under the card, inside the safe area. */
const SUBTITLE_RESERVE = { reel: 330, episode: 220 };

const hasLetter = (token: string) => /\p{L}/u.test(token);

/** The card enters with a short spring (scale and opacity). */
const Enter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 });
  return <div style={{ transform: `scale(${0.94 + 0.06 * t})`, opacity: t, width: "100%" }}>{children}</div>;
};

const Stage: React.FC<{ format: Format; children: React.ReactNode }> = ({ format, children }) => (
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
    <Enter>{children}</Enter>
  </div>
);

/** A framed panel for quotations: verses and hadiths. */
const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
    }}
  >
    {children}
  </div>
);

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

const Reference: React.FC<{ lines: (string | null)[] }> = ({ lines }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
    {lines.filter(Boolean).map((line, i) => (
      <div
        key={i}
        dir="auto"
        style={{
          fontFamily: `"${FONT.latin}", "${FONT.arabic}"`,
          fontSize: i === 0 ? 34 : 26,
          color: i === 0 ? COLOR.accent : COLOR.muted,
          letterSpacing: i === 0 ? 1 : 0.5,
        }}
      >
        {line}
      </div>
    ))}
  </div>
);

export const TitleCard: React.FC<CardProps> = ({ scene, format }) =>
  scene.narration ? (
    <Stage format={format}>
      <div dir="rtl" lang="ar" style={arabicStyle(FONT.arabic, fitSize(88, scene.narration.ar, 50), 700, 1.6)}>
        {scene.narration.ar}
      </div>
    </Stage>
  ) : null;

/** Word being recited at time t (seconds from the start of the scene), if any. */
const currentWord = (words: WordTiming[], t: number) => words.find((w) => t >= w.start && t < w.end)?.position;

export const AyahCard: React.FC<CardProps> = ({ scene, format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const source = scene.source;
  if (!source) return null;
  const words = scene.visual.highlight === "words" ? scene.media?.words ?? [] : [];
  const active = currentWord(words, frame / fps);
  // Positions count real words only: waqf signs (ۚ ۖ) and ۞ are shown but never highlighted.
  let position = 0;
  const tokens = source.display_ar.split(/\s+/).map((token) => ({
    token,
    position: hasLetter(token) ? ++position : null,
  }));
  return (
    <Stage format={format}>
      <Panel>
        <div dir="rtl" lang="ar" style={arabicStyle(FONT.quran, fitSize(format.id === "reel" ? 72 : 66, source.display_ar, 110), 400, 2.1)}>
          {tokens.map(({ token, position: p }, i) => (
            <Fragment key={i}>
              {i > 0 ? " " : null}
              <span style={{ color: p !== null && p === active ? COLOR.accent : COLOR.text }}>{token}</span>
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
  return (
    <Stage format={format}>
      <Panel>
        {parts.map(({ part, prophet }, i) => (
          <div
            key={i}
            dir="rtl"
            lang="ar"
            style={{
              ...arabicStyle(FONT.arabic, prophet ? size : Math.round(size * 0.7), prophet ? 700 : 400),
              color: prophet ? COLOR.text : COLOR.muted,
            }}
          >
            {prophet ? `«${part}»` : part}
          </div>
        ))}
        <Reference lines={[source.reference, source.grade_note]} />
      </Panel>
    </Stage>
  );
};

export const NameCard: React.FC<CardProps> = ({ scene, format }) => (
  <Stage format={format}>
    <Panel>
      <div dir="rtl" lang="ar" style={arabicStyle(FONT.arabic, 96, 700)}>
        {scene.mentions.join(" · ")}
      </div>
    </Panel>
  </Stage>
);

/** Where the floor is and how big the figures are, per format (Open Peeps units -> pixels).
 * Reel: a standing figure (2931 units) reaches y = 276, just under the top safe area (250). */
const STAGE = {
  reel: { floorY: 1360, scale: 0.375 },
  episode: { floorY: 880, scale: 0.235 },
};
const BUST_ZOOM = 3;

/** The "scene" template: a background of the catalog and the scene's characters standing (or
 * sitting) on its floor, with a slow push-in. */
export const SceneCard: React.FC<CardProps> = ({ scene, format }) => {
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
