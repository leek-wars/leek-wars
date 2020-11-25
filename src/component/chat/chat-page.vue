<template lang="html">
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>
					{{ $t('main.chat') }}
					<v-menu offset-y>
						<template v-slot:activator="{ on }">
							<img :src="chatLanguage.flag" class="language-button" v-on="on">
						</template>
						<v-list :dense="true">
							<v-list-item v-for="(language, i) in LeekWars.languages" :key="i" @click="chatLanguage = language">
								<v-list-item-title class="language">
									<img :src="language.flag" class="flag">
									<span class="name">{{ language.name }}</span>
								</v-list-item-title>
							</v-list-item>
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
		<panel class="first last">
			<chat slot="content" :chat="$store.state.chat[chatLanguage.code]" :channel="chatLanguage.code" />
		</panel>
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
	.chat {
		height: calc(100vh - 128px);
	}
	#app.app .chat {
		height: calc(100vh - 56px);
	}
	h1 .language-button {
		height: 36px;
		max-height: 36px;
		max-width: none;
		padding: 5px;
		margin-right: -10px;
		vertical-align: bottom;
		cursor: pointer;
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