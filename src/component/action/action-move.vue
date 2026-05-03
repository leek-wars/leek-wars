
<template>
	<i18n-t tag="div" keypath="fight.leek_move" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #cost>
			<b class="color-mp">{{ $t('fight.n_mp', [action.params[3].length]) }}</b>
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import Leek from '../report/action-leek.vue'

defineProps<{
	action: Action
	a?: number
	leeks: Record<number, any>
}>()
</script>
