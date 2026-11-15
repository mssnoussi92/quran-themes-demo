---
name: record-stats
description: Record the statistics screenshots the owner sends (TikTok Studio above all; a YouTube Studio page for what YouTube's API does not give) on the « Statistiques » page of quran-reels, where every video of the Page is measured - identify each video (a theme video by its id <doc>/<part> or its English title, a reel by its passage), read only the numbers on the image, show them and ask before saving, dispatch the insights workflow of mssnoussi92/quran-reels with the input `manual`, check the page. Use whenever the owner sends a screenshot of statistics or numbers of a video in this repository's sessions.
---

# Record statistics screenshots

The owner sends his screenshots **in any session** (his request, 2026-11-15); the numbers of every
video of the Page, theme videos and daily reels, live in one place: `insights.json` on the branch
`state` of **quran-reels**, shown on https://mssnoussi92.github.io/quran-reels/catalog/stats.html.
Never in a file of this repository (the old sheet of `docs/retention/calendar.md` is retired).

**The procedure is the skill of the same name in quran-reels**: read it first and follow it,
whole:
`https://raw.githubusercontent.com/mssnoussi92/quran-reels/main/.claude/skills/record-stats/SKILL.md`
(public: `curl -sS` works from any session; or the GitHub tools, `get_file_contents`).

What matters most, in case that file cannot be read:

1. **Each line is one video**: a theme video's `video` is its id `<doc>/<part>`
   (`moussa-khidr/short-2`, `dua/film`, `dua-9x16/film`: the section of
   `docs/retention/publication-<doc>.md` whose English title is the caption's first line); a reel's
   is its passage (`107:1-7`, `9:51-51`). TikTok shows the day the owner published the draft, not
   the calendar's day: never tie a line by its date alone; ask when unsure.
2. **Only the numbers on the image**, under these names: `views`, `avg_watch` (s), `finished`
   (« A regardé la vidéo en entier », %), `follows`, `likes`, `comments`, `shares`, `saves`, `reach`,
   `hook` (only if shown as a number). Facebook, Instagram and YouTube are read every night: from a
   YouTube Studio page keep only `hook` (« regardées » against « balayées ») and `kept_30s`.
3. **Show the table, ask** with the choice tool: « Je les enregistre sur la page Statistiques ? ».
4. **On his yes**, dispatch `insights.yml` of `mssnoussi92/quran-reels` on `main`, input `manual`:
   `[{"platform": "tiktok", "video": "moussa-khidr/short-2", "published": "2026-11-14", "seen":
   "<today>", "metrics": {"views": 732, "likes": 73, "comments": 0}}]`. If the GitHub tools cannot
   reach quran-reels, attach it (`add_repo`, owner `mssnoussi92`, repo `quran-reels`, access `push`);
   if refused, tell the owner and give him the table.
5. **Check** the run, then the page after the catalogue's rebuild: each capture under its video,
   none under « Captures sans vidéo reconnue ».
