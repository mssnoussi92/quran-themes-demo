// content/ -> public/data/<episode>.json, the only data the compositions read.
//
// Resolves each scene's source id against the registry (content/sources/*.yaml): texts are
// copied from there, never typed. Fails on an unknown or excluded source. When
// tools/audio/build.py has produced the episode's audio (build/audio/<episode>/manifest.json),
// each scene lasts as long as its audio, copied to public/audio/; otherwise the length is
// estimated from the text and flagged `provisional`.
//
// Usage (from video/): node scripts/prepare.ts            (Node >= 22.18 runs TypeScript as is)

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { createRequire } from "node:module";
import { parse } from "yaml";
import { BODY_BOX, MOOD_FACES, SEAT } from "../src/characters/peeps.ts";
import type { Character, Duration, EpisodeData, Media, ResolvedScene, ResolvedSource } from "../src/types.ts";

// react-peeps exports one table per kind of piece (Hair, Face, StandingPose...): names are checked there.
const peeps = createRequire(import.meta.url)("react-peeps") as Record<string, Record<string, unknown>>;

const ROOT = resolve(import.meta.dirname, "../..");
const CONTENT = join(ROOT, "content");
const OUT = join(ROOT, "video", "public", "data");
const PUBLIC = join(ROOT, "video", "public");
const AUDIO = join(ROOT, "build", "audio");

// Reciters of content/policy.yaml, as credited on screen.
const RECITERS: Record<string, string> = { alafasy: "Mishari Rashid al-Afasy" };

// Silence after each line, before the transition (Video.tsx adds the transition, during which nobody
// speaks): with the silence kept around each synthetic line (tools/audio/build.py), the gap between
// two sentences is the transition plus ~0.14 s. A short breath more after a verse.
// The shortest scene: a one-word question (« ليه؟ ») is also on screen during the transitions before
// and after it, so a short minimum is enough to read it without leaving a blank in the voice.
const TAIL = { tts: 0, recitation: 0.1 };
const MIN_SCENE = 0.5;

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
  excerpt_en?: string;
  status: "proposed" | "validated" | "excluded";
  grade?: string;
  graded_by?: string;
  origin?: { translator?: string; surah_ar?: string; surah_en?: string };
};

type ManifestScene = {
  kind: "tts" | "recitation";
  file: string;
  seconds: number;
  text?: string;
  source?: string;
  reciter?: string;
  words?: Media["words"];
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
      characters?: { id: string; pose: string; mood: string; talking?: boolean }[];
    };
  }[];
};

type CatalogCharacter = {
  look: { hair: string; facial_hair: string; accessory: string };
  poses: Record<string, string>;
  moods: string[];
};

