#!/usr/bin/env python3
"""Listen to audio the way a session can: Whisper transcriptions, word times and loudness.

Used to check narration takes (did VoiceTut say the line?), to find a hadith inside a long
recorded reading, and to place a cut in a pause. Nothing here decides anything: the owner listens.

  FILE[@START[@DURATION]]   a WAV/MP3 (any format ffmpeg reads), optionally a window of it (seconds)

  (default)    the text Whisper hears
  --words      each word with the time Whisper gives it (its start is often the start of the
               pause before the word: check a cut with --envelope)
  --segments   one line per segment with its times (long windows, with voice activity detection)
  --envelope   loudness in dB per 20 ms window (no Whisper): pauses are the runs under about -35 dB
  --episode E  check every narration take of build/audio/E/manifest.json against its text
               (--only to pick scenes); differences are printed, the reading of a hadith included
  --phrases E  where each phrase of each narration take starts, from Whisper's words (the pause
               nearest to the first word of the phrase), next to build.py's estimate; "!!" marks a
               difference. Neither is always right (Whisper drifts in noisy pauses, the estimate
               on lines said at an uneven pace): check each "!!" that matters with --envelope, then
               store the right starts with build.py --set-phrases (title-card reveals, subtitles,
               the cut before a recorded hadith reading)

Examples:
  uv run --with faster-whisper==1.1.1 tools/audio/listen.py --episode dua --only hook-4 because
  uv run --with faster-whisper==1.1.1 tools/audio/listen.py --phrases dua
  uv run --with faster-whisper==1.1.1 tools/audio/listen.py --words build/audio/dua/hook-4.wav
  uv run --with faster-whisper==1.1.1 tools/audio/listen.py --segments reading.mp3@1300@120
  python3 tools/audio/listen.py --envelope reading.mp3@1407@1.2

Whisper: faster-whisper large-v3-turbo on CPU (int8), about real time on 4 vCPU; the model is
downloaded from Hugging Face on first use. Audio is decoded by ffmpeg into numpy (PyAV inside
faster-whisper fails on some files). Short clips (3 s) can make Whisper hallucinate: pad or widen.
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODEL = "mobiuslabsgmbh/faster-whisper-large-v3-turbo"
RATE = 16000
MARKS = re.compile("[ً-ْٰـ]")


def load(spec: str):
    """Mono 16 kHz float32 samples of FILE[@START[@DURATION]], and the window's start."""
    import numpy as np
    path, *window = spec.split("@")
    start = float(window[0]) if window else 0.0
    duration = float(window[1]) if len(window) > 1 else None
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start)] + (["-t", str(duration)] if duration else []) + \
          ["-i", path, "-ac", "1", "-ar", str(RATE), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32), start


def plain(text: str) -> list[str]:
    """Words for comparing: no diacritics or punctuation, one alef, ى = ي, ة = ه (validate.py)."""
    text = MARKS.sub("", text)
    text = re.sub("[أإآٱ]", "ا", text).replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    return re.sub(r"[^\w\s]", " ", text).split()


_model = None


def whisper():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(MODEL, device="cpu", compute_type="int8")
    return _model


def transcribe(samples, words=False, vad=False):
    segments, _ = whisper().transcribe(samples, language="ar", beam_size=5, word_timestamps=words,
                                       vad_filter=vad, condition_on_previous_text=not vad)
    return list(segments)


def envelope(spec: str) -> None:
    import numpy as np
    samples, start = load(spec)
    win = RATE // 50
    cells = []
    for i in range(0, len(samples) - win + 1, win):
        db = 20 * np.log10(np.sqrt(np.mean(samples[i:i + win] ** 2)) + 1e-9)
        cells.append(f"{start + i / RATE:.2f}:{db:.0f}")
    print(" ".join(cells))


def check_episode(episode: str, only: list[str] | None) -> int:
    """Each narration take (or its mix with a recorded reading) against the text it should say."""
    out_dir = ROOT / "build" / "audio" / episode
    scenes = json.loads((out_dir / "manifest.json").read_text())["scenes"]
    data = {s["id"]: s for s in json.loads((ROOT / "video/public/data" / f"{episode}.json").read_text())["scenes"]}
    differ = 0
    for sid, entry in scenes.items():
        if entry["kind"] != "tts" or (only and sid not in only):
            continue
        mix = entry.get("mix")
        samples, _ = load(str(out_dir / (mix or entry)["file"]))
        if mix:
            # Whisper tends to stop where the voice changes: the introduction and the reader apart.
            cut = int((mix["phrases"][-1]["start"] - 0.1) * RATE)
            parts = [samples[:cut], samples[cut:]]
        else:
            parts = [samples]
        heard = " ".join(s.text.strip() for part in parts for s in transcribe(part))
        source = (data.get(sid) or {}).get("source") or {}
        said = entry["text"] if not entry.get("mix") else \
            f"{data[sid]['narration']['ar']} {source.get('display_ar', '')}"
        a, b = plain(said), plain(heard)
        if a == b:
            print(f"ok      {sid}")
            continue
        differ += 1
        diff = [f"{x} -> {y}" for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b).get_opcodes()
                if tag != "equal" for x, y in [(" ".join(a[i1:i2]) or "∅", " ".join(b[j1:j2]) or "∅")]]
        print(f"differs {sid}: {'; '.join(diff)}\n        heard: {heard}")
    print(f"{differ} take(s) where Whisper hears something else: listen to them (dialect, names and "
          f"recognition errors are common; a wrong or missing word is a retake)")
    return 0


