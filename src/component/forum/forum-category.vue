<template>
	<div>
		<div class="page-header page-bar">
			<h1>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
			</h1>
			<div v-if="!LeekWars.mobile" class="tabs">
				<div class="tab" @click="createDialog = true">
					<v-icon>mdi-comment-edit</v-icon>
					<span>{{ $t('create_new_topic') }}</span>
				</div>
				<div class="tab disabled search-box">
					<img src="/image/search.png" @click="search">
					<input v-model="query" type="text" @keyup.enter="search">
				</div>
			</div>
		</div>

		<panel class="first last">
			<div slot="content" class="content">
				<breadcrumb v-if="LeekWars.mobile" :items="breadcrumb_items" />

				<pagination v-if="category" :current="page" :total="pages" :url="'/forum/category-' + category.id" />

				<div v-if="!LeekWars.mobile" class="topic header forum-header">
					<div class="seen"></div>
					<div>{{ $t('topic') }}</div>
					<div class="num-messages">{{ $t('messages') }}</div>
					<div class="last-message">{{ $t('last') }}</div>
				</div>

				<loader v-if="!category || !category.topics" />
				<div v-else class="topics">
					<div v-for="topic in category.topics" :key="topic.id" :class="{pinned: topic.pinned}" class="topic">
						<div class="seen">
							<img v-if="topic.seen" src="/image/forum_seen.png">
							<img v-else src="/image/forum_unseen.png">
						</div>
						<div>
							<span v-ripple class="title">
								<v-icon v-if="topic.resolved" :title="$t('topic_resolved')" class="attr resolved">mdi-check-circle</v-icon>
								<v-icon v-if="topic.closed" :title="$t('topic_locked')" class="attr">mdi-lock</v-icon>
								<v-icon v-if="topic.pinned" :title="$t('topic_pinned')" class="attr">mdi-pin</v-icon>
								<a v-if="topic.issue" :href="'https://github.com/leek-wars/leek-wars-client/issues/' + topic.issue" class="attr issue" target="_blank" rel="noopener">
									#{{ topic.issue }}
								</a>
								<router-link :to="'/forum/category-' + category.id + '/topic-' + topic.id">{{ topic.title }}</router-link>
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
									<router-link slot="farmer" :to="'/forum/category-' + category.id + '/topic-' + topic.id + '/page-' + topic.last_message_page + '#message-' + topic.last_message_id">
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
									<router-link slot="author" :to="'/forum/category-' + category.id + '/topic-' + topic.id + '/page-' + topic.last_message_page + '#message-' + topic.last_message_id">
										<rich-tooltip-farmer :id="topic.last_message_writer_id">
											{{ topic.last_message_writer }} ►
										</rich-tooltip-farmer>
									</router-link>
								</i18n>
							</div>
						</div>
					</div>
				</div>
				<pagination v-if="category" :current="page" :total="pages" :url="'/forum/category-' + category.id" />
				<breadcrumb :items="breadcrumb_items" />
			</div>
		</panel>

		<popup v-model="createDialog" :width="800">
			<v-icon slot="icon">mdi-comment-edit</v-icon>
			<span slot="title">{{ $t('create_topic') }}</span>
			<div class="create-popup">
				<h3>{{ $t('new_topic_title') }}</h3>
				<input v-model="createTitle" class="topic-name card" type="text">
				<h3>{{ $t('new_topic_message') }}</h3>
				<textarea v-model="createMessage" class="topic-message card"></textarea>
				<formatting-rules />
			</div>
			<div slot="actions">
				<div class="action" @click="createDialog = false">{{ $t('cancel') }}</div>
				<div class="action green" @click="create">{{ $t('create_topic') }}</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { ForumCategory } from '@/model/forum'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from './breadcrumb.vue'
	
	@Component({ name: 'forum_category', i18n: {}, components: { Breadcrumb } })
	export default class ForumCategoryPage extends Vue {
		category: ForumCategory | null = null
		page: number = 0
		pages: number = 0
		createDialog: boolean = false
		createTitle: string = ''
		createMessage: string = ''
		query: string = ''

		get breadcrumb_items() {
			return [
				{name: this.$t('forum.title'), link: '/forum'},
				{name: this.category ? this.category.name : '...', link: '/forum/category-' + (this.category ? this.category.id : 0)}
			]
		}

		@Watch("$route.params", {immediate: true})
		update() {
			const category = this.$route.params.category
			this.page = 'page' in this.$route.params ? parseInt(this.$route.params.page, 10) : 1
			LeekWars.setActions([
				{icon: 'edit', click: () => this.createDialog = true},
				{icon: 'search', click: () => this.$router.push('/search/-/-/' + category) }
			])
			if (this.category) { this.category.topics = null }
			LeekWars.get('forum/get-topics/' + category + '/' + this.page).then(data => {
				this.category = data.category
				if (this.category) {
					this.category.name = this.category.team > 0 ? this.category.name : this.$t('forum.category_' + this.category.name) as string
					this.category.topics = data.topics
					this.pages = data.pages

					LeekWars.setTitle(this.category.name, this.$t('forum_category.n_topic_n_messages', [data.total_topics, data.total_messages]))
					this.$root.$emit('loaded')
				}
			})
		}
		create() {
			if (!this.category) { return }
			LeekWars.post('forum/create-topic', {category_id: this.category.id,	title: this.createTitle, message: this.createMessage, issue: 0}).then(data => {
				this.createDialog = false
				if (this.category) {
					this.$router.push("/forum/category-" + this.category.id + "/topic-" + data.topic_id)
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		search() {
			if (!this.category) { return }
			const options = []
			if (this.query) { options.push('query=' + this.query.replace(' ', '+')) }
			options.push('category=' + this.category.id)
			this.$router.push('/search?' + options.join('&'))
		}
	}
</script>

<style lang="scss" scoped>
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
	.topic .issue {
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
	.topic .title {
		font-weight: 300;
		font-size: 19px;
		margin-bottom: 5px;
		color: #333;
		display: inline-block;
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