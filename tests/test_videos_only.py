"""videos.py (what film.yml renders): several shorts named at once (`--only qitr,marah`: the shorts whose voice is
there, 2026-11-19), and a series for a page that is not on TikTok (`platforms` of its file: the test page on Meta)
has no TikTok twins."""
import json
import sys
from pathlib import Path

import pytest
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools" / "trial"))
videos = pytest.importorskip("videos")


def series(tmp_path, monkeypatch, **extra):
    for name, part in (("a", 1), ("b", 2), ("c", 3)):
        (tmp_path / f"{name}.yaml").write_text(yaml.safe_dump({"id": name, "publish": {"part": part}}), encoding="utf-8")
    (tmp_path / "f.yaml").write_text(yaml.safe_dump({"id": "f", "shorts": ["a", "b", "c"], **extra}), encoding="utf-8")
    monkeypatch.setattr(videos, "TRIAL", tmp_path)


def test_several_shorts_joined_by_commas(tmp_path, monkeypatch):
    series(tmp_path, monkeypatch)
    rows, stills = videos.listing("f", "D", "a,c")
    assert [r["name"] for r in rows] == ["f-short-1-a", "f-short-1-a-tiktok", "f-short-3-c", "f-short-3-c-tiktok"]
    assert [s["name"] for s in stills] == ["f-short-1-a-cover.jpg", "f-short-3-c-cover.jpg"]
    assert videos.named("a,c", ["a", "b", "c"]) == ["a", "c"] and videos.named("b", ["a", "b", "c"]) == ["b"]
    assert videos.named("all", ["a", "b", "c"]) == [] and videos.named("a,z", ["a", "b", "c"]) == []


def test_a_name_that_is_not_a_short_is_refused(tmp_path, monkeypatch):
    series(tmp_path, monkeypatch)
    with pytest.raises(SystemExit, match="joined by commas"):
        videos.listing("f", "D", "a,z")


def test_a_series_not_on_tiktok_has_no_twins(tmp_path, monkeypatch):
    series(tmp_path, monkeypatch, platforms=["facebook", "instagram"])
    rows, stills = videos.listing("f", "D", "all")
    assert [r["name"] for r in rows] == ["f-short-1-a", "f-short-2-b", "f-short-3-c"]
    assert len(stills) == 3
    with pytest.raises(SystemExit, match="no TikTok twin"):
        videos.listing("f", "D", "tiktok")


def test_every_platform_by_default_and_an_unknown_one_refused(tmp_path, monkeypatch):
    series(tmp_path, monkeypatch)
    assert any(r["kind"] == "tiktok" for r in videos.listing("f", "D", "all")[0])
    series(tmp_path, monkeypatch, platforms=["facebook", "myspace"])
    with pytest.raises(SystemExit, match="unknown platform"):
        videos.listing("f", "D", "all")


# -- the dedicated thumbnails of a film (`thumbnail.options`, TrialThumbFrame, owner's choice of 2026-11-21)
OPTIONS = [
    {"name": "barrier", "at": "5:40", "lines": ["a", "b"], "tag": "t", "place": "left"},
    {"name": "chest", "at": "4:13", "lines": ["c", "d"], "tag": "t", "place": "top", "file": "mine.jpg"},
]


def a_film(tmp_path, monkeypatch, options=OPTIONS):
    for name, part in (("a", 1), ("b", 2)):
        (tmp_path / f"{name}.yaml").write_text(yaml.safe_dump({"id": name, "publish": {"part": part}}), encoding="utf-8")
    thumbnail = {"title": "T", "tag": "t", "panels": ["a", "b"], **({"options": options} if options is not None else {})}
    (tmp_path / "f.yaml").write_text(yaml.safe_dump({"id": "f", "files": "ff", "chapters": [], "thumbnail": thumbnail}), encoding="utf-8")
    monkeypatch.setattr(videos, "TRIAL", tmp_path)


def test_only_thumbnail_is_the_options_alone(tmp_path, monkeypatch):
    a_film(tmp_path, monkeypatch)
    rows, stills = videos.listing("f", "D", "thumbnail")
    assert rows == []                                     # no video job
    assert [s["name"] for s in stills] == ["ff-film-thumbnail-barrier.jpg", "mine.jpg"]
    assert {s["composition"] for s in stills} == {"TrialThumbFrame"} and {s["kind"] for s in stills} == {"thumbnail"}
    assert [json.loads(s["props"]) for s in stills] == [
        {"film": "f", "voice": "D", "option": "barrier", "data": None}, {"film": "f", "voice": "D", "option": "chest", "data": None}]
    assert all(s["frame"] == videos.STILL_FRAME for s in stills)


@pytest.mark.parametrize("only", ["film", "all"])
def test_film_and_all_render_the_options_beside_the_three_panels(tmp_path, monkeypatch, only):
    a_film(tmp_path, monkeypatch)
    rows, stills = videos.listing("f", "D", only)
    assert any(r["composition"] == "TrialFilm169" for r in rows)
    assert [s["composition"] for s in stills if s["kind"] == "thumbnail"] == ["TrialThumb169", "TrialThumbFrame", "TrialThumbFrame"]
    assert "ff-film-thumbnail.jpg" in [s["name"] for s in stills]


def test_shorts_do_not_render_the_options(tmp_path, monkeypatch):
    a_film(tmp_path, monkeypatch)
    _, stills = videos.listing("f", "D", "shorts")
    assert not [s for s in stills if s["composition"] == "TrialThumbFrame"]


def test_only_thumbnail_needs_options_and_a_film(tmp_path, monkeypatch):
    a_film(tmp_path, monkeypatch, options=None)
    with pytest.raises(SystemExit, match="no `thumbnail.options`"):
        videos.listing("f", "D", "thumbnail")
    assert [s["composition"] for s in videos.listing("f", "D", "film")[1] if s["kind"] == "thumbnail"] == ["TrialThumb169"]
    series(tmp_path, monkeypatch)
    with pytest.raises(SystemExit, match="series"):
        videos.listing("f", "D", "thumbnail")
