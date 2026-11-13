#!/usr/bin/env python3
"""The verses face to face of the series « لاحظت الفرق؟ » (content/trial/farq.yaml; docs/scripts/farq.md), written as data
for its drawings (video/src/trial/farqData.ts): for each episode, the two pieces of verse shown one facing the other, which
of their words differ (found by comparing the words without their vowels, never chosen by hand), and which word went
where. Every word comes from the registry (content/sources/quran.yaml, filled from quran.com): nothing is typed here
but the first and the last word of each piece, in their bare form, to find it.

  python3 tools/trial/farq.py          # writes video/src/trial/farqData.ts
"""
from __future__ import annotations

import difflib
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "video" / "src" / "trial" / "farqData.ts"
MARKS = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")

# For each episode: the pieces face to face (a verse, its first and last word in bare form), how to find what differs
# (`differ`: what the other verse does not have at the same place; `moved`: the same words in another order), and the
# words that went from the upper piece to the lower one (bare forms), each with its colour.
EPISODES = {
    "rizq": {
        "long": [("quran.6.151", "ولا", "واياهم"), ("quran.17.31", "ولا", "واياكم")],
        "short": [("quran.6.151", "نحن", "واياهم"), ("quran.17.31", "نحن", "واياكم")],
        "find": "differ",
        "went": [("نرزقكم", "واياكم", "gold"), ("واياهم", "نرزقهم", "mint")],
    },
    "adab": {
        "long": [("quran.18.79", "فاردت", "اعيبها"), ("quran.18.82", "فاراد", "اشدهما")],
        "short": [("quran.18.79", "فاردت", "اعيبها"), ("quran.18.82", "فاراد", "ربك")],
        "find": "lead",
        "went": [],
    },
    "qist": {
        "long": [("quran.4.135", "كونوا", "لله"), ("quran.5.8", "كونوا", "بالقسط")],
        "short": [("quran.4.135", "قومين", "لله"), ("quran.5.8", "قومين", "بالقسط")],
        "find": "moved",
        "went": [("بالقسط", "بالقسط", "gold"), ("لله", "لله", "mint")],
    },
}


def bare(word: str) -> str:
    w = MARKS.sub("", word).replace("ٱ", "ا").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    return re.sub(r"[^ء-ي]", "", w)


def registry() -> dict:
    data = yaml.safe_load((ROOT / "content" / "sources" / "quran.yaml").read_text(encoding="utf-8"))
    return {s["id"]: s for s in (data["sources"] if isinstance(data, dict) else data)}


def piece(sources: dict, sid: str, first: str, last: str) -> dict:
    src = sources[sid]
    words = [w for w in src["text_ar"].split() if bare(w)]          # a sign of pause alone is not a word
    i = next(k for k, w in enumerate(words) if bare(w) == first)
    j = next(k for k in range(i, len(words)) if bare(words[k]) == last)
    return {"id": sid, "surah": src["ref"]["surah"], "ayah": src["ref"]["ayah"], "name": src["origin"]["surah_ar"],
            "words": words[i:j + 1]}


def differ(a: list[str], b: list[str]) -> tuple[list[int], list[int]]:
    match = difflib.SequenceMatcher(a=[bare(w) for w in a], b=[bare(w) for w in b], autojunk=False)
    same_a, same_b = set(), set()
    for block in match.get_matching_blocks():
        same_a |= set(range(block.a, block.a + block.size))
        same_b |= set(range(block.b, block.b + block.size))
    return sorted(set(range(len(a))) - same_a), sorted(set(range(len(b))) - same_b)


def moved(a: list[str], b: list[str]) -> tuple[list[int], list[int]]:
    ba, bb = [bare(w) for w in a], [bare(w) for w in b]
    assert sorted(ba) == sorted(bb), (ba, bb)
    return [k for k, w in enumerate(ba) if bb.index(w) != k], [k for k, w in enumerate(bb) if ba.index(w) != k]


def lead(a: list[str], b: list[str]) -> tuple[list[int], list[int]]:
    """Two pieces that open on the same verb said differently: the verb, and in the lower piece its subject after it."""
    assert bare(a[0]).startswith("فارد") and bare(b[0]).startswith("فارا"), (a[0], b[0])
    return [0], [0, 1]


def build(sources: dict) -> dict:
    out = {}
    for ep, spec in EPISODES.items():
        find = {"differ": differ, "moved": moved, "lead": lead}[spec["find"]]
        made = {}
        for size in ("long", "short"):
            top, bottom = (piece(sources, *p) for p in spec[size])
            top["gold"], bottom["gold"] = find(top["words"], bottom["words"])
            assert top["gold"] and bottom["gold"], (ep, size)
            made[size] = [top, bottom]
        top, bottom = made["short"]
        went = []
        for a, b, colour in spec["went"]:
            i = next(k for k, w in enumerate(top["words"]) if bare(w) == a)
            j = next(k for k, w in enumerate(bottom["words"]) if bare(w) == b)
            assert i in top["gold"] and j in bottom["gold"], (ep, a, b)
            went.append({"from": i, "to": j, "colour": colour})
        made["went"] = went
        out[ep] = made
    return out


def main() -> None:
    data = build(registry())
    for ep, made in data.items():
        for size in ("long", "short"):
            top, bottom = made[size]
            print(f"{ep} {size}: {top['surah']}:{top['ayah']} {[bare(top['words'][k]) for k in top['gold']]} / "
                  f"{bottom['surah']}:{bottom['ayah']} {[bare(bottom['words'][k]) for k in bottom['gold']]}")
    OUT.write_text("// Generated by tools/trial/farq.py from content/sources/quran.yaml: do not edit, run it again.\n"
                   f"export const FARQ = {json.dumps(data, ensure_ascii=False, indent=1)} as const;\n", encoding="utf-8")
    print(OUT.relative_to(ROOT))


if __name__ == "__main__":
    sys.exit(main())
