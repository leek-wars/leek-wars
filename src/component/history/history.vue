<template lang="html">
	<div class="page">
		<div class="page-bar">
			<h1>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
			</h1>
		</div>
		<panel class="first">

			<div class="summary">
				<div class="periods">
					<div v-ripple :class="{selected: period === 'today'}" class="period card" @click="select_period('today')">{{ $t('today') }}</div>
					<div v-ripple :class="{selected: period === '24h'}" class="period card" @click="select_period('24h')">{{ $t('24h') }}</div>
					<div v-ripple :class="{selected: period === '2days'}" class="period card" @click="select_period('2days')">{{ $t('2days') }}</div>
					<div v-ripple :class="{selected: period === '1week'}" class="period card" @click="select_period('1week')">{{ $t('1week') }}</div>
				</div>
			</div>

			<loader v-if="!entity" />
			<div v-else>
				<div class="summary">

					<div v-if="type === 'farmer'" class="image">
						<avatar :farmer="entity" />
					</div>
					<div v-if="type === 'leek'" class="image">
						<leek-image :leek="entity" :scale="0.8" />
					</div>
					<div v-if="type === 'team'" class="image">
						<emblem :team="entity" />
					</div>

					<div class="stats">
						<div class="center">
							<talent :id="entity.id" :talent="entity.talent" :category="type" />
							<div v-if="type === 'leek' || type === 'farmer'" class="talent-more">
								({{ entity.talent_more >= 0 ? '+' + entity.talent_more : entity.talent_more }})
							</div>
						</div>
						<table>
							<tr>
								<td class="big">{{ victories }}</td>
								<td class="big">{{ draws }}</td>
								<td class="big">{{ defeats }}</td>
								<td class="big">{{ ratio }}</td>
							</tr>
							<tr>
								<td class="grey">{{ $t('victories') }}</td>
								<td class="grey">{{ $t('draws') }}</td>
								<td class="grey">{{ $t('defeats') }}</td>
								<td class="grey">{{ $t('ratio') }}</td>
							</tr>
						</table>
					</div>
				</div>
				<br>
				<div class="header-row">
					<div class="n-fights">{{ $t('n_fights', [filteredFights.length]) }}</div>
					<input v-model="opponentSearch" type="text" class="opponent-search card" :placeholder="$t('main.search')">
					<v-btn-toggle v-model="viewMode" mandatory density="compact" class="view-toggle">
						<v-btn value="grid" size="small" :title="$t('view_grid')">
							<v-icon>mdi-view-grid</v-icon>
						</v-btn>
						<v-btn value="table" size="small" :title="$t('view_table')">
							<v-icon>mdi-table</v-icon>
						</v-btn>
					</v-btn-toggle>
				</div>

				<div class="history-options">
					<div class="filter-row">
						<span class="filter-label">{{ $t('fight_context') }}</span>
						<div class="chips">
							<div class="chip all" :class="{ on: allContexts, indet: indetContexts }" @click="allContexts = !allContexts">{{ $t('main.all') }}</div>
							<span class="sep"></span>
							<div class="chip" :class="{ on: displayContexts.challenge }" @click="displayContexts.challenge = !displayContexts.challenge"><span class="dot"></span>{{ $t('challenge') }}</div>
							<div class="chip" :class="{ on: displayContexts.garden }" @click="displayContexts.garden = !displayContexts.garden"><span class="dot"></span>{{ $t('garden') }}</div>
							<div class="chip" :class="{ on: displayContexts.tournament }" @click="displayContexts.tournament = !displayContexts.tournament"><span class="dot"></span>{{ $t('tournament') }}</div>
						</div>
					</div>
					<div v-if="type !== 'team'" class="filter-row">
						<span class="filter-label">{{ $t('fight_type') }}</span>
						<div class="chips">
							<div class="chip all" :class="{ on: allTypes, indet: indetTypes }" @click="allTypes = !allTypes">{{ $t('main.all') }}</div>
							<span class="sep"></span>
							<div class="chip" :class="{ on: displayTypes.solo }" @click="displayTypes.solo = !displayTypes.solo"><span class="dot"></span>{{ $t('solo') }}</div>
							<div class="chip" :class="{ on: displayTypes.farmer }" @click="displayTypes.farmer = !displayTypes.farmer"><span class="dot"></span>{{ $t('farmer') }}</div>
							<div class="chip" :class="{ on: displayTypes.team }" @click="displayTypes.team = !displayTypes.team"><span class="dot"></span>{{ $t('team') }}</div>
							<div class="chip" :class="{ on: displayTypes.battleRoyale }" @click="displayTypes.battleRoyale = !displayTypes.battleRoyale"><span class="dot"></span>{{ $t('battle_royale') }}</div>
							<div class="chip" :class="{ on: displayTypes.war }" @click="displayTypes.war = !displayTypes.war"><span class="dot"></span>{{ $t('war') }}</div>
							<div class="chip" :class="{ on: displayTypes.chestHunt }" @click="displayTypes.chestHunt = !displayTypes.chestHunt"><span class="dot"></span>{{ $t('chest_hunt') }}</div>
							<div class="chip" :class="{ on: displayTypes.colossus }" @click="displayTypes.colossus = !displayTypes.colossus"><span class="dot"></span>{{ $t('colossus') }}</div>
							<div class="chip" :class="{ on: displayTypes.boss }" @click="displayTypes.boss = !displayTypes.boss"><span class="dot"></span>{{ $t('boss') }}</div>
						</div>
					</div>
					<div class="filter-row">
						<span class="filter-label">{{ $t('loot') }}</span>
						<div class="chips">
							<div class="chip all" :class="{ on: allLoot, indet: indetLoot }" @click="allLoot = !allLoot">{{ $t('main.all') }}</div>
							<span class="sep"></span>
							<div class="chip" :class="{ on: displayLoot.chests }" @click="displayLoot.chests = !displayLoot.chests"><span class="dot"></span>{{ $t('chests') }}</div>
							<div class="chip" :class="{ on: displayLoot.rareloot }" @click="displayLoot.rareloot = !displayLoot.rareloot"><span class="dot"></span>{{ $t('rare_loot') }}</div>
						</div>
					</div>
					<div class="filter-row">
						<span class="filter-label">{{ $t('result') }}</span>
						<div class="chips">
							<div class="chip all" :class="{ on: allResults, indet: indetResults }" @click="allResults = !allResults">{{ $t('main.all') }}</div>
							<span class="sep"></span>
							<div class="chip res-win" :class="{ on: displayResults.win }" @click="displayResults.win = !displayResults.win"><span class="dot"></span>{{ $t('victories') }}</div>
							<div class="chip res-draw" :class="{ on: displayResults.draw }" @click="displayResults.draw = !displayResults.draw"><span class="dot"></span>{{ $t('draws') }}</div>
							<div class="chip res-defeat" :class="{ on: displayResults.defeat }" @click="displayResults.defeat = !displayResults.defeat"><span class="dot"></span>{{ $t('defeats') }}</div>
							<div class="chip res-generating" :class="{ on: displayResults.generating }" @click="displayResults.generating = !displayResults.generating"><span class="dot"></span>{{ $t('generating') }}</div>
						</div>
					</div>
				</div>

				<fights-history-table v-if="viewMode === 'table'" :fights="filteredFights" :progress="progress" />
				<fights-history v-else :fights="filteredFights" :progress="progress" />
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import type { Farmer } from '@/model/farmer'
import { type Fight, FightContext, FightType } from '@/model/fight'
import { mixins , useNamespacedT } from '@/model/i18n'
import type { Leek } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import { useLiveHistory } from '@/model/use-live-history'
import Breadcrumb from '../forum/breadcrumb.vue'
import FightsHistory from '@/component/history/fights-history.vue'
import FightsHistoryTable from '@/component/history/fights-history-table.vue'

