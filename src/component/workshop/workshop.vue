<template>
	<div class="page">
		<div class="page-bar page-header">
			<h1>{{ $t('main.workshop') }}</h1>
			<div class="tabs">
				<a href="https://leek-wars.myspreadshop.fr" target="_blank" rel="noopener">
					<div class="tab action" icon="cart-outline" link="https://leek-wars.myspreadshop.fr">
						<v-icon>mdi-cart-outline</v-icon>
						<span>{{ $t('main.shop') }}</span>
						<v-icon class="small">mdi-open-in-new</v-icon>
					</div>
				</a>
				<router-link to="/bank">
					<div class="tab action" icon="account_balance" link="/bank">
						<v-icon>mdi-bank</v-icon>
						<span>{{ $t('main.bank') }}</span>
					</div>
				</router-link>
				<router-link to="/market">
					<div class="tab action" image="icon/market.png" link="/market">
						<img src="/image/icon/market.png">
						<span>{{ $t('main.market') }}</span>
					</div>
				</router-link>
				<div class="tab action active" icon="mdi-hammer-wrench" link="/workshop">
					<v-icon>mdi-hammer-wrench</v-icon>
					<span>{{ $t('main.workshop') }}</span>
				</div>
			</div>
		</div>
		<div class="container">
			<!-- <panel class="first" :title="'Forge'" icon="mdi-hammer-wrench">
				<div class="forge">
					<div class="grid">
						<div v-for="(item, i) in forge" :key="i" class="cell" :class="{active: !!item}">
							<div v-if="item" v-ripple class="item" :quantity="item.quantity | number" :type="LeekWars.items[item.template].type" @click="remove(i, $event)">
								<img :src="'/image/' + LeekWars.items[item.template].name.replace('_', '/') + '.png'">
							</div>
						</div>
					</div>
					<div class="symbol arrow">→</div>
					<div class="cell" :class="{active: !!scheme}">
						<div v-if="scheme" class="item" :quantity="1" :type="LeekWars.items[scheme.result].type">
							<img :src="'/image/' + LeekWars.items[scheme.result].name.replace('_', '/') + '.png'">
						</div>
					</div>
				</div>
			</panel> -->
			<inventory />
		</div>
		<panel icon="mdi-script-outline" :title="'Schémas (' + (filtered_schemes ? filtered_schemes.length : '...') + '/' + (schemes ? schemes.length : '...') + ')'">
			<template slot="actions">
				<v-menu offset-y>
					<template v-slot:activator="{ on }">
						<div class="button flat" v-on="on">
							<v-icon>mdi-sort</v-icon>
						</div>
					</template>
					<v-list dense class="menu-actions">
						<v-list-item v-ripple @click="sort = Sort.PRICE">
							<span>{{ $t('price') }}</span>
							<v-icon v-if="sort === Sort.PRICE">mdi-check</v-icon>
						</v-list-item>
						<v-list-item v-ripple @click="sort = Sort.LEVEL">
							<span>{{ $t('level') }}</span>
							<v-icon v-if="sort === Sort.LEVEL">mdi-check</v-icon>
						</v-list-item>
						<v-list-item v-ripple @click="sort = Sort.RARITY">
							<span>{{ $t('rarity') }}</span>
							<v-icon v-if="sort === Sort.RARITY">mdi-check</v-icon>
						</v-list-item>
						<v-list-item v-ripple @click="sort = Sort.INGREDIENT_COUNT">
							<span>{{ $t('ingredient_count') }}</span>
							<v-icon v-if="sort === Sort.INGREDIENT_COUNT">mdi-check</v-icon>
						</v-list-item>
					</v-list>
				</v-menu>
				<v-menu offset-y>
					<template v-slot:activator="{ on }">
						<div class="button flat" v-on="on">
							<v-icon>mdi-filter-outline</v-icon>
						</div>
					</template>
					<v-list dense class="menu-actions">
						<v-list-item v-for="t in ItemTypes" :key="t" v-ripple @click="filter = t">
							<v-icon>{{ ITEM_TYPE_ICONS[t] }}</v-icon>
							<span>{{ $t('main.' + ITEM_TYPE_NAME[t]) }}</span>
							<v-icon v-if="t === filter">mdi-check</v-icon>
						</v-list-item>
					</v-list>
				</v-menu>
			</template>
			<div slot="content" class="schemes">
				<scheme v-for="(scheme, s) in sorted_schemes" :key="s" class="scheme" :scheme="scheme" :show-result="true"></scheme>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { ITEM_TYPE_NAME, ITEM_CATEGORY_NAME, ITEM_TYPE_ICONS, ItemTemplate, ItemType, ItemTypes } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { SchemeTemplate } from '@/model/scheme'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Inventory from '../inventory/inventory.vue'
	import RichTooltipItem from '../rich-tooltip/rich-tooltip-item.vue'
	import SchemeView from '../market/scheme.vue'

	enum Sort {
		DATE, PRICE, PRICE_LOT, QUANTITY, /*NAME, */ LEVEL, RARITY, INGREDIENT_COUNT
	}

	@Component({ name: 'workshop', i18n: {}, mixins: [...mixins], components: {
		Inventory, 'rich-tooltip-item': RichTooltipItem, 'scheme': SchemeView
	}})
	export default class Workshop extends Vue {
		schemes: SchemeTemplate[] = []
		scheme: any = null
		forge: any[] = [null, null, null, null, null, null, null, null, null]
		ITEM_TYPE_NAME = ITEM_TYPE_NAME
		ITEM_CATEGORY_NAME = ITEM_CATEGORY_NAME
		sort: Sort = parseInt(localStorage.getItem('workshop/sort') || '0', 10) as Sort
		filter: ItemType = parseInt(localStorage.getItem('workshop/filter') || '0', 10) as ItemType
		Sort = Sort
		ItemType = ItemType
		ItemTypes = ItemTypes
		ITEM_TYPE_ICONS = ITEM_TYPE_ICONS

		get filtered_schemes() {
			// if (this.filter === ItemType.ALL) return this.schemes
			// return this.schemes.filter(scheme => LeekWars.items[scheme.result].type === this.filter)
			return this.schemes
		}

		get sorted_schemes() {
			if (this.sort === Sort.DATE) return this.filtered_schemes
			return [...this.filtered_schemes].sort((a, b) => {
				if (this.sort === Sort.PRICE) return LeekWars.items[b.result].price! - LeekWars.items[a.result].price!
				if (this.sort === Sort.RARITY) return LeekWars.items[b.result].rarity - LeekWars.items[a.result].rarity
				if (this.sort === Sort.INGREDIENT_COUNT) return b.items.length - a.items.length
				/*if (this.sort === Sort.LEVEL) */ return LeekWars.items[b.result].level - LeekWars.items[a.result].level
			})
		}

		created() {
			console.log("LeekWars.schemes", LeekWars.schemes)
			this.schemes = Object.values(LeekWars.schemes)
			// LeekWars.get('scheme/get-all').then(schemes => {
				// this.schemes = schemes
				// this.schemes.sort((a: any, b: any) => b.result.level - a.result.level)
				console.log("Schemes", this.schemes)
			// })
		}
		mounted() {
			LeekWars.footer = false
			LeekWars.box = true
		}
		destroyed() {
			LeekWars.footer = true
			LeekWars.box = false
		}

		use(scheme: any) {
			this.scheme = scheme
			for (let i = 0; i < 9; ++i) {
				Vue.set(this.forge, i, null)
			}
			for (let i = 0; i < scheme.items.length; ++i) {
				Vue.set(this.forge, i, {template: scheme.items[i][0][0], quantity: scheme.items[i][0][1]})
			}
		}

		/**
		 * Sélection d'un item de l'inventaire vers la forge
		 */
		pick(item: any, position: number, event: MouseEvent) {
			const all = event.ctrlKey
			const added_quantity = all ? item.quantity : 1
			let forgePosition = -1
			let quantity = added_quantity
			// Existe déjà ?
			for (let i = 0; i < 9; ++i) {
				if (this.forge[i] && this.forge[i].template === item.template) {
					forgePosition = i
					quantity += this.forge[i].quantity
					break
				}
			}
			if (forgePosition === -1) {
				for (let i = 0; i < 9; ++i) {
					if (this.forge[i] == null) {
						forgePosition = i
						break
					}
				}
			}
			// Ajout à la première place dispo
			Vue.set(this.forge, forgePosition, {template: item.template, quantity})
			this.removeInventory(position, added_quantity)
		}

		removeInventory(position: number, quantity: number) {
			// this.inventory[position].quantity -= quantity
			// if (this.inventory[position].quantity === 0) {
			// 	this.inventory.splice(position, 1)
			// }
		}

		/**
		 * Supprime un item de la forge
		 */
		remove(i: number, event: MouseEvent) {
			const all = event.ctrlKey
			if (this.forge[i].quantity === 1 || all) {
				this.addInventory(this.forge[i].template, this.forge[i].quantity)
				Vue.set(this.forge, i, null)
			} else {
				const quantity = all ? this.forge[i].quantity : 1
				this.addInventory(this.forge[i].template, quantity)
				Vue.set(this.forge, i, {template: this.forge[i].template, quantity: this.forge[i].quantity - quantity})
			}
		}

		addInventory(template: number, quantity: number) {
			// for (let i = 0; i < this.inventory.length; ++i) {
			// 	if (this.inventory[i].template === template) {
			// 		this.inventory[i].quantity += quantity
			// 		return
			// 	}
			// }
			// this.inventory.push({template, quantity})
		}

		@Watch('forge')
		resolveScheme() {
			console.log("forge updated")
			this.scheme = null
			for (const scheme of this.schemes) {
				if (this.match(scheme)) {
					this.scheme = scheme
				}
			}
		}

		match(scheme: any) {
			const items = this.forge

			let forge_items = 0
			for (const item of this.forge) {
				if (item) { forge_items++ }
			}
			if (forge_items !== scheme.items.length) { return false }

			for (let i = 0; i < this.forge.length; ++i) {
				if (!this.forge[i]) continue
				// console.log("find item", this.forge[i].template)
				const forge_template = this.forge[i].template
				if (i >= scheme.items.length) { return false }
				const group = scheme.items[i]
				// if (!group.find(item => item.item === forge_template)) {
				// 	return false
				// }
			}
			return true
		}

		@Watch('sort')
		updateSort() {
			localStorage.setItem('workshop/sort', '' + this.sort)
		}
		@Watch('filter')
		updateFilter() {
			localStorage.setItem('workshop/filter', '' + this.filter)
		}
	}
</script>

<style lang="scss" scoped>
.panel {
	min-height: 0;
}
.forge {
	display: flex;
	align-items: center;
	.cell {
		width: 86px;
		height: 86px;
	}
	.item {
		cursor: pointer;
		height: 100%;
		img {
			width: 100%;
			height: 100%;
			object-fit: scale-down;
		}
	}
}
.grid {
	display: grid;
	width: 280px;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 8px;
}
.cell {
	background: #e8e8e8;
	padding: 3px;
	&:not(.active) {
		border: 2px inset white;
		padding: 0;
	}
	&.active {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
	}
}

.schemes {
	overflow-y: auto;
}

.inventory-panel {
	height: 456px;
}
.balance {
	position: absolute;
	top: 0;
	right: 0;
}
.menu-actions {
	.v-icon {
		margin: 6px;
	}
}
</style>