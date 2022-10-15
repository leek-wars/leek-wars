
<template functional>
	<i18n tag="div" path="fight.leek_show_cell" :a="props.a">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<template v-slot:cell>
			<b>{{ props.action.params[2] }}</b>
		</template>
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionShowOld extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
