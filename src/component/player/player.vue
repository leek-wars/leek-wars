<template lang="html">
	<div id="player" :style="{width: width + 'px', height: height + 'px'}">
		<div v-if="!loaded" id="loading">
			<!-- <template v-if='fight.type == FightType.BATTLE_ROYALE'>
				@foreach (i : leek in fight.leeks1)
					<div class='leek' leek='{leek.id}'>
						<div class='image'></div>
						<span class='name'>{leek.name}</span>
						<br>
						<span class='level'>{#leek_level, leek.level}</span>
					</div>
					@if (i == 1 && fight.leeks1.length < 5) <br> @end
					@if (i < fight.leeks1.length - 1)
						<span class='vs'>VS</span>
					@end
				@end
				<br><br>
			</template>
			<table v-else><tr>
				<td class='team-td'>
					@foreach (i : leek in fight.leeks1)
						<div class='leek' leek='{leek.id}'>
							<div class='image'></div>
							<span class='name'>{leek.name}</span>
							<br>
							<span class='level'>{#leek_level, leek.level}</span>
						</div>
						@if (i == 1 && fight.leeks1.length < 5) <br> @end
					@end
				</td>
				<td><span class='vs'>VS</span></td>
				<td class='team-td'>
					@foreach (i : leek in fight.leeks2)
						<div class='leek' leek='{leek.id}'>
							<div class='image'></div>
							<span class='name'>{leek.name}</span>
							<br>
							<span class='level'>{#leek_level, leek.level}</span>
						</div>
						@if (i == 1 && fight.leeks2.length < 5) <br> @end
					@end
				</td>
			</tr></table>
			-->
			<div class="loading-fight">
				<loader />
				{{ $t('fight.loading_fight') }}
				<div v-if="queue" class="queue-position">
					<span v-if="queue.position == -1 || queue.position == 0">{{ $t('fight.generating') }}</span>
					<span v-else>{{ $t('fight.position_in_queue', [queue.position + 1, queue.total]) }}</span>
				</div>
			</div>
		</div>

		<div v-if="error" id="error">
			<h2>{{ $t('fight.error_generating_fight') }}</h2>
			<br>
			<img src="/image/notgood.png">
			<br><br>
			<h4><i>{{ $t('fight.no_data_received') }}</i></h4>
			<br>
			<router-link :to="'/report/' + fight.id">
				<div class="button">{{ $t('fight.see_report') }}</div>
			</router-link>
			<br><br>
		</div>

		<div v-if="noHTML5" id="browser">
			<h2>{{ $t('browser_cannot_display') }}</h2>
			<br>
			<img src="image/notgood.png">
			<br><br>
			<h4><i>{{ $t('update_browser') }}</i></h4>
			<br>
			<div id="browser-list">
				<div class="browser">
					<a target="blank" href="https://www.google.com/intl/fr_fr/chrome/browser/">
						<img src="image/chrome.png">
						<h4>Chrome</h4>
					</a>
				</div>
				<div class="browser">
					<a target="blank" href="http://www.opera.com/fr">
						<img src="image/opera.png">
						<h4>Opera</h4>
					</a>
				</div>
				<div class="browser">
					<a target="blank" href="http://windows.microsoft.com/fr-fr/internet-explorer/download-ie">
						<img src="image/ie.png">
						<h4>Internet Explorer</h4>
					</a>
				</div>
				<div class="browser">
					<a target="blank" href="http://www.mozilla.org/fr/firefox/new/">
						<img src="image/firefox.png">
						<h4>Firefox</h4>
					</a>
				</div>
				<div class="browser">
					<a target="blank" href="http://www.apple.com/fr/safari/">
						<img src="image/safari.png">
						<h4>Safari</h4>
					</a>
				</div>
			</div>
			<br>
			<router-link :to="'/report/' + fight.id">
				<div class="button">{{ $t('see_report') }}</div>
			</router-link>
		</div>

		<div v-show="loaded" id="game">
			<div id="layers" :style="{height: height - 36 + 'px'}">
				<canvas id="bg-canvas"></canvas>
				<canvas id="game-canvas"></canvas>
				<div id="progress-bar-wrapper">
					<div id="progress-bar-turn" class="tooltip fixed top"><span class="content"></span></div>
					<div id="progress-bar">
						<div class="bar"></div><div class="circle"></div>
					</div>
				</div>
				<hud :game="game" />
			</div>

			<div id="controls">
				<div id="turn">{{ $t('fight.turn_n', [game.turn]) }}</div>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<i v-ripple slot="activator" class="material-icons control" @click="pause">{{ game.paused ? 'play_arrow' : 'pause' }}</i>
					{{ $t('fight.pause') }} (P)
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<i v-ripple slot="activator" class="material-icons control" @click="speedUp">fast_forward</i>
					{{ $t('fight.accelerate') }}
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<i v-ripple slot="activator" class="material-icons control" @click="toggleFullscreen">aspect_ratio</i>
					{{ $t('fight.fullscreen') }}
				</v-tooltip>
				<v-tooltip :open-delay="0" :close-delay="0" top content-class="top">
					<v-menu slot="activator" :close-on-content-click="false" top offset-y>
						<i v-ripple slot="activator" class="material-icons control">settings</i>
						<v-list :dense="true" dark>
							<v-list-tile v-ripple>
								<v-switch :label="$t('fight.enlarge_fight')" />
							</v-list-tile>
							<v-list-tile v-ripple>
								<v-switch v-model="game.showLifes" :label="$t('fight.display_life_bars')" />
							</v-list-tile>
							<v-list-tile v-ripple>
								<v-switch v-model="game.tactic" :label="$t('fight.tactic_mode')" />
							</v-list-tile>
							<v-list-tile v-ripple>
								<v-switch v-model="game.showCells" :label="$t('fight.display_cell_numbers')" />
							</v-list-tile>
							<v-list-tile v-ripple>
								<v-switch v-model="game.shadows" :label="$t('fight.display_shadows')" />
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
	import { Fight } from '@/model/fight'
	import { LeekWars } from '@/model/leekwars'
	import { AxiosResponse } from 'axios'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { Game } from './game/game'
	import Hud from './hud.vue'

	const BAR_HEIGHT = 36

	@Component({
		name: 'player',
		components: { Hud }
	})
	export default class Player extends Vue {
		@Prop() fightId!: number
		@Prop() requiredWidth!: number
		@Prop() requiredHeight!: number
		fight!: Fight
		canvas: any
		noHTML5: boolean = false
		game: Game = new Game()
		queue: any = null
		getDelay: number = 1000
		loaded: boolean = false
		error: boolean = false
		fullscreen: boolean = false

		created() {
			this.getFight()
		}
		@Watch('requiredWidth')
		requiredWidthChange() {
			this.resize()
		}

		get width() {
			if (this.fullscreen) { return window.innerWidth }
			else { return this.requiredWidth }
		}
		get height() {
			if (this.fullscreen) { return window.innerHeight }
			else { return this.requiredHeight }
		}

		resize() {
			const aspectRatio = window.devicePixelRatio || 1
			this.canvas.width = this.width * aspectRatio
			this.canvas.height = (this.height - BAR_HEIGHT) * aspectRatio
			this.game.resize(this.canvas.width, this.canvas.height)
		}

		mounted() {
			this.canvas = document.getElementById('game-canvas')
			// Check the element is in the DOM and the browser supports canvas
			if (!this.canvas.getContext) {
				// $('#browser-list .browser').shuffle()
				this.noHTML5 = true
				return
			}
			this.game.ctx = this.canvas.getContext('2d')
		}

		// if ($("#fight-page .chat-input-content").is(":focus")) return null

		// if (event.keyCode == 81) { // Q
		// 	if (_fullscreen) {
		// 		LW.pages.fight.fullscreen()
		// 	}
		// 	game.showReport()
		// 	event.preventDefault()
		// }

		// if (event.keyCode == 80) { // P
		// 	if (game.paused) {
		// 		game.resume()
		// 	} else {
		// 		game.pause()
		// 	}
		// 	event.preventDefault()
		// }

		// if (event.keyCode == 83) { // S
		// 	game.speedUp()
		// 	event.preventDefault()
		// }

		// if (event.keyCode == 70) { // F
		// 	LW.pages.fight.fullscreen()
		// 	event.preventDefault()
		// }

		beforeDestroy() {
			console.log("Destroy player")
			this.game.pause()
		}

		getFight() {
			LeekWars.get('fight/get/' + this.fightId).then((data: AxiosResponse) => {
				if (!data.data.success) {
					// this.game.error()
					return
				}
				const fight = data.data.fight
				this.$emit('fight', fight)
				if (fight.status >= 1) {
					this.game.init(fight.data)
					this.loaded = true
					this.resize()
				} else {
					this.queue = fight.queue
					if (this.loaded) { return }
					setTimeout(() => {
						this.getFight()
					}, this.getDelay)
					this.getDelay += 500
					this.getDelay = Math.min(4000, this.getDelay)
				}
			})
		}

		pause() {
			if (this.game.paused) {
				this.game.resume()
			} else {
				this.game.pause()
			}
		}
		speedUp() {
			this.game.speedUp()
		}
		toggleFullscreen() {
			if (this.fullscreen) {
				LeekWars.fullscreenExit()
			} else {
				LeekWars.fullscreenEnter(this.$el, (fullscreen: boolean) => {
					this.fullscreen = fullscreen
					this.resize()
				})
			}
		}
		quit() {
			this.$router.push('/report/' + this.fightId)
		}
	}
</script>

<style lang="scss" scoped>
	#game {
		width: 100%;
	}
	#layers {
		position: relative;
	}
	#bg-canvas {
		position: absolute;
		top: 0; bottom: 0;
		left: 0; right: 0;
	}
	#bg-canvas:full-screen {
		max-height: 100%;
	}
	#game-canvas {
		position: absolute;
		top: 0; bottom: 0;
		left: 0; right: 0;
	}
	#game-canvas:full-screen {
		max-height: 100%;
	}
	#turn {
		font-weight: bold;
	}
	#controls {
		text-align: center;
		line-height: 36px;
		height: 36px;
		background: #2a2a2a;
		user-select: none;
	}
	#controls.large {
		line-height: 50px;
		height: 50px;
	}
	#controls .control {
		padding: 6px 12px;
		cursor: pointer;
	}
	#controls .control:hover {
		background: rgba(255,255,255, 0.2);
	}
	#controls .v-menu {
		vertical-align: top;
	}
	#controls i {
		color: white;
	}
	#controls > div {
		line-height: 36px;
		color: white;
		display: inline-block;
		vertical-align: top;
		padding: 0 8px;
	}
	#controls.large > div {
		line-height: 50px;
	}
	#loading {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.loading-fight {
		padding: 10px;
		padding-bottom: 20px;
		font-size: 18px;
		text-align: center;
	}
	.queue-position {
		padding: 6px;
		font-size: 18px;
		color: #aaa;
	}
</style>
