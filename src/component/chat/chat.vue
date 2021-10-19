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
				<div v-else-if="message.farmer.id === 0" :key="m" class="message">
					<img class="avatar" src="/image/favicon.png">
					<router-link :to="'/fight/' + message.texts[0].split('|')[1]">
						<div class="bubble br-notification">
							<div class="author">Leek Wars</div>
							{{ $t(message.texts[0].split('|')[0]) }}
						</div>
					</router-link>
				</div>
				<div v-else :key="m" class="message" :class="{me: message.farmer.id === $store.state.farmer.id}">
					<router-link :to="'/farmer/' + message.farmer.id" class="avatar-wrapper">
						<rich-tooltip-farmer :id="message.farmer.id" v-slot="{ on }">
							<avatar :farmer="message.farmer" :on="on" />
						</rich-tooltip-farmer>
					</router-link>
					<div class="bubble">
						<router-link :to="'/farmer/' + message.farmer.id" class="author">
							<rich-tooltip-farmer :id="message.farmer.id" v-slot="{ on }">
								<span :class="message.farmer.color" v-on="on">{{ message.farmer.name }}</span>
							</rich-tooltip-farmer>
						</router-link>
						<div v-if="message.censored" class="censored">Censuré par {{ message.censored_by.name }}</div>
						<div v-else v-large-emojis v-chat-code-latex class="text" v-html="message.content"></div>
						<template v-for="(sub, i) in message.subMessages">
							<div v-if="sub.censored" :key="i" class="censored">Censuré par {{ sub.censored_by.name }}</div>
							<div v-else :key="i" v-large-emojis v-chat-code-latex class="text" v-html="sub.content"></div>
						</template>
						<div class="right">
							<span :title="LeekWars.formatDateTime(message.date)" class="time">{{ LeekWars.formatTime(message.date) }}</span>
							<v-menu v-if="!privateMessages && !($store.state.farmer && message.farmer.id === $store.state.farmer.id) && message.farmer.color !== 'admin'" offset-y>
								<template v-slot:activator="{ on }">
									<v-btn text small icon color="grey" v-on="on">
										<v-icon>mdi-dots-vertical</v-icon>
									</v-btn>
								</template>
								<v-list dense class="message-actions">
									<v-list-item v-if="chat.type === ChatType.GLOBAL && message.farmer.color !== 'admin'" v-ripple @click="report(message)">
										<v-icon>mdi-flag</v-icon>
										<span>{{ $t('warning.report') }}</span>
									</v-list-item>
									<v-list-item v-if="isModerator && chat.type !== ChatType.PM" v-ripple @click="censor(message)">
										<v-icon>mdi-gavel</v-icon>
										<span>{{ $t('warning.censor') }}</span>
									</v-list-item>
									<v-list-item v-if="isModerator && chat.type !== ChatType.PM" v-ripple @click="mute(message.farmer)">
										<v-icon>mdi-volume-off</v-icon>
										<span>Mute</span>
									</v-list-item>
								</v-list>
							</v-menu>
						</div>
					</div>
				</div>
			</template>
			<div v-show="unread" v-ripple class="chat-new-messages" @click="updateScroll(true)">{{ $t('main.unread_messages') }}</div>
		</div>
		<div v-if="$store.state.wsdisconnected" class="chat-disconnected">{{ $t('main.disconnected') }}</div>
		<chat-input @message="sendMessage" />

		<report-dialog v-if="reportFarmer" v-model="reportDialog" :target="reportFarmer" :reasons="reasons" :parameter="reportContent" class="report-dialog" />

		<popup v-model="censorDialog" :width="500">
			<v-icon slot="icon">mdi-gavel</v-icon>
			<span slot="title">Censurer</span>
			<div v-if="muteFarmer" class="censor">
				<i18n path="warning.censor_farmer">
					<b slot="farmer">{{ muteFarmer.name }}</b>
				</i18n>
				<div class="flex">
					<avatar :farmer="muteFarmer" />
					<div class="messages">
						<div v-for="message in censorMessages" :key="message.id" class="bubble">
							<v-checkbox v-if="message.censored === 0" v-model="censoredMessages[message.id]" :label="message.content" :hide-details="true" />
							<div v-for="sub in message.subMessages" :key="sub.id">
								<v-checkbox v-if="sub.censored === 0" v-model="censoredMessages[sub.id]" :label="sub.content" :hide-details="true" />
							</div>
						</div>
					</div>
				</div>
				<v-checkbox v-model="censorMute" label="Mettre en sourdine pour 1h" :hide-details="true" />
			</div>
			<div slot="actions">
				<div v-ripple @click="censorDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="mute red" @click="censorConfirm"><v-icon>mdi-gavel</v-icon> Censurer</div>
			</div>
		</popup>

		<popup v-model="muteDialog" :width="500">
			<v-icon slot="icon">mdi-gavel</v-icon>
			<span slot="title">Censurer</span>
			<div v-if="muteFarmer" class="censor">
				<i18n path="warning.mute_popup">
					<b slot="farmer">{{ muteFarmer.name }}</b>
				</i18n>
			</div>
			<div slot="actions">
				<div v-ripple @click="muteDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="mute red" @click="muteConfirm"><v-icon>mdi-gavel</v-icon> Censurer</div>
			</div>
		</popup>

		<popup v-model="unmuteDialog" :width="600">
			<v-icon slot="icon">mdi-volume-high</v-icon>
			<span slot="title">{{ $t('warning.unmute') }}</span>
			<div v-if="muteFarmer">
				<i18n path="moderation.unmute_popup">
					<b slot="farmer">{{ muteFarmer.name }}</b>
				</i18n>
			</div>
			<div slot="actions">
				<div v-ripple @click="unmuteDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="unmute red" @click="unmuteConfirm">{{ $t('warning.unmute') }}</div>
			</div>
		</popup>
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

	@Component({
		name: "Chat",
		components: { 'chat-input': ChatInput }
	})
	export default class ChatElement extends Vue {
		ChatType = ChatType
		@Prop() id!: number
		@Prop() newFarmer!: any
		@Prop() newConversation!: any
		muteDialog: boolean = false
		censorDialog: boolean = false
		censorMessage: ChatMessage | null = null
		censoredMessages: {[key: number]: boolean} = {}
		censorMute: boolean = false
		censorFarmer: Farmer | null = null
		unmuteDialog: boolean = false
		muteFarmer: Farmer | null = null
		reportDialog: boolean = false
		reportFarmer: Farmer | null = null
		reportContent: string = ''
		userScroll: boolean = false
		unread: boolean = false
		reasons = [
			Warning.INCORRECT_FARMER_NAME,
			Warning.INCORRECT_AVATAR,
			Warning.FLOOD_CHAT,
			Warning.RUDE_CHAT,
			Warning.PROMO_CHAT
		]
		get loading() {
			return !!this.id && !store.state.chat[this.id]
		}
		get chat() {
			return this.id ? store.state.chat[this.id] : null
		}
		get privateMessages() {
			return this.chat && this.chat.type === ChatType.PM
		}

		get censorMessages() {
			return this.chat && this.censorFarmer ? this.chat.messages.filter(m => (m.censored === 0 || (m.subMessages && m.subMessages.some(s => s.censored === 0))) && m.farmer.id === this.censorFarmer!.id) : []
		}

		get isModerator() {
			return this.$store.getters.moderator || (this.chat && this.chat.type === ChatType.TEAM && this.$store.state.farmer.team.member_level >= TeamMemberLevel.CAPTAIN)
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
						this.$store.commit('chat-receive', {chat: this.id, message: message})
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
					if (this.newConversation) {
						this.newConversation.id = data.conversation_id
						// this.$store.commit('new-conversation', this.newConversation)
					}
					this.$router.replace('/messages/conversation/' + data.conversation_id)
					// this.newConversationSent = true
				})
			} else {
				LeekWars.post('message/send-message', {conversation_id: this.chat.id, message}).then(() => {}).error(data => {
					LeekWars.toast(this.$t('main.error_' + data.error, data.params))
				})
			}
		}

		report(message: ChatMessage) {
			this.reportDialog = true
			this.reportFarmer = message.farmer
			this.reportContent = [message.id, ...message.subMessages.map(s => s.id)].join(',')
		}

		censor(message: ChatMessage) {
			this.censorDialog = true
			this.censorMessage = message
			this.censorFarmer = message.farmer
			this.muteFarmer = message.farmer
			this.censoredMessages = {}
			if (message.censored === 0) {
				Vue.set(this.censoredMessages, message.id, true)
			}
			for (const sub of message.subMessages) {
				if (sub.censored === 0) {
					Vue.set(this.censoredMessages, sub.id, true)
				}
			}
		}

		mute(farmer: Farmer) {
			this.muteDialog = true
			this.muteFarmer = farmer
		}

		censorConfirm() {
			this.censorDialog = false
			if (this.censorMessage) {
				const ids = Object.entries(this.censoredMessages).filter(e => e[1]).map(e => e[0]).join(',')
				LeekWars.post('message/censor', { messages: ids, mute: this.censorMute })
			}
		}

		muteConfirm() {
			if (!this.muteFarmer) { return }
			LeekWars.post('message/mute', { farmer: this.muteFarmer.id, chat: this.id, duration: 3600 })
			this.muteFarmer.muted = true
			this.muteDialog = false
		}

		unmute(farmer: Farmer) {
			this.unmuteDialog = true
			this.muteFarmer = farmer
		}

		unmuteConfirm() {
			if (!this.muteFarmer) { return }
			LeekWars.socket.send([SocketMessage.CHAT_REQUEST_UNMUTE, this.id, this.muteFarmer.id])
			this.muteFarmer.muted = false
			this.unmuteDialog = false
		}

		read() {
			if (this.chat) {
				// LeekWars.socket.send([SocketMessage.MP_READ, this.chat.id])
				this.chat.read = true
			}
		}
		// TODO
		// ChatController.prototype.mute_user = function(data) {
		// 	var moderator_name = data[2]
		// 	var muted = data[3]
		// 	this.msg_elem.find('.chat-message[author=' + muted + ']').find('.chat-message-messages').html('censuré par <b>' + moderator_name + '</b>')
		// }
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
	.message {
		display: flex;
		align-items: flex-start;
		margin: 6px 8px;
		color: #aaa;
		gap: 8px;
		&.me {
			flex-direction: row-reverse;
		}
	}
	.avatar-wrapper {
		position: sticky;
		top: 8px;
	}
	.avatar {
		width: 42px;
		height: 42px;
		flex: 0 0 42px;
	}
	.bubble {
		padding: 3px 7px;
		border-radius: 4px;
		background: white;
		position: relative;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.1), 0px 1px 1px 0px rgba(0,0,0,0.07), 0px 1px 3px 0px rgba(0,0,0,0.06);
		min-width: 0;
		.report, .mute, .unmute {
			display: none;
			cursor: pointer;
		}
	}
	.bubble:hover {
		.report, .mute, .unmute {
			display: inline;
		}
	}
	.author {
		font-weight: 500;
		display: block;
		padding-bottom: 2px;
		padding-right: 60px;
		color: #777;
	}
	.text {
		word-break: break-word;
		color: #333;
	}
	.text.large-emojis ::v-deep .emoji {
		font-size: 26px;
		line-height: 34px;
		width: 26px;
		height: 26px;
	}
	.right {
		font-size: 13px;
		position: absolute;
		top: 3px;
		right: 0;
		.time {
			padding-right: 4px;
		}
		.v-btn {
			margin: 0;
			margin-top: -3px;
			margin-left: -5px;
			height: 24px;
			width: 24px;
		}
		i.v-icon {
			font-size: 18px;
			color: #aaa;
		}
	}
	.message-actions .v-icon {
		margin-right: 6px;
	}
	.text ::v-deep a {
		color: #5fad1b;
	}
	.text ::v-deep .v-icon {
		color: #5fad1b;
		font-size: 18px;
		margin-right: 4px;
		vertical-align: baseline;
	}
	.br-notification {
		background: #5fad1b;
		color: white;
		display: inline-block;
		.author {
			color: white;
		}
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
	.censor {
		.messages {
			flex: 1;
		}
		.bubble {
			margin-bottom: 10px;
			padding: 8px;
		}
	}
	.censor .flex {
		gap: 8px;
		margin: 10px 0;
	}
	.censored {
		font-size: 15px;
		color: #777;
		font-style: italic;
	}
</style>