# « إزاي أعملها؟ » · pilote : سجود السهو (proposition, 2026-11-17)

**Script validé par le propriétaire le 2026-11-17** (question à choix : « Je valide, sans la ligne-conseil » : les quatre
scripts tels qu'envoyés, sans « اعمل بالمذهب اللي بتتّبعه » dans `khams`) ; **montage validé le même jour** (« je valide sauf je
veux utiliser les numéros 1 2 3 et non pas ١ ٢ ٣ » : tous les nombres que la série dessine s'écrivent 1 2 3) ; **source de
fiqh** : la Encyclopédie koweïtienne, dans la politique de tout le dépôt avec la règle des quatre écoles (son choix).

Script écrit avant toute voix. **Toutes les répliques sont nouvelles et de la session.** Les versets et les hadiths
sont vérifiés (quran.ai pour les textes et les tafsirs, hadith-api pour les numéros), **pas encore inscrits au
registre**. Les avis des écoles viennent de la **الموسوعة الفقهية الكويتية**, vol. 24, p. 234-241 (texte lu sur
turath.io, livre 11430, pagination de l'édition imprimée), une source **hors politique pour l'instant** : à valider
(voir la fiche, `docs/themes.md`). Les durées sont estimées à la main (environ 10 lettres par seconde, une demi-seconde
par « … ») : `tools/trial/script.py` ne lit pas encore une source de fiqh.

Demande du propriétaire (2026-11-17) : une série éducative qui garde un début fort, des scènes, un type de script et un
montage nouveaux, et au moins un short qui dit **comment faire** quand on s'est trompé dans la prière, avec les avis des
écoles quand elles diffèrent.

| | Short | Première image | Durée estimée | Récitation | Écoles |
| --- | --- | --- | --- | --- | --- |
| 1 | `sahun` | « آية بتقول «ويل» للي بيصلّوا! » | 1:20 | 107:4-5 (10,7 s) · 2:286 jusqu'à « أو أخطأنا » (≈ 19 s) | — |
| 2 | `khams` | « صلّى الضهر خمس ركعات! » | 1:20 | 18:110 jusqu'à « واحد » (≈ 14 s) | ajout : où vont les deux prosternations |
| 3 | `nasit` | « قمت من غير ما تقعد للتشهد؟ » | 1:25 | 33:21 (22,8 s) | oubli : où et **comment**, pas à pas |
| 4 | `shakk` | « صلّيت تلاتة ولا أربعة؟ » | 1:25 | 114:4-6 (15,2 s) | doute : sur quoi bâtir |

Images du montage proposé : `docs/retention/sahw-style.jpg` (et une image par short, `sahw-style-*.jpg`).

## Le montage proposé

- **La pièce** : une salle de prière au lever du jour, dessinée par le code (fenêtre en arc, rai de lumière, tapis) :
  aucun clip à chercher, rien à créditer, comme le ciel de nuit de « سنريهم آياتنا ».
- **La silhouette** : une personne anonyme sans visage (règle du 2026-11-15), celle de « بص تاني », qui prie : debout,
  inclinée, prosternée, assise. Elle fait l'erreur dans la première seconde (elle se lève là où elle devait s'asseoir ;
  l'ombre de la position manquée reste en rouge). **Jamais pour le Prophète ﷺ ni pour un Compagnon** : leur prière est
  montrée par la piste seule et par des rangées de lumières.
- **La piste de la prière** (en haut) : une case par rak'ah et par tashahhud, de droite à gauche, jusqu'au salam ; la
  case courante en or. L'erreur : une case barrée en rouge (le tashahhud oublié), une cinquième case rouge (l'ajout), un
  compteur « ٣ / ٤ » qui hésite (le doute). La réparation : deux cases d'or « سجدتين » glissent avant ou après le salam.
- **La carte des quatre écoles** : la piste se divise en quatre lignes, حنفي، مالكي، شافعي، حنبلي, et les deux
  prosternations se posent à leur place dans chacune ; la référence de l'encyclopédie dessous.
- **Le verset** : récité sur la pièce, comme dans le modèle ; le mot récité en or.
- **Le son** : l'ambiance de la pièce (oiseaux du matin) sous la narration, des effets faits par le code (le clic d'une
  case, le glissement des prosternations), jamais sous un verset ni un hadith.

## Short 1 · `sahun` · آية بتقول «ويل» للي بيصلّوا!

**0:00 · narration** (image : `word`, « وَيْلٌ » en or, puis « عَن » souligné et « فِي » barré)
- آية بتقول «ويل» للي بيصلّوا!  
  *A verse says "woe"… to people who pray!*

**0:03 · Verset récité** · Al-Ma'un 107:4-5 · 10,7 s  
  فَوَيْلٌ لِّلْمُصَلِّينَ ٱلَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ

