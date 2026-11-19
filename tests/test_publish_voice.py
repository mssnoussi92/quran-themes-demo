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
