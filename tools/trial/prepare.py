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
  # "content/voice-test/20-trial-boat.txt", voicetut_speakers "none"; then download <voice>-trial-boat.mp3
  # from the release voice-test-latest into <takes>
  uv run --with pyyaml python3 tools/trial/prepare.py --voice D --takes <takes> --clip <dir>/sea.mp4
  cd video && npx remotion render Trial916 out/trial-D.mp4 --concurrency=2 --props='{"trial":"boat","voice":"D","data":null}'

One narration take per voice holds every line of the short (the free tier of Gemini gives 10 requests a
day): each line is cut into phrases after « … ! ؟ ? . : » as everywhere else, the phrases are timed on the
pauses of the take (its longest silences, in order), and the take is cut between its segments.
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
    p.add_argument("--voice", required=True, help="label of the narration voice (D, E)")
    p.add_argument("--takes", required=True, type=Path, help="directory of the narration take <voice>-<text>.mp3 (or .wav)")
    p.add_argument("--clip", required=True, type=Path, help="the sea clip (not in the repository)")
    p.add_argument("--episode", default="khidr-solo", help="prepared episode the verses come from")
    args = p.parse_args()

    spec = yaml.safe_load((ROOT / "content" / "trial" / f"{args.trial}.yaml").read_text(encoding="utf-8"))
    episode = json.loads((PUBLIC / "data" / f"{args.episode}.json").read_text(encoding="utf-8"))
    by_source = {s["source"]["id"]: s for s in episode["scenes"] if s.get("source") and s["audio"] == "recitation"}
    out_dir = PUBLIC / "trial"
    out_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.clip, out_dir / "sea.mp4")

    # The narration: one take per voice for the whole short (the lines of content/voice-test/<text>.txt, in
    # order), cut here between its segments, in the middle of the pause before each one.
    text = ROOT / "content" / "voice-test" / f"{spec['text']}.txt"
    said = [l.strip() for l in text.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    narrated = [seg for seg in spec["segments"] if "narration" in seg]
    if said != [l["ar"] for seg in narrated for l in seg["lines"]]:
        sys.exit(f"error: {text.name} and the lines of the trial differ")
    take = next((f for f in (args.takes / f"{args.voice}-{re.sub(r'^[0-9]+-', '', spec['text'])}{ext}" for ext in (".wav", ".mp3")) if f.is_file()), None)
    if take is None:
        sys.exit(f"error: no take {args.voice}-{re.sub(r'^[0-9]+-', '', spec['text'])}.(wav|mp3) in {args.takes}")
    whole = out_dir / f"{args.trial}-{args.voice}.wav"
    run("ffmpeg", "-y", "-loglevel", "error", "-i", str(take), "-af", LEVEL, "-ar", "48000", "-ac", "1", str(whole))
    phrases = [ph for seg in narrated for l in seg["lines"] for ph in PHRASE_CUT.split(l["ar"].strip())]
    gaps = pauses(whole, len(phrases) - 1)
    lead = next((b for a, b in silences(whole) if a <= 0.05), 0.0)
    starts = [lead] + [b for _, b in gaps]                 # where each phrase starts in the take
    cuts, k = {}, 0                                         # narration id -> (from, to) in the take
    for i, seg in enumerate(narrated):
        n = sum(len(PHRASE_CUT.split(l["ar"].strip())) for l in seg["lines"])
        begin = max(0.0, lead - 0.08) if k == 0 else (gaps[k - 1][0] + gaps[k - 1][1]) / 2
        end = seconds(whole) if k + n >= len(phrases) else (gaps[k + n - 1][0] + gaps[k + n - 1][1]) / 2
        cuts[seg["narration"]] = (begin, end, k)
        k += n

    t, segments = LEAD, []
    for seg in spec["segments"]:
        if "narration" in seg:
            begin, end, k = cuts[seg["narration"]]
            wav = out_dir / f"{args.trial}-{args.voice}-{seg['narration']}.wav"
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
                             "file": f"trial/{wav.name}", "lines": lines})
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
            "clip": "trial/sea.mp4", "clip_seconds": round(seconds(args.clip), 2), "seconds": total, "segments": segments}
    out = out_dir / f"{args.trial}-{args.voice}.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    for s in segments:
        what = " | ".join(f"{ph['text']}@{ph['start']}" for l in s.get("lines", []) for ph in l["phrases"]) or s.get("reference")
        print(f"{s['start']:6.2f}  {s['kind']:9s} {s['seconds']:5.2f} s  {s['scene']:6s} {what}")
    print(f"{out.relative_to(ROOT)}: {total} s")


if __name__ == "__main__":
    main()
