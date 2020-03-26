<template>
	<div>
		{{ resetCounter() }}
		<action v-for="(action, a) in actions" :key="a" :action="action" :logs="[]" :leeks="leeks" :turn="turnCounter(action)" class="action" />
	</div>
</template>

<script lang="ts">
	import ActionElement from '@/component/report/action.vue'
	import { Action, ActionType } from '@/model/action'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	let turn = 1

	@Component({ name: "actions", components: { action: ActionElement } })
	export default class ActionsElement extends Vue {
		@Prop({required: true}) actions!: number[][]
		@Prop({required: true}) leeks!: {[key: number]: any}
		resetCounter() {
			turn = 1
		}
		turnCounter(action: Action) {
			if (action.params[0] === ActionType.NEW_TURN) { turn++ }
			return turn
		}
	}
</script>
