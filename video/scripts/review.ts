// The list « à vérifier » of a candidate render (owner's decision, 2026-11-08: the owner validates
// once, at the end, on the videos): everything still waiting for the owner's word, and everything the
// automatic checks could not settle, each with where it is heard in each video (m:ss). Markdown, at
// the top of the candidate release's notes (.github/workflows/render.yml, mode candidate).
//
// Reads the episode's data (public/data/<episode>.json, real audio), its takes (content/audio/<episode>/
// takes.json: candidate takes are the new voice) and what Whisper heard in them (checks.json, written by
// tools/audio/listen.py --episode --save), the backgrounds (one without `validated_by` that no validated
// reel uses yet is new), content/pronunciation.yaml (spellings not decided yet) and, optionally, scripts/validate.py's
// warnings for this episode.
//
// Usage (from video/, after npm run data):
//   node scripts/review.ts <episode> [--warnings <file>]

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import { selectScenes, sceneStarts } from "../src/scenes.ts";
import type { EpisodeData, ResolvedScene } from "../src/types.ts";

const ROOT = resolve(import.meta.dirname, "../..");

type Take = { text: string; status?: string; raw_sha256?: string };
type Check = { raw_sha256: string; heard: string; differs: string | null; sound: [number, number] | null };
type EpisodeYaml = { episode: string; reels: { id: string; validated_by?: string }[];
  scenes: { reel?: string; visual: { background?: string } }[] };

const clock = (seconds: number) => {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const readJson = <T,>(path: string, fallback: T): T => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback);

