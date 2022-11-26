<template functional>
	<div class="turn" :a="props.a">
		<div :id="'turn-' + (props.action.params[1] || 1)" class="black">
			<span class="label" @click="parent.goToTurn(props.action.params[1] || 1)">{{ parent.$t('fight.turn_n', [props.action.params[1] || 1]) }}</span>
			<v-icon v-if="parent.report" :class="{disabled: (props.action.params[1] || 1) == 1 && !parent.hasErrWarn}" @click="parent.goToTurn((props.action.params[1] || 1) - 1)">mdi-chevron-left</v-icon>
			<v-icon v-if="parent.report" :class="{disabled: props.action.params[1] === parent.report.duration}" @click="parent.goToTurn((props.action.params[1] || 1) + 1)">mdi-chevron-right</v-icon>
		</div>
	</div>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class ActionNewTurn extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
