<template>
	<div :a="a">
		<i18n-t keypath="fight.leek_cast">
			<template #leek>
				<leek :leek="action.entity" />
			</template>
			<template #chip>
				<b>{{ $t('chip.' + CHIPS[LeekWars.chipTemplates[action.params[3]].item].name) }}</b>
			</template>
		</i18n-t>
		<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
	</div>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
import { Leek } from '@/model/leek'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionUseChipOld extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
	}
</script>