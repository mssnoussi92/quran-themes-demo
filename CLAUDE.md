# quran-themes-demo — instructions pour Claude Code

Des **vidéos thématiques coraniques** : un thème ou une histoire, des citations sourcées affichées à l'écran, le verset récité par un vrai récitateur, une narration en égyptien dite par une voix de synthèse, des sous-titres anglais. D'un même script sortent un film (16:9) et ses shorts (9:16).

Le propriétaire est développeur, il échange en français. Réponds en français ; code, noms de fichiers et commits en anglais.

**Le contredire, toujours** (demande du propriétaire, 2026-11-08) : quand une de ses idées ou de ses décisions, ou une des tiennes, est fausse ou plus faible qu'une autre (source, format, angle, réplique, choix technique), dis-le franchement, avec la raison et ce que tu ferais à la place. Il tranche ; ne suis jamais en silence, ne passe jamais outre en silence.

**Ce fichier reste court** (décision du propriétaire, 2026-11-11) : il dit ce qu'une session doit savoir avant d'agir. Ce qui a été fait, essayé et décidé, avec ses chiffres, est dans `docs/history.md` : une tâche finie s'y ajoute (une entrée à la fin), pas ici. Ici, on met à jour « Où on en est » et on corrige une règle quand elle change.

| Pour… | Lire |
| --- | --- |
| ce qu'est une vidéo, les champs des fichiers, la chaîne de commandes, les réglages, les catalogues, ce que les outils ne font pas encore | `docs/model.md` |
| pourquoi une chose est comme elle est : décisions du propriétaire et tâches, dans l'ordre | `docs/history.md` |
| les thèmes faits, à réécrire, en réserve, et leurs fiches | `docs/themes.md` |
| d'où vient le modèle : mesures, essais, comparaisons | `docs/retention.md` |
| l'ancien circuit (épisodes en reels, personnages, styles, workflow `render`) : seulement pour corriger une vidéo publiée avant le modèle | `docs/history.md`, `docs/design.md`, `docs/legacy/` |
| l'environnement cloud | `docs/cloud-environment.md` |

## Le modèle : un film et ses shorts

**Décision du propriétaire, 2026-11-11** : le modèle validé sur Moussa et al-Khadir (un film de 7:47 et trois shorts) est celui de toutes les vidéos, et les épisodes déjà publiés sont réécrits en le suivant : scènes nouvelles, scripts améliorés, ambiance.

- **Une vidéo** : un clip filmé de nature et, dessus, les silhouettes dessinées de ce que dit le texte (des choses et des lieux, jamais une personne) ; le verset récité sur sa scène, le mot récité en or ; la narration en égyptien, écrite phrase par phrase au rythme de la voix ; une ambiance sous la narration, jamais sous un verset ni un hadith.
- **Un short** (9:16, il tient seul) : une question, le verset, le sens, ce qu'on ne voit pas, un exemple de vie, la phrase à retenir, ce qui le distingue des autres, l'appel à suivre. **Le film** (16:9, moins de 10 min) reprend les shorts réplique par réplique et ajoute l'ouverture, les liaisons et la conclusion.
- **La voix** : Gemini 3.8 Flash TTS, `Algieba` (étiquette `D`), palier gratuit de 10 requêtes par jour : une requête par texte, jamais par phrase, le script validé avant. Secours : VoiceTut `Mohammed`.
- **Le clip** se cherche pour le plan du short, se regarde en entier, se prépare, et se montre au propriétaire avant d'être employé (`tools/trial/clip.py`).
- **Une série** (propriétaire, 2026-11-11) : des shorts qui tiennent seuls, sans film. La première, « آية وحكايتها » : un verset, le fait de son récit de révélation en accroche, son sens d'après un tafsir nommé (`docs/themes.md`).
- **Où** : `content/trial/` (un fichier par short, un par film ou par série), `tools/trial/`, `video/src/trial/` ; le dossier s'appelle encore `trial`, ce n'est plus un essai.
- **Le propriétaire décide trois fois** : le sujet, le script avant la voix, les vidéos à la fin. Sa validation s'inscrit sur sa parole (`script_validated`, `validated`), jamais par l'IA. Il publie à la main.

## Règles obligatoires

**Ce sont les seules** (propriétaire, 2026-11-11).

