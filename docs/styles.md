# Styles visuels : catalogue fermé

> **Ancien circuit.** Depuis le 2026-11-11 les vidéos suivent le modèle « un film et ses shorts » (`docs/model.md`), qui n'a qu'un
> aspect : un clip filmé et des silhouettes dessinées (skill `new-scene`). Ce catalogue vaut pour les épisodes publiés avant.

Décidé par le propriétaire le 2026-11-09, sur la planche des quatre styles (`video/src/styles/`, composition
`StyleLab`) : le style d'un épisode suit son format. Le propriétaire trouvait le rendu limité et répété :
mêmes trois personnages, salle d'attente et rue dans les 9 premiers épisodes, une carte de texte une scène sur
deux. Les fiches reprennent le modèle des styles de lemo-opuscar (idées, pas de code) : ce que le style est et
n'est pas, matières, couleurs, texte, mouvement, caméra, gestes propres, pièges.

Comme les formats, les personnages et les fonds, un style n'entre ici que validé par le propriétaire. Noté dans
l'épisode (`style:` de `content/episodes/<thème>.yaml`), choisi avec le format (skill `choose-format`) ;
`scripts/validate.py` signale un style qui ne correspond pas au format.

| Format (`docs/formats.md`) | Style | Pourquoi |
|---|---|---|
| `story-suspense`, `story-linear` | `paper` | des lieux, de la lumière et de la profondeur ; les prophètes ne sont jamais dessinés, les lieux portent l'histoire |
| `misconceptions` | `chalk` | l'idée fausse écrite, effacée, la juste écrite à la même place |
| `collection`, `text-explained` | `illumination` | le texte au centre, cadré comme une page de manuscrit |
| `practical`, `two-paths` | `flat` | le style des neuf premiers épisodes (Open Peeps), en attendant mieux |
| (en réserve) | `watercolor` | le plus faible des quatre dans la caverne ; à reprendre pour le quotidien |

## Ce qui ne change jamais

- **La carte du verset** : texte uthmani en Amiri Quran, tel que publié, même mise en page (texte, puis
  référence par le nom de la sourate et récitateur), mot récité surligné. Seule la matière du cadre suit le style
  (papier, ardoise, or), jamais la lecture du texte.
- **La carte du hadith** : paroles du Prophète ﷺ entre « », référence, jugement, lecteur.
- **La signature** « @quran_words_daily » (« @quran.words.daily » sur la version TikTok de chaque vidéo 9:16),
  les **sous-titres** anglais (Lora sur fond sombre), les zones sûres.
- **Les règles de `CLAUDE.md`** : aucun prophète, Compagnon ou personne connue dessiné (carte de nom), les
  jeunes de la caverne jamais montrés, exemples présentés comme des scènes types.
- **Une scène est décrite une seule fois** (`video/src/styles/geometry.ts` : des couches de formes simples) ; le
  style décide de son aspect. Un lieu nouveau s'ajoute au catalogue des fonds et se valide comme les autres.

## Lanterne de papier découpé (`paper`)

- **Ce qu'il est** : des feuilles de papier découpé empilées dans une boîte peu profonde, éclairées par derrière.
  Chaque couche a une couleur à plat ; les couches du fond sont claires et chaudes, celles de devant presque
  noires : cette échelle de valeurs fait la profondeur. Ce qui est ouvert (fenêtre, bouche de la caverne,
  lanterne) laisse passer la lumière.
