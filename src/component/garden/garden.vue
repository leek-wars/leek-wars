<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div v-if="garden" class="tabs">
				<div class="tab action hidden disabled">
					<img src="/image/icon/garden.png">
					<span>{{ garden.fights }}</span>
					<span v-if="$store.state.farmer?.team_fights">+ {{ $store.state.farmer.team_fights }}</span>
				</div>
			</div>
		</div>
		<div class="container last">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column3">
				<panel class="garden-left first last">
					<template #content>
						<template v-if="category === 'challenge'">
							<div class="tab active enabled router-link-active">
								<h2>{{ $t('challenge') }}</h2>
								<span class="fights"><img src="/image/icon/grey/garden.png"> {{ challengeFights }}</span>
							</div>
						</template>
						<div v-else>
							<router-link v-ripple to="/garden/solo" class="tab enabled" :class="{'router-link-active': category === 'solo'}">
								<h2>{{ $t('category_solo_fight') }}</h2>
								<img class="player" src="/image/player.png">
								<img class="sword" src="/image/icon/grey/garden.png">
								<img class="player" src="/image/player.png">
							</router-link>

							<v-tooltip v-if="$store.state.farmer?.br_enabled" :disabled="battleRoyaleEnabled">
								<template #activator="{ props }">
									<router-link v-ripple :class="{ enabled: battleRoyaleEnabled, 'router-link-active': category === 'battle-royale' }" :event="battleRoyaleEnabled ? 'click' : ''" to="/garden/battle-royale" class="tab">
										<div v-bind="props">
											<h2>{{ $t('category_battle_royale') }}</h2>
											<span class="player-count">10</span>&nbsp;<img class="player" src="/image/player.png">
										</div>
									</router-link>
								</template>
								{{ $t('you_must_be_level_20') }}
							</v-tooltip>

							<v-tooltip :disabled="farmerEnabled">
								<template #activator="{ props }">
									<router-link v-ripple :class="{ enabled: farmerEnabled }" :event="farmerEnabled ? 'click' : ''" to="/garden/farmer" class="tab">
										<div v-bind="props">
											<h2>{{ $t('category_farmer_fight') }}</h2>
											<span class="player-count">4</span>&nbsp;<img class="player" src="/image/player.png">
											<img class="sword" src="/image/icon/grey/garden.png">
											<span class="player-count">4</span>&nbsp;<img class="player" src="/image/player.png">
										</div>
									</router-link>
								</template>
								{{ $t('you_must_have_2_leeks') }}
							</v-tooltip>

							<v-tooltip :disabled="teamEnabled">
								<template #activator="{ props }">
									<router-link v-ripple :class="{ enabled: teamEnabled, 'router-link-active': category === 'team' }" :event="teamEnabled ? 'click' : ''" to="/garden/team" class="tab">
										<div v-bind="props">
											<h2>{{ $t('category_team_fight') }}</h2>
											<span class="player-count">6</span>&nbsp;<img class="player" src="/image/player.png">
											<img class="sword" src="/image/icon/grey/garden.png">
											<span class="player-count">6</span>&nbsp;<img class="player" src="/image/player.png">
										</div>
									</router-link>
								</template>
								{{ $t('you_must_have_a_team') }}
							</v-tooltip>

							<v-tooltip :disabled="bossEnabled">
								<template #activator="{ props }">
									<router-link v-ripple :class="{ enabled: bossEnabled, 'router-link-active': category === 'boss' }" :event="bossEnabled ? 'click' : ''" to="/garden/boss" class="tab">
										<div v-bind="props">
											<h2>{{ $t('category_boss_fight') }}</h2>
											<span class="player-count">8</span>&nbsp;<img class="player" src="/image/player.png">
											<img class="sword" src="/image/icon/grey/garden.png">
											<span class="player-count">8</span>&nbsp;<img class="player" src="/image/player.png">
										</div>
									</router-link>
								</template>
								{{ $t('boss_extension_locked') }}
							</v-tooltip>

							<div v-if="queue > 0" class="queue">
								<div class="title">{{ $t('queue') }}</div>
								<div class="count">{{ $tc('n_fights', queue) }}</div>
							</div>
						</div>
					</template>
				</panel>
			</div>

			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column9">
				<panel class="garden-right first last">
					<loader v-if="!garden || !$store.state.farmer" />

					<div v-else-if="category === 'challenge'">
						<div v-if="challengeType === 'leek'">
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
							<garden-no-fights v-else :canbuy="false" />
						</div>
						<div v-else-if="challengeType === 'farmer'">
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
							<garden-no-fights v-else :canbuy="false" />
						</div>
						<div v-else>
							<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_compo') }}</div>
							<router-link v-for="composition in garden.my_compositions" :key="composition.id" v-ripple :to="'/garden/challenge/team/' + challengeTarget + '/' + composition.id" class="composition-wrapper my-composition">
								<garden-compo :compo="composition" />
								<div class="fights">
									<img class="sword" src="/image/icon/grey/garden.png">{{ composition.fights }}
								</div>
							</router-link>
							<div class="versus">VS</div>
							<div v-if="challengeFights" class="enemies">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<loader v-if="!challengeTeamTargets" />
								<div v-else class="opponents">
									<span v-for="compo in challengeTeamTargets" :key="compo.id" v-ripple class="composition-wrapper" @click="startTeamChallenge(compo)">
										<garden-compo :compo="compo" />
									</span>
									<div v-if="!challengeTeamTargets.length">
										<img src="/image/notgood.png">
										<h4>{{ $t('no_opponent_of_your_size') }}</h4>
									</div>
								</div>
							</div>
							<garden-no-fights v-else :canbuy="false" />
							<br>
						</div>
						<div class="title advanced" @click="advanced = !advanced">
							{{ $t('main.advanced') }}
							<v-icon v-if="advanced">mdi-chevron-up</v-icon>
							<v-icon v-else>mdi-chevron-down</v-icon>
						</div>
						<div v-if="advanced" class="advanced">
							<div>
								<span class="title"><v-icon>mdi-seed</v-icon> {{ $t('main.seed') }}</span>
								<span class="desc">{{ $t('main.seed_desc') }}</span>
							</div>
							<input v-model="seed" type="text" class="seed" :placeholder="$t('main.seed_placeholder')" @update:model-value="updateSeed">
							<br><br>
							<div>
								<span class="title"><v-icon>mdi-arrow-left-right</v-icon> {{ $t('main.side') }}</span>
								<span class="desc">{{ $t('main.side_desc') }}</span>
							</div>
							<v-radio-group v-model="side">
								<v-radio value="left" :label="$t('main.side_left')"></v-radio>
								<v-radio value="right" :label="$t('main.side_right')"></v-radio>
							</v-radio-group>
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
								<div v-else-if="leekOpponents[selectedLeek.id]" class="opponents dida-element">
									<span v-for="leek in leekOpponents[selectedLeek.id]" :key="leek.id" v-ripple class="leek" @click="clickSoloOpponent(leek)">
										<garden-leek :leek="leek" />
									</span>
									<div v-if="!leekOpponents[selectedLeek.id].length">
										<img src="/image/notgood.png">
										<h4>{{ $t('no_opponent_of_your_size') }}</h4>
									</div>
									<span v-if="LeekWars.didactitial_step === 2" class="dida-hint shaking">
										<span class="bubble" v-html="$t('main.dida_4')"></span>
										<span class="arrow"></span>
									</span>
								</div>
								<div v-else-if="leekErrors[selectedLeek.id]">
									<img src="/image/notgood.png">
									<h4>{{ $t(leekErrors[selectedLeek.id]) }}</h4>
								</div>
							</div>
							<garden-no-fights v-else :canbuy="true" />
						</div>
						<div v-else-if="category == 'farmer'">
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
							<garden-no-fights v-else :canbuy="true" />
						</div>
						<div v-else-if="category == 'team'">
							<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_compo') }}</div>
							<router-link v-for="composition in garden.my_compositions" :key="composition.id" v-ripple :to="'/garden/team/' + composition.id" class="composition-wrapper my-composition">
								<garden-compo :compo="composition" />
								<div class="fights">
									<img class="sword" src="/image/icon/grey/garden.png">{{ composition.fights }}
								</div>
							</router-link>
							<div class="versus">VS</div>
							<div v-if="selectedComposition">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<garden-no-fights v-if="selectedComposition.fights === 0" :canbuy="false" />
								<loader v-else-if="!teamOpponents[selectedComposition.id]" />
								<div v-else class="opponents">
									<span v-for="compo in teamOpponents[selectedComposition.id]" :key="compo.id" v-ripple class="composition-wrapper" @click="clickCompositionOpponent(compo)">
										<garden-compo :compo="compo" />
									</span>
									<div v-if="!teamOpponents[selectedComposition.id].length">
										<img src="/image/notgood.png">
										<h4>{{ $t('no_opponent_of_your_size') }}</h4>
									</div>
								</div>
							</div>
						</div>
						<div v-else-if="category == 'battle-royale'">
							<div v-if="!LeekWars.battleRoyale.enabled">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_leek') }}</div>
								<v-tooltip v-for="leek in $store.state.farmer.leeks" :key="leek.id" :disabled="leek.level >= 20">
									<template #activator="{ props }">
										<span v-bind="props">
											<router-link v-ripple :to="'/garden/battle-royale/' + leek.id" :class="{disabled: leek.level < 20}" :event="leek.level < 20 ? null : 'click'" class="leek my-leek">
												<garden-leek :leek="leek" />
											</router-link>
										</span>
									</template>
									Level &lt; 20
								</v-tooltip>
								<br><br>
								<v-btn v-if="garden.fights" color="primary" @click="battleRoyaleRegister">{{ $t('main.select') }}</v-btn>
								<garden-no-fights v-else :canbuy="true" />
							</div>
							<div v-else>
								<loader v-if="LeekWars.battleRoyale.progress == 0" />
								<div class="leeks">
									<div v-for="leek in LeekWars.battleRoyale.leeks" :key="leek.id" class="leek disabled">
										<garden-leek :leek="leek" />
									</div>
								</div>
								<br>
								<div class="leek-count">{{ LeekWars.battleRoyale.progress }} / 10</div>
								<br>
								<v-btn @click="battleRoyaleLeave"><v-icon>mdi-keyboard-backspace</v-icon>&nbsp;{{ $t('quit') }}</v-btn>
							</div>
						</div>
						<div v-else-if="category == 'boss'">
							<div v-if="squad === null || selectedBoss === null">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_boss') }}</div>
								<div class="bosses">
									<div v-for="boss in BOSSES" :key="boss.name" class="boss-wrapper">
										<div v-ripple @click="LeekWars.bossSquads.create(boss)" :class="{disabled: !garden.fights}" class="leek boss">
											<leek-image :leek="boss" :scale="boss.scale" />
											<div class="name">{{ $t('entity.' + boss.name) }}</div>
											<div class="level">{{ $t('main.level_n', [boss.level]) }}</div>
											<div class="stars">
												<v-icon v-for="d of 3" :key="d">{{ d > boss.difficulty ? 'mdi-star-outline' : 'mdi-star' }}</v-icon>
											</div>
										</div>
										<div v-for="(squad, s) of LeekWars.bossSquads.squads[boss.id]" :key="s" class="squad" :class="{disabled: !squad.id}" @click="squad.id ? LeekWars.bossSquads.join(squad.id) : null">
											<div class="farmers">
												<avatar v-for="farmer of squad.farmers" :key="farmer.id" :farmer="farmer" />
											</div>
											<div class="count"><v-icon v-if="squad.locked">mdi-lock</v-icon> {{ squad.engaged_count }} / 8</div>
										</div>
									</div>
								</div>
								<garden-no-fights v-if="!garden.fights" :canbuy="true" />
							</div>
							<div v-else>
								<div :class="{disabled: selectedBoss.level < 20}" class="leek boss disabled">
									<leek-image :leek="selectedBoss" :scale="selectedBoss.scale" />
									<div class="name">{{ $t('entity.' + selectedBoss.name) }}</div>
									<div class="level">{{ $t('main.level_n', [selectedBoss.level]) }}</div>
									<div class="stars">
										<v-icon v-for="d of 3" :key="d">{{ d > selectedBoss.difficulty ? 'mdi-star-outline' : 'mdi-star' }}</v-icon>
									</div>
								</div>
								<div class="versus">VS</div>
								<loader v-if="!LeekWars.bossSquads.squad" />
								<div v-else>
									<h4>Participants</h4>
									<div class="participants">
										<rich-tooltip-leek v-for="(leek,p) of LeekWars.bossSquads.squad.engaged_leeks" :key="p" :id="leek.id" v-slot="{ props }">
											<div v-bind="props" class="participant" :class="{active: true}" @click="LeekWars.bossSquads.removeLeek(leek)">
												<leek-image :leek="leek" :scale="0.42"></leek-image>
												<div class="name">
													<avatar :farmer="LeekWars.bossSquads.squad.farmers.find(f => f.id === leek.farmer)" />
													<span>{{ leek.name }}</span>
												</div>
												<div class="level">{{ $t('main.level_n', [leek.level]) }}</div>
											</div>
										</rich-tooltip-leek>
										<div v-for="(leek, p) of 8 - LeekWars.bossSquads.squad.engaged_leeks.length" :key="'e_' + p" class="participant"></div>
									</div>
									<h4 v-if="LeekWars.bossSquads.squad.available_leeks.length">Poireaux disponibles</h4>
									<div class="participants">
										<rich-tooltip-leek v-for="leek of LeekWars.bossSquads.squad.available_leeks" :key="leek.id" :id="leek.id" v-slot="{ props }">
											<div v-bind="props" class="participant" :class="{active: true}" @click="LeekWars.bossSquads.addLeek(leek)">
												<leek-image :leek="leek" :scale="0.42"></leek-image>
												<div class="name">
													<avatar :farmer="LeekWars.bossSquads.squad.farmers.find(f => f.id === leek.farmer)" />
													<span>{{ leek.name }}</span>
												</div>
												<div class="level">{{ $t('main.level_n', [leek.level]) }}</div>
											</div>
										</rich-tooltip-leek>
									</div>
									<div class="flex buttons">
										<v-btn @click="LeekWars.bossSquads.leaveSquad()"><v-icon>mdi-keyboard-backspace</v-icon>&nbsp;{{ $t('quit') }}</v-btn>
										<div class="farmers">
											<v-icon v-if="LeekWars.bossSquads.squad.locked" :disabled="LeekWars.bossSquads.squad.master !== $store.state.farmer.id" @click="LeekWars.bossSquads.open()">mdi-lock</v-icon>
											<v-icon v-else :disabled="LeekWars.bossSquads.squad.master !== $store.state.farmer.id" @click="LeekWars.bossSquads.lock()">mdi-earth</v-icon>
											<rich-tooltip-farmer v-for="farmer of LeekWars.bossSquads.squad.farmers" :key="farmer.id" :id="farmer.id">
												<avatar :farmer="farmer" :class="{master: LeekWars.bossSquads.squad.master === farmer.id}" />
											</rich-tooltip-farmer>
										</div>
										<v-btn color="primary" :disabled="LeekWars.bossSquads.squad.engaged_leeks.length === 0 || LeekWars.bossSquads.squad.master !== $store.state.farmer.id" @click="LeekWars.bossSquads.attack()"><v-icon>mdi-sword-cross</v-icon>&nbsp;{{ $t('attack') }}</v-btn>
									</div>
								</div>
							</div>
						</div>
					</div>
				</panel>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { Farmer } from '@/model/farmer'
	import { mixins } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { store } from '@/model/store'
	import { Composition } from '@/model/team'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import GardenCompo from './garden-compo.vue'
	import GardenFarmer from './garden-farmer.vue'
	import GardenLeek from './garden-leek.vue'
	import { BOSSES, Boss } from '@/model/boss'
	const GardenNoFights = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/garden/garden-no-fights.${locale}.i18n`))
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import { defineAsyncComponent } from 'vue'
import { emitter } from '@/model/vue'

	@Options({
		name: 'garden', i18n: {}, mixins: [...mixins],
		components: {
			RichTooltipLeek,
			RichTooltipFarmer,
			'garden-leek': GardenLeek,
			'garden-farmer': GardenFarmer,
			'garden-compo': GardenCompo,
			'garden-no-fights': GardenNoFights
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
		challengeTeamTargets: Composition[] = []
		queue: number = 0
		advanced: boolean = false
		seed: any | null = null
		side: string = 'left'
		request: any = null
		selectedBoss: any | null = null
		BOSSES = BOSSES
		squad: string | null = null

		get farmerEnabled() { return this.garden && this.garden.farmer_enabled }
		get teamEnabled() { return this.garden && this.garden.team_enabled }
		get battleRoyaleEnabled() { return this.garden && this.garden.battle_royale_enabled && this.$store.state.farmer && this.$store.state.farmer.verified }
		get bossEnabled() { return true }

		mounted() {
			LeekWars.setTitle(this.$t('title'))

			this.advanced = localStorage.getItem("editor/test/advanced") === 'true'

			this.request = LeekWars.get('garden/get')
			this.request.then((r: any) => {
				this.garden = r.garden
				for (const composition of this.garden.my_compositions) {
					this.compositions_by_id[composition.id] = composition
				}
				this.update()
			})
			
			emitter.on('back', this.back)
			LeekWars.socket.send([SocketMessage.GARDEN_QUEUE_REGISTER])
			emitter.on('garden-queue', (data: number) => this.queue = data)

			emitter.on('update-team-talent', (message: any) => {
				if (message.composition in this.compositions_by_id) {
					this.compositions_by_id[message.composition].talent += message.talent
				}
			})
		}
		created() {
			if (store.state.wsconnected) {
				this.updateWS()
			} else {
				emitter.on('wsconnected', this.updateWS)
			}
		}
		back() {
			if (this.category === 'challenge') {
				this.$router.back()
			} else {
				this.$router.push('/garden')
			}
			localStorage.removeItem('garden/category')
		}
		beforeUnmount() {
			emitter.off('back')
			if (this.request) { this.request.abort() }
			LeekWars.socket.send([SocketMessage.GARDEN_QUEUE_UNREGISTER])
			emitter.off('wsconnected', this.updateWS)
			LeekWars.socket.send([SocketMessage.GARDEN_BOSS_UNLISTEN])
		}

		@Watch('$route.params')
		@Watch('$store.state.farmer')
		update() {
			const params = this.$route.params
			// console.log("update", params)
			this.category = params.category
			if (!this.category) {
				const savedCategory = localStorage.getItem('garden/category')
				if (savedCategory || !LeekWars.mobile) {
					let defaultCategory = savedCategory || 'solo'
					if (defaultCategory === 'challenge') { defaultCategory = 'solo' }
					if (defaultCategory === 'battle-royale' && !this.$store.state.farmer.br_enabled) { defaultCategory = 'solo' }
					this.$router.replace('/garden/' + defaultCategory)
					return
				}
			}
			if ((this.category === 'solo' || this.category === 'battle-royale') && !params.item) {
				let defaultLeek = parseInt(localStorage.getItem('garden/leek') || '0', 10)
				if (!(defaultLeek in store.state.farmer!.leeks)) {
					defaultLeek = LeekWars.first(store.state.farmer!.leeks)!.id
				}
				this.$router.replace('/garden/' + this.category + '/' + defaultLeek)
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
				LeekWars.setTitle(this.$t('garden_' + category_underscore), this.$tc('n_fights', store.state.farmer.fights) + (store.state.farmer.team_fights ? ' + ' + this.$tc('n_fights', store.state.farmer.team_fights) : ''))
				LeekWars.splitShowContent()

				if (this.category === 'solo') {
					this.loadLeek(store.state.farmer.leeks[item])
				} else if (this.category === 'farmer') {
					this.selectFarmer()
				} else if (this.category === 'team') {
					this.selectComposition(this.compositions_by_id[item])
				} else if (this.category === 'battle-royale') {
					this.selectBattleRoyale(store.state.farmer.leeks[item])
				} else if (this.category === 'challenge') {
					this.selectChallenge()
				} else if (this.category === 'boss') {
					this.squad = this.$route.params.target
					if (this.squad) {
						this.selectedBoss = Object.values(BOSSES).find(b => b.name === this.$route.params.type)
						LeekWars.bossSquads.join(this.squad)
					} else {
						this.selectedBoss = null
						LeekWars.bossSquads.listen()
					}
				}
			} else {
				localStorage.removeItem("garden/category")
				LeekWars.setTitle(this.$t('title'))
				LeekWars.splitShowList()
			}
		}

		updateWS() {
			if (this.category === 'boss') {
				this.squad = this.$route.params.target
				if (this.squad) {
					LeekWars.bossSquads.join(this.squad)
				} else {
					LeekWars.bossSquads.listen()
				}
			}
		}

		loadLeek(leek: Leek) {
			this.selectedLeek = leek
			if (this.garden.fights === 0 || this.leekOpponents[leek.id]) {
				return
			}
			LeekWars.get('garden/get-leek-opponents/' + leek.id).then(data => {
				this.leekOpponents[leek.id] = data.opponents
			}).error(error => {
				this.leekErrors[leek.id] = error.error
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
				this.teamOpponents[composition.id] = data.opponents
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		selectBattleRoyale(leek: Leek) {
			this.selectedLeek = leek
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
				LeekWars.track('start-fight')
				if (LeekWars.didactitial_step === 2) {
					LeekWars.didactitial_next()
				}
				LeekWars.post('garden/start-solo-fight', {leek_id: this.selectedLeek.id, target_id: leek.id}).then(data => {
					this.$router.push('/fight/' + data.fight)
					store.commit('update-fights', -1)
				}).error(error => LeekWars.toast(this.$t(error)))
			}
		}
		clickFarmerOpponent(farmer: Farmer) {
			LeekWars.track('start-fight')
			LeekWars.post('garden/start-farmer-fight', {target_id: farmer.id}).then(data => {
				this.$router.push('/fight/' + data.fight)
				store.commit('update-fights', -1)
			}).error(error => LeekWars.toast(this.$t(error)))
		}
		clickCompositionOpponent(composition: Composition) {
			if (this.selectedComposition) {
				LeekWars.track('start-fight')
				LeekWars.post('garden/start-team-fight', {composition_id: this.selectedComposition.id, target_id: composition.id}).then(data => {
					this.$router.push('/fight/' + data.fight)
					store.commit('update-team-fights', -1)
				}).error(error => LeekWars.toast(this.$t(error)))
			}
		}
		selectChallenge() {
			this.challengeTarget = parseInt(this.$route.params.target, 10)
			this.challengeType = this.$route.params.type

			if (this.challengeType === 'leek') {
				if (!this.$route.params.item) {
					this.$router.replace('/garden/challenge/' + this.challengeType + '/' + this.challengeTarget + '/' + LeekWars.first(store.state.farmer!.leeks)!.id)
					return
				}
				this.selectedLeek = store.state.farmer!.leeks[parseInt(this.$route.params.item, 10)]!
				LeekWars.get('garden/get-solo-challenge/' + this.challengeTarget).then(data => {
					if (data.challenges) {
						this.challengeFights = data.challenges
						this.challengeLeekTarget = data.leek
					}
				})
			} else if (this.challengeType === 'farmer') {
				LeekWars.get('garden/get-farmer-challenge/' + this.challengeTarget).then(data => {
					if (data.challenges) {
						this.challengeFights = data.challenges
						this.challengeFarmerTarget = data.farmer
					}
				})
			} else if (this.challengeType === 'team') {
				if (!this.$route.params.item) {
					this.$router.replace('/garden/challenge/' + this.challengeType + '/' + this.challengeTarget + '/' + this.garden.my_compositions[0].id)
					return
				}
				for (const composition of this.garden.my_compositions) {
					if (composition.id == this.$route.params.item) {
						this.selectedComposition = composition
						break
					}
				}
				LeekWars.get('garden/get-team-challenge/' + this.challengeTarget).then(data => {
					if (data.challenges) {
						this.challengeFights = data.challenges
						this.challengeTeamTargets = data.compositions
					}
				})
			}
		}
		startFarmerChallenge() {
			if (!this.challengeFarmerTarget) { return }
			LeekWars.track('start-fight')
			LeekWars.post('garden/start-farmer-challenge', {target_id: this.challengeFarmerTarget.id, seed: this.seed || 0, side: this.side}).then(data => {
				this.$router.push('/fight/' + data.fight)
			}).error(error => LeekWars.toast(this.$t(error)))
		}

		startLeekChallenge() {
			if (!this.challengeLeekTarget || !this.selectedLeek) { return }
			LeekWars.track('start-fight')
			LeekWars.post('garden/start-solo-challenge', {leek_id: this.selectedLeek.id, target_id: this.challengeLeekTarget.id, seed: this.seed || 0, side: this.side}).then(data => {
				this.$router.push('/fight/' + data.fight)
			}).error(error => LeekWars.toast(this.$t(error)))
		}

		startTeamChallenge(composition: Composition) {
			LeekWars.track('start-fight')
			LeekWars.post('garden/start-team-challenge', { composition_id: this.selectedComposition.id, target_id: composition.id, seed: this.seed || 0, side: this.side}).then(data => {
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
				this.seed = parseInt(this.seed)
				if (this.seed > 2147483647) {
					this.seed = 2147483647
				} else if (this.seed < 1) {
					this.seed = 1
				} else if (isNaN(this.seed)) {
					this.seed = null
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
			border: 1px solid var(--border);
			border-radius: 2px;
			.player-count {
				font-size: 20px;
				color: var(--text-color-secondary);
				padding: 2px;
			}
		}
		.tab.router-link-active {
			background: var(--pure-white);
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		}
		.tab:not(.enabled) {
			opacity: 0.4;
			background: #ccc;
			cursor: default;
		}
		.tab h2 {
			margin: 0;
			margin-bottom: 5px;
			font-size: 20px;
		}
	}
	.fights {
		font-size: 20px;
		color: var(--text-color-secondary);
		margin-top: 8px;
		img {
			vertical-align: middle;
			margin-right: 3px;
			margin-bottom: 4px;
			width: 20px;
		}
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
		border: 1px solid var(--border);
	}
	.leek:not(.disabled), .composition, .composition-wrapper, .opponents .farmer, .squad:not(.disabled) {
		cursor: pointer;
	}
	.leek:hover:not(.disabled), .my-farmer, .composition-wrapper:hover, .opponents .farmer:hover, .participant.active:hover, .squad:not(.disabled):hover {
		background-color: var(--pure-white);
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.bosses {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
	}
	.boss-wrapper {
		flex: 1;
	}
	.squad {
		border: 1px solid var(--border);
		text-align: left;
		padding: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 500;
		.count {
			display: flex;
			gap: 6px;
			align-items: center;
		}
		.v-icon {
			font-size: 16px;
		}
	}
	.farmers {
		display: flex;
		align-items: center;
		gap: 5px;
		.v-icon {
			margin-right: 10px;
			width: 30px;
		}
	}
	.avatar {
		width: 30px;
		height: 30px;
		&.master {
			width: 36px;
			height: 36px;
			border: 3px solid var(--primary);
		}
	}
	.leek.boss {
		width: 100%;
		padding: 10px 0;
		.name {
			font-size: 18px;
			font-weight: 500;
			padding: 5px;
			padding-bottom: 3px;
			text-overflow: ellipsis;
			overflow: hidden;
			white-space: nowrap;
		}
		.level {
			padding-top: 3px;
			font-size: 16px;
			color: var(--text-color-secondary);
			font-weight: 500;
		}
		&.disabled {
			cursor: default;
		}
	}
	a.my-leek:not(.router-link-active) {
		opacity: 0.5;
	}
	a.my-leek.router-link-active, a.my-composition.router-link-active {
		background-color: var(--pure-white);
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	:deep(.talent) {
		font-size: 22px;
		font-weight: 300;
		margin: 3px;
	}
	.versus {
		font-size: 25px;
		font-weight: bold;
		margin-top: 15px;
		margin-bottom: 5px;
		color: var(--text-color-secondary);
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
			color: var(--text-color-secondary);
		}
		.count {
			font-size: 18px;
			text-align: center;
			padding: 6px 0;
			color: var(--text-color-secondary);
		}
	}
	.title {
		font-size: 16px;
		font-weight: bold;
		text-transform: uppercase;
		color: var(--text-color-secondary);
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
		color: var(--text-color-secondary);
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
		color: var(--text-color-secondary);
		.v-icon {
			margin-bottom: 2px;
		}
	}

.stars {
	margin: 5px 0;
	display: flex;
	justify-content: center;
	color: var(--text-color-secondary);
}
.participants {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
	gap: 10px;
	margin: 10px 0;
	user-select: none;
	.participant {
		border: 1px solid var(--border);
		height: 150px;
		min-width: 0;
		padding: 5px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 4px;
		svg {
			max-height: 105px;
		}
		.name {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 4px;
			span {
				font-weight: 500;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.avatar {
				width: 16px;
				height: 16px;
			}
		}
		.level {
			font-size: 13px;
		}
		&.active {
			cursor: pointer;
		}
	}
}
.buttons {
	justify-content: space-between;
	margin-top: 20px;
	align-items: center;
}
h4 {
	text-align: left;
}
</style>
