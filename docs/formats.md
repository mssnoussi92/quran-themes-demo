# Formats d'épisode : catalogue fermé

> **Depuis le 2026-11-11**, chaque sujet devient un film et ses shorts (`docs/model.md`). Les formats disent encore le genre
> de sujet et ses parties (« reel » se lit « short ») ; ils ne choisissent plus de style, et seul le format histoire est
> éprouvé dans le modèle (skill `choose-format`). Les contrôles de `validate.py` cités ici portent sur l'ancien circuit.

Décidé par le propriétaire le 2026-11-08 : chaque épisode suit un format de ce catalogue, choisi avant d'écrire
(skill `choose-format`), noté dans l'épisode (`format:` de `content/episodes/<thème>.yaml`) et dans
`docs/themes.md`. Comme les personnages et les fonds, un format nouveau n'entre ici que validé par le
propriétaire. `scripts/validate.py` vérifie la structure de chaque format dans les reels pas encore validés
(avertissements) ; un reel validé reste tel que le propriétaire l'a approuvé.

## Règles communes

- **La qualité avant la durée** (décision du propriétaire, 2026-11-08) : aucune durée imposée à un reel ; il dure
  ce que son contenu demande (Dhul-Qarnayn ne tenait pas en 90 s). Seule limite dure, celle des plateformes :
  **3 min sur Instagram** (Facebook n'a plus de limite depuis juin 2025, TikTok va bien au-delà). Un reel de
  plus de 90 s peut recevoir **une relance au milieu** : une question d'un mot sur une carte (« وبعدين؟ »,
  « ليه؟ ») qui relance l'attention ; elle s'ajoute, elle ne coupe rien. Le propriétaire juge sur pièce, et les
  statistiques des vidéos publiées (temps de visionnage moyen, courbe de rétention) disent si ça tient.
- **Varier** : jamais le même format trois épisodes de suite (cinq épisodes « idées fausses » de suite ont donné
  la même structure et la même miniature).
- **Rôles des scènes** (schéma) : `hook`, `promise`, `misconception`, `event` (ce qui s'est passé, raconté en
  égyptien au plus près des mots du texte), `evidence` (verset, hadith, leur introduction, une explication du
  texte), `lesson` (la leçon tirée, notre propre ligne, que le propriétaire vérifie d'abord), `example` (une
  scène type d'aujourd'hui, « زي لما… », jamais présentée comme vraie), `conclusion`, `outro`.
- **Vérifié par `validate.py`** dans tous les formats : chaque `event` est suivi de son verset récité ou de son
  hadith (carte) avant la leçon ; chaque `lesson` est suivie d'un `example` (règles du propriétaire,
  2026-11-08) ; le premier reel a une promesse (`promise`) ; le dernier une conclusion.
- Les règles de `CLAUDE.md` valent partout : citations par id, jamais de synthèse vocale sur le Coran, jamais
  un prophète, un Compagnon ou une personne connue dessinés, exemples honnêtes, aucun chiffre sans source.

## 1. Idées fausses (`misconceptions`)

- **Quand** : un état intérieur ou une vertu que les gens comprennent mal, avec au moins trois idées fausses
  vraiment répandues, chacune réfutée par une source de la politique.
- **Reels** : 1, l'accroche et la promesse (« ٣ أفكار غلط… تابعنا عشان تعرف أولها ») ; 2 à 4, une idée fausse
  chacun : scène miroir, le narrateur (« أول فكرة غلط… »), la carte de l'idée fausse, la preuve (verset,
  hadith), la phrase à retenir (`lesson`), **un exemple de vie** (`example`, ajouté le 2026-11-08, comme dans
  les histoires), l'appel à suivre ; 5, verset de conclusion, récapitulatif, retour à l'accroche.
