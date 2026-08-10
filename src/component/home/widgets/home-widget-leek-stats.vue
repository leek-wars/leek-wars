<template>
	<div class="leek-stats-widget">
		<loader v-if="!loaded" />
		<template v-else-if="leek">
			<router-link :to="'/leek/' + leek.id" class="head">
				<leek-image :leek="leek" :scale="0.6" />
				<div class="head-info">
					<div class="name">{{ leek.name }}</div>
					<div class="level">{{ t('main.level_n', [leek.level]) }}</div>
					<div class="talent-line">
						<talent :id="leek.id" :talent="leek.talent" :max_talent="leek.max_talent" category="leek" />
					</div>
				</div>
			</router-link>

			<div class="xp">
				<div class="xp-bar"><div class="xp-fill" :style="{ width: xpPercent + '%' }"></div></div>
				<div class="xp-text">{{ t('stat_xp') }} : {{ LeekWars.formatNumber(leek.xp) }}<template v-if="leek.up_xp"> / {{ LeekWars.formatNumber(leek.up_xp) }}</template></div>
			</div>

			<div class="wdl">
				<div class="wdl-cell"><span class="v win">{{ $filters.number(leek.victories) }}</span><span class="l">{{ t('stat_victories') }}</span></div>
				<div class="wdl-cell"><span class="v draw">{{ $filters.number(leek.draws) }}</span><span class="l">{{ t('stat_draws') }}</span></div>
				<div class="wdl-cell"><span class="v lose">{{ $filters.number(leek.defeats) }}</span><span class="l">{{ t('stat_defeats') }}</span></div>
				<div class="wdl-cell"><span class="v">{{ leek.tournaments ? leek.tournaments.length : 0 }}</span><span class="l">{{ t('stat_tournaments') }}</span></div>
			</div>

			<div v-if="chartData" class="chart-wrap">
				<Line :data="chartData" :options="chartOptions" />
			</div>
		</template>
		<div v-else class="none">{{ t('no_leek') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { Line } from 'vue-chartjs'
	import type { ChartData, ChartOptions } from 'chart.js'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({ name: 'HomeWidgetLeekStats', components: { Line } })

	const props = defineProps<{ params?: { leek?: number } }>()

	const t = useNamespacedT('home')

	interface LeekStats {
		id: number, name: string, level: number, xp: number, up_xp: number, down_xp: number,
		talent: number, max_talent: number, talent_history: number[], victories: number,
		draws: number, defeats: number, tournaments: unknown[]
	}

	const loaded = ref(false)
	const leek = ref<LeekStats | null>(null)
	const chartData = ref<ChartData<'line'> | null>(null)
	const chartOptions = ref<ChartOptions<'line'>>({})

	const leekId = computed(() => props.params?.leek || Object.values(store.state.farmer?.leeks ?? {})[0]?.id)

	const xpPercent = computed(() => {
		if (!leek.value) return 0
		if (leek.value.level >= 301) return 100
		const span = leek.value.up_xp - leek.value.down_xp
		return span > 0 ? Math.min(100, Math.floor(100 * (leek.value.xp - leek.value.down_xp) / span)) : 0
	})

	function buildChart() {
		if (!leek.value || leek.value.level < 100 || !leek.value.talent_history?.length) {
			chartData.value = null
			return
		}
		const labels: string[] = []
		const time = LeekWars.time
		for (let i = 1; i <= 7; ++i) labels.push(LeekWars.formatDayMonthShort(time - i * 24 * 3600))
		labels.reverse()
		labels.push(LeekWars.formatDayMonthShort(time))
		const data = [...leek.value.talent_history, leek.value.talent]
		const lastIndex = data.length - 1
		chartData.value = {
			labels,
			datasets: [{
				tension: 0.2,
				data,
				borderColor: '#5fad1b',
				pointBackgroundColor: '#5fad1b',
				borderWidth: 2,
				fill: { target: 'origin', above: '#5fad1b30' },
				segment: {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					borderDash: (ctx: any) => ctx.p1DataIndex === lastIndex ? [6, 6] : undefined,
				},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			}] as any
		}
		chartOptions.value = {
			// Le graphique remplit la hauteur restante du panel (pas de ratio figé).
			responsive: true,
			maintainAspectRatio: false,
			plugins: { legend: { display: false } },
			elements: { point: { radius: 3, hoverRadius: 5 } },
		}
	}

	function load() {
		const id = leekId.value
		if (!id) { loaded.value = true; return }
		loaded.value = false
		LeekWars.get<LeekStats>('leek/get/' + id).then((data) => {
			leek.value = data
			buildChart()
			loaded.value = true
		}).error(() => { leek.value = null; loaded.value = true })
	}
	watch(leekId, load, { immediate: true })
</script>

<style lang="scss" scoped>
	.leek-stats-widget {
		display: flex;
		flex-direction: column;
		gap: 10px;
		height: 100%;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 12px;
		text-decoration: none;
		color: var(--text-color);
	}
	.head-info {
		min-width: 0;
	}
	.name {
		font-weight: bold;
		font-size: 17px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.level {
		color: var(--text-color-secondary);
		font-size: 13px;
	}
	.talent-line {
		margin-top: 2px;
	}
	.xp-bar {
		background: var(--background-secondary);
		border-radius: var(--radius);
		height: 8px;
		overflow: hidden;
	}
	.xp-fill {
		height: 100%;
		background: var(--primary);
	}
	.xp-text {
		font-size: 12px;
		color: var(--text-color-secondary);
		margin-top: 3px;
	}
	.wdl {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
	}
	.wdl-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: var(--background-secondary);
		border-radius: var(--radius);
		padding: 6px 2px;
	}
	.wdl-cell .v {
		font-weight: bold;
		font-size: 16px;
	}
	.wdl-cell .v.win { color: var(--result-win-text); }
	.wdl-cell .v.draw { color: var(--result-draw); }
	.wdl-cell .v.lose { color: var(--result-defeat-text); }
	.wdl-cell .l {
		font-size: 11px;
		color: var(--text-color-secondary);
	}
	.chart-wrap {
		width: 100%;
		flex: 1 1 auto;
		min-height: 0;
		position: relative;
	}
	// Panel trop bas pour un graphique lisible : on le masque plutôt que
	// de l'écraser (container = contenu du panel).
	@container (max-height: 330px) {
		.chart-wrap {
			display: none;
		}
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
