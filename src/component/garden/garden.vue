<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div v-if="garden" class="tabs">
				<tooltip>
					<template v-slot:activator="{ on }">
						<div class="tab action hidden" v-on="on">
							<img src="/image/icon/garden.png">
							<span v-if="garden.fights > 0">{{ garden.fights }}</span>
							<span v-else>{{ remainingTime }}</span>
						</div>
					</template>
					<span v-if="garden.fights > 0">{{ $t('n_remaining_fights', [garden.fights]) }}</span>
					<span v-else>{{ $t('next_fight_in', [remainingTime]) }}</span>
				</tooltip>
			</div>
		</div>
		<div class="container">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column3">
				<panel class="garden-left first last">
					<div slot="content">
						<template v-if="category === 'challenge'">
							<div class="tab active enabled router-link-active">
								<h2>{{ $t('challenge') }}</h2>
								<span class="fights"><img src="/image/icon/grey/garden.png"> {{ challengeFights }}</span>
							</div>
						</template>
						<div v-else>
							<router-link v-ripple to="/garden/solo" class="tab enabled">
								<h2>{{ $t('category_solo_fight') }}</h2>
								<img class="player" src="/image/player.png">
								<img class="sword" src="/image/icon/grey/garden.png">
								<img class="player" src="/image/player.png">
							</router-link>
							<tooltip :disabled="farmerEnabled">
								<template v-slot:activator="{ on }">
									<router-link v-ripple :class="{ enabled: farmerEnabled }" :event="farmerEnabled ? 'click' : ''" to="/garden/farmer" class="tab" v-on="on">
										<h2>{{ $t('category_farmer_fight') }}</h2>
										<span class="player-count">4</span>&nbsp;<img class="player" src="/image/player.png">
										<img class="sword" src="/image/icon/grey/garden.png">
										<span class="player-count">4</span>&nbsp;<img class="player" src="/image/player.png">
									</router-link>
								</template>
								{{ $t('you_must_have_2_leeks') }}
							</tooltip>

							<tooltip :disabled="teamEnabled">
								<template v-slot:activator="{ on }">
									<router-link v-ripple :class="{ enabled: teamEnabled }" :event="teamEnabled ? 'click' : ''" to="/garden/team" class="tab" v-on="on">
										<h2>{{ $t('category_team_fight') }}</h2>
										<span class="player-count">6</span>&nbsp;<img class="player" src="/image/player.png">
										<img class="sword" src="/image/icon/grey/garden.png">
										<span class="player-count">6</span>&nbsp;<img class="player" src="/image/player.png">
									</router-link>
								</template>
								{{ $t('you_must_have_a_team') }}
							</tooltip>

							<tooltip :disabled="battleRoyaleEnabled">
								<template v-slot:activator="{ on }">
									<router-link v-ripple :class="{ enabled: battleRoyaleEnabled }" :event="battleRoyaleEnabled ? 'click' : ''" to="/garden/battle-royale" class="tab" v-on="on">
										<h2>{{ $t('category_battle_royale') }}</h2>
										<span class="player-count">10</span>&nbsp;<img class="player" src="/image/player.png">
									</router-link>
								</template>
								{{ $t('you_must_be_level_50') }}
							</tooltip>

							<div v-if="queue > 0" class="queue">
								<div class="title">File d'attente</div>
								<div class="count">{{ $tc('n_fights', queue) }}</div>
							</div>
						</div>
					</div>
				</panel>
			</div>

			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column9">
				<panel class="garden-right first last">
					<loader v-if="!garden || !$store.state.farmer" />

					<div v-else-if="category === 'challenge'">
						<template v-if="challengeType == 'leek'">
							<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_leek') }}</div>
							<router-link v-for="leek in $store.state.farmer.leeks" :key="leek.id" :to="'/garden/challenge/leek/' + challengeTarget + '/' + leek.id" class="my-leek leek">
								<garden-leek :leek="leek" />
							</router-link>
							<div class="versus">VS</div>
							<div v-if="challengeFights" class="enemies">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<div class="leek" @click="startLeekChallenge">
									<garden-leek :leek="challengeLeekTarget" />
								</div>
							</div>
							<div v-else>
								<img src="/image/notgood.png">
								<h4>{{ $t('no_more_fights') }}</h4>
							</div>
						</template>
						<template v-else>
							<span v-ripple class="my-farmer farmer">
								<garden-farmer v-if="$store.state.farmer" :farmer="$store.state.farmer" />
							</span>
							<div class="versus">VS</div>
							<div v-if="challengeFights" class="enemies">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<loader v-if="!challengeFarmerTarget" />
								<div v-else class="opponents">
									<span v-ripple class="farmer" @click="startFarmerChallenge">
										<garden-farmer :farmer="challengeFarmerTarget" />
									</span>
								</div>
							</div>
							<div v-else>
								<img src="/image/notgood.png"><br>
								<h4>{{ $t('no_more_fights') }}</h4>
							</div>
						</template>
						<div class="title advanced" @click="advanced = !advanced">
							{{ $t('advanced') }}
							<v-icon v-if="advanced">mdi-chevron-up</v-icon>
							<v-icon v-else>mdi-chevron-down</v-icon>
						</div>
						<div v-if="advanced" class="advanced">
							<div>
								<span class="title"><v-icon>mdi-seed</v-icon> {{ $t('main.seed') }}</span>
								<span class="desc">{{ $t('main.seed_desc') }}</span>
							</div>
							<input v-model="seed" type="number" class="seed" min="1" max="2147483647" :placeholder="$t('main.seed_placeholder')" @input="updateSeed">
						</div>
					</div>
					<div v-else>
						<div v-if="category == 'solo'">
							<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_leek') }}</div>
							<router-link v-for="leek in $store.state.farmer.leeks" :key="leek.id" v-ripple :to="'/garden/solo/' + leek.id" class="my-leek leek">
								<garden-leek :leek="leek" />
							</router-link>
							<div class="versus">VS</div>
							<div v-if="selectedLeek && garden.fights">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<loader v-if="!leekOpponents[selectedLeek.id] && !leekErrors[selectedLeek.id]" />
								<div v-else-if="leekOpponents[selectedLeek.id]" class="opponents">
									<span v-for="leek in leekOpponents[selectedLeek.id]" :key="leek.id" v-ripple class="leek" @click="clickSoloOpponent(leek)">
										<garden-leek :leek="leek" />
									</span>
									<div v-if="!leekOpponents[selectedLeek.id].length">
										<img src="/image/notgood.png">
										<h4>{{ $t('no_opponent_of_your_size') }}</h4>
									</div>
								</div>
								<div v-else-if="leekErrors[selectedLeek.id]">
									<img src="/image/notgood.png">
									<h4>{{ $t(leekErrors[selectedLeek.id]) }}</h4>
								</div>
							</div>
							<div v-else>
								<img src="/image/notgood.png"><br>
								<h4>{{ $t('no_more_fights') }}</h4>
							</div>
						</div>
						<div v-if="category == 'farmer'">
							<span v-ripple class="my-farmer farmer">
								<garden-farmer v-if="$store.state.farmer" :farmer="$store.state.farmer" />
							</span>
							<div class="versus">VS</div>
							<div v-if="garden.fights" class="enemies">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<loader v-if="!farmerOpponents" />
								<div v-else class="opponents">
									<span v-for="farmer in farmerOpponents" :key="farmer.id" v-ripple class="farmer" @click="clickFarmerOpponent(farmer)">
										<garden-farmer :farmer="farmer" />
									</span>
									<div v-if="!farmerOpponents.length">
										<img src="/image/notgood.png">
										<h4>{{ $t('no_opponent_of_your_size') }}</h4>
									</div>
								</div>
							</div>
							<div v-else>
								<img src="/image/notgood.png"><br>
								<h4>{{ $t('no_more_fights') }}</h4>
							</div>
						</div>
						<div v-if="category == 'team'">
							<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_compo') }}</div>
							<router-link v-for="composition in garden.my_compositions" :key="composition.id" v-ripple :to="'/garden/team/' + composition.id" class="composition-wrapper my-composition">
								<garden-compo :compo="composition" />
								<span class="fights">
									<img class="sword" src="/image/icon/grey/garden.png">{{ composition.fights }}
								</span>
							</router-link>
							<div class="versus">VS</div>
							<div v-if="selectedComposition">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<div v-if="selectedComposition.fights === 0">
									<img src="/image/notgood.png"><br>
									<h4>{{ $t('no_more_fights') }}</h4>
								</div>
								<loader v-else-if="!teamOpponents[selectedComposition.id]" />
								<div v-else class="opponents">
									<garden-compo v-for="compo in teamOpponents[selectedComposition.id]" :key="compo.id" v-ripple :compo="compo" class="composition-wrapper" @click.native="clickCompositionOpponent(compo)" />
									<div v-if="!teamOpponents[selectedComposition.id].length">
										<img src="/image/notgood.png">
										<h4>{{ $t('no_opponent_of_your_size') }}</h4>
									</div>
								</div>
							</div>
						</div>
						<div v-if="category == 'battle-royale'">
							<div v-if="!LeekWars.battleRoyale.enabled">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_leek') }}</div>
								<tooltip v-for="leek in $store.state.farmer.leeks" :key="leek.id" :disabled="leek.level >= 50">
									<template v-slot:activator="{ on }">
										<router-link v-ripple :to="'/garden/battle-royale/' + leek.id" :class="{disabled: leek.level < 50}" :event="leek.level < 50 ? null : 'click'" class="leek my-leek" v-on="on">
											<garden-leek :leek="leek" />
										</router-link>
									</template>
									Level &lt; 50
								</tooltip>
								<br><br>
								<v-btn v-if="garden.fights" color="primary" @click="battleRoyaleRegister">Sélectionner</v-btn>
								<div v-else>
									<img src="/image/notgood.png"><br>
									<h4>{{ $t('no_more_fights') }}</h4>
								</div>
							</div>
							<div v-else>
								<loader v-if="LeekWars.battleRoyale.progress == 0" />
								<div class="leeks">
									<div v-for="leek in LeekWars.battleRoyale.leeks" :key="leek.id" class="leek">
										<garden-leek :leek="leek" />
									</div>
								</div>
								<br>
								<div class="leek-count">{{ LeekWars.battleRoyale.progress }} / 10</div>
								<br>
								<v-btn @click="battleRoyaleLeave"><v-icon>mdi-keyboard-backspace</v-icon>&nbsp;Quitter</v-btn>
							</div>
						</div>
					</div>
				</panel>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { store } from '@/model/store'
	import { Composition } from '@/model/team'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import GardenCompo from './garden-compo.vue'
	import GardenFarmer from './garden-farmer.vue'
	import GardenLeek from './garden-leek.vue'

	@Component({
		name: 'garden', i18n: {},
		components: {
			'garden-leek': GardenLeek,
			'garden-farmer': GardenFarmer,
			'garden-compo': GardenCompo
		}
	})
	export default class Garden extends Vue {
		garden: any = null
		category: string = 'solo'
		selectedLeek: Leek | null = null
		selectedComposition: any = null
		leekOpponents: {[key: number]: Leek[]} = {}
		leekErrors: {[key: number]: string} = {}
		farmerOpponents: Farmer[] | null = null
		teamOpponents: {[key: number]: Composition[]} = {}
		compositions_by_id: {[key: number]: Composition} = {}
		challengeFights: number = 0
		challengeType: string = ''
		challengeTarget: number = 0
		challengeLeekTarget: Leek | null = null
		challengeFarmerTarget: Farmer | null = null
		queue: number = 0
		advanced: boolean = false
		seed: number | null = null

		get farmerEnabled() { return this.garden && this.garden.farmer_enabled }
		get teamEnabled() { return this.garden && this.garden.team_enabled }
		get battleRoyaleEnabled() { return this.garden && this.garden.battle_royale_enabled }
		get remainingTime() {
			const midnignt = new Date(LeekWars.timeSeconds * 1000)
			midnignt.setUTCHours(23, 0, 0, 0)
			return LeekWars.formatTimeSeconds(Math.round(midnignt.getTime() / 1000 - LeekWars.timeSeconds))
		}

		mounted() {
			LeekWars.setTitle(this.$t('title'))

			this.advanced = localStorage.getItem("editor/test/advanced") === 'true'

			LeekWars.get('garden/get').then(r => {
				this.garden = r.garden
				for (const composition of this.garden.my_compositions) {
					this.compositions_by_id[composition.id] = composition
				}
				this.update()
			})
			this.$root.$on('back', this.back)
			LeekWars.socket.send([SocketMessage.GARDEN_QUEUE_REGISTER])
			this.$root.$on('garden-queue', (data: number) => this.queue = data)
		}
		back() {
			localStorage.removeItem('garden/category')
			this.$router.back()
		}
		beforeDestroy() {
			this.$root.$off('back', this.back)
			LeekWars.socket.send([SocketMessage.GARDEN_QUEUE_UNREGISTER])
		}

		@Watch('$route.params')
		@Watch('$store.state.farmer')
		update() {
			const params = this.$route.params
			this.category = params.category
			if (!this.category) {
				const savedCategory = localStorage.getItem('garden/category')
				if (savedCategory || !LeekWars.mobile) {
					let defaultCategory = savedCategory || 'solo'
					if (defaultCategory === 'challenge') { defaultCategory = 'solo' }
					this.$router.replace('/garden/' + defaultCategory)
					return
				}
			}
			if (this.category === 'solo' && !params.item) {
				let defaultLeek = parseInt(localStorage.getItem('garden/leek') || '0', 10)
				if (!(defaultLeek in store.state.farmer!.leeks)) {
					defaultLeek = LeekWars.first(store.state.farmer!.leeks)!.id
				}
				this.$router.replace('/garden/solo/' + defaultLeek)
				return
			}
			if (this.category === 'team' && !params.item) {
				if (!this.garden) {
					return
				}
				let defaultComposition = parseInt(localStorage.getItem('garden/compo') || '0', 10)
				if (!(defaultComposition in this.compositions_by_id)) {
					defaultComposition = this.garden.my_compositions.length === 0 ? 0 : this.garden.my_compositions[0].id
				}
				this.$router.replace('/garden/team/' + defaultComposition)
				return
			}
			const item = parseInt(params.item, 10)

			if (!this.garden || !store.state.farmer) {
				return
			}
			if (this.category) {
				const category_underscore = this.category.replace('-', '_')
				LeekWars.setTitle(this.$t('garden_' + category_underscore), this.$tc('n_fights', store.state.farmer.fights))
				LeekWars.splitShowContent()

				if (this.category === 'solo') {
					this.loadLeek(store.state.farmer.leeks[item])
				} else if (this.category === 'farmer') {
					this.selectFarmer()
				} else if (this.category === 'team') {
					this.selectComposition(this.compositions_by_id[item])
				} else if (this.category === 'battle-royale') {
					this.selectBattleRoyale()
				} else if (this.category === 'challenge') {
					this.selectChallenge()
				}
			} else {
				localStorage.removeItem("garden/category")
				LeekWars.setTitle(this.$t('title'))
				LeekWars.splitShowList()
			}
		}
		loadLeek(leek: Leek) {
			this.selectedLeek = leek
			if (this.garden.fights === 0 || this.leekOpponents[leek.id]) {
				return
			}
			LeekWars.get('garden/get-leek-opponents/' + leek.id).then(data => {
				Vue.set(this.$data.leekOpponents, leek.id, data.opponents)
			}).error(error => {
				Vue.set(this.$data.leekErrors, leek.id, error.error)
			})
		}
		selectFarmer() {
			if (this.garden.fights === 0 || this.farmerOpponents) {
				return
			}
			LeekWars.get('garden/get-farmer-opponents').then(data => {
				this.farmerOpponents = data.opponents
			}).error(error => {
				LeekWars.toast(error.error)
			})
		}
		selectComposition(composition: Composition) {
			this.selectedComposition = composition
			if (composition.fights === 0 || this.teamOpponents[composition.id]) {
				return
			}
			LeekWars.get('garden/get-composition-opponents/' + composition.id).then(data => {
				Vue.set(this.$data.teamOpponents, composition.id, data.opponents)
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		selectBattleRoyale() {
			if (!this.$route.params.item) {
				this.$router.replace('/garden/battle-royale/' + LeekWars.first(store.state.farmer!.leeks)!.id)
				return
			}
			this.selectedLeek = store.state.farmer!.leeks[parseInt(this.$route.params.item, 10)]
		}
		battleRoyaleRegister() {
			if (!this.selectedLeek) { return }
			LeekWars.battleRoyale.register(this.selectedLeek.id)
		}
		battleRoyaleLeave() {
			LeekWars.battleRoyale.leave()
		}
		clickSoloOpponent(leek: Leek) {
			if (this.selectedLeek) {
				LeekWars.post('garden/start-solo-fight', {leek_id: this.selectedLeek.id, target_id: leek.id}).then(data => {
					this.$router.push('/fight/' + data.fight)
					store.commit('update-fights', -1)
				}).error(error => LeekWars.toast(this.$t(error)))
			}
		}
		clickFarmerOpponent(farmer: Farmer) {
			LeekWars.post('garden/start-farmer-fight', {target_id: farmer.id}).then(data => {
				this.$router.push('/fight/' + data.fight)
				store.commit('update-fights', -1)
			}).error(error => LeekWars.toast(this.$t(error)))
		}
		clickCompositionOpponent(composition: Composition) {
			if (this.selectedComposition) {
				LeekWars.post('garden/start-team-fight', {composition_id: this.selectedComposition.id, target_id: composition.id}).then(data => {
					this.$router.push('/fight/' + data.fight)
				}).error(error => LeekWars.toast(this.$t(error)))
			}
		}
		selectChallenge() {
			this.challengeTarget = parseInt(this.$route.params.target, 10)
			this.challengeType = this.$route.params.type
			if (!this.$route.params.item) {
				this.$router.replace('/garden/challenge/' + this.challengeType + '/' + this.challengeTarget + '/' + LeekWars.first(store.state.farmer!.leeks)!.id)
				return
			}
			this.selectedLeek = store.state.farmer!.leeks[parseInt(this.$route.params.item, 10)]!
			if (this.challengeType === 'leek') {
				LeekWars.get('garden/get-solo-challenge/' + this.challengeTarget).then(data => {
					if (data.challenges) {
						this.challengeFights = data.challenges
						this.challengeLeekTarget = data.leek
					}
				})
			} else {
				LeekWars.get('garden/get-farmer-challenge/' + this.challengeTarget).then(data => {
					if (data.challenges) {
						this.challengeFights = data.challenges
						this.challengeFarmerTarget = data.farmer
					}
				})
			}
		}
		startFarmerChallenge() {
			if (!this.challengeFarmerTarget) { return }
			LeekWars.post('garden/start-farmer-challenge', {target_id: this.challengeFarmerTarget.id, seed: this.seed || 0}).then(data => {
				this.$router.push('/fight/' + data.fight)
			}).error(error => LeekWars.toast(this.$t(error)))
		}
		startLeekChallenge() {
			if (!this.challengeLeekTarget || !this.selectedLeek) { return }
			LeekWars.post('garden/start-solo-challenge', {leek_id: this.selectedLeek.id, target_id: this.challengeLeekTarget.id, seed: this.seed || 0}).then(data => {
				this.$router.push('/fight/' + data.fight)
			}).error(error => LeekWars.toast(this.$t(error)))
		}
		@Watch('category')
		updateCategory() {
			if (this.category && this.category !== 'challenge') {
				localStorage.setItem('garden/category', this.category)
			}
		}
		@Watch('selectedLeek')
		updateLeek() {
			if (this.selectedLeek) {
				localStorage.setItem('garden/leek', '' + this.selectedLeek.id)
			}
		}
		@Watch('selectedComposition')
		updateComposition() {
			if (this.selectedComposition) {
				localStorage.setItem('garden/compo', '' + this.selectedComposition.id)
			}
		}

		@Watch('advanced')
		updateAdvanced() {
			localStorage.setItem("editor/test/advanced", '' + this.advanced)
		}
		updateSeed(event: InputEvent) {
			if (event.data === '') {
				this.seed = null
			} else if (this.seed) {
				if (this.seed > 2147483647) {
					this.seed = 2147483647
				} else if (this.seed < 1) {
					this.seed = 1
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.column3 {
		align-self: start;
	}
	.garden-left {
		> div {
			padding: 5px;
		}
		.tab {
			cursor: pointer;
			text-align: center;
			margin: 10px;
			padding: 10px;
			display: block;
			border: 1px solid #ddd;
			border-radius: 2px;
		}
		.tab.router-link-active {
			background: white;
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		}
		.tab:not(.enabled) {
			opacity: 0.5;
		}
		.tab h2 {
			margin: 0;
			margin-bottom: 5px;
			font-size: 20px;
		}
	}
	.fights {
		font-size: 20px;
		color: #444;
		img {
			vertical-align: middle;
			margin-right: 3px;
			margin-bottom: 4px;
			width: 24px;
		}
	}
	.player-count {
		font-size: 20px;
		color: #999;
	}
	.sword {
		height: 20px;
		margin: 0 10px;
		vertical-align: middle;
		margin-bottom: 6px;
	}
	.player {
		height: 20px;
		vertical-align: middle;
		margin-bottom: 7px;
	}
	.garden-right {
		vertical-align: top;
		text-align: center;
	}
	.leek, .farmer, .composition-wrapper {
		display: inline-block;
		border-radius: 2px;
		width: calc(20% - 2px);
		min-width: 150px;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}
	.composition-wrapper {
		padding: 10px 0;
	}
	.leek, .composition, .composition-wrapper, .opponents .farmer {
		cursor: pointer;
	}
	.leek:hover, .my-farmer, .composition-wrapper:hover, .opponents .farmer:hover {
		background-color: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	a.my-leek:not(.router-link-active) {
		opacity: 0.5;
	}
	a.my-leek.router-link-active, a.my-composition.router-link-active {
		background-color: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	::v-deep .talent {
		font-size: 22px;
		color: #555;
		font-weight: 300;
		margin: 3px;
	}
	.versus {
		font-size: 25px;
		font-weight: bold;
		margin-top: 15px;
		margin-bottom: 5px;
		color: #666;
	}
	a.my-leek.disabled {
		opacity: 0.15;
		cursor: auto;
	}
	.leek-count {
		font-size: 22px;
	}
	.queue {
		padding: 15px 10px;
		.title {
			font-weight: bold;
			color: #777;
		}
		.count {
			font-size: 18px;
			text-align: center;
			padding: 6px 0;
			color: #555;
		}
	}
	.title {
		font-size: 16px;
		font-weight: bold;
		text-transform: uppercase;
		color: #555;
		padding-bottom: 8px;
		text-align: left;
		.v-icon {
			vertical-align: middle;
    		margin-bottom: 3px;
		}
		&.advanced {
			cursor: pointer;
			user-select: none;
		}
	}
	.advanced {
		text-align: left;
	}
	.desc {
		padding-left: 6px;
		color: #777;
	}
	input.seed {
		margin-top: 4px;
		padding: 0 6px;
		font-size: 18px;
		width: 100%;
		height: 34px;
	}
	.info {
		padding: 10px;
		color: #777;
		.v-icon {
			margin-bottom: 2px;
		}
	}
</style>
