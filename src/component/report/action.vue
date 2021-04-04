<template>
	<div>
		<div v-if="type === ActionType.START_FIGHT || type === ActionType.NEW_TURN" :id="'turn-' + turn" class="turn">
			<span class="label" @click="goToTurn(turn)">{{ $t('fight.turn_n', [turn]) }}</span>
			<v-icon v-if="report" :class="{disabled: turn === 1 && !hasErrWarn}" @click="goToTurn(turn - 1)">mdi-chevron-left</v-icon>
			<v-icon v-if="report" :class="{disabled: turn === report.duration}" @click="goToTurn(turn + 1)">mdi-chevron-right</v-icon>
		</div>
		<div v-else-if="type === ActionType.USE_WEAPON">
			<i18n path="fight.leek_shoot">
				<leek slot="leek" :leek="leek" :dark="dark" />
				<b slot="weapon">{{ $t('weapon.' + action.weapon) }}</b>
			</i18n>
			<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
		</div>
		<div v-else-if="type === ActionType.USE_CHIP">
			<i18n path="fight.leek_cast">
				<leek slot="leek" :leek="leek" :dark="dark" />
				<b slot="chip">{{ $t('chip.' + LeekWars.chips[LeekWars.chipTemplates[action.params[3]].item].name) }}</b>
			</i18n>
			<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
		</div>
		<i18n v-else-if="type === ActionType.SET_WEAPON" path="fight.leek_take_weapon" tag="div">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="weapon">{{ $t('weapon.' + LeekWars.weapons[action.params[2]].name) }}</b>
		</i18n>
		<div v-else-if="type === ActionType.END_FIGHT">
			{{ $t('fight.end_of_fight') }}
		</div>
		<i18n v-else-if="type === ActionType.PLAYER_DEAD" tag="div" path="fight.leek_is_dead" class="kill" :style="{borderColor: action.params.length > 2 ? TEAM_COLORS[leeks[action.params[2]].team - 1] : ''}">
			<leek slot="leek" :leek="leek" :dark="dark" />
		</i18n>
		<i18n v-else-if="type === ActionType.LEEK_TURN" tag="div" path="fight.turn_of_leek">
			<leek slot="leek" :leek="leek" :dark="dark" />
		</i18n>
		<i18n v-else-if="type === ActionType.MOVE_TO" tag="div" path="fight.leek_move">
			<leek slot="leek" :leek="leek" :dark="dark" />
		</i18n>
		<i18n v-else-if="type === ActionType.TP_LOST" tag="div" path="fight.leek_loose_x">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="value" class="color-tp" :class="{dark}">{{ $t('fight.n_tp', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.LIFE_LOST || type === ActionType.DAMAGE_RETURN || type === ActionType.POISON_DAMAGE || type === ActionType.LIFE_DAMAGE || type === ActionType.AFTEREFFECT" tag="div" path="fight.leek_loose_x">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="value" class="color-life" :class="{dark}">{{ $t('fight.n_life', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.NOVA_DAMAGE" tag="div" path="fight.leek_loose_x">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="value" class="color-max-life" :class="{dark}">{{ $t('fight.n_max_life', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.NOVA_VITALITY" tag="div" path="fight.leek_win_x">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="value" class="color-max-life" :class="{dark}">{{ $t('fight.n_max_life', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.MP_LOST" tag="div" path="fight.leek_loose_x">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="value" class="color-mp" :class="{dark}">{{ $t('fight.n_mp', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.CARE" tag="div" path="fight.leek_win_x">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="value" class="color-life" :class="{dark}">{{ $t('fight.n_life', [action.params[2]]) }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.BOOST_VITA" tag="div" path="fight.leek_win_x">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="value" class="color-life" :class="{dark}">{{ $t('fight.n_vita', [action.params[2]]) }}</b>
		</i18n>
		<template v-else-if="type === ActionType.ADD_CHIP_EFFECT || type === ActionType.ADD_WEAPON_EFFECT || type === ActionType.ADD_STACKED_EFFECT">
			<i18n v-if="effect === EffectType.ABSOLUTE_SHIELD || effect === EffectType.STEAL_ABSOLUTE_SHIELD || effect === EffectType.RAW_ABSOLUTE_SHIELD" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-resistance" :class="{dark}">{{ $t('fight.n_absolute_shield', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.RELATIVE_SHIELD" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-resistance" :class="{dark}">{{ $t('fight.n_relative_shield', [value + '%']) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.VULNERABILITY" path="fight.leek_receives_x">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-resistance" :class="{dark}">{{ $t('fight.n_vulnerability', [value + '%']) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.ABSOLUTE_VULNERABILITY" path="fight.leek_receives_x">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-resistance" :class="{dark}">{{ $t('fight.n_vulnerability', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_AGILITY || effect === EffectType.RAW_BUFF_AGILITY" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-agility" :class="{dark}">{{ $t('fight.n_agility', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_STRENGTH || effect === EffectType.RAW_BUFF_STRENGTH" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-strength" :class="{dark}">{{ $t('fight.n_strength', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_RESISTANCE || effect === EffectType.RAW_BUFF_RESISTANCE" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-resistance" :class="{dark}">{{ $t('fight.n_resistance', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_WISDOM || effect === EffectType.RAW_BUFF_WISDOM" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-wisdom" :class="{dark}">{{ $t('fight.n_wisdom', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.RAW_BUFF_MAGIC" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-magic" :class="{dark}">{{ $t('fight.n_magic', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.RAW_BUFF_SCIENCE" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-science" :class="{dark}">{{ $t('fight.n_science', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_MP || effect === EffectType.RAW_BUFF_MP" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-mp" :class="{dark}">{{ $t('fight.n_mp', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.BUFF_TP || effect === EffectType.RAW_BUFF_TP" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-tp" :class="{dark}">{{ $t('fight.n_tp', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_TP" path="fight.leek_loose_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-tp" :class="{dark}">{{ $t('fight.n_tp', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_MP" path="fight.leek_loose_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-mp" :class="{dark}">{{ $t('fight.n_mp', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_STRENGTH" path="fight.leek_loose_x">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-strength" :class="{dark}">{{ $t('fight.n_strength', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_MAGIC" path="fight.leek_loose_x">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-magic" :class="{dark}">{{ $t('fight.n_magic', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_AGILITY" path="fight.leek_loose_x">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-agility" :class="{dark}">{{ $t('fight.n_agility', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.SHACKLE_WISDOM" path="fight.leek_loose_x">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value" class="color-wisdom" :class="{dark}">{{ $t('fight.n_wisdom', [value]) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
			<i18n v-else-if="effect === EffectType.DAMAGE_RETURN" path="fight.leek_win_x_turns">
				<leek slot="leek" :leek="target" :dark="dark" />
				<b slot="value">{{ $t('fight.n_damage_return', [value + '%']) }}</b>
				<b slot="turns">{{ formatTurns(turns) }}</b>
			</i18n>
		</template>
		<i18n v-else-if="type === ActionType.REDUCE_EFFECTS" tag="div" path="fight.reduce_effects">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="value">{{ action.params[2] }}%</b>
		</i18n>
		<i18n v-else-if="type === ActionType.REMOVE_POISONS" tag="div" path="fight.remove_poisons">
			<leek slot="leek" :leek="leek" :dark="dark" />
		</i18n>
		<i18n v-else-if="type === ActionType.REMOVE_SHACKLES" tag="div" path="fight.remove_shackles">
			<leek slot="leek" :leek="leek" :dark="dark" />
		</i18n>
		<i18n v-else-if="type === ActionType.SAY" tag="div" path="fight.leek_speak">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<i slot="text">{{ (leeks[action.params[1]].farmer && leeks[action.params[1]].farmer.muted) ? "@*%#$€" : action.params[2] }}</i>
		</i18n>
		<i18n v-else-if="type === ActionType.SUMMON" tag="div" path="fight.summon">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<leek slot="summon" :leek="leeks[action.params[2]]" :dark="dark" />
			<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
		</i18n>
		<i18n v-else-if="type === ActionType.SHOW" tag="div" path="fight.leek_show_cell">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<b slot="cell">{{ action.params[2] }}</b>
		</i18n>
		<i18n v-else-if="type === ActionType.BUG" tag="div" path="fight.leek_bug">
			<leek slot="leek" :leek="leek" :dark="dark" />
		</i18n>
		<i18n v-else-if="type === ActionType.RESURRECTION" tag="div" path="fight.leek_resurrect">
			<leek slot="leek" :leek="leek" :dark="dark" />
			<leek slot="target" :leek="leeks[action.params[2]]" :dark="dark" />
			<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
		</i18n>
		<div v-if="displayLogs && action.logs.length" class="logs">
			<pre v-for="(log, l) in action.logs" :key="l" :class="logClass(log)" :style="{color: logColor(log)}" class="log">[<leek :leek="leeks[log[0]]" :dark="dark" />] {{ logText(log) }}</pre>
		</div>
	</div>
</template>

<script lang="ts">
	import { Action, ActionType } from '@/model/action'
	import { EffectType } from '@/model/effect'
	import { Fight, Report } from '@/model/fight'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { TEAM_COLORS } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from './action-leek.vue'

	@Component({ components: {leek: ActionLeekElement} })
	export default class ActionElement extends Vue {
		@Prop() report!: Report
		@Prop() dark!: boolean
		@Prop({required: true}) action!: Action
		@Prop({required: true}) leeks!: {[key: number]: any}
		@Prop({required: true}) turn!: number
		@Prop({required: true}) displayLogs!: boolean
		@Prop({required: true}) hasErrWarn!: boolean
		ActionType = ActionType
		EffectType = EffectType
		TEAM_COLORS = TEAM_COLORS
		get type() { return this.action.params[0] }
		get leek() { return this.leeks[this.action.params[1]] }
		get target() { return this.leeks[this.action.params[4]] }
		get effect() { return this.action.params[5] }
		get value() { return this.action.params[6] }
		get turns() { return this.action.params[7] }
		logClass(log: any[]) {
			if (log[1] === 2 || log[1] === 7) { return "warning" }
			else if (log[1] === 3 || log[1] === 8) { return "error" }
			else if (log[1] === 5) { return "pause" }
		}
		logColor(log: any[]) {
			return log[1] === 1 && log.length > 3 ? LeekWars.colorToHex(log[3]) : ''
		}
		logText(log: any[]) {
			if (log[1] === 5) {	return "pause()" }
			if (log[1] >= 6 && log[1] <= 8) { return i18n.t('leekscript.error_' + log[3], log[4]) + "\n" + log[2] }
			return log[2]
		}
		formatTurns(turns: number) {
			return turns === -1 ? '∞' : turns
		}
		goToTurn(turn: number) {
			const element = document.getElementById('turn-' + turn)!
			console.log(element)
			const sibling = element.parentElement!.nextElementSibling!
			console.log(sibling, sibling.getBoundingClientRect())
			window.scrollTo(0, sibling.getBoundingClientRect().top + window.scrollY - 48)
		}
	}
</script>

<style lang="scss" scoped>
	.turn {
		font-size: 16px;
		background: #333;
		color: #eee;
		font-weight: 500;
		display: inline-flex;
		padding: 3px 10px;
		padding-right: 3px;
		border-radius: 4px;
		align-items: center;
		.label {
			padding-right: 5px;
			cursor: pointer;
		}
		.v-icon.disabled {
			opacity: 0.3;
			pointer-events: none;
			cursor: initial;
		}
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
	.kill {
		border: 3px solid #000;
		border-radius: 5px;
		padding: 2px 3px;
		margin-left: -5px;
		display: inline-block;
	}
</style>