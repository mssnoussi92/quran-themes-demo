#!/usr/bin/env python3
"""Check content/ against the JSON Schemas and the editorial rules in CLAUDE.md.

Usage:
  uv run --with jsonschema --with pyyaml scripts/validate.py            # draft mode
  uv run --with jsonschema --with pyyaml scripts/validate.py --release  # every cited source must be validated
  uv run --with jsonschema --with pyyaml scripts/validate.py --release --reel dua-01  # and that reel's script
                                                                                   # and publication texts
  uv run --with jsonschema --with pyyaml scripts/validate.py --release --whole khidr  # the whole episode's own
                                                                                   # order and lines (whole)

Exit code 1 when there is at least one error. Warnings never fail the run.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, where: str, msg: str) -> None:
        self.errors.append(f"ERROR   {where}: {msg}")

    def warn(self, where: str, msg: str) -> None:
        self.warnings.append(f"warning {where}: {msg}")


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def load_yaml(path: Path):
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def schema_check(validator: Draft202012Validator, data, where: str, report: Report) -> bool:
    ok = True
    for err in sorted(validator.iter_errors(data), key=lambda e: list(e.absolute_path)):
        loc = "/".join(str(p) for p in err.absolute_path) or "(root)"
        report.error(where, f"schema: {loc}: {err.message}")
        ok = False
    return ok


def check_grade(src: dict, rule: dict, where: str, report: Report) -> None:
    """Collections with weak hadiths: the grade published by hadith-api for rule['by'] must be accepted."""
    by = rule["by"]
    grades = [g["grade"] for g in (src.get("origin") or {}).get("grades", []) if g["name"].lower() == by.lower()]
    if not grades:
        report.error(where, f"no grade by {by} in origin.grades (run tools/sources/fetch.py)")
        return
    if grades[0] not in rule["accept"]:
        report.error(where, f"{by} grades it '{grades[0]}', outside content/policy.yaml; status must be excluded")
        return
    if src.get("graded_by", "").lower() != by.lower():
        report.error(where, f"graded_by must be {by} (content/policy.yaml)")
    if src.get("grade") != grades[0].split()[0].lower():
        report.error(where, f"grade '{src.get('grade')}' does not match {by}'s '{grades[0]}'")


def check_registry(report: Report, policy: dict) -> dict[str, dict]:
    validator = Draft202012Validator(json.loads((ROOT / "schemas/source.schema.json").read_text()))
    allowed = set(policy.get("hadith", {}).get("collections", []))
    graded = policy.get("hadith", {}).get("graded", {})
    registry: dict[str, dict] = {}
    for path in sorted((CONTENT / "sources").glob("*.yaml")):
        entries = load_yaml(path) or []
        if not schema_check(validator, entries, rel(path), report):
            continue
        for src in entries:
            sid, where = src["id"], f"{rel(path)} [{src['id']}]"
            if sid in registry:
                report.error(where, "duplicate id")
            registry[sid] = src
            ref = src["ref"]
            # An English excerpt is a selection of the published text, never a rewording.
            if "excerpt_en" in src and src["excerpt_en"] not in (src.get("text_en") or ""):
                report.error(where, "excerpt_en is not a passage of text_en")
            if "excerpt_ar" in src:
                if src["type"] != "hadith":
                    report.error(where, "excerpt_ar is only for a hadith")
                elif tidy(src["excerpt_ar"]) not in tidy(prophet_words(src.get("text_ar") or "")):
                    report.error(where, "excerpt_ar is not a passage of the Prophet's words in text_ar")
                if "excerpt_en" not in src:
                    report.error(where, "excerpt_ar needs excerpt_en, its English")
            # Texts come from an API (tools/sources/fetch.py writes origin), never typed by hand.
            if (src.get("text_ar") or src.get("text_en")) and "origin" not in src:
                report.error(where, "text without origin: fill it with tools/sources/fetch.py, never by hand")
            if src["type"] == "ayah" and sid != f"quran.{ref['surah']}.{ref['ayah']}":
                report.error(where, "id does not match ref")
            if src["type"] == "hadith":
                suffix = chr(ord("a") + ref["narration"] - 1) if "narration" in ref else ""
                if sid != f"hadith.{ref['collection']}.{ref['number']}{suffix}":
                    report.error(where, "id does not match ref")
                if ref["collection"] not in allowed and src["status"] != "excluded":
                    report.error(where, f"collection '{ref['collection']}' is outside content/policy.yaml; status must be excluded")
                if src.get("grade") in ("daif", "mawdu") and src["status"] != "excluded":
                    report.error(where, f"grade '{src['grade']}' cannot be quoted; status must be excluded")
                rule = graded.get(ref["collection"])
                if rule and src["status"] != "excluded":
                    check_grade(src, rule, where, report)
                check_recording(src, where, report)
    return registry


def prophet_words(text_ar: str) -> str:
    """The words a hadith card shows: from the first to the last quotation mark (prepare.ts)."""
    first, last = text_ar.find('"'), text_ar.rfind('"')
    return text_ar[first + 1:last] if 0 <= first < last else ""


def tidy(text: str) -> str:
    """Text as a card shows it: no right-to-left marks, single spaces (prepare.ts betweenQuotes)."""
    return re.sub(r"\s+", " ", text.replace("\u200f", "")).strip()


def shown_words(src: dict) -> str:
    """What a hadith card shows: its excerpt (excerpt_ar), or the Prophet's words."""
    return src.get("excerpt_ar") or prophet_words(src.get("text_ar") or "")


