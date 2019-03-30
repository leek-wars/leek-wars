<template>
	<div>
		<div class="page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first last">
			<div class="search">
				<div class="search-box">
					<div class="label">{{ $t('query') }}</div>
					<input v-model="query" class="query card" type="text" @keydown.enter="search">
				</div>
				<div class="search-box-farmer">
					<div class="label">{{ $t('author') }}</div>
					<input v-model="farmer" class="query card" type="text" @keydown.enter="search">
				</div>
				<div>
					<div class="label">{{ $t('category') }}</div>
					<select v-model="category" class="search-category" @change="search">
						<option value="-1">{{ $t('all_categories') }}</option>
						<option v-for="c in categories" :key="c.id" :value="c.id">{{ c.type == 'team' ? c.name : $i18n.t('forum.category_' + c.name) }}</option>
					</select>
				</div>
				<br>
				<div class="center">
					<v-btn color="primary" class="search-button" @click="search">
						<img src="/image/search.png"><span>{{ $t('search') }}</span>
					</v-btn>
				</div>
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
				<div v-if="results.length === 0" class="no-results">
					<img src="/image/notgood.png">
					<div>{{ $t('no_results_found') }}</div>
				</div>
			</div>
			<pagination :current="page" :total="pages" :url="url" />
		</panel>
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
			LeekWars.get('forum/get-categories/' + language).then(data => {
				this.categories = data.categories
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
			if (this.query || this.farmer) {
				LeekWars.get('forum/search/' + this.query + '/' + this.farmer + '/' + this.category + '/' + this.page).then(data => {
					this.results = data.results
					this.pages = data.pages
				})
			} else {
				this.results = []
				this.pages = 0
			}
		}
		highlight(text: string, query: string) {
			const pos = text.toLowerCase().indexOf(query)
			return LeekWars.protect(text.substring(0, pos)) + "<b>" + LeekWars.protect(text.substring(pos, pos + query.length)) + "</b>" + LeekWars.protect(text.substring(pos + query.length))
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
		margin: 0 auto;
		img {
			vertical-align: bottom;
			margin-right: 6px;
		}
	}
	.query {
		height: 40px;
		padding: 0 8px;
		width: calc(100% - 16px);
		margin-bottom: 10px;
	}
	.query:focus {
		border: 1px solid #5fad1b;
	}
	.search-category {
		height: 40px;
		width: 100%;
		font-size: 16px;
	}
	h2 {
		margin-top: 20px;
	}
	.result {
		background: #fafafa;
		padding: 10px;
		margin: 8px 0;
	}
	.result:hover {
		background: white;
	}
	.result .title {
		font-weight: 300;
		font-size: 22px;
		margin-bottom: 5px;
		color: black;
	}
	.result .headline {
		color: #777;
		font-size: 14px;
	}
	.result /deep/ b {
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