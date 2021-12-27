<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('main.inventory') }}</h1>
			<div class="tabs">
				<router-link v-if="env.BANK" to="/bank">
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
				<div class="tab action active" icon="mdi-treasure-chest" link="/inventory">
					<v-icon>mdi-treasure-chest</v-icon>
					<span>{{ $t('main.inventory') }}</span>
				</div>
			</div>
		</div>
		<div class="container">
			<panel :icon="LeekWars.mobile ? '' : 'mdi-treasure-chest'" class="inventory-panel">
				<template slot="title">
					<div><span v-if="!LeekWars.mobile">{{ $t('main.inventory') }}</span> ({{ filtered_inventory.length }}<span v-if="filter !== Filter.ALL"> / {{ inventory.length }}</span>)</div>
					<div class="categories">
						<!-- <tooltip top content-class="top">
							<template v-slot:activator="{ on }">
								<div v-ripple v-on="on" class="category" :class="{selected: category === 3}" @click="category = 3">
									<v-icon>mdi-all-inclusive</v-icon>
								</div>
							</template>
							Tout
						</tooltip>
						<tooltip top content-class="top">
							<template v-slot:activator="{ on }">
								<div v-ripple v-on="on" class="category" :class="{selected: category === 1}" @click="category = 1">
									<v-icon>mdi-sword</v-icon>
								</div>
							</template>
							Équipements
						</tooltip> -->
						<!-- <tooltip top content-class="top">
							<template v-slot:activator="{ on }">
								<div v-ripple v-on="on" class="category" :class="{selected: category === 2}" @click="category = 2">
									<v-icon>mdi-bottle-tonic-plus-outline</v-icon>
								</div>
							</template>
							Consommables
						</tooltip> -->
						<!-- <tooltip top content-class="top">
							<template v-slot:activator="{ on }">
								<div v-ripple v-on="on" class="category" :class="{selected: category === 2}" @click="category = 2">
									<v-icon>mdi-leaf</v-icon>
								</div>
							</template>
							Ressources
						</tooltip> -->
					</div>
				</template>
				<template slot="actions">
					<span class="value" title="Valeur totale">{{ total_estimated | number }} <div class="hab"></div></span>
					<v-menu offset-y>
						<template v-slot:activator="{ on }">
							<div class="button flat" v-on="on">
								<v-icon>mdi-sort</v-icon>
							</div>
						</template>
						<v-list dense class="menu-actions">
							<v-list-item v-ripple @click="sort = Sort.DATE">
								<span>{{ $t('date') }}</span>
								<v-icon v-if="sort === Sort.DATE">mdi-check</v-icon>
							</v-list-item>
							<v-list-item v-ripple @click="sort = Sort.PRICE">
								<span>{{ $t('price') }}</span>
								<v-icon v-if="sort === Sort.PRICE">mdi-check</v-icon>
							</v-list-item>
							<v-list-item v-ripple @click="sort = Sort.PRICE_LOT">
								<span>{{ $t('price_lot') }}</span>
								<v-icon v-if="sort === Sort.PRICE_LOT">mdi-check</v-icon>
							</v-list-item>
							<v-list-item v-ripple @click="sort = Sort.QUANTITY">
								<span>{{ $t('quantity') }}</span>
								<v-icon v-if="sort === Sort.QUANTITY">mdi-check</v-icon>
							</v-list-item>
							<!-- <v-list-item v-ripple @click="sort = Sort.NAME">
								<span>{{ $t('name') }}</span>
								<v-icon v-if="sort === Sort.NAME">mdi-check</v-icon>
							</v-list-item> -->
							<v-list-item v-ripple @click="sort = Sort.LEVEL">
								<span>{{ $t('level') }}</span>
								<v-icon v-if="sort === Sort.LEVEL">mdi-check</v-icon>
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
							<v-list-item v-ripple @click="filter = Filter.ALL">
								<v-icon>mdi-all-inclusive</v-icon>
								<span>{{ $t('all') }}</span>
								<v-icon v-if="filter === Filter.ALL">mdi-check</v-icon>
							</v-list-item>
							<v-list-item v-ripple @click="filter = Filter.WEAPONS">
								<v-icon>mdi-pistol</v-icon>
								<span>{{ $t('weapons') }}</span>
								<v-icon v-if="filter === Filter.WEAPONS">mdi-check</v-icon>
							</v-list-item>
							<v-list-item v-ripple @click="filter = Filter.CHIPS">
								<v-icon>mdi-chip</v-icon>
								<span>{{ $t('chips') }}</span>
								<v-icon v-if="filter === Filter.CHIPS">mdi-check</v-icon>
							</v-list-item>
							<v-list-item v-ripple @click="filter = Filter.POTIONS">
								<v-icon>mdi-bottle-tonic-plus-outline</v-icon>
								<span>{{ $t('potions') }}</span>
								<v-icon v-if="filter === Filter.POTIONS">mdi-check</v-icon>
							</v-list-item>
							<v-list-item v-ripple @click="filter = Filter.HATS">
								<v-icon>mdi-hat-fedora</v-icon>
								<span>{{ $t('hats') }}</span>
								<v-icon v-if="filter === Filter.HATS">mdi-check</v-icon>
							</v-list-item>
							<v-list-item v-ripple @click="filter = Filter.POMPS">
								<v-icon>mdi-auto-fix</v-icon>
								<span>{{ $t('pomps') }}</span>
								<v-icon v-if="filter === Filter.POMPS">mdi-check</v-icon>
							</v-list-item>
							<v-list-item v-ripple @click="filter = Filter.RESOURCES">
								<v-icon>mdi-leaf</v-icon>
								<span>{{ $t('resources') }}</span>
								<v-icon v-if="filter === Filter.RESOURCES">mdi-check</v-icon>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
				<div slot="content" ref="inventory" class="inventory-content">
					<div class="inventory">
						<div v-for="item in sorted_inventory" :key="item.template" class="cell active" :class="'rarity-border-' + LeekWars.items[item.template].rarity">
							<rich-tooltip-item v-slot="{ on }" :bottom="true" :item="LeekWars.items[item.template]" :quantity="item.quantity" :inventory="true" @retrieve="retrieve">
								<div v-on="on" class="item"  :quantity="item.quantity | number" :type="LeekWars.items[item.template].type">
									<img v-if="item.type === ItemType.RESOURCE" class="image" :src="'/image/resource/' + LeekWars.items[item.template].name + '.png'">
									<img v-else class="image" :class="{small: item.template === 37 || item.template === 45 || item.template === 153 || item.template === 182}" :src="'/image/' + LeekWars.items[item.template].name.replace('_', '/') + '.png'">
									<img v-if="LeekWars.items[item.template].name.startsWith('box')" class="retrieve notif-trophy" src="/image/icon/black/arrow-down-right-bold.svg">
									<img v-if="LeekWars.christmasPresents && LeekWars.items[item.template].name.startsWith('present')" class="retrieve notif-trophy" src="/image/icon/black/arrow-down-right-bold.svg">
									<div class="id">#{{ item.template }}</div>
								</div>
							</rich-tooltip-item>
						</div>
						<div v-for="item in placeholder_count" :key="'p' + item" class="placeholder"></div>
					</div>
				</div>
			</panel>
		</div>
		<popup v-model="retrieveDialog" width="400">
			<v-icon slot="title">mdi-gift-outline</v-icon>
			<template slot="title">Objets obtenus</template>
			<div class="inventory">
				<div v-for="item in retrieveItems" :key="item.id" class="cell active" :class="'rarity-border-' + LeekWars.items[item.template].rarity">
					<rich-tooltip-item v-slot="{ on }" :bottom="true" :item="LeekWars.items[item.template]" :quantity="item.quantity" :inventory="true">
						<div v-on="on" class="item" :quantity="item.quantity" :type="LeekWars.items[item.template].type">
							<img v-if="LeekWars.items[item.template].type === ItemType.RESOURCE" class="image" :src="'/image/resource/' + LeekWars.items[item.template].name + '.png'">
							<img v-else class="image" :class="{small: item.template === 37 || item.template === 45 || item.template === 153 || item.template === 182}" :src="'/image/' + LeekWars.items[item.template].name.replace('_', '/') + '.png'">
						</div>
					</rich-tooltip-item>
				</div>
			</div>
			<br>
			<div>
				Total estimé : <b>{{ retrieveItems.reduce((s, i) => s + i.quantity * LeekWars.items[i.template].price, 0) | number }}</b> <span class="hab"></span>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { ItemType } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Item } from '../editor/editor-item'

	enum Sort {
		DATE, PRICE, PRICE_LOT, QUANTITY, /*NAME, */ LEVEL
	}
	enum Filter {
		ALL, WEAPONS, CHIPS, POTIONS, HATS, POMPS, RESOURCES
	}

	@Component({ name: 'inventory', i18n: {}, mixins })
	export default class Inventory extends Vue {

		ItemType = ItemType
		Sort = Sort
		Filter = Filter
		CATEGORY_ITEMS = 1
		// CATEGORY_POTIONS = 2
		CATEGORY_RESOURCES = 2
		category = 3
		placeholder_count: number = 0
		sort: Sort = parseInt(localStorage.getItem('inventory/sort') || '0', 10) as Sort
		filter: Filter = parseInt(localStorage.getItem('inventory/filter') || '0', 10) as Filter
		actions: any
		retrieveDialog: boolean = false
		retrieveItems = [] as Item[]

		get inventory() {
			const inventory = []
			if (store.state.farmer) {
				for (const weapon of store.state.farmer.weapons) {
					inventory.push({type: ItemType.WEAPON, template: weapon.template, quantity: weapon.quantity})
				}
				inventory.push(...store.state.farmer.chips.map(chip => {return {type: ItemType.CHIP, ...chip}}))
				inventory.push(...store.state.farmer.potions.map(potion => {return {type: ItemType.POTION, ...potion}}))
				inventory.push(...store.state.farmer.hats.map(hat => {return {type: ItemType.HAT, ...hat}}))
				inventory.push(...store.state.farmer.pomps.map(pomp => {return {type: ItemType.POMP, ...pomp}}))
				inventory.push(...store.state.farmer.resources.map(p => {return {type: ItemType.RESOURCE, ...p}}))
			}
			return inventory
		}

		get filtered_inventory_old() {
			if (this.category === 3) return this.inventory
			return this.inventory.filter((item: any) => {
				if (this.category === 1 && (item.type === ItemType.WEAPON || item.type === ItemType.CHIP || item.type === ItemType.HAT || item.type === ItemType.POTION)) return true
				if (this.category === 2 && (item.type === ItemType.RESOURCE || item.type === ItemType.POMP)) return true
				return false
			})
		}

		get filtered_inventory() {
			if (this.filter === Filter.ALL) return this.inventory
			return this.inventory.filter((item: any) => {
				if (this.filter === Filter.WEAPONS && item.type === ItemType.WEAPON) return true
				if (this.filter === Filter.CHIPS && item.type === ItemType.CHIP) return true
				if (this.filter === Filter.POTIONS && item.type === ItemType.POTION) return true
				if (this.filter === Filter.HATS && item.type === ItemType.HAT) return true
				if (this.filter === Filter.POMPS && item.type === ItemType.POMP) return true
				if (this.filter === Filter.RESOURCES && item.type === ItemType.RESOURCE) return true
			})
		}

		get sorted_inventory() {
			if (this.sort === Sort.DATE) return this.filtered_inventory
			return [...this.filtered_inventory].sort((a: any, b: any) => {
				if (this.sort === Sort.PRICE) return LeekWars.items[b.template].price! - LeekWars.items[a.template].price!
				if (this.sort === Sort.PRICE_LOT) return LeekWars.items[b.template].price! * b.quantity - LeekWars.items[a.template].price! * a.quantity
				if (this.sort === Sort.QUANTITY) return b.quantity - a.quantity
				// if (this.sort === Sort.NAME) return LeekWars.items[b.template].price - LeekWars.items[a.template].price
				/*if (this.sort === Sort.LEVEL) */ return LeekWars.items[b.template].level - LeekWars.items[a.template].level
			})
		}

		get total_estimated() {
			return Math.floor(this.filtered_inventory.reduce((s, i) => s + LeekWars.items[i.template].price! * i.quantity, 0))
		}

		@Watch('filtered_inventory')
		resize() {
			const W = LeekWars.mobile ? 60 : 73
			const H = LeekWars.mobile ? 63 : 76
			const inventory = this.$refs.inventory as HTMLElement
			const margin = 5
			const columns = Math.floor((inventory.clientWidth - margin) / (W + margin))
			const last_columns = this.filtered_inventory.length % columns
			const column = last_columns === 0 ? 0 : columns - last_columns
			const rows = Math.floor((inventory.clientHeight - margin) / (H + margin))
			this.placeholder_count = Math.max(column, columns * rows - this.filtered_inventory.length)
		}

		mounted() {
			LeekWars.footer = false
			LeekWars.box = true

			this.resize()
			this.$root.$on('resize', this.resize)
		}
		created() {
			this.actions = [
				{icon: 'mdi-bank', click: () => this.$router.push('/bank')},
				{image: 'icon/market.png', click: () => this.$router.push('/market')},
			]
			LeekWars.setActions(this.actions)
			LeekWars.setTitle(this.$i18n.t('main.inventory'))
			this.updateSubtitle()
		}
		updateSubtitle() {
			if (this.$store.state.farmer) {
				LeekWars.setSubTitle(this.$t('main.x_habs', [LeekWars.formatNumber(this.$store.state.farmer.habs)]) + " • " + this.$t('main.x_crystals', [LeekWars.formatNumber(this.$store.state.farmer.crystals)]))
			}
		}
		beforeDestroy() {
			this.$root.$off('resize', this.resize)
		}
		destroyed() {
			LeekWars.footer = true
			LeekWars.box = false
		}

		@Watch('sort')
		updateSort() {
			localStorage.setItem('inventory/sort', '' + this.sort)
		}
		@Watch('filter')
		updateFilter() {
			localStorage.setItem('inventory/filter', '' + this.filter)
		}

		retrieve(items: Item[]) {
			// console.log("retrieve", items)
			if (items.length) {
				this.retrieveDialog = true
				this.retrieveItems = items
			}
		}
	}
