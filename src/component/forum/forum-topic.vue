<template>
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>
					<router-link to="/forum">{{ $t('forum.title') }}</router-link>
					>
					<router-link v-if="topic" :to="'/forum/category-' + category.id">{{ categoryName }}</router-link>
					>
					<span ref="topicTitle" :contenteditable="topicEditing" class="topic-title">{{ topic ? topic.name : '...' }}</span>
				</h1>
				<div v-if="topic" class="info attrs">
					<i v-if="topic.resolved" :title="$t('topic_resolved')" class="attr material-icons">check_circle</i>
					<i v-if="topic.locked" :title="$t('topic_locked')" class="attr material-icons">lock</i>
					<img v-if="topic.pinned" :title="$t('topic_pinned')" class="attr" src="/image/pin_white.png">
				</div>
			</div>
			<div class="tabs" v-if="!LeekWars.mobile">
				<div v-if="topic && topic.subscribed" class="tab" @click="unsubscribe">{{ $t('unsubscribe') }}</div>
				<div v-else class="tab" @click="subscribe">{{ $t('subscribe') }}</div>
			</div>
		</div>

		<div class="panel">
			<div class="content">
				<pagination v-if="topic" :current="page" :total="pages" :url="'/forum/category-' + category.id + '/topic-' + topic.id" />
				<loader v-if="!topic || !topic.messages" />
				<div v-else>
					<div v-for="message in topic.messages" :key="message.id" :id="'message-' + message.id" class="message-wrapper">
						<div class="profile">
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
								<div class="messages-count"><b>{{ message.writer.messages }}</b> messages</div>
								<div class="trophy-count"><b>{{ message.writer.trophies }}</b> trophées</div>
							</div>
						</div>
						<div class="message card">
							<div class="wrapper">
								<a v-if="message.id != -1" :href="'#message-' + message.id" class="link">#</a>
								<router-link v-else to="" class="link">#</router-link>
								
								<textarea v-if="message.editing" v-model="message.message" :style="{height: message.height + 'px'}" class="original"></textarea>
								<div v-emojis v-code v-else class="text" v-html="message.html"></div>

								<div class="date">
									{{ LeekWars.formatDateTime(message.date) }}
									<br>
									<span v-if="message.edition_date != null">
										{{ $t('forum.edited_the', [LeekWars.formatDateTime(message.edition_date)]) }}
									</span>
								</div>

								<div v-if="!message.editing" class="edit-wrapper">
									<div class="votes">
										<v-tooltip :open-delay="0" :close-delay="0" :disabled="message.votes_up === 0" :key="votes_up_names[message.id] ? message.id * 101 + votes_up_names[message.id].length : message.id * 101" bottom @input="loadVotesUp(message)">
											<div slot="activator" :class="{active: message.my_vote == 1, zero: message.votes_up === 0}" class="vote up" @click="voteUp(message)">
												<i class="material-icons">thumb_up</i>&nbsp;
												<span class="counter">{{ message.votes_up }}</span>
											</div>
											<loader v-if="!votes_up_names[message.id]" :size="30" />
											<div v-else>
												<div v-for="name in votes_up_names[message.id]" :key="name">{{ name }}</div>
											</div>
										</v-tooltip>
										<v-tooltip :open-delay="0" :close-delay="0" :disabled="message.votes_down === 0" :key="votes_down_names[message.id] ? message.id * 100 + votes_down_names[message.id].length : message.id" bottom @input="loadVotesDown(message)">
											<div slot="activator" :class="{active: message.my_vote == -1, zero: !message.votes_down}" class="vote down" @click="voteDown(message)">
												<i class="material-icons">thumb_down</i>&nbsp;
												<span class="counter">{{ message.votes_down }}</span>
											</div>
											<loader v-if="!votes_down_names[message.id]" :size="30" />
											<div v-else>
												<div v-for="name in votes_down_names[message.id]" :key="name">{{ name }}</div>
											</div>
										</v-tooltip>
									</div>
								
									<template v-if="$store.state.farmer && (message.writer.id == $store.state.farmer.id || category.moderator)">
										<span class="edit" @click="edit(message)">{{ $t('forum.edit') }}</span>
										&nbsp;&nbsp;-&nbsp;&nbsp;
										<span class="delete" @click="deleteGeneric(message)">{{ $t('delete') }}</span>
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
									<span class="button green confirm-edit" @click="confirmEdit(message)">{{ $t('send') }}</span>&nbsp;
									<span class="button cancel-edit" @click="endEdit(message)">{{ $t('cancel') }}</span>
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
						<div class="button green" @click="send">{{ $t('send') }}</div>
					</center>
					<formatting-rules />
					<br>
				</div>

				<h2 v-if="topic">
					<router-link to="/forum">{{ $t('forum.title') }}</router-link>
					>
					<router-link :to="'/forum/category-' + category.id">{{ categoryName }}</router-link>
					>
					{{ topic.name }}
				</h2>
			</div>
		</div>

		<v-dialog v-model="deleteMessageDialog" :max-width="600">
			<div class="title">{{ $t('do_you_want_to_delete_message') }}</div>
			<div class="content">{{ $t('undoable_action') }}</div>
			<div class="actions">
				<div @click="deleteMessageDialog = false">{{ $t('cancel') }}</div>
				<div class="red" @click="deleteMessage">{{ $t('delete') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-model="deleteTopicDialog" :max-width="600">
			<div class="title">{{ $t('do_you_want_to_delete_topic') }}</div>
			<div class="content">{{ $t('undoable_action') }}</div>
			<div class="actions">
				<div @click="deleteTopicDialog = false">{{ $t('cancel') }}</div>
				<div class="red" @click="deleteTopic">{{ $t('delete') }}</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import { ForumCategory, ForumMessage, ForumTopic } from '@/model/forum'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'forum_topic', i18n: {} })
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
		action = {icon: 'notifications_off', click: () => this.toggleSubscribe()}

		get categoryName() {
			return this.category ? this.category.team > 0 ? this.category.name : this.$t('forum.category_' + this.category.name) : ''
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
			LeekWars.get<any>('forum/get-messages/' + topic + '/' + this.page + '/' + this.$store.state.token).then((data) => {
				if (!data.data.success) {
					// LW.error()
					return
				}
				this.topic = data.data.topic
				if (!this.topic) { return }
				this.category = data.data.category
				if (this.topic) {
					Vue.set(this.topic, 'messages', data.data.messages)
					if (this.topic.messages) {
						for (const message of this.topic.messages) {
							Vue.set(message, 'editing', false)
							Vue.set(message, 'height', 100)
						}
					}
				}
				this.pages = data.data.pages
				LeekWars.setTitle(this.topic.name, this.$t('forum_topic.n_messages', [data.data.total]))
				LeekWars.setActions([this.action])
				if (this.topic.subscribed) { this.action.icon = 'notifications_active' }
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
			LeekWars.post('forum/get-message-up-votes-names', {topic_id: this.topic.id, message_id: message.id}).then((data) => {
				Vue.set(this.$data.votes_up_names, message.id, data.data.farmers.map((f: any) => f[1]))
			})
		}
		loadVotesDown(message: ForumMessage) {
			if (!this.topic || this.votes_down_names[message.id] !== undefined) { return }
			Vue.set(this.$data.votes_down_names, message.id, null)
			LeekWars.post('forum/get-message-down-votes-names', {topic_id: this.topic.id, message_id: message.id}).then((data) => {
				Vue.set(this.$data.votes_down_names, message.id, data.data.farmers.map((f: any) => f[1]))
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
			LeekWars.post("forum/delete-message", {message_id: this.toDeleteMessage.id}).then((data) => {
				if (data.data.success && this.toDeleteMessage) {
					this.toDeleteMessage = null
					this.deleteMessageDialog = false
					this.update(true)
				}
			})
		}
		deleteTopic() {
			if (!this.topic) { return }
			LeekWars.post("forum/delete-topic", {topic_id: this.topic.id}).then((data) => {
				if (data.data.success && this.category) {
					this.deleteTopicDialog = false
					this.$router.push("/forum/category-" + this.category.id)
				}
			})
		}
		updateDraft() {
			localStorage.setItem('forum/draft', this.newMessage)
		}
		send() {
			if (!this.topic) { return }
			LeekWars.post("forum/post-message", {topic_id: this.topic.id, message: this.newMessage}).then((data) => {
				if (data.data.success) {
					localStorage.setItem('forum/draft', '')
					this.newMessage = ''
					this.update(true)
				}
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
			this.action.icon = 'notifications_active'
			LeekWars.toast(this.$t('notifications_on'))
		}
		unsubscribe() {
			if (!this.topic) { return }
			LeekWars.post('forum/unsubscribe-topic', {topic_id: this.topic.id})
			this.topic.subscribed = false
			this.action.icon = 'notifications_off'
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
				if (data.data.success) {
					message.html = data.data.html
					message.editing = false
					message.edition_date = LeekWars.time
					if (message.id === -1) {
						this.topicEditing = false
					}
				}
			}
			if (message.id !== -1) {
				LeekWars.post("forum/edit-message", {message_id: message.id, message: message.message}).then(callback)
			} else {
				const input = this.$refs.topicTitle as HTMLElement
				const title = input.innerText
				LeekWars.post("forum/edit-topic", {topic_id: this.topic.id, title, message: message.message}).then(callback)
			}
		}
	}
</script>

<style lang="scss" scoped>
	h1 {
		font-size: 22px;
		line-height: 35px;
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
	.message .text /deep/ a {
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
	}
	.attrs img {
		margin: 0 6px;
		opacity: 0.9;
	}
	i.attr {
		font-size: 22px;
		margin: 0 6px;
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
	.message /deep/ h1 {
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
	.message /deep/ h1:after {
		display: none;
	}
	.message /deep/ h1:before {
		display: none;
	}
	.message /deep/ h2 {
		margin-left: 0;
		margin-bottom: 10px;
		font-size: 23px;
		margin-top: 10px;
	}
	.message /deep/ h3 {
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
	.message /deep/ h3:after {
		display: none;
	}
	.message /deep/ h3:before {
		display: none;
	}
	.message /deep/ code {
		display: block;
		width: 100%;
	}
</style>