<template lang="html">
	<div class="page changelog-page">
		<div class="page-header page-bar">
			<div class="page-title">
				<page-icon name="changelog" fallback="mdi-format-list-bulleted-square" />
				<div class="page-title-text">
					<h1>
						<breadcrumb v-if="routeVersion" :items="breadcrumb_items" :raw="true" />
						<template v-else>{{ $t('main.changelog') }}</template>
					</h1>
				</div>
			</div>
			<div class="tabs">
				<div v-if="!routeVersion" class="tab disabled search-box">
					<v-icon class="search-icon">mdi-magnify</v-icon>
					<input v-model="search" type="text" :placeholder="$t('main.search')" :aria-label="$t('main.search')" autocomplete="off" spellcheck="false" @keyup.stop @keyup.esc="search = ''">
					<v-icon v-if="search" class="clear-icon" @click="search = ''">mdi-close</v-icon>
				</div>
				<router-link to="/about">
					<div class="tab">
						<v-icon>mdi-information-variant</v-icon>
						<span>{{ $t('main.about') }}</span>
					</div>
				</router-link>
				<router-link to="/statistics">
					<div class="tab">
						<v-icon>mdi-poll</v-icon>
						<span>{{ $t('main.stats') }}</span>
					</div>
				</router-link>
				<router-link to="/app">
					<div class="tab">
						<v-icon>mdi-cellphone</v-icon>
						<span>{{ $t('main.app') }}</span>
					</div>
				</router-link>
			</div>
		</div>
		<panel v-if="!changelog" class="first">
			<loader />
		</panel>
		<template v-else>
			<div v-if="terms.length" class="search-summary">{{ $t('changelog.search_results', result_count) }}</div>
			<panel v-for="version in lazy_changelog" :key="version.version" icon="mdi-star">
				<template #title><router-link :to="'/release/' + version.version_name"><span v-html="version_label(version)"></span></router-link>&nbsp;({{ $filters.date(version.date) }}) <span v-html="version_title(version)"></span></template>
				<template #actions>
					<router-link v-if="!routeVersion" :to="'/release/' + version.version_name" class="button flat">
						<v-icon>mdi-link-variant</v-icon>
					</router-link>
					<div class="button flat" @click="showChangelogDialog(version)">
						<v-icon>mdi-eye-outline</v-icon>
					</div>
				</template>
				<template #content>
					<div class="wrapper">
						<div class="content">
							<changelog-version :version="version" :terms="terms" />
						</div>
					</div>
				</template>
			</panel>
		</template>
		<changelog-dialog v-model="showChangelog" :changelog="changelogVersion" />


		<!-- Social images generation -->
		<!-- Social posts, ready to copy -->
		<changelog-posts v-if="routeVersion && store.getters.admin" :version="routeVersion" />
		<changelog-social v-if="routeVersion && store.getters.admin" :version="routeVersion" :version-name="(route.params.version as string)" />
	</div>
</template>

<script setup lang="ts">

import { ref, computed, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { emitter } from '@/model/emitter'
import Breadcrumb from '../forum/breadcrumb.vue'
import ChangelogDialog from './changelog-dialog.vue'
import ChangelogVersion from './changelog-version.vue'
import ChangelogPosts from './changelog-posts.vue'
import ChangelogSocial from './changelog-social.vue'
import { highlight, matches, searchTerms, searchVersion } from './changelog-search'
import type { ChangelogYamlVersion } from './changelog-search'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
// Seules ces langues ont un changelog traduit ; les autres retombent sur l'anglais.
const changelogLocale = computed(() => ['fr', 'en', 'es', 'it'].includes(locale.value) ? locale.value : 'en')
const routeVersion = computed(() => route.params.version ? parseInt((route.params.version as string).replace('.', ''), 10) : null)

interface ChangelogEntry {
	version: number
	version_name: string
	date: number
	data: string
	forum_topic?: number | null
	forum_category?: number | null
	active: boolean
	image?: boolean
}

const changelog = ref<ChangelogEntry[] | null>(null)
const showChangelog = ref(false)
const changelogVersion = ref<ChangelogEntry | null>(null)
const translations = ref<Record<number, ChangelogYamlVersion>>({})
// Chaque version déroule tout son contenu : on n'en pose que deux à la fois. Une
// recherche ne garde que les lignes trouvées, bien plus légères, d'où le pas
// nettement plus grand.
const LAZY_STEP = 2
const SEARCH_LAZY_STEP = 10
const search = ref((route.query.q as string) ?? '')
const terms = ref(searchTerms(search.value))
const lazy_step = computed(() => terms.value.length ? SEARCH_LAZY_STEP : LAZY_STEP)
const lazy_end = ref(lazy_step.value)

// La recherche ne part qu'après une pause dans la frappe. Elle repart du haut de
// la liste des résultats et se retrouve dans l'URL, pour être partagée.
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
	if (searchTimer) { clearTimeout(searchTimer) }
	searchTimer = setTimeout(() => {
		terms.value = searchTerms(search.value)
		lazy_end.value = lazy_step.value
		const query = { ...route.query }
		if (search.value) { query.q = search.value } else { delete query.q }
		router.replace({ query })
	}, 200)
})
// L'URL reste la référence : revenir en arrière remet le champ dans son état.
watch(() => route.query.q, q => {
	const value = (q as string) ?? ''
	if (value !== search.value) {
		search.value = value
		terms.value = searchTerms(value)
	}
})

