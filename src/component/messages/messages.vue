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
				<div v-if="currentChat" class="tab action content" icon="delete" @click="LeekWars.addChat(currentChat)">
					<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
				</div>
				<div v-if="currentChat && currentChat.type === ChatType.PM" class="tab action content" icon="delete" @click="quitDialog = true">
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
										<template #activator="{ props }">
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
							<template #forum>
								<router-link to="/forum"><u>forum</u></router-link>
							</template>
						</i18n-t>
					</div>
					<chat v-if="newConversation" :new-farmer="newFarmer" :large="true" :new-conversation="newConversation" />
					<chat v-else :id="currentID ?? undefined" :large="true" />
				</template>
			</panel>
			<!-- <div v-show="!LeekWars.mobile" class="right-column">
				<panel>

				</panel>
			</div> -->
		</div>

		<v-menu v-model="languageDialog" :target="menuTarget" location="bottom end">
			<v-list :dense="true">
				<div v-for="data in Object.values(LeekWars.languages).filter(l => l.chats)" :key="data.code" class="language">
					<flag :code="data.country" />
					<v-list-item v-for="(chatId, i) in data.chats" :key="i" class="language" @click="$router.push('/chat/' + chatId)">
						<v-icon>{{ LeekWars.publicChats[chatId].icon }}</v-icon>
						<span class="name">{{ LeekWars.publicChats[chatId].name }}</span>
						<span class="unread-circle" v-if="$store.state.chat[chatId] && !$store.state.chat[chatId].read"></span>
					</v-list-item>
				</div>
			</v-list>
		</v-menu>

		<popup v-model="quitDialog" :width="500">
			<template #icon>
				<v-icon>mdi-delete</v-icon>
			</template>
			<template #title>{{ $t('quit_conversation') }}</template>
			{{ $t('quit_confirm') }}
			<template #actions>
				<div v-ripple @click="quitDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="red" @click="quitConversation">{{ $t('quit') }}</div>
			</template>
		</popup>
	</div>
</template>

