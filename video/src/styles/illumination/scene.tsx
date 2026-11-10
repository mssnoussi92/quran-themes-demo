// The « scene » template in the illumination style: the page, and on it the place of the scene in
// a pointed arch, its spandrels patterned in gold on lapis (the prototype's two shots, for any place
// of the catalog and both formats). The painting is drawn once and only pushed in (a CSS transform);
// what moves is the glint on the gold, the lit windows (opacity), the small rosette under the arch.
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { FormatId } from "../../formats";
import type { KitProps } from "../kit";
import { archPath, Border, FRAMES, Glint, glintAt, Gold, Khatam, Parchment, Patch, Rosette, Still, thickness, type Frame } from "./ornament";
import { modelOf, PaintDefs, Plane, type PlaceBox } from "./paint";
import { C, seedOf } from "./palette";

type Geometry = {
  frame: Frame;
  /** The lapis block the arch is cut in. */
  block: { x: number; y: number; w: number; h: number };
  arch: { x0: number; x1: number; apex: number; spring: number; bottom: number };
  /** Where the characters stand (the same line as the flat and paper scenes: subtitles come under). */
  floor: number;
  /** The small rosette on the page under the arch (reel: the page goes on below the subtitles). */
  medallion: { cx: number; cy: number; r: number } | null;
};

/** Reel: the arch takes nearly the page's width (the frame must leave the scene room on a vertical
 * screen), its point just under the top safe area, so that the signature sits on the dark spandrel;
 * its foot under the floor line, where the subtitles come. Episode: a wide, low arch flush with the
 * border, on a plinth; the subtitles are inside it, as in the other styles. Its rise is small: what a
 * place hangs high and off-centre (a window, a curtain rod) must stay under the curve. */
const GEOMETRY: Record<FormatId, Geometry> = {
  reel: {
    frame: FRAMES.reel,
    block: { x: 70, y: 232, w: 940, h: 1190 },
    arch: { x0: 86, x1: 994, apex: 264, spring: 664, bottom: 1406 },
    floor: 1360,
    medallion: { cx: 540, cy: 1672, r: 58 },
  },
  episode: {
    frame: FRAMES.episode,
    block: { x: 40, y: 40, w: 1840, h: 1000 },
    arch: { x0: 54, x1: 1866, apex: 54, spring: 184, bottom: 968 },
    floor: 880,
    medallion: null,
  },
};

/** The frame the place is laid out for: the arch's opening and a little more (the push-in never
 * shows an edge). The places take their unit from the short side of that frame: in a reel its width
 * (and what a place puts at the very front, a plant, rocks, falls under the arch's foot); in 16:9 its
 * height, kept low enough for a window to stay under the arch's curve. */
const placeBox = (g: Geometry, id: FormatId): PlaceBox => {
  const x = g.arch.x0 - 8;
  const w = g.arch.x1 - g.arch.x0 + 16;
  const y = g.arch.apex - 6;
  const f = g.floor - y;
  const h = id === "reel" ? f + 0.52 * w : g.arch.bottom + 9 - y;
  return { x, y, w, h, f, person: 0.6 * Math.min(w, h) };
};

/** The page around the painting, drawn once and kept as one layer over it: the parchment (open on
 * the block the arch is cut in), the spandrels, the gold line of the arch, the border. */
const ArchPage = React.memo<{ id: FormatId; w: number; h: number; prefix: string }>(({ id, w, h, prefix }) => {
  const g = GEOMETRY[id];
  const { block: b, arch: a } = g;
  const arch = archPath(a.x0, a.x1, a.apex, a.spring, a.bottom);
  const gold = `url(#${prefix}-pgold)`;
  const flush = b.x <= thickness(g.frame);
  return (
    <Still>
      <Parchment hole={[b.x, b.y, b.w, b.h]} />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <Gold id={`${prefix}-pgold`} />
          <Khatam id={`${prefix}-spandrel`} size={56} ground={C.lapis} star="#234680" line="#a88f4f" width={1.3} dot={false} x={w / 2 - 28} y={b.y + 6} />
        </defs>
        <path d={`M${b.x} ${b.y} H${b.x + b.w} V${b.y + b.h} H${b.x} Z ${arch}`} fill={`url(#${prefix}-spandrel)`} fillRule="evenodd" />
        {flush ? null : (
          <>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke={C.ink} strokeWidth={8.5} strokeOpacity={0.75} />
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke={gold} strokeWidth={6} />
          </>
        )}
        <path d={arch} fill="none" stroke={C.ink} strokeWidth={13} strokeLinejoin="round" />
        <path d={arch} fill="none" stroke={gold} strokeWidth={10} strokeLinejoin="round" />
      </svg>
      <Border w={w} h={h} f={g.frame} prefix={prefix} />
    </Still>
  );
});

export const Scene: React.FC<KitProps> = ({ scene, format }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const g = GEOMETRY[format.id];
  const { width: w, height: h } = format;
  const prefix = `il-${scene.id}`;
  const seed = seedOf(scene.id);
  const t = frame / fps;
  const visual = scene.visual;
  const model = useMemo(() => modelOf(visual, placeBox(GEOMETRY[format.id], format.id), prefix), [visual, format.id, prefix]);
  const push = interpolate(frame, [0, durationInFrames], [1, 1.035]);
  const glint = glintAt(frame, fps, seed);
  const a = g.arch;
  const m = g.medallion;
  const b = g.block;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, overflow: "hidden", background: C.lapis }}>
        {/* The painting: drawn once, then only pushed in. */}
        <div
          style={{
            position: "absolute", left: -b.x, top: -b.y, width: w, height: h, willChange: "transform",
            transform: `scale(${push.toFixed(4)})`, transformOrigin: `${w / 2}px ${g.floor}px`,
          }}
        >
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <PaintDefs prefix={prefix} sky={model.sky} />
          </svg>
          <Plane model={model} prefix={prefix} w={w} h={h} part="back" />
          {model.lit.length
            ? ([0, 1, 2] as const).map((k) => (
                // The lit windows, in three groups that dim and brighten in turn.
                <div
                  key={k}
                  style={{
                    position: "absolute", left: model.litBox[0], top: model.litBox[1], width: model.litBox[2], height: model.litBox[3],
                    willChange: "opacity", opacity: Number((0.7 + 0.3 * Math.sin(t * 0.9 + k * 2.1)).toFixed(3)),
                  }}
                >
                  <Plane model={model} prefix={prefix} w={w} h={h} part={k} />
                </div>
              ))
            : null}
          {model.split < model.items.length ? <Plane model={model} prefix={prefix} w={w} h={h} part="front" /> : null}
        </div>
      </div>
      <ArchPage id={format.id} w={w} h={h} prefix={prefix} />
      {m ? (
        <Patch x={m.cx - m.r - 6} y={m.cy - m.r - 6} w={2 * m.r + 12} h={2 * m.r + 12} layer>
          <Rosette cx={m.cx} cy={m.cy} r={m.r} n={8} step={3} p={interpolate(t, [0.3, 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} stroke={C.gold} width={3} opacity={0.85} />
        </Patch>
      ) : null}
      {glint !== null ? (
        <Glint
          w={w} h={h} f={g.frame} p={glint} prefix={prefix}
          lines={[{ d: archPath(a.x0, a.x1, a.apex, a.spring, a.bottom), width: 10 }]}
          around={[a.x0 - 8, a.apex - 8, a.x1 - a.x0 + 16, a.bottom - a.apex + 16]}
        />
      ) : null}
    </AbsoluteFill>
  );
};