const breadcrumb_items = computed(() => [
	{ name: t('main.changelog'), link: '/changelog' },
	{ name: t('changelog.version_n', [route.params.version]), link: '/release/' + route.params.version },
])

// L'en-tête d'une version, « Version 3.0 — titre » : la recherche y répond aussi,
// pour retrouver une mise à jour par son numéro ou par son nom.
function header_text(version: ChangelogEntry) {
	return t('changelog.version_n', [version.version_name]) + ' ' + (translations.value[version.version]?.title ?? '')
}
// Échapper avant de surligner : le HTML rendu ne doit venir que d'ici.
function mark(text: string) {
	return highlight(LeekWars.protect(text), terms.value)
}
function version_label(version: ChangelogEntry) {
	return mark(t('changelog.version_n', [version.version_name]))
}
function version_title(version: ChangelogEntry) {
	const title = translations.value[version.version]?.title
	return title ? ' — ' + mark(title) : ''
}

// Les versions retenues, avec ce que chacune rapporte à la recherche : ses lignes
// trouvées, ou un seul résultat quand seul son en-tête répond — elle est alors
// montrée en entier, comme dans <changelog-version>.
const found = computed(() => {
	if (!changelog.value) { return [] }
	if (routeVersion.value) {
		return changelog.value.filter(v => v.version === routeVersion.value).map(version => ({ version, count: 0 }))
	}
	if (!terms.value.length) { return changelog.value.map(version => ({ version, count: 0 })) }
	const results: { version: ChangelogEntry, count: number }[] = []
	for (const version of changelog.value) {
		const sections = searchVersion(translations.value[version.version], terms.value)
		if (sections) {
			results.push({ version, count: sections.reduce((count, section) => count + section.changes.length, 0) })
		} else if (matches(header_text(version), terms.value)) {
			results.push({ version, count: 1 })
		}
	}
	return results
})

const found_changelog = computed(() => found.value.map(result => result.version))
const result_count = computed(() => found.value.reduce((count, result) => count + result.count, 0))

const lazy_changelog = computed(() => found_changelog.value.slice(0, lazy_end.value))

function showChangelogDialog(version: ChangelogEntry) {
	changelogVersion.value = version
	showChangelog.value = true
}

function scroll() {
	if (!changelog.value) { return }
	if (lazy_changelog.value.length < found_changelog.value.length) {
		if (window.scrollY + window.innerHeight + 2000 > document.body.clientHeight) {
			lazy_end.value += lazy_step.value
		}
	}
}

function loadChangelog() {
	LeekWars.get<{ changelog: ChangelogEntry[] }>('changelog/get/' + changelogLocale.value).then(data => {
		changelog.value = data.changelog
		for (const c in changelog.value) {
			changelog.value[c].active = parseInt(c, 10) < 2 ? true : false
		}
		addDevVersions()
		if (routeVersion.value) {
			const version = data.changelog.find(v => v.version === routeVersion.value)
			LeekWars.setTitle(t('main.changelog') + ' — ' + (version ? version.version_name : route.params.version))
		} else {
			LeekWars.setTitle(t('main.changelog'))
		}
		emitter.emit('loaded')
	})
	import(`@/component/changelog/changelog.${changelogLocale.value}.yaml`).then((module: { default: Record<number, ChangelogYamlVersion> }) => {
		translations.value = module.default
		addDevVersions()
	})
}
loadChangelog()
watch(locale, loadChangelog)
window.addEventListener('scroll', scroll)

const addDevVersions = () => {
	if (!changelog.value || !translations.value) return
	if (LeekWars.DEV || store.getters.admin) {
		for (const version of Object.keys(translations.value)) {
			const versionNumber = parseInt(version)
			if (!changelog.value.find(v => v.version === versionNumber)) {
				const name = '' + versionNumber
				changelog.value.unshift({
					active: true,
					image: true,
					version: versionNumber,
					version_name: name.substring(0, 1) + '.' + name.substring(1),
					date: Date.now() / 1000,
					data: 'changelog_' + versionNumber
				})
			}
		}
	}
}

onUnmounted(() => {
	window.removeEventListener('scroll', scroll)
	if (searchTimer) { clearTimeout(searchTimer) }
})

</script>

<style lang="scss" scoped>

.changelog-page {
	font-size: 16px;
}
.search-box {
	flex: 1;
	min-width: 0;
	input[type="text"] {
		flex: 1;
		min-width: 60px;
		height: 26px;
		padding: 0 6px;
		border-radius: var(--radius-small);
	}
	.clear-icon {
		cursor: pointer;
		font-size: 20px;
	}
}
.search-summary {
	padding: 8px 12px;
	color: var(--text-color-secondary);
}
// Le titre du panneau se surligne comme les lignes (cf. changelog-version.vue).
:deep(mark) {
	background: #ffe27a;
	color: #202020;
	border-radius: var(--radius-small);
	padding: 1px 0;
}
body.dark .changelog-page :deep(mark) {
	background: #d3ae35;
}
.change {
	padding: 0 10px;
}
.wrapper {
	background: rgba(100,100,100,0.1);
}
.changelog-page :deep(.panel a) {
	color: green;
}
.image {
	width: calc(100% + 30px);
	margin-left: -15px;
	margin-right: -15px;
	margin-bottom: 10px;
	margin-top: -15px;
}
</style>