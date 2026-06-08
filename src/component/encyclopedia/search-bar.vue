<template>
	<div class="search-bar">
		<input v-model="query" class="card" type="text" :placeholder="$t('main.search_bar')">

		<loader v-if="loading" />
		<div v-else-if="results && results.length" class="results">
			<router-link v-for="(result, r) in results" :key="r" :to="'/encyclopedia/' + $i18n.locale + '/' + result.title" class="result">
				<div class="title" v-html="highlight(result.title_headline)"></div>
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

defineOptions({ name: 'SearchBar' })

// Le titre vient de ts_headline() côté serveur, qui n'échappe PAS le HTML de la source
// (seuls <b>/</b> sont ajoutés autour des termes). On échappe tout puis on ré-autorise <b>.
function highlight(text: unknown): string {
	return typeof text === 'string' ? LeekWars.protect(text).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>') : ''
}

const route = useRoute()
const router = useRouter()

const query = ref('')
const loading = ref(false)
const results = ref<unknown[] | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

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
		}).catch((err) => {
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