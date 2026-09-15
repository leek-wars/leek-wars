# Leek Wars 3.0 — Specs du redesign (#1101)

Document de référence du chantier. À relire en début de session avant de toucher
au thème, et à mettre à jour quand une décision est prise avec Pierre.

## Architecture (état au 2026-08-12)

Deux voies qui convergent :

- **Page `/redesign`** : le design system de référence, issu du projet Claude
  Design « Leek Wars redesign ». Jetons dans `src/redesign/tokens.scss` (portés
  par `html[data-redesign]`, invisibles ailleurs), composants dans
  `src/redesign/components.scss`.
- **Thème v3 du site** : `src/theme/leekwars-theme-v3.scss` (mêmes variables que
  le v2, autres valeurs) + `src/theme/leekwars-shell-v3.scss` (formes de la
  coquille, encapsulé dans `body:not(.v2)`). Bascule utilisateur dans les
  réglages : `localStorage['design']` = `v2` | `v3`, classe `body.v2`.
  **Toute variable ajoutée dans un thème doit exister dans l'autre.**

Le **vocabulaire d'icônes** vit dans un document à part, `ICONS.md` (un concept
du jeu = un glyphe, notifications comprises) : c'est de la sémantique, pas du
thème, et ça vaut aussi pour le v2 le jour où il faudrait y toucher.

## Principes actés

Décisions de Pierre — ne pas les rediscuter, les appliquer.

1. **Profondeur par le trait, jamais par l'ombre floue.** Les surfaces
   flottantes (dialogues `popup.vue`/`v-dialog`, menus déroulants `v-menu`,
   autocomplétions) se détachent du fond par la **même bordure que les
   panneaux** (`--border-strong`). Seule ombre admise (2026-08-12) :
   **l'ombre pixel du mockup** (`--shadow-pixel`, `4px 4px 0`, zéro flou),
   réservée aux surfaces flottantes. Nuance (2026-08-13) : un **halo** —
   émission de lumière sans direction (`box-shadow` interne floue) — n'est pas
   une ombre d'élévation et est admis pour les éléments « précieux »
   (notifications trophée/bigwin), avec reflet animé au survol.
2. **Pas d'arrondis, zéro exception** (2026-08-12). Angles francs partout :
   tous les `--radius*` du v3 valent 0, **y compris `--radius-tiny`** (les
   2 px que s'autorisait le mockup sautent). Restent les valeurs en dur, voir
   Chantier.
3. **Pas de ripple effect** (Material). À la place : de vrais états `hover` et
   `active` cohérents avec le thème — changement de surface, liseré vert pour
   l'actif, « pixel push » (enfoncement d'1 px) pour le pressé. Le ripple est
   coupé au CSS dans la coquille v3 (`.v-ripple__container`), pas par la
   config Vuetify qui est globale : le v2 garde le sien.
4. **Sortie des contrôles Material, Vuetify gardé comme moteur** (2026-08-12).
   Plus de `v-switch`, `v-checkbox`, `v-radio`, `v-select`, `v-text-field`… →
   composants maison au style du design system. En revanche `v-dialog`,
   `v-menu`, `v-tooltip` **restent comme primitives de positionnement**
   (overlay, ancrage, focus), entièrement restylées : on garde la mécanique,
   pas le style.
5. **Nouveau logo Leek Wars principal**, déclinaisons dark et light.
   *Pierre s'en charge, plus tard. Ne pas générer de logo.* Seule exception
   accordée depuis (2026-08-28) : `leekwars_flat.svg`, le logo ACTUEL débarrassé
   de son dégradé, à titre d'essai — pas un dessin nouveau (lot 31).
6. **Nouveau design des puces et apparats** (assets du jeu).
   *Traité dans une autre session dédiée. Ne pas s'y attaquer ici.*

## Partis pris déjà en place (sessions précédentes)

Lisibles dans les commentaires des fichiers de thème, rappelés ici :

- Typo d'affichage pixel : `Press Start 2P` sur `/redesign` (latin seul),
  `Pixelify Sans` sur le site (couvre le cyrillique), Roboto en repli CJK.
  **Attention en reportant une taille du mockup** : la substitution n'est pas
  neutre. Press Start 2P a une hauteur de capitale égale au cadratin entier
  (1000/1000), Pixelify Sans seulement 0,7 — à taille égale le site est 30 %
  plus petit. **Multiplier par 1,43** (18 px du mockup → 26 px sur le site).
  Corrigé sur les titres de page le 2026-08-13 ; les autres tailles en police
  d'affichage (en-têtes de panneau 14, panneau social 10, en-têtes de tableau)
  n'ont pas encore été repassées à ce facteur.
- Typo de corps (2026-08-13, demande de Pierre — « j'en peux plus de
  Roboto ») : **Inter**, le `--f-body` du mockup, via `--font-body`
  (v2 : Roboto inchangé). Auto-hébergée en 4 sous-ensembles woff2
  (latin, latin-ext, cyrillique, cyrillique-ext — le cyrillique manquait
  à notre Roboto), repli Roboto puis chaîne système pour le CJK.
- Vert de marque : `#7CFF6B` (néon) en sombre ; en clair `#146128` et non le
  `#1F8A3B` du mockup (contraste mesuré comme encre : 3,9 → insuffisant).
- Tout écart de couleur se **mesure à la sonde de contraste** (seuil 4,5:1
  texte, 3:1 UI), dans les deux thèmes.
- Vuetify ne lit pas les variables CSS : sa palette est doublée dans
  `src/model/vue.ts` (4 thèmes : light/dark × v2/v3).
- Marqueurs d'environnement (beta/local repeignent le fond) : neutralisés
  TEMPORAIREMENT le temps de valider la palette (bloc dédié dans
  `leekwars-shell-v3.scss`, à supprimer pour les remettre).
- Pas de régression sur le design v2 : tout passe par les variables ou par
  `body:not(.v2)`.

## Fait

- **2026-08-12, lot 1** : ripple coupé en v3 + « pixel push » sur les boutons ;
  traitement panneau des dialogues (`popup.vue` : trait, ombre pixel, titre et
  barre d'actions passés aux rôles du thème) et des menus déroulants
  (`v-menu`/`v-select` : trait, ombre pixel, surface de panneau) ;
  `--radius-tiny` à 0 ; jeton `--shadow-pixel` créé (v2 : `none`, parité).
  Le tout dans `leekwars-shell-v3.scss` et les fichiers de thème.
  Vérifié sur la bêta locale (dialogue de capital, menus de l'accueil et des
  trophées) dans les deux thèmes, plus non-régression v2 (pas de trait, rayons
  2 px, ripple conservé).
- **2026-08-13, lot 2** :
  - **Tooltips** : la bulle grise à flèche passe aux variables `--tooltip-*`
    (v2 : valeurs historiques au pixel près) ; en v3 surface d'en-tête de
    panneau, trait, ombre pixel, et la flèche disparaît (elle ne peut pas
    porter le trait).
  - **Toasts** : surface flottante comme les autres (panneau, trait, ombre
    pixel) au lieu de la pilule noire translucide, invisible sur le fond
    sombre du v3.
  - **Focus clavier** : anneau vert `:focus-visible` en v3 (le ripple emportait
    le seul retour clavier des composants Material) ; champs texte exclus,
    leur bordure passe déjà au vert.
  - **`lw-switch`** : premier contrôle maison, dans `src/component/ui/`
    (dossier de la future famille : checkbox, radio…). Enregistré globalement
    (`lw-switch`), API alignée sur les usages : v-model/`:model-value`,
    `label` (prop ou slot), `disabled`, `@change` par retombée native. Piste
    rectangulaire 36×18, trait, aplat vert à l'état actif, pixel push ;
    **rendu v2 embarqué** (silhouette Material : rail arrondi, pouce rond,
    élévation) pour que la bascule « Ancien design » reste fidèle — c'est le
    patron à suivre pour chaque contrôle maison. Les 55 `v-switch` des 17
    fichiers sont migrés, `hide-details`/`density`/`color`/`ripple`/`inset`
    supprimés au passage, défaut `VSwitch` retiré de `vue.ts`.
  - Vérifié sur la bêta locale : réglages, page poireau et trophées (pattern
    « .tab » sans double toggle, retombée `@change` testée), deux thèmes,
    rendu v2 du switch conforme.
- **2026-08-13, lot 3** : `lw-checkbox`, `lw-radio` et `lw-radio-group`
  (`src/component/ui/`), sur le patron de `lw-switch` (input caché contrôlé,
  clic rejoué, rendu v2 Material embarqué, `name` partagé par groupe pour les
  flèches du clavier). En v3 la case porte une coche, le radio un point carré
  — pas de rond, angles francs. Migré : 44 `v-checkbox` (15 fichiers, dont la
  checkbox du quiz de l'encyclopédie montée par `h()` dans `markdown.vue`) et
  45 `v-radio`/14 groupes (11 fichiers). Règles CSS orphelines adaptées
  (`global.scss`, `forum.vue`, `leek.vue`, `menu.vue`, skin XP) ; défauts
  `VCheckbox`/`VRadio`/`VRadioGroup` retirés de `vue.ts`. Vérifié sur la bêta
  locale (réglages : les trois contrôles, bascule de thème par les radios,
  aller-retour), rendu v2 conforme (cercle/coche Material), et build de
  production complet passé (tous les templates compilent).

- **2026-08-13, lot 4 — barre du haut connectée et panneau social** :
  - Barre : avatar carré bordé (24 px dans le bouton fermier, qui débordait en
    rond de 42 px), cristal rangé dans son compteur (il était taillé pour
    dépasser de la barre v2), même carré bordé pour les avatars du menu du
    compte, du panneau social et des chats.
  - Panneau social : les peaux v2 des notifications (dégradé d'or du trophée,
    dégradé bleu du bigwin, texte noir forcé) deviennent des rangées neutres à
    liseré (`--rank-first` / `--info`) ; non-lu teinté du vert du thème ;
    survol en surface de rangée ; bannière « Déconnecté » sur `--error` au
    lieu du rouge en dur ; entrée de chat en bande basse du mockup (surface de
    champ, trait fort qui passe au vert au focus), popups commandes/pseudos en
    surfaces flottantes (trait + ombre pixel). Vaut pour tous les chats et
    toutes les pages où ces notifications apparaissent.
  - `[contenteditable]` exclu de l'anneau `:focus-visible` (l'entrée du chat
    a déjà son trait de focus).
  - Vérifié bêta locale (accueil, /notifications), deux thèmes, v2 intact
    (dégradés, rond, cristal débordant, rouge historique).

- **2026-08-13, lot 5** : retour de Pierre sur les notifications spéciales
  (« le liseré seul est trop sec ») → halo doré/bleu (teinte d'accent 10 %,
  `box-shadow` interne, `color-mix` sur `--rank-first`/`--info`), qui
  s'intensifie au survol avec un reflet qui balaie la rangée
  (`@keyframes lw-notif-shine`). Le coffre du menu (qui porte aussi
  `notif-trophy`) hérite du halo. Et bascule de la police de corps sur
  **Inter** (voir Partis pris) : variable `--font-body` dans les deux thèmes,
  7 points de consommation convertis, plus un seul `Roboto` en dur hors
  `@font-face`.

- **2026-08-13, lot 6** : titres de page à 26 px (facteur de conversion de
  police, voir Partis pris) ; page équipe — compositions sur deux colonnes en
  `auto-fit` dès 600 px de large, poireaux à un sixième fixe pour qu'ils
  s'alignent d'une composition à l'autre, débordement des images (arme,
  chapeau) contenu dans le panneau. Correction au passage d'une régression du
  lot 3 : `<v-checkbox-btn>` attrapé par le remplacement en masse.
  **Le projet Claude Design est lisible avec l'outil DesignSync**
  (`projectId` 019deda9-539b-7467-ad87-bac4e42c3ae0) : `handoff/tokens.css`,
  `handoff/components.css` et un écran par page dans `screens/`. À consulter
  avant de deviner une valeur. Son écran équipe n'a pas de compositions : la
  mise en page à deux colonnes est une décision de Pierre, pas du mockup.

- **2026-08-13, lot 7** : reste des intitulés en police d'affichage repassés au
  facteur 1,43 (sections du menu et en-têtes du panneau social 10 → 13 px,
  en-têtes de tableau et du forum 11 → 12 px ; en-têtes de panneau et
  pagination étaient déjà au-dessus de leur équivalent converti).
- **2026-08-13, lot 8** : ombre pixel sur les boutons d'accent, comme le décrit
  le guide d'intégration du projet Design (3 px au repos, 4 px + décalage d'un
  pixel au survol, 2 px enfoncé au clic). Réservée aux boutons portant un aplat
  de couleur ; jetons `--shadow-pixel-small` / `--shadow-pixel-pressed`.

- **2026-08-13/14, lot 9** : `lw-input` (4e contrôle maison, label fixe
  au-dessus — choix de Pierre — 13 usages migrés) ; barre de page à 48 px.
- **2026-08-14, lot 10 — retours de Pierre** :
  - Encre blanche sur les aplats de marque : `--white` n'étant pas redéfini en
    sombre, il restait crème sur le vert néon (1,1 de contraste). 19 règles
    passées à `--primary-text` ; cas particuliers de la pastille du marché et
    des boutons de la banque, qui utilisaient un `#4caf50` Material en dur.
  - Barres de progression rondes → jauges franches segmentées, `--info` pour
    l'état complet, reflet animé sur les deux barres importantes.

- **2026-08-14, lot 11 — les boutons dorés** (retour de Pierre : « les boutons
  récupérer étaient en jaune avant »). La classe `notif-trophy` sert à deux
  choses : la peau des notifications de trophée ET l'or des boutons
  « Récupérer » (boîtes, cadeaux, coffre des récompenses) et des pastilles
  d'or. Le lot 4 avait donné le traitement de rangée (liseré + halo) à tout ce
  qui porte la classe, boutons compris : ils avaient perdu leur aplat et leurs
  flèches noires devenaient invisibles sur le fond sombre.
  - Jeton `--gold` / `--gold-text` : l'or en **aplat** (l'or en **encre**,
    c'est `--rank-first`). Valeur `gold` du mockup, #FFD23A en sombre et
    #B88A0E en clair, encre sombre dans les deux (5,9 et 12,9 mesurés).
  - Les boutons (`.v-btn.notif-trophy`) reprennent l'aplat et le relief à
    trois états des boutons d'accent (lot 8) ; les pastilles
    (`.retrieve` de l'inventaire, `.best-label` de la banque) l'aplat seul.
    Le halo reste aux rangées de notification, au coffre de la barre et aux
    cartes de récompense de filleul.
  - Effet de bord corrigé : `body.dark .v-btn:not([class*="bg-"])` (global.scss)
    peignait **tous** les boutons du thème sombre en noir, y compris en v3 où
    il recouvrait la surface que la coquille leur donne. Restreint à
    `body.v2.dark` : en v3 sombre les boutons pleins prennent enfin
    `--background-header` et les boutons texte redeviennent transparents.
  - Au passage, `.get-all.v-size--small` dans `item-preview.vue` : classe de
    taille de Vuetify **2**, la règle ne s'appliquait plus depuis la migration.
    Une fois rebranchée, son `padding: 7px` a désaligné les libellés (Pierre) :
    le bouton Vuetify 3 a une **hauteur fixe** et centre son contenu dedans, un
    padding vertical rétrécit la boîte de contenu sous la hauteur du texte, qui
    déborde par le bas et paraît collé en haut. Padding horizontal seulement.
  - Vérifié sur la bêta locale (aperçu d'objet, coffre des récompenses, badge
    « Meilleure offre » de la banque) dans les deux thèmes, plus non-régression
    v2 (dégradé jaune, coins à 2 px, élévation Material, boutons noirs).
  - **Barres de défilement** (demande de Pierre : « une scroll bar plus jolie
    sur ce type de menu ») : le v2 ne peignait que le pouce, en `#bbb`, soit
    une barre presque blanche sur la piste par défaut du navigateur — l'objet
    le plus voyant d'un menu ou d'une fiche d'objet en thème sombre. En v3 :
    piste en surface de champ séparée par le trait, pouce franc à
    `color-mix(--text-color 50 %)` (premier palier qui tient 3:1 dans les deux
    thèmes), vert du thème au survol. La barre de la **page** est incluse :
    elle n'est pas dans `body` mais à la racine, il faut une règle posée SUR
    `body` (`&::-webkit-scrollbar`) et pas un sélecteur descendant — ce que le
    v2 n'avait jamais fait. Firefox n'a que `scrollbar-width`/`scrollbar-color`,
    posés dans un `@supports not selector(::-webkit-scrollbar)` : dans Chrome
    ces propriétés désactiveraient les pseudo-éléments.
    **Le piège s'est refermé une fois** : une première version de la section,
    restée plus haut dans le même fichier, posait `scrollbar-width` sur `&, & *`
    SANS le `@supports`. Sous Chrome, elle a tenu hors service les 38 règles
    `::-webkit-scrollbar` du dépôt — cette section-ci comprise, plus le thème XP
    et le HUD de combat — et le navigateur rendait une barre `thin` générique.
    Symptôme qui a fini par le trahir : un ascenseur revenu dans les onglets de
    l'éditeur (rapport de Nyaleph, topic 12112), là où `editor-tabs.vue` croyait
    l'avoir masqué. La première section a été supprimée, elle faisait doublon.
    À retenir : `scrollbar-width` et `scrollbar-color` ne se posent JAMAIS hors
    du `@supports`, où qu'on soit dans le dépôt.
  - **Widget « Mes poireaux » de l'accueil** (demande de Pierre) : vraie grille
    équilibrée au lieu d'un retour à la ligne — à quatre cartes dans un panel
    qui en tient trois, 2 × 2 et non 3 + 1. Colonnes calculées : on prend ce
    qui tient dans la largeur, on en déduit les rangées, puis on ramène les
    colonnes au nécessaire pour ces rangées (4 → 2×2, 3 → 3×1, 5 → 3+2). Le
    nombre de rangées est publié en variable CSS : la hauteur de l'image se
    partage désormais la hauteur du panel entre les rangées.
  - Page poireau, grille des puces (demande de Pierre) : puces plafonnées à
    **52 px**, la grille occupe toujours toute la largeur du panel, et la
    largeur excédentaire va dans l'**écart entre les puces** — colonnes en
    `1fr`, cases en ratio 1:1, image centrée dedans, ce qui donne le même
    écart à l'horizontale et à la verticale. Les unités `cqw` (et le
    `container-type` du wrapper) ne servaient plus qu'à ça, supprimées.

