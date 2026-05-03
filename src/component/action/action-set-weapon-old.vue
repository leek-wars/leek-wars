<template>
	<i18n-t keypath="fight.leek_take_weapon" tag="div" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #weapon>
			<b>{{ $t('weapon.' + LeekWars.weapons[action.params[2]].name) }}</b>
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