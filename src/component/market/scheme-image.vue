<template lang="html">
	<svg class="scheme-image" viewBox="0 0 300 215">
		<image class="bg" x="0" y="0" width="300" height="215" xlink:href="/image/resource/scheme.png" />
		<image class="item" x="55" y="55" width="190" height="190" :xlink:href="itemImageUrl(LeekWars.items[scheme.result])" />
	</svg>
</template>

<script setup lang="ts">
import type { SchemeTemplate } from '@/model/scheme'
import { itemImageUrl } from '@/model/item'

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