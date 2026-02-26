<template>
	<div class="turn" :a="a">
		<div :id="'turn-' + (action.params[1] || 1)" class="black">
			<span class="label" @click="$emit('goToTurn', action.params[1] || 1)">{{ $t('fight.turn_n', [action.params[1] || 1]) }}</span>
			<v-icon v-if="report" :class="{disabled: (action.params[1] || 1) == 1 && !hasErrWarn}" @click="$emit('goToTurn', (action.params[1] || 1) - 1)">mdi-chevron-left</v-icon>
			<v-icon v-if="report" :class="{disabled: action.params[1] === report.duration}" @click="$emit('goToTurn', (action.params[1] || 1) + 1)">mdi-chevron-right</v-icon>
		</div>
	</div>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Report } from '@/model/fight'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({})
	export default class ActionNewTurn extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() report!: Report
		@Prop() hasErrWarn!: boolean
	}
</script>
