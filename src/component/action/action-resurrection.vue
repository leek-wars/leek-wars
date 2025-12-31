
<template>
	<i18n-t tag="div" keypath="fight.leek_resurrect" :a="props.a">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<leek slot="target" :leek="parent.leeks[props.action.params[2]]" />
		<span v-if="props.action.params[4] === 2">... {{ parent.$t('effect.critical') }}</span>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionResurrection extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
