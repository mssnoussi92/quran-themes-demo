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

### Décisions sur la voix (propriétaire, 2026-11-11)

- **Les meilleures voix à son oreille : D et E en égyptien**, c'est-à-dire Gemini 3.8 Flash TTS, voix `Algieba`
  et `Sadaltager`. La narration reste donc **en égyptien** (la session recommandait l'arabe standard, pour un
  public où l'Égypte fait 6,5 % des vues ; il a tranché à l'écoute).
- **VoiceTut `Mohammed` reste la voix de secours**, au cas où le palier gratuit de Gemini deviendrait payant. Sa
  prononciation se corrige par l'écriture du texte donné à la voix (`say_ar`, skill `voice-spelling`) : le
  propriétaire a constaté que le résultat change selon qu'on écrit « sabr » ou « sibr », surtout pour les
  voyelles o et u, et qu'il faut parfois écrire « ou ».
- **Conditions de Gemini, lues le 2026-11-11** ([conditions](https://aistudio.google.com/docs/terms),
  [limites](https://aistudio.google.com/docs/rate-limits)) ; ce n'est pas un avis juridique :
  - Google ne revendique pas la propriété de ce qui est généré, et celui qui s'en sert en est responsable. Rien
    n'interdit de publier la voix ; rien ne l'autorise en toutes lettres non plus.
  - Palier gratuit : les textes envoyés et les voix produites servent à améliorer les produits de Google, et
    des personnes peuvent les relire. Pour quelqu'un qui se trouve dans l'Espace économique européen, en Suisse
    ou au Royaume-Uni, ce sont les règles du palier payant qui s'appliquent même au quota gratuit.
  - Les limites du palier gratuit pour la voix ne sont pas publiées : elles se lisent dans Google AI Studio,
    sur le compte du propriétaire ; les quotas du jour repartent à minuit, heure du Pacifique. Le test a fait
    six requêtes en trois minutes sans refus.
  - Conséquence pour la suite : **peu de requêtes**, une par séquence de plusieurs phrases (comme le test : cinq
    phrases en une prise), jamais une par phrase.

### Trois pistes d'image sur le même plan (2026-11-11)

Envoyées au propriétaire, en attente de son avis ; l'image n'est pas dans le dépôt (elle contient une image
d'une vidéo tierce) :

1. **dessiné par le code**, « nuit et or » (`docs/retention/nuit-et-or-*.jpg`) ;
2. **vraie vidéo de mer et typographie**, comme `quran-reels` (le clip de mer au crépuscule déjà approuvé par le
   propriétaire, Pixabay 22183) : belle, vivante, mais elle ne montre pas l'événement ;
3. **les deux ensemble** : la vraie mer qui bouge, et dessus la silhouette dessinée de ce que raconte le
   verset (le bateau percé). Tout est gratuit dans les trois cas.

### L'essai monté (2026-11-11)

Décisions du propriétaire : **la troisième piste d'image** (la vraie mer filmée, la silhouette dessinée dessus),
**les deux voix D et E** dans l'essai, et « شالتهم » ne lui plaît pas : la première phrase dit « ركّبوهم
السفينة ببلاش ».

- **Ce qui est monté** : le short du bateau dans le modèle proposé (`content/trial/boat.yaml`, composition
  `Trial916`, `tools/trial/`) : une image continue (la mer, la silhouette du bateau percé, puis les navires du
  roi à l'horizon pour 18:79), la voix qui ne s'arrête pas aux changements de plan, les deux versets récités
  sur la scène avec le mot surligné, la première phrase écrite dès la première image. 1:03, contre 1:55 pour
  khidr-02. Aucune ambiance sonore : le clip de mer n'a pas de son.
- **Le palier gratuit de Gemini donne 10 requêtes par jour** (message d'erreur du run 11 ; retour à minuit,
  heure du Pacifique). La narration d'un short tient donc en **une seule prise par voix**, recoupée sur ses
  pauses (`tools/trial/prepare.py`). Le run 11 a épuisé le quota du jour et perdu ses prises (corrigé : une
  requête refusée ne fait plus perdre les prises déjà faites).
- **Envoyé au propriétaire** : l'essai avec la voix de secours (VoiceTut ; une réplique nouvelle, les autres
  sont ses prises connues). Les versions D et E se feront quand le quota repart (rappel programmé dans la
  session pour le 2026-11-11 à 08:10 UTC).
- La vidéo ne se rend que dans une session : le clip de mer (Pixabay 22183) n'est pas dans le dépôt,
  `tools/trial/clip.py` le récupère avec la clé de l'environnement.

### Avis du propriétaire sur l'essai, et version 2 du script (2026-11-11)

Le propriétaire, après la version 1 (voix de secours) : **l'image et le rythme sont bons** ; le script n'est pas
assez attirant, **surtout la leçon de la fin** ; l'histoire est plus profonde : elle parle du qadar, et de ce que
tout ce qu'on voit comme un mal n'en est pas un ; il faut **développer la leçon avec un bon exemple** et **finir
en annonçant l'épisode suivant** (« النوع الثاني من القدر »).

Ce que la session en pense (dit au propriétaire, il tranche) :

- **D'accord sur la leçon.** Pour tenir en 1:03, la version 1 avait retiré l'exemple de vie et réduit la leçon à
  un slogan (« افتكر السفينة »). Les départs mesurés sont dans les premières secondes : vingt secondes de fond à
  la fin ne coûtent rien, et ce sont elles qui font enregistrer et partager.
- **D'accord sur le fond, pas sur le mot.** « Trois types de qadar » est une lecture de prédicateurs (elle
  circule en plusieurs versions qui ne se recoupent pas), pas un classement du Coran ni d'un hadith ; dans les
  livres de croyance, « أنواع التقدير » désigne autre chose (l'éternel, celui de la vie, de l'année, du jour).
  Dit comme un fait, ce serait une affirmation sans source. Proposé : « تلات مواقف » (trois situations de
  l'histoire), la leçon restant notre ligne, et 2:216 pour l'appuyer dans le film.
- **L'annonce du suivant : oui, à trois conditions.** Le short tient d'abord sa propre promesse ; l'annonce est
  une question ouverte sur le cas suivant, pas « تابعنا » (28 reels sur 45 finissaient ainsi) ; et le suivant
  doit se trouver : numéro à l'écran et dans le titre, vidéo associée du short vers le film sur YouTube, les
  trois épinglés dans l'ordre ailleurs. Un short est montré dans le désordre à des gens qui ne suivent pas la
  page.
- **L'exemple.** Celui du train (khidr-02) est une coïncidence heureuse ; il ne ressemble pas au bateau. Le
  bateau, c'est un petit mal visible qui protège d'un grand. Proposé : la petite douleur qui envoie chez le
  médecin, qui découvre plus grave à temps. Autre possibilité : le travail perdu avant que l'entreprise ferme.
- **L'accroche reste l'événement** (le bateau percé), pas « le qadar a trois types » : une ouverture de cours
  est ce qui a perdu les trois quarts des spectateurs en trois secondes sur khidr-01.

Version 2 écrite (`content/trial/boat.yaml`, `content/voice-test/20-trial-boat.txt`, environ 1:30) : la promesse
regarde le spectateur, puis après 18:79 le sens, « موسى شاف الخرق… وما شافش الملك », l'exemple, « مش كل حاجة
شايفها شر… تبقى شر », et l'annonce du deuxième. Les voix D et E la diront au retour du quota.

**Réponse du propriétaire (2026-11-11)** : il garde la version 2 et ne change que deux choses. Il ne veut pas du
mot « اتكسرت » : remplacé par « كل حاجة وحشة حصلتلك في حياتك » dans la promesse et « اللي خسرناه » dans la leçon
(à éviter dans les scripts à venir, comme « شالتهم »). Et il veut **finir par un appel à suivre** : « تابعنا
عشان تعرف بقية القصة », dit en dernier, après l'annonce du deuxième cas, qui donne la raison de suivre ; le nom
de la page s'affiche en grand sous la phrase. La session avait proposé de s'en passer : il a tranché. Ce que
cela engage : la suite promise doit exister quand ce short sera publié. La phrase de fin de la version 1, que
la version 2 avait retirée, revient à sa demande sans le mot : « لما حاجة وحشة تحصلك… افتكر السفينة », après la
phrase à retenir (14 répliques, environ 1:40).

**Ce qui distingue les trois histoires** (propriétaire, même jour) : la fin peut être resserrée, mais elle doit
garder « الحكمة اتكشفت بسرعة » ou une phrase de ce sens, parce que c'est la différence entre les trois (ici la
sagesse se dévoile vite ; pour le garçon, peut-être jamais ici-bas ; pour le mur, des années après). L'annonce
du deuxième cas est donc bâtie dessus, en une phrase : « هنا الحكمة اتكشفت بسرعة… بس في الموقف التاني… ناس
اتوجعوا… ويمكن عمرهم ما عرفوا الحكمة ». À garder pour le film : chaque histoire dit comment sa sagesse s'est
dévoilée, et c'est ce qui fait passer de l'une à la suivante (13 répliques, environ 1:35).

Sa capture de la page des limites de Google AI Studio montre 60 requêtes par minute, 100 000 jetons par minute
et **100 requêtes par jour**, sans dire pour quel modèle ; le refus du run 11 disait 10 par jour pour
`gemini-3.8-flash-tts`. À lui de regarder la page modèle par modèle ; d'ici là on compte sur 10.
Sa seconde capture, pour **Gemini 3.8 Flash TTS** : environ **3 requêtes par minute, 10 000 jetons d'entrée par
minute, 10 requêtes par jour**. Le chiffre de 10 est confirmé ; les 35 s d'attente entre deux requêtes de
`gemini.py` respectent les 3 par minute ; 10 000 jetons d'entrée laissent passer la narration d'un film entier
en une requête (2 187 lettres pour khidr), si la durée de sortie suit.

### Tenir un film entier dans le quota gratuit de Gemini (2026-11-11)

Demande du propriétaire : optimiser le nombre de requêtes pour finir toute la vidéo sans dépasser le quota du
jour. Ce qu'on sait : **10 requêtes par jour** pour `gemini-3.8-flash-tts` sur le palier gratuit (message d'erreur
du run 11), retour à minuit, heure du Pacifique ; la limite est **par projet Google, pas par clé**, et **chaque
modèle a son propre compteur** (documentation des limites, lue le 2026-11-11) ; les vraies limites ne se lisent
que sur aistudio.google.com/rate-limit. La documentation ne donne **aucune durée maximale par requête** : à
mesurer (prise la plus longue faite à ce jour : 27 s).

Mesures : un film comme khidr dit 68 répliques, 2 187 lettres ; les voix D et E disent 7 à 8 lettres par
seconde, soit 4 min 30 à 5 min de narration (moins dans le modèle proposé, qui raconte moins). Un chapitre
fait 300 à 530 lettres, donc 40 à 75 s par requête ; l'essai du bateau (version 2) : 412 lettres.

**Ce qui coûte une requête, c'est un appel, pas une phrase.** Les règles :

1. **Une seule voix.** D ou E se choisit sur l'essai ; deux voix doublent tout et ne tiennent plus dans la journée.
2. **Une requête par chapitre**, jamais par phrase : toutes les répliques du chapitre dans un seul texte. Ce qui
   le rend possible : `tools/audio/align.py` retrouve chaque phrase dans la prise par ses mots (Whisper, puis
   alignement lettre à lettre), au lieu de compter les silences ; essayé sur trois prises réelles (D, E,
   VoiceTut : 13 phrases sur 13, mêmes instants que la découpe faite à la main).
3. **Les shorts ne coûtent presque rien** : ils sont recoupés dans les prises du film. Seules leurs répliques
   propres (accroche, annonce du suivant) sont à dire, **toutes ensemble dans une requête**.
4. **Les corrections en lot** : `align.py` liste les phrases mal dites ; toutes les répliques à refaire vont dans
   UNE requête (avec la réplique d'avant et celle d'après pour le ton), puis sont remontées à leur place.
5. **Le texte se fige avant Gemini.** Les allers-retours sur le script se font à la lecture, et au besoin sur un
   montage avec la voix de secours (VoiceTut, sans quota). Gemini ne dit qu'un texte arrêté.
6. **Une prise faite ne se redemande jamais** : le workflow la garde sans perte (FLAC, release
   `voice-test-latest`), elle est rangée dans le dépôt, et tout nouveau rendu (16:9, 9:16, shorts) la réutilise.
7. **Un garde-fou** : `tools/tts/gemini.py --max-requests` (4 par défaut, entrée `gemini_max_requests` du
   workflow) refuse de démarrer si voix × textes dépasse la limite, avant d'envoyer quoi que ce soit (le run 6
   avait lancé par erreur cinq synthèses que personne ne demandait).

**Budget d'un film et de ses cinq shorts, une voix** : 5 requêtes (un chapitre chacune) + 1 (les répliques
propres aux shorts) + 1 à 2 (corrections) = **7 à 8 sur 10**, en une journée. Si une requête peut porter deux
ou trois minutes (à essayer une fois), le film tient en 2 ou 3 et le total tombe à 4 ou 5.

