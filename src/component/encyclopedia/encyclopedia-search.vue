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
					<input v-model="options.query" class="query card" type="text" @keydown.enter="search">
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

<script lang="ts">
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import Pagination from '@/component/pagination.vue'

	@Options({ name: 'encyclopedia-search', i18n: {}, mixins: [...mixins], components: { Breadcrumb, Markdown, Pagination } })
	export default class EncyclopediaSearch extends Vue {
		options = {
			query: '',
			page: 1,
		} as {[key: string]: any}

		queryLower: string = ''
		pages: number = 0
		results: any[] | null = null
		categories: any[] = []
		searchStarted: boolean = false
		count: number = 0
		floor = Math.floor

		get canSearch() {
			return this.options.query
		}
		created() {
			LeekWars.setTitle(this.$i18n.t('title'))
		}

		@Watch('$route.query', {immediate: true})
		update() {
			this.options.query = (this.$route.query.query as string || '').replace(/\+/g, ' ')
			this.queryLower = this.options.query.toLowerCase()
			if (this.options.query === '-') { this.options.query = '' }
			this.options.page = parseInt(this.$route.query.page as string, 10) || 1

			this.searchStarted = false
			this.results = null
			if (this.canSearch) {
				this.searchStarted = true
				LeekWars.get('encyclopedia/search/' + i18n.locale + '/' + this.options.query.replace(/ /g, '+') + '/' + this.options.page).then(data => {
					this.results = data.results
					this.pages = data.pages
					this.count = data.count
				}).error(error => {
					this.results = []
					this.count = 0
					LeekWars.toast(error.error)
				})
			}
		}
		get url() {
			return this.urlPagination + (this.options.page > 1 ? '&page=' + this.options.page : '')
		}
		get urlPagination() {
			const url = "/encyclopedia-search"
			const options = Object.keys(this.options)
				.filter(option => this.options[option] !== null && option !== 'page')
				.map(option => option + '=' + this.options[option])
				.join('&')
			return url + '?' + options
		}
		search() {
			this.$router.push(this.url)
		}
		searchButton() {
			if (!this.canSearch) {
				LeekWars.toast(this.$t('not_enough_parameters'))
			} else {
				this.search()
			}
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
</style>