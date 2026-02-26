<template lang="html">
	<div class="page changelog-page">
		<div class="page-header page-bar">
			<h1>{{ $t('main.changelog') }}</h1>
			<div class="tabs">
				<router-link to="/about">
					<div class="tab">
						<v-icon>mdi-information-variant</v-icon>
						<span>{{ $t('main.about') }}</span>
					</div>
				</router-link>
				<router-link to="/statistics">
					<div class="tab">
						<v-icon>mdi-chart-timeline-variant</v-icon>
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
			<panel v-for="version in lazy_changelog" :key="version.version" icon="mdi-star">
				<template #title>{{ $t('changelog.version_n', [version.version_name]) }} ({{ $filters.date(version.date) }}) {{ translations[version.version] && translations[version.version].title ? ' — ' + translations[version.version].title : '' }}</template>
				<template #actions>
					<div class="button flat" @click="showChangelogDialog(version)">
						<v-icon>mdi-eye-outline</v-icon>
					</div>
				</template>
				<template #content>
					<div class="wrapper">
						<div class="content">
							<changelog-version :version="version" />
						</div>
					</div>
				</template>
			</panel>
		</template>
		<changelog-dialog v-model="changelogDialog" :changelog="changelogVersion" />
	</div>
</template>

<script setup lang="ts">

import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { locale } from '@/model/i18n'
import { emitter } from '@/model/vue'
import ChangelogDialog from './changelog-dialog.vue'
import ChangelogVersion from './changelog-version.vue'

const { t } = useI18n()

interface ChangelogEntry {
	version: number
	version_name: string
	date: number
	data: string
	forum_topic?: number | null
	forum_category?: number | null
	image: boolean
	active: boolean
}

const changelog = ref<ChangelogEntry[] | null>(null)
const changelogDialog = ref(false)
const changelogVersion = ref<ChangelogEntry | null>(null)
const translations = ref<Record<number, { title?: string }>>({})
const lazy_end = ref(2)

const lazy_changelog = computed(() => {
	if (!changelog.value) { return [] }
	return changelog.value.slice(0, lazy_end.value)
})

function showChangelogDialog(version: ChangelogEntry) {
	changelogVersion.value = version
	changelogDialog.value = true
}

function scroll() {
	if (!changelog.value) { return }
	if (lazy_changelog.value.length < changelog.value.length) {
		if (window.scrollY + window.innerHeight + 2000 > document.body.clientHeight) {
			lazy_end.value += 2
		}
	}
}

LeekWars.get<{ changelog: ChangelogEntry[] }>('changelog/get/' + locale).then(data => {
	changelog.value = data.changelog
	for (const c in changelog.value) {
		changelog.value[c].active = parseInt(c, 10) < 2 ? true : false
	}
	let lw_version = parseInt(LeekWars.normal_version.replace(/\./g, ''), 10)
	if (LeekWars.DEV || store.getters.admin) {
		lw_version++
	}
	if (changelog.value[0].version !== lw_version) {
		changelog.value.unshift({
			active: true,
			image: true,
			version: lw_version,
			version_name: LeekWars.normal_version.replace(/\.(\d+)$/, (_, m) => '.' + (parseInt(m, 10) + 1)).replace(/\.(\d)$/, '$1'),
			date: Date.now() / 1000,
			data: 'changelog_' + lw_version
		})
	}
	LeekWars.setTitle(t('main.changelog'))
	emitter.emit('loaded')
})
window.addEventListener('scroll', scroll)

import(`@/component/changelog/changelog.${locale}.yaml`).then((module: { default: Record<number, { title?: string }> }) => {
	translations.value = module.default
})

onUnmounted(() => {
	window.removeEventListener('scroll', scroll)
})

</script>

<style lang="scss" scoped>

.changelog-page {
	font-size: 16px;
}
.change {
	padding: 0 10px;
}
.wrapper {
	background: rgba(100,100,100,0.1);
}
.changelog-page :deep(a) {
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