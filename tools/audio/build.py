#!/usr/bin/env python3
"""Produce the audio of an episode: real recitation for verses, synthetic voice for the narration.

Reads video/public/data/<episode>.json (written by `npm run data` in video/), which says, scene by
scene, what is heard: `spoken_ar` for the narration (a hadith's words come from the registry), the
verse for a recitation. Writes build/audio/<episode>/<scene>.(mp3|wav) and manifest.json; run
`npm run data` again afterwards and the compositions use the real lengths.

  recitation  the reciter of content/policy.yaml (`reciter`). Never synthesised.
              quran.com v4 (Alafasy): the reciter's file for the verse and the time of each word
              (`segments`). One file per surah (Tawfiq As-Sayegh, mp3quran.net): the verse is cut out
              of its surah's file where content/recitations/<reciter>.json says, which also gives the
              time of each word (tools/audio/recitation.py, checked by Whisper); the surah files are
              downloaded once into build/recitations/<reciter>/, never committed.
  tts         tools/tts/say.py with VoiceTut (Egyptian Arabic) in its own venv. VoiceTut never says a
              line the same way twice, so the takes the owner listened to and approved are locked
              in content/audio/<episode>/ (FLAC + takes.json, `--lock <owner>`, only on the owner's
              word) and always reused (also by another scene, of this episode or another one, that
              says the same line in the same voice: `take_from` in the manifest); a line is synthesised only when it has no locked take for its text and voice. `--require-locked` (release renders) fails instead.
              A candidate take (`--candidate`, owner's decision of 2026-11-08: one validation, at
              the end) is a take Claude checked (Whisper, trailing sounds, phrase starts) and stored
              in the same place, not yet heard by the owner: the candidate render uses exactly it
              (`--require-committed`), and the owner's word turns it into a locked take (`--lock`)
              without touching its audio. A take of another episode is borrowed only once locked.
              Each line is cut into phrases (after « ، … . ؟ : ») and the manifest gives the time
              each phrase starts, read from the pauses of the take: a title card shows them one by
              one as the voice says them.
  reading     a hadith whose registry entry has a `recording` (a person reading the book aloud): the
              scene's audio is its introduction cut from the narration take, a short pause, then the
              reader saying the Prophet's words (`mix` in the manifest). The recording is downloaded
              here, cut once and kept in build/audio/<episode>/readings/, never committed.

Usage:
  python3 tools/audio/build.py --episode dua
  python3 tools/audio/build.py --episode dua --lock mssnoussi92        # the owner approved these takes
  python3 tools/audio/build.py --episode dua --require-locked --reel dua-01
  python3 tools/audio/build.py --episode dua --candidate               # store the checked takes for the candidate render
  python3 tools/audio/build.py --episode dua --require-committed       # candidate render: candidate or locked takes only
  python3 tools/audio/build.py --episode dua --only outro --use-take outro=takes/outro__2.wav   # a chosen take
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
import urllib.parse
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
QURAN_API = "https://api.quran.com/api/v4"
VERSE_AUDIO = "https://verses.quran.com"
USER_AGENT = "quran-themes-demo/0.1 (+https://github.com/mssnoussi92/quran-themes-demo)"

# Reciter in content/policy.yaml -> quran.com recitation id (one file per ayah, with word times).
RECITATIONS = {"alafasy": 7}
# Reciters with one file per surah: content/recitations/<reciter>.json (tools/audio/recitation.py).
CUTS = ROOT / "content" / "recitations"


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
    key = source["id"].removeprefix("quran.").replace(".", ":")
    if reciter not in RECITATIONS:
        return surah_cut(scene, reciter, key, out_dir)
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


def verse_cut(reciter: str, key: str) -> tuple[dict, str]:
    """Where the verse is in its surah's file (content/recitations/<reciter>.json), and that file's URL."""
    path = CUTS / f"{reciter}.json"
    if not path.is_file():
        sys.exit(f"error: reciter '{reciter}' has neither a quran.com recitation id (RECITATIONS) nor {path}")
    cuts = json.loads(path.read_text(encoding="utf-8"))
    entry = cuts["verses"].get(key)
    if not entry:
        sys.exit(f"error: no cut of {key} in {path.relative_to(ROOT)}: run "
                 f"tools/audio/recitation.py --reciter {reciter} {key}")
    return entry, cuts["surah_url"].format(surah=int(key.split(":")[0]))


def surah_cut(scene: dict, reciter: str, key: str, out_dir: Path) -> dict:
    """The verse cut out of the reciter's file of the whole surah (downloaded once)."""
    entry, url = verse_cut(reciter, key)
    surah = ROOT / "build" / "recitations" / reciter / url.rsplit("/", 1)[1]
    if not surah.is_file():
        surah.parent.mkdir(parents=True, exist_ok=True)
        print(f"recitation {scene['id']}: downloading {url}", flush=True)
        download(url, surah)
    dest = out_dir / f"{scene['id']}.mp3"
    length = entry["end"] - entry["start"]
    # atrim + asetpts: the clip's own clock starts at 0, so the fades fall at its two ends.
    cut = (f"atrim=start={entry['start']:.3f}:end={entry['end']:.3f},asetpts=PTS-STARTPTS,"
           f"afade=t=in:d=0.02,afade=t=out:st={max(0.0, length - 0.04):.3f}:d=0.04")
    subprocess.run([ffmpeg_exe(), "-loglevel", "error", "-y", "-i", str(surah), "-af", cut, "-ac", "1",
                    "-codec:a", "libmp3lame", "-qscale:a", "2", str(dest)], check=True)
    words = [{"position": pos, "start": start, "end": end} for pos, start, end in entry["words"]]
    return {"kind": "recitation", "file": dest.name, "seconds": seconds(dest), "source": scene["source"]["id"],
            "reciter": reciter, "origin": {"audio": url, "start": entry["start"], "end": entry["end"]},
            "words": words}


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


