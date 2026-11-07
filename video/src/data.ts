import type { CalculateMetadataFunction } from "remotion";
import { staticFile } from "remotion";
import type { FormatId } from "./formats";
import { selectScenes, totalFrames } from "./scenes.ts";
import type { EpisodeData } from "./types";

export type VideoProps = {
  /** Episode slug: content/episodes/<episode>.yaml */
  episode: string;
  /** Reel id (scenes with this `reel`), or null for the whole episode. */
  reel: string | null;
  format: FormatId;
  /** Filled by calculateMetadata from public/data/<episode>.json (npm run data). */
  data: EpisodeData | null;
};

export const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile(`data/${props.episode}.json`), { signal: abortSignal });
  if (!res.ok) {
    throw new Error(`public/data/${props.episode}.json is missing: run "npm run data" in video/`);
  }
  const data = (await res.json()) as EpisodeData;
  const durationInFrames = totalFrames(selectScenes(data, props.reel));
  return { durationInFrames, props: { ...props, data } };
};
