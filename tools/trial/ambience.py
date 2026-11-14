#!/usr/bin/env python3
"""The ambience under the narration of a trial video (content/trial/<id>.yaml, `ambience`; docs/retention.md).

A field recording under the voice (the sea under the boat, a night in the country under the house, wind in
a tree under the wall), so that the pauses of the voice are not dead air. NEVER under a recitation nor under
a hadith: the bed fades out before each one, is silent (digital zero) while it lasts, and comes back after.

One bed per video, as long as the video, made by tools/trial/prepare.py (a short) and tools/trial/film.py
(the film, one recording per picture): video/public/trial/<name>-ambience.m4a, played by the composition
from its first frame, and <name>-ambience.wav beside it.

  # the bed under a video already rendered: its picture is copied, not encoded again
  python3 tools/trial/ambience.py --mix video/out/essai/khidr-short-1-boat.mp4 --bed video/public/trial/boat-D-ambience.wav --out <new.mp4>

The recordings are BigSoundBank's (Joseph Sardin), CC0: free for any use, no credit required (the
descriptions credit them all the same). They are downloaded to build/trial/ambience/, never committed.
`level` of a trial's `ambience` is the loudness of its bed in LUFS (the voice is at -16).
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "build" / "trial" / "ambience"
RATE = 48000
LEVEL = -36.0        # LUFS of a bed when its trial says nothing: 20 LU under the voice
LOOP_FADE = 4.0      # seconds of the end of the excerpt crossed into its beginning, so that it loops without a seam
BEFORE = 0.8         # the bed takes this long to go before a recitation or a hadith, and is gone 0.1 s before it
AFTER = 1.0          # ... and this long to come back, from 0.15 s after it
APART = 4.0          # two of them closer than this: the bed does not come back in between
EDGE = 0.7           # one recording gives way to the next in this time (the pictures of the film do the same)
SHORT_RUN = 8.0      # a picture shown less than this does not change the ambience (the film's opening: three pictures in six seconds)
START, END = 0.4, 1.5  # the bed comes in at the first frame and leaves with the last one
SOURCES = {"bigsoundbank": "https://bigsoundbank.com/UPLOAD/ogg/{id}.ogg"}


def fetch(spec: dict) -> Path:
    """The recording of a trial's `ambience`, downloaded once."""
    path = CACHE / f"{spec['source']}-{spec['id']}.ogg"
    if not path.is_file() or path.stat().st_size == 0:
        CACHE.mkdir(parents=True, exist_ok=True)
        url = SOURCES[spec["source"]].format(id=spec["id"])
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) fetch"})
        with urllib.request.urlopen(request, timeout=300) as r:
            path.write_bytes(r.read())
    return path


def loudness(path: Path) -> float:
    log = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    found = re.findall(r"I:\s+(-?[\d.]+) LUFS", log)
    if not found:
        sys.exit(f"error: no loudness measured for {path}")
    return float(found[-1])


def write_wav(samples, path: Path) -> None:
    """Float stereo samples -> 16-bit WAV (through ffmpeg, which dithers nothing: a bed at -36 LUFS has 60 dB to spare)."""
    import numpy as np
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(RATE), "-ac", "2", "-i", "-",
                    "-c:a", "pcm_s16le", str(path)], input=np.ascontiguousarray(samples, dtype=np.float32).tobytes(), check=True)


def loop(spec: dict):
    """The excerpt of the recording as one seamless loop at its level: stereo float samples."""
    import numpy as np
    source = fetch(spec)
    # Below 90 Hz a field recording is wind on the microphone and handling: it eats the headroom and no phone plays it.
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(spec.get("from", 0)), "-t", str(spec.get("seconds", 60) + LOOP_FADE),
                          "-i", str(source), "-af", "highpass=f=90", "-ar", str(RATE), "-ac", "2", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
    n = int(LOOP_FADE * RATE)
    if len(x) < 3 * n:
        sys.exit(f"error: the excerpt of {source.name} is too short to loop")
    k = np.linspace(0.0, 1.0, n, dtype=np.float32)[:, None]
    body = x[:-n]
    body[:n] = body[:n] * np.sqrt(k) + x[-n:] * np.sqrt(1 - k)      # equal power: two different moments of the same sea
    probe = CACHE / f"{source.stem}.loop.wav"
    write_wav(body, probe)
    gain = 10 ** ((float(spec.get("level", LEVEL)) - loudness(probe)) / 20)
    return body * gain


