<template lang="html">
	<div class="map">
		<div v-for="(row, i) in map" :key="i" class="row">
			<div v-for="(cell, j) in row" :key="j" :class="{obstacle: cell === 1, los: cell === 2, red: cell === 3}" class="cell" @click="clickCell(j, i)"></div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LeekWars } from '@/model/leekwars'

const width = 40
const height = 25
const map = ref<number[][]>([])

for (let h = 0; h < height; ++h) {
	const row = []
	for (let w = 0; w < width; ++w) {
		row.push(Math.random() > 0.8 ? 1 : 0)
	}
	map.value.push(row)
}
LeekWars.setTitle('Line Of Sight')

function los(x1: number, y1: number, x2: number, y2: number) {
	const a = Math.abs(y1 - y2)
	const b = Math.abs(x1 - x2)
	const dx = x1 > x2 ? -1 : 1
	const dy = y1 < y2 ? 1 : -1
	const path = []
	if (b === 0) {
		path.push(0, a + 1)
	} else {
		const d = a / b / 2
		let h = 0
		for (let i = 0; i < b; ++i) {
			const y = 0.5 + (i * 2 + 1) * d
			const ry = Math.ceil(y)
			if (ry === y) {
				path.push(h, y - h)
				h = y
			} else {
				path.push(h, ry - h)
				h = ry - 1
			}
		}
		path.push(h, a + 1 - h)
	}
	for (let p = 0; p < path.length; p += 2) {
		for (let i = 0; i < path[p + 1]; ++i) {
			if (map.value[y1 + (path[p] + i) * dy][x1 + (p / 2) * dx] === 1) {
				return false
			}
		}
	}
	return true
}

function clickCell(x: number, y: number) {
	if (map.value[y][x] === 1) {
		for (let h = 0; h < height; ++h) {
			for (let w = 0; w < width; ++w) {
				if (map.value[h][w] !== 1) {
					map.value[h][w] = 0
				}
			}
		}
	} else {
		for (let h = 0; h < height; ++h) {
			for (let w = 0; w < width; ++w) {
				if (map.value[h][w] !== 1) {
					map.value[h][w] = los(x, y, w, h) ? 2 : 0
				}
			}
		}
		map.value[y][x] = 3
	}
}
</script>

<style lang="scss" scoped>
	.map {
		width: calc(100% - 0.5px);
	}
	.content {
		padding: 0;
	}
	.row {
		display: flex;
	}
	.cell {
		aspect-ratio: 1;
		background: #ddd;
		margin: 0.5px;
		cursor: pointer;
		flex: 1;
	}
	.cell.obstacle {
		background: black;
	}
	.cell.los {
		background: #5fad1b;
	}
	.cell.red {
		background: red;
	}
</style>