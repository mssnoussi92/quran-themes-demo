#!/usr/bin/env python3
"""Check content/ against the JSON Schemas and the editorial rules in CLAUDE.md.

Usage:
  uv run --with jsonschema --with pyyaml scripts/validate.py            # draft mode
  uv run --with jsonschema --with pyyaml scripts/validate.py --release  # every cited source must be validated

Exit code 1 when there is at least one error. Warnings never fail the run.
"""
from __future__ import annotations

import argparse
import json
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


def check_registry(report: Report, policy: dict) -> dict[str, dict]:
    validator = Draft202012Validator(json.loads((ROOT / "schemas/source.schema.json").read_text()))
    allowed = set(policy.get("hadith", {}).get("collections", []))
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
    return registry


def check_episode(path: Path, registry: dict, catalog: dict, release: bool, report: Report) -> None:
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


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--release", action="store_true", help="fail on sources that are not validated")
    args = parser.parse_args()

    report = Report()
    policy = load_yaml(CONTENT / "policy.yaml") or {}
    catalog = (load_yaml(CONTENT / "characters.yaml") or {}).get("characters", {})
    registry = check_registry(report, policy)
    episodes = sorted((CONTENT / "episodes").glob("*.yaml"))
    for path in episodes:
        check_episode(path, registry, catalog, args.release, report)

    for line in report.warnings + report.errors:
        print(line)
    print(f"\n{len(registry)} sources, {len(episodes)} episode(s): "
          f"{len(report.errors)} error(s), {len(report.warnings)} warning(s)")
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
