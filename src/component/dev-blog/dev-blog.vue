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
					<router-link v-for="article of articles" :key="article.id" class="article card" :to="'/forum/category-' + article.category + '/topic-' + article.topic + '-' + formatTitleURL(article.title)" v-ripple>
						<img :src="article.image">
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
			</template>
		</panel>
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { Farmer } from '@/model/farmer'
	import { ForumCategory, ForumMessage, ForumTopic } from '@/model/forum'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'

	@Options({ name: 'dev-blog', i18n: {}, mixins: [...mixins], components: { Breadcrumb } })
	export default class DevBlog extends Vue {

		articles = null

		created() {
			LeekWars.get('article/all').then(data => {
				this.articles = data
			})
		}

		formatTitleURL(title: string) {
			return title.toLocaleLowerCase().replace(/ /g, '-').replace(/[\[\]]/g, '').replace(/,/g, '').replace(/\//g, '')
		}
	}
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