#!/usr/bin/env python3
"""The channel's trailer (content/trial/trailer.yaml): its extract, its covers, its sound, its timeline.

  - the word written at the start (« أبابيل »): the last word of 105:3 in the registry (content/sources/quran.yaml),
    never typed; the number of passages: counted in quran-reels' config/plan.yaml, never typed;
  - the reel's 105:3, cut from its YouTube version (quran-reels release `reels`), picture alone: the sound is in the
    mix; its last frame, for the labels that follow it;
  - the six lines of the voice found in the take (tools/audio/align.py), each cut from its first word to the pause
    before the next line, placed on the timeline; the voice never plays under the verse;
  - the sound effects (tools/trial/sfx.py: made from noise, nothing musical), never under the verse either;
  - one mix: the voice brought to -16 LUFS like every narration of the model, the recitation as the reel has it (the
    reel is at -16 LUFS), the effects under them; the whole at -16 LUFS integrated, peaks under -1.9 dBFS;
  - video/src/trial/trailerData.ts: every time and text the drawing needs (Trailer.tsx).

    uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/trailer.py

Files go to video/public/trial/trailer/ (ignored by git) and build/trailer/ (downloads).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

import numpy as np
import yaml

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "audio"))
sys.path.insert(0, str(ROOT / "tools" / "trial"))
import align  # noqa: E402
import sfx  # noqa: E402

RATE = sfx.RATE                      # 48 kHz
FPS = 30
OUT = ROOT / "video" / "public" / "trial" / "trailer"
CACHE = ROOT / "build" / "trailer"
DATA = ROOT / "video" / "src" / "trial" / "trailerData.ts"
RELEASES = "https://github.com/mssnoussi92/quran-themes-demo/releases/download"
TARGET, PEAK = -16.0, 10 ** (-1.9 / 20)
SFX_GAIN = 0.32                      # effects under the voice, never over it


def fetch(url: str, path: Path) -> Path:
    if not path.exists() or path.stat().st_size == 0:
        path.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url, timeout=120) as r:
            path.write_bytes(r.read())
    return path


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def read_audio(path: Path, start: float | None = None, end: float | None = None) -> np.ndarray:
    """Mono float at RATE, from any file ffmpeg reads."""
    cut = [] if start is None else ["-ss", f"{start:.3f}", "-to", f"{end:.3f}"]
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", *cut, "-i", str(path), "-ac", "1", "-ar", str(RATE),
                          "-f", "s16le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float64) / 32768


def loudness(x: np.ndarray) -> float:
    """EBU R128 integrated loudness of a mono signal, by ffmpeg's ebur128."""
    tmp = CACHE / "measure.wav"
    write_wav(tmp, x)
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(tmp), "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])