- **Une citation n'existe que par son id.** Aucun texte de verset ou de hadith n'est tapé à la main. Les textes viennent du registre `content/sources/`, lui-même rempli depuis une API (quran.com, hadith-api), jamais depuis la mémoire d'un modèle.
- **Jamais de synthèse vocale sur le Coran.** Un verset est récité par un vrai récitateur. La voix de synthèse lit seulement la narration ; un hadith est lu par une vraie voix (`recording` du registre).
- **Jamais de personnage pour un prophète, un Compagnon ou une personne connue** ; dans le modèle, personne n'est dessiné du tout.
- **Politique des hadiths** (`content/policy.yaml`) : Sahih al-Bukhari, Sahih Muslim et Jami' at-Tirmidhi. Un hadith de Tirmidhi n'est cité que si **al-Albani** le juge sahih ou hasan (jugements recopiés de hadith-api) ; son jugement s'affiche sous la référence. Tout autre recueil : demande au propriétaire avant d'élargir. **Tafsir** (propriétaire, 2026-11-11) : al-Muyassar, as-Sa'di, Ibn Kathir, par id du registre ; un passage de tafsir n'est ni lu ni affiché, une réplique de sens repose dessus et son nom s'écrit. Un récit de révélation ne se raconte que s'il est dans les recueils de cette politique.
- **Jamais l'invisible figuré.** Ni le paradis, ni l'enfer, ni le Jour du Jugement, ni les anges ne sont dessinés ni générés en image : le texte et la récitation seulement.

`tools/trial/rules.py` refuse ce qu'un code peut voir de ces règles dans les fichiers (une citation hors registre ou hors politique, la voix qui dirait un verset), et un signe qu'aucune police du projet ne sait dessiner. Les dessins et la première image se vérifient à l'œil, à chaque script et à chaque image.

## Ce qui vaut toujours

