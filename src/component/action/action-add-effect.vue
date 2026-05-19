
<template>
	<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
	<component :is="(EffectComponents as Record<number, unknown>)[action.params[5] as number]" :leek="leeks[action.params[4] as number]" :value="action.params[6]" :turns="action.params[7]" :a="a" />
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import type { ReportLeek } from '@/model/fight'
import { EffectComponents as EffectComponentsTyped } from '@/model/action-components'

const EffectComponents = EffectComponentsTyped

defineProps<{
	action: Action
	a?: number
	leeks: Record<number, ReportLeek>
}>()
</script>
