
<template functional>
	<component :is="parent.EffectComponents[props.action.params[5]]" :leek="parent.leeks[props.action.params[4]]" :value="props.action.params[6]" :turns="props.action.params[7]" />
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionAddEffect extends Vue {
		@Prop() action!: Action
	}
</script>
