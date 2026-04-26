
<template>
	<i18n-t tag="div" keypath="fight.leek_loose_x" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #value>
			<b class="color-life">{{ $t('fight.n_life', [action.params[2]]) }}</b>
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import Leek from '../report/action-leek.vue'

defineProps<{
	action: Action
	a: number
	leeks: Record<number, any>
}>()
</script>
