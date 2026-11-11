#!/usr/bin/env python3
"""Fetch the sea clip of a trial (content/trial/<id>.yaml, `clip`) from Pixabay: it is not in the repository.

  python3 tools/trial/clip.py --out <dir>/sea.mp4        # needs PIXABAY_API_KEY (set in the cloud environment)

The key is read from the environment and never printed. Pixabay's content licence allows the use; the
clip is one the owner approved for quran-reels (config/backgrounds.yaml there, pb-dusk-sea).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--trial", default="boat")
    p.add_argument("--out", required=True, type=Path)
    args = p.parse_args()
    key = os.environ.get("PIXABAY_API_KEY", "").strip()
    if not key:
        sys.exit("error: PIXABAY_API_KEY is not set in this environment")
    spec = (ROOT / "content" / "trial" / f"{args.trial}.yaml").read_text(encoding="utf-8")
    found = re.search(r"^clip:.*?\bid:\s*(\d+)", spec, flags=re.M)
    if not found:
        sys.exit("error: no Pixabay clip id in the trial")
    url = "https://pixabay.com/api/videos/?" + urllib.parse.urlencode({"key": key, "id": found.group(1)})
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "quran-themes-demo/0.1"}), timeout=60) as r:
        hit = json.load(r)["hits"][0]
    video = hit["videos"].get("large") or hit["videos"]["medium"]
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(video["url"], headers={"User-Agent": "quran-themes-demo/0.1"}), timeout=300) as r:
        args.out.write_bytes(r.read())
    print(f"{args.out}: {video['width']}x{video['height']}, {hit.get('duration')} s, by {hit.get('user')}")


if __name__ == "__main__":
    main()
