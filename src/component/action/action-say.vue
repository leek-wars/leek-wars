
<template>
	<i18n-t tag="div" keypath="fight.leek_speak" :a="a">
		<template #leek>
			<leek :leek="action.entity" />
		</template>
		<template #text>
			<i>{{ text }}<template v-if="glagoliticValue !== null && store.state.farmer?.admin"> ({{ glagoliticValue }})</template></i>
		</template>
		<template #cost>
			<b class="color-tp">{{ $t('fight.n_tp', [1]) }}</b>
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Action } from '@/model/action'
import Leek from '../report/action-leek.vue'
import { store } from '@/model/store'

const props = defineProps<{
	action: Action
	a?: number
}>()

const GLAGOLITIC_NUMERALS: Record<string, number> = {
	'Ⰰ': 1, 'Ⰱ': 2, 'Ⰲ': 3, 'Ⰳ': 4, 'Ⰴ': 5, 'Ⰵ': 6, 'Ⰶ': 7, 'Ⰷ': 8, 'Ⰸ': 9,
	'Ⰹ': 10, 'Ⰻ': 20, 'Ⰼ': 30, 'Ⰽ': 40, 'Ⰾ': 50, 'Ⰿ': 60, 'Ⱀ': 70, 'Ⱁ': 80, 'Ⱂ': 90,
	'Ⱃ': 100, 'Ⱄ': 200, 'Ⱅ': 300, 'Ⱆ': 400, 'Ⱇ': 500, 'Ⱈ': 600, 'Ⱉ': 700, 'Ⱋ': 800, 'Ⱌ': 900,
}

function glagoliticToDecimal(s: string): number | null {
	const chars = [...s]
	if (chars.length === 0 || chars.length > 3) return null
	let r = 0
	for (const c of chars) {
		if (!(c in GLAGOLITIC_NUMERALS)) return null
		r += GLAGOLITIC_NUMERALS[c]
	}
	return r
}

const muted = computed(() => !!(props.action.entity.farmer && props.action.entity.farmer.muted))
const text = computed(() => muted.value ? "@*%#$€" : props.action.params[1])
const glagoliticValue = computed(() => muted.value ? null : glagoliticToDecimal(props.action.params[1]))
</script>
