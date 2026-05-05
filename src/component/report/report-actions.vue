<template>
	<div class="fight-actions" @click="onActionClick" @auxclick="onActionClick">
		<template v-for="(action, a) in actions" :key="a">
			<component :is="ActionComponents[action.type]" :action="action" :a="a" :leeks="leeks" :report="report" :hasErrWarn="hasErrWarn" @goToTurn="goToTurn" />
			<template v-if="displayLogs && (displayAlliesLogs || action.me) && action.logs.length">
				<action-log v-for="(log, l) in action.logs" :key="a + 'l' + l" :log="log" :leeks="leeks" :action="(a as number)" :index="(l as number)" :lines="true" @goToAI="goToAI" />
			</template>
		</template>
		<action-end-fight />
	</div>
</template>

<script setup lang="ts">
	import { ActionComponents as ActionComponentsTyped } from '@/model/action-components'
	import { Fight, Report } from '@/model/fight'
	import ActionEndFight from '../action/action-end-fight.vue'
	import ActionLog from './report-log.vue'
	import router from '@/router'
	import { useRouter } from 'vue-router'

	defineOptions({ name: "actions" })

	const ActionComponents: Record<number, any> = ActionComponentsTyped

	const props = defineProps<{
		fight: Fight
		report: Report
		actions: any[]
		leeks: {[key: number]: any}
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