**0:14 · narration** (image : `room`, la silhouette assise, perdue dans ses pensées)
- وأنا بسهى في صلاتي… كل يوم.  
  *And my mind drifts in my prayer… every day.*
- يبقى أنا منهم؟  
  *So am I one of them?*

**0:20 · narration** (image : `letter`) · d'après as-Sa'di sur 107:5 ; Ibn Kathir sur 107:5 (la remarque de 'Ata' ibn Dinar)
- ركّز في كلمة واحدة: «عن» صلاتهم… مش «في» صلاتهم.  
  *Look at one word: "about" their prayer… not "in" their prayer.*
- «عن صلاتهم» يعني: ضيّعوها… فوّتوا وقتها… وما عملوش أركانها.  
  *"About their prayer" means: they lost it… let its time pass… skipped what it is made of.*
- لكن السهو «في» الصلاة… بيحصل من أي حد… حتى من النبي صلى الله عليه وسلم.  
  *But drifting "in" the prayer… happens to anyone… even to the Prophet ﷺ.*

**0:38 · narration** (image : `room`) · **ligne à nous**, appuyée sur as-Sa'di (le blâme vient de « عدم اهتمامهم »)
- واللي قلقان إنه سها… ده أصلاً شايل هم صلاته.  
  *And whoever worries he drifted… already cares about his prayer.*

**0:43 · narration**
- وفي آخر سورة البقرة… الدعوة دي:  
  *And at the end of al-Baqarah… this prayer:*

**0:46 · Verset récité, jusqu'au mot 19** · Al-Baqarah 2:286 · ≈ 19 s  
  لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا ٱكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَآ إِن نَّسِينَآ أَوْ أَخْطَأْنَا ۚ

**1:05 · narration** · d'après al-Muyassar sur 2:286 ; Muslim 126 (raconté, jamais lu)
- يعني: يا رب ما تعاقبناش… لو نسينا حاجة فرضتها علينا.  
  *Meaning: Lord, don't punish us… if we forget something You made our duty.*
- ولما نزلت… ربنا استجاب.  
  *And when it was revealed… God answered it.*

**1:12 · narration** (image : `end`)
- السهو «في» الصلاة بيتصلّح… والخطر: السهو «عنها».  
  *Drifting "in" the prayer can be fixed… the danger is drifting "away" from it.*
- طب بيتصلّح إزاي؟ النبي صلى الله عليه وسلم نفسه… صلّى الضهر خمس ركعات. تابعنا.  
  *So how is it fixed? The Prophet ﷺ himself… once prayed dhuhr in five rak'ahs. Follow us.*

## Short 2 · `khams` · صلّى الضهر خمس ركعات!

**0:00 · narration** (image : `track5`, la piste d'une prière de quatre rak'ahs, la cinquième case en rouge) · d'après Bukhari 1226
- صلّى الضهر خمس ركعات!  
  *He prayed dhuhr… in five rak'ahs!*
- النبي صلى الله عليه وسلم… بنفسه.  
  *The Prophet ﷺ… himself.*

**0:06 · narration** (image : `rows`, des rangées de lumières qui bougent) · d'après Bukhari 1226 ; Muslim 572j (« توشوش القوم »)
- ولما سلّم… الناس بقوا يوشوشوا بعض.  
  *When he finished… people started whispering.*
- سألوه: هي الصلاة زادت؟ قالوا: صلّيت خمسة.  
  *They asked him: has the prayer been increased? They said: you prayed five.*
- فسجد سجدتين… بعد السلام.  
  *So he made two prostrations… after the salam.*

**0:19 · narration**
- وقال:  
  *And he said:*

**0:20 · Hadith lu par une vraie voix** · Muslim 572a, « إنما أنا بشر… أنسى كما تنسون، فإذا نسيت فذكروني » · **lecture à trouver** (archive.org, skill `find-hadith-recording`) ; sans elle, une ligne de sens raconté à la place : « وقال إنه بشر… بينسى زي ما بننسى. »

**0:26 · narration** · **ligne à nous** (les mêmes mots sont dans le hadith et dans le verset : un fait des textes)
- ونفس الكلام ده… في القرآن:  
  *And these same words… are in the Quran:*

**0:28 · Verset récité, jusqu'au mot 11** · Al-Kahf 18:110 · ≈ 14 s  
  قُلْ إِنَّمَآ أَنَا۠ بَشَرٌ مِّثْلُكُمْ يُوحَىٰٓ إِلَىَّ أَنَّمَآ إِلَـٰهُكُمْ إِلَـٰهٌ وَٰحِدٌ ۖ

