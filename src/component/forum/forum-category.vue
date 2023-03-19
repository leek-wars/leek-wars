<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
				</h1>
				<v-menu offset-y>
					<template v-slot:activator="{ on }">
						<div class="forum-language info" v-on="on">
							<flag v-for="l in activeLanguages" :key="l" :code="LeekWars.languages[l].country" />
							<img width="10" src="/image/selector.png">
						</div>
					</template>
					<v-list :dense="true">
						<v-list-item v-for="(language, i) in LeekWars.languages" :key="i" class="language" @click="setForumLanguage(language)" :disabled="forumLanguages[language.code] && activeLanguages.length === 1">
							<v-checkbox v-model="forumLanguages[language.code]" :disabled="forumLanguages[language.code] && activeLanguages.length === 1" hide-details @click.stop="updateCategories" />
							<flag :code="language.country" />
							<span class="name">{{ language.name }}</span>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>
			<div v-if="!LeekWars.mobile" class="tabs">
				<div v-if="$store.state.farmer && $store.state.farmer.verified" class="tab" @click="createDialog = true">
					<v-icon>mdi-comment-edit</v-icon>
					<span>{{ $t('create_new_topic') }}</span>
				</div>
				<div class="tab disabled search-box">
					<img src="/image/search.png" @click="search">
					<input v-model="query" type="text" @keyup.enter="search">
				</div>
			</div>
		</div>

		<panel class="first">
			<div slot="content" class="content">
				<breadcrumb v-if="LeekWars.mobile" :items="breadcrumb_items" />

				<pagination v-if="categories" :current="page" :total="pages" :url="'/forum/category-' + category_ids" />

				<div v-if="!LeekWars.mobile" class="topic header forum-header">
					<div class="seen"></div>
					<div>{{ $t('topic') }}</div>
					<div class="num-messages">{{ $t('messages') }}</div>
					<div class="last-message">{{ $t('last') }}</div>
				</div>

				<loader v-if="!categories || !topics" />
				<div v-else class="topics">
					<div v-for="topic in topics" :key="topic.id" :class="{pinned: topic.pinned}" class="topic">
						<div class="seen">
							<img v-if="topic.seen" src="/image/forum_seen.png">
							<img v-else src="/image/forum_unseen.png">
						</div>
						<div>
							<span v-ripple class="title">
								<v-icon v-if="topic.resolved" :title="$t('resolved')" class="attr resolved">mdi-check-circle</v-icon>
								<v-icon v-if="topic.closed" :title="$t('locked')" class="attr">mdi-lock</v-icon>
								<v-icon v-if="topic.pinned" :title="$t('pinned')" class="attr">mdi-pin</v-icon>
								<a v-if="topic.issue" :href="'https://github.com/leek-wars/leek-wars-client/issues/' + topic.issue" class="attr issue" target="_blank" rel="noopener">
									#{{ topic.issue }}
								</a>
								<router-link :to="'/forum/category-' + topic.category + '/topic-' + topic.id">{{ topic.title }}</router-link>
								<flag v-if="activeLanguages.length >= 2 && topic.lang" :code="LeekWars.languages[topic.lang].country" />
							</span>
							<div class="description grey">
								<i18n path="by_x_the_d">
									<router-link slot="farmer" :to="'/farmer/' + topic.author.id">
										<rich-tooltip-farmer :id="topic.author.id">
											{{ topic.author.name }}
										</rich-tooltip-farmer>
									</router-link>
									<span slot="date">{{ topic.date | date }}</span>
								</i18n>
							</div>
							<div v-if="LeekWars.mobile" class="description grey">
								<span class="messages"><v-icon>mdi-message-outline</v-icon> {{ topic.messages }} • </span>
								<i18n v-if="LeekWars.mobile" tag="span" path="last_message">
									<span slot="date">{{ LeekWars.formatDuration(topic.last_message_date) }}</span>
									<router-link slot="farmer" :to="'/forum/category-' + topic.category + '/topic-' + topic.id + '/page-' + topic.last_message_page + '#message-' + topic.last_message_id">
										{{ topic.last_message_writer }} ►
									</router-link>
								</i18n>
							</div>
						</div>
						<div v-if="!LeekWars.mobile" class="num-messages">{{ topic.messages }}</div>
						<div v-if="!LeekWars.mobile" class="last-message grey">
							<div>
								<span>{{ LeekWars.formatDuration(topic.last_message_date) }}</span>
								<i18n tag="div" path="last_by_x">
									<router-link slot="author" :to="'/forum/category-' + topic.category + '/topic-' + topic.id + '/page-' + topic.last_message_page + '#message-' + topic.last_message_id">
										<rich-tooltip-farmer :id="topic.last_message_writer_id">
											{{ topic.last_message_writer }} ►
										</rich-tooltip-farmer>
									</router-link>
								</i18n>
							</div>
						</div>
					</div>
				</div>
				<pagination v-if="categories" :current="page" :total="pages" :url="'/forum/category-' + category_ids" />
				<breadcrumb :items="breadcrumb_items" />
			</div>
		</panel>

		<div class="page-footer page-bar">
			<div class="tabs">
				<div class="tab" @click="markAsReadDialog = true">
					<v-icon>mdi-email-open</v-icon>
					<span class="report-button">{{ $t('mark_as_read') }}</span>
				</div>
				<div class="tab" @click="updateShowResolved">
					<span>{{ $t('show_resolved') }}</span>
					<v-switch v-model="showResolved" hide-details />
				</div>
			</div>
		</div>

		<popup v-model="createDialog" :width="800">
			<v-icon slot="icon">mdi-comment-edit</v-icon>
			<span slot="title">{{ $t('create_topic') }}</span>
			<div class="create-popup">
				<h3>{{ $t('new_topic_title') }}</h3>
				<input v-model="createTitle" @keyup="updateDraftTitle" class="topic-name card" type="text">
				<h3>{{ $t('new_topic_message') }}</h3>
				<textarea v-model="createMessage" @keyup="updateDraft" class="topic-message card"></textarea>
				<v-radio-group v-if="Object.values(forumLanguages).length > 1" v-model="createMessageLang">
					<v-radio v-for="(_, lang) in forumLanguages" :key="lang" :value="lang" :label="LeekWars.languages[lang].name" />
				</v-radio-group>
				<formatting-rules />
			</div>
			<div slot="actions">
				<div v-ripple class="action" @click="createDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="action green" @click="create">{{ $t('create_topic') }}</div>
			</div>
		</popup>

		<popup v-model="markAsReadDialog" :width="500">
			<v-icon slot="icon">mdi-email-open</v-icon>
			<span slot="title">{{ $t('mark_as_read') }}</span>
			{{ $t('mark_as_read_text') }}
			<div slot="actions">
				<div v-ripple class="action" @click="markAsReadDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="action green" @click="markAsRead">{{ $t('mark_as_read') }}</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { ForumCategory, ForumTopic } from '@/model/forum'
	import { mixins } from '@/model/i18n'
	import { Language, LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from './breadcrumb.vue'
	const FormattingRules = () => import(/* webpackChunkName: "[request]" */ `@/component/forum/forum-formatting-rules.${locale}.i18n`)
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import Pagination from '@/component/pagination.vue'

	@Component({ name: 'forum_category', i18n: {}, mixins: [...mixins], components: { Breadcrumb, FormattingRules, RichTooltipFarmer, Pagination } })
	export default class ForumCategoryPage extends Vue {
		categories: ForumCategory[] | null = null
		topics: ForumTopic[] | null = null
		page: number = 0
		pages: number = 0
		createDialog: boolean = false
		createTitle: string = ''
		createMessage: string = ''
		query: string = ''
		createMessageLang: string = 'fr'
		markAsReadDialog: boolean = false
		forumLanguages: {[key: string]: boolean} = {}
		translations: any[] = []
		showResolved: boolean = true

		get activeLanguages() {
			return Object.entries(this.forumLanguages).filter(e => e[1]).map(e => e[0])
		}
		get breadcrumb_items() {
			return [
				{name: this.$t('main.forum'), link: '/forum'},
				{name: this.categories ? this.categories[0].name : '...', link: '/forum/category-' + (this.categories ? this.category_ids : 0)}
			]
		}
		get category_ids() {
			return this.categories ? this.categories.map(c => c.id).join(',') : ''
		}

		@Watch("$route.params", {immediate: true})
		update() {
			const category = this.$route.params.category
			this.page = 'page' in this.$route.params ? parseInt(this.$route.params.page, 10) : 1
			this.showResolved = localStorage.getItem('forum/show-resolved') !== 'false'
			LeekWars.setActions([
				{icon: 'mdi-pencil', click: () => this.createDialog = true},
				{icon: 'mdi-magnify', click: () => this.$router.push('/search?category=' + category) }
			])
			if (this.topics) { this.topics = null }
			LeekWars.get('forum/get-topics/' + category + '/' + this.page + '/' + this.showResolved).then(data => {
				this.categories = data.categories
				if (this.categories) {
					this.categories[0].name = this.categories[0].team > 0 ? this.categories[0].name : this.$t('forum-category.' + this.categories[0].name) as string
					this.topics = data.topics
					this.pages = data.pages
					this.translations = data.translations

					LeekWars.setTitle(this.categories[0].name, this.$t('n_topic_n_messages', [data.total_topics, data.total_messages]))
					this.$root.$emit('loaded')
				}
			})
			const languages = (localStorage.getItem('forum/languages') as string || this.$i18n.locale).split(',')
			for (const l in LeekWars.languages) {
				Vue.set(this.forumLanguages, l, false)
			}
			for (const l of languages) {
				Vue.set(this.forumLanguages, l, true)
			}
			this.createMessage = localStorage.getItem('forum/draft') as string
			this.createTitle = localStorage.getItem('forum/draft-title') as string
			// this.forumLanguages = (localStorage.getItem('forum/languages') as string || this.$i18n.locale).split(',')
		}
		create() {
			if (!this.categories) { return }
			LeekWars.post('forum/create-topic', {category_id: this.categories[0].id, title: this.createTitle, message: this.createMessage, issue: 0, lang: this.createMessageLang}).then(data => {
				this.createDialog = false
				localStorage.setItem('forum/draft', '')
				localStorage.setItem('forum/draft-title', '')
				if (this.categories) {
					this.$router.push("/forum/category-" + this.category_ids + "/topic-" + data.topic_id)
				}
			}).error(error => {
				LeekWars.toast(this.$i18n.t('error_' + error.error, error.params))
			})
		}

		search() {
			if (!this.categories) { return }
			const options = []
			if (this.query) { options.push('query=' + this.query.replace(' ', '+')) }
			options.push('category=' + this.category_ids)
			this.$router.push('/search?' + options.join('&'))
		}

		markAsRead() {
			LeekWars.post('forum/mark-as-read').then(data => {
				this.markAsReadDialog = false
				this.update()
			}).error(error => {
				LeekWars.toast(this.$i18n.t('error_' + error.error, error.params))
			})
		}

		setForumLanguage(language: Language) {
			this.forumLanguages = {[language.code]: true}
			this.updateCategories()
		}

		updateCategories() {
			localStorage.setItem('forum/languages', this.activeLanguages.join(','))
			this.$router.replace('/forum/category-' + this.translations.filter(t => this.forumLanguages[t.lang]).map(t => t.id).join(','))
		}
		updateDraft() {
			localStorage.setItem('forum/draft', this.createMessage)
		}
		updateDraftTitle() {
			localStorage.setItem('forum/draft-title', this.createTitle)
		}
		updateShowResolved() {
			this.showResolved = !this.showResolved
			localStorage.setItem('forum/show-resolved', '' + this.showResolved)
			this.$router.push('/forum/category-' + this.category_ids)
			if (this.page === 1) { this.update() }
		}
	}
</script>

<style lang="scss" scoped>
	.forum-language {
		display: inline-flex;
		padding: 0 4px;
		cursor: pointer;
		align-items: center;
		height: 100%;
		gap: 6px;
	}
	.flag {
		max-width: 30px;
		max-height: 20px;
	}
	.language {
		display: flex;
		align-items: center;
	}
	.language .name {
		padding-left: 8px;
	}
	.forum-header {
		font-size: 20px;
		font-weight: 300;
		background: none;
		margin: 0;
	}
	#app.app .panel .content {
		padding: 0;
	}
	.topics {
		padding: 0 5px;
	}
	.topic {
		margin-bottom: 5px;
		display: flex;
		align-items: center;
	}
	.topic:not(.header) {
		border: 1px solid #ddd;
	}
	.topic.pinned {
		background: white;
	}
	.topic .attr {
		height: 19px;
		margin-right: 4px;
		padding: 2px 0;
		vertical-align: bottom;
		margin-bottom: 2px;
	}
	i.attr.resolved {
		color: #5fad1b;
	}
	i.attr {
		color: #666;
		font-size: 19px;
	}
	.topic > div {
		padding: 8px;
		flex: 1;
	}
	.topic:not(.header):hover {
		background-color: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.topic .seen {
		flex: 0 0 40px;
		padding-top: 10px;
		padding-bottom: 10px;
		padding-right: 5px;
	}
	.topic .seen img {
		height: 40px;
	}
	.topic .flag {
		height: 13px;
		margin-left: 6px;
		vertical-align: bottom;
		margin-bottom: 3px;
	}
	.topic .title {
		font-size: 18px;
		margin-bottom: 5px;
		color: #333;
		display: inline-block;
		a {
			color: #333;
		}
		.issue {
			background: #0366d6;
			color: white;
			border-radius: 5px;
			font-size: 15px;
			font-weight: 500;
			padding: 0 4px;
			display: inline-block;
			margin-bottom: 2px;
			height: auto;
		}
	}
	.topic .description {
		font-size: 14px;
		margin-top: 4px;
	}
	.topic .description i {
		font-size: 14px;
		vertical-align: bottom;
	}
	.topic .num-messages {
		flex: 0 0 100px;
		text-align: center;
	}
	.topic .last-message {
		flex: 0 0 176px;
		text-align: center;
		vertical-align: top;
	}
	.topic .last-message-wrapper {
		display: inline-block;
		white-space: nowrap;
		max-width: 110px;
		text-overflow: ellipsis;
		overflow-x: hidden;
		margin-bottom: -4px;
	}
	.topic .messages {
		color: black;
	}
	.create-popup .topic-name {
		width: 100%;
		padding: 10px;
		font-size: 17px;
	}
	.create-popup .topic-message {
		min-width: 100%;
		max-width: 100%;
		min-height: 100%;
		height: 180px;
		max-height: 500px;
		margin-top: 5px;
		margin-bottom: 10px;
		padding: 10px;
		font-size: 15px;
		font-family: "Roboto", sans-serif;
	}
	.search-box img {
		cursor: pointer;
	}
	.grey {
		color: #888;
	}
</style>