<script lang="ts" setup>
	import { Chat as ChatModel, ChatType } from '@/model/chat'
	import { mixins , useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { store } from '@/model/store'
	import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { emitter } from '@/model/vue'
	import { env } from '@/env'
	import Conversation from '@/component/messages/conversation.vue'

	const Chat = defineAsyncComponent(() => import(`@/component/chat/chat.vue`))

	defineOptions({ name: 'messages', i18n: {}, mixins: [...mixins] })

	const { locale: i18nLocale } = useI18n()
	const t = useNamespacedT('messages')
	const route = useRoute()
	const router = useRouter()

	const newFarmer_ = ref<any>(null)
	const currentID = ref<number | null>(null)
	const quitDialog = ref(false)
	const languageDialog = ref(false)
	const menuTarget = ref<HTMLElement | null>(null)
	const actions = ref<any[]>([])
	const loadingConversations = ref(false)

	const chats = computed(() => {
		const chats = [] as any[]
		if (store.state.farmer && store.state.farmer.public_chat_enabled) {
			chats.push({ name: 'Français', flag: 'fr', chats: Object.values(LeekWars.publicChats).filter(c => c.language === 'fr') })
			chats.push({ name: 'English', flag: 'gb', chats: Object.values(LeekWars.publicChats).filter(c => c.language === 'en') })
		}
		if (store.state.farmer && store.state.farmer.team) {
			const team_chats = [
				{ id: store.state.farmer.team.chat, name: store.state.farmer.team.name, icon: 'mdi-chat-outline' },
			]
			if (store.state.farmer.group) {
				team_chats.push({ id: store.state.farmer.group.chat, name: store.state.farmer.group.name, icon: 'mdi-chat-outline' })
			}
			chats.push({name: t('cat_team') as string, icon: 'mdi-account-multiple', chats: team_chats })
		}
		return chats
	})

	onMounted(() => {
		LeekWars.footer = false
		LeekWars.box = true
		LeekWars.large = true
		emitter.on('back', back)
		emitter.on('focus', conversationRead)
	})

	onUnmounted(() => {
		LeekWars.footer = true
		LeekWars.box = false
		LeekWars.large = false
		emitter.off('back', back)
		emitter.off('focus', conversationRead)
	})

	function back() {
		router.push('/chat')
	}

	const currentConversation = computed(() => (currentID.value === 0) ? newConversation.value : (currentID.value ? store.state.chat[currentID.value] : null))

	const newConversation = computed<ChatModel | null>(() => {
		if ('name' in route.params) {
			const chat = new ChatModel(0, ChatType.PM, route.params.name as string, true)
			chat.last_message = t('new_message') as string
			chat.farmers = [store.state.farmer!, newFarmer.value]
			return chat
		}
		return null
	})

	const newFarmer = computed<any>(() => {
		if (!newFarmer_.value && 'name' in route.params) {
			newFarmer_.value = {
				id: parseInt(route.params.farmer_id as string, 10),
				name: route.params.name,
				avatar_changed: parseInt(route.params.avatar_changed as string, 10)
			}
		}
		return newFarmer_.value
	})

	const isAdmin = computed(() => {
		const id = newConversation.value ? newFarmer.value.id : getConversationFarmerId()
		return id === 1 || id === 2 || id === 11
	})

	const id = computed(() => 'id' in route.params ? parseInt(route.params.id as string, 10) : null)

	const currentChat = computed(() => id.value ? store.state.chat[id.value] : null)

	const chat_name = computed(() => currentChat.value ? currentChat.value.name : '')

	const isPrivate = computed(() => currentChat.value && currentChat.value.type === ChatType.PM)

	const isPublicChat = computed(() => currentID.value !== null && LeekWars.isPublicChat(currentID.value))

	function update() {
		if (id.value !== null || newFarmer.value) {
			selectConversation(id.value || 0)
		} else {
			if (LeekWars.mobile) {
				LeekWars.splitShowList()
				LeekWars.setTitle(t('title') as string)
			} else if (store.state.conversationsList.length) {
				router.replace('/chat/' + store.state.conversationsList[0].id)
			}
		}
	}
	watch(() => route.params, update)

	actions.value = [{icon: 'mdi-delete', click: () => showQuitDialog()}]
	if (!env.SOCIAL) {
		router.push('/')
	}
	LeekWars.setTitle(t('title') as string)
	update()

	function selectConversation(theId: number) {
		currentID.value = theId
		LeekWars.splitShowContent()
		if (currentChat.value && currentChat.value.type === ChatType.PM) {
			LeekWars.setActions(actions.value)
		} else if (LeekWars.isPublicChat(theId)) {
			LeekWars.setActions([{icon: 'mdi-translate', click: (e: Event) => showLanguageDialog(e)}])
		}
		if (theId === 0) {
			LeekWars.setTitle(t('new_message') as string)
		} else if (currentID.value in store.state.chat) {
			LeekWars.setTitle(chat_name.value)
		} else {
			LeekWars.setTitle(t('title') as string)
		}
	}

	function getConversationName() {
		if (!currentChat.value) { return }
		for (const farmer of currentChat.value.farmers) {
			if (!store.state.farmer || farmer.id !== store.state.farmer.id) {
				return farmer.name
			}
		}
	}

	function getConversationFarmerId() {
		if (currentChat.value && currentChat.value.type === ChatType.PM) {
			for (const farmer of currentChat.value.farmers) {
				if (!store.state.farmer || farmer.id !== store.state.farmer.id) {
					return farmer.id
				}
			}
		}
	}

	function showLanguageDialog(e: Event) {
		menuTarget.value = e.currentTarget as HTMLElement
		languageDialog.value = true
	}

	function showQuitDialog() {
		quitDialog.value = true
	}

	function quitConversation() {
		if (!currentConversation.value) { return }
		LeekWars.post('message/quit-conversation', {conversation_id: currentConversation.value.id})
		store.commit('quit-conversation', currentConversation.value.id)
		if (store.state.conversationsList.length) {
			router.replace('/chat/' + store.state.conversationsList[0].id)
		} else {
			router.replace('/chat')
		}
		quitDialog.value = false
	}

	function conversationRead() {
		if (currentConversation.value) {
			LeekWars.socket.send([SocketMessage.MP_READ, currentConversation.value.id])
		}
	}

	function conversationsScroll(e: MouseEvent) {
		const target = e.target as HTMLElement
		if (target.scrollTop + target.clientHeight >= target.scrollHeight - 5 && !store.state.loadingConversations) {
			store.commit('load-conversations')
		}
	}

	function toggleNotifications(chatID: number) {
		store.commit('toggle-chat-notifications', chatID)
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
	#app:not(.app) .side-column {
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
	.language {
		display: flex;
		align-items: center;
		padding-left: 10px;
		.flag {
			max-width: 30px;
			max-height: 20px;
			flex-shrink: 0;
		}
		.name {
			padding-left: 8px;
		}
	}
	.unread-circle {
		display: inline-block;
		background: #5fad1b;
		border-radius: 50%;
		width: 10px;
		height: 10px;
		margin-left: 8px;
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