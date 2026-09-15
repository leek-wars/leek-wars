<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<div class="page-title">
				<page-icon name="garden" fallback="mdi-sword-cross" />
				<div class="page-title-text">
					<h1>{{ $t('title') }}</h1>
				</div>
			</div>
			<div v-if="garden" class="tabs">
				<v-tooltip>
					<template #activator="{ props }">
						<div v-bind="props" class="tab action counter hidden disabled">
							<img class="restat-potion" src="/image/potion/restat.png">
							<span>{{ restatPotionCount }}</span>
						</div>
					</template>
					{{ $t('potion.restat') }}
				</v-tooltip>
				<div class="tab action counter hidden disabled">
					<v-icon>mdi-sword-cross</v-icon>
					<span>{{ garden.fights }}</span>
					<span v-if="$store.state.farmer?.team_fights">+ {{ $store.state.farmer.team_fights }}</span>
				</div>
			</div>
		</div>
		<season-banner />
		<div class="container last">
			<div class="column3 categories">
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
											<span v-if="liveArenaCount > 0" class="live-arena-count">
												<span class="dot"></span>
												<span class="count">{{ liveArenaCount }}</span>
											</span>
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
								<div class="count">{{ $t('n_fights', queue) }}</div>
							</div>
						</div>
					</template>
				</panel>
			</div>

			<div class="column9">
				<panel class="garden-right first">
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
									<div v-if="challengeLeekTarget" class="leek" @click="startLeekChallenge">
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
							<lw-radio-group v-model="side">
								<lw-radio value="left" :label="$t('main.side_left')"></lw-radio>
								<lw-radio value="right" :label="$t('main.side_right')"></lw-radio>
							</lw-radio-group>
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
								<div class="arena-preferences">
									<h4>{{ $t('arena_preference') }}</h4>
									<div class="modes">
										<div v-for="mode of ARENA_PREFERENCES" :key="mode" v-ripple :class="{selected: arenaPreference === mode}" class="mode" @click="arenaPreference = mode">
											<v-icon>{{ modeIcon(mode) }}</v-icon>
											<span>{{ modeLabel(mode) }}</span>
										</div>
									</div>
								</div>
								<div v-if="garden.fights" class="arena-register">
									<v-btn color="primary" size="large" :disabled="!arenaEnabled" @click="arenaRegister"><v-icon>mdi-sword-cross</v-icon>&nbsp;{{ $t('main.select') }}</v-btn>
								</div>
								<garden-no-fights v-else :canbuy="true" @bought="reload" />
								<div v-if="garden.fights && liveArenaCount > 0" class="arena-live">
									<div class="arena-live-count">
										<span class="dot"></span>
										<strong>{{ liveArenaCount }}</strong> / {{ Arena.MAX_PLAYERS }}
									</div>
									<div class="arena-live-message">
										<template v-if="liveArenaCountdown >= 0">
											{{ $t('arena_countdown_invite', [liveArenaCountdown]) }}
										</template>
										<template v-else-if="liveArenaCount >= Arena.MIN_PLAYERS">
											{{ $t('arena_invite_ready', liveArenaCount) }}
										</template>
										<template v-else>
											{{ $t('arena_invite_join', Arena.MIN_PLAYERS - liveArenaCount) }}
										</template>
									</div>
								</div>
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
								<div class="leek-count arena-waiting">
									<span class="dot"></span>
									<strong>{{ LeekWars.arena.progress }}</strong> / {{ Arena.MAX_PLAYERS }}
								</div>
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
										<div v-ripple :class="{disabled: !garden.fights}" class="leek boss" @click="LeekWars.bossSquads.create(boss)">
											<leek-image :leek="boss" :scale="boss.scale" />
											<div class="name">{{ $t('entity.' + boss.name) }}</div>
											<div class="level">{{ $t('main.level_n', [boss.level]) }}</div>
											<div class="stars">
												<v-icon v-for="d of 3" :key="d">{{ d > boss.difficulty ? 'mdi-star-outline' : 'mdi-star' }}</v-icon>
											</div>
										</div>
										<router-link :to="'/ranking/boss-' + boss.id + '/turns'" class="boss-ranking-link">
											<v-icon>mdi-podium</v-icon> {{ $t('main.ranking') }}
										</router-link>
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
										<rich-tooltip-leek v-for="(leek,p) of LeekWars.bossSquads.squad.engaged_leeks" :id="leek.id" :key="p" v-slot="{ props }">
											<div v-bind="props" class="participant" :class="{active: true}" @click="LeekWars.bossSquads.removeLeek(leek)">
												<leek-image :leek="leek" :scale="0.42"></leek-image>
												<div class="name">
													<avatar :farmer="LeekWars.bossSquads.squad.farmers.find(f => f.id === (leek.farmer as unknown as number))" />
													<span>{{ leek.name }}</span>
												</div>
												<div class="level">{{ $t('main.level_n', [leek.level]) }}</div>
											</div>
										</rich-tooltip-leek>
										<div v-for="(leek, p) of 8 - LeekWars.bossSquads.squad.engaged_leeks.length" :key="'e_' + p" class="participant"></div>
									</div>
									<h4 v-if="LeekWars.bossSquads.squad.available_leeks?.length">Poireaux disponibles</h4>
									<div class="participants">
										<rich-tooltip-leek v-for="leek of LeekWars.bossSquads.squad.available_leeks" :id="leek.id" :key="leek.id" v-slot="{ props }">
											<div v-bind="props" class="participant" :class="{active: true}" @click="LeekWars.bossSquads.addLeek(leek)">
												<leek-image :leek="leek" :scale="0.42"></leek-image>
												<div class="name">
													<avatar :farmer="LeekWars.bossSquads.squad.farmers.find(f => f.id === (leek.farmer as unknown as number))" />
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
											<rich-tooltip-farmer v-for="farmer of LeekWars.bossSquads.squad.farmers" :id="farmer.id" :key="farmer.id">
												<avatar :farmer="farmer" :class="{master: LeekWars.bossSquads.squad.master === farmer.id}" />
											</rich-tooltip-farmer>
										</div>
										<div class="attack-buttons">
											<v-btn color="primary" :disabled="LeekWars.bossSquads.squad.engaged_leeks.length === 0 || LeekWars.bossSquads.squad.master !== $store.state.farmer.id" @click="LeekWars.bossSquads.attack()"><v-icon>mdi-sword-cross</v-icon>&nbsp;{{ $t('attack') }}</v-btn>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</panel>
				<garden-batch v-if="batchLauncher || batchLoading || batchFights.length" :ids="batchFights" :launching="batchLoading" @close="closeBatch">
					<template #launch>
						<garden-fast-fight v-if="batchLauncher" :loading="batchLoading" :disabled="batchLauncher.disabled" :disabled-reason="batchLauncher.reason" @launch="batchLauncher.launch" />
					</template>
				</garden-batch>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { locale } from '@/locale'
	import type { ApiError } from '@/model/api-error'
	import { Arena, ARENA_MODE_LABELS, arenaModeIcon } from '@/model/arena'
	import { Farmer } from '@/model/farmer'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { countRestatPotions } from '@/model/leekwars'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { store } from '@/model/store'
	import { Composition } from '@/model/team'
	import GardenBatch from './garden-batch.vue'
	import GardenCompo from './garden-compo.vue'
	import GardenFarmer from './garden-farmer.vue'
	import GardenFastFight from './garden-fast-fight.vue'
	import GardenLeek from './garden-leek.vue'
	import { BOSSES } from '@/model/boss'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import SeasonBanner from '@/component/season/season-banner.vue'
	import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

	import { useRoute, useRouter } from 'vue-router'
	import { emitter } from '@/model/emitter'

	const GardenNoFights = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/garden/garden-no-fights.${locale}.i18n`))

	defineOptions({ name: 'Garden', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('garden')
	const route = useRoute()
	const router = useRouter()

	// Différer la re-navigation hors du watcher route.params : appeler router.replace
	// synchroniquement pendant le patch de <router-view> casse les Teleport Vuetify
	// (parentNode null).
	const replaceNextTick = (path: string) => nextTick(() => router.replace(path))

	interface GardenData {
		fights: number
		team_fights: number
		farmer_enabled: boolean
		team_enabled: boolean
		battle_royale_enabled: boolean
		my_compositions: Composition[]
	}
	const garden = ref<GardenData | null>(null)
	const category = ref('solo')
	const selectedLeek = ref<Leek | null>(null)
	const selectedComposition = ref<Composition | null>(null)
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
	const storedSeed = parseInt(localStorage.getItem('garden/challenge/seed') || '', 10)
	const seed = ref<number | null>(isNaN(storedSeed) || storedSeed < 1 ? null : storedSeed)
	const side = ref(localStorage.getItem('garden/challenge/side') || 'left')

	watch(seed, () => {
		if (seed.value) {
			localStorage.setItem('garden/challenge/seed', String(seed.value))
		} else {
			localStorage.removeItem('garden/challenge/seed')
		}
	})
	watch(side, () => {
		localStorage.setItem('garden/challenge/side', side.value)
	})
	let request: ReturnType<typeof LeekWars.get> | null = null
	const selectedBoss = ref<{ id: number; name: string; level: number; scale: number; difficulty: number } | null>(null)
	const squad = ref<string | null>(null)
	const arenaPreference = ref(parseInt(localStorage.getItem('arena/preference') || '-1', 10))
	const wantsColossus = ref(false)
	const batchLoading = ref(false)
	// Dernier lot Fast Garden : ses combats (grille + résumé sous le potager) et sa clé
	// de configuration, qui dit si une relance s'y cumule ou en ouvre un nouveau.
	const batchFights = ref<number[]>([])
	const batchKey = ref('')
	const BATCH_STORAGE = 'garden/batch'
	// 100 = le quota journalier d'un abonné LW+ : une journée entière de relances tient
	// dans un lot. Au-delà, `garden/get-batch` chargerait des rapports pour rien.
	const BATCH_MAX = 100
	// Un lot de la veille n'intéresse plus personne, et ses combats ont quitté la table
	// courante en fin d'année : on ne restaure que du frais.
	const BATCH_TTL = 24 * 3600 * 1000

	function storeBatch() {
		if (!batchFights.value.length) {
			localStorage.removeItem(BATCH_STORAGE)
			return
		}
		localStorage.setItem(BATCH_STORAGE, JSON.stringify({
			farmer: store.state.farmer?.id, date: Date.now(),
			key: batchKey.value, fights: batchFights.value,
		}))
	}

	function closeBatch() {
		batchFights.value = []
		batchKey.value = ''
		storeBatch()
	}

	/**
	 * Restaure le lot au retour sur la page. Lié à l'éleveur : le bandeau de comptes
	 * permet de changer de compte sans recharger, et `garden/get-batch` ne rend que les
	 * combats dont je suis le lanceur — un lot d'un autre compte n'afficherait rien.
	 */
	let batchRestored = false
	function restoreBatch() {
		if (batchRestored || !store.state.farmer) { return }
		batchRestored = true
		try {
			const raw = JSON.parse(localStorage.getItem(BATCH_STORAGE) || 'null')
			if (!raw || !Array.isArray(raw.fights) || !raw.fights.length) { return }
			if (raw.farmer !== store.state.farmer.id || Date.now() - (raw.date || 0) > BATCH_TTL) {
				localStorage.removeItem(BATCH_STORAGE)
				return
			}
			batchFights.value = raw.fights.filter((id: unknown) => typeof id === 'number').slice(0, BATCH_MAX)
			batchKey.value = typeof raw.key === 'string' ? raw.key : ''
		} catch {
			localStorage.removeItem(BATCH_STORAGE)
		}
	}

	const farmerEnabled = computed(() => !!(garden.value && garden.value.farmer_enabled))
	const teamEnabled = computed(() => !!(garden.value && garden.value.team_enabled))
	const arenaEnabled = computed(() => !!(garden.value && garden.value.battle_royale_enabled && store.state.farmer && store.state.farmer.verified))
	const bossEnabled = computed(() => true)
	const liveArenaCount = computed(() => store.state.arenaCount || 0)
	const liveArenaCountdown = computed(() => store.state.arenaCountdown)
	const restatPotionCount = computed(() => countRestatPotions(store.state.farmer?.potions || []))

	// La forme du corps d'erreur est déjà normalisée par LeekWars.request().
	function batchErrorToast(error: ApiError) {
		LeekWars.toast(t(error.error))
	}
	/**
	 * Fast Garden : on ne navigue PLUS vers le premier combat du lot (l'ancien x10
	 * admin le faisait). Le lot s'affiche sur place, dans son panneau sous le potager,
	 * et se remplit au fur et à mesure des générations.
	 *
	 * Relancer CUMULE, mais seulement à l'identique : même poireau en solo, même compo
	 * en équipe, même boss avec la même escouade. Un résumé qui mélangerait deux
	 * poireaux ou deux compos ne voudrait rien dire — dans ce cas le lot repart de zéro.
	 */
	function batchLaunched(fights: number[], key: string, counter: 'update-fights' | 'update-team-fights' = 'update-fights') {
		// Décrément local pour l'affichage immédiat ; le reload() qui suit remet les
		// compteurs faisant foi (le lot peut s'être arrêté avant d'atteindre `count`).
		store.commit(counter, -fights.length)

		const previous = key === batchKey.value ? batchFights.value : []
		batchKey.value = key
		// Les nouveaux en tête : le serveur trie par id décroissant de toute façon, mais
		// c'est aussi la queue qu'on rabote quand le lot dépasse le plafond.
		batchFights.value = [...fights, ...previous.filter(id => !fights.includes(id))].slice(0, BATCH_MAX)
		storeBatch()

		reload()
		nextTick(() => {
			document.querySelector('.fast-garden')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		})
	}
	function batchSoloAttack(count: number) {
		if (!selectedLeek.value) return
		const leek_id = selectedLeek.value.id
		batchLoading.value = true
		LeekWars.post<{fights: number[]}>('garden/start-solo-fight-batch', {leek_id, count}).then(data => {
			batchLaunched(data.fights, 'solo:' + leek_id)
		}).error(batchErrorToast).finally(() => {
			batchLoading.value = false
		})
	}
	function batchFarmerAttack(count: number) {
		batchLoading.value = true
		LeekWars.post<{fights: number[]}>('garden/start-farmer-fight-batch', {count}).then(data => {
			// Le potager éleveur n'a qu'une configuration : tous ses lots se cumulent.
			batchLaunched(data.fights, 'farmer')
		}).error(batchErrorToast).finally(() => {
			batchLoading.value = false
		})
	}
	function batchTeamAttack(count: number) {
		if (!selectedComposition.value) return
		const composition_id = selectedComposition.value.id
		batchLoading.value = true
		LeekWars.post<{fights: number[]}>('garden/start-team-fight-batch', {composition_id, count}).then(data => {
			batchLaunched(data.fights, 'team:' + composition_id, 'update-team-fights')
		}).error(batchErrorToast).finally(() => {
			batchLoading.value = false
		})
	}
	function batchAttack(count: number) {
		const currentSquad = LeekWars.bossSquads.squad
		if (!currentSquad || !selectedBoss.value) return
		const participants = currentSquad.engaged_leeks
			.filter((l: Leek) => (l.farmer as unknown as number) === store.state.farmer!.id)
			.map((l: Leek) => l.id)
		if (participants.length === 0) return
		// L'escouade est identifiée par les poireaux engagés (de TOUS les farmers), pas
		// par son id : attaquer la quitte, relancer en reforme forcément une autre.
		const boss_id = selectedBoss.value.id
		const key = 'boss:' + boss_id + ':' + currentSquad.engaged_leeks.map((l: Leek) => l.id).sort((a, b) => a - b).join(',')
		batchLoading.value = true
		LeekWars.post<{fights: number[]}>('garden/start-boss-fight-batch', {boss_id, participants, count}).then(data => {
			LeekWars.bossSquads.leaveSquad()
			batchLaunched(data.fights, key)
		}).error(batchErrorToast).finally(() => {
			batchLoading.value = false
		})
	}
	/**
	 * Le lanceur qui correspond au potager affiché, pour le bouton de relance du panneau
	 * du lot. Il rend exactement ce que rend le bouton du potager au même instant : si
	 * rien n'est sélectionné (pas de poireau, plus de combats, pas d'escouade), il n'y a
	 * rien à relancer et le bouton disparaît plutôt que de mentir.
	 */
	const batchLauncher = computed(() => {
		if (category.value === 'solo') {
			if (!selectedLeek.value || !garden.value?.fights) { return null }
			const opponents = leekOpponents[selectedLeek.value.id]
			return { launch: batchSoloAttack, disabled: !opponents || !opponents.length, reason: '' }
		}
		if (category.value === 'farmer') {
			if (!garden.value?.fights) { return null }
			return { launch: batchFarmerAttack, disabled: !farmerOpponents.value || !farmerOpponents.value.length, reason: '' }
		}
		if (category.value === 'team') {
			if (!selectedComposition.value || selectedComposition.value.fights <= 0) { return null }
			const opponents = teamOpponents[selectedComposition.value.id]
			return { launch: batchTeamAttack, disabled: !opponents || !opponents.length, reason: '' }
		}
		if (category.value === 'boss') {
			const currentSquad = LeekWars.bossSquads.squad
			if (!currentSquad || !selectedBoss.value) { return null }
			return {
				launch: batchAttack,
				disabled: currentSquad.engaged_leeks.length === 0 || currentSquad.master !== store.state.farmer!.id,
				reason: t('fast_fight_boss_master_only') as string,
			}
		}
		return null
	})

	function modeLabel(preference: number): string {
		return t(ARENA_MODE_LABELS[preference] || 'arena_no_preference') as string
	}
	const modeIcon = arenaModeIcon
	// -1 = peu importe, puis les quatre modes dans l'ordre de `ARENA_MODE_LABELS`.
	const ARENA_PREFERENCES = [-1, ...ARENA_MODE_LABELS.map((_, i) => i)]

	if (store.state.wsconnected) {
		updateWS()
	} else {
		emitter.on('wsconnected', updateWS)
	}

	onMounted(() => {
		LeekWars.setTitle(t('title'))

		advanced.value = localStorage.getItem("editor/test/advanced") === 'true'

		request = LeekWars.get('garden/get')
		request.then(handleGardenData)

		LeekWars.socket.send([SocketMessage.GARDEN_QUEUE_REGISTER])
		emitter.on('garden-queue', (data: unknown) => queue.value = data as number)

		emitter.on('update-team-talent', (m: unknown) => {
			const message = m as { composition: number; talent: number }
			if (message.composition in compositions_by_id) {
				compositions_by_id[message.composition].talent += message.talent
			}
		})

		window.addEventListener('pageshow', onPageShow)
	})

	/* Plus de retour vers une liste de catégories : sur mobile la page ne se
	   dédoublait plus qu'ici (`splitBack`), et le bouton de la barre
	   d'application redevient le menu, comme sur les pages sans split. */

	function handleGardenData(r: unknown) {
		garden.value = (r as { garden: GardenData }).garden
		// Jamais de compteur négatif (ex: dernier combat dépensé en attendant dans la file d'arène)
		garden.value.fights = Math.max(0, garden.value.fights)
		garden.value.team_fights = Math.max(0, garden.value.team_fights)
		for (const composition of garden.value.my_compositions) {
			composition.fights = Math.max(0, composition.fights)
			compositions_by_id[composition.id] = composition
		}
		// Resynchronise les compteurs du menu/header : les valeurs du store
		// dérivent (décréments locaux, compos créées sans refetch du farmer)
		store.commit('set-fights-counts', { fights: garden.value.fights, team_fights: garden.value.team_fights })
		update()
	}

	function reload() {
		LeekWars.get('garden/get').then(handleGardenData)
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
		if (request) { request.abort() }
		LeekWars.socket.send([SocketMessage.GARDEN_QUEUE_UNREGISTER])
		emitter.off('wsconnected', updateWS)
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_UNLISTEN])
		window.removeEventListener('pageshow', onPageShow)
	})

	watch([() => route.params, () => store.state.farmer], () => update())

	function update() {
		if (!store.state.farmer) { return }
		restoreBatch()
		const params = route.params
		category.value = params.category as string
		if (!category.value) {
			// Le mobile restait sur la liste des catégories tant qu'aucune n'avait été
			// visitée (l'ancienne vue en deux écrans). Les catégories sont maintenant un
			// menu en tête de page : il y a toujours une catégorie ouverte dessous, sur
			// mobile comme ailleurs.
			let defaultCategory = localStorage.getItem('garden/category') || 'solo'
			if (defaultCategory === 'challenge') { defaultCategory = 'solo' }
			if ((defaultCategory === 'battle-royale' || defaultCategory === 'arena') && !store.state.farmer.br_enabled) { defaultCategory = 'solo' }
			replaceNextTick('/garden/' + defaultCategory)
			return
		}
		if ((category.value === 'solo' || category.value === 'arena') && (!params.item || !store.state.farmer?.leeks || !(parseInt(params.item as string, 10) in store.state.farmer.leeks))) {
			const key = category.value === 'arena' ? 'arena-leek' : 'garden/leek'
			let defaultLeek = parseInt(localStorage.getItem(key) || '0', 10)
			if (!store.state.farmer?.leeks || !(defaultLeek in store.state.farmer.leeks)) {
				const first = LeekWars.first(store.state.farmer!.leeks)
				if (!first) { return }
				defaultLeek = first.id
			}
			replaceNextTick('/garden/' + category.value + '/' + defaultLeek)
			return
		}
		if (category.value === 'team' && !params.item && garden.value) {
			if (garden.value.my_compositions.length > 0) {
				let defaultComposition = parseInt(localStorage.getItem('garden/compo') || '0', 10)
				if (!(defaultComposition in compositions_by_id)) {
					defaultComposition = garden.value.my_compositions[0].id
				}
				replaceNextTick('/garden/team/' + defaultComposition)
				return
			}
		}
		const item = parseInt(params.item as string, 10)

		if (!garden.value || !store.state.farmer) {
			return
		}
		if (category.value) {
			if (category.value !== 'challenge') {
				localStorage.setItem('garden/category', category.value)
			}
			const category_underscore = category.value.replace('-', '_')
			LeekWars.setTitle(t('garden_' + category_underscore), t('n_fights', store.state.farmer.fights) + (store.state.farmer.team_fights ? ' + ' + t('n_fights', store.state.farmer.team_fights) : ''))

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
					selectedBoss.value = Object.values(BOSSES).find(b => b.name === route.params.type) ?? null
					LeekWars.bossSquads.join(squad.value)
				} else {
					selectedBoss.value = null
					LeekWars.bossSquads.listen()
				}
			}
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
		if (!leek) { return }
		selectedLeek.value = leek
		if (!garden.value || garden.value.fights === 0 || leekOpponents[leek.id]) {
			return
		}
		LeekWars.get('garden/get-leek-opponents/' + leek.id).then(data => {
			leekOpponents[leek.id] = data.opponents
		}).error(error => {
			leekErrors[leek.id] = error.error
		})
	}

	function selectFarmer() {
		if (!garden.value || garden.value.fights === 0 || farmerOpponents.value) {
			return
		}
		LeekWars.get('garden/get-farmer-opponents').then(data => {
			farmerOpponents.value = data.opponents
		}).error(error => {
			LeekWars.toast(error.error as string)
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
			LeekWars.toast(error.error as string)
		})
	}

	function selectArena(leek: Leek) {
		selectedLeek.value = leek
		if (garden.value && garden.value.fights === 0 && LeekWars.arena.enabled) {
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
			}).error(error => LeekWars.toast(t(error.error) as string))
		}
	}

	function clickFarmerOpponent(farmer: Farmer) {
		LeekWars.track('start-fight')
		LeekWars.post('garden/start-farmer-fight', {target_id: farmer.id}).then(data => {
			router.push('/fight/' + data.fight)
			store.commit('update-fights', -1)
		}).error(error => LeekWars.toast(t(error.error) as string))
	}

	function clickCompositionOpponent(composition: Composition) {
		if (selectedComposition.value) {
			LeekWars.track('start-fight')
			LeekWars.post('garden/start-team-fight', {composition_id: selectedComposition.value.id, target_id: composition.id}).then(data => {
				router.push('/fight/' + data.fight)
				store.commit('update-team-fights', -1)
			}).error(error => LeekWars.toast(t(error.error) as string))
		}
	}

	function selectChallenge() {
		challengeTarget.value = parseInt(route.params.target as string, 10)
		challengeType.value = route.params.type as string

		if (challengeType.value === 'leek') {
			if (!route.params.item) {
				replaceNextTick('/garden/challenge/' + challengeType.value + '/' + challengeTarget.value + '/' + LeekWars.first(store.state.farmer!.leeks)!.id)
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
			if (!garden.value) return
			if (!route.params.item) {
				replaceNextTick('/garden/challenge/' + challengeType.value + '/' + challengeTarget.value + '/' + garden.value.my_compositions[0].id)
				return
			}
			for (const composition of garden.value.my_compositions) {
				if (composition.id === parseInt(route.params.item as string, 10)) {
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
		}).error(error => LeekWars.toast(t(error.error) as string))
	}

	function startLeekChallenge() {
		if (!challengeLeekTarget.value || !selectedLeek.value) { return }
		LeekWars.track('start-fight')
		LeekWars.post('garden/start-solo-challenge', {leek_id: selectedLeek.value.id, target_id: challengeLeekTarget.value.id, seed: seed.value || 0, side: side.value}).then(data => {
			router.push('/fight/' + data.fight)
		}).error(error => LeekWars.toast(t(error.error) as string))
	}

	function startTeamChallenge(composition: Composition) {
		if (!selectedComposition.value) return
		LeekWars.track('start-fight')
		LeekWars.post('garden/start-team-challenge', { composition_id: selectedComposition.value.id, target_id: composition.id, seed: seed.value || 0, side: side.value}).then(data => {
			router.push('/fight/' + data.fight)
		}).error(error => LeekWars.toast(t(error.error) as string))
	}

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
			seed.value = parseInt(String(seed.value))
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
/* La page est longue — adversaires puis lot de combats — et les onglets de
   catégorie partaient avec le scroll. Ils restent en haut.
   `align-self` est indispensable : le conteneur étire ses colonnes sur toute sa
   hauteur, et un élément sticky qui remplit son bloc conteneur n'a nulle part où
   coller. En v3 la barre du haut est fixe (`--header-height`), d'où le décalage,
   comme le panneau de prévisualisation du marché. */
.column3 {
	position: sticky;
	align-self: flex-start;
	top: 12px;
	body:not(.v2) & {
		top: calc(var(--header-height) + 12px);
	}
}
	.tabs .tab img.restat-potion {
		width: 32px;
		margin: -4px 0;
	}
	// Quand le bandeau de saison est présent, les panneaux du dessus s'y collent :
	// on carre leurs coins hauts pour une jointure nette avec le bandeau.
	.season-banner + .container .panel.first {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}
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
			border-radius: var(--radius-tiny);
			.player-count {
				font-size: 20px;
				color: var(--text-color-secondary);
				padding: 2px;
			}
		}
		.tab.router-link-active {
			background: var(--pure-white);
			box-shadow: var(--elevation-1);
		}
		.tab:not(.enabled) {
			opacity: 0.4;
			background: var(--grey-11);
			cursor: default;
		}
		/* ====== v3 ======
		   L'actif prenait un aplat `--pure-white`, qui vaut le fond de page en
		   sombre : l'onglet courant y devenait la case la plus SOMBRE de la
		   colonne. Il passe au trait et à l'encre verts, comme les onglets de la
		   barre de page.
		   Le désactivé était peint en `--grey-11`, un gris de l'échelle claire
		   que le bloc sombre ne redéfinit pas : case claire sous une encre
		   claire, 1,34 mesuré sur le compteur et 1,38 sur l'intitulé. Il prend la
		   surface que le thème réserve à ça, et l'opacité de 0,4 qui écrasait le
		   tout n'a plus lieu d'être. */
		body:not(.v2) & {
			.tab {
				transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
			}
			.tab.enabled:hover {
				background: var(--background-row);
				border-color: var(--border-strong);
			}
			.tab.router-link-active {
				background: var(--background-row);
				border-color: var(--primary);
				box-shadow: none;
				h2 {
					color: var(--primary);
				}
			}
			.tab:not(.enabled) {
				opacity: 1;
				background: var(--background-disabled);
				border-color: var(--border);
				color: var(--text-color-secondary);
				/* L'intitulé est un h2, qui porte sa propre couleur dans
				   global.scss : sans cette ligne il resterait à pleine encre et
				   l'onglet indisponible se lirait comme un onglet ouvert. */
				h2 {
					color: var(--text-color-secondary);
				}
				.player-count {
					color: var(--text-color-secondary);
				}
			}
		}
		.tab h2 {
			margin: 0;
			margin-bottom: 5px;
			font-size: 20px;
		}
	}
	/* ====== Mobile : les catégories deviennent un menu en tête de page ======
	 *
	 * La page se dédoublait (`splitBack`) : un premier écran ne montrait que les
	 * cinq grosses cases de catégorie, le potager lui-même n'arrivait qu'au clic,
	 * et le bouton de la barre d'application servait de retour. Un écran entier
	 * pour cinq liens, et un mode de navigation propre à cette page.
	 *
	 * Les catégories sont maintenant une barre d'onglets au-dessus du potager
	 * (demande de Pierre, 2026-09-10). Mêmes liens, même composant : seule la
	 * mise en forme change ici, la colonne de gauche du bureau n'y touche pas.
	 */
	#app.app {
		.categories {
			/* La colonne prend toute la largeur (sans quoi `flex: 3` la met côte à
			   côte avec le potager) et perd son collage en haut d'écran : la barre
			   défile avec la page, la barre d'application est déjà fixe. */
			flex: 1 0 100%;
			position: static;
		}
		.garden-left {
			/* `:not(.tab)` : le potager de défi met un onglet unique à la place de
			   la liste, directement sous le panneau — il n'a pas à devenir une
			   barre. */
			> div:not(.tab) {
				padding: 6px;
				display: flex;
				flex-wrap: wrap;
				gap: 6px;
			}
			.tab {
				margin: 0;
				padding: 7px 6px;
				/* Toutes les catégories à la même largeur (« il faut que chaque
				   catégorie fasse la même largeur ») : base 0, elles se
				   partagent la ligne à parts égales quelle que soit la longueur
				   de l'intitulé. `fit-content` en largeur minimale garde le
				   garde-fou des langues à mots longs — un intitulé qui ne tient
				   pas dans sa part pousse la barre à se replier sur deux lignes
				   plutôt qu'à se faire couper. */
				flex: 1 1 0;
				min-width: fit-content;
				text-align: center;
			}
			/* Le nombre de participants (4 contre 4, 10-20…) reste sous
			   l'intitulé, en petit : c'est ce qui distingue les catégories les
			   unes des autres (Pierre, 2026-09-10 : « tu peux quand même
			   remettre les infos sur le nombre de joueurs »). Tout est mis à
			   l'échelle de la barre — la carte du bureau écrivait les compteurs
			   en 20 px. */
			.tab h2 {
				font-size: 15px;
				margin: 0 0 1px;
			}
			.tab .player-count {
				font-size: 11px;
				padding: 0;
			}
			.tab .player {
				height: 11px;
				margin-bottom: 3px;
			}
			.tab .sword {
				height: 11px;
				margin: 0 4px 3px;
			}
			/* La file d'attente n'est pas un onglet : elle passe sous la barre. */
			.queue {
				flex: 1 0 100%;
				padding: 6px;
				display: flex;
				align-items: baseline;
				justify-content: center;
				gap: 8px;
				.count {
					padding: 0;
					font-size: 15px;
				}
			}
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
		border-radius: var(--radius-tiny);
		border: 1px solid var(--border);
	}
	.opponents {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		// 150 → 180 : le potager a gagné de la place, les cartes flottaient au
		// milieu de marges vides (Pierre, 10/09). Vaut pour ses poireaux comme
		// pour les adversaires, les deux passent par ce conteneur.
		& > * {
			max-width: 180px;
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
		max-width: 140px;
	}
	.leek:not(.disabled), .composition, .composition-wrapper, .opponents .farmer, .squad:not(.disabled) {
		cursor: pointer;
	}
	.leek:hover:not(.disabled), .my-farmer, .composition-wrapper:hover, .opponents .farmer:hover, .participant.active:hover, .squad:not(.disabled):hover {
		background-color: var(--pure-white);
		box-shadow: var(--elevation-1);
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
	.boss-ranking-link {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		margin: 10px 0;
		font-size: 13px;
		color: var(--text-color-secondary);
		.v-icon { font-size: 18px; }
		&:hover { color: var(--primary); }
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
		box-shadow: var(--elevation-1);
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
	/* ====== Préférence de mode d'arène ======
	 *
	 * C'étaient cinq cases à cocher alignées à gauche sous les poireaux, avec le
	 * bouton d'inscription posé à droite sur la même ligne : rien ne disait que
	 * les deux allaient ensemble, et les modes n'avaient pas d'image (demande de
	 * Pierre, 2026-09-10 : « améliorer cette UI »).
	 *
	 * Le choix devient une rangée de pastilles centrées, chacune avec le glyphe
	 * du mode — les mêmes que la pastille de préférence affichée sur les
	 * poireaux en attente (`.arena-pref`) — et l'inscription passe dessous, au
	 * centre. Le sélectionné suit la doctrine du vert. */
	.arena-preferences {
		/* Pas de largeur maximale : à 620 px les cinq pastilles passaient sur
		   deux lignes alors que la colonne en offre le double (« ça fait 2
		   lignes c'est dommage »). Elles tiennent sur une ligne dès 740 px de
		   colonne, et se replient d'elles-mêmes en dessous. */
		margin: 20px auto 0;
		h4 {
			text-align: center;
			margin-bottom: 10px;
			color: var(--text-color-secondary);
		}
		.modes {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 8px;
		}
		.mode {
			display: flex;
			align-items: center;
			gap: 5px;
			padding: 7px 10px;
			white-space: nowrap;
			border: 1px solid var(--border);
			border-radius: var(--radius-tiny);
			color: var(--text-color-secondary);
			font-weight: 500;
			cursor: pointer;
			user-select: none;
			transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
			.v-icon {
				font-size: 18px;
			}
			&:hover {
				background: var(--background-row);
				border-color: var(--border-strong);
				color: var(--text-color);
			}
			&.selected {
				background: color-mix(in srgb, var(--primary) 12%, transparent);
				border-color: var(--primary);
				color: var(--primary);
			}
		}
	}
	.arena-register {
		margin-top: 16px;
	}
	.arena-waiting,
	.arena-live-count {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		strong {
			color: var(--primary);
			font-weight: 700;
		}
	}
	.arena-live {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	.arena-live-count {
		font-size: 22px;
		color: var(--text-color);
	}
	.arena-live-message {
		color: var(--text-color-secondary);
		font-size: 15px;
	}
	.live-arena-count {
		margin-left: 10px;
		font-size: 20px;
		color: var(--primary);
		font-weight: 600;
		.dot {
			vertical-align: middle;
			margin-bottom: 3px;
			margin-right: 5px;
		}
	}
	.dot {
		display: inline-block;
		position: relative;
		width: 8px;
		height: 8px;
		border-radius: var(--radius-pill);
		background: var(--primary-surface);
	}
	// Halo pulsé via un pseudo-élément animé en transform/opacity (compositables
	// GPU, aucun repaint). L'ancienne version animait box-shadow, ce qui forçait
	// un repaint à chaque frame et faisait chauffer un cœur de CPU à 100% (#11920).
	.dot::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--radius-pill);
		/* Le vert du v2 était écrit en dur ici alors que le point lui-même suit
		   `--primary` : en v3 le halo ne parlait plus la couleur de sa source. */
		background: color-mix(in srgb, var(--primary-surface) 60%, transparent);
		animation: arena-pulse 2s infinite;
		pointer-events: none;
	}
	@keyframes arena-pulse {
		0% { transform: scale(1); opacity: 0.6; }
		70% { transform: scale(3); opacity: 0; }
		100% { transform: scale(3); opacity: 0; }
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
.attack-buttons {
	display: flex;
	gap: 0;
	:deep(.v-btn:not(:last-child)) {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	:deep(.v-btn:not(:first-child)) {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-left: 1px solid rgba(0, 0, 0, 0.2);
	}
}
h4 {
	text-align: left;
}
</style>
