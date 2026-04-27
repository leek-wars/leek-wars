<template>
	<div class="page">
		<div class="page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first">
			<div class="search">

				<div class="search-box">
					<div class="label">{{ $t('query') }}</div>
					<input v-model="options.query" class="query card" type="text" @keydown.enter="search">
				</div>
				<div class="search-box-farmer">
					<div class="label">{{ $t('author') }}</div>
					<input v-model="options.farmer" class="query card" type="text" @keydown.enter="search">
				</div>
				<div>
					<v-switch v-model="options.moderator" :label="$t('main.grade_moderator')" class="switch" hide-details @change="search" />
					<v-switch v-model="options.admin" :label="$t('main.grade_admin')" class="switch" hide-details @change="search" />
				</div>
				<div>
					<div class="label">{{ $t('category') }}</div>
					<select v-model="options.category" class="search-category" @change="search">
						<option value="-1">{{ $t('all_categories') }}</option>
						<option v-for="c in categories" :key="c.id" :value="c.id">{{ c.type == 'team' ? c.name : $i18n.t('forum-category.' + c.name) }}</option>
					</select>
				</div>
				<div>
					<div class="label">{{ $t('sort_by') }}</div>
					<select v-model="options.order" @change="search">
						<option value="pertinence">{{ $t('sort_pertinence') }}</option>
						<option value="date">{{ $t('sort_date') }}</option>
						<option value="votes">{{ $t('sort_votes') }}</option>
					</select>
				</div>
				<div>
					<div class="label">{{ $t('resolved') }}</div>
					<select v-model="options.resolved" @change="search">
						<option value="all">{{ $t('resolved_all') }}</option>
						<option value="yes">{{ $t('resolved_yes') }}</option>
						<option value="no">{{ $t('resolved_no') }}</option>
					</select>
				</div>
			</div>

			<div class="center">
				<v-btn color="primary" class="search-button" @click="searchButton">
					<img src="/image/search.png"><span>{{ $t('search') }}</span>
				</v-btn>
			</div>

			<div v-if="searchStarted">
				<h4>{{ $t('results') }} <span v-if="results">({{ count }})</span></h4>

				<pagination :current="options.page" :total="pages" :url="urlPagination" :query="true" />

				<loader v-if="!results" />

				<div v-else class="results-wrapper">
					<div v-if="results.length" class="results">
						<div v-for="(result, r) in results" :key="r" v-ripple class="result card">
							<router-link :to="'/forum/category-' + result.cid + '/topic-' + result.tid" class="title">
								<v-icon v-if="result.resolved" :title="$t('resolved')" class="attr resolved">mdi-check-circle</v-icon>
								<v-icon v-if="result.closed" :title="$t('locked')" class="attr">mdi-lock</v-icon>
								<span v-html="result.title"></span>
							</router-link>
							<i18n-t tag="div" class="info" keypath="post_by_x_the_x_in_x">
								<template #farmer>
									<router-link :to="'/farmer/' + result.fid">
										<template v-if="options.farmer === ''">{{ result.fname }}</template>
										<span v-else><b>{{ result.fname }}</b></span>
									</router-link>
								</template>
								<template #date>
									<span class="dark">{{ $filters.date(result.date) }}</span>
								</template>
								<template #topic>
									<router-link :to="'/forum/category-' + result.cid">
										{{ $i18n.te('forum-category.' + result.cname) ? $i18n.t('forum-category.' + result.cname) : result.cname }}
									</router-link>
								</template>
							</i18n-t>
							<router-link :to="'/forum/category-' + result.cid + '/topic-' + result.tid + '/page-' + (floor(result.pos / 20) + 1) + (result.mid !== -1 ? '#message-' + result.mid : '')">
								<div class="headline" v-html="result.message"></div>
							</router-link>
							<div v-if="result.vu !== 0 || result.vd !== 0" class="votes">
								<div :class="{zero: result.vu === 0}" class="vote up">
									<v-icon>mdi-thumb-up</v-icon>
									<span class="counter">{{ result.vu }}</span>
								</div>
								<div :class="{zero: !result.vd}" class="vote down">
									<v-icon>mdi-thumb-down</v-icon>
									<span class="counter">{{ result.vd }}</span>
								</div>
							</div>
						</div>
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
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import Pagination from '@/component/pagination.vue'
	import { computed, reactive, ref, watch } from 'vue'
	import { useRoute, useRouter } from 'vue-router'

	defineOptions({ name: 'search', i18n: {}, mixins: [...mixins] })

	const route = useRoute()
	const router = useRouter()

	const options = reactive({
		query: '',
		farmer: '',
		page: 1,
		category: -1,
		admin: false,
		moderator: false,
		order: 'pertinence',
		resolved: 'all',
	} as {[key: string]: any})
	const defaultOptions = {
		query: '',
		farmer: '',
		page: 1,
		category: -1,
		admin: false,
		moderator: false,
		order: 'pertinence'
	} as {[key: string]: any}
	const queryLower = ref('')
	const pages = ref(0)
	const results = ref<any[] | null>(null)
	const categories = ref<any[]>([])
	const searchStarted = ref(false)
	const count = ref(0)
	const floor = Math.floor

	function highlight(text: string) {
		return LeekWars.protect(text).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')
	}

	const canSearch = computed(() => options.query || options.farmer || options.admin)

	const languages = (localStorage.getItem('forum/languages') as string || i18n.global.locale).split(',')
	LeekWars.get('forum/get-categories/' + languages).then(data => {
		categories.value = data.categories
	})
	LeekWars.setTitle(i18n.global.t('title'))

	function update() {
		options.query = (route.query.query as string || '').replace(/\+/g, ' ')
		queryLower.value = options.query.toLowerCase()
		if (options.query === '-') { options.query = '' }
		options.farmer = route.query.farmer || ''
		if (options.farmer === '-') { options.farmer = '' }
		options.page = parseInt(route.query.page as string, 10) || 1
		const category = route.query.category as string
		options.category = (category === '-' || !category) ? -1 : category
		options.order = route.query.order || 'pertinence'
		options.admin = route.query.admin || false
		options.moderator = route.query.moderator || false
		options.resolved = route.query.resolved || 'all'

		searchStarted.value = false
		results.value = null
		searchStarted.value = true
		LeekWars.get('forum/search2/' + (options.query.replace(/ /g, '+') || '-') + '/' + (options.farmer || '-') + '/' + options.category + '/' + options.page + '/' + (options.order || 'pertinence') + '/' + (options.admin || false) + '/' + (options.moderator || false) + '/' + options.resolved).then(data => {
			for (const r of data.results) {
				r.title = highlight(r.title)
				r.message = highlight(r.message)
			}
			results.value = data.results
			pages.value = data.pages
			count.value = data.count
		}).error(error => {
			results.value = []
			count.value = 0
			LeekWars.toast(error.error)
		})
	}
	watch(() => route.query, update, { immediate: true })

	const urlPagination = computed(() => {
		const url = "/search"
		const opts = Object.keys(options)
			.filter(option => options[option] !== null && options[option] !== defaultOptions[option] && option !== 'page')
			.map(option => option + '=' + options[option])
			.join('&')
		return url + '?' + opts
	})

	function search() {
		router.push(urlPagination.value)
	}
	function searchButton() {
		search()
	}
