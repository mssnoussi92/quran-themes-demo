// Provisional cards: they prove the data flow (registry texts, fonts, formats).
// The real visual templates (word highlighting, characters, backgrounds) are task 4.
import { FONT } from "../fonts";
import type { Format } from "../formats";
import { COLOR } from "../theme";
import type { ResolvedScene } from "../types";

type CardProps = { scene: ResolvedScene; format: Format };

/** Space left for the subtitles under the card, inside the safe area. */
const SUBTITLE_RESERVE = { reel: 330, episode: 220 };

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
      gap: 36,
      textAlign: "center",
    }}
  >
    {children}
  </div>
);

/** Long texts get a smaller size (rough rule until task 4 fits text to the box). */
const fitSize = (base: number, text: string, comfortable: number) =>
  Math.round(base * Math.min(1, Math.sqrt(comfortable / Math.max(1, text.length))));

const Arabic: React.FC<{ text: string; family: string; size: number; weight?: number; lineHeight?: number }> = ({
  text,
  family,
  size,
  weight = 400,
  lineHeight = 1.8,
}) => (
  <div
    dir="rtl"
    lang="ar"
    style={{ fontFamily: family, fontSize: size, fontWeight: weight, lineHeight, color: COLOR.text }}
  >
    {text}
  </div>
);

const Reference: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ fontFamily: FONT.latin, fontSize: 34, color: COLOR.accent, letterSpacing: 1 }}>{text}</div>
);

export const TitleCard: React.FC<CardProps> = ({ scene, format }) =>
  scene.narration ? (
    <Stage format={format}>
      <Arabic text={scene.narration.ar} family={FONT.arabic} size={fitSize(84, scene.narration.ar, 60)} weight={700} />
    </Stage>
  ) : null;

export const AyahCard: React.FC<CardProps> = ({ scene, format }) => {
  const source = scene.source;
  if (!source) return null;
  return (
    <Stage format={format}>
      <Arabic
        text={source.display_ar}
        family={FONT.quran}
        size={fitSize(format.id === "reel" ? 70 : 66, source.display_ar, 110)}
        lineHeight={2.1}
      />
      <Reference text={source.reference} />
    </Stage>
  );
};

export const SourceCard: React.FC<CardProps> = ({ scene, format }) => {
  const source = scene.source;
  if (!source) return null;
  return (
    <Stage format={format}>
      <Arabic text={source.display_ar} family={FONT.arabic} size={fitSize(62, source.display_ar, 120)} />
      <Reference text={source.reference} />
    </Stage>
  );
};

export const NameCard: React.FC<CardProps> = ({ scene, format }) => (
  <Stage format={format}>
    <Arabic text={scene.mentions.join(" · ")} family={FONT.arabic} size={96} weight={700} />
  </Stage>
);

/** Placeholder for the "scene" template: names the background and the characters, draws nothing. */
export const SceneCard: React.FC<CardProps> = ({ scene, format }) => (
  <Stage format={format}>
    <div
      style={{
        width: "100%",
        flex: 1,
        border: `3px dashed ${COLOR.muted}`,
        borderRadius: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        fontFamily: FONT.latin,
        color: COLOR.muted,
        fontSize: 36,
      }}
    >
      <div>background: {scene.visual.background ?? "none"}</div>
      {scene.visual.characters.map((c) => (
        <div key={c.id} style={{ color: COLOR.text, fontSize: 44 }}>
          {c.id} · {c.pose} · {c.mood}
        </div>
      ))}
      <div style={{ fontSize: 28 }}>placeholder: character kit and backgrounds come with tasks 4-5</div>
    </div>
  </Stage>
);
