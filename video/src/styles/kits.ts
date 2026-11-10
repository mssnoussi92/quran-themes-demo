// The styles built as kits (kit.ts). A style missing here is drawn by the templates themselves
// (flat, paper).
import type { VisualStyle } from "../types";
import { CHALK_KIT } from "./chalk/render";
import { ILLUMINATION_KIT } from "./illumination/render";
import type { StyleKit } from "./kit";

export const KITS: Partial<Record<VisualStyle, StyleKit>> = {
  chalk: CHALK_KIT,
  illumination: ILLUMINATION_KIT,
};