def pauses(path: Path) -> list[tuple[float, float]]:
    """Pauses of a take (start, end), as build.py sees them, a 40 ms blip inside a pause ignored."""
    sys.path.insert(0, str(ROOT / "tools" / "audio"))
    import build
    params, samples = build.read_wav(path)
    win, loud = build.loud_windows(samples, params.framerate)
    step = win / params.framerate
    for i in range(1, len(loud) - 2):          # a blip of 1-2 windows between two silences
        if loud[i] and not loud[i - 1]:
            j = i
            while j < len(loud) and loud[j] and j - i < 3:
                j += 1
            if j - i <= 2 and j < len(loud) and not loud[j]:
                loud[i:j] = [False] * (j - i)
    out, run = [], 0
    for i, x in enumerate(loud):
        if not x:
            run += 1
            continue
        if run >= 3:
            out.append(((i - run) * step, i * step))
        run = 0
    return out


def phrase_starts(episode: str, only: list[str] | None) -> int:
    """Phrase starts of each take from Whisper's words, snapped to the nearest pause's end."""
    sys.path.insert(0, str(ROOT / "tools" / "audio"))
    import build
    out_dir = ROOT / "build" / "audio" / episode
    scenes = json.loads((out_dir / "manifest.json").read_text())["scenes"]
    for sid, entry in scenes.items():
        if entry["kind"] != "tts" or (only and sid not in only) or entry.get("take_from"):
            continue
        phrases = build.split_phrases(entry["text"])
        if len(phrases) < 2:
            continue
        path = out_dir / entry["file"]
        samples, _ = load(str(path))
        words = [w for s in transcribe(samples, words=True) for w in s.words]
        heard = [plain(w.word) for w in words]
        flat = [(k, w) for k, phrase in enumerate(phrases) for w in plain(phrase)]
        text_words = [w for _, w in flat]
        heard_words = [h[0] if h else "" for h in heard]
        match = {a + d: b + d for a, b, n in difflib.SequenceMatcher(None, text_words, heard_words).get_matching_blocks()
                 for d in range(n)}
        gaps = pauses(path)
        starts = [round(entry["phrases"][0]["start"], 3)]
        for k in range(1, len(phrases)):
            first = next(i for i, (kk, _) in enumerate(flat) if kk == k)
            # The first word of the phrase heard by Whisper, or the nearest word after it.
            j = next((match[i] for i in range(first, len(flat)) if i in match and flat[i][0] == k), None)
            if j is None:
                starts.append(None)
                continue
            t = words[j].start
            near = [g for g in gaps if g[0] - 0.5 <= t <= g[1] + 0.4]
            starts.append(round(float(min(near, key=lambda g: abs(g[0] - t))[1]), 3) if near else round(float(t), 3))
        estimate = [p["start"] for p in entry["phrases"]]
        flag = "  " if all(s is not None and abs(s - e) <= 0.05 for s, e in zip(starts, estimate)) else "!!"
        print(f"{flag} {sid:20} whisper {starts}  build.py {estimate}", flush=True)
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = p.add_mutually_exclusive_group()
    mode.add_argument("--words", action="store_true")
    mode.add_argument("--segments", action="store_true")
    mode.add_argument("--envelope", action="store_true")
    mode.add_argument("--episode")
    mode.add_argument("--phrases", metavar="EPISODE")
    p.add_argument("--only", nargs="+", metavar="SCENE")
    p.add_argument("files", nargs="*", metavar="FILE[@START[@DURATION]]")
    args = p.parse_args()
    if args.episode:
        return check_episode(args.episode, args.only)
    if args.phrases:
        return phrase_starts(args.phrases, args.only)
    if not args.files:
        p.error("give at least one file (or --episode)")
    for spec in args.files:
        if args.envelope:
            print(f"== {spec}")
            envelope(spec)
            continue
        samples, start = load(spec)
        print(f"== {spec} ({len(samples) / RATE:.2f} s)", flush=True)
        if args.segments:
            for s in transcribe(samples, vad=True):
                print(f"{s.start + start:9.2f} {s.end + start:9.2f} {s.text.strip()}", flush=True)
        elif args.words:
            words = [w for s in transcribe(samples, words=True) for w in s.words]
            print(" ".join(f"{w.word.strip()}@{w.start + start:.2f}" for w in words))
        else:
            print(" ".join(s.text.strip() for s in transcribe(samples)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