def write_wav(path: Path, x: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def fade(x: np.ndarray, seconds: float = 0.03) -> np.ndarray:
    n = min(len(x) // 2, int(seconds * RATE))
    ramp = np.linspace(0, 1, n)
    x = x.copy()
    x[:n] *= ramp
    x[len(x) - n:] *= ramp[::-1]
    return x


def registry_text(source: str) -> str:
    entries = yaml.safe_load((ROOT / "content" / "sources" / "quran.yaml").read_text(encoding="utf-8"))
    entry = next(e for e in entries if e["id"] == source)
    return entry["text_ar"]


def voice_lines(take: Path, text: Path) -> list[dict]:
    """Each line of the voice text: where its first word starts in the take, where it ends (the start of the pause
    before the next line, or the last sound), and where each of its phrases starts, from the line's start."""
    lines = [ln for ln in text.read_text(encoding="utf-8").splitlines() if ln and not ln.startswith("#")]
    found = align.phrases_in_take(take, lines)
    weak = align.report(found)
    if weak:
        raise SystemExit(f"error: {weak} phrase(s) of the take not heard: listen before going on")
    per_line = [align.phrases_of([ln]) for ln in lines]
    x = read_audio(take)
    sound = np.flatnonzero(np.abs(x) > 10 ** (-40 / 20))
    last = sound[-1] / RATE + 0.12
    out, k = [], 0
    for i, phrases in enumerate(per_line):
        mine = found[k:k + len(phrases)]
        k += len(phrases)
        nxt = found[k] if k < len(found) else None
        end = (nxt.pause[0] + 0.12 if nxt and nxt.pause else nxt.start - 0.05) if nxt else last
        start = max(0.0, mine[0].start - 0.04)
        out.append({"line": lines[i], "start": round(start, 3), "end": round(end, 3),
                    "phrases": [round(p.start - start, 3) for p in mine]})
    return out


def main() -> int:
    spec = yaml.safe_load((ROOT / "content" / "trial" / "trailer.yaml").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)

    # The word and the number, from their sources.
    verse = registry_text(spec["reel"]["verse"])
    word = verse.split()[spec["reel"]["word"]]
    plan = yaml.safe_load(urllib.request.urlopen(spec["plan"], timeout=60).read().decode("utf-8"))
    passages = sum(len(v) for v in plan["surahs"].values())
    print(f"word « {word} » (from {spec['reel']['verse']}), {passages} passages (quran-reels' plan)")

    # The reel's 105:3: the picture, its last frame, its sound.
    reel = fetch(spec["reel"]["url"], CACHE / "reel.mp4")
    a, b = spec["reel"]["start"], spec["reel"]["end"]
    ffmpeg("-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(reel), "-an", "-r", str(FPS), "-c:v", "libx264",
           "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", str(OUT / "verse.mp4"))
    ffmpeg("-sseof", "-0.1", "-i", str(OUT / "verse.mp4"), "-frames:v", "1", "-update", "1", str(OUT / "verse-end.png"))
    recitation = fade(read_audio(reel, a, b), 0.05)

    # Covers of the series.
    covers = []
    for i, s in enumerate(spec["series"]):
        name = f"series-{i + 1}.jpg"
        fetch(f"{RELEASES}/{s['cover']}", OUT / name)
        covers.append({"file": f"trial/trailer/{name}", "ar": s["ar"], "en": s["en"]})

    # The voice.
    lines = voice_lines(ROOT / spec["take"], ROOT / "content" / "voice-test" / f"{spec['text']}.txt")
    take = read_audio(ROOT / spec["take"])
    cuts = [fade(take[int(ln["start"] * RATE):int(ln["end"] * RATE)], 0.02) for ln in lines]
    gain = 10 ** ((TARGET - loudness(np.concatenate(cuts))) / 20)
    cuts = [c * gain for c in cuts]
    dur = [len(c) / RATE for c in cuts]

    # The timeline (seconds).
    t: dict[str, float] = {"hook": 0.0, "say1": 0.35}
    t["verse"] = round(max(3.0, t["say1"] + dur[0] + 0.45), 2)
    t["verse_end"] = round(t["verse"] + (b - a), 2)
    t["labels"] = t["say2"] = round(t["verse_end"] + 0.35, 2)
    t["label2"] = round(t["say2"] + lines[1]["phrases"][1], 2)
    t["count"] = round(t["say2"] + dur[1] + 0.55, 2)
    t["say3"] = round(t["count"] + 0.2, 2)
    t["number"] = round(t["say3"] + lines[2]["phrases"][1], 2)
    t["stories"] = round(t["say3"] + dur[2] + 0.55, 2)
    t["say4"] = round(t["stories"] + 0.2, 2)
    scene = 2.3
    t["series"] = round(t["stories"] + 3 * scene, 2)
    card = 1.15
    t["sources"] = round(t["series"] + len(covers) * card + 0.15, 2)
    t["say5"] = round(t["sources"] + 0.2, 2)
    t["follow"] = round(t["say5"] + dur[4] + 0.5, 2)
    t["say6"] = round(t["follow"] + 0.2, 2)
    t["press"] = round(t["say6"] + lines[5]["phrases"][1] - 0.25, 2)
    t["end"] = round(t["say6"] + dur[5] + 2.2, 2)
    quiet = [(t["verse"], t["verse_end"])]

    # The effects: never under the verse.
    events = [(0.05, "impact"), (t["verse"] - 0.8, "whoosh"), (t["labels"], "pop"), (t["label2"], "pop"),
              (t["count"] - 0.3, "whoosh"), (t["number"], "pops"), (t["number"] + 1.15, "impact"),
              (t["stories"] - 0.3, "whoosh"), (t["stories"] + scene - 0.25, "whoosh"), (t["stories"] + 2 * scene - 0.25, "whoosh")]
    events += [(t["series"] + k * card, "pop") for k in range(len(covers))]
    events += [(t["sources"] + 1.0 + k * 0.35, "click") for k in range(4)]
    events += [(t["follow"] - 0.3, "whoosh"), (t["press"], "click")]
    effects = CACHE / "sfx.wav"
    sfx.track(events, quiet, t["end"], effects, word="")
    fx = read_audio(effects) * SFX_GAIN

    # The mix.
    total = int(t["end"] * RATE) + RATE
    mix = np.zeros(total)

    def put(x: np.ndarray, at: float) -> None:
        i = int(at * RATE)
        mix[i:i + len(x)] += x[: total - i]

    put(fx, 0.0)
    put(recitation, t["verse"])
    for k, c in enumerate(cuts):
        at = t[f"say{k + 1}"]
        end = at + len(c) / RATE
        if at < quiet[0][1] and end > quiet[0][0]:
            raise SystemExit(f"error: the voice's line {k + 1} would play under the verse")
        put(c, at)
    mix = mix[: int(t["end"] * RATE)]
    measured = loudness(mix)
    mix *= 10 ** ((TARGET - measured) / 20)
    peak = float(np.max(np.abs(mix)))
    if peak > PEAK:                      # a hard ceiling on the rare peaks: the loudness barely moves
        mix = np.where(np.abs(mix) > PEAK, np.sign(mix) * (PEAK + (np.abs(mix) - PEAK) * 0.1), mix)
        mix = np.clip(mix, -PEAK, PEAK)
    write_wav(OUT / "audio.wav", mix)
    print(f"mix: {measured:.1f} LUFS before, {loudness(mix):.1f} after; {t['end']:.1f} s")

    def fill(text: str) -> str:
        return text.replace("{word}", word).replace("{passages}", str(passages))

    beats = spec["beats"]
    data = {
        "fps": FPS, "seconds": t["end"], "t": t, "scene": scene, "card": card,
        "word": word, "passages": passages, "verseSeconds": round(b - a, 3),
        "hook": {"ar": fill(beats["hook"]["ar"]), "en": beats["hook"]["en"]},
        "labels": beats["verse"]["labels"],
        "count": {"ar": [fill(x) for x in beats["count"]["ar"]],
                  "en": [x.replace("{passages}", f"{passages:,}") for x in beats["count"]["en"]]},
        "stories": {"ar": beats["stories"]["ar"], "en": beats["stories"]["en"], "scenes": spec["stories"]},
        "series": covers,
        "sources": {"ar": beats["sources"]["ar"], "en": beats["sources"]["en"]},
        "follow": {"ar": beats["follow"]["ar"], "en": beats["follow"]["en"]},
        "handle": spec["handle"],
        "voice": [{"line": ln["line"], "at": t[f"say{k + 1}"], "seconds": round(dur[k], 3),
                   "phrases": ln["phrases"]} for k, ln in enumerate(lines)],
    }
    DATA.write_text("// Written by tools/trial/trailer.py from content/trial/trailer.yaml: do not edit.\n"
                    f"export const TRAILER = {json.dumps(data, ensure_ascii=False, indent=1)} as const;\n",
                    encoding="utf-8")
    for k, v in t.items():
        print(f"  {k:10s} {v:6.2f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
