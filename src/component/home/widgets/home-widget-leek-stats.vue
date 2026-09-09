<template>
	<div class="leek-stats-widget">
		<loader v-if="!loaded" />
		<template v-else-if="leek">
			<!-- XP et combats SOUS le bloc nom/niveau/talent, dans la colonne à côté
			     de l'image (demande de Pierre) : l'espace libéré va au graphique. -->
			<div class="head">
				<router-link :to="'/leek/' + leek.id" class="head-image">
					<leek-image :leek="leek" :scale="0.6" />
				</router-link>
				<div class="head-info">
					<router-link :to="'/leek/' + leek.id" class="identity">
						<div class="name">{{ leek.name }}</div>
						<div class="level">{{ t('main.level_n', [leek.level]) }}</div>
					</router-link>
					<div class="talent-line">
						<talent :id="leek.id" :talent="leek.talent" :max_talent="leek.max_talent" category="leek" />
					</div>
					<div class="xp">
						<!-- Le vocabulaire de la barre d'XP de la page poireau (`.bar > .xp-bar`) :
						     la coquille v3 y pose cadre, aplat et rayures (Pierre, 2026-09-09). -->
						<div class="bar"><div class="xp-bar" :style="{ width: xpPercent + '%' }"></div></div>
						<div class="xp-text">{{ t('stat_xp') }} : {{ LeekWars.formatNumber(leek.xp) }}<template v-if="leek.up_xp"> / {{ LeekWars.formatNumber(leek.up_xp) }}</template></div>
					</div>
					<div class="wdl">
						<div class="wdl-cell"><span class="v win">{{ $filters.number(leek.victories) }}</span><span class="l">{{ t('stat_victories') }}</span></div>
						<div class="wdl-cell"><span class="v draw">{{ $filters.number(leek.draws) }}</span><span class="l">{{ t('stat_draws') }}</span></div>
						<div class="wdl-cell"><span class="v lose">{{ $filters.number(leek.defeats) }}</span><span class="l">{{ t('stat_defeats') }}</span></div>
						<div class="wdl-cell"><span class="v">{{ $filters.number(leek.tournaments) }}</span><span class="l">{{ t('stat_tournaments') }}</span></div>
					</div>
				</div>
			</div>

			<div v-if="chartData" class="chart-wrap">
				<Line :data="chartData" :options="chartOptions" />
			</div>
		</template>
		<div v-else class="none">{{ t('no_leek') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, nextTick, ref, watch } from 'vue'
	import { Line } from 'vue-chartjs'
	import { talentDataset, talentScales } from '@/chart'
	import type { ChartData, ChartOptions } from 'chart.js'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({ name: 'HomeWidgetLeekStats', components: { Line } })

	interface LeekStats {
		id: number, name: string, level: number, xp: number, up_xp: number, down_xp: number,
		talent: number, max_talent: number, talent_history: number[], victories: number,
		draws: number, defeats: number,
		/** Nombre de tournois disputés — et non la longueur de l'historique, que le
		 *  serveur plafonne à six. */
		tournaments: number,
		skin?: number, metal?: boolean, face?: number, weapon?: number | null, hat?: unknown
	}

	// `data` : charge utile de la requête groupée de l'accueil (cf. home.vue).
	// `undefined` tant qu'elle est en vol, `null` si ce widget n'en a rien tiré.
	const props = defineProps<{ params?: { leek?: number }, data?: { leek: LeekStats } | null }>()

	const t = useNamespacedT('home')

	const loaded = ref(false)
	const leek = ref<LeekStats | null>(null)
	const chartData = ref<ChartData<'line'> | null>(null)
	const chartOptions = ref<ChartOptions<'line'>>({})

	// Le poireau choisi, validé contre ceux de l'éleveur : un poireau vendu, ou la
	// disposition rapportée d'un autre compte, affichait « aucun poireau » au lieu
	// de retomber sur le premier. Même règle que le titre du panneau (home.vue).
	const leekId = computed(() => {
		const mine = Object.values(store.state.farmer?.leeks ?? {})
		const chosen = props.params?.leek
		if (chosen && mine.some(l => l.id === chosen)) return chosen
		return mine[0]?.id
	})

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
		chartData.value = {
			labels,
			datasets: [talentDataset(data)]
		}
		chartOptions.value = {
			// Le graphique remplit la hauteur restante du panel (pas de ratio figé).
			responsive: true,
			maintainAspectRatio: false,
			plugins: { legend: { display: false } },
			// Un carré de rayon r mesure r√2 de côté : un cran de plus que les
			// ronds d'avant pour garder le même poids à l'œil.
			elements: { point: { radius: 4, hoverRadius: 6 } },
			scales: talentScales(),
		}
	}

	// Repli : la fiche complète du poireau (six combats, historique des tournois,
	// registres…) pour les douze champs affichés ici. Son compteur de tournois
	// vaut la longueur de l'historique, plafonnée à six — la requête groupée, elle,
	// donne le nombre réel.
	function load() {
		const id = leekId.value
		if (!id) { loaded.value = true; return }
		loaded.value = false
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		LeekWars.get<any>('leek/get/' + id).then((data) => {
			leek.value = { ...data, tournaments: data.tournaments ? data.tournaments.length : 0 }
			buildChart()
			loaded.value = true
		}).error(() => { leek.value = null; loaded.value = true })
	}

	// Le changement de poireau est traité par l'accueil, qui redemande ce seul
	// widget : pas de watcher sur `leekId` ici, il doublerait la requête.
	watch(() => props.data, (data) => {
		if (data === undefined) { loaded.value = false; return }
		if (data === null) { load(); return }
		leek.value = data.leek
		buildChart()
		loaded.value = true
	}, { immediate: true })
	// La grille du graphique est lue sur le thème : la relire à la bascule, sinon
	// elle garde les couleurs de l'ancien et disparaît dans le fond.
	watch(() => [LeekWars.darkMode, LeekWars.legacyTheme], () => nextTick(buildChart))
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
	}
	.head-image {
		flex-shrink: 0;
	}
	.head-info {
		min-width: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.identity {
		text-decoration: none;
		color: var(--text-color);
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
	.bar {
		background: var(--background-secondary);
		border-radius: var(--radius);
		height: 8px;
		overflow: hidden;
	}
	.bar > .xp-bar {
		height: 100%;
		background: var(--primary-surface);
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
		// La règle « pas de graphique sous 60 px » se mesure sur la place que LE
		// GRAPHIQUE reçoit, pas sur la hauteur du panel : le bloc de tête varie
		// (nom long, talent). Le wrap devient son propre conteneur et masque son
		// canvas quand il est trop bas.
		container-type: size;
	}
	@container (max-height: 59px) {
		.chart-wrap > :deep(canvas) {
			display: none;
		}
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
