# Handoff — démarrer les tests automatisés du client

> But : amorcer **P1** de la stratégie de test LW (cf `server/TESTING.md`) côté client Vue.
> Le client n'a aujourd'hui **aucun test** (`npm test` = juste bundlesize). On part de zéro.
> Ce document est un guide de démarrage : suivre les étapes dans l'ordre.

## 1. Décisions (déjà tranchées)

- **Outil** : `vitest` + `@vue/test-utils` + `happy-dom`. Même famille que le server e2e
  (vitest ^3) → cohérence, pas de nouvel outil à apprendre.
- **Périmètre du premier jet** : la **logique pure** de `src/model/` (calculs, conversions,
  formatage). PAS les composants Vue au début, encore moins l'éditeur Monaco (coûteux à
  monter).
- **Branche** : les tests unitaires vont sur **master** (ils ne dépendent d'aucune stack,
  contrairement à l'e2e qui valide la beta sur develop). CI gratuite : le repo client est
  public (origin), donc minutes GitHub-hosted gratuites.
- **Config dédiée** : un `vitest.config.ts` séparé, **on ne réutilise PAS `vite.config.ts`**
  (il embarque le patch Monaco/dompurify et toute la machinerie de l'app → lent et inutile
  pour des tests de logique).

## 2. État actuel (vérifié le 30/06/2026)

- Vue `^3.4`, Vite `^7.3`, TypeScript `^5.3`, vue-tsc `^3.2`, Vuetify `^3.4`, vue-router `^4.2`.
- Alias `@` → `src` (défini dans `vite.config.ts`, `resolve.alias`, et `tsconfig.json` `paths`).
- **Pas de Pinia** : l'état applicatif vit dans l'objet global `LeekWars` (`src/model/vue.ts`).
- Aucune dépendance de test installée.
- Scripts existants : `test` = `node scripts/bundlesize.mjs` (à NE PAS écraser), `typecheck`
  (vue-tsc pour `.vue`), `typecheck:fast` (tsgo pour `.ts`), `lint`/`lint:fast`.

## 3. Setup pas à pas

### 3.1 Dépendances

```bash
npm i -D vitest @vue/test-utils happy-dom
```

(N'installe que des devDeps, ne démarre aucun serveur. Rappel : **ne jamais `npm run dev`**,
un Vite tourne déjà en permanence ; vitest n'en a pas besoin.)

### 3.2 `vitest.config.ts` (racine du client)

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
	// plugin vue présent pour les futurs tests de composants ; inoffensif pour la logique.
	plugins: [vue()],
	resolve: {
		alias: { '@': path.resolve(__dirname, 'src') },
	},
	test: {
		environment: 'happy-dom',
		include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
		// globals: false → on importe describe/it/expect explicitement (comme le server e2e).
	},
})
```

### 3.3 Scripts `package.json` (à AJOUTER, sans toucher à `test`)

```json
"test:unit": "vitest run",
"test:unit:watch": "vitest"
```

## 4. Premier test (cible : `src/model/capital.ts`)

`capital.ts` expose des fonctions **pures** de logique de jeu (conversion capital ↔ bonus de
stat, stat de base par niveau, capital total par niveau). Régression typique = subtile et
douloureuse → cible à forte valeur.

**Piège** : `capital.ts` fait `import { COSTS } from '@/model/leek'`, et `leek.ts` tire tout
le graphe de modèles (`ai`, `chip`, `farmer`, `fight`, `tournament`, `weapon`, `hat`,
`component`). Pour garder le test hermétique et rapide, on **mocke** `@/model/leek`.

Créer `src/model/capital.test.ts` :

```ts
import { describe, it, expect, vi } from 'vitest'

// capital.ts importe COSTS depuis @/model/leek (qui tire tout le graphe de modèles).
// On le mocke pour un test hermétique. COSTS={} suffit pour les fonctions sans paliers.
vi.mock('@/model/leek', () => ({ COSTS: {} }))

import { totalCapitalForLevel, baseStatFor, capitalToStatBonus } from '@/model/capital'

describe('totalCapitalForLevel', () => {
	it('niveau 1 = 50', () => expect(totalCapitalForLevel(1)).toBe(50))
	it('niveau 2 = 55', () => expect(totalCapitalForLevel(2)).toBe(55))
	it('niveau 100 = 590 (palier +45)', () => expect(totalCapitalForLevel(100)).toBe(590))
	it('niveau 301 = 1780 (bonus spécial +95)', () => expect(totalCapitalForLevel(301)).toBe(1780))
})

