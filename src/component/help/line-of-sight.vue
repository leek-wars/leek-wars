<template lang="html">
	<div>
		<h1>Line of Sight</h1>
		<div class="panel">
			<div class="content">
				<div class="map">
					<div v-for="(row, i) in map" :key="i" class="row">
						<div v-for="(cell, j) in row" :key="j" :class="{obstacle: cell === 1, los: cell === 2, red: cell === 3}" class="cell" @click="clickCell(j, i)"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	
	@Component({})
	export default class LineOfSight extends Vue {
		width = 40
		height = 25
		map: number[][] = []
		created() {
			for (let h = 0; h < this.height; ++h) {
				const row = []
				for (let w = 0; w < this.width; ++w) {
					row.push(Math.random() > 0.8 ? 1 : 0)
				}
				this.map.push(row)
			}
			LeekWars.setTitle('Line Of Sight')
		}
		clickCell(x: number, y: number) {
			if (this.map[y][x] === 1) {
				for (let h = 0; h < this.height; ++h) {
					for (let w = 0; w < this.width; ++w) {
						if (this.map[h][w] !== 1) {
							Vue.set(this.map[h], w, 0)
						}
					}
				}
			} else {
				for (let h = 0; h < this.height; ++h) {
					for (let w = 0; w < this.width; ++w) {
						if (this.map[h][w] !== 1) {
							Vue.set(this.map[h], w, this.los(x, y, w, h) ? 2 : 0)
						}
					}
				}
				Vue.set(this.map[y], x, 3)
			}
		}
		los(x1: number, y1: number, x2: number, y2: number) {
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
					if (this.map[y1 + (path[p] + i) * dy][x1 + (p / 2) * dx] === 1) {
						return false
					}
				}
			}
			return true
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
		height: 26px;
		background: #ddd;
		margin: 0.5px;
		cursor: pointer;
		flex: 1;
	}
	.cell.obstacle {
		background: black;
	}
	.cell.los {
		background: #5FAD1B;
	}
	.cell.red {
		background: red;
	}
</style>