<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<router-link :to="getURL('leek', 'talent', country, LeekWars.rankingInactive)"><div class="tab" :class="{active: category === 'leek'}">{{ $t('leeks') }}</div></router-link>
				<router-link :to="getURL('level-' + rankingLevel, 'talent', country, LeekWars.rankingInactive)">
					<div class="tab" :class="{active: category.startsWith('level')}">
						{{ $t('main.level_n', [rankingLevel]) }}
						<v-menu offset-y>
							<template v-slot:activator="{ on }">
								<v-icon v-on="on" @click.prevent="">mdi-chevron-down</v-icon>
							</template>
							<v-list>
								<router-link v-for="level of [50, 100, 150, 200, 250, 300]" :key="level" :to="getURL('level-' + level, order, country, LeekWars.rankingInactive)">
									<v-list-item v-ripple >
										<v-list-item-content>
											<v-list-item-title>{{ $t('main.level_n', [level]) }}</v-list-item-title>
										</v-list-item-content>
									</v-list-item>
								</router-link>
							</v-list>
						</v-menu>
					</div>
				</router-link>
				<router-link :to="getURL('farmer', 'talent', country, LeekWars.rankingInactive)"><div class="tab" :class="{active: category === 'farmer'}">{{ $t('farmers') }}</div></router-link>
				<router-link :to="getURL('team', 'talent', country, LeekWars.rankingInactive)"><div class="tab" :class="{active: category === 'team'}">{{ $t('teams') }}</div></router-link>

				<v-menu v-model="countryList" offset-y>
					<template v-slot:activator="{ on }">
						<div class="tab" v-on="on" :class="{active: category.startsWith('country')}">
							<!-- {{ $t('main.country') }} -->
							<flag v-if="country" :code="country" :clickable="false" />
							<v-icon v-else :title="$t('main.worldwide')">mdi-earth</v-icon>
							<v-icon>mdi-chevron-down</v-icon>
						</div>
					</template>
					<v-list class="country-list" dense>
						<router-link :to="getURL(category, order, null, LeekWars.rankingInactive)">
							<v-list-item v-ripple>
								<v-icon>mdi-earth</v-icon>
								<v-list-item-content>
									{{ $t('main.worldwide') }}
								</v-list-item-content>
							</v-list-item>
						</router-link>
						<router-link v-if="$store.state.farmer?.country" :to="getURL(category, order, $store.state.farmer.country, LeekWars.rankingInactive)">
							<v-list-item v-ripple>
								<flag :code="$store.state.farmer.country" :clickable="false" />
								<v-list-item-content>
									{{ $t('country.' + $store.state.farmer.country) }}
								</v-list-item-content>
							</v-list-item>
						</router-link>
						<router-link v-for="country in LeekWars.countries" :key="country" :to="getURL(category, order, country, LeekWars.rankingInactive)">
							<v-list-item v-ripple >
								<flag :code="country" :clickable="false" />
								<v-list-item-content>{{ $t(`country.${country}`) }}</v-list-item-content>
							</v-list-item>
						</router-link>
					</v-list>
				</v-menu>
				<router-link to="/ranking/fun"><div class="tab" :class="{active: category === 'fun'}">{{ $t('fun') }}</div></router-link>
				<router-link to="/statistics"><div class="tab">{{ $t('statistics') }}</div></router-link>
				<div class="tab action" icon="search" @click="openSearch">
					<img src="/image/search.png">
				</div>
			</div>
		</div>
		<panel class="first last">
			<div v-if="category === 'fun'" slot="content" class="fun-rankings">
				<loader v-if="!rankings" />
				<div v-for="funRanking in rankings" :key="funRanking.title" class="fun-ranking">
					<h4>{{ $t(funRanking.title + '_title') }}</h4>
					<table class="ranking">
						<tr class="header">
							<th>{{ $t('place') }}</th>
							<th>{{ $t('main.farmer') }}</th>
							<th>{{ $t(funRanking.value) }}</th>
						</tr>
						<tr v-for="(farmer, i) in funRanking.ranking.ranking" :key="i" :class="farmer.me">
							<td>{{ parseInt(i) + 1 }}</td>
							<td :class="farmer.style">
								<router-link :to="'/farmer/' + farmer.id">
									<rich-tooltip-farmer :id="farmer.id" v-slot="{ on }">
										<span v-on="on">{{ farmer.name }}</span>
									</rich-tooltip-farmer>
								</router-link>
							</td>
							<td v-if="funRanking.value_type == 'number'">{{ farmer.value | number }}</td>
							<td v-else-if="funRanking.value_type == 'money'">{{ farmer.value | number }} <span class="hab"></span></td>
							<td v-else-if="funRanking.value_type == 'distance'">{{ farmer.value | number }}m</td>
						</tr>
						<tr v-if="$store.state.farmer && funRanking.ranking.farmer_rank > 10" class="me">
							<td>{{ funRanking.ranking.farmer_rank }}</td>
							<td>{{ $store.state.farmer.name }}</td>
							<td v-if="funRanking.value_type == 'number'">{{ funRanking.ranking.farmer_value | number }}</td>
							<td v-if="funRanking.value_type == 'money'">{{ funRanking.ranking.farmer_value | number }} <span class="hab"></span></td>
							<td v-if="funRanking.value_type == 'distance'">{{ funRanking.ranking.farmer_value | number }}m</td>
						</tr>
					</table>
				</div>
			</div>
			<div v-else slot="content">
				<div class="center">
					<pagination :current="page" :total="pages" :url="url" :url-query="urlQuery" />
					<div v-if="$store.state.farmer" class="me-buttons">
						<template v-if="displayCategory === 'leek'">
							<v-btn v-for="leek in $store.state.farmer.leeks" :key="leek.id" @click="LeekWars.goToRanking('leek', order, leek.id)">{{ leek.name }}</v-btn>
						</template>
						<v-btn v-else-if="category === 'farmer'" @click="LeekWars.goToRanking('farmer', order, $store.state.farmer.id)">{{ $t('my_farmer') }}</v-btn>
						<v-btn v-else-if="category === 'team' && $store.state.farmer.team" @click="LeekWars.goToRanking('team', order, $store.state.farmer.team.id)">{{ $t('my_team') }}</v-btn>
					</div>
					<v-switch v-model="activeSwitch" :label="$t('hide_inactives')" hide-details class="inactives" @change="toggleInactives" />
				</div>
				<div class="scroll-x">
					<table v-if="displayCategory === 'leek'" class="ranking large">
						<tr class="header">
							<th class="ranking-column">{{ $t('place') }}</th>
							<th>
								<router-link :to="getURL('leek', 'name', page, country, inactive)">
									<span>{{ $t('main.leek') }}</span>
									<v-icon v-if="order === 'name'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('leek', 'talent', page, country, inactive)">
									<span>{{ $t('main.talent') }}</span>
									<v-icon v-if="order === 'talent'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('leek', 'level', page, country, inactive)">
									<span>{{ $t('main.level') }}</span>
									<v-icon v-if="order === 'level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('leek', 'xp', page, country, inactive)">
									<span>{{ $t('xp') }}</span>
									<v-icon v-if="order === 'xp'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th class="column-farmer">{{ $t('main.farmer') }}</th>
							<th>{{ $t('main.country') }}</th>
							<th class="column-team">{{ $t('main.team') }}</th>
						</tr>
						<ranking-leek-row v-for="row in ranking" :key="row.id" :row="row" :class="{highlight: searchResult == row.rank}" />
					</table>
					<table v-else-if="displayCategory == 'farmer'" class="ranking large">
						<tr class="header">
							<th class="ranking-column">{{ $t('place') }}</th>
							<th>
								<router-link :to="getURL('farmer', 'name', country, inactive)">
									<span>{{ $t('main.farmer') }}</span>
									<v-icon v-if="order === 'name'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('farmer', 'talent', country, inactive)">
									<span>{{ $t('main.talent') }}</span>
									<v-icon v-if="order === 'talent'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('farmer', 'trophies', country, inactive)">
									<span>{{ $t('trophies') }}</span>
									<v-icon v-if="order === 'trophies'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('farmer', 'total-level', country, inactive)">
									<span>{{ $t('total_level') }}</span>
									<v-icon v-if="order === 'total-level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>{{ $t('leeks') }}</th>
							<th>{{ $t('main.country') }}</th>
							<th>{{ $t('main.team') }}</th>
						</tr>
						<ranking-farmer-row v-for="row in ranking" :key="row.id" :row="row" :class="{highlight: searchResult == row.rank}" />
					</table>
					<table v-else class="ranking large">
						<tr class="header">
							<th class="ranking-column">{{ $t('place') }}</th>
							<th>
								<router-link :to="getURL('team', 'name', country, inactive)">
									<span>{{ $t('main.team') }}</span>
									<v-icon v-if="order === 'name'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('team', 'talent', country, inactive)">
									<span>{{ $t('main.talent') }}</span>
									<v-icon v-if="order === 'talent'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('team', 'level', country, inactive)">
									<span>{{ $t('main.level') }}</span>
									<v-icon v-if="order === 'level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('team', 'total-level', country, inactive)">
									<span>{{ $t('total_level') }}</span>
									<v-icon v-if="order === 'total-level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('team', 'xp', country, inactive)">
									<span>{{ $t('xp') }}</span>
									<v-icon v-if="order === 'xp'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('team', 'farmers', country, inactive)">
									<span>{{ $t('farmers') }}</span>
									<v-icon v-if="order === 'farmers'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('team', 'leeks', country, inactive)">
									<span>{{ $t('leeks') }}</span>
									<v-icon v-if="order === 'leeks'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
						</tr>
						<ranking-team-row v-for="row in ranking" :key="row.id" :row="row" :class="{highlight: searchResult == row.rank}" />
					</table>
					<loader v-if="!ranking" />
				</div>
				<div class="center">
					<pagination :current="page" :total="pages" :url="url" :url-query="urlQuery" />
				</div>
			</div>
		</panel>

		<popup v-model="searchDialog" :width="500">
			<v-icon slot="icon">mdi-magnify</v-icon>
			<span slot="title">{{ $t('search_in_ranking') }}</span>
			<input ref="search" v-model="searchQuery" :placeholder="$t('search_name')" class="query" type="text">
			<div class="flex">
				<v-checkbox v-model="searchLeeks" :label="$t('leeks')" hide-details />
				<v-checkbox v-model="searchFarmers" :label="$t('farmers')" hide-details />
				<v-checkbox v-model="searchTeams" :label="$t('teams')" hide-details />
			</div>
			<br>
			<loader v-if="!searchResults && searchQuery.length" />
			<h4 v-if="searchResults">{{ $t('results') }}</h4>
			<div v-if="searchResults && searchResults.length === 0" class="center">{{ $t('no_results') }}</div>
			<ranking-search-result v-for="result in searchResults" :key="result.id" :result="result" @gotoresult="goToResult" />
		</popup>
	</div>
