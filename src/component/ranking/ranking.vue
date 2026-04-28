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
							<template #activator="{ props }">
								<v-icon v-bind="props" @click.prevent="">mdi-chevron-down</v-icon>
							</template>
							<v-list>
								<router-link v-for="level of [50, 99, 150, 199, 250, 299]" :key="level" :to="getURL('level-' + level, order, country, LeekWars.rankingInactive)">
									<v-list-item v-ripple :title="$t('main.level_n', [level])" />
								</router-link>
							</v-list>
						</v-menu>
					</div>
				</router-link>
				<router-link :to="getURL('farmer', 'talent', country, LeekWars.rankingInactive)"><div class="tab" :class="{active: category === 'farmer'}">{{ $t('farmers') }}</div></router-link>
				<router-link :to="getURL(teamMode, 'talent', country, LeekWars.rankingInactive)"><div class="tab" :class="{active: category === 'team' || category === 'composition'}">{{ $t('teams') }}</div></router-link>

				<v-menu v-model="countryList" offset-y>
					<template #activator="{ props }">
						<div class="tab" v-bind="props" :class="{active: category.startsWith('country')}">
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
								{{ $t('main.worldwide') }}
							</v-list-item>
						</router-link>
						<router-link v-if="$store.state.farmer?.country" :to="getURL(category, order, $store.state.farmer.country, LeekWars.rankingInactive)">
							<v-list-item v-ripple>
								<flag :code="$store.state.farmer.country" :clickable="false" />
								{{ $t('country.' + $store.state.farmer.country) }}
							</v-list-item>
						</router-link>
						<router-link v-for="country in LeekWars.countries" :key="country" :to="getURL(category, order, country, LeekWars.rankingInactive)">
							<v-list-item v-ripple>
								<flag :code="country" :clickable="false" />
								{{ $t(`country.${country}`) }}
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
			<template #content>
				<div v-if="category === 'fun'" class="fun-rankings">
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
							<td>{{ Number(i) + 1 }}</td>
							<td :class="farmer.style">
								<router-link :to="'/farmer/' + farmer.id">
									<rich-tooltip-farmer :id="farmer.id" v-slot="{ props }">
										<span v-bind="props">{{ farmer.name }}</span>
									</rich-tooltip-farmer>
								</router-link>
							</td>
							<td v-if="funRanking.value_type == 'number'">{{ $filters.number(farmer.value) }}</td>
							<td v-else-if="funRanking.value_type == 'money'">{{ $filters.number(farmer.value) }} <span class="hab"></span></td>
							<td v-else-if="funRanking.value_type == 'distance'">{{ $filters.number(farmer.value) }}m</td>
						</tr>
						<tr v-if="$store.state.farmer && funRanking.ranking.farmer_rank > 10" class="me">
							<td>{{ funRanking.ranking.farmer_rank }}</td>
							<td>{{ $store.state.farmer.name }}</td>
							<td v-if="funRanking.value_type == 'number'">{{ $filters.number(funRanking.ranking.farmer_value) }}</td>
							<td v-if="funRanking.value_type == 'money'">{{ $filters.number(funRanking.ranking.farmer_value) }} <span class="hab"></span></td>
							<td v-if="funRanking.value_type == 'distance'">{{ $filters.number(funRanking.ranking.farmer_value) }}m</td>
						</tr>
					</table>
				</div>
			</div>
			<div v-else>
				<div class="pagination-buttons-filters">
					<pagination :current="page" :total="pages" :url="url" :url-query="urlQuery" />
					<div v-if="$store.state.farmer" class="me-buttons">
						<template v-if="category === 'leek'">
							<v-btn v-for="leek in $store.state.farmer.leeks" :key="leek.id" @click="LeekWars.goToRanking('leek', order, leek.id)">{{ leek.name }}</v-btn>
						</template>
						<v-btn v-else-if="category === 'farmer'" @click="LeekWars.goToRanking('farmer', order, $store.state.farmer.id)">{{ $t('my_farmer') }}</v-btn>
						<v-btn v-else-if="category === 'team' && $store.state.farmer.team" @click="LeekWars.goToRanking('team', order, $store.state.farmer.team.id)">{{ $t('my_team') }}</v-btn>
					</div>
					<v-switch v-model="activeSwitch" :label="$t('hide_inactives')" hide-details class="inactives" @change="toggleInactives" />
					<v-switch v-if="category === 'team' || category === 'composition'" v-model="compositionMode" :label="$t('compositions')" hide-details class="inactives" @change="toggleCompositionMode" />
				</div>
				<div class="scroll-x">
					<table v-if="displayCategory === 'leek'" class="ranking large">
						<tr class="header">
							<th class="ranking-column">{{ $t('place') }}</th>
							<th>
								<router-link :to="getURL(category, 'name', country, inactive)">
									<span>{{ $t('main.leek') }}</span>
									<v-icon v-if="order === 'name'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL(category, 'talent', country, inactive)">
									<span>{{ $t('main.talent') }}</span>
									<v-icon v-if="order === 'talent'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL(category, 'level', country, inactive)">
									<span>{{ $t('main.level') }}</span>
									<v-icon v-if="order === 'level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL(category, 'xp', country, inactive)">
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
					<table v-else-if="displayCategory === 'team'" class="ranking large">
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
					<table v-else-if="displayCategory === 'composition'" class="ranking large">
						<tr class="header">
							<th class="ranking-column">{{ $t('place') }}</th>
							<th>
								<router-link :to="getURL('composition', 'name', country, inactive)">
									<span>{{ $t('composition') }}</span>
									<v-icon v-if="order === 'name'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('composition', 'talent', country, inactive)">
									<span>{{ $t('main.talent') }}</span>
									<v-icon v-if="order === 'talent'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>{{ $t('main.team') }}</th>
							<th>
								<router-link :to="getURL('composition', 'total-level', country, inactive)">
									<span>{{ $t('total_level') }}</span>
									<v-icon v-if="order === 'total-level'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
							<th>
								<router-link :to="getURL('composition', 'leeks', country, inactive)">
									<span>{{ $t('leeks') }}</span>
									<v-icon v-if="order === 'leeks'">mdi-chevron-up</v-icon>
								</router-link>
							</th>
						</tr>
						<ranking-composition-row v-for="row in ranking" :key="row.id" :row="row" :class="{highlight: searchResult == row.rank}" />
					</table>
					<loader v-if="!ranking" />
				</div>
				<div class="pagination-buttons-filters">
					<pagination :current="page" :total="pages" :url="url" :url-query="urlQuery" />
				</div>
			</div>
			</template>
		</panel>

		<popup v-model="searchDialog" :width="500" icon="mdi-magnify" :title="$t('search_in_ranking')">
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

