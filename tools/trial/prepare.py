#!/usr/bin/env python3
"""Prepare the trial short of content/trial/<id>.yaml for one narration voice (docs/retention.md).

Writes video/public/trial/<id>-<voice>.json (the timeline the composition Trial916 plays) and copies the
audio beside it. Session only: the narration takes come from the release voice-test-latest (Gemini, by
the workflow voice-test), the clip from Pixabay (key of the environment). Verses and hadiths come from the
registry (tools/trial/sources.py: texts, the reciter's cut, the reader's recording), or, when the file names an
old episode in `verses` (the first film), from that episode already prepared here (npm run data,
tools/audio/build.py).

  cd video && npm run data && cd ..                                     # the verses, from the registry
  python3 tools/audio/build.py --episode khidr --require-committed --tts-python /bin/false && (cd video && npm run data)
  python3 tools/trial/clip.py --trial boat --out <dir>/sea.mp4            # the clip of the trial (PIXABAY_API_KEY)
  # the narration: workflow voice-test, gemini_voices "D=Algieba", gemini_texts
  # "content/voice-test/20-trial-boat.txt", voicetut_speakers "none"; then download D-trial-boat.flac
  # from the release voice-test-latest into content/trial/takes/ and commit it: a take that exists is
  # never asked for again (the four takes of voice D are there)
  uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/prepare.py --trial boat --voice D --takes content/trial/takes --clip <dir>/sea.mp4
  cd video && npx remotion render src/index.ts Trial916 out/essai/khidr-short-1-boat.mp4 --concurrency=4 --crf=21 --props='{"trial":"boat","voice":"D","data":null}'
  # TikTok: the same with "platform":"tiktok" in the props (signed with the page's TikTok name)
  # the film, after the three shorts: prepare.py --film --voice D --takes content/trial/takes, then
  # npx remotion render src/index.ts TrialFilm169 out/essai/khidr-film-16x9.mp4 --concurrency=4 --crf=21 --props='{"voice":"D","data":null}'

The ambience under the narration (the trial's `ambience`, tools/trial/ambience.py: a field recording, silent
under each verse) is made here too, <id>-<voice>-ambience.m4a; --no-ambience leaves it out.

Before any voice (no request spent): --trial <id> --draft --clip <clip> writes <id>-X.json, the narration
silent and timed from its length, the recitation real; stills of Trial916 then show the script on its scenes.

Covers (proposed): after a draft of each short, `prepare.py --film` writes the film's thumbnail data; then
  npx remotion still TrialCover916 out/<id>-cover.png --frame=45 --props='{"trial":"<id>","voice":"X","data":null}'
  npx remotion still TrialThumb169 out/film-thumbnail.png --frame=45

One narration take per voice holds every line of the short (the free tier of Gemini gives 10 requests a
day): each line is cut into phrases after « … ! ؟ ? . : » as everywhere else, each phrase is found in the
take by its words as Whisper hears them (tools/audio/align.py; --by-pauses: by the longest silences, the
first way, for a few lines only), and the take is cut between its segments, in the pause.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "video" / "public"
GAP = 0.35          # seconds of the scene alone between two segments
LEAD = 0.5          # before the first word, the picture is already there
TAIL = 1.2          # after the last word
LEVEL = "loudnorm=I=-16:TP=-1.9:LRA=11"
PHRASE_CUT = re.compile(r"(?<=[،,….!?؟:])\s+")
MARKS = re.compile("[ً-ْٰـ]")
PAUSE = 0.5         # most silence kept inside a line, at a « … » (the Gemini voices hold up to 1.5 s there)
PAUSE_LINES = 0.7   # and between two lines of the same segment
DRAFT_PACE = 10.0   # letters a second while speaking: the Gemini voices D and E (189 letters and 12 pauses in 24 to 27 s)


def run(*cmd: str) -> str:
    done = subprocess.run(cmd, capture_output=True, text=True)
    if done.returncode:
        sys.exit(f"error: {' '.join(cmd[:3])}…: {done.stderr[-400:]}")
    return done.stderr + done.stdout


def seconds(path: Path) -> float:
    return float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)).strip())


def silences(path: Path, floor: str = "-38dB", least: float = 0.12) -> list[tuple[float, float]]:
    log = run("ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", f"silencedetect=noise={floor}:d={least}", "-f", "null", "-")
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    return list(zip(starts, ends))


def pauses(path: Path, count: int) -> list[tuple[float, float]]:
    """The `count` longest pauses inside a take, in order: the pauses between its phrases."""
    total = seconds(path)
    inner = [(a, b) for a, b in silences(path) if a > 0.05 and b < total - 0.05]
    if len(inner) < count:
        sys.exit(f"error: {path.name}: {len(inner)} pauses for {count + 1} phrases; listen to the take")
    return sorted(sorted(inner, key=lambda g: g[1] - g[0], reverse=True)[:count])


def letters(text: str) -> int:
    return len(re.sub(r"[^\w]", "", MARKS.sub("", text)))


def rule_of(spec: dict) -> int:
    """The rule a short or a film is prepared with: how its phrases are found in the take (`place`) and how loud
    its narration plays (`trim`). A film the owner validated keeps the rule it was validated with, so that its
    videos come out the same: the first film (the files that still name an old episode in `verses`) rule 2, the
    du'a rule 3 (`rule: 3` in its files). Everything after: rule 4."""
    return int(spec["rule"]) if spec.get("rule") else 2 if spec.get("verses") else 4


