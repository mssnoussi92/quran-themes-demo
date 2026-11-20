"""The short version of a short, for Facebook and Instagram (`cut.drop` of its file, `prepare.py --cut`): the kept
lines are grouped into contiguous runs, each cut from the same take at the right phrase; a drop that names nothing is
refused; videos.py lists the `-cut` video only for a short that has `cut`."""
import sys
from pathlib import Path

import pytest
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools" / "trial"))
prepare = pytest.importorskip("prepare")
videos = pytest.importorskip("videos")

# Four lines of 2, 1, 3 and 2 phrases.
LINES = [{"ar": "أ… ب."}, {"ar": "ج."}, {"ar": "د… هـ… و."}, {"ar": "ز… ح."}]


def test_kept_lines_group_into_runs_with_their_first_phrase():
    runs = prepare.kept_runs(LINES, {1})
    assert [(len(r), before) for r, before in runs] == [(1, 0), (2, 3)]
    assert runs[1][0] == LINES[2:]
    runs = prepare.kept_runs(LINES, {0, 2})
    assert [(r, before) for r, before in runs] == [([LINES[1]], 2), ([LINES[3]], 6)]


def test_no_drop_is_one_run_and_all_dropped_is_none():
    assert prepare.kept_runs(LINES, set()) == [(LINES, 0)]
    assert prepare.kept_runs(LINES, {0, 1, 2, 3}) == []


SPEC = {"id": "t", "segments": [
    {"narration": "open", "scene": "a", "lines": LINES},
    {"verse": "quran.1.1", "scene": "a"},
    {"verses": ["quran.2.1", "quran.2.2"], "scene": "b"},
    {"narration": "close", "scene": "b", "lines": LINES[:2]}]}


def spec_with(*drop):
    return {**SPEC, "cut": {"drop": list(drop)}}


def test_drop_grammar():
    assert prepare.parse_drop(spec_with("close", "open:3", "quran.1.1", "quran.2.2")) == (
        {"close"}, {("open", 3)}, {"quran.1.1", "quran.2.2"})


@pytest.mark.parametrize("item", ["nothing", "open:4", "open:x", "quran.9.9", "close:2"])
def test_a_drop_that_matches_nothing_is_refused(item):
    with pytest.raises(SystemExit, match="matches no"):
        prepare.parse_drop(spec_with("open", item))


def test_cut_without_a_cut_field_is_refused():
    with pytest.raises(SystemExit, match="--cut needs"):
        prepare.parse_drop(SPEC)


def test_videos_lists_the_short_version_only_for_a_short_with_cut(tmp_path, monkeypatch):
    def short(name, part, cut):
        spec = {"id": name, "publish": {"part": part}}
        if cut:
            spec["cut"] = {"drop": ["x"]}
        (tmp_path / f"{name}.yaml").write_text(yaml.safe_dump(spec), encoding="utf-8")
    short("a", 1, True)
    short("b", 2, False)
    (tmp_path / "f.yaml").write_text(yaml.safe_dump({"id": "f", "shorts": ["a", "b"]}), encoding="utf-8")
    monkeypatch.setattr(videos, "TRIAL", tmp_path)
    rows, _ = videos.listing("f", "D", "all")
    assert [r["name"] for r in rows] == ["f-short-1-a", "f-short-1-a-tiktok", "f-short-1-a-cut", "f-short-2-b", "f-short-2-b-tiktok"]
    cut = rows[2]
    assert cut["kind"] == "cut" and cut["timeline"] == "video/public/trial/a-D-cut.json"
    assert '"version":"cut"' in cut["props"] and "platform" not in cut["props"]
    assert "f-short-1-a-cut" not in [r["name"] for r in videos.listing("f", "D", "tiktok")[0]]
    assert "f-short-1-a-cut" in [r["name"] for r in videos.listing("f", "D", "a")[0]]
    assert "f-short-1-a-cut" in [r["name"] for r in videos.listing("f", "D", "shorts")[0]]


def test_open_with_puts_the_named_segments_first():
    spec = {**SPEC, "cut": {"drop": ["quran.1.1"], "open_with": ["close"]}}
    assert [s.get("narration") or s.get("verse") or s["verses"][0] for s in prepare.opened_with(spec, set())] == [
        "close", "open", "quran.1.1", "quran.2.1"]
    assert prepare.opened_with(SPEC, set()) == SPEC["segments"]


