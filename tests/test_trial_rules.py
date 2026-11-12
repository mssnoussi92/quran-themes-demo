"""tools/trial/rules.py refuses what the rules of the film-and-shorts model forbid, tried on a copy of the real
content with one thing broken each time. It passing on the real files (the CI) says they are clean, not that
the rules still bite. No text of a verse or of a hadith is typed here: it is taken from the copied registry."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

REPO = Path(__file__).resolve().parents[1]
RULES = REPO / "tools" / "trial" / "rules.py"


class Copy:
    """A copy of content/ without the audio and the takes, to break and check."""

    def __init__(self, root: Path):
        self.root = root

    def load(self, rel: str):
        return yaml.safe_load((self.root / rel).read_text(encoding="utf-8"))

    def dump(self, rel: str, data) -> None:
        (self.root / rel).write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=10_000), encoding="utf-8")

    def rules(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, str(RULES), "--root", str(self.root), *args],
                              capture_output=True, text=True, check=False)

    def source(self, sid: str) -> dict:
        for path in (self.root / "content" / "sources").glob("*.yaml"):
            for entry in yaml.safe_load(path.read_text(encoding="utf-8")):
                if entry["id"] == sid:
                    return entry
        raise KeyError(sid)

    def change_line(self, short: str, narration: str, index: int, new) -> str:
        """Replace the Arabic of a narration line (`new` maps the old text to the new one), in the short's file
        and in its voice text, so that only the rule under test is broken. Returns the new line."""
        spec = self.load(f"content/trial/{short}.yaml")
        seg = next(s for s in spec["segments"] if s.get("narration") == narration)
        old = seg["lines"][index]["ar"]
        seg["lines"][index]["ar"] = new(old)
        self.dump(f"content/trial/{short}.yaml", spec)
        voice = self.root / "content" / "voice-test" / f"{spec['text']}.txt"
        voice.write_text(voice.read_text(encoding="utf-8").replace(old, seg["lines"][index]["ar"]), encoding="utf-8")
        return seg["lines"][index]["ar"]


@pytest.fixture
def copy(tmp_path: Path) -> Copy:
    shutil.copytree(REPO / "content", tmp_path / "content", ignore=shutil.ignore_patterns("audio", "takes"))
    return Copy(tmp_path)


def refused(done, message: str) -> None:
    assert done.returncode == 1, done.stdout[-2000:] + done.stderr[-2000:]
    assert message in done.stdout, done.stdout[-2500:]


def test_the_real_repository_has_no_error():
    done = subprocess.run([sys.executable, str(RULES), "--all"], capture_output=True, text=True, check=False)
    assert done.returncode == 0, done.stdout[-3000:] + done.stderr[-2000:]
    assert " 0 error(s)" in done.stdout and "error content" not in done.stdout


def test_an_unknown_verse_id(copy):
    spec = copy.load("content/trial/asked.yaml")
    verse = next(s for s in spec["segments"] if "verse" in s)
    verse["verse"] = "quran.21.9999"
    copy.dump("content/trial/asked.yaml", spec)
    refused(copy.rules(), "verse quran.21.9999 is not in the registry")


def test_the_synthetic_voice_never_says_five_words_of_a_verse(copy):
    quoted = " ".join(copy.source("quran.21.84")["text_ar"].split()[:5])
    line = copy.change_line("asked", "turn", 0, lambda old: f"{old} {quoted}")
    done = copy.rules()
    refused(done, "the synthetic voice says")
    assert "quran.21.84" in done.stdout and line in done.stdout


def test_a_verse_said_in_everyday_spelling_is_caught_too(copy):
    """The registry holds the Uthmani script; a narration line would be typed in everyday spelling: no vowels,
    and the dagger alef written as an alef (the end of 21:83). Built from the registry, never typed."""
    words = copy.source("quran.21.83")["text_ar"].replace("\u0640\u0670", "ا").replace("\u0670", "ا").split()[-5:]
    plain = " ".join(re.sub("[\u0610-\u061a\u064b-\u065f\u06d6-\u06ed\u0640]", "", w) for w in words)
    assert plain != " ".join(copy.source("quran.21.83")["text_ar"].split()[-5:])
    copy.change_line("asked", "turn", 0, lambda old: f"{old} {plain}")
    done = copy.rules()
    refused(done, "the synthetic voice says")
    assert "quran.21.83" in done.stdout


def test_the_voice_text_follows_the_lines(copy):
    spec = copy.load("content/trial/asked.yaml")
    voice = copy.root / "content" / "voice-test" / f"{spec['text']}.txt"
    rows = voice.read_text(encoding="utf-8").splitlines()
    rows[2] = rows[2] + " يا"
    voice.write_text("\n".join(rows) + "\n", encoding="utf-8")
    refused(copy.rules(), f"voice text {spec['text']}.txt differs from the lines of the file")


def test_a_reuse_of_a_narration_that_does_not_exist(copy):
    spec = copy.load("content/trial/dua.yaml")
    reused = next(s for c in spec["chapters"] for s in c["segments"] if "reuse" in s)
    reused["reuse"] = reused["reuse"].split(".")[0] + ".nothing-here"
    copy.dump("content/trial/dua.yaml", spec)
    refused(copy.rules(), "has no narration « nothing-here »")


def test_a_reuse_of_lines_out_of_range(copy):
    spec = copy.load("content/trial/film.yaml")
    reused = next(s for c in spec["chapters"] for s in c["segments"] if s.get("lines") and "reuse" in s)
    reused["lines"] = [0, 2, 9]
    copy.dump("content/trial/film.yaml", spec)
    refused(copy.rules(), "out of range")


def test_a_tirmidhi_hadith_graded_outside_the_policy(copy):
    sid = "hadith.tirmidhi.3247"
    registry = copy.load("content/sources/hadith.yaml")
    entry = next(e for e in registry if e["id"] == sid)
    next(g for g in entry["origin"]["grades"] if g["name"] == "Al-Albani")["grade"] = "Daif"
    copy.dump("content/sources/hadith.yaml", registry)
    refused(copy.rules(), f"reading {sid}: Al-Albani grades it « Daif », outside content/policy.yaml")


def test_a_reading_without_a_recording_is_an_error_but_a_warning_in_a_draft(copy):
    sid = "hadith.tirmidhi.3247"
    registry = copy.load("content/sources/hadith.yaml")
    del next(e for e in registry if e["id"] == sid)["recording"]
    copy.dump("content/sources/hadith.yaml", registry)
    refused(copy.rules(), f"reading {sid} has no recording")
    draft = copy.rules("--draft")
    assert draft.returncode == 0, draft.stdout[-2000:]
    assert re.search(rf"warning content/trial/\w+\.yaml: reading {sid} has no recording", draft.stdout), draft.stdout[-2000:]


def test_a_verse_with_no_cut_is_refused(copy):
    cuts = copy.root / "content" / "recitations" / "sayegh.json"
    data = json.loads(cuts.read_text(encoding="utf-8"))
    del data["verses"]["21:84"]
    cuts.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    refused(copy.rules(), "verse quran.21.84 has no cut")


def test_a_missing_field_and_an_empty_line(copy):
    spec = copy.load("content/trial/wall.yaml")
    del spec["clip"]["author"]
    next(s for s in spec["segments"] if "narration" in s)["lines"][0]["en"] = ""
    copy.dump("content/trial/wall.yaml", spec)
    done = copy.rules()
    refused(done, "missing field `clip.author`")
    assert "an empty ar or en" in done.stdout


def test_a_sign_no_font_of_the_project_can_draw_is_refused(copy):
    """Left to the machine's own font, « ﷺ » was a pixel font in a session and an empty box on a GitHub runner."""
    spec = copy.load("content/trial/asked.yaml")
    line = next(s for s in spec["segments"] if "narration" in s)["lines"][0]
    line["en"] = line["en"] + " 中"
    copy.dump("content/trial/asked.yaml", spec)
    refused(copy.rules(), "no glyph for « 中 » U+4E2D in Lora.ttf or Amiri-Regular.ttf")


