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
   *Pierre s'en charge, plus tard. Ne pas générer de logo.*
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
    est animée : compositable, aucun repaint.
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
    mangeraient la courbe et leurs graduations tombent sur les gris par défaut
    de Chart.js, que le thème sombre ne reprend jamais ; la date et la valeur se
    lisent au survol. La courbe **lit `--primary` sur le body** au lieu du
    `#5fad1b` en dur des autres graphiques de talent, et se reconstruit au
    changement de thème et de design.
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

- **À trancher, relevé par l'audit de contraste en thème clair (2026-08-26)** —
  aucun n'est propre au mobile, tous cassent aussi sur grand écran :
  - **Bandeau de saison** (`season.ts`) : l'encre est `--white` sur un dégradé
    dont l'extrémité claire est très lumineuse — `heatwave` finit sur `#ffdf91`,
    `easter` sur `#ffd9a8` : **1,2 mesuré**. Le commentaire de `solstice`
    (« orange profond→ambre : texte blanc lisible ») montre que la contrainte
    était connue, mais deux saisons la violent. Demande un choix sur la palette.
  - **Pourcentages « résolus » du forum** (`forum.vue`) : couleurs Material en
    dur (`#4caf50`, `#2196f3`, `#ff9800`), **1,9 à 2,5** sur le parchemin.
  - **Couleurs de caractéristiques** sur la page poireau : 2,1 à 4,2 en clair.
    C'est la question déjà ouverte plus bas, mesurée cette fois côté clair.

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

## Questions ouvertes

- **Couleurs de caractéristiques en thème sombre** (mesuré au 2026-08-24) :
  quatre des couleurs sémantiques du jeu passent sous le seuil de 4,5 sur le
  fond sombre — science `#2a63ff` **3,85**, RAM `#ce00c7` **3,96**, force
  `#c05415` **4,02**, magie `#d810d5` **4,41** (`global.scss`). Les remonter
  touche l'identité des stats dans tout le jeu (page poireau, rapport de combat,
  marché, infobulles) : décision de Pierre, pas un correctif de lot.

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

## À reporter dans le projet Claude Design

Décisions prises côté site qui doivent redescendre dans le mockup :

- `--radius-soft` : 2px → 0 (fait dans `src/redesign/tokens.scss`).
- `--shadow-soft` (ombre floue) : bannie, à retirer des jetons et du composant
  qui l'utilise en dur (`components.scss` ~l. 995, `0 -8px 32px`).
