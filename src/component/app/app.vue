<template>
	<div id="app" :class="{ connected: $store.state.connected, app: LeekWars.mobile, 'social-collapsed': LeekWars.socialCollapsed, 'menu-expanded': LeekWars.menuExpanded, sfw: LeekWars.sfw, xp: LeekWars.xpTheme, dark: LeekWars.darkMode, 'menu-collapsed': !LeekWars.mobile && LeekWars.menuCollapsed, beta: env.BETA, lightbar: LeekWars.lightBar }" data-app="true" @mousemove="mousemove">
				<div :class="{visible: LeekWars.dark > 0}" :style="{opacity: LeekWars.dark}" class="dark-shadow" @click="darkClick"></div>

				<div class="requests">{{ LeekWars.requests }} <v-btn size="x-small" @click="LeekWars.requests = 0">reset</v-btn></div>

				<lw-menu v-if="$store.state.connected" />

				<v-icon class="console-button" @click="leekscriptConsole">mdi-console</v-icon>

				<console-window v-if="showConsole" v-model="consoleValue" ref="consoleWindow" @close="consoleValue = false" />

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

				<changelog-dialog v-model="showChangelog" :changelog="changelog" />

				<popup v-model="LeekWars.messagePopup" :width="500">
					<template #title>
						<v-icon>mdi-information-outline</v-icon>
						{{ LeekWars.message ? $t((LeekWars.message as any).title) : '...' }}
					</template>
					<div v-if="LeekWars.message" v-html="$t((LeekWars.message as any).message, (LeekWars.message as any).arguments)"></div>
				</popup>

				<!-- <popup v-model="annonce" :width="800">
					<template #title><v-icon>mdi-bullhorn-outline</v-icon> Annonce !</template>
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
					<template #title><v-icon>mdi-bullhorn-outline</v-icon> Annonce !</template>
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
					<template #title><v-icon>mdi-bullhorn-outline</v-icon> Annonce de concours !</template>
					<div class="annonce">
						<h2>Reverse-Engineering : LW101</h2>
						<h4>Examen pratique</h4>
						<br>
						Organisé par <rich-tooltip-farmer :id="50023" :bottom="true">
							<avatar :farmer="{id: 50023, avatar_changed: 12}" />
							<b>Oimat</b>
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
				<popup v-model="aprilFoolsDialog" :width="500">
					<template #title><v-icon>mdi-shimmer</v-icon> {{ $t('main.april_fools_title') }}</template>
					<div class="april-fools">
						<div>{{ $t('main.april_fools_message') }}</div>
						<div class="actions">
							<v-btn @click="aprilFoolsAccept">{{ $t('main.april_fools_yes') }}</v-btn>
							<v-btn variant="text" @click="aprilFoolsDialog = false">{{ $t('main.april_fools_no') }}</v-btn>
						</div>
					</div>
				</popup>

				<popup v-model="loggedOutOtherTab" :width="500">
				<template #title>
					<v-icon>mdi-logout</v-icon>
					{{ $t('main.disconnected') }}
				</template>
				<div>{{ $t('main.logged_out_other_tab') }}</div>
			</popup>

				<popup v-model="LeekWars.logoutDialog" :width="500">
					<template #title>
						<v-icon>mdi-logout</v-icon>
						{{ $t('main.logout') }}
					</template>
					<div>{{ $t('main.logout_confirm') }}</div>
					<div v-if="logoutAccounts.length > 1" class="logout-accounts">
						<div v-for="account in logoutAccounts" :key="account.id" class="logout-account">
							<img :src="LeekWars.getAvatar(account.id, account.avatar_changed)" class="logout-account-avatar">
							<span class="logout-account-name">{{ account.name }}</span>
						</div>
					</div>
					<template #actions>
						<div v-ripple class="action dismiss" @click="LeekWars.logoutDialog = false">{{ $t('main.cancel') }}</div>
						<div v-ripple class="action red" @click="confirmLogout">{{ $t('main.logout') }}</div>
					</template>
				</popup>

			<v-dialog v-if="docEverywhere" v-model="docEverywhereModel" content-class="doc" :max-width="1400">
					<documentation ref="doc" :popup="true" />
				</v-dialog>

				<v-snackbar v-model="LeekWars.cloverPopup" :timeout="-1" color="#222" location="top">
					<div style="display: flex; align-items: center; gap: 10px">
						<img src="/image/clover.png" style="width: 28px">
						<span>{{ LeekWars.cloverResult }}</span>
					</div>
					<template #actions>
						<v-btn variant="text" @click="LeekWars.cloverPopup = false">{{ $t('main.clover_dismiss') }}</v-btn>
					</template>
				</v-snackbar>
			</div>
</template>

