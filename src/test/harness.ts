import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { createTestI18n } from './i18n'

// Harnais de montage pour composants Vue. Assemble les globals dont un composant a besoin
// pour rendre hors de l'app (cf. src/model/vue.ts) :
//   - vue-i18n (pour $t / <i18n-t>), voir createTestI18n
//   - vue-router (pour <router-link> / <router-view>), avec une route attrape-tout
//   - un mixin global injectant `LeekWars` et `env` (l'app les injecte dans le data() de TOUS
//     les composants via app.mixin ; d'innombrables templates réfèrent le bare `LeekWars.*`)
// Vuetify n'est PAS installé par défaut (coûteux) : passer `vuetify: true` pour l'activer.

const CATCH_ALL: RouteRecordRaw[] = [
	{ path: '/:pathMatch(.*)*', name: 'catchall', component: { template: '<div />' } },
]

interface HarnessOptions {
	/** Messages i18n seedés (namespacés comme dans l'app, cf. createTestI18n). */
	messages?: Record<string, unknown>
	locale?: string
	/** Stub de l'objet global `LeekWars` référencé dans les templates. */
	leekWars?: Record<string, unknown>
	/** Routes du routeur de test (défaut : attrape-tout). */
	routes?: RouteRecordRaw[]
	/** Instance Vuetify (createTestVuetify()) à installer si le composant utilise des <v-*>. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	vuetify?: any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountComponent(component: any, options: Record<string, any> = {}, harness: HarnessOptions = {}) {
	const i18n = createTestI18n(harness.messages ?? {}, harness.locale)
	const router = createRouter({ history: createMemoryHistory(), routes: harness.routes ?? CATCH_ALL })

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const plugins: any[] = [i18n, router]
	if (harness.vuetify) { plugins.push(harness.vuetify) }

	const leekMixin = { data: () => ({ LeekWars: harness.leekWars ?? {}, env: {} }) }
	const optGlobal = options.global ?? {}

	return mount(component, {
		...options,
		global: {
			...optGlobal,
			plugins: [...plugins, ...(optGlobal.plugins ?? [])],
			mixins: [leekMixin, ...(optGlobal.mixins ?? [])],
		},
	})
}
