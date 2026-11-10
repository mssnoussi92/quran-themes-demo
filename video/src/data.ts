import type { CalculateMetadataFunction } from "remotion";
import { staticFile } from "remotion";
import type { FormatId } from "./formats";
import { selectScenes, totalFrames } from "./scenes.ts";
import type { EpisodeData, VisualStyle } from "./types";

export type VideoProps = {
  /** Episode slug: content/episodes/<episode>.yaml */
  episode: string;
  /** Reel id (scenes with this `reel`), or null for the whole episode. */
  reel: string | null;
  format: FormatId;
  /** The platform this version is for when the page has another name there ("tiktok": content/publish.yaml,
   * `handles`); null or absent: the page's usual name. */
  platform?: string | null;
  /** Another style than the episode's own, to look at a reel in a style before an episode is written
   * in it (never a release render): --props='{…,"style":"chalk"}'. */
  style?: VisualStyle | null;
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
