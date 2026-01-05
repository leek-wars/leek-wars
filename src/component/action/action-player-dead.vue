
<template>
	<i18n-t tag="div" keypath="fight.leek_is_dead" class="kill" :style="{borderColor: action.params.length > 2 && leeks[action.params[2]] ? TEAM_COLORS[leeks[action.params[2]].team - 1] : ''}" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { Leek } from '@/model/leek'
	import { TEAM_COLORS } from '@/model/team'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionPlayerDead extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
		TEAM_COLORS = TEAM_COLORS
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