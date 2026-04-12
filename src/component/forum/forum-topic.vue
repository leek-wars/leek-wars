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
						<v-icon v-if="topic.locked" :title="$t('locked')" class="attr">mdi-lock</v-icon>
						<v-icon v-if="topic.pinned" :title="$t('pinned')" class="attr">mdi-pin</v-icon>
						<v-icon v-if="topic.status === ForumTopicStatus.RESOLVED" :title="$t('status_resolved')" class="attr status-resolved">mdi-check-circle</v-icon>
						<v-icon v-if="topic.status === ForumTopicStatus.NOT_REPRODUCED" :title="$t('status_not_reproduced')" class="attr status-not-reproduced">mdi-help-circle</v-icon>
						<v-icon v-if="topic.status === ForumTopicStatus.NOT_PLANNED" :title="$t('status_not_planned')" class="attr status-not-planned">mdi-minus-circle</v-icon>
						<v-icon v-if="topic.status === ForumTopicStatus.NOT_A_BUG" :title="$t('status_not_a_bug')" class="attr status-not-a-bug">mdi-close-circle</v-icon>
						<v-icon v-if="topic.status === ForumTopicStatus.OBSOLETE" :title="$t('status_obsolete')" class="attr status-obsolete">mdi-archive</v-icon>
						<v-icon v-if="topic.hidden" :title="$t('hide_topic')" class="attr hidden-icon">mdi-eye-off</v-icon>
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
							<textarea v-else-if="message.editing" ref="textarea" v-model="message.message" :style="{height: message.height + 'px'}" class="original" @input="autoResize(message, $event)"></textarea>
							<div v-else-if="message.html" v-emojis v-code class="text" v-html="message.html"></div>
							<markdown v-else :content="message.message" mode="forum" />

							<emoji-picker v-if="message.editing" class="emoji-picker" @pick="addEmoji(message, $event, $refs.textarea[0])" />

							<router-link v-if="message.id === -1 && topic.release" :to="'/release/' + releaseVersion.substring(1)" class="changelog-banner">
								<img :src="'/image/mail/mail_' + topic.release + '.webp'" class="changelog-banner-image" @error="($event.target as HTMLImageElement).style.display = 'none'">
								<span class="changelog-banner-link">
									<v-icon>mdi-newspaper-variant-outline</v-icon>
									{{ $t('see_changelog', [releaseVersion]) }}
								</span>
							</router-link>

							<div v-if="message.id === -1 && topic.user_agent" class="user-agent" :title="topic.user_agent"><v-icon size="small">mdi-monitor</v-icon> {{ LeekWars.parseUserAgent(topic.user_agent) }}</div>

							<div class="bottom">

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

								<span v-if="message.id == -1" class="views-counter"><v-icon>mdi-eye</v-icon> {{ $tc('main.n_views', topic.views) }}</span>

								<template v-if="message.id == -1 && $store.state.connected && category.moderator">
									<span class="action lock" @click="lock"><v-icon>mdi-lock</v-icon> {{ topic.locked ? $t('unlock') : $t('lock') }}</span>
									<span class="action pin" @click="pin"><v-icon>mdi-pin</v-icon> {{ topic.pinned ? $t('unpin') : $t('pin') }}</span>
								</template>
								<template v-if="message.id == -1 && canEditStatus">
									<v-select v-model="topic.status" :items="statusItems" hide-details dense variant="outlined" class="status-select" @update:model-value="setStatus">
										<template #selection="{ item }">
											<v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>&nbsp;{{ item.raw.title }}
										</template>
										<template #item="{ props, item }">
											<v-list-item v-bind="props">
												<template #prepend>
													<v-icon :color="item.raw.color" class="status-icon">{{ item.raw.icon }}</v-icon>
												</template>
											</v-list-item>
										</template>
									</v-select>
								</template>
								<span v-else-if="message.id == -1 && topic.status !== ForumTopicStatus.OPEN && currentStatusInfo" class="status-text">
									<v-icon :color="currentStatusInfo.color">{{ currentStatusInfo.icon }}</v-icon> {{ currentStatusInfo.title }}
								</span>
								<template v-if="message.id == -1 && $store.state.farmer && $store.state.farmer.admin">
									<span v-if="topic.release" class="action" @click="releaseInput = topic.release; releaseDialog = true">
										<v-icon>mdi-tag</v-icon> {{ 'v' + String(topic.release).charAt(0) + '.' + String(topic.release).slice(1) }}
									</span>
									<v-select v-if="hasPriority" v-model="topic.priority" :items="priorityItems" hide-details dense variant="outlined" class="priority-select" @update:model-value="setPriority">
										<template #selection="{ item }">
											<v-icon :color="item.raw.color" size="small">{{ item.raw.icon }}</v-icon>&nbsp;{{ item.raw.title }}
										</template>
										<template #item="{ props, item }">
											<v-list-item v-bind="props">
												<template #prepend>
													<v-icon :color="item.raw.color" size="small">{{ item.raw.icon }}</v-icon>
												</template>
											</v-list-item>
										</template>
									</v-select>
								</template>
								<span v-if="message.id == -1 && hasPriority && topic.priority && !($store.state.farmer && $store.state.farmer.admin)" class="priority-label" :class="'priority-' + topic.priority">
									<v-icon :color="topic.priority === 1 ? '#e53935' : topic.priority === 2 ? '#fb8c00' : '#757575'" size="small">mdi-flag</v-icon>
									{{ topic.priority === 1 ? $t('priority_high') : topic.priority === 2 ? $t('priority_medium') : $t('priority_low') }}
								</span>
								<template v-if="message.id == -1">
									<span v-if="topic.acknowledged && !topic.private_issue && !($store.state.farmer && $store.state.farmer.admin)" class="status-text"><v-icon color="#6f42c1">mdi-eye</v-icon> {{ $t('status_acknowledged') }}</span>
									<a v-if="topic.issue" :href="'https://github.com/leek-wars/leek-wars/issues/' + topic.issue" class="issue-badge" target="_blank" rel="noopener">
										<img src="/image/github_white.png"><span>#{{ topic.issue }}</span>
									</a>
									<a v-if="topic.private_issue && $store.state.farmer && $store.state.farmer.admin" :href="'https://github.com/5pilow/leek-wars/issues/' + topic.private_issue" class="issue-badge private-issue" target="_blank" rel="noopener">
										<img src="/image/github_white.png"><span>#{{ topic.private_issue }}</span>
									</a>
									<span v-if="$store.state.farmer && $store.state.farmer.admin && !topic.private_issue && topic.status === ForumTopicStatus.OPEN" class="action create-issue" @click="createIssue"><v-icon>{{ creatingIssue ? 'mdi-loading mdi-spin' : 'mdi-source-branch' }}</v-icon> {{ $t('create_issue') }}</span>
								</template>

								<v-spacer />

								<div class="date">
									<div>{{ LeekWars.formatDateTime(message.date) }}</div>
									<div v-if="message.edition_date != null">
										{{ $t('edited_the', [LeekWars.formatDateTime(message.edition_date)]) }}
									</div>
								</div>

								<v-menu v-if="$store.state.farmer && !message.deleted && !message.editing && ((message.writer.id === $store.state.farmer.id || category.moderator) || (category.team === -1 && message.writer.id !== $store.state.farmer.id && message.writer.color !== 'admin'))" offset-y>
									<template #activator="{ props }">
										<v-btn variant="text" density="compact" icon="mdi-dots-vertical" color="grey" v-bind="props" />
									</template>
									<v-list dense class="message-actions">
										<v-list-item v-if="$store.state.farmer && (message.writer.id === $store.state.farmer.id || category.moderator)" v-ripple @click="edit(message)" prepend-icon="mdi-pencil">
											<span>{{ $t('edit') }}</span>
										</v-list-item>
										<v-list-item v-if="$store.state.farmer && (message.id !== -1 ? (message.writer.id === $store.state.farmer.id || category.moderator) : canDeleteTopic)" v-ripple @click="deleteGeneric(message)" prepend-icon="mdi-delete">
											<span>{{ $t('delete') }}</span>
										</v-list-item>
										<v-list-item v-if="category.team === -1 && message.writer.id !== $store.state.farmer.id && message.writer.color !== 'admin'" v-ripple @click="report(message)" prepend-icon="mdi-flag">
											<span>{{ $t('warning.report') }}</span>
										</v-list-item>
										<v-menu v-if="message.id === -1 && canMoveTopic" submenu open-on-hover>
											<template #activator="{ props }">
												<v-list-item v-bind="props" v-ripple prepend-icon="mdi-folder-move" append-icon="mdi-chevron-right" @click.stop>
													<span>{{ $t('move') }}</span>
												</v-list-item>
											</template>
											<v-list dense>
												<v-list-item v-for="cat in moveCategories" :key="cat.id" v-ripple @click="moveTopic(cat.id)">
													<span>{{ cat.name }}</span>
												</v-list-item>
											</v-list>
										</v-menu>
										<v-list-item v-if="message.id === -1 && $store.state.farmer && $store.state.farmer.admin" v-ripple @click="toggleHidden" :prepend-icon="topic.hidden ? 'mdi-eye' : 'mdi-eye-off'">
											<span>{{ topic.hidden ? $t('show_topic') : $t('hide_topic') }}</span>
										</v-list-item>
										<v-list-item v-if="message.id === -1 && $store.state.farmer && $store.state.farmer.admin && !topic.release" v-ripple prepend-icon="mdi-tag" @click="releaseInput = topic.release; releaseDialog = true">
											<span>{{ $t('set_release') }}</span>
										</v-list-item>
									</v-list>
								</v-menu>
							</div>

							<div v-if="message.editing" class="edit-buttons">
								<v-btn color="primary" class="confirm-edit send" @click="confirmEdit(message)"><v-icon>mdi-send-outline</v-icon> {{ $t('main.send') }}</v-btn>
								<v-btn class="cancel-edit" @click="endEdit(message)">{{ $t('main.cancel') }}</v-btn>
								<span v-if="message.id == -1">
									GitHub Issue <input v-model.number="topic.issue" type="number">
								</span>
							</div>

							<formatting-rules v-if="message.editing" />
						</div>
					</div>
				</div>

				<pagination v-if="topic" :current="page" :total="pages" :url="'/forum/category-' + category.id + '/topic-' + topic.id" />

				<div v-if="topic && !topic.locked && $store.state.farmer && $store.state.farmer.verified" class="editor">
					<h4>{{ $t('answer') }}</h4>
					<div class="response-wrapper">
						<textarea ref="responseTextarea" v-model="newMessage" class="response card" @keyup="updateDraft"></textarea>
						<emoji-picker @pick="addEmojiNewMessage">😀</emoji-picker>
					</div>
					<div class="center">
						<div v-if="page != pages" class="warning"><v-icon>mdi-alert</v-icon> {{ $t('not_last_page') }}</div>
						<div v-if="isOldTopic" class="warning"><v-icon>mdi-alert</v-icon> {{ $t('old_topic_warning') }}</div>
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

		<popup v-model="releaseDialog" :width="400">
			<template #icon><v-icon>mdi-tag</v-icon></template>
			<template #title>{{ $t('set_release') }}</template>
			<div>
				<v-text-field ref="releaseField" v-model.number="releaseInput" type="number" placeholder="245" style="width: 100%" :hint="$t('release_hint')" autofocus />
			</div>
			<template #actions>
				<div v-ripple @click="releaseDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="action green" @click="setRelease">OK</div>
			</template>
		</popup>

		<popup v-model="oldTopicDialog" :width="600">
			<template #icon>
				<v-icon>mdi-alert</v-icon>
			</template>
			<template #title>
				<span>{{ $t('old_topic_title') }}</span>
			</template>
			{{ $t('old_topic_confirm') }}
			<template #actions>
				<div v-ripple @click="oldTopicDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="green" @click="send">{{ $t('send') }}</div>
			</template>
		</popup>

		<report-dialog v-if="reportFarmer" v-model="reportDialog" :target="reportFarmer" :reasons="reasons" :parameter="reportContent" class="report-dialog" />
	</div>
