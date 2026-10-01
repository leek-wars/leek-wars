
<template>
	<i18n-t tag="div" keypath="fight.plant_awake" :a="a">
		<template #plant>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #leek>
			<leek :leek="leeks[action.params[2]]" />
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import type { ReportLeek } from '@/model/fight'
import Leek from '../report/action-leek.vue'

defineProps<{
	action: Action
	a?: number
	leeks: Record<number, ReportLeek>
}>()
</script>
