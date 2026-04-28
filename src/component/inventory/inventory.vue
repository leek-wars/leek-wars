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
								<img v-if="entry.item.type === ItemType.RESOURCE" class="image" :src="'/image/resource/' + LeekWars.items[entry.item.template].name + '.png'" loading="lazy">
								<scheme-image v-else-if="entry.item.type === ItemType.SCHEME" class="image" :scheme="LeekWars.schemes[LeekWars.items[entry.item.template].params]" />
								<img v-else-if="entry.item.type === ItemType.COMPONENT" class="image" :src="'/image/component/' + LeekWars.items[entry.item.template].name + '.png'" loading="lazy">
								<img v-else class="image" :class="{small: entry.item.template === 37 || entry.item.template === 45 || entry.item.template === 153 || entry.item.template === 182}" :src="'/image/' + LeekWars.items[entry.item.template].name.replace('_', '/') + '.png'" loading="lazy">
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
						<item-preview v-if="tooltipItem" :item="tooltipItem" :quantity="tooltipQuantity" :inventory="true" :show-use="true" @retrieve="retrieve" />
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

<script lang="ts" setup>
	import { mixins } from '@/model/i18n'
	import { type Item, type ItemTemplate, ItemType, ItemTypes, ITEM_TYPE_ICONS, ITEM_TYPE_NAME, ITEM_CATEGORY_NAME } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRouter } from 'vue-router'
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

	defineOptions({ name: 'inventory', i18n: {}, mixins: [...mixins] })

	const { t } = useI18n()
	const router = useRouter()
	const inventoryRef = useTemplateRef<HTMLElement>('inventory')

	const CATEGORY_ITEMS = 1
	const CATEGORY_RESOURCES = 2
	const category = ref(3)
	const placeholder_count = ref(0)
	const columns = ref(0)
	const sort = ref<Sort>(parseInt(localStorage.getItem('inventory/sort') || '0', 10) as Sort)
	const filter = ref<ItemType>(parseInt(localStorage.getItem('inventory/filter') || '0', 10) as ItemType)
	const group = ref<Group>(parseInt(localStorage.getItem('inventory/group') || '0', 10) as Group)
	const size = ref<Size>(parseInt(localStorage.getItem('inventory/size') || '1', 10) as Size)
	const collapsedGroups = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem('inventory/collapsed') || '[]')))
	const retrieveDialog = ref(false)
	const retrieveItems = ref<Item[]>([])

	function isSchemeCraftable(item: any): boolean {
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

	const tooltipVisible = ref(false)
	const tooltipItem = ref<ItemTemplate | null>(null)
	const tooltipQuantity = ref(0)
	const tooltipActivator = ref<HTMLElement | undefined>(undefined)
	let tooltipShowTimer = 0
	let tooltipHideTimer = 0
	let tooltipOnTooltip = false

	function showTooltip(item: any, event: MouseEvent) {
		clearTimeout(tooltipHideTimer)
		const target = event.currentTarget as HTMLElement
		if (tooltipVisible.value) {
			tooltipActivator.value = target
			tooltipItem.value = LeekWars.items[item.template]
			tooltipQuantity.value = item.quantity
		} else {
			clearTimeout(tooltipShowTimer)
			tooltipShowTimer = window.setTimeout(() => {
				tooltipActivator.value = target
				tooltipItem.value = LeekWars.items[item.template]
				tooltipQuantity.value = item.quantity
				tooltipVisible.value = true
			}, 500)
		}
	}

	function scheduleHideTooltip() {
		clearTimeout(tooltipShowTimer)
		tooltipHideTimer = window.setTimeout(() => {
			if (!tooltipOnTooltip) {
				tooltipVisible.value = false
			}
		}, 100)
	}

	function onTooltipEnter() {
		tooltipOnTooltip = true
		clearTimeout(tooltipHideTimer)
	}

	function onTooltipLeave() {
		tooltipOnTooltip = false
		tooltipVisible.value = false
	}

	const inventory = computed(() => {
		const inventory = []
		if (store.state.farmer) {
			for (const weapon of store.state.farmer.weapons) {
				inventory.push({type: ItemType.WEAPON, ...weapon})
			}
			inventory.push(...store.state.farmer.chips.map(chip => ({type: ItemType.CHIP, ...chip})))
			inventory.push(...store.state.farmer.potions.map(potion => ({type: ItemType.POTION, ...potion})))
			inventory.push(...store.state.farmer.hats.map(hat => ({type: ItemType.HAT, ...hat})))
			inventory.push(...store.state.farmer.pomps.map(pomp => ({type: ItemType.POMP, ...pomp})))
			inventory.push(...store.state.farmer.resources.map(resource => ({type: ItemType.RESOURCE, ...resource})))
			inventory.push(...store.state.farmer.components.map(p => ({type: ItemType.COMPONENT, ...p})))
			inventory.push(...store.state.farmer.schemes.map(p => ({type: ItemType.SCHEME, ...p})))
		}
		return inventory
	})

	const filtered_inventory = computed(() => {
		if (filter.value === ItemType.ALL) return inventory.value
		return inventory.value.filter(item => item.type == filter.value)
	})

	function sortCompare(a: any, b: any) {
		if (sort.value === Sort.DATE) {
			if (b.time === a.time) return a.id - b.id
			return b.time - a.time
		}
		if (sort.value === Sort.PRICE) return LeekWars.items[b.template].price! - LeekWars.items[a.template].price!
		if (sort.value === Sort.PRICE_LOT) return LeekWars.items[b.template].price! * b.quantity - LeekWars.items[a.template].price! * a.quantity
		if (sort.value === Sort.QUANTITY) return b.quantity - a.quantity
		if (sort.value === Sort.RARITY) return LeekWars.items[b.template].rarity - LeekWars.items[a.template].rarity
		return LeekWars.items[b.template].level - LeekWars.items[a.template].level
	}

	const sorted_inventory = computed(() => {
		return [...filtered_inventory.value].sort((a: any, b: any) => {
			if (group.value === Group.TYPE && a.type !== b.type) return a.type - b.type
			if (group.value === Group.RARITY) {
				const ra = LeekWars.items[a.template].rarity
				const rb = LeekWars.items[b.template].rarity
				if (ra !== rb) return rb - ra
			}
			return sortCompare(a, b)
		})
	})

	const display_inventory = computed<any[]>(() => {
		const items = sorted_inventory.value
		const entry = (item: any) => ({ item, key: item.id, craftable: isSchemeCraftable(item) })
		if (group.value === Group.NONE) return items.map(entry)
		const groupCounts: Record<number, number> = {}
		for (const item of items) {
			const gk = group.value === Group.TYPE ? item.type : LeekWars.items[item.template].rarity
			groupCounts[gk] = (groupCounts[gk] || 0) + 1
		}
		const cols = columns.value || 1
		const result: any[] = []
		let lastGroup = -1
		let groupCount = 0
		for (const item of items) {
			const groupKey = group.value === Group.TYPE ? item.type : LeekWars.items[item.template].rarity
			if (groupKey !== lastGroup) {
				if (lastGroup !== -1 && !collapsedGroups.value.has(lastGroup) && groupCount % cols !== 0) {
					const pad = cols - (groupCount % cols)
					for (let i = 0; i < pad; i++) {
						result.push({ placeholder: true, key: 'pad-' + lastGroup + '-' + i })
					}
				}
				const collapsed = collapsedGroups.value.has(groupKey)
				if (group.value === Group.TYPE) {
					result.push({ separator: true, type: item.type, count: groupCounts[groupKey], key: 'sep-' + groupKey, collapsed, groupKey })
				} else {
					result.push({ separator: true, rarity: groupKey, count: groupCounts[groupKey], key: 'sep-' + groupKey, collapsed, groupKey })
				}
				lastGroup = groupKey
				groupCount = 0
			}
			if (!collapsedGroups.value.has(groupKey)) {
				result.push(entry(item))
				groupCount++
			}
		}
		return result
	})

	const total_estimated = computed(() => Math.floor(filtered_inventory.value.reduce((s: number, i: any) => s + (LeekWars.items[i.template]?.price ?? 0) * i.quantity, 0)))

	const SIZES = {
		[Size.SMALL]:  { desktop: { w: 55, h: 58 }, mobile: { w: 45, h: 48 } },
		[Size.NORMAL]: { desktop: { w: 73, h: 76 }, mobile: { w: 60, h: 63 } },
		[Size.LARGE]:  { desktop: { w: 100, h: 103 }, mobile: { w: 80, h: 83 } },
	}

	function resize() {
		const s = SIZES[size.value] || SIZES[Size.NORMAL]
		const W = LeekWars.mobile ? s.mobile.w : s.desktop.w
		const H = LeekWars.mobile ? s.mobile.h : s.desktop.h
		const el = inventoryRef.value
		if (!el) return
		const margin = 5
		columns.value = Math.floor((el.clientWidth - margin) / (W + margin))
		const last_columns = filtered_inventory.value.length % columns.value
		const column = last_columns === 0 ? 0 : columns.value - last_columns
		const rows = Math.floor((el.clientHeight - margin) / (H + margin))
		placeholder_count.value = Math.max(column, columns.value * rows - filtered_inventory.value.length)
	}

	watch([filtered_inventory, size], resize)

	function hideTooltip() {
		tooltipVisible.value = false
		clearTimeout(tooltipShowTimer)
	}

	const actions = [
		{icon: 'mdi-bank', click: () => router.push('/bank?ref=inventory_action')},
		{image: 'icon/market.png', click: () => router.push('/market')},
	]
	LeekWars.setActions(actions)
	LeekWars.setTitle(t('main.inventory') as string)
	updateSubtitle()

	function updateSubtitle() {
		if (store.state.farmer) {
			LeekWars.setSubTitle(t('main.x_habs', [LeekWars.formatNumber(store.state.farmer.habs)]) as string + " • " + t('main.x_crystals', [LeekWars.formatNumber(store.state.farmer.crystals)]))
		}
	}

	onMounted(() => {
		LeekWars.footer = false
		LeekWars.box = true
		resize()
		emitter.on('resize', resize)
		emitter.on('craft', hideTooltip)
		emitter.on('clover-used', hideTooltip)
	})

	onBeforeUnmount(() => {
		emitter.off('resize', resize)
		emitter.off('craft', hideTooltip)
		clearTimeout(tooltipShowTimer)
		clearTimeout(tooltipHideTimer)
	})

	watch(sort, () => localStorage.setItem('inventory/sort', '' + sort.value))
	watch(filter, () => localStorage.setItem('inventory/filter', '' + filter.value))
	watch(group, () => localStorage.setItem('inventory/group', '' + group.value))
	watch(size, () => localStorage.setItem('inventory/size', '' + size.value))

	function toggleGroup(groupKey: number) {
		if (collapsedGroups.value.has(groupKey)) {
			collapsedGroups.value.delete(groupKey)
		} else {
			collapsedGroups.value.add(groupKey)
		}
		collapsedGroups.value = new Set(collapsedGroups.value)
		localStorage.setItem('inventory/collapsed', JSON.stringify([...collapsedGroups.value]))
	}

	function retrieve(items: Item[]) {
		if (items.length) {
			retrieveDialog.value = true
			retrieveItems.value = items
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