def loud_windows(samples: array.array, rate: int, threshold: float = TIGHT["threshold"]) -> tuple[int, list[bool]]:
    """Window length (samples) and, for each window of TIGHT["window"] s, whether it is speech."""
    win = max(1, int(rate * TIGHT["window"]))
    level = threshold * 32768
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
# a stop inside a word is shorter). Without enough pauses, the even-pace estimate. Version 2 halves
# the weight of length: a noisy pause can look split in two (Muslim 2679a, after « قال: »), and
# version 1 then cut the line at a longer pause 4 s later. Checked against Whisper on 13 lines.
PHRASE_CUT = re.compile(r"(?<=[،,…\.!?؟:])\s+")
PHRASES = {"version": 2, "min_pause": 0.1, "length_weight": 0.5}


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


# A hadith read by a person (registry `recording`): the introduction of the narration take, cut
# 0.12 s before the hadith (where the take pauses anyway), READING_GAP of silence, then the reading,
# with 20 ms / 40 ms fades so the cut makes no click.
READING_GAP = 0.25
CUT_BEFORE = 0.12


def download(url: str, dest: Path, attempts: int = 5) -> None:
    """Stream a (large) file to disk."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    tmp = dest.with_suffix(dest.suffix + ".part")
    for i in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as f:
                shutil.copyfileobj(r, f, 1 << 20)
            tmp.replace(dest)
            return
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            if i == attempts - 1:
                sys.exit(f"error: {url}: {e}")
            time.sleep(2 ** i)


def reading_clip(rec: dict, source_id: str, out_dir: Path, rate: int) -> Path:
    """The reader's words, mono 16-bit at `rate`, cut from the recording once and kept."""
    folder = out_dir / "readings"
    folder.mkdir(exist_ok=True)
    clip, meta = folder / f"{source_id}.wav", folder / f"{source_id}.json"
    want = {"file": rec["file"], "start": rec["start"], "end": rec["end"], "rate": rate}
    if clip.is_file() and meta.is_file() and json.loads(meta.read_text()) == want:
        return clip
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / ("recording" + Path(urllib.parse.urlparse(rec["file"]).path).suffix)
        print(f"reading {source_id}: downloading {rec['file']}", flush=True)
        download(rec["file"], src)
        # atrim + asetpts: the clip's own clock starts at 0, so the fades fall at its two ends (with -ss
        # after -i, the frames keep the recording's timestamps and a fade-out would mute the whole clip).
        length = rec["end"] - rec["start"]
        cut = (f"atrim=start={rec['start']:.3f}:end={rec['end']:.3f},asetpts=PTS-STARTPTS,"
               f"afade=t=in:d=0.02,afade=t=out:st={max(0.0, length - 0.04):.3f}:d=0.04")
        subprocess.run([ffmpeg_exe(), "-loglevel", "error", "-y", "-i", str(src), "-af", cut, "-ac", "1",
                        "-ar", str(rate), "-c:a", "pcm_s16le", str(clip)], check=True)
    meta.write_text(json.dumps(want) + "\n")
    return clip


