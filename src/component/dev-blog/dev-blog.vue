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
			<div slot="content" class="content">

				<h2>Articles</h2>

				<loader v-if="!articles" />
				<div v-else class="articles">
					<router-link v-for="article of articles" :key="article.id" class="article card" :to="'/forum/category-' + article.category + '/topic-' + article.topic + '-' + formatTitleURL(article.title)" v-ripple>
						<img :src="article.image">
						<div class="info">
							<div class="title">{{ article.title }}</div>
							<div class="date">{{ article.date | date }}</div>
						</div>
					</router-link>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { Farmer } from '@/model/farmer'
	import { ForumCategory, ForumMessage, ForumTopic } from '@/model/forum'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'

	@Component({ name: 'dev-blog', i18n: {}, mixins: [...mixins], components: { Breadcrumb } })
	export default class DevBlog extends Vue {

		articles = null

		created() {
			LeekWars.get('article/all').then(data => {
				this.articles = data
			})
		}

		formatTitleURL(title: string) {
			return title.toLocaleLowerCase().replace(/ /g, '-').replace(/[\[\]]/g, '').replace(/,/g, '')
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
		.date {
			color: #777;
		}
	}
}
</style>