</script>

<style lang="scss" scoped>
	.search {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 15px;
		margin-bottom: 10px;
		align-items: center;
	}
	#app.app .search {
		padding: 0;
	}
	.label {
		margin-right: 6px;
		color: #777;
		margin-bottom: 5px;
	}
	.search-button {
		margin: 8px auto;
		img {
			vertical-align: bottom;
			margin-right: 6px;
		}
	}
	.switch {
		margin-right: 15px;
	}
	.query {
		height: 36px;
		padding: 0 8px;
		width: 100%;
	}
	.query:focus {
		border: 1px solid #5fad1b;
	}
	select {
		height: 36px;
		width: 100%;
		font-size: 16px;
	}
	h2 {
		margin-top: 20px;
	}
	.result {
		background: var(--pure-white);
		padding: 10px;
		margin: 8px 0;
		&:hover {
			background: var(--background-secondary);
		}
	}
	.result .title {
		font-weight: 300;
		font-size: 22px;
		margin-bottom: 5px;
		display: flex;
		align-items: center;
		gap: 4px;
		.v-icon.resolved {
			color: #5fad1b;
		}
		.v-icon {
			font-size: 22px;
		}
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
	.votes {
		margin-top: 10px;
		display: inline-block;
	}
	.vote {
		display: inline-block;
		font-size: 16px;
		margin-right: 12px;
		border-radius: 6px;
	}
	.vote i {
		vertical-align: bottom;
		font-size: 20px;
		margin-right: 5px;
	}
	.vote.zero {
		opacity: 0.3;
	}
	.vote.active {
		font-weight: bold;
	}
	.vote.up, .vote.up i {
		color: #5fad1b;
	}
	.vote.down {
		color: red;
		margin-right: 20px;
		i {
			color: red;
		}
	}
	.vote.up.zero, .vote.down.zero {
		color: #555;
		i {
			color: #555;
		}
	}
</style>