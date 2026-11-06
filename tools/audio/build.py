#!/usr/bin/env python3
"""Produce the audio of an episode: real recitation for verses, synthetic voice for the narration.

Reads video/public/data/<episode>.json (written by `npm run data` in video/), which says, scene by
scene, what is heard: `spoken_ar` for the narration (a hadith's words come from the registry), the
verse for a recitation. Writes build/audio/<episode>/<scene>.(mp3|wav) and manifest.json; run
`npm run data` again afterwards and the compositions use the real lengths.

  recitation  quran.com v4: the reciter's file for the verse and the time of each word
              (`segments`), reciter from content/policy.yaml. Never synthesised.
  tts         tools/tts/say.py with VoiceTut (Egyptian Arabic) in its own venv. A scene is
              synthesised again only when its text or the voice changed.

Usage:
  python3 tools/audio/build.py --episode dua
  python3 tools/audio/build.py --episode dua --speaker Mohammed --tts-python /opt/venvs/voicetut/bin/python
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
QURAN_API = "https://api.quran.com/api/v4"
VERSE_AUDIO = "https://verses.quran.com"
USER_AGENT = "quran-themes-demo/0.1 (+https://github.com/mssnoussi92/quran-themes-demo)"

# Reciter in content/policy.yaml -> quran.com recitation id.
RECITATIONS = {"alafasy": 7}


def get(url: str, attempts: int = 5) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for i in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except (urllib.error.URLError, TimeoutError) as e:
            if i == attempts - 1:
                sys.exit(f"error: {url}: {e}")
            time.sleep(2 ** i)
    raise AssertionError("unreachable")


def seconds(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         check=True, capture_output=True, text=True).stdout
    return round(float(out), 3)


def reciter_from_policy() -> str:
    for line in (ROOT / "content" / "policy.yaml").read_text(encoding="utf-8").splitlines():
        key, _, value = line.strip().partition(":")
        if key == "reciter":
            return value.split("#")[0].strip()
    sys.exit("error: no quran.reciter in content/policy.yaml")


def recitation(scene: dict, reciter: str, out_dir: Path) -> dict:
    source = scene["source"]
    if not source or source["type"] != "ayah":
        sys.exit(f"error: scene {scene['id']}: audio: recitation needs a verse")
    if reciter not in RECITATIONS:
        sys.exit(f"error: reciter '{reciter}' has no quran.com recitation id in RECITATIONS")
    key = source["id"].removeprefix("quran.").replace(".", ":")
    api = f"{QURAN_API}/recitations/{RECITATIONS[reciter]}/by_ayah/{key}?fields=segments"
    files = json.loads(get(api))["audio_files"]
    if len(files) != 1 or files[0]["verse_key"] != key:
        sys.exit(f"error: {api}: expected the audio of {key}")
    url = f"{VERSE_AUDIO}/{files[0]['url']}"
    dest = out_dir / f"{scene['id']}.mp3"
    dest.write_bytes(get(url))
    # segments: [index, word position (1-based, waqf signs excluded), start ms, end ms]
    words = [{"position": pos, "start": start / 1000, "end": end / 1000} for _, pos, start, end in files[0]["segments"]]
    return {"kind": "recitation", "file": dest.name, "seconds": seconds(dest), "source": source["id"],
            "reciter": reciter, "origin": {"api": api, "audio": url}, "words": words}


def tts_key(text: str, speaker: str) -> str:
    return hashlib.sha256(f"voicetut\n{speaker}\n{text}".encode()).hexdigest()[:16]


def synthesise(jobs: list[tuple[dict, Path]], speaker: str, tts_python: str) -> None:
    """One call to tools/tts/say.py for every changed line: the model loads once."""
    with tempfile.TemporaryDirectory() as tmp:
        inputs = []
        for scene, _ in jobs:
            src = Path(tmp) / f"{scene['id']}.txt"
            src.write_text(scene["spoken_ar"] + "\n", encoding="utf-8")
            inputs.append(str(src))
        cmd = [tts_python, str(ROOT / "tools/tts/say.py"), "--engine", "voicetut", "--speaker", speaker,
               "--language", "ar", "--in", *inputs, "--out-dir", tmp]
        print(f"synthesising {len(jobs)} line(s) with VoiceTut ({speaker})...", flush=True)
        subprocess.run(cmd, check=True)
        for scene, dest in jobs:
            shutil.move(Path(tmp) / f"{scene['id']}__voicetut-{speaker}.wav", dest)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--episode", required=True)
    p.add_argument("--speaker", default="Mohammed", help="VoiceTut voice (default: Mohammed, see tools/tts/say.py)")
    p.add_argument("--tts-python", default=os.environ.get("VOICETUT_PYTHON", "/opt/venvs/voicetut/bin/python"),
                   help="python of the VoiceTut venv (env VOICETUT_PYTHON)")
    p.add_argument("--force", action="store_true", help="synthesise and download everything again")
    p.add_argument("--only", nargs="+", metavar="SCENE", help="only these scenes (the others keep their audio)")
    args = p.parse_args()

    data_path = ROOT / "video" / "public" / "data" / f"{args.episode}.json"
    if not data_path.is_file():
        sys.exit(f"error: {data_path.relative_to(ROOT)} is missing: run `npm run data` in video/ first")
    data = json.loads(data_path.read_text(encoding="utf-8"))
    out_dir = ROOT / "build" / "audio" / args.episode
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / "manifest.json"
    old = {} if args.force or not manifest_path.is_file() else json.loads(manifest_path.read_text())["scenes"]

    reciter = reciter_from_policy()
    scenes: dict[str, dict] = {}
    to_synthesise: list[tuple[dict, Path]] = []
    for scene in data["scenes"]:
        sid = scene["id"]
        if args.only and sid not in args.only:
            if sid in old:
                scenes[sid] = old[sid]
            continue
        if scene["audio"] == "recitation":
            prev = old.get(sid)
            if prev and prev.get("source") == scene["source"]["id"] and prev.get("reciter") == reciter \
                    and (out_dir / prev["file"]).is_file():
                scenes[sid] = prev
            else:
                scenes[sid] = recitation(scene, reciter, out_dir)
                print(f"recitation {sid}: {scenes[sid]['seconds']} s, {len(scenes[sid]['words'])} words")
        elif scene["audio"] == "tts":
            text = scene.get("spoken_ar")
            if not text:
                sys.exit(f"error: scene {sid}: nothing to say")
            key = tts_key(text, args.speaker)
            prev = old.get(sid)
            dest = out_dir / f"{sid}.wav"
            scenes[sid] = {"kind": "tts", "file": dest.name, "engine": "voicetut", "speaker": args.speaker,
                           "text": text, "key": key}
            if prev and prev.get("key") == key and dest.is_file():
                scenes[sid]["seconds"] = prev["seconds"]
            else:
                to_synthesise.append((scene, dest))

    if to_synthesise:
        synthesise(to_synthesise, args.speaker, args.tts_python)
        for scene, dest in to_synthesise:
            scenes[scene["id"]]["seconds"] = seconds(dest)
            print(f"tts {scene['id']}: {scenes[scene['id']]['seconds']} s")

    manifest = {"episode": args.episode, "note": "AI-generated voice for the narration (VoiceTut); "
                "verses are recited by a real reciter", "scenes": scenes}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(s["seconds"] for s in scenes.values())
    print(f"{manifest_path.relative_to(ROOT)}: {len(scenes)} scenes, {total:.1f} s of audio")
    return 0


if __name__ == "__main__":
    sys.exit(main())
