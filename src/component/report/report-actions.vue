<template>
	<div class="fight-actions" @click="onActionClick" @auxclick="onActionClick">
		<template v-for="(action, a) in actions" :key="a">
			<component :is="(ActionComponents as Record<number, unknown>)[action.type]" :action="action" :a="a" :leeks="leeks" :report="report" :has-err-warn="hasErrWarn" @goToTurn="goToTurn" />
			<template v-if="displayLogs && (displayAlliesLogs || action.me) && action.logs.length">
				<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
				<action-log v-for="(log, l) in (action.logs as any[])" :key="a + 'l' + l" :log="(log as any)" :leeks="(leeks as any)" :action="(a as number)" :index="(l as number)" :lines="true" @goToAI="(...args: any[]) => goToAI(...(args as Parameters<typeof goToAI>))" />
			</template>
		</template>
		<action-end-fight />
	</div>
</template>

<script setup lang="ts">
	import { ActionComponents as ActionComponentsTyped } from '@/model/action-components'
	import { Fight, Report, ReportLeek } from '@/model/fight'
	import ActionEndFight from '../action/action-end-fight.vue'
	import ActionLog from './report-log.vue'
	import router from '@/router'
	import { useRouter } from 'vue-router'

	defineOptions({ name: "Actions" })

	const ActionComponents = ActionComponentsTyped

	interface FightAction {
		type: number
		me?: boolean
		logs: unknown[]
		[key: string]: unknown
	}
	const props = defineProps<{
		fight: Fight
		report: Report
		actions: FightAction[]
		leeks: {[key: number]: ReportLeek}
		displayLogs: boolean
		displayAlliesLogs: boolean
		hasErrWarn: boolean
	}>()

	const $router = useRouter()

	function findAction(e: MouseEvent) {
		let current = e.target as Element | null
		while (current) {
			if (current.getAttribute('a')) return current
			if (current.classList.contains('fight-actions')) return null
			current = current.parentElement
		}
		return null
	}

	function onActionClick(e: MouseEvent) {
		if (e.button !== 0 && e.button !== 1) return
		const t = e.target as HTMLElement
		if (t.closest('a, .ai, button, .pause')) return
		const target = findAction(e)
		if (!target) return
		const action = target.getAttribute('a')
		const href = '/fight/' + props.fight.id + '?action=' + action
		if (e.button === 1 || e.ctrlKey || e.metaKey) {
			window.open(href, '_blank')
		} else {
			$router.push(href)
		}
		e.preventDefault()
	}

	function goToTurn(turn: number) {
		const element = document.getElementById('turn-' + turn)!
		const sibling = element.parentElement!.nextElementSibling!
		window.scrollTo(0, sibling.getBoundingClientRect().top + window.scrollY - 42)
	}

	function goToAI(file: string, line: number) {
		router.push('/editor/' + file + '?line=' + line)
	}
</script>
