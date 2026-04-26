<template lang="html">
	<div class="history">
		<div v-for="(tournament, t) in tournaments" :key="t" class="wrapper">
			<tournament-history :tournament="tournament" :show-time="showTime" />
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Tournament } from '@/model/tournament'
import TournamentHistory from '@/component/history/tournament-history.vue'

defineOptions({ name: 'tournaments-history' })

defineProps<{
	tournaments: Tournament[]
	showTime?: boolean
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
</style>