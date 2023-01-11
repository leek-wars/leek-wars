<template>
	<div v-if="$store.state.farmer && !LeekWars.mobile">
		<div class="blabla-button" @click="toggleSocial">
			<v-icon v-if="LeekWars.socialCollapsed">mdi-chevron-left</v-icon>
			<v-icon v-else>mdi-chevron-right</v-icon>
		</div>

		<div :style="{width: panelWidth + 'px'}" class="blabla-panel">
			<div class="content">

				<div class="resizer" @mousedown="resizerMousedown"></div>

				<panel v-if="$store.state.notifications.length" toggle="social/notifications" icon="mdi-bell-outline">
					<template slot="title">
						<router-link v-ripple class="title" to="/notifications">
							{{ $t('main.notifications') }}
							<span v-show="$store.state.unreadNotifications" class="label">{{ $store.state.unreadNotifications }}</span>
						</router-link>
					</template>
					<div slot="actions" class="actions">
						<div v-if="$store.state.unreadNotifications" class="button text" @click="readAllNotifications">
							<v-icon>mdi-check-all</v-icon>
						</div>
					</div>
					<div slot="content" v-autostopscroll class="content-limit">
						<notification v-for="notification in $store.state.notifications" :key="notification.id" :notification="notification" @click.native="readNotification(notification)" />
					</div>
				</panel>

				<panel v-if="env.SOCIAL && $store.state.farmer.verified && $store.state.conversationsList.length" toggle="social/messages" icon="mdi-email-outline">
					<template slot="title">
						<router-link v-ripple class="title" to="/chat">
							{{ $t('main.messages') }}
							<span v-show="$store.state.unreadMessages" class="label">{{ $store.state.unreadMessages }}</span>
						</router-link>
					</template>
					<div slot="content" v-autostopscroll class="content-limit">
						<router-link v-for="chat in $store.state.conversationsList" :key="chat.id" :to="'/chat/' + chat.id">
							<conversation :chat="chat" />
						</router-link>
					</div>
				</panel>

				<panel v-if="env.SOCIAL" class="blabla-chat" toggle="social/chat" icon="mdi-chat-outline">
					<template slot="title">
						<router-link v-ripple :to="'/chat/' + chatID" class="title">
							{{ $store.state.chat[chat] ? $store.state.chat[chat].name : 'Chat' }} <span v-if="$store.state.farmer.groupe">{{ $store.state.farmer.groupe.name }}</span>
							<span v-if="!$store.state.farmer?.groupe" class="farmer-count">
								<span class="count">({{ $store.state.connected_farmers }} <v-icon class="icon">mdi-account-multiple</v-icon>)</span>
							</span>
						</router-link>
					</template>
					<div slot="actions" class="actions">
						<v-menu v-if="!$store.state.farmer?.groupe" offset-y>
							<template v-slot:activator="{ on }">
								<div class="language-button" v-ripple v-on="on">
									<div class="wrapper">
										<img :src="LeekWars.languages[LeekWars.publicChats[chat].language].flag">
										<div class="unread-circle" v-if="Object.values(LeekWars.publicChats).some(chat => $store.state.chat[chat.id] && !$store.state.chat[chat.id].read)"></div>
									</div>
								</div>
							</template>
							<v-list :dense="true">
								<div v-for="(data, language) in LeekWars.languages" :key="language" class="language">
									<v-list-item v-for="(chat, i) in data.chats" :key="i" class="language" @click="setChatLanguage(chat)">
										<img :src="LeekWars.languages[LeekWars.publicChats[chat].language].flag" class="flag">
										<span class="name">{{ LeekWars.publicChats[chat].name }}</span>
										<span class="unread-circle" v-if="$store.state.chat[chat] && !$store.state.chat[chat].read"></span>
									</v-list-item>
								</div>
							</v-list>
						</v-menu>
						<div v-if="$store.state.chat[chatID]" class="button text" @click="LeekWars.addChat($store.state.chat[chatID])">
							<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
						</div>
					</div>
					<chat :id="chatID" slot="content" />
				</panel>
			</div>
		</div>
	</div>
</template>

<script lang='ts'>
	const ChatElement = () => import(/* webpackChunkName: "chat" */ `@/component/chat/chat.vue`)
	import { ChatType } from '@/model/chat'
	import { Language, LeekWars } from '@/model/leekwars'
	import { Notification } from '@/model/notification'
	import { Component, Vue } from 'vue-property-decorator'
	import ConversationElement from '@/component/messages/conversation.vue'
	import { store } from '@/model/store'

	@Component({ name: 'lw-social', components: { chat: ChatElement, 'conversation': ConversationElement } })
	export default class Social extends Vue {

		ChatType = ChatType
		chat: number | null = null
		panelWidth: number = 400

		get chatID() {
			if (store.state.farmer && store.state.farmer.groupe) {
				return store.state.farmer.groupe.chat
			}
			return this.chat
		}

		created() {
			this.chat = parseInt(localStorage.getItem('social/chat') || '0') || LeekWars.languages[this.$i18n.locale].chat
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

		readAllNotifications() {
			LeekWars.post('notification/read-all')
		}

		setChatLanguage(chat: number) {
			this.chat = chat
			localStorage.setItem('social/chat', '' + chat)
		}
	}
</script>

<style lang='scss' scoped>
	@media screen and (max-width: 1599px) {
		.blabla-panel {
			display: none;
		}
		.blabla-button {
			display: none;
		}
	}
	.blabla-panel {
		width: 380px;
		position: fixed;
		top: 80px;
		bottom: 0;
		right: 0;
	}
	#app:not(.connected) .blabla-panel {
		display: none;
	}
	#app.social-collapsed .blabla-panel {
		display: none;
	}
	.blabla-button {
		position: fixed;
		top: 46px;
		right: 0;
		background: rgba(80, 80, 80, 0.6);
		width: 30px;
		height: 30px;
		cursor: pointer;
		user-select: none;
		.v-icon {
			width: 30px;
			height: 30px;
			color: white;
			font-size: 30px;
		}
	}
	.blabla-button:hover {
		background: rgba(200, 200, 200, 0.4);
	}
	.blabla-panel > .content {
		background: rgba(80, 80, 80, 0.6);
		padding-top: 12px;
		padding-left: 12px;
		padding-bottom: 12px;
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
	.header .title {
		display: flex;
		align-items: center;
		gap: 5px;
		flex: 1;
		padding-right: 0;
	}
	.header .actions {
		display: flex;
	}
	.content-limit {
		padding: 0;
		max-height: 200px;
		overflow-y: auto;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.chat {
		height: 300px;
	}
	.blabla-chat .content {
		padding: 0;
	}
	.blabla-chat .panel {
		margin-bottom: 0;
	}
	.blabla-chat .language-button {
		cursor: pointer;
		max-height: 36px;
		padding: 5px 10px;
		.wrapper {
			position: relative;
			img {
				height: 26px;
			}
		}
	}
	.unread-circle {
		background: #5fad1b;
		border-radius: 50%;
		width: 10px;
		height: 10px;
		margin-left: 8px;
	}
	.wrapper .unread-circle {
		position: absolute;
		top: 0;
		right: -5px;
	}
	.blabla-chat .languages {
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
	.blabla-panel > .content > div {
		margin-bottom: 12px;
	}
	.blabla-panel .content > div:last-child {
		margin-bottom: 0;
	}
	.farmer-count {
		.v-icon.icon {
			margin-right: 0;
			font-size: 18px;
			margin-bottom: 3px;
		}
		.count {
			font-size: 14px;
		}
	}
</style>