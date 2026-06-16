<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="title-wrapper">
				<h1>
					<router-link to="/forum">{{ $t('main.dev-blog') }}</router-link>
				</h1>
			</div>
		</div>

		<panel class="first last">
			<template #content>
				<div class="content">

					<h2>{{ $t('articles') }}</h2>

					<loader v-if="!articles" />
					<div v-else class="articles">
						<router-link v-for="article of articles" :key="article.id" v-ripple class="article card" :to="'/dev-blog/' + article.id">
							<img v-if="article.image" :src="article.image">
							<div v-else class="no-image"><v-icon>mdi-newspaper-variant-outline</v-icon></div>
							<div class="info">
								<div class="title">{{ article.title }}</div>

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
							</div>
						</router-link>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { i18n, mixins } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import Breadcrumb from '../forum/breadcrumb.vue'

defineOptions({ name: 'DevBlog', i18n: {}, mixins: [...mixins] })

const articles = ref<{ id: number, title: string, category: number, topic: number, image: string, date: number, votes_up: number, message_count: number }[] | null>(null)

LeekWars.get('article/all').then(data => {
	articles.value = data
})

onBeforeMount(() => {
	const title = i18n.global.t('main.dev-blog') as string
	LeekWars.setTitle(title)
	LeekWars.setMeta({ title })
})
</script>

<style lang="scss" scoped>
.articles {
	display: grid;
	grid-gap: 15px;
	grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
	margin: 20px 0;
	.article {
		overflow: hidden;
		img {
			width: 100%;
		}
		.no-image {
			display: flex;
			align-items: center;
			justify-content: center;
			aspect-ratio: 1076 / 332;
			background: var(--background-secondary);
			i {
				font-size: 64px;
				color: var(--text-color-secondary);
				opacity: 0.4;
			}
		}
		.info {
			padding: 15px;
		}
		.title {
			font-size: 21px;
			margin-bottom: 10px;
		}
		.subtitle {
			color: var(--text-color-secondary);
		}
		.date {
			font-weight: 500;
		}
		.vote {
			display: flex;
			align-items: center;
			// font-size: 16px;
			padding: 0 6px;
			border-radius: 6px;
		}
		.vote i {
			font-size: 18px;
			padding-right: 5px;
		}
		.vote.zero {
			opacity: 0.3;
		}
		.vote.zero {
			color: var(--text-color-secondary);
		}
	}
}
</style>