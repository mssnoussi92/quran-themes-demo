# Audit : après le verset (2026-11-20)

La règle du propriétaire (2026-11-20, après « آية وحكايتها » 1) : **après un verset, une seule phrase de sens**, rien qui redise
le verset ou sa traduction, puis **l'exemple de vie joué à l'écran** (bonshommes, visage simple, inconnus seulement), la
narration après le verset **en sous-titre**. Sa demande, le même jour : auditer les vidéos thématiques à venir dans l'ordre du
calendrier (`docs/retention/calendar.md`), **et toujours préparer une scène animée quand c'est possible**.

Comment c'est mesuré : chaque short lu réplique par réplique (`content/trial/<id>.yaml`), la voix après le premier verset
estimée comme `tools/trial/script.py`. Une coupe ne coûte aucune requête de voix (`drop`, `docs/model.md`) ; une scène jouée
coûte un dessin (session) et un rendu (workflow `film`). Rien n'est changé sans son accord, short par short.

Ce qui ne s'applique pas, et pourquoi :

- **Les films** (Dhul-Qarnayn le 23 nov., la caverne le 30 nov., « مخيّر ولا مسيّر؟ » le 28 déc.) : format long, déjà rendus ;
  la règle vise les shorts. Un film refait plus tard prendrait les scènes jouées de ses shorts.
- **Les quiz** (« معاك 5 ثواني », 23 et 30 nov., 28 déc.) : 0:41 à 1:21 ; après le verset, c'est la réponse du quiz.
- **« سنريهم آياتنا »** (21 et 28 nov., 5, 12 et 19 déc.) : une enquête ; ce qui suit le verset est la preuve (ce que dit le
  tafsir, la date, la phrase « la science ne prouve pas le Coran »), pas une redite. Pas d'exemple de vie à jouer.
- **« إزاي أعملها؟ »** (4 au 7 janv.) : du fiqh ; après le verset, c'est la règle et les quatre écoles. Déjà dessiné (la pièce,
  la silhouette qui prie, la piste des rak'ahs).
- **« بص تاني »** 1 et 3 (10 et 24 déc.) : déjà une métaphore jouée ; après le verset, le point du tafsir (les deux يسر, les
  quatre conditions d'al-'Asr), qui est le short.

## Par date

