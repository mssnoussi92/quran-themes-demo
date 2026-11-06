# quran-themes-demo

Demo of a pipeline for short animated videos on Quranic themes (first theme: du'a).
Every quotation comes from a sourced registry, verses always use a real reciter, the narration uses an open-source text-to-speech voice, and the video is rendered from data with [Remotion](https://www.remotion.dev).

Status: bootstrap. See `CLAUDE.md` for the rules and the task list, `docs/design.md` for the design.

## Layout

| Path | What it holds |
| --- | --- |
| `content/sources/` | Source registry: verses and hadiths referenced by stable ids |
| `content/episodes/` | Episode scripts, split into scenes |
| `content/voice-test/` | Texts for the voice test |
| `schemas/` | JSON Schemas for the registry and the episodes |
| `scripts/validate.py` | Checks the content against the schemas and the editorial rules |
| `tools/tts/say.py` | Text to WAV with SILMA (MSA + English) or VoiceTut (Egyptian + English) |
| `tools/sources/fetch.py` | Fills the registry texts from quran.com and hadith-api (`--check` in CI) |
| `video/` | Remotion project: `Reel916` and `Episode169` compositions, fed by `content/` |
| `.github/workflows/` | Content and video checks, voice test |

## Quick start

```bash
uv run --with jsonschema --with pyyaml scripts/validate.py
```

Voice test: run the **voice-test** workflow from the Actions tab. The MP3 files are attached to the `voice-test-latest` pre-release.

## Credits

- [SILMA TTS](https://github.com/SILMA-AI/silma-tts) (Apache 2.0) and [VoiceTut-TTS](https://huggingface.co/mohammedaly22/VoiceTut-TTS) (Apache 2.0) for speech synthesis.
- [Quran.com API](https://api-docs.quran.com) for Quran text, translation and recitation timings.
- [hadith-api](https://github.com/fawazahmed0/hadith-api) for hadith texts and grades.
- [Amiri Quran and Amiri](https://github.com/aliftype/amiri) (Khaled Hosny) and [Lora](https://github.com/cyrealtype/Lora-Cyrillic), under the SIL Open Font License (`video/public/fonts/`).
- [Open Peeps](https://openpeeps.com) by Pablo Stanley (CC0) as the base of the character kit.
