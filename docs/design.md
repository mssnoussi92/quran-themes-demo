# Conception — vidéos thématiques coraniques

Version condensée de l'étude de faisabilité du 6 novembre 2026. Le document complet est privé : https://claude.ai/artifact/Tzkf2wTu9DyeYsuWdHHvN8

## Concept

Un épisode traite un thème du Coran. Il s'ouvre sur une accroche tirée de la vie réelle ; chaque citation affichée vient d'une source vérifiée avec sa référence ; la voix est calme ; les sous-titres sont en anglais. Le même script produit un épisode long (16:9, 3 à 5 min) et 3 à 6 reels verticaux (9:16) d'environ une minute.

Hors périmètre : la publication, et l'automatisation de bout en bout. Chaque étape est conçue pour pouvoir être automatisée plus tard.

## Décisions (6 novembre 2026)

| Sujet | Décision | Conséquence |
| --- | --- | --- |
| Narration | **Égyptien, VoiceTut, voix Mohammed** (choix du 6 novembre 2026, à l'écoute du brouillon de dua-01) | Narration écrite en égyptien parlé. Versets (récitation) et hadiths (texte du registre) restent en arabe classique. |
| Accroche | Modèle : une vidéo de référence égyptienne sur le du'a (6 novembre 2026), son accroche seulement | Skill `write-hook` : miroir, contraste, ancre sourcée, « ليه؟ », enjeu, promesse honnête ; skill `new-theme` pour les autres thèmes. |
| Voix | Synthèse | « Voix générée par IA » dans chaque description. |
| Personnages | Dessin animé ; jamais pour un prophète, un Compagnon ou une personne connue | Kit SVG à partir d'Open Peeps (CC0). Carte de nom pour les personnes réelles. |
| Machine | Démo sur GitHub, dépôt dédié | Rendu et synthèse dans GitHub Actions. Le M920q devient le plan B. |
| Marque | Plus tard | Sans impact sur le dépôt. |
| Jugements | Bukhari, Muslim et Tirmidhi | Tirmidhi seulement si al-Albani juge le hadith sahih ou hasan (`content/policy.yaml`, vérifié par `scripts/validate.py`). |
| Carte d'un hadith | Paroles du Prophète ﷺ seulement | Extraites du texte arabe par une règle fixe (entre le premier et le dernier guillemet) ; rapporteur et référence en légende. |
| Signe ۞ | Gardé | Le texte uthmani s'affiche exactement tel que publié. |

## Workflow de production

Six étapes et trois validations humaines, qui le restent :

1. Choisir le thème.
2. Collecter les sources dans le registre. **Validation humaine de chaque source.**
3. Écrire le script (AR + EN), qui cite les sources par leur id. **Validation humaine du script et de la traduction.**
4. Produire l'audio : narration en synthèse vocale, versets avec une vraie récitation.
5. Caler les timings : mots, scènes, sous-titres.
6. Monter et rendre (Remotion), en 16:9 et 9:16. **Contrôle humain de la vidéo finale.**

On automatise d'abord l'étape qui prend le plus de temps à la main.

## Architecture « script-as-data »

- `content/sources/` : registre partagé entre épisodes. Id stable (`quran.40.60`, `hadith.bukhari.6340`), type, référence, texte arabe et anglais (remplis par API), jugement et savant, statut (`proposed`, `validated`, `excluded`).
- `content/episodes/<thème>.yaml` : scènes avec rôle, narration par langue, source citée, type d'audio, modèle visuel et paramètres, personnages, reel d'appartenance.
- `build/` : audio, timings et rendus générés, hors Git.

Règles : une citation n'existe que par son id ; une langue de plus est une clé de plus ; un format de plus est un paramètre de rendu ; les modèles visuels forment un catalogue fermé ; le moteur de rendu est remplaçable (Motion Canvas, MIT, en plan B).

## Briques

| Brique | Choix | Plan B |
| --- | --- | --- |
| Texte du Coran et traduction | API quran.com v4, Sahih International | AlQuran.cloud |
| Mots synchronisés avec la récitation | API audio quran.com, `segments=true` (début et fin de chaque mot en ms) | Alignement forcé |
| Hadiths et jugements | hadith-api (fawazahmed0) | Dorar, API sunnah.com (clé requise) |
| Voix | SILMA TTS (arabe standard + anglais, Apache 2.0) ou VoiceTut (égyptien + anglais, Apache 2.0) | Habibi (multi-dialectes) |
| Timings de la narration | whisper.cpp | Timings de la voix |
| Animation et rendu | Remotion (React), gratuit pour un particulier | Motion Canvas (MIT) |
| Personnages | Kit SVG Open Peeps (CC0), recoloré, animé par le code | Lottie, Rive |
| Machine | GitHub Actions (dépôt public) | Lenovo M920q |

## Épisode Du'a (plan)

| # | Rôle | Contenu | Source candidate | Reel |
| --- | --- | --- | --- | --- |
| 1 | Accroche | « يا رب »… qu'on dit sans y penser, dans la peur (attente d'un résultat) comme dans le désir : ce n'est pas une habitude, c'est une adoration. | Tirmidhi 3247 (« الدعاء هو العبادة ») | 1 |
| 2 | Promesse | Pourquoi : on reconnaît son besoin de Dieu et Sa puissance. Le Prophète ﷺ a récité ensuite le verset de la promesse. Fin : « 3 idées reçues, la 1re au prochain reel ». | Ghafir 40:60 | 1 |
| 3 | Idée reçue 1 | « Demander, c'est refuser le destin. » Ayyub a invoqué. | Al-Anbiya 21:83 | 2 |
| 4 | Preuve | Demander avec résolution, sans « si Tu veux ». | Bukhari 6339, Muslim 2679a | 2 |
| 5 | Idée reçue 2 | « Tout est écrit, le du'a ne change rien. » | Tirmidhi 2139 ; Ar-Ra'd 13:39 | 3 |
| 6 | Idée reçue 3 | « Je n'ai pas été exaucé. » | Bukhari 6340, Muslim 2735a et 2735c ; Ahmad (hors politique actuelle) | 4 |
| 7 | Conclusion | Dieu est proche de celui qui L'invoque. | Al-Baqarah 2:186 | 5 |

La démo ne produit que le reel 1.