À essayer quand il reste du quota, sans rien promettre : deux prises du même texte dans une seule requête (le
texte répété, pour choisir la meilleure phrase par phrase) ; les deux voix dans une requête à deux locuteurs
(pour une comparaison seulement) ; un autre modèle pour les brouillons (`gemini-3.8-flash-lite-tts`, compteur à
part : entrée `gemini_model` du workflow), si le propriétaire voit sur la page des limites qu'il a un palier
gratuit.

Écarté : plusieurs projets ou comptes Google pour multiplier le quota gratuit. La limite est par projet ;
la multiplier ainsi, c'est la contourner, et c'est le compte du propriétaire qui serait exposé.

### Les deux histoires suivantes, écrites et dessinées sans voix (2026-11-11)

Le propriétaire : continuer à préparer les histoires suivantes, avec leurs scènes et leur script, et laisser
les voix pour plus tard. Fait, dans le modèle du bateau (une question, le verset, le sens, ce qu'on ne voit
pas, un exemple de vie, la phrase à retenir, comment la sagesse s'est dévoilée, l'annonce du suivant) :

| Short | Fichier | Versets (récitation) | Image filmée | Ce qui est dessiné | Durée estimée |
|---|---|---|---|---|---|
| Le bateau | `content/trial/boat.yaml` | 18:71, 18:79 (34 s) | mer au crépuscule (Pixabay 22183) | le bateau percé, les navires du roi | 1:41 |
| Le garçon | `content/trial/boy.yaml` | 18:74, 18:80, 18:81 (41 s) | pleine lune dans les nuages (29238) | la maison des parents, une fenêtre allumée, puis deux | 1:52 |
| Le mur | `content/trial/wall.yaml` | 18:77, 18:82 (63,5 s) | ciel de couchant (190332) | le village éteint, le mur qui penche, redressé, la lueur du trésor | 2:06 |

