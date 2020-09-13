<template>
	<div class="hud">
		<div class="life-bar">
			<div class="wrapper">
				<template v-for="team in game.teams">
					<tooltip v-for="entity in team" v-if="!entity.dead" :key="entity.id">
						<template v-slot:activator="{ on }">
							<div :style="{background: entity.lifeBarGadient, width: Math.max(1, barWidth * (entity.life / totalLife) - 3) + 'px'}" class="bar" v-on="on"></div>
						</template>
						{{ entity.name }} ({{ entity.life }})
					</tooltip>
				</template>
			</div>
		</div>
		<div v-if="debug" class="debug">
			<div>Particles : {{ game.particles.particles.length }}</div>
			<div>Mouse : ({{ game.mouseX }}, {{ game.mouseY }})</div>
			<div>Mouse tile : ({{ game.mouseTileX }}, {{ game.mouseTileY }})</div>
			<div>Mouse cell : <span v-if="game.mouseCell">{obstacle: {{ game.mouseCell.obstacle }}, entity: <span v-if="game.mouseCell.entity">{{ game.mouseCell.entity.name }}</span>, id: {{ game.mouseCell.id }}, x: {{ game.mouseCell.x }}, y: {{ game.mouseCell.y }}}</span></div>
			<div>FPS : {{ game.fps }}, avg: {{ game.avgFPS }}</div>
			<div>Resources : {{ game.numData }}</div>
		</div>
		<div v-if="!LeekWars.mobile" ref="leftPart" class="left-part">
			<div ref="actions" :style="{'margin-top': actionsMargin + 'px'}" class="actions">
				<template v-for="line of game.consoleLines">
					<action-element v-if="line.action" :key="line.id" :action="line.action" :leeks="game.leeks" turn="1" class="action" />
					<pre v-else :key="line.id" :class="logClass(line.log)" :style="{color: logColor(line.log)}" class="log">[<leek :leek="game.leeks[line.log[0]]" />] {{ logText(line.log) }}</pre>
				</template>
			</div>
		</div>
		<div v-if="!LeekWars.mobile" class="timeline">
			<tooltip v-for="(entity, e) of game.entityOrder" :key="e" top>
				<template v-slot:activator="{ on }">
					<div :class="{summon: entity.summon, current: entity.id === game.currentPlayer, dead: entity.dead}" :style="{background: entity === game.selectedEntity || entity === game.mouseEntity ? '#fffc' : entity.gradient, 'border-color': entity.color}" class="entity" v-on="on" @mouseenter="entity_enter(entity)" @mouseleave="entity_leave(entity)" @click="entity_click(entity)">
						<div v-if="!entity.dead" :style="{height: 'calc(6px + ' + ((entity.life / entity.maxLife) * 100) + '%)', background: entity.lifeColor, 'border-color': entity.lifeColorLighter}" class="bar"></div>
						<div class="image">
							<img v-if="entity.summon" :src="'/image/bulb/' + entity.bulbName + '_front.png'">
							<turret-image v-else-if="(entity instanceof Turret)" :level="entity.level" :skin="entity.team" :scale="1" />
							<leek-image v-else :leek="entity" :scale="1" />
						</div>
					</div>
				</template>
				{{ entity.name }}
			</tooltip>
		</div>
		<template v-if="!LeekWars.mobile">
			<entity-details v-if="game.mouseEntity" :entity="game.mouseEntity" />
			<entity-details v-else-if="game.selectedEntity" :entity="game.selectedEntity" />
			<entity-details v-else-if="game.currentPlayer in game.leeks" :entity="game.leeks[game.currentPlayer]" />
		</template>
	</div>
</template>

