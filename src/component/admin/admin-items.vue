<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Items', link: '/admin/items'}]" :raw="true" /></h1>
			<div v-if="!LeekWars.mobile" class="tabs">
				<div class="tab" @click="load">
					<v-icon>mdi-refresh</v-icon>
					Rafraîchir
				</div>
			</div>
		</div>

		<!-- Totaux -->
		<panel class="first">
			<template #content>
				<div class="content">
					<div class="kpi-grid">
						<kpi-card label="Items différents" :value="$filters.number(rows.length)" />
						<kpi-card label="Exemplaires en jeu" :value="$filters.number(totalItems)" />
						<kpi-card label="Éleveurs possédants" :value="$filters.number(total_farmers)" />
					</div>
				</div>
			</template>
		</panel>

		<!-- Filtres -->
		<panel>
			<template #content>
				<div class="content">
					<div class="category-controls">
						<v-btn v-for="c of categoryOptions" :key="c.type" size="small" variant="text" :class="{active: category === c.type}" @click="category = c.type">
							<v-icon size="18">{{ c.icon }}</v-icon>
							{{ c.label }} <span class="count">{{ c.count }}</span>
						</v-btn>
						<input v-model="search" class="filter-input" type="text" placeholder="Rechercher un item…">
						<v-btn v-if="search || category !== ItemType.ALL" size="small" variant="text" @click="resetFilters">
							<v-icon>mdi-filter-remove-outline</v-icon> Réinitialiser
						</v-btn>
					</div>
				</div>
			</template>
		</panel>

		<!-- Table -->
		<panel class="last">
			<template #content>
				<div class="content">
					<loader v-if="loading" />
					<v-data-table
						v-else
						:headers="headers"
						:items="filteredRows"
						:items-per-page="25"
						:items-per-page-options="itemsPerPageOptions"
						:sort-by="[{ key: 'total', order: 'asc' }]"
						density="compact"
						class="items-table">
						<template #item.name="{ item }">
							<div class="label-cell">
								<rich-tooltip-item v-if="item.tpl" :item="item.tpl" :inventory="true" :bottom="true" :instant="true">
									<div class="item-thumb">
										<scheme-image v-if="item.scheme" :scheme="item.scheme" class="scheme-thumb" />
										<img v-else-if="!imgErrors.has(item.template)" :src="itemImage(item.tpl)" :class="{ weapon: item.type === ItemType.WEAPON }" :alt="item.name" @error="imgErrors.add(item.template)">
										<v-icon v-else class="cat-icon">{{ item.icon }}</v-icon>
									</div>
								</rich-tooltip-item>
								<div v-else class="item-thumb"><v-icon class="cat-icon">{{ item.icon }}</v-icon></div>
								<span>{{ item.name }}</span>
							</div>
						</template>
						<template #item.category="{ item }">{{ item.categoryLabel }}</template>
						<template #item.level="{ item }">{{ item.level === null ? '—' : item.level }}</template>
						<template #item.rarity="{ item }">
							<span v-if="item.rarity !== null" class="rarity-badge" :class="'difficulty-' + item.rarity">{{ item.rarityLabel }}</span>
							<span v-else>—</span>
						</template>
						<template #item.total="{ item }">
							<div class="quantity">
								<span>{{ $filters.number(item.total) }}</span>
								<div class="ibar"><div class="fill" :style="{ width: item.bar }"></div></div>
							</div>
						</template>
						<template #item.equipped="{ item }">{{ $filters.number(item.equipped) }}</template>
						<template #item.farmer_count="{ item }">{{ $filters.number(item.farmer_count) }}</template>
						<template #item.average="{ item }">{{ num1(item.average) }}</template>
						<template #item.coverage="{ item }">{{ pct1(item.coverage) }}</template>
						<template #item.usage="{ item }">{{ pct1(item.usage) }}</template>
						<template #item.price="{ item }">
							<span v-if="item.price === null">—</span>
							<span v-else class="price">{{ $filters.number(item.price) }}<span class="hab"></span></span>
						</template>
						<template #no-data><div class="empty">Aucun item</div></template>
					</v-data-table>
				</div>
			</template>
		</panel>
	</div>
</template>

