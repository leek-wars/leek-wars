# Migration Vue 3 Options API → Composition API

Migration de **~263 composants** de l'API Options (avec `vue-property-decorator`) vers `<script setup>` (Composition API).

**Progression** : ~134 / 271 composants migrés (≈ 49 %).

Exemples de référence déjà migrés :
- [src/component/groups/groups.vue](src/component/groups/groups.vue) — page simple
- [src/component/changelog/changelog.vue](src/component/changelog/changelog.vue) — page avec route, computed, lifecycle
- [src/component/changelog/changelog-social.vue](src/component/changelog/changelog-social.vue)
- [src/component/about/about.vue](src/component/about/about.vue) — page complexe avec tableaux de données et template ref
- [src/component/trophies/trophies.vue](src/component/trophies/trophies.vue) — page volumineuse avec watch + computed + localStorage
- [src/component/tournament/tournament.vue](src/component/tournament/tournament.vue) — page avec timer, emitter, route watch
- [src/component/leek-image.vue](src/component/leek-image.vue) — composant avec ~30 computed et méthode `defineExpose`

---

## Guide de migration

### 1. Squelette de base

**Avant (Options API class)** :
```vue
<script lang="ts">
import { Options, Vue } from 'vue-property-decorator'
import { mixins } from '@/model/i18n'

@Options({ name: 'my-comp', i18n: {}, mixins: [...mixins], components: { Foo, Bar } })
export default class MyComp extends Vue {
    // ...
}
</script>
```

**Après (`<script setup>`)** :
```vue
<script setup lang="ts">
import { mixins } from '@/model/i18n'
import Foo from './foo.vue'
import Bar from './bar.vue'

defineOptions({ name: 'my-comp', i18n: {}, mixins: [...mixins] })
// `components` n'est plus nécessaire : les imports sont auto-enregistrés
</script>
```

