<template lang="html">
	<panel class="fast-garden">
		<template #title>
			<v-icon>mdi-lightning-bolt</v-icon>
			<template v-if="ids.length">{{ t('fast_batch_title', [ids.length]) }}</template>
			<template v-else-if="launching">{{ t('fast_batch_launching') }}</template>
			<template v-else>{{ t('fast_garden_title') }}</template>
		</template>
		<template #actions>
			<!-- Rien à fermer tant qu'aucun lot n'est lancé. -->
			<div v-if="ids.length" class="button text" :title="t('main.close')" @click="emit('close')">
				<v-icon>mdi-close</v-icon>
			</div>
		</template>
		<template #content>
			<!-- Barre du lot : l'état à gauche (loader, libellé, jauge), le lanceur à droite.
			     Le bouton de lancement vit ICI et nulle part ailleurs. Il est fourni par le
			     potager, seul à savoir quel poireau / quelle compo / quel boss est
			     sélectionné ; le panneau n'affiche que le lot. Sans lot, le lanceur est
			     seul et centré. -->
			<div class="batch-bar" :class="{ idle: !active }">
				<div v-if="active" class="batch-status">
					<div class="status-icon">
						<loader v-if="pending" :size="28" />
						<v-icon v-else class="done">mdi-check-bold</v-icon>
					</div>
					<div class="status-body">
						<div class="status-label">
							<template v-if="launching || !loaded">{{ t('fast_batch_launching') }}</template>
							<template v-else-if="pending">{{ t('fast_batch_progress', [summary.finished, summary.total]) }}</template>
							<template v-else>{{ t('fast_batch_done') }}</template>
						</div>
						<!-- Jauge déterminée : c'est le « X / Y » rendu visible d'un coup d'œil.
						     Tant que le lot n'a pas d'identifiants elle reste vide, le loader
						     suffit à dire que ça travaille. -->
						<div class="progress-track" role="progressbar" :aria-valuenow="summary.finished" :aria-valuemax="summary.total">
							<div class="progress-fill" :style="{ width: percent + '%' }"></div>
						</div>
					</div>
				</div>
				<div class="launch"><slot name="launch"></slot></div>
			</div>

			<template v-if="active">
				<!-- Bande de chiffres : des cases séparées par un filet, pas des tuiles
				     flottantes — sur le panneau v3 une tuile de la même surface ne se
				     voyait pas. -->
				<div class="stats">
					<div class="stat results">
						<div class="value">
							<span class="win">{{ summary.wins }}</span>
							<span class="sep">/</span>
							<span class="draw">{{ summary.draws }}</span>
							<span class="sep">/</span>
							<span class="defeat">{{ summary.defeats }}</span>
						</div>
						<div class="label">{{ t('fast_batch_results') }}</div>
					</div>

					<div class="stat">
						<div class="value" :class="{ positive: summary.talent > 0, negative: summary.talent < 0 }">
							<img src="/image/talent.png">
							{{ signed(summary.talent) }}
						</div>
						<div class="label">{{ t('main.talent') }}</div>
					</div>

					<div class="stat">
						<div class="value">{{ $filters.number(summary.habs) }} <span class="hab"></span></div>
						<div class="label">{{ t('main.habs') }}</div>
					</div>

					<div class="stat">
						<div class="value">{{ $filters.number(summary.xp) }}</div>
						<div class="label">{{ t('main.xp') }}</div>
					</div>

					<div v-if="summary.levelups" class="stat">
						<div class="value"><v-icon>mdi-arrow-up-thick</v-icon> {{ summary.levelups }}</div>
						<div class="label">{{ t('fast_batch_levelups') }}</div>
					</div>

					<div v-if="summary.trophies" class="stat">
						<div class="value"><v-icon>mdi-trophy</v-icon> {{ summary.trophies }}</div>
						<div class="label">{{ t('fast_batch_trophies') }}</div>
					</div>

					<div v-if="summary.rareloot" class="stat">
						<div class="value"><v-icon>mdi-leaf</v-icon> {{ summary.rareloot }}</div>
						<div class="label">{{ t('fast_batch_rareloot') }}</div>
					</div>

					<div v-if="summary.chests" class="stat">
						<div class="value"><v-icon>mdi-treasure-chest</v-icon> {{ summary.chests }}</div>
						<div class="label">{{ t('fast_batch_chests') }}</div>
					</div>

					<div class="stat">
						<div class="value">{{ summary.duration }}</div>
						<div class="label">{{ t('fast_batch_avg_duration') }}</div>
					</div>

					<div class="stat">
						<div class="value">{{ $filters.number(summary.generation_time) }} <span class="unit">ms</span></div>
						<div class="label">{{ t('fast_batch_avg_generation') }}</div>
					</div>
				</div>

				<div v-if="hasResources" class="resources-row">
					<span class="label">{{ t('main.resources') }}</span>
					<fight-resources :resources="summary.resources" :size="30" />
				</div>

				<fights-history :fights="fights" :progress="progress" />
			</template>
		</template>
	</panel>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import type { Fight } from '@/model/fight'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useLiveHistory } from '@/model/use-live-history'
	import FightsHistory from '@/component/history/fights-history.vue'
	import FightResources from '@/component/report/fight-resources.vue'

	// Pas de dictionnaire propre : les clés vivent dans garden.*, avec le reste du potager.
	defineOptions({ name: 'GardenBatch', mixins: [...mixins] })

	interface BatchSummary {
		total: number
		finished: number
		wins: number
		draws: number
		defeats: number
		talent: number
		habs: number
		xp: number
		levelups: number
		trophies: number
		rareloot: number
		chests: number
		resources: {[key: number]: number}
		duration: number
		generation_time: number
	}

	const props = defineProps<{
		ids: number[]
		/** Requête de lancement en vol : le lot n'a pas encore ses identifiants. */
		launching?: boolean
	}>()
	const emit = defineEmits<{
		'close': []
	}>()

	const t = useNamespacedT('garden')

	function emptySummary(total: number): BatchSummary {
		return {
			total, finished: 0, wins: 0, draws: 0, defeats: 0,
			talent: 0, habs: 0, xp: 0,
			levelups: 0, trophies: 0, rareloot: 0, chests: 0,
			resources: {}, duration: 0, generation_time: 0,
		}
	}

	const fights = ref<Fight[]>([])
	const summary = ref<BatchSummary>(emptySummary(props.ids.length))
	/** Le résumé affiché vient-il du serveur ? Faux tant que la 1re réponse n'est pas là. */
	const loaded = ref(false)

	function reload() {
		if (!props.ids.length) return
		LeekWars.post<{ fights: Fight[], summary: BatchSummary }>('garden/get-batch', { fights: props.ids }).then(data => {
			fights.value = data.fights
			summary.value = data.summary
			loaded.value = true
		})
	}

	watch(() => props.ids, (ids, previous) => {
		if (!ids.length) {
			fights.value = []
			summary.value = emptySummary(0)
			loaded.value = false
			return
		}
		// Aucun combat en commun = ce n'est pas une relance mais un AUTRE lot (autre
		// poireau, autre compo, autre boss) : on repart d'un résumé vide, sans quoi les
		// chiffres du lot précédent resteraient affichés le temps de la requête.
		if (!previous || !ids.some(id => previous.includes(id))) {
			fights.value = []
			summary.value = emptySummary(ids.length)
		} else {
			// Relance cumulée : on garde les chiffres à l'écran et on corrige juste le
			// total, pour que le « X / Y » soit juste avant même la réponse.
			summary.value = { ...summary.value, total: ids.length }
		}
		loaded.value = false
		reload()
	}, { immediate: true })

	// Barres de progression des combats en génération + rechargement débouncé dès qu'un
	// combat du lot se termine (même composable que la page d'historique).
	const { progress } = useLiveHistory({
		type: 'farmer',
		id: () => store.state.farmer?.id,
		fights: () => fights.value,
		reload,
	})

	/** Un lot existe (ou part) : la barre d'état et les chiffres ont quelque chose à dire. */
	const active = computed(() => props.launching || props.ids.length > 0)
	const pending = computed(() => props.launching || !props.ids.length || !loaded.value || summary.value.finished < summary.value.total)
	const percent = computed(() => summary.value.total ? Math.round(100 * summary.value.finished / summary.value.total) : 0)
	const hasResources = computed(() => Object.keys(summary.value.resources || {}).length > 0)

	function signed(n: number) {
		return n > 0 ? '+' + n : String(n)
	}