- **Ce qu'il n'est pas** : ni dégradés peints, ni contours au trait, ni visages. Les personnes sont des
  silhouettes, reconnaissables à leur contour (barbe courte d'Amir, hijab de Salma) ; l'émotion passe par la
  posture.
- **Matières** : fibre fine du papier, liseré de lumière sur le bord haut de chaque feuille, bande sombre en bas,
  ombre douce portée sur les feuilles de derrière, halo qui déborde un peu d'une ouverture.
- **Couleurs** : ocres, oranges, bruns chauds (lumière de lampe) ; **une seule couleur d'accent** pour la
  personne qu'on suit (sarcelle) et une pour un détail (rouge du tapis).
- **Texte** : la phrase est découpée dans une bande de papier sombre, la lumière passe à travers (lettres
  claires et chaudes). Ruqaa (Aref Ruqaa) ou Amiri gras.
- **Mouvement et caméra** : la caméra glisse lentement entre les couches (parallaxe), poussée lente vers
  l'avant ; la lumière respire ; poussière dans un rayon. Jamais de mouvement brusque.
- **Gestes propres** : la lumière qui traverse une découpe ; une couche qui s'écarte pour révéler la suivante.
- **Pièges** : tout devient brun et boueux si les couches sont trop proches en valeur ; un halo trop fort délave
  ce qui est devant l'ouverture ; un grain de papier trop fort fait des taches.
- **Coût du rendu** : environ quatre fois le style plat sur un runner sans carte graphique (0,13 à 0,17 s par
  image, contre 0,04 ; mesuré sur la caverne, run 30) : 2 h pour un épisode de neuf minutes dans les deux
  formats et ses reels tant que tout était rendu à la suite (46 min pour le 16:9, 36 pour le 9:16, 36 pour
  les reels). Depuis le 2026-11-09 le workflow `render` fait ces trois rendus côte à côte : le plus long
  donne la durée, 50 min environ attendues pour la caverne (calcul, pas encore mesuré en papier ; 300 min au
  plus par rendu). Le grain est une seule texture (`public/textures/paper-grain.jpg`),
  chaque feuille un plan déplacé en CSS. À faire : dessiner une fois les décors de chaque scène (image) puis
  les déplacer, pour revenir près du style plat.

## Tableau à la craie (`chalk`)

- **Ce qu'il est** : un tableau vert sombre dans un cadre de bois ; tout est dessiné à la craie : un seul trait
  autour de chaque chose, bords irréguliers, manques où la craie a sauté, hachures légères au lieu des aplats.
- **Couleurs** : craie blanche ; jaune pour la personne qu'on suit et le mot clé, rose pour un détail, bleu pour
  le ciel et la lumière. Rien d'autre.
- **Personnages** : ceux du catalogue (Open Peeps) tracés à la craie, avec leur visage et leur humeur.
- **Texte** : en ruqaa, l'écriture à la main des Égyptiens (Aref Ruqaa), écrit de droite à gauche au rythme de
  la voix ; le mot clé souligné en jaune.
- **Gestes propres** : écrire, effacer d'un geste, réécrire au même endroit (l'idée fausse, puis la juste) ; le
  dessin qui apparaît trait par trait.
- **Pièges** : traits trop fins illisibles sur téléphone ; trop de hachures ; un tableau trop propre (garder les
  traces d'effacement).
- **Construit le 2026-11-10** (`video/src/styles/chalk/`), pas encore vu par le propriétaire dans un épisode :
  les lieux en couches tracés d'un trait autour de chaque chose, qui apparaissent du fond vers l'avant en 0,6 s
  puis restent ; les figures Open Peeps tracées à la craie (jaune pour Amir et Salma, blanc sinon), à l'échelle
  du lieu, caméra rapprochée vers elles, bouche qui s'ouvre avec la voix ; la narration en ruqaa écrite de
  droite à gauche phrase par phrase, l'idée fausse (`misconception`) barrée en rose puis effacée (son
  fantôme reste au tableau), la dernière phrase d'une leçon ou d'une conclusion en jaune, soulignée ; les
  lettres moins trouées que les traits (lisibles sur téléphone) ; verset et hadith dans un cadre tracé, le
  texte net ; miniature : le sujet en jaune, le plus grand. Lieux : ceux des idées reçues (salle d'attente,
  rue, mosquée, fond nu) et du quotidien en couches (bureau, chambre, café, caverne, ville ancienne).
- **Coût du rendu** : 1,4 fois le plat (tawba-03 : 96 s contre 69 s pour 1 280 images, même machine, l'un
  après l'autre ; 0,075 s par image) ; MP4 trois fois plus lourd (le grain du tableau), 14 Mo pour 43 s.

## Enluminure (`illumination`)

- **Ce qu'il est** : une page de manuscrit : parchemin, cadre or et lapis d'étoiles à huit branches, la scène
  dans un arc brisé, peinte à plat en couleurs vives (lapis, turquoise, vermillon, malachite, ocre), fin contour
  à l'encre, murs et sols ornés de motifs, rochers aux roses et lilas des manuscrits peints.
- **Texte** : en naskh (Amiri) dans un cartouche doré.
- **Gestes propres** : une rosace géométrique qui se trace ; un reflet de lumière qui passe sur l'or.
- **Pièges** : le cadre prend de la place sur un écran vertical (laisser la scène respirer) ; trop de motifs
  fatiguent : un épisode entier en cadre plein lasse vite, d'où les formats où le texte est au centre.
- **Construit le 2026-11-10** (`video/src/styles/illumination/`), pas encore vu par le propriétaire dans un
  épisode : la page de parchemin et sa bordure d'étoiles, une rosace qui se trace derrière chaque carte, un
  reflet qui passe sur l'or ; le verset et le hadith sur un folio ivoire à cadre d'or et de lapis, le mot
  récité en **vermillon** (la rubrique des manuscrits), le texte net ; la narration dans un cartouche doré
  qui s'ouvre à chaque phrase quand la voix l'atteint ; les lieux en couches peints à plat dans un arc
  brisé, cerne d'encre, murs à motifs ; les personnes en silhouettes sans visage (ivoire cerné d'or pour Amir
  et Salma) ; miniature : le sujet dans le cartouche, le plus grand. Pas de narrateur en buste dans ce style
  (les silhouettes n'ont pas cette pose : `validate.py` le refuse).
- **Coût du rendu** : 1,7 fois le plat (tawba-03 : 115 s contre 69 s, 0,09 s par image), 9 Mo pour 43 s.

## Comment un style est construit

- **Plat** et **papier** sont câblés à la main dans les cartes (`video/src/templates/cards.tsx`,
  `Video.tsx`). Les styles suivants sont chacun un **kit** (`video/src/styles/kit.ts`, inscrit dans
  `kits.ts`) : son fond derrière les cartes (`Backdrop`), sa scène (`Scene` : un lieu et ses
  personnages), le cadre d'un verset, d'un hadith ou d'un nom (`Panel`, et les couleurs `ink` ; le texte
  lui-même est dessiné par `cards.tsx`, jamais filtré ni déformé), sa façon d'écrire la narration
  (`Title`, chaque phrase quand la voix y arrive) et sa miniature (`Thumb`).
