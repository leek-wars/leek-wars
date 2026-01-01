
<template>
	<component :is="EffectComponents[action.item.type]" :leek="leeks[action.item.target]" :value="action.params[2]" :turns="action.item.turns" :a="a" />
	<!-- <div>stack {{ props.action }} {{ props.action.item }}</div> -->
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { Leek } from '@/model/leek'
	import { EffectComponents } from '@/model/action-components'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionStackEffect extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
		EffectComponents = EffectComponents
	}
</script>
