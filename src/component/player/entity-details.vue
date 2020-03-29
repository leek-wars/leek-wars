<template>
	<div class="details-wrapper">
		<div class="effects">
			<div v-for="effect in entity.effects" :key="effect.id" :value="effectText(effect)" class="effect">
				<img :src="effect.image">
			</div>
		</div>
		<div :class="{dead: entity.dead}" class="details">
			<div class="image">
				<img v-if="entity.summon" :src="'/image/bulb/' + entity.bulbName + '_front.png'">
				<turret-image v-else-if="(entity instanceof Turret)" :level="entity.level" :skin="entity.team" :scale="0.15" />
				<leek-image v-else :leek="entity" :scale="0.3" />
			</div>
			<div>
				<div class="flex">
					<span class="name">{{ entity.name }}</span>&nbsp;
					<div class="spacer"></div>
					<span class="level">{{ $t('main.level_n', [entity.level]) }}</span>
					<div class="bar-wrapper">
						<div :style="{width: (100 * entity.life / entity.maxLife) + '%', background: entity.lifeColor}" class="details-bar"></div>
					</div>
					<div>{{ entity.farmer_name }}</div>
					<avatar :farmer="entity.farmer" class="farmer-avatar" />
				</div>
				<div class="stats">
					<div :class="{zero: entity.life === 0}" class="stat life">
						<img src="/image/charac/small/life.png">
						<div :class="{small: entity.maxLife > 9999}" class="color-life">{{ entity.life + ' / ' + entity.maxLife }}</div>
					</div>
					<div :class="{zero: entity.tp === 0}" class="stat">
						<img src="/image/charac/small/tp.png">
						<div class="tp color-tp">{{ entity.tp }}</div>
					</div>
					<div :class="{zero: entity.mp === 0}" class="stat">
						<img src="/image/charac/small/mp.png">
						<div class="mp color-mp">{{ entity.mp }}</div>
					</div>
					<div :class="{zero: entity.absoluteShield === 0}" class="stat">
						<img src="/image/charac/small/absolute_shield.png">
						<div class="absolute-shield">{{ entity.absoluteShield }}</div>
					</div>
					<div :class="{zero: entity.relativeShield === 0}" class="stat">
						<img src="/image/charac/small/relative_shield.png">
						<div class="relative-shield">{{ entity.relativeShield }}%</div>
					</div>
					<div :class="{zero: entity.damageReturn === 0}" class="stat">
						<img src="/image/charac/small/damage_return.png">
						<div class="damage-return">{{ entity.damageReturn }}%</div>
					</div>
					<br>
					<div :class="{zero: entity.strength === 0}" class="stat">
						<img src="/image/charac/small/strength.png">
						<div class="strength color-strength">{{ entity.strength }}</div>
					</div>
					<div :class="{zero: entity.wisdom === 0}" class="stat">
						<img src="/image/charac/small/wisdom.png">
						<div class="wisdom color-wisdom">{{ entity.wisdom }}</div>
					</div>
					<div :class="{zero: entity.agility === 0}" class="stat">
						<img src="/image/charac/small/agility.png">
						<div class="agility color-agility">{{ entity.agility }}</div>
					</div>
					<div :class="{zero: entity.resistance === 0}" class="stat">
						<img src="/image/charac/small/resistance.png">
						<div class="resistance color-resistance">{{ entity.resistance }}</div>
					</div>
					<div :class="{zero: entity.science === 0}" class="stat">
						<img src="/image/charac/small/science.png">
						<div class="science color-science">{{ entity.science }}</div>
					</div>
					<div :class="{zero: entity.magic === 0}" class="stat">
						<img src="/image/charac/small/magic.png">
						<div class="magic color-magic">{{ entity.magic }}</div>
					</div>
					<div :class="{zero: entity.frequency === 0}" class="stat">
						<img src="/image/charac/small/frequency.png">
						<div class="frequency color-frequency">{{ entity.frequency }}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Effect, EffectType } from '@/model/effect'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { Entity } from './game/entity'
	import { Game } from './game/game'
	import { Turret } from './game/turret'

	@Component({ name: 'entity-details' })
	export default class EntityDetails extends Vue {
		@Prop({required: true}) entity!: Entity
		Turret = Turret

		effectText(effect: any) {
			let r = '' + effect.value
			if (effect.effect === EffectType.SHACKLE_MAGIC || effect.effect === EffectType.SHACKLE_MP || effect.effect === EffectType.SHACKLE_TP || effect.effect === EffectType.SHACKLE_STRENGTH || effect.effect === EffectType.VULNERABILITY || effect.effect === EffectType.ABSOLUTE_VULNERABILITY) {
				r = '-' + r
			}
			if (effect.effect === EffectType.RELATIVE_SHIELD || effect.effect === EffectType.DAMAGE_RETURN || effect.effect === EffectType.VULNERABILITY) {
				r += '%'
			}
			return r
		}
	}
</script>

<style lang="scss" scoped>
.details-wrapper {
	position: absolute;
	bottom: 6px;
	left: 0;
	width: 490px;
}
.details {
	width: 100%;
	padding: 4px 10px;
	padding-left: 5px;
	background-color: #fff;
	box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);
	border-radius: 3px;
	display: flex;
	align-items: center;
}
.details.dead {
	background: rgba(255,255,255,0.3);
}
.image {
	flex: 45px 0 0;
	margin-right: 5px;
	display: flex;
	align-items: flex-end;
	max-height: 78px;
	width: 45px;
	img {
		max-width: 45px;
		max-height: 78px;
	}
}
.flex {
	align-items: center;
	margin-right: -4px;
}
.name {
	color: black;
	font-weight: 500;
	width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
}
.level {
	white-space: nowrap;
}
.spacer {
	flex: 1;
}
.details .bar-wrapper {
	flex-basis: 200px;
	height: 6px;
	border: 1px solid #999;
	margin: 0 6px;
	border-radius: 3px;
}
.details .details-bar {
	height: 6px;
}
.farmer-avatar {
	width: 30px;
}
.stat {
	display: inline-block;
	margin-left: 2px;
	font-size: 16px;
	font-weight: bold;
	width: 58px;
	margin-bottom: 3px;
	white-space: nowrap;
	div {
		display: inline-block;
		vertical-align: bottom;
		margin-bottom: 2px;
	}
	img {
		width: 17px;
		margin-right: 3px;
	}
}
.stat.life {
	width: 118px;
}
.zero {
	opacity: 0.25;
}
.small {
	font-size: 14px;
	padding-bottom: 2px;
}
.effects {
	padding: 4px;
	white-space: nowrap;
}
.effects .effect {
	position: relative;
	display: inline-block;
}
.effects .effect img {
	width: 36px;
	margin-right: 4px;
	vertical-align: bottom;
}
.effects .effect:after {
	position: absolute;
	bottom: 0;
	left: 0;
	padding: 1px 2px;
	content: attr(value);
	color: white;
	font-weight: bold;
	background: rgba(0,0,0,0.5);
	border-top-right-radius: 7px;
	border-bottom-left-radius: 10px;
	font-size: 12px;
}
</style>