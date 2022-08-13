<template lang="html">
	<div class="chat">
		<loader v-show="chat && chat.loading" />
		<div v-if="!loading && (!chat || !chat.messages.length)" v-autostopscroll class="messages">
			<div class="no-messages">{{ $t('main.no_messages_yet') }}</div>
		</div>
		<div v-else-if="chat && chat.messages.length" ref="messages" v-autostopscroll class="messages" @scroll="scroll" @wheel="scroll">
			<div v-for="(messages, day) in $store.state.chat[id].days" :key="day">
				<div class="separator">
					{{ messages[0].date | date }}
				</div>
				<chat-message v-for="(message, m) in messages" :key="message.id" :message="formatMessage(message)" :chat="chat" @scroll="updateScroll" :large="large" :class="'m-' + message.id" @menu="openMenu($event, message)" @emoji="openEmojis($event, message)" />
			</div>
			<div v-show="unread" v-ripple class="chat-new-messages" @click="updateScroll(true)">{{ $t('main.unread_messages') }}</div>
		</div>
		<div v-else class="messages"></div>
		<div v-if="$store.state.wsdisconnected" class="chat-disconnected">{{ $t('main.disconnected') }}</div>
		<div v-if="$store.state.farmer && !$store.state.farmer.verified" class="verify">
			<router-link class="green-link" to="/settings">{{ $t('main.verify_chat') }}</router-link>
		</div>
		<chat-input v-else :chat="id" @message="sendMessage" />

		<div v-show="!isScrollBottom" class="card scroll-down" v-ripple @click="scrollToBottom">
			<v-icon>mdi-chevron-down</v-icon>
		</div>

		<report-dialog v-if="reportFarmer" v-model="reportDialog" :target="reportFarmer" :reasons="reasons" :parameter="reportContent" class="report-dialog" />

		<v-menu v-if="menuMessage && !privateMessages && (menuMessage.farmer.color !== 'admin' || $store.getters.admin) && menuMessage.farmer.id !== 0" v-model="menu" :activator="menuActivator" offset-y>
			<v-list dense class="message-actions">
				<v-list-item v-if="chat.type === ChatType.GLOBAL && menuMessage.farmer.id !== $store.state.farmer.id && menuMessage.farmer.color !== 'admin'" v-ripple @click="report(menuMessage)">
					<v-icon>mdi-flag</v-icon>
					<span>{{ $t('warning.report') }}</span>
				</v-list-item>
				<v-list-item v-if="isModerator && chat.type !== ChatType.PM && menuMessage.farmer.color !== 'admin'" v-ripple @click="mute(menuMessage.farmer)">
					<v-icon>mdi-volume-off</v-icon>
					<span>Mute</span>
				</v-list-item>
				<v-list-item v-if="isModerator && chat.type !== ChatType.PM && menuMessage.farmer.color !== 'admin'" v-ripple @click="censor(menuMessage)">
					<v-icon>mdi-gavel</v-icon>
					<span>{{ $t('warning.censor') }}</span>
				</v-list-item>
				<v-list-item v-if="chat.type !== ChatType.PM && (menuMessage.farmer.id === $store.state.farmer.id || $store.getters.admin)" v-ripple @click="deleteMessage(menuMessage)">
					<v-icon>mdi-delete</v-icon>
					<span>{{ $t('warning.delete') }}</span>
				</v-list-item>
			</v-list>
		</v-menu>

		<popup v-model="censorDialog" :width="500">
			<v-icon slot="icon">mdi-gavel</v-icon>
			<span slot="title">Censurer</span>
			<div v-if="muteFarmer" class="censor">
				<i18n path="warning.censor_farmer">
					<b slot="farmer">{{ muteFarmer.name }}</b>
				</i18n>
				<div class="flex">
					<avatar :farmer="muteFarmer" />
					<div class="messages card">
						<div v-for="message in censorMessages" :key="message.id">
							<v-checkbox v-if="message.censored === 0" v-model="censoredMessages[message.id]" :label="message.content" :hide-details="true" />
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

		<popup v-model="deleteDialog" :width="500">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">Supprimer</span>
			<div v-if="muteFarmer" class="censor">
				<i18n path="warning.delete_farmer"></i18n>
				<div class="flex">
					<avatar :farmer="muteFarmer" />
					<div class="messages card">
						<div v-for="message in deleteMessages" :key="message.id">
							<v-checkbox v-model="deletedMessages[message.id]" :label="message.content" :hide-details="true" />
						</div>
					</div>
				</div>
				<v-checkbox v-if="isModerator && muteFarmer.color !== 'admin'" v-model="censorMute" label="Mettre en sourdine pour 1h" :hide-details="true" />
			</div>
			<div slot="actions">
				<div v-ripple @click="deleteDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="mute red" @click="deleteConfirm"><v-icon>mdi-delete</v-icon> Supprimer</div>
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

		<v-menu v-if="menuMessage && $store.state.farmer.verified" offset-y top :nudge-top="10" v-model="menuEmoji" :activator="menuEmojiActivator" content-class="emojis-dialog">
			<div class="emojis">
				<span v-for="(emoji, e) in emojis" :key="e" class="emoji" :class="{selected: emoji === menuMessage.my_reaction}" @click="toggleReaction(emoji)">{{ emoji }}</span>
				<span v-if="menuMessage.my_reaction && !emojis.includes(menuMessage.my_reaction)" class="emoji selected" @click="toggleReaction(menuMessage.my_reaction)">{{ message.my_reaction }}</span>
				<emoji-picker @pick="toggleReaction" :close-on-selected="true" :classic="false"><v-icon class="more">mdi-dots-horizontal</v-icon></emoji-picker>
			</div>
		</v-menu>
	</div>
