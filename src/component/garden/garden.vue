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
								<span class="fights"><img class="sword" src="/image/icon/grey/garden.png"> {{ challengeFights }}</span>
							</div>
						</template>
						<div v-else>
							<router-link v-ripple to="/garden/solo" class="tab enabled" :class="{'router-link-active': category === 'solo'}">
								<h2>{{ $t('category_solo_fight') }}</h2>
								<img class="player" src="/image/player.png">
								<img class="sword" src="/image/icon/grey/garden.png">
								<img class="player" src="/image/player.png">
							</router-link>

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
							<v-tooltip v-if="$store.state.farmer?.br_enabled" :disabled="arenaEnabled">
								<template #activator="{ props }">
									<router-link v-ripple :class="{ enabled: arenaEnabled, 'router-link-active': category === 'arena' }" :event="arenaEnabled ? 'click' : ''" to="/garden/arena" class="tab">
										<div v-bind="props">
											<h2>{{ $t('category_arena') }}</h2>
											<span class="player-count">10-20</span>&nbsp;<img class="player" src="/image/player.png">
										</div>
									</router-link>
								</template>
								{{ $t('you_must_be_level_20') }}
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
							<div class="opponents">
								<router-link v-for="leek in $store.state.farmer.leeks" :key="leek.id" :to="'/garden/challenge/leek/' + challengeTarget + '/' + leek.id" class="my-leek leek">
									<garden-leek :leek="leek" />
								</router-link>
							</div>
							<div class="versus">VS</div>
							<div v-if="challengeFights" class="enemies">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<div class="opponents">
									<div class="leek" @click="startLeekChallenge">
										<garden-leek :leek="challengeLeekTarget" />
									</div>
								</div>
							</div>
							<garden-no-fights v-else :canbuy="false" />
						</div>
						<div v-else-if="challengeType === 'farmer'">
							<div class="opponents">
								<span v-ripple class="my-farmer farmer">
									<garden-farmer v-if="$store.state.farmer" :farmer="$store.state.farmer" />
								</span>
							</div>
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
							<div class="opponents">
								<router-link v-for="composition in garden.my_compositions" :key="composition.id" v-ripple :to="'/garden/challenge/team/' + challengeTarget + '/' + composition.id" class="composition-wrapper my-composition">
									<garden-compo :compo="composition" />
									<div class="fights">
										<img class="sword" src="/image/icon/grey/garden.png">{{ composition.fights }}
									</div>
								</router-link>
							</div>
							<div class="versus">VS</div>
							<div v-if="challengeFights" class="enemies">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<loader v-if="!challengeTeamTargets" />
								<div v-else class="opponents">
									<span v-for="compo in challengeTeamTargets" :key="compo.id" v-ripple class="composition-wrapper" @click="startTeamChallenge(compo)">
										<garden-compo :compo="compo" />
									</span>
									<div v-if="!challengeTeamTargets.length" class="no-opponent">
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
							<div class="opponents">
								<router-link v-for="leek in $store.state.farmer.leeks" :key="leek.id" v-ripple :to="'/garden/solo/' + leek.id" class="my-leek leek">
									<garden-leek :leek="leek" />
								</router-link>
							</div>
							<div class="versus">VS</div>
							<div v-if="selectedLeek && garden.fights">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<loader v-if="!leekOpponents[selectedLeek.id] && !leekErrors[selectedLeek.id]" />
								<div v-else-if="leekOpponents[selectedLeek.id]" class="opponents dida-element">
									<span v-for="leek in leekOpponents[selectedLeek.id]" :key="leek.id" v-ripple class="leek" @click="clickSoloOpponent(leek)">
										<garden-leek :leek="leek" />
									</span>
									<div v-if="!leekOpponents[selectedLeek.id].length" class="no-opponent">
										<img src="/image/notgood.png">
										<h4>{{ $t('no_opponent_of_your_size') }}</h4>
									</div>
									<span v-if="LeekWars.didactitial_step === 2" class="dida-hint shaking">
										<span class="bubble" v-html="$t('main.dida_4')"></span>
										<span class="arrow"></span>
									</span>
								</div>
								<div v-else-if="leekErrors[selectedLeek.id]" class="no-opponent">
									<img src="/image/notgood.png">
									<h4>{{ $t(leekErrors[selectedLeek.id]) }}</h4>
								</div>
							</div>
							<garden-no-fights v-else-if="!garden.fights" :canbuy="true" @bought="reload" />
						</div>
						<div v-else-if="category == 'farmer'">
							<div class="opponents">
								<span v-ripple class="my-farmer farmer">
									<garden-farmer v-if="$store.state.farmer" :farmer="$store.state.farmer" />
								</span>
							</div>
							<div class="versus">VS</div>
							<div v-if="garden.fights" class="enemies">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
								<loader v-if="!farmerOpponents" />
								<div v-else class="opponents">
									<span v-for="farmer in farmerOpponents" :key="farmer.id" v-ripple class="farmer" @click="clickFarmerOpponent(farmer)">
										<garden-farmer :farmer="farmer" />
									</span>
								</div>
								<div v-if="farmerOpponents && !farmerOpponents.length" class="no-opponent">
									<img src="/image/notgood.png">
									<h4>{{ $t('no_opponent_of_your_size') }}</h4>
								</div>
							</div>
							<garden-no-fights v-else :canbuy="true" @bought="reload" />
						</div>
						<div v-else-if="category == 'team'">
							<div v-if="garden.my_compositions.length === 0" class="no-opponent">
								<img src="/image/notgood.png">
								<h4>{{ $t('no_composition') }}</h4>
							</div>
							<template v-else>
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_compo') }}</div>
								<div class="opponents">
									<router-link v-for="composition in garden.my_compositions" :key="composition.id" v-ripple :to="'/garden/team/' + composition.id" class="composition-wrapper my-composition">
										<garden-compo :compo="composition" />
										<div class="fights">
											<img class="sword" src="/image/icon/grey/garden.png">{{ composition.fights }}
										</div>
									</router-link>
								</div>
								<div class="versus">VS</div>
								<div v-if="selectedComposition">
									<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('click_opponent') }}</div>
									<garden-no-fights v-if="selectedComposition.fights === 0" :canbuy="false" />
									<loader v-else-if="!teamOpponents[selectedComposition.id]" />
									<div v-else class="opponents">
										<span v-for="compo in teamOpponents[selectedComposition.id]" :key="compo.id" v-ripple class="composition-wrapper" @click="clickCompositionOpponent(compo)">
											<garden-compo :compo="compo" />
										</span>
									</div>
									<div v-if="teamOpponents[selectedComposition.id] && !teamOpponents[selectedComposition.id].length" class="no-opponent">
										<img src="/image/notgood.png">
										<h4>{{ $t('no_opponent_of_your_size') }}</h4>
									</div>
								</div>
							</template>
						</div>
						<div v-else-if="category == 'arena'">
							<div v-if="!LeekWars.arena.enabled">
								<div class="info"><v-icon>mdi-arrow-down</v-icon> {{ $t('select_leek') }}</div>
								<div class="opponents">
									<router-link v-for="leek in $store.state.farmer.leeks" :key="leek.id" v-ripple :to="'/garden/arena/' + leek.id" :class="{disabled: leek.level < 20}" :event="leek.level < 20 ? null : 'click'" class="leek my-leek">
										<garden-leek :leek="leek" />
									</router-link>
								</div>
								<br>
								<div class="arena-preferences">
									<h4>{{ $t('arena_preference') }}</h4>
									<v-radio-group v-model="arenaPreference" inline hide-details>
										<v-radio :label="$t('arena_no_preference')" :value="-1" />
										<v-radio :label="$t('arena_mode_br')" :value="0" />
										<v-radio :label="$t('arena_mode_war')" :value="1" />
										<v-radio :label="$t('arena_mode_chest_hunt')" :value="2" />
										<v-radio :label="$t('arena_mode_colossus')" :value="3" />
									</v-radio-group>
								</div>
								<br>
								<v-btn v-if="garden.fights" color="primary" @click="arenaRegister" :disabled="!arenaEnabled">{{ $t('main.select') }}</v-btn>
								<garden-no-fights v-else :canbuy="true" @bought="reload" />
							</div>
							<div v-else>
								<loader v-if="LeekWars.arena.progress == 0" />
								<div class="opponents">
									<div v-for="leek in LeekWars.arena.leeks" :key="leek.id" class="leek disabled arena-leek">
										<garden-leek :leek="leek" />
										<v-tooltip>
											<template #activator="{ props }">
												<v-icon v-bind="props" class="arena-pref" size="16">{{ modeIcon(leek.preference) }}</v-icon>
											</template>
											{{ modeLabel(leek.preference) }}
										</v-tooltip>
									</div>
								</div>
								<br>
								<div class="leek-count">{{ LeekWars.arena.progress }} / {{ LeekWars.arena.constructor.MAX_PLAYERS }}</div>
								<div v-if="LeekWars.arena.countdown >= 0" class="arena-countdown">
									{{ $t('arena_countdown', [LeekWars.arena.countdown]) }}
								</div>
								<br>
								<v-btn @click="arenaLeave"><v-icon>mdi-keyboard-backspace</v-icon>&nbsp;{{ $t('quit') }}</v-btn>
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
								<garden-no-fights v-if="!garden.fights" :canbuy="true" @bought="reload" />
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
										<v-btn v-if="$store.getters.admin" color="primary" :loading="batchLoading" :disabled="LeekWars.bossSquads.squad.engaged_leeks.length === 0 || LeekWars.bossSquads.squad.master !== $store.state.farmer.id" @click="batchAttack()"><v-icon>mdi-sword-cross</v-icon>&nbsp;x10</v-btn>
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

