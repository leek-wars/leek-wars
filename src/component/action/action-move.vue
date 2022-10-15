
<template functional>
	<i18n tag="div" path="fight.leek_move" :a="props.a">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<template v-slot:cost>
			<b class="color-mp">{{ parent.$t('fight.n_mp', [props.action.params[3].length]) }}</b>
		</template>
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionMove extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
