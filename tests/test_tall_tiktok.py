"""The vertical film's TikTok twin: signed with the page's name on TikTok (owner, 2026-11-16: the du'a film went to
TikTok signed with @quran_words_daily, someone else's account there)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "trial"))

import videos  # noqa: E402


def test_tall_lists_the_film_and_its_tiktok_twin():
    rows, stills = videos.listing("kahf", "D", "tall")
    assert [r["name"] for r in rows] == ["kahf-film-9x16", "kahf-film-9x16-tiktok"] and stills == []
    assert json.loads(rows[1]["props"])["platform"] == "tiktok" and "platform" not in json.loads(rows[0]["props"])


def test_tall_tiktok_lists_the_twin_alone():
    rows, _ = videos.listing("qarnayn", "D", "tall-tiktok")
    assert [r["name"] for r in rows] == ["qarnayn-film-9x16-tiktok"]
    assert all(r["composition"] == "TrialFilm916" for r in rows)
