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
		<git-history v-if="showHistory && selectedRepo !== ''" :folder="selectedRepo" @show-diff="(e: any) => emit('show-diff', e)" />

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
				<v-icon :title="$t('remote_settings')" class="action-btn" @click="showRemoteDialog = true">mdi-cloud-cog</v-icon>
			</div>
		</div>

		<!-- Pas de repo sélectionné -->
		<div v-if="selectedRepo === '' && repos.length === 0 && !loading" class="no-repo">
			<p>{{ $t('no_git_repo') }}</p>
		</div>

		<git-remote-dialog v-model="showRemoteDialog" :folder="selectedRepo" />
	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { fileSystem } from '@/model/filesystem'
	import { mixins } from '@/model/i18n'
	import GitHistory from './git-history.vue'
	import GitRemoteDialog from './git-remote-dialog.vue'
	import { gitCall } from './git-log'
	import { emitter } from '@/model/vue'
	import type { DiffTab } from './editor-tabs.vue'
	import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRouter } from 'vue-router'

	interface GitChange {
		file: string
		index: string
		worktree: string
		staged: boolean
		conflict?: boolean
	}

	defineOptions({ name: 'git-panel', i18n: {}, mixins: [...mixins], components: { GitHistory, GitRemoteDialog } })

	const props = withDefaults(defineProps<{
		theme?: string
		activeDiff?: DiffTab | null
	}>(), { theme: 'leek-wars', activeDiff: null })

	const emit = defineEmits<{
		'show-diff': [payload: { folder: string, file: string, staged: boolean }]
		'show-merge': [payload: any]
	}>()

	const { t } = useI18n()
	const router = useRouter()

	const repos = ref<{folder: string, name: string}[]>([])
	const selectedRepo = ref('')
	const changes = ref<GitChange[]>([])
	const commitMessage = ref('')
	const loading = ref(false)
	const showHistory = ref(false)
	const stagedExpanded = ref(true)
	const unstagedExpanded = ref(true)
	const merging = ref(false)
	const rebasing = ref(false)
	const conflictsExpanded = ref(true)
	const ahead = ref(0)
	const behind = ref(0)
	const branch = ref('')
	const hasRemote = ref(false)
	const hasUpstream = ref(false)
	const showRemoteDialog = ref(false)
	const syncError = ref('')
	const syncInfo = ref('')
	const branches = ref<string[]>([])
	const remoteBranches = ref<string[]>([])
	const branchMenuOpen = ref(false)
	const fetching = ref(false)
	const pullStrategyOpen = ref(false)
	const pullRebase = ref(false)
	const pushStrategyOpen = ref(false)
	const pushForce = ref(false)
	const actionsMenuOpen = ref(false)
	let refreshDebounceTimer: ReturnType<typeof setTimeout> | null = null
	const lastFetchAt: { [repo: string]: number } = {}

	const isDark = computed(() => ['monokai', 'vs-dark', 'hc-black'].includes(props.theme))
	const repoItems = computed(() => repos.value.map(r => ({ title: r.name || '/', value: r.folder })))
	const conflictChanges = computed<GitChange[]>(() => changes.value.filter(c => c.conflict))
	const canPull = computed(() => {
		if (!hasRemote.value) return false
		return behind.value > 0 || !hasUpstream.value
	})
	const canPush = computed(() => {
		if (!hasRemote.value) return false
		if (ahead.value > 0) return true
		if (pushForce.value && behind.value > 0) return true
		return !hasUpstream.value && branch.value !== ''
	})
	const stagedChanges = computed<GitChange[]>(() => changes.value.filter(c => c.staged && !c.conflict))
	const unstagedChanges = computed<GitChange[]>(() => changes.value.filter(c => !c.conflict)
		.filter(c => !c.staged || c.worktree !== ' ')
		.filter(c => c.worktree !== ' ' || c.index === '?')
		.map(c => {
			if (c.index === '?') return c
			return { ...c, staged: false }
		}))
	const canCommit = computed(() => stagedChanges.value.length > 0 && commitMessage.value.trim() !== '')

	onMounted(() => {
		loadRepos()
		emitter.on('git-file-changed', debouncedRefresh)
		emitter.on('git-repos-changed', loadRepos)
		;(emitter as any).on('git-open-remote-dialog', openRemoteDialog)
	})

	onBeforeUnmount(() => {
		emitter.off('git-file-changed', debouncedRefresh)
		emitter.off('git-repos-changed', loadRepos)
		;(emitter as any).off('git-open-remote-dialog', openRemoteDialog)
		if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer)
	})

	function openRemoteDialog() {
		showRemoteDialog.value = true
	}

	async function undoLastCommit() {
		actionsMenuOpen.value = false
		const msg = ahead.value === 0
			? t('undo_last_commit_pushed_warn') as string
			: t('undo_last_commit_confirm') as string
		if (!window.confirm(msg)) return
		syncError.value = ''
		syncInfo.value = ''
		try {
			await gitCall('git/undo-last-commit', { folder: selectedRepo.value })
			syncInfo.value = t('undo_last_commit_done') as string
			await refreshStatus()
			emitter.emit('git-history-refresh')
			emitter.emit('reanalyze')
		} catch (e: any) {
			syncError.value = 'Undo: ' + gitErrorMessage(e)
		}
	}

	function setPullStrategy(rebase: boolean) {
		pullRebase.value = rebase
		pullStrategyOpen.value = false
		if (selectedRepo.value !== '') {
			localStorage.setItem('editor/git-pull-rebase-' + selectedRepo.value, rebase ? '1' : '0')
		}
	}

	function setPushStrategy(force: boolean) {
		pushForce.value = force
		pushStrategyOpen.value = false
		if (selectedRepo.value !== '') {
			localStorage.setItem('editor/git-push-force-' + selectedRepo.value, force ? '1' : '0')
		}
	}

	function gitErrorMessage(e: any): string {
		const code = e?.error
		if (code === 'quota_size_exceeded') return t('quota_size_exceeded') as string
		if (code === 'quota_files_exceeded') return t('quota_files_exceeded') as string
		if (e?.quota_exceeded) return t('quota_size_exceeded') as string
		return e?.details || code || 'error'
	}

	watch(selectedRepo, (repo) => {
		if (repo === '') {
			changes.value = []
			branch.value = ''
			branches.value = []
			remoteBranches.value = []
			ahead.value = 0
			behind.value = 0
			hasRemote.value = false
			hasUpstream.value = false
			merging.value = false
			rebasing.value = false
			fileSystem.gitStatus = {}
			return
		}
		pullRebase.value = localStorage.getItem('editor/git-pull-rebase-' + repo) === '1'
		pushForce.value = localStorage.getItem('editor/git-push-force-' + repo) === '1'
	})

	watch(branchMenuOpen, async (open) => {
		if (!open) return
		const last = lastFetchAt[selectedRepo.value] || 0
		if (Date.now() - last < 60_000) {
			loadBranches()
		} else {
			fetchRemote()
		}
	})

	async function fetchRemote() {
		if (fetching.value) return
		fetching.value = true
		try {
			await gitCall('git/fetch', { folder: selectedRepo.value })
			lastFetchAt[selectedRepo.value] = Date.now()
			await Promise.all([loadBranches(), refreshStatus()])
		} catch (e) {
			await Promise.all([loadBranches(), refreshStatus()])
		} finally {
			fetching.value = false
		}
	}

	function debouncedRefresh() {
		if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer)
		refreshDebounceTimer = setTimeout(() => {
			refreshStatus()
		}, 1000)
	}

	async function loadRepos() {
		loading.value = true
		try {
			const data = await gitCall('git/repos')
			repos.value = data.repos
			const reposMap: {[path: string]: boolean} = {}
			for (const r of repos.value) { reposMap[r.folder] = true }
			fileSystem.gitRepos = reposMap
			const saved = localStorage.getItem('editor/git-repo')
			if (saved && repos.value.find(r => r.folder === saved)) {
				selectedRepo.value = saved
				refreshStatus()
			} else if (repos.value.length === 1) {
				selectedRepo.value = repos.value[0].folder
				refreshStatus()
			}
		} catch (e) {
		} finally {
			loading.value = false
		}
	}

	async function refreshStatus() {
		if (selectedRepo.value === '') return
		localStorage.setItem('editor/git-repo', selectedRepo.value)
		loading.value = true
		try {
			const data = await gitCall('git/status', { folder: selectedRepo.value })
			changes.value = data.changes
			merging.value = data.merging
			rebasing.value = !!data.rebasing
			ahead.value = data.ahead
			behind.value = data.behind
			branch.value = data.branch
			hasRemote.value = !!data.has_remote
			hasUpstream.value = !!data.has_upstream
			updateGitStatusMap()
		} catch (e) {
			changes.value = []
		} finally {
			loading.value = false
		}
	}

	async function stage(change: GitChange) {
		await gitCall('git/stage', { folder: selectedRepo.value, files: JSON.stringify([change.file]) })
		refreshStatus()
	}

	async function unstage(change: GitChange) {
		await gitCall('git/unstage', { folder: selectedRepo.value, files: JSON.stringify([change.file]) })
		refreshStatus()
	}

	async function stageAll() {
		await gitCall('git/stage-all', { folder: selectedRepo.value })
		refreshStatus()
	}

	async function unstageAll() {
		await gitCall('git/unstage-all', { folder: selectedRepo.value })
		refreshStatus()
	}

	async function discard(change: GitChange) {
		if (change.index === '?') {
			if (!confirm(t('discard_untracked_confirm', [change.file]) as string)) return
		}
		await gitCall('git/discard', { folder: selectedRepo.value, files: JSON.stringify([change.file]) })
		emitter.emit('close-diff', { folder: selectedRepo.value, file: change.file })
		if (change.index === '?') {
			removeDeletedFiles([change.file])
		} else {
			reloadFiles([change.file])
		}
		await refreshStatus()
		emitter.emit('reanalyze')
	}

	async function discardAll() {
		const untracked = unstagedChanges.value.filter(c => c.index === '?')
		if (untracked.length > 0) {
			if (!confirm(t('discard_untracked_all_confirm', [untracked.length]) as string)) return
		}
		const files = unstagedChanges.value.map(c => c.file)
		await gitCall('git/discard', { folder: selectedRepo.value, files: JSON.stringify(files) })
		for (const file of files) {
			emitter.emit('close-diff', { folder: selectedRepo.value, file })
		}
		const untrackedFiles = untracked.map(c => c.file)
		const trackedFiles = files.filter(f => !untrackedFiles.includes(f))
		if (untrackedFiles.length) removeDeletedFiles(untrackedFiles)
		if (trackedFiles.length) reloadFiles(trackedFiles)
		await refreshStatus()
		emitter.emit('reanalyze')
	}

	async function commit() {
		if (!canCommit.value) return
		const wasMerging = merging.value
		try {
			await gitCall('git/commit', { folder: selectedRepo.value, message: commitMessage.value })
			commitMessage.value = ''
			if (wasMerging) {
				emitter.emit('close-merge-tabs', { folder: selectedRepo.value })
			}
			refreshStatus()
		} catch (e) {
		}
	}

	async function push() {
		if (pushForce.value && !window.confirm(t('push_force_confirm') as string)) return
		loading.value = true
		syncError.value = ''
		syncInfo.value = ''
		try {
			const data = await gitCall('git/push', { folder: selectedRepo.value, force: pushForce.value })
			syncInfo.value = 'Push: ' + (data.message || 'OK')
			refreshStatus()
		} catch (e: any) {
			syncError.value = 'Push: ' + gitErrorMessage(e)
		} finally {
			loading.value = false
		}
	}

	async function pull() {
		loading.value = true
		syncError.value = ''
		syncInfo.value = ''
		try {
			const data = await gitCall('git/pull', { folder: selectedRepo.value, rebase: pullRebase.value })
			syncInfo.value = 'Pull: ' + (data.message || 'OK')
			await Promise.all([fileSystem.reload(), refreshStatus()])
			if (data.changed_files) fileSystem.reloadChangedFiles(selectedRepo.value, data.changed_files)
			emitter.emit('reanalyze')
			if (data.conflicts && conflictChanges.value.length > 0) {
				reloadFiles(conflictChanges.value.map(c => c.file))
				emitter.emit('open-merge', { folder: selectedRepo.value, file: conflictChanges.value[0].file })
			}
		} catch (e: any) {
			syncError.value = 'Pull: ' + gitErrorMessage(e)
		} finally {
			loading.value = false
		}
	}

	async function loadBranches() {
		try {
			const data = await gitCall('git/branches', { folder: selectedRepo.value })
			branches.value = data.branches || []
			remoteBranches.value = data.remote_branches || []
		} catch (e) {
			branches.value = []
			remoteBranches.value = []
		}
	}

	async function checkoutBranch(b: string) {
		branchMenuOpen.value = false
		if (b === branch.value) return
		syncError.value = ''
		syncInfo.value = ''
		loading.value = true
		try {
			const data = await gitCall('git/checkout', { folder: selectedRepo.value, branch: b })
			syncInfo.value = 'Checkout: ' + b
			await Promise.all([fileSystem.reload(), refreshStatus()])
			if (data.changed_files) fileSystem.reloadChangedFiles(selectedRepo.value, data.changed_files)
			emitter.emit('reanalyze')
		} catch (e: any) {
			syncError.value = 'Checkout: ' + gitErrorMessage(e)
		} finally {
			loading.value = false
		}
	}

	async function promptCreateBranch() {
		branchMenuOpen.value = false
		const name = window.prompt(t('new_branch_name') as string, '')
		if (!name) return
		const trimmed = name.trim()
		if (!trimmed) return
		syncError.value = ''
		syncInfo.value = ''
		loading.value = true
		try {
			await gitCall('git/create-branch', { folder: selectedRepo.value, branch: trimmed })
			syncInfo.value = 'Branch created: ' + trimmed
			await refreshStatus()
		} catch (e: any) {
			syncError.value = 'Create branch: ' + gitErrorMessage(e)
		} finally {
			loading.value = false
		}
	}

	async function deleteBranch(b: string) {
		branchMenuOpen.value = false
		if (!window.confirm(t('delete_branch_confirm', [b]) as string)) return
		syncError.value = ''
		syncInfo.value = ''
		try {
			await gitCall('git/delete-branch', { folder: selectedRepo.value, branch: b, force: false })
			syncInfo.value = t('delete_branch_done', [b]) as string
		} catch (e: any) {
			const details = e.details || e.error || 'error'
			if (details.includes('not fully merged')) {
				if (window.confirm(t('delete_branch_force_confirm', [b]) as string)) {
					try {
						await gitCall('git/delete-branch', { folder: selectedRepo.value, branch: b, force: true })
						syncInfo.value = t('delete_branch_done', [b]) as string
					} catch (e2: any) {
						syncError.value = gitErrorMessage(e2)
					}
				}
			} else {
				syncError.value = gitErrorMessage(e)
			}
		}
	}

	async function mergeAbort() {
		loading.value = true
		try {
			await gitCall('git/merge-abort', { folder: selectedRepo.value })
			emitter.emit('close-merge-tabs', { folder: selectedRepo.value })
			const conflictFiles = conflictChanges.value.map(c => c.file)
			reloadFiles(conflictFiles)
			await refreshStatus()
			emitter.emit('reanalyze')
		} catch (e) {
		} finally {
			loading.value = false
		}
	}

	async function rebaseContinue() {
		if (conflictChanges.value.length > 0) return
		loading.value = true
		syncError.value = ''
		syncInfo.value = ''
		try {
			const data = await gitCall('git/rebase-continue', { folder: selectedRepo.value })
			syncInfo.value = 'Rebase: ' + (data.message || 'OK')
			await Promise.all([fileSystem.reload(), refreshStatus()])
			if (data.changed_files) fileSystem.reloadChangedFiles(selectedRepo.value, data.changed_files)
			emitter.emit('reanalyze')
		} catch (e: any) {
			syncError.value = 'Rebase continue: ' + gitErrorMessage(e)
		} finally {
			loading.value = false
		}
	}

	async function rebaseAbort() {
		if (!window.confirm(t('rebase_abort_confirm') as string)) return
		loading.value = true
		syncError.value = ''
		syncInfo.value = ''
		try {
			const data = await gitCall('git/rebase-abort', { folder: selectedRepo.value })
			syncInfo.value = t('rebase_aborted') as string
			await Promise.all([fileSystem.reload(), refreshStatus()])
			if (data.changed_files) fileSystem.reloadChangedFiles(selectedRepo.value, data.changed_files)
			emitter.emit('reanalyze')
		} catch (e: any) {
			syncError.value = 'Rebase abort: ' + gitErrorMessage(e)
		} finally {
			loading.value = false
		}
	}

	function openConflict(change: GitChange) {
		const fullPath = (selectedRepo.value ? selectedRepo.value + '/' : '') + change.file
		const ai = fileSystem.getAIByPath(fullPath)
		if (ai) {
			router.push('/editor/' + ai.path)
		}
	}

	function reloadFiles(files: string[]) {
		for (const file of files) {
			const fullPath = (selectedRepo.value ? selectedRepo.value + '/' : '') + file
			const ai = fileSystem.getAIByPath(fullPath)
			if (ai) {
				gitCall('git/read-file', { folder: selectedRepo.value, file }).then((data: any) => {
					ai.code = data.content || ''
					ai.modified = false
					emitter.emit('file-reloaded', ai.path)
				})
			}
		}
	}

	function removeDeletedFiles(files: string[]) {
		for (const file of files) {
			const fullPath = (selectedRepo.value ? selectedRepo.value + '/' : '') + file
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

	function updateGitStatusMap() {
		const status: {[path: string]: string} = {}
		const prefix = selectedRepo.value ? selectedRepo.value + '/' : ''
		for (const change of changes.value) {
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

	function isActiveDiff(change: GitChange, staged: boolean): boolean {
		if (!props.activeDiff || props.activeDiff.type !== 'diff') return false
		return props.activeDiff.file === change.file && props.activeDiff.staged === staged
	}

	function showDiff(change: GitChange, staged: boolean) {
		emit('show-diff', { folder: selectedRepo.value, file: change.file, staged })
	}

	function statusChar(change: GitChange): string {
		if (change.index === '?') return '?'
		return change.worktree.toLowerCase()
	}

	function statusLabel(change: GitChange): string {
		if (change.index === '?') return '?'
		return change.worktree
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
	flex-wrap: wrap;
	gap: 4px;
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
	min-width: 0;
	max-width: 100%;
	&:hover { background: rgba(128, 128, 128, 0.15); }
	> .v-icon { font-size: 16px; flex-shrink: 0; }
	.branch-caret { font-size: 18px; opacity: 0.7; flex-shrink: 0; }
}
.branch-name {
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	min-width: 0;
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
	flex-shrink: 0;
	margin-left: auto;
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
