#!/usr/bin/env python3
"""Produce the audio of an episode: real recitation for verses, synthetic voice for the narration.

Reads video/public/data/<episode>.json (written by `npm run data` in video/), which says, scene by
scene, what is heard: `spoken_ar` for the narration (a hadith's words come from the registry), the
verse for a recitation. Writes build/audio/<episode>/<scene>.(mp3|wav) and manifest.json; run
`npm run data` again afterwards and the compositions use the real lengths.

  recitation  quran.com v4: the reciter's file for the verse and the time of each word
              (`segments`), reciter from content/policy.yaml. Never synthesised.
  tts         tools/tts/say.py with VoiceTut (Egyptian Arabic) in its own venv. VoiceTut never says a
              line the same way twice, so the takes the owner listened to and approved are locked
              in content/audio/<episode>/ (FLAC + takes.json, `--lock <owner>`, only on the owner's
              word) and always reused (also by another scene that says the same line in the same
              voice); a line is synthesised only when it has no locked take for its text and voice. `--require-locked` (release renders) fails instead.
              Each line is cut into phrases (after « ، … . ؟ : ») and the manifest gives the time
              each phrase starts, read from the pauses of the take: a title card shows them one by
              one as the voice says them.

Usage:
  python3 tools/audio/build.py --episode dua
  python3 tools/audio/build.py --episode dua --lock mssnoussi92        # the owner approved these takes
  python3 tools/audio/build.py --episode dua --require-locked --reel dua-01
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


def ffmpeg_exe() -> str:
    exe = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if not exe:
        sys.exit("error: ffmpeg not found (install it, or set FFMPEG)")
    return exe


def transcode(src: Path, dest: Path, *codec: str) -> None:
    subprocess.run([ffmpeg_exe(), "-loglevel", "error", "-y", "-i", str(src), *codec, str(dest)], check=True)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def seconds(path: Path) -> float:
    """Length of an audio file. WAV: read from its header. Other formats: decoded by ffmpeg (no
    ffprobe needed, so the static build of imageio-ffmpeg is enough): its last reported out_time."""
    if path.suffix.lower() == ".wav":
        with wave.open(str(path)) as w:
            return round(w.getnframes() / w.getframerate(), 3)
    log = subprocess.run([ffmpeg_exe(), "-hide_banner", "-nostats", "-stats_period", "60", "-progress", "pipe:1",
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


def read_wav(path: Path):
    """Parameters and samples of a 16-bit mono WAV."""
    with wave.open(str(path)) as w:
        params = w.getparams()
        samples = array.array("h", w.readframes(w.getnframes()))
    if params.sampwidth != 2 or params.nchannels != 1:
        sys.exit(f"error: {path}: expected 16-bit mono WAV")
    return params, samples


def loud_windows(samples: array.array, rate: int) -> tuple[int, list[bool]]:
    """Window length (samples) and, for each window of TIGHT["window"] s, whether it is speech."""
    win = max(1, int(rate * TIGHT["window"]))
    level = TIGHT["threshold"] * 32768
    loud = []
    for i in range(0, len(samples), win):
        chunk = samples[i:i + win]
        loud.append(math.sqrt(sum(x * x for x in chunk) / len(chunk)) > level)
    return win, loud


def tighten(raw: Path, dest: Path) -> float:
    """Write `dest`: the 16-bit mono WAV `raw` with shorter silences; returns the seconds removed."""
    params, samples = read_wav(raw)
    rate = params.framerate
    win, loud = loud_windows(samples, rate)
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


# Phrases of a narration line, for the title card that shows them one by one: the text is cut after
# « ، … . ؟ ! : », and phrase k starts where the voice resumes after the pause chosen for cut k. The
# pauses of a tightened take (silences of 0.1 s or more inside the line) are matched in order to the
# cuts: the closest to where the cut falls if the line were said at an even pace (letters before it),
# the longest preferred (a cut between sentences or at a comma is a pause of 0.18 s once tightened,
# a stop inside a word is shorter). Without enough pauses, the even-pace estimate.
PHRASE_CUT = re.compile(r"(?<=[،,…\.!?؟:])\s+")
PHRASES = {"version": 1, "min_pause": 0.1, "length_weight": 1.0}


def split_phrases(text: str) -> list[str]:
    return [p for p in PHRASE_CUT.split(text.strip()) if p]


def phrase_times(path: Path, text: str) -> list[dict]:
    """[{"text", "start"}] for each phrase of `text` in the tightened take `path` (seconds)."""
    phrases = split_phrases(text)
    params, samples = read_wav(path)
    win, loud = loud_windows(samples, params.framerate)
    step = win / params.framerate
    if True not in loud:
        return [{"text": phrases[0] if len(phrases) == 1 else text, "start": 0.0}]
    first, last = loud.index(True), len(loud) - 1 - loud[::-1].index(True)
    onset, end = first * step, (last + 1) * step
    if len(phrases) == 1:
        return [{"text": phrases[0], "start": round(onset, 3)}]
    # Pauses inside the line: (start, length) in seconds.
    pauses, run = [], 0
    for i in range(first, last + 1):
        if not loud[i]:
            run += 1
            continue
        if run * step >= PHRASES["min_pause"] - 1e-9:
            pauses.append(((i - run) * step, run * step))
        run = 0
    letters = [sum(ch.isalpha() for ch in p) for p in phrases]
    total = sum(letters) or 1
    expected = [onset + (end - onset) * sum(letters[:k + 1]) / total for k in range(len(phrases) - 1)]
    longest = max((length for _, length in pauses), default=1.0)

    def cost(k: int, j: int) -> float:
        start, length = pauses[j]
        return abs(start + length / 2 - expected[k]) / (end - onset) + \
            PHRASES["length_weight"] * (1 - length / longest)

    cuts = len(expected)
    if len(pauses) < cuts:
        starts = [onset] + expected
    else:
        # best[k][j]: lowest cost of cuts 0..k with cut k on pause j (pauses taken in order).
        inf = float("inf")
        best = [[inf] * len(pauses) for _ in range(cuts)]
        prev = [[-1] * len(pauses) for _ in range(cuts)]
        for j in range(len(pauses)):
            best[0][j] = cost(0, j)
        for k in range(1, cuts):
            for j in range(k, len(pauses)):
                i = min(range(k - 1, j), key=lambda i: best[k - 1][i])
                best[k][j] = best[k - 1][i] + cost(k, j)
                prev[k][j] = i
        j = min(range(len(pauses)), key=lambda j: best[cuts - 1][j])
        chosen = []
        for k in range(cuts - 1, -1, -1):
            chosen.append(j)
            j = prev[k][j]
        starts = [onset] + [pauses[j][0] + pauses[j][1] for j in reversed(chosen)]
    return [{"text": p, "start": round(t, 3)} for p, t in zip(phrases, starts)]


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
    p.add_argument("--lock", metavar="OWNER",
                   help="store the current narration takes as validated by OWNER (only on the owner's word)")
    p.add_argument("--require-locked", action="store_true",
                   help="fail, before any synthesis, if a narration line has no validated take")
    p.add_argument("--reel", help="with --require-locked or --lock: only this reel's scenes")
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
    takes_dir = ROOT / "content" / "audio" / args.episode
    takes_path = takes_dir / "takes.json"
    takes = json.loads(takes_path.read_text(encoding="utf-8"))["takes"] if takes_path.is_file() else {}
    in_reel = {s["id"] for s in data["scenes"] if not args.reel or s.get("reel") == args.reel}

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
            raw = dest.with_suffix(".raw.wav")
            scenes[sid] = {"kind": "tts", "file": dest.name, "engine": "voicetut", "speaker": args.speaker,
                           "text": text, "key": key, "take": "synthesised"}
            take = takes.get(sid)
            if not take or take["key"] != key:
                # The same line, in the same voice, already validated in another scene: that take.
                twin = next((t_sid for t_sid, t in sorted(takes.items())
                             if t["key"] == key and (takes_dir / t["file"]).is_file()), None)
                if twin:
                    take = takes[twin]
                    scenes[sid]["take_from"] = twin
            if take and take["key"] == key and (takes_dir / take["file"]).is_file():
                # The validated take: always this one, never a new synthesis.
                scenes[sid].update(take="locked", take_sha=take["sha256"])
                if prev and prev.get("take_sha") == take["sha256"] and raw.is_file():
                    scenes[sid]["seconds"] = prev["seconds"]
                    if "tight" in prev:
                        scenes[sid]["tight"] = prev["tight"]
                else:
                    transcode(takes_dir / take["file"], raw, "-c:a", "pcm_s16le")
                    dest.unlink(missing_ok=True)
                    print(f"tts {sid}: validated take ({take['validated_by']}, {take['locked']})")
            elif prev and prev.get("key") == key and prev.get("take") != "locked" and (dest.is_file() or raw.is_file()):
                scenes[sid]["seconds"] = prev["seconds"]
                if "tight" in prev:
                    scenes[sid]["tight"] = prev["tight"]
            else:
                to_synthesise.append((scene, dest))

    if args.require_locked:
        missing = [sid for sid, e in scenes.items() if e["kind"] == "tts" and e["take"] != "locked" and sid in in_reel]
        if missing:
            sys.exit(f"error: no validated take for {', '.join(missing)}: render a draft, let the owner listen, "
                     f"then lock the takes the owner approves (tools/audio/build.py --lock <owner>)")

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

    # When each phrase starts (cheap: recomputed every time from the tightened take).
    for sid, entry in scenes.items():
        final = out_dir / entry["file"]
        if entry["kind"] == "tts" and final.is_file():
            entry["phrases"] = phrase_times(final, entry["text"])
            entry["phrase_rule"] = PHRASES

    if args.lock:
        takes_dir.mkdir(parents=True, exist_ok=True)
        for sid, entry in scenes.items():
            if entry["kind"] != "tts" or sid not in in_reel or (args.only and sid not in args.only):
                continue
            if entry.get("take_from"):      # already validated as another scene's take
                continue
            flac = takes_dir / f"{sid}.flac"
            transcode(out_dir / f"{sid}.raw.wav", flac, "-c:a", "flac", "-compression_level", "12")
            takes[sid] = {"file": flac.name, "text": entry["text"], "engine": entry["engine"],
                          "speaker": entry["speaker"], "key": entry["key"], "validated_by": args.lock,
                          "locked": time.strftime("%Y-%m-%d"), "sha256": sha256(flac)}
            entry.update(take="locked", take_sha=takes[sid]["sha256"])
            print(f"locked {sid}: {flac.relative_to(ROOT)}")
        takes_path.write_text(json.dumps(
            {"note": "Narration takes validated by the owner (AI-generated voice, VoiceTut). Written by "
                     "tools/audio/build.py --lock, never by hand.", "takes": dict(sorted(takes.items()))},
            ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    manifest = {"episode": args.episode, "note": "AI-generated voice for the narration (VoiceTut); "
                "verses are recited by a real reciter", "scenes": scenes}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(s["seconds"] for s in scenes.values())
    print(f"{manifest_path.relative_to(ROOT)}: {len(scenes)} scenes, {total:.1f} s of audio")
    return 0


if __name__ == "__main__":
    sys.exit(main())