def trim(whole: Path | None, rule: int) -> float:
    """The decibels to add to what is cut from the levelled take `whole`, so that the narration plays at the
    loudness the recitation plays at. One-pass loudnorm lands under its target: by 0 to 1.9 dB on the twelve
    takes measured on 2026-11-11 (the first short of Dhul-Qarnayn at -17.9 LUFS, its voice two decibels under
    its verses). Since rule 4. The take itself is not changed: the phrases are found in it as before."""
    if whole is None or rule < 4:
        return 0.0
    sys.path.insert(0, str(ROOT / "tools" / "audio"))
    import build
    measured = build.loudness(whole)
    gain = 0.0 if measured is None else round(build.LEVEL["lufs"] - measured, 2)
    print(f"narration level: {whole.name} at {measured} LUFS after loudnorm, {gain:+.2f} dB on its segments")
    return gain


def place(lines: list[str], whole: Path | None, by_pauses: bool = False, rule: int = 3) -> tuple[list[float], list, float]:
    """Where each phrase of `lines` starts in the levelled take `whole`, the pause before each one (None: none
    found, or the first phrase) and where the take ends. `whole` None: no voice yet, a draft timed from the
    length of the phrases. `rule` 2: how a pause was found until 2026-11-11 (a silence, or none); 3: when there
    is no silence between two words, the quiet stretch at a higher floor (a breath lifted by the levelling); a
    pause ends before the phrase's first word does and is the pause of one phrase only (added the same day: it
    moves no phrase of the du'a, checked on its four levelled takes). A file the owner validated keeps the rule it
    was validated with (`rule_of`), so its videos come out the same."""
    phrases = [ph for l in lines for ph in PHRASE_CUT.split(l.strip())]
    if whole is None:
        # Each phrase lasts what its letters take at the pace of the Gemini voices and is followed by a pause,
        # longer at the end of a line.
        line_ends, n = set(), 0
        for l in lines:
            n += len(PHRASE_CUT.split(l.strip()))
            line_ends.add(n - 1)
        starts, after, at = [], [], 0.1
        for i, ph in enumerate(phrases):
            starts.append(round(at, 2))
            stop = at + max(0.5, letters(ph) / DRAFT_PACE)
            at = stop + (0.7 if i in line_ends else 0.45)
            after.append((round(stop, 2), round(at, 2)))
        return starts, [None] + after[:-1], after[-1][0] + 0.2
    if by_pauses:
        # The first way (five lines): the longest pauses of the take, in order. A voice that does not pause
        # at one « … » shifts every phrase after it.
        found = pauses(whole, len(phrases) - 1)
        lead = next((b for a, b in silences(whole) if a <= 0.05), 0.0)
        return [lead] + [b for _, b in found], [None] + found, seconds(whole)
    # Whisper hears the take and each phrase is found by its words (tools/audio/align.py): what makes one
    # request for thirty phrases, or for a chapter, safe to cut. Kept beside the take: Whisper is slow.
    kept = whole.with_suffix(".align.json")
    stamp = f"{min(rule, 3)}:{whole.stat().st_size}:{'|'.join(lines)}"   # 2: the pause before a phrase starts after the word before it; 3: see above (rule 4 finds the phrases as rule 3 does)
    if kept.is_file() and (old := json.loads(kept.read_text(encoding="utf-8"))).get("stamp") == stamp:
        return old["starts"], [tuple(g) if g else None for g in old["gaps"]], old["end"]
    sys.path.insert(0, str(ROOT / "tools" / "audio"))
    import align
    heard = align.phrases_in_take(whole, lines, louder=rule >= 3)
    if [h.text for h in heard] != phrases:
        sys.exit(f"error: {whole.name}: the phrases of the take and of the text differ")
    weak = align.report(heard)
    if weak:
        print(f"warning: {whole.name}: {weak} phrase(s) mostly not heard (!!): listen before rendering; lines to redo go in ONE request")
    starts, gaps, end = [h.start for h in heard], [h.pause for h in heard], seconds(whole)
    kept.write_text(json.dumps({"stamp": stamp, "starts": starts, "gaps": gaps, "end": end}), encoding="utf-8")
    return starts, gaps, end


