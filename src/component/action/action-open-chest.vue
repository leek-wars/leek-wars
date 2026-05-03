
<template>
	<i18n-t tag="div" keypath="fight.open_chest" :a="a">
		<template #entity>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #chest>
			<leek :leek="leeks[action.params[2]]" />
		</template>
		<template #resources>
			<br>
			<v-tooltip v-for="(quantity, resource) of action.params[3]" :key="resource">
				<template #activator="{ props }">
					<span class="res" v-bind="props">
						<b>{{ quantity }}</b>
						<img v-if="LeekWars.items[resource]" :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[resource].type] + '/' + LeekWars.items[resource].name.replace('potion_', '') + '.png'">
						<span v-else>{{ resource }}</span>
					</span>
				</template>
				{{ quantity }}x <b v-if="LeekWars.items[resource]">{{ $t(ITEM_CATEGORY_NAME[LeekWars.items[resource].type] + '.' + LeekWars.items[resource].name.replace('potion_', '')) }}</b>
			</v-tooltip>

			<!-- <span v-for="(resource, i) in props.action.params[3]" :key="i">{{ resource }}, </span> -->
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import Leek from '../report/action-leek.vue'
import { ITEM_CATEGORY_NAME as ITEM_CATEGORY_NAME_TYPED } from '@/model/item'

const ITEM_CATEGORY_NAME: Record<number, string> = ITEM_CATEGORY_NAME_TYPED

defineProps<{
	action: Action
	a?: number
	leeks: Record<number, any>
}>()
</script>
