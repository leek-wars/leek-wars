
<template functional>
	<i18n tag="div" path="fight.leek_loose_x" :a="props.a">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<template v-slot:value>
			<b class="color-max-life">{{ parent.$t('fight.n_max_life', [props.action.params[2]]) }}</b>
		</template>
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionNovaDamage extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