def test_what_the_english_font_lacks_is_drawn_by_the_arabic_one():
    sys.path.insert(0, str(REPO / "tools" / "trial"))
    import rules
    lora, amiri = rules.codepoints("Lora.ttf"), rules.codepoints("Amiri-Regular.ttf")
    for sign in "ﷺḍḥ":            # the Prophet ﷺ, al-Khiḍr, Muḥammad: in the translations and the English lines
        assert ord(sign) not in lora and ord(sign) in amiri, sign
    assert rules.no_glyph("And the Prophet ﷺ told us that al-Khiḍr said: “…”", "latin") == []
    assert rules.no_glyph("والنبي صلى الله عليه وسلم قال: «…»، ليه؟!", "lines") == []
    assert rules.no_glyph("a → b", "latin") == ["« → » U+2192"]


def test_a_refused_word_is_a_warning_not_an_error(copy):
    line = copy.change_line("asked", "turn", 0, lambda old: f"شالتهم {old}")
    done = copy.rules()
    assert done.returncode == 0, done.stdout[-2000:]
    assert "warning content/trial/asked.yaml: refused wording « shalathum »" in done.stdout and line in done.stdout


def test_the_refused_words_hit_what_they_must_and_nothing_else():
    sys.path.insert(0, str(REPO / "tools" / "trial"))
    import rules
    wording = yaml.safe_load((REPO / "content" / "wording.yaml").read_text(encoding="utf-8"))["refused"]
    patterns = {e["id"]: [rules.whole(p) for p in e["patterns"]] for e in wording}

    def hit(entry: str, text: str) -> bool:
        folded = " ".join(rules.words_of(text))
        return any(p.search(folded) for p in patterns[entry])

    assert hit("shalathum", "ده شالتهم")
    for text in ("اللي سكت", "ساكت", "بتسكّتنا", "مسكّتانا", "بتسكّتك"):
        assert hit("silence-for-not-asking", text), text
    assert hit("broke", "كل حاجة اتكسرت") and hit("broke", "اللي بتتكسر") and hit("kinds-of-decree", "أنواع القدر")
    assert hit("proverb-of-patience", "مضرب المثل في الصبر")
    assert hit("young-man", "راجل شاب كبير") and not hit("young-man", "راسه شابت") and not hit("young-man", "الشباب")


