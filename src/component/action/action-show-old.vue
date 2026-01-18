
<template>
	<i18n-t tag="div" keypath="fight.leek_show_cell" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #cell>
			<b>{{ action.params[2] }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionShowOld extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
