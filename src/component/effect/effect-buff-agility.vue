
<template>
	<i18n-t keypath="fight.leek_win_x_turns" tag="div" :a="a">
		<template #leek>
			<leek :leek="leek" />
		</template>
		<template #value>
			<b class="color-agility">{{ $t('fight.n_agility', [value]) }}</b>
		</template>
		<template #turns>
			<b>{{ LeekWars.formatTurns(turns) }}</b>
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
import type { FightLeek } from '@/model/fight'
import Leek from '../report/action-leek.vue'

defineProps<{
	leek?: FightLeek
	value?: number
	turns?: number
	a?: number
}>()
</script>