**À retenir** :
- `name` et `i18n: {}` sont **obligatoires** pour le système de traduction (cf. [src/model/i18n.ts:115-128](src/model/i18n.ts#L115-L128) qui résout le fichier `.i18n` via `$options.name`).
- Les composants importés sont auto-enregistrés en `<script setup>` ; on supprime `components: {...}`.
- Si l'`@Options` contient un alias (`'lw-title': LWTitle`), garder la version aliasée dans `defineOptions({ components: {...} })` ou utiliser le composant directement avec son nom kebab-case (les imports auto-enregistrés respectent le nom du symbole).
- Les mixins i18n restent indispensables pour le hot-reload des traductions (`beforeCreate` + watcher `$i18n.locale`).

### 2. Props

**Avant** :
```ts
@Prop({required: true}) id!: number
@Prop() disabled!: boolean
@Prop({default: 0}) value!: number
```

**Après** :
```ts
const props = defineProps<{
    id: number
    disabled?: boolean
    value?: number
}>()

// Avec valeurs par défaut :
const props = withDefaults(defineProps<{
    id: number
    disabled?: boolean
    value?: number
}>(), {
    disabled: false,
    value: 0,
})
```

Dans le `<template>`, les props restent accessibles directement par leur nom (pas `props.id`).
Dans `<script setup>`, utiliser `props.id`.

### 3. Données réactives (data)

**Avant** :
```ts
leek: Leek | null = null
expand_items: boolean = false
LeekWars = LeekWars
```

**Après** :
```ts
import { ref } from 'vue'

const leek = ref<Leek | null>(null)
const expand_items = ref(false)
// LeekWars est une constante non-réactive : pas besoin de ref()
```

Dans le template : `leek` reste utilisable tel quel (auto-unwrap des refs en template).
Dans le script : utiliser `leek.value`.

### 4. Computed (getters)

**Avant** :
```ts
get teamMode(): string {
    return this.compositionMode ? 'composition' : 'team'
}
```

**Après** :
```ts
import { computed } from 'vue'

const teamMode = computed(() => compositionMode.value ? 'composition' : 'team')
```

### 5. Watchers

**Avant** :
```ts
@Watch('id')
update() { /* ... */ }

@Watch('$route.params', {immediate: true})
onRouteChange() { /* ... */ }

@Watch('searchQuery') @Watch('searchLeeks')
searchUpdate() { /* ... */ }
```

**Après** :
```ts
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(() => props.id, () => { /* ... */ })

watch(() => route.params, () => { /* ... */ }, { immediate: true })

watch([searchQuery, searchLeeks], () => { /* ... */ })
```

Pour un watcher avec `deep`, `flush`, etc., 3e argument : `{ deep: true, immediate: true }`.

### 6. Lifecycle hooks

| Options API     | Composition API   |
|-----------------|-------------------|
| `created()`     | corps du `<script setup>` (ou `onBeforeMount`) |
| `mounted()`     | `onMounted()`     |
| `beforeUnmount()` | `onBeforeUnmount()` |
| `unmounted()`   | `onUnmounted()`   |
| `activated()`   | `onActivated()`   |
| `deactivated()` | `onDeactivated()` |

```ts
import { onMounted, onUnmounted } from 'vue'

onMounted(() => { /* ... */ })
onUnmounted(() => { /* ... */ })
```

### 7. Template refs

**Avant** :
```vue
<input ref="search">
```
```ts
(this.$refs.search as HTMLElement).focus()
```

**Après** :
```vue
<input ref="search">
```
```ts
import { ref, useTemplateRef } from 'vue'

const search = useTemplateRef<HTMLInputElement>('search')
// ou pattern legacy : const search = ref<HTMLInputElement | null>(null)

search.value?.focus()
```

**Note** : pour un composant Vue référencé par ref (ex. `<v-menu ref="menu">`), le typer en `any` ou utiliser le type du composant si exporté.

### 8. Events / emits

**Avant** :
```ts
@Options({ emits: ['update:modelValue', 'gotoresult'] })
// ...
this.$emit('update:modelValue', v)
this.$emit('gotoresult', { type, id })
```

**Après** :
```ts
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'gotoresult': [event: { type: string, id: number }]
}>()

emit('update:modelValue', v)
emit('gotoresult', { type, id })
```

### 9. Accès store / route / router / i18n / filters

| Avant (template)    | Avant (script)       | Après (script setup)                               |
|---------------------|----------------------|----------------------------------------------------|
| `$store.state.x`    | `this.$store`        | `import { store } from '@/model/store'` + `store.state.x` |
| `$route.params.x`   | `this.$route`        | `const route = useRoute()` + `route.params.x`      |
| `$router.push(...)` | `this.$router`       | `const router = useRouter()` + `router.push(...)`  |
| `$t('key')`         | `this.$t('key')`     | `const { t } = useI18n()` + `t('key')`             |
| `$tc('key', n)`     | `this.$tc(...)`      | `const { tc } = useI18n()` + `tc(...)`             |
| `$filters.number()` | `this.$filters.x`    | `import { LeekWars } from '@/model/leekwars'` + `LeekWars.formatNumber(...)` |
| `$store.getters.x`  | `this.$store.getters.x` | `store.getters.x` |
| `$i18n.locale`      | `this.$i18n.locale`  | `const { locale } = useI18n()` ou `import { locale } from '@/model/i18n'` |

**Dans le template, `$t`, `$store`, `$route`, `$filters` restent disponibles globalement** — pas besoin de tout réécrire si on n'utilise ces propriétés que dans le template.

### 10. emitter (event bus)

Inchangé : `import { emitter } from '@/model/vue'` (ou `'@/model/emitter'`) + `emitter.on(...)` / `emitter.emit(...)` / `emitter.off(...)`. Pour les listeners, **toujours nettoyer dans `onUnmounted`**.

### 11. Mixins i18n + lifecycle de chargement des traductions

Les traductions par composant sont chargées via le mixin défini dans [src/model/i18n.ts](src/model/i18n.ts). Pour qu'il fonctionne :
- Il faut **un `name`** qui correspond au nom du fichier `.i18n` (kebab-case).
- Il faut conserver `i18n: {}` dans `defineOptions`.
- Il faut conserver `mixins: [...mixins]`.

Sans ça, le composant n'aura pas ses traductions en hot reload.

### 12. Async components / lazy imports

**Avant** :
```ts
const LWTitle = defineAsyncComponent(() => import('@/component/title/title.vue'))
@Options({ components: { 'lw-title': LWTitle } })
```

**Après** : si on n'utilise pas l'alias, importer normalement :
```ts
import LWTitle from '@/component/title/title.vue'
```
ou en async :
```ts
import { defineAsyncComponent } from 'vue'
const LWTitle = defineAsyncComponent(() => import('@/component/title/title.vue'))
```
Si on a besoin de l'alias `lw-title`, le passer dans `defineOptions({ components: { 'lw-title': LWTitle } })`.

### 13. Cas spéciaux

#### Constants exposées au template (`LeekWars`, `CHIPS`, etc.)
**Avant** :
```ts
LeekWars = LeekWars
CHIPS = CHIPS
```

**Après** : il suffit d'importer le module et le template y aura accès grâce au binding implicite de `<script setup>` :
```ts
import { LeekWars } from '@/model/leekwars'
import { CHIPS } from '@/model/chips'
```
Les identifiants importés sont automatiquement exposés au template.

> ⚠️ Une mixin globale dans [src/model/vue.ts:325-332](src/model/vue.ts#L325-L332) injecte déjà `LeekWars` dans tous les composants → utilisable directement dans le template **même sans import** dans `<script setup>`. Préférer quand même l'import explicite pour la lisibilité du code TS.

#### `nextTick`
```ts
import { nextTick } from 'vue'
nextTick(() => { /* ... */ })
```

#### `beforeRouteLeave`, `beforeRouteEnter`, `beforeRouteUpdate`
```ts
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
onBeforeRouteLeave((to, from) => { /* ... */ })
```

#### `defineAsyncComponent` au top-level
Possible directement dans `<script setup>`.

#### Slots
```ts
import { useSlots } from 'vue'
const slots = useSlots()
```

#### Provide / Inject
```ts
import { provide, inject } from 'vue'
provide('key', value)
const x = inject<Type>('key')
```

### 14. Erreurs courantes

- **Oublier `.value`** sur les refs dans le script (le compilateur TS le signalera).
- **Oublier `defineOptions({ name, i18n: {}, mixins: [...mixins] })`** → traductions cassées.
- **Inverser** un `props.x` (script) avec `x` (template) : dans le template, on utilise `x` ; dans le script, `props.x`.
- **Watcher sur une prop** : il faut un getter `() => props.x`, pas `props.x` directement.
- **Watcher sur `$route.x`** : utiliser `() => route.x` (getter).
- **`markRaw()`** sur les objets Monaco assignés à des refs réactives (cf. mémoire projet).
- **Lifecycle de mixin i18n** : ne PAS retirer `mixins: [...mixins]` même si ça compile sans, sinon HMR i18n cassé.

---

## Plan de migration

Stratégie : du plus simple au plus complexe, par dossier. Chaque case cochée = composant migré et fichier qui compile sans erreur de type.

Légende : `[ ]` à faire · `[x]` migré · `[~]` partiel/bloqué

### Phase 1 — Lots faciles (composants d'affichage simples)

#### `action/` (30 composants) ✅
- [x] action-add-effect.vue
- [x] action-bug.vue
- [x] action-care.vue (corrige aussi le `Leek` non importé pré-existant)
- [x] action-end-fight.vue
- [x] action-lama.vue
- [x] action-leek-turn.vue
- [x] action-life-lost.vue
- [x] action-move.vue
- [x] action-new-turn.vue (avec `defineEmits` pour `goToTurn`)
- [x] action-nova-damage.vue
- [x] action-nova-vitality.vue
- [x] action-open-chest.vue
- [x] action-player-dead.vue
- [x] action-reduce-effects.vue
- [x] action-remove-poisons.vue
- [x] action-remove-shackles.vue
- [x] action-resurrection.vue
- [x] action-say-old.vue
- [x] action-say.vue (computed + store)
- [x] action-set-weapon-old.vue (ajout `leeks` prop manquant)
- [x] action-set-weapon.vue
- [x] action-show-old.vue (ajout `leeks` prop manquant)
- [x] action-show.vue
- [x] action-stack-effect.vue
- [x] action-summon.vue
- [x] action-use-chip-old.vue (ajout `CHIPS` import manquant pré-existant)
- [x] action-use-chip.vue
- [x] action-use-weapon-old.vue
- [x] action-use-weapon.vue
- [x] action-vitality.vue

#### `effect/` (23 composants) ✅
- [x] effect-absolute-shield.vue
- [x] effect-absolute-vulnerability.vue
- [x] effect-add-state.vue
- [x] effect-buff-agility.vue
- [x] effect-buff-magic.vue
- [x] effect-buff-mp.vue
- [x] effect-buff-power.vue
- [x] effect-buff-resistance.vue
- [x] effect-buff-science.vue
- [x] effect-buff-strength.vue
- [x] effect-buff-tp.vue
- [x] effect-buff-wisdom.vue
- [x] effect-damage-return.vue
- [x] effect-multiply-stats.vue
- [x] effect-poison.vue
- [x] effect-relative-shield.vue
- [x] effect-shackle-agility.vue
- [x] effect-shackle-magic.vue
- [x] effect-shackle-mp.vue
- [x] effect-shackle-strength.vue
- [x] effect-shackle-tp.vue
- [x] effect-shackle-wisdom.vue
- [x] effect-vulnerability.vue

#### `rich-tooltip/` (6 composants)
- [ ] rich-tooltip-composition.vue
- [ ] rich-tooltip-farmer.vue
- [ ] rich-tooltip-item.vue
- [ ] rich-tooltip-leek.vue
- [ ] rich-tooltip-team.vue
- [ ] rich-tooltip-trophy.vue

#### Composants racine (au niveau de `src/component/`)
- [ ] avatar.vue
- [ ] emblem.vue
- [ ] flag.vue
- [ ] item.vue
- [ ] leek-image.vue
- [ ] pagination.vue
- [ ] popup.vue
- [ ] ranking-badge.vue
- [ ] talent.vue
- [ ] turret-image.vue
- [ ] type.vue

### Phase 2 — Lots moyens (pages secondaires)

#### `tutorial/` + `didactitiel/` + `didactitiel-new/`
- [ ] (à lister)

#### `history/` (5 composants)
- [ ] (à lister)

#### `tournament/` (4 composants)
- [ ] (à lister)

#### `encyclopedia/` (4 composants)
- [ ] (à lister)

#### `changelog/` (restants)
- [ ] changelog-dialog.vue
- [ ] changelog-version.vue

#### `notifications/`
- [ ] (à lister)

#### `messages/`
- [ ] (à lister)

#### `comment/`
- [ ] (à lister)

#### `forgot-password/` + `change-email/` + `accept-conditions/` + `contact/` + `legal/`
- [ ] (à lister)

#### `about/` + `bank/` + `general-help/` + `mobile-app/` + `press-kit/` + `dev-blog/` + `creator/`
- [ ] (à lister)

### Phase 3 — Lots feature-heavy

#### `forum/` (6 composants)
- [ ] (à lister)

#### `admin/` (17 composants)
- [ ] (à lister)

#### `market/` (17 composants)
- [ ] (à lister)

#### `report/` (9 composants)
- [ ] (à lister)

#### `chat/` (9 composants)
- [ ] (à lister)

#### `ranking/` (6 composants)
- [ ] ranking.vue
- [ ] ranking-leek-row.vue
- [ ] ranking-farmer-row.vue
- [ ] ranking-team-row.vue
- [ ] ranking-composition-row.vue
- [ ] ranking-search-result.vue

#### `garden/` (5 composants)
- [ ] (à lister)

#### `inventory/` + `items/` + `workshop/` + `forge/` + `trophies/` + `trophy/` + `title/` + `talent/` + `console/` + `documentation/` + `help/` + `signup/` + `login/` + `new-leek/` + `settings/` + `statistics/` + `status/` + `report/` + `team/` + `teams/` + `player/` + `fight/` + `moderation/` + `line-of-sight/` + `group/` + `api/`
- [ ] (à lister)

### Phase 4 — Pages les plus lourdes

- [ ] team/team.vue (2311 lignes)
- [ ] leek/leek.vue (2145 lignes)
- [ ] editor/editor-test.vue (1994 lignes)
- [ ] editor/ai-view.vue (1947 lignes)
- [ ] editor/editor.vue (1879 lignes)
- [ ] farmer/farmer.vue (1604 lignes)
- [ ] group/group.vue (1338 lignes)
- [ ] forum/forum-topic.vue (1325 lignes)
- [ ] player/player.vue (1251 lignes)
- [ ] editor/git-panel.vue (1153 lignes)
- [ ] report/report.vue (1125 lignes)
- [ ] garden/garden.vue (1102 lignes)
- [ ] forum/forum-category.vue (1063 lignes)
- [ ] market/market.vue (1034 lignes)
- [ ] encyclopedia/encyclopedia.vue (1021 lignes)
- [ ] signup/signup.vue (1013 lignes)

### Phase 5 — App layout (en dernier, le plus risqué)

#### `app/` (20 composants — à migrer en dernier)
- [ ] app.vue
- [ ] menu.vue (807 lignes)
- [ ] (autres)

### Phase 6 — `editor/` (le plus complexe)

#### `editor/` (17 composants)
- [ ] editor.vue
- [ ] ai-view.vue
- [ ] ai-view-monaco.vue
- [ ] editor-test.vue
- [ ] git-panel.vue
- [ ] (autres)

---

## État de la migration (résumé)

**Dossiers entièrement migrés :**
- `effect/` (23 composants)
- `action/` (30 composants)
- `rich-tooltip/` (6 composants)
- `changelog/` (4 composants)
- `accept-conditions/`, `conditions/`, `legal/`, `contact/`, `dev-blog/`, `general-help/`, `mobile-app/`, `press-kit/`, `help/`, `api/`, `change-email/`, `forgot-password/`, `about/`, `tutorial/`, `line-of-sight/`, `talent/`, `title/`, `trophy/`, `trophies/`, `notifications/`, `login/`, `tournament/`, `history/`, `explorer/`
- Composants racine du dossier `component/` (avatar, emblem, flag, item, leek-image, pagination, popup, ranking-badge, talent, turret-image, type)

**Dossiers partiellement migrés :**
- `ranking/` : rows et search-result migrés ; ranking.vue (≈500 lignes) reste en Options
- `signup/` : signup-result migré ; signup.vue (≈1000 lignes) reste
- `forum/` : breadcrumb, forum-formatting-rules migrés ; forum-topic, forum-category, forum-search restent
- `report/` : action-leek, report-log, report-statistics-entity migrés ; reste 6 fichiers
- `app/` : error, mobile-br, pseudo migrés ; reste 17 fichiers (app.vue, menu.vue, etc.)
- `market/` : 6 previews migrées ; reste 11 fichiers (item-preview.vue, scheme.vue, market.vue, etc.)
- `tutorial/` : tutorial.vue, screen.vue migrés
- `leek/` : leek-component migré ; reste 7 fichiers (leek.vue 2100 lignes, etc.)

**Dossiers restants intégralement à migrer :**
- `admin/` (18 fichiers)
- `editor/` (17 fichiers, dont les plus gros : editor.vue, ai-view.vue, etc.)
- `chat/` (9 fichiers)
- `garden/` (5 fichiers)
- `moderation/` (5 fichiers)
- `bank/` (4), `encyclopedia/` (4)
- `comment/`, `console/`, `creator/`, `didactitiel/`, `didactitiel-new/`, `documentation/` (3), `farmer/`, `fight/`, `forge/`, `group/`, `inventory/` (2), `items/`, `messages/` (2), `new-leek/`, `player/` (3), `settings/` (2), `statistics/`, `status/`, `team/`, `teams/`, `workshop/`

## Notes au fur et à mesure

> Cette section est mise à jour quand on rencontre un cas non documenté.

### ⚠️ `import { X }` (sans `type`) éclipse les composants globaux

En `<script setup>`, **tous les imports top-level deviennent des bindings disponibles dans le template**, y compris les classes de modèles. Si on importe par exemple `Notification` (la classe) du model, le tag template `<notification>` sera résolu vers cette classe (qui n'est pas un composant Vue) au lieu du composant globalement enregistré dans [src/model/vue.ts](src/model/vue.ts) (ex. `app.component('notification', NotificationElement)`).

Symptôme : `<notification>`, `<chat>`, `<panel>`, `<loader>`, etc. ne s'affichent plus correctement, ou affichent un composant vide.

**Solution** : utiliser `import type` pour que l'import soit erasé du JS compilé :
```ts
import type { Notification } from '@/model/notification'  // ✅ ne shadow plus
import { Notification } from '@/model/notification'       // ❌ shadow le composant global
```

Composants globaux enregistrés dans vue.ts (à ne pas shadower) : `leek-image`, `avatar`, `emblem`, `talent`, `ranking-badge`, `notification`, `lw-code`, `error`, `panel`, `popup`, `loader`, `flag`.

### ⚠️ `defineOptions({ components })` ne peut pas référencer un `defineAsyncComponent` local

Erreur du compilateur Vue : `defineOptions() in <script setup> cannot reference locally declared variables because it will be hoisted outside of the setup() function`.

Les imports statiques (`import X from '...'`) sont hoistés et peuvent rester dans `defineOptions({ components })`. Mais `const X = defineAsyncComponent(() => import(...))` est une const locale — interdite.

**Solutions** :
- **Si le nom auto-résolu (PascalCase ↔ kebab-case) correspond au tag template** : retirer simplement le mapping de `defineOptions`. Le `<script setup>` auto-enregistre l'import. Exemples : `Didactitiel` → `<didactitiel>` ✓ ; `RichTooltipItem` → `<rich-tooltip-item>` ✓ ; `LwTitle` → `<lw-title>` ✓.
- ⚠️ **Attention à la conversion** : Vue insère un tiret avant CHAQUE majuscule successive. Donc `LWTitle` → `<l-w-title>` (PAS `<lw-title>`) ; `AIViewMonaco` → `<a-i-view-monaco>` (PAS `<ai-view-monaco>`). Renommer en `LwTitle`, `AiViewMonaco` pour matcher le tag template souhaité.
- **Si l'alias diffère du nom auto-résolu** (ex. `chat: ChatElement` → template `<chat>` mais kebab de `ChatElement` est `<chat-element>`) : renommer l'import (`ChatElement` → `Chat`) **ou** utiliser un bloc `<script>` séparé non-setup pour déclarer les composants :
```vue
<script lang="ts">
import { defineAsyncComponent } from 'vue'
const Scheme = defineAsyncComponent(() => import('./scheme.vue'))
export default {
    components: { scheme: Scheme }
}
</script>
<script setup lang="ts">
// reste du script setup
</script>
```

### `LeekWars` / `env` accessibles globalement dans le template

`LeekWars` et `env` sont injectés via une mixin globale dans [src/model/vue.ts](src/model/vue.ts). En Options API, ils sont accessibles depuis le template via l'instance proxy. En `<script setup>`, vue-tsc ne les voit pas par défaut.

**Solution** : déclaration globale dans [src/custom.d.ts](src/custom.d.ts) :
```ts
declare module 'vue' {
    interface ComponentCustomProperties {
        LeekWars: typeof import('@/model/leekwars').LeekWars
        env: typeof import('@/env').env
    }
}
```

Du coup, **pas besoin d'importer `LeekWars` dans chaque `<script setup>`** si on l'utilise uniquement dans le template. Si on l'utilise dans le script, faire l'import explicite.

### Composant local aliasé (`leek` → `ActionLeekElement`)

Plusieurs composants `effect/` et `action/` font `@Options({ components: { leek: ActionLeekElement } })` puis utilisent `<leek>` dans le template. En `<script setup>`, plus simple : renommer l'import en `Leek` (Vue résout automatiquement `<leek>` ↔ `Leek`).

**Avant** :
```ts
import ActionLeekElement from '../report/action-leek.vue'
@Options({ components: { leek: ActionLeekElement } })
```

**Après** :
```ts
import Leek from '../report/action-leek.vue'
// rien d'autre — Vue résout <leek> via PascalCase ↔ kebab-case
```

### Conflit de nom : composant `Leek` vs type `Leek`

Si un fichier importe à la fois le composant et le type, aliaser le type :
```ts
import type { Leek as LeekModel } from '@/model/leek'
import Leek from '../report/action-leek.vue'
defineProps<{ leeks: {[key: number]: LeekModel} }>()
```

### Typage strict des objets `Record<number, X>` indexés par `any`

Le `<script setup>` est plus strict que les classes Options API. Indexer un dictionnaire `{0: '...', 1: '...'}` (type littéral) avec une clé `any` provoque `TS7053`.

**Solution** : ré-exposer le binding avec un type plus large :
```ts
import { EffectComponents as EffectComponentsTyped } from '@/model/action-components'
const EffectComponents: Record<number, any> = EffectComponentsTyped
```

Pareil pour `ITEM_CATEGORY_NAME`, `CHIPS`, `WEAPONS`, etc., quand utilisés dans un template avec une clé dynamique.

### `leeks` typé largement

Dans les composants `action/`, le prop `leeks` reçoit en réalité un mélange de types (`FightLeek` enrichi de `farmer`, `team`, etc.). Le parent ([report-actions.vue](src/component/report/report-actions.vue#L37)) le type `{[key: number]: any}`. Migrer les enfants avec le même type :
```ts
defineProps<{ leeks: Record<number, any> }>()
```
Sinon des erreurs `Property 'team' does not exist on type 'Leek'` apparaissent.

### Accès à `$store` dans le template

En Options API, `$store.state.x` fonctionne via le plugin Vuex installé globalement. En `<script setup>`, vue-tsc ne le voit pas toujours et lance des erreurs. Solution : importer `store` explicitement et utiliser `store.state.x` dans le template (le binding du script setup est exposé).

```ts
import { store } from '@/model/store'
```
```vue
<template v-if="store.state.farmer?.admin">
```

### ⚠️ Collision tag custom ↔ ref camelCase (PIÈGE MAJEUR)

Le compilateur `<script setup>` résout `<some-component>` en cherchant les bindings setup dans cet ordre :
1. `SomeComponent` (PascalCase)
2. `someComponent` (camelCase)
3. `_resolveComponent('some-component')` → fallback vers `components: {}`

**Problème** : si un ref booléen (typique pour un `v-model` de dialog) porte le même nom camelCase que le tag, il est utilisé **à la place** du composant, et le tag rend `_createVNode(false, ...)` à chaque render → warning `Invalid vnode type when creating vnode: false. at <App>`.

**Exemple cassé** :
```vue
<changelog-dialog v-model="changelogDialog" :changelog="changelog" />
```
```ts
const changelogDialog = ref(false)  // ← collision avec <changelog-dialog>
```

**Fix** : renommer le ref pour qu'il ne corresponde pas au camelCase du tag.
```ts
const showChangelog = ref(false)  // ✓
```
```vue
<changelog-dialog v-model="showChangelog" :changelog="changelog" />
```

Patterns à éviter : `reportDialog` / `<report-dialog>`, `levelDialog` / `<level-dialog>`, `loginDialog` / `<login-dialog>`, etc.

Le warning ne déclenche que sur **re-render** (pas au premier render), donc se manifeste après une mutation du store ou du state.
