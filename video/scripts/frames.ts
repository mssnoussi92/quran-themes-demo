// Where each scene of a video is, to take stills of it (npx remotion still … --frame=<n>):
//   node scripts/frames.ts <episode> <reel|all>
// One line per scene: the frame its content starts at (after the 0.6 s transition), its middle and its
// last frame, its template, background and role. The same timeline as the compositions (src/scenes.ts).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FPS, TRANSITION_SECONDS, toFrames } from "../src/formats.ts";
import { selectScenes } from "../src/scenes.ts";
import type { EpisodeData } from "../src/types.ts";

const [episode, reel] = process.argv.slice(2);
if (!episode || !reel) {
  console.error("usage: node scripts/frames.ts <episode> <reel|all>");
  process.exit(2);
}
const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, "..", "public", "data", `${episode}.json`), "utf8")) as EpisodeData;
const scenes = selectScenes(data, reel === "all" ? null : reel);
const overlap = toFrames(TRANSITION_SECONDS);
let from = 0;
scenes.forEach((scene, i) => {
  const lead = i > 0 ? overlap : 0;
  const content = toFrames(scene.duration.seconds);
  const start = from + lead;
  const what = [scene.visual.template, scene.visual.background, scene.role].filter(Boolean).join(" ");
  console.log(`${String(start).padStart(6)} ${String(start + Math.floor(content / 2)).padStart(6)} ${String(start + content - 1).padStart(6)}  ${scene.id}  (${what}, ${(content / FPS).toFixed(1)} s)`);
  from += lead + content;
});
