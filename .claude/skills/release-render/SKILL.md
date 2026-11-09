---
name: release-render
description: Render an episode of quran-themes-demo for the owner (workflow render, reel all - the whole episode in 16:9 and 9:16, every reel, the YouTube thumbnail, the texts to paste) - first as a candidate in a draft release with the list « à vérifier », for the owner's one validation at the end; then, on the owner's « je valide », record every validation (scripts/finalize.py validate) and promote the candidate's very videos to <episode>-latest (workflow promote); or a final render of an episode already validated after a change to the compositions. Check the videos, give the owner the links. Use when an episode is ready for the owner, when the owner says « je valide », after a change every episode shares, and whenever the owner asks for the videos.
---

# Release render

The owner publishes by hand from the `<episode>-latest` pre-release: `<episode>-16x9.mp4` (YouTube),
`<episode>-9x16.mp4`, one MP4 per reel, `<episode>-thumbnail.png`, and in its notes the title and
text to paste for each video (`video/scripts/publish.ts`). Since 2026-11-08 the owner validates
**once, at the end, on the videos** (their decision): a candidate render first, then their word,
then the same videos become the final ones. Nothing is validated by Claude; Claude only records the
owner's word.

## 1. Candidate render (mode `candidate`)

Before:
- Everything checked as the skills say: sources by `content/policy.yaml`, script (format, dialect,
  spellings: `validate.py` with no warning left unexplained), takes (`listen.py --episode <episode>
  --save`: Whisper, trailing sounds; `--phrases`; retakes), recordings, backgrounds drawn and looked
  at on a local still. Draft renders stay local: look at their frames yourself.
- The checked takes stored as candidates: `python3 tools/audio/build.py --episode <episode>
  --candidate --tts-python /bin/false` (FLAC + `takes.json`, `status: candidate`), and
  `content/audio/<episode>/checks.json` (from `listen.py --save`) committed with them.
- `python3 tools/audio/build.py --episode <episode> --require-committed --tts-python /bin/false`
  passes; commit and push (the workflow renders the head of the branch at dispatch time).

Dispatch: GitHub MCP `actions_run_trigger`, `run_workflow`, `workflow_id: render.yml`,
`ref: <branch>`, inputs `{"episode": "<episode>", "reel": "all", "speaker": "Mohammed", "mode":
"candidate"}`; `actions_list` → `list_workflow_runs` on `render.yml` gives the run.

It goes to a **draft** release `<episode>-candidate` (only the repository's owner sees it, signed in
on GitHub), replacing the previous one. Its notes: the list « à vérifier » (`video/scripts/review.ts`:
what « je valide » will validate, the new voice with what Whisper heard, the lessons and life
examples, the sources and readings, new backgrounds and spellings, automatic warnings, each with its
minute in each video), then the texts to paste as they are now. Assets: the videos, the thumbnail,
`final-notes.md` (the notes as validated) and `candidate.json` (the commit rendered).

Give the owner the link of the draft release (in the run's log, step « Attach the candidate videos »,
or `list_releases` on the GitHub MCP) and say what to look at first.

## 2. The owner's answer

- **Corrections** (a line, a word, a voice, by video and minute): make them, check again, store the
  new takes as candidates, new candidate render. A changed line needs nothing else from the owner
  until the next candidate.
- **« je valide »** (for this candidate, nothing else): `uv run --with pyyaml python3 scripts/finalize.py
  validate --episode <episode> --owner mssnoussi92`. It records `validated_by` on each reel, the
  publication texts, the thumbnail, the whole episode's order, the sources and recordings quoted, the
  new backgrounds and spellings, and locks the candidate takes (same audio). Then `validate.py
  --release --reel <reel>` for each reel (and `--whole <episode>`), commit, push. Never run it on
  your own judgement, nor for a candidate the owner has not watched.
- The owner merges the PR (the promote workflow runs from `main`; a workflow must be on the default
  branch to be dispatched).

## 3. Promote

