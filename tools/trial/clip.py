#!/usr/bin/env python3
"""The filmed clip of a short: find it, look at all of it, fetch it and prepare it (Pixabay; never in the repository).

  python3 tools/trial/clip.py --search "starry sky night" "milky way" --out <dir>   # candidates: a table and <dir>/sheet.jpg
  python3 tools/trial/clip.py --search "sunset lake" "dusk pond" --tags lake pond marsh --out <dir>   # only what the tags name
  python3 tools/trial/clip.py --look 14955 --out <dir>                              # <dir>/14955/sheet.jpg: 16 frames across the clip
  python3 tools/trial/clip.py --id 14955 --out <file> --seconds 12.5 --height 1440 --pingpong   # try a candidate
  python3 tools/trial/clip.py --trial waited --out <file>                           # the clip of a short, prepared as its `clip.take` says
  python3 tools/trial/clip.py --film qarnayn --picture east --out <file>            # a picture of the film alone (`pictures` of its file)

The owner's rule (2026-11-11): the clip is looked for to serve the plan of the short, then prepared; a list of
clips approved for something else is where to look first, not the limit. A clip is still shown to the owner,
with its Pixabay page, before it is used (skill new-scene).

--search keeps what can be used at all: filmed (Pixabay marks what is AI-generated), not marked low quality,
long enough, wide enough, and no tag that names a person. Its sheet shows the FIRST frame of each clip only:
--look shows the whole clip, which is where a person, an animal, a text, a lit building or a change of hour
appears. --look and --search write what they download under --out, each clip in a directory of its own.

`clip.take` of content/trial/<id>.yaml (or --from, --seconds, --height, --pingpong with --id) says what is
kept of the clip: `from` and `seconds` (the stretch that fits: before the clouds come in), `height` (a 4K clip
reduced), `pingpong: true` (the stretch forward then backward: a sky that loops with no jump; done in memory,
so reduce the height and keep the stretch under about twenty seconds), `slow: 5` (five times slower, the frames
in between blended: something that happens once, a sun going down, lasts the whole short and never loops; set
the clip's `rate: 1`).

The key is read from the environment (PIXABAY_API_KEY) and never printed. Pixabay's content licence allows the
use, not the redistribution of the file alone: a clip is never committed. Needs ffmpeg.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENT = {"User-Agent": "Mozilla/5.0 (video tool)"}
# A tag that names a person: the clip is not looked at (the model shows nobody).
PEOPLE = {"man", "woman", "people", "person", "girl", "boy", "child", "children", "couple", "family", "human", "hiker",
          "tourist", "model", "portrait", "face", "hands", "crowd", "pedestrian", "astronaut", "silhouette of a man"}


def api(**params) -> dict:
    key = os.environ.get("PIXABAY_API_KEY", "").strip()
    if not key:
        sys.exit("error: PIXABAY_API_KEY is not set in this environment")
    url = "https://pixabay.com/api/videos/?" + urllib.parse.urlencode({"key": key, **params})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:           # never print the URL: it holds the key
        sys.exit(f"error: Pixabay answered {e.code} ({e.reason})")
    except urllib.error.URLError as e:
        sys.exit(f"error: Pixabay cannot be reached ({e.reason})")


def download(url: str, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=600) as r:
        out.write_bytes(r.read())


def largest(hit: dict) -> dict:
    files = [f for f in hit["videos"].values() if f.get("width") and f.get("url")]
    return max(files, key=lambda f: f["width"] * f["height"])


def run(*cmd: str) -> str:
    done = subprocess.run(cmd, capture_output=True, text=True)
    if done.returncode:
        sys.exit(f"error: {cmd[0]} failed: {done.stderr.strip()[-400:]}")
    return done.stdout.strip()


def seconds_of(path: Path) -> float:
    return float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)))


def one(clip_id: int) -> dict:
    hits = api(id=clip_id).get("hits") or []
    if not hits:
        sys.exit(f"error: Pixabay has no video {clip_id}")
    return hits[0]


def search(queries: list[str], out: Path, min_seconds: float, limit: int, wanted: list[str]) -> None:
    found: dict[int, dict] = {}
    dropped = {"AI-generated": 0, "low quality": 0, "too short": 0, "too small": 0, "a person in the tags": 0, "none of the tags asked for": 0}
    for query in queries:
        hits = api(q=query, video_type="film", safesearch="true", per_page=100, order="popular").get("hits", [])
        for hit in hits:
            if hit["id"] in found:
                continue
            tags = {t.strip() for t in hit["tags"].lower().split(",")}
            big = largest(hit)
            why = ("AI-generated" if hit.get("isAiGenerated") else "low quality" if hit.get("isLowQuality")
                   else "too short" if hit["duration"] < min_seconds else "too small" if max(big["width"], big["height"]) < 1920
                   else "a person in the tags" if tags & PEOPLE
                   else "none of the tags asked for" if wanted and not any(w in hit["tags"].lower() for w in wanted) else None)
            if why:
                dropped[why] += 1
            else:
                found[hit["id"]] = {**hit, "query": query}
        print(f"« {query} »: {len(hits)} clips")
        time.sleep(0.7)
    kept = sorted(found.values(), key=lambda h: -h["downloads"])
    print(f"{len(kept)} kept; left out: " + ", ".join(f"{n} {why}" for why, n in dropped.items() if n))
    out.mkdir(parents=True, exist_ok=True)
    (out / "candidates.json").write_text(json.dumps(kept, ensure_ascii=False, indent=1), encoding="utf-8")
    for hit in kept:
        big = largest(hit)
        print(f"{hit['id']:>8} {hit['duration']:>3} s {big['width']}x{big['height']:<5} {hit['user'][:18]:<18} {hit['tags'][:90]}")
    # The sheet: the first frame of the most downloaded ones, each under its id.
    shown = kept[:limit]
    thumbs = out / "thumbs"
    thumbs.mkdir(exist_ok=True)
    for n, hit in enumerate(shown):
        raw = thumbs / f"{hit['id']}.jpg"
        if not raw.exists():
            download((hit["videos"].get("medium") or largest(hit))["thumbnail"], raw)
        run("ffmpeg", "-loglevel", "error", "-y", "-i", str(raw), "-vf",
            "scale=384:216:force_original_aspect_ratio=decrease,pad=384:216:(ow-iw)/2:(oh-ih)/2,"
            f"drawtext=text='{hit['id']}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6", str(thumbs / f"t-{n:02d}.jpg"))
    if shown:
        columns = 5
        rows = -(-len(shown) // columns)
        run("ffmpeg", "-loglevel", "error", "-y", "-framerate", "1", "-i", str(thumbs / "t-%02d.jpg"), "-vf", f"tile={columns}x{rows}", "-frames:v", "1", str(out / "sheet.jpg"))
        print(f"{out / 'sheet.jpg'}: the first frame of {len(shown)} clips (--look <id> shows a whole clip)")


def look(clip_id: int, out: Path) -> None:
    hit = one(clip_id)
    folder = out / str(clip_id)
    video = folder / "medium.mp4"
    if not video.exists():
        download((hit["videos"].get("medium") or largest(hit))["url"], video)
    length = seconds_of(video)
    sheet = folder / "sheet.jpg"
    run("ffmpeg", "-loglevel", "error", "-y", "-i", str(video), "-vf",
        f"fps=16/{max(length - 0.2, 1):.3f},scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2,tile=4x4", "-frames:v", "1", str(sheet))
    big = largest(hit)
    print(f"{clip_id}: {length:.1f} s, up to {big['width']}x{big['height']}, by {hit['user']}, {hit['pageURL']}")
    print(f"  tags: {hit['tags']}")
    print(f"  AI-generated: {bool(hit.get('isAiGenerated'))}; low quality: {bool(hit.get('isLowQuality'))}")
    print(f"{sheet}: 16 frames across the clip. Nobody, no animal, no text, no lit building; and does the hour change?")


def prepared(source: Path, out: Path, take: dict) -> None:
    """What is kept of a clip: a stretch of it, reduced, forward then backward when it must loop with no jump."""
    steps = [f"scale=-2:'min({int(take['height'])},ih)'"] if take.get("height") else []
    if take.get("slow"):       # each frame held `slow` times longer, the frames in between blended: no stutter
        steps += [f"setpts={float(take['slow'])}*PTS", "framerate=fps=30:interp_start=0:interp_end=255:scene=100"]
    chain = ",".join(steps) or "null"
    graph = f"[0:v]{chain},split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[o]" if take.get("pingpong") else f"[0:v]{chain}[o]"
    cut = (["-ss", str(take["from"])] if take.get("from") else []) + (["-t", str(take["seconds"])] if take.get("seconds") else [])
    run("ffmpeg", "-loglevel", "error", "-y", *cut, "-i", str(source), "-filter_complex", graph, "-map", "[o]", "-an",
        "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-pix_fmt", "yuv420p", str(out))


def fetch(clip_id: int, out: Path, take: dict) -> None:
    hit = one(clip_id)
    video = largest(hit)
    source = out.with_name(out.stem + ".source.mp4") if take else out
    download(video["url"], source)
    if take:
        prepared(source, out, take)
    kept = ", ".join(f"{k} {v}" for k, v in take.items()) if take else "as it is"
    print(f"{out}: {seconds_of(out):.2f} s ({kept}), from {video['width']}x{video['height']}, {hit.get('duration')} s, by {hit.get('user')}, {hit.get('pageURL')}")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--search", nargs="+", metavar="QUERY", help="look for clips: one or several queries, in English")
    p.add_argument("--look", type=int, metavar="ID", help="16 frames across one clip")
    p.add_argument("--id", type=int, help="fetch this clip (a candidate, before it is in a file)")
    p.add_argument("--trial", help="fetch the clip of content/trial/<id>.yaml, prepared as its `clip.take` says")
    p.add_argument("--film", help="with --picture: the film whose own picture (`pictures` of content/trial/<film>.yaml) is fetched")
    p.add_argument("--picture", help="with --film: the name of that picture")
    p.add_argument("--out", required=True, type=Path, help="a directory (--search, --look) or the clip's file")
    p.add_argument("--min-seconds", type=float, default=12, help="--search: the shortest clip kept (12)")
    p.add_argument("--limit", type=int, default=25, help="--search: how many clips on the sheet (25)")
    p.add_argument("--tags", nargs="+", default=[], metavar="WORD",
                   help="--search: keep only clips whose tags hold one of these words (Pixabay's search is loose: "
                        "« sunset marsh » brings seas and forests; --tags lake pond marsh keeps what was asked)")
    p.add_argument("--from", dest="start", type=float, help="with --id: where the stretch kept begins")
    p.add_argument("--seconds", type=float, help="with --id: how long the stretch kept is")
    p.add_argument("--height", type=int, help="with --id: reduce to this height (1440 for a 4K clip)")
    p.add_argument("--pingpong", action="store_true", help="with --id: forward then backward")
    p.add_argument("--slow", type=float, help="with --id: this many times slower, frames blended")
    args = p.parse_args()
    if args.search:
        return search(args.search, args.out, args.min_seconds, args.limit, [w.lower() for w in args.tags])
    if args.look:
        return look(args.look, args.out)
    if args.id:
        take = {k: v for k, v in (("from", args.start), ("seconds", args.seconds), ("height", args.height), ("pingpong", args.pingpong), ("slow", args.slow)) if v}
        return fetch(args.id, args.out, take)
    if not args.trial and not (args.film and args.picture):
        sys.exit("error: one of --search, --look, --id, --trial, or --film with --picture")
    try:
        import yaml
    except ImportError:
        sys.exit("error: PyYAML is needed to read the short: uv run --with pyyaml python3 tools/trial/clip.py …")
    spec = yaml.safe_load((ROOT / "content" / "trial" / f"{args.trial or args.film}.yaml").read_text(encoding="utf-8"))
    clip = (spec.get("clip") if args.trial else ((spec.get("pictures") or {}).get(args.picture) or {}).get("clip")) or {}
    if clip.get("source") != "pixabay" or not clip.get("id"):
        sys.exit("error: no Pixabay clip id in the short" if args.trial else f"error: the film has no picture « {args.picture} » with a Pixabay clip")
    fetch(int(clip["id"]), args.out, clip.get("take") or {})


if __name__ == "__main__":
    main()
