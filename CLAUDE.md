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

Pas de publication sur les réseaux : c'est hors périmètre.

## Règles non négociables

- **Une citation n'existe que par son id.** Aucun texte de verset ou de hadith n'est tapé à la main dans un épisode. Les textes viennent du registre `content/sources/`, lui-même rempli depuis une API (quran.com, hadith-api), jamais depuis la mémoire d'un modèle.
- **Jamais de synthèse vocale sur le Coran.** Une scène qui cite un verset utilise `audio: recitation` (récitateur réel). La voix de synthèse lit seulement la narration et, au besoin, le texte d'un hadith.
- **Jamais de personnage pour un prophète, un Compagnon ou une personne connue.** Ces scènes utilisent une carte de nom (calligraphie). `scripts/validate.py` bloque tout personnage dans une scène dont `mentions` n'est pas vide.
- **Script validé par le propriétaire.** Un reel n'est publiable qu'avec `validated_by` (script et traduction), posé à la demande du propriétaire, jamais par l'IA ; toute modification d'une de ses lignes retire `validated_by`.
- **Politique des hadiths** (`content/policy.yaml`) : Sahih al-Bukhari, Sahih Muslim et Jami' at-Tirmidhi (décision du 6 novembre 2026). Un hadith de Tirmidhi n'est cité que si **al-Albani** le juge sahih ou hasan (liste exacte des jugements acceptés dans `policy.yaml`, jugements recopiés de hadith-api, vérifiés par `validate.py`). Tout autre recueil : demande au propriétaire avant d'élargir.
- **Exemples honnêtes.** Une scène inventée est présentée comme une scène type (« imagine… »), jamais comme une histoire vraie. Aucun chiffre sans source.
- **Voix déclarée.** La voix de synthèse est signalée comme générée par IA dans la description des vidéos.
- **Open source et gratuit d'abord.** Remotion est gratuit pour un particulier (licence propre à Remotion, pas OSI). Le reste doit être libre (MIT, Apache 2.0, CC0, OFL).
- **Catalogue fermé.** Modèles visuels, personnages, poses, expressions et fonds viennent de catalogues (`content/characters.yaml`, `content/backgrounds.yaml`, enums du schéma). Un épisode ne décrit jamais un dessin libre ; un nouveau personnage, une nouvelle pose ou un nouveau fond s'ajoute au catalogue et le propriétaire le valide sur la planche (`docs/characters.png`).

## Arborescence

```
content/
  policy.yaml            politique des sources (recueils de hadith acceptés, jugement exigé)
  characters.yaml        catalogue fermé des personnages : apparence (pièces Open Peeps), poses -> corps, humeurs
  backgrounds.yaml       catalogue fermé des fonds de la scène (salle d'attente, rue, uni)
  sources/*.yaml         registre des sources (ids stables, statut proposed/validated/excluded)
  episodes/*.yaml        scripts d'épisodes, découpés en scènes
  voice-test/*.txt       textes du test de voix
schemas/                 JSON Schema du registre et des épisodes
scripts/validate.py      vérification schémas + règles ci-dessus
scripts/session-start.sh hook SessionStart (cloud uniquement)
tools/tts/say.py         synthèse : un texte -> WAV (moteurs silma | voicetut)
tools/sources/fetch.py   remplit text_ar / text_en du registre (quran.com v4, hadith-api) + origin
tools/audio/build.py     audio d'un épisode -> build/audio/<épisode>/ : récitation (quran.com, temps des mots) + narration VoiceTut
requirements/            dépendances Python par moteur (un venv par moteur)
infra/claude-cloud-setup.sh  script de setup de l'environnement cloud (copié dans l'UI)
.github/workflows/       validate.yml (contenu + video/), voice-test.yml (une voix par job), render.yml (audio + reel -> release)
reference/               analyses de vidéos de référence (texte seulement : aucun visuel tiers, dépôt public)
video/                   projet Remotion (TypeScript) : compositions Reel916 (1080x1920) et Episode169 (1920x1080)
  scripts/prepare.ts     content/ -> public/data/<épisode>.json (sources résolues depuis le registre, durées)
  src/                   Root.tsx (compositions), data.ts (chargement), Video.tsx, templates/ (cartes, scène),
                         characters/ (kit Open Peeps, bouche au volume), backgrounds/ (fonds), CharacterSheet.tsx
  public/fonts/          Amiri Quran, Amiri, Lora (OFL, mêmes fichiers que quran-reels)
build/                   (ignoré) tout ce qui est généré
.claude/skills/          write-hook (accroche), new-theme (d'un thème au script validé)
```

