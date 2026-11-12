#!/usr/bin/env python3
"""Every video and still of a film and its shorts, listed from the files (content/trial/<film>.yaml and the
shorts of its `thumbnail.panels`; or a series, a file with `shorts` and no chapters: its shorts, no film), never from a table: what the workflow film.yml renders, and the names the
publication texts (tools/trial/publish.py) give them.

  uv run --with pyyaml python3 tools/trial/videos.py --film <id> [--voice D] [--only all|shorts|film|tiktok|<short id>]
  uv run --with pyyaml python3 tools/trial/videos.py --film <id> --matrix            # the videos, as a GitHub Actions matrix (one line)
  uv run --with pyyaml python3 tools/trial/videos.py --film <id> --stills --matrix   # the covers and the thumbnail

A short is `<files>-short-<part>-<id>` (composition Trial916) and its TikTok twin `<name>-tiktok` (same props
plus "platform":"tiktok"); the film is `<files>-film-16x9` (TrialFilm169). The first film alone
(`ambience_after` in its file: its ambience was mixed under the rendered videos) has its videos named
`...-ambience` once the owner validated that ambience: publish.py names them so, and the same rule is applied here. Stills: the cover of a short (TrialCover916, `cover.file`
or `<name>-cover.jpg`) and the film's thumbnail (TrialThumb169, `thumbnail.file` or `<files>-film-thumbnail.jpg`),
both taken at frame 45.

--only: all (default); shorts (the shorts, their TikTok twins, their covers); film (the film and its thumbnail);
tiktok (the TikTok twins only); or one short's id (that short, its twin and its cover).
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


def listing(film_id: str, voice: str, only: str) -> tuple[list[dict], list[dict]]:
    film = load(film_id)
    files = film.get("files", film["id"])
    shorts = [load(name) for name in film.get("shorts") or film["thumbnail"]["panels"]]
    ids = [s["id"] for s in shorts]
    has_film = "chapters" in film               # a series (a file with `shorts`, no chapters) has no film
    if only not in ("all", "shorts", "film", "tiktok") and only not in ids:
        sys.exit(f"error: --only {only}: not all, shorts, film, tiktok or one of {', '.join(ids)}")
    # Same rule as publish.py: only the first film's videos (`ambience_after`: the ambience mixed under them
    # after the render) carry the ambience in their name, once the owner validated it.
    said = [(s.get("validated") or {}) for s in [film, *shorts]]
    bed = "-ambience" if film.get("ambience_after") and all("ambience" in (v.get("what") or []) for v in said) else ""
    videos, stills = [], []
    for spec in shorts:
        if only == "film" or only in ids and only != spec["id"]:
            continue
        name = f"{files}-short-{spec['publish']['part']}-{spec['id']}"
        props = {"trial": spec["id"], "voice": voice, "data": None}
        timeline = f"video/public/trial/{spec['id']}-{voice}.json"
        if only != "tiktok":
            videos.append({"name": name + bed, "composition": "Trial916", "props": compact(props), "timeline": timeline, "kind": "short"})
        videos.append({"name": f"{name}-tiktok{bed}", "composition": "Trial916", "props": compact({**props, "platform": "tiktok"}),
                       "timeline": timeline, "kind": "tiktok"})
        if only != "tiktok":
            stills.append({"name": (spec.get("cover") or {}).get("file", f"{name}-cover.jpg"), "composition": "TrialCover916",
                           "props": compact(props), "frame": STILL_FRAME, "kind": "cover"})
    if only in ("all", "film") and has_film:
        videos.append({"name": f"{files}-film-16x9{bed}", "composition": "TrialFilm169",
                       "props": compact({"film": film_id, "voice": voice, "data": None}),
                       "timeline": f"video/public/trial/{film_id}-{voice}.json", "kind": "film"})
        stills.append({"name": film["thumbnail"].get("file", f"{files}-film-thumbnail.jpg"), "composition": "TrialThumb169",
                       "props": compact({"film": film_id, "voice": voice, "data": None, "panels": None}), "frame": STILL_FRAME, "kind": "thumbnail"})
    return videos, stills


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--film", required=True, help="the film's id (content/trial/<id>.yaml)")
    p.add_argument("--voice", default="D")
    p.add_argument("--only", default="all", help="all, shorts, film, tiktok, or one short's id")
    p.add_argument("--matrix", action="store_true", help="one JSON object on one line, a GitHub Actions matrix")
    p.add_argument("--stills", action="store_true", help="the covers and the thumbnail instead of the videos")
    p.add_argument("--ids", action="store_true",
                   help="the ids of the shorts to prepare, space-separated (every short unless --only names one: the film and the TikTok twins need them all)")
    args = p.parse_args()
    if args.ids:
        spec = load(args.film)
        ids = [name for name in spec.get("shorts") or spec["thumbnail"]["panels"]]
        print(" ".join([args.only] if args.only in ids else ids))
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
