---
name: choose-format
description: Choose the format of a new episode of quran-themes-demo from the closed catalog docs/formats.md (misconceptions, story with suspense or in order, collection, one text explained, two paths, practical), from the subject and what the owner shared - kind of subject, hard filters (a source in the policy for every part, recitation length, nothing that may not be drawn), criteria (a 3-second hook from life, what the viewer gains, variety, cost), then a format sheet with a recommendation, one alternative and the owner's decisions, challenging the owner's idea where the evidence points elsewhere. Use before writing any new episode (before new-theme), when the owner shares a subject, a lesson or a story, and when ordering the themes to come.
---

# Choose a format

The owner decided on 2026-11-08 that every episode follows a format of the closed catalog
`docs/formats.md`, chosen before the script, and asked to be challenged, always: say plainly when
their idea, or yours, is weaker than another on the evidence. You recommend; the owner decides.

## 0. Read

- `docs/formats.md`: each format, when to choose it, its reels, its hook, what validate.py checks, its
  pitfalls.
- `docs/themes.md`: the episodes made, their format (the last two count for variety), the subjects
  saved for later and their sheets.
- What the owner shared (a lesson, study cards, a reference video: `new-theme` step 0 for a video).

## 1. Kind of subject

| The subject is… | Format |
| --- | --- |
| an inner state or a virtue people misunderstand, with three misconceptions really held | `misconceptions` |
| a story (Qur'an, or told by the Prophet ﷺ) of three events or more, with a secret revealed later | `story-suspense` |
| the same, with nothing to keep secret | `story-linear` |
| several short moments with one real thread, each too short for an episode | `collection` |
| one hadith or one long verse that carries the whole theme, sentence by sentence | `text-explained` |
| two people, the same gift or trial, opposite answers, both in the texts | `two-paths` |
| an act people want to do better | `practical` |

Often two fit: keep both as candidates.

## 2. Hard filters

Drop a candidate that fails one:

- **Sources**: a verse, or a hadith of the policy (Bukhari, Muslim, Tirmidhi graded sahih or hasan by
  al-Albani), for every part, found under that number in hadith-api (`new-theme` step 2). A part with no
  source goes, and a format left with fewer than three parts goes with it.
- **Recitation length** of a story or a collection (Tawfiq As-Sayegh, read 17 on mp3quran.net):

  ```bash
  curl -s "https://www.mp3quran.net/api/v3/ayat_timing?surah=21&read=17" | python3 -c "import json,sys; \
  a=json.load(sys.stdin); print(sum(x['end_time']-x['start_time'] for x in a if 87<=x['ayah']<=88)/1000, 's')"
  ```

  Under about 2 minutes of verses, a story does not fill five reels: a collection, or three reels.
  Estimate: the whole episode lasts about twice its recitation (khidr and qarnayn: about 4 min of verses,
  9:04 and 7:38).
- **Drawing**: a prophet, a Companion or a known person only on a name card; violence never shown. A
  subject that needs them drawn is out.
- **Hadith excerpts**: the registry holds one excerpt per hadith (`excerpt_ar`). A story told by the
  Prophet ﷺ that needs several passages (Bukhari 2272, one per man) takes them from other narrations of
  the same story, or waits for the registry to allow several excerpts: say which.

## 3. Criteria

One line each per candidate, with its evidence:

- **Hook**: a situation of everyday life that holds in 3 seconds (inner states hook better than duties).
- **Gain**: what the viewer leaves with (a wrong idea corrected, a new way of seeing, a du'a to say, an
  act to do).
- **Variety**: never the same format three episodes in a row (`docs/formats.md`; the two kinds of story
  count as one).
- **Overlap**: a lesson an earlier episode already drew (qarnayn-04: « هذا رحمة من ربي », so Qaroun's
  « على علم عندي » would repeat it unless the angle changes).
- **Cost**: backgrounds or characters to draw (catalog), hadith readings found or not
  (`find-hadith-recording`), verses already cut (`content/recitations/sayegh.json`), new source types.
  Length is not a cost: a reel lasts what its content needs (owner's decision, 2026-11-08).

## 4. Challenge

Before recommending, look for what is wrong with the owner's idea and with yours: a misconception
nobody really holds, a source outside the policy or weaker than another, a format repeated, an overlap
with an earlier episode, a part that rests on your own explanation and no text. Say it in one sentence
with its evidence, and what you would do instead. Do not follow silently; do not override silently.

## 5. The sheet

Write it under the subject in `docs/themes.md` (or send it, for a subject not saved yet):

- the format recommended and one alternative, with the criteria lines that decide;
- the reels, one line each: what is told or argued, its sources (id or reference, registered or not),
  the recitation length;
- the estimated length of the whole episode;
- what is new to make (backgrounds, characters, a source type, several excerpts);
- the owner's decisions, as questions.

## 6. After the owner's choice

`format:` in `content/episodes/<theme>.yaml`, the decision in `docs/themes.md`, then the `new-theme`
skill in that format (its hook: `write-hook`, « The hook by format »). Tag the scenes with their roles
(`event`, `lesson`, `example`…): `validate.py` warns on a reel not yet validated that misses a beat of
its format.

## A new format

Proposed with its sheet in `docs/formats.md` style (when, reels, hook, checks, pitfalls), tried on one
episode, then added to the catalog, to the schema's `format` enum and to `format_problems` in
`scripts/validate.py`, once the owner validates it.
