// The episode's visual style, for every template (Video.tsx provides it; docs/styles.md).
import { createContext } from "react";
import type { VisualStyle } from "../types";

export const StyleContext = createContext<VisualStyle>("flat");
