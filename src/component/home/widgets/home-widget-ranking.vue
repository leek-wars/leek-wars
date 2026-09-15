<template>
	<div class="remarkable-widget">
		<loader v-if="!loaded" />
		<div v-else ref="listEl" class="players" :style="{ '--row-height': ROW_HEIGHT + 'px' }">
			<router-link v-for="p in visiblePlayers" :key="p.id" v-ripple :to="'/farmer/' + p.id" class="player">
				<img :src="LeekWars.getAvatar(p.id, p.avatar_changed)" class="avatar" loading="lazy">
				<div class="info">
					<div class="name-line">
						<!-- Couleur de grade (admin, modérateur, référent, contributeur),
						     comme au forum : le serveur envoie la classe, pas la teinte. -->
						<span class="name" :class="p.color">{{ p.name }}</span>
						<flag v-if="p.country" :code="p.country" :clickable="false" class="flag" />
					</div>
					<span class="reason">
						<v-icon class="reason-icon">{{ reasonIcon(p.reason) }}</v-icon>
						<span class="reason-text">{{ reasonText(p.reason) }}</span>
					</span>
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

	// Nombre de joueurs servis par l'API (`getRemarkablePlayers`), et hauteur
	// naturelle d'une rangée : celles retenues s'étirent pour remplir le panneau,
	// donc leur hauteur rendue ne peut plus dire combien il en tient.
	const PLAYERS = 15
	const ROW_HEIGHT = 42

	interface Reason { type: string, value: number, rank: number }
	// `color` : classe de grade servie par le serveur (admin, moderator, referent,
	// contributor), vide pour la plupart des joueurs.
	interface Player { id: number, name: string, avatar_changed: number, country: string | null, color?: string, reason: Reason }

	// Charge utile de la requête groupée de l'accueil (cf. home.vue) : `undefined`
	// tant qu'elle est en vol, `null` si ce widget n'en a rien tiré.
	const props = defineProps<{ data?: { players: Player[] } | null }>()

	const loaded = ref(false)
	const players = ref<Player[]>([])

	// Autant de joueurs que la hauteur du panel en laisse tenir entiers, jamais
	// plus que ceux servis par l'API (`getRemarkablePlayers`).
	const listEl = ref<HTMLElement | null>(null)
	const playerCount = useFitCount(listEl, '.player', PLAYERS, 0, ROW_HEIGHT)
	const visiblePlayers = computed(() => players.value.slice(0, playerCount.value))

	// Un glyphe par vivier, celui du concept (cf. ICONS.md) : le classement pour
	// le talent, la coupe pour les trophées, les bulles pour le forum, le cœur
	// pour les j'aime — le même que le compteur de la page éleveur.
	function reasonIcon(r: Reason): string {
		switch (r.type) {
			case 'top_talent': return 'mdi-podium'
			case 'forum_messages': return 'mdi-forum'
			case 'trophies': return 'mdi-trophy'
			case 'likes': return 'mdi-heart'
			default: return ''
		}
	}

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
	// Les rangées retenues se partagent TOUTE la hauteur du panneau : pas de blanc
	// résiduel en bas, et c'est `--row-height`, leur hauteur naturelle, qui décide
	// combien il en tient.
	.player {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1 1 auto;
		min-height: var(--row-height);
		padding: 4px 8px;
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
		flex: 1 1 auto;
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
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 0;
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.reason-text {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.reason-icon {
		font-size: 14px;
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		color: inherit;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
