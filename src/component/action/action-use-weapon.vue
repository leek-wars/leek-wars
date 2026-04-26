<template>
	<div :a="a">
		<i18n-t keypath="fight.leek_shoot_cost">
			<template #leek>
				<leek :leek="action.entity" />
			</template>
			<template #weapon>
				<b>{{ $t('weapon.' + action.item.name) }}</b>
			</template>
			<template #cost>
				<b class="color-tp">{{ $t('fight.n_tp', [action.item.cost]) }}</b>
			</template>
		</i18n-t>
		<span v-if="action.params[2] === 2">... {{ $t('effect.critical') }}</span>
	</div>
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import Leek from '../report/action-leek.vue'

defineProps<{
	action: Action
	a: number
}>()
</script>