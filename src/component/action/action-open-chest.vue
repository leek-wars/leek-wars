
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
						<img v-if="LeekWars.items[resource]" :src="itemImageUrl(LeekWars.items[resource])">
						<span v-else>{{ resource }}</span>
					</span>
				</template>
				{{ quantity }}x <b v-if="LeekWars.items[resource]">{{ $t(itemTranslationKey(LeekWars.items[resource])) }}</b>
			</v-tooltip>

			<!-- <span v-for="(resource, i) in props.action.params[3]" :key="i">{{ resource }}, </span> -->
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
import type { Action } from '@/model/action'
import type { ReportLeek } from '@/model/fight'
import Leek from '../report/action-leek.vue'
import { itemImageUrl, itemTranslationKey } from '@/model/item'

defineProps<{
	action: Action
	a?: number
	leeks: Record<number, ReportLeek>
}>()
</script>
