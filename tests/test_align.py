"""tools/audio/align.py places each phrase of a text in one long take. Two cases met on the takes of Dhul-Qarnayn
(2026-11-11), with the words and silences Whisper and ffmpeg gave, rounded: no Whisper is run here."""

from __future__ import annotations

import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "tools" / "audio"))

import align  # noqa: E402


def starts(phrases, words, quiet, new: bool) -> list[float]:
    return [p.start for p in align.align(phrases, words, quiet, [quiet] if new else None, before_its_word=new)]


def test_a_one_word_phrase_does_not_take_the_long_pause_after_it():
    """« شكرًا. »: Whisper hears the word start late, the long pause after it starts within 0.3 s of that, and
    it was the longest around: the word was written on screen a second after the voice had said it."""
    phrases = ["واللي بيتعب تقوله:", "شكرًا.", "القوة أمانة…"]
    words = [("واللي", 58.45, 58.80), ("بيتعب", 58.80, 59.20), ("تقوله", 59.20, 59.60), ("شكرا", 59.90, 60.40),
             ("القوة", 61.15, 61.50), ("أمانة", 61.50, 62.00)]
    quiet = [(57.50, 58.45), (59.60, 59.79), (60.13, 61.11)]
    assert starts(phrases, words, quiet, new=True)[1:] == [59.79, 61.11]
    assert starts(phrases, words, quiet, new=False)[1:] == [61.11, 61.11]      # the first film keeps the rule it was validated with


def test_a_pause_is_the_pause_before_one_phrase_only():
    """« نقول: ده تعبي… » said in one breath: the second phrase starts at its own word, not with the first."""
    phrases = ["أول ما ننجح…", "نقول:", "ده تعبي…"]
    words = [("أول", 38.30, 38.48), ("ما", 38.48, 38.58), ("ننجح", 38.58, 38.98), ("نقول", 38.98, 39.46),
             ("ده", 39.46, 39.60), ("تعبي", 39.60, 39.98)]
    quiet = [(37.68, 38.22), (39.04, 39.27), (40.05, 40.42)]
    assert starts(phrases, words, quiet, new=True)[1:] == [39.27, 39.41]
    assert starts(phrases, words, quiet, new=False)[1:] == [39.27, 39.27]


def test_a_validated_film_keeps_the_rule_it_was_validated_with():
    """The first film names an old episode (rule 2), the du'a says `rule: 3`, everything after is rule 4; and only
    rule 4 lifts the narration to the recitation's loudness: nothing is measured, nothing added, before it."""
    sys.path.insert(0, str(REPO / "tools" / "trial"))
    import prepare
    import yaml
    load = lambda name: yaml.safe_load((REPO / "content" / "trial" / f"{name}.yaml").read_text(encoding="utf-8"))
    assert [prepare.rule_of(load(n)) for n in ("film", "boat", "boy", "wall")] == [2, 2, 2, 2]
    assert [prepare.rule_of(load(n)) for n in ("dua", "asked", "written", "waited")] == [3, 3, 3, 3]
    assert [prepare.rule_of(load(n)) for n in ("qarnayn", "west", "tribute", "barrier")] == [4, 4, 4, 4]
    missing = REPO / "no-such-take.wav"
    assert prepare.trim(missing, 2) == 0.0 and prepare.trim(missing, 3) == 0.0 and prepare.trim(None, 4) == 0.0
