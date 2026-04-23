<template>
	<div class="fight-actions" @click="onActionClick" @auxclick="onActionClick">
		<template v-for="(action, a) in actions" :key="a">
			<component :is="ActionComponents[action.type]" :action="action" :a="a" :leeks="leeks" :report="report" :hasErrWarn="hasErrWarn" @goToTurn="goToTurn" />
			<template v-if="displayLogs && (displayAlliesLogs || action.me) && action.logs.length">
				<action-log v-for="(log, l) in action.logs" :key="a + 'l' + l" :log="log" :leeks="leeks" :action="a" :index="l" :lines="true" @goToAI="goToAI" />
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
	import { Fight, Report } from '@/model/fight'
	import { TEAM_COLORS } from '@/model/team'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionEndFight from '../action/action-end-fight.vue'
	import ActionLeekElement from './action-leek.vue'
	import ActionLog from './report-log.vue'
	import { ITEM_CATEGORY_NAME } from '@/model/item'
	import { fileSystem } from '@/model/filesystem'
	import router from '@/router'

	@Options({ name: "actions", components: {
		leek: ActionLeekElement,
		'action-end-fight': ActionEndFight,
		'action-log': ActionLog
	} })
	export default class ActionsElement extends Vue {
		@Prop({required: true}) fight!: Fight
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
		ActionComponents = Object.freeze(ActionComponents)
		EffectComponents = Object.freeze(EffectComponents)
		ITEM_CATEGORY_NAME = ITEM_CATEGORY_NAME
		fileSystem = fileSystem

		findAction(e: MouseEvent) {
			let current = e.target as Element | null
			while (current) {
				if (current.getAttribute('a')) return current
				if (current.classList.contains('fight-actions')) return null
				current = current.parentElement
			}
			return null
		}

		onActionClick(e: MouseEvent) {
			if (e.button !== 0 && e.button !== 1) return
			const t = e.target as HTMLElement
			if (t.closest('a, .ai, button, .pause')) return
			const target = this.findAction(e)
			if (!target) return
			const action = target.getAttribute('a')
			const href = '/fight/' + this.fight.id + '?action=' + action
			if (e.button === 1 || e.ctrlKey || e.metaKey) {
				window.open(href, '_blank')
			} else {
				this.$router.push(href)
			}
			e.preventDefault()
		}

		goToTurn(turn: number) {
			const element = document.getElementById('turn-' + turn)!
			const sibling = element.parentElement!.nextElementSibling!
			window.scrollTo(0, sibling.getBoundingClientRect().top + window.scrollY - 42)
		}

		goToAI(file: number, line: number) {
			router.push('/editor/' + file + '?line=' + line)
		}
	}
</script>
