<template>
	<div class="collection-widget">
		<loader v-if="!loaded" />
		<template v-else>
			<div class="overall">
				<div class="overall-head">
					<span class="count">{{ totalOwned }} / {{ totalCount }}</span>
					<span class="pct">{{ percent(totalOwned, totalCount) }}%</span>
				</div>
				<!-- Le vocabulaire des barres de la page Trophées (`.global-bar > .bar`,
				     `.blue` = complète) : la coquille v3 y pose cadre, aplat, or et
				     rayures ; ici la barre n'en avait aucun (Pierre, 2026-09-09). -->
				<div class="global-bar"><div class="bar" :class="{ blue: totalOwned === totalCount && totalCount > 0 }" :style="{ width: percent(totalOwned, totalCount) + '%' }"></div></div>
			</div>
			<div ref="catsEl" class="cats">
				<!-- Une vraie grille qui remplit le widget : autant de colonnes et de
				     rangées que la place le permet, cellules étirées, filets entre
				     elles. Le nom de la catégorie n'apparaît que si la cellule a la
				     hauteur pour lui (retour de Pierre, 2026-09-07). -->
				<div class="cats-grid" :style="{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)`, gridTemplateRows: `repeat(${layout.rows}, 1fr)` }">
					<div v-for="c in visibleStats" :key="c.type" class="cat" :class="{ complete: c.owned === c.total }">
						<div class="gauge">
							<svg class="gauge-svg" viewBox="0 0 48 48" shape-rendering="crispEdges" aria-hidden="true">
								<path class="track" :d="GAUGE_PATH" />
								<path class="fill" :d="GAUGE_PATH" :stroke-dasharray="dash(c.owned, c.total)" />
							</svg>
							<v-icon class="cat-icon">{{ icons[c.type] }}</v-icon>
						</div>
						<span v-if="layout.names" class="cat-name">{{ $t('main.' + ITEM_TYPE_NAME[c.type]) }}</span>
						<span class="cat-count">{{ c.owned }}/{{ c.total }}</span>
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, onBeforeUnmount, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { type ItemTemplate, ItemType, ITEM_TYPE_ICONS, ITEM_TYPE_NAME } from '@/model/item'

	defineOptions({ name: 'HomeWidgetCollection' })

	// Charge utile de la requête groupée de l'accueil (cf. home.vue) : `undefined`
	// tant qu'elle est en vol, `null` si ce widget n'en a rien tiré.
	const props = defineProps<{ data?: { templates: number[], celebrated: number[] } | null }>()

	const icons = ITEM_TYPE_ICONS

	// Mêmes règles que la page Collection : catégories complétables et items obtenables.
	const CATEGORY_ORDER = [ItemType.WEAPON, ItemType.CHIP, ItemType.HAT, ItemType.POMP, ItemType.POTION, ItemType.RESOURCE, ItemType.COMPONENT, ItemType.SCHEME]
	const EXCLUDED_ITEMS = new Set([148, 149, 176, 58])

	function isCollectable(item: ItemTemplate): boolean {
		if (item.public === false) return false
		if (EXCLUDED_ITEMS.has(item.id)) return false
		if ((item.type === ItemType.WEAPON || item.type === ItemType.CHIP) && !item.buyable && !item.buyable_crystals && !item.sellable && !item.market) return false
		return true
	}

	const loaded = ref(false)
	const owned = ref<Set<number>>(new Set())

	const allByType = computed(() => {
		const map = new Map<ItemType, ItemTemplate[]>()
		for (const type of CATEGORY_ORDER) map.set(type, [])
		for (const item of Object.values(LeekWars.items) as ItemTemplate[]) {
			if (!isCollectable(item)) continue
			map.get(item.type)?.push(item)
		}
		return map
	})

	const stats = computed(() => CATEGORY_ORDER
		.map((type) => {
			const items = allByType.value.get(type) ?? []
			const ownedCount = items.reduce((sum, item) => sum + (owned.value.has(item.id) ? 1 : 0), 0)
			return { type, total: items.length, owned: ownedCount }
		})
		.filter((c) => c.total > 0))

	const totalCount = computed(() => stats.value.reduce((s, c) => s + c.total, 0))
	const totalOwned = computed(() => stats.value.reduce((s, c) => s + c.owned, 0))

	// Grille calculée d'après la place : on ne mesure pas les cellules (elles
	// s'étirent, leur taille dépendrait du compte, qui dépend de la mesure) mais
	// le conteneur, et on en déduit combien de colonnes et de rangées y tiennent
	// au-dessus d'un minimum par cellule. Toutes les catégories tiennent : on
	// prend le moins de rangées possible puis on équilibre les colonnes (8
	// catégories sur 6 colonnes possibles = 4 × 2, pas 6 + 2). Sinon on montre
	// ce qui tient, jamais une cellule coupée.
	const catsEl = ref<HTMLElement | null>(null)
	const catsSize = ref({ w: 0, h: 0 })
	const GRID_GAP = 1
	const MIN_CELL_W = 76
	const MIN_CELL_H = 76
	// En dessous, le nom ferait déborder la cellule ou se couperait.
	const NAME_CELL_W = 88
	const NAME_CELL_H = 104
	let resizeObserver: ResizeObserver | null = null

	watch(catsEl, (el) => {
		if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
		if (!el) return
		resizeObserver = new ResizeObserver(() => {
			catsSize.value = { w: el.clientWidth, h: el.clientHeight }
		})
		resizeObserver.observe(el)
		catsSize.value = { w: el.clientWidth, h: el.clientHeight }
	}, { immediate: true })
	onBeforeUnmount(() => { if (resizeObserver) resizeObserver.disconnect() })

	const layout = computed(() => {
		const n = stats.value.length
		const { w, h } = catsSize.value
		if (!n || w <= 0 || h <= 0) return { cols: Math.max(1, n), rows: 1, count: n, names: false }
		const maxCols = Math.max(1, Math.floor((w + GRID_GAP) / (MIN_CELL_W + GRID_GAP)))
		const maxRows = Math.max(1, Math.floor((h + GRID_GAP) / (MIN_CELL_H + GRID_GAP)))
		let cols: number, rows: number, count = n
		if (maxCols * maxRows >= n) {
			rows = Math.ceil(n / maxCols)
			cols = Math.ceil(n / rows)
		} else {
			rows = maxRows
			cols = maxCols
			count = rows * cols
		}
		const cellW = (w - GRID_GAP * (cols - 1)) / cols
		const cellH = (h - GRID_GAP * (rows - 1)) / rows
		return { cols, rows, count, names: cellW >= NAME_CELL_W && cellH >= NAME_CELL_H }
	})
	const visibleStats = computed(() => stats.value.slice(0, layout.value.count))

	function percent(o: number, t: number): number {
		return t ? Math.floor(o / t * 100) : 0
	}

	// Jauge carrée (principe « pas d'arrondis ») : le contour du carré part du
	// milieu du côté haut et se remplit dans le sens horaire, comme le faisait
	// l'anneau. Périmètre du tracé, en unités du viewBox : 22 + 44 × 3 + 22.
	const GAUGE_PATH = 'M24 2 H46 V46 H2 V2 Z'
	const GAUGE_LENGTH = 176

	function dash(o: number, t: number): string {
		return `${percent(o, t) / 100 * GAUGE_LENGTH} ${GAUGE_LENGTH}`
	}

	// Dernier recours : l'inventaire du store, qui ne dit que ce qu'on possède
	// ENCORE. Il couvre les huit catégories comptées ci-dessus — sans les
	// ressources, les composants et les schémas, la barre tombait de plusieurs
	// dizaines de points au moindre incident réseau.
	function fallbackToStore() {
		const f = store.state.farmer
		if (f) {
			const set = new Set<number>()
			for (const list of [f.weapons, f.chips, f.hats, f.pomps, f.potions, f.resources, f.components, f.schemes]) {
				for (const it of (list ?? [])) set.add((it as { template: number }).template)
			}
			owned.value = set
		}
		loaded.value = true
	}

	// Source de vérité serveur (items possédés un jour), avec repli sur l'inventaire local.
	function load() {
		LeekWars.get<{ templates: number[] }>('item/get-collection').then((res) => {
			owned.value = new Set(res.templates)
			loaded.value = true
		}).error(fallbackToStore)
	}

	watch(() => props.data, (data) => {
		if (data === undefined) return
		if (data === null) { load(); return }
		owned.value = new Set(data.templates)
		loaded.value = true
	}, { immediate: true })
