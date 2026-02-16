<template>
	<div class="forge">
		<div class="grid">
			<div v-for="(item, i) in forge" :key="i" class="cell" :class="{['cell' + i]: true, active: !!item, building: item && building}">
				<rich-tooltip-item v-if="item" :key="item[0]" v-slot="{ props }" :item="LeekWars.items[item[0]]" :inventory="true" :quantity="item[1]">
					<div class="item" v-bind="props" :type="LeekWars.items[item[0]].type">
						<img :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[item[0]].type] + '/' + LeekWars.items[item[0]].name.replace('hat_', '').replace('potion_', '').replace('chip_', '').replace('weapon_', '') + '.png'">
						<div v-if="item[1] > 1" class="quantity">{{ $filters.number(item[1]) }}</div>
					</div>
				</rich-tooltip-item>
			</div>
			<div class="cell" :class="{cell8: true, active: !!result && !built, built}" @click="craft">
				<rich-tooltip-item v-if="result" v-slot="{ props }" :item="LeekWars.items[result]" :inventory="true" :quantity="scheme.quantity" :open-delay="built ? 500 : 1000">
					<div v-bind="props" v-ripple class="item" :class="{building}" :type="LeekWars.items[result].type">
						<img :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[result].type] + '/' + LeekWars.items[result].name.replace('hat_', '').replace('potion_', '') + '.png'">
						<div v-if="scheme.quantity > 1" class="quantity">{{ $filters.number(scheme.quantity) }}</div>
					</div>
				</rich-tooltip-item>
				<v-icon v-if="result && !built && !building">mdi-hammer-wrench</v-icon>
			</div>
			<v-icon v-if="scheme" class="clear" @click="clear">mdi-refresh</v-icon>
		</div>
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { Farmer } from '@/model/farmer'
	import { ForumCategory, ForumMessage, ForumTopic } from '@/model/forum'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import { SchemeTemplate } from '@/model/scheme'
	import { ItemTypes, ITEM_CATEGORY_NAME } from '@/model/item'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'
	import { defineAsyncComponent } from 'vue'
	const RichTooltipItem = defineAsyncComponent(() => import('@/component/rich-tooltip/rich-tooltip-item.vue'))

	@Options({ name: 'forge', components: { Breadcrumb, 'rich-tooltip-item': RichTooltipItem } })
	export default class Forge extends Vue {

		ItemTypes = ItemTypes
		ITEM_CATEGORY_NAME = ITEM_CATEGORY_NAME
		forge: any[] = [null, null, null, null, null, null, null, null]
		scheme: SchemeTemplate | null = null
		result: any = null
		building: boolean = false
		built: boolean = false

		mounted() {
			LeekWars.footer = false
			LeekWars.box = true
			emitter.on('craft', (scheme: SchemeTemplate) => {
				this.clear()
				this.scheme = scheme
				for (let i = 0; i < scheme.items.length; ++i) {
					this.forge[i] = scheme.items[i]
				}
				this.result = scheme.result
			})
		}

		clearIngredients() {
			for (let i = 0; i < 8; ++i) {
				this.forge[i] = null
			}
		}
		clear() {
			this.clearIngredients()
			this.result = null
			this.scheme = null
			this.building = false
			this.built = false
		}

		beforeUnmount() {
			emitter.off('craft')
		}

		craft() {
			if (this.built || !this.scheme) { return }
			LeekWars.post('item/craft', { scheme_id: this.scheme.id }).then(item => {
				const template = LeekWars.items[item.template]
				store.commit('add-inventory', { type: template.type, id: item.id, template: item.template, time: item.time, quantity: this.scheme!.quantity })
				for (const ingredient of this.scheme!.items) {
					if (ingredient === null) continue;
					if (ingredient[0] === 148) { // hab
						store.commit('update-habs', -ingredient[1])
					} else {
						const it = LeekWars.items[ingredient[0]]
						store.commit('remove-inventory', { type: it.type, item_template: ingredient[0], quantity: ingredient[1] })
					}
				}
			})

			this.building = true
			setTimeout(() => {
				this.building = false
				this.clearIngredients()
				this.built = true
			}, 500)
		}
	}
