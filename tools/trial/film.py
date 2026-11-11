"""A long film (content/trial/<id>.yaml with `chapters`; docs/model.md): its timeline for TrialFilm169.

Called by tools/trial/prepare.py --film [<id>] (« film » when no id is given: the first one, Moses and
al-Khidr), after each of its shorts was prepared here (their clips are reused):

  uv run --with pyyaml --with numpy python3 tools/trial/prepare.py --film <id> --draft                 # no voice yet
  uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/prepare.py --film <id> --voice D --takes content/trial/takes

The film says three kinds of narration lines, and asks the voice for the third kind only:
- `reuse`: lines of a short, cut out of that short's take (the same take, the same words);
- `narration`: its own lines, one take for all of them (content/voice-test/<text>.txt);
and recites the verses (the prepared episode `verses`), and plays a hadith read by a real voice (the
reader's extract cut by tools/audio/build.py for that episode: build/audio/<episode>/readings/).

Writes video/public/trial/<id>-<voice>.json and <id>.json (the thumbnail, for TrialThumb169).
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import yaml

import prepare as P

OPENING = 0.5       # the picture is there before the first word
BETWEEN = 0.35      # the picture alone between two segments
BETWEEN_LINES = 0.2  # between two narration segments that follow each other


def lines_of(spec: dict) -> list[dict]:
    """Every narration line of a trial or of the film, in the order its voice text says them."""
    segments = spec["segments"] if "segments" in spec else [s for c in spec["chapters"] for s in c["segments"]]
    return [{"narration": seg["narration"], "index": i, **line} for seg in segments if "narration" in seg for i, line in enumerate(seg["lines"])]


class Take:
    """One voice text (a short's, or the film's own lines): where each of its phrases is in its take."""

    def __init__(self, name: str, spec: dict, args, out_dir: Path) -> None:
        self.name, self.lines = name, lines_of(spec)
        text = P.ROOT / "content" / "voice-test" / f"{spec['text']}.txt"
        said = [l.strip() for l in text.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
        if said != [l["ar"] for l in self.lines]:
            sys.exit(f"error: {text.name} and the lines of {name} differ")
        self.whole = None if args.draft else P.take_of(args.takes, args.voice, spec["text"], out_dir, name)
        self.starts, self.gaps, self.end = P.place(said, self.whole, rule=P.rule_of(spec))
        self.first, k = [], 0                   # index of the first phrase of each line
        for l in self.lines:
            self.first.append(k)
            k += len(P.PHRASE_CUT.split(l["ar"].strip()))
        self.count = k

    def segment(self, narration: str, wanted: list[int] | None, out: Path | None) -> dict:
        """The lines `wanted` (all by default) of one narration, as a segment of the film, cut into `out`."""
        mine = [i for i, l in enumerate(self.lines) if l["narration"] == narration and (wanted is None or l["index"] in wanted)]
        if not mine or mine != list(range(mine[0], mine[-1] + 1)):
            sys.exit(f"error: {self.name}.{narration} {wanted}: no such lines, or lines that do not follow each other")
        return P.narration(self.whole, self.starts, self.gaps, self.end, self.first[mine[0]], [self.lines[i] for i in mine], out)


def prepare(args) -> None:
    fid = args.film                          # the film's id: content/trial/<id>.yaml (the first one is « film »)
    path = P.ROOT / "content" / "trial" / f"{fid}.yaml"
    if not path.is_file():
        sys.exit(f"error: {path.relative_to(P.ROOT)} is missing")
    film = yaml.safe_load(path.read_text(encoding="utf-8"))
    if film.get("id") != fid or "chapters" not in film:
        sys.exit(f"error: {path.name} is not a film (its `id` must be « {fid} » and it must have `chapters`)")
    out_dir = P.PUBLIC / "trial"
    out_dir.mkdir(parents=True, exist_ok=True)
    thumb = out_dir / f"{fid}.json"
    shown = {k: film["thumbnail"][k] for k in ("title", "tag", "panels")}
    thumb.write_text(json.dumps({"title": film["title"], "handle": film["handle"], "thumbnail": shown}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{thumb.relative_to(P.ROOT)}: thumbnail of the film ({', '.join(film['thumbnail']['panels'])})")
    if args.draft:
        args.voice = args.voice or "X"
    elif not args.voice or not args.takes:
        return                                   # the thumbnail only
    # The quotes: from the registry (tools/trial/sources.py), or from the old episode the first film names in `verses`.
    episode_name = args.episode or film.get("verses")
    recited = read = None
    if episode_name:
        episode = json.loads((P.PUBLIC / "data" / f"{episode_name}.json").read_text(encoding="utf-8"))
        recited = {s["source"]["id"]: s for s in episode["scenes"] if s.get("source") and s["audio"] == "recitation"}
        read = {s["source"]["id"]: s for s in episode["scenes"] if s.get("source") and (s["source"].get("recording") or {}).get("status") == "validated"}
    else:
        import sources

    trials: dict[str, dict] = {}
    takes: dict[str, Take] = {fid: Take(fid, film, args, out_dir)}

    def trial(name: str) -> dict:
        if name not in trials:
            trials[name] = yaml.safe_load((P.ROOT / "content" / "trial" / f"{name}.yaml").read_text(encoding="utf-8"))
        return trials[name]

    def take(name: str) -> Take:
        if name not in takes:
            takes[name] = Take(name, trial(name), args, out_dir)
        return takes[name]

    t, n = OPENING, 0
    segments, shots, chapters, subscribe = [], [], [], []
    picture = scene = None
    for chapter in film["chapters"]:
        for seg in chapter["segments"]:
            first = (seg.get("shots") or [{}])[0]
            picture, scene = seg.get("picture", first.get("picture", picture)), seg.get("scene", first.get("scene", scene))
            if picture is None or scene is None:
                sys.exit(f"error: chapter {chapter['id']}: a first segment with no picture or scene")
            wav = out_dir / f"{fid}-{args.voice}-{n:03d}.wav"
            if "reuse" in seg:
                name, narration = seg["reuse"].split(".")
                made = take(name).segment(narration, seg.get("lines"), wav)
            elif "narration" in seg:
                made = takes[fid].segment(seg["narration"], None, wav)
            elif "verse" in seg:
                made = P.verse_segment(recited, seg["verse"], out_dir, episode_name) if recited is not None else sources.verse(seg["verse"], out_dir)
            elif read is None:
                made = sources.reading(seg["reading"], out_dir, draft=args.draft)
            else:
                source = read.get(seg["reading"])
                if source is None:
                    sys.exit(f"error: {seg['reading']} has no validated reading in the prepared episode {episode_name}")
                # The reader's extract alone (the episode plays it after an introduction by its own voice).
                extract = P.ROOT / "build" / "audio" / episode_name / "readings" / f"{seg['reading']}.level.wav"
                if not extract.is_file():
                    sys.exit(f"error: {extract.relative_to(P.ROOT)} is missing: python3 tools/audio/build.py --episode {episode_name}")
                copy = out_dir / f"{seg['reading'].replace('.', '-')}.wav"
                shutil.copyfile(extract, copy)
                src = source["source"]
                made = {"kind": "reading", "seconds": round(P.seconds(copy), 2), "file": f"trial/{copy.name}", "reference": src["reference"],
                        "text": src["display_ar"], "en": src["display_en"],
                        "credit": f"Reading: {src['recording']['reader']} · {src['translator']}"}
            # Two narration segments that follow each other are closer than a narration and a verse.
            if segments:
                close = made["kind"] == "narration" and segments[-1]["kind"] == "narration" and segments[-1]["chapter"] == chapter["id"]
                t += BETWEEN_LINES if close else BETWEEN
            if not chapters or chapters[-1]["id"] != chapter["id"]:
                chapters.append({"id": chapter["id"], "title": chapter["title"], "number": chapter.get("number"), "start": round(max(0.0, t - 0.2), 2)})
            made = {**made, "chapter": chapter["id"], "start": round(t, 2)}
            # A picture per phrase (the opening), or one for the segment.
            if "shots" in seg:
                phrases = [ph for line in made["lines"] for ph in line["phrases"]]
                if len(phrases) != len(seg["shots"]):
                    sys.exit(f"error: {seg.get('narration')}: {len(seg['shots'])} shots for {len(phrases)} phrases")
                made["center"] = True              # its text stays in the middle while the pictures change
                for k, (ph, shot) in enumerate(zip(phrases, seg["shots"])):
                    picture, scene = shot["picture"], shot["scene"]
                    shots.append({"start": round(t + (ph["start"] - 0.15 if k else 0), 2), "picture": picture, "scene": scene})
            elif not shots or (shots[-1]["picture"], shots[-1]["scene"]) != (picture, scene):
                shots.append({"start": round(t, 2), "picture": picture, "scene": scene})
            if seg.get("subscribe"):
                if made["kind"] != "narration" or t < 30:
                    sys.exit(f"error: the subscribe reminder at {t:.0f} s: never over a verse or a hadith, never in the first 30 s")
                subscribe.append(round(t + 0.4, 2))
            segments.append(made)
            n += 1
            t += made["seconds"]
    end = segments[-1]["start"] + segments[-1]["seconds"]
    total = round(end + film["outro"], 2)

    # The pictures: the clip of each short, in its wide setting; and the film's own pictures (`pictures` of its
    # file: a clip with nothing drawn over it, given with --picture <name>=<clip>).
    own = film.get("pictures") or {}
    given = dict(x.split("=", 1) for x in (args.picture or []))
    pictures = {}
    for name in sorted({s["picture"] for s in shots}):
        if name in own:
            clip = out_dir / f"{fid}-{name}-clip.mp4"
            if name in given:
                shutil.copyfile(given[name], clip)
            if not clip.is_file():
                sys.exit(f"error: the film's own picture « {name} » has no clip: python3 tools/trial/clip.py --film {fid} --picture {name} --out <file>, then --picture {name}=<file>")
            base = own[name]["clip"]
            if "side" not in base or "horizon" not in base:
                sys.exit(f"error: pictures.{name}.clip needs `side` and `horizon` (it is only shown in the wide frame)")
            pictures[name] = {"clip": f"trial/{clip.name}", "clip_seconds": round(P.seconds(clip), 2), "bare": True,
                              **{k: base[k] for k in ("ground", "rate", "brightness", "side", "horizon", "shift") if k in base}}
            continue
        clip = out_dir / f"{name}-clip.mp4"
        if not clip.is_file():
            sys.exit(f"error: {clip.relative_to(P.ROOT)} is missing: prepare the short « {name} » first (--trial {name} --draft --clip …)")
        base = trial(name)["clip"]
        pictures[name] = {"clip": f"trial/{clip.name}", "clip_seconds": round(P.seconds(clip), 2),
                          **{k: base[k] for k in ("ground", "rate", "brightness") if k in base}, **base["landscape"]}
    data = {"film": film["id"], "voice": args.voice, "voice_name": film["voices"][args.voice], "handle": film["handle"],
            "title": film["title"], "seconds": total, "outro": film["outro"], "chapters": chapters, "pictures": pictures,
            "shots": shots, "subscribe": subscribe, "segments": segments}
    # The ambience of each picture under the narration, silent under every verse and the hadith; it stays under
    # the calm picture of the end and leaves with it (tools/trial/ambience.py).
    bed = None
    # A picture of the film alone takes the ambience its file names: a short's id, or a recording of its own.
    def ambience_of(name: str) -> dict | None:
        if name not in own:
            return trial(name).get("ambience")
        named = own[name].get("ambience")
        return trial(named).get("ambience") if isinstance(named, str) else named
    specs = {name: ambience_of(name) for name in pictures}
    if all(specs.values()) and not args.no_ambience:
        import ambience
        quiet = [(s["start"], s["start"] + s["seconds"]) for s in segments if s["kind"] != "narration"]
        bed = ambience.bed(specs, [(s["start"], s["picture"]) for s in shots], quiet, total, out_dir / f"{fid}-{args.voice}-ambience", end=3.0)
        data["ambience"] = f"trial/{bed['file'].name}"
    out = out_dir / f"{fid}-{args.voice}.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    stamp = lambda x: f"{int(x // 60)}:{int(x % 60):02d}"
    if recited is None and sources.proposed:
        print("  not validated by the owner yet: " + "; ".join(sources.proposed))
    recitation = sum(s["seconds"] for s in segments if s["kind"] == "verse")
    for c in chapters:
        print(f"  {stamp(c['start'])}  {c['title']['en']}")
    print(f"  subscribe reminder at {', '.join(stamp(x) for x in subscribe)}")
    if bed:
        print("  ambience: " + ", ".join(f"{stamp(a)} {specs[name]['title']}" for a, _, name in bed["runs"]) + f"; silent under {len(bed['silent'])} stretches")
    print(f"{out.relative_to(P.ROOT)}: {stamp(total)} ({total} s), {len(segments)} segments, {len(shots)} shots, "
          f"{stamp(recitation)} of recitation, {film['outro']} s of calm picture at the end")
