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
				<div class="n-fights">{{ $t('n_fights', [filteredFights.length]) }}</div>

				<div class="history-options">
					<div class="fight-context">
						<span class="category">
							{{ $t('fight_context') }}
						</span>
						<v-checkbox v-model="displayContexts.challenge" hide-details class="option-checkbox" :label="$t('challenge')" />
						<v-checkbox v-model="displayContexts.garden" hide-details class="option-checkbox" :label="$t('garden')" />
						<v-checkbox v-model="displayContexts.tournament" hide-details class="option-checkbox" :label="$t('tournament')" />
					</div>
					<div v-if="type !== 'team'" class="fight-type">
						<span class="category">
							{{ $t('fight_type') }}
						</span>
						<v-checkbox v-model="displayTypes.solo" hide-details class="option-checkbox" :label="$t('solo')" />
						<v-checkbox v-model="displayTypes.farmer" hide-details class="option-checkbox" :label="$t('farmer')" />
						<v-checkbox v-model="displayTypes.team" hide-details class="option-checkbox" :label="$t('team')" />
						<v-checkbox v-model="displayTypes.battleRoyale" hide-details class="option-checkbox" :label="$t('battle_royale')" />
						<v-checkbox v-model="displayTypes.war" hide-details class="option-checkbox" :label="$t('war')" />
						<v-checkbox v-model="displayTypes.chestHunt" hide-details class="option-checkbox" :label="$t('chest_hunt')" />
						<v-checkbox v-model="displayTypes.colossus" hide-details class="option-checkbox" :label="$t('colossus')" />
						<v-checkbox v-model="displayTypes.boss" hide-details class="option-checkbox" :label="$t('boss')" />
					</div>
					<div class="fight-loot">
						<span class="category">{{ $t('loot') }}</span>
						<v-checkbox v-model="displayLoot.chests" hide-details class="option-checkbox" :label="$t('chests')" />
						<v-checkbox v-model="displayLoot.rareloot" hide-details class="option-checkbox" :label="$t('rare_loot')" />
					</div>
				</div>

				<fights-history :fights="filteredFights" />
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import type { Farmer } from '@/model/farmer'
import { type Fight, FightContext, FightType } from '@/model/fight'
import { mixins } from '@/model/i18n'
import type { Leek } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import Breadcrumb from '../forum/breadcrumb.vue'
import FightsHistory from '@/component/history/fights-history.vue'

defineOptions({ name: 'history', i18n: {}, mixins: [...mixins] })

const props = defineProps<{
	type: string
}>()

const { t } = useI18n()
const route = useRoute()

const fights = ref<Fight[]>([])
const entity = ref<Farmer | Leek | null>(null)
const period = ref<string>('today')
const start_date = ref(0)
const displayContexts = ref({ challenge: true, garden: true, tournament: true })
const displayTypes = ref({ solo: true, farmer: true, team: true, battleRoyale: true, war: true, chestHunt: true, colossus: true, boss: true })
const displayLoot = ref({ chests: false, rareloot: false })

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

	return contextFilter && typeFilter && lootFilter
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
select_period(initialPeriod)

LeekWars.get('history/get-' + props.type + '-history/' + id).then(data => {
	fights.value = data.fights
	entity.value = data.entity
	LeekWars.setTitle(t('title', [data.entity.name]))
	select_period(initialPeriod)
})

watch(displayContexts, () => {
	localStorage.setItem('options/history-contexts', JSON.stringify(displayContexts.value))
}, { deep: true })
watch(displayTypes, () => {
	localStorage.setItem('options/history-types', JSON.stringify(displayTypes.value))
}, { deep: true })
watch(displayLoot, () => {
	localStorage.setItem('options/history-loot', JSON.stringify(displayLoot.value))
}, { deep: true })
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
	.n-fights {
		padding-left: 10px;
		font-size: 18px;
		font-weight: bold;
		color: var(--text-color-secondary);
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
	.category {
		vertical-align: top;
		font-size: 16px
	}
	.history-options {
		margin: 10px;
	}
	.option-checkbox {
		display: inline-block;
		padding-right: 5px;
		padding-left: 5px;
	}
</style>
