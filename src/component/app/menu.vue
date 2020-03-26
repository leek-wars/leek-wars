<template lang="html">
	<div class="menu">

		<div v-if="!LeekWars.mobile" class="menu-button" @click="LeekWars.menuCollapsed = !LeekWars.menuCollapsed">
			<v-icon v-if="LeekWars.menuCollapsed">mdi-chevron-left</v-icon>
			<v-icon v-else>mdi-chevron-right</v-icon>
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
					<router-link v-for="(leek, key, i) in $store.state.farmer.leeks" :key="leek.id" v-ripple :to="{ name: 'leek', params: { id: leek.id }}" :label="leek.capital || null" :class="{'router-link-active': i == 0 && isHomePage}" class="section">
						<div :leek="leek.id" :tab="'leek-' + leek.id" @click="clickItem">
							<img src="/image/icon/house.png">
							<div class="text">{{ leek.name }}</div>
						</div>
					</router-link>
					<router-link v-if="Object.keys($store.state.farmer.leeks).length < 4" v-ripple to="/new-leek" class="section">
						<v-icon>mdi-add</v-icon>
						<div class="text">{{ $t('main.add_leek') }}</div>
					</router-link>
				</span>

				<div v-if="$store.state.farmer && $store.state.farmer.leeks" class="separator"></div>

				<router-link v-ripple to="/editor" class="section" @click.native="clickItem">
					<v-icon>mdi-code-braces</v-icon>
					<div class="text">{{ $t("main.editor") }}</div>
				</router-link>

				<!-- <router-link to='/console'>
					<img src='/image/console.png'>
					<div class='text'>{{ $t("main.console") }}</div>
				</router-link> -->

				<router-link v-ripple to="/garden" class="section" :label="($store.state.farmer && $store.state.farmer.fights) || null" @click.native="clickItem">
					<img src="/image/icon/garden.png">
					<div class="text">{{ $t("main.garden") }}
						<span class="right">
							<img src="/image/icon/garden.png">
						</span>
					</div>
				</router-link>

				<router-link v-ripple to="/market" class="section" @click.native="clickItem">
					<img src="/image/icon/market.png">
					<div class="text">{{ $t("main.market") }}</div>
				</router-link>

				<router-link v-if="$store.state.farmer && $store.state.farmer.team" v-ripple to="/team" class="section" @click.native="clickItem">
					<img src="/image/icon/team.png">
					<div class="text">{{ $t('main.team') }}</div>
				</router-link>

				<router-link v-ripple to="/trophies" class="section" @click.native="clickItem">
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

				<router-link v-if="$store.getters.moderator" v-ripple :label="$store.state.farmer.reportings || null" to="/moderation" class="section" tab="moderation" @click.native="clickItem">
					<v-icon>mdi-gavel</v-icon>
					<div class="text">{{ $t('main.moderation') }}</div>
				</router-link>

				<router-link v-if="$store.getters.admin" v-ripple to="/admin" class="section" tab="admin" @click.native="clickItem">
					<v-icon>mdi-security</v-icon>
					<div class="text">{{ $t('main.admin') }}</div>
				</router-link>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	@Component({
		name: 'lw-menu'
	})
	export default class Menu extends Vue {
		get isHomePage() {
			return this.$route.path === '/'
		}
		get rankingURL() {
			return '/ranking' + (LeekWars.rankingActive ? '/active' : '')
		}
		mounted() {
			LeekWars.menuCollapsed = localStorage.getItem('main/menu-collapsed') === 'true'
			setTimeout(() => {
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
					if (LeekWars.menuExpanded || downX < window.innerWidth / 2) {
						down = true
						aborted = false
						menu_visible = LeekWars.menuExpanded
					}
				})
				window.addEventListener('touchmove', (e) => {
					if (!down || aborted) { return }
					const x = e.touches[0].clientX
					const y = e.touches[0].clientY
					if (!enabled && Math.abs(downY - y) > 5) {
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
						if (menu_visible) {
							d = W - Math.max(0, Math.min(W, downX - x))
						} else {
							d = Math.max(0, Math.min(W, x - downX))
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
						if (d < W / 2) {
							LeekWars.menuExpanded = false
							LeekWars.dark = 0
						}
					} else {
						if (d > W / 2) {
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
			}, 800)
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
	}
</script>

<style lang="scss" scoped>
	.menu {
		width: 170px;
		position: fixed;
		top: 0;
		bottom: 0;
		padding-top: 46px;
	}
	#app.app .menu {
		position: fixed;
		top: 56px;
		left: 0;
		transform: translateX(-250px);
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 5;
		transition: transform ease 200ms;
		padding: 0;
		width: auto;
	}
	#app.app.menu-expanded .menu {
		transform: translateX(0px);
	}
	.menu-wrapper {
		background: rgba(80, 80, 80, 0.6);
		padding: 12px;
		padding-left: 0;
	}
	#app.connected .menu {
		display: block;
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
	}
	.menu a div {
		overflow: hidden;
	}
	.menu .section[label]:after {
		position: absolute;
		background: #333;
		right: -10px;
		top: 50%;
		margin-top: -11px;
		content: attr(label);
		color: white;
		border-radius: 5px;
		padding: 1px 5px;
		line-height: normal;
		z-index: 2;
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
	#app.menu-collapsed .menu a {
		height: 46px;
	}
	.menu-center a:not(.router-link-active):hover {
		background: rgba(150, 150, 150, 0.2);
	}
	.menu-center a.router-link-active {
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
	#app.menu-collapsed .menu-center a {
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
	.menu-center a img {
		height: 24px;
		width: 24px;
		float: left;
		margin: 8px;
	}
	.menu-center a i {
		float: left;
		margin: 6px;
		font-size: 28px;
	}
	#app.menu-collapsed .menu-center a img {
		height: 30px;
		width: 30px;
		margin-left: 10px;
	}
	#app.menu-collapsed .menu-center a i {
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
		background: #222;
		width: 250px;
		overflow-y: auto;
		height: 100%;
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
	}
	.menu .section.about {
		display: none;
	}
	#app.app .menu .section.about {
		display: block;
	}
</style>
