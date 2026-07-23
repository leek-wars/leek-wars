<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1>{{ t('title') }}</h1>
			</div>
			<div class="tabs">
				<div class="tab" @click="toggleEdit">
					<v-icon>{{ editMode ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
					<span>{{ t(editMode ? 'done' : 'customize') }}</span>
				</div>
			</div>
		</div>

		<div v-if="editMode" class="add-bar">
			<span class="add-label"><v-icon>mdi-plus</v-icon> {{ t('add_widget') }}</span>
			<div v-for="w in availableToAdd" :key="w.type" v-ripple class="add-chip" @click="addWidget(w.type)">
				<v-icon>{{ w.icon }}</v-icon> {{ t('widget_' + w.type) }}
			</div>
		</div>

		<div v-if="!widgets.length" class="empty card">
			<v-icon>mdi-view-dashboard-outline</v-icon>
			<span>{{ editMode ? t('empty_edit') : t('empty') }}</span>
			<div v-if="!editMode" v-ripple class="button" @click="toggleEdit">{{ t('customize') }}</div>
		</div>

		<div ref="gridEl" class="grid-stack" :class="{ editing: editMode }">
			<div v-for="widget in widgets" :key="widget.id" class="grid-stack-item" :gs-id="widget.id" :gs-x="widget.x" :gs-y="widget.y" :gs-w="widget.w" :gs-h="widget.h">
				<div class="grid-stack-item-content">
					<panel :title="t('widget_' + widget.type)" :icon="widgetMeta[widget.type].icon" class="widget-panel">
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
									</div>
								</v-menu>
								<div class="button flat" @click="removeWidget(widget.id)">
									<v-icon>mdi-close</v-icon>
								</div>
								<div class="button flat drag-handle">
									<v-icon>mdi-drag</v-icon>
								</div>
							</template>
							<router-link v-else-if="widgetMeta[widget.type].link" :to="widgetMeta[widget.type].link!" class="button flat">
								<v-icon>mdi-arrow-right</v-icon>
							</router-link>
						</template>
						<component :is="widgetMeta[widget.type].component" v-bind="widgetProps(widget)" />
					</panel>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
	}

	const widgetMeta: Record<string, WidgetDefinition> = {
		leeks: { icon: 'mdi-sprout', component: markRaw(HomeWidgetLeeks), defaultW: 6, defaultH: 4, minW: 3, minH: 3, link: '/farmer' },
		talent: { icon: 'mdi-sword-cross', component: markRaw(HomeWidgetTalent), defaultW: 6, defaultH: 4, minW: 4, minH: 3, link: '/farmer' },
		trophies: { icon: 'mdi-trophy', component: markRaw(HomeWidgetTrophies), defaultW: 4, defaultH: 3, minW: 3, minH: 2, link: '/trophies' },
		chat: { icon: 'mdi-forum', component: markRaw(HomeWidgetChat), defaultW: 4, defaultH: 5, minW: 3, minH: 3, multi: true, configurable: true },
		collection: { icon: 'mdi-view-grid-outline', component: markRaw(HomeWidgetCollection), defaultW: 4, defaultH: 4, minW: 3, minH: 3, link: '/collection' },
		ranking: { icon: 'mdi-podium', component: markRaw(HomeWidgetRanking), defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
		classement: { icon: 'mdi-format-list-numbered', component: markRaw(HomeWidgetClassement), defaultW: 4, defaultH: 5, minW: 3, minH: 3, link: '/ranking', multi: true, configurable: true },
		rare_trophies: { icon: 'mdi-star-circle-outline', component: markRaw(HomeWidgetRareTrophies), defaultW: 4, defaultH: 4, minW: 3, minH: 2, link: '/trophies' },
		forum: { icon: 'mdi-forum-outline', component: markRaw(HomeWidgetForum), defaultW: 4, defaultH: 4, minW: 3, minH: 3, link: '/forum' },
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
	function chatOf(widget: WidgetInstance): number | undefined {
		return widget.params.chat as number | undefined
	}
	function categoryOf(widget: WidgetInstance): string {
		return (widget.params.category as string) || 'leek'
	}

	// Mode large activé sur cette page uniquement (restauré en quittant).
	const previousLarge = ref(false)

	let saveTimer: ReturnType<typeof setTimeout> | null = null
	function persist() {
		if (!grid) return
		const nodes = grid.save(false, false) as GridStackWidget[]
		const byId = new Map(widgets.value.map(w => [w.id, w]))
		const layout = nodes.map(n => {
			const inst = byId.get(String(n.id))
			return { id: String(n.id), type: inst?.type, x: n.x ?? 0, y: n.y ?? 0, w: n.w ?? 1, h: n.h ?? 1, params: inst?.params ?? {} }
		})
		if (saveTimer) clearTimeout(saveTimer)
		saveTimer = setTimeout(() => {
			const json = JSON.stringify(layout)
			store.commit('set-home-layout', json)
			LeekWars.put('farmer/set-home-layout', { home_layout: json })
		}, 500)
	}

	function initGrid() {
		if (!gridEl.value) return
		grid = GridStack.init({
			column: COLUMNS,
			cellHeight: 78,
			margin: 6,
			float: false,
			staticGrid: true,
			handle: '.drag-handle',
			minRow: 1,
			columnOpts: { breakpointForWindow: true, breakpoints: [{ w: 768, c: 1 }] }
		}, gridEl.value)
		if (!grid) return
		for (const w of widgets.value) {
			const el = gridEl.value.querySelector(`[gs-id="${w.id}"]`) as HTMLElement | null
			if (el) grid.update(el, { minW: widgetMeta[w.type].minW, minH: widgetMeta[w.type].minH })
		}
		grid.on('change', persist)
	}

	function toggleEdit() {
		editMode.value = !editMode.value
		if (!grid) return
		grid.setStatic(!editMode.value)
	}

	function nextFreeY(): number {
		let maxY = 0
		for (const w of widgets.value) maxY = Math.max(maxY, w.y + w.h)
		return maxY
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
		widgets.value.push({ id, type, x: 0, y: nextFreeY(), w: def.defaultW, h: def.defaultH, params: {} })
		refreshAvailable()
		nextTick(() => {
			const el = gridEl.value?.querySelector(`[gs-id="${id}"]`) as HTMLElement | null
			if (el && grid) {
				grid.makeWidget(el)
				grid.update(el, { minW: def.minW, minH: def.minH })
			}
			persist()
		})
	}

	function removeWidget(id: string) {
		const el = gridEl.value?.querySelector(`[gs-id="${id}"]`) as HTMLElement | null
		if (el && grid) grid.removeWidget(el, false)
		widgets.value = widgets.value.filter(w => w.id !== id)
		refreshAvailable()
		persist()
	}

	function setParam(widget: WidgetInstance, key: string, value: unknown) {
		widget.params = { ...widget.params, [key]: value }
		persist()
	}

	// Changement de compte : recharge la disposition et reconstruit la grille.
	watch(() => store.state.farmer?.id, () => {
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
		nextTick(initGrid)
	})

	onBeforeUnmount(() => {
		if (saveTimer) clearTimeout(saveTimer)
		if (grid) { grid.destroy(false); grid = null }
		LeekWars.large = previousLarge.value
	})
</script>

<style lang="scss" scoped>
	.add-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		background: var(--background);
		border-radius: 4px;
		padding: 10px 12px;
		margin-bottom: 12px;
	}
	.add-label {
		font-weight: bold;
		color: var(--text-color-secondary);
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.add-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		border: 1px solid var(--border);
		border-radius: 16px;
		cursor: pointer;
		user-select: none;
		font-size: 14px;
	}
	.add-chip:hover {
		background: var(--background-secondary);
		border-color: var(--primary);
	}
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
	// En-tête fixe, seul le contenu défile, sans propager le scroll à la page.
	.widget-panel:deep(.content) {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	.grid-stack.editing .drag-handle {
		cursor: grab;
	}
	.grid-stack.editing .drag-handle:active {
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
		border-radius: 4px;
		cursor: pointer;
	}
	.config-option:hover {
		background: var(--background-secondary);
	}
	.config-option.selected {
		background: var(--primary);
		color: white;
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
