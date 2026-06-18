<template>
	<div class="hud" :class="{dark: game.autoDark ? (game.map && game.map.options.dark) : game.dark}">
		<div v-if="!creator" class="life-bar">
			<div class="wrapper">
				<template v-for="team in game.teams">
					<v-tooltip v-for="entity in team.filter(e => !e.dead)" :key="entity.id" top>
						<template #activator="{ props }">
							<div :style="{background: entity.lifeBarGadient, width: Math.max(1, barWidth * (entity.displayLife / totalLife) - 3) + 'px'}" class="bar" v-bind="props"></div>
						</template>
						<span v-if="entity instanceof Mob">{{ $t('entity.' + entity.name) }}</span>
						<span v-else>{{ entity.name }}</span>
						({{ Math.round(entity.displayLife) }})
					</v-tooltip>
				</template>
			</div>
		</div>
		<div v-if="debug" class="debug">
			<div>Particles : {{ game.particles.particles.length }}</div>
			<div>Mouse : ({{ game.mouseX }}, {{ game.mouseY }})</div>
			<div>Mouse tile : ({{ game.mouseTileX }}, {{ game.mouseTileY }})</div>
			<div>Mouse cell : <span v-if="game.mouseCell">{obstacle: {{ game.mouseCell.obstacle }}, entity: <span v-if="game.mouseCell.entity">{{ game.mouseCell.entity.name }}</span>, id: {{ game.mouseCell.id }}, x: {{ game.mouseCell.x }}, y: {{ game.mouseCell.y }}}</span></div>
			<div>FPS : {{ game.fps }}, avg: {{ game.avgFPS }}</div>
			<div>Resources : {{ game.numData }}</div>
		</div>
		<div v-if="!creator && !LeekWars.mobile" class="timeline" :class="{large: !game.showActions}" :style="{left: (game.showActions ? (game.largeActions ? actionsWidth + 5 : 400) : 0) + 'px'}">
			<v-tooltip v-for="(entity, e) of game.entityOrder" :key="e" location="top">
				<template #activator="{ props }">
					<div :class="{summon: entity.summon, current: entity.id === game.currentPlayer, dead: entity.dead}" :style="{background: entity === game.selectedEntity || entity === game.mouseEntity ? '#fffc' : (entity.id === game.currentPlayer ? entity.color : entity.gradient)}" class="entity" v-bind="props" @mouseenter="entity_enter(entity)" @mouseleave="entity_leave(entity)" @click="entity_click(entity)">
						<div v-if="!entity.dead" :style="{height: 'calc(6px + ' + ((entity.displayLife / entity.maxLife) * 100) + '%)', background: entity.lifeColor, 'border-color': entity.lifeColorLighter}" class="bar"></div>
						<div class="image">
							<img v-if="entity.summon" :src="'/image/bulb/' + entity.bulbName + '_front.png'">
							<turret-image v-else-if="(entity instanceof Turret)" :level="entity.level" :skin="entity.team" :scale="1" />
							<img v-else-if="(entity instanceof Chest)" :src="'/image/chest/' + entity.name + '.png'">
							<img v-else-if="(entity instanceof Mob)" :src="'/image/mob/' + entity.name + '.png'">
							<leek-image v-else :leek="entity" :scale="1" />
						</div>
					</div>
				</template>
				<span v-if="entity instanceof Mob">{{ $t('entity.' + entity.name) }}</span>
				<span v-else-if="entity.summon">{{ entity.translatedName }}</span>
				<span v-else>{{ entity.name }}</span>
			</v-tooltip>
		</div>
		<div v-if="!creator && !LeekWars.mobile && game.showActions && actionsWidth > 0" ref="actionsRef" class="fight-actions" :class="{large: game.largeActions, scrolled: !followBottom}" :style="{'width': game.largeActions ? actionsWidth + 'px' : '', 'max-width': game.largeActions ? Math.max(600, actionsWidth) + 'px' : ''}" @scroll.passive="onActionsScroll" @wheel.passive="onActionsWheel">
			<div v-if="renderStart > 0" class="load-marker">…</div>
			<template v-for="line of renderedLines">
				<component :is="ActionComponents[line.action.type]" v-if="line.action" :key="line.id" :action="line.action" :leeks="game.leeks" />
				<div v-else-if="line.trophy" :key="line.id" class="notif-trophy">
					<trophy-icon :code="line.trophy.name" />
					<i18n-t keypath="trophy.x_unlocks_t">
						<template #farmer>{{ line.trophy.farmer.name }}</template>
						<template #trophy>
							<b>{{ $t('trophy.' + line.trophy.name) }}</b>
						</template>
					</i18n-t>
				</div>
				<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
				<action-log v-else-if="game.displayDebugs && line.log" :key="'_' + line.id" :log="(line.log as any)" :leeks="(game.leeks as any)" :action="0" :index="0" :lines="game.displayAILines" />
			</template>
			<div v-if="!followBottom && renderEnd < game.consoleLines.length" class="load-marker bottom">…</div>
		</div>
		<div v-if="!creator && game.showActions && game.largeActions" class="resizer" :style="{left: actionsWidth + 'px'}" @mousedown="resizerMousedown"></div>
		<entity-details v-if="game.mouseEntity" :entity="game.mouseEntity" :game="game" :dark="game.autoDark ? (game.map && game.map.options.dark) : game.dark" />
		<entity-details v-else-if="game.selectedEntity" :entity="game.selectedEntity" :game="game" :dark="game.autoDark ? (game.map && game.map.options.dark) : game.dark" />
		<entity-details v-else-if="!LeekWars.mobile && game.currentPlayer !== null && game.currentPlayer in game.leeks" :entity="game.leeks[game.currentPlayer]" :game="game" :dark="game.autoDark ? (game.map && game.map.options.dark) : game.dark" />
	</div>
