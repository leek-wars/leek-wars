<template>
	<span class="resources-list">
		<v-tooltip v-for="resource of sorted_resources" :key="resource[0]" content-class="fluid">
			<template #activator="{ props }">
				<span class="resource" v-bind="props">
					<scheme-image v-if="LeekWars.items[resource[0]].type === ItemType.SCHEME" class="image" :scheme="LeekWars.schemes[LeekWars.items[resource[0]].params]" />
					<img v-else :src="itemImageUrl(LeekWars.items[resource[0]])">
					<span v-if="resource[1] > 1" class="quantity">{{ resource[1] }}</span>
				</span>
			</template>
			{{ resource[1] }}x <b v-if="LeekWars.items[resource[0]].type === ItemType.SCHEME">{{ $t('main.scheme_x', [$t(itemTranslationKey(LeekWars.items[LeekWars.schemes[LeekWars.items[resource[0]].params].result]))]) }}</b><b v-else>{{ $t(itemTranslationKey(LeekWars.items[resource[0]])) }}</b>
		</v-tooltip>
	</span>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { ItemType, itemImageUrl, itemTranslationKey } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import SchemeImage from '../market/scheme-image.vue'

	const props = defineProps<{
		resources?: {[key: number]: number}
		size?: number
	}>()

	const sorted_resources = computed(() => {
		if (props.resources) {
			return Object.entries(props.resources)
				.filter(r => !!LeekWars.items[r[0]])
				.sort((a, b) => LeekWars.items[b[0]].price! - LeekWars.items[a[0]].price!)
		}
		return []
	})

	const imageSize = computed(() => (props.size ?? 27) + 'px')
</script>

<style lang="scss" scoped>
	.resources-list {
		display: inline-flex;
		gap: 2px;
		vertical-align: bottom;
	}
	.resource {
		position: relative;
		padding: 1px;
		display: inline-block;
		vertical-align: bottom;
		img, svg {
			width: v-bind(imageSize);
			height: v-bind(imageSize);
			object-fit: contain;
			vertical-align: bottom;
		}
		.quantity {
			position: absolute;
			bottom: -5px;
			right: -5px;
			padding: 0px 3px;
			font-size: 12px;
			content: attr(quantity);
			text-align: center;
			color: var(--grey-13);
			border-radius: 4px;
			font-weight: bold;
			background: rgba(0, 0, 0, 0.75);
		}
	}
</style>
