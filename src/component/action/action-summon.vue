
<template>
	<i18n tag="div" path="fight.summon" :a="props.a">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<leek slot="summon" :leek="parent.leeks[props.action.params[2]]" />
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionSummon extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
