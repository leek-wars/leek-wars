<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1>{{ t('title') }}</h1>
			</div>
			<div class="tabs">
				<v-menu location="bottom end">
					<template #activator="{ props }">
						<div class="tab" v-bind="props" :title="t('add_widget')">
							<v-icon>mdi-plus</v-icon>
						</div>
					</template>
					<div class="widget-config card">
						<div v-for="w in availableToAdd" :key="w.type" v-ripple class="config-option" @click="addWidget(w.type)">
							<v-icon>{{ w.icon }}</v-icon> {{ t('widget_' + w.type) }}
						</div>
						<div v-if="!availableToAdd.length" class="config-title">{{ t('all_widgets_added') }}</div>
					</div>
				</v-menu>
				<div class="tab" :title="t(editMode ? 'done' : 'customize')" @click="toggleEdit">
					<v-icon>{{ editMode ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
				</div>
			</div>
		</div>

		<div v-if="!widgets.length" class="empty card">
			<v-icon>mdi-view-dashboard-outline</v-icon>
			<span>{{ editMode ? t('empty_edit') : t('empty') }}</span>
			<v-menu location="bottom">
				<template #activator="{ props }">
					<div v-ripple class="button" v-bind="props"><v-icon>mdi-plus</v-icon> {{ t('add_widget') }}</div>
				</template>
				<div class="widget-config card">
					<div v-for="w in availableToAdd" :key="w.type" v-ripple class="config-option" @click="addWidget(w.type)">
						<v-icon>{{ w.icon }}</v-icon> {{ t('widget_' + w.type) }}
					</div>
				</div>
			</v-menu>
		</div>

		<div ref="gridEl" class="grid-stack" :class="{ editing: editMode }">
			<div v-for="widget in widgets" :key="widget.id" class="grid-stack-item" :gs-id="widget.id" :gs-x="widget.x" :gs-y="widget.y" :gs-w="widget.w" :gs-h="widget.h">
				<div class="grid-stack-item-content">
					<panel :title="widgetTitle(widget)" :icon="widgetMeta[widget.type].icon" class="widget-panel" :class="{ 'no-scroll': widgetMeta[widget.type].noScroll }">
						<template #actions>
							<template v-if="editMode">
								<v-menu v-if="widgetMeta[widget.type].configurable" :close-on-content-click="false" location="bottom end">
									<template #activator="{ props }">
										<div class="button flat" v-bind="props"><v-icon>mdi-cog</v-icon></div>
									</template>
									<div class="widget-config card">
										<template v-if="widget.type === 'chat'">
											<div class="config-title">{{ t('choose_chat') }}</div>
											<div v-for="c in chatChannels" :key="c.id" v-ripple class="config-option" :class="{ selected: chatOf(widget) === c.id }" @click="setParam(widget, 'chat', c.id)">
												<flag :code="c.country" :clickable="false" class="config-flag" /> {{ c.name }}
											</div>
										</template>
										<template v-else-if="widget.type === 'classement'">
											<div class="config-title">{{ t('ranking_type') }}</div>
											<div v-for="cat in RANKING_CATEGORIES" :key="cat" v-ripple class="config-option" :class="{ selected: categoryOf(widget) === cat }" @click="setParam(widget, 'category', cat)">
												{{ t('ranking_' + cat) }}
											</div>
										</template>
										<template v-else-if="widget.type === 'leek_stats'">
											<div class="config-title">{{ t('choose_leek') }}</div>
											<div v-for="l in myLeeks" :key="l.id" v-ripple class="config-option" :class="{ selected: leekOf(widget) === l.id }" @click="setParam(widget, 'leek', l.id)">
												{{ l.name }}
											</div>
										</template>
									</div>
								</v-menu>
								<div class="button flat" @click="removeWidget(widget.id)">
									<v-icon>mdi-close</v-icon>
								</div>
							</template>
							<router-link v-if="!editMode && widgetMeta[widget.type].link" :to="widgetMeta[widget.type].link!" class="button flat">
								<v-icon>mdi-arrow-right</v-icon>
							</router-link>
							<!-- v-show et pas v-if : gridstack résout ses poignées de drag à
								l'activation ; l'élément doit exister en permanence dans le DOM,
								sinon les poignées deviennent obsolètes ou retombent sur l'item
								entier selon le moment de l'activation. -->
							<div v-show="editMode" class="button flat drag-handle">
								<v-icon>mdi-drag</v-icon>
							</div>
						</template>
						<component :is="widgetMeta[widget.type].component" v-bind="widgetProps(widget)" />
					</panel>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { GridStack, type GridStackWidget } from 'gridstack'
	import 'gridstack/dist/gridstack.min.css'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import HomeWidgetLeeks from '@/component/home/widgets/home-widget-leeks.vue'
	import HomeWidgetTalent from '@/component/home/widgets/home-widget-talent.vue'
	import HomeWidgetTrophies from '@/component/home/widgets/home-widget-trophies.vue'
	import HomeWidgetChat from '@/component/home/widgets/home-widget-chat.vue'
	import HomeWidgetCollection from '@/component/home/widgets/home-widget-collection.vue'
	import HomeWidgetRanking from '@/component/home/widgets/home-widget-ranking.vue'
	import HomeWidgetRareTrophies from '@/component/home/widgets/home-widget-rare-trophies.vue'
	import HomeWidgetForum from '@/component/home/widgets/home-widget-forum.vue'
	import HomeWidgetTournaments from '@/component/home/widgets/home-widget-tournaments.vue'
	import HomeWidgetClassement from '@/component/home/widgets/home-widget-classement.vue'
	import HomeWidgetLeekStats from '@/component/home/widgets/home-widget-leek-stats.vue'
	import HomeWidgetLive from '@/component/home/widgets/home-widget-live.vue'

	defineOptions({ name: 'Home', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('home')

	const COLUMNS = 12
	const RANKING_CATEGORIES = ['leek', 'farmer', 'team']

	interface WidgetInstance { id: string, type: string, x: number, y: number, w: number, h: number, params: Record<string, unknown> }
	interface WidgetDefinition {
		icon: string
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: any
		defaultW: number
		defaultH: number
		minW: number
		minH: number
		link?: string
		multi?: boolean        // peut être ajouté plusieurs fois
		configurable?: boolean // a un menu de configuration (params)
		noScroll?: boolean     // contenu clippé sans défilement interne : la molette va à la page
	}

	const widgetMeta: Record<string, WidgetDefinition> = {
		leeks: { icon: 'mdi-sprout', component: markRaw(HomeWidgetLeeks), defaultW: 6, defaultH: 4, minW: 3, minH: 3, link: '/farmer', noScroll: true },
		talent: { icon: 'mdi-sword-cross', component: markRaw(HomeWidgetTalent), defaultW: 6, defaultH: 4, minW: 4, minH: 3, link: '/farmer', noScroll: true },
		trophies: { icon: 'mdi-trophy', component: markRaw(HomeWidgetTrophies), defaultW: 4, defaultH: 3, minW: 3, minH: 2, link: '/trophies', noScroll: true },
		// noScroll : le panel ne défile jamais, la zone de messages du chat gère son propre défilement.
		chat: { icon: 'mdi-forum', component: markRaw(HomeWidgetChat), defaultW: 4, defaultH: 5, minW: 3, minH: 3, multi: true, configurable: true, noScroll: true },
		collection: { icon: 'mdi-view-grid-outline', component: markRaw(HomeWidgetCollection), defaultW: 4, defaultH: 4, minW: 3, minH: 3, link: '/collection', noScroll: true },
		ranking: { icon: 'mdi-podium', component: markRaw(HomeWidgetRanking), defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
		classement: { icon: 'mdi-format-list-numbered', component: markRaw(HomeWidgetClassement), defaultW: 4, defaultH: 5, minW: 3, minH: 3, link: '/ranking', multi: true, configurable: true },
		leek_stats: { icon: 'mdi-chart-line', component: markRaw(HomeWidgetLeekStats), defaultW: 4, defaultH: 6, minW: 3, minH: 4, multi: true, configurable: true, noScroll: true },
		rare_trophies: { icon: 'mdi-star-circle-outline', component: markRaw(HomeWidgetRareTrophies), defaultW: 4, defaultH: 4, minW: 3, minH: 2, link: '/trophies', noScroll: true },
		forum: { icon: 'mdi-forum-outline', component: markRaw(HomeWidgetForum), defaultW: 4, defaultH: 4, minW: 3, minH: 3, link: '/forum' },
		live: { icon: 'mdi-access-point', component: markRaw(HomeWidgetLive), defaultW: 4, defaultH: 5, minW: 3, minH: 3 },
		tournaments: { icon: 'mdi-tournament', component: markRaw(HomeWidgetTournaments), defaultW: 4, defaultH: 3, minW: 3, minH: 2 },
	}
	const WIDGET_TYPES = Object.keys(widgetMeta)

	// Disposition par défaut (grille 12 colonnes) si l'éleveur n'a jamais personnalisé.
	const DEFAULT_LAYOUT: WidgetInstance[] = [
		{ id: 'leeks', type: 'leeks', x: 0, y: 0, w: 6, h: 4, params: {} },
		{ id: 'talent', type: 'talent', x: 6, y: 0, w: 6, h: 4, params: {} },
		{ id: 'trophies', type: 'trophies', x: 0, y: 4, w: 4, h: 3, params: {} },
		{ id: 'chat', type: 'chat', x: 4, y: 4, w: 8, h: 5, params: {} },
	]
	const cloneDefault = () => DEFAULT_LAYOUT.map(w => ({ ...w, params: { ...w.params } }))

	function parseLayout(raw: string | null | undefined): WidgetInstance[] {
		if (!raw) return cloneDefault()
		try {
			const parsed = JSON.parse(raw)
			if (!Array.isArray(parsed)) return cloneDefault()
			const seenIds = new Set<string>()
			const result: WidgetInstance[] = []
			let fallbackY = 0
			for (const w of parsed) {
				if (!w || typeof w.type !== 'string' || !WIDGET_TYPES.includes(w.type)) continue
				// id : présent (nouveau format) sinon = type (ancien format, widgets uniques).
				const id = typeof w.id === 'string' && w.id ? w.id : w.type
				if (seenIds.has(id)) continue
				seenIds.add(id)
				const def = widgetMeta[w.type]
				const params = (w.params && typeof w.params === 'object') ? w.params : {}
				// Ancien format {type, size} -> conversion en {x,y,w,h}.
				if (typeof w.w !== 'number' || typeof w.h !== 'number') {
					const legacyW = w.size === 2 ? 12 : 6
					result.push({ id, type: w.type, x: 0, y: fallbackY, w: legacyW, h: def.defaultH, params })
					fallbackY += def.defaultH
					continue
				}
				result.push({
					id,
					type: w.type,
					x: typeof w.x === 'number' ? w.x : 0,
					y: typeof w.y === 'number' ? w.y : fallbackY,
					w: Math.min(COLUMNS, Math.max(def.minW, w.w)),
					h: Math.max(def.minH, w.h),
					params
				})
				fallbackY += 1
			}
			return result.length ? result : cloneDefault()
		} catch {
			return cloneDefault()
		}
	}

	const widgets = ref<WidgetInstance[]>(parseLayout(store.state.farmer?.home_layout))
	const editMode = ref(false)
	const gridEl = ref<HTMLElement | null>(null)
	let grid: GridStack | null = null

	// Chats publics disponibles pour la config du widget chat.
	const chatChannels = ref(Object.values(LeekWars.publicChats).map((c: { id: number, language: string, name: string }) => ({
		id: c.id,
		name: c.name,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		country: (LeekWars.languages as any)[c.language]?.country ?? c.language
	})))

	// Poireaux de l'éleveur, pour la config du widget "statistiques d'un poireau".
	const myLeeks = computed(() => Object.values(store.state.farmer?.leeks ?? {}).map(l => ({ id: l.id, name: l.name })))

	// Widgets encore disponibles à l'ajout : les "multi" toujours, les uniques si absents.
	const availableToAdd = ref<{ type: string, icon: string }[]>([])
	function refreshAvailable() {
		const active = new Set(widgets.value.map(w => w.type))
		availableToAdd.value = WIDGET_TYPES
			.filter(type => widgetMeta[type].multi || !active.has(type))
			.map(type => ({ type, icon: widgetMeta[type].icon }))
	}
	refreshAvailable()

	function widgetProps(widget: WidgetInstance): Record<string, unknown> {
		return widgetMeta[widget.type].configurable ? { params: widget.params } : {}
	}

	const { locale } = useI18n()

	// Titre du panel : le widget chat précise son canal (« Chat — Général »),
	// avec la même résolution que le widget lui-même : chat de groupe imposé,
	// canal choisi dans les params, sinon chat public de la langue.
	function widgetTitle(widget: WidgetInstance): string {
		const base = t('widget_' + widget.type)
		if (widget.type !== 'chat') return base
		const farmer = store.state.farmer
		let id: number | null = null
		if (farmer?.group && farmer.group.chat && !farmer.public_chat_enabled) {
			id = farmer.group.chat
		} else if (farmer?.public_chat_enabled) {
			const chosen = widget.params.chat as number | undefined
			if (chosen && LeekWars.isPublicChat(chosen)) id = chosen
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			else id = (LeekWars.languages as any)[locale.value]?.chat ?? null
		}
		if (id == null) return base
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const name = chatChannels.value.find(c => c.id === id)?.name ?? (store.state.chat as any)[id]?.name
		return name ? base + ' — ' + name : base
	}
	function chatOf(widget: WidgetInstance): number | undefined {
		return widget.params.chat as number | undefined
	}
	function categoryOf(widget: WidgetInstance): string {
		return (widget.params.category as string) || 'leek'
	}
	function leekOf(widget: WidgetInstance): number | undefined {
		return (widget.params.leek as number | undefined) ?? myLeeks.value[0]?.id
	}

	// Mode large activé sur cette page uniquement (restauré en quittant).
	const previousLarge = ref(false)

	let saveTimer: ReturnType<typeof setTimeout> | null = null
	// Disposition calculée mais pas encore envoyée au serveur (debounce en cours).
	let pendingLayout: string | null = null

	function computeLayout(): string | null {
		if (!grid) return null
		const nodes = grid.save(false, false) as GridStackWidget[]
		const byId = new Map(widgets.value.map(w => [w.id, w]))
		const layout = nodes.map(n => {
			const inst = byId.get(String(n.id))
			return { id: String(n.id), type: inst?.type, x: n.x ?? 0, y: n.y ?? 0, w: n.w ?? 1, h: n.h ?? 1, params: inst?.params ?? {} }
		})
		return JSON.stringify(layout)
	}

	function flushSave() {
		if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
		if (pendingLayout === null) return
		const json = pendingLayout
		pendingLayout = null
		store.commit('set-home-layout', json)
		LeekWars.put('farmer/set-home-layout', { home_layout: json })
	}

	function dropPendingSave() {
		if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
		pendingLayout = null
	}

	// Sauvegarde immédiate : ajout/suppression/config, actions ponctuelles.
	function persistNow() {
		const json = computeLayout()
		if (json === null) return
		pendingLayout = json
		flushSave()
	}

	// Sauvegarde débouncée : déplacements/redimensionnements en rafale.
	function persist() {
		const json = computeLayout()
		if (json === null) return
		pendingLayout = json
		if (saveTimer) clearTimeout(saveTimer)
		saveTimer = setTimeout(flushSave, 500)
	}

	// F5 / fermeture d'onglet : un XHR classique serait tué avec la page,
	// on envoie la sauvegarde en attente via fetch keepalive.
	function flushOnPageHide() {
		if (pendingLayout === null) return
		if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
		const json = pendingLayout
		pendingLayout = null
		store.commit('set-home-layout', json)
		const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=UTF-8' }
		if (store.state.connected) headers['Authorization'] = 'Bearer ' + store.state.token
		fetch(LeekWars.API + 'farmer/set-home-layout', { method: 'PUT', headers, credentials: 'include', keepalive: true, body: JSON.stringify({ home_layout: json }) })
	}

	function initGrid() {
		if (!gridEl.value) return
		grid = GridStack.init({
			column: COLUMNS,
			cellHeight: 78,
			margin: 6,
			float: false,
			staticGrid: true,
			// Poignées de drag : l'icône dédiée ET la barre de titre du panel.
			handle: '.drag-handle, .widget-panel > .header > h2',
			minRow: 1,
			// Pas d'animation à l'arrivée sur la page (les panels « voleraient »
			// en place) ; réactivée après le premier rendu pour le drag & drop.
			animate: false,
			columnOpts: { breakpointForWindow: true, breakpoints: [{ w: 768, c: 1 }] }
		}, gridEl.value)
		if (!grid) return
		for (const w of widgets.value) {
			const el = gridEl.value.querySelector(`[gs-id="${w.id}"]`) as HTMLElement | null
			if (el) grid.update(el, { minW: widgetMeta[w.type].minW, minH: widgetMeta[w.type].minH })
		}
		grid.on('change', persist)
		requestAnimationFrame(() => requestAnimationFrame(() => grid?.setAnimation(true)))
	}

	function toggleEdit() {
		editMode.value = !editMode.value
		if (!grid) return
		grid.setStatic(!editMode.value)
	}

	// Positions actuelles des widgets : la vérité vient de la grille (les x/y de
	// widgets.value ne sont pas resynchronisés après un drag), avec repli sur l'état.
	function currentRects(): { x: number, y: number, w: number, h: number }[] {
		if (grid) {
			const nodes = grid.save(false, false) as GridStackWidget[]
			return nodes.map(n => ({ x: n.x ?? 0, y: n.y ?? 0, w: n.w ?? 1, h: n.h ?? 1 }))
		}
		return widgets.value
	}

	function nextFreeY(): number {
		let maxY = 0
		for (const r of currentRects()) maxY = Math.max(maxY, r.y + r.h)
		return maxY
	}

	// Premier emplacement (haut-gauche) où un widget w×h tient sans chevauchement :
	// un widget ajouté complète les lignes existantes au lieu d'aller sous tout.
	function firstFreePosition(w: number, h: number): { x: number, y: number } {
		const rects = currentRects()
		const bottom = nextFreeY()
		for (let y = 0; y <= bottom; y++) {
			for (let x = 0; x <= COLUMNS - w; x++) {
				if (!rects.some(r => x < r.x + r.w && r.x < x + w && y < r.y + r.h && r.y < y + h)) {
					return { x, y }
				}
			}
		}
		return { x: 0, y: bottom }
	}

	// id unique : première instance = type, puis type-2, type-3...
	function genId(type: string): string {
		const existing = new Set(widgets.value.map(w => w.id))
		if (!existing.has(type)) return type
		let i = 2
		while (existing.has(`${type}-${i}`)) i++
		return `${type}-${i}`
	}

	function addWidget(type: string) {
		const def = widgetMeta[type]
		if (!def.multi && widgets.value.some(w => w.type === type)) return
		const id = genId(type)
		const pos = firstFreePosition(def.defaultW, def.defaultH)
		widgets.value.push({ id, type, x: pos.x, y: pos.y, w: def.defaultW, h: def.defaultH, params: {} })
		refreshAvailable()
		nextTick(() => {
			const el = gridEl.value?.querySelector(`[gs-id="${id}"]`) as HTMLElement | null
			if (el && grid) {
				grid.makeWidget(el)
				grid.update(el, { minW: def.minW, minH: def.minH })
			}
			persistNow()
		})
	}

	function removeWidget(id: string) {
		const el = gridEl.value?.querySelector(`[gs-id="${id}"]`) as HTMLElement | null
		if (el && grid) grid.removeWidget(el, false)
		widgets.value = widgets.value.filter(w => w.id !== id)
		refreshAvailable()
		persistNow()
	}

	function setParam(widget: WidgetInstance, key: string, value: unknown) {
		widget.params = { ...widget.params, [key]: value }
		persistNow()
	}

	// Changement de compte : recharge la disposition et reconstruit la grille.
	// Une sauvegarde en attente est abandonnée : elle appartient à l'ancien compte,
	// l'envoyer maintenant l'écrirait sur le nouveau.
	watch(() => store.state.farmer?.id, () => {
		dropPendingSave()
		widgets.value = parseLayout(store.state.farmer?.home_layout)
		refreshAvailable()
		editMode.value = false
		if (grid) {
			grid.destroy(false)
			grid = null
		}
		nextTick(initGrid)
	})

	onMounted(() => {
		previousLarge.value = LeekWars.large
		LeekWars.large = true
		window.addEventListener('pagehide', flushOnPageHide)
		nextTick(initGrid)
	})

	onBeforeUnmount(() => {
		window.removeEventListener('pagehide', flushOnPageHide)
		flushSave()
		if (grid) { grid.destroy(false); grid = null }
		LeekWars.large = previousLarge.value
	})
</script>

<style lang="scss" scoped>
	// La page ne défile pas horizontalement : on masque le débord de 6px créé par
	// la marge négative ci-dessous (gridstack insère une marge de 6px autour de chaque
	// widget, y compris sur les bords ; on l'annule pour aligner le 1er widget sur le titre).
	.page {
		overflow-x: clip;
	}
	.grid-stack {
		background: transparent;
		margin-left: -6px;
		margin-right: -6px;
		// Annule aussi la marge de 6px que gridstack pose en haut de la 1re rangée
		// (padding disgracieux sous l'en-tête de page).
		margin-top: -6px;
	}
	// L'item lui-même ne défile jamais (sinon l'en-tête du panel défilerait avec) :
	// on force overflow hidden par-dessus le CSS de gridstack (plus spécifique).
	// NE PAS poser `inset` ici : gridstack applique sa marge (les gaps entre widgets)
	// via le décalage de ce conteneur, un inset: 0 les supprimerait.
	.grid-stack-item > .grid-stack-item-content {
		overflow: hidden;
	}
	.widget-panel {
		width: 100%;
		height: 100%;
		margin-bottom: 0;
	}
	// Icônes d'en-tête plus discrètes sur les widgets que sur les grands
	// panels du site (titre et boutons d'action).
	.widget-panel:deep(> .header h2 .v-icon) {
		font-size: 18px;
	}
	.widget-panel:deep(> .header .actions .button .v-icon) {
		font-size: 18px;
		width: 18px;
		height: 18px;
		padding: 9px 0;
	}
	.widget-panel:deep(> .header .actions .button) {
		padding: 0 8px;
	}
	// En-tête fixe, seul le contenu défile. Pas d'overscroll-behavior: contain ici :
	// il bloquerait la molette même sur un widget sans débord, et la page ne
	// défilerait plus dès que la souris est sur un panel.
	.widget-panel:deep(.content) {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}
	// Widgets sans défilement interne (noScroll) : le contenu est clippé,
	// la molette fait toujours défiler la page. Le contenu est aussi un
	// container CSS : les widgets adaptent leur mise en page à sa hauteur
	// (@container, unités cq*) pour ne jamais couper le contenu.
	.widget-panel.no-scroll:deep(.content) {
		overflow-y: hidden;
		container-type: size;
	}
	.grid-stack.editing .drag-handle {
		cursor: grab;
	}
	.grid-stack.editing .drag-handle:active {
		cursor: grabbing;
	}
	// La barre de titre est aussi une poignée de drag en mode édition.
	.grid-stack.editing .widget-panel:deep(> .header > h2) {
		cursor: grab;
	}
	.grid-stack.editing .widget-panel:deep(> .header > h2:active) {
		cursor: grabbing;
	}
	.widget-config {
		background: var(--background);
		padding: 6px;
		min-width: 180px;
		max-height: 300px;
		overflow-y: auto;
	}
	.config-title {
		font-weight: bold;
		color: var(--text-color-secondary);
		font-size: 13px;
		padding: 4px 8px;
	}
	.config-option {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		border-radius: var(--radius);
		cursor: pointer;
	}
	.config-option:hover {
		background: var(--background-secondary);
	}
	.config-option.selected {
		background: var(--primary);
		color: var(--primary-text);
	}
	.config-flag {
		height: 14px;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 40px;
		text-align: center;
		color: var(--text-color-secondary);
		.v-icon {
			font-size: 48px;
			opacity: 0.6;
		}
	}
</style>
