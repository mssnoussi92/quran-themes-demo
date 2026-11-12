#!/usr/bin/env python3
"""The script of a film and its shorts as one page the owner can read and validate (docs/model.md).

  uv run --with pyyaml python3 tools/trial/script.py --film <id> [--out docs/scripts/<id>.md]

<id>: a film (a file with `chapters`) or a series (a file with `shorts` and no chapters: shorts that stand
alone, no film). For each short, then for the film: every segment in order, the narration in Arabic and
English, each verse and hadith by its reference with its length, what a narration rests on (`sources:` the
report it tells, the tafsir its meaning comes from), and an estimate of the video's length before any
voice exists. A line marked « reprise » is a validated line of the old episode kept word for word
(`kept:` in the file); every other line is new and is what the owner validates. Nothing is typed
here: lines come from content/trial/, references and texts of the quotes from the registry.

The estimate: the voice says about ten letters a second, holds each « … » half a second and 0.7 s
between two lines (tools/trial/prepare.py tightens its pauses to that); verses last what their cut
in the recitation lasts (content/recitations/), a hadith what its recorded reading lasts.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
TRIAL = ROOT / "content" / "trial"
PHRASE_CUT = re.compile(r"(?<=[،,….!?؟:])\s+")
PACE, PAUSE, PAUSE_LINES, GAP, LEAD, TAIL = 10.0, 0.5, 0.7, 0.35, 0.5, 1.2
UNKNOWN_READING = 12.0     # a hadith whose reading is not found yet


def stamp(seconds: float) -> str:
    return f"{int(seconds // 60)}:{int(seconds % 60):02d}"


def letters(text: str) -> int:
    return len(re.sub(r"[^ء-ي]", "", text))


def spoken(lines: list[dict]) -> float:
    """Seconds a narration segment lasts, about."""
    total = 0.0
    for i, line in enumerate(lines):
        phrases = [p for p in PHRASE_CUT.split(line["ar"].strip()) if p]
        total += letters(line["ar"]) / PACE + PAUSE * (len(phrases) - 1) + (PAUSE_LINES if i else 0)
    return total


PAUSE_SIGNS = "\u06d6\u06d7\u06da\u06db\u06d8\u06d9\u06dc"      # ۖ ۗ ۚ ۛ ۘ ۙ ۜ: where a reciter may stop in a verse


def is_word(token: str) -> bool:
    """A token that is recited (it has a letter), as hasLetter in video/src/trial/Trial.tsx: a pause sign alone is not."""
    return any(ch.isalpha() for ch in token)


def first_words(text: str, n: int) -> str:
    """The first n recited words of a verse's display text (`upto: n`), with the pause sign that follows word n
    when it is a token of its own (a sign attached to the word comes with the word)."""
    kept, count = [], 0
    for token in text.split():
        if is_word(token):
            if count == n:
                break
            count += 1
        kept.append(token)
    return " ".join(kept)


def first_sentence(en: str) -> str:
    """The translation up to the end of its first sentence (at the first « . »), period kept."""
    head, dot, _ = en.partition(". ")
    return head + dot.strip() if dot else en


def stops_after(text: str, n: int) -> bool:
    """Is word n of the verse's text followed by a pause sign (attached to it, or the next token)?"""
    tokens, count = text.split(), 0
    for i, token in enumerate(tokens):
        if is_word(token):
            count += 1
            if count == n:
                nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
                return any(c in PAUSE_SIGNS for c in token) or (bool(nxt) and not is_word(nxt) and any(c in PAUSE_SIGNS for c in nxt))
    return False


def registry() -> dict:
    out = {}
    for path in (ROOT / "content" / "sources").glob("*.yaml"):
        for entry in yaml.safe_load(path.read_text(encoding="utf-8")) or []:
            out[entry["id"]] = entry
    return out


