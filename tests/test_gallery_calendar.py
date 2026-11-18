"""The calendar on the owner's page is read from docs/retention/calendar.md, never typed in tools/trial/gallery.py."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "trial"))

import gallery  # noqa: E402

SAMPLE = """# Calendrier

Proposé le 2026-11-13.

## La grille de la semaine

| Jour | Quoi |
| --- | --- |
| lundi soir | le film |
| vendredi | « آية وحكايتها » : un épisode |

**L'heure : 19 h, heure de France**, pour tout.

## Le calendrier

| Date | Quoi | Où | Fichiers | Texte |
| --- | --- | --- | --- | --- |
| ~~jeu. 12 nov., soir~~ | ~~Khidr : le film~~ | YouTube (16:9) ; Facebook (vertical) | `a.mp4` | `publication-k.md` : « Le film » ; `publication-k-9x16.md` |
| sam. 14 nov. | Khidr, short 2 | les quatre | `b.mp4` | `publication-k.md` : « Short 2 » |
| dim. 15 nov. | Khidr, short 3 | les quatre | `c.mp4` | « Short 3 » |
| lun. 30 nov. → jeu. 3 déc. | **une histoire nouvelle** | | à faire | à faire |
| ven. 1 janv. | Série, short 1 | les quatre | release | `publication-s.md` : « Short 1 » |

## Les mesures

**Quand** : à 48 heures. Le plus simple : le jour où vous publiez, la capture d'avant-hier. Pour le reste, rien.
"""

FILMS = [
    {"out": "publication-k.md", "tall": {"slug": "khidr-film-9x16"},
     "cards": [{"slug": "khidr-film", "wide": True}] + [{"slug": f"khidr-short-{n}", "wide": False} for n in (1, 2, 3)]},
    {"out": "publication-s.md", "tall": None, "cards": [{"slug": "s-short-1", "wide": False}]},
]


def test_calendar_rows_hour_grid_and_routine(tmp_path):
    path = tmp_path / "calendar.md"
    path.write_text(SAMPLE, encoding="utf-8")
    cal = gallery.calendar(path, FILMS)
    assert cal["hour"] == "19 h, heure de France"
    assert cal["routine"] == "le jour où vous publiez, la capture d'avant-hier."
    assert cal["grid"] == [("lundi soir", "le film"), ("vendredi", "« آية وحكايتها » : un épisode")]
    film, two, three, new, january = cal["rows"]
    assert film["done"] and film["iso"] == "2026-11-12" and film["what"] == "Khidr : le film"
    assert film["links"] == [("Film 16:9", "khidr-film"), ("Film vertical", "khidr-film-9x16")]
    assert not two["done"] and two["links"] == [("Voir et copier", "khidr-short-2")]
    assert two["where"] == "les quatre plateformes"
    assert three["links"] == [("Voir et copier", "khidr-short-3")]      # the texts file carried from the row before
    assert new["todo"] and new["iso"] == "2026-11-30" and new["links"] == [] and new["what"] == "une histoire nouvelle"
    assert january["iso"] == "2027-01-01" and january["links"] == [("Voir et copier", "s-short-1")]


def test_the_real_calendar_parses():
    cal = gallery.calendar(ROOT / "docs" / "retention" / "calendar.md", [])
    assert cal["hour"] and cal["routine"] and len(cal["grid"]) == 5
    dates = [row["iso"] for row in cal["rows"]]
    assert dates == sorted(dates) and len(dates) >= 10
    html = gallery.schedule(cal)
    assert 'id="calendrier"' in html and html.count('<li class="day') == len(dates)


def test_a_series_drawn_twice_links_the_published_drawing(tmp_path):
    path = tmp_path / "calendar.md"
    path.write_text(SAMPLE.replace("`publication-s.md`", "`publication-l.md`"), encoding="utf-8")
    lens = {"out": "publication-l.md", "tall": None, "published": "figure",
            "cards": [{"slug": f"lens-short-1-{c}", "wide": False} for c in ("pov", "figure")]}
    january = gallery.calendar(path, FILMS + [lens])["rows"][-1]
    assert january["links"] == [("Voir et copier", "lens-short-1-figure")]


def test_a_published_video_leaves_the_page(tmp_path):
    """A struck row takes its cards and their media off the page; the row stays, unlinked."""
    path = tmp_path / "calendar.md"
    path.write_text(SAMPLE, encoding="utf-8")
    films = [{**f, "series": f["out"] == "publication-s.md", "cards": [dict(c) for c in f["cards"]]} for f in FILMS]
    media = tmp_path / "media"
    media.mkdir()
    for name in ("khidr-film.mp4", "khidr-film.jpg", "khidr-film-9x16.mp4", "khidr-short-2.mp4"):
        (media / name).write_bytes(b"x")
    cal = gallery.calendar(path, films)
    kept = gallery.published_off(cal, films, media)
    khidr = kept[0]
    assert [c["slug"] for c in khidr["cards"]] == ["khidr-short-1", "khidr-short-2", "khidr-short-3"] and khidr["tall"] is None
    assert sorted(p.name for p in media.iterdir()) == ["khidr-short-2.mp4"]
    assert cal["rows"][0]["done"] and cal["rows"][0]["links"] == []
    assert cal["rows"][1]["links"] == [("Voir et copier", "khidr-short-2")]
    assert gallery.contents(khidr) == "3 shorts (le film 16:9 est publié)"
    # A series whose every short is published leaves the page.
    done = SAMPLE.replace("| ven. 1 janv. | Série, short 1 |", "| ~~ven. 1 janv.~~ | Série, short 1 |")
    path.write_text(done, encoding="utf-8")
    films = [{**f, "series": f["out"] == "publication-s.md", "cards": [dict(c) for c in f["cards"]]} for f in FILMS]
    assert [f["out"] for f in gallery.published_off(gallery.calendar(path, films), films, media)] == ["publication-k.md"]
