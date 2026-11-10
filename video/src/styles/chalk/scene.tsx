// The « scene » template in chalk: a place of the catalog (styles/paper/places.ts: layers of plain
// shapes) drawn as the prototype drew its two scenes (styles/Chalk.tsx): one rough line around each
// thing, the slate's colour inside it (it hides what is behind), light hatching for the sky and the
// light; and the scene's characters, the Open Peeps figures traced in chalk (figure.tsx).
//
// The drawing appears layer by layer, from the back to the front, each one swept from right to left
// (the hand), and is complete 0.6 s after the scene's sequence starts: a scene comes in during a
// transition of that length before its voice starts, and is already half drawn when it does. The
// first scene of a video has no transition and is drawn from its first frame (the frame a platform
// may show as the video's cover). Then the drawing only moves (a slow push-in): see « Render cost »
// in board.tsx.
import React, { useContext } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AudioStart } from "../../audioStart";
import { placement } from "../../characters/Character";
import { STAGE, type Format } from "../../formats";
import type { Character } from "../../types";
import type { Layer, Shape } from "../geometry";
import type { KitProps } from "../kit";
import { PAPER_PLACES, type Place } from "../paper/places";
import { silhouette } from "../paper/silhouettes";
import { groups, Shapes } from "../shapes";
import { BOARD, CHALK, type ChalkName, Dust, Frame, Hatch, OutlineFilter, type Region, RoughFilter, Sweep, eased, frameRegion, idOf, seedOf, wipesOf } from "./board";
import { ChalkFigure, MAIN, PeepFilters, PeepStyles, type Placed } from "./figure";

/** A bust faces the camera: three times larger, cut by the bottom of the frame (as the flat scenes). */
const BUST_ZOOM = 3;
/** A standing Open Peeps figure, in its own units (templates/cards.tsx: 2931 units reach y = 276). */
const PEEP = 2931;
/** People are drawn at the scale of the place they are in (`Place.person`; the places first drawn for
 * the paper style are built around silhouettes 0.6 of the short side tall, and a figure at the flat
 * scenes' size stood 1.7 times too tall beside a desk or a bed, its feet under the floor when
 * sitting). The camera then comes closer, place and people together, so that a face is still read on
 * a phone: up to CLOSER, never past the size the flat scenes show a person at. */
const CLOSER = { reel: 1.3, episode: 1.06 };
const personOf = (place: Place | null, format: Format) => place?.person ?? (place ? 0.6 * Math.min(format.width, format.height) : PEEP * STAGE[format.id].scale);
const cameraOf = (place: Place | null, format: Format) =>
  Math.max(1, Math.min(CLOSER[format.id], (PEEP * STAGE[format.id].scale) / personOf(place, format)));
/** Frames: the first layer starts before the sequence does (a first frame is never an empty board),
 * each layer takes EACH frames, the last one starts SPAN frames after the first. */
const REVEAL = { before: 6, each: 8, span: 16 };
const REVEALED = REVEAL.span + REVEAL.each - REVEAL.before;

type Ink = { line?: ChalkName; hatch?: ChalkName | "yellow-dense"; fill: boolean };
type Drawn = Layer & { ink?: Ink };

/** How chalk draws a layer, by its role (the prototype's choices). The floor has its line too: the
 * places of places.ts carry no inner lines, the edge of each layer is all there is. */
const inkOf = (layer: Drawn): Ink => {
  if (layer.ink) return layer.ink;
  switch (layer.role) {
    case "sky":
      return { hatch: "blue", fill: false };
    case "far":
      return { line: "white", fill: false };
    case "accent":
      return layer.tint ? { line: "pink", hatch: "pink", fill: true } : { line: "yellow", fill: true };
    case "light":
      return { line: "yellow", hatch: "yellow", fill: false };
    default:
      return { line: "white", fill: true };
  }
};

type Ids = { outline: (name: ChalkName) => string; rough: string; hatch: (name: string) => string };