Les trois clips sont de ceux que le propriétaire a déjà approuvés pour quran-reels (`config/backgrounds.yaml`
là-bas). Personne n'est dessiné dans aucun des trois.

- **Le garçon.** L'accroche ne dit pas l'acte avec notre voix : elle part des parents (« أب وأم مؤمنين… خسروا
  ابنهم… ويمكن عمرهم ما عرفوا ليه »), et c'est le verset qui dit ce qui s'est passé. La garde de khidr-03 reste
  mot pour mot (« والخضر عمل كده بأمر من ربنا… محدش غيره يقدر يعمل كده ») et ne se coupe jamais. L'exemple
  (quelqu'un qui a perdu un proche) ne donne jamais de raison : « إجابته عند ربنا ». Risque à connaître : le
  verset dit « فقتله » et sa traduction « killed him » ; une plateforme peut limiter la vidéo pour ce mot.
- **Le mur.** L'accroche est le miroir de celle du bateau (des gens généreux et leur bateau percé ; un village
  qui refuse de les recevoir et son mur réparé pour rien) ; la promesse est concrète (« وتحت الجدار ده… كان فيه
  سر ») ; la phrase qui se partage : « كام جدار اتبنى في حياتك… وإنت مش داري؟ » ; l'exemple : ce qui arrive tard,
  quand on est prêt (« يبلغا أشدهما »). Dernier des trois, il redit comment la sagesse s'est dévoilée dans
  chacun. Son appel à suivre annonce « l'histoire suivante » : à remplacer par le film quand il existera.
