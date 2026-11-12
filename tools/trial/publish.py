#!/usr/bin/env python3
"""The texts to paste for a film and its shorts (content/trial/*.yaml, docs/model.md): for the film and each
short, the title and the text of each platform, one block to copy each, in the form video/scripts/publish.ts
gives the old episodes (same order of hashtags, same limits: content/publish.yaml).

  uv run --with pyyaml python3 tools/trial/publish.py [--film <id>] [--voice D] [--out <file.md>]
  uv run --with pyyaml python3 tools/trial/publish.py --film <id> --draft --out <file.md>   # before the voice: lengths and limits

Written by hand in the trial files (`publish`: title, description; the film's `series` and `hashtags`).
Computed here: the sources quoted (reference, reciter or reader, link), the durations and the film's
chapters (the timelines prepared by tools/trial/prepare.py for that voice), the line that declares the
AI voice, the page's hashtags. Session only for the durations: it needs video/public/trial/*-<voice>.json.

A source is read where the film reads it: the old episode the first film names (`verses`), or the registry
(tools/trial/sources.py). A hadith whose grade is not its collection (Tirmidhi) is written with al-Albani's
grade. --draft takes the timelines of the silent draft (voice X): the durations are estimates, the texts and
the platforms' limits are the real ones.
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
PUBLIC = ROOT / "video" / "public"
DIGITS = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")


def stamp(seconds: float) -> str:
    return f"{int(seconds // 60)}:{int(seconds % 60):02d}"


def quoted(ids: list[tuple[str, str]], sources: dict) -> tuple[list[str], bool, bool]:
    """One line per source quoted, verses that follow each other in one line; was a hadith quoted, a verse recited."""
    lines, run = [], []                         # run: verses of one surah that follow each other

    def flush() -> None:
        if not run:
            return
        first, last = sources[run[0]], sources[run[-1]]
        surah, a = run[0].split(".")[1:]
        b = run[-1].split(".")[2]
        name = re.sub(r"\s*\(.*\)$", "", first["reference_en"])
        span = a if a == b else f"{a}-{b}"
        lines.append(f"• {name} ({surah}:{span}) · Recitation: Tawfiq As-Sayegh · Translation: {last['translator']} · https://quran.com/{surah}/{span}")
        run.clear()

    hadith = verse = False
    for kind, sid in ids:
        if kind in ("report", "tafsir", "science"):      # what a narration rests on (`sources:`): told, explained or measured, never read
            flush()
            lines.append(rests_on(kind, sid))
            hadith = hadith or kind == "report"
        elif kind == "verse":
            verse = True
            if run and (run[-1].split(".")[1] != sid.split(".")[1] or int(sid.split(".")[2]) != int(run[-1].split(".")[2]) + 1):
                flush()
            if sid not in run:
                run.append(sid)
        else:
            flush()
            hadith = True
            src = sources[sid]
            lines.append(" · ".join(x for x in (f"• {src['reference_en']}", src.get("grade_note"), f"Reading: {src['recording']['reader']}", src["url"]) if x))
    flush()
    seen, unique = set(), []
    for l in lines:
        if l not in seen:
            seen.add(l)
            unique.append(l)
    return unique, hadith, verse


def rests_on(kind: str, sid: str) -> str:
    """The line of a report a narration tells in its own words, of the tafsir its meaning comes from, or of the
    paper or the data (a `science` source) a claim rests on."""
    import sources as registry              # tools/trial/sources.py

    e = registry.entry_of(sid)
    ref = e["ref"]
    if kind == "science":
        return f"• {ref['author']}, {ref['title']}, {ref['publication']}, {ref['year']} · {e['url']}"
    if kind == "report":
        letter = chr(96 + ref["narration"]) if ref.get("narration") else ""
        return f"• {registry.COLLECTIONS[ref['collection']]} {ref['number']}{letter} (told in the narration's own words) · {e['url']}"
    policy = yaml.safe_load((ROOT / "content" / "policy.yaml").read_text(encoding="utf-8")) or {}
    name = policy["tafsir"]["editions"][ref["edition"]]["en"]
    return f"• Meaning after {name} ({ref['surah']}:{ref['ayah']}) · {e['url']}"


def quotes_of(segments: list[dict]) -> list[tuple[str, str]]:
    """What a list of segments quotes or rests on, in order: verses (one or a passage), readings, and the sources
    of a narration (a hadith: a report told; a tafsir: where a meaning comes from; a science source: a paper or
    data)."""
    ids = []
    for s in segments:
        if "verse" in s:
            ids.append(("verse", s["verse"]))
        elif "verses" in s:
            ids += [("verse", sid) for sid in s["verses"]]
        elif "reading" in s:
            ids.append(("reading", s["reading"]))
        for sid in s.get("sources") or []:
            ids.append(("report" if sid.startswith("hadith.") else "science" if sid.startswith("science.") else "tafsir", sid))
    return ids


def footage(specs: list[dict], own: dict | None = None) -> str:
    """Where the pictures come from, and the ambience under the narration when the videos have one. `own`:
    the film's own pictures (`pictures` of its file: a clip no short shows), credited with the others.
    A generated clip (`clip.source: generated`) has no author and is not credited; the photos a short
    carries (`photos`: credit, licence) are listed under « Images »."""
    authors = [s["clip"]["author"] for s in specs if (s.get("clip") or {}).get("author")]
    authors += [pic["clip"]["author"] for pic in (own or {}).values() if pic.get("clip", {}).get("author")]
    images = [f"{p['credit']} ({p['licence']})" for s in specs for p in s.get("photos") or []]
    beds = list(dict.fromkeys(f"{s['ambience']['source'].replace('bigsoundbank', 'BigSoundBank')} ({s['ambience']['author']})" for s in specs if s.get("ambience")))
    parts = ([f"Footage: Pixabay ({', '.join(dict.fromkeys(authors))})"] if authors else []) \
        + ([f"Images: {', '.join(dict.fromkeys(images))}"] if images else []) \
        + ([f"Ambience: {', '.join(beds)}"] if beds else [])
    return " · ".join(parts)


def hashtags(conf: dict, theme: list[str], hadith: bool, verse: bool, most: int | None) -> str:
    tags = [conf["hashtags"]["brand"], conf["hashtags"]["broad"][0], theme[0], *conf["hashtags"]["broad"][1:], *theme[1:]]
    if hadith:
        tags += conf["hashtags"]["hadith"]
    if verse:
        tags += conf["hashtags"]["reciters"]["sayegh"]
    tags = list(dict.fromkeys(tags))
    return " ".join(tags[:most] if most else tags)


def block(text: str) -> str:
    return "```text\n" + text.strip() + "\n```\n"


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--voice", default="D")
    p.add_argument("--film", default="film", help="the film's id (content/trial/<id>.yaml)")
    p.add_argument("--out", type=Path, help="default: `publish.out` of the film, or docs/publication-<files>.md")
    p.add_argument("--draft", action="store_true", help="before the voice: the timelines of the silent draft (voice X)")
    p.add_argument("--tall", action="store_true",
                   help="only the text of the film in 9:16 (`<files>-film-9x16.mp4`), for Facebook; written beside the film's texts (`…-9x16.md`) unless --out")
    args = p.parse_args()
    if args.draft and not args.out:
        sys.exit("error: --draft needs --out (a draft does not replace the film's publication texts)")
    timeline = "X" if args.draft else args.voice
    conf = yaml.safe_load((ROOT / "content" / "publish.yaml").read_text(encoding="utf-8"))
    film = yaml.safe_load((TRIAL / f"{args.film}.yaml").read_text(encoding="utf-8"))
    files = film.get("files", film["id"])        # what the delivered videos' names start with
    if film.get("verses"):                      # the first film: what its old episode prepared
        episode = json.loads((PUBLIC / "data" / f"{film['verses']}.json").read_text(encoding="utf-8"))
        sources = {s["source"]["id"]: s["source"] for s in episode["scenes"] if s.get("source")}
    else:                                       # the registry, as the videos read it
        import sources as registry              # tools/trial/sources.py

        class FromRegistry(dict):
            def __missing__(self, sid: str) -> dict:
                self[sid] = registry.described(sid)
                return self[sid]

        sources = FromRegistry()
    pub = film["publish"]
    narration = pub["narration"][args.voice]
    series_only = "chapters" not in film          # a series: shorts that stand alone, no film
    shorts = [yaml.safe_load((TRIAL / f"{name}.yaml").read_text(encoding="utf-8")) for name in film.get("shorts") or film["thumbnail"]["panels"]]
    # « Je valide » of the owner on the texts: `validated` of every file, with `publish` in what it covers.
    said = [(s.get("validated") or {}) for s in [film, *shorts]]
    validated = all("publish" in (v.get("what") or []) for v in said)
    when = said[0].get("on", said[0].get(True))      # PyYAML reads the key « on » as true (YAML 1.1)
    # The first film was rendered without its ambience, which was put under the rendered videos afterwards
    # (`ambience_after` of its file): once the owner has validated it, the videos to publish are those mixes,
    # `…-ambience.mp4`. Every film since is rendered with its ambience, and its videos keep their names.
    heard = all("ambience" in (v.get("what") or []) for v in said)
    bed = "-ambience" if film.get("ambience_after") and heard else ""
    status = (f"Titres et descriptions **validés par le propriétaire le {when}**" if validated
              else "Titres et descriptions **proposés par la session, pas encore validés par le propriétaire**")
    limits = conf["platforms"]
    out = [
        f"# {pub['series']['en']} · {pub['series']['ar']} : textes de publication",
        "",
        f"Pour {'chaque short' if series_only else 'le film et chaque short'} : le titre, puis le texte à coller sur chaque plateforme. {status} ; "
        "les sources, les crédits, les durées, les chapitres et les hashtags de la page sont calculés "
        "(`tools/trial/publish.py`, à relancer après tout changement). Fichiers : ceux envoyés dans la conversation"
        + ((", avec l'ambiance sonore sous la narration, validée elle aussi (`…-ambience.mp4`)." if bed else
            " ; avec l'ambiance sonore sous la narration, pas encore validée, les mêmes noms terminés par `-ambience.mp4`.")
           if film.get("ambience_after") else
           " et dans la release brouillon du workflow `film`, l'ambiance sonore sous la narration comprise"
           + (", validée elle aussi." if heard else ", pas encore validée.")),
        "",
    ]

    if args.tall:
        # The film in 9:16: one caption, for Facebook, made of the film's own title and description. No chapters
        # (a reel has none) and the hashtags a Facebook post takes.
        if series_only:
            sys.exit(f"error: --tall: {args.film} is a series, it has no film")
        data = json.loads((PUBLIC / "trial" / f"{args.film}-{timeline}.json").read_text(encoding="utf-8"))
        lines, hadith, verse = quoted(quotes_of([s for c in film["chapters"] for s in c["segments"]]), sources)
        caption = "\n\n".join([
            pub["title"]["en"] + "\n" + pub["title"]["ar"], pub["description"]["en"], pub["description"]["ar"],
            "Quoted:\n" + "\n".join(lines), narration + "\n" + footage(shorts, film.get("pictures")), conf["handle"],
            hashtags(conf, pub["hashtags"], hadith, verse, limits["facebook"]["max_hashtags"]),
        ])
        said = ((film.get("tall") or {}).get("validated") or {})
        state = (f"**validé par le propriétaire le {said.get('on', said.get(True))}**" if "publish" in (said.get("what") or [])
                 else "**proposé par la session, pas encore validé par le propriétaire**")
        out = [f"# {pub['series']['en']} · {pub['series']['ar']} : le film en 9:16", "",
               f"Le même film, monté pour un écran vertical (les images des shorts, la même voix, le même minutage). Texte {state} : "
               "il reprend le titre et la description du film, sans les chapitres.", "",
               f"## Le film en 9:16 · {pub['title']['en']} · {pub['title']['ar']}", "",
               f"`{files}-film-9x16.mp4` · {stamp(data['seconds'])} · 9:16 · Facebook", "",
               f"**Facebook ({limits['facebook']['max_hashtags']} hashtags)**", "", block(caption)]
        # Beside the film's own texts: `publish.out` of its file, with « -9x16 » before the extension.
        own = ROOT / pub.get("out", f"docs/publication-{files}.md")
        target = args.out or own.with_name(own.stem + "-9x16" + own.suffix)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("\n".join(out), encoding="utf-8")
        print(f"{target.relative_to(ROOT) if target.is_relative_to(ROOT) else target}: the film in 9:16")
        return

    if not series_only:
        # The film
        data = json.loads((PUBLIC / "trial" / f"{args.film}-{timeline}.json").read_text(encoding="utf-8"))
        ids = quotes_of([s for c in film["chapters"] for s in c["segments"]])
        lines, hadith, verse = quoted(ids, sources)
        title = f"{pub['title']['en']} · {pub['title']['ar']}"
        if len(title) > limits["youtube"]["max_title"]:
            sys.exit(f"error: the film's YouTube title is {len(title)} characters (most: {limits['youtube']['max_title']})")
        chapters = "\n".join(f"{stamp(c['start'])} {c['title']['en']} · {c['title']['ar']}" for c in data["chapters"])
        body = "\n\n".join([
            pub["description"]["en"], pub["description"]["ar"], "Chapters:\n" + chapters,
            "Quoted:\n" + "\n".join(lines), narration + "\n" + footage(shorts, film.get("pictures")), conf["handle"],
            hashtags(conf, pub["hashtags"], hadith, verse, None),
        ])
        if len(body) > limits["youtube"]["max_description"]:
            sys.exit(f"error: the film's YouTube description is {len(body)} characters")
        out += [f"## Le film · {pub['title']['en']} · {pub['title']['ar']}", "",
                f"`{files}-film-16x9{bed}.mp4` · {stamp(data['seconds'])} · 16:9 · YouTube · miniature : `{film['thumbnail'].get('file', files + '-film-thumbnail.jpg')}`", "",
                f"**Titre YouTube ({len(title)}/{limits['youtube']['max_title']})**", "", block(title),
                "**Description YouTube**", "", block(body),
                "Écran de fin (YouTube Studio) : les 12 dernières secondes sont une image calme, faite pour y poser le bouton "
                "d'abonnement et la vidéo suivante.", ""]

    # The shorts
    for spec in shorts:
        sp = spec["publish"]
        data = json.loads((PUBLIC / "trial" / f"{spec['id']}-{timeline}.json").read_text(encoding="utf-8"))
        lines, hadith, verse = quoted(quotes_of(spec["segments"]), sources)
        n, total = sp["part"], len(shorts)
        # A series goes on: its shorts are numbered, never « n of total ».
        series = (f"{pub['series']['en']} · {n} · {pub['series']['ar']} · {str(n).translate(DIGITS)}" if series_only else
                  f"{pub['series']['en']} · part {n}/{total} · {pub['series']['ar']} · الجزء {str(n).translate(DIGITS)} من {str(total).translate(DIGITS)}")
        name = f"{files}-short-{n}-{spec['id']}"
        cover = (spec.get("cover") or {}).get("file", f"{name}-cover.jpg")

        def caption(handle: str, most: int | None) -> str:
            return "\n\n".join([
                sp["title"]["en"] + "\n" + sp["title"]["ar"], sp["description"]["en"], sp["description"]["ar"], series,
                "Quoted:\n" + "\n".join(lines), narration + "\n" + footage([spec]), handle,
                hashtags(conf, pub["hashtags"], hadith, verse, most),
            ])

        insta = caption(conf["handle"], limits["instagram_tiktok"]["max_hashtags"])
        if len(insta) > limits["instagram_tiktok"]["max_caption"]:
            sys.exit(f"error: {name}: the Instagram caption is {len(insta)} characters")
        title = f"{sp['title']['en']} · {sp['title']['ar']}"
        if len(title) > limits["youtube"]["max_title"]:
            sys.exit(f"error: {name}: the YouTube title is {len(title)} characters")
        out += [f"## Short {n} · {sp['title']['en']} · {sp['title']['ar']}", "",
                f"`{name}{bed}.mp4` (TikTok : `{name}-tiktok{bed}.mp4`, signée `{conf['handles']['tiktok']}`) · {stamp(data['seconds'])} · 9:16 · "
                f"Facebook, Instagram, TikTok, YouTube Shorts · couverture : `{cover}`", "",
                f"**Facebook ({limits['facebook']['max_hashtags']} hashtags)**", "", block(caption(conf["handle"], limits["facebook"]["max_hashtags"])),
                f"**Instagram ({limits['instagram_tiktok']['max_hashtags']} hashtags)**", "", block(insta),
                f"**TikTok : la vidéo `{name}-tiktok{bed}.mp4` ({limits['instagram_tiktok']['max_hashtags']} hashtags)**", "",
                block(caption(conf["handles"]["tiktok"], limits["instagram_tiktok"]["max_hashtags"])),
                f"**Titre YouTube ({len(title)}/{limits['youtube']['max_title']})**", "", block(title),
                "**Description YouTube (Shorts)**", "", block(caption(conf["handle"], None)),
                *([] if series_only else ["Sur YouTube : choisir le film comme « vidéo associée » du short, pour que le spectateur le trouve.", ""])]

    target = args.out or ROOT / pub.get("out", f"docs/publication-{files}.md")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("\n".join(out), encoding="utf-8")
    shown = target.relative_to(ROOT) if target.is_relative_to(ROOT) else target
    print(f"{shown}: {'a series, ' if series_only else 'the film and '}{len(shorts)} shorts" + (" (draft: durations estimated)" if args.draft else ""))


if __name__ == "__main__":
    main()