defineOptions({ name: 'History', i18n: {}, mixins: [...mixins] })

const props = defineProps<{
	type: string
}>()

const t = useNamespacedT('history')
const route = useRoute()

const fights = ref<Fight[]>([])
const entity = ref<Farmer | Leek | null>(null)
const period = ref<string>('today')
const start_date = ref(0)
const displayContexts = ref<Record<string, boolean>>({ challenge: true, garden: true, tournament: true })
const displayTypes = ref<Record<string, boolean>>({ solo: true, farmer: true, team: true, battleRoyale: true, war: true, chestHunt: true, colossus: true, boss: true })
const displayLoot = ref<Record<string, boolean>>({ chests: false, rareloot: false })
const displayResults = ref<Record<string, boolean>>({ win: true, draw: true, defeat: true, generating: true })
const opponentSearch = ref('')
const viewMode = ref<'grid' | 'table'>((localStorage.getItem('options/history-view') as 'grid' | 'table') || 'grid')

// Case à cocher "Tous" par ligne de filtres : cochée quand toutes les options de la
// ligne le sont, indéterminée si partiellement cochée. Cliquer (re)coche toute la ligne.
function allModel(obj: Ref<Record<string, boolean>>, keys: string[]) {
	return computed<boolean>({
		get: () => keys.every(k => obj.value[k]),
		set: (v: boolean) => keys.forEach(k => { obj.value[k] = v }),
	})
}
function someModel(obj: Ref<Record<string, boolean>>, keys: string[]) {
	return computed(() => keys.some(k => obj.value[k]) && !keys.every(k => obj.value[k]))
}
const allContexts = allModel(displayContexts, ['challenge', 'garden', 'tournament'])
const indetContexts = someModel(displayContexts, ['challenge', 'garden', 'tournament'])
const allTypes = allModel(displayTypes, ['solo', 'farmer', 'team', 'battleRoyale', 'war', 'chestHunt', 'colossus', 'boss'])
const indetTypes = someModel(displayTypes, ['solo', 'farmer', 'team', 'battleRoyale', 'war', 'chestHunt', 'colossus', 'boss'])
const allLoot = allModel(displayLoot, ['chests', 'rareloot'])
const indetLoot = someModel(displayLoot, ['chests', 'rareloot'])
const allResults = allModel(displayResults, ['win', 'draw', 'defeat', 'generating'])
const indetResults = someModel(displayResults, ['win', 'draw', 'defeat', 'generating'])

