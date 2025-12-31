
<template>
	<i18n-t tag="div" keypath="fight.leek_bug" :a="a">
		<leek slot="leek" :leek="parent.leeks[action.params[1]]" />
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionBug extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
