<template lang="html">
	<div class="map" oncontextmenu="return false;">
		<div class="map-wrapper">
			<div v-for="(line, l) of map" :key="l" class="line">
				<span v-for="(cell, c) of line" :key="c" :class="{disabled: !cell.enabled, obstacle: cell.obstacle}" class="cell"></span>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { env } from '@/env'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: "lw-map" })
	export default class Map extends Vue {
		@Prop() cells!: Set<number>
		map: any = []

		@Watch('cells', {immediate: true})
		update() {
			const size = 34
			this.map = []
			for (let i = 0; i <= size; ++i) {
				const line = []
				for (let j = 0; j <= size; ++j) {
					const y = i - Math.floor(size / 2)
					const x = j - Math.floor(size / 2)
					const enabled = Math.abs(x) + Math.abs(y) <= size / 2
					const team = j < (size * (5 / 6) - i) ? 1 : (j > (size * (7 / 6) - i) ? 2 : 0)
					const cell = 306 + 18 * y - 17 * x
					const obstacle = this.cells.has(cell)
					line.push({enabled, cell, team, obstacle})
				}
				this.map.push(line)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.map {
		height: 430px;
		width: 800px;
		overflow: hidden;
		margin-top: -20px;
	}
	.map-wrapper {
		transform: scale(1, 0.5) rotate(-45deg);
		margin-top: -300px;
		margin-left: -110px;
	}
	.map .line {
		white-space: nowrap;
	}
	.map .cell {
		width: 27px;
		height: 27px;
		display: inline-block;
		border: 1px solid #888;
		margin: 2px;
		cursor: pointer;
		border-radius: 2px;
		background: white;
		vertical-align: top;
	}
	.map .cell.disabled {
		border: 1px solid transparent;
		background: transparent;
	}
	.map .cell:not(.disabled).obstacle {
		background: #666;
	}
</style>