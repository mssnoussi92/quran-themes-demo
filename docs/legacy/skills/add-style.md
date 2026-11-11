---
name: add-style
description: Add a place (a background of the catalog) or a whole visual style to the videos of quran-themes-demo - draw the place once as layers that every style renders its own way, or write a new style as a kit (its ground, its scene, the frame of a verse and a hadith, its hand for the narration, its thumbnail), look at it on stills and on a real reel previewed in that style, register it (catalog, schema, docs/styles.md) and put it in front of the owner, who validates every drawing. Use when an episode needs a place its style does not draw, when the owner asks for a new look or picks one of the styles in reserve, and before writing an episode in a style nothing was rendered in yet.
---

# A new place, a new style

Closed catalogs (`CLAUDE.md`): an episode names a place and a style, it never describes a drawing.
A place or a style enters the catalog drawn, looked at, then validated by the owner on the picture
(`<style>_validated_by`), never by you. What a style may not touch is in `docs/styles.md`,
« Ce qui ne change jamais »: the text of a verse or a hadith and its layout, the reference lines,
the signature, the subtitles, the safe areas; and nobody draws a prophet, a Companion or a known
person in any style (a name card).

## Look before you draw

```bash
cd video && export REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npm run data                                   # content/ -> public/data/
node scripts/frames.ts tawba tawba-03          # the frame each scene starts at, its middle, its end
npx remotion still Reel916 out/x.png --frame=160 --props='{"episode":"tawba","reel":"tawba-03","format":"reel","style":"chalk","data":null}'
npx remotion still Episode169 out/y.png --frame=160 --props='{"episode":"tawba","reel":"tawba-03","format":"episode","style":"chalk","data":null}'
npx remotion still Thumbnail169 out/t.png --props='{"episode":"tawba","layout":null,"style":"chalk","data":null}'
```

The `style` prop draws any reel in another style than its episode's: a preview, never a release
(`render.yml` does not pass it). A flat episode previewed in a silhouette style keeps its Open
Peeps poses: a pose silhouettes do not have falls back to standing. Real timings need the audio:
`python3 tools/audio/build.py --episode tawba --require-locked` (locked takes, the recitation and
the readings downloaded), then `npm run data` again; without it the cards show « DRAFT » and a
title card appears in one piece. Open the PNGs and look at them twice: full size, and as on a
phone (text readable? lines thick enough? anything under the subtitles or the signature?).

## A place

1. **Once, as layers** (`video/src/styles/paper/places.ts`, the geometry every layered style
   draws: paper, chalk, illumination): a builder `(width, height, floorY) => Place` for the reel
   (1080x1920, floor at 1360) and the episode (1920x1080, floor at 880), from `u` = the short
   side. Each `Layer` has a role (`sky`, `far`, `wall`, `object`, `floor`, `figure`, `accent`,
   `light`, `front`), a depth from 0 (far) to 1 (near), shapes, and optionally `lines` (what a
   line style adds inside) and `over`. `seats` for sitting people, `figureDepth` where they stand.
   No person in a place. Never change a builder that exists: its look is validated.
   The flat style draws its places apart (`video/src/backgrounds/`).
2. **In the catalog**: `content/backgrounds.yaml`, a description and `styles: [...]` with every
   style you looked at it in (a style missing there is refused by `validate.py`, with the
   episode). No `validated_by` of any kind.
3. **Look at it in each style listed**, both formats, with people standing and sitting; then the
   board (`npm run still -- BackgroundSheet ../docs/backgrounds.png --frame=40`).
4. The owner sees it in the candidate render: the list « à vérifier » names each place not yet
   validated in the episode's style, and `finalize.py validate` writes `<style>_validated_by` on
   their word.

## A style

1. **Its sheet first** (`docs/styles.md`, the model of the others: what it is and is not,
   materials, colours, text, movement, native gestures, pitfalls), and a board of two or three
   shots for the owner to choose on (`video/src/styles/StyleLab.tsx`). A style nobody chose is
   not built.
2. **A kit** (`video/src/styles/kit.ts`, registered in `kits.ts`): `Backdrop` (the ground behind
   the cards), `Scene` (a place and its people), `Panel` and `ink` (the frame and colours of a
   verse, a hadith, a name; the texts themselves are drawn by `templates/cards.tsx`, never
   filtered or distorted), `Title` (the narration line in the style's hand, each phrase when the
   voice reaches it), `Thumb`. People: the Open Peeps figures (`characters/Character.tsx`, with
   their faces) or the silhouettes (`paper/silhouettes.ts`, no face; then add the style to
   `SILHOUETTE_STYLES` in `video/scripts/prepare.ts` and `scripts/validate.py`).
3. **Render cost**: every frame drawn alone (no state, `rand(seed)`), what does not move drawn
   once, movement by CSS transform, opacity and clip; no full-frame SVG noise on something that
   changes every frame (the paper style was seven times slower than the flat one before that).
   Measure seconds per frame on a whole reel and write it in the sheet.
4. **Register it**: the `style` enum of `schemas/episode.schema.json` and `VisualStyle`
   (`video/src/types.ts`), `STYLE_OF_FORMAT` in `scripts/validate.py` if a format takes it,
   `STYLE_NAMES` in `video/scripts/review.ts`, `styles` of each place it draws in
   `content/backgrounds.yaml`, the table of `docs/styles.md`, the skill `choose-format`.
5. **In front of the owner**: a real reel previewed in the style (an MP4 they can play on their
   phone) beside the same reel as published, and the thumbnail. Their word on the style goes in
   `docs/styles.md`; each place is validated in the first candidate render that uses it.

## Never

- A drawing validated by you, or `validated_by` typed by hand.
- A filter, a texture or a pattern on the text of a verse or a hadith.
- A face in a silhouette style; a person in a place; a named person drawn anywhere.
- A release render with the `style` prop.
