#!/usr/bin/env python3
"""The sound effects of a short (« خريطة كلمة », owner's request, 2026-11-14: « il manque des effets sonores, sur le
compteur »), one track as long as the video, played under it as the ambience is (`sfx` of the prepared data).

Every sound is made here from noise and a falling sine (numpy), nothing downloaded, nothing to credit, and nothing
musical: no note, no melody, no instrument; ticks, a low knock, a breath of air, clicks. A sound never plays under a
verse (nor under a hadith): the track stops with an error rather than put one there.

The events come from the short's file, `sfx` of a segment: `[sound, seconds after the segment starts]`:

  scan     the counter of the opening: one tick each time the scan of the grid reaches a verse that holds the word,
           ticks closer and closer as the scan speeds up, over a breath that rises (times: SCAN_LEAD, SCAN and `scan_x`,
           the same as in video/src/trial/WordMap.tsx)
  impact   the number lands
  whoosh   the picture changes
  pops     the dots fall into their place (a roll of small pops)
  click    a ring is set on a dot
  lock     a padlock shuts

Called by tools/trial/prepare.py; alone, to listen: python3 tools/trial/sfx.py --word qalb --out <file.wav>
"""
from __future__ import annotations

import argparse
import json
import math
import re
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
RATE = 48000
SCAN_LEAD = 0.5       # the scan starts this long before its segment: at the first frame of the video
SCAN = 3.3            # seconds the scan takes from the top of the grid to the bottom
COLS = 96             # verses on a row of the grid (video/src/trial/Count.tsx)


def scan_x(f: float) -> float:
    """The share of the scan's time at which it reaches the share `f` of the grid's rows: it goes 0.5x + 0.5x² of the
    way in x of its time (half speed at the start, one and a half at the end), so the ticks come closer and closer."""
    return (-1 + math.sqrt(1 + 8 * f)) / 2


def word_data(word: str) -> dict:
    text = (ROOT / "video" / "src" / "trial" / "mapData.ts").read_text(encoding="utf-8")
    data = json.loads(re.search(r"MAP = (\{.*\}) as const", text).group(1))
    return {"verses": data["verses"], **data["words"][word]}


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def lowpass(x: np.ndarray, cutoff: np.ndarray | float) -> np.ndarray:
    """A one-pole low-pass, its cutoff (Hz) fixed or moving sample by sample."""
    a = 1 - np.exp(-2 * np.pi * np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape) / RATE)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def tick(seed: int, gain: float = 1.0) -> np.ndarray:
    n = int(0.018 * RATE)
    t = np.arange(n) / RATE
    noise = rng(seed).standard_normal(n)
    bright = np.diff(noise, prepend=0.0)                    # the high part of the noise: a dry tick
    return gain * 0.085 * bright * np.exp(-t / 0.0022)                 # a peak near -12 dBFS


def knock() -> np.ndarray:
    """The number lands: a low knock (a sine falling from 95 to 42 Hz, half a second) and a short dull burst."""
    n = int(0.75 * RATE)
    t = np.arange(n) / RATE
    freq = 42 + 53 * np.exp(-t / 0.08)
    body = np.sin(2 * np.pi * np.cumsum(freq) / RATE) * np.exp(-t / 0.22)
    burst = lowpass(rng(7).standard_normal(n), 900.0) * np.exp(-t / 0.025)
    return 0.68 * (0.62 * body + 0.5 * burst)                          # a peak near -6 dBFS


def whoosh(seconds: float = 0.55, seed: int = 3) -> np.ndarray:
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    shape = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 2
    out = lowpass(rng(seed).standard_normal(n), 300 + 2600 * shape)
    return 0.16 * out * shape


def pop(seed: int) -> np.ndarray:
    n = int(0.03 * RATE)
    t = np.arange(n) / RATE
    noise = rng(seed).standard_normal(n)
    band = lowpass(noise, 2400.0) - lowpass(noise, 500.0)
    return 0.22 * band * np.exp(-t / 0.006)


