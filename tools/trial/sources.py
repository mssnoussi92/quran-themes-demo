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
import subprocess
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


def entry_of(sid: str) -> dict:
    """A source a narration rests on (a report told, a tafsir): its registry entry, or stop. It needs no English text."""
    found = registry().get(sid)
    if found is None or found.get("status") == "excluded" or not found.get("text_ar"):
        sys.exit(f"error: {sid} is not a usable source of the registry (content/sources/)")
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


def passage(ids: list[str], out_dir: Path) -> dict:
    """Verses that follow one another, recited without a break (`verses:`): one cut of the reciter's surah, from the
    start of the first verse to the end of the last (a reciter who chains short verses leaves no silence to cut
    at), levelled like a verse. One verse segment: the verses written one after the other, each closed by the sign
    of the end of a verse with its number (a sign, not a word: it is never counted nor lit), the time of every word
    counted from the start of the passage, and where each verse starts and ends among the words (`verses`), so
    that the screen turns its pages between two verses and shows each translation under its own verse."""
    described_ = [described(sid) for sid in ids]
    if any(d["type"] != "ayah" for d in described_):
        sys.exit(f"error: a passage is made of verses: {', '.join(ids)}")
    refs = [entry(sid)["ref"] for sid in ids]
    if any((b["surah"], b["ayah"]) != (a["surah"], a["ayah"] + 1) for a, b in zip(refs, refs[1:])):
        sys.exit(f"error: the verses of a passage follow one another in one surah: {', '.join(ids)}")
    reciter = build.reciter_from_policy()
    WORK.mkdir(parents=True, exist_ok=True)
    cuts = [build.verse_cut(reciter, f"{r['surah']}:{r['ayah']}")[0] for r in refs]
    if any(abs(a["end"] - b["start"]) > 0.005 for a, b in zip(cuts, cuts[1:])):
        sys.exit(f"error: the cuts of {ids[0]} to {ids[-1]} do not touch in the reciter's file (tools/audio/recitation.py --set)")
    # The surah's file is downloaded by the cut of one verse; the passage is then cut from it in one piece.
    build.surah_cut({"id": name_of(ids[0]), "source": {"id": ids[0]}}, reciter, f"{refs[0]['surah']}:{refs[0]['ayah']}", WORK)
    surah = ROOT / "build" / "recitations" / reciter / build.verse_cut(reciter, f"{refs[0]['surah']}:{refs[0]['ayah']}")[1].rsplit("/", 1)[1]
    start, end = cuts[0]["start"], cuts[-1]["end"]
    name = f"{name_of(ids[0])}-{refs[-1]['ayah']}"
    raw = WORK / f"{name}.mp3"
    subprocess.run([build.ffmpeg_exe(), "-loglevel", "error", "-y", "-i", str(surah), "-af",
                          f"atrim=start={start:.3f}:end={end:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={max(0.0, end - start - 0.04):.3f}:d=0.04",
                          "-ac", "1", "-codec:a", "libmp3lame", "-qscale:a", "2", str(raw)], check=True)
    wav = out_dir / f"{name}.wav"
    build.level(raw, wav)
    words, verses, texts, position = [], [], [], 0
    for d, ref, cut in zip(described_, refs, cuts):
        first = position + 1
        for _, a, b in cut["words"]:
            position += 1
            words.append({"position": position, "start": round(cut["start"] - start + a, 3), "end": round(cut["start"] - start + b, 3)})
        verses.append({"en": d["display_en"], "first": first, "last": position})
        texts.append(f"{d['display_ar']} \u06dd{str(ref['ayah']).translate(DIGITS)}")
    origin = entry(ids[0]).get("origin") or {}
    span = f"{str(refs[0]['ayah']).translate(DIGITS)}-{str(refs[-1]['ayah']).translate(DIGITS)}"
    return {"kind": "verse", "seconds": round(build.seconds(wav), 3), "file": f"trial/{wav.name}",
            "reference": f"سورة {origin['surah_ar']} · الآيات {span}" if origin.get("surah_ar") else f"Quran {refs[0]['surah']}:{refs[0]['ayah']}-{refs[-1]['ayah']}",
            "text": " ".join(texts), "en": " ".join(d["display_en"] for d in described_), "words": words, "verses": verses,
            "credit": " · ".join(x for x in (RECITERS.get(reciter, reciter), described_[0]["translator"]) if x)}


REPORTED_BY = {"bukhari": ("البخاري", "al-Bukhari"), "muslim": ("مسلم", "Muslim"), "tirmidhi": ("الترمذي", "at-Tirmidhi")}


def references(ids: list[str]) -> dict:
    """What a narration rests on (`sources:`), as it is written on screen while it is said: the reports it tells in
    its own words (« رواه مسلم ٨٦٣ والبخاري ٩٣٦ ») and the tafsir its meaning comes from (its name, from
    content/policy.yaml). Never read nor shown: a reference. An unvalidated source is listed as proposed."""
    policy = yaml.safe_load((ROOT / "content" / "policy.yaml").read_text(encoding="utf-8")) or {}
    editions = (policy.get("tafsir") or {}).get("editions") or {}
    reports, tafsirs = [], []
    for sid in ids:
        e = registry().get(sid)
        if e is None or e.get("status") == "excluded" or not e.get("text_ar"):
            sys.exit(f"error: {sid} is not a source of the registry a narration can rest on (tools/trial/rules.py)")
        if e.get("status") != "validated" and f"source {sid}" not in proposed:
            proposed.append(f"source {sid}")
        ref = e["ref"]
        if e["type"] == "hadith":
            ar, en = REPORTED_BY[ref["collection"]]
            letter = chr(96 + ref["narration"]) if ref.get("narration") else ""
            reports.append((f"{ar} {str(ref['number']).translate(DIGITS)}", f"{en} {ref['number']}{letter}"))
        elif e["type"] == "tafsir":
            name = editions.get(ref["edition"])
            if not name:
                sys.exit(f"error: {sid}: tafsir « {ref['edition']} » is outside content/policy.yaml")
            if (name["ar"], name["en"]) not in tafsirs:
                tafsirs.append((name["ar"], name["en"]))
        else:
            sys.exit(f"error: {sid}: a narration rests on a hadith or a tafsir, not on a source of type « {e['type']} »")
    ar = [("رواه " + " و".join(a for a, _ in reports))] if reports else []
    en = [", ".join(b for _, b in reports)] if reports else []
    ar += [a for a, _ in tafsirs]
    en += [b for _, b in tafsirs]
    return {"ar": " · ".join(ar), "en": " · ".join(en), "ids": list(ids)}


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
