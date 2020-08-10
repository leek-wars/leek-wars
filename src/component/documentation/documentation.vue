<template lang="html">
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
				</h1>
			</div>
			<div class="tabs">
				<router-link v-if="!LeekWars.mobile" to="/help/general">
					<div class="tab">
						<v-icon>mdi-help-circle-outline</v-icon>
						{{ $t('main.general_help') }}
					</div>
				</router-link>
				<router-link v-if="!LeekWars.mobile" to="/help/tutorial">
					<div class="tab">
						<v-icon>mdi-laptop</v-icon>
						{{ $t('main.tutorial') }}
					</div>
				</router-link>
				<div class="tab disabled search" icon="search" link="/search">
					<img class="search-icon" src="/image/search.png">
					<input v-model="query" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
				</div>
				<div class="tab action" icon="search" link="/search" @click="toggleLarge">
					<v-icon v-if="LeekWars.large">mdi-fullscreen-exit</v-icon>
					<v-icon v-else>mdi-fullscreen</v-icon>
				</div>
			</div>
		</div>
		<div class="container documentation last">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column3">
				<panel class="first">
					<div slot="content">
						<div v-autostopscroll="'bottom'" class="items-list">
							<div v-for="(category, c) of filteredCategories" :key="category.id">
								<h2>{{ $t('doc.function_category_' + categories[c].name) }}</h2>
								<router-link v-for="(item, i) in category" v-if="item.name === item.real_name" :key="i" :to="'/help/documentation/' + item.name" :item="item.name" class="item">
									{{ item.name }}
								</router-link>
							</div>
						</div>
					</div>
				</panel>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column9">
				<div ref="elements" v-autostopscroll="'bottom'" class="items" @scroll="scroll">
					<panel v-for="item of lazy_items" :key="item.id" :item="item.name" :class="{deprecated: item.deprecated}" class="item">
						<documentation-function v-if="'return_type' in item" :fun="item" />
						<documentation-constant v-else :constant="item" />
					</panel>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { Function } from '@/model/function'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import DocumentationConstant from './documentation-constant.vue'
	import DocumentationFunction from './documentation-function.vue'
	import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)

	@Component({
		name: 'documentation',
		components: { DocumentationFunction, DocumentationConstant, Breadcrumb },
		i18n: {}
	})
	export default class Documentation extends Vue {
		categories: any[] = []
		items: any[] = []
		query: string = ''
		Function = Function
		lazy_start: number = 0
		lazy_end: number = 10

		get breadcrumb_items() {
			return [
				{name: this.$t('main.help'), link: '/help'},
				{name: this.$t('title'), link: '/help/documentation'}
			]
		}

		get lower_query() {
			return this.query.toLowerCase()
		}
		get filteredItems() {
			if (this.lower_query.length) {
				return this.items.filter(item => {
					return item.lower_name.indexOf(this.lower_query) !== -1
						|| item.data.indexOf(this.lower_query) !== -1
				})
			} else {
				return [...this.items]
			}
		}
		get lazy_items() {
			return this.filteredItems.slice(this.lazy_start, this.lazy_end)
		}
		get filteredCategories() {
			const categories: {[key: number]: any} = {}
			for (const category in this.categories) {
				categories[category] = []
			}
			for (const item of this.filteredItems) {
				categories[item.category].push(item)
			}
			return categories
		}

		created() {
			LeekWars.large = localStorage.getItem('documentation/large') === 'true'
			const get_categories = (callback: any) => {
				if (localStorage.getItem('data/function_categories')) {
					callback({categories: JSON.parse(localStorage.getItem('data/function_categories') || '[]')})
				} else {
					LeekWars.get('function/get-categories').then(data => {
						localStorage.setItem('data/function_categories', JSON.stringify(data.categories))
						callback(data)
					})
				}
			}
			get_categories((data: any) => {
				this.categories = data.categories
				let last: any
				let index = 1
				let id = 0
				for (const item of LeekWars.functions) {
					(item as any).real_name = item.name
					if (last != null && last.name === item.name) {
						(item as any).real_name = last.name + '_' + (++index)
					} else {
						index = 1
					}
					this.items.push(item)
					; (item as any).lower_name = item.name.toLowerCase()
					; (item as any).id = id++
					let item_data = (this.$t('doc.func_' + (item as any).real_name) as any).toLowerCase()
					for (const i in item.arguments_names) {
						item_data += (this.$t('doc.func_' + (item as any).real_name + '_arg_' + (parseInt(i, 10) + 1)) as any).toLowerCase()
					}
					item_data += (this.$t('doc.func_' + (item as any).real_name + '_return') as any).toLowerCase()
					; (item as any).data = item_data
					last = item
				}
				for (const item of LeekWars.constants) {
					this.items.push(item)
					; (item as any).lower_name = item.name.toLowerCase()
					; (item as any).real_name = item.name
					; (item as any).id = id++
					; (item as any).data = (this.$t('doc.const_' + item.name) as string).toLowerCase()
				}
				LeekWars.setTitle(this.$i18n.t('title'))
				this.update()
			})
			this.$root.$on('back', this.back)
		}
		mounted() {
			LeekWars.footer = false
			LeekWars.box = true
		}
		back() {
			this.$router.push('/help/documentation')
		}
		destroyed() {
			LeekWars.large = false
			LeekWars.footer = true
			LeekWars.box = false
			this.$root.$off('back', this.back)
		}

		@Watch('$route.params')
		update() {
			if (this.$route.params && 'item' in this.$route.params) {
				LeekWars.splitShowContent()
				this.selectItem(this.$route.params.item)
				LeekWars.setTitle(this.$route.params.item)
			} else {
				LeekWars.splitShowList()
				LeekWars.setTitle(this.$i18n.t('title'))
			}
		}

		selectItem(item: string) {
			if (!this.filteredItems.find((it) => it.name === item)) {
				this.query = ''
			}
			Vue.nextTick(() => {
				const index = this.filteredItems.findIndex((it) => it.name === item)
				if (index !== -1) {
					this.lazy_start = Math.max(0, index - 2)
					this.lazy_end = this.lazy_start + 10
				}
				setTimeout(() => {
					const element: any = document.querySelector('.items .item[item=' + item + ']')
					const elements = this.$refs.elements as HTMLElement
					if (element) {
						const offset = LeekWars.mobile ? 100 : 140
						elements.scrollTo(0, element.offsetTop - offset + 10)
					}
				}, 100)
			})
		}

		@Watch('query')
		queryChange() {
			const items = this.$refs.elements as Element
			items.scrollTop = 0
			this.lazy_start = 0
			this.lazy_end = 10
			if (this.query.length && 'item' in this.$route.params) {
				this.$router.push('/help/documentation')
			}
		}

		scroll(e: Event) {
			const items = this.$refs.elements as Element
			if (items.scrollTop < 100 && this.lazy_start > 0) {
				this.lazy_start = Math.max(0, this.lazy_start - 10)
			}
			if (this.lazy_items.length < this.filteredItems.length) {
				if (items.scrollTop + window.innerHeight + 500 > items.scrollHeight) {
					this.lazy_end += 10
				}
			}
		}

		toggleLarge() {
			LeekWars.large = !LeekWars.large
			localStorage.setItem('documentation/large', '' + LeekWars.large)
		}
	}
</script>

<style lang="scss" scoped>
	.documentation {
		padding-bottom: 12px;
		min-height: 0;
	}
	#app.app .documentation {
		padding-bottom: 0;
	}
	.column3 {
		position: sticky;
		top: 12px;
		height: 100%;
	}
	.column9 {
		height: 100%;
	}
	.panel {
		height: 100%;
	}
	.column3 .panel > div {
		padding: 0;
		height: 100%;
	}
	.items-list {
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		height: 100%;
	}
	.items-list h2 {
		font-size: 13px;
		font-weight: bold;
		color: #888;
		position: sticky;
		top: 0;
		padding: 6px 10px;
		margin-bottom: 4px;
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.items-list .item {
		cursor: pointer;
		padding: 3px 10px;
		display: block;
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
			margin-bottom: 0;
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
</style>