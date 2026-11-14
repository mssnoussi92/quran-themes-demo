#!/usr/bin/env python3
"""Look at a rendered video before it goes to the owner (docs/model.md): its format, its length against its
timeline, its loudness, and sheets of frames to open and read (sixteen a sheet).

  python3 tools/trial/check.py video/out/<name>.mp4 --data video/public/trial/<id>-<voice>.json [--out <sheet.jpg>]
  python3 tools/trial/check.py video/out/<name>.mp4 --at 0 2.5 30 88            # the seconds you choose

With --data the frames are chosen from the timeline: the first frame (what stops the thumb), the middle of
every segment (each verse and hadith on its picture, each narration line), each subscribe reminder of a film
half a second in and two seconds in (the button, then the button filled), the last line, the last second.
The sheet is for you to open (Read): a text that leaves the frame, a line over the drawing, the wrong
signature, a picture that did not change, are seen there and nowhere else.

What it cannot tell: how the voice sounds, whether the ambience is too loud. That is the owner's ear.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def probe(video: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt",
                          "-of", "json", str(video)], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def loudness(video: Path) -> tuple[float, float]:
    log = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    summary = log[log.rfind("Summary"):]
    integrated = re.search(r"I:\s+(-?[\d.]+) LUFS", summary)
    peak = re.search(r"Peak:\s+(-?[\d.]+) dBFS", summary)
    if not integrated:
        sys.exit("error: no loudness measured (no audio?)")
    return float(integrated.group(1)), float(peak.group(1)) if peak else float("nan")


def moments(data: dict) -> list[float]:
    """The seconds worth a frame, from the timeline of a short or a film."""
    at = [0.0]
    for seg in data["segments"]:
        at.append(seg["start"] + seg["seconds"] / 2)
    for t in data.get("subscribe", []):
        at += [t + 0.5, t + 2.0]
    last = data["segments"][-1]
    at += [last["start"] + last["seconds"] - 0.3, data["seconds"] - 1.0]
    return sorted({round(t, 1) for t in at if 0 <= t < data["seconds"]})


def sheet(video: Path, at: list[float], out: Path, wide: bool) -> None:
    columns = 4 if wide else 8
    cell = (640, 360) if wide else (270, 480)
    with tempfile.TemporaryDirectory() as tmp:
        frames = []
        for i, t in enumerate(at):
            frame = Path(tmp) / f"{i:03d}.png"
            label = f"{int(t // 60)}\\:{t % 60:04.1f}"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t}", "-i", str(video), "-frames:v", "1", "-vf",
                            f"scale={cell[0]}:{cell[1]},drawtext=text='{label}':x=6:y=h-30:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6",
                            str(frame)], check=True)
            frames.append(frame)
        rows = -(-len(frames) // columns)
        layout = "|".join(f"{(i % columns) * cell[0]}_{(i // columns) * cell[1]}" for i in range(len(frames)))
        inputs = [x for f in frames for x in ("-i", str(f))]
        out.parent.mkdir(parents=True, exist_ok=True)
        if len(frames) == 1:
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(frames[0]), "-q:v", "3", str(out)], check=True)
        else:
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex",
                            f"xstack=inputs={len(frames)}:layout={layout}:fill=black", "-q:v", "3", str(out)], check=True)
        print(f"{out}: {len(frames)} frames, {columns} a row, {rows} row(s)")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("video", type=Path)
    p.add_argument("--data", type=Path, help="its timeline (video/public/trial/<id>-<voice>.json)")
    p.add_argument("--at", type=float, nargs="*", help="seconds to take a frame at (default: from --data)")
    p.add_argument("--out", type=Path, help="the sheet of frames (default: beside the video, <name>-frames.jpg)")
    args = p.parse_args()
    info = probe(args.video)
    video = next(s for s in info["streams"] if s["codec_type"] == "video")
    audio = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    duration = float(info["format"]["duration"])
    print(f"{args.video.name}: {video['codec_name']} {video['width']}x{video['height']} {video['r_frame_rate']} {video['pix_fmt']}, "
          f"{audio['codec_name'] if audio else 'NO AUDIO'}, {duration:.2f} s, {int(info['format']['size']) / 1e6:.1f} MB")
    problems = 0
    data = json.loads(args.data.read_text(encoding="utf-8")) if args.data else None
    if data and abs(duration - data["seconds"]) > 0.15:
        print(f"!! the video lasts {duration:.2f} s, its timeline {data['seconds']} s: it was not rendered from this data")
        problems += 1
    integrated, peak = loudness(args.video)
    print(f"loudness: {integrated:.1f} LUFS, peak {peak:.1f} dBFS (every part is levelled to -16 LUFS: expect -16 to -16.5)")
    if not -17.5 <= integrated <= -15.0:
        print("!! far from -16 LUFS: a part was not levelled, or the ambience is too loud")
        problems += 1
    at = args.at if args.at else (moments(data) if data else [0.0, duration / 2, duration - 1.0])
    out = args.out or args.video.with_name(args.video.stem + "-frames.jpg")
    # Sixteen frames a sheet: more, and the texts are too small to read once the sheet is opened.
    pages = [at[i:i + 16] for i in range(0, len(at), 16)]
    for k, page in enumerate(pages):
        target = out if len(pages) == 1 else out.with_name(f"{out.stem}-{k + 1}{out.suffix}")
        sheet(args.video, page, target, wide=video["width"] > video["height"])
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