function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf("--warnings");
  const warningsFile = at >= 0 ? args.splice(at, 2)[1] : null;
  const [episode] = args;
  if (!episode) throw new Error("usage: node scripts/review.ts <episode> [--warnings <file>]");
  const data = JSON.parse(readFileSync(join(ROOT, "video/public/data", `${episode}.json`), "utf8")) as EpisodeData;

  // Where each scene is heard: the whole episode (16:9 and 9:16 share one timeline) and its reel.
  const videos: { name: string; at: Map<string, number> }[] = [];
  const timeline = (name: string, scenes: ResolvedScene[]) => {
    const starts = sceneStarts(scenes);
    videos.push({ name, at: new Map(scenes.map((s, i) => [s.id, starts[i]])) });
  };
  timeline(`${episode} (épisode)`, selectScenes(data, null));
  for (const reel of data.reels) timeline(reel.id, selectScenes(data, reel.id));
  const where = (id: string) => videos.filter((v) => v.at.has(id)).map((v) => `${v.name} ${clock(v.at.get(id)!)}`).join(" · ");
  const byId = new Map(data.scenes.map((s) => [s.id, s]));
  const validatedReels = new Set(data.reels.filter((r) => r.validated_by).map((r) => r.id));
  const open = (s: ResolvedScene) => (s.reel ? !validatedReels.has(s.reel) : !data.whole?.validated_by);

  const out: string[] = [
    "## À vérifier avant de valider",
    "",
    "Version candidate : rien de cette page n'est encore validé. Regarde chaque vidéo en entier, puis réponds " +
      "« je valide » (tout passe validé d'un coup, prises figées, et ces mêmes vidéos deviennent la version " +
      "finale) ou donne tes corrections avec la vidéo et la minute.",
    "",
  ];
  const section = (title: string, lines: string[], empty?: string) => {
    if (!lines.length && !empty) return;
    out.push(`### ${title}`, "", ...(lines.length ? lines : [empty!]), "");
  };

  // 1. What the owner validates with « je valide ».
  const pending: string[] = [];
  for (const reel of data.reels) {
    if (!reel.validated_by) pending.push(`- Script et traduction de **${reel.id}** (${reel.title.ar} · ${reel.title.en})`);
    if (reel.publish && !(reel.publish.validated_by && data.publish?.validated_by)) {
      pending.push(`- Textes de publication de ${reel.id}`);
    }
  }
  if (data.publish && !data.publish.validated_by) pending.push("- Textes de publication de l'épisode entier et ses hashtags");
  if (data.whole && !data.whole.validated_by) pending.push("- Ordre de l'épisode entier (parties, chapitres YouTube)");
  if (data.thumbnail && !data.thumbnail.validated_by) pending.push(`- Miniature YouTube (\`${episode}-thumbnail.png\`)`);
  section("Ce que « je valide » validera", pending, "Tout est déjà validé : seule la vidéo change (nouveau rendu).");

  // 2. New voice: candidate takes, with what Whisper heard.
  const takes = readJson<{ takes: Record<string, Take> }>(join(ROOT, "content/audio", episode, "takes.json"), { takes: {} }).takes;
  const checks = readJson<{ takes: Record<string, Check> }>(join(ROOT, "content/audio", episode, "checks.json"), { takes: {} }).takes;
  const voice: string[] = [];
  for (const [sid, take] of Object.entries(takes)) {
    if (take.status !== "candidate") continue;
    const check = checks[sid];
    const notes: string[] = [];
    if (!check || check.raw_sha256 !== take.raw_sha256) notes.push("⚠️ pas réécoutée par Whisper");
    else {
      if (check.differs) notes.push(`⚠️ Whisper entend autre chose : ${check.differs}`);
      if (check.sound) notes.push(`⚠️ un son après le dernier mot (${check.sound[0]}-${check.sound[1]} s de la prise)`);
    }
    voice.push(`- \`${sid}\` (${where(sid)}) : « ${take.text} »${notes.length ? ` — ${notes.join(" ; ")}` : " — Whisper : tous les mots, rien après"}`);
  }
  section("Nouvelle voix (prises candidates)", voice);

  // 3. Lines written by Claude that carry meaning: lessons and life examples.
  const own = data.scenes
    .filter((s) => open(s) && (s.role === "lesson" || s.role === "example") && s.narration)
    .map((s) => `- ${s.role === "lesson" ? "Leçon" : "Exemple de vie"}, \`${s.id}\` (${where(s.id)}) : « ${s.narration!.ar} » / ${s.narration!.en}`);
  section("Mes lignes à relire de près (leçons, exemples de vie)", own);

  // 4. Sources and readings not validated yet.
  const seen = new Set<string>();
  const sources: string[] = [];
  for (const s of data.scenes) {
    const src = s.source;
    if (!src || seen.has(src.id)) continue;
    seen.add(src.id);
    if (src.status !== "validated") sources.push(`- ${src.reference_en}${src.grade_note ? ` (${src.grade_note})` : ""}, \`${src.id}\` (${where(s.id)})${src.url ? ` : ${src.url}` : ""}`);
    if (src.recording && src.recording.status !== "validated") {
      sources.push(`- Lecture de ${src.reference_en} par ${src.recording.reader} (${where(s.id)}), à écouter`);
    }
  }
  section("Sources et lectures à valider", sources);

  // 5. Backgrounds no validated reel of any episode uses yet: new drawings.
  const usedValidated = new Set<string>();
  for (const file of readdirSync(join(ROOT, "content/episodes")).filter((f) => f.endsWith(".yaml"))) {
    const ep = parse(readFileSync(join(ROOT, "content/episodes", file), "utf8")) as EpisodeYaml;
    const ok = new Set(ep.reels.filter((r) => r.validated_by).map((r) => r.id));
    for (const sc of ep.scenes) if (sc.reel && ok.has(sc.reel) && sc.visual.background) usedValidated.add(sc.visual.background);
  }
  const catalog = (parse(readFileSync(join(ROOT, "content/backgrounds.yaml"), "utf8")) as {
    backgrounds: Record<string, { validated_by?: string }>;
  }).backgrounds;
  const backgrounds = new Map<string, string>();
  for (const s of data.scenes) {
    const bg = s.visual.background;
    if (bg && open(s) && !catalog[bg]?.validated_by && !usedValidated.has(bg) && !backgrounds.has(bg)) backgrounds.set(bg, s.id);
  }
  section("Nouveaux fonds", [...backgrounds].map(([bg, sid]) => `- \`${bg}\` (d'abord ${where(sid)})`));

  // 6. Spellings for the voice not decided by the owner yet.
  const lexicon = parse(readFileSync(join(ROOT, "content/pronunciation.yaml"), "utf8")) as {
    words: { word: string; say: string; decided?: { by?: string; scene?: string } }[];
  };
  const spellings = lexicon.words
    .filter((w) => w.decided?.by === "proposed")
    .map((w) => {
      const sid = w.decided?.scene?.split("/").pop() ?? "";
      return `- « ${w.word} » dit « ${w.say} »${byId.has(sid) ? ` (${where(sid)})` : ""}`;
    });
  section("Prononciations nouvelles", spellings);

  // 7. What the automatic checks flagged and Claude left as is (explained in the PR).
  const warnings = warningsFile && existsSync(warningsFile)
    ? readFileSync(warningsFile, "utf8").split("\n")
        .filter((l) => l.startsWith("warning ") && l.includes(`episodes/${episode}.yaml`) && !/not validated/.test(l))
        .map((l) => `- ${l.replace(/^warning /, "")}`)
    : [];
  section("Alertes des contrôles automatiques", warnings, "Aucune (dialecte, prononciation, structure du format).");

  process.stdout.write(out.join("\n"));
}

main();
