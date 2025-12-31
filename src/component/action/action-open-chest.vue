
<template>
	<i18n-t tag="div" keypath="fight.open_chest" :a="props.a">
		<leek slot="entity" :leek="parent.leeks[props.action.params[1]]" />
		<leek slot="chest" :leek="parent.leeks[props.action.params[2]]" />
		<template v-slot:resources>
			<br>
			<v-tooltip v-for="(quantity, resource) of props.action.params[3]" :key="resource">
				<template v-slot:activator="{ props }">
					<span class="res" v-bind="props">
						<b>{{ quantity }}</b>
						<img v-if="parent.LeekWars.items[resource]" :src="'/image/' + parent.ITEM_CATEGORY_NAME[parent.LeekWars.items[resource].type] + '/' + parent.LeekWars.items[resource].name.replace('potion_', '') + '.png'">
						<span v-else>{{ resource }}</span>
					</span>
				</template>
				{{ quantity }}x <b v-if="parent.LeekWars.items[resource]">{{ $t(parent.ITEM_CATEGORY_NAME[parent.LeekWars.items[resource].type] + '.' + parent.LeekWars.items[resource].name.replace('potion_', '')) }}</b>
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
