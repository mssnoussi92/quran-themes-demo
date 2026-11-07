import type { CalculateMetadataFunction } from "remotion";
import { staticFile } from "remotion";
import { TRANSITION_SECONDS, toFrames } from "./formats";
import type { FormatId } from "./formats";
import { splitPhrases } from "./phrases";
import type { EpisodeData, ResolvedScene } from "./types";

export type VideoProps = {
  /** Episode slug: content/episodes/<episode>.yaml */
  episode: string;
  /** Reel id (scenes with this `reel`), or null for the whole episode. */
  reel: string | null;
  format: FormatId;
  /** Filled by calculateMetadata from public/data/<episode>.json (npm run data). */
  data: EpisodeData | null;
};

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

export function selectScenes(data: EpisodeData, reel: string | null): ResolvedScene[] {
  if (reel === null) return data.scenes.map(withoutReelEnd);
  if (!data.reels.some((r) => r.id === reel)) {
    throw new Error(`reel '${reel}' is not in episode '${data.episode}'`);
  }
  const scenes = data.scenes.filter((s) => s.reel === reel);
  if (scenes.length === 0) throw new Error(`reel '${reel}' has no scene`);
  return scenes;
}

export const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile(`data/${props.episode}.json`), { signal: abortSignal });
  if (!res.ok) {
    throw new Error(`public/data/${props.episode}.json is missing: run "npm run data" in video/`);
  }
  const data = (await res.json()) as EpisodeData;
  // Scenes back to back, plus one silent transition between each two (Video.tsx).
  const scenes = selectScenes(data, props.reel);
  const between = toFrames(TRANSITION_SECONDS);
  const durationInFrames = scenes.reduce((n, s) => n + toFrames(s.duration.seconds), 0) + (scenes.length - 1) * between;
  return { durationInFrames, props: { ...props, data } };
};