/** A scene's character, resolved to its Open Peeps pieces; any unknown name is an error. */
function resolveCharacter(c: { id: string; pose: string; mood: string; talking?: boolean },
                          catalog: Record<string, CatalogCharacter>, where: string): Character {
  const fail = (msg: string): never => {
    throw new Error(`${where}: character ${c.id}: ${msg}`);
  };
  const spec = catalog[c.id] ?? fail("not in content/characters.yaml");
  const body = spec.poses[c.pose] ?? fail(`pose '${c.pose}' not in the catalog`);
  if (!spec.moods.includes(c.mood)) fail(`mood '${c.mood}' not in the catalog`);
  const faces = MOOD_FACES[c.mood] ?? fail(`mood '${c.mood}' has no face in characters/peeps.ts`);
  const kind = body in peeps.StandingPose ? "standing" : body in peeps.SittingPose ? "sitting"
    : body in peeps.BustPose ? "bust" : fail(`'${body}' is not an Open Peeps body`);
  const box = BODY_BOX[body] ?? fail(`body '${body}' has no measured box in characters/peeps.ts`);
  const seat = kind === "sitting" ? SEAT[body] ?? fail(`sitting body '${body}' has no seat in characters/peeps.ts`) : null;
  const { hair, facial_hair, accessory } = spec.look;
  if (!(hair in peeps.Hair)) fail(`hair '${hair}' is not an Open Peeps piece`);
  if (!(facial_hair in peeps.FacialHair)) fail(`facial hair '${facial_hair}' is not an Open Peeps piece`);
  if (!(accessory in peeps.Accessories)) fail(`accessory '${accessory}' is not an Open Peeps piece`);
  for (const f of [faces.closed, faces.open]) if (!(f in peeps.Face)) fail(`face '${f}' is not an Open Peeps piece`);
  return { id: c.id, pose: c.pose, mood: c.mood, talking: c.talking ?? false, body, kind, box, seat,
           hair, facial_hair, accessory, face: faces.closed, face_open: faces.open };
}

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
    // The surah by its name (from quran.com, in the registry), not its number: « سورة غافر · الآية ٦٠ ».
    const ayah = new Intl.NumberFormat("ar-EG").format(ref.ayah ?? 0);
    reference = entry.origin?.surah_ar
      ? `سورة ${entry.origin.surah_ar} · الآية ${ayah}`
      : `Quran ${ref.surah}:${ref.ayah}`;
    display_ar = entry.text_ar;
  } else if (entry.type === "hadith") {
    type = "hadith";
    const name = COLLECTIONS[ref.collection ?? ""];
    if (!name) throw new Error(`${where}: no display name for collection '${ref.collection}'`);
    const letter = ref.narration ? String.fromCharCode(96 + ref.narration) : "";
    reference = `${name} ${ref.number}${letter}`;
    display_ar = prophetWords(entry.text_ar, entry.id);
    // English: the quotation marks do not reliably surround the Prophet's words in the published
    // translations, so the subtitle is the registry's `excerpt_en` (a checked passage) or the whole text.
    display_en = entry.excerpt_en ?? entry.text_en;
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
    grade_note:
      entry.graded_by && !Object.values(COLLECTIONS).includes(entry.graded_by) && entry.grade
        ? `${entry.graded_by}: ${entry.grade.charAt(0).toUpperCase()}${entry.grade.slice(1)}`
        : null,
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

/** The scene's audio from tools/audio/build.py, if it matches what the scene says now. */
function mediaFor(episode: string, manifest: Record<string, ManifestScene> | null, sceneId: string,
                  spoken: string | null, source: ResolvedSource | null, where: string): Media | null {
  const entry = manifest?.[sceneId];
  if (!entry) return null;
  const current = entry.kind === "tts" ? entry.text === spoken : entry.source === source?.id;
  if (!current) {
    console.warn(`warning ${where}: audio is out of date (run tools/audio/build.py --episode ${episode})`);
    return null;
  }
  const file = `audio/${episode}/${entry.file}`;
  mkdirSync(join(PUBLIC, "audio", episode), { recursive: true });
  copyFileSync(join(AUDIO, episode, entry.file), join(PUBLIC, file));
  const reciter = entry.reciter ? RECITERS[entry.reciter] ?? entry.reciter : null;
  return {
    kind: entry.kind,
    file,
    seconds: entry.seconds,
    words: entry.words ?? [],
    credit: entry.kind === "recitation" && reciter ? `Recitation: ${reciter}` : null,
  };
}

function main() {
  const registry = new Map<string, RegistryEntry>();
  const sourceFiles = yamlFiles(join(CONTENT, "sources"));
  for (const file of sourceFiles) {
    for (const entry of load<RegistryEntry[]>(file) ?? []) registry.set(entry.id, entry);
  }

  const catalog = (load<{ characters: Record<string, CatalogCharacter> }>(join(CONTENT, "characters.yaml"))).characters;
  const backgrounds = Object.keys(load<{ backgrounds: Record<string, unknown> }>(join(CONTENT, "backgrounds.yaml")).backgrounds);

  mkdirSync(OUT, { recursive: true });

  // Every character of the catalog in every pose and mood, for the CharacterSheet still.
  const sheet = Object.entries(catalog).map(([id, spec]) => ({
    id,
    poses: Object.keys(spec.poses).map((pose) =>
      spec.moods.map((mood) => resolveCharacter({ id, pose, mood }, catalog, "content/characters.yaml")),
    ),
  }));
  writeFileSync(join(OUT, "characters.json"), JSON.stringify(sheet, null, 2) + "\n");
  for (const file of yamlFiles(join(CONTENT, "episodes"))) {
    const ep = load<EpisodeFile>(file);
    const manifestPath = join(AUDIO, ep.episode, "manifest.json");
    const manifest = existsSync(manifestPath)
      ? (JSON.parse(readFileSync(manifestPath, "utf8")) as { scenes: Record<string, ManifestScene> }).scenes
      : null;
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
      if (s.visual.background && !backgrounds.includes(s.visual.background)) {
        throw new Error(`${where}: background '${s.visual.background}' is not in content/backgrounds.yaml`);
      }
      const media = s.audio === "none" ? null : mediaFor(ep.episode, manifest, s.id, spoken, source, where);
      const duration: Duration = media
        ? {
            seconds: Math.max(MIN_SCENE, Math.round((media.seconds + TAIL[media.kind]) * 100) / 100),
            provisional: false,
            basis: `audio: ${media.file} (${media.seconds} s) + ${TAIL[media.kind]} s`,
          }
        : estimate(s.audio, spoken);
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
          characters: (s.visual.characters ?? []).map((c) => resolveCharacter(c, catalog, where)),
        },
        source,
        spoken_ar: spoken,
        media,
        duration,
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
    const estimated = scenes.filter((s) => s.duration.provisional).length;
    const how = estimated ? `${estimated} scene(s) estimated` : "real audio";
    console.log(`${relative(ROOT, out)}: ${scenes.length} scenes, ${total.toFixed(1)} s (${how})`);
  }
}

main();
