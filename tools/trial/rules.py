#!/usr/bin/env python3
"""Check the files of the film-and-shorts model against the rules (docs/model.md), before any voice or render.

  uv run --with pyyaml python3 tools/trial/rules.py [--film <id> | --all] [--draft] [--root <dir>]

--all: every film file of content/trial/ (a file with `chapters`) and the shorts of its `thumbnail.panels`, and
every series (a file with `shorts` and no chapters: shorts that stand alone, no film). --film takes either.
--draft: a hadith with no recorded reading is a warning, not an error (before the voice, the reading may
still be searched for). A short with no clip yet is a warning (the script goes to the owner before the pictures,
and tools/trial/prepare.py stops without one); in a short whose videos are validated it is an error.
--root: the directory holding content/ (the tests point it at a copy).

One line per finding, `error|warning|info <file>: <what>`, then a summary per film; exit code 1 when there
is an error. What no code can check (a person drawn, the unseen pictured, the first frame, the sound of the
voice) is listed at the end, to check by eye.

Errors: a quoted id absent from the registry, excluded, without text or of the wrong type; a hadith outside
content/policy.yaml; a reading with no recording; a verse with no cut in the reciter's file; what a narration
rests on (`sources:` of a narration segment: the report it tells in its own words, the tafsir its meaning comes
from; written on screen as a reference, never read) when it is not a hadith of the policy or the passage of a
tafsir of the policy about a verse recited in that short; the synthetic
voice saying a quote (four words in a row of a verse of the registry, in its Uthmani or its everyday spelling,
or of a hadith quoted in that file; a net, not a proof: a line is still read by a person);
a voice text that differs from the lines; a broken `reuse`, `lines` or `subscribe` in a film; a missing
field; an empty line; a YouTube title over 100 characters; a sign shown on screen that the font of its text
has no glyph for (video/public/fonts/).
Warnings: a word of content/dialect.yaml or of content/wording.yaml; a first phrase of one word; an
English line over 125 characters (in a file whose videos the owner has not validated yet); a short over 2:05 (the estimate of tools/trial/script.py); a short with no
ambience; a source or a reading not validated yet. Info: what the owner has not validated yet.
"""
from __future__ import annotations

import argparse
import itertools
import json
import re
import struct
import sys
import unicodedata
from functools import lru_cache
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import script  # noqa: E402  (the estimate of the length: its constants and `spoken`, not copied here)
# The hadith policy is read from content/policy.yaml the way scripts/validate.py reads it (check_grade); it is
# mirrored here, not imported: validate.py needs jsonschema, this tool runs with PyYAML alone.

REPO = Path(__file__).resolve().parents[2]
QUOTE_RUN = 4                  # words in a row that make a quotation said by the voice
MAX_EN = 125                   # characters of an English line (two rows of subtitles)
MAX_SHORT = 125.0              # seconds: 2:05
MAX_FILM = 600.0               # seconds: the film lasts under 10 minutes
MAX_TITLE = 100                # YouTube
MIN_FIRST_PHRASE = 2           # words: the first frame shows only the first phrase (« بنقول: » alone was the fault seen)

TO_CHECK_BY_EYE = [
    "nobody is drawn (no person, not the boy, his parents, a prophet): things and places only",
    "the unseen is never pictured (paradise, hell, the Day of Judgement, angels)",
    "the first frame: the strangest fact of the story, written large, readable at once",
    "what the voice sounds like: the take is listened to, mispronounced words are reported to the owner",
]

# ---- Arabic text, folded so that two spellings of a word compare equal --------------------------------------

MARKS = re.compile("[ؐ-ًؚ-ٰٟۖ-ۭـ]")
LETTERS = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ة": "ه", "ى": "ي", "ؤ": "و", "ئ": "ي", "ء": None})
NOT_LETTER = re.compile("[^ا-ي]+")


def fold(text: str) -> str:
    """No diacritics or Quranic marks, alef with hamza as alef, ta marbuta as ha, alef maqsura as ya, hamza dropped."""
    return MARKS.sub("", text).translate(LETTERS)


def words_of(text: str) -> list[str]:
    """The folded words of a text, punctuation and anything that is not an Arabic letter taken out."""
    return NOT_LETTER.sub(" ", fold(text)).split()


def whole(pattern: str) -> re.Pattern:
    return re.compile(rf"(?<![ا-ي])(?:{fold(pattern)})(?![ا-ي])")


def prophet_words(text_ar: str) -> str:
    """What a hadith card shows by default: from the first to the last quotation mark (as scripts/validate.py)."""
    first, last = text_ar.find('"'), text_ar.rfind('"')
    return text_ar[first + 1:last] if 0 <= first < last else ""