## Commandes

```bash
# Vérifier le contenu (schémas + règles)
uv run --with jsonschema --with pyyaml scripts/validate.py
uv run --with jsonschema --with pyyaml scripts/validate.py --release   # exige des sources "validated"

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

# Vidéo (dans video/ ; npm run data est lancé par studio, still et render)
export REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell  # session cloud
npm run data                                         # content/ -> public/data/dua.json
npm run typecheck
npm run still -- Reel916 out/reel.png --frame=500    # une image
npm run render -- Reel916 out/dua-01.mp4             # le reel dua-01 (≈ 40 s de calcul pour 30 s)
npm run render -- Episode169 out/dua.mp4             # l'épisode entier en 16:9
npm run still -- CharacterSheet ../docs/characters.png   # planche des personnages (validation des apparences)
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
4. **Modèles visuels** (en cours) : ✅ audio (`tools/audio/build.py` : récitation d'Alafasy et temps des mots via `recitations/7/by_ayah?fields=segments`, narration VoiceTut ; `prepare.ts` prend les vraies durées et copie l'audio dans `public/audio/`), ✅ `ayah-card` (mot récité surligné, crédit du récitateur), ✅ `source-card` (paroles entre « », question intermédiaire en retrait, référence + jugement « Al-Albani: Sahih » ; sous-titre anglais = `excerpt_en` du registre, passage vérifié de `text_en`), ✅ `title-card` (entrée animée) ; reste : `scene` (fonds, avec le kit de la tâche 5), révélation de la réponse au rythme de la voix.
   - `ayah-card` : texte uthmani **exactement tel que publié**, ۞ compris (comme quran-reels).
   - `source-card` (hadith) : **seulement les paroles du Prophète ﷺ**, extraites par une règle fixe : du premier au dernier guillemet `"` du `text_ar` (sans la chaîne de transmission ni le commentaire de Tirmidhi ; une question posée entre deux réponses reste, ex. Muslim 2735c). Rapporteur et référence en légende. Le registre garde le texte complet.
5. **Kit de personnages** ✅ (apparences validées par le propriétaire le 2026-11-06 sur `docs/characters.png`, `validated_by` dans le catalogue) : Open Peeps (Pablo Stanley, CC0) par `react-peeps` (MIT). `content/characters.yaml` donne l'apparence et le corps de chaque pose ; `video/src/characters/peeps.ts` les visages par humeur (bouche fermée / ouverte) et l'emprise mesurée de chaque corps (un corps non mesuré est refusé par `prepare.ts`, comme tout nom de pièce inconnu). Assis : un banc sous les hanches ; buste : grand, coupé par le bas de l'image. `talking: true` : bouche ouverte quand le volume (RMS sur 0,1 s) dépasse 0,08. Fonds dessinés en aplats (`video/src/backgrounds/`), catalogue `content/backgrounds.yaml` vérifié par `validate.py`.
6. **Workflow `render.yml`** (écrit) : à la main (épisode, reel, voix, `draft`) ; vérifie les sources (`validate.py --release`, sauf brouillon), produit l'audio (`tools/audio/build.py`, VoiceTut en CPU, lignes déjà synthétisées reprises du cache), rend `Reel916` et publie le MP4 dans la pré-release `<reel>-latest`. VoiceTut : ≈ 5 min pour la 1re phrase, ≈ 1,5 min ensuite (4 vCPU).

## Skills (`.claude/skills/`)

Procédures à suivre dans toute session :
- `new-theme` : d'un nouveau thème au script, en passant par les sources (proposées, jamais validées par l'IA), les idées reçues, les reels et une PR.
- `write-hook` : l'accroche d'un épisode ou d'un reel. Elle reprend les techniques de la vidéo de référence du propriétaire (miroir, contraste, ancre sourcée, question en un mot, enjeu, promesse honnête ; analyse plan par plan dans `reference/dua-video-analysis.md`), dans le respect des règles ci-dessus.

## Questions encore ouvertes

- Marque : série dans Quran Words Daily ou page séparée (décision reportée).
- Licence du dépôt (pas encore choisie).
