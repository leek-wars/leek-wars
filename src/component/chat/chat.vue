<template lang="html">
	<div class="chat">
		<loader v-show="channel && !$store.state.chat[channel]" />
		<div v-autostopscroll v-if="channel && $store.state.chat[channel] && $store.state.chat[channel].messages.length" ref="messages" class="messages">
			<template v-for="(message, m) in $store.state.chat[channel].messages">
				<div v-if="message.author.id === 0" :key="m" class="message">
					<img class="avatar" src="/image/favicon.png">
					<router-link :to="'/fight/' + message.texts[1]">
						<div class="bubble br-notification">
							<div class="author">Leek Wars</div>
							{{ message.texts[0] }}
						</div>
					</router-link>
				</div>
				<div v-else :key="m" class="message">
					<router-link :to="'/farmer/' + message.author.id" class="avatar-wrapper">
						<avatar :farmer="message.author" />
					</router-link>
					<div class="bubble">
						<router-link :to="'/farmer/' + message.author.id" class="author">
							<span :class="message.author.grade">{{ message.author.name }}</span>
						</router-link>
						<div v-large-emojis v-latex v-for="(text, i) in message.texts" :key="i" class="text" v-html="text"></div>
						<div :title="LeekWars.formatDateTime(message.time)" class="time">
							{{ LeekWars.formatTime(message.time) }}
							<v-menu v-if="!privateMessages" offset-y>
								<v-btn slot="activator" flat small icon color="grey">
									<v-icon>more_vert</v-icon>
								</v-btn>
								<v-list :dense="true" class="message-actions">
									<v-list-tile v-ripple @click="report(message)">
										<v-icon>flag</v-icon>
										<span>Signaler</span>
									</v-list-tile>
									<v-list-tile v-ripple v-if="$store.getters.moderator && !message.author.muted" @click="mute(message.author)">
										<v-icon>volume_off</v-icon>
										<span>Mute</span>
									</v-list-tile>
									<v-list-tile v-ripple v-if="$store.getters.moderator && message.author.muted" @click="unmute(message.author)">
										<v-icon>volume_up</v-icon>
										<span>Unmute</span>
									</v-list-tile>
								</v-list>
							</v-menu>
						</div>
					</div>
				</div>
			</template>
			<div v-show="unread" class="chat-new-messages" @click="updateScroll(true)">{{ $t('main.unread_messages') }}</div>
		</div>
		<div v-autostopscroll v-else-if="channel && $store.state.chat[channel]" ref="messages" class="messages">
			<div class="no-messages">No messages yet</div>
		</div>
		<div class="chat-disconnected">{{ $t('main.disconnected') }}</div>
		<chat-input @message="sendMessage" />

		<report-dialog v-if="reportFarmer" v-model="reportDialog" :name="reportFarmer.name" :target="reportFarmer.id" :reasons="reasons" :parameter="reportContent" />

		<v-dialog v-model="muteDialog" :max-width="600">
			<div class="title">{{ $t('moderation.mute') }}</div>
			<div v-if="muteFarmer" class="content">{{ $t('moderation.mute_popup', [muteFarmer.name]) }}</div>
			<div class="actions">
				<div @click="muteDialog = false">{{ $t('moderation.cancel') }}</div>
				<div class="mute red" @click="muteConfirm">{{ $t('moderation.confirm') }}</div>
			</div>
		</v-dialog>
		<v-dialog v-model="unmuteDialog" :max-width="600">
			<div class="title">{{ $t('moderation.unmute') }}</div>
			<div v-if="muteFarmer" class="content">{{ $t('moderation.unmute_popup', [muteFarmer.name]) }}</div>
			<div class="actions">
				<div @click="unmuteDialog = false">{{ $t('moderation.cancel') }}</div>
				<div class="unmute red" @click="unmuteConfirm">{{ $t('moderation.confirm') }}</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import { Chat, ChatMessage } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { SocketMessage } from '@/model/socket'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import ChatInput from './chat-input.vue'
	
	@Component({
		components: { 'chat-input': ChatInput }
	})
	export default class ChatElement extends Vue {
		@Prop() channel!: string
		muteDialog: boolean = false
		unmuteDialog: boolean = false
		muteFarmer: Farmer | null = null
		reportDialog: boolean = false
		reportFarmer: Farmer | null = null
		reportContent: string = ''
		userScroll: boolean = false
		unread: boolean = false
		messagesMounted: boolean = false
		reasons = [
			Warning.INCORRECT_FARMER_NAME,
			Warning.INCORRECT_AVATAR,
			Warning.FLOOD_CHAT,
			Warning.RUDE_CHAT,
			Warning.PROMO_CHAT
		]
		created() {
			this.update()
			this.$root.$on('chat', (e: any) => {
				if (e[0] === this.channel) {
					this.updateScroll()
					if (!this.scrollBottom()) { this.unread = true }
					if (!this.messagesMounted) {
						setTimeout(() => this.mountMessages(), 50)
						this.messagesMounted = true
					}
				}
			})
			this.$root.$on('resize', () => this.updateScroll())
		}
		scrollBottom() {
			const messages = this.$refs.messages as HTMLElement
			if (!messages) { return true }
			return messages && Math.abs((messages.scrollTop + messages.offsetHeight) - messages.scrollHeight) < 3
		}
		mounted() {
			this.updateScroll()
		}
		mountMessages() {
			const messages = this.$refs.messages as HTMLElement
			if (!messages) { return }
			messages.addEventListener('scroll', () => {
				if (this.scrollBottom()) {
					this.userScroll = false
					this.unread = false
				}
			})
			messages.addEventListener('wheel', (e: MouseWheelEvent) => {
				if (!this.scrollBottom()) {
					this.userScroll = true
				}
			}, {passive: true})
			messages.addEventListener('touchmove', (e: TouchEvent) => {
				if (!this.scrollBottom()) {
					this.userScroll = true
				}
			}, {passive: true})
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
		@Watch('channel')
		update() {
			if (this.channel === 'team') {
				if (!this.$store.state.chat.team) {
					this.$store.commit('init-team-chat')
					LeekWars.socket.send([SocketMessage.TEAM_CHAT_ENABLE])
				}
			} else if (this.channel.startsWith('pm-')) {
				const id = parseInt(this.channel.replace('pm-', ''), 10)
				if (!this.$store.state.chat['pm-' + id]) {
					if (id === 0) { return }
					LeekWars.get<any>('message/get-messages/' + id + '/' + 50 + '/' + 1 + '/' + this.$store.state.token).then((data) => {
						if (data.success) {
							for (const message of data.messages.reverse()) {
								this.$store.commit('pm-receive', {message: [id, message.farmer_id, message.farmer_name, message.content, false, message.farmer_color, message.avatar_changed, message.date]})
							}
							for (const farmer of data.farmers) {
								this.$store.commit('add-conversation-participant', {id, farmer})
							}
							// this.conversationRead()
						}
					})
				}
			} else {
				LeekWars.socket.enableChannel(this.channel)
			}
		}
		sendMessage(message: any) {
			if (message.startsWith('/ping')) {
				this.$store.commit('last-ping', Date.now())
			}
			if (this.channel === 'team') {
				LeekWars.socket.send([SocketMessage.TEAM_CHAT_SEND, message])
			} else if (!this.channel || this.privateMessages) {
				this.$emit('send', message)
			} else {
				LeekWars.socket.send([SocketMessage.FORUM_CHAT_SEND, this.channel, message])
			}
		}
		report(message: ChatMessage) {
			this.reportDialog = true
			this.reportFarmer = message.author
			this.reportContent = message.texts.reduce((a, b) => a + b + "\n", "")
		}
		mute(farmer: Farmer) {
			this.muteDialog = true
			this.muteFarmer = farmer
		}
		muteConfirm() {
			if (!this.muteFarmer) { return }
			LeekWars.socket.send([SocketMessage.CHAT_REQUEST_MUTE, this.channel, this.muteFarmer.id])
			this.muteFarmer.muted = true
			this.muteDialog = false
		}
		unmute(farmer: Farmer) {
			this.unmuteDialog = true
			this.muteFarmer = farmer
		}
		unmuteConfirm() {
			if (!this.muteFarmer) { return }
			LeekWars.socket.send([SocketMessage.CHAT_REQUEST_UNMUTE, this.channel, this.muteFarmer.id])
			this.muteFarmer.muted = false
			this.unmuteDialog = false
		}
		get privateMessages() {
			return this.channel.startsWith('pm-')
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
	}
	.message a {
		color: #aaa;
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
		margin-left: 8px;
		padding: 3px 7px;
		border-radius: 4px;
		background: white;
		position: relative;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
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
		padding-bottom: 2px;
		padding-right: 60px;
	}
	.text {
		word-break: break-word;
		color: #333;
	}
	.text.large-emojis /deep/ .smiley {
		width: 30px;
		height: 30px;
		margin: 3px 0;
	}
	.time {
		font-size: 13px;
		position: absolute;
		top: 1px;
		right: 0;
		.v-btn {
			margin: 0;
			margin-top: -1px;
			margin-left: -3px;
			height: 24px;
			width: 24px;
		}
		i.v-icon {
			font-size: 18px;
			color: #aaa;
		}
	}
	.message-actions .v-icon {
		margin-right: 4px;
	}
	.text /deep/ a {
		color: #5fad1b;
	}
	.br-notification {
		background: #5fad1b;
		color: white;
		display: inline-block;
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
		height: 0px;
		line-height: 30px;
		background-color: #d3324d;
		color: white;
		text-align: center;
		transition: height ease 0.5s
	}
</style>