const idsOf = (prefix: string): Ids => ({
  outline: (name) => `${prefix}-o-${name}`,
  rough: `${prefix}-c`,
  hatch: (name) => `${prefix}-h-${name}`,
});

/** One group: the slate's colour inside (it hides what is behind), hatching, then the chalk outline. */
const Group: React.FC<{ shapes: Shape[]; ink: Ink; ids: Ids }> = ({ shapes, ink, ids }) => (
  <>
    {ink.fill ? <Shapes shapes={shapes} fill={BOARD} /> : null}
    {ink.hatch ? (
      <g filter={`url(#${ids.rough})`}>
        <Shapes shapes={shapes} fill={`url(#${ids.hatch(ink.hatch)})`} />
      </g>
    ) : null}
    {ink.line ? (
      <g filter={`url(#${ids.outline(ink.line)})`}>
        <Shapes shapes={shapes} fill="#fff" />
      </g>
    ) : null}
  </>
);

const LayerArt: React.FC<{ layer: Drawn; ids: Ids }> = ({ layer, ids }) => {
  const ink = inkOf(layer);
  return (
    <g>
      {groups(layer).map((g, i) => (
        <Group key={i} shapes={g} ink={ink} ids={ids} />
      ))}
      {layer.lines ? (
        <g filter={`url(#${ids.rough})`}>
          {layer.lines.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={CHALK.white} strokeWidth={3.5} strokeLinecap="round" opacity={0.85} />
          ))}
        </g>
      ) : null}
    </g>
  );
};

/** The filters and hatchings of a scene, with ids of its own (two scenes are on screen during a
 * transition). */
const SceneDefs: React.FC<{ ids: Ids; seed: number; region: Region }> = ({ ids, seed, region }) => (
  <defs>
    {(Object.keys(CHALK) as ChalkName[]).map((name, i) => (
      <OutlineFilter key={name} id={ids.outline(name)} color={CHALK[name]} seed={11 + i * 7 + (seed % 5)} region={region} />
    ))}
    <RoughFilter id={ids.rough} seed={3 + (seed % 7)} region={region} />
    {(Object.keys(CHALK) as ChalkName[]).map((name) => (
      <Hatch key={name} id={ids.hatch(name)} color={CHALK[name]} />
    ))}
    <Hatch id={ids.hatch("yellow-dense")} color={CHALK.yellow} gap={11} angle={-30} opacity={0.7} />
  </defs>
);

/** What the place adds to its layers: its lit windows (white frames, a touch of blue: the light) and
 * its beam of light. */
const extras = (place: Place): Drawn[] => {
  const out: Drawn[] = [];
  if (place.lit) {
    const over = place.layers.filter((l) => Math.abs(l.depth - place.lit!.depth) < 0.03 || l.depth <= place.lit!.depth);
    const depth = Math.max(...over.map((l) => l.depth), place.lit.depth);
    out.push({ id: "lit", role: "object", depth: depth + 0.001, shapes: place.lit.shapes, ink: { line: "white", hatch: "blue", fill: false } });
  }
  if (place.beam) out.push({ id: "beam", role: "light", depth: 0.6, shapes: [{ kind: "path", d: place.beam.d }], ink: { hatch: "yellow-dense", fill: false } });
  return out;
};

type Item = { depth: number; layer?: Drawn; figure?: Placed };

/** The scene's characters: sitting ones on the place's seats (their hips on the seat, their feet
 * where their legs reach), the others standing on the floor line, spread as in the flat scenes; a
 * bust in front of everything.
 * An episode written for a silhouette style has no Open Peeps figure to trace (its characters come
 * with an empty box): previewed in chalk, its people are the paper silhouettes, outlined as the
 * prototype outlined them, where the paper style puts them. */
