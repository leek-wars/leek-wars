<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div class="tab action content" icon="delete" @click="LeekWars.addChat(id, ChatType.PM, getConversationName())">
					<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
				</div>
				<div class="tab action content" icon="delete" @click="quitDialog = true">
					<v-icon>mdi-delete</v-icon>
					<span>{{ $t('quit') }}</span>
				</div>
			</div>
		</div>
		<div class="container last">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="side-column">
				<panel class="first">
					<div slot="content" class="conversations" @scroll="conversationsScroll">
						<div v-for="category in chats" :key="category.name" class="category">
							<div class="name">{{ $t('cat_' + category.name) }}</div>
							<router-link v-for="chat in category.chats" :key="chat.id" :to="'/chat/' + chat.id">
								<div class="conversation chat-preview" v-ripple>
									<v-icon>{{ chat.icon }}</v-icon>
									{{ $t(chat.name) }}
								</div>
							</router-link>
						</div>
						<div v-if="$store.state.farmer && $store.state.farmer.team" class="category">
							<div class="name">
								<v-icon>mdi-account-multiple</v-icon>
								{{ $t('cat_team') }}
							</div>
							<router-link :to="'/chat/' + $store.state.farmer.team.chat">
								<div class="conversation chat-preview" @click="currentChat = $store.state.farmer.team.chat">
									<v-icon>mdi-chat-outline</v-icon>
									{{ $t('team') }}
								</div>
							</router-link>
						</div>
						<div class="category">
							<div class="name">
								<v-icon>mdi-email-outline</v-icon>
								{{ $t('cat_private') }}
							</div>
						</div>
						<router-link v-if="newConversation && newConversation.messages.length === 0" :to="'/chat/new/' + newFarmer.id + '/' + newFarmer.name + '/' + newFarmer.avatar_changed">
							<conversation :chat="newConversation" />
						</router-link>
						<router-link v-for="conversation in $store.state.conversationsList" :key="conversation.id" :to="'/chat/' + conversation.id">
							<conversation :chat="conversation" />
						</router-link>
					</div>
				</panel>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="main-column">
				<panel>
					<chat v-if="currentConversation && currentConversation.id !== 0" :id="currentConversation.id" :large="true" slot="content" />
					<chat v-else-if="newConversation" slot="content" :new-farmer="newFarmer" :large="true" :new-conversation="newConversation" />
				</panel>
			</div>
			<div v-show="!LeekWars.mobile" class="right-column">
				<panel>

				</panel>
			</div>
		</div>

		<popup v-model="quitDialog" :width="500">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('quit_conversation') }}</span>
			{{ $t('quit_confirm') }}
			<div slot="actions">
				<div v-ripple @click="quitDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="red" @click="quitConversation">{{ $t('quit') }}</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { Chat, ChatType } from '@/model/chat'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { store } from '@/model/store'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'messages', i18n: {}, mixins: [...mixins] })
	export default class Messages extends Vue {
		ChatType = ChatType
		newFarmer_: any = null
		currentID: number | null = null
		quitDialog: boolean = false
		actions = [{icon: 'mdi-delete', click: () => this.showQuitDialog()}]
		loadingConversations: boolean = false

		chats = [
			{ name: 'fr', chats: [
				{ id: 1, name: 'fr_general', icon: 'mdi-chat-outline' },
				{ id: 32506, name: 'fr_help', icon: 'mdi-help-circle-outline' },
				{ id: 32507, name: 'fr_programming', icon: 'mdi-code-braces' },
			]},
			{ name: 'en' , chats: [
				{ id: 2, name: 'en_general', icon: 'mdi-chat-outline' },
				{ id: 32508, name: 'en_help', icon: 'mdi-help-circle-outline' },
				{ id: 32509, name: 'en_programming', icon: 'mdi-code-braces' },
			]},
		]

		created() {
			if (!this.env.SOCIAL) {
				this.$router.push('/')
				return
			}
			LeekWars.setTitle(this.$t('title'))
			this.update()
		}

		mounted() {
			LeekWars.footer = false
			LeekWars.box = true
			LeekWars.large = true
			this.$root.$on('back', this.back)
			this.$root.$on('focus', this.conversationRead)
		}

		destroyed() {
			LeekWars.footer = true
			LeekWars.box = false
			LeekWars.large = false
			this.$root.$off('back', this.back)
			this.$root.$off('focus', this.conversationRead)
		}

		back() {
			this.$router.push('/chat')
		}

		get currentConversation() {
			return (this.currentID === 0) ? this.newConversation : (this.currentID ? this.$store.state.chat[this.currentID] : null)
		}

		get newConversation(): Chat | null {
			if ('name' in this.$route.params) {
				const chat = new Chat(0, ChatType.PM)
				chat.last_message = this.$t('new_message') as string
				chat.farmers = [this.$store.state.farmer, this.newFarmer]
				return chat
			}
			return null
		}

		get newFarmer(): any {
			if (!this.newFarmer_ && 'name' in this.$route.params) {
				this.newFarmer_ = {
					id: parseInt(this.$route.params.farmer_id, 10),
					name: this.$route.params.name,
					avatar_changed: parseInt(this.$route.params.avatar_changed, 10)
				}
			}
			return this.newFarmer_
		}

		get id() {
			return 'id' in this.$route.params ? parseInt(this.$route.params.id, 10) : null
		}

		get chat() {
			return this.id ? this.$store.state.chat[this.id] : null
		}

		@Watch('$route.params')
		update() {
			// console.log("update", this.$route.params)
			if (this.id !== null || this.newFarmer) {
				this.selectConversation(this.id || 0)
			} else {
				if (LeekWars.mobile) {
					LeekWars.splitShowList()
					LeekWars.setTitle(this.$i18n.t('title'))
				} else if (this.$store.state.conversationsList.length) {
					this.$router.replace('/chat/' + this.$store.state.conversationsList[0].id)
				}
			}
		}

		selectConversation(id: number) {
			this.currentID = id
			LeekWars.splitShowContent()
			LeekWars.setActions(this.actions)
			if (id === 0) {
				LeekWars.setTitle(this.$i18n.t('new_message'))
			} else if (this.currentID in this.$store.state.chat) {
				LeekWars.setTitle(this.getConversationName())
			} else {
				LeekWars.setTitle(this.$i18n.t('title'))
			}
		}

		getConversationName() {
			if (!this.chat) { return }
			for (const farmer of this.chat.farmers) {
				if (!this.$store.state.farmer || farmer.id !== this.$store.state.farmer.id) {
					return farmer.name
				}
			}
		}

		showQuitDialog() {
			this.quitDialog = true
		}

		quitConversation() {
			if (!this.currentConversation) { return }
			LeekWars.post('message/quit-conversation', {conversation_id: this.currentConversation.id})
			this.$store.commit('quit-conversation', this.currentConversation.id)
			if (this.$store.state.conversationsList.length) {
				this.$router.replace('/chat/' + this.$store.state.conversationsList[0].id)
			} else {
				this.$router.replace('/chat')
			}
			this.quitDialog = false
		}

		conversationRead() {
			if (this.currentConversation) {
				LeekWars.socket.send([SocketMessage.MP_READ, this.currentConversation.id])
			}
		}

		conversationsScroll(e: MouseEvent) {
			const target = e.target as HTMLElement
			if (target.scrollTop + target.clientHeight >= target.scrollHeight - 5 && !store.state.loadingConversations) {
				store.commit('load-conversations')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		flex: 1;
		min-height: 0;
	}
	.main-column, .side-column, .right-column {
		height: 100%;
		.panel {
			height: 100%;
			margin-bottom: 0;
		}
	}
	.side-column {
		flex: 400px 0 0;
		min-width: 0;
	}
	.right-column {
		flex: 400px 0 0;
		min-width: 0;
	}
	.main-column {
		flex: 1;
	}
	.conversations {
		overflow-y: auto;
		overflow-x: hidden;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.chat {
		height: 100%;
	}
	.conversations .content {
		padding: 0;
	}
	.router-link-active .conversation {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.chats {
		padding: 10px 0;
	}
	.category {
		.name {
			padding: 10px;
		}
	}
	.chat-preview {
		padding: 6px;
		padding-left: 20px;
		color: #555;
		display: block;
		&:hover {
			background: white;
			color: black;
			cursor: pointer;
		}
	}
</style>