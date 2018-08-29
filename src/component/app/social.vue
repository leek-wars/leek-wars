<template>
	<div>
		<div v-if="$store.getters.connected" class="social-button" @click="toggleSocial">
			<i v-if="LeekWars.socialCollapsed" class="icon material-icons">navigate_before</i>
			<i v-else class="icon material-icons">navigate_next</i>
		</div>
		
		<div :style="{width: panelWidth + 'px'}" class="social-panel">
			<div class="content">
		
				<div class="resizer" @mousedown="resizerMousedown"></div>
		
				<div :class="{collapsed: !panels.notifications.opened}" class="panel notifications">
					<div class="header">
						<h2>
							<router-link to="/notifications">{{ $t('main.notifications') }}</router-link>
							<span v-show="$store.state.unreadNotifications" class="label">{{ $store.state.unreadNotifications }}</span>
						</h2>
						<div class="right">
							<div class="button flat expand" @click="togglePanel('notifications')">
								<i v-if="panels.notifications.opened" class="material-icons">expand_more</i>
								<i v-else class="material-icons">expand_less</i>
							</div>
						</div>
					</div>
					<div v-autostopscroll class="content">
						<notification v-for="notification in $store.state.notifications" :key="notification.id" :notification="notification" @click.native="readNotification(notification)" />
					</div>
				</div>
		
				<div :class="{collapsed: !panels.messages.opened}" class="panel expanded messages">
					<div class="header">
						<h2>
							<router-link to="/messages">{{ $t('main.messages') }}</router-link>
							<span v-show="$store.state.unreadMessages" class="label">{{ $store.state.unreadMessages }}</span>
						</h2>
						<div class="right">
							<div class="button flat expand" @click="togglePanel('messages')">
								<i v-if="panels.messages.opened" class="material-icons">expand_more</i>
								<i v-else class="material-icons">expand_less</i>
							</div>
						</div>
					</div>
					<div v-autostopscroll class="content">
						<router-link v-for="conversation in $store.state.conversationsList" :key="conversation.id" :to="'/messages/conversation/' + conversation.id">
							<conversation :conversation="conversation" />
						</router-link>
					</div>
				</div>

				<div :class="{collapsed: !panels.chat.opened}" class="social-chat panel expanded" panel="chat">
					<div class="header">
						<h2>
							<router-link to="/chat">Chat</router-link>
							<v-menu offset-y>
								<img slot="activator" :src="chatLanguage.flag" class="language-button">
								<v-list :dense="true">
									<v-list-tile v-for="(language, i) in LeekWars.languages" :key="i" @click="chatLanguage = language">
										<v-list-tile-title class="language">
											<img :src="language.flag" class="flag">
											<span class="name">{{ language.name }}</span>
										</v-list-tile-title>
									</v-list-tile>
								</v-list>
							</v-menu>
						</h2>
						<div class="right">
							<div class="button flat expand" @click="togglePanel('chat')">
								<i v-if="panels.chat.opened" class="material-icons">expand_more</i>
								<i v-else class="material-icons">expand_less</i>
							</div>
						</div>
					</div>
					<div class="content">
						<chat :channel="chatLanguage.code" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang='ts'>
	import { Language, LeekWars } from '@/model/leekwars'
	import { Notification } from '@/model/notification'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'lw-social' })
	export default class Social extends Vue {
		chatLanguage: Language | null = null
		panels: {[key: string]: any} = {notifications: {opened: true}, messages: {opened: true}, chat: {opened: true}}
		panelWidth: number = 400
		created() {
			this.chatLanguage = LeekWars.languages[this.$i18n.locale]
			for (const panel in this.panels) {
				if (this.panels.hasOwnProperty(panel)) {
					this.panels[panel].opened = localStorage.getItem('main/' + panel + '-collapsed') !== 'true'
				}
			}
			if (localStorage.getItem('main/social-collapsed') === 'true') {
				LeekWars.socialCollapsed = true
			}
			const width = localStorage.getItem('main/social-width')
			if (width) {
				this.panelWidth = parseInt(width, 10)
			}
		}
		togglePanel(panel: string) {
			this.panels[panel].opened = !this.panels[panel].opened
			localStorage.setItem('main/' + panel + '-collapsed', '' + !this.panels[panel].opened)
		}
		toggleSocial() {
			LeekWars.socialCollapsed = !LeekWars.socialCollapsed
			localStorage.setItem('main/social-collapsed', '' + LeekWars.socialCollapsed)
		}
		resizerMousedown(e: MouseEvent) {
			const startWidth = this.panelWidth
			const startX = e.clientX
			const mousemove: any = (ev: MouseEvent) => {
				this.panelWidth = Math.max(400, Math.min(800, startWidth + startX - ev.clientX))
				localStorage.setItem('main/social-width', '' + this.panelWidth)
			}
			const mouseup: any = (ev: MouseEvent) => {
				document.documentElement.removeEventListener('mousemove', mousemove)
				document.documentElement.removeEventListener('mouseup', mouseup)
			}
			document.documentElement.addEventListener('mousemove', mousemove, false)
			document.documentElement.addEventListener('mouseup', mouseup, false)
			e.preventDefault()
		}
		readNotification(notification: Notification) {
			LeekWars.post('notification/read', {notification_id: notification.id})
		}
	}
</script>

<style lang='scss' scoped>
	@media screen and (max-width: 1599px) {
		.social-panel {
			display: none;
		}
		.social-button {
			display: none;
		}
	}
	.social-panel {
		width: 380px;
		position: fixed;
		top: 80px;
		bottom: 0;
		right: 0;
		z-index: 300;
	}
	#app:not(.connected) .social-panel {
		display: none;
	}
	#app.social-collapsed .social-panel {
		display: none;
	}
	.social-button {
		position: fixed;
		top: 46px;
		right: 0;
		background: rgba(80, 80, 80, 0.6);
		width: 30px;
		height: 30px;
		cursor: pointer;
		.icon {
			width: 30px;
			height: 30px;
			color: white;
			font-size: 30px;
		}
	}
	.social-button:hover {
		background: rgba(200, 200, 200, 0.4);
		.icon {
			opacity: 1.0;
		}
	}
	.social-panel > .content {
		background: rgba(80, 80, 80, 0.6);
		padding-top: 12px;
		padding-left: 12px;
		padding-bottom: 12px;
		margin-right: -15px;
		position: relative;
	}
	.resizer {
		position: absolute;
		left: -5px;
		top: 0;
		bottom: 0;
		width: 20px;
		cursor: col-resize;
	}
	.header .label {
		background: #5FAD1B;
		color: white;
		border-radius: 5px;
		margin-left: 8px;
		margin-right: -6px;
		margin-bottom: 2px;
		padding: 1px 5px;
		line-height: normal;
		font-size: 16px;
		z-index: 1000;
		vertical-align: middle;
	}
	.notifications .content, .messages .content {
		padding: 0;
		height: 200px;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.chat {
		height: 250px;
	}
	.social-chat .content {
		padding: 0;
	}
	.social-chat .panel {
		margin-bottom: 0;
	}
	.social-chat .language-button {
		height: 28px;
		max-height: 28px;
		max-width: none;
		padding: 5px;
		margin-left: 4px;
		margin-right: -10px;
		margin-top: -2px;
	}
	.social-chat .languages {
		padding: 0 5px;
	}
	.flag {
		height: 28px;
	}
	.language {
		display: flex;
		align-items: center;
	}
	.language .name {
		padding-left: 8px;
	}
	.social-panel > .content > div {
		margin-bottom: 12px;
	}
	.social-panel .content > div:last-child {
		margin-bottom: 0;
	}
</style>