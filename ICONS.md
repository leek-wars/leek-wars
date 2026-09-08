# Leek Wars — convention d'icônes

Un concept du jeu = **un seul glyphe**, partout où il apparaît : menu, barres de
page, onglets, boutons, tooltips, widgets de l'accueil, **et notifications**.
Deux endroits qui parlent du même objet ne peuvent pas montrer deux dessins
différents, et deux objets différents ne peuvent pas partager le même.

Document de référence : à relire avant d'ajouter une icône, et à mettre à jour
quand une décision est prise avec Pierre. Les décisions ci-dessous viennent de
lui (2026-08-28) sauf mention contraire.

Le **rendu** de ce document est la page admin **`/admin/icons`**
(`src/component/admin/admin-icons.vue`) : les glyphes y sont dessinés aux tailles
où ils servent, ce qu'un tableau Markdown ne peut pas montrer. Ses données sont
recopiées d'ici à la main — modifier l'un, c'est modifier l'autre.

## Comment on pose une icône

- **Source unique : Material Design Icons**, en SVG, via `<v-icon>mdi-xxx</v-icon>`.
  Un glyphe mdi est monochrome et suit la propriété `color` : il est juste dans
  les deux thèmes sans rien faire.
- **Jamais un PNG pour un concept.** Un PNG porte sa couleur en dur : c'est
  exactement ce qui a produit la fournée d'icônes blanches sur fond clair du
  lot 29 (`REDESIGN.md`), et il faut ensuite une règle CSS par surface pour le
  rattraper. Les PNG restent pour les **assets de jeu** (armes, puces,
  ressources, chapeaux, drapeaux, emblèmes, trophées) — des images, pas des
  icônes d'interface.
- **Ajouter un glyphe** : l'utiliser dans le code, puis
  `node scripts/generate-mdi-icons.mjs`. `src/model/mdi-icons.ts` est **généré**
  (il n'embarque que les glyphes réellement utilisés, pour ne pas charger les
  7 000 chemins de `@mdi/js`) ; un nom construit dynamiquement doit en plus être
  déclaré à la main dans la liste `DYNAMIC` du script.
- **Plein par défaut, contour pour un état négatif.** La variante `-outline`
  n'est pas une nuance de goût : elle veut dire *pas encore obtenu / vide /
  inactif* (trophée non débloqué). Elle ne sert jamais à distinguer deux
  concepts — c'est ce qui a mené le widget « En direct » à opposer trophée plein
  et trophée en contour pour dire « trophée » et « tournoi ».
- **v2 et thème XP** gardent leurs PNG (`public/image/icon/`, `icon/xp_*`) : la
  bascule « Ancien design » doit rester fidèle. La convention ne vaut que pour
  le v3.
- **Exception : le menu v3 porte des assets, pas des encres** (Pierre,
  2026-09-03). Ses entrées montrent `public/image/menu/<entrée>.svg` : le
  **même glyphe mdi** que le tableau ci-dessous (le vocabulaire ne change pas),
  redessiné en image colorée à contour noir comme une arme ou une puce, généré
  par `scripts/generate-menu-icons.mjs` — c'est là qu'on change une couleur ou
  qu'on ajoute une entrée, jamais à la main dans le SVG. Identique dans les deux
  thèmes, comme tout asset du jeu. Partout ailleurs (barres de page, onglets,
  boutons, notifications) le concept reste un `<v-icon>` monochrome.

## Le tableau

