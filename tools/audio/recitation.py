#!/usr/bin/env python3
"""Where each verse quoted in the episodes is, in the file of a reciter who recorded one file per
surah, and when each of its words is recited: content/recitations/<reciter>.json (JSON: build.py
reads it with the standard library only).

Tawfiq As-Sayegh is not on quran.com (where Alafasy's verses came one file per ayah, with the time
of each word). mp3quran.net has his recitation one file per surah, and volunteers' marks of where
each ayah starts and ends (`ayat_timing`, read 17, as in quran-reels). For each verse:

1. the marks give a first cut; each end moves to the quietest moment nearby (outwards first: a
   missing word is worse than a little silence);
2. Whisper (faster-whisper large-v3-turbo, as listen.py) transcribes the cut with the time of each
   word; its words are aligned with the Uthmani words of the verse (registry text);
3. the cut is checked: every word of the verse heard (match), the first and the last ones above all
   (quran-reels lost « Alif » and « لا » at a cut, 2026-11-05), no word of a neighbouring ayah in
   it, silence at both ends; a cut that fails is printed with what was heard and not written;
4. the time of each word (from the start of the cut) comes from Whisper where its word matches,
   else in proportion to the letters between its neighbours: the ayah card highlights the word
   being recited, the subtitles follow it.

Only times are committed (the audio is the reciter's, downloaded by tools/audio/build.py at render
time). The text Whisper hears is only compared, never shown.

Usage:
  uv run --with faster-whisper==1.1.1 --with pyyaml tools/audio/recitation.py --reciter sayegh --all
  uv run --with faster-whisper==1.1.1 --with pyyaml tools/audio/recitation.py --reciter sayegh 18:72 2:216
  ... --set 2:216=1234.50,1260.10      # a cut checked by ear or at the envelope (then words again)
"""
from __future__ import annotations

import argparse
import difflib
import glob
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from listen import RATE, transcribe  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
USER_AGENT = "quran-themes-demo/0.1 (+https://github.com/mssnoussi92/quran-themes-demo)"
RECITERS = {
    "sayegh": {
        "label": "Tawfiq As-Sayegh",
        "surah_url": "https://cdn.mp3quran.net/audio/tawfeeq-sayegh/r1/{surah:03d}.mp3",
        "timing": "https://www.mp3quran.net/api/v3/ayat_timing?surah={surah}&read=17",
    },
}
LETTER = re.compile("[ء-يٱ-ۓ]")
MARKS = re.compile("[ً-ٰٟـۖ-ۭ]")
PAD = 1.0             # silence put before a cut for Whisper (a word at 0 s is often missed)
MIN_MATCH = 0.85      # share of the verse's words Whisper must hear
QUIET_ABOVE_FLOOR = 8 # an end of the cut must be this close to the recording's floor (dB): a mosque
                      # recording has no true silence (As-Sayegh: pauses at -27 to -31 dB, floor -32)
# What Whisper invents in the silence after the last word (never a word of a verse).
HALLUCINATIONS = {"ترجمة", "نانسي", "قنقر", "اشتركوا", "القناة", "للمشاهدة", "شكرا"}


def cache(reciter: str) -> Path:
    path = ROOT / "build" / "recitations" / reciter
    path.mkdir(parents=True, exist_ok=True)
    return path


def fetch(url: str, dest: Path) -> Path:
    if not dest.is_file():
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=300) as r:
            dest.write_bytes(r.read())
    return dest


def marks(reciter: str, surah: int) -> dict[int, tuple[float, float]]:
    rows = json.loads(fetch(RECITERS[reciter]["timing"].format(surah=surah),
                            cache(reciter) / f"timing-{surah:03d}.json").read_text())
    return {int(r["ayah"]): (r["start_time"] / 1000, r["end_time"] / 1000) for r in rows if int(r["ayah"]) > 0}


def samples(path: Path):
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(RATE), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def levels(x):
    """Loudness of each 20 ms window, in dB."""
    import numpy as np
    win = RATE // 50
    n = len(x) // win
    return 20 * np.log10(np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)


def quietest(db, lo: float, hi: float, prefer: float) -> float:
    """Middle of the quietest 60 ms between lo and hi seconds (ties: nearest to prefer)."""
    import numpy as np
    a, b = max(int(lo * 50), 1), min(int(hi * 50), len(db) - 2)
    smooth = np.convolve(db, np.ones(3) / 3, mode="same")
    best = min(range(a, b + 1), key=lambda i: (round(float(smooth[i]), 0), abs(i / 50 - prefer)))
    return round(float(best / 50 + 0.01), 2)


def plain(word: str) -> str:
    word = MARKS.sub("", word)
    word = re.sub("[أإآٱ]", "ا", word).replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    return re.sub(r"[^\w]", "", word)