// Texte recherchable d'un combat : noms de tous les participants (poireaux, équipes,
// éleveurs, boss), pour filtrer par adversaire (#4314).
function fightSearchText(fight: Fight): string {
	const names: string[] = []
	for (const l of fight.leeks1 || []) { if (l?.name) { names.push(l.name) } }
	for (const l of fight.leeks2 || []) { if (l?.name) { names.push(l.name) } }
	if (fight.team1_name) { names.push(fight.team1_name) }
	if (fight.team2_name) { names.push(fight.team2_name) }
	if (fight.farmer1_name) { names.push(fight.farmer1_name) }
	if (fight.farmer2_name) { names.push(fight.farmer2_name) }
	if (fight.boss_name) { names.push(fight.boss_name) }
	return names.join(' ').toLowerCase()
}
let destroyed = false

const breadcrumb_items = computed(() => [
	{ name: entity.value ? entity.value.name : '...', link: '/' + props.type + '/' + (entity.value ? entity.value.id : '') },
	{ name: t('title_html', [entity.value ? entity.value.name : '...']), link: '/' + props.type + '/' + (entity.value ? entity.value.id : '') + '/history' }
])

const filteredFights = computed(() => fights.value.filter((fight) => {
	const contextFilter = fight.date >= start_date.value && (
		(displayContexts.value.challenge && fight.context === FightContext.CHALLENGE) ||
		(displayContexts.value.garden && fight.context === FightContext.GARDEN) ||
		(displayContexts.value.tournament && fight.context === FightContext.TOURNAMENT) ||
		(displayContexts.value.garden && displayTypes.value.battleRoyale && fight.context === FightContext.BATTLE_ROYALE)
	)

	const typeFilter = (
		(displayTypes.value.solo && fight.type === FightType.SOLO) ||
		(displayTypes.value.farmer && fight.type === FightType.FARMER) ||
		(displayTypes.value.team && fight.type === FightType.TEAM) ||
		(displayTypes.value.battleRoyale && fight.type === FightType.BATTLE_ROYALE) ||
		(displayTypes.value.war && fight.type === FightType.WAR) ||
		(displayTypes.value.chestHunt && fight.type === FightType.CHEST_HUNT) ||
		(displayTypes.value.colossus && fight.type === FightType.COLOSSUS) ||
		(displayTypes.value.boss && fight.type === FightType.BOSS) ||
		props.type === 'team'
	)

	const lootFilter = !displayLoot.value.chests && !displayLoot.value.rareloot
		|| (displayLoot.value.chests && fight.chests > 0)
		|| (displayLoot.value.rareloot && fight.rareloot > 0)

	const resultFilter = (displayResults.value.win && fight.result === 'win')
		|| (displayResults.value.draw && fight.result === 'draw')
		|| (displayResults.value.defeat && fight.result === 'defeat')
		|| (displayResults.value.generating && fight.status == 0)

	const query = opponentSearch.value.trim().toLowerCase()
	const opponentFilter = !query || fightSearchText(fight).includes(query)

	return contextFilter && typeFilter && lootFilter && resultFilter && opponentFilter
}))