# ---- A series of shorts that stand alone: what a narration rests on, a passage recited without a break ----------

def set_sources(copy, short: str, narration: str, sources: list[str]) -> None:
    spec = copy.load(f"content/trial/{short}.yaml")
    next(s for s in spec["segments"] if s.get("narration") == narration)["sources"] = sources
    copy.dump(f"content/trial/{short}.yaml", spec)


def test_a_series_is_checked_with_its_shorts(copy):
    done = copy.rules("--film", "ayah", "--draft")
    assert done.returncode == 0, done.stdout[-3000:]
    assert "series ayah: 3 short(s), 0 error(s)" in done.stdout


def test_a_narration_rests_on_a_hadith_or_a_tafsir_of_the_policy(copy):
    set_sources(copy, "caravan", "meaning", ["tafsir.muyassar.39.53"])           # the tafsir of a verse another short recites
    refused(copy.rules("--film", "ayah", "--draft"), "which this short does not recite")
    set_sources(copy, "caravan", "meaning", ["quran.62.11"])                     # a verse is recited, not rested on
    refused(copy.rules("--film", "ayah", "--draft"), "a narration rests on a hadith or a tafsir")
    set_sources(copy, "caravan", "meaning", ["tafsir.razi.62.11"])               # not in the registry
    refused(copy.rules("--film", "ayah", "--draft"), "source tafsir.razi.62.11 is not in the registry")
    set_sources(copy, "caravan", "meaning", ["tafsir.muyassar.62.11"])
    assert copy.rules("--film", "ayah", "--draft").returncode == 0
    policy = copy.load("content/policy.yaml")                                    # a tafsir the owner did not let in
    del policy["tafsir"]["editions"]["muyassar"]
    copy.dump("content/policy.yaml", policy)
    refused(copy.rules("--film", "ayah", "--draft"), "tafsir « muyassar » is outside content/policy.yaml")


