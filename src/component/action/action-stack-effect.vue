
<template>
	<component :is="(EffectComponents as Record<number, unknown>)[(action.item as { type: number }).type]" :leek="leeks[(action.item as { target: number }).target]" :value="action.params[2]" :turns="(action.item as { turns: number }).turns" :a="a" />
	<!-- <div>stack {{ props.action }} {{ props.action.item }}</div> -->
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
