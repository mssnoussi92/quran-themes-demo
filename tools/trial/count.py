#!/usr/bin/env python3
"""The counts of the counting style (docs/model.md, « Le style compteur »), done again from the Quranic Arabic Corpus and
written as data for the drawings of an episode: no number of a counting episode is typed, every one comes from here.

The corpus: the morphology of the Quranic Arabic Corpus (corpus.quran.com), one line per segment of a word,
`surah:ayah:word:segment<TAB>form<TAB>part of speech<TAB>features` (LEM: the lemma, ROOT: the root, MP/FP plural,
MD/FD dual, F/FS feminine), as published in quran-morphology.txt of github.com/mustafa0x/quran-morphology:

  curl -sL https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt -o <dir>/morph.txt
  python3 tools/trial/count.py --morph <dir>/morph.txt          # writes video/src/trial/countData.ts

What it counts, for the episode `days` of « سنريهم آياتنا » (docs/scripts/signs.md):
- the lemma يوم, and what a counter must leave out of it to reach the 365 that circulates: the plural and the dual
  (أيام، يومين), يومئذ, then يومكم and يومهم; the verses each step leaves lit (the grid of the 6,236 verses);
- the board: eight claims that circulate, each counted under three fixed rules (every form of the word, the singular
  only, the whole root); a claim holds under a rule when every word of it gives the number announced;
- the verses 9:128-129 on the grid (the two verses a counter of 19 said were not of the Quran);
- the points of the numbers drawn in particles, sampled from the bold face of the videos (Amiri Bold).
"""
from __future__ import annotations

import argparse
import collections
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "video" / "src" / "trial" / "countData.ts"
FONT = ROOT / "video" / "public" / "fonts" / "Amiri-Bold.ttf"
MARKS = re.compile(r"[ً-ٰٟۖ-ۭ]")
PLURAL_OR_DUAL = {"MP", "FP", "MD", "FD"}
FEMININE = {"F", "FS"}

# The claims of the board, in the order they are shown: the words said equal, the number announced, and for each word
# its lemma, its root and whether only its feminine counts (الآخرة is the feminine of the lemma آخِر).
WORDS = {
    "يوم": ("يَوْم", "يوم", False), "شهر": ("شَهْر", "شهر", False), "الدنيا": ("دُنْيا", "دنو", False),
    "الآخرة": ("آخِر", "أخر", True), "الملائكة": ("مَلَك", "ملك", False), "الشيطان": ("شَيْطان", "شطن", False),
    "رجل": ("رَجُل", "رجل", False), "امرأة": ("امْرَأَت", "مرأ", False), "الصلاة": ("صَلاة", "صلو", False),
    "الصبر": ("صَبْر", "صبر", False), "الليل": ("لَيْل", "ليل", False),
}
CLAIMS = [(("يوم",), 365), (("شهر",), 12), (("الدنيا", "الآخرة"), 115), (("الملائكة", "الشيطان"), 88),
          (("رجل", "امرأة"), 24), (("الصلاة",), 99), (("الصبر",), 103), (("الليل",), 92)]
RULES = ["كل الصيغ", "المفرد بس", "الجذر كله"]
STEPS_LABELS = ["كل الصيغ", "من غير أيام ويومين", "من غير يومئذ", "من غير يومكم ويومهم"]
PARTICLES = ["365", "475", "445", "375"]


def read(path: Path) -> dict[tuple[int, int, int], list[tuple]]:
    """The words of the Quran, each a list of segments (form, part of speech, lemma, features, root)."""
    words: dict[tuple[int, int, int], list[tuple]] = collections.defaultdict(list)
    for line in path.open(encoding="utf-8"):
        if not line.strip() or line.startswith("#"):
            continue
        loc, form, pos, feats = line.rstrip("\n").split("\t")
        s, a, w, _ = map(int, loc.split(":"))
        f = feats.split("|")
        lemma = next((x[4:] for x in f if x.startswith("LEM:")), None)
        root = next((x[5:] for x in f if x.startswith("ROOT:")), None)
        words[(s, a, w)].append((form, pos, lemma, f, root))
    return words


