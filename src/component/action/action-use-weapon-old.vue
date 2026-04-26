<template>
	<div :a="a">
		<i18n-t keypath="fight.leek_shoot">
			<template #leek>
				<leek :leek="leeks[action.params[1]]" />
			</template>
			<template #weapon>
				<b>{{ $t('weapon.' + action.item.name) }}</b>
			</template>
		</i18n-t>
		<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
	</div>
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