<template lang="html">
	<div class="message" :class="{ me: chat.type === 2 && $store.state.farmer && message.farmer.id === $store.state.farmer.id, react: false, reactions: !LeekWars.isEmptyObj(message.reactions) }">
		<router-link v-if="message.farmer.id !== 0" :to="'/farmer/' + message.farmer.id" class="avatar-wrapper">
			<rich-tooltip-farmer :id="message.farmer.id">
				<avatar :farmer="message.farmer" />
			</rich-tooltip-farmer>
		</router-link>
		<img v-else class="avatar" src="/image/favicon.png">
		<div class="bubble" :class="{large: large}">

			<router-link v-if="message.farmer.id !== 0" :to="'/farmer/' + message.farmer.id" class="author">
				<rich-tooltip-farmer :id="message.farmer.id" v-slot="{ props }">
					<span :class="message.farmer.color" v-bind="props">{{ message.farmer.name }}</span>
				</rich-tooltip-farmer>
			</router-link>
			<div v-else class="author"><span class="bot">Leek Wars 🤖</span></div>

			<chat-message-text :message="message" />

			<template v-for="(sub, i) in message.subMessages">
				<chat-message-text :message="sub" />
			</template>

			<div class="right">
				<span :title="LeekWars.formatDateTime(message.date)" class="time">{{ LeekWars.formatTime(message.date) }}</span>

				<v-btn v-if="!privateMessages && (message.farmer.color !== 'admin' || $store.getters.admin) && message.farmer.id !== 0" size="x-small" variant="text" icon="mdi-dots-vertical" color="grey" @click="$emit('menu', $event)"></v-btn>
			</div>
			<div class="reactions">
				<v-tooltip v-for="(reaction, emoji) in message.reactions" :key="emoji" :open-delay="500" :close-delay="0" bottom>
					<template v-slot:activator="{ props }">
						<div v-bind="props" class="reaction" v-ripple :class="{me: emoji === message.my_reaction}" @click="toggleReaction(emoji)">
							{{ emoji }} <span v-if="reaction.count > 1" class="count">{{ reaction.count }}</span>
						</div>
					</template>
					{{ reaction.farmers.join(', ') }}
				</v-tooltip>
			</div>
		</div>

		<div v-if="$store.state.farmer.verified" v-ripple class="add" @click="$emit('emoji', $event)">
			<v-icon>mdi-emoticon-outline</v-icon> +
		</div>
	</div>
</template>

<script lang="ts">
	import { Chat, ChatMessage, ChatType } from '@/model/chat'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import 'katex/dist/katex.min.css'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import ChatMessageText from './chat-message-text.vue'

	@Options({ name: 'ChatMessage', components: { RichTooltipFarmer, ChatMessageText } })
	export default class ChatMessageComponent extends Vue {

		@Prop({ required: true }) message!: ChatMessage
		@Prop() chat!: Chat
		@Prop() large!: boolean

		ChatType = ChatType

		get me() {
			return this.message.farmer.id === this.$store.state.farmer.id
		}
		get privateMessages() {
			return this.chat && this.chat.type === ChatType.PM
		}

		@Watch('message.reactions')
		updateReactions() {
			this.$emit('scroll')
		}

		toggleReaction(emoji: string) {
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
		background: var(--pure-white);
		position: relative;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.1), 0px 1px 1px 0px rgba(0,0,0,0.07), 0px 1px 3px 0px rgba(0,0,0,0.06);
		min-width: 0;
		.report, .mute, .unmute {
			display: none;
			cursor: pointer;
		}
		.text {
			word-break: break-word;
		}
		.text.large-emojis, &.large .text.large-emojis {
			line-height: 26px;
			font-size: 22px;
			::v-deep .emoji {
				width: 24px;
				height: 24px;
			}
		}
		&.large {
			padding: 6px 10px;
			.text, .author {
				font-size: 15.5px;
			}
			.right {
				top: 7px;
			}
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
		color: var(--text-color-secondary);
	}
	.right {
		font-size: 13px;
		position: absolute;
		top: 3px;
		right: 0;
		.time {
			color: var(--text-color-secondary);
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
	.add {
		background: var(--pure-white);
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
			background: var(--pure-white);
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.1), 0px 1px 1px 0px rgba(0,0,0,0.07), 0px 1px 3px 0px rgba(0,0,0,0.06);
			border-radius: 4px;
			padding: 2.5px 5px;
			border: 1px solid var(--border);
			color: var(--text-color-secondary);
			font-weight: 500;
			user-select: none;
			font-size: 18px;
			display: flex;
			align-items: center;
			cursor: pointer;
			.count {
				font-size: 15px;
				margin-left: 4px;
			}
			&.me {
				border: 1px solid var(--text-color-secondary);
			}
		}
	}
</style>