- **Un lieu est décrit une fois** en couches de formes simples (`video/src/styles/paper/places.ts`) ; papier,
  craie et enluminure dessinent ces mêmes couches chacun à sa manière. Le catalogue
  (`content/backgrounds.yaml`, `styles`) dit dans quels styles un lieu a été regardé, et le propriétaire
  valide le dessin style par style (`<style>_validated_by`, écrit par `finalize.py validate` après le
  rendu candidat).
- **Les personnes** : figures Open Peeps avec leur visage (plat, craie) ou silhouettes sans visage
  (papier, enluminure : `paper_poses` de `content/characters.yaml`).
- **Voir un reel dans un autre style** sans toucher à son épisode : la prop `style` des compositions
  (`--props='{…,"style":"chalk"}'`), pour un aperçu seulement, jamais un rendu de publication. Procédure
  complète : `docs/legacy/skills/add-style.md`.

Planche de comparaison, le même reel (tawba-03) aux mêmes instants en plat, craie et enluminure :
`docs/styles-tawba-03.png`.

## Propositions de visuels (2026-11-10, le propriétaire en a demandé ; rien n'est décidé)

Le défaut mesuré sur les vidéos publiées n'est pas le style : sur 480 scènes, 27 % sont dessinées et 48 %
sont une carte qui affiche la phrase que dit la voix ; l'image ne change pas pendant 60 à 83 % d'un reel.
La caverne en papier a exactement la même part (27 %). Un nouveau style habille ce défaut, il ne le corrige
pas. Par ordre de ce que chacune rapporte :

1. **La phrase écrite dans la scène.** La ligne arabe s'écrit dans le décor (sur le tableau en craie, sur
   une bande de papier, dans un cartouche) au-dessus des personnages, au lieu d'occuper une carte à elle
   seule. Chaque carte de narration peut alors devenir une scène dessinée sans perdre le texte arabe pour
   ceux qui regardent sans le son. C'est le plus gros levier : la part dessinée passerait de 27 % à
   environ 70 % sans une ligne de script en plus.
2. **Changer de cadre dans une scène** (`shot: wide | close | detail`) : même lieu, mais on coupe sur le
   visage à la phrase qui touche, ou sur les mains. L'image change toutes les 3 à 5 s sans nouveau dessin.
3. **Des objets en gros plan** (petit catalogue fermé : un téléphone et sa notification, un tapis de
   prière, une horloge, une porte, une chaise vide, une lettre) : des accroches et des exemples de vie qui
   ne montrent pas encore les trois mêmes personnes.
4. **Le verset qui s'écrit mot à mot, sur plusieurs écrans quand il est long** (la règle de quran-reels) :
   corrige les textes trop petits (6 versets sur 82 sous 50 px, la moitié des hadiths) et anime le plus
   long plan fixe d'un reel (jusqu'à 16 s).
5. **Chiffres et tracés** : un nombre qui s'affiche en grand (« ٣٠٩ »), un chemin à deux branches (deux
   chemins), le trajet d'une histoire sur une carte (Dhul-Qarnayn : le couchant, le levant, le barrage).
6. **Plus de monde et plus d'humeurs** : une apparence Open Peeps pour Youssef, Hoda et Karim (aujourd'hui
   en silhouette seulement), une femme âgée, un adolescent ; des humeurs `surprised`, `sad`, `relieved`
   (sur 100 apparitions, 95 sont les trois mêmes personnes et une sur deux est `worried`).
7. **L'aquarelle pour le quotidien** (formats pratique et deux chemins, aujourd'hui en plat « en attendant
   mieux ») : le style en réserve ci-dessous.

Ma recommandation : 1 et 2 d'abord (ils changent ce qu'on regarde dans tous les styles), puis 4. Les
autres au fil des épisodes qui en ont besoin.

## Aquarelle (`watercolor`, en réserve)

- Trait d'encre fin, lavis transparents posés un peu à côté du trait, bords plus foncés, papier laissé blanc
  là où est la lumière. Doux et quotidien ; faible pour les lieux sombres (la caverne).
