
<template>
	<i18n-t tag="div" keypath="fight.leek_move" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #cost>
			<b class="color-mp">{{ $t('fight.n_mp', [action.params[3].length]) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { Leek } from '@/model/leek'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionMove extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
	}
</script>
