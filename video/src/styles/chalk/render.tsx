// The chalk style in the episodes (docs/styles.md, « Tableau à la craie »): a dark green board in a
// wooden frame, everything drawn in chalk. The look is the prototype's, chosen by the owner on the
// board of styles (styles/Chalk.tsx, composition StyleLab); this is the same hand for any scene of
// an episode, in both formats:
//   board.tsx   the slate, its dust and wiped sentences, the frame; the chalk filters, the sweep
//   scene.tsx   a place of the catalog and the scene's characters (the « scene » template)
//   figure.tsx  the Open Peeps characters traced in chalk
//   text.tsx    the board behind a card, the narration line in ruqaa, the frame of a quotation
//   thumb.tsx   the YouTube thumbnail
import type { StyleKit } from "../kit";
import { ChalkScene } from "./scene";
import { ChalkBackdrop, ChalkPanel, ChalkTitle, INK } from "./text";
import { ChalkThumb } from "./thumb";

export const CHALK_KIT: StyleKit = {
  Backdrop: ChalkBackdrop,
  Scene: ChalkScene,
  Panel: ChalkPanel,
  ink: INK,
  Title: ChalkTitle,
  Thumb: ChalkThumb,
};
