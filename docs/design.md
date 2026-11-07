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
| Marque | Même page que Quran Words Daily, publiée à la main par le propriétaire (6 novembre 2026) | Épisode entier en 16:9 pour YouTube, reels en 9:16 pour Facebook, Instagram et TikTok. |
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
| 2 | Promesse | Pourquoi : on reconnaît son besoin de Dieu et Sa puissance. Puis « قال ربنا سبحانه وتعالى » et le verset de la promesse. Fin : « 3 idées reçues, la 1re au prochain reel ». | Ghafir 40:60 | 1 |
| 3 | Idée reçue 1 | « Je suis content de mon sort, je ne demande pas » : le du'a s'opposerait au contentement. Le narrateur annonce l'idée reçue. Ayyub, au cœur de l'épreuve, a invoqué son Seigneur (carte de nom, puis le verset) : le du'a n'est pas une objection, c'est un besoin. | Al-Anbiya 21:83 | 2 |
| 4 | Preuve | Demander avec résolution, sans « si Tu veux » : rien n'est trop grand pour Dieu. Fin : « tout est écrit… que change le du'a ? » | Muslim 2679a | 2 |
| 5 | Idée reçue 2 | « Tout est écrit, pourquoi demander ? » Rien ne repousse le décret sauf le du'a ; puis le verset ; le du'a lui-même fait partie du décret. Fin : « et si tu as beaucoup demandé sans rien voir ? » | Tirmidhi 2139 ; Ar-Ra'd 13:39 | 3 |
| 6 | Idée reçue 3 | « J'ai demandé, rien n'est venu, j'ai arrêté. » Répondu tant qu'on ne s'impatiente pas ; et ce qui est demandé est donné, ou un mal équivalent est écarté : un du'a n'est jamais perdu. | Bukhari 6340 ; Tirmidhi 3573 (al-Albani : hasan sahih, à la place d'Ahmad) | 4 |
| 7 | Conclusion | « Personne ne t'entend ? » Le verset de la proximité ; rappel des quatre reels en une phrase ; « n'arrête pas, et dis « يا رب » ». | Al-Baqarah 2:186 | 5 |

Reels 2 à 5 proposés le 6 novembre 2026, validés par le propriétaire le 7 (script, traduction, voix). L'épisode complet, en 16:9 (YouTube) et en 9:16, joue toutes les scènes dans l'ordre (≈ 3 min 40), sans les fins propres aux reels (« ده اللي جاي ») ; chaque reel (9:16, 35 à 60 s) tient seul. Non repris des sources du plan : Bukhari 6339 (même sens que Muslim 2679a), Muslim 2735a et 2735c (même sens que Bukhari 6340), qui restent au registre.

## Épisode Patience (plan)

Proposé le 7 novembre 2026 (skill `new-theme`), à valider : sources, script, traduction, textes de publication. Même structure que le du'a : la promesse, trois idées reçues, la conclusion. Script : `content/episodes/sabr.yaml`.

| # | Rôle | Contenu | Source | Reel |
| --- | --- | --- | --- | --- |
| 1 | Accroche | « اصبر »… le mot qu'on entend en attendant un travail, une guérison, un soulagement : facile à dire, difficile à vivre. | — | 1 |
| 2 | Promesse | L'épreuve viendra, la bonne nouvelle est pour les patients ; pour le croyant, même l'épreuve est un bien s'il est patient. Fin : « 3 idées reçues, la 1re au prochain reel ». | Al-Baqarah 2:155 ; Muslim 2999 | 1 |
| 3 | Idée reçue 1 | « Le patient ne pleure pas, ne se plaint pas. » Ya'qub se plaint de sa peine à Dieu seul (carte de nom, puis le verset) ; le Prophète ﷺ pleure son fils Ibrahim : « l'œil pleure, le cœur s'attriste, et nous ne disons que ce qui plaît à notre Seigneur ». La patience, ce n'est pas ne rien sentir, c'est ne pas s'opposer à Dieu. | Yusuf 12:86 ; Bukhari 1303 | 2 |
| 4 | Idée reçue 2 | « Être patient, c'est renoncer et attendre. » Recherche ce qui te profite, demande l'aide de Dieu, ne renonce pas ; puis « cherchez l'aide dans la patience et la prière » : la patience est une aide pour avancer. | Muslim 2664 ; Al-Baqarah 2:153 | 3 |
| 5 | Idée reçue 3 | « Je ne suis pas patient, c'est ma nature. » Celui qui s'efforce à la patience, Dieu le rend patient ; et la patience se demande : « Seigneur, déverse sur nous la patience ». | Bukhari 1469 ; Al-Baqarah 2:250 | 4 |
| 6 | Conclusion | « Ta patience n'a pas de fin ? » La récompense des patients sans compter ; rappel des quatre reels ; « quand on te dit « اصبر », souviens-toi que Dieu est avec les patients ». | Az-Zumar 39:10 | 5 |

Les répliques déjà figées dans le du'a (« قال ربنا سبحانه وتعالى: », « تاني فكرة غلط… », « تالت فكرة غلط… ») reprennent la prise validée (`tools/audio/build.py`, prises d'un autre épisode).

## Épisode Repentir (plan)

Proposé le 7 novembre 2026 (skill `new-theme`), à valider : sources, script, traduction, textes de publication, miniature. Même structure que le du'a et la patience. Script : `content/episodes/tawba.yaml`.

| # | Rôle | Contenu | Source | Reel |
| --- | --- | --- | --- | --- |
| 1 | Accroche | « Tu as péché… et tu t'es senti loin de Dieu ? » ; la honte qui empêche de revenir ; « mais la porte… est toujours ouverte ». | — | 1 |
| 2 | Promesse | C'est Lui qui accepte le repentir de Ses serviteurs ; Dieu se réjouit du repentir de Son serviteur plus que l'homme qui retrouve sa monture perdue. Fin : « 3 idées reçues, la 1re au prochain reel ». | Ash-Shura 42:25 ; Bukhari 6309 | 1 |
| 3 | Idée reçue 1 | « Mes péchés sont trop nombreux, Dieu ne me pardonnera pas. » Ne désespérez pas de la miséricorde de Dieu, Il pardonne tous les péchés ; « même si tes péchés atteignaient les nuages du ciel ». Le désespoir est la vraie faute. | Az-Zumar 39:53 ; Tirmidhi 3540 (al-Albani : Sahih) | 2 |
| 4 | Idée reçue 2 | « J'ai rechuté, mon repentir ne vaut rien. » Tout fils d'Adam commet des fautes, les meilleurs sont ceux qui se repentent ; qui fait le mal puis demande pardon trouve Dieu Pardonneur, Miséricordieux. | Tirmidhi 2499 (al-Albani : Hasan) ; An-Nisa 4:110 | 3 |
| 5 | Idée reçue 3 | « Je me repentirai plus tard. » Le repentir accepté est celui de ceux qui se repentent « sans tarder » ; le Prophète ﷺ se repentait plus de soixante-dix fois par jour : le repentir, c'est chaque jour. | An-Nisa 4:17 ; Bukhari 6307 | 4 |
| 6 | Conclusion | « Peur que ton passé te suive toujours ? » Dieu change leurs mauvaises actions en bonnes ; rappel des quatre reels ; « reviens… la porte est toujours ouverte ». | Al-Furqan 25:70 | 5 |

An-Nisa 4:110 remplace Al Imran 3:135, qui commence au milieu d'une phrase (« والذين… », suite de 3:134). Muslim 2759 (« Dieu étend Sa main la nuit… ») est écarté : hadith-api ne lui donne pas de numéro.
