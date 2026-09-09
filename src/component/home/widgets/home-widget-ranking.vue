<template>
	<div class="remarkable-widget">
		<loader v-if="!loaded" />
		<div v-else ref="listEl" class="players">
			<router-link v-for="p in visiblePlayers" :key="p.id" v-ripple :to="'/farmer/' + p.id" class="player">
				<img :src="LeekWars.getAvatar(p.id, p.avatar_changed)" class="avatar" loading="lazy">
				<div class="info">
					<div class="name-line">
						<span class="name">{{ p.name }}</span>
						<flag v-if="p.country" :code="p.country" :clickable="false" class="flag" />
					</div>
					<span class="reason">{{ reasonText(p.reason) }}</span>
				</div>
			</router-link>
			<div v-if="!players.length" class="none">{{ t('nobody') }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { useNamespacedT } from '@/model/i18n'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'

	defineOptions({ name: 'HomeWidgetRanking' })

	const t = useNamespacedT('home')

	interface Reason { type: string, value: number, rank: number }
	interface Player { id: number, name: string, avatar_changed: number, country: string | null, reason: Reason }

	// Charge utile de la requête groupée de l'accueil (cf. home.vue) : `undefined`
	// tant qu'elle est en vol, `null` si ce widget n'en a rien tiré.
	const props = defineProps<{ data?: { players: Player[] } | null }>()

	const loaded = ref(false)
	const players = ref<Player[]>([])

	// Autant de joueurs que la hauteur du panel en laisse tenir entiers, jamais
	// plus que les dix servis par l'API (`getRemarkablePlayers`).
	const listEl = ref<HTMLElement | null>(null)
	const playerCount = useFitCount(listEl, '.player', 10)
	const visiblePlayers = computed(() => players.value.slice(0, playerCount.value))

	function reasonText(r: Reason): string {
		switch (r.type) {
			case 'top_talent': return t('reason_top_talent', [r.rank])
			case 'forum_messages': return t('reason_forum_messages', [r.value])
			case 'trophies': return t('reason_trophies', [r.value])
			case 'likes': return t('reason_likes', [r.value])
			default: return ''
		}
	}

	function load() {
		LeekWars.get<{ players: Player[] }>('farmer/get-remarkable').then((data) => {
			players.value = data.players ?? []
			loaded.value = true
		}).error(() => { loaded.value = true })
	}

	watch(() => props.data, (data) => {
		if (data === undefined) return
		if (data === null) { load(); return }
		players.value = data.players ?? []
		loaded.value = true
	}, { immediate: true })
</script>

<style lang="scss" scoped>
	.remarkable-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	// La liste occupe toute la hauteur ; on n'affiche que les rangées entières
	// (useFitCount), overflow hidden en filet.
	.players {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	.player {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 8px;
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text-color);
	}
	.player:hover {
		background: var(--background-secondary);
	}
	.avatar {
		width: 34px;
		height: 34px;
		border-radius: var(--radius);
		flex-shrink: 0;
	}
	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.name-line {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.name {
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.player:deep(.flag) {
		height: 13px;
		flex-shrink: 0;
	}
	// Une seule ligne : sur un panel étroit, la raison passait sur deux lignes et
	// les rangées n'avaient plus la même hauteur — useFitCount les suppose
	// homogènes et en laissait dépasser une.
	.reason {
		font-size: 12px;
		color: var(--text-color-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