def shown_words(src: dict) -> str:
    return src.get("excerpt_ar") or prophet_words(src.get("text_ar") or "")


# What every line says of the Prophet ﷺ or of a Companion, as a report says it too: not a quotation of the report.
FORMULA = re.compile("صلي الله عليه وسلم|رضي الله عنهما|رضي الله عنها|رضي الله عنهم|رضي الله عنه|عليه السلام|عز وجل")


def stamp(seconds: float) -> str:
    return f"{int(seconds // 60)}:{int(seconds % 60):02d}"


# ---- The repository -------------------------------------------------------------------------------------------

# ---- a glyph for every sign shown ------------------------------------------------------------------------------
# A sign the font of its text does not have is drawn by whatever font the machine has: a pixel font in a session,
# an empty box on a GitHub runner (« ﷺ » in an English line of the du'a film, 2026-11-11). The fonts are those of
# video/src/fonts.ts; in an English text, what Lora lacks is drawn with Amiri (`ENGLISH`, video/src/trial/Trial.tsx):
# « ﷺ », the dotted letters of a transliteration.

FONTS = REPO / "video" / "public" / "fonts"
FACE = {"quran": ("AmiriQuran-Regular.ttf",), "lines": ("Amiri-Bold.ttf",), "arabic": ("Amiri-Regular.ttf",),
        "latin": ("Lora.ttf", "Amiri-Regular.ttf")}


@lru_cache(maxsize=None)
def codepoints(font: str) -> frozenset[int]:
    """The characters a font file has a glyph for: its `cmap` table, formats 4 and 12 (read here so that this
    tool keeps running with PyYAML alone; the same sets as fontTools on the four fonts)."""
    data = (FONTS / font).read_bytes()
    count = struct.unpack(">H", data[4:6])[0]
    tables = {data[12 + 16 * i:16 + 16 * i]: struct.unpack(">I", data[20 + 16 * i:24 + 16 * i])[0] for i in range(count)}
    at = tables[b"cmap"]
    found: set[int] = set()
    for i in range(struct.unpack(">H", data[at + 2:at + 4])[0]):
        base = at + struct.unpack(">I", data[at + 8 + 8 * i:at + 12 + 8 * i])[0]
        kind = struct.unpack(">H", data[base:base + 2])[0]
        if kind == 4:
            n = struct.unpack(">H", data[base + 6:base + 8])[0] // 2
            ends = struct.unpack(f">{n}H", data[base + 14:base + 14 + 2 * n])
            starts = struct.unpack(f">{n}H", data[base + 16 + 2 * n:base + 16 + 4 * n])
            deltas = struct.unpack(f">{n}H", data[base + 16 + 4 * n:base + 16 + 6 * n])
            ranges_at = base + 16 + 6 * n
            ranges = struct.unpack(f">{n}H", data[ranges_at:ranges_at + 2 * n])
            for k in range(n):
                for c in range(starts[k], ends[k] + 1):
                    if ranges[k] == 0:
                        glyph = (c + deltas[k]) & 0xFFFF
                    else:
                        where = ranges_at + 2 * k + ranges[k] + 2 * (c - starts[k])
                        glyph = struct.unpack(">H", data[where:where + 2])[0]
                    if glyph and c != 0xFFFF:
                        found.add(c)
        elif kind == 12:
            for g in range(struct.unpack(">I", data[base + 12:base + 16])[0]):
                first, last, glyph = struct.unpack(">III", data[base + 16 + 12 * g:base + 28 + 12 * g])
                found.update(c for c in range(first, last + 1) if glyph + c - first)
    return frozenset(found)


def no_glyph(text: str, face: str) -> list[str]:
    """The signs of a text that none of its fonts can draw, each with its code."""
    fonts = FACE[face]
    return [f"« {c} » U+{ord(c):04X}" for c in dict.fromkeys(str(text))
            if not (c.isspace() or unicodedata.category(c) in ("Cf", "Cc") or any(ord(c) in codepoints(f) for f in fonts))]


