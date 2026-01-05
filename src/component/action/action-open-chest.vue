
<template>
	<i18n-t tag="div" keypath="fight.open_chest" :a="a">
		<template #entity>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template #chest>
			<leek :leek="leeks[action.params[2]]" />
		</template>
		<template v-slot:resources>
			<br>
			<v-tooltip v-for="(quantity, resource) of action.params[3]" :key="resource">
				<template v-slot:activator="{ props }">
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

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { ITEM_CATEGORY_NAME } from '@/model/item'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionOpenChest extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
