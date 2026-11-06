<template>
	<div class="history-widget">
		<loader v-if="loading" />
		<div v-else-if="visibleFights.length" ref="fightsEl" class="fights">
			<fights-history :fights="visibleFights" :progress="progress" />
		</div>
		<div v-else class="none">{{ fights.length ? t('no_matching_fight') : t('no_fight') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, defineAsyncComponent, ref, shallowRef, watch } from 'vue'
	import type { Fight } from '@/model/fight'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import { useLiveHistory } from '@/model/use-live-history'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'
	import { fightMatchesFilters, sanitizeFilters } from '@/component/history/history-filters'

	const FightsHistory = defineAsyncComponent(() => import('@/component/history/fights-history.vue'))
	defineOptions({ name: 'HomeWidgetHistory' })

	// `leek` : le poireau suivi ; absent, c'est l'historique de l'éleveur.
	// `filters` : ceux de la page d'historique (cf. history-filters.ts), réglés
	// depuis l'en-tête du panneau.
	const props = defineProps<{ params?: { leek?: number, filters?: unknown } }>()

	const t = useNamespacedT('home')

	// Plafond de sécurité : le panneau en montre autant que sa hauteur en loge,
	// mais jamais une semaine entière de combats d'un coup.
	const MAX_FIGHTS = 60

	// Le poireau choisi, validé contre ceux de l'éleveur : un poireau vendu, ou la
	// disposition rapportée d'un autre compte, retombe sur l'historique de
	// l'éleveur. Même règle que le titre et le lien du panneau (home.vue).
	const leekId = computed(() => {
		const chosen = props.params?.leek
		const mine = Object.values(store.state.farmer?.leeks ?? {})
		return chosen && mine.some(l => l.id === chosen) ? chosen : undefined
	})
	const sourceType = computed(() => leekId.value ? 'leek' : 'farmer')
	const sourceId = computed(() => leekId.value ?? store.state.farmer?.id)

	const filters = computed(() => sanitizeFilters(props.params?.filters))

	// La semaine de combats que renvoie le serveur, du plus récent au plus ancien.
	// Plusieurs centaines d'entrées pour un éleveur actif : pas de réactivité
	// profonde, la liste est remplacée d'un bloc à chaque rechargement.
	const fights = shallowRef<Fight[]>([])
	const loading = ref(true)
	const filteredFights = computed(() =>
		fights.value.filter(fight => fightMatchesFilters(fight, filters.value)))

	const fightsEl = ref<HTMLElement | null>(null)
	const fightCount = useFitCount(fightsEl, '.fight', MAX_FIGHTS)
	const visibleFights = computed(() => filteredFights.value.slice(0, fightCount.value))

	// Une réponse qui arrive après un changement de source (autre poireau, autre
	// compte) ne remplace pas la liste de la nouvelle.
	let request = 0
	function load() {
		const type = sourceType.value
		const id = sourceId.value
		if (!id) { loading.value = false; return }
		const current = ++request
		LeekWars.get<{ fights: Fight[] }>('history/get-' + type + '-history/' + id).then(data => {
			if (current !== request) return
			fights.value = data.fights ?? []
			loading.value = false
		}).error(() => {
			if (current === request) loading.value = false
		})
	}

	watch([sourceType, sourceId], () => {
		loading.value = true
		fights.value = []
		load()
	}, { immediate: true })

	// Combats en génération animés, et liste rechargée quand un combat de la
	// source commence ou se termine, comme sur la page d'historique.
	const { progress } = useLiveHistory({
		type: sourceType,
		id: () => sourceId.value,
		fights: () => fights.value,
		reload: load,
	})
</script>

<style lang="scss" scoped>
	.history-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	// La liste occupe toute la hauteur ; overflow hidden en filet de sécurité,
	// le nombre de combats affichés est calculé pour tenir sans couper.
	.fights {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	// Les cartes gardent la hauteur qu'elles ont partout ailleurs sur le site,
	// comme dans le widget « Talent et derniers combats ».
	.fights :deep(.history) {
		padding: 0;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px 0;
	}
</style>