</template>

<script lang="ts">
	import { ChatMessage, ChatType } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { store } from '@/model/store'
	import { TeamMemberLevel } from '@/model/team'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import ChatInput from './chat-input.vue'
	import ChatMessageComponent from './chat-message.vue'
	import EmojiPicker from './emoji-picker.vue'
	import ReportDialog from '@/component/moderation/report-dialog.vue'
	import { Commands } from '@/model/commands'
	import { formatEmojis } from '@/model/emojis'

	@Component({
		name: "chat",
		components: { 'chat-input': ChatInput, 'chat-message': ChatMessageComponent, 'emoji-picker': EmojiPicker, ReportDialog }
	})
	export default class ChatElement extends Vue {
		ChatType = ChatType
		@Prop() id!: number
		@Prop() newFarmer!: any
		@Prop() newConversation!: any
		@Prop() large!: boolean

		emojis = ['❤️', '👍', '👎', '👏', '😂', '😀', '😮', '😱']

		isScrollBottom: boolean = true
		userScroll: boolean = false
		unread: boolean = false

		menuMessage: ChatMessage | null = null
		scrollMessage: number = 0
		menuActivator: any = null
		menuEmojiActivator: any = null
		menu: boolean = false
		menuEmoji: boolean = false

		muteDialog: boolean = false
		muteFarmer: Farmer | null = null

		censorDialog: boolean = false
		censorMessage: ChatMessage | null = null
		censoredMessages: {[key: number]: boolean} = {}
		censorMute: boolean = false

		deleteDialog: boolean = false
		deletedMessage: ChatMessage | null = null
		deletedMessages: {[key: number]: boolean} = {}

		reportDialog: boolean = false
		reportFarmer: Farmer | null = null
		reportContent: string = ''
		reasons = [
			Warning.RUDE_CHAT,
			Warning.FLOOD_CHAT,
			Warning.PROMO_CHAT,
			Warning.INCORRECT_FARMER_NAME,
			Warning.INCORRECT_AVATAR,
		]

		get loading() {
			return !!this.id && (!store.state.chat[this.id] || !store.state.chat[this.id].loaded)
		}
		get chat() {
			return this.id ? store.state.chat[this.id] : null
		}
		get privateMessages() {
			return this.chat && this.chat.type === ChatType.PM
		}
		get isModerator() {
			return this.$store.getters.moderator || (this.chat && this.chat.type === ChatType.TEAM && this.$store.state.farmer.team.member_level >= TeamMemberLevel.CAPTAIN)
		}
		get censorMessages() {
			return this.chat && this.muteFarmer ? this.chat.messages.filter(m => m.censored === 0 && m.farmer.id === this.muteFarmer!.id) : []
		}
		get deleteMessages() {
			return this.chat && this.muteFarmer ? this.chat.messages.filter(m => m.farmer.id === this.muteFarmer!.id) : []
		}

		created() {
			this.$root.$on('chat', this.newMessage)
			this.$root.$on('chat-history', this.chatHistory)
			this.$root.$on('resize', this.updateScroll)
			if (store.state.wsconnected) {
				this.update()
			} else {
				this.$root.$on('wsconnected', this.update)
			}
		}

		mounted() {
			this.updateScroll()
		}

		beforeDestroy() {
			this.$root.$off('chat', this.newMessage)
			this.$root.$off('chat-history', this.chatHistory)
			this.$root.$off('resize', this.updateScroll)
			this.$root.$off('wsconnected', this.update)
		}

		newMessage(e: any) {
			if (e[0] === this.id) {
				this.updateScroll()
				if (!this.isScrollBottom) { this.unread = true }

				// On reçoit un message sur un chat de conversation privée, il est lu tout de suite
				this.read()
			}
		}

		chatHistory(e: any) {
			if (e === this.id && this.scrollMessage) {
				Vue.nextTick(() => {
					const element = this.$el.querySelector('.m-' + this.scrollMessage) as HTMLElement
					if (element) {
						(this.$refs.messages as HTMLElement).scrollTop = element.offsetTop
					}
					this.scrollMessage = 0
				})
			}
		}

		scrollTop() {
			const messages = this.$refs.messages as HTMLElement
			if (!messages) { return true }
			return messages.scrollTop < 150
		}

		scroll() {
			const messages = this.$refs.messages as HTMLElement
			if (messages) {
				this.isScrollBottom = messages.offsetHeight > messages.scrollHeight || Math.abs((messages.scrollTop + messages.offsetHeight) - messages.scrollHeight) < 3
			}
			if (this.isScrollBottom) {
				this.userScroll = false
				this.unread = false
			} else {
				this.userScroll = true
			}
			if (this.scrollTop()) {
				this.scrollMessage = this.chat!.messages[0].id
				store.commit('load-chat-history', this.id)
			}
		}

		updated() {
			this.updateScroll()
		}

		updateScroll(force: boolean = false) {
			if (!this.userScroll || force) {
				const messages = this.$refs.messages as HTMLElement
				if (messages) {
					this.scrollToBottom()
					this.unread = false
				}
			}
		}

		scrollToBottom() {
			const messages = this.$refs.messages as HTMLElement
			if (messages) {
				messages.scrollTop = messages.scrollHeight + 1000
				setTimeout(() => {
					if (messages) {
						messages.scrollTop = messages.scrollHeight + 1000
					}
				}, 100)
			}
		}

		@Watch('id')
		update() {
			if (!this.id) { return }
			store.commit('register-chat', {id: this.id})
			store.commit('load-chat', this.chat)
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
				if (!this.chat!.read) {
					LeekWars.post('message/read', { conversation_id: this.chat!.id })
				}
				store.commit('chat-set-read', { chat: this.chat!.id, read: true })
			})
		}

		report(message: ChatMessage) {
			this.reportDialog = true
			this.reportFarmer = message.farmer
			this.reportContent = [message.id, ...message.subMessages.map(s => s.id)].join(',')
		}

		censor(message: ChatMessage) {
			this.censorDialog = true
			this.censorMessage = message
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

		deleteMessage(message: ChatMessage) {
			this.deleteDialog = true
			this.deletedMessage = message
			this.muteFarmer = message.farmer
			this.deletedMessages = {}
			Vue.set(this.deletedMessages, message.id, true)
			for (const sub of message.subMessages) {
				Vue.set(this.deletedMessages, sub.id, true)
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

		deleteConfirm() {
			this.deleteDialog = false
			if (this.deletedMessage) {
				const ids = Object.entries(this.deletedMessages).filter(e => e[1]).map(e => e[0]).join(',')
				LeekWars.delete('message/delete', { messages: ids, mute: this.censorMute })
			}
		}

		muteConfirm() {
			if (!this.muteFarmer || !this.chat) { return }
			LeekWars.post('message/mute', { farmer: this.muteFarmer.id, chat: this.chat.id, duration: 3600 })
			this.muteFarmer.muted = true
			this.muteDialog = false
		}

		openMenu(activator: any, message: ChatMessage) {
			this.menuMessage = message
			this.menuActivator = activator.target
			this.menuEmoji = false
			Vue.nextTick(() => {
				this.menu = true
			})
		}

		openEmojis(activator: any, message: ChatMessage) {
			this.menuMessage = message
			this.menuEmojiActivator = activator.target
			this.menu = false
			Vue.nextTick(() => {
				this.menuEmoji = true
			})
		}

		toggleReaction(emoji: string) {
			this.menuEmoji = false
			if (!this.menuMessage) return
			if (this.menuMessage.my_reaction === emoji) { // Remove current reaction
				LeekWars.delete('message-reaction/delete', { message_id: this.menuMessage.id })
				this.menuMessage.my_reaction = null
			} else {
				LeekWars.post('message-reaction/add', { reaction: emoji, message_id: this.menuMessage.id })
				this.menuMessage.my_reaction = emoji
			}
		}

		formatMessage(message: ChatMessage) {

			if (message.formatted) return message

			let content = LeekWars.protect(message.content)
			content = LeekWars.linkify(content)
			content = formatEmojis(content)
			content = Commands.execute(content, message.farmer.name)
			content = content.replace(/@(\w+)/g, (a, b) => {
				const farmer = store.state.farmer_by_name[b]
				if (farmer) {
					return "<span class='pseudo'>" + b + "</span>"
				}
				return a
			})
			content = content.replace(/\n/g, '<br>')
			message.content = content

			const element = document.createElement('div')
			element.innerHTML = message.content
			const innerText = element.innerText.trim()
			Vue.set(message, 'only_emojis', innerText.length === 0 || /^[\s\p{Emoji_Presentation}]+$/gmu.test(innerText))
			const day = this.getDay(message.date)
			Vue.set(message, 'day', day)
			if (!('censored' in message)) {
				Vue.set(message, 'censored', 0)
			}
			Vue.set(message, 'reactionDialog', false)
			if (!message.reactions) {
				Vue.set(message, 'reactions', {})
			}
			Vue.set(message, 'formatted', true)
			return message
		}

		getDay(date: number) {
			const d = new Date(date * 1000)
			d.setHours(0)
			d.setMinutes(0)
			d.setSeconds(0)
			d.setMilliseconds(0)
			return d.getTime()
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
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
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
	.verify {
		display: flex;
		height: 40px;
		align-items: center;
		justify-content: center;
	}
	.message-actions .v-icon {
		margin-right: 6px;
	}
	.censor {
		.messages {
			flex: 1;
			padding: 10px;
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
	.avatar {
		width: 42px;
		height: 42px;
		flex: 0 0 42px;
	}
	.emojis {
		padding: 6px;
		font-size: 22px;
		user-select: none;
		.emoji {
			display: inline-block;
			width: 36px;
			height: 36px;
			cursor: pointer;
			transition: all 150ms ease;
			line-height: 36px;
			text-align: center;
		}
		.emoji:hover {
			transform: scale(1.6) translateY(-6px);
		}
		.emoji.selected {
			border: 1px solid #777;
			background: #eee;
			border-radius: 50%;
		}
		.more {
			font-size: 23px;
			color: #777;
		}
	}
	.emojis-dialog {
		contain: inherit;
		overflow: inherit;
	}
	.emojis ::v-deep .chat-input-emoji {
		position: relative;
		display: inline-flex;
	}
	.scroll-down {
		position: absolute;
		bottom: 50px;
		right: 20px;
		padding: 5px;
		cursor: pointer;
		.v-icon {
			font-size: 30px;
		}
	}
</style>