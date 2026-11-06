#!/usr/bin/env python3
"""Fill text_ar / text_en of the source registry (content/sources/*.yaml) from public APIs.

  verses   API quran.com v4: Uthmani text (Hafs) and the translation named in content/policy.yaml
  hadiths  hadith-api (fawazahmed0, jsDelivr): Arabic text and its English edition

Texts are copied as published (outer whitespace and translation footnote markers removed),
never retyped. Each filled entry gets an `origin` block (the exact URLs it came from) and a
`url` to read it on quran.com / sunnah.com. Hadith grades published by hadith-api are copied
too (`origin.grades`): scripts/validate.py checks them against content/policy.yaml. The script
never validates a source: statuses are left alone, except that a *validated* source whose text
or grades changed goes back to `proposed`.

Hadith numbers are the usual ones, i.e. hadith-api's `arabicnumber` (Fath al-Bari for
Bukhari, Fuad Abd al-Baqi for Muslim). When a number covers several narrations (Muslim
2679.01, 2679.02...), the entry must say which one with `ref.narration` (1, 2...) and the id
ends with the matching letter, as on sunnah.com: hadith.muslim.2679a.

Usage:
  uv run --with ruamel.yaml tools/sources/fetch.py            # fill or refresh the registry
  uv run --with ruamel.yaml tools/sources/fetch.py --check    # fail if a text or grade differs from the API
  uv run --with ruamel.yaml tools/sources/fetch.py --only quran.40.60 hadith.bukhari.6339
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap, CommentedSeq

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "content" / "sources"
CACHE = ROOT / "build" / "cache" / "sources"

QURAN_API = "https://api.quran.com/api/v4"
HADITH_API = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1"
# jsDelivr refuses some files ("Package size exceeded the configured limit"): same files on GitHub.
HADITH_MIRROR = "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1"
# quran.com rejects Python's default User-Agent (HTTP 403).
USER_AGENT = "quran-themes-demo/0.1 (+https://github.com/mssnoussi92/quran-themes-demo)"

# Registry name of a translation -> quran.com slug.
QURAN_TRANSLATIONS = {"sahih-international": "en-sahih-international"}


class FetchError(Exception):
    pass


# ---- HTTP -----------------------------------------------------------------------------------

def get_json(url: str, attempts: int = 5):
    """GET a JSON document, retrying transient failures (jsDelivr sometimes answers garbage)."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    for i in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or i == attempts - 1:
                raise FetchError(f"{url}: HTTP {e.code}") from None
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as e:
            if i == attempts - 1:
                raise FetchError(f"{url}: {e}") from None
        time.sleep(2 ** i)
    raise AssertionError("unreachable")


def get_first(urls: list[str]) -> tuple[object, str]:
    """The first URL that answers, and its JSON."""
    failures = []
    for url in urls:
        try:
            return get_json(url), url
        except FetchError as e:
            failures.append(str(e))
    raise FetchError("; ".join(failures))


def hadith_urls(path: str) -> list[str]:
    """editions/eng-muslim/6812 -> .json (readable) then .min.json on jsDelivr, then GitHub."""
    return [f"{HADITH_API}/{path}.json", f"{HADITH_API}/{path}.min.json", f"{HADITH_MIRROR}/{path}.json"]


def cached_json(name: str, urls: str | list[str], refresh: bool):
    """Large index files, kept in build/ (ignored by Git) between runs."""
    path = CACHE / name
    if refresh or not path.is_file():
        data, _ = get_first([urls] if isinstance(urls, str) else urls)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        return data
    return json.loads(path.read_text(encoding="utf-8"))


# ---- Quran (quran.com v4) -------------------------------------------------------------------

_FOOTNOTE = re.compile(r"<sup\b[^>]*>.*?</sup>", re.DOTALL | re.IGNORECASE)
_TAG = re.compile(r"<[^>]+>")


def clean_translation(text: str) -> str:
    """Drop footnote markers (<sup foot_note=...>1</sup>) and markup. Words are untouched.
    Same rule as quran-reels (src/quran_reels/sources/quran_com.py)."""
    text = _TAG.sub("", _FOOTNOTE.sub("", text))
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


