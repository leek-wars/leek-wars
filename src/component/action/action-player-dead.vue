
<template>
	<i18n-t tag="div" keypath="fight.leek_is_dead" class="kill" :style="{borderColor: action.params.length > 2 && leeks[action.params[2]] ? TEAM_COLORS[leeks[action.params[2]].team - 1] : ''}" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import Leek from '../report/action-leek.vue'
import { TEAM_COLORS } from '@/model/team'

defineProps<{
	action: Action
	a?: number
	leeks: Record<number, any>
}>()
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