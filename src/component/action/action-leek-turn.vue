
<template>
	<i18n-t tag="div" keypath="fight.turn_of_leek" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import Leek from '../report/action-leek.vue'

defineProps<{
	action: Action
	a?: number
	leeks?: Record<number, any>
}>()
</script>