- **Accroche** : miroir, contraste, ancre sourcée, promesse chiffrée (skill `write-hook`).
- **Faits** : `dua`, `sabr`, `tawba`, `muqarana`, `tawakkul` (avant l'exemple de vie), reels de 0:41 à 1:09.
- **Vérifié** : chaque reel du milieu a une idée fausse (`misconception`), une leçon et son exemple.
- **Pièges** : une idée fausse inventée pour remplir trois cases ; réfuter avec la preuve d'un épisode
  précédent ; une question de fiqh (validité d'une prière…) tranchée par nous : on cite le texte, sans statuer.

## 2. Histoire avec suspense (`story-suspense`)

- **Quand** : une histoire du Coran (ou racontée par le Prophète ﷺ) qui **cache un secret révélé plus tard** :
  l'épisode entier montre d'abord les événements, puis leur secret.
- **Reels** : chacun tient seul, dans l'ordre du texte : les événements racontés (`event`) puis leurs versets
  récités (« قال ربنا سبحانه وتعالى: »), l'explication du texte, la leçon, l'exemple de vie, l'appel à suivre ;
  le dernier, la conclusion. **Épisode entier** : son propre ordre (`whole`, une partie par chapitre YouTube),
  validé à part (`whole.validated_by`).
- **Accroche** : une situation de vie que l'histoire éclaire (« حصلك حاجة… ومش فاهم ليه؟ »), « في سورة الكهف… »,
  puis une promesse de regard nouveau (« قصة… هتخليك تبص لكل ابتلاء… بعين تانية »).
- **Fait** : `khidr` (reels de 1:25 à 2:00, épisode 9:04).
- **Vérifié** : `whole` présent ; un événement dans chaque reel sauf le dernier, une leçon dans ceux du milieu.
- **Pièges** : le suspense coûte une validation de plus, à garder pour un vrai secret ; ne dire que ce que dit le
  texte (pas de noms ni d'époques venus d'ailleurs) ; la violence dite sobrement, jamais montrée.

## 3. Histoire racontée dans l'ordre (`story-linear`)

- **Quand** : une histoire sans secret à garder ; l'épisode entier enchaîne les reels.
- **Reels** : comme `story-suspense`, sans ordre propre à l'épisode entier.
- **Fait** : `qarnayn` (reels de 1:14 à 2:12, épisode 7:38). Exception validée par le propriétaire : la leçon
  du levant (qarnayn-02) n'a pas d'exemple.
- **Vérifié** : un événement dans chaque reel sauf le dernier, une leçon dans ceux du milieu.
- **Pièges** : une histoire trop courte (moins de 2 min de récitation) ne remplit pas cinq reels : collection.

## 4. Collection (`collection`)

- **Quand** : plusieurs moments courts du Coran ou de la Sunna, reliés par un vrai fil, chacun trop court pour
  un épisode (Younous : 1,5 min de récitation).
- **Reels** : **chacun tient seul**, avec sa propre accroche : la situation racontée (`event`), le verset (la
  du'a), la réponse de Dieu (« فاستجبنا له »), la leçon, l'exemple de vie. L'épisode entier les enchaîne, avec
  une courte introduction et une conclusion s'il le faut.
- **Accroche** : à chaque reel, la situation de vie (« لما تحس إنك في الضلمة… »), puis qui a vécu ce moment.
- **Exemple** : « دعوات في الشدة » (proposé, `docs/themes.md`).
- **Vérifié** : chaque reel commence par son accroche et a un événement prouvé, une leçon et son exemple.
- **Pièges** : une liste sans fil ; un verset déjà cité ailleurs repris sans le dire (21:83 est dans le du'a).

## 5. Un texte expliqué (`text-explained`)

- **Quand** : un seul hadith (ou un verset long) porte tout le thème, phrase après phrase.
- **Reels** : 1, l'accroche et le texte entier (lu par un vrai lecteur s'il existe) ; puis une phrase par reel :
  la phrase (extrait du registre, `excerpt_ar`, déjà géré), son sens apparent, la leçon, l'exemple de vie ;
  le dernier, le texte entier à nouveau et la conclusion.
- **Exemple** : Tirmidhi 2516, « احفظ الله يحفظك… » (al-Albani : Sahih, vérifié dans hadith-api).
- **Vérifié** : chaque reel du milieu a le texte (carte) et une leçon suivie de son exemple.
- **Pièges** : expliquer au-delà du sens apparent : le sens d'un mot ou l'avis d'un savant demande une source de
  tafsir au registre (possible depuis le 2026-11-11 pour un verset : `content/sources/tafsir.yaml`, trois tafsirs
  dans la politique ; pas de charh de hadith) ; nos lignes d'explication sont signalées au propriétaire.
- **Dans le modèle** : la série « آية وحكايتها » (`docs/themes.md`) en est la forme courte : un verset, son récit de
  révélation, son sens d'après un tafsir nommé, un short qui tient seul.

## 6. Deux chemins (`two-paths`)

- **Quand** : deux personnes reçoivent le même bienfait ou la même épreuve et répondent à l'opposé, les deux
  dans les textes.
- **Reels** : 1, l'accroche et la promesse ; puis, dans chaque reel, le chemin A (événement et verset), le
  chemin B (événement et verset), la différence en un mot, la leçon, l'exemple de vie ; le dernier, la
  conclusion.
- **Exemple** : la gratitude (الشكر) : Soulayman (« هذا من فضل ربي ليبلوني أأشكر أم أكفر ») et Qaroun
  (« إنما أوتيته على علم عندي »), proposé dans `docs/themes.md`.
- **Vérifié** : chaque reel du milieu a deux événements, chacun prouvé, et une leçon suivie de son exemple.
- **Pièges** : caricaturer quelqu'un au-delà de ce que dit le texte ; un chemin sans source ; un spectateur qui
  ne se reconnaît que dans le bon chemin (le miroir doit le placer devant le choix).

## 7. Pratique (`practical`)

- **Quand** : un acte qu'on veut mieux faire (les adhkar du matin et du soir, les bonnes manières du du'a) :
  des étapes, chacune avec sa source.
- **Reels** : 1, le problème dans une scène type et la promesse (« ٣ حاجات… ») ; une étape par reel : le
  problème, la source, comment le faire aujourd'hui (`lesson`), l'exemple de vie ; le dernier, le
  récapitulatif.
- **Vérifié** : chaque reel du milieu a un verset ou un hadith et une leçon suivie de son exemple.
- **Pièges** : donner un avis de fiqh ; une étape sans texte (« conseil » de développement personnel).

## Proposés le 2026-11-10 (le propriétaire a demandé d'autres styles de script ; rien n'est décidé)

- **Une question, un reel** (`question`) : une question que les gens posent vraiment (« ليه دعائي ما
  اتستجابش؟ », « أصلي وأنا مش مركز… تتقبل؟ »), dite par un personnage dans une scène, puis la réponse en
  un verset et un hadith, une phrase à retenir, c'est tout. **Un seul reel de 45 à 75 s, sans épisode** :
  ni promesse, ni suite, ni version 16:9. Pourquoi : c'est le seul format qui tient un rythme
  hebdomadaire (un épisode de cinq reels demande 40 à 70 prises de voix), et la question est l'accroche.
  Piège : répondre par un avis ; la réponse est le texte, ou le format ne s'applique pas.
- **Dialogue** (`dialogue`) : deux personnages du catalogue se parlent dans un lieu (l'un doute, l'autre
  répond par la source) au lieu d'un narrateur face caméra. Pourquoi : chaque réplique est une scène
  dessinée avec deux personnes (la part de cartes de texte tombe d'elle-même), et l'égyptien parlé y est
  chez lui. Il faut une **seconde voix** (VoiceTut en a d'autres : à choisir à l'oreille, workflow
  `voice-test`) et la règle « bouche au volume » par personnage. Piège : faire dire un verset à un
  personnage (jamais : le verset reste récité, sur sa carte) ; un personnage qui « sait tout » et sermonne.
- **Série courte datée** (`season`) : un reel par jour sur une période (les dix jours de Dhul-Hijja, la
  dernière décade de Ramadan), chacun un acte et sa source. Ce n'est pas un nouveau schéma (c'est
  `practical` ou `collection`) mais un **calendrier** : à préparer un mois avant, d'un seul rendu.

Ma recommandation : `question` d'abord (le plus léger, et il nourrit la page entre deux épisodes), puis
`dialogue` sur un épisode d'essai. Les deux formats « plus tard » ci-dessous restent les plus riches, mais
bloqués par leur prérequis.

## Plus tard (pas encore au catalogue)

- **Un nom d'Allah**, **un mot du Coran** : il faut d'abord un type de source « tafsir » au registre, pour que le
  sens d'un mot vienne toujours d'un livre publié, jamais de l'IA.
