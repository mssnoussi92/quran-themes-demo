// Fonts shipped in public/fonts/ (SIL Open Font License, see the OFL-*.txt files next to them).
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const FONT = {
  /** Quran text (Uthmani, Hafs). */
  quran: "Amiri Quran",
  /** Narration and hadith texts in Arabic. */
  arabic: "Amiri",
  /** English: translations, subtitles, references. */
  latin: "Lora",
} as const;

const FILES = [
  { family: FONT.quran, file: "AmiriQuran-Regular.ttf", weight: "400" },
  { family: FONT.arabic, file: "Amiri-Regular.ttf", weight: "400" },
  { family: FONT.arabic, file: "Amiri-Bold.ttf", weight: "700" },
  { family: FONT.latin, file: "Lora.ttf", weight: "400" },
];

let loading: Promise<void[]> | null = null;

/** Loads every font once; the render waits for them (delayRender inside loadFont). */
export const loadFonts = () => {
  loading ??= Promise.all(
    FILES.map(({ family, file, weight }) => loadFont({ family, url: staticFile(`fonts/${file}`), weight })),
  );
  return loading;
};