def mix_reading(sid: str, entry: dict, scene: dict, out_dir: Path) -> dict:
    """<scene>.mix.wav: the introduction of the take, a pause, the reader. Returns the manifest's mix."""
    source = scene["source"]
    rec = source["recording"]
    intro = split_phrases((scene.get("narration") or {}).get("ar") or "")
    phrases = entry.get("phrases") or []
    if not intro or len(phrases) <= len(intro):
        sys.exit(f"error: scene {sid}: cannot find where the hadith starts in the take")
    params, samples = read_wav(out_dir / entry["file"])
    rate = params.framerate
    cut = max(1, int((phrases[len(intro)]["start"] - CUT_BEFORE) * rate))
    _, reading = read_wav(reading_clip(rec, source["id"], out_dir, rate))
    out = array.array("h", samples[:cut])
    out.extend(array.array("h", bytes(2 * int(READING_GAP * rate))))
    out.extend(reading)
    mix = out_dir / f"{sid}.mix.wav"
    with wave.open(str(mix), "wb") as w:
        w.setparams(params)
        w.writeframes(out.tobytes())
    start = round(cut / rate + READING_GAP, 3)
    return {"file": mix.name, "seconds": seconds(mix), "reader": rec["reader"],
            "recording": {k: rec[k] for k in ("file", "start", "end")},
            "phrases": phrases[:len(intro)] + [{"text": source["display_ar"], "start": start}]}


