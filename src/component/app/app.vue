<template>
	<div id="app" :class="{ connected: $store.getters.connected, app: LeekWars.mobile, 'social-collapsed': LeekWars.socialCollapsed, 'menu-expanded': LeekWars.menuExpanded, sfw: LeekWars.sfw }" data-app="true" @mousemove="consoleMouseMove" @mouseup="consoleMouseUp">
	
		<div id="dark" :class="{visible: LeekWars.dark > 0}" :style="{opacity: LeekWars.dark}" @click="darkClick"></div>
	
		<lw-menu v-if="$store.getters.connected" />

		<div id="console" @click="leekscriptConsole">
			<img src="/image/console.png">
		</div>
		<div v-if="console" :style="{top: consoleY + 'px', left: consoleX + 'px'}" class="console v-dialog draggable">
			<div class="title" @mousedown="consoleMouseDown">
				Console LeekScript V2
				<div class="options">
					<div class="option" @click="consoleRandom"><img src="/image/icon/dice.png"></div>
					<div class="option" @click="consolePopup"><img src="/image/icon/open_new_window.png"></div>
					<div class="option" @click="consoleClose"><img src="/image/icon/quit.png"></div>
				</div>
			</div>
			<console ref="console" />
		</div>

		<lw-bar v-if="LeekWars.mobile" />
		
		<div v-if="!LeekWars.mobile" id="big-leeks">
			<div class="wrapper">
				<img id="big-leek-1" src="/image/big_leek_1_white.png">
				<img id="big-leek-2" src="/image/big_leek_2_white.png">
			</div>
		</div>
		
		<div id="center">
			<div id="wrapper">
				<lw-header />
				<div id="page-wrapper">
					<div id="page">
						<router-view />
					</div>
				</div>
			</div>
		</div>
		
		<lw-social />
		
		<lw-footer />

		<battle-royale />
		<squares />
		
		<div id="toasts"></div>

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

		created() {
			this.$root.$on('connected', () => {
				if (!this.$store.state.farmer.didactitiel_seen) {
					this.didactitiel = true
					this.$store.commit('didactitiel-seen')
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
	}
</script>

<style lang="scss">
	.v-tooltip__content {
		background: #333 !important;
		font-size: 14px !important;
		pointer-events: none;
		transition: none !important;
		max-width: 250px !important;
	}
	.v-tooltip__content::before {
		position: absolute;
		top: -4px;
		left: 50%;
		margin-left: -4px;
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-bottom: 4px solid rgba(51,51,51, 0.9);
		content: " ";
	}
	.v-tooltip__content.top::before {
		top: auto;
		bottom: -7px;
		border-bottom: none;
		border-top: 7px solid rgba(0,0,0, 0.7);
	}
	.v-dialog {
		margin: 12px !important;
	}
	.dialog-transition-enter, .dialog-transition-leave-to {
		transform: scale(0.5);
		opacity: 0;
	}
	.dialog-transition-enter-to, .dialog-transition-leave {
		opacity: 1;
	}
	.v-progress-circular {
		color: #5FAD1B;
	}
	.accent--text {
		color: #5FAD1B !important;
		caret-color: #5FAD1B !important;
	}
	.v-input.v-input--selection-controls {
		margin-top: 0;
		padding-top: 0;
	}
	.v-input--switch {
		display: inline-block !important;
	}
	.v-snack__wrapper.success {
		background-color: #4caf50 !important;
		border-color: #4caf50 !important;
	}
	.v-snack__wrapper.error {
		background-color: #ff5252 !important;
		border-color: #ff5252 !important;
	}
	.v-snack__content {
		box-sizing: border-box;
	}
	.v-menu__activator, .v-menu {
		position: static !important;
	}
	.tab-transition-enter {
		transform: translate(100%, 0);
	}
	.tab-transition-leave,
	.tab-transition-leave-active {
		position: absolute;
		top: 0;
	}
	.tab-transition-leave-to {
		position: absolute;
		transform: translate(-100%, 0);
	}
	.tab-reverse-transition-enter {
		transform: translate(-100%, 0);
	}
	.tab-reverse-transition-leave,
	.tab-reverse-transition-leave-to {
		top: 0;
		position: absolute;
		transform: translate(100%, 0);
	}
	.material-icons {
		font-size: 26px;
	}
	body {
		margin: 0;
		font-family: "Roboto", sans-serif;
		font-size: 15px;
		overflow-y: auto;
		overflow-x: hidden;
		color: #111;
		background: #333;
	}
	::selection {
		background: #61B01C;
		color: white;
	}
	table {
		border-collapse: collapse;
	}
	td {
		padding: 0;
	}
	img {
		border-width: 0;
	}
	h1, h2, h3, h4 {
		font-weight: 400;
		margin: 0;
		color: #777;
	}
	h1 {
		font-size: 25px;
		line-height: 34px;
		display: inline-block;
		height: 36px;
		padding: 0 15px;
		color: white;
		position: relative;
		background: #5FAD1B;
		text-shadow: 0px 2px 3px rgba(0,0,0,0.2), 0px 1px 3px rgba(0,0,0,0.1), 0px 3px 6px rgba(0,0,0,0.1);
		border-top-left-radius: 3px;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	h1 a, h1 a:visited {
		color: white;
	}
	h1::after {
		content: "";
		position: absolute;
		right: -19px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 36px 0 0 19px;
		border-color: transparent transparent transparent #5FAD1B;
	}
	h2 {
		font-size: 25px;
	}
	h3 {
		margin-top: 10px;
		margin-bottom: 10px;
		margin-left: -15px;
		background: #5FAD1B;
		display: inline-block;
		color: white;
		padding: 5px 10px;
		font-size: 18px;
		position: relative;
		height: 22px;
	}
	h3::before {
		content: "";
		position: absolute;
		left: -10px;
		top: 5px;
		width: 10px;
		height: 32px;
		background: #559C18;
	}
	h3::after {
		content: "";
		position: absolute;
		right: -12px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 32px 0 0 12px;
		border-color: transparent transparent transparent #5FAD1B;
	}
	h4 {
		font-size: 18px;
		color: #666;
		font-weight: bold
	}
	a {
		color: #111;
		text-decoration: none;
	}
	a:visited {
		color: #111;
	}
	textarea {
		font-family: "Roboto";
		font-size: 15px;
	}
	[draggable] {
		user-select: none;
	}
	#console {
		position: fixed;
		top: 46px;
		left: 38px;
		cursor: pointer;
		display: none;
		img {
			width: 30px;
			opacity: 0.3;
		}
	}
	#console:hover img {
		opacity: 0.6;
	}
	#app.connected #console {
		display: block;
	}
	#app.app #console {
		display: none;
	}
	#app.app #page {
		padding-bottom: 0;
	}
	#app.app.connected #header {
		display: none;
	}
	#app.app #page-wrapper {
		padding: 0;
	}
	#app.app .panel {
		border-radius: 0;
	}
	#app.app.connected #page .page-bar h1 {
		display: none;
	}
	#menu-mobile {
		display: none;
	}
	#app.app .notifications-button img, #app.app .messages-button img {
		margin: 0;
	}
	#app.app.menu-expanded .menu {
		transform: translateX(0px);
	}
	#app.app #center {
		transition: transform ease 200ms;
	}
	#app.app.menu-expanded #center {
		transform: translateX(250px);
	}
	#app.app #menu-button {
		display: none;
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
	.menu [tab='farmer'] {
		display: none;
	}
	#app.app .menu [tab='farmer'] {
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
	#center {
		padding: 0 20px;
	}
	#app.connected #center,
	#app.connected #footer {
		margin-left: 170px;
	}
	#app.menu-collapsed:not(.app) #center,
	#app.menu-collapsed:not(.app) #footer {
		margin-left: 68px;
	}
	#wrapper {
		max-width: 1100px;
		margin: 0 auto;
	}
	#big-leeks {
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
	#app.connected #big-leeks {
		left: 190px;
	}
	#app.menu-collapsed #big-leeks {
		left: 88px;
	}
	#big-leek-1, #big-leek-2 {
		position: absolute;
		z-index: -10;
	}
	#big-leek-1 {
		left: -205px;
		bottom: 50px;
	}
	#big-leek-2 {
		right: -280px;
		bottom: 50px;
	}

	/* Content of wrapper : the page */
	#page-wrapper {
		background: rgba(80, 80, 80, 0.6);
		padding: 12px;
		padding-bottom: 0;
	}
	#app.app #page-wrapper {
		background: none;
	}
	#page {
		margin-right: -12px;
		min-height: calc(100vh - 244px);
	}
	#app.app #page {
		margin-right: 0;
	}
	#page .page-bar {
		padding-right: 15px;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
	}
	#page .page-bar .info {
		margin-left: 20px;
		color: #eee;
		display: inline-block;
		vertical-align: top;
		font-size: 16px;
		line-height: 36px;
		white-space: nowrap;
	}
	#app.app .page-bar .info {
		display: none;
	}
	.panel {
		background: #f2f2f2;
		border-radius: 4px;
		box-shadow: 0px 10px 11px -11px rgba(0,0,0,0.75);
		margin-right: 12px;
		margin-bottom: 12px;
	}
	#app.app .panel {
		margin-right: 0;
	}
	.panel.first {
		border-top-left-radius: 0px;
	}
	.panel.auto {
		padding: 20px;
	}
	.panel > .header {
		height: 36px;
		background: #2a2a2a;
		position: relative;
		text-align: left;
		border-top-left-radius: 3px;
		border-top-right-radius: 3px;
	}
	#app.app .panel > .header {
		border-radius: 0;
	}
	.panel.first > .header {
		border-top-left-radius: 0px;
	}
	.panel > .header h2 {
		color: #eee;
		font-size: 19px;
		display: inline-block;
		height: 36px;
		line-height: 36px;
		background: rgba(150, 150, 150, 0.5);
		padding: 0 12px;
		position: relative;
		white-space: nowrap;
		border-top-left-radius: 3px;
	}
	.panel > .header h2 a, .panel > .header h2 a:visited {
		color: white;
		font-weight: bold;
	}
	.panel > .header h2 img {
		vertical-align: top;
		height: 25px;
		margin-top: 6px;
		margin-right: 8px;
	}
	.panel.first > .header h2 {
		border-top-left-radius: 0px;
	}
	.panel > .header h2:before {
		content: "";
		position: absolute;
		right: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 36px 0 0 20px;
		border-color: transparent transparent transparent rgba(150, 150, 150, 0.5);
	}
	.panel > .header img {
		max-height: 24px;
		max-width: 24px;
		vertical-align: top;
		opacity: 0.9;
	}
	.panel > .header .right {
		position: absolute;
		top: 0;
		height: 36px;
		right: 0;
		display: flex;
	}
	.panel > .header .right .button {
		height: 36px;
		line-height: 36px;
		padding-top: 0px;
		padding-bottom: 0px;
		color: white;
		background: rgba(0, 0, 0, 0.4);
	}
	.panel > .header .right > div:last-child.button,
	.panel > .header .right > a:last-child .button,
	.panel > .header .right > div:last-child .button
	{
		border-top-right-radius: 3px;
	}
	.panel > .header .right .button img {
		height: 22px;
		width: 22px;
		padding: 7px 3px;
		opacity: 0.9;
	}
	.panel > .header .right .button i {
		padding: 4px 0;
		opacity: 0.9;
		font-size: 28px;
	}
	.panel > .header .right .button:hover {
		background-image: linear-gradient(to bottom, rgba(110, 201, 31, 0.7) 0%, rgba(110, 201, 31, 0.9) 50%, rgba(110, 201, 31, 0.7) 100%);
	}
	.panel > .content {
		padding: 15px;
	}
	.panel.collapsed .content {
		display: none;
	}

	.button {
		display: inline-block;
		position: relative;
		text-align: center;
		padding: 6px 10px;
		font-size: 17px;
		cursor: pointer;
		border: none;
		color: #333;
		background: white;
		user-select: none;
	}
	.button:not(.flat) {
		border-radius: 4px;
		border-bottom: 3px solid #ccc;
	}
	.button.large {
		padding: 6px 26px;
		font-size: 20px;
	}
	.button:not(.disabled):not(.flat):active {
		top: 3px;
		border-bottom: none;
		margin-bottom: 3px;
	}
	.button.disabled {
		background: #777;
		color: white;
		cursor: auto;
	}
	.button.green {
		background: #5FAD1B;
		color: white;
		border-bottom: 3px solid #468014;
	}
	.button:not(.disabled).green:hover {
		background-image: linear-gradient(to bottom, rgba(110, 201, 31, 0.7) 0%, rgba(110, 201, 31, 0.9) 50%, rgba(110, 201, 31, 0.7) 100%);
	}
	.button.red {
		background: #CA0000;
		color: white;
		border-bottom: 3px solid #9E0000;
	}
	.button.red:hover {
		background: #DD0000;
		border-bottom: 3px solid #9E0000;
	}
	.button:not(.flat) i {
		vertical-align: top;
    	margin-top: -3px;
	}
	.center {
		text-align: center;
	}
	.page-header.page-bar .tabs {
		margin-left: 20px;
	}
	.page-bar .tab {
		display: inline-block;
		text-align: center;
		padding: 7px 10px;
		padding-bottom: 11px;
		font-size: 18px;
		height: 18px;
		vertical-align: top;
		margin-right: 20px;
		color: #eee;
		position: relative;
		background: rgba(150, 150, 150, 0.2);
		margin-left: 2px;
	}
	.page-bar .tab:not(.disabled) {
		cursor: pointer;
	}
	.page-bar .tab:not(.disabled):hover {
		background-color: rgba(200, 200, 200, 0.4);
	}
	.page-bar .tab::before {
		content: "";
		position: absolute;
		left: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 20px 36px 0;
		border-color: transparent rgba(150, 150, 150, 0.2) transparent transparent;
	}
	.page-bar .tab:not(.disabled):hover::before {
		border-color: transparent rgba(200, 200, 200, 0.4) transparent transparent ;
	}
	.page-bar .tab::after {
		content: "";
		position: absolute;
		right: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 36px 0 0 20px;
		border-color: transparent transparent transparent rgba(150, 150, 150, 0.2);
	}
	.page-bar .tab:not(.disabled):hover::after {
		border-color: transparent  transparent transparent rgba(200, 200, 200, 0.4);
	}
	.page-bar .tab.selected {
		background-color: rgba(110, 201, 31, 0.8);
		color: #111;
	}
	.page-bar .tab:first-child.selected::before {
		content: "";
		position: absolute;
		left: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 20px 36px 0;
		border-color: transparent rgba(110, 201, 31, 0.8) transparent   transparent ;
	}
	.page-bar .tab:first-child.selected::after {
		content: "";
		position: absolute;
		right: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 36px 0 0 20px;
		border-color: transparent  transparent   transparent rgba(110, 201, 31, 0.8);
	}
	.page-bar .tab span {
		vertical-align: top;
	}
	.page-bar .tab img {
		width: 22px;
		margin-right: 8px;
		margin-top: -1px;
	}
	.page-bar .tab i {
		margin-top: -3px;
		margin-right: 5px;
	}
	.page-bar .tab input[type='text'],
	.page-bar .tab input[type='number']
	{
		vertical-align: top;
		margin-top: -4px;
		background: rgba(0,0,0,0.2);
		color: white;
		border: none;
	}
	.page-bar .tab.green {
		background-color: rgba(95,173,27,0.7);
		color: white;
	}
	.page-bar .tab.green:before {
		border-color: transparent rgba(95,173,27,0.7) transparent transparent;
	}
	.page-bar .tab.green:after {
		border-color: transparent transparent transparent rgba(95,173,27,0.7);
	}
	.page-bar .tab.green:not(.disabled):hover {
		background-color: rgba(95,173,27,0.9);
	}
	.page-bar .tab.green:not(.disabled):hover:before {
		border-color: transparent rgba(95,173,27,0.9) transparent transparent;
	}
	.page-bar .tab.green:not(.disabled):hover:after {
		border-color: transparent transparent transparent rgba(95,173,27,0.9);
	}
	.page-footer .tab:first-child:before {
		border: none;
	}
	.hab {
		width: 18px;
		height: 18px;
		vertical-align: bottom;
		display: inline-block;
		background-image: url('/image/hab.png');
		background-repeat: no-repeat;
		background-position: center;
	}
	.crystal {
		width: 18px;
		height: 40px;
		vertical-align: bottom;
		margin-top: -15px;
		margin-bottom: -10px;
		display: inline-block;
		background-image: url('/image/crystal.png');
		background-repeat: no-repeat;
		background-position: center;
	}
	/* Popups */
	#dark {
		display: none;
		position: fixed;
		top: 0; bottom: 0;
		left: 0; right: 0;
		background: black;
		opacity: 0;
		z-index: 5;
		transition: opacity ease 200ms;
	}
	#app.app #dark {
		top: 56px;
	}
	#dark.visible {
		display: block;
		opacity: 0.6;
	}
	.popup {
		display: none;
		width: 700px;
		box-shadow: 0px 0px 50px #111;
		transition: height ease 0.3s;
		margin-bottom: 50px;
		text-align: left;
	}
	.popup.draggable {
		position: fixed;
		z-index: 600;
		top: 0;
		left: 0;
	}
	.v-dialog > .title {
		background: #2a2a2a;
		color: #eee;
		font-weight: 300;
		padding: 0 10px;
		padding-top: 6px;
		padding-bottom: 4px;
		height: 30px;
		font-size: 23px;
		text-align: left;
		border-top-left-radius: 2px;
		border-top-right-radius: 2px;
	}
	.v-dialog .title .options {
		display: flex;
		float: right;
		cursor: pointer;
		margin-top: -6px;
		margin-bottom: -4px;
		margin-right: -10px;
	}
	.v-dialog .title .options .option {
		background: black;
		height: 26px;
		width: 26px;
		padding: 7px;
	}
	.v-dialog .title .options .option:hover {
		background-image: linear-gradient(to bottom, rgba(110, 201, 31, 0.7) 0%, rgba(110, 201, 31, 0.9) 50%, rgba(110, 201, 31, 0.7) 100%);
	}
	.v-dialog .title .options .option img {
		width: 26px;
		height: 26px;
	}
	.v-dialog.draggable .title {
		cursor: move;
	}
	.v-dialog .content {
		background: rgba(240,240,240, 0.95);
		padding: 15px;
		max-height: 75vh;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.v-dialog.no-actions .content {
		border-bottom-left-radius: 3px;
		border-bottom-right-radius: 3px;
	}
	.v-dialog .actions {
		height: 40px;
		font-weight: 300;
		display: flex;
	}
	.v-dialog .actions div {
		cursor: pointer;
		display: inline-block;
		background: #555;
		color: #eee;
		width: 100%;
		height: 40px;
		text-align: center;
		line-height: 40px;
		font-size: 20px;
	}
	.v-dialog .actions div:not(:last-child)  {
		border-right: 1px solid #777;
	}
	.v-dialog .actions div:hover {
		background: #777;
	}
	.v-dialog .actions div.red {
		background: #c00;
	}
	.v-dialog .actions div.red:hover {
		background: #e00;
	}
	.v-dialog .actions div.green {
		background: #5FAD1B;
	}
	.v-dialog .actions div.green:hover {
		background: #73D120;
	}
	/* Inputs */
	input {
		font-family: "Roboto";
	}
	input[type='text'],
	input[type='number'],
	input[type='password'],
	textarea {
		border:solid 1px #ddd;
		font-size: 15px;
		min-height: 26px;
		padding: 0 4px;
		outline: 0;
	}
	input:active, input:focus {
		outline: none;
	}
	/* Toasts */
	#toasts {
		position: fixed;
		left: 0;
		right: 0;
		z-index: 1000;
		bottom: 100px;
		text-align: center;
		pointer-events: none;
		transition: all 0.6s;
	}
	.toast-wrapper {
		position: relative;
		perspective: 350px;
		transition: all 0.6s;
		transform: scale(0.5,0.5) rotateX(90deg);
		opacity: 0;
		height: 0;
		top: 40px;
	}
	.toast {
		padding: 4px 8px;
		border-radius: 2px;
		font-weight: 300;
		font-size: 18px;
		font-family: "Roboto", sans-serif;
		background: rgba(0,0,0, 0.7);
		color: white;
		display: inline-block;
	}
	.toast-wrapper.visible {
		transform: scale(1,1) rotateX(0deg);
		opacity: 1;
		top: 0;
		height: 36px;
	}
	.link {
		cursor: pointer;
		color: #555;
	}
	.link:hover {
		color: #111;
	}
	.small {
		font-size: 12px;
	}
	.smiley {
		display: inline-block;
		vertical-align: middle;
		margin-top: -2px;
		width: 16px;
		height: 16px;
		float: none;
	}
	.smiley.large {
		width: 30px;
		height: 30px;
		margin-top: 4px;
	}

	/* Dev */
	.dev-label, .beta-label, .local-label {
		font-family: 'Courgette', cursive;
		color: white;
		border-radius: 4px;
		padding: 4px 6px;
		vertical-align: top;
		line-height: 70px;
		margin-left: 10px;
		font-size: 16px;
	}
	.dev-label {
		background: red;
	}
	.beta-label {
		background: #b0b;
	}
	.local-label {
		background: blue;
	}

	/*
	* Couleurs grades
	*/
	.moderator, a.moderator {
		color: #FFA900;
		font-weight: bold;
	}
	.admin, a.admin {
		color: #DF1500;
		font-weight: bold;
	}
	.contributor, a.contributor {
		color: #009c1d;
		font-weight: bold;
	}

	/*
	* Editable area
	*/
	.editable {
		display: inline-block;
	}
	.editable:after {
		content: "";
		display: inline-block;
		opacity: 0.3;
		margin-left: 8px;
		width: 20px;
		height: 20px;
		background-image: url('/image/edit_pen.png');
	}
	.editable:hover:after {
		opacity: 1;
	}

	/* What is it?? */
	#clover {
		position: fixed;
		z-index: 1000;
		cursor: pointer;
	}
	#clover-t {
		margin-top: 4px;
		font-size: 10px;
	}

	.state {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin-left: 8px;
		vertical-align: middle;
		background-image: url('/image/disconnected.png');
	}
	.state.online {
		background-image: url('/image/connected.png');
	}

	#app.sfw {
		background: #eee;
	}
	#app.sfw #page-wrapper, #app.sfw #social-panel .content {
		background: rgba(255,255,255, 0.4);
	}
	#app.sfw h1 {
		background: white;
		color: #777;
		text-shadow: none;
	}
	#app.sfw h1:after {
		border-color: transparent transparent transparent white;
	}
	#app.sfw .panel .header {
		background: white;
	}
	#app.sfw .panel .header h2 {
		background: white;
		color: #777;
	}
	#app.sfw .panel .header h2 a {
		color: #777;
	}
	#app.sfw .panel .header h2:before {
		border-color: transparent transparent transparent white;
	}
	#app.sfw .panel .header .right .button {
		background: white;
		color: #777;
	}
	#app.sfw .panel .header .right .button:hover {
		color: black;
	}
	#app.sfw img, #app.sfw #weapons .weapon img, #app.sfw #chips .chip img, #app.sfw svg {
		opacity: 0.1;
	}
	#app.sfw #logo {
		opacity: 0.3;
	}
	#app.sfw .smiley, #app.sfw #auth-menu img, #app.sfw .hab, #app.sfw .crystal {
		opacity: 0.15;
	}
	#app.sfw .menu {
		background: rgba(255,255,255,0.4);
	}
	#app.sfw .menu .menu-wrapper {
		background: rgba(255,255,255,0.4);
	}
	#app.sfw .menu .section {
		background: white;
		color: #777;
	}
	#app.sfw .menu .menu-top {
		background: white;
		color: #777;
	}
	#app.sfw #xp-bar, #app.sfw .switch-active .switch-switch {
		background: #CAF0CA;
	}
	#app.sfw .switch-active .switch-switch:before {
		border-color: #CAF0CA transparent transparent #CAF0CA;
	}
	#app.sfw #big-leeks {
		display: none;
	}
	#app.sfw .pagination a.current {
		background: none repeat scroll 0% 0% transparent;
		color: grey;
	}
	#app.sfw #forum .message-wrapper {
		background: none repeat scroll 0% 0% transparent;
	}
	#app.sfw #app-bar {
		background: #ddd;
	}
	.card {
		background: white;
		border-radius: 3px;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.changelog_popup.popup a {
		color: #5FAD1B;
	}
	.flex {
		display: flex;
		justify-content: space-between;
	}
	.flex-container {
		display: flex;
		flex-wrap: wrap;
	}
	.flex-container .panel {
		width: 100%;
	}
	.column2 {
		width: 16.666666%;
		display: inline-block;
		vertical-align: top;
	}
	.column3 {
		width: 25%;
		display: inline-block;
		vertical-align: top;
	}
	.column4 {
		width: 33.333333%;
		display: inline-block;
		vertical-align: top;
	}
	.column5 {
		width: 41.6666666%;
		display: inline-block;
		vertical-align: top;
	}
	.column6 {
		width: 50%;
		display: inline-block;
		vertical-align: top;
	}
	.column7 {
		width: 58.3333333%;
		display: inline-block;
	}
	.column8 {
		width: 66.6666666%;
		display: inline-block;
		vertical-align: top;
	}
	.column9 {
		width: 75%;
		display: inline-block;
		vertical-align: top;
	}
	.column10 {
		width: 83.33333333%;
		display: inline-block;
		vertical-align: top;
	}
	.flex-container .column2,
	.flex-container .column3,
	.flex-container .column4,
	.flex-container .column5,
	.flex-container .column6,
	.flex-container .column7,
	.flex-container .column8,
	.flex-container .column9,
	.flex-container .column10 {
		display: flex;
	}

	@media screen and (min-width: 1600px) {
		#app.connected:not(.social-collapsed):not(.app) #center,
		#app.connected:not(.social-collapsed):not(.app) #footer
		{
			margin-right: 400px;
		}
		#app.connected.social-collapsed #center,
		#app.connected.social-collapsed #footer
		{
			margin-right: 30px;
		}
		#app.connected:not(.social-collapsed) #big-leeks {
			right: 420px;
		}
		#app.connected:not(.social-collapsed) #header-farmer .notifications-button,
		#app.connected:not(.social-collapsed) #header-farmer .messages-button
		{
			display: none;
		}
	}

	@media screen and (max-width: 1199px) {
		#header {
			height: auto;
			display: block;
		}
		#header .button-wrapper div {
			width: auto;
			display: block;
		}
		#header .button-wrapper:first-child .header-button:before {
			display: none;
		}
	}
	#app.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow-x: hidden;
	}
	#app.app #center {
		margin: 0;
		padding: 0;
		overflow-y: auto;
	}

	@media screen and (max-width: 999px) {
		#header .header-button {
			padding: 0;
		}
		#page-wrapper {
			padding: 8px;
			padding-bottom: 0;
		}
		.panel > .content {
			padding: 10px;
		}
		#header-left {
			padding: 0;
		}
		.menu {
			width: 68px;
		}
		#menu-button {
			opacity: 0;
		}
		.menu .section {
			height: 46px;
		}
		.menu .section img {
			height: 30px;
			width: 30px;
		}
	}

	#app.app .column2, #app.app .column3, #app.app .column4, #app.app .column5,
	#app.app .column6, #app.app .column7, #app.app .column8, #app.app .column9, #app.app .column10 {
		width: 100%;
	}

	@media screen and (max-width: 599px) {
		#app.connected #center,
		#app.connected #footer
		{
			margin-left: 0;
		}
		#app.connected #header {
			display: none;
		}
		body:not(.connected) #header #logo-wrapper {
			padding-left: 20px;
			padding-right: 20px;
		}
		#center, #footer {
			padding: 0;
		}
		#big-leeks {
			display: none;
		}
	}

	.striked {
		position: absolute;
	}
	.striked:after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		z-index: 1;
		background-image: -webkit-gradient(linear, 0 0, 100% 100%, color-stop(.25, rgba(255, 255, 255, .25)),
			color-stop(.25, transparent), color-stop(.5, transparent), color-stop(.5, rgba(255, 255, 255, .25)),
			color-stop(.75, rgba(255, 255, 255, .25)), color-stop(.75, transparent), to(transparent) );
		background-size: 50px 50px;
		border-top-left-radius: 20px;
		border-bottom-left-radius: 20px;
		overflow: hidden;
	}
	.rounded4 {
		border-radius: 4px;
	}

	/*
	* Report
	*/
	.report-popup .report-message {
		width: calc(100% - 10px);
		max-width: calc(100% - 10px);
		margin-top: 6px;
		min-height: 70px;
	}

	/*
	* Leek characteristics colors
	*/
	.color-life {
		color: red;
	}
	.color-strength {
		color: #833100;
	}
	.color-wisdom {
		color: #5ebe00;
	}
	.color-agility {
		color: #0080F7;
	}
	.color-resistance {
		color: #FF4A01;
	}
	.color-frequency {
		color: black;
	}
	.color-science {
		color: #0000a2;
	}
	.color-magic {
		color: #b800b6;
	}
	.color-tp {
		color: #FF7F01;
	}
	.color-mp {
		color: #00A900;
	}

	.scroll-x {
		overflow-x: auto;
		overflow-y: hidden;
	}

	.v-dialog.console {
		position: fixed;
		top: calc(50% - 200px);
		left: calc(50% - 300px);
		width: 600px;
		z-index: 600;
		transition: none;
	}

	code {
		font-family: monospace;
		white-space: pre;
	}
	#app.app pre.code {
		margin-left: -15px;
		margin-right: -20px;
	}
	pre.code {
		overflow: auto;
		word-break: break-all;
		padding: 6px;
		margin: 6px 0;
		border: 6px solid #F7F7F7;
		overflow-x: auto;
		background: white;
		line-height: 25px;
	}
	pre.code /deep/ .line-number {
		color: #666;
		display: block;
		user-select: none;
		float: left;
		background: #F7F7F7;
		text-align: right;
		padding: 6px 0;
		margin-top: -6px;
		margin-bottom: -6px;
		margin-left: -6px;
		margin-right: 6px;
	}
	pre.code /deep/ .line-number span {
		display: block;
		padding: 0px 6px;
	}
	pre.code /deep/ .cl {
		display: block;
		clear: both;
	}
	#app.app .page-bar .action {
		display: none;
	}
</style>