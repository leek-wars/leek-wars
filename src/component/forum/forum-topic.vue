<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="title-wrapper">
				<h1>
					<router-link to="/forum">{{ $t('main.forum') }}</router-link>
					<v-icon>mdi-chevron-right</v-icon>
					<router-link v-if="topic && category" :to="'/forum/category-' + category.id">{{ categoryName }}</router-link>
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
				<pagination v-if="topic && category" :current="page" :total="pages" :url="'/forum/category-' + category.id + '/topic-' + topic.id" />
				<i18n-t v-if="notFound" keypath="topic_not_found" tag="div" class="not-found">
					<template #topic><b>{{ $route.params.topic }}</b></template>
				</i18n-t>
			<loader v-else-if="!topic || !topic.messages" />
				<div v-else>
					<div v-for="message in topic.messages" :id="'message-' + message.id" :key="message.id" class="message-wrapper" :ref="(el) => { if (message.id === -1) setOpEl(el as HTMLElement | null) }">
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
							<!-- Barre d'actions répétée en haut du 1er post quand le topic est long (#4154). -->
							<div v-if="message.id === -1 && longTopic" class="bottom topic-bar-top">
								<div v-if="!message.deleted" class="votes">
									<div :class="{active: message.my_vote == 1, zero: message.votes_up === 0}" class="vote up" @click="voteUp(message)">
										<v-icon>mdi-thumb-up</v-icon>
										<span class="counter">{{ message.votes_up }}</span>
									</div>
									<div :class="{active: message.my_vote == -1, zero: !message.votes_down}" class="vote down" @click="voteDown(message)">
										<v-icon>mdi-thumb-down</v-icon>
										<span class="counter">{{ message.votes_down }}</span>
									</div>
								</div>
								<forum-topic-actions
									:topic="topic"
									:category="category"
									:can-edit-status="!!canEditStatus"
									:has-priority="!!hasPriority"
									:status-items="statusItems"
									:priority-items="priorityItems"
									:current-status-info="currentStatusInfo"
									:creating-issue="creatingIssue"
									@lock="lock"
									@pin="pin"
									@set-status="setStatus"
									@set-priority="setPriority"
									@create-issue="createIssue"
									@open-release="openReleaseDialog"
								/>
							</div>

							<div v-if="message.deleted" class="text deleted">{{ $t('deleted_message') }}</div>
							<textarea v-else-if="message.editing" ref="textarea" v-model="message.message" :style="{height: message.height + 'px'}" class="original" @input="autoResize(message, $event)"></textarea>
							<div v-else-if="message.html" v-emojis v-code class="text" v-html="message.html"></div>
							<markdown v-else :content="message.message" mode="forum" />

							<emoji-picker v-if="message.editing" class="emoji-picker" @pick="textarea && addEmoji(message, $event, textarea[0])" />

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
									<v-tooltip :key="votes_up_names[message.id] ? message.id * 101 + votes_up_names[message.id]!.length : message.id * 101" :open-delay="0" :close-delay="0" :disabled="message.votes_up === 0" bottom @update:model-value="loadVotesUp(message)">
										<template #activator="{ props }">
											<div :class="{active: message.my_vote == 1, zero: message.votes_up === 0}" class="vote up" v-bind="props" @click="voteUp(message)">
												<v-icon>mdi-thumb-up</v-icon>
												<span class="counter">{{ message.votes_up }}</span>
											</div>
										</template>
										<loader v-if="!votes_up_names[message.id]" :size="30" />
										<div v-else>
											<div v-for="name in votes_up_names[message.id]" :key="name">{{ name }}</div>
										</div>
									</v-tooltip>
									<v-tooltip :key="votes_down_names[message.id] ? message.id * 100 + votes_down_names[message.id]!.length : message.id" :open-delay="0" :close-delay="0" :disabled="message.votes_down === 0" bottom @update:model-value="loadVotesDown(message)">
										<template #activator="{ props }">
											<div :class="{active: message.my_vote == -1, zero: !message.votes_down}" class="vote down" v-bind="props" @click="voteDown(message)">
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

								<forum-topic-actions
									v-if="message.id === -1"
									:topic="topic"
									:category="category"
									:can-edit-status="!!canEditStatus"
									:has-priority="!!hasPriority"
									:status-items="statusItems"
									:priority-items="priorityItems"
									:current-status-info="currentStatusInfo"
									:creating-issue="creatingIssue"
									@lock="lock"
									@pin="pin"
									@set-status="setStatus"
									@set-priority="setPriority"
									@create-issue="createIssue"
									@open-release="openReleaseDialog"
								/>

								<v-spacer />

								<div class="date">
									<div>{{ LeekWars.formatDateTime(message.date) }}</div>
									<div v-if="message.edition_date != null">
										{{ $t('edited_the', [LeekWars.formatDateTime(message.edition_date)]) }}
									</div>
								</div>

								<v-menu v-if="$store.state.farmer && category && !message.deleted && !message.editing && ((message.writer.id === $store.state.farmer.id || category.moderator) || (category.team === -1 && message.writer.id !== $store.state.farmer.id && message.writer.color !== 'admin'))" offset-y>
									<template #activator="{ props }">
										<v-btn variant="text" density="compact" icon="mdi-dots-vertical" color="grey" v-bind="props" />
									</template>
									<v-list dense class="message-actions">
										<v-list-item v-if="$store.state.farmer && category && (message.writer.id === $store.state.farmer.id || category.moderator)" v-ripple prepend-icon="mdi-pencil" @click="edit(message)">
											<span>{{ $t('edit') }}</span>
										</v-list-item>
										<v-list-item v-if="$store.state.farmer && category && (message.id !== -1 ? (message.writer.id === $store.state.farmer.id || category.moderator) : canDeleteTopic)" v-ripple prepend-icon="mdi-delete" @click="deleteGeneric(message)">
											<span>{{ $t('delete') }}</span>
										</v-list-item>
										<v-list-item v-if="category && $store.state.farmer && category.team === -1 && message.writer.id !== $store.state.farmer.id && message.writer.color !== 'admin'" v-ripple prepend-icon="mdi-flag" @click="report(message)">
											<span>{{ $t('warning.report') }}</span>
										</v-list-item>
										<v-menu v-if="message.id === -1 && canMoveTopic" submenu open-on-hover>
											<template #activator="{ props }">
												<v-list-item v-ripple v-bind="props" prepend-icon="mdi-folder-move" append-icon="mdi-chevron-right" @click.stop>
													<span>{{ $t('move') }}</span>
												</v-list-item>
											</template>
											<v-list dense>
												<v-list-item v-for="cat in moveCategories" :key="cat.id" v-ripple @click="moveTopic(cat.id)">
													<span>{{ cat.name }}</span>
												</v-list-item>
											</v-list>
										</v-menu>
										<v-list-item v-if="message.id === -1 && $store.state.farmer && $store.state.farmer.admin" v-ripple :prepend-icon="topic.hidden ? 'mdi-eye' : 'mdi-eye-off'" @click="toggleHidden">
											<span>{{ topic.hidden ? $t('show_topic') : $t('hide_topic') }}</span>
										</v-list-item>
										<v-list-item v-if="message.id === -1 && $store.state.farmer && $store.state.farmer.admin && !topic.release" v-ripple prepend-icon="mdi-tag" @click="releaseInput = topic.release; releaseDialog = true">
											<span>{{ $t('set_release') }}</span>
										</v-list-item>
									</v-list>
								</v-menu>
							</div>

							<div v-if="message.editing" class="edit-buttons">
								<v-btn color="primary" class="confirm-edit send" :disabled="!message.message || !message.message.trim()" @click="confirmEdit(message)"><v-icon>mdi-send-outline</v-icon> {{ $t('main.send') }}</v-btn>
								<v-btn class="cancel-edit" @click="endEdit(message)">{{ $t('main.cancel') }}</v-btn>
								<span v-if="message.id == -1">
									GitHub Issue <input v-model.number="topic.issue" type="number">
								</span>
							</div>

							<formatting-rules v-if="message.editing" />
						</div>
					</div>
				</div>

				<pagination v-if="topic && category" :current="page" :total="pages" :url="'/forum/category-' + category.id + '/topic-' + topic.id" />

				<div v-if="topic && !topic.locked && $store.state.farmer && $store.state.farmer.verified" class="editor">
					<h4>{{ $t('answer') }}</h4>
					<div class="response-wrapper">
						<textarea ref="responseTextarea" v-model="newMessage" class="response card" @keyup="updateDraft"></textarea>
						<emoji-picker @pick="addEmojiNewMessage">😀</emoji-picker>
					</div>
					<div class="center">
						<div v-if="page != pages" class="warning"><v-icon>mdi-alert</v-icon> {{ $t('not_last_page') }}</div>
						<div v-if="isOldTopic" class="warning"><v-icon>mdi-alert</v-icon> {{ $t('old_topic_warning') }}</div>
						<v-btn color="primary" class="send" :disabled="!newMessage || !newMessage.trim()" @click="send"><v-icon>mdi-send-outline</v-icon> {{ $t('send') }}</v-btn>
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

		<report-dialog v-if="reportFarmer" v-model="showReport" :target="reportFarmer" :reasons="reasons" :parameter="reportContent" class="report-dialog" />
	</div>
