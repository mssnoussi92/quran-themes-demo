"""The title of a video on Facebook, Instagram and TikTok gives the English first, always (the owner, 2026-11-21: « pour
les titres Facebook Instagram et TikTok je veux toujours l'anglais d'abord »); YouTube's gives the Arabic first
(publish.py, `youtube_title`). Read in every publication text: the first line of each « Facebook · Titre »,
« Instagram · Titre » and « TikTok · Titre » block."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARABIC = re.compile(r"[؀-ۿ]")
HEADING = re.compile(r"\*\*(Facebook|Instagram|TikTok) · Titre[^*]*\*\*")


def titles() -> list[tuple[str, str, str]]:
    found = []
    for path in sorted((ROOT / "docs" / "retention").glob("publication-*.md")):
        lines = path.read_text(encoding="utf-8").splitlines()
        for i, line in enumerate(lines):
            match = HEADING.fullmatch(line.strip())
            if not match:
                continue
            j = next(k for k in range(i + 1, len(lines)) if lines[k].startswith("```"))
            found.append((path.name, match.group(1), lines[j + 1]))
    return found


def test_there_are_titles_to_read():
    assert len(titles()) > 100


def test_facebook_instagram_tiktok_titles_start_in_english():
    wrong = [(name, platform, first) for name, platform, first in titles() if ARABIC.search(first.split(" ")[0])]
    assert not wrong, f"titles starting in Arabic on Facebook, Instagram or TikTok: {wrong[:5]}"
