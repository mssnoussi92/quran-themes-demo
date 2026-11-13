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


def test_a_word_belongs_to_the_phrase_that_has_most_of_its_letters():
    """`stone` (2026-11-13), the words and silences Whisper and ffmpeg gave: « قدها » heard « قده », its « ا » matched
    the first letter of « التالتة », which then counted as said by the phrase before; « التالتة: » took the start of
    « القشرة… », and the cut before its segment would have clipped it."""
    phrases = ["والعمل الصالح…", "مش هيضيع منه ولا قدها.", "التالتة:", "القشرة البيضا الرفيعة اللي حوالين النواة."]
    words = [("والعمل", 20.62, 21.62), ("الصالح", 21.62, 22.10), ("مش", 22.10, 22.76), ("هيضيع", 22.76, 23.10),
             ("منه", 23.10, 23.36), ("ولا", 23.36, 23.56), ("قده", 23.56, 23.94), ("التالتة", 24.92, 25.88),
             ("القشرة", 25.88, 26.62), ("البيضة", 26.62, 26.94), ("الرفيعة", 26.94, 27.48), ("اللي", 27.48, 28.00),
             ("حوالين", 28.00, 28.44), ("النواة", 28.44, 28.90)]
    quiet = [(20.46, 20.99), (21.01, 21.21), (22.14, 22.51), (23.95, 25.03), (25.49, 25.92), (26.03, 26.19), (27.53, 27.85)]
    assert starts(phrases, words, quiet, new=True)[2:] == [25.03, 25.92]
    old = starts(phrases, words, quiet, new=False)[2:]
    assert old[0] == old[1]                                     # the validated films keep the rule they were made with