def quote(sid: str, sources: dict, cuts: dict) -> tuple[str, float]:
    """One line for a verse or a hadith, and how long it lasts."""
    src = sources.get(sid)
    if src is None:
        sys.exit(f"error: {sid} is not in the registry")
    state = "" if src.get("status") == "validated" else " · **source proposée, à valider**"
    if src["type"] == "ayah":
        key = f"{src['ref']['surah']}:{src['ref']['ayah']}"
        cut = cuts.get(key)
        seconds = cut["seconds"] if cut else 0.0
        hand = " · coupe posée à la main, à écouter" if cut and "hand" in cut.get("method", "") else ""
        name = (src.get("origin") or {}).get("surah_en", "")
        return (f"**Verset récité** · {name} {key} · {seconds:.0f} s{state}{hand}  \n  {src['text_ar']}  \n  *{src['text_en']}*", seconds)
    rec = src.get("recording")
    seconds = rec["end"] - rec["start"] if rec else UNKNOWN_READING
    reading = (f"lu par {rec['reader']} · {seconds:.0f} s" + ("" if rec.get("status") == "validated" else " · **lecture à valider**")) if rec \
        else f"**lecture à trouver** (comptée {UNKNOWN_READING:.0f} s)"
    ref = f"{src['ref']['collection'].capitalize()} {src['ref']['number']}" + ("abcdefgh"[src["ref"]["narration"] - 1] if src["ref"].get("narration") else "")
    text = src.get("excerpt_ar") or src["text_ar"]
    if not src.get("excerpt_ar") and text.count('"') >= 2:
        text = text[text.index('"'):text.rindex('"') + 1]
    english = src.get("excerpt_en") or src.get("text_en", "")
    return (f"**Hadith lu par une vraie voix** · {ref} · {reading}{state}  \n  {text}  \n  *{english}*", seconds)


COLLECTIONS = {"bukhari": "Sahih al-Bukhari", "muslim": "Sahih Muslim", "tirmidhi": "Jami' at-Tirmidhi"}


def passage(ids: list[str], sources: dict, cuts: dict, upto: int | None = None) -> tuple[str, float]:
    """Verses that follow one another, recited without a break (`verses:`): one line, and how long it lasts."""
    srcs = []
    for sid in ids:
        if sid not in sources:
            sys.exit(f"error: {sid} is not in the registry")
        srcs.append(sources[sid])
    keys = [f"{x['ref']['surah']}:{x['ref']['ayah']}" for x in srcs]
    found = [cuts.get(k) for k in keys]
    seconds = found[-1]["end"] - found[0]["start"] if all(found) else 0.0
    if upto and len(srcs) == 1 and found[0]:          # cut at the end of word `upto`: only those words, the first sentence
        words = found[0]["words"]
        seconds = words[min(upto, len(words)) - 1][2]
        x = srcs[0]
        state = "" if x.get("status") == "validated" else " · **source proposée, à valider**"
        hand = " · coupe posée à la main, à écouter" if "hand" in found[0].get("method", "") else ""
        name = (x.get("origin") or {}).get("surah_en", "")
        return (f"**Verset récité, coupé au mot {upto}** · {name} {keys[0]} · {seconds:.0f} s{state}{hand}  \n  {first_words(x['text_ar'], upto)}  \n  *{first_sentence(x['text_en'])}*", seconds)
    state = "" if all(x.get("status") == "validated" for x in srcs) else " · **sources proposées, à valider**"
    hand = " · coupes posées à la main, à écouter" if any(c and "hand" in c.get("method", "") for c in found) else ""
    name = (srcs[0].get("origin") or {}).get("surah_en", "")
    rows = [f"  {x['text_ar']}  \n  *{x['text_en']}*" for x in srcs]
    return (f"**Versets récités d'une traite** · {name} {keys[0]}-{keys[-1].split(':')[1]} · {seconds:.0f} s{state}{hand}  \n" + "  \n".join(rows), seconds)