<script lang="ts">
	import { defineAsyncComponent } from 'vue'
	import { locale } from '@/locale'
	import Bar from '@/component/app/bar.vue'
	import Header from '@/component/app/header.vue'
	const Chats = defineAsyncComponent(() => import('@/component/app/chats.vue'))
	const Footer = defineAsyncComponent(() => import('@/component/app/footer.vue'))
	const Menu = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/app/menu.vue`))
	const MobileBR = defineAsyncComponent(() => import('@/component/app/mobile-br.vue'))
	const Social = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/app/social.vue`))
	const Squares = defineAsyncComponent(() => import('@/component/app/squares.vue'))
	const ChangelogVersion = defineAsyncComponent(() => import('@/component/changelog/changelog-version.vue'))
	const ConsoleWindow = defineAsyncComponent(() => import('./console-window.vue'))
	const ChangelogDialog = defineAsyncComponent(() => import('../changelog/changelog-dialog.vue'))
	const Didactitiel = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/didactitiel/didactitiel.${locale}.i18n`))
	const Documentation = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/documentation/documentation.${locale}.i18n`))
	const DidactitielNew = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/didactitiel-new/didactitiel-new.${locale}.i18n`))
	export default {
		components: {'lw-bar': Bar, 'lw-footer': Footer, 'lw-header': Header, 'lw-menu': Menu, 'lw-social': Social, Squares, Didactitiel, Chats, 'mobile-br': MobileBR, ChangelogVersion, ChangelogDialog, Documentation, DidactitielNew, ConsoleWindow }
	}
</script>
<script lang="ts" setup>
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { AccountInfo, store } from '@/model/store'
	import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRouter } from 'vue-router'
	import { useTheme } from 'vuetify'
	import { emitter } from '@/model/vue'

	const { locale: i18nLocale } = useI18n()
	const router = useRouter()
	const theme = useTheme()

	const showConsole = ref(false)
	const consoleValue = ref(false)
	const changelog = ref<any>(null)
	const showChangelog = ref(false)
	let konami = ''
	const annonce = ref(false)
	const docEverywhere = ref(false)
	const docEverywhereModel = ref(false)
	const didactitiel_new_enabled = ref(true)
	let mouseX = 0
	let mouseY = 0
	let cloverSpeed = 200
	const verifyMessage = ref(true)
	const loggedOutOtherTab = ref(false)
	const aprilFoolsDialog = ref(false)
	const doc = useTemplateRef<any>('doc')

	const logoutAccounts = computed(() => {
		const farmerId = store.state.farmer?.id
		return store.state.accounts.filter((a: AccountInfo) => a.connected || a.id === farmerId)
	})

	watch(() => LeekWars.darkMode, () => {
		theme.change(LeekWars.darkMode ? 'dark' : 'light')
		if (LeekWars.darkMode)
			document.body.classList.add('dark')
		else
			document.body.classList.remove('dark')
	}, { immediate: true })

	watch(() => LeekWars.xpTheme, () => {
		if (LeekWars.xpTheme)
			document.body.classList.add('xp')
		else
			document.body.classList.remove('xp')
	}, { immediate: true })

	emitter.on('connected', () => {
		if (!store.state.farmer!.didactitiel_seen) {
			LeekWars.show_didactitiel()
			nextTick(() => {
				store.commit('didactitiel-seen')
			})
		}
		if (localStorage.getItem('changelog_version') !== LeekWars.normal_version) {
			changelogShow()
		}
		if (LeekWars.aprilFools && !localStorage.getItem('april-fools-2026')) {
			localStorage.setItem('april-fools-2026', 'true')
			aprilFoolsDialog.value = true
		}
	})
	emitter.on('keyup', (event: KeyboardEvent) => {
		if (event.keyCode === 72 && event.altKey && event.ctrlKey) {
			docEverywhere.value = true
			nextTick(() => {
				docEverywhereModel.value = true
				nextTick(() => {
					if (doc.value) {
						doc.value.focus()
					}
				})
			})
		}
		// Konami code
		if (event.keyCode === 37) { konami += "l" }
		else if (event.keyCode === 38) { konami += "u" }
		else if (event.keyCode === 39) { konami += "r" }
		else if (event.keyCode === 40) { konami += "d" }
		else if (event.keyCode === 65) { konami += "a" }
		else if (event.keyCode === 66) { konami += "b" }
		if (konami.endsWith('uuddlrlrba')) {
			LeekWars.post('trophy/unlock', {trophy_id: 113})
			konami = ""
		}
		if (konami.length > 12) { konami = konami.substring(1) }
	})
	emitter.on('keydown', (event: KeyboardEvent) => redirectToLocalhost(event))
	emitter.on('navigate', () => {
		docEverywhereModel.value = false
	})

	function onStorage(e: StorageEvent) {
		if (e.key === 'logout' && e.newValue !== null && store.state.connected) {
			store.commit('reset')
			LeekWars.socket.disconnect()
			router.push('/')
			nextTick(() => {
				loggedOutOtherTab.value = true
			})
		}
		if (e.key === 'connected' && e.newValue === 'true' && !store.state.connected) {
			window.location.reload()
		}
	}
	window.addEventListener('storage', onStorage)
	onBeforeUnmount(() => window.removeEventListener('storage', onStorage))

	const toast = new URLSearchParams(window.location.search).get('toast')
	if (toast) {
		LeekWars.toast(i18n.global.t('main.account_' + toast) as string)
		history.replaceState(null, '', window.location.pathname)
	}

	function changelogShow() {
		LeekWars.get('changelog/get-last/' + i18nLocale.value).then(data => {
			changelog.value = data.changelog
			showChangelog.value = true
			localStorage.setItem('changelog_version', LeekWars.normal_version)
			localStorage.setItem('changelog_forum_topic', data.changelog.forum_topic)
		})
	}
	function aprilFoolsAccept() {
		aprilFoolsDialog.value = false
		LeekWars.themeSetting = 'xp'
		localStorage.setItem('theme', 'xp')
		LeekWars.xpTheme = true
		LeekWars.darkMode = false
	}
	function confirmLogout() {
		LeekWars.logoutDialog = false
		store.commit('disconnect')
		router.push('/')
	}
	function darkClick() {
		LeekWars.menuExpanded = false
		LeekWars.dark = 0
	}

	function leekscriptConsole() {
		showConsole.value = true
		consoleValue.value = true
	}

	function clickClover() {
		if (LeekWars.cloverFake) {
			mouseX = LeekWars.cloverLeft
			mouseY = LeekWars.cloverTop
			cloverSpeed = 5
			updateClover()
			updateCloverPosition()
		} else {
			LeekWars.track('clover')
			LeekWars.socket.send([SocketMessage.GET_LUCKY])
			LeekWars.clover = false
		}
	}

	function updateClover() {
		const mx = mouseX
		const my = mouseY
		const cx = LeekWars.cloverLeft
		const cy = LeekWars.cloverTop
		const d = 300
		const td = 400
		if (Math.sqrt(Math.pow(mx - cx, 2) + Math.pow(my - cy, 2)) < d) {
			var best = -Infinity
			var best_angle = 0
			const start_angle = Math.random() * 360
			for (var i = 0; i < 360; i += 10) {
				var angle = (((start_angle + i) % 360) / 360) * Math.PI * 2
				var dx = mx + Math.cos(angle) * td
				var dy = my + Math.sin(angle) * td
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

	function updateCloverPosition() {
		if (Math.abs(LeekWars.cloverLeft - LeekWars.cloverDDX) > 1 || Math.abs(LeekWars.cloverTop - LeekWars.cloverDDY) > 1) {
			LeekWars.cloverDX -= (LeekWars.cloverDX - LeekWars.cloverDDX) / 80
			LeekWars.cloverDY -= (LeekWars.cloverDY - LeekWars.cloverDDY) / 80
			LeekWars.cloverLeft -= (LeekWars.cloverLeft - LeekWars.cloverDX) / cloverSpeed
			LeekWars.cloverTop -= (LeekWars.cloverTop - LeekWars.cloverDY) / cloverSpeed
			requestAnimationFrame(updateCloverPosition)
		}
	}

	function mousemove(e: MouseEvent) {
		if (LeekWars.cloverFake) {
			mouseX = e.clientX
			mouseY = e.clientY
			cloverSpeed = 200
			updateClover()
			updateCloverPosition()
		}
	}

	function redirectToLocalhost(event: KeyboardEvent) {
		if (event.ctrlKey && event.altKey && event.key === "l") {
			event.preventDefault()
			const local = 'http://localhost:8080'
			const prod = 'https://leekwars.com'
			if (window.location.origin === local) {
				window.location.href = `${prod}${window.location.pathname}${window.location.search}${window.location.hash}`;
			} else if (window.location.origin === prod) {
				window.location.href = `${local}${window.location.pathname}${window.location.search}${window.location.hash}`;
			}
		}
	}
</script>

<style lang="scss" scoped>
	#app.beta {
		background: #492e46;
	}
	.console-button.v-icon {
		position: fixed;
		top: 44px;
		left: 35px;
		z-index: 1;
		cursor: pointer;
		display: none;
		font-size: 30px;
		opacity: 0.5;
		color: white;
		&:hover {
			opacity: 1;
		}
	}
	#app.connected .console-button {
		display: block;
	}
	#app.app .console-button {
		display: none;
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
	.april-fools .actions {
		display: flex;
		gap: 10px;
		justify-content: center;
		margin-top: 15px;
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
	:deep(.v-overlay__content.doc) {
		height: auto;
		display: flex;
		flex-direction: row;
		max-height: 84vh;
		box-shadow: none;
		align-self: flex-start;
		margin-top: 10vh !important;
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
	.logout-accounts {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 12px;
		padding: 8px 10px;
		background: var(--background-secondary);
		border-radius: 4px;
	}
	.logout-account {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.logout-account-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
		background: var(--pure-white);
	}
	.logout-account-name {
		font-weight: 500;
	}
</style>
