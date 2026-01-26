<template>
	<div class="details-wrapper">
		<div class="effects">
			<v-tooltip v-for="effect in entity.effects" :key="effect.id" location="left" content-class="left">
				<template #activator="{ props }">
					<div :value="effectText(effect)" :turns="effect.turns === -1 ? '∞' : effect.turns" class="effect" :class="{irreductible: effect.modifiers & EffectModifier.IRREDUCTIBLE}" v-bind="props">
						<img class="image" :src="effect.texture.src">
						<img class="state" v-if="effect.type === EffectType.ADD_STATE" :src="LeekWars.STATIC + 'image/state/' + effect.value + '.svg'" :style="{ background: FightEntity.stateColors[effect.value] }">
					</div>
				</template>
				<div v-if="effect.item"><b>{{ $t(LeekWars.items[effect.item].name.replace('_', '.')) }}</b></div>
				<div>Lancé par <b>{{ game.leeks[effect.caster].translatedName }}</b></div>
				<div>
					<b>
						<b v-if="effect.type === EffectType.ABSOLUTE_SHIELD || effect.type === EffectType.STEAL_ABSOLUTE_SHIELD || effect.type === EffectType.RAW_ABSOLUTE_SHIELD" class="color-resistance">
							{{ $t('fight.n_absolute_shield', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.RELATIVE_SHIELD || effect.type === EffectType.RAW_RELATIVE_SHIELD" class="color-resistance">
							{{ $t('fight.n_relative_shield', [effect.value + '%']) }}
						</b>
						<b v-else-if="effect.type === EffectType.VULNERABILITY" class="color-resistance">
							{{ $t('fight.n_vulnerability', [effect.value + '%']) }}
						</b>
						<b v-else-if="effect.type === EffectType.ABSOLUTE_VULNERABILITY" class="color-resistance">
							{{ $t('fight.n_vulnerability', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.BUFF_AGILITY || effect.type === EffectType.RAW_BUFF_AGILITY" class="color-agility dark">
							{{ $t('fight.n_agility', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.BUFF_STRENGTH || effect.type === EffectType.RAW_BUFF_STRENGTH" class="color-strength dark">
							{{ $t('fight.n_strength', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.BUFF_RESISTANCE || effect.type === EffectType.RAW_BUFF_RESISTANCE" class="color-resistance">
							{{ $t('fight.n_resistance', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.BUFF_WISDOM || effect.type === EffectType.RAW_BUFF_WISDOM" class="color-wisdom">
							{{ $t('fight.n_wisdom', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.RAW_BUFF_MAGIC" class="color-magic">
							{{ $t('fight.n_magic', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.RAW_BUFF_SCIENCE" class="color-science">
							{{ $t('fight.n_science', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.BUFF_MP || effect.type === EffectType.RAW_BUFF_MP" class="color-mp">
							{{ $t('fight.n_mp', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.BUFF_TP || effect.type === EffectType.RAW_BUFF_TP" class="color-tp">
							{{ $t('fight.n_tp', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.SHACKLE_TP" class="color-tp">
							{{ $t('fight.n_tp', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.SHACKLE_MP" class="color-mp">
							{{ $t('fight.n_mp', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.SHACKLE_STRENGTH" class="color-strength">
							{{ $t('fight.n_strength', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.SHACKLE_MAGIC" class="color-magic">
							{{ $t('fight.n_magic', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.DAMAGE_RETURN">
							{{ $t('fight.n_damage_return', [effect.value + '%']) }}
						</b>
						<b v-else-if="effect.type === EffectType.HEAL" class="color-wisdom">
							{{ $t('fight.n_heal', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.DAMAGE" class="color-life">
							{{ $t('fight.n_damage', [effect.value]) }}
						</b>
						<b v-else-if="effect.type === EffectType.ADD_STATE">
							{{ $t('fight.state_x', [$t('effect.state_' + effect.value)]) }}
						</b>
					</b>
					<span v-if="effect.turns === -1">{{ $t('effect.infinite') }}</span>
					<span v-else v-html="$t('effect.on_n_turns', {turns: $tc('effect.n_turns', [effect.turns])})"></span>
				</div>
			</v-tooltip>
		</div>
		<div :class="{dead: entity.dead, dark}" class="details">
			<div class="entity-image">
				<img v-if="entity.summon" :src="'/image/bulb/' + entity.bulbName + '_front.png'">
				<turret-image v-else-if="(entity instanceof Turret)" :level="entity.level" :skin="entity.team" :scale="0.15" />
				<img v-else-if="(entity instanceof Chest)" :src="'/image/chest/' + entity.name + '.png'">
				<img v-else-if="(entity instanceof Mob)" :src="'/image/mob/' + entity.name + '.png'">
				<leek-image v-else :leek="entity" :scale="0.3" />
			</div>
			<div>
				<div class="flex">
					<span class="name">{{ entity.translatedName }}</span>&nbsp;
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
					<div :class="{zero: entity.absoluteShield === 0, dark}" class="stat black">
						<img src="/image/charac/small/absolute_shield.png">
						<div class="absolute-shield">{{ entity.absoluteShield }}</div>
					</div>
					<div :class="{zero: entity.relativeShield === 0, dark}" class="stat black">
						<img src="/image/charac/small/relative_shield.png">
						<div class="relative-shield">{{ entity.relativeShield }}%</div>
					</div>
					<div :class="{zero: entity.damageReturn === 0, dark}" class="stat black">
						<img src="/image/charac/small/damage_return.png">
						<div class="damage-return">{{ entity.damageReturn }}%</div>
					</div>
				</div>
				<div class="stats">
					<div :class="{zero: entity.strength === 0}" class="stat">
						<img src="/image/charac/small/strength.png" :class="{dark}">
						<div class="strength color-strength" :class="{dark}">{{ entity.strength }}</div>
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
					<div :class="{zero: entity.science === 0, dark}" class="stat">
						<img src="/image/charac/small/science.png" :class="{dark}">
						<div class="science color-science" :class="{dark}">{{ entity.science }}</div>
					</div>
					<div :class="{zero: entity.magic === 0, dark}" class="stat">
						<img src="/image/charac/small/magic.png">
						<div class="magic color-magic" :class="{dark}">{{ entity.magic }}</div>
					</div>
					<div :class="{zero: entity.frequency === 0, dark}" class="stat black">
						<img src="/image/charac/small/frequency.png">
						<div class="frequency color-frequency">{{ entity.frequency }}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Effect, EffectModifier, EffectType } from '@/model/effect'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import { Chest } from './game/chest'
	import { FightEntity } from './game/entity'
	import { Game } from './game/game'
	import { Turret } from './game/turret'
	import TurretImage from '@/component/turret-image.vue'
	import { Mob } from './game/mob'

	@Options({ name: 'entity-details', components: { TurretImage } })
	export default class EntityDetails extends Vue {
		@Prop({required: true}) entity!: FightEntity
		@Prop({required: true}) game!: Game
		@Prop({required: true}) dark!: boolean
		Turret = Turret
		EffectType = EffectType
		Chest = Chest
		Mob = Mob
		FightEntity = FightEntity
		EffectModifier = EffectModifier

		effectText(effect: any) {
			if (effect.type === EffectType.ADD_STATE) return ''
			let r = '' + effect.value
			if (effect.type === EffectType.SHACKLE_MAGIC || effect.type === EffectType.SHACKLE_MP || effect.type === EffectType.SHACKLE_TP || effect.type === EffectType.SHACKLE_STRENGTH || effect.type === EffectType.VULNERABILITY || effect.type === EffectType.ABSOLUTE_VULNERABILITY) {
				r = '-' + r
			}
			if (effect.type === EffectType.RAW_RELATIVE_SHIELD || effect.type === EffectType.RELATIVE_SHIELD || effect.type === EffectType.DAMAGE_RETURN || effect.type === EffectType.VULNERABILITY) {
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
	right: 0;
	width: 395px;
}
.details {
	width: 100%;
	height: 100px;
	padding: 4px 5px;
	background-color: #fff;
	box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);
	border-top-left-radius: 5px;
	display: flex;
	align-items: center;
	&.dark {
		background-color: #222;
		color: #eee;
	}
	& > * {
		flex: 1;
	}
}
.details.dead {
	background: rgba(255,255,255,0.3);
}
.entity-image {
	flex: 45px 0 0;
	margin-right: 3px;
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
	height: 8px;
	border: 1px solid #999;
	margin: 0 6px;
	border-radius: 3px;
}
.details .details-bar {
	height: 6px;
}
.farmer-avatar {
	width: 30px;
	height: 30px;
}
.stats {
	display: flex;
	width: 100%;
	margin: 8px 4px;
	gap: 2px;
}
.stat {
	flex: 1;
	display: inline-block;
	font-size: 14px;
	font-weight: bold;
	white-space: nowrap;
	div {
		display: inline-block;
		vertical-align: bottom;
		margin-bottom: 2px;
	}
	img {
		width: 14px;
		margin-right: 3px;
		&.dark {
			filter: brightness(180%);
		}
	}
	&.black {
		color: black;
		&.dark {
			filter: invert(100%);
		}
	}
	&.zero {
		opacity: 0.25;
		&.dark {
			opacity: 0.9;
		}
		&.black.dark {
			opacity: 0.3;
		}
	}
}
.stat.life {
	flex: 2;
}
.small {
	font-size: 14px;
	padding-bottom: 2px;
}
.effects {
	padding-right: 4px;
	right: 0;
	white-space: nowrap;
	display: flex;
	flex-direction: column-reverse;
	position: absolute;
	bottom: 100%;
}
.effects .effect {
	position: relative;
	display: inline-block;
	margin-bottom: 4px;
	.image {
		width: 36px;
		height: 36px;
		vertical-align: bottom;
		object-fit: fill;
	}
	&.irreductible .image {
		border: 3px solid #ffca00;
	}
	.state {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 22px;
		height: 22px;
	}
}
.effects .effect:not([value=""]):after {
	position: absolute;
	left: 0;
	bottom: 4px;
	padding: 1px 2px;
	content: attr(value);
	color: white;
	font-weight: bold;
	background: rgba(0,0,0,0.5);
	border-top-right-radius: 7px;
	border-bottom-left-radius: 10px;
	font-size: 12px;
}
.effects .effect:before {
	position: absolute;
	right: 0;
	top: 0;
	padding: 1px 2px;
	content: attr(turns);
	color: white;
	font-weight: bold;
	background: rgba(0,0,0,0.5);
	border-bottom-left-radius: 7px;
	border-top-right-radius: 10px;
	font-size: 12px;
}
</style>