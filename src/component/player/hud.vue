<template>
	<div v-if="!LeekWars.mobile" class="hud">
		<div class="life-bar">
			<div class="wrapper">
				<template v-for="team in game.teams">
					<tooltip v-for="entity in team" v-if="!entity.dead" :key="entity.id">
						<div slot="activator" :style="{background: entity.lifeBarGadient, width: Math.max(1, 500 * (entity.life / totalLife) - 3) + 'px'}" class="bar"></div>
						{{ entity.name }} ({{ entity.life }})
					</tooltip>
				</template>
			</div>
		</div>
		<div v-if="debug" class="debug">
			<div>Particles : {{ game.particles.particles.length }}</div>
			<div>Mouse : ({{ game.mouseX }}, {{ game.mouseY }})</div>
			<div>Mouse tile : ({{ game.mouseTileX }}, {{ game.mouseTileY }})</div>
			<div>Mouse cell : {{ game.mouseCell }}</div>
			<div>FPS : {{ game.fps }}, avg: {{ game.avgFPS }}</div>
		</div>
		<div ref="leftPart" class="left-part">
			<div ref="actions" :style="{'margin-top': actionsMargin + 'px'}" class="actions">
				<action-element v-for="action of game.currentActions" :key="action.id" :action="action.action" :logs="action.logs" :leeks="game.leeks" turn="1" class="action" />
			</div>
		</div>
		<div class="timeline">
			<div v-for="entity in game.entityOrder" :class="{summon: entity.summon, current: entity.id === game.currentPlayer, dead: entity.dead}" :key="entity.id" :style="{background: entity.gradient, 'border-color': entity.color}" class="entity" @mouseenter="entity_enter(entity)" @mouseleave="entity_leave(entity)" @click="entity_click(entity)">
				<div v-if="!entity.dead" :style="{height: 'calc(4px + ' + ((entity.life / entity.maxLife) * 100) + '%)', background: entity.getLifeColor(), 'border-color': entity.getLifeBarBorderColor()}" class="bar"></div>
				<div class="image">
					<img v-if="entity.summon" :src="'/image/bulb/' + entity.bulbName + '_front.png'">
					<leek-image v-else :leek="entity" :scale="1" />
				</div>
			</div>
		</div>
		<entity-details v-if="hover_entity" :entity="hover_entity" />
		<entity-details v-else-if="selected_entity" :entity="selected_entity" />
	</div>
</template>

<script lang="ts">
	import ActionElement from '@/component/report/action.vue'
	import EntityDetails from '@/component/player/entity-details.vue'
	import { Effect, EffectType } from '@/model/effect'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { Game } from './game/game'

	@Component({ name: 'hud', components: { ActionElement, EntityDetails } })
	export default class Hud extends Vue {
		@Prop({required: true}) game!: Game
		debug: boolean = false
		actionsMargin: number = 0
		hover_entity: any | null = null
		selected_entity: any | null = null
		get totalLife() {
			return this.game.leeks.reduce((total, e) => total + (!e.summon ? e.life : 0), 0)
		}
		@Watch("game.currentActions")
		updateActions() {
			Vue.nextTick(() => {
				const actions = this.$refs.actions as HTMLElement
				if (actions) {
					const leftPart = this.$refs.leftPart as HTMLElement
					if (actions.offsetHeight > leftPart.offsetHeight) {
						this.game.currentActions.shift()
					}
					this.actionsMargin = Math.min(0, leftPart.offsetHeight - actions.offsetHeight - 135)
				}
			})
		}
		entity_enter(entity: any) {
			this.hover_entity = entity
		}
		entity_leave(entity: any) {
			this.hover_entity = null
		}
		entity_click(entity: any) {
			this.selected_entity = entity
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
		width: 55px;
		height: 70px;
		margin: 0 3px;
		padding: 3px;
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
		margin: 0 0px;
	}
	.timeline .entity.dead {
		opacity: 0.3;
	}
	.timeline .entity .bar {
		flex: 5px 0 0;
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
		width: 35px;
		height: 50px;
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
		border-bottom-left-radius: 15px;
		border-bottom-right-radius: 15px;
		padding-top: 3px;
		padding-left: 4px;
		padding-bottom: 0px;
		padding-right: 1px;
	}
	.life-bar .bar {
		display: inline-block;
		height: 15px;
		margin-right: 3px;
	}
	.life-bar .bar.dead {
		margin-right: 0px;
	}
	.life-bar .v-tooltip:first-child .bar {
		border-bottom-left-radius: 10px;
	}
	.life-bar .v-tooltip:last-child .bar {
		border-bottom-right-radius: 10px;
	}
	.actions {
		text-align: left;
		padding: 6px;
		width: 190px;
		overflow: hidden;
		background-color: rgba(255,255,255, 0.2);
		transition: margin-top 0.5s ease;
	}
	.actions:hover {
		width: 500px;
		background-color: rgba(255,255,255, 0.6);
	}
	.actions .action {
		padding: 1px 0;
		font-size: 14px;
		width: 500px;
	}
	.debug {
		position: absolute;
		top: 0;	left: 150px;
		text-align: left;
		display: none;
	}
	.left-part {
		position: absolute;
		top: 0; left: 0; bottom: 0;
		text-align: left;
		overflow: hidden;
	}
</style>