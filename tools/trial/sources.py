"""A verse or a hadith of the registry, ready for a video of the model (docs/model.md): its texts as they are
shown, its audio (the reciter's verse cut from his surah, the reader's hadith cut from the recording), levelled
like every other part, and for a verse the time of each recited word.

Before this module a short or a film could only quote what an old episode already quoted (`verses: <episode>`:
the texts prepared by video/scripts/prepare.ts, the audio built by tools/audio/build.py for that episode). The
first film keeps that path, so that its data stays what the owner validated. A file with no `verses` reads the
registry here: the same texts (content/sources/), the same cuts (content/recitations/<reciter>.json,
tools/audio/build.py), the same levelling.

Nothing is typed: a quote is an id of the registry. An excluded source, a source with no text, a verse with no
cut, a hadith with no recorded reading (outside a draft) stop the preparation. A source or a reading that the
owner has not validated yet is played and listed (`proposed`): they hear it in the videos they validate.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "audio"))
import build  # noqa: E402  (tools/audio/build.py: the cuts and the levelling of the episodes)

WORK = ROOT / "build" / "trial" / "sources"
RECITERS = {"alafasy": "Mishari Rashid al-Afasy", "sayegh": "Tawfiq As-Sayegh"}                 # as video/scripts/prepare.ts
COLLECTIONS = {"bukhari": "Sahih al-Bukhari", "muslim": "Sahih Muslim", "tirmidhi": "Jami' at-Tirmidhi"}
DIGITS = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")
READING_RATE = 48000
UNREAD = 12.0          # seconds given to a hadith with no reading yet, in a draft only

_registry: dict | None = None
proposed: list[str] = []      # what was played without the owner's validation yet (printed by the caller)


def registry() -> dict:
    global _registry
    if _registry is None:
        _registry = {}
        for path in sorted((ROOT / "content" / "sources").glob("*.yaml")):
            for entry in yaml.safe_load(path.read_text(encoding="utf-8")) or []:
                _registry[entry["id"]] = entry
    return _registry


def entry(sid: str) -> dict:
    found = registry().get(sid)
    if found is None:
        sys.exit(f"error: {sid} is not in the registry (content/sources/)")
    if found.get("status") == "excluded":
        sys.exit(f"error: {sid} is excluded from the registry")
    if not found.get("text_ar") or not found.get("text_en"):
        sys.exit(f"error: {sid} has no text: uv run --with ruamel.yaml tools/sources/fetch.py --only {sid}")
    if found.get("status") != "validated" and f"source {sid}" not in proposed:
        proposed.append(f"source {sid}")
    return found


def grade_note(e: dict) -> str | None:
    """« Al-Albani: Hasan Sahih »: the scholar's grade exactly as hadith-api gives it (`origin.grades`), or the
    registry's grade; none when the grade is the collection itself (Bukhari, Muslim). As video/scripts/prepare.ts."""
    by, grade = e.get("graded_by"), e.get("grade")
    if not by or not grade or by in COLLECTIONS.values():
        return None
    exact = next((g for g in (e.get("origin") or {}).get("grades") or [] if g["name"].lower() == by.lower()), None)
    return f"{exact['name']}: {exact['grade']}" if exact else f"{by}: {grade[0].upper()}{grade[1:]}"


def clean(text: str) -> str:
    return " ".join(text.replace("‏", "").split())


