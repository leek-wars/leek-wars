
<template functional>
	<component :is="parent.EffectComponents[props.action.item.type]" :leek="parent.leeks[props.action.item.target]" :value="props.action.params[2]" :turns="props.action.item.turns" :a="props.a" />
	<!-- <div>stack {{ props.action }} {{ props.action.item }}</div> -->
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionStackEffect extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