class Repo:
    def __init__(self, root: Path):
        self.root = root
        self.content = root / "content"
        self.policy = self.yaml("policy.yaml") or {}
        self.dialect = [w for w in (self.yaml("dialect.yaml") or {}).get("words", {})]
        self.refused = (self.yaml("wording.yaml") or {}).get("refused", [])
        self.sources: dict[str, dict] = {}
        for path in sorted((self.content / "sources").glob("*.yaml")):
            for entry in yaml.safe_load(path.read_text(encoding="utf-8")) or []:
                self.sources[entry["id"]] = entry
        cuts = json.loads((self.content / "recitations" / f"{self.policy.get('quran', {}).get('reciter', 'sayegh')}.json").read_text(encoding="utf-8"))
        self.cuts = cuts.get("verses", cuts)
        # Every word of every verse of the registry, as runs of QUOTE_RUN words: which verse says them.
        self.verse_runs: dict[tuple, str] = {}
        for sid, src in self.sources.items():
            if src.get("type") == "ayah" and src.get("text_ar"):
                plain, spelled = words_of(src["text_ar"]), words_of(dagger_as_alef(src["text_ar"]))
                add_runs(self.verse_runs, plain, sid, spelled if len(spelled) == len(plain) else None)
        self.dialect_re = [(w, whole(f"[وف]?{fold(w)}")) for w in self.dialect]
        self.refused_re = [(r, [whole(p) for p in r["patterns"]]) for r in self.refused]

    def yaml(self, name: str):
        path = self.content / name
        return yaml.safe_load(path.read_text(encoding="utf-8")) if path.exists() else None

    def rel(self, path: Path) -> str:
        return str(path.relative_to(self.root))


def add_runs(into: dict, words: list[str], owner: str, other: list[str] | None = None) -> None:
    """Every run of QUOTE_RUN words of a text. `other`: a second spelling of the same words, one for one (a verse
    in Uthmani script, its dagger alefs written as alefs): every mix of the two spellings is a run too."""
    for i in range(len(words) - QUOTE_RUN + 1):
        forms = [{words[k]} | ({other[k]} if other else set()) for k in range(i, i + QUOTE_RUN)]
        for run in itertools.product(*forms):
            into.setdefault(run, owner)


def dagger_as_alef(text: str) -> str:
    return text.replace("\u0640\u0670", "ا").replace("\u0670", "ا")


class Findings:
    def __init__(self) -> None:
        self.items: list[tuple[str, str, str]] = []

    def add(self, level: str, file: str, what: str) -> None:
        self.items.append((level, file, what))

    def error(self, file: str, what: str) -> None:
        self.add("error", file, what)

    def warn(self, file: str, what: str) -> None:
        self.add("warning", file, what)

    def info(self, file: str, what: str) -> None:
        self.add("info", file, what)

    def count(self, level: str) -> int:
        return sum(1 for item in self.items if item[0] == level)


def get(data, path: str):
    for key in path.split("."):
        if not isinstance(data, dict) or data.get(key) in (None, "", [], {}):
            return None
        data = data[key]
    return data


# ---- One file -------------------------------------------------------------------------------------------------

