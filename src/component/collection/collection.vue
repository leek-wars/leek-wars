<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('main.collection') }}</h1>
			<page-tabs active="collection" />
		</div>
		<panel class="collection-panel">
			<template #content>
				<div class="collection-content">
					<loader v-if="!$store.state.farmer" />
					<template v-else>
						<div class="collection-summary">
							<div class="summary-head">
								<span class="summary-title">{{ $t('main.collection') }}</span>
								<span class="summary-count">{{ total_owned }} / {{ total_count }}</span>
								<span class="summary-percent">{{ percent(total_owned, total_count) }}%</span>
							</div>
							<div class="summary-progress">
								<div class="summary-bar" :class="{ complete: total_owned === total_count }" :style="{ width: percent(total_owned, total_count) + '%' }"></div>
							</div>
						</div>
						<div class="category-tabs">
							<div v-for="c in categoryStats" :key="c.type" class="cat-tab" :class="{ active: filter === c.type }" @click="filter = c.type">
								<transition name="celebrate">
									<div v-if="celebratingNow.has(c.type)" class="cat-celebrate">
										<span class="celebrate-text">{{ t('completed') }}</span>
									</div>
								</transition>
								<div class="cat-tab-head">
									<v-icon>{{ ITEM_TYPE_ICONS[c.type] }}</v-icon>
									<span class="cat-name">{{ $t('main.' + ITEM_TYPE_NAME[c.type]) }}</span>
								</div>
								<div class="cat-stats">
									<span class="cat-count">{{ c.owned }} / {{ c.total }}</span>
									<span class="cat-percent">{{ percent(c.owned, c.total) }}%</span>
								</div>
								<div class="cat-progress">
									<div class="cat-bar" :class="{ complete: c.owned === c.total }" :style="{ width: percent(c.owned, c.total) + '%' }"></div>
								</div>
							</div>
						</div>
						<div class="grid">
						<div v-for="item in currentCategory" :key="item.id" class="cell" :class="['rarity-border-' + item.rarity, { locked: !owned.has(item.id) }]" @mouseenter="owned.has(item.id) && showTooltip(item, $event)" @mouseleave="scheduleHideTooltip()">
							<div class="item" :type="item.type">
								<scheme-image v-if="item.type === ItemType.SCHEME" class="image" :scheme="LeekWars.schemes[item.params]" />
								<img v-else class="image" :class="{ small: SMALL_IMAGES.has(item.id) }" :src="imageUrl(item)" loading="lazy">
							</div>
						</div>
					</div>

					<v-menu v-model="tooltipVisible" :activator="tooltipActivator" :close-on-content-click="false" :min-width="280" :open-delay="0" :close-delay="0" :bottom="true" offset-y :open-on-hover="false">
						<div class="collection-tooltip" @mouseenter="onTooltipEnter" @mouseleave="onTooltipLeave">
							<item-preview v-if="tooltipItem" :item="tooltipItem" :inventory="false" />
						</div>
					</v-menu>
					</template>
				</div>
			</template>
		</panel>
	</div>
</template>