describe('baseStatFor', () => {
	it('la vie croît de 3/niveau', () => {
		expect(baseStatFor(1, 'life')).toBe(100)
		expect(baseStatFor(11, 'life')).toBe(130)
	})
	it('stats de base fixes', () => {
		expect(baseStatFor(50, 'tp')).toBe(10)
		expect(baseStatFor(50, 'mp')).toBe(3)
		expect(baseStatFor(50, 'ram')).toBe(6)
		expect(baseStatFor(50, 'cores')).toBe(1)
	})
	it('stat inconnue = 0', () => expect(baseStatFor(50, 'inconnue')).toBe(0))
})

describe('capitalToStatBonus', () => {
	it('capital nul ou négatif = 0', () => {
		expect(capitalToStatBonus('strength', 0)).toBe(0)
		expect(capitalToStatBonus('strength', -10)).toBe(0)
	})
})
```

Lancer :

```bash
npm run test:unit
```

> Si l'import casse malgré le mock (un autre modèle du graphe a un effet de bord au chargement),
> deux options : élargir le `vi.mock`, ou tester d'abord un module 100% feuille. Mais avec le
> mock de `@/model/leek` ci-dessus, `capital.ts` ne devrait tirer aucun autre modèle.

## 5. Cibles suivantes (par valeur, toutes dans `src/model/`)

Privilégier les modules à **logique pure** (calcul/conversion/formatage), pas les classes de
données nues (`pomp.ts` = juste des champs, rien à tester).

- `capital.ts` (fait) — capital ↔ stats.
- Calculs de **loadout** / coûts / talent (`loadout.ts`, `chip.ts`, `weapon.ts` côté logique).
- Géométrie de grille `cell.ts` / `area.ts` (distance, portée, zones) — pur, mais `cell.ts`
  importe un composant `game` → mocker au besoin.
- Tri/agrégation (`sorted_chips.ts`, `ranking.ts`).
- Formatage de nombres/Habs/dates (chercher les helpers dans `src/model/` et `vue.ts`).

À chaque correction de bug front : ajouter un test de non-régression (cf
`feedback_never_regress`).

## 6. Pièges spécifiques au client

- **Graphe de modèles lourd** : beaucoup de `src/model/*.ts` s'importent mutuellement.
  Si un test casse à l'import, `vi.mock` le module lourd ou passe par happy-dom.
- **État global `LeekWars`** (pas Pinia) : tester la logique sans dépendre de son bootstrap ;
  injecter/mocker ce dont la fonction a besoin plutôt que de monter l'app.
- **i18n** : `useI18n().t` = scope global → dans les composants on utilise `useNamespacedT`.
  Pour tester un composant i18n plus tard, installer un plugin i18n de test (pas avant les
  composants).
- **Monaco** (éditeur) : `markRaw()` obligatoire sur les objets Monaco ; ne jamais créer un
  modèle sans code chargé. À tester en **dernier**, c'est le plus coûteux à monter.
- **Composants async / template refs** : pièges connus (un composant `defineAsyncComponent`
  utilisé via template ref expose `null`). Garder les composants pour une 2e vague.
- **Ne jamais `npm run dev`** : un Vite tourne déjà ; vitest est indépendant.

## 7. CI (sur master, repo public = gratuit)

Ajouter un job dans `.github/workflows/build.yml` (ou un workflow `tests.yml` dédié) :

```yaml
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit
```

- Le faire tourner sur **PR + push** (rapide, gratuit).
- **Au début, ne PAS bloquer le déploiement** sur les tests (suite jeune). Quand elle est
  stable et de confiance, ajouter `needs: unit-tests` au job `build` pour gater la prod.

## 8. Definition of done (P1)

- [ ] `vitest` + `@vue/test-utils` + `happy-dom` installés, `vitest.config.ts` en place.
- [ ] `npm run test:unit` vert avec `capital.test.ts`.
- [ ] Scripts `test:unit` / `test:unit:watch` ajoutés (sans toucher `test`).
- [ ] 3 à 5 modules purs de `src/model/` couverts.
- [ ] Job CI `unit-tests` sur master (non bloquant au début).
- [ ] Runbook : ajouter une section "client" à `server/TESTING.md` (§4.6) renvoyant ici.

## Liens

- Stratégie multi-repo : `server/TESTING.md` (§4.6 = client).
- Précédent vitest : `server/test/` (e2e API, même outil).
