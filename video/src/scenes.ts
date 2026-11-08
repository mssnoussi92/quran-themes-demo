// Which scenes a video shows, and when each one starts: shared by the compositions (browser) and
// scripts/publish.ts (Node, YouTube chapters), so that both read the same timeline. No Remotion
// import here, and explicit .ts specifiers: Node runs this file as is.

import { FPS, REMINDER_SECONDS, TRANSITION_SECONDS, toFrames } from "./formats.ts";
import { splitPhrases } from "./phrases.ts";
import type { EpisodeData, I18n, ResolvedScene } from "./types.ts";

/** Silence kept before a cut: the take pauses 0.06 s after a sound and 0.12 s before the next one
 * (tools/audio/build.py, TIGHT), so a line cut 0.12 s before a phrase ends as it would anyway. */
const CUT_BEFORE = 0.12;

const dropEnd = (text: string, end: string) => text.trim().slice(0, -end.trim().length).trim();

/** A scene as the whole-episode videos show it: without the end said only in its reel ("that's
 * next"); its audio stops before that phrase, its card and subtitles lose it too. */
function withoutReelEnd(scene: ResolvedScene): ResolvedScene {
  const end = scene.reel_only_end;
  if (!end || !scene.narration) return scene;
  const narration = { ar: dropEnd(scene.narration.ar, end.ar), en: dropEnd(scene.narration.en, end.en) };
  const kept = splitPhrases(narration.ar).length;
  const media = scene.media;
  const timed = media?.phrases ?? [];
  const seconds =
    media && timed.length === splitPhrases(scene.narration.ar).length
      ? Math.max(timed[kept - 1].start, timed[kept].start - CUT_BEFORE)
      : (scene.duration.seconds * narration.ar.length) / scene.narration.ar.length;
  const cut = Math.round(seconds * 100) / 100;
  return {
    ...scene,
    narration,
    media: media ? { ...media, seconds: cut, phrases: timed.slice(0, kept) } : null,
    duration: { ...scene.duration, seconds: cut, basis: `${scene.duration.basis}; cut before « ${end.ar} »` },
  };
}

/** The whole episode's scenes in order: its own order (`whole`, a story told with suspense), or every
 * scene as written. */
function wholeScenes(data: EpisodeData): ResolvedScene[] {
  if (!data.whole) return data.scenes;
  const byId = new Map(data.scenes.map((s) => [s.id, s]));
  return data.whole.parts.flatMap((p) =>
    p.scenes.map((id) => {
      const scene = byId.get(id);
      if (!scene) throw new Error(`whole: unknown scene '${id}' in episode '${data.episode}'`);
      return scene;
    }),
  );
}

/** Parts of the whole episode, each with the index of its first scene in selectScenes(data, null):
 * its own parts, or one per reel. The YouTube chapters (scripts/publish.ts). */
export function wholeParts(data: EpisodeData): { title: I18n; first: number }[] {
  if (data.whole) {
    let first = 0;
    return data.whole.parts.map((p) => {
      const part = { title: p.title, first };
      first += p.scenes.length;
      return part;
    });
  }
  return data.reels.map((reel) => ({ title: reel.title, first: data.scenes.findIndex((s) => s.reel === reel.id) }));
}

/** The scenes of a reel, or of the whole episode (reel null). */
export function selectScenes(data: EpisodeData, reel: string | null): ResolvedScene[] {
  if (reel === null) return wholeScenes(data).map(withoutReelEnd);
  if (!data.reels.some((r) => r.id === reel)) {
    throw new Error(`reel '${reel}' is not in episode '${data.episode}'`);
  }
  const scenes = data.scenes.filter((s) => s.reel === reel);
  if (scenes.length === 0) throw new Error(`reel '${reel}' has no scene`);
  return scenes;
}

/** Scenes back to back, plus one silent transition between each two (Video.tsx). */
export function totalFrames(scenes: ResolvedScene[]): number {
  const between = toFrames(TRANSITION_SECONDS);
  return scenes.reduce((n, s) => n + toFrames(s.duration.seconds), 0) + (scenes.length - 1) * between;
}

/** Second at which each scene's content starts (its voice, after the transition that brings it in). */
export function sceneStarts(scenes: ResolvedScene[]): number[] {
  const between = toFrames(TRANSITION_SECONDS);
  let frame = 0;
  return scenes.map((s, i) => {
    const start = frame + (i > 0 ? between : 0);
    frame = start + toFrames(s.duration.seconds);
    return start / FPS;
  });
}

/** Frames at which the "like and subscribe" reminder starts in the whole episode (YouTube): at the end
 * of the first reel and over the last card. Dropped where it would cover a verse or a hadith. */
export function reminderStarts(scenes: ResolvedScene[]): number[] {
  const length = toFrames(REMINDER_SECONDS);
  const overlap = toFrames(TRANSITION_SECONDS);
  const starts = sceneStarts(scenes).map((s) => Math.round(s * FPS));
  const ends = scenes.map((s, i) => starts[i] + toFrames(s.duration.seconds));
  const total = totalFrames(scenes);
  const second = scenes.findIndex((s) => s.reel !== scenes[0].reel);
  const candidates = [
    second > 0 ? starts[second - 1] + toFrames(0.3) : -1,
    total - length - toFrames(0.2),   // over the last card(s), ending just before the video
  ];
  // Every scene on screen during the reminder (its transitions included) is a narration without a source.
  const clear = (from: number) =>
    scenes.every((s, i) => ends[i] + overlap <= from || starts[i] - overlap >= from + length || (!s.source && s.audio === "tts"));
  return candidates.filter((from, i) => from >= 0 && from + length <= total && clear(from) && candidates.indexOf(from) === i);
}