class Quran:
    def __init__(self, refresh: bool):
        self.refresh = refresh
        self._ids: dict[str, int] = {}

    def translation_id(self, name: str) -> int:
        if name not in self._ids:
            slug = QURAN_TRANSLATIONS.get(name)
            if slug is None:
                raise FetchError(f"translation '{name}' has no quran.com slug in QURAN_TRANSLATIONS")
            index = cached_json("quran.com/translations.json", f"{QURAN_API}/resources/translations", self.refresh)
            ids = [t["id"] for t in index["translations"] if t.get("slug") == slug]
            if len(ids) != 1:
                raise FetchError(f"quran.com translation slug '{slug}' not found")
            self._ids[name] = int(ids[0])
        return self._ids[name]

    def fetch(self, src, translation: str) -> dict:
        key = f"{src['ref']['surah']}:{src['ref']['ayah']}"
        url_ar = f"{QURAN_API}/quran/verses/uthmani?verse_key={key}"
        url_en = f"{QURAN_API}/quran/translations/{self.translation_id(translation)}?verse_key={key}"
        verses = get_json(url_ar)["verses"]
        if len(verses) != 1 or verses[0]["verse_key"] != key:
            raise FetchError(f"{url_ar}: expected verse {key}")
        trans = get_json(url_en)
        if len(trans["translations"]) != 1 or trans["meta"]["filters"]["verse_key"] != key:
            raise FetchError(f"{url_en}: expected one translation of {key}")
        chapters = cached_json("quran.com/chapters.json", f"{QURAN_API}/chapters", self.refresh)["chapters"]
        chapter = next((c for c in chapters if c["id"] == src["ref"]["surah"]), None)
        if chapter is None:
            raise FetchError(f"{QURAN_API}/chapters: no surah {src['ref']['surah']}")
        return {
            "text_ar": verses[0]["text_uthmani"].strip(),
            "text_en": clean_translation(trans["translations"][0]["text"]),
            "url": f"https://quran.com/{src['ref']['surah']}/{src['ref']['ayah']}",
            "origin": {
                "api": "quran.com v4",
                "text_ar": url_ar,
                "text_en": url_en,
                "translator": trans["meta"]["translation_name"],
                "surah_ar": chapter["name_arabic"],
                "surah_en": chapter["name_simple"],
            },
        }


# ---- Hadith (hadith-api) --------------------------------------------------------------------

def split_number(value) -> tuple[int, int | None]:
    """hadith-api arabicnumber: 6339 -> (6339, None); "2679.01" -> (2679, 1)."""
    if isinstance(value, int):
        return value, None
    if isinstance(value, float):
        value = f"{value:.2f}"
    whole, _, part = str(value).partition(".")
    return int(whole), (int(part) if part and int(part) else None)


def letter(narration: int | None) -> str:
    return "" if narration is None else chr(ord("a") + narration - 1)


class Hadith:
    def __init__(self, refresh: bool):
        self.refresh = refresh
        self._info = None
        self._editions = None

    def info(self, collection: str) -> list[dict]:
        if self._info is None:
            self._info = cached_json("hadith-api/info.json", hadith_urls("info"), self.refresh)
        if collection not in self._info:
            raise FetchError(f"collection '{collection}' is not in hadith-api")
        return self._info[collection]["hadiths"]

    def translator(self, edition: str) -> str:
        if self._editions is None:
            self._editions = cached_json("hadith-api/editions.json", hadith_urls("editions"), self.refresh)
        for book in self._editions.values():
            for e in book["collection"]:
                if e["name"] == edition:
                    return e.get("author") or "Unknown"
        raise FetchError(f"edition '{edition}' is not in hadith-api")

    def resolve(self, collection: str, number: int, narration: int | None) -> dict:
        """Usual number (+ narration) -> hadith-api record (hadithnumber, reference)."""
        matches = []
        for h in self.info(collection):
            if "arabicnumber" not in h:
                continue
            n, sub = split_number(h["arabicnumber"])
            if n == number:
                matches.append((sub, h))
        if not matches:
            raise FetchError(f"{collection} {number}: no hadith with this number in hadith-api")
        if narration is None:
            if len(matches) > 1:
                subs = ", ".join(f"{number}{letter(s)} (narration: {s})" for s, _ in matches)
                raise FetchError(f"{collection} {number} covers {len(matches)} narrations: {subs}; "
                                 f"set ref.narration and the id suffix")
            return matches[0][1]
        for sub, h in matches:
            if sub == narration:
                return h
        raise FetchError(f"{collection} {number}: no narration {narration} in hadith-api")

    def text(self, edition: str, hadithnumber, expected) -> tuple[str, str]:
        data, url = get_first(hadith_urls(f"editions/{edition}/{hadithnumber}"))
        hadiths = data["hadiths"]
        if len(hadiths) != 1 or str(hadiths[0].get("arabicnumber")) != str(expected):
            raise FetchError(f"{url}: expected arabicnumber {expected}")
        text = hadiths[0]["text"].strip()
        if not text:
            raise FetchError(f"{url}: empty text")
        return text, url

    def fetch(self, src) -> dict:
        ref = src["ref"]
        collection, number, narration = ref["collection"], ref["number"], ref.get("narration")
        h = self.resolve(collection, number, narration)
        text_ar, url_ar = self.text(f"ara-{collection}", h["hadithnumber"], h["arabicnumber"])
        text_en, url_en = self.text(f"eng-{collection}", h["hadithnumber"], h["arabicnumber"])
        grades = [{"name": g["name"], "grade": g["grade"]} for g in h.get("grades", [])]
        return {
            "text_ar": text_ar,
            "text_en": text_en,
            "url": f"https://sunnah.com/{collection}:{number}{letter(narration)}",
            "origin": {
                "api": "hadith-api (fawazahmed0)",
                "text_ar": url_ar,
                "text_en": url_en,
                "translator": self.translator(f"eng-{collection}"),
                "book": h["reference"]["book"],
                "hadith_in_book": h["reference"]["hadith"],
                **({"grades": grades} if grades else {}),
            },
        }