<script setup lang="ts">
	import { locale } from '@/locale'
	import { Farmer } from '@/model/farmer'
	import { mixins, i18n } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { store } from '@/model/store'
	import { Composition } from '@/model/team'
	import GardenCompo from './garden-compo.vue'
	import GardenFarmer from './garden-farmer.vue'
	import GardenLeek from './garden-leek.vue'
	import { BOSSES } from '@/model/boss'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { emitter } from '@/model/vue'

	const GardenNoFights = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/garden/garden-no-fights.${locale}.i18n`))

	defineOptions({ name: 'garden', i18n: {}, mixins: [...mixins] })

	const { t } = useI18n()
	const tc = (key: string, count: number): string => (i18n.global as any).tc(key, count)
	const route = useRoute()
	const router = useRouter()

	const garden = ref<any>(null)
	const category = ref('solo')
	const selectedLeek = ref<Leek | null>(null)
	const selectedComposition = ref<any>(null)
	const leekOpponents = reactive<{[key: number]: Leek[]}>({})
	const leekErrors = reactive<{[key: number]: string}>({})
	const farmerOpponents = ref<Farmer[] | null>(null)
	const teamOpponents = reactive<{[key: number]: Composition[]}>({})
	const compositions_by_id = reactive<{[key: number]: Composition}>({})
	const challengeFights = ref(0)
	const challengeType = ref('')
	const challengeTarget = ref(0)
	const challengeLeekTarget = ref<Leek | null>(null)
	const challengeFarmerTarget = ref<Farmer | null>(null)
	const challengeTeamTargets = ref<Composition[]>([])
	const queue = ref(0)
	const advanced = ref(false)
	const seed = ref<any | null>(null)
	const side = ref('left')
	let request: any = null
	const selectedBoss = ref<any | null>(null)
	const squad = ref<string | null>(null)
	const arenaPreference = ref(parseInt(localStorage.getItem('arena/preference') || '-1', 10))
	const wantsColossus = ref(false)
	const batchLoading = ref(false)

	const farmerEnabled = computed(() => garden.value && garden.value.farmer_enabled)
	const teamEnabled = computed(() => garden.value && garden.value.team_enabled)
	const arenaEnabled = computed(() => garden.value && garden.value.battle_royale_enabled && store.state.farmer && store.state.farmer.verified)
	const bossEnabled = computed(() => true)

	const modeIcons = ['mdi-sword-cross', 'mdi-flag', 'mdi-treasure-chest', 'mdi-shield-account']
	const modeLabels = ['arena_mode_br', 'arena_mode_war', 'arena_mode_chest_hunt', 'arena_mode_colossus']

	function modeIcon(preference: number): string {
		return modeIcons[preference] || 'mdi-help-circle-outline'
	}
	function batchAttack() {
		const currentSquad = LeekWars.bossSquads.squad
		if (!currentSquad || !selectedBoss.value) return
		const participants = currentSquad.engaged_leeks
			.filter((l: Leek) => l.farmer === store.state.farmer!.id)
			.map((l: Leek) => l.id)
		if (participants.length === 0) return
		batchLoading.value = true
		LeekWars.post('garden/start-boss-fight-batch', {boss_id: selectedBoss.value.id, participants}).then(data => {
			store.commit('update-fights', -data.fights.length)
			LeekWars.bossSquads.leaveSquad()
			router.push('/fight/' + data.fights[0])
		}).error((error: string) => LeekWars.toast(t(error))).finally(() => {
			batchLoading.value = false
		})
	}
	function modeLabel(preference: number): string {
		return t(modeLabels[preference] || 'arena_no_preference') as string
	}

	if (store.state.wsconnected) {
		updateWS()
	} else {
		emitter.on('wsconnected', updateWS)
	}

	onMounted(() => {
		LeekWars.setTitle(t('title'))

		advanced.value = localStorage.getItem("editor/test/advanced") === 'true'

		request = LeekWars.get('garden/get')
		request.then((r: any) => {
			garden.value = r.garden
			for (const composition of garden.value.my_compositions) {
				compositions_by_id[composition.id] = composition
			}
			update()
		})

		emitter.on('back', back)
		LeekWars.socket.send([SocketMessage.GARDEN_QUEUE_REGISTER])
		emitter.on('garden-queue', (data: number) => queue.value = data)

		emitter.on('update-team-talent', (message: any) => {
			if (message.composition in compositions_by_id) {
				compositions_by_id[message.composition].talent += message.talent
			}
		})

		window.addEventListener('pageshow', onPageShow)
	})

	function back() {
		if (category.value === 'challenge') {
			router.back()
		} else {
			router.push('/garden')
		}
		localStorage.removeItem('garden/category')
	}

	function reload() {
		LeekWars.get('garden/get').then((r: any) => {
			garden.value = r.garden
			for (const composition of garden.value.my_compositions) {
				compositions_by_id[composition.id] = composition
			}
			update()
		})
	}

	function onPageShow(event: PageTransitionEvent) {
		if (event.persisted) {
			for (const k of Object.keys(leekOpponents)) delete leekOpponents[+k]
			farmerOpponents.value = null
			for (const k of Object.keys(teamOpponents)) delete teamOpponents[+k]
			reload()
		}
	}

	onBeforeUnmount(() => {
		emitter.off('back')
		if (request) { request.abort() }
		LeekWars.socket.send([SocketMessage.GARDEN_QUEUE_UNREGISTER])
		emitter.off('wsconnected', updateWS)
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_UNLISTEN])
		window.removeEventListener('pageshow', onPageShow)
	})

	watch([() => route.params, () => store.state.farmer], () => update())

	function update() {
		if (!store.state.farmer) { return }
		const params = route.params
		category.value = params.category as string
		if (!category.value) {
			const savedCategory = localStorage.getItem('garden/category')
			if (savedCategory || !LeekWars.mobile) {
				let defaultCategory = savedCategory || 'solo'
				if (defaultCategory === 'challenge') { defaultCategory = 'solo' }
				if ((defaultCategory === 'battle-royale' || defaultCategory === 'arena') && !store.state.farmer.br_enabled) { defaultCategory = 'solo' }
				router.replace('/garden/' + defaultCategory)
				return
			}
		}
		if ((category.value === 'solo' || category.value === 'arena') && (!params.item || !(parseInt(params.item as string, 10) in store.state.farmer!.leeks))) {
			const key = category.value === 'arena' ? 'arena-leek' : 'garden/leek'
			let defaultLeek = parseInt(localStorage.getItem(key) || '0', 10)
			if (!(defaultLeek in store.state.farmer!.leeks)) {
				defaultLeek = LeekWars.first(store.state.farmer!.leeks)!.id
			}
			router.replace('/garden/' + category.value + '/' + defaultLeek)
			return
		}
		if (category.value === 'team' && !params.item && garden.value) {
			if (garden.value.my_compositions.length > 0) {
				let defaultComposition = parseInt(localStorage.getItem('garden/compo') || '0', 10)
				if (!(defaultComposition in compositions_by_id)) {
					defaultComposition = garden.value.my_compositions[0].id
				}
				router.replace('/garden/team/' + defaultComposition)
				return
			}
		}
		const item = parseInt(params.item as string, 10)

		if (!garden.value || !store.state.farmer) {
			return
		}
		if (category.value) {
			const category_underscore = category.value.replace('-', '_')
			LeekWars.setTitle(t('garden_' + category_underscore), tc('n_fights', store.state.farmer.fights) + (store.state.farmer.team_fights ? ' + ' + tc('n_fights', store.state.farmer.team_fights) : ''))
			LeekWars.splitShowContent()

			if (category.value === 'solo') {
				loadLeek(store.state.farmer.leeks[item])
			} else if (category.value === 'farmer') {
				selectFarmer()
			} else if (category.value === 'team') {
				selectComposition(compositions_by_id[item])
			} else if (category.value === 'arena') {
				selectArena(store.state.farmer.leeks[item])
			} else if (category.value === 'challenge') {
				selectChallenge()
			} else if (category.value === 'boss') {
				squad.value = route.params.target as string
				if (squad.value) {
					selectedBoss.value = Object.values(BOSSES).find(b => b.name === route.params.type)
					LeekWars.bossSquads.join(squad.value)
				} else {
					selectedBoss.value = null
					LeekWars.bossSquads.listen()
				}
			}
		} else {
			localStorage.removeItem("garden/category")
			LeekWars.setTitle(t('title'))
			LeekWars.splitShowList()
		}
	}

	function updateWS() {
		if (category.value === 'boss') {
			squad.value = route.params.target as string
			if (squad.value) {
				LeekWars.bossSquads.join(squad.value)
			} else {
				LeekWars.bossSquads.listen()
			}
		}
	}

	function loadLeek(leek: Leek) {
		selectedLeek.value = leek
		if (garden.value.fights === 0 || leekOpponents[leek.id]) {
			return
		}
		LeekWars.get('garden/get-leek-opponents/' + leek.id).then(data => {
			leekOpponents[leek.id] = data.opponents
		}).error(error => {
			leekErrors[leek.id] = error.error
		})
	}

	function selectFarmer() {
		if (garden.value.fights === 0 || farmerOpponents.value) {
			return
		}
		LeekWars.get('garden/get-farmer-opponents').then(data => {
			farmerOpponents.value = data.opponents
		}).error(error => {
			LeekWars.toast(error.error)
		})
	}

	function selectComposition(composition: Composition) {
		if (!composition) { return }
		selectedComposition.value = composition
		if (composition.fights === 0 || teamOpponents[composition.id]) {
			return
		}
		LeekWars.get('garden/get-composition-opponents/' + composition.id).then(data => {
			teamOpponents[composition.id] = data.opponents
		}).error(error => {
			LeekWars.toast(error)
		})
	}

	function selectArena(leek: Leek) {
		selectedLeek.value = leek
		if (garden.value.fights === 0 && LeekWars.arena.enabled) {
			LeekWars.arena.leave()
		}
	}

	function arenaRegister() {
		if (!selectedLeek.value) { return }
		LeekWars.arena.register(selectedLeek.value.id, arenaPreference.value, wantsColossus.value)
	}

	function arenaLeave() {
		LeekWars.arena.leave()
	}

	function clickSoloOpponent(leek: Leek) {
		if (selectedLeek.value) {
			LeekWars.track('start-fight')
			if (LeekWars.didactitial_step === 2) {
				LeekWars.didactitial_next()
			}
			LeekWars.post('garden/start-solo-fight', {leek_id: selectedLeek.value.id, target_id: leek.id}).then(data => {
				router.push('/fight/' + data.fight)
				store.commit('update-fights', -1)
			}).error(error => LeekWars.toast(t(error)))
		}
	}

	function clickFarmerOpponent(farmer: Farmer) {
		LeekWars.track('start-fight')
		LeekWars.post('garden/start-farmer-fight', {target_id: farmer.id}).then(data => {
			router.push('/fight/' + data.fight)
			store.commit('update-fights', -1)
		}).error(error => LeekWars.toast(t(error)))
	}

	function clickCompositionOpponent(composition: Composition) {
		if (selectedComposition.value) {
			LeekWars.track('start-fight')
			LeekWars.post('garden/start-team-fight', {composition_id: selectedComposition.value.id, target_id: composition.id}).then(data => {
				router.push('/fight/' + data.fight)
				store.commit('update-team-fights', -1)
			}).error(error => LeekWars.toast(t(error)))
		}
	}

	function selectChallenge() {
		challengeTarget.value = parseInt(route.params.target as string, 10)
		challengeType.value = route.params.type as string

		if (challengeType.value === 'leek') {
			if (!route.params.item) {
				router.replace('/garden/challenge/' + challengeType.value + '/' + challengeTarget.value + '/' + LeekWars.first(store.state.farmer!.leeks)!.id)
				return
			}
			selectedLeek.value = store.state.farmer!.leeks[parseInt(route.params.item as string, 10)]!
			LeekWars.get('garden/get-solo-challenge/' + challengeTarget.value).then(data => {
				if (data.challenges) {
					challengeFights.value = data.challenges
					challengeLeekTarget.value = data.leek
				}
			})
		} else if (challengeType.value === 'farmer') {
			LeekWars.get('garden/get-farmer-challenge/' + challengeTarget.value).then(data => {
				if (data.challenges) {
					challengeFights.value = data.challenges
					challengeFarmerTarget.value = data.farmer
				}
			})
		} else if (challengeType.value === 'team') {
			if (!route.params.item) {
				router.replace('/garden/challenge/' + challengeType.value + '/' + challengeTarget.value + '/' + garden.value.my_compositions[0].id)
				return
			}
			for (const composition of garden.value.my_compositions) {
				if (composition.id == route.params.item) {
					selectedComposition.value = composition
					break
				}
			}
			LeekWars.get('garden/get-team-challenge/' + challengeTarget.value).then(data => {
				if (data.challenges) {
					challengeFights.value = data.challenges
					challengeTeamTargets.value = data.compositions
				}
			})
		}
	}

	function startFarmerChallenge() {
		if (!challengeFarmerTarget.value) { return }
		LeekWars.track('start-fight')
		LeekWars.post('garden/start-farmer-challenge', {target_id: challengeFarmerTarget.value.id, seed: seed.value || 0, side: side.value}).then(data => {
			router.push('/fight/' + data.fight)
		}).error(error => LeekWars.toast(t(error)))
	}

	function startLeekChallenge() {
		if (!challengeLeekTarget.value || !selectedLeek.value) { return }
		LeekWars.track('start-fight')
		LeekWars.post('garden/start-solo-challenge', {leek_id: selectedLeek.value.id, target_id: challengeLeekTarget.value.id, seed: seed.value || 0, side: side.value}).then(data => {
			router.push('/fight/' + data.fight)
		}).error(error => LeekWars.toast(t(error)))
	}

	function startTeamChallenge(composition: Composition) {
		LeekWars.track('start-fight')
		LeekWars.post('garden/start-team-challenge', { composition_id: selectedComposition.value.id, target_id: composition.id, seed: seed.value || 0, side: side.value}).then(data => {
			router.push('/fight/' + data.fight)
		}).error(error => LeekWars.toast(t(error)))
	}

	watch(category, () => {
		if (category.value && category.value !== 'challenge') {
			localStorage.setItem('garden/category', category.value)
		}
	})

	watch(selectedLeek, () => {
		if (selectedLeek.value) {
			const key = category.value === 'arena' ? 'arena-leek' : 'garden/leek'
			localStorage.setItem(key, '' + selectedLeek.value.id)
		}
	})

	watch(selectedComposition, () => {
		if (selectedComposition.value) {
			localStorage.setItem('garden/compo', '' + selectedComposition.value.id)
		}
	})

	watch(arenaPreference, () => {
		localStorage.setItem('arena/preference', '' + arenaPreference.value)
	})

	watch(advanced, () => {
		localStorage.setItem("editor/test/advanced", '' + advanced.value)
	})

	function updateSeed(event: InputEvent) {
		if (event.data === '') {
			seed.value = null
		} else if (seed.value) {
			seed.value = parseInt(seed.value)
			if (seed.value > 2147483647) {
				seed.value = 2147483647
			} else if (seed.value < 1) {
				seed.value = 1
			} else if (isNaN(seed.value)) {
				seed.value = null
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
	.sword {
		height: 20px;
		margin: 0 10px;
		vertical-align: middle;
		margin-bottom: 6px;
	}
	.fights .sword {
		margin: 0;
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
		width: 100%;
		display: inline-block;
		border-radius: 2px;
		border: 1px solid var(--border);
	}
	.opponents {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		& > * {
			max-width: 150px;
			width: 100%;
		}
	}
	.no-opponent {
		padding: 20px;
		img {
			margin-bottom: 10px;
		}
		h4 {
			text-align: center;
		}
	}
	#app.app .opponents > * {
		max-width: 120px;
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
		flex-wrap: wrap;
		align-items: baseline;
	}
	.boss-wrapper {
		flex: 1;
		height: 100%;
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
	.arena-leek {
		position: relative;
	}
	.arena-pref {
		position: absolute;
		top: 2px;
		right: 2px;
		font-size: 14px;
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