def plain_words(text: str) -> list[str]:
    """Words for comparing a reading with the text: no diacritics or punctuation, one alef, ى = ي,
    ة = ه (what speech recognition writes varies there)."""
    text = ARABIC_MARKS.sub("", text)
    text = re.sub("[أإآٱ]", "ا", text).replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    return re.sub(r"[^\w\s]", " ", text).split()


def check_recording(src: dict, where: str, report: Report) -> None:
    """A recorded reading must say the words the card shows: what Whisper heard there (heard) is
    compared with them. A difference is a warning (recognition errs too) until the owner has
    listened and validated the recording."""
    rec = src.get("recording")
    if not rec:
        return
    if rec["end"] <= rec["start"]:
        report.error(where, "recording: end must come after start")
    if rec["status"] == "validated" and not rec.get("validated_by"):
        report.error(where, "recording: validated needs validated_by (the owner, after listening)")
    shown, heard = plain_words(shown_words(src)), plain_words(rec["heard"])
    if shown != heard and rec["status"] != "validated":
        report.warn(where, f"recording: heard {len(heard)} words that differ from the {len(shown)} shown; listen to it")


def check_episode(path: Path, registry: dict, catalog: dict, backgrounds: dict, release: bool, report: Report,
                  reel: str | None = None, whole: str | None = None) -> None:
    """release: sources and readings must be validated, in every scene, or only in `reel`'s scenes when
    a reel is given (a source still proposed in another episode does not block this reel's render), or
    only in the scenes said in `whole` episode alone (no reel)."""
    validator = Draft202012Validator(json.loads((ROOT / "schemas/episode.schema.json").read_text()))
    ep = load_yaml(path)
    if not schema_check(validator, ep, rel(path), report):
        return
    reels = {r["id"] for r in ep["reels"]}
    validated_reels = {r["id"] for r in ep["reels"] if r.get("validated_by")}
    whole_validated = bool((ep.get("whole") or {}).get("validated_by"))
    lexicon = (load_yaml(CONTENT / "pronunciation.yaml") or {}).get("words", [])
    dialect = {alef(k): v for k, v in ((load_yaml(CONTENT / "dialect.yaml") or {}).get("words") or {}).items()}
    egyptian = ep["narration_language"] == "ar-egy"
    style = ep["style"]
    check_publish(ep, rel(path), report)
    seen: set[str] = set()
    for scene in ep["scenes"]:
        where = f"{rel(path)} [{scene['id']}]"
        if reel is not None:
            strict = release and scene.get("reel") == reel
        elif whole is not None:
            strict = release and ep["episode"] == whole and not scene.get("reel")
        else:
            strict = release
        if scene["id"] in seen:
            report.error(where, "duplicate scene id")
        seen.add(scene["id"])

        if "reel" in scene and scene["reel"] not in reels:
            report.error(where, f"unknown reel '{scene['reel']}'")

        visual, audio = scene["visual"], scene["audio"]
        template = visual["template"]
        src = registry.get(scene.get("source", "")) if "source" in scene else None

        # Sources: quoted by id only, never excluded, validated before release.
        if "source" in scene:
            if src is None:
                report.error(where, f"source '{scene['source']}' is not in content/sources/")
            elif src["status"] == "excluded":
                report.error(where, f"source '{src['id']}' is excluded")
            elif src["status"] != "validated":
                (report.error if strict else report.warn)(where, f"source '{src['id']}' is not validated yet")
            if src is not None and src.get("recording", {}).get("status") == "proposed":
                (report.error if strict else report.warn)(
                    where, f"recording of '{src['id']}' ({src['recording']['reader']}) not validated by the owner yet")
        if template in ("ayah-card", "source-card") and "source" not in scene:
            report.error(where, f"template '{template}' needs a source")

        # Quran: real recitation only, never TTS.
        is_ayah = src is not None and src["type"] == "ayah"
        if is_ayah and audio != "recitation":
            report.error(where, "a verse must use audio: recitation (never TTS)")
        if audio == "recitation" and not is_ayah:
            report.error(where, "audio: recitation is only for verses")
        if is_ayah and template != "ayah-card":
            report.error(where, "a verse must use the ayah-card template")

        # Narration needed for TTS scenes.
        if audio == "tts" and "narration" not in scene:
            report.error(where, "audio: tts needs a narration")

        # Pronunciation and reel-only ends: the voice says the words shown, and an episode cut drops
        # whole phrases at the end of the line, in both languages.
        narration = scene.get("narration") or {}
        # Words the voice says wrong (content/pronunciation.yaml): their spelling for the voice, in a
        # reel still being written (a validated reel keeps the takes the owner approved).
        validated = scene.get("reel") in validated_reels if scene.get("reel") else whole_validated
        if narration.get("ar") and not validated:
            shown = spoken_words(narration["ar"])
            said = scene.get("say_ar", narration["ar"])
            for entry in lexicon:
                # `also`: other spellings the voice says right too (one per take that needed it).
                if spoken_words(entry["word"])[0] in shown and not any(v in said for v in [entry["say"], *entry.get("also", [])]):
                    report.warn(where, f"« {entry['word']} »: the voice says it right as « {entry['say']} » "
                                       f"(content/pronunciation.yaml): write it so in say_ar")
        # Egyptian narration: no standard-Arabic word where the dialect has its own (content/dialect.yaml),
        # outside quotes, in a reel still being written.
        if egyptian and narration.get("ar") and not validated:
            for word in standard_words(narration["ar"], dialect):
                report.warn(where, f"« {word} » is standard Arabic in the Egyptian narration: say « {dialect[word]} » "
                                   f"(content/dialect.yaml)")
        if "say_ar" in scene:
            if not narration.get("ar"):
                report.error(where, "say_ar needs narration.ar")
            else:
                said, shown = spoken_words(scene["say_ar"]), spoken_words(narration["ar"])
                if len(said) != len(shown) or not all(same_word_spelled(a, b) for a, b in zip(shown, said)):
                    report.error(where, "say_ar must say the words of narration.ar, word for word (diacritics, "
                                        "punctuation and up to two letters per word may differ: skill voice-spelling)")
        if "reel_only_end" in scene:
            end = scene["reel_only_end"]
            if not scene.get("reel"):
                report.error(where, "reel_only_end needs a reel")
            for lang in ("ar", "en"):
                text, tail = (narration.get(lang) or "").strip(), end[lang].strip()
                if not (text.endswith(" " + tail) and text[: -len(tail)].strip()):
                    report.error(where, f"reel_only_end.{lang} must be the end of narration.{lang}, after a space")

        # Backgrounds: closed catalog too (content/backgrounds.yaml).
        if "background" in visual and visual["background"] not in backgrounds:
            report.error(where, f"background '{visual['background']}' is not in content/backgrounds.yaml")
        elif "background" in visual and style not in drawn_in(backgrounds[visual["background"]]):
            report.error(where, f"background '{visual['background']}' has no drawing in the style '{style}' "
                                f"(content/backgrounds.yaml, styles)")

        # Characters: closed catalog, fictional only, never with real people.
        chars = visual.get("characters", [])
        if chars and template != "scene":
            report.error(where, "characters are only allowed in the 'scene' template")
        if chars and scene.get("mentions"):
            report.error(where, "no character in a scene that mentions a real person (use name-card)")
        if template == "name-card" and not scene.get("mentions"):
            report.error(where, "name-card needs mentions")
        for ch in chars:
            spec = catalog.get(ch["id"])
            if spec is None:
                report.error(where, f"character '{ch['id']}' is not in content/characters.yaml")
                continue
            if ch["pose"] not in poses_in(spec, style):
                report.error(where, f"pose '{ch['pose']}' not in catalog for '{ch['id']}' in the style '{style}'")
            if ch["mood"] not in spec["moods"]:
                report.error(where, f"mood '{ch['mood']}' not in catalog for '{ch['id']}'")

    check_whole(ep, rel(path), report)
    check_style(ep, rel(path), report)
    check_format(ep, rel(path), report)
    check_picture(ep, rel(path), report)
    check_thumbnail(ep, rel(path), catalog, backgrounds, report)


