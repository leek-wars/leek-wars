
<template>
	<i18n-t tag="div" keypath="fight.summon" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #summon>
			<leek :leek="leeks[action.params[2]]" />
		</template>
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