</script>

<style lang="scss" scoped>

.forge {
	display: flex;
	align-items: center;
	width: 260px;
	height: 260px;
	flex-shrink: 0;
	padding: 10px;
	.grid {
		width: 100%;
		height: 100%;
		position: relative;
	}
	.cell {
		width: 28.5714285714%;
		height: 28.5714285714%;
		border: 1px solid var(--background-disabled);
		border-radius: 2px;
		transition: all 0.3s ease;
		background: var(--background-secondary);
		position: absolute;
		padding: 0;
		&.active {
			background: var(--pure-white);
			box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
		}
		&:not(.cell8) .item {
			animation: item-animation 0.5s ease 1;
		}
	}
	.cell0 {
		top: calc(7.14285714286% + 2px);
		left: calc(7.14285714286% + 2px);
	}
	.cell1 {
		top: 2px;
		left: 35.7142857143%;
		z-index: 1;
	}
	.cell2 {
		top: calc(7.14285714286% + 2px);
		left: calc(64.2857142857% - 2px);
	}
	.cell3 {
		top: 35.7142857143%;
		left: 2px;
		z-index: 1;
	}
	.cell4 {
		top: 35.7142857143%;
		left: calc(71.4285714286% - 2px);
		z-index: 1;
	}
	.cell5 {
		top: calc(64.2857142857% - 2px);
		left: calc(7.14285714286% + 2px);
	}
	.cell6 {
		top: calc(71.4285714286% - 2px);
		left: 35.7142857143%;
		z-index: 1;
	}
	.cell7 {
		top: calc(64.2857142857% - 2px);
		left: calc(64.2857142857% - 2px);
	}
	.cell8 {
		width: 42.857142857%;
		height: 42.857142857%;
		top: 28.5714285714%;
		left: 28.5714285714%;
		z-index: 2;
		border-radius: 20px;
		border: 2px solid var(--background-disabled);
		&:hover {
			background: var(--background-secondary);
		}
		&.active {
			cursor: pointer;
		}
		&:not(.built) .item {
			opacity: 0.4;
		}
		.v-icon {
			position: absolute;
			top: calc(50% - 20px);
			left: calc(50% - 20px);
			width: 40px;
			height: 40px;
			padding: 5px;
			font-size: 30px;
			background: var(--pure-white);
			border-radius: 50%;
			pointer-events: none;
			box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
		}
		& :deep(.v-ripple__container) {
			border-radius: 20px;
		}
		.item.building {
			animation: hithere 0.7s ease 1;
		}
	}
	.cell.building {
		left: 35.7142857143%;
		top: 35.7142857143%;
		bottom: auto;
		right: auto;
	}
	.item {
		padding: 10%;
		width: 100%;
		height: 100%;
		position: relative;
		img {
			width: 100%;
			height: 100%;
			object-fit: scale-down;
		}
		.quantity {
			position: absolute;
			bottom: 12%;
			right: 12%;
			background: #000b;
			border-radius: 4px;
			color: white;
			padding: 1.5px 4.5px;
			font-weight: 500;
			font-size: 14px;
		}
	}
}
.clear {
	position: absolute;
	bottom: -5px;
	right: -5px;
}
@keyframes item-animation {
	0% { transform: scale(1); }
	40% { transform: scale(1.25); }
	100% { transform: scale(1); }
}
@keyframes hithere {
	// 10% { transform: scale(1); opacity: 0.4; }
	// 40% { transform: scale(1.25); }
	// 100% { transform: scale(1); opacity: 1; }
	10% { transform: scale(1); opacity: 0.4; }
	30% { transform: rotate(-5deg) scale(1.25); }
	50% { transform: rotate(5deg) scale(1); }
	70% { transform: rotate(0deg) scale(1); }
	100% { transform: scale(1); opacity: 1; }
}
</style>