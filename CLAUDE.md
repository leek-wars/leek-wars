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
- Toujours mettre à jour **FR et EN** ensemble
- Les images sont référencées avec `#img_<version>_<nom>`
- La version en cours de développement a le titre "WIP"
- Créditer les contributeurs avec "(merci à <pseudo>)"

## Éditeur Monaco

Le code de l'éditeur est dans `src/component/editor/` :
- `ai-view-monaco.vue` - Composant Vue de l'éditeur
- `monaco.ts` - Configuration Monaco (thèmes, providers, keybindings)
- `analyzer.ts` - Communication avec le serveur d'analyse LeekScript

## Traductions

- Fichiers i18n dans `src/lang/<locale>/`
- Format JSON pour les traductions générales
- Format YAML pour les changelogs