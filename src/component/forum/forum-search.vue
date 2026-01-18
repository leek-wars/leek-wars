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
							</template>
							<i18n-t tag="div" class="info" keypath="post_by_x_the_x_in_x">
								<template #farmer>
								<router-link :to="'/farmer/' + result.fid">
									<template v-if="options.farmer === ''">{{ result.fname }}</template>
									<span v-else><b>{{ result.fname }}</b></span>
								</router-link>
								<template #date>
								<span class="dark">{{ $filters.date(result.date) }}</span>
							</template>
								<template #topic>
								<router-link :to="'/forum/category-' + result.cid">
									{{ $i18n.t('forum-category.' + result.cname) }}
								</router-link>
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

<script lang="ts">
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import Pagination from '@/component/pagination.vue'
import { resolve } from 'path'

	@Options({ name: 'search', i18n: {}, mixins: [...mixins], components: { Pagination } })
	export default class Search extends Vue {
		options = {
			query: '',
			farmer: '',
			page: 1,
			category: -1,
			admin: false,
			moderator: false,
			order: 'pertinence',
			resolved: 'all',
		} as {[key: string]: any}
		defaultOptions = {
			query: '',
			farmer: '',
			page: 1,
			category: -1,
			admin: false,
			moderator: false,
			order: 'pertinence'
		} as {[key: string]: any}
		queryLower: string = ''
		pages: number = 0
		results: any[] | null = null
		categories: any[] = []
		searchStarted: boolean = false
		count: number = 0
		floor = Math.floor

		get canSearch() {
			return this.options.query || this.options.farmer || this.options.admin
		}
		created() {
			const languages = (localStorage.getItem('forum/languages') as string || this.$i18n.locale).split(',')
			LeekWars.get('forum/get-categories/' + languages).then(data => {
				this.categories = data.categories
			})
			LeekWars.setTitle(this.$i18n.t('title'))
		}

		@Watch('$route.query', {immediate: true})
		update() {
			this.options.query = (this.$route.query.query as string || '').replace(/\+/g, ' ')
			this.queryLower = this.options.query.toLowerCase()
			if (this.options.query === '-') { this.options.query = '' }
			this.options.farmer = this.$route.query.farmer || ''
			if (this.options.farmer === '-') { this.options.farmer = '' }
			this.options.page = parseInt(this.$route.query.page as string, 10) || 1
			const category = this.$route.query.category as string
			this.options.category = (category === '-' || !category) ? -1 : category
			this.options.order = this.$route.query.order || 'pertinence'
			this.options.admin = this.$route.query.admin || false
			this.options.moderator = this.$route.query.moderator || false
			this.options.resolved = this.$route.query.resolved || 'all'

			this.searchStarted = false
			this.results = null
			// if (this.canSearch) {
				this.searchStarted = true
				LeekWars.get('forum/search2/' + this.options.query.replace(/ /g, '+') + '/' + this.options.farmer + '/' + this.options.category + '/' + this.options.page + '/' + (this.options.order || 'pertinence') + '/' + (this.options.admin || false) + '/' + (this.options.moderator || false) + '/' + this.options.resolved).then(data => {
					this.results = data.results
					this.pages = data.pages
					this.count = data.count
				}).error(error => {
					this.results = []
					this.count = 0
					LeekWars.toast(error.error)
				})
			// }
		}
		get urlPagination() {
			const url = "/search"
			const options = Object.keys(this.options)
				.filter(option => this.options[option] !== null && this.options[option] !== this.defaultOptions[option] && option !== 'page')
				.map(option => option + '=' + this.options[option])
				.join('&')
			return url + '?' + options
		}
		search() {
			this.$router.push(this.urlPagination)
		}
		searchButton() {
			// if (!this.canSearch) {
			// 	LeekWars.toast(this.$t('not_enough_parameters'))
			// } else {
				this.search()
			// }
		}
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
	}
	.result .headline {
		color: #777;
		font-size: 14px;
	}
	.result ::v-deep b {
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