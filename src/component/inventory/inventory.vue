<template>
	<panel :icon="LeekWars.mobile ? '' : 'mdi-treasure-chest'" class="inventory-panel">
		<template #title>
			<div><span v-if="!LeekWars.mobile">{{ $t('main.inventory') }}</span> ({{ filtered_inventory.length }}<span v-if="filter !== ItemType.ALL"> / {{ inventory.length }}</span>)</div>
			<div class="categories">

			</div>
		</template>
		<template #actions>
			<span class="value" title="Valeur totale">{{ $filters.number(total_estimated) }} <div class="hab"></div></span>
			<v-menu offset-y>
				<template #activator="{ props }">
					<div class="button flat" v-bind="props">
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
					<v-list-item v-ripple @click="sort = Sort.RARITY">
						<span>{{ $t('rarity') }}</span>
						<v-icon v-if="sort === Sort.RARITY">mdi-check</v-icon>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-menu offset-y>
				<template #activator="{ props }">
					<div class="button flat" v-bind="props">
						<v-badge v-if="filter !== ItemType.ALL" content="1" color="#5fad1b" floating>
							<v-icon>mdi-filter-outline</v-icon>
						</v-badge>
						<v-icon v-else>mdi-filter-outline</v-icon>
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
			<v-menu offset-y>
				<template #activator="{ props }">
					<div class="button flat" v-bind="props">
						<v-badge v-if="group !== Group.NONE" content="1" color="#5fad1b" floating>
							<v-icon>mdi-format-list-group</v-icon>
						</v-badge>
						<v-icon v-else>mdi-format-list-group</v-icon>
					</div>
				</template>
				<v-list dense class="menu-actions">
					<v-list-item v-ripple @click="group = Group.NONE">
						<span>{{ $t('no_group') }}</span>
						<v-icon v-if="group === Group.NONE">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="group = Group.TYPE">
						<span>{{ $t('type') }}</span>
						<v-icon v-if="group === Group.TYPE">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="group = Group.RARITY">
						<span>{{ $t('rarity') }}</span>
						<v-icon v-if="group === Group.RARITY">mdi-check</v-icon>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-menu offset-y>
				<template #activator="{ props }">
					<div class="button flat" v-bind="props">
						<v-icon>mdi-cog-outline</v-icon>
					</div>
				</template>
				<v-list dense class="menu-actions">
					<v-list-item class="submenu-header">{{ $t('size') }}</v-list-item>
					<v-list-item v-ripple @click="size = Size.SMALL">
						<span>{{ $t('size_small') }}</span>
						<v-icon v-if="size === Size.SMALL">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="size = Size.NORMAL">
						<span>{{ $t('size_normal') }}</span>
						<v-icon v-if="size === Size.NORMAL">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="size = Size.LARGE">
						<span>{{ $t('size_large') }}</span>
						<v-icon v-if="size === Size.LARGE">mdi-check</v-icon>
					</v-list-item>
				</v-list>
			</v-menu>
		</template>
		<template #content>
			<div ref="inventory" class="inventory-content">
				<loader v-if="!$store.state.farmer" />
				<div v-else class="inventory" :class="'size-' + size">
					<template v-for="entry in display_inventory" :key="entry.key">
						<div v-if="entry.separator" class="type-separator" :class="entry.rarity !== undefined ? 'rarity-' + entry.rarity : ''" @click="toggleGroup(entry.groupKey)">
							<v-icon class="collapse-icon" :class="{ collapsed: entry.collapsed }">mdi-chevron-down</v-icon>
							<v-icon v-if="entry.type !== undefined">{{ ITEM_TYPE_ICONS[entry.type] }}</v-icon>
							<span v-if="entry.type !== undefined">{{ $t('main.' + ITEM_TYPE_NAME[entry.type]) }}</span>
							<span v-else>{{ $t('main.difficulty_' + entry.rarity) }}</span>
							<span class="group-count">({{ entry.count }})</span>
						</div>
						<div v-else-if="entry.placeholder" class="placeholder"></div>
						<div v-else class="cell active" :class="['rarity-border-' + LeekWars.items[entry.item.template].rarity, { 'not-craftable': !entry.craftable }]" @mouseenter="showTooltip(entry.item, $event)" @mouseleave="scheduleHideTooltip()">
							<div class="item" :quantity="$filters.number(entry.item.quantity)" :type="LeekWars.items[entry.item.template].type">
								<img v-if="entry.item.type === ItemType.RESOURCE" class="image" :src="'/image/resource/' + LeekWars.items[entry.item.template].name + '.png'">
								<scheme-image v-else-if="entry.item.type === ItemType.SCHEME" class="image" :scheme="LeekWars.schemes[LeekWars.items[entry.item.template].params]" />
								<img v-else-if="entry.item.type === ItemType.COMPONENT" class="image" :src="'/image/component/' + LeekWars.items[entry.item.template].name + '.png'">
								<img v-else class="image" :class="{small: entry.item.template === 37 || entry.item.template === 45 || entry.item.template === 153 || entry.item.template === 182}" :src="'/image/' + LeekWars.items[entry.item.template].name.replace('_', '/') + '.png'">
								<img v-if="LeekWars.items[entry.item.template].name.startsWith('box')" class="retrieve notif-trophy" src="/image/icon/black/arrow-down-right-bold.svg">
								<img v-if="LeekWars.christmasPresents && LeekWars.items[entry.item.template].name.startsWith('present')" class="retrieve notif-trophy" src="/image/icon/black/arrow-down-right-bold.svg">
								<div class="id">#{{ entry.item.template }}</div>
							</div>
						</div>
					</template>
					<div v-for="item in (group === Group.NONE ? placeholder_count : 0)" :key="'p' + item" class="placeholder"></div>
				</div>

				<v-menu v-model="tooltipVisible" :activator="tooltipActivator" :close-on-content-click="false" :min-width="280" :open-delay="0" :close-delay="0" :bottom="true" offset-y :open-on-hover="false">
					<div class="inventory-tooltip" @mouseenter="onTooltipEnter" @mouseleave="onTooltipLeave">
						<item-preview v-if="tooltipItem" :item="tooltipItem" :quantity="tooltipQuantity" :inventory="true" @retrieve="retrieve" />
					</div>
				</v-menu>

				<popup v-model="retrieveDialog" :width="400">
					<template #title>Objets obtenus</template>
					<div class="inventory">
						<div v-for="item in retrieveItems" :key="item.id" class="cell active" :class="'rarity-border-' + LeekWars.items[item.template].rarity">
							<div class="item" :quantity="item.quantity" :type="LeekWars.items[item.template].type">
								<img v-if="LeekWars.items[item.template].type === ItemType.RESOURCE" class="image" :src="'/image/resource/' + LeekWars.items[item.template].name + '.png'">
								<img v-else class="image" :class="{small: item.template === 37 || item.template === 45 || item.template === 153 || item.template === 182}" :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[item.template].type] + '/' + LeekWars.items[item.template].name.replace('potion_', '').replace('hat_', '').replace('weapon_', '').replace('chip_', '').replace('pomp_', '') + '.png'">
							</div>
						</div>
					</div>
					<br>
					<div>
						Total estimé : <b>{{ $filters.number(retrieveItems.reduce((s, i) => s + i.quantity * LeekWars.items[i.template].price, 0)) }}</b> <span class="hab"></span>
					</div>
				</popup>

			</div>
		</template>
	</panel>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { Item, ItemTemplate, ItemType, ItemTypes, ITEM_TYPE_ICONS, ITEM_TYPE_NAME, ITEM_CATEGORY_NAME } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import ItemPreview from '@/component/market/item-preview.vue'
	import SchemeImage from '../market/scheme-image.vue'
	import { emitter } from '@/model/vue'

	enum Sort {
		DATE, PRICE, PRICE_LOT, QUANTITY, /*NAME, */ LEVEL, RARITY
	}
	enum Group {
		NONE, TYPE, RARITY
	}
	enum Size {
		SMALL, NORMAL, LARGE
	}

	@Options({ name: 'inventory', i18n: {}, mixins: [...mixins], components: { ItemPreview, SchemeImage } })
	export default class Inventory extends Vue {

		ItemType = ItemType
		ItemTypes = ItemTypes
		ITEM_TYPE_ICONS = ITEM_TYPE_ICONS
		ITEM_TYPE_NAME = ITEM_TYPE_NAME
		ITEM_CATEGORY_NAME = ITEM_CATEGORY_NAME
		Sort = Sort
		Group = Group
		Size = Size
		CATEGORY_ITEMS = 1
		// CATEGORY_POTIONS = 2
		CATEGORY_RESOURCES = 2
		category = 3
		placeholder_count: number = 0
		columns: number = 0
		sort: Sort = parseInt(localStorage.getItem('inventory/sort') || '0', 10) as Sort
		filter: ItemType = parseInt(localStorage.getItem('inventory/filter') || '0', 10) as ItemType
		group: Group = parseInt(localStorage.getItem('inventory/group') || '0', 10) as Group
		size: Size = parseInt(localStorage.getItem('inventory/size') || '1', 10) as Size
		collapsedGroups: Set<number> = new Set(JSON.parse(localStorage.getItem('inventory/collapsed') || '[]'))
		actions: any
		retrieveDialog: boolean = false
		retrieveItems = [] as Item[]

		isSchemeCraftable(item: any): boolean {
			if (item.type !== ItemType.SCHEME || !store.state.farmer) return true
			const scheme = LeekWars.schemes[LeekWars.items[item.template].params]
			if (!scheme) return true
			const farmer = store.state.farmer
			for (const ingredient of scheme.items) {
				if (!ingredient) continue
				const [itemId, quantity] = ingredient
				if (itemId === 148) {
					if (farmer.habs < quantity) return false
				} else {
					const found = farmer.resources.find((i: any) => i.template === itemId)
						|| farmer.components.find((i: any) => i.template === itemId)
						|| farmer.potions.find((i: any) => i.template === itemId)
						|| farmer.weapons.find((i: any) => i.template === itemId)
						|| farmer.chips.find((i: any) => i.template === itemId)
					if (!found || found.quantity < quantity) return false
				}
			}
			return true
		}

		// Shared tooltip state
		tooltipVisible: boolean = false
		tooltipItem: ItemTemplate | null = null
		tooltipQuantity: number = 0
		tooltipActivator: HTMLElement | undefined = undefined
		private tooltipShowTimer: number = 0
		private tooltipHideTimer: number = 0
		private tooltipOnTooltip: boolean = false

		showTooltip(item: any, event: MouseEvent) {
			clearTimeout(this.tooltipHideTimer)
			const target = event.currentTarget as HTMLElement
			if (this.tooltipVisible) {
				// Already open: switch to new item instantly
				this.tooltipActivator = target
				this.tooltipItem = LeekWars.items[item.template]
				this.tooltipQuantity = item.quantity
			} else {
				clearTimeout(this.tooltipShowTimer)
				this.tooltipShowTimer = window.setTimeout(() => {
					this.tooltipActivator = target
					this.tooltipItem = LeekWars.items[item.template]
					this.tooltipQuantity = item.quantity
					this.tooltipVisible = true
				}, 500)
			}
		}

		scheduleHideTooltip() {
			clearTimeout(this.tooltipShowTimer)
			this.tooltipHideTimer = window.setTimeout(() => {
				if (!this.tooltipOnTooltip) {
					this.tooltipVisible = false
				}
			}, 100)
		}

		onTooltipEnter() {
			this.tooltipOnTooltip = true
			clearTimeout(this.tooltipHideTimer)
		}

		onTooltipLeave() {
			this.tooltipOnTooltip = false
			this.tooltipVisible = false
		}

		get inventory() {
			const inventory = []
			if (store.state.farmer) {
				for (const weapon of store.state.farmer.weapons) {
					inventory.push({type: ItemType.WEAPON, ...weapon})
				}
				inventory.push(...store.state.farmer.chips.map(chip => {return {type: ItemType.CHIP, ...chip}}))
				inventory.push(...store.state.farmer.potions.map(potion => {return {type: ItemType.POTION, ...potion}}))
				inventory.push(...store.state.farmer.hats.map(hat => {return {type: ItemType.HAT, ...hat}}))
				inventory.push(...store.state.farmer.pomps.map(pomp => {return {type: ItemType.POMP, ...pomp}}))
				inventory.push(...store.state.farmer.resources.map(resource => {return {type: ItemType.RESOURCE, ...resource}}))
				inventory.push(...store.state.farmer.components.map(p => {return {type: ItemType.COMPONENT, ...p}}))
				inventory.push(...store.state.farmer.schemes.map(p => {return {type: ItemType.SCHEME, ...p}}))
			}
			return inventory
		}

		get filtered_inventory() {
			if (this.filter === ItemType.ALL) return this.inventory
			return this.inventory.filter(item => item.type == this.filter)
		}

		sortCompare(a: any, b: any) {
			if (this.sort === Sort.DATE) {
				if (b.time === a.time) return a.id - b.id
				return b.time - a.time
			}
			if (this.sort === Sort.PRICE) return LeekWars.items[b.template].price! - LeekWars.items[a.template].price!
			if (this.sort === Sort.PRICE_LOT) return LeekWars.items[b.template].price! * b.quantity - LeekWars.items[a.template].price! * a.quantity
			if (this.sort === Sort.QUANTITY) return b.quantity - a.quantity
			if (this.sort === Sort.RARITY) return LeekWars.items[b.template].rarity - LeekWars.items[a.template].rarity
			/*if (this.sort === Sort.LEVEL) */ return LeekWars.items[b.template].level - LeekWars.items[a.template].level
		}

		get sorted_inventory() {
			return [...this.filtered_inventory].sort((a: any, b: any) => {
				if (this.group === Group.TYPE && a.type !== b.type) return a.type - b.type
				if (this.group === Group.RARITY) {
					const ra = LeekWars.items[a.template].rarity
					const rb = LeekWars.items[b.template].rarity
					if (ra !== rb) return rb - ra
				}
				return this.sortCompare(a, b)
			})
		}

		get display_inventory(): any[] {
			const items = this.sorted_inventory
			const entry = (item: any) => ({ item, key: item.id, craftable: this.isSchemeCraftable(item) })
			if (this.group === Group.NONE) return items.map(entry)
			// Pre-compute group counts
			const groupCounts: Record<number, number> = {}
			for (const item of items) {
				const gk = this.group === Group.TYPE ? item.type : LeekWars.items[item.template].rarity
				groupCounts[gk] = (groupCounts[gk] || 0) + 1
			}
			const cols = this.columns || 1
			const result: any[] = []
			let lastGroup = -1
			let groupCount = 0
			for (const item of items) {
				const groupKey = this.group === Group.TYPE ? item.type : LeekWars.items[item.template].rarity
				if (groupKey !== lastGroup) {
					if (lastGroup !== -1 && !this.collapsedGroups.has(lastGroup) && groupCount % cols !== 0) {
						const pad = cols - (groupCount % cols)
						for (let i = 0; i < pad; i++) {
							result.push({ placeholder: true, key: 'pad-' + lastGroup + '-' + i })
						}
					}
					const collapsed = this.collapsedGroups.has(groupKey)
					if (this.group === Group.TYPE) {
						result.push({ separator: true, type: item.type, count: groupCounts[groupKey], key: 'sep-' + groupKey, collapsed, groupKey })
					} else {
						result.push({ separator: true, rarity: groupKey, count: groupCounts[groupKey], key: 'sep-' + groupKey, collapsed, groupKey })
					}
					lastGroup = groupKey
					groupCount = 0
				}
				if (!this.collapsedGroups.has(groupKey)) {
					result.push(entry(item))
					groupCount++
				}
			}
			return result
		}

		get total_estimated() {
			return Math.floor(this.filtered_inventory.reduce((s, i) => s + (LeekWars.items[i.template]?.price ?? 0) * i.quantity, 0))
		}

		readonly SIZES = {
			[Size.SMALL]:  { desktop: { w: 55, h: 58 }, mobile: { w: 45, h: 48 } },
			[Size.NORMAL]: { desktop: { w: 73, h: 76 }, mobile: { w: 60, h: 63 } },
			[Size.LARGE]:  { desktop: { w: 100, h: 103 }, mobile: { w: 80, h: 83 } },
		}

		@Watch('filtered_inventory')
		@Watch('size')
		resize() {
			const s = this.SIZES[this.size] || this.SIZES[Size.NORMAL]
			const W = LeekWars.mobile ? s.mobile.w : s.desktop.w
			const H = LeekWars.mobile ? s.mobile.h : s.desktop.h
			const inventory = this.$refs.inventory as HTMLElement
			const margin = 5
			this.columns = Math.floor((inventory.clientWidth - margin) / (W + margin))
			const last_columns = this.filtered_inventory.length % this.columns
			const column = last_columns === 0 ? 0 : this.columns - last_columns
			const rows = Math.floor((inventory.clientHeight - margin) / (H + margin))
			this.placeholder_count = Math.max(column, this.columns * rows - this.filtered_inventory.length)
		}

		hideTooltip() {
			this.tooltipVisible = false
			clearTimeout(this.tooltipShowTimer)
		}

		mounted() {
			LeekWars.footer = false
			LeekWars.box = true

			this.resize()
			emitter.on('resize', this.resize)
			emitter.on('craft', this.hideTooltip)
		}
		created() {
			this.actions = [
				{icon: 'mdi-bank', click: () => this.$router.push('/bank?ref=inventory_action')},
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
		beforeUnmount() {
			emitter.off('resize', this.resize)
			emitter.off('craft', this.hideTooltip)
			clearTimeout(this.tooltipShowTimer)
			clearTimeout(this.tooltipHideTimer)
		}

		@Watch('sort')
		updateSort() {
			localStorage.setItem('inventory/sort', '' + this.sort)
		}
		@Watch('filter')
		updateFilter() {
			localStorage.setItem('inventory/filter', '' + this.filter)
		}
		@Watch('group')
		updateGroup() {
			localStorage.setItem('inventory/group', '' + this.group)
		}
		@Watch('size')
		updateSize() {
			localStorage.setItem('inventory/size', '' + this.size)
		}

		toggleGroup(groupKey: number) {
			if (this.collapsedGroups.has(groupKey)) {
				this.collapsedGroups.delete(groupKey)
			} else {
				this.collapsedGroups.add(groupKey)
			}
			this.collapsedGroups = new Set(this.collapsedGroups) // trigger reactivity
			localStorage.setItem('inventory/collapsed', JSON.stringify([...this.collapsedGroups]))
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
.panel :deep(h2 > div) {
	width: 145px;
}
.inventory-panel {
	flex: 1;
	min-height: 0;
}
.container {
	flex: 1;
	min-height: 0;
}
.inventory-panel {
	// height: 100%;
}
#app.app .container {
	margin-bottom: 0;
}
.inventory-content {
	overflow-y: scroll;
	overflow-x: hidden;
	display: flex;
	flex-direction: column;
	flex: 1;
	:deep(.loader) {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
.inventory {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(73px, 1fr));
	gap: 5px;
	margin: 5px;
	.item {
		height: 76px;
	}
	&.size-0 {
		grid-template-columns: repeat(auto-fill, minmax(55px, 1fr));
		.item { height: 58px; }
	}
	&.size-2 {
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		.item { height: 103px; }
	}
}
#app.app .inventory {
	grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
	.item {
		height: 63px;
	}
	&.size-0 {
		grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
		.item { height: 48px; }
	}
	&.size-2 {
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		.item { height: 83px; }
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
	border: 1px solid var(--border);
	&:hover {
		background: var(--pure-white);
	}
	&.not-craftable {
		background: #f002;
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
		// img {
		// 	position: absolute;
		// 	width: 100%;
		// 	height: 100%;
		// 	object-fit: contain;
		// 	&.item {
		// 		width: 70%;
		// 		height: 70%;
		// 		left: 15%;
		// 		top: 10%;
		// 		filter: grayscale(0.2);
		// 		transform: scaleY(0.7) rotate(45deg) ;
		// 	}
		// }
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
	.size-0 &:after {
		font-size: 11px;
		padding: 1px 3px;
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
	border: 1px solid var(--border);
	height: 78px;
}
.size-0 .placeholder { height: 60px; }
.size-2 .placeholder { height: 105px; }
#app.app .placeholder {
	height: 65px;
}
#app.app .size-0 .placeholder { height: 50px; }
#app.app .size-2 .placeholder { height: 85px; }
.type-separator {
	grid-column: 1 / -1;
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 6px;
	font-size: 13px;
	font-weight: 500;
	color: var(--text-color-secondary);
	cursor: pointer;
	user-select: none;
	&:hover {
		background: var(--background-header);
	}
	.v-icon {
		font-size: 18px;
	}
	.collapse-icon {
		transition: transform 0.2s;
		&.collapsed {
			transform: rotate(-90deg);
		}
	}
	.group-count {
		opacity: 0.6;
	}
}
.menu-actions {
	.v-icon {
		margin: 6px;
	}
	.submenu-header {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-color-secondary);
		min-height: 30px;
		pointer-events: none;
	}
}
.inventory-tooltip {
	width: 280px;
}
</style>
