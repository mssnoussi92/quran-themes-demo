// Data contract between scripts/prepare.ts (Node) and the compositions (browser).
// One JSON per episode in public/data/, generated from content/: never edited by hand.

export type I18n = { ar: string; en: string };

export type Template = "scene" | "ayah-card" | "source-card" | "name-card" | "title-card";

/** A catalog character resolved to its Open Peeps pieces (content/characters.yaml + characters/peeps.ts). */
export type Character = {
  id: string;
  pose: string;
  mood: string;
  talking: boolean;
  body: string;
  kind: "standing" | "sitting" | "bust";
  /** Extent of the figure [x, y, width, height] and, when sitting, the centre of its hips [x, y]. */
  box: [number, number, number, number];
  seat: [number, number] | null;
  hair: string;
  facial_hair: string;
  accessory: string;
  face: string;
  face_open: string;
};

export type ResolvedSource = {
  id: string;
  type: "ayah" | "hadith";
  status: "proposed" | "validated";
  /** As shown on the card: « سورة غافر · الآية ٦٠ », "Sahih al-Bukhari 6339" */
  reference: string;
  /** In English, for the publication texts: "Surah Ghafir (40:60)", "Sahih al-Bukhari 6339" */
  reference_en: string;
  /** Reading page (quran.com, sunnah.com), from the registry. */
  url: string | null;
  /** Texts exactly as in the registry. */
  text_ar: string;
  text_en: string;
  /** What a card shows: the whole verse, or only the Prophet's words for a hadith. */
  display_ar: string;
  /** English shown: the registry's `excerpt_en` (a passage of text_en), or the whole text. */
  display_en: string;
  /** "Al-Albani: Sahih" when the grade is not the collection itself (Bukhari, Muslim). */
  grade_note: string | null;
  translator: string | null;
  /** A person reading the hadith aloud (registry `recording`), heard instead of the synthetic voice. */
  recording: { reader: string; file: string; start: number; end: number; status: "proposed" | "validated" } | null;
};

/** One recited word: its position in the verse (1-based, waqf signs excluded), seconds in the file. */
export type WordTiming = { position: number; start: number; end: number };

/** A phrase of a narration line and when the voice starts it (seconds in the file). */
export type PhraseTiming = { text: string; start: number };

/** Audio of a scene, produced by tools/audio/build.py and copied to public/audio/. */
export type Media = {
  kind: "tts" | "recitation";
  /** Path under public/ (staticFile). */
  file: string;
  seconds: number;
  words: WordTiming[];
  /** Narration: its phrases (cut after « ، … . ؟ : ») with their start, read from the take. */
  phrases: PhraseTiming[];
  /** "Recitation: Mishari Rashid al-Afasy" under a verse. */
  credit: string | null;
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
  /** What the voice says (tts), or the recited verse. */
  spoken_ar: string | null;
  /** End of the narration said only in the reel on its own; the whole-episode videos cut it. */
  reel_only_end: I18n | null;
  media: Media | null;
  duration: Duration;
};

/** What the owner pastes when publishing a video (title, description; hashtags added to the
 * episode's), validated by the owner like the script (scripts/publish.ts writes the rest). */
export type PublishTexts = { title: I18n; description: I18n; hashtags?: string[]; validated_by?: string };

/** Layouts of the YouTube thumbnail (closed catalog, Thumbnail.tsx). */
export type ThumbnailLayout = "close-up" | "scene" | "title";

/** YouTube thumbnail of the whole 16:9 episode (1280x720), validated by the owner on the image. */
export type ThumbnailData = {
  layout: ThumbnailLayout;
  /** Big text: a few words of the validated title. */
  headline: I18n;
  /** Smaller line under the headline (the theme). */
  kicker: I18n | null;
  character: Character | null;
  background: string;
  validated_by: string | null;
};

export type EpisodeData = {
  episode: string;
  title: I18n;
  narration_language: string;
  /** The page's name (content/publish.yaml, "@quran_words_daily"), shown on every frame. */
  handle: string | null;
  /** The whole episode's texts, and the hashtags of all its videos. */
  publish: PublishTexts | null;
  thumbnail: ThumbnailData | null;
  reels: { id: string; title: I18n; validated_by?: string; publish?: PublishTexts }[];
  scenes: ResolvedScene[];
  generated_from: string[];
};
