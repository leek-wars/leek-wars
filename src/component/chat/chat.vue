<template lang="html">
	<div class="chat">
		<loader v-show="chat && chat.loading" />
		<div v-if="!loading && (!chat || !chat.messages.length)" v-autostopscroll class="messages">
			<div class="no-messages">{{ $t('main.no_messages_yet') }}</div>
		</div>
		<div v-else-if="chat && chat.messages.length" ref="messages" v-autostopscroll class="messages" @scroll="scroll">
			<div v-for="(messages, day) in chat.days" :key="day">
				<div v-if="messages[0]" class="separator">
					{{ $filters.date(messages[0].date) }}
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
		<chat-input v-else :chat="id || 0" @message="sendMessage" />

		<div v-show="!isScrollBottom" class="card scroll-down" v-ripple @click="scrollToBottom">
			<v-icon>mdi-chevron-down</v-icon>
		</div>

		<report-dialog v-if="reportFarmer" v-model="showReport" :target="reportFarmer" :reasons="reasons" :parameter="reportContent" class="report-dialog" />

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
				<v-list-item v-if="$store.getters.admin && menuMessage.farmer.id !== 0" v-ripple @click="createIssue(menuMessage)">
					<v-icon>mdi-github</v-icon>
					<span>Créer une issue</span>
				</v-list-item>
			</v-list>
		</v-menu>

		<popup v-model="censorDialog" :width="500" icon="mdi-gavel" title="Censurer">
			<div v-if="muteFarmer" class="censor">
				<i18n-t keypath="warning.censor_farmer">
					<template #farmer>
						<b>{{ muteFarmer.name }}</b>
					</template>
				</i18n-t>
				<div class="flex">
					<avatar :farmer="muteFarmer" />
					<div class="messages card">
						<div v-for="message in censorMessagesList" :key="message.id">
							<v-checkbox v-if="message.censored === 0" v-model="censoredMessages[message.id]" :hide-details="true">
								<template #label>
									<span v-html="message.content"></span>
								</template>
							</v-checkbox>
						</div>
					</div>
				</div>
				<v-checkbox v-model="censorMute" label="Mettre en sourdine pour 1h" :hide-details="true" />
			</div>
			<template #actions>
				<div v-ripple @click="censorDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="mute red" @click="censorConfirm"><v-icon>mdi-gavel</v-icon> Censurer</div>
			</template>
		</popup>

		<popup v-model="deleteDialog" :width="500" icon="mdi-delete" title="Supprimer">
			<div v-if="muteFarmer" class="censor">
				<i18n-t keypath="warning.delete_farmer"></i18n-t>
				<div class="flex">
					<avatar :farmer="muteFarmer" />
					<div class="messages card">
						<div v-for="message in deleteMessagesList" :key="message.id">
							<v-checkbox v-model="deletedMessages[message.id]" :hide-details="true">
								<template #label>
									<span v-html="message.content"></span>
								</template>
							</v-checkbox>
						</div>
					</div>
				</div>
				<v-checkbox v-if="isModerator && muteFarmer.color !== 'admin'" v-model="censorMute" label="Mettre en sourdine pour 1h" :hide-details="true" />
			</div>
			<template #actions>
				<div v-ripple @click="deleteDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="mute red" @click="deleteConfirm"><v-icon>mdi-delete</v-icon> Supprimer</div>
			</template>
		</popup>

		<popup v-model="issueDialog" :width="600" icon="mdi-github" title="Créer une issue">
			<div v-if="issueMessage" class="issue">
				<div class="flex">
					<avatar :farmer="issueMessage.farmer" />
					<div class="bubble card">{{ issueMessage.raw_content }}</div>
				</div>
				<label>Titre</label>
				<input v-model="issueTitle" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
				<label>Description (optionnel)</label>
				<textarea v-model="issueDescription" rows="4" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
			</div>
			<template #actions>
				<div v-ripple @click="issueDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="green" @click="createIssueConfirm"><v-icon>mdi-github</v-icon> Créer</div>
			</template>
		</popup>

		<popup v-model="muteDialog" :width="500" icon="mdi-gavel" title="Censurer">
			<div v-if="muteFarmer" class="censor">
				<i18n-t keypath="warning.mute_popup">
					<template #farmer>
						<b>{{ muteFarmer.name }}</b>
					</template>
				</i18n-t>
			</div>
			<template #actions>
				<div v-ripple @click="muteDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="mute red" @click="muteConfirm"><v-icon>mdi-gavel</v-icon> Censurer</div>
			</template>
		</popup>

		<v-menu v-if="menuMessage && $store.state.farmer?.verified" offset-y top :nudge-top="10" v-model="menuEmoji" :activator="menuEmojiActivator" content-class="emojis-dialog">
			<v-card class="emojis">
				<span v-for="(emoji, e) in emojis" :key="e" class="emoji" :class="{selected: emoji === menuMessage.my_reaction}" @click="toggleReaction(emoji)">{{ emoji }}</span>
				<span v-if="menuMessage.my_reaction && !emojis.includes(menuMessage.my_reaction)" class="emoji selected" @click="toggleReaction(menuMessage.my_reaction)">{{ menuMessage.my_reaction }}</span>
				<emoji-picker @pick="toggleReaction" :close-on-selected="true"><v-icon class="more">mdi-dots-horizontal</v-icon></emoji-picker>
			</v-card>
		</v-menu>
	</div>
