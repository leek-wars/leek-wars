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

## Questions ouvertes

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
- **Contrôles Vuetify** à remplacer (sur le modèle de `lw-switch`, rendu v2
  embarqué) : `v-select` (10 fichiers), `v-text-field` (9).
  Faits : `v-switch`, `v-checkbox`, `v-radio`/`v-radio-group`.
- **Loader** : le spinner circulaire Material, candidat à un traitement pixel.
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