def described(sid: str) -> dict:
    """How a source is named and shown: its references, the text on screen, its translation, who is credited."""
    e = entry(sid)
    ref, origin = e["ref"], e.get("origin") or {}
    translator = origin.get("translator")
    if e["type"] == "ayah":
        return {"type": "ayah", "id": sid,
                "reference": f"سورة {origin['surah_ar']} · الآية {str(ref['ayah']).translate(DIGITS)}" if origin.get("surah_ar") else f"Quran {ref['surah']}:{ref['ayah']}",
                "reference_en": f"{'Surah ' + origin['surah_en'] if origin.get('surah_en') else 'Quran'} ({ref['surah']}:{ref['ayah']})",
                "display_ar": e["text_ar"], "display_en": e["text_en"], "translator": translator, "url": e.get("url"), "recording": None,
                "grade_note": None}
    if e["type"] != "hadith":
        sys.exit(f"error: {sid}: a source of type « {e['type']} » cannot be shown")
    name = COLLECTIONS.get(ref["collection"])
    if not name:
        sys.exit(f"error: {sid}: no display name for the collection « {ref['collection']} »")
    letter = chr(96 + ref["narration"]) if ref.get("narration") else ""
    text = e.get("excerpt_ar")
    if not text:                                  # the Prophet's words: from the first to the last quotation mark
        first, last = e["text_ar"].find('"'), e["text_ar"].rfind('"')
        if not 0 <= first < last:
            sys.exit(f"error: {sid}: no quotation marks in text_ar, cannot isolate the Prophet's words")
        text = e["text_ar"][first + 1:last]
    return {"type": "hadith", "id": sid, "reference": f"{name} {ref['number']}{letter}", "reference_en": f"{name} {ref['number']}{letter}",
            "display_ar": clean(text), "display_en": e.get("excerpt_en") or e["text_en"],
            "translator": translator if translator and translator != "Unknown" else None, "url": e.get("url"), "recording": e.get("recording"),
            "grade_note": grade_note(e)}


def name_of(sid: str) -> str:
    return sid.replace(".", "-")


def verse(sid: str, out_dir: Path) -> dict:
    """A verse segment: recited by the reciter of content/policy.yaml, cut from his surah, levelled."""
    d = described(sid)
    if d["type"] != "ayah":
        sys.exit(f"error: {sid} is not a verse")
    reciter = build.reciter_from_policy()
    WORK.mkdir(parents=True, exist_ok=True)
    key = sid.removeprefix("quran.").replace(".", ":")
    cut = build.surah_cut({"id": name_of(sid), "source": {"id": sid}}, reciter, key, WORK)
    wav = out_dir / f"{name_of(sid)}.wav"
    build.level(WORK / cut["file"], wav)
    return {"kind": "verse", "seconds": round(build.seconds(wav), 3), "file": f"trial/{wav.name}", "reference": d["reference"],
            "text": d["display_ar"], "en": d["display_en"], "words": cut["words"],
            "credit": " · ".join(x for x in (RECITERS.get(reciter, reciter), d["translator"]) if x)}


def reading(sid: str, out_dir: Path, draft: bool = False) -> dict:
    """A hadith segment: the Prophet's words read by a real voice (the registry's `recording`), levelled."""
    d = described(sid)
    if d["type"] != "hadith":
        sys.exit(f"error: {sid} is not a hadith")
    # Under a hadith of Tirmidhi, al-Albani's grade as it is recorded (the hadith policy; as on the old cards).
    shown = {"kind": "reading", "reference": " · ".join(x for x in (d["reference"], d["grade_note"]) if x), "text": d["display_ar"], "en": d["display_en"]}
    rec = d["recording"]
    if not rec:
        if not draft:
            sys.exit(f"error: {sid} has no recorded reading (skill find-hadith-recording): the synthetic voice does not read a hadith here")
        proposed.append(f"reading of {sid}: none yet ({UNREAD:.0f} s kept for it)")
        return {**shown, "seconds": UNREAD, "file": None, "credit": " · ".join(x for x in ("Reading: to be found", d["translator"]) if x)}
    if rec.get("status") != "validated":
        proposed.append(f"reading of {sid} by {rec['reader']}")
    WORK.mkdir(parents=True, exist_ok=True)
    clip = build.reading_clip(rec, sid, WORK, READING_RATE)
    levelled = clip.with_suffix(".level.wav")
    build.level(clip, levelled, build.LEVEL["reading"])
    wav = out_dir / f"{name_of(sid)}.wav"
    shutil.copyfile(levelled, wav)
    return {**shown, "seconds": round(build.seconds(wav), 2), "file": f"trial/{wav.name}",
            "credit": " · ".join(x for x in (f"Reading: {rec['reader']}", d["translator"]) if x)}
