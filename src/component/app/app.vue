<template>
	<div id="app" :class="{ connected: $store.state.connected, app: LeekWars.mobile, 'social-collapsed': LeekWars.socialCollapsed, 'menu-expanded': LeekWars.menuExpanded, sfw: LeekWars.sfw, dark: LeekWars.darkMode, 'menu-collapsed': !LeekWars.mobile && LeekWars.menuCollapsed, beta: env.BETA, lightbar: LeekWars.lightBar }" data-app="true" @mousemove="mousemove" @mouseup="mouseup">
		<v-theme-provider root>
			<div class="v-application--wrap">
				<div :class="{visible: LeekWars.dark > 0}" :style="{opacity: LeekWars.dark}" class="dark-shadow" @click="darkClick"></div>

				<div class="requests">{{ LeekWars.requests }} <v-btn x-small @click="LeekWars.requests = 0">reset</v-btn></div>

				<lw-menu v-if="$store.state.connected" />

				<div class="console-button" @click="leekscriptConsole">
					<img src="/image/console.png">
				</div>
				<div v-if="console" :style="{top: consoleY + 'px', left: consoleX + 'px'}" class="console v-dialog draggable">
					<div class="title" @mousedown="consoleMouseDown">
						Console LeekScript
						<div class="spacer"></div>
						<div class="options">
							<div class="option" @click="consoleRandom"><img src="/image/icon/dice.png"></div>
							<div class="option" @click="consolePopup"><v-icon>mdi-open-in-new</v-icon></div>
							<div class="option" @click="consoleClose"><v-icon>mdi-close</v-icon></div>
						</div>
					</div>
					<console ref="console" />
				</div>

				<lw-bar v-if="LeekWars.mobile" />

				<div class="app-center">
					<div :class="{large: LeekWars.large || LeekWars.flex, flex: LeekWars.flex, box: LeekWars.box}" class="app-wrapper">
						<lw-header v-if="!LeekWars.mobile || !$store.state.connected" />
						<div class="page-wrapper">
							<router-view />
						</div>
						<lw-footer v-if="LeekWars.footer" />
					</div>
				</div>

				<div v-if="!LeekWars.mobile" class="big-leeks" :class="{flex: LeekWars.flex || LeekWars.large, hidden: LeekWars.didactitial}">
					<div class="wrapper">
						<img class="big-leek-1" :src="LeekWars.leekTheme ? '/image/big_leek_1_white.webp' : '/image/big_leek_1.webp'">
						<img class="big-leek-2" :src="LeekWars.leekTheme ? '/image/big_leek_2_white.webp' : '/image/big_leek_2.webp'">
					</div>
				</div>

				<lw-social v-if="$store.state.connected" />

				<chats v-if="!LeekWars.mobile && $store.state.connected" />
				<squares v-if="$store.state.connected" />
				<mobile-br v-if="LeekWars.mobile && $store.state.connected" />

				<div class="toasts"></div>

				<div v-if="verifyMessage && $store.state.farmer && !$store.state.farmer.verified" class="finish-register">
					<div class="message">
						<v-icon>mdi-account-plus</v-icon>
						{{ $t('main.verify_message') }} <router-link class="green-link" to="/settings">{{ $t('main.verify_info') }}</router-link>
						<v-icon @click="verifyMessage = false">mdi-close</v-icon>
					</div>
				</div>

				<img v-if="LeekWars.clover" :style="{top: LeekWars.cloverTop + 'px', left: LeekWars.cloverLeft + 'px'}" class="clover" src="/image/clover.png" @click="clickClover">

				<!-- <didactitiel v-if="didactitiel_enabled" v-model="didactitiel" /> -->

				<didactitiel-new v-if="LeekWars.didactitial" />

				<changelog-dialog v-model="changelogDialog" :changelog="changelog" />

				<popup v-model="LeekWars.messagePopup" :width="500">
					<template slot="title">
						<v-icon>mdi-information-outline</v-icon>
						{{ LeekWars.message ? $i18n.t(LeekWars.message.title) : '...' }}
					</template>
					<div v-if="LeekWars.message" v-html="$i18n.t(LeekWars.message.message, LeekWars.message.arguments)"></div>
				</popup>

				<!-- <popup v-model="annonce" :width="800">
					<template slot="title"><v-icon>mdi-bullhorn-outline</v-icon> Annonce !</template>
					<div class="annonce">
						<h2>Concours pour le lancement des Boss</h2>
						<div class="annonce-message">
							<br>
							En vue de la 2.40, je vous propose un petit concours avec des trophées à la clé.
							<br><br>
							Devinez les 3 futurs Boss de Leek Wars ! Vous avez jusqu'au 2 décembre.
							<br><br>
							Lien du sondage : <v-btn>
								<a href="https://strawpoll.com/xVg7jVk6Knr">https://strawpoll.com/xVg7jVk6Knr</a>
							</v-btn>
							<br><br>
							<img src="/image/boss_poll.png" width="100%">
							<br><br>
							Indiquez votre pseudo Leek Wars pour répondre.
							<br><br>
							Bonne chance !
						</div>
					</div>
				</popup> -->

				<!-- <popup v-model="annonce" :width="800">
					<template slot="title"><v-icon>mdi-bullhorn-outline</v-icon> Annonce !</template>
					<div class="annonce">
						<h2>Lancement de la boutique Leek Wars</h2>
						<div class="annonce-message">
							<br>
							<a href="https://leek-wars.myspreadshop.fr/"><img src="/image/shop/shop.webp" width="100%"></a>
							<br>
							<br>
							Lien de la boutique : <v-btn>
								<a href="https://leek-wars.myspreadshop.fr/">https://leek-wars.myspreadshop.fr</a>
							</v-btn>
							<br><br>
							Sujet forum : <v-btn>
								<router-link to="/forum/category-6/topic-10939">https://leekwars.com/forum/category-6/topic-10939</router-link>
							</v-btn>
						</div>
					</div>
				</popup> -->

				<!--
				<popup v-model="annonce" :width="500">
					<template slot="title"><v-icon>mdi-bullhorn-outline</v-icon> Annonce de concours !</template>
					<div class="annonce">
						<h2>Reverse-Engineering : LW101</h2>
						<h4>Examen pratique</h4>
						<br>
						Organisé par <rich-tooltip-farmer :id="50023" v-slot="{ on }" :bottom="true">
							<avatar :farmer="{id: 50023, avatar_changed: 12}" />
							<b v-on="on">Oimat</b>
						</rich-tooltip-farmer>
						<div class="annonce-message">
							<br>
							Zplop les poireaux ! <s>Et les bulbes.</s>
							<br>
							<br>
							Votre très cher Animacteur vous propose le premier concours officiel LeekWars !!
							<br>
							<br>
							<i>La foule est en délire, les poireaux du monde entier se regroupent en masse devant la LeekWars Arena pour assister à ce spectacle épatant ! Et c'est normal, car cette mise à mort végan aura, pour la première fois, des subventions du poireau à la plus grande pilowsité au monde !</i>
							<br>
							<br>
							Ce concours est ouvert aux nouveaux comme aux vétérans. L'avancée de vos IAs ne jouera pas dans le classement ! Il s'agira de découvrir ce que MOI, votre cher Animacteur, a mis dans mon IA. <i>D'où le titre Reverse-Engineering, logique.</i>
							<br>
							<br>
							Ce concours s'effectuera en plusieurs manches, dont la première commence <b>dès aujourd'hui</b>, et finira au <b>nouvel an</b>.
							Les prix seront répartis comme suit : <b>300</b> cristaux pour le premier, <b>200</b> cristaux pour le second, <b>100</b> cristaux pour le troisième.
							<br>
							<br>
							Pour plus d'informations, rendez-vous sur le topic !
							<br>
							<br>
							<v-btn>
								<router-link to="/forum/category-5/topic-10033">https://leekwars.com/forum/category-5/topic-10033</router-link>
							</v-btn>
						</div>
					</div>
				</popup>
				-->
				<v-dialog v-if="docEverywhere" v-model="docEverywhereModel" content-class="doc" :max-width="1400">
					<documentation ref="doc" :popup="true" />
				</v-dialog>
			</div>
		</v-theme-provider>
	</div>
