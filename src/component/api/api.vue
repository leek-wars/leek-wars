<template>
	<div class="page documentation-page">
		<div class="page-header page-bar">
			<div>
				<h1>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
				</h1>
			</div>
			<div class="tabs">
				<!-- <router-link v-if="!LeekWars.mobile" :to="'/encyclopedia/' + $i18n.locale + '/' + $t('main.game_rules').replace(/ /g, '_')">
					<div class="tab">
						<v-icon>mdi-help-circle-outline</v-icon>
						{{ $t('main.general_help') }}
					</div>
				</router-link>
				<router-link v-if="!LeekWars.mobile" :to="'/encyclopedia/' + $i18n.locale + '/' + $t('main.tutorial')">
					<div class="tab">
						<v-icon>mdi-laptop</v-icon>
						{{ $t('main.tutorial') }}
					</div>
				</router-link> -->
				<div class="tab disabled search" icon="search" link="/search">
					<img class="search-icon" src="/image/search.png">
					<input ref="search" v-model="query" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
				</div>
				<div v-if="services.length" class="tab action openapi-tab" title="OpenAPI" @click="downloadOpenApi">
					<v-icon>mdi-download</v-icon>
					<span>OpenAPI</span>
				</div>
				<!-- <div class="tab action" icon="search" link="/search" @click="toggleLarge">
					<v-icon v-if="LeekWars.large">mdi-fullscreen-exit</v-icon>
					<v-icon v-else>mdi-fullscreen</v-icon>
				</div> -->
			</div>
		</div>
		<div class="container documentation last">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column4">
				<panel class="first">
					<template #content>
						<div class="items-list">
							<div v-for="(category, c) of filteredCategories" :key="c">
								<h2 v-ripple @click="toggleCategory(c)">
									<v-icon>mdi-{{ icons[c] }}</v-icon>
									<!-- {{ $t('doc.function_category_' + c) }} -->
									<span>{{ c }}</span>
									<span v-if="query.length">({{ category.length }})</span>
									<div class="spacer"></div>
									<v-icon v-if="query.length || categoryState[c]">mdi-chevron-up</v-icon>
									<v-icon v-else>mdi-chevron-down</v-icon>
								</h2>
								<div v-if="query.length || categoryState[c]">
									<div v-for="(item, i) in category" :key="i" :item="item.name" class="item" @click="navigate(item.module + '/' + item.function)">
										<span class="method chip" :class="item.method">{{ item.method }}</span>
										{{ item.function }}
									</div>
								</div>
							</div>
						</div>
					</template>
				</panel>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column8">
				<div ref="elements" class="items" @scroll="scroll">
					<api-keys :reference-only="!($store.state.farmer && $store.state.farmer.verified)" class="service" />
					<panel v-for="(service, s) in filteredItems" :key="s" class="service" :class="{ deprecated: service.deprecated }" :item="service.module + '_' + service.function" >
						<div class="title">
							<span class="module">{{ service.module }}</span>/<span class="function">{{ service.function }}</span>
							<template v-for="(parameter, p) in service.parameters" :key="p">
								<span>/</span>
								<span class="parameter">{{ parameter }}</span>
							</template>
							<template v-if="service.returns.length"> → <span class="returns">{{ service.returns.join(", ") }}</span></template>
							<v-icon class="permalink" :title="$t('copy_section_link')" @click="copyLink(service)">mdi-link-variant</v-icon>
						</div>
						<div class="chips">
							<span v-if="service.deprecated" class="deprecated chip">{{ t('deprecated') }}</span>
							<span class="method chip" :class="service.method">{{ service.method }}</span>
							<span v-if="service.scope" class="role chip" :class="service.scope" :title="t('role_' + service.scope + '_hint')">{{ t('role_' + service.scope) }}</span>
							<span v-if="service.auth" class="auth chip">{{ $t('auth') }}</span>
							<a v-if="service.example_url" :href="LeekWars.API + service.example_url" target="_blank" class="demo chip">
								/api/{{ service.example_url }} <v-icon>mdi-open-in-new</v-icon>
							</a>
						</div>

						<div class="service-body">
							<div class="service-info">
								<markdown v-if="$te(service.module + '_' + service.function)" class="description" :content="$t(service.module + '_' + service.function)" :pages="{}" mode="encyclopedia" />
								<div v-else class="description grey">{{ $t('no_desc') }}</div>

								<template v-if="service.parameters.length > 0">
									<h4>{{ $t('parameters') }}</h4>
									<ul class="parameters">
										<li v-for="(parameter, p) in service.parameters" :key="p" class="parameter">
											<span class="name">{{ parameter }}</span> : {{ service.parameters_types[p] }}
										</li>
									</ul>
								</template>

								<template v-if="service.returns.length > 0">
									<h4>{{ $t('return') }}</h4>
									<ul class="parameters">
										<li v-for="(ret, p) in service.returns" :key="p" class="parameter">
											<span class="name">{{ ret }}</span> : {{ service.returns_types[p] }}
										</li>
									</ul>
								</template>
							</div>

							<div class="service-examples">
								<div class="doc-code">
									<h4>{{ t('example_call') }}</h4>
									<div class="code-block">
										<div class="code-tabs">
											<span v-for="l in LANGS" :key="l" class="code-tab" :class="{ active: activeLang === l }" :title="LANG_LABELS[l]" @click="activeLang = l">
												<v-icon>{{ LANG_ICONS[l] }}</v-icon>
												<span class="lang-label">{{ LANG_LABELS[l] }}</span>
											</span>
											<div class="spacer"></div>
											<v-icon class="copy-btn" :title="t('copy')" @click="copyCode(buildSnippet(service, activeLang))">mdi-content-copy</v-icon>
										</div>
										<pre class="code-snippet" :class="resolveCodeThemeClass()"><code v-html="snippetHtml(service)"></code></pre>
									</div>
								</div>
								<div v-if="service.example" class="doc-response">
									<h4>{{ t('example_response') }}</h4>
									<pre class="example">{{ formatExample(service.example) }}</pre>
								</div>
							</div>
						</div>
					</panel>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, computed, markRaw, watch, onMounted, onBeforeUnmount, useTemplateRef, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { i18n, locale, mixins , normalizeComponentName, useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import Breadcrumb from '../forum/breadcrumb.vue'
import Markdown from '@/component/encyclopedia/markdown.vue'
import { emitter } from '@/model/vue'
import { LANGS, LANG_LABELS, LANG_ICONS, LANG_MONACO_IDS, buildSnippet, type Lang } from './code-examples'
import { resolveCodeThemeClass } from '@/component/editor/code-theme'
import { buildOpenApi } from './openapi'

// Langue d'exemple de code, partagée par tous les endpoints et persistée.
const activeLang = ref<Lang>((localStorage.getItem('api-doc/lang') as Lang) || 'curl')
watch(activeLang, l => localStorage.setItem('api-doc/lang', l))

// Coloration des snippets par le tokenizer Monaco, comme les aperçus du chat et de
// l'encyclopédie (#4575). Import PARESSEUX : le chunk monaco ne doit pas être tiré au
// chargement de la page, et monaco-highlight n'importe aucun module applicatif (il ne
// doit pas entrer dans le graphe de boot). markRaw : objet Monaco jamais proxifié par Vue.
const highlighter = ref<typeof import('@/component/editor/monaco-highlight') | null>(null)
// La page rend plusieurs centaines de panneaux : sans cache, chaque re-rendu
// retokeniserait tous les snippets. Clé = endpoint + langage, le snippet est déterministe.
const highlightCache = new Map<string, string>()

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// HTML du snippet : colorisé si le moteur est chargé ET le langage a une grammaire
// (HTTP n'en a pas), sinon texte brut échappé.
function snippetHtml(service: ApiService): string {
	const key = service.module + '_' + service.function + '|' + activeLang.value
	const cached = highlightCache.get(key)
	if (cached !== undefined) { return cached }
	const code = buildSnippet(service, activeLang.value)
	const languageId = LANG_MONACO_IDS[activeLang.value]
	const html = (highlighter.value && languageId)
		? highlighter.value.highlightToHtml(code, languageId)
		: escapeHtml(code)
	highlightCache.set(key, html)
	return html
}

// Composant async : utilisable directement dans le template (script setup),
// NE PAS le référencer dans defineOptions (variable locale, hoisting interdit).
const ApiKeys = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/api-keys/api-keys.${locale}.i18n`))

defineOptions({ name: 'Api', i18n: {}, mixins: [...mixins] })

// Rendu d'exemple JSON sans dépendance (vue-json-viewer injectait un <style>
// runtime sans nonce → violation CSP style-src). Un <pre> formaté suffit.
function formatExample(ex: unknown): string {
	if (ex === null || ex === undefined) return ''
	let value: unknown = ex
	if (typeof ex === 'string') {
		try { value = JSON.parse(ex) } catch { return ex }
	}
	try { return JSON.stringify(value, null, 2) } catch { return String(ex) }
}

function copyCode(code: string) {
	navigator.clipboard?.writeText(code)
	LeekWars.toast(t('copied'))
}

// Spec OpenAPI téléchargeable (#4571). Générée ici plutôt que côté serveur : le
// catalogue vient de service/get-all, mais les descriptions n'existent que dans les
// fichiers i18n du client, donc seule la page peut produire une spec documentée.
function downloadOpenApi() {
	const spec = buildOpenApi(services.value, (service) => {
		const key = KEY_PREFIX + service.module + '_' + service.function
		return te(key) ? String(translate(key)) : ''
	})
	const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = 'leekwars-openapi.json'
	link.click()
	URL.revokeObjectURL(url)
}

// Lien direct vers l'endpoint : la route /help/api/:module/:function existe déjà
// et scrolle jusqu'au panneau, mais rien ne permettait de la récupérer (#4577).
function copyLink(service: ApiService) {
	navigator.clipboard?.writeText(location.origin + '/help/api/' + service.module + '/' + service.function)
	LeekWars.toast(t('copied'))
}

const t = useNamespacedT('api')
const route = useRoute()
const router = useRouter()

interface ApiService {
	name: string
	module: string
	function: string
	method: string
	auth: boolean
	parameters: string[]
	parameters_types: string[]
	returns: string[]
	returns_types: string[]
	example?: string
	example_url?: string
	deprecated?: boolean
	scope?: string // base | player | account | session (rôle d'accès par clé API)
}

const services = ref<ApiService[]>([])
const categories = ref<Record<string, ApiService[]>>({})
const query = ref('')
const categoryState = ref<{[key: string]: boolean}>({})
const search = useTemplateRef<HTMLElement>('search')
const elements = useTemplateRef<HTMLElement>('elements')

const icons: Record<string, string> = {
	'ai': 'file-outline',
	'ai-folder': 'folder-outline',
	'article': 'newspaper',
	'bank': 'bank',
	'changelog': 'format-list-bulleted',
	'chip': 'chip',
	'complexity': 'timer-sand',
	'constant': 'pi',
	'country': 'earth',
	'data': 'database',
	'encyclopedia': 'book-open-page-variant',
	'error': 'alert-circle-outline',
	'farmer': 'account',
	'fight': 'sword-cross',
	'forum': 'forum-outline',
	'function': 'function',
	'garden': 'sword',
	'git': 'git',
	'github': 'github',
	'groupe': 'account-group',
	'hat': 'hat-fedora',
	'health': 'heart-pulse',
	'history': 'history',
	'item': 'treasure-chest',
	'item-usage': 'basket-outline',
	'lang': 'translate',
	'leek': 'leek',
	'leek-wars': 'star-outline',
	'loadout': 'bag-personal-outline',
	'market': 'shopping-outline',
	'message': 'chat-outline',
	'message-reaction': 'emoticon-outline',
	'notification': 'bell-outline',
	'pomp': 'auto-fix',
	'potion': 'bottle-tonic-plus-outline',
	'ranking': 'podium',
	'service': 'api',
	'source': 'merge',
	'summon': 'leaf',
	'talent': 'chart-line',
	'team': 'account-multiple',
	'team-composition': 'dice-6-outline',
	'test-leek': 'robot',
	'test-map': 'map-outline',
	'test-scenario': 'script-text-outline',
	'tournament': 'tournament',
	'trophy': 'trophy',
	'trophy-template': 'trophy-outline',
	'tutorial': 'school',
	'weapon': 'pistol'
}

const breadcrumb_items = computed(() => [
	{ name: t('main.help'), link: '/help' },
	{ name: t('title'), link: '/help/api' }
])

const lower_query = computed(() => query.value.toLowerCase())

// `i18n.global.te`/`.t` sont typés en union Composer | VueI18n, donc non appelables
// directement : mêmes casts que useNamespacedT dans src/model/i18n.ts.
const KEY_PREFIX = normalizeComponentName('api') + '.'
const te = i18n.global.te as (key: string) => boolean
const translate = i18n.global.t as (key: string) => unknown

// Index des descriptions traduites, en minuscules, pour que la recherche porte aussi
// sur le texte de la doc et pas seulement sur les noms (#4578). Pré-calculé une fois
// par (liste de services, langue) : le refaire à chaque frappe re-traduirait plusieurs
// centaines de services à chaque caractère saisi.
const descriptions = computed(() => {
	void i18n.global.locale // dépendance explicite : réindexer au changement de langue
	const map: Record<string, string> = {}
	for (const service of services.value) {
		const id = service.module + '_' + service.function
		if (te(KEY_PREFIX + id)) map[id] = String(translate(KEY_PREFIX + id)).toLowerCase()
	}
	return map
})

const filteredItems = computed(() => {
	if (lower_query.value.length) {
		return services.value.filter((item) =>
			item.function!.indexOf(lower_query.value) !== -1
			|| item.module!.indexOf(lower_query.value) !== -1
			|| (item.module + '/' + item.function).indexOf(lower_query.value) !== -1
			|| item.returns.some((r) => r.indexOf(lower_query.value) !== -1)
			|| item.parameters.some((r) => r.indexOf(lower_query.value) !== -1)
			|| (descriptions.value[item.module + '_' + item.function] ?? '').indexOf(lower_query.value) !== -1
		)
	}
	return services.value
})

const filteredCategories = computed(() => {
	const cats: Record<string, ApiService[]> = {}
	for (const item of filteredItems.value) {
		if (item.deprecated) continue
		if (!(item.module in cats)) cats[item.module] = []
		cats[item.module].push(item)
	}
	return cats
})

LeekWars.get<ApiService[]>('service/get-all').then(servicesData => {
	services.value = servicesData
	for (const service of servicesData) {
		if (service.example) service.example = JSON.parse(service.example)
		if (!(service.module in categories.value)) categories.value[service.module] = []
		categories.value[service.module].push(service)
	}
	for (const category in categories.value) {
		categoryState.value[category] = localStorage.getItem('api-doc/category-' + category) === 'true'
	}
	LeekWars.setTitle('API')
	update()
})

function update() {
	if (route.params && 'module' in route.params && 'function' in route.params) {
		LeekWars.splitShowContent()
		selectItem(route.params.module + '_' + route.params.function)
		LeekWars.setTitle(route.params.module + '/' + route.params.function)
	} else {
		LeekWars.splitShowList()
		LeekWars.setTitle(t('title'))
	}
}

watch(() => route.params, update)

function selectItem(item: string) {
	if (!filteredItems.value.find((it) => it.name === item)) {
		query.value = ''
	}
	nextTick(() => {
		setTimeout(() => {
			const element = document.querySelector('.items .service[item=' + item + ']') as HTMLElement | null
			if (element && elements.value) {
				const offset = LeekWars.mobile ? 100 : 140
				elements.value.scrollTo(0, element.offsetTop - offset + 10)
			}
		}, 100)
	})
}

function toggleCategory(c: string) {
	categoryState.value[c] = !categoryState.value[c]
	localStorage.setItem('api-doc/category-' + c, '' + categoryState.value[c])
}

function scroll() {}

function navigate(item: string) {
	const url = '/help/api/' + item
	if (route.path === url) update()
	else router.push(url)
}

function back() {
	router.push('/help/api')
}

onMounted(() => {
	// box/footer posés par meta.layout de la route (router.afterEach).
	search.value?.focus()
	emitter.on('back', back)
	import(/* webpackChunkName: "monaco-highlight" */ '@/component/editor/monaco-highlight').then(h => {
		highlighter.value = markRaw(h)
		highlightCache.clear() // les snippets déjà rendus en brut doivent être recolorisés
	})
})

onBeforeUnmount(() => {
	emitter.off('back', back)
})
</script>

<style lang="scss" scoped>
	.title {
		font-size: 20px;
		color: #aaa;
		margin-bottom: 6px;
		font-family: monospace;
	}
	.module {
		color: var(--type-color);
	}
	.function {
		color: var(--text-color);
	}
	.description {
		padding: 0 !important;
		:deep(pre code) {
			margin-bottom: 0;
		}
		:deep(p) {
			font-size: 15px;
			margin-bottom: 0;
		}
		&.grey {
			color: var(--text-color-secondary);
			font-style: italic;
		}
	}
	.service .label {
		display: inline-block;
		color: var(--pure-white);
		background: #aaa;
		border-radius: 2px;
		padding: 2px 5px;
		font-size: 12px;
		font-weight: bold;
		margin-top: 4px;
	}
	.parameters {
		margin-top: 10px;
		.name {
			font-family: monospace;
		}
	}
	.documentation-page {
		display: flex;
		flex-direction: column;
	}
	.documentation {
		min-height: 0;
		height: 100%;
	}
	#app.app .documentation {
		padding-bottom: 0;
	}
	// Colonnes scrollables dimensionnées via flexbox (flex:1 + min-height:0) plutôt que
	// `height: 100%` en cascade : la résolution de hauteur en pourcentage imbriquée dans
	// des conteneurs flex est recalculée de façon erratique par Firefox (scrollHeight
	// périmé) → colonne trop grande, impossible à scroller (#4150).
	.column4 {
		position: sticky;
		top: 12px;
		height: 100%;
		display: flex;
		flex-direction: column;
		min-height: 0;
		.panel {
			margin-bottom: 0;
			flex: 1;
			min-height: 0;
			& > div {
				padding: 0;
			}
		}
	}
	.column8 {
		height: 100%;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
	.items-list {
		overflow-y: scroll;
		overflow-x: hidden;
		position: relative;
		flex: 1;
		min-height: 0;
	}
	.items-list h2 {
		font-size: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: bold;
		position: sticky;
		top: 0;
		padding: 10px 5px;
		padding-left: 10px;
		background: var(--background-secondary);
		cursor: pointer;
	}
	.items-list .item {
		cursor: pointer;
		padding: 4px 10px;
		display: flex;
		align-items: center;
		gap: 8px;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		font-family: monospace;
		&:last-child {
			margin-bottom: 6px;
		}
	}
	.items-list .item:hover, .item.router-link-active {
		font-weight: bold;
		background: var(--pure-white);
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.items {
		overflow-y: scroll;
		overflow-x: hidden;
		flex: 1;
		min-height: 0;
	}
	.items .item {
		position: relative;
		max-height: 999999px;
		height: initial;
		margin-right: 0;
		&::last-child {
			margin-bottom: 5px;
		}
	}
	.items .item:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}
	.items .function-name {
		color: black;
	}
	// Endpoint déprécié : titre et corps atténués pour le repérer en parcourant la
	// liste, mais les chips restent pleinement lisibles pour que le badge ressorte.
	// (Remplace deux règles qui ciblaient `.item`, une classe que `panel` ne rend
	// pas : elles n'ont donc jamais rien atténué.)
	.service.deprecated .title,
	.service.deprecated .service-body {
		opacity: 0.6;
	}
	// Sidebar catégories à largeur fixe (la page est en pleine largeur, un tiers
	// serait trop large) ; le contenu prend le reste.
	.column4 {
		flex: 0 0 260px;
	}
	.column8 {
		flex: 1;
	}
	.search-box {
		display: flex;
		align-items: center;
		padding: 8px;
	}
	.search-box img {
		margin: 4px;
	}
	.tabs {
		flex: 1;
		display: flex;
	}
	.page-bar .search {
		flex: 1;
		input[type=text] {
			height: 27px;
			width: calc(100% - 35px);
			background: var(--background);
			color: var(--text-color);
			font-size: 20px;
			border-radius: 4px;
			vertical-align: bottom;
			margin-left: 5px;
		}
	}
	.chips {
		display: flex;
		gap: 6px;
		align-items: center;
		margin-bottom: 15px;
	}
	.chip {
		padding: 3px 5px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
		min-width: 48px;
		text-align: center;
	}
	.method {
		color: white;
		text-transform: uppercase;
		display: inline-block;
		&.get { background: #2f8132; }
		&.post { background: #186faf; }
		&.delete { background: #cc3333; }
		&.put { background: #95507c; }
	}
	.auth {
		background: #555;
		color: white;
		text-transform: uppercase;
	}
	.deprecated.chip {
		background: #ff7f00;
		color: white;
		text-transform: uppercase;
	}
	// Toujours visible plutôt qu'au survol : au survol seulement, l'icône serait
	// inatteignable sur mobile.
	.permalink {
		font-size: 15px;
		margin-left: 8px;
		vertical-align: middle;
		color: var(--text-color-secondary);
		cursor: pointer;
		&:hover { color: var(--text-color); }
	}
	.demo {
		background: white;
		color: #333;
		border: 1px solid #aaa;
		.v-icon {
			font-size: 13px;
			color: #333;
		}
	}
	h4 {
		font-weight: 500;
		margin: 0;
		color: var(--text-color);
		margin-top: 10px;
		margin-bottom: 8px;
		font-size: 15px;
	}
	.example {
		background: var(--background-secondary);
		color: var(--text-color);
		border: 1px solid var(--border);
		padding: 8px 10px;
		border-radius: 4px;
		max-height: 300px;
		overflow: auto;
		font-size: 13px;
		font-family: monospace;
		white-space: pre;
		margin: 0;
	}
	.role {
		text-transform: uppercase;
		&.base { background: #2f8132; color: white; }
		&.player { background: #7d4bc4; color: white; }
		&.account { background: #cc3333; color: white; }
		&.session { background: #888; color: white; }
	}
	// Grand écran : description (+ paramètres / retour) à gauche, exemples de code à
	// droite. Quand le contenu descend sous ~760px, les deux colonnes se replient
	// l'une sous l'autre (flex-wrap), les exemples passant alors sous la description.
	.service-body {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		align-items: flex-start;
	}
	.service-info {
		flex: 1 1 300px;
		min-width: 0;
	}
	.service-examples {
		flex: 1 1 440px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
		h4 { margin-top: 0; }
	}
	.code-block {
		border: 1px solid var(--border);
		border-radius: 4px;
		overflow: hidden;
		background: var(--background-secondary);
	}
	.code-tabs {
		display: flex;
		align-items: center;
		background: var(--background);
		border-bottom: 1px solid var(--border);
		padding: 0 4px;
		.code-tab {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			padding: 6px 10px;
			font-size: 13px;
			cursor: pointer;
			color: var(--text-color-secondary);
			border-bottom: 2px solid transparent;
			.v-icon { font-size: 16px; }
			&:hover { color: var(--text-color); }
			&.active { color: var(--text-color); border-bottom-color: #5fad1b; font-weight: 500; }
		}
		// Écran étroit : plus de place pour les libellés + le bouton copier, on ne
		// garde que les icônes (le nom du langage reste dans l'attribut title).
		@media (max-width: 520px) {
			.code-tab .lang-label { display: none; }
			.code-tab { padding: 6px 8px; }
		}
		.spacer { flex: 1; }
		.copy-btn {
			font-size: 16px;
			color: var(--text-color-secondary);
			cursor: pointer;
			padding: 4px;
			&:hover { color: var(--text-color); }
		}
	}
	.code-snippet {
		margin: 0;
		padding: 10px 12px;
		overflow-x: auto;
		max-height: 340px;
		font-size: 13px;
		line-height: 1.5;
		white-space: pre;
		// `display: block` + `white-space: pre` explicites : le CSS global met
		// `code { display: flex }`, ce qui transformait chaque span de coloration en item
		// flex aligné sur une seule ligne (espaces et retours à la ligne écrasés).
		code {
			display: block;
			white-space: pre;
			font-family: monospace;
			color: var(--text-color);
			background: none;
			padding: 0;
		}
	}
</style>
