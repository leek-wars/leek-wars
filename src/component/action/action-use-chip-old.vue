<template>
	<div :a="props.a">
		<i18n-t keypath="fight.leek_cast">
			<leek slot="leek" :leek="props.action.entity" />
			<template v-slot:chip>
				<b>{{ parent.$t('chip.' + parent.CHIPS[parent.LeekWars.chipTemplates[props.action.params[3]].item].name) }}</b>
			</template>
		</i18n-t>
		<span v-if="props.action.params[4] === 2">... {{ parent.$t('effect.critical') }}</span>
	</div>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionUseChipOld extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>