# Rétention : tout remettre à plat

Proposé le 2026-11-10. **Rien n'est décidé** : le propriétaire tranche point par point (liste à la fin).

## Mise à jour du 2026-11-11

**Ce que le propriétaire a précisé.** Il a validé ce qui existe par rapport aux options que les sessions lui ont
montrées, sans être convaincu à 100 % par les personnages ni par les styles. Ce dépôt a commencé comme une démo :
continuer sur cette base est peut-être l'erreur. **Quatre règles seulement sont obligatoires** : les citations
par id, jamais de synthèse vocale sur le Coran, personne de connu dessiné, la politique des hadiths. Tout le reste
se discute, outils compris. Pas de voix humaine ; d'autres voix IA sont à essayer. Le style est à proposer, même
s'il demande un grand chantier. Il n'a pas décidé si ces vidéos iront sur les pages des récitations. On continue
le brainstorming avant de tout recréer.

**Ce que montrent les pages** (YouTube Studio, 13 oct. – 9 nov. 2026, et `quran-reels`) :

- La chaîne n'a que cinq jours d'activité : 9 000 vues, 51,5 h, soit **environ 20 s regardées par vue**, sur des
  récitations de sourates courtes (texte arabe, traduction anglaise, sens d'un mot). 66 abonnés au 2026-11-09,
  5 sur TikTok. Il n'y a donc presque pas de public à perdre, ni à apporter.
- Vues par pays : Algérie 11,6 %, Maroc 8,8 %, Ouzbékistan 7,7 %, **Égypte 6,5 %**, Irak 5,8 %, Syrie 5,1 %,
  Indonésie 4,8 %, Allemagne 3,2 %, Arabie saoudite 2,9 %, Jordanie 1,9 %. Les pays arabes de cette liste font
  42,6 % des vues ; aucun pays anglophone n'y figure.

**Ce que j'en tire.**

- **La langue.** La narration en égyptien s'adresse d'abord à 6,5 % de ce public. L'arabe standard simple
  (« فصحى مبسطة ») est compris de l'Algérie à l'Irak, c'est la langue habituelle du récit religieux, et c'est là
  que les voix de synthèse sont le mieux mesurées (voir « Les voix »). Contrepartie à tenir : en arabe standard, une phrase de la
  narration peut retomber mot pour mot sur le verset qu'elle annonce ; or la voix de synthèse ne dit jamais le
  Coran. « Une question, le verset, le sens » règle ce point : la narration ne redit plus le verset.
- **Les pages.** Deux produits, deux publics : des récitations de 20 s pour tout musulman, des films racontés
  en arabe pour qui comprend l'arabe. Je les séparerais (des pages au nom arabe pour les films, les pages des
  récitations renvoyant vers elles), puisqu'il n'y a pas encore de public à déplacer. Confiance moyenne : le
  propriétaire tranche, rien d'autre n'en dépend que le nom signé sur les images.
- **Le style.** Tout ce qui a été montré au propriétaire a été dessiné par du code, dans la direction la moins
  favorable à ce moyen : des personnages et des objets au trait, en aplats. Trois familles d'images existent,
  et aucune n'a été comparée aux autres : (1) **dessiné par le code, mais en silhouettes à contre-jour**, dans les
  couleurs des récitations de la page (essai « nuit et or » du 2026-11-11 : `docs/retention/nuit-et-or-9x16.jpg`
  et `nuit-et-or-16x9.jpg`, dessinés par `docs/retention/style-frame.py`) ; (2)
  **images peintes par un modèle d'images**, animées par un mouvement de caméra ; (3) **vidéos de nature et
  typographie**, comme les récitations. Le film peut mêler (1) et (3). À comparer sur le même plan avant de
  choisir.
- **La base.** Le dépôt contient 6 000 lignes de dessins (plat, Open Peeps, papier, craie, enluminure), 6 000
  lignes d'épisodes écrits en reels-chapitres et 2 200 lignes d'instructions qui présentent les choix de la démo
  comme des règles ; ce qui porte les quatre règles obligatoires (registre des sources, coupes de récitation et
  temps des mots, nivelage du son) tient en 1 900 lignes. Quand la direction sera choisie : **un dépôt neuf pour
  les films**, qui reprend ces 1 900 lignes et les tests des quatre règles, et rien d'autre ; celui-ci reste
  l'archive des neuf épisodes.

