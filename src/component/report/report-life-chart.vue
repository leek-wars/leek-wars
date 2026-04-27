<template>
	<panel :title="$t('life_chart')" toggle="report/graph" icon="mdi-chart-line">
		<template #actions>
			<v-tooltip v-if="fight && fight.type === FightType.TEAM">
				<template #activator="{ props }">
					<div v-bind="props" class="button flat" @click="toggleTurrets">
						<img v-if="turrets" src="/image/icon/turret.png">
						<img v-else src="/image/icon/turret_off.png">
					</div>
				</template>
				{{ $t('toggle_turrets') }}
			</v-tooltip>
			<v-tooltip>
				<template #activator="{ props }">
					<div v-bind="props" class="button flat" @click="toggleLog">
						<v-icon>mdi-percent-outline</v-icon>
					</div>
				</template>
				{{ $t('toggle_percent') }}
			</v-tooltip>
			<v-tooltip>
				<template #activator="{ props }">
					<div v-bind="props" class="button flat" @click="toggleSmooth">
						<img v-if="smooth" src="/image/icon/graph_angular.png">
						<img v-else src="/image/icon/graph_smooth.png">
					</div>
				</template>
				{{ $t('toggle_smooth') }}
			</v-tooltip>
		</template>
		<div class="chart-panel">
			<div class="damage-options">
				<div class="spacer"></div>
				<v-switch v-model="chartDisplaySummons" :label="$t('display_summons')" :hide-details="true" :ripple="false" />
			</div>
			<Line ref="lifeChart" :data="chartData" :options="chartOptions" class="chart" :class="{long: statistics && statistics.lives.length >= 30}" />
		</div>
	</panel>
</template>

