<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1>{{ $t('title') }}</h1>
				<v-menu offset-y>
					<template v-slot:activator="{ on }">
						<div class="forum-language info" v-on="on">
							<flag v-for="l in activeLanguages" :key="l" :code="LeekWars.languages[l].country" :clickable="false" />
							<img width="10" src="/image/selector.png">
						</div>
					</template>
					<v-list :dense="true">
						<v-list-item v-for="(language, i) in languages" :key="i" class="language" :disabled="forumLanguages[language.code] && activeLanguages.length === 1" @click="setForumLanguage(language)">
							<v-checkbox v-model="forumLanguages[language.code]" :disabled="forumLanguages[language.code] && activeLanguages.length === 1" hide-details @click.stop="pickForumLanguage(language)" />
							<flag :code="language.country" :clickable="false" />
							<!-- <img :src="language.flag" class="flag"> -->
							<span class="name">{{ language.name }}</span>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>
			<div class="tabs">
				<router-link to="/chat">
					<div class="tab action" icon="mdi-chat" link="/chat">
						<v-icon>mdi-chat-outline</v-icon>
						<span>{{ $t('main.chat') }}</span>
					</div>
				</router-link>
				<div class="tab action disabled" icon="search" link="/search">
					<img class="search-icon" src="image/search.png" @click="search">
					<input v-model="searchQuery" type="text" class="search-input" @keyup.enter="search">
				</div>
			</div>
		</div>

		<panel class="first">
			<loader v-if="!categories" />
			<template v-else>
				<div v-if="!LeekWars.mobile" class="header category">
					<div class="seen"></div>
					<div class="text">{{ $t('category') }}</div>
					<div class="num-topics">{{ $t('topics') }}</div>
					<div class="num-messages">{{ $t('messages') }}</div>
				</div>
				<router-link v-for="category in categories" :key="category.id" v-ripple :to="'/forum/category-' + category.id" class="category">
					<div class="seen">
						<img v-if="category.seen" src="/image/forum_seen.png">
						<img v-else src="/image/forum_unseen.png">
					</div>
					<div class="text">
						<template v-if="category.type == 'normal'">
							<div class="title">{{ $t('forum-category.' + category.name) }}</div>
							<div class="description">{{ $t('forum-category.' + category.name + '_desc') }}</div>
						</template>
						<div v-else-if="category.type == 'team'">
							<div class="title">{{ category.name }}</div>
							<div class="description">{{ $t('team_forum_description') }}</div>
						</div>
						<div v-if="LeekWars.mobile" class="mobile-info">
							<span>{{ $t('n_topics', [LeekWars.formatNumber(category.topics)]) }}</span>
							•
							<span>{{ $t('n_messages', [LeekWars.formatNumber(category.messages)]) }}</span>
						</div>
					</div>
					<div v-if="!LeekWars.mobile" class="num-topics">{{ category.topics | number }}</div>
					<div v-if="!LeekWars.mobile" class="num-messages">{{ category.messages | number }}</div>
				</router-link>
			</template>
		</panel>

		<chat-panel toggle="forum/chat" chat="forum" :height="400" />

		<panel icon="mdi-account-supervisor" class="last">
			<span slot="title">
				<span v-if="connected_farmers.length">{{ $t('connected_farmers', [$store.state.connected_farmers]) }}</span>
			</span>
			<div slot="actions">
				<div class="button flat" @click="expandFarmers = !expandFarmers">
					<v-icon v-if="expandFarmers">mdi-chevron-down</v-icon>
					<v-icon v-else>mdi-chevron-up</v-icon>
				</div>
			</div>
			<loader v-if="!connected_farmers.length" />
			<div v-else :class="{expanded: expandFarmers}" class="connected-farmers">
				<template v-for="(farmer, f) in connected_farmers">
					<template v-if="f > 0">, </template>
					<rich-tooltip-farmer :id="farmer.id" :key="farmer.id" v-slot="{ on }">
						<router-link :to="'/farmer/' + farmer.id">
							<span :class="farmer.class" v-on="on">{{ farmer.name }}</span>
						</router-link>
					</rich-tooltip-farmer>
				</template>
			</div>
			<div class="grades-legend">
				<div class="languages">
					<span v-for="(language, l) of connected_languages" :key="l"><flag :code="LeekWars.languages[l].country" /> {{ language }}</span>
				</div>
				<div class="grades">
					{{ $t('legend') }} : <span class="admin">{{ $t('main.grade_admin') }}</span>,
					<span class="moderator">{{ $t('main.grade_moderator') }}</span>,
					<span class="contributor">{{ $t('main.grade_contributor') }}</span>,
					<span>{{ $t('main.grade_member') }}</span>
				</div>
			</div>
		</panel>

	</div>
</template>

