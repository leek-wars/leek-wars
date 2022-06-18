
<template functional>
	<i18n tag="div" path="fight.leek_is_dead" class="kill" :style="{borderColor: props.action.params.length > 2 ? parent.TEAM_COLORS[parent.leeks[props.action.params[2]].team - 1] : ''}">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionPlayerDead extends Vue {
		@Prop() action!: Action
	}
</script>

<style lang="scss" scoped>
	.kill {
		border: 3px solid #000;
		border-radius: 5px;
		padding: 2px 3px;
		margin-left: -5px;
		display: table;
	}
</style>