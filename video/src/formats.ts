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

/** Where the floor is and how big the Open Peeps figures are, per format (their units -> pixels).
 * Reel: a standing figure (2931 units) reaches y = 276, just under the top safe area (250). Every
 * style stands its people on this floor line. */
export const STAGE: Record<FormatId, { floorY: number; scale: number }> = {
  reel: { floorY: 1360, scale: 0.375 },
  episode: { floorY: 880, scale: 0.235 },
};

/** Space kept for the subtitles under a card, inside the safe area: a card is centred above it. */
export const SUBTITLE_RESERVE: Record<FormatId, number> = { reel: 330, episode: 220 };

/** Silent animated transition between two scenes: the next scene moves in while nobody speaks, and
 * its voice starts when the movement ends (owner's request, 2026-11-06). 0.6 s: chosen by the owner
 * among four variants (own 0.3 s / 0.6 s, @remotion/transitions slide-fade / wipe-iris 0.6 s). */
export const TRANSITION_SECONDS = 0.6;

export const toFrames = (seconds: number) => Math.max(1, Math.round(seconds * FPS));

/** Length of the "like and subscribe" reminder of the YouTube video (templates/SubscribeReminder.tsx). */
export const REMINDER_SECONDS = 4.4;
