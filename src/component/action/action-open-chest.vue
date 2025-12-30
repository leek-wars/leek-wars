
<template>
	<i18n tag="div" path="fight.open_chest" :a="props.a">
		<leek slot="entity" :leek="parent.leeks[props.action.params[1]]" />
		<leek slot="chest" :leek="parent.leeks[props.action.params[2]]" />
		<template v-slot:resources>
			<br>
			<tooltip v-for="(quantity, resource) of props.action.params[3]" :key="resource">
				<template v-slot:activator="{ on }">
					<span class="res" v-on="on">
						<b>{{ quantity }}</b>
						<img v-if="parent.LeekWars.items[resource]" :src="'/image/' + parent.ITEM_CATEGORY_NAME[parent.LeekWars.items[resource].type] + '/' + parent.LeekWars.items[resource].name.replace('potion_', '') + '.png'">
						<span v-else>{{ resource }}</span>
					</span>
				</template>
				{{ quantity }}x <b v-if="parent.LeekWars.items[resource]">{{ parent.$t(parent.ITEM_CATEGORY_NAME[parent.LeekWars.items[resource].type] + '.' + parent.LeekWars.items[resource].name.replace('potion_', '')) }}</b>
			</tooltip>

			<!-- <span v-for="(resource, i) in props.action.params[3]" :key="i">{{ resource }}, </span> -->
		</template>
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { ITEM_CATEGORY_NAME } from '@/model/item'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionOpenChest extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
