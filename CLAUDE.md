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
- **Politique des hadiths** (`content/policy.yaml`) : Sahih al-Bukhari, Sahih Muslim et Jami' at-Tirmidhi (décision du 6 novembre 2026). Un hadith de Tirmidhi n'est cité que si **al-Albani** le juge sahih ou hasan (liste exacte des jugements acceptés dans `policy.yaml`, jugements recopiés de hadith-api, vérifiés par `validate.py`). Tout autre recueil : demande au propriétaire avant d'élargir.
- **Exemples honnêtes.** Une scène inventée est présentée comme une scène type (« imagine… »), jamais comme une histoire vraie. Aucun chiffre sans source.
- **Voix déclarée.** La voix de synthèse est signalée comme générée par IA dans la description des vidéos.
- **Open source et gratuit d'abord.** Remotion est gratuit pour un particulier (licence propre à Remotion, pas OSI). Le reste doit être libre (MIT, Apache 2.0, CC0, OFL).
- **Catalogue fermé.** Modèles visuels, personnages, poses et expressions viennent de catalogues (`content/characters.yaml`, enums du schéma). Un épisode ne décrit jamais un dessin libre.

## Arborescence

```
content/
  policy.yaml            politique des sources (recueils de hadith acceptés, jugement exigé)
  characters.yaml        catalogue fermé des personnages, poses, expressions
  sources/*.yaml         registre des sources (ids stables, statut proposed/validated/excluded)
  episodes/*.yaml        scripts d'épisodes, découpés en scènes
  voice-test/*.txt       textes du test de voix
schemas/                 JSON Schema du registre et des épisodes
scripts/validate.py      vérification schémas + règles ci-dessus
scripts/session-start.sh hook SessionStart (cloud uniquement)
tools/tts/say.py         synthèse : un texte -> WAV (moteurs silma | voicetut)
tools/sources/fetch.py   remplit text_ar / text_en du registre (quran.com v4, hadith-api) + origin
requirements/            dépendances Python par moteur (un venv par moteur)
infra/claude-cloud-setup.sh  script de setup de l'environnement cloud (copié dans l'UI)
.github/workflows/       validate.yml, voice-test.yml
reference/               analyses de vidéos de référence (texte seulement : aucun visuel tiers, dépôt public)
video/                   (à créer) projet Remotion
build/                   (ignoré) tout ce qui est généré
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
/opt/venvs/voicetut/bin/python tools/tts/say.py --engine voicetut --speaker Mohamed --in content/voice-test/02-narration-egy.txt --out build/tts/test.wav
ffmpeg -y -i build/tts/test.wav -codec:a libmp3lame -qscale:a 2 build/tts/test.mp3
```

La synthèse tourne sur CPU (4 vCPU) : compte une à plusieurs minutes par phrase au premier lancement (téléchargement des modèles, compilation des grammaires de normalisation). Lance-la en arrière-plan si elle dépasse 2 minutes.

Pour que le propriétaire **écoute** un audio, ne le laisse pas dans la session : pousse les textes et déclenche le workflow `voice-test` (il publie les MP3 dans la release `voice-test-latest`, téléchargeable sur téléphone).

## Environnement cloud

- Python : un venv par moteur, `/opt/venvs/silma` et `/opt/venvs/voicetut` (dépendances incompatibles entre elles : numpy<=1.26 pour SILMA).
- Modèles : cache Hugging Face par défaut, `~/.cache/huggingface`.
- Chrome for Testing est préinstallé (`$CHROME_PATH`), utilisable par Remotion via `browserExecutable`.
- Si un téléchargement échoue avec une erreur de proxy ou un 403, le domaine n'est pas autorisé : dis au propriétaire lequel ajouter (liste dans `docs/cloud-environment.md`), ne contourne pas.

## Tâches de la démo, dans l'ordre

1. **Test de voix.** Lance le workflow `voice-test` (ou les commandes ci-dessus) et laisse le propriétaire choisir moteur et voix. VoiceTut ne parle que l'égyptien et l'anglais ; SILMA parle l'arabe standard et l'anglais.
2. **Récupération des sources.** ✅ `tools/sources/fetch.py` remplit `text_ar` / `text_en` depuis quran.com v4 (uthmani, Sahih International) et hadith-api, avec `origin` (URL exactes, jugements de hadith-api) et `url` (page de lecture). Il ne valide jamais : le propriétaire passe chaque source en `validated` lui-même ; une source validée dont le texte ou le jugement change redevient `proposed`. Numérotation des hadiths = `arabicnumber` de hadith-api ; un numéro à plusieurs narrations (Muslim) prend `ref.narration` et une lettre (`hadith.muslim.2679a`). `validate.py` refuse un texte sans `origin`, la CI lance `fetch.py --check`.
3. **Projet Remotion** dans `video/` (TypeScript). Une composition par format (`Reel916`, `Episode169`) qui lit `content/episodes/*.yaml`. Police coranique libre (Amiri Quran, OFL).
4. **Modèles visuels** : `scene`, `ayah-card` (mots synchronisés via `segments=true` de l'API audio quran.com), `source-card`, `title-card`, sous-titres.
   - `ayah-card` : texte uthmani **exactement tel que publié**, ۞ compris (comme quran-reels).
   - `source-card` (hadith) : **seulement les paroles du Prophète ﷺ**, extraites par une règle fixe : du premier au dernier guillemet `"` du `text_ar` (sans la chaîne de transmission ni le commentaire de Tirmidhi ; une question posée entre deux réponses reste, ex. Muslim 2735c). Rapporteur et référence en légende. Le registre garde le texte complet.
5. **Kit de personnages** à partir d'Open Peeps (CC0) : narrateur + `amir` + `salma`, poses et expressions du catalogue, bouche animée selon le volume. Si openpeeps.com est bloqué par le réseau, demande au propriétaire de déposer l'archive dans `assets/characters/source/`.
6. **Workflow `render.yml`** : rend `dua-01` en 9:16 et le publie en release, comme `voice-test`.

## Questions encore ouvertes

- Marque : série dans Quran Words Daily ou page séparée (décision reportée).
- Licence du dépôt (pas encore choisie).
