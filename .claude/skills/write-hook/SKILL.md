---
name: write-hook
description: Write or rewrite the hook (opening seconds) of a Quran-theme episode or reel in content/episodes/, in Egyptian Arabic for the VoiceTut narration with English subtitles, following the beats learned from the owner's reference video. Use for every new theme, every new reel, and whenever the owner finds an opening slow or flat.
---

# Write a hook

The owner rejected a first hook that described a scene in one long formal sentence
(« تَخَيَّلْ أَنَّكَ تَنْتَظِرُ نَتِيجَةَ تَحْلِيلٍ طِبِّيٍّ، وَالْوَقْتُ لَا يَمُرُّ… », 21 words, MSA, no
question, no promise) and shared a reference that hooks: an Egyptian animated explainer on du'a
(12 min, 2026-11-06; written analysis, shot by shot: `reference/dua-video-analysis.md`). Only its
hook was kept as a model, and only its techniques: never reuse its lines, drawings or structure
word for word.

## What the reference does (first 45 s of 12 min, 16:9)

| Time | What is said / shown | Technique to keep |
| --- | --- | --- |
| 0–4 s | "When he's afraid of something, you find him saying «يا رب» despite himself", over a man clinging to a plank in a storm | **Mirror**: a universal, involuntary behaviour the viewer recognises in himself; strong emotion on frame 1, no title, no greeting |
| 4–10 s | "And when he sees something he wants… «يا رب» again", over the same man looking at a car | **Contrast**: the same behaviour at the opposite pole (fear / desire, hardship / ease) |
| 10–13 s | "Something automatic, straight from the heart" | **Name it** in plain words |
| 13–21 s | "That's why the Prophet ﷺ said: «الدعاء هو العبادة»" | **One anchor**: a single source turns the observation into the theme |
| 21–28 s | «ليه؟» alone on screen, then a one-sentence answer | **One-word question**, answered at once |
| 28–38 s | "Lots of people love du'a but miss a lot of good: they don't know everything about it", over several faces making du'a | **Stakes**: what the viewer misses; many faces = "this is about you" |
| 38–42 s | Host: «خمس أشياء لا تعرفها عن الدعاء… الأخيرة سوف تبهرك!» | **Numbered promise + open loop** |
| 42 s | "First thing many people get wrong: …" | **Straight into the content** |

Delivery: everyday Egyptian (ليه؟ · دلوقتي · يا عم · تلاقي نفسك), sentences of 2 to 4 seconds
(≈ 2 words/s), one sentence per shot, the key word on screen, a cut every 2–4 s in the hook (one
every 6 s on average over the whole video), a calm voice that still sounds like talking to a friend.

Visual devices worth reusing (reference analysis, "Langage visuel"):
- A single word full screen for the question (« ليه؟ », « إزاي؟! ») → a `title-card` of one word.
- The answer written phrase by phrase as the voice says it → a `title-card` does it on its own: one
  phrase per line, cut after « ، … . ؟ : », each written as the voice reaches it. Punctuate the line
  where a new piece should appear (2 to 4 short pieces read best).
- Several faces in a row for the stakes ("this is about all of us").
- A generic, featureless character labelled « انت » that plays the viewer: the mirror beat made
  visible, cheap to animate, no identity. Not in `content/characters.yaml` yet: propose it to the
  owner (task 5) rather than drawing it freely.
- Real people (the Prophet ﷺ, Companions) only as a name medallion, never drawn: our `name-card`.

What we do **not** take from it:
- The narrator reads Quran (« فطرة الله التي فطر الناس عليها », « وأيوب إذ نادى ربه ») → for us a
  verse is only an `ayah-card`, whole ayah from the registry, with a real recitation.
- Quotes without a reference on screen → every quote is a registry id; the card shows its reference.
- "The last one will amaze you!" as bait → an open loop only if it is true and kept.
- 40 s before the first point → fine for 16:9, far too long for a reel.

## The beats

| Beat | Reel 9:16 (45–60 s in all) | Episode 16:9 (3–5 min) |
| --- | --- | --- |
| 1. Mirror: a question or an observation in the second person | 0–3 s, 4–8 words, first frame already emotional | 0–5 s |
| 2. Contrast: the same thing at the other pole | 3–8 s | 5–12 s |
| 3. Name it: a short reframing, its key word on screen | 8–11 s | 12–16 s |
| 4. Anchor: one source, by id | by 20 s at the latest | by 25 s |
| 5. «ليه؟» or another one-word question, then the answer | optional in a reel | yes |
| 6. Stakes: what the viewer misses without knowing it | optional in a reel | yes, with several faces |
| 7. Promise: what this video (or series) gives, with a number if true; open loop | the reel's last line points to the next reel | by 40 s, then go |