@pytest.mark.parametrize("name, dropped", [("nothing", set()), ("quran.1.1", set()), ("close", {"close"})])
def test_open_with_a_segment_not_kept_is_refused(name, dropped):
    with pytest.raises(SystemExit, match="open_with"):
        prepare.opened_with({**SPEC, "cut": {"drop": ["x"], "open_with": [name]}}, dropped)


def test_videos_only_cut_lists_the_short_versions_alone(tmp_path, monkeypatch):
    for name, part, cut in (("a", 1, True), ("b", 2, False)):
        spec = {"id": name, "publish": {"part": part}, **({"cut": {"drop": ["x"]}} if cut else {})}
        (tmp_path / f"{name}.yaml").write_text(yaml.safe_dump(spec), encoding="utf-8")
    (tmp_path / "f.yaml").write_text(yaml.safe_dump({"id": "f", "shorts": ["a", "b"]}), encoding="utf-8")
    monkeypatch.setattr(videos, "TRIAL", tmp_path)
    rows, stills = videos.listing("f", "D", "cut")
    assert [r["name"] for r in rows] == ["f-short-1-a-cut"] and stills == []


def test_a_page_of_elsewhere_lists_its_shorts_signed_with_its_name_and_their_covers(tmp_path, monkeypatch):
    """2026-11-18 (owner's choice): the test page on Meta gets quizzes 4 to 6, signed with its name; never in `all`."""
    for name, part in (("a", 1), ("b", 2), ("c", 3)):
        (tmp_path / f"{name}.yaml").write_text(yaml.safe_dump({"id": name, "publish": {"part": part}}), encoding="utf-8")
    (tmp_path / "f.yaml").write_text(yaml.safe_dump({"id": "f", "shorts": ["a", "b", "c"],
                                                     "elsewhere": {"page": ["b", "c"]}}), encoding="utf-8")
    monkeypatch.setattr(videos, "TRIAL", tmp_path)
    rows, stills = videos.listing("f", "D", "page")
    assert [r["name"] for r in rows] == ["f-short-2-b-page", "f-short-3-c-page"]
    assert all('"platform":"page"' in r["props"] and r["composition"] == "Trial916" for r in rows)
    assert [s["name"] for s in stills] == ["f-short-2-b-page-cover.jpg", "f-short-3-c-page-cover.jpg"]
    assert all('"platform":"page"' in s["props"] for s in stills)
    assert not any(r["name"].endswith("-page") for r in videos.listing("f", "D", "all")[0])
    (tmp_path / "f.yaml").write_text(yaml.safe_dump({"id": "f", "shorts": ["a"], "elsewhere": {"page": ["z"]}}),
                                     encoding="utf-8")
    with pytest.raises(SystemExit, match="not among the shorts"):
        videos.listing("f", "D", "page")


def test_a_top_level_drop_leaves_lines_out_of_every_version():
    """`drop` of a short (the owner, 2026-11-20): the lines stay in the take and the voice text, no version plays them;
    the short version adds what `cut.drop` names to it."""
    spec = {**SPEC, "drop": ["open:1", "quran.1.1"]}
    assert prepare.left_out(spec) == (set(), {("open", 1)}, {"quran.1.1"})
    assert prepare.left_out(SPEC) == (set(), set(), set())
    both = {**spec, "cut": {"drop": ["close"]}}
    assert prepare.parse_drop(both) == ({"close"}, {("open", 1)}, {"quran.1.1"})


def test_a_top_level_drop_that_matches_nothing_is_refused():
    with pytest.raises(SystemExit, match="drop « open:9 » matches no"):
        prepare.left_out({**SPEC, "drop": ["open:9"]})


def test_the_script_strikes_the_dropped_lines():
    script = pytest.importorskip("script")
    out = "\n".join(script.narration([{"ar": "أ.", "en": "a"}, {"ar": "ب.", "en": "b"}], {1}))
    assert "~~ب.~~" in out and "**coupée**" in out and "~~أ.~~" not in out
    assert script.left_out({**SPEC, "drop": ["close", "open:2"]}) == ({"close"}, {("open", 2)})
