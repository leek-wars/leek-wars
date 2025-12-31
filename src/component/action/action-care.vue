
<template>
	<i18n-t tag="div" keypath="fight.leek_win_x" :a="props.a">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<template v-slot:value>
			<b class="color-life">{{ $t('fight.n_life', [props.action.params[2]]) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionCare extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
