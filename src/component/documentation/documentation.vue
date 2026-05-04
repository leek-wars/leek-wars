<template lang="html">
	<div class="page documentation-page">
		<div class="page-header page-bar">
			<div v-if="!popup">
				<h1>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
				</h1>
			</div>
			<h1 v-else>{{ $t('title') }}</h1>
			<div class="tabs">
				<router-link v-if="!LeekWars.mobile && !popup" :to="'/encyclopedia/' + $i18n.locale + '/' + $t('main.game_rules').replace(/ /g, '_')">
					<div class="tab">
						<v-icon>mdi-help-circle-outline</v-icon>
						{{ $t('main.general_help') }}
					</div>
				</router-link>
				<router-link v-if="!LeekWars.mobile && !popup" :to="'/encyclopedia/' + $i18n.locale + '/' + $t('main.tutorial')">
					<div class="tab">
						<v-icon>mdi-laptop</v-icon>
						{{ $t('main.tutorial') }}
					</div>
				</router-link>
				<div class="tab disabled search" icon="search" link="/search">
					<img class="search-icon" src="/image/search.png">
					<input v-model="query" ref="search" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
				</div>
				<div v-if="!popup" class="tab action" icon="search" link="/search" @click="toggleLarge">
					<v-icon v-if="LeekWars.large">mdi-fullscreen-exit</v-icon>
					<v-icon v-else>mdi-fullscreen</v-icon>
				</div>
			</div>
		</div>
		<div class="container documentation last">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column4">
				<panel class="first">
					<template #content>
						<div class="items-list">
							<div v-for="(category, c) of filteredCategories" :key="category.id">
								<h2 v-ripple @click="toggleCategory(c)">
									<v-icon>{{ icons[c] }}</v-icon> {{ $t('doc.function_category_' + categories[c].name) }} <span v-if="query.length">({{ category.length }})</span>
									<div class="spacer"></div>
									<v-icon v-if="query.length || categoryState[c]">mdi-chevron-up</v-icon>
									<v-icon v-else>mdi-chevron-down</v-icon>
								</h2>
								<div v-if="query.length || categoryState[c]">
									<div v-for="(item, i) in category" :key="i" @click="navigate(item.name)" :item="item.name" class="item">
										{{ item.name }}<span class="arguments" v-if="item.arguments_types">(<span v-for="(arg, i) in item.arguments_names" :key="i"><span v-if="item.optional[i]">[</span><span class="argument">{{ $t('doc.arg_type_' + item.arguments_types[i]) }}</span>&nbsp;{{ arg }}<span v-if="item.optional[i]">]</span><span v-if="Number(i) < item.arguments_names.length - 1">, </span></span>)
										<span v-if="item.return_type != 0">
											<span class="arrow">→</span> <span class="argument"> {{ $t('doc.arg_type_' + item.return_type) }}</span>&nbsp;{{ item.return_name }}
										</span></span>
									</div>
								</div>
							</div>
						</div>
					</template>
				</panel>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column8">
				<div ref="elements" class="items" @scroll="scroll">
					<panel v-for="item of lazy_items" :key="item.id" :item="item.name" :class="{deprecated: item.deprecated}" class="item">
						<documentation-function v-if="'return_type' in item" :fun="item" />
						<documentation-constant v-else :constant="item" />
					</panel>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
	import { locale } from '@/locale'
	import type { Constant } from '@/model/constant'
	import type { LSFunction } from '@/model/function'
	import { FUNCTIONS } from '@/model/functions'
	import { FUNCTION_BY_ID } from '@/model/function_by_id'
	import { CONSTANT_BY_ID } from '@/model/constant_by_id'
	import { FUNCTION_CATEGORIES } from '@/model/function_categories'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import DocumentationConstant from './documentation-constant.vue'
	import DocumentationFunction from './documentation-function.vue'
	import { emitter } from '@/model/vue'

	defineOptions({ name: 'documentation', i18n: {}, mixins: [...mixins] })

	const props = defineProps<{ popup?: boolean }>()
	const { locale: i18nLocale } = useI18n()
	const t = useNamespacedT('documentation')
	const route = useRoute()
	const router = useRouter()

	const categories: Record<string | number, any> = FUNCTION_CATEGORIES
	const items = ref<any[]>([])
	const query = ref('')
	const lazy_start = ref(0)
	const lazy_end = ref(10)
	const categoryState = ref<Record<string | number, boolean>>({})
	const icons = {
		1: 'mdi-numeric',
		2: 'mdi-format-text',
		3: 'mdi-code-array',
		4: 'mdi-code-braces-box',
		13: 'mdi-code-not-equal-variant',
		14: 'mdi-code-brackets',
		5: 'mdi-account',
		6: 'mdi-sword',
		7: 'mdi-chip',
		8: 'mdi-grid',
		9: 'mdi-sword-cross',
		10: 'mdi-hammer-wrench',
		11: 'mdi-signal-variant',
		12: 'mdi-palette'
	} as Record<number, string>

	const search = useTemplateRef<HTMLInputElement>('search')
	const elements = useTemplateRef<HTMLElement>('elements')

	const breadcrumb_items = computed(() => [
		{name: t('main.help') as string, link: '/help'},
		{name: t('title') as string, link: '/help/documentation'}
	])

	const lower_query = computed(() => query.value.toLowerCase())
	const filteredItems = computed(() => {
		if (lower_query.value.length) {
			return items.value.filter(item => {
				return item.lower_name!.indexOf(lower_query.value) !== -1
					|| item.data!.indexOf(lower_query.value) !== -1
			})
		} else {
			return [...items.value]
		}
	})
	const lazy_items = computed(() => filteredItems.value.slice(lazy_start.value, lazy_end.value))
	const filteredCategories = computed(() => {
		const cats: {[key: number]: any} = {}
		for (const item of filteredItems.value) {
			if (item.deprecated) continue
			if (!(item.category in cats)) cats[item.category] = []
			cats[item.category].push(item)
		}
		return cats
	})

	;(async () => {
		// Load doc translations
		const docMessages = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)
		i18n.global.mergeLocaleMessage(locale, { doc: docMessages.default })

		LeekWars.loadEncyclopedia(locale)

		for (const category in FUNCTION_CATEGORIES) {
			categoryState.value[category] = localStorage.getItem('documentation/category-' + category) === 'true'
		}
		let id = 0
		for (const item of FUNCTIONS as any[]) {
			if (item.replacement) {
				FUNCTION_BY_ID[item.replacement].replacer = item
			}
		}
		for (const item of FUNCTIONS as any[]) {
			items.value.push(item)
			item.lower_name = item.name.toLowerCase()
			item.id = id++
			item.data = ''

			LeekWars.documentation(locale).then(functions => {
				if (item.name in functions) {
					const fun = functions[item.name]
					let new_data = fun.description
					for (const section in fun.primary) {
						new_data += fun.primary[section]
					}
					for (const section in fun.secondary) {
						new_data += fun.secondary[section]
					}
					item.data = new_data.toLowerCase()
				} else {
					let item_data = (t('doc.func_' + item.name) as any).toLowerCase()
					for (const i in item.arguments_names) {
						item_data += (t('doc.func_' + item.name + '_arg_' + (parseInt(i, 10) + 1)) as any).toLowerCase()
					}
					item_data += (t('doc.func_' + item.name + '_return') as any).toLowerCase()
					item.data = item_data
				}
				if (item.replacer) {
					item.data += item.replacer.lower_name!
				}
			})
		}
		for (const item of LeekWars.constants) {
			if (item.replacement) {
				CONSTANT_BY_ID[item.replacement].replacer = item
			}
		}
		for (const item of LeekWars.constants) {
			items.value.push(item)
			item.lower_name = item.name.toLowerCase()
			item.id = id++
			item.data = (t('doc.const_' + item.name) as string).toLowerCase() + item.value
			if (item.replacer) {
				item.data += item.replacer.lower_name!
			}
		}
		if (!props.popup) {
			LeekWars.setTitle(i18nLocale.value ? t('title') as string : '')
		}
		update()
	})()

	onMounted(() => {
		if (!props.popup) {
			LeekWars.large = localStorage.getItem('documentation/large') === 'true'
			LeekWars.footer = false
			LeekWars.box = true
		}
		search.value?.focus()
		emitter.on('back', back)
		emitter.on('doc-navigate', navigate)
	})

	function focus() {
		search.value?.focus()
	}
	function back() {
		router.push('/help/documentation')
	}
	onBeforeUnmount(() => {
		if (!props.popup) {
			LeekWars.large = false
			LeekWars.footer = true
			LeekWars.box = false
		}
		emitter.off('back', back)
		emitter.off('doc-navigate', navigate)
	})

	function update() {
		if (!props.popup && route.params && 'item' in route.params) {
			LeekWars.splitShowContent()
			selectItem(route.params.item as string)
			LeekWars.setTitle(route.params.item as string)
		} else {
			LeekWars.splitShowList()
		}
	}
	watch(() => route.params, update)

	function navigate(item: string) {
		if (props.popup) {
			selectItem(item)
		} else {
			router.push('/help/documentation/' + item)
		}
	}

	function selectItem(item: string) {
		if (!filteredItems.value.find((it) => it.name === item)) {
			query.value = ''
		}
		nextTick(() => {
			const index = filteredItems.value.findIndex((it) => it.name === item)
			if (index !== -1) {
				lazy_start.value = Math.max(0, index - 2)
				lazy_end.value = lazy_start.value + 10
			}
			setTimeout(() => {
				const element: any = document.querySelector('.items .item[item=' + item + ']')
				if (element && elements.value) {
					const offset = LeekWars.mobile ? 100 : (props.popup ? 185 : 140)
					elements.value.scrollTo(0, element.offsetTop - offset + 10)
				}
			}, 100)
		})
	}

	watch(query, () => {
		const items = elements.value
		if (items) items.scrollTop = 0
		lazy_start.value = 0
		lazy_end.value = 10
		if (!props.popup && query.value.length && 'item' in route.params) {
			router.push('/help/documentation')
		}
	})

	function scroll(_e: Event) {
		const items = elements.value
		if (!items) return
		if (items.scrollTop < 100 && lazy_start.value > 0) {
			lazy_start.value = Math.max(0, lazy_start.value - 10)
		}
		if (lazy_items.value.length < filteredItems.value.length) {
			if (items.scrollTop + window.innerHeight + 500 > items.scrollHeight) {
				lazy_end.value += 10
			}
		}
	}

	function toggleLarge() {
		LeekWars.large = !LeekWars.large
		localStorage.setItem('documentation/large', '' + LeekWars.large)
	}

	function toggleCategory(c: number | string) {
		categoryState.value[c] = !categoryState.value[c]
		localStorage.setItem('documentation/category-' + c, '' + categoryState.value[c])
	}

	defineExpose({ focus })
</script>

<style lang="scss" scoped>
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
		gap: 5px;
		font-weight: bold;
		// color: var(--text-color);
		position: sticky;
		top: 0;
		padding: 10px 5px;
		padding-left: 10px;
		margin-bottom: 6px;
		background: var(--background);
		cursor: pointer;
	}
	.items-list .item {
		cursor: pointer;
		padding: 4px 10px;
		display: block;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		&:last-child {
			margin-bottom: 6px;
		}
		.argument {
			color: var(--type-color);
			font-weight: 500;
		}
		.arrow {
			font-size: 22px;
			line-height: 14px;
		}
	}
	body.dark .argument {

		color: var(--type-color);
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
			font-size: 20px;
			border-radius: 4px;
			vertical-align: bottom;
			margin-left: 5px;
		}
	}
</style>
