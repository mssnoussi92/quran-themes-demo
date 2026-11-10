// The illumination style in the episodes (docs/styles.md): a manuscript page. The style of the
// formats where the text is at the centre (collections of du'as, one text explained): the cards
// matter most, scenes are fewer.
//   palette.ts    its colours, the ink of a verse and a hadith
//   ornament.tsx  the border of stars, the arch, the rosette that draws itself, the glint on the gold
//   paint.tsx     a place of the catalog and its people painted flat under an ink line
//   scene.tsx     the « scene » template: that painting in a pointed arch on the page
//   cards.tsx     the page behind the cards, the folio of a quotation, the cartouche of the narration
//   thumb.tsx     the YouTube thumbnail
import type { StyleKit } from "../kit";
import { Backdrop, Panel, Title } from "./cards";
import { INK } from "./palette";
import { Scene } from "./scene";
import { Thumb } from "./thumb";

export const ILLUMINATION_KIT: StyleKit = { Backdrop, Scene, Panel, ink: INK, Title, Thumb };
