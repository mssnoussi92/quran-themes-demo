# معاك ٥ ثواني · You have 5 seconds (nom de travail)

**Script pilote proposé par la session le 2026-11-17, à valider par le propriétaire ; aucune voix avant son « je valide
le script ».** Le sujet a été choisi par le propriétaire le même jour, sur les recommandations de la session (fiche :
`docs/themes.md`, « Série proposée : le quiz ») : **trois formats, un short chacun** (A le sens d'un mot, B la fin d'un
verset, C qui l'a dit), **une question par short, environ 30 s**, **une phrase de voix D pour le sens** (la question
reste écrite et muette), **pas de demande de commentaire** (« اكتب إجابتك… »), une vraie question ouverte à la fin.

Toutes les répliques sont de la session ; celles qui sont un raisonnement de la session, et non un tafsir, sont
signalées. Les versets ne sont désignés que par leur référence : leur texte viendra du registre, ainsi que chaque
morceau de verset écrit à l'écran (le mot de la question, la fin à deviner, les noms proposés). Sens vérifiés le
2026-11-17 dans les tafsirs de la politique (quran.ai : al-Muyassar, as-Sa'di, Ibn Kathir). Récitation de Tawfiq
As-Sayegh mesurée sur mp3quran (read 17). Durées estimées : environ dix lettres par seconde, une demi-seconde à chaque
« … ».

**Ce qui est pareil dans les trois** :

- **La première image est la question** : écrite, avec ses trois choix et le compteur à 5. La voix ne dit ni la question
  ni un mot du verset.
- **Le compteur** : 5 secondes, un tic par seconde (`tools/trial/sfx.py`), les choix qui respirent.
- **La réponse** : un choc à 0, les mauvais choix barrés et pâlis, le bon en or ; puis le récitateur dit le verset, le
  mot (ou la fin) en or quand il le dit.
- **Les choix ne portent pas de lettre** (ni A, ni ١) : rien qui invite à « répondre A » en commentaire. Chaque mauvais
  choix est un vrai sens ou un vrai nom du Coran, jamais une invention : barré à la réponse.
- **La fin** : une question ouverte, écrite et dite, puis le short suivant annoncé et « تابعنا ». Le nom de la page en
  grand dessous.

| | Short | Format | Question | Versets | Récitation | Durée estimée |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `sayyara` | A · يعني إيه؟ | « سَيَّارَةٌ » في سورة يوسف… يعني إيه؟ | 12:19 jusqu'à « هَـٰذَا غُلَـٰمٌ » | ≈ 0:12 | ≈ 0:40 |
| 2 | `khatima` | B · تخلص بإيه؟ | « وَإِن تَغْفِرْ لَهُمْ فَإِنَّكَ أَنتَ… » | 5:118 | 0:16 | ≈ 0:45 |
| 3 | `qalaha` | C · مين قالها؟ | « إِنِّىٓ أَخَافُ ٱللَّهَ رَبَّ ٱلْعَـٰلَمِينَ » | 5:28 et 59:16 | 0:44 | ≈ 1:19 |

**Environ 40 s, pas 30** : la question et sa réponse prennent 7 s, la récitation 12 à 16 s, la voix environ 20 s
(quatre ou cinq répliques courtes). Pour descendre à 30 s, il faudrait couper la voix à une réplique, ou la question
ouverte (qui resterait écrite).

**Le short 3 dépasse la minute** : deux versets entiers (44 s). C'est le prix de sa réponse, « الاتنين » : la phrase est
mot pour mot dans les deux versets. Une question sur 59:16 seul serait fausse si « ابن سيدنا آدم » était un mauvais choix.
Plus court : la huppe (27:22, 14,8 s : « أَحَطتُ بِمَا لَمْ تُحِطْ بِهِۦ », dite par la huppe à Soulayman, al-Muyassar),
environ 0:40, mais sans la leçon. À son choix.

## Short 1 · `sayyara` · «سيارة» في سورة يوسف؟ · A "car" in Surat Yusuf? (titre proposé)

Environ **0:40** · ≈ 0:12 de récitation (12:19, de « وَجَآءَتْ » à « هَـٰذَا غُلَـٰمٌ ۚ », un arrêt marqué).

**L'image** : le désert au soir (clip filmé) ; un puits de pierre, une corde et un seau qui descend ; à l'horizon, une
caravane en silhouette, des chameaux chargés. Personne n'est dessiné.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « سَيَّارَةٌ » (12:19, en or, du registre) · « في سورة يوسف… يعني إيه؟ »  
  *"Sayyara" in Surat Yusuf… what does it mean?*
- Les trois choix : **عربية** (une petite voiture dessinée) · **قافلة مسافرين** · **كوكب سيّار**  
  *a car · a caravan of travellers · a planet*  
  Les deux mauvais sont les sens d'aujourd'hui du mot.

**Muet · `answer`** (le choc ; « عربية » et « كوكب سيّار » barrés ; « قافلة مسافرين » en or)

**verset 12:19, récité jusqu'à « هَـٰذَا غُلَـٰمٌ »** (image : la caravane s'arrête, le seau descend dans le puits ; le
mot en or quand il est récité)

