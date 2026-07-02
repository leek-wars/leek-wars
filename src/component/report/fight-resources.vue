<template>
	<span class="resources-list">
		<v-tooltip v-for="resource of sorted_resources" :key="resource[0]" content-class="fluid">
			<template #activator="{ props }">
				<span class="resource" v-bind="props">
					<scheme-image v-if="LeekWars.items[resource[0]].type === ItemType.SCHEME" class="image" :scheme="LeekWars.schemes[LeekWars.items[resource[0]].params]" />
					<img v-else :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[resource[0]].type] + '/' + LeekWars.items[resource[0]].name.replace('hat_', '').replace('potion_', '') + '.png'">
					<span v-if="resource[1] > 1" class="quantity">{{ resource[1] }}</span>
				</span>
			</template>
			{{ resource[1] }}x <b v-if="LeekWars.items[resource[0]].type === ItemType.SCHEME">{{ $t('main.scheme_x', [$t(ITEM_CATEGORY_NAME[LeekWars.items[LeekWars.schemes[LeekWars.items[resource[0]].params].result].type] + '.' + LeekWars.items[LeekWars.schemes[LeekWars.items[resource[0]].params].result].name.replace('hat_', '').replace('potion_', ''))]) }}</b><b v-else>{{ $t(ITEM_CATEGORY_NAME[LeekWars.items[resource[0]].type] + '.' + LeekWars.items[resource[0]].name.replace('hat_', '').replace('potion_', '')) }}</b>
		</v-tooltip>
	</span>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { ItemType, ITEM_CATEGORY_NAME } from '@/model/item'
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
			color: #eee;
			border-radius: 4px;
			font-weight: bold;
			background: rgba(0, 0, 0, 0.75);
		}
	}
</style>
