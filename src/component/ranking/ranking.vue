<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<!-- TODO tabs active classes -->
				<router-link to="/ranking"><div class="tab {$leek_tab_class}">{{ $t('leeks') }}</div></router-link>
				<router-link to="/ranking/farmer"><div class="tab {$farmer_tab_class}">{{ $t('farmers') }}</div></router-link>
				<router-link to="/ranking/team"><div class="tab {$team_tab_class}">{{ $t('teams') }}</div></router-link>
				<router-link to="/ranking/fun"><div class="tab {$fun_tab_class}">{{ $t('fun') }}</div></router-link>
				<router-link to="/statistics"><div class="tab">{{ $t('statistics') }}</div></router-link>
				<div class="tab action" icon="search" @click="openSearch">
					<img src="/image/search.png">
				</div>
			</div>
		</div>
		<div class="panel first last">
			<div class="content">
				<div v-if="category === 'fun'" class="fun-rankings">
					<loader v-if="!rankings" />
					<div v-for="funRanking in rankings" :key="funRanking.title" class="fun-ranking">
						<h4>{{ $t(funRanking.title + '_title') }}</h4>
						<table class="ranking">
							<tr class="header">
								<th>{{ $t('place') }}</th>
								<th>{{ $t('farmer') }}</th>
								<th>{{ $t('ranking.' + funRanking.value) }}</th>
							</tr>
							<tr v-for="(farmer, i) in funRanking.ranking.ranking" :key="i" :class="farmer.me">
								<td>{{ parseInt(i) + 1 }}</td>
								<td :class="farmer.style"><router-link :to="'/farmer/' + farmer.id">{{ farmer.name }}</router-link></td>
								<td v-if="funRanking.value_type == 'number'">{{ farmer.value | number }}</td>
								<td v-else-if="funRanking.value_type == 'money'">{{ farmer.value | number }} <span class="hab"></span></td>
								<td v-else-if="funRanking.value_type == 'distance'">{{ farmer.value | number }}m</td>
							</tr>
							<tr v-if="$store.getters.connected && funRanking.ranking.farmer_rank > 10" class="me">
								<td>{{ funRanking.ranking.farmer_rank }}</td>
								<td>{{ $store.state.farmer.name }}</td>
								<td v-if="funRanking.value_type == 'number'">{{ funRanking.ranking.farmer_value | number }}</td>
								<td v-if="funRanking.value_type == 'money'">{{ funRanking.ranking.farmer_value | number }} <span class="hab"></span></td>
								<td v-if="funRanking.value_type == 'distance'">{{ funRanking.ranking.farmer_value | number }}m</td>
							</tr>
						</table>
					</div>
				</div>
				<div v-else>
					<div class="center">
						<pagination :current="page" :total="pages" :url="'/ranking/' + category + '/' + order" />
						<div class="me-buttons center">
							<div v-if="category === 'leek'">
								<div v-for="leek in $store.state.farmer.leeks" :key="leek.id" class="button" @click="goToMyRanking(leek.id)">{{ leek.name }}</div>
							</div>
							<div v-else-if="category === 'farmer'" class="button me-button" @click="goToMyRanking">{{ $t('my_farmer') }}</div>
							<div v-else-if="category === 'team' && $store.state.farmer.team" class="button me-button" @click="goToMyRanking">{{ $t('my_team') }}</div>
						</div>
					</div>
					<div class="scroll-x">
						<table v-if="category === 'leek'" class="ranking large">
							<tr class="header">
								<th class="ranking-column">{{ $t('place') }}</th>
								<th>
									<router-link :to="'/ranking/leek/name/page-' + page">
										<span>{{ $t('leek') }}</span>
										<i v-if="order === 'name'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>
									<router-link :to="'/ranking/leek/page-' + page">
										<span>{{ $t('talent') }}</span>
										<i v-if="order === 'talent'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>
									<router-link :to="'/ranking/leek/level/page-' + page">
										<span>{{ $t('level') }}</span>
										<i v-if="order === 'level'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th class="column-farmer">{{ $t('farmer') }}</th>
								<th>{{ $t('country') }}</th>
								<th class="column-team">{{ $t('team') }}</th>
							</tr>
							<ranking-leek-row v-for="row in ranking" :key="row.id" :row="row" />
						</table>
						<table v-else-if="category == 'farmer'" class="ranking large">
							<tr class="header">
								<th class="ranking-column">{{ $t('place') }}</th>
								<th>
									<router-link :to="'/ranking/farmer/name/page-' + page">
										<span>{{ $t('farmer') }}</span>
										<i v-if="order === 'name'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>
									<router-link :to="'/ranking/farmer/talent/page-' + page">
										<span>{{ $t('talent') }}</span>
										<i v-if="order === 'talent'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>
									<router-link :to="'/ranking/farmer/total-level/page-' + page">
										<span>{{ $t('total_level') }}</span>
										<i v-if="order === 'total-level'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>{{ $t('leeks') }}</th>
								<th>{{ $t('country') }}</th>
								<th>{{ $t('team') }}</th>
							</tr>
							<ranking-farmer-row v-for="row in ranking" :key="row.id" :row="row" />
						</table>
						<table v-else class="ranking large">
							<tr class="header">
								<th class="ranking-column">{{ $t('place') }}</th>
								<th>
									<router-link :to="'/ranking/team/name/page-' + page">
										<span>{{ $t('leek') }}</span>
										<i v-if="order === 'name'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>
									<router-link :to="'/ranking/team/page-' + page">
										<span>{{ $t('talent') }}</span>
										<i v-if="order === 'talent'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>
									<router-link :to="'/ranking/team/level/page-' + page">
										<span>{{ $t('level') }}</span>
										<i v-if="order === 'level'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>
									<router-link :to="'/ranking/team/total-level/page-' + page">
										<span>{{ $t('total_level') }}</span>
										<i v-if="order === 'total-level'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>
									<router-link :to="'/ranking/team/farmers/page-' + page">
										<span>{{ $t('farmers') }}</span>
										<i v-if="order === 'farmers'" class="material-icons">expand_less</i>
									</router-link>
								</th>
								<th>
									<router-link :to="'/ranking/team/leeks/page-' + page">
										<span>{{ $t('leeks') }}</span>
										<i v-if="order === 'leeks'" class="material-icons">expand_less</i>
									</router-link>
								</th>
							</tr>
							<ranking-team-row v-for="row in ranking" :key="row.id" :row="row" />
						</table>
						<loader v-if="!ranking" />
					</div>
					<div class="center">
						<pagination :current="page" :total="pages" :url="'/ranking/' + category + '/' + order" />
					</div>
				</div>
			</div>
		</div>

		<v-dialog v-model="searchDialog" :max-width="500">
			<div class="title">{{ $t('search_in_ranking') }}</div>
			<div class="content">
				<input ref="search" :placeholder="$t('search_name')" v-model="searchQuery" class="query" type="text">
				<div class="flex">
					<v-checkbox :label="$t('leeks')" v-model="searchLeeks" hide-details />
					<v-checkbox :label="$t('farmers')" v-model="searchFarmers" hide-details />
					<v-checkbox :label="$t('teams')" v-model="searchTeams" hide-details />
				</div>
				<br>
				<loader v-if="!searchResults && searchQuery.length" />
				<h4 v-if="searchResults">{{ $t('results') }}</h4>
				<div v-if="searchResults && searchResults.length === 0" class="center">{{ $t('no_results') }}</div>
				<ranking-search-result v-for="result in searchResults" :key="result.id" :result="result" />
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import RankingFarmerRowElement from '@/component/ranking/ranking-farmer-row.vue'
	import RankingLeekRowElement from '@/component/ranking/ranking-leek-row.vue'
	import RankingSearchResult from '@/component/ranking/ranking-search-result.vue'
	import RankingTeamRowElement from '@/component/ranking/ranking-team-row.vue'
	import { LeekWars } from '@/model/leekwars'
	import { Ranking } from '@/model/ranking'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({
		name: 'ranking', i18n: {},
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

		@Watch('$route.params', {immediate: true})
		update() {
			this.category = 'category' in this.$route.params ? this.$route.params.category : 'leek'
			if (this.ranking) {
				this.ranking = null
			}
			if (this.category === 'fun') {
				this.rankings = null
				LeekWars.get<any>('ranking/fun/' + this.$store.state.token).then((data) => {
					for (const row of data.data.rankings) {
						row.ranking.ranking[0].style = 'first'
						row.ranking.ranking[1].style = 'second'
						row.ranking.ranking[2].style = 'third'
					}
					for (const category of data.data.rankings) {
						for (const row of category.ranking.ranking as Ranking) {
							if (row.id === this.$store.state.farmer.id) {
								row.me = 'me'
							}
						}
					}
					this.fun = true
					this.rankings = data.data.rankings
					this.ranking = []
					LeekWars.setTitle(this.$t('ranking.title'), this.$t('ranking.fun'))
					this.$root.$emit('loaded')
				})
			} else {
				this.order = 'order' in this.$route.params ? this.$route.params.order : 'talent'
				this.page = 'page' in this.$route.params ? parseInt(this.$route.params.page, 10) : 1

				LeekWars.get<any>('ranking/get/' + this.category + '/' + this.order + '/' + this.page).then((data) => {
					if (!data.data.success) {
						// LW.error()
						return
					}
					const ranking = data.data.ranking as Ranking
					if (this.page === 1) {
						ranking[0].style = 'first'
						ranking[1].style = 'second'
						ranking[2].style = 'third'
					}
					for (const row of ranking) {
						if (this.category === 'leek') {
							if (row.id in this.$store.state.farmer.leeks) {
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
					this.fun = false
					this.pages = data.data.pages
					this.ranking = ranking
					LeekWars.setActions([{icon: 'search', click: () => this.openSearch()}])
					LeekWars.setTitle(this.$t('ranking.title'), this.$t('ranking.n_' + this.category + 's', [data.data.total]))
					this.$root.$emit('loaded')
				})
			}
		}
		goToMyRanking(param: number = 0) {
			let url = ''
			if (this.category === 'leek') {
				url = 'ranking/get-leek-rank/' + param + '/' + this.order
			} else if (this.category === 'farmer') {
				url = 'ranking/get-farmer-rank/' + this.$store.state.farmer.id + '/' + this.order
			} else if (this.category === 'team' && this.$store.state.farmer.team !== null) {
				url = 'ranking/get-team-rank/' + this.$store.state.farmer.team.id + '/' + this.order
			}
			LeekWars.get<any>(url).then((data) => {
				if (data.data.success) {
					const page = 1 + Math.floor((data.data.rank - 1) / 50)
					this.$router.push('/ranking/' + this.category + '/' + this.order + '/page-' + page)
				}
			})
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
				LeekWars.post('ranking/search', {query: this.searchQuery, search_leeks: this.searchLeeks, search_farmers: this.searchFarmers, search_teams: this.searchTeams}).then((data) => {
					this.searchResults = data.data.results
				})
			}
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
		display: inline-block;
		.button {
			margin: 0 3px;
		}
	}
	.ranking.large {
		width: 100%;
	}
	h4 {
		text-align: left;
		margin: 8px 5px;
	}
	.ranking {
		/deep/ td {
			border-bottom: 1px solid #ddd;
			border-right: 1px solid #ddd;
			text-align: center;
			padding: 4px 7px;
			background: white;
		}
		/deep/ td:last-child {
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
		/deep/ .first a {
			color: #ffa900;
			font-weight: bold;
		}
		/deep/ .second a {
			color: #9c9c9c;
			font-weight: bold;
		}
		/deep/ .third a {
			color: #ae4e00;
			font-weight: bold;
		}
		tr.me {
			font-weight: bold;
			/deep/ td {
				background: #eee;
			}
		}
		/deep/ .country-wrapper {
			height: 20px;
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
		width: calc(100% - 15px);
		padding: 0 6px;
		height: 36px;
		margin-bottom: 15px;
	}
</style>