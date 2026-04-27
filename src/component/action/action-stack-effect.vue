
<template>
	<component :is="EffectComponents[action.item.type]" :leek="leeks[action.item.target]" :value="action.params[2]" :turns="action.item.turns" :a="a" />
	<!-- <div>stack {{ props.action }} {{ props.action.item }}</div> -->
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import { EffectComponents as EffectComponentsTyped } from '@/model/action-components'

const EffectComponents: Record<number, any> = EffectComponentsTyped

defineProps<{
	action: Action
	a?: number
	leeks?: Record<number, any>
}>()
</script>