</template>

<script setup lang="ts">
	import EntityDetails from '@/component/player/entity-details.vue'
	import ActionLeek from '@/component/report/action-leek.vue'
	import { ActionComponents as ActionComponentsTyped } from '@/model/action-components'
	import { LeekWars } from '@/model/leekwars'
	import { Chest } from './game/chest'
	import { Mob } from './game/mob'
	import { Game } from './game/game'
	import { FightEntity } from './game/entity'
	import { Turret } from './game/turret'
	import TurretImage from '@/component/turret-image.vue'
	import ActionLog from '../report/report-log.vue'
	import type { Component } from 'vue'
	import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

	defineOptions({ name: 'Hud', components: { leek: ActionLeek } })

	const props = defineProps<{
		game: Game
		creator?: boolean
	}>()

	const ActionComponents: Record<number, Component> = ActionComponentsTyped

	const debug = ref(false)
	const actionsWidth = ref(395)

	const barWidth = computed(() => LeekWars.mobile ? 300 : 500)
	const totalLife = computed(() => props.game.leeks.reduce((total, e) => total + (!e.summon ? e.displayLife : 0), 0))
	actionsWidth.value = props.game.actionsWidth

	const MAX_WINDOW = 250
	const LOAD_CHUNK = 80
	const SCROLL_THRESHOLD = 80
	const PRELOAD_RATIO = 0.5
	const AT_EDGE_TOLERANCE = 5

	const actionsRef = ref<HTMLElement | null>(null)
	const followBottom = ref(true)
	const renderStart = ref(0)
	const renderEnd = ref(0)

	function windowBounds() {
		const length = props.game.consoleLines.length
		if (followBottom.value) {
			return { start: Math.max(0, length - MAX_WINDOW), end: length, length }
		}
		return { start: renderStart.value, end: renderEnd.value, length }
	}

	const renderedLines = computed(() => {
		const { start, end } = windowBounds()
		return props.game.consoleLines.slice(start, end)
	})

	function scrollToBottom() {
		const el = actionsRef.value
		if (el) el.scrollTop = el.scrollHeight
	}

	watch(() => props.game.consoleLines.length, (newLen) => {
		if (!followBottom.value) return
		renderEnd.value = newLen
		renderStart.value = Math.max(0, newLen - MAX_WINDOW)
		nextTick(scrollToBottom)
	})

	// `game.jump()` est entièrement synchrone : `jumping` passe true puis false
	// dans le même tick. Avec le flush par défaut ('pre'), Vue compare au flush
	// la valeur finale à l'initiale et ne voit rien changer → le watcher ne
	// fire pas. `flush: 'sync'` exécute le callback à chaque mutation, donc on
	// capte bien la transition false → true → false et on resynchronise.
	watch(() => props.game.jumping, (jumping) => {
		if (jumping) return
		followBottom.value = true
		resizeAnchor = null
		const len = props.game.consoleLines.length
		renderEnd.value = len
		renderStart.value = Math.max(0, len - MAX_WINDOW)
		nextTick(scrollToBottom)
	}, { flush: 'sync' })

	watch(() => props.game.largeActions, () => {
		if (followBottom.value) nextTick(scrollToBottom)
	})

	// Au resize (hover/leave, large mode, changement de contenu), on re-bottoms
	// si followBottom, sinon on restaure l'ancre visuelle capturée au scroll
	// pour éviter le décalage dû au re-wrapping du texte (largeur 395 → 600).
	let resizeObserver: ResizeObserver | null = null
	let resizeAnchor: Anchor | null = null
	onMounted(() => {
		nextTick(() => {
			const el = actionsRef.value
			if (!el) return
			scrollToBottom()
			resizeObserver = new ResizeObserver(() => {
				const target = actionsRef.value
				if (!target) return
				if (followBottom.value) {
					target.scrollTop = target.scrollHeight
				} else if (resizeAnchor) {
					restoreAnchor(target, resizeAnchor)
				}
			})
			resizeObserver.observe(el)
		})
	})
	onBeforeUnmount(() => {
		resizeObserver?.disconnect()
		resizeObserver = null
	})

	let loadingMore = false

	// Mémorise le DERNIER enfant visible (en bas du viewport) et son offset
	// par rapport au bas du viewport. Au resize/re-render on restaure cet item
	// au même bord bas → la vue réduite montre la queue de la vue agrandie.
	function captureAnchor(el: HTMLElement) {
		const prevScrollTop = el.scrollTop
		const viewportBottom = prevScrollTop + el.clientHeight
		for (let i = el.children.length - 1; i >= 0; i--) {
			const child = el.children[i] as HTMLElement
			if (child.offsetTop < viewportBottom) {
				return {
					index: i,
					offsetFromBottom: viewportBottom - (child.offsetTop + child.offsetHeight),
					prevScrollTop,
				}
			}
		}
		return { index: -1, offsetFromBottom: 0, prevScrollTop }
	}

	type Anchor = ReturnType<typeof captureAnchor>

	function restoreAnchor(el: HTMLElement, anchor: Anchor, indexShift = 0) {
		const target = anchor.index >= 0 ? el.children[anchor.index + indexShift] as HTMLElement | undefined : undefined
		if (target) {
			const newViewportBottom = (target.offsetTop + target.offsetHeight) + anchor.offsetFromBottom
			el.scrollTop = Math.max(0, newViewportBottom - el.clientHeight)
		} else {
			el.scrollTop = anchor.prevScrollTop
		}
	}

	function loadDirection(direction: -1 | 1) {
		if (loadingMore) return
		const el = actionsRef.value
		if (!el) return
		const w = windowBounds()
		if (direction < 0 ? w.start <= 0 : w.end >= w.length) return
		loadingMore = true
		const anchor = captureAnchor(el)
		let newStart = w.start
		let newEnd = w.end
		if (direction < 0) {
			newStart = Math.max(0, w.start - LOAD_CHUNK)
			if (newEnd - newStart > MAX_WINDOW) newEnd = newStart + MAX_WINDOW
			followBottom.value = false
		} else {
			newEnd = Math.min(w.length, w.end + LOAD_CHUNK)
			if (newEnd - newStart > MAX_WINDOW) newStart = newEnd - MAX_WINDOW
		}
		const indexShift = w.start - newStart
		renderStart.value = newStart
		renderEnd.value = newEnd
		nextTick(() => {
			const el2 = actionsRef.value
			if (el2) {
				restoreAnchor(el2, anchor, indexShift)
				// Les indices dans inner.children ont shifté : on re-capture pour
				// que le prochain ResizeObserver (hover/leave) restaure
				// correctement la position.
				if (!followBottom.value) resizeAnchor = captureAnchor(el2)
			}
			loadingMore = false
		})
	}

	function onActionsScroll() {
		if (loadingMore) return
		const el = actionsRef.value
		if (!el) return
		const w = windowBounds()
		const preloadThreshold = Math.max(SCROLL_THRESHOLD, el.clientHeight * PRELOAD_RATIO)
		const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
		const nearTop = el.scrollTop < preloadThreshold
		const nearBottom = distanceFromBottom < preloadThreshold
		const atBottom = distanceFromBottom < SCROLL_THRESHOLD

		if (nearTop && w.start > 0) return loadDirection(-1)
		if (nearBottom && w.end < w.length) return loadDirection(1)

		if (atBottom && w.end >= w.length && !followBottom.value) {
			followBottom.value = true
			resizeAnchor = null
			renderEnd.value = w.length
			renderStart.value = Math.max(0, w.length - MAX_WINDOW)
			nextTick(scrollToBottom)
			return
		}

		if (followBottom.value && !atBottom) {
			followBottom.value = false
			renderStart.value = w.start
			renderEnd.value = w.end
		}

		if (!followBottom.value) resizeAnchor = captureAnchor(el)
	}

	function onActionsWheel(e: WheelEvent) {
		// MAX_WINDOW saturé + trim symétrique → scrollHeight constant, scrollTop
		// reste collé au bord → plus d'événement scroll. Le wheel reste actif.
		if (loadingMore) return
		const el = actionsRef.value
		if (!el) return
		const w = windowBounds()
		if (e.deltaY < 0) {
			if (el.scrollTop > AT_EDGE_TOLERANCE || w.start <= 0) return
			loadDirection(-1)
		} else {
			if (el.scrollHeight - el.scrollTop - el.clientHeight > AT_EDGE_TOLERANCE || w.end >= w.length) return
			loadDirection(1)
		}
	}

	function entity_enter(entity: FightEntity) {
		// eslint-disable-next-line vue/no-mutating-props
		props.game.hoverEntity = entity
		props.game.hoverEntity!.updateReachableCells()
	}
	function entity_leave(_entity: FightEntity) {
		// eslint-disable-next-line vue/no-mutating-props
		props.game.hoverEntity = null
	}
	function entity_click(entity: FightEntity) {
		props.game.selectEntity(entity)
	}

	function resizerMousedown(e: MouseEvent) {
		const startWidth = actionsWidth.value
		const startX = e.clientX
		const visible = actionsWidth.value > 0
		const mousemove = (ev: MouseEvent) => {
			let panelWidth = Math.max(0, Math.min(1000, startWidth + ev.clientX - startX))
			if (visible && panelWidth < 60) {
				panelWidth = 0
			}
			actionsWidth.value = panelWidth
		}
		const mouseup = () => {
			document.documentElement!.removeEventListener('mousemove', mousemove)
			document.documentElement!.removeEventListener('mouseup', mouseup)
			// eslint-disable-next-line vue/no-mutating-props
			props.game.actionsWidth = actionsWidth.value
			if (props.game.actionsWidth === 0) {
				// eslint-disable-next-line vue/no-mutating-props
				props.game.largeActions = false
				actionsWidth.value = 395
			}
		}
		document.documentElement!.addEventListener('mousemove', mousemove, false)
		document.documentElement!.addEventListener('mouseup', mouseup, false)
		e.preventDefault()
	}

