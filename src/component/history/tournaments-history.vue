<template lang="html">
	<div class="history" :class="{ 'full-rows': fullRows }">
		<div v-for="(tournament, t) in tournaments" :key="t" class="wrapper">
			<tournament-history :tournament="tournament" :show-time="showTime" />
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Tournament } from '@/model/tournament'
import TournamentHistory from '@/component/history/tournament-history.vue'

defineOptions({ name: 'TournamentsHistory' })

defineProps<{
	tournaments: Tournament[]
	showTime?: boolean
	/** Au plus douze tournois, et seulement des rangées complètes. */
	fullRows?: boolean
}>()
</script>

<style lang="scss" scoped>
	.history {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		flex-wrap: wrap;
		padding: 5px;
		.wrapper {
			flex-grow: 1;
		}
	}
	// Même grille que l'historique des combats (fights-history.vue) : 6 tournois
	// sur une ou deux colonnes, 9 sur 3, 12 sur 4, 10 sur 5, 12 sur 6.
	.history.full-rows {
		grid-template-columns: repeat(auto-fill, minmax(max(250px, 100% / 7 + 1px), 1fr));
		container: history / inline-size;
		.wrapper:nth-child(n + 13) {
			display: none;
		}
	}
	@container history (width < 750px) {
		.wrapper:nth-child(n + 7) {
			display: none;
		}
	}
	@container history (750px <= width < 1000px) {
		.wrapper:nth-child(n + 10) {
			display: none;
		}
	}
	@container history (1250px <= width < 1500px) {
		.wrapper:nth-child(n + 11) {
			display: none;
		}
	}
</style>