// Colours of the illumination style (docs/styles.md): a parchment page, gold and lapis, and the jewel
// colours of painted manuscripts, flat, under a fine ink outline. The same values as the prototype
// the owner chose (styles/Illumination.tsx).
export const C = {
  parchment: "#f1e5c6",
  ivory: "#f8f1de",
  ink: "#2b211a",
  gold: "#c9a24a",
  goldLight: "#f3dc8e",
  goldDark: "#9c7428",
  lapis: "#1f3d73",
  lapisLight: "#2c5295",
  night: "#16294f",
  turquoise: "#2b8a8a",
  vermilion: "#c2452d",
  malachite: "#3e7b4f",
  ochre: "#d39b4a",
  sand: "#d8b07a",
  rose: "#dca487",
  lilac: "#b493b4",
  plum: "#7c4a6b",
  plumDark: "#5e3552",
  shade: "#3a2238",
  sienna: "#a8643f",
  wood: "#6d3f2a",
};

/** Gold leaf as a CSS background: light where the page catches the lamp, darker at the bottom. */
export const GOLD_CSS = "linear-gradient(180deg, #f3dc8e 0%, #d9b15a 42%, #b8892f 100%)";

/** Ink of what templates/cards.tsx writes on the ivory of a framed page (StyleKit.ink). Contrast on
 * the ivory (#f8f1de), WCAG: text 15.0, muted 6.4, accent 9.4, highlight 5.1 (and 2.9 against the
 * ink of the other words, with the hue: the rubrication of manuscripts, red among black). */
export const INK = {
  text: C.ink,
  muted: "#6b5338",
  accent: C.lapis,
  highlight: "#b93a22",
};

/** Arabic marks have no width: not counted when a line's width is estimated. */
export const MARKS = /[ً-ْٰـ]/g;

/** A number from a scene id: what varies from one page to the next (rosette, glint) comes from it. */
export const seedOf = (id: string): number => [...id].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 9973, 7);
