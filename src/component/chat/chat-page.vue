<template lang="html">
	<div class="chat-page">
		<div class="page-header page-bar">
			<div>
				<h1>
					{{ $t('main.chat') }}
				</h1>
			</div>
			<div class="tabs">
				<router-link to="/forum">
					<div class="tab action" icon="forum" link="/forum">
						<img src="/image/icon/forum.png">
						<span>{{ $t('main.forum') }}</span>
					</div>
				</router-link>
			</div>
		</div>
		<div class="container">
			<div class="column3">
				<panel class="first">
					<div slot="content" class="chats">
						<div v-for="category in chats" :key="category.name" class="category">
							<div class="name">{{ $t('cat_' + category.name) }}</div>
							<div v-for="chat in category.chats" :key="chat.id" class="chat-preview" @click="currentChat = chat.id">
								<v-icon>{{ chat.icon }}</v-icon>
								{{ $t(chat.name) }}
							</div>
						</div>
						<div v-if="$store.state.farmer && $store.state.farmer.team" class="category">
							<div class="name">
								<v-icon>mdi-account-multiple</v-icon>
								{{ $t('cat_team') }}
							</div>
							<div class="chat-preview" @click="currentChat = $store.state.farmer.team.chat">
								<v-icon>mdi-chat-outline</v-icon>
								{{ $t('team') }}
							</div>
						</div>
						<div class="category">
							<div class="name">
								<v-icon>mdi-email-outline</v-icon>
								{{ $t('cat_private') }}
							</div>
						</div>
					</div>
				</panel>
			</div>
			<div class="column9">
				<panel>
					<chat slot="content" :id="currentChat" :large="true" />
				</panel>
			</div>
			<div class="column3">
				<panel class="first">
					<div slot="content" class="chats">
					</div>
				</panel>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Language, LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'chat-page' })
	export default class ChatPage extends Vue {

		chatLanguage: Language | null = null
		currentChat: number = 0
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
			this.chatLanguage = LeekWars.languages[this.$i18n.locale]
			this.currentChat = LeekWars.languages[this.$i18n.locale].chat
			LeekWars.setTitle(this.$i18n.t('main.chat'))
		}

		mounted() {
			LeekWars.footer = false
			LeekWars.large = true
			LeekWars.box = true
		}

		beforeDestroy() {
			LeekWars.footer = true
			LeekWars.large = false
			LeekWars.box = false
		}
	}
</script>

<style lang="scss" scoped>
	.chat-page {
		display: flex;
		flex-direction: column;
	}
	.container {
		flex: 1;
		min-height: 0;
		margin-bottom: 0;
	}
	.column3, .column9 {
		height: 100%;
	}
	.panel, .chat {
		height: 100%;
		min-height: 0;
		margin-bottom: 0;
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
		&:hover {
			background: white;
			color: black;
			cursor: pointer;
		}
	}
</style>