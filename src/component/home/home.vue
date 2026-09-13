<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="page-title">
				<page-icon name="home" fallback="mdi-home" />
				<div class="page-title-text">
					<h1>{{ t('title') }}</h1>
				</div>
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

		<!-- Mobile : le « + » de la barre d'application n'a pas de menu à ancrer,
		     il ouvre la même liste dans un dialogue. -->
		<popup v-model="addPopup" :width="420">
			<template #icon><v-icon>mdi-plus</v-icon></template>
			<template #title>{{ t('add_widget') }}</template>
			<div class="widget-config">
				<div v-for="w in availableToAdd" :key="w.type" v-ripple class="config-option" @click="addWidget(w.type); addPopup = false">
					<v-icon>{{ w.icon }}</v-icon> {{ t('widget_' + w.type) }}
				</div>
				<div v-if="!availableToAdd.length" class="config-title">{{ t('all_widgets_added') }}</div>
			</div>
		</popup>

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

		<!-- Sortie du mode édition. La disposition est déjà enregistrée à chaque
			changement : ce bouton ne sauvegarde rien, il referme le mode — mais
			c'est là qu'on le cherche, sous la main qui vient de déplacer un widget,
			plutôt que dans un coin de l'en-tête. Hors de `.grid-stack` : gridstack
			ne doit voir que ses propres enfants. -->
		<div v-if="editMode" class="validate-bar">
			<v-btn color="primary" size="large" prepend-icon="mdi-check" @click="toggleEdit">{{ t('validate_changes') }}</v-btn>
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
	// Partagé avec la page d'équipe, d'où sa place hors du dossier des widgets
	import Live from '@/component/live/live.vue'

	defineOptions({ name: 'Home', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('home')

	// Grille sous-divisée : une cellule vaut une DEMI-colonne visuelle. 24 colonnes
	// de 39 px rendent exactement comme les 12 colonnes de 78 px d'avant (toutes les
	// tailles ci-dessous ont été doublées d'autant, et les marges sont posées sur
	// l'item, pas par cellule) — mais l'aimantation tombe deux fois plus fin, on peut
	// caler un widget sur une demi-colonne ou lui donner une demi-hauteur.
	// Changer ces deux nombres suffit : les dispositions déjà enregistrées portent
	// l'échelle dans laquelle elles ont été écrites et sont converties au chargement.
	const COLUMNS = 24
	const CELL_HEIGHT = 39
	// Échelle des dispositions enregistrées avant la sous-division (#4262).
	const LEGACY_COLUMNS = 12
	const LEGACY_CELL_HEIGHT = 78
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

	// Tailles en cellules de la grille sous-divisée : 24 = pleine largeur,
	// 12 = une moitié, 8 = un tiers. Les valeurs par défaut restent sur des
	// nombres pairs — un widget ajouté tombe sur une colonne franche, c'est
	// au joueur d'aller chercher le demi-cran s'il le veut.
	const widgetMeta: Record<string, WidgetDefinition> = {
		leeks: { icon: 'mdi-sprout', component: markRaw(HomeWidgetLeeks), defaultW: 12, defaultH: 8, minW: 6, minH: 6, link: '/farmer', noScroll: true },
		talent: { icon: 'mdi-sword-cross', component: markRaw(HomeWidgetTalent), defaultW: 12, defaultH: 8, minW: 8, minH: 6, link: '/farmer', noScroll: true },
		trophies: { icon: 'mdi-trophy', component: markRaw(HomeWidgetTrophies), defaultW: 8, defaultH: 6, minW: 6, minH: 4, link: '/trophies', noScroll: true },
		// noScroll : le panel ne défile jamais, la zone de messages du chat gère son propre défilement.
		chat: { icon: 'mdi-forum', component: markRaw(HomeWidgetChat), defaultW: 8, defaultH: 10, minW: 6, minH: 6, multi: true, configurable: true, noScroll: true },
		collection: { icon: 'mdi-view-grid-outline', component: markRaw(HomeWidgetCollection), defaultW: 8, defaultH: 8, minW: 6, minH: 6, link: '/collection', noScroll: true },
		ranking: { icon: 'mdi-podium', component: markRaw(HomeWidgetRanking), defaultW: 8, defaultH: 8, minW: 6, minH: 6, noScroll: true },
		classement: { icon: 'mdi-format-list-numbered', component: markRaw(HomeWidgetClassement), defaultW: 8, defaultH: 10, minW: 6, minH: 6, link: '/ranking', multi: true, configurable: true, noScroll: true },
		leek_stats: { icon: 'mdi-chart-line', component: markRaw(HomeWidgetLeekStats), defaultW: 8, defaultH: 12, minW: 6, minH: 8, multi: true, configurable: true, noScroll: true },
		rare_trophies: { icon: 'mdi-star-circle-outline', component: markRaw(HomeWidgetRareTrophies), defaultW: 8, defaultH: 8, minW: 6, minH: 4, link: '/trophies', noScroll: true },
		forum: { icon: 'mdi-forum-outline', component: markRaw(HomeWidgetForum), defaultW: 8, defaultH: 8, minW: 6, minH: 6, link: '/forum', noScroll: true },
		live: { icon: 'mdi-access-point', component: markRaw(Live), defaultW: 8, defaultH: 10, minW: 6, minH: 6 },
		tournaments: { icon: 'mdi-tournament', component: markRaw(HomeWidgetTournaments), defaultW: 8, defaultH: 6, minW: 6, minH: 4 },
	}
	const WIDGET_TYPES = Object.keys(widgetMeta)

	// Widgets servis par la requête groupée `POST home/get` (#4262). Les autres
	// n'ont rien à y faire : `leeks` et `talent` lisent le store, `chat` vit sur
	// le websocket, `live` garde son propre rafraîchissement toutes les 60 s et
	// sert aussi la page d'équipe.
	const AGGREGATED = new Set(['trophies', 'rare_trophies', 'collection', 'ranking', 'classement', 'leek_stats', 'forum', 'tournaments'])

	// Disposition par défaut (grille 24 colonnes) si l'éleveur n'a jamais personnalisé.
	// Composée par Pierre, trois rangées de 10 : ce qui est à soi en haut (poireaux et
	// chat), ce qu'on suit au milieu (talent, trophées, direct), le jeu autour en bas
	// (collection, forum, joueurs remarquables).
	// Le chat n'impose PAS de canal : sans `params.chat` le widget prend le chat public
	// de la langue du joueur, sinon tout le monde atterrirait sur le canal de la locale
	// dans laquelle la disposition a été composée.
	const DEFAULT_LAYOUT: WidgetInstance[] = [
		{ id: 'leeks', type: 'leeks', x: 0, y: 0, w: 9, h: 10, params: {} },
		{ id: 'chat', type: 'chat', x: 9, y: 0, w: 15, h: 10, params: {} },
		{ id: 'talent', type: 'talent', x: 0, y: 10, w: 9, h: 10, params: {} },
		{ id: 'trophies', type: 'trophies', x: 9, y: 10, w: 8, h: 10, params: {} },
		{ id: 'live', type: 'live', x: 17, y: 10, w: 7, h: 10, params: {} },
		{ id: 'collection', type: 'collection', x: 0, y: 20, w: 7, h: 10, params: {} },
		{ id: 'forum', type: 'forum', x: 7, y: 20, w: 10, h: 10, params: {} },
		{ id: 'ranking', type: 'ranking', x: 17, y: 20, w: 7, h: 10, params: {} },
	]
	const cloneDefault = () => DEFAULT_LAYOUT.map(w => ({ ...w, params: { ...w.params } }))

	function parseLayout(raw: string | null | undefined): WidgetInstance[] {
		if (!raw) return cloneDefault()
		try {
			const parsed = JSON.parse(raw)
			// Deux enveloppes : le tableau nu (écrit avant la sous-division, donc en
			// 12 colonnes de 78 px) et l'objet qui porte son échelle. On convertit
			// vers l'échelle courante plutôt que de migrer la base : la disposition
			// vit dans une colonne texte, et un joueur peut revenir d'un vieil onglet.
			const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.widgets) ? parsed.widgets : null)
			if (!list) return cloneDefault()
			const savedColumns = Array.isArray(parsed) ? LEGACY_COLUMNS : parsed.columns
			const savedCellHeight = Array.isArray(parsed) ? LEGACY_CELL_HEIGHT : parsed.cellHeight
			const scaleX = typeof savedColumns === 'number' && savedColumns > 0 ? COLUMNS / savedColumns : 1
			const scaleY = typeof savedCellHeight === 'number' && savedCellHeight > 0 ? savedCellHeight / CELL_HEIGHT : 1
			const seenIds = new Set<string>()
			const result: WidgetInstance[] = []
			let fallbackY = 0
			for (const w of list) {
				if (!w || typeof w.type !== 'string' || !WIDGET_TYPES.includes(w.type)) continue
				// id : présent (nouveau format) sinon = type (ancien format, widgets uniques).
				const id = typeof w.id === 'string' && w.id ? w.id : w.type
				if (seenIds.has(id)) continue
				seenIds.add(id)
				const def = widgetMeta[w.type]
				const params = (w.params && typeof w.params === 'object') ? w.params : {}
				// Ancien format {type, size} -> conversion en {x,y,w,h}. Aucune
				// échelle à appliquer ici : les tailles viennent de la grille actuelle.
				if (typeof w.w !== 'number' || typeof w.h !== 'number') {
					const legacyW = w.size === 2 ? COLUMNS : COLUMNS / 2
					result.push({ id, type: w.type, x: 0, y: fallbackY, w: legacyW, h: def.defaultH, params })
					fallbackY += def.defaultH
					continue
				}
				result.push({
					id,
					type: w.type,
					x: typeof w.x === 'number' ? Math.round(w.x * scaleX) : 0,
					y: typeof w.y === 'number' ? Math.round(w.y * scaleY) : fallbackY,
					w: Math.min(COLUMNS, Math.max(def.minW, Math.round(w.w * scaleX))),
					h: Math.max(def.minH, Math.round(w.h * scaleY)),
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

	// Charge utile de chaque widget, par id. Trois états, et le widget les
	// distingue : `undefined` = la requête groupée est en vol, il patiente ;
	// `null` = le serveur n'a rien pour lui (widget en erreur, requête tombée,
	// serveur antérieur à `home/get`), il refait son propre appel comme avant ;
	// un objet = sa charge utile. Le repli compte : le serveur part en prod avant
	// le client, et l'inverse arrive aussi.
	const widgetData = ref<Record<string, unknown>>({})
	// Numéro de la requête qui a demandé chaque widget : une réponse qui arrive
	// après un changement de compte ou une reconfiguration ne remplit plus une
	// case qui ne l'attend plus.
	const widgetRequest: Record<string, number> = {}
	let requestCount = 0

	function widgetProps(widget: WidgetInstance): Record<string, unknown> {
		const props: Record<string, unknown> = {}
		if (widgetMeta[widget.type].configurable) props.params = widget.params
		if (AGGREGATED.has(widget.type)) props.data = widgetData.value[widget.id]
		return props
	}

	const { locale } = useI18n()

	// Une seule requête pour toute la page, au lieu d'une par widget : les onze
	// appels du montage dépassaient le rate-limit de 5 req/s et revenaient en 429,
	// rejoués avec backoff — l'accueil se remplissait par vagues.
	function fetchWidgets(list: WidgetInstance[]) {
		const wanted = list.filter(w => AGGREGATED.has(w.type))
		if (!wanted.length || !store.state.farmer) return
		const request = ++requestCount
		const pending = { ...widgetData.value }
		for (const w of wanted) {
			pending[w.id] = undefined
			widgetRequest[w.id] = request
		}
		widgetData.value = pending
		const asked = wanted.map(w => w.id)
		const payload = wanted.map(w => ({ id: w.id, type: w.type, params: w.params }))
		LeekWars.post<{ widgets: Record<string, { ok: boolean, data?: unknown, error?: string }> }>('home/get', { widgets: payload, lang: locale.value })
			.then(response => resolveWidgets(asked, request, id => {
				const entry = response.widgets ? response.widgets[id] : null
				return entry && entry.ok ? entry.data : null
			}))
			.error(() => resolveWidgets(asked, request, () => null))
	}

	function resolveWidgets(ids: string[], request: number, value: (id: string) => unknown) {
		const result = { ...widgetData.value }
		let changed = false
		for (const id of ids) {
			if (widgetRequest[id] !== request) continue
			result[id] = value(id)
			changed = true
		}
		if (changed) widgetData.value = result
	}

	// Dès la construction du composant : la requête part avant le premier rendu,
	// pas au montage de la grille.
	fetchWidgets(widgets.value)

	// Titre du panel : le widget chat précise son canal (« Chat — Général »),
	// avec la même résolution que le widget lui-même : chat de groupe imposé,
	// canal choisi dans les params, sinon chat public de la langue.
	function widgetTitle(widget: WidgetInstance): string {
		const base = t('widget_' + widget.type)
		// Le widget classement précise la catégorie affichée (« Classement — Éleveurs »),
		// sinon deux classements côte à côte portent le même titre.
		if (widget.type === 'classement') return base + ' — ' + t('ranking_' + categoryOf(widget))
		// Le widget statistiques nomme son poireau (« Statistiques de Ail »), pour
		// la même raison : plusieurs peuvent cohabiter sur la page.
		if (widget.type === 'leek_stats') {
			const leek = myLeeks.value.find(l => l.id === leekOf(widget))
			return leek ? t('widget_leek_stats_of', { leek: leek.name }) : base
		}
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
	// Le poireau du widget, validé contre ceux de l'éleveur : un poireau vendu, ou
	// la disposition d'un autre compte, laissait un id inconnu dans les paramètres
	// et le widget s'affichait « aucun poireau » au lieu de retomber sur le premier.
	function leekOf(widget: WidgetInstance): number | undefined {
		const chosen = widget.params.leek as number | undefined
		if (chosen && myLeeks.value.some(l => l.id === chosen)) return chosen
		return myLeeks.value[0]?.id
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
		// L'échelle voyage avec la disposition : sans elle, changer la finesse de la
		// grille écraserait les dispositions existantes. `grid.save()` rend toujours
		// la plus grande disposition connue, jamais celle d'un affichage 1 colonne
		// sur mobile — ces coordonnées sont bien en COLUMNS colonnes.
		return JSON.stringify({ columns: COLUMNS, cellHeight: CELL_HEIGHT, widgets: layout })
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
			cellHeight: CELL_HEIGHT,
			margin: 6,
			float: false,
			staticGrid: true,
			// Poignées de drag : l'icône dédiée ET la barre de titre du panel.
			handle: '.drag-handle, .widget-panel > .header > h2',
			// Par défaut gridstack ne pose que le coin sud-est : il fallait viser un
			// carré de 26 px pour élargir un widget. On ouvre les trois bords utiles
			// — droite (largeur), bas (hauteur), gauche (largeur vers l'arrière) — le
			// coin restant le seul à changer les deux à la fois. Pas de bord nord :
			// la doc de gridstack le déconseille (effets de bord sur la gravité).
			resizable: { handles: 'e, se, s, w' },
			minRow: 1,
			// Pas d'animation à l'arrivée sur la page (les panels « voleraient »
			// en place) ; réactivée après le premier rendu pour le drag & drop.
			animate: false,
			// `columnMax` est OBLIGATOIRE ici : hors de tout point de rupture (donc sur
			// desktop), gridstack ne garde pas `column`, il retombe sur `columnMax`,
			// dont le défaut est 12. Sans cette ligne la grille s'affichait en 12
			// colonnes malgré `column: 24`, et les widgets se rangeaient en pile.
			columnOpts: { breakpointForWindow: true, columnMax: COLUMNS, breakpoints: [{ w: 768, c: 1 }] }
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
		const widget: WidgetInstance = { id, type, x: pos.x, y: pos.y, w: def.defaultW, h: def.defaultH, params: {} }
		widgets.value.push(widget)
		refreshAvailable()
		// Le nouveau venu tout seul : les autres ont déjà leur contenu.
		fetchWidgets([widget])
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
		delete widgetRequest[id]
		if (id in widgetData.value) {
			const rest = { ...widgetData.value }
			delete rest[id]
			widgetData.value = rest
		}
		refreshAvailable()
		persistNow()
	}

	function setParam(widget: WidgetInstance, key: string, value: unknown) {
		widget.params = { ...widget.params, [key]: value }
		persistNow()
		// Seul ce widget change de contenu (autre canal, autre classement, autre
		// poireau) : on ne redemande que lui.
		fetchWidgets([widget])
	}

	// Changement de compte : recharge la disposition et reconstruit la grille.
	// Une sauvegarde en attente est abandonnée : elle appartient à l'ancien compte,
	// l'envoyer maintenant l'écrirait sur le nouveau.
	watch(() => store.state.farmer?.id, () => {
		dropPendingSave()
		widgets.value = parseLayout(store.state.farmer?.home_layout)
		refreshAvailable()
		// Le contenu appartenait à l'ancien compte : on repart de zéro.
		widgetData.value = {}
		fetchWidgets(widgets.value)
		editMode.value = false
		if (grid) {
			grid.destroy(false)
			grid = null
		}
		nextTick(initGrid)
	})

	// Barre d'application (mobile) : elle porte le titre de la page et ses actions,
	// comme sur toutes les autres pages ; l'accueil ne lui donnait ni l'un ni
	// l'autre et affichait sa propre barre de page à la place (retour de Pierre,
	// 2026-09-07 : « la page d'accueil doit avoir un titre et mettre les actions
	// dans la barre en mobile »). Le crayon devient une coche en mode édition.
	const addPopup = ref(false)
	function updateBarActions() {
		LeekWars.setActions([
			{ icon: 'mdi-plus', click: () => { addPopup.value = true } },
			{ icon: editMode.value ? 'mdi-check' : 'mdi-pencil', click: toggleEdit },
		])
	}
	watch(editMode, updateBarActions)

	onMounted(() => {
		previousLarge.value = LeekWars.large
		LeekWars.large = true
		LeekWars.setTitle(t('title'))
		updateBarActions()
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
	// Sur mobile, le titre et les deux actions vivent dans la barre d'application
	// (`setTitle` / `setActions` au montage) : la barre de page n'a plus rien à
	// montrer, elle disparaît entière. Avant, l'accueil était la seule page à y
	// garder un titre et ses onglets, sous une barre d'application vide.
	#app.app.connected .page .page-header.page-bar {
		display: none;
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
	// `overflow-x: hidden` explicite : avec le seul `overflow-y`, l'axe X passe
	// en `auto` et un contenu incompressible (une pastille de talent plus large
	// que sa colonne) fait apparaître une barre de défilement horizontale dans
	// le widget. Un widget de tableau de bord ne défile jamais en largeur.
	.widget-panel:deep(.content) {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
	}
	// Widgets sans défilement interne (noScroll) : le contenu est clippé,
	// la molette fait toujours défiler la page. Le contenu est aussi un
	// container CSS : les widgets adaptent leur mise en page à sa hauteur
	// (@container, unités cq*) pour ne jamais couper le contenu.
	.widget-panel.no-scroll:deep(.content) {
		overflow: hidden;
		container-type: size;
	}
	// Poignée de redimensionnement : gridstack la dessine avec une image SVG en
	// data-URI tracée en `#666` fixe, de 10 px — terne sur le parchemin, presque
	// invisible en thème sombre (Pierre, 2026-09-10 : « l'icône pour resize un
	// widget de la page d'accueil peut être plus grand, visible et beau »).
	// On la redessine : un carré de 20 px au coin du widget, deux traits
	// diagonaux à l'encre du thème (le motif universel de la poignée), qui
	// passent au vert quand la souris est sur le widget.
	.grid-stack.editing :deep(.ui-resizable-se) {
		box-sizing: border-box;
		width: 26px;
		height: 26px;
		padding: 0;
		// La poignée se cale sur le coin de l'ITEM gridstack, qui déborde du
		// panneau de la marge de 6 px que gridstack pose autour de chaque item :
		// elle tombait donc dans la gouttière, hors de la carte (Pierre,
		// 2026-09-10 : « l'icône est en dehors, il faudrait qu'elle soit à
		// l'intérieur », puis « plus grande et colle le bord du panel »).
		// 6 px de marge + 1 px de bordure de panneau : elle touche le bord
		// intérieur, en bas à droite.
		right: 7px;
		bottom: 7px;
		opacity: 1;
		color: var(--text-color-secondary);
		transition: color .12s ease, background-color .12s ease;
		border: 0;
		background: none;
		// LA cause des trois dessins ratés : gridstack pose `transform:
		// rotate(-45deg)` sur cette poignée (son image est une double flèche
		// VERTICALE, qu'il redresse en diagonale par cette rotation). Tout ce
		// qu'on dessinait dedans tournait donc de 45° de plus — d'où les traits
		// verticaux que Pierre voyait (« l'icône resize sur la page home est
		// étrange », puis « encore pire »). On annule la rotation et on dessine
		// la diagonale nous-mêmes.
		transform: none;
	}
	// Le grip en biais : deux traits parallèles à la diagonale, tournés de 45°
	// autour de leur extrémité droite pour se caler dans le coin.
	.grid-stack.editing :deep(.ui-resizable-se)::before,
	.grid-stack.editing :deep(.ui-resizable-se)::after {
		content: '';
		position: absolute;
		// Le CARRÉ, lui, touche le bord (c'est la cible de survol) ; les traits
		// sont rentrés de 8 px pour ne pas mourir sur le cadre du panneau
		// (Pierre, 2026-09-10 : « le fond doit être collé […] mais l'icône doit
		// quand même être un peu plus à l'intérieur »).
		right: 8px;
		height: 2px;
		background: currentColor;
		transform-origin: 100% 50%;
		transform: rotate(-45deg);
	}
	.grid-stack.editing :deep(.ui-resizable-se)::before {
		bottom: 19px;
		width: 17px;
	}
	.grid-stack.editing :deep(.ui-resizable-se)::after {
		bottom: 12px;
		width: 10px;
	}
	// Deux crans de survol : la poignée sort de l'ombre dès que la souris entre
	// dans le widget, et s'allume vraiment quand on la vise — un aplat vert pâle
	// sous le grip, comme les autres cibles cliquables du thème.
	.grid-stack.editing .grid-stack-item:hover :deep(.ui-resizable-se) {
		color: var(--text-color);
	}
	.grid-stack.editing :deep(.ui-resizable-se):hover {
		color: var(--primary);
		background: color-mix(in srgb, var(--primary) 16%, transparent);
	}
	// Poignées de bord (est, ouest, sud). Gridstack ne leur donne aucun dessin :
	// juste une bande de 10 px avec le bon curseur. On les élargit un peu et on
	// les révèle au survol par une barre verte posée sur le bord du panneau —
	// sans quoi rien n'indique qu'on peut tirer un côté, alors que c'est le geste
	// naturel pour changer une largeur (le coin reste le seul à faire les deux).
	// Les bandes s'arrêtent avant le coin sud-est pour ne pas lui disputer la place.
	.grid-stack.editing :deep(.ui-resizable-e) {
		width: 14px;
		top: 20px;
		bottom: 36px;
	}
	.grid-stack.editing :deep(.ui-resizable-w) {
		width: 14px;
		top: 20px;
		bottom: 20px;
	}
	.grid-stack.editing :deep(.ui-resizable-s) {
		height: 14px;
		left: 30px;
		right: 36px;
	}
	.grid-stack.editing :deep(.ui-resizable-e)::after,
	.grid-stack.editing :deep(.ui-resizable-w)::after,
	.grid-stack.editing :deep(.ui-resizable-s)::after {
		content: '';
		position: absolute;
		border-radius: 3px;
		background: var(--primary);
		opacity: 0;
		transition: opacity .12s ease;
	}
	// 1 px vers l'intérieur : la barre se pose sur la bordure du panneau, pas
	// dans la gouttière que gridstack laisse autour de l'item.
	.grid-stack.editing :deep(.ui-resizable-e)::after,
	.grid-stack.editing :deep(.ui-resizable-w)::after {
		top: 0;
		bottom: 0;
		width: 3px;
	}
	.grid-stack.editing :deep(.ui-resizable-e)::after {
		right: 1px;
	}
	.grid-stack.editing :deep(.ui-resizable-w)::after {
		left: 1px;
	}
	.grid-stack.editing :deep(.ui-resizable-s)::after {
		left: 0;
		right: 0;
		bottom: 1px;
		height: 3px;
	}
	.grid-stack.editing :deep(.ui-resizable-e):hover::after,
	.grid-stack.editing :deep(.ui-resizable-w):hover::after,
	.grid-stack.editing :deep(.ui-resizable-s):hover::after {
		opacity: 1;
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
		background: var(--primary-surface);
		color: var(--primary-surface-text);
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
	// Bouton de sortie du mode édition, flottant au bas de la fenêtre. La barre
	// couvre toute la largeur pour centrer le bouton, mais laisse passer les
	// clics : seul le bouton est cliquable, on doit pouvoir déplacer un widget
	// qui passe dessous. Le bouton est un `v-btn` d'accent et non un `.button`
	// du site : ce dernier n'a de surface que dans un en-tête de panel, il
	// arriverait ici sans fond. Le thème v3 lui donne l'aplat et l'ombre pixel.
	.validate-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 20px;
		z-index: 100;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}
	.validate-bar .v-btn {
		pointer-events: auto;
	}
	// Le dernier widget reste atteignable sous le bouton flottant.
	.grid-stack.editing {
		padding-bottom: 60px;
	}
</style>
