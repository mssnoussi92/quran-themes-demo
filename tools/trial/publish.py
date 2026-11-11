#!/usr/bin/env python3
"""The texts to paste for a film and its shorts (content/trial/*.yaml, docs/model.md): for the film and each
short, the title and the text of each platform, one block to copy each, in the form video/scripts/publish.ts
gives the old episodes (same order of hashtags, same limits: content/publish.yaml).

  uv run --with pyyaml python3 tools/trial/publish.py [--film <id>] [--voice D] [--out <file.md>]

Written by hand in the trial files (`publish`: title, description; the film's `series` and `hashtags`).
Computed here: the sources quoted (reference, reciter or reader, link), the durations and the film's
chapters (the timelines prepared by tools/trial/prepare.py for that voice), the line that declares the
AI voice, the page's hashtags. Session only for the durations: it needs video/public/trial/*-<voice>.json.
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
        if kind == "verse":
            verse = True
            if run and (run[-1].split(".")[1] != sid.split(".")[1] or int(sid.split(".")[2]) != int(run[-1].split(".")[2]) + 1):
                flush()
            if sid not in run:
                run.append(sid)
        else:
            flush()
            hadith = True
            src = sources[sid]
            lines.append(f"• {src['reference_en']} · Reading: {src['recording']['reader']} · {src['url']}")
    flush()
    seen, unique = set(), []
    for l in lines:
        if l not in seen:
            seen.add(l)
            unique.append(l)
    return unique, hadith, verse


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
    args = p.parse_args()
    conf = yaml.safe_load((ROOT / "content" / "publish.yaml").read_text(encoding="utf-8"))
    film = yaml.safe_load((TRIAL / f"{args.film}.yaml").read_text(encoding="utf-8"))
    files = film.get("files", film["id"])        # what the delivered videos' names start with
    episode = json.loads((PUBLIC / "data" / f"{film['verses']}.json").read_text(encoding="utf-8"))
    sources = {s["source"]["id"]: s["source"] for s in episode["scenes"] if s.get("source")}
    pub = film["publish"]
    narration = pub["narration"][args.voice]
    shorts = [yaml.safe_load((TRIAL / f"{name}.yaml").read_text(encoding="utf-8")) for name in film["thumbnail"]["panels"]]
    def footage(specs: list[dict]) -> str:
        """Where the pictures come from, and the ambience under the narration when the videos have one."""
        line = "Footage: Pixabay (" + ", ".join(dict.fromkeys(s["clip"]["author"] for s in specs)) + ")"
        beds = list(dict.fromkeys(f"{s['ambience']['source'].replace('bigsoundbank', 'BigSoundBank')} ({s['ambience']['author']})" for s in specs if s.get("ambience")))
        return line + (" · Ambience: " + ", ".join(beds) if beds else "")

    # « Je valide » of the owner on the texts: `validated` of every file, with `publish` in what it covers.
    said = [(s.get("validated") or {}) for s in [film, *shorts]]
    validated = all("publish" in (v.get("what") or []) for v in said)
    when = said[0].get("on", said[0].get(True))      # PyYAML reads the key « on » as true (YAML 1.1)
    # Once the owner has validated the ambience, the videos to publish are the ones that have it.
    bed = "-ambience" if all("ambience" in (v.get("what") or []) for v in said) else ""
    status = (f"Titres et descriptions **validés par le propriétaire le {when}**" if validated
              else "Titres et descriptions **proposés par la session, pas encore validés par le propriétaire**")
    limits = conf["platforms"]
    out = [
        f"# {pub['series']['en']} · {pub['series']['ar']} : textes de publication",
        "",
        f"Pour le film et chaque short : le titre, puis le texte à coller sur chaque plateforme. {status} ; "
        "les sources, les crédits, les durées, les chapitres et les hashtags de la page sont calculés "
        "(`tools/trial/publish.py`, à relancer après tout changement). Fichiers : ceux envoyés dans la conversation"
        + (", avec l'ambiance sonore sous la narration, validée elle aussi (`…-ambience.mp4`)." if bed else
           " ; avec l'ambiance sonore sous la narration, pas encore validée, les mêmes noms terminés par `-ambience.mp4`."),
        "",
    ]

    # The film
    data = json.loads((PUBLIC / "trial" / f"{args.film}-{args.voice}.json").read_text(encoding="utf-8"))
    ids = [("verse", s["verse"]) if "verse" in s else ("reading", s["reading"]) for c in film["chapters"] for s in c["segments"] if "verse" in s or "reading" in s]
    lines, hadith, verse = quoted(ids, sources)
    title = f"{pub['title']['en']} · {pub['title']['ar']}"
    if len(title) > limits["youtube"]["max_title"]:
        sys.exit(f"error: the film's YouTube title is {len(title)} characters (most: {limits['youtube']['max_title']})")
    chapters = "\n".join(f"{stamp(c['start'])} {c['title']['en']} · {c['title']['ar']}" for c in data["chapters"])
    body = "\n\n".join([
        pub["description"]["en"], pub["description"]["ar"], "Chapters:\n" + chapters,
        "Quoted:\n" + "\n".join(lines), narration + "\n" + footage(shorts), conf["handle"],
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
        data = json.loads((PUBLIC / "trial" / f"{spec['id']}-{args.voice}.json").read_text(encoding="utf-8"))
        ids = [("verse", s["verse"]) for s in spec["segments"] if "verse" in s]
        lines, hadith, verse = quoted(ids, sources)
        n, total = sp["part"], len(shorts)
        series = f"{pub['series']['en']} · part {n}/{total} · {pub['series']['ar']} · الجزء {str(n).translate(DIGITS)} من {str(total).translate(DIGITS)}"
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
                f"`{name}{bed}.mp4` (TikTok : `{name}-tiktok{bed}.mp4`, signée {conf['handles']['tiktok']}) · {stamp(data['seconds'])} · 9:16 · "
                f"Facebook, Instagram, TikTok, YouTube Shorts · couverture : `{cover}`", "",
                f"**Facebook ({limits['facebook']['max_hashtags']} hashtags)**", "", block(caption(conf["handle"], limits["facebook"]["max_hashtags"])),
                f"**Instagram ({limits['instagram_tiktok']['max_hashtags']} hashtags)**", "", block(insta),
                f"**TikTok : la vidéo `{name}-tiktok{bed}.mp4` ({limits['instagram_tiktok']['max_hashtags']} hashtags)**", "",
                block(caption(conf["handles"]["tiktok"], limits["instagram_tiktok"]["max_hashtags"])),
                f"**Titre YouTube ({len(title)}/{limits['youtube']['max_title']})**", "", block(title),
                "**Description YouTube (Shorts)**", "", block(caption(conf["handle"], None)),
                "Sur YouTube : choisir le film comme « vidéo associée » du short, pour que le spectateur le trouve.", ""]

    target = args.out or ROOT / pub.get("out", f"docs/publication-{files}.md")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("\n".join(out), encoding="utf-8")
    print(f"{target.relative_to(ROOT)}: the film and {len(shorts)} shorts")


if __name__ == "__main__":
    main()
