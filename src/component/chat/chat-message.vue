<template lang="html">
	<div class="message" :class="{ me: $store.state.farmer && message.farmer.id === $store.state.farmer.id, react: reactionDialog, reactions: !LeekWars.isEmptyObj(message.reactions) }">
		<router-link v-if="message.farmer.id !== 0" :to="'/farmer/' + message.farmer.id" class="avatar-wrapper">
			<rich-tooltip-farmer :id="message.farmer.id" v-slot="{ on }">
				<avatar :farmer="message.farmer" :on="on" />
			</rich-tooltip-farmer>
		</router-link>
		<img v-else class="avatar" src="/image/favicon.png">
		<div class="bubble" :class="{'br-notification': message.farmer.id === 0}">
			<router-link v-if="message.farmer.id !== 0" :to="'/farmer/' + message.farmer.id" class="author">
				<rich-tooltip-farmer :id="message.farmer.id" v-slot="{ on }">
					<span :class="message.farmer.color" v-on="on">{{ message.farmer.name }}</span>
				</rich-tooltip-farmer>
			</router-link>
			<div v-else class="author">Leek Wars</div>

			<div v-if="message.censored" class="censored">Censuré par {{ message.censored_by.name }}</div>
			<router-link v-else-if="message.farmer.id === 0" :to="'/fight/' + message.content.split('|')[1]">
				{{ $t(message.content.split('|')[0]) }}
			</router-link>
			<div v-else v-large-emojis v-chat-code-latex class="text" v-html="message.content"></div>

			<template v-for="(sub, i) in message.subMessages">
				<div v-if="sub.censored" :key="i" class="censored">Censuré par {{ sub.censored_by.name }}</div>
				<router-link v-else-if="sub.farmer.id === 0" :to="'/fight/' + sub.content.split('|')[1]">
					{{ $t(sub.content.split('|')[0]) }}
				</router-link>
				<div v-else :key="i" v-large-emojis v-chat-code-latex class="text" v-html="sub.content"></div>
			</template>

			<div class="right">
				<span :title="LeekWars.formatDateTime(message.date)" class="time">{{ LeekWars.formatTime(message.date) }}</span>
				<v-menu v-if="!privateMessages && !($store.state.farmer && message.farmer.id === $store.state.farmer.id) && message.farmer.color !== 'admin' && message.farmer.id !== 0" offset-y>
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
			<div class="reactions">
				<div v-for="(count, reaction) in message.reactions" :key="reaction" class="reaction" :class="{me: reaction === message.my_reaction}">
					{{ reaction }} <span v-if="count > 1" class="count">{{ count }}</span>
				</div>
			</div>
		</div>

		<v-menu v-model="reactionDialog" offset-y top :nudge-top="10" content-class="emojis-dialog">
			<template v-slot:activator="{ on }">
				<div v-ripple class="add" v-on="on">
					<v-icon>mdi-emoticon-outline</v-icon> +
				</div>
			</template>
			<div class="emojis">
				<span v-for="(emoji, e) in emojis" :key="e" class="emoji" :class="{selected: emoji === message.my_reaction}" @click="toggleReaction(emoji)">{{ emoji }}</span>
				<span v-if="message.my_reaction && !emojis.includes(message.my_reaction)" class="emoji selected" @click="toggleReaction(message.my_reaction)">{{ message.my_reaction }}</span>
				<emoji-picker @pick="toggleReaction" :close-on-selected="true" :classic="false"><v-icon class="more">mdi-dots-horizontal</v-icon></emoji-picker>
			</div>
		</v-menu>

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
	</div>
</template>

<script lang="ts">
	import { Chat, ChatMessage, ChatType } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { TeamMemberLevel } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import EmojiPicker from './emoji-picker.vue'

	@Component({ name: 'ChatMessage', components: { 'emoji-picker': EmojiPicker } })
	export default class ChatMessageComponent extends Vue {

		@Prop({ required: true }) message!: ChatMessage
		@Prop() chat!: Chat

		ChatType = ChatType
		muteDialog: boolean = false
		muteFarmer: Farmer | null = null
		censorDialog: boolean = false
		censorMessage: ChatMessage | null = null
		censoredMessages: {[key: number]: boolean} = {}
		censorMute: boolean = false
		censorFarmer: Farmer | null = null
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
		reactionDialog: boolean = false
		emojis = ['❤️', '👍', '👎', '👏', '😂', '😀', '😮', '😱']

		get privateMessages() {
			return this.chat && this.chat.type === ChatType.PM
		}
		get isModerator() {
			return this.$store.getters.moderator || (this.chat && this.chat.type === ChatType.TEAM && this.$store.state.farmer.team.member_level >= TeamMemberLevel.CAPTAIN)
		}
		get censorMessages() {
			return this.chat && this.censorFarmer ? this.chat.messages.filter(m => (m.censored === 0 || (m.subMessages && m.subMessages.some(s => s.censored === 0))) && m.farmer.id === this.censorFarmer!.id) : []
		}
		get me() {
			return this.message.farmer.id === this.$store.state.farmer.id
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
			if (!this.muteFarmer || !this.chat) { return }
			LeekWars.post('message/mute', { farmer: this.muteFarmer.id, chat: this.chat.id, duration: 3600 })
			this.muteFarmer.muted = true
			this.muteDialog = false
		}

		toggleReaction(emoji: string) {
			this.reactionDialog = false
			if (this.message.my_reaction === emoji) { // Remove current reaction
				LeekWars.delete('message-reaction/delete', { message_id: this.message.id })
				this.message.my_reaction = null
			} else {
				LeekWars.post('message-reaction/add', { reaction: emoji, message_id: this.message.id })
				this.message.my_reaction = emoji
			}
		}
	}
</script>

<style lang="scss" scoped>
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
	.message.reactions .bubble {
		margin-bottom: 12px;
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
	.text.large-emojis {
		line-height: 26px;
		font-size: 22px;
		::v-deep .emoji {
			width: 24px;
			height: 24px;
		}
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
	.add {
		color: #000;
		background: white;
		padding: 2px 6px;
		cursor: pointer;
		border-radius: 10px;
		display: flex;
		align-items: center;
		font-size: 22px;
		align-self: center;
		opacity: 0;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.1), 0px 1px 1px 0px rgba(0,0,0,0.07), 0px 1px 3px 0px rgba(0,0,0,0.06);
		user-select: none;
		.v-icon {
			font-size: 20px;
			margin-right: 3px;
		}
	}
	.message:hover .add, .message.react .add {
		opacity: 1;
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
	::v-deep .chat-input-emoji {
		position: relative;
		display: inline-flex;
	}
	.message {
		.reactions {
			display: flex;
			margin-bottom: -15px;
			margin-top: 5px;
			gap: 5px;
			flex-wrap: wrap;
			&:empty {
				display: none;
			}
		}
		.reaction {
			background: white;
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.1), 0px 1px 1px 0px rgba(0,0,0,0.07), 0px 1px 3px 0px rgba(0,0,0,0.06);
			border-radius: 4px;
			padding: 2.5px 5px;
			border: 1px solid #ccc;
			color: #444;
			font-weight: 500;
			user-select: none;
			font-size: 18px;
			display: flex;
			align-items: center;
			.count {
				font-size: 15px;
				margin-left: 4px;
			}
			&.me {
				border: 1px solid #555;
			}
		}
	}
	.br-notification {
		background: #5fad1b;
		padding: 3px 7px;
		border-radius: 4px;
		color: white;
		display: inline-block;
		.author, a {
			color: white;
		}
	}
</style>