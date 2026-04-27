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
							<div v-if="item" v-ripple class="item" :quantity="$filters.number(item.quantity)" :type="LeekWars.items[item.template].type" @click="remove(i, $event)">
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
			<template #actions>
				<v-menu offset-y>
					<template #activator="{ props }">
						<div class="button flat" v-bind="props">
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
					<template #activator="{ props }">
						<div class="button flat" v-bind="props">
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
			<template #content>
				<div class="schemes">
				<scheme v-for="(scheme, s) in sorted_schemes" :key="s" class="scheme" :scheme="scheme" :show-result="true"></scheme>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import { mixins } from '@/model/i18n'
	import { ITEM_TYPE_NAME, ITEM_CATEGORY_NAME, ITEM_TYPE_ICONS, ItemType, ItemTypes } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { SchemeTemplate } from '@/model/scheme'
	import RichTooltipItem from '../rich-tooltip/rich-tooltip-item.vue'
	import Scheme from '../market/scheme.vue'
	import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
	import { locale } from '@/locale'

	const Inventory = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/inventory/inventory.${locale}.i18n`))

	enum Sort {
		DATE, PRICE, PRICE_LOT, QUANTITY, /*NAME, */ LEVEL, RARITY, INGREDIENT_COUNT
	}

	defineOptions({ name: 'workshop', i18n: {}, mixins: [...mixins] })

	const schemes = ref<SchemeTemplate[]>([])
	const scheme = ref<any>(null)
	const forge = ref<any[]>([null, null, null, null, null, null, null, null, null])
	const sort = ref<Sort>(parseInt(localStorage.getItem('workshop/sort') || '0', 10) as Sort)
	const filter = ref<ItemType>(parseInt(localStorage.getItem('workshop/filter') || '0', 10) as ItemType)

	const filtered_schemes = computed(() => schemes.value)

	const sorted_schemes = computed(() => {
		if (sort.value === Sort.DATE) return filtered_schemes.value
		return [...filtered_schemes.value].sort((a, b) => {
			if (sort.value === Sort.PRICE) return LeekWars.items[b.result].price! - LeekWars.items[a.result].price!
			if (sort.value === Sort.RARITY) return LeekWars.items[b.result].rarity - LeekWars.items[a.result].rarity
			if (sort.value === Sort.INGREDIENT_COUNT) return b.items.length - a.items.length
			return LeekWars.items[b.result].level - LeekWars.items[a.result].level
		})
	})

	console.log("LeekWars.schemes", LeekWars.schemes)
	schemes.value = Object.values(LeekWars.schemes)
	console.log("Schemes", schemes.value)

	onMounted(() => {
		LeekWars.footer = false
		LeekWars.box = true
	})
	onUnmounted(() => {
		LeekWars.footer = true
		LeekWars.box = false
	})

	function use(s: any) {
		scheme.value = s
		for (let i = 0; i < 9; ++i) {
			forge.value[i] = null
		}
		for (let i = 0; i < s.items.length; ++i) {
			forge.value[i] = {template: s.items[i][0][0], quantity: s.items[i][0][1]}
		}
	}

	function pick(item: any, position: number, event: MouseEvent) {
		const all = event.ctrlKey
		const added_quantity = all ? item.quantity : 1
		let forgePosition = -1
		let quantity = added_quantity
		for (let i = 0; i < 9; ++i) {
			if (forge.value[i] && forge.value[i].template === item.template) {
				forgePosition = i
				quantity += forge.value[i].quantity
				break
			}
		}
		if (forgePosition === -1) {
			for (let i = 0; i < 9; ++i) {
				if (forge.value[i] == null) {
					forgePosition = i
					break
				}
			}
		}
		forge.value[forgePosition] = {template: item.template, quantity}
		removeInventory(position, added_quantity)
	}

	function removeInventory(position: number, quantity: number) {
		// noop
	}

	function remove(i: number, event: MouseEvent) {
		const all = event.ctrlKey
		if (forge.value[i].quantity === 1 || all) {
			addInventory(forge.value[i].template, forge.value[i].quantity)
			forge.value[i] = null
		} else {
			const quantity = all ? forge.value[i].quantity : 1
			addInventory(forge.value[i].template, quantity)
			forge.value[i] = {template: forge.value[i].template, quantity: forge.value[i].quantity - quantity}
		}
	}

	function addInventory(template: number, quantity: number) {
		// noop
	}

	function resolveScheme() {
		console.log("forge updated")
		scheme.value = null
		for (const s of schemes.value) {
			if (match(s)) {
				scheme.value = s
			}
		}
	}

	function match(scheme: any) {
		let forge_items = 0
		for (const item of forge.value) {
			if (item) { forge_items++ }
		}
		if (forge_items !== scheme.items.length) { return false }

		for (let i = 0; i < forge.value.length; ++i) {
			if (!forge.value[i]) continue
			if (i >= scheme.items.length) { return false }
		}
		return true
	}

	watch(forge, resolveScheme)
	watch(sort, () => localStorage.setItem('workshop/sort', '' + sort.value))
	watch(filter, () => localStorage.setItem('workshop/filter', '' + filter.value))
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