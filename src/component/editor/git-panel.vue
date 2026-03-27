<template lang="html">
	<div class="git-panel">
		<!-- Sélecteur de repo -->
		<div class="git-header">
			<div class="git-repo-selector">
				<v-icon class="git-icon">mdi-source-branch</v-icon>
				<select v-model="selectedRepo" class="repo-select" @change="refreshStatus">
					<option value="">{{ $t('select_repo') }}</option>
					<option v-for="repo in repos" :key="repo.folder" :value="repo.folder">{{ repo.name || '/' }}</option>
				</select>
				<v-icon v-if="loading" class="spin">mdi-sync</v-icon>
			</div>
			<div class="git-actions">
				<v-icon :title="$t('refresh')" @click="refreshStatus" class="action-btn">mdi-refresh</v-icon>
				<v-icon :title="$t('history')" @click="showHistory = !showHistory" :class="{active: showHistory}" class="action-btn">mdi-history</v-icon>
			</div>
		</div>

		<template v-if="selectedRepo !== '' && !showHistory">
			<!-- Zone de commit -->
			<div class="commit-area">
				<div class="commit-input-row">
					<input v-model="commitMessage" :placeholder="$t('commit_message')" class="commit-input" @keyup.enter="commit" @keyup.stop>
					<v-icon :title="$t('commit')" class="commit-btn" :class="{disabled: !canCommit}" @click="commit">mdi-check</v-icon>
				</div>
			</div>

			<div class="changes-scroll">
				<!-- Fichiers staged -->
				<div v-if="stagedChanges.length" class="changes-section">
					<div class="section-header" @click="stagedExpanded = !stagedExpanded">
						<v-icon>{{ stagedExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
						<span class="section-title">{{ $t('staged') }}</span>
						<span class="count">{{ stagedChanges.length }}</span>
						<v-icon :title="$t('unstage_all')" class="section-action" @click.stop="unstageAll">mdi-minus</v-icon>
					</div>
					<div v-if="stagedExpanded" class="file-list">
						<div v-for="change in stagedChanges" :key="'s-' + change.file" class="file-item" @click="showDiff(change, true)">
							<span :class="'status status-' + change.index.toLowerCase()">{{ change.index }}</span>
							<span class="filename">{{ change.file }}</span>
							<span class="file-actions">
								<v-icon :title="$t('unstage')" @click.stop="unstage(change)">mdi-minus</v-icon>
							</span>
						</div>
					</div>
				</div>

				<!-- Fichiers non staged -->
				<div v-if="unstagedChanges.length" class="changes-section">
					<div class="section-header" @click="unstagedExpanded = !unstagedExpanded">
						<v-icon>{{ unstagedExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
						<span class="section-title">{{ $t('changes') }}</span>
						<span class="count">{{ unstagedChanges.length }}</span>
						<v-icon :title="$t('stage_all')" class="section-action" @click.stop="stageAll">mdi-plus</v-icon>
						<v-icon :title="$t('discard_all')" class="section-action" @click.stop="discardAll">mdi-undo</v-icon>
					</div>
					<div v-if="unstagedExpanded" class="file-list">
						<div v-for="change in unstagedChanges" :key="'u-' + change.file" class="file-item" @click="showDiff(change, false)">
							<span :class="'status status-' + statusChar(change)">{{ statusLabel(change) }}</span>
							<span class="filename">{{ change.file }}</span>
							<span class="file-actions">
								<v-icon :title="$t('stage')" @click.stop="stage(change)">mdi-plus</v-icon>
								<v-icon :title="$t('discard')" @click.stop="discard(change)">mdi-undo</v-icon>
							</span>
						</div>
					</div>
				</div>

				<!-- Merge en cours -->
				<div v-if="merging" class="merge-banner">
					<v-icon>mdi-source-merge</v-icon> {{ $t('merge_in_progress') }}
				</div>

				<!-- Pas de changements -->
				<div v-if="!stagedChanges.length && !unstagedChanges.length && !loading" class="no-changes">
					<v-icon>mdi-check-circle</v-icon> {{ $t('no_changes') }}
				</div>
			</div>

			<!-- Push/Pull (sticky en bas) -->
			<div v-if="branch" class="sync-bar">
				<span class="branch-name"><v-icon>mdi-source-branch</v-icon> {{ branch }}</span>
				<div class="sync-actions">
					<span v-if="behind > 0" class="sync-count behind" :title="$t('n_behind', [behind])">{{ behind }} <v-icon>mdi-arrow-down</v-icon></span>
					<span v-if="ahead > 0" class="sync-count ahead" :title="$t('n_ahead', [ahead])">{{ ahead }} <v-icon>mdi-arrow-up</v-icon></span>
					<v-icon :title="$t('pull')" class="action-btn" @click="pull">mdi-arrow-down-bold</v-icon>
					<v-icon :title="$t('push')" class="action-btn" @click="push">mdi-arrow-up-bold</v-icon>
				</div>
			</div>
		</template>

		<!-- Historique -->
		<git-history v-if="showHistory && selectedRepo !== ''" :folder="selectedRepo" @show-diff="$emit('show-diff', $event)" />

		<!-- Pas de repo sélectionné -->
		<div v-if="selectedRepo === '' && repos.length === 0 && !loading" class="no-repo">
			<p>{{ $t('no_git_repo') }}</p>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { fileSystem } from '@/model/filesystem'
	import { i18n, mixins } from '@/model/i18n'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import GitHistory from './git-history.vue'
	import { emitter } from '@/model/vue'

	interface GitChange {
		file: string
		index: string
		worktree: string
		staged: boolean
	}

	@Options({
		name: 'git-panel',
		i18n: {},
		components: { GitHistory },
		mixins: [...mixins],
		emits: ['show-diff']
	})
	export default class GitPanel extends Vue {
		repos: {folder: string, name: string}[] = []
		selectedRepo: string = ''
		changes: GitChange[] = []
		commitMessage: string = ''
		loading: boolean = false
		showHistory: boolean = false
		stagedExpanded: boolean = true
		unstagedExpanded: boolean = true
		merging: boolean = false
		ahead: number = 0
		behind: number = 0
		branch: string = ''

		get stagedChanges(): GitChange[] {
			return this.changes.filter(c => c.staged)
		}
		get unstagedChanges(): GitChange[] {
			return this.changes.filter(c => !c.staged || c.worktree !== ' ')
				.filter(c => c.worktree !== ' ' || c.index === '?')
				.map(c => {
					if (c.index === '?') return c // Untracked
					return { ...c, staged: false }
				})
		}
		get canCommit(): boolean {
			return this.stagedChanges.length > 0 && this.commitMessage.trim() !== ''
		}

		refreshDebounceTimer: ReturnType<typeof setTimeout> | null = null

		mounted() {
			this.loadRepos()
			emitter.on('git-file-changed', this.debouncedRefresh)
		}

		beforeUnmount() {
			emitter.off('git-file-changed', this.debouncedRefresh)
			if (this.refreshDebounceTimer) clearTimeout(this.refreshDebounceTimer)
		}

		debouncedRefresh() {
			if (this.refreshDebounceTimer) clearTimeout(this.refreshDebounceTimer)
			this.refreshDebounceTimer = setTimeout(() => {
				this.refreshStatus()
			}, 1000)
		}

		async loadRepos() {
			this.loading = true
			try {
				const data = await LeekWars.post('git/repos')
				this.repos = data.repos
				// Restaurer la sélection
				const saved = localStorage.getItem('editor/git-repo')
				if (saved && this.repos.find(r => r.folder === saved)) {
					this.selectedRepo = saved
					this.refreshStatus()
				} else if (this.repos.length === 1) {
					this.selectedRepo = this.repos[0].folder
					this.refreshStatus()
				}
			} catch (e) {
				// Pas de repos
			} finally {
				this.loading = false
			}
		}

		async refreshStatus() {
			if (this.selectedRepo === '') return
			localStorage.setItem('editor/git-repo', this.selectedRepo)
			this.loading = true
			try {
				const data = await LeekWars.post('git/status', { folder: this.selectedRepo })
				this.changes = data.changes
				this.merging = data.merging
				this.ahead = data.ahead
				this.behind = data.behind
				this.branch = data.branch
				// Mettre à jour le statut git global pour les indicateurs dans l'arbre
				this.updateGitStatusMap()
			} catch (e) {
				this.changes = []
			} finally {
				this.loading = false
			}
		}

		async stage(change: GitChange) {
			await LeekWars.post('git/stage', { folder: this.selectedRepo, files: JSON.stringify([change.file]) })
			this.refreshStatus()
		}

		async unstage(change: GitChange) {
			await LeekWars.post('git/unstage', { folder: this.selectedRepo, files: JSON.stringify([change.file]) })
			this.refreshStatus()
		}

		async stageAll() {
			await LeekWars.post('git/stage-all', { folder: this.selectedRepo })
			this.refreshStatus()
		}

		async unstageAll() {
			await LeekWars.post('git/unstage-all', { folder: this.selectedRepo })
			this.refreshStatus()
		}

		async discard(change: GitChange) {
			await LeekWars.post('git/discard', { folder: this.selectedRepo, files: JSON.stringify([change.file]) })
			this.refreshStatus()
		}

		async discardAll() {
			const files = this.unstagedChanges.map(c => c.file)
			await LeekWars.post('git/discard', { folder: this.selectedRepo, files: JSON.stringify(files) })
			this.refreshStatus()
		}

		async commit() {
			if (!this.canCommit) return
			try {
				await LeekWars.post('git/commit', { folder: this.selectedRepo, message: this.commitMessage })
				this.commitMessage = ''
				this.refreshStatus()
			} catch (e) {
				// Erreur
			}
		}

		async push() {
			this.loading = true
			try {
				await LeekWars.post('git/push', { folder: this.selectedRepo })
				this.refreshStatus()
			} catch (e) {
				// Erreur push
			} finally {
				this.loading = false
			}
		}

		async pull() {
			this.loading = true
			try {
				const data = await LeekWars.post('git/pull', { folder: this.selectedRepo })
				if (data.conflicts) {
					// TODO: notification conflits
				}
				this.refreshStatus()
			} catch (e) {
				// Erreur pull
			} finally {
				this.loading = false
			}
		}

		updateGitStatusMap() {
			const status: {[path: string]: string} = {}
			const prefix = this.selectedRepo ? this.selectedRepo + '/' : ''
			for (const change of this.changes) {
				const fullPath = prefix + change.file
				// Priorité : worktree > index
				if (change.worktree !== ' ') {
					status[fullPath] = change.worktree === '?' ? 'U' : change.worktree
				} else if (change.index !== ' ') {
					status[fullPath] = change.index
				}
			}
			fileSystem.gitStatus = status
		}

		showDiff(change: GitChange, staged: boolean) {
			this.$emit('show-diff', { folder: this.selectedRepo, file: change.file, staged })
		}

		statusChar(change: GitChange): string {
			if (change.index === '?') return '?'
			return change.worktree.toLowerCase()
		}

		statusLabel(change: GitChange): string {
			if (change.index === '?') return '?'
			return change.worktree
		}
	}
</script>

<style lang="scss" scoped>
.git-panel {
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	font-size: 13px;
}
.git-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 4px 8px;
	border-bottom: 1px solid var(--border);
	flex-shrink: 0;
}
.git-repo-selector {
	display: flex;
	align-items: center;
	gap: 4px;
	flex: 1;
}
.git-icon {
	font-size: 18px;
	opacity: 0.7;
}
.repo-select {
	background: transparent;
	border: 1px solid var(--border);
	border-radius: 3px;
	color: inherit;
	padding: 2px 4px;
	font-size: 12px;
	flex: 1;
	min-width: 0;
}
.git-actions {
	display: flex;
	gap: 2px;
}
.action-btn {
	font-size: 18px;
	padding: 2px;
	cursor: pointer;
	border-radius: 3px;
	opacity: 0.7;
	&:hover { opacity: 1; background: var(--pure-white); }
	&.active { opacity: 1; }
}
.commit-area {
	padding: 6px 8px;
	border-bottom: 1px solid var(--border);
	flex-shrink: 0;
}
.commit-input-row {
	display: flex;
	align-items: center;
	gap: 4px;
}
.commit-input {
	flex: 1;
	background: var(--background);
	border: 1px solid var(--border);
	border-radius: 3px;
	color: inherit;
	padding: 4px 6px;
	font-size: 12px;
	&:focus { border-color: var(--text-color-secondary); outline: none; }
}
.commit-btn {
	font-size: 20px;
	cursor: pointer;
	color: #4caf50;
	&.disabled { opacity: 0.3; cursor: default; }
	&:not(.disabled):hover { color: #66bb6a; }
}
.changes-scroll {
	flex: 1;
	overflow-y: auto;
	min-height: 0;
}
.changes-section {
}
.section-header {
	display: flex;
	align-items: center;
	padding: 3px 8px;
	cursor: pointer;
	font-weight: 500;
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	&:hover { background: var(--pure-white); }
	.v-icon { font-size: 16px; }
}
.section-title {
	flex: 1;
	margin-left: 2px;
}
.count {
	background: var(--text-color-secondary);
	color: white;
	border-radius: 8px;
	padding: 0 5px;
	font-size: 10px;
	margin-right: 4px;
}
.section-action {
	font-size: 16px !important;
	opacity: 0.5;
	&:hover { opacity: 1; }
}
.file-list {
	overflow-y: auto;
}
.file-item {
	display: flex;
	align-items: center;
	padding: 2px 8px 2px 24px;
	cursor: pointer;
	&:hover {
		background: var(--pure-white);
		.file-actions { visibility: visible; }
	}
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
	&.status-\? { color: #73c991; }
}
.filename {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 12px;
}
.file-actions {
	display: flex;
	visibility: hidden;
	gap: 2px;
	.v-icon {
		font-size: 16px;
		opacity: 0.7;
		&:hover { opacity: 1; }
	}
}
.merge-banner {
	padding: 6px 8px;
	background: #e8a838;
	color: white;
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	flex-shrink: 0;
}
.sync-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 4px 8px;
	border-top: 1px solid var(--border);
	flex-shrink: 0;
	font-size: 12px;
}
.branch-name {
	display: flex;
	align-items: center;
	gap: 2px;
	.v-icon { font-size: 14px; }
}
.sync-actions {
	display: flex;
	align-items: center;
	gap: 4px;
}
.sync-count {
	display: flex;
	align-items: center;
	font-size: 11px;
	.v-icon { font-size: 12px; }
	&.ahead { color: #73c991; }
	&.behind { color: #e8a838; }
}
.no-changes {
	padding: 16px;
	text-align: center;
	opacity: 0.6;
	.v-icon { font-size: 16px; color: #4caf50; }
}
.no-repo {
	padding: 16px;
	text-align: center;
	opacity: 0.6;
	font-size: 12px;
}
.spin {
	animation: spin 1s linear infinite;
}
@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>