| Concept | Glyphe | Notes |
| --- | --- | --- |
| **Poireau** | `mdi-leek` | Un poireau *précis* (menu, ligne de liste) garde sa **vignette de tête**, qui le distingue de ses frères ; `mdi-leek` sert au concept générique. |
| **Trophée** | `mdi-trophy` | La coupe. `mdi-trophy-outline` = trophée **non débloqué**, et rien d'autre. |
| **Classement** | `mdi-podium` | |
| **Tournoi** | `mdi-tournament` | L'arbre à branches — l'objet lui-même. Libère la coupe, que le tournoi lui empruntait. |
| **Victoire en tournoi** | `mdi-trophy` | Exception assumée : ce qu'on annonce est une **récompense obtenue**, pas un arbre. Vaut pour les notifications de victoire (poireau, éleveur, équipe). |
| **Potager** | `mdi-sword-cross` | Deux épées. C'est le lieu et le compteur de combats. |
| **Combat** | `mdi-sword` | Une épée : un combat, un rapport, une ligne d'historique. Petite sœur voulue des deux épées du potager. |
| **Défi** | `mdi-flag-outline` | Le drapeau qu'on plante pour provoquer. Contour **par exception** : le drapeau plein dit déjà « signalement », et cette paire-là est en place partout dans le code (onglets, historique, tooltips, notifications). |
| **Signalement / avertissement** | `mdi-flag` | Le drapeau qu'on lève sur quelqu'un : bouton « Signaler », dialogue de signalement, avertissement reçu. |
| **Arme** | `mdi-pistol` | Le dialogue de choix d'armes, déjà le glyphe des Armes côté admin. |
| **Arène** (Battle Royale, évènements de groupe) | `mdi-stadium` | Déjà le glyphe de la catégorie de trophées « arène ». |
| **Boss** | `mdi-crown` | La couronne, déjà en place dans l'historique de combats, la tooltip de combat et le menu — les boss de Leek Wars sont des rois. |
| **Équipe** | `mdi-shield` | Le blason — les équipes ont un emblème, la métaphore tient. |
| **Composition** | `mdi-shield-sword` | Le blason **et** l'épée : l'escouade de l'équipe qui va au combat. Se lit comme un dérivé de l'équipe, ce qu'elle est. |
| **Groupes privés** | `mdi-account-group` | Des gens, pas un blason : c'est ce qui le sépare de l'équipe. |
| **Marché** | `mdi-store` | |
| **Potion** | `mdi-flask` | La fiole. Décidée le 2026-08-28 en remplacement du PNG noir `icon/black/potion.png` du bouton « Potions » de la page poireau — un PNG qui porte sa couleur en dur, exactement le défaut du lot 29. `mdi-flask-outline` reste libre pour un éventuel état vide. Le tableau portait une seconde ligne « Potion » en `mdi-bottle-tonic`, et les dialogues de potion et de skin, le marché et la page admin des icônes la suivaient : alignés sur la fiole le 2026-09-08 (Pierre : « l'icône potion est pas la même »). |
| **Inventaire** | `mdi-treasure-chest` | |
| **Éditeur** | `mdi-code-braces` | |
| **Forum** | `mdi-forum` | Les deux bulles. |
| **Chat** (salon public) | `mdi-chat` | La bulle simple. |
| **Message privé** | `mdi-email-outline` | L'enveloppe, déjà celle de la barre du haut. Seule entorse assumée au « plein par défaut » : le glyphe plein est trop lourd à 26 px dans le bandeau, et l'enveloppe ne porte pas d'état vide qui réclamerait le contour. |
| **Mention** | `mdi-at` | |
| **Commentaire** | `mdi-message` | La bulle pleine et muette, distincte du salon (`mdi-chat`) et du forum (`mdi-forum`). Commentaire de combat, de tournoi. |
| **Modération** | `mdi-gavel` | |
| **Administration** | `mdi-security` | |
| **Réglages** | `mdi-cog` | Décidé le 2026-08-31 (Pierre : « un icône ici serait cool », titre de la page). Plein, conformément à la règle ; le panneau « Options diverses » de la page garde son `mdi-cog-outline` d'en-tête pour ne pas doubler le glyphe du titre au même écran. |

### Résultats de combat

Ce ne sont pas des concepts mais des **états**, et ils croisent le tableau
ci-dessus. Ils gardent ce qui est en place : `mdi-check` (victoire),
`mdi-equal` (nul), `mdi-close` (défaite) dans les notifications ;
`mdi-trophy` / `mdi-skull-outline` dans l'historique et les tooltips de combat.

## Les pièges

- **La coupe était demandée par trois concepts** — trophée, tournoi, arène — et
  c'est de là que venait l'essentiel de l'incohérence d'avant. Seul le trophée
  la garde (plus la victoire en tournoi, qui EST une récompense).
- **Le crâne n'est pas au boss.** `mdi-skull-outline` veut dire **défaite** dans
  l'historique de combats, le rapport et la tooltip de combat. Le boss a la
  couronne ; ne pas lui remettre un crâne au motif qu'il fait peur.
- **La couronne dit « boss », et rien d'autre.** Reste une collision :
  `notif-bigwin` (la notification de grosse victoire) l'utilise aussi
  — `notification.vue` et `notification-builder.ts`. **À trancher** : la rangée
  bigwin est déjà reconnaissable à sa teinte bleue et à son halo, elle n'a pas
  besoin de la couronne ; `mdi-medal` conviendrait. Ne pas s'en servir non plus
  pour un premier de classement, qui a `--rank-first` comme couleur, pas comme
  glyphe.
- **Le drapeau plein et le drapeau creux ne disent pas la même chose.** Plein
  (`mdi-flag`) = signalement, creux (`mdi-flag-outline`) = défi. C'est la seconde
  entorse au « plein par défaut », et elle vient du code, pas de moi : le défi est
  sur le contour dans une douzaine d'endroits. `mdi-flag-checkered` (premier du
  classement) et le drapeau de priorité du forum sont encore autre chose.
