# Rétention : tout remettre à plat

Proposé le 2026-11-10. **Rien n'est décidé** : le propriétaire tranche point par point (liste à la fin).

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
