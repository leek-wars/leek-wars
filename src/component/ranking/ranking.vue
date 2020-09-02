<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<!-- TODO tabs active classes -->
				<router-link :to="rankingLeekURL"><div class="tab {$leek_tab_class}">{{ $t('leeks') }}</div></router-link>
				<router-link :to="rankingFarmerURL"><div class="tab {$farmer_tab_class}">{{ $t('farmers') }}</div></router-link>
				<router-link :to="rankingTeamURL"><div class="tab {$team_tab_class}">{{ $t('teams') }}</div></router-link>
				<router-link to="/ranking/fun"><div class="tab {$fun_tab_class}">{{ $t('fun') }}</div></router-link>
				<router-link to="/statistics"><div class="tab">{{ $t('statistics') }}</div></router-link>
				<div class="tab action" icon="search" @click="openSearch">
					<img src="/image/search.png">
				</div>
			</div>
		</div>
		<panel class="first">
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
					<pagination :current="page" :total="pages" :url="url" />
					<div v-if="$store.state.farmer" class="me-buttons">
						<template v-if="category === 'leek'">
							<v-btn v-for="leek in $store.state.farmer.leeks" :key="leek.id" @click="LeekWars.goToRanking('leek', order, leek.id)">{{ leek.name }}</v-btn>
						</template>
						<v-btn v-else-if="category === 'farmer'" @click="LeekWars.goToRanking('farmer', order, $store.state.farmer.id)">{{ $t('my_farmer') }}</v-btn>
						<v-btn v-else-if="category === 'team' && $store.state.farmer.team" @click="LeekWars.goToRanking('team', order, $store.state.farmer.team.id)">{{ $t('my_team') }}</v-btn>
					</div>
					<v-switch v-model="activeSwitch" :label="$t('hide_inactives')" class="inactives" @change="toggleInactives" />
				</div>
				<div class="scroll-x">
					<table v-if="category === 'leek'" class="ranking large">
						<tr class="header">
							<th class="ranking-column">{{ $t('place') }}</th>
							<th>
								<router-link :to="'/ranking/leek/name/page-' + page">
									<span>{{ $t('main.leek') }}</span>
									<v-icon v-if="order === 'name'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/leek' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('main.talent') }}</span>
									<v-icon v-if="order === 'talent'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/leek/level' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('main.level') }}</span>
									<v-icon v-if="order === 'level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/leek/xp' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('xp') }}</span>
									<v-icon v-if="order === 'xp'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th class="column-farmer">{{ $t('main.farmer') }}</th>
							<th>{{ $t('country') }}</th>
							<th class="column-team">{{ $t('main.team') }}</th>
						</tr>
						<ranking-leek-row v-for="row in ranking" :key="row.id" :row="row" :class="{highlight: searchResult == row.rank}" />
					</table>
					<table v-else-if="category == 'farmer'" class="ranking large">
						<tr class="header">
							<th class="ranking-column">{{ $t('place') }}</th>
							<th>
								<router-link :to="'/ranking/farmer/name' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('main.farmer') }}</span>
									<v-icon v-if="order === 'name'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/farmer/talent' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('main.talent') }}</span>
									<v-icon v-if="order === 'talent'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/farmer/total-level' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('total_level') }}</span>
									<v-icon v-if="order === 'total-level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>{{ $t('leeks') }}</th>
							<th>
								<router-link :to="'/ranking/farmer/trophies' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('trophies') }}</span>
									<v-icon v-if="order === 'trophies'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>{{ $t('country') }}</th>
							<th>{{ $t('main.team') }}</th>
						</tr>
						<ranking-farmer-row v-for="row in ranking" :key="row.id" :row="row" :class="{highlight: searchResult == row.rank}" />
					</table>
					<table v-else class="ranking large">
						<tr class="header">
							<th class="ranking-column">{{ $t('place') }}</th>
							<th>
								<router-link :to="'/ranking/team/name' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('leek') }}</span>
									<v-icon v-if="order === 'name'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/team' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('main.talent') }}</span>
									<v-icon v-if="order === 'talent'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/team/level' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('main.level') }}</span>
									<v-icon v-if="order === 'level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/team/total-level' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('total_level') }}</span>
									<v-icon v-if="order === 'total-level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/team/xp' + (active ? '/active' : '') + '/page-' + page">
									<span>{{ $t('xp') }}</span>
									<v-icon v-if="order === 'xp'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/team/farmers/page-' + page">
									<span>{{ $t('farmers') }}</span>
									<v-icon v-if="order === 'farmers'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="'/ranking/team/leeks/page-' + page">
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
					<pagination :current="page" :total="pages" :url="url" />
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

	@Component({
		name: 'ranking', i18n: {}, mixins,
		components: { 'ranking-leek-row': RankingLeekRowElement, 'ranking-farmer-row': RankingFarmerRowElement, 'ranking-team-row': RankingTeamRowElement, 'ranking-search-result': RankingSearchResult }
	})
	export default class RankingPage extends Vue {
		fun: boolean = false
		rankings: any = null
		page: number = 0
		pages: number = 0
		category: string | null = null
		ranking: Ranking | null = null
		order: string | null = null
		searchDialog: boolean = false
		searchLeeks: boolean = true
		searchFarmers: boolean = true
		searchTeams: boolean = true
		searchQuery: string = ''
		searchResults: any[] | null = null
		@Prop() active!: boolean
		activeSwitch: boolean = false

		get url() {
			return '/ranking' + (this.category !== 'leek' || this.order !== 'talent' || this.active ? '/' + this.category : '') + (this.order !== 'talent' || this.active ? '/' + this.order : '') + (this.activeSwitch ? '/active' : '')
		}
		get rankingLeekURL() {
			return '/ranking' + (LeekWars.rankingActive ? '/active' : '')
		}
		get rankingFarmerURL() {
			return '/ranking/farmer' + (LeekWars.rankingActive ? '/active' : '')
		}
		get rankingTeamURL() {
			return '/ranking/team' + (LeekWars.rankingActive ? '/active' : '')
		}
		get searchResult() {
			return parseInt(this.$route.hash.replace('#rank-', ''), 10)
		}

		@Watch('$route.params', {immediate: true})
		update() {
			this.category = 'category' in this.$route.params ? this.$route.params.category : 'leek'
			this.activeSwitch = this.active
			if (this.category !== 'fun') {
				this.order = 'order' in this.$route.params ? this.$route.params.order : 'talent'
				this.page = 'page' in this.$route.params ? parseInt(this.$route.params.page, 10) : 1
			}
		}

		@Watch('active', {immediate: true})
		@Watch('category')
		@Watch('order')
		@Watch('page')
		updateRanking() {
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
				const service = this.active ? 'get-active' : 'get'
				LeekWars.get('ranking/' + service + '/' + this.category + '/' + this.order + '/' + this.page).then(data => {
					const ranking = data.ranking as Ranking
					if (this.page === 1) {
						ranking[0].style = 'first'
						ranking[1].style = 'second'
						ranking[2].style = 'third'
					}
					if (this.$store.state.connected) {
						for (const row of ranking) {
							if (this.category === 'leek') {
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
			LeekWars.rankingActive = this.activeSwitch
			localStorage.setItem('options/ranking-active', '' + LeekWars.rankingActive)
			this.$router.push(this.url)
		}
	}
</script>

<style lang="scss" scoped>
	.panel .content {
		padding: 0
	}
	.pagination {
		text-align: center;
		display: inline-block;
	}
	.me-buttons {
		padding-top: 8px;
		display: inline-flex;
		.button {
			margin: 0 3px;
		}
	}
	.inactives {
		padding-left: 8px;
		margin-bottom: -6px;
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
			font-size: 18px;
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
			height: 18px;
			img {
				margin-top: -2px;
				width: 24px;
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
</style>