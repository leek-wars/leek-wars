<template>
	<div class="search-bar">
		<input class="card" v-model="query" type="text" :placeholder="$t('main.search_bar')">

		<loader v-if="loading" />
		<div v-else-if="results && results.length" class="results">
			<router-link v-for="(result, r) in results" :key="r" :to="'/encyclopedia/' + $i18n.locale + '/' + result.title" class="result">
				<div class="title" v-html="result.title_headline"></div>
			</router-link>
			<router-link :to="'/encyclopedia-search?query=' + query" class="more">
				<div class="title">{{ $t('main.more_results') }}</div>
			</router-link>
		</div>
	</div>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'search-bar' })
	export default class SearchBar extends Vue {

		query: string = ''
		loading: boolean = false
		results: any[] | null = null
		timer: any

		@Watch('query')
		update() {
			this.results = []
			if (this.query === '') {
				clearTimeout(this.timer)
				this.loading = false
				return
			}
			if (this.timer) {
				clearTimeout(this.timer)
			}
			this.loading = true
			this.timer = setTimeout(() => {
				LeekWars.get('encyclopedia/search/' + i18n.locale + '/' + this.query.replace(/ /g, '+') + '/1').then(data => {
					this.results = data.results
					this.loading = false
					// this.pages = data.pages
					// this.count = data.count
				}).error(error => {
					this.results = []
					// this.count = 0
					LeekWars.toast(error.error)
				})
			}, 200)
		}
	}
</script>

<style lang="scss" scoped>
	.search-bar {
		margin: 20px 0;
	}
	input {
		padding: 15px;
		margin-bottom: 10px;
		width: 100%;
		border: none;
		font-size: 16px;
	}
	.results {
		display: flex;
		flex-direction: column;
		.result {
			padding: 6px;
			padding-left: 15px;
			color: var(--text-color) !important;
			::v-deep b {
				color: #5fad1b;
				font-weight: bold;
			}
			&:hover {
				background: var(--background-secondary);
				text-decoration: none;
			}
		}
	}
	.more {
		padding: 5px 15px;
	}
</style>