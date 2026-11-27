# معاك 5 ثواني · You have 5 seconds

**Script pilote validé par le propriétaire le 2026-11-17** (questions à choix nommant chaque partie) : shorts 1 et 2,
« je valide, mais si on peut, on spécifie le prénom du fils d'Adam » ; short 3, « garder « الاتنين », je valide son
script » ; le nom « معاك 5 ثواني » ; la durée, « environ 40 s, comme écrit ». Lu ainsi : les trois scripts validés tels
qu'ici, avec le prénom qu'il a demandé, **هابيل**, écrit dans le choix et dit dans la réplique du short 3 (d'après
al-Muyassar sur 5:28, le verset récité : « وقال هابيلُ واعظًا أخاه » ; sur 5:27 il nomme les deux frères, et Ibn Kathir
donne ces noms comme ceux que rapportent beaucoup de prédécesseurs ; le Coran ne nomme pas les deux frères). Aucune voix n'est encore faite.

Proposé par la session le même jour. Le sujet a été choisi par le propriétaire le même jour, sur les recommandations de la session (fiche :
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
mot pour mot dans les deux versets. Une question sur 59:16 seul serait fausse si « هابيل » était un mauvais choix.
Plus court : la huppe (27:22, 14,8 s : « أَحَطتُ بِمَا لَمْ تُحِطْ بِهِۦ », dite par la huppe à Soulayman, al-Muyassar),
environ 0:40, mais sans la leçon. À son choix.

## Short 1 · `sayyara` · «سيارة» في سورة يوسف؟ · A "car" in Surat Yusuf? (titre proposé)

Environ **0:40** · ≈ 0:12 de récitation (12:19, de « وَجَآءَتْ » à « هَـٰذَا غُلَـٰمٌ ۚ », un arrêt marqué).

**L'image** : le désert au soir (clip filmé) ; un puits de pierre, une corde et un seau qui descend ; à l'horizon, une
caravane en silhouette, des chameaux chargés. Personne n'est dessiné.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « سَيَّارَةٌ » (12:19, en or, du registre) · « في سورة يوسف يعني إيه؟ » (sans « … » : la question entière sur la première image)  
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
- Les trois choix : **هابيل ابن سيدنا آدم** · **الشيطان** · **الاتنين**  
  *Abel, son of Adam · Satan · both*  
  Le prénom (demande du propriétaire) : al-Muyassar sur 5:28, référence écrite sous le choix à la réponse.

**Muet · `answer`** (le choc ; « الاتنين » en or ; les deux autres ne sont pas barrés, ils s'allument aussi : chacun
est la moitié de la réponse ; écrit dessous : « الاتنين قالوها… بنفس الكلام » · *Both said it… in the very same words*)

**verset 5:28, récité** (image : le verset à droite, sa référence ; « إِنِّىٓ أَخَافُ ٱللَّهَ رَبَّ ٱلْعَـٰلَمِينَ » en or
quand il est récité)

**verset 59:16, récité** (image : le verset à gauche ; la même phrase en or)

**narration · `meaning`** (les deux versets restent face à face ; la référence écrite sous chaque réplique)
- هابيل ابن سيدنا آدم… أخوه هدده بالقتل… وما مدّش إيده عليه… عشان بيخاف من ربنا.  
  *Abel, son of Adam… his brother threatened to kill him… he didn't raise his hand… because he feared God.* · al-Muyassar sur 5:28 (le prénom : « وقال هابيلُ واعظًا أخاه ») ; Ibn Kathir et as-Sa'di sur 5:28
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
- **Les sources** : 12:19, 5:118, 5:28, 59:16 (versets) ; les morceaux écrits de 39:53 et 2:127 ; neuf passages de tafsir
  (al-Muyassar 12:19, 5:28, 59:16 ; as-Sa'di 12:19, 5:118, 5:28, 59:16 ; Ibn Kathir 5:28, 59:16).
- **Les récitations** : la coupe de 12:19 à l'arrêt après « غُلَـٰمٌ », et les temps des mots pour mettre le mot en or.
- **La voix** : trois requêtes, une par short (le palier gratuit en a dix par jour).
- **Le dessin** : seulement pour le short 1 (le puits, le seau, la caravane, une petite voiture dans le choix).

# Shorts 4 à 6 (proposés le 2026-11-17)

**Scripts validés par le propriétaire le 2026-11-17** (questions à choix nommant chaque short ; le 4 « verset coupé » à
« مِنسَأَتَهُۥ »). Puis, sur les brouillons muets, **« je valide, avec 27:27 »** : la récitation de 27:27 au short 6, après
« قال هنتأكد الأول » (une réplique repose sur son tafsir), et le rendu et les clips des trois.

**Demande du propriétaire (2026-11-17)** : « prépare 3 autres quiz sans voix, et demain matin tu envoies les 6 voix ».
Proposés par la session le même jour, **à valider** : rien n'est dit par la voix avant son « je valide ». Un short par
format, comme le pilote ; mêmes règles (skill `write-hook`, « A short of the quiz ») ; sens vérifiés le 2026-11-17 dans
al-Muyassar, as-Sa'di et Ibn Kathir (quran.ai) ; aucun des trois ne porte un statut de fiqh (al-Qurtubi pas nécessaire).
Récitation de Tawfiq As-Sayegh coupée et entendue en entier par Whisper. Durées estimées comme plus haut.

| | Short | Format | Question | Verset | Récitation | Durée estimée |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | `dabba` | A · يعني إيه؟ | « دَآبَّةُ ٱلْأَرْضِ » في سورة سبأ يعني إيه؟ | 34:14 jusqu'à « مِنسَأَتَهُۥ » | 0:14 | ≈ 0:45 |
| 5 | `sabr` | B · كمّلها بإيه؟ | « فَصَبْرٌ جَمِيلٌ … » : قالها سيدنا يعقوب مرتين… المرة التانية كمّلها بإيه؟ | 12:83 | 0:19 | ≈ 0:48 |
| 6 | `hudhud` | C · مين قالها؟ | « أَحَطتُ بِمَا لَمْ تُحِطْ بِهِۦ » مين قالها… ولمين؟ | 27:22 | 0:15 | ≈ 0:44 |

**Le piège de chacun** : 4, la « دابة الأرض » célèbre est celle de la fin des temps (27:82) ; ici, c'est la termite qui
mange la canne de Soulayman. 5, la même phrase est deux fois dans la sourate (12:18 et 12:83) : qui connaît la première
fin choisit la mauvaise ; la seconde fois, le père qui a perdu un fils de plus demande… les trois. 6, on attend le grand
qui parle au petit : c'est la huppe qui le dit au roi prophète ; et al-Khaḍir dit à Moussa une phrase voisine (18:68).

**Nouveau dans le montage** : un mauvais choix qui est un vrai sens ailleurs, ou une vraie parole, n'est pas barré à la
réponse : il pâlit et sa référence s'écrit dessous (« في سورة النمل · 82 », « المرة الأولى · 12:18 »). Seul un choix
sans référence est barré. Une phrase du Coran n'est plus barrée d'un trait.

## Short 4 · `dabba` · «دابة الأرض» في سورة سبأ؟ · "The beast of the earth" in Surat Saba'? (titre proposé)

Environ **0:45** · 0:14 de récitation (34:14, de « فَلَمَّا » à « تَأْكُلُ مِنسَأَتَهُۥ ۖ », un arrêt marqué, comme 12:19 au
short 1). **Le verset entier dure 33,9 s** et mènerait le short à environ 1:05 : sa suite (« فَلَمَّا خَرَّ تَبَيَّنَتِ ٱلْجِنُّ… »)
est dite par la voix, d'après al-Muyassar. À son choix.

**L'image** : un clip du soir ; dessinés dessus, les arcs d'une grande salle en silhouette (les « محاريب » que les jinns
bâtissaient, 34:13) et une canne de bois debout. Au verset, de petits trous la creusent ; au sens, elle se brise et
tombe. Personne n'est dessiné : ni Soulayman, ni les jinns (l'invisible n'est jamais figuré).

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « دَآبَّةُ ٱلْأَرْضِ » (34:14, en or, du registre) · « في سورة سبأ يعني إيه؟ »  
  *"The beast of the earth" in Surat Saba': what does it mean?*
- Les trois choix : **دابة آخر الزمان** · **حشرة بتاكل الخشب** · **دابة للركوب**  
  *the beast of the end of time · an insect that eats wood · a mount to ride*  
  Les deux mauvais sont de vrais sens : la bête qui sortira à la fin des temps, signe de l'Heure (27:82 ; al-Muyassar et
  as-Sa'di sur 27:82) ; la monture, le sens de tous les jours.

**Muet · `answer`** (le choc ; « حشرة بتاكل الخشب » en or ; « دابة آخر الزمان » pâlit, « في سورة النمل · 82 » dessous ;
« دابة للركوب » barré)

**verset 34:14, récité jusqu'à « مِنسَأَتَهُۥ »** (image : la canne se creuse ; « دَآبَّةُ ٱلْأَرْضِ » en or quand il est récité ;
elle tombe à la deuxième réplique)

**narration · `meaning`** (la référence écrite sous chaque réplique)
- الكلمة دي هنا… معناها الأرَضة: حشرة صغيرة بتاكل الخشب.  
  *Here this word… means the termite: a small insect that eats wood.* · al-Muyassar (« الأرَضَةُ تأكل عصاه ») et Ibn Kathir (« دابة الأرض، وهي الأرضة ») sur 34:14
- سيدنا سليمان مات وهو متّكي على عصايته… والجن فضلوا شغالين، فاكرينه عايش… لحد ما الحشرة أكلت العصاية ووقع.  
  *Solomon died leaning on his staff… the jinn kept working, thinking he was alive… until the insect ate the staff and he fell.* · al-Muyassar sur 34:14 (« عصاه التي كان متكئًا عليها، فوقع سليمان على الأرض… ظنًا منهم أنه من الأحياء »)
- والجن اللي ناس كتير فاكرينهم بيعرفوا الغيب… ما عرفوش إنه مات قدامهم.  
  *And the jinn, whom many think know the unseen… didn't know he had died before their eyes.* · al-Muyassar sur 34:14 (« وفي الآية إبطال لاعتقاد بعض الناس أن الجن يعلمون الغيب ») ; as-Sa'di (« فصاروا إذا مروا به وهو متكئ عليها، ظنوه حيا »)

**narration · `close`**
- وإنت… سمعت قبل كده حد بيقول إن الجن بيعرفوا الغيب؟  
  *And you… have you ever heard someone say the jinn know the unseen?* · la question ouverte
- والسؤال الجاي: جملة قالها سيدنا يعقوب مرتين… تفتكر كمّلها بإيه؟ تابعنا.  
  *Next question: a sentence Jacob said twice… how do you think he went on? Follow us.*

Rien n'est dit de la durée (« un an ») : Ibn Kathir la rapporte de récits qu'il dit venus des gens du Livre.

## Short 5 · `sabr` · «فصبر جميل»… المرة التانية؟ · "Beautiful patience"… and the second time? (titre proposé)

Environ **0:48** · 0:19 de récitation (12:83, entier).

**L'image** : un clip filmé, un ciel sombre où une lumière monte doucement à l'horizon à partir de la réponse ; rien de
dessiné. Personne : ni Yaqoub, ni ses fils.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « فَصَبْرٌ جَمِيلٌ … » (12:83, du registre, la suite en blanc) · « قالها سيدنا يعقوب مرتين، المرة التانية كمّلها بإيه؟ » (écrite entière dès la première image : `at_once`, le texte validé n'est pas retouché)  
  *Jacob said it twice… the second time, how did he go on?*
- Les trois choix, trois vraies paroles de Yaqoub (du registre) : **وَٱللَّهُ ٱلْمُسْتَعَانُ عَلَىٰ مَا تَصِفُونَ** (12:18, la
  première fois) · **عَسَى ٱللَّهُ أَن يَأْتِيَنِى بِهِمْ جَمِيعًا** (12:83) · **يَـٰٓأَسَفَىٰ عَلَىٰ يُوسُفَ** (12:84, juste après)  
  Un mauvais choix n'est jamais écrit dans le verset : le blanc ne se remplit qu'avec la bonne suite.

**Muet · `answer`** (le choc ; le blanc se remplit de « عَسَى ٱللَّهُ أَن يَأْتِيَنِى بِهِمْ جَمِيعًا » en or ; les deux autres
pâlissent, leur référence dessous : « المرة الأولى · يوسف 18 », « بعدها · يوسف 84 »)

**verset 12:83, récité** (image : le verset ; la suite en or quand elle est récitée)

**narration · `meaning`** (la référence écrite sous chaque réplique)
- أول مرة قالها لما ضاع يوسف… والتانية لما ضاع أخوه، والكبير فضل في مصر.  
  *The first time he said it when Yusuf was lost… the second when his brother was lost, and the eldest stayed in Egypt.* · al-Muyassar sur 12:18 et 12:83 (« يوسف وشقيقه وأخوهم الكبير المتخلف من أجل أخيه »)
- الوجع زاد… بس رجاه في ربنا كبر: طلب التلاتة.  
  *The pain grew… but his hope in God grew bigger: he asked for all three.* · al-Muyassar (« أبنائي الثلاثة ») et as-Sa'di (« ثم لجأ إلى حصول الفرج لما رأى أن الأمر اشتد ») sur 12:83
- والصبر الجميل… مش إنك ما تزعلش… ده إنك ما تشتكيش غير لربنا.  
  *And beautiful patience… isn't not being sad… it's complaining to no one but God.* · as-Sa'di sur 12:18 (« الشكوى إلى الخالق لا تنافي الصبر الجميل ») et 12:83 (« ولا شكوى للخلق ») ; la tristesse, 12:84 (« وَٱبْيَضَّتْ عَيْنَاهُ مِنَ ٱلْحُزْنِ »), écrite en référence

**narration · `close`**
- وإنت… إيه اللي بيخلّيك تستنى الفرج لما الدنيا تضيق؟  
  *And you… what keeps you waiting for relief when life gets tight?* · la question ouverte
- والسؤال الجاي: جملة قالها حد لملك… تعرف مين؟ تابعنا.  
  *Next question: a sentence someone said to a king… do you know who? Follow us.*

Les noms des frères (Ibn Kathir, as-Sa'di) ne sont pas dits : le Coran ne les donne pas.

## Short 6 · `hudhud` · مين قال الجملة دي… ولمين؟ · Who said this… and to whom? (titre proposé)

Environ **0:44** · 0:15 de récitation (27:22, entier).

**L'image** : un ciel ouvert sur une plaine (clip filmé) ; au verset, la silhouette d'une huppe (sa crête) arrive de
loin et se pose sur une branche. Personne n'est dessiné : ni Soulayman, ni Moussa, ni al-Khaḍir.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « أَحَطتُ بِمَا لَمْ تُحِطْ بِهِۦ » (27:22, du registre) · « مين قالها، ولمين؟ » (de même, `at_once`)  
  *Who said it… and to whom?*
- Les trois choix : **سيدنا سليمان للهدهد** · **الخضر لسيدنا موسى** · **الهدهد لسيدنا سليمان**  
  *Solomon to the hoopoe · al-Khidr to Moses · the hoopoe to Solomon*  
  Soulayman a parlé à la huppe (27:20-21, 27:27-28) ; al-Khaḍir a dit à Moussa « وَكَيْفَ تَصْبِرُ عَلَىٰ مَا لَمْ تُحِطْ بِهِۦ
  خُبْرًا » (18:68), une phrase voisine : le piège est honnête. La phrase elle-même n'est que dans 27:22.

**Muet · `answer`** (le choc ; « الهدهد لسيدنا سليمان » en or ; « الخضر لسيدنا موسى » pâlit, « قال قريب منها · الكهف 68 »
dessous ; « سيدنا سليمان للهدهد » barré)

**verset 27:22, récité** (image : la huppe se pose ; « أَحَطتُ بِمَا لَمْ تُحِطْ بِهِۦ » en or quand il est récité)

**narration · `meaning`** (la référence écrite sous chaque réplique)
- الهدهد… طائر صغير… عرف خبر ما وصلش لسيدنا سليمان ولا لجنوده.  
  *The hoopoe… a small bird… knew news that hadn't reached Solomon or his armies.* · Ibn Kathir (« اطلعت على ما لم تطلع عليه أنت ولا جنودك ») et al-Muyassar sur 27:22
- وسيدنا سليمان ما استصغرهوش… وما صدّقهوش على طول: قال هنتأكد الأول.  
  *And Solomon didn't belittle him… nor believe him at once: he said, we'll check first.* · al-Muyassar sur 27:27 (« سنتأمل فيما جئتنا به من الخبر أصدقت… ») et as-Sa'di (« مثبتا لكمال عقله ورزانته ») ; « ما استصغرهوش », lecture de la session (il l'écoute, puis l'envoie avec sa lettre, 27:28)
- العلم ممكن ييجي من أصغر واحد… بس الخبر يتأكد منه قبل ما يتصدق.  
  *Knowledge can come from the smallest one… but news is checked before it's believed.* · raisonnement de la session, sur as-Sa'di (27:22 : « عندي العلم علم ما أحطت به على علمك الواسع وعلى درجتك فيه » ; 27:27)

**narration · `close`**
- وإنت… مين أصغر منك علّمك حاجة ما كنتش تعرفها؟  
  *And you… who younger than you taught you something you didn't know?* · la question ouverte
- تابعنا عشان السؤال الجاي.  
  *Follow us for the next question.*

## Ce qui est à faire pour 4 à 6 (après la validation)

- **Les sources** : 34:14, 12:83, 12:18, 12:84, 27:22 (versets ; 18:68 est déjà au registre) ; treize passages de tafsir
  (al-Muyassar 34:14, 27:82, 12:83, 27:22, 27:27 ; as-Sa'di 34:14, 12:83, 12:18, 27:22, 27:27 ; Ibn Kathir 34:14, 12:83,
  27:22), proposés au registre le 2026-11-17.
- **Le montage** : la référence sous un mauvais choix (`note`), la canne et les arcs (4), la lumière qui monte (5), la huppe (6).
- **La voix** : trois requêtes, avec les trois du pilote : six le 2026-11-18 sur les dix du palier gratuit.

## Quiz 7 à 13 : la page test `@ma3ak.5.thawani` (du 21 au 27 novembre ; série `ma3ak`)

**Scripts validés par le propriétaire le 2026-11-18** (question à choix : « je valide les 7 scripts » ; le quiz 13 avec
20:39 récité entier, son choix). Proposés par la session le même jour. Fichiers : `content/trial/ma3ak.yaml` et ses
shorts. Montage : l'ordre des choix des quiz 8 et 11 change (la bonne réponse au milieu), et le quiz 13 n'écrit que
« ٱلْيَمِّ » en tête (comme « دَآبَّةُ ٱلْأَرْضِ » du quiz 4).

Ce lot suit ta demande du 2026-11-18 : un quiz par jour sur la page test `@ma3ak.5.thawani`, 7 quiz, les trois formats en
alternance, un dessin pour chacun, et aucun numéro d'épisode. Les règles sont celles du pilote (skill `write-hook`,
« A short of the quiz ») :

- **Chaque mauvais choix est vrai quelque part, ou c'est une idée reçue barrée.** Un choix vrai ailleurs pâlit et sa
  référence s'écrit dessous. Un choix qui n'est qu'une idée reçue est barré.
- **Une seule bonne réponse**, vérifiée dans tout le Coran et dans le contexte.
- **Pas de demande de commentaire.** La fin est une vraie question ouverte.
- **La voix ne dit jamais les mots du Coran de la question**, et ne récite jamais un verset : c'est Tawfiq As-Sayegh qui
  récite.

**Les sources** : chaque sens a été vérifié le 2026-11-18 dans al-Muyassar, as-Sa'di et Ibn Kathir (quran.ai). Leur
référence s'écrit sous chaque réplique. Une réplique qui est un raisonnement de la session, et pas un tafsir, est
signalée. Aucun de ces quiz ne porte une règle de fiqh.

**Les durées** : les récitations de 18:96, 80:27-32 et 2:45 sont mesurées sur les découpes de Tawfiq As-Sayegh de
quran-reels ; les autres sont estimées et seront mesurées à la coupe. Personne n'est dessiné : ni prophète, ni
Compagnon, ni aucune personne d'un récit.

| | Date | Short | Format | Question | Verset récité | Récitation | Durée |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | sam. 21 | `qitr` | A · يعني إيه؟ | « قِطْرًا » في سورة الكهف | 18:96 | 0:21 | ≈ 0:50 |
| 8 | dim. 22 | `marah` | B · كمّلها بإيه؟ | « وَلَا تَمْشِ فِى ٱلْأَرْضِ مَرَحًا… » وصية لقمان | 31:18 | ≈ 0:12 | ≈ 0:42 |
| 9 | lun. 23 | `dhahib` | C · مين قالها؟ | « إِنِّى ذَاهِبٌ إِلَىٰ رَبِّى سَيَهْدِينِ » | 37:97-99 | ≈ 0:14 | ≈ 0:45 |
| 10 | mar. 24 | `abb` | A · يعني إيه؟ | « وَأَبًّا » في سورة عبس | 80:27-32 | 0:20 | ≈ 0:48 |
| 11 | mer. 25 | `khashi` | B · كمّلها بإيه؟ | « وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ… » | 2:45 | 0:09 | ≈ 0:38 |
| 12 | jeu. 26 | `faqir` | C · مين قالها؟ | « رَبِّ إِنِّى لِمَآ أَنزَلْتَ إِلَىَّ مِنْ خَيْرٍ فَقِيرٌ » | 28:24 | ≈ 0:12 | ≈ 0:44 |
| 13 | ven. 27 | `yamm` | A · يعني إيه؟ | « ٱلْيَمِّ » في قصة موسى الرضيع | 20:39 | 0:22 | ≈ 0:57 |

**Le lundi 23**, jour de la paire avec la page principale (son quiz 1, `sayyara`), c'est le quiz 9 qui sort sur la page
test. Je l'ai choisi parce que son piège est le plus fort : on s'attend à Moussa.

---

### 7 · `qitr` · «قطرًا» في سورة الكهف؟ · "Qitran" in Surat al-Kahf? (titre proposé)

**L'image** : deux montagnes ; entre elles, le barrage monte, bloc de fer après bloc de fer. Puis le feu rougit les blocs,
et le cuivre fondu coule dessus, orange. Personne n'est dessiné : ni Dhul-Qarnayn, ni ses ouvriers.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « قِطْرًا » (18:96, en or, du registre) · « في سورة الكهف يعني إيه؟ »  
  *"Qitran" in Surat al-Kahf: what does it mean?*
- Les trois choix : **قطر سكة حديد** · **حديد** · **نحاس مدوّب**  
  *a train · iron · molten copper*  
  « قطر » est le train en égyptien (une idée reçue, barrée). Le fer est dans le même verset (« زُبَرَ ٱلْحَدِيدِ ») : c'est
  le piège honnête.

**Muet · `answer`** (le choc ; « نحاس مدوّب » en or ; « حديد » pâlit, « الحديد كان القطع · نفس الآية » dessous ;
« قطر سكة حديد » barré)

**verset 18:96, récité entier** (image : les blocs, le feu, puis le cuivre qui coule ; « قِطْرًا » en or quand il est récité)

**narration · `meaning`**
- القِطر هنا… نحاس مدوّب.  
  *"Qitr" here… is molten copper.* · al-Muyassar (« أعطوني نحاسًا أفرغه عليه »), as-Sa'di (« نحاسا مذابا »), Ibn Kathir (« هو النحاس، وزاد بعضهم: المذاب »)
- رصّ قطع الحديد بين الجبلين… ولعّها نار… وبعدين صبّ عليها النحاس.  
  *He stacked the pieces of iron between the two mountains… set them ablaze… then poured the copper over them.* · al-Muyassar et as-Sa'di sur 18:96
- الحديد لوحده كان هيفضل قطع جنب بعض… النحاس هو اللي لحمها، وبقت سد واحد.  
  *Iron alone would have stayed pieces side by side… the copper welded them, and they became one barrier.* · as-Sa'di (« الذي يريد أن يلصقه بين زبر الحديد… فاستحكم السد استحكاما هائلا »)

**narration · `close`**
- وإنت… فيه كلمة في القرآن كنت فاكر معناها حاجة… وطلعت حاجة تانية؟  
  *And you… is there a word in the Quran you thought meant one thing… and it turned out to be another?* · la question ouverte (ses réponses peuvent donner les prochains quiz)
- والسؤال الجاي: وصية أب لابنه… تفتكر خلصت بإيه؟ تابعنا.  
  *Next question: a father's advice to his son… how do you think it ended? Follow us.*

---

### 8 · `marah` · وصية لقمان… خلصت بإيه؟ · Luqman's advice… how did it end? (titre proposé)

**L'image** : un long chemin sur une plaine, des pas qui s'y posent un à un, calmement ; au fond, des montagnes immenses.
Personne n'est dessiné : ni Luqman, ni son fils.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « وَلَا تَمْشِ فِى ٱلْأَرْضِ مَرَحًا ۖ … » (31:18, du registre, la suite en blanc) · « في وصية لقمان لابنه… كمّلها بإيه؟ »  
  *In Luqman's advice to his son… how does it go on?*
- Les trois choix, trois vraies fins du Coran (du registre) : **إِنَّ ٱللَّهَ لَا يُحِبُّ كُلَّ مُخْتَالٍ فَخُورٍ** (31:18) ·
  **إِنَّكَ لَن تَخْرِقَ ٱلْأَرْضَ وَلَن تَبْلُغَ ٱلْجِبَالَ طُولًا** (17:37) · **إِنَّ ٱللَّهَ لَا يُحِبُّ ٱلْمُعْتَدِينَ** (2:190)  
  Le piège : la même phrase, « وَلَا تَمْشِ فِى ٱلْأَرْضِ مَرَحًا », est aussi dans al-Isra' (17:37), avec une autre fin.

**Muet · `answer`** (le choc ; le blanc se remplit de la fin de 31:18 en or ; « نفس البداية · الإسراء 37 » et
« البقرة 190 » sous les deux autres, qui pâlissent)

**verset 31:18, récité entier** (image : les pas sur le chemin ; la fin en or quand elle est récitée)

**narration · `meaning`**
- المرح هنا مش الفرح… ده إنك تمشي متكبّر ومتباهي.  
  *"Marah" here isn't joy… it's walking proud and showing off.* · al-Muyassar (« مختالا متبخترًا ») et as-Sa'di (« بطرا، فخرا بالنعم، ناسيا المنعم، معجبا بنفسك ») sur 31:18
- ونفس الجملة جت في سورة الإسراء… بس خلصت بإنك مش هتخرق الأرض، ولا هتطول الجبال.  
  *The same sentence comes in al-Isra'… but it ends: you won't tear the earth, nor reach the mountains in height.* · al-Muyassar sur 17:37
- هناك: إنت صغير قدّام خلق ربنا… وهنا: ربنا ما بيحبش المتكبّر اللي بيتفاخر.  
  *There: you are small before God's creation… here: God does not love the proud boaster.* · as-Sa'di sur 17:37 (« من غير إدراك لبعض ما تروم ») et al-Muyassar sur 31:18 (« إن الله لا يحب كل متكبر متباه ») ; le rapprochement des deux versets est une **lecture de la session**

**narration · `close`**
- وإنت… تعرف حد متواضع بجد؟ إيه اللي بيعمله؟  
  *And you… do you know someone truly humble? What does he do?* · la question ouverte
- والسؤال الجاي: جملة اتقالت وقت رحيل… مين قالها؟ تابعنا.  
  *Next question: a sentence said at a departure… who said it? Follow us.*

---

### 9 · `dhahib` · «إني ذاهب إلى ربي سيهدين»… مين قالها؟ · Who said it? (titre proposé)

**L'image** : une ville au loin ; à côté, les braises d'un très grand feu qui s'éteignent ; une route vers l'aube, et une
seule trace de pas sur elle. Personne n'est dessiné : ni Ibrahim, ni Moussa, ni Nouh.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « إِنِّى ذَاهِبٌ إِلَىٰ رَبِّى سَيَهْدِينِ » (37:99, du registre) · « مين قالها… وإمتى؟ »  
  *Who said it… and when?*
- Les trois choix : **سيدنا إبراهيم وهو سايب بلده** · **سيدنا موسى قدّام البحر** · **سيدنا نوح وهو بيركب السفينة**  
  *Abraham leaving his land · Moses before the sea · Noah boarding the ark*  
  Moussa a dit devant la mer une phrase voisine, « إِنَّ مَعِىَ رَبِّى سَيَهْدِينِ » (26:62) : c'est le piège honnête. Nouh,
  en montant dans l'arche, a dit autre chose (11:41) : ce choix est barré.

**Muet · `answer`** (le choc ; « سيدنا إبراهيم » en or ; « سيدنا موسى » pâlit, « قال قريب منها · الشعراء 62 » dessous ;
« سيدنا نوح » barré)

**versets 37:97-99, récités** (image : les braises, puis la route ; « إِنِّى ذَاهِبٌ إِلَىٰ رَبِّى سَيَهْدِينِ » en or quand il est récité)

**narration · `meaning`**
- قومه بنوا نار كبيرة ورموه فيها… وربنا خلّاها برد وسلام عليه.  
  *His people built a great fire and threw him into it… and God made it cool and safe for him.* · al-Muyassar sur 37:97-98 (« ابنوا له بنيانًا واملؤوه حطبًا… وجعل النار على إبراهيم بردًا وسلامًا ») et as-Sa'di sur 37:98
- وبعدها قرر يسيب بلده: رايح لمكان يعبد فيه ربنا… ومتأكد إن ربنا هيدلّه على الخير.  
  *Then he decided to leave his land: going to a place where he could worship God… sure that God would guide him to good.* · al-Muyassar (« إني مهاجر إلى ربي… فإنه سيدلني على الخير في ديني ودنياي ») et as-Sa'di (« مهاجر إليه، قاصد إلى الأرض المباركة أرض الشام ») sur 37:99
- وسيدنا موسى قال جملة قريبة قدّام البحر… الاتنين ما كانوش شايفين الطريق لسه… وكانوا متأكدين.  
  *And Moses said a close sentence before the sea… neither could see the way yet… and both were sure.* · al-Muyassar sur 26:62 (« سيهديني لما فيه نجاتي ونجاتكم ») ; « ما كانوش شايفين الطريق » est une **lecture de la session**

**narration · `close`**
- وإنت… سبت قبل كده حاجة… وربنا عوّضك بأحسن منها؟  
  *And you… have you ever left something behind… and God gave you better?* · la question ouverte
- والسؤال الجاي: كلمة صغيرة في سورة عبس… ناس كتير فاكرين معناها حاجة تانية. تابعنا.  
  *Next question: a small word in Surat 'Abasa… many think it means something else. Follow us.*

---

### 10 · `abb` · «وأبًّا»… يعني إيه؟ · "Wa abba"… what does it mean? (titre proposé)

**L'image** : la terre s'ouvre et donne, une à une, les plantes du passage : épis, vigne, oliviers, palmiers, jardins
épais, fruits. Au mot « أبًّا », une herbe se répand, et des silhouettes de vaches et de moutons viennent la brouter.
Personne n'est dessiné.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « وَأَبًّا » (80:31, en or, du registre) · « في سورة عبس… يعني إيه؟ »  
  *In Surat 'Abasa… what does it mean?*
- Les trois choix : **الأب (الوالد)** · **نوع فاكهة** · **عشب بتاكله البهايم**  
  *the father · a kind of fruit · grass that cattle eat*  
  Les deux mauvais choix sont des idées reçues : le mot s'écrit comme « أب », et il vient juste après « فاكهة ». Les deux
  sont barrés.

**Muet · `answer`** (le choc ; « عشب بتاكله البهايم » en or ; les deux autres barrés)

**versets 80:27-32, récités** (image : les plantes une à une ; « وَأَبًّا » en or quand il est récité ; les bêtes viennent
brouter au dernier verset)

**narration · `meaning`**
- الأبّ هنا… العشب اللي بتاكله البهايم.  
  *"Abb" here… is the grass that cattle eat.* · as-Sa'di (« الأب: ما تأكله البهائم والأنعام »), Ibn Kathir (d'après Ibn 'Abbas : « ما أنبتت الأرض مما تأكله الدواب ولا يأكله الناس »), al-Muyassar (« وثمارًا وكلأ »)
- الفاكهة ليك… والأبّ لبهايمك.  
  *The fruit is for you… and the "abb" for your cattle.* · Ibn Kathir (d'après Mujahid, al-Hasan et Qatada : « الأب للبهائم كالفاكهة لبني آدم ») et as-Sa'di sur 80:32
- ربنا بيعدّ عليك نعمه في أكلك… لحد أكل بهايمك.  
  *God counts His blessings to you in your food… down to the food of your cattle.* · al-Muyassar (« فليتدبر الإنسان: كيف خلق الله طعامه ») et as-Sa'di (« فمن نظر في هذه النعم أوجب له ذلك شكر ربه ») sur 80:24-32

**narration · `close`**
- وإنت… آخر مرة بصّيت في طبقك وفكّرت هو جه منين؟  
  *And you… when did you last look at your plate and think where it came from?* · la question ouverte
- والسؤال الجاي: آية بتبدأ بنفس الكلام في مكانين… بتخلص إزاي؟ تابعنا.  
  *Next question: a verse that starts the same in two places… how does it end? Follow us.*

Ibn Kathir rapporte aussi qu'Omar se demandait ce qu'est « الأب » ; ce n'est pas dit : le récit n'est pas dans les
recueils de notre politique des hadiths.

---

### 11 · `khashi` · «واستعينوا بالصبر والصلاة»… كمّلها بإيه؟ · How does it go on? (titre proposé)

**L'image** : la pièce de prière de « إزاي أعملها؟ » (la fenêtre, le rayon de lumière, le tapis), reprise ; une
silhouette anonyme sans visage s'y prosterne, comme tu l'as autorisé pour les inconnus.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ … » (2:45, du registre, la suite en blanc) · « أول مرة في سورة البقرة… كمّلها بإيه؟ »  
  *The first time in Surat al-Baqarah… how does it go on?*
- Les trois choix, trois vraies fins du Coran (du registre) : **وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى ٱلْخَـٰشِعِينَ** (2:45) ·
  **إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ** (2:153) · **إِنَّ ٱلْأَرْضَ لِلَّهِ** (7:128)  
  Le piège : la fin la plus connue est celle de 2:153, la deuxième fois dans la même sourate. Et Moussa a dit à son
  peuple « ٱسْتَعِينُوا۟ بِٱللَّهِ وَٱصْبِرُوٓا۟ » (7:128).

**Muet · `answer`** (le choc ; le blanc se remplit de la fin de 2:45 en or ; « المرة التانية · البقرة 153 » et « قالها
موسى لقومه · الأعراف 128 » sous les deux autres, qui pâlissent)

**verset 2:45, récité** (image : la silhouette se prosterne ; la fin en or quand elle est récitée)

**narration · `meaning`**
- الصلاة تقيلة على ناس كتير… إلا اللي قلبه خاشع: عليه خفيفة.  
  *Prayer is heavy for many… except the one whose heart is humble: for him it's light.* · al-Muyassar (« وإنها لشاقة إلا على الخاشعين ») et as-Sa'di (« فإنها سهلة عليهم خفيفة ») sur 2:45
- والخشوع إن قلبك يهدا ويسكن قدّام ربنا.  
  *And humility is your heart calming down and resting before God.* · as-Sa'di sur 2:45 (« خضوع القلب وطمأنينته، وسكونه لله تعالى »)
- وفي نفس السورة… نفس الأمر جه تاني، وخلص بإن ربنا مع اللي بيصبروا.  
  *And in the same surah… the same command comes again, and ends with God being with those who are patient.* · al-Muyassar sur 2:153

**narration · `close`**
- وإنت… إيه اللي بيخلّي الصلاة أخف عليك؟  
  *And you… what makes prayer lighter for you?* · la question ouverte
- والسؤال الجاي: دعوة قالها نبي وهو جعان ولوحده… مين؟ تابعنا.  
  *Next question: a prayer a prophet said, hungry and alone… who? Follow us.*

---

### 12 · `faqir` · مين دعا الدعوة دي؟ · Who made this prayer? (titre proposé)

**L'image** : un puits dans le désert à midi (celui du quiz 1, repris), une grosse pierre à côté ; des moutons qui
boivent ; puis l'ombre d'un arbre seul. Personne n'est dessiné : ni Moussa, ni les deux femmes.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « رَبِّ إِنِّى لِمَآ أَنزَلْتَ إِلَىَّ مِنْ خَيْرٍ فَقِيرٌ » (28:24, du registre) · « مين دعا الدعوة دي… وإمتى؟ »  
  *Who made this prayer… and when?*
- Les trois choix : **سيدنا موسى بعد ما سقى للبنتين** · **سيدنا أيوب في مرضه** · **سيدنا يونس في بطن الحوت**  
  *Moses after watering the two women's flock · Job in his illness · Jonah in the whale's belly*  
  Les deux autres sont de vraies prières de détresse : celle d'Ayyoub (21:83) et celle de Younous (21:87).

**Muet · `answer`** (le choc ; « سيدنا موسى » en or ; « دعاؤه في الأنبياء 83 » et « دعاؤه في الأنبياء 87 » sous les deux
autres, qui pâlissent)

**verset 28:24, récité entier** (image : les moutons boivent, puis l'ombre de l'arbre ; la prière en or quand elle est récitée)

**narration · `meaning`**
- سيدنا موسى كان هربان من فرعون… ماشي من مصر لمدين… جعان ولوحده.  
  *Moses was fleeing Pharaoh… walking from Egypt to Midian… hungry and alone.* · al-Muyassar sur 28:24-25 (« وكان قد اشتد به الجوع » ; « قصصه مع فرعون وقومه… نجوت من القوم الظالمين ») et Ibn Kathir sur 28:24 (d'après Ibn 'Abbas : « سار موسى من مصر إلى مدين »)
- ساعد البنتين وسقى لهم من غير ما يطلب أجر… وبعدين قعد في الضل ودعا.  
  *He helped the two women and watered their flock without asking for a wage… then he sat in the shade and prayed.* · as-Sa'di sur 28:24 (« غير طالب منهما الأجرة… ثم تولى إلى الظل مستريحا »)
- ما طلبش حاجة معيّنة… قال: أنا محتاج لأي خير تبعتهولي… وعلى طول جاله الفرج.  
  *He didn't ask for anything specific… he said: I need any good You send me… and relief came at once.* · al-Muyassar (« إني مفتقر إلى ما تسوقه إليَّ مِن أي خير كان ») et as-Sa'di (« السؤال بالحال أبلغ ») sur 28:24 ; « على طول » : 28:25 et Ibn Kathir (« لما رجعت المرأتان سراعا »)

**narration · `close`**
- وإنت… إيه الدعوة اللي بتقولها لما تحس إنك محتاج؟  
  *And you… what prayer do you say when you feel in need?* · la question ouverte
- والسؤال الجاي: كلمة في قصة سيدنا موسى وهو رضيع… تفتكر معناها إيه؟ تابعنا.  
  *Next question: a word in the story of Moses as a baby… what do you think it means? Follow us.*

---

### 13 · `yamm` · «اليمّ»… يعني إيه؟ · "Al-yamm"… what does it mean? (titre proposé)

**L'image** : un fleuve à l'aube, des roseaux ; une caisse de bois fermée flotte, et le courant la porte vers la rive où
se dresse un palais en silhouette. Personne n'est dessiné : ni la mère de Moussa, ni Pharaon.

**Muet · `ask`** (première image ; 5 s de compteur ; aucune voix)
- Écrit : « فَٱقْذِفِيهِ فِى ٱلْيَمِّ » (20:39, du registre ; « ٱلْيَمِّ » en or) · « هنا يعني إيه؟ »  
  *Here, what does it mean?*
- Les trois choix : **البحر** · **نهر النيل** · **البير**  
  *the sea · the Nile · the well*  
  « اليم » veut dire la mer ailleurs : Pharaon y a été noyé (7:136, al-Muyassar : « في البحر »). C'est le piège honnête.
  Le puits est celui de Youssouf : une idée reçue, barrée.

**Muet · `answer`** (le choc ; « نهر النيل » en or ; « البحر » pâlit, « بمعنى البحر · الأعراف 136 » dessous ; « البير »
barré)

**verset 20:39, récité entier** (21,8 s ; choix du propriétaire, 2026-11-18 ; image : la caisse descend le fleuve).

**narration · `meaning`**
- اليمّ هنا… نهر النيل.  
  *"Al-yamm" here… is the Nile.* · al-Muyassar (« ثم اطرحيه في النيل ») et as-Sa'di (« في اليم، أي: شط نيل مصر ») sur 20:39
- أم موسى حطّته في صندوق ورمته في النيل… والنيل هو اللي ودّاه لحد قصر فرعون.  
  *Moses' mother put him in a box and cast it into the Nile… and the Nile carried him to Pharaoh's palace.* · al-Muyassar sur 20:39 et 28:7, as-Sa'di sur 20:39 (« فأمر الله اليم أن يلقيه في الساحل »)
- ونفس الكلمة في سورة الأعراف معناها البحر… اللي غرق فيه فرعون.  
  *And the same word in Surat al-A'raf means the sea… where Pharaoh drowned.* · al-Muyassar sur 7:136 (« إغراقهم في البحر »)

**narration · `close`**
- وإنت… حصلت لك حاجة كنت خايف منها… وطلعت هي سبب الخير؟  
  *And you… did something you feared happen to you… and turn out to be the cause of good?* · la question ouverte
- تابعنا عشان السؤال الجاي.  
  *Follow us for the next question.*

---

### Ce qui est à faire après ta validation

- **Les sources** : versets 18:96, 31:18, 17:37, 2:190, 37:97-99, 26:62, 11:41, 80:27-32, 2:45, 2:153, 7:128, 28:24,
  21:83, 21:87, 20:39, 7:136 ; les passages de tafsir cités sous les répliques, proposés au registre.
- **Les récitations** de Tawfiq As-Sayegh, coupées et entendues en entier par Whisper : 18:96 ; 31:18 ; 37:97-99 ;
  80:27-32 ; 2:45 ; 28:24 ; 20:39 jusqu'à « لَّهُۥ ».
- **Les clips** : un par quiz, cherchés pour l'image et **montrés à toi avant d'être employés** (des images, un choix).
- **Les dessins** : le barrage et le cuivre ; le chemin et les montagnes ; les braises et la route ; les plantes et les
  bêtes ; la pièce de prière, reprise ; le puits, repris ; le fleuve et la caisse.
- **La voix** : 7 requêtes, une par quiz (sur les 10 du palier gratuit), le jour de ta validation.
- **Les textes** des légendes (titre, accroche, hashtags) : avec les vidéos, à valider.