</template>

<script lang="ts">
	import RankingFarmerRowElement from '@/component/ranking/ranking-farmer-row.vue'
	import RankingLeekRowElement from '@/component/ranking/ranking-leek-row.vue'
	import RankingSearchResult from '@/component/ranking/ranking-search-result.vue'
	import RankingTeamRowElement from '@/component/ranking/ranking-team-row.vue'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Ranking } from '@/model/ranking'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import Pagination from '@/component/pagination.vue'

	@Component({
		name: 'ranking', i18n: {}, mixins: [...mixins],
		components: { 'ranking-leek-row': RankingLeekRowElement, 'ranking-farmer-row': RankingFarmerRowElement, 'ranking-team-row': RankingTeamRowElement, 'ranking-search-result': RankingSearchResult, RichTooltipFarmer, Pagination }
	})
	export default class RankingPage extends Vue {
		fun: boolean = false
		rankings: any = null
		page: number = 0
		pages: number = 0
		category: string = ''
		ranking: Ranking | null = null
		order: string = ''
		searchDialog: boolean = false
		searchLeeks: boolean = true
		searchFarmers: boolean = true
		searchTeams: boolean = true
		searchQuery: string = ''
		searchResults: any[] | null = null
		activeSwitch: boolean = false
		countryList: boolean = false
		displayCategory: string = ''

		get url() {
			return this.getURLBase(this.category, this.order)
		}
		get urlQuery() {
			return this.getURLQuery(this.country, LeekWars.rankingInactive)
		}
		get searchResult() {
			return parseInt(this.$route.hash.replace('#rank-', ''), 10)
		}
		get rankingLevel(): number {
			return this.category && this.category.startsWith('level-') ? parseInt(this.category.substring(6)) : parseInt(localStorage.getItem('ranking/level') || '50')
		}
		get country(): string | null {
			if (!this.$route.query.country) { return null }
			return '' + this.$route.query.country // || localStorage.getItem('ranking/country') || this.$store.state.farmer?.country || 'fr'
		}
		get inactive(): boolean {
			if (this.$route.query.inactive) { return !!this.$route.query.inactive }
			return LeekWars.rankingInactive
		}

		@Watch('$route.params', {immediate: true})
		update() {
			this.category = 'category' in this.$route.params ? this.$route.params.category : 'leek'
			this.displayCategory = this.category
			if (this.category.startsWith('level-')) {
				this.displayCategory = 'leek'
				localStorage.setItem('ranking/level', '' + this.rankingLevel)
			}

			// localStorage.setItem('ranking/country', this.$route.params.country)

			this.activeSwitch = !this.inactive
			if (this.category !== 'fun') {
				this.order = 'order' in this.$route.params ? this.$route.params.order : 'talent'
				this.page = 'page' in this.$route.params ? parseInt(this.$route.params.page, 10) : 1
			}
		}

		get key() {
			if (this.category === 'fun') return 'fun'
			return this.inactive + '/' + this.category + '/' + this.order + '/' + this.page + '/' + this.country
		}

		@Watch('key', { immediate: true })
		updateRanking() {
			// console.log("update", { active: this.active, category: this.category, order: this.order, page: this.page })
			if (this.category === 'fun') {
				this.rankings = null
				LeekWars.get('ranking/fun').then(data => {
					for (const row of data.rankings) {
						row.ranking.ranking[0].style = 'first'
						row.ranking.ranking[1].style = 'second'
						row.ranking.ranking[2].style = 'third'
					}
					if (this.$store.state.connected) {
						for (const category of data.rankings) {
							for (const row of category.ranking.ranking as Ranking) {
								if (row.id === this.$store.state.farmer.id) {
									row.me = 'me'
								}
							}
						}
					}
					this.fun = true
					this.rankings = data.rankings
					this.ranking = []
					LeekWars.setTitle(this.$t('title'), this.$t('fun'))
					this.$root.$emit('loaded')
				})
			} else {
				this.ranking = null
				const service = this.inactive ? 'get' : 'get-active'
				LeekWars.get('ranking/' + service + '/' + this.category + '/' + this.order + '/' + this.page + '/' + this.country).then(data => {
					const ranking = data.ranking as Ranking
					if (this.page === 1) {
						if (ranking.length > 0) {
							ranking[0].style = 'first'
						}
						if (ranking.length > 1) {
							ranking[1].style = 'second'
						}
						if (ranking.length > 2) {
							ranking[2].style = 'third'
						}
					}
					if (this.$store.state.connected) {
						for (const row of ranking) {
							if (this.category === 'leek' || this.category.includes('level-')) {
								if (this.$store.state.farmer && row.id in this.$store.state.farmer.leeks) {
									row.me = 'me'
								}
							} else if (this.category === 'farmer') {
								if (row.id === this.$store.state.farmer.id) {
									row.me = 'me'
								}
							} else if (this.category === 'team') {
								if (this.$store.state.farmer.team && row.id === this.$store.state.farmer.team.id) {
									row.me = 'me'
								}
							}
						}
					}
					this.fun = false
					this.pages = data.pages
					this.ranking = ranking
					LeekWars.setActions([{icon: 'mdi-magnify', click: () => this.openSearch()}])
					LeekWars.setTitle(this.$t('title'), this.$t('main.n_' + this.category + 's', [data.total]))
					this.$root.$emit('loaded')
				})
			}
		}

		goToResult(event: any) {
			this.searchDialog = false
			LeekWars.goToRanking(event.type, 'talent', event.id)
		}

		openSearch() {
			this.searchDialog = true
			this.searchQuery = ''
			setTimeout(() => (this.$refs.search as HTMLElement).focus())
		}
		@Watch('searchQuery') @Watch('searchLeeks') @Watch('searchFarmers') @Watch('searchTeams')
		searchUpdate() {
			this.searchResults = null
			if (!this.searchQuery.length) {
				this.searchResults = []
			} else {
				LeekWars.post('ranking/search', {query: this.searchQuery, search_leeks: this.searchLeeks, search_farmers: this.searchFarmers, search_teams: this.searchTeams}).then(data => {
					this.searchResults = data.results
				})
			}
		}

		toggleInactives() {
			LeekWars.rankingInactive = !this.activeSwitch
			localStorage.setItem('options/ranking-inactive', '' + LeekWars.rankingInactive)
			this.$router.push(this.url + this.urlQuery)
		}

		@Watch('countryList')
		updateCountryList() {
			if (this.countryList) {
				LeekWars.loadCountries()
			}
		}

		getURL(category: string, order: string, country: string | null, inactive: boolean) {
			return this.getURLBase(category, order) + this.getURLQuery(country, inactive)
		}

		getURLBase(category: string, order: string) {
			return '/ranking' + (category !== 'leek' || order !== 'talent' ? '/' + category : '') + (order !== 'talent' ? '/' + order : '')
		}

		getURLQuery(country: string | null, inactive: boolean) {
			const query = []
			if (country) query.push('country=' + country)
			if (inactive) query.push('inactive')
			return (query.length ? '?' + query.join('&') : '')
		}
	}
