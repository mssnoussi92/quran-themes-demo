# quran-themes-demo — instructions pour Claude Code

Démo d'un format de **vidéos thématiques coraniques animées** : un thème (ex. le du'a), une accroche tirée de la vie réelle, des citations sourcées affichées à l'écran, une voix de synthèse calme, des sous-titres anglais, des personnages de dessin animé. Un épisode long (16:9) et des reels (9:16) sortent du même script.

Le propriétaire est développeur, il échange en français. Réponds en français ; code, noms de fichiers et commits en anglais.

Conception complète : `docs/design.md`. Réglage de l'environnement cloud : `docs/cloud-environment.md`.

## Objectif de la démo (définition de « fini »)

Un reel `dua-01` en 9:16, rendu par GitHub Actions, qui contient :

1. une scène d'accroche avec un personnage du kit (assis, inquiet) et la narration en voix de synthèse ;
2. la carte du verset Ghafir 40:60, avec la **vraie récitation** d'Alafasy et les mots surlignés en rythme ;
3. des sous-titres anglais sur toute la durée ;
4. une carte de fin.

Pas de publication automatique depuis ce dépôt : le propriétaire publie à la main (voir « Publication et licence »).

## Règles non négociables

- **Une citation n'existe que par son id.** Aucun texte de verset ou de hadith n'est tapé à la main dans un épisode. Les textes viennent du registre `content/sources/`, lui-même rempli depuis une API (quran.com, hadith-api), jamais depuis la mémoire d'un modèle.
- **Jamais de synthèse vocale sur le Coran.** Une scène qui cite un verset utilise `audio: recitation` (récitateur réel). La voix de synthèse lit seulement la narration et, au besoin, le texte d'un hadith.
- **Jamais de personnage pour un prophète, un Compagnon ou une personne connue.** Ces scènes utilisent une carte de nom (calligraphie). `scripts/validate.py` bloque tout personnage dans une scène dont `mentions` n'est pas vide.
- **Voix validée à l'écoute.** VoiceTut ne dit jamais deux fois une phrase de la même façon : les prises que le propriétaire a écoutées et approuvées sont figées (`tools/audio/build.py --lock <propriétaire>`, seulement sur sa parole) et toujours réutilisées ; une réplique modifiée reçoit une nouvelle prise, que le propriétaire écoute avant de la figer. Le rendu final exige des prises figées (`--require-locked`).
- **Script validé par le propriétaire.** Un reel n'est publiable qu'avec `validated_by` (script et traduction), posé à la demande du propriétaire, jamais par l'IA ; toute modification d'une de ses lignes retire `validated_by`, même faite à sa demande (il valide alors la nouvelle version, traduction comprise). Même règle pour les **textes de publication** (`publish` : titre, description, hashtags du thème), validés à part (`publish.validated_by`, sur l'épisode et sur chaque reel). Le rendu final (`render`, non brouillon) vérifie les deux : `validate.py --release --reel <reel>`.
- **Politique des hadiths** (`content/policy.yaml`) : Sahih al-Bukhari, Sahih Muslim et Jami' at-Tirmidhi (décision du 6 novembre 2026). Un hadith de Tirmidhi n'est cité que si **al-Albani** le juge sahih ou hasan (liste exacte des jugements acceptés dans `policy.yaml`, jugements recopiés de hadith-api, vérifiés par `validate.py`). Tout autre recueil : demande au propriétaire avant d'élargir.
- **Exemples honnêtes.** Une scène inventée est présentée comme une scène type (« imagine… »), jamais comme une histoire vraie. Aucun chiffre sans source.
- **Voix déclarée.** La voix de synthèse est signalée comme générée par IA dans la description des vidéos (ligne fixe de `content/publish.yaml`, ajoutée à chaque description par `video/scripts/publish.ts`).
- **Open source et gratuit d'abord.** Remotion est gratuit pour un particulier (licence propre à Remotion, pas OSI). Le reste doit être libre (MIT, Apache 2.0, CC0, OFL).
- **Catalogue fermé.** Modèles visuels, personnages, poses, expressions et fonds viennent de catalogues (`content/characters.yaml`, `content/backgrounds.yaml`, enums du schéma). Un épisode ne décrit jamais un dessin libre ; un nouveau personnage, une nouvelle pose ou un nouveau fond s'ajoute au catalogue et le propriétaire le valide sur la planche (`docs/characters.png`).

## Arborescence

```
content/
  policy.yaml            politique des sources (recueils de hadith acceptés, jugement exigé)
  publish.yaml           textes de publication : hashtags de la page, limites des plateformes, lignes fixes (voix IA)
  characters.yaml        catalogue fermé des personnages : apparence (pièces Open Peeps), poses -> corps, humeurs
  backgrounds.yaml       catalogue fermé des fonds de la scène (salle d'attente, rue, uni)
  sources/*.yaml         registre des sources (ids stables, statut proposed/validated/excluded)
  audio/<épisode>/       prises de voix validées par le propriétaire (FLAC + takes.json, écrits par build.py --lock)
  episodes/*.yaml        scripts d'épisodes, découpés en scènes, et leurs textes de publication (`publish`)
  voice-test/*.txt       textes du test de voix
schemas/                 JSON Schema du registre et des épisodes
scripts/validate.py      vérification schémas + règles ci-dessus
scripts/session-start.sh hook SessionStart (cloud uniquement)
tools/tts/say.py         synthèse : un texte -> WAV (moteurs silma | voicetut)
tools/sources/fetch.py   remplit text_ar / text_en du registre (quran.com v4, hadith-api) + origin
tools/audio/build.py     audio d'un épisode -> build/audio/<épisode>/ : récitation (quran.com, temps des mots) + narration VoiceTut
tools/audio/listen.py    écoute par Whisper : texte, temps des mots, segments, enveloppe sonore ; contrôle des prises, débuts de morceaux
requirements/            dépendances Python par moteur (un venv par moteur)
infra/claude-cloud-setup.sh  script de setup de l'environnement cloud (copié dans l'UI)
.github/workflows/       validate.yml (contenu + video/), voice-test.yml (une voix VoiceTut par job), render.yml (audio + reel -> release) ;
                         sans apt-get (miroir Ubuntu bloqué une heure le 2026-11-06) : ffmpeg statique d'imageio-ffmpeg 0.8.1
reference/               analyses de vidéos de référence (texte seulement : aucun visuel tiers, dépôt public)
video/                   projet Remotion (TypeScript) : compositions Reel916 (1080x1920) et Episode169 (1920x1080)
  scripts/prepare.ts     content/ -> public/data/<épisode>.json (sources résolues depuis le registre, durées)
  scripts/publish.ts     textes à coller pour chaque vidéo et chaque plateforme (notes de la pré-release)
  src/                   Root.tsx (compositions), data.ts (chargement), scenes.ts (scènes d'une vidéo et minutage,
                         partagé avec publish.ts), Video.tsx, templates/ (cartes, scène),
                         characters/ (kit Open Peeps, bouche au volume), backgrounds/ (fonds), CharacterSheet.tsx,
                         Thumbnail.tsx (miniature YouTube 1280x720 de l'épisode, `thumbnail` de l'épisode)
  public/fonts/          Amiri Quran, Amiri, Lora (OFL, mêmes fichiers que quran-reels)
build/                   (ignoré) tout ce qui est généré
.claude/skills/          new-theme (d'un thème aux vidéos), write-hook (accroche), narration-takes (voix),
                         find-hadith-recording (hadith lu par une vraie voix)
```

## Commandes

```bash
# Vérifier le contenu (schémas + règles)
uv run --with jsonschema --with pyyaml scripts/validate.py
uv run --with jsonschema --with pyyaml scripts/validate.py --release   # exige des sources "validated"
uv run --with jsonschema --with pyyaml scripts/validate.py --release --reel dua-01   # et le script du reel validé, ses textes de publication

# Registre : remplir les textes depuis les API (ne valide rien), ou vérifier qu'ils n'ont pas bougé (CI)
uv run --with ruamel.yaml tools/sources/fetch.py
uv run --with ruamel.yaml tools/sources/fetch.py --check

# Synthèse vocale (venvs créés par le setup cloud ou par la CI)
/opt/venvs/silma/bin/python tools/tts/say.py --engine silma --in content/voice-test/01-narration-msa.txt --out build/tts/test.wav
/opt/venvs/voicetut/bin/python tools/tts/say.py --engine voicetut --speaker Mohammed --in content/voice-test/02-narration-egy.txt --out build/tts/test.wav
ffmpeg -y -i build/tts/test.wav -codec:a libmp3lame -qscale:a 2 build/tts/test.mp3

# Audio d'un épisode (après npm run data ; VoiceTut ≈ 5 min par phrase sur 4 vCPU : en arrière-plan)
python3 tools/audio/build.py --episode dua                             # voix de policy.yaml ; puis npm run data
# (dans GitHub Actions : workflow render, il fait tout et publie le MP4 en release)
python3 tools/audio/build.py --episode dua --only promise              # une scène (ici la récitation)
python3 tools/audio/build.py --episode dua --lock mssnoussi92 --reel dua-01   # figer les prises approuvées à l'écoute

# Vidéo (dans video/ ; npm run data est lancé par studio, still et render)
export REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell  # session cloud
npm run data                                         # content/ -> public/data/dua.json
npm run typecheck
npm run still -- Reel916 out/reel.png --frame=500    # une image
npm run render -- Reel916 out/dua-01.mp4             # le reel dua-01 (≈ 40 s de calcul pour 30 s)
npm run render -- Episode169 out/dua.mp4             # l'épisode entier en 16:9
node scripts/publish.ts dua all                      # textes à coller (titre, description, hashtags) de chaque vidéo
npm run still -- CharacterSheet ../docs/characters.png   # planche des personnages (validation des apparences)
npm run still -- Thumbnail169 out/dua-thumbnail.png      # miniature YouTube de l'épisode (mise en page de `thumbnail.layout`)
npm run still -- Thumbnail169 out/t.png --props='{"episode":"dua","layout":"title","data":null}'   # comparer une autre mise en page
npm run render -- Reel916 out/x.mp4 --props='{"episode":"dua","reel":"dua-02","format":"reel","data":null}'
```

La synthèse tourne sur CPU (4 vCPU) : compte une à plusieurs minutes par phrase au premier lancement (téléchargement des modèles, compilation des grammaires de normalisation). Lance-la en arrière-plan si elle dépasse 2 minutes.

Pour que le propriétaire **écoute** un audio, ne le laisse pas dans la session : pousse les textes et déclenche le workflow `voice-test` (il publie les MP3 dans la release `voice-test-latest`, téléchargeable sur téléphone).

## Environnement cloud

- Python : un venv par moteur, `/opt/venvs/silma` et `/opt/venvs/voicetut` (dépendances incompatibles entre elles : numpy<=1.26 pour SILMA).
- Modèles : cache Hugging Face par défaut, `~/.cache/huggingface`.
- Navigateur pour Remotion : le headless shell préinstallé (`REMOTION_BROWSER_EXECUTABLE`, voir les commandes) ; sans cette variable, Remotion télécharge le sien (c'est ce que fait la CI).
- Si un téléchargement échoue avec une erreur de proxy ou un 403, le domaine n'est pas autorisé : dis au propriétaire lequel ajouter (liste dans `docs/cloud-environment.md`), ne contourne pas.

## Tâches de la démo, dans l'ordre

1. **Test de voix.** ✅ **VoiceTut (égyptien), voix `Mohammed`**, choisie par le propriétaire le 2026-11-06 à l'écoute du brouillon de dua-01 (`content/policy.yaml`, `narration`) : `narration_language: ar-egy`, narration écrite en égyptien parlé. Le premier test de voix n'avait produit que SILMA (nom de voix inexistant, `Mohamed`), corrigé ; `voice-test` lit plusieurs voix VoiceTut par run.
2. **Récupération des sources.** ✅ `tools/sources/fetch.py` remplit `text_ar` / `text_en` depuis quran.com v4 (uthmani, Sahih International) et hadith-api, avec `origin` (URL exactes, jugements de hadith-api) et `url` (page de lecture). Il ne valide jamais : le propriétaire passe chaque source en `validated` lui-même ; une source validée dont le texte ou le jugement change redevient `proposed`. Numérotation des hadiths = `arabicnumber` de hadith-api ; un numéro à plusieurs narrations (Muslim) prend `ref.narration` et une lettre (`hadith.muslim.2679a`). `validate.py` refuse un texte sans `origin`, la CI lance `fetch.py --check`.
3. **Projet Remotion** ✅ `video/` (Remotion 4, React 19, TypeScript) : `Reel916` (un reel, props `reel`) et `Episode169` (toutes les scènes) lisent `public/data/<épisode>.json`, produit par `scripts/prepare.ts` depuis `content/` (textes pris du registre, source exclue ou inconnue = erreur). Polices Amiri Quran (versets), Amiri (arabe), Lora (anglais). Cartes **provisoires** et durées **estimées** d'après le texte (`duration.provisional`, mention « DRAFT » à l'écran) jusqu'à l'audio réel. MP4 H.264 yuv420p BT.709. Guillemets intérieurs d'un hadith à plusieurs paroles (Muslim 2735c) : corrigé en tâche 4.
4. **Modèles visuels** ✅ : ✅ audio (`tools/audio/build.py` : récitation d'Alafasy et temps des mots via `recitations/7/by_ayah?fields=segments`, narration VoiceTut ; `prepare.ts` prend les vraies durées et copie l'audio dans `public/audio/`), ✅ `ayah-card` (mot récité surligné, crédit du récitateur), ✅ `source-card` (paroles entre « », question intermédiaire en retrait, référence + jugement « Al-Albani: Sahih » ; sous-titre anglais = `excerpt_en` du registre, passage vérifié de `text_en`), ✅ `title-card` (entrée animée) ; ✅ `scene` (fonds et kit, tâche 5), ✅ **réponse écrite au rythme de la voix** (plan 0:21 de la vidéo de référence) : `title-card` à une phrase par ligne, coupée après « ، … . ؟ : » ; la première est là dès le début, chaque suivante apparaît 0,1 s avant que la voix la dise. Instants calculés par `tools/audio/build.py` dans la prise resserrée (`phrases` du manifeste) : les pauses de 0,1 s ou plus sont associées dans l'ordre aux coupures, la plus proche de la position attendue au prorata des lettres, la plus longue préférée ; recoupé avec Whisper sur dua-01. Une carte dont le texte ne correspond pas aux phrases de la prise s'affiche d'un bloc.
   - `ayah-card` : texte uthmani **exactement tel que publié**, ۞ compris (comme quran-reels). Référence par le **nom de la sourate**, pas son numéro (« سورة غافر · الآية ٦٠ », demande du propriétaire) : nom pris de quran.com par `fetch.py` (`origin.surah_ar`, `surah_en`), donnée de présentation qui ne retire pas la validation d'une source.
   - `source-card` (hadith) : **seulement les paroles du Prophète ﷺ**, extraites par une règle fixe : du premier au dernier guillemet `"` du `text_ar` (sans la chaîne de transmission ni le commentaire de Tirmidhi ; une question posée entre deux réponses reste, ex. Muslim 2735c). Rapporteur et référence en légende. Le registre garde le texte complet.
5. **Kit de personnages** ✅ (apparences validées par le propriétaire le 2026-11-06 sur `docs/characters.png`, `validated_by` dans le catalogue) : Open Peeps (Pablo Stanley, CC0) par `react-peeps` (MIT). `content/characters.yaml` donne l'apparence et le corps de chaque pose ; `video/src/characters/peeps.ts` les visages par humeur (bouche fermée / ouverte) et l'emprise mesurée de chaque corps (un corps non mesuré est refusé par `prepare.ts`, comme tout nom de pièce inconnu). Assis : un banc sous les hanches ; buste : grand, coupé par le bas de l'image. `talking: true` : bouche ouverte quand le volume (RMS sur 0,1 s) dépasse 0,08. Fonds dessinés en aplats (`video/src/backgrounds/`), catalogue `content/backgrounds.yaml` vérifié par `validate.py`.
- **Transitions** (demande du propriétaire, 2026-11-06) : **0,6 s** sans voix entre deux scènes (`TRANSITION_SECONDS`, `video/src/formats.ts`) : glissement depuis la gauche entre deux scènes `scene`, fondu enchaîné autour des cartes (la scène qui entre apparaît par-dessus), courbe ease in-out, pas de sous-titre pendant le mouvement ; la réplique précédente finit par ce silence, la voix suivante démarre à la fin du mouvement (surlignage du verset et bouche décalés d'autant, `AudioStart`). Chaque scène a son propre fond (opaque) : celle qui entre recouvre celle qui sort. Choisies par le propriétaire parmi quatre variantes de dua-01 (les nôtres à 0,3 s et 0,6 s, `@remotion/transitions` glissement/fondu et volet/iris à 0,6 s) ; écrites dans le projet, sans `@remotion/transitions`.
- **Rythme de la voix** (le propriétaire trouvait des blancs entre les phrases, 2026-11-06) : `tools/audio/build.py` garde la prise brute de VoiceTut (`<scène>.raw.wav`) et en dérive une version resserrée : 0,08 s avant, 0,06 s après, pauses internes ramenées à 0,18 s au plus (0,06 s après le son + 0,12 s avant le suivant, pour ne pas rogner l'attaque d'un « ق ») ; `prepare.ts` n'ajoute rien après une réplique (le blanc est la transition), 0,1 s après un verset, scène de 0,5 s au moins (une question d'un mot reste aussi visible pendant ses deux transitions) ; coupes franches (fondu d'entrée de 4 images). dua-01 : 53,4 s -> 43,8 s, plus long blanc 0,52 s.
6. **Workflow `render.yml`** (écrit) : à la main (épisode, reel ou `all`, voix, `draft`) ; `all` rend l'épisode entier en 16:9 (`<épisode>-16x9.mp4`, YouTube) et en 9:16 (`<épisode>-9x16.mp4`, demande du propriétaire, 2026-11-07), et chaque reel en 9:16 (Facebook, Instagram, TikTok), dans la pré-release `<épisode>-latest` ; vérifie les sources (`validate.py --release`, sauf brouillon), produit l'audio (`tools/audio/build.py`, VoiceTut en CPU, lignes déjà synthétisées reprises du cache), rend `Reel916` et publie le MP4 dans la pré-release `<reel>-latest`, avec en notes les textes de publication de chaque vidéo (voir « Publication et licence »). VoiceTut : ≈ 5 min pour la 1re phrase, ≈ 1,5 min ensuite (4 vCPU).
7. **Suite de l'épisode Du'a** (demande du propriétaire, 2026-11-06 : l'épisode complet pour YouTube, découpé en reels pour Facebook et TikTok) : reels **dua-02 à dua-05** écrits d'après le plan de `docs/design.md` (une idée reçue par reel, puis la conclusion), **à valider** ; nouvelle source `hadith.tirmidhi.3573` (proposée, à la place d'Ahmad) ; `excerpt_en` ajoutés aux hadiths cités. Narrateur récurrent (`narrator`, buste, fond uni) qui annonce chaque idée reçue ; carte de nom pour Ayyub. Une réplique identique à une prise figée (même texte, même voix) reprend cette prise (`take_from` dans le manifeste) : « قال ربنا سبحانه وتعالى: » garde la prise validée. Sous-titres anglais longs découpés en morceaux de 14 mots au plus (phrases, puis virgules, avant une citation ou « and / or / but »), calés sur l'audio : narration sur ses propres phrases, hadith à partir de son début dans la prise, verset au prorata des mots récités. Sous un hadith de Tirmidhi, le jugement exact d'al-Albani (« Hasan Sahih »). **Validés par le propriétaire le 2026-11-07** (scripts, traduction, voix, Tirmidhi 3573) ; prises figées.
   - **Versions complètes sans « اللي جاي »** (demande du propriétaire, 2026-11-07) : `reel_only_end` (`{ar, en}`, phrases entières à la fin de la réplique) est dit seulement dans le reel ; les versions complètes (`reel: null`, `selectScenes`) coupent la prise 0,12 s avant cette phrase (instants `phrases` du manifeste), et retirent le texte de la carte et le sous-titre. Même prise, aucune nouvelle synthèse. Utilisé pour « أولها في الجاي » (dua-01) et « ده اللي جاي » (dua-02, dua-03) ; « دي الأخيرة » (dua-04) reste.
   - **Prononciation** : `say_ar` = ce que lit la voix quand il faut l'écrire autrement que l'écran, mêmes mots (`validate.py` : seuls diacritiques, ponctuation et ة/ه peuvent différer). « عادة » (hook-4) : le ت ne se prononce pas (demande du propriétaire, 2026-11-07), lu « عاده ». « قريب » (near-near) : un vrai ق, pas « أريب » à l'égyptienne (même jour) : vocalisé « قَرِيب », VoiceTut le lit comme en arabe classique (Whisper : « قريب » sur 2 prises sur 2, contre « أريب » sans voyelles ou avec « قَرِيبٌ »). Ces deux nouvelles prises, approuvées par le propriétaire, sont figées (2026-11-07).
   - **Hadiths lus par une vraie voix** (demande du propriétaire, 2026-11-07 : enregistrements d'archive.org acceptés, Bukhari, Muslim ou Tirmidhi) : champ `recording` d'une source du registre (lecteur, page et fichier archive.org, `start`/`end` des paroles affichées, `heard` = ce qu'entend Whisper, licence, statut `proposed` puis `validated` + `validated_by` après écoute du propriétaire ; `validate.py` compare `heard` aux mots de la carte et exige un enregistrement validé pour un rendu final). `tools/audio/build.py` télécharge le fichier, coupe l'extrait une fois (`build/audio/<épisode>/readings/`, jamais commité ; `atrim` + `asetpts`, fondus de 20/40 ms) et assemble la scène (`mix`) : l'introduction coupée dans la prise figée (« النبي صلى الله عليه وسلم قال: »), 0,25 s de pause, le lecteur ; la carte affiche « Reading: <lecteur> ». Trouvés (2026-11-07) : Bukhari 6340, un fichier par hadith (`bukhari_audiobook`, Abu Malik Ibn Abd'Azeez as-Salafi al-Asqalane) ; Muslim 2679a dans la lecture complète de Ryadussalihin.org (`ar_Moslem_Reading_16`, fichier 49 = livre du dhikr et du du'a) ; Tirmidhi 2139, 3247 et 3573 lus par Yusuf ibn Nuh Ahmad (`yna-audiobook-arabic-sunan-altirmidhi`, fichiers par numéros). Aucune licence indiquée sur ces éléments. **Les cinq enregistrements validés par le propriétaire à l'écoute (2026-11-07)**, écarts de 3573 et fin de 2139 compris. 3573 : Whisper entend « بإثم », « مسلمون », « يدعو » là où le registre a « بمأثم », « مسلم », « يدع » (à l'écoute). Recherche : sondes de 40 s aux positions estimées, puis fenêtres serrées transcrites par Whisper (`large-v3-turbo`), frontières au creux de l'enveloppe sonore.
   - **Minutage des morceaux, version 2** : poids de la durée des pauses divisé par deux (0,5) : dans la prise de Muslim 2679a, la pause après « قال: » paraissait coupée en deux par le bruit de fond et la version 1 coupait 4 s trop tard (sous-titre de l'introduction affiché trop longtemps dans dua-02). Vérifié avec Whisper sur 13 répliques : aucune autre carte ne change.
   - **Débuts de morceaux vérifiés** (2026-11-07) : `tools/audio/listen.py --phrases <épisode>` compare l'estimation de `build.py` aux mots de Whisper (« !! » = écart ; aucune des deux n'a toujours raison : Whisper dérive dans les pauses bruitées, l'estimation sur les lignes dites à un rythme inégal) ; chaque écart qui compte se tranche à l'enveloppe (`--envelope`), puis `build.py --set-phrases <scène>=<début>,…` range les débuts vérifiés avec la prise figée (`takes.json`, `phrases`) et ils remplacent l'estimation. Corrigés ainsi : Tirmidhi 3573 (answer-hadith-2 : la coupe avant le lecteur tombait 1 s trop tard, la voix de synthèse disait « ما على الأرض مسلم » avant lui) et near-recap (« مش » à 1,20 s, « وعمره » à 3,88 s). `listen.py --episode <épisode>` réécoute chaque prise (et chaque mix, introduction et lecteur à part) et liste ce que Whisper entend autrement.
8. **Épisode Patience** (demande du propriétaire, 2026-11-07) : `content/episodes/sabr.yaml`, reels **sabr-01 à sabr-05** (la promesse, trois idées reçues : « le patient ne pleure pas », « la patience, c'est attendre sans rien faire », « je ne suis pas patient de nature », la conclusion), plan dans `docs/design.md` ; 9 sources (2:155, 12:86, 2:153, 2:250, 39:10 ; Muslim 2999 et 2664, Bukhari 1303 et 1469), les 4 hadiths lus par de vrais lecteurs d'archive.org (Muslim : Ryadussalihin.org, fichiers 54 et 47 ; Bukhari : Abu Malik, un fichier par hadith). **Tout validé par le propriétaire le 2026-11-07** : sources, lectures, script et traduction, prises (figées), textes de publication, miniature ; durée gardée (épisode 5:04, reels 0:41 à 1:09). Une réplique identique à une prise figée d'un **autre épisode** reprend cette prise (`take_from` « dua/<scène> ») : « قال ربنا سبحانه وتعالى: », « تاني فكرة غلط… », « تالت فكرة غلط… ». Prononciation corrigée à l'écoute du propriétaire (2026-11-07), en `say_ar` : « بِتُصْبُر » (btoṣbor), « اُصْبُر » (oṣbor), « البُشْرَى » (al-boshra), « مَبْيِعَيَّطْش » ; ces quatre prises, choisies par le propriétaire. Débuts vérifiés : hook-3 (« وصعبة » 1,44 s), why (« خير؟ » 1,40 s). Miniature : close-up, Salma, « ٣ أفكار غلط / عن الصبر ».

## Skills (`.claude/skills/`)

Procédures à suivre dans toute session :
- `new-theme` : d'un nouveau thème au script, en passant par les sources (proposées, jamais validées par l'IA), les idées reçues, les reels et une PR.
- `write-hook` : l'accroche d'un épisode ou d'un reel. Elle reprend les techniques de la vidéo de référence du propriétaire (miroir, contraste, ancre sourcée, question en un mot, enjeu, promesse honnête ; analyse plan par plan dans `reference/dua-video-analysis.md`), dans le respect des règles ci-dessus.
- `narration-takes` : la voix d'un épisode, de la synthèse aux prises figées : écoute de chaque prise par Whisper (`tools/audio/listen.py`), reprises, prononciation (`say_ar`), débuts de morceaux vérifiés (`--set-phrases`), brouillons, figer seulement sur la parole du propriétaire.
- `find-hadith-recording` : trouver sur archive.org la lecture d'un hadith par une vraie voix (Bukhari, Muslim, Tirmidhi ; lectures déjà repérées), la caler, l'inscrire au registre (`recording`) pour que le propriétaire l'écoute et la valide.

## Publication et licence (décisions du propriétaire, 2026-11-06)

- **Marque** : ces vidéos sont publiées sur la **même page que Quran Words Daily** (Facebook `quranwordsdaily`, Instagram / TikTok / YouTube `quran_words_daily`), **à la main par le propriétaire** pour l'instant, à partir du MP4 de la pré-release `<reel>-latest`. Les règles de droits de la page s'appliquent donc (voir quran-reels : Rights Manager sur Facebook, Content ID sur YouTube).
- **Textes de publication** (demande du propriétaire, 2026-11-07) : les notes de la pré-release donnent, pour chaque vidéo, le titre et le texte à coller sur chaque plateforme, un bloc copiable chacun (`video/scripts/publish.ts`, lancé par `render.yml`) : Facebook (8 hashtags), Instagram et TikTok (5, légende ≤ 2 200 caractères), YouTube (titre « <en> · <ar> » ≤ 100 caractères, description avec tous les hashtags ; l'épisode 16:9 a ses chapitres, un par reel, au minutage de la vidéo). Écrits à la main (et validés) : titre, description et hashtags du thème (`publish` de l'épisode et de chaque reel), faits des répliques validées du script ; ceux du du'a validés par le propriétaire le 2026-11-07. Calculés : sources citées (référence, jugement, lien quran.com / sunnah.com), récitateur, lecteurs, ligne de voix IA, numéro de partie, hashtags de la page (`#QuranWordsDaily` d'abord, comme quran-reels), du hadith et du récitateur. La CI (`validate.yml`) vérifie les limites.
- **Miniature YouTube** (demande du propriétaire, 2026-11-07) : `thumbnail` de l'épisode (mise en page du catalogue `close-up` | `scene` | `title`, titre court et ligne du thème tirés du titre validé, personnage et fond des catalogues) ; composition `Thumbnail169` (1280x720), rendue par `render.yml` avec l'épisode (`reel = all`) et jointe à la pré-release (`<épisode>-thumbnail.png`). Lisible à 170 px de large : un visage, trois à cinq mots, rien dans le coin bas-droite (durée). Le propriétaire la valide sur l'image (`thumbnail.validated_by`) ; les notes la signalent « proposée » tant qu'elle ne l'est pas, sans bloquer le rendu.
- **Signature** (demande du propriétaire, 2026-11-07) : le nom de la page (`handle` de `content/publish.yaml`, « @quran_words_daily ») sur chaque image des vidéos, comme quran-reels : petit, en haut à droite de la zone sûre, sur une pastille sombre légère (lisible sur les fonds clairs), immobile pendant les transitions (`Handle`, `video/src/Video.tsx`). Pas sur la miniature : YouTube affiche déjà le nom de la chaîne à côté.
- **Licence** : MIT, comme quran-reels (`LICENSE`) ; Remotion garde sa propre licence (gratuite pour un particulier). Textes cités et récitations : à leurs éditeurs (README).
- **Récitateur** : le propriétaire garde Alafasy (2026-11-06), en connaissant le risque sur la page (quran-reels : 93:1-11 d'Alafasy coupée par Rights Manager sur Facebook le 2026-11-05). Alternative prête si besoin : Minshawi murattal (quran.com, récitation 9, temps des mots disponibles).
