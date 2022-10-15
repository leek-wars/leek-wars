<template functional>
	<div :a="props.a">
		<i18n path="fight.leek_cast_cost">
			<leek slot="leek" :leek="props.action.entity" />
			<template v-slot:chip>
				<b>{{ parent.$t('chip.' + props.action.item.name) }}</b>
			</template>
			<template v-slot:cost>
				<b class="color-tp">{{ parent.$t('fight.n_tp', [props.action.item.cost]) }}</b>
			</template>
		</i18n>
		<span v-if="props.action.params[3] === 2">... {{ parent.$t('effect.critical') }}</span>
	</div>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionUseChip extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>