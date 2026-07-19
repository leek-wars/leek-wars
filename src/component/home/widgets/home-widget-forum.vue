<template>
	<div class="forum-widget">
		<loader v-if="!loaded" />
		<template v-else-if="topics.length">
			<router-link v-for="topic in topics" :key="topic.id" v-ripple :to="'/forum/category-' + topic.category + '/topic-' + topic.id" class="topic">
				<div class="title">{{ topic.title }}</div>
				<div class="meta">
					<span v-if="topic.last_message_owner_name" class="author">{{ topic.last_message_owner_name }}</span>
					<span class="count"><v-icon>mdi-comment-outline</v-icon> {{ topic.message_count }}</span>
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

	defineOptions({ name: 'HomeWidgetForum' })

	const t = useNamespacedT('home')

	interface Topic { id: number, title: string, category: number, last_message: number, message_count: number, last_message_owner_name: string | null }
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
		flex-direction: column;
		gap: 2px;
		padding: 8px;
		border-radius: 4px;
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
	.title {
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.meta {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.meta .count {
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}
	.meta .count .v-icon {
		font-size: 14px;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
