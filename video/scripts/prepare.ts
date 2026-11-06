// content/ -> public/data/<episode>.json, the only data the compositions read.
//
// Resolves each scene's source id against the registry (content/sources/*.yaml): texts are
// copied from there, never typed. Fails on an unknown or excluded source. Scene durations are
// estimated from the text until the audio exists (tasks 4-5), and flagged `provisional`.
//
// Usage (from video/): node scripts/prepare.ts            (Node >= 22.18 runs TypeScript as is)

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parse } from "yaml";
import type { Duration, EpisodeData, ResolvedScene, ResolvedSource } from "../src/types.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const CONTENT = join(ROOT, "content");
const OUT = join(ROOT, "video", "public", "data");

// Display names of the hadith collections allowed by content/policy.yaml (metadata, not quotations).
const COLLECTIONS: Record<string, string> = {
  bukhari: "Sahih al-Bukhari",
  muslim: "Sahih Muslim",
  tirmidhi: "Jami' at-Tirmidhi",
};

// Provisional pacing, replaced by the real audio length once narration and recitation exist.
const PACE = {
  tts: { wordsPerSecond: 2.0, padding: 0.8 },        // calm synthetic narration
  recitation: { wordsPerSecond: 1.2, padding: 1.0 }, // murattal recitation
  none: 3,
  minimum: 2,
};

type RegistryEntry = {
  id: string;
  type: string;
  ref: { surah?: number; ayah?: number; collection?: string; number?: number; narration?: number };
  text_ar: string | null;
  text_en: string | null;
  status: "proposed" | "validated" | "excluded";
  origin?: { translator?: string };
};

type EpisodeFile = {
  episode: string;
  title: { ar: string; en: string };
  narration_language: string;
  reels: { id: string; title: { ar: string; en: string } }[];
  scenes: {
    id: string;
    role: string;
    reel?: string;
    audio: "tts" | "recitation" | "none";
    narration?: { ar: string; en: string };
    source?: string;
    mentions?: string[];
    visual: {
      template: ResolvedScene["visual"]["template"];
      background?: string;
      icon?: string;
      highlight?: "words" | "none";
      characters?: ResolvedScene["visual"]["characters"];
    };
  }[];
};

const yamlFiles = (dir: string) =>
  readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort().map((f) => join(dir, f));

const load = <T>(path: string): T => parse(readFileSync(path, "utf8")) as T;

/** Words that are pronounced: tokens with at least one letter (waqf signs such as ۚ do not count). */
const countWords = (text: string) => text.split(/\s+/).filter((t) => /[\p{L}]/u.test(t)).length;

/** Text between the first and the last quotation mark, or null when there is no such pair.
 * Invisible RLM marks (U+200F) and extra spaces are removed. */
function betweenQuotes(text: string): string | null {
  const first = text.indexOf('"');
  const last = text.lastIndexOf('"');
  if (first < 0 || last <= first) return null;
  return text.slice(first + 1, last).replace(/\u200f/g, "").replace(/\s+/g, " ").trim();
}

/** The Prophet's words in a hadith: from the first to the last quotation mark of the Arabic text
 * (owner's decision, 2026-11-06). Drops the chain of narrators and any commentary after. A question
 * asked between two answers stays (Muslim 2735c). */
function prophetWords(textAr: string, id: string): string {
  const words = betweenQuotes(textAr);
  if (!words) throw new Error(`${id}: no quotation marks in text_ar, cannot isolate the Prophet's words`);
  return words;
}

