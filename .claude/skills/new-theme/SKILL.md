---
name: new-theme
description: Turn a new theme (patience, repentance, gratitude, trust in God...) into an episode script for quran-themes-demo, from sources to reels: registry entries for the owner to validate, an outline built on misconceptions, a hook per reel (write-hook skill), Egyptian narration with English subtitles, a draft render and a PR. Use when the owner asks for a new theme or episode.
---

# New theme

The model is the du'a episode (`content/episodes/dua.yaml`, plan in `docs/design.md`) and the
reference video it learned from (`reference/dua-video-analysis.md`). The process has three human
validations that stay human (design.md): each source, the script and its
translation, the final video. Never mark any of them done yourself.

0. **Reference video** (when the owner shares one). Write its analysis in `reference/` following
   `reference/dua-video-analysis.md`, text only (`reference/README.md`: no frame, audio or video of
   a third party in this public repository). Method: timecoded contact sheets with ffmpeg (2 frames/s
   for the hook, one per scene change after); the audio transcribed locally with faster-whisper
   (`large-v3-turbo`, CPU int8; if PyAV fails to open the file, decode it to 16 kHz mono WAV with
   ffmpeg and pass a numpy array); every quote on screen checked against `content/policy.yaml`. If
   the hook uses a technique `write-hook` lacks, add it there.

1. **Angle.** One theme, one promise, and 3 misconceptions people really hold about it (the du'a
   episode: "asking means refusing destiny", "everything is written, du'a changes nothing", "I was
   not answered"). Each misconception becomes a reel and is refuted by at least one source. End
   with a conclusion. If a misconception has no source in the policy, drop it.

2. **Sources.** For each claim, a verse or a hadith, never a summary from memory.
   - Verses: quran.ai MCP (`search_quran`, `fetch_word_concordance`; read its grounding rules
     first and pass their nonce), or the quran.com API. Whole ayahs only.
   - Hadiths: collections and grades allowed by `content/policy.yaml` (Bukhari, Muslim, Tirmidhi
     if al-Albani grades it sahih or hasan). To search hadith-api, download
     `editions/ara-<collection>1.min.json` (Arabic without diacritics) into the scratchpad and
     search the text; take its `arabicnumber` as the number (Muslim: one letter per narration,
     `hadith.muslim.2679a`). Example: « الدعاء هو العبادة » → Tirmidhi 2969, 3247, 3372.
   - Add each one to `content/sources/` with `status: proposed` and a `notes` line (which reel,
     why); for a hadith shown in a reel, an `excerpt_en`: the passage of `text_en` used as the
     subtitle, copied exactly (validate.py checks it), then `uv run --with ruamel.yaml tools/sources/fetch.py` and
     `uv run --with jsonschema --with pyyaml scripts/validate.py` (policy, grades).
   - List them for the owner: id, reference, Arabic and English text, link (`url`), and anything
     odd in the source (missing punctuation, several narrations). The owner sets `validated`.
   - A reference video's quotes are leads, never sources: the du'a reference shows a weak sentence
     attributed to the Prophet ﷺ, a paraphrase displayed as a verse, Companions' sayings without
     source and a figure without source (its "citations" table). Each one goes through the registry.

3. **Outline.** A table like the one in `docs/design.md`: number, role, content, source, reel.
   The 16:9 episode plays every scene; each reel is one idea, 45–60 s, and stands alone. From the
   reference: one misconception per part, announced on a sign by the recurring narrator (role
   `misconception`; the sign template is to be made in task 4); in 16:9 the narrator comes back
   every 30–60 s; a visual change every 6 s or so; one colour per function (concepts, narrator,
   questions, quotes).

4. **Script.** Follow the `write-hook` skill for the episode opening and for each reel: mirror,
   contrast, anchor, and an honest open loop to the next reel. Narration in Egyptian Arabic
   (VoiceTut), English subtitles in `narration.en`. Characters, poses and moods from
   `content/characters.yaml`, backgrounds from `content/backgrounds.yaml` only (a new one is added to
   the catalog, drawn in `video/src/backgrounds/` and shown to the owner first); no character in a scene that names a real person (`mentions`).
   Typical situations are presented as such, never as true stories. No figure without a source.

5. **Check.**
   - `uv run --with jsonschema --with pyyaml scripts/validate.py` (`--release` once the sources
     are validated).
   - In `video/`: `npm run data` (each reel 45–60 s by the estimate), `npm run typecheck`.
   - A draft render of the first reel: `npm run render -- Reel916 out/<reel>.mp4 --props='{"episode":"<theme>","reel":"<reel>","format":"reel","data":null}'`.

6. **PR.** Describe:
   - the angle and the outline;
   - each reel's script, Arabic and English, with its beats;
   - the sources and their status;
   - the open questions.

   Send the owner the draft video or a few stills. They validate the script and the translation;
   on their word, record `validated_by` on each validated reel. Then the release render: workflow
   `render` (voice from `content/policy.yaml`).
