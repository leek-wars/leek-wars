<template lang="html">
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>
					{{ $t('main.chat') }}
					<v-menu offset-y>
						<img slot="activator" :src="chatLanguage.flag" class="language-button">
						<v-list :dense="true">
							<v-list-tile v-for="(language, i) in LeekWars.languages" :key="i" @click="chatLanguage = language">
								<v-list-tile-title class="language">
									<img :src="language.flag" class="flag">
									<span class="name">{{ language.name }}</span>
								</v-list-tile-title>
							</v-list-tile>
						</v-list>
					</v-menu>
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
		<div class="panel">
			<chat :chat="$store.state.chat[chatLanguage.code]" :channel="chatLanguage.code" />
		</div>
	</div>
</template>

<script lang="ts">
	import { Language, LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'chat-page' })
	export default class ChatPage extends Vue {
		chatLanguage: Language | null = null
		created() {
			this.chatLanguage = LeekWars.languages[this.$i18n.locale]
			LeekWars.setTitle(this.$i18n.t('main.chat'))
		}
	}
</script>

<style lang="scss" scoped>
	.panel {
		margin-bottom: 0px;
	}
	.chat {
		height: calc(100vh - 128px);
	}
	#app.app .chat {
		height: calc(100vh - 56px);
	}
	h1 .language-button {
		height: 28px;
		max-height: 28px;
		max-width: none;
		padding: 5px;
		margin-right: -10px;
	}
	h1 .languages {
		padding: 0 5px;
	}
	.flag {
		height: 28px;
	}
	.language {
		display: flex;
		align-items: center;
	}
	.language .name {
		padding-left: 8px;
	}
</style>