TAKES_NOTE = ("Narration takes validated by the owner (AI-generated voice, VoiceTut), and candidate takes checked "
              "by Claude for the owner's final review (status: candidate). Written by tools/audio/build.py "
              "--candidate, --lock and --set-phrases, never by hand.")


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
    p.add_argument("--candidate", action="store_true",
                   help="store the current draft takes (checked by Claude, not yet heard by the owner) in "
                        "content/audio/<episode>/ for the candidate render; --lock turns them into locked takes")
    p.add_argument("--require-committed", action="store_true",
                   help="fail, before any synthesis, if a narration line has neither a candidate nor a locked take")
    p.add_argument("--reel", help="with --require-locked, --require-committed, --candidate or --lock: only this reel's scenes")
    p.add_argument("--use-take", nargs="+", metavar="SCENE=WAV",
                   help="use this WAV (made by tools/tts/say.py from the scene's current spoken text, e.g. the "
                        "best of several takes) as the scene's draft take, instead of a new synthesis; the "
                        "owner listens to it before it is locked. Refused on a line that has a locked take")
    p.add_argument("--set-phrases", nargs="+", metavar="SCENE=S1,S2,...",
                   help="store checked phrase starts (seconds in the tightened take, one per phrase) with a "
                        "locked take, or with a draft take until it is redone or locked: they replace the "
                        "estimate (tools/audio/listen.py --phrases helps check)")
    args = p.parse_args()
    args.speaker = args.speaker or policy_value("voice")
    use_take: dict[str, Path] = {}
    for spec in args.use_take or []:
        sid, _, path = spec.partition("=")
        if not path or not Path(path).is_file():
            sys.exit(f"error: --use-take {spec}: give SCENE=WAV with an existing file")
        use_take[sid] = Path(path)

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
    # Takes validated in the other episodes (same line, same voice): « قال ربنا سبحانه وتعالى: »,
    # « النبي صلى الله عليه وسلم قال: »... keep the take the owner approved once. Label "<episode>/<scene>".
    borrowed: dict[str, dict] = {}
    for other in sorted((ROOT / "content" / "audio").glob("*/takes.json")):
        if other.parent.name == args.episode:
            continue
        for t_sid, t in sorted(json.loads(other.read_text(encoding="utf-8"))["takes"].items()):
            if (other.parent / t["file"]).is_file() and t.get("status") != "candidate":
                borrowed.setdefault(f"{other.parent.name}/{t_sid}", {**t, "path": other.parent / t["file"]})

    def take_of(entry: dict, sid: str) -> dict | None:
        """The locked take a scene uses: its own, another scene's, or another episode's."""
        owner = entry.get("take_from") or sid
        return borrowed.get(owner) if "/" in owner else takes.get(owner)

    in_reel = {s["id"] for s in data["scenes"] if not args.reel or s.get("reel") == args.reel}
    narrated = {s["id"] for s in data["scenes"] if s["audio"] == "tts"}
    bad = sorted(sid for sid in use_take if sid not in narrated or (args.only and sid not in args.only))
    if bad:
        sys.exit(f"error: --use-take: {', '.join(bad)}: not a narration scene of this run "
                 f"(check the scene id, and --only)")

    reciter = reciter_from_policy()
    scenes: dict[str, dict] = {}
    to_synthesise: list[tuple[dict, Path]] = []
    chosen: list[tuple[str, Path, Path]] = []
    for scene in data["scenes"]:
        sid = scene["id"]
        if args.only and sid not in args.only:
            if sid in old:
                scenes[sid] = old[sid]
            continue
        if scene["audio"] == "recitation":
            prev = old.get(sid)
            key = scene["source"]["id"].removeprefix("quran.").replace(".", ":")
            same_cut = reciter in RECITATIONS or (prev and prev.get("origin", {}).get("start") ==
                                                  verse_cut(reciter, key)[0]["start"] and prev["origin"].get("end") ==
                                                  verse_cut(reciter, key)[0]["end"])
            if prev and prev.get("source") == scene["source"]["id"] and prev.get("reciter") == reciter \
                    and same_cut and (out_dir / prev["file"]).is_file():
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
            if prev and prev.get("checked") and sid not in use_take:   # checked starts of a draft take (--set-phrases)
                scenes[sid]["checked"] = prev["checked"]
            take = takes.get(sid)
            if take and take.get("status") == "candidate" and sid in use_take:
                take = None             # a candidate take nobody validated yet can be replaced
            take_path = takes_dir / take["file"] if take else None
            if not take or take["key"] != key:
                # The same line, in the same voice, already validated in another scene (of this
                # episode first, then of another one): that take.
                twin = next((t_sid for t_sid, t in sorted(takes.items())
                             if t["key"] == key and (takes_dir / t["file"]).is_file()), None)
                if twin:
                    take, take_path = takes[twin], takes_dir / takes[twin]["file"]
                    scenes[sid]["take_from"] = twin
                else:
                    twin = next((label for label, t in borrowed.items() if t["key"] == key), None)
                    if twin:
                        take, take_path = borrowed[twin], borrowed[twin]["path"]
                        scenes[sid]["take_from"] = twin
            if take and take["key"] == key and take_path.is_file():
                if sid in use_take:
                    sys.exit(f"error: --use-take {sid}: this line has a take validated by the owner "
                             f"({scenes[sid].get('take_from') or sid}); a new take needs a changed line")
                # The validated take (or the candidate one): always this one, never a new synthesis.
                status = "candidate" if take.get("status") == "candidate" else "locked"
                scenes[sid].update(take=status, take_sha=take["sha256"])
                if prev and prev.get("take_sha") == take["sha256"] and raw.is_file():
                    scenes[sid]["seconds"] = prev["seconds"]
                    if "tight" in prev:
                        scenes[sid]["tight"] = prev["tight"]
                else:
                    transcode(take_path, raw, "-c:a", "pcm_s16le")
                    dest.unlink(missing_ok=True)
                    print(f"tts {sid}: " + (f"candidate take ({take['stored']})" if status == "candidate"
                                            else f"validated take ({take['validated_by']}, {take['locked']})"))
            elif sid in use_take:
                chosen.append((sid, raw, dest))    # copied once every scene is checked
            elif prev and prev.get("key") == key and prev.get("take") not in ("locked", "candidate") \
                    and (dest.is_file() or raw.is_file()):
                scenes[sid]["seconds"] = prev["seconds"]
                if "tight" in prev:
                    scenes[sid]["tight"] = prev["tight"]
            else:
                to_synthesise.append((scene, dest))

    if args.require_locked:
        missing = [sid for sid, e in scenes.items() if e["kind"] == "tts" and e["take"] != "locked" and sid in in_reel]
        if missing:
            sys.exit(f"error: no validated take for {', '.join(missing)}: render a candidate, let the owner watch "
                     f"it, then lock the takes on the owner's word (tools/audio/build.py --lock <owner>)")
    if args.require_committed:
        missing = [sid for sid, e in scenes.items()
                   if e["kind"] == "tts" and e["take"] not in ("locked", "candidate") and sid in in_reel]
        if missing:
            sys.exit(f"error: no candidate or validated take for {', '.join(missing)}: check the takes "
                     f"(skill narration-takes), then store them (tools/audio/build.py --candidate)")

    # A take chosen among several (tools/tts/say.py): the draft take, tightened below.
    for sid, raw, dest in chosen:
        shutil.copyfile(use_take[sid], raw)
        dest.unlink(missing_ok=True)
        print(f"tts {sid}: draft take {use_take[sid].name}")

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

    # Checked phrase starts given on the command line: stored with the locked take they belong to,
    # or, for a draft take, in the manifest, tied to that very take (its raw file): kept while the
    # take is not redone, and moved to takes.json when the owner's approval locks it.
    for spec in args.set_phrases or []:
        sid, _, values = spec.partition("=")
        entry = scenes.get(sid)
        owner = (entry or {}).get("take_from") or sid
        if not entry or entry["kind"] != "tts" or (entry.get("take") in ("locked", "candidate") and owner not in takes):
            sys.exit(f"error: --set-phrases {sid}: no take of this episode for this scene "
                     f"(a take of another episode is set there)")
        starts = [round(float(v), 3) for v in values.split(",")]
        if len(starts) != len(split_phrases(entry["text"])) or starts != sorted(starts):
            sys.exit(f"error: --set-phrases {sid}: give one start per phrase, in order "
                     f"({len(split_phrases(entry['text']))} phrases)")
        if entry.get("take") not in ("locked", "candidate"):
            raw = out_dir / f"{sid}.raw.wav"
            entry["checked"] = {"tight": TIGHT["version"], "raw_sha": sha256(raw), "starts": starts}
            print(f"phrases {sid}: {starts} kept with the draft take (manifest)")
            continue
        takes[owner]["phrases"] = {"tight": TIGHT["version"], "starts": starts}
        takes_path.write_text(json.dumps({"note": TAKES_NOTE, "takes": dict(sorted(takes.items()))},
                                         ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"phrases {sid}: {starts} stored with the take {owner}")

    # When each phrase starts (cheap: recomputed every time from the tightened take), unless checked
    # starts are stored with the locked take (--set-phrases) for the same tightening.
    for sid, entry in scenes.items():
        final = out_dir / entry["file"]
        if entry["kind"] == "tts" and final.is_file():
            entry["phrases"] = phrase_times(final, entry["text"])
            entry["phrase_rule"] = PHRASES
            stored = (take_of(entry, sid) or {}).get("phrases") if entry.get("take") in ("locked", "candidate") else None
            checked = entry.get("checked")
            if not stored and checked and checked["raw_sha"] == sha256(out_dir / f"{sid}.raw.wav"):
                stored = checked
            if stored and stored["tight"] == TIGHT["version"] and len(stored["starts"]) == len(entry["phrases"]):
                for phrase, start in zip(entry["phrases"], stored["starts"]):
                    phrase["start"] = start
                entry["phrase_rule"] = "checked"

    # Hadiths read by a person: the introduction of the take, then the reading.
    for scene in data["scenes"]:
        sid, entry = scene["id"], scenes.get(scene["id"])
        if not entry or entry["kind"] != "tts":
            continue
        if (scene.get("source") or {}).get("recording") and (out_dir / entry["file"]).is_file():
            entry["mix"] = mix_reading(sid, entry, scene, out_dir)
            print(f"reading {sid}: {entry['mix']['seconds']} s ({entry['mix']['reader']})")
        else:
            entry.pop("mix", None)

    if args.candidate and args.lock:
        sys.exit("error: --candidate and --lock: one or the other")
    if args.candidate:
        takes_dir.mkdir(parents=True, exist_ok=True)
        for sid, entry in scenes.items():
            if entry["kind"] != "tts" or sid not in in_reel or (args.only and sid not in args.only):
                continue
            if entry.get("take_from") or entry.get("take") in ("locked", "candidate"):
                continue                    # stored already (its own, or another scene's)
            flac = takes_dir / f"{sid}.flac"
            raw = out_dir / f"{sid}.raw.wav"
            transcode(raw, flac, "-c:a", "flac", "-compression_level", "12")
            takes[sid] = {"file": flac.name, "text": entry["text"], "engine": entry["engine"],
                          "speaker": entry["speaker"], "key": entry["key"], "status": "candidate",
                          "stored": time.strftime("%Y-%m-%d"), "raw_sha256": sha256(raw), "sha256": sha256(flac)}
            checked = entry.pop("checked", None)
            if checked and checked["raw_sha"] == sha256(raw):
                takes[sid]["phrases"] = {"tight": checked["tight"], "starts": checked["starts"]}
            entry.update(take="candidate", take_sha=takes[sid]["sha256"])
            print(f"candidate {sid}: {flac.relative_to(ROOT)}")
        takes_path.write_text(json.dumps({"note": TAKES_NOTE, "takes": dict(sorted(takes.items()))},
                                         ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.lock:
        takes_dir.mkdir(parents=True, exist_ok=True)
        for sid, entry in scenes.items():
            if entry["kind"] != "tts" or sid not in in_reel or (args.only and sid not in args.only):
                continue
            if entry.get("take_from"):      # already validated as another scene's take
                continue
            if entry.get("take") == "candidate" and takes.get(sid, {}).get("status") == "candidate":
                # The take the owner watched in the candidate render: the same audio, now validated.
                cand = takes[sid]
                takes[sid] = {k: v for k, v in cand.items() if k not in ("status", "stored", "raw_sha256", "sha256", "phrases")}
                takes[sid].update(validated_by=args.lock, locked=time.strftime("%Y-%m-%d"), sha256=cand["sha256"])
                if "phrases" in cand:
                    takes[sid]["phrases"] = cand["phrases"]
                entry.update(take="locked", take_sha=cand["sha256"])
                print(f"locked {sid}: candidate take ({cand['stored']}), audio unchanged")
                continue
            if entry.get("take") == "locked":
                continue
            flac = takes_dir / f"{sid}.flac"
            transcode(out_dir / f"{sid}.raw.wav", flac, "-c:a", "flac", "-compression_level", "12")
            takes[sid] = {"file": flac.name, "text": entry["text"], "engine": entry["engine"],
                          "speaker": entry["speaker"], "key": entry["key"], "validated_by": args.lock,
                          "locked": time.strftime("%Y-%m-%d"), "sha256": sha256(flac)}
            checked = entry.pop("checked", None)
            if checked and checked["raw_sha"] == sha256(out_dir / f"{sid}.raw.wav"):
                takes[sid]["phrases"] = {"tight": checked["tight"], "starts": checked["starts"]}
            entry.update(take="locked", take_sha=takes[sid]["sha256"])
            print(f"locked {sid}: {flac.relative_to(ROOT)}")
        takes_path.write_text(json.dumps({"note": TAKES_NOTE, "takes": dict(sorted(takes.items()))},
                                         ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    manifest = {"episode": args.episode, "note": "AI-generated voice for the narration (VoiceTut); "
                "verses are recited by a real reciter", "scenes": scenes}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(s["seconds"] for s in scenes.values())
    print(f"{manifest_path.relative_to(ROOT)}: {len(scenes)} scenes, {total:.1f} s of audio")
    return 0


if __name__ == "__main__":
    sys.exit(main())
