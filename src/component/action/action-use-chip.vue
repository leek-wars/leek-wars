<template>
	<div :a="a">
		<i18n-t keypath="fight.leek_cast_cost">
			<template #leek>
				<leek :leek="action.entity" />
			</template>
			<template #chip>
				<b>{{ $t('chip.' + action.item.name) }}</b>
			</template>
			<template #cost>
				<b class="color-tp">{{ $t('fight.n_tp', [action.item.cost]) }}</b>
			</template>
		</i18n-t>
		<span v-if="action.params[3] === 2">... {{ $t('effect.critical') }}</span>
	</div>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { Leek } from '@/model/leek'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionUseChip extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
	}
</script>