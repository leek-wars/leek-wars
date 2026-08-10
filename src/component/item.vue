<template lang="html">
	<rich-tooltip-item :bottom="true" :instant="true" :item="item" :inventory="true">
		<div class="item">
			<img :src="url" :alt="label" :class="{weapon: is_weapon}">
		</div>
	</rich-tooltip-item>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { ItemType, ITEM_CATEGORY_NAME as ITEM_CATEGORY_NAME_TYPED, itemImageName, type ItemTemplate } from '@/model/item'
import { i18n } from '@/model/i18n'

const RichTooltipItem = defineAsyncComponent(() => import('@/component/rich-tooltip/rich-tooltip-item.vue'))

defineOptions({ name: 'Item' })

const ITEM_CATEGORY_NAME: Record<number, string> = ITEM_CATEGORY_NAME_TYPED

const props = defineProps<{
	item: ItemTemplate
}>()

const image = computed(() => itemImageName(props.item))
const url = computed(() => '/image/' + ITEM_CATEGORY_NAME[props.item.type] + '/' + image.value + '.png')
const is_weapon = computed(() => props.item.type === ItemType.WEAPON)
// alt accessible : nom traduit de l'objet, repli sur le nom brut si la clé
// de traduction n'existe pas (dégradation gracieuse, jamais la clé brute).
const label = computed(() => {
	const key = ITEM_CATEGORY_NAME[props.item.type] + '.' + image.value
	return i18n.global.te(key) ? i18n.t(key) as string : image.value
})
</script>

<style lang="scss" scoped>
.item {
	background: var(--pure-white);
	border-radius: var(--radius);
	box-shadow: var(--elevation-1);
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