</template>

<script lang="ts">
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { locale } from '@/locale'
	import { Farmer } from '@/model/farmer'
	import { ForumCategory, ForumMessage, ForumTopic, ForumTopicStatus } from '@/model/forum'
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
		ForumTopicStatus = ForumTopicStatus
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
		oldTopicDialog: boolean = false
		creatingIssue: boolean = false
		forumLanguages: string[] = []
		reportDialog: boolean = false
		reportFarmer: Farmer | null = null
		reportContent: string = ''
		moveCategories: {id: number, name: string}[] = []
		releaseDialog: boolean = false
		releaseInput: number | null = null
		get hasPriority() {
			return this.category && (this.category.name === 'bug_reports' || this.category.name === 'suggestions_ideas')
		}
		get priorityItems() {
			return [
				{ value: 0, title: this.$t('priority_none') as string, icon: 'mdi-flag-outline', color: '' },
				{ value: 1, title: this.$t('priority_high') as string, icon: 'mdi-flag', color: '#e53935' },
				{ value: 2, title: this.$t('priority_medium') as string, icon: 'mdi-flag', color: '#fb8c00' },
				{ value: 3, title: this.$t('priority_low') as string, icon: 'mdi-flag', color: '#757575' },
			]
		}
		reasons = [
			Warning.RUDE_FORUM,
			Warning.FLOOD_FORUM,
			Warning.PROMO_FORUM,
			Warning.INCORRECT_FARMER_NAME,
			Warning.INCORRECT_AVATAR,
		]

		get releaseVersion() {
			if (!this.topic || !this.topic.release) { return '' }
			return 'v' + String(this.topic.release).charAt(0) + '.' + String(this.topic.release).slice(1)
		}
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
				if (this.canMoveTopic) {
					this.loadMoveCategories()
				}
			})
		}
		createIssue() {
			if (!this.topic || this.creatingIssue) { return }
			this.creatingIssue = true
			LeekWars.post('forum/create-issue', {topic_id: this.topic.id}).then((data: any) => {
				if (this.topic) {
					this.topic.private_issue = data.private_issue
				}
				this.creatingIssue = false
			})
		}
		get canMoveTopic() {
			if (!this.category || !this.$store.state.farmer) { return false }
			if (this.category.team !== -1 || this.category.name === 'admin' || this.category.name === 'moderation') { return false }
			return this.category.moderator || this.topic?.owner === this.$store.state.farmer.id
		}
		get canEditStatus() {
			return this.$store.state.connected && ((this.$store.state.farmer && this.topic?.owner === this.$store.state.farmer.id) || this.category?.moderator)
		}
		get canDeleteTopic() {
			if (!this.category || !this.$store.state.farmer) { return false }
			if (this.category.moderator) { return true }
			return this.topic?.owner === this.$store.state.farmer.id && this.pages <= 1 && this.topic?.messages?.length === 1
		}
		get allStatuses(): {[key: number]: {title: string, value: ForumTopicStatus, icon: string, color: string}} {
			return {
				[ForumTopicStatus.OPEN]: { title: this.$t('status_open') as string, value: ForumTopicStatus.OPEN, icon: 'mdi-circle-outline', color: 'grey' },
				[ForumTopicStatus.RESOLVED]: { title: this.$t('status_resolved') as string, value: ForumTopicStatus.RESOLVED, icon: 'mdi-check-circle', color: 'green' },
				[ForumTopicStatus.NOT_REPRODUCED]: { title: this.$t('status_not_reproduced') as string, value: ForumTopicStatus.NOT_REPRODUCED, icon: 'mdi-help-circle', color: 'orange' },
				[ForumTopicStatus.NOT_PLANNED]: { title: this.$t('status_not_planned') as string, value: ForumTopicStatus.NOT_PLANNED, icon: 'mdi-minus-circle', color: 'grey' },
				[ForumTopicStatus.NOT_A_BUG]: { title: this.$t('status_not_a_bug') as string, value: ForumTopicStatus.NOT_A_BUG, icon: 'mdi-close-circle', color: 'grey' },
				[ForumTopicStatus.OBSOLETE]: { title: this.$t('status_obsolete') as string, value: ForumTopicStatus.OBSOLETE, icon: 'mdi-archive', color: 'grey' },
			}
		}
		get currentStatusInfo() {
			return this.topic ? this.allStatuses[this.topic.status] : null
		}
		get statusItems() {
			const items = [this.allStatuses[ForumTopicStatus.OPEN], this.allStatuses[ForumTopicStatus.RESOLVED]]
			if (this.category?.moderator) {
				const isBug = this.category?.name === 'bug_reports'
				const isSuggestion = this.category?.name === 'suggestions_ideas'
				if (isBug) {
					items.push(this.allStatuses[ForumTopicStatus.NOT_REPRODUCED])
					items.push(this.allStatuses[ForumTopicStatus.NOT_A_BUG])
				}
				if (isSuggestion) {
					items.push(this.allStatuses[ForumTopicStatus.NOT_PLANNED])
					items.push(this.allStatuses[ForumTopicStatus.OBSOLETE])
				}
			}
			return items
		}
		setStatus(status: ForumTopicStatus) {
			if (!this.topic) { return }
			LeekWars.post('forum/set-topic-status', {topic_id: this.topic.id, status})
			this.topic.status = status
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
		loadMoveCategories() {
			if (!this.category) { return }
			const languages = this.forumLanguages.join(',')
			LeekWars.get('forum/get-categories/' + languages).then((data: any) => {
				this.moveCategories = data.categories
					.filter((c: any) => c.id !== this.category!.id && c.type !== 'team' && c.name !== 'admin' && c.name !== 'moderation')
					.map((c: any) => ({
						id: c.id,
						name: this.$t('forum-category.' + c.name) as string
					}))
			})
		}
		moveTopic(categoryId: number) {
			if (!this.topic) { return }
			LeekWars.post('forum/move-topic', {topic_id: this.topic.id, category_id: categoryId}).then(() => {
				this.$router.push('/forum/category-' + categoryId + '/topic-' + this.topic!.id)
				this.category!.id = categoryId
			})
		}
		updateDraft() {
			localStorage.setItem('forum/draft-' + this.topic!.id, this.newMessage)
		}
		send() {
			if (!this.topic || this.sendingMessage) { return }
			if (this.isOldTopic && !this.oldTopicDialog) {
				this.oldTopicDialog = true
				return
			}
			this.oldTopicDialog = false
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
			const textElement = document.querySelector('#message-' + message.id + ' .text, #message-' + message.id + ' .md') as HTMLElement
			if (textElement) {
				message.height = textElement.offsetHeight - 14
			}
			message.editing = true
			if (message.id === -1) {
				this.topicEditing = true
			}
		}
		autoResize(message: ForumMessage, e: Event) {
			const textarea = e.target as HTMLTextAreaElement
			if (textarea.scrollHeight > message.height) {
				message.height = textarea.scrollHeight
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
				LeekWars.post("forum/edit-topic", {
					topic_id: this.topic.id,
					title,
					message: message.message,
					issue: this.topic.issue || 0,
					release: this.topic.release || 0,
				}).then(callback)
			}
		}
		addEmoji(message: ForumMessage, emoji: string, textarea: any) {
			const index = textarea.selectionStart
			message.message = message.message.slice(0, index) + emoji + message.message.slice(index, message.message.length)
		}
		addEmojiNewMessage(emoji: string) {
			const textarea = this.$refs.responseTextarea as HTMLTextAreaElement
			const index = textarea.selectionStart
			const text = this.newMessage || ''
			this.newMessage = text.slice(0, index) + emoji + text.slice(index)
			this.$nextTick(() => {
				textarea.focus()
				textarea.selectionStart = textarea.selectionEnd = index + emoji.length
			})
		}

		toggleHidden() {
			if (!this.topic) { return }
			LeekWars.post('forum/toggle-hidden', {topic_id: this.topic.id}).then((data: any) => {
				if (this.topic) {
					this.topic.hidden = data.hidden
				}
			})
		}
		setRelease() {
			if (!this.topic) { return }
			LeekWars.post('forum/set-release', {topic_id: this.topic.id, release: this.releaseInput || 0}).then(() => {
				if (this.topic) {
					this.topic.release = this.releaseInput || null
					this.releaseDialog = false
				}
			})
		}
		setPriority(priority: number) {
			if (!this.topic) { return }
			LeekWars.post('forum/set-topic-priority', {topic_id: this.topic.id, priority})
		}
		get isOldTopic(): boolean {
			if (!this.topic || !this.topic.last_message_date) { return false }
			const oneYearAgo = (Date.now() / 1000) - 365 * 24 * 3600
			return this.topic.last_message_date < oneYearAgo
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
	.message .user-agent {
		font-size: 12px;
		color: var(--text-color-secondary);
		padding: 6px 10px;
		background: var(--background-secondary);
		border-radius: 4px;
		margin-top: 10px;
		word-break: break-all;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.message .bottom {
		display: flex;
		align-items: center;
		margin-top: 10px;
		color: var(--text-color-secondary);
		font-size: 14px;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		span .v-icon {
			font-size: 17px;
			vertical-align: bottom;
		}
		.action {
			cursor: pointer;
			display: inline-flex;
			gap: 4px;
			padding: 6px;
			border-radius: 6px;
		}
		.action:hover {
			color: var(--text-color);
			background: var(--background);
			.v-icon {
				opacity: 1 !important;
			}
		}
		.date {
			color: var(--text-color-secondary);
			font-size: 12px;
			line-height: 1.5;
			text-align: right;
		}
	}
	.status-text {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 14px;
	}
	.status-select {
		display: inline-flex;
		vertical-align: middle;
		flex-grow: 0;
		:deep(.v-field) {
			font-size: 13px;
			min-height: 28px;
			padding: 4px 8px;
		}
		:deep(.v-field__input) {
			padding: 0;
			min-height: unset;
			align-items: center;
		}
		:deep(.v-icon) {
			opacity: 1 !important;
		}
		:deep(.v-select__selection) {
			color: var(--text-color);
		}
	}
	:global(.v-list-item__prepend .v-icon.status-icon) {
		opacity: 1 !important;
	}
	:global(.v-list-item__prepend .v-icon) {
		opacity: 1 !important;
	}
	.priority-select {
		display: inline-flex;
		vertical-align: middle;
		flex-grow: 0;
		:deep(.v-field) {
			font-size: 13px;
			min-height: 28px;
			padding: 4px 8px;
		}
		:deep(.v-field__input) {
			padding: 0;
			min-height: unset;
			align-items: center;
		}
		:deep(.v-icon) {
			opacity: 1 !important;
		}
		:deep(.v-select__selection) {
			color: var(--text-color);
		}
	}
	.priority-label {
		font-size: 13px;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 2px;
		&.priority-1 { color: #e53935; }
		&.priority-2 { color: #fb8c00; }
		&.priority-3 { color: #757575; }
	}
	.editor {
		margin-left: 140px;
		margin-top: 20px;
	}
	#app.app .editor {
		margin-left: 10px;
		margin-right: 10px;
	}
	.response-wrapper {
		position: relative;
		:deep(.chat-input-emoji) {
			position: absolute;
			right: 10px;
			top: 10px;
		}
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
		&.status-not-a-bug {
			color: white;
		}
		&.status-acknowledged {
			color: #6f42c1;
		}
		&.status-obsolete {
			color: var(--text-color);
			opacity: 0.7;
		}
		&.hidden-icon {
			color: white;
		}
	}
	.release-badge {
		background: #28a745;
		color: white;
		border-radius: 5px;
		font-size: 13px;
		font-weight: 500;
		padding: 2px 6px;
		display: inline-block;
		vertical-align: middle;
		margin: 0 4px;
	}
	.issue-badge {
		background: #0366d6;
		color: white;
		border-radius: 5px;
		font-size: 13px;
		font-weight: 500;
		padding: 0 6px;
		display: inline-flex;
		align-items: center;
		height: 22px;
		img {
			height: 16px;
			margin-right: 4px;
		}
		&.private-issue {
			background: #6f42c1;
		}
	}
	.votes {
		display: inline-flex;
		gap: 6px;
	}
	.vote {
		display: inline-block;
		cursor: pointer;
		font-size: 16px;
		padding: 2px 6px;
		border-radius: 6px;
		&.up:hover {
			background: #5fad1b22;
		}
		&.down:hover {
			background: #ff000022;
		}
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
		height: auto;
		line-height: normal;
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
	.center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
	}
	.warning {
		color: #ff5f00;
	}
	#app:not(.app) .pagination {
		margin-bottom: 15px;
	}
	.changelog-banner {
		display: flex;
		flex-direction: column;
		margin: 15px 0;
		border-radius: 4px;
		overflow: hidden;
		text-decoration: none;
		transition: opacity 0.2s;
		&:hover {
			opacity: 0.9;
		}
	}
	.changelog-banner-image {
		width: 100%;
		display: block;
	}
	.changelog-banner-link {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: #5fad1b;
		color: white;
		font-weight: 500;
		font-size: 15px;
		.v-icon {
			color: white;
		}
	}
	.views-counter {
		display: flex;
		align-items: center;
		gap: 5px;
		color: var(--text-color-secondary);
		font-size: 14px;
		padding: 5px 10px;
		i { font-size: 18px; }
	}
</style>