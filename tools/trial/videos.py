#!/usr/bin/env python3
"""Every video and still of a film and its shorts, listed from the files (content/trial/<film>.yaml and the
shorts of its `thumbnail.panels`; or a series, a file with `shorts` and no chapters: its shorts, no film), never from a table: what the workflow film.yml renders, and the names the
publication texts (tools/trial/publish.py) give them.

  uv run --with pyyaml python3 tools/trial/videos.py --film <id> [--voice D] [--only all|shorts|film|tall|tiktok|<short id>]
  uv run --with pyyaml python3 tools/trial/videos.py --film <id> --matrix            # the videos, as a GitHub Actions matrix (one line)
  uv run --with pyyaml python3 tools/trial/videos.py --film <id> --stills --matrix   # the covers and the thumbnail

A short is `<files>-short-<part>-<id>` (composition Trial916) and its TikTok twin `<name>-tiktok` (same props
plus "platform":"tiktok"); the film is `<files>-film-16x9` (TrialFilm169). The first film alone
(`ambience_after` in its file: its ambience was mixed under the rendered videos) has its videos named
`...-ambience` once the owner validated that ambience: publish.py names them so, and the same rule is applied here. Stills: the cover of a short (TrialCover916, `cover.file`
or `<name>-cover.jpg`) and the film's thumbnail (TrialThumb169, `thumbnail.file` or `<files>-film-thumbnail.jpg`),
both taken at frame 45.

--only: all (default); shorts (the shorts, their TikTok twins, their covers); film (the film, its thumbnail and its
dedicated thumbnails); thumbnail (the dedicated thumbnails alone, `thumbnail.options` of the film's file: one scene of the
film with none of its text and two lines of hook, TrialThumbFrame, `<files>-film-thumbnail-<name>.jpg`; no video; added
to the draft release, 2026-11-21);
tiktok (the TikTok twins only); cut (the short versions only, of the shorts whose file has `cut`: added to
the draft release, nothing validated rendered again); or one short's id (that short, its twin and its cover), or several
joined by commas (`qitr,marah`: the shorts whose voice is there, 2026-11-19); tall: the film in 9:16
(`<files>-film-9x16`, TrialFilm916: the same timeline laid out as the shorts are, for the platforms whose player is
vertical), with its TikTok twin `<files>-film-9x16-tiktok`; tall-tiktok: that twin alone, added to the vertical film's draft
(a vertical film already validated is not rendered again). The vertical film is asked for by name and is never part of
`all`: a film's validated videos stay what they are.
A key of the film's `elsewhere` (a page of its own, its name in `handles` of content/publish.yaml: `ma3ak`, the test
page on Meta, owner's choice of 2026-11-18): the shorts it lists, signed with that page's name, and their covers
(`<name>-<key>.mp4`, `<name>-<key>-cover.jpg`; props "platform": key), added to the draft release; never part of `all`.
A series whose file lists its `platforms` without tiktok has no TikTok twins: `ma3ak`, signed with the test page's name,
which is on Meta only (a twin would be signed with the Page's TikTok name, for a page that has no TikTok).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
TRIAL = ROOT / "content" / "trial"
STILL_FRAME = 45


def load(name: str) -> dict:
    path = TRIAL / f"{name}.yaml"
    if not path.exists():
        sys.exit(f"error: content/trial/{name}.yaml does not exist")
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def compact(obj: dict) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


PLATFORMS = ("facebook", "instagram", "tiktok", "youtube")


def platforms_of(film: dict) -> list[str]:
    """Where the shorts of a film or a series go: `platforms` of its file, every platform of the Page by default."""
    asked = film.get("platforms") or list(PLATFORMS)
    unknown = [p for p in asked if p not in PLATFORMS]
    if unknown:
        sys.exit(f"error: {film['id']}: unknown platform(s) {', '.join(unknown)} (known: {', '.join(PLATFORMS)})")
    return asked


def named(only: str, ids: list[str]) -> list[str]:
    """The short ids `only` names: one id, or several joined by commas (`qitr,marah`); none if it names something else."""
    asked = only.split(",")
    return asked if all(a in ids for a in asked) else []


def listing(film_id: str, voice: str, only: str) -> tuple[list[dict], list[dict]]:
    film = load(film_id)
    files = film.get("files", film["id"])
    shorts = [load(name) for name in film.get("shorts") or film["thumbnail"]["panels"]]
    ids = [s["id"] for s in shorts]
    has_film = "chapters" in film               # a series (a file with `shorts`, no chapters) has no film
    twins = "tiktok" in platforms_of(film)     # a series for a page that is not on TikTok has no twins
    elsewhere = film.get("elsewhere") or {}
    if only in elsewhere:                       # another page: its shorts signed with its name, and their covers
        return signed_elsewhere(film, files, shorts, voice, only)
    chosen = named(only, ids)
    if only not in ("all", "shorts", "film", "thumbnail", "tall", "tall-tiktok", "tiktok", "cut") and not chosen:
        sys.exit(f"error: --only {only}: not all, shorts, film, thumbnail, tall, tall-tiktok, tiktok, cut, "
                 f"one or more of {', '.join(ids)} (joined by commas)"
                 + (f" or a page of `elsewhere` ({', '.join(elsewhere)})" if elsewhere else ""))
    if only == "tiktok" and not twins:
        sys.exit(f"error: --only tiktok: the platforms of {film_id} have no tiktok, its shorts have no TikTok twin")
    if only == "thumbnail":
        if not has_film:
            sys.exit(f"error: --only thumbnail: {film_id} is a series, it has no film")
        options = thumbnail_stills(film, files, film_id, voice)
        if not options:
            sys.exit(f"error: --only thumbnail: {film_id} has no `thumbnail.options` (content/trial/{film_id}.yaml)")
        return [], options
    if only in ("tall", "tall-tiktok"):
        if not has_film:
            sys.exit(f"error: --only {only}: {film_id} is a series, it has no film")
        props, timeline = {"film": film_id, "voice": voice, "data": None}, f"video/public/trial/{film_id}-{voice}.json"
        tall = [{"name": f"{files}-film-9x16", "composition": "TrialFilm916", "props": compact(props), "timeline": timeline, "kind": "tall"}]
        # Its TikTok twin, signed with the page's name there (owner, 2026-11-16: the du'a film went to TikTok signed
        # with the account of someone else).
        twin = [{"name": f"{files}-film-9x16-tiktok", "composition": "TrialFilm916", "props": compact({**props, "platform": "tiktok"}),
                 "timeline": timeline, "kind": "tall-tiktok"}]
        return (tall + twin if only == "tall" else twin), []
    # Same rule as publish.py: only the first film's videos (`ambience_after`: the ambience mixed under them
    # after the render) carry the ambience in their name, once the owner validated it.
    said = [(s.get("validated") or {}) for s in [film, *shorts]]
    bed = "-ambience" if film.get("ambience_after") and all("ambience" in (v.get("what") or []) for v in said) else ""
    videos, stills = [], []
    # A series drawn twice (`casts` of its file: the owner's A and B, 2026-11-15) has each short in each drawing, the
    # cast at the end of the name: lens-short-1-blackout-pov.mp4, lens-short-1-blackout-figure.mp4.
    casts = film.get("casts") or [None]
    for spec in shorts:
        if only == "film" or chosen and spec["id"] not in chosen or only == "cut" and not spec.get("cut"):
            continue
        for cast in casts:
            name = f"{files}-short-{spec['publish']['part']}-{spec['id']}" + (f"-{cast}" if cast else "")
            props = {"trial": spec["id"], "voice": voice, "data": None, **({"cast": cast} if cast else {})}
            timeline = f"video/public/trial/{spec['id']}-{voice}.json"
            if only not in ("tiktok", "cut"):
                videos.append({"name": name + bed, "composition": "Trial916", "props": compact(props), "timeline": timeline, "kind": "short"})
            if only != "cut" and twins:
                videos.append({"name": f"{name}-tiktok{bed}", "composition": "Trial916", "props": compact({**props, "platform": "tiktok"}),
                               "timeline": timeline, "kind": "tiktok"})
            if spec.get("cut") and only != "tiktok":     # the short version for Facebook and Instagram (prepare.py --cut)
                videos.append({"name": f"{name}-cut{bed}", "composition": "Trial916", "props": compact({**props, "version": "cut"}),
                               "timeline": f"video/public/trial/{spec['id']}-{voice}-cut.json", "kind": "cut"})
            if only not in ("tiktok", "cut"):
                cover = (spec.get("cover") or {}).get("file", f"{name}-cover.jpg") if not cast else f"{name}-cover.jpg"
                stills.append({"name": cover, "composition": "TrialCover916", "props": compact(props), "frame": STILL_FRAME, "kind": "cover"})
    if only in ("all", "film") and has_film:
        videos.append({"name": f"{files}-film-16x9{bed}", "composition": "TrialFilm169",
                       "props": compact({"film": film_id, "voice": voice, "data": None}),
                       "timeline": f"video/public/trial/{film_id}-{voice}.json", "kind": "film"})
        stills.append({"name": film["thumbnail"].get("file", f"{files}-film-thumbnail.jpg"), "composition": "TrialThumb169",
                       "props": compact({"film": film_id, "voice": voice, "data": None, "panels": None}), "frame": STILL_FRAME, "kind": "thumbnail"})
        stills += thumbnail_stills(film, files, film_id, voice)
    return videos, stills


def thumbnail_stills(film: dict, files: str, film_id: str, voice: str) -> list[dict]:
    """The dedicated thumbnails of the film (`thumbnail.options`, TrialThumbFrame, owner's choice of 2026-11-21): one still
    each, one scene of the film with none of its text, named `option.file` or `<files>-film-thumbnail-<name>.jpg`."""
    return [{"name": o.get("file") or f"{files}-film-thumbnail-{o['name']}.jpg", "composition": "TrialThumbFrame",
             "props": compact({"film": film_id, "voice": voice, "option": o["name"], "data": None}), "frame": STILL_FRAME, "kind": "thumbnail"}
            for o in film["thumbnail"].get("options") or []]


def signed_elsewhere(film: dict, files: str, shorts: list[dict], voice: str, page: str) -> tuple[list[dict], list[dict]]:
    """The shorts `elsewhere[page]` of the film names, signed with that page's name, and their covers."""
    wanted = film["elsewhere"][page] or []
    unknown = [i for i in wanted if i not in [s["id"] for s in shorts]]
    if unknown:
        sys.exit(f"error: elsewhere.{page}: {', '.join(unknown)} not among the shorts of {film['id']}")
    videos, stills = [], []
    for spec in shorts:
        if spec["id"] not in wanted:
            continue
        name = f"{files}-short-{spec['publish']['part']}-{spec['id']}-{page}"
        props = compact({"trial": spec["id"], "voice": voice, "data": None, "platform": page})
        videos.append({"name": name, "composition": "Trial916", "props": props,
                       "timeline": f"video/public/trial/{spec['id']}-{voice}.json", "kind": page})
        stills.append({"name": f"{name}-cover.jpg", "composition": "TrialCover916", "props": props,
                       "frame": STILL_FRAME, "kind": "cover"})
    return videos, stills


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--film", required=True, help="the film's id (content/trial/<id>.yaml)")
    p.add_argument("--voice", default="D")
    p.add_argument("--only", default="all", help="all, shorts, film, thumbnail (the film's dedicated thumbnails alone), tall (the film in 9:16 and its TikTok twin), tall-tiktok (the twin alone), tiktok, cut, one short's id or several joined by commas, or a page of the film's `elsewhere`")
    p.add_argument("--matrix", action="store_true", help="one JSON object on one line, a GitHub Actions matrix")
    p.add_argument("--stills", action="store_true", help="the covers and the thumbnail instead of the videos")
    p.add_argument("--ids", action="store_true",
                   help="the ids of the shorts to prepare, space-separated (every short unless --only names one: the film and the TikTok twins need them all)")
    args = p.parse_args()
    if args.ids:
        spec = load(args.film)
        ids = [name for name in spec.get("shorts") or spec["thumbnail"]["panels"]]
        # --only cut: the shorts that have a short version (`cut`), alone; a page of `elsewhere`: its shorts.
        elsewhere = spec.get("elsewhere") or {}
        print(" ".join(named(args.only, ids) or ([i for i in ids if load(i).get("cut")] if args.only == "cut"
                       else [i for i in ids if i in elsewhere[args.only]] if args.only in elsewhere else ids)))
        return 0
    videos, stills = listing(args.film, args.voice, args.only)
    rows = stills if args.stills else videos
    if args.matrix:
        print(compact({"include": rows}))
        return 0
    print(f"{'kind':<10} {'name':<40} {'composition':<14} {'timeline / frame':<40} props")
    for r in rows:
        print(f"{r['kind']:<10} {r['name']:<40} {r['composition']:<14} {r.get('timeline', 'frame ' + str(r.get('frame'))):<40} {r['props']}")
    print(f"{len(rows)} {'still(s)' if args.stills else 'video(s)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