**0:42 · narration** · d'après as-Sa'di sur 18:110
- يعني: بشر زيكم… والفرق: الوحي.  
  *Meaning: a human like you… the difference is the revelation.*

**0:46 · narration** (image : `lanes`, ajout) · d'après la Encyclopédie koweïtienne, 24/235 (§ 3) et 24/238-239 (§ 7)
- ولو زوّدت حاجة في صلاتك وانت ساهي… تسجد سجدتين للسهو.  
  *If you add something to your prayer by mistake… you make two prostrations of forgetfulness.*
- بس فين؟  
  *But where?*
- الحنفي… والمالكي: بعد السلام.  
  *Hanafi… and Maliki: after the salam.*
- الشافعي… والحنبلي: قبله.  
  *Shafi'i… and Hanbali: before it.*

**1:01 · narration** (image : `end`) · **ligne à nous** (« اعمل بالمذهب اللي بتتّبعه » retirée : son choix, 2026-11-17)
- وكل مذهب… ليه دليله.  
  *Each school… has its proof.*
- والجاية: قمت… من غير ما تقعد للتشهد. تابعنا… واحفظ الفيديو.  
  *Next: you stood up… without sitting for the tashahhud. Follow us… and save this video.*

## Short 3 · `nasit` · قمت من غير ما تقعد للتشهد؟ (le short « comment faire »)

