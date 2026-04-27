<template lang="html">
	<div class="git-history">
		<div v-if="loading && !commits.length" class="loading">
			<v-icon class="spin">mdi-sync</v-icon>
		</div>

		<div v-for="commit in commits" :key="commit.hash" class="commit-item" :class="{expanded: expandedCommit === commit.hash}" @click="toggleCommit(commit)">
			<div class="commit-header">
				<div class="commit-message">{{ commit.message }}</div>
				<div class="commit-meta">
					<span class="commit-hash">{{ commit.short_hash }}</span>
					<span class="commit-date">{{ formatDate(commit.date) }}</span>
				</div>
			</div>

			<div v-if="expandedCommit === commit.hash" class="commit-details">
				<div v-if="commitFiles[commit.hash]" class="commit-files">
					<div v-for="f in commitFiles[commit.hash]" :key="f.file" class="commit-file" @click.stop="showCommitDiff(commit, f)">
						<span :class="'status status-' + f.status.toLowerCase()">{{ f.status }}</span>
						<span class="filename">{{ f.file }}</span>
					</div>
				</div>
				<div v-else class="loading-files">
					<v-icon class="spin">mdi-sync</v-icon>
				</div>
			</div>
		</div>

		<div v-if="hasMore && !loading" class="load-more" @click="loadMore">
			{{ $t('load_more') }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { mixins } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { emitter } from '@/model/vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

interface Commit {
	hash: string
	short_hash: string
	message: string
	author: string
	email: string
	date: number
}

defineOptions({ name: 'git-history', i18n: {}, mixins: [...mixins] })

const props = defineProps<{
	folder?: string
}>()

const emit = defineEmits<{
	'show-diff': [event: { folder: string | undefined, hash: string, file: string }]
}>()

const commits = ref<Commit[]>([])
const total = ref(0)
const loading = ref(false)
const expandedCommit = ref('')
const commitFiles = reactive<{[hash: string]: {status: string, file: string}[]}>({})

const hasMore = computed<boolean>(() => commits.value.length < total.value)

onMounted(() => {
	loadCommits()
	emitter.on('git-history-refresh', refresh)
})

onBeforeUnmount(() => {
	emitter.off('git-history-refresh', refresh)
})

function refresh() {
	commits.value = []
	total.value = 0
	expandedCommit.value = ''
	for (const k in commitFiles) delete commitFiles[k]
	loadCommits()
}

watch(() => props.folder, () => {
	commits.value = []
	total.value = 0
	expandedCommit.value = ''
	for (const k in commitFiles) delete commitFiles[k]
	loadCommits()
})

async function loadCommits() {
	loading.value = true
	try {
		const data = await LeekWars.post('git/log', { folder: props.folder, count: 50, offset: 0 })
		commits.value = data.commits
		total.value = data.total
	} catch (e) {
		// Pas de commits
	} finally {
		loading.value = false
	}
}

async function loadMore() {
	loading.value = true
	try {
		const data = await LeekWars.post('git/log', { folder: props.folder, count: 50, offset: commits.value.length })
		commits.value.push(...data.commits)
	} catch (e) {
		// Erreur
	} finally {
		loading.value = false
	}
}

async function toggleCommit(commit: Commit) {
	if (expandedCommit.value === commit.hash) {
		expandedCommit.value = ''
		return
	}
	expandedCommit.value = commit.hash
	if (!commitFiles[commit.hash]) {
		try {
			const data = await LeekWars.post('git/commit-files', { folder: props.folder, hash: commit.hash })
			commitFiles[commit.hash] = data.files
		} catch (e) {
			commitFiles[commit.hash] = []
		}
	}
}

function showCommitDiff(commit: Commit, file: {status: string, file: string}) {
	emit('show-diff', { folder: props.folder, hash: commit.hash, file: file.file })
}

function formatDate(timestamp: number): string {
	return LeekWars.formatDateTime(timestamp) + ' (' + LeekWars.formatDuration(timestamp) + ')'
}
</script>

<style lang="scss" scoped>
.git-history {
	overflow-y: auto;
	flex: 1;
	min-height: 0;
}
.commit-item {
	border-bottom: 1px solid var(--border);
	cursor: pointer;
	&:hover { background: var(--pure-white); }
	&.expanded { background: var(--pure-white); }
}
.commit-header {
	padding: 5px 10px;
}
.commit-message {
	font-size: 14px;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.commit-meta {
	display: flex;
	gap: 8px;
	font-size: 12px;
	opacity: 0.6;
	margin-top: 2px;
}
.commit-hash {
	font-family: monospace;
}
.commit-details {
	padding: 0 10px 6px;
}
.commit-file {
	display: flex;
	align-items: center;
	padding: 5px 10px 5px 24px;
	font-size: 14px;
	border-radius: 3px;
	&:hover { background: rgba(128, 128, 128, 0.1); }
}
.status {
	width: 16px;
	height: 16px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	line-height: 16px;
	padding-top: 4px;
	font-weight: bold;
	border-radius: 2px;
	margin-right: 6px;
	flex-shrink: 0;
	&.status-m, &.status-M { color: #e8a838; }
	&.status-a, &.status-A { color: #73c991; }
	&.status-d, &.status-D { color: #e06c75; }
	&.status-r, &.status-R { color: #73c991; }
}
.filename {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.load-more {
	padding: 8px;
	text-align: center;
	cursor: pointer;
	font-size: 12px;
	opacity: 0.7;
	&:hover { opacity: 1; background: var(--pure-white); }
}
.loading, .loading-files {
	padding: 16px;
	text-align: center;
}
.spin {
	animation: spin 1s linear infinite;
}
@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>