function resolveSource(entry: RegistryEntry, where: string): ResolvedSource {
  if (entry.status === "excluded") throw new Error(`${where}: source ${entry.id} is excluded`);
  if (!entry.text_ar || !entry.text_en) {
    throw new Error(`${where}: source ${entry.id} has no text (run tools/sources/fetch.py)`);
  }
  if (entry.status !== "validated") console.warn(`warning ${where}: source ${entry.id} is not validated`);
  const { ref } = entry;
  let type: ResolvedSource["type"];
  let reference: string;
  let display_ar: string;
  let display_en = entry.text_en;
  if (entry.type === "ayah") {
    type = "ayah";
    reference = `Quran ${ref.surah}:${ref.ayah}`;
    display_ar = entry.text_ar;
  } else if (entry.type === "hadith") {
    type = "hadith";
    const name = COLLECTIONS[ref.collection ?? ""];
    if (!name) throw new Error(`${where}: no display name for collection '${ref.collection}'`);
    const letter = ref.narration ? String.fromCharCode(96 + ref.narration) : "";
    reference = `${name} ${ref.number}${letter}`;
    display_ar = prophetWords(entry.text_ar, entry.id);
    display_en = betweenQuotes(entry.text_en) ?? entry.text_en;
  } else {
    throw new Error(`${where}: source type '${entry.type}' cannot be shown yet`);
  }
  return {
    id: entry.id,
    type,
    status: entry.status,
    reference,
    text_ar: entry.text_ar,
    text_en: entry.text_en,
    display_ar,
    display_en,
    translator: entry.origin?.translator ?? null,
  };
}

function estimate(audio: ResolvedScene["audio"], text: string | null): Duration {
  if (audio === "none" || !text) {
    return { seconds: PACE.none, provisional: true, basis: "no audio: fixed length" };
  }
  const pace = PACE[audio];
  const words = countWords(text);
  const seconds = Math.max(PACE.minimum, Math.round((words / pace.wordsPerSecond + pace.padding) * 10) / 10);
  return {
    seconds,
    provisional: true,
    basis: `estimate: ${words} words at ${pace.wordsPerSecond} words/s + ${pace.padding} s`,
  };
}

function main() {
  const registry = new Map<string, RegistryEntry>();
  const sourceFiles = yamlFiles(join(CONTENT, "sources"));
  for (const file of sourceFiles) {
    for (const entry of load<RegistryEntry[]>(file) ?? []) registry.set(entry.id, entry);
  }

  mkdirSync(OUT, { recursive: true });
  for (const file of yamlFiles(join(CONTENT, "episodes"))) {
    const ep = load<EpisodeFile>(file);
    const scenes: ResolvedScene[] = ep.scenes.map((s) => {
      const where = `${relative(ROOT, file)} [${s.id}]`;
      let source: ResolvedSource | null = null;
      if (s.source) {
        const entry = registry.get(s.source);
        if (!entry) throw new Error(`${where}: source ${s.source} is not in content/sources/`);
        source = resolveSource(entry, where);
      }
      // What is heard: the recitation of the verse, or the narration followed by the hadith's words
      // when the scene quotes one (the narration introduces it, the registry supplies it).
      const quoted = source?.type === "hadith" ? source.display_ar : null;
      const spoken =
        s.audio === "recitation"
          ? source?.text_ar ?? null
          : [s.narration?.ar, quoted].filter(Boolean).join(" ") || null;
      return {
        id: s.id,
        role: s.role,
        reel: s.reel ?? null,
        audio: s.audio,
        narration: s.narration ?? null,
        mentions: s.mentions ?? [],
        visual: {
          template: s.visual.template,
          background: s.visual.background ?? null,
          icon: s.visual.icon ?? null,
          highlight: s.visual.highlight ?? "none",
          characters: s.visual.characters ?? [],
        },
        source,
        duration: estimate(s.audio, spoken),
      };
    });
    const data: EpisodeData = {
      episode: ep.episode,
      title: ep.title,
      narration_language: ep.narration_language,
      reels: ep.reels,
      scenes,
      generated_from: [file, ...sourceFiles].map((f) => relative(ROOT, f)),
    };
    const out = join(OUT, `${ep.episode}.json`);
    writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
    const total = scenes.reduce((n, s) => n + s.duration.seconds, 0);
    console.log(`${relative(ROOT, out)}: ${scenes.length} scenes, ${total.toFixed(1)} s (provisional)`);
  }
}

main();
