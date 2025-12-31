
<template>
	<component :is="EffectComponents[action.params[5]]" :leek="parent.leeks[action.params[4]]" :value="action.params[6]" :turns="action.params[7]" :a="a" />
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionAddEffect extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