</script>

<style lang="scss" scoped>
	.hud {
		color: #111;
	}
	.timeline {
		position: absolute;
		bottom: 5px;
		left: 400px; right: 400px;
		text-align: center;
		white-space: nowrap;
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 2px;
		&.large {
			left: 0;
		}
	}
	.timeline .entity {
		display: inline-flex;
		vertical-align: bottom;
		flex: 0 1 65px;
		height: 100px;
		min-width: 0;
		padding: 3px 0;
		position: relative;
		border-top-left-radius: 3px;
		border-top-right-radius: 3px;
		align-items: flex-end;
		cursor: pointer;
		min-width: 0;
		&.current:before {
			content: "";
			position: absolute;
			left: calc(50% - 18px);
			top: -10px;
			width: 36px;
			height: 20px;
			background-image: url('../../../public/image/fight/arrow.svg');
			background-size: cover;
		}
	}
	.timeline .entity.dead {
		opacity: 0.3;
	}
	.timeline .entity .bar {
		flex: 7px 0 0;
		border-top-left-radius: 3px;
		border: 1px solid black;
		margin-top: -3px;
		margin-bottom: -3px;
	}
	.timeline .entity .image {
		max-width: 100%;
		max-height: 100%;
		overflow: hidden;
		padding: 0 4px;
	}
	.timeline .entity .image svg, .timeline .entity .image img {
		max-width: 50px;
		max-height: 80px;
	}
	.timeline .entity.summon {
		flex: 0 1 50px;
		height: 60px;
	}
	.timeline .entity.summon.current {
		width: 51px;
		height: 61px;
	}
	.timeline .entity.summon .bar {
		margin-right: 4px;
	}
	.timeline .entity.summon img {
		max-width: 30px;
		max-height: 50px;
	}
	.timeline .entity:hover .details, .details.visible {
		display: block;
	}
	.life-bar {
		position: absolute;
		top: 0; left: 0; right: 0;
		text-align: center;
	}
	#app.app .life-bar {
		transform: scale(0.7);
		transform-origin: top;
	}
	.life-bar .wrapper {
		display: inline-block;
		background: #fffa;
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
		padding-top: 3px;
		padding-left: 4px;
		padding-bottom: 0px;
		padding-right: 1px;
		height: 16px;
	}
	.hud.dark .life-bar .wrapper {
		background: #000a;
	}
	.life-bar .bar {
		display: inline-block;
		margin-right: 3px;
		height: calc(100% - 3px);
		vertical-align: top;
	}
	.life-bar .bar.dead {
		margin-right: 0px;
	}
	.life-bar .wrapper :first-of-type {
		border-bottom-left-radius: 10px;
	}
	.life-bar .wrapper :last-of-type {
		border-bottom-right-radius: 10px;
	}
	.fight-actions {
		text-align: left;
		max-height: 100px;
		width: 395px;
		overflow: hidden;
		overscroll-behavior: contain;
		position: absolute;
		background: #fff;
		border-top-right-radius: 5px;
		box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);
		left: 0;
		bottom: 5px;
		padding: 6px;
		padding-bottom: 10px;
		display: flex;
		flex-direction: column;
		// `margin-top: auto` sur le 1er enfant équivaut à `min-height: 100%` sur
		// un wrapper : quand le contenu rentre, le bloc s'absorbe l'espace
		// libre et pousse les items en bas. Quand ça déborde, ce margin se
		// résorbe à 0 et le contenu fluit naturellement, donc `scrollHeight`
		// reste correct (pas de bug Chromium comme avec `justify-content: flex-end`).
		& > *:first-child {
			margin-top: auto;
		}
		&::-webkit-scrollbar {
			width: 4px;
		}
		&:not(.large) {
			&:hover {
				max-height: calc(100% - 5px);
				height: auto;
				width: 600px !important;
				background-color: #f2f2f2ee;
				border-top-right-radius: 0;
				overflow-y: auto;
			}
			.log {
				width: 600px;
			}
		}
		&.large {
			height: calc(100% - 5px);
			max-height: calc(100% - 5px);
			max-width: 1000px;
			border-top-right-radius: 0;
			background-color: #fff;
			overflow-y: auto;
			&:hover {
				width: max(100%, 600px) !important;
				background-color: #f2f2f2dd;
			}
		}
		& > div:not(.load-marker) {
			font-size: 14px;
			width: max(588px, 100%);
		}
		& > pre {
			width: max(588px, 100%);
		}
		.load-marker {
			text-align: center;
			color: #888;
			font-size: 12px;
			padding: 4px 0;
			user-select: none;
		}
	}
	.resizer {
		position: absolute;
		width: 30px;
		margin-left: -15px;
		bottom: 0;
		top: 0;
		cursor: ew-resize;
		z-index: 5;
		user-select: none;
		&:hover {
			background: #7773;
		}
	}
	.hud.dark {
		.fight-actions {
			background-color: #222;
			color: #eee;
			&:hover {
				background-color: #222d;
			}
		}
	}
	.debug {
		position: absolute;
		top: 0;
		left: 0;
		text-align: left;
		background: rgba(255,255,255,0.9);
		padding: 5px;
		pointer-events: none;
	}
	.pause {
		color: #999;
	}
	.warning {
		color: #ff5f00;
	}
	.error {
		color: #ff1900;
	}
	.notif-trophy {
		color: black;
		padding: 4px;
		display: flex;
		align-items: center;
		white-space: nowrap;
		gap: 6px;
		margin: 5px 0;
		img {
			width: 36px;
		}
	}
	#app.app .details-wrapper {
		transform: scale(0.5);
		transform-origin: bottom right;
	}
</style>