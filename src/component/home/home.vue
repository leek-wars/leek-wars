<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1>{{ t('title') }}</h1>
			</div>
			<div class="tabs">
				<div class="tab" :class="{ active: editMode }" @click="toggleEdit">
					<v-icon>{{ editMode ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
					<span>{{ t(editMode ? 'done' : 'customize') }}</span>
				</div>
			</div>
		</div>

		<div v-if="editMode" class="add-bar">
			<span class="add-label"><v-icon>mdi-plus</v-icon> {{ t('add_widget') }}</span>
			<template v-if="availableToAdd.length">
				<div v-for="w in availableToAdd" :key="w.type" v-ripple class="add-chip" @click="addWidget(w.type)">
					<v-icon>{{ w.icon }}</v-icon> {{ t('widget_' + w.type) }}
				</div>
			</template>
			<span v-else class="none">{{ t('all_widgets_added') }}</span>
		</div>

		<div v-if="!widgets.length" class="empty card">
			<v-icon>mdi-view-dashboard-outline</v-icon>
			<span>{{ editMode ? t('empty_edit') : t('empty') }}</span>
			<div v-if="!editMode" v-ripple class="button" @click="toggleEdit">{{ t('customize') }}</div>
		</div>

		<div ref="gridEl" class="grid-stack" :class="{ editing: editMode }">
			<div v-for="widget in widgets" :key="widget.type" class="grid-stack-item" :gs-id="widget.type" :gs-x="widget.x" :gs-y="widget.y" :gs-w="widget.w" :gs-h="widget.h">
				<div class="grid-stack-item-content">
					<panel :title="t('widget_' + widget.type)" :icon="widgetMeta[widget.type].icon" class="widget-panel">
						<template #actions>
							<template v-if="editMode">
								<div class="button flat" @click="removeWidget(widget.type)">
									<v-icon>mdi-close</v-icon>
								</div>
								<div class="button flat drag-handle">
									<v-icon>mdi-drag</v-icon>
								</div>
							</template>
							<router-link v-else-if="widgetMeta[widget.type].link" :to="widgetMeta[widget.type].link!" class="button flat">
								<v-icon>mdi-open-in-new</v-icon>
							</router-link>
						</template>
						<component :is="widgetMeta[widget.type].component" />
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

	defineOptions({ name: 'Home', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('home')

	const COLUMNS = 12

	interface WidgetInstance { type: string, x: number, y: number, w: number, h: number }
	interface WidgetDefinition {
		icon: string
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: any
		defaultW: number
		defaultH: number
		minW: number
		minH: number
		link?: string
	}

	const widgetMeta: Record<string, WidgetDefinition> = {
		leeks: { icon: 'mdi-sprout', component: markRaw(HomeWidgetLeeks), defaultW: 6, defaultH: 4, minW: 3, minH: 3, link: '/farmer' },
		talent: { icon: 'mdi-sword-cross', component: markRaw(HomeWidgetTalent), defaultW: 6, defaultH: 4, minW: 4, minH: 3, link: '/farmer' },
		trophies: { icon: 'mdi-trophy', component: markRaw(HomeWidgetTrophies), defaultW: 4, defaultH: 3, minW: 3, minH: 2, link: '/trophies' },
		chat: { icon: 'mdi-forum', component: markRaw(HomeWidgetChat), defaultW: 4, defaultH: 5, minW: 3, minH: 3 },
		collection: { icon: 'mdi-view-grid-outline', component: markRaw(HomeWidgetCollection), defaultW: 4, defaultH: 4, minW: 3, minH: 3, link: '/collection' },
		ranking: { icon: 'mdi-podium', component: markRaw(HomeWidgetRanking), defaultW: 4, defaultH: 4, minW: 3, minH: 3, link: '/ranking' },
		rare_trophies: { icon: 'mdi-star-circle-outline', component: markRaw(HomeWidgetRareTrophies), defaultW: 4, defaultH: 4, minW: 3, minH: 2, link: '/trophies' },
		forum: { icon: 'mdi-forum-outline', component: markRaw(HomeWidgetForum), defaultW: 4, defaultH: 4, minW: 3, minH: 3, link: '/forum' },
		tournaments: { icon: 'mdi-tournament', component: markRaw(HomeWidgetTournaments), defaultW: 4, defaultH: 3, minW: 3, minH: 2 },
	}
	const WIDGET_TYPES = Object.keys(widgetMeta)

	// Disposition par défaut (grille 12 colonnes) si l'éleveur n'a jamais personnalisé.
	const DEFAULT_LAYOUT: WidgetInstance[] = [
		{ type: 'leeks', x: 0, y: 0, w: 6, h: 4 },
		{ type: 'talent', x: 6, y: 0, w: 6, h: 4 },
		{ type: 'trophies', x: 0, y: 4, w: 4, h: 3 },
		{ type: 'chat', x: 4, y: 4, w: 8, h: 5 },
	]

	function parseLayout(raw: string | null | undefined): WidgetInstance[] {
		if (!raw) return DEFAULT_LAYOUT.map(w => ({ ...w }))
		try {
			const parsed = JSON.parse(raw)
			if (!Array.isArray(parsed)) return DEFAULT_LAYOUT.map(w => ({ ...w }))
			const seen = new Set<string>()
			const result: WidgetInstance[] = []
			let fallbackY = 0
			for (const w of parsed) {
				if (!w || typeof w.type !== 'string') continue
				if (!WIDGET_TYPES.includes(w.type) || seen.has(w.type)) continue
				seen.add(w.type)
				const def = widgetMeta[w.type]
				// Format historique {type, size} -> conversion en {x,y,w,h}.
				if (typeof w.w !== 'number' || typeof w.h !== 'number') {
					const legacyW = w.size === 2 ? 12 : 6
					result.push({ type: w.type, x: 0, y: fallbackY, w: legacyW, h: def.defaultH })
					fallbackY += def.defaultH
					continue
				}
				result.push({
					type: w.type,
					x: typeof w.x === 'number' ? w.x : 0,
					y: typeof w.y === 'number' ? w.y : fallbackY,
					w: Math.min(COLUMNS, Math.max(def.minW, w.w)),
					h: Math.max(def.minH, w.h)
				})
				fallbackY += 1
			}
			return result.length ? result : DEFAULT_LAYOUT.map(w => ({ ...w }))
		} catch {
			return DEFAULT_LAYOUT.map(w => ({ ...w }))
		}
	}

	const widgets = ref<WidgetInstance[]>(parseLayout(store.state.farmer?.home_layout))
	const editMode = ref(false)
	const gridEl = ref<HTMLElement | null>(null)
	let grid: GridStack | null = null

	const availableToAdd = ref<{ type: string, icon: string }[]>([])
	function refreshAvailable() {
		const active = new Set(widgets.value.map(w => w.type))
		availableToAdd.value = WIDGET_TYPES.filter(type => !active.has(type)).map(type => ({ type, icon: widgetMeta[type].icon }))
	}
	refreshAvailable()

	// Mode large activé sur cette page uniquement (restauré en quittant).
	const previousLarge = ref(false)

	let saveTimer: ReturnType<typeof setTimeout> | null = null
	function persist() {
		if (!grid) return
		const nodes = grid.save(false, false) as GridStackWidget[]
		const layout = nodes.map(n => ({ type: String(n.id), x: n.x ?? 0, y: n.y ?? 0, w: n.w ?? 1, h: n.h ?? 1 }))
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
			float: true,
			staticGrid: true,
			handle: '.drag-handle',
			minRow: 1,
			columnOpts: { breakpointForWindow: true, breakpoints: [{ w: 768, c: 1 }] }
		}, gridEl.value)
		if (!grid) return
		// Contraintes de taille minimale par widget.
		for (const w of widgets.value) {
			const el = gridEl.value.querySelector(`[gs-id="${w.type}"]`) as HTMLElement | null
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

	function addWidget(type: string) {
		if (widgets.value.some(w => w.type === type)) return
		const def = widgetMeta[type]
		widgets.value.push({ type, x: 0, y: nextFreeY(), w: def.defaultW, h: def.defaultH })
		refreshAvailable()
		nextTick(() => {
			const el = gridEl.value?.querySelector(`[gs-id="${type}"]`) as HTMLElement | null
			if (el && grid) {
				grid.makeWidget(el)
				grid.update(el, { minW: def.minW, minH: def.minH })
			}
			persist()
		})
	}

	function removeWidget(type: string) {
		const el = gridEl.value?.querySelector(`[gs-id="${type}"]`) as HTMLElement | null
		if (el && grid) grid.removeWidget(el, false)
		widgets.value = widgets.value.filter(w => w.type !== type)
		refreshAvailable()
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
	.tabs .tab.active {
		background: var(--primary);
		color: white;
	}
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
	.add-bar .none {
		color: var(--text-color-secondary);
		font-style: italic;
	}
	.grid-stack {
		background: transparent;
	}
	.grid-stack-item-content {
		inset: 0;
		overflow: auto;
		display: flex;
	}
	.widget-panel {
		width: 100%;
		margin-bottom: 0;
		min-height: 100%;
	}
	.grid-stack.editing .grid-stack-item-content {
		outline: 2px dashed var(--border);
		outline-offset: -2px;
		border-radius: 4px;
	}
	.grid-stack.editing .drag-handle {
		cursor: grab;
	}
	.grid-stack.editing .drag-handle:active {
		cursor: grabbing;
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
