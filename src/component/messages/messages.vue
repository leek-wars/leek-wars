<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1>{{ $t('title') }}</h1>
				<div class="info">
					<v-icon v-if="isPrivate">mdi-at</v-icon><v-icon v-else>mdi-pound</v-icon> {{ chat_name }}
				</div>
			</div>
			<div class="tabs">
				<div v-if="chat" class="tab action content" icon="delete" @click="LeekWars.addChat(chat)">
					<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
				</div>
				<div v-if="chat && chat.type === ChatType.PM" class="tab action content" icon="delete" @click="quitDialog = true">
					<v-icon>mdi-exit-to-app</v-icon>
					<span>{{ $t('quit') }}</span>
				</div>
			</div>
		</div>
		<div class="container last">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="side-column">
				<panel class="first">
					<template #content>
						<div class="conversations" @scroll="conversationsScroll">
							<div v-for="category in chats" :key="category.name" class="category">
								<div class="name">
									<v-icon v-if="category.icon">{{ category.icon }}</v-icon>
									<flag v-else :code="category.flag" />
									{{ category.name }}
								</div>
								<div v-for="chat in category.chats" :key="chat.id" class="conversation chat-preview" :class="{unread: $store.state.chat[chat.id] && !$store.state.chat[chat.id].read, notifications: $store.state.chat[chat.id] && $store.state.chat[chat.id].notifications}">
									<router-link class="wrapper" :to="'/chat/' + chat.id" v-ripple>
										<v-icon>{{ chat.icon }}</v-icon>
										{{ $t(chat.name) }}
										<div class="unread"></div>
									</router-link>
									<v-tooltip>
										<template v-slot:activator="{ props }">
											<v-icon v-if="$store.state.chat[chat.id] && $store.state.chat[chat.id].notifications" v-bind="props" class="bell" @click.stop="toggleNotifications(chat.id)">mdi-bell</v-icon>
											<v-icon v-else v-bind="props" class="bell" @click.stop="toggleNotifications(chat.id)">mdi-bell-off</v-icon>
										</template>
										{{ $store.state.chat[chat.id] && $store.state.chat[chat.id].notifications ? $t('disable_notifications') : $t('enable_notifications') }}
									</v-tooltip>
								</div>
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
					</template>
				</panel>
			</div>
			<panel v-show="!LeekWars.mobile || LeekWars.splitBack" class="main-column">
				<template #content>
					<div class="admin-warn" v-if="isAdmin">
						<v-icon>mdi-alert-outline</v-icon>
						<i18n-t keypath="admin_warn" tag="div">
							<router-link slot="forum" to="/forum"><u>forum</u></router-link>
						</i18n-t>
					</div>
					<chat v-if="newConversation" :new-farmer="newFarmer" :large="true" :new-conversation="newConversation" />
					<chat v-else :id="currentID" :large="true" />
				</template>
			</panel>
			<!-- <div v-show="!LeekWars.mobile" class="right-column">
				<panel>

				</panel>
			</div> -->
		</div>

		<popup v-model="quitDialog" :width="500">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('quit_conversation') }}</span>
			{{ $t('quit_confirm') }}
			<template #actions>
				<div v-ripple @click="quitDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="red" @click="quitConversation">{{ $t('quit') }}</div>
			</template>
		</popup>
	</div>
</template>