| Date | Vidéo | Après le 1er verset | Proposition |
| --- | --- | --- | --- |
| sam. 21 nov. | « سنريهم آياتنا » 1, Abou Lahab | 7 répliques, 38 s | rien (enquête ; demain : un rendu pour 5 s ne vaut pas le risque) |
| lun. 23 nov. | Dhul-Qarnayn, le film ; quiz 1 | — | rien (film ; quiz) |
| mar. 24 nov. | Dhul-Qarnayn 1, `west` (2:10) | 11 répliques, 62 s | **version entière** (YouTube, TikTok) : couper `meaning:0` (redit 18:87-88), `depth:1` ; **jouer l'exemple** (un chef dans un bureau : celui qui a mal fait est repris, celui qui a bien travaillé est remercié) ; sous-titre. Version courte Facebook/Instagram : inchangée (l'essai en cours) |
| mer. 25 nov. | Dhul-Qarnayn 2, `tribute` (2:04) | 12 répliques, 59 s | version entière : couper `meaning:0` (redit 18:95), `meaning:2`, `depth:1` ; garder `meaning:1` (répond au « ليه؟ » de l'ouverture) ; **jouer l'exemple** (quelqu'un demande de l'aide ; on lui apprend à se tenir debout : on travaille avec lui) |
| jeu. 26 nov. | Dhul-Qarnayn 3, `barrier` (1:56) | 13 répliques, 51 s | version entière : couper `meaning:0`, `meaning:1` (redisent 18:98), `depth:1` ; **jouer l'exemple** (une réussite applaudie ; il lève les yeux : « الحمد لله ») |
| sam. 28 nov. | « سنريهم آياتنا » 2, le cosmos | 6, 30 s | rien |
| lun. 30 nov. | la caverne, le film ; quiz 2 | — | rien |
| mar. 1 déc. | la caverne 1, `refuge` (1:14) | 8, 41 s | déjà une phrase de sens ; **jouer l'exemple** (le seul de la bande qui refuse, il s'écarte et lève les mains) ; sous-titre |
| mer. 2 déc. | la caverne 2, `sunpath` (1:15) | 7, 30 s | **jouer l'exemple** (une du'a de longues années ; autour de lui, des détails changent qu'il ne voit pas) ; sous-titre |
| jeu. 3 déc. | la caverne 3, `awake` (1:11) | 7, 24 s | **jouer l'exemple** (il se réveille, sa main va au téléphone, s'arrête ; il dit le dou'a) ; sous-titre |
| sam. 5 déc. | « سنريهم آياتنا » 3, le ciel | 8, 44 s | rien |
| lun. 7 déc. | « كلمة من القرآن » 1, `kanud` (1:39) | 11, 52 s | couper `meaning:1` (un deuxième sens), `ledger` (ce que l'exemple montre) ; **jouer l'exemple** (une journée bonne, une seule chose casse ; le soir il ne raconte qu'elle) |
| mar. 8 déc. | « كلمة من القرآن » 2, `stone` (2:03) | 11, 47 s | les trois mots sont le short : rien à couper ; **jouer l'exemple** (un verre d'eau donné à un assoiffé, personne ne voit) |
| mer. 9 déc. | « كلمة من القرآن » 3, `haluu` (1:18) | 9, 43 s | couper `meaning:0`, `meaning:1` (redisent 70:20-21), `meaning:3` ; **jouer l'exemple** (le salaire en retard, il renverse la maison ; arrivé, il le serre) |
| jeu. 10 déc. | « بص تاني » 1 | 5, 21 s | rien (déjà joué) |
| sam. 12 déc. | « سنريهم آياتنا » 4, l'embryon | 8, 49 s | rien |
| lun. 14 déc. | « خريطة كلمة » 1, `qalb` (1:25) | 9, 32 s | déjà une phrase de sens ; **jouer l'exemple** (étouffé dans le bruit, il dit « سبحان الله… الحمد لله » ; autour rien ne change, son visage se calme) |
| mar. 15 déc. | « خريطة كلمة » 2, `nur` (1:23) | 8, 35 s | **jouer l'exemple** (une pièce noire, il cherche à tâtons ; la lumière vient du dehors) |
| mer. 16 déc. | « خريطة كلمة » 3, `sadr` (1:26) | 9, 36 s | **jouer l'exemple** (devant la porte d'un examen, il dit le dou'a de Moussa, puis entre) |
| jeu. 17 déc. | « بص تاني » 2, `drought` | 5, 20 s | couper `meaning:0`, `meaning:1` (redisent l'ouverture jouée et le verset) |
| ven. 18 déc. | « لاحظت الفرق؟ » 1, `rizq` (1:33) | 9, 43 s | couper `meaning:2` ; **jouer l'exemple** (un père qui attend un enfant fait ses comptes chaque nuit) |
| sam. 19 déc. | « سنريهم آياتنا » 5, 365 | 9, 48 s | rien |
| lun. 21 déc. | « سؤال صعب » 1, `dank` (1:51) | 14, 65 s | couper `meaning2:0` (redit 6:44) ; la question et sa réponse sont le short ; **jouer l'exemple** (tout lui réussit, loin de Dieu : « أكيد أنا كويس ») |
| mar. 22 déc. | « سؤال صعب » 2, `tayyiba` (1:32) | 12, 61 s | déjà une phrase de sens par verset ; **jouer l'exemple** (l'étudiant qui a travaillé, l'examen difficile) |
| mer. 23 déc. | « سؤال صعب » 3, `ghafur` (0:57) | 10, 38 s | **jouer l'exemple** (« بكرة », chaque jour, la page du calendrier tourne) |
| jeu. 24 déc. | « بص تاني » 3 | 5, 23 s | rien |
| ven. 25 déc. | « لاحظت الفرق؟ » 2, `adab` (1:42) | 7, 37 s | **jouer l'exemple** (il tombe : « أنا اللي قصّرت » ; un bien arrive : « ده من ربنا ») |
| lun. 28 déc. | « مخيّر ولا مسيّر؟ », le film ; quiz 3 | — | rien |
| mar. 29 déc. | « مخيّر… » 1, `amal` (1:41) | 9, 42 s | couper `meaning:0` (redit 92:5-7) ; l'exemple est déjà joué (sa scène d'ouverture) |
| mer. 30 déc. | « مخيّر… » 2, `shaa` (1:26) | 10, 52 s | rien : les trois phrases de sens sont la précision qu'il a demandée (ni مجبور ni hors de Sa volonté) |
| jeu. 31 déc. | « مخيّر… » 3, `law` (1:35) | 8, 39 s | couper `meaning:0` (redit 57:22) |
| ven. 1 janv. | « لاحظت الفرق؟ » 3, `qist` (1:35) | 8, 36 s | couper `meaning:2` ; **jouer l'exemple** (le frère en tort : il dit la vérité ; celui qu'il n'aime pas a raison : il le dit) |
| 4 au 7 janv. | « إزاي أعملها؟ » 1 à 4 | — | rien |

En tout : **18 scènes jouées** à dessiner, des coupes dans 11 shorts, 15 shorts laissés tels quels (et les 3 films).

## Ce qui reste à dire franchement

- Sur Facebook et Instagram, on regarde nos shorts 4 à 13 s en moyenne : ces changements y comptent peu. Ils comptent sur
  YouTube (45 à 62 % d'un short regardé). Pour Dhul-Qarnayn, Facebook et Instagram ont déjà leur version courte (l'essai des
  24 au 26 nov.), qui ne change pas : le changer en cours fausserait l'essai.
- Chaque short refait redevient à valider (coupes, scène, puis vidéo) : par lots, dans l'ordre des dates.
