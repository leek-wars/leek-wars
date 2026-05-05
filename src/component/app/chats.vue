<template>
	<div v-if="$store.state.farmer" class="chats">
		<div v-for="(window, i) in LeekWars.chatWindows" :key="window.id" :class="{expanded: window.expanded, unread: ($refs.chats as any) && ($refs.chats as any)[i] && !($refs.chats as any)[i].read}" class="window">
			<div class="header">
				<router-link v-if="window.type === ChatType.PM" v-ripple :to="'/farmer/' + getFarmer(window).id">
					<avatar :farmer="getFarmer(window)" class="image" />
				</router-link>
				<router-link v-else-if="window.type === ChatType.TEAM && $store.state.farmer?.team" v-ripple :to="'/team/' + $store.state.farmer.team.id">
					<emblem :team="$store.state.farmer.team" class="image" />
				</router-link>
				<div v-ripple class="title" @click="toggleExpanded(window, i)">{{ window.title }}</div>
				<v-icon class="close" @click="LeekWars.removeChat(i)">mdi-close</v-icon>
			</div>
			<chat :id="window.id" ref="chats" class="chat" @send="sendMessage($event, window.id)" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ChatType, ChatWindow } from '@/model/chat'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { defineAsyncComponent, ref, watch } from 'vue'

const Chat = defineAsyncComponent(() => import(/* webpackChunkName: "chat" */ `@/component/chat/chat.vue`))

defineOptions({ name: 'chats' })

const chats = ref<any[]>([])

watch(() => LeekWars.chatWindows, () => {
	localStorage.setItem('chats', JSON.stringify(LeekWars.chatWindows))
}, { deep: true })

function toggleExpanded(window: ChatWindow, index: number) {
	window.expanded = !window.expanded
	setTimeout(() => (chats.value[index] as any).updateScroll())
}

function getFarmer(window: ChatWindow) {
	const chat = store.state.chat[window.id]
	if (chat) {
		const f = chat.farmers.find(f => f.id !== store.state.farmer!.id)
		if (f) { return f }
	}
	return {id: -1}
}

function sendMessage(message: string, id: number) {
	LeekWars.post('message/send-message', {conversation_id: id, message})
}
</script>

<style lang="scss" scoped>
	.chats {
		position: fixed;
		bottom: 0;
		right: 0;
		z-index: 1000;
		display: inline-flex;
		flex-direction: row-reverse;
		align-items: flex-end;
		pointer-events: none;
	}
	.window {
		width: 300px;
		background: var(--background);
		margin-right: 15px;
		border-top-left-radius: 7px;
		border-top-right-radius: 7px;
		box-shadow: 0px 3px 5px -1px rgba(0,0,0,0.2), 0px 5px 8px 0px rgba(0,0,0,0.14), 0px 1px 14px 0px rgba(0,0,0,0.12);
		pointer-events: all;
		.header {
			background: #2a2a2a;
			color: white;
			border-top-left-radius: 6px;
			border-top-right-radius: 6px;
			display: flex;
			user-select: none;
			cursor: pointer;
			.image {
				height: 34px;
				margin: 4px;
				vertical-align: bottom;
			}
			.title {
				padding: 10px;
				padding-left: 5px;
				font-size: 18px;
				flex: 1;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.title:first-child {
				padding-left: 10px;
			}
			.v-icon {
				padding: 8px;
				width: 40px;
				height: 40px;
			}
		}
		.chat {
			height: calc(370px - 42px);
		}
		&:not(.expanded) .chat {
			display: none;
		}
	}
	.window.unread .header {
		animation: unread 2.5s infinite;
	}
	@keyframes unread {
		0% { background:#5fad1b; }
		50% { background:#2a2a2a; }
		100% { background:#5fad1b; }
	}
</style>