#!/usr/bin/env python3
"""The owner's one validation, at the end (owner's decision, 2026-11-08), and the check that the
candidate videos can become the final ones without a new render.

  validate --episode E --owner O   on the owner's word only, after they watched the candidate render
                                   and said « je valide »: writes validated_by everywhere the episode
                                   needs it (each reel's script, the publication texts, the thumbnail,
                                   the whole episode's order; the sources and recordings it quotes, the
                                   backgrounds it uses, the spellings it proposed), then locks its
                                   candidate takes (tools/audio/build.py --lock, audio unchanged).
                                   Never run on Claude's own judgement.
  check --episode E --since SHA    in the promote workflow: since the candidate render's commit, only
                                   validation lines changed in what the videos are made of (content/,
                                   video/, tools/audio/build.py), and no candidate take is left: the
                                   candidate videos are the final ones.

Files are edited line by line, as written by hand (a YAML library would reformat them).
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"


# ---- validate -------------------------------------------------------------------------------------

def block_end(lines: list[str], start: int, indent: int) -> int:
    """Index after the last line of the block that starts at `start` (lines indented more than
    `indent`, blank lines inside included, trailing blank lines left out)."""
    end = start + 1
    last = start
    while end < len(lines):
        line = lines[end]
        if line.strip() and len(line) - len(line.lstrip()) <= indent:
            break
        if line.strip():
            last = end
        end += 1
    return last + 1


def has_key(lines: list[str], start: int, end: int, indent: int, key: str) -> bool:
    return any(re.match(rf"^ {{{indent}}}{key}:", lines[i]) for i in range(start, end))


def mark_top(lines: list[str], name: str, owner: str, done: list[str]) -> None:
    """validated_by at the end of a top-level mapping (publish, thumbnail, whole)."""
    for i, line in enumerate(lines):
        if re.match(rf"^{name}:\s*(#.*)?$", line):
            end = block_end(lines, i, 0)
            if not has_key(lines, i + 1, end, 2, "validated_by"):
                lines.insert(end, f"  validated_by: {owner}")
                done.append(name)
            return


def mark_reels(lines: list[str], owner: str, done: list[str]) -> None:
    """Each reel's validated_by (after its one-line title) and its publish texts' validated_by."""
    top = next(i for i, l in enumerate(lines) if re.match(r"^reels:\s*(#.*)?$", l))
    end = block_end(lines, top, 0)
    i = top + 1
    while i < end:
        m = re.match(r"^  - id: (\S+)", lines[i])
        if not m:
            i += 1
            continue
        item_end = i + 1
        while item_end < end and not re.match(r"^  - ", lines[item_end]):
            item_end += 1
        if not has_key(lines, i + 1, item_end, 4, "validated_by"):
            title = next((k for k in range(i + 1, item_end) if lines[k].startswith("    title:")), None)
            at = title + 1 if title is not None and lines[title].rstrip().endswith("}") else i + 1
            lines.insert(at, f"    validated_by: {owner}")
            item_end += 1
            end += 1
            done.append(f"{m.group(1)}: script")
        pub = next((k for k in range(i + 1, item_end) if re.match(r"^    publish:\s*$", lines[k])), None)
        if pub is not None:
            pub_end = block_end(lines, pub, 4)
            if not has_key(lines, pub + 1, pub_end, 6, "validated_by"):
                lines.insert(pub_end, f"      validated_by: {owner}")
                item_end += 1
                end += 1
                done.append(f"{m.group(1)}: publication texts")
        i = item_end


def mark_sources(ids: set[str], owner: str, done: list[str]) -> None:
    """status: proposed -> validated (+ validated_by), for the entry and for its recording."""
    for path in sorted((CONTENT / "sources").glob("*.yaml")):
        lines = path.read_text(encoding="utf-8").split("\n")
        changed = False
        i = 0
        while i < len(lines):
            m = re.match(r"^- id: (\S+)", lines[i])
            if not m or m.group(1) not in ids:
                i += 1
                continue
            end = i + 1
            while end < len(lines) and not lines[end].startswith("- "):
                end += 1
            for indent, what in ((2, m.group(1)), (4, f"{m.group(1)} (recording)")):
                for k in range(i + 1, end):
                    if lines[k] == " " * indent + "status: proposed":
                        if indent == 4 and not any(lines[j] == "  recording:" for j in range(i + 1, k)):
                            continue
                        lines[k] = " " * indent + "status: validated"
                        if not (k + 1 < len(lines) and lines[k + 1].startswith(" " * indent + "validated_by:")):
                            lines.insert(k + 1, " " * indent + f"validated_by: {owner}")
                            end += 1
                        done.append(what)
                        changed = True
                        break
            i = end
        if changed:
            path.write_text("\n".join(lines), encoding="utf-8")


def mark_backgrounds(names: set[str], owner: str, done: list[str]) -> None:
    path = CONTENT / "backgrounds.yaml"
    lines = path.read_text(encoding="utf-8").split("\n")
    for i, line in enumerate(list(lines)):
        m = re.match(r"^  ([a-z0-9-]+):\s*$", line)
        if not m or m.group(1) not in names:
            continue
        k = lines.index(line)
        end = block_end(lines, k, 2)
        if not has_key(lines, k + 1, end, 4, "validated_by"):
            lines.insert(end, f"    validated_by: {owner}")
            done.append(f"background {m.group(1)}")
    path.write_text("\n".join(lines), encoding="utf-8")


def mark_spellings(episode: str, owner: str, done: list[str]) -> None:
    path = CONTENT / "pronunciation.yaml"
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(rf"(decided: \{{ by: )proposed(, on: [^,]+, scene: {re.escape(episode)}/[^ ]+ \}})")
    found = pattern.findall(text)
    if found:
        path.write_text(pattern.sub(rf"\g<1>{owner}\g<2>", text), encoding="utf-8")
        done.extend(f"spelling ({episode})" for _ in found)


def validate(episode: str, owner: str) -> int:
    import yaml
    path = CONTENT / "episodes" / f"{episode}.yaml"
    ep = yaml.safe_load(path.read_text(encoding="utf-8"))
    # Every narration line must have a take in the candidate render (candidate or locked): a take
    # that was never in it is not something the owner watched.
    subprocess.run(["npm", "run", "-s", "data"], cwd=ROOT / "video", check=True, stdout=subprocess.DEVNULL)
    check = subprocess.run([sys.executable, "tools/audio/build.py", "--episode", episode, "--require-committed",
                            "--tts-python", "/bin/false"], cwd=ROOT, capture_output=True, text=True)
    if check.returncode != 0:
        sys.exit(f"error: {check.stderr.strip() or check.stdout.strip()}")

    # New backgrounds, as the candidate's list « à vérifier » shows them (video/scripts/review.ts): no
    # validated_by, and no validated reel of any episode uses them yet (read before any reel is marked).
    catalog = (yaml.safe_load((CONTENT / "backgrounds.yaml").read_text(encoding="utf-8")) or {})["backgrounds"]
    in_validated: set[str] = set()
    for other in (CONTENT / "episodes").glob("*.yaml"):
        o = yaml.safe_load(other.read_text(encoding="utf-8"))
        ok = {r["id"] for r in o["reels"] if r.get("validated_by")}
        in_validated |= {s["visual"].get("background") for s in o["scenes"] if s.get("reel") in ok}
    used = {s["visual"].get("background") for s in ep["scenes"]} | {(ep.get("thumbnail") or {}).get("background")}
    new_backgrounds = {b for b in used if b and b not in in_validated and not (catalog.get(b) or {}).get("validated_by")}

    done: list[str] = []
    lines = path.read_text(encoding="utf-8").split("\n")
    mark_reels(lines, owner, done)
    for name in ("publish", "thumbnail", "whole"):
        if ep.get(name):
            mark_top(lines, name, owner, done)
    path.write_text("\n".join(lines), encoding="utf-8")

    sources = {s["source"] for s in ep["scenes"] if s.get("source")}
    mark_sources(sources, owner, done)
    mark_backgrounds(new_backgrounds, owner, done)
    mark_spellings(episode, owner, done)

    subprocess.run(["npm", "run", "-s", "data"], cwd=ROOT / "video", check=True, stdout=subprocess.DEVNULL)
    lock = subprocess.run([sys.executable, "tools/audio/build.py", "--episode", episode, "--lock", owner,
                           "--tts-python", "/bin/false"], cwd=ROOT, capture_output=True, text=True)
    if lock.returncode != 0:
        sys.exit(f"error while locking the takes: {lock.stderr.strip()}")
    locked = [l for l in lock.stdout.splitlines() if l.startswith("locked ")]
    for item in done:
        print(f"validated: {item}")
    for line in locked:
        print(line)
    print(f"{len(done)} validation(s), {len(locked)} take(s) locked, for {owner}: run scripts/validate.py "
          f"--release --reel <each reel>, commit, then the promote workflow")
    return 0


# ---- check ----------------------------------------------------------------------------------------

# What the videos are made of. Elsewhere (docs, skills, workflows, validate.py) changes are free.
RENDER_PATHS = ["content", "video/src", "video/public/fonts", "video/package.json", "video/package-lock.json",
                "video/scripts/prepare.ts", "tools/audio/build.py"]
# Files of content/ that no video reads (validate.py's lists, Whisper's notes).
FREE = re.compile(r"^content/(pronunciation\.yaml|dialect\.yaml|audio/[^/]+/checks\.json)$")
VALIDATION_LINE = re.compile(
    r"^\s*(#.*)?$"                                             # comments, blank lines
    r"|^\s*validated_by: \S+\s*$"                              # validated_by of a reel, texts, source...
    r"|^\s*status: (proposed|validated)\s*$"                   # a source or recording
    r'|^\s*"(validated_by|locked|status|stored|raw_sha256)": .*$'   # a take locked (takes.json)
)


def check(episode: str, since: str) -> int:
    diff = subprocess.run(["git", "diff", "--unified=0", since, "HEAD", "--", *RENDER_PATHS],
                          cwd=ROOT, capture_output=True, text=True, check=True).stdout
    problems: list[str] = []
    current = None
    for line in diff.splitlines():
        if line.startswith("+++ "):
            current = line[6:] if line.startswith("+++ b/") else line[4:]
            continue
        if line.startswith("--- ") or line.startswith("@@") or line.startswith("diff ") or line.startswith("index "):
            continue
        if line[:1] not in "+-" or current is None or FREE.match(current):
            continue
        if not current.startswith("content/") or not VALIDATION_LINE.match(line[1:]):
            problems.append(f"{current}: {line[:120]}")
    takes = CONTENT / "audio" / episode / "takes.json"
    left = [sid for sid, t in (json.loads(takes.read_text(encoding="utf-8"))["takes"].items() if takes.is_file() else [])
            if t.get("status") == "candidate"]
    if left:
        problems.append(f"candidate takes not locked: {', '.join(left)} (scripts/finalize.py validate)")
    if problems:
        print("The candidate videos are not the final ones: since their render, more than validations changed.")
        print("Render a new candidate (render workflow, mode candidate) and let the owner watch it.")
        for p in problems:
            print(f"  {p}")
        return 1
    print(f"ok: since {since[:12]}, only validation lines changed; no candidate take left")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="command", required=True)
    v = sub.add_parser("validate")
    v.add_argument("--episode", required=True)
    v.add_argument("--owner", required=True)
    c = sub.add_parser("check")
    c.add_argument("--episode", required=True)
    c.add_argument("--since", required=True, help="commit of the candidate render")
    args = p.parse_args()
    if not re.match(r"^[a-z0-9-]+$", args.episode):
        sys.exit("error: invalid episode")
    return validate(args.episode, args.owner) if args.command == "validate" else check(args.episode, args.since)


if __name__ == "__main__":
    sys.exit(main())
