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
					<template #title>
						<router-link v-ripple class="title" to="/notifications">
							{{ $t('main.notifications') }}
							<span v-show="$store.state.unreadNotifications" class="label">{{ $store.state.unreadNotifications }}</span>
						</router-link>
					</template>
					<template #actions>
						<div class="actions">
							<div v-if="$store.state.unreadNotifications" class="button text" @click="readAllNotifications">
								<v-icon>mdi-check-all</v-icon>
							</div>
						</div>
					</template>
					<template #content>
						<div v-autostopscroll class="content-limit">
							<notification v-for="notification in $store.state.notifications" :key="notification.id" :notification="notification" @click.native="readNotification(notification)" />
						</div>
					</template>
				</panel>

				<panel v-if="env.SOCIAL && $store.state.farmer.verified && $store.state.conversationsList.length" toggle="social/messages" icon="mdi-email-outline">
					<template #title>
						<router-link v-ripple class="title" to="/chat">
							{{ $t('main.messages') }}
							<span v-show="$store.state.unreadMessages" class="label">{{ $store.state.unreadMessages }}</span>
						</router-link>
					</template>
					<template #content>
						<div v-autostopscroll class="content-limit">
							<router-link v-for="chat in $store.state.conversationsList" :key="chat.id" :to="'/chat/' + chat.id">
								<conversation :chat="chat" />
							</router-link>
						</div>
					</template>
				</panel>

				<chat-panel v-if="env.SOCIAL && socialEverOpened" toggle="social/chat" chat="social" :height="300" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import Conversation from '@/component/messages/conversation.vue'
import { LeekWars } from '@/model/leekwars'
import type { Notification } from '@/model/notification'
import { store } from '@/model/store'
import { emitter } from '@/model/vue'
import { defineAsyncComponent, nextTick, ref } from 'vue'

const ChatPanel = defineAsyncComponent(() => import(/* webpackChunkName: "chat" */ `@/component/chat/chat-panel.vue`))

defineOptions({ name: 'lw-social' })

const panelWidth = ref(400)
const socialEverOpened = ref(false)

if (localStorage.getItem('main/social-collapsed') === 'true') {
	LeekWars.socialCollapsed = true
}
socialEverOpened.value = !LeekWars.socialCollapsed
const widthStored = localStorage.getItem('main/social-width')
if (widthStored) {
	panelWidth.value = parseInt(widthStored, 10)
}

function toggleSocial() {
	LeekWars.socialCollapsed = !LeekWars.socialCollapsed
	if (!LeekWars.socialCollapsed) {
		socialEverOpened.value = true
	}
	localStorage.setItem('main/social-collapsed', '' + LeekWars.socialCollapsed)
	nextTick(() => {
		emitter.emit('resize')
	})
}

function resizerMousedown(e: MouseEvent) {
	const startWidth = panelWidth.value
	const startX = e.clientX
	const mousemove: any = (ev: MouseEvent) => {
		panelWidth.value = Math.max(400, Math.min(800, startWidth + startX - ev.clientX))
		localStorage.setItem('main/social-width', '' + panelWidth.value)
	}
	const mouseup: any = (_ev: MouseEvent) => {
		document.documentElement!.removeEventListener('mousemove', mousemove)
		document.documentElement!.removeEventListener('mouseup', mouseup)
	}
	document.documentElement!.addEventListener('mousemove', mousemove, false)
	document.documentElement!.addEventListener('mouseup', mouseup, false)
	e.preventDefault()
}

function readNotification(notification: Notification) {
	LeekWars.post('notification/read', {notification_id: notification.id})
}

function readAllNotifications() {
	store.commit('read-notifications')
	LeekWars.post('notification/read-all')
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

	.blabla-panel > .content > div {
		margin-bottom: 12px;
	}
	.blabla-panel .content > div:last-child {
		margin-bottom: 0;
	}
</style>