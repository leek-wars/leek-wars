<template>
	<div class="tournaments-widget">
		<loader v-if="!loaded" />
		<template v-else-if="winners.length">
			<router-link v-for="w in winners" :key="w.type" v-ripple :to="w.winner.link" class="winner">
				<v-icon class="cup">mdi-trophy</v-icon>
				<div class="info">
					<span class="type">{{ t(typeKey(w.type)) }}</span>
					<span class="name">{{ w.winner.name }}</span>
				</div>
			</router-link>
		</template>
		<div v-else class="none">{{ t('no_tournament') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({ name: 'HomeWidgetTournaments' })

	const t = useNamespacedT('home')

	interface Winner { tournament: number, type: number, date: number, winner: { name: string, link: string, farmer_id?: number, avatar_changed?: number } }
	const loaded = ref(false)
	const winners = ref<Winner[]>([])

	function typeKey(type: number): string {
		return type === 1 ? 'tournament_leek' : type === 2 ? 'tournament_team' : 'tournament_farmer'
	}

	LeekWars.get<{ winners: Winner[] }>('tournament/get-recent-winners').then((data) => {
		winners.value = data.winners ?? []
		loaded.value = true
	}).error(() => { loaded.value = true })
</script>

<style lang="scss" scoped>
	.tournaments-widget {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.winner {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text-color);
	}
	.winner:hover {
		background: var(--background-secondary);
	}
	.cup {
		color: #f1c40f;
		font-size: 28px;
	}
	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.type {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.name {
		font-weight: bold;
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
