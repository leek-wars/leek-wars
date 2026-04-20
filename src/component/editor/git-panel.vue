<template lang="html">
	<div class="git-panel" :class="isDark ? 'theme--dark' : 'theme--light'">
		<!-- Sélecteur de repo + actions -->
		<div class="git-toolbar">
			<v-select v-model="selectedRepo" :items="repoItems" :placeholder="$t('select_repo')" density="compact" variant="solo-filled" flat hide-details class="repo-select" :theme="isDark ? 'dark' : 'light'" @update:model-value="refreshStatus">
				<template #prepend-inner>
					<v-icon size="small">mdi-source-branch</v-icon>
				</template>
				<template #append-inner>
					<v-icon v-if="loading" class="spin" size="small">mdi-sync</v-icon>
				</template>
			</v-select>
			<div class="action-btn" :title="$t('refresh')" @click="refreshStatus">
				<v-icon>mdi-refresh</v-icon>
			</div>
			<div class="action-btn" :title="$t('history')" :class="{active: showHistory}" @click="showHistory = !showHistory">
				<v-icon>mdi-history</v-icon>
			</div>
			<v-menu v-model="actionsMenuOpen" location="bottom end" offset="4">
				<template #activator="{ props: p }">
					<div v-bind="p" :title="$t('more_actions')" class="action-btn" :class="{active: actionsMenuOpen}">
						<v-icon>mdi-dots-vertical</v-icon>
					</div>
				</template>
				<v-list density="compact">
					<v-list-item prepend-icon="mdi-undo-variant" @click="undoLastCommit">
						<v-list-item-title>{{ $t('undo_last_commit') }}</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
		</div>

		<template v-if="selectedRepo !== '' && !showHistory">
			<!-- Zone de commit / continue rebase -->
			<div class="commit-area">
				<template v-if="rebasing">
					<div class="commit-input rebase-label">
						<v-icon class="rebase-label-icon">mdi-source-commit</v-icon>
						{{ $t('rebase_in_progress_short') }}
					</div>
					<div class="commit-btn abort-btn" :title="$t('rebase_abort')" @click="rebaseAbort">
						<v-icon>mdi-close</v-icon>
					</div>
					<div class="commit-btn" :class="{disabled: conflictChanges.length > 0}" :title="$t('rebase_continue')" @click="rebaseContinue">
						<v-icon>mdi-play</v-icon>
					</div>
				</template>
				<template v-else>
					<v-text-field v-model="commitMessage" :placeholder="$t('commit_message')" density="compact" variant="solo-filled" flat hide-details class="commit-input" :theme="isDark ? 'dark' : 'light'" @keyup.enter="commit" @keyup.stop />
					<div class="commit-btn" :class="{disabled: !canCommit}" :title="$t('commit')" @click="commit">
						<v-icon>mdi-check</v-icon>
					</div>
				</template>
			</div>

			<div class="changes-scroll">
				<!-- Merge en cours -->
				<div v-if="merging" class="merge-banner">
					<v-icon>mdi-source-merge</v-icon> {{ $t('merge_in_progress') }}
					<div class="merge-abort" @click="mergeAbort" :title="$t('merge_abort')">
						<v-icon>mdi-close</v-icon>
					</div>
				</div>

				<!-- Fichiers en conflit -->
				<div v-if="conflictChanges.length" class="changes-section conflicts-section">
					<div class="section-header conflict-header" @click="conflictsExpanded = !conflictsExpanded">
						<v-icon>{{ conflictsExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
						<span class="section-title">{{ $t('conflicts') }}</span>
						<span class="count conflict-count">{{ conflictChanges.length }}</span>
					</div>
					<div v-if="conflictsExpanded" class="file-list">
						<div v-for="change in conflictChanges" :key="'c-' + change.file" class="file-item conflict-item" @click="openConflict(change)">
							<span class="status status-conflict">!</span>
							<span class="filename">{{ change.file }}</span>
							<span class="file-actions">
								<v-icon :title="$t('stage')" @click.stop="stage(change)">mdi-check</v-icon>
							</span>
						</div>
					</div>
				</div>

				<!-- Fichiers staged -->
				<div v-if="stagedChanges.length" class="changes-section">
					<div class="section-header" @click="stagedExpanded = !stagedExpanded">
						<v-icon>{{ stagedExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
						<span class="section-title">{{ $t('staged') }}</span>
						<span class="count">{{ stagedChanges.length }}</span>
						<v-icon :title="$t('unstage_all')" class="section-action" @click.stop="unstageAll">mdi-minus</v-icon>
					</div>
					<div v-if="stagedExpanded" class="file-list">
						<div v-for="change in stagedChanges" :key="'s-' + change.file" class="file-item" :class="{ active: isActiveDiff(change, true) }" @click="showDiff(change, true)">
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
						<div v-for="change in unstagedChanges" :key="'u-' + change.file" class="file-item" :class="{ active: isActiveDiff(change, false) }" @click="showDiff(change, false)">
							<span :class="'status status-' + statusChar(change)">{{ statusLabel(change) }}</span>
							<span class="filename">{{ change.file }}</span>
							<span class="file-actions">
								<v-icon :title="$t('stage')" @click.stop="stage(change)">mdi-plus</v-icon>
								<v-icon :title="$t('discard')" @click.stop="discard(change)">mdi-undo</v-icon>
							</span>
						</div>
					</div>
				</div>

				<!-- Pas de changements -->
				<div v-if="!stagedChanges.length && !unstagedChanges.length && !conflictChanges.length && !loading" class="no-changes">
					<v-icon>mdi-check-circle</v-icon> {{ $t('no_changes') }}
				</div>
			</div>

		</template>

		<!-- Historique -->
		<git-history v-if="showHistory && selectedRepo !== ''" :folder="selectedRepo" @show-diff="$emit('show-diff', $event)" />

		<!-- Messages de sortie git (visibles même en mode historique) -->
		<div v-if="syncError && selectedRepo !== ''" class="sync-error">
			<span class="sync-error-text">{{ syncError }}</span>
			<v-icon class="sync-error-close" @click="syncError = ''">mdi-close</v-icon>
		</div>
		<div v-if="syncInfo && selectedRepo !== ''" class="sync-info">
			<span class="sync-info-text">{{ syncInfo }}</span>
			<v-icon class="sync-info-close" @click="syncInfo = ''">mdi-close</v-icon>
		</div>

		<!-- Push/Pull (sticky en bas, visible même en mode historique) -->
		<div v-if="branch && selectedRepo !== ''" class="sync-bar">
			<v-menu v-model="branchMenuOpen" location="top start" offset="6">
				<template #activator="{ props: activatorProps }">
					<div v-bind="activatorProps" class="branch-picker">
						<v-icon>mdi-source-branch</v-icon>
						<span class="branch-name">{{ branch }}</span>
						<v-icon class="branch-caret">mdi-menu-down</v-icon>
					</div>
				</template>
				<v-list density="compact" class="branch-list">
					<v-list-item v-for="b in branches" :key="'l-' + b" :active="b === branch" @click="checkoutBranch(b)">
						<template #prepend>
							<v-icon v-if="b === branch">mdi-check</v-icon>
							<v-icon v-else>mdi-source-branch</v-icon>
						</template>
						<v-list-item-title>{{ b }}</v-list-item-title>
						<template v-if="b !== branch" #append>
							<v-icon class="branch-delete" @click.stop="deleteBranch(b)">mdi-delete-outline</v-icon>
						</template>
					</v-list-item>
					<template v-if="remoteBranches.length > 0">
						<v-divider />
						<v-list-subheader>{{ $t('remote_branches') }}</v-list-subheader>
						<v-list-item v-for="b in remoteBranches" :key="'r-' + b" prepend-icon="mdi-cloud-download-outline" class="remote-branch" @click="checkoutBranch(b)">
							<v-list-item-title>{{ b }}</v-list-item-title>
						</v-list-item>
					</template>
					<v-divider />
					<v-list-item prepend-icon="mdi-refresh" :disabled="fetching" @click.stop="fetchRemote">
						<v-list-item-title>{{ fetching ? $t('fetching') : $t('fetch') }}</v-list-item-title>
					</v-list-item>
					<v-list-item prepend-icon="mdi-plus" class="create-branch" @click="promptCreateBranch">
						<v-list-item-title>{{ $t('create_branch') }}</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
			<div class="sync-actions">
				<div class="pull-group" :class="{ disabled: !canPull }">
					<div class="sync-btn pull-main" :title="behind > 0 ? $t('n_behind', [behind]) + ' (' + (pullRebase ? $t('rebase') : $t('merge')) + ')' : $t('pull')" @click="canPull && pull()">
						<v-icon>mdi-arrow-down-bold</v-icon>
						<span v-if="behind > 0" class="count">{{ behind }}</span>
					</div>
					<v-menu v-model="pullStrategyOpen" location="top end" offset="6">
						<template #activator="{ props: p }">
							<div v-bind="p" class="pull-caret" :title="$t('pull_strategy')">
								<v-icon>mdi-menu-down</v-icon>
							</div>
						</template>
						<v-list density="compact">
							<v-list-item :active="!pullRebase" @click="setPullStrategy(false)">
								<template #prepend><v-icon>{{ !pullRebase ? 'mdi-check' : 'mdi-source-merge' }}</v-icon></template>
								<v-list-item-title>{{ $t('merge') }}</v-list-item-title>
							</v-list-item>
							<v-list-item :active="pullRebase" @click="setPullStrategy(true)">
								<template #prepend><v-icon>{{ pullRebase ? 'mdi-check' : 'mdi-source-commit' }}</v-icon></template>
								<v-list-item-title>{{ $t('rebase') }}</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-menu>
				</div>
				<div class="pull-group" :class="{ disabled: !canPush }">
					<div class="sync-btn pull-main" :class="{ 'push-force': pushForce }" :title="ahead > 0 ? $t('n_ahead', [ahead]) + ' (' + (pushForce ? $t('push_force') : $t('push')) + ')' : (pushForce ? $t('push_force') : $t('push'))" @click="canPush && push()">
						<v-icon>{{ pushForce ? 'mdi-arrow-up-bold-hexagon-outline' : 'mdi-arrow-up-bold' }}</v-icon>
						<span v-if="ahead > 0" class="count">{{ ahead }}</span>
					</div>
					<v-menu v-model="pushStrategyOpen" location="top end" offset="6">
						<template #activator="{ props: p }">
							<div v-bind="p" class="pull-caret" :title="$t('push_strategy')">
								<v-icon>mdi-menu-down</v-icon>
							</div>
						</template>
						<v-list density="compact">
							<v-list-item :active="!pushForce" @click="setPushStrategy(false)">
								<template #prepend><v-icon>{{ !pushForce ? 'mdi-check' : 'mdi-arrow-up-bold' }}</v-icon></template>
								<v-list-item-title>{{ $t('push') }}</v-list-item-title>
							</v-list-item>
							<v-list-item :active="pushForce" @click="setPushStrategy(true)">
								<template #prepend><v-icon>{{ pushForce ? 'mdi-check' : 'mdi-alert' }}</v-icon></template>
								<v-list-item-title>{{ $t('push_force') }}</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-menu>
				</div>
				<v-icon :title="$t('remote_settings')" class="action-btn" @click="showRemoteDialog = true">mdi-cog</v-icon>
			</div>
		</div>

		<!-- Pas de repo sélectionné -->
		<div v-if="selectedRepo === '' && repos.length === 0 && !loading" class="no-repo">
			<p>{{ $t('no_git_repo') }}</p>
		</div>

		<git-remote-dialog v-model="showRemoteDialog" :folder="selectedRepo" />
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { fileSystem } from '@/model/filesystem'
	import { i18n, mixins } from '@/model/i18n'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import GitHistory from './git-history.vue'
	import GitRemoteDialog from './git-remote-dialog.vue'
	import { gitCall } from './git-log'
	import { emitter } from '@/model/vue'
	import type { DiffTab } from './editor-tabs.vue'

	interface GitChange {
		file: string
		index: string
		worktree: string
		staged: boolean
		conflict?: boolean
	}

	@Options({
		name: 'git-panel',
		i18n: {},
		components: { GitHistory, GitRemoteDialog },
		mixins: [...mixins],
		emits: ['show-diff', 'show-merge']
	})
	export default class GitPanel extends Vue {
		@Prop({ default: 'leek-wars' }) theme!: string
		@Prop({ default: null }) activeDiff!: DiffTab | null
		repos: {folder: string, name: string}[] = []
		selectedRepo: string = ''
		changes: GitChange[] = []
		commitMessage: string = ''
		loading: boolean = false
		showHistory: boolean = false
		stagedExpanded: boolean = true
		unstagedExpanded: boolean = true
		merging: boolean = false
		rebasing: boolean = false
		conflictsExpanded: boolean = true
		ahead: number = 0
		behind: number = 0
		branch: string = ''
		hasRemote: boolean = false
		hasUpstream: boolean = false
		showRemoteDialog: boolean = false
		syncError: string = ''
		syncInfo: string = ''
		branches: string[] = []
		remoteBranches: string[] = []
		branchMenuOpen: boolean = false
		fetching: boolean = false
		pullStrategyOpen: boolean = false
		pullRebase: boolean = false
		pushStrategyOpen: boolean = false
		pushForce: boolean = false
		actionsMenuOpen: boolean = false

		get isDark(): boolean {
			return ['monokai', 'vs-dark', 'hc-black'].includes(this.theme)
		}
		get repoItems() {
			return this.repos.map(r => ({ title: r.name || '/', value: r.folder }))
		}
		get conflictChanges(): GitChange[] {
			return this.changes.filter(c => c.conflict)
		}
		get canPull(): boolean {
			if (!this.hasRemote) return false
			// Sync initial (pas encore d'upstream set) : on laisse pull pour récupérer l'historique distant.
			return this.behind > 0 || !this.hasUpstream
		}
		get canPush(): boolean {
			if (!this.hasRemote) return false
			if (this.ahead > 0) return true
			if (this.pushForce && this.behind > 0) return true
			// Sync initial : pas d'upstream, le push -u va créer la branche distante.
			return !this.hasUpstream && this.branch !== ''
		}
		get stagedChanges(): GitChange[] {
			return this.changes.filter(c => c.staged && !c.conflict)
		}
		get unstagedChanges(): GitChange[] {
			return this.changes.filter(c => !c.conflict)
				.filter(c => !c.staged || c.worktree !== ' ')
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
			emitter.on('git-repos-changed', this.loadRepos)
		}

		beforeUnmount() {
			emitter.off('git-file-changed', this.debouncedRefresh)
			emitter.off('git-repos-changed', this.loadRepos)
			if (this.refreshDebounceTimer) clearTimeout(this.refreshDebounceTimer)
		}

		async undoLastCommit() {
			this.actionsMenuOpen = false
			const msg = this.ahead === 0
				? this.$t('undo_last_commit_pushed_warn') as string
				: this.$t('undo_last_commit_confirm') as string
			if (!window.confirm(msg)) return
			this.syncError = ''
			this.syncInfo = ''
			try {
				await gitCall('git/undo-last-commit', { folder: this.selectedRepo })
				this.syncInfo = this.$t('undo_last_commit_done') as string
				await this.refreshStatus()
				emitter.emit('git-history-refresh')
				emitter.emit('reanalyze')
			} catch (e: any) {
				this.syncError = 'Undo: ' + this.gitErrorMessage(e)
			}
		}

		setPullStrategy(rebase: boolean) {
			this.pullRebase = rebase
			this.pullStrategyOpen = false
			if (this.selectedRepo !== '') {
				localStorage.setItem('editor/git-pull-rebase-' + this.selectedRepo, rebase ? '1' : '0')
			}
		}

		setPushStrategy(force: boolean) {
			this.pushForce = force
			this.pushStrategyOpen = false
			if (this.selectedRepo !== '') {
				localStorage.setItem('editor/git-push-force-' + this.selectedRepo, force ? '1' : '0')
			}
		}

		gitErrorMessage(e: any): string {
			const code = e?.error
			if (code === 'quota_size_exceeded') return this.$t('quota_size_exceeded') as string
			if (code === 'quota_files_exceeded') return this.$t('quota_files_exceeded') as string
			if (e?.quota_exceeded) return this.$t('quota_size_exceeded') as string
			return e?.details || code || 'error'
		}

		@Watch('selectedRepo')
		onSelectedRepoChange(repo: string) {
			if (repo === '') {
				this.changes = []
				this.branch = ''
				this.branches = []
				this.remoteBranches = []
				this.ahead = 0
				this.behind = 0
				this.hasRemote = false
				this.hasUpstream = false
				this.merging = false
				this.rebasing = false
				fileSystem.gitStatus = {}
				return
			}
			this.pullRebase = localStorage.getItem('editor/git-pull-rebase-' + repo) === '1'
			this.pushForce = localStorage.getItem('editor/git-push-force-' + repo) === '1'
		}

		lastFetchAt: { [repo: string]: number } = {}

		@Watch('branchMenuOpen')
		async onBranchMenuToggle(open: boolean) {
			if (!open) return
			// Si un fetch récent (< 60s) a déjà été fait, ne recharge que les branches locales
			const last = this.lastFetchAt[this.selectedRepo] || 0
			if (Date.now() - last < 60_000) {
				this.loadBranches()
			} else {
				this.fetchRemote()
			}
		}

		async fetchRemote() {
			if (this.fetching) return
			this.fetching = true
			try {
				await gitCall('git/fetch', { folder: this.selectedRepo })
				this.lastFetchAt[this.selectedRepo] = Date.now()
				await this.loadBranches()
			} catch (e) {
				await this.loadBranches()
			} finally {
				this.fetching = false
			}
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
				const data = await gitCall('git/repos')
				this.repos = data.repos
				const repos: {[path: string]: boolean} = {}
				for (const r of this.repos) { repos[r.folder] = true }
				fileSystem.gitRepos = repos
				const saved = localStorage.getItem('editor/git-repo')
				if (saved && this.repos.find(r => r.folder === saved)) {
					this.selectedRepo = saved
					this.refreshStatus()
				} else if (this.repos.length === 1) {
					this.selectedRepo = this.repos[0].folder
					this.refreshStatus()
				}
			} catch (e) {
			} finally {
				this.loading = false
			}
		}

		async refreshStatus() {
			if (this.selectedRepo === '') return
			localStorage.setItem('editor/git-repo', this.selectedRepo)
			this.loading = true
			try {
				const data = await gitCall('git/status', { folder: this.selectedRepo })
				this.changes = data.changes
				this.merging = data.merging
				this.rebasing = !!data.rebasing
				this.ahead = data.ahead
				this.behind = data.behind
				this.branch = data.branch
				this.hasRemote = !!data.has_remote
				this.hasUpstream = !!data.has_upstream
				// Mettre à jour le statut git global pour les indicateurs dans l'arbre
				this.updateGitStatusMap()
			} catch (e) {
				this.changes = []
			} finally {
				this.loading = false
			}
		}

		async stage(change: GitChange) {
			await gitCall('git/stage', { folder: this.selectedRepo, files: JSON.stringify([change.file]) })
			this.refreshStatus()
		}

		async unstage(change: GitChange) {
			await gitCall('git/unstage', { folder: this.selectedRepo, files: JSON.stringify([change.file]) })
			this.refreshStatus()
		}

		async stageAll() {
			await gitCall('git/stage-all', { folder: this.selectedRepo })
			this.refreshStatus()
		}

		async unstageAll() {
			await gitCall('git/unstage-all', { folder: this.selectedRepo })
			this.refreshStatus()
		}

		async discard(change: GitChange) {
			if (change.index === '?') {
				if (!confirm(this.$t('discard_untracked_confirm', [change.file]) as string)) return
			}
			await gitCall('git/discard', { folder: this.selectedRepo, files: JSON.stringify([change.file]) })
			emitter.emit('close-diff', { folder: this.selectedRepo, file: change.file })
			if (change.index === '?') {
				this.removeDeletedFiles([change.file])
			} else {
				this.reloadFiles([change.file])
			}
			await this.refreshStatus()
			emitter.emit('reanalyze')
		}

		async discardAll() {
			const untracked = this.unstagedChanges.filter(c => c.index === '?')
			if (untracked.length > 0) {
				if (!confirm(this.$t('discard_untracked_all_confirm', [untracked.length]) as string)) return
			}
			const files = this.unstagedChanges.map(c => c.file)
			await gitCall('git/discard', { folder: this.selectedRepo, files: JSON.stringify(files) })
			for (const file of files) {
				emitter.emit('close-diff', { folder: this.selectedRepo, file })
			}
			const untrackedFiles = untracked.map(c => c.file)
			const trackedFiles = files.filter(f => !untrackedFiles.includes(f))
			if (untrackedFiles.length) this.removeDeletedFiles(untrackedFiles)
			if (trackedFiles.length) this.reloadFiles(trackedFiles)
			await this.refreshStatus()
			emitter.emit('reanalyze')
		}

		async commit() {
			if (!this.canCommit) return
			const wasMerging = this.merging
			try {
				await gitCall('git/commit', { folder: this.selectedRepo, message: this.commitMessage })
				this.commitMessage = ''
				if (wasMerging) {
					// Fermer les onglets merge après un commit de merge
					emitter.emit('close-merge-tabs', { folder: this.selectedRepo })
				}
				this.refreshStatus()
			} catch (e) {
			}
		}

		async push() {
			if (this.pushForce && !window.confirm(this.$t('push_force_confirm') as string)) return
			this.loading = true
			this.syncError = ''
			this.syncInfo = ''
			try {
				const data = await gitCall('git/push', { folder: this.selectedRepo, force: this.pushForce })
				this.syncInfo = 'Push: ' + (data.message || 'OK')
				this.refreshStatus()
			} catch (e: any) {
				this.syncError = 'Push: ' + this.gitErrorMessage(e)
			} finally {
				this.loading = false
			}
		}

		async pull() {
			this.loading = true
			this.syncError = ''
			this.syncInfo = ''
			try {
				const data = await gitCall('git/pull', { folder: this.selectedRepo, rebase: this.pullRebase })
				this.syncInfo = 'Pull: ' + (data.message || 'OK')
				await Promise.all([fileSystem.reload(), this.refreshStatus()])
				if (data.changed_files) fileSystem.reloadChangedFiles(this.selectedRepo, data.changed_files)
				emitter.emit('reanalyze')
				if (data.conflicts && this.conflictChanges.length > 0) {
					this.reloadFiles(this.conflictChanges.map(c => c.file))
					emitter.emit('open-merge', { folder: this.selectedRepo, file: this.conflictChanges[0].file })
				}
			} catch (e: any) {
				this.syncError = 'Pull: ' + this.gitErrorMessage(e)
			} finally {
				this.loading = false
			}
		}

		async loadBranches() {
			try {
				const data = await gitCall('git/branches', { folder: this.selectedRepo })
				this.branches = data.branches || []
				this.remoteBranches = data.remote_branches || []
			} catch (e) {
				this.branches = []
				this.remoteBranches = []
			}
		}

		async checkoutBranch(branch: string) {
			this.branchMenuOpen = false
			if (branch === this.branch) return
			this.syncError = ''
			this.syncInfo = ''
			this.loading = true
			try {
				const data = await gitCall('git/checkout', { folder: this.selectedRepo, branch })
				this.syncInfo = 'Checkout: ' + branch
				await Promise.all([fileSystem.reload(), this.refreshStatus()])
				if (data.changed_files) fileSystem.reloadChangedFiles(this.selectedRepo, data.changed_files)
				emitter.emit('reanalyze')
			} catch (e: any) {
				this.syncError = 'Checkout: ' + this.gitErrorMessage(e)
			} finally {
				this.loading = false
			}
		}

		async promptCreateBranch() {
			this.branchMenuOpen = false
			const name = window.prompt(this.$t('new_branch_name') as string, '')
			if (!name) return
			const trimmed = name.trim()
			if (!trimmed) return
			this.syncError = ''
			this.syncInfo = ''
			this.loading = true
			try {
				await gitCall('git/create-branch', { folder: this.selectedRepo, branch: trimmed })
				this.syncInfo = 'Branch created: ' + trimmed
				await this.refreshStatus()
			} catch (e: any) {
				this.syncError = 'Create branch: ' + this.gitErrorMessage(e)
			} finally {
				this.loading = false
			}
		}

		async deleteBranch(branch: string) {
			this.branchMenuOpen = false
			if (!window.confirm(this.$t('delete_branch_confirm', [branch]) as string)) return
			this.syncError = ''
			this.syncInfo = ''
			try {
				await gitCall('git/delete-branch', { folder: this.selectedRepo, branch, force: false })
				this.syncInfo = this.$t('delete_branch_done', [branch]) as string
			} catch (e: any) {
				const details = e.details || e.error || 'error'
				if (details.includes('not fully merged')) {
					if (window.confirm(this.$t('delete_branch_force_confirm', [branch]) as string)) {
						try {
							await gitCall('git/delete-branch', { folder: this.selectedRepo, branch, force: true })
							this.syncInfo = this.$t('delete_branch_done', [branch]) as string
						} catch (e2: any) {
							this.syncError = this.gitErrorMessage(e2)
						}
					}
				} else {
					this.syncError = this.gitErrorMessage(e)
				}
			}
		}

		async mergeAbort() {
			this.loading = true
			try {
				await gitCall('git/merge-abort', { folder: this.selectedRepo })
				emitter.emit('close-merge-tabs', { folder: this.selectedRepo })
				const conflictFiles = this.conflictChanges.map(c => c.file)
				this.reloadFiles(conflictFiles)
				await this.refreshStatus()
				emitter.emit('reanalyze')
			} catch (e) {
			} finally {
				this.loading = false
			}
		}

		async rebaseContinue() {
			if (this.conflictChanges.length > 0) return
			this.loading = true
			this.syncError = ''
			this.syncInfo = ''
			try {
				const data = await gitCall('git/rebase-continue', { folder: this.selectedRepo })
				this.syncInfo = 'Rebase: ' + (data.message || 'OK')
				await Promise.all([fileSystem.reload(), this.refreshStatus()])
				if (data.changed_files) fileSystem.reloadChangedFiles(this.selectedRepo, data.changed_files)
				emitter.emit('reanalyze')
			} catch (e: any) {
				this.syncError = 'Rebase continue: ' + this.gitErrorMessage(e)
			} finally {
				this.loading = false
			}
		}

		async rebaseAbort() {
			if (!window.confirm(this.$t('rebase_abort_confirm') as string)) return
			this.loading = true
			this.syncError = ''
			this.syncInfo = ''
			try {
				const data = await gitCall('git/rebase-abort', { folder: this.selectedRepo })
				this.syncInfo = this.$t('rebase_aborted') as string
				await Promise.all([fileSystem.reload(), this.refreshStatus()])
				if (data.changed_files) fileSystem.reloadChangedFiles(this.selectedRepo, data.changed_files)
				emitter.emit('reanalyze')
			} catch (e: any) {
				this.syncError = 'Rebase abort: ' + this.gitErrorMessage(e)
			} finally {
				this.loading = false
			}
		}

		openConflict(change: GitChange) {
			const fullPath = (this.selectedRepo ? this.selectedRepo + '/' : '') + change.file
			const ai = fileSystem.getAIByPath(fullPath)
			if (ai) {
				this.$router.push('/editor/' + ai.path)
			}
		}

		reloadFiles(files: string[]) {
			for (const file of files) {
				const fullPath = (this.selectedRepo ? this.selectedRepo + '/' : '') + file
				const ai = fileSystem.getAIByPath(fullPath)
				if (ai) {
					gitCall('git/read-file', { folder: this.selectedRepo, file }).then((data: any) => {
						ai.code = data.content || ''
						ai.modified = false
						emitter.emit('file-reloaded', ai.path)
					})
				}
			}
		}

		removeDeletedFiles(files: string[]) {
			for (const file of files) {
				const fullPath = (this.selectedRepo ? this.selectedRepo + '/' : '') + file
				const ai = fileSystem.getAIByPath(fullPath)
				if (ai) {
					emitter.emit('close-file-tab', ai.path)
					const folder = fileSystem.folderById[ai.folder]
					if (folder) {
						const idx = folder.items.findIndex((i: any) => !i.folder && i.ai === ai)
						if (idx !== -1) folder.items.splice(idx, 1)
					}
					delete fileSystem.ais[ai.path]
				}
			}
		}

		updateGitStatusMap() {
			const status: {[path: string]: string} = {}
			const prefix = this.selectedRepo ? this.selectedRepo + '/' : ''
			for (const change of this.changes) {
				const fullPath = prefix + change.file
				if (change.conflict) {
					status[fullPath] = 'C'
				} else if (change.worktree !== ' ') {
					status[fullPath] = change.worktree === '?' ? 'U' : change.worktree
				} else if (change.index !== ' ') {
					status[fullPath] = change.index
				}
			}
			fileSystem.gitStatus = status
		}

		isActiveDiff(change: GitChange, staged: boolean): boolean {
			if (!this.activeDiff || this.activeDiff.type !== 'diff') return false
			return this.activeDiff.file === change.file && this.activeDiff.staged === staged
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
	font-size: 14px;
}
.git-toolbar {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 4px;
	flex-shrink: 0;
}
.repo-select {
	flex: 1;
	min-width: 0;
}
.action-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	cursor: pointer;
	border-radius: 4px;
	opacity: 0.6;
	flex-shrink: 0;
	&:hover { opacity: 1; background: rgba(128, 128, 128, 0.15); }
	&.active { opacity: 1; background: rgba(95, 173, 27, 0.2); color: #5fad1b; }
	.v-icon { font-size: 22px; }
}
.commit-area {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 0 4px 4px;
	flex-shrink: 0;
}
.commit-input {
	flex: 1;
	min-width: 0;
}
.rebase-label {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	padding: 0 12px;
	height: 40px;
	background: rgba(124, 142, 218, 0.15);
	border-radius: 4px;
	color: #7c8eda;
	.rebase-label-icon { font-size: 18px; }
}
.commit-btn.abort-btn {
	color: #e53935;
}
.commit-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	cursor: pointer;
	border-radius: 4px;
	flex-shrink: 0;
	color: #4caf50;
	&.disabled { opacity: 0.3; cursor: default; }
	&:not(.disabled):hover { background: rgba(76, 175, 80, 0.15); }
	.v-icon { font-size: 24px; }
}
.changes-scroll {
	flex: 1;
	overflow-y: auto;
	min-height: 0;
}
.section-header {
	display: flex;
	align-items: center;
	padding: 5px 8px;
	cursor: pointer;
	font-weight: 500;
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	&:hover { background: rgba(128, 128, 128, 0.1); }
	.v-icon { font-size: 18px; }
}
.section-title {
	flex: 1;
	margin-left: 2px;
}
.count {
	background: rgba(128, 128, 128, 0.3);
	color: inherit;
	border-radius: 8px;
	padding: 0 6px;
	font-size: 11px;
	margin-right: 4px;
}
.section-action {
	font-size: 18px !important;
	padding: 9px;
	margin-left: 2px;
	opacity: 0.5;
	border-radius: 4px;
	cursor: pointer;
	&:hover { opacity: 1; background: rgba(128, 128, 128, 0.2); }
}
.file-list {
	overflow-y: auto;
}
.file-item {
	display: flex;
	align-items: center;
	padding: 5px 10px 5px 24px;
	cursor: pointer;
	&:hover {
		background: rgba(128, 128, 128, 0.1);
		.file-actions { visibility: visible; }
	}
	&.active {
		background: rgba(128, 128, 128, 0.15);
		.file-actions { visibility: visible; }
	}
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
	&.status-\? { color: #73c991; }
}
.filename {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 14px;
}
.file-actions {
	display: flex;
	visibility: hidden;
	gap: 2px;
	.v-icon {
		font-size: 18px;
		padding: 0 6px;
		border-radius: 4px;
		align-self: stretch;
		display: inline-flex;
		align-items: center;
		opacity: 0.6;
		&:hover { opacity: 1; background: rgba(128, 128, 128, 0.15); }
	}
}
.merge-banner {
	padding: 8px;
	background: #e8a838;
	color: white;
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 13px;
	flex-shrink: 0;
}
.merge-abort {
	margin-left: auto;
	cursor: pointer;
	opacity: 0.8;
	border-radius: 4px;
	padding: 2px;
	&:hover { opacity: 1; background: rgba(0, 0, 0, 0.2); }
	.v-icon { font-size: 18px; }
}
.rebase-banner {
	background: #7c8eda;
}
.rebase-continue {
	margin-left: auto;
	cursor: pointer;
	opacity: 0.9;
	border-radius: 4px;
	padding: 2px;
	&:hover { opacity: 1; background: rgba(0, 0, 0, 0.2); }
	&.disabled { opacity: 0.4; cursor: default; pointer-events: none; }
	+ .merge-abort { margin-left: 0; }
	.v-icon { font-size: 18px; }
}
.conflict-header {
	color: #e06c75;
}
.conflict-count {
	background: rgba(224, 108, 117, 0.3) !important;
}
.conflict-item {
	.status-conflict {
		color: #e06c75 !important;
		font-weight: bold;
	}
}
.sync-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 8px;
	border-top: 1px solid rgba(128, 128, 128, 0.2);
	flex-shrink: 0;
	font-size: 13px;
}
.branch-picker {
	display: flex;
	align-items: center;
	gap: 4px;
	cursor: pointer;
	padding: 2px 4px;
	border-radius: 3px;
	user-select: none;
	&:hover { background: rgba(128, 128, 128, 0.15); }
	> .v-icon { font-size: 16px; }
	.branch-caret { font-size: 18px; opacity: 0.7; }
}
.branch-name {
	font-weight: 500;
}
.branch-list .create-branch { color: #5fad1b; }
.branch-delete {
	font-size: 18px !important;
	opacity: 0.4;
	margin-left: 8px;
	&:hover { opacity: 1; color: #e53935; }
}
.sync-actions {
	display: flex;
	align-items: center;
	gap: 4px;
}
.sync-btn {
	display: flex;
	align-items: center;
	gap: 3px;
	padding: 4px 8px;
	border-radius: 3px;
	cursor: pointer;
	font-size: 12px;
	font-weight: bold;
	user-select: none;
	.v-icon { font-size: 18px; }
	&:hover:not(.disabled) { background: rgba(128, 128, 128, 0.15); }
	&.disabled {
		opacity: 0.35;
		cursor: default;
	}
}
.pull-group {
	display: flex;
	align-items: center;
	border-radius: 3px;
	&:hover:not(.disabled) { background: rgba(128, 128, 128, 0.15); }
	&.disabled .sync-btn {
		opacity: 0.35;
		cursor: default;
		pointer-events: none;
	}
	.pull-main { padding-right: 4px; }
	.pull-main.push-force { color: #e53935; }
	.pull-main:hover { background: transparent; }
	.pull-caret {
		display: flex;
		align-items: center;
		cursor: pointer;
		padding: 4px 2px;
		.v-icon { font-size: 16px; opacity: 0.7; }
	}
}
.sync-error, .sync-info {
	padding: 6px 8px;
	font-size: 12px;
	border-top: 1px solid;
	display: flex;
	align-items: flex-start;
	gap: 6px;
	.sync-error-text, .sync-info-text {
		flex: 1;
		user-select: text;
		white-space: pre-wrap;
		word-break: break-word;
	}
	.sync-error-close, .sync-info-close {
		font-size: 16px;
		cursor: pointer;
		flex-shrink: 0;
	}
}
.sync-error {
	color: #f44;
	background: rgba(255, 0, 0, 0.08);
	border-top-color: rgba(255, 0, 0, 0.15);
	.sync-error-close { color: #f44; }
}
.sync-info {
	color: #5fad1b;
	background: rgba(95, 173, 27, 0.1);
	border-top-color: rgba(95, 173, 27, 0.2);
	.sync-info-close { color: #5fad1b; }
}
.no-changes {
	padding: 20px;
	text-align: center;
	opacity: 0.6;
	.v-icon { font-size: 18px; color: #4caf50; }
}
.no-repo {
	padding: 20px;
	text-align: center;
	opacity: 0.6;
	font-size: 13px;
}
.spin {
	animation: spin 1s linear infinite;
}
@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>
