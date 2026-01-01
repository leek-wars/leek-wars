
<template>
	<component :is="EffectComponents[action.params[5]]" :leek="leeks[action.params[4]]" :value="action.params[6]" :turns="action.params[7]" :a="a" />
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { EffectComponents } from '@/model/action-components'
	import { Leek } from '@/model/leek'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionAddEffect extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}

		EffectComponents = EffectComponents
	}
</script>
