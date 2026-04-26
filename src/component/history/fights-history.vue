<template lang="html">
	<div class="history">
		<div v-for="fight in fights" :key="fight.id" class="wrapper">
			<fight-history :fight="fight" />
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Fight } from '@/model/fight'
import FightHistory from '@/component/history/fight-history.vue'

defineOptions({ name: 'fights-history' })

defineProps<{
	fights: Fight[]
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