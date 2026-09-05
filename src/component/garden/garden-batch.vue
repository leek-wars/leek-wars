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
			<div v-if="!ids.length && !launching" class="batch-hint">{{ t('fast_garden_hint') }}</div>
			<!-- Le bouton de lancement vit ICI et nulle part ailleurs. Il est fourni par le
			     potager, seul à savoir quel poireau / quelle compo / quel boss est
			     sélectionné ; le panneau n'affiche que le lot. -->
			<div class="launch-row"><slot name="launch"></slot></div>
			<template v-if="ids.length || launching">
				<div class="batch-body">
					<!-- Loader en grand à gauche tant que le lot n'est pas complet : le temps
					     d'attente est ici, entre le clic et le dernier combat généré. -->
					<div v-if="pending" class="batch-loader">
						<loader :size="150" />
						<div class="loader-label">
							<template v-if="launching || !summary.total">{{ t('fast_batch_launching') }}</template>
							<template v-else>{{ t('fast_batch_progress', [summary.finished, summary.total]) }}</template>
						</div>
					</div>

					<div class="batch-main">
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
								<div class="value">{{ $filters.number(summary.generation_time) }} ms</div>
								<div class="label">{{ t('fast_batch_avg_generation') }}</div>
							</div>
						</div>

						<div v-if="hasResources" class="resources-row">
							<span class="resources-label">{{ t('main.resources') }}</span>
							<fight-resources :resources="summary.resources" :size="30" />
						</div>
					</div>
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

	const pending = computed(() => props.launching || !props.ids.length || !loaded.value || summary.value.finished < summary.value.total)
	const hasResources = computed(() => Object.keys(summary.value.resources || {}).length > 0)

	function signed(n: number) {
		return n > 0 ? '+' + n : String(n)
	}
</script>

<style lang="scss" scoped>
	.batch-hint {
		padding: 14px 15px 0;
		color: var(--text-color-secondary);
		text-align: center;
	}
	.launch-row {
		display: flex;
		justify-content: center;
		padding: 14px 10px 4px;
	}
	.batch-body {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px 0;
	}
	.batch-loader {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		// Le loader porte déjà 30px de padding interne : on ne rajoute que ce qu'il
		// faut pour que les tuiles ne viennent pas coller la pluie.
		padding-right: 6px;
		.loader-label {
			font-size: 13px;
			color: var(--text-color-secondary);
			text-align: center;
			margin-top: -18px;
		}
	}
	.batch-main {
		flex: 1 1 0;
		min-width: 0;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 6px;
	}
	.stat {
		background: var(--background-secondary);
		border-radius: var(--radius-medium);
		padding: 8px 6px;
		text-align: center;
		.value {
			font-size: 17px;
			font-weight: bold;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 3px;
			img {
				width: 18px;
				height: 18px;
			}
			.v-icon {
				font-size: 18px;
			}
			&.positive { color: var(--result-win-text); }
			&.negative { color: var(--result-defeat-text); }
		}
		.label {
			font-size: 12px;
			color: var(--text-color-secondary);
			margin-top: 2px;
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
		gap: 8px;
		margin-top: 8px;
		.resources-label {
			font-size: 12px;
			color: var(--text-color-secondary);
		}
	}
	// Sous 700px le loader et les tuiles ne tiennent plus côte à côte : la pluie
	// passe au-dessus plutôt que de comprimer les chiffres à l'illisible.
	@media screen and (max-width: 700px) {
		.batch-body {
			flex-direction: column;
			align-items: stretch;
		}
		.batch-loader {
			padding-right: 0;
		}
	}
</style>
