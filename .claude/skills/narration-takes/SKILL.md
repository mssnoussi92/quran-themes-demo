---
name: narration-takes
description: Produce, check and store the VoiceTut narration of an episode or reel in quran-themes-demo - synthesise the lines, have Whisper listen to every take (words, sounds after the last word), retake the bad ones, fix pronunciation (say_ar), check the phrase starts, store the checked takes as candidates for the candidate render, and lock them only on the owner's « je valide » after it. Use after a script is written or changed, whenever the owner reports a mispronounced word, and before any release render.
---

# Narration takes

VoiceTut (Egyptian Arabic, voice from `content/policy.yaml`) never says a line the same way twice.
A take is checked by you, stored as a **candidate** (`content/audio/<episode>/`, FLAC + `takes.json`,
`status: candidate`), heard by the owner in the candidate render, and locked on their « je valide »
(owner's decision, 2026-11-08: one validation, at the end): reused forever, audio unchanged. A
candidate render accepts only candidate or locked takes (`build.py --require-committed`), a final one
only locked takes (`--require-locked`). Locking is the owner's call, never yours: you prepare, check
and store.

## 1. Synthesise

- `cd video && npm run data`, then `python3 tools/audio/build.py --episode <episode>` with
  `run_in_background` (VoiceTut on 4 vCPU: 40 to 170 s per line, the model loads once for all new
  lines). Locked lines are reused, and so is a locked take of another scene, of this episode or of
  another one, with the same text and voice (`take_from` in the manifest, `dua/promise-intro` for
  another episode's: « قال ربنا سبحانه وتعالى: » before every verse, « تاني فكرة غلط… »).
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
- A short take on its own (a test take, a new ending): pad it with 1 s of silence before and 0.3 s
  after (`ffmpeg -i t.wav -af "adelay=1000:all=1,apad=pad_dur=0.3" p.wav`); more after makes Whisper
  invent « اشتركوا في القناة ». Word times then start 1 s late.
- Sounds added after the last word: VoiceTut sometimes says a short isolated « اه », « با » after
  0.3-0.5 s of silence (« جاي. »). Read the end with `listen.py --envelope <take>@<end-1.6>@1.6`: the
  last word must decay into silence with nothing after it (a dip of 0.1-0.2 s inside « تعرف » is the
  word itself). Prefer another take; else cut the raw take in that silence (`ffmpeg -i
  <scene>.raw.wav -af atrim=end=<s> -c:a pcm_s16le cut.wav`) and install it (`--use-take
  <scene>=cut.wav`). Look at the raw take, not the tightened one: tightening shortens the silence
  before the sound to 0.18 s. `listen.py --episode` scans every raw take's end on its own
  (« sound » lines: a run under 0.3 s after 0.2 s of silence, that Whisper does not hear as the end
  of the last word; a voiced « ها » detached from its word can still show, qarnayn given-life-1): each
  « sound » line is listened to. Seen before that scan: muqarana had five (« ناقصة؟ », « قليل؟ »…), clicks or a breath, all cut;
  khidr had them after « ؟! » on 4 takes of 4 (« قتلت نفس بريئة… عمرها ما قتلت حد؟! »).
- To tell a short last sound from a short last word (« ليه؟ », « أنا. »), cut the raw take before
  it and transcribe again (padded): if Whisper still hears every word, the sound is extra; then
  transcribe the sound alone (1.5 s of silence around it): « اشتركوا في القناة » or one odd syllable
  (« هم ») means no word.
- The same kind of sound inside a pause (khidr: « قصة… [طه] هتخليك », « وبعدها… [ت] الخضر »):
  silence it in the raw take, sample by sample (Python: zero the samples between two times, write
  the WAV again), then `--use-take`; ffmpeg's `volume=enable='between(t,a,b)'` works by frames of
  about 20 ms and leaves the start of the sound.

## 3. Retake

- Several takes at once, the model loaded once (2 per line; 4 for a hadith or a key word): one text
  file per take holding the scene's `spoken_ar` (from `video/public/data/<episode>.json`, after
  `npm run data`), `/opt/venvs/voicetut/bin/python tools/tts/say.py --engine voicetut --speaker
  Mohammed --language ar --in <dir>/in/*.txt --out-dir <dir>/out` in the background (about 2 min per
  take), then §2 on each: words (padded), trailing sounds, and the pauses (no odd gap).
- Install the take you chose: `python3 tools/audio/build.py --episode <episode> --only <scene>
  --use-take <scene>=<dir>/out/<file>.wav --tts-python /bin/false`: it becomes the scene's draft take
  (manifest), tightened, never re-synthesised; refused on a line that has a locked take. The same
  option puts back a take you kept aside.
- The voice reads a hadith from the registry's vowelled text, which keeps the classical ق. A real
  reader is better when one exists: skill `find-hadith-recording`.

## 4. Pronunciation: `say_ar`

The method (known spellings, variants, vowel measure, the owner's choice): skill `voice-spelling`.

When the voice must read something written differently from the screen, add `say_ar` to the scene:
the same words, word for word; diacritics, punctuation and up to two letters per word may differ
(owner's decision, 2026-11-07: « تبت » read « توبت »; `validate.py` checks it). Every word the owner
already corrected is in `content/pronunciation.yaml`: apply it in every new line (validate.py warns
on a reel not yet validated that forgets one).

- A ة heard as ت at a pause (the owner: « عادة », "T is silent"): write it ه, « عاده ».
- A word that must keep its ق (« قريب » said « أريب »): vowel it, « قَرِيب ». Whisper heard « قريب » on
  2 takes out of 2; « قَرِيبٌ » and the bare word stayed « أريب ».
- Egyptian vowels the owner asked for (sabr, 2026-11-07), written in `say_ar`: « بتصبر » « btoṣbor »
  (بِتُصْبُر), « اصبر » « oṣbor » (اُصْبُر), « البشرى » « al-boshra », not « el-bashra » (البُشْرَى),
  « مبيعيطش » (مَبْيِعَيَّطْش). A name keeps its ق: « يَعْقُوب ».
- Guillemets « » in the spoken text can make VoiceTut add a sound (« «اصبر»… » heard « اصبر بس »):
  leave them out of `say_ar`.
- Whisper writes what it understands, not the vowels: it cannot tell « oṣbor » from « iṣbir » or
  « boshra » from « bashra ». For a vowel, make 2 or 3 takes, keep those Whisper hears with the right
  words and measure the vowel (`voice-spelling` skill, which holds the whole method). The owner
  hears the chosen take in the candidate render, with the rest; an MP3 of the variants is only
  for a doubt the measure cannot settle, if they ask for it.
- Test variants in one VoiceTut call (one model load), each variant twice in its own text file
  (§3), then `listen.py` on each, `--vowels` for a vowel. To use a test take: put the spelling in
  the scene's `say_ar`, `npm run data`, then `build.py --only <scene> --use-take <scene>=<take.wav>`.

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
- Store the checked starts: `build.py --episode <episode> --set-phrases <scene>=0.08,1.14,...` (one
  start per phrase); they replace the estimate from then on. On a draft take they are kept in the
  manifest, tied to that take's raw file (a retake drops them), so the drafts the owner hears are
  already right; locking moves them to `takes.json`. Check above all a line with `reel_only_end`:
  a wrong start there cuts words out of the whole-episode videos (tawba relapse-outro: the estimate
  put « ده اللي جاي » at « بدري », 0.6 s early). The cut falls 0.12 s before the start of the
  `reel_only_end` phrase: `listen.py --envelope <take>@<start-0.3>@0.4` must show silence there
  (under about -70 dB), after the previous word has decayed.

## 6. Candidate takes, owner, lock

- Render the reels locally (`REMOTION_BROWSER_EXECUTABLE` as in CLAUDE.md, `--concurrency=2`: the
  browser ran out of memory with more) where something new shows, and look at their frames yourself:
  drafts are no longer sent to the owner, who watches the candidate render once.
- Save what Whisper heard: `uv run --with faster-whisper==1.1.1 --with numpy tools/audio/listen.py
  --episode <episode> --save` (`content/audio/<episode>/checks.json`, tied to each raw take): the
  candidate's list « à vérifier » shows each new take with what Whisper heard and any sound after it.
- Store the checked takes: `python3 tools/audio/build.py --episode <episode> --candidate --tts-python
  /bin/false` (add `--reel` or `--only`), commit `content/audio/`; `--require-committed` must pass.
  Then the candidate render (skill `release-render`). A candidate take can still be replaced
  (`--use-take`, then `--candidate` again) until the owner's word.
- On the owner's « je valide » after the candidate render, and only then: `scripts/finalize.py
  validate` locks every candidate take of the episode (`build.py --lock`, audio unchanged) with the
  rest of the validation (skill `release-render`, §2).
- Never lock a take, nor retake or re-synthesise a locked line, without the owner hearing the result.

## 7. A changed line in validated reels

The owner asks to change a line that is already validated and locked (2026-11-07: the follow call
« تابعنا عشان تعرف » in place of « اللي جاي », in 9 reels of 3 episodes). In order:

1. Edit the line, Arabic and English (and `reel_only_end`, `say_ar`), and remove `validated_by` from
   each reel it belongs to (CLAUDE.md: even at the owner's request). Leave `publish.validated_by` if
   the publication texts did not change. Tell the owner the new lines (for information: they
   validate them with the candidate render).
2. Two takes per line in one synthesis (§3), checked (§2): words, the last word, the pauses.
3. Install the best one per line (`--use-take`), check the phrase starts and the whole-episode cut
   (§5), store them (`--set-phrases`).
4. `listen.py --episode <episode> --only <scenes> --save`, `build.py --candidate --only <scenes>`,
   commit, push, then a candidate render of each episode (skill `release-render`). First done this
   way: qarnayn-02's example after the lesson of the rising sun (2026-11-08).
5. On the owner's « je valide »: `scripts/finalize.py validate --episode <episode> --owner <owner>`,
   `validate.py --release --reel` on each reel, commit, push, then the promote workflow.

