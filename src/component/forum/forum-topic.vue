<template>
	<div>
		<div class="page-header page-bar">
			<div class="title-wrapper">
				<h1>
					<router-link to="/forum">{{ $t('forum.title') }}</router-link>
					<v-icon>mdi-chevron-right</v-icon>
					<router-link v-if="topic" :to="'/forum/category-' + category.id">{{ categoryName }}</router-link>
					<v-icon>mdi-chevron-right</v-icon>
					<span ref="topicTitle" :contenteditable="topicEditing" class="topic-title">{{ topic ? topic.name : '...' }}</span>
					<div v-if="topic" class="info attrs">
						<v-icon v-if="topic.resolved" :title="$t('topic_resolved')" class="attr">mdi-check-circle</v-icon>
						<v-icon v-if="topic.locked" :title="$t('topic_locked')" class="attr">mdi-lock</v-icon>
						<v-icon v-if="topic.pinned" :title="$t('topic_pinned')" class="attr">mdi-pin</v-icon>
						<a v-if="topic.issue" :href="'https://github.com/leek-wars/leek-wars-client/issues/' + topic.issue" class="attr issue" target="_blank" rel="noopener">
							<img src="/image/github_white.png"><span>#{{ topic.issue }}</span>
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
			<div slot="content" class="content">
				<breadcrumb v-if="LeekWars.mobile" :items="breadcrumb_items" />
				<pagination v-if="topic" :current="page" :total="pages" :url="'/forum/category-' + category.id + '/topic-' + topic.id" />
				<loader v-if="!topic || !topic.messages" />
				<div v-else>
					<div v-for="message in topic.messages" :id="'message-' + message.id" :key="message.id" class="message-wrapper">
						<rich-tooltip-farmer :id="message.writer.id" v-slot="{ on }">
							<div class="profile" v-on="on">
								<router-link :to="'/farmer/' + message.writer.id" class="">
									<avatar :farmer="message.writer" />
								</router-link>
								<div class="info">
									<div class="pseudo">
										{{ message.writer.name }}
										<img v-if="message.writer.connected" class="status" src="/image/connected.png">
										<img v-else class="status" src="/image/disconnected.png">
									</div>
									<div v-if="message.writer.color == 'admin'" class="grade admin">{{ $t('admin') }}</div>
									<div v-else-if="message.writer.color == 'moderator'" class="grade moderator">{{ $t('moderator') }}</div>
									<div v-else-if="message.writer.color == 'contributor'" class="grade contributor">{{ $t('contributor') }}</div>
									<lw-title v-if="message.writer.title.length" :title="message.writer.title" />
									<div class="messages-count"><b>{{ message.writer.messages }}</b> messages</div>
									<div class="trophy-count"><b>{{ message.writer.trophies }}</b> trophées</div>
								</div>
							</div>
						</rich-tooltip-farmer>
						<div class="message card">
							<div class="wrapper">
								<template v-if="!message.editing">
									<a v-if="message.id != -1" :href="'#message-' + message.id" class="link">#</a>
									<router-link v-else to="" class="link">#</router-link>
								</template>

								<textarea v-if="message.editing" ref="textarea" v-model="message.message" :style="{height: message.height + 'px'}" class="original"></textarea>
								<div v-else v-emojis v-code class="text" v-html="message.html"></div>
								<emoji-picker v-if="message.editing" class="emoji-picker" @pick="addEmoji(message, $event, $refs.textarea[0])" />

								<div class="date">
									{{ LeekWars.formatDateTime(message.date) }}
									<br>
									<span v-if="message.edition_date != null">
										{{ $t('forum.edited_the', [LeekWars.formatDateTime(message.edition_date)]) }}
									</span>
								</div>

								<div v-if="!message.editing" class="edit-wrapper">
									<div class="votes">
										<v-tooltip :key="votes_up_names[message.id] ? message.id * 101 + votes_up_names[message.id].length : message.id * 101" :open-delay="0" :close-delay="0" :disabled="message.votes_up === 0" bottom @input="loadVotesUp(message)">
											<template v-slot:activator="{ on }">
												<div :class="{active: message.my_vote == 1, zero: message.votes_up === 0}" class="vote up" @click="voteUp(message)" v-on="on">
													<v-icon>mdi-thumb-up</v-icon>
													<span class="counter">{{ message.votes_up }}</span>
												</div>
											</template>
											<loader v-if="!votes_up_names[message.id]" :size="30" />
											<div v-else>
												<div v-for="name in votes_up_names[message.id]" :key="name">{{ name }}</div>
											</div>
										</v-tooltip>
										<v-tooltip :key="votes_down_names[message.id] ? message.id * 100 + votes_down_names[message.id].length : message.id" :open-delay="0" :close-delay="0" :disabled="message.votes_down === 0" bottom @input="loadVotesDown(message)">
											<template v-slot:activator="{ on }">
												<div :class="{active: message.my_vote == -1, zero: !message.votes_down}" class="vote down" @click="voteDown(message)" v-on="on">
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

									<template v-if="$store.state.farmer && (message.writer.id == $store.state.farmer.id || category.moderator)">
										<span class="edit" @click="edit(message)">{{ $t('forum.edit') }}</span>
										&nbsp;&nbsp;
										<template v-if="$store.getters.moderator">-&nbsp;&nbsp;
											<span class="delete" @click="deleteGeneric(message)">{{ $t('delete') }}</span>
										</template>
									</template>
									<template v-if="message.id == -1 && $store.state.connected && category.moderator">
										&nbsp;&nbsp;-&nbsp;&nbsp;
										<span class="lock" @click="lock">{{ topic.locked ? $t('forum.unlock') : $t('forum.lock') }}</span>
										&nbsp;&nbsp;-&nbsp;&nbsp;
										<span class="pin" @click="pin">{{ topic.pinned ? $t('forum.unpin') : $t('forum.pin') }}</span>
										&nbsp;&nbsp;-&nbsp;&nbsp;
										<span class="resolve" @click="resolve">{{ topic.resolved ? $t('forum.unsolved') : $t('forum.solved') }}</span>
									</template>
								</div>
								<div v-else class="edit-buttons">
									<v-btn color="primary" class="confirm-edit" @click="confirmEdit(message)">{{ $t('send') }}</v-btn>
									<v-btn class="cancel-edit" @click="endEdit(message)">{{ $t('cancel') }}</v-btn>
									<span v-if="message.id == -1">
										&nbsp;GitHub Issue <input v-model.number="topic.issue" type="number">
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<pagination v-if="topic" :current="page" :total="pages" :url="'/forum/category-' + category.id + '/topic-' + topic.id" />

				<div v-if="topic && !topic.locked" class="editor">
					<h4>{{ $t('answer') }}</h4>
					<textarea v-model="newMessage" class="response card" @keyup="updateDraft"></textarea>
					<center>
						<v-btn color="primary" @click="send">{{ $t('send') }}</v-btn>
					</center>
					<formatting-rules />
					<br>
				</div>

				<breadcrumb :items="breadcrumb_items" />
			</div>
		</panel>

		<popup v-model="deleteMessageDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('do_you_want_to_delete_message') }}</span>
			{{ $t('undoable_action') }}
			<div slot="actions">
				<div @click="deleteMessageDialog = false">{{ $t('cancel') }}</div>
				<div class="red" @click="deleteMessage">{{ $t('delete') }}</div>
			</div>
		</popup>

		<popup v-model="deleteTopicDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('do_you_want_to_delete_topic') }}</span>
			{{ $t('undoable_action') }}
			<div slot="actions">
				<div @click="deleteTopicDialog = false">{{ $t('cancel') }}</div>
				<div class="red" @click="deleteTopic">{{ $t('delete') }}</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { ForumCategory, ForumMessage, ForumTopic } from '@/model/forum'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import EmojiPicker from '../chat/emoji-picker.vue'
	import Breadcrumb from './breadcrumb.vue'

	@Component({ name: 'forum_topic', i18n: {}, components: { Breadcrumb, EmojiPicker } })
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

		get categoryName() {
			return this.category ? this.category.team > 0 ? this.category.name : this.$t('forum.category_' + this.category.name) : ''
		}
		get breadcrumb_items() {
			return [
				{name: this.$t('forum.title'), link: '/forum'},
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
				this.$root.$emit('loaded')
				return
			}
			this.page = page

			if (this.topic) { this.topic.messages = null }
			LeekWars.get('forum/get-messages/' + topic + '/' + this.page).then(data => {
				this.topic = data.topic
				if (!this.topic) { return }
				this.category = data.category
				if (this.topic) {
					Vue.set(this.topic, 'messages', data.messages)
					if (this.topic.messages) {
						for (const message of this.topic.messages) {
							Vue.set(message, 'editing', false)
							Vue.set(message, 'height', 100)
						}
					}
				}
				this.pages = data.pages
				LeekWars.setTitle(this.topic.name, this.$t('forum_topic.n_messages', [data.total]))
				LeekWars.setActions([this.action])
				if (this.topic.subscribed) { this.action.icon = 'mdi-newspaper-minus' }
				this.$root.$emit('loaded')
				this.newMessage = localStorage.getItem('forum/draft') as string
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
			delete this.$data.votes_up_names[message.id]
			delete this.$data.votes_down_names[message.id]
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
			delete this.$data.votes_up_names[message.id]
			delete this.$data.votes_down_names[message.id]
		}
		loadVotesUp(message: ForumMessage) {
			if (!this.topic || this.votes_up_names[message.id] !== undefined) { return }
			Vue.set(this.$data.votes_up_names, message.id, null)
			LeekWars.post('forum/get-message-up-votes-names', {topic_id: this.topic.id, message_id: message.id}).then(data => {
				Vue.set(this.$data.votes_up_names, message.id, data.farmers.map((f: any) => f[1]))
			})
		}
		loadVotesDown(message: ForumMessage) {
			if (!this.topic || this.votes_down_names[message.id] !== undefined) { return }
			Vue.set(this.$data.votes_down_names, message.id, null)
			LeekWars.post('forum/get-message-down-votes-names', {topic_id: this.topic.id, message_id: message.id}).then(data => {
				Vue.set(this.$data.votes_down_names, message.id, data.farmers.map((f: any) => f[1]))
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
			localStorage.setItem('forum/draft', this.newMessage)
		}
		send() {
			if (!this.topic || this.sendingMessage) { return }
			this.sendingMessage = true
			LeekWars.post("forum/post-message", {topic_id: this.topic.id, message: this.newMessage}).then(data => {
				localStorage.setItem('forum/draft', '')
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
			LeekWars.toast(this.$t('notifications_on'))
		}
		unsubscribe() {
			if (!this.topic) { return }
			LeekWars.post('forum/unsubscribe-topic', {topic_id: this.topic.id})
			this.topic.subscribed = false
			this.action.icon = 'mdi-newspaper-plus'
			LeekWars.toast(this.$t('notifications_off'))
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
				message.html = data.html
				message.editing = false
				message.edition_date = LeekWars.time
				if (message.id === -1) {
					this.topicEditing = false
				}
			}
			if (message.id !== -1) {
				LeekWars.post("forum/edit-message", {message_id: message.id, message: message.message}).then(callback)
			} else {
				const input = this.$refs.topicTitle as HTMLElement
				const title = input.innerText
				LeekWars.post("forum/edit-topic", {topic_id: this.topic.id, title, message: message.message, issue: this.topic.issue}).then(callback)
			}
		}
		addEmoji(message: ForumMessage, emoji: string, textarea: any) {
			const index = textarea.selectionStart
			message.message = message.message.slice(0, index) + emoji + message.message.slice(index, message.message.length)
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
	}
	#app.app .message-wrapper {
		flex-direction: column;
		margin-bottom: 5px;
	}
	.profile {
		width: 130px;
		vertical-align: top;
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 15px;
		align-self: flex-start;
		text-align: center;
		margin-right: 8px;
		padding-bottom: 8px;
		height: 100%;
	}
	#app.app .profile {
		width: auto;
		flex-direction: row;
		align-items: center;
		margin-left: 10px;
		text-align: left;
		padding-top: 10px;
	}
	.profile .info {
		margin-left: 10px;
		.title {
			margin-bottom: 4px;
			font-size: 13px;
			font-weight: normal;
		}
	}
	.profile .pseudo {
		font-size: 15px;
		margin-bottom: 2px;
		white-space: nowrap;
		max-width: 120px;
		padding: 0 5px;
		text-overflow: ellipsis;
		overflow: hidden;
	}
	#app.app .profile .pseudo {
		padding: 0;
		max-width: none;
	}
	.profile .avatar {
		width: 130px;
		height: 130px;
	}
	#app.app .profile .avatar {
		width: 80px;
		height: 80px;
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
		color: #999;
	}
	.profile .messages-count b, .profile .trophy-count b {
		color: #555;
	}
	.profile .status {
		width: 15px;
		height: 15px;
		vertical-align: middle;
		margin-bottom: 2px;
	}
	.message {
		padding: 10px;
		vertical-align: top;
		text-align: left;
		color: #444;
		width: calc(100% - 160px);
		position: relative;
		display: flex;
		margin-left: 10px;
	}
	#app.app .message {
		width: calc(100% - 30px);
		padding: 5px;
	}
	.message .deleted {
		font-style: italic;
		color: #aaa;
	}
	.message a {
		word-break: break-all;
	}
	.message .wrapper {
		height: 100%;
		width: 100%;
	}
	.message .wrapper .link {
		position: absolute;
		top: 5px;
		right: 7px;
		color: #ccc;
		font-size: 18px;
		display: none;
	}
	.message:hover .wrapper .link {
		display: block;
	}
	.edit-wrapper > span:hover {
		color: #777;
	}
	.message .text {
		padding: 5px;
		padding-right: 10px;
		margin-bottom: 40px;
		word-break: break-word;
	}
	.message .text ::v-deep a {
		color: #5fad1b;
	}
	.message .original {
		padding: 4px;
		min-width: calc(100% - 10px);
		max-width: calc(100% - 10px);
		min-height: 120px;
		margin-bottom: 40px;
	}
	.message .date {
		position: absolute;
		bottom: 10px;
		right: 10px;
		color: #aaa;
		font-size: 12px;
		text-align: right;
	}
	.edit-wrapper {
		position: absolute;
		bottom: 10px;
		left: 15px;
		color: #aaa;
		font-size: 14px;
		cursor: pointer;
	}
	.edit-buttons {
		position: absolute;
		bottom: 10px;
		left: 10px;
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
		width: calc(100% - 20px);
		height: 170px;
		max-width: 100%;
		margin-top: 5px;
		padding: 10px;
		font-size: 15px;
		font-family: "Roboto", sans-serif;
		color: #555;
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
		padding-right: 4px;
	}
	.vote.zero {
		opacity: 0.3;
	}
	.vote.zero:hover {
		opacity: 1;
	}
	.vote.active {
		font-weight: bold;
	}
	.vote.up, .vote.up.zero:hover {
		color: #5fad1b;
	}
	.vote.up.zero, .vote.down.zero {
		color: #555;
	}
	.vote.down, .vote.down.zero:hover {
		color: red;
		margin-right: 20px;
	}
	.vote.up.active {
		color: white;
		background: #5fad1b;
	}
	.vote.down.active {
		color: white;
		background: red;
	}
	.tooltip.votes-tooltip .content img {
		margin: 3px 40px;
		display: block;
	}
	.message ::v-deep h1 {
		margin-left: 0;
		margin-bottom: 10px;
		font-size: 28px;
		margin-top: 10px;
		display: block;
		background: transparent;
		color: #555;
		padding: 0px;
		text-shadow: none;
	}
	.message ::v-deep h1:after {
		display: none;
	}
	.message ::v-deep h1:before {
		display: none;
	}
	.message ::v-deep h2 {
		margin-left: 0;
		margin-bottom: 10px;
		font-size: 23px;
		margin-top: 10px;
	}
	.message ::v-deep h3 {
		margin-left: 0;
		margin-bottom: 10px;
		font-size: 18px;
		margin-top: 10px;
		display: block;
		background: transparent;
		color: #555;
		padding: 0px;
		text-shadow: none;
	}
	.message ::v-deep h3:after {
		display: none;
	}
	.message ::v-deep h3:before {
		display: none;
	}
	.message ::v-deep code {
		display: block;
		width: 100%;
	}
	.emoji-picker ::v-deep .chat-input-emoji {
		position: absolute;
		right: 10px;
		top: 10px;
	}
</style>