- **Une épée simple n'est pas deux épées croisées.** Le potager (le lieu, le compteur) prend les
  deux ; un combat isolé prend l'une. Ne pas les intervertir : c'est la seule
  chose qui les sépare.
- **Une famille cohérente prime sur la variante.** Les icônes de catégories de
  trophées (`LeekWars.trophyCategoriesIcons`) sont TOUTES en contour : c'est un
  jeu qui se lit ensemble, pas onze concepts isolés, et la règle « plein par
  défaut » ne s'y applique pas. Ce qui compte est le **choix du glyphe**. Le
  tournoi y était sur `mdi-trophy-outline` ; il est passé à `mdi-tournament`, et
  se retrouve donc plein au milieu de dix contours — MDI ne fournit pas de
  variante creuse. C'est assumé : un glyphe juste vaut mieux qu'une famille
  parfaite.

## Les notifications

Une notification montre **le glyphe de son concept**, pris dans le tableau. Elles
se construisent dans `src/model/notification-builder.ts` : le troisième argument
de `new Notification(...)` est le glyphe.

**Plus aucune notification n'utilise de PNG** (2026-08-28). Les seize types qui
en gardaient un — hérités du v2, où la coquille était sombre — sont passés au
glyphe de leur concept. Deux conséquences agréables : la règle d'inversion en
thème sombre de `notification.vue` ne sert plus à rien pour eux, et les
distinctions que le PNG ne pouvait pas porter apparaissent enfin. `tournament_fail`
servait à la fois au tournoi et à l'arène, `garden` à la fois au combat et à la
sortie du potager : ils se séparent en `mdi-tournament` / `mdi-stadium` et
`mdi-sword` / `mdi-sword-cross`.

Les seize fichiers de `public/image/notif/` n'ont plus d'usage dans le code. Ils
ne sont pas supprimés : à faire quand quelqu'un vérifiera qu'aucune notification
ancienne ne les référence encore en base.

