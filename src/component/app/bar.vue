<template>
	<div :class="{subtitle: LeekWars.subtitle}" class="app-bar">
		<div v-ripple :class="{back: LeekWars.splitBack}" class="menu-button" @click="mainButton">
			<div>
				<div class="bar"></div>
				<div class="bar"></div>
				<div class="bar"></div>
			</div>
		</div>
		<div class="title-wrapper" @click="LeekWars.toggleMenu">
			<div class="title">{{ LeekWars.title }}</div>
			<div v-show="LeekWars.subtitle" class="subtitle">{{ LeekWars.subtitle }}</div>
		</div>
		<div class="actions-wrapper">
			<div class="static-actions">
				<div v-ripple v-show="LeekWars.menuExpanded || $store.state.unreadMessages > 0" class="action header-button mobile messages-button" @click="$router.push('/messages'); LeekWars.toggleMenu()">
					<i class="icon material-icons">chat</i>
					<span v-show="$store.state.unreadMessages > 0" class="counter messages-counter">{{ $store.state.unreadMessages }}</span>
				</div>
				<div v-ripple v-show="LeekWars.menuExpanded || $store.state.unreadNotifications > 0" class="action header-button mobile notifications-button">
					<v-menu :nudge-bottom="5" :min-width="400" :max-width="400" :max-height="400" bottom offset-y @input="readNotifications">
						<div slot="activator" class="header-button notifications-button">
							<i class="icon material-icons">info</i>
							<span v-show="$store.state.unreadNotifications > 0" class="counter notifications-counter">{{ $store.state.unreadNotifications }}</span>
						</div>
						<div class="dialog">
							<div class="dialog-items">
								<notification v-for="notification in $store.state.notifications" :key="notification.id" :notification="notification" @click.native="readNotification(notification)" />
							</div>
							<router-link to="/notifications" class="see-all">{{ $t('main.all_notifications') }}</router-link>
						</div>
					</v-menu>
				</div>
				<router-link v-ripple v-show="LeekWars.menuExpanded" to="/settings" class="action header-button mobile settings" @click.native="closeMenu">
					<i class="icon material-icons">settings</i>
				</router-link>
			</div>
			<div v-show="!LeekWars.menuExpanded" class="actions">
				<div v-ripple v-for="(action, a) in LeekWars.actions" :key="a" class="tab action" @click="action.click($event)">
					<i v-if="action.icon" class="action material-icons">{{ action.icon }}</i>
					<img v-else :src="'/image/' + action.image" class="action">
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	@Component({ name: 'lw-bar' })
	export default class Bar extends Vue {
		mainButton() {
			if (LeekWars.menuExpanded || !LeekWars.splitBack) {
				LeekWars.toggleMenu()
			} else {
				this.$root.$emit('back')
			}
		}
		closeMenu() {
			LeekWars.menuExpanded = false
			LeekWars.dark = 0
		}
		readNotifications(e: any) {
			if (e === false && this.$store.state.unreadNotifications) {
				LeekWars.post('notification/read-all')
				this.$store.commit('read-notifications')
			}
		}
		readNotification(notification: any) {
			LeekWars.post('notification/read', {notification_id: notification.id})
		}
	}
</script>

<style lang="scss" scoped>
	.app-bar {
		flex: 0 0 56px;
		background: #4b9e06;
		color: white;
		line-height: 55px;
		font-size: 18px;
		overflow: hidden;
		text-overflow: ellipsis;
		word-break: break-all;
		white-space: nowrap;
		display: flex;
		box-shadow: 0 2px 2px 0 rgba(0,0,0,.07);
	}
	#app:not(.connected) .app-bar {
		display: none;
	}
	.app-bar .menu-button {
		width: 27px;
		padding: 14px 20px;
		padding-right: 14px;
		margin-right: 4px;
	}
	.app-bar .menu-button .bar {
		width: 20px;
		height: 2px;
		border-radius: 2px;
		margin: 5px 0;
		background: white;
		transition: all ease 400ms;
	}
	.app-bar .menu-button.back .bar:first-child {
		transform: translateY(2px) rotate(-38deg);
	}
	.app-bar .menu-button.back .bar:nth-child(2) {
		opacity: 0;
	}
	.app-bar .menu-button.back .bar:last-child {
		transform: rotate(38deg);
	}
	#app.app.menu-expanded .app-bar .menu-button .bar:first-child {
		transform: translateY(7px) rotate(45deg);
	}
	#app.app.menu-expanded .app-bar .menu-button .bar:nth-child(2) {
		opacity: 0;
	}
	#app.app.menu-expanded .app-bar .menu-button .bar:last-child {
		transform: translateY(-7px) rotate(-45deg);
	}
	.app-bar .title-wrapper {
		flex: 1;
		text-overflow: ellipsis;
		overflow-x: hidden;
	}
	.app-bar .title {
		text-overflow: ellipsis;
		overflow-x: hidden;
	}
	.app-bar.subtitle .title {
		line-height: 25px;
		padding-top: 7px;
		font-weight: bold;
	}
	.app-bar .subtitle {
		text-overflow: ellipsis;
		overflow-x: hidden;
		line-height: 15px;
		font-size: 12px;
		display: none;
	}
	.app-bar.subtitle .subtitle {
		display: block;
	}
	.app-bar .actions-wrapper {
		padding-right: 4px;
	}
	.app-bar .actions, .app-bar .static-actions {
		display: inline-block;
	}
	#app.app.menu-expanded .app-bar .static-actions .action {
		display: inline-block;
	}
	.action {
		display: inline-block;
		line-height: normal;
		vertical-align: top;
		position: relative;
	}
	.action i {
		padding: 15px 14px;
		color: white;
	}
	.action img {
		width: 26px;
		opacity: 1;
		padding: 15px 14px;
	}
	.app-bar.content .action.list:not(.content),
	.app-bar.list .action.content:not(.list),
	.app-bar .action.hidden {
		display: none;
	}
	.app-bar .action.visible {
		display: inline-block;
	}
	.counter {
		position: absolute;
		top: 7px;
		right: 5px;
		padding: 4px 3px;
		background: #ff6f00;
		color: #fff;
		border-radius: 5px;
		height: 12px;
		line-height: 12px;
	}
	.dialog {
		background: #f2f2f2;
	}
	.dialog-items {
		max-height: 350px;
		overflow-y: auto;
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
</style>