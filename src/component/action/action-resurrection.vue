
<template>
	<i18n-t tag="div" keypath="fight.leek_resurrect" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #target>
			<leek :leek="leeks[action.params[2]]" />
		</template>
		<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { Leek } from '@/model/leek'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionResurrection extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
	}
</script>
