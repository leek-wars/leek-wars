<template lang="html">
	<img :src="url" class="avatar" loading="lazy" v-bind="$attrs">
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Farmer } from '@/model/farmer'
import { LeekWars } from '@/model/leekwars'

defineOptions({ name: 'avatar' })

const props = defineProps<{
	farmer?: Farmer
}>()

const url = computed(() => {
	if (props.farmer) {
		if (props.farmer.id > 0) {
			if (props.farmer.avatar_changed > 0) {
				return LeekWars.AVATAR + 'avatar/' + props.farmer.id + '.png?' + props.farmer.avatar_changed
			}
		} else if (props.farmer.id === 0) {
			return '/image/lw_avatar.png'
		}
	}
	return '/image/no_avatar.png'
})
</script>

<style lang="scss" scoped>
	img {
		background: var(--pure-white);
		border-radius: 50%;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		object-fit: cover;
	}
</style>