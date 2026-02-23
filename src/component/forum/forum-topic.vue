<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="title-wrapper">
				<h1>
					<router-link to="/forum">{{ $t('main.forum') }}</router-link>
					<v-icon>mdi-chevron-right</v-icon>
					<router-link v-if="topic" :to="'/forum/category-' + category.id">{{ categoryName }}</router-link>
					<v-icon>mdi-chevron-right</v-icon>
					<flag v-if="category && forumLanguages.length >= 2 && category.lang" :code="LeekWars.languages[category.lang].country" />
					<span ref="topicTitle" :contenteditable="topicEditing" class="topic-title">{{ topic ? topic.name : '...' }}</span>
					<div v-if="topic" class="info attrs">
						<v-icon v-if="topic.resolved" :title="$t('resolved')" class="attr">mdi-check-circle</v-icon>
						<v-icon v-if="topic.locked" :title="$t('locked')" class="attr">mdi-lock</v-icon>
						<v-icon v-if="topic.pinned" :title="$t('pinned')" class="attr">mdi-pin</v-icon>
						<a v-if="topic.issue" :href="'https://github.com/leek-wars/leek-wars/issues/' + topic.issue" class="attr issue" target="_blank" rel="noopener">
							<img src="/image/github_white.png"><span>#{{ topic.issue }}</span>
						</a>
						<a v-if="topic.private_issue && $store.state.farmer && $store.state.farmer.admin" :href="'https://github.com/5pilow/leek-wars/issues/' + topic.private_issue" class="attr issue private-issue" target="_blank" rel="noopener">
							<img src="/image/github_white.png"><span>#{{ topic.private_issue }}</span>
						</a>
					</div>
				</h1>
				<div v-if="!LeekWars.mobile" class="tabs">
					<div v-if="topic && topic.subscribed" class="tab" @click="unsubscribe">
						<v-icon>mdi-newspaper-minus</v-icon>
						{{ $t('unsubscribe') }}
					</div>
					<div v-else class="tab" @click="subscribe">
						<v-icon>mdi-newspaper-plus</v-icon>
						{{ $t('subscribe') }}
					</div>
				</div>
			</div>
		</div>

		<panel class="first last">
			<template #content>
				<div class="content">
				<breadcrumb v-if="LeekWars.mobile" :items="breadcrumb_items" />
				<pagination v-if="topic" :current="page" :total="pages" :url="'/forum/category-' + category.id + '/topic-' + topic.id" />
				<loader v-if="!topic || !topic.messages" />
				<div v-else>
					<div v-for="message in topic.messages" :id="'message-' + message.id" :key="message.id" class="message-wrapper">
						<div v-if="!message.writer.deleted" class="profile">
							<rich-tooltip-farmer :id="message.writer.id" v-slot="{ props }">
								<router-link :to="'/farmer/' + message.writer.id" class="" v-bind="props">
									<avatar :farmer="message.writer" />
								</router-link>
							</rich-tooltip-farmer>
							<div class="info">
								<div class="pseudo">
									{{ message.writer.name }}
									<img v-if="message.writer.connected" class="status" src="/image/connected.png">
									<img v-else class="status" src="/image/disconnected.png">
								</div>
								<div v-if="message.writer.color == 'admin'" class="grade admin">{{ $t('main.grade_admin') }}</div>
								<div v-else-if="message.writer.color == 'moderator'" class="grade moderator">{{ $t('main.grade_moderator') }}</div>
								<div v-else-if="message.writer.color == 'contributor'" class="grade contributor">{{ $t('main.grade_contributor') }}</div>
								<lw-title v-if="message.writer.title.length" :title="message.writer.title" />
								<i18n-t class="messages-count" keypath="main.n_messages" tag="div">
									<template #n>
										<b>{{ message.writer.messages }}</b>
									</template>
								</i18n-t>
								<i18n-t class="trophy-count" keypath="main.n_trophies" tag="div">
									<template #n>
										<b>{{ message.writer.points }}</b>
									</template>
								</i18n-t>
							</div>
						</div>
						<div v-else class="profile">
							<div class="info">
								<avatar />
								<div class="farmer deleted">{{ $t('main.farmer') }}@{{ message.writer.id }}</div>
							</div>
						</div>
						<div class="message card">

							<template v-if="!message.editing && !message.deleted">
								<a v-if="message.id != -1" :href="'#message-' + message.id" class="link">#</a>
								<router-link v-else to="" class="link">#</router-link>
							</template>

							<div v-if="message.deleted" class="text deleted">{{ $t('deleted_message') }}</div>
							<textarea v-else-if="message.editing" ref="textarea" v-model="message.message" :style="{height: message.height + 'px'}" class="original"></textarea>
							<div v-else-if="message.html" v-emojis v-code class="text" v-html="message.html"></div>
							<markdown v-else :content="message.message" mode="forum" />

							<emoji-picker v-if="message.editing" class="emoji-picker" @pick="addEmoji(message, $event, $refs.textarea[0])" />

							<div class="bottom">

								<div class="edit-wrapper">
									<div v-if="!message.deleted" class="votes">
										<v-tooltip :key="votes_up_names[message.id] ? message.id * 101 + votes_up_names[message.id].length : message.id * 101" :open-delay="0" :close-delay="0" :disabled="message.votes_up === 0" bottom @update:model-value="loadVotesUp(message)">
											<template #activator="{ props }">
												<div :class="{active: message.my_vote == 1, zero: message.votes_up === 0}" class="vote up" @click="voteUp(message)" v-bind="props">
													<v-icon>mdi-thumb-up</v-icon>
													<span class="counter">{{ message.votes_up }}</span>
												</div>
											</template>
											<loader v-if="!votes_up_names[message.id]" :size="30" />
											<div v-else>
												<div v-for="name in votes_up_names[message.id]" :key="name">{{ name }}</div>
											</div>
										</v-tooltip>
										<v-tooltip :key="votes_down_names[message.id] ? message.id * 100 + votes_down_names[message.id].length : message.id" :open-delay="0" :close-delay="0" :disabled="message.votes_down === 0" bottom @update:model-value="loadVotesDown(message)">
											<template #activator="{ props }">
												<div :class="{active: message.my_vote == -1, zero: !message.votes_down}" class="vote down" @click="voteDown(message)" v-bind="props">
													<v-icon>mdi-thumb-down</v-icon>
													<span class="counter">{{ message.votes_down }}</span>
												</div>
											</template>
											<loader v-if="!votes_down_names[message.id]" :size="30" />
											<div v-else>
												<div v-for="name in votes_down_names[message.id]" :key="name">{{ name }}</div>
											</div>
										</v-tooltip>
									</div>

									<template v-if="message.id == -1 && $store.state.connected && category.moderator">
										<span class="action lock" @click="lock"><v-icon>mdi-lock</v-icon> {{ topic.locked ? $t('unlock') : $t('lock') }}</span>
										&nbsp;&nbsp;
										<span class="action pin" @click="pin"><v-icon>mdi-pin</v-icon> {{ topic.pinned ? $t('unpin') : $t('pin') }}</span>
									</template>
									<template v-if="message.id == -1 && $store.state.connected && (($store.state.farmer && topic.owner === $store.state.farmer.id) || category.moderator)">
										&nbsp;&nbsp;
										<span class="action resolve" @click="resolve"><v-icon>mdi-check</v-icon> {{ topic.resolved ? $t('unsolved') : $t('solved') }}</span>
									</template>
								</div>
								<div class="spacer"></div>
								<div class="date">
									<div>
										<div>{{ LeekWars.formatDateTime(message.date) }}</div>
										<div v-if="message.edition_date != null">
											{{ $t('edited_the', [LeekWars.formatDateTime(message.edition_date)]) }}
										</div>
									</div>

									<v-menu v-if="$store.state.farmer && !message.deleted && !message.editing && ((message.writer.id === $store.state.farmer.id || category.moderator) || (category.team === -1 && message.writer.id !== $store.state.farmer.id && message.writer.color !== 'admin'))" offset-y>
										<template #activator="{ props }">
											<v-btn variant="text" size="small" icon="mdi-dots-vertical" color="grey" v-bind="props" />
										</template>
										<v-list dense class="message-actions">
											<v-list-item v-if="$store.state.farmer && (message.writer.id === $store.state.farmer.id || category.moderator)" v-ripple @click="edit(message)" prepend-icon="mdi-pencil">
												<span>{{ $t('edit') }}</span>
											</v-list-item>
											<v-list-item v-if="$store.state.farmer && (message.writer.id === $store.state.farmer.id || category.moderator)" v-ripple @click="deleteGeneric(message)" prepend-icon="mdi-delete">
												<span>{{ $t('delete') }}</span>
											</v-list-item>
											<v-list-item v-if="category.team === -1 && message.writer.id !== $store.state.farmer.id && message.writer.color !== 'admin'" v-ripple @click="report(message)" prepend-icon="mdi-flag">
												<span>{{ $t('warning.report') }}</span>
											</v-list-item>
										</v-list>
									</v-menu>
								</div>
							</div>

							<div v-if="message.editing" class="edit-buttons">
								<v-btn color="primary" class="confirm-edit send" @click="confirmEdit(message)"><v-icon>mdi-send-outline</v-icon> {{ $t('main.send') }}</v-btn>
								<v-btn class="cancel-edit" @click="endEdit(message)">{{ $t('main.cancel') }}</v-btn>
								<span v-if="message.id == -1">
									&nbsp;GitHub Issue <input v-model.number="topic.issue" type="number">
								</span>
							</div>

							<formatting-rules v-if="message.editing" />
						</div>
					</div>
				</div>

				<pagination v-if="topic" :current="page" :total="pages" :url="'/forum/category-' + category.id + '/topic-' + topic.id" />

				<div v-if="topic && !topic.locked && $store.state.farmer && $store.state.farmer.verified" class="editor">
					<h4>{{ $t('answer') }}</h4>
					<textarea v-model="newMessage" class="response card" @keyup="updateDraft"></textarea>
					<div class="center">
						<div v-if="page != pages" class="warning"><v-icon>mdi-alert</v-icon> {{ $t('not_last_page') }}</div>
						<v-btn color="primary" class="send" @click="send"><v-icon>mdi-send-outline</v-icon> {{ $t('send') }}</v-btn>
					</div>
					<formatting-rules />
					<br>
				</div>

				<div v-if="$store.state.farmer && !$store.state.farmer.verified" class="green-link editor"><router-link class="green-link" to="/settings">Vérifiez votre compte pour répondre sur le forum</router-link><br><br></div>

				<breadcrumb :items="breadcrumb_items" />
				</div>
			</template>
		</panel>

		<popup v-model="deleteMessageDialog" :width="600">
			<template #icon>
				<v-icon>mdi-delete</v-icon>
			</template>
			<template #title>
				<span>{{ $t('do_you_want_to_delete_message') }}</span>
			</template>
			{{ $t('undoable_action') }}
			<template #actions>
				<div v-ripple @click="deleteMessageDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="red" @click="deleteMessage">{{ $t('delete') }}</div>
			</template>
		</popup>

		<popup v-model="deleteTopicDialog" :width="600">
			<template #icon>
				<v-icon>mdi-delete</v-icon>
			</template>
			<template #title>
				<span>{{ $t('do_you_want_to_delete_topic') }}</span>
			</template>
			{{ $t('undoable_action') }}
			<template #actions>
				<div v-ripple @click="deleteTopicDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="red" @click="deleteTopic">{{ $t('delete') }}</div>
			</template>
		</popup>

		<report-dialog v-if="reportFarmer" v-model="reportDialog" :target="reportFarmer" :reasons="reasons" :parameter="reportContent" class="report-dialog" />
	</div>
