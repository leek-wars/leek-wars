<template>
	<div v-show="!LeekWars.mobile">
		<div v-if="$store.state.connected" class="social-button" @click="toggleSocial">
			<i v-if="LeekWars.socialCollapsed" class="icon material-icons">navigate_before</i>
			<i v-else class="icon material-icons">navigate_next</i>
		</div>
		
		<div :style="{width: panelWidth + 'px'}" class="social-panel">
			<div class="content">
		
				<div class="resizer" @mousedown="resizerMousedown"></div>
		
				<panel toggle="social/notifications">
					<h2 slot="title">
						<router-link to="/notifications">{{ $t('main.notifications') }}</router-link>
						<span v-show="$store.state.unreadNotifications" class="label">{{ $store.state.unreadNotifications }}</span>
					</h2>
					<div slot="content" v-autostopscroll class="content-limit">
						<notification v-for="notification in $store.state.notifications" :key="notification.id" :notification="notification" @click.native="readNotification(notification)" />
					</div>
				</panel>
		
				<panel v-if="env.SOCIAL" toggle="social/messages">
					<h2 slot="title">
						<router-link to="/messages">{{ $t('main.messages') }}</router-link>
						<span v-show="$store.state.unreadMessages" class="label">{{ $store.state.unreadMessages }}</span>
					</h2>
					<div slot="content" v-autostopscroll class="content-limit">
						<router-link v-for="conversation in $store.state.conversationsList" :key="conversation.id" :to="'/messages/conversation/' + conversation.id">
							<conversation :conversation="conversation" />
						</router-link>
					</div>
				</panel>

				<panel v-if="env.SOCIAL" class="social-chat" toggle="social/chat">
					<h2 slot="title">
						<router-link to="/chat">Chat</router-link>
						<v-menu offset-y>
							<template v-slot:activator="{ on }">
								<img :src="chatLanguage.flag" class="language-button" v-on="on">
							</template>
							<v-list :dense="true">
								<v-list-item v-for="(language, i) in LeekWars.languages" :key="i" class="language" @click="chatLanguage = language">
									<img :src="language.flag" class="flag">
									<span class="name">{{ language.name }}</span>
								</v-list-item>
							</v-list>
						</v-menu>
					</h2>
					<div slot="actions">
						<div class="button text" @click="LeekWars.addChat(chatLanguage.code, ChatType.GLOBAL, 'Chat ' + chatLanguage.code.toUpperCase())">
							<i class="material-icons">picture_in_picture_alt</i>
						</div>
					</div>
					<chat slot="content" :channel="chatLanguage.code" />
				</panel>
			</div>
		</div>
	</div>
</template>

<script lang='ts'>
	import { ChatType } from '@/model/chat'
	import { Language, LeekWars } from '@/model/leekwars'
	import { Notification } from '@/model/notification'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'lw-social' })
	export default class Social extends Vue {
		ChatType = ChatType
		chatLanguage: Language | null = null
		panelWidth: number = 400
		created() {
			this.chatLanguage = LeekWars.languages[this.$i18n.locale]
			if (localStorage.getItem('main/social-collapsed') === 'true') {
				LeekWars.socialCollapsed = true
			}
			const width = localStorage.getItem('main/social-width')
			if (width) {
				this.panelWidth = parseInt(width, 10)
			}
		}
		toggleSocial() {
			LeekWars.socialCollapsed = !LeekWars.socialCollapsed
			localStorage.setItem('main/social-collapsed', '' + LeekWars.socialCollapsed)
			this.$root.$emit('resize')
		}
		resizerMousedown(e: MouseEvent) {
			const startWidth = this.panelWidth
			const startX = e.clientX
			const mousemove: any = (ev: MouseEvent) => {
				this.panelWidth = Math.max(400, Math.min(800, startWidth + startX - ev.clientX))
				localStorage.setItem('main/social-width', '' + this.panelWidth)
			}
			const mouseup: any = (ev: MouseEvent) => {
				document.documentElement!.removeEventListener('mousemove', mousemove)
				document.documentElement!.removeEventListener('mouseup', mouseup)
			}
			document.documentElement!.addEventListener('mousemove', mousemove, false)
			document.documentElement!.addEventListener('mouseup', mouseup, false)
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
		padding-right: 3px;
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
		user-select: none;
		.icon {
			width: 30px;
			height: 30px;
			color: white;
			font-size: 30px;
		}
	}
	.social-button:hover {
		background: rgba(200, 200, 200, 0.4);
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
		background: #5fad1b;
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
	.content-limit {
		padding: 0;
		max-height: 200px;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.chat {
		height: 300px;
	}
	.social-chat .content {
		padding: 0;
	}
	.social-chat .panel {
		margin-bottom: 0;
	}
	.social-chat .language-button {
		cursor: pointer;
		height: 38px;
		max-height: 38px;
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