</script>

<style lang="scss" scoped>
.panel ::v-deep h2 > div {
	width: 145px;
}
.container {
	flex: 1;
	min-height: 0;
}
#app.app .container {
	margin-bottom: 0;
}
.inventory-content {
	overflow-y: scroll;
	overflow-x: hidden;
	flex: 1;
}
.inventory {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(73px, 1fr));
	gap: 5px;
	margin: 5px;
	.item {
		height: 76px;
	}
}
#app.app .inventory {
	grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
	.item {
		height: 61px;
	}
}
.categories {
	display: flex;
	align-items: stretch;
	align-self: stretch;
	color: white;
	.category {
		cursor: pointer;
		display: flex;
		align-items: center;
		&.selected {
			background: #666;
		}
		.v-icon {
			padding: 0 12px;
			margin: 0;
		}
	}
}
.value {
	display: inline-flex;
	align-items: center;
	vertical-align: bottom;
	font-size: 15px;
	color: #eee;
	margin: 0 10px;
	.hab {
		margin-left: 5px;
	}
}
.cell {
	border: 1px solid #ccc;
	&:hover {
		background: white;
	}
}
.item {
	padding: 5%;
	position: relative;
	.image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		vertical-align: bottom;
	}
	&[type="1"] {
		padding: 6%;
		.image {
			transform: rotate(-43deg);
			width: 130%;
			height: 130%;
			margin: -15%;
			&.small {
				width: 110%;
				height: 110%;
				margin: -5%;
			}
		}
	}
	&[type="2"], &[type="5"] {
		padding: 13%;
	}
	&:after {
		position: absolute;
		content: attr(quantity);
		background: #000b;
		border-top-left-radius: 4px;
		padding: 1.5px 4.5px;
		right: 0;
		bottom: 0;
		font-size: 14px;
		color: white;
		font-weight: 500;
	}
	&[quantity="1"]:after {
		display: none;
	}
	.id {
		position: absolute;
		top: 0;
		background: #fffd;
		padding: 2px 3px;
		font-size: 12px;
		display: none;
	}
	.retrieve {
		position: absolute;
		top: 3px;
		right: 3px;
		width: 16px;
		padding: 1px;
	}
}
.placeholder {
	border: 1px solid #ddd;
	// background: linear-gradient(to bottom right, #f2f2f2, #e1e1e1);
	height: 78px;
}
#app.app .placeholder {
	height: 63px;
}
.menu-actions {
	.v-icon {
		margin: 6px;
	}
}
</style>