<template lang="html">
	<img :src="url" class="emblem">
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LeekWars } from '@/model/leekwars'
import type { Team } from '@/model/team'

defineOptions({ name: 'emblem' })

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
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		object-fit: cover;
	}
</style>