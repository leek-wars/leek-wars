<template>
	<div id="app" :class="{ connected: $store.state.connected, app: LeekWars.mobile, 'social-collapsed': LeekWars.socialCollapsed, 'menu-expanded': LeekWars.menuExpanded, sfw: LeekWars.sfw, 'menu-collapsed': LeekWars.menuCollapsed }" data-app="true" @mousemove="consoleMouseMove" @mouseup="consoleMouseUp">
	
		<div :class="{visible: LeekWars.dark > 0}" :style="{opacity: LeekWars.dark}" class="dark" @click="darkClick"></div>
	
		<lw-menu v-if="$store.state.connected" />

		<div class="console-button" @click="leekscriptConsole">
			<img src="/image/console.png">
		</div>
		<div v-if="console" :style="{top: consoleY + 'px', left: consoleX + 'px'}" class="console v-dialog draggable">
			<div class="title" @mousedown="consoleMouseDown">
				Console LeekScript V2
				<div class="options">
					<div class="option" @click="consoleRandom"><img src="/image/icon/dice.png"></div>
					<div class="option" @click="consolePopup"><i class="material-icons">open_in_new</i></div>
					<div class="option" @click="consoleClose"><i class="material-icons">clear</i></div>
				</div>
			</div>
			<console ref="console" />
		</div>

		<lw-bar v-if="LeekWars.mobile" />
		
		<div v-if="!LeekWars.mobile" class="big-leeks">
			<div class="wrapper">
				<img class="big-leek-1" src="/image/big_leek_1_white.png">
				<img class="big-leek-2" src="/image/big_leek_2_white.png">
			</div>
		</div>
		
		<div class="app-center">
			<div :class="{large: LeekWars.large}" class="app-wrapper">
				<lw-header />
				<div class="page-wrapper">
					<div class="page">
						<router-view />
					</div>
				</div>
			</div>
		</div>
		
		<lw-social />
		
		<lw-footer />

		<battle-royale />
		<squares />
		
		<div class="toasts"></div>

		<img v-if="LeekWars.clover" :style="{top: LeekWars.cloverTop + 'px', left: LeekWars.cloverLeft + 'px'}" class="clover" src="/image/clover.png" @click="clickClover">

		<didactitiel v-model="didactitiel" />

		<v-dialog v-model="quitConfirmDialog" :max-width="600">
			<div class="title">{#quit_confirm}</div>
			<div class="content">
				{message}
			</div>
			<div class="actions">
				<div class="stay">{#stay}</div>
				<div class="leave red">{#leave}</div>
			</div>
		</v-dialog>

		<v-dialog v-model="changelogDialog" :max-width="800">
			<i18n tag="div" path="changelog.version_online" class="title">
				<b v-if="changelog" place="version">{{ changelog.version_name }}</b>
			</i18n>
			<div v-if="changelog" class="content changelog-dialog">
				<div v-for="change in changelogFormat($t('changelog.' + changelog.data))" :key="change" class="change">➤ {{ change }}</div>
				<br>
				<i18n path="changelog.see_all_changes">
					<router-link place="changelog" to="/changelog">changelog</router-link>
				</i18n>
			</div>
			<div class="actions">
				<div @click="changelogDialog = false">{{ $t('changelog.popup_ok') }}</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang='ts'>
	import Bar from '@/component/app/bar.vue'
	import BattleRoyale from '@/component/app/battle-royale.vue'
	import Console from '@/component/app/console.vue'
	import Footer from '@/component/app/footer.vue'
	import Header from '@/component/app/header.vue'
	import Menu from '@/component/app/menu.vue'
	import Social from '@/component/app/social.vue'
	import Squares from '@/component/app/squares.vue'
	import Didactitiel from '@/component/help/didactitiel.vue'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { setTimeout } from 'timers'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({
		components: {'lw-bar': Bar, 'lw-footer': Footer, 'lw-header': Header, 'lw-menu': Menu, 'lw-social': Social, Console, BattleRoyale, Squares, Didactitiel}
	})
	export default class App extends Vue {
		didactitiel: boolean = false
		quitConfirmDialog: boolean = false
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

		created() {
			this.$root.$on('connected', () => {
				if (!this.$store.state.farmer.didactitiel_seen) {
					this.didactitiel = true
					this.$store.commit('didactitiel-seen')
				}
			})
			if (this.$store.state.connected && localStorage.getItem('changelog_version') !== LeekWars.version) {
				this.changelogShow()
			}
			this.$root.$on('keyup', (event: KeyboardEvent) => {
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
		}
		changelogShow() {
			LeekWars.get<any>('changelog/get-last/' + this.$i18n.locale).then((data) => {
				if (data.success) {
					this.changelog = data.changelog
					this.changelogDialog = true
					localStorage.setItem('changelog_version', LeekWars.version)
				}
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
		changelogFormat(data: string) {
			return data.split("\n").filter((c) => c.length > 0).map((c) => c.replace('# ', ''))
		}
		clickClover() {
			LeekWars.socket.send([SocketMessage.GET_LUCKY])
			LeekWars.clover = false
		}
	}
</script>

<style lang="scss" scoped>
	.console-button {
		position: fixed;
		top: 46px;
		left: 34px;
		cursor: pointer;
		display: none;
		img {
			width: 30px;
			opacity: 0.3;
		}
	}
	.console-button:hover img {
		opacity: 0.6;
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
		width: 600px;
		z-index: 600;
		transition: none;
	}
	#app.app {
		overflow: hidden;
	}
	#app.app.connected {
		padding-top: 56px;
	}
	#app.app .page {
		padding-bottom: 0;
		margin-right: 0;
	}
	#app.app .notifications-button img, #app.app .messages-button img {
		margin: 0;
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
	}
	#app.connected .app-center {
		margin-left: 170px;
	}
	#app.menu-collapsed:not(.app) .app-center {
		margin-left: 64px;
	}
	.app-wrapper {
		max-width: 1100px;
		margin: 0 auto;
	}
	.app-wrapper.large {
		max-width: none;
	}
	.big-leeks {
		z-index: -10;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		height: 100px;
		.wrapper {
			position: relative;
			max-width: 1000px;
			margin: 0 auto;
			height: 100px;
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
		left: -205px;
		bottom: 50px;
	}
	.big-leek-2 {
		right: -280px;
		bottom: 50px;
	}
	.page-wrapper {
		background: rgba(80, 80, 80, 0.6);
		padding: 12px;
		padding-bottom: 0;
	}
	#app.app .page-wrapper {
		background: none;
		padding: 0;
	}
	.page {
		margin-right: -12px;
		min-height: calc(100vh - 244px);
	}
	.dark {
		display: none;
		position: fixed;
		top: 0; bottom: 0;
		left: 0; right: 0;
		background: black;
		opacity: 0;
		z-index: 5;
		transition: opacity ease 200ms;
	}
	#app.app .dark {
		top: 56px;
	}
	.dark.visible {
		display: block;
		opacity: 0.6;
	}
	.clover {
		position: fixed;
		z-index: 1000;
		cursor: pointer;
	}
	.changelog-dialog a {
		color: #5fad1b;
	}
	@media screen and (min-width: 1600px) {
		#app.connected:not(.social-collapsed):not(.app) .app-center {
			margin-right: 400px;
		}
		#app.connected.social-collapsed .app-center {
			margin-right: 30px;
		}
		#app.connected:not(.social-collapsed) .big-leeks {
			right: 420px;
		}
	}
	@media screen and (max-width: 999px) {
		.page-wrapper {
			padding: 8px;
			padding-bottom: 0;
		}
		.panel > .content {
			padding: 10px;
		}
	}
	@media screen and (max-width: 850px) {
		#app.connected .app-center {
			margin-left: 0;
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
</style>
