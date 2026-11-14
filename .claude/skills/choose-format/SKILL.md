---
name: choose-format
description: Decide with the owner what a new film of quran-themes-demo will be, before any script - the kind of subject (a story, misconceptions, a collection, one text explained, two paths, a practical act: docs/formats.md), the hard filters (a source in the policy for every part, recitation length, nothing that would need a person drawn, every short able to stand alone, what the tools of the model can play today), the criteria (a first frame worth three seconds, what the viewer gains, variety, cost in voice requests, drawings and render time), then a sheet with a recommendation, one alternative and the owner's decisions, challenging the owner's idea where the evidence points elsewhere. Use before new-theme, when the owner shares a subject, a lesson or a story, when choosing which published episode to rewrite next, and when ordering the themes to come.
---

# Choose what the film will be

Every video is now a film and the shorts cut from it (`docs/model.md`, validated on 2026-11-11), and
the published episodes are to be rewritten that way. The formats of `docs/formats.md` still say what
kind of subject it is and what its parts are; they no longer choose a visual style (one look: a
filmed clip and drawn silhouettes). The owner asked to be challenged, always: say plainly when their
idea, or yours, is weaker than another on the evidence. You recommend; the owner decides.

## 0. Read

- `docs/model.md`: what a film and a short are made of, and **what the tools do not do yet**.
- `docs/formats.md`: each format, when to choose it, its parts, its pitfalls.
- `docs/themes.md`: the episodes made and their format, the subjects saved for later and their sheets.
- What the owner shared (a lesson, study cards, a reference video).

## 1. Kind of subject

| The subject is… | Format | In the model |
| --- | --- | --- |
| a story (Quran, or told by the Prophet ﷺ) of three events or more | `story-suspense`, `story-linear` | proven (Musa and al-Khidr): one short per event with its answer, the film with every part and what ties them |
| an inner state or a virtue people misunderstand, three misconceptions really held | `misconceptions` | in progress (the du'a, `docs/themes.md`): each wrong idea is broken by one concrete fact of the Quran that can be drawn, its hadith as second proof |
| several short moments with one real thread | `collection` | not tried: one short per moment fits the model well |
| one hadith or one long verse, sentence by sentence | `text-explained` | not tried |
| two people, the same gift or trial, opposite answers | `two-paths` | not tried |
| an act people want to do better | `practical` | not tried |

Often two fit: keep both as candidates. A format not tried is proposed to the owner with its
structure (what each short holds, what the film adds) before anything is written.

## 2. Hard filters

Drop a candidate that fails one:

- **Sources**: a verse, or a hadith of the policy (Bukhari, Muslim, Tirmidhi graded sahih or hasan by
  al-Albani), for every part, found under that number in hadith-api (skill `new-theme`, step 2). A part
  with no source goes.
- **Recitation length** (Tawfiq As-Sayegh, read 17 on mp3quran.net):

  ```bash
  curl -s "https://www.mp3quran.net/api/v3/ayat_timing?surah=21&read=17" | python3 -c "import json,sys; \
  a=json.load(sys.stdin); print(sum(x['end_time']-x['start_time'] for x in a if 87<=x['ayah']<=88)/1000, 's')"
  ```

  A film lasts about twice its recitation (3:50 of verses in 7:47), and stays under ten minutes: over
  about 4:30 of verses, choose among them. A third to a half of a short is recited: a part with under
  fifteen seconds of verse is thin for a short of its own.
- **Nothing that needs a person drawn**: the model draws things and places only. A part that cannot be
  shown by a thing or a place (a face, a gesture, a crowd) is told on the clip alone, or goes. Violence
  is never shown; the unseen is never pictured.
- **Every short stands alone**: its promise is kept before it ends. A part that only prepares another
  belongs to the film, not to a short.
- **What the tools do not do yet** (`docs/model.md`, « Ce que les outils ne font pas encore »): no
  spelling for the voice only, nothing checks the rules automatically on the model's files. A candidate
  that needs one of these is not dropped: its sheet says which tool comes first.

## 3. Criteria

One line each per candidate, with its evidence:

- **First frame**: the strangest concrete fact of each part, sayable in three seconds and drawable as
  a thing (a boat torn open). A part whose opening is a general question about the viewer's life lost
  three viewers in four (khidr-01).
- **Gain**: what the viewer leaves with, and the life example that carries it.
- **What tells the parts apart**: one sentence per part; without it nothing announces the next one.
- **Variety**: never the same format three films in a row; and for a rewrite, the published episode
  measured weakest first.
- **Overlap**: a lesson an earlier film already drew.
- **Cost**: voice requests (one per short and one for the film: ten a day), a clip approved for each
  part (`docs/model.md`, « Clips filmés ») or one to show the owner, drawings to make, an ambience per
  picture, hadith readings found or not, render time (about two hours and a half for a film and
  three shorts), tools to build first.

## 4. Challenge

Before recommending, look for what is wrong with the owner's idea and with yours: a misconception
nobody really holds, a source outside the policy or weaker than another, a part that rests on your own
explanation and no text, a short that cannot stand alone, a format the tools cannot play yet. Say it in
one sentence with its evidence, and what you would do instead. Do not follow silently; do not override
silently.

## 5. The sheet

Write it under the subject in `docs/themes.md` (or send it, for a subject not saved yet):

- the format recommended and one alternative, with the criteria lines that decide;
- the shorts, one line each: its fact, its verses (ids, registered or not, recitation length), its
  meaning, what tells it apart;
- the film: its chapters, what it adds to the shorts, its estimated length;
- what is new to make: clips, drawings, ambiences, sources, tools;
- the voice budget, in requests and in days;
- the owner's decisions, as questions.

## 6. After the owner's choice

The decision in `docs/themes.md`, then the skill `new-theme`.

## A new format

Proposed with its sheet in the style of `docs/formats.md` (when, parts, hook, pitfalls) and the
structure of its film and shorts, tried on one film, then added to the catalog once the owner
validates it.