def cut(starts: list[float], gaps: list, end: float, first: int, after: int, what: str = "") -> tuple[float, float]:
    """Where to cut the phrases [first, after) out of a take: 0.15 s of the pause before the first word is
    kept, and 0.25 s of the one after the last."""
    if first == 0:
        begin = max(0.0, starts[0] - 0.08)
    elif gaps[first]:
        begin = max((gaps[first][0] + gaps[first][1]) / 2, gaps[first][1] - 0.15)
    else:
        begin = max(0.0, starts[first] - 0.03)
        print(f"warning: no pause before « {what} »: the cut before it may clip a word, listen")
    if after >= len(starts):
        stop = end
    elif gaps[after]:
        stop = min((gaps[after][0] + gaps[after][1]) / 2, gaps[after][0] + 0.25)
    else:
        stop = max(begin + 0.1, starts[after] - 0.03)
    return begin, stop


def narration(whole: Path | None, starts: list[float], gaps: list, end: float, first: int, lines: list[dict], out: Path,
              gain: float = 0.0) -> dict:
    """The phrases of `lines` (the first one is phrase `first` of the take) as a narration segment, its audio
    cut into `out` (`whole` None: a draft, no audio). The pauses of the voice are tightened: no more than PAUSE
    of silence at a « … », PAUSE_LINES between two lines; what is removed is the middle of the pause, so the
    end of a word and the attack of the next one are left alone. `gain`: decibels added to the cut (`trim`),
    with the limiter of the recitations for the few peaks it pushes over the ceiling."""
    parts = [PHRASE_CUT.split(l["ar"].strip()) for l in lines]
    after = first + sum(len(x) for x in parts)
    begin, stop = cut(starts, gaps, end, first, after, parts[0][0])
    line_firsts, k = set(), first
    for x in parts:
        line_firsts.add(k)
        k += len(x)
    removed, shift, rel = [], 0.0, []
    for k in range(first, after):
        if k > first and gaps[k]:
            a, b = gaps[k]
            most = PAUSE_LINES if k in line_firsts else PAUSE
            if b - a > most:
                removed.append((a + most * 0.4, b - most * 0.6))
                shift += (b - a) - most
        rel.append(round(starts[k] - begin - shift, 2))
    length = round(stop - begin - shift, 2)
    if whole is not None:
        keep = f"between(t,{begin:.3f},{stop:.3f})" + (f"*not({'+'.join(f'between(t,{x:.3f},{y:.3f})' for x, y in removed)})" if removed else "")
        run("ffmpeg", "-y", "-loglevel", "error", "-i", str(whole), "-af",
            f"asetnsamples=n=240,aselect='{keep}',asetpts=N/SR/TB,"
            + (f"volume={gain:.2f}dB,alimiter=limit=0.8:attack=5:release=50:level=0:latency=1," if gain else "")
            + f"afade=t=in:d=0.02,afade=t=out:st={max(0.0, length - 0.05):.3f}:d=0.05", str(out))
    made, k = [], 0
    for line, x in zip(lines, parts):
        made.append({"ar": line["ar"], "en": line["en"], "phrases": [{"text": ph, "start": rel[k + i]} for i, ph in enumerate(x)]})
        k += len(x)
    for i, line in enumerate(made):               # a line stays until the next one starts
        line["end"] = made[i + 1]["phrases"][0]["start"] if i + 1 < len(made) else length
    return {"kind": "narration", "seconds": length, "file": None if whole is None else f"trial/{out.name}", "lines": made}


def take_of(takes: Path, voice: str, text: str, out_dir: Path, name: str) -> Path:
    """The take <voice>-<text> of `takes`, levelled into out_dir/<name>-<voice>.wav."""
    stem = f"{voice}-{re.sub(r'^[0-9]+-', '', text)}"
    take = next((f for f in (takes / f"{stem}{ext}" for ext in (".flac", ".wav", ".mp3")) if f.is_file()), None)
    if take is None:
        sys.exit(f"error: no take {stem}.(flac|wav|mp3) in {takes}")
    whole = out_dir / f"{name}-{voice}.wav"
    if not whole.is_file() or whole.stat().st_mtime < take.stat().st_mtime:
        run("ffmpeg", "-y", "-loglevel", "error", "-i", str(take), "-af", LEVEL, "-ar", "48000", "-ac", "1", str(whole))
    return whole


