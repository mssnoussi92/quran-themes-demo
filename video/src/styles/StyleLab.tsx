// Style lab (owner's request, 2026-11-09): one shot of the cave episode drawn in one style, to compare
// the styles side by side (StyleBoard). Not used by the episodes yet.
import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { loadFonts } from "../fonts";
import { LINE, SCENES, type ShotId } from "./geometry";
import { ChalkStyle } from "./Chalk";
import { IlluminationStyle } from "./Illumination";
import { PaperStyle } from "./Paper";
import { WatercolorStyle } from "./Watercolor";

export const LAB_STYLES = ["paper", "chalk", "illumination", "watercolor"] as const;
export type LabStyle = (typeof LAB_STYLES)[number];
export type StyleLabProps = { style: LabStyle; shot: ShotId };

loadFonts();
const LAB_FONTS = [
  { family: "Aref Ruqaa", file: "aref-ruqaa-arabic-400-normal.woff2", weight: "400" },
  { family: "Aref Ruqaa", file: "aref-ruqaa-arabic-700-normal.woff2", weight: "700" },
  { family: "Reem Kufi", file: "reem-kufi-arabic-600-normal.woff2", weight: "600" },
  { family: "Patrick Hand", file: "patrick-hand-latin-400-normal.woff2", weight: "400" },
];
LAB_FONTS.forEach(({ family, file, weight }) => loadFont({ family, url: staticFile(`fonts/lab/${file}`), weight }));

export const subtitleOf = (shot: ShotId): string => (shot === "line" ? LINE.en : SCENES[shot].title.en);

export const StyleShot: React.FC<StyleLabProps> = ({ style, shot }) => {
  const spec = shot === "line" ? undefined : SCENES[shot];
  const subtitle = subtitleOf(shot);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {style === "paper" ? <PaperStyle shot={shot} spec={spec} subtitle={subtitle} /> : null}
      {style === "chalk" ? <ChalkStyle shot={shot} spec={spec} subtitle={subtitle} /> : null}
      {style === "illumination" ? <IlluminationStyle shot={shot} spec={spec} subtitle={subtitle} /> : null}
      {style === "watercolor" ? <WatercolorStyle shot={shot} spec={spec} subtitle={subtitle} /> : null}
    </AbsoluteFill>
  );
};

export const StyleLab: React.FC<StyleLabProps> = (props) => <StyleShot {...props} />;
