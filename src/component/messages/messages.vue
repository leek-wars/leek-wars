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
							<div class="name">
								<v-icon v-if="category.icon">{{ category.icon }}</v-icon>
								<img v-else :src="category.image">
								{{ $t('cat_' + category.name) }}
							</div>
							<div v-for="chat in category.chats" :key="chat.id" class="conversation chat-preview" :class="{unread: $store.state.chat[chat.id] && !$store.state.chat[chat.id].read, notifications: $store.state.chat[chat.id] && $store.state.chat[chat.id].notifications}">
								<router-link class="wrapper" :to="'/chat/' + chat.id" v-ripple>
									<v-icon>{{ chat.icon }}</v-icon>
									{{ $t(chat.name) }}
									<div class="unread"></div>
								</router-link>
								<tooltip>
									<template v-slot:activator="{ on }">
										<v-icon v-if="$store.state.chat[chat.id] && $store.state.chat[chat.id].notifications" v-on="on" class="bell" @click.stop="toggleNotifications(chat.id)">mdi-bell</v-icon>
										<v-icon v-else v-on="on" class="bell" @click.stop="toggleNotifications(chat.id)">mdi-bell-off</v-icon>
									</template>
									{{ $store.state.chat[chat.id] && $store.state.chat[chat.id].notifications ? $t('disable_notifications') : $t('enable_notifications') }}
								</tooltip>
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
				</panel>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="main-column">
				<panel>
					<chat v-if="newConversation" slot="content" :new-farmer="newFarmer" :large="true" :new-conversation="newConversation" />
					<chat v-else :id="currentID" :large="true" slot="content" />
				</panel>
			</div>
			<!-- <div v-show="!LeekWars.mobile" class="right-column">
				<panel>

				</panel>
			</div> -->
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

		get chats() {
			const chats = [
				{ name: 'fr', image: '/image/flag/fr.png', chats: [
					{ id: 1, name: 'Général', icon: 'mdi-chat-outline' },
					{ id: 32506, name: 'Aide', icon: 'mdi-help-circle-outline' },
					{ id: 32507, name: 'Programmation', icon: 'mdi-code-braces' },
				]},
				{ name: 'en', image: '/image/flag/gb.png', chats: [
					{ id: 2, name: 'General', icon: 'mdi-chat-outline' },
					{ id: 32508, name: 'Help', icon: 'mdi-help-circle-outline' },
					{ id: 32509, name: 'Programming', icon: 'mdi-code-braces' },
				]}
			] as any[]
			if (this.$store.state.farmer && this.$store.state.farmer.team) {
				chats.push({name: 'team', icon: 'mdi-account-multiple', chats: [
					{ id: this.$store.state.farmer.team.chat, name: this.$store.state.farmer.team.name, icon: 'mdi-chat-outline' },
				]})
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
	.router-link-active {
		background: #ccc;
		color: black;
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
			img {
				height: 22px;
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
			background: white;
			color: black;
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
</style>