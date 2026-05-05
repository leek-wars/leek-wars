<template>
	<rich-tooltip-farmer v-if="farmer" :id="farmer.id">
		<router-link :to="'/farmer/' + farmer.id">
			<span class="pseudo" :class="{me: $store.state.farmer?.id === farmer.id}">{{ farmer.name }}</span>
		</router-link>
	</rich-tooltip-farmer>
</template>

<script setup lang="ts">
import type { Farmer } from '@/model/farmer'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

defineOptions({ name: 'lw-pseudo' })

defineProps<{
	farmer: Farmer
}>()
</script>

<style lang="scss" scoped>
	.pseudo {
		color: var(--text-color);
		font-weight: 500;
		cursor: pointer;
		border-radius: 5px;
		padding: 0 2px;
		background: var(--background);
		&:before {
			content: "@";
		}
		&:hover {
			background: var(--pure-white);
		}
		&.me {
			color: rgb(0, 121, 243);
		}
	}
</style>