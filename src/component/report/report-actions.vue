<template>
	<div class="fight-actions" @mouseover="mouseover">
		<template v-for="(action, a) in actions">
			<component :key="a" :is="ActionComponents[action.type]" :action="action" :a="a" />
			<template v-if="displayLogs && (displayAlliesLogs || action.me) && action.logs.length">
				<action-log v-for="(log, l) in action.logs" :key="a + 'l' + l" :log="log" :leeks="leeks" :action="a" :index="l" :lines="true" />
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
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionEndFight from '../action/action-end-fight.vue'
	import ActionLeekElement from './action-leek.vue'
	import ActionLog from './report-log.vue'
	import { ITEM_CATEGORY_NAME } from '@/model/item'
import { fileSystem } from '@/model/filesystem'
import router from '@/router'

	@Component({ name: "actions", components: {
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
		ActionComponents = ActionComponents
		EffectComponents = EffectComponents
		currentLink: Element | null = null
		ITEM_CATEGORY_NAME = ITEM_CATEGORY_NAME
		fileSystem = fileSystem

		goToTurn(turn: number) {
			const element = document.getElementById('turn-' + turn)!
			const sibling = element.parentElement!.nextElementSibling!
			window.scrollTo(0, sibling.getBoundingClientRect().top + window.scrollY - 42)
		}
		formatTurns(turns: number) {
			return turns === -1 ? '∞' : turns
		}

		findAction(e: MouseEvent) {
			let current = e.target as Element | null
			while (current) {
				if (current.getAttribute('a')) return current
				if (current.classList.contains('fight-actions')) return null
				current = current.parentElement
			}
			return null
		}

		mouseover(e: MouseEvent) {
			const target = this.findAction(e)
			if (target) {
				if (this.currentLink && this.currentLink !== target) {
					const l = this.currentLink.querySelector('a')
					if (l) {
						this.currentLink.removeChild(l)
					}
				}
				this.currentLink = target
				const link = target.querySelector('a')
				if (!link) {
					const action = target.getAttribute('a')
					const l = document.createElement('a')
					l.setAttribute('href', '/fight/' + this.fight.id + '?action=' + action)
					l.innerText = '➡️'
					l.onclick = (e) => {
						this.$router.push(l.getAttribute('href')!)
						e.preventDefault()
					}
					target.appendChild(l)
				}
			}
		}

		goToAI(file: number, line: number) {
			router.push('/editor/' + file + '?line=' + line)
		}
	}
</script>
