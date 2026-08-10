<template lang="html">
	<img :src="url" :alt="team?.name ?? ''" class="emblem">
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LeekWars } from '@/model/leekwars'
import type { Team } from '@/model/team'

defineOptions({ name: 'Emblem' })

const props = defineProps<{
	team: Team
}>()

const url = computed(() => {
	if (props.team.emblem_changed > 0) {
		return LeekWars.AVATAR + 'emblem/' + props.team.id + '.png?' + props.team.emblem_changed
	}
	return '/image/no_emblem.png'
})
</script>

<style lang="scss" scoped>
	img {
		border-radius: 7px;
		background: var(--pure-white);
		box-shadow: var(--elevation-1);
		object-fit: cover;
	}
</style>