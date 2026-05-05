<template lang="html">
	<div ref="player" :style="{width: totalWidth + 'px', height: totalHeight + 'px'}">
		<div v-if="!loaded" class="loading">
			<template v-if="fight">
				<div v-if="fight.type === FightType.BATTLE_ROYALE" class="table br">
					<template v-for="(leek, i) in fight.leeks1" :key="leek.id">
						<div class="leek br">
							<leek-image :leek="leek" :scale="1" />
							<div class="name">{{ leek.name }}</div>
							<lw-title v-if="leek.title && leek.title.length" :title="leek.title" />
							<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
						</div>
						<img v-if="i < fight.leeks1.length - 1" :key="leek.id + 'vs'" class="vs" src="/image/vs.png">
					</template>
					<br><br>
				</div>
				<div v-else class="table">
					<div class="team" :style="teamGrid(fight.leeks1.length)">
						<div v-for="leek in fight.leeks1" :key="leek.id" class="leek">
							<leek-image :leek="leek" :scale="1" />
							<div class="name">{{ leek.name }}</div>
							<lw-title v-if="leek.title && leek.title.length" :title="leek.title" />
							<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
						</div>
					</div>
					<img class="vs" src="/image/vs.png">
					<div class="team" :style="teamGrid(fight.leeks2.length)">
						<div v-for="leek in fight.leeks2" :key="leek.id" class="leek">
							<template v-if="leek.chest">
								<img :src="'/image/chest/' + leek.name + '.png'" class="chest-img" />
								<div class="name">{{ $t('entity.' + leek.name) }}</div>
							</template>
							<template v-else>
								<leek-image :leek="leek" :scale="1" :invert="true" />
								<div v-if="leek.boss" class="name">{{ $t('entity.' + leek.name) }}</div>
								<div v-else class="name">{{ leek.name }}</div>
								<lw-title v-if="leek.title && leek.title.length" :title="leek.title" />
								<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
							</template>
						</div>
					</div>
				</div>
			</template>
			<div v-if="error" class="error">
				<img src="/image/notgood.png">
				<br>
				<h4 v-if="error === 'fight_not_found'">{{ $t('error_not_found') }}</h4>
				<h4 v-else-if="error === 'fight_with_secret_trophy'">{{ $t('error_secret_trophy') }}</h4>
				<h4 v-else>{{ $t('error_generating_fight') }}<br><br><i>{{ $t('admin_noticed') }}</i></h4>
			</div>
			<div v-else class="loading-fight">
				<loader v-if="!LeekWars.mobile" />
				<div class="loading-bar">
					<span :style="{width: progress + '%'}" class="bar striked"></span>
				</div>
				<div v-if="queue" class="queue-position">
					<span v-if="queue.position <= 0">
						{{ $t('generating') }}
						<span class="status">
							{{ progress }}%
						</span>
					</span>
					<span v-else>{{ $t('position_in_queue', [queue.position + 1, queue.total]) }}</span>
				</div>
			</div>
		</div>
		<div v-show="loaded" class="game" :class="{horizontal}">
			<div :style="{width: width + 'px', height: (height + (creator ? 0 : 6)) + 'px'}" class="layers">
				<canvas :style="{width: width + 'px'}" class="bg-canvas"></canvas>
				<canvas :style="{width: width + 'px'}" class="game-canvas" @click="canvasClick" @contextmenu="canvasRightClick" @mousemove="mousemove" @mouseup="mouseup" @mousedown="mousedown"></canvas>
				<div v-if="!creator" class="progress-bar-wrapper">
					<div ref="progressBarTooltip" :style="{'margin-left': progressBarTooltipMargin + 'px'}" class="progress-bar-turn v-tooltip__content top">
						<span class="content">{{ $t('fight.turn_n', [progressBarTurn]) }}</span>
					</div>
					<div ref="progressBar" class="progress-bar" @click="progressBarClick" @mousemove="progressBarMove">
						<div :style="{width: progressBarWidth + '%'}" class="bar"></div>
						<span v-for="marker in game.progressBarMarkers">
							<div class="marker" :style="{left: marker.left + '%', width: marker.width + '%', background: marker.background, outline: marker.outline}"></div>
						</span>
						<div class="circle" :style="{left: progressBarWidth + '%'}"></div>
						<div class="preview-bar" :style="{width: progressBarPreviewWidth + '%'}"></div>
					</div>
				</div>
				<hud ref="hud" :game="(game as Game)" :creator="creator" />
				<v-tooltip v-if="hasMarks" :open-delay="0" :close-delay="0" location="bottom" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="clear-marks" v-bind="props" @click="game.clearMarks()">mdi-eraser</v-icon>
					</template>
					{{ $t('clear_marks') }} (M)
				</v-tooltip>
				<transition v-if="!creator" name="fade">
					<v-icon v-if="game.paused" class="play-pause">mdi-pause</v-icon>
				</transition>
				<transition v-if="!creator" name="fade">
					<v-icon v-if="!game.paused" class="play-pause">mdi-play</v-icon>
				</transition>
			</div>

			<div v-if="!creator" class="controls controls-a">
				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" @click="pause" v-bind="props">{{ game.paused ? 'mdi-play' : 'mdi-pause' }}</v-icon>
					</template>
					{{ $t('pause') }} (P)
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" :style="{opacity: game.speedButtonVisible ? 1 : 0}" v-bind="props" @click="game.speedUp()">mdi-fast-forward</v-icon>
					</template>
					{{ $t('accelerate') }} (S)
				</v-tooltip>
				<v-tooltip v-if="!LeekWars.mobile" :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" v-bind="props" @click="game.previousAction()">mdi-skip-previous</v-icon>
					</template>
					{{ $t('previous_action') }} (←)
				</v-tooltip>
				<v-tooltip v-if="!LeekWars.mobile" :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" v-bind="props" @click="game.nextAction()">mdi-skip-next</v-icon>
					</template>
					{{ $t('next_action') }} (→)
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" v-bind="props" @click="game.sound = !game.sound">{{ game.sound ? 'mdi-volume-high' : 'mdi-volume-low' }}</v-icon>
					</template>
					{{ $t(game.sound ? 'sound_activated' : 'sound_disactivated') }} (V)
				</v-tooltip>
				<v-tooltip v-if="game.sound && !LeekWars.mobile" :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<input type="range" min="0" max="1" step="0.01" style="width: 100px; padding: 0" v-model="game.volume">
					</template>
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props: tooltipProps }">
						<v-menu :close-on-content-click="false" :width="390" location="top" offset-y right :attach="playerAttach">
							<template #activator="{ props: menuProps }">
								<div v-ripple class="control turn" v-bind="{...tooltipProps, ...menuProps}">{{ horizontal ? game.turn : $t('fight.turn_n', [game.turn]) }}</div>
								<!-- <v-icon class="control" >mdi-cog-outline</v-icon> -->
							</template>
							<v-list :dense="true" class="settings-menu">
								<div class="section">{{ $t('fight.share') }}</div>
								<v-list-item prepend-icon="mdi-share-variant">
									<input type="text" :value="document.location.host + '/fight/' + fightId + '?action=' + game.currentAction" @keyup.stop>
								</v-list-item>
								<v-list-item prepend-icon="mdi-share-variant">
									<input type="text" :value="document.location.host + '/fight/' + fightId + '?turn=' + game.turn" @keyup.stop>
								</v-list-item>
							</v-list>
						</v-menu>
					</template>
					{{ $t('fight.share') }}
				</v-tooltip>
			</div>
			<div v-else class="controls controls-a">
				test
			</div>

			<div class="controls constrols-b">

				<v-tooltip v-if="!creator && $store.state.farmer && $store.state.farmer.admin" :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props: tooltipProps }">
						<v-menu :close-on-content-click="false" top offset-y left>
							<template #activator="{ props: menuProps }">
								<v-icon v-ripple class="control" v-bind="{...tooltipProps, ...menuProps}">mdi-map</v-icon>
							</template>
							<v-radio-group v-model="game.mapType" class="map-menu" hide-details :mandatory="true">
								<v-radio v-for="(map, m) of game.maps" :key="m" :label="map.constructor.name" :value="m" />
							</v-radio-group>
						</v-menu>
					</template>
					Carte
				</v-tooltip>

				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" v-bind="props" @click="toggleFullscreen">mdi-aspect-ratio</v-icon>
					</template>
					{{ $t('fullscreen') }}
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props: tooltipProps }">
						<v-menu :close-on-content-click="false" top offset-y left :attach="playerAttach">
							<template #activator="{ props: menuProps }">
								<v-icon v-ripple class="control" v-bind="{...tooltipProps, ...menuProps}">mdi-cog-outline</v-icon>
							</template>
							<v-list density="compact" class="settings-menu">
								<div class="section">INTERFACE</div>
								<v-list-item v-ripple @click="game.showLifes = !game.showLifes" prepend-icon="mdi-heart-half-full">
									<v-switch :model-value="game.showLifes" :label="$t('display_life_bars') + ' (L)'" hide-details />
								</v-list-item>
								<v-list-item :ripple="game.showLifes" :class="{disabled: !game.showLifes}" @click="game.showLifes ? (game.showEffects = !game.showEffects) : null" prepend-icon="mdi-flare">
									<v-switch :model-value="game.showEffects" :disabled="!game.showLifes" :label="$t('display_effects') + ' (E)'" hide-details />
								</v-list-item>
								<v-list-item v-if="!LeekWars.mobile" v-ripple @click="game.showActions = !game.showActions" prepend-icon="mdi-format-list-bulleted">
									<v-switch :model-value="game.showActions" :label="$t('show_actions') + ' (A)'" hide-details />
								</v-list-item>
								<v-list-item v-if="!LeekWars.mobile" :ripple="game.showActions" :class="{disabled: !game.showActions}" @click="game.showActions ? (game.largeActions = !game.largeActions) : null" prepend-icon="mdi-view-split-vertical">
									<v-switch :model-value="game.largeActions" :disabled="!game.showActions" :label="$t('large_actions') + ' (G)'" hide-details />
								</v-list-item>
								<v-list-item v-if="!LeekWars.mobile" :ripple="game.displayDebugs" :class="{disabled: !game.showActions}" @click="game.showActions ? (game.displayDebugs = !game.displayDebugs) : null" prepend-icon="mdi-math-log">
									<v-switch :model-value="game.displayDebugs" :disabled="!game.showActions" :label="$t('display_logs') + ' (D)'" hide-details />
									<template #append>
										<v-checkbox v-model="game.displayAILines" :disabled="!game.showActions || !game.displayDebugs" :class="{disabled: !game.showActions || !game.displayDebugs}" label="Lignes" hide-details class="ally-debug" @click.stop />
										<v-checkbox v-model="game.displayAllyDebugs" :disabled="!game.showActions || !game.displayDebugs" :class="{disabled: !game.showActions || !game.displayDebugs}" label="Alliés" hide-details class="ally-debug" @click.stop />
									</template>
								</v-list-item>
								<div class="section">GRAPHISMES</div>
								<v-list-item v-ripple @click="game.shadows = !game.shadows" prepend-icon="mdi-box-shadow">
									<v-switch :model-value="game.shadows" :label="$t('display_shadows') + ' (O)'" hide-details />
								</v-list-item>
								<v-list-item prepend-icon="mdi-weather-night">
									<v-switch v-if="!game.autoDark" v-model="game.dark" :label="$t('dark_mode') + ' (N)'" class="night" hide-details />
									<template #append>
										<v-checkbox v-model="game.autoDark" label="Auto" hide-details />
									</template>
								</v-list-item>
								<div class="section">DEVELOPEMENT</div>
								<v-list-item v-ripple @click="game.tactic = !game.tactic" prepend-icon="mdi-view-comfy">
									<v-switch :model-value="game.tactic" :label="$t('tactic_mode') + ' (T)'" hide-details />
								</v-list-item>
								<v-list-item v-ripple @click="game.plainBackground = !game.plainBackground" prepend-icon="mdi-format-color-fill">
									<v-switch :model-value="game.plainBackground" :label="$t('plain_background') + ' (U)'" hide-details />
								</v-list-item>
								<v-list-item v-ripple @click="game.showCells = !game.showCells" prepend-icon="mdi-numeric-1-box">
									<v-switch :model-value="game.showCells" :label="$t('display_cell_numbers') + ' (C)'" hide-details />
								</v-list-item>
								<v-list-item v-if="!LeekWars.mobile" :ripple="game.showLifes" :class="{disabled: !game.showLifes}" @click="game.showLifes ? (game.showIDs = !game.showIDs) : null" prepend-icon="mdi-key">
									<v-switch :model-value="game.showIDs" :disabled="!game.showLifes" :label="$t('show_ids') + ' (I)'" hide-details />
								</v-list-item>
							</v-list>
						</v-menu>
					</template>
					{{ $t('settings') }}
				</v-tooltip>
				<v-tooltip v-if="!creator" :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" v-bind="props" @click="quit">mdi-exit-to-app</v-icon>
					</template>
					{{ $t('quit') }}
				</v-tooltip>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { locale } from '@/locale'
	import { Farmer } from '@/model/farmer'
	import { Fight, FightMap, FightType, Report } from '@/model/fight'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { Game } from './game/game'
	import Hud from './hud.vue'
	import LwTitle from '@/component/title/title.vue'
	import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRouter } from 'vue-router'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'

	defineOptions({ name: 'player', i18n: {}, mixins: [...mixins], components: { Hud, 'lw-title': LwTitle } })

	const props = defineProps<{
		fightId?: string
		requiredWidth?: number
		requiredHeight?: number
		horizontal?: boolean
		startTurn?: number
		startAction?: number
		creator?: boolean
		map?: FightMap
	}>()

	const emit = defineEmits<{
		resize: []
		fight: [fight: Fight]
		'unlock-trophy': [trophy: any]
		edited: [data?: any]
	}>()

	const { t } = useI18n()
	const router = useRouter()
	const document = window.document
	const playerEl = useTemplateRef<HTMLElement>('player')
	const playerAttach = computed(() => playerEl.value ?? undefined)
	const hudRef = useTemplateRef<any>('hud')
	const progressBar = useTemplateRef<HTMLElement>('progressBar')
	const progressBarTooltip = useTemplateRef<HTMLElement>('progressBarTooltip')
	const instance = getCurrentInstance()

	const CONTROLS_HEIGHT = 36
	const BAR_HEIGHT = 6
	let destroyed = false

	function teamGrid(count: number) {
		let cols
		if (count <= 1) cols = 1
		else if (count <= 2) cols = 2
		else if (count <= 4) cols = 2
		else if (count <= 6) cols = 3
		else if (count <= 9) cols = 3
		else if (count <= 12) cols = 4
		else cols = 5
		const rows = Math.ceil(count / cols)
		return {
			display: 'grid',
			gridTemplateColumns: `repeat(${cols}, 1fr)`,
			gridTemplateRows: `repeat(${rows}, 1fr)`,
			justifyItems: 'center',
			alignItems: 'center',
			height: '100%',
		}
	}

	const fight = ref<Fight | null>(null)
	let canvas: any = null
	const game = ref<Game>(new Game())
	const queue = ref<any>(null)
	let getDelay = 1000
	const loaded = ref(false)
	const error = ref<any>(false)
	const fullscreen = ref(false)
	const progressBarTurn = ref<any>(0)
	const progressBarTooltipMargin = ref(0)
	const progressBarPreviewMouse = ref(0)
	const width = ref(0)
	const totalWidth = ref(0)
	const height = ref(0)
	const totalHeight = ref(0)
	let timeout: any = null
	let request: any = null
	const progress = ref(0)

	;(async () => {
		const fightMessages = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/fight.${locale}.lang`)
		i18n.global.mergeLocaleMessage(locale, { fight: fightMessages.default })
	})()

	if (localStorage.getItem('fight/shadows') === null) localStorage.setItem('fight/shadows', 'true')
	if (localStorage.getItem('fight/volume') === null) localStorage.setItem('fight/volume', '0.5')
	if (localStorage.getItem('fight/sound') === null) localStorage.setItem('fight/sound', 'true')
	if (localStorage.getItem('fight/lifes') === null) localStorage.setItem('fight/lifes', 'true')
	if (localStorage.getItem('fight/effects') === null) localStorage.setItem('fight/effects', 'true')
	if (localStorage.getItem('fight/actions') === null) localStorage.setItem('fight/actions', 'true')
	if (localStorage.getItem('fight/auto-dark') === null) localStorage.setItem('fight/auto-dark', 'true')
	if (localStorage.getItem('fight/debugs') === null) localStorage.setItem('fight/debugs', 'true')
	game.value.shadows = localStorage.getItem('fight/shadows') === 'true'
	game.value.tactic = localStorage.getItem('fight/tactic') === 'true'
	game.value.showCells = localStorage.getItem('fight/cells') === 'true'
	game.value.showLifes = localStorage.getItem('fight/lifes') === 'true'
	game.value.showEffects = localStorage.getItem('fight/effects') === 'true'
	game.value.showIDs = localStorage.getItem('fight/ids') === 'true'
	game.value.showActions = localStorage.getItem('fight/actions') === 'true'
	game.value.largeActions = localStorage.getItem('fight/large-actions') === 'true'
	game.value.actionsWidth = parseInt(localStorage.getItem('fight/actions-width') || '395', 10)
	game.value.sound = !LeekWars.sfw && localStorage.getItem('fight/sound') === 'true'
	game.value.volume = parseFloat(localStorage.getItem('fight/volume') || "0.5")
	game.value.autoDark = localStorage.getItem('fight/auto-dark') === 'true'
	game.value.dark = localStorage.getItem('fight/dark') === 'true'
	game.value.plainBackground = localStorage.getItem('fight/plain-background') === 'true'
	game.value.displayDebugs = localStorage.getItem('fight/debugs') === 'true'
	game.value.displayAILines = localStorage.getItem('fight/debug-lines') === 'true'
	game.value.displayAllyDebugs = localStorage.getItem('fight/ally-debugs') === 'true'
	;(game.value as any).player = { gameLaunched, $emit: emit }

	if (props.fightId) {
		getFight(true)
	} else if (props.map) {
		initMap(props.map)
	}
	resize()
	emit('resize')
	emitter.on('resize', onResize)
	emitter.on('keyup', keyup)
	emitter.on('keydown', keydown)
	emitter.on('fight-progress', onFightProgress)

	function onResize() {
		if (destroyed) return
		resize()
	}

	function onFightProgress(data: any) {
		if (destroyed) return
		if (fight.value && data[0] === fight.value.id) {
			progress.value = data[1]
			if (progress.value === 100 && request === null) {
				if (timeout) clearTimeout(timeout)
				getFight(false)
			}
		}
	}

	function gameLaunched() {
		loaded.value = true
		setOrigin()
	}

	watch([() => props.requiredWidth, () => props.requiredHeight, fullscreen], () => resize())

	function getWidth() {
		if (fullscreen.value) return window.innerWidth
		if (props.requiredWidth) return props.requiredWidth
		return playerEl.value!.parentElement!.clientWidth
	}

	function getHeight() {
		if (fullscreen.value) return window.innerHeight
		if (props.requiredHeight) return props.requiredHeight
		return playerEl.value!.parentElement!.clientHeight
	}

	const hasMarks = computed(() => Object.keys(game.value.markers).length > 0 || Object.keys(game.value.markersText).length > 0)
	const progressBarWidth = computed(() => game.value && game.value.actions ? 100 * game.value.currentAction / game.value.actions.length : 0)
	const progressBarPreviewWidth = computed(() => Math.max(0, progressBarPreviewMouse.value - progressBarWidth.value))

	function resize() {
		nextTick(() => {
			if (destroyed || !canvas) return
			const newWidth = getWidth()
			const newHeight = getHeight()
			if (newWidth === width.value && newHeight === height.value) return
			const aspectRatio = window.devicePixelRatio || 1
			;(game.value as any).ratio = aspectRatio
			totalWidth.value = newWidth
			totalHeight.value = newHeight
			width.value = newWidth - (props.horizontal ? 2 * CONTROLS_HEIGHT : 0)
			height.value = newHeight - (props.horizontal ? BAR_HEIGHT : (props.creator ? 0 : BAR_HEIGHT) + CONTROLS_HEIGHT)
			canvas.width = width.value * aspectRatio
			canvas.height = height.value * aspectRatio
			game.value.resize(canvas.width, canvas.height)
			game.value.redraw()
			setOrigin()
		})
	}

	function setOrigin() {
		setTimeout(() => {
			if (!canvas) return
			const p = canvas.getBoundingClientRect()
			game.value.setOrigin(p.left, p.top + window.scrollY)
		}, 50)
	}

	function mousemove(e: MouseEvent) {
		game.value.mousemove(e)
		if (hudRef.value) {
			hudRef.value.hover_entity = game.value.mouseEntity
		}
	}
	function mousedown(e: MouseEvent) { game.value.mousedown(e) }
	function mouseup(e: MouseEvent) { game.value.mouseup(e) }

	onMounted(() => {
		canvas = document.querySelector('.game-canvas')
		game.value.canvas = canvas
		game.value.ctx = canvas.getContext('2d')
	})

	function keydown(e: KeyboardEvent) {
		if (e.keyCode === 32) {
			if (game.value.paused) game.value.resume()
			else game.value.pause()
			e.preventDefault()
			return false
		} else if (e.keyCode === 37) {
			if (e.ctrlKey) {
				game.value.previousEntity()
				e.preventDefault()
			} else {
				game.value.previousAction()
			}
		} else if (e.keyCode === 39) {
			if (e.ctrlKey) {
				game.value.nextEntity()
				e.preventDefault()
			} else {
				game.value.nextAction()
			}
		}
	}

	function keyup(e: KeyboardEvent) {
		const plain = !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey
		if (!plain) return
		const k = e.keyCode
		if (k === 65) { game.value.showActions = !game.value.showActions; e.preventDefault() }
		else if (k === 69) { game.value.showEffects = !game.value.showEffects; e.preventDefault() }
		else if (k === 76) { game.value.showLifes = !game.value.showLifes; e.preventDefault() }
		else if (k === 79) { game.value.shadows = !game.value.shadows; e.preventDefault() }
		else if (k === 71) { game.value.largeActions = !game.value.largeActions; e.preventDefault() }
		else if (k === 78) { game.value.dark = !game.value.dark; e.preventDefault() }
		else if (k === 84) { game.value.tactic = !game.value.tactic; e.preventDefault() }
		else if (k === 68) { game.value.displayDebugs = !game.value.displayDebugs; e.preventDefault() }
		else if (k === 85) { game.value.plainBackground = !game.value.plainBackground; e.preventDefault() }
		else if (k === 67) { game.value.showCells = !game.value.showCells; e.preventDefault() }
		else if (k === 73) { game.value.showIDs = !game.value.showIDs; e.preventDefault() }
		else if (k === 81) {
			if (fullscreen.value) toggleFullscreen()
			game.value.showReport()
			e.preventDefault()
		} else if (k === 80) {
			if (game.value.paused) game.value.resume()
			else game.value.pause()
			e.preventDefault()
		} else if (k === 83) { game.value.speedUp(); e.preventDefault() }
		else if (k === 70) { toggleFullscreen(); e.preventDefault() }
		else if (k === 86) { game.value.sound = !game.value.sound; e.preventDefault() }
		else if (k === 77) { game.value.clearMarks(); e.preventDefault() }
		else if (k === 88 && !game.value.creator) {
			game.value.map.seed = Math.random() * 10000000 | 0
			game.value.mapLoaded()
			e.preventDefault()
		}
	}

	onBeforeUnmount(() => {
		destroyed = true
		game.value.pause()
		;(game.value as any).cancelled = true
		emitter.off('keyup', keyup)
		emitter.off('keydown', keydown)
		emitter.off('resize', onResize)
		emitter.off('fight-progress', onFightProgress)
		if (timeout) clearTimeout(timeout)
		if (request) request.abort()
		if (props.fightId !== 'local') {
			LeekWars.socket.send([SocketMessage.FIGHT_PROGRESS_UNREGISTER, props.fightId])
		}
		if (LeekWars.didactitial_step === 3) {
			LeekWars.didactitial_next()
		}
	})

	function initMap(map: FightMap) {
		const local_fight = {
			title: 'Fight', context: 3, date: 0,
			farmers1: {1: {id: 1, name: 'Pilow'} as Farmer},
			farmers2: {1: {id: 1, name: 'Pilow'} as Farmer},
			id: 0, farmer1: 1, farmer2: 1,
			leeks1: [], leeks2: [], team1: null, team2: null,
			report: {} as Report, status: 1,
			team1_name: "A", team2_name: "B",
			tournament: 0, type: 0, winner: 1, year: 2019,
			data: { actions: [], map, leeks: [], team1: [], team2: [], ops: {} },
			comments: [], result: 'win', queue: 0, trophies: [],
			chests: 0, size: 0, rareloot: 0, levelups: 0,
		} as unknown as Fight
		loaded.value = true
		emit('fight', local_fight)
		nextTick(() => {
			game.value.creator = true
			game.value.paused = true
			game.value.init(local_fight)
		})
	}

	function getFight(first: boolean) {
		const fightLoaded = (f: Fight) => {
			fight.value = f
			emit('fight', f)
			if (f.status >= 1) {
				if (f.data) {
					getLogs()
					game.value.startTurn = props.startTurn ?? 1
					game.value.startAction = props.startAction ?? 0
					game.value.init(f)
				} else {
					error.value = true
				}
			} else {
				if (first) {
					LeekWars.socket.send([SocketMessage.FIGHT_PROGRESS_REGISTER, fight.value!.id])
				}
				queue.value = f.queue
				if (loaded.value) return
				timeout = setTimeout(() => { getFight(false) }, getDelay)
				getDelay += 500
				getDelay = Math.min(4000, getDelay)
			}
		}
		if (props.fightId === 'local') {
			fetch(`/static/report.json`).then(response => response.json()).then(report => {
				if (destroyed) return
				const local_fight = {
					title: 'Fight', context: 3, date: 0,
					farmers1: {1: {id: 1, name: 'Pilow'} as Farmer},
					farmers2: {1: {id: 1, name: 'Pilow'} as Farmer},
					id: 0, farmer1: 1, farmer2: 1,
					leeks1: [], leeks2: [], team1: null, team2: null,
					report: {} as Report, status: 1,
					team1_name: "A", team2_name: "B",
					tournament: 0, type: 0, winner: 1, year: 2019,
					data: report.fight as any,
					comments: [], result: 'win', queue: 0, trophies: [],
					chests: 0, size: 0, rareloot: 0, levelups: 0,
				} as unknown as Fight
				fightLoaded(local_fight)
				if (store.state.farmer) {
					game.value.setLogs(report.logs[store.state.farmer.id])
				}
			})
		} else {
			if (request === null) {
				request = LeekWars.get('fight/get/' + props.fightId)
				request.then((f: any) => {
					if (destroyed) return
					request = null
					fightLoaded(f)
				}).error((err: any) => {
					if (destroyed) return
					request = null
					error.value = err
				})
			}
		}
	}

	function getLogs() {
		if (store.state.farmer) {
			game.value.numData++
			LeekWars.get('fight/get-logs/' + props.fightId).then(logs => {
				if (destroyed) return
				game.value.setLogs(logs)
			})
		}
	}

	function pause() {
		if (game.value.paused) game.value.resume()
		else game.value.pause()
	}

	function toggleFullscreen() {
		if (fullscreen.value) {
			LeekWars.fullscreenExit()
			fullscreen.value = false
		} else {
			LeekWars.fullscreenEnter(instance?.proxy?.$el as HTMLElement, (fs: boolean) => {
				fullscreen.value = fs
			})
		}
	}

	function quit() {
		router.push('/report/' + props.fightId)
	}

	function progressBarClick(e: MouseEvent) {
		const bar = progressBar.value
		if (!bar) return
		const action = Math.round(game.value.actions.length * (e.pageX - bar.getBoundingClientRect().left) / bar.offsetWidth)
		game.value.requestJump(action)
		const barOffset = bar.getBoundingClientRect().left
		progressBarPreviewMouse.value = 100 * (e.pageX - barOffset) / bar.clientWidth
	}

	function progressBarMove(e: MouseEvent) {
		const bar = progressBar.value
		const tooltip = progressBarTooltip.value
		if (!bar || !tooltip) return
		const barOffset = bar.getBoundingClientRect().left
		let turn: any = 0
		const pos = (e.pageX - barOffset) / bar.clientWidth
		for (const i in game.value.turnPosition) {
			if (pos >= game.value.turnPosition[i]) turn = i
		}
		progressBarTurn.value = turn
		progressBarTooltipMargin.value = Math.min(Math.max((e.pageX - barOffset) - (tooltip.clientWidth / 2), 0), bar.clientWidth - tooltip.clientWidth)
		progressBarPreviewMouse.value = 100 * (e.pageX - barOffset) / bar.clientWidth
	}

	function setLocalStorageAndRedraw(key: string, value: any, redraw = false) {
		localStorage.setItem('fight/' + key, '' + value)
		if (redraw) game.value.redraw()
	}

	watch(() => game.value.volume, () => { localStorage.setItem('fight/volume', '' + game.value.volume); game.value.changeVolume() })
	watch(() => game.value.sound, () => {
		if (!LeekWars.sfw) localStorage.setItem('fight/sound', '' + game.value.sound)
		game.value.toggleSound()
	})
	watch(() => game.value.shadows, () => { localStorage.setItem('fight/shadows', '' + game.value.shadows); game.value.toggleShadows(); game.value.redraw() })
	watch(() => game.value.tactic, () => { localStorage.setItem('fight/tactic', '' + game.value.tactic); game.value.toggleShadows(); game.value.redraw() })
	watch(() => game.value.showCells, () => setLocalStorageAndRedraw('cells', game.value.showCells, true))
	watch(() => game.value.showLifes, () => setLocalStorageAndRedraw('lifes', game.value.showLifes, true))
	watch(() => game.value.showEffects, () => setLocalStorageAndRedraw('effects', game.value.showEffects, true))
	watch(() => game.value.showIDs, () => setLocalStorageAndRedraw('ids', game.value.showIDs, true))
	watch(() => game.value.showActions, () => {
		localStorage.setItem('fight/actions', '' + game.value.showActions)
		if (game.value.actionsWidth === 0) game.value.actionsWidth = 395
		resize()
	})
	watch(() => game.value.largeActions, () => {
		localStorage.setItem('fight/large-actions', '' + game.value.largeActions)
		if (game.value.actionsWidth === 0) game.value.actionsWidth = 395
		resize()
	})
	watch(() => game.value.actionsWidth, () => { localStorage.setItem('fight/actions-width', '' + game.value.actionsWidth); resize() })
	watch(() => game.value.dark, () => { localStorage.setItem('fight/dark', '' + game.value.dark); game.value.toggleDark() })
	watch(() => game.value.autoDark, () => { localStorage.setItem('fight/auto-dark', '' + game.value.autoDark) })
	watch(() => game.value.plainBackground, () => { localStorage.setItem('fight/plain-background', '' + game.value.plainBackground); resize() })
	watch(() => game.value.displayDebugs, () => { localStorage.setItem('fight/debugs', '' + game.value.displayDebugs) })
	watch(() => game.value.displayAILines, () => { localStorage.setItem('fight/debug-lines', '' + game.value.displayAILines) })
	watch(() => game.value.displayAllyDebugs, () => { localStorage.setItem('fight/ally-debugs', '' + game.value.displayAllyDebugs) })

	function canvasClick() { game.value.selectEntity(game.value.click()) }
	function canvasRightClick(e: Event) { game.value.rightClick(); e.preventDefault() }

	watch(() => game.value.going_to_report, () => {
		if (game.value.going_to_report && props.fightId !== 'local') {
			router.push("/report/" + props.fightId)
		}
	})

	watch(() => game.value.mapType, (after, before) => {
		if (before !== -1) game.value.updateMap()
	})

	defineExpose({ get loaded() { return loaded.value }, set loaded(v: boolean) { loaded.value = v }, gameLaunched })
</script>


<style lang="scss" scoped>
	.game {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		background: #2a2a2a;
	}
	.layers {
		position: relative;
		flex: 100% 0 0;
	}
	.game.horizontal .layers {
		flex: auto;
	}
	.table {
		display: flex;
		align-items: center;
		min-height: 0;
		flex: 1;
		justify-content: center;
		&.br {
			flex-wrap: wrap;
			margin-bottom: 20px;
			.vs {
				width: 5%;
				max-width: 50px;
			}
		}
		.team {
			flex: 1;
			height: 100%;
			padding: 15px;
			min-height: 0;
		}
		.vs {
			font-size: 25px;
			font-weight: bold;
			color: #666;
			width: 9%;
			padding: 10px;
			min-width: 50px;
			max-width: 150px;
		}
		.leek {
			&.br {
				width: 10%;
				height: auto;
			}
			text-align: center;
			display: flex;
			padding: 4px;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			min-height: 0;
    		height: 100%;
			.name {
				padding-top: 5px;
				font-size: 20px;
				font-weight: 500;
				text-overflow: ellipsis;
				overflow-x: hidden;
				width: 100%;
				flex-shrink: 0;
			}
			.title {
				font-size: 14px;
			}
			.level {
				padding-top: 2px;
			}
			svg {
				max-width: 100%;
			}
			.chest-img {
				max-width: 80%;
				max-height: 70%;
				object-fit: contain;
			}
		}
	}
	#app.app .table {
		.leek {
			padding: 0;
			.name {
				font-size: 13px;
			}
			.level {
				font-size: 11px;
			}
			.title {
				display: none;
			}
		}
	}
	.bg-canvas {
		position: absolute;
		top: 0; bottom: 0;
		left: 0; right: 0;
	}
	.bg-canvas:fullscreen {
		max-height: 100%;
	}
	.game-canvas {
		position: absolute;
		top: 0; bottom: 0;
		left: 0; right: 0;
	}
	.game-canvas:fullscreen {
		max-height: 100%;
	}
	.turn {
		font-weight: bold;
	}
	.controls {
		user-select: none;
		display: flex;
		min-width: 0;
		max-width: 50%;
	}
	.game.horizontal .controls {
		flex-direction: column;
		width: 36px;
		justify-content: center;
	}
	.game.horizontal .controls-a {
		order: -1;
	}
	.controls.large {
		line-height: 50px;
		height: 50px;
	}
	.controls .control {
		padding: 5px 12px;
		cursor: pointer;
		color: white;
		text-align: center;
		min-width: 48px;
		height: 36px;
		&:is(i) {
			font-size: 24px;
		}
		:deep(&.v-icon::after) {
			display: none;
		}
	}
	.game.horizontal .controls .control {
		padding: 12px 5px;
	}
	.controls .control:hover {
		background: rgba(255,255,255, 0.2);
	}
	.controls .v-menu {
		vertical-align: top;
	}
	.controls .turn {
		line-height: 36px;
		color: white;
		display: inline-block;
		vertical-align: top;
		padding: 0 8px;
		white-space: nowrap;
	}
	.controls.large .turn {
		line-height: 50px;
	}
	.controls .filler {
		flex: 1;
	}
	.loading {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		text-align: center;
	}
	.loading table {
		width: 100%;
		height: 390px;
	}
	.loading table td {
		text-align: center;
	}
	.loading-fight {
		padding: 5px;
		padding-top: 0;
		font-size: 18px;
		text-align: center;
		width: 100%;
	}
	.queue-position {
		padding: 8px;
		font-size: 18px;
		margin-bottom: 10px;
	}
	.status {
		color: var(--text-color-secondary);
		font-weight: 500;
		padding-left: 4px;
	}
	.error {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 10px;
		h4 {
			font-size: 13px;
		}
		img {
			width: 80px;
		}
	}
	.progress-bar-wrapper {
		height: 20px;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 1;
	}
	.progress-bar {
		height: 6px;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 1;
		cursor: pointer;
		background: #eee;
		transition: all 0.2s;
		white-space: nowrap;
		.preview-bar {
			display: none;
			position: absolute;
			top: 0;
			height: 6px;
			background: #aaa;
			height: 100%;
		}
	}
	.progress-bar-wrapper:hover .progress-bar {
		height: 12px;
		bottom: -3px;
		.preview-bar {
			display: inline-block;
		}
	}
	.progress-bar .bar {
		height: 100%;
		background-color: #5fad1b;
		display: inline-block;
		vertical-align: top;
		transition: all 0.2s;
	}
	.progress-bar .circle {
		width: 16px;
		height: 16px;
		margin-top: -4px;
		margin-left: -10px;
		position: absolute;
		top: 0;
		border-radius: 50%;
		background: #ccc;
		vertical-align: top;
		border: 4px solid #f2f2f2;
		z-index: 2;
		transition: all 0.2s;
	}
	.progress-bar-wrapper:hover .circle {
		width: 22px;
		height: 22px;
	}
	.progress-bar-turn {
		position: absolute;
		display: none;
		margin-top: -30px;
		white-space: nowrap;
		opacity: 1 !important;
	}
	.progress-bar-wrapper:hover .progress-bar-turn {
		display: inline-block;
	}
	.level {
		font-size: 17px;
		color: var(--text-color-secondary);
		font-weight: 500;
	}
	.clear-marks {
		position: absolute;
		top: 8px;
		right: 8px;
		background: #2a2a2a;
		color: white;
		cursor: pointer;
		font-size: 24px;
		z-index: 5;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		&:hover {
			background: #444;
		}
	}
	.play-pause {
		position: absolute;
		width: 100px;
		height: 100px;
		top: calc(50% - 50px);
		left: calc(50% - 50px);
		font-size: 50px;
		color: white;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 50%;
		text-align: center;
		line-height: 102px;
		opacity: 0;
		transition: all ease-in 0.5s;
		pointer-events: none;
	}
	.fade-enter-active {
		opacity: 1;
		transform: scale(1);
	}
	.fade-enter-to {
		opacity: 0;
		transform: scale(1.5);
	}
	.v-menu .settings-menu {
		background: #1E1E1E;
		&:deep(i) {
			// padding-right: 10px;
			color: #eee;
			opacity: 1;
		}
		input[type="text"] {
			width: 100%
		}
		.v-list-item {
			padding-top: 0;
			padding-bottom: 0;
		}
	}
	.settings-menu :deep(label) {
		color: hsla(0,0%,100%,.7);
		&.v-label--is-disabled {
			color: hsla(0,0%,100%,.7);
		}
	}
	.settings-menu :deep(.v-input--switch.v-input--is-dirty.v-input--is-disabled) {
		opacity: 1;
	}
	.settings-menu :deep(.theme--light.v-input--selection-controls.v-input--is-disabled:not(.v-input--indeterminate) .v-icon ) {
		color: hsla(0,0%,100%,.7) !important;
	}
	.settings-menu .v-input--checkbox {
		color: hsla(0,0%,100%,.7);
	}
	.settings-menu .night {
		margin-right: 10px;
	}
	.settings-menu .disabled {
		opacity: 0.45;
		cursor: default;
	}
	.ally-debug {
		margin-left: 8px;
	}
	.loader {
		padding-bottom: 10px;
		padding-top: 0;
	}
	.loading-bar {
		height: 14px;
		position: relative;
		background: var(--pure-white);
		border-radius: 6px;
		border: 1px solid var(--border);
		text-align: left;
		max-width: 700px;
		margin: 10px auto;
		.bar {
			height: 12px;
			width: 0;
			background: #30bb00;
			position: absolute;
			border-radius: 6px;
			transition: width 1s;
		}
	}
	.map-menu {
		background: #1E1E1E;
		color: #eee;
		padding: 10px;
		overflow: hidden;
		:deep(.theme--light.v-label) {
			color: #eee;
		}
	}
	.section {
		color: white;
		padding: 4px 8px;
		font-size: 13px;
	}
	.progress-bar .marker {
		width: 6px;
		height: 6px;
		position: absolute;
		top: 0;
		z-index: 2;
		transition: all 0.2s;
	}
	.progress-bar-wrapper:hover .marker {
		width: 6px;
		height: 12px;
	}
</style>
