---
name: new-theme
description: Turn a theme, a story or an episode already published into one film (16:9, under 10 minutes) and the shorts cut from it (9:16), in the model the owner validated on 2026-11-11 (docs/model.md) - sources through the registry, the film's structure and what each short holds, the script validated by the owner before any voice request (write-hook), the scenes and their ambience (new-scene), one voice request per text (narration-takes), the film's montage, covers and publication texts, the renders checked and sent (release-render), the owner's validation recorded on their word. Use when the owner asks for a new theme or story, for the rewrite of an episode in the model, or for the next film.
---

# From a theme to a film and its shorts

On 2026-11-11 the owner validated the model on the story of Musa and al-Khidr (a film of 7:47, three
shorts) and decided that **the episodes are to be rewritten in it**: new scenes, better scripts, an
ambience. The example to read before anything is that film: `content/trial/boat.yaml`, `boy.yaml`,
`wall.yaml`, `film.yaml`. What a video is made of, every field, every setting and what the tools do
not do yet: `docs/model.md`. Why each choice was made, with its numbers: `docs/retention.md`.

The owner decides three times, and nothing is validated by you:

1. **the subject** and what the film will hold (step 1);
2. **the script, before any voice request** (step 4): a take cannot be patched, and the free voice
   gives ten requests a day;
3. **the videos**, once, at the end (step 9).

Between those, you work alone. Zero spending: free tiers only. No pull request unless they ask.
The old circuit (episodes in reels, VoiceTut, the `render` workflow) is in `docs/legacy/skills/`: only
to correct a video published before.

## 1. What is being made

- **A rewrite** of a published episode (`content/episodes/<theme>.yaml`, `docs/themes.md`): its sources
  and hadith readings are validated and stay; its lines, pictures and voice do not. Read what was
  measured on the old videos first (`docs/retention.md`, « Ce qui est mesuré »): 26 % of viewers past
  three seconds on khidr-01, eight seconds watched on average, half of the film a verse on a dark card.
- **A new theme or story**: skill `choose-format` first (the kind of subject, its hard filters), then
  here. A reference video the owner shares is analysed in `reference/`, text only (method in
  `docs/legacy/skills/new-theme.md`, step 0).
- The model was proven on **a story**, then opened to misconceptions with the du'a (`content/trial/dua.yaml`,
  `asked`, `written`, `waited`: each wrong idea broken by one concrete call in the Quran). For a collection or
  one text explained, propose the structure of the film and of the shorts to the owner before writing.

## 2. Sources

A claim is a verse or a hadith of the registry, never a summary from memory.

- **Verses**: quran.ai MCP (`search_quran`, `fetch_word_concordance`; read its grounding rules first
  and pass their nonce), or the quran.com API. Whole ayahs, a whole sentence: a verse that opens in the
  middle of one (« إلا », « و » carrying on) is replaced or flagged to the owner.
- **Hadiths**: `content/policy.yaml` (Bukhari, Muslim, Tirmidhi if al-Albani grades it sahih or
  hasan). Search hadith-api by downloading `editions/ara-<collection>1.min.json` into the scratchpad;
  the number is its `arabicnumber` (Muslim: a letter per narration, `hadith.muslim.2679a`). Prefer one
  that has a recorded reading: skill `find-hadith-recording`. A collection outside the policy is
  replaced, not cited.
- **Registry**: each one in `content/sources/` with `status: proposed` and a `notes` line, then
  `uv run --with ruamel.yaml tools/sources/fetch.py` and `uv run --with jsonschema --with pyyaml
  scripts/validate.py`. Never validate a source yourself. A hadith too long: `excerpt_ar` and
  `excerpt_en`, copied from the text with a script, never typed.