QUOTES = ("ayah-card", "source-card")

# The style each format takes (docs/styles.md, owner's decision of 2026-11-09).
STYLE_OF_FORMAT = {
    "story-suspense": "paper", "story-linear": "paper", "misconceptions": "chalk",
    "collection": "illumination", "text-explained": "illumination", "practical": "flat", "two-paths": "flat",
}


def drawn_in(background: dict) -> list[str]:
    """The styles a background of the catalog is drawn in (content/backgrounds.yaml, `styles`; flat by default)."""
    return background.get("styles") or ["flat"]


# Styles whose people are silhouettes with no face (video/src/styles/paper/silhouettes.ts): cut in
# paper, or painted flat in a manuscript. The others draw the Open Peeps figures (flat, chalk).
SILHOUETTE_STYLES = ("paper", "illumination")


def poses_in(character: dict, style: str) -> list[str]:
    """The poses a character has in a style: Open Peeps bodies (flat, chalk), silhouettes (paper,
    illumination: `paper_poses`)."""
    return list(character.get("paper_poses") or []) if style in SILHOUETTE_STYLES else list(character["poses"])


def check_style(ep: dict, where: str, report: Report) -> None:
    """The episode's style follows its format (docs/styles.md), checked while a reel is being written:
    the nine episodes made before the styles keep the flat style they were validated in."""
    expected = STYLE_OF_FORMAT.get(ep["format"])
    if expected and ep["style"] != expected and any(not r.get("validated_by") for r in ep["reels"]):
        report.warn(where, f"style '{ep['style']}' for the format '{ep['format']}': docs/styles.md gives '{expected}'")