</script>

<style lang="scss" scoped>
	.collection-widget {
		display: flex;
		flex-direction: column;
		// La barre et la grille sont deux objets : 12 px les collaient (retour de
		// Pierre), 20 les sépare.
		gap: 20px;
		height: 100%;
	}
	// Les catégories occupent la hauteur restante ; la grille calcule ce qui y
	// tient, overflow hidden en filet.
	.cats {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	.overall-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 4px;
	}
	.overall-head .count {
		font-size: 20px;
		font-weight: bold;
	}
	.overall-head .pct {
		color: var(--primary);
		font-weight: bold;
	}
	.global-bar {
		background: var(--background-secondary);
		border-radius: var(--radius);
		height: 10px;
		overflow: hidden;
	}
	.global-bar > .bar {
		height: 100%;
		// `relative` : les rayures du v3 sont un `::after` posé en absolu.
		position: relative;
		background: var(--primary-surface);
		transition: width 0.3s;
	}
	.global-bar > .bar.blue {
		background: var(--rank-first);
	}
	// Les filets entre les cellules sont le fond qui passe dans les gouttières
	// d'1 px (même recette que la bande de chiffres du Potager rapide).
	.cats-grid {
		display: grid;
		height: 100%;
		gap: 1px;
		background: var(--border);
		border: 1px solid var(--border);
	}
	.cat {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-width: 0;
		min-height: 0;
		padding: 6px 4px;
		background: var(--panel-background);
	}
	.cat-name {
		max-width: 100%;
		font-size: 12px;
		color: var(--text-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.gauge {
		position: relative;
		width: 54px;
		height: 54px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	// Jauge de progression : primaire en cours, dorée une fois complétée.
	.gauge-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		fill: none;
		stroke-width: 4;
	}
	// `--background-secondary` est la surface même du panneau en thème sombre :
	// le fond de la jauge s'y perdrait, on prend le trait fort.
	.gauge-svg .track {
		stroke: var(--border-strong);
	}
	.gauge-svg .fill {
		stroke: var(--primary);
		transition: stroke-dasharray 0.3s;
	}
	.cat.complete .gauge-svg .fill {
		stroke: var(--rank-first);
	}
	.cat-icon {
		color: var(--text-color-secondary);
		font-size: 22px;
	}
	.cat.complete .cat-icon {
		color: var(--rank-first);
	}
	.cat-count {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	// Panel bas : jauges réduites, on diminue au lieu de tronquer.
	@container (max-height: 260px) {
		.gauge {
			width: 44px;
			height: 44px;
		}
		.cat-icon {
			font-size: 18px;
		}
		.cat-count {
			font-size: 11px;
		}
	}
</style>