def rests_on(ids: list[str], sources: dict, policy: dict) -> str:
    """What a narration rests on, as the owner reads it: the report told, the tafsir of the meaning."""
    out = []
    for sid in ids:
        src = sources.get(sid)
        if src is None:
            sys.exit(f"error: {sid} is not in the registry")
        state = "" if src.get("status") == "validated" else ", source proposée"
        ref = src["ref"]
        if src["type"] == "hadith":
            name = COLLECTIONS.get(ref["collection"], ref["collection"].capitalize())
            letter = "abcdefgh"[ref["narration"] - 1] if ref.get("narration") else ""
            out.append(f"récit de [{name} {ref['number']}{letter}]({src.get('url')}), raconté avec nos mots{state}")
        elif src["type"] == "science":
            out.append(f"source scientifique [{src['label']['en']}]({src.get('url')}) : {src.get('claim', '')}{state}")
        else:
            edition = ((policy.get("tafsir") or {}).get("editions") or {}).get(ref["edition"]) or {}
            out.append(f"sens d'après [{edition.get('en', ref['edition'])} · {edition.get('ar', '')}]({src.get('url')}) sur {ref['surah']}:{ref['ayah']}{state}")
    return "d'après : " + " ; ".join(out) + " · référence écrite à l'écran, jamais lue"


