<template lang="html">
	<div class="scheme" :class="{ 'not-craftable': showResult && !possible }">
		<div v-if="showResult" v-ripple class="group result" @click="possible && emitter.emit('craft', scheme)">
			<rich-tooltip-item v-if="!sharedTooltip" v-slot="{ props }" :item="result" :bottom="true" :inventory="true" :craft-cost="ingredientCost" @update:model-value="$emit('update:modelValue', $event)">
				<div class="item" v-bind="props" :quantity="1" :class="{['rarity-border-' + result.rarity]: true, 'missing': !possible}">
					<img :src="'/image/' + ITEM_CATEGORY_NAME[result.type] + '/' + result.name.replace('hat_', '').replace('potion_', '') + '.png'" :type="result.type">
					<div v-if="scheme.quantity > 1" class="quantity">{{ $filters.number(scheme.quantity) }}</div>
				</div>
			</rich-tooltip-item>
			<div v-else class="item" :quantity="1" :class="{['rarity-border-' + result.rarity]: true, 'missing': !possible}" @click.stop="possible && emitter.emit('craft', scheme)" @mouseenter="$emit('show-tooltip', { item: result, quantity: 1, craftCost: ingredientCost, event: $event })" @mouseleave="$emit('hide-tooltip')">
				<img :src="'/image/' + ITEM_CATEGORY_NAME[result.type] + '/' + result.name.replace('hat_', '').replace('potion_', '') + '.png'" :type="result.type">
				<div v-if="scheme.quantity > 1" class="quantity">{{ $filters.number(scheme.quantity) }}</div>
			</div>
		</div>
		<div v-if="showResult" :key="'__'" class="symbol">{{ " = " }}</div>
		<div class="items">
			<template v-for="(ingredient, i) in items">
				<template v-if="ingredient">
					<rich-tooltip-item v-if="!sharedTooltip" :key="i" v-slot="{ props }" :item="ingredient.item" :bottom="true" :inventory="true" :quantity="ingredient.quantity" @update:model-value="$emit('update:modelValue', $event)">
						<div class="item" v-bind="props" :class="{['rarity-border-' + ingredient.item.rarity]: true, [item_present[i]]: true, craftable: !!ingredientScheme(ingredient)}" @click.stop="craftIngredient(ingredient)">
							<img :src="'/image/' + ITEM_CATEGORY_NAME[ingredient.item.type] + '/' + ingredient.item.name.replace('hat_', '').replace('potion_', '').replace('chip_', '').replace('weapon_', '') + '.png'" :type="ingredient.item.type">
							<div v-if="ingredient.quantity > 1" class="quantity">{{ $filters.number(ingredient.quantity) }}</div>
							<v-icon v-if="ingredientScheme(ingredient)" class="craft-icon">mdi-hammer-wrench</v-icon>
						</div>
					</rich-tooltip-item>
					<div v-else :key="'s' + i" class="item" :class="{['rarity-border-' + ingredient.item.rarity]: true, [item_present[i]]: true, craftable: !!ingredientScheme(ingredient)}" @click.stop="craftIngredient(ingredient)" @mouseenter="$emit('show-tooltip', { item: ingredient.item, quantity: ingredient.quantity, event: $event })" @mouseleave="$emit('hide-tooltip')">
						<img :src="'/image/' + ITEM_CATEGORY_NAME[ingredient.item.type] + '/' + ingredient.item.name.replace('hat_', '').replace('potion_', '').replace('chip_', '').replace('weapon_', '') + '.png'" :type="ingredient.item.type">
						<div v-if="ingredient.quantity > 1" class="quantity">{{ $filters.number(ingredient.quantity) }}</div>
						<v-icon v-if="ingredientScheme(ingredient)" class="craft-icon">mdi-hammer-wrench</v-icon>
					</div>
				</template>
				<div v-if="ingredient && i < items.length - 1" :key="'_' + i" class="symbol">{{ " + " }}</div>
			</template>
		</div>
		<div class="spacer"></div>
		<div v-if="showPrice">
			<div>{{ $filters.number(scheme.quantity * LeekWars.items[scheme.result].price) }} <span class="hab"></span></div>
			<div :class="{wrong: Math.abs((scheme.quantity * LeekWars.items[scheme.result].price) / scheme.items.reduce((s, i) => s + (i ? i[1] * LeekWars.items[i[0]].price : 0), 0) - 1.1) > 0.03 }">{{ $filters.number(scheme.items.reduce((s, i) => s + (i ? i[1] * LeekWars.items[i[0]].price : 0), 0)) }} ({{ ((scheme.quantity * LeekWars.items[scheme.result].price) / scheme.items.reduce((s, i) => s + (i ? i[1] * LeekWars.items[i[0]].price : 0), 0)).toFixed(2) }}) <span class="hab"></span></div>
		</div>
	</div>
</template>

