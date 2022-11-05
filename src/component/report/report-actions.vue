<template>
	<div class="fight-actions">
		<template v-for="(action, a) in actions">
			<component :key="a" :is="ActionComponents[action.type]" :action="action" class="action" />
			<template v-if="displayLogs && (displayAlliesLogs || action.me) && action.logs.length">
				<action-log v-for="(log, l) in action.logs" :key="a + 'l' + l" :log="log" :leeks="leeks" />
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
	import { TEAM_COLORS } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionEndFight from '../action/action-end-fight.vue'
	import ActionLeekElement from './action-leek.vue'
	import ActionLog from './report-log.vue'

	@Component({ name: "actions", components: {
		leek: ActionLeekElement,
		'action-end-fight': ActionEndFight,
		'action-log': ActionLog
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
	}
</script>
