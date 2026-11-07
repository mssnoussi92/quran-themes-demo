// public/data/<episode>.json + content/publish.yaml -> what the owner pastes when publishing each
// video by hand: title, description and hashtags per platform, as Markdown (the notes of the
// render's pre-release, one copyable block per platform).
//
// Only the title, the description and the theme's hashtags are written by hand (the episode's and
// each reel's `publish`, validated by the owner). Everything else comes from the data: the sources
// quoted with their grade and link, the reciter and the readers, the AI voice declaration, the
// part number, the YouTube chapters of the whole episode (the same timeline as the video,
// src/scenes.ts). Fails when a text breaks a platform's limit; a video without texts yet (a draft)
// gets a notice instead (a release render needs them validated: scripts/validate.py --release).
//
// Usage (from video/, after npm run data):
//   node scripts/publish.ts <episode> all       the whole episode (16:9 and 9:16) and every reel
//   node scripts/publish.ts <episode> <reel>    one reel
//   [--header "<line>"]                         a first line (the render workflow: run, voice)

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import { FPS } from "../src/formats.ts";
import { sceneStarts, selectScenes, totalFrames } from "../src/scenes.ts";
import type { EpisodeData, PublishTexts, ResolvedScene } from "../src/types.ts";

const ROOT = resolve(import.meta.dirname, "../..");

type Settings = {
  handle: string;
  hashtags: { brand: string; broad: string[]; hadith: string[]; reciters: Record<string, string[]> };
  platforms: {
    facebook: { max_hashtags: number };
    instagram_tiktok: { max_hashtags: number; max_caption: number };
    youtube: { max_title: number; max_description: number };
  };
  lines: { narration: string; characters: string; hadith_ai_voice: string };
};

const HASHTAG = /^#[\p{L}\p{N}_]+$/u;
/** YouTube chapters: the first at 0:00, at least 3, each at least 10 s long. */
const CHAPTER_MIN = 10;

const problems: string[] = [];
const ar = (n: number) => new Intl.NumberFormat("ar-EG").format(n);
const clock = (seconds: number) => {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Each source quoted, once, in order: reference, grade, who recites or reads it, link. */
function sourceLines(scenes: ResolvedScene[], settings: Settings): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const scene of scenes) {
    const source = scene.source;
    if (!source || seen.has(source.id) || (scene.audio === "tts" && source.type === "ayah")) continue;
    seen.add(source.id);
    const parts = [source.reference_en];
    if (source.type === "ayah") {
      if (scene.media?.credit) parts.push(scene.media.credit);
      if (source.translator) parts.push(`Translation: ${source.translator}`);
    } else {
      if (source.grade_note) parts.push(source.grade_note);
      parts.push(scene.media?.credit ?? settings.lines.hadith_ai_voice);
    }
    if (source.url) parts.push(source.url);
    lines.push(`• ${parts.join(" · ")}`);
  }
  return lines;
}

function hashtags(scenes: ResolvedScene[], theme: string[], own: string[], settings: Settings, reciter: string): string[] {
  const { brand, broad, hadith, reciters } = settings.hashtags;
  const tags = [
    brand, broad[0], theme[0], ...broad.slice(1), ...theme.slice(1), ...own,
    ...(scenes.some((s) => s.source?.type === "hadith") ? hadith : []),
    ...(scenes.some((s) => s.audio === "recitation") ? reciters[reciter] ?? [] : []),
  ].filter(Boolean);
  for (const tag of tags) if (!HASHTAG.test(tag)) problems.push(`hashtag ${JSON.stringify(tag)}: one word, # first`);
  return [...new Set(tags)];
}

type Video = {
  file: string;
  label: string;
  format: string;
  platforms: ("youtube" | "social")[];
  texts: PublishTexts | null;
  part: string;
  scenes: ResolvedScene[];
  tags: string[];
  chapters: string[];
  /** YouTube thumbnail attached to the same release (Thumbnail169), for the 16:9 episode. */
  thumbnail?: { file: string; validated: boolean };
};

function check(what: string, text: string, max: number) {
  if (text.length > max) problems.push(`${what}: ${text.length} characters, the limit is ${max}`);
}

function render(video: Video, settings: Settings): string[] {
  const { texts, scenes, tags } = video;
  const { facebook, instagram_tiktok: short, youtube } = settings.platforms;
  const seconds = Math.round(totalFrames(scenes) / FPS);
  const out = [`## ${video.label}`, "", `\`${video.file}\` · ${clock(seconds)} · ${video.format}`, ""];
  if (!texts) return [...out, "⚠️ Pas encore de textes de publication (`publish` dans l'épisode).", ""];
  const body = [
    texts.description.en, "", texts.description.ar, "",
    video.part, "",
    "Quoted:", ...sourceLines(scenes, settings), "",
    settings.lines.narration, settings.lines.characters, "",
    settings.handle,
  ];
  const head = [texts.title.en, texts.title.ar, ""];
  if (!texts.validated_by) out.push("⚠️ Textes proposés, pas encore validés par le propriétaire.", "");
  const block = (title: string, text: string) => out.push(`**${title}**`, "", "```text", text, "```", "");
  if (video.platforms.includes("social")) {
    const fb = [...head, ...body, "", tags.slice(0, facebook.max_hashtags).join(" ")].join("\n");
    const ig = [...head, ...body, "", tags.slice(0, short.max_hashtags).join(" ")].join("\n");
    check(`${video.file}, Instagram/TikTok caption`, ig, short.max_caption);
    block(`Facebook (${Math.min(tags.length, facebook.max_hashtags)} hashtags)`, fb);
    block(`Instagram · TikTok (${Math.min(tags.length, short.max_hashtags)} hashtags)`, ig);
  }
  if (video.platforms.includes("youtube")) {
    const title = `${texts.title.en} · ${texts.title.ar}`;
    check(`${video.file}, YouTube title`, title, youtube.max_title);
    if (/[<>]/.test(title)) problems.push(`${video.file}, YouTube title: no < or >`);
    const chapters = video.chapters.length ? ["Chapters:", ...video.chapters, ""] : [];
    const description = [...body.slice(0, 4), ...chapters, ...body.slice(4), "", tags.join(" ")].join("\n");
    check(`${video.file}, YouTube description`, description, youtube.max_description);
    block(`Titre YouTube (${title.length}/${youtube.max_title})`, title);
    block(`Description YouTube (${tags.length} hashtags)`, description);
    if (video.thumbnail) {
      const note = video.thumbnail.validated ? "" : " ⚠️ proposée, pas encore validée par le propriétaire";
      out.push(`**Miniature YouTube** : \`${video.thumbnail.file}\` (1280x720)${note}`, "");
    }
  }
  return out;
}

