<template>
	<div :a="a">
		<i18n-t keypath="fight.leek_cast">
			<template #leek>
				<leek :leek="action.entity" />
			</template>
			<template #chip>
				<b>{{ $t('chip.' + CHIPS[LeekWars.chipTemplates[action.params[3]].item].name) }}</b>
			</template>
		</i18n-t>
		<span v-if="action.params[4] === 2">... {{ $t('effect.critical') }}</span>
	</div>
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import Leek from '../report/action-leek.vue'
import { CHIPS as CHIPS_TYPED } from '@/model/chips'

const CHIPS: Record<number, any> = CHIPS_TYPED

defineProps<{
	action: Action
	a?: number
	leeks?: Record<number, any>
}>()
</script>