### Les voix (recherche du 2026-11-11)

Recherche sur le web par un agent de la session ; les prix et plusieurs noms de modèles sont à revérifier chez
le fournisseur avant de s'engager.

- **Les meilleures voix arabes sont payantes, et coûtent peu** : 0,14 à 0,64 $ pour dix minutes de narration.
  Trois moteurs sont en tête des classements par écoute : **Gemini 3.8 Flash TTS** (le seul dont la documentation
  nomme à la fois l'arabe standard et l'égyptien ; on lui dit comment raconter, en clair ; environ 0,14 $ le
  film), **ElevenLabs Eleven v4** (0,32 à 0,64 $) et **Cartesia Sonic 3.6** (0,31 à 0,40 $)
  ([Artificial Analysis](https://artificialanalysis.ai/text-to-speech/leaderboard/controlled-voice),
  [Google](https://aistudio.google.com/docs/speech-generation), [ElevenLabs](https://elevenlabs.io/pricing/api),
  [Cartesia](https://cartesia.ai/pricing)). Azure a seize voix arabes par pays et un palier gratuit, mais ses
  voix sont jugées plus mécaniques.
- **Aucun modèle libre n'est à la fois proche de ces trois-là, utilisable commercialement et rapide sur CPU**
  ([arène arabe de Navid](https://huggingface.co/spaces/Navid-AI/Arabic-TTS-Arena)). « Libre et gratuit d'abord »
  est ce qui a tenu la voix au niveau où elle est.
- **L'égyptien est peu mesuré** : 823 votes d'écoute contre 5 134 pour l'arabe standard, et aucun test
  indépendant de l'égyptien pour ElevenLabs, Cartesia ou Gemini 3.8.
- **VoiceTut : un doute sur la licence.** Le modèle est publié en Apache 2.0 mais affiné à partir d'OmniVoice,
  dont les poids sont en CC-BY-NC (non commercial)
  ([VoiceTut](https://huggingface.co/mohammedaly22/VoiceTut-TTS), [OmniVoice](https://huggingface.co/k2-fsa/OmniVoice)).
  À éclaircir avant de monétiser ; ce n'est pas un avis juridique.
- **Les voyelles.** Aucun de ces moteurs n'exige un texte vocalisé ; pour l'arabe standard, un outil libre
  existe (CATT) et un grand modèle de langage vocalise mieux encore, à condition de vérifier que les lettres
  n'ont pas changé ([étude LREC 2026](https://arxiv.org/abs/2506.11602)). Rien de fiable pour l'égyptien.
- Non fait : un essai d'écoute. Un moteur libre (Supertonic 3) n'a pas pu être installé dans cette session
  (installation refusée par le mode de permission) ; les trois moteurs en tête demandent une clé d'API.

### Les images (recherche du 2026-11-11)

- **Ce qui fait le plus de vues dans cette niche aujourd'hui, ce sont des images générées par IA** : la chaîne
  Towards Eternity (4,09 M d'abonnés) est passée en février 2026 à une série titrée « AI-Visualized », dont le
  premier épisode (15,8 M de vues) est sa vidéo la plus vue
  ([vidIQ](https://vidiq.com/youtube-stats/channel/@towardseternity/)). Aucune chaîne arabe sans visage
  d'histoires du Coran à grande échelle n'a été trouvée : lacune de la recherche, pas preuve d'absence.
- **C'est aussi la voie la plus risquée.** YouTube ne monétise pas les « diaporamas d'images… avec peu ou pas de
  récit » ni l'IA « à gabarits génériques », admet l'IA qui illustre un récit original
  ([YouTube](https://support.google.com/youtube/answer/1311392?hl=en)), et n'exige l'étiquette « contenu modifié »
  que pour un rendu réaliste, pas pour un style illustré
  ([YouTube](https://support.google.com/youtube/answer/14328491?hl=en)). Dar al-Ifta (fatwa du 2025-12-30)
  interdit de figurer par IA les scènes du Jour dernier et rappelle l'interdit de représenter les prophètes,
  « explicitement ou par symbole »
  ([Dar al-Ifta](https://www.dar-alifta.org/ar/fatwa/details/22537/%D8%AD%D9%83%D9%85-%D8%AA%D8%B5%D9%88%D9%8A%D8%B1-%D9%8A%D9%88%D9%85-%D8%A7%D9%84%D9%82%D9%8A%D8%A7%D9%85%D8%A9-%D8%A8%D8%A7%D9%84%D8%B0%D9%83%D8%A7%D8%A1-%D8%A7%D9%84%D8%A7%D8%B5%D8%B7%D9%86%D8%A7%D8%B9%D9%8A)).
  Proposition : ajouter aux règles obligatoires « ne jamais figurer l'invisible » (paradis, enfer, Jugement, anges).
- **Trois chaînes de fabrication** (coûts estimés par l'agent, pour un film de 7 min et 60 à 90 plans) :
  (A) des planches peintes par un modèle d'images dans un seul style, découpées en couches et animées par le
  code, rendu identique à chaque fois : 5 à 25 $ ; (B) la même, plus de l'image-vers-vidéo sur dix à quinze
  plans (l'eau, le feu, le ciel, la première seconde des shorts) : 15 à 45 $ ; (C) tout en image-vers-vidéo :
  45 à 250 $, des heures de relecture par film, et tous les risques ci-dessus.
- **Le moteur n'est pas le problème** : Remotion reste gratuit pour un particulier, lit des couches d'images et
  des clips, et rend bien le texte arabe ; en changer n'apporte rien.
- Midjourney n'a pas d'API : inutilisable dans une chaîne sans écran (le propriétaire travaille au téléphone).

### Ce que je recommande, et la suite du brainstorming

- **Le film** : la récitation en colonne vertébrale (« une question, le verset, le sens »), en arabe standard
  simple, dans une image de nuit et d'or qui prolonge les récitations de la page.
- **L'image** : commencer par ce que le code dessine bien (silhouettes, lumière, typographie), puis relever le
  plafond avec des planches peintes par un modèle d'images dans la même direction (chaîne A), et de
  l'image-vers-vidéo sur quelques plans seulement (B). Pas C.
- **La voix** : une des trois voix payantes, choisie à l'oreille.
- **Avant tout chantier, trois comparaisons** que le propriétaire juge au téléphone :
  1. **la voix, à l'aveugle** : les cinq mêmes phrases, en arabe standard et en égyptien, par Gemini 3.8,
     Eleven v4 et Sonic 3.6 (moins de 2 $, sans doute rien avec les paliers gratuits) ; il faut une clé d'API
     par service, saisie dans le formulaire sécurisé de la session, jamais dans la conversation ;
  2. **le style, sur le même plan** : la silhouette dessinée par le code (faite), une planche peinte par un
     modèle d'images, une vidéo de nature avec la typographie ; la session a un générateur d'images par le
     connecteur Figma du propriétaire, payant en crédits Figma : seulement avec son accord ;
  3. **puis 45 secondes montées** avec la voix et le style retenus, avant d'écrire une ligne du nouveau dépôt.

### Gratuit d'abord (décisions du propriétaire, 2026-11-11)

Le propriétaire accepte la cinquième règle obligatoire (**jamais l'invisible figuré**) et tranche : **on commence
gratuit** ; le payant viendra quand une limite sera atteinte et que les vidéos rapporteront. Cela remplace, pour
maintenant, « une voix payante » et « des planches peintes par un modèle d'images » ci-dessus.

- **La voix est le maillon faible du gratuit.** Le film doit donc en dépendre le moins possible : la récitation
  en colonne vertébrale (elle fait déjà la moitié du film), une narration courte (« une question, le verset, le
  sens »), le sens écrit à l'écran.
- **Voix gratuites à comparer à l'oreille**, de la plus prometteuse à la moins :
  1. **Gemini 3.8 Flash TTS, palier gratuit** : la page des prix l'indique « Free of charge », sans donner ses
     limites, et précise que les contenus du palier gratuit servent à améliorer les produits de Google
     ([Google](https://aistudio.google.com/docs/pricing)). Il faut une clé gratuite Google AI Studio ; le droit de
     publier la voix produite sur ce palier reste à confirmer dans les conditions.
  2. **Azure, palier gratuit F0** : 0,5 million de caractères par mois en voix neurales, soit une soixantaine
     de films ; seize voix arabes par pays ; jugées plus mécaniques
     ([Azure](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)). Il faut un
     compte Azure.
  3. **Supertonic 3** (modèle libre, rapide sur CPU, milieu de classement) : sa licence OpenRAIL-M n'interdit pas
     l'usage commercial et exige de dire que la voix est générée par une machine, ce que les descriptions font
     déjà ([licence](https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE)).
  4. **Chatterbox Multilingual** (MIT), vitesse sur CPU inconnue.
  VoiceTut reste possible, avec son doute de licence à lever avant toute monétisation.
- **Images gratuites** : ce que le code dessine (« nuit et or » : silhouettes, lumière, typographie) et des
  vidéos de nature libres, comme le fait déjà `quran-reels` ; le verset récité sur la scène.
- **Reporté au jour où les vidéos rapportent** : les voix payantes (0,14 à 0,64 $ le film), les planches peintes
  par un modèle d'images, l'image-vers-vidéo.
- **Les comparaisons d'avant chantier, version gratuite** : (1) la voix, les cinq mêmes phrases en arabe
  standard et en égyptien, par les moteurs ci-dessus ; (2) le style, « nuit et or » dessiné par le code contre
  une vidéo de nature avec la typographie ; (3) 45 secondes montées.

### Comparaison des voix gratuites (2026-11-11, en cours)

Les cinq mêmes phrases (l'ouverture, la promesse, la leçon et la fin du short du bateau), en arabe standard
(`content/voice-test/10-boat-standard.txt`) et en égyptien (`11-boat-egyptian.txt`), mises au même volume. Le
propriétaire écoute des fichiers nommés par une lettre ; la clé est ici.

| Lettre | Moteur | Où il tourne | Ce qu'entend Whisper |
| --- | --- | --- | --- |
| A | Supertonic 3, voix `M5` | CPU de la session : 8 s de calcul pour 35 s de voix | Standard : tous les mots. Égyptien : deux mots déformés. |
| B | Chatterbox Multilingual V3, voix par défaut | CPU : 3 à 4 fois la durée de la voix | Standard : trois mots déformés. Égyptien : quatre. Débit plus rapide (23 s contre 34). |
| C, D, E | Gemini 3.8 Flash TTS, voix `Charon`, `Algieba`, `Sadaltager` | API, palier gratuit, par le workflow `voice-test` (run 10 ; six requêtes en trois minutes) | Standard : tous les mots, pour les trois voix. Égyptien : deux à quatre mots écrits autrement. |
| B-lent | Chatterbox V3, `exaggeration` 0,7, `cfg_weight` 0,25, puis ralenti de 10 % | CPU | Non transcrit. |
| actuelle | VoiceTut `Mohammed` (égyptien seulement) | prises déjà figées | Connues du propriétaire. |

- **Ce qu'a entendu le propriétaire (2026-11-11)** : A « très mauvais » ; B parle bien et prononce sans faute,
  mais trop vite et de façon mécanique ; la voix actuelle (VoiceTut) est bonne, sa prononciation imparfaite. La
  transcription automatique disait l'inverse pour A et B (A sans faute, B trois mots déformés) : **elle ne
  mesure pas la qualité d'une voix**, seulement si des mots y sont. Suite : B refait plus lent et plus
  expressif (« B-lent »), et Gemini (C, D, E), envoyés à l'écoute.
- VoiceTut n'a pas de réglage de ton : ses « personnages » sont ses 19 voix, plus la vitesse. Le propriétaire en
  a entendu cinq le 2026-11-06 ; huit voix d'homme ne l'ont jamais été (Ali, Hassan, Mostafa, Ramy, Shaker,
  Tareq, Yehia, Youssef).
- Supertonic lit **mieux un texte sans voyelles** : sur le même texte entièrement vocalisé, il a déformé trois
  mots (« والسر في » entendu « وللسروف »). Pour lui, n'écrire que les voyelles d'un nom propre.
- Chatterbox V3 ne s'installe pas depuis PyPI (0.1.7 n'a que la V2) : il faut le dépôt GitHub de Resemble.
- Whisper compte des mots, il ne juge ni le timbre ni le naturel : c'est l'oreille du propriétaire qui tranche.
- Gemini : `tools/tts/gemini.py` et l'entrée `gemini_voices` du workflow `voice-test` ; la clé est un secret du
  dépôt GitHub (idée du propriétaire, comme dans `quran-reels` ; en place depuis le run 10), elle ne passe
  jamais par une session. Le
  formulaire de clé des sessions ne convient pas : Google lit la clé dans l'en-tête `x-goog-api-key`, que ce
  formulaire n'envoie pas.

## La demande

Propriétaire, 2026-11-10, après le premier essai sur Instagram : les règles et les personnages des vidéos faites
jusqu'ici ne sont pas des acquis, tout se discute. L'objectif : **un film long (moins de 10 min environ) et 4 à 6
shorts tirés de lui** ; le critère : **la rétention**, et attirer des spectateurs.

## Ce qui est mesuré

Trois mesures seulement. Tout le reste de ce document est une hypothèse, à essayer.

**1. khidr-01 en « essai reel » sur Instagram** (2026-11-09, 118 vues dont 112 non-abonnés) : 26,4 % des vues
passent les 3 premières secondes ; durée de vue moyenne 8 s sur 2:00 ; aucun partage, aucun abonné. La courbe tombe
le plus vite avant 0:24 et ne plonge pas pendant les 37 s de récitation qui suivent.

**2. Le film long de khidr** (9:08, reconstruit des prises figées, `video/public/data/khidr.json`) :

| Ce qu'on voit ou entend | Durée | Part |
| --- | --- | --- |
| Un verset sur une carte sombre (`ayah-card`) | 4:41 | 51 % |
| Une phrase de la narration sur une carte sombre (`title-card`) | 1:24 | 15 % |
| Un hadith ou un nom sur une carte sombre | 0:27 | 5 % |
| **Un dessin** (`scene`) | 1:47 | **19,5 %** |
| dont une personne dessinée | 0:40 | 7 % |
| Silence des transitions (0,6 s entre deux phrases, 82 fois) | 0:49 | 9 % |
| La formule « قال ربنا سبحانه وتعالى: » (10 fois, avec ses transitions) | 0:29 | 5 % |

Le plus long passage sans aucun dessin : 74 s (à partir de 4:20). Le bateau est percé à 2:23, le premier secret
est dit à 5:14. La narration fait 500 mots en 9 min ; 74 s racontent un événement que le verset redit aussitôt.
Aucun son en dehors des voix.

**3. Les 45 reels des neuf épisodes** : 20 s'ouvrent sur la même image (une personne assise dans la salle
d'attente), 29 sur la salle d'attente ou la rue avec les deux mêmes personnages ; 28 finissent sur « تابعنا عشان
تعرف ».

## Le constat

- **Ce n'est pas un dessin animé.** 71 % du film est du texte sur fond sombre. Les personnages, qu'on discute le
  plus, occupent 7 % de l'écran : les remplacer ne changera presque rien au film long. Ils comptent pour une autre
  raison : ils sont la première image de presque tous les reels.
- **Le film est pour moitié une récitation.** C'est sa force (la courbe tient pendant les versets, et c'est ce que
  la page sait faire) et c'est son image la plus pauvre : une carte immobile, le mot surligné pour seul mouvement.
  L'image du verset est le premier chantier, loin devant les autres.
- **Le récit avance lentement** : le premier fait étrange arrive à 2:23, la première réponse à 5:14.
- **Les reels sont des chapitres, pas des shorts** : écrits pour être vus dans l'ordre par quelqu'un qui suit,
  montrés dans le désordre à des inconnus.

## Ce que je remets en cause

Par ordre d'effet attendu sur la rétention. « Aujourd'hui » est un fait ; « à la place » est ma proposition.

1. **Un épisode = cinq reels mis bout à bout.** Aujourd'hui le film hérite des reels (introductions, formules et
   appels répétés) et les reels héritent du film (mise en place, « la suite au prochain »). À la place : **le film
   s'écrit d'abord, d'un seul tenant** ; les shorts sont **4 à 6 moments recoupés du film**, chacun avec sa propre
   première phrase et sa propre fin, aucun numéroté, aucun qui demande d'avoir vu les autres.
2. **Le verset sur une carte sombre** (51 % du film). À la place : **le verset récité sur la scène qui vit**
   (le lieu de ce que dit le verset, assombri derrière le texte). Texte uthmani exact, mot surligné et vraie
   récitation inchangés. Prototype fait (voir plus bas).
3. **Raconter, puis réciter** (règle du 2026-11-08). Pour qui comprend l'arabe, l'histoire est dite deux fois.
   À la place : **une question, le verset, le sens**. La narration pose la question (« عمل إيه أول ما ركبوا؟ »),
   le Coran répond, la narration tire le sens en une phrase. Le sens en égyptien de chaque verset (nos répliques
   déjà validées) s'écrit à l'écran pendant la récitation au lieu d'être dit avant. Aucun verset n'est retiré.
4. **Une phrase = une scène = un silence.** 82 transitions de 0,6 s, 49 s sans voix, et une image qui glisse à
   chaque phrase. À la place : **la voix continue pendant que l'image change** ; un silence seulement là où il
   dit quelque chose (avant un verset). C'est un changement du moteur (scènes regroupées en séquences).
5. **L'accroche « miroir »** (une question générale sur la vie du spectateur, cinq phrases avant le premier fait).
   À la place : **l'ouverture à froid** sur le fait le plus étrange de l'histoire, dessiné et écrit en grand dès la
   première image ; le miroir vient à la fin, quand l'histoire a payé. Essayé : `khidr-solo-01`.
6. **La voix de synthèse.** C'est mon hypothèse la plus forte et la moins prouvée : dans une histoire racontée,
   la voix porte l'émotion, et VoiceTut dit tout sur le même ton. À la place : **essayer une voix humaine** (celle
   du propriétaire ou d'un proche) sur un seul short, à côté du même short en synthèse. Dix minutes de texte se
   lisent en une demi-heure ; les vérifications de la voix de synthèse coûtent plus par épisode.
7. **Les personnages Open Peeps.** Trois personnes, trois expressions, aucune action, un trait noir et blanc
   posé sur des aplats de couleur : ils disent « tutoriel », pas « histoire ». À la place : **plus aucun
   personnage à visage** ; des silhouettes sans visage (déjà faites pour le papier découpé) et surtout des
   **objets et des lieux qui racontent** (le train qui part, une chaise vide, un téléphone) ; plus de narrateur
   dessiné qui « parle » avec une voix de synthèse.
8. **Quatre styles selon le format** (décision du 2026-11-09). Une page se reconnaît en une seconde à son image.
   À la place : **un seul style maison**. Le papier découpé existe et a été validé sur la caverne ; la craie et
   l'enluminure restent en réserve.
9. **Aucun son.** À la place : **une ambiance sous la narration** (mer, vent, bois qui craque, rue), sons CC0.
   Jamais sous une récitation ; pas de musique (une partie du public la refuse).
10. **Le texte à l'écran** : des cartes entières, et un sous-titre anglais en petit. À la place : dans les shorts,
    **la phrase dite, écrite en grand sur l'image**, dans la langue parlée (`caption: big`, fait) ; la traduction
    en dessous.
11. **La formule en carte** (10 fois, 29 s). À la place : **écrite au-dessus du verset** (« قال الله تعالى »),
    dite une fois par séquence.
12. **Sept formats, dont cinq épisodes « idées fausses ».** Une liste d'idées n'a ni image ni question qui tienne
    huit minutes ; une histoire a les deux. À la place : **chaque film est une histoire** du Coran ou de la Sunna
    qui répond à une question de vie ; une idée fausse fait un bon short. Confiance moyenne.
13. **Les hadiths lus par des enregistrements d'archive.org.** Le son change de pièce au milieu du film, et
    aucune licence n'est indiquée sur ces lectures. À la place : avec une voix humaine, le narrateur lit le
    hadith ; sinon, garder seulement les lectures propres.
14. **Les exemples de vie après chaque leçon** (règle du 2026-11-08). Trois exemples de dix secondes, chacun avec la
    même personne, dans la rue ou la salle d'attente. À la place : **un seul exemple par film**, précis, montré par des objets.
15. **« تابعنا عشان تعرف »** à la fin de 28 reels. À la place : le short finit sur sa phrase à retenir et
    **renvoie au film** (lien « vidéo associée » de YouTube Shorts, une ligne de la légende ailleurs).
16. **La miniature et le titre** montrent un visage et le thème. À la place : **l'image du fait étrange et la
    question** (le bateau percé, « ليه خرقها؟ »).

## Ce que je garde, et pourquoi

Ces règles ne coûtent pas de rétention ; elles sont la raison de faire confiance à la page.

- Une citation n'existe que par son id, son texte vient de l'API : une erreur dans un verset tuerait la page.
- Jamais de synthèse vocale sur le Coran.
- Jamais un prophète, un Compagnon ou une personne connue dessinés. Ce qui coûte, c'est la carte de nom sur fond
  sombre : le nom peut s'écrire sur le lieu de la scène.
- La politique des hadiths, les exemples honnêtes, la voix de synthèse déclarée tant qu'elle sert.
- La validation unique du propriétaire, à la fin, sur les vidéos.

## Le modèle proposé

**Le film** (6 à 8 min, 16:9, YouTube) :

| Temps | Mouvement |
| --- | --- |
| 0:00 – 0:20 | Ouverture à froid : le fait le plus étrange, puis les autres en une phrase chacun |
| 0:20 – 0:30 | La question du film et ce qu'il donne (YouTube mesure qui regarde encore à 0:30) |
| puis | Les faits : une question, le verset sur sa scène, une phrase de réaction |
| au milieu | Une relance (« تلات حاجات… ومفيش تفسير ») |
| puis | Les réponses, chacune par son verset |
| fin | La leçon, un exemple de vie, retour à l'image d'ouverture, la vidéo suivante |

Budget, vérifiable par `validate.py` : premier fait en moins de 5 s ; texte sur fond sombre sous 15 % du film ;
silence sous 3 % ; jamais la même image immobile plus de 6 s ; une relance toutes les 60 à 90 s.

**Les shorts** (4 à 6 par film, 30 à 70 s, 9:16) : choisis à l'écriture du film ; chacun a un fait étrange, le
verset ou le hadith qui y répond, une phrase à retenir. Première phrase écrite pour le short, première image =
le fait, écrit en grand. Le plus fort sort le premier.

## Pilote : khidr refait

Les sources, les coupes de récitation et la mesure de départ existent déjà.

- **Film** : environ 7 min au lieu de 9:08 (mon estimation), avec les 20 mêmes versets (4:41 de récitation), 2:10 de narration au
  lieu de 3:38, 15 s de silence au lieu de 49. Le bateau percé à 0:00 au lieu de 2:23.
- **Shorts** : le bateau (fait : `khidr-solo-01`) ; le mur et le trésor ; le moineau et la mer (Bukhari 3401) ;
  « مين أعلم؟ » (Bukhari 122) ; « عسى أن تكرهوا شيئًا » (2:216), qui sert de bande-annonce du film ; le garçon,
  si le propriétaire le veut (le sujet est dur, dit seul en 60 s).

## Mesurer

- Short : taux d'accroche (3 s) et durée de vue moyenne rapportée à la durée. Départ : 26,4 % et 7 %.
- Film : « Intro » de YouTube Analytics (part encore là à 0:30) et durée de vue moyenne.
- Un seul changement à la fois quand c'est possible ; à 120 vues par essai, seul un écart de 12 à 14 points est
  autre chose que du bruit : republier ou cumuler plusieurs essais.

## Prototype déjà dans le code

- `visual.caption: big` : la phrase écrite en grand sur une scène (essai `khidr-solo-01`).
- Un `ayah-card` avec un `background` : le verset récité sur sa scène (style plat). Aucun épisode ne l'emploie.

## Décisions du propriétaire

1. **Le public et la langue** : narration en égyptien pour le monde arabe, ou en anglais pour le public actuel de
   la page ? Il faut les pays de l'audience. Tout le reste en dépend.
2. **La voix** : un essai avec une voix humaine, oui ou non ; la voix de qui.
3. **Le style maison** : le papier découpé pour tout, oui ou non.
4. **Le pilote** : khidr refait sur ce modèle (film et shorts), oui ou non.
5. **Les règles du 2026-11-08** : « raconter puis réciter » remplacé par « question, verset, sens » ; un exemple de
   vie par film au lieu d'un par leçon.
6. **L'ambiance sonore** sous la narration, oui ou non.
7. **Le short du garçon**, oui ou non.

## Ce que je ne sais pas

- Qui regarde : les 112 non-abonnés de l'essai comprenaient-ils l'égyptien ?
- Ce que vaut un reel habituel de la page sur les mêmes deux chiffres.
- Si une voix humaine change vraiment la rétention ici.
- Combien de temps prend le rendu du film en papier découpé avec des versets sur leur scène (la caverne : 2 h
  dans un seul job, environ 50 min en trois).
