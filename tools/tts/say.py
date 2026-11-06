#!/usr/bin/env python3
"""Text to WAV with an open-source TTS engine.

Engines (each lives in its own venv, see requirements/):
  silma     SILMA TTS: Modern Standard Arabic + English, voice cloning from a reference clip.
  voicetut  VoiceTut-TTS: Egyptian Arabic + English, 19 built-in voices (e.g. Mohammed, Ahmed, Hanan).

Text files: UTF-8; lines starting with '#' are comments and are skipped.

Examples:
  /opt/venvs/silma/bin/python tools/tts/say.py --engine silma \
      --in content/voice-test/01-narration-msa.txt --out build/tts/msa.wav
  /opt/venvs/voicetut/bin/python tools/tts/say.py --engine voicetut --speaker Mohammed \
      --in content/voice-test/*.txt --out-dir build/tts

Never use this tool on Quran verses: verses always come from a real reciter.
"""
from __future__ import annotations

import argparse
import re
import sys
import time
from pathlib import Path

ARABIC = re.compile(r"[؀-ۿ]")

# Reference clip shipped inside the silma-tts package, with its exact transcript.
SILMA_REF_TEXT = (
    "ويدقق النظر في القرآن الكريم وسائر الكتب السماوية "
    "ويتبع مسالك الرسل العظام عليهم الصلاة والسلام."
)


def read_text(path: Path) -> str:
    lines = [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines()]
    text = " ".join(ln for ln in lines if ln and not ln.startswith("#"))
    if not text:
        sys.exit(f"error: {path} is empty")
    return text


def detect_language(text: str) -> str:
    return "ar" if ARABIC.search(text) else "en"


def output_path(args: argparse.Namespace, src: Path) -> Path:
    if args.out:
        return Path(args.out)
    voice = f"-{args.speaker}" if args.engine == "voicetut" else ""
    return Path(args.out_dir) / f"{src.stem}__{args.engine}{voice}.wav"


def run_silma(args: argparse.Namespace, jobs: list[tuple[str, Path]]) -> None:
    from importlib.resources import files

    from silma_tts.api import SilmaTTS

    ref_audio = args.ref_audio or str(files("silma_tts").joinpath("infer/ref_audio_samples/ar.ref.24k.wav"))
    ref_text = args.ref_text if args.ref_audio else SILMA_REF_TEXT
    tts = SilmaTTS(device=args.device)
    for text, out in jobs:
        t0 = time.time()
        tts.infer(ref_file=ref_audio, ref_text=ref_text, gen_text=text,
                  file_wave=str(out), seed=args.seed, speed=args.speed)
        print(f"wrote {out} in {time.time() - t0:.0f}s", flush=True)


def run_voicetut(args: argparse.Namespace, jobs: list[tuple[str, Path]]) -> None:
    from voicetut_tts import VoiceTutTTS

    # float16 is slow or unsupported on CPU: use float32 there.
    dtype = "float32" if args.device in (None, "cpu") else "float16"
    tts = VoiceTutTTS.from_pretrained(device=args.device or "cpu", dtype=dtype)
    for text, out in jobs:
        t0 = time.time()
        voice = {"ref_audio": args.ref_audio, "ref_text": args.ref_text} if args.ref_audio else {"speaker": args.speaker}
        tts.synthesize_long(text, str(out), language=args.language or detect_language(text),
                            speed=args.speed, **voice)
        print(f"wrote {out} in {time.time() - t0:.0f}s", flush=True)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--engine", choices=["silma", "voicetut"], required=True)
    p.add_argument("--in", dest="inputs", nargs="+", required=True, type=Path, help="text file(s)")
    out = p.add_mutually_exclusive_group(required=True)
    out.add_argument("--out", help="output WAV (single input only)")
    out.add_argument("--out-dir", help="output directory, one WAV per input")
    p.add_argument("--speaker", default="Mohammed",
                   help="voicetut built-in voice (default: Mohammed). Men: Ahmed, Ali, Hassan, Karim, Mahmoud, "
                        "Mohammed, Mostafa, Ramy, Shaker, Tareq, Yehia, Youssef. Women: Hadeer, Hanan, Mariam, "
                        "Rana, Sarah, Yasmin, Yara")
    p.add_argument("--language", choices=["ar", "en"], help="voicetut only; auto-detected by default")
    p.add_argument("--ref-audio", help="reference clip to clone (only voices you have the right to use)")
    p.add_argument("--ref-text", help="exact transcript of --ref-audio")
    p.add_argument("--speed", type=float, default=1.0)
    p.add_argument("--seed", type=int, default=42, help="silma only, for reproducible takes")
    p.add_argument("--device", default=None, help="cpu (default on the cloud VM), cuda, mps")
    args = p.parse_args()

    if args.out and len(args.inputs) > 1:
        p.error("--out takes a single input; use --out-dir for several")
    if args.ref_audio and not args.ref_text:
        p.error("--ref-audio needs --ref-text (its exact transcript)")

    jobs = []
    for src in args.inputs:
        dst = output_path(args, src)
        dst.parent.mkdir(parents=True, exist_ok=True)
        jobs.append((read_text(src), dst))

    {"silma": run_silma, "voicetut": run_voicetut}[args.engine](args, jobs)


if __name__ == "__main__":
    main()
