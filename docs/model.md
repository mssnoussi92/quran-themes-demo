# Le modèle : un film et ses shorts

Référence du modèle validé par le propriétaire le 2026-11-11 sur l'histoire de Moussa et d'al-Khadir (un film
de 7:47 et trois shorts). **Décision du même jour : les épisodes doivent être réécrits en suivant ce modèle**
(scènes nouvelles, scripts améliorés, ambiance). Ce fichier dit de quoi une vidéo est faite, où cela s'écrit,
avec quels réglages, et ce que les outils ne font pas encore. La marche à suivre est dans les skills
(`.claude/skills/` : `new-theme`, `write-hook`, `new-scene`, `narration-takes`, `release-render`) ; l'histoire
des décisions dans `docs/retention.md`.

Le dossier s'appelle encore `trial` (l'essai) : `content/trial/`, `tools/trial/`, `video/src/trial/`, et les
compositions `Trial916`, `TrialFilm169`, `TrialCover916`, `TrialThumb169`. Ce n'est plus un essai.

## Ce qu'on livre

| Vidéo | Format | Pour |
| --- | --- | --- |
| Le film, moins de 10 min | 16:9 | YouTube |
| 3 à 6 shorts, chacun tient seul | 9:16 | Facebook, Instagram, YouTube Shorts |
| Les mêmes shorts signés `@quran.words.daily` | 9:16 | TikTok |
| Une couverture par short, une vignette pour le film | 9:16, 16:9 | grille du profil, YouTube |
| Titre et texte à coller, par vidéo et par plateforme | un fichier | le propriétaire publie à la main |

## Ce qu'est une vidéo du modèle

- **L'image** : un clip filmé de nature (mer, lune, ciel), muet, ralenti et bouclé, et **dessus des silhouettes
  dessinées à contre-jour** de ce que dit le texte : des choses et des lieux, jamais une personne. Le clip dit
  le lieu et l'heure, le dessin dit l'événement.
- **Le verset est récité sur sa scène** (Tawfiq As-Sayegh), son texte au-dessus de l'image, le mot récité en
  or, la traduction dessous ; un verset long passe par pages de 14 mots au plus. Plus de carte sombre.
- **La narration** (voix de synthèse, en égyptien) s'écrit phrase par phrase au rythme de la voix, la dernière
  phrase d'une réplique en or. La voix continue quand l'image change : aucun silence de transition.
- **Une ambiance sous la narration**, un enregistrement de terrain par image, **jamais sous un verset ni un
  hadith** : elle s'éteint avant, vaut zéro pendant, revient après.
- **Un short** = une question, le verset, le sens, ce qu'on ne voit pas, un exemple de vie, la phrase à
  retenir, puis ce qui relie au suivant et l'appel à suivre.
- **Le film** = les shorts repris réplique par réplique (mêmes prises de voix), plus ses propres répliques
  (ouverture, liaisons, conclusion), en chapitres ; le rappel d'abonnement deux fois ; 12 secondes d'image
  calme à la fin pour l'écran de fin de YouTube.

## Où cela s'écrit

```
content/trial/<short>.yaml     un short : clip, ambiance, couverture, textes de publication, segments
content/trial/<film>.yaml      un film : chapitres, vignette, textes de publication (le premier s'appelle film.yaml)
content/voice-test/NN-trial-<id>.txt   le texte dit par la voix : les répliques du fichier, une par ligne, dans l'ordre
content/trial/takes/<voix>-trial-<id>.flac   la prise de la voix pour ce texte (une requête Gemini), gardée
tools/trial/clip.py            le clip filmé (Pixabay, hors dépôt)
tools/trial/prepare.py         un short -> video/public/trial/<id>-<voix>.json (minutage) ; --film <id> : le film
tools/trial/film.py            le film (appelé par prepare.py --film)
tools/trial/sources.py         un verset ou un hadith du registre, prêt à jouer : textes, coupe du récitateur, lecture, nivelage
tools/trial/script.py          le script d'un film et de ses shorts en une page à valider, avec les durées estimées
tools/trial/ambience.py        la nappe d'ambiance d'une vidéo ; --mix : la poser sous une vidéo déjà rendue
tools/trial/publish.py         les textes à coller
tools/trial/check.py           contrôle d'un rendu : format, durée, volume, planches d'images
tools/trial/splice.py          quelques secondes d'une vidéo re-rendues et raccordées, le reste copié tel quel, prouvé image par image
tools/trial/rules.py           les règles sur les fichiers d'un film ; tools/trial/videos.py : ses vidéos et images, pour le workflow film
tools/audio/align.py           chaque phrase d'un texte retrouvée dans une longue prise
tools/tts/gemini.py            la voix (dans le workflow voice-test : la clé est un secret du dépôt)
video/src/trial/               Trial.tsx (short), Film.tsx (film), Cover.tsx (couverture, vignette),
                               Boat.tsx, Home.tsx, Wall.tsx (premier film), Dua.tsx (le du'a) : les dessins
video/public/trial/            (ignoré) données préparées, clips, audio
build/trial/ambience/          (ignoré) enregistrements d'ambiance téléchargés
video/out/                     (ignoré) rendus
```

