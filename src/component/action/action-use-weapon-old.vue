<template>
	<div :a="props.a">
		<i18n path="fight.leek_shoot">
			<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
			<template v-slot:weapon>
				<b>{{ parent.$t('weapon.' + props.action.item.name) }}</b>
			</template>
		</i18n>
		<span v-if="props.action.params[4] === 2">... {{ parent.$t('effect.critical') }}</span>
	</div>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionUseWeaponOld extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>