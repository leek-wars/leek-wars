<template>
	<div v-if="!LeekWars.mobile" class="hud">
		<div class="life-bar">
			<div class="wrapper">
				<template v-for="team in game.teams">
					<v-tooltip v-for="entity in team" v-if="!entity.dead" :key="entity.id" :open-delay="0" :close-delay="0" bottom>
						<div slot="activator" :style="{background: entity.lifeBarGadient, width: Math.max(1, 500 * (entity.life / totalLife) - 3) + 'px'}" class="bar"></div>
						{{ entity.name }} ({{ entity.life }})
					</v-tooltip>
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
			<div v-for="entity in game.entityOrder" :class="{summon: entity.summon, current: entity.id === game.currentPlayer, dead: entity.dead}" :key="entity.id" :style="{background: entity.gradient, 'border-color': entity.color}" class="entity">
				<div v-if="!entity.dead" :style="{top: ((1 - entity.life / entity.maxLife) * 100) + '%', background: entity.getLifeColor(), 'border-color': entity.getLifeBarBorderColor()}" class="bar"></div>
				<div class="image">
					<img v-if="entity.summon" :src="'/image/bulb/' + entity.bulbName + '_front.png'">
					<leek-image v-else :leek="entity" :scale="1" />
				</div>
				<div :class="{visible: game.selectedEntity === entity}" class="details">
					<avatar :farmer="entity.farmer" class="farmer-avatar" />
					<h2 class="name">{{ entity.name }}</h2>
					<div class="level">{{ $t('fight.leek_level', [entity.level]) }}</div>
					<div class="bar-wrapper">
						<div :style="{width: (100 * entity.life / entity.maxLife) + '%', background: entity.getLifeColor()}" class="details-bar"></div>
					</div>
					<div>
						<img src="/image/charac/small/life.png">
						<div class="stat life color-life">{{ entity.life + ' / ' + entity.maxLife }}</div>
						<img src="/image/charac/small/tp.png">
						<div class="stat tp color-tp">{{ entity.tp }}</div>
						<img src="/image/charac/small/mp.png">
						<div class="stat mp color-mp">{{ entity.mp }}</div>
						<img src="/image/charac/small/frequency.png">
						<div class="stat frequency color-frequency">{{ entity.frequency }}</div>
						<br>
						<img src="/image/charac/small/strength.png">
						<div class="stat strength color-strength">{{ entity.strength }}</div>
						<img src="/image/charac/small/wisdom.png">
						<div class="stat wisdom color-wisdom">{{ entity.wisdom }}</div>
						<img src="/image/charac/small/agility.png">
						<div class="stat agility color-agility">{{ entity.agility }}</div>
						<img src="/image/charac/small/resistance.png">
						<div class="stat resistance color-resistance">{{ entity.resistance }}</div>
						<img src="/image/charac/small/science.png">
						<div class="stat science color-science">{{ entity.science }}</div>
						<img src="/image/charac/small/magic.png">
						<div class="stat magic color-magic">{{ entity.magic }}</div>
						<br>
						<img src="/image/charac/small/absolute_shield.png">
						<div class="stat absolute-shield">{{ entity.absoluteShield }}</div>
						<img src="/image/charac/small/relative_shield.png">
						<div class="stat relative-shield">{{ entity.relativeShield }}%</div>
						<img src="/image/charac/small/damage_return.png">
						<div class="stat damage-return">{{ entity.damageReturn }}%</div>
					</div>
					<div class="effects">
						<div v-for="effect in entity.effects" :key="effect.id" :value="effectText(effect)" class="effect">
							<img :src="effect.image">
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import ActionElement from '@/component/report/action.vue'
	import { Effect, EffectType } from '@/model/effect'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { Game } from './game/game'

	@Component({ name: 'hud', components: {ActionElement} })
	export default class Hud extends Vue {
		@Prop({required: true}) game!: Game
		debug: boolean = false
		actionsMargin: number = 0

		get totalLife() {
			return this.game.leeks.reduce((total, e) => total + (!e.summon ? e.life : 0), 0)
		}
		effectText(effect: any) {
			if (effect.effect === EffectType.RELATIVE_SHIELD || effect.effect === EffectType.DAMAGE_RETURN || effect.effect === EffectType.VULNERABILITY) {
				return effect.value + '%'
			}
			return effect.value
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
					this.actionsMargin = Math.min(0, leftPart.offsetHeight - actions.offsetHeight - 100)
				}
			})
		}
	}
</script>

<style lang="scss" scoped>
	.timeline {
		position: absolute;
		bottom: 5px;
		left: 0; right: 0;
		text-align: center;
		white-space: nowrap;
	}
	.timeline .entity {
		display: inline-block;
		vertical-align: bottom;
		width: 50px;
		height: 70px;
		margin: 0 3px;
		padding: 3px;
		padding-left: 9px;
		position: relative;
		border-top-left-radius: 3px;
		border-top-right-radius: 3px;
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
		position: absolute;
		bottom: 0;
		width: 6px;
		border-top-left-radius: 3px;
		border: 1px solid black;
		left: 0;
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
		width: 30px;
		height: 50px;
	}
	.timeline .entity.summon img {
		max-width: 30px;
		max-height: 50px;
	}
	.timeline .entity:hover .details, .details.visible {
		display: block;
	}
	.details {
		position: absolute;
		bottom: 95px;
		left: 50%;
		display: none;
		width: 320px;
		margin-left: -160px;
		text-align: left;
		padding-top: 10px;
		padding-left: 10px;
		padding-right: 10px;
		background-color: #fff;
		box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);
		border-radius: 3px;
	}
	.details:after {
		position: absolute;
		content: " ";
		bottom: -10px;
		border-bottom: none;
		left: 50%;
		margin-left: -20px;
		width: 0;
		height: 0;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-top: 10px solid #fff;
	}
	.entity.summon .details {
		bottom: 75px;
	}
	.details .name {
		margin: 0;
		color: black;
		font-size: 22px;
	}
	.details .bar-wrapper {
		height: 8px;
		background: #999;
		padding: 1px;
		margin-top: 4px;
		margin-bottom: 5px;
	}
	.details .details-bar {
		background: red;
		height: 8px;
	}
	.details .farmer-avatar {
		width: 42px;
		float: right;
	}
	.details .stat {
		vertical-align: bottom;
		margin-bottom: 3px;
		display: inline-block;
		margin-right: 10px;
		margin-left: 2px;
		font-size: 17px;
		font-weight: bold;
	}
	.details .effects {
		padding-top: 4px;
	}
	.details .effects .effect {
		position: relative;
		display: inline-block;
	}
	.details .effects .effect img {
		width: 40px;
		margin-right: 4px;
		margin-bottom: 4px;
	}
	.details .effects .effect:after {
		position: absolute;
		bottom: 7px;
		left: 0;
		padding: 1px 3px;
		content: attr(value);
		color: white;
		font-weight: bold;
		background: rgba(0,0,0,0.5);
		border-top-right-radius: 7px;
		border-bottom-left-radius: 10px;
		font-size: 14px;
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