Quelques glyphes de notification ne sont pas des concepts du tableau, ce sont des
**évènements** ; ils sont laissés tels quels et listés ici pour mémoire :
`mdi-transfer-up` (montée de niveau), `mdi-message` (commentaire — la bulle
pleine, distincte du salon), `mdi-at` (mention), `mdi-gift-outline` (don d'objet),
`mdi-hand-coin-outline` (don d'habs), `mdi-thumb-up` / `mdi-thumb-down` (votes du
forum), `mdi-flag` (avertissement), `mdi-flag-outline` (défi).

## Appliqué le 2026-08-28

La convention est en place dans le code. Ce qui a bougé :

- **Tournoi → `mdi-tournament`** : `leek.vue` (inscription et panneau), `group.vue`
  (voir / lancer / lancer en équipe, panneau), `team.vue` (inscription d'une
  composition, panneau, compteur de tournois gagnés),
  `home-widget-tournaments.vue`, la catégorie de notifications de `settings.vue`,
  `LeekWars.trophyCategoriesIcons`, le widget « En direct », et six types de
  notifications.
- **Arène → `mdi-stadium`** : inscription aux arènes (`leek.vue`) et trois types de
  notifications (arène qui démarre, plus d'arène, sortie automatique).
- **Potager → `mdi-sword-cross`** : le menu, qui était sur l'épée simple.
- **Combat → `mdi-sword`** : les rapports de combat, y compris ceux du BR, de la
  guerre, de la chasse au coffre et du colosse.
- **Boss → `mdi-crown`** : le widget « En direct », seul endroit qui s'en écartait
  (avec un crâne, qui appartient à la défaite).
- **Chat → `mdi-chat`** : les dix-huit salons publics, les panneaux de chat
  (équipe, groupe, salon), la liste des messages, l'onglet du forum, le trophée.
  Une des occurrences pointait en fait le **forum** de l'équipe : elle est passée
  à `mdi-forum`.
- **Composition → `mdi-shield-sword`** : le panneau « Compositions » et chaque
  composition, qui n'avaient pas d'icône.
- **Poireau → `mdi-leek`** dans la liste d'icônes de la page `/redesign`, qui était
  sur `mdi-sprout`.
- **Notifications** : les seize types encore en PNG sont passés au glyphe de leur
  concept (voir la section précédente).
- **Les PNG de `public/image/icon/`**, seconde passe : l'onglet **Marché** était
  resté en image au milieu de quatre onglets déjà en glyphes dans le même
  composant (`page-tabs.vue`) — c'est ce qui se voyait sur la page Inventaire. En
  le corrigeant, toute la famille y est passée : le compteur de combats de la
  barre du haut et du potager, les six « Marché », les cinq dialogues d'armes,
  les trois potions, les quatre boutons « Signaler », le forum d'équipe, les deux
  trophées de la page éleveur, les deux actions « Défier » de la barre mobile, et
  les bascules tourelles / courbe du graphique de vie. **Il ne reste aucun PNG de
  concept dans l'interface** (hors menu, qui garde les siens pour le v2 et le
  thème XP, et hors `icon/grey/`, déjà une encre sombre).
- Le combat de l'arbre des tournois (`tournament-fight.vue`) est un `<path>` SVG
  et non un `<v-icon>` : on est dans un `<svg>`, le composant d'icône n'y a pas sa
  place. Il lit le chemin dans `mdiIcons` — même source, autre véhicule.

Le v2 et le thème XP gardent leurs PNG **dans le menu**, qui branche déjà sur
`LeekWars.legacyTheme`. Ailleurs le glyphe est partagé par les deux designs :
c'est le vocabulaire, pas le style, et le dédoubler garantirait qu'il dérive.
`page-tabs.vue` faisait déjà comme ça pour Collection, Boutique, Banque et
Inventaire — le Marché était le dernier à ne pas suivre.

### Reste à trancher

- **La couronne, partagée entre le boss et `notif-bigwin`** (la notification de
  grosse victoire). La rangée bigwin est déjà reconnaissable à sa teinte bleue et
  à son halo ; `mdi-medal` lui irait. Décision de Pierre, rien n'a été touché.
- **Les seize PNG de `public/image/notif/`**, désormais sans usage dans le code,
  à supprimer une fois vérifié qu'aucune notification en base ne les référence.
