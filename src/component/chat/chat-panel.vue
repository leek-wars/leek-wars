<template lang="html">
	<panel class="chat-panel" :toggle="toggle" icon="mdi-chat-outline">
		<template slot="title">
			<router-link v-ripple :to="'/chat/' + chatID" class="title">
				{{ $store.state.chat[chatID] ? $store.state.chat[chatID].name : 'Chat' }} <span v-if="$store.state.farmer?.groupe">{{ $store.state.farmer.groupe.name }}</span>
				<span v-if="!$store.state.farmer?.groupe" class="farmer-count">
					<span class="count">({{ $store.state.connected_farmers }} <v-icon class="icon">mdi-account-multiple</v-icon>)</span>
				</span>
			</router-link>
		</template>
		<div slot="actions" class="actions">
			<v-menu v-if="!$store.state.farmer?.groupe" offset-y>
				<template v-slot:activator="{ on }">
					<div class="language-button" v-ripple v-on="on">
						<flag :code="LeekWars.languages[LeekWars.publicChats[chatID].language].country" />
						<div class="unread-circle" v-if="Object.values(LeekWars.publicChats).some(chat => $store.state.chat[chat.id] && !$store.state.chat[chat.id].read)"></div>
					</div>
				</template>
				<v-list :dense="true">
					<div v-for="(data, language) in LeekWars.languages" :key="language" class="language">
						<flag :code="LeekWars.languages[language].country" />
						<v-list-item v-for="(chat, i) in data.chats" :key="i" class="language" @click="setChatLanguage(chat)">
							<v-icon>{{ LeekWars.publicChats[chat].icon }}</v-icon>
							<span class="name">{{ LeekWars.publicChats[chat].name }}</span>
							<span class="unread-circle" v-if="$store.state.chat[chat] && !$store.state.chat[chat].read"></span>
						</v-list-item>
					</div>
				</v-list>
			</v-menu>
			<div v-if="!LeekWars.mobile && $store.state.chat[chatID]" class="button text" @click="LeekWars.addChat($store.state.chat[chatID])">
				<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
			</div>
		</div>
		<chat :id="chatID" slot="content" :style="{height: height + 'px'}" />
	</panel>
</template>

<script lang="ts">
const ChatElement = () => import(/* webpackChunkName: "chat" */ `@/component/chat/chat.vue`)
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Language, LeekWars } from '@/model/leekwars'
import { ChatType } from '@/model/chat'
import { store } from '@/model/store'

@Component({ components: { chat: ChatElement, components: { ChatElement } } })
export default class ChatPanel extends Vue {

	@Prop({ required: true }) toggle!: string
	@Prop({ required: true }) chat!: string
	@Prop({ required: true }) height!: number

	ChatType = ChatType
	chatID: number | null = null

	created() {
		this.chatID = parseInt(localStorage.getItem('chat-panel/' + this.chat) || '0') || LeekWars.languages[this.$i18n.locale].chat
	}

	setChatLanguage(chat: number) {
		this.chatID = chat
		localStorage.setItem('chat-panel/' + this.chat, '' + chat)
	}
}

</script>

<style lang="scss" scoped>
.flag {
	width: 28px;
	flex-shrink: 0;
}
.language-button {
	cursor: pointer;
	max-height: 36px;
	height: 100%;
	display: flex;
	align-items: center;
	user-select: none;
	padding: 0 8px;
	.wrapper {
		position: relative;
		img {
			height: 26px;
		}
	}
}
.unread-circle {
	background: #5fad1b;
	border-radius: 50%;
	width: 10px;
	height: 10px;
	margin-left: 8px;
}
.wrapper .unread-circle {
	position: absolute;
	top: 0;
	right: -5px;
}
.languages {
	padding: 0 5px;
}
.language {
	display: flex;
	align-items: center;
	padding-left: 10px;
}
.language .name {
	padding-left: 8px;
}
.farmer-count {
	.v-icon.icon {
		margin-right: 0;
		font-size: 19px;
		margin-bottom: 3px;
	}
	.count {
		font-size: 15px;
	}
}
.header .title {
	display: flex;
	align-items: center;
	gap: 5px;
	flex: 1;
	padding-right: 0;
}
.header .actions {
	display: flex;
}
</style>