<template lang="html">
	<rich-tooltip-item :bottom="true" :instant="true" :item="item" :inventory="true">
		<div class="item">
			<img :src="url" :class="{weapon: is_weapon}">
		</div>
	</rich-tooltip-item>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { ItemType, ITEM_CATEGORY_NAME as ITEM_CATEGORY_NAME_TYPED, type ItemTemplate } from '@/model/item'

const RichTooltipItem = defineAsyncComponent(() => import('@/component/rich-tooltip/rich-tooltip-item.vue'))

defineOptions({ name: 'item' })

const ITEM_CATEGORY_NAME: Record<number, string> = ITEM_CATEGORY_NAME_TYPED

const props = defineProps<{
	item: ItemTemplate
}>()

const image = computed(() => props.item.type === ItemType.COMPONENT ? props.item.name : props.item.name.substring(props.item.name.indexOf('_') + 1))
const url = computed(() => '/image/' + ITEM_CATEGORY_NAME[props.item.type] + '/' + image.value + '.png')
const is_weapon = computed(() => props.item.type === ItemType.WEAPON)
</script>

<style lang="scss" scoped>
.item {
	background: var(--pure-white);
	border-radius: 4px;
	box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	padding: 4px;
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	img.weapon {
		transform: rotate(-40deg);
		width: 120%;
		height: 120%;
		margin: -8%;
	}
}
</style>