class Checker:
    def __init__(self, repo: Repo, out: Findings, draft: bool):
        self.repo, self.out, self.draft = repo, out, draft
        self.delivered = False                    # the file being read has videos the owner validated: its lines are settled
        self.unvalidated: list[str] = []          # what is quoted and not validated yet (one line per film)

    # -- quotes
    def quoted(self, file: str, sid: str, kind: str) -> dict | None:
        """The registry entry of a `verse:` or a `reading:`, or an error."""
        src = self.repo.sources.get(sid)
        want = "ayah" if kind == "verse" else "hadith"
        if src is None:
            self.out.error(file, f"{kind} {sid} is not in the registry (content/sources/)")
            return None
        if src.get("status") == "excluded":
            self.out.error(file, f"{kind} {sid} is excluded from the registry")
            return None
        if src.get("type") != want:
            self.out.error(file, f"{kind} {sid} is a source of type « {src.get('type')} », a {kind} needs type « {want} »")
            return None
        if not src.get("text_ar") or not src.get("text_en"):
            self.out.error(file, f"{kind} {sid} has no text in the registry (tools/sources/fetch.py)")
            return None
        if src.get("status") != "validated" and f"source {sid}" not in self.unvalidated:
            self.unvalidated.append(f"source {sid}")
        if kind == "verse":
            ref = src["ref"]
            if f"{ref['surah']}:{ref['ayah']}" not in self.repo.cuts:
                self.out.error(file, f"verse {sid} has no cut in the reciter's file (content/recitations/)")
            self.glyphs(file, src["text_ar"], "quran", f"verse {sid}")
        else:
            self.hadith(file, sid, src)
            self.glyphs(file, src.get("excerpt_ar") or src["text_ar"], "arabic", f"reading {sid}")
        self.glyphs(file, src.get("excerpt_en") or src["text_en"], "latin", f"{kind} {sid}, its translation")
        return src

    def passage(self, file: str, ids, upto=None) -> set[str]:
        """`verses:` verses that follow one another in a surah, recited without a break: one cut, from the start of
        the first to the end of the last (a reciter who chains short verses leaves no silence to cut at).
        `upto: N` cuts one verse after its Nth word: it is the only case of a `verses` list of one verse."""
        if upto is not None:
            if not isinstance(ids, list) or len(ids) != 1:
                self.out.error(file, f"`upto` cuts one verse after its Nth word: `verses` must list exactly one verse, not {ids}")
                return set()
            if not isinstance(upto, int) or isinstance(upto, bool) or upto < 1:
                self.out.error(file, f"`upto: {upto}` is the number of recited words kept, an integer from 1")
                return set()
        elif not isinstance(ids, list) or len(ids) < 2:
            self.out.error(file, f"`verses` is a list of two verses or more (one verse: `verse:`): {ids}")
            return set()
        srcs = [self.quoted(file, sid, "verse") for sid in ids]
        if not all(srcs):
            return set()
        refs = [(x["ref"]["surah"], x["ref"]["ayah"]) for x in srcs]
        keys = [f"{su}:{ay}" for su, ay in refs]
        if any(b != (a[0], a[1] + 1) for a, b in zip(refs, refs[1:])):
            self.out.error(file, f"verses {', '.join(keys)}: a passage is made of verses that follow one another in one surah")
        cuts = [self.repo.cuts.get(k) for k in keys]
        if upto is not None:
            timed = (cuts[0] or {}).get("words") or []
            words = [t for t in srcs[0]["text_ar"].split() if script.is_word(t)]
            if timed and upto > len(timed):
                self.out.error(file, f"`upto: {upto}`: verse {keys[0]} has {len(timed)} recited words")
            elif not script.stops_after(srcs[0]["text_ar"], upto):
                # A cut must end a whole sentence: the reciter stops at a pause sign, not in the middle of one.
                at = words[upto - 1] if upto <= len(words) else "?"
                self.out.warn(file, f"`upto: {upto}` of {keys[0]}: word {upto} (« {at} ») is not followed by a pause sign (ۖ ۗ ۚ ۛ ۘ ۙ ۜ): "
                                    "the cut would end in the middle of a sentence")
        if all(cuts) and any(abs(a["end"] - b["start"]) > 0.005 for a, b in zip(cuts, cuts[1:])):
            self.out.error(file, f"verses {keys[0]} to {keys[-1]}: their cuts do not touch in the reciter's file "
                                 "(each ends where the next starts: tools/audio/recitation.py --set)")
        return set(keys)

    def in_policy(self, file: str, sid: str, src: dict, kind: str = "reading") -> bool:
        """A hadith of a collection of the policy, with the grade the policy asks of that collection."""
        policy = (self.repo.policy.get("hadith") or {})
        ref = src["ref"]
        if ref["collection"] not in (policy.get("collections") or []):
            self.out.error(file, f"{kind} {sid}: collection « {ref['collection']} » is outside content/policy.yaml")
            return False
        rule = (policy.get("graded") or {}).get(ref["collection"])
        if rule:      # as scripts/validate.py check_grade: the grade of this scholar, in origin.grades, must be accepted
            by = rule["by"]
            grades = [g["grade"] for g in (src.get("origin") or {}).get("grades", []) if g["name"].lower() == by.lower()]
            if not grades:
                self.out.error(file, f"{kind} {sid}: no grade by {by} in the registry (content/policy.yaml asks for one)")
                return False
            if grades[0] not in rule["accept"]:
                self.out.error(file, f"{kind} {sid}: {by} grades it « {grades[0]} », outside content/policy.yaml")
                return False
        return True

    def hadith(self, file: str, sid: str, src: dict) -> None:
        if not self.in_policy(file, sid, src):
            return
        rec = src.get("recording")
        if not rec:
            (self.out.warn if self.draft else self.out.error)(file, f"reading {sid} has no recording in the registry (skill find-hadith-recording)")
        elif rec.get("status") != "validated" and f"reading of {sid}" not in self.unvalidated:
            self.unvalidated.append(f"reading of {sid}")

    def rests_on(self, file: str, seg: dict, recited: set[str], told: dict) -> None:
        """`sources:` of a narration segment: what its lines rest on, written on screen as a reference and listed in
        the description, never read. A hadith of the policy (the report the narration tells in its own words: its
        words go to `told`, so that the voice saying four of them in a row is refused) or the passage of a tafsir
        of the policy about a verse recited in this short (where the meaning said comes from), or a `science` source
        (a paper or a dataset the claim rests on: it needs its label, no text and no recited verse)."""
        where = f"narration {seg.get('narration')}"
        listed = seg.get("sources")
        if not isinstance(listed, list) or not listed or any(not isinstance(i, str) for i in listed):
            self.out.error(file, f"{where}: `sources` is a list of ids of the registry")
            return
        for sid in listed:
            src = self.repo.sources.get(sid)
            if src is None:
                self.out.error(file, f"{where}: source {sid} is not in the registry (content/sources/)")
                continue
            if src.get("status") == "excluded":
                self.out.error(file, f"{where}: source {sid} is excluded from the registry")
                continue
            if src.get("type") == "science":
                # A paper or a dataset: no text, only the label written on screen (and the line of the description).
                label = src.get("label") or {}
                if not label.get("ar") or not label.get("en"):
                    self.out.error(file, f"{where}: science source {sid} has no label.ar / label.en in the registry")
                elif src.get("status") != "validated" and f"source {sid}" not in self.unvalidated:
                    self.unvalidated.append(f"source {sid}")
                continue
            if not src.get("text_ar"):
                self.out.error(file, f"{where}: source {sid} has no text in the registry (tools/sources/fetch.py)")
                continue
            if src.get("type") == "hadith":
                if not self.in_policy(file, sid, src, "source"):
                    continue
                for piece in FORMULA.split(fold(src["text_ar"])):       # the words of the report, its formulas apart
                    add_runs(told, words_of(piece), sid)
            elif src.get("type") == "tafsir":
                ref = src["ref"]
                if ref["edition"] not in ((self.repo.policy.get("tafsir") or {}).get("editions") or {}):
                    self.out.error(file, f"{where}: source {sid}: tafsir « {ref['edition']} » is outside content/policy.yaml")
                    continue
                about = set((src.get("origin") or {}).get("verses") or []) | {f"{ref['surah']}:{ref['ayah']}"}
                if not about & recited:
                    self.out.error(file, f"{where}: source {sid} explains {', '.join(sorted(about))}, which this short does not recite")
                    continue
            else:
                self.out.error(file, f"{where}: source {sid} is of type « {src.get('type')} »: a narration rests on a hadith or a tafsir, or on a science source (a verse is recited: `verse:`)")
                continue
            if src.get("status") != "validated" and f"source {sid}" not in self.unvalidated:
                self.unvalidated.append(f"source {sid}")

    def glyphs(self, file: str, text, face: str, what: str) -> None:
        missing = no_glyph(text or "", face)
        if missing:
            self.out.error(file, f"{what}: no glyph for {', '.join(missing)} in {' or '.join(FACE[face])}; the machine's own font would draw it (a box on a runner)")

    # -- text
    def narration_lines(self, file: str, lines: list[dict], where: str, quotes: dict, quoted_by: str = "") -> None:
        """The checks of every narration line: not empty, no quotation, no refused or standard-Arabic word."""
        for line in lines:
            ar, en = line.get("ar"), line.get("en")
            if not ar or not str(ar).strip() or not en or not str(en).strip():
                self.out.error(file, f"{where}: a narration line with an empty ar or en: « {ar or ''} » / « {en or ''} »")
                continue
            self.said_quote(file, ar, quotes)
            self.glyphs(file, ar, "lines", f"{where}, « {ar} »")
            self.glyphs(file, en, "latin", f"{where}, « {en} »")
            if not line.get("kept"):
                self.dialect(file, ar)
            self.wording(file, ar)
            if len(en) > MAX_EN and not self.delivered:
                self.out.warn(file, f"English line of {len(en)} characters (over {MAX_EN}): « {en} »")

    def said_quote(self, file: str, ar: str, quotes: dict) -> None:
        words = words_of(ar)
        for source_of in (self.repo.verse_runs, quotes):
            hits = [i for i in range(len(words) - QUOTE_RUN + 1) if tuple(words[i:i + QUOTE_RUN]) in source_of]
            if not hits:
                continue
            start = hits[0]
            end = start + QUOTE_RUN
            while end < len(words) and (end - QUOTE_RUN + 1) in hits:
                end += 1
            sid = source_of[tuple(words[start:start + QUOTE_RUN])]
            self.out.error(file, f"the synthetic voice says {end - start} words of {sid} ({' '.join(words[start:end])}) in the line « {ar} »")
            return

    def dialect(self, file: str, ar: str) -> None:
        text = " ".join(words_of(re.sub(r"«[^»]*»", " ", ar)))
        found = [w for w, pattern in self.repo.dialect_re if pattern.search(text)]
        if found:
            self.out.warn(file, f"standard Arabic in an Egyptian line (content/dialect.yaml: {', '.join(found)}): « {ar} »")

    def wording(self, file: str, text: str, label: str = "") -> None:
        folded = " ".join(words_of(text))
        for entry, patterns in self.repo.refused_re:
            if entry.get("where") == "narration" and label:     # a turn refused in what the voice says, not on a cover
                continue
            if any(p.search(folded) for p in patterns):
                self.out.warn(file, f"refused wording « {entry['id']} » (content/wording.yaml; write {entry['instead']}) in {label or 'the line'} « {text} »")

    def title_length(self, file: str, title: dict | None, what: str) -> None:
        if isinstance(title, dict) and title.get("en") and title.get("ar"):
            joined = f"{title['en']} · {title['ar']}"
            if len(joined) > MAX_TITLE:
                self.out.error(file, f"{what}: YouTube title of {len(joined)} characters (over {MAX_TITLE}): « {joined} »")

    def required(self, file: str, spec: dict, paths: list[str]) -> None:
        for path in paths:
            if get(spec, path) is None:
                self.out.error(file, f"missing field `{path}`")

    def voice_text(self, file: str, spec: dict, lines: list[dict]) -> None:
        name = spec.get("text")
        if not name:
            return
        path = self.repo.content / "voice-test" / f"{name}.txt"
        if not path.exists():
            self.out.error(file, f"voice text content/voice-test/{name}.txt does not exist")
            return
        rows = [l.rstrip("\n") for l in path.read_text(encoding="utf-8").splitlines()]
        said = [l.strip() for l in rows if l.strip() and not l.startswith("#")]
        want = [str(l.get("ar", "")) for l in lines]
        first = next((l for l in rows if l.strip()), "")
        if not first.startswith("# style:"):
            self.out.warn(file, f"voice text {name}.txt does not start with a « # style: » line")
        if said != want:
            at = next((i for i in range(min(len(said), len(want))) if said[i] != want[i]), min(len(said), len(want)))
            heard = said[at] if at < len(said) else "(nothing)"
            seen = want[at] if at < len(want) else "(nothing)"
            self.out.error(file, f"voice text {name}.txt differs from the lines of the file ({len(said)} lines against {len(want)}); "
                                 f"first difference at line {at + 1}: voice « {heard} », file « {seen} »")

    # -- a short
    def short(self, path: Path) -> dict | None:
        file = self.repo.rel(path)
        spec = yaml.safe_load(path.read_text(encoding="utf-8"))
        self.required(file, spec, ["id", "text", "segments", "cover.title", "publish.title.ar", "publish.title.en",
                                   "publish.description.ar", "publish.description.en", "publish.part"])
        if not spec.get("clip") and not spec.get("validated"):      # the script and the voice come before the pictures
            self.out.warn(file, "no `clip` yet: the pictures come after the script (tools/trial/clip.py, shown to the owner)")
        else:
            if get(spec, "clip.source") == "generated":       # synthesized by tools/trial/clip.py: no author, no page
                self.required(file, spec, ["clip.kind", "clip.seconds"])
            else:
                self.required(file, spec, ["clip.source", "clip.id", "clip.author", "clip.page"])
        segments = spec.get("segments") or []
        self.delivered = bool(spec.get("validated"))
        hadiths, recited = {}, set()
        for seg in segments:
            if "verse" in seg:
                src = self.quoted(file, seg["verse"], "verse")
                if src:
                    recited.add(f"{src['ref']['surah']}:{src['ref']['ayah']}")
            if "verses" in seg:
                recited |= self.passage(file, seg["verses"], seg.get("upto"))
            elif "upto" in seg:
                self.out.error(file, "`upto` is for a `verses` segment of one verse")
            if "reading" in seg:
                src = self.quoted(file, seg["reading"], "reading")
                if src:
                    add_runs(hadiths, words_of(shown_words(src)), seg["reading"])
        for seg in segments:
            if "sources" in seg:
                if "narration" in seg:
                    self.rests_on(file, seg, recited, hadiths)
                else:
                    self.out.error(file, f"`sources` on a segment that is not a narration: {seg_name(seg)}")
        lines = []
        for seg in segments:
            if "narration" in seg:
                self.narration_lines(file, seg.get("lines") or [], f"narration {seg['narration']}", hadiths)
                lines += seg.get("lines") or []
        self.voice_text(file, spec, lines)
        first = next(iter(lines), None)
        if first:
            phrase = [p for p in script.PHRASE_CUT.split(first["ar"].strip()) if p][0]
            n = len(phrase.split())
            if n < MIN_FIRST_PHRASE:
                self.out.warn(file, f"the first phrase of the first line has {n} word(s), the first frame would show only « {phrase} »")
        for label, text in (("cover title", get(spec, "cover.title")), ("cover tag", get(spec, "cover.tag")),
                            ("title", get(spec, "publish.title.ar")), ("description", get(spec, "publish.description.ar"))):
            if text:
                self.wording(file, text, label)
        self.title_length(file, get(spec, "publish.title"), "short")
        seconds = self.estimate_short(spec)
        if seconds > MAX_SHORT:
            self.out.warn(file, f"estimated {stamp(seconds)}, over {stamp(MAX_SHORT)}: a short that long says two ideas; keep one")
        if not spec.get("ambience"):
            self.out.warn(file, "no `ambience`: nothing plays under the narration")
        self.validation(file, spec)
        return spec

    def validation(self, file: str, spec: dict) -> None:
        missing = [k for k in ("script_validated", "validated") if not spec.get(k)]
        if missing:
            self.out.info(file, "not validated by the owner yet: " + ", ".join(missing))

    # -- estimates (tools/trial/script.py: the same constants and the same `spoken`)
    def seconds_of(self, seg: dict) -> float:
        if "verses" in seg:
            keys = []
            for sid in seg["verses"] if isinstance(seg["verses"], list) else []:
                ref = (self.repo.sources.get(sid) or {}).get("ref") or {}
                keys.append(f"{ref.get('surah')}:{ref.get('ayah')}")
            cuts = [self.repo.cuts.get(k) for k in keys]
            if cuts and all(cuts) and isinstance(seg.get("upto"), int) and len(cuts) == 1:
                # Cut at word N: the time of the words kept (the reciter's own timing), else in proportion to them.
                timed = cuts[0].get("words") or []
                if timed:
                    return timed[min(seg["upto"], len(timed)) - 1][2]
                total = len((self.repo.sources.get(seg["verses"][0]) or {}).get("text_ar", "").split()) or seg["upto"]
                return cuts[0]["seconds"] * min(1.0, seg["upto"] / total)
            return cuts[-1]["end"] - cuts[0]["start"] if cuts and all(cuts) else 0.0
        if "verse" in seg:
            src = self.repo.sources.get(seg["verse"]) or {}
            ref = src.get("ref") or {}
            cut = self.repo.cuts.get(f"{ref.get('surah')}:{ref.get('ayah')}")
            return cut["seconds"] if cut else 0.0
        if "reading" in seg:
            rec = (self.repo.sources.get(seg["reading"]) or {}).get("recording")
            return rec["end"] - rec["start"] if rec else script.UNKNOWN_READING
        return script.spoken(seg.get("lines") or [])

    def estimate_short(self, spec: dict) -> float:
        t = script.LEAD
        for seg in spec.get("segments") or []:
            t += self.seconds_of(seg) + script.GAP
        return t - script.GAP + script.TAIL

    # -- a series: shorts that stand alone, no film
    def series(self, path: Path, spec: dict) -> tuple[dict, dict]:
        file = self.repo.rel(path)
        self.required(file, spec, ["id", "title", "shorts", "publish.series", "publish.hashtags", "publish.narration"])
        shorts: dict[str, dict] = {}
        for name in spec.get("shorts") or []:
            short_path = path.parent / f"{name}.yaml"
            if not short_path.exists():
                self.out.error(file, f"shorts: the short « {name} » has no file content/trial/{name}.yaml")
                continue
            shorts[name] = self.short(short_path)
        if get(spec, "title.ar"):
            self.wording(file, get(spec, "title.ar"), "series title")
        return spec, shorts

    # -- a film
    def film(self, path: Path) -> tuple[dict, dict]:
        file = self.repo.rel(path)
        spec = yaml.safe_load(path.read_text(encoding="utf-8"))
        if "chapters" not in spec and "shorts" in spec:
            return self.series(path, spec)
        self.required(file, spec, ["id", "title", "text", "chapters", "thumbnail.panels", "publish.title",
                                   "publish.series", "publish.hashtags", "publish.narration"])
        shorts: dict[str, dict] = {}
        for name in get(spec, "thumbnail.panels") or []:
            short_path = path.parent / f"{name}.yaml"
            if not short_path.exists():
                self.out.error(file, f"thumbnail.panels: the short « {name} » has no file content/trial/{name}.yaml")
                continue
            shorts[name] = self.short(short_path)
        self.delivered = bool(spec.get("validated"))      # after the shorts: each sets it for itself
        hadiths, own = {}, []
        for chapter in spec.get("chapters") or []:
            for seg in chapter.get("segments") or []:
                if "verse" in seg:
                    self.quoted(file, seg["verse"], "verse")
                if "reading" in seg:
                    src = self.quoted(file, seg["reading"], "reading")
                    if src:
                        add_runs(hadiths, words_of(shown_words(src)), seg["reading"])
        for chapter in spec.get("chapters") or []:
            title = chapter.get("title") or {}
            if not title.get("ar") or not title.get("en"):
                self.out.error(file, f"chapter « {chapter.get('id')} » has no title.ar / title.en")
            else:
                self.wording(file, title["ar"], f"chapter title « {chapter.get('id')} »")
            for seg in chapter.get("segments") or []:
                where = f"chapter {chapter.get('id')}"
                if seg.get("subscribe") and "reuse" not in seg and "narration" not in seg:
                    self.out.error(file, f"{where}: `subscribe: true` on a segment that is not a narration or a reuse: {seg_name(seg)}")
                if "reuse" in seg:
                    self.reuse(file, where, seg, shorts)
                elif "narration" in seg:
                    self.narration_lines(file, seg.get("lines") or [], f"{where}, narration {seg['narration']}", hadiths)
                    own += seg.get("lines") or []
        self.voice_text(file, spec, own)
        for label, text in (("film title", get(spec, "title.ar")), ("thumbnail title", get(spec, "thumbnail.title")),
                            ("thumbnail tag", get(spec, "thumbnail.tag")), ("title", get(spec, "publish.title.ar")),
                            ("description", get(spec, "publish.description.ar"))):
            if text:
                self.wording(file, text, label)
        self.title_length(file, get(spec, "publish.title"), "film")
        seconds = self.estimate_film(spec, shorts)
        if seconds > MAX_FILM:
            self.out.warn(file, f"estimated {stamp(seconds)}, over {stamp(MAX_FILM)}: the film lasts under 10 minutes")
        self.validation(file, spec)
        return spec, shorts

    def reuse(self, file: str, where: str, seg: dict, shorts: dict) -> None:
        name, _, part = str(seg["reuse"]).partition(".")
        short = shorts.get(name)
        if short is None:
            self.out.error(file, f"{where}: reuse « {seg['reuse']} »: « {name} » is not one of the shorts of thumbnail.panels")
            return
        lines = next((s.get("lines") or [] for s in short.get("segments") or [] if s.get("narration") == part), None)
        if lines is None:
            self.out.error(file, f"{where}: reuse « {seg['reuse']} »: the short {name} has no narration « {part} »")
            return
        if "lines" in seg:
            picked = seg["lines"]
            if not isinstance(picked, list) or not picked or any(not isinstance(i, int) or not 0 <= i < len(lines) for i in picked):
                self.out.error(file, f"{where}: reuse « {seg['reuse']} »: `lines: {picked}` out of range (the narration has {len(lines)} lines)")
            elif picked != list(range(picked[0], picked[0] + len(picked))):
                self.out.error(file, f"{where}: reuse « {seg['reuse']} »: `lines: {picked}` are not consecutive")

    def estimate_film(self, spec: dict, shorts: dict) -> float:
        t = script.LEAD
        for chapter in spec.get("chapters") or []:
            for seg in chapter.get("segments") or []:
                if "reuse" in seg:
                    name, _, part = str(seg["reuse"]).partition(".")
                    lines = next((s.get("lines") or [] for s in (shorts.get(name) or {}).get("segments") or [] if s.get("narration") == part), [])
                    if isinstance(seg.get("lines"), list) and all(isinstance(i, int) and 0 <= i < len(lines) for i in seg["lines"]):
                        lines = [lines[i] for i in seg["lines"]]
                    t += script.spoken(lines) + script.GAP
                else:
                    t += self.seconds_of(seg) + script.GAP
        return t - script.GAP + (spec.get("outro") or 0)