</template>

<script setup lang="ts">
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { locale } from '@/locale'
	import { Farmer } from '@/model/farmer'
	import { ForumCategory, ForumMessage, ForumTopic, ForumTopicStatus } from '@/model/forum'
	import { i18n, mixins, useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import EmojiPicker from '../chat/emoji-picker.vue'
	import Breadcrumb from './breadcrumb.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import ForumTopicActions from '@/component/forum/forum-topic-actions.vue'
	import Pagination from '@/component/pagination.vue'
	import LwTitle from '@/component/title/title.vue'
	import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'

	const ReportDialog = defineAsyncComponent(() => import('@/component/moderation/report-dialog.vue'))
	const FormattingRules = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/forum/forum-formatting-rules.${locale}.i18n`))

	defineOptions({ name: 'ForumTopic', i18n: {}, mixins: [...mixins] })

	const { locale: i18nLocale } = useI18n()
	const t = useNamespacedT('forum_topic')
	const route = useRoute()
	const router = useRouter()
	const topicTitle = useTemplateRef<HTMLElement>('topicTitle')
	const responseTextarea = useTemplateRef<HTMLTextAreaElement>('responseTextarea')
	const textarea = useTemplateRef<HTMLTextAreaElement[]>('textarea')

	const topic = ref<ForumTopic | null>(null)
	const category = ref<ForumCategory | null>(null)
	const page = ref(0)
	const pages = ref(0)
	const votes_up_names = reactive<{[key: number]: string[] | null}>({})
	const votes_down_names = reactive<{[key: number]: string[] | null}>({})
	const deleteTopicDialog = ref(false)
	const deleteMessageDialog = ref(false)
	const toDeleteMessage = ref<ForumMessage | null>(null)
	const newMessage = ref('')
	const topicEditing = ref(false)
	const action = { icon: 'mdi-newspaper-plus', click: () => toggleSubscribe() }
	const sendingMessage = ref(false)
	const oldTopicDialog = ref(false)
	const creatingIssue = ref(false)
	const forumLanguages = ref<string[]>([])
	const notFound = ref(false)
	const showReport = ref(false)
	const reportFarmer = ref<Farmer | null>(null)
	const reportContent = ref('')
	const moveCategories = ref<{id: number, name: string}[]>([])
	const releaseDialog = ref(false)
	const releaseInput = ref<number | null>(null)

	// On répète la barre en haut quand le 1er POST lui-même dépasse la hauteur de l'écran :
	// sa barre du bas est alors hors écran et il faut scroller pour l'atteindre. On mesure
	// la hauteur réelle du post original (pas la liste entière : un topic multi-pages avec
	// un OP court ne doit pas afficher deux barres collées), et on re-mesure via
	// ResizeObserver pour prendre en compte le chargement asynchrone des images. #4154
	const opEl = ref<HTMLElement | null>(null)
	const contentTall = ref(false)
	function setOpEl(el: HTMLElement | null) {
		if (resizeObserver) {
			if (opEl.value) resizeObserver.unobserve(opEl.value)
			if (el) resizeObserver.observe(el)
		}
		opEl.value = el
		measureTall()
	}
	function measureTall() {
		contentTall.value = !!opEl.value && opEl.value.scrollHeight > window.innerHeight
	}
	const longTopic = computed(() => contentTall.value)
	let resizeObserver: ResizeObserver | null = null
	onMounted(() => {
		resizeObserver = new ResizeObserver(() => measureTall())
		if (opEl.value) resizeObserver.observe(opEl.value)
		window.addEventListener('resize', measureTall)
	})
	onBeforeUnmount(() => {
		resizeObserver?.disconnect()
		window.removeEventListener('resize', measureTall)
	})

	const hasPriority = computed(() => category.value && (category.value.name === 'bug_reports' || category.value.name === 'suggestions_ideas'))
	const priorityItems = computed(() => [
		{ value: 0, title: t('priority_none') as string, icon: 'mdi-flag-outline', color: '' },
		{ value: 1, title: t('priority_high') as string, icon: 'mdi-flag', color: '#e53935' },
		{ value: 2, title: t('priority_medium') as string, icon: 'mdi-flag', color: '#fb8c00' },
		{ value: 3, title: t('priority_low') as string, icon: 'mdi-flag', color: '#757575' },
	])

	const reasons = [
		Warning.RUDE_FORUM,
		Warning.FLOOD_FORUM,
		Warning.PROMO_FORUM,
		Warning.INCORRECT_FARMER_NAME,
		Warning.INCORRECT_AVATAR,
	]

	const releaseVersion = computed(() => {
		if (!topic.value || !topic.value.release) { return '' }
		return 'v' + String(topic.value.release).charAt(0) + '.' + String(topic.value.release).slice(1)
	})

	const categoryName = computed(() => category.value ? (category.value.team > 0 ? category.value.name : t('forum-category.' + category.value.name)) : '')

	const breadcrumb_items = computed(() => [
		{name: t('main.forum'), link: '/forum'},
		{name: categoryName.value, link: '/forum/category-' + (category.value ? category.value.id : 0)},
		{name: topic.value ? topic.value.name : '...', link: '/forum-category-' + (category.value ? category.value.id : 0) + '/topic-' + (topic.value ? topic.value.id : 0)}
	])

	let cleanupPasteProtect: (() => void) | null = null
	onMounted(() => {
		if (topicTitle.value) {
			cleanupPasteProtect = LeekWars.contenteditable_paste_protect(topicTitle.value)
		}
	})
	onBeforeUnmount(() => cleanupPasteProtect?.())

	watch(() => route.params, () => update(), { immediate: true })

	function update(force: boolean = false) {
		const t_id = parseInt(route.params.topic as string, 10)
		const p = 'page' in route.params ? parseInt(route.params.page as string, 10) : 1
		if (!force && topic.value && topic.value.id === t_id && page.value === p) {
			emitter.emit('loaded')
			return
		}
		page.value = p

		if (topic.value) { topic.value.messages = null }
		notFound.value = false
		forumLanguages.value = (localStorage.getItem('forum/languages') as string || i18nLocale.value).split(',')
		LeekWars.get('forum/get-messages/' + t_id + '/' + forumLanguages.value + '/' + page.value).then(data => {
			topic.value = data.topic
			if (!topic.value) { return }
			category.value = data.category
			if (topic.value) {
				topic.value.messages = data.messages
				if (topic.value.messages) {
					for (const message of topic.value.messages) {
						message.editing = false
					message.height = 100
					}
				}
			}
			pages.value = data.pages
			LeekWars.setTitle(topic.value.name, t('n_messages', [data.total]))
			LeekWars.setActions([action])
			if (topic.value.subscribed) { action.icon = 'mdi-newspaper-minus' }
			emitter.emit('loaded')
			newMessage.value = localStorage.getItem('forum/draft-' + topic.value.id) as string
			if (canMoveTopic.value) {
				loadMoveCategories()
			}
		}).error(() => {
			notFound.value = true
			emitter.emit('loaded')
		})
	}

	function createIssue() {
		if (!topic.value || creatingIssue.value) { return }
		creatingIssue.value = true
		LeekWars.post('forum/create-issue', {topic_id: topic.value.id}).then((data) => {
			if (topic.value) {
				topic.value.private_issue = data.private_issue
			}
			creatingIssue.value = false
		})
	}

	const canMoveTopic = computed(() => {
		if (!category.value || !store.state.farmer) { return false }
		if (category.value.team !== -1 || category.value.name === 'admin' || category.value.name === 'moderation') { return false }
		return category.value.moderator || topic.value?.owner === store.state.farmer.id
	})

	const canEditStatus = computed(() => store.state.connected && ((store.state.farmer && topic.value?.owner === store.state.farmer.id) || category.value?.moderator))

	const canDeleteTopic = computed(() => {
		if (!category.value || !store.state.farmer) { return false }
		if (category.value.moderator) { return true }
		return topic.value?.owner === store.state.farmer.id && pages.value <= 1 && topic.value?.messages?.length === 1
	})

	const allStatuses = computed<{[key: number]: {title: string, value: ForumTopicStatus, icon: string, color: string}}>(() => ({
		[ForumTopicStatus.OPEN]: { title: t('status_open') as string, value: ForumTopicStatus.OPEN, icon: 'mdi-circle-outline', color: 'grey' },
		[ForumTopicStatus.RESOLVED]: { title: t('status_resolved') as string, value: ForumTopicStatus.RESOLVED, icon: 'mdi-check-circle', color: 'green' },
		[ForumTopicStatus.NOT_REPRODUCED]: { title: t('status_not_reproduced') as string, value: ForumTopicStatus.NOT_REPRODUCED, icon: 'mdi-help-circle', color: 'orange' },
		[ForumTopicStatus.NOT_PLANNED]: { title: t('status_not_planned') as string, value: ForumTopicStatus.NOT_PLANNED, icon: 'mdi-minus-circle', color: 'grey' },
		[ForumTopicStatus.NOT_A_BUG]: { title: t('status_not_a_bug') as string, value: ForumTopicStatus.NOT_A_BUG, icon: 'mdi-close-circle', color: 'grey' },
		[ForumTopicStatus.OBSOLETE]: { title: t('status_obsolete') as string, value: ForumTopicStatus.OBSOLETE, icon: 'mdi-archive', color: 'grey' },
	}))

	const currentStatusInfo = computed(() => topic.value ? allStatuses.value[topic.value.status] : null)

	const statusItems = computed(() => {
		const items = [allStatuses.value[ForumTopicStatus.OPEN], allStatuses.value[ForumTopicStatus.RESOLVED]]
		if (category.value?.moderator) {
			const isBug = category.value?.name === 'bug_reports'
			const isSuggestion = category.value?.name === 'suggestions_ideas'
			if (isBug) {
				items.push(allStatuses.value[ForumTopicStatus.NOT_REPRODUCED])
				items.push(allStatuses.value[ForumTopicStatus.NOT_A_BUG])
			}
			if (isSuggestion) {
				items.push(allStatuses.value[ForumTopicStatus.NOT_PLANNED])
				items.push(allStatuses.value[ForumTopicStatus.OBSOLETE])
			}
		}
		return items
	})

	function setStatus(status: ForumTopicStatus) {
		if (!topic.value) { return }
		LeekWars.post('forum/set-topic-status', {topic_id: topic.value.id, status})
		topic.value.status = status
	}

	function lock() {
		if (!topic.value) { return }
		const service = topic.value.locked ? 'forum/unlock-topic' : 'forum/lock-topic'
		LeekWars.post(service, {topic_id: topic.value.id})
		topic.value.locked = !topic.value.locked
	}

	function pin() {
		if (!topic.value) { return }
		const service = topic.value.pinned ? 'forum/unpin-topic' : 'forum/pin-topic'
		LeekWars.post(service, {topic_id: topic.value.id})
		topic.value.pinned = !topic.value.pinned
	}

	function vote(message: ForumMessage, v: number) {
		if (!topic.value) { return Promise.resolve() }
		const method = ['vote-message-down', 'remove-message-vote', 'vote-message-up'][v + 1]
		return LeekWars.post('forum/' + method, {topic_id: topic.value.id, message_id: message.id})
	}

	// Invalidate the cached voters list AFTER the vote POST resolves. Otherwise the
	// optimistic counter update and a hover-triggered names fetch can race: the GET
	// can land before the server has applied the POST, returning stale names that
	// disagree with the freshly-bumped counter.
	function invalidateVotesAfter(message: ForumMessage, votePromise: Promise<unknown>) {
		votePromise.finally(() => {
			delete votes_up_names[message.id]
			delete votes_down_names[message.id]
		})
	}

	function voteUp(message: ForumMessage) {
		if (message.my_vote === 1) {
			invalidateVotesAfter(message, vote(message, 0))
			message.votes_up--
			message.my_vote = 0
		} else {
			invalidateVotesAfter(message, vote(message, 1))
			message.votes_up++
			if (message.my_vote === -1) {
				message.votes_down--
			}
			message.my_vote = 1
		}
	}

	function voteDown(message: ForumMessage) {
		if (message.my_vote === -1) {
			invalidateVotesAfter(message, vote(message, 0))
			message.votes_down--
			message.my_vote = 0
		} else {
			invalidateVotesAfter(message, vote(message, -1))
			message.votes_down++
			if (message.my_vote === 1) {
				message.votes_up--
			}
			message.my_vote = -1
		}
	}

	function loadVotesUp(message: ForumMessage) {
		if (!topic.value || votes_up_names[message.id] !== undefined) { return }
		votes_up_names[message.id] = null
		LeekWars.post('forum/get-message-up-votes-names', {topic_id: topic.value.id, message_id: message.id}).then(data => {
			votes_up_names[message.id] = data.farmers.map((f: unknown[]) => f[1])
		})
	}

	function loadVotesDown(message: ForumMessage) {
		if (!topic.value || votes_down_names[message.id] !== undefined) { return }
		votes_down_names[message.id] = null
		LeekWars.post('forum/get-message-down-votes-names', {topic_id: topic.value.id, message_id: message.id}).then(data => {
			votes_down_names[message.id] = data.farmers.map((f: unknown[]) => f[1])
		})
	}

	function deleteGeneric(message: ForumMessage) {
		if (message.id === -1) {
			deleteTopicDialog.value = true
		} else {
			toDeleteMessage.value = message
			deleteMessageDialog.value = true
		}
	}

	function deleteMessage() {
		if (!toDeleteMessage.value) { return }
		LeekWars.delete("forum/delete-message", {message_id: toDeleteMessage.value.id}).then(() => {
			if (toDeleteMessage.value) {
				toDeleteMessage.value = null
				deleteMessageDialog.value = false
				update(true)
			}
		})
	}

	function deleteTopic() {
		if (!topic.value) { return }
		LeekWars.delete("forum/delete-topic", {topic_id: topic.value.id}).then(() => {
			if (category.value) {
				deleteTopicDialog.value = false
				router.push("/forum/category-" + category.value.id)
			}
		})
	}

	function loadMoveCategories() {
		if (!category.value) { return }
		const languages = forumLanguages.value.join(',')
		LeekWars.get('forum/get-categories/' + languages).then((data) => {
			moveCategories.value = data.categories
				.filter((c: ForumCategory) => c.id !== category.value!.id && c.type !== 'team' && c.name !== 'admin' && c.name !== 'moderation')
				.map((c: ForumCategory) => ({
					id: c.id,
					name: t('forum-category.' + c.name) as string
				}))
		})
	}

	function moveTopic(categoryId: number) {
		if (!topic.value) { return }
		LeekWars.post('forum/move-topic', {topic_id: topic.value.id, category_id: categoryId}).then(() => {
			router.push('/forum/category-' + categoryId + '/topic-' + topic.value!.id)
			category.value!.id = categoryId
		})
	}

	function updateDraft() {
		localStorage.setItem('forum/draft-' + topic.value!.id, newMessage.value)
	}

	function send() {
		if (!topic.value || sendingMessage.value) { return }
		if (!newMessage.value || !newMessage.value.trim()) { return }
		if (isOldTopic.value && !oldTopicDialog.value) {
			oldTopicDialog.value = true
			return
		}
		oldTopicDialog.value = false
		sendingMessage.value = true
		LeekWars.post("forum/post-message", {topic_id: topic.value.id, message: newMessage.value}).then(() => {
			localStorage.removeItem('forum/draft-' + topic.value!.id)
			newMessage.value = ''
			update(true)
			sendingMessage.value = false
		})
	}

	function toggleSubscribe() {
		if (!topic.value) { return }
		if (topic.value.subscribed) { unsubscribe() } else { subscribe() }
	}

	function subscribe() {
		if (!topic.value) { return }
		LeekWars.post('forum/subscribe-topic', {topic_id: topic.value.id})
		topic.value.subscribed = true
		action.icon = 'mdi-newspaper-minus'
		LeekWars.toast(i18n.t('notifications_on') as string)
	}

	function unsubscribe() {
		if (!topic.value) { return }
		LeekWars.post('forum/unsubscribe-topic', {topic_id: topic.value.id})
		topic.value.subscribed = false
		action.icon = 'mdi-newspaper-plus'
		LeekWars.toast(i18n.t('notifications_off') as string)
	}

	function edit(message: ForumMessage) {
		const textElement = document.querySelector('#message-' + message.id + ' .text, #message-' + message.id + ' .md') as HTMLElement
		if (textElement) {
			message.height = textElement.offsetHeight - 14
		}
		message.editing = true
		if (message.id === -1) {
			topicEditing.value = true
		}
	}

	function autoResize(message: ForumMessage, e: Event) {
		const textarea = e.target as HTMLTextAreaElement
		if (textarea.scrollHeight > message.height) {
			message.height = textarea.scrollHeight
		}
	}

	function endEdit(message: ForumMessage) {
		message.editing = false
		if (message.id === -1) {
			topicEditing.value = false
		}
	}

	function confirmEdit(message: ForumMessage) {
		if (!topic.value) { return }
		if (!message.message || !message.message.trim()) { return }
		const callback = () => {
			message.html = null
			message.editing = false
			message.edition_date = LeekWars.time
			if (message.id === -1) {
				topicEditing.value = false
			}
		}
		if (message.id !== -1) {
			LeekWars.post("forum/edit-message", {message_id: message.id, new_message: message.message}).then(callback)
		} else {
			const input = topicTitle.value
			if (!input) return
			const title = input.innerText
			LeekWars.post("forum/edit-topic", {
				topic_id: topic.value.id,
				title,
				message: message.message,
				issue: topic.value.issue || 0,
				release: topic.value.release || 0,
			}).then(callback)
		}
	}

	function addEmoji(message: ForumMessage, emoji: string, textarea: HTMLTextAreaElement) {
		const index = textarea.selectionStart
		message.message = message.message.slice(0, index) + emoji + message.message.slice(index, message.message.length)
	}

	function addEmojiNewMessage(emoji: string) {
		const textarea = responseTextarea.value
		if (!textarea) return
		const index = textarea.selectionStart
		const text = newMessage.value || ''
		newMessage.value = text.slice(0, index) + emoji + text.slice(index)
		nextTick(() => {
			textarea.focus()
			textarea.selectionStart = textarea.selectionEnd = index + emoji.length
		})
	}

	function toggleHidden() {
		if (!topic.value) { return }
		LeekWars.post('forum/toggle-hidden', {topic_id: topic.value.id}).then((data) => {
			if (topic.value) {
				topic.value.hidden = data.hidden
			}
		})
	}

	function setRelease() {
		if (!topic.value) { return }
		LeekWars.post('forum/set-release', {topic_id: topic.value.id, release: releaseInput.value || 0}).then(() => {
			if (topic.value) {
				topic.value.release = releaseInput.value || null
				releaseDialog.value = false
			}
		})
	}

	function setPriority(priority: number) {
		if (!topic.value) { return }
		LeekWars.post('forum/set-topic-priority', {topic_id: topic.value.id, priority})
		topic.value.priority = priority
	}

	// Ouvre le dialogue de release (déclenché depuis forum-topic-actions). #4154
	function openReleaseDialog() {
		if (!topic.value) { return }
		releaseInput.value = topic.value.release
		releaseDialog.value = true
	}

	const isOldTopic = computed(() => {
		if (!topic.value || !topic.value.last_message_date) { return false }
		const oneYearAgo = (Date.now() / 1000) - 365 * 24 * 3600
		return topic.value.last_message_date < oneYearAgo
	})

	function report(message: ForumMessage) {
		reportFarmer.value = message.writer
		reportContent.value = message.id === -1 ? 't' + topic.value!.id : 'm' + message.id
		showReport.value = true
	}
</script>


<style lang="scss" scoped>
	.not-found {
		padding: 40px;
		text-align: center;
		font-size: 18px;
		color: #888;
	}
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
	.bottom {
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
	// Barre d'actions répétée en haut du 1er post (#4154) : marge sous la barre pour la
	// séparer du contenu du post.
	.topic-bar-top {
		margin-top: 0;
		margin-bottom: 16px;
	}
	:global(.v-list-item__prepend .v-icon.status-icon) {
		opacity: 1 !important;
	}
	:global(.v-list-item__prepend .v-icon) {
		opacity: 1 !important;
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
</style>