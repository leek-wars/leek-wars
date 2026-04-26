
<template>
	<i18n-t tag="div" keypath="fight.leek_speak" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #text>
			<i>{{ (leeks[action.params[1]].farmer && leeks[action.params[1]].farmer.muted) ? "@*%#$€" : action.params[2] }}</i>
		</template>
		<template #cost>
			<b class="color-tp">{{ $t('fight.n_tp', [1]) }}</b>
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