<script setup lang="ts">
	import RankingFarmerRowElement from '@/component/ranking/ranking-farmer-row.vue'
	import RankingLeekRowElement from '@/component/ranking/ranking-leek-row.vue'
	import RankingSearchResult from '@/component/ranking/ranking-search-result.vue'
	import RankingTeamRowElement from '@/component/ranking/ranking-team-row.vue'
	import RankingCompositionRowElement from '@/component/ranking/ranking-composition-row.vue'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Ranking, RankingRow } from '@/model/ranking'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import Pagination from '@/component/pagination.vue'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'
	import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'

	defineOptions({
		name: 'ranking', i18n: {}, mixins: [...mixins],
		components: { 'ranking-leek-row': RankingLeekRowElement, 'ranking-farmer-row': RankingFarmerRowElement, 'ranking-team-row': RankingTeamRowElement, 'ranking-composition-row': RankingCompositionRowElement, 'ranking-search-result': RankingSearchResult, RichTooltipFarmer, Pagination }
	})

	const { t } = useI18n()
	const route = useRoute()
	const router = useRouter()
	const searchInput = useTemplateRef<HTMLElement>('search')

	const fun = ref(false)
	const rankings = ref<any>(null)
	const page = ref(0)
	const pages = ref(0)
	const category = ref('')
	const ranking = ref<Ranking | null>(null)
	const order = ref('')
	const searchDialog = ref(false)
	const searchLeeks = ref(true)
	const searchFarmers = ref(true)
	const searchTeams = ref(true)
	const searchQuery = ref('')
	const searchResults = ref<any[] | null>(null)
	const activeSwitch = ref(false)
	const compositionMode = ref(localStorage.getItem('ranking/team-mode') === 'composition')
	const countryList = ref(false)
	const displayCategory = ref('')

	const teamMode = computed(() => compositionMode.value ? 'composition' : 'team')

	const url = computed(() => getURLBase(category.value, order.value))
	const urlQuery = computed(() => getURLQuery(country.value, LeekWars.rankingInactive))
	const searchResult = computed(() => parseInt(route.hash.replace('#rank-', ''), 10))
	const rankingLevel = computed(() => category.value && category.value.startsWith('level-') ? parseInt(category.value.substring(6)) : parseInt(localStorage.getItem('ranking/level') || '50'))
	const country = computed<string | null>(() => {
		if (!route.query.country) { return null }
		return '' + route.query.country
	})
	const inactive = computed(() => {
		if (route.query.inactive !== undefined) { return true }
		return LeekWars.rankingInactive
	})

	watch(() => route.params, () => {
		category.value = 'category' in route.params ? route.params.category as string : 'leek'
		displayCategory.value = category.value
		if (category.value.startsWith('level-')) {
			displayCategory.value = 'leek'
			localStorage.setItem('ranking/level', '' + rankingLevel.value)
		}
		if (category.value === 'team' || category.value === 'composition') {
			compositionMode.value = category.value === 'composition'
		}

		activeSwitch.value = !inactive.value
		if (category.value !== 'fun') {
			order.value = 'order' in route.params ? route.params.order as string : 'talent'
			page.value = 'page' in route.params ? parseInt(route.params.page as string, 10) : 1
		}
	}, { immediate: true })

	const key = computed(() => {
		if (category.value === 'fun') return 'fun'
		return inactive.value + '/' + category.value + '/' + order.value + '/' + page.value + '/' + country.value
	})

	watch(key, () => {
		if (category.value === 'fun') {
			rankings.value = null
			LeekWars.get('ranking/fun').then(data => {
				for (const row of data.rankings) {
					row.ranking.ranking[0].style = 'first'
					row.ranking.ranking[1].style = 'second'
					row.ranking.ranking[2].style = 'third'
				}
				if (store.state.farmer) {
					for (const cat of data.rankings) {
						for (const row of cat.ranking.ranking as Ranking) {
							if (row.id === store.state.farmer.id) {
								row.me = 'me'
							}
						}
					}
				}
				fun.value = true
				rankings.value = data.rankings
				ranking.value = []
				LeekWars.setTitle(t('title'), t('fun'))
				emitter.emit('loaded')
			})
		} else {
			ranking.value = null
			const service = inactive.value ? 'get' : 'get-active'
			LeekWars.get('ranking/' + service + '/' + category.value + '/' + order.value + '/' + page.value + '/' + country.value).then(data => {
				const r = data.ranking as Ranking
				if (page.value === 1) {
					if (r.length > 0) {
						r[0].style = 'first'
					}
					if (r.length > 1) {
						r[1].style = 'second'
					}
					if (r.length > 2) {
						r[2].style = 'third'
					}
				}
				if (store.state.farmer) {
					for (const row of r) {
						if (category.value === 'leek' || category.value.includes('level-')) {
							if (store.state.farmer && row.id in store.state.farmer.leeks) {
								row.me = 'me'
							}
						} else if (category.value === 'farmer') {
							if (row.id === store.state.farmer.id) {
								row.me = 'me'
							}
						} else if (category.value === 'team') {
							if (store.state.farmer.team && row.id === store.state.farmer.team.id) {
								row.me = 'me'
							}
						} else if (category.value === 'composition') {
							if (store.state.farmer.team && (row as RankingRow & {team_id: number}).team_id === store.state.farmer.team.id) {
								row.me = 'me'
							}
						}
					}
				}
				fun.value = false
				pages.value = data.pages
				ranking.value = r
				LeekWars.setActions([{icon: 'mdi-magnify', click: () => openSearch()}])
				const subtitle = category.value.includes('level') ? t('main.level_n', [rankingLevel.value]) : t('main.n_' + category.value + 's', [data.total])
				LeekWars.setTitle(t('title'), subtitle)
				emitter.emit('loaded')
				if (searchResult.value) {
					nextTick(() => {
						const row = document.querySelector('tr.highlight')
						if (row) { row.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
					})
				}
			})
		}
	}, { immediate: true })

	function goToResult(event: any) {
		searchDialog.value = false
		LeekWars.goToRanking(event.type, 'talent', event.id)
	}

	function openSearch() {
		searchDialog.value = true
		searchQuery.value = ''
		setTimeout(() => searchInput.value?.focus())
	}

	watch([searchQuery, searchLeeks, searchFarmers, searchTeams], () => {
		searchResults.value = null
		if (!searchQuery.value.length) {
			searchResults.value = []
		} else {
			LeekWars.post('ranking/search', {query: searchQuery.value.trim(), search_leeks: searchLeeks.value, search_farmers: searchFarmers.value, search_teams: searchTeams.value}).then(data => {
				searchResults.value = data.results
			})
		}
	})

	function toggleInactives() {
		LeekWars.rankingInactive = !activeSwitch.value
		localStorage.setItem('options/ranking-inactive', '' + LeekWars.rankingInactive)
		router.push(url.value + urlQuery.value)
	}

	function toggleCompositionMode() {
		const mode = compositionMode.value ? 'composition' : 'team'
		localStorage.setItem('ranking/team-mode', mode)
		router.push(getURL(mode, 'talent', country.value, inactive.value))
	}

	watch(countryList, () => {
		if (countryList.value) {
			LeekWars.loadCountries()
		}
	})

	function getURL(cat: string, ord: string, c: string | null, i: boolean) {
		return getURLBase(cat, ord) + getURLQuery(c, i)
	}

	function getURLBase(cat: string, ord: string) {
		return '/ranking' + (cat !== 'leek' || ord !== 'talent' ? '/' + cat : '') + (ord !== 'talent' ? '/' + ord : '')
	}

	function getURLQuery(c: string | null, i: boolean) {
		const query = []
		if (c) query.push('country=' + c)
		if (i) query.push('inactive')
		return (query.length ? '?' + query.join('&') : '')
	}
</script>

<style lang="scss" scoped>
	.pagination-buttons-filters {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		padding: 15px 0;
		gap: 10px 20px;
	}
	.tab button {
		margin-right: -6px;
	}
	.panel .content {
		padding: 0
	}
	.me-buttons {
		display: inline-flex;
		.button {
			margin: 0 3px;
		}
	}
	.inactives {
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
		background: var(--pure-white);
		:deep(td) {
			border-bottom: 1px solid var(--border);
			border-right: 1px solid var(--border);
			text-align: center;
			padding: 5px 7px;
			white-space: nowrap;
		}
		:deep(td:last-child) {
			border-right: none;
		}
		tr.header {
			background: var(--background-header);
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
			font-size: 16px;
			border-bottom: 1px solid var(--border);
			border-right: 1px solid var(--border);
		}
		th:last-child {
			border-right: none;
		}
		:deep(.first a) {
			color: #ffa900;
			font-weight: bold;
		}
		:deep(.second a) {
			color: #9c9c9c;
			font-weight: bold;
		}
		:deep(.third a) {
			color: #ae4e00;
			font-weight: bold;
		}
		tr.me {
			font-weight: bold;
			:deep(td) {
				background: var(--background);
			}
		}
		tr.highlight {
			:deep(td) {
				background: rgba(100, 255, 0, 0.4);
			}
		}
		tr.inactive {
			:deep(td), :deep(a) {
				color: #777;
				font-style: italic;
			}
		}
		:deep(.country-wrapper) {
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
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 15px;
		text-align: center;
		margin: 15px;
		h2 {
			text-align: left;
		}
		.fun-ranking {
			min-width: 0;
		}
		table {
			width: 100%;
		}
		.ranking tr td:first-child {
			width: 45px;
		}
		.ranking tr td:nth-child(2) {
			width: 100%;
			max-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.ranking tr td:last-child, .ranking tr th:last-child {
			min-width: 120px;
		}
	}
	#app.app .fun-rankings {
		grid-template-columns: 1fr;
		table {
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
