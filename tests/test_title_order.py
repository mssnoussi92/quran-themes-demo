"""The Arabic first everywhere, titles and descriptions, on every platform (the owner, 2026-11-21: « je veux l'arabe
d'abord partout titres et description », correcting a session that had put the English first on Facebook, Instagram
and TikTok). Read in every publication text: the first line of each « Facebook · Titre », « Instagram · Titre » and
« TikTok · Titre » block, and the first paragraph of each « … · Description » block. YouTube titles are the YouTube
title of publish.py (`youtube_title`), checked by its own tests; those of videos already online stay as published."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARABIC = re.compile(r"[\u0600-\u06ff]")
HEADING = re.compile(r"\*\*(Facebook|Instagram|TikTok|YouTube) · (Titre|Description)[^*]*\*\*")


def blocks(kind: str) -> list[tuple[str, str, list[str]]]:
    found = []
    for path in sorted((ROOT / "docs" / "retention").glob("publication-*.md")):
        lines = path.read_text(encoding="utf-8").splitlines()
        for i, line in enumerate(lines):
            match = HEADING.fullmatch(line.strip())
            if not match or match.group(2) != kind:
                continue
            j = next(k for k in range(i + 1, len(lines)) if lines[k].startswith("```"))
            end = next(k for k in range(j + 1, len(lines)) if lines[k].startswith("```"))
            found.append((path.name, match.group(1), lines[j + 1:end]))
    return found


def test_there_are_titles_and_descriptions_to_read():
    assert len(blocks("Titre")) > 100 and len(blocks("Description")) > 100


def test_facebook_instagram_tiktok_titles_start_in_arabic():
    wrong = [(name, platform, body[0]) for name, platform, body in blocks("Titre")
             if platform != "YouTube" and not ARABIC.search(body[0].split(" ")[0])]
    assert not wrong, f"titles starting in English on Facebook, Instagram or TikTok: {wrong[:5]}"


def test_every_description_starts_in_arabic():
    wrong = [(name, platform, body[0][:60]) for name, platform, body in blocks("Description")
             if body and not ARABIC.search(body[0].split(" ")[0])]
    assert not wrong, f"descriptions starting in English: {wrong[:5]}"
