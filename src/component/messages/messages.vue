<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div class="tab action content" icon="delete" @click="LeekWars.addChat('pm-' + currentID, ChatType.PM, getConversationName())">
					<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
				</div>
				<div class="tab action content" icon="delete" @click="quitDialog = true">
					<v-icon>mdi-delete</v-icon>
					<span>{{ $t('quit') }}</span>
				</div>
			</div>
		</div>
		<div class="container last">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column4">
				<panel v-autostopscroll="'bottom'" class="conversations first" @scroll.native="conversationsScroll">
					<div slot="content">
						<router-link v-if="newConversation && !newConversationSent" :to="'/messages/new/' + newFarmer.id + '/' + newFarmer.name + '/' + newFarmer.avatar_changed">
							<conversation :chat="newConversation" />
						</router-link>
						<router-link v-for="conversation in $store.state.conversationsList" :key="conversation.id" :to="'/messages/conversation/' + conversation.id">
							<conversation :chat="conversation" />
						</router-link>
					</div>
				</panel>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column8">
				<panel>
					<chat v-if="currentConversation && currentConversation.id !== 0" :id="currentConversation.id" slot="content" />
					<chat v-else slot="content" :new-farmer="newFarmer" :new-conversation="newConversation_" />
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
	import { ChatType } from '@/model/chat'
	import { Conversation } from '@/model/conversation'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { store } from '@/model/store'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'messages', i18n: {} })
	export default class Messages extends Vue {
		ChatType = ChatType
		newConversation_: Conversation | null = null
		newFarmer_: any = null
		newConversationSent: boolean = false
		currentID: number | null = null
		quitDialog: boolean = false
		actions = [{icon: 'mdi-delete', click: () => this.showQuitDialog()}]
		loadingConversations: boolean = false

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
			this.$root.$on('back', this.back)
			this.$root.$on('focus', this.conversationRead)
		}
		destroyed() {
			LeekWars.footer = true
			LeekWars.box = false
			this.$root.$off('back', this.back)
			this.$root.$off('focus', this.conversationRead)
		}
		back() {
			this.$router.push('/messages')
		}
		get currentConversation() {
			return (this.currentID === 0) ? this.newConversation : (this.currentID ? this.$store.state.conversations[this.currentID] : null)
		}
		isNewConversation(): boolean {
			return 'name' in this.$route.params
		}
		get newConversation(): Conversation | null {
			if (!this.newConversation_ && 'name' in this.$route.params) {
				this.newConversation_ = {id: 0, last_message: this.$t('new_message') as string, farmers: [this.newFarmer]} as Conversation
			}
			return this.newConversation_
		}
		get newFarmer(): any {
			if (!this.newFarmer_ && 'name' in this.$route.params) {
				this.newFarmer_ = {id: parseInt(this.$route.params.id, 10), name: this.$route.params.name, avatar_changed: this.$route.params.avatar_changed}
			}
			return this.newFarmer_
		}
		@Watch('$route.params')
		update() {
			const id = 'id' in this.$route.params ? parseInt(this.$route.params.id, 10) : null
			if (this.isNewConversation()) {
				let found = false
				for (const conversation of this.$store.state.conversationsList) {
					if (conversation.id === 0) { continue }
					for (const farmer of conversation.farmers) {
						if (farmer.id === this.newFarmer.id) {
							this.$router.replace('/messages/conversation/' + conversation.id)
							found = true
							break
						}
					}
				}
				if (!found) {
					this.selectConversation(0)
				}
			} else {
				if (id !== null) {
					this.selectConversation(id)
				} else {
					if (LeekWars.mobile) {
						LeekWars.splitShowList()
						LeekWars.setTitle(this.$i18n.t('title'))
					} else if (this.$store.state.conversationsList.length) {
						this.$router.replace('/messages/conversation/' + this.$store.state.conversationsList[0].id)
					}
				}
			}
		}
		selectConversation(id: number) {
			this.currentID = id
			LeekWars.splitShowContent()
			LeekWars.setActions(this.actions)
			if (id === 0) {
				LeekWars.setTitle(this.$i18n.t('new_message'))
			} else if (this.currentID in this.$store.state.conversations) {
				LeekWars.setTitle(this.getConversationName())
			} else {
				LeekWars.setTitle(this.$i18n.t('title'))
			}
		}
		getConversationName() {
			if (!this.currentID) { return }
			for (const farmer of this.$store.state.conversations[this.currentID].farmers) {
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
				this.$router.replace('/messages/conversation/' + this.$store.state.conversationsList[0].id)
			} else {
				this.$router.replace('/messages')
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
	.column4, .column8 {
		height: 100%;
		.panel {
			height: 100%;
			margin-bottom: 0;
		}
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
</style>