def narration(lines: list[dict]) -> list[str]:
    out = []
    for line in lines:
        mark = f"reprise de `{line['kept']}`" if line.get("kept") else "**nouvelle**"
        out += [f"- {line['ar']}  ", f"  *{line['en']}* · {mark}"]
    return out


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--film", required=True, help="the film's id (content/trial/<id>.yaml)")
    p.add_argument("--out", type=Path)
    args = p.parse_args()
    film = yaml.safe_load((TRIAL / f"{args.film}.yaml").read_text(encoding="utf-8"))
    series = "chapters" not in film          # shorts that stand alone: no film
    policy = yaml.safe_load((ROOT / "content" / "policy.yaml").read_text(encoding="utf-8")) or {}
    sources = registry()
    cuts = json.loads((ROOT / "content" / "recitations" / "sayegh.json").read_text(encoding="utf-8"))
    cuts = cuts.get("verses", cuts)
    shorts = {name: yaml.safe_load((TRIAL / f"{name}.yaml").read_text(encoding="utf-8")) for name in film.get("shorts") or film["thumbnail"]["panels"]}
    doc = [f"# {film['title']['en']} · {film['title']['ar']}", "",
           "Script à valider avant toute voix. Les répliques **nouvelles** sont de la session ; les répliques « reprises » "
           "sont celles que le propriétaire a validées dans l'ancien épisode, mot pour mot. Versets et hadiths viennent du "
           "registre. Durées estimées sans voix (`tools/trial/script.py`, à relancer après tout changement).", ""]
    summary, bodies = [], []

    # Each short
    lengths = {}
    for n, (name, spec) in enumerate(shorts.items(), 1):
        t, recited, read, new, kept = LEAD, 0.0, 0.0, 0, 0
        body = []
        for seg in spec["segments"]:
            if "narration" in seg:
                seconds = spoken(seg["lines"])
                body += [f"**{stamp(t)} · narration** (image : `{seg['scene']}`)"
                         + (f" · {rests_on(seg['sources'], sources, policy)}" if seg.get("sources") else ""), *narration(seg["lines"]), ""]
                new += sum(1 for l in seg["lines"] if not l.get("kept"))
                kept += sum(1 for l in seg["lines"] if l.get("kept"))
            elif "verses" in seg:
                text, seconds = passage(seg["verses"], sources, cuts, seg.get("upto"))
                body += [f"**{stamp(t)}** · {text}", ""]
                recited += seconds
            else:
                text, seconds = quote(seg.get("verse") or seg["reading"], sources, cuts)
                body += [f"**{stamp(t)}** · {text}", ""]
                recited += seconds if "verse" in seg else 0
                read += seconds if "reading" in seg else 0
            t += seconds + GAP
        total = t - GAP + TAIL
        lengths[name] = total
        cover = spec.get("cover") or {}
        head = [f"## Short {n} · `{name}`" + (f" · {cover['title']}" if cover.get("title") else ""), "",
                f"Environ **{stamp(total)}** · {stamp(recited)} de récitation, {stamp(read)} de hadith lu · "
                f"{new} répliques nouvelles, {kept} reprises.", ""]
        bodies += head + body
        summary.append(f"| {n} | `{name}` | {stamp(total)} | {stamp(recited)} | {stamp(read)} | {new} | {kept} |")

    if series:
        doc += ["| | Short | Durée estimée | Récitation | Hadith lu | Répliques nouvelles | Reprises |", "| --- | --- | --- | --- | --- | --- | --- |", *summary, ""]
        doc += bodies
        out = args.out or ROOT / "docs" / "scripts" / f"{args.film}.md"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text("\n".join(doc), encoding="utf-8")
        shown = out.relative_to(ROOT) if out.is_relative_to(ROOT) else out
        print(f"{shown}: " + ", ".join(f"{k} {stamp(v)}" for k, v in lengths.items()) + " (a series: no film)")
        return

    # The film: the lines of its own, and its order
    t, recited, read = LEAD, 0.0, 0.0
    body, own_new, own_kept = [], 0, 0
    for chapter in film["chapters"]:
        body += [f"### {stamp(t)} · {chapter['title']['en']} · {chapter['title']['ar']}", ""]
        for seg in chapter["segments"]:
            if "reuse" in seg:
                name, part = seg["reuse"].split(".")
                lines = next(s["lines"] for s in shorts[name]["segments"] if s.get("narration") == part)
                if "lines" in seg:
                    lines = [lines[i] for i in seg["lines"]]
                seconds = spoken(lines)
                body.append(f"- {stamp(t)} · répliques du short `{name}` (`{part}`" + (f", {len(lines)} sur {len(next(s['lines'] for s in shorts[name]['segments'] if s.get('narration') == part))}" if "lines" in seg else "") + ")"
                            + (" · **rappel d'abonnement**" if seg.get("subscribe") else ""))
            elif "narration" in seg:
                seconds = spoken(seg["lines"])
                body += [f"**{stamp(t)} · narration propre au film**" + (" · **rappel d'abonnement**" if seg.get("subscribe") else ""), *narration(seg["lines"]), ""]
                own_new += sum(1 for l in seg["lines"] if not l.get("kept"))
                own_kept += sum(1 for l in seg["lines"] if l.get("kept"))
            else:
                text, seconds = quote(seg.get("verse") or seg["reading"], sources, cuts)
                first = text.split("  \n")[0]
                in_short = any((s.get("verse") or s.get("reading")) == (seg.get("verse") or seg["reading"]) for sp in shorts.values() for s in sp["segments"])
                body += [f"- {stamp(t)} · {first}"] if in_short else [f"**{stamp(t)}** · {text}", ""]
                recited += seconds if "verse" in seg else 0
                read += seconds if "reading" in seg else 0
            t += seconds + GAP
        body.append("")
    total = t - GAP + film.get("outro", 0)
    doc += ["| | Vidéo | Durée estimée | Récitation | Hadith lu | Répliques nouvelles | Reprises |", "| --- | --- | --- | --- | --- | --- | --- |", *summary,
            f"| | le film `{args.film}` | {stamp(total)} | {stamp(recited)} | {stamp(read)} | {own_new} (propres au film) | {own_kept} |", ""]
    doc += bodies
    doc += [f"## Le film · `{args.film}`", "",
            f"Environ **{stamp(total)}**, dont {film.get('outro', 0)} s d'image calme à la fin · {stamp(recited)} de récitation, {stamp(read)} de hadith lu. "
            "Il reprend les shorts réplique par réplique (sans leurs appels à suivre) ; seules ses répliques propres sont écrites ici en entier.", "", *body]
    out = args.out or ROOT / "docs" / "scripts" / f"{args.film}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(doc), encoding="utf-8")
    shown = out.relative_to(ROOT) if out.is_relative_to(ROOT) else out
    print(f"{shown}: " + ", ".join(f"{k} {stamp(v)}" for k, v in lengths.items()) + f", film {stamp(total)}")


if __name__ == "__main__":
    main()