</template>

<script lang="ts" setup>
	import type { ChatMessage } from '@/model/chat'
	import { ChatType } from '@/model/chat'
	import { formatChatMessage } from '@/model/chat-format'
	import type { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { store } from '@/model/store'
	import { TeamMemberLevel } from '@/model/team'
	import { computed, defineAsyncComponent, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRouter } from 'vue-router'
	import ChatInput from './chat-input.vue'
	import ChatMessageComponent from './chat-message.vue'
	import EmojiPicker from './emoji-picker.vue'
	import { emitter } from '@/model/vue'

	const ReportDialog = defineAsyncComponent(() => import('@/component/moderation/report-dialog.vue'))

	defineOptions({ name: "chat", components: { 'chat-message': ChatMessageComponent } })

	const props = defineProps<{
		id?: number
		newFarmer?: any
		newConversation?: any
		large?: boolean
	}>()

	const { t } = useI18n()
	const router = useRouter()
	const messages = useTemplateRef<HTMLElement>('messages')
	const instance = getCurrentInstance()

	const emojis = ['❤️', '👍', '👋', '😂', '👏', '😢', '😮', '😱']

	const isScrollBottom = ref(true)
	let userScroll = false
	const unread = ref(false)

	const menuMessage = ref<ChatMessage | null>(null)
	let scrollMessage = 0
	const menuActivator = ref<any>(null)
	const menuEmojiActivator = ref<any>(null)
	const menu = ref(false)
	const menuEmoji = ref(false)

	const muteDialog = ref(false)
	const muteFarmer = ref<Farmer | null>(null)

	const censorDialog = ref(false)
	const censorMessage = ref<ChatMessage | null>(null)
	const censoredMessages = ref<{[key: number]: boolean}>({})
	const censorMute = ref(false)

	const deleteDialog = ref(false)
	const deletedMessage = ref<ChatMessage | null>(null)
	const deletedMessages = ref<{[key: number]: boolean}>({})

	const issueDialog = ref(false)
	const issueMessage = ref<ChatMessage | null>(null)
	const issueTitle = ref('')
	const issueDescription = ref('')

	const showReport = ref(false)
	const reportFarmer = ref<Farmer | null>(null)
	const reportContent = ref('')
	const reasons = [
		Warning.RUDE_CHAT,
		Warning.FLOOD_CHAT,
		Warning.PROMO_CHAT,
		Warning.INCORRECT_FARMER_NAME,
		Warning.INCORRECT_AVATAR,
	]

	const loading = computed(() => !!props.id && (!store.state.chat[props.id] || !store.state.chat[props.id].loaded))
	const chat = computed(() => props.id ? store.state.chat[props.id] : null)
	const privateMessages = computed(() => chat.value && chat.value.type === ChatType.PM)
	const isModerator = computed(() => store.getters.moderator || (chat.value && chat.value.type === ChatType.TEAM && store.state.farmer!.team.member_level >= TeamMemberLevel.CAPTAIN))
	const censorMessagesList = computed(() => chat.value && muteFarmer.value ? chat.value.messages.filter((m: any) => m.censored === 0 && m.farmer.id === muteFarmer.value!.id) : [])
	const deleteMessagesList = computed(() => chat.value && muteFarmer.value ? chat.value.messages.filter((m: any) => m.farmer.id === muteFarmer.value!.id) : [])

	emitter.on('chat', newMessage)
	emitter.on('chat-history', chatHistory)
	emitter.on('resize', updateScroll as any)
	emitter.on('wsconnected', update)
	if (store.state.wsconnected) {
		update()
	}

	onMounted(() => {
		updateScroll()
	})

	onUpdated(() => {
		updateScroll()
	})

	onBeforeUnmount(() => {
		emitter.off('chat', newMessage)
		emitter.off('chat-history', chatHistory)
		emitter.off('resize', updateScroll as any)
		emitter.off('wsconnected', update)
	})

	function newMessage(e: any) {
		if (e[0] === props.id) {
			updateScroll()
			if (!isScrollBottom.value) { unread.value = true }
			read()
		}
	}

	function chatHistory(e: any) {
		if (e === props.id && scrollMessage) {
			nextTick(() => {
				const element = (instance?.proxy?.$el as HTMLElement)?.querySelector('.m-' + scrollMessage) as HTMLElement
				if (element && messages.value) {
					messages.value.scrollTop = element.offsetTop
				}
				scrollMessage = 0
			})
		}
	}

	function scroll() {
		const m = messages.value
		if (!m) { return }
		// Batch layout reads up-front: writing to reactive state below schedules a re-render that
		// could invalidate layout. Reading scrollTop a second time afterward would force reflow.
		const sTop = m.scrollTop
		const sHeight = m.scrollHeight
		const oHeight = m.offsetHeight

		const atBottom = oHeight > sHeight || Math.abs((sTop + oHeight) - sHeight) < 3
		isScrollBottom.value = atBottom
		if (atBottom) {
			userScroll = false
			unread.value = false
		} else {
			userScroll = true
		}
		if (sTop < 150 && chat.value && chat.value.messages.length && chat.value.messages[0]) {
			scrollMessage = chat.value.messages[0].id
			store.commit('load-chat-history', props.id)
		}
	}

	function updateScroll(force: boolean = false) {
		if (!userScroll || force) {
			if (messages.value) {
				scrollToBottom()
				unread.value = false
			}
		}
	}

	function scrollToBottom() {
		if (messages.value) {
			messages.value.scrollTop = messages.value.scrollHeight + 1000
			setTimeout(() => {
				if (messages.value) {
					messages.value.scrollTop = messages.value.scrollHeight + 1000
				}
			}, 100)
		}
	}

	watch(() => props.id, update)

	function update() {
		if (!props.id) { return }
		store.commit('register-chat', {id: props.id})
		store.commit('load-chat', chat.value)
		read()
	}

	function sendMessage(message: any) {
		LeekWars.track('chat-message')
		if (message.startsWith('/ping')) {
			store.commit('last-ping', Date.now())
		}
		if (message.match(/(^|\s)\/(br|arena)!?(\s|$)/)) {
			if (!LeekWars.arena.enabled) {
				const farmer = store.state.farmer
				if (farmer) {
					const arenaLeekId = parseInt(localStorage.getItem('arena-leek') || '', 10)
					const gardenLeekId = parseInt(localStorage.getItem('garden/leek') || '', 10)
					const lastLeekId = (arenaLeekId && farmer.leeks[arenaLeekId]) ? arenaLeekId : gardenLeekId
					const leek = (lastLeekId && farmer.leeks[lastLeekId]) ? farmer.leeks[lastLeekId] : Object.values(farmer.leeks)[0] as any
					if (leek) {
						LeekWars.arena.register(leek.id)
					}
				}
			}
		}
		if (chat.value === null) {
			LeekWars.post('message/create-conversation', {farmer_id: props.newFarmer.id, message}).then(data => {
				props.newConversation.id = data.conversation_id
				store.commit('new-conversation', props.newConversation)
				router.replace('/messages/conversation/' + data.conversation_id)
			})
		} else {
			LeekWars.post('message/send-message', {conversation_id: chat.value.id, message}).then(() => { /**/ }).catch(data => {
				LeekWars.toast(t('main.error_' + data.error, data.params) as string)
			})
		}
	}

	function read() {
		if (!chat.value) { return }
		nextTick(() => {
			if (!chat.value!.read) {
				LeekWars.post('message/read', { conversation_id: chat.value!.id })
			}
			store.commit('chat-set-read', { chat: chat.value!.id, read: true })
		})
	}

	function report(message: ChatMessage) {
		showReport.value = true
		reportFarmer.value = message.farmer
		reportContent.value = [message.id, ...message.subMessages.map(s => s.id)].join(',')
	}

	function censor(message: ChatMessage) {
		if (!message) return
		censorDialog.value = true
		censorMessage.value = message
		muteFarmer.value = message.farmer
		censoredMessages.value = {}
		if (message.censored === 0) {
			censoredMessages.value[message.id] = true
		}
		if (message.subMessages) {
			for (const sub of message.subMessages) {
				if (sub.censored === 0) {
					censoredMessages.value[sub.id] = true
				}
			}
		}
	}

	function deleteMessage(message: ChatMessage) {
		if (!message) return
		deleteDialog.value = true
		deletedMessage.value = message
		muteFarmer.value = message.farmer
		deletedMessages.value = {}
		deletedMessages.value[message.id] = true
		if (message.subMessages) {
			for (const sub of message.subMessages) {
				deletedMessages.value[sub.id] = true
			}
		}
	}

	function mute(farmer: Farmer) {
		muteDialog.value = true
		muteFarmer.value = farmer
	}

	function createIssue(message: ChatMessage) {
		issueDialog.value = true
		issueMessage.value = message
		issueTitle.value = (message.raw_content || '').replace(/\s+/g, ' ').trim().substring(0, 80)
		issueDescription.value = ''
	}

	function createIssueConfirm() {
		if (!issueMessage.value) return
		const id = issueMessage.value.id
		issueDialog.value = false
		LeekWars.post('message/create-issue', { message_id: id, title: issueTitle.value, description: issueDescription.value }).then(data => {
			LeekWars.toast('Issue #' + data.issue + ' créée')
		}).catch(data => {
			LeekWars.toast(t('main.error_' + data.error) as string)
		})
	}

	function censorConfirm() {
		censorDialog.value = false
		if (censorMessage.value) {
			const ids = Object.entries(censoredMessages.value).filter(e => e[1]).map(e => e[0]).join(',')
			LeekWars.post('message/censor', { messages: ids, mute: censorMute.value })
		}
	}

	function deleteConfirm() {
		deleteDialog.value = false
		if (deletedMessage.value) {
			const ids = Object.entries(deletedMessages.value).filter(e => e[1]).map(e => e[0]).join(',')
			LeekWars.delete('message/delete', { messages: ids, mute: censorMute.value })
		}
	}

	function muteConfirm() {
		if (!muteFarmer.value || !chat.value) { return }
		LeekWars.post('message/mute', { target_id: muteFarmer.value.id, chat: chat.value.id, duration: 3600 })
		muteFarmer.value.muted = true
		muteDialog.value = false
	}

	function openMenu(activator: any, message: ChatMessage) {
		menuMessage.value = message
		menuActivator.value = activator.target
		menuEmoji.value = false
		nextTick(() => {
			menu.value = true
		})
	}

	function openEmojis(activator: any, message: ChatMessage) {
		menuMessage.value = message
		menuEmojiActivator.value = activator.target
		menu.value = false
		nextTick(() => {
			menuEmoji.value = true
		})
	}

	function toggleReaction(emoji: string) {
		menuEmoji.value = false
		if (!menuMessage.value) return
		LeekWars.track('chat-reaction')
		if (menuMessage.value.my_reaction === emoji) {
			LeekWars.delete('message-reaction/delete', { message_id: menuMessage.value.id })
			menuMessage.value.my_reaction = null
		} else {
			LeekWars.post('message-reaction/add', { reaction: emoji, message_id: menuMessage.value.id })
			menuMessage.value.my_reaction = emoji
		}
	}

	function formatMessage(message: any) {
		if (message.subMessages) {
			for (const sub of message.subMessages) {
				formatMessage(sub)
			}
		}
		if (message.formatted) return message

		message.raw_content = message.content
		message.content = formatChatMessage(message.content, message.farmer.name, store.state.farmer_by_name)

		const element = document.createElement('div')
		element.innerHTML = message.content
		const innerText = element.innerText.trim()
		message.only_emojis = !element.querySelector('.br-invite') && (innerText.length === 0 || /^[\s\p{Emoji_Presentation}]+$/gmu.test(innerText))
		if (!('censored' in message)) {
			message.censored = 0
		}
		message.reactionDialog = false
		message.formatted = true
		return message
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
		color: var(--pure-white);
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
		color: var(--text-color-secondary);
		display: flex;
		align-items: center;
		margin: 12px 0;
		&:before, &:after {
			border-bottom: 1px dashed var(--text-color-secondary);
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
			:deep(a) {
				pointer-events: none;
			}
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
	.issue {
		.flex {
			gap: 8px;
			margin: 0 0 12px 0;
			align-items: flex-start;
		}
		.bubble {
			flex: 1;
			padding: 8px;
			word-break: break-word;
			white-space: pre-wrap;
		}
		label {
			display: block;
			margin-bottom: 4px;
			color: var(--text-color-secondary);
			font-size: 14px;
		}
		input[type="text"], textarea {
			width: 100%;
			box-sizing: border-box;
			padding: 6px 8px;
			margin-bottom: 12px;
			border: 1px solid var(--border);
			border-radius: 4px;
			background: var(--pure-white);
			font-family: inherit;
			font-size: 14px;
			resize: vertical;
		}
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
	.emojis:deep(.chat-input-emoji) {
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