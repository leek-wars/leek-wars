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
			<div v-if="fight && !LeekWars.mobile">
				<template v-if="fight.type === FightType.BATTLE_ROYALE">
					<template v-for="(leek, i) in fight.leeks1">
						<div :key="leek.id" class="leek">
							<leek-image :leek="leek" :scale="0.6" />
							<div class="name">{{ leek.name }}</div>
							<span class="level">{{ $t('leek.level_n', [leek.level]) }}</span>
						</div>
						<br v-if="i == 1 && fight.leeks1.length < 5" :key="leek.id + 'br'">
						<span v-if="i < fight.leeks1.length - 1" :key="leek.id + 'vs'" class="vs">VS</span>
					</template>
					<br><br>
				</template>
				<table v-else>
					<tr>
						<td class="team-td">
							<span v-for="(leek, i) in fight.leeks1" :key="leek.id">
								<div class="leek">
									<leek-image :leek="leek" :scale="0.6" />
									<div class="name">{{ leek.name }}</div>
									<span class="level">{{ $t('leek.level_n', [leek.level]) }}</span>
								</div>
								<br v-if="i == 1 && fight.leeks1.length < 5">
							</span>
						</td>
						<td><span class="vs">VS</span></td>
						<td class="team-td">
							<span v-for="(leek, i) in fight.leeks2" :key="leek.id">
								<div class="leek">
									<leek-image :leek="leek" :scale="0.6" />
									<div class="name">{{ leek.name }}</div>
									<span class="level">{{ $t('leek.level_n', [leek.level]) }}</span>
								</div>
								<br v-if="i == 1 && fight.leeks2.length < 5">
							</span>
						</td>
					</tr>
				</table>
			</div>
			<div class="loading-fight">
				<loader />
				{{ $t('fight.loading_fight') }}
				<div v-if="queue" class="queue-position">
					<span v-if="queue.position == -1 || queue.position == 0">{{ $t('fight.generating') }}</span>
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
				<hud :game="game" />
				<transition name="fade">
					<i v-if="game.paused" class="play-pause material-icons">pause</i>
				</transition>
				<transition name="fade">
					<i v-if="!game.paused" class="play-pause material-icons">play_arrow</i>
				</transition>
			</div>
			<div class="controls">
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<i v-ripple slot="activator" class="material-icons control" @click="pause">{{ game.paused ? 'play_arrow' : 'pause' }}</i>
					{{ $t('fight.pause') }} (P)
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<i v-ripple slot="activator" class="material-icons control" @click="game.speedUp()">
						<span :style="{opacity: game.speedButtonVisible ? 1 : 0}">fast_forward</span>
					</i>
					{{ $t('fight.accelerate') }} (S)
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<i v-ripple slot="activator" class="material-icons control" @click="game.sound = !game.sound">{{ game.sound ? 'volume_up' : 'volume_mute' }}</i>
					{{ $t(game.sound ? 'fight.sound_activated' : 'fight.sound_disactivated') }} (V)
				</v-tooltip>
				<div class="turn">{{ $t('fight.turn_n', [game.turn]) }}</div>
				<div class="filler"></div>
				<v-tooltip v-if="!LeekWars.mobile" :open-delay="0" :close-delay="0" top content-class="top">
					<i v-ripple slot="activator" class="material-icons control" @click="LeekWars.flex = !LeekWars.flex">crop_5_4</i>
					{{ $t('fight.enlarge_fight') }}
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<i v-ripple slot="activator" class="material-icons control" @click="toggleFullscreen">aspect_ratio</i>
					{{ $t('fight.fullscreen') }}
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<v-menu slot="activator" :close-on-content-click="false" top offset-y left>
						<i v-ripple slot="activator" class="material-icons control">settings</i>
						<v-list :dense="true" dark class="settings-menu">
							<v-list-tile v-ripple>
								<i class="material-icons">favorite_border</i>
								<v-switch v-model="game.showLifes" :label="$t('fight.display_life_bars')" hide-details />
							</v-list-tile>
							<v-list-tile v-ripple>
								<i class="material-icons">view_comfy</i>
								<v-switch v-model="game.tactic" :label="$t('fight.tactic_mode')" hide-details />
							</v-list-tile>
							<v-list-tile v-ripple>
								<i class="material-icons">looks_one</i>
								<v-switch v-model="game.showCells" :label="$t('fight.display_cell_numbers')" hide-details />
							</v-list-tile>
							<v-list-tile v-ripple>
								<i class="material-icons">flip_to_front</i>
								<v-switch v-model="game.shadows" :label="$t('fight.display_shadows')" hide-details />
							</v-list-tile>
						</v-list>
					</v-menu>
					{{ $t('fight.settings') }}
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<i v-ripple slot="activator" class="material-icons control" @click="quit">input</i>
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

		created() {
			if (localStorage.getItem('fight/shadows') === null) { localStorage.setItem('fight/shadows', 'true') }
			if (localStorage.getItem('fight/sound') === null) { localStorage.setItem('fight/sound', 'true') }
			this.game.shadows = localStorage.getItem('fight/shadows') === 'true'
			this.game.tactic = localStorage.getItem('fight/tactic') === 'true'
			this.game.showCells = localStorage.getItem('fight/cells') === 'true'
			this.game.showLifes = localStorage.getItem('fight/lifes') === 'true'
			this.game.sound = localStorage.getItem('fight/sound') === 'true'
			this.getFight()
			this.resize()
			this.$emit('resize')
			this.$root.$on('resize', () => {
				this.resize()
			})
			this.$root.$on('keyup', this.keyup)
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
				this.width = newWidth
				this.height = newHeight - BAR_HEIGHT
				this.canvas.width = this.width * aspectRatio
				this.canvas.height = this.height * aspectRatio
				this.game.resize(this.canvas.width, this.canvas.height, this.canvas)
				this.game.redraw()
			})
		}
		mousemove(e: MouseEvent) {
			this.game.mousemove(e)
		}
		mounted() {
			this.canvas = document.querySelector('.game-canvas')
			this.game.ctx = this.canvas.getContext('2d')
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
			this.$root.$off('resize')
			if (this.timeout) { clearTimeout(this.timeout) }
			if (this.request) { this.request.abort() }
		}
		getFight() {
			const fightLoaded = (fight: Fight) => {
				this.fight = fight
				this.$emit('fight', fight)
				if (fight.status >= 1) {
					this.getLogs()
					this.game.init(fight)
					this.loaded = true
					this.resize()
				} else {
					this.queue = fight.queue
					if (this.loaded) { return }
					this.timeout = setTimeout(() => {
						this.getFight()
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
		}
		canvasClick() {
			if (this.game.paused) {
				this.game.resume()
			} else {
				this.game.pause()
			}
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
	}
	.controls .control:hover {
		background: rgba(255,255,255, 0.2);
	}
	.controls .v-menu {
		vertical-align: top;
	}
	.controls i {
		color: white;
	}
	.controls > div {
		line-height: 36px;
		color: white;
		display: inline-block;
		vertical-align: top;
		padding: 0 8px;
	}
	.controls.large > div {
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
		padding-bottom: 20px;
		font-size: 18px;
		text-align: center;
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
		transition: all 0.3s;
		display: inline-block;
		vertical-align: top;
	}
	.progress-bar .circle {
		width: 8px;
		height: 8px;
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
		width: 14px;
		height: 14px;
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
	.team-td {
		width: 470px;
	}
	.leek {
		display: inline-block;
		text-align: center;
		margin: 6px;
		width: 140px;
	}
	.leek img {
		max-width: 90%;
	}
	.vs {
		font-size: 25px;
		font-weight: bold;
		margin: 10px;
		color: #666;
	}
	.leek .name {
		padding: 2px 0;
		font-size: 20px;
		font-weight: 500;
		text-overflow: ellipsis;
		overflow: hidden;
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
	.settings-menu i {
		padding-right: 10px;
		color: #eee;
	}
</style>
