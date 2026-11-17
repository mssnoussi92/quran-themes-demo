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