const figuresOf = (chars: Character[], place: Place | null, format: Format): Item[] => {
  const { floorY } = STAGE[format.id];
  const scale = personOf(place, format) / PEEP;
  const w = format.width;
  const u = Math.min(w, format.height);
  const seats = place ? [...place.seats] : [];
  const depth = place?.figureDepth ?? 0.5;
  const standing = chars.filter((c) => c.kind !== "sitting");
  return chars.flatMap((c, i): Item[] => {
    const x = (w * (i + 1)) / (chars.length + 1);
    const seat = c.kind === "sitting" ? seats.shift() : undefined;
    if (c.box[3] === 0) {
      const role = MAIN.has(c.id) ? "accent" : "figure";
      if (seat) {
        const fig = silhouette(c.id, "sitting", seat.x, floorY, 0.6 * u, seat.dir, seat.y);
        return [{ depth: (seat.hidden ? 0.58 : depth) + 0.001 * i, layer: { id: `fig-${c.id}`, role, depth, shapes: fig.body, over: fig.arms } }];
      }
      const k = standing.indexOf(c);
      const sx = (w * (k + 1)) / (standing.length + 1) + (seats.length === 0 && standing.length === 1 ? 0.12 * u : 0);
      const dir = standing.length === 1 ? -1 : sx < w / 2 ? 1 : -1;
      const fig = silhouette(c.id, c.pose, sx, floorY, 0.6 * u, dir);
      const rug: Shape = { kind: "path", d: `M${sx - 0.2 * u} ${floorY + 0.02 * u} H${sx + 0.24 * u} L${sx + 0.21 * u} ${floorY - 0.015 * u} H${sx - 0.17 * u} Z` };
      return [
        // Someone praying stands on a prayer rug (as in the paper style): it says what the pose is.
        ...(c.pose === "praying" ? [{ depth: depth + 0.001 * i, layer: { id: `rug-${c.id}`, role: "accent" as const, tint: 1, depth, shapes: [rug] } }] : []),
        { depth: depth + 0.001 * i + 0.0005, layer: { id: `fig-${c.id}`, role, depth, shapes: fig.body, over: fig.arms } },
      ];
    }
    // A bust is the camera on a face: the flat scenes' size whatever the place (the camera stays put then).
    if (c.kind === "bust") return [{ depth: 2 + 0.001 * i, figure: { c, x, floorY: format.height + 20, scale: STAGE[format.id].scale * BUST_ZOOM } }];
    if (seat) {
      const hips = placement(c, 0, 0, scale).seatHeight;
      return [{ depth: (seat.hidden ? 0.58 : depth) + 0.001 * i, figure: { c, x: seat.x, floorY: seat.y + hips, scale } }];
    }
    return [{ depth: depth + 0.001 * i, figure: { c, x, floorY, scale } }];
  });
};

const Plane: React.FC<{ view: string; w: number; h: number; children: React.ReactNode }> = ({ view, w, h, children }) => (
  <svg width={w} height={h} viewBox={view} style={{ position: "absolute", inset: 0, willChange: "transform" }}>
    {children}
  </svg>
);

/** A place of the catalog in chalk, with the scene's characters. Background `plain` (or none): the
 * bare board and the characters. */
