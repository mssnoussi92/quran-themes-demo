---
name: voice-spelling
description: Make the narration voice say a word right in quran-themes-demo - with the voice of the film-and-shorts model (Gemini, Algieba), where the voice text and the screen are the same text - vowel the word in the line, or change the word with the owner, and redo the whole text in one request; and with VoiceTut, the fallback voice and the voice of the episodes published before - a spelling for the voice only (say_ar), the owner's known corrections (content/pronunciation.yaml), variants tried in one synthesis, Whisper and vowel measures. Use whenever the owner reports a mispronounced word, when a check shows one, and when writing a script (apply what is known first).
---

# Voice spelling

## With the voice of the model (Gemini, label D)

In the film-and-shorts model (`docs/model.md`) **the voice says exactly the lines of the screen**:
`content/voice-test/NN-trial-<id>.txt` must equal the `ar` lines of the file, and there is no spelling
for the voice only yet. The owner validated the voice on a whole film without reporting a word, so
little is known of its faults: note each one here when it comes.

- **Before the request**: vowel in the line itself a name or a word the voice could misread
  (« الخَضِر », so that it is not read « الخِضْر » or « الخُضَر »). The vowels then show on screen: keep
  them to the words that need them.
- **A word said wrong in a take**: first make sure it is the voice and not Whisper (`tools/audio/align.py`
  prints what Whisper heard; on a single word it often writes the commoner one). Then either vowel
  the word, or change it for another the owner accepts (a changed line is a script to validate).
  Every correction of a text goes into **one new request for that whole text** (skill
  `narration-takes`, §5): a request is a tenth of the day's budget, so collect them all first.
- **The words the owner refused** are a matter of script, not of voice: skill `write-hook`.
- A spelling for the voice only (the screen keeping its own) would need a `say` beside `ar` in the
  model's files and in `prepare.py`: not built (`docs/model.md`, « Ce que les outils ne font pas
  encore », 3). Build it the first time a word cannot be fixed on screen, not before.

## With VoiceTut (the fallback voice, and the episodes published before)

The screen and the subtitles always show the word as it is written. The voice may read another
spelling of it (`say_ar` of the scene) when VoiceTut says the written one wrong: diacritics,
punctuation, and up to two letters added, removed or changed per word (owner's decision, 2026-11-07:
« تبت » read « توبت »). `validate.py` checks it is still the same words, word for word; Whisper and the
owner's ear check the meaning. Never for a verse (always recited) nor for a hadith's text (registry).

### 1. Before synthesis

- Apply `content/pronunciation.yaml`: every word listed there is written with its `say` spelling in the
  scene's `say_ar` (validate.py warns on a reel not yet validated that forgets one).
- No guillemets « » in `say_ar`: VoiceTut added a sound after « «اصبر»… » (Whisper: « اصبر بس »).
- A Quran word quoted in the narration keeps its ق: vowel it (« من قَرِيب »).
- A word VoiceTut cannot say, whatever the spelling: write another word in the script (the owner
  validates it with the script). « بانت » was heard « بنت » on 13 takes out of 14 (plain, بانِت, بَانِت,
  باانِت; the vowel measure could not tell): khidr says « اتكشفت » (2026-11-08).

### 2. Hear what the voice said

- Whisper's guesses that are not the voice's fault: on one word with little context it writes the
  commoner word (« السحرة » heard « الصحراء » on 4 takes, « غنى النفس » heard « روني نفس »; the vowel
  measure was right). Leave the take and tell the owner where to listen.
- Words: `uv run --with faster-whisper==1.1.1 tools/audio/listen.py --episode <episode>` (`docs/legacy/skills/narration-takes.md`). A doubt on a short take: pad it with 1 s of silence before (and 0.3 s after:
  more makes Whisper invent « اشتركوا في القناة ») and transcribe again; an error that stays is real.
- Vowels: Whisper writes words, not vowels (it wrote « تبت » for « tibt », « أصبر » for any vowel).
  `uv run --with praat-parselmouth tools/audio/listen.py --vowels <take.wav>` gives F1/F2 of the first
  word (or of `<take.wav>@<start>@<seconds>`): « o/u » about 800-1300 Hz, « i/e » 1800+ Hz. References:
  « اُصْبُر » oṣbor 903 Hz, « بِتُصْبُر » btoṣbor 827 Hz, « تبت » said « tibt » 1807-1954 Hz.
- Trailing sounds: `listen.py --envelope <take>@<end-1.3>@1.3`. VoiceTut sometimes adds a short isolated
  sound after the last word (« تاه », « با », « اه » after « جاي. »), after 0.3-0.5 s of silence: cut the
  raw take in that silence (`ffmpeg -i take.wav -af atrim=end=<s>`), never inside a word.

### 3. Try spellings

Escalate, in one VoiceTut run (the model loads once): each variant twice, in its own text file
(`/opt/venvs/voicetut/bin/python tools/tts/say.py --engine voicetut --speaker Mohammed --language ar
--in a1.txt a2.txt b1.txt ... --out-dir <dir>`), then step 2 on each take.

1. Diacritics on the word: worked for « قَرِيب », « اُصْبُر », « بِتُصْبُر », « البُشْرَى », « هَتْلاقِيه »,
   « مَبْيِعَيَّطْش » (Whisper: « بيعيطش »); did not for « ذَنْب » (still « zanb ») or « تُبْت » (still
   « tibt »).
2. The vowel written with its long letter (و for o/u, ي for i/e, ا for a): « توبت » for « tobt ».
3. Another letter or a split word that VoiceTut reads as wanted (up to two letters per word).
4. A shadda that tells two words apart: « ولّا » (walla, « or ») where the screen has « ولا », which the
   voice could read « wa-lā » (« and not »); approved by the owner by ear (tawakkul/sit-hadith,
   2026-11-08). Not in the pronunciation list: « ولا » also means « and not ».

Keep the takes Whisper hears with the right words and the measure puts on the right vowel, and
install the best one (`--use-take`). Since 2026-11-08 the owner hears it in the candidate render, with
the rest (one validation at the end); an MP3 of the variants, one after the other 1.2 s apart
(`ffmpeg ... concat`), is only for a doubt the measure cannot settle, if the owner asks for it.

### 4. Record the decision

- The chosen spelling goes into the scene's `say_ar` (with a comment: the word, what was wrong, the
  owner's request and date), and the take into the episode: `npm run data`, then `build.py --episode
  <episode> --only <scene> --use-take <scene>=<take.wav>` (`docs/legacy/skills/narration-takes.md`, §3).
- A new spelling goes into `content/pronunciation.yaml` (`word`, `say`, `why`) with
  `decided: { by: proposed, on: <date>, scene: <episode>/<scene> }`: the candidate's list « à vérifier »
  shows it, and the owner's « je valide » turns `proposed` into their name (`scripts/finalize.py
  validate`). Every later script uses it from the start.
- A word whose correction did not work stays out of the list; write what was tried in its scene's
  comment (« ذَنْب »: VoiceTut keeps « zanb »).
