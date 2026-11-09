# Styles visuels : catalogue fermé

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
- **La signature** « @quran_words_daily », les **sous-titres** anglais (Lora sur fond sombre), les zones sûres.
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
- **Coût du rendu** : environ six fois le style plat sur un runner sans carte graphique (0,24 s par image,
  contre 0,04) : 3 h 30 environ pour un épisode de neuf minutes dans les deux formats et ses reels (limite du
  workflow `render` relevée à 330 min). Le grain est une seule texture (`public/textures/paper-grain.jpg`),
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

## Enluminure (`illumination`)

- **Ce qu'il est** : une page de manuscrit : parchemin, cadre or et lapis d'étoiles à huit branches, la scène
  dans un arc brisé, peinte à plat en couleurs vives (lapis, turquoise, vermillon, malachite, ocre), fin contour
  à l'encre, murs et sols ornés de motifs, rochers aux roses et lilas des manuscrits peints.
- **Texte** : en naskh (Amiri) dans un cartouche doré.
- **Gestes propres** : une rosace géométrique qui se trace ; un reflet de lumière qui passe sur l'or.
- **Pièges** : le cadre prend de la place sur un écran vertical (laisser la scène respirer) ; trop de motifs
  fatiguent : un épisode entier en cadre plein lasse vite, d'où les formats où le texte est au centre.

## Aquarelle (`watercolor`, en réserve)

- Trait d'encre fin, lavis transparents posés un peu à côté du trait, bords plus foncés, papier laissé blanc
  là où est la lumière. Doux et quotidien ; faible pour les lieux sombres (la caverne).
