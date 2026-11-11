---
name: find-hadith-recording
description: Find a real person's recorded reading of a hadith on archive.org (Sahih al-Bukhari, Sahih Muslim, Jami' at-Tirmidhi), cut the Prophet's words out of it and register it as the hadith's `recording`, so that a film plays a human voice for the hadith, never the synthetic one, once the owner has heard it. Use whenever a script quotes a hadith, when choosing between hadiths of the same meaning, and when the owner asks for a real reading.
---

# Find a hadith recording

The owner prefers a hadith that has a recorded reading, among those the policy allows (Bukhari,
Muslim, Tirmidhi graded sahih or hasan by al-Albani, `content/policy.yaml`), and accepts archive.org
readings whose item states no license (decision of 2026-11-07): say so each time, and write it in
the registry. The audio is never committed: `tools/audio/build.py` downloads it at render time.

## Readings already found (2026-11-07)

| Collection | archive.org item | Layout | Reader |
| --- | --- | --- | --- |
| Bukhari | `bukhari_audiobook` | one file per hadith, `NNNN.mp3` (four digits: `0074.mp3`), usually the registry's number (6340.mp3 = Bukhari 6340) but not always: `0073.mp3` reads Bukhari 72 and `0074.mp3` Bukhari 73, so transcribe it first; chain, then the hadith. archive.org sometimes answers 500 with a small HTML page: `curl -f`, retry, check the file is audio | Abu Malik Ibn Abd'Azeez as-Salafi al-Asqalane |
| Muslim | `ar_Moslem_Reading_16` | one file per book, `ar_Moslem_Reading_NN.mp3`, the book in each file's title (`/metadata`), file number = book number + 1 (01 is the introduction): 03 الطهارة, 40 السلام, 46 البر والصلة, 47 القدر, 49 الذكر والدعاء, 54 الزهد; up to 6.5 h. Position in the file ≈ the share of the book's Arabic text (hadith-api, `reference.book`) before the hadith (2564c: 21 %, found 30 s off) | Ryadussalihin.org (no reader named) |
| Tirmidhi | `yna-audiobook-arabic-sunan-altirmidhi` | files by hadith numbers (`...-2006-2204.mp3`), 30 to 40 s per hadith on average, same numbers as the registry on 2139, 3247 and 3573 | Yusuf ibn Nuh Ahmad |

Readings in the registry (where each one is, to find a neighbour fast). **The registry is the list,
not this table**, which misses the latest ones: print them all with
`uv run --with pyyaml python -c "import yaml; [print(e['id'], e['recording'].get('file'), e['recording'].get('start'), e['recording'].get('status')) for e in yaml.safe_load(open('content/sources/hadith.yaml', encoding='utf-8')) if e.get('recording')]"`
before searching. Those noted here by hand:

