<template lang="html">
	<div :style="{width: width + 'px', height: height + 36 + 'px'}">
		<div v-if="error" class="error">
			<h2>{{ $t('fight.error_generating_fight') }}</h2>
			<br>
			<img src="/image/notgood.png">
			<br><br>
			<h4><i>{{ $t('fight.no_data_received') }}</i></h4>
			<br>
			<router-link v-if="fight" :to="'/report/' + fight.id">
				<v-btn>{{ $t('fight.see_report') }}</v-btn>
			</router-link>
			<br><br>
		</div>
		<div v-else-if="!loaded" class="loading">
			<template v-if="fight">
				<div v-if="fight.type === FightType.BATTLE_ROYALE" class="table br">
					<template v-for="(leek, i) in fight.leeks1">
						<div :key="leek.id" class="leek br">
							<leek-image :leek="leek" :scale="1" />
							<div class="name">{{ leek.name }}</div>
							<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
						</div>
						<img v-if="i < fight.leeks1.length - 1" :key="leek.id + 'vs'" class="vs" src="/image/vs.png">
					</template>
					<br><br>
				</div>
				<div v-else class="table">
					<div class="team">
						<div v-for="leek in fight.leeks1" :key="leek.id" class="leek" :class="{third: fight.leeks1.length >= 5 || fight.leeks1.length === 3, solo: fight.leeks1.length === 1, oneline: fight.leeks1.length <= 3}">
							<leek-image :leek="leek" :scale="1" />
							<div class="name">{{ leek.name }}</div>
							<lw-title v-if="leek.title && leek.title.length" :title="leek.title" />
							<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
						</div>
					</div>
					<img class="vs" src="/image/vs.png">
					<div class="team">
						<div v-for="leek in fight.leeks2" :key="leek.id" class="leek" :class="{third: fight.leeks2.length >= 5 || fight.leeks2.length === 3, solo: fight.leeks2.length === 1, oneline: fight.leeks2.length <= 3}">
							<leek-image :leek="leek" :scale="1" :invert="true" />
							<div class="name">{{ leek.name }}</div>
							<lw-title v-if="leek.title && leek.title.length" :title="leek.title" />
							<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
						</div>
					</div>
				</div>
			</template>
			<div class="loading-fight">
				<loader />
				<div class="loading-bar">
					<span :style="{width: progress + '%'}" class="bar striked"></span>
				</div>
				<div class="status">
					{{ $t('fight.loading_fight') }}
				</div>
				<div v-if="queue" class="queue-position">
					<span v-if="queue.position == -1">{{ $t('fight.generating') }}</span>
					<span v-else>{{ $t('fight.position_in_queue', [queue.position + 1, queue.total]) }}</span>
				</div>
			</div>
		</div>
		<div v-show="loaded" class="game">
			<div :style="{height: height + 'px'}" class="layers">
				<canvas :style="{width: width + 'px'}" class="bg-canvas"></canvas>
				<canvas :style="{width: width + 'px'}" class="game-canvas" @click="canvasClick" @mousemove="mousemove"></canvas>
				<div class="progress-bar-wrapper">
					<div ref="progressBarTooltip" :style="{'margin-left': progressBarTooltipMargin + 'px'}" class="progress-bar-turn v-tooltip__content top">
						<span class="content">{{ $t('fight.turn_n', [progressBarTurn]) }}</span>
					</div>
					<div ref="progressBar" class="progress-bar" @click="progressBarClick" @mousemove="progressBarMove">
						<div :style="{width: progressBarWidth + '%'}" class="bar"></div><div class="circle"></div>
					</div>
				</div>
				<hud ref="hud" :game="game" />
				<transition name="fade">
					<v-icon v-if="game.paused" class="play-pause">mdi-pause</v-icon>
				</transition>
				<transition name="fade">
					<v-icon v-if="!game.paused" class="play-pause">mdi-play</v-icon>
				</transition>
			</div>
			<div class="controls">
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<template v-slot:activator="{ on }">
						<v-icon v-ripple class="control" @click="pause" v-on="on">{{ game.paused ? 'mdi-play' : 'mdi-pause' }}</v-icon>
					</template>
					{{ $t('fight.pause') }} (P)
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<template v-slot:activator="{ on }">
						<v-icon v-ripple class="control" :style="{opacity: game.speedButtonVisible ? 1 : 0}" v-on="on" @click="game.speedUp()">mdi-fast-forward</v-icon>
					</template>
					{{ $t('fight.accelerate') }} (S)
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<template v-slot:activator="{ on }">
						<v-icon v-ripple class="control" v-on="on" @click="game.sound = !game.sound">{{ game.sound ? 'mdi-volume-high' : 'mdi-volume-low' }}</v-icon>
					</template>
					{{ $t(game.sound ? 'fight.sound_activated' : 'fight.sound_disactivated') }} (V)
				</v-tooltip>
				<div class="turn">{{ $t('fight.turn_n', [game.turn]) }}</div>
				<div class="filler"></div>
				<v-tooltip v-if="!LeekWars.mobile" :open-delay="0" :close-delay="0" top content-class="top">
					<template v-slot:activator="{ on }">
						<v-icon v-ripple class="control" v-on="on" @click="LeekWars.flex = !LeekWars.flex">mdi-crop-landscape</v-icon>
					</template>
					{{ $t('fight.enlarge_fight') }}
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<template v-slot:activator="{ on }">
						<v-icon v-ripple class="control" v-on="on" @click="toggleFullscreen">mdi-aspect-ratio</v-icon>
					</template>
					{{ $t('fight.fullscreen') }}
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<template v-slot:activator="{ on: tooltip }">
						<v-menu :close-on-content-click="false" top offset-y left>
							<template v-slot:activator="{ on: menu }">
								<v-icon v-ripple class="control" v-on="{...tooltip, ...menu}">mdi-settings-outline</v-icon>
							</template>
							<v-list :dense="true" class="settings-menu">
								<v-list-item v-ripple>
									<v-icon>mdi-heart-half-full</v-icon>
									<v-switch v-model="game.showLifes" :label="$t('fight.display_life_bars')" hide-details />
								</v-list-item>
								<v-list-item v-ripple>
									<v-icon>mdi-view-comfy</v-icon>
									<v-switch v-model="game.tactic" :label="$t('fight.tactic_mode')" hide-details />
								</v-list-item>
								<v-list-item v-ripple>
									<v-icon>mdi-numeric-1-box</v-icon>
									<v-switch v-model="game.showCells" :label="$t('fight.display_cell_numbers')" hide-details />
								</v-list-item>
								<v-list-item v-ripple>
									<v-icon>mdi-key</v-icon>
									<v-switch v-model="game.showIDs" :label="$t('fight.show_ids')" hide-details />
								</v-list-item>
								<v-list-item v-ripple>
									<v-icon>mdi-box-shadow</v-icon>
									<v-switch v-model="game.shadows" :label="$t('fight.display_shadows')" hide-details />
								</v-list-item>
							</v-list>
						</v-menu>
					</template>
					{{ $t('fight.settings') }}
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<template v-slot:activator="{ on }">
						<v-icon v-ripple class="control" v-on="on" @click="quit">mdi-exit-to-app</v-icon>
					</template>
					{{ $t('fight.quit') }}
				</v-tooltip>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { Fight, FightType, Report } from '@/model/fight'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { Game } from './game/game'
	import Hud from './hud.vue'

	const BAR_HEIGHT = 36

	@Component({
		name: 'player',
		components: { Hud }
	})
	export default class Player extends Vue {
		@Prop() fightId!: string
		@Prop() requiredWidth!: number
		@Prop() requiredHeight!: number
		FightType = FightType
		fight: Fight | null = null
		canvas: any
		game: Game = new Game()
		queue: any = null
		getDelay: number = 1000
		loaded: boolean = false
		error: boolean = false
		fullscreen: boolean = false
		progressBarTurn: any = 0
		progressBarTooltipMargin: number = 0
		width: number = 0
		height: number = 0
		timeout: any = null
		request: any = null
		progress: number = 0

		created() {
			if (localStorage.getItem('fight/shadows') === null) { localStorage.setItem('fight/shadows', 'true') }
			if (localStorage.getItem('fight/sound') === null) { localStorage.setItem('fight/sound', 'true') }
			if (localStorage.getItem('fight/lifes') === null) { localStorage.setItem('fight/lifes', 'true') }
			this.game.shadows = localStorage.getItem('fight/shadows') === 'true'
			this.game.tactic = localStorage.getItem('fight/tactic') === 'true'
			this.game.showCells = localStorage.getItem('fight/cells') === 'true'
			this.game.showLifes = localStorage.getItem('fight/lifes') === 'true'
			this.game.showIDs = localStorage.getItem('fight/ids') === 'true'
			this.game.sound = localStorage.getItem('fight/sound') === 'true'
			this.game.player = this
			this.getFight(true)
			this.resize()
			this.$emit('resize')
			this.$root.$on('resize', () => {
				this.resize()
			})
			this.$root.$on('keyup', this.keyup)
			this.$root.$on('keydown', this.keydown)
			this.$on('game-launched', () => {
				this.loaded = true
				this.setOrigin()
			})
			this.$root.$on('fight-progress', (data: any) => {
				if (this.fight && data[0] === this.fight.id) {
					this.progress = data[1]
				}
			})
		}
		@Watch('requiredWidth')
		requiredWidthChange() {
			this.resize()
		}
		getWidth() {
			if (this.fullscreen) { return window.innerWidth }
			else { return this.requiredWidth }
		}
		getHeight() {
			if (this.fullscreen) { return window.innerHeight }
			else { return this.requiredHeight }
		}
		get progressBarWidth() {
			return this.game && this.game.actions ? 100 * this.game.currentAction / this.game.actions.length : 0
		}
		resize() {
			Vue.nextTick(() => {
				const newWidth = this.getWidth()
				const newHeight = this.getHeight()
				if (newWidth === this.width && newHeight === this.height) { return }
				const aspectRatio = window.devicePixelRatio || 1
				this.game.ratio = aspectRatio
				this.width = newWidth
				this.height = newHeight - BAR_HEIGHT
				this.canvas.width = this.width * aspectRatio
				this.canvas.height = this.height * aspectRatio
				this.game.resize(this.canvas.width, this.canvas.height)
				this.game.redraw()
				this.setOrigin()
			})
		}
		setOrigin() {
			setTimeout(() => {
				const p = this.$el.getBoundingClientRect()
				this.game.setOrigin(p.left, p.top)
			}, 50)
		}
		mousemove(e: MouseEvent) {
			this.game.mousemove(e)
			;(this.$refs.hud as Hud).hover_entity = this.game.mouseEntity
		}
		mounted() {
			this.canvas = document.querySelector('.game-canvas')
			this.game.canvas = this.canvas
			this.game.ctx = this.canvas.getContext('2d')
		}
		keydown(e: KeyboardEvent) {
			if (e.keyCode === 32) {
				if (this.game.paused) {
					this.game.resume()
				} else {
					this.game.pause()
				}
				e.preventDefault()
				return false
			}
		}
		keyup(e: KeyboardEvent) {
			if (e.keyCode === 81) { // Q
				if (this.fullscreen) {
					this.toggleFullscreen()
				}
				this.game.showReport()
				e.preventDefault()
			} else if (e.keyCode === 80) { // P
				if (this.game.paused) {
					this.game.resume()
				} else {
					this.game.pause()
				}
				e.preventDefault()
			} else if (e.keyCode === 83) { // S
				this.game.speedUp()
				e.preventDefault()
			} else if (e.keyCode === 70) { // F
				this.toggleFullscreen()
				e.preventDefault()
			} else if (e.keyCode === 86) { // V
				this.game.sound = !this.game.sound
				e.preventDefault()
			}
		}
		beforeDestroy() {
			this.game.pause()
			this.game.cancelled = true
			this.$root.$off('keyup', this.keyup)
			this.$root.$off('keydown', this.keydown)
			this.$root.$off('resize')
			this.$root.$off('fight-progress')
			if (this.timeout) { clearTimeout(this.timeout) }
			if (this.request) { this.request.abort() }
		}
		getFight(first: boolean) {
			const fightLoaded = (fight: Fight) => {
				this.fight = fight
				this.$emit('fight', fight)
				if (fight.status >= 1) {
					this.getLogs()
					this.game.init(fight)
				} else {
					if (first) {
						LeekWars.socket.send([SocketMessage.FIGHT_PROGRESS_REGISTER, this.fight.id])
					}
					this.queue = fight.queue
					if (this.loaded) { return }
					this.timeout = setTimeout(() => {
						this.getFight(false)
					}, this.getDelay)
					this.getDelay += 500
					this.getDelay = Math.min(4000, this.getDelay)
				}
			}
			if (this.fightId === 'local') {
				import(`@/report.json`).then(report => {
					const local_fight = {
						title: 'Fight', context: 3,	date: 0,
						farmers1: {1: {id: 1, name: 'Pilow'} as Farmer},
						farmers2: {1: {id: 1, name: 'Pilow'} as Farmer},
						id: 0,
						farmer1: 1, farmer2: 1,
						leeks1: [],	leeks2: [],
						team1: 1, team2: 1,
						report: {} as Report,
						status: 1,
						team1_name: "A", team2_name: "B",
						tournament: 0, type: 0, winner: 1, year: 2019,
						data: report.default.fight as any,
						comments: [],
						result: 'win', queue: 0
					} as Fight
					fightLoaded(local_fight)
					this.game.setLogs((report.default as any).logs[this.$store.state.farmer.id])
				})
			} else {
				this.request = LeekWars.get('fight/get/' + this.fightId)
				this.request.then((data: any) => {
					fightLoaded(data.fight)
				}).error(() => this.error = true)
			}
		}
		getLogs() {
			if (this.$store.state.farmer) {
				LeekWars.post('fight/get-logs', {fight_id: this.fightId}).then(data => {
					this.game.setLogs(data.logs)
					this.$store.commit('set-habs', data.habs)
					this.$store.commit('set-talent', data.talent)
					this.$store.commit('set-leek-talents', data.leek_talents)
				})
			}
		}
		pause() {
			if (this.game.paused) {
				this.game.resume()
			} else {
				this.game.pause()
			}
		}
		toggleFullscreen() {
			if (this.fullscreen) {
				LeekWars.fullscreenExit()
				this.fullscreen = false
			} else {
				LeekWars.fullscreenEnter(this.$el as HTMLElement, (fullscreen: boolean) => {
					this.fullscreen = fullscreen
				})
			}
		}
		quit() {
			this.$router.push('/report/' + this.fightId)
		}
		progressBarClick(e: MouseEvent) {
			const bar = this.$refs.progressBar as HTMLElement
			const action = Math.round(this.game.actions.length * (e.pageX - bar.getBoundingClientRect().left) / bar.offsetWidth)
			this.game.jump(action)
		}
		progressBarMove(e: MouseEvent) {
			const bar = this.$refs.progressBar as HTMLElement
			const tooltip = this.$refs.progressBarTooltip as HTMLElement
			const barOffset = bar.getBoundingClientRect().left
			let turn: any = 0
			const pos = (e.pageX - barOffset) / bar.clientWidth
			for (const i in this.game.turnPosition) {
				if (pos >= this.game.turnPosition[i]) {
					turn = i
				}
			}
			this.progressBarTurn = turn
			this.progressBarTooltipMargin = Math.min(Math.max((e.pageX - barOffset) - (tooltip.clientWidth / 2), 0), bar.clientWidth - tooltip.clientWidth)
		}
		@Watch("game.sound") toggleSound() {
			localStorage.setItem('fight/sound', '' + this.game.sound)
			this.game.toggleSound()
		}
		@Watch("game.shadows") toggleShadows() {
			localStorage.setItem('fight/shadows', '' + this.game.shadows)
			this.game.toggleShadows()
			this.game.redraw()
		}
		@Watch("game.tactic") toggleTactic() {
			localStorage.setItem('fight/tactic', '' + this.game.tactic)
			this.game.toggleShadows()
			this.game.redraw()
		}
		@Watch("LeekWars.flex") toggleLarge() {
			localStorage.setItem('fight/large', '' + LeekWars.flex)
			this.$emit('resize')
		}
		@Watch("game.showCells") toggleCells() {
			localStorage.setItem('fight/cells', '' + this.game.showCells)
			this.game.redraw()
		}
		@Watch("game.showLifes") toggleLifes() {
			localStorage.setItem('fight/lifes', '' + this.game.showLifes)
			this.game.redraw()
		}
		@Watch("game.showIDs") toggleIDs() {
			localStorage.setItem('fight/ids', '' + this.game.showIDs)
			this.game.redraw()
		}
		canvasClick() {
			this.game.selectedEntity = this.game.click()
		}
		@Watch("game.going_to_report")
		endOfFight() {
			if (this.game.going_to_report) {
				this.$router.push("/report/" + this.fightId)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.game {
		width: 100%;
	}
	.layers {
		position: relative;
	}
	.table {
		display: flex;
		align-items: center;
		min-height: 0;
		justify-content: center;
		&.br {
			flex-wrap: wrap;
			margin-bottom: 20px;
			.vs {
				width: 6%;
			}
		}
		.team {
			flex: 1;
			height: 100%;
			align-items: baseline;
			padding: 15px;
			max-width: 700px;
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
			width: 50%;
			&.third {
				width: 33%;
			}
			&.solo {
				width: 100%;
			}
			&.br {
				width: 12%;
			}
			height: 50%;
			&.oneline {
				height: 100%;
			}
			text-align: center;
			display: inline-flex;
			padding: 6px;
			flex-direction: column;
			align-items: center;
			justify-content: center;
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
		}
	}
	#app.app .table .team {
		padding: 2px;
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
		line-height: 36px;
		height: 36px;
		background: #2a2a2a;
		user-select: none;
		display: flex;
	}
	.controls.large {
		line-height: 50px;
		height: 50px;
	}
	.controls .control {
		padding: 5px 12px;
		cursor: pointer;
		color: white;
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
		padding: 6px;
		font-size: 18px;
		color: #aaa;
	}
	.error {
		display: none;
		padding-top: 70px;
		text-align: center;
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
	}
	.progress-bar-wrapper:hover .progress-bar {
		height: 12px;
	}
	.progress-bar .bar {
		height: 100%;
		background-color: #5fad1b;
		transition: all 0.2s;
		display: inline-block;
		vertical-align: top;
	}
	.progress-bar .circle {
		width: 16px;
		height: 16px;
		margin-top: -4px;
		margin-left: -7px;
		display: inline-block;
		border-radius: 50%;
		background: #ccc;
		vertical-align: top;
		border: 4px solid #f2f2f2;
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
	}
	.progress-bar-wrapper:hover .progress-bar-turn {
		display: inline-block;
	}
	.level {
		font-size: 17px;
		color: #555;
		font-weight: 500;
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
	.settings-menu {
		background: #1E1E1E;
		i {
			padding-right: 10px;
			color: #eee;
		}
	}
	.settings-menu ::v-deep label {
		color: hsla(0,0%,100%,.7);
	}
	.loader {
		padding-bottom: 10px;
		padding-top: 0;
	}
	.status {
		margin-bottom: 10px;
	}
	.loading-bar {
		height: 14px;
		position: relative;
		background: white;
		border-radius: 6px;
		border: 1px solid #ddd;
		text-align: left;
		max-width: 700px;
		margin: 10px auto;
		margin-bottom: 15px;
		.bar {
			height: 12px;
			width: 0;
			background: #30bb00;
			position: absolute;
			border-radius: 6px;
			transition: width 1s;
		}
	}
</style>