**narration · `meaning`** (image : le mot, son sens écrit dessous ; la référence écrite sous chaque réplique)
- الكلمة دي… معناها: قافلة مسافرين.  
  *This word… means: a caravan of travellers.* · al-Muyassar (« جماعة من المسافرين ») et as-Sa'di (« قافلة تريد مصر ») sur 12:19
- بعتوا حد يجيب لهم مية… فاتعلّق في الدلو سيدنا يوسف عليه السلام.  
  *They sent someone to fetch water… and Yusuf, peace be upon him, held on to the bucket.* · al-Muyassar sur 12:19 (« فأرسلوا مَن يطلب لهم الماء، فلما أرسل دلوه في البئر تعلَّق بها يوسف »)

**narration · `close`** (image : la caravane repart ; le nom de la page)
- وإنت… فيه كلمة كنت فاكر معناها حاجة… وطلعت حاجة تانية؟  
  *And you… is there a word you thought meant one thing… and it turned out to mean another?* · la question ouverte
- والسؤال الجاي: آية… تفتكر خلصت بإيه؟ تابعنا.  
  *Next question: a verse… how do you think it ends? Follow us.*

## Short 2 · `khatima` · تفتكر الآية دي خلصت بإيه؟ · How do you think this verse ends? (titre proposé)

Environ **0:45** · 0:16 de récitation (5:118).

**L'image** : un ciel de nuit qui s'éclaircit lentement (clip filmé), rien d'autre. Le verset est une parole du Jour du
Jugement (5:116-118) : la scène n'est jamais figurée, seulement le texte et la récitation.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « وَإِن تَغْفِرْ لَهُمْ فَإِنَّكَ أَنتَ … » (5:118, du registre, la fin en blanc) · « تفتكر الآية خلصت بإيه؟ »  
  *How do you think the verse ends?*
- Les trois choix, chacun pris dans un verset du registre : **ٱلْغَفُورُ ٱلرَّحِيمُ** (39:53) · **ٱلْعَزِيزُ ٱلْحَكِيمُ**
  (5:118) · **ٱلسَّمِيعُ ٱلْعَلِيمُ** (2:127)  
  Un mauvais choix n'est jamais écrit dans le verset : la fin ne se remplit qu'avec la bonne réponse.

**Muet · `answer`** (le choc ; deux noms barrés ; « ٱلْعَزِيزُ ٱلْحَكِيمُ » en or)

**verset 5:118, récité** (image : le verset entier ; la fin en or quand elle est récitée)

**narration · `meaning`** (la référence écrite sous chaque réplique)
- دي كلمة سيدنا عيسى عليه السلام لربنا… عن الناس.  
  *These are the words of Jesus, peace be upon him, to God… about people.* · le contexte : 5:116 (« وَإِذْ قَالَ ٱللَّهُ يَـٰعِيسَى… »)
- العزيز… بيغفر وهو قادر، مش عن عجز.  
  *The Almighty… forgives with full power, not out of weakness.* · as-Sa'di sur 5:118 (« فمغفرتك صادرة عن تمام عزة وقدرة، لا كمن يغفر ويعفو عن عجز »)
- والحكيم… بيغفر للي عمل أسباب المغفرة.  
  *And the Wise… forgives the one who did what brings forgiveness.* · as-Sa'di sur 5:118 (« أن تغفر لمن أتى بأسباب المغفرة »)