def format_problems(fmt: str, scenes: list[dict], first: bool, last: bool) -> list[str]:
    """What a reel misses for its format (docs/formats.md): every event proven by its verse or hadith
    before the lesson, every lesson followed by a life example (owner's rules, 2026-11-08), and the
    beats each format needs."""
    problems: list[str] = []
    event = lesson = None
    event_runs = 0
    for s in scenes:
        role, template = s["role"], s["visual"]["template"]
        if role == "event":
            if event is None:
                event_runs += 1
            event = event or s["id"]
            if lesson:
                problems.append(f"lesson '{lesson}' has no life example (role: example) after it")
                lesson = None
        elif template in QUOTES:
            event = None
        elif role in ("lesson", "example") and event:
            problems.append(f"event '{event}' is not followed by its verse or hadith before the {role}")
            event = None
        if role == "lesson":
            lesson = lesson or s["id"]
        elif role == "example":
            lesson = None
    if event:
        problems.append(f"event '{event}' is not followed by its verse or hadith")
    if lesson:
        problems.append(f"lesson '{lesson}' has no life example (role: example) after it")

    roles = {s["role"] for s in scenes}
    has_quote = any(s["visual"]["template"] in QUOTES for s in scenes)
    middle = not first and not last
    if fmt == "collection":
        if not scenes or scenes[0]["role"] != "hook":
            problems.append("a collection reel stands alone: it starts with its own hook")
        for role in ("event", "lesson"):
            if role not in roles:
                problems.append(f"no {role} in this reel")
        return problems
    if first and "promise" not in roles:
        problems.append("the first reel's hook ends with a promise (role: promise)")
    if last and "conclusion" not in roles:
        problems.append("the last reel is the conclusion (role: conclusion)")
    if fmt in ("story-suspense", "story-linear") and not last and "event" not in roles:
        problems.append("no event in this reel")
    if middle:
        needed = {"misconceptions": ("misconception", "lesson"), "story-suspense": ("lesson",),
                  "story-linear": ("lesson",), "text-explained": ("lesson",), "two-paths": ("lesson",),
                  "practical": ("lesson",)}[fmt]
        for role in needed:
            if role not in roles:
                problems.append(f"no {role} in this reel")
        if fmt in ("text-explained", "practical") and not has_quote:
            problems.append("no verse or hadith in this reel")
        if fmt == "two-paths" and event_runs < 2:
            problems.append("two paths: two events, each proven by its verse or hadith")
    return problems