export const ChalkScene: React.FC<KitProps> = ({ scene, format }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const lead = useContext(AudioStart);
  const w = format.width;
  const h = format.height;
  const { floorY } = STAGE[format.id];
  const id = scene.visual.background ?? "plain";
  const build = id === "plain" ? null : PAPER_PLACES[id];
  if (id !== "plain" && !build) throw new Error(`background '${id}' has no chalk drawing: no place of that name in src/styles/paper/places.ts`);
  const place = build ? build(w, h, floorY) : null;
  const prefix = idOf("cks", scene.id);
  const seed = seedOf(scene.id);
  const layers: Drawn[] = place ? [...place.layers, ...extras(place)] : [];
  const figures = figuresOf(scene.visual.characters, place, format);
  const items: Item[] = [...layers.map((layer): Item => ({ depth: layer.depth, layer })), ...figures].sort((a, b) => a.depth - b.depth);
  const step = items.length > 1 ? REVEAL.span / (items.length - 1) : 0;
  const shown = (i: number) => eased(frame, i * step - REVEAL.before, REVEAL.each);
  const drawn = lead === 0 || frame >= REVEALED;
  const view = `0 0 ${w} ${h}`;
  const region = frameRegion(w, h);
  const planes: React.ReactNode[] = [];
  if (drawn) {
    // Once drawn, the layers between two characters are one picture.
    let run: Drawn[] = [];
    const flush = (key: string) => {
      if (run.length === 0) return;
      const part = run;
      run = [];
      const ids = idsOf(`${prefix}-${key}`);
      planes.push(
        <Plane key={key} view={view} w={w} h={h}>
          <SceneDefs ids={ids} seed={seed} region={region} />
          {part.map((layer) => (
            <LayerArt key={layer.id} layer={layer} ids={ids} />
          ))}
        </Plane>,
      );
    };
    items.forEach((item, i) => {
      if (item.layer) run.push(item.layer);
      else {
        flush(`run-${i}`);
        planes.push(
          <Sweep key={`fig-${item.figure!.c.id}`} fill>
            <ChalkFigure p={item.figure!} audio={scene.media?.file ?? null} prefix={prefix} clip={{ w, h }} />
          </Sweep>,
        );
      }
    });
    flush("run-end");
  } else {
    items.forEach((item, i) => {
      planes.push(
        item.layer ? (
          // Its own filters: each layer is its own picture while it appears.
          <Sweep key={`layer-${item.layer.id}`} fill from={1 - shown(i)}>
            <Plane view={view} w={w} h={h}>
              <SceneDefs ids={idsOf(`${prefix}-l${i}`)} seed={seed} region={region} />
              <LayerArt layer={item.layer} ids={idsOf(`${prefix}-l${i}`)} />
            </Plane>
          </Sweep>
        ) : (
          <Sweep key={`fig-${item.figure!.c.id}`} fill from={1 - shown(i)}>
            <ChalkFigure p={item.figure!} audio={scene.media?.file ?? null} prefix={prefix} clip={{ w, h }} />
          </Sweep>
        ),
      );
    });
  }
  const push = interpolate(frame, [0, durationInFrames], [1, 1.035]);
  // The camera comes closer from the floor line, turned toward the people: someone sitting near an
  // edge of the place (the desk of the office, a chair of the café) stays in the picture.
  const people = figures.flatMap((f) => (f.figure ? [f.figure] : []));
  const zoom = people.some((f) => f.c.kind === "bust") ? 1 : cameraOf(place, format);
  const centre = people.length ? people.reduce((sum, f) => sum + f.x, 0) / people.length : w / 2;
  const kept = Math.min(0.7 * w, Math.max(0.3 * w, centre));
  const originX = zoom > 1 ? Math.min(w, Math.max(0, (centre * zoom - kept) / (zoom - 1))) : w / 2;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: BOARD }}>
      <PeepStyles />
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <PeepFilters prefix={prefix} seed={seed} figures={figures.flatMap((f) => (f.figure ? [f.figure] : []))} />
        </defs>
      </svg>
      {/* The camera's distance: place and people together, from the floor line under the middle. */}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `${originX.toFixed(1)}px ${floorY}px` }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${push.toFixed(5)})`, transformOrigin: "50% 62%", willChange: "transform" }}>{planes}</div>
      </div>
      {/* The slate's grain and dust lie over the drawing too: inside a shape the board is the same
          board (the prototype's shapes were cleaner than the slate around them). */}
      <Dust w={w} h={h} seed={seed} id={`${prefix}-dust`} wipes={wipesOf(w, h, seed, place ? 0 : 2)} strength={place ? 0.6 : 1} />
      <Frame w={w} h={h} />
    </div>
  );
};