<script lang="ts">
	import EntityDetails from '@/component/player/entity-details.vue'
	import ActionLeekElement from '@/component/report/action-leek.vue'
	import ActionElement from '@/component/report/action.vue'
	import { Effect, EffectType } from '@/model/effect'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { Game } from './game/game'
	import { Turret } from './game/turret'

	@Component({ name: 'hud', components: { ActionElement, EntityDetails, leek: ActionLeekElement } })
	export default class Hud extends Vue {
		@Prop({required: true}) game!: Game
		debug: boolean = false
		actionsMargin: number = 0
		hover_entity: any | null = null
		Turret = Turret
		get barWidth() {
			return LeekWars.mobile ? 300 : 500
		}
		get totalLife() {
			return this.game.leeks.reduce((total, e) => total + (!e.summon ? e.life : 0), 0)
		}
		@Watch("game.consoleLines")
		updateActions() {
			Vue.nextTick(() => {
				const actions = this.$refs.actions as HTMLElement
				if (actions) {
					const leftPart = this.$refs.leftPart as HTMLElement
					this.actionsMargin = Math.min(0, leftPart.offsetHeight - actions.offsetHeight - 135)
				}
			})
		}
		entity_enter(entity: any) {
			this.game.hoverEntity = entity
			this.game.hoverEntity!.updateReachableCells()
		}
		entity_leave(entity: any) {
			this.game.hoverEntity = null
		}
		entity_click(entity: any) {
			this.game.selectEntity(entity)
		}

		logClass(log: any[]) {
			if (log[1] === 2) { return "warning" }
			else if (log[1] === 3) { return "error" }
			else if (log[1] === 5) { return "pause" }
		}
		logColor(log: any[]) {
			return log.length > 3 ? LeekWars.colorToHex(log[3]) : ''
		}
		logText(log: any[]) {
			if (log[1] === 5) {	return "pause()" }
			return log[2]
		}
	}
</script>

<style lang="scss" scoped>
	.timeline {
		position: absolute;
		bottom: 5px;
		left: 500px; right: 0;
		text-align: center;
		white-space: nowrap;
	}
	.timeline .entity {
		display: inline-flex;
		vertical-align: bottom;
		width: 58px;
		height: 76px;
		margin: 0 2px;
		padding: 3px 2px;
		position: relative;
		border-top-left-radius: 3px;
		border-top-right-radius: 3px;
		align-items: flex-end;
		cursor: pointer;
	}
	.timeline .entity.current {
		border-top: 5px solid black;
		border-left: 5px solid black;
		border-right: 5px solid black;
		height: 81px;
		width: 71px;
		margin: 0 0px;
	}
	.timeline .entity.dead {
		opacity: 0.3;
	}
	.timeline .entity .bar {
		flex: 6px 0 0;
		border-top-left-radius: 3px;
		border: 1px solid black;
		margin-right: 2px;
		margin-left: -3px;
		margin-top: -3px;
		margin-bottom: -3px;
	}
	.timeline .entity .image {
		max-width: 100%;
		max-height: 100%;
	}
	.timeline .entity .image svg {
		max-width: 50px;
		max-height: 70px;
	}
	.timeline .entity.summon {
		width: 41px;
		height: 56px;
	}
	.timeline .entity.summon.current {
		width: 51px;
		height: 61px;
	}
	.timeline .entity.summon .bar {
		margin-right: 4px;
	}
	.timeline .entity.summon img {
		max-width: 30px;
		max-height: 50px;
	}
	.timeline .entity:hover .details, .details.visible {
		display: block;
	}
	.life-bar {
		position: absolute;
		top: 0; left: 0; right: 0;
		text-align: center;
	}
	.life-bar .wrapper {
		display: inline-block;
		background: rgba(255,255,255,0.2);
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
		padding-top: 3px;
		padding-left: 4px;
		padding-bottom: 0px;
		padding-right: 1px;
		height: 15px;
	}
	.life-bar .bar {
		display: inline-block;
		margin-right: 3px;
		height: calc(100% - 3px);
		vertical-align: top;
	}
	.life-bar .bar.dead {
		margin-right: 0px;
	}
	.life-bar .wrapper :first-child {
		border-bottom-left-radius: 10px;
	}
	.life-bar .wrapper :last-child {
		border-bottom-right-radius: 10px;
	}
	#app.app .life-bar .wrapper {
		height: 12px;
	}
	.actions {
		text-align: left;
		padding: 6px;
		width: 190px;
		overflow: hidden;
		background-color: rgba(255,255,255, 0.2);
	}
	.actions:hover {
		width: 600px;
		background-color: rgba(255,255,255, 1);
	}
	.actions .action {
		padding: 1px 0;
		font-size: 14px;
		width: 600px;
	}
	.debug {
		position: absolute;
		top: 0;
		left: 200px;
		text-align: left;
		background: rgba(255,255,255,0.9);
		padding: 5px;
		pointer-events: none;
	}
	.left-part {
		position: absolute;
		top: 0; left: 0; bottom: 0;
		text-align: left;
		overflow: hidden;
	}
	.log {
		padding: 2px 0;
		font-size: 11px;
		margin: 0;
		font-family: monospace;
		word-break: break-all;
		white-space: pre-wrap;
		width: 600px;
	}
	.pause {
		color: #999;
	}
	.warning {
		color: #ff5f00;
	}
	.error {
		color: #ff1900;
	}
</style>