def step_of(word: list[tuple]) -> int:
    """For a word of the lemma يوم: the step of the count of 365 at which it is left out (1 to 3), or 4 if it is kept."""
    noun = next(x for x in word if x[2] == "يَوْم")
    whole = MARKS.sub("", "".join(x[0] for x in word))
    if PLURAL_OR_DUAL & set(noun[3]):
        return 1                                    # أيام، يومين
    if "ئذ" in whole:
        return 2                                    # يومئذ
    if whole.endswith(("كم", "هم")):
        return 3                                    # يومكم، يومهم
    return 4                                        # يوم، اليوم، يوما


def tally(words: dict, lemma: str | None = None, root: str | None = None, singular: bool = False, feminine: bool = False) -> int:
    """The words of the Quran with this lemma (or root): every form, or the singular only, or the feminine only."""
    n = 0
    for word in words.values():
        for x in word:
            if (lemma and x[2] == lemma) or (root and x[4] == root):
                if singular and PLURAL_OR_DUAL & set(x[3]):
                    continue
                if feminine and not FEMININE & set(x[3]):
                    continue
                n += 1
                break
    return n


def under_rules(words: dict, name: str) -> list[int]:
    lemma, root, feminine = WORDS[name]
    return [tally(words, lemma=lemma, feminine=feminine), tally(words, lemma=lemma, singular=True, feminine=feminine),
            tally(words, root=root)]


def board(words: dict) -> list[dict]:
    rows = []
    for names, said in CLAIMS:
        counts = [under_rules(words, n) for n in names]                       # one list of three per word
        cells = [[c[k] for c in counts] for k in range(3)]                    # one list of words per rule
        rows.append({"words": list(names), "said": said, "cells": cells, "holds": [all(v == said for v in c) for c in cells]})
    return rows


def particles(text: str, n: int, seed: int) -> dict:
    """`n` points inside the glyphs of `text` in Amiri Bold, as thousandths of the box of the text, and its aspect."""
    from PIL import Image, ImageDraw, ImageFont

    font = ImageFont.truetype(str(FONT), 400)
    image = Image.new("L", (1600, 700), 0)
    ImageDraw.Draw(image).text((60, 20), text, font=font, fill=255)
    box = image.getbbox()
    assert box, text
    crop = image.crop(box)
    w, h = crop.size
    pixels = crop.load()
    inside = [(x, y) for y in range(0, h, 2) for x in range(0, w, 2) if pixels[x, y] > 140]
    pick = random.Random(seed).sample(inside, n)
    return {"aspect": round(w / h, 4), "points": [[round(1000 * x / w), round(1000 * y / h)] for x, y in pick]}


def build(words: dict) -> dict:
    verses = sorted({(s, a) for s, a, _ in words})
    index = {v: i for i, v in enumerate(verses)}
    yawm = {k: step_of(v) for k, v in words.items() if any(x[2] == "يَوْم" for x in v)}
    steps = [sum(1 for c in yawm.values() if c >= n) for n in (1, 2, 3, 4)]
    # The verses still lit after each step: a verse goes out when none of its words of يوم is kept any more.
    lit = [sorted({index[(s, a)] for (s, a, _), c in yawm.items() if c >= n}) for n in (1, 2, 3, 4)]
    return {
        "verses": len(verses),
        "steps": steps,
        "stepLabels": STEPS_LABELS,
        "lit": lit,
        "removed": [index[(9, 128)], index[(9, 129)]],
        "rules": RULES,
        "board": board(words),
        "particles": {t: particles(t, 700, k) for k, t in enumerate(PARTICLES)},
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--morph", required=True, type=Path, help="quran-morphology.txt of the Quranic Arabic Corpus")
    p.add_argument("--out", type=Path, default=OUT)
    args = p.parse_args()
    data = build(read(args.morph))
    assert data["verses"] == 6236, data["verses"]
    assert data["steps"] == [475, 445, 375, 365], data["steps"]
    print(f"يوم: {data['steps']}, verses lit {[len(v) for v in data['lit']]}; 9:128-129 at {data['removed']}")
    for row in data["board"]:
        print(f"  {' = '.join(row['words'])} {row['said']}: {row['cells']} holds {row['holds']}")
    args.out.write_text("// Generated by tools/trial/count.py from the Quranic Arabic Corpus: do not edit, run it again.\n"
                        f"export const COUNT = {json.dumps(data, ensure_ascii=False, separators=(',', ':'))} as const;\n",
                        encoding="utf-8")
    print(args.out.relative_to(ROOT), f"{args.out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
