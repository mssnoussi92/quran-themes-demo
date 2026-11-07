#!/usr/bin/env python3
"""Check content/ against the JSON Schemas and the editorial rules in CLAUDE.md.

Usage:
  uv run --with jsonschema --with pyyaml scripts/validate.py            # draft mode
  uv run --with jsonschema --with pyyaml scripts/validate.py --release  # every cited source must be validated
  uv run --with jsonschema --with pyyaml scripts/validate.py --release --reel dua-01  # and that reel's script

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
    shown, heard = plain_words(prophet_words(src.get("text_ar") or "")), plain_words(rec["heard"])
    if shown != heard and rec["status"] != "validated":
        report.warn(where, f"recording: heard {len(heard)} words that differ from the {len(shown)} shown; listen to it")


def check_episode(path: Path, registry: dict, catalog: dict, backgrounds: dict, release: bool, report: Report) -> None:
    validator = Draft202012Validator(json.loads((ROOT / "schemas/episode.schema.json").read_text()))
    ep = load_yaml(path)
    if not schema_check(validator, ep, rel(path), report):
        return
    reels = {r["id"] for r in ep["reels"]}
    seen: set[str] = set()
    for scene in ep["scenes"]:
        where = f"{rel(path)} [{scene['id']}]"
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
                (report.error if release else report.warn)(where, f"source '{src['id']}' is not validated yet")
            if src is not None and src.get("recording", {}).get("status") == "proposed":
                (report.error if release else report.warn)(
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
        if "say_ar" in scene:
            if not narration.get("ar"):
                report.error(where, "say_ar needs narration.ar")
            elif spoken_words(scene["say_ar"]) != spoken_words(narration["ar"]):
                report.error(where, "say_ar must say the words of narration.ar (only a silent ة written ه may differ)")
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
            if ch["pose"] not in spec["poses"]:
                report.error(where, f"pose '{ch['pose']}' not in catalog for '{ch['id']}'")
            if ch["mood"] not in spec["moods"]:
                report.error(where, f"mood '{ch['mood']}' not in catalog for '{ch['id']}'")


ARABIC_MARKS = re.compile("[\u064b-\u0652\u0670\u0640]")


def spoken_words(text: str) -> list[str]:
    """Words of an Arabic line for comparing what is shown and what is said: no diacritics, no
    punctuation, ة and ه alike (a silent ة can be written ه for the voice)."""
    words = re.sub(r"[^\w\s]", " ", ARABIC_MARKS.sub("", text)).split()
    return [w.replace("ة", "ه") for w in words]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--release", action="store_true", help="fail on sources that are not validated")
    parser.add_argument("--reel", help="with --release: this reel's script must be validated by the owner (validated_by)")
    args = parser.parse_args()

    report = Report()
    policy = load_yaml(CONTENT / "policy.yaml") or {}
    catalog = (load_yaml(CONTENT / "characters.yaml") or {}).get("characters", {})
    backgrounds = (load_yaml(CONTENT / "backgrounds.yaml") or {}).get("backgrounds", {})
    registry = check_registry(report, policy)
    episodes = sorted((CONTENT / "episodes").glob("*.yaml"))
    for path in episodes:
        check_episode(path, registry, catalog, backgrounds, args.release, report)
    if args.reel:
        reels = {r["id"]: r for path in episodes for r in (load_yaml(path) or {}).get("reels", [])}
        if args.reel not in reels:
            report.error("content/episodes", f"reel '{args.reel}' does not exist")
        elif args.release and not reels[args.reel].get("validated_by"):
            report.error("content/episodes", f"reel '{args.reel}': script not validated by the owner (validated_by)")

    for line in report.warnings + report.errors:
        print(line)
    print(f"\n{len(registry)} sources, {len(episodes)} episode(s): "
          f"{len(report.errors)} error(s), {len(report.warnings)} warning(s)")
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
