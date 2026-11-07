---
name: narration-takes
description: Produce, check and lock the VoiceTut narration of an episode or reel in quran-themes-demo - synthesise the lines, have Whisper listen to every take, retake the bad ones, fix pronunciation (say_ar), check the phrase starts, render drafts for the owner and lock only the takes the owner approved. Use after a script is written or changed, whenever the owner reports a mispronounced word, and before any release render.
---

# Narration takes

VoiceTut (Egyptian Arabic, voice from `content/policy.yaml`) never says a line the same way twice.
A take the owner listened to and approved is locked (`content/audio/<episode>/`, FLAC + `takes.json`)
and reused forever; a release render accepts nothing else (`build.py --require-locked`). Locking is
the owner's call, never yours: you prepare, check and propose.

## 1. Synthesise

- `cd video && npm run data`, then `python3 tools/audio/build.py --episode <episode>` with
  `run_in_background` (VoiceTut on 4 vCPU: 40 to 170 s per line, the model loads once for all new
  lines). Locked lines are reused, and so is a locked take of another scene with the same text and
  voice (`take_from` in the manifest: « قال ربنا سبحانه وتعالى: » before every verse).
- A line changed after it was locked (text or `say_ar`) gets a new key, so a new take: the owner
  listens to it before it is locked.

## 2. Listen with Whisper before the owner does

`uv run --with faster-whisper==1.1.1 tools/audio/listen.py --episode <episode> [--only <scene> ...]`
prints every take where Whisper hears something else (a hadith mixed with a recorded reading is
heard in two parts, introduction and reader).

- **Usually harmless**: Egyptian pronunciation (ق → ء « أريب », ث → س « واصق »), Whisper's spelling
  (« ﷺ » for « صلى الله عليه وسلم », « يقول » for « يقل », hamza and alef forms), a word dropped in a
  1-second introduction.
- **A retake**: a word missing, added or changed. Seen on dua: « غلط » heard « غانت », « فقال رجل »
  heard « فأنا رجل », « لا يتعاظمه » squashed into « يتعظمه » (four takes; a recorded reading solved it).
- Isolate a doubtful word: `listen.py --words build/audio/<episode>/<scene>.wav@<start>@<seconds>`
  (a clip of 3 s or less can make Whisper hallucinate: widen it).

## 3. Retake

- Keep the old take: move `<scene>.wav` and `<scene>.raw.wav` out of `build/audio/<episode>/`,
  then `build.py --episode <episode> --only <scene>`, and listen again. For a hadith or a key word,
  make 2 to 4 takes and keep the one Whisper hears best.
- To put back a take you kept: copy its `.raw.wav` and `.wav` back, remove `"tight"` from its entry
  in `manifest.json`, run `build.py --only <scene> --tts-python /bin/false` (it re-tightens, never
  synthesises).
- The voice reads a hadith from the registry's vowelled text, which keeps the classical ق. A real
  reader is better when one exists: skill `find-hadith-recording`.

## 4. Pronunciation: `say_ar`

When the voice must read something written differently from the screen, add `say_ar` to the scene:
the same words, only diacritics, punctuation and ة/ه may differ (`validate.py` checks it).

- A ة heard as ت at a pause (the owner: « عادة », "T is silent"): write it ه, « عاده ».
- A word that must keep its ق (« قريب » said « أريب »): vowel it, « قَرِيب ». Whisper heard « قريب » on
  2 takes out of 2; « قَرِيبٌ » and the bare word stayed « أريب ».
- Test variants in one VoiceTut call (one model load): each variant twice in its own text file,
  `/opt/venvs/voicetut/bin/python tools/tts/say.py --engine voicetut --speaker Mohammed --language ar
  --in a1.txt a2.txt b1.txt b2.txt --out-dir <dir>`, then `listen.py` on each. To use a test take:
  copy it to `<scene>.raw.wav`, set the scene's manifest entry to the new spoken text and its key
  (`build.tts_key(text, speaker)`), delete `<scene>.wav`, run `build.py --only <scene> --tts-python
  /bin/false`.

## 5. Phrase starts

Title cards reveal a line phrase by phrase (cut after « ، … . ؟ : »), subtitles follow the phrases,
the whole-episode videos cut a line before its `reel_only_end`, and a recorded hadith reading is
mixed after the introduction phrase: all of it comes from the phrase starts of the take.

- `listen.py --phrases <episode>` puts build.py's estimate next to Whisper's words; `!!` marks a
  difference. Neither is always right: Whisper drifts in noisy pauses, the estimate on lines said at
  an uneven pace (Tirmidhi 3573: the cut fell 1 s late and the synthetic voice began the hadith
  before the reader).
- For each `!!` on a title card, a hadith scene or a line with `reel_only_end`, look at the loudness:
  `listen.py --envelope build/audio/<episode>/<scene>.wav@<t>@1` (a pause is a run under about
  -35 dB; the first loud window after it is where the phrase starts).
- Store the checked starts with the locked take: `build.py --episode <episode> --set-phrases
  <scene>=0.08,1.14,...` (one start per phrase); they replace the estimate from then on.

## 6. Draft, owner, lock

- Render the reels locally (`REMOTION_BROWSER_EXECUTABLE` as in CLAUDE.md) and the whole episode if
  it changed, then send them (SendUserFile) with what to listen to and where (second in the video):
  retakes, pronunciation fixes, hadith readings, anything Whisper still hears differently.
- Only on the owner's word: `python3 tools/audio/build.py --episode <episode> --lock <owner> --reel
  <reel>` (add `--only <scene>` for one take), commit `content/audio/`. Then the release checks pass
  (`validate.py --release --reel <reel>`, `build.py --require-locked`) and the `render` workflow can
  run (`reel: all`).
- Never lock, retake or re-synthesise a locked line without the owner hearing the result.