<script lang="ts" setup>
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { ItemType, ItemTemplate, ITEM_CATEGORY_NAME, ITEM_TYPE_ICONS, ITEM_TYPE_NAME } from '@/model/item'
	import type { SchemeTemplate } from '@/model/scheme'
	import { computed, onMounted, reactive, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import KpiCard from '@/component/admin/kpi-card.vue'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import SchemeImage from '@/component/market/scheme-image.vue'

	interface DistributionRow { template: number, farmer_count: number, total: number, equipped: number, equipped_farmers: number }
	interface ItemRow {
		template: number
		tpl: ItemTemplate | undefined
		scheme: SchemeTemplate | null
		name: string
		type: number
		icon: string
		categoryLabel: string
		level: number | null
		rarity: number | null
		rarityLabel: string
		price: number | null
		total: number
		equipped: number
		farmer_count: number
		average: number
		coverage: number | null
		usage: number | null
		bar: string
	}

	const router = useRouter()
	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle('Admin Items')

	const i18n = useI18n()

	// Nom officiel de la catégorie via les traductions du jeu (main.weapons, main.chips…),
	// pour coller aux libellés utilisés partout ailleurs sur le site.
	function categoryLabel(type: number): string {
		const key = ITEM_TYPE_NAME[type]
		return key ? i18n.t('main.' + key) : '—'
	}

	const loading = ref(true)
	const rows = ref<ItemRow[]>([])
	const total_farmers = ref(0)
	const category = ref<number>(ItemType.ALL)
	const search = ref('')
	// Templates dont l'image a échoué au chargement : repli sur l'icône de catégorie
	// (plans/schemes, boîtes sans visuel, ou assets absents en dev local).
	const imgErrors = reactive(new Set<number>())

	const headers: any[] = [
		{ title: 'Item', key: 'name', align: 'start', sortable: true },
		{ title: 'Catégorie', key: 'category', align: 'start', sortable: true, value: 'categoryLabel' },
		{ title: 'Niveau', key: 'level', align: 'end', sortable: true },
		{ title: 'Rareté', key: 'rarity', align: 'start', sortable: true },
		{ title: 'Prix estimé', key: 'price', align: 'end', sortable: true },
		{ title: 'Nombre', key: 'total', align: 'end', sortable: true },
		{ title: 'Équipés', key: 'equipped', align: 'end', sortable: true },
		{ title: 'Éleveurs', key: 'farmer_count', align: 'end', sortable: true },
		{ title: 'Moy. / éleveur', key: 'average', align: 'end', sortable: true },
		{ title: '% éleveurs', key: 'coverage', align: 'end', sortable: true },
		{ title: '% utilisation', key: 'usage', align: 'end', sortable: true },
	]
	const itemsPerPageOptions = [
		{ value: 25, title: '25' },
		{ value: 50, title: '50' },
		{ value: 100, title: '100' },
		{ value: -1, title: 'Tous' },
	]

	const totalItems = computed(() => rows.value.reduce((s, r) => s + r.total, 0))

	// Catégories présentes dans les données + « Tous » ; comptées pour l'affichage.
	const categoryOptions = computed(() => {
		const counts = new Map<number, number>()
		for (const r of rows.value) counts.set(r.type, (counts.get(r.type) || 0) + 1)
		const options = [{ type: ItemType.ALL, label: 'Tous', icon: 'mdi-all-inclusive', count: rows.value.length }]
		for (const type of Object.keys(ITEM_TYPE_NAME).map(Number)) {
			if (type === ItemType.ALL) continue
			if (counts.has(type)) {
				options.push({ type, label: categoryLabel(type), icon: ITEM_TYPE_ICONS[type], count: counts.get(type)! })
			}
		}
		return options
	})

	const filteredRows = computed(() => {
		const q = search.value.trim().toLowerCase()
		return rows.value.filter(r => {
			if (category.value !== ItemType.ALL && r.type !== category.value) return false
			if (q && !r.name.toLowerCase().includes(q)) return false
			return true
		})
	})

	function resetFilters() {
		category.value = ItemType.ALL
		search.value = ''
	}

	// Nom traduit d'un template (weapon.pistol, chip.spark…), repli sur le nom brut.
	function templateName(item: ItemTemplate): string {
		const cat = ITEM_CATEGORY_NAME[item.type]
		const short = item.name.replace(cat + '_', '')
		const key = cat + '.' + short
		return i18n.te(key) ? i18n.t(key) : item.name
	}

	// Pour un schéma (type SCHEME), l'item pertinent (nom/image) est son résultat :
	// item.params → LeekWars.schemes[params].result → item_template du craft.
	function schemeResult(item: ItemTemplate): ItemTemplate | null {
		const scheme = LeekWars.schemes[item.params]
		return scheme ? (LeekWars.items[scheme.result] as ItemTemplate | undefined) || null : null
	}

	function itemName(item: ItemTemplate): string {
		if (item.type === ItemType.SCHEME) {
			const result = schemeResult(item)
			return result ? i18n.t('main.scheme_x', [templateName(result)]) : item.name
		}
		return templateName(item)
	}

	// URL de l'image de l'item (même convention que le composant <item>). Pour un
	// schéma, on affiche l'image de l'item résultat. En cas d'échec (@error), on
	// retombe sur l'icône de catégorie via imgErrors.
	function itemImage(item: ItemTemplate): string {
		const target = item.type === ItemType.SCHEME ? (schemeResult(item) || item) : item
		const cat = ITEM_CATEGORY_NAME[target.type]
		const img = target.type === ItemType.COMPONENT ? target.name : target.name.substring(target.name.indexOf('_') + 1)
		return '/image/' + cat + '/' + img + '.png'
	}

	function load() {
		loading.value = true
		LeekWars.get<{ distribution: DistributionRow[], total_farmers: number }>('item/distribution').then(data => {
			total_farmers.value = data.total_farmers
			const max = data.distribution.reduce((m, d) => Math.max(m, d.total), 0)
			rows.value = data.distribution.map(d => {
				const item = LeekWars.items[d.template] as ItemTemplate | undefined
				const type = item ? item.type : ItemType.ALL
				return {
					template: d.template,
					tpl: item,
					scheme: item && item.type === ItemType.SCHEME ? (LeekWars.schemes[item.params] || null) : null,
					name: item ? itemName(item) : 'Item #' + d.template,
					type,
					icon: ITEM_TYPE_ICONS[type] || 'mdi-help-circle-outline',
					categoryLabel: item ? categoryLabel(type) : '—',
					level: item ? item.level : null,
					rarity: item ? item.rarity : null,
					rarityLabel: item ? i18n.t('main.difficulty_' + item.rarity) : '',
					price: item ? (item.price ?? null) : null,
					total: d.total,
					equipped: d.equipped,
					farmer_count: d.farmer_count,
					average: d.farmer_count ? d.total / d.farmer_count : 0,
					coverage: data.total_farmers ? (d.farmer_count / data.total_farmers) * 100 : null,
					// Taux d'utilisation : éleveurs qui l'équipent sur un poireau (max 1 par
					// éleveur) / éleveurs qui le possèdent. null si personne ne le possède.
					usage: d.farmer_count ? (d.equipped_farmers / d.farmer_count) * 100 : null,
					bar: max ? Math.round((d.total / max) * 100) + '%' : '0%',
				}
			})
			loading.value = false
		}).error(() => {
			loading.value = false
		})
	}

	onMounted(() => {
		LeekWars.large = true
		load()
	})

	function num1(v: number): string {
		return v.toFixed(1)
	}
	function pct1(v: number | null): string {
		return v === null ? '—' : v.toFixed(1) + ' %'
	}
</script>

<style lang="scss" scoped>
#app.app .panel .content {
	padding: 12px;
}
.kpi-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: 8px;
}
.category-controls {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-wrap: wrap;
	.v-btn.active {
		background: rgba(33, 150, 243, 0.2);
		font-weight: bold;
	}
	.v-btn .v-icon { margin-right: 4px; }
	.count {
		margin-left: 5px;
		font-size: 11px;
		color: var(--text-color-secondary);
	}
}
.filter-input {
	margin-left: 8px;
	padding: 5px 10px;
	border: 1px solid var(--border);
	border-radius: 3px;
	font-size: 13px;
	background: var(--pure-white);
	color: var(--text-color);
	min-width: 200px;
}
.items-table {
	background: transparent;
	font-size: 13px;
	:deep(.v-table__wrapper) { overflow-x: auto; }
	:deep(.v-data-table__th) {
		color: var(--text-color-secondary) !important;
		font-size: 12px;
		font-weight: 600;
		white-space: nowrap;
	}
	:deep(.v-data-table__td) {
		font-variant-numeric: tabular-nums;
	}
	:deep(.v-data-table__td),
	:deep(.v-data-table__th) {
		padding: 0 7px !important;
	}
}
.label-cell {
	display: flex;
	align-items: center;
	gap: 10px;
	.item-thumb {
		width: 42px;
		height: 42px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--pure-white);
		border-radius: 4px;
		box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.18);
		padding: 3px;
		img {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
			&.weapon {
				transform: rotate(-40deg);
				width: 120%;
				height: 120%;
			}
		}
		.cat-icon { font-size: 22px; color: var(--text-color-secondary); }
			.scheme-thumb { width: 100%; height: auto; max-height: 100%; }
	}
}
.quantity {
	display: inline-flex;
	flex-direction: column;
	align-items: flex-end;
	span { line-height: 1.2; }
	.ibar { width: 54px; margin-top: 2px; }
}
.ibar {
	height: 5px;
	background: var(--background-disabled, #e0e0e0);
	border-radius: 3px;
	overflow: hidden;
	.fill {
		height: 100%;
		background: #2196f3;
		border-radius: 3px;
	}
}
.price {
	display: inline-flex;
	align-items: center;
	gap: 3px;
	white-space: nowrap;
}
.rarity-badge {
	display: inline-block;
	padding: 1px 8px;
	border-radius: 10px;
	font-size: 11px;
	font-weight: 600;
	color: white;
	white-space: nowrap;
}
.empty { text-align: center; color: var(--text-color-secondary); padding: 20px; }
</style>
