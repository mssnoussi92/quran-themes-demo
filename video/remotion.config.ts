// Remotion CLI settings (studio, still, render). See https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Standard-range H.264 colors, which every platform plays the same way.
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");

// Cloud sessions have a headless browser preinstalled: point REMOTION_BROWSER_EXECUTABLE at it
// instead of letting Remotion download one (GitHub Actions downloads it, which is fine).
const browser = process.env.REMOTION_BROWSER_EXECUTABLE;
if (browser) {
  Config.setBrowserExecutable(browser);
}
