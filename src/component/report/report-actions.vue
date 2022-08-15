<template>
	<div class="fight-actions">
		<template v-for="(action, a) in actions">
			<component :key="a" :is="ActionComponents[action.type]" :action="action" class="action" />
			<template v-if="displayLogs && (displayAlliesLogs || action.me) && action.logs.length">
				<pre v-for="(log, l) in action.logs" :key="a + 'l' + l" :class="logClass(log)" :style="{color: logColor(log)}">[<leek :leek="leeks[log[0]]" :dark="false" />] {{ logText(log) }}</pre>
			</template>
		</template>
		<action-end-fight />
	</div>
</template>

<script lang="ts">
	import { ActionType } from '@/model/action'
	import { ActionComponents, EffectComponents } from '@/model/action-components'
import { CHIPS } from '@/model/chips'
	import { EffectType } from '@/model/effect'
	import { Report } from '@/model/fight'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { TEAM_COLORS } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionEndFight from '../action/action-end-fight.vue'
	import ActionLeekElement from './action-leek.vue'

	@Component({ name: "actions", components: {
		leek: ActionLeekElement,
		'action-end-fight': ActionEndFight
	} })
	export default class ActionsElement extends Vue {
		@Prop({required: true}) report!: Report
		@Prop({required: true}) actions!: number[][]
		@Prop({required: true}) leeks!: {[key: number]: any}
		@Prop({required: true}) displayLogs!: boolean
		@Prop({required: true}) displayAlliesLogs!: boolean
		@Prop({required: true}) hasErrWarn!: boolean

		CHIPS = CHIPS
		ActionType = ActionType
		EffectType = EffectType
		TEAM_COLORS = TEAM_COLORS
		ActionComponents = ActionComponents
		EffectComponents = EffectComponents

		goToTurn(turn: number) {
			const element = document.getElementById('turn-' + turn)!
			const sibling = element.parentElement!.nextElementSibling!
			window.scrollTo(0, sibling.getBoundingClientRect().top + window.scrollY - 42)
		}
		formatTurns(turns: number) {
			return turns === -1 ? '∞' : turns
		}
		logClass(log: any[]) {
			if (log[1] === 2 || log[1] === 7 || log[1] === 11) { return "warning" }
			else if (log[1] === 3 || log[1] === 8) { return "error" }
			else if (log[1] === 5) { return "pause" }
			return null
		}
		logColor(log: any[]) {
			return log[1] === 1 && log.length > 3 ? LeekWars.colorToHex(log[3]) : ''
		}
		logText(log: any[]) {
			if (log[1] === 5) {	return "pause()" }
			if (log[1] === 11) { return this.$t('leekscript.too_much_debug') }
			if (log[1] >= 6 && log[1] <= 8) { return i18n.t('leekscript.error_' + log[3], log[4]) + "\n" + log[2] }
			return log[2]
		}
	}
</script>
