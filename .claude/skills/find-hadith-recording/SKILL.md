---
name: find-hadith-recording
description: Find a real person's recorded reading of a hadith on archive.org (Sahih al-Bukhari, Sahih Muslim, Jami' at-Tirmidhi), cut the Prophet's words out of it and register it as the hadith's `recording`, so the reel uses a human voice instead of VoiceTut once the owner has heard it. Use whenever a script quotes a hadith, when choosing between hadiths of the same meaning, and when the owner asks for a real reading.
---

# Find a hadith recording

The owner prefers a hadith that has a recorded reading, among those the policy allows (Bukhari,
Muslim, Tirmidhi graded sahih or hasan by al-Albani, `content/policy.yaml`), and accepts archive.org
readings whose item states no license (decision of 2026-11-07): say so each time, and write it in
the registry. The audio is never committed: `tools/audio/build.py` downloads it at render time.

## Readings already found (2026-11-07)

| Collection | archive.org item | Layout | Reader |
| --- | --- | --- | --- |
| Bukhari | `bukhari_audiobook` | one file per hadith, `NNNN.mp3`, same numbers as the registry (6340.mp3 = Bukhari 6340): chain, then the hadith | Abu Malik Ibn Abd'Azeez as-Salafi al-Asqalane |
| Muslim | `ar_Moslem_Reading_16` | one file per book, `ar_Moslem_Reading_NN.mp3` with NN = book + 1 (49 = book 48, الذكر والدعاء والتوبة والاستغفار, hadiths 2675-2748), up to 6.5 h | Ryadussalihin.org (no reader named) |
| Tirmidhi | `yna-audiobook-arabic-sunan-altirmidhi` | files by hadith numbers (`...-2006-2204.mp3`), 30 to 40 s per hadith on average, same numbers as the registry on 2139, 3247 and 3573 | Yusuf ibn Nuh Ahmad |

Readings in the registry, all validated by the owner (where each one is, to find a neighbour fast):

| Hadith | File | Clip |
| --- | --- | --- |
| Bukhari 6340, 1303, 1469, 6309, 6307 | `bukhari_audiobook/<number>.mp3` | after the chain, 6 to 18 s in |
| Muslim 2664 (القدر) | `ar_Moslem_Reading_47.mp3` | 2447.7-2476.1 s |
| Muslim 2679a (الذكر والدعاء) | `ar_Moslem_Reading_49.mp3` | 285.5-299.7 s |
| Muslim 2999 (الزهد والرقائق) | `ar_Moslem_Reading_54.mp3` | 3357.0-3375.2 s (a hadith of the same book, e.g. 2963, is in this file too: probe it first) |
| Tirmidhi 2139 | `...-Al-Tirmidhi-2006-2204.mp3` | 4501.5-4505.1 s |
| Tirmidhi 2499 | `...-Al-Tirmidhi-2415-2605.mp3` | 3006.4-3010.2 s |
| Tirmidhi 3247 | `...-Al-Tirmidhi-3105-3301.mp3` | 6254.1-6255.6 s |
| Tirmidhi 3540, 3573 | `...-Al-Tirmidhi-3535-3800.mp3` | 263.8-282.7 s, 1407.7-1418.5 s |

Others seen: `Sahih_Bokhari_Audio_uP_bY_mUSLEm` (Bukhari by book), `016_20210811` and
`063_20210811` (the Ryadussalihin Muslim and Tirmidhi again), `0063ArSonanTermetheAB63_201406`.
Search more with the advanced search API:
`curl -sG https://archive.org/advancedsearch.php --data-urlencode 'q=title:(صحيح مسلم) AND mediatype:audio' --data-urlencode 'fl[]=identifier' --data-urlencode 'fl[]=title' --data-urlencode 'rows=40' --data-urlencode 'output=json'`.
Most results are commentaries (شرح): look for readings (قراءة, مجالس سماع, audiobook).

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
   before the reader, the phrase start of the take is wrong (skill `narration-takes`, §5). Render the
   reels and send them to the owner with the reader, the source and the differences.
7. **Owner.** On their word only: `status: validated`, `validated_by: <owner>`, commit, then the
   release render. A recording the owner refuses is removed from the registry: the voice reads the
   hadith again.
