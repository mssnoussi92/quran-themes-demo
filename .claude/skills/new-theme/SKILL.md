---
name: new-theme
description: Turn a new theme (patience, repentance, gratitude, trust in God...) into an episode of quran-themes-demo, from sources to videos - registry entries for the owner to validate, an outline in the format chosen with the owner (choose-format skill, docs/formats.md), a hook per reel (write-hook skill), Egyptian narration with English subtitles, checked takes (narration-takes skill), real hadith readings where they exist (find-hadith-recording skill), publication texts (title, description, hashtags), draft renders, a PR, then the release render of the whole episode (16:9 and 9:16) and its reels, with the texts to paste in the release notes. Use when the owner asks for a new theme or episode, or for the next parts of one.
---

# New theme

The model is the du'a episode (`content/episodes/dua.yaml`, plan in `docs/design.md`: five reels
validated by the owner on 2026-11-07) and the reference video it learned from
(`reference/dua-video-analysis.md`). The owner publishes by hand on the Quran Words Daily page: the
whole episode in 16:9 on YouTube, the reels in 9:16 on Facebook, Instagram and TikTok, and the whole
episode in 9:16 too. The process has three human
validations that stay human (design.md): each source, the script and its
translation, the final video. Never mark any of them done yourself.

0. **Reference video** (when the owner shares one). Write its analysis in `reference/` following
   `reference/dua-video-analysis.md`, text only (`reference/README.md`: no frame, audio or video of
   a third party in this public repository). Method: timecoded contact sheets with ffmpeg (2 frames/s
   for the hook, one per scene change after); the audio transcribed locally with faster-whisper
   (`large-v3-turbo`, CPU int8; if PyAV fails to open the file, decode it to 16 kHz mono WAV with
   ffmpeg and pass a numpy array); every quote on screen checked against `content/policy.yaml`. If
   the hook uses a technique `write-hook` lacks, add it there.

