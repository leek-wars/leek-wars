<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
				</h1>
				<v-menu offset-y>
					<template #activator="{ props }">
						<div class="forum-language info" v-bind="props">
							<flag v-for="l in activeLanguages" :key="l" :code="LeekWars.languages[l].country" :clickable="false" />
							<img width="10" src="/image/selector.png">
						</div>
					</template>
					<v-list>
						<v-list-item v-for="(language, i) in languages" :key="i" class="language" @click="setForumLanguage(language)" :disabled="forumLanguages[language.code] && activeLanguages.length === 1">
							<template #prepend>
								<v-list-item-action start>
									<v-checkbox v-model="forumLanguages[language.code]" :disabled="forumLanguages[language.code] && activeLanguages.length === 1" hide-details @click.stop @update:model-value="updateCategories" />
								</v-list-item-action>
							</template>
							<div class="flex">
								<flag :code="language.country" :clickable="false" />
								<span class="name">{{ language.name }}</span>
							</div>
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
			<template #content>
				<div class="content">
				<div class="flex breadcrumb-sort">
					<breadcrumb v-if="LeekWars.mobile" :items="breadcrumb_items" />
					<pagination v-if="categories && topics && topics.length" :current="page" :total="pages" :url="'/forum/category-' + category_ids" />
					<div class="toolbar-right">
						<v-menu :close-on-content-click="false">
							<template #activator="{ props }">
								<v-btn v-bind="props" icon density="comfortable" class="filter-btn" :class="{active: activeFilterCount > 0}">
									<v-badge v-if="activeFilterCount" :content="activeFilterCount" color="primary" floating>
										<v-icon size="small">mdi-filter</v-icon>
									</v-badge>
									<v-icon v-else size="small">mdi-filter-outline</v-icon>
								</v-btn>
							</template>
							<v-list density="compact" class="filter-list">
								<v-list-subheader><v-icon size="x-small" class="filter-icon">mdi-email</v-icon>{{ $t('filter_read') }}</v-list-subheader>
								<v-list-item v-for="r in readFilterItems" :key="r.value" density="compact" @click="filterRead = r.value; saveFilters()">
									<template #prepend>
										<v-list-item-action start>
											<v-radio :model-value="filterRead" :value="r.value" density="compact" hide-details @click.stop @update:model-value="filterRead = r.value; saveFilters()" />
										</v-list-item-action>
									</template>
									<span>{{ r.title }}</span>
								</v-list-item>
								<v-divider class="my-1" />
								<v-list-subheader><v-icon size="x-small" class="filter-icon">mdi-checkbox-marked-circle-outline</v-icon>{{ $t('filter_status') }}</v-list-subheader>
								<v-list-item density="compact" @click="filterStatus = []; saveFilters()">
									<template #prepend>
										<v-list-item-action start>
											<v-checkbox :model-value="filterStatus.length === 0" density="compact" hide-details @click.stop @update:model-value="filterStatus = []; saveFilters()" />
										</v-list-item-action>
									</template>
									<span>{{ $t('filter_all') }}</span>
								</v-list-item>
								<v-list-item v-for="s in statusFilterItems" :key="s.value" density="compact" @click="toggleStatusFilter(s.value)">
									<template #prepend>
										<v-list-item-action start>
											<v-checkbox :model-value="filterStatus.includes(s.value)" density="compact" hide-details @click.stop @update:model-value="toggleStatusFilter(s.value)" />
										</v-list-item-action>
									</template>
									<v-icon v-if="s.icon" size="small" :class="s.iconClass" class="filter-item-icon">{{ s.icon }}</v-icon>
									<span>{{ s.title }}</span>
								</v-list-item>
								<v-divider class="my-1" />
								<v-list-subheader><v-icon size="x-small" class="filter-icon">mdi-eye</v-icon>{{ $t('filter_acknowledged') }}</v-list-subheader>
								<v-list-item v-for="a in acknowledgedFilterItems" :key="a.value" density="compact" @click="filterAcknowledged = a.value; saveFilters()">
									<template #prepend>
										<v-list-item-action start>
											<v-radio :model-value="filterAcknowledged" :value="a.value" density="compact" hide-details @click.stop @update:model-value="filterAcknowledged = a.value; saveFilters()" />
										</v-list-item-action>
									</template>
									<span>{{ a.title }}</span>
								</v-list-item>
								<v-divider class="my-1" />
								<v-list-subheader><v-icon size="x-small" class="filter-icon">mdi-lock</v-icon>{{ $t('filter_locked') }}</v-list-subheader>
								<v-list-item v-for="l in lockedFilterItems" :key="l.value" density="compact" @click="filterLocked = l.value; saveFilters()">
									<template #prepend>
										<v-list-item-action start>
											<v-radio :model-value="filterLocked" :value="l.value" density="compact" hide-details @click.stop @update:model-value="filterLocked = l.value; saveFilters()" />
										</v-list-item-action>
									</template>
									<span>{{ l.title }}</span>
								</v-list-item>
								<template v-if="isBugCategory || isSuggestionCategory">
								<v-divider class="my-1" />
								<v-list-subheader><v-icon size="x-small" class="filter-icon">mdi-flag</v-icon>{{ $t('filter_priority') }}</v-list-subheader>
								<v-list-item density="compact" @click="filterPriority = []; saveFilters()">
									<template #prepend>
										<v-list-item-action start>
											<v-checkbox :model-value="filterPriority.length === 0" density="compact" hide-details @click.stop @update:model-value="filterPriority = []; saveFilters()" />
										</v-list-item-action>
									</template>
									<span>{{ $t('filter_all') }}</span>
								</v-list-item>
								<v-list-item v-for="p in priorityFilterItems" :key="p.value" density="compact" @click="togglePriorityFilter(p.value)">
									<template #prepend>
										<v-list-item-action start>
											<v-checkbox :model-value="filterPriority.includes(p.value)" density="compact" hide-details @click.stop @update:model-value="togglePriorityFilter(p.value)" />
										</v-list-item-action>
									</template>
									<v-icon v-if="p.icon" size="small" :class="p.iconClass" class="filter-item-icon">{{ p.icon }}</v-icon>
									<span>{{ p.title }}</span>
								</v-list-item>
								</template>
								<v-divider v-if="activeFilterCount" class="my-1" />
								<v-list-item v-if="activeFilterCount" density="compact" @click="clearFilters">
									<template #prepend>
										<v-icon size="small">mdi-close</v-icon>
									</template>
									<span>{{ $t('clear_filters') }}</span>
								</v-list-item>
							</v-list>
						</v-menu>
						<v-select v-model="order" :items="orderItems" item-value="value" item-title="title" hide-details density="compact" variant="solo" class="order-select">
							<template #selection="{ item }">
								<v-icon size="small">{{ item.raw.icon }}</v-icon>&nbsp;{{ item.raw.title }}
							</template>
							<template #item="{ props, item }">
								<v-list-item v-bind="props">
									<template #prepend>
										<v-icon size="small">{{ item.raw.icon }}</v-icon>
									</template>
								</v-list-item>
							</template>
						</v-select>
					</div>
				</div>

				<template v-if="!categories || !topics">
					<loader />
				</template>
				<template v-else-if="topics.length === 0 && !loading">
					<div class="empty-state">
						<v-icon size="64" color="grey">mdi-forum-outline</v-icon>
						<div class="empty-title">{{ $t('no_topics') }}</div>
						<div v-if="activeFilterCount" class="empty-subtitle">{{ $t('no_topics_filters') }}</div>
						<v-btn v-if="activeFilterCount" variant="text" color="primary" @click="clearFilters">{{ $t('clear_filters') }}</v-btn>
					</div>
				</template>
				<template v-else>
				<div v-if="!LeekWars.mobile" class="topic header forum-header">
					<div class="seen"></div>
					<div>{{ $t('topic') }}</div>
					<div class="num-views">{{ $t('main.views') }}</div>
					<div class="num-messages">{{ $t('messages') }}</div>
					<div class="last-message">{{ $t('last') }}</div>
				</div>

				<div class="topics" :class="{loading}">
					<div v-if="loading" class="loading-overlay"><loader /></div>
					<div v-for="topic in topics" :key="topic.id" :class="{pinned: topic.pinned}" class="topic">
						<div class="seen">
							<img v-if="topic.seen" class="seen" src="/image/forum_seen.png">
							<img v-else src="/image/forum_unseen.png">
						</div>
						<div>
							<span v-ripple class="title">
								<v-icon v-if="topic.status === ForumTopicStatus.RESOLVED" :title="$t('status_resolved')" class="attr resolved">mdi-check-circle</v-icon>
								<v-icon v-if="topic.status === ForumTopicStatus.NOT_REPRODUCED" :title="$t('status_not_reproduced')" class="attr not-reproduced">mdi-help-circle</v-icon>
								<v-icon v-if="topic.status === ForumTopicStatus.NOT_PLANNED" :title="$t('status_not_planned')" class="attr not-planned">mdi-minus-circle</v-icon>
								<v-icon v-if="topic.status === ForumTopicStatus.NOT_A_BUG" :title="$t('status_not_a_bug')" class="attr not-a-bug">mdi-close-circle</v-icon>
								<v-icon v-if="topic.status === ForumTopicStatus.OBSOLETE" :title="$t('status_obsolete')" class="attr obsolete">mdi-archive</v-icon>
								<v-icon v-if="topic.closed" :title="$t('locked')" class="attr">mdi-lock</v-icon>
								<v-icon v-if="topic.pinned" :title="$t('pinned')" class="attr">mdi-pin</v-icon>
								<v-icon v-if="topic.acknowledged && !topic.private_issue" :title="$t('status_acknowledged')" class="attr acknowledged">mdi-eye</v-icon>
								<a v-if="topic.issue" :href="'https://github.com/leek-wars/leek-wars/issues/' + topic.issue" class="attr issue" target="_blank" rel="noopener">
									#{{ topic.issue }}
								</a>
								<a v-if="topic.private_issue && $store.state.farmer && $store.state.farmer.admin" :href="'https://github.com/5pilow/leek-wars/issues/' + topic.private_issue" class="attr issue private-issue" target="_blank" rel="noopener">
									#{{ topic.private_issue }}
								</a>
								<v-icon v-if="topic.hidden" :title="$t('hidden_topic')" class="attr hidden-icon">mdi-eye-off</v-icon>
								<v-icon v-if="topic.priority === 1" :title="$t('priority_high')" class="attr priority-flag priority-high">mdi-flag</v-icon>
								<v-icon v-if="topic.priority === 2" :title="$t('priority_medium')" class="attr priority-flag priority-medium">mdi-flag</v-icon>
								<v-icon v-if="topic.priority === 3" :title="$t('priority_low')" class="attr priority-flag priority-low">mdi-flag</v-icon>
								<span v-if="topic.release" class="attr release-badge">v{{ String(topic.release).charAt(0) + '.' + String(topic.release).slice(1) }}</span>
								<router-link :to="'/forum/category-' + topic.category + '/topic-' + topic.id">{{ topic.title }}</router-link>
								<flag v-if="activeLanguages.length >= 2 && topic.lang" :code="LeekWars.languages[topic.lang].country" :clickable="false" />
							</span>
							<div class="description grey">
								<i18n-t keypath="by_x_the_d">
									<template #farmer>
										<router-link v-if="topic.author.name!=''" :to="'/farmer/' + topic.author.id">
											<rich-tooltip-farmer :id="topic.author.id" v-slot="{ props }">
												<span v-bind="props">{{ topic.author.name }}</span>
											</rich-tooltip-farmer>
										</router-link>
										<span v-else class="farmer deleted">{{ $t('main.farmer') }}@{{ topic.author.id }}</span>
									</template>
									<template #date>{{ $filters.date(topic.date) }}</template>
								</i18n-t>
								<div v-if="topic.votes_up !== 0 || topic.votes_down !== 0" class="votes">
									<div :class="{zero: topic.votes_up === 0}" class="vote up">
										<v-icon>mdi-thumb-up</v-icon>
										<span class="counter">{{ topic.votes_up }}</span>
									</div>
									<div :class="{zero: !topic.votes_down}" class="vote down">
										<v-icon>mdi-thumb-down</v-icon>
										<span class="counter">{{ topic.votes_down }}</span>
									</div>
								</div>
							</div>
							<div v-if="LeekWars.mobile" class="description grey">
								<span class="messages"><v-icon>mdi-eye-outline</v-icon> {{ topic.views }} • <v-icon>mdi-message-outline</v-icon> {{ topic.messages }} • </span>
								<i18n-t v-if="LeekWars.mobile" tag="span" keypath="last_message">
									<template #date>
										<span>{{ LeekWars.formatDuration(topic.last_message_date) }}</span>
									</template>
									<template #farmer>
										<router-link :to="'/forum/category-' + topic.category + '/topic-' + topic.id + '/page-' + topic.last_message_page + '#message-' + topic.last_message_id">
											<span v-if="topic.last_message_writer!=''">{{ topic.last_message_writer }}</span>
											<span v-else class="farmer deleted">{{ $t('main.farmer') }}@{{ topic.last_message_writer_id }} </span>
										</router-link>
									</template>
								</i18n-t>
								<router-link :to="'/forum/category-' + topic.category + '/topic-' + topic.id + '/page-' + topic.last_message_page + '#message-' + topic.last_message_id" class="goto">►</router-link>
							</div>
						</div>
						<div v-if="!LeekWars.mobile" class="num-views">{{ topic.views }}</div>
						<div v-if="!LeekWars.mobile" class="num-messages">{{ topic.messages }}</div>
						<div v-if="!LeekWars.mobile" class="last-message grey">
							<div>
								<span>{{ LeekWars.formatDuration(topic.last_message_date) }}</span>
								<i18n-t tag="div" keypath="last_by_x">
									<template #author>
										<router-link :to="'/forum/category-' + topic.category + '/topic-' + topic.id + '/page-' + topic.last_message_page + '#message-' + topic.last_message_id">
											<rich-tooltip-farmer v-if="topic.last_message_writer!=''" :id="topic.last_message_writer_id" v-slot="{ props }">
												<span v-bind="props">{{ topic.last_message_writer }}</span>
											</rich-tooltip-farmer>
											<span v-else class="farmer deleted">{{ $t('main.farmer') }}@{{ topic.last_message_writer_id }} </span>
											►
										</router-link>
									</template>
								</i18n-t>
							</div>
						</div>
					</div>
				</div>
				<pagination v-if="categories && topics && topics.length" :current="page" :total="pages" :url="'/forum/category-' + category_ids" />
				<breadcrumb :items="breadcrumb_items" />
				</template>
				</div>
			</template>
		</panel>

		<div class="page-footer page-bar">
			<div class="tabs">
				<div class="tab" @click="markAsReadDialog = true">
					<v-icon>mdi-email-open</v-icon>
					<span class="report-button">{{ $t('mark_as_read') }}</span>
				</div>
			</div>
		</div>

		<popup v-model="createDialog" :width="800">
			<template #icon>
				<v-icon>mdi-comment-edit</v-icon>
			</template>
			<template #title>
				{{ $t('create_topic') }}
			</template>
			<div class="create-popup">
				<h3>{{ $t('new_topic_title') }}</h3>
				<input v-model="createTitle" @keyup="updateDraftTitle" class="topic-name card" type="text">
				<h3>{{ $t('new_topic_message') }}</h3>
				<textarea v-model="createMessage" @keyup="updateDraft" class="topic-message card"></textarea>

				<div class="grid">
					<v-radio-group v-if="Object.values(forumLanguages).length > 1" v-model="createMessageLang" hide-details>
						<v-radio v-for="(_, lang) in forumLanguages" :key="lang" :value="lang" :label="LeekWars.languages[lang].name" />
					</v-radio-group>
					<template v-if="$store.state.farmer && $store.state.farmer.admin">
						<div>
							<v-text-field v-model.number="createRelease" label="Release" type="number" placeholder="245" hide-details variant="outlined" density="compact" />
						</div>
						<v-checkbox v-model="createHidden" :label="$t('hidden_topic')" hide-details />
					</template>
				</div>
				<formatting-rules />
				<div v-if="isBugCategory" class="user-agent-notice">
					<v-icon size="small">mdi-information-outline</v-icon>
					{{ $t('bug_user_agent_notice') }}
					<span class="user-agent-value">{{ LeekWars.parseUserAgent(userAgent) }}</span>
				</div>
			</div>
			<template #actions>
				<div v-ripple class="action" @click="createDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="action green" :class="{disabled: !createTitle || !createTitle.trim() || !createMessage || !createMessage.trim()}" @click="create">{{ $t('create_topic') }}</div>
			</template>
		</popup>

		<popup v-model="markAsReadDialog" :width="500" :title="$t('mark_as_read')">
			<template #icon>
				<v-icon>mdi-email-open</v-icon>
			</template>
			{{ $t('mark_as_read_text') }}
			<template #actions>
				<div v-ripple class="action" @click="markAsReadDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="action green" @click="markAsRead">{{ $t('mark_as_read') }}</div>
			</template>
		</popup>
	</div>
