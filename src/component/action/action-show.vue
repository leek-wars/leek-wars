
<template>
	<i18n-t tag="div" keypath="fight.leek_show_cell" :a="props.a">
		<leek slot="leek" :leek="props.action.entity" />
		<template v-slot:cell>
			<b>{{ props.action.params[1] }}</b>
		</template>
		<template v-slot:cost>
			<b class="color-tp">{{ parent.$t('fight.n_tp', [1]) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionShow extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