A reel can stop after beat 4 and spend the rest on its one idea (verse, hadith, answer), then end
on the open loop of beat 7 that leads to the next reel.

## Writing rules

- Egyptian colloquial Arabic for the narration (VoiceTut). Write it as spoken: short, concrete,
  second person (« إنت »), no formal connectors (« إذ إنّ », « حيث »).
- Spell what the voice must say: « صلى الله عليه وسلم » in the narration, « ﷺ » only in the English.
- One sentence = one scene = one image. 2 to 4 s each; the reel's first sentence is 3 s at most.
- A question in the first 3 s, or an image that asks one.
- Key word on screen: a short `title-card` scene (« ليه؟ », « مش عادة… عبادة ») reads better than a long one.
- English subtitles (`narration.en`): natural English, same length and rhythm, not word for word.
- Contrast the two poles of the theme (hardship / ease, fear / hope, sin / repentance…).
- No greeting, no channel name, no "in this video we will…" before beat 4.
- A new situation for each episode: the viewer follows the page. Already used: dua, waiting for a
  test result and wanting something badly (« لما تكون مستني نتيجة تحليل »); sabr, « اصبر » heard
  everywhere (« «اصبر»… سمعتها كام مرة؟ »); tawba, a sin and the shame of going back (« عملت ذنب…
  وحسيت إنك بعيد عن ربنا؟ »).
- Write for the ear of VoiceTut, which speaks Egyptian: ق becomes ء (« قريب » → « أريب »), ث becomes
  س, a ة before a pause can be heard as ت (« عادة »). Keep the screen correct and give the voice its
  own spelling in `say_ar` (up to two letters per word): every word the owner already corrected is
  in `content/pronunciation.yaml` (« توبت » for « تبت », « اُصْبُر »…), apply it from the first draft
  (skill `voice-spelling`). No guillemets « » in `say_ar`. Before a verse, the owner's formula:
  « قال ربنا سبحانه وتعالى: ».
- The reel's open loop to the next reel is a follow call (owner's choice, 2026-11-07, in place of
  « ده اللي جاي » / « أولها في الجاي »): « تابعنا عشان تعرف. » after the question that opens the next
  idea, « تابعنا عشان تعرف أولها. » after the promise of the three ideas. It ends the line, marked
  `reel_only_end`: the whole-episode videos stop the line before it. The last idea's reel says
  « دي الأخيرة » (no follow call: the conclusion comes next).

## Project rules (CLAUDE.md, non negotiable)

- **Quotes by id only.** Never type a verse or hadith in a narration. A hadith scene has a short
  introduction in `narration` (« النبي صلى الله عليه وسلم قال: ») and the voice then reads the
  hadith's words from the registry (`video/scripts/prepare.ts`). A verse is an `ayah-card` with
  `audio: recitation`, never read by the synthetic voice.
- **New source?** Add it to `content/sources/` as `proposed`, run `tools/sources/fetch.py`, and let
  the owner validate it; never validate a source yourself. Hadiths: `content/policy.yaml`.
- **Honest examples.** An invented situation is a typical one (« لما تكون… », « تخيّل… »), never "a
  man I know…". No figure without a source. A promise or a "the last one…" is only written if the
  video or the series delivers it.
- **No character for a prophet, a Companion or a known person**: a scene that names one lists it in
  `mentions` and uses a card (`source-card`, `name-card`, `title-card`), never a character.
- **Closed catalog.** Characters, poses and moods from `content/characters.yaml`; if the hook needs
  a pose that is missing (hands raised in du'a…), propose adding it to the catalog, do not describe a
  free drawing.

## Encode it

In `content/episodes/<theme>.yaml`, one scene per sentence, `id` `hook-1`, `hook-2`…, `role: hook`
(then `evidence`, `promise`, `outro`), `reel: <reel id>`, `audio: tts`, `narration: {ar, en}`.
Mirror and contrast scenes use `template: scene` with a catalog character and a catalog background
(`content/backgrounds.yaml`); key words use
`title-card`; the anchor is a `source-card` (hadith) or an `ayah-card` (verse). Example: reel
`dua-01` in `content/episodes/dua.yaml`.

## Check, then propose

1. Read each line aloud with a stopwatch: the reel's first line ≤ 3 s, each line ≤ 4 s.
2. The 3-second test: frame 1 plus the first line alone must make someone stay.
3. `uv run --with jsonschema --with pyyaml scripts/validate.py`
4. `cd video && npm run data`: check the estimated durations, then `npm run still` on the first
   frames, or a draft render (`npm run render -- Reel916 out/<reel>.mp4`).
5. Open or update a PR: the hook line by line with its beat, the sources used and their status,
   and what was not taken. The owner validates the script and the translation (design.md, step 3):
   on their word, record `validated_by: <owner>` on the reel; never set it yourself, and remove it
   whenever you change one of the reel's lines.
