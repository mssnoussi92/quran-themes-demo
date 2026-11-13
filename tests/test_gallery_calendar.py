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
