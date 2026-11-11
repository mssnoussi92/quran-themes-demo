#!/usr/bin/env python3
"""Where each phrase of a known text starts in ONE take that says many lines (docs/retention.md).

Why: the free tier of Gemini TTS gives 10 requests a day, so a whole short or a whole chapter of a film
is said in one request, and that one take has to be cut back into its lines. Counting its longest pauses
works for five lines and breaks at thirty (a voice that does not pause at one « … » shifts all the
rest). Here Whisper hears the take (every word with its time), the text and what was heard are aligned
letter by letter (difflib), so a word heard differently, or two words heard as one, does not shift the
others; each phrase then starts at the end of the pause before its first word.

It also says what is worth a retake: a phrase whose letters were mostly not heard. Every such line goes
into ONE correction request, never one request each.

  uv run --with faster-whisper==1.1.1 --with numpy tools/audio/align.py TAKE TEXT.txt
    TEXT.txt: the lines said, one per line (a first line « # style: … » is skipped), as given to the voice
"""
from __future__ import annotations

import argparse
import difflib
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

PHRASE_CUT = re.compile(r"(?<=[،,….!?؟:])\s+")   # a phrase ends after « ، … . ! ؟ : », as on the cards
HEARD_ENOUGH = 0.6                                # under this share of its letters, a phrase is listed


@dataclass
class Phrase:
    text: str
    start: float                 # where it starts in the take (end of the pause before it)
    pause: tuple[float, float] | None   # the pause before it (None: said without a pause, or the first)
    heard: float                 # share of its letters Whisper heard
    said: str                    # what Whisper heard there


def silences(path: Path, floor: str = "-38dB", least: float = 0.12) -> list[tuple[float, float]]:
    log = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", f"silencedetect=noise={floor}:d={least}",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    return [(max(0.0, a), b) for a, b in zip(starts, ends)]


def words_of(path: Path) -> list[tuple[str, float, float]]:
    """Every word Whisper hears in the take, with its start and end."""
    import listen
    samples, _ = listen.load(str(path))
    return [(w.word.strip(), float(w.start), float(w.end)) for seg in listen.transcribe(samples, words=True) for w in seg.words]


def phrases_of(lines: list[str]) -> list[str]:
    return [ph for line in lines for ph in PHRASE_CUT.split(line.strip()) if ph]


def align(phrases: list[str], words: list[tuple[str, float, float]], quiet: list[tuple[float, float]]) -> list[Phrase]:
    import listen
    letters = lambda text: "".join(listen.plain(text))
    wanted, begins = "", []
    for ph in phrases:
        begins.append(len(wanted))
        wanted += letters(ph)
    heard, owner = "", []                       # the letters heard, and the word each belongs to
    for i, (word, _, _) in enumerate(words):
        got = letters(word)
        heard += got
        owner += [i] * len(got)
    to_heard: dict[int, int] = {}
    for a, b, n in difflib.SequenceMatcher(None, wanted, heard, autojunk=False).get_matching_blocks():
        for k in range(n):
            to_heard[a + k] = b + k

    out: list[Phrase] = []
    last_word = -1                              # last word heard of the phrase before
    for k, ph in enumerate(phrases):
        begin, end = begins[k], begins[k + 1] if k + 1 < len(phrases) else len(wanted)
        matched = [i for i in range(begin, end) if i in to_heard]
        if not matched:                         # nothing of it was heard: it starts where the last one stopped
            first = min(last_word + 1, len(words) - 1)
            out.append(Phrase(ph, words[first][1] if words else 0.0, None, 0.0, ""))
            continue
        first, final = owner[to_heard[matched[0]]], owner[to_heard[matched[-1]]]
        # Its first letters heard as something else: the words between the phrase before and this match are its start.
        if matched[0] > begin and first > last_word + 1:
            first = last_word + 1
        first = max(first, min(last_word + 1, len(words) - 1)) if first <= last_word else first
        t = words[first][1]
        before = words[first - 1][2] if first > 0 else 0.0
        # The pause between the word before and this one: the longest silence that overlaps that gap, and
        # that starts after the word before did (a phrase said straight after a one-word question, « السر؟ »,
        # must not take the pause that came before the question).
        said_before = words[first - 1][1] + 0.05 if first > 0 else 0.0
        around = [(a, b) for a, b in quiet if b > before - 0.25 and a < t + 0.3 and a >= said_before and (k > 0 or a <= 0.05)]
        if k == 0:
            around = [(a, b) for a, b in quiet if a <= 0.05]
        pause = max(around, key=lambda g: g[1] - g[0]) if around else None
        start = pause[1] if pause else max(0.0, t - 0.05)
        if k == 0 and pause is None:
            start = 0.0
        out.append(Phrase(ph, round(start, 3), pause if k > 0 else None, round(len(matched) / max(1, end - begin), 2),
                          " ".join(w for w, _, _ in words[first:final + 1])))
        last_word = max(last_word, final)
    for k in range(1, len(out)):                # never backwards
        if out[k].start < out[k - 1].start:
            out[k].start, out[k].pause = out[k - 1].start, None
    return out


def phrases_in_take(take: Path, lines: list[str]) -> list[Phrase]:
    return align(phrases_of(lines), words_of(take), silences(take))


def report(found: list[Phrase]) -> int:
    weak = 0
    for p in found:
        mark = "  " if p.heard >= HEARD_ENOUGH else "!!"
        weak += p.heard < HEARD_ENOUGH
        pause = f"pause {p.pause[1] - p.pause[0]:.2f}" if p.pause else "no pause "
        print(f"{mark} {p.start:7.2f}  {pause}  {p.heard:4.0%}  {p.text}" + (f"   [heard: {p.said}]" if p.heard < 1 else ""))
    return weak


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("take", type=Path)
    p.add_argument("text", type=Path)
    args = p.parse_args()
    lines = [l.strip() for l in args.text.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    weak = report(phrases_in_take(args.take, lines))
    if weak:
        print(f"{weak} phrase(s) mostly not heard (!!): listen, and put every line to redo in ONE correction request")
    return 1 if weak else 0


if __name__ == "__main__":
    sys.exit(main())