</template>

<script lang='ts'>
	import Bar from '@/component/app/bar.vue'
	const Chats = () => import('@/component/app/chats.vue')
	// import Console from '@/component/app/console.vue'
	const Footer = () => import('@/component/app/footer.vue')
	import Header from '@/component/app/header.vue'
	const Menu = () => import(/* webpackChunkName: "[request]" */ `@/component/app/menu.vue`)
	const MobileBR = () => import('@/component/app/mobile-br.vue')
	const Social = () => import(/* webpackChunkName: "[request]" */ `@/component/app/social.vue`)
	const Squares = () => import('@/component/app/squares.vue')
	const ChangelogVersion = () => import('@/component/changelog/changelog-version.vue')
	import { locale } from '@/locale'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Console from './console.vue'
	const ChangelogDialog = () => import('../changelog/changelog-dialog.vue')
	const Didactitiel = () => import(/* webpackChunkName: "[request]" */ `@/component/didactitiel/didactitiel.${locale}.i18n`)
	const Documentation = () => import(/* webpackChunkName: "[request]" */ `@/component/documentation/documentation.${locale}.i18n`)
	const DidactitielNew = () => import(/* webpackChunkName: "[request]" */ `@/component/didactitiel-new/didactitiel-new.${locale}.i18n`)

	@Component({
		components: {'lw-bar': Bar, 'lw-footer': Footer, 'lw-header': Header, 'lw-menu': Menu, 'lw-social': Social, Squares, Didactitiel, Chats, 'mobile-br': MobileBR, ChangelogVersion, ChangelogDialog, Documentation, DidactitielNew, Console }
	})
	export default class App extends Vue {
		console: boolean = false
		consoleDown: boolean = false
		consoleX: number = 0
		consoleY: number = 0
		consoleStartx: number = 0
		consoleStarty: number = 0
		consoleDragx: number = 0
		consoleDragy: number = 0
		changelog: any = null
		changelogDialog: boolean = false
		konami: string = ''
		annonce: boolean = false
		docEverywhere: boolean = false
		docEverywhereModel: boolean = false
		didactitiel_new_enabled: boolean = true
		mouseX = 0
		mouseY = 0
		cloverSpeed = 200
		verifyMessage = true

		@Watch('LeekWars.darkMode', {immediate: true})
		updateDarkMode() {
			this.$vuetify.theme.dark = LeekWars.darkMode
			if (LeekWars.darkMode)
				document.body.classList.add('dark')
			else
				document.body.classList.remove('dark')
		}

		created() {
			this.$root.$on('connected', () => {
				if (!this.$store.state.farmer.didactitiel_seen) {
					LeekWars.show_didactitiel()
					Vue.nextTick(() => {
						this.$store.commit('didactitiel-seen')
					})
				}
			})
			if (this.$store.state.connected && localStorage.getItem('changelog_version') !== LeekWars.normal_version) {
				this.changelogShow()
			}
			this.$root.$on('keyup', (event: KeyboardEvent) => {
				if (event.keyCode === 72 && event.altKey && event.ctrlKey) {
					this.docEverywhere = true
					Vue.nextTick(() => {
						this.docEverywhereModel = true
						Vue.nextTick(() => {
							if (this.$refs.doc) {
								(this.$refs.doc as any).focus()
							}
						})
					})
				}
				// Konami code
				if (event.keyCode === 37) { this.konami += "l" }
				else if (event.keyCode === 38) { this.konami += "u" }
				else if (event.keyCode === 39) { this.konami += "r" }
				else if (event.keyCode === 40) { this.konami += "d" }
				else if (event.keyCode === 65) { this.konami += "a" }
				else if (event.keyCode === 66) { this.konami += "b" }
				if (/uuddlrlrba$/.test(this.konami)) {
					LeekWars.post('trophy/unlock', {trophy_id: 113})
					this.konami = ""
				}
				if (this.konami.length > 12) { this.konami = this.konami.substring(1) }
			})
			this.$root.$on('navigate', () => {
				this.docEverywhereModel = false
			})

			// if (this.$store.state.connected && !localStorage.getItem('annonce/boss-poll')) {
			// 	this.annonce = true
			// 	localStorage.setItem('annonce/boss-poll', 'true')
			// }
		}
		changelogShow() {
			LeekWars.get('changelog/get-last/' + this.$i18n.locale).then(data => {
				this.changelog = data.changelog
				this.changelogDialog = true
				localStorage.setItem('changelog_version', LeekWars.normal_version)
				localStorage.setItem('changelog_forum_topic', data.changelog.forum_topic)
			})
		}
		darkClick() {
			LeekWars.menuExpanded = false
			LeekWars.dark = 0
		}
		leekscriptConsole() {
			this.console = true
			this.consoleX = window.innerWidth / 2 - 300
			this.consoleY = window.innerHeight / 2 - 200
			setTimeout(() => {
				(this.$refs.console as Console).focus()
			}, 100)
		}
		consoleRandom() {
			(this.$refs.console as Console).random()
		}
		consoleClose() {
			this.console = false
		}
		consoleMouseDown(e: MouseEvent) {
			if (e.button === 2) { return false }
			this.consoleDragx = e.pageX
			this.consoleDragy = e.pageY
			this.consoleStartx = this.consoleX
			this.consoleStarty = this.consoleY
			this.consoleDown = true
			e.preventDefault()
			return false
		}
		consoleMouseMove(e: MouseEvent) {
			if (!this.consoleDown) { return null }
			this.consoleX = this.consoleStartx + (e.pageX - this.consoleDragx)
			if (this.consoleX < -15) { this.consoleX = -15 }
			this.consoleY = this.consoleStarty + (e.pageY - this.consoleDragy)
			if (this.consoleY < -15) { this.consoleY = -15 }
		}
		consoleMouseUp(e: MouseEvent) {
			this.consoleDown = false
		}
		consolePopup() {
			LeekWars.popupWindow("/console", "title", 600, 320)
			this.console = false
		}

		clickClover() {
			if (LeekWars.cloverFake) {
				this.mouseX = LeekWars.cloverLeft
				this.mouseY = LeekWars.cloverTop
				this.cloverSpeed = 5
				this.updateClover()
				this.updateCloverPosition()
			} else {
				LeekWars.track('clover')
				LeekWars.socket.send([SocketMessage.GET_LUCKY])
				LeekWars.clover = false
			}
		}

		updateClover() {

			const mx = this.mouseX
			const my = this.mouseY
			const cx = LeekWars.cloverLeft
			const cy = LeekWars.cloverTop
			const d = 300
			const td = 400
			if (Math.sqrt(Math.pow(mx - cx, 2) + Math.pow(my - cy, 2)) < d) {

				// Find best position to go
				var best = -Infinity
				var best_angle = 0
				const start_angle = Math.random() * 360
				for (var i = 0; i < 360; i += 10) {
					var angle = (((start_angle + i) % 360) / 360) * Math.PI * 2
					var dx = mx + Math.cos(angle) * td
					var dy = my + Math.sin(angle) * td
					// sortie ?
					if (dx > window.innerWidth - 100 || dx < 50 || dy > window.innerHeight - 100 || dy < 50) {
						continue
					}
					var dist = Math.random() * 100 + Math.sqrt(Math.pow(mx - dx, 2) + Math.pow(my - dy, 2)) - Math.sqrt(Math.pow(cx - dx, 2) + Math.pow(cy - dy, 2))
					if (dist > best) {
						best = dist
						best_angle = angle
					}
				}
				LeekWars.cloverDDX = mx + Math.cos(best_angle) * td
				LeekWars.cloverDDY = my + Math.sin(best_angle) * td
			}
		}

		updateCloverPosition() {

			if (Math.abs(LeekWars.cloverLeft - LeekWars.cloverDDX) > 1 || Math.abs(LeekWars.cloverTop - LeekWars.cloverDDY) > 1) {

				LeekWars.cloverDX -= (LeekWars.cloverDX - LeekWars.cloverDDX) / 80
				LeekWars.cloverDY -= (LeekWars.cloverDY - LeekWars.cloverDDY) / 80

				LeekWars.cloverLeft -= (LeekWars.cloverLeft - LeekWars.cloverDX) / this.cloverSpeed
				LeekWars.cloverTop -= (LeekWars.cloverTop - LeekWars.cloverDY) / this.cloverSpeed

				requestAnimationFrame(this.updateCloverPosition)
			}
		}

		mousemove(e: MouseEvent) {
			if (LeekWars.cloverFake) {
				this.mouseX = e.clientX
				this.mouseY = e.clientY
				this.cloverSpeed = 200
				this.updateClover()
				this.updateCloverPosition()
			}
			this.consoleMouseMove(e)
		}

		mouseup(e: MouseEvent) {
			this.consoleMouseUp(e)
		}
	}
