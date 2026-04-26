<template lang="html">
	<rich-tooltip-item v-if="component" v-slot="{ props }" :item="LeekWars.items[component.template]" :bottom="true">
		<div class="component" :class="{dragging: ($parent as any)?.draggedComponent && ($parent as any).draggedComponent.template === component.template && ($parent as any).draggedComponentLocation === 'leek'}" draggable="true" v-bind="props" @dragstart="$emit('componentDragStart', 'leek', component, $event)" @dragend="$emit('componentDragEnd', component)">
			<img :src="'/image/component/' + LeekWars.items[component.template].name + '.png'">
		</div>
	</rich-tooltip-item>
	<div v-else class="component" :class="{dashed: ($parent as any)?.draggedComponent && ($parent as any).draggedComponentLocation === 'farmer'}" @dragover="$emit('dragOver')" @drop="$emit('componentsDrop', 'leek', $event, 1)"></div>
</template>

<script setup lang="ts">
import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'

defineProps<{
	component: any
}>()

defineEmits<{
	componentDragStart: [where: string, component: any, event: DragEvent]
	componentDragEnd: [component: any]
	dragOver: []
	componentsDrop: [where: string, event: DragEvent, qty: number]
}>()
</script>

<style lang="scss" scoped>
.component {
	width: 60px;
	height: 60px;
}
</style>