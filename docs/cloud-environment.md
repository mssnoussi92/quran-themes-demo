# Environnement Claude Code cloud

Un seul environnement, nommé `quran-themes`, à créer une fois dans claude.ai/code : sélecteur d'environnement sous la zone de message, puis **New environment**. Référence : [Configure cloud environments](https://code.claude.com/docs/en/cloud-environments).

## 1. Accès réseau

Choisir **Custom**, cocher **Also include default list of common package managers**, puis coller ces domaines dans **Allowed domains** (un par ligne) :

```text
huggingface.co
*.huggingface.co
*.hf.co
download.pytorch.org
api.quran.com
*.quran.com
*.qurancdn.com
*.quranicaudio.com
cdn.jsdelivr.net
openpeeps.com
```

| Domaine | Pourquoi |
| --- | --- |
| `huggingface.co`, `*.huggingface.co`, `*.hf.co` | Poids des modèles SILMA, VoiceTut et Vocos (absents de la liste par défaut) |
| `download.pytorch.org` | PyTorch en version CPU, bien plus légère que la version CUDA |
| `api.quran.com`, `*.quran.com`, `*.qurancdn.com` | Texte du Coran, traduction, timings mot à mot |
| `*.quranicaudio.com` | Fichiers audio des récitations |
| `cdn.jsdelivr.net` | hadith-api (textes et jugements) |
| `openpeeps.com` | Base du kit de personnages (CC0) |

Déjà couverts par la liste par défaut : npm, PyPI, GitHub et ses fichiers de release (modèle de tashkeel CATT), Ubuntu (apt), Google Fonts, `storage.googleapis.com` (navigateur headless de Remotion).

## 2. Variables d'environnement

```text
BASH_DEFAULT_TIMEOUT_MS=600000
BASH_MAX_TIMEOUT_MS=1800000
HF_HUB_DISABLE_TELEMETRY=1
PYTHONUNBUFFERED=1
```

Les deux premières laissent jusqu'à 10 min aux commandes longues (synthèse vocale et rendu sur CPU). Aucun secret n'est nécessaire : tous les modèles et toutes les API utilisés sont publics.

## 3. Script de setup

Coller le contenu de [`infra/claude-cloud-setup.sh`](../infra/claude-cloud-setup.sh) dans **Setup script**. Il installe ffmpeg et des polices arabes, crée deux venvs Python (`/opt/venvs/silma`, `/opt/venvs/voicetut`) avec PyTorch CPU, puis précharge les modèles.

S'il dépasse environ 5 minutes, l'environnement n'est pas mis en cache et le script tourne à chaque nouvelle session. Ça marche quand même, mais le démarrage est plus lent. Les modèles non préchargés se téléchargent au premier usage.

## 4. Vérifier

Dans une première session, le hook SessionStart (`.claude/settings.json`) affiche l'état de l'environnement. Ensuite, demande à Claude :

> Lance le test de voix sur `content/voice-test/01-narration-msa.txt` avec SILMA et dis-moi combien de temps ça prend.

## Limites connues

- La VM a environ 4 vCPU, 16 Go de RAM et 30 Go de disque, sans GPU.
- Une commande au premier plan s'arrête par défaut au bout de 2 min (10 min avec les variables ci-dessus) ; au-delà, elle passe en arrière-plan.
- Le hook SessionStart ne tourne que si la session contient **un seul dépôt**. Si tu attaches aussi `quran-reels`, l'état de l'environnement ne s'affichera pas au démarrage (le setup, lui, tourne quand même).
