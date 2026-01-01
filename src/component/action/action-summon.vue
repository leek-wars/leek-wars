
<template>
	<i18n-t tag="div" keypath="fight.summon" :a="a">
		<leek slot="leek" :leek="leeks[action.params[1]]" />
		<leek slot="summon" :leek="leeks[action.params[2]]" />
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionSummon extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
	}
</script>
