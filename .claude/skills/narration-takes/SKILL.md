---
name: narration-takes
description: Get the narration of a short or a film said by the voice the owner chose (Gemini 3.8 Flash TTS, Algieba, Egyptian Arabic) inside the free tier of ten requests a day - one text file and one request per short, one for the film's own lines, the take kept in the repository and never asked for again; find every phrase of the text in that one long take (tools/audio/align.py), check what was said, tighten the pauses, and put every correction in a single request. Use once the owner has validated a script, when a take must be redone, and to budget the voice of a film before it is written.
---

# Narration takes

The owner chose the voice by ear (2026-11-11): **Gemini 3.8 Flash TTS, voice `Algieba`, in Egyptian**,
label `D`. The fallback, if the free tier ends, is VoiceTut `Mohammed`, label `V`
(`docs/legacy/skills/narration-takes.md`). The voice never says a verse: verses are recited. A hadith
is read by a real reader (skill `find-hadith-recording`).

## The budget is the method

- The free tier gives **10 requests a day for this model, per Google project** (not per key); each
  model has its own counter; it comes back at midnight, Pacific time. In practice the counter is not
  strict: a request refused « for the day » passed a few minutes later. Do not count on it.
- So: **one request says one whole text**. A short is one text (thirteen to fifteen lines, about 65 s
  of voice in a request); the film's own lines are one text; the film reuses the shorts' takes line by
  line (`reuse`) and asks for nothing more. A film and five shorts: six requests.
- **The text is validated by the owner before the request** (skill `new-theme`, step 4). Work on the
  pictures with a draft (`--draft`, no voice) until then.
- **A take made is kept** (`content/trial/takes/`, FLAC, committed) and never asked for again.
- One voice. Never a second Google project or account to get more requests; never a paid tier
  without the owner's word (zero spending).

## 1. The voice text

`content/voice-test/NN-trial-<id>.txt` (`text:` of the short or of the film names it without `.txt`):

- first line, the direction given to the voice, never spoken; copy it from `20-trial-boat.txt`:
  `# style: A calm, warm storyteller telling a story to a friend, in Egyptian colloquial Arabic (Cairo). …`
- then every narration line of the file, in order, one per line, identical to the `ar` of the YAML
  (`prepare.py` stops on any difference).

The pauses come from the writing: the voice pauses at each « … » and between two lines.

## 2. One request

The key is the repository secret `GEMINI_API_KEY`: it is never typed in a conversation, never
printed, and only the workflow `voice-test` uses it. Push the text first (the workflow reads the
branch), then dispatch it with the GitHub MCP (`actions_run_trigger`, `run_workflow`,
`workflow_id: voice-test.yml`, `ref: <branch>`):

```json
{ "voicetut_speakers": "none", "gemini_voices": "D=Algieba",
  "gemini_texts": "content/voice-test/NN-trial-<id>.txt",
  "gemini_max_requests": "1" }
```

- `voicetut_speakers: "none"`: an empty value starts five VoiceTut jobs nobody asked for.
- `gemini_texts` takes several files, space-separated: one request each. Set `gemini_max_requests` to
  the number you mean to spend; the run refuses to start above it.
- Count before you dispatch: what was already asked today (`actions_list` on `voice-test.yml`).

Wait in the background, not with sleep in the foreground (the repository is public):

```bash
for i in $(seq 1 40); do s=$(curl -sS https://api.github.com/repos/mssnoussi92/quran-themes-demo/actions/runs/<id> \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d.get('conclusion'))"); \
  case "$s" in completed*) echo "$s"; exit 0;; esac; sleep 30; done; echo timeout
```

A request refused (429) leaves the takes already made in the release; read the job's log
(`get_job_logs`), wait, and dispatch **that text only** once more. Tell the owner what was spent.

## 3. Keep the take

The run attaches `D-trial-<id>.flac` (the label, then the text's name without its number) to the
pre-release `voice-test-latest`:

```bash
curl -sSfL -o content/trial/takes/D-trial-<id>.flac \
  https://github.com/mssnoussi92/quran-themes-demo/releases/download/voice-test-latest/D-trial-<id>.flac
ffprobe -v error -show_entries format=duration -of csv=p=0 content/trial/takes/D-trial-<id>.flac
```

Commit it at once: a later run of the same text replaces the file in the release.

## 4. Find every phrase, and check what was said

```bash
uv run --with faster-whisper==1.1.1 --with numpy tools/audio/align.py content/trial/takes/D-trial-<id>.flac content/voice-test/NN-trial-<id>.txt
```

One line per phrase: where it starts in the take, the pause before it, the share of its letters
Whisper heard, and what Whisper heard when that is not everything. `!!` marks a phrase mostly not
heard: a line the voice changed, skipped or said twice.

- Whisper's spelling is not the voice's fault (hamza forms, « ﷺ », an Egyptian ق heard as ء): read
  what it heard before you call a line wrong.
- A phrase said straight after a one-word question (« السر؟ ») has no pause of its own before it: it
  starts where the question ends, not at the pause before the question.
- Whisper says whether the words are there. It does not say whether the voice is good: a voice the
  owner found « very bad » was transcribed without a fault. The owner's ear judges the voice, on the
  whole videos.

Then prepare the short (`tools/trial/prepare.py --trial <id> --voice D --takes content/trial/takes
--clip <clip>`): it cuts the take between its segments, in the pauses, and **tightens them**: at most
0.5 s of silence inside a line and 0.7 s between two lines, the middle of the pause removed (the voice
holds up to 1.5 s at each « … »). Read the timeline it prints: each phrase with the second it is
said. Two phrases at the same second: one was not found.

## 5. A line to redo

There is no patch: a text is one take. Fix the line (the owner validates a changed line), then ask
for **that whole text again, one request**, with every correction of that text in it. Several texts
to redo: one run, one request each, on the same day's budget. The old take stays in the history.

A word the voice says wrong: skill `voice-spelling`.

## 6. The film

Its own lines are one text (`text:` of the film's file) and one request. The lines it takes from a
short (`reuse: <short>.<narration>`) are cut from that short's take: nothing to ask. So the shorts'
takes come first, and the film is prepared after them (`prepare.py --film <film> --voice D --takes
content/trial/takes`).

## 7. What the owner validates

The voice heard on the whole videos (`validated`, `what: [voice, …]`), never a take on its own, and
never by you. Until then a take can be replaced.
