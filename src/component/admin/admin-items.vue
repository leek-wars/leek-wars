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
						<v-switch v-model="showUnowned" density="compact" hide-details inset color="primary" label="Possédés par personne" class="unowned-switch" />
						<div class="view-toggle">
							<v-btn size="small" variant="text" icon="mdi-format-list-bulleted" :class="{active: viewMode === 'list'}" @click="viewMode = 'list'" />
							<v-btn size="small" variant="text" icon="mdi-view-grid" :class="{active: viewMode === 'grid'}" @click="viewMode = 'grid'" />
						</div>
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
						v-else-if="viewMode === 'list'"
						:headers="headers"
						:items="filteredRows"
						:items-per-page="25"
						:items-per-page-options="itemsPerPageOptions"
						:sort-by="[{ key: 'total', order: 'desc' }]"
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
					<div v-else class="items-grid">
						<div v-for="item of gridRows" :key="item.template" class="item-card">
							<rich-tooltip-item v-if="item.tpl" :item="item.tpl" :inventory="true" :bottom="true" :instant="true">
								<div class="card-thumb">
									<scheme-image v-if="item.scheme" :scheme="item.scheme" class="scheme-thumb" />
									<img v-else-if="!imgErrors.has(item.template)" :src="itemImage(item.tpl)" :class="{ weapon: item.type === ItemType.WEAPON }" :alt="item.name" @error="imgErrors.add(item.template)">
									<v-icon v-else class="cat-icon">{{ item.icon }}</v-icon>
								</div>
							</rich-tooltip-item>
							<div v-else class="card-thumb"><v-icon class="cat-icon">{{ item.icon }}</v-icon></div>
							<div class="card-name">{{ item.name }}</div>
							<div class="card-meta">
								<span v-if="item.rarity !== null" class="rarity-badge" :class="'difficulty-' + item.rarity">{{ item.rarityLabel }}</span>
								<span class="card-cat">{{ item.categoryLabel }}<template v-if="item.level !== null"> · niv. {{ item.level }}</template></span>
							</div>
							<div class="card-count"><v-icon size="14">mdi-package-variant-closed</v-icon> {{ $filters.number(item.total) }}<span v-if="item.coverage !== null" class="card-cov"> · {{ pct1(item.coverage) }} él.</span></div>
						</div>
						<div v-if="!gridRows.length" class="empty">Aucun item</div>
					</div>
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
	const viewMode = ref<'list' | 'grid'>('list')
	// Afficher aussi les items possédés par personne (0 exemplaire en jeu, ex. items
	// neufs pas encore droppés). Masqués par défaut pour garder la vue distribution.
	const showUnowned = ref(false)
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

	// Base d'affichage : selon le switch, tout le catalogue ou seulement les items
	// réellement possédés (total > 0). KPI, compteurs et filtres en découlent.
	const baseRows = computed(() => showUnowned.value ? rows.value : rows.value.filter(r => r.total > 0))

	const totalItems = computed(() => baseRows.value.reduce((s, r) => s + r.total, 0))

	// Catégories présentes dans les données + « Tous » ; comptées pour l'affichage.
	const categoryOptions = computed(() => {
		const counts = new Map<number, number>()
		for (const r of baseRows.value) counts.set(r.type, (counts.get(r.type) || 0) + 1)
		const options = [{ type: ItemType.ALL, label: 'Tous', icon: 'mdi-all-inclusive', count: baseRows.value.length }]
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
		return baseRows.value.filter(r => {
			if (category.value !== ItemType.ALL && r.type !== category.value) return false
			if (q && !r.name.toLowerCase().includes(q)) return false
			return true
		})
	})

	function resetFilters() {
		category.value = ItemType.ALL
		search.value = ''
	}

	// Vue grille : mêmes filtres, triée par catégorie puis nom (catalogue visuel).
	const gridRows = computed(() => {
		return [...filteredRows.value].sort((a, b) => a.type - b.type || a.name.localeCompare(b.name))
	})

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

	// URL de l'image de l'item. Pour un schéma, on affiche l'image de l'item
	// résultat. En cas d'échec (@error), on retombe sur l'icône de catégorie via
	// imgErrors. ⚠️ Ressources et composants ne sont PAS préfixés par leur
	// catégorie : le nom complet EST le nom de fichier (gold_nugget.png). Les
	// autres (weapon_/chip_/potion_…) sont préfixés → on retire le préfixe.
	function itemImage(item: ItemTemplate): string {
		const target = item.type === ItemType.SCHEME ? (schemeResult(item) || item) : item
		const cat = ITEM_CATEGORY_NAME[target.type]
		const img = (target.type === ItemType.RESOURCE || target.type === ItemType.COMPONENT)
			? target.name
			: target.name.substring(target.name.indexOf('_') + 1)
		return '/image/' + cat + '/' + img + '.png'
	}

	// Construit une ligne à partir d'un template + ses compteurs de distribution
	// (d peut être à zéro pour un item sans exemplaire en jeu, ex. item neuf).
	function buildRow(template: number, item: ItemTemplate | undefined, d: DistributionRow, totalFarmers: number, max: number): ItemRow {
		const type = item ? item.type : ItemType.ALL
		return {
			template,
			tpl: item,
			scheme: item && item.type === ItemType.SCHEME ? (LeekWars.schemes[item.params] || null) : null,
			name: item ? itemName(item) : 'Item #' + template,
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
			coverage: totalFarmers ? (d.farmer_count / totalFarmers) * 100 : null,
			// Taux d'utilisation : éleveurs qui l'équipent sur un poireau (max 1 par
			// éleveur) / éleveurs qui le possèdent. null si personne ne le possède.
			usage: d.farmer_count ? (d.equipped_farmers / d.farmer_count) * 100 : null,
			bar: max ? Math.round((d.total / max) * 100) + '%' : '0%',
		}
	}

	function load() {
		loading.value = true
		LeekWars.get<{ distribution: DistributionRow[], total_farmers: number }>('item/distribution').then(data => {
			total_farmers.value = data.total_farmers
			const max = data.distribution.reduce((m, d) => Math.max(m, d.total), 0)
			const distByTemplate = new Map<number, DistributionRow>(data.distribution.map(d => [d.template, d]))
			// Catalogue COMPLET : tous les item_template connus du client, enrichis des
			// compteurs de distribution (0 exemplaire si aucun n'est en jeu, ex. items
			// neufs pas encore droppés). Sinon un item à 0 possesseur serait invisible.
			const result: ItemRow[] = []
			const seen = new Set<number>()
			for (const [key, item] of Object.entries(LeekWars.items)) {
				const template = Number(key)
				if (!item || seen.has(template)) continue
				seen.add(template)
				const d = distByTemplate.get(template) || { template, total: 0, equipped: 0, farmer_count: 0, equipped_farmers: 0 }
				result.push(buildRow(template, item as ItemTemplate, d, data.total_farmers, max))
			}
			// Items possédés absents du registre client (edge case) : les garder aussi.
			for (const d of data.distribution) {
				if (seen.has(d.template)) continue
				seen.add(d.template)
				result.push(buildRow(d.template, LeekWars.items[d.template] as ItemTemplate | undefined, d, data.total_farmers, max))
			}
			rows.value = result
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
.unowned-switch {
	flex: 0 0 auto;
	margin-left: 8px;
	:deep(.v-label) { font-size: 13px; opacity: 1; }
	:deep(.v-selection-control) { min-height: auto; }
}
.view-toggle {
	display: flex;
	margin-left: auto;
	.v-btn.active {
		background: rgba(33, 150, 243, 0.2);
		color: var(--primary);
	}
}
.items-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 10px;
	.item-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 5px;
		padding: 10px 8px;
		background: var(--background-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		.card-thumb {
			width: 96px;
			height: 96px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--pure-white);
			border-radius: 6px;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
			padding: 6px;
			cursor: pointer;
			img {
				max-width: 100%;
				max-height: 100%;
				object-fit: contain;
				&.weapon { transform: rotate(-40deg); width: 118%; height: 118%; }
			}
			.cat-icon { font-size: 44px; color: var(--text-color-secondary); }
			.scheme-thumb { width: 100%; height: auto; max-height: 100%; }
		}
		.card-name {
			font-weight: 600;
			font-size: 13px;
			line-height: 1.2;
		}
		.card-meta {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			align-items: center;
			gap: 5px;
		}
		.card-cat {
			font-size: 11px;
			color: var(--text-color-secondary);
		}
		.card-count {
			font-size: 12px;
			color: var(--text-color);
			font-variant-numeric: tabular-nums;
			display: inline-flex;
			align-items: center;
			gap: 3px;
			.card-cov { color: var(--text-color-secondary); }
		}
	}
}
</style>