# ---- Registry -------------------------------------------------------------------------------

def yaml_rt() -> YAML:
    y = YAML()
    y.preserve_quotes = True
    y.width = 100_000          # one line per text: no folding inside Arabic strings
    y.indent(mapping=2, sequence=2, offset=0)
    return y


def plain(value):
    """ruamel nodes -> plain lists and dicts, for comparisons."""
    return json.loads(json.dumps(value)) if value is not None else None


def origin_map(origin: dict, today: str) -> CommentedMap:
    m = CommentedMap({**origin, "retrieved": today})
    m.fa.set_block_style()
    if "grades" in m:
        m["grades"] = CommentedSeq(CommentedMap(g) for g in m["grades"])
        for g in m["grades"]:
            g.fa.set_flow_style()          # - {name: Al-Albani, grade: Hasan}
    return m


def set_before(entry: CommentedMap, key: str, value, before: str = "status") -> None:
    if key in entry:
        entry[key] = value
    else:
        entry.insert(list(entry.keys()).index(before) if before in entry else len(entry), key, value)


def expected_id(src) -> str | None:
    ref = src["ref"]
    if src["type"] == "ayah":
        return f"quran.{ref['surah']}.{ref['ayah']}"
    if src["type"] == "hadith":
        return f"hadith.{ref['collection']}.{ref['number']}{letter(ref.get('narration'))}"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true",
                        help="write nothing; exit 1 if a text or grade differs from the API")
    parser.add_argument("--only", nargs="+", metavar="ID", help="only these source ids")
    parser.add_argument("--refresh", action="store_true", help="download the cached API indexes again")
    args = parser.parse_args()

    policy = YAML(typ="safe").load((ROOT / "content" / "policy.yaml").read_text(encoding="utf-8")) or {}
    default_translation = policy.get("quran", {}).get("translation", "sahih-international")
    quran, hadith = Quran(args.refresh), Hadith(args.refresh)
    y = yaml_rt()
    today = dt.date.today().isoformat()
    errors, changed, seen = [], [], set()

    for path in sorted(SOURCES.glob("*.yaml")):
        entries = y.load(path.read_text(encoding="utf-8")) or []
        dirty = False
        for src in entries:
            sid = src["id"]
            seen.add(sid)
            if args.only and sid not in args.only:
                continue
            if expected_id(src) not in (None, sid):
                errors.append(f"{sid}: id does not match ref (expected {expected_id(src)})")
                continue
            try:
                if src["type"] == "ayah":
                    got = quran.fetch(src, src.get("translation", default_translation))
                elif src["type"] == "hadith":
                    got = hadith.fetch(src)
                else:
                    print(f"skip    {sid}: type '{src['type']}' has no API yet")
                    continue
            except FetchError as e:
                errors.append(f"{sid}: {e}")
                continue

            diffs = [k for k in ("text_ar", "text_en") if src.get(k) != got[k]]
            if plain((src.get("origin") or {}).get("grades")) != got["origin"].get("grades"):
                diffs.append("grades")
            # Surah names: shown under a verse, metadata (a change does not undo a validation).
            diffs += [k for k in ("surah_ar", "surah_en")
                      if k in got["origin"] and (src.get("origin") or {}).get(k) != got["origin"][k]]
            if not diffs:
                print(f"ok      {sid}")
                continue
            changed.append(sid)
            if args.check:
                errors.append(f"{sid}: {', '.join(diffs)} differ(s) from the API; run tools/sources/fetch.py")
                continue

            src["text_ar"], src["text_en"] = got["text_ar"], got["text_en"]
            set_before(src, "url", got["url"], before="origin" if "origin" in src else "status")
            set_before(src, "origin", origin_map(got["origin"], today))
            note = ""
            if src["status"] == "validated" and {"text_ar", "text_en", "grades"} & set(diffs):
                src["status"] = "proposed"
                src.pop("validated_by", None)
                note = " (changed: status back to proposed, validate it again)"
            print(f"filled  {sid}: {', '.join(diffs)}{note}")
            dirty = True

        if dirty:
            with path.open("w", encoding="utf-8") as f:
                y.dump(entries, f)

    for sid in sorted(set(args.only or []) - seen):
        errors.append(f"{sid}: not in content/sources/")
    for e in errors:
        print(f"ERROR   {e}")
    verb = "differ from the API" if args.check else "updated"
    print(f"\n{len(seen)} sources, {len(changed)} {verb}, {len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
