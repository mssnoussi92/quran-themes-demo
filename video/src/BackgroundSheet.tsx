// Every background of content/backgrounds.yaml in 16:9 and 9:16, on one image, for the owner to
// validate the drawings: npm run still -- BackgroundSheet ../docs/backgrounds.png --frame=40
import { AbsoluteFill } from "remotion";
import { BACKGROUNDS } from "./backgrounds/Backgrounds";
import { FONT } from "./fonts";
import { FORMATS } from "./formats";
import { STAGE } from "./formats";

const SCALE = 0.3;
const LABEL = 300;
const GAP = 24;
const ROW = FORMATS.reel.height * SCALE;

/** One background drawn at its real size in a format, shrunk to fit the sheet. */
const Cell: React.FC<{ id: string; format: "episode" | "reel" }> = ({ id, format }) => {
  const f = FORMATS[format];
  const Background = BACKGROUNDS[id];
  return (
    <div style={{ width: f.width * SCALE, height: f.height * SCALE, overflow: "hidden", borderRadius: 10, position: "relative" }}>
      <div style={{ width: f.width, height: f.height, transform: `scale(${SCALE})`, transformOrigin: "0 0", position: "absolute" }}>
        <Background width={f.width} height={f.height} floorY={STAGE[format].floorY} seatTop={null} />
      </div>
    </div>
  );
};

export const BACKGROUND_SHEET = {
  width: LABEL + (FORMATS.episode.width + FORMATS.reel.width) * SCALE + 2 * GAP + 40,
  height: Object.keys(BACKGROUNDS).length * (ROW + GAP) + 40,
};

export const BackgroundSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#1b3246", padding: 20, display: "flex", flexDirection: "column", gap: GAP }}>
    {Object.keys(BACKGROUNDS).map((id) => (
      <div key={id} style={{ display: "flex", alignItems: "center", gap: GAP, height: ROW }}>
        <div style={{ width: LABEL - GAP, fontFamily: FONT.latin, fontSize: 34, color: "#f5f1e8" }}>{id}</div>
        <Cell id={id} format="episode" />
        <Cell id={id} format="reel" />
      </div>
    ))}
  </AbsoluteFill>
);
