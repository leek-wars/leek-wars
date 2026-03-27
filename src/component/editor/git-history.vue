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

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { i18n, mixins } from '@/model/i18n'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'

	interface Commit {
		hash: string
		short_hash: string
		message: string
		author: string
		email: string
		date: number
	}

	@Options({ name: 'git-history', i18n: {}, mixins: [...mixins], emits: ['show-diff'] })
	export default class GitHistory extends Vue {
		@Prop() folder!: string

		commits: Commit[] = []
		total: number = 0
		loading: boolean = false
		expandedCommit: string = ''
		commitFiles: {[hash: string]: {status: string, file: string}[]} = {}

		get hasMore(): boolean {
			return this.commits.length < this.total
		}

		mounted() {
			this.loadCommits()
		}

		@Watch('folder')
		onFolderChange() {
			this.commits = []
			this.total = 0
			this.expandedCommit = ''
			this.commitFiles = {}
			this.loadCommits()
		}

		async loadCommits() {
			this.loading = true
			try {
				const data = await LeekWars.post('git/log', { folder: this.folder, count: 50, offset: 0 })
				this.commits = data.commits
				this.total = data.total
			} catch (e) {
				// Pas de commits
			} finally {
				this.loading = false
			}
		}

		async loadMore() {
			this.loading = true
			try {
				const data = await LeekWars.post('git/log', { folder: this.folder, count: 50, offset: this.commits.length })
				this.commits.push(...data.commits)
			} catch (e) {
				// Erreur
			} finally {
				this.loading = false
			}
		}

		async toggleCommit(commit: Commit) {
			if (this.expandedCommit === commit.hash) {
				this.expandedCommit = ''
				return
			}
			this.expandedCommit = commit.hash
			if (!this.commitFiles[commit.hash]) {
				try {
					const data = await LeekWars.post('git/commit-files', { folder: this.folder, hash: commit.hash })
					this.commitFiles[commit.hash] = data.files
				} catch (e) {
					this.commitFiles[commit.hash] = []
				}
			}
		}

		showCommitDiff(commit: Commit, file: {status: string, file: string}) {
			this.$emit('show-diff', { folder: this.folder, hash: commit.hash, file: file.file })
		}

		formatDate(timestamp: number): string {
			const date = new Date(timestamp * 1000)
			const now = new Date()
			const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

			if (diff < 60) return this.$t('just_now')
			if (diff < 3600) return this.$t('n_minutes_ago', [Math.floor(diff / 60)])
			if (diff < 86400) return this.$t('n_hours_ago', [Math.floor(diff / 3600)])
			if (diff < 2592000) return this.$t('n_days_ago', [Math.floor(diff / 86400)])

			return date.toLocaleDateString()
		}
	}
</script>

<style lang="scss" scoped>
.git-history {
	overflow-y: auto;
	flex: 1;
}
.commit-item {
	border-bottom: 1px solid var(--border);
	cursor: pointer;
	&:hover { background: var(--pure-white); }
	&.expanded { background: var(--pure-white); }
}
.commit-header {
	padding: 6px 8px;
}
.commit-message {
	font-size: 12px;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.commit-meta {
	display: flex;
	gap: 8px;
	font-size: 11px;
	opacity: 0.6;
	margin-top: 2px;
}
.commit-hash {
	font-family: monospace;
}
.commit-details {
	padding: 0 8px 6px;
}
.commit-file {
	display: flex;
	align-items: center;
	padding: 2px 8px;
	font-size: 12px;
	border-radius: 3px;
	&:hover { background: rgba(128, 128, 128, 0.1); }
}
.status {
	width: 14px;
	height: 14px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 10px;
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