def verse_segment(by_source: dict, source: str, out_dir: Path, episode: str) -> dict:
    scene = by_source.get(source)
    if scene is None:
        sys.exit(f"error: {source} is not recited in the prepared episode {episode}")
    src, media = scene["source"], scene["media"]
    wav = out_dir / f"{source.replace('.', '-')}.wav"
    shutil.copyfile(PUBLIC / media["file"], wav)
    return {"kind": "verse", "seconds": media["seconds"], "file": f"trial/{wav.name}", "reference": src["reference"],
            "text": src["display_ar"], "en": src["display_en"], "words": media["words"],
            "credit": f"{media['credit'].split(': ')[-1]} · {src['translator']}"}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--trial", default="boat")
    p.add_argument("--voice", help="label of the narration voice (D, E)")
    p.add_argument("--takes", type=Path, help="directory of the narration take <voice>-<text>.flac (or .wav, .mp3)")
    p.add_argument("--clip", type=Path, help="the filmed clip of the trial (not in the repository)")
    p.add_argument("--film", nargs="?", const="film", default=None, metavar="ID",
                   help="the long film content/trial/<ID>.yaml (ID: film when not given), built on the shorts already "
                        "prepared here (tools/trial/film.py): public/trial/<ID>-<voice>.json for TrialFilm169 and "
                        "<ID>.json, its YouTube thumbnail (TrialThumb169); with --draft, or --voice and --takes")
    p.add_argument("--episode", help="prepared episode the verses come from (default: `verses` of the trial)")
    p.add_argument("--draft", action="store_true",
                   help="no voice yet: the narration is silent and timed from its length (voice label X), to look at the "
                        "scenes and the script on stills before any request is spent")
    p.add_argument("--no-ambience", action="store_true", help="no bed under the narration (the trial's `ambience`)")
    p.add_argument("--picture", action="append", metavar="NAME=CLIP",
                   help="with --film: the clip of one of the film's own pictures (`pictures` of its file), once per picture")
    p.add_argument("--by-pauses", action="store_true", help="place the phrases on the longest pauses of the take, without Whisper (a few lines only)")
    args = p.parse_args()
    if args.film:
        import film
        film.prepare(args)
        return
    if not args.clip:
        sys.exit("error: --clip")
    if args.draft:
        args.voice = args.voice or "X"
    elif not args.voice or not args.takes:
        sys.exit("error: --voice and --takes, or --draft")

    spec = yaml.safe_load((ROOT / "content" / "trial" / f"{args.trial}.yaml").read_text(encoding="utf-8"))
    # Where the quotes come from: the registry (tools/trial/sources.py), or, for the first film, the old episode
    # its file names in `verses` (texts prepared by video/scripts/prepare.ts, audio built by tools/audio/build.py).
    args.episode = args.episode or spec.get("verses")
    by_source = None
    if args.episode:
        episode = json.loads((PUBLIC / "data" / f"{args.episode}.json").read_text(encoding="utf-8"))
        by_source = {s["source"]["id"]: s for s in episode["scenes"] if s.get("source") and s["audio"] == "recitation"}
    else:
        import sources
    out_dir = PUBLIC / "trial"
    out_dir.mkdir(parents=True, exist_ok=True)
    clip = out_dir / f"{args.trial}-clip.mp4"
    shutil.copyfile(args.clip, clip)

    # The narration: one take per voice for the whole short (the lines of content/voice-test/<text>.txt, in
    # order), cut here between its segments, in the middle of the pause before each one.
    text = ROOT / "content" / "voice-test" / f"{spec['text']}.txt"
    said = [l.strip() for l in text.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    narrated = [seg for seg in spec["segments"] if "narration" in seg]
    if said != [l["ar"] for seg in narrated for l in seg["lines"]]:
        sys.exit(f"error: {text.name} and the lines of the trial differ")
    phrases = [ph for seg in narrated for l in seg["lines"] for ph in PHRASE_CUT.split(l["ar"].strip())]
    whole = None if args.draft else take_of(args.takes, args.voice, spec["text"], out_dir, args.trial)
    starts, gaps, take_end = place(said, whole, args.by_pauses, rule_of(spec))
    gain = trim(whole, rule_of(spec))
    first, k = {}, 0                                        # narration id -> its first phrase in the take
    for seg in narrated:
        first[seg["narration"]] = k
        k += sum(len(PHRASE_CUT.split(l["ar"].strip())) for l in seg["lines"])

    t, segments = LEAD, []
    for seg in spec["segments"]:
        if "narration" in seg:
            wav = out_dir / f"{args.trial}-{args.voice}-{seg['narration']}.wav"
            made = narration(whole, starts, gaps, take_end, first[seg["narration"]], seg["lines"], wav, gain)
            if seg.get("hold") and made["seconds"] < seg["hold"]:
                # A series with no voice (« خريطة كلمة »): its text stays the time it takes to read it and to see what
                # it shows, not the time a voice would take to say it.
                made["seconds"] = made["lines"][-1]["end"] = float(seg["hold"])
            if seg.get("sources"):                         # what its lines rest on, written while they are said
                if by_source is not None:
                    sys.exit("error: `sources` on a narration needs the registry (a file with no `verses`)")
                made["refs"] = sources.references(seg["sources"])
            segments.append({**made, "scene": seg["scene"], "start": round(t, 2)})
        elif "verses" in seg and by_source is None:
            # Verses that follow one another, recited without a break: one cut, one segment.
            segments.append({**sources.passage(seg["verses"], out_dir, seg.get("upto")), "scene": seg["scene"], "start": round(t, 2)})
        elif "verse" in seg:
            made = verse_segment(by_source, seg["verse"], out_dir, args.episode) if by_source is not None else sources.verse(seg["verse"], out_dir)
            segments.append({**made, "scene": seg["scene"], "start": round(t, 2)})
        elif "reading" in seg and by_source is None:
            # A hadith read by a real voice, in a short as in the film; never the synthetic voice.
            segments.append({**sources.reading(seg["reading"], out_dir, draft=args.draft), "scene": seg["scene"], "start": round(t, 2)})
        else:
            sys.exit(f"error: a segment that is neither a narration, a verse nor a reading from the registry: {sorted(seg)}")
        t += segments[-1]["seconds"] + GAP
    total = round(t - GAP + TAIL, 2)
    # The ambience under the narration, silent under each verse (tools/trial/ambience.py).
    bed = None
    if spec.get("ambience") and not args.no_ambience:
        import ambience
        quiet = [(s["start"], s["start"] + s["seconds"]) for s in segments if s["kind"] != "narration"]
        bed = ambience.bed({args.trial: spec["ambience"]}, [(0.0, args.trial)], quiet, total, out_dir / f"{args.trial}-{args.voice}-ambience")
    handles = yaml.safe_load((ROOT / "content" / "publish.yaml").read_text(encoding="utf-8")).get("handles", {})
    data = {"trial": args.trial, "voice": args.voice, "voice_name": spec["voices"][args.voice], "handle": spec["handle"],
            "handles": handles,                             # where the page has another name (TikTok): prop `platform`
            "clip": f"trial/{clip.name}", "clip_seconds": round(seconds(args.clip), 2),
            # How the clip sits in the frame (content/trial/<id>.yaml, `clip`): where it is cropped, how far it is
            # moved down (or up) to leave the text its place, how much it is darkened, the colour behind it.
            "picture": {k: spec["clip"][k] for k in ("position", "shift", "brightness", "ground", "horizon", "rate", "veil") if k in spec["clip"]},
            "cover": spec.get("cover"),                     # the 9:16 cover of the short (TrialCover916)
            "seconds": total, "segments": segments}
    if bed:
        data["ambience"] = f"trial/{bed['file'].name}"
    out = out_dir / f"{args.trial}-{args.voice}.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    if by_source is None and sources.proposed:
        print("not validated by the owner yet: " + "; ".join(sources.proposed))
    for s in segments:
        what = " | ".join(f"{ph['text']}@{ph['start']}" for l in s.get("lines", []) for ph in l["phrases"]) or s.get("reference")
        print(f"{s['start']:6.2f}  {s['kind']:9s} {s['seconds']:5.2f} s  {s['scene']:6s} {what}")
    if bed:
        print(f"ambience: {spec['ambience']['title']} at {spec['ambience'].get('level', -36)} LUFS, silent under "
              + ", ".join(f"{a:.1f}-{b:.1f} s" for a, b in bed["silent"]))
    print(f"{out.relative_to(ROOT)}: {total} s")


if __name__ == "__main__":
    main()
