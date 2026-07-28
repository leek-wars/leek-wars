import { describe, it, expect } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { createTestVuetify } from '@/test/vuetify'
import { createTestI18n } from '@/test/i18n'

// Fuzzing de la famille de crashs "nextSibling of null" sur <Leek> (#4652, erreur 11807081).
// Mécanisme reproduit : un throw pendant un patch (ex. cleanup d'un VOverlay au démontage
// d'une branche) laisse instance.subTree avec des vnodes JAMAIS montés (el=null) ; le
// re-render suivant crashe en nextSibling(null) au remplacement de branche.
//
// COMPROMIS : la page est une RÉPLIQUE simplifiée de la structure de leek.vue (racine
// conditionnelle error/fragment, v-menu à slot activator, v-dialogs, v-snackbars), pas le
// vrai composant — leek.vue exige store + API + game data, impraticable en boucle de fuzz.
// Si l'agencement des branches racine de leek.vue change, resynchroniser LEEK_TEMPLATE.
//
// Un driver seedé joue des séquences d'états ; après chaque flush on vérifie :
//   1. aucune erreur de patch remontée à l'errorHandler
//   2. invariant : aucun vnode avec el=null (jamais monté) atteignable dans le subTree
//      de la page → c'est la corruption silencieuse du 1er ordre.

