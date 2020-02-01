<template>
	<div v-if="$store.state.farmer" class="chats">
		<div v-for="(window, i) in LeekWars.chatWindows" :key="window.name" :class="{expanded: window.expanded, unread: $refs.chats && $refs.chats[i] && $refs.chats[i].unread}" class="window">
			<div class="header">
				<router-link v-if="window.type === ChatType.PM" v-ripple :to="'/farmer/' + getFarmer(window.name).id">
					<avatar :farmer="getFarmer(window.name)" class="image" />
				</router-link>
				<router-link v-else-if="window.type === ChatType.TEAM" v-ripple :to="'/team/' + $store.state.farmer.team.id">
					<emblem :team="$store.state.farmer.team" class="image" />
				</router-link>
				<div v-ripple class="title" @click="toggleExpanded(window, i)">{{ window.title }}</div>
				<i v-ripple class="material-icons" @click="LeekWars.removeChat(i)">close</i>
			</div>
			<chat ref="chats" :channel="window.name" class="chat" @send="sendMessage($event, window.name)" />
		</div>
		<battle-royale />
	</div>
</template>

<script lang="ts">
	import BattleRoyale from '@/component/app/battle-royale.vue'
	import ChatElement from '@/component/chat/chat.vue'
	import { Chat, ChatType, ChatWindow } from '@/model/chat'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({
		components: {BattleRoyale}
	})
	export default class Chats extends Vue {
		ChatType = ChatType
		@Watch('LeekWars.chatWindows', {deep: true})
		update() {
			localStorage.setItem('chats', JSON.stringify(LeekWars.chatWindows))
		}
		toggleExpanded(window: ChatWindow, index: number) {
			window.expanded = !window.expanded
			setTimeout(() => ((this.$refs.chats as Vue[])[index] as ChatElement).updateScroll())
		}
		isPrivate(channel: string) {
			return channel.startsWith('pm-')
		}
		getFarmer(channel: string) {
			const id = parseInt(channel.replace('pm-', ''), 10)
			const conversation = store.state.conversations[id]
			if (conversation) {
				return conversation.farmers.find(f => f.id !== store.state.farmer!.id)
			}
			return {id: -1}
		}
		sendMessage(message: string, channel: string) {
			const id = parseInt(channel.replace('pm-', ''), 10)
			LeekWars.post('message/send-message', {conversation_id: id, message})
		}
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
		background: #f2f2f2;
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
			i {
				padding: 8px;
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