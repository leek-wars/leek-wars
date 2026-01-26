<template lang="html">
	<table class="area">
		<tr v-for="(row, r) in cells" :key="r">
			<td v-for="(cell, c) in row" :key="c" :class="cell"></td>
		</tr>
	</table>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'
	@Options({ name: 'range-view' })
	export default class RangeView extends Vue {
		@Prop() min!: number
		@Prop() max!: number
		@Prop() type!: number
		get cells() {
			const cells: string[][] = []
			if (this.max === 50) return cells
			const max = (this.type === 9 || this.type === 10) ? this.max : (this.type & 1 ? this.max : (this.type & 4 ? this.max - 1 : this.max / 2))
			for (let i = 0; i < max * 2 + 1; ++i) {
				cells[i] = []
				for (let j = 0; j < max * 2 + 1; ++j) {
					const x = i - max
					const y = j - max
					if (this.type === 9) { // X
						cells[i][j] = (Math.abs(x) === Math.abs(y)) ? "full" : ""
					} else if (this.type === 10) { // Carré
						cells[i][j] = (Math.abs(x) <= this.max || Math.abs(y) <= this.max) ? "full" : ""
					} else {
						const in_range = Math.abs(x) + Math.abs(y) <= this.max && Math.abs(x) + Math.abs(y) >= this.min
						const condition = ((this.type & 1) && (x === 0 || y === 0))
							|| ((this.type & 2) && Math.abs(x) === Math.abs(y))
							|| ((this.type & 4) && ((x === 0 && y === 0) || (Math.abs(x) !== Math.abs(y) && x !== 0 && y !== 0)))
						cells[i][j] = in_range && condition ? "full" : ""
					}
				}
			}
			return cells
		}
	}
</script>