</template>

<script lang="ts">
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { locale } from '@/locale'
	import { Farmer } from '@/model/farmer'
	import { ForumCategory, ForumMessage, ForumTopic } from '@/model/forum'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import EmojiPicker from '../chat/emoji-picker.vue'
	import Breadcrumb from './breadcrumb.vue'
	const FormattingRules = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/forum/forum-formatting-rules.${locale}.i18n`))
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import ReportDialog from '@/component/moderation/report-dialog.vue'
	import Pagination from '@/component/pagination.vue'
	import LWTitle from '@/component/title/title.vue'
import { defineAsyncComponent } from 'vue'
import { emitter } from '@/model/vue'

	@Options({ name: 'forum_topic', i18n: {}, mixins: [...mixins], components: { Breadcrumb, EmojiPicker, Markdown, FormattingRules, RichTooltipFarmer, ReportDialog, Pagination, 'lw-title': LWTitle } })
	export default class ForumTopicPage extends Vue {
		topic: ForumTopic | null = null
		category: ForumCategory | null = null
		page: number = 0
		pages: number = 0
		votes_up_names: {[key: number]: string[]} = {}
		votes_down_names: {[key: number]: string[]} = {}
		deleteTopicDialog: boolean = false
		deleteMessageDialog: boolean = false
		toDeleteMessage: ForumMessage | null = null
		newMessage: string = ''
		topicEditing: boolean = false
		action = {icon: 'mdi-newspaper-plus', click: () => this.toggleSubscribe()}
		sendingMessage: boolean = false
		forumLanguages: string[] = []
		reportDialog: boolean = false
		reportFarmer: Farmer | null = null
		reportContent: string = ''
		reasons = [
			Warning.RUDE_FORUM,
			Warning.FLOOD_FORUM,
			Warning.PROMO_FORUM,
			Warning.INCORRECT_FARMER_NAME,
			Warning.INCORRECT_AVATAR,
		]

		get categoryName() {
			return this.category ? this.category.team > 0 ? this.category.name : this.$t('forum-category.' + this.category.name) : ''
		}
		get breadcrumb_items() {
			return [
				{name: this.$t('main.forum'), link: '/forum'},
				{name: this.categoryName, link: '/forum/category-' + (this.category ? this.category.id : 0)},
				{name: this.topic ? this.topic.name : '...', link: '/forum-category-' + (this.category ? this.category.id : 0) + '/topic-' + (this.topic ? this.topic.id : 0)}
			]
		}

		mounted() {
			LeekWars.contenteditable_paste_protect(this.$refs.topicTitle as HTMLElement)
		}
		@Watch("$route.params", {immediate: true})
		update(force: boolean = false) {
			const topic = parseInt(this.$route.params.topic, 10)
			const page = 'page' in this.$route.params ? parseInt(this.$route.params.page, 10) : 1
			if (!force && this.topic && this.topic.id === topic && this.page === page) {
				emitter.emit('loaded')
				return
			}
			this.page = page

			if (this.topic) { this.topic.messages = null }
			this.forumLanguages = (localStorage.getItem('forum/languages') as string || this.$i18n.locale).split(',')
			LeekWars.get('forum/get-messages/' + topic + '/' + this.forumLanguages + '/' + this.page).then(data => {
				this.topic = data.topic
				if (!this.topic) { return }
				this.category = data.category
				if (this.topic) {
					this.topic.messages = data.messages
					if (this.topic.messages) {
						for (const message of this.topic.messages) {
							message.editing = false
							message.height = 100
						}
					}
				}
				this.pages = data.pages
				LeekWars.setTitle(this.topic.name, this.$t('n_messages', [data.total]))
				LeekWars.setActions([this.action])
				if (this.topic.subscribed) { this.action.icon = 'mdi-newspaper-minus' }
				emitter.emit('loaded')
				this.newMessage = localStorage.getItem('forum/draft-' + this.topic.id) as string
			})
		}
		resolve() {
			if (!this.topic) { return }
			const service = this.topic.resolved ? 'forum/unresolve-topic' : 'forum/resolve-topic'
			LeekWars.post(service, {topic_id: this.topic.id})
			this.topic.resolved = !this.topic.resolved
		}
		lock() {
			if (!this.topic) { return }
			const service = this.topic.locked ? 'forum/unlock-topic' : 'forum/lock-topic'
			LeekWars.post(service, {topic_id: this.topic.id})
			this.topic.locked = !this.topic.locked
		}
		pin() {
			if (!this.topic) { return }
			const service = this.topic.pinned ? 'forum/unpin-topic' : 'forum/pin-topic'
			LeekWars.post(service, {topic_id: this.topic.id})
			this.topic.pinned = !this.topic.pinned
		}
		vote(message: ForumMessage, vote: number) {
			if (!this.topic) { return }
			const method = ['vote-message-down', 'remove-message-vote', 'vote-message-up'][vote + 1]
			LeekWars.post('forum/' + method, {topic_id: this.topic.id, message_id: message.id})
		}
		voteUp(message: ForumMessage) {
			if (message.my_vote === 1) {
				this.vote(message, 0)
				message.votes_up--
				message.my_vote = 0
			} else {
				this.vote(message, 1)
				message.votes_up++
				if (message.my_vote === -1) {
					message.votes_down--
				}
				message.my_vote = 1
			}
			delete this.votes_up_names[message.id]
			delete this.votes_down_names[message.id]
		}
		voteDown(message: ForumMessage) {
			if (message.my_vote === -1) {
				this.vote(message, 0)
				message.votes_down--
				message.my_vote = 0
			} else {
				this.vote(message, -1)
				message.votes_down++
				if (message.my_vote === 1) {
					message.votes_up--
				}
				message.my_vote = -1
			}
			delete this.votes_up_names[message.id]
			delete this.votes_down_names[message.id]
		}
		loadVotesUp(message: ForumMessage) {
			if (!this.topic || this.votes_up_names[message.id] !== undefined) { return }
			this.votes_up_names[message.id] = null
			LeekWars.post('forum/get-message-up-votes-names', {topic_id: this.topic.id, message_id: message.id}).then(data => {
				this.votes_up_names[message.id] = data.farmers.map((f: any) => f[1])
			})
		}
		loadVotesDown(message: ForumMessage) {
			if (!this.topic || this.votes_down_names[message.id] !== undefined) { return }
			this.votes_down_names[message.id] = null
			LeekWars.post('forum/get-message-down-votes-names', {topic_id: this.topic.id, message_id: message.id}).then(data => {
				this.votes_down_names[message.id] = data.farmers.map((f: any) => f[1])
			})
		}
		deleteGeneric(message: ForumMessage) {
			if (message.id === -1) {
				this.deleteTopicDialog = true
			} else {
				this.toDeleteMessage = message
				this.deleteMessageDialog = true
			}
		}
		deleteMessage() {
			if (!this.toDeleteMessage) { return }
			LeekWars.delete("forum/delete-message", {message_id: this.toDeleteMessage.id}).then(data => {
				if (this.toDeleteMessage) {
					this.toDeleteMessage = null
					this.deleteMessageDialog = false
					this.update(true)
				}
			})
		}
		deleteTopic() {
			if (!this.topic) { return }
			LeekWars.delete("forum/delete-topic", {topic_id: this.topic.id}).then(data => {
				if (this.category) {
					this.deleteTopicDialog = false
					this.$router.push("/forum/category-" + this.category.id)
				}
			})
		}
		updateDraft() {
			localStorage.setItem('forum/draft-' + this.topic!.id, this.newMessage)
		}
		send() {
			if (!this.topic || this.sendingMessage) { return }
			this.sendingMessage = true
			LeekWars.post("forum/post-message", {topic_id: this.topic.id, message: this.newMessage}).then(data => {
				localStorage.removeItem('forum/draft-' + this.topic!.id)
				this.newMessage = ''
				this.update(true)
				this.sendingMessage = false
			})
		}
		toggleSubscribe() {
			if (!this.topic) { return }
			this.topic.subscribed ? this.unsubscribe() : this.subscribe()
		}
		subscribe() {
			if (!this.topic) { return }
			LeekWars.post('forum/subscribe-topic', {topic_id: this.topic.id})
			this.topic.subscribed = true
			this.action.icon = 'mdi-newspaper-minus'
			LeekWars.toast(this.$i18n.t('notifications_on') as string)
		}
		unsubscribe() {
			if (!this.topic) { return }
			LeekWars.post('forum/unsubscribe-topic', {topic_id: this.topic.id})
			this.topic.subscribed = false
			this.action.icon = 'mdi-newspaper-plus'
			LeekWars.toast(this.$i18n.t('notifications_off') as string)
		}
		edit(message: ForumMessage) {
			message.editing = true
			if (message.id === -1) {
				this.topicEditing = true
			}
			const textElement = document.querySelector('#message-' + message.id + ' .text') as HTMLElement
			if (textElement) {
				message.height = textElement.offsetHeight - 14
			}
		}
		endEdit(message: ForumMessage) {
			message.editing = false
			if (message.id === -1) {
				this.topicEditing = false
			}
		}
		confirmEdit(message: ForumMessage) {
			if (!this.topic) { return }
			const callback = (data: any) => {
				message.html = null
				message.editing = false
				message.edition_date = LeekWars.time
				if (message.id === -1) {
					this.topicEditing = false
				}
			}
			if (message.id !== -1) {
				LeekWars.post("forum/edit-message", {message_id: message.id, new_message: message.message}).then(callback)
			} else {
				const input = this.$refs.topicTitle as HTMLElement
				const title = input.innerText
				LeekWars.post("forum/edit-topic", {topic_id: this.topic.id, title, message: message.message, issue: this.topic.issue || 0}).then(callback)
			}
		}
		addEmoji(message: ForumMessage, emoji: string, textarea: any) {
			const index = textarea.selectionStart
			message.message = message.message.slice(0, index) + emoji + message.message.slice(index, message.message.length)
		}

		report(message: ForumMessage) {
			this.reportFarmer = message.writer
			this.reportContent = message.id === -1 ? 't' + this.topic!.id : 'm' + message.id
			this.reportDialog = true
		}
	}
</script>

<style lang="scss" scoped>
	.title-wrapper {
		flex: 1;
	}
	h1 {
		font-size: 22px;
		display: inline;
		line-height: 36px;
		min-height: 36px;
		white-space: normal;
		padding: 6px 15px;
		padding-right: 0px;
		.v-icon {
			vertical-align: text-bottom;
			font-size: 24px;
			margin: 0 4px;
		}
		.flag {
			height: 16px;
			vertical-align: bottom;
			margin-bottom: 11px;
			margin-right: 6px;
		}
	}
	.tabs {
		margin-left: 18px;
		float: right;
	}
	#app.app .panel .content {
		padding: 0;
	}
	.topic-title[contenteditable="true"] {
		border: 1px solid white;
		border-radius: 2px;
		padding: 4px 6px;
		background: rgb(53, 97, 14);
	}
	.message-wrapper {
		border-radius: 2px;
		width: 100%;
		margin-bottom: 15px;
		height: 100%;
		flex-wrap: nowrap;
		display: flex;
		gap: 15px;
	}
	#app.app .message-wrapper {
		flex-direction: column;
		margin: 10px;
		margin-bottom: 20px;
	}
	.profile {
		flex: 130px 0 0;
		vertical-align: top;
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 15px;
		align-self: flex-start;
		text-align: center;
		min-width: 0;
	}
	#app.app .profile {
		width: auto;
		flex-direction: row;
		align-items: center;
		text-align: left;
		align-self: stretch;
		flex: 0;
	}
	.profile .info {
		.title {
			margin-bottom: 2px;
			font-size: 13px;
			font-weight: normal;
			&:deep(.quote:first-child) {
				padding-left: 0;
			}
			&:deep(.quote:last-child) {
				padding-right: 0;
			}
		}
	}
	.profile .pseudo {
		font-size: 15px;
		margin-bottom: 1px;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}
	#app.app .profile .pseudo {
		padding: 0;
		max-width: none;
	}
	.farmer.deleted {
		font-style: italic;
		color: #aaa;
	}
	.profile .avatar {
		width: 130px;
		height: 130px;
	}
	#app.app .profile .avatar {
		width: 80px;
		height: 80px;
		margin-right: 10px;
	}
	.grade {
		border-radius: 5px;
		color: white;
		display: inline-block;
		padding: 2px 4px;
		margin-bottom: 5px;
		font-weight: normal;
		font-size: 13px;
	}
	.grade.admin {
		background: #ff3333;
	}
	.grade.moderator {
		background: #ffa900;
	}
	.grade.contributor {
		background: #009c1d;
	}
	.profile .messages-count, .profile .trophy-count {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.profile .messages-count b, .profile .trophy-count b {
		color: var(--text-color);
	}
	.profile .status {
		width: 15px;
		height: 15px;
		vertical-align: middle;
		margin-bottom: 2px;
	}
	.spacer {
		flex: 1;
	}
	.message {
		padding: 15px;
		vertical-align: top;
		text-align: left;
		// color: #252525;
		width: 100%;
		position: relative;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	#app.app .message {
		padding: 7px;
		width: calc(100% - 20px);
	}
	.message .deleted.text {
		font-style: italic;
		color: #aaa;
		margin-bottom: 0;
	}
	.message a {
		word-break: break-all;
	}
	.message .link {
		position: absolute;
		top: 5px;
		right: 7px;
		color: #ccc;
		font-size: 18px;
		display: none;
	}
	.message:hover .link {
		display: block;
	}
	.edit-wrapper > span:hover {
		color: black;
	}
	.message .text {
		word-break: break-word;
		flex: 1;
		line-height: 1.6;
	}
	.message .text :deep(a) {
		color: #5fad1b;
	}
	.message .md {
		padding: 0;
		word-break: break-word;
		font-size: 15px;
		flex: 1;
		:deep(p) {
			font-size: 15px;
		}
		:deep(> p:last-child) {
			margin-bottom: 0;
		}
	}
	.message .original {
		padding: 4px;
		min-width: 100%;
		max-width: 100%;
		min-height: 200px;
		margin-bottom: 15px;
	}
	.message .bottom {
		display: flex;
		align-items: center;
		margin-top: 10px;
	}
	.message .action {
		display: inline-flex;
		i {
			margin-right: 4px;
		}
	}
	.message .date {
		color: var(--text-color-secondary);
		font-size: 12px;
		text-align: right;
		display: flex;
		align-items: center;
		margin-left: -5px;
		.v-btn {
			margin-right: 0;
		}
	}
	.edit-wrapper {
		color: var(--text-color-secondary);
		font-size: 14px;
		cursor: pointer;
		span .v-icon {
			font-size: 17px;
			vertical-align: bottom;
		}
	}
	.editor {
		margin-left: 140px;
		margin-top: 20px;
	}
	#app.app .editor {
		margin-left: 10px;
		margin-right: 10px;
	}
	.response {
		width: 100%;
		height: 170px;
		min-height: 170px;
		max-width: 100%;
		margin-top: 5px;
		padding: 10px;
		font-size: 15px;
		border: none;
		margin-bottom: 10px;
	}
	.page-bar .attrs.info {
		display: inline-flex;
		height: 36px;
		align-items: center;
		margin-left: 5px;
	}
	.attrs img {
		margin: 0 6px;
		opacity: 0.9;
	}
	i.attr {
		font-size: 22px;
		margin: 0 6px;
	}
	.issue {
		background: #0366d6;
		color: white;
		border-radius: 5px;
		font-size: 15px;
		font-weight: 500;
		padding: 0 4px;
		display: inline-flex;
		align-items: center;
		height: 25px;
		line-height: auto;
		img {
			height: 20px;
			margin: 2px;
			margin-right: 5px;
		}
		&.private-issue {
			background: #6f42c1;
		}
	}
	.votes {
		display: inline-block;
	}
	.vote {
		display: inline-block;
		font-size: 16px;
		margin-right: 6px;
		padding: 2px 6px;
		border-radius: 6px;
	}
	.vote i {
		vertical-align: bottom;
		font-size: 20px;
		margin-right: 6px;
	}
	.vote.zero {
		opacity: 0.6;
	}
	.vote.zero:hover {
		opacity: 1;
	}
	.vote.active {
		font-weight: bold;
	}
	.vote.up, .vote.up.zero:hover {
		color: #5fad1b;
		.v-icon {
			color: #5fad1b;
		}
	}
	.vote.up.zero, .vote.down.zero {
		color: var(--text-color-secondary);
		.v-icon {
			color: var(--text-color-secondary);
		}
	}
	.vote.down, .vote.down.zero:hover {
		color: red;
		margin-right: 20px;
		.v-icon {
			color: red;
		}
	}
	.vote.up.active {
		color: white;
		background: #5fad1b;
		.v-icon {
			color: white;
		}
	}
	.vote.down.active {
		color: white;
		background: red;
		.v-icon {
			color: white;
		}
	}
	.tooltip.votes-tooltip .content img {
		margin: 3px 40px;
		display: block;
	}
	.edit-buttons {
		margin: 15px 0;
	}
	.message :deep(h1) {
		margin-left: 0;
		margin-bottom: 10px;
		font-size: 28px;
		margin-top: 10px;
		display: block;
		background: transparent;
		color: var(--text-color-secondary);
		padding: 0px;
		text-shadow: none;
	}
	.message :deep(h1:after) {
		display: none;
	}
	.message :deep(h1:before) {
		display: none;
	}
	.message :deep(h2) {
		margin-left: 0;
		margin-bottom: 10px;
		font-size: 23px;
		margin-top: 10px;
	}
	.message :deep(h3) {
		margin-left: 0;
		margin-bottom: 10px;
		font-size: 20px;
		margin-top: 10px;
		display: block;
		background: transparent;
		color: var(--text-color-secondary);
		padding: 0px;
		text-shadow: none;
	}
	.message :deep(h3:after) {
		display: none;
	}
	.message :deep(h3:before) {
		display: none;
	}
	.message :deep(h5) {
		font-size: 17px;
	}
	.message :deep(h6) {
		font-size: 16px;
	}
	.message :deep(.chat-input-emoji) {
		position: absolute;
		right: 10px;
		top: 10px;
		user-select: none;
	}
	.message-actions .v-icon {
		margin-right: 6px;
	}
	.v-btn.send .v-icon {
		margin-right: 6px;
	}
	.warning {
		color: #ff5f00;
		padding: 10px;
	}
</style>