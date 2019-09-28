<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div class="tab action content" icon="delete" @click="LeekWars.addChat('pm-' + currentID, ChatType.PM, getConversationName())">
					<i class="material-icons">picture_in_picture_alt</i>
				</div>
				<div class="tab action content" icon="delete" @click="quitDialog = true">
					<i class="material-icons">delete</i>
					<span>{{ $t('quit') }}</span>
				</div>
			</div>
		</div>
		<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column4">
			<panel v-autostopscroll="'bottom'" class="conversations last first">
				<div slot="content">
					<router-link v-if="newConversation && !newConversationSent" :to="'/messages/new/' + newFarmer.id + '/' + newFarmer.name + '/' + newFarmer.avatar_changed">
						<conversation :conversation="newConversation" />
					</router-link>
					<router-link v-for="conversation in $store.state.conversationsList" :key="conversation.id" :to="'/messages/conversation/' + conversation.id">
						<conversation :conversation="conversation" />
					</router-link>
				</div>
			</panel>
		</div>
		<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column8">
			<panel class="last">
				<div slot="content">
					<chat v-if="currentConversation && currentConversation.id !== 0" :channel="'pm-' + currentConversation.id" @send="sendMessage" />
					<chat v-else @send="sendMessage" />
				</div>
			</panel>
		</div>
		<popup v-model="quitDialog" :width="500">
			<span slot="title">{{ $t('quit_conversation') }}</span>
			{{ $t('quit_confirm') }}
			<div slot="actions">
				<div @click="quitDialog = false">{{ $t('cancel') }}</div>
				<div class="red" @click="quitConversation">{{ $t('quit') }}</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { Chat, ChatType } from '@/model/chat'
	import { Conversation } from '@/model/conversation'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'messages', i18n: {} })
	export default class Messages extends Vue {
		ChatType = ChatType
		newConversation_: Conversation | null = null
		newFarmer_: any = null
		newConversationSent: boolean = false
		currentID: number | null = null
		quitDialog: boolean = false
		actions = [{icon: 'delete', click: () => this.showQuitDialog()}]

		created() {
			if (!this.env.SOCIAL) {
				this.$router.push('/')
				return
			}
			LeekWars.setTitle(this.$t('messages.title'))
			this.update()
			this.$root.$on('back', () => {
				this.$router.push('/messages')
			})
			this.$root.$on('focus', () => {
				this.conversationRead()
			})
		}
		get currentConversation() {
			return (this.currentID === 0) ? this.newConversation : (this.currentID ? this.$store.state.conversations[this.currentID] : null)
		}
		isNewConversation(): boolean {
			return 'name' in this.$route.params
		}	
		get newConversation(): Conversation | null {
			if (!this.newConversation_ && 'name' in this.$route.params) {
				this.newConversation_ = {id: 0, last_message: this.$t('messages.new_message') as string, farmers: [this.newFarmer]} as Conversation
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
						LeekWars.setTitle(this.$i18n.t('messages.title'))
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
				LeekWars.setTitle(this.$i18n.t('messages.new_message'))
			} else if (this.currentID in this.$store.state.conversations) {
				LeekWars.setTitle(this.getConversationName())
			} else {
				LeekWars.setTitle(this.$i18n.t('messages.title'))
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
		sendMessage(message: string) {
			if (!this.currentConversation) { return }
			if (this.currentConversation.id === 0) {
				LeekWars.post('message/create-conversation', {farmer_id: this.newFarmer.id, message}).then(data => {
					if (this.newConversation_) {
						this.newConversation_.id = data.conversation_id
						this.$store.commit('new-conversation', this.newConversation_)
					}
					this.$router.replace('/messages/conversation/' + data.conversation_id)
					this.newConversationSent = true
				})
			} else {
				LeekWars.post('message/send-message', {conversation_id: this.currentConversation.id, message})
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
	}
</script>

<style lang="scss" scoped>
	.panel {
		margin-bottom: 0;
	}
	.conversations {
		overflow-y: auto;
		overflow-x: hidden;
		height: calc(100vh - 128px);
	}
	#app.app .conversations {
		height: calc(100vh - 56px);
	}
	.conversations .content {
		padding: 0;
	}
	.chat {
		height: calc(100vh - 128px);
	}
	#app.app .chat {
		height: calc(100vh - 56px);
	}
	.router-link-active .conversation {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
</style>