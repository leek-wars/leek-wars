<template lang="html">
	<rich-tooltip-item v-if="component" v-slot="{ props }" :item="LeekWars.items[component.template]" :bottom="true">
		<div class="component" :class="{dragging: $parent.draggedComponent && $parent.draggedComponent.template === component.template && $parent.draggedComponentLocation === 'leek'}" draggable="true" v-bind="props" @dragstart="$emit('componentDragStart', 'leek', component, $event)" @dragend="$emit('componentDragEnd', component)">
			<img :src="'/image/component/' + LeekWars.items[component.template].name + '.png'">
		</div>
	</rich-tooltip-item>
	<div v-else class="component" :class="{dashed: $parent.draggedComponent && $parent.draggedComponentLocation === 'farmer'}" @dragover="$emit('dragOver')" @drop="$emit('componentsDrop', 'leek', $event, 1)"></div>
</template>

<script lang="ts">
import { Component } from '@/model/component'
import { Component as VueComponent, Prop, Vue } from 'vue-property-decorator'
import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'

@VueComponent({ components: { RichTooltipItem } })
export default class LeekComponent extends Vue {
	@Prop({ required: true }) component!: Component
}

</script>

<style lang="scss" scoped>
.component {
	width: 60px;
	height: 60px;
}
</style>