**0:00 · narration** (image : `stand`, la silhouette debout, l'ombre rouge de la position assise ; la case du tashahhud barrée)
- قمت من غير ما تقعد للتشهد؟  
  *You stood up… without sitting for the tashahhud?*

**0:03 · narration** (image : `rows`) · d'après Bukhari 1224 ; Muslim 570a
- حصلت مع النبي صلى الله عليه وسلم… والناس قاموا وراه.  
  *It happened to the Prophet ﷺ… and the people stood up behind him.*
- وكمّل صلاته…  
  *He went on with his prayer…*
- ولما قرّب يسلّم… كبّر… وسجد سجدتين وهو قاعد… وبعدين سلّم.  
  *and just before the salam… he said Allahu akbar… made two prostrations, sitting… then gave the salam.*

**0:17 · narration** (image : `fix`, les deux cases d'or entrent dans la piste) · d'après la Encyclopédie koweïtienne, 24/234 (§ 1)
- السجدتين دول… بيصلّحوا اللي نقص.  
  *Those two prostrations… repair what was missing.*

**0:21 · narration** (image : `lanes`, oubli) · d'après la Encyclopédie koweïtienne, 24/238-239 (§ 7)
- بس فين السجدتين؟  
  *But where do they go?*
- المالكي… والشافعي… والحنبلي: قبل السلام… زي ما عمل النبي صلى الله عليه وسلم هنا.  
  *Maliki… Shafi'i… Hanbali: before the salam… as the Prophet ﷺ did here.*
- والحنفي: بعد السلام…  
  *And Hanafi: after the salam…*
- تتشهد… وتسلّم مرة واحدة… وتسجد السجدتين… وتتشهد… وتسلّم.  
  *you say the tashahhud… one salam… the two prostrations… the tashahhud again… and the salam.*

**0:44 · narration**
- وليه ناخد حتى ده… من النبي صلى الله عليه وسلم؟  
  *And why take even this… from the Prophet ﷺ?*

**0:48 · Verset récité** · Al-Ahzab 33:21 · 22,8 s  
  لَّقَدْ كَانَ لَكُمْ فِى رَسُولِ ٱللَّهِ أُسْوَةٌ حَسَنَةٌ لِّمَن كَانَ يَرْجُوا۟ ٱللَّهَ وَٱلْيَوْمَ ٱلْـَٔاخِرَ وَذَكَرَ ٱللَّهَ كَثِيرًا

**1:11 · narration** · d'après al-Muyassar sur 33:21
- يعني: في كلامه… وأفعاله… قدوة… فامشوا على سنّته.  
  *Meaning: in his words… and his deeds… a model… so keep to his way.*

**1:16 · narration** (image : `end`) · **ligne à nous** pour la première
- حتى غلطتك في الصلاة… ليها حل من سنّته.  
  *Even your mistake in prayer… has its fix in his Sunnah.*
- احفظ الفيديو… عشان لما تسهى تلاقيه.  
  *Save this video… so it's there when you forget.*
- والجاية: صلّيت تلاتة ولا أربعة؟ تابعنا.  
  *Next: did I pray three or four? Follow us.*

## Short 4 · `shakk` · صلّيت تلاتة ولا أربعة؟

**0:00 · narration** (image : `count`, le compteur « ٣ / ٤ » qui hésite au-dessus de la silhouette)
- صلّيت تلاتة ولا أربعة؟  
  *Did I pray three… or four?*

**0:03 · narration** · d'après Bukhari 1232 ; Muslim 389f
- ده مش صدفة… الشيطان بيلخبطك… لحد ما تنسى صلّيت كام.  
  *It's no accident… Satan muddles you… until you forget how many you prayed.*
- والنبي صلى الله عليه وسلم علّمنا الحل:  
  *And the Prophet ﷺ taught us the fix:*

**0:12 · Hadith lu par une vraie voix** · Muslim 571a (Abu Sa'id al-Khudri : « فليطرح الشك وليبن على ما استيقن ثم يسجد سجدتين قبل أن يسلم… ترغيما للشيطان ») · **lecture à trouver** ; sans elle, les trois lignes suivantes racontent son sens, la référence écrite

**0:27 · narration** (image : `fix`) · d'après Muslim 571a
- يعني: سيب الشك… وابني على الأقل: تلاتة.  
  *Meaning: drop the doubt… build on the lower number: three.*
- كمّل الرابعة… واسجد سجدتين قبل ما تسلّم.  
  *Do the fourth… and two prostrations before the salam.*
- ولو طلعت صلّيت أربعة أصلاً؟ السجدتين دول… يغيظوا الشيطان.  
  *And if you had prayed four after all? Those two prostrations… vex Satan.*

**0:42 · narration** (image : `lanes`, doute) · d'après la Encyclopédie koweïtienne, 24/235-237 (§ 4)
- وده قول المالكي… والشافعي… والحنبلي للي بيصلّي لوحده.  
  *That's the view of the Maliki… the Shafi'i… and the Hanbali for someone praying alone.*
- والحنفي فصّل: أول مرة يحصلك… تعيد الصلاة.  
  *The Hanafi school goes case by case: the first time it happens to you… you start the prayer again.*
- بيحصلك كتير… تاخد باللي غالب على ظنك.  
  *If it happens often… you go with what you think most likely.*
- ومفيش ظن… تبني على الأقل.  
  *With no leaning either way… you build on the lower number.*

**1:02 · narration**
- واللي بيلخبطك ده… القرآن وصفه:  
  *And the one who muddles you… the Quran describes him:*

**1:05 · Verset récité** · An-Nas 114:4-6 · 15,2 s  
  مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ

**1:20 · narration** · d'après al-Muyassar sur 114:4
- بيوسوس وقت الغفلة… ويستخبّى لما تذكر ربنا.  
  *He whispers when you're heedless… and hides when you remember God.*

**1:25 · narration** (image : `end`) · **ligne à nous** pour la première
- الشك في صلاتك… ليه حل… وسجدتين تغيظ بيهم الشيطان.  
  *Doubt in your prayer… has a fix… and two prostrations that vex Satan.*
- احفظ الفيديو… وتابعنا عشان الحلقة الجاية.  
  *Save this video… and follow us for the next episode.*

## Ce que les sources disent, et ce qu'elles ne disent pas

- **Les quatre écoles, telles que l'encyclopédie les donne** (24/238-239, § 7, « موضع سجود السهو ») : hanafite, après le
  salam dans tous les cas (tashahhud, un seul salam, les deux prosternations, tashahhud, salam) ; malikite, avant le
  salam pour un oubli, après pour un ajout, avant pour les deux ensemble ; chaféite (avis le plus fort), avant le salam
  dans tous les cas, un troisième avis laissant le choix ; hanbalite (avis retenu), avant le salam, sauf deux cas où un
  texte le place après : le salam donné avant la fin de la prière (Dhul-Yadayn), l'imam qui s'est fié à son avis le plus
  probable (Ibn Mas'ud).
- **Le doute** (24/235-237, § 4) : la majorité (malikites, chaféites, une version hanbalite) bâtit sur le plus petit
  nombre ; les hanafites distinguent trois cas (première fois : recommencer ; souvent : l'avis le plus probable ; sans
  avis : le plus petit nombre) ; chez les hanbalites, le plus connu d'Ahmad est le plus petit nombre pour qui prie seul,
  l'avis le plus probable pour l'imam (al-Khiraqi).
- **Le statut** (24/234, § 2) : obligatoire chez les hanafites et les hanbalites, sunna chez les malikites (le plus
  connu) et les chaféites. Le script ne le dit pas : il dit « tu fais deux prosternations », que les quatre prescrivent.
- **Ce que le pilote laisse de côté** : Dhul-Yadayn (salam après deux rak'ahs). L'accroche est forte, mais les pages lues
  ne donnent pas les quatre avis pour ce cas : gardé en réserve. Revenir s'asseoir quand on s'en souvient avant d'être
  debout, l'oubli des deux prosternations elles-mêmes (§ 9) : pas dans le pilote.
