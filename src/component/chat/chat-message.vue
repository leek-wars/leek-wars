<template lang="html">
	<div class="message" :class="{ me: chat.type === 2 && $store.state.farmer && message.farmer.id === $store.state.farmer.id, react: false, reactions: !LeekWars.isEmptyObj(message.reactions) }">
		<router-link v-if="message.farmer.id !== 0" :to="'/farmer/' + message.farmer.id" class="avatar-wrapper">
			<rich-tooltip-farmer :id="message.farmer.id" v-slot="{ on }">
				<avatar :farmer="message.farmer" :on="on" />
			</rich-tooltip-farmer>
		</router-link>
		<img v-else class="avatar" src="/image/favicon.png">
		<div class="bubble" :class="{'br-notification': message.farmer.id === 0, large: large}">
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
			<div v-else @click="clickMessage" v-chat-code-latex class="text" :class="{'large-emojis': message.only_emojis}" v-html="message.content"></div>

			<template v-for="(sub, i) in message.subMessages">
				<div v-if="sub.censored" :key="i" class="censored">Censuré par {{ sub.censored_by.name }}</div>
				<router-link v-else-if="sub.farmer.id === 0" :to="'/fight/' + sub.content.split('|')[1]">
					{{ $t(sub.content.split('|')[0]) }}
				</router-link>
				<div v-else :key="i" @click="clickMessage" v-chat-code-latex class="text" :class="{'large-emojis': sub.only_emojis, ['m-' + sub.id]: true}" v-html="sub.content"></div>
			</template>

			<div class="right">
				<span :title="LeekWars.formatDateTime(message.date)" class="time">{{ LeekWars.formatTime(message.date) }}</span>

				<v-btn v-if="!privateMessages && (message.farmer.color !== 'admin' || $store.getters.admin) && message.farmer.id !== 0"  text small icon color="grey" @click="$emit('menu', $event)">
					<v-icon>mdi-dots-vertical</v-icon>
				</v-btn>
			</div>
			<div class="reactions">
				<v-tooltip v-for="(reaction, emoji) in message.reactions" :key="emoji" :open-delay="500" :close-delay="0" bottom>
					<template v-slot:activator="{ on }">
						<div v-on="on" class="reaction" v-ripple :class="{me: emoji === message.my_reaction}" @click="toggleReaction(emoji)">
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
import { store } from '@/model/store'
	import { vueMain } from '@/model/vue'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import Pseudo from '../app/pseudo.vue'
	import 'katex/dist/katex.min.css'

	@Component({ name: 'ChatMessage' })
	export default class ChatMessageComponent extends Vue {

		@Prop({ required: true }) message!: ChatMessage
		@Prop() chat!: Chat
		@Prop() large!: boolean

		ChatType = ChatType
		pseudos: Vue[] = []

		get me() {
			return this.message.farmer.id === this.$store.state.farmer.id
		}
		get privateMessages() {
			return this.chat && this.chat.type === ChatType.PM
		}

		mounted() {
			this.$el.querySelectorAll('.pseudo').forEach((c) => {
				const name = (c as HTMLElement).innerText
				const farmer = store.state.farmer_by_name[name]
				if (farmer) {
					const pseudo = new Pseudo({ propsData: { farmer }, parent: vueMain })
					pseudo.$mount(c)
					this.pseudos.push(pseudo)
				}
			})
		}

		beforeDestroy() {
			for (const pseudo of this.pseudos) {
				pseudo.$destroy()
			}
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

		clickMessage(e: MouseEvent) {
			// console.log("click", e)
			// const target = e.target as HTMLElement
			// console.log(target)
			// if (target.classList.contains('pseudo')) {
			// 	const farmer = store.state.farmer_by_name[target.innerText]
			// 	console.log("click on farmer", farmer)
			// }
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
		.text {
			word-break: break-word;
			color: #333;
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
		color: #777;
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
	.text ::v-deep a {
		color: #5fad1b;
	}
	.text ::v-deep .v-icon {
		color: #5fad1b;
		font-size: 18px;
		margin-right: 4px;
		vertical-align: baseline;
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
			cursor: pointer;
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