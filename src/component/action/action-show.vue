
<template>
	<i18n-t tag="div" keypath="fight.leek_show_cell" :a="a">
		<template #leek>
			<leek :leek="action.entity" />
		</template>
		<template #cell>
			<b>{{ action.params[1] }}</b>
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
	a?: number
	leeks?: Record<number, any>
}>()
</script>
