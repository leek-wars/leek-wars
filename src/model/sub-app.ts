import { createApp } from 'vue'
import type { App as VueApp, Component } from 'vue'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import router from '@/router'
import { reportVueError } from './error-report'
import { vuetify } from './vuetify'

// Monte un composant Vue hors de l'arbre principal (directives v-code / v-latex, rendu
// Markdown, aperçus de code) avec les mêmes plugins que l'app.
// ⚠️ Volontairement dans son propre module, PAS dans model/vue.ts : ce dernier est le
// bootstrap (il exécute app.use(router), router.beforeEach… au chargement). L'importer
// depuis un composant le rendrait atteignable depuis un cycle d'imports, et son code de
// haut niveau pourrait alors s'exécuter avant que `router` ne soit initialisé
// (« Cannot access 'router' before initialization »). Voir model/vue.test.ts.
export function createSubApp(component: Component, props?: Record<string, unknown>, origin: string = 'sub-app'): VueApp {
	const subApp = createApp(component, props)
	subApp.config.errorHandler = (err, vm, info) => reportVueError(err, vm, info, origin)
	subApp.use(vuetify)
	subApp.use(i18n)
	subApp.use(store)
	subApp.use(router)
	subApp.mixin({ data() { return { LeekWars } } })
	return subApp
}