</script>

<style lang="scss" scoped>
	// Intitulé de chiffre : les petites capitales espacées de la police d'affichage,
	// comme les actions de panneau (`.panel-action`). En v2 la police d'affichage
	// est Roboto : l'intitulé y reste un simple libellé en capitales.
	%caption {
		font-family: var(--font-display);
		letter-spacing: -0.0769em;  /* une case de grille */
		font-weight: 700;
		font-size: 11px;
		text-transform: uppercase;
		color: var(--text-color-secondary);
	}

	.batch-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 10px;
		border-bottom: 1px solid var(--border);
		// Sans lot, le bouton est seul dans le panneau : centré, avec la même
		// respiration au-dessus et en dessous, et sans filet sous lui (rien ne suit).
		&.idle {
			justify-content: center;
			padding: 14px 10px;
			border-bottom: none;
		}
	}
	.batch-status {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1 1 0;
		min-width: 0;
	}
	.status-icon {
		flex: 0 0 auto;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		// Le loader porte 30px de padding interne, prévu pour trôner seul au milieu
		// d'une page : ici il tient dans la ligne.
		:deep(.loader) {
			padding: 0;
			margin: 0;
			line-height: 0;
		}
		.done {
			font-size: 24px;
			color: var(--primary);
		}
	}
	.status-body {
		flex: 1 1 0;
		min-width: 0;
		max-width: 360px;
	}
	.status-label {
		@extend %caption;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.progress-track {
		margin-top: 5px;
		height: 6px;
		background: var(--background-input);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-tiny);
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: var(--primary-surface);
		transition: width 0.3s ease;
	}
	.launch {
		flex: 0 0 auto;
	}
	// En v3 le bouton d'accent porte l'ombre pixel (3 px à droite et en bas, hors
	// de sa boîte) : sans compensation l'œil voit 7 px sous le bouton et 9 à sa
	// droite contre 10 au-dessus (retour de Pierre). On lui rend ces 3 px.
	body:not(.v2) .launch {
		padding: 0 3px 3px 0;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		// Les filets entre les cases sont le fond qui passe dans les gouttières : un
		// seul trait quel que soit le nombre de rangées. En flex et non en grille :
		// les cases d'une rangée incomplète s'élargissent pour la remplir, là où une
		// grille laissait le fond à nu sur les colonnes vides.
		gap: 1px;
		background: var(--border);
		border-bottom: 1px solid var(--border);
	}
	.stat {
		flex: 1 1 120px;
		background: var(--panel-background);
		padding: 10px 8px 8px;
		text-align: center;
		.value {
			font-size: 20px;
			line-height: 24px;
			font-weight: bold;
			// Chiffres tabulaires : les valeurs bougent à chaque combat terminé, la
			// grille ne doit pas trembler.
			font-variant-numeric: tabular-nums;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 4px;
			img {
				width: 18px;
				height: 18px;
			}
			.v-icon {
				font-size: 20px;
				color: var(--text-color-secondary);
			}
			.unit {
				font-size: 12px;
				font-weight: normal;
				color: var(--text-color-secondary);
			}
			&.positive { color: var(--result-win-text); }
			&.negative { color: var(--result-defeat-text); }
		}
		.label {
			@extend %caption;
			margin-top: 4px;
		}
	}
	.results .value {
		.win { color: var(--result-win-text); }
		.draw { color: var(--result-draw); }
		.defeat { color: var(--result-defeat-text); }
		.sep { color: var(--text-color-faint); font-weight: normal; }
	}
	.resources-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 8px 12px;
		border-bottom: 1px solid var(--border);
		.label {
			@extend %caption;
		}
	}
	// Sous 700px l'état et le lanceur ne tiennent plus côte à côte : le lanceur
	// passe dessous, centré, et la jauge prend toute la largeur.
	@media screen and (max-width: 700px) {
		.batch-bar {
			flex-direction: column;
			align-items: stretch;
		}
		.status-body {
			max-width: none;
		}
		.launch {
			display: flex;
			justify-content: center;
		}
	}
</style>