<script setup lang="ts">
	import { Fight, FightType } from '@/model/fight'
	import { TEAM_COLORS } from '@/model/team'
	import { emitter } from '@/model/vue'
	import { mixins } from '@/model/i18n'
	import { Line } from 'vue-chartjs'
	import { ChartOptions, Interaction } from 'chart.js'
	import { FightStatistics, StatisticsEntity } from './statistics'
	import { onBeforeUnmount, ref, watch } from 'vue'

	defineOptions({ name: 'report', i18n: {}, mixins: [...mixins] })

	const props = defineProps<{
		fight: Fight
		statistics: FightStatistics
	}>()

	let chartFocusedIndex: number | null = null

	function nearestDatasetBySegment(chart: any, px: number, py: number) {
		let minDist = Infinity
		let nearest = -1
		for (let d = 0; d < chart.data.datasets.length; d++) {
			const points = chart.getDatasetMeta(d).data
			for (let i = 0; i < points.length - 1; i++) {
				const x1 = points[i].x, y1 = points[i].y
				const x2 = points[i + 1].x, y2 = points[i + 1].y
				const dx = x2 - x1, dy = y2 - y1
				const len2 = dx * dx + dy * dy
				const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
				const sx = x1 + t * dx, sy = y1 + t * dy
				const dist = (px - sx) * (px - sx) + (py - sy) * (py - sy)
				if (dist < minDist) { minDist = dist; nearest = d }
			}
		}
		return { index: nearest, dist: Math.sqrt(minDist) }
	}

	// Custom interaction mode: when focused, only return items from the focused dataset
	;(Interaction.modes as any).focusedNearest = function(chart: any, e: any, options: any, useFinalPosition: any) {
		const items = Interaction.modes.index(chart, e, options, useFinalPosition)
		if (!items.length) return items
		const target = chartFocusedIndex ?? nearestDatasetBySegment(chart, e.x, e.y).index
		if (target === -1) return []
		return items.filter(item => item.datasetIndex === target)
	}

	const smooth = ref(false)
	const log = ref(false)
	const turrets = ref(false)
	const chartData = ref<any>(null)
	const chartOptions = ref<ChartOptions | null>(null)
	const chartDisplaySummons = ref(false)
	let filtered_entities: StatisticsEntity[] = []
	const lifeChart = ref<any>(null)

	emitter.on('htmlclick', chartUnfocus)
	smooth.value = localStorage.getItem('report/graph-type') === 'smooth'
	log.value = localStorage.getItem('report/log') === 'true'
	turrets.value = localStorage.getItem('report/turrets') === 'true'
	updateChart()

	onBeforeUnmount(() => {
		emitter.off('htmlclick', chartUnfocus)
	})

	function toggleSmooth() {
		if (smooth.value) {
			localStorage.setItem('report/graph-type', 'angular')
		} else {
			localStorage.setItem('report/graph-type', 'smooth')
		}
		smooth.value = !smooth.value
		updateChart()
	}

	function toggleLog() {
		log.value = !log.value
		localStorage.setItem('report/log', '' + log.value)
		updateChart()
	}

	function toggleTurrets() {
		turrets.value = !turrets.value
		localStorage.setItem('report/turrets', '' + turrets.value)
		updateChart()
	}

	watch(chartDisplaySummons, () => updateChart())

	function updateChart() {
		if (!props.fight || !props.statistics) { return }
		let series = log.value ? props.statistics.lives_percent : props.statistics.lives
		filtered_entities = Object.values(props.statistics!.entities)
		if (!chartDisplaySummons.value) {
			filtered_entities = filtered_entities.filter(e => !e.leek.summon)
			series = series.filter((value, index) => !props.statistics!.entities[index].leek.summon)
		}
		if (!turrets.value) {
			filtered_entities = filtered_entities.filter(e => e.leek.type !== 2)
			series = series.filter((value, index) => props.statistics!.entities[index].leek.type !== 2)
		}
		chartData.value = {
			datasets: series.map((s, i) => ({
				data: s.slice(0, (s.findLastIndex((p: any) => p.y !== null) + 1) || s.length),
				tension: smooth.value ? 0.2 : 0,
				borderColor: TEAM_COLORS[filtered_entities[i].leek.team - 1],
				label: filtered_entities[i].leek.translatedName,
				pointHitRadius: 20
			}))
		}
		chartFocusedIndex = null
		chartOptions.value = {
			plugins: {
				legend: { display: false },
				tooltip: {
					mode: 'focusedNearest' as any,
					intersect: false,
					position: 'nearest',
					yAlign: 'bottom',
					usePointStyle: false,
					boxWidth: 10,
					boxHeight: 10,
					boxPadding: 4,
					callbacks: {
						title: () => '',
						label: (context: any) => context.dataset.label + ' : ' + context.parsed.y.toLocaleString() + (log.value ? '%' : '') + ' PV',
						labelColor: (context: any) => ({ backgroundColor: context.dataset.borderColor, borderColor: context.dataset.borderColor })
					}
				}
			},
			onClick: (event: any) => {
				if (chartFocusedIndex !== null) {
					chartUnfocus()
					return
				}
				const nearest = findNearestDataset(event)
				if (nearest !== -1) {
					chartFocus(nearest)
				}
			},
			aspectRatio: 2.66,
			elements: { point: { pointStyle: false } },
			scales: {
				x: {
					type: 'linear',
					position: 'bottom',
					min: 1,
					max: props.statistics.duration + 1,
					grid: { color: 'rgba(128,128,128,0.15)' },
				},
				y: {
					type: 'linear',
					grid: { color: 'rgba(128,128,128,0.15)' },
				}
			}
		}
	}

	function hexToRgba(hex: string, alpha: number) {
		const r = parseInt(hex.slice(1, 3), 16)
		const g = parseInt(hex.slice(3, 5), 16)
		const b = parseInt(hex.slice(5, 7), 16)
		return `rgba(${r},${g},${b},${alpha})`
	}

	function findNearestDataset(event: any) {
		const chart = (lifeChart.value as any)?.chart
		if (!chart) return -1
		const rect = chart.canvas.getBoundingClientRect()
		const px = event.native.clientX - rect.left
		const py = event.native.clientY - rect.top
		let minDist = Infinity
		let nearest = -1
		for (let d = 0; d < chart.data.datasets.length; d++) {
			const meta = chart.getDatasetMeta(d)
			const points = meta.data
			for (let i = 0; i < points.length - 1; i++) {
				const x1 = points[i].x, y1 = points[i].y
				const x2 = points[i + 1].x, y2 = points[i + 1].y
				// Distance point-to-segment
				const dx = x2 - x1, dy = y2 - y1
				const len2 = dx * dx + dy * dy
				const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
				const sx = x1 + t * dx, sy = y1 + t * dy
				const dist = Math.sqrt((px - sx) * (px - sx) + (py - sy) * (py - sy))
				if (dist < minDist) {
					minDist = dist
					nearest = d
				}
			}
		}
		return minDist < 30 ? nearest : -1
	}

	function chartFocus(index: number) {
		chartFocusedIndex = index
		const chart = (lifeChart.value as any)?.chart
		if (!chart) return
		chart.data.datasets.forEach((ds: any, i: number) => {
			const color = TEAM_COLORS[filtered_entities[i].leek.team - 1]
			ds.borderWidth = i === index ? 4 : 3
			ds.borderColor = hexToRgba(color, i === index ? 1 : 0.2)
		})
		chart.update()
	}

	function chartUnfocus() {
		chartFocusedIndex = null
		const chart = (lifeChart.value as any)?.chart
		if (!chart) return
		chart.data.datasets.forEach((ds: any, i: number) => {
			ds.borderWidth = 3
			ds.borderColor = TEAM_COLORS[filtered_entities[i].leek.team - 1]
		})
		chart.update()
	}
</script>

<style lang="scss" scoped>
	.chart-panel {
		position: relative;
	}
	.damage-options {
		display: flex;
		.spacer {
			flex: 1;
		}
	}
</style>
