"""`only: thumbnail` of a film whose every option is a drawn scene (`art`) prepares nothing heavy: the workflow film.yml
asks `videos.py --light`, and the light data (`prepare.py --film` with no voice) is <film>.json alone, what
TrialThumbFrame reads for an art option. One `at` option keeps the full preparation. No network, no clips."""
import json
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools" / "trial"))
videos = pytest.importorskip("videos")
film = pytest.importorskip("film")
P = pytest.importorskip("prepare")

ART = {"name": "barrier", "art": "qarnayn-barrier", "lines": ["a", "b"], "tag": "t", "place": "left"}
AT = {"name": "moment", "at": "5:40", "lines": ["a", "b"], "tag": "t", "place": "top"}


def spec(*options):
    return {"id": "f", "title": {"ar": "عنوان", "en": "Title"}, "handle": "@h", "chapters": [], "files": "f",
            "thumbnail": {"title": "ت", "tag": "x", "panels": ["a"], "options": list(options)}}


def test_all_art_goes_light_only_for_thumbnail():
    assert videos.light_thumbnails(spec(ART, {**ART, "name": "chest"}), "thumbnail")
    assert not videos.light_thumbnails(spec(ART), "film")
    assert not videos.light_thumbnails(spec(ART), "all")


def test_one_at_option_keeps_the_full_path():
    assert not videos.light_thumbnails(spec(ART, AT), "thumbnail")
    assert not videos.light_thumbnails(spec(AT), "thumbnail")


def test_no_options_is_not_light():
    assert not videos.light_thumbnails(spec(), "thumbnail")


def test_light_data_holds_what_thumbframe_needs(tmp_path, monkeypatch):
    root = tmp_path
    (root / "content" / "trial").mkdir(parents=True)
    (root / "content" / "trial" / "f.yaml").write_text(yaml.safe_dump(spec(ART), allow_unicode=True), encoding="utf-8")
    monkeypatch.setattr(P, "ROOT", root)
    monkeypatch.setattr(P, "PUBLIC", root / "video" / "public")
    # no voice, no takes, no clip: nothing else may be needed
    film.prepare(SimpleNamespace(film="f", draft=False, voice=None, takes=None, episode=None, picture=None, no_ambience=False))
    written = sorted(p.name for p in (root / "video" / "public" / "trial").iterdir())
    assert written == ["f.json"]
    data = json.loads((root / "video" / "public" / "trial" / "f.json").read_text(encoding="utf-8"))
    assert data["title"] == {"ar": "عنوان", "en": "Title"}
    assert data["thumbnail"]["options"] == [ART]
    assert data["thumbnail"]["options"][0]["art"] == "qarnayn-barrier"


def test_the_real_qarnayn_is_all_art():
    real = yaml.safe_load((Path(__file__).resolve().parents[1] / "content" / "trial" / "qarnayn.yaml").read_text(encoding="utf-8"))
    assert videos.light_thumbnails(real, "thumbnail")