- **La validation est la parole du propriétaire**, jamais un jugement de l'IA. Une réplique changée après sa validation redevient à valider. Un « parfait » ou un accord donné dans un autre contexte ne vaut pas validation : en cas de doute, dis comment tu l'as lu. Quand plusieurs choses attendent son mot, un « je valide » qui ne nomme pas la sienne **se confirme avant toute requête de voix** (2026-11-11 : « je valide le script » visait les textes du du'a ; la session a fait la voix de la série).
- **Aucune requête de voix avant « je valide le script »** : une prise ne se retouche pas, et il y en a dix par jour.
- **Zéro dépense** : paliers gratuits seulement ; jamais plusieurs projets ou comptes pour multiplier un quota.
- **Une clé d'API n'est jamais tapée dans la conversation** ni affichée : secret du dépôt GitHub (`GEMINI_API_KEY`, lu par le workflow `voice-test`) ou variable de l'environnement (`PIXABAY_API_KEY`).
- **Exemples honnêtes** : une scène inventée est une scène type (« زي… »), jamais une histoire vraie ; aucun chiffre sans source.
- **Voix déclarée** : la voix de synthèse est signalée comme générée par IA dans chaque description.
- **Les mots qu'il a refusés** sont dans `content/wording.yaml` (et leur histoire dans le skill `write-hook`) : ajoute chaque nouveau refus aux deux.
- **Une chose à ajouter va une fois, au bon endroit** : quand une demande peut se lire « une fois » ou « partout », c'est une fois ; dis où et pourquoi.
- **Pas de pull request** sauf demande. Commits sur la branche de la session, sans nom de modèle dans le message.

## Où sont les choses

```
content/
  trial/                 le modèle : un fichier par short (clip, ambiance, couverture, textes, segments), un par film
                         (chapitres, vignette) ; takes/ : les prises de la voix D (une par texte, gardées)
  sources/*.yaml         registre des sources (ids stables ; statut proposed / validated / excluded ; lecture d'un hadith ;
                         tafsir.yaml : les passages de tafsir sur lesquels repose une réplique de sens)
  recitations/           où est chaque verset cité dans la sourate du récitateur, et le temps de chaque mot
  voice-test/*.txt       textes dits par la voix (NN-trial-<id>.txt : identiques aux répliques du fichier)
  policy.yaml            politique des sources      publish.yaml   pages, limites des plateformes, lignes fixes
  wording.yaml           mots refusés par le propriétaire          dialect.yaml   arabe standard à ne pas dire en égyptien
  episodes/, audio/, characters.yaml, backgrounds.yaml, pronunciation.yaml      l'ancien circuit
tools/trial/             script.py (le script en une page, à valider), rules.py (les règles sur les fichiers), clip.py (chercher,
                         regarder, préparer un clip), sources.py (une source du registre, prête à jouer), prepare.py (un short ;
                         --film : le film, film.py), ambience.py (la nappe ; --mix sous une vidéo rendue), check.py (contrôle
                         d'un rendu sur ses planches d'images), splice.py (quelques secondes re-rendues et raccordées, le
                         reste copié), videos.py (les vidéos d'un film, pour le workflow), publish.py (textes à coller),
                         gallery.py (la page où le propriétaire revoit tout et copie les textes)
tools/audio/             align.py (chaque phrase retrouvée dans une prise), recitation.py (coupes des versets), build.py et
                         listen.py (nivelage, coupes, Whisper : partagés avec l'ancien circuit)
tools/tts/gemini.py      la voix (workflow voice-test) ; tools/sources/fetch.py : textes du registre depuis les API
video/src/trial/         Trial.tsx (short), Film.tsx (film), Cover.tsx (couverture, vignette), un fichier de dessins par histoire
                         (Ayah.tsx : ceux de la série)
scripts/validate.py, tests/     le registre et l'ancien circuit ; tests/test_trial_rules.py : les règles du modèle
.github/workflows/       validate.yml (PR et main), voice-test.yml (la voix), render.yml et promote.yml (ancien circuit)
.claude/skills/          les procédures (voir « Skills ») ; docs/legacy/skills/ : celles de l'ancien circuit
build/, video/out/, video/public/trial/     générés, hors dépôt (clips et ambiances n'y entrent jamais)
```

## Commandes

Chaîne complète et réglages : `docs/model.md`. Celles de l'ancien circuit : `docs/history.md`.

```bash
uv run --with pyyaml python3 tools/trial/script.py --film <film>            # le script en une page, durées estimées : au propriétaire
uv run --with pyyaml python3 tools/trial/rules.py --film <film>             # les règles sur les fichiers (--all ; --draft) : 0 erreur
python3 tools/trial/clip.py --search "<ce que l'image doit montrer>" --out <dir>     # chercher un clip ; --look <n> : le voir en entier
python3 tools/trial/clip.py --trial <id> --out <dir>/<id>.mp4                # le clip du short, préparé (clip.take)
uv run --with pyyaml --with numpy python3 tools/trial/prepare.py --trial <id> --draft --clip <clip>          # brouillon sans voix
uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/prepare.py --trial <id> --voice D --takes content/trial/takes --clip <clip>
uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/prepare.py --film <film> --voice D --takes content/trial/takes
python3 tools/trial/check.py video/out/<vidéo>.mp4 --data video/public/trial/<id>-D.json --out <planche.jpg>  # format, volume, images
uv run --with pyyaml python3 tools/trial/publish.py --film <film>            # textes à coller (--draft avant la voix)
uv run --with pytest --with jsonschema --with pyyaml pytest -q tests         # les règles refusent encore ce qu'elles doivent
uv run --with jsonschema --with pyyaml scripts/validate.py                   # le registre et l'ancien contenu
cd video && npm run typecheck
```

## Environnement cloud

- Navigateur pour Remotion : `REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.
- Un paquet de rendu (`npx remotion bundle`) copie `video/public` (1,7 Go) : n'en garder qu'un dans le scratchpad, le disque de la session s'est déjà rempli ainsi (2026-11-12).
- Un rendu fait environ 4 images par seconde sur 4 cœurs : une vidéo à la fois, en arrière-plan, et **rien de lourd à côté** (Whisper, un autre rendu, plusieurs décodages vidéo) : un rendu a déjà été tué faute de mémoire.
- Modèles Whisper : cache Hugging Face, `~/.cache/huggingface`. Venvs de l'ancien circuit : `/opt/venvs/silma`, `/opt/venvs/voicetut` (le message « /opt/venvs/READY missing » au démarrage ne gêne pas le modèle).
- Un téléchargement refusé par le proxy (403) : le domaine n'est pas autorisé ; dis au propriétaire lequel ajouter (`docs/cloud-environment.md`), ne contourne pas.
- Pour que le propriétaire **écoute** un son seul, passe par le workflow `voice-test` (release `voice-test-latest`) ; une vidéo se lui envoie dans la conversation.
- Les vidéos d'un run GitHub se téléchargent dans la session : `actions_list` (`list_workflow_run_artifacts`), puis `actions_get` (`download_workflow_run_artifact`) donne un lien temporaire que `curl` suit ; à contrôler sur leurs planches avant tout envoi.

## Skills (`.claude/skills/`)

- `choose-format` : ce que sera un film, avant tout script (type de sujet, filtres, critères, contradiction franche, fiche).
- `new-theme` : d'un thème, d'une histoire ou d'un épisode à réécrire jusqu'au film et à ses shorts.
- `write-hook` : le script d'un short et les répliques propres au film ; les mots refusés ; les contrôles avant de l'envoyer.
- `new-scene` : le clip cherché pour le plan, sa place dans le cadre, les silhouettes dessinées, l'ambiance.
- `narration-takes` : la voix dans le palier gratuit, une requête par texte, chaque phrase retrouvée dans la prise.
- `voice-spelling` : faire bien dire un mot.
- `find-hadith-recording` : la lecture d'un hadith par une vraie voix, sur archive.org.
- `release-render` : rendre, contrôler chaque vidéo sur ses planches, poser l'ambiance, livrer, inscrire le « je valide ».

## Sous-agents (décision du propriétaire, 2026-11-11)

La session est l'orchestrateur : elle fait le plan, confie ce qui s'y prête, relit tout ce qui revient.

- **À confier** : un travail indépendant, spécifié par écrit et vérifiable par un test ou une commande (un outil et ses tests, un workflow, une recherche mécanique). **À garder** : le script, les sources et leur vérification, les images, tout ce que le propriétaire juge à l'œil ou à l'oreille, et la relecture.
- **Le modèle** : le moins cher qui suffit (Sonnet pour du code spécifié avec ses tests, Haiku pour une recherche mécanique) ; celui de la session pour l'écriture et la relecture.
- **Le cahier des charges** dit le but, les fichiers à lire, ce qui est interdit (rien de lourd pendant un rendu, aucun fichier validé modifié), ce qui prouve que c'est fini, et ce qu'il faut rendre (commandes lancées, doutes).
- Un agent travaille dans un worktree (`.claude/worktrees/`, ignoré) ; son travail est **relu ligne à ligne**, corrigé, puis intégré par un commit de la session, sans nom de modèle.
- Premier essai (`tools/trial/rules.py`) : cinq minutes, trois corrections à la relecture, dont une sur la règle la plus importante.

## Publication

- **Pages** : la même page que Quran Words Daily (Facebook `quranwordsdaily`, Instagram et YouTube `quran_words_daily`, TikTok `quran.words.daily`). Le propriétaire publie **à la main**.
- **Signature** : le nom de la page sur chaque image. Sur TikTok la page s'appelle `@quran.words.daily` (`@quran_words_daily` y est le compte de quelqu'un d'autre) : chaque 9:16 est rendu une seconde fois signé de ce nom (prop `platform`).
- **Textes** : `tools/trial/publish.py` écrit un bloc à coller par plateforme (titre, description, sources avec leur lien, crédits du clip et de l'ambiance, ligne de la voix IA, hashtags de la page) ; titre et description du thème s'écrivent à la main dans `publish` de chaque fichier et se valident avec les vidéos.
- **Récitateur** : Tawfiq As-Sayegh (aucune revendication de droits constatée ; Alafasy a vu une vidéo coupée par Rights Manager).
- **Licence** : MIT ; Remotion garde la sienne (gratuite pour un particulier). Textes cités et récitations : à leurs éditeurs.

## Où on en est (à tenir à jour ; le détail est dans `docs/history.md`)

- **La publication commence le vendredi 13 novembre**, à la main, Moussa et al-Khadir en premier. Calendrier et fiche de mesures proposés, pas encore validés (`docs/retention/calendar.md`) : à 48 heures, il envoie une capture des statistiques de chaque vidéo et la session remplit la fiche.
- **Rien n'est publié** (propriétaire, 2026-11-11), et tout ce qui est fait est validé : trois films, leurs neuf shorts et les trois shorts de la série attendent qu'il les publie. Aucune mesure n'existe donc encore sur le modèle : la session le lui a dit (2026-11-12) et recommande de publier avant de produire davantage.
- **Moussa et al-Khadir** : film et trois shorts validés, y compris les sept vidéos corrigées le 2026-11-11 (« ﷺ » et « al-Khiḍr » des sous-titres, quelques secondes raccordées : `video/out/essai-2/` de la session, envoyées) : ce sont elles qui se publient.
- **Le du'a** (`asked`, `written`, `waited`, film `dua`) : **tout est validé** : vidéos (voix, montage, couvertures, vignette, rappel, ambiance) et sources le 2026-11-11, textes à coller le même soir (`docs/retention/publication-dua.md`) ; release brouillon `dua-candidate`. À publier par lui.
- **Dhul-Qarnayn** (`west`, `tribute`, `barrier`, film `qarnayn`) : **tout est validé** le 2026-11-12, vidéos et textes à coller (`docs/retention/publication-qarnayn.md`) ; release brouillon `qarnayn-candidate`. À publier par lui. Ensuite : les autres épisodes publiés à réécrire (`docs/themes.md`).
- **La série « آية وحكايتها »** (`ayah` : `caravan` 62:11, `duha` 93:1-8, `hope` 39:53) : pilote de trois shorts (1:41, 1:50, 1:31), **tout est validé** le 2026-11-12 : le script (une réplique du short 3 changée à sa demande : `content/wording.yaml`, `sins-named`), puis les vidéos (voix, images, clips, couvertures, ambiances ; le short 1 en plein jour, parce que la prière du vendredi est à midi), ses vingt-deux sources et les textes à coller (`docs/retention/publication-ayah.md`) ; release brouillon `ayah-candidate`. À publier par lui. Sa dernière réplique promet « le verset suivant et son récit » : trois versets candidats pour la suite (24:22, 8:32-33, 9:118 : `docs/themes.md`) ; **sa décision (2026-11-12) : publier d'abord, poursuivre ensuite**, le choix se fera avec les premières mesures (vers le 27 novembre si la série sort un vendredi par semaine).
- **Les films en vertical, à l'essai** (sa demande, 2026-11-12 : « les films aussi en 9:16, à mettre sur Facebook » ; il commence à publier le vendredi 13) : le même film, même voix et même minutage, monté comme ses shorts (`TrialFilm916`, `only: tall`, release brouillon `<files>-9x16-candidate`, texte par `publish.py --tall` ; `docs/model.md`). Avis donné : oui pour Facebook (toute vidéo y est un Reel, le 16:9 y est une bande au milieu du téléphone), mais il y répète ses trois shorts : en publier un d'abord, après ses shorts, et comparer. Il publie **Moussa et al-Khadir en premier**. Les trois films verticaux sont rendus, contrôlés et envoyés avec leur texte Facebook (`video/out/tall/` de la session) : Moussa et al-Khadir (7:47, rendu dans la session), Dhul-Qarnayn (8:25) et le du'a (7:36), ces deux-là dans leurs releases brouillon `qarnayn-9x16-candidate` et `dua-9x16-candidate`. **Validés par lui le 2026-11-12** (« je valide tout » : le montage vertical et le texte Facebook ; `tall.validated` de chaque fichier de film ; textes : `docs/retention/publication-<film>-9x16.md`). Le film 16:9 et le film vertical de Moussa et al-Khadir ne sont dans aucune release (rendus dans la session) : ils ne vivent que dans la conversation et dans `video/out/` de la session.
- **Une deuxième série, « سنريهم آياتنا »** (son idée, 2026-11-12 ; titre validé par lui, 41:53) : Abou Lahab (111:1-5, Ibn Kathir) et deux versets scientifiques, sans jamais dire que la science prouve le Coran ; l'embryologie, qu'il cite, est déconseillée par la session (nos trois tafsirs y lisent des étapes de quarante jours), 51:47 et 6:125 recommandés. Un style à elle, **validé par lui** (une enquête : photos du ciel de l'ESA, crédit écrit sur l'image ; schémas ; frise des dates en or). **Ses trois épisodes : Abou Lahab, 6:125 et l'embryologie** (51:47 en réserve) ; script envoyé le 2026-11-12 (`docs/scripts/signs.md`), **à valider avant toute voix**. Le style demande une composition nouvelle et un type « source scientifique » au registre, à faire. Fiche et recherche : `docs/themes.md`.
- **La page du propriétaire** (sa demande, 2026-11-11 : revoir films et shorts sans passer par une session, avec aperçu, couverture, textes et bouton « Copier ») : l'artefact privé « Films et shorts à publier » de son compte claude.ai (`list_artifacts` le retrouve par ce titre), fait par `tools/trial/gallery.py` et republié par la session à chaque film livré ou validé (skill `release-render`, §7). Y sont, tous validés : Moussa et al-Khadir, le du'a, Dhul-Qarnayn (chacun avec son film vertical et son texte Facebook, depuis le 2026-11-12) et la série « آية وحكايتها ».
- **Rendu dans GitHub Actions** : en service depuis le 2026-11-11 (workflow `film`, skill `release-render` §0) : sept vidéos en 70 minutes, release brouillon `<files>-candidate`, `from_run` pour republier sans re-rendre. Le premier film (qui lit un ancien épisode) se rend encore dans la session.
