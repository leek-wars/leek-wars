<template>
	<div class="turn" :a="a">
		<div :id="'turn-' + (action.params[1] || 1)" class="black">
			<span class="label" @click="parent.goToTurn(action.params[1] || 1)">{{ $t('fight.turn_n', [action.params[1] || 1]) }}</span>
			<v-icon v-if="parent.report" :class="{disabled: (action.params[1] || 1) == 1 && !parent.hasErrWarn}" @click="parent.goToTurn((action.params[1] || 1) - 1)">mdi-chevron-left</v-icon>
			<v-icon v-if="parent.report" :class="{disabled: action.params[1] === parent.report.duration}" @click="parent.goToTurn((action.params[1] || 1) + 1)">mdi-chevron-right</v-icon>
		</div>
	</div>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({})
	export default class ActionNewTurn extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
