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
						<!-- Le portrait à 0,8 mange 200 px de haut sur un téléphone, où
						     l'écran entier tenait déjà dans l'en-tête de la page. -->
						<leek-image :leek="entity" :scale="LeekWars.mobile ? 0.45 : 0.8" />
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

				<history-filters v-model="filters" :show-types="type !== 'team'" class="history-options" />

				<fights-history-table v-if="viewMode === 'table'" :fights="filteredFights" :progress="progress" />
				<fights-history v-else :fights="filteredFights" :progress="progress" />
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Farmer } from '@/model/farmer'
import type { Fight } from '@/model/fight'
import { mixins , useNamespacedT } from '@/model/i18n'
import type { Leek } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import { useLiveHistory } from '@/model/use-live-history'
import Breadcrumb from '../forum/breadcrumb.vue'
import FightsHistory from '@/component/history/fights-history.vue'
import FightsHistoryTable from '@/component/history/fights-history-table.vue'
import HistoryFilters from '@/component/history/history-filters.vue'
import {
	type FightFilters, type HistoryFilterGroup, fightMatchesFilters, sanitizeGroup,
} from '@/component/history/history-filters'

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
const opponentSearch = ref('')
const viewMode = ref<'grid' | 'table'>((localStorage.getItem('options/history-view') as 'grid' | 'table') || 'grid')

// Un groupe de filtres par clé de localStorage : les réglages enregistrés avant
// le regroupement restent lus tels quels.
const FILTER_STORAGE: Record<HistoryFilterGroup, string> = {
	contexts: 'options/history-contexts',
	types: 'options/history-types',
	loot: 'options/history-loot',
	results: 'options/history-results',
}
function storedGroup(group: HistoryFilterGroup): Record<string, boolean> {
	const stored = localStorage.getItem(FILTER_STORAGE[group])
	return sanitizeGroup(group, JSON.parse(stored || '{}'))
}
const filters = ref<FightFilters>({
	contexts: storedGroup('contexts'),
	types: storedGroup('types'),
	loot: storedGroup('loot'),
	results: storedGroup('results'),
})

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

const filteredFights = computed(() => {
	const query = opponentSearch.value.trim().toLowerCase()
	return fights.value.filter(fight => fight.date >= start_date.value
		&& fightMatchesFilters(fight, filters.value, props.type === 'team')
		&& (!query || fightSearchText(fight).includes(query)))
})

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

for (const group of Object.keys(FILTER_STORAGE) as HistoryFilterGroup[]) {
	watch(() => filters.value[group], value => {
		localStorage.setItem(FILTER_STORAGE[group], JSON.stringify(value))
	})
}
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
	// v3 : le sélecteur de période au style des actions du thème — bordé,
	// police d'affichage, survol discret sur la surface de ligne, pixel push au
	// clic, et l'actif en aplat vert comme la page courante de la pagination.
	body:not(.v2) .period {
		font-family: var(--font-display);
		letter-spacing: var(--font-display-tracking);
		font-weight: var(--font-display-weight);
		font-size: 12px;
		text-transform: uppercase;
		padding: 9px 10px;
		border: 1px solid var(--border-strong);
		background: var(--background-input);
		color: var(--text-color);
	}
	body:not(.v2) .period:hover {
		background: var(--background-row);
	}
	body:not(.v2) .period:active {
		transform: translate(1px, 1px);
	}
	body:not(.v2) .period.selected {
		background: var(--primary-surface);
		border-color: var(--primary);
		color: var(--primary-surface-text);
		font-weight: normal;
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
	/* Le portrait commençait au ras des boutons de période : le bloc du haut
	   n'a pas de marge et l'image n'a que son rembourrage de 10 px, mangé par
	   le hors-champ du dessin. */
	.periods {
		margin-bottom: 16px;
	}
	/* Le sélecteur de vue est un `v-btn-toggle` Vuetify laissé tel quel : deux
	   boutons « elevated » à fond BLANC PUR posés sur le parchemin, ombre
	   comprise. Il reprend le vocabulaire du v3 : un cadre, pas de fond, et
	   l'actif en aplat vert pâle sur encre verte, comme l'entrée de menu
	   courante et les pastilles de mode d'arène. */
	body:not(.v2) .view-toggle {
		height: 30px;
		border: 1px solid var(--border-strong);
		background: transparent;
		:deep(.v-btn) {
			background: transparent;
			box-shadow: none;
			border-radius: 0;
			min-width: 36px;
			color: var(--text-color-secondary);
			/* Vuetify peint survol et état actif dans un calque posé par-dessus
			   le fond ; sans ça il grise l'aplat vert. */
			.v-btn__overlay {
				display: none;
			}
			&:hover {
				background: var(--background-row);
				color: var(--text-color);
			}
			&.v-btn--active {
				background: color-mix(in srgb, var(--primary) 12%, transparent);
				color: var(--primary);
			}
		}
		:deep(.v-btn + .v-btn) {
			border-left: 1px solid var(--border-strong);
		}
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
	/* Les pastilles et leur mise en page vivent dans history-filters.vue : seule
	   la place du bloc dans la page se règle ici. */
	.history-options {
		margin: 14px 10px;
	}

	/* ====== Mobile : la page tenait entièrement au-dessus de la liste ======
	 *
	  * Sur un écran de 412 × 915, 894 px d'en-tête : pas un seul combat visible
	  * à l'arrivée. Périodes 76, portrait et bilan 229, barre de recherche 42,
	  * filtres 380.
	 *
	 * Rien n'est masqué — tous les filtres restent atteignables — mais chaque
	 * bloc reprend la place qu'il vaut sur un téléphone. */
	#app.app {
		/* Quatre périodes de 150 px de large : deux par ligne. Elles se
		   partagent la ligne à parts égales, comme les catégories du potager. */
		.periods {
			display: flex;
			gap: 4px;
			padding: 0 8px;
		}
		.period {
			width: auto;
			flex: 1 1 0;
			min-width: 0;
			margin: 0;
			padding: 8px 2px;
			font-size: 11px;
		}
		.image {
			padding: 0;
		}
		.stats table {
			margin: 6px auto;
		}
		.stats td {
			padding: 0 10px;
		}
		/* Le champ de recherche passait à 200 px entre le compteur et le
		   sélecteur de vue : trois éléments serrés sur une ligne de 412. Il
		   prend sa propre ligne, pleine largeur. */
		.header-row {
			flex-wrap: wrap;
			padding: 0 8px;
		}
		.opponent-search {
			order: 3;
			flex: 1 0 100%;
			margin: 8px 0 0;
		}
		/* Les filtres passent leurs intitulés au-dessus des pastilles d'eux-mêmes
		   (history-filters.vue) ; le bloc se rapproche seulement des bords. */
		.history-options {
			margin: 12px 8px;
		}
	}
</style>
