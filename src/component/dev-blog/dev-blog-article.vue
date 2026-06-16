<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="title-wrapper">
				<h1>
					<router-link to="/dev-blog">{{ $t('main.dev-blog') }}</router-link>
				</h1>
			</div>
		</div>

		<panel class="first last">
			<template #content>
				<loader v-if="!article && !not_found" />
				<div v-else-if="not_found" class="not-found">
					{{ $t('not_found') }}
				</div>
				<div v-else-if="article" class="article-content">
					<img v-if="article.image" :src="article.image" class="banner">

					<h2 class="title">{{ article.title }}</h2>

					<div class="flex subtitle">
						<div class="date">{{ $filters.date(article.date) }}</div>
						<div class="spacer"></div>
						<div :class="{zero: article.votes_up === 0}" class="vote up">
							<v-icon>mdi-thumb-up-outline</v-icon>
							<span class="counter">{{ article.votes_up }}</span>
						</div>
						<div :class="{zero: article.message_count - 1 === 0}" class="vote">
							<v-icon>mdi-message-outline</v-icon>
							<span class="counter">{{ article.message_count - 1 }}</span>
						</div>
					</div>

					<markdown :content="article.message" mode="forum" />

					<router-link :to="forumLink" class="forum-link">
						<v-icon>mdi-forum-outline</v-icon>
						{{ $t('discuss_on_forum') }}
					</router-link>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { useRoute } from 'vue-router'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import Markdown from '@/component/encyclopedia/markdown.vue'

	defineOptions({ name: 'DevBlogArticle', i18n: {}, mixins: [...mixins], components: { Markdown } })

	interface Article {
		id: number
		topic: number
		image: string
		title: string
		date: number
		message: string
		html: boolean
		message_count: number
		votes_up: number
		votes_down: number
		category: number
		language: string
	}

	const route = useRoute()
	const article = ref<Article | null>(null)
	const not_found = ref(false)
	const forumLink = ref('/forum')

	function formatTitleURL(title: string) {
		return title.toLocaleLowerCase().replace(/ /g, '-').replace(/[[\]]/g, '').replace(/,/g, '').replace(/\//g, '')
	}

	// Description SEO : on aplatit le markdown en texte brut, tronqué à 200 caractères.
	function buildDescription(message: string) {
		let description = message
			.replace(/```[\s\S]*?```/g, ' ')
			.replace(/<[^>]*>/g, ' ')
			.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/[#>*_`~|[\]-]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
		if (description.length > 200) {
			description = description.slice(0, 200).replace(/\s+\S*$/, '') + '…'
		}
		return description
	}

	function load(id: number) {
		article.value = null
		not_found.value = false
		LeekWars.get<Article>('article/get/' + id).then(a => {
			article.value = a
			forumLink.value = '/forum/category-' + a.category + '/topic-' + a.topic + '-' + formatTitleURL(a.title)
			LeekWars.setTitle(a.title)
			LeekWars.setMeta({
				title: a.title,
				description: buildDescription(a.message) || null,
				image: a.image ? (a.image.startsWith('http') ? a.image : 'https://leekwars.com' + a.image) : null,
				canonical: 'https://leekwars.com/dev-blog/' + a.id
			})
		}).error(() => {
			not_found.value = true
		})
	}

	watch(() => route.params.id, id => load(parseInt(id as string)), { immediate: true })
</script>

<style lang="scss" scoped>
.article-content {
	padding: 15px;
	.banner {
		width: 100%;
		border-radius: 4px;
		margin-bottom: 15px;
	}
	.title {
		font-size: 26px;
		margin-bottom: 10px;
	}
	.subtitle {
		color: var(--text-color-secondary);
		margin-bottom: 20px;
		.date {
			font-weight: 500;
		}
		.vote {
			display: flex;
			align-items: center;
			padding: 0 6px;
			border-radius: 6px;
		}
		.vote i {
			font-size: 18px;
			padding-right: 5px;
		}
		.vote.zero {
			opacity: 0.3;
			color: var(--text-color-secondary);
		}
	}
	.forum-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 20px;
		padding: 8px 16px;
		border-radius: 6px;
		background: var(--background-secondary);
		color: var(--text-color);
		font-weight: 500;
	}
}
.not-found {
	padding: 30px;
	text-align: center;
	color: var(--text-color-secondary);
}
</style>