- **Recitation**: each verse cut in the reciter's surah file, `uv run --with faster-whisper==1.1.1
  --with pyyaml tools/audio/recitation.py --reciter sayegh <surah:ayah>`; a cut Whisper refuses is set
  at the envelope (`--set`), and the owner is told which ones were set by hand.
- **Recitation length** decides the size: the film lasts about twice its recitation (3:50 of verses in
  7:47). Sum it before the outline (`choose-format`, « Hard filters »).
- **How a source reaches a video**: by its id, from the registry (`tools/trial/sources.py`: the text
  shown, the reciter's cut, the reader's recording, all levelled). A verse needs its cut, a hadith its
  recorded reading (in a draft a hadith with no reading yet is kept twelve seconds, silent). What the
  owner has not validated yet is played and listed (« not validated by the owner yet »): they hear it in
  the videos. Only the first film still reads an old episode (`verses:`).

## 3. The film first, then its shorts

Write the outline as a table and send it with the script (step 4).

- **Each short stands alone**: one event or one idea, its verse, its meaning, and the promise of its
  first seconds kept before it ends. A viewer who saw nothing else must leave with something. A short
  that only sets up the next one is not a short (khidr-01).
- **Three to six shorts**, 1:30 to 2:05 each on the first film; Instagram's limit is 3 minutes.
- **The film** repeats the shorts line for line (their voice takes are reused, no request spent) and
  adds its own lines: an opening that shows every part in one sentence and promises, what frames the
  story (the condition of 18:67-70), a link where two parts meet, a conclusion with the verse or the
  hadith that ties them together (2:216, the sparrow of Bukhari 3401). Under ten minutes.
- **Each part with its answer** (owner's choice over the order of the Quran with every secret at the
  end): the first answer is recited at 1:41, where the old film gave it at 5:14.
- **Say what tells the parts apart.** The owner's reading of the three stories is how the wisdom
  shows: at once, never to those who lived it, years later. The end of each short says it, and the
  line that announces the next part is built on it.
- **Chapters**: one per part, a title in Arabic and English (they are the YouTube chapters).
- **The subscribe reminder** passes twice in the film (`subscribe: true` on a narration segment): after
  the first lesson and on the last line. Never over a verse, a hadith or a line of warning, never in
  the first thirty seconds: `film.py` refuses it.

## 4. The script, then the owner

Skill `write-hook`: the beats of a short, the film's own lines, the words the owner refused, the
checks. Then `uv run --with pyyaml python3 tools/trial/script.py --film <film>` writes the whole script
as one page (`docs/scripts/<film>.md`): every segment, Arabic and English, each quote from the registry,
your own lines marked « nouvelle » and the validated lines of an old episode « reprise » (`kept:`), with an
estimate of each video's length (within six seconds on the first film). Send it to the owner with the
draft pictures of step 5. **Wait for « je valide le script »** (or
their corrections) before the voice: write `script_validated: { by: <owner>, on: <date> }` in each file
on that word only. A line changed afterwards is to be validated again.

## 5. The scenes and their sound

Skill `new-scene`: a filmed clip the owner approved, the silhouettes of what the text says drawn over
it (things and places, never a person), one state of the drawing per `scene` of the script, and the
ambience under the narration. Look at it without any voice:

```bash
uv run --with pyyaml --with numpy python3 tools/trial/prepare.py --trial <id> --draft --clip <clip>
cd video && npx remotion still Trial916 out/<id>-0.png --frame=0 --props='{"trial":"<id>","voice":"X","data":null}'
```

A draft times the silent narration from its length; the recitation is real. Take a still at the start
of each segment (`start` of `video/public/trial/<id>-X.json`, times 30) and open it: is the first frame
a reason to stay, does every line leave the drawing visible, does every scene say what its line says?

## 6. The voice

Skill `narration-takes`: one text file per short and one for the film's own lines, each said in one
request by the workflow `voice-test`, the take committed in `content/trial/takes/`, every phrase found
in it by `tools/audio/align.py`. A film and five shorts cost six requests.

## 7. Prepare, then look again

```bash
uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/prepare.py --trial <id> --voice D --takes content/trial/takes --clip <clip>
uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/prepare.py --film <film> --voice D --takes content/trial/takes
```

Each prints its timeline: every segment with its start, every phrase with the second the voice says
it, the chapters of the film, where the reminder passes, what the ambience does. Read it: a phrase
that starts at the same second as the one before was not found (step 6); a short far over two
minutes has a line too many.

The film's file (`content/trial/<film>.yaml`, fields in `docs/model.md`): `reuse: <short>.<narration>`
for the lines of a short (`lines: [0, 1]` to take some), `narration:` for its own, `verse:`,
`reading:` for a hadith read by a real voice, `picture` and `scene` for what is shown, `shots` for one
picture per phrase (the opening), `subscribe: true`, `outro: 12`. A second film takes its own id: the
first one is `film`.

## 8. Covers and publication texts

- **Cover of a short** (`cover`): the scene that says the story, a title of three to five words (the
  question of the hook), a tag (« <series> · ١ من ٣ »), `focus`. **Thumbnail of the film**
  (`thumbnail`): the stories side by side, its name in large, a tag. Readable at 170 px wide; nothing
  in the bottom right corner of the 16:9 one. The owner validates the titles with the script.
- **Texts** (`publish` of each file): title and description in Arabic and English, taken from the
  validated lines; the film's `series`, two or three theme `hashtags`, and the line that declares the AI
  voice. YouTube title « en · ar »: 100 characters at most. Never type a source, a reciter, a reader,
  a credit or a chapter: `tools/trial/publish.py --film <film>` computes them and writes one block to
  paste per platform (`publish.out`).

## 9. Render, check, send, record

Skill `release-render`: the renders in the session, each video looked at on its sheets of frames
before it is sent, the TikTok versions, the covers, the texts, then the owner's answer. Their
« je valide » is written as `validated: { by, on, what: [...] }` in each file, with exactly what they
saw and heard; anything added afterwards waits for their word again.

## 10. Leave the repository true

- `docs/themes.md`: the theme as done in the model; `docs/model.md` when a setting, a clip, a
  recording or a tool changed; `docs/history.md`: one task entry at the end (what was asked, decided,
  validated); `CLAUDE.md`: only « Où on en est », kept current and short.
- A tool gap closed (`docs/model.md`, « Ce que les outils ne font pas encore »): remove it there and
  update the skill that mentioned it.
- Commit and push on the session's branch.

## Never

- A line of narration that says the text of a verse, or a verse read by the synthetic voice.
- A person drawn; a killing shown; paradise, hell, the Last Day or an angel pictured.
- A validation written without the owner's word; a voice request before the script is validated.
- A second Google project or account to get more requests; a paid service.
