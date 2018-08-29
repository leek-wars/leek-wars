<template>
	<div v-if="type === Action.START_FIGHT || type === Action.NEW_TURN" class="turn">
		{{ $t('fight.turn_n', [turn]) }}
	</div>
	<div v-else-if="type === Action.USE_WEAPON">
		<i18n path="fight.leek_hit">
			<leek :leek="leek" place="leek" />
		</i18n>
		<span v-if="action[4] === 2">... {{ $t('effect.critical') }}</span>
	</div>
	<div v-else-if="type === Action.USE_CHIP">
		<i18n path="fight.leek_cast">
			<leek :leek="leek" place="leek" />
			<b place="chip">{{ $t('chip.' + LeekWars.chips[LeekWars.chipTemplates[action[3]].item].name) }}</b>
		</i18n>
		<span v-if="action[4] === 2">... {{ $t('effect.critical') }}</span>
	</div>
	<div v-else-if="type === Action.SET_WEAPON">
		<i18n path="fight.leek_take_weapon">
			<leek :leek="leek" place="leek" />
			<b place="weapon">{{ $t('weapon.' + LeekWars.weapons[LeekWars.weaponTemplates[action[2]].item].name) }}</b>
		</i18n>
	</div>
	<div v-else-if="type === Action.END_FIGHT">
		{{ $t('fight.end_of_fight') }}
	</div>
	<i18n v-else-if="type === Action.PLAYER_DEAD" tag="div" path="fight.leek_is_dead">
		<leek :leek="leek" place="leek" />
	</i18n>
	<i18n v-else-if="type === Action.LEEK_TURN" tag="div" path="fight.turn_of_leek">
		<leek :leek="leek" place="leek" />
	</i18n>
	<i18n v-else-if="type === Action.MOVE_TO" tag="div" path="fight.leek_move">
		<leek :leek="leek" place="leek" />
	</i18n>
	<i18n v-else-if="type === Action.TP_LOST" tag="div" path="fight.leek_loose_x">
		<leek :leek="leek" place="leek" />
		<b place="value" class="color-tp">{{ $t('fight.n_tp', [action[2]]) }}</b>
	</i18n>
	<i18n v-else-if="type === Action.LIFE_LOST" tag="div" path="fight.leek_loose_x">
		<leek :leek="leek" place="leek" />
		<b place="value" class="color-life">{{ $t('fight.n_life', [action[2]]) }}</b>
	</i18n>
	<i18n v-else-if="type === Action.MP_LOST" tag="div" path="fight.leek_loose_x">
		<leek :leek="leek" place="leek" />
		<b place="value" class="color-mp">{{ $t('fight.n_mp', [action[2]]) }}</b>
	</i18n>
	<i18n v-else-if="type === Action.CARE" tag="div" path="fight.leek_win_x">
		<leek :leek="leek" place="leek" />
		<b place="value" class="color-life">{{ $t('fight.n_life', [action[2]]) }}</b>
	</i18n>
	<i18n v-else-if="type === Action.BOOST_VITA" tag="div" path="fight.leek_win_x">
		<leek :leek="leek" place="leek" />
		<b place="value" class="color-life">{{ $t('fight.n_vita', [action[2]]) }}</b>
	</i18n>
	<div v-else-if="type === Action.ADD_CHIP_EFFECT || type === Action.ADD_WEAPON_EFFECT">
		<i18n v-if="effect === EffectType.ABSOLUTE_SHIELD" path="fight.leek_win_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-resistance">{{ $t('fight.n_absolute_shield', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.RELATIVE_SHIELD" path="fight.leek_win_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-resistance">{{ $t('fight.n_relative_shield', [value + '%']) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.VULNERABILITY" path="fight.leek_receives_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-resistance">{{ $t('fight.n_vulnerability', [value + '%']) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.BUFF_AGILITY" path="fight.leek_win_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-agility">{{ $t('fight.n_agility', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.BUFF_STRENGTH" path="fight.leek_win_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-strength">{{ $t('fight.n_strength', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.BUFF_RESISTANCE" path="fight.leek_win_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-resistance">{{ $t('fight.n_resistance', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.BUFF_WISDOM" path="fight.leek_win_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-wisdom">{{ $t('fight.n_wisdom', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.BUFF_MP" path="fight.leek_win_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-mp">{{ $t('fight.n_mp', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.BUFF_TP" path="fight.leek_win_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-tp">{{ $t('fight.n_tp', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.SHACKLE_TP" path="fight.leek_loose_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-tp">{{ $t('fight.n_tp', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.SHACKLE_MP" path="fight.leek_loose_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-mp">{{ $t('fight.n_mp', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.SHACKLE_STRENGTH" path="fight.leek_loose_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-strength">{{ $t('fight.n_strength', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.SHACKLE_MAGIC" path="fight.leek_loose_x">
			<leek :leek="target" place="leek" />
			<b place="value" class="color-magic">{{ $t('fight.n_magic', [value]) }}</b>
		</i18n>
		<i18n v-else-if="effect === EffectType.DAMAGE_RETURN" path="fight.leek_win_x">
			<leek :leek="target" place="leek" />
			<b place="value">{{ $t('fight.n_damage_return', [value + '%']) }}</b>
		</i18n>
	</div>
	<i18n v-else-if="type === Action.SAY" tag="div" path="fight.leek_speak">
		<leek :leek="leek" place="leek" />
		<i place="text">{{ action[2] }}</i>
	</i18n>
	<i18n v-else-if="type === Action.SUMMON" tag="div" path="fight.summon">
		<leek :leek="leek" place="leek" />
		<leek :leek="leeks[action[2]]" place="summon" />
	</i18n>
	<i18n v-else-if="type === Action.SHOW" tag="div" path="fight.leek_show_cell">
		<leek :leek="leek" place="leek" />
		<b place="cell">{{ action[2] }}</b>
	</i18n>
	<i18n v-else-if="type === Action.BUG" tag="div" path="fight.leek_bug">
		<leek :leek="leek" place="leek" />
	</i18n>
	<i18n v-else-if="type === Action.RESURRECTION" tag="div" path="fight.leek_resurrect">
		<leek :leek="leek" place="leek" />
		<leek :leek="leeks[action[2]]" place="target" />
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/component/player/game/action'
	import { EffectType } from '@/model/effect'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from './action-leek.vue'

	@Component({ components: {leek: ActionLeekElement} })
	export default class ActionElement extends Vue {
		@Prop({required: true}) action!: any
		@Prop({required: true}) leeks!: {[key: number]: any}
		@Prop({required: true}) turn!: number
		Action = Action
		EffectType = EffectType
		get type() { return this.action[0] }
		get leek() { return this.leeks[this.action[1]] }
		get target() { return this.leeks[this.action[4]] }
		get effect() { return this.action[5] }
		get value() { return this.action[6] }
	}
</script>

<style lang="scss" scoped>
	.turn {
		font-size: 18px;
		color: #888;
		margin: 10px 0;
		margin-left: -20px;
	}
	.action {
		padding-top: 2px;
	}
</style>