interface Anomaly { seed: number, step: number, action: string, kind: string, detail: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function labelOf(vnode: any): string {
	const t = vnode?.type
	if (typeof t === 'symbol') { return t.description || 'sym' }
	if (typeof t === 'string') { return t }
	return t?.name || t?.__name || 'comp'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkTree(vnode: any, path: string[], out: string[], depth = 0) {
	if (!vnode || typeof vnode !== 'object' || depth > 80) { return }
	const p = [...path, labelOf(vnode)]
	if (vnode.component && vnode.component.subTree) { checkTree(vnode.component.subTree, p, out, depth + 1) }
	if (Array.isArray(vnode.children)) {
		for (const c of vnode.children) {
			if (c && typeof c === 'object' && 'type' in c) { checkTree(c, p, out, depth + 1) }
		}
	}
	if (Array.isArray(vnode.dynamicChildren)) {
		for (const c of vnode.dynamicChildren) {
			if (c && typeof c === 'object' && c.el == null) {
				out.push(p.join('›') + '›dyn:' + labelOf(c) + '(el=null,key=' + String(c.key) + ')')
			}
		}
	}
}

const LEEK_TEMPLATE = `
<div class="page">
	<error-page v-if="state.error" />
	<template v-else>
	<div class="page-header page-bar">
		<v-menu v-if="state.leek" open-on-hover location="bottom">
			<template #activator="{ props }">
				<h1 v-bind="props">{{ state.leek.name }}</h1>
			</template>
			<div class="card">tooltip</div>
		</v-menu>
		<h1 v-else>...</h1>
		<div class="tabs">
			<template v-if="state.leek && state.my_leek">
				<v-tooltip>
					<template #activator="{ props }">
						<div class="tab" v-bind="props">garden</div>
					</template>
					tip
				</v-tooltip>
			</template>
			<template v-else-if="state.connected">
				<a v-if="state.leek" href="/challenge"><div class="tab">challenge</div></a>
			</template>
		</div>
	</div>
	<div class="container">
		<div class="panel">
			<div v-if="state.leek" class="talent">{{ state.leek.talent }}</div>
			<div v-else class="loader"></div>
		</div>
		<div v-if="state.leek && state.my_leek" class="capital">capital</div>
	</div>
	<v-dialog v-if="state.leek" v-model="state.renameDialog" width="600"><div>rename</div></v-dialog>
	<v-snackbar v-model="state.renameSuccess" :timeout="2000">ok</v-snackbar>
	<v-snackbar v-if="state.renameError" v-model="state.renameFailed" :timeout="5000">fail</v-snackbar>
	<v-dialog v-if="state.leek && state.my_leek" v-model="state.potionDialog" width="750"><div>potions</div></v-dialog>
	<v-dialog v-model="state.hatDialog" width="750"><div>hats</div></v-dialog>
	<v-dialog v-if="state.leek" v-model="state.levelPopup" width="500"><div>level up</div></v-dialog>
	<v-dialog v-if="state.leek && state.my_leek" v-model="state.aiDialog" width="1050"><div>ai</div></v-dialog>
	</template>
</div>`

function makeLeek(id: number) {
	return { id, name: 'Leek' + id, talent: 100 }
}

// PRNG déterministe (mulberry32)
function rng(seed: number) {
	let a = seed >>> 0
	return () => {
		a |= 0; a = a + 0x6D2B79F5 | 0
		let t = Math.imul(a ^ a >>> 15, 1 | a)
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
		return ((t ^ t >>> 14) >>> 0) / 4294967296
	}
}

// Composants stateless partagés entre toutes les seeds (le shim visualViewport requis
// par les cleanups d'overlay vit dans src/test/vuetify.ts).
const ErrorPage = defineComponent({
	name: 'ErrorPage',
	template: `<div class="page"><div class="page-header page-bar"><h1>404</h1></div><div class="panel">not found</div></div>`,
})
const Other = defineComponent({ name: 'OtherPage', template: `<div class="page">other</div>` })
const PageHost = defineComponent({ name: 'PageHost', render: () => h(RouterView) })

describe('fuzz nextSibling/el-null sur la structure de la page leek', () => {
	it('aucune séquence ne corrompt l\'arbre de vnodes', async () => {
		const anomalies: Anomaly[] = []
		// Instances de plugins immuables : construites une fois, pas 1× par seed.
		const vuetify = createTestVuetify()
		const i18n = createTestI18n({})

		for (let seed = 1; seed <= 40; seed++) {
			const random = rng(seed)
			const errors: string[] = []

			const state = reactive({
				error: false, leek: null as ReturnType<typeof makeLeek> | null, my_leek: false, connected: true,
				renameDialog: false, renameSuccess: false, renameFailed: false, renameError: null as { error: string } | null,
				potionDialog: false, hatDialog: false, levelPopup: false, aiDialog: false,
			})
			const appState = reactive({ banner: false, menu: false })

			const LeekPage = defineComponent({
				name: 'LeekFuzz',
				components: { ErrorPage },
				setup() { return { state } },
				template: LEEK_TEMPLATE,
			})

			const router = createRouter({
				history: createMemoryHistory(),
				routes: [
					{ path: '/', component: Other },
					{ path: '/leek/:id', name: 'leek', component: LeekPage },
				],
			})

			const App = defineComponent({
				name: 'AppFuzz',
				components: { PageHost },
				setup() { return { appState } },
				template: `
					<div id="app">
						<div v-if="appState.menu" class="menu">menu</div>
						<div class="app-center"><div class="app-wrapper">
							<main id="main-content" class="page-wrapper"><page-host /></main>
						</div></div>
						<div v-if="appState.banner" class="verify-banner">verify</div>
					</div>`,
			})

			await router.push('/leek/1')
			const wrapper = mount(App, {
				global: {
					plugins: [vuetify, i18n, router],
					config: {
						errorHandler: (err: unknown) => {
							errors.push(String((err as Error)?.message || err) + '\n' + ((err as Error)?.stack || '').split('\n').slice(0, 6).join('\n'))
						},
					},
				},
				attachTo: document.body,
			})
			await flushPromises()

			// Actions possibles, pondérées vers les bascules structurelles
			let navCounter = 1
			const actions: Array<[string, () => Promise<void> | void]> = [
				['farmer-connect', () => { appState.banner = true; appState.menu = true; state.my_leek = true }],
				['leek-arrive', () => { state.leek = makeLeek(navCounter); if (random() < 0.5) { state.levelPopup = true } }],
				['api-error', () => { state.leek = null; state.error = true }],
				['nav-same-page', async () => {
					navCounter++
					const p = router.push('/leek/' + navCounter)
					// update() du watch(id) : reset error, PAS leek
					state.error = false
					await p
				}],
				['nav-away', async () => { await router.push('/') }],
				['toggle-hat', () => { state.hatDialog = !state.hatDialog }],
				['toggle-rename', () => { state.renameDialog = !state.renameDialog }],
				['snackbar', () => { state.renameSuccess = !state.renameSuccess }],
				['snack-error', () => {
					if (state.renameError) { state.renameFailed = false; state.renameError = null } else { state.renameError = { error: 'x' }; state.renameFailed = true }
				}],
				['disconnect', () => { state.connected = false; state.my_leek = false; appState.menu = false; appState.banner = false }],
				['reconnect', () => { state.connected = true; state.my_leek = true; appState.menu = true }],
				['banner-toggle', () => { appState.banner = !appState.banner }],
				['level-popup-close', () => { state.levelPopup = false }],
			]

			const trace: string[] = []
			for (let step = 1; step <= 25; step++) {
				const [name, fn] = actions[Math.floor(random() * actions.length)]
				trace.push(name)
				try {
					await fn()
				} catch (e) {
					anomalies.push({ seed, step, action: name, kind: 'throw', detail: String((e as Error)?.message) })
					break
				}
				await nextTick()
				await flushPromises()
				if (errors.length) {
					anomalies.push({ seed, step, action: trace.join(' → '), kind: 'patch-error', detail: errors.join(' | ') })
					break
				}
				// Invariant sur le subTree de la page courante
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const leekComp = wrapper.findComponent({ name: 'LeekFuzz' }) as any
				if (leekComp.exists()) {
					const nulls: string[] = []
					checkTree(leekComp.vm.$.subTree, [], nulls)
					if (nulls.length) {
						anomalies.push({ seed, step, action: trace.join(' → '), kind: 'null-el', detail: nulls.join(' | ') })
						break
					}
				}
			}
			wrapper.unmount()
		}

		if (anomalies.length) {
			console.log('=== ANOMALIES ===')
			for (const a of anomalies) {
				console.log(`seed=${a.seed} step=${a.step} [${a.kind}]\n  actions: ${a.action}\n  ${a.detail}\n`)
			}
		}
		expect(anomalies).toEqual([])
	}, 120000)
})
