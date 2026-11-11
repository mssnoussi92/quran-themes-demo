#!/usr/bin/env python3
"""Prepare the trial short of content/trial/<id>.yaml for one narration voice (docs/retention.md).

Writes video/public/trial/<id>-<voice>.json (the timeline the composition Trial916 plays) and copies the
audio beside it. Session only: the narration takes come from the release voice-test-latest (Gemini, by
the workflow voice-test), the sea clip from Pixabay (key of the environment), the recitation and the
verses' texts from the episode khidr-solo already prepared here (npm run data, tools/audio/build.py).

  cd video && npm run data && cd ..                                     # the verses, from the registry
  python3 tools/audio/build.py --episode khidr-solo --require-committed --tts-python /bin/false && (cd video && npm run data)
  python3 tools/trial/clip.py --out <dir>/sea.mp4                          # the sea clip (PIXABAY_API_KEY)
  # the narration: workflow voice-test, gemini_voices "D=Algieba,E=Sadaltager", gemini_texts
  # "content/voice-test/20-trial-boat.txt", voicetut_speakers "none"; then download <voice>-trial-boat.flac
  # from the release voice-test-latest into content/trial/takes/ and commit it: a take that exists is
  # never asked for again (<takes> = content/trial/takes)
  uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/prepare.py --voice D --takes <takes> --clip <dir>/sea.mp4
  cd video && npx remotion render Trial916 out/trial-D.mp4 --concurrency=2 --props='{"trial":"boat","voice":"D","data":null}'

Before any voice (no request spent): --trial <id> --draft --clip <clip> writes <id>-X.json, the narration
silent and timed from its length, the recitation real; stills of Trial916 then show the script on its scenes.

One narration take per voice holds every line of the short (the free tier of Gemini gives 10 requests a
day): each line is cut into phrases after « … ! ؟ ? . : » as everywhere else, each phrase is found in the
take by its words as Whisper hears them (tools/audio/align.py; --by-pauses: by the longest silences, the
first way, for a few lines only), and the take is cut between its segments, in the pause.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "video" / "public"
GAP = 0.35          # seconds of the scene alone between two segments
LEAD = 0.5          # before the first word, the picture is already there
TAIL = 1.2          # after the last word
LEVEL = "loudnorm=I=-16:TP=-1.9:LRA=11"
PHRASE_CUT = re.compile(r"(?<=[،,….!?؟:])\s+")
MARKS = re.compile("[ً-ْٰـ]")
DRAFT_PACE = 10.0   # letters a second while speaking: the Gemini voices D and E (189 letters and 12 pauses in 24 to 27 s)


def run(*cmd: str) -> str:
    done = subprocess.run(cmd, capture_output=True, text=True)
    if done.returncode:
        sys.exit(f"error: {' '.join(cmd[:3])}…: {done.stderr[-400:]}")
    return done.stderr + done.stdout


def seconds(path: Path) -> float:
    return float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)).strip())


def silences(path: Path, floor: str = "-38dB", least: float = 0.12) -> list[tuple[float, float]]:
    log = run("ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", f"silencedetect=noise={floor}:d={least}", "-f", "null", "-")
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    return list(zip(starts, ends))


def pauses(path: Path, count: int) -> list[tuple[float, float]]:
    """The `count` longest pauses inside a take, in order: the pauses between its phrases."""
    total = seconds(path)
    inner = [(a, b) for a, b in silences(path) if a > 0.05 and b < total - 0.05]
    if len(inner) < count:
        sys.exit(f"error: {path.name}: {len(inner)} pauses for {count + 1} phrases; listen to the take")
    return sorted(sorted(inner, key=lambda g: g[1] - g[0], reverse=True)[:count])


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--trial", default="boat")
    p.add_argument("--voice", help="label of the narration voice (D, E)")
    p.add_argument("--takes", type=Path, help="directory of the narration take <voice>-<text>.flac (or .wav, .mp3)")
    p.add_argument("--clip", required=True, type=Path, help="the filmed clip of the trial (not in the repository)")
    p.add_argument("--episode", help="prepared episode the verses come from (default: `verses` of the trial)")
    p.add_argument("--draft", action="store_true",
                   help="no voice yet: the narration is silent and timed from its length (voice label X), to look at the "
                        "scenes and the script on stills before any request is spent")
    p.add_argument("--by-pauses", action="store_true", help="place the phrases on the longest pauses of the take, without Whisper (a few lines only)")
    args = p.parse_args()
    if args.draft:
        args.voice = args.voice or "X"
    elif not args.voice or not args.takes:
        sys.exit("error: --voice and --takes, or --draft")

    spec = yaml.safe_load((ROOT / "content" / "trial" / f"{args.trial}.yaml").read_text(encoding="utf-8"))
    args.episode = args.episode or spec.get("verses", "khidr-solo")
    episode = json.loads((PUBLIC / "data" / f"{args.episode}.json").read_text(encoding="utf-8"))
    by_source = {s["source"]["id"]: s for s in episode["scenes"] if s.get("source") and s["audio"] == "recitation"}
    out_dir = PUBLIC / "trial"
    out_dir.mkdir(parents=True, exist_ok=True)
    clip = out_dir / f"{args.trial}-clip.mp4"
    shutil.copyfile(args.clip, clip)

    # The narration: one take per voice for the whole short (the lines of content/voice-test/<text>.txt, in
    # order), cut here between its segments, in the middle of the pause before each one.
    text = ROOT / "content" / "voice-test" / f"{spec['text']}.txt"
    said = [l.strip() for l in text.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    narrated = [seg for seg in spec["segments"] if "narration" in seg]
    if said != [l["ar"] for seg in narrated for l in seg["lines"]]:
        sys.exit(f"error: {text.name} and the lines of the trial differ")
    phrases = [ph for seg in narrated for l in seg["lines"] for ph in PHRASE_CUT.split(l["ar"].strip())]
    whole = out_dir / f"{args.trial}-{args.voice}.wav"
    if not args.draft:
        take = next((f for f in (args.takes / f"{args.voice}-{re.sub(r'^[0-9]+-', '', spec['text'])}{ext}" for ext in (".flac", ".wav", ".mp3")) if f.is_file()), None)
        if take is None:
            sys.exit(f"error: no take {args.voice}-{re.sub(r'^[0-9]+-', '', spec['text'])}.(flac|wav|mp3) in {args.takes}")
        run("ffmpeg", "-y", "-loglevel", "error", "-i", str(take), "-af", LEVEL, "-ar", "48000", "-ac", "1", str(whole))
    if args.draft:
        # No voice yet: each phrase lasts what its letters take at the pace of the Gemini voices (7.5 a second,
        # measured on D and E) and is followed by a pause, longer at the end of a line.
        line_ends, n = set(), 0
        for seg in narrated:
            for l in seg["lines"]:
                n += len(PHRASE_CUT.split(l["ar"].strip()))
                line_ends.add(n - 1)
        starts, after, at = [], [], 0.1
        for i, ph in enumerate(phrases):
            starts.append(round(at, 2))
            stop = at + max(0.5, len(re.sub(r"[^\w]", "", MARKS.sub("", ph))) / DRAFT_PACE)
            at = stop + (0.7 if i in line_ends else 0.45)
            after.append((round(stop, 2), round(at, 2)))
        gaps = [None] + after[:-1]                          # the pause before each phrase
        draft_end = after[-1][0] + 0.2
    elif args.by_pauses:
        # The first way (five lines): the longest pauses of the take, in order. A voice that does not pause
        # at one « … » shifts every phrase after it.
        found = pauses(whole, len(phrases) - 1)
        lead = next((b for a, b in silences(whole) if a <= 0.05), 0.0)
        starts = [lead] + [b for _, b in found]            # where each phrase starts in the take
        gaps = [None] + found                               # the pause before each phrase
    else:
        # Whisper hears the take and each phrase is found by its words (tools/audio/align.py): what makes
        # one request for thirty phrases, or for a chapter, safe to cut.
        sys.path.insert(0, str(ROOT / "tools" / "audio"))
        import align
        heard = align.phrases_in_take(whole, said)
        if [h.text for h in heard] != phrases:
            sys.exit("error: the phrases of the take and of the trial differ")
        weak = align.report(heard)
        if weak:
            print(f"warning: {weak} phrase(s) mostly not heard (!!): listen before rendering; lines to redo go in ONE request")
        starts, gaps = [h.start for h in heard], [h.pause for h in heard]
    cuts, k = {}, 0                                         # narration id -> (from, to) in the take
    for i, seg in enumerate(narrated):
        n = sum(len(PHRASE_CUT.split(l["ar"].strip())) for l in seg["lines"])
        # A segment keeps 0.15 s of the pause before its first word and 0.25 s of the one after its last.
        if k == 0:
            begin = max(0.0, starts[0] - 0.08)
        elif gaps[k]:
            begin = max((gaps[k][0] + gaps[k][1]) / 2, gaps[k][1] - 0.15)
        else:
            begin = max(0.0, starts[k] - 0.03)
            print(f"warning: no pause before « {phrases[k]} »: the cut before it may clip a word, listen")
        if k + n >= len(phrases):
            end = draft_end if args.draft else seconds(whole)
        elif gaps[k + n]:
            end = min((gaps[k + n][0] + gaps[k + n][1]) / 2, gaps[k + n][0] + 0.25)
        else:
            end = max(begin + 0.1, starts[k + n] - 0.03)
        cuts[seg["narration"]] = (begin, end, k)
        k += n

    t, segments = LEAD, []
    for seg in spec["segments"]:
        if "narration" in seg:
            begin, end, k = cuts[seg["narration"]]
            wav = out_dir / f"{args.trial}-{args.voice}-{seg['narration']}.wav"
            if not args.draft:
                run("ffmpeg", "-y", "-loglevel", "error", "-i", str(whole), "-af",
                    f"atrim=start={begin:.3f}:end={end:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={end - begin - 0.05:.3f}:d=0.05", str(wav))
            lines = []
            for line in seg["lines"]:
                parts = PHRASE_CUT.split(line["ar"].strip())
                lines.append({"ar": line["ar"], "en": line["en"],
                              "phrases": [{"text": ph, "start": round(starts[k + i] - begin, 2)} for i, ph in enumerate(parts)]})
                k += len(parts)
            for i, line in enumerate(lines):      # a line stays until the next one starts
                line["end"] = lines[i + 1]["phrases"][0]["start"] if i + 1 < len(lines) else round(end - begin, 2)
            segments.append({"kind": "narration", "scene": seg["scene"], "start": round(t, 2), "seconds": round(end - begin, 2),
                             "file": None if args.draft else f"trial/{wav.name}", "lines": lines})
        else:
            scene = by_source.get(seg["verse"])
            if scene is None:
                sys.exit(f"error: {seg['verse']} is not recited in the prepared episode {args.episode}")
            src, media = scene["source"], scene["media"]
            wav = out_dir / f"{seg['verse'].replace('.', '-')}.wav"
            shutil.copyfile(PUBLIC / media["file"], wav)
            segments.append({"kind": "verse", "scene": seg["scene"], "start": round(t, 2), "seconds": media["seconds"],
                             "file": f"trial/{wav.name}", "reference": src["reference"], "text": src["display_ar"],
                             "en": src["display_en"], "words": media["words"],
                             "credit": f"{media['credit'].split(': ')[-1]} · {src['translator']}"})
        t += segments[-1]["seconds"] + GAP
    total = round(t - GAP + TAIL, 2)
    data = {"trial": args.trial, "voice": args.voice, "voice_name": spec["voices"][args.voice], "handle": spec["handle"],
            "clip": f"trial/{clip.name}", "clip_seconds": round(seconds(args.clip), 2),
            # How the clip sits in the frame (content/trial/<id>.yaml, `clip`): where it is cropped, how far it is
            # moved down (or up) to leave the text its place, how much it is darkened, the colour behind it.
            "picture": {k: spec["clip"][k] for k in ("position", "shift", "brightness", "ground", "horizon", "rate") if k in spec["clip"]},
            "seconds": total, "segments": segments}
    out = out_dir / f"{args.trial}-{args.voice}.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    for s in segments:
        what = " | ".join(f"{ph['text']}@{ph['start']}" for l in s.get("lines", []) for ph in l["phrases"]) or s.get("reference")
        print(f"{s['start']:6.2f}  {s['kind']:9s} {s['seconds']:5.2f} s  {s['scene']:6s} {what}")
    print(f"{out.relative_to(ROOT)}: {total} s")


if __name__ == "__main__":
    main()
