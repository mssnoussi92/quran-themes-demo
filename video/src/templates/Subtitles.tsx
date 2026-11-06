import { FONT } from "../fonts";
import type { Format } from "../formats";
import { COLOR } from "../theme";
import type { ResolvedScene } from "../types";

/** English line of a scene: the narration, or the quoted source's translation. */
export const subtitleText = (scene: ResolvedScene): string | null =>
  scene.audio === "tts" ? scene.narration?.en ?? null : scene.source?.text_en ?? null;

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
          fontFamily: FONT.latin,
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
