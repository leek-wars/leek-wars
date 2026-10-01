<template lang="html">
	<div class="history" :class="{ 'full-rows': fullRows }">
		<div v-for="fight in fights" :key="fight.id" class="wrapper">
			<fight-history :fight="fight" :progress="progress && progress[fight.id]" />
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Fight } from '@/model/fight'
import FightHistory from '@/component/history/fight-history.vue'

defineOptions({ name: 'FightsHistory' })

defineProps<{
	fights: Fight[]
	progress?: Record<number, number>
	/** Au plus douze combats, et seulement des rangées complètes. */
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
	// Jamais de rangée incomplète : 6 combats sur une ou deux colonnes, puis
	// trois rangées au plus — 9 sur 3 colonnes, 12 sur 4, 10 sur 5, 12 sur 6
	// (le `100% / 7 + 1px` interdit une septième colonne). Les seuils des
	// requêtes suivent les 250 px minimum d'une colonne.
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