def seg_name(seg: dict) -> str:
    return next((f"{k}: {v}" for k, v in seg.items() if k in ("verse", "verses", "reading", "narration", "reuse")), "?")


# ---- Main -----------------------------------------------------------------------------------------------------

def films_of(repo: Repo) -> list[Path]:
    out = []
    for path in sorted((repo.content / "trial").glob("*.yaml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        if isinstance(data, dict) and ("chapters" in data or "shorts" in data):
            out.append(path)
    return out


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    which = p.add_mutually_exclusive_group()
    which.add_argument("--film", help="the film's id (content/trial/<id>.yaml)")
    which.add_argument("--all", action="store_true", help="every film of content/trial/ with its shorts (default)")
    p.add_argument("--draft", action="store_true", help="a reading not found yet is a warning")
    p.add_argument("--root", type=Path, default=REPO, help="the directory that holds content/ (default: this repository)")
    args = p.parse_args()
    repo = Repo(args.root.resolve())
    paths = [repo.content / "trial" / f"{args.film}.yaml"] if args.film else films_of(repo)
    if args.film and not paths[0].exists():
        sys.exit(f"error: content/trial/{args.film}.yaml does not exist")
    total_errors = 0
    for path in paths:
        out = Findings()
        checker = Checker(repo, out, args.draft)
        spec, shorts = checker.film(path)
        if checker.unvalidated:
            out.warn(repo.rel(path), "quoted and not validated yet: " + ", ".join(checker.unvalidated))
        for level, file, what in out.items:
            print(f"{level} {file}: {what}")
        kind = "film" if "chapters" in spec else "series"
        print(f"{kind} {spec.get('id', path.stem)}: {len(shorts)} short(s), {out.count('error')} error(s), {out.count('warning')} warning(s)")
        total_errors += out.count("error")
    print("\nTo check by eye (no code can):")
    for item in TO_CHECK_BY_EYE:
        print(f"  - {item}")
    return 1 if total_errors else 0


if __name__ == "__main__":
    sys.exit(main())
