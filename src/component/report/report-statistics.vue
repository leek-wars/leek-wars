<template>
	<table v-if="statistics" class="report">
		<tr>
			<th>{{ $t('main.leek') }}</th>
			<th>{{ $t('main.level') }}</th>
			<th>{{ $t('damage_inflicted') }}</th>
			<th>{{ $t('damage_received') }}</th>
			<th>{{ $t('heal_casted') }}</th>
			<th>{{ $t('heal_received') }}</th>
			<th>{{ $t('kills') }}</th>
			<th>{{ $t('operations') }}</th>
			<th>{{ $t('operations_per_turn') }}</th>
			<th>{{ $t('tp_used') }}</th>
			<th>{{ $t('tp_per_turn') }}</th>
			<th>{{ $t('mp_used') }}</th>
			<th>{{ $t('turns_played') }}</th>
			<th>{{ $t('shootings') }}</th>
			<th>{{ $t('chips_used') }}</th>
			<th>{{ $t('summons') }}</th>
			<th>{{ $t('resurrections') }}</th>
			<th>{{ $t('criticals') }}</th>
			<th>{{ $t('bugs') }}</th>
		</tr>
		<tr>
			<td colspan="19" class="header"><b :style="{color: TEAM_COLORS[0]}">{{ $t('team_n', [1]) }}</b></td>
		</tr>
		<template v-for="entity in statistics.team1">
			<report-statistics-entity :key="entity.leek.id" :entity="entity" :stats="stats" :best="best" />
			<report-statistics-entity v-for="summon in entity.summons" :key="entity.leek.id + '-' + summon.leek.id" :entity="summon" :stats="stats" :best="best" />
		</template>
		<tr>
			<td colspan="19" class="header"><b :style="{color: TEAM_COLORS[1]}">{{ $t('team_n', [2]) }}</b></td>
		</tr>
		<template v-for="entity in statistics.team2">
			<report-statistics-entity :key="entity.leek.id" :entity="entity" :stats="stats" :best="best" />
			<report-statistics-entity v-for="summon in entity.summons" :key="entity.leek.id + '-' + summon.leek.id" :entity="summon" :stats="stats" :best="best" />
		</template>
	</table>
</template>

<script lang="ts">
	import { TEAM_COLORS } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ReportStatisticsEntity from './report-statistics-entity.vue'
	import { FightStatistics } from './statistics'

	@Component({ components: { ReportStatisticsEntity } })
	export default class ReportStatistics extends Vue {
		@Prop({required: true}) fight!: any
		@Prop({required: true}) statistics!: FightStatistics
		stats = ['dmg_out', 'dmg_in', 'heal_out', 'heal_in', 'kills', 'ops_format', 'ops_per_turn_format', 'usedPT', 'usedPTperTurn', 'usedPM', 'roundsPlayed', 'actionsWeapon', 'actionsChip', 'invocation', 'resurrection', 'critical', 'crashes']
		TEAM_COLORS = TEAM_COLORS

		get best() {
			const result: any = {}
			for (const stat of this.stats) {
				let best = 0
				let bestEntities:number[] = []
				const real_stat = stat === 'ops_format' ? 'operations' : (stat === 'ops_per_turn_format' ? 'operations_per_turn' : stat)
				for (const e in this.statistics.entities) {
					if ((this.statistics.entities[e] as any)[real_stat] > best) {
						best = (this.statistics.entities[e] as any)[real_stat]
						bestEntities = [this.statistics.entities[e].leek.id]
					} else if ((this.statistics.entities[e] as any)[real_stat] === best && best !== 0) {
						bestEntities.push(this.statistics.entities[e].leek.id)
					}
				}
				
				result[stat] = bestEntities
			}
			return result
		}
	}
</script>

<style lang="scss" scoped>
	td.header {
		text-align: left;
	}
	th {
		border: 1px solid var(--border);
		padding: 4px;
		background: var(--background-header);
		font-weight: normal;
		font-size: 14px;
	}
	td {
		border: 1px solid var(--border);
		text-align: center;
		padding: 4px;
	}
</style>
