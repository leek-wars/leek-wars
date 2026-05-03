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

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'

defineOptions({ name: 'search-bar' })

const route = useRoute()
const router = useRouter()

const query = ref('')
const loading = ref(false)
const results = ref<any[] | null>(null)
let timer: any

const urlQuery = route.query.query as string
if (urlQuery) {
	query.value = urlQuery.replace(/\+/g, ' ')
}

watch(query, () => {
	const encoded = query.value.replace(/ /g, '+')
	const currentUrlQuery = (route.query.query as string) || ''
	if (encoded !== currentUrlQuery) {
		router.replace({ query: { ...route.query, query: encoded || undefined } })
	}

	results.value = []
	if (query.value === '') {
		clearTimeout(timer)
		loading.value = false
		return
	}
	if (timer) clearTimeout(timer)
	loading.value = true
	timer = setTimeout(() => {
		LeekWars.get('encyclopedia/search/' + i18n.locale + '/' + query.value.replace(/ /g, '+') + '/1').then(data => {
			results.value = data.results
			loading.value = false
		}).catch((err: any) => {
			results.value = []
			LeekWars.toast(err.error)
		})
	}, 200)
})
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
			:deep(b) {
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