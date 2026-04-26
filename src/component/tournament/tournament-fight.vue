<template>
	<a :xlink:href="link" @click="click">
		<rect :x="x" :y="y" :class="{'no-fight': !fight}" class="fight" :width="30" :height="30" />
		<image v-if="fight" :x="x + 6" :y="y + 6" :width="18" :height="18" xlink:href="/image/icon/garden.png" />
	</a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'tournament-fight' })

const props = defineProps<{
	fight: any
	x: number
	y: number
}>()

const router = useRouter()

const link = computed(() => props.fight ? props.fight : null)

function click(e: Event) {
	if (props.fight) router.push(props.fight)
	e.preventDefault()
}
</script>

<style lang="scss" scoped>
	.fight {
		stroke: var(--background-disabled);
		stroke-width: 2;
	}
	.no-fight {
		fill: var(--background);
		stroke-dasharray: 5.5;
	}
	.fight:not(.no-fight) {
		fill: #777;
	}
</style>