const victories = computed(() => filteredFights.value.filter(f => f.result === 'win').length)
const defeats = computed(() => filteredFights.value.filter(f => f.result === 'defeat').length)
const draws = computed(() => filteredFights.value.filter(f => f.result === 'draw').length)
const ratio = computed(() => defeats.value === 0 ? '∞' : LeekWars.numberPrecision(victories.value / defeats.value, 3))

function select_period(p: string) {
	period.value = p
	const now = Date.now() / 1000
	const midnight = new Date()
	midnight.setHours(0, 0, 0, 0)
	const day = 24 * 3600
	start_date.value = (() => {
		if (p === '24h') return now - day
		if (p === 'today') return midnight.getTime() / 1000
		if (p === '2days') return now - 2 * day
		return now - 7 * day
	})()
	localStorage.setItem('options/history-period', p)
}

const id = route.params.id
const initialPeriod = localStorage.getItem('options/history-period') || '1week'
displayContexts.value = JSON.parse(localStorage.getItem('options/history-contexts') || '{"challenge": true, "garden": true, "tournament": true }')
displayTypes.value = JSON.parse(localStorage.getItem('options/history-types') || '{"solo": true, "farmer": true, "team": true, "battleRoyale": true, "boss": true }')
displayLoot.value = JSON.parse(localStorage.getItem('options/history-loot') || '{"chests":false,"rareloot":false}')
displayResults.value = JSON.parse(localStorage.getItem('options/history-results') || '{"win":true,"draw":true,"defeat":true,"generating":true}')
select_period(initialPeriod)

function loadHistory() {
	LeekWars.get('history/get-' + props.type + '-history/' + id).then(data => {
		if (destroyed) return
		fights.value = data.fights
		entity.value = data.entity
		LeekWars.setTitle(t('title', [data.entity.name]))
		select_period(period.value)
	})
}

// Abonnement par entité + progression en direct + reload débouncé (cf. composable).
const { progress } = useLiveHistory({
	type: props.type,
	id: () => Number(id),
	fights: () => fights.value,
	reload: loadHistory,
})

loadHistory()

onUnmounted(() => { destroyed = true })

