"""The rules that guard what is quoted and what the owner validated, tried on a copy of the real
content with one thing broken: each rule must still refuse what it was written to refuse.
validate.py passing on the real content (the CI's first step) says the content is clean, not that
the rules still bite."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

REPO = Path(__file__).resolve().parents[1]


class Copy:
    """A copy of content/, schemas/ and scripts/ (without the audio takes), to break and check."""

    def __init__(self, root: Path):
        self.root = root

    def load(self, rel: str):
        return yaml.safe_load((self.root / rel).read_text(encoding="utf-8"))

    def dump(self, rel: str, data) -> None:
        (self.root / rel).write_text(
            yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=10_000), encoding="utf-8")

    def episode(self, name: str) -> dict:
        return self.load(f"content/episodes/{name}.yaml")

    def save_episode(self, ep: dict) -> None:
        self.dump(f"content/episodes/{ep['episode']}.yaml", ep)

    def validate(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, str(self.root / "scripts" / "validate.py"), *args],
                              capture_output=True, text=True, check=False)

    def git(self, *args: str) -> str:
        env = {"GIT_CONFIG_GLOBAL": "/dev/null", "GIT_CONFIG_SYSTEM": "/dev/null",
               "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@example.org",
               "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@example.org", "PATH": "/usr/bin:/bin"}
        return subprocess.run(["git", *args], cwd=self.root, env=env, capture_output=True, text=True,
                              check=True).stdout.strip()

    def finalize(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, str(self.root / "scripts" / "finalize.py"), *args],
                              capture_output=True, text=True, check=False)


@pytest.fixture
def copy(tmp_path: Path) -> Copy:
    shutil.copytree(REPO / "content", tmp_path / "content", ignore=shutil.ignore_patterns("audio"))
    shutil.copytree(REPO / "schemas", tmp_path / "schemas")
    (tmp_path / "scripts").mkdir()
    for name in ("validate.py", "finalize.py"):
        shutil.copy(REPO / "scripts" / name, tmp_path / "scripts" / name)
    return Copy(tmp_path)


def scene(ep: dict, pick) -> dict:
    """The first scene of the episode for which pick(scene) is true."""
    return next(s for s in ep["scenes"] if pick(s))
