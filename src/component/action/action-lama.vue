
<template functional>
	<i18n tag="div" path="fight.lama" :a="props.a">
		<leek slot="leek" :leek="props.action.entity" />
		<template v-slot:cost>
			<b class="color-tp">{{ parent.$t('fight.n_tp', [1]) }}</b>
		</template>
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionLama extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
