<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="page-title">
				<v-icon class="page-icon">mdi-treasure-chest</v-icon>
				<div class="page-title-text">
					<h1>{{ $t('main.inventory') }}</h1>
				</div>
			</div>
			<page-tabs active="inventory" />
		</div>
		<div class="column" :class="{columns}">
			<!-- Cran plein de l'atelier : l'inventaire s'efface tout a fait. A hauteur nulle
			     son en-tete debordait encore de quelques pixels (#622). -->
			<inventory v-show="!workshopFull" :layout="layout" @update:layout="layout = $event" />
			<div class="resizer" :class="{vertical: columnsLayout}" @mousedown="resizerMousedown"><v-icon>{{ columnsLayout ? 'mdi-drag-vertical-variant' : 'mdi-drag-horizontal-variant' }}</v-icon></div>
			<panel ref="bottomPanel" class="bottom-panel" :class="{ expanded: bottomExpanded }" toggle="inventory/workshop" :toggle-invert="true" :states="LeekWars.mobile ? 3 : 2" :style="bottomPanelStyle" @update:expanded="bottomExpanded = $event" @update:state="panelState = $event">
				<template #title>
					<div class="workshop-tabs">
						<div v-for="t in TABS" :key="t.mode" v-ripple class="workshop-tab" :class="{active: tab === t.mode}" @click.stop="tab = t.mode">
							<v-icon>{{ t.icon }}</v-icon>
							<span>{{ $t('main.' + t.label) }}<template v-if="t.mode === 'craft'"> ({{ schemes.length }})</template></span>
						</div>
					</div>
				</template>
				<template #actions>
					<v-menu v-if="tab === 'craft'" offset-y>
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
					<v-menu v-if="tab === 'craft'" offset-y>
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
					<div ref="bottomContent" class="bottom-content" :class="{vertical: columns}">
						<!-- .forge-row est en `display: contents` en trois colonnes (il
						     n'existe pas pour la mise en page) et devient une rangee en mode
						     vertical : l'item et ses stats cote a cote quand la largeur le
						     permet, les stats retombent dessous sinon (flex-wrap). -->
						<div class="forge-row">
							<div class="forge-wrapper">
								<forge></forge>
							</div>
							<!-- Colonne des stats a jour de la piece en cours, entre la forge et la
							     palette/historique (3 colonnes). Presente dans les TROIS onglets, et
							     meme sans piece : sinon la forge se decale d'un onglet a l'autre (#622). -->
							<forge-stats />
						</div>
						<!-- Ameliorer : la palette et l'historique ne partagent plus le meme
					     defilement (demande de Pierre), la section laisse donc l'historique
					     defiler pour lui-meme. -->
					<div class="schemes-section" :class="{ 'alter-split': tab === 'alter' }">
							<!-- Fabriquer : le catalogue de schemas, puis l'historique des crafts. -->
							<template v-if="tab === 'craft'">
								<loader v-if="!$store.state.farmer" />
								<div v-else class="schemes-list">
									<scheme v-for="(scheme, s) in schemes" :key="s" class="scheme" :scheme="scheme" :show-result="true" :show-price="false" :shared-tooltip="true" @show-tooltip="showTooltip" @hide-tooltip="scheduleHideTooltip"></scheme>
								</div>
							</template>
							<!-- Ameliorer : la palette des alterations, puis l'historique des tentatives. -->
							<div v-else-if="tab === 'alter'" class="alter-pane">
								<alteration-palette />
								<item-history :action="2" />
							</div>
							<!-- Detruire : l'historique des destructions. -->
							<item-history v-else :action="3" />
							<v-menu v-model="tooltipVisible" :activator="tooltipActivator" :close-on-content-click="false" :min-width="280" :open-delay="0" :close-delay="0" :bottom="true" offset-y :open-on-hover="false">
								<div class="scheme-tooltip" @mouseenter="onTooltipEnter" @mouseleave="onTooltipLeave">
									<item-preview v-if="tooltipItem" :item="tooltipItem" :quantity="tooltipQuantity" :inventory="true" :show-use="true" :craft-cost="tooltipCraftCost" />
								</div>
							</v-menu>
						</div>
					</div>
				</template>
			</panel>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { mixins } from '@/model/i18n'
	import { ItemTemplate, ItemType, ITEM_TYPE_ICONS, ITEM_TYPE_NAME } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import Inventory from '@/component/inventory/inventory.vue'
	import Scheme from '../market/scheme.vue'
	import ItemPreview from '@/component/market/item-preview.vue'
	import Forge from '../forge/forge.vue'
	import ForgeStats from '../forge/forge-stats.vue'
	import AlterationPalette from '../forge/alteration-palette.vue'
	import ItemHistory from '@/component/inventory/item-history.vue'
	import PageTabs from '@/component/app/page-tabs.vue'
	import { store } from '@/model/store'
	import { useRoute, useRouter } from 'vue-router'
	import type { InventoryItem } from '@/model/farmer'
	import { emitter } from '@/model/emitter'
	import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

	enum Sort {
		PRICE, LEVEL, RARITY, INGREDIENT_COUNT
	}

	defineOptions({ name: 'InventoryPage', i18n: {}, mixins: [...mixins] })

	// Onglet actif de l'atelier : fabriquer, ameliorer, detruire (#622).
	const TABS = [
		{ mode: 'craft', icon: 'mdi-map-outline', label: 'craft_tab' },
		{ mode: 'alter', icon: 'mdi-flask', label: 'improve_tab' },
		{ mode: 'destroy', icon: 'mdi-recycle', label: 'destroy_tab' },
	] as const
	type WorkshopMode = typeof TABS[number]['mode']
	const tab = ref<WorkshopMode>((localStorage.getItem('workshop/tab') as WorkshopMode) || 'craft')
	watch(tab, m => {
		localStorage.setItem('workshop/tab', m)
		// La forge doit refleter l'onglet : on la vide en changeant de contexte.
		emitter.emit('workshop-mode', m)
	})

	// Disposition de la page : l'atelier SOUS l'inventaire (defaut) ou A COTE, en deux
	// colonnes. Le reglage se fait depuis le menu des options de l'inventaire. Sur
	// mobile la colonne est trop etroite pour couper en deux : le mode est ignore.
	const layout = ref<'rows' | 'columns'>(localStorage.getItem('inventory/layout') === 'columns' ? 'columns' : 'rows')
	watch(layout, l => {
		localStorage.setItem('inventory/layout', l)
		// La grille de l'inventaire calcule ses colonnes a partir de la largeur de son
		// conteneur, qui vient de changer sans que la fenetre bouge : sans ce signal
		// elle garde la grille de l'autre disposition jusqu'au prochain redimensionnement.
		nextTick(() => emitter.emit('resize'))
	})
	const columnsLayout = computed(() => layout.value === 'columns' && !LeekWars.mobile)

	const bottomHeight = ref(Math.max(300, parseInt(localStorage.getItem('inventory/bottom-height') || '350', 10)))
	const bottomWidth = ref(Math.max(400, parseInt(localStorage.getItem('inventory/bottom-width') || '700', 10)))
	// Cran d'ouverture de l'atelier. Sur mobile le bouton boucle sur trois crans
	// (replie, mi-hauteur, plein) faute de place pour un redimensionneur ; sur desktop il
	// reste binaire et c'est la poignee qui regle la hauteur (#622).
	const storedPanel = localStorage.getItem('inventory/workshop')
	const panelState = ref(storedPanel === null || storedPanel === 'true' ? 2
		: storedPanel === 'false' ? 0
		: Math.max(0, Math.min(2, parseInt(storedPanel, 10) || 0)))
	const bottomExpanded = ref(panelState.value > 0)
	// Replie, l'atelier se resume a son en-tete : il reprend toute la largeur en bas
	// plutot que de garder sa colonne, ou il ne resterait qu'une bande vide.
	const columns = computed(() => columnsLayout.value && bottomExpanded.value)
	const sort = ref<Sort>(Math.min(parseInt(localStorage.getItem('workshop/sort') || '0', 10), Sort.INGREDIENT_COUNT) as Sort)
	const filter = ref<number>(parseInt(localStorage.getItem('workshop/filter') || '0', 10))
	const craftableOnly = ref(localStorage.getItem('workshop/craftable') === 'true')

	const tooltipVisible = ref(false)
	const tooltipItem = ref<ItemTemplate | null>(null)
	const tooltipQuantity = ref(0)
	const tooltipCraftCost = ref(0)
	const tooltipActivator = ref<HTMLElement | undefined>(undefined)
	let tooltipShowTimer: number = 0
	let tooltipHideTimer: number = 0
	let tooltipOnTooltip: boolean = false

	const bottomPanel = ref<{ expanded: boolean, state: number } | null>(null)
	const bottomContent = ref<HTMLElement | null>(null)

	function showTooltip(data: { item: ItemTemplate, quantity: number, craftCost?: number, event: MouseEvent }) {
		clearTimeout(tooltipHideTimer)
		const target = data.event.currentTarget as HTMLElement
		if (tooltipVisible.value) {
			tooltipActivator.value = target
			tooltipItem.value = data.item
			tooltipQuantity.value = data.quantity
			tooltipCraftCost.value = data.craftCost || 0
		} else {
			clearTimeout(tooltipShowTimer)
			tooltipShowTimer = window.setTimeout(() => {
				tooltipActivator.value = target
				tooltipItem.value = data.item
				tooltipQuantity.value = data.quantity
				tooltipCraftCost.value = data.craftCost || 0
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

	interface SchemeData { id: number; result: number; items: ([number, number] | null)[]; quantity: number }

	const all_schemes = computed<SchemeData[]>(() => {
		if (!store.state.farmer) return []
		return (Object.values(LeekWars.schemes) as SchemeData[])
			.filter((scheme) => store.state.farmer?.schemes.find(s => LeekWars.items[s.template].params == scheme.id))
	})

	const schemeFilterTypes = computed<ItemType[]>(() => {
		const types = new Set(all_schemes.value.map(s => LeekWars.items[s.result].type))
		return [ItemType.ALL, ...(Array.from(types) as ItemType[]).sort()]
	})

	const schemes = computed(() => {
		let schemes = all_schemes.value
		if (filter.value !== 0) {
			schemes = schemes.filter(s => LeekWars.items[s.result].type === filter.value)
		}
		if (craftableOnly.value) {
			schemes = schemes.filter(s => store.getters.scheme_possible(s))
		}
		return [...schemes].sort((a, b) => {
			if (sort.value === Sort.LEVEL) return LeekWars.items[b.result].level - LeekWars.items[a.result].level
			if (sort.value === Sort.RARITY) return LeekWars.items[b.result].rarity - LeekWars.items[a.result].rarity
			if (sort.value === Sort.INGREDIENT_COUNT) return b.items.filter((i) => i !== null).length - a.items.filter((i) => i !== null).length
			return LeekWars.items[b.result].price! - LeekWars.items[a.result].price!
		})
	})

	watch(sort, () => localStorage.setItem('workshop/sort', '' + sort.value))
	watch(filter, () => localStorage.setItem('workshop/filter', '' + filter.value))
	watch(craftableOnly, () => localStorage.setItem('workshop/craftable', '' + craftableOnly.value))

	/** Atelier au cran plein sur mobile : l'inventaire n'a plus de place du tout. */
	const workshopFull = computed(() => LeekWars.mobile && panelState.value === 2)

	const bottomPanelStyle = computed(() => {
		// Mobile : la hauteur suit le cran, il n'y a pas de poignee de redimensionnement.
		// Plein = 100 % de la colonne, l'inventaire se retrouve reduit a rien, ce qui est
		// bien l'intention (« completement ouvert »).
		if (LeekWars.mobile) {
			if (panelState.value === 0) return { flex: '0 0 auto' }
			if (panelState.value === 1) return { flex: '0 0 50%' }
			return { flex: '1 1 100%' }
		}
		if (!bottomExpanded.value) return { flex: '0 0 auto' }
		// En deux colonnes, c'est la largeur qui est reglee et non la hauteur. Elle
		// est retrecissable (`0 1`) : sur une fenetre trop etroite pour la largeur
		// choisie plus le minimum de l'inventaire, c'est l'atelier qui cede, sinon la
		// page deborderait horizontalement.
		if (columnsLayout.value) return { flex: '0 1 ' + bottomWidth.value + 'px' }
		return { flex: '0 0 ' + bottomHeight.value + 'px' }
	})

	const instance = getCurrentInstance()

	function resizerMousedown(e: MouseEvent) {
		const panel = bottomPanel.value
		if (!panel) return
		const column = (instance!.proxy!.$el as HTMLElement).querySelector('.column') as HTMLElement
		if (columnsLayout.value) { resizeColumns(e, panel, column); return }
		const startY = e.clientY
		const startHeight = panel.expanded ? bottomHeight.value : 0
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
			bottomHeight.value = height || 300
			localStorage.setItem('inventory/bottom-height', '' + bottomHeight.value)
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

	/**
	 * Meme poignee, en deux colonnes : c'est la LARGEUR de l'atelier (a droite) qui
	 * suit la souris, et un glissement vers la droite le replie comme un glissement
	 * vers le bas le fait en mode lignes.
	 */
	function resizeColumns(e: MouseEvent, panel: { expanded: boolean }, column: HTMLElement) {
		const startX = e.clientX
		const startWidth = panel.expanded ? bottomWidth.value : 0
		const maxWidth = column.clientWidth - 300
		const mousemove = (ev: MouseEvent) => {
			let width = Math.max(0, Math.min(maxWidth, startWidth - (ev.clientX - startX)))
			if (width < 300) {
				width = 0
				if (panel.expanded) panel.expanded = false
			} else {
				if (!panel.expanded) panel.expanded = true
				width = Math.max(400, width)
			}
			bottomWidth.value = width || 400
			localStorage.setItem('inventory/bottom-width', '' + bottomWidth.value)
		}
		const mouseup = () => {
			document.documentElement.removeEventListener('mousemove', mousemove)
			document.documentElement.removeEventListener('mouseup', mouseup)
			document.body.style.cursor = ''
			document.body.style.userSelect = ''
			// La largeur de l'inventaire a change : sa grille se recalcule.
			emitter.emit('resize')
		}
		document.documentElement.addEventListener('mousemove', mousemove, false)
		document.documentElement.addEventListener('mouseup', mouseup, false)
		document.body.style.cursor = 'ew-resize'
		document.body.style.userSelect = 'none'
		e.preventDefault()
	}

	function scrollToForge() {
		const el = bottomContent.value as HTMLElement
		if (el && LeekWars.mobile) {
			el.scrollTo({ top: 0, behavior: 'smooth' })
		}
	}

	const onCloverUsed = () => { tooltipVisible.value = false }

	const route = useRoute()
	const router = useRouter()

	// Arrivée depuis le marché (bouton Fabriquer) : pré-remplir la forge avec le schéma,
	// uniquement si l'éleveur le possède. Renvoie false tant que l'éleveur n'est pas chargé.
	function applyCraftQuery(craftId: number) {
		if (!store.state.farmer) return false
		if (all_schemes.value.some(s => s.id === craftId)) {
			emitter.emit('craft', LeekWars.schemes[craftId])
		}
		router.replace('/inventory')
		return true
	}

	/**
	 * Un composant vient d'etre clique dans l'inventaire : si l'atelier est replie, il
	 * s'ouvre a mi-hauteur (en grand sur desktop) pour montrer ou la piece atterrit. Un
	 * atelier deja ouvert n'est pas touche, sinon le cran choisi par le joueur serait
	 * ecrase a chaque clic (#622).
	 */
	function onComponentPicked(item: InventoryItem) {
		const panel = bottomPanel.value
		if (!panel || panel.state > 0) return
		panel.state = LeekWars.mobile ? 1 : 2
		// Le panneau DEMONTE son contenu quand il est replie : la forge n'existait pas
		// encore et n'a donc pas pu recevoir l'evenement. On le rejoue une fois qu'elle
		// est montee, sinon le panneau s'ouvrait sur une forge vide. Pas de boucle : au
		// second passage l'atelier est ouvert et on ressort tout de suite.
		nextTick(() => emitter.emit('alter', item))
	}

	// Apres une destruction, on bascule sur l'onglet Detruire : le resultat vient d'y
	// etre ajoute, autant l'amener sous les yeux du joueur (#622).
	const onWorkshopAction = (action: number) => {
		if (action === 3) tab.value = 'destroy'
	}

	onMounted(() => {
		LeekWars.footer = false
		LeekWars.box = true
		emitter.on('craft', scrollToForge)
		emitter.on('clover-used', onCloverUsed)
		emitter.on('workshop-action', onWorkshopAction)
		emitter.on('alter', onComponentPicked)
		const craftId = parseInt('' + route.query.craft, 10)
		if (craftId && LeekWars.schemes[craftId] && !applyCraftQuery(craftId)) {
			const stop = watch(() => store.state.farmer, () => {
				if (applyCraftQuery(craftId)) stop()
			})
		}
	})

	onBeforeUnmount(() => {
		emitter.off('craft', scrollToForge)
		emitter.off('clover-used', onCloverUsed)
		emitter.off('workshop-action', onWorkshopAction)
		emitter.off('alter', onComponentPicked)
	})
</script>

<style lang="scss" scoped>
	// Le titre de panel porte un padding de 12px : il decalait les onglets vers la
// droite. On l'annule pour ce panneau seulement (#622).
.column .bottom-panel :deep(.header h2) {
	padding-left: 0;
}
// Onglets de l'atelier (#622), dans la barre de titre du panel.
	.workshop-tabs {
		display: flex;
		gap: 2px;
	}
	.workshop-tab {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 6px 12px;
		cursor: pointer;
		border-radius: var(--radius) var(--radius) 0 0;
		// Le header du panel est toujours sombre (var(--panel-header-background)) : le texte doit rester clair
		// quel que soit le theme du site, sinon il devient sombre sur sombre en clair.
		color: rgba(255, 255, 255, 0.6);
		white-space: nowrap;
		.v-icon { font-size: 18px; }
		&:hover { background: rgba(255, 255, 255, 0.08); }
		// Pas de gras sur l'actif : il elargit le texte et decale les onglets voisins.
		// La couleur pleine et le soulignement suffisent a le distinguer.
		&.active {
			color: var(--white);
			box-shadow: inset 0 -2px 0 var(--primary);
		}
	}
	// Sur mobile, seule l'icone reste, sinon les trois onglets debordent.
	@media (max-width: 500px) {
		.workshop-tab span { display: none; }
	}

.column {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
}
.column :deep(.inventory-panel) {
	min-height: 200px;
	// L'ecart avec l'atelier est desormais porte par la poignee, qui l'occupe en
	// entier : une marge en plus l'eloignerait du panneau d'en dessous.
	margin-bottom: 0;
}
// Disposition en deux colonnes : l'atelier passe A DROITE de l'inventaire. Le
// panneau porte `width: 100%` (pense pour un empilement) : en ligne il faut le
// laisser suivre sa base flex, sinon il ecrase son voisin — visible surtout
// replie, ou sa base vaut `auto`.
.column.columns {
	flex-direction: row;
}
.column.columns :deep(.inventory-panel) {
	min-height: 0;
	min-width: 300px;
	// Meme raison qu'en lignes : l'ecart est porte par la poignee, qui est ici a
	// droite de l'inventaire.
	margin-right: 0;
}
.column.columns .bottom-panel {
	width: auto;
	min-width: 0;
	// `.panel` (le composant) n'a pas de min-height : en ligne (flex-direction: row
	// sur `.column.columns`), l'atelier restait donc a la hauteur naturelle de son
	// CONTENU (forge + caracs + palette + historique empiles) au lieu de se laisser
	// borner a la hauteur de la colonne — l'historique se retrouvait hors ecran, sans
	// aucune barre de defilement pour l'atteindre (retour de Pierre). Meme piege
	// flexbox que partout ailleurs dans ce fichier : min-height:0 doit etre pose a
	// CHAQUE etage de la chaine, .bottom-content (l'etage suivant) l'a deja.
	min-height: 0;
	margin-bottom: 0;
}
// Plancher de l'atelier OUVERT, en largeur cette fois : meme raison qu'en lignes
// (min-height: 350px plus haut) — en dessous, la forge et sa colonne de caracteristiques
// ne tiennent plus cote a cote (demande de Pierre). Comme en lignes, replie il doit
// pouvoir se reduire a son en-tete : le plancher ne vaut que `.expanded`, et sa
// specificite (4 classes) bat le `min-width: 0` du bloc juste au-dessus.
.column.columns .bottom-panel.expanded {
	min-width: 555px;
}
// Meme bande, couchee : elle prend toute la hauteur entre les deux colonnes.
.column.columns .resizer {
	height: auto;
	width: 16px;
	cursor: ew-resize;
}
// La poignee EST l'ecart entre les deux panneaux (qui n'ont donc plus de marge de
// ce cote) : la bande entiere est saisissable, sur toute la largeur en lignes comme
// sur toute la hauteur en colonnes, et l'icone tombe DANS le trou. Avant, la bande
// etait posee PAR-DESSUS l'atelier (marge negative) : il fallait lui couper les
// clics pour ne pas manger son en-tete, et l'icone se retrouvait centree dessus.
.resizer {
	height: 16px;
	position: relative;
	z-index: 2;
	cursor: ns-resize;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	user-select: none;
	.v-icon {
		// A la taille de la bande : le glyphe, plus petit que sa boite, tient dans le
		// trou sans mordre sur les panneaux.
		font-size: 16px;
		color: var(--grey-9);
	}
	// La bande entiere s'allume au survol : sans cela, rien ne dit qu'on peut
	// l'attraper ailleurs que sur l'icone.
	&:hover {
		background: rgba(127, 127, 127, 0.15);
		border-radius: var(--radius);
		.v-icon { color: var(--primary); }
	}
}
// En disposition colonnes, la poignee regle une LARGEUR meme quand l'atelier est
// replie (il reprend alors toute la largeur en bas) : le curseur doit l'annoncer.
.resizer.vertical {
	cursor: ew-resize;
}
#app.app .resizer {
	display: none;
}
#app.app .column :deep(.inventory-panel) {
	min-height: 0;
	flex: 1;
	// Sur mobile il n'y a pas de poignee (elle est masquee) : le panneau reprend sa
	// propre marge, sinon les deux panneaux se touchent.
	margin-bottom: 12px;
}
#app.app .bottom-panel {
	flex: 1;
	// Sur mobile la hauteur suit les crans (auto / 50 % / plein) : un plancher de 350 px
	// ferait deborder le cran intermediaire sur les petits ecrans.
	min-height: 0;
}
.bottom-panel {
	min-height: 0;
}
// Plancher de l'atelier OUVERT : en dessous, la forge (~290 px avec ses marges) ne tient
// plus dans le panneau, quoi qu'on fasse de la poignee (demande de Pierre). Le plancher
// ne vaut que deplie : replie, le panneau doit pouvoir se reduire a son en-tete.
.bottom-panel.expanded {
	min-height: 350px;
}
.bottom-content {
	display: flex;
	flex: 1;
	min-height: 0;
	padding: 0;
	// Un ecart unique entre les colonnes de l'atelier (demande de Pierre) : c'est lui qui
	// les separe, plus les marges internes de chacune.
	gap: 15px;
	// Transparent pour la mise en page en trois colonnes : la forge et les stats
	// restent des enfants directs du flex. Le groupe ne prend corps qu'en vertical.
	.forge-row {
		display: contents;
	}
	.forge-wrapper {
		// La colonne fait la largeur de la forge (260 px) plus les 4 px dont debordent ses
		// boutons d'angle, de chaque cote : plus rien a droite, l'ecart avec les caracs
		// est porte par le gap (demande de Pierre).
		flex-basis: 268px;
		flex-shrink: 0;
		display: flex;
		// Centre le bloc forge COMPACT verticalement (safe : bascule en haut plutot que
		// de rogner s'il depasse). Sur mobile la colonne fait la hauteur du bloc, donc pas
		// de vide ; sur desktop il flotte au milieu du panneau (#622).
		align-items: safe center;
		justify-content: center;
		min-height: 0;
		// auto et non scroll : la forge ne change plus de taille (ses cartes sont passees
		// dans la colonne des caracs) et le panneau ne descend plus sous 350 px, donc la
		// barre ne sert plus que de filet — une piste toujours reservee ne serait que 15 px
		// de vide a droite de la forge.
		overflow-y: auto;
		// clip et non hidden : une boite qui defile en Y devient aussi scrollable en X, et
		// les boutons d'angle suffiraient a y faire apparaitre une barre horizontale.
		overflow-x: clip;
	}
	// Panneau court : la colonne des caracs porte maintenant les stats ET la tentative,
	// elle depasse donc facilement. Elle defile pour elle-meme, comme la forge a sa
	// gauche, plutot que de se faire rogner par le bas (retour de Pierre).
	// auto et non scroll : cette colonne ne change plus de hauteur (la carte de tentative
	// a sa place reservee), une barre inutile ne se justifie pas ici.
	&:not(.vertical) :deep(.forge-stats) {
		min-height: 0;
		overflow-y: auto;
		// Un peu plus large quand la page l'est : a 200 px fixes, « Points de vie » et
		// « Risque de casse » se coupent en deux lignes alors qu'il reste de la place a
		// cote (retour de Pierre). Plafonnee a 250 px : au-dela ce ne serait plus que du
		// vide entre le libelle et le chiffre, et c'est autant de moins pour la palette
		// et l'historique.
		width: clamp(200px, 20%, 250px);
		// Plus de marge a droite : l'ecart entre colonnes est porte par le gap.
		padding: 10px 0;
	}
}
#app.app .bottom-content {
	flex-direction: column;
	overflow-y: scroll;
	.forge-wrapper {
		flex-basis: auto;
	}
	// Mobile : tout est empile et c'est la page qui defile. Sans ce retour a la valeur
	// initiale, la colonne des caracs deviendrait retrecissable et defilerait DANS une
	// page qui defile deja.
	:deep(.forge-stats) {
		min-height: auto;
		overflow-y: visible;
	}
}
// En deux colonnes l'atelier est une bande haute et etroite : les trois colonnes
// (forge, stats, catalogue) n'y tiennent plus cote a cote. On les empile comme sur
// mobile, ce qui rend au catalogue toute la largeur du panneau. La forge et ses
// stats gardent le haut et c'est le catalogue qui defile, sinon la piece en cours
// sortait de l'ecran des qu'on parcourait les schemas.
.bottom-content.vertical {
	flex-direction: column;
	// L'item et ses stats cote a cote si la bande est assez large (demande de
	// Pierre) : la rangee prend corps et enveloppe les deux ; en dessous, le
	// flex-wrap fait retomber les stats sous la forge.
	.forge-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		// De l'air entre la forge et la colonne des stats (demande de Pierre).
		gap: 0 30px;
		flex-shrink: 1;
		min-height: 0;
		// C'est la rangee qui se replie sur une barre de defilement quand le
		// panneau est court (role tenu avant par .forge-wrapper).
		overflow-y: auto;
	}
	.forge-wrapper {
		flex: 0 1 auto;
		// Le defilement est porte par la rangee : deux barres imbriquees sinon.
		overflow-y: visible;
	}
	:deep(.forge-stats) {
		// Largeur FIGEE et non `auto` entre deux bornes : la rangee est centree, donc
		// tout elargissement de la colonne decale la forge d'autant. Le panneau grandit
		// des qu'une piece porte des alterations (dosage, risque et cout s'ajoutent, et
		// le cout se compte en dizaines de milliers), et la forge sautait alors
		// lateralement entre une piece vide et une piece chargee (retour de Pierre).
		// 260 px : la borne haute de ce que demandent ces lignes, sans la marge morte
		// qu'aurait laissee un max-width a 340.
		width: 260px;
		flex: 0 0 auto;
		padding: 10px;
	}
}
.schemes-section {
	flex: 1;
	min-height: 0;
	min-width: 0;
	// Barre de defilement toujours reservee : sinon son apparition au chargement de
	// l'historique decale tout le contenu vers la gauche (#622).
	overflow-y: scroll;
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
// Detruire : l'historique ne defile PAS pour lui-meme, c'est .schemes-section qui
// defile. Sinon on obtient deux barres imbriquees, et la piste vide de celle du dessus
// laisse un ecart avant le bord du panneau (#622).
.schemes-section :deep(.item-history) {
	height: auto;
	overflow-y: visible;
}
#app.app .schemes-section {
	overflow-y: visible;
}

// --- Ameliorer : palette et historique separes (demande de Pierre) ---
//
// Les deux etaient dans le meme defilement : descendre dans l'historique emportait la
// palette hors de l'ecran alors qu'on clique dedans en permanence. La section ne defile
// donc plus, c'est l'historique SEUL qui defile, et la palette reste toujours visible.
.schemes-section.alter-split {
	overflow-y: hidden;
}
.alter-pane {
	display: flex;
	flex: 1;
	min-height: 0;
}
// Mode « en ligne » (atelier sous l'inventaire) : la palette et l'historique sont des
// colonnes a part entiere, au MEME niveau que la forge et les caracteristiques (demande
// de Pierre). Leurs deux enveloppes (.schemes-section et .alter-pane) deviennent
// transparentes pour la mise en page : les quatre colonnes appartiennent alors au meme
// flex, et se partagent donc le meme `gap`.
// 360 px = deux colonnes de caracs dans la grille dynamique de la palette.
.bottom-content:not(.vertical) {
	.schemes-section.alter-split {
		display: contents;
	}
	.alter-pane {
		display: contents;
		// La palette VISE 360 px sans jamais grandir au-dela (elle n'a rien a gagner a
		// s'etaler, l'historique si), mais elle cede du terrain proportionnellement des que
		// la place manque : sa grille dynamique retombe alors a une colonne de caracs plutot
		// que de reduire l'historique a un filet (retour de Pierre).
		:deep(.alteration-palette) {
			flex: 0 1 360px;
			min-width: 0;
			// Deux colonnes des 264 px au lieu de 338 : dans cette colonne etroite, deux
			// colonnes de vignettes plus petites valent mieux qu'une seule a taille pleine
			// (demande de Pierre). A 360 px, la largeur visee, les vignettes restent pleines.
			--palette-column: 120px;
			// Plus de filet : ce sont maintenant quatre colonnes separees par le gap, et
			// les deux premieres n'en portent pas.
			border-bottom: none;
			// Filet de securite : la palette n'est pas censee defiler, mais sur un panneau
			// tres court mieux vaut une barre que des caracs inaccessibles.
			overflow-y: auto;
		}
		:deep(.item-history) {
			// Base reelle et non 0 : c'est elle qui fait que le manque de place se partage
			// entre les deux colonnes au lieu d'etre encaisse par l'historique seul (une base
			// nulle ne retrecit jamais, elle laissait la palette a ses 360 px).
			flex: 1 1 340px;
			min-width: 0;
			// auto et non 100% : la hauteur vient de l'etirement du flex, et il n'y a plus
			// d'enveloppe pour resoudre un pourcentage.
			height: auto;
			// scroll et non auto : sinon l'apparition de la barre au chargement des entrees
			// decale toute la liste vers la gauche (meme raison qu'ailleurs sur la page).
			overflow-y: scroll;
		}
	}
}
// Mode deux colonnes : la bande est trop etroite pour deux colonnes, on empile comme
// avant, mais la palette reste en haut et seul l'historique defile.
.bottom-content.vertical .alter-pane {
	flex-direction: column;
	:deep(.alteration-palette) { flex: 0 0 auto; }
	:deep(.item-history) {
		flex: 1;
		min-height: 0;
		height: auto;
		overflow-y: scroll;
	}
}
// Mobile : c'est la page entiere qui defile, l'historique reste donc dans le flux et
// s'allonge autant qu'il veut (une zone qui defile dans une page qui defile piege le
// doigt). Les enveloppes reprennent leur boite : la mise en page en colonnes n'a pas
// cours ici, tout est empile.
#app.app .schemes-section.alter-split {
	display: flex;
}
#app.app .alter-pane {
	display: flex;
	flex-direction: column;
	:deep(.alteration-palette) {
		flex: 0 0 auto;
		border-bottom: 1px solid var(--border);
		overflow-y: visible;
	}
	:deep(.item-history) {
		height: auto;
		overflow-y: visible;
	}
}
.menu-actions {
	.v-icon {
		margin: 6px;
	}
}
.scheme-tooltip {
	width: 280px;
	background: none;
}
</style>