def pops(seconds: float = 0.8, count: int = 22, seed: int = 11) -> np.ndarray:
    out = np.zeros(int((seconds + 0.05) * RATE))
    r = rng(seed)
    for k, at in enumerate(np.sort(r.uniform(0, seconds, count))):
        p = pop(seed + k) * r.uniform(0.5, 1.0)
        i = int(at * RATE)
        out[i:i + len(p)] += p[:len(out) - i]
    return out


def click(seed: int = 21) -> np.ndarray:
    out = np.zeros(int(0.06 * RATE))
    for at, gain in ((0.0, 1.0), (0.022, 0.45)):
        c = tick(seed + int(at * 1000), 1.2 * gain)
        i = int(at * RATE)
        out[i:i + len(c)] += c
    return out


def lock() -> np.ndarray:
    k = knock()[: int(0.2 * RATE)] * 0.35
    out = np.zeros(int(0.2 * RATE))
    out[: len(k)] += k
    c = click(31) * 1.4
    out[: len(c)] += c
    return out


def scan(word: str) -> tuple[np.ndarray, int]:
    """The ticks of the scan and the breath under it; returns the sound and how many ticks it has. Its time 0 is the
    start of the scan (SCAN_LEAD before its segment)."""
    data = word_data(word)
    rows = (data["verses"] - 1) // COLS
    times = sorted({round(SCAN * scan_x((v // COLS) / rows), 3) for v, _, _ in data["each"]})
    n = int((SCAN + 0.1) * RATE)
    t = np.arange(n) / RATE
    rise = np.clip(t / SCAN, 0, 1)
    out = 0.05 * lowpass(rng(5).standard_normal(n), 400 + 1800 * rise) * rise ** 1.5 * (t <= SCAN)
    for k, at in enumerate(times):
        c = tick(100 + k, 0.8 + 0.4 * at / SCAN)
        i = int(at * RATE)
        out[i:i + len(c)] += c[: n - i]
    return out, len(times)


def track(events: list[tuple[float, str]], quiet: list[tuple[float, float]], total: float, out: Path, word: str) -> dict:
    """The track of `events` ((seconds, sound)), `total` seconds long, written to `out`. `quiet`: the verses."""
    made = {"impact": knock, "whoosh": whoosh, "pops": pops, "click": click, "lock": lock}
    audio = np.zeros(int((total + 1) * RATE))
    counts: dict[str, int] = {}
    for at, sound in sorted(events):
        if sound == "scan":
            clip, ticks = scan(word)
            at -= SCAN_LEAD
            counts["ticks"] = ticks
        elif sound in made:
            clip = made[sound]()
        else:
            raise SystemExit(f"error: no sound « {sound} » (scan, {', '.join(made)})")
        begin, end = at, at + len(clip) / RATE
        hit = next(((a, b) for a, b in quiet if begin < b + 0.1 and end > a - 0.1), None)
        if hit:
            raise SystemExit(f"error: the sound « {sound} » at {begin:.2f}-{end:.2f} s would play under the verse at "
                             f"{hit[0]:.2f}-{hit[1]:.2f} s")
        i = max(0, int(at * RATE))
        audio[i:i + len(clip)] += clip[: len(audio) - i]
        counts[sound] = counts.get(sound, 0) + 1
    audio = audio[: int(total * RATE)]
    peak = float(np.max(np.abs(audio))) if len(audio) else 0.0
    if peak > 0.89:                                         # under -1 dBFS: never clipped
        audio *= 0.89 / peak
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes())
    return {"file": out, "summary": ", ".join(f"{k} {v}" for k, v in counts.items()) + f"; peak {20 * math.log10(max(peak, 1e-9)):.1f} dBFS"}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--word", default="qalb")
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()
    events = [(SCAN_LEAD, "scan"), (4.0, "impact"), (5.0, "whoosh"), (6.0, "pops"), (7.2, "click"), (8.0, "lock")]
    print(track(events, [], 9.0, args.out, args.word)["summary"])


if __name__ == "__main__":
    main()
