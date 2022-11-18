<template lang="html">
	<div v-if="LeekWars.header" class="header">
		<div class="header-left">
			<router-link to="/">
				<div class="logo-wrapper">
					<img class="logo" src="/image/leekwars.svg">
					<span v-if="LeekWars.LOCAL" class="local-label">local</span>
					<span v-else-if="LeekWars.DEV" class="dev-label">dev</span>
					<span v-if="env.BETA" class="beta-label">Bêta</span>
				</div>
			</router-link>
		</div>
		<div class="header-right">
			<div v-if="!$store.state.connected" class="header-signin buttons">
				<v-menu offset-y>
					<template v-slot:activator="{ on }">
						<div class="button-wrapper" v-on="on">
							<div class="header-button">
								<img :src="'/image/flag/' + ($i18n.locale === 'fr' ? 'fr' : 'gb') + '.png'" class="language-button">
							</div>
						</div>
					</template>
					<v-list :dense="true">
						<v-list-item v-for="(language, i) in LeekWars.languages" :key="i" class="language" @click="LeekWars.setLocale(language.code)">
							<img :src="language.flag" class="flag">
							<span class="name">{{ language.name }}</span>
						</v-list-item>
					</v-list>
				</v-menu>
				<div class="button-wrapper">
					<router-link to="/login">
						<div class="header-button">
							<v-icon>mdi-power</v-icon>
							<span>{{ $t('main.connection') }}</span>
						</div>
					</router-link>
				</div>
				<div v-if="env.SIGN_UP" class="button-wrapper">
					<router-link to="/">
						<div class="signup-button header-button">
							<v-icon>mdi-account-plus</v-icon>
							<span>{{ $t('main.signup') }}</span>
						</div>
					</router-link>
				</div>
			</div>
			<div v-if="$store.state.farmer" class="header-farmer buttons">
				<!--
				<div class="button-wrapper">
					<div class="header-button" @click="LeekWars.setLocale($i18n.locale === 'fr' ? 'en' : 'fr')">
						{{ $i18n.locale }}
					</div>
				</div>
				-->
				<div v-if="env.BANK && $store.state.farmer.verified" class="button-wrapper">
					<router-link to="/bank">
						<div v-if="$store.state.farmer" class="header-button">
							<span class="farmer-crystals text">{{ Math.round($store.state.farmer.animated_crystals) | number }}</span>
							<span class="crystal text"></span>
							<span v-if="$store.state.farmer.animated_crystals < $store.state.farmer.crystals" class="crystal win"></span>
							<span v-else-if="$store.state.farmer.animated_crystals > $store.state.farmer.crystals" class="crystal lose"></span>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<router-link to="/market">
						<div v-if="$store.state.farmer" class="header-button">
							<span class="farmer-habs text">{{ Math.round($store.state.farmer.animated_habs) | number }}</span>
							<span class="hab text"></span>
							<span v-if="$store.state.farmer.animated_habs < $store.state.farmer.habs" class="hab win"></span>
							<span v-else-if="$store.state.farmer.animated_habs > $store.state.farmer.habs" class="hab lose"></span>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<router-link to="/garden">
						<div class="header-button fights-button">
							<span v-if="$store.state.farmer" class="farmer-fights text">{{ $store.state.farmer.fights | number }}</span>
							<img src="/image/icon/garden.png">
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<v-menu v-if="env.SOCIAL" :nudge-bottom="3" :width="400" :max-height="400" bottom offset-y>
						<template v-slot:activator="{ on }">
							<div class="header-button messages-button" v-on="on">
								<v-icon>mdi-email-outline</v-icon>
								<span v-show="$store.state.unreadMessages > 0" class="counter">{{ $store.state.unreadMessages }}</span>
							</div>
						</template>
						<div class="dialog">
							<div class="dialog-items">
								<router-link v-for="chat in $store.state.conversationsList" :key="chat.id" :to="'/messages/conversation/' + chat.id">
									<conversation :chat="chat" />
								</router-link>
							</div>
							<router-link to="/messages" class="see-all">{{ $t('main.all_private_messages') }}</router-link>
						</div>
					</v-menu>
				</div>
				<div class="button-wrapper">
					<v-menu :nudge-bottom="3" :width="400" :max-height="400" bottom offset-y @input="readNotifications">
						<template v-slot:activator="{ on }">
							<div class="header-button notifications-button" v-on="on">
								<v-icon>mdi-bell-outline</v-icon>
								<span v-show="$store.state.unreadNotifications > 0" class="counter">{{ $store.state.unreadNotifications }}</span>
							</div>
						</template>
						<div class="dialog">
							<div class="dialog-items">
								<notification v-for="notification in $store.state.notifications" :key="notification.id" :notification="notification" />
							</div>
							<router-link to="/notifications" class="see-all">{{ $t('main.all_notifications') }}</router-link>
						</div>
					</v-menu>
				</div>
				<div class="button-wrapper">
					<router-link to="/settings">
						<div class="settings-button header-button">
							<v-icon>mdi-settings-outline</v-icon>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<router-link to="/farmer">
						<div class="header-button">
							<span v-if="$store.state.farmer" class="farmer-name text">{{ $store.state.farmer.name }}</span>
							<avatar :farmer="$store.state.farmer" />
						</div>
					</router-link>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Notification } from '@/model/notification'
	import { Component, Vue } from 'vue-property-decorator'
	const ConversationElement = () => import('@/component/messages/conversation.vue')

	@Component({ name: 'lw-header', components: { 'conversation': ConversationElement } })
	export default class Header extends Vue {

		readNotifications() {
			if (this.$store.state.unreadNotifications) {
				LeekWars.post('notification/read-all')
				this.$store.commit('read-notifications')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.logo {
		width: 100%;
		max-width: 320px;
		max-height: 45px;
		margin: 0px;
		margin-top: 15px;
		margin-bottom: 10px;
	}
	.avatar {
		height: 42px;
		width: 42px;
		margin-left: 8px;
		margin-right: -4px;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 80px;
	}
	.header .fights-button img {
		height: 20px;
		width: 20px;
		margin: -4px 0;
		opacity: 0.8;
	}
	.header-left {
		padding-right: 20px;
	}
	.logo-wrapper {
		white-space: nowrap;
	}
	.header .buttons {
		padding-bottom: 4px;
		display: flex;
	}
	.header .button-wrapper {
		flex-grow: 1;
	}
	.header .header-signin {
		padding-bottom: 5px;
		text-align: right;
	}
	.header .header-button {
		display: inline-flex;
		cursor: pointer;
		text-align: center;
		padding: 0 4px;
		line-height: 42px;
		font-size: 17px;
		height: 42px;
		margin-left: 25px;
		color: #eee;
		position: relative;
		background: rgba(80, 80, 80, 0.6);
		vertical-align: bottom;
		white-space: nowrap;
		user-select: none;
		align-items: center;
		line-height: 42px;
		i {
			color: #eee;
			font-size: 26px;
		}
	}
	.header-button i {
		vertical-align: text-bottom;
		padding-right: 3px;
	}
	.header .button-wrapper:first-child .header-button {
		margin-left: 0;
	}
	.header-farmer .button-wrapper:first-child .header-button {
		padding-left: 10px;
	}
	.header-signin .button-wrapper:last-child .header-button {
		padding-right: 12px;
	}
	.header .header-button .text {
		line-height: 42px;
		height: 42px;
		display: inline-block;
		vertical-align: top;
		padding-right: 3px;
	}
	.header .header-button .crystal {
		vertical-align: bottom;
		margin-bottom: -13px;
	}
	.signup-button {
		padding-right: 20px;
	}
	.header-button:not(.mobile):before {
		content: "";
		position: absolute;
		left: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 0 42px 20px;
		border-color: transparent transparent rgba(80, 80, 80, 0.6) transparent;
	}
	.header-button:not(.mobile):after {
		content: "";
		position: absolute;
		z-index: -1;
		right: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 42px 20px 0 0;
		border-color: rgba(80, 80, 80, 0.6) transparent transparent transparent;
	}
	.header .button-wrapper:last-child .header-button:after {
		border: none;
	}
	.header .header-button:hover {
		background: rgba(200, 200, 200, 0.4);
	}
	.header .header-button:hover:before {
		border-color: transparent transparent rgba(200, 200, 200, 0.4) transparent;
	}
	.header .header-button:hover:after {
		border-color: rgba(200, 200, 200, 0.4) transparent transparent transparent;
	}
	.farmer-avatar {
		height: 42px;
		width: 42px;
		margin-left: 8px;
		margin-right: -4px;
	}
	.settings-button img, .notifications-button img, .messages-button img {
		height: 26px;
		width: 26px;
		margin: 8px 0;
		opacity: 0.8;
	}
	.messages-button,
	.notifications-button {
		position: relative;
	}
	.counter {
		position: absolute;
		top: -2px;
		right: -6px;
		background: #5fad1b;
		padding: 4px 5px;
		color: white;
		border-radius: 5px;
		height: 20px;
		line-height: 12px;
	}
	.dialog {
		background: #f2f2f2;
	}
	.dialog-items {
		width: 400px;
		max-height: 350px;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.see-all {
		padding: 8px;
		display: block;
		text-align: center;
		color: #777;
	}
	.see-all:hover {
		background: white;
	}

	@media screen and (min-width: 1600px) {
		#app.connected:not(.social-collapsed) .header-farmer .notifications-button,
		#app.connected:not(.social-collapsed) .header-farmer .messages-button {
			display: none;
		}
	}
	@media screen and (max-width: 1199px) {
		.header {
			height: auto;
			display: block;
		}
		.header .button-wrapper div {
			width: auto;
			display: flex;
			justify-content: center;
			flex: 1;
		}
		.header .button-wrapper:first-child .header-button:before {
			display: none;
		}
	}
	@media screen and (max-width: 999px) {
		.header .header-button {
			padding: 0;
		}
		.header-left {
			padding: 0;
		}
	}
	@media screen and (max-width: 599px) {
		#app.connected .header {
			display: none;
		}
		#app:not(.connected) .header .logo-wrapper {
			padding-left: 20px;
			padding-right: 20px;
		}
	}
	.language-button {
		height: 26px;
	}
	.language .flag {
		height: 26px;
		margin-right: 8px;
	}
	.win {
		position: absolute;
		animation: win 0.15s infinite;
		margin-top: 0;
		right: 4px;
	}
	@keyframes win {
		0% { margin-top: -120px; }
		100% { margin-top: 0; }
	}
	.lose {
		position: absolute;
		animation: lose 0.25s infinite;
		margin-top: 0;
		right: 4px;
	}
	@keyframes lose {
		0% { margin-top: 0; opacity: 1; }
		100% { margin-top: 100px; opacity: 0; }
	}
</style>
