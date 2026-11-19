#!/usr/bin/env python3
"""The texts to paste for a film and its shorts (content/trial/*.yaml, docs/model.md): for the film and each
short, the title and the text of each platform, one block to copy each, in the form video/scripts/publish.ts
gives the old episodes (same order of hashtags, same limits: content/publish.yaml).

  uv run --with pyyaml python3 tools/trial/publish.py [--film <id>] [--voice D] [--out <file.md>]
  uv run --with pyyaml python3 tools/trial/publish.py --film <id> --draft --out <file.md>   # before the voice: lengths and limits

Written by hand in the trial files (`publish`: title, description, hook; the film's `series` and `hashtags`).
Computed here: the sources quoted (reference, reciter or reader, link), the durations and the film's
chapters (the timelines prepared by tools/trial/prepare.py for that voice), the line that declares the
AI voice, the page's hashtags. The durations need video/public/trial/*-<voice>.json, which only the session
or the run that prepared the videos has; without them, the durations and chapters already written in the
current texts are kept (texts made again after a change of wording, the videos unchanged).

Facebook, Instagram and TikTok get a short caption when the file has a `publish.hook` (owner, 2026-11-15:
« un petit texte attirant, 3 à 5 hashtags, sans plus de détail »): three cards, the title, the hook in
Egyptian Arabic and in English followed by the line of the AI voice, the hashtags; no credits card. YouTube
keeps its four cards: the full description, the credits (sources with their links), the chapters. A hook
is the owner's to validate (`hook.validated`), like any text; until then the texts say so.

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
        if kind in ("report", "tafsir", "fiqh", "science"):      # what a narration rests on (`sources:`): told, explained or measured, never read
            flush()
            line = rests_on(kind, sid, [i for k, i in ids if k == "fiqh"])
            if kind == "fiqh" and any(l.split(" · ")[:2] == line.split(" · ")[:2] for l in lines):
                continue                                         # one line per book and volume: its pages are merged in it
            lines.append(line)
            hadith = hadith or kind == "report"
        elif kind == "verse":
            verse = True
            if run and (run[-1].split(".")[1] != sid.split(".")[1] or int(sid.split(".")[2]) != int(run[-1].split(".")[2]) + 1):
                flush()
            if sid not in run:
                run.append(sid)
        elif kind == "card":                             # a dhikr written to be read: no reader
            flush()
            hadith = True
            src = sources[sid]
            lines.append(" · ".join(x for x in (f"• {src['reference_en']}", src.get("grade_note"), src["url"]) if x))
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


def rests_on(kind: str, sid: str, fiqh_ids: list[str] | None = None) -> str:
    """The line of a report a narration tells in its own words, of the tafsir its meaning comes from, of the pages of
    fiqh it rests on (one line per edition: `fiqh_ids` are all the fiqh sources of the video, those of this one's
    edition and volume merged), or of the paper or the data (a `science` source) a claim rests on."""
    import sources as registry              # tools/trial/sources.py

    e = registry.entry_of(sid)
    ref = e["ref"]
    if kind == "science":
        return f"• {ref['author']}, {ref['title']}, {ref['publication']}, {ref['year']} · {e['url']}"
    if kind == "report":
        letter = chr(96 + ref["narration"]) if ref.get("narration") else ""
        return f"• {registry.COLLECTIONS[ref['collection']]} {ref['number']}{letter} (told in the narration's own words) · {e['url']}"
    policy = yaml.safe_load((ROOT / "content" / "policy.yaml").read_text(encoding="utf-8")) or {}
    if kind == "fiqh":
        edition = policy["fiqh"]["editions"][ref["edition"]]
        pages = sorted({registry.entry_of(i)["ref"]["page"] for i in fiqh_ids or [sid]
                        if registry.entry_of(i)["ref"]["edition"] == ref["edition"] and registry.entry_of(i)["ref"]["volume"] == ref["volume"]})
        return (f"• Rulings after {edition['en']}, vol. {ref['volume']}, p. {registry.page_ranges(pages, 'latin')} · "
                f"{edition['ar']} {registry.num(ref['volume'])}/{registry.page_ranges(pages, None, '،', '-')} · {e['url']}")
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
            # A part is named with its hadith (« sid#part »): a part can have its own reader (the dhikr of Muslim 2709a,
            # read by Muhammad Jibril, 2026-11-19: the credits named the reader of the whole). Two parts read by the
            # same reader give the same line, written once.
            rid = f"{s['reading']}#{s['part']}" if s.get("part") else s["reading"]
            if ("reading", rid) not in ids:
                ids.append(("reading", rid))
        elif "card" in s:                                  # a dhikr to read: shown, never read
            if ("card", s["card"]) not in ids:
                ids.append(("card", s["card"]))
        for sid in s.get("sources") or []:
            ids.append(("report" if sid.startswith("hadith.") else "science" if sid.startswith("science.") else "fiqh" if sid.startswith("fiqh.") else "tafsir", sid))
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


def hashtags(conf: dict, own: list[str], theme: list[str], platform: str) -> str:
    """The hashtags of one video on one platform (content/publish.yaml, `model_hashtags`): the video's own first tag, the
    broad Arabic tag, the film's or series' first tag, the broad English tag, then the other tags; the first ones kept."""
    m = conf["model_hashtags"]
    tags = [*own[:1], m["arabic"], *theme[:1], m["english"], *own[1:], *theme[1:]]
    return " ".join(list(dict.fromkeys(tags))[:m["most"][platform]])


def block(text: str) -> str:
    return "```text\n" + text.strip() + "\n```\n"


def voice_line(narration: str) -> str:
    """The line that declares the AI voice, as it stays in every description (CLAUDE.md, « Voix déclarée »), without
    the « Narration: » label of the credits."""
    return narration.split(": ", 1)[1] if narration.startswith("Narration: ") else narration


def cards(platform: str, title: str, description: str, credits: str, tags: str, title_label: str = "Titre") -> list[str]:
    """The four texts of one video on one platform, each with its own Copy button on the owner's page (owner's
    request, 2026-11-15): the title, the description, the credits (the sources quoted, the clip and the ambience),
    the hashtags. Where a platform has no title field, the title is the caption's first lines. No credits (""):
    the short caption, three cards."""
    return [f"**{platform} · {title_label}**", "", block(title),
            f"**{platform} · Description**", "", block(description),
            *([f"**{platform} · Crédits**", "", block(credits)] if credits else []),
            f"**{platform} · Hashtags ({len(tags.split())})**", "", block(tags)]


def hooked(conf: dict, hook: dict, voiced: bool = True) -> str:
    """The description of a short caption (Facebook, Instagram, TikTok): the hook in Egyptian Arabic and in English,
    then the line of the AI voice (owner, 2026-11-15). A short no voice says (adhkar to read: every narration
    `silent`) has no AI voice to declare: the line would be false."""
    return hook["ar"] + "\n" + hook["en"] + ("\n\n" + conf["lines"]["ai_voice"] if voiced else "")


def voiced(spec: dict) -> bool:
    """Whether the synthetic voice says something in a short: a narration that is not `silent` (written on screen
    only). The same test as tools/trial/rules.py, which asks a voice text of such a short only."""
    segments = (spec.get("segments") or []) + [s for c in spec.get("chapters") or [] for s in c.get("segments") or []]
    return any("narration" in s and not s.get("silent") for s in segments)


def hooks_state(specs: list[dict], socials: str = "Facebook, Instagram et TikTok") -> str:
    """What the texts say of the short captions: validated by the owner (the date), or proposed; "" without hooks."""
    hooks = [(s.get("publish") or {}).get("hook") for s in specs]
    if not any(hooks):
        return ""
    ai = " et voix IA" if any(voiced(s) for s in specs) else ""
    if all(h and h.get("validated") for h in hooks):
        return (f" Légendes courtes de {socials} (titre, accroche{ai}, hashtags) **validées par "
                f"le propriétaire le {max(str(h['validated']) for h in hooks)}**.")
    return (f" Légendes courtes de {socials} (titre, accroche{ai}, hashtags) **proposées par la "
            "session, pas encore validées par le propriétaire** : rien n'est publié avec elles avant.")


STAMP = re.compile(r"· (\d+):(\d\d) · ")
CHAPTER = re.compile(r"^(\d+):(\d\d) (.+?) · (.+)$")


def written(path: Path) -> dict[str, dict]:
    """The durations and chapters the current texts already give (`film`, `short-<n>`), as a timeline would."""
    known: dict[str, dict] = {}
    if not path.is_file():
        return known
    key = None
    lines = path.read_text(encoding="utf-8").splitlines()
    for i, line in enumerate(lines):
        if line.startswith("## "):
            m = re.match(r"## (?:Le film|Short (\d+))", line)
            key = None if not m else ("film" if m[1] is None else f"short-{m[1]}")
            if key:
                known[key] = {"chapters": []}
        elif key and line.startswith("`") and "seconds" not in known[key] and (m := STAMP.search(line)):
            known[key]["seconds"] = int(m[1]) * 60 + int(m[2])
        elif key and line == "Chapters:" and not known[key]["chapters"]:
            for row in lines[i + 1:]:
                if not (m := CHAPTER.match(row)):
                    break
                known[key]["chapters"].append({"start": int(m[1]) * 60 + int(m[2]), "title": {"en": m[3], "ar": m[4]}})
    return {k: v for k, v in known.items() if "seconds" in v}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--voice", default="D")
    p.add_argument("--film", default="film", help="the film's id (content/trial/<id>.yaml)")
    p.add_argument("--out", type=Path, help="default: `publish.out` of the film, or docs/publication-<files>.md")
    p.add_argument("--draft", action="store_true", help="before the voice: the timelines of the silent draft (voice X)")
    p.add_argument("--elsewhere", metavar="PAGE",
                   help="the texts of the shorts the film's `elsewhere` gives that page (`ma3ak`, the test page on Meta): their "
                        "files signed with its name (`<name>-<page>.mp4`), Facebook and Instagram only; written beside the "
                        "film's texts (`…-<page>.md`) unless --out (2026-11-19: quiz 5 and 6 published by quran-reels there)")
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
                self[sid] = registry.described(*sid.split("#", 1))      # « sid#part »: that part, its own reader
                return self[sid]

        sources = FromRegistry()
    pub = film["publish"]
    narration = pub["narration"][args.voice]
    series_only = "chapters" not in film          # a series: shorts that stand alone, no film
    # A series for another page (`handle` of its file: the test page on Meta, `ma3ak`, 2026-11-18) is signed with that
    # page's name, and has texts only for its `platforms` (every platform of the Page by default).
    handle = film.get("handle") or conf["handle"]
    platforms = film.get("platforms") or ["facebook", "instagram", "tiktok", "youtube"]
    page = args.elsewhere
    if page:                                      # the shorts another page gets, signed with its name
        wanted = (film.get("elsewhere") or {}).get(page)
        if not wanted:
            sys.exit(f"error: --elsewhere {page}: {args.film} gives that page no short (`elsewhere`)")
        if page not in conf.get("handles", {}):
            sys.exit(f"error: --elsewhere {page}: no handle for it in content/publish.yaml (`handles`)")
        handle, platforms = conf["handles"][page], ["facebook", "instagram"]
    social_names = [n for p, n in (("facebook", "Facebook"), ("instagram", "Instagram"), ("tiktok", "TikTok")) if p in platforms]
    socials = " et ".join([", ".join(social_names[:-1]), social_names[-1]] if len(social_names) > 1 else social_names)
    shorts = [yaml.safe_load((TRIAL / f"{name}.yaml").read_text(encoding="utf-8")) for name in film.get("shorts") or film["thumbnail"]["panels"]]
    if page:
        shorts = [s for s in shorts if s["id"] in film["elsewhere"][page]]
    # « Je valide » of the owner on the texts: `validated` of every file, with `publish` in what it covers.
    said = [(s.get("validated") or {}) for s in [film, *shorts]]
    validated = all("publish" in (v.get("what") or []) for v in said)
    # PyYAML reads the key « on » as true (YAML 1.1). A short added to a series later is validated on its own day.
    days = sorted({str(v.get("on", v.get(True))) for v in said if v})
    when = " et le ".join(days) if days else ""
    # The first film was rendered without its ambience, which was put under the rendered videos afterwards
    # (`ambience_after` of its file): once the owner has validated it, the videos to publish are those mixes,
    # `…-ambience.mp4`. Every film since is rendered with its ambience, and its videos keep their names.
    # A series' own file has no ambience: only its shorts say whether theirs was validated.
    heard = all("ambience" in (v.get("what") or []) for v in (said[1:] if series_only else said))
    bed = "-ambience" if film.get("ambience_after") and heard else ""
    status = (f"Titres et descriptions **validés par le propriétaire le {when}**" if validated
              else "Titres et descriptions **proposés par la session, pas encore validés par le propriétaire**")
    limits = conf["platforms"]
    own = ROOT / pub.get("out", f"docs/publication-{files}.md")
    target = args.out or (own.with_name(own.stem + "-9x16" + own.suffix) if args.tall else
                          own.with_name(f"{own.stem}-{args.elsewhere}{own.suffix}") if args.elsewhere else own)
    before = {} if args.draft else written(target)

    def timeline_of(ident: str, key: str) -> dict:
        path = PUBLIC / "trial" / f"{ident}-{timeline}.json"
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
        if key in before:
            return before[key]
        sys.exit(f"error: {path.relative_to(ROOT)} is missing, and {target.name} gives no duration for « {key} »")

    short_captions = any((s.get("publish") or {}).get("hook") for s in shorts)
    out = [
        f"# {pub['series']['en']} · {pub['series']['ar']} : textes de publication",
        "",
        (f"Pour {'chaque short' if series_only else 'le film et chaque short'}, les textes à copier : sur {socials}, "
         "la légende courte en trois textes, le titre, l'accroche " + ("avec la ligne de la voix IA" if any(voiced(s) for s in shorts) else "(pas de voix, pas de ligne de la voix IA)")
         + ", les hashtags" + ("" if "youtube" in platforms else f" ; la page `{handle}` n'est que sur {socials}") + (" ; sur YouTube, quatre textes, le titre, "
         f"la description, les crédits (les sources citées, le clip, l'ambiance) et les hashtags, collés dans la même description" if "youtube" in platforms else "")
         + f". {status} ; "
         if short_captions else
         f"Pour {'chaque short' if series_only else 'le film et chaque short'}, sur chaque plateforme, quatre textes à copier : le titre, la description, "
         f"les crédits (les sources citées, le clip, l'ambiance) et les hashtags ; là où la plateforme n'a pas de champ de titre, il ouvre la légende, "
         f"et les quatre se collent dans la même légende, la ligne de la voix IA restant dans la description. {status} ; ")
        + "les sources, les crédits, les durées, les chapitres et les hashtags de la page sont calculés "
        "(`tools/trial/publish.py`, à relancer après tout changement)." + hooks_state(shorts, socials) + " Fichiers : ceux envoyés dans la conversation"
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
        data = timeline_of(args.film, "film")
        lines, hadith, verse = quoted(quotes_of([s for c in film["chapters"] for s in c["segments"]]), sources)
        if pub.get("hook"):         # the short caption (owner, 2026-11-15)
            tall_cards = cards("Facebook", pub["title"]["en"] + "\n" + pub["title"]["ar"], hooked(conf, pub["hook"]), "",
                               hashtags(conf, [], pub["hashtags"], "facebook"))
        else:
            tall_cards = cards("Facebook", pub["title"]["en"] + "\n" + pub["title"]["ar"],
                               "\n\n".join([pub["description"]["en"], pub["description"]["ar"], voice_line(narration), conf["handle"]]),
                               "Quoted:\n" + "\n".join(lines) + "\n\n" + footage(shorts, film.get("pictures")),
                               hashtags(conf, [], pub["hashtags"], "facebook"))
        said = ((film.get("tall") or {}).get("validated") or {})
        state = (f"**validé par le propriétaire le {said.get('on', said.get(True))}**" if "publish" in (said.get("what") or [])
                 else "**proposé par la session, pas encore validé par le propriétaire**")
        # Its TikTok twin, signed with the page's name there (`tall.tiktok` of the film's file; owner, 2026-11-16): the
        # film, the short caption for TikTok. The du'a film went to TikTok signed with someone else's account.
        tiktok = (film.get("tall") or {}).get("tiktok")
        twin = f"{files}-film-9x16-tiktok.mp4"
        if tiktok is not None:
            if not pub.get("hook"):
                sys.exit(f"error: --tall: {args.film}: a TikTok caption needs `publish.hook`")
            heard = (tiktok or {}).get("validated") or {}
            tall_cards += [f"Sur TikTok : la vidéo `{twin}`, signée `{conf['handles']['tiktok']}`.", "",
                           *cards("TikTok", pub["title"]["en"] + "\n" + pub["title"]["ar"], hooked(conf, pub["hook"]), "",
                                  hashtags(conf, [], pub["hashtags"], "tiktok"))]
        out = [f"# {pub['series']['en']} · {pub['series']['ar']} : le film en 9:16", "",
               "Le même film, monté pour un écran vertical (les images des shorts, la même voix, le même minutage). "
               + ("Texte : la légende courte, le titre du film, son accroche avec la ligne de la voix IA, ses hashtags (titre et hashtags "
                  + state.replace("**validé", "**validés") + ")." + hooks_state([film]) if pub.get("hook") else
                  f"Texte {state} : il reprend le titre et la description du film, sans les chapitres."), "",
               f"## Le film en 9:16 · {pub['title']['en']} · {pub['title']['ar']}", "",
               (f"`{files}-film-9x16.mp4` (TikTok : `{twin}`, signée `{conf['handles']['tiktok']}`) · {stamp(data['seconds'])} · 9:16 · Facebook, TikTok"
                if tiktok is not None else f"`{files}-film-9x16.mp4` · {stamp(data['seconds'])} · 9:16 · Facebook"), "",
               *([("La version TikTok (vidéo et légende) est " + (f"**validée par le propriétaire le {heard.get('on', heard.get(True))}**."
                   if heard else "**proposée par la session, pas encore validée par le propriétaire**.")), ""] if tiktok is not None else []),
               *tall_cards]
        # Beside the film's own texts: `publish.out` of its file, with « -9x16 » before the extension (`target`).
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("\n".join(out), encoding="utf-8")
        print(f"{target.relative_to(ROOT) if target.is_relative_to(ROOT) else target}: the film in 9:16")
        return

    if not series_only and not page:
        # The film
        data = timeline_of(args.film, "film")
        ids = quotes_of([s for c in film["chapters"] for s in c["segments"]])
        lines, hadith, verse = quoted(ids, sources)
        title = f"{pub['title']['en']} · {pub['title']['ar']}"
        if len(title) > limits["youtube"]["max_title"]:
            sys.exit(f"error: the film's YouTube title is {len(title)} characters (most: {limits['youtube']['max_title']})")
        chapters = "\n".join(f"{stamp(c['start'])} {c['title']['en']} · {c['title']['ar']}" for c in data["chapters"])
        body = "\n\n".join([pub["description"]["en"], pub["description"]["ar"], "Chapters:\n" + chapters,
                              voice_line(narration), conf["handle"]])
        credits = "Quoted:\n" + "\n".join(lines) + "\n\n" + footage(shorts, film.get("pictures"))
        tags = hashtags(conf, [], pub["hashtags"], "youtube")
        whole = len(body) + len(credits) + len(tags) + 4          # the three pasted into one description
        if whole > limits["youtube"]["max_description"]:
            sys.exit(f"error: the film's YouTube description is {whole} characters")
        out += [f"## Le film · {pub['title']['en']} · {pub['title']['ar']}", "",
                f"`{files}-film-16x9{bed}.mp4` · {stamp(data['seconds'])} · 16:9 · YouTube · miniature : `{film['thumbnail'].get('file', files + '-film-thumbnail.jpg')}`", "",
                *cards("YouTube", title, body, credits, tags, f"Titre ({len(title)}/{limits['youtube']['max_title']})"),
                "Écran de fin (YouTube Studio) : les 12 dernières secondes sont une image calme, faite pour y poser le bouton "
                "d'abonnement et la vidéo suivante.", ""]

    # The shorts
    for spec in shorts:
        sp = spec["publish"]
        data = timeline_of(spec["id"], f"short-{sp['part']}")
        lines, hadith, verse = quoted(quotes_of(spec["segments"]), sources)
        n, total = sp["part"], len(shorts)
        # A series goes on: its shorts are numbered, never « n of total ».
        # Numbers are written 1 2 3, never ١ ٢ ٣ (the owner, 2026-11-17); texts already validated keep what they were validated with.
        series = (f"{pub['series']['en']} · {n} · {pub['series']['ar']} · {n}" if series_only else
                  f"{pub['series']['en']} · part {n}/{total} · {pub['series']['ar']} · الجزء {n} من {total}")
        name = f"{files}-short-{n}-{spec['id']}" + (f"-{page}" if page else "")
        cover = f"{name}-cover.jpg" if page else (spec.get("cover") or {}).get("file", f"{name}-cover.jpg")

        heading = sp["title"]["en"] + "\n" + sp["title"]["ar"]
        credits = "Quoted:\n" + "\n".join(lines) + "\n\n" + footage([spec])

        def description(signed: str) -> str:
            return "\n\n".join([sp["description"]["en"], sp["description"]["ar"], series, voice_line(narration), signed])

        def tags(platform: str) -> str:
            return hashtags(conf, sp.get("hashtags") or [], pub["hashtags"], platform)

        # Facebook, Instagram and TikTok: the short caption when the file has a hook (owner, 2026-11-15), three cards.
        hook = sp.get("hook")

        def social(signed: str, platform: str) -> list[str]:
            if platform not in platforms:
                return []
            if hook:
                return cards(platform.capitalize().replace("Tiktok", "TikTok"), heading, hooked(conf, hook, voiced(spec)), "", tags(platform))
            return cards(platform.capitalize().replace("Tiktok", "TikTok"), heading, description(signed), credits, tags(platform))

        # The cards end up in one caption: its length is theirs together.
        insta = ("\n\n".join([heading, hooked(conf, hook, voiced(spec)), tags("instagram")]) if hook else
                 "\n\n".join([heading, description(handle), credits, tags("instagram")]))
        if len(insta) > limits["instagram_tiktok"]["max_caption"]:
            sys.exit(f"error: {name}: the Instagram caption is {len(insta)} characters")
        title = f"{sp['title']['en']} · {sp['title']['ar']}"
        if "youtube" in platforms and len(title) > limits["youtube"]["max_title"]:
            sys.exit(f"error: {name}: the YouTube title is {len(title)} characters")
        # A series drawn twice (`casts`): the same texts for both drawings, each file named. The drawing the owner chose to
        # publish (`published_cast`) comes first: quran-reels publishes the first .mp4 of the line (« بص تاني », 2026-11-16: B).
        casts = film.get("casts") or []
        if film.get("published_cast") in casts:
            casts = [film["published_cast"]] + [c for c in casts if c != film["published_cast"]]
        files_line = (
            " ; ".join(f"`{name}-{c}{bed}.mp4` (TikTok : `{name}-{c}-tiktok{bed}.mp4`, couverture : `{name}-{c}-cover.jpg`)" for c in casts)
            + f", signées `{conf['handles']['tiktok']}` sur TikTok · {stamp(data['seconds'])} · 9:16 · Facebook, Instagram, TikTok, YouTube Shorts"
            if casts else
            f"`{name}{bed}.mp4` (TikTok : `{name}-tiktok{bed}.mp4`, signée `{conf['handles']['tiktok']}`) · {stamp(data['seconds'])} · 9:16 · "
            f"Facebook, Instagram, TikTok, YouTube Shorts · couverture : `{cover}`"
            if "tiktok" in platforms else
            f"`{name}{bed}.mp4`, signée `{handle}` · {stamp(data['seconds'])} · 9:16 · {socials} · couverture : `{cover}`")
        # The short version for Facebook and Instagram (`cut` of the file, prepare.py --cut), named once the owner has
        # validated it, never before: page-files makes public what this line names, and quran-reels publishes it.
        # After the first name, so that a reader taking the first .mp4 of the line keeps the full short.
        cut = spec.get("cut") or {}
        if cut.get("validated") and not casts:
            cut_path = PUBLIC / "trial" / f"{spec['id']}-{timeline}-cut.json"
            seconds = json.loads(cut_path.read_text(encoding="utf-8"))["seconds"] if cut_path.is_file() else None
            files_line += f" · version courte pour Facebook et Instagram : `{name}-cut{bed}.mp4`" + (f", {stamp(seconds)}" if seconds else "")
        out += [f"## Short {n} · {sp['title']['en']} · {sp['title']['ar']}", "", files_line, "",
                *social(handle, "facebook"),
                *social(handle, "instagram"),
                *([(f"Sur TikTok : la vidéo `{name}-{casts[0]}-tiktok{bed}.mp4` ou `{name}-{casts[-1]}-tiktok{bed}.mp4`, signée `{conf['handles']['tiktok']}`." if casts else
                    f"Sur TikTok : la vidéo `{name}-tiktok{bed}.mp4`, signée `{conf['handles']['tiktok']}`."), ""] if "tiktok" in platforms else []),
                *social(conf["handles"]["tiktok"], "tiktok"),
                *(cards("YouTube", title, description(handle), credits, tags("youtube"),
                        f"Titre ({len(title)}/{limits['youtube']['max_title']})") if "youtube" in platforms else []),
                *([] if series_only else ["Sur YouTube : choisir le film comme « vidéo associée » du short, pour que le spectateur le trouve.", ""])]

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("\n".join(out), encoding="utf-8")
    shown = target.relative_to(ROOT) if target.is_relative_to(ROOT) else target
    print(f"{shown}: {'a series, ' if series_only else 'the film and '}{len(shorts)} shorts" + (" (draft: durations estimated)" if args.draft else ""))


if __name__ == "__main__":
    main()
