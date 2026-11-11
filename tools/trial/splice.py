#!/usr/bin/env python3
"""Render again a few stretches of a video already rendered and splice them in: the rest is not encoded again.

For a fix that changes the picture of short stretches and nothing in the timeline or the sound (a sign drawn
wrong, a text that overflowed, a drawing). Each stretch is widened to the keyframes around it, rendered alone from
the bundle, and put between the untouched parts of the video, copied as they are; the sound is the video's own.

  python3 tools/trial/splice.py <video.mp4> --bundle <bundle> --composition Trial916 \
      --props '{"trial":"boat","voice":"D","data":null}' --frames 420-899 [A-B ...] --out <fixed.mp4>

--frames: first and last frame of each stretch (seconds x 30), both included. --work: where the patches and the
pieces are kept (default: beside --out, `<out>.splice/`). --concurrency, --crf: as the video was rendered (4, 21).

Then it proves the result, or stops with exit code 1 and leaves --out unwritten: the same number of frames, every
frame outside the stretches identical to the video's (hashes of the decoded pictures), every frame inside them
identical to the patch rendered. What the patch shows is still looked at (tools/trial/check.py --at). One
render at a time in a session: this renders, so nothing heavy beside it.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FPS = 30


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    done = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if done.returncode != 0:
        sys.exit(f"error: {' '.join(cmd[:6])} …\n{(done.stderr or done.stdout)[-1500:]}")
    return done


def keyframes(video: Path) -> list[int]:
    out = run(["ffprobe", "-v", "error", "-select_streams", "v", "-skip_frame", "nokey", "-show_entries", "frame=pts_time",
               "-of", "csv=p=0", str(video)]).stdout
    return sorted({round(float(row.split(",")[0]) * FPS) for row in out.split() if row.strip(",")})


def count(video: Path) -> int:
    out = run(["ffprobe", "-v", "error", "-select_streams", "v", "-count_packets", "-show_entries", "stream=nb_read_packets",
               "-of", "csv=p=0", str(video)]).stdout
    return int(out.strip().strip(","))


def hashes(video: Path) -> list[str]:
    """The hash of every decoded picture, in order."""
    out = run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(video), "-map", "0:v", "-f", "framemd5", "-"]).stdout
    return [row.rsplit(",", 1)[1].strip() for row in out.splitlines() if row and not row.startswith("#")]


def stretches(asked: list[str], keys: list[int], total: int) -> list[tuple[int, int]]:
    """Each stretch asked, widened to the keyframes around it (first frame, frame after the last), merged."""
    wide = []
    for item in asked:
        a, _, b = item.partition("-")
        a, b = int(a), int(b or a)
        if not 0 <= a <= b < total:
            sys.exit(f"error: --frames {item}: the video has frames 0 to {total - 1}")
        wide.append((max(k for k in keys if k <= a), min([k for k in keys if k > b] or [total])))
    wide.sort()
    merged = [wide[0]]
    for a, b in wide[1:]:
        if a <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(b, merged[-1][1]))
        else:
            merged.append((a, b))
    return merged


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("video", type=Path)
    p.add_argument("--bundle", type=Path, required=True)
    p.add_argument("--composition", required=True)
    p.add_argument("--props", required=True)
    p.add_argument("--frames", nargs="+", required=True, metavar="A-B")
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--work", type=Path)
    p.add_argument("--concurrency", default="4")
    p.add_argument("--crf", default="21")
    args = p.parse_args()

    video, out = args.video.resolve(), args.out.resolve()
    work = (args.work or out.with_name(out.name + ".splice")).resolve()
    work.mkdir(parents=True, exist_ok=True)
    total, keys = count(video), keyframes(video)
    if not keys or keys[0] != 0:
        sys.exit(f"error: {video.name}: no keyframe at frame 0")
    todo = stretches(args.frames, keys, total)
    print(f"{video.name}: {total} frames, {len(keys)} keyframes; to render: "
          + ", ".join(f"{a}-{b - 1} ({b - a} frames)" for a, b in todo), flush=True)

    env = dict(os.environ)
    env.setdefault("REMOTION_BROWSER_EXECUTABLE",
                   "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell")
    pieces, at = [], 0
    for n, (a, b) in enumerate(todo):
        if a > at:
            pieces.append(("kept", at, a, work / f"kept-{at}.mp4"))
        patch = work / f"patch-{a}.mp4"
        if not (patch.exists() and count(patch) == b - a):
            run(["npx", "remotion", "render", str(args.bundle.resolve()), args.composition, str(patch), f"--frames={a}-{b - 1}",
                 f"--concurrency={args.concurrency}", f"--crf={args.crf}", f"--props={args.props}", "--log=error"],
                cwd=ROOT / "video", env=env)
        if count(patch) != b - a:
            sys.exit(f"error: the patch {patch.name} has {count(patch)} frames, {b - a} expected")
        pieces.append(("patch", a, b, patch))
        print(f"  patch {n + 1}/{len(todo)} rendered: frames {a}-{b - 1}", flush=True)
        at = b
    if at < total:
        pieces.append(("kept", at, total, work / f"kept-{at}.mp4"))

    listing = work / "list.txt"
    rows = []
    for kind, a, b, path in pieces:
        part = work / f"part-{a}.mp4"
        if kind == "kept":      # copied as it is, from a keyframe to the frame before the next stretch's keyframe
            run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{a / FPS:.6f}", "-i", str(video), "-map", "0:v", "-c", "copy",
                 "-frames:v", str(b - a), str(part)])
        else:                   # the patch's picture alone (Remotion adds a silent track)
            run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(path), "-map", "0:v", "-c", "copy", str(part)])
        if count(part) != b - a:
            sys.exit(f"error: the part {part.name} has {count(part)} frames, {b - a} expected")
        rows.append(f"file '{part}'\n")
    listing.write_text("".join(rows), encoding="utf-8")
    fixed = work / "fixed.mp4"
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-i", str(video),
         "-map", "0:v", "-map", "1:a", "-c", "copy", "-movflags", "+faststart", str(fixed)])

    # The proof: same length, the frames kept are the video's, the frames patched are the patch's.
    if count(fixed) != total:
        sys.exit(f"error: {count(fixed)} frames after the splice, {total} before")
    before, after = hashes(video), hashes(fixed)
    if len(before) != len(after):
        sys.exit(f"error: {len(after)} pictures decoded after the splice, {len(before)} before")
    changed = 0
    for kind, a, b, path in pieces:
        want = before[a:b] if kind == "kept" else hashes(path)
        wrong = [a + i for i, (x, y) in enumerate(zip(want, after[a:b])) if x != y]
        if wrong or len(want) != b - a:
            sys.exit(f"error: frames {a}-{b - 1} ({kind}): {len(wrong)} picture(s) differ from the {'video' if kind == 'kept' else 'patch'}, first at {wrong[:3]}")
        if kind == "patch":
            changed += sum(1 for x, y in zip(before[a:b], after[a:b]) if x != y)
    shutil.move(str(fixed), str(out))
    patched = sum(b - a for kind, a, b, _ in pieces if kind == "patch")
    print(f"{out.name}: {total} frames, {patched} rendered again ({changed} differ from the video), {total - patched} copied and identical; sound copied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