<script lang="ts">
	import { ITEM_CATEGORY_NAME } from '@/model/item';
	import { LeekWars } from '@/model/leekwars';
	import { SchemeTemplate } from '@/model/scheme';
	import { store } from '@/model/store';
	import { emitter } from '@/model/vue';
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'

	@Options({ name: 'scheme', components: {
		'rich-tooltip-item': RichTooltipItem,
	}, emits: ['show-tooltip', 'hide-tooltip', 'update:modelValue'] })
	export default class SchemeView extends Vue {
		@Prop({required: true}) scheme!: SchemeTemplate
		@Prop({required: true}) showResult!: boolean
		@Prop({required: true}) showPrice!: boolean
		@Prop({ default: false }) sharedTooltip!: boolean
		emitter = emitter

		ITEM_CATEGORY_NAME = ITEM_CATEGORY_NAME

		get result() {
			return LeekWars.items[this.scheme.result]
		}
		get items() {
			return this.scheme.items.filter(i => !!i).map(item => { return { item: LeekWars.items[item![0]], quantity: item![1] } })
		}

		get ingredientCost() {
			return this.scheme.items.reduce((s, i) => s + (i ? i[1] * LeekWars.items[i[0]].price! : 0), 0)
		}

		get possible() {
			return this.item_present.every(p => p === 'present')
		}

		ingredientScheme(ingredient: any): SchemeTemplate | null {
			if (!ingredient || !store.state.farmer) return null
			const scheme = Object.values(LeekWars.schemes).find(s => s.result === ingredient.item.id)
			if (!scheme) return null
			if (!store.state.farmer.schemes.find((s: any) => LeekWars.items[s.template].params == scheme.id)) return null
			return store.getters.scheme_possible(scheme) ? scheme : null
		}

		craftIngredient(ingredient: any) {
			const scheme = this.ingredientScheme(ingredient)
			if (scheme) emitter.emit('craft', scheme)
		}

		get item_present() {
			return this.items.map(item => {
				if (item === null) return 'present'
				if (store.state.farmer) {
					if (item.item.id === 148) {
						return store.state.farmer.habs >= item.quantity ? 'present' : 'partial'
					} else {
						for (const resource of store.state.farmer!.resources) {
							if (item.item && resource.template === item.item.id) {
								return resource.quantity >= item.quantity ? 'present' : 'partial'
							}
						}
						for (const resource of store.state.farmer!.components) {
							if (item.item && resource.template === item.item.id) {
								return resource.quantity >= item.quantity ? 'present' : 'partial'
							}
						}
						for (const resource of store.state.farmer!.potions) {
							if (item.item && resource.template === item.item.id) {
								return resource.quantity >= item.quantity ? 'present' : 'partial'
							}
						}
						for (const resource of store.state.farmer!.weapons) {
							if (item.item && resource.template === item.item.id) {
								return resource.quantity >= item.quantity ? 'present' : 'partial'
							}
						}
						for (const resource of store.state.farmer!.chips) {
							if (item.item && resource.template === item.item.id) {
								return resource.quantity >= item.quantity ? 'present' : 'partial'
							}
						}
					}
				}
				return 'missing'
			})
		}
	}
</script>

<style lang="scss" scoped>
.scheme {
	display: flex;
	align-items: center;
	padding: 0 4px;
	position: relative;
	&:nth-child(2n) {
		background: var(--background-secondary);
	}
	.space {
		flex: 1;
	}
	.items {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}
	.items .item {
		cursor: default;
	}
	.item {
		position: relative;
		padding: 4px;
		background: var(--pure-white);
		box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
		img {
			width: 42px;
			height: 42px;
			object-fit: scale-down;
			vertical-align: bottom;
		}
		.quantity {
			position: absolute;
			bottom: 0;
			right: 0;
			background: #000b;
			border-top-left-radius: 4px;
			color: white;
			padding: 1.5px 4.5px;
			font-weight: 500;
			font-size: 14px;
		}
		// &.present {
		// 	background: #5fad1b44;
		// }
		&.partial {
			background: #f704;
		}
		&.missing {
			background: #f004;
		}
		&.craftable {
			cursor: pointer;
			&:hover {
				background: #5fad1b22;
			}
			.craft-icon {
				position: absolute;
				bottom: 2px;
				left: 2px;
				font-size: 11px;
				color: #555;
				opacity: 0.6;
			}
		}
	}
	// .group {
	// 	display: flex;
	// 	align-items: center;

	// 	.or {
	// 		width: 35px;
	// 		text-align: center;
	// 	}
	// }
	.result {
		cursor: pointer;
		&:hover .item {
			background: #5fad1b22;
		}
	}
	&.not-craftable .result {
		cursor: default;
		&:hover .item {
			background: #f004;
		}
	}
}
.symbol {
	font-size: 22px;
	font-family: monospace;
	text-align: center;
	line-height: 24px;
	flex-shrink: 0;
	width: 26px;
	height: 26px;
	margin: -2px;
	z-index: 2;
	background: var(--pure-white);
	border: 1px solid #aaa;
	border-radius: 100%;
	box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
	&.arrow {
		margin: 14px;
		margin-right: 18px;
		width: 40px;
		height: 40px;
		line-height: 35px;
		font-size: 30px;
	}
}
.wrong {
	color: red;
}
.scheme.not-craftable {
	background: #f001;
	&:nth-child(2n) {
		background: #f002;
	}
}
</style>