/** Chapters of the whole episode: one per reel, where its first scene starts. */
function chapters(data: EpisodeData, scenes: ResolvedScene[]): string[] {
  const starts = sceneStarts(scenes);
  const marks = data.reels.map((reel) => {
    const i = scenes.findIndex((s) => s.reel === reel.id);
    return { at: i <= 0 ? 0 : starts[i], title: `${reel.title.en} · ${reel.title.ar}` };
  });
  const end = totalFrames(scenes) / FPS;
  const short = marks.some((m, i) => (marks[i + 1]?.at ?? end) - m.at < CHAPTER_MIN);
  if (marks.length < 3 || short) {
    console.warn(`warning: no YouTube chapters (${marks.length} reels, one under ${CHAPTER_MIN} s: ${short})`);
    return [];
  }
  return marks.map((m) => `${clock(m.at)} ${m.title}`);
}

function main() {
  const args = process.argv.slice(2);
  const headerAt = args.indexOf("--header");
  const header = headerAt >= 0 ? args.splice(headerAt, 2)[1] : null;
  const [episode, which] = args;
  if (!episode || !which) throw new Error("usage: node scripts/publish.ts <episode> <reel|all> [--header <line>]");
  const data = JSON.parse(readFileSync(join(ROOT, "video/public/data", `${episode}.json`), "utf8")) as EpisodeData;
  const settings = parse(readFileSync(join(ROOT, "content/publish.yaml"), "utf8")) as Settings;
  const policy = parse(readFileSync(join(ROOT, "content/policy.yaml"), "utf8")) as { quran: { reciter: string } };
  const theme = data.publish?.hashtags ?? [];
  const n = data.reels.length;
  const videos: Video[] = [];
  if (which === "all") {
    const scenes = selectScenes(data, null);
    const tags = hashtags(scenes, theme, [], settings, policy.quran.reciter);
    const whole = {
      texts: data.publish, scenes, tags,
      part: `${data.title.en} · the whole episode, ${n} parts · ${data.title.ar} · الحلقة كاملة`,
    };
    videos.push(
      { ...whole, file: `${episode}-16x9.mp4`, label: `${data.title.en} · ${data.title.ar} — épisode complet 16:9`,
        format: "16:9 · YouTube", platforms: ["youtube"], chapters: chapters(data, scenes),
        thumbnail: data.thumbnail ? { file: `${episode}-thumbnail.png`, validated: Boolean(data.thumbnail.validated_by) } : undefined },
      { ...whole, file: `${episode}-9x16.mp4`, label: `${data.title.en} · ${data.title.ar} — épisode complet 9:16`,
        format: "9:16 · Facebook, Instagram, TikTok", platforms: ["social"], chapters: [] },
    );
  }
  data.reels.forEach((reel, i) => {
    if (which !== "all" && which !== reel.id) return;
    const scenes = selectScenes(data, reel.id);
    videos.push({
      file: `${reel.id}.mp4`,
      label: `${reel.id} · ${reel.title.en} · ${reel.title.ar}`,
      format: "9:16 · Facebook, Instagram, TikTok, YouTube Shorts",
      platforms: ["social", "youtube"],
      // The episode's validation covers the theme hashtags every reel carries.
      texts: reel.publish ? { ...reel.publish, validated_by: data.publish?.validated_by && reel.publish.validated_by } : null,
      part: `${data.title.en} · part ${i + 1}/${n} · ${data.title.ar} · الجزء ${ar(i + 1)} من ${ar(n)}`,
      scenes,
      tags: hashtags(scenes, theme, reel.publish?.hashtags ?? [], settings, policy.quran.reciter),
      chapters: [],
    });
  });
  if (videos.length === 0) problems.push(`${which}: no such reel in ${episode}`);
  const out = [
    ...(header ? [header, ""] : []),
    "Textes de publication : pour chaque vidéo, le titre, puis le texte à coller sur chaque plateforme " +
      "(bouton copier en haut à droite de chaque bloc). Hashtags : les premiers seulement là où la plateforme " +
      "en limite le nombre.",
    "",
    ...videos.flatMap((v) => render(v, settings)),
  ];
  if (problems.length) {
    for (const p of problems) console.error(`ERROR ${p}`);
    process.exit(1);
  }
  process.stdout.write(out.join("\n"));
}

main();