def check_format(ep: dict, where: str, report: Report) -> None:
    """The episode's format (docs/formats.md, skill choose-format). Its structure is checked in the
    reels being written: a reel the owner validated stays as they approved it (qarnayn-02's lesson on
    the rising sun has no example, by their choice)."""
    fmt = ep["format"]
    if fmt == "story-suspense" and not ep.get("whole"):
        report.error(where, "format story-suspense needs `whole`: the events first, then their secrets (docs/formats.md)")
    if ep.get("whole") and fmt != "story-suspense":
        report.warn(where, f"`whole` reorders the episode, which only the story-suspense format does (format: {fmt})")
    for i, reel in enumerate(ep["reels"]):
        if reel.get("validated_by"):
            continue
        scenes = [s for s in ep["scenes"] if s.get("reel") == reel["id"]]
        for problem in format_problems(fmt, scenes, i == 0, i == len(ep["reels"]) - 1):
            report.warn(f"{where} [{reel['id']}]", f"{problem} ({fmt}: docs/formats.md)")


# Formats where the text is the picture (docs/styles.md: a manuscript page): a drawn scene is the exception.
TEXT_FORMATS = ("collection", "text-explained")
DRAWN_SHARE = 1 / 3
TEXT_RUN = 3


def picture_problems(fmt: str, scenes: list[dict]) -> list[str]:
    """What a reel gives to look at (audit of the published videos, 2026-11-09: 27 % of 480 scenes
    drawn, 48 % a card showing the sentence the voice says, the picture unchanged for 60 to 83 % of a
    reel; owner's decision of 2026-11-10: more drawn scenes in the episodes to come). At least a third
    of a reel's scenes are drawn (a place, people), and never three cards of narration in a row."""
    problems: list[str] = []
    if not scenes:
        return problems
    drawn = sum(1 for s in scenes if s["visual"]["template"] == "scene")
    if fmt not in TEXT_FORMATS and drawn < DRAWN_SHARE * len(scenes):
        problems.append(f"{drawn} of {len(scenes)} scenes are drawn (template: scene): at least a third, "
                        f"the rest of the time the picture is a card of text")
    run: list[str] = []
    for s in [*scenes, None]:
        if s is not None and s["visual"]["template"] == "title-card":
            run.append(s["id"])
            continue
        if len(run) >= TEXT_RUN:
            problems.append(f"{len(run)} cards of narration in a row ({run[0]} … {run[-1]}): nothing new to look at; "
                            f"say one of these lines over a drawn scene")
        run = []
    return problems


def check_picture(ep: dict, where: str, report: Report) -> None:
    """Checked in the reels being written, as the format is: a reel the owner validated stays as is."""
    for reel in ep["reels"]:
        if reel.get("validated_by"):
            continue
        scenes = [s for s in ep["scenes"] if s.get("reel") == reel["id"]]
        for problem in picture_problems(ep["format"], scenes):
            report.warn(f"{where} [{reel['id']}]", problem)


