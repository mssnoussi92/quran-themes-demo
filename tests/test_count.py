"""tools/trial/count.py: the counts of the counting style are made, never typed (docs/model.md, « Le style compteur »)."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "trial"))

import count  # noqa: E402

# A few words in the corpus' own format: يوم in each form a counter of 365 leaves out, and words of other lemmas.
SAMPLE = """\
1:1:1:1\tيَوْمِ\tN\tROOT:يوم|LEM:يَوْم|M|GEN
1:2:1:1\tأَيَّامًا\tN\tROOT:يوم|LEM:يَوْم|MP|INDEF|ACC
1:3:1:1\tيَوْمَيْنِ\tN\tROOT:يوم|LEM:يَوْم|MD|GEN
1:4:1:1\tيَوْمَ\tN\tROOT:يوم|LEM:يَوْم|M|ACC
1:4:1:2\tئِذٍ\tT\tLEM:إِذ
1:5:1:1\tيَوْمَ\tN\tROOT:يوم|LEM:يَوْم|M|ACC
1:5:1:2\tكُمُ\tPRON\tPRON:2MP
1:6:1:1\tشَهْرٌ\tN\tROOT:شهر|LEM:شَهْر|M|NOM
1:6:2:1\tأَشْهُرٍ\tN\tROOT:شهر|LEM:شَهْر|MP|GEN
1:7:1:1\tٱلْءَاخِرَةُ\tN\tROOT:أخر|LEM:آخِر|FS|NOM
1:7:2:1\tءَاخِرُ\tN\tROOT:أخر|LEM:آخِر|MS|NOM
"""


def words(tmp_path):
    path = tmp_path / "morph.txt"
    path.write_text(SAMPLE, encoding="utf-8")
    return count.read(path)


def test_each_form_a_counter_of_365_leaves_out(tmp_path):
    w = words(tmp_path)
    steps = {k[1]: count.step_of(v) for k, v in w.items() if any(x[2] == "يَوْم" for x in v)}
    assert steps == {1: 4, 2: 1, 3: 1, 4: 2, 5: 3}       # kept, plural, dual, يومئذ, يومكم


def test_the_three_rules(tmp_path):
    w = words(tmp_path)
    assert count.tally(w, lemma="شَهْر") == 2
    assert count.tally(w, lemma="شَهْر", singular=True) == 1
    assert count.tally(w, root="أخر") == 2
    assert count.tally(w, lemma="آخِر", feminine=True) == 1  # الآخرة, not آخر


def test_the_drawn_numbers_are_the_counted_ones():
    """The data the drawings read was made by the tool, and says what the board says: يوم holds under no rule."""
    text = (ROOT / "video" / "src" / "trial" / "countData.ts").read_text(encoding="utf-8")
    data = json.loads(re.search(r"export const COUNT = (\{.*\}) as const;", text, re.S).group(1))
    assert data["verses"] == 6236 and data["steps"] == [475, 445, 375, 365]
    assert [len(v) for v in data["lit"]] == sorted((len(v) for v in data["lit"]), reverse=True)
    rows = {" = ".join(r["words"]): r for r in data["board"]}
    assert rows["يوم"]["holds"] == [False, False, False]
    for row in data["board"]:
        assert row["holds"] == [all(v == row["said"] for v in cells) for cells in row["cells"]]
    assert set(data["particles"]) == {"365", "475", "445", "375"}
    assert all(len(p["points"]) == 700 for p in data["particles"].values())
