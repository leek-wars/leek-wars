<template lang="html">
	<div class="menu">

		<div v-if="!LeekWars.mobile" class="menu-button" @click="LeekWars.menuCollapsed = !LeekWars.menuCollapsed">
			<v-icon v-if="LeekWars.menuCollapsed">mdi-chevron-right</v-icon>
			<v-icon v-else>mdi-chevron-left</v-icon>
		</div>

		<div class="menu-wrapper">

			<div v-if="LeekWars.mobile" class="menu-top">
				<div class="top">
					<div class="section">
						<router-link to="/farmer" @click.native="clickItem">
							<avatar :farmer="$store.state.farmer" class="farmer-avatar" />
						</router-link>
						<div class="right">
							<router-link to="/farmer" @click.native="clickItem">
								<div v-if="$store.state.farmer" v-ripple class="text farmer-name">{{ $store.state.farmer.name }}</div>
							</router-link>
							<div class="moneys">
								<router-link v-ripple to="/market" @click.native="clickItem">
									<span class="hab text"></span><span v-if="$store.state.farmer" class="farmer-habs">{{ $store.state.farmer.habs | number }}</span>
								</router-link>
								<router-link v-ripple class="crystals" to="/bank" @click.native="clickItem">
									<span class="crystal text"></span><span v-if="$store.state.farmer" class="farmer-crystals">{{ $store.state.farmer.crystals | number }}</span>
								</router-link>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="menu-center">
				<span v-if="$store.state.farmer && $store.state.farmer.leeks" class="leeks">
					<span v-for="(leek, key, i) in $store.state.farmer.leeks" :key="leek.id" class="dida-element">
						<router-link v-ripple :to="{ name: 'leek', params: { id: leek.id }}" :label="($store.state.farmer.equipment_enabled ? leek.capital : 0) || null" :class="{'router-link-active': i == 0 && isHomePage, bouncing: LeekWars.didactitial_step === 1 && i === 0 && !(isHomePage || $route.path === '/leek/' + leek.id)}" class="section">
							<div :leek="leek.id" :tab="'leek-' + leek.id" @click="clickItem">
								<img src="/image/icon/house.png">
								<div class="text">{{ leek.name }}</div>
							</div>
						</router-link>
						<span v-if="LeekWars.didactitial_step === 1 && i === 0 && !(isHomePage || $route.path === '/leek/' + leek.id)" class="dida-hint right">
							<i18n class="bubble" path="main.dida_2">
								<img height=18 src="/image/charac/life.png" slot="life">
								<img height=18 src="/image/charac/strength.png" slot="strength">
							</i18n>
							<span class="arrow"></span>
						</span>
					</span>
					<router-link v-if="new_leek_condition" v-ripple to="/new-leek" class="section">
						<v-icon>mdi-plus</v-icon>
						<div class="text">{{ $t('main.add_leek') }}</div>
					</router-link>
				</span>

				<div v-if="$store.state.farmer && $store.state.farmer.leeks" class="separator"></div>

				<span class="dida-element">
					<router-link v-ripple to="/editor" class="section" :class="{bouncing: LeekWars.didactitial_step === 4 && !$route.path.startsWith('/editor')}" @click.native="clickItem">
						<v-icon>mdi-code-braces</v-icon>
						<div class="text">{{ $t("main.editor") }}</div>
					</router-link>
					<span v-if="LeekWars.didactitial_step === 4 && !$route.path.startsWith('/editor')" class="dida-hint right">
						<span class="bubble" v-html="$t('main.dida_7')"></span>
						<span class="arrow"></span>
					</span>
				</span>

				<!-- <router-link to='/console'>
					<img src='/image/console.png'>
					<div class='text'>{{ $t("main.console") }}</div>
				</router-link> -->

				<span class="dida-element">
					<router-link v-ripple to="/garden" class="section" :class="{bouncing: LeekWars.didactitial_step === 2 && !$route.path.startsWith('/garden')}" :label="$store.state.farmer ? ($store.state.farmer.fights + ($store.state.farmer.team_fights ? '+' + $store.state.farmer.team_fights : '')) : null" @click.native="clickItem">
						<img src="/image/icon/garden.png">
						<div class="text">{{ $t("main.garden") }}</div>
					</router-link>
					<span v-if="LeekWars.didactitial_step === 2 && !$route.path.startsWith('/garden')" class="dida-hint right">
						<span class="bubble" v-html="$t('main.dida_3')"></span>
						<span class="arrow"></span>
					</span>
				</span>

				<router-link v-ripple to="/market" class="section" @click.native="clickItem">
					<img src="/image/icon/market.png">
					<div class="text">{{ $t("main.market") }}</div>
				</router-link>

				<router-link v-if="$store.state.farmer && $store.state.farmer.team" v-ripple to="/team" class="section" @click.native="clickItem">
					<img src="/image/icon/team.png">
					<div class="text">{{ $t('main.team') }}</div>
				</router-link>

				<router-link v-if="$store.state.farmer && $store.state.farmer.trophies" v-ripple to="/trophies" class="section" @click.native="clickItem">
					<img src="/image/icon/trophy.png">
					<div class="text">{{ $t("main.trophies") }}</div>
				</router-link>

				<router-link v-ripple :to="rankingURL" class="section" @click.native="clickItem">
					<img src="/image/icon/ranking.png">
					<div class="text">{{ $t("main.ranking") }}</div>
				</router-link>

				<router-link v-ripple to="/help" class="section" @click.native="clickItem">
					<v-icon>mdi-help-circle-outline</v-icon>
					<div class="text">{{ $t("main.help") }}</div>
				</router-link>

				<router-link v-if="env.SOCIAL" v-ripple to="/forum" class="section" @click.native="clickItem">
					<img src="/image/icon/forum.png">
					<div class="text">{{ $t("main.forum") }}</div>
				</router-link>

				<router-link v-if="$store.state.farmer && $store.state.farmer.group" v-ripple :to="'/group/' + $store.state.farmer.group.id" class="section" @click.native="clickItem">
					<v-icon>mdi-account-group</v-icon>
					<div class="text">{{ $store.state.farmer.group.name }}</div>
				</router-link>

				<router-link v-if="$store.getters.moderator" v-ripple :label="$store.state.farmer.reportings || null" to="/moderation" class="section" tab="moderation" @click.native="clickItem">
					<v-icon>mdi-gavel</v-icon>
					<div class="text">{{ $t('main.moderation') }}</div>
				</router-link>

				<router-link v-if="$store.getters.admin" v-ripple :label="$store.state.farmer.errors || null" to="/admin" class="section" tab="admin" @click.native="clickItem">
					<v-icon>mdi-security</v-icon>
					<div class="text">{{ $t('main.admin') }}</div>
				</router-link>

				<div v-if="LeekWars.battleRoyale.enabled || LeekWars.bossSquads.squad" class="separator"></div>

				<span v-if="LeekWars.battleRoyale.enabled" v-ripple :label="LeekWars.battleRoyale.progress" class="section" @click="battleRoyaleDialog = !battleRoyaleDialog">
					<v-icon>mdi-sword-cross</v-icon>
					<div class="text">{{ $t('main.battle_royale') }}</div>
					<div class="progress-bar" :style="{width: (LeekWars.battleRoyale.progress * 10) + '%'}"></div>
				</span>
				<span v-if="LeekWars.bossSquads.squad" v-ripple :label="LeekWars.bossSquads.squad.engaged_count" class="section boss" @click="$router.push('/garden/boss/' + BOSSES[LeekWars.bossSquads.squad.boss].name + '/' + LeekWars.bossSquads.squad.id)">
					<v-icon>mdi-crown</v-icon>
					<div class="text">{{ $t('entity.' + BOSSES[LeekWars.bossSquads.squad.boss].name) }}</div>
					<div class="progress-bar" :style="{width: (100 * LeekWars.bossSquads.squad.engaged_count / 8) + '%'}"></div>
				</span>

				<popup v-model="battleRoyaleDialog" :width="600">
					<v-icon slot="icon">mdi-sword-cross</v-icon>
					<template slot="title">{{ $t('main.battle_royale') }}</template>
					<loader v-if="LeekWars.battleRoyale.progress == 0" />
					<div class="br-leeks">
						<div v-for="leek in LeekWars.battleRoyale.leeks" :key="leek.id" class="leek">
							<leek-image :leek="leek" :scale="0.4" /><br>
							<div>{{ leek.name }}</div>
							<talent :id="leek.id" :talent="leek.talent" category="leek" />
							<div class="level">{{ $t('main.level_n', [leek.level]) }}</div>
						</div>
					</div>
					<br>
					<center>
						<v-btn @click="quit"><v-icon>mdi-keyboard-backspace</v-icon>&nbsp;Quitter</v-btn>
					</center>
				</popup>
			</div>
		</div>

		<v-menu v-if="$store.state.farmer && $store.state.farmer.rewards.length" offset-x :nudge-right="15" :max-height="500" :close-on-content-click="false">
			<template v-slot:activator="{ on }">
				<div v-ripple class="rewards-button notif-trophy" v-on="on">
					<img src="/image/icon/chest.svg">
				</div>
			</template>
			<div class="reward-dialog">
				<div class="title">
					<div>
						<h4>{{ $t('main.rewards') }} ({{ $store.state.farmer.rewards.length }})</h4>
						<div>{{ $store.state.farmer.rewards.reduce((s, r) => s + r.habs, 0) | number }} <span class="hab"></span></div>
					</div>
					<v-btn class="get-all notif-trophy" @click.stop="retrieveAll()"><span v-if="!LeekWars.mobile">{{ $t('main.retrieve_all') }}</span> <img src="/image/icon/black/arrow-down-right-bold.svg"></v-btn>
				</div>
				<div v-autostopscroll class="rewards">
					<div v-for="reward in $store.state.farmer.rewards" :key="reward.trophy" class="reward">
						<router-link :to="'/trophy/' + TROPHIES[reward.trophy - 1].code">
							<img :src="'/image/trophy/' + TROPHIES[reward.trophy - 1].code + '.svg'">
							{{ $t('trophy.' + TROPHIES[reward.trophy - 1].code) }}
							<div class="spacer"></div>
							<div>{{ reward.habs | number }} <span class="hab"></span></div>
						</router-link>
						<v-btn class="get notif-trophy" @click.stop="retrieve(reward)"><img src="/image/icon/arrow-down-right-bold.svg"></v-btn>
					</div>
				</div>
			</div>
		</v-menu>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import { TROPHIES } from '@/model/trophies'
	import { BOSSES } from '@/model/boss'

	@Component({
		name: 'lw-menu'
	})
	export default class Menu extends Vue {

		battleRoyaleDialog: boolean = false
		TROPHIES = TROPHIES
		BOSSES = BOSSES

		get isHomePage() {
			return this.$route.path === '/'
		}
		get rankingURL() {
			return '/ranking' + (LeekWars.rankingInactive ? '?inactive' : '')
		}
		get new_leek_condition() {
			if (!store.state.farmer!.can_create_leek) {
				return false
			}
			const leeks = store.state.farmer!.leeks
			if (Object.keys(leeks).length === 4) { return false }
			return LeekWars.first(leeks)!.level >= 50
		}

		mounted() {
			LeekWars.menuCollapsed = localStorage.getItem('main/menu-collapsed') === 'true'

			const W = 250
			let down = false
			let downX = 0, downY = 0
			let menu_visible = false
			let enabled = false
			let aborted = false
			const menu_element = document.querySelector('.menu') as HTMLElement
			const center_element = document.querySelector('.app-center') as HTMLElement
			const dark_element = document.querySelector('#app .dark') as HTMLElement
			let d = 0
			let lastT = 0

			window.addEventListener('pointerdown', (e) => {
				downX = e.clientX
				downY = e.clientY
				if (LeekWars.menuExpanded || downX < window.innerWidth / 3) {
					down = true
					aborted = false
					menu_visible = LeekWars.menuExpanded
				}
			})

			window.addEventListener('touchmove', (e) => {
				if (!down || aborted) { return }
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
			}, {passive: true})

			document.addEventListener('touchend', (e) => {
				if (!down || !enabled || aborted) { return }
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
			}, {passive: true})
		}

		clickItem() {
			LeekWars.menuExpanded = false
			LeekWars.dark = 0
		}

		@Watch('LeekWars.menuCollapsed')
		update() {
			localStorage.setItem('main/menu-collapsed', '' + LeekWars.menuCollapsed)
			this.$root.$emit('resize')
		}

		quit(e: Event) {
			LeekWars.battleRoyale.leave()
			this.battleRoyaleDialog = false
			e.stopPropagation()
		}

		retrieve(reward: any) {
			LeekWars.post('trophy/retrieve-reward', { trophy_id: reward.trophy })
			store.commit('remove-reward', reward.trophy)
			store.commit('update-habs', reward.habs)
		}

		retrieveAll() {
			LeekWars.post('trophy/retrieve-all-rewards')
			const total = store.state.farmer!.rewards.reduce((s, r) => s + r.habs, 0)
			store.commit('remove-all-rewards')
			store.commit('update-habs', total)
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
		background: #222;
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
		color: white;
		font-size: 30px;
	}
	.menu .section {
		height: 40px;
		line-height: 40px;
		position: relative;
		font-weight: 400;
		font-size: 17px;
		color: #eee;
		white-space: nowrap;
		display: block;
		background: #222;
		cursor: pointer;
	}
	.menu a div, .menu .text {
		overflow: hidden;
	}
	.menu .section[label]:after, .awards:after {
		position: absolute;
		background: #333;
		right: -10px;
		top: 50%;
		margin-top: -11px;
		content: attr(label);
		color: white;
		border-radius: 5px;
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
		background: #5fad1b;
		color: white;
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
			border-color: #5fad1b transparent transparent transparent;
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
			border-color: #5fad1b transparent transparent transparent;
		}
	}
	.menu-center .section img {
		height: 24px;
		width: 24px;
		float: left;
		margin: 8px;
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
		background: #333;
		color: #eee;
	}
	.menu-top a {
		color: #eee;
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
	#app.app .menu .section {
		line-height: 42px;
		background: transparent;
		&:before {
			display: none;
		}
	}
	.menu .section.about {
		display: none;
	}
	#app.app .menu .section.about {
		display: block;
	}

	.progress-bar {
		height: 3px;
		background: #5fad1b;
		transition: width ease 500ms;
		margin-top: -3px;
	}
	.br-leeks {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		align-items: baseline;

		.leek {
			text-align: center;
			font-size: 15px;
			font-weight: 500;
			margin: 0 3px;
		}
		.talent {
			margin: 2px 0;
		}
		.header {
			background: #2a2a2a;
			color: white;
			display: flex;
			border-top-left-radius: 6px;
			border-top-right-radius: 6px;
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
				color: white;
				padding: 0;
				margin-right: 2px;
				margin-bottom: 1px;
			}
			.close {
				padding: 8px;
			}
		}
	}
	.rewards-button {
		padding: 10px;
		border-radius: 4px;
		cursor: pointer;
		display: inline-block;
		margin: 15px;
		position: relative;
		align-self: flex-start;
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
		background: #5fad1b;
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
	}
	.reward-dialog {
		.title {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 10px;
			background: #2a2a2a;
			color: white;
			h4 {
				color: white;
				margin-bottom: 5px;
			}
		}
		.rewards {
			max-height: 315px;
			width: 450px;
			overflow-y: scroll;
			.reward {
				display: flex;
				align-items: center;
				padding: 4px 8px;
				gap: 8px;
				font-weight: 500;
				a {
					flex: 1;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				& > a > img {
					width: 34px;
				}
				.v-btn {
					padding: 0;
					width: 40px;
					min-width: 40px;
				}
			}
		}
	}
	#app.app .reward-dialog .rewards {
		width: auto;
		max-width: 350px;
	}
</style>