| Hadith | File | Clip |
| --- | --- | --- |
| Bukhari 6340, 1303, 1469, 6309, 6307, 6446, 73 | `bukhari_audiobook/<number>.mp3` (73: `0074.mp3`) | after the chain, 6 to 21 s in |
| Bukhari 3401 (excerpt: the sparrow), 122 (excerpt: « يرحم الله موسى… ») | `3401.mp3` (383 s), `0123.mp3` (277 s: 122 is one file further, like 73) | 202.76-212.12 s, 268.78-276.5 s (khidr; Whisper hears « لولدنا » for « لوددنا », validated by ear); position ≈ the excerpt's share of the text |
| Bukhari 608 (excerpt: « حتى يخطر بين المرء ونفسه… »), 751 | `0608.mp3`, `0751.mp3` (same numbers) | 28.40-40.25 s, 15.50-19.85 s (khushu; the reader pauses before « حتى » and « هو ») |
| Muslim 228 (الطهارة) | `ar_Moslem_Reading_03.mp3` (file = book + 1: 03 is book 2) | 479.60-497.60 s (khushu; the estimate by share of text, 8 %, landed 35 s before it; Whisper hears « كثارة », « يؤتي ») |
| Muslim 2203a (السلام) | `ar_Moslem_Reading_40.mp3` (book 39) | 3667.50-3677.45 s (khushu; share 43.5 %, found 60 s after the estimate; the Companion's complaint is read just before) |
| Muslim 2564c (البر والصلة) | `ar_Moslem_Reading_46.mp3` | 1791.1-1800.3 s (muqarana) |
| Muslim 2664 (القدر) | `ar_Moslem_Reading_47.mp3` | 2447.7-2476.1 s |
| Muslim 2679a (الذكر والدعاء) | `ar_Moslem_Reading_49.mp3` | 285.5-299.7 s |
| Muslim 2999 (الزهد والرقائق) | `ar_Moslem_Reading_54.mp3` | 3357.0-3375.2 s (a hadith of the same book, e.g. 2963, is in this file too: probe it first) |
| Tirmidhi 2139 | `...-Al-Tirmidhi-2006-2204.mp3` | 4501.5-4505.1 s |
| Tirmidhi 2499, 2513 | `...-Al-Tirmidhi-2415-2605.mp3` | 3006.4-3010.2 s, 3396.0-3402.7 s (2513: muqarana) |
| Tirmidhi 3153, 3247 | `...-Al-Tirmidhi-3105-3301.mp3` | 2007.9-2023.18 s (3153: the estimate by numbers landed on it; the reader says « كأشد ما كان », the registry « كأمثل »; he runs on into « قال فيرجعون », cut at the dip after « إن شاء الله »), 6254.1-6255.6 s |
| Tirmidhi 3540, 3573 | `...-Al-Tirmidhi-3535-3800.mp3` | 263.8-282.7 s, 1407.7-1418.5 s |

Others seen: `Sahih_Bokhari_Audio_uP_bY_mUSLEm` (Bukhari by book), `016_20210811` and
`063_20210811` (the Ryadussalihin Muslim and Tirmidhi again), `0063ArSonanTermetheAB63_201406`.
Search more with the advanced search API:
`curl -sG https://archive.org/advancedsearch.php --data-urlencode 'q=title:(صحيح مسلم) AND mediatype:audio' --data-urlencode 'fl[]=identifier' --data-urlencode 'fl[]=title' --data-urlencode 'rows=40' --data-urlencode 'output=json'`.
Most results are commentaries (شرح): look for readings (قراءة, مجالس سماع, audiobook).

Whisper puts « قال » before the first word of a clip that starts in the pause after the reader's « قال »
(Tirmidhi 3153, twice): an invention, check the envelope rather than move the cut.

## In the film-and-shorts model

A film plays a reading with a `reading: hadith.<collection>.<n>` segment (`docs/model.md`): the
reader's extract alone, the hadith's words on screen between « », its reference and « Reading:
<reader> » under it, after a line of narration that introduces it (« والنبي صلى الله عليه وسلم حكى
إن الخَضِر قال: »). The ambience is silent under it, and the subscribe reminder never passes over it.

- `tools/trial/film.py` plays only a recording whose `status` is `validated`, taken from the episode
  the film names in `verses:`; `python3 tools/audio/build.py --episode <episode>` cuts the extract into
  `build/audio/<episode>/readings/<id>.level.wav`.
- A new recording is `proposed`: send the owner the extract itself (an MP3, in the conversation) with
  what Whisper hears differently; on their word write `status: validated` and `validated_by` with a
  ruamel round trip. Never on your own judgement.
- **A short cannot play a reading yet** (`docs/model.md`, « Ce que les outils ne font pas encore », 2):
  a hadith belongs to the film until `prepare.py` and `Trial.tsx` learn it.

Steps 1 to 5 below are the same for the model; steps 6 and 7 describe the mix and the validation of
the episodes published before.

## Steps

1. **Locate.** `curl -s https://archive.org/metadata/<item>` lists the files and their lengths.
   Estimate the position: the file itself (Bukhari); (number - first) / (last - first + 1) × length
   (Tirmidhi by ranges); the hadith's place in its book (Muslim). Download into a scratchpad folder
   of its own (`curl -sSL -o`), with `run_in_background` for files of 100 MB or more.
2. **Probe, then narrow.** `uv run --with faster-whisper==1.1.1 tools/audio/listen.py
   <file>@<estimate>@40` tells which hadith is being read there (its chain and words); move by the
   average hadith length, then transcribe a tight window, `--segments <file>@<start>@<120 to 400>`
   (Whisper runs at about real time on 4 vCPU: never a 15-minute window).
3. **Boundaries.** `--words` on 20 s around the hadith: the Prophet's words start after « قال » (or
   « يقول ») and end before the reader goes on (« وفي الباب », « هذا حديث », the next chain). Whisper
   puts a word's start at the beginning of the pause before it: confirm with `--envelope
   <file>@<t>@1` and cut in the middle of the pause. Compare with the speech level: a reverberant
   recording can have pauses at -25 to -30 dB. If the reader runs on without a pause (Tirmidhi 2139,
   « البرّ » straight into « وفي الباب »), cut at the deepest dip and tell the owner.
4. **Check the clip.** Cut it with `ffmpeg -i <file> -af "atrim=start=S:end=E,asetpts=PTS-STARTPTS"`
   (with `-ss` after `-i`, the frames keep their timestamps and a fade-out mutes the whole clip),
   transcribe it (pad a clip under 4 s) and compare with the words the card shows: `display_ar`,
   from the first to the last quotation mark of `text_ar`. Write down every difference: an edition
   variant (Tirmidhi 3573: « بإثم » for « بمأثم ») or a recognition error, for the owner to hear.
5. **Register.** In `content/sources/hadith.yaml`, with a ruamel round trip (never by hand on the
   texts): `recording: {reader, item, file, start, end, heard, license: "none stated on the
   archive.org item", status: proposed}`. Then `uv run --with jsonschema --with pyyaml
   scripts/validate.py`: it warns while `heard` differs, and a release render needs the recording
   validated.
6. **Mix and listen.** `python3 tools/audio/build.py --episode <episode>` downloads the file, cuts
   the reading once (`build/audio/<episode>/readings/`) and mixes the scene: the introduction cut
   from the locked narration take, 0.25 s, the reader. `listen.py --episode <episode> --only <scene>`
   must hear the introduction once, then the hadith once; if the synthetic voice starts the hadith
   before the reader, the phrase start of the take is wrong (`docs/legacy/skills/narration-takes.md`, §5). Note the
   differences (`heard`) in the PR: the candidate's list « à vérifier » shows the reading still
   `proposed`, with its minute in each video.
7. **Owner.** The owner hears it in the candidate render (since 2026-11-08, one validation at the
   end): on their « je valide », `scripts/finalize.py validate` writes `status: validated`,
   `validated_by: <owner>`. A recording the owner refuses is removed from the registry: the voice
   reads the hadith again, in the next candidate.