- **Les durées** sont longues pour des shorts (1:41 à 2:06). Deux leviers sans toucher au fond : resserrer les
  pauses de la voix à chaque « … » (une vingtaine de secondes par short ; ce que `build.py` fait déjà pour
  VoiceTut), et, pour le mur, ses deux versets font à eux seuls 63,5 s.

Ce qui a été construit pour cela : un **brouillon sans voix** (`tools/trial/prepare.py --draft`, voix « X » : la
narration est muette et minutée d'après sa longueur, la récitation est la vraie), pour regarder scènes et
script sur des images avant de dépenser une requête ; `Trial916` dessine une histoire par essai (`boat`,
`boy`, `wall` : `video/src/trial/Boat.tsx`, `Home.tsx`, `Wall.tsx`) sur un clip placé par l'essai (`clip` :
recadrage, décalage, assombrissement) ; un verset long s'affiche par pages de 14 mots au plus, au fil de la
récitation ; une réplique longue rétrécit pour rester au-dessus de l'image.

Voix : les répliques des trois shorts tiennent dans trois textes (`content/voice-test/20`, `21`, `22`), soit
**3 requêtes pour une voix**, 6 pour les deux.

**Une seule voix : D** (décision du propriétaire, 2026-11-11 : « puisqu'on est limité sur les requêtes Gemini,
on utilise seulement la voix D »). D = Gemini 3.8 Flash TTS, voix `Algieba`, en égyptien. E (`Sadaltager`)
n'est pas écartée pour sa qualité : elle n'est plus enregistrée, pour ne pas doubler les requêtes. VoiceTut
`Mohammed` reste la voix de secours. Les trois shorts coûtent donc 3 requêtes, une par texte.

