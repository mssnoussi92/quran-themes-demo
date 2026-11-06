// Every character of content/characters.yaml in every pose and mood, on one image, for the owner
// to validate the looks: npm run still -- CharacterSheet ../docs/characters.png
import { AbsoluteFill, staticFile } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { CharacterView, placement } from "./characters/Character";
import { FONT } from "./fonts";
import type { Character } from "./types";

type SheetData = { id: string; poses: Character[][] }[];
export type SheetProps = { data: SheetData | null };

const CELL_W = 210;
const CELL_H = 330;
const HEADER = 56;

export const sheetMetadata: CalculateMetadataFunction<SheetProps> = async ({ abortSignal }) => {
  const res = await fetch(staticFile("data/characters.json"), { signal: abortSignal });
  if (!res.ok) throw new Error('public/data/characters.json is missing: run "npm run data" in video/');
  const data = (await res.json()) as SheetData;
  const cols = Math.max(...data.map((ch) => ch.poses.flat().length));
  return { props: { data }, width: cols * CELL_W + 40, height: data.length * (CELL_H + HEADER) + 40 };
};

const Cell: React.FC<{ c: Character }> = ({ c }) => {
  const [bx, , bw, bh] = c.box;
  const scale = Math.min((CELL_H - 50) / (bh + 80), (CELL_W - 20) / (bw + 80));
  // Centre the whole figure in the cell (a sitting figure is otherwise centred on its hips).
  const x = CELL_W / 2 + (c.seat ? (c.seat[0] - (bx + bw / 2)) * scale : 0);
  const p = placement(c, x, CELL_H - 40, scale);
  return (
    <div style={{ position: "relative", width: CELL_W, height: CELL_H, background: "#F3E9DC", borderRight: "2px solid #E2D2B8", overflow: "hidden" }}>
      {c.seat ? <div style={{ position: "absolute", left: x - 70, width: 140, top: CELL_H - 40 - p.seatHeight, height: 12, background: "#7FA3B6" }} /> : null}
      <CharacterView c={c} x={x} floorY={CELL_H - 40} scale={scale} audio={null} />
      <div style={{ position: "absolute", bottom: 8, width: "100%", textAlign: "center", fontFamily: FONT.latin, fontSize: 18 }}>
        {c.pose} · {c.mood}
      </div>
    </div>
  );
};

export const CharacterSheet: React.FC<SheetProps> = ({ data }) => (
  <AbsoluteFill style={{ background: "#1b3246", padding: 20 }}>
    {(data ?? []).map((ch) => (
      <div key={ch.id} style={{ marginBottom: 0 }}>
        <div style={{ height: HEADER, fontFamily: FONT.latin, fontSize: 30, color: "#f5f1e8", display: "flex", alignItems: "center" }}>
          {ch.id}
        </div>
        <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", width: "fit-content" }}>
          {ch.poses.flat().map((c) => (
            <Cell key={`${c.pose}-${c.mood}`} c={c} />
          ))}
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
