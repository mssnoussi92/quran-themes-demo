---
name: new-scene
description: Make the picture and the sound of a story for the film-and-shorts model of quran-themes-demo (docs/model.md) - choose a filmed clip the owner approved, place it in the 9:16 and the 16:9 frame, draw over it the backlit silhouettes of what the text says (things and places, never a person), one state of the drawing per scene of the script, register it for the short and for the film, look at it on stills before any voice, then choose the field recording that plays under the narration and never under a recitation. Use for every new short, when a script gains a scene its drawing does not have, and when the owner finds a picture or an ambience weak.
---

# A new scene: its clip, its drawing, its sound

The look the owner chose among three (2026-11-11) and validated on three stories: **a real filmed
clip, and the drawn silhouette of the story over it**. The clip says where and when (a sea at dusk, a
full moon, a sky at sunset); the drawing says what happened (a boat torn open, a house with one
window lit, a wall about to fall). Read the three drawings before you draw: `video/src/trial/Boat.tsx`,
`Home.tsx`, `Wall.tsx`, and how they are staged in `Trial.tsx` (`BoatPicture`…) and `Film.tsx`
(`BoatWide`…). Fields and catalogs: `docs/model.md`.

## What may be drawn

- **Things and places only.** Nobody: not a prophet, not a Companion, not a known person (mandatory
  rule), and in this model not an unnamed person either. A father and a mother are a house with a lit
  window; two orphans are the glow of what is kept for them; a king is his ships on the horizon.
- **Never the act of a killing**, never paradise, hell, the Last Day or an angel (mandatory rule):
  the text and the recitation carry those.
- A living creature only when the text names it and it is not a person (the sparrow of Bukhari 3401
  on the edge of the boat).

## 1. The clip

- From the list the owner approved (`docs/model.md`, « Clips filmés »: nature only, no people, no
  animal, no text, checked frame by frame). A clip outside the list is shown to the owner first, with
  its Pixabay page; never one with a person.
- One clip per story; the film reuses the clips of its shorts. Choose it for the hour and the mood of
  the story, and for a calm, dark area where the text will sit.
