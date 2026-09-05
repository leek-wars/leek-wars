<template>
	<div class="talent-widget">
		<div v-if="farmer" class="talent-header">
			<talent :id="farmer.id" :talent="farmer.talent" :max_talent="farmer.max_talent" :label="t('breeder_talent')" category="farmer" />
			<div class="ratio">
				<span class="win">{{ $filters.number(farmer.victories) }}</span> /
				<span class="draw">{{ $filters.number(farmer.draws) }}</span> /
				<span class="lose">{{ $filters.number(farmer.defeats) }}</span>
			</div>
		</div>
		<div v-if="chartData" class="chart-wrap">
			<Line :data="chartData" :options="chartOptions" />
		</div>
		<div v-if="fights.length" ref="fightsEl" class="fights">
			<fights-history :fights="visibleFights" />
		</div>
		<div v-else class="none">{{ t('no_fight') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
	import { Line } from 'vue-chartjs'
	import { talentDataset } from '@/chart'
	import type { ChartData, ChartOptions } from 'chart.js'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'

	defineOptions({
		name: 'HomeWidgetTalent',
		components: { Line, 'fights-history': defineAsyncComponent(() => import('@/component/history/fights-history.vue')) }
	})

	const t = useNamespacedT('home')

	// Six combats : c'est tout ce que le serveur met dans le store
	// (`FarmerController` : `getFarmerHistory($farmer, 6)`). En demander douze
	// laissait croire à un widget qui grandit avec sa hauteur, alors qu'il n'a
	// jamais eu plus de six lignes à montrer.
	const FIGHTS = 6

	const farmer = computed(() => store.state.farmer)
	const fights = computed(() => (store.state.farmer?.fight_history ?? []).slice(0, FIGHTS))
	// Autant de combats que la hauteur du panel le permet, jamais coupés.
	// On mesure .fight (et pas son wrapper) : ses marges font partie du pas.
	const fightsEl = ref<HTMLElement | null>(null)
	const fightCount = useFitCount(fightsEl, '.fight', FIGHTS)
	const visibleFights = computed(() => fights.value.slice(0, fightCount.value))

	const chartData = ref<ChartData<'line'> | null>(null)
	const chartOptions = ref<ChartOptions<'line'>>({})

	// Historique de talent en sparkline : à la hauteur qu'on peut lui donner ici,
	// des axes mangeraient la place de la courbe et leurs graduations tomberaient
	// sur les gris par défaut de Chart.js, jamais repris par le thème sombre.
	// La date et la valeur d'un point se lisent au survol.
	function buildChart() {
		const history = farmer.value?.talent_history
		if (!farmer.value || !history || !history.length) {
			chartData.value = null
			return
		}
		const labels: string[] = []
		const time = LeekWars.time
		for (let i = 1; i <= 7; ++i) labels.push(LeekWars.formatDayMonthShort(time - i * 24 * 3600))
		labels.reverse()
		labels.push(LeekWars.formatDayMonthShort(time))
		const data = [...history, farmer.value.talent]
		chartData.value = {
			labels,
			datasets: [talentDataset(data)]
		}
		chartOptions.value = {
			responsive: true,
			maintainAspectRatio: false,
			// Sans marge haute, le point du jour est rogné par le bord du canvas.
			layout: { padding: { top: 4, bottom: 2 } },
			plugins: {
				legend: { display: false },
				tooltip: {
					displayColors: false,
					callbacks: { label: (ctx) => ctx.parsed.y === null ? '' : LeekWars.formatNumber(ctx.parsed.y) },
				},
			},
			scales: { x: { display: false }, y: { display: false } },
			// Un carré de rayon r ne mesure que r√2 de côté : à 2 il disparaissait.
			elements: { point: { radius: 3, hoverRadius: 5 } },
		}
	}
	// Le vert est lu sur le body : il faut relire APRÈS que la bascule de thème
	// ait posé sa classe (app.vue le fait dans son propre watcher).
	watch(() => [farmer.value?.talent_history, farmer.value?.talent, LeekWars.darkMode, LeekWars.legacyTheme],
		() => nextTick(buildChart), { immediate: true })
</script>

<style lang="scss" scoped>
	.talent-widget {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}
	// La liste occupe la hauteur restante ; overflow hidden en filet de sécurité,
	// le nombre de combats affichés est calculé pour tenir sans couper.
	.fights {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	// Les cartes gardent la hauteur qu'elles ont partout ailleurs sur le site.
	// Les compacter faisait remonter l'heure (« il y a 2 jours », calée en bas de
	// la carte) dans la ligne des noms : à 34 px les deux textes se chevauchent.
	// On montre moins de combats plutôt que des combats écrasés.
	.fights :deep(.history) {
		padding: 0;
	}
	.chart-wrap {
		flex: 0 0 auto;
		height: clamp(70px, 30cqh, 120px);
		position: relative;
	}
	// Panel trop bas pour loger la courbe ET des combats lisibles : les combats
	// passent d'abord, ils sont le sujet du widget.
	@container (max-height: 200px) {
		.chart-wrap {
			display: none;
		}
	}
	.talent-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}
	.ratio {
		font-weight: bold;
		.win { color: var(--result-win-text); }
		.draw { color: var(--result-draw); }
		.lose { color: var(--result-defeat-text); }
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px 0;
	}
</style>
