<template lang="html">
	<table class="area">
		<tr v-for="(row, r) in cells" :key="r">
			<td v-for="(cell, c) in row" :key="c" :class="cell"></td>
		</tr>
	</table>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'range-view' })
	export default class RangeView extends Vue {
		@Prop() min!: number
		@Prop() max!: number
		@Prop() type!: number
		get cells() {
			const cells: string[][] = []
			for (let i = 0; i < this.max * 2 + 1; ++i) {
				cells[i] = []
				for (let j = 0; j < this.max * 2 + 1; ++j) {
					const x = i - this.max
					const y = j - this.max
					cells[i][j] = (Math.abs(x) + Math.abs(y) <= this.max && Math.abs(x) + Math.abs(y) >= this.min && (this.type === 1 || (x === 0 || y === 0))) ? "full" : ""
				}
			}
			return cells
		}
	}
</script>