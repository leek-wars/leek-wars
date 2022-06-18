
<template functional>
	<i18n tag="div" path="fight.leek_resurrect">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<leek slot="target" :leek="parent.leeks[props.action.params[2]]" />
		<span v-if="props.action.params[4] === 2">... {{ parent.$t('effect.critical') }}</span>
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionResurrection extends Vue {
		@Prop() action!: Action
	}
</script>
