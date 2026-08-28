<template lang="html">
	<div class="talent-chart" :class="{fixed: fixedHeight}">
		<!-- Le sélecteur est posé PAR-DESSUS le graphique, en absolu : dans le flux
		     il volerait de la hauteur à la courbe, qui est déjà à l'étroit (150 px
		     sur la page du poireau). Le coin haut-droit du tracé est aussi le plus
		     souvent vide, la courbe de talent montant rarement jusque-là. -->
		<div v-if="hasLongHistory" class="periods">
			<button v-for="period in PERIODS" :key="period" type="button" class="period" :class="{selected: period === days}" @click.stop.prevent="select(period)">
				{{ $t('main.period_days', [period]) }}
			</button>
		</div>
		<Line v-if="chart" :data="chart.data" :options="chart.options" class="talent-history" />
	</div>
</template>

<script setup lang="ts">
	import { computed, nextTick, ref, watch } from 'vue'
	import { Line } from 'vue-chartjs'
	import type { ChartData, ChartOptions } from 'chart.js'
	import { talentDataset, talentScales } from '@/chart'
	import { LeekWars } from '@/model/leekwars'

	defineOptions({ name: 'TalentChart' })

	const props = defineProps<{
		/** Fenêtre courte, telle que servie depuis toujours (7 valeurs, sans trou). */
		history: number[] | undefined
		/** Fenêtre longue (30 valeurs, `null` les jours sans mesure). Absente d'un
		 *  serveur plus ancien que le client : le sélecteur ne s'affiche pas. */
		historyLong?: (number | null)[]
		/** Talent du jour, encore en cours : le dernier point de la courbe. */
		current: number | undefined
		/** L'appelant contraint la hauteur : le graphique la remplit au lieu de tenir
		 *  un rapport fixe. La valeur, elle, appartient à l'appelant. */
		fixedHeight?: boolean
	}>()

	const SHORT = 7
	// La fenêtre longue est celle que le serveur envoie : afficher « 30 j » en dur
	// mentirait le jour où la rétention change, alors que la courbe, elle, étiquette
	// ses abscisses à partir du nombre de points reçus.
	const PERIODS = computed(() => hasLongHistory.value ? [SHORT, props.historyLong!.length] : [SHORT])
	// Le choix est global et non par page : passer d'un poireau à l'autre pour
	// comparer deux courbes sur deux fenêtres différentes n'aurait pas de sens.
	const STORAGE_KEY = 'talent/period'

	const hasLongHistory = computed(() => !!props.historyLong && props.historyLong.length > SHORT)
	// On retient le CHOIX (courte ou longue) et pas un nombre de jours : la longueur
	// de la fenêtre longue appartient au serveur et peut changer sous nos pieds.
	const long = ref(localStorage.getItem(STORAGE_KEY) === 'long')
	const days = computed(() => long.value && hasLongHistory.value ? props.historyLong!.length : SHORT)

	// Les deux vont toujours ensemble : un seul état, un seul test au rendu.
	const chart = ref<{ data: ChartData<'line'>, options: ChartOptions<'line'> } | null>(null)

	function select(period: number) {
		long.value = period > SHORT
		localStorage.setItem(STORAGE_KEY, long.value ? 'long' : 'short')
	}

	function build() {
		if (props.current === undefined) return
		const source: (number | null)[] | undefined = days.value > SHORT ? props.historyLong : props.history
		if (!source || !source.length) return

		const labels: string[] = []
		const time = LeekWars.time
		for (let i = source.length; i >= 1; --i) {
			labels.push(LeekWars.formatDayMonthShort(time - i * 24 * 3600))
		}
		labels.push(LeekWars.formatDayMonthShort(time))

		// Un carré de rayon r mesure r√2 de côté : un cran de plus que les ronds
		// d'avant pour garder le même poids à l'œil. Passé la fenêtre courte, les
		// points se toucheraient : la courbe se lit alors au trait seul.
		const dense = source.length > SHORT
		chart.value = {
			data: {
				labels,
				datasets: [talentDataset([...source, props.current] as number[])]
			},
			options: {
				...(props.fixedHeight ? { maintainAspectRatio: false } : { aspectRatio: 2.5 }),
				plugins: { legend: { display: false } },
				elements: { point: { radius: dense ? 0 : 5, hoverRadius: dense ? 5 : 7 } },
				scales: talentScales(),
			}
		}
	}

	// Le vert du tracé est lu sur le body : il faut reconstruire après une bascule
	// de thème, comme le faisaient les trois pages qui portaient ce graphique.
	// Sans `deep` : les historiques arrivent remplacés en bloc par la réponse de
	// l'API, jamais mutés en place.
	watch(() => [props.history, props.historyLong, props.current, days.value, LeekWars.darkMode, LeekWars.legacyTheme],
		() => nextTick(build), { immediate: true })
</script>

<style lang="scss" scoped>
	.talent-chart {
		position: relative;
	}
	.talent-chart.fixed {
		height: 100%;
	}
	.talent-history {
		margin-top: 3px;
	}
	.periods {
		position: absolute;
		top: 0;
		right: 0;
		z-index: 1;
		display: flex;
		gap: 2px;
	}
	.period {
		font-size: 11px;
		font-weight: 500;
		line-height: 1;
		padding: 3px 6px;
		color: var(--text-color-secondary);
		background: var(--background-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-soft);
		cursor: pointer;
		&:hover {
			color: var(--text-color);
		}
		&.selected {
			color: var(--primary-text);
			background: var(--primary);
			border-color: var(--primary);
		}
	}
</style>