1. **Format, then angle.** Choose the format first: skill `choose-format` (catalog `docs/formats.md`:
   misconceptions, story with suspense or in order, collection, one text explained, two paths,
   practical). The owner decides; write `format:` in the episode and the decision in
   `docs/themes.md`. Then the angle in that format. **Misconceptions**: one theme, one promise, and 3
   misconceptions people really hold about it (the du'a episode: "asking means refusing destiny",
   "everything is written, du'a changes nothing", "I was not answered"). Each misconception becomes a
   reel and is refuted by at least one source. End with a conclusion. If a misconception has no
   source in the policy, drop it.
   - The next themes and their order are in `docs/themes.md` (the owner's ideas, what was decided,
     the outlines already approved): start from there, and keep it up to date.
   - When the owner shares theme ideas (2026-11-07: study cards « محور الموضوع / ما الذي ستتعلمه »
     and a list of virtues), judge each against the format: a situation of everyday life for the
     hook (inner states hook better than social duties: comparison, fear, a wandering mind in prayer),
     three misconceptions really held, sources in the policy for each, and overlap with the episodes
     already made (`docs/themes.md`). Merge cards that say the same thing (fear and trust in God),
     leave a near-duplicate of a recent episode for later, check that each source you name exists in
     hadith-api under that number (step 2), and give a ranked proposal with the three misconceptions
     and their sources. The owner chooses; write the decision in `docs/themes.md`.
   - Do not refute a misconception with the same evidence as an earlier reel (sabr-03 « patience is
     waiting » used Muslim 2664: a tawakkul reel on effort takes Tirmidhi 2517 and 2344 instead).
   - A **story** (khidr, 2026-11-08: Musa and al-Khidr, 18:60-82) needs no misconceptions: one event
     and its meaning per reel, in the order of the Qur'an, and the whole episode told with suspense,
     every event first and then every secret (`whole`, step 3): format `story-suspense`; a story
     with no secret to keep is told in order, `story-linear` (qarnayn). The narration tells the
     story from the Qur'an and the authentic hadith only (no names or details introduced by
     « يزعمون », no israiliyyat), the verses prove it; never draw a prophet, never show a killing.
     - **After each event told, its verse recited** (owner's rule, 2026-11-08): the narration says
       the event in Egyptian, as close as it can to the verse's own words (« مش قلتلك إنك مش هتقدر
       تصبر معايا؟ » for 18:72), then « قال ربنا سبحانه وتعالى: » and the verses of that event, one
       intro for verses that follow each other (18:71-73). The synthetic voice never says the
       Quran's text itself: a dialect rendering, then the reciter. Reels grow to about 2 min.
     - **A life example after each lesson** (owner's request, 2026-11-08): a typical scene of
       everyday life and feeling, two lines on a catalog character (« زي لما القطر يفوتك… »,
       worried, then « وبعد ساعة تعرف… », smiling), presented as typical, never as a true story.
     - A promise at the end of the hook, in Egyptian (« قصة… هتخليك تبص لكل ابتلاء عدّى عليك بعين
       تانية »): what the story changes for the viewer, where viewers decide to stay.

2. **Sources.** For each claim, a verse or a hadith, never a summary from memory.
   - Verses: quran.ai MCP (`search_quran`, `fetch_word_concordance`; read its grounding rules
     first and pass their nonce), or the quran.com API. Whole ayahs only.
   - Each verse is recited by the reciter of `content/policy.yaml` (Tawfiq As-Sayegh since
     2026-11-08, one file per surah on mp3quran.net): once the verse is in the registry, cut it in
     his surah file, `uv run --with faster-whisper==1.1.1 --with pyyaml tools/audio/recitation.py
     --reciter sayegh <surah:ayah>` (or `--all`). Whisper checks the cut (every word, the first and
     the last above all, nothing of the neighbouring ayah). A cut it refuses is settled at the
     envelope (`listen.py --envelope <build/recitations/sayegh/SSS.mp3>@<t>@2`: the dip before the
     first word, the one after the last; a reciter who joins two ayahs leaves only a dip, 2:155) and
     set by hand (`--set 13:39=891.68,903.25`). validate.py fails on a recited verse without a cut.
     Tell the owner which cuts were set by hand: they listen to them first.
   - A hadith too long for a card (the whole story of Musa and al-Khidr, Bukhari 122): the registry's
     `excerpt_ar` (with `excerpt_en`) is the passage the card shows and the reader says, copied from
     `text_ar` with a script, never typed (validate.py checks it). One excerpt per hadith: a second
     passage of the same story comes from another narration of it (Bukhari 3401 for the sparrow).
   - Hadiths: collections and grades allowed by `content/policy.yaml` (Bukhari, Muslim, Tirmidhi
     if al-Albani grades it sahih or hasan). To search hadith-api, download
     `editions/ara-<collection>1.min.json` (Arabic without diacritics) into the scratchpad and
     search the text; take its `arabicnumber` as the number (Muslim: one letter per narration,
     `.01` → a, `hadith.muslim.2679a`). Example: « الدعاء هو العبادة » → Tirmidhi 2969, 3247, 3372.
     The per-hadith URL `editions/ara-muslim/<n>.json` counts in sequence, not by `arabicnumber`:
     `ara-muslim/2963` is a chain-only narration, the hadith is `arabicnumber` 2963.03. Bukhari's and
     Tirmidhi's sequence matches their numbers. A hadith without an `arabicnumber` in hadith-api
     (Muslim 2759) cannot be registered: take another one of the same meaning.
   - Verses: a whole sentence. A verse that opens in the middle of one (« إلا », « و » carrying on
     the verse before) is replaced or flagged to the owner: tawba took 4:110 instead of 3:135, and
     kept 25:70 alone, opening with « إلا », by the owner's choice.
   - Between hadiths of the same meaning, prefer one with a recorded reading on archive.org (the
     owner's preference, 2026-11-07): skill `find-hadith-recording` (Bukhari: one file per hadith).
   - A collection outside the policy (Ahmad, the reference's « three outcomes ») is replaced, not
     cited: dua found the same meaning in Tirmidhi 3573 (al-Albani: Hasan Sahih).
   - Add each one to `content/sources/` with `status: proposed` and a `notes` line (which reel,
     why); for a hadith shown in a reel, an `excerpt_en`: the passage of `text_en` used as the
     subtitle, copied exactly without the chain of narrators (validate.py checks it), then `uv run --with ruamel.yaml tools/sources/fetch.py` and
     `uv run --with jsonschema --with pyyaml scripts/validate.py` (policy, grades).
   - List them for the owner: id, reference, Arabic and English text, link (`url`), and anything
     odd in the source (missing punctuation, several narrations). The owner sets `validated`.
   - A reference video's quotes are leads, never sources: the du'a reference shows a weak sentence
     attributed to the Prophet ﷺ, a paraphrase displayed as a verse, Companions' sayings without
     source and a figure without source (its "citations" table). Each one goes through the registry.

3. **Outline.** A table like the one in `docs/design.md`: number, role, content, source, reel.
   The whole episode (16:9 and 9:16) plays every scene in order (or its `whole` order); each reel is
   one idea and stands alone. **Its length follows its content** (owner's decision, 2026-11-08:
   quality before duration; misconceptions reels ran 0:41-1:09, story reels 1:14-2:12): the only
   hard limit is Instagram's 3 min. Past 90 s, propose a relaunch in the middle of the reel, a
   one-word question on a card (« وبعدين؟ »), never a cut for length alone.
   - Tag each scene with its role in the format (`docs/formats.md`): `event` for what happened (then
     its verse or hadith card), `lesson` for the lesson drawn (your own line: mark it for the
     owner), `example` for the life example after it. `validate.py` warns, on reels not validated
     yet, when an event has no verse or hadith before the lesson, a lesson no example, or the reel
     misses a beat of its format: fix each warning or tell the owner why it stays.

   Misconceptions format, as in dua:
   - reel 1: the hook (write-hook) and the theme's promise, ending on an honest open loop (« three
     wrong ideas… the first one is next »);
   - one reel per misconception: a mirror line on a scene, the recurring narrator (`narrator`,
     `open-hands`, background `plain`, `talking: true`) saying « أول فكرة غلط… », a title card with
     the misconception, the evidence, a one-line takeaway (`lesson`), a life example (`example`, two
     lines on a catalog character, added on 2026-11-08 as in the stories), the open loop to the next
     reel;
   - a conclusion reel: the closing verse, then a recap of the reels in one line (four pieces on a
     title card) and a last line that loops back to the hook;
   - every verse is introduced by « قال ربنا سبحانه وتعالى: » (the owner's formula; the locked take
     is reused), every hadith by « النبي صلى الله عليه وسلم قال: » on its `source-card`;
   - a prophet or a Companion appears only on a `name-card` (`mentions`), never drawn (Ayyub in dua);
   - a visual change every 6 s or so; one colour per function (concepts, narrator, questions, quotes).
   - a story told with suspense in the whole episode (khidr): the episode's `whole` lists its parts
     (a title each, a YouTube chapter) and their scenes in order. A scene without `reel` is said only
     there (khidr: 18:78, the parting); a reel's scene left out of `whole` only in its reel (the
     links « السر؟ الخضر قاله بعدين: »). The owner validates the order and those lines with the
     reels: `whole.validated_by`, checked by `validate.py --release --whole <theme>`.
   - new places for a story: draw them in `video/src/backgrounds/` (flat shapes, no person), add
     them to `content/backgrounds.yaml`, render the board (`npm run still -- BackgroundSheet
     ../docs/backgrounds.png --frame=40`) and send it to the owner before the drafts.

4. **Script.** Follow the `write-hook` skill for the episode opening and for each reel: mirror,
   contrast, anchor, and an honest open loop to the next reel. Narration in Egyptian Arabic
   (VoiceTut), English subtitles in `narration.en`.
   - The open loop that only makes sense in a reel, the follow call « تابعنا عشان تعرف (أولها). »
     (« Follow us to find out (the first one). », owner's choice, 2026-11-07), is marked
     `reel_only_end: {ar, en}`: the whole-episode videos cut the line before it (owner's request).
   - Title-card lines are punctuated where each piece should appear (« ، … . ؟ : »).
   - The voice's spelling (`say_ar`) from the first draft: every word of `content/pronunciation.yaml`
     (validate.py warns on a reel not yet validated that forgets one), no guillemets (skill
     `voice-spelling`).
   - Mark your own explanatory lines (not a quote, not a paraphrase of one) when you present the
     script: the owner checks them first (dua: « الدعاء مش اعتراض… الدعاء احتياج »). Characters, poses and moods from
   `content/characters.yaml`, backgrounds from `content/backgrounds.yaml` only (a new one is added to
   the catalog, drawn in `video/src/backgrounds/` and shown to the owner first); no character in a scene that names a real person (`mentions`).
   Typical situations are presented as such, never as true stories. No figure without a source.

5. **Publication texts.** What the owner pastes with each video: the episode's `publish` (title and
   description of the whole episode, and the theme hashtags of all its videos) and each reel's
   `publish` (title, description), Arabic and English, in `content/episodes/<theme>.yaml`. Take
   them from the validated lines of the script, as dua did (title = the reel's hook, description =
   its misconception and takeaway); a word of your own is marked for the owner, like a line of the
   script.
   - YouTube title « <en> · <ar> »: 100 characters at most (validate.py). The whole episode's title
     names the promise (dua: « Du'a: 3 wrong ideas you might believe »).
   - Theme hashtags: 2 or 3, the English word first (`#Dua`, `#الدعاء`, `#Islam`). The page's
     (`#QuranWordsDaily`, `#Quran`...), hadith and reciter tags are added by
     `video/scripts/publish.ts` from `content/publish.yaml`; Instagram and TikTok keep the first 5,
     Facebook 8, YouTube all.
   - Never type a source, a grade, a reciter, a reader or the AI-voice line: publish.ts writes them
     from the data, with the YouTube chapters of the whole episode (one per reel).
   - Check: `cd video && npm run data && node scripts/publish.ts <theme> all` (fails on a broken
     limit), and show the owner the result with the script. They validate the texts with it:
     `publish.validated_by` on the episode and on each reel, removed whenever one of them changes.
   - YouTube thumbnail: the episode's `thumbnail` (layout `close-up`, headline « ٣ أفكار غلط », kicker
     « عن <الموضوع> », a character and mood from the catalog, another face than the last episode's:
     dua, tawba and tawakkul Amir, sabr and muqarana Salma), on the `plain` background (the street made tawba's title hard
     to read). `npm run still -- Thumbnail169 out/<theme>-thumbnail.png`, look at it at 170 px wide,
     send it; `thumbnail.validated_by` on the owner's word, on the image.

6. **Check, then audio.**
   - `uv run --with jsonschema --with pyyaml scripts/validate.py` (`--release` once the sources
     are validated).
   - In `video/`: `npm run data` (the estimate is pessimistic: 60 s estimated is about 50 s
     real), `npm run typecheck`.
   - Show the owner the script (Arabic and English, scene by scene, with the sources) while the
     voice is being made: skill `narration-takes` (synthesis in the background, Whisper on every
     take, retakes, pronunciation, phrase starts), and `find-hadith-recording` for the hadiths.
   - Draft renders of every reel and of the whole episode (`Episode169`, and `Reel916` with
     `"reel":null` for the 9:16 version; `--concurrency=2`, the browser ran out of memory with more),
     checked with a few frames and `listen.py`, then sent to the owner (SendUserFile). The 16:9 has
     the like/subscribe reminder on its own (`reminderStarts`): look at one frame of each.

7. **PR.** Describe:
   - the angle and the outline;
   - each reel's script, Arabic and English, with its beats;
   - the publication texts (titles, descriptions, hashtags);
   - the sources and their status;
   - the open questions.

   Send the owner the draft videos. They validate the sources, the script and the translation, the
   publication texts, the takes and the recordings; on their word, record `validated_by` on each
   validated reel (and `publish.validated_by` on the texts they approved), lock the
   narration takes they listened to (`python3 tools/audio/build.py --episode <theme> --lock <owner>
   --reel <reel>`) and validate the recordings they heard. Only locked takes and validated sources
   and recordings reach a release render. Then the release render: workflow `render` with
   `reel: all` (the whole episode in 16:9 and 9:16 and every reel, in the `<theme>-latest`
   pre-release, whose notes hold the texts to paste on each platform, one copyable block each; the
   first run downloads the hadith recordings from archive.org): skill `release-render`, which also
   checks the published videos and gives the owner the link.
   - Once the owner has merged the PR, the next piece of work starts again from `main` (the same
     branch name, restarted on `origin/main`), never on top of the merged history; record the theme
     as done in `docs/themes.md`.
