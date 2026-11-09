"""scripts/finalize.py check: the candidate's videos become the final ones only when nothing but
validations changed since they were rendered (the promote workflow)."""

from __future__ import annotations

import json

EPISODE = "khushu"
PATH = f"content/episodes/{EPISODE}.yaml"


def candidate(copy) -> str:
    """The commit a candidate was rendered from."""
    copy.git("init", "-q")
    copy.git("add", "-A")
    copy.git("commit", "-q", "-m", "candidate")
    return copy.git("rev-parse", "HEAD")


def commit(copy, message: str = "after the candidate") -> None:
    copy.git("add", "-A")
    copy.git("commit", "-q", "-m", message)


def edit(copy, old: str, new: str, path: str = PATH) -> None:
    file = copy.root / path
    text = file.read_text(encoding="utf-8")
    assert old in text, old
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


def test_validations_alone_keep_the_candidate(copy):
    """The owner's « je valide »: finalize.py validate writes validated_by lines, nothing else."""
    edit(copy, "    validated_by: mssnoussi92\n", "")          # as it was when the candidate was made
    since = candidate(copy)
    file = copy.root / PATH
    text = file.read_text(encoding="utf-8")
    at = text.index("\n", text.index("  - id:", text.index("reels:"))) + 1
    file.write_text(text[:at] + "    validated_by: mssnoussi92\n" + text[at:], encoding="utf-8")
    commit(copy)
    done = copy.finalize("check", "--episode", EPISODE, "--since", since)
    assert done.returncode == 0, done.stdout + done.stderr
    assert "only validation lines changed" in done.stdout


def test_a_changed_line_needs_a_new_candidate(copy):
    since = candidate(copy)
    ep = copy.episode(EPISODE)
    line = next(s for s in ep["scenes"] if (s.get("narration") or {}).get("en"))["narration"]["en"]
    edit(copy, line, line + " Really.")
    commit(copy)
    done = copy.finalize("check", "--episode", EPISODE, "--since", since)
    assert done.returncode == 1
    assert "more than validations changed" in done.stdout and PATH in done.stdout


def test_what_no_video_reads_may_change(copy):
    since = candidate(copy)
    with (copy.root / "content/dialect.yaml").open("a", encoding="utf-8") as f:
        f.write("\n# a word added to the list after the candidate\n")
    (copy.root / "docs").mkdir()
    (copy.root / "docs/notes.md").write_text("anything\n", encoding="utf-8")
    commit(copy)
    assert copy.finalize("check", "--episode", EPISODE, "--since", since).returncode == 0


def test_a_take_still_candidate_stops_the_promotion(copy):
    since = candidate(copy)
    takes = copy.root / "content/audio" / EPISODE / "takes.json"
    takes.parent.mkdir(parents=True)
    takes.write_text(json.dumps({"takes": {"hook-1": {"status": "candidate"},
                                           "hook-2": {"status": "locked"}}}), encoding="utf-8")
    done = copy.finalize("check", "--episode", EPISODE, "--since", since)
    assert done.returncode == 1 and "candidate takes not locked: hook-1" in done.stdout
