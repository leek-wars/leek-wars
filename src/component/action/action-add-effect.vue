
<template>
	<component :is="EffectComponents[action.params[5]]" :leek="leeks[action.params[4]]" :value="action.params[6]" :turns="action.params[7]" :a="a" />
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
