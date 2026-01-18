
<template>
	<i18n-t tag="div" keypath="fight.leek_loose_x" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #value>
			<b class="color-life">{{ $t('fight.n_life', [action.params[2]]) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { Leek } from '@/model/leek'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionLifeLost extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
	}
</script>
