# Skills de l'ancien circuit

Les procédures telles qu'elles étaient jusqu'au 2026-11-11, pour les dix épisodes publiés avant le modèle
« un film et ses shorts » (`docs/model.md`) : épisodes en `content/episodes/*.yaml`, voix VoiceTut, styles
(plat, papier, craie, enluminure), workflow `render` avec rendu candidat puis `promote`.

Elles ne sont plus des skills : une session ne les suit que pour **corriger une vidéo déjà publiée dans
l'ancien circuit**, tant que son épisode n'est pas réécrit. Tout travail nouveau suit les skills de
`.claude/skills/`.

| Fichier | Ce qu'il décrit |
| --- | --- |
| `new-theme.md` | d'un thème à un épisode en reels (sources, plan, script, textes de publication, PR) |
| `write-hook.md` | l'accroche d'après la vidéo de référence, les battements par format |
| `narration-takes.md` | les prises VoiceTut : synthèse, écoute par Whisper, reprises, prises candidates puis figées |
| `release-render.md` | workflow `render` (candidat, final), `finalize.py validate`, `promote` |
| `add-style.md` | un lieu du catalogue en couches, un style entier (kit) |
