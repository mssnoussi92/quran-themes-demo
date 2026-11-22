"""A Facebook short caption holds in 400 characters, hashtags included (the owner, 2026-11-22, the Sunday review: Meta's
quality list asks for a caption of 10 to 400 characters, and marked the trailer's, 408, « légendes de qualité »). Read in
every publication text: the « Facebook · Titre », « … · Description » and « … · Hashtags » cards of a section, joined by a
blank line as quran-reels publishes them. Captions with credits (the long form of the first film's texts) are not short
captions; videos already online before the rule keep their text as published."""
from __future__ import annotations

import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
CARD = re.compile(r"\*\*Facebook · (Titre|Description|Hashtags|Crédits)[^*]*\*\*")
PUBLISHED_BEFORE = {("trailer-9x16", "Le film")}     # 408 characters, published on 2026-11-22 at 14:00


def most() -> int:
    conf = yaml.safe_load((ROOT / "content" / "publish.yaml").read_text(encoding="utf-8"))
    return conf["platforms"]["facebook"]["max_caption"]


def captions() -> list[tuple[str, str, int]]:
    found = []
    for path in sorted((ROOT / "docs" / "retention").glob("publication-*.md")):
        doc = path.stem.removeprefix("publication-")
        lines = path.read_text(encoding="utf-8").splitlines()
        section, cards = "", {}

        def keep() -> None:
            if section and cards and "Crédits" not in cards:
                text = "\n\n".join(cards[k] for k in ("Titre", "Description", "Hashtags") if k in cards)
                found.append((doc, section, len(text)))

        for i, line in enumerate(lines):
            if line.startswith("## "):
                keep()
                section, cards = line[3:].split(" · ")[0], {}
            match = CARD.fullmatch(line.strip())
            if match:
                start = next(k for k in range(i + 1, len(lines)) if lines[k].startswith("```"))
                end = next(k for k in range(start + 1, len(lines)) if lines[k].startswith("```"))
                cards[match.group(1)] = "\n".join(lines[start + 1:end])
        keep()
    return found


def test_there_are_facebook_captions_to_read():
    assert len(captions()) > 50


def test_every_facebook_short_caption_holds_in_400_characters():
    limit = most()
    over = [(doc, section, size) for doc, section, size in captions()
            if size > limit and (doc, section) not in PUBLISHED_BEFORE]
    assert not over, f"Facebook captions over {limit} characters: {over}"


def test_the_facebook_line_of_the_ai_voice_still_declares_it():
    conf = yaml.safe_load((ROOT / "content" / "publish.yaml").read_text(encoding="utf-8"))
    line = conf["lines"]["ai_voice_facebook"]
    assert "AI" in line and "الذكاء الاصطناعي" in line
