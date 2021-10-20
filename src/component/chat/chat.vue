<template lang="html">
	<div class="chat">
		<loader v-show="loading" />
		<div v-if="!loading && (!chat || !chat.messages.length)" v-autostopscroll class="messages">
			<div class="no-messages">{{ $t('main.no_messages_yet') }}</div>
		</div>
		<div v-if="chat && chat.messages.length" ref="messages" v-autostopscroll class="messages" @scroll="scroll">
			<template v-for="(message, m) in $store.state.chat[id].messages">
				<div v-if="message.farmer.id === -1" :key="m" class="separator">
					{{ message.date | date }}
				</div>
				<chat-message v-else :key="m" :message="message" :chat="chat" />
			</template>
			<div v-show="unread" v-ripple class="chat-new-messages" @click="updateScroll(true)">{{ $t('main.unread_messages') }}</div>
		</div>
		<div v-if="$store.state.wsdisconnected" class="chat-disconnected">{{ $t('main.disconnected') }}</div>
		<chat-input @message="sendMessage" />

	</div>
</template>

<script lang="ts">
	import { Chat, ChatMessage, ChatType } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { SocketMessage } from '@/model/socket'
	import { store } from '@/model/store'
	import { TeamMember, TeamMemberLevel } from '@/model/team'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import ChatInput from './chat-input.vue'
	import ChatMessageComponent from './chat-message.vue'

	@Component({
		name: "Chat",
		components: { 'chat-input': ChatInput, 'chat-message': ChatMessageComponent }
	})
	export default class ChatElement extends Vue {
		ChatType = ChatType
		@Prop() id!: number
		@Prop() newFarmer!: any
		@Prop() newConversation!: any

		userScroll: boolean = false
		unread: boolean = false

		get loading() {
			return !!this.id && !store.state.chat[this.id]
		}
		get chat() {
			return this.id ? store.state.chat[this.id] : null
		}
		get privateMessages() {
			return this.chat && this.chat.type === ChatType.PM
		}

		created() {
			this.$root.$on('chat', this.newMessage)
			this.$root.$on('resize', this.updateScroll)
			this.$root.$on('wsconnected', this.update)
		}

		beforeDestroy() {
			this.$root.$off('chat', this.newMessage)
			this.$root.$off('resize', this.updateScroll)
			this.$root.$off('wsconnected', this.update)
		}

		newMessage(e: any) {
			if (e[0] === this.id) {
				this.updateScroll()
				if (!this.scrollBottom()) { this.unread = true }

				// On reçoit un message sur un chat de conversation privée, il est lu tout de suite
				this.read()
			}
		}

		scrollBottom() {
			const messages = this.$refs.messages as HTMLElement
			if (!messages) { return true }
			return messages && Math.abs((messages.scrollTop + messages.offsetHeight) - messages.scrollHeight) < 3
		}

		mounted() {
			this.updateScroll()
		}

		scroll() {
			if (this.scrollBottom()) {
				this.userScroll = false
				this.unread = false
			} else {
				this.userScroll = true
			}
		}

		updated() {
			this.updateScroll()
		}

		updateScroll(force: boolean = false) {
			if (!this.userScroll || force) {
				const messages = this.$refs.messages as HTMLElement
				setTimeout(() => {
					if (messages) {
						messages.scrollTop = messages.scrollHeight + 1000
						this.unread = false
					}
				}, 60)
			}
		}

		@Watch('id', {immediate: true})
		update() {
			if (!this.id) { return }
			LeekWars.socket.enableChannel(this.id)
			if (!this.chat || !this.chat.loaded) {
				LeekWars.get('message/get-messages/' + this.id + '/' + 50 + '/' + 1).then(data => {
					this.$store.commit('clear-chat', this.id)
					for (const message of data.messages) {
						this.$store.commit('chat-receive', { chat: this.id, message, new: false })
					}
					for (const farmer of data.farmers) {
						this.$store.commit('add-conversation-participant', {id: this.id, farmer})
					}
					this.chat!.loaded = true
				})
			}
			this.read()
		}

		sendMessage(message: any) {
			if (message.startsWith('/ping')) {
				this.$store.commit('last-ping', Date.now())
			}
			if (this.chat === null) {
				LeekWars.post('message/create-conversation', {farmer_id: this.newFarmer.id, message}).then(data => {
					this.newConversation.id = data.conversation_id
					this.$store.commit('new-conversation', this.newConversation)
					this.$router.replace('/messages/conversation/' + data.conversation_id)
				})
			} else {
				LeekWars.post('message/send-message', {conversation_id: this.chat.id, message}).then(() => { /**/ }).error(data => {
					LeekWars.toast(this.$t('main.error_' + data.error, data.params))
				})
			}
		}

		read() {
			if (!this.chat) { return }
			Vue.nextTick(() => {
				if (this.chat!.type === ChatType.PM && !this.chat!.read) {
					LeekWars.post('message/read', { chat: this.chat!.id })
				}
				store.commit('chat-set-read', { chat: this.chat!.id, read: true })
			})
		}
	}
</script>

<style lang="scss" scoped>
	.chat {
		position: relative;
		display: flex;
		flex-direction: column;
	}
	.loader {
		height: calc(100% - 100px);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.messages {
		height: calc(100% - 40px);
		overflow-y: scroll;
	}
	.no-messages {
		height: calc(100% - 60px);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #aaa;
	}
	.chat-new-messages {
		position: absolute;
		bottom: 39px;
		right: 0;
		left: 0;
		background: #5fad1b;
		color: white;
		text-align: center;
		line-height: 30px;
		cursor: pointer;
	}
	.chat-disconnected {
		height: 30px;
		line-height: 30px;
		background-color: #d3324d;
		color: white;
		text-align: center;
		transition: height ease 0.5s;
		position: absolute;
		top: 0;
		width: 100%;
	}
	.separator {
		text-align: center;
		color: #777;
		display: flex;
		align-items: center;
		margin: 12px 0;
		&:before, &:after {
			border-bottom: 1px dashed #aaa;
			width: 100%;
			content: " ";
			flex: 1;
		}
		&:before {
			margin-right: 10px;
		}
		&:after {
			margin-left: 10px;
		}
	}
</style>