// Data contract between scripts/prepare.ts (Node) and the compositions (browser).
// One JSON per episode in public/data/, generated from content/: never edited by hand.

export type I18n = { ar: string; en: string };

export type Template = "scene" | "ayah-card" | "source-card" | "name-card" | "title-card";

export type Character = { id: string; pose: string; mood: string; talking?: boolean };

export type ResolvedSource = {
  id: string;
  type: "ayah" | "hadith";
  status: "proposed" | "validated";
  /** "Quran 40:60", "Sahih al-Bukhari 6339" */
  reference: string;
  /** Texts exactly as in the registry. */
  text_ar: string;
  text_en: string;
  /** What a card shows: the whole verse, or only the Prophet's words for a hadith. */
  display_ar: string;
  translator: string | null;
};

export type Duration = {
  seconds: number;
  /** true while the audio does not exist yet: the length is estimated from the text. */
  provisional: boolean;
  basis: string;
};

export type ResolvedScene = {
  id: string;
  role: string;
  reel: string | null;
  audio: "tts" | "recitation" | "none";
  narration: I18n | null;
  mentions: string[];
  visual: {
    template: Template;
    background: string | null;
    icon: string | null;
    highlight: "words" | "none";
    characters: Character[];
  };
  source: ResolvedSource | null;
  duration: Duration;
};

export type EpisodeData = {
  episode: string;
  title: I18n;
  narration_language: string;
  reels: { id: string; title: I18n }[];
  scenes: ResolvedScene[];
  generated_from: string[];
};
