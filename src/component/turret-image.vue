<template lang="html">
	<svg :viewBox="'0 0 ' + width + ' ' + height" :width="width * scale" :height="height * scale">
		<image v-for="(piece, p) of pieces" :key="p" :x="(width - piece.w) / 2" :y="height - piece.z" :xlink:href="'/image/turret/' + piece.t + skinName + '.png'" />
	</svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TURRET_DATA, TURRET_PIECE_SIZE } from '@/model/turret-data'

const props = defineProps<{
	level: number
	skin: number
	scale: number
}>()

const data_ = computed(() => TURRET_DATA[Math.floor(props.level / 10)])

const offset = computed(() => TURRET_PIECE_SIZE[data_.value[0].t][1] * 0.3 - data_.value[0].z)

const pieces = computed(() => {
	let z = offset.value
	return data_.value.map(piece => ({
		t: piece.t,
		w: TURRET_PIECE_SIZE[piece.t][0],
		z: (z += piece.z) / 0.3
	}))
})

const height = computed(() => (data_.value.reduce((s, p) => s + p.z, 0) + offset.value) / 0.3)
const width = computed(() => pieces.value.reduce((w, p) => Math.max(w, p.w), 0))
const skinName = computed(() => props.skin === 1 ? '_blue' : '_red')
</script>