<script lang="ts">
	const ChatElement = () => import(/* webpackChunkName: "chat" */ `@/component/chat/chat.vue`)
	import { Chat, ChatType } from '@/model/chat'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { store } from '@/model/store'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import ConversationElement from '@/component/messages/conversation.vue'

	@Component({ name: 'messages', i18n: {}, mixins: [...mixins], components: { chat: ChatElement, conversation: ConversationElement } })
	export default class Messages extends Vue {
		ChatType = ChatType
		newFarmer_: any = null
		currentID: number | null = null
		quitDialog: boolean = false
		actions = [{icon: 'mdi-delete', click: () => this.showQuitDialog()}]
		loadingConversations: boolean = false

		get chats() {
			const chats = [] as any[]
			if (store.state.farmer && store.state.farmer.public_chat_enabled) {
				chats.push({ name: 'Français', flag: 'fr', chats: Object.values(LeekWars.publicChats).filter(c => c.language === 'fr') })
				chats.push({ name: 'English', flag: 'gb', chats: Object.values(LeekWars.publicChats).filter(c => c.language === 'en') })
				// chats.push({ name: 'Español', flag: 'es', chats: Object.values(LeekWars.publicChats).filter(c => c.language === 'es') })
			}
			if (this.$store.state.farmer && this.$store.state.farmer.team) {
				const team_chats = [
					{ id: this.$store.state.farmer.team.chat, name: this.$store.state.farmer.team.name, icon: 'mdi-chat-outline' },
				]
				if (this.$store.state.farmer.group) {
					team_chats.push({ id: this.$store.state.farmer.group.chat, name: this.$store.state.farmer.group.name, icon: 'mdi-chat-outline' })
				}
				chats.push({name: this.$t('cat_team'), icon: 'mdi-account-multiple', chats: team_chats })
			}
			return chats
		}

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
				const chat = new Chat(0, ChatType.PM, this.$route.params.name, true)
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

		get isAdmin() {
			const id = this.newConversation ? this.newFarmer.id : this.getConversationFarmerId()
			return id === 1 || id === 2 || id === 11
		}

		get id() {
			return 'id' in this.$route.params ? parseInt(this.$route.params.id, 10) : null
		}

		get chat() {
			return this.id ? this.$store.state.chat[this.id] : null
		}

		get chat_name() {
			return this.chat ? this.chat.name : ''
		}

		get isPrivate() {
			return this.chat && this.chat.type === ChatType.PM
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
			if (this.chat && this.chat.type === ChatType.PM) {
				LeekWars.setActions(this.actions)
			}
			if (id === 0) {
				LeekWars.setTitle(this.$i18n.t('new_message'))
			} else if (this.currentID in this.$store.state.chat) {
				LeekWars.setTitle(this.chat_name)
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

		getConversationFarmerId() {
			if (this.chat && this.chat.type === ChatType.PM) {
				for (const farmer of this.chat.farmers) {
					if (!this.$store.state.farmer || farmer.id !== this.$store.state.farmer.id) {
						return farmer.id
					}
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

		toggleNotifications(chatID: number) {
			store.commit('toggle-chat-notifications', chatID)
		}
	}
</script>

<style lang="scss" scoped>
	.page-header .info {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 20px;
		line-height: 32px;
		font-weight: 500;
	}
	.container {
		flex: 1;
		min-height: 0;
		flex-wrap: nowrap;
	}
	.main-column, .side-column, .right-column {
		height: 100%;
		min-width: 0;
		.panel {
			height: 100%;
			margin-bottom: 0;
		}
	}
	.main-column > .content {
		padding: 0;
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
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
		min-height: 0;
		flex: 1;
	}
	.conversations .content {
		padding: 0;
	}
	.router-link-active {
		background: var(--background-header);
	}
	.chats {
		padding: 10px 0;
	}
	.category {
		& > .name {
			display: flex;
			gap: 6px;
			align-items: center;
			padding: 10px;
			.flag {
				max-width: 30px;
				max-height: 20px;
			}
		}
	}
	.chat-preview {
		color: #555;
		display: flex;
		position: relative;
		.wrapper {
			flex: 1;
			display: flex;
			gap: 8px;
			align-items: center;
			padding: 6px;
			padding-left: 20px;
			padding-right: 15px;
		}
		.name {
			flex: 1;
		}
		.bell {
			display: none;
			font-size: 18px;
			position: absolute;
			right: 10px;
			top: 5px;
			padding: 4px;
		}
		&.notifications .bell {
			display: inline-flex;
		}
		&:hover {
			background: var(--pure-white);
			cursor: pointer;
			.bell {
				display: inline-flex;
			}
		}
		.unread {
			background: #5fad1b;
			border-radius: 50%;
			width: 10px;
			height: 10px;
			display: none;
		}
		&.unread {
			font-weight: bold;
			color: black;
			.unread {
				display: inline-block;
			}
		}
	}
	.admin-warn {
		padding: 15px 20px;
		background: var(--pure-white);
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		gap: 6px;
		i {
			color: rgb(255, 140, 0)
		}
	}
</style>