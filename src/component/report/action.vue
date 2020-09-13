<template>
	<div>
		<div v-if="type === ActionType.START_FIGHT || type === ActionType.NEW_TURN" class="turn">
			{{ $t('fight.turn_n', [turn]) }}
		</div>
		<div v-else-if="type === ActionType.USE_WEAPON">
			<i18n path="fight.leek_shoot">
				<leek slot="leek" :leek="leek" />
				<b slot="weapon">{{ $t('weapon.' + action.weapon) }}</b>
			</i18n>
			<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
		</div>
		<div v-else-if="type === ActionType.USE_CHIP">
			<i18n path="fight.leek_cast">
				<leek slot="leek" :leek="leek" />
				<b slot="chip">{{ $t('chip.' + LeekWars.chips[LeekWars.chipTemplates[action.params[3]].item].name) }}</b>
			</i18n>
			<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
		</div>
		<i18n v-else-if="type === ActionType.SET_WEAPON" path="fight.leek_take_weapon" tag="div">
			<leek slot="leek" :leek="leek" />
			<b slot="weapon">{{ $t('weapon.' + LeekWars.weapons[LeekWars.weaponTemplates[action.params[2]].item].name) }}</b>
		</i18n>
		<div v-else-if="type === ActionType.END_FIGHT">
			{{ $t('fight.end_of_fight') }}
		</div>
		<i18n v-else-if="type === ActionType.PLAYER_DEAD" tag="div" path="fight.leek_is_dead">
			<leek slot="leek" :leek="leek" />
		</i18n>
		<i18n v-else-if="type === ActionType.LEEK_TURN" tag="div" path="fight.turn_of_leek">
			<leek slot="leek" :leek="leek" />
		</i18n>
		<i18n v-else-if="type === ActionType.MOVE_TO" tag="div" path="fight.leek_move">
			<leek slot="leek" :leek="leek" />
		</i18n>
		<i18n v-else-if="type === ActionType.TP_LOST" tag="div" path="fight.leek_loose_x">
			<leek slot="leek" :leek="leek" />
			<b slot="value" class="color-tp">{{ $t('fight.n_tp', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.LIFE_LOST || type === ActionType.DAMAGE_RETURN || type === ActionType.POISON_DAMAGE || type === ActionType.LIFE_DAMAGE || type === ActionType.AFTEREFFECT" tag="div" path="fight.leek_loose_x">
			<leek slot="leek" :leek="leek" />
			<b slot="value" class="color-life">{{ $t('fight.n_life', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.NOVA_DAMAGE" tag="div" path="fight.leek_loose_x">
			<leek slot="leek" :leek="leek" />
			<b slot="value" class="color-max-life">{{ $t('fight.n_max_life', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.MP_LOST" tag="div" path="fight.leek_loose_x">
			<leek slot="leek" :leek="leek" />
			<b slot="value" class="color-mp">{{ $t('fight.n_mp', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.CARE" tag="div" path="fight.leek_win_x">
			<leek slot="leek" :leek="leek" />
			<b slot="value" class="color-life">{{ $t('fight.n_life', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.BOOST_VITA" tag="div" path="fight.leek_win_x">
			<leek slot="leek" :leek="leek" />
			<b slot="value" class="color-life">{{ $t('fight.n_vita', [action.params[2]]) }}</b>
		</i18n>
		<template v-else-if="type === ActionType.ADD_CHIP_EFFECT || type === ActionType.ADD_WEAPON_EFFECT || type === ActionType.ADD_STACKED_EFFECT">
			<i18n v-if="effect === EffectType.ABSOLUTE_SHIELD || effect === EffectType.STEAL_ABSOLUTE_SHIELD || effect === EffectType.RAW_ABSOLUTE_SHIELD" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-resistance">{{ $t('fight.n_absolute_shield', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.RELATIVE_SHIELD" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-resistance">{{ $t('fight.n_relative_shield', [value + '%']) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.VULNERABILITY" path="fight.leek_receives_x">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-resistance">{{ $t('fight.n_vulnerability', [value + '%']) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.ABSOLUTE_VULNERABILITY" path="fight.leek_receives_x">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-resistance">{{ $t('fight.n_vulnerability', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_AGILITY || effect === EffectType.RAW_BUFF_AGILITY" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-agility">{{ $t('fight.n_agility', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_STRENGTH || effect === EffectType.RAW_BUFF_STRENGTH" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-strength">{{ $t('fight.n_strength', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_RESISTANCE" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-resistance">{{ $t('fight.n_resistance', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_WISDOM" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-wisdom">{{ $t('fight.n_wisdom', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.RAW_BUFF_MAGIC" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-magic">{{ $t('fight.n_magic', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.RAW_BUFF_SCIENCE" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-science">{{ $t('fight.n_science', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_MP || effect === EffectType.RAW_BUFF_MP" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-mp">{{ $t('fight.n_mp', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_TP || effect === EffectType.RAW_BUFF_TP" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-tp">{{ $t('fight.n_tp', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_TP" path="fight.leek_loose_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-tp">{{ $t('fight.n_tp', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_MP" path="fight.leek_loose_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-mp">{{ $t('fight.n_mp', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_STRENGTH" path="fight.leek_loose_x">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-strength">{{ $t('fight.n_strength', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_MAGIC" path="fight.leek_loose_x">
				<leek slot="leek" :leek="target" />
				<b slot="value" class="color-magic">{{ $t('fight.n_magic', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.DAMAGE_RETURN" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" />
				<b slot="value">{{ $t('fight.n_damage_return', [value + '%']) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
		</template>
		<i18n v-else-if="type === ActionType.REDUCE_EFFECTS" tag="div" path="fight.reduce_effects">
			<leek slot="leek" :leek="leek" />
			<b slot="value">{{ action.params[2] }}%</b>
		</i18n>
		<i18n v-else-if="type === ActionType.REMOVE_POISONS" tag="div" path="fight.remove_poisons">
			<leek slot="leek" :leek="leek" />
		</i18n>
		<i18n v-else-if="type === ActionType.SAY" tag="div" path="fight.leek_speak">
			<leek slot="leek" :leek="leek" />
			<i slot="text">{{ (leeks[action.params[1]].farmer && leeks[action.params[1]].farmer.muted) ? "@*%#$€" : action.params[2] }}</i>
		</i18n>
		<i18n v-else-if="type === ActionType.SUMMON" tag="div" path="fight.summon">
			<leek slot="leek" :leek="leek" />
			<leek slot="summon" :leek="leeks[action.params[2]]" />
		</i18n>
		<i18n v-else-if="type === ActionType.SHOW" tag="div" path="fight.leek_show_cell">
			<leek slot="leek" :leek="leek" />
			<b slot="cell">{{ action.params[2] }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.BUG" tag="div" path="fight.leek_bug">
			<leek slot="leek" :leek="leek" />
		</i18n>
		<i18n v-else-if="type === ActionType.RESURRECTION" tag="div" path="fight.leek_resurrect">
			<leek slot="leek" :leek="leek" />
			<leek slot="target" :leek="leeks[action.params[2]]" />
		</i18n>
		<div v-if="action.logs.length" class="logs">
			<pre v-for="(log, l) in action.logs" :key="l" :class="logClass(log)" :style="{color: logColor(log)}" class="log">[<leek :leek="leeks[log[0]]" />] {{ logText(log) }}</pre>
		</div>
	</div>
</template>

<script lang="ts">
	import { Action, ActionType } from '@/model/action'
	import { EffectType } from '@/model/effect'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from './action-leek.vue'

	@Component({ components: {leek: ActionLeekElement} })
	export default class ActionElement extends Vue {
		@Prop({required: true}) action!: Action
		@Prop({required: true}) leeks!: {[key: number]: any}
		@Prop({required: true}) turn!: number
		ActionType = ActionType
		EffectType = EffectType
		get type() { return this.action.params[0] }
		get leek() { return this.leeks[this.action.params[1]] }
		get target() { return this.leeks[this.action.params[4]] }
		get effect() { return this.action.params[5] }
		get value() { return this.action.params[6] }
		get turns() { return this.action.params[7] }
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
		formatTurns(turns: number) {
			return turns === -1 ? '∞' : turns
		}
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
	.logs {
		padding: 3px 12px;
	}
	.log {
		padding: 2px 0;
		font-size: 11px;
		margin: 0;
		font-family: monospace;
		word-break: break-all;
		white-space: pre-wrap;
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