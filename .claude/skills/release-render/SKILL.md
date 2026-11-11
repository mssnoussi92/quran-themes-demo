---
name: release-render
description: Render, check and hand over the videos of a film and its shorts in the model of quran-themes-demo (docs/model.md) - the renders run in the session one after the other from one bundle (each short, its TikTok version, the film), each video is looked at on sheets of frames and measured before it is sent (tools/trial/check.py), the ambience is put under the narration without rendering again, a few seconds can be re-rendered and spliced in without encoding the rest, covers, thumbnail and the texts to paste go with them, and the owner's « je valide » is recorded on their word. Use when a film and its shorts are prepared with their voice, when the owner asks for the videos or sends corrections, and when the owner validates.
---

# Render, check, hand over

## 0. The workflow `film` (the normal path)

`.github/workflows/film.yml` prepares and renders a film, its shorts and their TikTok versions in parallel
jobs (a video per job) and puts them in a **draft** release `<files>-candidate` that only the owner sees. In
service since 2026-11-11: the du'a (seven videos) took 70 minutes, the film alone 65. The first film, which
reads an old episode in `verses`, is refused: it is rendered in the session (below).

- **Dispatch** with the GitHub MCP (`actions_run_trigger`, `run_workflow`, `workflow_id: film.yml`, `ref: <branch>`,
  inputs as strings), or from the Actions tab once the file is on the default branch. A push that changes
  the workflow file itself tries it on one short of the du'a (no inputs on a push; its draft is
  `<files>-workflow-test`).
  Inputs: `film` (required: `content/trial/<film>.yaml`), `voice` (D), `only` (`all`, `shorts`, `film`,
  `tiktok`, or one short's id: only that short is prepared), `ambience` (true: the bed is under the narration),
  `from_run` (see below).
- **Needs** the repository secret `PIXABAY_API_KEY` (it fails at once, saying so, when it is missing), the
  voice takes already in `content/trial/takes/` (it never asks Gemini), and a film that reads the registry.
- **What you get**: the draft release with `<files>-short-<n>-<id>.mp4`, the `-tiktok` twins,
  `<files>-film-16x9.mp4`, the covers, the thumbnail, the check sheets (`sheets/`), and the texts to paste as
  the body; each video is also a run artifact for 7 days. `tools/trial/videos.py --film <film>` lists the
  expected names. If a render failed, the rest is published, the notes name what is missing and the run is
  red: re-run the failed jobs.
- **`from_run: <run id>`** (same `film`, `voice`, `only`): nothing is prepared or rendered, the draft is made
  again from that run's artifacts, in a minute. For a release step that failed, or texts to paste corrected
  after the render.
- **Check before the owner sees anything.** Download each video's artifact into the scratchpad
  (`actions_list` `list_workflow_run_artifacts`, then `actions_get` `download_workflow_run_artifact`: a
  temporary link, `curl -L -o`), read its `-check.txt`, open its sheets, and **look at a few frames at full
  size**: a sheet shows a frame at 500 px, where a wrong glyph is invisible (« ﷺ » was an empty box in a
  whole film, 2026-11-11, and nothing on the sheets said so). A render machine has none of the session's
  fonts: `rules.py` refuses a sign the project's fonts lack, and a new kind of text on screen is still looked
  at once at full size.
- Then send the owner the videos in the conversation, or the draft's link. **The validation is still
  recorded on the owner's word** (`validated`, section 9): the workflow validates nothing.

The session path below stays valid, unchanged.

The videos of the model are rendered **in the session**, not by a workflow: the filmed clips and the
ambience recordings are not in the repository. They are sent to the owner in the conversation, and
they are in no release: tell them to keep their copies. The owner validates once, on the videos, and
only their word is recorded. The old circuit (workflow `render`, candidate, `promote`) is in
`docs/legacy/skills/release-render.md`, for a video published before.

## 1. Before

- Every short prepared with its voice, then the film (skill `new-theme`, step 7): the timelines are
  `video/public/trial/<id>-D.json`.
- `cd video && npm run typecheck`.
- **Prepare without the ambience for the first delivery** (`--no-ambience` on each `prepare.py`): the
  bed is then put under the rendered videos in two minutes (§4), and the owner can ask for another
  level or another recording without an hour of rendering. A timeline that has `ambience` plays it by
  itself: use that once the level is settled.

## 2. Render

About four frames a second on four vCPU: thirteen to twenty minutes for a short, seventy for a film
of eight minutes, and the shorts once more for TikTok. Count two hours and a half for a film and
three shorts.

```bash
cd video && export REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion bundle src/index.ts --out-dir <scratchpad>/bundle          # once; again after any change to video/src or to the data
npx remotion render <bundle> Trial916 out/<files>-short-<n>-<id>.mp4 --concurrency=4 --crf=21 --props='{"trial":"<id>","voice":"D","data":null}'
npx remotion render <bundle> TrialFilm169 out/<files>-film-16x9.mp4 --concurrency=4 --crf=21 --props='{"film":"<film>","voice":"D","data":null}'
npx remotion render <bundle> Trial916 out/<files>-short-<n>-<id>-tiktok.mp4 --concurrency=4 --crf=21 --props='{"trial":"<id>","voice":"D","platform":"tiktok","data":null}'
```

- **One script, one render at a time, in the background**: a shell script that renders each video in
  turn and appends « done <name> exit <code> » to a status file, started with `run_in_background`;
  wait on that file with a background `until grep …; do sleep 15; done`, never with sleep in the
  foreground. Shorts first (send each as it is checked), then the film, then the TikTok versions.
- **Nothing heavy beside a render**: decoding two long videos while one rendered took its memory and
  the kernel killed it at frame 1965 of 2793. An exit code other than 0: read the render's log and
  start that video again.
- The TikTok version differs by its signature only (`@quran.words.daily`, `handles.tiktok` of
  `content/publish.yaml`): `@quran_words_daily` is someone else's account there. A platform without a
  name fails the render rather than sign with the wrong account.
- The bundle copies `video/public/`: build it after the data is final, and build another one after a
  change (a render in progress keeps reading its own).

## 3. Check each video before it is sent

```bash
python3 tools/trial/check.py video/out/<video>.mp4 --data video/public/trial/<id>-D.json
```

It prints the format, the length against the timeline, the loudness (-16 to -16.5 LUFS: every part
is levelled to -16), and writes sheets of sixteen frames chosen from the timeline: the first frame,
the middle of every segment, each subscribe reminder as it opens and once filled, the last line, the
last second. **Open every sheet** and look for:

- a line of text or a translation that leaves the frame or crosses the drawing (the first film had a
  translation of three rows cut by the bottom edge: seen on the sheet, nowhere else);
- a verse on its scene, the recited word in gold, its reference and the recitation credit;
- the right signature on each version; the page's name large under the last line of a short;
- in the film: the chapter at the top left, both reminders (never over a verse or a hadith), the
  hadith's reader named, the calm picture at the end;
- a picture that did not change where the script changes scene.

`--at <seconds…>` takes the frames you name (a closer look at a doubt). What no check tells: how the
voice sounds and whether the ambience is right. Say to the owner that you did not hear the videos.

## 4. The ambience, without rendering again

Prepare again **with** the ambience (the same commands without `--no-ambience`: the timeline does
not move, the bed is written beside it), then:

```bash
python3 tools/trial/ambience.py --mix video/out/<video>.mp4 --bed video/public/trial/<id>-D-ambience.wav --out video/out/<video>-ambience.mp4
```

The picture is copied as it is, the sound is the video's plus the bed; the tool prints the loudness.
The TikTok version takes the same bed. Another level or recording (`ambience` of the short, skill
`new-scene`): prepare, mix, two minutes for seven videos. The bed is zero under every verse and
hadith or the tool stops.

## 5. A few seconds to redo in an hour of render

When a fix changes the picture of a short stretch and **nothing in the timeline or the sound**
(a text that overflowed, a drawing), render that stretch alone and splice it in between two
keyframes; the rest is not encoded again.

```bash
ffprobe -v error -select_streams v -skip_frame nokey -show_entries frame=pts_time -of csv=p=0 -read_intervals <a>%<b> <video>   # keyframes around the stretch
# k1: the keyframe at or before its first frame; k2: the first keyframe after its last frame (frame = seconds x 30)
npx remotion render <new bundle> <composition> patch.mp4 --frames=<k1>-<k2 - 1> --concurrency=4 --crf=21 --props='…'
ffmpeg -i <video> -map 0:v -c copy -frames:v <k1> A.mp4
ffmpeg -i patch.mp4 -map 0:v -c copy B.mp4
ffmpeg -ss <seconds of k2> -i <video> -map 0:v -c copy C.mp4
printf "file '%s'\n" "$PWD/A.mp4" "$PWD/B.mp4" "$PWD/C.mp4" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -i <video> -map 0:v -map 1:a -c copy -movflags +faststart fixed.mp4
```

Then prove it: the same number of frames as before (`ffprobe -count_packets`), and the frames of both
files hashed (`ffmpeg -i <file> -map 0:v -f framemd5 <file>.md5`, one file at a time): every frame
outside the stretch identical, every frame inside it equal to the patch. Look at the stretch on a
sheet. If the lengths changed, render the whole video.

## 6. Covers, thumbnail, texts

```bash
npx remotion still <bundle> TrialCover916 out/<id>-cover.png --frame=45 --props='{"trial":"<id>","voice":"D","data":null}'
npx remotion still <bundle> TrialThumb169 out/<film>-thumbnail.png --frame=45 --props='{"film":"<film>","voice":"D","data":null,"panels":null}'
ffmpeg -i out/<name>.png -q:v 2 out/<name>.jpg
uv run --with pyyaml python3 tools/trial/publish.py --film <film>
```

Look at the thumbnail reduced to 170 px wide. `publish.py` writes the texts to paste, one block per
platform, with the sources quoted, the chapters of the film, the credits (footage, ambience), the
line that declares the AI voice and the page's hashtags; it stops on a title or a caption over a
platform's limit. Give the covers the names of `cover.file` and `thumbnail.file`: the texts cite them.

## 7. Hand over

Send each video as soon as it is checked (`SendUserFile`, with its length and its loudness in the
caption), then the covers and the file of texts. The message the owner reads:

- what is delivered, with the lengths and the film's chapters;
- what you decided alone since their last word, and why;
- what they must judge: the voice on whole videos, the lessons and the endings, the montage and the
  reminder, the ambience, the titles and the covers;
- what you find weak, plainly, and what you would do about it;
- that the videos exist only in the conversation.

## 8. The owner's answer

- **Corrections**: make them, check, send the videos that changed. A line changed is a script to
  validate and a text to say again (skill `narration-takes`, §5).
- **« je valide »**: write in each file `validated: { by: <owner>, on: <date>, what: [...] }` with
  exactly what they saw and heard (`voice`, `montage`, `cover` or `thumbnail`, `subscribe`, `publish`,
  `ambience`). Something added after it (an ambience, a new line) is not covered: it waits for their
  next word. Run `publish.py` again (it says whether the texts are validated and names the final
  files), commit, push. Never on your own judgement.
- The owner publishes by hand. On YouTube: the end screen on the last twelve seconds of the film, and
  the film as the « related video » of each short. Shorts that promise a sequel go out close together.

## 9. Record

`docs/history.md` (one task entry at the end: what was delivered, decided, validated), `CLAUDE.md` (only
« Où on en est », kept current and short), `docs/model.md` if a setting or
a catalog changed, `docs/themes.md`; commit and push on the session's branch.