<script lang="ts">
	const ChatPanel = () => import(/* webpackChunkName: "chat" */ `@/component/chat/chat-panel.vue`)
	import { ChatType } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { Language, LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import { mixins } from '@/model/i18n'

	@Component({ name: 'forum', i18n: {}, mixins: [...mixins], components: { ChatPanel, RichTooltipFarmer } })
	export default class Forum extends Vue {

		categories: any = null
		connected_farmers: Farmer[] = []
		connected_languages: any
		forumLanguages: {[key: string]: boolean} = {}
		expandFarmers: boolean = false
		searchQuery: string = ''

		get languages() {
			return Object.values(LeekWars.languages).filter(l => l.forum)
		}

		created() {
			const languages = (localStorage.getItem('forum/languages') as string || this.$i18n.locale).split(',')
			for (const l in LeekWars.languages) {
				Vue.set(this.forumLanguages, l, false)
			}
			for (const l of languages) {
				Vue.set(this.forumLanguages, l, true)
			}
			LeekWars.get('forum/get-categories/' + this.activeLanguages).then(data => {
				this.categories = data.categories
				this.$root.$emit('loaded')
				this.connected_farmers = data.farmers
				this.connected_languages = data.languages
				LeekWars.setSubTitle(this.$t('connected_farmers_subtitle', [data.farmers.length]))
			})
			LeekWars.setTitle(this.$t('title'))
			LeekWars.setActions([
				{icon: 'mdi-chat-outline', click: () => this.$router.push('/chat')},
				{icon: 'mdi-magnify', click: () => this.$router.push('/search')}
			])
		}
		setForumLanguage(language: Language) {
			this.forumLanguages = {[language.code]: true}
			this.categories = null
			localStorage.setItem('forum/languages', language.code)
			LeekWars.get('forum/get-categories/' + language.code).then(data => {
				this.categories = data.categories
			})
		}
		pickForumLanguage(language: Language) {
			localStorage.setItem('forum/languages', this.activeLanguages.join(','))
			LeekWars.get('forum/get-categories/' + this.activeLanguages).then(data => {
				this.categories = data.categories
			})
		}
		search() {
			const query = this.searchQuery.replace(/ /g, '+')
			if (query) {
				this.$router.push('/search?query=' + query)
			} else {
				this.$router.push('/search')
			}
		}
		get activeLanguages() {
			return Object.entries(this.forumLanguages).filter(e => e[1]).map(e => e[0])
		}
	}
</script>

<style lang="scss" scoped>
	.forum-language {
		display: inline-flex;
		padding: 0 4px;
		border-radius: 2px;
		cursor: pointer;
		align-items: center;
		height: 100%;
		gap: 6px;
		img.flag {
			vertical-align: top;
			width: 32px;
		}
	}
	.search-icon {
		cursor: pointer;
	}
	.panel.first ::v-deep .content {
		padding: 5px;
	}
	.header.category {
		font-size: 17px;
		font-weight: 300;
		background-color: transparent;
		margin: 0;
	}
	.category {
		margin-bottom: 5px;
		display: flex;
		align-items: center;
	}
	.category:last-child {
		margin-bottom: 0;
	}
	.category > div {
		padding: 10px;
	}
	#app.app .category > div {
		padding: 4px 6px;
	}
	.category:not(.header) {
		border: 1px solid #ddd;
	}
	.category:not(.header):hover {
		background-color: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.category .seen {
		width: 55px;
		padding-top: 10px;
		padding-bottom: 8px;
		padding-right: 5px;
	}
	.category .seen img {
		height: 40px;
	}
	.category .text {
		flex: 1;
	}
	.category .title {
		font-size: 18px;
		margin-bottom: 4px;
		color: #333;
	}
	.category .description {
		color: #777;
		font-size: 14px;
	}
	.category .mobile-info {
		margin-top: 5px;
		color: #777;
		font-size: 14px;
	}
	.category .num-topics {
		flex: 0 0 80px;
		color: #777;
		text-align: center;
	}
	.category .num-messages {
		flex: 0 0 80px;
		color: #777;
		text-align: center;
	}
	.connected-farmers {
		height: 92px;
		overflow: hidden;
		text-align: justify;
	}
	.connected-farmers.expanded {
		height: auto;
	}
	.languages {
		display: flex;
		align-items: center;
		gap: 12px;
		span {
			display: inline-flex;
			gap: 5px;
			align-items: center;
		}
		.flag {
			height: 16px;
			width: auto;
		}
	}
	.grades {
		font-size: 12px;
	}
	.grades-legend {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 10px;
		gap: 10px;
	}
	#app.app .grades-legend {
		flex-direction: column;
	}
	.flag {
		width: 28px;
	}
	.language {
		display: flex;
		align-items: center;
	}
	.language .name {
		padding-left: 8px;
	}
</style>

