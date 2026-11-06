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
  python3 tools/audio/build.py --episode dua --speaker Ahmed --tts-python /opt/venvs/voicetut/bin/python
"""
from __future__ import annotations

import argparse
import array
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import wave
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
    """Length of an audio file. WAV: read from its header. Other formats: decoded by ffmpeg (no
    ffprobe needed, so the static build of imageio-ffmpeg is enough): its last reported out_time."""
    if path.suffix.lower() == ".wav":
        with wave.open(str(path)) as w:
            return round(w.getnframes() / w.getframerate(), 3)
    ffmpeg = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if not ffmpeg:
        sys.exit("error: ffmpeg not found (install it, or set FFMPEG)")
    log = subprocess.run([ffmpeg, "-hide_banner", "-nostats", "-stats_period", "60", "-progress", "pipe:1",
                          "-i", str(path), "-f", "null", "-"], check=True, capture_output=True, text=True).stdout
    times = re.findall(r"out_time_us=(\d+)", log)
    if not times:
        sys.exit(f"error: ffmpeg gave no duration for {path}")
    return round(int(times[-1]) / 1_000_000, 3)


def policy_value(name: str) -> str:
    """A scalar of content/policy.yaml (quran.reciter, narration.voice): keys are unique there."""
    for line in (ROOT / "content" / "policy.yaml").read_text(encoding="utf-8").splitlines():
        key, _, value = line.strip().partition(":")
        if key == name:
            return value.split("#")[0].strip()
    sys.exit(f"error: no '{name}' in content/policy.yaml")


def reciter_from_policy() -> str:
    return policy_value("reciter")


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


# Pacing of the synthetic voice. VoiceTut leaves ~0.2 s of silence before a line, ~0.3 s after it,
# and 0.4-0.55 s between the pieces it cuts at « … », « . » and « : »: with the scene tail, ~0.85 s
# of silence between two lines (the owner found it laggy, 2026-11-06). Kept: 0.08 s before a line,
# 0.06 s after it, and inside a line at most 0.06 s after a sound plus 0.12 s before the next one
# (a weak onset such as the burst of « ق » reads as silence: version 1 kept 0.1 s and clipped it).
# Silence = 20 ms windows under an RMS of 0.008 (speech measured at 0.03-0.26, silence under 0.003).
# The synthesised line stays as <scene>.raw.wav; <scene>.wav is derived from it.
TIGHT = {"version": 2, "lead": 0.08, "trail": 0.06, "gap_after": 0.06, "gap_before": 0.12,
         "window": 0.02, "threshold": 0.008}


def tighten(raw: Path, dest: Path) -> float:
    """Write `dest`: the 16-bit mono WAV `raw` with shorter silences; returns the seconds removed."""
    with wave.open(str(raw)) as w:
        params = w.getparams()
        samples = array.array("h", w.readframes(w.getnframes()))
    if params.sampwidth != 2 or params.nchannels != 1:
        sys.exit(f"error: {raw}: expected 16-bit mono WAV")
    rate = params.framerate
    win = max(1, int(rate * TIGHT["window"]))
    level = TIGHT["threshold"] * 32768
    loud = []
    for i in range(0, len(samples), win):
        chunk = samples[i:i + win]
        loud.append(math.sqrt(sum(x * x for x in chunk) / len(chunk)) > level)
    if True not in loud:
        shutil.copyfile(raw, dest)
        return 0.0
    first, last = loud.index(True), len(loud) - 1 - loud[::-1].index(True)
    after = round(TIGHT["gap_after"] / TIGHT["window"])
    before = round(TIGHT["gap_before"] / TIGHT["window"])
    windows = []                       # indices of the windows kept, in order
    run: list[int] = []
    for i in range(first, last + 1):
        if loud[i]:
            if len(run) > after + before:   # long pause: keep its start and, longer, its end
                run = run[:after] + run[len(run) - before:]
            windows += run + [i]
            run = []
        else:
            run.append(i)
    lead = int(TIGHT["lead"] * rate)
    trail = int(TIGHT["trail"] * rate)
    out = array.array("h", samples[max(0, first * win - lead): first * win])
    for i in windows:
        out.extend(samples[i * win:(i + 1) * win])
    end = min(len(samples), (last + 1) * win)
    out.extend(samples[end:end + trail])
    with wave.open(str(dest), "wb") as w:
        w.setparams(params)
        w.writeframes(out.tobytes())
    return round((len(samples) - len(out)) / rate, 3)


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
            shutil.move(Path(tmp) / f"{scene['id']}__voicetut-{speaker}.wav", dest.with_suffix(".raw.wav"))


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--episode", required=True)
    p.add_argument("--speaker", help="VoiceTut voice (default: narration.voice in content/policy.yaml)")
    p.add_argument("--tts-python", default=os.environ.get("VOICETUT_PYTHON", "/opt/venvs/voicetut/bin/python"),
                   help="python of the VoiceTut venv (env VOICETUT_PYTHON)")
    p.add_argument("--force", action="store_true", help="synthesise and download everything again")
    p.add_argument("--only", nargs="+", metavar="SCENE", help="only these scenes (the others keep their audio)")
    args = p.parse_args()
    args.speaker = args.speaker or policy_value("voice")

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
            if prev and prev.get("key") == key and (dest.is_file() or dest.with_suffix(".raw.wav").is_file()):
                scenes[sid]["seconds"] = prev["seconds"]
                if "tight" in prev:
                    scenes[sid]["tight"] = prev["tight"]
            else:
                to_synthesise.append((scene, dest))

    if to_synthesise:
        synthesise(to_synthesise, args.speaker, args.tts_python)
        for scene, dest in to_synthesise:
            scenes[scene["id"]].pop("tight", None)

    # Tighten every narration line from its raw take (new lines, older caches, a new rule version).
    for sid, entry in scenes.items():
        final = out_dir / entry["file"]
        raw = final.with_suffix(".raw.wav")
        if entry["kind"] != "tts" or (entry.get("tight") == TIGHT and final.is_file() and raw.is_file()):
            continue
        if not raw.is_file():
            if "tight" in entry:
                sys.exit(f"error: {raw.name} is missing and {final.name} is already tightened: run with --force")
            shutil.move(final, raw)    # a line cached before the pacing rule: it is the raw take
        removed = tighten(raw, final)
        entry["seconds"] = seconds(final)
        entry["tight"] = TIGHT
        print(f"tts {sid}: {entry['seconds']} s ({removed} s of silence removed)")

    manifest = {"episode": args.episode, "note": "AI-generated voice for the narration (VoiceTut); "
                "verses are recited by a real reciter", "scenes": scenes}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(s["seconds"] for s in scenes.values())
    print(f"{manifest_path.relative_to(ROOT)}: {len(scenes)} scenes, {total:.1f} s of audio")
    return 0


if __name__ == "__main__":
    sys.exit(main())
