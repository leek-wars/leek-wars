<template>
	<div>
		<div class="page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<div class="panel">
			<div class="content">
				<div id="search">
					<div id="search-box">
						<div class="label">{{ $t('query') }}</div>
						<input id="query" v-model="query" type="text" @keydown.enter="search">
					</div>
					<br>
					<div id="search-box-farmer">
						<div class="label">{{ $t('author') }}</div>
						<input id="farmer-query" v-model="farmer" type="text" @keydown.enter="search">
					</div>
					<br>
					<div>
						<div class="label">{{ $t('category') }}</div>
						<select id="search-category" v-model="category" @change="search">
							<option value="-1">{{ $t('all_categories') }}</option>
							<option v-for="c in categories" :key="c.id" :value="c.id">{{ c.type == 'team' ? c.name : $i18n.t('forum.category_' + c.name) }}</option>
						</select>
					</div>
					<br>
					<div id="search-button" class="button green" @click="search">
						<img src="/image/search.png"><span>{{ $t('search') }}</span>
					</div>

					<br><br>
					<h4>{{ $t('results') }}</h4>

					<pagination :current="page" :total="pages" :url="url" />

					<loader v-if="!results" />

					<div v-else class="results-wrapper">
						<div v-if="results.length" class="results">
							<div v-for="(result, r) in results" :key="r" class="result card">
								<router-link :to="'/forum/category-' + result.cid + '/topic-' + result.tid">
									<div v-if="query !== '' && result.title.toLowerCase().indexOf(queryLower) !== -1" class="title" v-html="highlight(result.title, queryLower)"></div>
									<div v-else class="title">{{ result.title }}</div>
								</router-link>
								<i18n tag="div" class="info" path="post_by_x_the_x_in_x">
									<router-link :to="'/farmer/' + result.fid" place="farmer">
										<template v-if="farmer === ''">{{ result.fname }}</template>
										<span v-else><b>{{ result.fname }}</b></span>
									</router-link>
									<span place="date" class="dark">{{ result.date | date }}</span>
									<router-link :to="'/forum/category-' + result.cid" place="topic">
										{{ $i18n.t('forum.category_' + result.cname) }}
									</router-link>
								</i18n>
								<router-link :to="'/forum/category-' + result.cid + '/topic-' + result.tid">
									<div class="headline" v-html="result.message"></div>
								</router-link>
							</div>
						</div>
						<div v-if="results.length === 0" id="no-results">
							<img src="/image/notgood.png">
							<div>{{ $t('no_results_found') }}</div>
						</div>
					</div>
					<pagination :current="page" :total="pages" :url="url" />
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'search', i18n: {} })
	export default class Search extends Vue {
		query: string = ''
		queryLower: string = ''
		farmer: string = ''
		page: number = 1
		pages: number = 0
		category: number = -1
		results: any[] | null = null
		categories: any[] = []

		created() {
			const language = localStorage.getItem('forum/language') || i18n.locale
			LeekWars.get<any>('forum/get-categories/' + language + '/' + this.$store.state.token).then((data) => {
				this.categories = data.data.categories
			})
			LeekWars.setTitle(i18n.t('search.title'))
		}

		@Watch('$route.params', {immediate: true})
		update() {
			this.query = this.$route.params.query || ''
			this.queryLower = this.query.toLowerCase()
			if (this.query === '-') { this.query = '' }
			this.farmer = this.$route.params.farmer || ''
			if (this.farmer === '-') { this.farmer = '' }
			this.page = parseInt(this.$route.params.page, 10) || 1
			const category = this.$route.params.category
			this.category = (category === '-' || !category) ? -1 : parseInt(category, 10)

			this.results = null
			if (this.query) {
				LeekWars.get<any>('forum/search/' + this.query + '/' + this.farmer + '/' + this.category + '/' + this.page + '/' + this.$store.state.token).then((data) => {
					this.results = data.data.results
					this.pages = data.data.pages
				})
			} else {
				this.results = []
				this.pages = 0
			}
		}
		highlight(text: string, query: string) {
			const pos = text.toLowerCase().indexOf(query)
			return text.substring(0, pos) + "<b>" + text.substring(pos, pos + query.length) + "</b>" + text.substring(pos + query.length)
		}
		createURL(query: string, farmer: string, category: number) {
			let url = "/search/" + (query || '-').replace(/ /g, '+')
			if (farmer !== "") {
				url += '/' + farmer
			} else if (category !== -1) {
				url += '/-'
			}
			if (category !== -1) { url += '/' + category }
			return url
		}
		get url() {
			return this.createURL(this.query, this.farmer, this.category)
		}
		search() {
			this.$router.push(this.createURL(this.query, this.farmer, this.category))
		}
	}
</script>

<style lang="scss" scoped>
	#search {
		padding: 20px;
	}
	#app.app #search {
		padding: 0;
		padding-top: 10px;
	}
	.label {
		width: 90px;
		display: inline-block;
		text-align: right;
		margin-right: 6px;
	}
	#search-button {
		margin-left: 100px;
	}
	#search-button img {
		vertical-align: bottom;
		margin-right: 6px;
	}
	#query:focus {
		border: 1px solid #5FAD1B;
	}
	#farmer-query:focus {
		border: 1px solid #5FAD1B;
	}
	#search-category {
		height: 28px;
	}
	#search h2 {
		margin-top: 20px;
	}
	#search .result {
		background: #FAFAFA;
		padding: 10px;
		margin: 8px 0;
	}
	#search .result:hover {
		background: white;
	}
	#search .result .title {
		font-weight: 300;
		font-size: 22px;
		margin-bottom: 5px;
		color: black;
	}
	#search .result .headline {
		color: #777;
		font-size: 14px;
	}
	#search .result /deep/ b {
		color: #5FAD1B;
		font-weight: bold;
	}
	#search .info {
		color: #aaa;
		margin-bottom: 10px;
	}
	#search .result .dark {
		color: #555;
	}
	.pagination {
		text-align: center;
	}
	#no-results {
		text-align: center;
		padding: 10px;
		color: #999;
	}
	#no-results img {
		margin-bottom: 8px;
	}
</style>