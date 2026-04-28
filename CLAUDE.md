# Instructions pour Claude Code - Leek Wars Client

## Structure du projet

- **Frontend Vue.js 2** avec TypeScript et Vuetify
- **Éditeur de code** : Monaco Editor (`src/component/editor/`)
- **Point d'entrée** : `src/model/vue.ts`

## Changelogs

Les changelogs sont dans `src/component/changelog/` au format YAML.

### Fichiers principaux
- `changelog.fr.yaml` - Version française (principale)
- `changelog.en.yaml` - Version anglaise

### Format
```yaml
<version>:
  title: "Titre de la version"
  added:
    - "Nouvelle fonctionnalité. #img_<version>_<nom>"
  improved:
    - "Amélioration existante."
  fixed:
    - "Correction de bug."
```

### Règles
- Toujours mettre à jour **FR, EN et IT** ensemble
- Les images sont référencées avec `#img_<version>_<nom>`
- La version en cours de développement a le titre "WIP"
- Créditer les contributeurs avec "(merci à <pseudo>)"

## Terminologie du jeu
- **Potager** (pas "Jardin") : page de matchmaking et lancement de combat.
- **Habs** (pas "HABs" ni "HAB") : monnaie du jeu, H majuscule, reste en minuscule.
- **Séquelle** (pas "rémanent" ni "poison") : type de dégâts "aftereffect" en anglais. Utiliser les noms des fichiers de traduction (`src/lang/*/effect.json`).
- **Noms d'armes/puces** : toujours utiliser les noms officiels des fichiers de traduction (`src/lang/*/weapon.json`, `src/lang/*/chip.json`), pas d'approximation.

## Styles et thèmes

Le site supporte un mode sombre (`body.dark`). **Ne pas hardcoder de couleurs neutres** dans les composants : utiliser les variables CSS définies dans `src/global.scss` pour qu'elles s'adaptent automatiquement.

### Variables principales (light + dark)
- `--background`, `--background-secondary`, `--background-header`, `--background-disabled`
- `--border`
- `--text-color`, `--text-color-secondary`
- `--pure-white`, `--pure-black` (s'inversent en dark)
- `--primary`, `--type-color`, `--link-color`

### Couleurs sémantiques (success/warning/error)
Pas de variables existantes. Choisir des teintes claires en light, puis ajouter un override `body.dark .ma-classe { ... }` avec des teintes plus sombres pour conserver la lisibilité sans flasher.

## Éditeur Monaco

Le code de l'éditeur est dans `src/component/editor/` :
- `ai-view-monaco.vue` - Composant Vue de l'éditeur
- `monaco.ts` - Configuration Monaco (thèmes, providers, keybindings)
- `analyzer.ts` - Communication avec le serveur d'analyse LeekScript

## Traductions

- Fichiers i18n dans `src/lang/<locale>/`
- Format JSON pour les traductions générales
- Format YAML pour les changelogs