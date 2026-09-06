<template>
	<div class="turn-chart">
		<div class="turn-caption">{{ $t('turn_chart') }}</div>
		<Bar v-if="chartData" :data="chartData" :options="chartOptions ?? undefined" class="chart" />
	</div>
</template>

<script setup lang="ts">
	import { Fight } from '@/model/fight'
	import { LeekWars } from '@/model/leekwars'
	import { TEAM_COLORS } from '@/model/team'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { Bar } from 'vue-chartjs'
	import { ChartDataset, ChartOptions, TooltipItem } from 'chart.js'
	import { FightStatistics } from './statistics'
	import { ref, watch } from 'vue'

	defineOptions({ name: 'Report', i18n: {}, mixins: [...mixins] })

	// Piloté par le panneau « Répartition » : métrique (0..5, ordre damageChartType),
	// mode équipes (0/1) et affichage des invocations sont partagés via props.
	const props = defineProps<{
		fight: Fight
		statistics: FightStatistics
		metric: number
		teams: number
		displaySummons: boolean
	}>()

	// Traduction côté script (mêmes clés que le namespace 'report'), comme report.vue
	const t = useNamespacedT('report')

	const chartData = ref<{ labels: string[]; datasets: ChartDataset<'bar'>[] } | null>(null)
	const chartOptions = ref<ChartOptions<'bar'> | null>(null)

	updateChart()
	watch(() => [props.metric, props.teams, props.displaySummons, LeekWars.darkMode], () => updateChart())

	function metricSeries(): number[][] {
		const s = props.statistics
		switch (props.metric) {
			case 1: return s.turn_damage_in
			case 2: return s.turn_heal
			case 3: return s.turn_tank
			case 4: return s.turn_tp
			case 5: return s.turn_pm
			default: return s.turn_damage_out
		}
	}

	function updateChart() {
		if (!props.fight || !props.statistics) { return }
		const stats = props.statistics
		const turnCount = stats.turn_count
		if (turnCount <= 0) { chartData.value = null; return }
		const series = metricSeries()
		const entityList = Object.values(stats.entities)
		const labels = Array.from({ length: turnCount }, (_, i) => '' + (i + 1))

		// Un « bucket » = une série empilée (une entité, ou une équipe en mode agrégé).
		type Bucket = { id: number; label: string; team: number; data: number[] }
		const buckets: Bucket[] = []

		if (props.teams === 1) {
			const byTeam: { [team: number]: Bucket } = {}
			entityList.forEach((e, i) => {
				const team = e.leek.team
				if (!byTeam[team]) {
					byTeam[team] = { id: team, label: t('team' + team) as string, team, data: new Array(turnCount).fill(0) }
					buckets.push(byTeam[team])
				}
				const s = series[i]
				for (let turn = 0; turn < turnCount; turn++) { byTeam[team].data[turn] += s?.[turn] ?? 0 }
			})
		} else {
			const byId: { [id: number]: Bucket } = {}
			// 1re passe : entités affichées (invocations incluses seulement si demandé)
			entityList.forEach((e, i) => {
				if (e.leek.summon && !props.displaySummons) { return }
				const data = new Array(turnCount).fill(0)
				const s = series[i]
				for (let turn = 0; turn < turnCount; turn++) { data[turn] = s?.[turn] ?? 0 }
				const b = { id: e.leek.id, label: e.translatedName, team: e.leek.team, data }
				buckets.push(b)
				byId[e.leek.id] = b
			})
			// 2e passe : invocations masquées fusionnées dans leur invocateur (comme le panneau Répartition)
			if (!props.displaySummons) {
				entityList.forEach((e, i) => {
					if (!e.leek.summon) { return }
					const owner = byId[e.leek.owner]
					if (!owner) { return }
					const s = series[i]
					for (let turn = 0; turn < turnCount; turn++) { owner.data[turn] += s?.[turn] ?? 0 }
				})
			}
		}

		const rootStyle = getComputedStyle(document.body)
		const textColor = rootStyle.getPropertyValue('--text-color-secondary').trim() || '#888'
		const bgColor = rootStyle.getPropertyValue('--background').trim() || '#fff'

		chartData.value = {
			labels,
			datasets: buckets.map(b => ({
				label: b.label,
				data: b.data,
				backgroundColor: TEAM_COLORS[b.team - 1],
				// Fin trait de séparation entre segments empilés de même couleur (même équipe)
				borderColor: bgColor,
				borderWidth: 1,
				stack: 'total',
			}))
		}
		chartOptions.value = {
			aspectRatio: 2.66,
			plugins: {
				legend: { display: false },
				tooltip: {
					mode: 'index',
					intersect: false,
					// Masque les segments à 0 (entités inactives ce tour-là) et trie par quantité décroissante
					filter: (item: TooltipItem<'bar'>) => (item.parsed.y ?? 0) !== 0,
					itemSort: (a: TooltipItem<'bar'>, b: TooltipItem<'bar'>) => (b.parsed.y ?? 0) - (a.parsed.y ?? 0),
					callbacks: {
						label: (context: TooltipItem<'bar'>) => context.dataset.label + ' : ' + (context.parsed.y ?? 0).toLocaleString(),
						labelColor: (context: TooltipItem<'bar'>) => ({ backgroundColor: context.dataset.backgroundColor as string, borderColor: context.dataset.backgroundColor as string })
					}
				}
			},
			scales: {
				x: { stacked: true, grid: { color: 'rgba(128,128,128,0.15)' }, ticks: { color: textColor } },
				y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(128,128,128,0.15)' }, ticks: { color: textColor } }
			}
		}
	}
</script>

<style lang="scss" scoped>
	.turn-chart {
		position: relative;
		margin-top: 10px;
	}
	.turn-caption {
		color: var(--text-color-secondary);
		font-weight: bold;
		padding: 4px 0 8px;
	}
	.chart {
		width: 100%;
	}
</style>
