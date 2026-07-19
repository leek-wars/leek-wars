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

		<div v-else ref="grid" class="widgets" :class="{ edit: editMode }">
			<div v-for="widget in widgets" :key="widget.type" class="widget" :class="'size-' + widget.size" :data-type="widget.type">
				<panel :title="t('widget_' + widget.type)" :icon="widgetMeta[widget.type].icon">
					<template #actions>
						<template v-if="editMode">
							<div v-if="widgetMeta[widget.type].sizable" class="button flat" @click="toggleSize(widget)">
								<v-icon>{{ widget.size === 2 ? 'mdi-arrow-collapse-horizontal' : 'mdi-arrow-expand-horizontal' }}</v-icon>
							</div>
							<div class="button flat" @click="removeWidget(widget)">
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
</template>

<script setup lang="ts">
	import { markRaw, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
	import Sortable from 'sortablejs'
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

	interface WidgetInstance { type: string, size: number }
	interface WidgetDefinition {
		icon: string
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: any
		sizable: boolean
		defaultSize: number
		link?: string
	}

	// Registre des widgets disponibles. L'ordre définit l'ordre proposé dans la barre d'ajout.
	const widgetMeta: Record<string, WidgetDefinition> = {
		leeks: { icon: 'mdi-sprout', component: markRaw(HomeWidgetLeeks), sizable: true, defaultSize: 2, link: '/farmer' },
		talent: { icon: 'mdi-sword-cross', component: markRaw(HomeWidgetTalent), sizable: true, defaultSize: 2, link: '/farmer' },
		trophies: { icon: 'mdi-trophy', component: markRaw(HomeWidgetTrophies), sizable: true, defaultSize: 1, link: '/trophies' },
		chat: { icon: 'mdi-forum', component: markRaw(HomeWidgetChat), sizable: true, defaultSize: 1 },
		collection: { icon: 'mdi-view-grid-outline', component: markRaw(HomeWidgetCollection), sizable: true, defaultSize: 1, link: '/collection' },
		ranking: { icon: 'mdi-podium', component: markRaw(HomeWidgetRanking), sizable: true, defaultSize: 1, link: '/ranking' },
		rare_trophies: { icon: 'mdi-star-circle-outline', component: markRaw(HomeWidgetRareTrophies), sizable: true, defaultSize: 1, link: '/trophies' },
		forum: { icon: 'mdi-forum-outline', component: markRaw(HomeWidgetForum), sizable: true, defaultSize: 1, link: '/forum' },
		tournaments: { icon: 'mdi-tournament', component: markRaw(HomeWidgetTournaments), sizable: true, defaultSize: 1 },
	}
	const WIDGET_TYPES = Object.keys(widgetMeta)

	// Disposition par défaut si l'éleveur n'a jamais personnalisé sa page.
	const DEFAULT_LAYOUT: WidgetInstance[] = [
		{ type: 'leeks', size: 2 },
		{ type: 'talent', size: 2 },
		{ type: 'trophies', size: 1 },
		{ type: 'chat', size: 1 },
	]

	function parseLayout(raw: string | null | undefined): WidgetInstance[] {
		if (!raw) return DEFAULT_LAYOUT.map(w => ({ ...w }))
		try {
			const parsed = JSON.parse(raw)
			if (!Array.isArray(parsed)) return DEFAULT_LAYOUT.map(w => ({ ...w }))
			// On ne garde que les widgets connus (un widget retiré du code ne casse pas la page)
			// et on borne la taille aux valeurs supportées.
			const seen = new Set<string>()
			const result: WidgetInstance[] = []
			for (const w of parsed) {
				if (!w || typeof w.type !== 'string') continue
				if (!WIDGET_TYPES.includes(w.type) || seen.has(w.type)) continue
				seen.add(w.type)
				const size = w.size === 2 ? 2 : 1
				result.push({ type: w.type, size: widgetMeta[w.type].sizable ? size : 1 })
			}
			return result
		} catch {
			return DEFAULT_LAYOUT.map(w => ({ ...w }))
		}
	}

	const widgets = ref<WidgetInstance[]>(parseLayout(store.state.farmer?.home_layout))
	const editMode = ref(false)
	const grid = ref<HTMLElement | null>(null)
	const sortable = shallowRef<Sortable | null>(null)

	const availableToAdd = ref<{ type: string, icon: string }[]>([])
	function refreshAvailable() {
		const active = new Set(widgets.value.map(w => w.type))
		availableToAdd.value = WIDGET_TYPES.filter(type => !active.has(type)).map(type => ({ type, icon: widgetMeta[type].icon }))
	}
	refreshAvailable()

	function save() {
		const layout = JSON.stringify(widgets.value)
		store.commit('set-home-layout', layout)
		LeekWars.put('farmer/set-home-layout', { home_layout: layout })
	}

	function toggleEdit() {
		editMode.value = !editMode.value
		if (editMode.value) {
			nextTick(setupSortable)
		} else if (sortable.value) {
			sortable.value.destroy()
			sortable.value = null
		}
	}

	function setupSortable() {
		if (!grid.value) return
		if (sortable.value) sortable.value.destroy()
		sortable.value = Sortable.create(grid.value, {
			handle: '.drag-handle',
			animation: 150,
			draggable: '.widget',
			onEnd: (evt) => {
				if (evt.oldIndex === undefined || evt.newIndex === undefined || evt.oldIndex === evt.newIndex) return
				const moved = widgets.value.splice(evt.oldIndex, 1)[0]
				widgets.value.splice(evt.newIndex, 0, moved)
				save()
			}
		})
	}

	function addWidget(type: string) {
		if (widgets.value.some(w => w.type === type)) return
		widgets.value.push({ type, size: widgetMeta[type].defaultSize })
		refreshAvailable()
		save()
		if (editMode.value) nextTick(setupSortable)
	}

	function removeWidget(widget: WidgetInstance) {
		const index = widgets.value.indexOf(widget)
		if (index === -1) return
		widgets.value.splice(index, 1)
		refreshAvailable()
		save()
	}

	function toggleSize(widget: WidgetInstance) {
		widget.size = widget.size === 2 ? 1 : 2
		save()
	}

	// Sync si le farmer change (login/switch de compte) alors qu'on est déjà sur la page.
	watch(() => store.state.farmer?.id, () => {
		widgets.value = parseLayout(store.state.farmer?.home_layout)
		refreshAvailable()
	})

	onBeforeUnmount(() => {
		if (sortable.value) sortable.value.destroy()
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
	.widgets {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		align-items: start;
	}
	.widget {
		min-width: 0;
	}
	.widget.size-2 {
		grid-column: span 2;
	}
	.widget.size-1 {
		grid-column: span 1;
	}
	.widget :deep(.panel) {
		margin-bottom: 0;
	}
	.widgets.edit .widget :deep(.panel) {
		outline: 2px dashed var(--border);
		outline-offset: -2px;
	}
	.drag-handle {
		cursor: grab;
	}
	.drag-handle:active {
		cursor: grabbing;
	}
	:global(.sortable-ghost) {
		opacity: 0.4;
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
	@media (max-width: 850px) {
		.widgets {
			grid-template-columns: minmax(0, 1fr);
		}
		.widget.size-2, .widget.size-1 {
			grid-column: span 1;
		}
	}
</style>
