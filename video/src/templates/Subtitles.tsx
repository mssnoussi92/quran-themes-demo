import { useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../fonts";
import type { Format } from "../formats";
import { COLOR } from "../theme";
import { splitPhrases } from "../phrases";
import type { ResolvedScene } from "../types";

// English subtitles. A long text (a verse's translation, a hadith) is cut into short chunks shown one
// after the other, in time with the audio: the narration over its own phrases, the hadith's words from
// the moment the voice reaches them, a verse's translation along the recited words. Chunks follow the
// sentences of the English text; a sentence longer than MAX_WORDS is cut at commas, or evenly.

const MAX_WORDS = 14;
const SENTENCE_END = /[.!?…;:]["”’)\]]*$/;
const OPENS_QUOTE = /^["“‘]/;

/** A good place to cut between two words: after a comma (not inside a quotation that just opened),
 * before a quotation, or before "and", "or", "but". */
const goodCut = (before: string, after: string) =>
  (/,["”’)\]]*$/.test(before) && !OPENS_QUOTE.test(before)) ||
  OPENS_QUOTE.test(after) ||
  /^(and|or|but)$/i.test(after);

/** A text cut into chunks of at most MAX_WORDS words (one-word chunks never stand alone). */
export function subtitleChunks(text: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences: string[][] = [];
  let current: string[] = [];
  for (const word of words) {
    current.push(word);
    if (SENTENCE_END.test(word) && current.length >= 3) {
      sentences.push(current);
      current = [];
    }
  }
  if (current.length) sentences.push(current);
  const pieces: string[][] = [];
  for (const sentence of sentences) {
    const parts = Math.ceil(sentence.length / MAX_WORDS);
    let start = 0;
    for (let p = 1; p < parts; p++) {
      const ideal = Math.round((sentence.length * p) / parts);
      // The good cut nearest to the ideal one, within 4 words; else the ideal cut.
      const ok = (i: number) => i > start && i < sentence.length && goodCut(sentence[i - 1], sentence[i]);
      let cut = ideal;
      for (let d = 0; d <= 4; d++) {
        if (ok(ideal - d)) { cut = ideal - d; break; }
        if (ok(ideal + d)) { cut = ideal + d; break; }
      }
      pieces.push(sentence.slice(start, cut));
      start = cut;
    }
    pieces.push(sentence.slice(start));
  }
  // Short sentences side by side share a chunk.
  const chunks: string[][] = [];
  for (const piece of pieces) {
    const last = chunks[chunks.length - 1];
    if (last && last.length + piece.length <= MAX_WORDS) last.push(...piece);
    else chunks.push([...piece]);
  }
  return chunks.map((c) => c.join(" "));
}

type Cue = { text: string; start: number };

/** Chunks of `text` spread over [from, to] seconds, each in proportion to its length. */
function spread(text: string, from: number, to: number): Cue[] {
  const chunks = subtitleChunks(text);
  const total = chunks.reduce((n, c) => n + c.length, 0) || 1;
  let done = 0;
  return chunks.map((chunk) => {
    const cue = { text: chunk, start: from + ((to - from) * done) / total };
    done += chunk.length;
    return cue;
  });
}

const quoted = (cues: Cue[]): Cue[] =>
  cues.map((cue, i) => ({
    ...cue,
    text: `${i === 0 ? "“" : ""}${cue.text}${i === cues.length - 1 ? "”" : ""}`,
  }));

/** What the subtitles say, and when (seconds from the start of the scene's audio). */
export function subtitleCues(scene: ResolvedScene): Cue[] {
  const { narration, source, media } = scene;
  const length = media?.seconds ?? scene.duration.seconds;
  if (scene.audio === "recitation") {
    if (!source) return [];
    const words = media?.words ?? [];
    if (words.length === 0) return spread(source.display_en, 0, length);
    // Each chunk starts with the recited word at the same fraction of the verse.
    const chunks = subtitleChunks(source.display_en);
    const total = chunks.reduce((n, c) => n + c.length, 0) || 1;
    let done = 0;
    return chunks.map((chunk) => {
      const word = words[Math.min(words.length - 1, Math.floor((words.length * done) / total))];
      const start = done === 0 ? 0 : word.start;
      done += chunk.length;
      return { text: chunk, start };
    });
  }
  if (scene.audio !== "tts") return [];
  const hadith = source?.type === "hadith" ? source.display_en : null;
  if (!hadith) return narration ? spread(narration.en, 0, length) : [];
  // The voice reads the introduction, then the hadith: the hadith starts with the phrase that follows
  // the introduction's own phrases (timed on the take), else in proportion to the Arabic text.
  const intro = narration?.ar ?? "";
  const phrases = media?.phrases ?? [];
  const k = splitPhrases(intro).length;
  const share = intro.length / Math.max(1, intro.length + source!.display_ar.length);
  const hadithStart = phrases.length > k && k > 0 ? phrases[k].start : length * share;
  return [
    ...(narration ? spread(narration.en, 0, hadithStart) : []),
    ...quoted(spread(hadith, hadithStart, length)),
  ];
}

export const Subtitles: React.FC<{ scene: ResolvedScene; format: Format }> = ({ scene, format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cues = subtitleCues(scene);
  const t = frame / fps;
  const cue = [...cues].reverse().find((c) => t >= c.start) ?? cues[0];
  if (!cue) return null;
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
        {cue.text}
      </div>
    </div>
  );
};
