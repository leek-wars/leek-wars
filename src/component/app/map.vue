<template lang="html">
	<div class="map" oncontextmenu="return false;">
		<div class="map-wrapper">
			<div v-for="(line, l) of map" :key="l" class="line">
				<span v-for="(cell, c) of line" :key="c" :class="{enabled: cell.enabled, obstacle: cell.obstacle, ...cell.teams}" :style="{background: cell.color}" class="cell"></span>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { env } from '@/env'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { TEAM_COLORS } from '@/model/team'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: "lw-map" })
	export default class Map extends Vue {
		@Prop() obstacles!: Set<number>
		@Prop() teams!: {[key: number]: Set<number>}
		map: any = []

		@Watch('obstacles', {immediate: true})
		@Watch('teams')
		update() {
			const size = 34
			this.map = []
			for (let i = 0; i <= size; ++i) {
				const line = []
				for (let j = 0; j <= size; ++j) {
					const y = i - Math.floor(size / 2)
					const x = j - Math.floor(size / 2)
					const enabled = Math.abs(x) + Math.abs(y) <= size / 2
					const cell = 306 + 18 * y - 17 * x
					let obstacle = false
					const teams = {} as any
					let color = ""
					if (enabled) {
						obstacle = this.obstacles.has(cell)
						for (const team in this.teams) {
							if (this.teams[team].has(cell)) {
								teams['t' + team] = true
								color = TEAM_COLORS[parseInt(team, 10) - 1]
							}
						}
					}
					line.push({enabled, cell, teams, obstacle, color})
				}
				this.map.push(line)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.map {
		width: 100%;
		overflow: hidden;
	}
	.map-wrapper {
		transform: scale(1.38, 0.724) rotate(-45deg);
		margin: -23.2% 0;
	}
	.map .line {
		display: flex;
		width: 100%;
	}
	.map .cell {
		width: calc(2.45%);
		padding-bottom: calc(2.45% - 2px);
		display: inline-block;
		margin: 0.2%;
		cursor: pointer;
		border-radius: 2px;
		vertical-align: top;
		border: 1px solid transparent;
		&.enabled {
			background: white;
			border: 1px solid #888;
		}
		&.obstacle {
			background: #333;
		}
		&.t1.t2 {
			background: rgb(200, 0, 255) !important;
		}
	}
</style>