Correction d'une estimation de la session : les pauses de la voix aux « … » font bien une vingtaine de
secondes par short, mais on ne les supprime pas ; les ramener à 0,45 s au plus gagne 7 à 11 s par short
(mesuré sur la prise D de la première comparaison : 12 pauses, 7,95 s, dont 2,7 s au-dessus de 0,45 s).

### Script des trois shorts validé ; le film long et les miniatures, proposés (2026-11-11)

**« Je valide le script »** (propriétaire, 2026-11-11, après lecture des trois shorts) : inscrit dans
`content/trial/boat.yaml`, `boy.yaml`, `wall.yaml` (`script_validated`). Cela vaut pour les répliques, pas pour
la voix, les images ni les textes de publication ; une réplique changée redevient à valider.

**Le film long** (sa demande : adapter le script pour une vidéo longue qui contient toute l'histoire, avec une
suggestion). Proposé dans `content/trial/film.yaml`, pas validé, pas encore lu par le code :

| | Chapitre | Contenu | Durée estimée |
|---|---|---|---|
| 0:00 | Trois situations | les trois images, la promesse (répliques nouvelles) | 0:20 |
| 0:20 | La condition | 18:67-68, « مش شايف الصورة كلها », 18:70 | 0:45 |
| 1:05 | Le bateau | accroche du short, 18:71-73, 18:79, sa leçon, l'annonce du deuxième | 1:50 |
| 2:55 | Le garçon | accroche du short, 18:74-76, 18:80-81, sa leçon avec la garde, l'annonce du troisième | 2:05 |
| 5:00 | Le mur | accroche du short, 18:77, la séparation et 18:78, 18:82, sa leçon | 2:00 |
| 7:00 | Pourquoi on ne le voit pas | les trois façons, 2:216, le moineau (Bukhari 3401, lu par une vraie voix), « افتكر السفينة » | 1:10 |

