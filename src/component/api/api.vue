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
					<div slot="content" class="items-list">
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
				</panel>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column8">
				<div ref="elements" class="items" @scroll="scroll">
					<panel v-for="(service, s) in filteredItems" :key="s" class="service" :item="service.module + '_' + service.function" >
						<div class="title">
							<span class="module">{{ service.module }}</span>/<span class="function">{{ service.function }}</span>
							<template v-for="(parameter, p) in service.parameters">
								<span :key="p + '-'">/</span>
								<span :key="p" class="parameter">{{ parameter }}</span>
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

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import JsonViewer from 'vue-json-viewer'
	import Markdown from '@/component/encyclopedia/markdown.vue'

	@Component({ name: 'api', i18n: {}, mixins: [...mixins],
		components: { Breadcrumb, JsonViewer, Markdown }
	})
	export default class Api extends Vue {
		services: any[] = []
		categories: any = {}
		query: string = ''
		categoryState: {[key: number]: boolean} = {}
		icons = {
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

		get breadcrumb_items() {
			return [
				{name: this.$t('main.help'), link: '/help'},
				{name: this.$t('title'), link: '/help/api'}
			]
		}

		get lower_query() {
			return this.query.toLowerCase()
		}
		get filteredItems() {
			if (this.lower_query.length) {
				return this.services.filter(item => {
					return item.function!.indexOf(this.lower_query) !== -1
						|| item.module!.indexOf(this.lower_query) !== -1
						|| (item.module + '/' + item.function).indexOf(this.lower_query) !== -1
						|| item.returns.some((r: any) => r.indexOf(this.lower_query) !== -1)
						|| item.parameters.some((r: any) => r.indexOf(this.lower_query) !== -1)
				})
			} else {
				return this.services
			}
		}
		get filteredCategories() {
			const categories: {[key: number]: any} = {}
			for (const item of this.filteredItems) {
				if (item.deprecated) continue
				if (!(item.module in categories)) Vue.set(categories, item.module, [])
				categories[item.module].push(item)
			}
			return categories
		}

		created() {
			LeekWars.get('service/get-all').then(services => {
				this.services = services
				for (const service of services) {
					// Vue.set(service, 'function_lower', service.function.toLowerCase())
					service.example = JSON.parse(service.example)
					if (!(service.module in this.categories)) {
						Vue.set(this.categories, service.module, [])
					}
					this.categories[service.module].push(service)
				}
				for (const category in this.categories) {
					Vue.set(this.categoryState, category, localStorage.getItem('api-doc/category-' + category) === 'true')
				}
				LeekWars.setTitle('API')
				this.update()
			})
		}

		@Watch('$route.params')
		update() {
			if (this.$route.params && 'module' in this.$route.params && 'function' in this.$route.params) {
				LeekWars.splitShowContent()
				this.selectItem(this.$route.params.module + '_' + this.$route.params.function)
				LeekWars.setTitle(this.$route.params.module + '/' + this.$route.params.function)
			} else {
				LeekWars.splitShowList()
				LeekWars.setTitle(this.$i18n.t('title'))
			}
		}

		selectItem(item: string) {
			// console.log("selectItem", item)
			if (!this.filteredItems.find((it) => it.name === item)) {
				this.query = ''
			}
			Vue.nextTick(() => {
				setTimeout(() => {
					const element: any = document.querySelector('.items .service[item=' + item + ']')
					const elements = this.$refs.elements as HTMLElement
					if (element) {
						const offset = LeekWars.mobile ? 100 : 140
						elements.scrollTo(0, element.offsetTop - offset + 10)
					}
				}, 100)
			})
		}

		toggleCategory(c: number) {
			this.categoryState[c] = !this.categoryState[c]
			localStorage.setItem('api-doc/category-' + c, '' + this.categoryState[c])
		}

		scroll() {

		}

		navigate(item: string) {
			// console.log("navigate", item, this.popup)
			const url = '/help/api/' + item
			if (this.$route.path === url) {
				this.update()
			} else {
				this.$router.push(url)
			}
		}

		mounted() {
			// LeekWars.large = localStorage.getItem('documentation/large') === 'true'
			LeekWars.footer = false
			LeekWars.box = true
			;(this.$refs.search as HTMLElement).focus()
			this.$root.$on('back', this.back)
		}
		focus() {
			(this.$refs.search as HTMLElement).focus()
		}
		back() {
			this.$router.push('/help/api')
		}
		beforeDestroy() {
			LeekWars.large = false
			LeekWars.footer = true
			LeekWars.box = false
			this.$root.$off('back', this.back)
		}
	}
</script>

<style lang="scss" scoped>
	.title {
		font-size: 20px;
		color: #aaa;
		margin-bottom: 6px;
		font-family: monospace;
	}
	.module {
		color: #0000D0;
	}
	.function {
		color: #111;
	}
	.description {
		padding: 0 !important;
		::v-deep pre code {
			margin-bottom: 0;
		}
		::v-deep p {
			font-size: 15px;
			margin-bottom: 0;
		}
		&.grey {
			color: #777;
			font-style: italic;
		}
	}
	.service .label {
		display: inline-block;
		color: white;
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
		color: #222;
		position: sticky;
		top: 0;
		padding: 10px 5px;
		padding-left: 10px;
		background: #f2f2f2;
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
		.argument {
			color: #0000D0;
			font-weight: 500;
		}
		.arrow {
			font-size: 22px;
			line-height: 14px;
		}
	}
	.items-list .item:hover, .item.router-link-active {
		font-weight: bold;
		background: white;
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
	.items ::v-deep .item.deprecated .content {
		opacity: 0.6;
	}
	.items ::v-deep .item .deprecated-message {
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
			background: #eee;
			color: black;
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
		border: 1px solid #aaa;
		.v-icon {
			font-size: 13px;
		}
	}
	h4 {
		font-weight: 500;
		margin: 0;
		color: #111;
		margin-top: 10px;
		margin-bottom: 8px;
		font-size: 15px;
	}
	.example ::v-deep .jv-code {
		border: 1px solid #aaa;
		padding: 5px;
		border-radius: 4px;
		max-height: 300px;
		overflow-y: auto;
		font-size: 15px;
		.jv-node {
			padding: 2px 0;
		}
	}
</style>