def ramp(times, points):
    """Gains at `times` from (time, 0 or 1) points, each change eased (raised cosine)."""
    import numpy as np
    xs, ys = zip(*points)
    return 0.5 - 0.5 * np.cos(np.pi * np.interp(times, xs, ys))


def quiet_gate(times, quiet: list[tuple[float, float]]):
    """1 where the bed may sound, 0 from just before each recitation or hadith to just after it."""
    import numpy as np
    merged: list[list[float]] = []
    for a, b in sorted(quiet):
        if merged and a - merged[-1][1] < APART:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    gate = np.ones(len(times), dtype=np.float32)
    for a, b in merged:
        gate *= ramp(times, [(a - 0.1 - BEFORE, 1), (a - 0.1, 0), (b + 0.15, 0), (b + 0.15 + AFTER, 1)])
    return gate, [(a, b) for a, b in merged]


def runs_of(shots: list[tuple[float, str]], seconds: float) -> list[tuple[float, float, str]]:
    """(start, end, name) of each stretch of one ambience; a stretch shorter than SHORT_RUN takes its neighbour's."""
    runs: list[list] = []
    for start, name in shots:
        if runs and runs[-1][2] == name:
            continue
        if runs:
            runs[-1][1] = start
        runs.append([start, seconds, name])
    for i, run in enumerate(runs):
        if run[1] - run[0] < SHORT_RUN:
            later = next((r[2] for r in runs[i + 1:] if r[1] - r[0] >= SHORT_RUN), None)
            run[2] = runs[i - 1][2] if i and runs[i - 1][1] - runs[i - 1][0] >= SHORT_RUN else (later or run[2])
    merged: list[list] = []
    for run in runs:
        if merged and merged[-1][2] == run[2]:
            merged[-1][1] = run[1]
        else:
            merged.append(list(run))
    return [(a, b, name) for a, b, name in merged]


def bed(specs: dict[str, dict], shots: list[tuple[float, str]], quiet: list[tuple[float, float]], seconds: float, out: Path, end: float = END) -> dict:
    """Write the bed of a video (<out>.wav and <out>.m4a) and say what was done.

    specs: the `ambience` of each name; shots: (start, name), the ambience in force from each moment (a short
    has one, from 0); quiet: (start, end) of every recitation and hadith; seconds: the length of the video.
    """
    import numpy as np
    n = int(round(seconds * RATE))
    times = np.arange(n, dtype=np.float64) / RATE
    gate, silent = quiet_gate(times, quiet)
    gate *= ramp(times, [(0, 0), (START, 1), (seconds - end, 1), (seconds, 0)])
    total = np.zeros((n, 2), dtype=np.float32)
    runs = runs_of(shots, seconds)
    loops: dict[str, np.ndarray] = {}
    for a, b, name in runs:
        spec = specs[name]
        key = f"{spec['source']}-{spec['id']}"
        if key not in loops:
            loops[key] = loop(spec)
        active = ramp(times, [(a - EDGE / 2, 0 if a > 0 else 1), (a + EDGE / 2, 1), (b - EDGE / 2, 1), (b + EDGE / 2, 0 if b < seconds else 1)])
        body = loops[key]
        tiled = np.tile(body, (n // len(body) + 1, 1))[:n]
        total += tiled * (active * gate)[:, None].astype(np.float32)
    for a, b in silent:                                   # the rule itself: nothing at all under a recitation or a hadith
        i, j = int(a * RATE), int(b * RATE)
        if np.any(total[i:j]):
            sys.exit(f"error: the ambience is not silent between {a:.2f} s and {b:.2f} s")
    wav, m4a = out.with_suffix(".wav"), out.with_suffix(".m4a")
    write_wav(total, wav)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "aac", "-b:a", "192k", str(m4a)], check=True)
    return {"file": m4a, "runs": runs, "silent": silent}


def mix(video: Path, bed_wav: Path, out: Path) -> None:
    """The bed under a video already rendered: the picture is copied as it is, the sound is the video's plus the bed."""
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-i", str(bed_wav),
                    "-filter_complex", "[0:a][1:a]amix=inputs=2:normalize=0:duration=first[a]",
                    "-map", "0:v", "-c:v", "copy", "-map", "[a]", "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", str(out)], check=True)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--mix", type=Path, required=True, help="a video already rendered")
    p.add_argument("--bed", type=Path, required=True, help="its bed (<name>-ambience.wav)")
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()
    mix(args.mix, args.bed, args.out)
    print(f"{args.out}: {loudness(args.out):.1f} LUFS")


if __name__ == "__main__":
    main()
