<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div v-if="garden" class="tabs">
				<v-tooltip :open-delay="0" :close-delay="0" bottom>
					<div slot="activator" class="tab action hidden">
						<img src="/image/icon/garden.png">
						<span v-if="garden.fights > 0">{{ garden.fights }}</span>
						<span v-else>{{ remainingTime }}</span>
					</div>
					<span v-if="garden.fights > 0">{{ $t('n_remaining_fights', [garden.fights]) }}</span>
					<span v-else>{{ $t('next_fight_in', [remainingTime]) }}</span>
				</v-tooltip>
			</div>
		</div>
		<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column3">
			<div class="panel garden-left">
				<div class="content">
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
						<v-tooltip :open-delay="0" :close-delay="0" :disabled="farmerEnabled" bottom>
							<router-link v-ripple slot="activator" :class="{ enabled: farmerEnabled }" to="/garden/farmer" class="tab">
								<h2>{{ $t('category_farmer_fight') }}</h2>
								<span class="player-count">4</span>&nbsp;<img class="player" src="/image/player.png">
								<img class="sword" src="/image/icon/grey/garden.png">
								<span class="player-count">4</span>&nbsp;<img class="player" src="/image/player.png">
							</router-link>
							{{ $t('you_must_have_2_leeks') }}
						</v-tooltip>

						<v-tooltip :open-delay="0" :close-delay="0" :disabled="teamEnabled" bottom>
							<router-link v-ripple slot="activator" :class="{ enabled: teamEnabled }" to="/garden/team" class="tab">
								<h2>{{ $t('category_team_fight') }}</h2>
								<span class="player-count">6</span>&nbsp;<img class="player" src="/image/player.png">
								<img class="sword" src="/image/icon/grey/garden.png">
								<span class="player-count">6</span>&nbsp;<img class="player" src="/image/player.png">
							</router-link>
							{{ $t('you_must_have_a_team') }}
						</v-tooltip>

						<v-tooltip :open-delay="0" :close-delay="0" :disabled="battleRoyaleEnabled" bottom>
							<router-link v-ripple slot="activator" :class="{ enabled: battleRoyaleEnabled }" to="/garden/battle-royale" class="tab">
								<h2>{{ $t('category_battle_royale') }}</h2>
								<span class="player-count">10</span>&nbsp;<img class="player" src="/image/player.png">
							</router-link>
							{{ $t('you_must_be_level_50') }}
						</v-tooltip>
					</div>
				</div>
			</div>
		</div>
	
		<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column9">
			<div class="panel garden-right">
				<div class="content">
					<loader v-if="!garden" />
					<template v-else>
						<div v-if="category === 'challenge'">
							<template v-if="challengeType == 'leek'">
								<router-link v-for="leek in $store.state.farmer.leeks" :key="leek.id" :to="'/garden/challenge/leek/' + challengeTarget + '/' + leek.id" class="my-leek">
									<garden-leek :leek="leek" />
								</router-link>
								<div class="versus">VS</div>
								<div v-if="challengeFights" class="enemies">
									<garden-leek :leek="challengeLeekTarget" @click.native="startLeekChallenge" />
								</div>
								<div v-else>
									<img src="/image/notgood.png">
									<h4>{{ $t('no_more_fights') }}</h4>
								</div>
							</template>
							<template v-else>
								<garden-farmer :farmer="$store.state.farmer" />
								<div class="versus">VS</div>
								<div v-if="challengeFights" class="enemies">
									<loader v-if="!challengeFarmerTarget" />
									<div v-else class="opponents">
										<garden-farmer :farmer="challengeFarmerTarget" @click.native="startFarmerChallenge" />
									</div>
								</div>
								<div v-else>
									<img src="/image/notgood.png"><br>
									<h4>{{ $t('no_more_fights') }}</h4>
								</div>
							</template>
						</div>
						<div v-else>
							<div v-if="category == 'solo'">
								<router-link v-for="leek in $store.state.farmer.leeks" :key="leek.id" :to="'/garden/solo/' + leek.id" class="my-leek">
									<garden-leek :leek="leek" />
								</router-link>
								<div class="versus">VS</div>
								<div v-if="selectedLeek && garden.fights">
									<loader v-if="!leekOpponents[selectedLeek.id] && !leekErrors[selectedLeek.id]" />
									<div v-else-if="leekOpponents[selectedLeek.id]" class="opponents">
										<garden-leek v-for="leek in leekOpponents[selectedLeek.id]" :key="leek.id" :leek="leek" @click.native="clickSoloOpponent(leek)" />
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
								<garden-farmer :farmer="$store.state.farmer" class="my-farmer" />
								<div class="versus">VS</div>
								<div v-if="garden.fights" class="enemies">
									<loader v-if="!farmerOpponents" />
									<div v-else class="opponents">
										<garden-farmer v-for="farmer in farmerOpponents" :key="farmer.id" :farmer="farmer" @click.native="clickFarmerOpponent(farmer)" />
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
								<router-link v-for="composition in garden.my_compositions" :key="composition.id" :to="'/garden/team/' + composition.id" class="composition-wrapper my-composition">
									<garden-compo :compo="composition" />
									<span class="fights">
										<img src="/image/fight.png">{{ composition.fights }}
									</span>
								</router-link>
								<div class="versus">VS</div>
								<div v-if="selectedComposition">
									<loader v-if="!teamOpponents[selectedComposition.id]" />
									<div v-else-if="selectedComposition.fights" class="opponents">
										<garden-compo v-for="compo in teamOpponents[selectedComposition.id]" :key="compo.id" :compo="compo" class="composition-wrapper" @click.native="clickCompositionOpponent(compo)" />
										<div v-if="!teamOpponents[selectedComposition.id].length">
											<img src="/image/notgood.png">
											<h4>{{ $t('no_opponent_of_your_size') }}</h4>
										</div>
									</div>
									<div v-else>
										<img src="/image/notgood.png"><br>
										<h4>{{ $t('no_more_fights') }}</h4>
									</div>
								</div>
							</div>
							<div v-if="category == 'battle-royale'">
								<div v-if="!LeekWars.battleRoyale.enabled">
									<v-tooltip v-for="leek in $store.state.farmer.leeks" :key="leek.id" :open-delay="0" :close-delay="0" :disabled="leek.level >= 50" bottom>
										<router-link slot="activator" :to="'/garden/battle-royale/' + leek.id" :class="{disabled: leek.level < 50}" :event="leek.level < 50 ? null : 'click'" class="my-leek">
											<garden-leek :leek="leek" />
										</router-link>
										Level &lt; 50
									</v-tooltip>
									<br><br>
									<div class="button green" @click="battleRoyaleRegister">Sélectionner</div>
								</div>
								<div v-else>
									<loader v-if="LeekWars.battleRoyale.progress == 0" />
									<div class="leeks">
										<garden-leek v-for="leek in LeekWars.battleRoyale.leeks" :key="leek.id" :leek="leek" />
									</div>
									<br>
									<div class="leek-count">{{ LeekWars.battleRoyale.progress }} / 10</div>
									<br>
									<div class="button" @click="battleRoyaleLeave"><i class="material-icons">keyboard_backspace</i> Quitter</div>
								</div>
							</div>
						</div>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
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

		get farmerEnabled() { return this.garden && this.garden.farmer_enabled }
		get teamEnabled() { return this.garden && this.garden.team_enabled }
		get battleRoyaleEnabled() { return this.garden && this.garden.battle_royale_enabled }
		get remainingTime() {
			const midnignt = new Date(LeekWars.timeSeconds * 1000)
			midnignt.setUTCHours(23, 0, 0, 0)
			return LeekWars.formatTimeSeconds(Math.round(midnignt.getTime() / 1000 - LeekWars.timeSeconds))
		}

		mounted() {
			LeekWars.setTitle(this.$t('garden.title'))

			LeekWars.get('garden/get/' + this.$store.state.token).then((r: any) => {
				this.garden = r.data.garden
				for (const composition of this.garden.my_compositions) {
					this.compositions_by_id[composition.id] = composition
				}
				this.update()
			})
			this.$root.$on('back', () => {
				this.$router.push('/garden')
			})
		}

		@Watch('$route.params')
		update() {
			const params = this.$route.params
			this.category = params.category
			if (!LeekWars.mobile && !this.category) {
				const defaultCategory = localStorage.getItem('garden/category') || 'solo'
				this.$router.replace('/garden/' + defaultCategory)
				return
			}
			if (!LeekWars.mobile && this.category === 'solo' && !params.item) {
				const defaultLeek = localStorage.getItem('garden/leek') || LeekWars.first(this.$store.state.farmer.leeks).id
				this.$router.replace('/garden/solo/' + defaultLeek)
				return
			}
			if (this.category === 'team' && !params.item) {
				if (!this.garden) {
					return
				}
				const defaultComposition = localStorage.getItem('garden/compo') || (this.garden.my_compositions.length === 0 ? 0 : this.garden.my_compositions[0].id)
				this.$router.replace('/garden/team/' + defaultComposition)
				return
			}
			const item = parseInt(params.item, 10)
			localStorage.setItem("garden/category", this.category)

			if (!this.garden) {
				return
			}
			if (this.category) {
				const category_underscore = this.category.replace('-', '_')
				LeekWars.setTitle(this.$t('garden.garden_' + category_underscore), this.$t('garden.n_fights', [this.$store.state.farmer.fights]))
				LeekWars.splitShowContent()

				if (this.category === 'solo') {
					this.loadLeek(this.$store.state.farmer.leeks[item])
				}
				if (this.category === 'farmer') {
					this.selectFarmer()
				}
				if (this.category === 'team') {
					this.selectComposition(this.compositions_by_id[item])
				}
				if (this.category === 'battle-royale') {
					this.selectBattleRoyale()
				}
				if (this.category === 'challenge') {
					this.selectChallenge()
				}
			} else {
				localStorage.removeItem("garden/category")
				LeekWars.setTitle(this.$t('garden.title'))
				LeekWars.splitShowList()
			}
		}
		loadLeek(leek: Leek) {
			this.selectedLeek = leek
			if (this.garden.fights === 0 || this.$data.leekOpponents[leek.id]) {
				return
			}
			LeekWars.get('garden/get-leek-opponents/' + leek.id + '/' + this.$store.state.token).then((data: any) => {
				if (data.data.success) {
					Vue.set(this.$data.leekOpponents, leek.id, data.data.opponents)
				} else {
					Vue.set(this.$data.leekErrors, leek.id, data.data.error)
				}
			})
		}
		selectFarmer() {
			if (this.garden.fights === 0 || this.farmerOpponents) {
				return
			}
			LeekWars.get('garden/get-farmer-opponents/' + this.$store.state.token).then((data: any) => {
				if (data.data.success) {
					this.farmerOpponents = data.data.opponents
				} else {
					LeekWars.toast(data.data.error)
				}
			})
		}
		selectComposition(composition: Composition) {
			this.selectedComposition = composition
			if (composition.fights === 0 || this.teamOpponents[composition.id]) {
				return
			}
			LeekWars.get('garden/get-composition-opponents/' + composition.id + '/' + this.$store.state.token).then((data: any) => {
				if (data.data.success) {
					Vue.set(this.$data.teamOpponents, composition.id, data.data.opponents)
				} else {
					LeekWars.toast(data.data.error)
				}
			})
		}
		selectBattleRoyale() {
			if (!this.$route.params.item) {
				this.$router.replace('/garden/battle-royale/' + LeekWars.first(this.$store.state.farmer.leeks).id)
				return
			}
			this.selectedLeek = this.$store.state.farmer.leeks[parseInt(this.$route.params.item, 10)]
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
				LeekWars.post('garden/start-solo-fight', {leek_id: this.selectedLeek.id, target_id: leek.id}).then((data) => {
					if (data.data.success) {
						this.$router.push('/fight/' + data.data.fight)
						this.$store.commit('update-fights', -1)
					}
				})
			}
		}
		clickFarmerOpponent(farmer: Farmer) {
			LeekWars.post('garden/start-farmer-fight', {target_id: farmer.id}).then((data) => {
				if (data.data.success) {
					this.$router.push('/fight/' + data.data.fight)
					this.$store.commit('update-fights', -1)
				}
			})
		}
		clickCompositionOpponent(composition: Composition) {
			if (this.selectedComposition) {
				LeekWars.post('garden/start-team-fight', {composition_id: this.selectedComposition.id, target_id: composition.id
				}).then((data) => {
					if (data.data.success) {
						this.$router.push('/fight/' + data.data.fight)
					}
				})
			}
		}
		selectChallenge() {
			this.challengeTarget = parseInt(this.$route.params.target, 10)
			this.challengeType = this.$route.params.type
			if (!this.$route.params.item) {
				this.$router.replace('/garden/challenge/' + this.challengeType + '/' + this.challengeTarget + '/' + LeekWars.first(this.$store.state.farmer.leeks).id)
				return
			}
			this.selectedLeek = this.$store.state.farmer.leeks[this.$route.params.item]
			if (this.challengeType === 'leek') {
				LeekWars.get<any>('garden/get-solo-challenge/' + this.challengeTarget + '/' + this.$store.state.token).then((data) => {
					if (data.data.challenges) {
						this.challengeFights = data.data.challenges
						this.challengeLeekTarget = data.data.leek
					}
				})
			} else {
				LeekWars.get<any>('garden/get-farmer-challenge/' + this.challengeTarget + '/' + this.$store.state.token).then((data) => {
					if (data.data.challenges) {
						this.challengeFights = data.data.challenges
						this.challengeFarmerTarget = data.data.farmer
					}
				})
			}
		}
		startFarmerChallenge() {
			if (!this.challengeFarmerTarget) { return }
			LeekWars.post('garden/start-farmer-challenge', {target_id: this.challengeFarmerTarget.id}).then((data) => {
				if (data.data.success) {
					this.$router.push('/fight/' + data.data.fight)
				}
			})
		}
		startLeekChallenge() {
			if (!this.challengeLeekTarget || !this.selectedLeek) { return }
			LeekWars.post('garden/start-solo-challenge', {leek_id: this.selectedLeek.id, target_id: this.challengeLeekTarget.id}).then((data) => {
				if (data.data.success) {
					this.$router.push('/fight/' + data.data.fight)
				}
			})
		}
		@Watch('category')
		updateCategory() {
			if (this.category !== 'challenge') {
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
	}
</script>

<style lang="scss" scoped>
	.garden-left {
		.content {
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
		padding: 10px 0;
		border: 1px solid rgba(0, 0, 0, 0.1);
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
	a.my-leek.router-link-active .leek, a.my-composition.router-link-active {
		background-color: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	>>> .talent {
		font-size: 22px;
		color: #555;
		display: inline-block;
		font-weight: 300;
		margin: 3px;
	}
	.versus {
		font-size: 25px;
		font-weight: bold;
		margin: 10px;
		color: #666;
	}
	.enemies .opponents {
		min-height: 250px;
	}
	a.my-leek.disabled {
		opacity: 0.15;
		cursor: auto;
	}
	.leek-count {
		font-size: 22px;
	}
</style>
