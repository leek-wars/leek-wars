<template lang="html">
	<img :src="url" :alt="farmer?.name ?? ''" class="avatar" loading="lazy" v-bind="$attrs">
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Farmer } from '@/model/farmer'
import { LeekWars } from '@/model/leekwars'

defineOptions({ name: 'Avatar' })

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
		box-shadow: var(--elevation-1);
		object-fit: cover;
	}
</style>