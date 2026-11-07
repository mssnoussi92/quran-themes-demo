---
name: release-render
description: Run the final render of an episode of quran-themes-demo (workflow render, reel all - the whole episode in 16:9 and 9:16, every reel, the YouTube thumbnail, the texts to paste in the release notes), after checking that everything the owner validated is in place, then wait for it, check the published videos frame by frame and give the owner the links. Use when the owner has validated an episode, after a validated line or take changed, after a change to the compositions (signature, reminder...), and whenever the owner asks for the final videos.
---

# Release render

A release render publishes what the owner publishes by hand on the Quran Words Daily page: the
`<episode>-latest` pre-release holds `<episode>-16x9.mp4` (YouTube), `<episode>-9x16.mp4`, one MP4
per reel, `<episode>-thumbnail.png`, and in its notes the title and text to paste for each video
(`video/scripts/publish.ts`). It only accepts what the owner validated; it never validates anything.

## 1. Before

- Every reel validated by the owner (`validated_by`, script and translation) and its publication
  texts (`publish.validated_by`, on the episode and each reel); every quoted source and recording
  `validated`; every narration line with a locked take. Check each reel:
  `uv run --with jsonschema --with pyyaml scripts/validate.py --release --reel <reel>` (its scenes
  only: a source still proposed in another episode does not block it), then
  `python3 tools/audio/build.py --episode <episode> --require-locked --tts-python /bin/false`.
- The thumbnail is rendered either way; the notes flag it « proposée » until `thumbnail.validated_by`.
- Commit and push: the workflow renders the head of the branch it is given, at dispatch time.

## 2. Dispatch

GitHub MCP `actions_run_trigger`, method `run_workflow`, `workflow_id: render.yml`, `ref: <branch>`
(after a merge, `main` holds the same content), inputs `{"episode": "<episode>", "reel": "all",
"speaker": "Mohammed", "draft": "false"}`. Then `actions_list` → `list_workflow_runs` on
`render.yml` gives the run id and number.

- Two episodes render side by side; a second run of the same episode and reel cancels the first
  (`concurrency` in render.yml): dispatch each episode once.
- About 16 to 25 minutes for `all`; the first run of an episode also downloads its hadith readings
  from archive.org. Narration is never synthesised there when every take is locked.

## 3. Wait

Not with sleep in the foreground: a background loop on the public API, which notifies you when it
ends (the run's page needs no token, the repository is public):

```bash
for i in $(seq 1 60); do s=$(curl -sS https://api.github.com/repos/mssnoussi92/quran-themes-demo/actions/runs/<id> \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d.get('conclusion'))"); \
  case "$s" in completed*) echo "$s"; exit 0;; esac; sleep 60; done; echo timeout
```

On a failure: `get_job_logs` (failed jobs only). Seen causes: a source or a reel not validated
(the `validate.py --release` step names it), a line without a locked take (`--require-locked`), an
archive.org download that timed out (rerun the failed jobs once).

## 4. Check what was published

- `curl -sS https://api.github.com/repos/mssnoussi92/quran-themes-demo/releases/tags/<episode>-latest`:
  8 assets for 5 reels, all updated by this run (`updated_at`), and the notes start with « Release
  render » and the run's URL.
- Download into a scratchpad folder of its own the files whose look changed (the 16:9, a reel whose
  line changed), take frames with ffmpeg and look at them (Read), then delete the downloads:
  - the end of a reel: `ffmpeg -sseof -1.2 -i <reel>.mp4 -frames:v 1 end.png` (its last line, the
    follow call « تابعنا عشان تعرف »);
  - the YouTube reminder in the 16:9, about 2 s after each start (pill, « مشترك ✓ · Subscribed »,
    nothing hidden under it): the starts come from the same code as the video,

    ```ts
    // <scratchpad>/reminders.ts, run with: node --experimental-strip-types <scratchpad>/reminders.ts
    import { readFileSync } from "node:fs";
    import { reminderStarts, selectScenes } from "/home/user/quran-themes-demo/video/src/scenes.ts";
    const data = JSON.parse(readFileSync("/home/user/quran-themes-demo/video/public/data/<episode>.json", "utf8"));
    console.log(reminderStarts(selectScenes(data, null)).map((f) => (f / 30).toFixed(1)));
    ```

    (after `npm run data`; none listed means both places fell on a verse or a hadith: tell the owner);
  - the signature « @quran_words_daily » top right, on any frame.

## 5. Report

Give the owner the release link (`https://github.com/mssnoussi92/quran-themes-demo/releases/tag/<episode>-latest`),
what changed, what you looked at and saw, and what remains (a thumbnail still « proposée », a reel
not rendered). The texts to paste are in the notes: do not copy them into the conversation unless
asked.