def verse_words(text: str) -> list[str]:
    """The words of the verse that the ayah card counts (waqf signs and ۞ are not words)."""
    return [t for t in text.split() if LETTER.search(t)]


def align(want: list[str], heard: list[str]) -> list[int | None]:
    """For each word of the verse, the heard word it matches (global alignment by similarity)."""
    a, b = [plain(w) for w in want], [plain(w) for w in heard]
    sim = [[difflib.SequenceMatcher(None, x, y).ratio() for y in b] for x in a]
    n, m = len(a), len(b)
    score = [[0.0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = sim[i - 1][j - 1]
            score[i][j] = max(score[i - 1][j], score[i][j - 1], score[i - 1][j - 1] + (s if s >= 0.5 else -0.5))
    out: list[int | None] = [None] * n
    i, j = n, m
    while i > 0 and j > 0:
        s = sim[i - 1][j - 1]
        if score[i][j] == score[i - 1][j - 1] + (s if s >= 0.5 else -0.5) and s >= 0.5:
            out[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif score[i][j] == score[i - 1][j]:
            i -= 1
        else:
            j -= 1
    return out


def word_times(want: list[str], heard: list[dict], match: list[int | None], length: float) -> list[list]:
    """[position, start, end] of every word of the verse, from the start of the cut."""
    starts: list[float | None] = [heard[k]["start"] if k is not None else None for k in match]
    known = [i for i, s in enumerate(starts) if s is not None]
    if not known:
        starts = [None] * len(want)
        known = []
    letters = [max(len(plain(w)), 1) for w in want]
    anchors = [(-1, 0.0)] + [(i, starts[i]) for i in known] + [(len(want), length)]
    for (i0, t0), (i1, t1) in zip(anchors, anchors[1:]):
        gap = list(range(i0 + 1, i1))
        if not gap:
            continue
        end0 = heard[match[i0]]["end"] if 0 <= i0 < len(want) and match[i0] is not None else t0
        total = sum(letters[g] for g in gap)
        done = 0
        for g in gap:
            starts[g] = end0 + (t1 - end0) * done / total
            done += letters[g]
    out = []
    for i, s in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else length
        out.append([i + 1, round(float(max(s, 0.0)), 2), round(float(max(end, s)), 2)])
    return out


def cut(reciter: str, key: str, text: str, audio, db, timing, fixed: tuple[float, float] | None) -> dict | None:
    import numpy as np
    surah, ayah = map(int, key.split(":"))
    if fixed:
        start, end = fixed
    else:
        a, b = timing[ayah]
        start = quietest(db, a - 0.8, a + 0.8, a)
        end = quietest(db, b - 0.8, b + 0.8, b)
    clip = audio[int(start * RATE): int(end * RATE)]
    padded = np.concatenate([np.zeros(int(PAD * RATE), dtype=np.float32), clip, np.zeros(int(0.3 * RATE), dtype=np.float32)])
    heard = [{"word": w.word.strip(), "start": float(w.start) - PAD, "end": float(w.end) - PAD}
             for seg in transcribe(padded, words=True) for w in (seg.words or [])
             if w.word.strip() and plain(w.word) not in {plain(h) for h in HALLUCINATIONS} and w.start - PAD < (end - start) - 0.05]
    # The vocative is written attached in the Uthmani text (يَـٰٓأَيُّهَا, يَـٰعِبَادِىَ, هَـٰٓأَنتُمْ): one word.
    for i in range(len(heard) - 2, -1, -1):
        if plain(heard[i]["word"]) in ("يا", "ها"):
            heard[i:i + 2] = [{"word": heard[i]["word"] + heard[i + 1]["word"], "start": heard[i]["start"],
                               "end": heard[i + 1]["end"]}]
    want = verse_words(text)
    match = align(want, [h["word"] for h in heard])
    share = sum(m is not None for m in match) / len(want)
    used = [m for m in match if m is not None]
    extra_before = used[0] if used else len(heard)
    extra_after = len(heard) - 1 - used[-1] if used else 0
    edge = lambda t: float(db[min(max(int(t * 50), 0), len(db) - 1)])
    quiet = float(np.percentile(db, 2)) + QUIET_ABOVE_FLOOR
    problems = []
    if share < MIN_MATCH:
        problems.append(f"heard {share:.0%} of the words")
    if match[0] is None:
        problems.append(f"first word « {want[0]} » not heard")
    if match[-1] is None:
        problems.append(f"last word « {want[-1]} » not heard")
    if extra_before or extra_after:
        problems.append(f"{extra_before} word(s) heard before, {extra_after} after")
    for name, t in (("start", start), ("end", end)):
        if edge(t) > quiet:
            problems.append(f"{name} {t:.2f} s at {edge(t):.0f} dB")
    print(f"{key:7s} {start:9.2f}-{end:9.2f} ({end - start:5.2f} s) words {share:4.0%}  "
          f"{'OK' if not problems else '!! ' + '; '.join(problems)}")
    if problems:
        print(f"        heard: {' '.join(h['word'] for h in heard)}")
        print(f"        verse: {' '.join(want)}")
        if not fixed:
            return None             # a cut set by hand was checked by ear or at the envelope: kept
    start, end = float(start), float(end)
    return {"start": start, "end": end, "seconds": round(end - start, 2),
            "words": word_times(want, heard, match, round(end - start, 2)),
            "heard": " ".join(h["word"] for h in heard), "match": round(share, 2),
            **({"note": "; ".join(problems)} if problems else {}),
            "method": "set by hand (envelope), words by Whisper" if fixed else
                      "mp3quran.net marks snapped to the quietest moment; words by Whisper (large-v3-turbo)"}


def quoted_verses() -> list[str]:
    keys = set()
    for f in glob.glob(str(ROOT / "content" / "episodes" / "*.yaml")):
        for s in yaml.safe_load(open(f, encoding="utf-8"))["scenes"]:
            if s.get("audio") == "recitation":
                keys.add(s["source"].removeprefix("quran.").replace(".", ":"))
    return sorted(keys, key=lambda k: tuple(map(int, k.split(":"))))


def registry() -> dict[str, str]:
    data = yaml.safe_load(open(ROOT / "content" / "sources" / "quran.yaml", encoding="utf-8"))
    return {e["id"].removeprefix("quran.").replace(".", ":"): e.get("text_ar", "") for e in data}


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0], formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--reciter", required=True, choices=sorted(RECITERS))
    p.add_argument("--all", action="store_true", help="every verse recited in content/episodes/ that has no cut yet")
    p.add_argument("--force", action="store_true", help="cut again the verses that have one")
    p.add_argument("--set", nargs="+", default=[], metavar="KEY=START,END", help="a cut checked by hand")
    p.add_argument("verses", nargs="*", metavar="SURAH:AYAH")
    args = p.parse_args()
    out_path = ROOT / "content" / "recitations" / f"{args.reciter}.json"
    out_path.parent.mkdir(exist_ok=True)
    data = json.loads(out_path.read_text(encoding="utf-8")) if out_path.is_file() else {}
    verses = data.get("verses") or {}
    fixed = {k: tuple(map(float, v.split(","))) for k, v in (s.split("=") for s in args.set)}
    keys = list(dict.fromkeys(args.verses + list(fixed) + (quoted_verses() if args.all else [])))
    if not args.force:
        keys = [k for k in keys if k not in verses or k in fixed or k in args.verses]
    texts = registry()
    by_surah: dict[int, list[str]] = {}
    for k in keys:
        if not texts.get(k):
            sys.exit(f"error: {k} is not in content/sources/quran.yaml with its text")
        by_surah.setdefault(int(k.split(":")[0]), []).append(k)
    failed = 0
    for surah, ks in sorted(by_surah.items()):
        conf = RECITERS[args.reciter]
        mp3 = fetch(conf["surah_url"].format(surah=surah), cache(args.reciter) / f"{surah:03d}.mp3")
        audio = samples(mp3)
        db = levels(audio)
        timing = marks(args.reciter, surah)
        for k in ks:
            entry = cut(args.reciter, k, texts[k], audio, db, timing, fixed.get(k))
            if entry is None:
                failed += 1
                continue
            verses[k] = {"file": conf["surah_url"].format(surah=surah).rsplit("/", 1)[1], **entry}
    order = sorted(verses, key=lambda k: tuple(map(int, k.split(":"))))
    out = {"about": f"{RECITERS[args.reciter]['label']}: where each verse quoted in the episodes is in its surah's "
                    "file (seconds), and when each word is recited ([position, start, end], from the start of the "
                    "cut). Written by tools/audio/recitation.py; the audio is downloaded by tools/audio/build.py, "
                    "never committed. `heard` is only compared, never shown.",
           "reciter": args.reciter, "label": RECITERS[args.reciter]["label"],
           "surah_url": RECITERS[args.reciter]["surah_url"], "verses": {k: verses[k] for k in order}}
    text = json.dumps(out, ensure_ascii=False, indent=2)
    text = re.sub(r"\[\s+(-?[\d.]+),\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]", r"[\1, \2, \3]", text)
    out_path.write_text(text + "\n", encoding="utf-8")
    print(f"{out_path.relative_to(ROOT)}: {len(order)} verse(s); {failed} cut(s) to check by hand")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
