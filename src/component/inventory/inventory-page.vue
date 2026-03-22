<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('main.inventory') }}</h1>
			<div class="tabs">
				<a href="https://leek-wars.myspreadshop.fr" target="_blank" rel="noopener">
					<div class="tab action" icon="cart-outline" link="https://leek-wars.myspreadshop.fr">
						<v-icon>mdi-cart-outline</v-icon>
						<span>{{ $t('main.shop') }}</span>
						<v-icon class="small">mdi-open-in-new</v-icon>
					</div>
				</a>
				<router-link v-if="env.BANK && $store.state.farmer?.bank_enabled" to="/bank">
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
		<div class="column">
			<inventory />
			<div class="resizer" @mousedown="resizerMousedown"><v-icon>mdi-drag-horizontal-variant</v-icon></div>
			<panel ref="bottomPanel" class="bottom-panel" icon="mdi-map-outline" toggle="inventory/workshop" :toggle-invert="true" :style="bottomPanelStyle" @update:expanded="bottomExpanded = $event">
				<template #title>
					<span>{{ $t('main.schemes') }} ({{ schemes.length }}<span v-if="filter !== 0 || craftableOnly"> / {{ all_schemes.length }}</span>)</span>
				</template>
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
								<v-badge v-if="filter !== 0 || craftableOnly" :content="(filter !== 0 ? 1 : 0) + (craftableOnly ? 1 : 0)" color="#5fad1b" floating>
									<v-icon>mdi-filter-outline</v-icon>
								</v-badge>
								<v-icon v-else>mdi-filter-outline</v-icon>
							</div>
						</template>
						<v-list dense class="menu-actions">
							<v-list-item v-ripple @click="craftableOnly = !craftableOnly">
								<v-icon>mdi-hammer-wrench</v-icon>
								<span>{{ $t('craftable') }}</span>
								<v-icon v-if="craftableOnly">mdi-check</v-icon>
							</v-list-item>
							<v-divider />
							<v-list-item v-for="t in schemeFilterTypes" :key="t" v-ripple @click="filter = t">
								<v-icon>{{ ITEM_TYPE_ICONS[t] }}</v-icon>
								<span>{{ $t('main.' + ITEM_TYPE_NAME[t]) }}</span>
								<v-icon v-if="t === filter">mdi-check</v-icon>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
				<template #content>
					<div ref="bottomContent" class="bottom-content">
						<div class="forge-wrapper">
							<forge></forge>
						</div>
						<div class="schemes-section">
							<loader v-if="!$store.state.farmer" />
							<div v-else class="schemes-list">
								<scheme v-for="(scheme, s) in schemes" :key="s" class="scheme" :scheme="scheme" :show-result="true" :show-price="false"></scheme>
							</div>
						</div>
					</div>
				</template>
			</panel>
		</div>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { ItemType, ITEM_TYPE_ICONS, ITEM_TYPE_NAME } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import Inventory from '@/component/inventory/inventory.vue'
	import SchemeView from '../market/scheme.vue'
	import Forge from '../forge/forge.vue'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'

	enum Sort {
		PRICE, LEVEL, RARITY, INGREDIENT_COUNT
	}

	@Options({ name: 'inventory-page', i18n: {}, mixins: [...mixins], components: {
		Inventory,
		'scheme': SchemeView,
		'forge': Forge
	} })
	export default class InventoryPage extends Vue {

		Sort = Sort
		ItemType = ItemType
		ITEM_TYPE_ICONS = ITEM_TYPE_ICONS
		ITEM_TYPE_NAME = ITEM_TYPE_NAME
		bottomHeight: number = Math.max(300, parseInt(localStorage.getItem('inventory/bottom-height') || '350', 10))
		bottomExpanded: boolean = localStorage.getItem('inventory/workshop') !== 'false'
		sort: Sort = Math.min(parseInt(localStorage.getItem('workshop/sort') || '0', 10), Sort.INGREDIENT_COUNT) as Sort
		filter: number = parseInt(localStorage.getItem('workshop/filter') || '0', 10)
		craftableOnly: boolean = localStorage.getItem('workshop/craftable') === 'true'

		isCraftable(scheme: any): boolean {
			if (!store.state.farmer) return false
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

		get all_schemes() {
			if (!store.state.farmer) return []
			return Object.values(LeekWars.schemes)
				.filter(scheme => store.state.farmer?.schemes.find(s => LeekWars.items[s.template].params == scheme.id))
		}

		get schemeFilterTypes() {
			const types = new Set(this.all_schemes.map(s => LeekWars.items[s.result].type))
			return [ItemType.ALL, ...Array.from(types).sort()]
		}

		get schemes() {
			let schemes = this.all_schemes
			if (this.filter !== 0) {
				schemes = schemes.filter(s => LeekWars.items[s.result].type === this.filter)
			}
			if (this.craftableOnly) {
				schemes = schemes.filter(s => this.isCraftable(s))
			}
			return [...schemes].sort((a, b) => {
				if (this.sort === Sort.LEVEL) return LeekWars.items[b.result].level - LeekWars.items[a.result].level
				if (this.sort === Sort.RARITY) return LeekWars.items[b.result].rarity - LeekWars.items[a.result].rarity
				if (this.sort === Sort.INGREDIENT_COUNT) return b.items.filter(i => i !== null).length - a.items.filter(i => i !== null).length
				/* Sort.PRICE */ return LeekWars.items[b.result].price! - LeekWars.items[a.result].price!
			})
		}

		@Watch('sort')
		updateSort() {
			localStorage.setItem('workshop/sort', '' + this.sort)
		}
		@Watch('filter')
		updateFilter() {
			localStorage.setItem('workshop/filter', '' + this.filter)
		}
		@Watch('craftableOnly')
		updateCraftable() {
			localStorage.setItem('workshop/craftable', '' + this.craftableOnly)
		}

		get bottomPanelStyle() {
			if (!this.bottomExpanded) return { flex: '0 0 auto' }
			return { flex: '0 0 ' + this.bottomHeight + 'px' }
		}

		resizerMousedown(e: MouseEvent) {
			const panel = this.$refs.bottomPanel as any
			const column = (this.$el as HTMLElement).querySelector('.column') as HTMLElement
			const startY = e.clientY
			const startHeight = panel.expanded ? this.bottomHeight : 0
			const maxHeight = column.clientHeight - 200
			const mousemove = (ev: MouseEvent) => {
				let height = Math.max(0, Math.min(maxHeight, startHeight - (ev.clientY - startY)))
				if (height < 200) {
					height = 0
					if (panel.expanded) panel.expanded = false
				} else {
					if (!panel.expanded) panel.expanded = true
					height = Math.max(300, height)
				}
				this.bottomHeight = height || 300
				localStorage.setItem('inventory/bottom-height', '' + this.bottomHeight)
			}
			const mouseup = () => {
				document.documentElement.removeEventListener('mousemove', mousemove)
				document.documentElement.removeEventListener('mouseup', mouseup)
				document.body.style.cursor = ''
				document.body.style.userSelect = ''
			}
			document.documentElement.addEventListener('mousemove', mousemove, false)
			document.documentElement.addEventListener('mouseup', mouseup, false)
			document.body.style.cursor = 'ns-resize'
			document.body.style.userSelect = 'none'
			e.preventDefault()
		}

		scrollToForge() {
			const el = this.$refs.bottomContent as HTMLElement
			if (el && LeekWars.mobile) {
				el.scrollTo({ top: 0, behavior: 'smooth' })
			}
		}

		mounted() {
			LeekWars.footer = false
			LeekWars.box = true
			emitter.on('craft', this.scrollToForge)
		}

		beforeUnmount() {
			LeekWars.footer = true
			LeekWars.box = false
			emitter.off('craft', this.scrollToForge)
		}
	}
</script>

<style lang="scss" scoped>
.column {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
}
.column :deep(.inventory-panel) {
	min-height: 200px;
}
.resizer {
	height: 36px;
	margin-bottom: -36px;
	position: relative;
	z-index: 2;
	cursor: ns-resize;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	user-select: none;
	pointer-events: none;
	.v-icon {
		pointer-events: auto;
		font-size: 20px;
		opacity: 1;
		color: #aaa;
		padding: 0 20px;
	}
	&:hover .v-icon {
		opacity: 1;
		color: #5fad1b;
	}
}
#app.app .resizer {
	display: none;
}
#app.app .column :deep(.inventory-panel) {
	min-height: 0;
	flex: 1;
}
#app.app .bottom-panel {
	flex: 1;
}
.bottom-panel {
	min-height: 0;
}
.bottom-content {
	display: flex;
	flex: 1;
	min-height: 0;
	padding: 0;
	.forge-wrapper {
		flex-basis: 350px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
#app.app .bottom-content {
	flex-direction: column;
	overflow-y: auto;
	.forge-wrapper {
		flex-basis: auto;
	}
}
.schemes-section {
	flex: 1;
	min-height: 0;
	min-width: 0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	:deep(.loader) {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
.schemes-list {
	padding: 0;
}
#app.app .schemes-section {
	overflow-y: visible;
}
.menu-actions {
	.v-icon {
		margin: 6px;
	}
}
</style>