<script lang="ts" setup>
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { type ItemTemplate, ItemType, ITEM_TYPE_ICONS, ITEM_TYPE_NAME, ITEM_CATEGORY_NAME } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { computed, onMounted, ref, watch } from 'vue'
	import ItemPreview from '@/component/market/item-preview.vue'
	import SchemeImage from '../market/scheme-image.vue'
	import PageTabs from '@/component/app/page-tabs.vue'

	defineOptions({ name: 'Collection', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('collection')

	// Catégories collectionnables, dans l'ordre d'affichage.
	const CATEGORY_ORDER = [ItemType.WEAPON, ItemType.CHIP, ItemType.HAT, ItemType.POMP, ItemType.POTION, ItemType.RESOURCE, ItemType.COMPONENT, ItemType.SCHEME]
	// Items dont l'image est rendue plus petite (cohérence avec l'inventaire).
	const SMALL_IMAGES = new Set([37, 45, 153, 182])
	// Items non collectionnables exclus manuellement :
	// 148 hab, 149 crystal (monnaies), 176 potion de force (item unique poisson
	// d'avril), 58 potion de restat admin (non obtenable par le joueur).
	const EXCLUDED_ITEMS = new Set([148, 149, 176, 58])

	// Une catégorie est sélectionnée en permanence (plus d'onglet « Tout »).
	const storedFilter = parseInt(localStorage.getItem('collection/filter') || '', 10) as ItemType
	const filter = ref<ItemType>(CATEGORY_ORDER.includes(storedFilter) ? storedFilter : CATEGORY_ORDER[0])

	watch(filter, () => localStorage.setItem('collection/filter', '' + filter.value))

	// Templates déjà possédés un jour (serveur, table farmer_item_collection) :
	// inclut les items équipés ET ceux vendus/consommés depuis. Absent du store local.
	const serverOwned = ref<Set<number>>(new Set())

	// Catégories dont l'animation dorée « Terminé » a déjà été montrée (serveur).
	const celebratedCategories = ref<Set<number>>(new Set())
	// True une fois la liste "celebrated" chargée : évite d'animer avant de savoir.
	const celebrationsLoaded = ref(false)
	// Catégories qui jouent l'animation en ce moment (retirées à la fin).
	const celebratingNow = ref<Set<number>>(new Set())

	// Templates débloqués (jamais "re-verrouillés") : déjà-possédé serveur
	// ∪ inventaire local courant (immédiat, sans attendre un rechargement).
	const owned = computed(() => {
		const set = new Set<number>(serverOwned.value)
		const farmer = store.state.farmer
		if (farmer) {
			for (const list of [farmer.weapons, farmer.chips, farmer.potions, farmer.hats, farmer.pomps, farmer.resources, farmer.components, farmer.schemes]) {
				for (const item of list) set.add(item.template)
			}
		}
		return set
	})

	// Une arme ou puce non achetable, non vendable et hors marché n'est pas
	// obtenable par le joueur (armes/puces de boss et capacités spéciales de
	// combat) : on les retire pour garder une collection complétable à 100%.
	function isCollectable(item: ItemTemplate): boolean {
		if (item.public === false) return false
		if (EXCLUDED_ITEMS.has(item.id)) return false
		if ((item.type === ItemType.WEAPON || item.type === ItemType.CHIP) && !item.buyable && !item.buyable_crystals && !item.sellable && !item.market) return false
		return true
	}

	// Tous les items du jeu groupés par catégorie.
	const allByType = computed(() => {
		const map = new Map<ItemType, ItemTemplate[]>()
		for (const type of CATEGORY_ORDER) map.set(type, [])
		for (const item of Object.values(LeekWars.items) as ItemTemplate[]) {
			if (!isCollectable(item)) continue
			const list = map.get(item.type)
			if (list) list.push(item)
		}
		for (const list of map.values()) list.sort((a, b) => a.level - b.level || a.id - b.id)
		return map
	})

	function percent(owned: number, total: number): number {
		return total ? Math.floor(owned / total * 100) : 0
	}

	// Stats par catégorie pour les onglets (indépendant de l'onglet sélectionné).
	const categoryStats = computed(() => CATEGORY_ORDER
		.map((type) => {
			const items = allByType.value.get(type) ?? []
			const ownedCount = items.reduce((sum, item) => sum + (owned.value.has(item.id) ? 1 : 0), 0)
			return { type, total: items.length, owned: ownedCount }
		})
		.filter((c) => c.total > 0))

	// Célébration « Terminé » : quand une catégorie vient d'être complétée et n'a
	// jamais été célébrée, on joue une fois l'animation dorée puis on l'enregistre
	// côté serveur (ne rejoue plus, même sur un autre appareil). Décalé dans le
	// temps si plusieurs catégories sont complétées d'un coup (arrivée initiale).
	function checkCelebrations() {
		if (!celebrationsLoaded.value) return
		let delay = 0
		for (const c of categoryStats.value) {
			if (c.total === 0 || c.owned !== c.total) continue
			if (celebratedCategories.value.has(c.type)) continue
			celebratedCategories.value.add(c.type) // garde anti-rejeu immédiat
			const type = c.type
			window.setTimeout(() => {
				celebratingNow.value = new Set(celebratingNow.value).add(type)
				window.setTimeout(() => {
					const s = new Set(celebratingNow.value)
					s.delete(type)
					celebratingNow.value = s
				}, 2600)
			}, delay)
			delay += 600
			LeekWars.post('item/celebrate-category', { category: type })
		}
	}
	watch([categoryStats, celebrationsLoaded], checkCelebrations)

	// Catégorie affichée (une seule à la fois, selon l'onglet sélectionné).
	const currentCategory = computed(() => allByType.value.get(filter.value) ?? [])

	// Totaux dérivés des stats par catégorie (un seul comptage, pas de re-parcours).
	const total_count = computed(() => categoryStats.value.reduce((sum, c) => sum + c.total, 0))
	const total_owned = computed(() => categoryStats.value.reduce((sum, c) => sum + c.owned, 0))

	function imageUrl(item: ItemTemplate): string {
		if (item.type === ItemType.RESOURCE) return '/image/resource/' + item.name + '.png'
		if (item.type === ItemType.COMPONENT) return '/image/component/' + item.name + '.png'
		// Retire le préfixe de catégorie (ex: "fight-pack_fight_pack_50" -> "fight_pack_50").
		const category = ITEM_CATEGORY_NAME[item.type]
		const image = item.name.replace(category + '_', '')
		return '/image/' + category + '/' + image + '.png'
	}

	// Tooltip partagé (même mécanique que l'inventaire).
	const tooltipVisible = ref(false)
	const tooltipItem = ref<ItemTemplate | null>(null)
	const tooltipActivator = ref<HTMLElement | undefined>(undefined)
	let tooltipShowTimer = 0
	let tooltipHideTimer = 0
	let tooltipOnTooltip = false

	function showTooltip(item: ItemTemplate, event: MouseEvent) {
		clearTimeout(tooltipHideTimer)
		const target = event.currentTarget as HTMLElement
		if (tooltipVisible.value) {
			tooltipActivator.value = target
			tooltipItem.value = item
		} else {
			clearTimeout(tooltipShowTimer)
			tooltipShowTimer = window.setTimeout(() => {
				tooltipActivator.value = target
				tooltipItem.value = item
				tooltipVisible.value = true
			}, 400)
		}
	}

	function scheduleHideTooltip() {
		clearTimeout(tooltipShowTimer)
		tooltipHideTimer = window.setTimeout(() => {
			if (!tooltipOnTooltip) tooltipVisible.value = false
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

	onMounted(() => {
		LeekWars.setTitle(t('main.collection') as string)
		// Templates déjà possédés un jour (équipés et items vendus/consommés inclus) :
		// source de vérité côté serveur (table farmer_item_collection).
		LeekWars.get<{ templates: number[], celebrated: number[] }>('item/get-collection').then((res) => {
			serverOwned.value = new Set(res.templates)
			celebratedCategories.value = new Set(res.celebrated ?? [])
			celebrationsLoaded.value = true
		}).error(() => { /* repli : inventaire local du store uniquement */ })
	})
</script>

<style lang="scss" scoped>
.collection-content {
	:deep(.loader) {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 0;
	}
}
.collection-summary {
	padding: 18px 16px 16px;
	border-bottom: 1px solid var(--border);
	.summary-head {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 12px;
		.summary-title {
			font-size: 22px;
			font-weight: 600;
		}
		.summary-count {
			color: var(--text-color-secondary);
			font-size: 18px;
		}
		.summary-percent {
			margin-left: auto;
			font-size: 26px;
			font-weight: 700;
			color: #5fad1b;
		}
	}
	.summary-progress {
		height: 18px;
		background: var(--background-disabled);
		border-radius: 9px;
		overflow: hidden;
		.summary-bar {
			height: 100%;
			background-color: #5fad1b;
			background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.22) 0, rgba(255, 255, 255, 0.22) 9px, transparent 9px, transparent 18px);
			border-radius: 9px;
			transition: width 0.4s;
			&.complete {
				background-color: #2196f3;
			}
		}
	}
}
#app.app .collection-summary {
	padding: 12px;
	.summary-head {
		gap: 8px;
		margin-bottom: 10px;
		.summary-title { font-size: 18px; }
		.summary-count { font-size: 15px; }
		.summary-percent { font-size: 22px; }
	}
	.summary-progress { height: 14px; }
}
.category-tabs {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 10px;
	padding: 12px;
	position: sticky;
	top: 0;
	z-index: 1;
	background: var(--background);
	border-bottom: 1px solid var(--border);
}
.cat-tab {
	position: relative;
	overflow: hidden;
	min-width: 0;
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 18px 20px 20px;
	cursor: pointer;
	background: var(--background-secondary);
	transition: border-color 0.15s, background 0.15s;
	&:hover {
		background: var(--background-header);
	}
	&.active {
		border-color: #5fad1b;
		background: var(--pure-white);
	}
	.cat-tab-head {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		font-size: 19px;
		font-weight: 500;
		margin-bottom: 10px;
		.v-icon {
			font-size: 30px;
			flex-shrink: 0;
		}
		.cat-name {
			min-width: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
	.cat-stats {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 10px;
		font-size: 16px;
		color: var(--text-color-secondary);
		.cat-percent {
			font-weight: 500;
			color: var(--text-color);
		}
	}
	.cat-progress {
		height: 13px;
		background: var(--background-disabled);
		border-radius: 7px;
		overflow: hidden;
		.cat-bar {
			height: 100%;
			background-color: #5fad1b;
			background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.22) 0, rgba(255, 255, 255, 0.22) 7px, transparent 7px, transparent 14px);
			border-radius: 7px;
			transition: width 0.3s;
			&.complete {
				background-color: #2196f3;
			}
		}
	}
}
#app.app .category-tabs {
	grid-template-columns: repeat(2, 1fr);
	gap: 8px;
	padding: 8px;
}
#app.app .cat-tab {
	padding: 12px 14px 14px;
	.cat-tab-head {
		font-size: 15px;
		gap: 8px;
		margin-bottom: 10px;
		.v-icon { font-size: 24px; }
		.cat-count { font-size: 14px; }
	}
	.cat-progress { height: 11px; }
}
// Animation dorée « Terminé » quand une catégorie vient d'être complétée.
.cat-celebrate {
	position: absolute;
	inset: 0;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	background: radial-gradient(ellipse at center, rgba(255, 200, 40, 0.38), rgba(255, 200, 40, 0) 72%);
	.celebrate-text {
		font-size: 20px;
		font-weight: 800;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		background: linear-gradient(100deg, #b8860b 0%, #ffd700 25%, #fff6c0 50%, #ffd700 75%, #b8860b 100%);
		background-size: 220% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
		filter: drop-shadow(0 1px 5px rgba(255, 190, 30, 0.55));
		animation: celebrate-pop 0.5s cubic-bezier(0.2, 1.4, 0.4, 1) both, celebrate-shine 2.4s linear;
	}
}
@keyframes celebrate-pop {
	0% { transform: scale(0.4) rotate(-8deg); opacity: 0; }
	60% { transform: scale(1.15) rotate(2deg); }
	100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes celebrate-shine {
	0% { background-position: 120% 0; }
	100% { background-position: -120% 0; }
}
.celebrate-enter-active { transition: opacity 0.3s; }
.celebrate-leave-active { transition: opacity 0.6s; }
.celebrate-enter-from, .celebrate-leave-to { opacity: 0; }
#app.app .cat-celebrate .celebrate-text {
	font-size: 15px;
}
.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
	gap: 6px;
	margin: 0 6px 12px;
}
#app.app .grid {
	grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
}
.cell {
	border: 1px solid var(--border);
	cursor: pointer;
	&:not(.locked):hover {
		background: var(--pure-white);
	}
	&.locked {
		cursor: default;
		.image {
			filter: brightness(0);
			opacity: 0.1;
		}
	}
}
body.dark .cell.locked .image {
	opacity: 0.4;
}
.item {
	padding: 5%;
	position: relative;
	height: 80px;
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
}
#app.app .item {
	height: 62px;
}
.collection-tooltip {
	width: 280px;
}
</style>
