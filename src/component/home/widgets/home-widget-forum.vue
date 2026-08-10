<template>
	<div class="forum-widget">
		<loader v-if="!loaded" />
		<template v-else-if="topics.length">
			<router-link v-for="topic in topics" :key="topic.id" v-ripple :to="'/forum/category-' + topic.category + '/topic-' + topic.id" class="topic" :class="{ unread: !topic.seen }">
				<img :src="topic.seen ? '/image/forum_seen.png' : '/image/forum_unseen.png'" class="seen-icon">
				<div class="topic-main">
					<div class="title-line">
						<v-icon v-if="topic.status === ForumTopicStatus.RESOLVED" class="attr resolved">mdi-check-circle</v-icon>
						<v-icon v-else-if="topic.status === ForumTopicStatus.NOT_REPRODUCED" class="attr not-reproduced">mdi-help-circle</v-icon>
						<v-icon v-else-if="topic.status === ForumTopicStatus.NOT_PLANNED" class="attr not-planned">mdi-minus-circle</v-icon>
						<v-icon v-else-if="topic.status === ForumTopicStatus.NOT_A_BUG" class="attr not-a-bug">mdi-close-circle</v-icon>
						<v-icon v-else-if="topic.status === ForumTopicStatus.OBSOLETE" class="attr obsolete">mdi-archive</v-icon>
						<v-icon v-if="topic.closed" class="attr">mdi-lock</v-icon>
						<v-icon v-if="topic.pinned" class="attr">mdi-pin</v-icon>
						<span class="title">{{ topic.title }}</span>
					</div>
					<div class="meta">
						<span class="author">{{ topic.author.name }}</span>
						<span class="stats">
							<span><v-icon>mdi-comment-outline</v-icon> {{ topic.message_count }}</span>
							<span><v-icon>mdi-eye-outline</v-icon> {{ topic.views }}</span>
						</span>
					</div>
				</div>
			</router-link>
		</template>
		<div v-else class="none">{{ t('no_topic') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { useNamespacedT } from '@/model/i18n'
	import { ForumTopicStatus } from '@/model/forum'

	defineOptions({ name: 'HomeWidgetForum' })

	const t = useNamespacedT('home')

	interface Topic {
		id: number, title: string, category: number, last_message: number, message_count: number,
		views: number, seen: boolean, pinned: boolean, closed: boolean, status: number,
		author: { id: number, name: string }, last_message_owner_name: string | null
	}
	const loaded = ref(false)
	const topics = ref<Topic[]>([])

	LeekWars.get<{ topics: Topic[] }>('forum/get-last-topics').then((data) => {
		topics.value = data.topics ?? []
		loaded.value = true
	}).error(() => { loaded.value = true })
</script>

<style lang="scss" scoped>
	.forum-widget {
		display: flex;
		flex-direction: column;
	}
	.topic {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 8px;
		text-decoration: none;
		color: var(--text-color);
		border-bottom: 1px solid var(--border);
	}
	.topic:last-child {
		border-bottom: none;
	}
	.topic:hover {
		background: var(--background-secondary);
	}
	.seen-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
	.topic-main {
		min-width: 0;
		flex: 1;
	}
	.title-line {
		display: flex;
		align-items: center;
		gap: 3px;
	}
	.topic.unread .title {
		font-weight: bold;
	}
	.title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.attr {
		font-size: 15px;
		flex-shrink: 0;
	}
	.attr.resolved { color: var(--primary); }
	.attr.not-reproduced { color: #e67e22; }
	.attr.not-planned { color: var(--text-color-secondary); }
	.attr.not-a-bug { color: #c0392b; }
	.attr.obsolete { color: var(--text-color-secondary); }
	.meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.author {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.stats {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}
	.stats span {
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}
	.stats .v-icon {
		font-size: 14px;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
