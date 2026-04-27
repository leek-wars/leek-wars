<template>
	<div>
		<div class="page-bar">
			<h1>
				<v-icon class="book">mdi-book-open-page-variant</v-icon>
				<breadcrumb :items="[{ name: $t('title'), link: '/encyclopedia' }, { name: $t('search'), link: '/encyclopedia-search' }]" :raw="true" />
			</h1>
		</div>
		<panel class="first">
			<div class="search">
				<div class="search-box">
					<div class="label">{{ $t('query') }}</div>
					<input :value="options.query" class="query card" type="text" @input="onQueryInput" @keydown.enter="search">
				</div>

				<div class="center">
					<v-btn color="primary" class="search-button" @click="searchButton">
						<img src="/image/search.png"><span>{{ $t('search') }}</span>
					</v-btn>
				</div>
			</div>

			<div v-if="searchStarted">
				<h4>{{ $t('results') }} <span v-if="results">({{ count }})</span></h4>

				<pagination :current="options.page" :total="pages" :url="urlPagination" :query="true" />

				<loader v-if="!results" />

				<div v-else class="results-wrapper">
					<div v-if="results.length" class="results">
						<router-link v-for="(result, r) in results" :key="r" :to="'/encyclopedia/' + $i18n.locale + '/' + result.title">
							<div v-ripple class="result card">
								<div class="title" v-html="result.title_headline"></div>
								<markdown :content="result.content" :pages="{}" mode="encyclopedia" />
							</div>
						</router-link>
					</div>
					<div v-if="results.length === 0" class="no-results">
						<img src="/image/notgood.png">
						<div>{{ $t('no_results_found') }}</div>
					</div>
				</div>
				<pagination :current="options.page" :total="pages" :url="urlPagination" :query="true" />
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Markdown from '@/component/encyclopedia/markdown.vue'
import { i18n, mixins } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import Breadcrumb from '../forum/breadcrumb.vue'
import Pagination from '@/component/pagination.vue'

defineOptions({ name: 'encyclopedia-search', i18n: {}, mixins: [...mixins] })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const options = ref<{[key: string]: any}>({ query: '', page: 1 })
const queryLower = ref('')
const pages = ref(0)
const results = ref<any[] | null>(null)
const searchStarted = ref(false)
const count = ref(0)
const floor = Math.floor

let urlSyncing = false

const canSearch = computed(() => options.value.query)

LeekWars.setTitle(t('title'))

function onQueryInput(e: Event) {
	const query = (e.target as HTMLInputElement).value
	options.value.query = query
	const currentUrlQuery = (route.query.query as string || '').replace(/\+/g, ' ')
	if (query !== currentUrlQuery) {
		urlSyncing = true
		router.replace('/encyclopedia-search' + (query ? '?query=' + query.replace(/ /g, '+') : ''))
	}
}

function doSearch() {
	searchStarted.value = false
	results.value = null
	if (canSearch.value) {
		searchStarted.value = true
		LeekWars.get('encyclopedia/search/' + i18n.global.locale + '/' + options.value.query.replace(/ /g, '+') + '/' + options.value.page).then(data => {
			results.value = data.results
			pages.value = data.pages
			count.value = data.count
		}).catch((err: any) => {
			results.value = []
			count.value = 0
			LeekWars.toast(err.error)
		})
	}
}

watch(() => route.query, () => {
	if (urlSyncing) {
		urlSyncing = false
		return
	}
	const query = (route.query.query as string || '').replace(/\+/g, ' ')
	options.value.query = query === '-' ? '' : query
	queryLower.value = options.value.query.toLowerCase()
	options.value.page = parseInt(route.query.page as string, 10) || 1
	doSearch()
}, { immediate: true })

const urlPagination = computed(() => {
	const url = '/encyclopedia-search'
	const opts = Object.keys(options.value)
		.filter(option => options.value[option] !== null && option !== 'page')
		.map(option => option + '=' + options.value[option])
		.join('&')
	return url + '?' + opts
})

const url = computed(() => urlPagination.value + (options.value.page > 1 ? '&page=' + options.value.page : ''))

function search() {
	if (!canSearch.value) return
	router.push(url.value).then((failure: any) => {
		if (failure) doSearch()
	})
}

function searchButton() {
	if (!canSearch.value) {
		LeekWars.toast(t('not_enough_parameters'))
	} else {
		search()
	}
}
</script>

<style lang="scss" scoped>
h1 {
	background: #222;
	font-size: 20px;
	display: inline-flex;
	&::after {
		border-color: transparent transparent transparent #222;
	}
	.book {
		margin-right: 10px;
		font-size: 23px;
		margin-bottom: 5px;
	}
}
.search {
	max-width: 500px;
}
#app.app .search {
	padding: 0;
	padding-top: 10px;
}
.label {
	margin-right: 6px;
	color: #777;
	margin-bottom: 5px;
}
.search-button {
	margin: 8px auto;
	margin-bottom: 20px;
	img {
		vertical-align: bottom;
		margin-right: 6px;
	}
}
.query {
	height: 36px;
	padding: 0 8px;
	width: calc(100% - 16px);
	margin-bottom: 10px;
	border: none;
}
.query:focus {
	border: 1px solid #5fad1b;
}
.switch {
	margin-bottom: 15px;
	margin-right: 15px;
}
select {
	height: 36px;
	width: 100%;
	font-size: 16px;
	margin-bottom: 10px;
}
h2 {
	margin-top: 20px;
}
.result {
	background: var(--pure-white);
	padding: 10px;
	margin: 8px 0;
}
.result:hover {
	background: var(--background-secondary);
}
.result .title {
	// font-weight: 300;
	font-size: 22px;
	margin-bottom: 5px;
}
.result .headline {
	color: #777;
	font-size: 14px;
}
.result :deep(b) {
	color: #5fad1b;
	font-weight: bold;
}
.info {
	color: #aaa;
	margin-bottom: 10px;
}
.result .dark {
	color: #555;
}
.pagination {
	text-align: center;
}
.no-results {
	text-align: center;
	padding: 10px;
	color: #999;
	img {
		margin-bottom: 8px;
	}
}
</style>