</template>

<script lang="ts" setup>
	import { locale } from '@/locale'
	import type { ForumCategory } from '@/model/forum'
	import { ForumTopicStatus } from '@/model/forum'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { type Language, LeekWars } from '@/model/leekwars'
	import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import Breadcrumb from './breadcrumb.vue'
	const FormattingRules = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/forum/forum-formatting-rules.${locale}.i18n`))
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import Pagination from '@/component/pagination.vue'
	import { emitter } from '@/model/vue'

	defineOptions({ name: 'forum_category', i18n: {}, mixins: [...mixins] })

	const { locale: i18nLocale } = useI18n()
	const t = useNamespacedT('forum_category')
	const route = useRoute()
	const router = useRouter()

	const categories = ref<ForumCategory[] | null>(null)
	const rawCategoryName = ref('')
	const loading = ref(false)
	const topics = ref<any[] | null>(null)
	const page = ref(0)
	const pages = ref(0)
	const createDialog = ref(false)
	const createTitle = ref('')
	const createMessage = ref('')
	const query = ref('')
	const createMessageLang = ref('fr')
	const markAsReadDialog = ref(false)
	const createRelease = ref<number | null>(null)
	const createHidden = ref(false)
	const forumLanguages = reactive<{[key: string]: boolean}>({})
	const translations = ref<any[]>([])
	const order = ref(localStorage.getItem('forum/topic-order') || 'date')
	const filterStatus = ref<number[]>([])
	const filterAcknowledged = ref('all')
	const filterLocked = ref('all')
	const filterPriority = ref<number[]>([])
	const filterRead = ref('all')
	const userAgent = ref(navigator.userAgent)
	let lastCategoryKey: string | null = null

	const isBugCategory = ref(false)
	const isSuggestionCategory = ref(false)
	watch(rawCategoryName, () => {
		isBugCategory.value = rawCategoryName.value === 'bug_reports'
		isSuggestionCategory.value = rawCategoryName.value === 'suggestions_ideas'
	})

	const statusFilterItems = computed<{ value: number, title: string, icon?: string, iconClass?: string }[]>(() => {
		const items: { value: number, title: string, icon?: string, iconClass?: string }[] = [
			{ value: ForumTopicStatus.OPEN, title: t('status_open') as string },
			{ value: ForumTopicStatus.RESOLVED, title: t('status_resolved') as string, icon: 'mdi-check-circle', iconClass: 'resolved' },
		]
		if (isBugCategory.value) {
			items.push({ value: ForumTopicStatus.NOT_REPRODUCED, title: t('status_not_reproduced') as string, icon: 'mdi-help-circle', iconClass: 'not-reproduced' })
			items.push({ value: ForumTopicStatus.NOT_A_BUG, title: t('status_not_a_bug') as string, icon: 'mdi-close-circle', iconClass: 'not-a-bug' })
		}
		if (isSuggestionCategory.value) {
			items.push({ value: ForumTopicStatus.NOT_PLANNED, title: t('status_not_planned') as string, icon: 'mdi-minus-circle', iconClass: 'not-planned' })
			items.push({ value: ForumTopicStatus.OBSOLETE, title: t('status_obsolete') as string, icon: 'mdi-archive', iconClass: 'obsolete' })
		}
		return items
	})

	const acknowledgedFilterItems = computed<{value: string, title: string}[]>(() => [
		{ value: 'all', title: t('filter_all') as string },
		{ value: 'yes', title: t('filter_acknowledged') as string },
		{ value: 'no', title: t('filter_not_acknowledged') as string },
	])
	const lockedFilterItems = computed<{value: string, title: string}[]>(() => [
		{ value: 'all', title: t('filter_all') as string },
		{ value: 'yes', title: t('filter_locked') as string },
		{ value: 'no', title: t('filter_not_locked') as string },
	])
	const readFilterItems = computed<{value: string, title: string}[]>(() => [
		{ value: 'all', title: t('filter_all') as string },
		{ value: 'yes', title: t('filter_read_yes') as string },
		{ value: 'no', title: t('filter_read_no') as string },
	])
	const priorityFilterItems = computed<{value: number, title: string, icon?: string, iconClass?: string}[]>(() => [
		{ value: 0, title: t('priority_none') as string },
		{ value: 1, title: t('priority_high') as string, icon: 'mdi-flag', iconClass: 'priority-high' },
		{ value: 2, title: t('priority_medium') as string, icon: 'mdi-flag', iconClass: 'priority-medium' },
		{ value: 3, title: t('priority_low') as string, icon: 'mdi-flag', iconClass: 'priority-low' },
	])
	const orderItems = computed<{value: string, title: string, icon: string}[]>(() => [
		{ value: 'date', title: 'Date', icon: 'mdi-clock-outline' },
		{ value: 'votes', title: 'Votes', icon: 'mdi-thumb-up-outline' },
		{ value: 'views', title: t('main.views') as string, icon: 'mdi-eye-outline' },
		{ value: 'messages', title: 'Messages', icon: 'mdi-message-outline' },
		{ value: 'priority', title: t('priority') as string, icon: 'mdi-flag-outline' },
	])

	const activeFilterCount = ref(0)
	function refreshActiveFilterCount() {
		let count = 0
		if (filterStatus.value.length) { count++ }
		if (filterAcknowledged.value !== 'all') { count++ }
		if (filterLocked.value !== 'all') { count++ }
		if (filterPriority.value.length) { count++ }
		if (filterRead.value !== 'all') { count++ }
		activeFilterCount.value = count
	}
	watch([filterStatus, filterAcknowledged, filterLocked, filterPriority, filterRead], refreshActiveFilterCount, { deep: true, immediate: true })

	function getFiltersQuery() {
		const params: string[] = []
		if (filterStatus.value.length) { params.push('status=' + filterStatus.value.join(',')) }
		if (filterAcknowledged.value === 'yes') { params.push('acknowledged=true') }
		if (filterAcknowledged.value === 'no') { params.push('acknowledged=false') }
		if (filterLocked.value === 'yes') { params.push('locked=true') }
		if (filterLocked.value === 'no') { params.push('locked=false') }
		if (filterPriority.value.length) { params.push('priority=' + filterPriority.value.join(',')) }
		if (filterRead.value === 'yes') { params.push('read=true') }
		if (filterRead.value === 'no') { params.push('read=false') }
		return params.length ? '?' + params.join('&') : ''
	}

	const languages = ref<Language[]>([])
	function refreshLanguages() {
		languages.value = Object.values(LeekWars.languages).filter(l => l.forum)
	}
	refreshLanguages()

	const activeLanguages = ref<string[]>([])
	function refreshActiveLanguages() {
		activeLanguages.value = Object.entries(forumLanguages).filter(e => e[1]).map(e => e[0])
	}
	watch(forumLanguages, refreshActiveLanguages, { deep: true, immediate: true })

	const breadcrumb_items = ref<{name: string, link: string}[]>([])
	const category_ids = ref('')
	function refreshBreadcrumb() {
		category_ids.value = categories.value ? categories.value.map(c => c.id).join(',') : ''
		breadcrumb_items.value = [
			{name: t('main.forum') as string, link: '/forum'},
			{name: categories.value ? categories.value[0].name : '...', link: '/forum/category-' + (categories.value ? category_ids.value : 0)}
		]
	}
	watch([categories, i18nLocale], refreshBreadcrumb, { immediate: true })

	function update() {
		const category = route.params.category
		page.value = 'page' in route.params ? parseInt(route.params.page as string, 10) : 1
		const newCategoryKey = categoryKey()
		if (newCategoryKey !== lastCategoryKey) {
			lastCategoryKey = newCategoryKey
			loadOrder()
		}
		loadFilters()
		syncUrlQuery()
		LeekWars.setActions([
			{icon: 'mdi-pencil', click: () => createDialog.value = true},
			{icon: 'mdi-magnify', click: () => router.push('/search?category=' + category) }
		])
		loading.value = true
		LeekWars.get('forum/get-topics/' + category + '/' + page.value + '/true/' + order.value + getFiltersQuery()).then(data => {
			loading.value = false
			categories.value = data.categories
			if (categories.value) {
				rawCategoryName.value = categories.value[0].name
				categories.value[0].name = categories.value[0].team > 0 ? categories.value[0].name : t('forum-category.' + categories.value[0].name) as string
				topics.value = data.topics
				pages.value = data.pages
				translations.value = data.translations

				LeekWars.setTitle(categories.value[0].name, t('n_topic_n_messages', [data.total_topics, data.total_messages]) as string)
				emitter.emit('loaded')
			}
		})
		const langs = (localStorage.getItem('forum/languages') as string || i18nLocale.value).split(',')
		for (const l in LeekWars.languages) {
			if (LeekWars.languages[l].forum) {
				forumLanguages[l] = false
			}
		}
		for (const l of langs) {
			forumLanguages[l] = true
		}
		createMessage.value = localStorage.getItem('forum/draft') as string
		createTitle.value = localStorage.getItem('forum/draft-title') as string
	}

	watch(() => route.params, update, { immediate: true })
	watch(() => route.query, update)
	watch(order, () => {
		localStorage.setItem(orderKey(), '' + order.value)
		update()
	})

	function create() {
		if (!categories.value) { return }
		if (!createTitle.value || !createTitle.value.trim()) { return }
		if (!createMessage.value || !createMessage.value.trim()) { return }
		const params: any = {category_id: categories.value[0].id, title: createTitle.value, message: createMessage.value, issue: 0, lang: createMessageLang.value}
		params.release = createRelease.value || 0
		params.hidden = createHidden.value
		LeekWars.post('forum/create-topic', params).then(data => {
			createDialog.value = false
			localStorage.setItem('forum/draft', '')
			localStorage.setItem('forum/draft-title', '')
			createRelease.value = null
			createHidden.value = false
			if (categories.value) {
				router.push("/forum/category-" + category_ids.value + "/topic-" + data.topic_id)
			}
		}).catch(error => {
			LeekWars.toast(t('error_' + error.error, error.params) as string)
		})
	}

	function search() {
		if (!categories.value) { return }
		const options = []
		if (query.value) { options.push('query=' + query.value.replace(' ', '+')) }
		options.push('category=' + category_ids.value)
		router.push('/search?' + options.join('&'))
	}

	function markAsRead() {
		LeekWars.post('forum/mark-as-read').then(() => {
			markAsReadDialog.value = false
			update()
		}).catch(error => {
			LeekWars.toast(t('error_' + error.error, error.params) as string)
		})
	}

	function setForumLanguage(language: Language) {
		for (const k of Object.keys(forumLanguages)) {
			delete forumLanguages[k]
		}
		forumLanguages[language.code] = true
		updateCategories()
	}

	function updateCategories() {
		localStorage.setItem('forum/languages', activeLanguages.value.join(','))
		router.replace('/forum/category-' + translations.value.filter(t => forumLanguages[t.lang]).map(t => t.id).join(','))
	}
	function updateDraft() {
		localStorage.setItem('forum/draft', createMessage.value)
	}
	function updateDraftTitle() {
		localStorage.setItem('forum/draft-title', createTitle.value)
	}

	function toggleStatusFilter(status: number) {
		const index = filterStatus.value.indexOf(status)
		if (index >= 0) { filterStatus.value.splice(index, 1) }
		else { filterStatus.value.push(status) }
		saveFilters()
	}

	function togglePriorityFilter(priority: number) {
		const index = filterPriority.value.indexOf(priority)
		if (index >= 0) { filterPriority.value.splice(index, 1) }
		else { filterPriority.value.push(priority) }
		saveFilters()
	}

	function buildQuery(): Record<string, string> {
		const query: Record<string, string> = {}
		if (filterStatus.value.length) { query.status = filterStatus.value.join(',') }
		if (filterAcknowledged.value === 'yes') { query.acknowledged = 'true' }
		if (filterAcknowledged.value === 'no') { query.acknowledged = 'false' }
		if (filterLocked.value === 'yes') { query.locked = 'true' }
		if (filterLocked.value === 'no') { query.locked = 'false' }
		if (filterPriority.value.length) { query.priority = filterPriority.value.join(',') }
		if (filterRead.value === 'yes') { query.read = 'true' }
		if (filterRead.value === 'no') { query.read = 'false' }
		return query
	}

	function syncUrlQuery() {
		const query = buildQuery()
		const current = route.query
		const same = Object.keys(query).length === Object.keys(current).length && Object.keys(query).every(k => current[k] === query[k])
		if (!same) {
			router.replace({ query })
		}
	}

	function categoryKey(): string {
		const ids = String(route.params.category || '').split(',').map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b)
		return ids.join(',')
	}

	function filterKey(): string {
		return 'forum/filters/' + categoryKey()
	}

	function orderKey(): string {
		return 'forum/topic-order/' + categoryKey()
	}

	function loadOrder() {
		const value = localStorage.getItem(orderKey()) || localStorage.getItem('forum/topic-order') || 'date'
		if (value !== order.value) { order.value = value }
	}

	function saveFilters() {
		localStorage.setItem(filterKey(), JSON.stringify({
			status: filterStatus.value,
			acknowledged: filterAcknowledged.value,
			locked: filterLocked.value,
			priority: filterPriority.value,
			read: filterRead.value,
		}))
		router.replace({ query: buildQuery() })
	}

	function loadFilters() {
		const q = route.query
		const hasQueryFilters = q.status || q.acknowledged || q.locked || q.priority || q.read
		if (hasQueryFilters) {
			filterStatus.value = q.status ? String(q.status).split(',').map(Number) : []
			filterAcknowledged.value = q.acknowledged === 'true' ? 'yes' : q.acknowledged === 'false' ? 'no' : 'all'
			filterLocked.value = q.locked === 'true' ? 'yes' : q.locked === 'false' ? 'no' : 'all'
			filterPriority.value = q.priority ? String(q.priority).split(',').map(Number) : []
			filterRead.value = q.read === 'true' ? 'yes' : q.read === 'false' ? 'no' : 'all'
		} else {
			resetFilters()
			try {
				const saved = localStorage.getItem(filterKey())
				if (saved) {
					const f = JSON.parse(saved)
					filterStatus.value = f.status || []
					filterAcknowledged.value = f.acknowledged || 'all'
					filterLocked.value = f.locked || 'all'
					filterPriority.value = f.priority || []
					filterRead.value = f.read || 'all'
				}
			} catch { /* ignore */ }
		}
	}

	function resetFilters() {
		filterStatus.value = []
		filterAcknowledged.value = 'all'
		filterLocked.value = 'all'
		filterPriority.value = []
		filterRead.value = 'all'
	}

	function clearFilters() {
		resetFilters()
		saveFilters()
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
	user-select: none;
}
.flag {
	max-width: 28px;
	max-height: 20px;
	margin-right: 4px;
}
.language {
	display: flex;
	align-items: center;
}
.language .name {
	padding-left: 8px;
}
.forum-header {
	font-size: 18px;
	font-weight: 300;
	background: none;
	margin: 0;
}
#app.app .panel .content {
	padding: 0;
}
#app.app .topics {
	padding: 0 5px;
	margin-bottom: 10px;
	position: relative;
	&.loading {
		opacity: 0.4;
		pointer-events: none;
	}
}
.loading-overlay {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1;
}
.topic {
	margin-bottom: 5px;
	display: flex;
	align-items: center;
}
.topic:not(.header) {
	border: 1px solid var(--border);
}
.topic.pinned {
	background: var(--pure-white);
}
.topic .attr {
	height: 19px;
	margin-right: 4px;
	padding: 2px 0;
	vertical-align: bottom;
}
i.attr {
	// color: #666;
	font-size: 19px;
	&.resolved {
		color: #5fad1b;
	}
	&.not-reproduced {
		color: orange;
	}
	&.not-planned {
		color: var(--text-color);
		opacity: 0.7;
	}
	&.not-a-bug {
		color: var(--text-color-secondary);
	}
	&.acknowledged {
		color: #6f42c1;
	}
	&.obsolete {
		color: var(--text-color);
		opacity: 0.7;
	}
}
.topic > div {
	padding: 8px;
	flex: 1;
	min-width: 0;
}
.topic:not(.header):hover {
	background-color: var(--pure-white);
	box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
}
.topic > .seen {
	flex: 0 0 50px;
	padding-top: 10px;
	padding-bottom: 10px;
	padding-right: 5px;
}
.topic .seen img {
	height: 40px;
}
body.dark .topic .seen img.seen {
	filter: invert(0.85);
}
.topic .flag {
	height: 13px;
	margin-left: 6px;
	vertical-align: bottom;
	margin-bottom: 3px;
}
.topic .title {
	font-size: 17px;
	margin-bottom: 4px;
	display: inline-block;
	.issue, .release-badge {
		background: #0366d6;
		color: white;
		border-radius: 5px;
		font-size: 13px;
		font-weight: 500;
		padding: 0 4px;
		display: inline-block;
		margin-bottom: 2px;
		height: auto;
		&.private-issue {
			background: none;
			color: #6f42c1;
    		border: 1px solid #6f42c1;
		}
	}
	.release-badge {
		background: #28a745;
	}
	.priority-flag {
		font-size: 18px;
		opacity: 1;
		&.priority-high { color: #e53935; }
		&.priority-medium { color: #fb8c00; }
		&.priority-low { color: #757575; }
	}
}
#app.app .topic .title {
	.issue, .release-badge {
		margin-bottom: 0;
	}
}
.topic .description {
	font-size: 14px;
	margin-top: 5px;
	display: flex;
	gap: 4px;
	.votes {
		display: flex;
		gap: 6px;
		align-items: center;
		margin-left: 6px;
		.vote {
			display: inline-block;
			border-radius: 6px;
		}
		.vote i {
			vertical-align: bottom;
			font-size: 15px;
			margin-right: 3px;
		}
		.vote.zero {
			opacity: 0.3;
		}
		.vote.active {
			font-weight: bold;
		}
		.vote.up, .vote.up i {
			color: #5fad1b;
		}
		.vote.down {
			color: red;
			i {
				color: red;
			}
		}
		.vote.up.zero, .vote.down.zero {
			color: #555;
			i {
				color: #555;
			}
		}
	}
}
.topic .description i {
	font-size: 14px;
	vertical-align: bottom;
}
.topic .description:has(.messages) {
	display: flex;
	white-space: nowrap;
	overflow: hidden;
	.messages {
		flex-shrink: 0;
	}
	span {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.goto {
		flex-shrink: 0;
		margin-left: 2px;
	}
}

.topic .farmer.deleted {
	font-style: italic;
	color: #aaa;
}
.topic .num-views {
	flex: 0 0 100px;
	text-align: center;
}
.topic .num-messages {
	flex: 0 0 100px;
	text-align: center;
}
.topic .last-message {
	flex: 0 0 176px;
	text-align: center;
	vertical-align: top;
	white-space: nowrap;
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
	color: var(--text-color);
}
.create-popup {
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 20px;
		align-items: center;
		margin-bottom: 10px;
	}
}
.create-popup .user-agent-notice {
	font-size: 12px;
	color: var(--text-color-secondary);
	padding: 8px 10px;
	background: var(--background-secondary);
	border-radius: 4px;
	margin-top: 10px;
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
	.user-agent-value {
		font-family: monospace;
		word-break: break-all;
	}
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

.breadcrumb-sort {
	padding-bottom: 8px;
	justify-content: flex-end;
	.pagination {
		margin: auto;
	}
}
.toolbar-right {
	display: flex;
	align-items: center;
	gap: 4px;
	justify-self: flex-end;
}
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40px 20px;
	gap: 8px;
	.empty-title {
		font-size: 18px;
		font-weight: 500;
		color: var(--text-color-secondary);
	}
	.empty-subtitle {
		font-size: 14px;
		color: #888;
	}
}
.filter-list {
	:deep(.v-list-item) {
		min-height: 22px;
		font-size: 14px;
		padding-top: 2px;
		padding-bottom: 2px;
	}
	:deep(.v-selection-control) {
		min-height: unset;
	}
	:deep(.v-list-subheader) {
		min-height: 24px;
		padding-top: 2px;
		font-size: 13px;
	}
	:deep(.v-divider) {
		margin: 2px 0;
	}
}
.filter-icon {
	margin-right: 4px;
}
.filter-item-icon {
	margin-right: 4px;
	&.resolved { color: #5fad1b; }
	&.not-reproduced { color: orange; }
	&.not-planned { color: var(--text-color); opacity: 0.7; }
	&.not-a-bug { color: var(--text-color-secondary); }
	&.obsolete { color: var(--text-color); opacity: 0.7; }
	&.priority-high { color: #e53935; }
	&.priority-medium { color: #fb8c00; }
	&.priority-low { color: #757575; }
}

.filter-btn {
	position: relative;
	width: 40px;
	height: 40px;
	&.active {
		color: var(--v-theme-primary);
	}
}

#app.app .breadcrumb-sort {
	flex-wrap: wrap;
	align-items: center;
	display: grid;
	grid-template: "a b" auto
				   "c c" auto / 1fr auto;
	row-gap: 8px;
	.pagination {
		grid-area: c;
	}
	.order-select {
		margin-right: 8px;
	}
}

</style>