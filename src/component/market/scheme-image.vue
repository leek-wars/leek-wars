<template lang="html">
	<svg class="scheme-image" viewBox="0 0 300 215">
		<image class="bg" x="0" y="0" width="300" height="215" xlink:href="/image/resource/scheme.png" />
		<image class="item" x="55" y="55" width="190" height="190" :xlink:href="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[scheme.result].type] + '/' + LeekWars.items[scheme.result].name.replace('potion_', '') + '.png'" />
	</svg>
</template>

<script setup lang="ts">
import type { SchemeTemplate } from '@/model/scheme'
import { ITEM_CATEGORY_NAME as ITEM_CATEGORY_NAME_TYPED } from '@/model/item'

const ITEM_CATEGORY_NAME: Record<number, string> = ITEM_CATEGORY_NAME_TYPED

defineProps<{
	scheme: SchemeTemplate
}>()
</script>

<style scoped lang="scss">
.scheme-image {
	position: relative;
}
.bg {
	object-fit: contain;
}
.item {
	object-fit: contain;
	filter: grayscale(0.2);
	transform: translate(51%, -20%) scaleY(0.7) rotate(45deg);
	image-rendering: crisp-edges;
}
</style>