- Fetch it (it is never committed; the key is the environment's `PIXABAY_API_KEY`, never printed):

  ```bash
  python3 tools/trial/clip.py --trial <id> --out <scratchpad>/clips/<id>.mp4
  ffmpeg -i <clip> -vf scale=-2:1440 -an <clip-1440.mp4>      # a 4K clip: reduce it first
  ```

  It needs `clip: { source: pixabay, id: <n>, … }` in `content/trial/<id>.yaml` already.

## 2. Place it

`clip` of the short says how the clip sits in the 9:16 frame, and `landscape` in the film's 16:9:

| Field | Effect | Seen on |
| --- | --- | --- |
| `position` | where the wide clip is cropped (« 62% 50% ») | the boat: the pink of the horizon behind the sail |
| `shift` | pixels down (or up, negative): the top of the frame is for the text, so the moon goes down 520, the sunset's ground goes up 400 | the boy, the wall |
| `brightness` | 0.8 by default; a bright sky is darkened (0.62) until white text reads on it | the wall |
| `ground` | the colour the clip fades into where it no longer covers the frame | the boy, the wall |
| `horizon` | the height of the horizon: the picture grows slowly around it, and the drawing stands on it | all |
| `rate` | playback speed (0.85): slower is calmer; an accelerated clip may need less | the boat |
| `landscape.side` | the side of the drawing in the film; the text takes the other | all |

The frame has reserved places: the Arabic line from 340 to 790 px of height in a short, the
translation from 1490, the recitation credit at 1716, the signature at the top right; in the film, the
chapter at the top left and the text column on the side the drawing leaves free.

## 3. Draw

One file per story, `video/src/trial/<Story>.tsx`, exporting its pieces as SVG components. Then two
stagings that place those pieces:

- in `Trial.tsx`, a `Drawn` for the 9:16 frame (1080x1920), registered in `PICTURES` under the
  short's id;
- in `Film.tsx`, its wide version for 1920x1080, on its `side`, registered in `WIDE` under the same id.

A `Drawn` receives `t` (seconds, for slow life: a boat that rocks, a window that flickers, a glow
that breathes), `show(id)` (how visible the scene `id` is, 0 to 1: scenes cross-fade), `since(id)` (when
that scene began, to start a movement there) and `horizon`. **One state of the drawing per `scene` of
the script**: `<g opacity={show("holed")}>…</g>`. A scene the drawing does not know shows the clip
alone, which is a scene too (`sea`, `sky`, `land`: the viewer's own life in the example).

How the three were drawn, and what to keep:

- **Backlit**: near-black shapes (`#05060d`), a thin line of light on the edge that faces the sun or
  the moon, in the colour of that light; warm light only where the story has it (a window, gold).
- **Standing in the picture**: a soft shadow or a reflection under the thing, the land drawn over the
  bottom of the clip when the clip has no ground of its own (`Land` of `Home.tsx`).
- **Large**: the subject fills a third of the width at least; it is read on a phone, and on the cover
  at the size of a thumbnail.
- **The scene changes when the meaning does**, not for decoration: the boat torn open, then the
  king's ships behind it when the verse names the king, then the boat going on its way; one window lit,
  then two when the verse says what the parents are given.
- Every frame is drawn from `t` alone (no state, no random without a seed): the render draws frames
  in any order.

Known weak points of the first film, to avoid: a thing that sits on the water instead of in it; the
same thing at two places in two scenes that follow (the cross-fade shows it twice: keep its place, or
move it); a line of text over the brightest part of the clip (the moon).

## 4. Look, before any voice

```bash
uv run --with pyyaml --with numpy python3 tools/trial/prepare.py --trial <id> --draft --clip <clip>
cd video && export REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion still Trial916 out/<id>-<n>.png --frame=<start*30+45> --props='{"trial":"<id>","voice":"X","data":null}'
npx remotion still TrialCover916 out/<id>-cover.png --frame=45 --props='{"trial":"<id>","voice":"X","data":null}'
```

One still per scene (the starts are in `video/public/trial/<id>-X.json`), frame 0 on its own, and the
cover. Open each one, full size and as on a phone: does the drawing say the line without the sound;
does any text cross it; is the first frame a reason to stay? For the film: `prepare.py --film <film>
--draft`, then `TrialFilm169` stills with `{"film":"<film>","voice":"X","data":null}`.

The owner sees these stills with the script, before the voice, and validates the pictures on the
videos.

## 5. The sound under the narration

One field recording per picture, said in the short's `ambience` (`docs/model.md`, « Ambiances »):
`source: bigsoundbank`, the recording's `id`, `title`, `author`, `licence`, `page`, the stretch that is
looped (`from`, `seconds`) and its `level`.

- **Choose** what the picture would sound like, calm and even: small waves heard from ten metres
  rather than a wave breaking at the microphone. On BigSoundBank every free sound is CC0; read
  « License CC0 » and the description on the recording's own page (voices, cars, dogs?) before you
  take it. Another source needs a licence that allows publishing, read on the page, and no payment.
- **The stretch**: download it once (`tools/trial/ambience.py` does, into `build/trial/ambience/`),
  measure its level every ten seconds, and take sixty to a hundred seconds with no event in them.
- **The level**: -36 LUFS, twenty under the voice; -38 for a high-pitched sound (crickets). It is the
  number to change when the owner finds it loud or faint.
- **Never under a recitation nor a hadith**: `prepare.py` and `film.py` build the bed with every
  verse and reading as silence, and `ambience.py` stops if one sample sounds there. Do not go round
  it.
- You cannot hear it. Say so to the owner, and say which choices you trust least (a high-pitched
  sound under a grave story, a wind that can pass for hiss): they judge it by ear on the videos.

## 6. Record it

- The clip and the recording in the catalogs of `docs/model.md` (what it shows or sounds like, where
  it is used).
- Nothing is validated by you: the owner's « je valide » on the videos covers the pictures and the
  ambience they saw and heard (`validated`, `what`).
