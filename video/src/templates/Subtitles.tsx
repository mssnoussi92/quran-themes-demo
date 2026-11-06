import { FONT } from "../fonts";
import type { Format } from "../formats";
import { COLOR } from "../theme";
import type { ResolvedScene } from "../types";

/** English line of a scene: the narration (then the hadith it introduces), or the verse's translation. */
export const subtitleText = (scene: ResolvedScene): string | null => {
  const { narration, source } = scene;
  if (scene.audio === "recitation") return source?.display_en ?? null;
  if (scene.audio !== "tts") return null;
  const quote = source?.type === "hadith" ? `\u201c${source.display_en}\u201d` : null;
  return [narration?.en, quote].filter(Boolean).join(" ") || null;
};

// Provisional: the whole text at once. Task 4 times it with the audio.
export const Subtitles: React.FC<{ scene: ResolvedScene; format: Format }> = ({ scene, format }) => {
  const text = subtitleText(scene);
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: format.safe.left,
        right: format.safe.right,
        bottom: format.safe.bottom,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        lang="en"
        style={{
          // Amiri as fallback for the Arabic signs Lora lacks (ﷺ).
          fontFamily: `"${FONT.latin}", "${FONT.arabic}"`,
          textWrap: "balance",
          fontSize: format.id === "reel" ? 40 : 38,
          lineHeight: 1.35,
          color: COLOR.text,
          background: COLOR.subtitleBox,
          padding: "14px 24px",
          borderRadius: 14,
          textAlign: "center",
          maxWidth: format.id === "reel" ? "100%" : "80%",
        }}
      >
        {text}
      </div>
    </div>
  );
};
