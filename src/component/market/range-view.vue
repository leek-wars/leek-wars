<template lang="html">
	<table class="area">
		<tr v-for="(row, r) in cells" :key="r">
			<td v-for="(cell, c) in row" :key="c" :class="cell"></td>
		</tr>
	</table>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'range-view' })

const props = defineProps<{
	min: number
	max: number
	type: number
}>()

const cells = computed(() => {
	const result: string[][] = []
	if (props.max === 50) return result
	const max = (props.type === 9 || props.type === 10) ? props.max : (props.type & 1 ? props.max : (props.type & 4 ? props.max - 1 : props.max / 2))
	for (let i = 0; i < max * 2 + 1; ++i) {
		result[i] = []
		for (let j = 0; j < max * 2 + 1; ++j) {
			const x = i - max
			const y = j - max
			if (props.type === 9) {
				result[i][j] = (Math.abs(x) === Math.abs(y)) ? 'full' : ''
			} else if (props.type === 10) {
				result[i][j] = (Math.abs(x) <= props.max || Math.abs(y) <= props.max) ? 'full' : ''
			} else {
				const in_range = Math.abs(x) + Math.abs(y) <= props.max && Math.abs(x) + Math.abs(y) >= props.min
				const condition = ((props.type & 1) && (x === 0 || y === 0))
					|| ((props.type & 2) && Math.abs(x) === Math.abs(y))
					|| ((props.type & 4) && ((x === 0 && y === 0) || (Math.abs(x) !== Math.abs(y) && x !== 0 && y !== 0)))
				result[i][j] = in_range && condition ? 'full' : ''
			}
		}
	}
	return result
})
</script>