Environ 8:10, dont 3:50 de récitation. Ce que la session recommande, et pourquoi :

- **Chaque histoire avec son secret**, comme dans les shorts : le premier secret est dit vers 2:10 (5:14 dans
  l'ancien film). L'autre possibilité est l'ordre du Coran (les trois événements, 18:78, puis les trois
  secrets), que le propriétaire avait choisi pour l'ancien film ; elle garde le suspense du texte mais fait
  attendre la première réponse jusque vers 3:50, alors qu'une vue dure en moyenne bien moins. Les deux se
  montent avec les mêmes prises : c'est un choix de montage, pas de voix.
- **Les shorts donnent les trois quarts de la narration du film** : leurs prises sont reprises réplique par
  réplique. Le film ne demande qu'**une requête de voix** de plus (12 répliques, `content/voice-test/23-trial-film.txt`).
- **Le film reprend ce que les shorts laissent de côté** : la condition, « ألم أقل إنك لن تستطيع معي صبرا »
  après chaque événement (18:72-73, 18:75-76), la séparation (18:78), 2:216 et le moineau.
- **Ce qui reste à construire** : la version 16:9 du montage (les mêmes scènes en paysage, un clip par
  chapitre), les images de l'ouverture, de la condition et de la fin ; un rendu de 8 minutes prend environ
  1 h 30 dans une session.

**Les miniatures**, proposées (`cover` de chaque short, `thumbnail` de `film.yaml`) : une couverture 9:16 par
short (`TrialCover916` : la scène, le titre en grand, « موسى والخضر · ١ من ٣ » en étiquette ; titre et
silhouette dans le carré central, que montre une grille de profil) et la vignette YouTube du film
(`TrialThumb169`, 1280x720 : les trois histoires côte à côte, la première à droite, « موسى والخضر » en grand,
« ٣ مواقف… و٣ أسرار » en étiquette, rien dans le coin bas-droite). Titres des couvertures : « ليه خرق
السفينة؟ », « خسروا ابنهم… ليه؟ », « سر تحت الجدار ».

### Film validé, montage 16:9 commencé, rappel d'abonnement (2026-11-11)

**« Je valide et tu peux commencer le montage »** (propriétaire, 2026-11-11, en réponse aux trois questions de
la session) : la structure du film (chaque histoire avec son secret), ses répliques nouvelles et les titres
des miniatures. Inscrit dans `content/trial/film.yaml` (`script_validated`, `thumbnail.validated`). Ni la voix
ni le montage ne sont validés.

**Le rappel d'abonnement** (sa demande : un format animé et le bon emplacement), proposé et construit ainsi :

- **La forme** : le nom de la page, en haut à droite, devient pendant 4 secondes un bouton « اشترك · Subscribe »
  avec une cloche ; il se remplit d'or et dit « مشترك ✓ », la cloche se balance, puis le nom revient. Pas de
  curseur (il fait tutoriel, et la plupart des spectateurs sont sur téléphone), pas de son.
- **L'endroit** : à la place du nom de la page, donc loin du texte arabe et des sous-titres.
- **Les moments** : deux passages (`subscribe: true` dans `film.yaml`) : juste après la première leçon,
  pendant la phrase qui annonce la deuxième histoire (vers 2:30) ; à la fin, sur « اشترك… عشان القصة الجاية ».
  Jamais sur un verset, un hadith ou la garde, jamais dans les 30 premières secondes (`tools/trial/film.py` le
  refuse). Les 12 dernières secondes sont une image calme, pour l'écran de fin de YouTube.

**Le montage 16:9** (`TrialFilm169`, `video/src/trial/Film.tsx` ; données par `tools/trial/prepare.py --film`,
`tools/trial/film.py`) : ce qui est dessiné d'un côté de l'image, le texte arabe de l'autre, la traduction en
bas ; un clip par histoire, fondu de l'un à l'autre ; l'ouverture montre les trois images au fil de sa
première phrase ; le chapitre en cours en haut à gauche ; le moineau du hadith dessiné sur le bord du bateau.
Les répliques des shorts sont recoupées dans leurs prises, réplique par réplique. Brouillon sans voix :
8:00, chapitres à 0:00, 0:18, 1:00, 2:39, 4:41 et 6:41, 3:50 de récitation.

