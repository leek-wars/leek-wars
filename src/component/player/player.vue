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
				<div v-if="!creator" class="progress-bar-wrapper" :class="{dragging}">
					<div ref="progressBarTooltip" :style="{'margin-left': progressBarTooltipMargin + 'px'}" class="progress-bar-turn v-tooltip__content top">
						<span class="content">{{ $t('fight.turn_n', [progressBarTurn]) }}</span>
					</div>
					<div ref="progressBar" class="progress-bar" @mousedown="progressBarDown" @touchstart="progressBarTouchStart" @mousemove="progressBarMove">
						<div :style="{width: progressBarWidth + '%'}" class="bar"></div>
						<!-- Un trait par tour de jeu, sous les marqueurs de mort. v-memo : ces
						     deux listes ne changent qu'au passage d'un tour et à une mort, mais
						     la barre se redessine à chaque rafraîchissement du lecteur. -->
						<div v-for="tick in turnTicks" :key="tick.turn" v-memo="[tick.turn, tick.left]" class="turn-tick" :style="{left: tick.left + '%'}" :title="$t('fight.turn_n', [tick.turn])"></div>
						<div v-for="(marker, idx) in game.progressBarMarkers" :key="idx" v-memo="[marker.left, marker.width, marker.background, marker.outline]" class="marker" :style="{left: marker.left + '%', width: marker.width + '%', background: marker.background, outline: marker.outline}"></div>
						<div class="circle" :style="{left: handlePosition + '%'}"></div>
						<div class="preview-bar" :style="{width: progressBarPreviewWidth + '%'}"></div>
					</div>
				</div>
				<hud ref="hud" :game="(game as Game)" :tick="tick" :creator="creator" :mobile-panels="mobilePanels" :actions-below="actionsBelowNow" :compact="compact" />
				<div v-if="admin && ui.showFPS" class="fps-counter">
					<div class="fps-value">{{ ui.fps }}<span class="unit">img/s</span><span v-if="ui.uncapped" class="uncapped">débridé</span></div>
					<template v-if="fpsStats">
						<svg class="fps-chart" :viewBox="'0 0 ' + FPS_CHART_WIDTH + ' ' + FPS_CHART_HEIGHT" preserveAspectRatio="none">
							<line v-for="line in fpsStats.rules" :key="line.fps" class="rule" x1="0" :x2="FPS_CHART_WIDTH" :y1="line.y" :y2="line.y" />
							<polyline class="curve" :points="fpsStats.points" />
						</svg>
						<div class="fps-stats">
							<span>min <b>{{ fpsStats.min }}</b></span>
							<span>moy <b>{{ fpsStats.average }}</b></span>
							<span>max <b>{{ fpsStats.max }}</b></span>
						</div>
						<!-- Durée sous laquelle tombent 99 images sur 100 : ce qui reste
						     quand on a retiré les à-coups isolés. -->
						<div v-if="fpsStats.p99" class="fps-stats">
							<span>p99 <b>{{ fpsStats.p99 }} ms</b></span>
						</div>
					</template>
				</div>
				<v-tooltip v-if="hasMarks" :open-delay="0" :close-delay="0" location="bottom" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="clear-marks" v-bind="props" @click="game.clearMarks()">mdi-eraser</v-icon>
					</template>
					{{ $t('clear_marks') }} (M)
				</v-tooltip>
				<transition v-if="!creator" name="fade">
					<v-icon v-if="ui.paused" class="play-pause">mdi-pause</v-icon>
				</transition>
				<transition v-if="!creator" name="fade">
					<v-icon v-if="!ui.paused" class="play-pause">mdi-play</v-icon>
				</transition>
			</div>


			<div v-if="!creator" class="controls controls-a">
				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" v-bind="props" @click="pause">{{ ui.paused ? 'mdi-play' : 'mdi-pause' }}</v-icon>
					</template>
					{{ $t('pause') }} (P)
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" :style="{opacity: ui.speedButtonVisible ? 1 : 0}" v-bind="props" @click="game.speedUp()">mdi-fast-forward</v-icon>
					</template>
					{{ $t('accelerate') }} (S)
				</v-tooltip>
				<v-tooltip v-if="!compact" :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" v-bind="props" @click="game.previousAction()">mdi-skip-previous</v-icon>
					</template>
					{{ $t('previous_action') }} (←)
				</v-tooltip>
				<v-tooltip v-if="!compact" :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" v-bind="props" @click="game.nextAction()">mdi-skip-next</v-icon>
					</template>
					{{ $t('next_action') }} (→)
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props }">
						<v-icon v-ripple class="control" v-bind="props" @click="ui.sound = !ui.sound">{{ ui.sound ? 'mdi-volume-high' : 'mdi-volume-low' }}</v-icon>
					</template>
					{{ $t(ui.sound ? 'sound_activated' : 'sound_disactivated') }} (V)
				</v-tooltip>
				<v-tooltip v-if="ui.sound && !LeekWars.mobile" :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator>
						<input v-model="ui.volume" type="range" min="0" max="1" step="0.01" style="width: 100px; padding: 0">
					</template>
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props: tooltipProps }">
						<v-menu :close-on-content-click="false" :width="390" location="top" offset-y right :attach="playerAttach">
							<template #activator="{ props: menuProps }">
								<div v-ripple class="control turn" v-bind="{...tooltipProps, ...menuProps}">{{ horizontal ? ui.turn : $t('fight.turn_n', [ui.turn]) }}</div>
								<!-- <v-icon class="control" >mdi-cog-outline</v-icon> -->
							</template>
							<v-list :dense="true" class="settings-menu">
								<div class="section">{{ $t('fight.share') }}</div>
								<v-list-item prepend-icon="mdi-share-variant">
									<input type="text" :value="document.location.host + '/fight/' + fightId + '?action=' + ui.currentAction" @keyup.stop>
								</v-list-item>
								<v-list-item prepend-icon="mdi-share-variant">
									<input type="text" :value="document.location.host + '/fight/' + fightId + '?turn=' + ui.turn" @keyup.stop>
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

				<v-tooltip v-if="admin" :open-delay="0" :close-delay="0" location="top" :attach="playerAttach">
					<template #activator="{ props: tooltipProps }">
						<v-menu :close-on-content-click="false" top offset-y left :attach="playerAttach">
							<template #activator="{ props: menuProps }">
								<v-icon v-ripple class="control" v-bind="{...tooltipProps, ...menuProps}">mdi-security</v-icon>
							</template>
							<v-list density="compact" class="settings-menu">
								<div class="section">AFFICHAGE</div>
								<v-list-item v-ripple prepend-icon="mdi-speedometer" @click="ui.showFPS = !ui.showFPS">
									<lw-switch :model-value="ui.showFPS" label="Compteur d'images" />
								</v-list-item>
								<v-list-item :ripple="ui.showFPS" :class="{disabled: !ui.showFPS}" prepend-icon="mdi-lock-open-outline" @click="ui.showFPS ? (ui.uncapped = !ui.uncapped) : null">
									<lw-switch :model-value="ui.uncapped" :disabled="!ui.showFPS" label="Débrider (hors vsync)" />
								</v-list-item>
								<div class="section">CARTE</div>
								<lw-radio-group v-model="ui.mapType" class="map-menu">
									<lw-radio v-for="(map, m) of game.maps" :key="m" :label="map.constructor.name" :value="m" />
								</lw-radio-group>
							</v-list>
						</v-menu>
					</template>
					Administration
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
								<v-list-item v-ripple prepend-icon="mdi-heart-half-full" @click="ui.showLifes = !ui.showLifes">
									<lw-switch :model-value="ui.showLifes" :label="$t('display_life_bars') + ' (L)'" />
								</v-list-item>
								<v-list-item :ripple="ui.showLifes" :class="{disabled: !ui.showLifes}" prepend-icon="mdi-flare" @click="ui.showLifes ? (ui.showEffects = !ui.showEffects) : null">
									<lw-switch :model-value="ui.showEffects" :disabled="!ui.showLifes" :label="$t('display_effects') + ' (E)'" />
								</v-list-item>
								<!-- Visible aussi en mobile : les actions s'y affichent, il faut
								     pouvoir les replier. Les deux réglages
								     suivants (largeur, logs) restent réservés au hud du bureau. -->
								<v-list-item v-ripple prepend-icon="mdi-format-list-bulleted" @click="ui.showActions = !ui.showActions">
									<lw-switch :model-value="ui.showActions" :label="$t('show_actions') + ' (A)'" />
								</v-list-item>
								<v-list-item v-if="!compact" :ripple="ui.showActions" :class="{disabled: !ui.showActions}" prepend-icon="mdi-view-split-vertical" @click="ui.showActions ? (ui.largeActions = !ui.largeActions) : null">
									<lw-switch :model-value="ui.largeActions" :disabled="!ui.showActions" :label="$t('large_actions') + ' (G)'" />
								</v-list-item>
								<v-list-item v-if="!compact" :ripple="ui.displayDebugs" :class="{disabled: !ui.showActions}" prepend-icon="mdi-math-log" @click="ui.showActions ? (ui.displayDebugs = !ui.displayDebugs) : null">
									<lw-switch :model-value="ui.displayDebugs" :disabled="!ui.showActions" :label="$t('display_logs') + ' (D)'" />
									<template #append>
										<lw-checkbox v-model="ui.displayAILines" :disabled="!ui.showActions || !ui.displayDebugs" :class="{disabled: !ui.showActions || !ui.displayDebugs}" label="Lignes" class="ally-debug" @click.stop />
										<lw-checkbox v-model="ui.displayAllyDebugs" :disabled="!ui.showActions || !ui.displayDebugs" :class="{disabled: !ui.showActions || !ui.displayDebugs}" label="Alliés" class="ally-debug" @click.stop />
									</template>
								</v-list-item>
								<div class="section">GRAPHISMES</div>
								<v-list-item v-ripple prepend-icon="mdi-box-shadow" @click="ui.shadows = !ui.shadows">
									<lw-switch :model-value="ui.shadows" :label="$t('display_shadows') + ' (O)'" />
								</v-list-item>
								<v-list-item prepend-icon="mdi-weather-night">
									<lw-switch v-if="!ui.autoDark" v-model="ui.dark" :label="$t('dark_mode') + ' (N)'" class="night" />
									<template #append>
										<lw-checkbox v-model="ui.autoDark" label="Auto" />
									</template>
								</v-list-item>
								<div class="section">DEVELOPEMENT</div>
								<v-list-item v-ripple prepend-icon="mdi-view-comfy" @click="ui.tactic = !ui.tactic">
									<lw-switch :model-value="ui.tactic" :label="$t('tactic_mode') + ' (T)'" />
								</v-list-item>
								<v-list-item v-ripple prepend-icon="mdi-format-color-fill" @click="ui.plainBackground = !ui.plainBackground">
									<lw-switch :model-value="ui.plainBackground" :label="$t('plain_background') + ' (U)'" />
								</v-list-item>
								<v-list-item v-ripple prepend-icon="mdi-numeric-1-box" @click="ui.showCells = !ui.showCells">
									<lw-switch :model-value="ui.showCells" :label="$t('display_cell_numbers') + ' (C)'" />
								</v-list-item>
								<v-list-item v-ripple prepend-icon="mdi-arrange-bring-to-front" @click="ui.marksForeground = !ui.marksForeground">
									<lw-switch :model-value="ui.marksForeground" :label="$t('marks_foreground')" />
								</v-list-item>
								<v-list-item v-if="!compact" :ripple="ui.showLifes" :class="{disabled: !ui.showLifes}" prepend-icon="mdi-key" @click="ui.showLifes ? (ui.showIDs = !ui.showIDs) : null">
									<lw-switch :model-value="ui.showIDs" :disabled="!ui.showLifes" :label="$t('show_ids') + ' (I)'" />
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
	import { Farmer } from '@/model/farmer'
	import { Fight, FightMap, FightType, Report } from '@/model/fight'
	import { loadLocalizedMessages, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import type { ApiError } from '@/model/api-error'
	import { SocketMessage } from '@/model/socket'
	import { Game } from './game/game'
	import type { FightEntity } from './game/entity'
	import Hud from './hud.vue'
	import LwTitle from '@/component/title/title.vue'
	import { computed, getCurrentInstance, markRaw, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, useTemplateRef, watch } from 'vue'
	import { useRouter } from 'vue-router'
	import { store } from '@/model/store'
	import { emitter } from '@/model/emitter'
	import { isTyping } from '@/model/keyboard'

	defineOptions({ name: 'Player', i18n: {}, mixins: [...mixins], components: { Hud, 'lw-title': LwTitle } })

	const props = defineProps<{
		fightId?: string
		requiredWidth?: number
		requiredHeight?: number
		horizontal?: boolean
		/**
		 * Disposition des petits écrans mobiles, décidée par la page : l'ordre des poireaux et
		 * les actions quittent la carte pour `mobilePanels`, le hud se réduit, et la carte
		 * n'a plus à leur laisser de place. Absente, c'est le hud du bureau.
		 */
		compact?: boolean
		startTurn?: number
		startAction?: number
		creator?: boolean
		map?: FightMap
		fight?: Fight
		/**
		 * Conteneur posé SOUS le lecteur par la page, où le hud téléporte l'ordre des poireaux
		 * et les actions en compact. Le lecteur ne fait que le transmettre : sa propre
		 * racine a une hauteur fixe, rien ne peut se poser dessous depuis l'intérieur.
		 */
		mobilePanels?: HTMLElement | null
		/** Actions téléportées dans `mobilePanels` hors mobile aussi (cf. hud.vue). */
		actionsBelow?: boolean
		/** Reste sur le lecteur en fin de combat au lieu de partir vers le rapport (éditeur). */
		noReport?: boolean
	}>()

	const emit = defineEmits<{
		resize: []
		fight: [fight: Fight]
		'unlock-trophy': [trophy: unknown]
		edited: [data?: unknown]
	}>()

	const router = useRouter()
	const document = window.document
	const playerEl = useTemplateRef<HTMLElement>('player')
	// Menus et infobulles dans le lecteur seulement en plein écran, où rien d'autre ne
	// s'affiche. Ailleurs dans la page : dans l'éditeur, le panneau du combat les rognait.
	const playerAttach = computed(() => fullscreen.value ? playerEl.value ?? undefined : undefined)
	const hudRef = useTemplateRef<{ hover_entity: FightEntity | null }>('hud')
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
	let canvas: HTMLCanvasElement | null = null
	/**
	 * Le moteur est volontairement HORS de la réactivité de Vue (shallowRef + markRaw).
	 * En `ref()`, chaque `this.x` du moteur traversait un proxy et chaque écriture (une
	 * position, une vie, un compteur d'animation — des milliers par image) programmait un
	 * rendu du lecteur : sur une machine lente, la moitié du temps d'image y passait.
	 * En contrepartie, plus rien ne se met à jour tout seul : l'interface se relit quand
	 * `tick` bouge (cf. refreshUI), et les watchers ci-dessous passent par `watchGame`.
	 */
	// ⚠️ L'éditeur de carte (creator.vue) range CE moteur dans son propre `ref` et rend
	// tout son panneau d'outils depuis lui : il attend qu'une sélection d'entité au clic
	// remonte d'elle-même. Là, on garde donc le moteur réactif — il n'y joue aucun combat,
	// la boucle est en pause et le proxy ne coûte rien.
	const game = props.creator ? ref<Game>(new Game()) : shallowRef<Game>(markRaw(new Game()))
	/** Compteur de rafraîchissement de l'interface : toute lecture du moteur en dépend. */
	const tick = ref(0)
	/**
	 * Miroir réactif des réglages et de l'état montré par la barre de contrôle.
	 * Indispensable : ces valeurs-là sont lues DANS des slots de composants Vuetify
	 * (infobulles, menus), et un slot n'est ré-évalué que si le composant qui le porte
	 * se redessine — ce que `tick` ne provoque pas, puisqu'ils ne le lisent pas.
	 * Le miroir est recopié du moteur à chaque rafraîchissement (syncUI) et les watchers
	 * plus bas font le chemin inverse : réglage modifié → moteur + effet de bord.
	 */
	const ui = reactive({
		paused: false,
		speedButtonVisible: true,
		turn: 0,
		currentAction: 0,
		sound: false,
		volume: 0.5,
		shadows: false,
		tactic: false,
		showCells: false,
		marksForeground: false,
		showLifes: true,
		showEffects: true,
		showIDs: false,
		showActions: true,
		largeActions: false,
		dark: false,
		autoDark: true,
		plainBackground: false,
		displayDebugs: true,
		displayAILines: false,
		displayAllyDebugs: false,
		mapType: -1,
		showFPS: false,
		// Volontairement PAS retenu d'une visite à l'autre : le mode débridé occupe
		// le fil principal en continu, on ne le laisse pas traîner allumé.
		uncapped: false,
		// ⚠️ Ce qui suit n'est pas un réglage mais une MESURE : le moteur l'écrit, le
		// panneau la lit, et surtout `watchUI` n'a rien à y faire — il repousserait
		// dans le moteur une valeur qui en vient.
		fps: 0,
		fpsVersion: 0,
	})
	function syncUI() {
		const g = game.value
		ui.paused = g.paused
		ui.speedButtonVisible = g.speedButtonVisible
		ui.turn = g.turn
		ui.currentAction = g.currentAction
		ui.sound = g.sound
		ui.volume = g.volume
		ui.shadows = g.shadows
		ui.tactic = g.tactic
		ui.showCells = g.showCells
		ui.marksForeground = g.marksForeground
		ui.showLifes = g.showLifes
		ui.showEffects = g.showEffects
		ui.showIDs = g.showIDs
		ui.showActions = g.showActions
		ui.largeActions = g.largeActions
		ui.dark = g.dark
		ui.autoDark = g.autoDark
		ui.plainBackground = g.plainBackground
		ui.displayDebugs = g.displayDebugs
		ui.displayAILines = g.displayAILines
		ui.displayAllyDebugs = g.displayAllyDebugs
		ui.mapType = g.mapType
		ui.showFPS = g.showFPS
		ui.uncapped = g.uncapped
		// Le compteur suit le rythme du rafraîchissement du hud (2 à 20 fois par
		// seconde), pas celui des images : c'est déjà bien plus qu'il n'en faut pour
		// lire un nombre, et Vue ne redessine que si la valeur a bougé.
		ui.fps = g.meter.fps
		ui.fpsVersion = g.meter.version
	}
	// 20 Hz au mieux : au-delà l'œil ne voit plus la différence sur des chiffres, et
	// chaque incrément redessine tout le hud (barres de vie, ordre des poireaux, journal).
	const UI_REFRESH_MIN = 50
	const UI_REFRESH_MAX = 500
	// Le rendu du hud se paie sur le temps du combat. On mesure ce qu'il coûte (Vue vide
	// sa file de rendu dans une micro-tâche, la nôtre passe juste après) et on l'espace
	// d'autant : sur une machine lente, le terrain continue de bouger, seuls les chiffres
	// du hud suivent de plus loin.
	// Le facteur est de 20 et non de 10 : cette mesure ne voit que le rendu, pas ce qu'il
	// entraîne ensuite (le ramasse-miettes surtout). À CPU ÷12, avec un facteur 10 visant
	// un dixième du temps, le hud en prenait en réalité le quart — le vider rendait 24 %
	// d'images. À 20, il passe de 13 à 8 rendus par seconde sur une telle machine, et rien
	// ne change sur une machine correcte, où le plancher de 50 ms s'applique déjà.
	const UI_REFRESH_BUDGET = 20
	let uiRefreshInterval = UI_REFRESH_MIN
	let lastRefresh = 0
	/**
	 * Le rendu du hud est renvoyé dans une tâche À LUI, jamais celle de l'image
	 * d'animation. `refreshUI` est appelé depuis la boucle du moteur : en posant
	 * `tick.value++` là, Vue vidait sa file de rendu à la fin de CETTE tâche, et
	 * l'image coûtait le moteur PLUS le hud — mesuré, 22 ms de moteur et de rendu
	 * additionnés là où le budget est de 16,7. Séparés, l'image du terrain part à
	 * l'heure et le hud prend le créneau suivant.
	 *
	 * Le relais passe par un MessageChannel : un setTimeout(0) est ramené à 4 ms
	 * au-delà de cinq minuteurs imbriqués, ce qui décalerait le hud d'autant.
	 */
	const uiRenderChannel = new MessageChannel()
	let uiRenderScheduled = false
	uiRenderChannel.port1.onmessage = () => {
		uiRenderScheduled = false
		if (destroyed) { return }
		const start = performance.now()
		syncUI()
		tick.value++
		// Vue vide sa file de rendu dans une micro-tâche : la nôtre passe juste après
		// et mesure ce que le hud a réellement coûté.
		Promise.resolve().then(() => {
			const cost = performance.now() - start
			uiRefreshInterval = Math.min(UI_REFRESH_MAX, Math.max(UI_REFRESH_MIN, cost * UI_REFRESH_BUDGET))
		})
	}
	function refreshUI(force = false) {
		const now = performance.now()
		if (!force && now - lastRefresh < uiRefreshInterval) { return }
		lastRefresh = now
		// Un rendu déjà programmé lira de toute façon l'état le plus récent : inutile
		// d'en empiler un second, même sur un rafraîchissement forcé.
		if (uiRenderScheduled) { return }
		uiRenderScheduled = true
		uiRenderChannel.port2.postMessage(null)
	}
	/**
	 * Rafraîchissement différé, pour les gestionnaires d'événements qui modifient le
	 * moteur APRÈS nous (menu des réglages en phase de capture, raccourcis clavier).
	 */
	function refreshUISoon() { setTimeout(() => refreshUI(true), 0) }
	/**
	 * Watcher sur une valeur du moteur : la source n'étant plus réactive, on la relit
	 * à chaque tick et Vue ne déclenche le callback que si elle a changé.
	 */
	function watchGame<T>(getter: () => T, callback: (value: T, old: T) => void) {
		watch(() => { void tick.value; return getter() }, callback)
	}
	/**
	 * Watcher sur un réglage du lecteur. Le miroir est la source : qu'il bouge depuis le
	 * menu ou depuis un raccourci clavier (qui écrit dans le moteur, que syncUI recopie),
	 * on le repousse dans le moteur puis on exécute l'effet de bord.
	 */
	function watchUI<K extends keyof typeof ui>(key: K, callback: (value: (typeof ui)[K], old: (typeof ui)[K]) => void) {
		watch(() => ui[key], (value, old) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(game.value as any)[key] = value
			callback(value, old)
		})
	}
	const queue = ref<{ position: number, total: number } | null>(null)
	let getDelay = 1000
	const loaded = ref(false)
	const error = ref<unknown>(false)
	const fullscreen = ref(false)
	const progressBarTurn = ref<number | string>(0)
	const progressBarTooltipMargin = ref(0)
	const progressBarPreviewMouse = ref(0)
	const width = ref(0)
	const totalWidth = ref(0)
	const height = ref(0)
	const totalHeight = ref(0)
	let timeout: ReturnType<typeof setTimeout> | null = null
	let request: ReturnType<typeof LeekWars.get> | null = null
	const progress = ref(0)

	// fight.<locale>.lang (dico du rapport de combat) doit suivre la locale active, pas seulement
	// celle du boot, sinon un changement de langue laisse les clés fight.* en brut (#11926).
	loadLocalizedMessages('fight', (loc) => import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/fight.${loc}.lang`))

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
	game.value.marksForeground = localStorage.getItem('fight/marks-foreground') === 'true'
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
	game.value.showFPS = localStorage.getItem('fight/fps') === 'true'
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	;(game.value as any).player = { gameLaunched, $emit: emit }
	game.value.onFrame = () => refreshUI()
	// Le miroir part de l'état réel du moteur (réglages relus du localStorage juste
	// au-dessus) : sinon la première synchro ferait croire à un changement de chaque
	// réglage et rejouerait tous les effets de bord au lancement du combat.
	syncUI()

	if (props.fightId) {
		getFight(true)
	} else if (props.fight) {
		initFight(props.fight)
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

	function onFightProgress(data: unknown[]) {
		if (destroyed) return
		if (fight.value && data[0] === fight.value.id) {
			progress.value = data[1] as number
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

	// `compact` en est aussi : il change les marges du terrain et la place du hud. Un seul
	// watcher, donc un seul `resize()` quand la page change taille et disposition ensemble.
	watch([() => props.requiredWidth, () => props.requiredHeight, () => props.compact, fullscreen], () => resize())

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

	// Outils d'administration du lecteur : le choix de la carte du terrain et le
	// compteur d'images. L'éditeur de carte a déjà les siens.
	const admin = computed(() => !props.creator && store.getters.admin)

	const FPS_CHART_WIDTH = 150
	const FPS_CHART_HEIGHT = 40
	/**
	 * Courbe et statistiques des 30 dernières secondes. Ne se recalcule que sur
	 * `fpsVersion`, qui ne bouge qu'à la fermeture d'une fenêtre de mesure (deux
	 * fois par seconde) : le compteur ne doit pas coûter le temps qu'il mesure.
	 */
	const fpsStats = computed(() => {
		void ui.fpsVersion
		const history = game.value.meter.history
		if (!history.length) { return null }
		let min = Infinity, max = 0, total = 0
		for (const value of history) {
			if (value < min) { min = value }
			if (value > max) { max = value }
			total += value
		}
		// Échelle calée sur 60 tant qu'on ne dépasse pas : la courbe garde la même
		// hauteur d'une seconde à l'autre, sinon un creux ressemble à un plateau.
		const top = Math.max(60, max)
		const step = FPS_CHART_WIDTH / (game.value.meter.capacity - 1)
		// Un pixel de marge en haut et en bas : posés pile sur le bord, le sommet de
		// la courbe et le repère des 60 se font rogner de la moitié de leur trait.
		const y = (fps: number) => FPS_CHART_HEIGHT - 1 - (fps / top) * (FPS_CHART_HEIGHT - 2)
		// La valeur la plus récente reste collée à droite : la courbe défile au lieu
		// de s'étirer pendant les trente premières secondes.
		const points = history.map((value, i) =>
			(FPS_CHART_WIDTH - (history.length - 1 - i) * step).toFixed(1) + ',' + y(value).toFixed(1)).join(' ')
		// Repères espacés d'un facteur deux : en mode débridé la courbe monte à
		// plusieurs centaines et deux traits ne suffisent plus à la situer.
		const rules = [30, 60, 120, 240, 480].filter(fps => fps <= top).map(fps => ({ fps, y: y(fps) }))
		return { min, max, average: Math.round(total / history.length), p99: game.value.meter.percentile(0.99), points, rules }
	})

	const hasMarks = computed(() => { void tick.value; return Object.keys(game.value.markers).length > 0 || Object.keys(game.value.markersText).length > 0 })
	const progressBarWidth = computed(() => { void tick.value; return game.value && game.value.actions ? 100 * game.value.currentAction / game.value.actions.length : 0 })
	const progressBarPreviewWidth = computed(() => Math.max(0, progressBarPreviewMouse.value - progressBarWidth.value))

	function resize() {
		nextTick(() => {
			if (destroyed || !canvas) return
			const newWidth = getWidth()
			const newHeight = getHeight()
			if (newWidth === width.value && newHeight === height.value) return
			const aspectRatio = window.devicePixelRatio || 1
			game.value.ratio = aspectRatio
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(hudRef.value as any).hover_entity = game.value.mouseEntity
		}
		refreshUI()
	}
	function mousedown(e: MouseEvent) { game.value.mousedown(e); refreshUI(true) }
	function mouseup(e: MouseEvent) { game.value.mouseup(e); refreshUI(true) }

	// Filet de sécurité du rafraîchissement : un clic n'importe où (menu des réglages,
	// infobulles, panneaux téléportés hors du lecteur) et un battement lent suffisent à
	// rattraper tout état du moteur qu'aucun gestionnaire n'aurait signalé.
	let heartbeat: ReturnType<typeof setInterval> | null = null
	function onDocumentClick() { refreshUISoon() }

	onMounted(() => {
		canvas = document.querySelector('.game-canvas')
		if (canvas) {
			game.value.canvas = canvas
			game.value.ctx = canvas.getContext('2d')!
		}
		document.addEventListener('click', onDocumentClick, true)
		heartbeat = setInterval(() => refreshUI(true), 500)
	})

	function keydown(e: KeyboardEvent) {
		if (isTyping(e)) return
		refreshUISoon()
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
		if (!plain || isTyping(e)) return
		refreshUISoon()
		const k = e.keyCode
		if (k === 65) { game.value.showActions = !game.value.showActions; e.preventDefault() }
		else if (k === 69) { game.value.showEffects = !game.value.showEffects; e.preventDefault() }
		else if (k === 76) { game.value.showLifes = !game.value.showLifes; e.preventDefault() }
		else if (k === 79) { game.value.shadows = !game.value.shadows; e.preventDefault() }
		else if (k === 71) { game.value.largeActions = !game.value.largeActions; e.preventDefault() }
		else if (k === 78) { game.value.autoDark = false; game.value.dark = !game.value.dark; e.preventDefault() }
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
		else if (k === 88 && admin.value) {
			game.value.map.seed = Math.random() * 10000000 | 0
			game.value.mapLoaded()
			e.preventDefault()
		}
	}

	onBeforeUnmount(() => {
		destroyed = true
		document.removeEventListener('click', onDocumentClick, true)
		if (heartbeat) clearInterval(heartbeat)
		stopDragListeners()
		if (dragFrame) cancelAnimationFrame(dragFrame)
		game.value.pause()
		game.value.cancelled = true
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

	// Initialise le player à partir d'un combat déjà construit (pas de fetch
	// serveur). Utilisé par la page admin de test des animations de puces.
	function initFight(f: Fight) {
		fight.value = f
		emit('fight', f)
		nextTick(() => {
			game.value.startTurn = props.startTurn ?? 1
			game.value.startAction = props.startAction ?? 0
			game.value.init(f)
		})
	}

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
			// Garde contre une réponse vide (déjà observé en prod : crash en
			// aval sur f.team1_name, issue #3751). En général c'est la
			// branche .error() de LeekWars.get qui devrait être empruntée,
			// mais une réponse 200 + body null arrive parfois.
			if (!f) {
				error.value = true
				return
			}
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
				queue.value = f.queue as unknown as { position: number, total: number }
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
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					data: report.fight as any,
					comments: [], result: 'win', queue: 0, trophies: [],
					chests: 0, size: 0, rareloot: 0, levelups: 0,
				} as unknown as Fight
				fightLoaded(local_fight)
				if (store.state.farmer) {
					game.value.setLogs(report.logs)
				}
			})
		} else {
			if (request === null) {
				request = LeekWars.get('fight/get/' + props.fightId)
				request.then((f) => {
					if (destroyed) return
					request = null
					fightLoaded(f as unknown as Fight)
				}).error((err) => {
					if (destroyed) return
					request = null
					// LeekWars.get enveloppe en {error} le code d'erreur renvoyé par l'API, que le
					// template compare : sans cette extraction, chaque erreur s'affichait comme
					// « erreur à la génération ».
					// Un throw de fightLoaded arrive aussi ici (Error sans .error) → message générique.
					error.value = (err as ApiError | null)?.error ?? true
				})
			}
		}
	}

	function getLogs() {
		if (store.state.farmer) {
			game.value.numData++
			LeekWars.get('fight/get-logs/' + props.fightId).then(logs => {
				if (destroyed) return
				game.value.setLogs(logs, fight.value?.report?.turret_ai_owners)
			})
		}
	}

	function pause() {
		if (game.value.paused) game.value.resume()
		else game.value.pause()
		refreshUI(true)
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

	/** Pendant le didacticiel, le premier combat mène à l'éditeur plutôt qu'au rapport. */
	function afterFightRoute() {
		return LeekWars.didactitial_step === 3 ? '/editor' : '/report/' + props.fightId
	}

	function quit() {
		router.push(afterFightRoute())
	}

	/** Position du curseur sur la barre, en pourcentage borné à [0, 100]. */
	function barPercent(clientX: number) {
		const bar = progressBar.value
		if (!bar) return 0
		const rect = bar.getBoundingClientRect()
		if (!rect.width) return 0
		return Math.min(100, Math.max(0, 100 * (clientX - rect.left) / rect.width))
	}

	/** Envoie le combat à cette position. */
	function seekTo(percent: number) {
		const g = game.value
		if (!g || !g.actions) return
		g.requestJump(Math.round(g.actions.length * percent / 100))
	}

	/** L'infobulle « Tour n » et la barre d'aperçu suivent le curseur. */
	function updatePreview(clientX: number) {
		const bar = progressBar.value
		const tooltip = progressBarTooltip.value
		if (!bar || !tooltip) return
		const percent = barPercent(clientX)
		const pos = percent / 100
		let turn: number | string = 0
		for (const i in game.value.turnPosition) {
			if (pos >= game.value.turnPosition[i]) turn = i
		}
		progressBarTurn.value = turn
		const x = clientX - bar.getBoundingClientRect().left
		progressBarTooltipMargin.value = Math.min(Math.max(x - (tooltip.clientWidth / 2), 0), bar.clientWidth - tooltip.clientWidth)
		progressBarPreviewMouse.value = percent
	}

	function progressBarMove(e: MouseEvent) {
		if (dragging.value) return // pendant un glissement, c'est le listener global qui pilote
		updatePreview(e.clientX)
	}

	// ====== Poignée glissable ======
	// Reconstruire l'état du combat à une position donnée rejoue toutes les
	// actions depuis le début : impossible d'en lancer un par `mousemove`. La
	// poignée est donc pilotée par la position du curseur (`dragPosition`)
	// pendant le glissement, et le saut est limité à un par image.
	const dragging = ref(false)
	const dragPosition = ref(0)
	let dragFrame = 0

	const handlePosition = computed(() => dragging.value ? dragPosition.value : progressBarWidth.value)

	function dragStart(clientX: number) {
		dragging.value = true
		dragPosition.value = barPercent(clientX)
		updatePreview(clientX)
		seekTo(dragPosition.value)
	}

	function dragMove(clientX: number) {
		dragPosition.value = barPercent(clientX)
		updatePreview(clientX)
		if (!dragFrame) {
			dragFrame = requestAnimationFrame(() => {
				dragFrame = 0
				seekTo(dragPosition.value)
			})
		}
	}

	function dragEnd() {
		if (dragFrame) {
			cancelAnimationFrame(dragFrame)
			dragFrame = 0
		}
		seekTo(dragPosition.value)
		dragging.value = false
		stopDragListeners()
	}

	function onDragMouseMove(e: MouseEvent) { dragMove(e.clientX) }
	function onDragMouseUp() { dragEnd() }
	function onDragTouchMove(e: TouchEvent) {
		if (!e.touches.length) return
		e.preventDefault() // sinon le geste fait défiler la page au lieu de déplacer la poignée
		dragMove(e.touches[0].clientX)
	}
	function onDragTouchEnd() { dragEnd() }

	function stopDragListeners() {
		window.removeEventListener('mousemove', onDragMouseMove)
		window.removeEventListener('mouseup', onDragMouseUp)
		window.removeEventListener('touchmove', onDragTouchMove)
		window.removeEventListener('touchend', onDragTouchEnd)
		window.removeEventListener('touchcancel', onDragTouchEnd)
	}

	function progressBarDown(e: MouseEvent) {
		if (e.button !== 0) return
		e.preventDefault() // pas de sélection de texte pendant le glissement
		dragStart(e.clientX)
		window.addEventListener('mousemove', onDragMouseMove)
		window.addEventListener('mouseup', onDragMouseUp)
	}

	function progressBarTouchStart(e: TouchEvent) {
		if (!e.touches.length) return
		dragStart(e.touches[0].clientX)
		window.addEventListener('touchmove', onDragTouchMove, { passive: false })
		window.addEventListener('touchend', onDragTouchEnd)
		window.addEventListener('touchcancel', onDragTouchEnd)
	}

	/**
	 * Un trait par tour de jeu sur la barre. `turnPosition` donne déjà la place
	 * relative de chaque tour dans les actions — c'est ce qui sert à l'infobulle.
	 * Les tours dont le trait tomberait à moins de 5 px du précédent sont sautés :
	 * sur un combat très long, tous les tracer donnerait une trame illisible.
	 */
	// Les traits ne changent qu'avec le combat chargé et la largeur, mais le computed
	// est relu à chaque rafraîchissement du hud (jusqu'à vingt fois par seconde) : on
	// évite de trier les tours et de refaire le tableau à chaque fois. `turnPosition`
	// est un objet neuf à chaque chargement de combat, rempli d'un coup (Game.init) :
	// son identité suffit à reconnaître le combat.
	let ticksCache: { positions: {[key: number]: number}, width: number, value: {turn: number, left: number}[] } | null = null
	const turnTicks = computed(() => {
		void tick.value
		const positions = game.value ? game.value.turnPosition : null
		if (!positions) return []
		if (ticksCache && ticksCache.positions === positions && ticksCache.width === width.value) { return ticksCache.value }
		const minGap = 100 * 5 / Math.max(1, width.value)
		const ticks: {turn: number, left: number}[] = []
		let last = -Infinity
		for (const turn of Object.keys(positions).map(Number).sort((a, b) => a - b)) {
			const left = positions[turn] * 100
			// Le tour 1 commence à l'origine : son trait se confondrait avec le bord.
			if (left <= 0 || left >= 100) continue
			if (left - last < minGap) continue
			ticks.push({ turn, left })
			last = left
		}
		ticksCache = { positions, width: width.value, value: ticks }
		return ticks
	})

	function setLocalStorageAndRedraw(key: string, value: unknown, redraw = false) {
		localStorage.setItem('fight/' + key, '' + value)
		if (redraw) game.value.redraw()
	}

	watchUI('volume', () => { localStorage.setItem('fight/volume', '' + game.value.volume); game.value.changeVolume() })
	watchUI('sound', () => {
		if (!LeekWars.sfw) localStorage.setItem('fight/sound', '' + game.value.sound)
		game.value.toggleSound()
	})
	watchUI('shadows', () => { localStorage.setItem('fight/shadows', '' + game.value.shadows); game.value.toggleShadows(); game.value.redraw() })
	watchUI('tactic', () => { localStorage.setItem('fight/tactic', '' + game.value.tactic); game.value.toggleShadows(); game.value.redraw() })
	watchUI('showCells', () => setLocalStorageAndRedraw('cells', game.value.showCells, true))
	watchUI('marksForeground', () => setLocalStorageAndRedraw('marks-foreground', game.value.marksForeground, true))
	watchUI('showLifes', () => setLocalStorageAndRedraw('lifes', game.value.showLifes, true))
	watchUI('showEffects', () => setLocalStorageAndRedraw('effects', game.value.showEffects, true))
	watchUI('showIDs', () => setLocalStorageAndRedraw('ids', game.value.showIDs, true))
	watchUI('showActions', () => {
		localStorage.setItem('fight/actions', '' + game.value.showActions)
		if (game.value.actionsWidth === 0) game.value.actionsWidth = 395
		resize()
	})
	watchUI('largeActions', () => {
		localStorage.setItem('fight/large-actions', '' + game.value.largeActions)
		if (game.value.actionsWidth === 0) game.value.actionsWidth = 395
		resize()
	})
	// En plein écran, seul le lecteur est visible : les actions reviennent sur sa gauche.
	const actionsBelowNow = computed(() => !!props.actionsBelow && !fullscreen.value)
	watch(actionsBelowNow, below => {
		game.value.actionsBelow = below
		if (game.value.launched) {
			game.value.ground.resize(game.value.width, game.value.height, game.value.shadows)
			game.value.redraw()
		}
	}, { immediate: true })
	watch(() => !!props.compact, compact => { game.value.compact = compact }, { immediate: true })
	watchGame(() => game.value.actionsWidth, () => { localStorage.setItem('fight/actions-width', '' + game.value.actionsWidth); resize() })
	watchUI('dark', () => { localStorage.setItem('fight/dark', '' + game.value.dark); game.value.toggleDark() })
	watchUI('autoDark', () => { localStorage.setItem('fight/auto-dark', '' + game.value.autoDark); game.value.toggleDark() })
	// En mode auto, la Nexus suit le thème du site (clair / sombre) en direct.
	watch(() => LeekWars.darkMode, () => { if (game.value.autoDark) game.value.toggleDark() })
	watchUI('plainBackground', () => { localStorage.setItem('fight/plain-background', '' + game.value.plainBackground); resize() })
	watchUI('displayDebugs', () => { localStorage.setItem('fight/debugs', '' + game.value.displayDebugs) })
	watchUI('displayAILines', () => { localStorage.setItem('fight/debug-lines', '' + game.value.displayAILines) })
	watchUI('displayAllyDebugs', () => { localStorage.setItem('fight/ally-debugs', '' + game.value.displayAllyDebugs) })

	function canvasClick() { game.value.selectEntity(game.value.click()); refreshUI(true) }
	function canvasRightClick(e: Event) { game.value.rightClick(); e.preventDefault(); refreshUI(true) }

	watchGame(() => game.value.going_to_report, () => {
		if (game.value.going_to_report && !props.noReport && props.fightId && props.fightId !== 'local') {
			router.push(afterFightRoute())
		}
	})

	watchUI('mapType', (after, before) => {
		if (before !== -1) game.value.updateMap()
	})
	watchUI('showFPS', () => setLocalStorageAndRedraw('fps', game.value.showFPS))
	// Le moteur bascule de lui-même entre vsync et boucle libre à l'image suivante ;
	// on repart d'un historique vide, les deux régimes ne se moyennent pas.
	watchUI('uncapped', () => { game.value.meter.reset() })

	defineExpose({ get loaded() { return loaded.value }, set loaded(v: boolean) { loaded.value = v }, gameLaunched, get game() { return game.value as Game } })
</script>


<style lang="scss" scoped>
	.game {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		background: var(--panel-header-background);
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
			color: var(--grey-5);
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
		// `--panel-header-color` et non `--white` : la barre est peinte en
		// `--panel-header-background`, et ce fond n'est plus sombre en v3 clair
		// (#FBF7E8) — l'encre blanche y devenait le fond lui-même, contraste 1,00
		// mesuré : TOUTES les icônes du lecteur disparaissaient. Les deux jetons
		// vont par paire, en v2 comme en v3, en clair comme en sombre.
		color: var(--panel-header-color);
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
		padding: 12px 6px;
		min-width: 0;
		width: 36px;
		height: 48px;
	}
	.controls .control:hover {
		// Même raison : un voile blanc ne marque rien sur une barre claire. La
		// teinte suit l'encre de la barre, donc claire sur fond sombre et
		// sombre sur fond clair.
		background: color-mix(in srgb, var(--panel-header-color) 14%, transparent);
	}
	.controls .v-menu {
		vertical-align: top;
	}
	.controls .turn {
		line-height: 36px;
		color: var(--panel-header-color);
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
		background: var(--grey-13);
		transition: all 0.2s;
		white-space: nowrap;
		.preview-bar {
			display: none;
			position: absolute;
			top: 0;
			height: 6px;
			background: var(--grey-9);
			height: 100%;
		}
	}
	.progress-bar-wrapper:hover .progress-bar,
	.progress-bar-wrapper.dragging .progress-bar {
		height: 12px;
		bottom: -3px;
		.preview-bar {
			display: inline-block;
		}
	}
	.progress-bar .bar {
		height: 100%;
		background-color: var(--primary-surface);
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
		background: var(--grey-11);
		vertical-align: top;
		border: 4px solid #f2f2f2;
		z-index: 2;
		transition: all 0.2s;
	}
	.progress-bar-wrapper:hover .circle,
	.progress-bar-wrapper.dragging .circle {
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
	.progress-bar-wrapper:hover .progress-bar-turn,
	.progress-bar-wrapper.dragging .progress-bar-turn {
		display: inline-block;
	}
	.level {
		font-size: 17px;
		color: var(--text-color-secondary);
		font-weight: 500;
	}
	// Coin haut gauche : la barre de vie d'équipe est centrée et la gomme des
	// marqueurs est à droite, le compteur ne recouvre donc jamais rien.
	.fps-counter {
		position: absolute;
		top: 8px;
		left: 8px;
		z-index: 5;
		padding: 4px 8px 6px;
		border-radius: var(--radius);
		background: rgba(0, 0, 0, 0.55);
		color: var(--white);
		// Chiffres à chasse fixe : les valeurs changent deux fois par seconde, sinon
		// la largeur du panneau danse à chaque dizaine.
		font-variant-numeric: tabular-nums;
		pointer-events: none;
	}
	.fps-value {
		font-size: 15px;
		font-weight: 500;
		line-height: 18px;
		.unit {
			margin-left: 4px;
			font-size: 11px;
			font-weight: 400;
			opacity: 0.7;
		}
		// Le nombre ne veut plus dire « images affichées » : il faut que ça se voie.
		.uncapped {
			margin-left: 6px;
			padding: 1px 5px;
			border-radius: var(--radius);
			background: #ff9800;
			color: #000;
			font-size: 10px;
			font-weight: 500;
			text-transform: uppercase;
		}
	}
	.fps-chart {
		display: block;
		width: 150px;
		height: 40px;
		margin: 2px 0;
		.curve {
			fill: none;
			stroke: #6ec800;
			stroke-width: 1.5;
			// La courbe est étirée en hauteur par le viewBox : sans ça, le trait
			// s'épaissit avec elle et les creux deviennent illisibles.
			vector-effect: non-scaling-stroke;
		}
		.rule {
			stroke: var(--white);
			stroke-width: 1;
			stroke-dasharray: 2 3;
			opacity: 0.25;
			vector-effect: non-scaling-stroke;
		}
	}
	.fps-stats {
		display: flex;
		gap: 8px;
		font-size: 11px;
		opacity: 0.8;
		b {
			font-weight: 500;
		}
	}
	.clear-marks {
		position: absolute;
		top: 8px;
		right: 8px;
		background: var(--panel-header-background);
		color: var(--panel-header-color);
		cursor: pointer;
		font-size: 24px;
		z-index: 5;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		&:hover {
			background: var(--grey-3);
		}
	}
	.play-pause {
		position: absolute;
		width: 100px;
		height: 100px;
		top: calc(50% - 50px);
		left: calc(50% - 50px);
		font-size: 50px;
		color: var(--white);
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
	// Le v3 repeint les menus déroulants avec la surface de panneau (claire en
	// thème clair, cf. leekwars-shell-v3.scss) et cette règle-là passe devant
	// les styles scoped : le menu ne peut plus être sombre ici. Son encre doit
	// donc suivre le thème, sinon les icônes et les titres de section restent
	// en clair sur clair. Le v2, lui, garde son menu sombre : le fond et
	// l'encre claire y sont rétablis plus bas.
	.v-menu .settings-menu {
		&:deep(i) {
			// padding-right: 10px;
			color: var(--text-color-secondary);
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
		border-radius: var(--radius-medium);
		border: 1px solid var(--border);
		text-align: left;
		max-width: 700px;
		margin: 10px auto;
		.bar {
			height: 12px;
			width: 0;
			background: #30bb00;
			position: absolute;
			border-radius: var(--radius-medium);
			transition: width 1s;
		}
	}
	.map-menu {
		color: var(--text-color);
		padding: 10px;
		overflow: hidden;
	}
	.section {
		color: var(--text-color-secondary);
		padding: 4px 8px;
		font-size: 13px;
	}
	// Rendu v2 : les menus du lecteur y sont restés sombres (aucune règle de
	// coquille ne les repeint), donc l'encre claire d'origine est rétablie.
	body.v2 {
		.v-menu .settings-menu {
			background: #1E1E1E;
			&:deep(i) {
				color: var(--grey-13);
			}
			// Les libellés des interrupteurs et des cases portent l'encre du thème
			// (sombre en clair) : sur ce fond sombre, il faut l'éclaircir.
			&:deep(.label) {
				color: hsla(0, 0%, 100%, .7);
			}
		}
		.map-menu {
			background: #1E1E1E;
			color: var(--grey-13);
			// Les libellés des boutons radio portent leur propre encre (sombre) :
			// sur ce fond sombre, il faut la reprendre.
			:deep(.label) {
				color: var(--grey-13);
			}
		}
		.section {
			color: var(--white);
		}
	}
	// Les traits de tour : sous les marqueurs de mort et la poignée, et sombres
	// dans les deux thèmes — la piste (--grey-13) comme le remplissage vert sont
	// clairs de part et d'autre.
	.progress-bar .turn-tick {
		position: absolute;
		top: 0;
		width: 1px;
		height: 100%;
		background: var(--grey-1);
		opacity: 0.35;
		pointer-events: none;
		z-index: 1;
	}
	// Pendant le glissement, la poignée suit le curseur : la transition de 0,2 s
	// la ferait traîner derrière lui. La barre reste déployée tant qu'on tient la
	// poignée, même si le curseur sort de la zone de survol.
	.progress-bar-wrapper.dragging .circle,
	.progress-bar-wrapper.dragging .bar {
		transition: none;
	}
	.progress-bar-wrapper.dragging {
		cursor: grabbing;
	}
	.progress-bar .marker {
		width: 6px;
		height: 6px;
		position: absolute;
		top: 0;
		z-index: 2;
		transition: all 0.2s;
	}
	.progress-bar-wrapper:hover .marker,
	.progress-bar-wrapper.dragging .marker {
		width: 6px;
		height: 12px;
	}
</style>
