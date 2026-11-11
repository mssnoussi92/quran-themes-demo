#!/usr/bin/env python3
"""Say text files with Gemini TTS (Google AI Studio, free tier), for the voice comparison only.

The narration is our own text: never a verse (a verse is always a real reciter's recitation). One
request per file and per voice; the whole file is one take, so the voice keeps its flow from line to
line. A first line `# style: …` is the direction given to the voice, never spoken.

  GEMINI_API_KEY=… python3 tools/tts/gemini.py --voices C=Charon,D=Algieba \
      --in content/voice-test/10-boat-standard.txt --out-dir build/tts
  -> build/tts/C-boat-standard.wav, build/tts/D-boat-standard.wav

The key is read from the environment (a repository secret in CI), sent only in the request header
and never printed. Standard library only.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
RETRY_AFTER = (30, 60, 120)   # seconds, on 429 or a server error (the free tier allows few requests a minute)


def read(path: Path) -> tuple[str, str | None]:
    """The text to say and its style direction (a first line `# style: …`)."""
    style, lines = None, []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("#"):
            found = re.match(r"#\s*style:\s*(.+)", line)
            style = found.group(1).strip() if found else style
        elif line.strip():
            lines.append(line.strip())
    return "\n".join(lines), style


def audio_of(reply: dict) -> bytes:
    """The last audio block of the model's output (base64 in steps[].content[].data)."""
    blocks = [c for step in reply.get("steps", []) if step.get("type") == "model_output"
              for c in step.get("content", []) if c.get("type") == "audio" and c.get("data")]
    if not blocks:
        raise SystemExit(f"error: no audio in the reply (keys: {sorted(reply)}): {json.dumps(reply)[:600]}")
    return base64.b64decode(blocks[-1]["data"])


def say(text: str, style: str | None, voice: str, model: str, key: str) -> bytes:
    content = {"type": "text", "text": text}
    if style:
        content["annotations"] = [{"type": "speech_metadata", "style": style}]
    body = {
        "model": model,
        "input": [{"type": "user_input", "content": [content]}],
        "response_format": {"type": "audio"},
        "generation_config": {"speech_config": [{"voice": voice}]},
    }
    request = urllib.request.Request(URL, data=json.dumps(body).encode("utf-8"), method="POST",
                                     headers={"x-goog-api-key": key, "Content-Type": "application/json"})
    for attempt, wait in enumerate((*RETRY_AFTER, None)):
        try:
            with urllib.request.urlopen(request, timeout=300) as reply:
                return audio_of(json.load(reply))
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:800]
            if e.code not in (429, 500, 502, 503, 504) or wait is None:
                raise SystemExit(f"error: Gemini answered {e.code} for the voice {voice}: {detail}")
            print(f"  {e.code}, attempt {attempt + 1}: waiting {wait} s", flush=True)
            time.sleep(wait)
    raise AssertionError("unreachable")


def write_wav(data: bytes, out: Path) -> float:
    """The reply is a WAV file (24 kHz mono 16-bit); raw PCM is wrapped the same way. Returns seconds."""
    if data[:4] != b"RIFF":
        with wave.open(str(out), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(data)
    else:
        out.write_bytes(data)
    with wave.open(str(out), "rb") as w:
        return w.getnframes() / w.getframerate()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--voices", required=True, help="label=Voice, comma-separated (the label names the files: C=Charon)")
    p.add_argument("--in", dest="inputs", nargs="+", required=True, type=Path, help="text file(s)")
    p.add_argument("--out-dir", required=True, type=Path)
    p.add_argument("--model", default="gemini-3.8-flash-tts")
    p.add_argument("--pause", type=float, default=25.0, help="seconds between two requests (free tier)")
    args = p.parse_args()
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        sys.exit("error: GEMINI_API_KEY is empty (repository secret of that name: Settings > Secrets and variables > Actions)")
    voices = []
    for item in args.voices.split(","):
        label, _, voice = item.strip().partition("=")
        if not re.fullmatch(r"[A-Za-z0-9]{1,12}", label) or not re.fullmatch(r"[A-Za-z]{2,30}", voice):
            sys.exit(f"error: --voices wants label=Voice, got '{item}'")
        voices.append((label, voice))
    args.out_dir.mkdir(parents=True, exist_ok=True)
    first = True
    for path in args.inputs:
        text, style = read(path)
        name = re.sub(r"^\d+-", "", path.stem)
        for label, voice in voices:
            if not first:
                time.sleep(args.pause)
            first = False
            out = args.out_dir / f"{label}-{name}.wav"
            seconds = write_wav(say(text, style, voice, args.model, key), out)
            print(f"{out}: {seconds:.1f} s ({voice}, {args.model})", flush=True)


if __name__ == "__main__":
    main()