**narration · `close`**
- وإنت… فيه آية خلصت بغير اللي كنت متوقعه؟  
  *And you… is there a verse that ended differently from what you expected?* · la question ouverte
- والسؤال الجاي: جملة في القرآن… مين قالها؟ تابعنا.  
  *Next question: a sentence in the Quran… who said it? Follow us.*

## Short 3 · `qalaha` · مين قال الجملة دي في القرآن؟ · Who said this in the Quran? (titre proposé)

Environ **1:19** · 0:44 de récitation (5:28, 20,4 s ; 59:16, 24,0 s).

**L'image** : un clip filmé sobre (une lumière qui baisse sur une plaine) ; les deux versets face à face, comme dans
« لاحظت الفرق؟ » ; à chaque verset, la même phrase s'allume en or. Personne n'est dessiné : ni les fils d'Adam, ni le
Diable, ni aucune violence.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « إِنِّىٓ أَخَافُ ٱللَّهَ رَبَّ ٱلْعَـٰلَمِينَ » (59:16, du registre) · « مين قالها في القرآن؟ »  
  *Who said this in the Quran?*
- Les trois choix : **ابن سيدنا آدم** · **الشيطان** · **الاتنين**  
  *a son of Adam · Satan · both*

**Muet · `answer`** (le choc ; « الاتنين » en or ; les deux autres ne sont pas barrés, ils s'allument aussi : chacun
est la moitié de la réponse ; écrit dessous : « الاتنين قالوها… بنفس الكلام » · *Both said it… in the very same words*)

**verset 5:28, récité** (image : le verset à droite, sa référence ; « إِنِّىٓ أَخَافُ ٱللَّهَ رَبَّ ٱلْعَـٰلَمِينَ » en or
quand il est récité)

**verset 59:16, récité** (image : le verset à gauche ; la même phrase en or)

**narration · `meaning`** (les deux versets restent face à face ; la référence écrite sous chaque réplique)
- ابن سيدنا آدم… أخوه هدده بالقتل… وما مدّش إيده عليه… عشان بيخاف من ربنا.  
  *A son of Adam… his brother threatened to kill him… he didn't raise his hand… because he feared God.* · Ibn Kathir et as-Sa'di sur 5:28
- والشيطان… قالها بعد ما دعا الإنسان للكفر… واتبرّى منه.  
  *And Satan… said it after calling man to disbelief… and disowning him.* · al-Muyassar et as-Sa'di sur 59:16 ; Ibn Kathir (« تبرأ منه وتنصل »)
- الخوف اللي بجد… بيمنعك قبل الغلط… مش كلمة بتتقال بعده.  
  *Real fear… stops you before the wrong… it isn't a word said after it.* · as-Sa'di sur 5:28 pour la première moitié (« والخائف لله لا يقدم على الذنوب ») ; la seconde, raisonnement de la session

**narration · `close`**
- وإنت… إيه جملة في القرآن فاجئتك لما عرفت مين قالها؟  
  *And you… which sentence in the Quran surprised you when you learned who said it?* · la question ouverte
- تابعنا عشان السؤال الجاي.  
  *Follow us for the next question.*

## Ce qui est nouveau à faire (après la validation)

- **Le montage du quiz** (`video/src/trial/Quiz.tsx`) : la carte de la question, les trois choix, l'anneau du compteur,
  la réponse (barré, or, « les deux »), la fin à remplir (B) ; repris de `Count.tsx` (compteur) et `Farq.tsx` (deux versets
  face à face).
- **Le son** : le tic du compteur et le choc existent (`sfx.py`) ; une ambiance par clip.
- **Les sources** : 12:19, 5:118, 5:28, 59:16 (versets) ; les morceaux écrits de 39:53 et 2:127 ; huit passages de tafsir
  (al-Muyassar 12:19, 59:16 ; as-Sa'di 12:19, 5:118, 5:28, 59:16 ; Ibn Kathir 5:28, 59:16).
- **Les récitations** : la coupe de 12:19 à l'arrêt après « غُلَـٰمٌ », et les temps des mots pour mettre le mot en or.
- **La voix** : trois requêtes, une par short (le palier gratuit en a dix par jour).
- **Le dessin** : seulement pour le short 1 (le puits, le seau, la caravane, une petite voiture dans le choix).