</script>

<style lang="scss" scoped>
	.center {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
	}
	.tab button {
		margin-right: -6px;
	}
	.panel .content {
		padding: 0
	}
	.pagination {
		text-align: center;
		display: inline-block;
	}
	.me-buttons {
		display: inline-flex;
		.button {
			margin: 0 3px;
		}
	}
	.inactives {
		padding: 10px;
		vertical-align: bottom;
	}
	.ranking.large {
		width: 100%;
	}
	h4 {
		text-align: left;
		margin: 8px 5px;
	}
	.ranking {
		background: white;
		::v-deep td {
			border-bottom: 1px solid #ddd;
			border-right: 1px solid #ddd;
			text-align: center;
			padding: 5px 7px;
			white-space: nowrap;
		}
		::v-deep td:last-child {
			border-right: none;
		}
		tr.header {
			background: #e5e5e5;
			height: 38px;
			text-align: center;
			a {
				display: flex;
				align-items: center;
				justify-content: center;
			}
			i {
				margin-bottom: -1px;
			}
		}
		tr:first-child th:last-child {
			border-top-right-radius: 3px;
		}
		th {
			padding: 0 5px;
			font-weight: normal;
			color: #222;
			font-size: 16px;
			border-bottom: 1px solid #fff;
			border-right: 1px solid #fff;
		}
		th:last-child {
			border-right: none;
		}
		th a {
			color: #222;
		}
		::v-deep .first a {
			color: #ffa900;
			font-weight: bold;
		}
		::v-deep .second a {
			color: #9c9c9c;
			font-weight: bold;
		}
		::v-deep .third a {
			color: #ae4e00;
			font-weight: bold;
		}
		tr.me {
			font-weight: bold;
			::v-deep td {
				background: #eee;
			}
		}
		tr.highlight {
			::v-deep td {
				background: #b5ee84;
			}
		}
		tr.inactive {
			::v-deep td, ::v-deep a {
				color: #777;
				font-style: italic;
			}
		}
		::v-deep .country-wrapper {
			height: 16px;
			.flag {
				height: 16px;
			}
		}
	}
	.ranking-column {
		width: 80px;
	}
	.column-team, .column-farmer {
		width: 140px;
		div {
			width: 140px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
	.fun-rankings {
		margin: 0 0px;
		text-align: center;
		h2 {
			text-align: left;
		}
		.fun-ranking {
			display: inline-block;
			margin: 8px 3px;
		}
		table {
			margin: 4px;
			width: 320px;
		}
		.ranking tr td:first-child {
			width: 45px;
		}
		.ranking tr td:last-child {
			width: 120px;
		}
	}
	#app.app .fun-rankings .fun-ranking {
		width: 100%;
		margin: 0px;
		table {
			width: 100%;
			margin: 6px 0;
		}
	}
	.query {
		width: 100%;
		padding: 0 6px;
		height: 36px;
		margin-bottom: 15px;
	}
	.country-list {
		max-height: 500px;
		.flag, i {
			width: 30px;
			margin-right: 10px;
		}
	}
</style>