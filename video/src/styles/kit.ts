// What a visual style gives the templates (docs/styles.md). The flat and paper styles came before
// this contract and stay wired by hand in templates/cards.tsx and Video.tsx; the styles built after
// them (chalk, illumination) are a kit each, registered in kits.ts.
//
// What a style never decides (docs/styles.md, « Ce qui ne change jamais »): the text of a verse or a
// hadith and its layout (templates/cards.tsx draws them inside the kit's Panel, in the kit's ink),
// the reference lines, the page's signature, the English subtitles, the safe areas.
import type React from "react";
import type { Format } from "../formats";
import type { Character, ResolvedScene, ThumbnailData } from "../types";

export type KitProps = { scene: ResolvedScene; format: Format };

/** What a panel frames: a verse (Amiri Quran), a hadith, the name card of a person never drawn. */
export type PanelKind = "ayah" | "hadith" | "name";

/** One phrase of a title card and the frame (from the start of the scene's sequence) at which the
 * voice reaches it; the first phrase is at 0. Untimed line: one phrase, at 0. */
export type TitlePhrase = { text: string; at: number };

export type StyleKit = {
  /** Behind a card (title, verse, hadith, name): the style's ground (the board, the page). Fills the
   * frame, opaque, any format (reel 1080x1920, episode 1920x1080). */
  Backdrop: React.FC<KitProps>;
  /** The « scene » template: a place of the catalog (styles/paper/places.ts, the geometry every
   * layered style draws) with the scene's characters. Fills the frame, opaque, any format. */
  Scene: React.FC<KitProps>;
  /** The frame of a quotation. Its children (the text, then the reference lines) are laid out by
   * templates/cards.tsx in a column; the panel only frames them. */
  Panel: React.FC<{ kind: PanelKind; format: Format; children: React.ReactNode }>;
  /** Colours of what cards.tsx draws inside the Panel: the text, the second reference line, the
   * first reference line, the word being recited. */
  ink: { text: string; muted: string; accent: string; highlight: string };
  /** The narration line of a title card, in the style's own hand, inside the stage (the safe area
   * above the subtitles; the stage centres it). `phrases` come one under the other. */
  Title: React.FC<KitProps & { phrases: TitlePhrase[] }>;
  /** The YouTube thumbnail of an episode in this style (1280x720). */
  Thumb: React.FC<{ t: ThumbnailData; c: Character | null }>;
};
