// Output formats. Safe areas keep text clear of the platforms' buttons and captions
// (same reel margins as quran-reels: top 250, bottom 420, sides 90).

export type FormatId = "reel" | "episode";

export type Format = {
  id: FormatId;
  width: number;
  height: number;
  safe: { top: number; right: number; bottom: number; left: number };
};

export const FORMATS: Record<FormatId, Format> = {
  reel: { id: "reel", width: 1080, height: 1920, safe: { top: 250, right: 90, bottom: 420, left: 90 } },
  episode: { id: "episode", width: 1920, height: 1080, safe: { top: 80, right: 160, bottom: 120, left: 160 } },
};

export const FPS = 30;

/** Silent animated transition between two scenes (seconds): the next scene slides or fades in while
 * nobody speaks; its voice starts when the movement ends (owner's request, 2026-11-06). */
export const TRANSITION_SECONDS = 0.3;

export const toFrames = (seconds: number) => Math.max(1, Math.round(seconds * FPS));
