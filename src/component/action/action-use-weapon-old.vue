<template>
	<div :a="a">
		<i18n-t keypath="fight.leek_shoot">
			<template #leek>
				<leek :leek="leeks[action.params[1]]" />
			</template>
			<template #weapon>
				<b>{{ $t('weapon.' + action.item.name) }}</b>
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
	export default class ActionUseWeaponOld extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
	}
</script>