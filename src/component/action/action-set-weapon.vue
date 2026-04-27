<template>
	<i18n-t keypath="fight.leek_take_weapon_cost" tag="div" :a="a">
		<template #leek>
			<leek :leek="action.entity" />
		</template>
		<template #weapon>
			<b>{{ $t('weapon.' + LeekWars.weapons[action.params[1]].name) }}</b>
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
}>()
</script>