</script>

<style lang="scss" scoped>
	#app.beta {
		background: #492e46;
	}
	.console-button {
		position: fixed;
		top: 46px;
		left: 34px;
		z-index: 1;
		cursor: pointer;
		display: none;
		img {
			width: 30px;
			opacity: 0.3;
		}
		&:hover img {
			opacity: 0.6;
		}
	}
	#app.connected .console-button {
		display: block;
	}
	#app.app .console-button {
		display: none;
	}
	.v-dialog.console {
		position: fixed;
		top: calc(50% - 200px);
		left: calc(50% - 300px);
		width: 700px;
		z-index: 10;
		transition: none;
		overflow: visible;
	}
	#app.app {
		overflow: hidden;
	}
	#app.app.connected:not(.lightbar) {
		padding-top: 56px;
	}
	#app.app .page {
		padding-bottom: 0;
	}
	#app.app .notifications-button img, #app.app .messages-button img {
		margin: 0;
	}
	#app.app .v-application--wrap {
		min-height: calc(100% - 56px);
	}
	#app.app .app-center {
		transition: transform ease 200ms;
		margin: 0;
		padding: 0;
	}
	#app.app.menu-expanded .app-center {
		transform: translateX(250px);
	}
	.app-center {
		padding: 0 20px;
		display: flex;
	}
	#app.connected:not(.app) .app-center {
		margin-left: 170px;
	}
	#app.menu-collapsed:not(.app) .app-center {
		margin-left: 64px;
	}
	.app-wrapper {
		max-width: 1100px;
		width: 100%;
		margin: 0 auto;
		flex: 1;
	}
	.app-wrapper.large {
		max-width: none;
	}
	.app-wrapper.flex {
		display: inline-block;
		flex: 0;
	}
	.app-wrapper.box {
		display: flex;
		flex-direction: column;
		height: 100vh;
		.page-wrapper {
			flex: 1;
			min-height: 0;
			.page {
				height: 100%;
				display: flex;
				flex-direction: column;
				height: 100%;
			}
		}
	}
	#app.app .app-wrapper.box {
		height: calc(100vh - 56px);
	}
	.big-leeks {
		z-index: -10;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		height: 100px;
		opacity: 1;
		transition: opacity 300ms ease;
		.wrapper {
			position: relative;
			max-width: 1100px;
			margin: 0 auto;
			height: 100px;
		}
		&.flex {
			.wrapper {
				max-width: none;
				width: 100%;
			}
		}
		&.hidden {
			opacity: 0;
		}
	}
	#app.connected .big-leeks {
		left: 190px;
	}
	#app.menu-collapsed .big-leeks {
		left: 88px;
	}
	.big-leek-1, .big-leek-2 {
		position: absolute;
		z-index: -10;
	}
	.big-leek-1 {
		left: -153px;
		bottom: 50px;
	}
	.big-leek-2 {
		right: -230px;
		bottom: 50px;
	}
	.page-wrapper {
		background: rgba(255, 255, 255, 0.1);
		padding: 12px;
	}
	body.dark .page-wrapper {
		// background: rgba(0, 0, 0, 0.1);
	}
	#app.app .page-wrapper {
		background: none;
		padding: 0;
	}
	.page {
		min-height: calc(100vh - 352px);
	}
	.dark-shadow {
		display: none;
		position: fixed;
		top: 0; bottom: 0;
		left: 0; right: 0;
		background: black;
		opacity: 0;
		z-index: 5;
		transition: opacity ease 200ms;
	}
	#app.app .dark-shadow {
		top: 56px;
	}
	.dark-shadow.visible {
		display: block;
		opacity: 0.6;
	}
	.clover {
		position: fixed;
		z-index: 1000;
		cursor: pointer;
		width: 40px;
		height: 40px;
	}
	.console .title .spacer {
		flex: 1;
	}
	@media screen and (min-width: 1600px) {
		#app.connected:not(.social-collapsed):not(.app) {
			.app-center {
				margin-right: 400px;
			}
			.chats {
				padding-right: 400px;
			}
			.big-leeks {
				right: 420px;
			}
		}
		#app.connected.social-collapsed {
			.app-center {
				margin-right: 30px;
			}
			.big-leeks {
				right: 50px;
			}
		}
	}
	@media screen and (max-width: 999px) {
		.page-wrapper {
			padding: 8px;
		}
		.panel > .content {
			padding: 10px;
		}
	}
	@media screen and (max-width: 850px) {
		#app.connected .app-center {
			margin-left: 0;
		}
		.app-wrapper {
			max-width: 100%;
		}
	}
	@media screen and (max-width: 599px) {
		.app-center {
			padding: 0;
		}
		.big-leeks {
			display: none;
		}
	}
	.annonce {
		.avatar {
			width: 25px;
			vertical-align: middle;
			margin-left: 6px;
		}
		a {
			font-weight: 500;
			color: #5fad1b;
		}
	}

	.requests {
		display: none;
		background: rgba(0,0,0,0.8);
		color: white;
		padding: 10px;
		position: fixed;
		top: 10px;
		left: 10px;
		z-index: 100;
	}
	::v-deep .v-dialog.doc {
		height: auto;
		display: flex;
		max-height: 80vh;
		box-shadow: none;
		align-self: flex-start;
		margin-top: 140px !important;
		.documentation-page {
			max-height: 80vh;
		}
	}
	.finish-register {
		position: fixed;
		top: 0;
		right: 0;
		left: 0;
		display: flex;
		justify-content: center;
		z-index: 10;
		.message {
			background: var(--pure-white);
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
			border-bottom-left-radius: 5px;
			border-bottom-right-radius: 5px;
			padding: 4px 12px;
			display: flex;
			align-items: center;
			gap: 10px;
			i, button {
				font-size: 18px;
			}
		}
	}
</style>
