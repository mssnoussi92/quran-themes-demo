"""The line of the AI voice in the short captions (tools/trial/publish.py): declared when the synthetic voice says
something, never on a short no voice says (adhkar to read, 2026-11-18: the line was written under three videos
with no voice at all)."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools" / "trial"))
publish = pytest.importorskip("publish")

CONF = {"lines": {"ai_voice": "🎙️ AI-generated voice · صوت مولَّد بالذكاء الاصطناعي"}}
HOOK = {"ar": "احفظها.", "en": "Save it."}


def test_a_short_said_by_the_voice_declares_it():
    spec = {"segments": [{"narration": "open", "lines": ["…"]}, {"card": "hadith.muslim.591"}]}
    assert publish.voiced(spec)
    assert publish.hooked(CONF, HOOK, publish.voiced(spec)).endswith(CONF["lines"]["ai_voice"])


def test_a_short_with_only_silent_lines_declares_no_voice():
    spec = {"segments": [{"narration": "open", "silent": True, "lines": ["…"]}, {"card": "hadith.muslim.591"},
                         {"narration": "close", "silent": True, "lines": ["…"]}]}
    assert not publish.voiced(spec)
    assert "AI-generated" not in publish.hooked(CONF, HOOK, publish.voiced(spec))


def test_a_film_is_voiced_by_its_chapters():
    assert publish.voiced({"chapters": [{"segments": [{"narration": "hook", "lines": ["…"]}]}]})


def test_a_part_read_by_its_own_reader_is_credited_to_that_reader():
    """The dhikr of Muslim 2709a is read by Muhammad Jibril, the rest of the hadith by the collection's reader
    (2026-11-19: the credits named the reader of the whole)."""
    ids = publish.quotes_of([{"reading": "hadith.muslim.2709a", "part": "dhikr"}, {"reading": "hadith.muslim.595a"}])
    assert ids == [("reading", "hadith.muslim.2709a#dhikr"), ("reading", "hadith.muslim.595a")]
    sources = {"hadith.muslim.2709a#dhikr": {"reference_en": "Sahih Muslim 2709a", "url": "u", "recording": {"reader": "Muhammad Jibril"}},
               "hadith.muslim.595a": {"reference_en": "Sahih Muslim 595a", "url": "v", "recording": {"reader": "Ryadussalihin.org"}}}
    lines, hadith, verse = publish.quoted(ids, sources)
    assert lines[0] == "• Sahih Muslim 2709a · Reading: Muhammad Jibril · u" and hadith and not verse


def test_two_parts_with_one_reader_are_one_line():
    ids = publish.quotes_of([{"reading": "hadith.muslim.595a", "part": "teach"}, {"reading": "hadith.muslim.595a", "part": "grace"}])
    one = {"reference_en": "Sahih Muslim 595a", "url": "v", "recording": {"reader": "Ryadussalihin.org"}}
    lines, _, _ = publish.quoted(ids, {"hadith.muslim.595a#teach": one, "hadith.muslim.595a#grace": one})
    assert lines == ["• Sahih Muslim 595a · Reading: Ryadussalihin.org · v"]
