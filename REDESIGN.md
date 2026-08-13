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
- **Logo** (Pierre) et **puces/apparats** (autre session) : en attente.

## À reporter dans le projet Claude Design

Décisions prises côté site qui doivent redescendre dans le mockup :

- `--radius-soft` : 2px → 0 (fait dans `src/redesign/tokens.scss`).
- `--shadow-soft` (ombre floue) : bannie, à retirer des jetons et du composant
  qui l'utilise en dur (`components.scss` ~l. 995, `0 -8px 32px`).
