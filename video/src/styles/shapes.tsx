// Drawing helpers shared by the styles of the lab (see geometry.ts).
import React from "react";
import type { Layer, Shape } from "./geometry";

export const W = 1080;
export const H = 1920;

/** One shape as an SVG element; `props` (fill, stroke, filter…) go on the element. */
export const ShapeEl: React.FC<{ s: Shape } & React.SVGProps<SVGElement>> = ({ s, ...props }) => {
  const p = props as Record<string, unknown>;
  switch (s.kind) {
    case "rect":
      return (
        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0}
          transform={s.rotate ? `rotate(${s.rotate.join(" ")})` : undefined} {...p} />
      );
    case "circle":
      return <circle cx={s.cx} cy={s.cy} r={s.r} {...p} />;
    case "ellipse":
      return (
        <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
          transform={s.rotate ? `rotate(${s.rotate} ${s.cx} ${s.cy})` : undefined} {...p} />
      );
    case "path":
      return <path d={s.d} fillRule="evenodd" {...p} />;
  }
};

/** Every shape of a list, with the same props. */
export const Shapes: React.FC<{ shapes: Shape[] } & React.SVGProps<SVGElement>> = ({ shapes, ...props }) => (
  <>
    {shapes.map((s, i) => (
      <ShapeEl key={i} s={s} {...props} />
    ))}
  </>
);

/** Mix two "#rrggbb" colours. */
export const mix = (a: string, b: string, t: number): string => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};

/** A seeded random number in [0, 1) (deterministic: every frame can be rendered alone). */
export const rand = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** The groups a line style outlines one by one: the layer, then what is drawn over it. */
export const groups = (layer: Layer): Shape[][] => (layer.over ? [layer.shapes, layer.over] : [layer.shapes]);

/** The page's signature, the same in every style (an invariant). */
export const Handle: React.FC<{ color: string; shadow?: string; font: string }> = ({ color, shadow, font }) => (
  <div
    style={{
      position: "absolute", top: 250, right: 90, fontFamily: font, fontSize: 30, color,
      padding: "6px 16px", borderRadius: 999, background: shadow ?? "rgba(0,0,0,0.22)", letterSpacing: 0.5,
    }}
  >
    @quran_words_daily
  </div>
);

/** The English subtitle, the same in every style (an invariant): Lora on a dark box, above the bottom safe zone. */
export const Subtitle: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 90, right: 90, bottom: 430, display: "flex", justifyContent: "center" }}>
    <div
      style={{
        fontFamily: "Lora", fontSize: 40, lineHeight: 1.3, color: "#f5f1e8", background: "rgba(6, 12, 20, 0.62)",
        padding: "12px 24px", borderRadius: 14, textAlign: "center",
      }}
    >
      {text}
    </div>
  </div>
);