### La nuit du 2026-11-11 : la voix D sur les quatre textes, les rendus, les textes de publication

Le propriétaire, avant de dormir : « je t'autorise de terminer les vidéos avec tes recommandations ; je veux
3 shorts + film + thumbnail + title et description » pour le matin.

- **La voix.** Une requête d'essai à 04:40 UTC est passée, alors que le quota du jour devait être épuisé
  jusqu'à 08:00 UTC ; les trois autres textes ont suivi (une refusée avec « retry in 3h18m », repassée à la
  demande suivante). Les quatre prises de la voix D sont dans le dépôt (`content/trial/takes/` : 65, 70, 66 et
  64 s), 4 requêtes en tout. Le compteur du palier gratuit n'est donc pas strict : une requête refusée « pour la
  journée » peut passer quelques minutes après. Une prise d'une minute et 13 répliques tient dans une requête.
- **La découpe.** Chaque phrase est retrouvée par ses mots (`align.py`) : 33, 35, 30 et 28 morceaux, tous
  entendus. Un cas corrigé : une phrase dite sans pause après une question d'un mot (« السر؟ ») prenait la pause
  d'avant la question.
- **Les pauses resserrées** (recommandation de la session, appliquée) : la voix D tient jusqu'à 1,5 s à chaque
  « … » ; `prepare.py` garde au plus 0,5 s dans une réplique et 0,7 s entre deux répliques, en retirant le
  milieu du silence. Vérifié par Whisper sur six morceaux : aucun mot coupé. Gain : 6 à 7 s par short.
- **Les durées réelles** : bateau 1:33, garçon 1:47, mur 2:04, film 7:47 (chapitres à 0:00, 0:19, 1:00, 2:32,
  4:31, 6:29 ; rappels d'abonnement à 2:26 et 7:33).
- **Les rendus** : `video/out/essai/khidr-short-1-boat.mp4`, `-2-boy`, `-3-wall`, `khidr-film-16x9.mp4`, puis
  les trois shorts signés du nom TikTok de la page (`-tiktok.mp4`, prop `platform`), environ 4 images par
  seconde dans la session.
- **Les textes de publication** : `publish` de chaque fichier de l'essai (titre, description, proposés) et
  `tools/trial/publish.py`, qui écrit `docs/retention/publication-moussa-khidr.md` : pour le film et chaque
  short, un bloc à coller par plateforme, les sources citées, les chapitres du film, la ligne de voix IA
  (Gemini), les hashtags de la page.
- **Vérifié avant l'envoi** : chaque vidéo sur une planche d'images (ouverture, un verset par histoire, les deux
  rappels d'abonnement, le hadith, la fin) et mesurée : −16,4, −16,3, −16,3 LUFS pour les shorts, −16,2 pour le
  film (écart de 4,6 LU). Un défaut trouvé dans le film et corrigé : la traduction d'une réplique (144
  caractères, 0:19 à 0:27) prenait trois lignes et la troisième sortait de l'image ; une traduction trop longue
  pour les deux lignes du film est maintenant écrite plus petit (`sub.rows`, `subSize`, `Trial.tsx`). Seules les
  500 images entre deux images clés (0:14 à 0:31) ont été rendues à nouveau et recollées sans réencoder le reste
  (comparaison image par image : les 13 526 autres sont identiques, le son n'a pas bougé).
- **Points faibles connus, non corrigés** : aucun son hors des voix (les clips sont muets, les 12 dernières
  secondes du film sont silencieuses) ; dans l'ouverture du film le texte passe sur la lune ; une double image
  brève quand le bateau change de place entre deux plans ; le short du mur finit sur « تابعنا عشان القصة الجاية »
  alors qu'aucune histoire suivante n'existe encore ; le short du garçon dit un meurtre dans le verset et sa
  traduction, ce que les plateformes peuvent limiter.

Rien de cela n'est validé par le propriétaire : il juge au réveil.

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
