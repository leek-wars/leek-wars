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
					<input v-model="query" ref="search" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
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
							<div v-for="(category, c) of filteredCategories" :key="category.id">
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
									<div v-for="(item, i) in category" :key="i" @click="navigate(item.module + '/' + item.function)" :item="item.name" class="item">
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
					<panel v-for="(service, s) in filteredItems" :key="s" class="service" :item="service.module + '_' + service.function" >
						<div class="title">
							<span class="module">{{ service.module }}</span>/<span class="function">{{ service.function }}</span>
							<template v-for="(parameter, p) in service.parameters" :key="p">
								<span>/</span>
								<span class="parameter">{{ parameter }}</span>
							</template>
							<template v-if="service.returns.length"> → <span class="returns">{{ service.returns.join(", ") }}</span></template>
						</div>
						<div class="chips">
							<span class="method chip" :class="service.method">{{ service.method }}</span>
							<span v-if="service.auth" class="auth chip">{{ $t('auth') }}</span>
							<a v-if="service.example_url" :href="LeekWars.API + service.example_url" target="_blank" class="demo chip">
								/api/{{ service.example_url }} <v-icon>mdi-open-in-new</v-icon>
							</a>
						</div>

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

						<template v-if="service.example">
							<json-viewer class="example"
								:value="service.example"
								:expand-depth=2
								></json-viewer>
						</template>
					</panel>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, useTemplateRef, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mixins } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import Breadcrumb from '../forum/breadcrumb.vue'
// @ts-ignore - no types for vue-json-viewer
import JsonViewer from 'vue-json-viewer'
import Markdown from '@/component/encyclopedia/markdown.vue'
import { emitter } from '@/model/vue'

defineOptions({ name: 'api', i18n: {}, mixins: [...mixins], components: { JsonViewer } })

const t = useNamespacedT('api')
const route = useRoute()
const router = useRouter()

const services = ref<any[]>([])
const categories = ref<any>({})
const query = ref('')
const categoryState = ref<{[key: string]: boolean}>({})
const search = useTemplateRef<HTMLElement>('search')
const elements = useTemplateRef<HTMLElement>('elements')

const icons: Record<string, string> = {
	'ai': 'file-outline',
	'ai-folder': 'folder-outline',
	'article': 'newspaper',
	'changelog': 'format-list-bulleted',
	'chip': 'chip',
	'complexity': 'timer-sand',
	'constant': 'pi',
	'country': 'earth',
	'encyclopedia': 'book-open-page-variant',
	'error': 'alert-circle-outline',
	'farmer': 'account',
	'fight': 'sword-cross',
	'forum': 'forum-outline',
	'function': 'function',
	'garden': 'sword',
	'groupe': 'account-group',
	'hat': 'hat-fedora',
	'history': 'history',
	'item': 'treasure-chest',
	'lang': 'translate',
	'leek': 'leek',
	'leek-wars': 'star-outline',
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

const filteredItems = computed(() => {
	if (lower_query.value.length) {
		return services.value.filter((item: any) =>
			item.function!.indexOf(lower_query.value) !== -1
			|| item.module!.indexOf(lower_query.value) !== -1
			|| (item.module + '/' + item.function).indexOf(lower_query.value) !== -1
			|| item.returns.some((r: any) => r.indexOf(lower_query.value) !== -1)
			|| item.parameters.some((r: any) => r.indexOf(lower_query.value) !== -1)
		)
	}
	return services.value
})

const filteredCategories = computed(() => {
	const cats: {[key: string]: any} = {}
	for (const item of filteredItems.value) {
		if (item.deprecated) continue
		if (!(item.module in cats)) cats[item.module] = []
		cats[item.module].push(item)
	}
	return cats
})

LeekWars.get('service/get-all').then(servicesData => {
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
	if (!filteredItems.value.find((it: any) => it.name === item)) {
		query.value = ''
	}
	nextTick(() => {
		setTimeout(() => {
			const element: any = document.querySelector('.items .service[item=' + item + ']')
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
	LeekWars.footer = false
	LeekWars.box = true
	search.value?.focus()
	emitter.on('back', back)
})

onBeforeUnmount(() => {
	LeekWars.large = false
	LeekWars.footer = true
	LeekWars.box = false
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
	.column4 {
		position: sticky;
		top: 12px;
		height: 100%;
		.panel {
			margin-bottom: 0;
			max-height: 100%;
			& > div {
				padding: 0;
				height: 100%;
			}
		}
	}
	.column8 {
		height: 100%;
	}
	.items-list {
		overflow-y: scroll;
		overflow-x: hidden;
		position: relative;
		height: 100%;
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
		height: 100%;
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
	.items :deep(.item.deprecated .content) {
		opacity: 0.6;
	}
	.items :deep(.item .deprecated-message) {
		color: #ff7f00;
		font-weight: bold;
		margin: 10px;
	}
	pre {
		max-width: 500px;
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
	.example.jv-container {
		background: var(--pure-white);
	}
	.example :deep(.jv-code) {
		color: var(--text-color);
		border: 1px solid var(--border);
		padding: 5px;
		border-radius: 4px;
		max-height: 300px;
		overflow-y: auto;
		font-size: 15px;
		.jv-node {
			padding: 2px 0;
		}
		.jv-key, .jv-array, .jv-object {
			color: var(--text-color);
		}
	}
	body.dark .example :deep(.jv-code) {
		// background: ;
	}
</style>
