<template>
	<div>
		<div class="page-header page-bar">
			<h1>
				<router-link to="/forum">{{ $t('forum.title') }}</router-link> 
				> 
				<span>{{ category ? category.name : '...' }}</span>
			</h1>

			<div class="tabs">
				<div class="tab action" icon="edit" @click="createDialog = true">
					<i class="material-icons">add</i>
					<span>{{ $t('create_new_topic') }}</span>
				</div>
				<div id="search-box" class="tab action disabled" icon="search">
					<img src="/image/search.png" @click="search">
					<input v-model="query" type="text" @keyup.enter="search">
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="content">

				<pagination v-if="category" :current="page" :total="pages" :url="'/forum/category-' + category.id" />

				<table id="forum-header" class="topic header"><tr>
					<td class="seen"></td>
					<td>{{ $t('topic') }}</td>
					<td class="num-messages">{{ $t('messages') }}</td>
					<td class="last-message">{{ $t('last') }}</td>
				</tr></table>

				<loader v-if="!category || !category.topics" />
				<div v-else>

					<table v-ripple v-for="topic in category.topics" :key="topic.id" :class="{pinned: topic.pinned}" class="topic">
						<tr>
							<td class="seen">
								<img v-if="topic.seen" src="/image/forum_seen.png">
								<img v-else src="/image/forum_unseen.png">
							</td>
							<td>
								<span class="title">
									<i v-if="topic.resolved" :title="$t('topic_resolved')" class="attr material-icons resolved">check_circle</i>
									<i v-if="topic.closed" :title="$t('topic_locked')" class="attr material-icons">lock</i>
									<img v-if="topic.pinned" :title="$t('topic_pinned')" class="attr" src="/image/pin.png">
									<router-link :to="'/forum/category-' + category.id + '/topic-' + topic.id">{{ topic.title }}</router-link>
								</span>
								<div class="description">
									<i18n path="by_x_the_d">
										<router-link :to="'/farmer/' + topic.author.id" place="farmer">{{ topic.author.name }}</router-link>
										<span place="date">{{ topic.date | date }}</span>
									</i18n>
								</div>
							</td>
							<td class="num-messages">{{ topic.messages }}</td>
							<td class="last-message">
								<div>
									<span>{{ LeekWars.formatDuration(topic.last_message_date) }}</span><br> {{ $t('last_by') }}
									<router-link :to="'/forum/category-' + category.id + '/topic-' + topic.id + '/page-' + topic.last_message_page + '#message-' + topic.last_message_id">
										<div class="last-message-wrapper">{{ topic.last_message_writer }}</div>
										<span>►</span>
									</router-link>
								</div>
							</td>
						</tr>
					</table>
				</div>
				<br>
				<pagination v-if="category" :current="page" :total="pages" :url="'/forum/category-' + category.id" />
			</div>
		</div>

		<v-dialog v-model="createDialog" :max-width="800">
			<div class="title">
				{{ $t('create_topic') }}
			</div>
			<div class="content create-popup">
				<h3>{{ $t('new_topic_title') }}</h3>
				<input v-model="createTitle" class="topic-name card" type="text">
				<h3>{{ $t('new_topic_message') }}</h3>
				<textarea v-model="createMessage" class="topic-message card"></textarea>
				<formatting-rules />
			</div>
			<div class="actions">
				<div class="action" @click="createDialog = false">{{ $t('cancel') }}</div>
				<div class="action green" @click="create">{{ $t('create_topic') }}</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import { ForumCategory } from '@/model/forum'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	
	@Component({ name: 'forum_category', i18n: {} })
	export default class ForumCategoryPage extends Vue {
		category: ForumCategory | null = null
		page: number = 0
		pages: number = 0
		createDialog: boolean = false
		createTitle: string = ''
		createMessage: string = ''
		query: string = ''

		created() {
			this.update()
		}
		@Watch("$route.params")
		update() {
			const category = this.$route.params.category
			this.page = 'page' in this.$route.params ? parseInt(this.$route.params.page, 10) : 1
			
			if (this.category) { this.category.topics = null }
			LeekWars.get<any>('forum/get-topics/' + category + '/' + this.page + '/' + this.$store.state.token).then((data) => {
				this.category = data.data.category
				if (this.category) {
					this.category.name = this.category.team > 0 ? this.category.name : this.$t('forum.category_' + this.category.name) as string
					this.category.topics = data.data.topics
					this.pages = data.data.pages

					LeekWars.setTitle(this.category.name, this.$t('forum_category.n_topic_n_messages', data.data.total_topics, data.data.total_messages))
					this.$root.$emit('loaded')
				}
			})
		}
		create() {
			if (!this.category) { return }
			LeekWars.post('forum/create-topic', {category_id: this.category.id,	title: this.createTitle, message: this.createMessage}).then((data) => {
				this.createDialog = false
				if (data.data.success) {
					if (this.category) {
						this.$router.push("/forum/category-" + this.category.id + "/topic-" + data.data.topic_id)
					}
				} else {
					LeekWars.toast(data.data.error)
				}
			})
		}
		search() {
			if (!this.category) { return }
			const query = this.query.replace(' ', '+')
			this.$router.push('/search/' + query + '/-/' + this.category.id)
		}
	}
</script>

<style lang="scss" scoped>
	#forum {
		padding: 10px 20px;
	}
	#forum-header {
		font-size: 20px;
		font-weight: 300;
		background: none;
		margin: 0;
	}
	#app.app #forum_category-page .panel .content {
		padding: 0;
	}
	.topic {
		margin-bottom: 5px;
		width: 100%;
	}
	.topic:not(.header) {
		border: 1px solid #ddd;
	}
	.topic.pinned {
		background: white;
		// box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.topic .attr {
		height: 19px;
		margin-right: 6px;
		padding: 2px 0;
		vertical-align: bottom;
	}
	i.attr.resolved {
		color: #5FAD1B;
	}
	i.attr {
		color: #666;
		font-size: 19px;
	}
	.topic td {
		padding: 5px 10px;
	}
	.topic:hover {
		background-color: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.topic .seen {
		width: 40px;
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
	}
	.topic .description {
		color: #999;
		font-size: 14px;
	}
	.topic .num-messages {
		width: 100px;
		color: #777;
		text-align: center;
	}
	.topic .last-message {
		width: 160px;
		color: #777;
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
	.create-popup .topic-name {
		width: calc(100% - 20px);
		padding: 10px;
		font-size: 17px;
	}
	.create-popup .topic-message {
		min-width: calc(100% - 20px);
		max-width: calc(100% - 20px);
		min-height: 100%;
		height: 180px;
		max-height: 500px;
		margin-top: 5px;
		margin-bottom: 10px;
		padding: 10px;
		font-size: 15px;
		font-family: "Roboto", sans-serif;
	}
	#search-box img {
		cursor: pointer;
	}
</style>