def test_a_report_outside_the_hadith_policy_is_refused(copy):
    path = copy.root / "content" / "sources" / "hadith.yaml"
    entries = yaml.safe_load(path.read_text(encoding="utf-8"))
    next(e for e in entries if e["id"] == "hadith.bukhari.936")["ref"]["collection"] = "wahidi"
    path.write_text(yaml.safe_dump(entries, allow_unicode=True, sort_keys=False, width=100_000), encoding="utf-8")
    refused(copy.rules("--film", "ayah", "--draft"), "source hadith.bukhari.936: collection « wahidi » is outside content/policy.yaml")


def test_the_voice_tells_a_report_and_never_reads_it(copy):
    """Four words in a row of the report a narration rests on are refused; what every line says of the Prophet ﷺ
    (the blessing after his name) is in the report too and is not a quotation."""
    assert copy.rules("--film", "ayah", "--draft").returncode == 0               # the lines say the blessing: accepted
    words = copy.source("hadith.bukhari.936")["text_ar"].rsplit("وسلم", 1)[1].split()[:4]
    line = copy.change_line("caravan", "open", 1, lambda old: old + " " + " ".join(words))
    done = copy.rules("--film", "ayah", "--draft")
    refused(done, "the synthetic voice says")
    # Both reports this narration rests on say these four words: the error names the one listed first. (Until the
    # sources were validated, a warning listed every proposed source and this passed whatever the error named.)
    said = next(row for row in done.stdout.splitlines() if "the synthetic voice says" in row)
    assert ("hadith.muslim.863a" in said or "hadith.bukhari.936" in said) and line in done.stdout


def test_a_passage_is_verses_that_follow_one_another_with_cuts_that_touch(copy):
    spec = copy.load("content/trial/duha.yaml")
    first = next(s for s in spec["segments"] if "verses" in s)
    kept = list(first["verses"])
    first["verses"] = [kept[0], kept[2]]
    copy.dump("content/trial/duha.yaml", spec)
    refused(copy.rules("--film", "ayah", "--draft"), "a passage is made of verses that follow one another in one surah")
    first["verses"] = kept
    copy.dump("content/trial/duha.yaml", spec)
    cuts_path = copy.root / "content" / "recitations" / "sayegh.json"
    cuts = json.loads(cuts_path.read_text(encoding="utf-8"))
    cuts["verses"]["93:2"]["start"] += 0.4
    cuts_path.write_text(json.dumps(cuts, ensure_ascii=False), encoding="utf-8")
    refused(copy.rules("--film", "ayah", "--draft"), "their cuts do not touch in the reciter's file")


def test_a_short_without_a_clip_is_a_warning_until_its_videos_are_validated(copy):
    spec = copy.load("content/trial/caravan.yaml")
    spec.pop("clip", None)
    spec.pop("validated", None)          # the real short is validated: first, a short whose videos are not yet
    copy.dump("content/trial/caravan.yaml", spec)
    done = copy.rules("--film", "ayah", "--draft")
    assert done.returncode == 0 and "no `clip` yet" in done.stdout, done.stdout[-2000:]
    spec["validated"] = {"by": "owner", "on": "2026-11-11", "what": ["voice"]}
    copy.dump("content/trial/caravan.yaml", spec)
    refused(copy.rules("--film", "ayah", "--draft"), "missing field `clip.source`")

