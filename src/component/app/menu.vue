<template lang="html">
	<!-- `dida` : les bulles du didacticiel sont posées 420 px à DROITE de leur
	     entrée, donc hors du menu — un conteneur qui défile les rognerait. Le
	     menu d'un débutant tient de toute façon dans n'importe quel écran. -->
	<nav class="menu" :class="{ dida: LeekWars.didactitial_step > 0 }">

		<div v-if="!LeekWars.mobile" class="menu-button" @click="LeekWars.menuCollapsed = !LeekWars.menuCollapsed">
			<v-icon v-if="LeekWars.menuCollapsed">mdi-chevron-right</v-icon>
			<v-icon v-else>mdi-chevron-left</v-icon>
		</div>

		<div class="menu-wrapper">

			<div v-if="LeekWars.mobile" class="menu-top">
				<div class="top">
					<div class="section">
						<router-link to="/farmer" @click="clickItem">
							<avatar :farmer="$store.state.farmer" class="farmer-avatar" />
						</router-link>
						<div class="right">
							<div class="farmer-name-row">
								<router-link to="/farmer" @click="clickItem">
									<div v-if="$store.state.farmer" v-ripple class="text farmer-name">{{ $store.state.farmer.name }}</div>
								</router-link>
								<v-menu v-model="accountMenu" :width="300" :close-on-content-click="false" location="bottom start" scrim>
									<template #activator="{ props }">
										<v-btn v-bind="props" icon size="x-small" variant="text" class="account-switcher-btn">
											<v-icon size="18">mdi-chevron-down</v-icon>
										</v-btn>
									</template>
									<account-switcher @close="accountMenu = false" />
								</v-menu>
							</div>
							<div class="moneys">
								<router-link v-ripple to="/market" @click="clickItem">
									<span class="hab text"></span><span v-if="$store.state.farmer" class="farmer-habs">{{ $filters.number($store.state.farmer.habs) }}</span>
								</router-link>
								<router-link v-ripple class="crystals" to="/bank?ref=menu" @click="clickItem">
									<span class="crystal text"></span><span v-if="$store.state.farmer" class="farmer-crystals">{{ $filters.number($store.state.farmer.crystals) }}</span>
								</router-link>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="menu-center">
				<!-- Seule porte de sortie vers l'accueil sur mobile : la barre du haut,
				     qui porte le logo cliquable, n'y est pas rendue une fois connecté
				     (app.vue). Sur grand écran le logo suffit, l'entrée est en trop. -->
				<router-link v-if="LeekWars.mobile" v-ripple to="/" class="section" :class="{'router-link-active': isHomePage}" @click="clickItem">
					<!-- En v3 les entrées portent des icônes colorées (SVG générés par
					     scripts/generate-menu-icons.mjs, voir ICONS.md) ; le v2 et le thème
					     XP gardent leurs glyphes et PNG pour rester identiques au pixel. -->
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/home.svg">
					<v-icon v-else>mdi-home</v-icon>
					<div class="text">{{ $t('main.home') }}</div>
				</router-link>

				<!-- Intitulés de section du v3 (« ◆ Poireaux », « ◆ Jeu »), absents du
				     DOM en v2 pour que l'ancien design reste identique au pixel. -->
				<h4 v-if="!LeekWars.legacyTheme && $store.state.farmer && $store.state.farmer.leeks">{{ $t('main.leeks') }}</h4>
				<span v-if="$store.state.farmer && $store.state.farmer.leeks" class="leeks">
					<span v-for="(leek, key, i) in $store.state.farmer.leeks" :key="leek.id" class="dida-element">
						<!-- Le premier poireau n'est plus mis en avant sur « / » : l'accueil est
						     désormais un tableau de bord et non la page de ce poireau, et deux
						     entrées s'allumaient en même temps depuis l'ajout de l'entrée Accueil. -->
						<router-link v-ripple :to="{ name: 'leek', params: { id: leek.id }}" :label="($store.state.farmer.equipment_enabled ? leek.capital : 0) || null" :class="{'router-link-active': RegExp('/leek/' + leek.id + '(/|$)').test($route.path), bouncing: LeekWars.didactitial_step === 1 && i === 0 && !(isHomePage || $route.path === '/leek/' + leek.id)}" class="section">
							<div :leek="leek.id" :tab="'leek-' + leek.id" @click="clickItem">
								<!-- En v3 chaque poireau se reconnaît à sa propre miniature (haut de
								     la tête + chapeau) plutôt qu'à une icône générique. Les autres
								     thèmes gardent leurs PNG : le v2 doit rester identique au pixel. -->
								<leek-image v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" :leek="leek" head class="leek-head" />
								<img v-else :src="LeekWars.xpTheme ? '/image/icon/xp_leek.png' : '/image/icon/house.png'">
								<div class="text">{{ leek.name }}</div>
							</div>
						</router-link>
						<span v-if="LeekWars.didactitial_step === 1 && i === 0 && !(isHomePage || $route.path === '/leek/' + leek.id)" class="dida-hint right">
							<i18n-t tag="div" class="bubble" keypath="main.dida_2">
								<template #life>
									<img height=18 src="/image/charac/life.png">
								</template>
								<template #strength>
									<img height=18 src="/image/charac/strength.png">
								</template>
							</i18n-t>
							<span class="arrow"></span>
						</span>
					</span>
					<router-link v-if="new_leek_condition" v-ripple to="/new-leek" class="section">
						<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/add-leek.svg">
						<v-icon v-else>mdi-plus</v-icon>
						<div class="text">{{ $t('main.add_leek') }}</div>
					</router-link>
				</span>

				<div v-if="$store.state.farmer && $store.state.farmer.leeks" class="separator"></div>

				<h4 v-if="!LeekWars.legacyTheme">{{ $t('main.game') }}</h4>

				<span class="dida-element">
					<router-link v-ripple to="/editor" class="section" :class="{'router-link-active': $route.path.startsWith('/editor'), bouncing: LeekWars.didactitial_step === 4 && !$route.path.startsWith('/editor')}" @click="clickItem">
						<img v-if="LeekWars.xpTheme" src="/image/icon/xp_editor.png">
						<img v-else-if="!LeekWars.legacyTheme" class="menu-icon" src="/image/menu/editor.svg">
						<v-icon v-else>mdi-code-braces</v-icon>
						<div class="text">{{ $t("main.editor") }}</div>
					</router-link>
					<span v-if="LeekWars.didactitial_step === 4 && !$route.path.startsWith('/editor')" class="dida-hint right">
						<span class="bubble" v-html="$t('main.dida_7')"></span>
						<span class="arrow"></span>
					</span>
				</span>

				<span class="dida-element">
					<router-link v-ripple to="/garden" class="section" :class="{'router-link-active': $route.path.startsWith('/garden'), bouncing: LeekWars.didactitial_step === 2 && !$route.path.startsWith('/garden')}" :label="$store.state.farmer ? ($store.state.farmer.fights + ($store.state.farmer.team_fights ? '+' + $store.state.farmer.team_fights : '')) : null" @click="clickItem">
						<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/garden.svg">
						<img v-else :src="LeekWars.xpTheme ? '/image/icon/xp_garden.png' : '/image/icon/garden.png'">
						<div class="text">{{ $t("main.garden") }}</div>
					</router-link>
					<span v-if="LeekWars.didactitial_step === 2 && !$route.path.startsWith('/garden')" class="dida-hint right">
						<span class="bubble" v-html="$t('main.dida_3')"></span>
						<span class="arrow"></span>
					</span>
				</span>

				<router-link v-ripple to="/market" class="section" :class="{'router-link-active': $route.path.startsWith('/market')}" @click="clickItem">
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/market.svg">
					<v-icon v-else-if="LeekWars.xpTheme">mdi-store</v-icon>
					<img v-else src="/image/icon/market.png">
					<div class="text">{{ $t("main.market") }}</div>
				</router-link>

				<router-link v-ripple to="/inventory" class="section" :class="{'router-link-active': $route.path.startsWith('/inventory')}" @click="clickItem">
					<img v-if="LeekWars.xpTheme" src="/image/icon/xp_inventory.png">
					<img v-else-if="!LeekWars.legacyTheme" class="menu-icon" src="/image/menu/inventory.svg">
					<v-icon v-else>mdi-treasure-chest</v-icon>
					<div class="text">{{ $t("main.inventory") }}</div>
				</router-link>

				<router-link v-if="$store.state.farmer && $store.state.farmer.team" v-ripple to="/team" class="section" :class="{'router-link-active': $route.path.startsWith('/team')}" @click="clickItem">
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/team.svg">
					<img v-else :src="LeekWars.xpTheme ? '/image/icon/xp_team.png' : '/image/icon/team.png'">
					<div class="text">{{ $t('main.team') }}</div>
				</router-link>
				<router-link v-else-if="$store.state.farmer && $store.state.farmer.total_level >= 5" v-ripple to="/teams" class="section" :class="{'router-link-active': $route.path.startsWith('/teams')}" @click="clickItem">
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/team.svg">
					<img v-else :src="LeekWars.xpTheme ? '/image/icon/xp_team.png' : '/image/icon/team.png'">
					<div class="text">{{ $t('main.teams') }}</div>
				</router-link>

				<router-link v-if="$store.state.farmer && $store.state.farmer.trophies" v-ripple to="/trophies" class="section" :class="{'router-link-active': $route.path.startsWith('/trophies') || $route.path.startsWith('/trophy')}" @click="clickItem">
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/trophies.svg">
					<img v-else :src="LeekWars.xpTheme ? '/image/icon/xp_trophies.png' : '/image/icon/trophy.png'">
					<div class="text">{{ $t("main.trophies") }}</div>
				</router-link>

				<router-link v-ripple :to="rankingURL" class="section" :class="{'router-link-active': $route.path.startsWith('/ranking')}" @click="clickItem">
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/ranking.svg">
					<img v-else :src="LeekWars.xpTheme ? '/image/icon/xp_ranking.png' : '/image/icon/ranking.png'">
					<div class="text">{{ $t("main.ranking") }}</div>
				</router-link>

				<router-link v-ripple to="/help" class="section" :class="{'router-link-active': $route.path.startsWith('/help') || $route.path.startsWith('/encyclopedia')}" @click="clickItem">
					<img v-if="LeekWars.xpTheme" src="/image/icon/xp_help.png">
					<img v-else-if="!LeekWars.legacyTheme" class="menu-icon" src="/image/menu/help.svg">
					<v-icon v-else>mdi-help-circle-outline</v-icon>
					<div class="text">{{ $t("main.help") }}</div>
				</router-link>

				<router-link v-if="env.SOCIAL" v-ripple to="/forum" class="section" :class="{'router-link-active': $route.path.startsWith('/forum')}" @click="clickItem">
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/forum.svg">
					<img v-else :src="LeekWars.xpTheme ? '/image/icon/xp_forum.png' : '/image/icon/forum.png'">
					<div class="text">{{ $t("main.forum") }}</div>
				</router-link>

				<router-link v-if="LeekWars.mobile" v-ripple to="/console" class="section" @click="clickItem">
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/console.svg">
					<v-icon v-else>mdi-console</v-icon>
					<div class="text">{{ $t("main.console") }}</div>
				</router-link>

				<router-link v-if="$store.state.farmer && $store.state.farmer.group" v-ripple :to="'/group/' + $store.state.farmer.group.id" class="section" @click="clickItem">
					<img v-if="LeekWars.xpTheme" src="/image/icon/xp_team.png">
					<img v-else-if="!LeekWars.legacyTheme" class="menu-icon" src="/image/menu/group.svg">
					<v-icon v-else>mdi-account-group</v-icon>
					<div class="text">{{ $store.state.farmer.group.name }}</div>
				</router-link>

				<router-link v-if="$store.getters.moderator" v-ripple :label="$store.state.farmer?.reportings || null" to="/moderation" class="section" :class="{'router-link-active': $route.path.startsWith('/moderation')}" tab="moderation" @click="clickItem">
					<img v-if="LeekWars.xpTheme" src="/image/icon/xp_moderation.png">
					<img v-else-if="!LeekWars.legacyTheme" class="menu-icon" src="/image/menu/moderation.svg">
					<v-icon v-else>mdi-gavel</v-icon>
					<div class="text">{{ $t('main.moderation') }}</div>
				</router-link>

				<router-link v-if="$store.getters.admin" v-ripple :label="$store.state.farmer?.errors || null" to="/admin" class="section" :class="{'router-link-active': $route.path.startsWith('/admin')}" tab="admin" @click="clickItem">
					<img v-if="LeekWars.xpTheme" src="/image/icon/xp_admin.png">
					<img v-else-if="!LeekWars.legacyTheme" class="menu-icon" src="/image/menu/admin.svg">
					<v-icon v-else>mdi-security</v-icon>
					<div class="text">{{ $t('main.admin') }}</div>
				</router-link>

				<div v-if="LeekWars.arena.enabled || LeekWars.bossSquads.squad" class="separator"></div>

				<span v-if="LeekWars.arena.enabled" v-ripple :label="LeekWars.arena.progress" class="section" @click="arenaDialog = !arenaDialog">
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/arena.svg">
					<v-icon v-else>mdi-sword-cross</v-icon>
					<div class="text">{{ $t('main.arena') }}</div>
					<div class="progress-bar" :style="{width: (LeekWars.arena.progress / 20 * 100) + '%'}"></div>
				</span>
				<span v-if="LeekWars.bossSquads.squad" v-ripple :label="LeekWars.bossSquads.squad.engaged_leeks.length" class="section boss" @click="goToBoss">
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="menu-icon" src="/image/menu/boss.svg">
					<v-icon v-else>mdi-crown</v-icon>
					<div class="text">{{ $t('entity.' + BOSSES[LeekWars.bossSquads.squad.boss].name) }}</div>
					<div class="progress-bar" :style="{width: (100 * LeekWars.bossSquads.squad.engaged_leeks.length / 8) + '%'}"></div>
				</span>

				<popup v-model="arenaDialog" :width="600">
					<template #icon>
						<v-icon>mdi-sword-cross</v-icon>
					</template>
					<template #title>{{ $t('main.arena') }}</template>
					<div v-if="$store.state.farmer" class="arena-popup-my-leeks">
						<div v-for="leek in $store.state.farmer.leeks" :key="leek.id" v-ripple class="my-leek" :class="{selected: leek.id === registeredLeekId, disabled: leek.level < 20}" @click="leek.level >= 20 && changeArenaLeek(leek.id)">
							<leek-image :leek="leek" :scale="0.28" />
							<div class="name">{{ leek.name }}</div>
						</div>
					</div>
					<loader v-if="LeekWars.arena.progress == 0" />
					<div class="br-leeks">
						<div v-for="leek in LeekWars.arena.leeks" :key="leek.id" class="leek">
							<leek-image :leek="leek" :scale="0.4" /><br>
							<div>{{ leek.name }}</div>
							<talent :id="leek.id" :talent="leek.talent" category="leek" />
							<div class="level">{{ $t('main.level_n', [leek.level]) }}</div>
							<v-tooltip>
								<template #activator="{ props }">
									<v-icon v-bind="props" class="arena-pref" size="16">{{ arenaModeIcon(leek.preference) }}</v-icon>
								</template>
								{{ $t('main.' + (ARENA_MODE_LABELS[leek.preference] || 'arena_no_preference')) }}
							</v-tooltip>
						</div>
					</div>
					<div class="arena-popup-count">
						<span class="arena-dot"></span>
						<strong>{{ LeekWars.arena.progress }}</strong> / {{ Arena.MAX_PLAYERS }}
					</div>
					<div v-if="LeekWars.arena.countdown >= 0" class="arena-countdown center">
						{{ $t('main.arena_countdown', [LeekWars.arena.countdown]) }}
					</div>
					<div class="arena-popup-preference">
						<h4>{{ $t('main.arena_preference') }}</h4>
						<lw-radio-group :model-value="$store.state.arenaPreference" inline @update:model-value="changeArenaPreference">
							<lw-radio :label="$t('main.arena_no_preference')" :value="-1" />
							<lw-radio :label="$t('main.arena_mode_br')" :value="0" />
							<lw-radio :label="$t('main.arena_mode_war')" :value="1" />
							<lw-radio :label="$t('main.arena_mode_chest_hunt')" :value="2" />
							<lw-radio :label="$t('main.arena_mode_colossus')" :value="3" />
						</lw-radio-group>
					</div>
					<br>
					<div class="center">
						<v-btn @click="quit"><v-icon>mdi-keyboard-backspace</v-icon>&nbsp;Quitter</v-btn>
					</div>
				</popup>
			</div>
		</div>

		<v-menu v-if="$store.state.farmer?.rewards?.length" location="right" :offset="15" :max-height="500" :close-on-content-click="false">
			<template #activator="{ props }">
				<div v-ripple class="soussous-dans-popoche notif-trophy" v-bind="props">
					<img src="/image/icon/chest.svg">
				</div>
			</template>
			<v-card class="soussous-panel">
				<div class="title">
					<div>
						<h4>{{ $t('main.rewards') }} ({{ $store.state.farmer.rewards.length }})</h4>
						<div>{{ $filters.number($store.state.farmer.rewards.reduce((s: number, r: Reward) => s + r.habs, 0)) }} <span class="hab"></span></div>
					</div>
					<v-btn class="get-all" :class="{ 'notif-trophy': LeekWars.legacyTheme }" @click.stop="retrieveAll()"><span v-if="!LeekWars.mobile">{{ $t('main.retrieve_all') }}</span> <v-icon>mdi-tray-arrow-down</v-icon></v-btn>
				</div>
				<div v-autostopscroll class="soussous-list">
					<template v-for="reward in $store.state.farmer.rewards" :key="reward.trophy">
					<div v-if="TROPHIES[reward.trophy - 1]" class="soussous-item">
						<router-link :to="'/trophy/' + TROPHIES[reward.trophy - 1].code">
							<trophy-icon :code="TROPHIES[reward.trophy - 1].code" />
							{{ $t('trophy.' + TROPHIES[reward.trophy - 1].code) }}
							<div class="spacer"></div>
							<div>{{ $filters.number(reward.habs) }} <span class="hab"></span></div>
						</router-link>
						<v-btn class="get" :class="{ 'notif-trophy': LeekWars.legacyTheme }" @click.stop="retrieve(reward)"><v-icon>mdi-tray-arrow-down</v-icon></v-btn>
					</div>
					</template>
				</div>
			</v-card>
		</v-menu>
	</nav>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import type { Reward } from '@/model/farmer'
	import { store } from '@/model/store'
	import { Arena, ARENA_MODE_LABELS, arenaModeIcon } from '@/model/arena'
	import { BOSSES } from '@/model/boss'
	import { emitter } from '@/model/emitter'
	import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { useRoute, useRouter } from 'vue-router'

	const AccountSwitcher = defineAsyncComponent(() => import('@/component/app/account-switcher.vue'))

	defineOptions({ name: 'LwMenu' })

	const route = useRoute()
	const router = useRouter()

	const arenaDialog = ref(false)
	const accountMenu = ref(false)
	const TROPHIES = LeekWars.trophies

	const isHomePage = computed(() => route.path === '/')
	const rankingURL = computed(() => '/ranking' + (LeekWars.rankingInactive ? '?inactive' : ''))
	const new_leek_condition = computed(() => {
		if (!store.state.farmer!.can_create_leek) {
			return false
		}
		const leeks = store.state.farmer!.leeks
		if (Object.keys(leeks).length === 4) { return false }
		return LeekWars.first(leeks)!.level >= 50
	})

	const W = 250
	let down = false
	let downX = 0, downY = 0
	let menu_visible = false
	let enabled = false
	let aborted = false
	let menu_element: HTMLElement | null = null
	let center_element: HTMLElement | null = null
	let dark_element: HTMLElement | null = null
	let d = 0
	let lastT = 0

	function onPointerDown(e: PointerEvent) {
		// Le swipe n'ouvre le menu en tiroir qu'en mode mobile. Quand le menu
		// normal est déjà affiché en barre latérale (iPad large, desktop), on
		// ignore le geste pour éviter d'animer un tiroir par-dessus.
		if (!LeekWars.mobile) { return }
		downX = e.clientX
		downY = e.clientY
		if (LeekWars.menuExpanded || downX < window.innerWidth / 3) {
			if (!LeekWars.menuExpanded) {
				let el = e.target as HTMLElement | null
				while (el && el !== document.body) {
					const overflowX = getComputedStyle(el).overflowX
					if (el.scrollWidth > el.clientWidth + 1 && el.scrollLeft > 0 && (overflowX === 'auto' || overflowX === 'scroll')) {
						return
					}
					el = el.parentElement
				}
			}
			down = true
			aborted = false
			menu_visible = LeekWars.menuExpanded
		}
	}

	function onTouchMove(e: TouchEvent) {
		if (!down || aborted || !menu_element || !center_element || !dark_element) { return }
		const x = e.touches[0].clientX
		const y = e.touches[0].clientY
		if (!enabled && Math.abs(downY - y) > Math.abs(downX - x)) {
			aborted = true
		}
		if (!enabled && Math.abs(downX - x) > 10 && menu_visible === x < downX) {
			menu_element.style.transition = 'transform ease 50ms'
			center_element.style.transition = 'transform ease 50ms'
			LeekWars.dark = LeekWars.menuExpanded ? 0.6 : 0.001
			enabled = true
		}
		if (Date.now() - lastT < 25) { return }
		lastT = Date.now()
		if (enabled && !aborted) {
			if (menu_visible) {
				d = W - Math.max(0, Math.min(W, downX - x))
			} else {
				d = Math.max(0, Math.min(W, x))
			}
			menu_element.style.transform = 'translateX(' + (-W + d) + 'px)'
			center_element.style.transform = 'translateX(' + d + 'px)'
			dark_element.style.opacity = '' + (0.6 * (d / W))
		}
	}

	function onTouchEnd() {
		if (!down || !enabled || aborted || !menu_element || !center_element) {
			down = false
			return
		}
		const transition = 'transform ease 200ms'
		menu_element.style.transition = transition
		menu_element.style.transform = ''
		center_element.style.transition = transition
		center_element.style.transform = ''
		if (menu_visible) {
			if (d < W / 3) {
				LeekWars.menuExpanded = false
				LeekWars.dark = 0
			}
		} else {
			if (d > W / 3) {
				LeekWars.menuExpanded = true
				LeekWars.dark = 0.6
			} else {
				LeekWars.dark = 0
			}
		}
		down = false
		enabled = false
		aborted = false
	}

	onMounted(() => {
		LeekWars.menuCollapsed = localStorage.getItem('main/menu-collapsed') === 'true'

		menu_element = document.querySelector('.menu') as HTMLElement
		center_element = document.querySelector('.app-center') as HTMLElement
		dark_element = document.querySelector('#app .dark-shadow') as HTMLElement

		window.addEventListener('pointerdown', onPointerDown)
		window.addEventListener('touchmove', onTouchMove, {passive: true})
		document.addEventListener('touchend', onTouchEnd, {passive: true})
	})

	onBeforeUnmount(() => {
		window.removeEventListener('pointerdown', onPointerDown)
		window.removeEventListener('touchmove', onTouchMove)
		document.removeEventListener('touchend', onTouchEnd)
		// reset stale overlay state on HMR
		LeekWars.dark = 0
		LeekWars.menuExpanded = false
	})

	function clickItem() {
		LeekWars.menuExpanded = false
		LeekWars.dark = 0
	}

	watch(() => LeekWars.menuCollapsed, () => {
		localStorage.setItem('main/menu-collapsed', '' + LeekWars.menuCollapsed)
		emitter.emit('resize')
	})

	function quit(e: Event) {
		LeekWars.arena.leave()
		arenaDialog.value = false
		e.stopPropagation()
	}

	function changeArenaPreference(preference: number | null) {
		if (preference === null) return
		// Choix explicite du joueur : on met aussi à jour la préférence durable,
		// pour que la prochaine inscription depuis le potager reparte sur ce mode.
		localStorage.setItem('arena/preference', '' + preference)
		const leek = parseInt(localStorage.getItem('arena-leek') || '', 10)
		if (!leek) return
		const wantsColossus = localStorage.getItem('arena-colossus') === '1'
		LeekWars.arena.register(leek, preference, wantsColossus)
	}

	function changeArenaLeek(leekId: number) {
		if (leekId === registeredLeekId.value) return
		const wantsColossus = localStorage.getItem('arena-colossus') === '1'
		LeekWars.arena.register(leekId, store.state.arenaPreference, wantsColossus)
	}

	const registeredLeekId = computed(() => {
		if (!store.state.farmer) return 0
		for (const id of Object.keys(LeekWars.arena.leeks)) {
			if (+id in store.state.farmer.leeks) return +id
		}
		return 0
	})

	function retrieve(reward: Reward) {
		LeekWars.post('trophy/retrieve-reward', { trophy_id: reward.trophy })
		store.commit('remove-reward', reward.trophy)
		store.commit('update-habs', reward.habs)
	}

	function retrieveAll() {
		LeekWars.post('trophy/retrieve-all-rewards')
		const total = store.state.farmer!.rewards.reduce((s: number, r: Reward) => s + r.habs, 0)
		store.commit('remove-all-rewards')
		store.commit('update-habs', total)
	}

	function goToBoss() {
		if (LeekWars.bossSquads.squad) {
			const path = '/garden/boss/' + BOSSES[LeekWars.bossSquads.squad.boss].name + '/' + LeekWars.bossSquads.squad.id
			if (router.currentRoute.value.path !== path) {
				router.push(path)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.menu {
		width: 170px;
		position: fixed;
		top: 0;
		bottom: 0;
		padding-top: 46px;
		flex-direction: column;
    	align-items: stretch;
		z-index: 1;
	}
	#app.app .menu {
		position: fixed;
		top: 56px;
		left: 0;
		transform: translateX(-250px);
		bottom: 0;
		background: var(--grey-1);
		z-index: 5;
		transition: transform ease 200ms;
		padding: 0;
		width: auto;
		flex-direction: column;
		justify-content: space-between;
	}
	#app.app.menu-expanded .menu {
		transform: translateX(0px);
	}
	.menu-wrapper {
		background: rgba(80, 80, 80, 0.6);
		padding: 12px;
		padding-left: 0;
		/* La liste des entrées est la seule partie du menu qui défile quand
		   l'écran est trop court : le coffre des récompenses, dernier enfant de
		   la colonne, reste ainsi collé en bas au lieu de partir hors de l'écran
		   (le menu est fixé du haut en bas, il ne défile pas avec la page).
		   `min-height: 0` : sans lui un enfant flex refuse de descendre sous la
		   hauteur de son contenu et rien ne défile. */
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: thin;
	}
	.menu.dida .menu-wrapper {
		overflow: visible;
	}
	#app.app .menu-wrapper {
		flex: 1;
	}
	#app.connected .menu {
		display: flex;
	}
	#app.menu-collapsed .menu {
		width: 64px;
	}
	.menu-button {
		background: rgba(80, 80, 80, 0.6);
		width: 30px;
		height: 30px;
		flex: none;
		margin-bottom: 4px;
		cursor: pointer;
		user-select: none;
	}
	.menu-button:hover {
		background: rgba(200, 200, 200, 0.4);
	}
	#app.app .menu-button {
		display: none;
	}
	.menu-button .v-icon {
		color: var(--white);
		font-size: 30px;
	}
	.menu .section {
		height: 40px;
		line-height: 40px;
		position: relative;
		font-weight: 400;
		font-size: 17px;
		color: var(--grey-13);
		white-space: nowrap;
		display: block;
		background: var(--grey-1);
		cursor: pointer;
	}
	.menu a div, .menu .text {
		overflow: hidden;
	}
	.menu .section[label]:after, .awards:after {
		position: absolute;
		background: var(--grey-2);
		right: -10px;
		top: 50%;
		margin-top: -11px;
		content: attr(label);
		color: var(--white);
		border-radius: var(--radius-medium);
		padding: 2px 4px;
		line-height: normal;
		z-index: 2;
		font-size: 16px;
	}
	#app.app .menu .section[label]:after {
		right: 8px;
	}
	.menu .text .right {
		font-size: 14px;
		line-height: 46px;
		position: absolute;
		top: 0;
		right: 8px;
		display: none;
	}
	#app.app .menu .text .right {
		display: block;
	}
	.menu .text .right img {
		width: 18px;
		height: 18px;
		margin: 14px 0;
		margin-right: 4px;
	}
	#app.menu-collapsed .menu .section {
		height: 46px;
	}
	.menu-center .section:not(.router-link-active):hover {
		background: rgba(150, 150, 150, 0.2);
	}
	.menu-center .section.router-link-active {
		background: var(--primary-surface);
		color: var(--primary-surface-text);
		text-shadow: 0px 2px 3px rgba(0, 0, 0, 0.3), 0px 1px 3px rgba(0, 0, 0, 0.3), 0px 2px 6px rgba(0, 0, 0, 0.3);
		&:before {
			content: "";
			position: absolute;
			z-index: 1;
			right: -13px;
			top: 0;
			width: 0;
			height: 0;
			border-style: solid;
			border-width: 40px 13px 0 0;
			border-color: var(--primary) transparent transparent transparent;
		}
	}
	#app.menu-collapsed .menu-center .section {
		.text {
			display: none;
		}
		&.router-link-active:before {
			content: "";
			position: absolute;
			z-index: 1;
			right: -13px;
			top: 0;
			width: 0;
			height: 0;
			border-style: solid;
			border-width: 46px 13px 0 0;
			border-color: var(--primary) transparent transparent transparent;
		}
	}
	.menu-center .section img {
		height: 24px;
		width: 24px;
		float: left;
		margin: 8px;
	}
	/* Icônes colorées du v3 (`public/image/menu/*.svg`) : leur viewBox inclut le
	   contour noir (1 unité de chaque côté, 26 pour un glyphe de 24), donc 22 px
	   pour que le glyphe fasse les 20 px des autres icônes ; la marge négative
	   rend les 2 px à la ligne, qui garde la hauteur des entrées de poireau.
	   Assez spécifique pour passer devant les 20 px du shell, déplié et replié. */
	.menu-center .section img.menu-icon,
	#app.menu-collapsed .menu-center .section img.menu-icon {
		width: 22px;
		height: 22px;
		margin: -1px 0;
	}
	.menu-center .section i {
		float: left;
		margin: 6px;
		font-size: 28px;
		transition: none;
	}
	#app.menu-collapsed .menu-center .section img {
		height: 30px;
		width: 30px;
		margin-left: 10px;
	}
	#app.menu-collapsed .menu-center a.section i {
		font-size: 34px;
		margin-left: 10px;
	}
	.menu .separator {
		height: 12px;
	}
	.menu-top {
		background: var(--grey-2);
		color: var(--grey-13);
	}
	.menu-top a {
		color: var(--grey-13);
	}
	#app.app .menu .top {
		display: flex;
		height: 68px;
	}
	.menu-top .section {
		height: auto;
		width: 100%;
		background: transparent;
	}
	.menu .menu-top .text {
		padding-left: 10px;
	}
	.menu .menu-top .text.farmer-name {
		padding-left: 5px;
		line-height: 39px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}
	.menu .menu-top .farmer-name-row {
		display: flex;
		align-items: center;
		min-width: 0;
	}
	.menu .menu-top .farmer-name-row > a {
		min-width: 0;
	}
	.menu .menu-top .account-switcher-btn {
		margin-left: 2px;
		opacity: 0.7;
	}
	.menu .menu-top .right {
		display: inline-block;
		width: calc(100% - 68px);
		vertical-align: top;
	}
	#app.app .menu .menu-top .moneys {
		display: flex;
		font-size: 12px;
		height: auto;
		line-height: normal;
		overflow: visible;
		margin-top: -4px;
	}
	.menu-top .moneys > * {
		padding: 7px 5px;
		flex: 1;
		display: flex;
		align-items: flex-end;
	}
	.menu-top .moneys div {
		overflow: visible;
	}
	.menu-top .moneys img {
		width: 20px;
		vertical-align: bottom;
	}
	.menu-top .moneys .crystals {
		padding-left: 10px;
	}
	.menu-top .moneys .hab {
		padding-left: 0;
		margin-right: 4px;
	}
	.menu-top .moneys .crystal {
		width: 4px;
		margin-bottom: -6px;
		margin-right: 4px;
		height: 29px;
		background-size: cover;
	}
	.menu-top .farmer-avatar {
		margin: 4px;
		width: 60px;
		height: 60px;
	}
	#app.app .menu .menu-wrapper {
		padding: 0;
		width: 250px;
		overflow-y: auto;
		overflow-x: hidden;
		background: none;
	}
	.menu .section.console {
		display: none;
	}
	#app.app .menu .section.console {
		display: block;
	}
	#app.app .menu .separator {
		display: none;
	}
	.menu [tab="farmer"] {
		display: none;
	}
	#app.app .menu [tab="farmer"] {
		display: block;
	}
	// Héritée du v2, dont les entrées mobiles sont une ligne de 42 px sans surface.
	// Elle s'appliquait aussi au v3, où elle écrasait le `line-height: normal` et le
	// `background` du shell : 60 px de haut pour un libellé de 12,5, et l'entrée
	// active privée de sa surface, réduite à son liseré.
	body.v2 #app.app .menu .section {
		line-height: 42px;
		background: transparent;
	}
	#app.app .menu .section:before {
		display: none;
	}
	// En v3 les marges du mockup (9/16) suffisent à la hauteur ; on n'impose qu'une
	// cible tactile confortable, sous laquelle une entrée de 36 px descendrait.
	body:not(.v2) #app.app .menu .section {
		min-height: 44px;
	}

	/* ====== v3 : le panneau du menu suit le thème ======
	   `--grey-1` (#0E1410) et `--grey-2` (#1E2A20) sont des valeurs FIXES, pas des
	   surfaces de thème : le menu mobile restait donc presque noir en thème clair,
	   alors que le shell v3 avait déjà passé toutes ses encres à celles d'un panneau
	   clair — d'où l'encre sombre sur fond noir. Le panneau prend la surface que le
	   shell donne déjà au menu sur grand écran. */
	body:not(.v2) #app.app .menu {
		background: var(--panel-background);
		border-right: 1.5px solid var(--border-strong);
	}
	/* Le bloc de l'éleveur était l'inverse : surface sombre et encre crème en dur,
	   illisible dès que le panneau s'éclaircit. */
	body:not(.v2) .menu-top {
		background: var(--background-header);
		color: var(--text-color);
		border-bottom: 1px solid var(--border);
	}
	body:not(.v2) .menu-top a {
		color: inherit;
	}
	/* Le bloc de l'éleveur (mobile), retravaillé (Pierre, 2026-09-09 : « cette
	   partie sur mobile est pas très belle ») : l'avatar biseauté, le nom en
	   police d'affichage, et les deux montants en « topstat » comme sur la barre
	   du grand écran — deux boîtes bordées de même largeur, icône devant,
	   chiffres en monospace. Fini les icônes à marges négatives et le chiffre
	   qui flotte au milieu de la ligne. */
	body:not(.v2) #app.app .menu .top {
		height: auto;
	}
	/* Grille à deux lignes : avatar et nom sur la première, les montants sur
	   toute la largeur de la seconde — le tiroir ne fait que 250 px, deux boîtes
	   côte à côte à droite de l'avatar coupaient un montant à dix chiffres.
	   `.right` s'efface (`display: contents`) pour que ses deux lignes soient
	   des éléments de la grille. */
	body:not(.v2) .menu-top .section {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr);
		column-gap: 10px;
		row-gap: 8px;
		align-items: center;
		padding: 10px 12px;
		min-height: 0;
	}
	body:not(.v2) .menu-top .farmer-avatar {
		margin: 0;
		width: 44px;
		height: 44px;
		display: block;
	}
	body:not(.v2) .menu .menu-top .right {
		display: contents;
	}
	body:not(.v2) .menu .menu-top .farmer-name-row {
		min-width: 0;
	}
	body:not(.v2) .menu .menu-top .text.farmer-name {
		padding: 0;
		line-height: 1.2;
		font-family: var(--font-display);
		letter-spacing: var(--font-display-tracking);
		font-weight: var(--font-display-weight);
		font-size: 15px;
	}
	body:not(.v2) .menu .menu-top .account-switcher-btn {
		opacity: 1;
		color: var(--text-color-secondary);
	}
	body:not(.v2) #app.app .menu .menu-top .moneys {
		grid-column: 1 / -1;
		margin: 0;
		gap: 6px;
		font-size: 12.5px;
	}
	body:not(.v2) .menu-top .moneys > * {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 6px;
		height: 30px;
		padding: 0 8px;
		border: 1px solid var(--border);
		background: var(--header-button-background);
		font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', monospace;
		font-weight: 600;
		letter-spacing: 0.02em;
		overflow: hidden;
		white-space: nowrap;
	}
	/* Les habs, à dix chiffres, prennent la place ; les cristaux se contentent
	   de la leur. */
	body:not(.v2) .menu-top .moneys > .crystals {
		flex: 0 0 auto;
		/* L'`overflow: hidden` de la boîte, posé pour les habs à dix chiffres,
		   rognait les deux pointes du cristal. L'ellipse du montant tient sur le
		   span, pas sur la boîte. */
		overflow: visible;
	}
	body:not(.v2) .menu-top .moneys .farmer-habs,
	body:not(.v2) .menu-top .moneys .farmer-crystals {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	body:not(.v2) .menu-top .moneys .hab {
		width: 18px;
		height: 18px;
		margin: 0;
		flex: 0 0 auto;
		background-size: contain;
	}
	/* Le cristal dépasse de la boîte en haut et en bas, comme sur la barre du
	   grand écran : c'est sa signature. */
	body:not(.v2) .menu-top .moneys .crystal {
		width: 16px;
		height: 38px;
		margin: 0;
		flex: 0 0 auto;
		background-size: contain;
		background-position: center;
	}
	.menu .section.about {
		display: none;
	}
	#app.app .menu .section.about {
		display: block;
	}

	.progress-bar {
		height: 3px;
		background: var(--primary-surface);
		transition: width ease 500ms;
		margin-top: -3px;
	}
	.br-leeks {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		align-items: baseline;

		.leek {
			position: relative;
			text-align: center;
			font-size: 15px;
			font-weight: 500;
			margin: 0 3px;
		}
		.arena-pref {
			position: absolute;
			top: 2px;
			right: 2px;
			font-size: 14px;
		}
		.talent {
			margin: 2px 0;
		}
		.header {
			background: var(--panel-header-background);
			color: var(--white);
			display: flex;
			border-top-left-radius: var(--radius-medium);
			border-top-right-radius: var(--radius-medium);
			user-select: none;
			cursor: pointer;
			.title {
				padding: 10px;
				font-size: 18px;
				flex: 1;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.v-icon {
				color: var(--white);
				padding: 0;
				margin-right: 2px;
				margin-bottom: 1px;
			}
			.close {
				padding: 8px;
			}
		}
	}
	.arena-popup-count {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 22px;
		margin-top: 12px;
		strong {
			color: var(--primary);
			font-weight: 700;
		}
	}
	.arena-dot {
		display: inline-block;
		position: relative;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--primary-surface);
	}
	// v3 : le témoin et son halo pulsé sont carrés (principe 2, audit du 2026-09-08).
	body:not(.v2) .arena-dot,
	body:not(.v2) .arena-dot::after {
		border-radius: 0;
	}
	// Halo pulsé via un pseudo-élément animé en transform/opacity (compositables
	// GPU, aucun repaint). L'ancienne version animait box-shadow, ce qui forçait
	// un repaint à chaque frame et faisait chauffer un cœur de CPU à 100% (#11920).
	.arena-dot::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: rgba(95, 173, 27, 0.6);
		animation: arena-pulse 2s infinite;
		pointer-events: none;
	}
	@keyframes arena-pulse {
		0% { transform: scale(1); opacity: 0.6; }
		70% { transform: scale(3); opacity: 0; }
		100% { transform: scale(3); opacity: 0; }
	}
	.arena-popup-my-leeks {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px;
		margin-bottom: 24px;
		.my-leek {
			width: 80px;
			padding: 4px;
			border: 1px solid var(--border);
			border-radius: var(--radius);
			text-align: center;
			cursor: pointer;
			opacity: 0.45;
			transition: opacity 150ms, background-color 150ms;
			&:hover:not(.disabled) {
				opacity: 1;
				background: var(--pure-white);
			}
			&.selected {
				opacity: 1;
				border-color: var(--primary);
				background: var(--pure-white);
			}
			&.disabled {
				opacity: 0.2;
				cursor: not-allowed;
			}
			.name {
				font-size: 13px;
				font-weight: 500;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			:deep(svg) {
				max-height: 60px;
			}
		}
	}
	.arena-popup-preference {
		margin-top: 14px;
		text-align: center;
		h4 {
			color: var(--text-color-secondary);
			margin-bottom: 4px;
		}
		:deep(.lw-radio-group) {
			justify-content: center;
		}
	}
	.soussous-dans-popoche {
		padding: 10px;
		border-radius: var(--radius);
		cursor: pointer;
		display: inline-block;
		margin: 15px;
		position: relative;
		align-self: flex-start;
		/* Il ne se comprime jamais : c'est la liste au-dessus qui cède et défile. */
		flex: none;
		img {
			width: 42px;
			height: 42px;
			vertical-align: bottom;
		}
	}
	#app.app .awards {
		margin: 10px;
	}
	.awards:after {
		top: 0;
		background: var(--primary-surface);
		display: none;
	}
	#app.menu-collapsed .awards {
		margin-left: 0;
	}
	.get-all {
		font-weight: 500;
		img {
			margin-left: 8px;
		}
		.v-icon {
			margin-left: 8px;
		}
	}
	/* v3 : les deux boutons de récupération portaient `notif-trophy`, la peau
	   d'une RANGÉE de notification appliquée à des boutons — un aplat d'or par
	   ligne, soit soixante-cinq carrés moutarde dans une liste de récompenses
	   (Pierre, 2026-09-10 : « les boutons jaunes sont pas très beaux »). L'or
	   reste ce qui identifie le coffre et ses notifications ; les boutons
	   parlent la langue du thème : vert pour l'action principale, trait discret
	   pour les récupérations ligne à ligne, qui s'allume au survol.
	   La classe reste posée en v2 (`legacyTheme`), où le doré est d'origine. */
	body:not(.v2) .soussous-panel {
		.get-all {
			background: var(--primary-surface);
			color: var(--primary-surface-text);
			border: 1px solid var(--primary);
		}
		.get {
			background: var(--background-secondary);
			color: var(--text-color-secondary);
			border: 1px solid var(--border-strong);
			&:hover {
				background: var(--background-row);
				border-color: var(--primary);
				color: var(--primary);
			}
		}
	}
	.soussous-panel {
		max-width: calc(100vw - 24px);
		.title {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 10px;
			background: var(--panel-header-background);
			// L'encre de l'en-tête, et pas `--white` : le v2 gardait tous ses
			// en-têtes de panneau sombres, le v3 en fait une surface claire en
			// thème clair — le titre et le montant y disparaissaient. Le jeton
			// vaut #eee en v2, donc rien ne bouge pour l'ancien design.
			color: var(--panel-header-color);
			h4 {
				color: var(--panel-header-color);
				margin-bottom: 5px;
			}
		}
		.soussous-list {
			max-height: 315px;
			width: 450px;
			max-width: calc(100vw - 24px);
			overflow-y: scroll;
			.soussous-item {
				display: flex;
				align-items: center;
				padding: 4px 8px;
				gap: 8px;
				font-weight: 500;
				a {
					flex: 1;
					min-width: 0;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				& > a > img {
					width: 34px;
					height: 34px;
					object-fit: contain;
					flex-shrink: 0;
				}
				.v-btn {
					padding: 0;
					width: 40px;
					min-width: 40px;
				}
			}
		}
	}
	#app.app .soussous-panel .soussous-list {
		width: auto;
		max-width: 350px;
	}
</style>