def check_whole(ep: dict, where: str, report: Report) -> None:
    """The whole episode's order (`whole`): known scenes, each once, and every scene without a reel
    in it (said only in the whole episode)."""
    ids = {s["id"] for s in ep["scenes"]}
    whole = ep.get("whole")
    listed: list[str] = [sid for part in (whole or {}).get("parts", []) for sid in part["scenes"]]
    for sid in listed:
        if sid not in ids:
            report.error(f"{where} [whole]", f"unknown scene '{sid}'")
    for sid in sorted({s for s in listed if listed.count(s) > 1}):
        report.error(f"{where} [whole]", f"scene '{sid}' is listed more than once")
    for scene in ep["scenes"]:
        if not scene.get("reel") and scene["id"] not in listed:
            report.error(f"{where} [{scene['id']}]", "a scene without reel is said only in the whole episode: "
                                                     "list it in whole.parts")


def check_thumbnail(ep: dict, where: str, catalog: dict, backgrounds: dict, report: Report) -> None:
    """YouTube thumbnail of the whole episode: same closed catalogs as the scenes (a fictional
    character only, never a real person), validated by the owner on the rendered image."""
    thumb = ep.get("thumbnail")
    if thumb is None:
        report.warn(where, "no thumbnail for the whole episode (thumbnail: layout, headline, background)")
        return
    where = f"{where} [thumbnail]"
    style = ep.get("style", "flat")
    if thumb["background"] not in backgrounds:
        report.error(where, f"background '{thumb['background']}' is not in content/backgrounds.yaml")
    elif style not in drawn_in(backgrounds[thumb["background"]]):
        report.error(where, f"background '{thumb['background']}' has no drawing in the style '{style}'")
    ch = thumb.get("character")
    if ch:
        spec = catalog.get(ch["id"])
        if spec is None:
            report.error(where, f"character '{ch['id']}' is not in content/characters.yaml")
        else:
            if ch["pose"] not in poses_in(spec, style):
                report.error(where, f"pose '{ch['pose']}' not in catalog for '{ch['id']}'")
            if ch["mood"] not in spec["moods"]:
                report.error(where, f"mood '{ch['mood']}' not in catalog for '{ch['id']}'")
    if thumb["layout"] in ("close-up", "scene") and not ch:
        report.error(where, f"layout '{thumb['layout']}' needs a character")


ARABIC_MARKS = re.compile("[\u064b-\u0652\u0670\u0640]")
QUOTED = re.compile("«[^»]*»")


def alef(word: str) -> str:
    """A word without its vowels, alif with or without hamza alike."""
    return re.sub("[أإآ]", "ا", ARABIC_MARKS.sub("", word))


def standard_words(text: str, dialect: dict) -> list[str]:
    """Standard-Arabic words of content/dialect.yaml in an Egyptian line, outside « » quotes, with or
    without a « و » or « ف » in front."""
    found = []
    for word in re.findall("[\u0621-\u0652\u0670]+", QUOTED.sub(" ", text)):
        word = alef(word)
        for candidate in (word, word[1:] if word[:1] in "وف" else ""):
            if candidate in dialect:
                found.append(candidate)
                break
    return found


def edit_distance(a: str, b: str) -> int:
    row = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        prev, row[0] = row[0], i
        for j, cb in enumerate(b, 1):
            prev, row[j] = row[j], min(row[j] + 1, row[j - 1] + 1, prev + (ca != cb))
    return row[-1]


def same_word_spelled(shown: str, said: str) -> bool:
    """The word the voice reads is the word shown, possibly respelled for the voice (owner's decision,
    2026-11-07: « تبت » read « توبت », and more letters if the voice needs them): at most two letters
    added, removed or changed. Whisper (listen.py --episode) and the owner's ear check the meaning."""
    return edit_distance(shown, said) <= 2


def spoken_words(text: str) -> list[str]:
    """Words of an Arabic line for comparing what is shown and what is said: no diacritics, no
    punctuation, ة and ه alike (a silent ة can be written ه for the voice)."""
    words = re.sub(r"[^\w\s]", " ", ARABIC_MARKS.sub("", text)).split()
    return [w.replace("ة", "ه") for w in words]


YOUTUBE_TITLE = 100


