import type { CalculateMetadataFunction } from "remotion";
import { staticFile } from "remotion";
import { toFrames } from "./formats";
import type { FormatId } from "./formats";
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

export function selectScenes(data: EpisodeData, reel: string | null): ResolvedScene[] {
  if (reel === null) return data.scenes;
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
  const durationInFrames = selectScenes(data, props.reel).reduce((n, s) => n + toFrames(s.duration.seconds), 0);
  return { durationInFrames, props: { ...props, data } };
};