- **2026-08-14, lot 12 — widget « Mes poireaux » et aperçu d'objet** :
  - Le widget n'avait aucun état visible : son survol posait
    `--background-secondary`, qui **est** la surface du panel en v3. Cases en
    `1fr` (colonnes et rangées) au lieu de cartes de 130 px espacées, pour que
    le rectangle de survol couvre la part entière d'un poireau ; survol en
    surface de rangée + liseré `--border-strong`, liseré vert au clic. Demande
    de Pierre : discret, **sans animation sur les poireaux** (une première
    version faisait sauter l'image au survol). v2 inchangé (`body:not(.v2)`).
  - **Défilement horizontal de l'aperçu d'objet** (`.card` de
    `rich-tooltip-item`, 280 px, `overflow-y: auto` — donc `overflow-x: auto`
    par cascade) : l'aperçu des poireaux (chapeau, potion de peau) posait ses
    images à leur taille naturelle en colonnes `auto`, et un poireau à grande
    arme dépasse sa part. Colonnes en `minmax(0, 1fr)` et images en
    `max-width: 100% / height: auto` (le ratio vient des attributs du svg).
    Mesuré : 409 px de contenu pour 280 px de carte avant, 280 après, les
    petits poireaux gardant leur taille. Les **trois** copies de la règle sont
    à corriger ensemble (`hat-preview.vue`, `potion-preview.vue`,
    `item-preview.scss`), elles se marchent dessus à specificité égale.

- **2026-08-14, lot 13 — halo de rareté, thème de code, panel « En direct »** :
  - Fiche d'objet : l'image de l'objet passe **devant** le halo de rareté (seule
    l'image se relève, pas son bloc, dont le fond opaque masquerait la lumière),
    et le mot de rareté remonte au plus près du trait (`top: 42px` → `39px`,
    padding réduit) pour se lire dans la partie vive du halo.
  - **Thème d'éditeur « Leek Wars Dark »** (`monaco.ts` + palette `--ct-*` de
    `monaco-highlight.scss`), aux couleurs du thème v3 sombre : fond `#0E1316`,
    mots-clés en vert de marque, types en `--type-color`, nombres et atomes en
    violet, annotations en `--gold`, commentaires éteints. Encres mesurées sur
    le fond : 14,6 / 12,1 / 11,0 / 8,1 / 12,9 / 5,2. Il **remplace Monokai comme
    défaut sombre** (Monokai reste proposé) ; la coquille de l'éditeur prend
    aussi les surfaces du site avec ce thème.
  - Les aperçus de code (forum, encyclopédie, doc) étaient **cassés en sombre**
    quand le thème d'éditeur choisi était clair : les thèmes clairs ne posent
    pas de fond (l'aperçu épouse celui de la page), donc leur encre noire et
    leur bleu marine se retrouvaient sur le presque-noir du site. `code-theme.ts`
    bascule désormais sur le pendant sombre du thème choisi quand la page est
    sombre (l'inverse est inutile : les thèmes sombres portent leur fond).
    La liste des thèmes sombres, dupliquée dans 4 fichiers, est centralisée
    (`DARK_CODE_THEMES` / `isDarkCodeTheme`).
  - Panel « En direct » : chaque événement porte l'**avatar** de l'éleveur, avec
    l'icône d'événement (trophée, épées, crâne, forum) en pastille sur son coin.
    Demande un champ `avatar_changed` dans `live/get-events` (côté serveur) :
    sans lui, l'`avatar` retombe sur l'image par défaut.
    *Révisé le 2026-08-26 (demande de Pierre) : la pastille ne dit plus que la
    NATURE de l'événement — `mdi-trophy` plein pour un trophée, contre le
    contour déjà pris par les tournois — et l'image du trophée, qui disait
    LEQUEL depuis un carré de 16 px, passe en bout de ligne à droite, à la
    taille de l'avatar et cliquable vers `/trophy/<code>`.*

- **2026-08-14, lot 14 — l'arbre du tournoi tient dans l'écran** : la fenêtre
  élargie du redesign donnait au SVG (ratio fixe, largeur 100 %) une hauteur
  supérieure à l'écran, il **débordait en bas**. `tournament-graph.vue` mesure
  désormais sa place (largeur du conteneur en `ResizeObserver`, hauteur restante
  sous lui) et fixe sa hauteur ; la largeur en trop passe dans le `viewBox`.
  Pour la consommer **sans déformer** (choix de Pierre contre un
  `preserveAspectRatio="none"` qui aplatirait poireaux et avatars), les x
  passent par `sx()` : une carte affine par morceaux, identité (simple
  translation) sur les **bandes** occupées par chaque tour, étirée dans les
  espaces. Les cases restent carrées et les traits collés à leurs bords, seuls
  les connecteurs s'allongent. La finale et le vainqueur ne passent pas par
  `sx()` (sommet du bracket, centré) ; les demi-finales, elles, s'écartent avec
  leur tour — d'où le `moved` de `L()`, qui limite l'étirement d'un connecteur à
  ses premiers points. Le `viewBox` gagne 5 unités en bas : les noms de la
  dernière rangée y étaient rognés. Bonus : le tooltip des cases sans lien
  n'essaie plus de refaire le calcul d'échelle à la main, la case émet sa
  position à l'écran.

- **2026-08-14, lot 15 — l'arbre du tournoi, retours de Pierre** :
  - **Coupe en biseau des cases** (`bracket.ts`, `cutSquare`) : les `rect`
    deviennent des `polygon` aux mêmes deux coins coupés que les avatars, à 18 %
    du côté — la case et l'avatar de l'éleveur qu'elle porte se répondent. Les
    **boîtes de combat restent carrées** (demande de Pierre : elles avaient reçu
    la coupe elles aussi, c'était trop).
    Le contenu (poireau, image) est découpé par un **`<g>` englobant** et non par
    lui-même : `leek-image` est un `<svg>` imbriqué, un `clip-path` posé dessus
    s'applique dans SON repère et fait tout disparaître (constaté à l'écran).
  - **Traits en sombre** : `--background-disabled` (#2A2F2C) se perdait sur le
    fond du panneau. Le trait passe par une variable `--bracket-line`, posée sur
    le `<svg>` et héritée par les cases et les combats (les variables CSS
    traversent le `scoped`), qui vaut l'encre éteinte `--text-color-faint` en
    sombre — la même que le trait des avatars. Le clair est inchangé.
  - **Chemins mis en valeur** : doré (`--gold`) pour le vainqueur, vert
    (`--primary`) pour nos participants, 4 px au lieu de 3. Le participant qui
    emprunte un trait est celui qui apparaît au tour suivant à la place
    correspondante (matchs 2i et 2i+1 → les deux cases du match i) ; rien de joué
    = rien de mis en valeur. L'attribution des 63 connecteurs à leur match a été
    faite **par géométrie** (le premier point d'un trait tombe dans la boîte de
    combat de son match) plutôt qu'à la main.
    Le vainqueur porte en plus un **bord doré sur ses cases**, à tous les tours
    qu'il a traversés : le graphe `provide` le vainqueur, chaque case s'y compare
    (`sameEntry`, sur le lien, à défaut le nom) — sans quoi il aurait fallu
    passer la comparaison en prop aux 126 cases du template.
  - **Connecteurs décalés de 10 unités** (huitièmes → quarts, quarts → demies,
    demies → finale, soit 14 traits) : leur segment vertical d'arrivée mourait
    au bord d'une case, exactement sous l'étiquette du nom (12,8 unités de haut)
    qui l'avalait en entier. La barre horizontale s'éloigne donc de la case
    d'autant, ce qui sort le vertical de sous l'étiquette. **Épaissir le trait
    ne marche pas** (essayé : 4 px au lieu de 3), il faut le décaler.
    Ce décalage avait emmené le **départ** de 8 de ces traits près du coin de
    leur boîte de combat au lieu du milieu de son bord (repéré par Pierre en
    haut à droite) : ils repartent du milieu et prennent leur hauteur par un
    petit décrochement une fois la boîte quittée. Vérifiable d'un coup, les 63
    connecteurs devant partir au milieu du bord de leur boîte (`rect.fight`).
  - **Chemins animés : essayé, retiré.** J'avais fait couler les chemins mis en
    valeur vers le trophée (tirets `14 6` et `stroke-dashoffset` décroissant, à
    la manière des « fourmis en marche »). **Pierre veut une ligne pleine** : la
    couleur suffit à raconter le parcours, l'arbre n'a pas besoin de bouger.
    À garder si l'idée revient un jour : animer le tiret repeint la zone du
    trait, donc les poireaux et les étiquettes qui s'y trouvent, et le SVG en
    porte plus de cent — en `linear`, 96 images lentes sur 150 (à 6× de bridage
    CPU sur un arbre de 64) contre 7 par paliers (`steps(6)`, 5 images par
    seconde). Et mesurer sur une machine calme : les autres onglets Chrome
    ouverts suffisent à noyer l'écart (frames à 500 ms, animation ou pas).
  - **Nom des participants** : taille FIXE (8 unités) au lieu de proportionnelle
    à la case, et marge intérieure resserrée. La taille suivait la case, ce qui
    coupait très tôt les noms des petits tours — les plus nombreux — et donnait
    deux tailles de texte par colonne.

- **2026-08-23, lot 16 — `lw-select`** : 5e contrôle maison, remplaçant de
  `v-select`. Le `v-menu` est conservé sous lui (primitive de positionnement
  admise, principe 4), donc l'ancrage, l'overlay et le focus restent à Vuetify
  et seul l'habillage est repris ; la surface flottante vient déjà de la
  coquille v3, qui traite `.v-menu > .v-overlay__content`. L'objet exposé aux
  slots garde la forme de Vuetify (`raw`, `value`, `title`, `props.title`)
  pour que les call sites migrent sans réécrire leur contenu — sauf ceux qui
  passaient par les slots de `v-list-item` (`#prepend`, `#append`), dont la
  ligne redevient un élément ordinaire. Migrés : les deux filtres de la liste
  des équipes, les deux sélecteurs de devise de la banque et les deux menus de
  statut/priorité d'un sujet du forum. 10 tests.

- **2026-08-24, lot 17 — les historiques de combat** : la carte de combat
  (`fight-history`, affichée sur les pages poireau, éleveur, équipe, groupe,
  l'accueil et `/history`) portait encore les aplats pastel du v2 — `#b6f182` /
  `#ffb3ae` en clair, `#3c651b` / `#76342f` en sombre, aucun jeton derrière. Elle
  prend la langue de la **vue tableau du même historique**, qui était déjà sur
  les jetons `--result-*` : rangée neutre (`--background-row`), trait
  `--border-strong`, et la couleur du résultat dans un **liseré de 4 px**
  (`box-shadow: inset`) plus une teinte légère de la rangée (14 % pour la
  victoire et la défaite, 10 % pour l'égalité). Les deux vues d'un même
  historique se coloraient jusqu'ici différemment.
  - Le bouton central se détachait par un **voile blanc**
    (`rgba(255, 255, 255, 0.3)`), invisible sur une surface claire et
    éclaircissant sur une sombre : il prend un trait de chaque côté et un survol
    neutre.
  - Son icône était en `--grey-2`, un gris **jamais redéfini en sombre**
    (#1E2A20) : une encre presque noire sur la rangée sombre. Elle passe à
    `--text-color-secondary`, et l'icône du potager — un PNG noir — est inversée
    en sombre, comme le fait déjà la barre de page (`leekwars-shell-v3`).
  - Même traitement pour la **barre de tournoi** (`tournament-history`) et pour
    les **chips de filtre** de `/history` : couleurs prises aux jetons
    (`--result-*`, `--info`) et rayons passés par les variables — donc pilules et
    pastilles rondes conservées en v2, angles francs en v3.
  - **Peau v2 embarquée**, sur le patron des contrôles maison : aplats pastel,
    valeurs sombres et couleurs de chips d'origine restent sous `body.v2`.
  - Mesuré sur la bêta locale, 12 combats de toutes formes (solo, éleveur,
    équipe, boss, battle royale, guerre, chasse, colosse, tournoi, défi, en
    génération) dans les deux thèmes : noms 10,6 à 17,4 ; heure 5,7 à 7,1 ;
    liseré contre rangée 3,5 à 9,6 — au-dessus des seuils de 4,5 et 3. Rendu v2
    vérifié à l'écran, inchangé.

- **2026-08-24, lot 18 — le pied de page** : un bandeau qui prend toute la
  largeur, au lieu d'une grille tassée à gauche. `auto-fill` réservait **5
  pistes de 296 px pour 4 colonnes de contenu** et laissait 360 px de vide à
  droite ; `auto-fit` efface les pistes vides. Le conteneur des biscuits (vide —
  ses biscuits sont en `position: fixed`) comptait lui aussi comme une case de
  la grille : il passe hors flux, sans quoi il volait un quart de la largeur.
  - Le pied de page **reprend les 20 px de marge du gabarit central**
    (`margin: 0 -20px`, au-dessus de 600 px et hors mode application, où cette
    marge n'existe pas) pour aller d'un bord à l'autre, et cale ses colonnes sur
    la gauche des panneaux plutôt que sur un retrait de 45 px hérité d'une autre
    mise en page. Quand le menu est là, le bandeau part de son bord droit : les
    marges négatives sont relatives au conteneur, il ne glisse pas sous la barre
    fixe. Séparé du contenu par le trait (`--border-strong`), pas par un fond.
  - **Le survol le faisait disparaître en thème clair** : il montait les liens à
    `--grey-11` et les intitulés à `--grey-8`, deux gris de l'échelle claire que
    le bloc sombre ne redéfinit pas — 1,23 et 2,36 mesurés sur le fond
    extérieur clair. Ils passent aux encres du thème : 14,2 et 5,8 en clair,
    17,1 et 9,2 en sombre (repos inchangé, 5,8 et 9,2). C'est le même défaut que
    la ligne de version, déjà rattrapée dans `leekwars-shell-v3`.
  - v2 inchangé, vérifié à l'écran : ni trait ni débord, retrait de 45 px
    conservé, 4 colonnes dans le gabarit de 1100 px.

- **2026-08-24, lot 19 — le potager** : les onglets de mode (Solo, Éleveur,
  Équipe, Arènes, Boss) n'avaient jamais été repris.
  - **L'onglet indisponible était peint en `--grey-11`**, un gris de l'échelle
    claire que le bloc sombre ne redéfinit pas : case claire sous une encre
    claire, **1,38 mesuré sur l'intitulé et 1,34 sur le compteur** — illisible.
    Il prend `--background-disabled`, la surface que le thème réserve à ça, et
    l'`opacity: 0.4` qui écrasait tout par-dessus disparaît. L'intitulé doit
    être assombri explicitement : c'est un `h2`, qui tient sa couleur de
    `global.scss` et n'hérite donc pas de celle de l'onglet — sans ça,
    l'indisponible se lisait comme un onglet ouvert (11,7).
  - **L'onglet actif prenait un aplat `--pure-white`**, qui vaut le fond de page
    en sombre : la case courante y devenait la plus sombre de la colonne. Il
    passe au trait et à l'encre verts, le parti pris déjà retenu pour les
    onglets de la barre de page (« un trait vert, pas un aplat vert »).
  - Trois états désormais distincts et mesurés, clair et sombre : indisponible
    5,2 / 6,3 · disponible 16,6 / 16,1 · actif 7,1 / 13,7.
  - Le **halo pulsé** du point « arène » gardait le vert du v2 écrit en dur
    (`rgba(95, 173, 27, .6)`) alors que le point suit `--primary` : en v3 le halo
    ne parlait plus la couleur de sa source. Il passe en `color-mix` du vert du
    thème — valeur identique au pixel en v2. Les deux `border-radius: 50%` du
    point passent par `--radius-pill` (ronds en v2, francs en v3).
  - Repéré par un **audit de contraste automatisé** passé sur les pages
    connectées (potager, inventaire, marché, trophées, banque, messages,
    notifications, réglages, classement, forum, page poireau) dans les deux
    thèmes : il parcourt les éléments porteurs de texte, calcule le fond effectif
    en remontant les ancêtres et compare au seuil. Le reste de ces pages passe.

- **2026-08-24, lot 20 — la bannière de validation de compte** : elle venait
  d'un autre design — coins à 14 px, dégradé orange écrit en dur et animé, et
  une **ombre floue d'élévation** (`0 6px 24px rgba(0,0,0,.35)`), exactement ce
  que le principe 1 bannit sur une surface flottante. Elle prend le traitement
  des autres surfaces flottantes (surface d'en-tête, trait fort, `--shadow-pixel`)
  et garde son caractère précieux par le **motif validé sur les notifications de
  trophée** : liseré d'or (`--rank-first`) et halo interne — une émission de
  lumière, pas une élévation. C'est un cas où le halo a sa place : une
  récompense méritée, pas du mobilier.
  - Le bouton d'appel était de l'encre `#b06000` sur un aplat blanc, **4,33
    mesuré**, sous le seuil ; il reprend l'or en aplat et le relief à trois états
    des boutons d'accent (lot 8) — 13,4 en sombre, 5,9 en clair. Le
    grossissement au survol (`scale(1.05)`) laisse la place au pixel push.
  - La bulle repliée suit : aplat d'or, trait, ombre pixel, plus de `text-shadow`.
  - v2 inchangé : dégradé, coins à 14 et 16 px, ombres floues conservés.

- **2026-08-24, lot 21 — le loader** (le dernier objet Material de la coquille,
  137 points d'appel, listé au chantier restant). Trois versions avant la bonne :
  un carré tournant par paliers de 90° (« trop tiède »), une chenille sur un
  anneau 3×3, puis — direction donnée par Pierre, **abstrait et technologique
  plutôt que végétal** — une **pluie de données**. Une goutte tombe dans chacune
  des cinq colonnes d'une grille 5×5 : tête vive, puis une traînée de deux blocs
  qui s'éteint.
  - **Chaque colonne part avec son propre décalage** (0, 3, 1, 4, 2 et non
    0…4, qui donnerait une diagonale réglée au métronome) : rien n'est jamais
    synchrone, c'est ce qui donne la lecture « flux » plutôt que « mire ». Le
    cycle compte dix temps pour cinq rangées — la goutte traverse en cinq temps,
    la colonne se tait les cinq suivants, et comme les colonnes sont décalées
    l'objet n'est jamais vide.
  - **Une seule règle d'animation pour les 25 cases** : toutes jouent la même
    chute d'opacité et c'est leur `--t` — le temps du cycle où la goutte leur
    passe dessus, calculé dans le script — qui les décale. La chute est jouée en
    paliers (`steps(3)`), donc la traînée a des niveaux francs. Seule l'opacité
    est animée : compositable, aucun repaint. Piège du signe : un délai
    `-0.1s * --t` allume les rangées basses **en premier** et la goutte remonte ;
    c'est `0.1s * --t - 1s` qu'il faut — l'ordre est bon et le délai reste
    négatif, donc aucune case n'attend son tour au premier affichage.
  - La boîte reste celle d'avant : les 137 points d'appel ne bougent pas. Le
    disque Material est conservé comme peau v2, les deux sont rendus et la
    coquille n'en montre qu'un. En mouvement réduit la pluie ralentit à 3 s au
    lieu de s'arrêter — un loader figé se lit comme une page bloquée.
  - Méthode : les candidats ont été dessinés dans un banc d'essai HTML capturé en
    ligne de commande (pellicules de toutes les images du cycle, aux trois
    tailles courantes, dans les deux thèmes), puis l'aperçu final a été rendu
    avec le **CSS réellement compilé par Vite** pour le composant. Écartés en
    chemin : l'égaliseur, le balayage, la puce, le serpent, le sonar, le dé, et
    trois poireaux.

- **2026-08-24, lot 22 — le petit mobilier récurrent** : audit de doctrine passé
  sur le rendu (et non sur le code) — pour chaque élément visible, l'ombre
  calculée avec un flou non nul et le rayon calculé non nul. Sur potager,
  marché, inventaire, trophées et classement, il ne restait que quatre objets,
  mais très répétés :
  - **Les drapeaux** (50 sur la seule page de classement) : coins arrondis et
    ombre floue portés par l'image, plus un liseré noir à 10 % en `multiply` —
    juste sur une page claire, invisible sur le presque-noir du v3, où un
    drapeau sombre se fondait dans le fond. Angles francs, ombre retirée, et le
    liseré passe au trait du thème en composition normale : c'est lui qui
    détache le drapeau.
  - **Le badge de talent** : disque de 34 px et pilule à 14 px, sur `--pure-white`
    — qui vaut le fond de page en sombre, où le badge s'effaçait. Il devient une
    pastille franche sur la surface d'en-tête, détachée par le trait.
  - Le **menu du marché** (ombre portée sous chaque entrée) et le **bandeau de
    saison** (ombre de 3 px) passent au trait.
  - Après coup, l'audit ne trouve plus ni ombre floue ni rayon sur ces pages.

- **2026-08-24, lot 23 — `v-select`, les six derniers** : plus aucun
  `<v-select>` dans le code. Cinq migrations mécaniques (thèmes de l'éditeur,
  animations de l'admin, tri du forum, motif de modération, dépôt du panneau
  git) et `title-picker`, qui rendait ses quatre listes avec les slots de
  `v-list-item` : chaque ligne redevient un élément ordinaire, l'icône et la
  rareté s'y écrivent, la rareté poussée à droite par `margin-left: auto` là où
  `#append` la plaçait.
  - `lw-select` gagne trois choses réclamées par ces appelants : les slots
    **`prepend` / `append`** (l'équivalent des `prepend-inner` / `append-inner`
    de Vuetify, pour l'icône de branche et l'indicateur de chargement du panneau
    git) et une prop **`placeholder`**, estompée tant que rien n'est choisi.
  - **Défaut trouvé au passage** : la racine du composant étant un `v-menu`, les
    attributs de l'appelant — à commencer par sa `class` — s'y perdaient au lieu
    d'habiller la boîte. Les feuilles des call sites (`.filter-select`,
    `.status-select`, `.repo-select`, `.order-select`…) ne s'appliquaient donc
    plus **depuis le lot 16**, sans rien signaler : les deux filtres de la liste
    des équipes avaient perdu leur `max-width: 200px`. `inheritAttrs: false` +
    `$attrs` reporté sur le champ, et les règles concernées passent en `:deep()`
    puisque le champ ne porte pas l'attribut de portée de l'appelant. Les règles
    qui rhabillaient les rouages de `v-select` (`.v-field`, `.v-select__selection`,
    `label.v-label`…) sont supprimées, elles n'avaient plus d'objet.
  - Deux gris de l'échelle claire employés comme encre sur des lignes de liste
    en profitent : la description d'un motif de modération et la rareté d'un
    titre passent à `--text-color-secondary`.
  - Build de production complet passé, et vérifié à l'écran sur le tri du forum
    et les filtres d'équipes (la largeur maximale s'applique de nouveau).

- **2026-08-26, lot 24 — les widgets de l'accueil** (retours de Pierre sur
  talent, forum et classement) :
  - **Widget « Talent et derniers combats »** : le titre interne « Derniers
    combats » disparaît (l'en-tête du panel le dit déjà). Surtout, la
    **compaction des cartes de combat est supprimée** : sous 300 px de panel
    elles tombaient à 34 px, ce qui **faisait remonter l'heure** (« il y a
    2 jours », calée en bas de la carte) **dans la ligne des noms**. Mesuré :
    à 34 px l'encre du nom et celle de l'heure se croisent de **2,6 px**, à
    42 px il reste **2,7 px** entre les deux. On montre donc moins de combats
    plutôt que des combats écrasés — `useFitCount` s'en charge déjà.
    Le ratio victoires/nuls/défaites passe aux **espaces de milliers**
    (`$filters.number`), et le widget gagne l'**historique de talent** de
    l'éleveur en sparkline (`clamp(70px, 30cqh, 120px)`, masquée sous 200 px de
    panel : les combats passent d'abord). Pas d'axes — à cette hauteur ils
    mangeraient la courbe ; la date et la valeur se lisent au survol. La courbe
    se reconstruit au changement de thème et de design (voir **Courbes de
    talent** plus bas, dont elle partage désormais le dataset).
  - **Widget Forum** : la liste **remplit la hauteur du panel** (`useFitCount`,
    widget passé en `noScroll`) au lieu de six lignes fixes — le service en
    renvoie 20 et le client coupe. Chaque ligne gagne la **catégorie** (puce ;
    clé `forum-category.<name>` sauf forum d'équipe, dont le nom est déjà celui
    de l'équipe), la **date d'ouverture** et, en fin de ligne, l'**auteur de la
    dernière réponse avec son ancienneté**. La date d'ouverture est en
    **numérique** : la forme longue du site (« 7 novembre 2024 ») prend une
    centaine de pixels et, sur une ligne partagée à quatre, c'est le nom de
    l'auteur qui payait — il tombait à **5 px** faute de plancher, parce qu'il
    est le seul élément de la ligne à accepter de rétrécir (`overflow: hidden`
    met son minimum automatique à 0, là où la catégorie et les dates gardent
    leur min-content). Il a désormais un `min-width`.
  - **Widget Classement** : le titre du panel précise la catégorie
    (« Classement — Éleveurs »), la liste prend des **intitulés de colonnes**
    (`main.place` / `main.leek|farmer|team` / `main.talent`, aucune clé
    nouvelle), l'**or, l'argent et le bronze passent sur le nom** en plus du
    rang, et les noms portent le **rich-tooltip** de leur catégorie.
    Deux pièges : la colonne de rang est passée à **46 px** — dimensionnée pour
    l'intitulé et non pour deux chiffres, sinon « Place » débordait sur la
    colonne des noms (les langues les plus longues, Placering, Peringkat, s'y
    coupent) ; et la classe d'un appelant **ne se pose pas sur un
    `rich-tooltip`**, dont la racine est un `v-menu` qui avale les attributs —
    c'est le défaut du lot 23, elle va sur l'activateur.
    Au passage, les couleurs de podium écrites en dur (`#f1c40f`, `#bdc3c7`,
    `#cd7f32`) passent aux jetons `--rank-*`, et le vert de la ligne « moi » au
    `--primary` du thème (valeur identique au pixel en v2).
  - Vérifié à l'écran sur la bêta locale, deux thèmes, plus non-régression v2
    (aplats pastel des cartes de combat conservés). Contrastes mesurés :
    en clair 4,89 (or) / 5,68 (argent) / 6,81 (bronze) / 6,74 (intitulés et
    métadonnées) / 16,6 (puce de catégorie) ; en sombre 12,9 / 11,1 / 5,5 /
    8,7 / 16,1 — tous au-dessus du seuil de 4,5.
  - **Demande côté serveur** : `forum/get-last-topics` renvoie désormais
    `date`, `category_name`, `category_team`, `last_message_owner`, et 20 sujets
    au lieu de 6. Sans ce déploiement, la catégorie et la date d'ouverture
    restent vides (le widget ne casse pas).

- **2026-08-26, lot 25 — l'accueil et le menu sur mobile** (retours de Pierre) :
  - **Retour à l'accueil impossible sur mobile** : `app.vue` ne rend la barre du
    haut que si `!LeekWars.mobile || !connected`, or c'est elle qui porte le logo
    cliquable vers `/`. Une fois connecté sur téléphone, la page d'accueil
    n'était plus atteignable. Le menu gagne donc une entrée **Accueil**
    (`LeekWars.mobile` seulement, sur le patron de l'entrée Console ; sur grand
    écran le logo suffit). Nouvelle clé globale `main.home`, insérée
    textuellement dans les 17 `main.json` après `back_to_home` — ces fichiers ne
    sont pas triés, et une réécriture par sérialiseur aurait reformaté le reste.
  - Effet de bord corrigé dans la foulée : le premier poireau portait
    `router-link-active` sur `/` — un reste de l'époque où l'accueil était sa
    page. Avec la nouvelle entrée, **deux entrées s'allumaient en même temps**.
  - **Titre de page sur mobile** : `global.scss` masque le `h1` de toutes les
    pages connectées en mode application (`#app.app.connected .page .page-bar
    h1`), le menu disant déjà où l'on est. L'accueil fait exception — c'est la
    seule page qu'on n'atteint pas par une entrée de menu. L'override vit dans
    le `scoped` de `home.vue` : son attribut de portée suffit à passer devant la
    règle globale, à un cran de spécificité près, sans toucher aux autres pages.
  - **Entrées de menu trop hautes en v3 sur mobile** : `#app.app .menu .section`
    (menu.vue) imposait `line-height: 42px` et `background: transparent`, une
    règle héritée du v2 qui écrasait le `line-height: normal` et le `background`
    du shell v3. Résultat : **60 px de haut pour un libellé de 12,5**, et
    l'entrée active privée de sa surface, réduite à son liseré. La règle est
    désormais réservée à `body.v2` ; en v3 les marges du mockup (9/16) suffisent,
    avec un simple `min-height: 44px` pour la cible tactile. Mesuré : entrée de
    60 → **44 px**, liste de 716 → **540 px**, et l'entrée active retrouve
    `--background-row`. v2 vérifié inchangé (42 px d'interligne, entrée de 40 px,
    fond transparent).

- **2026-08-26, lot 26 — la coquille mobile** (retour de Pierre : « en mobile
  thème clair c'est pas mal cassé »). Le mode application n'avait jamais été
  repris : il gardait la peau du v2, ce qui ne se voyait qu'à moitié en sombre
  et cassait franchement sur le parchemin.
  - **Barre d'application** (`bar.vue`) : aplat vert `#4b9e06` écrit en dur,
    encre `--white` — le piège du lot 10, jamais redéfini en sombre — et une
    **ombre floue d'élévation**, que le principe 1 bannit. Elle prend la surface
    d'en-tête et l'encre du thème, comme la barre de page sur grand écran, et se
    détache par le trait. Le compteur de notifications passe du `#ff6f00` en dur
    (qui ne tenait que sur le vert) au couple `--primary` / `--primary-text`,
    **exactement celui du compteur du header sur grand écran**.
  - **Panneau du menu** (`menu.vue`) : `#app.app .menu` peignait le fond avec
    `--grey-1` (#0E1410) et le bloc éleveur avec `--grey-2` (#1E2A20). Ce sont
    des **valeurs fixes, pas des surfaces de thème** : le menu restait presque
    noir en clair, alors que le shell v3 avait déjà passé toutes ses encres à
    celles d'un panneau clair — d'où l'encre sombre sur fond noir de la capture.
    Le panneau prend `--panel-background` et le trait, comme sur grand écran ; le
    bloc éleveur la surface d'en-tête et l'encre du thème.
  - **Bouton burger** : le shell habille `.menu-button` en *poignée de repli*
    (petit carré bordé posé dans le vide, pour le menu et le panneau social sur
    grand écran). Dans la barre d'application ce n'est pas une poignée mais son
    premier bouton : sa surface de panneau y cousait un carré plus clair à même
    le bandeau. Transparent, sans trait, à l'encre de la barre.
  - **Images d'action de la barre** : `garden.png`, `market.png`, `potion.png` et
    `github_white.png` sont les PNG **blancs** du v2 — mesurés entre 245 et 255
    de luminosité, contre 0 pour la famille `icon/black/`. Taillés pour l'aplat
    vert, ils disparaissaient sur le parchemin : on les retourne en clair
    seulement, l'inverse exact de ce que le shell fait pour les icônes noires en
    sombre (lot 17).
  - Contrastes mesurés sur la coquille : **6,7 à 17,4 en clair**, 8,4 à 15,6 en
    sombre. v2 vérifié inchangé au pixel (vert `rgb(75,158,6)`, menu `#222`,
    bloc éleveur `#333`, compteur orange, aucun filtre d'image).
  - **Conséquence assumée** : la barre verte disparaît aussi en **sombre**. Le v3
    n'a pas de bandeau de marque, et la barre de page sur grand écran n'en a pas
    non plus — mais c'est un changement visible que Pierre n'avait pas demandé.

- **2026-09-03 — icônes colorées du menu** (idée de Pierre : « prendre les
  icônes actuelles, rajouter un peu de bordures noires — signe distinctif des
  assets LW — de la couleur dans la palette, en SVG »). Les glyphes mdi du menu
  v3 deviennent des **assets** : `public/image/menu/<entrée>.svg`, générés par
  `scripts/generate-menu-icons.mjs` (le path mdi découpé en sous-tracés — tous
  absolus chez mdi, un `M` chacun — dessinés du plus grand au plus petit, chacun
  avec son aplat et un trait noir **sous** l'aplat via `paint-order: stroke`,
  qui fait la silhouette et la séparation entre pièces ; les vrais trous, anses
  de la coupe, refusionnés dans la pièce parente en `evenodd` ; maison et
  blason coupés par une zone polygonale pour une 2e couleur). Décisions prises
  sur la planche d'essai `docs/specs/menu-icons/planche.html` (autonome,
  réglages aussi par l'URL) : **multicolore** (« un peu plus multicolores »),
  **aplat pur** — ni ombre ni reflet —, contour de 2 unités, et **les mêmes
  couleurs vives dans les deux thèmes** : une lecture adoucie pour le clair a
  été essayée (encres fondues à 30 % dans le parchemin) et Pierre a préféré
  garder la version normale pour les deux — comme une puce ou une arme, l'icône
  est une image, le contour noir porte le contraste. Dans `menu.vue`, l'`<img>`
  n'est rendu qu'en v3 (`!legacyTheme && !xpTheme`), le v2 et le thème XP
  gardent glyphes et PNG ; 22 px pour un viewBox qui inclut le contour. L'entrée
  active garde son liseré et son intitulé verts, l'icône ne change plus de
  couleur. Non couvert : la barre d'application mobile (`bar.vue`), les
  onglets de barre de page et les notifications restent sur les glyphes mdi.
- **2026-09-03 — la barre de page vide sur mobile** (retour de Pierre, capture
  de l'inventaire : « enlever la barre en haut de la page avec le pointillé +
  icône »). En mode application, `global.scss` masque le `h1` de la barre de
  page et la barre d'application porte déjà le nom de la page et ses actions ;
  restaient l'icône de page, la hauteur minimale de 72 px du lot titre et le
  pointillé vert — **72 px de vide en tête de chaque page**. Le shell v3 efface
  les trois sous `#app.app` (icône masquée, `min-height: 0`, pointillé et marge
  retirés) ; les onglets qu'une page garderait dans sa barre restent visibles.
  **L'accueil fait exception**, comme pour le `h1` (lot 25) : seule page qui
  montre son titre sur mobile, il remet hauteur et pointillé dans son `scoped`,
  sous `body:not(.v2)` puisque le pointillé n'existe qu'en v3. Vérifié sur la
  beta (UA mobile émulé, règles injectées) : inventaire 72 → 0 px, contenu
  calé à 56 px sous la barre d'application ; accueil inchangé à 72 px avec son
  pointillé. Le mode application se décide à l'**user-agent** (`/Mobi/`), pas
  à la largeur : un viewport étroit ne suffit pas à le tester.
- **2026-09-03 — les graphiques du rapport de combat sur mobile** (retour de
  Pierre, capture) : la courbe de vie suivait un ratio fixe de 2,66 sans
  plancher (**143 px** de haut sur un téléphone pour douze tours et huit
  courbes) ; elle passe en `maintainAspectRatio: false` dans une boîte
  `aspect-ratio: 2.66` + `min-height: 260px` — même hauteur qu'avant sur grand
  écran, jamais moins de 260 px. L'anneau de répartition faisait **360 px**, toute
  la largeur : `.damages > * { flex: 270px 0 0 }` dimensionne la colonne de
  l'anneau sur grand écran, et en colonne (≤ 800 px) cette base devenait une
  hauteur pendant que Chart.js prenait la largeur du parent. L'anneau est boxé à
  250 px au plus et centré (`.donut`), la légende garde toute la largeur, et
  les enfants passent en `flex: none` en colonne.
- **2026-09-03 — les « squares »** (les notifications qui surgissent en bas à
  droite, `squares.vue` ; demande de Pierre : « plus beau et plus fin, et qui ne
  commencent pas tout en bas de l'écran pour ne pas masquer un champ texte »).
  Jamais repris depuis le v2 : carte Material à ombre floue, icône de 60 px,
  badge rond de résultat en absolu (positionné par rapport au CONTENEUR, pas à
  la carte — quirk v2 laissé tel quel), et une pile qui partait du bord bas, sur
  le champ d'envoi du panneau social ou d'un chat. En v3, dans le `scoped` du
  composant sous `body:not(.v2)` : panneau au trait + ombre pixel, **liseré de
  3 px à gauche qui dit la nature** (vert par défaut ; or + halo pour un
  trophée et bleu pour un bigwin, les rangées de notification du shell
  s'appliquent déjà à `.notif-trophy`/`.notif-bigwin` mais leur teinte est
  posée sur du transparent — refaite en `color-mix` sur `--panel-background`,
  une carte flottante doit être opaque ; couleur du résultat pour un combat,
  classes `win`/`defeat` posées seulement si l'option « résultats dans les
  notifications » est active, comme le glyphe), glyphe de 22 px dans l'accent,
  image ou avatar de 32 px (carré bordé), titre 13/500 et message 12,5 en encre
  secondaire, **deux lignes au plus** chacun, 280 px de large (moins sur un
  écran étroit), résultat en glyphe coloré en bout de ligne, pile à **88 px du
  bas** (une barre de saisie) et 16 px du bord droit. Hauteur d'une carte :
  60 → 53 px (70 avec un titre sur deux lignes). Maquetté à chaud sur la beta
  en mobile (notifications de test poussées par `$store.commit('notification')`
  avec le `setTimeout` de 5 s neutralisé le temps de la capture).
- **2026-09-04, retours de Pierre sur la beta** :
  - **Valeur totale de l'inventaire** (`inventory.vue`) : encore un `--grey-13`
    posé sur l'en-tête d'un panneau — crème sur crème, **1,0 mesuré**, il ne
    restait que l'icône des habs. Passée à `--panel-header-color` comme les
    autres habitants du slot `#actions` (15,9 en clair, 15,6 en sombre,
    inchangé en v2 où le jeton vaut le même `#eee`). Le motif est le même que
    `.views-counter` et `.level-talent .level` traités dans `shell-v3.scss` :
    tout ce qu'un composant glisse dans `#actions` doit prendre l'encre de
    l'en-tête, jamais une encre claire fixe.
  - **Icône centrale des cartes de combat** (`fight-history.vue`) : centrée par
    une `line-height` et des marges calées sur la rangée de 42 px du v2, elle
    sortait 5 px trop haut (mesuré sur le sablier d'un combat en cours) — un
    `<v-icon>` est une boîte inline-flex d'1 em, posée sur la ligne de base
    puis remontée par sa marge basse, et la rangée fait 52 px en v3. Centrage
    par le flex du conteneur, comme la vue tableau du même historique.
- **2026-09-05, retours de Pierre sur la beta** :
  - **Dialogue « IA et composants » de la page poireau** (`leek.vue`,
    `explorer.vue`) : l'explorateur d'IA était figé à 460 px pendant que la
    grille de composants allongeait le popup, et c'est le popup entier qui
    défilait. Le dialogue tient maintenant dans la hauteur de la fenêtre
    (`max-height` calculé sur la chaîne Vuetify — l'overlay borne à
    `calc(100% - 48px)` bien avant le `max-height` que `popup.vue` pose sur sa
    zone de contenu, et un `100%` ne s'y résout pas), et **chaque colonne
    défile pour elle-même**. Le défilement d'ensemble ne revient que sous les
    hauteurs minimales des deux colonnes (petit écran) ou en dessous de 800 px
    de large, où elles s'empilent.
  - **Pastilles de quantité** (`leek.vue`, armes/puces/composants/chapeaux) :
    `#0a0` en dur sous une encre crème (`--grey-13`), **2,8 mesuré** et un vert
    étranger au v3. Passées à `--primary-surface` / `--primary-surface-text`.
  - **Marqueur lu / non lu du forum** (`forum.vue`, `forum-category.vue`,
    `home-widget-forum.vue`) : les PNG `forum_seen` / `forum_unseen` (un
    poireau vert de 40 px, rattrapé en sombre par un `filter: invert(0.85)`)
    deviennent le **losange des intitulés de section du menu** (« ◆ POIREAUX »,
    `leekwars-shell-v3.scss`), à l'encre du thème : `mdi-rhombus` en
    `--primary` pour le non-lu, `mdi-rhombus-outline` discret pour le lu,
    20 px, centré dans sa colonne. Le titre passe en gras sur une ligne non
    lue, comme le faisait déjà le widget forum de l'accueil. Colonne ramenée de
    55/50 px à 34 px. Les deux PNG ne sont plus référencés nulle part ; ils
    restent dans `public/image/`.
    Première proposition refusée par Pierre : une **pastille ronde**
    (`mdi-circle`). Le principe 2 ne parle pas que des `border-radius` — il vaut
    aussi pour la **forme d'un glyphe**. Un marqueur d'état se prend dans la
    géométrie du thème (losange, carré, chevron mono), jamais dans un rond.
  - **Rangées du forum, survol et clic** (`forum.vue`, `forum-category.vue`,
    demande de Pierre : « le style hover / active officiel, comme sur le widget
    Mes poireaux ») : les catégories et les sujets gardaient le survol du v2 —
    `--pure-white`, qui EST la surface du panneau en v3 (survol invisible), et
    une `--elevation-1`, ombre floue interdite par le principe 1. Ils prennent
    les états des cartes du widget « Mes poireaux » : `--background-row` et
    `--border-strong` au survol, `--primary` sur le liseré au clic, transition
    de 0,12 s. Le liseré est déjà là au repos, la rangée ne bouge pas d'un
    pixel. Sous `body:not(.v2)`, le v2 garde son ombre.
  - **Marché, item choisi** (`market.vue`, même demande) : la vignette
    sélectionnée (`.router-link-active`) portait le même couple perdant —
    `--pure-white` et `--elevation-1` — et la grille n'avait aucun survol. Elle
    prend les mêmes états : survol sur `--background-row` / `--border-strong`,
    **liseré `--primary` sur l'item choisi**, ce qui est exactement ce que fait
    déjà le menu de la coquille pour sa page courante. Le survol des raccourcis
    de section (`.menu .item`, « Combats », « Armes »…) passe du même
    `--pure-white` invisible à la surface de rangée. Les compteurs de
    possession rentrent au passage **dans** le carré de la vignette (ils
    étaient à `-5px`, donc à cheval sur la voisine : l'item sélectionné se
    retrouvait avec les chiffres de ses deux voisins collés à son liseré).
  - **Carte d'IA, survol et clic** (`ai.vue`, même demande) : le survol
    repeignait le contour en vert, ce que la doctrine réserve à l'actif. Il
    pose désormais un **voile d'encre sur la surface** (`--ai-lift`, 8 % de
    `--text-color`, donc clair en sombre et sombre en clair, appliqué
    par-dessus la teinte de la feuille — il marche sur les quatre couleurs
    comme sur la feuille neutre), et c'est le clic qui allume le contour.
  - **Notification de trophée** (`leekwars-shell-v3.scss`, « un truc plus
    jaune/doré, pas transparent », puis « revenir à avant avec la couleur dorée
    pleine ») : la rangée était une teinte de 10 % mélangée à du
    **transparent**, donc délavée. Elle est un **aplat d'or plein** :
    `--gold` / `--gold-text`, la paire des boutons « Récupérer » (5,9 de
    contraste en clair, 12,9 en sombre) — le dégradé d'or du v2 traduit en v3,
    une seule couleur et des angles francs. Plus de liseré ni de halo, qui
    n'ont rien à dire sur un aplat ; l'accent (grande coupe) passe à l'encre
    sombre, comme les flèches des boutons dorés, et le reflet de survol devient
    une bande blanche. Craignait-on pour les vignettes ? Non : les
    notifications servent toujours le SVG du thème CLAIR (`notification-builder`,
    l'inversion en sombre épargne ces rangées), donc des dessins sombres qui
    tiennent sur l'or.
    Étape intermédiaire écartée : `--gold` à 38 % dans la surface du panneau,
    opaque mais trop discret pour lui.
  - **Barres de la page Trophées** (`leekwars-shell-v3.scss`, demande de
    Pierre) : la barre globale, celle de chaque catégorie et la petite jauge de
    chaque trophée étaient restées sur le `#30bb00` rond du v2, avec les
    rayures diagonales de `.striked`. Elles rejoignent la **jauge segmentée**
    du v3, déjà en place sur la collection et l'XP : piste creuse, cadre au
    trait fort, remplissage en blocs. Le `.blue` de la barre globale (tout
    débloqué) et le `.full` d'un trophée décroché — un gris qui disait « c'est
    fini » — prennent l'état complet en `--info`. Sans animation sur les
    petites jauges : il y en a une par carte, la page entière bougerait ; le
    reflet ne va qu'à la barre de tête de page.
    Deux pièges de spécificité, les mêmes que pour les barres déjà traitées :
    les rayures de `.striked` vivent dans `global.scss` et se coupent au
    `::after`, et la carte de la liste imbrique sa règle d'un cran de plus
    (`.trophy .trophy-bar .bar`) que la page d'un trophée — les deux
    sélecteurs sont nommés, sinon la plus profonde garde ses couleurs du v2.
  - **Trophées mis en avant** (`trophies.vue`, demande de Pierre) : les trois
    vitrines (meilleurs, plus rares, derniers) étaient figées à 7 trophées.
    Elles en montrent autant qu'il en tient, **jusqu'à 10**, mesuré sur la
    largeur de la colonne. Les colonnes passent en `flex: 1` pour ça : la
    mesure ne doit pas porter sur la rangée d'icônes, dont la largeur dépend du
    compte cherché — il se figerait au premier rendu et ne remonterait jamais.
- **2026-09-06 — anneaux du widget Collection de l'accueil**
  (`home-widget-collection.vue`, retour de Pierre : « pas trop dans le thème
  avec les barres arrondies ») : les huit catégories étaient des
  `v-progress-circular`, des **anneaux**, contre le principe 2 — qui vaut aussi
  pour la forme (cf. la pastille ronde refusée pour le marqueur du forum). Elles
  deviennent une **jauge carrée** : deux `<path>` SVG sur le contour d'un carré,
  départ au milieu du côté haut, remplissage horaire, `stroke-dasharray` sur un
  périmètre de 176 unités, angles vifs (`crispEdges`, joints miter, bouts
  francs). Vuetify sort du widget au passage.
  - Le fond de la jauge est `--border-strong` et **pas**
    `--background-secondary` : en sombre ce jeton EST la surface du panneau
    (#0E1316), la part manquante disparaissait — l'anneau de Vuetify ne s'en
    apercevait pas, il peignait son fond avec un `currentColor` atténué.
  - **Or en dur retiré** : les trois `#f1c40f` (barre, jauge et icône d'une
    catégorie complétée) passent à `--rank-first`, ce que demandait déjà l'audit
    d'icônes du lot 28 pour cet anneau précis (**1,55** en thème clair).
    Reste le même `#f1c40f` dans `home-widget-tournaments.vue`.
  - Vérifié sur la bêta locale dans les deux thèmes.
- **2026-09-06 — widget « Joueurs remarquables » de l'accueil**
  (`home-widget-ranking.vue`, `home.vue`, retour de Pierre) : c'était le dernier
  widget de liste à faire **défiler son panel** au lieu de s'adapter — il rendait
  les dix joueurs de l'API quelle que soit la hauteur. Il passe à `noScroll` et
  à `useFitCount` comme les autres (`.player`, max 10) : autant de joueurs que
  la hauteur en laisse tenir **entiers**, aucune rangée coupée.
  - La raison (« 857 messages au forum ») passe en **une seule ligne**
    ellipsée : sur un panel étroit elle repassait à la ligne, les rangées
    n'avaient plus la même hauteur et `useFitCount`, qui les suppose homogènes,
    en laissait dépasser une (mesuré : 46 px pour les deux premières, 61 pour
    les suivantes, 5 rangées rendues dans 232 px).
  - Restent sans `noScroll` : `live` et `tournaments`.
- **2026-09-07 — panneau du Potager rapide** (`garden-batch.vue`,
  `garden-fast-fight.vue`, retour de Pierre « plus pro, colle au thème ») :
  - **Les tuiles de chiffres étaient invisibles en v3** : elles prenaient
    `--background-secondary`, qui est aussi `--panel-background` — une tuile de
    la couleur du panneau. Elles deviennent une **bande de cases à filets**
    (`gap: 1px` sur un fond `--border`), en flex et non en grille : une rangée
    incomplète s'élargit pour se remplir, là où la grille laissait le fond à nu.
    Intitulés en petites capitales de la police d'affichage (11 px, `0.06em`),
    la typo des `.panel-action` ; valeurs en chiffres tabulaires.
  - **Barre d'état en tête** : loader ramené à 28 px dans la ligne (il en
    faisait 150, avec ses 30 px de padding de page), libellé « X / Y terminés »
    ou « Tous les combats sont terminés » (coche `--primary`), et une **jauge
    déterminée** (`--background-input`, trait fort, remplissage
    `--primary-surface`). Le lanceur passe à droite de cette barre ; sans lot il
    reste seul et centré.
  - Choisir un nombre dans le menu du lanceur **ne lance plus** : le menu règle
    le bouton, le bouton lance (demande de Pierre).
  - Vérifié sur la bêta locale dans les deux thèmes v3 et en v2 (loader rond,
    filets, aplats pastel des cartes conservés).
  - Paddings autour du lanceur : le bouton d'accent porte l'ombre pixel (3 px
    à droite et en bas, hors de sa boîte), l'œil voyait 7 et 9 px contre 10
    au-dessus. Le conteneur du lanceur rend ces 3 px en v3 seulement.
- **2026-09-07 — notification de trophée, or vif et survol qui brille**
  (`leekwars-shell-v3.scss`, jetons `--gold-bright` dans les trois thèmes ;
  retour de Pierre en thème clair : « un jaune doré plus pétant comme avant
  dans l'ancien design + le hover fait un effet de lumière comme si ça
  brillait ») : l'aplat du 2026-09-06 prenait `--gold`, dont la version claire
  est un or assombri (#B88A0E) calibré comme surface sur le parchemin — sur
  une notification, une moutarde terne. La rangée prend **`--gold-bright`
  (#FFD23A), le même or vif dans les deux thèmes**, encre `--gold-text`
  inchangée (12,9). Le jeton est à part : `--gold` reste l'or de surface des
  boutons « Récupérer » et des pastilles LW+, qui ne changent pas.
  - **Survol** : l'ancien survol assombrissait l'or vers son encre, ce qui se
    lisait comme une extinction. Il **s'éclaircit vers le blanc** (82 / 18),
    allume un **halo blanc interne** et un **débordement d'or** hors de la
    rangée (`z-index: 1`, sinon la rangée suivante le couvre) ; le reflet qui
    balaie passe de 45 à 70 % de blanc. Cas prévu par la doctrine du halo :
    un trophée est précieux, pas du mobilier.
  - **Grande coupe gravée** (« comme si c'était gravé dans la notif ») : elle
    était l'encre à demi-opacité, un gris posé sur l'or. Elle passe dans un or
    à peine plus sombre que la surface (`--gold-bright` 84 / `--gold-text`,
    après un premier réglage à 62 jugé trop marqué : « plus subtil donc plus
    jaune »), opaque, avec un fil de lumière blanc en bas à droite (45 %) et
    un fil d'ombre en haut à gauche (20 %) — deux `drop-shadow` d'un pixel
    sans flou (l'icône est un SVG, `text-shadow` ne le touche pas). C'est le
    relief qui dessine le creux, pas la teinte. Sélecteur à trois classes pour
    battre l'`opacity: 0.5` du composant.
- **2026-09-07 — widget Collection de l'accueil en grille**
  (`home-widget-collection.vue`, retour de Pierre : « que les catégories
  prennent toute la place, comme une grille ; afficher le nom des catégories
  si on a de la place ; le padding entre la barre et les catégories est pas
  assez grand ») :
  - Les catégories étaient des vignettes centrées dans une grille
    `auto-fill`, qui laissait le bas du widget vide (6 + 2 sur deux rangées).
    Elles sont désormais **des cellules étirées à filets** (fond `--border`
    dans des gouttières d'1 px, la recette de la bande de chiffres du Potager
    rapide), sur une grille **calculée d'après le conteneur** et non mesurée
    sur les cellules : les cellules s'étirant, leur taille dépendrait du
    compte, qui dépend de la mesure (le piège documenté dans `useFitCount`,
    que le widget n'utilise plus). Colonnes et rangées maximales au-dessus
    d'un minimum de 76 px par cellule ; si tout tient, le moins de rangées
    possible puis des colonnes équilibrées (8 sur 6 possibles = **4 × 2**) ;
    sinon ce qui tient, jamais une cellule coupée.
  - **Nom de la catégorie** (`main.<ITEM_TYPE_NAME>`, les clés de la page
    Collection) dès que la cellule fait au moins 88 × 104 px, ellipsé sinon
    débordant : présent en 8 × 6 (cellules 128 × 165), absent en 6 × 4
    (93 × 86), où la requête de conteneur réduit déjà les jauges à 44 px.
  - Écart barre / grille **12 → 20 px**.
  - Vérifié sur la bêta locale en 6 × 4 et 8 × 6 (thème sombre ; les filets
    sont ceux déjà validés en clair sur le Potager rapide).
- **2026-09-07 — la page de connexion sur téléphone** (capture de Pierre,
  « pas mal de souci d'UI sur mobile ») ; reproduit à 360 et 412 px en
  émulation Chromium (`emulate` viewport, contexte isolé donc déconnecté) :
  - **Barre déconnectée** (`leekwars-shell-v3.scss`, bloc « La barre
    déconnectée sur téléphone ») : tant qu'on n'est pas connecté c'est la
    barre du bureau qui s'affiche, pas `lw-bar`. Le mot-symbole à 32 px et le
    badge d'environnement débordaient de la ligne, la rangée de cinq boutons
    dépassait de **80 px** (454 pour 372 disponibles) et l'inscription était
    coupée. Sous 600 px : logo et icône à 28 px, badge en 11 px, bouton
    « Aide » masqué (déjà réduit à son icône, l'aide est au pied de page),
    retrait de la barre 10 px sur les quatre côtés, les deux boutons à
    libellé se partagent la largeur (2 × 115 sur 360). La barre passe en
    colonne flex centrée : `display: block` (header.vue, < 1200) tassait les
    deux lignes en haut. Elle monte à **130 px** (`--header-height` posé sur
    `#app:not(.connected)`, lu aussi par `.app-center` qui réserve la place
    sous la barre fixe) : 20 + 34 + 14 + 42 + 20, après un premier essai à
    24 px de logo sans respiration (« le logo peut être plus gros, mettre du
    padding en haut et en bas »), 96 px (« encore trop serré ») et 110 px
    (« encore plus »). Les
    boutons de la barre prennent 6 px entre icône et libellé.
  - **Bouton Inscription vert sur vert** : il mène à « / », donc sur
    l'accueil déconnecté il est `router-link-active`, et la règle d'actif
    (encre `--primary`) passait devant son aplat `--primary-surface`. Une
    règle d'actif dédiée lui garde l'encre sombre — à toute largeur, le
    bureau avait le même défaut.
  - **Drapeau de langue invisible** (un carré vide dans la barre, à toute
    largeur en v3) : le bouton gardait ses 28 px de rembourrage dans un
    emplacement de 60 px qui rétrécit avec la fenêtre, il restait 2 px à
    l'image. Il rejoint la liste des boutons carrés de 42 px (avec le bouton
    de thème, premier de la rangée), drapeau à 26 px.
  - **Boutons OAuth** (`login.vue`) : calés en haut à gauche avec 60 px de
    vide sous le trait. La règle mobile (`align-self: center; margin-top: 0`)
    était écrite AVANT la règle de base de même spécificité, qui gagnait
    donc. Déplacée après ; le séparateur passe à `100 %` plafonné à 300 px.
  - Reste à faire, hors capture : un passage général des pages déconnectées
    (accueil, inscription, aide, forum) et connectées en 360 px.
- **2026-09-07 — le lecteur de combat part du bord** (`leekwars-shell-v3.scss`,
  retour de Pierre : « réduire l'écart entre le combat et le menu, sur la page
  home c'est plus près ») : la page `/fight` est la seule en `LeekWars.flex`,
  un conteneur ajusté au contenu (le joueur se dimensionne d'après la hauteur
  de la fenêtre) que `margin: 0 auto` centrait dans la colonne — 11 px de
  décalage de chaque côté à 1100 px, mesurés, là où toutes les autres pages
  partent du bord. Le conteneur reste ajusté mais part du bord (`margin-left:
  0`). Puis (« de l'autre côté aussi y'a un gros écart ») : le lecteur se
  taillait `40 + 24` px de moins que la colonne, en dur dans `fight.vue` —
  les 40 du retrait de `.app-center` et les 24 du voile de 12 px de
  `.page-wrapper`, que le v3 a supprimé. Il retirait donc 24 px pour rien.
  Le retrait est désormais **mesuré** (rembourrages de `.app-center` et de
  `.page-wrapper`, traits du panneau) : 64 en v2 comme avant, 42 en v3, et le
  canvas fait 823 px dans une colonne de 825.
- **2026-09-07 — témoin de présence `lw-status`** (`src/component/ui/`,
  enregistré globalement ; retour de Pierre : « remplacer ce rond d'activité
  page farmer par un nouvel élément dans le thème ») : les PNG
  `connected.png` / `disconnected.png` étaient des ronds qui ne suivaient ni
  le thème ni la marque. Le composant rend un `span` : en v2 le rond aux
  couleurs exactes des PNG (#9bec00 / #cacaca), en v3 une **LED carrée de
  8 px** — allumée, l'aplat de marque et un halo de 6 px (une émission de
  lumière, ce qu'un témoin est) ; éteinte, une case creuse au trait fort.
  Posé sur la page éleveur et dans l'infobulle éleveur. Les PNG restent dans
  `team.vue`, `group.vue`, `forum-topic.vue` et trois pages admin, à migrer
  (chacune dimensionne l'`img` dans son propre style).
- **2026-09-07 — le talent, composant et icône** (`talent.vue`,
  `public/image/talent.svg`, `leekwars-shell-v3.scss` ; Pierre : « pour le
  composant talent et son icône, j'aimerais moderniser ») :
  - **Composant** : la pastille du v2 (un disque qui chevauche une pilule,
    deux boîtes et une marge négative) était traduite trait pour trait. En v3
    c'est **une boîte**, celle des compteurs de la barre (« topstat ») :
    surface d'en-tête, trait fort, icône de 20 px, chiffre à 16 px en
    semi-gras tabulaire ; le trait passe au vert au survol, le badge menant
    au classement. Hauteur 28 px au lieu de 34.
  - **Icône** : le triskèle arc-en-ciel (`talent.png`, 56 px, dégradé flou)
    est **redessiné à plat** dans la langue des icônes du menu v3 : aplats de
    la palette (`red`, `green`, `cyan`, une couleur franche par bras), trait
    noir dessous, trois bras qui s'enroulent depuis le centre et un point
    détaché au bout de chacun — la silhouette du PNG, pas un dessin nouveau.
    Trois tracés essayés à 200 px : bras trop courts et épais, puis trop
    courts, puis la spirale longue retenue (bras 4,5 / trait 7,5 dans un
    viewBox de 56).
  - **Substitution par la coquille** : le PNG est écrit en dur dans onze
    gabarits (composant, rapports, infobulles, Potager rapide). Plutôt que
    onze `:src` conditionnels, `img[src="/image/talent.png"] { content:
    url(talent.svg) }` change la source d'un élément remplacé, partout et
    d'un coup ; le v2 garde son PNG, et `talent.test.ts` (qui vérifie le
    `src`) reste vrai.
- **2026-09-07 — l'accueil sur téléphone passe par la barre d'application**
  (`home.vue` ; capture de Pierre : « la page d'accueil doit avoir un titre et
  mettre les actions dans la barre en mobile ») : l'accueil ne donnait ni
  titre ni actions à `lw-bar` (`setTitle` / `setActions`), d'où une barre
  d'application vide au-dessus de sa propre barre de page, seule page dans ce
  cas — home.vue forçait même l'affichage de son `h1` que global.scss masque
  partout ailleurs en mode application. Désormais : titre « Accueil » dans la
  barre, actions **+** et **crayon** (coche en mode édition, mise à jour par
  un `watch`) à côté des actions fixes, et la barre de page disparaît
  entière sur mobile. Le « + » de la barre n'a pas de menu à ancrer : il
  ouvre la même liste de widgets dans un `popup`. Vérifié en émulation
  (UA mobile, 360 px) : titre, deux actions, dialogue à 9 widgets, bascule
  crayon / coche.
- **2026-09-07 — infobulles plus légères** (`leekwars-shell-v3.scss`, Pierre :
  « un peu épais et grossier ») : elles portaient le trait fort et l'ombre
  pixel de 4 px des dialogues. Une infobulle est passagère et petite : trait
  ordinaire (`--border`), ombre de **2 px translucide** (`--pure-black` à
  35 %, toujours sans flou), 13 px sur 18, rembourrage 6 × 10. Nuance à la
  doctrine des surfaces flottantes : même langage (trait + décalage franc),
  poids proportionné à l'objet.
- **2026-09-07 — barres de progression : un aplat, jaune quand c'est plein**
  (`leekwars-shell-v3.scss`, Pierre : « la couleur de base est verte, et quand
  la barre est remplie, on passe en jaune ; sinon je préfère sans les styles
  suivants » — les encoches en `repeating-linear-gradient`, le dégradé de
  charge, l'arête de tête et le halo en `box-shadow`) : les remplissages sont
  un **aplat `--primary-surface`**, sans image ni ombre ; l'état complet
  (`.complete`, `.blue`, `.full`) passe du bleu `--info` à **`--gold-bright`**,
  l'or vif des notifications de trophée, dans les deux thèmes.
  - Puis, même jour : **les rayures obliques du v2 reviennent** (« je
    voudrais quand même les barres obliques qu'on avait avant ») sur TOUS les
    remplissages, y compris ceux sans la classe `striked` (barre de
    collection, catégories) — même dessin, bandes à 45° de blanc à 20 %, pas
    de 50 px, en `::after`. Le **reflet** des trois grandes barres s'en va,
    il se disputait le même `::after`. Et **plus d'animation qui se répète**
    (« on la met une seule fois ») : la respiration des barres pleines
    disparaît, seul reste le remplissage à l'arrivée.
- **2026-09-07 — pastille « Terminé » de la Collection** (`collection.vue`,
  Pierre : « arrondie, il ne faut pas ») : rayon 15 px, dégradé d'or et ombre
  floue, trois choses bannies. En v3 : angles francs, `--gold-bright` à plat
  avec son encre, ombre pixel petite.
- **2026-09-07 — cartes du dialogue Équipements** (`loadout-dialog.vue`,
  `loadout-list.vue`, Pierre : « les fonds des cartes sont étranges ») : un
  gris fixe `#f5f5f5` sur le parchemin, la surface d'en-tête en sombre. Les
  cartes (et les éléments « ignorés ») prennent la surface de rangée et un
  trait, comme toute rangée d'un panneau v3 ; la carte saisie au glisser
  prend la surface d'en-tête. Vérifié en clair avec trois équipements.
- **2026-09-07 — l'icône de titre de page en couleur** (`page-icon.vue`,
  composant global ; Pierre : « celui en couleur au lieu de juste vert ») :
  le bloc de titre posait un glyphe mdi en `--primary`. En v3 il montre
  l'asset coloré du menu (`public/image/menu/<name>.svg`, à contour noir),
  le glyphe mdi restant le repli du v2 et du thème XP — le vocabulaire
  d'ICONS.md ne change pas, seule la peinture. Quinze pages basculées
  (`<page-icon name="ranking" fallback="mdi-podium" />`) ; quatre assets
  ajoutés au générateur pour les pages sans entrée de menu : `settings`
  (engrenage), `messages` (enveloppe), `tournament`, `fight` (épée). La page
  poireau garde sa tête de poireau.
  - Piège relevé au passage sur les rayures des barres : un `::after` hérite
    ailleurs d'un `background-repeat: no-repeat`, la tuile de 50 px ne
    couvrait que le début de la barre (capture de Pierre) ; `repeat`
    explicite.
- **2026-09-08 — deux retours d'interface 2.50** (capture de Pierre, forum en
  bêta locale) :
  - **Le mot-symbole en couleur de texte** (`header.vue`, Pierre : « le logo
    peut être de la couleur du texte au lieu de noir ? »). Le v3 rendait
    `leekwars_flat.svg` (blanc) par un `<img>` inversé en `filter` sur le
    parchemin : un noir pur, alors que tout le texte est `--text-color`
    (`#0E1410` / `#E8F0E6`). Le SVG sert maintenant de **masque** (`mask`,
    `contain`, calé à gauche) sur un `<span role="img">` peint en
    `--text-color` : la même encre que le titre, dans les deux thèmes, et le
    rétrécissement mobile (`flex: 0 1 auto`) marche pareil puisque le masque
    est contenu. `--header-logo-filter` disparaît du thème v3 (le v2 garde le
    sien pour son `<img>`). Toujours pas un logo nouveau — principe 5 intact.
  - **Le drapeau du forum aligné sur le titre** (`forum.vue`, Pierre : « le
    drapeau n'est pas aligné à côté de forum »). Le sélecteur de langue vit
    dans `.page-title-text` à côté du `h1` ; l'un est `inline-block` (36 px),
    l'autre `inline-flex` en `height: 100%` d'un bloc sans hauteur : calés sur
    la ligne de base, le drapeau flottait au-dessus du milieu du mot. Le bloc
    passe en **ligne flex centrée** (écart 10 px), vérifié : centres du `h1`
    et du drapeau à la même ordonnée.
- **2026-09-08 — audit des 58 pages : les vieux restes** (Pierre : « le thème
  commence à être vraiment chouette, tu peux faire une passe sur toutes les
  pages pour trouver des vieux trucs à update ? »). Méthode : chaque route
  capturée connectée en 1280 px (Playwright headless, cf. la recette locale),
  plus une sonde DOM par page — arrondis en dur, `box-shadow` floues,
  contrôles Vuetify, PNG d'icônes de moins de 40 px. Corrigé :
  - **`.card` de global.scss** (`leekwars-shell-v3.scss`) : l'ombre
    d'élévation Material à trois couches survivait sur une quinzaine de
    pages (périodes de l'historique, récompenses de parrainage, packs de la
    banque, dev-blog, cartes de l'encyclopédie et de l'aide, lignes des
    réglages, tuiles des statistiques, offres des groupes, recherche du
    forum, messages du forum, kit de presse). Trait `--border`, angles
    francs, plus d'ombre ; les champs qui portent la classe gardent le fond
    des champs.
  - **`v-btn-group`** (vue grille / tableau de l'historique, admin) : coins
    de 4 px et aplat gris de l'actif → bordé, l'actif en trait vert dessous.
  - **Titres de section des statistiques** : les deux dégradés flous du v2 →
    police d'affichage et le pointillé vert de la barre de page.
  - **Arrondis en dur** passés par les jetons (0 en v3, inchangé en v2) :
    badge de grade (profil, forum), barres d'XP (profil, équipe), emblème
    d'équipe, compteur de poireaux de l'éditeur, pseudo dans les messages,
    infobulle du menu. Témoins ronds → carrés en v3 : point de statut des
    équipes qui recrutent, page Statut, témoin d'arène du menu, pastilles
    des chapitres du tutoriel (qui perdent aussi leur ombre floue).
  - **PNG d'icônes → glyphes mdi** (ICONS.md) : `search.png` (forum, marché,
    classement, documentation, API, recherche du forum et de l'encyclopédie)
    → `mdi-magnify` ; `selector.png` (sélecteurs de langue du forum, de
    l'encyclopédie, de la doc) → `mdi-menu-down` ; `github_white.png`
    (à propos, kit de presse, profil, sujets liés à une issue, inscription,
    vérification d'e-mail) → `mdi-github` ; `icon/black/leek.png` (potager,
    infobulles, éditeur) → `mdi-leek` ; `connected.png` / `disconnected.png`
    (équipe, groupe, sujets du forum, admin) → `lw-status`.
  - **Derniers `<select>` natifs** (recherche du forum : catégorie, tri,
    résolu ; page équipe : tri par défaut des colonnes, grade d'un membre)
    → `lw-select`. Au passage, `useNamespacedT('search')` de la recherche
    visait le mauvais espace de noms : `forum-search`.
  - **Banque** : les boutons d'achat en bleu Material écrit en dur
    (`#1976d2`) → `primary`, avec l'ombre pixel des boutons d'accent.
  - **Guide « IA en JavaScript, Python et TypeScript »** : seule page d'aide
    sans barre de page ni panneau, un bloc de texte posé nu → motif
    `page-title` + `panel`.
  - Relevé mais **laissé** : le violet des cristaux dans la banque
    (`#7b1fa2`, c'est la couleur de l'objet) ; les boutons sociaux de la page
    À propos aux couleurs de marque ; la bannière de statut orange
    (sémantique).
  - **Retours de Pierre, même jour** (« Merci ! ») :
    - **Période de l'historique** (`history.vue`) : « avec le style
      hover/active du thème ». Les quatre choix étaient des `.card` grises
      dont l'actif passait en gras : ils deviennent des actions du thème —
      bordées, police d'affichage, survol sur `--background-row`, pixel push,
      l'actif en aplat vert comme la page courante de la pagination.
    - **Page Statut en sombre** (`status.vue`) : « le thème est cassé aussi » —
      les cartes de service lisaient `--grey-lighter`, variable inexistante,
      donc son repli `#f5f5f5` : blanc sous l'encre claire. `--background-secondary`
      + trait.
    - **`v-data-table`** (coquille) : « le fond gris ne me plaît pas trop ».
      Vuetify la posait sur SA surface avec l'ombre `elevation-1` : fond
      transparent, en-tête aux capitales des tableaux du site, filets
      `--border`, survol de ligne, pied de page bordé en police d'affichage,
      angles francs sur son champ et ses boutons. Vaut pour les équipes qui
      recrutent, l'historique en tableau, les groupes et l'admin.
    - **Onglets de barre de page** (coquille, `.page-bar .tabs .tab`) : « un
      hover qui fait apparaître une barre blanche en bas, active qui la passe
      en vert avec le texte ». Le survol ne changeait que l'encre ; il pose
      maintenant le trait dessous à `--text-color` ; **pressé** (`:active`,
      souris enfoncée — c'est ce que Pierre appelait « active », pas l'onglet
      courant), trait et encre passent au vert ; l'onglet courant garde
      trait et encre verts, y compris survolé. Mesuré : survol = encre du
      texte, courant = `--primary`, dans les deux thèmes.
    - **Composant talent** (`talent.vue`, « pareil pour le composant
      talent ») : son survol passait le trait au vert, contre la doctrine du
      2026-08-31. Même jeu que les onglets : trait à l'encre du texte au
      survol, trait et chiffre verts sous le clic.
    - **Entrées du menu** (`.menu .section`, « il faudrait un style active
      sur les items du menu », 2026-09-11) : même lecture d'« active » = pressé.
      Sous le clic, l'entrée prend l'encre verte et un aplat vert à 20 % —
      l'allure de l'entrée courante (12 %) qu'elle va devenir, un cran plus
      soutenue pour rester visible sur l'entrée déjà courante. Sans transition,
      pour que le retour soit immédiat.
    - **Libellés du menu de 12,5 à 14 px** (« dans le menu les items sont à
      12.5px et dans le chat les messages à 15px, c'est pas très uniforme »,
      2026-09-11). Pas d'alignement sur le chat : on lit le chat, on repère le
      menu. Échelle retenue — **13** métadonnées (compteurs, dates, pastilles),
      **14** navigation et titres (menu, `.panel > .header h2`), **15** texte
      lu (chat, contenu). Hauteur d'entrée inchangée (40 px).
    - **Plus d'icônes colorées en titre de page** (« home, banque, paramètres,
      page d'un trophée, encyclopédie, sous pages admin », 2026-09-11) : même
      bloc `page-title` + `<page-icon>` que les 17 pages déjà passées. Deux
      assets neufs dans `generate-menu-icons.mjs` — `bank` (toit or, colonnes
      crème, socle ambre) et `encyclopedia` (livre cyan, page lime) — et le
      rouage des réglages passe du gris `ink` au cyan, trop terne à côté des
      autres. La page d'un trophée reprend la coupe de la liste, les 26
      sous-pages admin le bouclier de `/admin`.
    - **Cartes de l'historique de 52 à 46 px** (« on peut réduire un peu la
      hauteur d'un combat dans l'historique ? », 2026-09-11) : noms en 7 px de
      rembourrage vertical au lieu de 9 ; le v2 garde ses 42 px.
    - **Widget « Talent et derniers combats » : une rangée de plus**
      (« on ne peut pas rajouter une ligne de combat ici sous le graphe ? »,
      2026-09-11) : la courbe passe de 40 à 28 % de la hauteur du panneau
      (plancher 70, plafond 200 inchangés). À la taille par défaut, 3 rangées
      de 2 combats au lieu de 2 — les six que le serveur envoie.
    - **Encyclopédie** (2026-09-11) : l'icône du titre, logée dans le h1 et non
      dans un bloc `page-title`, était décalée de 15 px par le rembourrage du
      h1 — annulé quand le h1 porte l'image (`h1:has(> img.page-icon)`, donc
      v3 seulement). Le menu des traductions ne propose plus que les langues
      du site : la base contient des pages en hindi (468 en local), sans
      drapeau ni nom côté client.
    - **Rangée des chapitres du tutoriel** (`tutorial-progress.vue`,
      « agrandir un peu les rectangles », 2026-09-11) : 30 → 38 px de haut,
      icônes 20 → 22 px.
    - **Bouton « agrandir » de la documentation masqué en v3** (« la page est
      déjà agrandie », 2026-09-11) : le shell v3 retire le `max-width: 1100px`
      de `.app-wrapper` sur toutes les pages, `LeekWars.large` n'y change donc
      rien. Le bouton reste en v2, où la limite existe encore.
    - **Cartes de la page trophées, survol et clic** (`trophies/trophy.vue`,
      « un style hover/active sur les trophées », 2026-09-11) : mêmes états
      que le widget « Mes poireaux » et le forum — `--background-row` et
      `--border-strong` au survol, `--primary` sur le liseré au clic, 0,12 s.
      Liseré transparent au repos sur les trophées verrouillés (sans `.card`),
      pour qu'aucune carte ne bouge. v2 inchangé.
    - **Page LW+, panneau d'abonnement à la hauteur des lots** (`lwplus.vue`,
      « combler le vide », 2026-09-11) : `.offers` passe de
      `align-items: flex-start` à `stretch`. Le panneau « Votre abonnement »
      (ou le tunnel de souscription) descend au bas des lots de mois.
    - **Paliers de parrainage débloqués illisibles** (page éleveur, « petit bug
      d'affichage sur les récompenses parrainage », 2026-09-11) : la récompense
      obtenue porte `.card` ET `.notif-trophy`. Depuis que la notification
      trophée est un aplat d'or à encre sombre (`--gold-text` en !important),
      le fond d'or est écrasé par le `.card` du v3, déclaré plus bas à
      spécificité égale — il reste l'encre sombre sur la carte sombre. Le
      palier garde sa carte (neuf aplats d'or pèseraient trop dans la grille) :
      teinte d'or à 12 %, liseré d'or, texte à l'encre normale, coche en
      `--rank-first`.
    - **Langues des réglages** (`settings.vue`, « mettre les langues en
      grille plus propre », puis « réduire un peu la grille ») : des
      `inline-block` de largeurs inégales, centrés, avec une pastille « bêta »
      qui débordait du coin. Grille CSS `auto-fill` de cases de 84 px
      minimum (cinq par rangée dans le panneau), drapeau 18 px, nom en 12 px,
      l'étiquette « bêta » dans la case en police d'affichage. Mêmes états
      que les onglets ; la langue courante en trait et encre verts.
    - **Widget trophées de l'accueil** (« les images ne sont pas bien
      disposées ») : la grille centrait ses éléments (`justify-items:
      center`), donc chaque élément se réduisait à son contenu et le `100%`
      de l'icône devenait cyclique → `auto` : les SVG dessinés sur 24 unités
      restaient à 24 px quand les autres montaient à 26, décalés de 4 px
      dans leur colonne (mesuré sur le compte de Pierre : `imperator`,
      `turing_completeness`). Éléments étirés à la colonne, le lien centre
      l'icône : 26 px partout, colonnes régulières.
    - **Dialogue « Utiliser une potion »** (`leek.vue`, « les marqueurs de
      quantités ne sont pas dans le bon thème + l'icône potion n'est pas la
      même ») : la plaque de quantité grise collée au bord prend celle des
      armes, puces et chapeaux (aplat de marque au coin). ICONS.md portait
      DEUX lignes « Potion » (`mdi-bottle-tonic` et `mdi-flask`) : la
      première est retirée, et ses six usages (dialogues de potion et de
      skin, action mobile, marché, aperçu du trèfle, page admin des icônes)
      passent à la fiole.
- **2026-09-09 — mobile : l'arène dans la barre d'application, et un gel
  de l'accueil** (Pierre : « sur mobile on va déplacer le petit bandeau
  d'arène en haut dans la barre principale de l'App, une icône arène, avec
  un compteur x/20 mais pas en couleur accentuée car c'est différent d'une
  notif »).
  - **Bandeau d'arène** : `mobile-br.vue` — un onglet vertical fixé au bord
    droit de l'écran, tourné de 90°, aux couleurs du v2 — est supprimé. La
    barre (`bar.vue`) porte à la place une action `mdi-stadium` (le glyphe
    d'ICONS.md) avec le compteur « x/20 » en pastille. Pas l'aplat vert des
    compteurs de messages et de notifications : surface de rangée bordée à
    l'encre du thème (v3), noir translucide sur l'aplat vert (v2). Clic :
    `/garden/arena`, comme le bandeau.
  - **Gel de l'accueil mobile** trouvé en vérifiant : sur le compte de
    Pierre à 400 px, le fil principal ne rendait plus la main (sonde
    `evaluate` bloquée, pile en boucle dans le rendu du widget trophées).
    `useFitCount` mesurait le pas d'une rangée entre deux sections quand
    il y en avait deux, mais l'ESTIMAIT (hauteur + marges + gap paramétré,
    8 px) quand il n'en restait qu'une — or le v3 pose 14 px : deux
    sections tenaient selon l'estimation, une seule selon la mesure, et le
    `MutationObserver` relançait le calcul à chaque rendu. Deux filets dans
    le composable : le pas mesuré entre deux rangées est gardé pour les
    mesures à une rangée, et un compte qui répond a → b → a dans les 250 ms
    est figé au plus petit. Vérifié : sonde à 1 ms, une section rendue.
  - **Widget « Joueurs remarquables »** (« il ne faudrait pas de scroll
    mais adapter le nombre de joueurs à la taille du panel ») : le passage à
    `noScroll` + `useFitCount` est dans l'arbre de travail comme WIP d'une
    autre session (`home-widget-ranking.vue`, `home.vue`), non commité —
    mesuré fonctionnel à 400 px (6 joueurs dans 310 px, sans débord). À
    commettre par cette session-là. *Commité le 09/09 avec le reste du WIP
    des autres sessions, à la demande de Pierre (« tu commit tout en
    beta »).*
  - **Bloc de l'éleveur du tiroir mobile** (`menu.vue`, « cette partie sur
    mobile est pas très belle ») : un avatar de 60 px, le nom en corps de
    texte, et les deux montants en ligne avec un cristal à marges négatives
    qui flottait. Grille à deux lignes : avatar biseauté de 44 px et nom en
    police d'affichage sur la première, les deux montants en « topstat » sur
    toute la largeur de la seconde — boîtes bordées, icône devant, chiffres
    en monospace, le cristal qui dépasse comme sur grand écran. Les habs
    prennent la place (dix chiffres), les cristaux la leur ; côte à côte à
    droite de l'avatar, le tiroir de 250 px coupait le montant.
  - **Barre du haut, grand écran** (coquille, « uniformiser les polices,
    tailles ») : mesuré avant — compteurs en monospace 12,5 px, nom en Inter
    17 px, icônes de 20, 21, 26 px, écarts de 6 px. Après : une seule
    écriture pour les trois compteurs et le nom, Inter 14 px demi-gras à
    chiffres tabulaires ; toutes les icônes à 22 px (le cristal garde ses
    48 px de haut, l'avatar remplit le bouton) ; un seul écart de 8 px. Le
    parti pris monospace des « topstat » du mockup cède à l'uniformité
    demandée.
  - **Talent dans le widget « Mes poireaux »** (« le composant de talent a
    un style overridé ») : le widget allégeait la pastille et le nombre par
    des `:deep`, taillés pour le disque et la pilule du v2 — en v3 ils
    déformaient la boîte unique. Réservés au v2 ; en v3 le talent est le même
    partout.
  - **Police d'affichage : essai de Press Start 2P** (« les chiffres ne sont
    pas très lisibles » avec Pixelify Sans). Planche comparative de douze
    polices pixel libres aux corps du site ; retenues pour le cyrillique :
    Tiny5, Press Start 2P, Handjet, DotGothic16. Pierre choisit Press Start
    2P, celle du mockup. **Correction d'une erreur de ce document** : elle
    couvre latin, latin étendu, cyrillique ET grec, pas « latin seul ».
    Auto-hébergée en cinq sous-ensembles woff2 (`public/fonts/press-start-2p-*`)
    avec **`size-adjust: 70%`** dans les `@font-face` : sa capitale vaut tout
    le cadratin, celle de Pixelify 0,7, et ce descripteur lui rend la même
    hauteur à corps égal — **tous les corps posés avec le facteur 1,43
    restent valables**, rien à retoucher. Les faces Pixelify restent
    déclarées (rien n'est téléchargé tant qu'aucune règle ne les demande),
    pour revenir en arrière d'un jeton. Le japonais, le coréen et le chinois
    retombent sur Roboto comme avant. À surveiller : les capitales accentuées
    de Press Start 2P (É, È) sont dessinées comme des minuscules pour loger
    l'accent dans 8 px — « MES TROPHéES », « éLEVé PAR » — ce qui se voit
    sur les titres en capitales.
    - **Puis Tiny5**, le même jour (« j'aime moins cette police finalement,
      on peut tester la Tiny5 ? ») : hauteur de capitale mesurée à 63 px pour
      100 de corps contre 64 pour Pixelify, donc ni `size-adjust` ni corps à
      retoucher ; latin, latin étendu, cyrillique, grec ; de vraies capitales
      accentuées. Cinq sous-ensembles woff2 (`public/fonts/tiny5-*`). Les
      trois polices restent déclarées, le choix tient au jeton
      `--font-display` de `leekwars-theme-v3.scss`. Pierre : « ah elle est
      stylée ! » — **Tiny5 est la police d'affichage**.
  - **Page de groupe** (« mettre deux colonnes ici si y'a de la place ») :
    le panneau du superviseur et le chat entrent dans un `container large`,
    côte à côte dès que deux fois 400 px tiennent, l'un sous l'autre sinon.
  - **Rangées du forum** (`forum.vue`, valeurs de Pierre) : en v3 les
    cellules passent en `padding: 10px 0` et le marqueur lu / non lu en
    `padding: 10px 30px`, largeur automatique — c'est lui qui donne l'air à
    gauche de la rangée.
  - **Poignée du panneau social** (coquille, « il faudrait un moyen de
    replier le panneau de droite comme le menu de gauche ») : la poignée
    existait (`.blabla-button`, `toggleSocial`) mais restait invisible,
    fixée à `right: 0` sans z-index sous le panneau (1000) qui occupe le
    même coin. Elle vient au bord gauche du panneau
    (`right: var(--social-width)`), par-dessus, et revient au bord de
    l'écran une fois le panneau replié. Vérifié à 1920 px : repli, retour.
    - Puis (« le bouton pour refermer doit être placé au-dessus du panel et
      pas à gauche ») : la poignée vit DANS le bandeau du haut, au coin
      droit, centrée sur sa hauteur, et la barre lui réserve 30 px.
    - **2026-09-10** (« quand le panneau de droite est replié, réduire
      l'espace sur la droite ») : `app.vue` gardait `margin-right: 30px` sur
      `.app-center` quand le panneau est replié — la place de la poignée du
      temps où elle était collée au bord de la page. Depuis qu'elle vit dans
      le bandeau, ces 30 px ne réservaient qu'un couloir vide. Mesuré à
      1920 px avant : contenu de 240 à 1855 pour une zone qui finit à 1905,
      soit 50 px à droite contre 20 à gauche entre le menu et le contenu.
      La marge passe à 0 en v3 (`leekwars-shell-v3.scss`), il ne reste que
      les 20 px de retrait de `.app-center` : contenu jusqu'à 1885,
      symétrique. Le v2 garde ses 30 px.
    - **2026-09-15 — la poignée du menu la rejoint** (« la flèche pour
      rabattre le menu peut être symétrique avec celle pour rabattre le menu
      de droite ») : celle de gauche était restée dans le flux de la colonne,
      donc sous le bandeau, un cran plus bas que sa jumelle. Elle passe en
      fixe au coin gauche du bandeau, même hauteur, même retrait du bord, et
      la barre lui réserve 30 px de ce côté aussi (`--shell-menu`, qui valait
      0 sous 2200 px). Mesuré à 1920 : les deux carrés à `y = 25`, à 30 px
      de leur bord. Deux effets de bord traités : le `z-index: 1` de
      `nav.menu` en faisait un contexte d'empilement, la poignée y restait
      enfermée sous le bandeau (1001) quel que soit son propre z-index —
      c'est la colonne entière qui monte à 1002 ; et la colonne, libérée des
      34 px de la poignée, démarre au ras de la barre, où le trait de tête
      du `.menu-wrapper` doublait celui du bandeau (« il y a une double
      bordure entre la barre et le menu ») — il ne reste que là où quelque
      chose précède les entrées. Sous 1200 px la barre n'est plus une
      flexbox (`display: block`) et n'a plus de coin à offrir : la poignée
      reprend sa place en tête de colonne, et son trait avec elle. La
      poignée de droite, elle, disparaît dès 1600 px (`social.vue`).
  - **Barre du haut pleine largeur sous 2200 px** (« la barre du haut doit
    prendre toute la largeur si l'écran est plus petit qu'une certaine
    largeur ») : les cales qui calaient le logo sur le menu et les boutons
    sur le panneau social ne jouent plus qu'à partir de 2200 px ; en dessous
    la barre court d'un bord à l'autre, moins les 30 px de la poignée de
    chaque côté (celle de gauche depuis le 2026-09-15, voir ci-dessus).
    Mesuré : à 1920 le logo est à 20 px du bord, à 2400 il tombe sur la
    colonne (240 px) et les boutons sur le bord du panneau.
  - **Barre de page** (valeurs de Pierre) : 60 px de haut au lieu de 72, et
    20 px entre le pointillé et les panneaux au lieu de 12 — puis **56 et 15
    le 2026-09-15**, en même temps que le retrait latéral de `.app-center`
    (20 → 15 px). Un joueur trouvait l'arbre des tournois « bien plus petit »
    depuis la 3.00 : il se dimensionne sur la hauteur libre, donc chaque pixel
    de chrome au-dessus de lui le rapetissit. 9 px repris sur la verticale,
    les mêmes 15 px des quatre côtés du gabarit.
  - **Barres des widgets Collection et Statistiques** (« les barres de
    progression n'ont pas de hachures ici ») : elles portaient leurs propres
    classes ; elles reprennent le vocabulaire des jauges (`global-bar > bar`,
    `bar > xp-bar`) et attrapent cadre, or et rayures.
- **2026-09-10 — retours d'interface 2.50 (au fil de l'eau)** :
  - **Espace à droite, panneau social replié** : voir le sous-item daté sous
    « Poignée du panneau social » plus haut. Marge de 30 px ramenée à 0.
  - **Entrée active du menu** (« pas de bordure à gauche mais peut-être un peu
    de couleur en fond ou/et une bordure en bas ? ») : le liseré vert de gauche
    disparaît, ainsi que sa doublure transparente, qui décalait le contenu de
    toutes les entrées et donc le centrage des icônes du menu replié. L'actif
    devient un aplat de `--primary` à 12 % (encre verte à 6,8:1 sur le
    parchemin teinté, 11,1:1 en sombre — mesuré). Un trait vert en pied
    d'entrée, essayé dans la foulée, a été retiré tout de suite : « c'est pas
    mal mais sans bordure c'est mieux ». L'aplat est le même que celui des
    pastilles de mode d'arène ci-dessous.
  - **Potager sur mobile : plus de split** (« mettre les 4 catégories dans un
    menu en haut de la page », « et donc ne plus avoir de split sur le potager,
    ce qui règle pas mal de problèmes ») : la page était la dernière à se
    dédoubler par `LeekWars.splitBack` — un écran entier pour cinq liens, et le
    bouton de la barre d'application détourné en retour. Les catégories
    deviennent une barre d'onglets au-dessus du potager (`#app.app`, colonne à
    100 %, sticky retiré), le potager est toujours ouvert dessous, et
    `splitShowContent` / `splitShowList` / le handler `back` disparaissent de
    `garden.vue`. Sur mobile, `/garden` sans catégorie redirige comme sur le
    bureau (dernière visitée, sinon solo). Les compteurs de participants
    (4 ⚔ 4, 10-20…) restent, en 11 px sous l'intitulé : « tu peux quand même
    remettre les infos sur le nombre de joueurs ». Vérifié à 412 px : les cinq
    onglets tiennent sur une ligne.
  - **Statistiques sur mobile : trois par ligne** (« réduire la taille pour
    qu'on puisse avoir 3 colonnes ») : les cartes sont des `inline-block` à
    `min-width: 128px`, deux par ligne sur un téléphone. La section passe en
    flex (un tiers de largeur n'est pas calculable entre deux `inline-block` :
    l'espace blanc compte comme un caractère), les cartes à
    `calc(33.333% - 4px)`, corps réduits d'un cran, et les camemberts comme les
    séparateurs prennent une ligne entière.
  - **Panneau des récompenses** (« problème de style ici ») : son en-tête
    écrivait en `--white` sur `--panel-header-background` — le piège du lot 10,
    encore : titre et montant invisibles sur l'en-tête clair du v3. Ils passent
    à `--panel-header-color` (#eee en v2, donc l'ancien design ne bouge pas).
  - **Coffre des récompenses en or** (« on peut mettre l'icône coffre en doré
    comme avant (comme les notif-trophy) ») : le bloc portait déjà la classe
    `notif-trophy`, mais la surface neutre qu'on lui donnait plus bas dans la
    feuille (même spécificité, règle postérieure) écrasait l'or. Il reprend
    l'aplat `--gold-bright`, le survol se lit par un cadre `--gold-text`, et
    l'inversion du SVG en thème sombre part avec : chest.svg est une encre
    sombre, ce que l'or demande, comme les vignettes des rangées de trophée.
  - **Préférence de mode d'arène** (« améliorer cette UI ») : cinq cases à
    cocher alignées à gauche avec le bouton d'inscription posé à leur droite →
    une rangée de pastilles centrées portant le glyphe du mode (les mêmes que
    la pastille `.arena-pref` des poireaux en attente), sélection en vert, et
    l'inscription en dessous, au centre.
  - **Pastilles de mode d'arène sur une ligne** (« ça fait 2 lignes c'est
    dommage ») : c'était le `max-width: 620px` que j'avais posé sur le bloc,
    alors que la colonne en offre 985. Retiré ; la rangée mesure 682 px et se
    replie d'elle-même sur une colonne plus étroite.
  - **Onglets du potager mobile à largeur égale** (« il faut que chaque
    catégorie fasse la même largeur ») : `flex: 1 1 0` au lieu de `1 0 auto`,
    la base ne dépend plus de la longueur de l'intitulé. 75 px chacun à 412 px.
    `min-width: fit-content` reste comme garde-fou pour les langues à mots
    longs : un intitulé trop large replie la barre plutôt que d'être coupé.
  - **Historique sur mobile** (« la page historique sur mobile est pas très
    optimisée ») : mesuré à 412 px, **894 px d'en-tête pour un écran de 915** —
    pas un combat visible à l'arrivée. Périodes 76 (quatre boutons de 150 px
    fixes, donc deux lignes), portrait et bilan 229, barre de recherche 42,
    filtres 380 (l'intitulé de famille réservait 130 px À DROITE d'une ligne de
    412, ne laissant pas la place de trois pastilles). Après : périodes à
    parts égales sur une ligne, portrait à 0,45, recherche sur sa propre ligne,
    intitulés de filtre au-dessus de leurs pastilles, pastilles resserrées d'un
    cran — **647 px**, rien de masqué. Au passage, une `.page-bar` qui ne
    contient que le titre disparaît sur mobile : `global.scss` masque le `h1`
    (le titre vit dans la barre d'application) et il ne restait qu'une bande
    vide de 48 px soulignée. Les barres qui portent des onglets ou des actions
    ne bougent pas (vérifié sur potager, marché, trophées, page de poireau).
  - **Notifications flottantes (`squares`)**, trois retours d'affilée :
    - **Trophée** (« il faut que le square soit doré comme la notif ») : la
      carte prenait une teinte à 10 % calculée sur `--notif-accent`, qui pour
      un trophée vaut `--gold-text` — l'ENCRE sombre héritée du shell. D'où une
      carte grise là où la notification est dorée. Elle porte maintenant
      l'aplat plein `--gold-bright`, l'encre borde la carte (13,4 mesuré).
    - **Victoire en tournoi** (« le même style que les trophées mais en
      bleu ») : aplat `--info`, encre `--pure-white`, qui s'inverse avec le
      thème — claire sur le bleu foncé du thème clair (4,5), sombre sur le bleu
      vif du sombre (12,5). Il faut surcharger `.title` et `.message` : le
      shell les peint en `--text-color` pour la rangée du panneau social, ce
      qui donnait 1,33 sur l'aplat. Pas de retrait d'opacité sur la seconde
      ligne, qui tombait sinon à 3,4 en clair.
    - **Liseré** (« pas de bordure verte sur les notifs normales ») : le trait
      vert de 3 px était le défaut de toutes les cartes — commentaire, message
      privé — sans rien signaler. Il ne reste que sur les résultats de combat,
      dans la couleur du résultat, quand l'option est active.
  - **Boutons de récupération des récompenses** (« les boutons jaunes sont pas
    très beaux ») : ils portaient `notif-trophy`, la peau d'une RANGÉE de
    notification appliquée à des boutons — soixante-cinq carrés moutarde dans
    la liste. « Tout récupérer » devient le bouton primaire vert, les boutons
    de ligne un trait discret qui s'allume au survol, et les deux PNG de flèche
    laissent place à `mdi-tray-arrow-down` (ajouté à `ICONS.md`). La classe
    reste posée quand `legacyTheme` est actif : le v2 garde son doré.
  - **Chasse aux arrondis** (« tu peux regarder partout dans le code pour voir
    si y'a pas d'arrondis ? ») : les jetons `--radius-*` valent tous 0 en v3,
    mais **121 `border-radius` étaient écrits en dur** et passaient donc à
    travers. Les 47 valeurs en pixels sont converties en jetons (2 → tiny,
    3 → small, 4/5 → radius, 6/7 → medium, 8/9/10 → large, 12 à 999 → pill),
    dans 43 fichiers : badges de version du forum, bulles de chat, bannières,
    encarts de l'éditeur, listes d'admin, aperçu du marché… Le v2 garde des
    arrondis (ses jetons vont de 2 à 20 px) et bouge au plus de quelques
    pixels ; à surveiller sur les bannières récentes, qui passent de 14/16 px à
    20. Les `50%` sont laissés : ce sont des formes rondes assumées (points,
    curseurs, spinners) que le v3 traite déjà au cas par cas — sauf le disque
    d'or de la page LW+, passé au jeton. Vérifié ensuite en balayant le DOM
    rendu de huit pages : plus un seul rayon non nul en v3.
  - **Badge « Meilleure offre » de la banque** (« ce badge avec ce jaune est
    pas très beau en thème clair ») : il est traité comme un bouton doré par le
    shell, donc peint en `--gold` — l'or ASSOMBRI, calibré pour tenir comme
    surface sous une encre claire sur le parchemin, qui sur une étiquette de
    12 px rend un moutarde terne. Il passe à l'or VIF des notifications de
    trophée et du coffre, même encre sombre : un seul jaune dans la famille
    « or ». Au passage, la règle qui inversait la flèche du bouton `.get` est
    supprimée — ce bouton n'est plus doré et n'a plus de PNG.
  - **Historique, sélecteur de vue et portrait** (« plus de padding entre le
    leek et les boutons », « fond blanc sur les deux icônes grille/liste à
    enlever et faire bien dans le nouveau thème ») : le `v-btn-toggle` était
    resté en Vuetify brut — deux boutons `elevated` à fond blanc pur et ombre,
    posés sur le parchemin. Il prend le vocabulaire du v3 : un cadre, pas de
    fond, l'actif en aplat vert pâle et encre verte, comme l'entrée de menu
    courante. Et 16 px sous les boutons de période, qui touchaient le portrait.
  - **Séparateur de l'éditeur** (« séparateur dans l'éditeur en bleu à
    changer ») : `.resizer:hover` s'allumait en `#0086bc`, un bleu du v2 écrit
    en dur qui n'appartient à aucune palette du thème. Il passe au vert de
    marque à 22 %, glyphe compris. Le v2 garde son bleu.
  - **Cartes de poireau de la page éleveur** (« au hover/active des leeks faire
    le même style que sur le widget poireaux de la page d'accueil ») : le
    survol posait `--pure-white` et une ombre Material — or `--pure-white` est
    le parchemin en clair et du NOIR en sombre, donc un survol qui ne veut rien
    dire d'un thème à l'autre. Elles reprennent les états du widget : surface
    de rangée et trait fort au survol, liseré vert au clic, liseré réservé
    transparent au repos pour que rien ne bouge.
  - **Traits sous les titres dans les dialogues** (« je ne veux pas de bordures
    sous les titres "apparence" etc. ici, et sous le titre du poireau ») : la
    règle qui souligne la barre de titre d'un dialogue visait
    `.popup .title` — donc aussi tous les `.title` du CONTENU. Dans
    « Personnaliser le poireau », les quatre libellés de carte et le titre du
    poireau héritaient chacun d'un trait et de l'encre d'en-tête. Le sélecteur
    passe en enfant direct (`> .title`), la barre de titre étant posée à la
    racine de la boîte par `popup.vue`. Vérifié : seule la barre garde son
    trait.
  - **Panneau social : des panneaux comme les autres** (« avoir une bordure sur
    les panels notifications, messages sur le blabla comme sur les autres
    panels ») : ils portaient un simple trait de séparation, hérité du parti
    pris « le panneau est une colonne, pas une pile de cartes ». Ils reprennent
    le cadre complet et les 12 px d'écart de `social.vue` — sans marge, deux
    cadres voisins feraient un trait double. L'étirement du dernier bloc est
    conditionné à `:has(> :not(.header))`, c'est-à-dire à un panneau déplié :
    replié, il ne reste que son en-tête, et un grand cadre vide au bas de la
    colonne se voit maintenant qu'il y a une bordure.
  - **Chat du panneau social étiré** (« comme le chat panel va jusqu'en bas, tu
    peux l'étirer ? ») : le panneau prenait bien la hauteur restante, mais son
    contenu gardait les 300 px que `social.vue` lui passait en style inline —
    d'où le vide sous le champ de saisie. `height` devient optionnel sur
    `chat-panel.vue` (le forum garde ses 400 px), et le panneau du chat devient
    une colonne flex dont le chat prend la place. **Non vérifié en local** :
    `env.SOCIAL` est désactivé sur la bêta locale, le panneau ne s'y monte pas.
  - **Catégories du marché** (« les catégories sont trop petites et de pas
    accepter de line-break ») : la grille était en `minmax(100px, 1fr)`, où
    « Chapeaux » et « Apparats » ne tenaient pas à côté de leur glyphe et se
    cassaient sous lui. 140 px, intitulé insécable, glyphe et texte centrés
    ensemble, et un peu plus de rembourrage.
  - **Widget « Talent et derniers combats »** (« c'est dommage de n'avoir que
    4 combats et d'avoir du vide en bas ») : la courbe était bornée à 120 px
    (30 % de la hauteur), elle monte à 200 (40 %), et la liste colle ses cartes
    au bas du panneau — le serveur ne donne que six combats, le reste d'espace
    va donc à la courbe plutôt qu'à un blanc. La courbe reste à taille FIXE :
    la liste doit rester le seul élément flexible de la colonne, sans quoi sa
    hauteur dépendrait de son contenu et `useFitCount` boucherait (le gel de
    l'accueil mobile du 2026-09-09). Gap du widget à 6 px et marge haute du
    canvas à 2 px pour l'air au-dessus de la courbe.
  - **Poignée de redimensionnement des widgets** (« l'icône pour resize un
    widget de la page d'accueil peut être plus grand, visible et beau ») :
    gridstack la dessine avec un SVG en data-URI tracé en `#666` fixe, de
    10 px — terne sur le parchemin, invisible en sombre. Redessinée à l'encre
    du thème, verte quand la souris est sur le widget. Le DESSIN a demandé
    quatre essais (« l'icône resize sur la page home est étrange ») : deux
    angles droits emboîtés se lisaient comme un double chevron « ≫ » vers la
    droite, un dégradé répété taillé au masque rendait des traits verticaux, un
    masque SVG ne rendait rien de net. **La cause était la même à chaque fois** :
    gridstack pose `transform: rotate(-45deg)` sur cette poignée — son image est
    une double flèche VERTICALE qu'il redresse en diagonale par cette rotation —
    donc tout ce qu'on dessinait dedans tournait de 45° de plus et retombait à
    la verticale. En annulant la rotation, deux pseudo-éléments de 17 et 9 px
    tournés de 45° autour de leur extrémité droite donnent le grip en biais
    classique. Vérifié à l'écran. Elle se calait sur le coin de l'ITEM gridstack, qui
    déborde du panneau de la marge de 6 px posée autour de chaque item : elle
    tombait donc dans la gouttière, hors de la carte (« l'icône est en dehors »)
    — 10 px de retrait la ramènent à 4 px du bord intérieur. Deux crans de
    survol (« un effet d'hover serait pas mal ») : encre pleine quand la souris
    entre dans le widget, vert et aplat vert pâle quand elle vise la poignée.
  - **Caractéristiques d'une invocation** (« on peut quand même resserrer les
    caracs en hauteur ») : 31 px de pas pour une icône de 20. Les rangées
    passent en flex (l'icône en `vertical-align: bottom` traînait le jambage de
    sa boîte de ligne), l'icône à 18 px, et un rembourrage de 5 px venu
    d'ailleurs est neutralisé par un sélecteur à trois classes. **18 px de pas,
    le bloc passe de 186 à 114 px.**
  - **Chat flottant** (« le panel de chat flottant a un souci de style ») :
    encore `--white` sur `--panel-header-background`, titre et croix presque
    invisibles en thème clair ; l'encre d'en-tête reprend le jeton. Ses coins
    en `border-top-*-radius: 7px` passent aux jetons — les rayons composés
    avaient échappé à la conversion du matin, qui ne visait que `border-radius`
    (six autres fichiers corrigés dans la foulée).
  - **En-tête du panneau de chat** (« les textes ici ne sont pas alignés ») :
    le compteur d'éleveurs était trois éléments inline calés sur la ligne de
    base de la police d'affichage, plus un glyphe remonté de 3 px à la main —
    trois hauteurs différentes. Une seule ligne flex centrée. Vérifié : nom,
    compteur et glyphe sur le même axe au pixel.
  - **Option « Ancien design » masquée** (demande de Pierre, « on va le faire
    mais plus tard ») : `v-if="false"` sur la case des réglages. Le réglage
    lui-même est intact (clé `design`, `LeekWars.legacyTheme`) : un joueur déjà
    en v2 y reste, et une ligne suffit à la remettre.
  - **Cartes de poireau de la page éleveur, suite** (« peut un peu espacer les
    infos ici ») : nom, titre, talent et niveau se touchaient sous le poireau.
    La colonne porte l'écart (`gap: 6px`) au lieu de quatre jeux de marges qui
    s'additionnaient, et les marges du v2 sont neutralisées en v3 pour ne pas
    compter deux fois.
  - **Dialogue des puces d'un poireau** (« on peut faire un écartement égal
    vertical et horizontal entre les puces ? ») : la grille était en
    `minmax(60px, 1fr)`, donc les colonnes s'élargissaient pour remplir la
    ligne et chaque puce se centrait dans la sienne — l'écart horizontal valait
    le `gap` PLUS le reste de la division, l'écart vertical le `gap` tout court.
    Colonnes à 60 px fixes, `gap: 8px` dans les deux sens, et
    `justify-content: center` pour que le résidu passe en marges de la grille
    plutôt qu'entre les puces. Les mêmes grilles existent pour les composants,
    les chapeaux et les potions : pas touchées, à voir avec Pierre.
  - **Lignes de stats altérées d'un composant** : le liseré interne de 3 px à
    gauche est parti (« on peut remplacer les bordures à gauche par une lueur
    rouge ou verte ? comme pour la rareté »), et la lueur qui devait le
    remplacer a été essayée centrée, puis venant de la droite, puis réduite à un
    accent de bord — avant d'être **abandonnée** (« pour le halo laisse tomber
    on l'enlève »). État final en v3 : `box-shadow: none`, il ne reste que le
    fond opaque, qui porte le signe sur toute la largeur de la ligne (il est
    opaque exprès, #622). Le v2 garde son liseré.
  - **Dialogue des puces d'un poireau** (« on peut faire un écartement égal
    vertical et horizontal entre les puces ? ») : la grille était en
    `minmax(60px, 1fr)`, donc les colonnes s'élargissaient pour remplir la
    ligne et chaque puce se centrait dans la sienne — l'écart horizontal valait
    le `gap` PLUS le reste de la division, l'écart vertical le `gap` tout court.
    Colonnes à 60 px fixes, `gap: 8px` dans les deux sens, et
    `justify-content: center` pour que le résidu passe en marges de la grille
    plutôt qu'entre les puces. Les mêmes grilles existent pour les composants,
    les chapeaux et les potions : pas touchées, à voir avec Pierre.
  - **Lignes de stats altérées d'un composant** (« on peut remplacer les
    bordures à gauche par une lueur rouge ou verte ? comme pour la rareté ») :
    le liseré interne de 3 px devient une lueur dans le vert de victoire ou le
    rouge de défaite, la recette de halo des rangées de notification. Elle vient
    de la DROITE (« je voudrais qu'ils viennent de la droite »), du côté où la
    ligne écrit son delta : `inset -16px 0 16px -10px`, l'étalement négatif
    concentrant la lumière sur le bord au lieu de la répandre sur la ligne. Le
    fond opaque, qui porte le signe sur toute la largeur, ne bouge pas — il est
    opaque exprès (#622). **Non vérifié à l'écran** : il faut un composant
    altéré, le compte local n'en a aucun et les routes marché des composants
    retombent sur le pistolet sur la bêta locale.
  - **Infobulle riche de poireau** (flot de « Invalid prop: type check failed
    for prop "item" ») : `rich-tooltip-leek.vue` lisait
    `LeekWars.items[template]` deux fois par vignette dans le rendu, sans
    vérifier que l'objet existe — prop `item` à `undefined`, puis `.name` lu
    sur `undefined` pour l'image. Les trois listes passent par des `computed`
    qui apparient chaque équipement à son template et écartent ce que le client
    ne connaît pas. **Cause racine non reproduite** : aucun des équipements du
    poireau cité (192) ne manque dans le jeu de données local ; l'hypothèse
    reste un objet non public ou plus récent que les données du client.
- **2026-09-10 — le trait des avatars fait le tour, coupes comprises** (Pierre,
  capture du profil : « sur les avatars farmer : soit on fait la bordure
  coupée, soit on l'enlève »). Le trait s'arrêtait aux deux biseaux, ce que le
  commentaire du thème présentait comme le propre d'un biseau ; à l'écran il se
  lit comme un accident. Il fait maintenant le tour complet.
  - **Pourquoi il fallait deux couches** : le trait était un fond plein que
    1 px de marge intérieure laissait dépasser sous l'image. Sur les côtés
    droits, ça marche ; sur une diagonale, le `clip-path` coupe le fond ET
    l'image sur la MÊME ligne, donc rien ne dépasse. Aucune propriété d'un
    `<img>` seul n'y échappe : `border`, `outline` et `border-image` sont
    peints sous le contenu remplacé, et `box-shadow` comme un filtre passent
    avant la découpe.
  - **Ce qui a été fait** : `avatar.vue` rend un `<span class="avatar">` qui
    enveloppe l'image. L'enveloppe porte le cadre et le polygone extérieur,
    l'image un polygone rentré de 1 px. Le second n'est pas le premier « moins
    1 px » : une diagonale rentre de √2 px sur chaque axe, dont 1 déjà pris par
    le côté droit voisin, d'où le `calc(18% + 0.41px)`. Les avatars sont
    carrés, la coupe est donc à 45°.
  - **Effets de bord** : l'enveloppe prend `overflow: hidden` (c'est elle qui
    porte l'arrondi du v2, sinon l'image déborde des coins) et
    `aspect-ratio: 1` (une dizaine d'appelants ne posent qu'une largeur et
    laissaient l'image donner la hauteur) ; l'aperçu d'avatar avant envoi
    (`farmer.vue`) vise le `<img>` dans `$el` et non `$el`.
  - Vérifié : profil, barre du haut, entrée de chat, liste d'équipes, deux
    thèmes, **v2 intact** (avatars ronds) ; 14 pages balayées à la sonde (aucun
    avatar écrasé ni non carré), 732 tests verts.
- **2026-09-15 — la police d'affichage passe à Fusion Pixel 12px** (Pierre :
  « la police pixel est assez critiquée par certains joueurs, tu pourrais m'en
  trouver d'autres plus lisibles ? »). Planche comparative de douze polices
  pixel libres, aux corps du site et à **hauteur de capitale égalisée** — sans
  quoi la comparaison ment. Elle est dans `~/dev/leek-wars/comparatif-polices/`
  (six planches, les scripts, les mesures).
  - **Ce que la planche a appris, et qui vaut plus que le choix de la police :
    une police pixel n'est nette qu'aux corps multiples de sa grille.** Tiny5
    est dessinée sur 8 cases par cadratin, donc nette à 8, 16, 24 et 32 px ; le
    site la pose à 11, 13, 14 et 26 px. Un pixel dessiné y vaut 1,6 pixel écran
    et le navigateur le lisse : **63 % des pixels d'encre sont des demi-teintes
    à 14 px, 38 % à 26 px** (mesure au rendu, 1 dpr, `measure.cjs`). C'est ça
    que les joueurs voient. Attention : plusieurs polices dites « pixel »
    (Pixelify Sans, DotGothic16, Handjet, VT323, Jersey) ont des contours **non
    alignés** et ne sont nettes à aucun corps — la grille se mesure, elle ne se
    déduit pas du nom.
  - **Fusion Pixel 12px** (SIL OFL, TakWolf) : grille de 12, donc 50 % de détail
    en plus à hauteur égale. Les chiffres cessent de se confondre — « Trophées
    (16 077) » se lisait « 16 877 ». Elle couvre latin, latin étendu,
    cyrillique, grec **et** le japonais, le coréen et le chinois, qui retombent
    aujourd'hui sur Roboto ; ces sous-ensembles-là ne sont pas déployés (689 Ko,
    à découper par blocs si on veut les servir un jour). Cinq sous-ensembles
    woff2 (`public/fonts/fusion-pixel-*`), **15,3 Ko en tout contre 43,2 Ko pour
    Tiny5**. Ark Pixel 12px, la police dont elle dérive, a un rendu latin
    **strictement identique** (diff pixel nulle) : le choix entre les deux ne se
    joue que sur la couverture.
  - **`size-adjust: 92.31%`**, soit 12/13 : le titre de page (26 px) tombe sur
    24 px de rendu et l'en-tête du panneau social (13 px) sur 12 px — les deux
    **pixel-parfaits**, 0 % de demi-teintes. Les deux autres réglages ont été
    mesurés et écartés : 83,33 % rend la hauteur de capitale exacte de Tiny5
    (gabarits au pixel près) mais n'est net nulle part (61 % sur le titre) ;
    100 % avec les corps recalés sur 12 et 24 est net partout mais monte la
    capitale de 20 % sur toutes les surfaces. À 92,31 % elle monte de 11 %.
  - Les trois polices précédentes restent déclarées dans `global.scss` (rien
    n'est téléchargé tant qu'aucune règle ne les demande) : **revenir en arrière
    tient au jeton `--font-display`**.
  - Vérifié connecté sur la bêta locale, thème sombre — accueil, éleveur,
    classement, marché, trophées, potager, forum : aucun texte en police
    d'affichage ne déborde de son conteneur (sonde `scrollWidth > clientWidth`
    sur tous les nœuds peints en `--font-display`).
  - **Elle est servie en GRAS** (Pierre, le même jour : « j'aimerais bien la
    mettre en bold partout, elle est trop fine là »). TakWolf ne publie pas de
    graisse grasse et le faux gras du navigateur étale les contours **hors
    grille** : il épaissit bien le trait, mais ramène 56 % de pixels en
    demi-teinte — soit exactement ce que la bascule venait de gagner. Le gras
    est donc **dessiné** : chaque glyphe est uni à sa copie décalée d'une case
    (100 unités sur 1200 d'em), l'avance suit, ce qui donne un trait de 2 cases
    en restant sur la grille — 0 % de demi-teintes, comme le maigre. L'union
    n'a pas besoin d'opération booléenne : en remplissage non-zero, superposer
    deux copies correctement orientées donne leur union (script
    `comparatif-polices/embolden.py`, 36 259 glyphes traités).
    Les cinq sous-ensembles gras pèsent 20 Ko (15,3 en maigre). Les faces
    déclarent `font-weight: 400 700` sur le même fichier : aucune règle de
    composant à toucher, et cette plage empêche le navigateur d'ajouter un faux
    gras par-dessus quand une règle demande 700. Revenir au maigre tient au
    `src` des cinq faces, les fichiers restent sur le disque.
    Revérifié sur les sept pages : le gras élargit les textes d'environ 8 % et
    rien ne déborde.
  - **Une page de comparatif remplace les planches** (Pierre, après six PNG :
    « je suis pas satisfait, tu peux me faire une page html de comparatif ? »).
    `comparatif-polices/comparatif.html`, fichier autonome ouvrable en `file://`
    avec les 16 polices embarquées : thème, graisse, zoom, corps (capitale
    égalisée / bruts / calés sur la grille), filtres, tri, et sur chaque carte
    les mesures faites au rendu en direct. Elle a corrigé deux de nos valeurs :
    **la grille annoncée par une police ment** (Silkscreen se déclare sur 20, la
    mesure la dit nette à 16), et un faux gras n'est net à aucun corps.
  - **Et c'est elle qui a tranché : Pixel Operator** (CC0, Jayvee Enaguas ;
    Pierre : « la Pixel Operator est trop bien ! »). Grille de 16, la plus fine
    des douze, et un **gras dessiné par l'auteur** — rien à fabriquer.
    `size-adjust: 123.08%` (16 × 2 / 26) : titre de page et en-tête du panneau
    social pixel-parfaits, et surtout une hauteur de capitale de 0,692 cadratin,
    **exactement celle de Fusion Pixel à 92,31 %**.
    - Car elle ne compte que **238 glyphes** : ni cyrillique, ni grec, ni CJK, et
      **pas le polonais**. Mesuré sur les fichiers de langue du client : sur les
      17 langues, 2 943 caractères lui échappent, dont 2 932 que Fusion Pixel
      reprend (les 11 derniers sont des emojis, déjà servis par Noto).
      D'où la chaîne `--font-display: "Pixel Operator", "Fusion Pixel",
      "Roboto"` — le repli se fait glyphe par glyphe, et les deux `size-adjust`
      sont calculés pour que le relais soit invisible. **Ne toucher à l'un de
      ces deux descripteurs qu'en corrigeant l'autre.**
    - Vérifié sur la bêta locale : une ligne polonaise (`Zażółć gęślą jaźń`),
      une russe et une grecque, peintes par le site, gardent la même hauteur de
      capitale et le même grain que la ligne latine ; les sept pages habituelles
      ne débordent pas. Deux sous-ensembles woff2 (`pixel-operator-bold-*`),
      4,7 Ko — le reste du latin étendu, le cyrillique et le grec continuent de
      venir des cinq sous-ensembles de Fusion Pixel.
  - **Plus de `letter-spacing`, et le gras est celui du navigateur** (Pierre,
    le même jour : « tu peux enlever les letter-spacing sur les textes de cette
    police et mettre en gras faux gras 700 qui rend le mieux »).
    - Les 19 `letter-spacing` posés dans les 21 règles qui peignent en
      `--font-display` sont retirés — ils dataient de Press Start 2P, dont les
      lettres presque monolarges avaient besoin d'air. Pixel Operator a son
      propre blanc, l'espacement supplémentaire délavait les petites capitales.
      Les règles touchées : titres de page et de panneau, en-têtes de tableau,
      onglets et actions de la barre de page, intitulés de menu, rareté, pied de
      pagination, plus sept composants (`title`, `menu`, `statistics`,
      `history`, `settings`, `home-widget-trophies`, `garden-batch`).
    - **Puis resserrés d'une case** (Pierre : « tu peux réduire le
      letter-spacing sur la font pixel ? ») : les 21 règles portent
      `letter-spacing: -0.0769em`. Le blanc entre deux fûts passe de 2 cases de
      grille à 1 — mesuré sur « nnnn », 4 px → 2 px à 26 px de corps — et les
      13 % de largeur qu'ajoutait HB sont annulés au passage. **Le rendu reste à
      0 % de pixels lissés** : la valeur vaut une case entière, pas une fraction.
      Elle vaut une case pour les DEUX polices, et ce n'est pas un hasard :
      1,2308/16 = 0,9231/12 = 0,0769, les deux `size-adjust` étant calés sur les
      mêmes corps nets. **Si l'un des deux bouge, cette valeur bouge avec lui.**
    - Le gras est passé par le **faux gras de Chromium**, puis par la variante
      **HB** (« half bold ») livrée avec la famille — le faux gras bavait à
      l'usage (Pierre : « c'est un peu baveux avec le font weight 700, y'a pas
      un peu moins gras ou plus net ? »), ce que la mesure annonçait.
      À 26 px, sur la même ligne : maigre +0 % d'encre et 0 % de pixels lissés ;
      faux gras +65 % et **57 % lissés** ; **HB +64 % et 0 % lissés** ; Bold
      d'origine +72 % et 0 %. HB donne donc la même épaisseur que le faux gras
      en restant sur la grille. Elle élargit les textes de 13 % — la synthèse,
      elle, n'élargit pas l'avance — et rien ne déborde sur les sept pages.
    - Les faces déclarent `400 700` en pointant le fichier HB : les 21 règles
      demandent 700, et cette plage empêche Chromium d'ajouter sa synthèse
      par-dessus un gras déjà dessiné. Fusion Pixel repasse sur ses fichiers
      `-bold-` pour la même raison ; sa densité d'encre est à 3 % de celle de
      HB, donc le relais reste cohérent en graisse. Les fichiers maigres restent
      sur le disque.
    - Vérifié sur les sept pages, connecté : plus aucun texte en police
      d'affichage n'a de `letter-spacing`, tous sont rendus en 700, aucun
      débordement.
  - **Les actions de barre de page sortaient de la police d'affichage** (Pierre,
    capture des onglets du marché : « tu peux enlever la font bizarre ? pourquoi
    elle est là et est-ce qu'elle y est ailleurs ? »). `.page-bar .tabs
    .tab.action` était peinte en `ui-monospace` : la règle visait les COMPTEURS
    du potager — potions de restat, combats restants — parce que la police pixel
    confond 5 et S, ce qui compte sur un nombre. Mais `.tab.action` ne désigne
    pas un compteur : c'est n'importe quelle action de barre de page, **52
    occurrences dans 27 composants**, presque toutes des libellés (Boutique,
    Banque, Marché, Inventaire, Collection, Chat, Déconnexion, GitHub, OpenAPI…).
    Tous étaient donc rendus dans la monospace du système, sans rapport avec le
    reste du site, et en 13 px au lieu de 15.
    Les deux compteurs de `garden.vue` prennent une classe `counter` et la règle
    se restreint à `.tab.action.counter`. Vérifié : les onglets du marché et de
    l'inventaire sont en police d'affichage, les deux compteurs du potager
    restent en monospace.
    Les autres emplois de `ui-monospace` sont légitimes et ne bougent pas — ils
    ne peignent que des nombres : pastilles du menu, compteur de non-lus du
    panneau social, « topstats » du widget trophées, compteurs de la barre du
    haut.
  - **Les en-têtes du panneau social passent de 13 à 14 px** (Pierre : « dans le
    blabla panel, tu peux passer les titres à 14px comme les autres panels ? »),
    donc la même valeur que tout autre en-tête de panneau. Les 13 px venaient du
    mockup, où l'`aside-head` fait 9 px, convertis au facteur 1,43 de l'époque de
    Press Start 2P.
    À noter pour plus tard : 13 px est un corps **net** pour la police
    d'affichage actuelle (les corps nets sont les multiples de 13), 14 px ne
    l'est pas — ces titres perdent donc leur rendu pixel-parfait pour rejoindre
    les autres, qui ne l'avaient jamais eu. Uniformiser à **13 px** plutôt qu'à
    14 les rendrait tous nets d'un coup : `.panel > .header h2` est la seule
    règle à changer.
  - **Trois réglages de barre de page et de titre**, valeurs de Pierre le
    2026-09-15 :
    - `.page-bar .actions .tab` (les actions à droite : « Se désinscrire »,
      « Agressions », « Déconnexion ») passe de 12 à **13 px** et perd ses
      capitales. 13 est un corps NET pour la police d'affichage — ses corps
      pixel-parfaits sont les multiples de 13 — donc ces actions gagnent le
      rendu au pixel près en même temps que la taille.
    - `body:not(.v2) .title` (`title.vue` : les titres de poireau et d'éleveur,
      « Débuggueur infernal ») perd ses capitales lui aussi, même raison que les
      titres de page : la police pixel est déjà une voix, les capitales lui
      retiraient ses hampes et ses jambages sans rien ajouter.
    - Puis il passe de 13 à **14 px** (« police un poil plus grande »). Le cran
      net suivant étant 26 px, celui-ci se paie en netteté : arbitrage de taille
      assumé.
  - **Reste à faire si on va au bout** : caler les autres corps en police
    d'affichage sur la grille. Après le `size-adjust`, sont nets les corps
    multiples de 13 ; les 11, 12, 14, 15 et 16 px ne le sont pas. Les passer à
    13 et 26 les rendrait nets sans nouvelle bascule de police.
- **À trancher, relevé par l'audit de contraste en thème clair (2026-08-26)** —
  aucun n'est propre au mobile, tous cassent aussi sur grand écran :
  - **Bandeau de saison** (`season.ts`) : l'encre est `--white` sur un dégradé
    dont l'extrémité claire est très lumineuse — `heatwave` finit sur `#ffdf91`,
    `easter` sur `#ffd9a8` : **1,2 mesuré**. Le commentaire de `solstice`
    (« orange profond→ambre : texte blanc lisible ») montre que la contrainte
    était connue, mais deux saisons la violent. Demande un choix sur la palette.
  - **Pourcentages « résolus » du forum** (`forum.vue`) : couleurs Material en
    dur (`#4caf50`, `#2196f3`, `#ff9800`), **1,9 à 2,5** sur le parchemin.
  - ~~**Couleurs de caractéristiques**~~ : corrigé au lot 28 (jetons `--stat-*`).

## Survol discret, actif en vert (doctrine, 2026-08-31)

Décision de Pierre (« le hover est en vert, il faudrait que le hover soit plus
discret mais le active en vert, comme ailleurs ») : **le vert de marque dit
« tu es ici » ou « c'est l'action principale », jamais « tu pourrais cliquer
là ».**

- **Survol** : changement de surface (`--background-row`) et/ou d'encre
  (`--text-color`), trait qui passe au plus au fort (`--border-strong`).
- **Actif** (page courante, onglet ouvert, page de pagination) : le vert —
  trait, encre ou aplat selon l'objet.
- Harmonisé le 2026-08-31 : boutons de la barre du haut (le survol vert
  devient discret, l'actif `router-link-active` prend le vert), actions de
  panneau (`.panel-action`), actions de barre de page (`.actions .tab`),
  pagination. Les onglets (`.tab` trait vert dessous) et le menu étaient déjà
  conformes. Les `.green` (action principale) gardent leur aplat.

## Le halo, motif réutilisable (2026-08-14)

Validé par Pierre sur la rareté des objets (« ultra stylé »), **à réutiliser
ailleurs mais avec modération**.

Le motif : une source de couleur (un trait fin qui s'éteint sur ses bords) et
surtout son **débordement lumineux** — une ellipse accrochée à la source, qui
s'étire et s'éteint. C'est le débordement qu'on lit, pas la source. Recette :

```scss
.source {
    position: relative;
    z-index: 1; /* sinon les blocs suivants, qui ont leur propre fond, la couvrent */
    background: linear-gradient(90deg, transparent, var(--couleur) 20%, var(--couleur) 80%, transparent);
    box-shadow: 0 0 10px color-mix(in srgb, var(--couleur) 60%, transparent);
}
.source::after { /* la lumière qui déborde */
    content: ""; position: absolute; top: 100%; left: 0; right: 0; height: 64px;
    background: radial-gradient(ellipse 55% 100% at 50% 0%,
        color-mix(in srgb, var(--couleur) 38%, transparent),
        color-mix(in srgb, var(--couleur) 10%, transparent) 45%, transparent 75%);
    pointer-events: none;
}
```

**Où il a sa place** : ce qui est rare, précieux ou mérité — rareté d'un objet,
notification de trophée, tête d'une jauge. **Où il n'a pas sa place** : le
mobilier ordinaire (panneaux, tableaux, formulaires, barres de navigation). Le
halo ne garde sa valeur que s'il reste rare : s'il éclaire tout, il ne signale
plus rien.

Rappel de doctrine : un halo est une **émission de lumière**, pas une ombre
d'élévation — c'est ce qui le rend compatible avec la règle « zéro ombre ».

## Cartes de combat en thème sombre (2026-08-22)

Le thème sombre s'arrêtait à la bordure du canvas : la banquise et la plage
restaient éblouissantes au milieu d'une page noire (#4879). Désormais **toutes**
les cartes s'assombrissent, plus seulement le Nexus, qui avait ses propres
textures sombres (DarkNexus) et les garde.

Parti pris :

- **Teinte, pas voile** : un `multiply` bleuté sur le fond déjà dessiné (motif,
  décors, détails de case, ombres) et sur les textures d'obstacles, mises en
  cache teintées comme elles le sont déjà à l'échelle. Un aplat semi-opaque
  aurait délavé les textures au lieu de les éteindre.
- **Les poireaux restent en pleine lumière.** Ce sont les acteurs : le décor
  recule, eux ressortent. Seules les traces posées au sol pendant le combat
  (impacts, sang, douilles) suivent le fond, via `ctx.filter`.
- **Un dosage par carte** (`nightStrength` dans `maps.ts`), pas une teinte
  unique : la cible est une même luminosité de nuit pour toutes, ~58 mesurée au
  centre de la grille. La plage tombe de 217 à 60 et prend la teinte pleine,
  l'usine de 95 à 54, le cimetière — déjà nocturne — n'y touche presque pas.
- **Mesurer, pas juger à l'œil** : une carte verte saturée (Japon) paraît encore
  en plein jour à 57 alors qu'elle est à la même luminance qu'une carte grise.
  Sans le chiffre, on la surassombrit jusqu'à la bouillie.

## Courbes de talent (2026-08-28)

L'historique de talent était tracé à l'identique par cinq composants (éleveur,
poireau, équipe, widget « Mes poireaux », widget « Talent ») qui portaient
chacun leur copie du dataset. Il est construit une fois dans `src/chart.ts`
(`talentDataset`, `talentScales`) — un réglage visuel se fait là, plus en cinq
exemplaires jumeaux.

Parti pris :

- **Points carrés** (`pointStyle: 'rect'`), dans l'esprit pixel du v3. Chart.js
  dessine un carré de côté `r√2` là où il dessinait un cercle de diamètre `2r` :
  les rayons montent d'un cran (4 → 5, 3 → 4, 2 → 3 sur la sparkline, où le
  carré disparaissait) pour garder le même poids à l'œil.
- **Dégradé sous la courbe** au lieu de l'aplat à 19 % : la teinte est franche
  sous le trait et s'éteint en bas de l'aire de tracé. Un `CanvasGradient` a
  besoin des dimensions de l'aire, que Chart.js n'a pas encore mesurées au tout
  premier passage — d'où une teinte plate de repli dans la fonction scriptable.
- **Grille en pointillés**, tracée sous la courbe et lue à travers le dégradé.
  C'est `scales.<axe>.border.dash` qui met les *lignes* de la grille en
  pointillés ; `grid.tickBorderDash` ne touche que les graduations, hors de
  l'aire. La couleur est `--border-strong` et non `--border` : mesuré sur les
  deux fonds, `--border` tombe à **1.35** de contraste et en sombre la grille
  n'existait pas, le fort tient **1.9** des deux côtés.
- **Le vert du thème partout.** `#5fad1b` (le vert du v2) était écrit en dur
  dans quatre des cinq graphiques, qui restaient donc au vert du v2 sous le v3.
  Tous lisent maintenant `--primary` sur le body, comme le faisait déjà le
  widget « Talent ». Corollaire : les couleurs étant lues au montage, chaque
  page porte un `watch` sur `LeekWars.darkMode` / `legacyTheme` qui reconstruit
  le graphique à la bascule.

## La coquille est UNE surface (2026-08-29)

La barre du haut, le menu de gauche et le panneau social portent la même
surface. Le thème sombre le faisait déjà, le clair non : mesuré sur un rendu,
la barre tombait à **1.20** de contraste du menu contre **1.02** en sombre —
elle cessait de se lire comme une surface et se confondait avec le fond
extérieur, pendant que le menu et le panneau restaient à `#FBF7E8`.

Deux causes, un jeton chacune (`leekwars-theme-v3.scss`) :

- **La teinte.** La barre prenait `--background-header`, la surface des
  *en-têtes de panneau*, un cran plus sombre que le panneau lui-même. Elle prend
  `--header-background`, qui vaut la surface de coquille (`--panel-background`).
  Les en-têtes de panneau, eux, gardent `--background-header` : leur bande plus
  sombre sur le panneau est voulue.
- **L'opacité de l'effet verre.** Elle était une constante (55 %), donc 45 % du
  fond extérieur remontait au travers. Ça ne coûte pas la même chose des deux
  côtés : les surfaces sombres sont serrées (le fond qui remonte est à 1.07 de
  la coquille), les claires sont étalées depuis le lot 28 (1.34). D'où
  `--header-glass` : **55 % en sombre — valeurs inchangées au pixel près —,
  88 % en clair**, où la barre reste alors à 1.02 de sa surface quoi qu'il
  défile dessous. Le flou et la désaturation restent : ce qui se perd, c'est la
  teinte du contenu qui passait au travers, pas l'effet.

Résoudre par la seule teinte était impossible : à 55 %, la couleur qu'il
faudrait poser en clair pour retomber sur `#FBF7E8` dépasse le blanc.

### Le fond remonte dans la foulée

La coquille une fois réunie, la bande beige qui l'entoure prenait le dessus :
`--background-outer` était à **1.34** de la coquille contre **1.07** en sombre.
Tranché par Pierre le jour même (« le fond foncé un peu moins foncé ») :

- `--background-outer` **#DED7BE → #E7E1CB** (1.34 → **1.22**)
- `--background` **#E9E3CD → #EFE9D6** (1.20 → **1.13**)

Les deux montent **ensemble**, d'un tiers de leur écart au panneau. Ensemble et
pas seulement l'extérieur : seul, il serait passé au-dessus de la page et aurait
**inversé** l'échelle (l'extérieur doit rester le plus sombre). L'échelle garde
donc son ordre et ses proportions, elle est juste moins creuse — ce n'est pas un
retour à la nappe crémeuse d'avant le lot 28.

Les trois autres surfaces (`--background-header`, `--background-row`,
`--background-input`) ne bougent pas : elles vivent **sur** le panneau, où
l'étalement du lot 28 n'a jamais posé problème. Seul effet de bord accepté :
`--background-row` (1.14) et le fond de page (1.13) deviennent jumeaux — ils ne
se touchent nulle part, une rangée est toujours à l'intérieur d'un panneau.

À noter pour la suite : sur une page connectée, le fond visible est
**`--background-outer` seul** — c'est `body` qui le porte, `#app`,
`.app-center` et `.app-wrapper` sont transparents. `--background` (69 usages)
est une surface de composant, pas le fond de la page, malgré son nom.

## Questions ouvertes

- ~~**Couleurs de caractéristiques en thème sombre**~~ — **tranché au lot 28**
  (2026-08-28) : jetons `--stat-*`, une paire mesurée par thème, chaque teinte
  gardant son H et son S. Reste en dur, hors périmètre : les couleurs de stats
  du **canvas de combat** (`player/game/game.ts`, `entity.ts`), qui sont peintes
  sur le décor du jeu et non sur les surfaces du site.

- **Avatars carrés partout ?** Le mockup les fait carrés et bordés ; pour
  l'instant seuls la barre du haut, le menu du compte, le panneau social et
  les chats le sont (lot 4). Généraliser (profils, classements, forum) ?

## Chantier restant (mesuré au 2026-08-12)

- **Ombres floues** : ~84 `box-shadow` en dur hors fichiers de thème.
  → remplacer par le trait (ou `var(--shadow-pixel)` si surface flottante).
- **Arrondis** : ~147 `border-radius` en dur (px/%) qui ne passent pas par
  `var(--radius*)`. → passer par les variables (ou 0 direct si local au v3).
- **Ripple** : les 488 `v-ripple` explicites sont neutralisés visuellement en
  v3 ; donner au cas par cas de vrais états hover/active aux cliquables
  maison qui n'en ont pas.
- **Contrôles Vuetify** : **terminé** (2026-08-24). `v-switch`, `v-checkbox`,
  `v-radio`/`v-radio-group`, `v-text-field` (`lw-input`) et `v-select`
  (`lw-select`) n'ont plus aucun usage dans le code. Restent admis comme
  primitives de positionnement : `v-dialog`, `v-menu`, `v-tooltip`.
- **Flash au chargement en « Ancien design »** : le flash blanc du thème
  sombre est corrigé (cookie `dark` lu par le PHP, 2026-08-13), mais les
  joueurs en v2 voient toujours le v3 un instant — leur feuille est chargée à
  la demande au montage. Même remède possible : un cookie `design` miroir, la
  classe `v2` posée dès le HTML, et la feuille v2 en `<link>` plutôt qu'en
  import dynamique.
- **Logo** (Pierre) et **puces/apparats** (autre session) : en attente.

- **2026-08-27, lot 27 — LW+ passe du violet à l'or** (demande de Pierre). Le
  violet `#8e44ad` était écrit en dur dans quatre fichiers (`lwplus.vue`,
  `lwplus-packs.vue`, `settings.vue`, le badge de `farmer.vue`), donc jamais
  redéfini en sombre : il n'y tenait que **3,29** en encre, sous le seuil. LW+
  prend les jetons d'or existants du lot 11, qui s'inversent seuls.
  - **`--gold` / `--gold-text` en aplat**, **`--rank-first` en encre** (l'or
    mesuré à 4,72 en clair et 13,36 en sombre, contre 3,29 au violet).
  - **Le bandeau ne peut pas être un aplat d'or.** Mesuré : le stop foncé du
    dégradé plein tombe à **4,16** en clair, et le « + » en réserve du fond à
    **2,71** — sous le seuil gros texte lui-même. Le bandeau devient donc un
    **lavis** (`color-mix` de `--gold` à 22 % puis 10 % dans `--background`) qui
    garde l'encre normale du site : 13,1 en clair, 9,8 en sombre. L'or plein est
    réservé à la **plaque de prix**, seul vrai aplat de la page.
  - Le « + » de la marque prend `--rank-first` : 3,86 en clair, sous 4,5 mais
    c'est du **46 px en 800**, donc gros texte, seuil 3.
  - Le badge de profil garde l'aplat mais **force son encre** à `--gold-text` :
    `.grade` impose `--white`, qui ne tient que 3,1 sur l'or clair là où son
    14 px en demande 4,5.
  - Reste à trancher : le badge LW+ doré côtoie le badge modérateur
    `#ffa900`, écrit en dur et de la même famille. Deux distinctions jaunes
    voisines sur la même ligne de profil.

- **2026-08-28, lot 28 — du contraste et de la couleur** (demande de Pierre :
  « je trouve ça un peu triste comparé à avant, j'aimerais plus de contraste et
  de couleurs, plus de peps, en restant sérieux et pro »). Quatre leviers, le
  diagnostic étant que le v3 avait perdu *trois* choses à la fois : le relief
  (plus d'ombres), la structure (plus de bandeau de titre) et la marque (le vert
  éteint pour tenir en encre).

  - **L'échelle de surfaces était plate — creusée en clair SEULEMENT.** Mesuré :
    fond de page contre panneau contre en-tête, **1,04 / 1,05 / 1,08** en clair
    et **1,03** en sombre, quand le v2 séparait son fond gris de ses panneaux
    blancs de **1,32**. Pire, trois rôles partageaient la même valeur
    (`--pure-white`, `--background-header`, `--background-row` = #FBF7E8). Comme
    le design a par ailleurs supprimé les ombres et les arrondis, il ne restait
    plus qu'un trait à 28 % pour découper l'écran : d'où la nappe crème uniforme.
    Les cinq surfaces claires sont étalées (extérieur, page, en-tête, panneau,
    champ), le **panneau devenant la surface la plus claire** — c'est lui qui
    doit avancer. Page contre panneau : **1,20**. C'est un contraste
    surface/surface, aucun seuil de texte n'est en jeu, et les encres y gagnent
    (14,5 sur la page, 17,4 sur le panneau). La **rangée passe sous le panneau**
    en thème clair (elle était au-dessus, donc invisible sur lui).
    **Le thème sombre est rendu à ses valeurs d'avant** (« le dark je préférais
    avant ») : il avait reçu le même étalement — page 0A0D0C, panneau 151C1A,
    rangée 232D29, soit 1,13 et 1,22 au lieu de 1,03 — mais le chiffre était
    meilleur et le rendu non. Le presque-noir du v3 est un parti pris, l'éclaircir
    le banalise. **Ne pas « réharmoniser » les deux thèmes sans le lui demander.**
  - **Le vert de marque avait disparu du thème clair.** `--primary` est calibré
    pour l'ENCRE : sur le parchemin il faut descendre à #146128, et ce vert-là
    étalé en aplat est presque noir. Nouveau couple **`--primary-surface` /
    `--primary-surface-text`** — le vert quand il PEINT (#2E9E4B) et l'encre
    posée dessus (#0E1410), **5,42** mesuré. En aplat la contrainte s'inverse :
    c'est l'encre qui doit tenir, et elle peut être sombre. La crème est exclue
    sur un vert vif (#1F8A3B plafonne à 4,11 sous de la crème, #2E9E4B à 3,20) :
    **un aplat vert vif porte une encre sombre**, ce que le néon du thème sombre
    faisait déjà. En sombre les deux jetons valent la paire historique.
    Migrés : les **84 déclarations de fond** ; les **193 usages en encre** ne
    bougent pas, ce qui met le risque de régression à zéro du bon côté. En v2 les
    deux jetons pointent sur la paire historique, donc rendu identique au pixel.
    Le contournement du lot « lisibilité du vert » (foncer l'aplat du bouton
    d'inscription et du lien d'évitement jusqu'à `--primary-strong` pour tenir
    sous une encre claire) n'a plus d'objet et disparaît.
  - **La barre de titre des panneaux : essayée en vert, REFUSÉE, revenue à
    neutre.** Le v2 donnait à ses panneaux un bandeau sombre plein ; le v3
    l'avait passé en crème, où il disparaissait — et la structure de la page avec
    lui. Deux tentatives, toutes deux écartées par Pierre :
    1. **aplat de marque plein** (vert profond, #146128 + crème à 7,06 en clair,
       #204A2A en sombre) — « je n'aime pas trop les panels en vert » ;
    2. **liseré vert de 2 px sous l'en-tête**, la version sobre — « je n'aime pas
       trop le liseré vert » non plus.
    L'en-tête garde donc sa surface neutre et son trait à 1 px, exactement comme
    avant le lot. Le couple `--panel-title-*` créé pour l'occasion a été
    **supprimé** plutôt que laissé en doublon de `--panel-header-*`, qu'il
    dupliquait valeur pour valeur une fois neutre. Ce qui reste du levier : en
    thème clair l'en-tête **se détache maintenant tout seul**, parce que
    l'échelle creusée lui donne une surface (#F3EDD8) distincte du corps du
    panneau (#FBF7E8) — ce qui était le vrai problème, les deux étant
    auparavant à 1,05 l'un de l'autre.
    **À retenir pour la suite : la marque ne passe pas par le mobilier
    répété.** Un bandeau de panneau apparaît six à dix fois par page ; coloré, il
    devient le motif dominant de l'écran. Le vert reste aux **actions** et aux
    **états**, pas aux cadres.
  - **Les couleurs de caractéristiques**, la question ouverte de ce document,
    sont tranchées et sortent de `global.scss` en jetons `--stat-*`. Elles y
    étaient écrites en dur avec seulement trois exceptions `.dark` : mesuré, ça
    ne tenait d'aucun côté — **1,46** pour la vie max sur le parchemin, 1,85 pour
    la sagesse, 1,97 pour les PT ; 3,01 pour la RAM et 2,93 pour la science sur
    le fond sombre. Chaque teinte **garde sa teinte** (même H, même S), seule la
    clarté bouge, jusqu'au premier palier qui tient **4,5 sur la pire surface du
    thème** — le fond de page en clair, la surface de rangée en sombre. Une
    couleur de stat est une couleur d'identité : ce sont les valeurs qui
    s'inversent, pas les teintes. Exception assumée pour la science, dont le
    #0000a2 tenait déjà 10,7 mais ne se lisait plus comme un bleu (remontée à
    6,4). Le v2 garde ses valeurs au pixel, ses trois exceptions devenant des
    surcharges de son bloc `.dark`.
  - **Vérification** : audit de contraste automatisé rejoué sur inventaire,
    trophées, classement, forum, potager, réglages, marché et notifications, dans
    les deux thèmes, avec pour chaque échec le **calcul de ce qu'il valait avant
    le lot**. Résultat : **aucun échec nouveau**. Les échecs qui restent étaient
    déjà là et sont déjà listés ici (bandeau de saison 1,34, pourcentages
    « résolus » du forum 2,0–2,6, badge modérateur 4,18, badge de grade
    administrateur 3,39). Le thème sombre ne rapporte rien du tout sur les huit
    pages. Build de production complet passé, 534 tests unitaires verts, et v2
    vérifié à l'écran et au jeton : fond #f2f2f2, bandeau #2a2a2a, vert #5fad1b,
    rayons 4 px, couleurs de stats d'origine. Après le retour du thème sombre à
    ses valeurs d'avant, la rampe de stats sombre gagne encore : mesurée contre
    la rangée #131A1E, elle va de **5,57 à 9,37** au lieu des 4,5 visés — le
    palier avait été calculé contre une rangée plus claire, l'écart ne peut que
    s'ouvrir.
  - **Laissé de côté, à trancher** : la palette Vuetify (`model/vuetify.ts`)
    garde `primary: #146128` en clair, parce que Vuetify choisit seul l'encre de
    ses boutons par luminosité et poserait du blanc sur le vert vif (3,20). Ses
    boutons restent donc en vert foncé pendant que les nôtres passent au vif.
  - **Repéré au passage, hors lot** : dans le widget « Mes poireaux » de
    l'accueil, le nom du poireau est **rogné à 9 px de haut** et passe sous la
    pastille de talent. C'est de la mise en page, pas de la couleur — antérieur à
    ce lot.

- **2026-08-28, lot 29 — les icônes claires sur fond clair** (capture de Pierre :
  l'épée du compteur de combats et le trophée de « Se désinscrire », blanches sur
  le parchemin). Même cause partout : **le v2 posait sa coquille sur du sombre**,
  donc une icône de coquille était claire par défaut — en dur dans le CSS ou dans
  le fichier PNG. Le v3 en clair a éclairci ces surfaces une à une, et chaque
  éclaircissement a effacé les icônes qu'elle portait. Deux familles.

  - **L'encre écrite en dur.** `global.scss` donne `color: white` à l'icône d'un
    onglet de barre de page : **1,17** mesuré sur presque toutes les pages du
    site, l'onglet actif étant le seul rattrapé jusqu'ici (lot 12). En v3 l'icône
    prend `inherit`, donc les trois états de son onglet d'un coup (secondaire au
    repos, encre pleine au survol, vert pour l'actif) ; le v2 garde son blanc.
    Cinq autres cliquables faisaient la même hypothèse avec `--white` ou
    `--grey-13` — « presque blanc », un rôle que l'échelle de gris porte dans les
    deux sens et qui ne peut donc pas s'inverser (voir le commentaire de
    `--grey-1`) : bouton console, bouton d'actualisation et lien d'historique de
    la banque, bouton « avancé » des réglages, bouton de notifications push
    (**1,01** : invisible). Tous passent à `--page-bar-color`, le rôle « encre
    posée sur le fond d'app », qui suit le thème. En v2 c'est #eee au lieu de
    #fff — le seul écart, sous une opacité de 0,5 sur du #1e1e1e.
  - **Les PNG blancs.** `public/image/icon/*.png` est une famille **monochrome
    blanche** (mesurée : 252 à 255 de luminosité, saturation nulle ; seuls les
    `xp_*` sont en couleur), taillée pour le bandeau vert du v2 : **1,14 à 1,44**
    sur le parchemin. Elles sont **retournées en thème clair** plutôt que
    dupliquées en version noire — ce sont des aplats sans anti-aliasing coloré,
    `invert(1)` en donne l'exact négatif, et la règle couvre les usages futurs
    sans nouveau fichier. C'est la recette du lot 17 en miroir (`icon/black/`
    retourné en sombre) et celle de la barre d'application mobile du lot 26.
    S'y ajoutent `search`, `selector` et `github_white`, hors du dossier `icon/` :
    les deux premiers ne servent que dans une barre de page, le troisième aussi
    mais sert ailleurs de logo sur un bouton **noir**, d'où une portée par
    surface pour lui seul.
  - **Dépendance au lot 28** : l'inversion est sans restriction de surface parce
    qu'il ne reste, en thème clair, **aucune surface sombre** susceptible de
    porter une de ces icônes — la barre de titre d'un panneau est redevenue
    neutre, et l'aplat de marque porte lui-même une encre sombre
    (`--primary-surface-text`). Si un bandeau sombre revenait, c'est lui qui
    porterait l'exception.
  - **Deux icônes hors des deux familles**, trouvées par la même sonde : la
    grande icône des notifications trophée/bigwin, restée blanche alors que le
    dégradé d'or qui la portait a laissé place à un lavis d'accent (**1,07**), et
    l'anneau d'une catégorie complétée du panneau Collection, en `#f1c40f`
    Material en dur (**1,55**). Les deux passent à l'accent de leur rangée
    (`--notif-accent`, `--rank-first`). **Le miroir** existe aussi : la coche
    d'un palier de parrainage débloqué est en `--black` en dur — noir sur noir en
    thème sombre (**1,08**) — et prend le même accent.
  - **Vérification** : sonde de contraste (encre d'une icône contre le fond
    effectif, filtres CSS compris) rejouée sur une vingtaine de pages en thème
    clair **et** sombre. Plus aucune icône de coquille sous 3:1 dans les deux
    thèmes. v2 vérifié au jeton : icône d'onglet #fff, aucun filtre sur les PNG,
    bandeau de panneau #2a2a2a.
  - **Restent, hors famille** : le bandeau de saison (1,34, déjà listé), les
    icônes de difficulté `icon/trophy/N.svg` (1,8 pour l'or, 2,9 pour le vert —
    même question de palette que les pourcentages du forum), et la poignée du
    redimensionneur de l'inventaire (1,76, discrétion voulue).

- **2026-08-28, lot 30 — miniature de poireau dans le menu** (demande de
  Pierre). En v3 les entrées de poireaux portaient toutes la même `mdi-sprout` :
  quatre poireaux, quatre icônes identiques. Chacune devient la **tête du
  poireau lui-même**, chapeau compris.
  - **Mode `head` de `leek-image.vue`**, plutôt qu'un composant à part : toute
    la géométrie (taille selon le niveau, largeur/hauteur/`crop` du chapeau,
    décalage `leekY` quand le chapeau dépasse) y est déjà et n'a pas à être
    dupliquée. Le mode change le `viewBox`, saute l'arme et force `offsetTop`
    à 0 — sans quoi une arme blanche non dessinée pousserait quand même le
    cadrage vers le bas.
  - **Cadrage carré**, pas un simple « haut de l'image » : la taille du poireau
    change avec le niveau, une fenêtre à ratio libre donnerait des miniatures de
    largeurs différentes et les libellés du menu ne s'aligneraient plus.
  - **Le cadre se cale sur le poireau, pas sur le chapeau** (retour de Pierre).
    Le faire tenir le chapeau rétrécirait la tête d'autant : le tricorne fait
    526×291, la corne de licorne 1,8 fois la largeur d'un poireau de niveau 1.
    Deux poireaux voisins n'auraient plus la même taille pour la seule raison
    qu'ils ne portent pas le même chapeau. Les chapeaux débordent donc et le
    `viewBox` les coupe, au-delà de `HEAD_MAX = 1.2`. Mesuré sur les 51×11
    combinaisons chapeau × niveau : **75 % ne débordent pas du tout** (le cadre
    vaut exactement la largeur du poireau) et 92 % tiennent sous le plafond.
  - **Ancrage en haut quand le plafond mord**, pas au centre : couper des deux
    côtés décapitait la corne de licorne, le chapeau à plume et la toque de chef
    (40 combinaisons sur 561, jusqu'à 24 % de la hauteur du chapeau). On
    raccourcit les feuilles à la place — le chapeau est justement ce qui
    distingue le poireau.
  - **`HEAD_RATIO = 0.62`** : mesuré sur les SVG `leek_1` à `leek_11`, les
    feuilles s'arrêtent entre 57 et 60 % de la hauteur. Le visage est bien plus
    bas (~80 %) et n'entre donc pas dans la miniature — c'est voulu, l'entre-deux
    est du blanc de tige qui ne montre rien.
  - **L'entrée ne change pas de taille** (retour de Pierre : les entrées de
    poireau étaient plus hautes que les autres). La règle ne vit pas dans les
    styles scoped de `menu.vue` mais **ici, à côté de celles des icônes** : la
    coquille v3 réécrit entièrement l'entrée (`height: auto`, flex, rembourrage,
    icônes calibrées), et une règle scoped du composant (0,4,0) passe devant la
    sienne (0,3,1) — la miniature gardait donc ses 28 px et gonflait la ligne.
    La miniature déborde de 4 px **symétriquement** (marges négatives) : elle ne
    compte que pour la largeur d'une icône, reste centrée sur la colonne
    d'icônes, et se lit plus grand qu'elle. Vérifié au navigateur : les dix
    entrées mesurent la même hauteur au pixel.
  - **Entrées d'un cran plus grandes** (demande de Pierre) : le rembourrage
    vertical du mockup passe de 9 à 10 px et les icônes de 18 à 20 px, soit une
    entrée de **40 px** au lieu de 36. Les valeurs latérales du mockup (16 de
    marge, 10 de gouttière) et le corps de 12,5 px ne bougent pas.
  - **Menu replié aligné sur le menu déplié** (demande de Pierre) : même hauteur
    d'entrée (40 px) et mêmes icônes (20 px) dans les deux états. Il fallait pour
    cela rendre `height: auto` à l'entrée repliée — le composant la fige à 46 px
    sous un sélecteur en `#app`, plus spécifique que le `height: auto` général du
    thème. Les surcharges repliées ne servent plus qu'à annuler les marges du
    composant, plus à redimensionner.
  - **Miniature recentrée en menu replié** : le conteneur intermédiaire des
    entrées de poireau est en `flex: 1` pour que l'intitulé prenne la place
    restante ; replié il n'y a plus d'intitulé, et il collait la miniature à
    gauche pendant que les autres entrées centraient leur icône.
  - **La vignette était rognée dans le menu, pas ailleurs** (retour de Pierre :
    « dans les notifs c'est pas coupé pareil que dans le menu »). Cadrage
    identique pourtant — même `viewBox` mesuré des deux côtés. C'est le
    conteneur `div[leek]` qui coupait : il ne fait que la hauteur de ce que la
    miniature *occupe* (20 px, marges négatives comprises) et héritait du
    `overflow: hidden` que le composant pose sur tout `div` d'entrée, pour
    l'ellipse du libellé en v2. La vignette y était réduite à un bandeau. Il
    passe en `overflow: visible` ; l'ellipse vit de toute façon sur `.text`.
  - **Le carré tient la TÊTE, le chapeau déborde par-dessus** (formulation de
    Pierre : « on place la tête dans le carré puis on affiche le chapeau, donc
    celui-ci déborde »). Le cadre ne mesure donc que les feuilles —
    `max(leekWidth, leekHeight × HEAD_RATIO)` — et ignore et le chapeau et le
    décalage `leekY` qu'il impose. C'est la tête qui doit faire la même taille
    d'un poireau à l'autre : la caler sur le chapeau la rétrécissait d'autant que
    celui-ci est grand. `HEAD_MAX` n'a plus lieu d'être, le cadre ne grandit plus
    jamais.
  - **La tige est coupée À LA SOURCE, pas par le cadrage.** Le carré de la tête
    (côté = largeur du poireau) est plus haut que les feuilles : un hors-champ
    centré découvrait la tige sous elles, et c'est le poireau entier qui
    s'affichait. Le caler sur le bas des feuilles réglait ça mais posait la tête
    aux deux tiers de son emplacement, donc désalignée des icônes voisines (les
    deux retours de Pierre). Le détourage du poireau s'arrête donc à
    `HEAD_RATIO + HEAD_NECK` — il n'y a plus rien à cacher sous les feuilles — et
    la fenêtre peut être **centrée sur la tête**. `HEAD_NECK = 0.06` garde deux
    pixels de tige, sans quoi la tête est tranchée net.
  - **Identifiant de détourage distinct en miniature** (`cut<hat>h`) : deux
    instances du même chapeau, une entière et une en miniature, se seraient
    partagé le premier `clipPath` venu — celui du premier rendu.
  - **`HEAD_BLEED = 1.4`** dessine le hors-champ où le chapeau déborde puis se
    fait couper. Arbitrage mesuré sur les 561 combinaisons chapeau × niveau, à
    fenêtre centrée : 1,0 → tête à 29 px sur 40 et 61 % des chapeaux entiers ;
    1,2 → 24 px et 70 % ; **1,4 → 21 px et 90 %** ; 1,6 → 18 px et 93 %. À 1,4 la
    tête fait la taille d'une icône voisine (20 px) et neuf chapeaux sur dix
    passent entiers ; les plus hauts sur un petit poireau (corne de licorne,
    chapeau à plume) sont écrêtés.
  - **v3 seulement** : les thèmes v2 et XP gardent leur PNG (`house.png`,
    `xp_leek.png`).
  - Vérifié au navigateur sur les 4 pires combinaisons niveau × chapeau plus
    8 courantes, menu déplié et replié.

- **2026-08-28, lot 30 — la barre du haut en bandeau pleine largeur** (demande de
  Pierre, mockup à l'appui). Le mockup pose la barre d'un bord à l'autre, menu et
  panneau social commençant dessous ; sur le site elle démarrait à 220 px du bord.
  - **Cause** : le composant vit dans `.app-center`, la colonne centrale, elle-même
    décalée de la largeur du menu. La barre héritait donc du décalage.
  - **Corrigé dans la coquille, pas dans le template** : `header.header` passe en
    `position: fixed` pleine largeur, `z-index: 1001` (au-dessus du panneau social,
    qui est à 1000). Déplacer l'élément dans `app.vue` aurait emporté le v2, où la
    barre est bornée avec le contenu et doit le rester. `header.header` et non
    `.header` : le sélecteur nu attraperait les en-têtes de panneau et la ligne
    d'en-tête du forum.
  - **Elle prend une surface** (`--background-header`), ce que le v3 lui refusait
    justement parce qu'elle n'allait pas au bord — sans aplat, le contenu défilerait
    visiblement au travers d'une barre fixe. Et son contenu passe de `flex-end` à
    centré : calé en bas, il laissait un vide en haut du bandeau.
  - **Ce qui devait suivre** : jeton `--header-height` (80 px, la valeur que
    `social.vue` connaissait déjà en dur) ; le menu descend à `top: var(--header-height)`
    et perd ses 46 px de retrait interne, qui servaient à dégager la barre du v2 ;
    `.app-center` gagne le même retrait en haut ; `.app-wrapper.box` (éditeur,
    rapport de combat) passe de `100vh` à `calc(100vh - var(--header-height))`,
    la barre n'étant plus dans le flux ; et la **poignée du panneau social**, fixée
    à `top: 46px`, descend elle aussi — elle se retrouvait sous le bandeau.
  - Mesuré au navigateur : barre à (0, 0, largeur de la fenêtre, 80), `.app-center`
    à 80 px de retrait, menu et poignée à 80, page pleine hauteur à `viewport − 80`.
    Vérifié à l'écran en visiteur ; **la vue connectée n'a pas pu être capturée**,
    `farmer/register-fast` répondant 500 sur la stack locale.

- **2026-08-28, lot 31 — logo à plat (essai)** (demande de Pierre). Le logo
  historique (`leekwars.svg`) est rempli d'un **dégradé vertical** blanc → #b3b3b3,
  hérité d'une barre sombre. `leekwars_flat.svg` en reprend la géométrie au point
  près — mêmes `path`, même `viewBox` — sans `<defs>` et avec un aplat unique.
  - **Blanc conservé** comme valeur de base : c'est `--header-logo-filter:
    invert(1)` qui le passe en noir sur le parchemin. Un logo déjà noir aurait
    demandé de défaire l'inversion, donc de toucher les deux thèmes.
  - **v3 seulement** (`LeekWars.legacyTheme`), le v2 garde le dégradé.
  - Ça ne remplace pas le **principe 5** (nouveau logo, déclinaisons dark et light,
    Pierre s'en charge) : c'est un essai à plat sur le logo actuel, pas un logo neuf.

- **2026-08-28, lot 32 — le bloc de titre de page** (demande de Pierre :
  « pas de fond, sous-titres, icône, boutons à droite »). Le « pas de fond »
  était déjà acquis ; manquaient l'icône, le sous-titre, et la distinction entre
  agir et naviguer.
  - **Motif générique dans la coquille, optionnel et rétrocompatible** : une
    barre de page qui pose juste son `h1`, comme les 88 en place, ne voit rien de
    ces règles. Celle qui adopte le motif enveloppe son titre dans
    `.page-title` > `.page-icon` + `.page-title-text` > `h1` + `.page-subtitle`.
    La barre garde ses 48 px sans sous-titre et respire (73 px mesurés) avec.
  - **Les points médians du sous-titre sont posés par le CSS**
    (`.page-subtitle > * + *::before`) et non écrits dans les templates : c'est
    de la ponctuation de mise en page, elle n'a pas à traverser les 17 fichiers
    de traduction ni à se retrouver dans le texte sélectionnable.
  - **Agir ≠ naviguer** (arbitrage de Pierre) : les actions passent dans un
    conteneur `.actions` et deviennent des rectangles bordés ; les ONGLETS
    restent dans `.tabs` avec leur trait vert dessous. Un conteneur plutôt qu'une
    classe de plus sur `.tab` : l'appelant déclare son intention une fois. Une
    action `.green` garde l'aplat de marque (`--primary-surface`).
  - **Icônes prises dans `ICONS.md`**, jamais inventées — c'est la règle du
    document. D'où le partage du chantier : les pages dont le concept a déjà son
    glyphe canonique sont faites (potager `mdi-sword-cross`, marché `mdi-store`,
    inventaire `mdi-treasure-chest`, classement `mdi-podium`, trophées
    `mdi-trophy`, tournoi `mdi-tournament`, équipe `mdi-shield`, groupes
    `mdi-account-group`, forum `mdi-forum`, messages `mdi-email-outline`,
    modération `mdi-gavel`, administration `mdi-security`, combat `mdi-sword`) ;
    **la page poireau prend la tête du poireau** plutôt qu'un glyphe, comme le
    menu — un poireau précis se distingue de ses frères par sa vignette.
  - **Sous-titres : essayés, RETIRÉS** (« ça ne sert pas trop »). Le motif en a
    porté un sur la page poireau — titre · niveau · éleveur, en réutilisant
    `lw-title` et la clé `farmed_by`, sans clé i18n nouvelle — puis il a sauté,
    avec ses règles et la ponctuation posée en CSS. `.page-title-text` reste :
    c'est lui qui sépare le texte de l'icône, et il coûte une ligne. Les lignes
    `.info` que certaines pages posaient déjà sous leur titre (date d'un combat,
    salon courant des messages) sont **antérieures** au motif et n'en faisaient
    pas partie : rendues telles quelles, pas supprimées.
  - **La barre garde la hauteur qu'elle avait avec un sous-titre** (« on peut
    quand même agrandir la barre en hauteur, c'était sympa ») : 72 px au lieu de
    48. Réservé à la barre de TITRE — le pied de page d'une page et le champ de
    l'encyclopédie sont aussi des `.page-bar` et n'ont pas à grandir, et
    l'éditeur, reconnu à son `> .menu`, mesure déjà sa barre lui-même.
  - **Deux corrections de Pierre sur la barre elle-même** : elle **n'a plus de
    surface** — elle en avait une tant que la barre du haut n'allait pas au bord,
    les deux bandes se répondaient ; depuis que le bandeau du haut est plein et
    pleine largeur, une seconde bande juste dessous empilait deux surfaces claires
    et écrasait le titre entre elles. Et le **pointillé vert gagne 12 px d'air en
    dessous** (la gouttière des panneaux) : le premier panneau venait s'y coller,
    et le pointillé se lisait comme le bord du panneau plutôt que comme le
    soulignement du titre.
  - **Reste à faire, et pourquoi** : les pages dont le concept n'a **pas** de
    glyphe canonique — éleveur, banque, réglages, aide, notifications,
    collection, atelier, statistiques, changelog, accueil, LW+ — plus les ~30
    pages d'administration. `ICONS.md` demande que tout nouveau couple
    concept → glyphe soit décidé avec Pierre, et le document est le rendu de
    `/admin/icons` : les inventer ici les aurait figées sans décision.

- **2026-08-28, lot 33 — le panneau des caractéristiques** (page poireau,
  demande de Pierre : « le rendre plus sexy »).
  - **Essai et retour en arrière** : le panneau a d'abord été refait en tableau —
    pastille de couleur, nom de la caractéristique, valeur alignée à droite, une
    ligne par stat, comme le mockup. Pierre l'a écarté (« je n'aime pas au final,
    je veux avec les icônes ») : les douze icônes + valeurs colorées sur deux
    colonnes sont rendues à l'identique. À garder si l'idée revient : `--stat-*`
    permet la pastille en une règle (`background: currentColor`, la ligne portant
    déjà `color-<c>`), `LeekWars.characteristics` donne l'ordre en une colonne là
    où `characteristics_table` est entrelacé pour deux, et la valeur doit passer
    en **monospace** — en police d'affichage, 2695 se lit « 2898 ».
  - **Les zébrures étaient invisibles en v3**, pas absentes : elles peignent
    `--background-secondary`, qui **est** la surface du panneau depuis que
    `--panel-background` pointe dessus. Même piège qu'au lot 12 sur le widget
    « Mes poireaux ». Elles prennent `--background-row`, faite pour ça ; le v2 a
    bien deux valeurs distinctes et garde les siennes.
  - **Les trois commandes du panneau sont réunies en pied de panneau**, calées à
    droite : équipement, potions, capital. Elles étaient partagées entre des
    icônes d'en-tête muettes et des boutons Material au milieu du contenu, et le
    capital changeait carrément de place selon son état (icône quand il vaut 0,
    bouton quand il y a des points). Nouveau motif `.panel-actions` /
    `.panel-action` **posé dans la coquille** et non dans le composant — la page
    poireau n'en est que le premier appelant. Même silhouette que les actions de
    la barre de page ; le capital prend l'aplat de marque dès qu'il y a des points
    à placer, c'est la seule des trois qui appelle une action.
  - **Peau v2 embarquée** : sous `body.v2` les icônes d'en-tête et les deux boutons
    Material centrés sont conservés au pixel près, la barre de pied n'existant
    qu'en v3.
  - **`mdi-flask` pour les potions**, décidé avec Pierre et **ajouté à `ICONS.md`
    et à `admin-icons.vue`** (les deux se recopient à la main, cf. l'en-tête du
    document). Il remplace `icon/black/potion.png`, un PNG qui porte sa couleur en
    dur — le défaut que le lot 29 a dû rattraper ailleurs.
  - **Repéré, hors périmètre** : `creator.vue` et `editor-test.vue` ont leur propre
    bloc `.characteristics` avec la même zébrure sur `--background-secondary`,
    donc invisible en v3 elle aussi.

- **2026-08-28, lot 34 — l'icône d'IA** (demande de Pierre). La feuille était un
  des **cinq PNG** de `public/image/ai/` (défaut + quatre couleurs) : coins
  arrondis, ombre floue, engrenage en filigrane et teintes en dur — les trois
  refus du v3 réunis dans une image, plus une inversion `body.dark` qui
  échangeait deux PNG pour survivre au thème sombre. Elle est **redessinée en
  CSS** dans `src/component/app/ai.vue`, donc elle suit le thème.
  - **Silhouette en deux couches de `clip-path`** : la couche du dessous est
    peinte du trait et découpée au pentagone (coin coupé), `::before` en retrait
    de 2 px porte la surface et le même pentagone. C'est le seul moyen d'avoir
    un trait d'épaisseur constante *le long de la diagonale* : une `border` ne
    sait pas suivre un `clip-path`.
  - **Le pli intérieur AVANCE de 1,17 px** (`--ai-inner-fold`), il ne recule
    pas. Faux au premier jet, corrigé à l'œil de Pierre (« mets le coin coupé à
    la même largeur que le reste ») : la boîte de `::before` est déjà en retrait
    de 2 px de chaque côté, ce qui éloigne sa diagonale de **4** sur l'axe x−y,
    alors qu'un trait de 2 px perpendiculaire n'en demande que **2 × √2 ≈
    2,83**. Restent 4 − 2,83 = 1,17 px à reprendre, sans quoi la diagonale fait
    4,83 px — plus du double des autres côtés, ce qui se voit tout de suite sur
    une feuille sans arrondi. `::after`, le rabat (l'envers de la page), est un
    triangle clippé de la même taille : son hypoténuse se pose exactement sur le
    bord intérieur du trait.
  - **Un motif de code à la place de l'engrenage** : trois lignes indentées, à
    22 % d'opacité, en haut de la feuille. Ça dit « fichier de code » sans
    consommer un glyphe du vocabulaire d'`ICONS.md` (l'engrenage aurait marché
    sur les réglages), et ça laisse la zone du nom propre — un filigrane plein
    cadre passait derrière le texte et le salissait, essayé et écarté.
  - **`--ai-accent` et `--ai-line` séparés** : le premier est la teinte propre
    de la feuille, le second le trait qui en dérive. Le survol ne repeint que
    `--ai-line` (demande de Pierre) ; la pastille de version, le rabat et le
    voile de surface gardent la teinte de l'IA au lieu de virer au vert avec le
    contour.
  - **Les quatre couleurs** (`ai.color`, servi par le serveur) : l'accent prend
    la teinte sémantique du thème (`--success`, `--info`, `--error`,
    `--text-color-secondary`) et la surface en garde un voile à 14 % en
    `color-mix`. L'encre reste celle du thème — les PNG forçaient `--white`,
    qui n'est pas blanc en sombre.
  - **Peau v2 embarquée** : les PNG et l'inversion sombre restent, sous
    `body.v2` (la règle d'inversion était sur `body.dark` seul, elle aurait
    ressorti un PNG par-dessus la feuille dessinée).

- **2026-08-28, lot 35 — la barre du haut en verre** (demande de Pierre). Depuis
  le lot 30 la barre est fixe et le contenu défile dessous : elle prenait un
  aplat opaque (`--background-header`) pour le masquer. Elle le laisse
  maintenant voir, **flouté et désaturé de sa propre teinte** — même couleur,
  simplement diluée à 55 % en `color-mix`, plus
  `backdrop-filter: blur(18px) saturate(140%)`. Elle garde donc sa teinte en
  clair comme en sombre. Le flou monte avec la transparence (72 % / 14 px au
  premier jet, jugé trop couvrant) : moins la surface couvre, plus c'est lui
  qui tient la lisibilité du texte de la barre.
  - **Le principe 1 tient** : ce qui sépare la barre du contenu reste le trait
    du bas (`--border-strong`), pas une ombre. Le verre n'est pas de
    l'élévation, c'est une surface qui transmet.
  - **L'aplat opaque reste le repli**, sous `@supports (backdrop-filter: …)` :
    sans le filtre (Firefox si le flag est coupé, vieux WebKit), une barre
    translucide laisserait le texte de la page défiler lisiblement au travers.
  - **v3 seulement** (`#app:not(.app) header.header`), et pas `lw-bar` : en mode
    application la barre du haut n'est pas rendue, c'est `lw-bar` qui tient ce
    rôle — à traiter séparément si on veut le même effet.

- **2026-08-28, lot 36 — mot-symbole réduit, icône devant** (demande de Pierre).
  Le logo passe de 45 à **32 px** de haut et prend le **poireau du favicon**
  devant lui, à 10 px comme dans le mockup. Ce n'est pas un logo nouveau :
  `favicon.png` est déjà l'icône du jeu (64 px, fond transparent, vert lisible
  sur les deux thèmes), donc le **principe 5 tient** — le logo définitif reste
  à la charge de Pierre. La pastille ronde `icon192.png` était l'autre candidate,
  écartée par le principe 2 (pas d'arrondis).
  - `.logo-wrapper` passe en **flex** en v3 : les marges d'origine calaient le
    logo dans une barre alignée en bas, celle du v3 centre son contenu.
  - Deux réglages qui suivaient la taille d'avant : les **badges
    d'environnement** (`line-height: 70px`, prévu pour la barre du v2, gonflait
    la ligne flex) et la **décoration saisonnière**, posée à `left: 287px`,
    c'est-à-dire au bout du logo d'avant — elle s'accroche maintenant à son coin.
  - v2 et thème XP intacts (`body:not(.v2):not(.xp)`, et l'icône n'est rendue
    que hors de ces deux thèmes).

- **2026-08-29, lot 37 — la console en thème maison** (capture de Pierre : la
  fenêtre de console en clair, une boîte grise sous un bandeau crème). La
  console porte sa **propre** palette, celle de son thème de coloration et non
  celle du site — c'est voulu, elle peut être en Monokai sur une page claire.
  Mais cette palette était **le v2 écrit en dur** (#f2f2f2 / #e5e5e5 / #111),
  quel que soit le thème choisi : en thème maison sur une page v3, la console
  ne se raccordait à rien.
  - **Le thème maison prend les surfaces du site**, exactement comme la coquille
    de l'éditeur depuis le lot 13 — et enfin dans les **deux** sens : le lot 13
    n'avait traité que `leek-wars-dark`, et la console ne connaissait même pas ce
    thème-là (elle rangeait tous les sombres sous `.theme-monokai`, donc le
    #1f1f1f générique là où l'éditeur peignait déjà #0E1316).
  - **Le fond est celui d'un PANNEAU** (`--background-secondary` du thème,
    #FBF7E8 en clair et #0E1316 en sombre), pas celui de la page : la console
    est une surface posée sous un bandeau de panneau, en fenêtre comme en page.
  - **Les gris génériques restent** pour vs / hc-light / vs-dark / hc-black /
    monokai, qui ne sont pas des thèmes du site et n'ont rien à en reprendre.
  - **Restreint à `body:not(.v2)`** : en v2 les gris génériques *sont* les
    surfaces du site, la console y garde son aspect au pixel près.
  - ~~**Repéré, hors périmètre** : la coquille de l'**éditeur** a le même trou du
    côté clair (`.editor` porte les mêmes gris v2 en dur, et son bloc
    `.theme-leek-wars-dark` n'est pas non plus gardé par `body:not(.v2)`).~~
    **Corrigé au lot 40.**

- **2026-08-29, lot 38 — le widget Classement sans défilement** (capture de
  Pierre : une barre de défilement dans le widget, la dixième ligne coupée en
  deux). Même traitement que le widget Forum au lot 24 : le widget passe en
  **`noScroll`**, la liste remplit la hauteur du panel et `useFitCount` coupe au
  nombre de lignes qui tiennent. En plus du Forum, **les lignes retenues se
  partagent toute la hauteur** (`flex: 1 1 auto`) — sinon couper laisse un blanc
  en bas du panel, ce qui se voit d'autant plus qu'une ligne fait 31 px.
  - Le piège : **la hauteur d'une ligne étirée ne peut pas servir à décider
    combien il en tient**. `useFitCount` mesure la première rangée ; des rangées
    qui remplissent le conteneur donnent toujours `hauteur / nombre affiché`,
    donc le compte se fige et **n'augmente plus jamais** quand on agrandit le
    widget (les widgets sont redimensionnables, gridstack). Le composable prend
    donc un paramètre `rowHeight` optionnel : la hauteur *naturelle* d'une ligne,
    connue de l'appelant, seule source du calcul quand les rangées s'étirent.
    Elle est posée en `min-height` par une variable CSS écrite depuis le TS, pour
    n'avoir qu'une seule valeur à tenir.
  - Vérifié sur la bêta locale (deux widgets classement, h=5 et h=6) :
    9 puis 10 lignes, `scrollHeight == clientHeight`, et le compte suit le
    redimensionnement dans les deux sens (160 px → 1 ligne, 700 px → 10, retour
    → 9).

- **2026-08-29, lot 39 — la barre du haut débordait à droite** (capture de
  Pierre). Le calage du contenu de la barre sur les panneaux (lot 30, deuxième
  partie) était enfermé dans un `@media (min-width: 2000px)` : en dessous — 1920
  compris — le logo et les boutons couraient jusqu'aux bords de la fenêtre, donc
  les boutons passaient **au-dessus du panneau social**, 400 px à droite du bord
  des panneaux. Le palier existait pour une raison réelle : un retrait fixe de
  `menu + social` (jusqu'à 660 px) écrase le contenu de la barre dès que la
  fenêtre descend sous ~1750 px.
  - **Deux cales en pseudo-éléments** (`header::before` / `::after`,
    `flex-basis` = largeur de la colonne) remplacent le retrait interne : elles
    **rétrécissent** quand la place manque, et les deux blocs de la barre ne
    peuvent pas descendre sous leur `min-content`. Le calage n'a donc plus de
    palier — il se dégrade tout seul au lieu de s'éteindre d'un coup.
  - Corollaire : `space-between` répartissait l'espace entre deux blocs, il y en
    a quatre maintenant. C'est `margin-right: auto` sur `.header-left` qui pousse
    les boutons à droite. Et sous 1200 px la barre n'est plus une flexbox
    (`display: block`, header.vue) : les cales y sont masquées.
  - **Le panneau social est redimensionnable** (400 à 800 px, `--social-width`,
    cf. « Le contenu recule quand le panneau s'élargit ») : le 400 px en dur du
    lot 30 laissait les boutons déborder dès que Pierre élargissait le panneau.
    Les cales reprennent la variable, et les mêmes conditions que la marge de
    `.app-center` — dont le `@media (min-width: 1600px)`, en dessous duquel la
    colonne ne réserve rien parce que le panneau passe par-dessus la page.
  - Mesuré sur la bêta locale à 1920 px : logo à 240 (bord gauche des panneaux),
    boutons finissant à 1485 (bord droit, panneau social à 1520) ; idem menu
    replié (84 / 1485), panneau social replié (240 / 1855), et sous 1600 px la
    barre revient au bord comme la colonne (1365 pour une page à 1385). À
    1235 px les cales ont cédé sans que rien ne se chevauche ni ne déborde.

- **2026-08-31, lot 40 — rafale de retours de Pierre** (une douzaine de points,
  tous à sa demande) :
  - **Page combat** : le glissement du redimensionneur du panneau social met à
    jour `--social-width` mais n'émettait jamais `resize` (seul le repli le
    faisait) — le lecteur ne suivait pas. `social.vue` émet à chaque pas de
    glissement, en `nextTick` pour que la variable soit posée avant la mesure.
  - **Avatars/emblèmes cassés** (fichiers absents en local) : écouteur `error`
    global en capture dans `vue.ts` — toute `<img>` sur `/avatar/<id>.png` ou
    `/emblem/<id>.png` qui 404 bascule sur son placeholder. Un seul point de
    code pour tous les usages, y compris les `getAvatar()` directs.
  - **Thème d'éditeur « Leek Wars » clair** aux couleurs du v3 (le pendant du
    lot 13) : fond panneau #FBF7E8, mots-clés `#146128`, types `#16688A`,
    chaînes `#9C4508`, violet `#5F35B5`, or `#8A6200`, commentaires `#5C6854` —
    mesurés ≥ 4,5 sur le fond de page #EFE9D6 (pire surface d'un aperçu
    transparent). **La peau v2 (fond blanc, bleu marine) reste servie en v2** :
    la définition Monaco est rejouée à la bascule de design (watch), l'override
    CSS des aperçus est sous `body:not(.v2)`. Les deux thèmes maison sortent
    dans `monaco-themes.ts`, partagé avec l'**éditeur de l'encyclopédie** (qui
    importe monaco sans monaco.ts et restait sur vs/vs-dark → il suit maintenant
    le thème du site, diff d'historique compris). Coquille de l'éditeur : bloc
    `body:not(.v2) .theme-leek-wars` aux surfaces claires du site (le trou
    relevé au lot 37), et le bloc sombre gagne le même garde-fou v2.
  - **Réglages** : interrupteurs AVANT le libellé (prop `label` de `lw-switch`,
    ligne entière cliquable), colonne aérée (gap 10 px), icône de page
    `mdi-cog` (nouveau couple concept → glyphe, ajouté à `ICONS.md` et
    `admin-icons.vue` ; le bouton réglages de la barre passe du contour au
    plein).
  - **Survol discret / actif vert** : doctrine actée et harmonisée, voir la
    section dédiée. Barre du haut : l'actif passe par `router-link-active`
    PLUS une classe `header-active` posée à la main pour les sous-pages qui
    vivent dans un autre record de route (/market/:item, /bank, /garden).
  - **Panneau « Mes comptes »** : les v-btn small (icône 16 px au centre d'une
    grande boîte Material) deviennent des carrés cliquables de 36 px, icône
    22 px, collés ; bloc nom + talent centré verticalement face à l'avatar.
  - **Statistiques** : `font-variant-numeric: tabular-nums` sur les valeurs —
    les compteurs animés changeaient la largeur des cartes à chaque tick et
    toute la grille tremblait. Inter porte des chiffres tabulaires.
  - **Fiche d'invocation du marché** : 7 px entre l'icône de caractéristique et
    la valeur (2 px avant), en enfant direct — la marge s'additionnait sur les
    deux niveaux de span.
  - **Profil éleveur** : les PNG forum/site web/GitHub passent en glyphes mdi
    (`mdi-forum`, `mdi-web`, `mdi-github`) qui suivent l'encre — les PNG
    sombres disparaissaient en thème sombre.
  - **Sélecteur d'emoji** : survol sur `--background-row` (était `--grey-11`,
    gris clair jamais redéfini en sombre — carré presque blanc).
  - **Cartes d'historique de combat plus hautes en v3** : 52 px au lieu de 42
    (v2 inchangé au pixel), rembourrage des noms recalé, `useFitCount` suit
    tout seul (il mesure la première rangée).
  - **Tableau des membres d'équipe** : la v-data-table posait la « surface »
    Vuetify (aucun jeton derrière) — transparent, le panneau porte le fond.
  - **Forge, bouton Altérer** : l'icône forçait `--white` sur l'aplat de marque
    (le piège du lot 10) → `--primary-surface-text`.
  - **Encyclopédie** : le sélecteur de langue d'édition prenait `height: 100%`
    d'un conteneur en hauteur auto (rien) et flottait au-dessus de la ligne —
    calé à 36 px comme un `.tab`.
  - **Écran de pré-chargement (avant Vue)** : suit le thème (cookie `dark`
    déjà posé par app.vue, repli `prefers-color-scheme`), fond
    `--background-outer` des deux thèmes, et le spinner circulaire est remplacé
    par la **pluie de données du lot 21** recopiée en CSS statique (délais
    négatifs par `nth-child`, mêmes décalages de colonnes 0,3,1,4,2). Sans
    logo, le loader seul (demande de Pierre).
  - **Suite du même jour (soirée)** : forge — les altérations comptent dans
    `item_quantity` (une posée passait pour « missing » rouge grisé), 30 px
    entre la forge et les stats, `.panel-actions` à rembourrage uniforme ;
    widget « Statistiques du poireau » — XP et combats sous le bloc
    nom/niveau/talent, graphique masqué sous 60 px (le wrap est son propre
    conteneur de requête) ; widget « Trophées les plus rares » — avatars des
    5 derniers débloqueurs par ligne (nouveau service serveur
    `trophy/last-unlockers` + index `(trophy, time DESC)`, dégrade sans
    avatars si le serveur ne l'a pas).
  - Vérifié : build de prod complet et 581 tests verts. Déployé sur la beta
    (client via private/develop, API beta via origin/develop) le 2026-08-31.

## À reporter dans le projet Claude Design

Décisions prises côté site qui doivent redescendre dans le mockup :

- `--radius-soft` : 2px → 0 (fait dans `src/redesign/tokens.scss`).
- `--shadow-soft` (ombre floue) : bannie, à retirer des jetons et du composant
  qui l'utilise en dur (`components.scss` ~l. 995, `0 -8px 32px`).
- **Échelle de surfaces claire creusée (lot 28)**, non reportée dans
  `src/redesign/tokens.scss`, qui reste le miroir du mockup. Le site s'en écarte
  désormais **en thème clair** : `--bg` / `--bg-panel` / `--bg-elev` / `--bg-row`
  du mockup tiennent dans 1,04–1,08 de contraste, ce qui ne suffit pas à découper
  une page sans ombre ni arrondi. Valeurs retenues côté site : page #E9E3CD,
  en-tête #F3EDD8, panneau #FBF7E8, rangée #EFE8D0, extérieur #DED7BE — et la
  **rangée passe sous le panneau**. Le thème **sombre reste celui du mockup**,
  choix de Pierre : le même creusement y a été essayé puis retiré.
- **Le vert a deux valeurs, pas une** : `--green` du mockup ne peut pas servir
  d'encre ET d'aplat en thème clair. Le site a `--primary` (encre, #146128) et
  `--primary-surface` (aplat, #2E9E4B, encre sombre dessus).