watch(displayContexts, () => {
	localStorage.setItem('options/history-contexts', JSON.stringify(displayContexts.value))
}, { deep: true })
watch(displayTypes, () => {
	localStorage.setItem('options/history-types', JSON.stringify(displayTypes.value))
}, { deep: true })
watch(displayLoot, () => {
	localStorage.setItem('options/history-loot', JSON.stringify(displayLoot.value))
}, { deep: true })
watch(displayResults, () => {
	localStorage.setItem('options/history-results', JSON.stringify(displayResults.value))
}, { deep: true })
watch(viewMode, () => {
	localStorage.setItem('options/history-view', viewMode.value)
})
</script>

<style lang="scss" scoped>
	.summary {
		position: relative;
		text-align: center;
	}
	.image {
		display: inline-block;
		padding: 10px;
	}
	.periods {
		user-select: none;
		vertical-align: top;
	}
	.period {
		display: inline-block;
		padding: 10px;
		cursor: pointer;
		font-size: 16px;
		width: 150px;
		text-align: center;
		margin: 2px;
	}
	.period:hover {
		background: var(--background-header);
	}
	.period.selected {
		background: var(--background-header);
		font-weight: bold;
	}
	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 10px;
	}
	.n-fights {
		font-size: 18px;
		font-weight: bold;
		color: var(--text-color-secondary);
	}
	.view-toggle {
		flex: none;
	}
	.opponent-search {
		height: 32px;
		padding: 0 10px;
		flex: 0 1 200px;
		margin: 0 10px;
		min-width: 0;
	}
	.stats {
		display: inline-block;
		vertical-align: top;
		text-align: center;
		width: 100%;
	}
	.stats table {
		margin: 10px auto;
	}
	.talent-more {
		display: inline-block;
		font-weight: 300;
		font-size: 20px;
		margin-left: 5px;
		margin-top: 6px;
		vertical-align: top;
		color: var(--text-color-secondary);
	}
	.stats tr > td:nth-child(n+2) {
		border-left: 2px solid var(--border);
	}
	.stats td {
		padding: 0px 15px;
	}
	.stats .big {
		font-size: 22px;
		font-weight: 300;
		color: var(--text-color-secondary);
	}
	.history {
		text-align: center;
	}
	.grey {
		color: var(--text-color-secondary);
	}
	.history-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 14px 10px;
	}
	.filter-row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}
	.filter-label {
		flex: 0 0 130px;
		text-align: right;
		padding-top: 7px;
		font-size: 12px;
		font-weight: 500;
		line-height: 1.3;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		color: var(--text-color-secondary);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 7px;
	}
	.chip {
		--c: var(--primary);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 13px;
		border-radius: 15px;
		font-size: 13px;
		line-height: 1;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		color: var(--text-color-secondary);
		background: var(--background-secondary);
		border: 1px solid var(--border);
		transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
	}
	.chip:hover {
		color: var(--text-color);
		background: var(--background-header);
	}
	.chip.on {
		color: var(--c);
		background: color-mix(in srgb, var(--c) 15%, transparent);
		border-color: color-mix(in srgb, var(--c) 50%, transparent);
		font-weight: 600;
	}
	.chip.on:hover {
		color: var(--c);
		background: color-mix(in srgb, var(--c) 24%, transparent);
	}
	.chip .dot {
		flex: none;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.35;
	}
	.chip.on .dot {
		opacity: 1;
	}
	.chip.all {
		font-weight: 700;
		padding-left: 15px;
		padding-right: 15px;
	}
	.chip.all.indet {
		color: var(--c);
		background: transparent;
		border-style: dashed;
		border-color: color-mix(in srgb, var(--c) 50%, transparent);
	}
	.sep {
		align-self: stretch;
		width: 1px;
		margin: 2px 4px;
		background: var(--border);
	}
	body.dark .chip { --c: #7ec93f; }
	.res-win { --c: #5fad1b; }
	.res-draw { --c: #8a8a8a; }
	.res-defeat { --c: #d3382f; }
	.res-generating { --c: #3f86d6; }
	body.dark .res-win { --c: #7ec93f; }
	body.dark .res-draw { --c: #a6a6a6; }
	body.dark .res-defeat { --c: #e07a72; }
	body.dark .res-generating { --c: #6ba8e6; }
</style>