def check_publish(ep: dict, where: str, report: Report) -> None:
    """Publication texts (`publish`): one per reel and one for the whole episode, with its hashtags.
    The YouTube title is « <en> · <ar> » (video/scripts/publish.ts, which checks the other limits)."""
    if "publish" not in ep:
        report.warn(where, "no publication texts for the whole episode (publish: title, description, hashtags)")
    elif not ep["publish"].get("hashtags"):
        report.warn(where, "publish: no theme hashtags")
    for item in [ep, *ep["reels"]]:
        texts = item.get("publish")
        name = item.get("id", ep["episode"])
        if texts is None:
            if item is not ep:
                report.warn(where, f"reel '{name}': no publication texts (publish: title, description)")
            continue
        title = f"{texts['title']['en']} · {texts['title']['ar']}"
        if len(title) > YOUTUBE_TITLE:
            report.error(where, f"{name}: YouTube title « {title} » has {len(title)} characters (max {YOUTUBE_TITLE})")
        if re.search("[<>]", title):
            report.error(where, f"{name}: no < or > in a YouTube title")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--release", action="store_true", help="fail on sources that are not validated")
    parser.add_argument("--reel", help="with --release: this reel's script must be validated by the owner (validated_by)")
    parser.add_argument("--whole", metavar="EPISODE",
                        help="with --release: the whole episode's order and its own lines (whole.validated_by)")
    args = parser.parse_args()

    report = Report()
    policy = load_yaml(CONTENT / "policy.yaml") or {}
    catalog = (load_yaml(CONTENT / "characters.yaml") or {}).get("characters", {})
    backgrounds = (load_yaml(CONTENT / "backgrounds.yaml") or {}).get("backgrounds", {})
    registry = check_registry(report, policy)
    episodes = sorted((CONTENT / "episodes").glob("*.yaml"))
    for path in episodes:
        check_episode(path, registry, catalog, backgrounds, args.release, report, args.reel, args.whole)
    # The reciter of content/policy.yaml recites every verse; one with a file per surah (Tawfiq As-Sayegh)
    # needs the checked cut of each verse in content/recitations/<reciter>.json (tools/audio/recitation.py).
    reciter = (policy.get("quran") or {}).get("reciter")
    cuts_path = CONTENT / "recitations" / f"{reciter}.json"
    if cuts_path.is_file():
        cuts = json.loads(cuts_path.read_text(encoding="utf-8")).get("verses", {})
        for path in episodes:
            for scene in (load_yaml(path) or {}).get("scenes", []):
                key = str(scene.get("source", "")).removeprefix("quran.").replace(".", ":")
                if scene.get("audio") == "recitation" and key not in cuts:
                    report.error(f"{rel(path)} [{scene['id']}]", f"no cut of {key} for {reciter}: run "
                                 f"tools/audio/recitation.py --reciter {reciter} {key}")
    if args.reel:
        owner = {r["id"]: (r, ep) for path in episodes for ep in [load_yaml(path) or {}] for r in ep.get("reels", [])}
        if args.reel not in owner:
            report.error("content/episodes", f"reel '{args.reel}' does not exist")
        elif args.release:
            reel, ep = owner[args.reel]
            if not reel.get("validated_by"):
                report.error("content/episodes", f"reel '{args.reel}': script not validated by the owner (validated_by)")
            # The texts published with it (its own, and the episode's hashtags) are validated too.
            if not (reel.get("publish") or {}).get("validated_by"):
                report.error("content/episodes", f"reel '{args.reel}': publication texts not validated by the owner (publish.validated_by)")
            if not (ep.get("publish") or {}).get("validated_by"):
                report.error("content/episodes", f"episode '{ep.get('episode')}': publication texts and hashtags not validated by the owner (publish.validated_by)")

    if args.whole:
        found = [ep for path in episodes for ep in [load_yaml(path) or {}] if ep.get("episode") == args.whole]
        if not found:
            report.error("content/episodes", f"episode '{args.whole}' does not exist")
        elif args.release and found[0].get("whole") and not found[0]["whole"].get("validated_by"):
            report.error("content/episodes", f"episode '{args.whole}': whole-episode order and its own lines "
                                             "not validated by the owner (whole.validated_by)")

    for line in report.warnings + report.errors:
        print(line)
    print(f"\n{len(registry)} sources, {len(episodes)} episode(s): "
          f"{len(report.errors)} error(s), {len(report.warnings)} warning(s)")
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
