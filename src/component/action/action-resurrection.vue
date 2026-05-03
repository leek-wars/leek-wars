
<template>
	<i18n-t tag="div" keypath="fight.leek_resurrect" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #target>
			<leek :leek="leeks[action.params[2]]" />
		</template>
		<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
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