### Un short (`content/trial/<id>.yaml`)

| Champ | Ce que c'est |
| --- | --- |
| `id` | son nom, celui du fichier ; c'est aussi la clé de son dessin (`PICTURES` de `Trial.tsx`, `WIDE` de `Film.tsx`) |
| `handle` | la signature (`@quran_words_daily`) ; celle de TikTok vient de `content/publish.yaml` (`handles`) |
| `clip` | le clip filmé : `source: pixabay`, `id`, `author`, `page` ; `take`, ce qu'on en garde (`from`, `seconds` : le passage qui sert ; `height` : un 4K réduit ; `pingpong: true` : le passage à l'endroit puis à l'envers, un ciel qui boucle sans saut ; `slow: 5` : cinq fois plus lent, images fondues, pour ce qui n'arrive qu'une fois, un soleil qui se couche sur tout le short, avec `rate: 1`), appliqué par `tools/trial/clip.py` ; et comment il se pose dans le cadre 9:16 : `position` (recadrage), `shift` (px, vers le bas ou le haut, pour laisser sa place au texte), `brightness`, `ground` (couleur derrière), `horizon` (hauteur de l'horizon : l'image grandit lentement autour), `rate` (vitesse, 0,85 par défaut) ; `landscape` : les mêmes réglages pour le 16:9 du film, et `side` (le côté du dessin, le texte prend l'autre) |
| `ambience` | l'enregistrement sous la narration : `source: bigsoundbank`, `id`, `title`, `author`, `licence`, `page`, `from` et `seconds` (l'extrait bouclé), `level` (LUFS de la nappe) |
| `verses` | seulement dans le premier film : l'ancien épisode préparé d'où viennent ses versets ; un fichier sans `verses` lit le registre (`tools/trial/sources.py`) |
| `voices` | les voix connues : `D` (Gemini, Algieba), `V` (VoiceTut, secours), `X` (brouillon muet) |
| `text` | son texte de voix : `content/voice-test/<text>.txt` |
| `cover` | la couverture 9:16 : `scene` montrée, `title` en grand, `tag` au-dessus, `focus` (hauteur du sujet), `file` (nom du fichier livré) |
| `publish` | `title` et `description` (ar, en), `part` (son numéro dans la série) |
| `segments` | dans l'ordre : `narration: <nom>` avec `scene` et `lines` (`ar`, `en` ; `kept: <épisode>.<scène>` pour une réplique validée reprise d'un ancien épisode), `verse: quran.S.A` ou `reading: hadith.<recueil>.<n>` (lu par une vraie voix) avec `scene` |
| `script_validated`, `validated` | la parole du propriétaire : le script, puis la vidéo (`what` : ce qu'elle couvre) ; jamais écrits par l'IA de son propre chef |

Une réplique (`lines`) est coupée en phrases après « ، … . ! ؟ : » : chaque phrase s'écrit quand la voix la
dit. `scene` est le nom d'un état du dessin (`holed`, `fleet`, `sail`, `sea` pour le bateau) : l'image passe de
l'un à l'autre en fondu.

### Un film (`content/trial/<id>.yaml`, avec `chapters`)

| Champ | Ce que c'est |
| --- | --- |
| `id`, `files` | son nom (le premier : `film`) ; `files` : le début du nom des vidéos livrées (`khidr-film-16x9.mp4`, `khidr-short-<n>-<id>.mp4`) |
| `text` | le texte de voix de ses répliques propres (une requête pour toutes) |
| `verses` | seulement dans le premier film (ancien épisode préparé) ; sinon le registre |
| `outro` | secondes d'image calme à la fin (12) |
| `thumbnail` | la vignette : `title`, `tag`, `panels` (les shorts montrés côte à côte, le premier à droite), `file` |
| `publish` | `title`, `series` (le nom de la série, repris par les shorts), `description`, `hashtags` (2 ou 3, ceux du thème), `narration` (la ligne qui déclare la voix IA, par voix), `out` (où écrire les textes à coller) |
| `chapters` | chacun : `id`, `title` (ar, en : un chapitre YouTube), `number`, `segments` |

Un segment de film est l'un de : `reuse: <short>.<narration>` (les répliques d'un short, sa prise telle
quelle ; `lines: [..]` pour n'en prendre que certaines), `narration: <nom>` avec ses `lines` (répliques propres
au film), `verse: quran.S.A`, `reading: hadith.<recueil>.<n>` (hadith lu par une vraie voix). `picture` (un
short) et `scene` disent l'image, gardés d'un segment au suivant ; `shots` donne une image par phrase
(l'ouverture) ; `subscribe: true` fait passer le rappel d'abonnement pendant ce segment.

## La chaîne, dans l'ordre

```bash
cd video && npm ci && cd ..
uv run --with pyyaml python3 tools/trial/script.py --film <film>       # le script en une page, durées estimées : au propriétaire, avant la voix
uv run --with pyyaml python3 tools/trial/rules.py --film <film>        # les règles sur les fichiers (ou --all ; --draft avant que les lectures soient trouvées) : 0 erreur avant d'écrire au propriétaire
python3 tools/trial/clip.py --search "<ce que l'image doit montrer>" --out <dir>   # chercher un clip pour le plan : table et planche
python3 tools/trial/clip.py --look <n> --out <dir>                     # un clip entier sur 16 images, avant de le retenir
python3 tools/trial/clip.py --trial <id> --out <dir>/<id>.mp4          # le clip du short, préparé comme le dit `clip.take` (PIXABAY_API_KEY de l'environnement)

# brouillon sans voix : le script sur ses scènes, aucune requête dépensée
uv run --with pyyaml --with numpy python3 tools/trial/prepare.py --trial <id> --draft --clip <clip>
(cd video && npx remotion still Trial916 out/<id>-0.png --frame=0 --props='{"trial":"<id>","voice":"X","data":null}')

# la voix : workflow voice-test (skill narration-takes), puis la prise dans content/trial/takes/
uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/prepare.py --trial <id> --voice D --takes content/trial/takes --clip <clip>
uv run --with pyyaml --with faster-whisper==1.1.1 --with numpy python3 tools/trial/prepare.py --film <film> --voice D --takes content/trial/takes

# rendus (skill release-render) : un bundle, puis chaque vidéo ; environ 4 images par seconde sur 4 vCPU
cd video && npx remotion bundle src/index.ts --out-dir <bundle>
npx remotion render <bundle> Trial916 out/<files>-short-<n>-<id>.mp4 --concurrency=4 --crf=21 --props='{"trial":"<id>","voice":"D","data":null}'
npx remotion render <bundle> Trial916 out/<files>-short-<n>-<id>-tiktok.mp4 --concurrency=4 --crf=21 --props='{"trial":"<id>","voice":"D","platform":"tiktok","data":null}'
npx remotion render <bundle> TrialFilm169 out/<files>-film-16x9.mp4 --concurrency=4 --crf=21 --props='{"film":"<film>","voice":"D","data":null}'
npx remotion still <bundle> TrialCover916 out/<id>-cover.png --frame=45 --props='{"trial":"<id>","voice":"D","data":null}'
npx remotion still <bundle> TrialThumb169 out/<film>-thumbnail.png --frame=45 --props='{"film":"<film>","voice":"D","data":null,"panels":null}'
cd .. && python3 tools/trial/check.py video/out/<vidéo>.mp4 --data video/public/trial/<id>-D.json
uv run --with pyyaml python3 tools/trial/publish.py --film <film>
```

**Le même chemin en CI, et le chemin normal** : le workflow `film` (dispatch à la main : `film`, `voice`, `only`,
`ambience`, `from_run`) refait les étapes de préparation et de rendu ci-dessus, une vidéo par job, et livre une
release brouillon `<files>-candidate` (secret `PIXABAY_API_KEY` ; `uv run --with pyyaml python3 tools/trial/videos.py
--film <film>` montre ce qu'il rendrait ; voir « Ce que les outils ne font pas encore », point 3).

## Réglages (ce que le propriétaire a validé)

| Quoi | Valeur | Où |
| --- | --- | --- |
| Voix | Gemini 3.8 Flash TTS, `Algieba` (D), en égyptien ; secours VoiceTut `Mohammed` (V) | `voices`, workflow `voice-test` |
| Requêtes de voix | 10 par jour (palier gratuit, par projet Google) : une par texte, jamais par phrase ; une prise faite est gardée | `content/trial/takes/` |
| Pauses de la voix | 0,5 s au plus dans une réplique, 0,7 s entre deux | `PAUSE`, `PAUSE_LINES` (`prepare.py`) |
| Où une phrase commence dans la prise | à la fin du silence qui la précède (−38 dB, 0,12 s au moins) ; sans silence entre deux mots, le creux trouvé à −34, −30 puis −26 dB ; une pause finit avant la fin du premier mot de sa phrase et ne sert qu'à une phrase (règle 3, depuis le du'a ; ces deux précisions, ajoutées pour Dhul-Qarnayn, ne déplacent aucune phrase du du'a) ; le premier film garde la règle 2 (un silence, ou rien) | `LOUDER_FLOORS` (`tools/audio/align.py`), `rule_of` (`prepare.py`) |
| Entre deux segments | 0,35 s d'image seule (short) ; 0,2 s entre deux narrations d'un même chapitre (film) | `GAP`, `BETWEEN`, `BETWEEN_LINES` |
| Début, fin d'un short | 0,5 s avant le premier mot (la première phrase est déjà écrite), 1,2 s après le dernier | `LEAD`, `TAIL` |
| Volume | chaque morceau à −16 LUFS ; la vidéo sort entre −16,2 et −16,4 | `tools/audio/build.py`, `prepare.py` |
| Ambiance | −36 LUFS (20 LU sous la voix), −38 pour un son aigu (grillons) ; part en 0,8 s avant une récitation, revient en 1 s ; ne revient pas entre deux récitations séparées de moins de 4 s ; une image montrée moins de 8 s ne change pas l'ambiance | `ambience.py` |
| Verset | pages de 14 mots au plus, le mot récité en or | `VERSE_PAGE` (`Trial.tsx`) |
| Traduction | deux lignes au plus dans le film, écrite plus petit sinon | `sub.rows` (`Film.tsx`) |
| Rappel d'abonnement (film) | 4 s, le nom de la page devient un bouton « اشترك · Subscribe » qui se remplit ; deux passages : après la première leçon et sur la dernière phrase ; jamais sur un verset, un hadith ou une mise en garde ; jamais avant 30 s | `subscribe: true`, `film.py` |
| Fin du film | 12 s d'image calme, l'ambiance s'éteint sur les 3 dernières | `outro` |
| Rendu | H.264, `--crf=21`, 30 images par seconde | commandes ci-dessus |

## Catalogues

**Clips filmés.** Le clip se cherche pour le plan du short, puis se prépare (propriétaire, 2026-11-11 : « il
faut chercher des clips qui marchent avec notre plan et les préparer », après deux shorts qui se ressemblaient
sous la même lune). La liste ci-dessous est l'endroit où regarder d'abord, pas une limite : elle vient de
quran-reels (`config/backgrounds.yaml` de ce dépôt, 2026-11-05), qui n'a qu'une nuit. Un clip qui n'y est pas se
trouve avec `tools/trial/clip.py --search` (il écarte ce que Pixabay marque généré par IA ou de basse qualité, ce
qui est trop court ou trop petit, ce dont les mots-clés nomment une personne), se regarde en entier avec `--look`
(personne, aucun animal, aucun texte, aucun bâtiment éclairé ; l'heure change-t-elle en cours de clip ?), se
prépare (`take`), s'essaie derrière le dessin, et **se montre au propriétaire avec sa page Pixabay avant d'être
employé** : « proposé » ici jusqu'à sa parole. Licence Pixabay : usage libre, pas de redistribution du fichier
seul, donc jamais dans le dépôt ; l'auteur est cité dans les descriptions.

| Pixabay | Auteur | Ce qu'il montre | Utilisé |
| --- | --- | --- | --- |
| 22183 | Artvan93 | mer calme au crépuscule, horizon rose (31 s) | le bateau |
| 29238 | Dans4 | pleine lune dans de fins nuages (20 s) | le garçon |
| 21488 | josefgadermaier | le soleil qui se couche derrière des arbres, sur un lac sombre, accéléré (26 s ; ralenti cinq fois : il se couche une fois sur tout le short) | Dhul-Qarnayn, le couchant : **proposé** (2026-11-11) |
| 225408 | AttilaPergel | un fleuve entre deux parois de roche (les Portes de Fer), vu d'en haut, vertical (18 s) ; un petit bateau passe en bas, caché par le sol dessiné | Dhul-Qarnayn, l'argent refusé : **proposé** |
| 381 | FlickrVideos | falaises sombres dans la brume du soir (Grand Canyon), accéléré (20 s) | Dhul-Qarnayn, le barrage : **proposé** |
| 26085 | TeeFarm | une plaine nue, le soleil bas sur l'horizon (Namibie, un coucher filmé), 4K (73 s ; 30 s gardées) | Dhul-Qarnayn, le levant, dans le film seulement : **proposé** |
| 14955 | adege | ciel étoilé au-dessus du Schlern (Dolomites), accéléré, 4K (17 s) : étoiles qui tournent, traînées d'avions, des nuages dans les 4 dernières secondes ; gardé : 12,5 s, en aller-retour (25 s) | du'a, le lieu de prière ; approuvé par le propriétaire le 2026-11-11 (« parfait », sur la planche de comparaison) |
| 190332 | DancingSky | ciel de nuages au couchant sur une plaine, accéléré, 4K (14 s) | le mur |
| 138588 | Natures_Embrace | vagues au couchant, 4K (29 s) | du'a, le grand poisson |
| 4006 | outlinez | petites vagues sur le sable mouillé, lumière dorée, de près (40 s) | |
| 24216 | javlemus | vue du ciel, vagues sur un rivage de sable brun (31 s) | |
| 208635 | SkyScapeDrone | eau claire peu profonde sur le sable, vertical 4K (11 s) | |
| 133508 | Marsel_beijing | vagues sur sable doré, ciel bleu, vertical (10 s) | |
| 22512 | luc_toutsimplement | vue du ciel, sommet alpin rocheux sous la neige (20 s) | |
| 277097 | vecax | sommet enneigé, nuages qui passent, accéléré (18 s) | |
| 228847 | Kanenori | cascade en forêt, vertical 4K (20 s) | |
| 271161 | McPix22 | ruisseau entre des rochers moussus, 4K (27 s) | |
| 174860 | Alex_Sochi7777 | rivière de forêt, petits rapides, 4K (28 s) | |
| 2119 | bellergy | lever de soleil vu du ciel sur forêt et îles (25 s) | |
| 59291 | trilemedia | soleil au-dessus d'une vallée de brume, 4K (19 s) | du'a, la maison |
| 223338 | adege | orage qui s'assombrit sur des collines, accéléré 4K (40 s) | |
| 287510 | Thamnguyen_TBVN | ruisseau de forêt dans des rayons de soleil, 4K (16 s) | |
| 382582 | Matthias_Groeneveld | pinède dans la brume, rayons de soleil, 4K (12 s) | |
| 18420 | Nature-Stock-Footage | forêt de bouleaux en automne, 4K (12 s) | |
| 90998 | domukuk | aurore et étoiles au-dessus d'arbres, aspect en partie artificiel (55 s) | |
| 116167 | NickyPe | cumulus blancs sur ciel bleu, accéléré 4K (30 s) | |

**Ambiances.** BigSoundBank (Joseph Sardin), tout en CC0 (tout usage, crédit non exigé, cité quand même),
fichier direct `https://bigsoundbank.com/UPLOAD/ogg/<id>.ogg`, jamais dans le dépôt. Validées à l'écoute par le
propriétaire le 2026-11-11 :

| N° | Titre | Ce qu'on entend | Utilisée |
| --- | --- | --- | --- |
| 1448 | Small waves and beach #2 | petites vagues sur une plage, prises à 10 m | le bateau |
| 1880 | Campaign at Night #4 | un pré le soir : grillons, rares grenouilles | le garçon |
| 0659 | Wind in a Tree | le vent dans un arbre, quelques oiseaux | le mur |

Un autre enregistrement se choisit sur la page de BigSoundBank (description, durée, « License CC0 » à lire sur
la page même), et le propriétaire l'entend dans la vidéo avant qu'il soit validé. Wikimedia Commons refuse
les recherches depuis une session (trop de requêtes) ; un son fabriqué par le code a été écarté.

## Les règles

Les cinq règles obligatoires de `CLAUDE.md` valent ici comme partout. Dans ce modèle :

- **Citations par id** : un verset est `verse: quran.S.A`, un hadith `reading: hadith.<recueil>.<n>`, résolus
  depuis le registre. Aucune réplique ne contient le texte d'un verset ou d'un hadith.
- **Jamais de synthèse sur le Coran** : la narration dit la question et le sens avec ses mots à elle ; c'est le
  récitateur qui dit le verset. Un hadith est lu par une vraie voix (lecture validée du registre).
- **Personne de connu dessiné**, et dans ce modèle **personne du tout** : des choses et des lieux. Ni le
  garçon ni ses parents (une maison, une fenêtre allumée), ni Moussa ni al-Khadir (le bateau, le mur).
- **Jamais l'invisible figuré.**
- Ambiance : jamais sous une récitation ni un hadith (contrôlé par `ambience.py`).

Décisions du propriétaire sur les scripts (2026-11-11), à tenir dans chaque script : la skill `write-hook`.

## Ce que les outils ne font pas encore

Le modèle a été construit pour une histoire, puis ouvert au du'a (des idées reçues). Ce qui manque encore ; chacun
dit quoi faire.

1. **Pas d'écriture pour la voix.** Le texte de voix doit être exactement les répliques de l'écran (pas de
   `say_ar`). Un mot mal dit se corrige en le vocalisant dans la réplique même (« الخَضِر »), ou en changeant
   de mot avec l'accord du propriétaire.
2. **Contrôle automatique des fichiers, sauf les dessins.** `tools/trial/rules.py` (CI : `validate.yml` ; tests :
   `tests/test_trial_rules.py`) lit chaque film et ses shorts et refuse : un id absent du registre, exclu, sans texte
   ou du mauvais type ; un hadith hors politique (`content/policy.yaml`) ; une lecture sans enregistrement ; un
   verset sans coupe ; **la voix de synthèse qui dit une citation** (4 mots de suite d'un verset du registre, dans son écriture coranique ou courante, ou d'un
   hadith cité : un filet, pas une preuve) ; un texte de voix qui diffère des répliques ; un `reuse`, des `lines` ou un `subscribe` cassés ; un
   champ obligatoire absent ; une réplique vide ; un titre YouTube de plus de 100 caractères ; **un signe affiché que la
   police de son texte n'a pas** (lu dans les fichiers de `video/public/fonts/` : Amiri Quran pour un verset, Amiri pour l'arabe,
   Lora puis Amiri pour l'anglais). Il avertit des mots
   refusés par le propriétaire (`content/wording.yaml`), de l'arabe standard (`content/dialect.yaml`), d'une première
   phrase d'un seul mot, d'une ligne anglaise de plus de 125 caractères (tant que les vidéos ne sont pas validées), d'un short de plus de 2:05, d'un short
   sans ambiance, de ce qui n'est pas encore validé. **Ce qu'aucun code ne contrôle encore : les dessins** (personne
   dessinée, invisible figuré, première image) et le son de la voix : rappelés en fin de sortie, à vérifier à l'œil et
   à l'oreille. Pas de schéma des fichiers : seuls les champs ci-dessus sont exigés. (Le registre reste vérifié par
   `validate.py`.)
3. **Rendu en CI : en service depuis le 2026-11-11, sauf pour le premier film.** Le workflow `film`
   (`.github/workflows/film.yml`, à la main : `film`, `voice` D, `only` all|shorts|film|tiktok|<id d'un short>,
   `ambience`, `from_run`) prépare puis rend en jobs parallèles : `prepare` (règles, clip Pixabay de chaque short,
   timelines avec les prises de `content/trial/takes/` : aucune requête de voix, puis le film), un job `render` par
   vidéo (short, version TikTok, film : `check.py` et ses planches), `stills` (couvertures et vignette), `release`
   (le seul qui écrit : une release **brouillon** `<files>-candidate`, que le propriétaire seul voit, avec les
   vidéos, les images, les planches et `publish.py` en notes ; ce qui a réussi est publié, les notes disent ce qui
   manque et le job échoue). La liste des vidéos vient de `tools/trial/videos.py` (lue dans les fichiers du film,
   mêmes noms que `publish.py`). `ffprobe` est celui que Remotion apporte (aucun téléchargement tiers). Un push qui
   modifie le workflow l'essaie sur un short du du'a (release `<files>-workflow-test`). Il demande le secret du
   dépôt **`PIXABAY_API_KEY`**. **Mesuré sur le du'a** : préparation 6 min, un short 13 à 18 min, le film 65 min,
   le tout en 70 minutes ; les timelines sont celles de la session à la seconde près. **`from_run` = l'id d'un run** :
   rien n'est préparé ni rendu, la release brouillon est refaite avec les artefacts de ce run (gardés 7 jours), en
   une minute : pour une étape de release qui a échoué, ou des textes à coller corrigés après le rendu.
   **Ce qu'il ne fait pas** : préparer le premier film (qui lit ses versets dans un ancien épisode, `verses`) : le
   chemin par la session (commandes ci-dessus, skill `release-render`) reste pour lui, et en secours. **Une machine
   de rendu n'a pas les polices de la session** : un signe absent des polices du projet y sort en carré vide (vu sur
   « ﷺ ») ; `rules.py` le refuse avant le rendu. La validation s'inscrit toujours à la main (`validated`), sur la
   parole du propriétaire, sans `finalize.py`.
4. **Formats pas encore éprouvés.** Une histoire est validée, les idées reçues sont en cours (le du'a) ; pour une
   collection ou un texte expliqué, la structure du film et des shorts se propose d'abord au propriétaire (skill
   `choose-format`).

Comblés le 2026-11-11, avec le du'a : **une source se lit dans le registre** (`tools/trial/sources.py` : texte,
référence, coupe de récitation, lecture du hadith ; un fichier qui nomme un ancien épisode dans `verses`, comme le
premier film, garde son ancien chemin) ; **un short joue un hadith lu** (`reading:` dans ses segments, comme le
film) ; **les textes de publication lisent le registre aussi** (`tools/trial/publish.py` ; `--draft` avant la
voix, pour les longueurs et les limites des plateformes) ; **sous un hadith de Tirmidhi, le jugement d'al-Albani**
tel qu'il est inscrit (« Al-Albani: Hasan Sahih »), à l'écran et dans les textes, comme sur les cartes des anciens
épisodes ; **le clip se cherche et se prépare** (`tools/trial/clip.py`, « Clips filmés »).

## Par où commencer

**Décidé par le propriétaire le 2026-11-11 : le du'a d'abord**, parce qu'il est différent (des idées reçues, pas une
histoire), puis les outils complétés avec les leçons retenues. La session proposait les histoires d'abord
(Dhul-Qarnayn, la caverne) : elle s'est rangée à son ordre, le cas difficile apprenant plus qu'une seconde histoire.
Fiche du du'a dans le modèle, avec ses décisions : `docs/themes.md`. L'épisode khidr est déjà réécrit : c'est le
premier film.
