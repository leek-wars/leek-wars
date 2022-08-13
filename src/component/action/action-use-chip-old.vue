<template functional>
	<div>
		<i18n path="fight.leek_cast">
			<leek slot="leek" :leek="props.action.entity" />
			<template v-slot:chip>
				<b>{{ parent.$t('chip.' + parent.CHIPS[parent.LeekWars.chipTemplates[props.action.params[3]].item].name) }}</b>
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
	export default class ActionUseChipOld extends Vue {
		@Prop() action!: Action
	}
</script>