`actions_run_trigger`, `workflow_id: promote.yml`, `ref: main`, inputs `{"episode": "<episode>",
"reel": "all"}`. It checks the owner's validation (`validate.py --release`), that only validation
lines changed since the candidate's commit in what the videos are made of (`scripts/finalize.py
check`: `content/`, `video/src`, `prepare.ts`, `build.py`; docs and skills are free), then puts the
candidate's videos and `final-notes.md` in `<episode>-latest` and deletes the draft. A change since
the candidate (a line, a take, a composition) fails it: new candidate.

## 4. Final render (mode `final`)

Only for an episode already validated whose videos must change without any new content: a change
every episode shares (the reciter, Tawfiq As-Sayegh in place of Alafasy on 2026-11-08; a composition,
the signature, the reminder). It needs every reel validated and every take locked (`validate.py
--release --reel`, `build.py --require-locked`) and goes straight to `<episode>-latest`.
Dispatch all the episodes at once: they run side by side (six in 37 min). Mode `draft` (lines
synthesised in CI) is a quick look only: it writes over `<episode>-latest`, avoid it.

## 5. Wait

Not with sleep in the foreground: a background loop on the public API, which notifies you when it
ends (the run's page needs no token, the repository is public):

```bash
for i in $(seq 1 60); do s=$(curl -sS https://api.github.com/repos/mssnoussi92/quran-themes-demo/actions/runs/<id> \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d.get('conclusion'))"); \
  case "$s" in completed*) echo "$s"; exit 0;; esac; sleep 60; done; echo timeout
```

The run has three stages: `audio and data` (checks, the audio once, the episode's data), then
`render (16x9)`, `render (9x16)` and `render (reels)` side by side (one, `reels`, for a single
reel), then `release`. The longest render gives the time: about 7 minutes for `all` in the flat
style (tawakkul, run 31; 11 to 25 minutes when the renders followed each other), about 50 expected
for a nine-minute episode in paper (kahf took 2 h in one job, run 30); a single reel about 4. The
first run of an episode downloads its hadith readings (archive.org) and its reciter's surah files
(mp3quran.net), cached afterwards. A second run of the same episode and reel cancels the first: dispatch once. A
dispatch can fail on a network error: list the runs before dispatching again. On a failure:
`get_job_logs` (failed jobs only). Seen causes: a source or reel not validated (final), a line
without a committed take (`--require-committed`: store it as a candidate) or without a locked one
(final), an archive.org download that timed out (rerun the failed jobs once). A render leg that
failed: `actions_run_trigger`, `rerun_failed_jobs` on the run renders that leg again alone, then
`release`; the other legs' videos are kept (artifacts `videos-<leg>`, 7 days).

## 6. Check the videos

- Final release: `curl -sS https://api.github.com/repos/mssnoussi92/quran-themes-demo/releases/tags/<episode>-latest`
  (8 assets for 5 reels, updated now). A draft release is not on the public API: check the run's log
  and `list_releases` on the GitHub MCP.
- Frames: download the files whose look changed into a scratchpad folder of its own (public
  release), or render the same compositions locally (draft), take frames with ffmpeg and look at
  them (Read), then delete them:
  - the end of a reel: `ffmpeg -sseof -1.2 -i <reel>.mp4 -frames:v 1 end.png` (the follow call);
  - the loudness the run's log prints for each video (step « Render » of each `render (<leg>)` job): about -16 LUFS integrated, true
    peak under -1 dBTP (every part levelled by `tools/audio/build.py`, `LEVEL`); far from it, a part was
    not levelled (an old manifest: run `build.py` again);
  - the YouTube reminder in the 16:9, about 2 s after each start (`reminderStarts`, video/src/scenes.ts,
    `node --experimental-strip-types` on a small script after `npm run data`; none listed means both
    places fell on a verse or a hadith: tell the owner); an episode whose last card follows a verse
    keeps one reminder only (khidr);
  - the signature « @quran_words_daily » top right, on any frame.

## 7. Report

The link (draft candidate, or `https://github.com/mssnoussi92/quran-themes-demo/releases/tag/<episode>-latest`),
what changed, what you looked at and saw, and what remains. The texts to paste are in the notes: do
not copy them into the conversation unless asked.
