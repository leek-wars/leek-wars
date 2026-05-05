<template lang="html">
	<div class="page editor" :class="'theme-' + theme">
		<div class="page-header page-bar">
			<div class="menu">
				<h1>{{ $t('title') }}</h1>
				<div class="tabs">
					<div ref="fileButton" class="tab first action" icon="settings">
						<v-icon>mdi-file-outline</v-icon> {{ $t('file') }}
					</div>
					<v-menu v-model="fileMenu" :activator="LeekWars.mobile ? undefined : (fileButton as any)" :target="LeekWars.mobile ? fileMenuActivator : undefined" offset-y>
						<v-list>
							<v-list-subheader v-if="currentFolder && currentFolder.id > 0" class="menu-title">
								<v-icon>mdi-folder-outline</v-icon> {{ currentFolder.name }}
							</v-list-subheader>
							<v-list-item v-if="currentFolder && currentFolder.id !== -1" v-ripple prepend-icon="mdi-file-plus-outline" @click="explorerEl?.openNewAI(currentFolder)">
								<v-list-item-title>{{ $t('new_ai') }}</v-list-item-title>
							</v-list-item>
							<v-list-item v-if="currentFolder && currentFolder.id !== -1" v-ripple prepend-icon="mdi-folder-plus-outline" @click="explorerEl?.openNewFolder(currentFolder)">
								<v-list-item-title>{{ $t('new_folder') }}</v-list-item-title>
							</v-list-item>
							<v-list-item v-ripple prepend-icon="mdi-git" @click="openCloneDialog">
								<v-list-item-title>{{ $t('clone_repo') }}</v-list-item-title>
							</v-list-item>
							<v-list-subheader v-if="currentAI" class="menu-title">
								<v-icon>mdi-file-outline</v-icon> <span>{{ currentAI.name }}</span>
							</v-list-subheader>
							<v-list-item v-if="currentAI" v-ripple prepend-icon="mdi-content-save" @click="save()">
								<v-list-item-title>{{ $t('save') }} <span class="shortcut">Ctrl + S</span></v-list-item-title>
							</v-list-item>
							<v-list-item v-if="currentAI" v-ripple prepend-icon="mdi-delete" @click="explorerEl?.deleteAI(currentAI)">
								<v-list-item-title>{{ $t('delete') }}</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-menu>
					<div class="tab action" icon="settings" @click="settings()">
						<v-icon>mdi-cogs</v-icon>
					</div>
					<div :title="$t('test_desc')" class="action content tab" icon="play_arrow" @click="startTest()">
						<v-icon class="list-icon">mdi-play</v-icon><span>{{ $t('test') }}</span>
					</div>
				</div>
			</div>

			<editor-tabs v-if="!LeekWars.mobile" :ais="fileSystem.ais" :history2="history" :current="currentTab" :active="currentSide === 1" :splitted="splitted" :theme="theme" group="tabs" :all-tabs="tabs1" @select="selectTab" @close-tab="closeTabEvent" @close-all="closeAllTabs" @split="setSplitted(true, $event)" :style="{ 'width': (editor1Width * 80) + '%' }" @open-file="openDiffFileFromMenu" />

			<editor-tabs v-if="splitted && !LeekWars.mobile" :ais="fileSystem.ais" :history2="history" :current="currentAI2" :active="currentSide === 2" :splitted="splitted" :theme="theme" group="tabs2" @close="close" @close-all="closeAll" :style="{ 'width': (editor2Width * 100) + '%' }" @open="open($event, 2)" @close-panel="setSplitted(false)" />

			<editor-finder ref="finder" :active="activeAIs" :history="history" />
		</div>

		<div class="container last">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" :style="{width: LeekWars.mobile ? '100%' : panelWidth + 'px'}" class="resize-panel">
				<panel class="editor-left editor-panel first">
					<template #content>
						<div class="full">
							<div v-if="Object.keys(fileSystem.gitRepos).length > 0" class="left-panel-tabs">
								<div :class="{active: leftPanelTab === 'explorer'}" class="left-tab" @click="setLeftPanelTab('explorer')" :title="$t('title')">
									<v-icon>mdi-file-tree</v-icon>
								</div>
								<div :class="{active: leftPanelTab === 'git'}" class="left-tab" @click="setLeftPanelTab('git')" title="Git">
									<v-icon>mdi-source-branch</v-icon>
								</div>
							</div>

							<template v-if="leftPanelTab === 'explorer'">
								<div v-if="fileSystem.rootFolder" v-autostopscroll class="ai-list">
									<Explorer ref="explorerEl" :current-ai="currentAI" :selected-folder="currentFolder" @test="startTest" @delete-ai="deleteAI" />
								</div>

								<div v-if="currentEditor && currentEditor.loaded && panelWidth" class="ai-stats">
									<div class="line-count-wrapper">{{ $t('main.n_lines', currentEditor.lines) }}</div>
									<div class="char-count-wrapper">{{ $t('main.n_characters', currentEditor.characters) }}</div>
									<div v-if="currentAI.included_lines !== 0" class="line-count-wrapper">{{ $t('main.n_total_lines', currentEditor.lines + currentAI.included_lines) }}</div>
									<div v-if="currentAI.included_chars !== 0" class="char-count-wrapper">{{ $t('main.n_total_chars', currentEditor.characters + currentAI.included_chars) }}</div>
								</div>
							</template>

							<git-panel v-if="leftPanelTab === 'git'" :theme="theme" :active-diff="activeDiff" @show-diff="openDiff" @show-merge="openMerge" />
						</div>
					</template>
				</panel>
			</div>

			<div v-show="!LeekWars.mobile || LeekWars.splitBack" :style="{width: 'calc(100% - ' + (LeekWars.mobile ? 0 : panelWidth) + 'px)'}" class="editor-column">
				<panel class="editor-panel">
					<template #content>
						<div class="editor-left dida-element">
							<div class="resizer explorer-resizer" @mousedown="resizerMousedown">
								<v-icon>mdi-drag-vertical-variant</v-icon>
							</div>
							<div :class="{tabs: tabs1.length > 1}" class="editors" ref="editors">

								<ai-view-monaco v-if="ai1Ready" v-show="!showDiffViewer" ref="editor1" :ai="fileSystem.ais[currentAI1!]" :theme="theme" :font-size="fontSize" :line-height="lineHeight" :popups="popups" :auto-closing="autoClosing" :autocomplete-option="autocomplete" :line-numbers="true" :t="$t" @jump="jump" @load="load" @focus="setSide(1)" :style="{ 'width': (editor1Width * 100) + '%' }" />

								<div v-if="splitted" v-show="!showDiffViewer" class="resizer editor-resizer" @dblclick="split50_50" @mousedown="resizerEditorMousedown">
									<v-icon>mdi-drag-vertical-variant</v-icon>
								</div>

								<ai-view-monaco v-if="splitted && ai2Ready" v-show="!showDiffViewer" ref="editor2" :ai="fileSystem.ais[currentAI2!]" :theme="theme" :font-size="fontSize" :line-height="lineHeight" :popups="popups" :auto-closing="autoClosing" :autocomplete-option="autocomplete" :line-numbers="true" :t="$t" @jump="jump" @load="load" @focus="setSide(2)" :style="{ 'width': (editor2Width * 100) + '%' }" />

								<div v-if="showDiffViewer && !isDiffReady" class="diff-loader"><loader :size="40" /></div>
								<git-diff v-if="diffMounted && isDiffReady && !showMergeViewer && activeDiff" v-show="showDiffViewer" :original-content="activeDiff.original" :modified-content="activeDiffModified" :file="activeDiff.file" :theme="theme" :font-size="fontSize" :line-height="lineHeight" :inline="diffInline" :collapse-unchanged="diffCollapseUnchanged" @close="closeDiff" @open-file="openDiffFile" />
								<git-merge v-if="showMergeViewer && activeMerge && activeMerge.ready" :content="activeMerge.modified" :file="activeMerge.file" :theme="theme" :font-size="fontSize" :line-height="lineHeight" @resolve="onMergeResolve" />

							</div>

							<span v-if="LeekWars.didactitial_step === 4" class="dida-hint shaking">
								<span class="bubble" v-html="$t('main.dida_8')" v-chat-code-latex></span>
								<span class="arrow"></span>
							</span>

							<div v-if="bottomPanel && problemsHeight" :style="{height: problemsHeight + 'px'}" class="bottom-panel">
								<div class="resizer problems-resizer" @mousedown="problemsResizerMousedown">
									<v-icon>mdi-drag-horizontal-variant</v-icon>
								</div>
								<editor-problems v-if="bottomPanel === 'problems'" @jump="jump" />
								<git-terminal v-else-if="bottomPanel === 'git'" :theme="theme" />
							</div>
							<div class="status">
								<v-menu v-if="currentAI" top :offset-y="true" :nudge-top="1" :max-width="600" :close-on-content-click="false">
									<template #activator="{ props }">
										<div v-ripple class="version" v-bind="props">
											LeekScript&nbsp;{{ currentAI.version }} <span v-if="currentAI.strict">&nbsp;({{ $t('strict') }})</span>
											<v-icon>mdi-chevron-down</v-icon>
										</div>
									</template>
									<leekscript-versions :version="currentAI.version" :strict="currentAI.strict" @update:version="onVersionUpdate" @update:strict="onStrictUpdate" />
								</v-menu>
								<div v-ripple class="problems" :class="{active: bottomPanel === 'problems'}" @click="toggleBottomPanel('problems')">
									<span v-if="!analyzer.error_count && !analyzer.warning_count" class="no-error">
										<v-icon>mdi-check-circle</v-icon> <span v-if="!LeekWars.mobile">{{ $t('no_problem') }}</span>
									</span>
									<span v-if="analyzer.error_count" class="errors">
										<v-icon>mdi-close-circle</v-icon> {{ analyzer.error_count }} {{ $t('error', analyzer.error_count).toLowerCase() }}
									</span>
									<span v-if="analyzer.warning_count" class="warnings">
										<v-icon>mdi-alert-circle</v-icon> {{ analyzer.warning_count }} {{ $t('warning', analyzer.warning_count).toLowerCase() }}
									</span>
									<span v-if="analyzer.todo_count" class="todos">
										<v-icon>mdi-format-list-checks</v-icon> {{ analyzer.todo_count }} {{ $t('todo', analyzer.todo_count).toLowerCase() }}
									</span>
								</div>
								<div v-if="gitLogCount" v-ripple class="problems git-terminal-toggle" :class="{active: bottomPanel === 'git'}" @click="toggleBottomPanel('git')">
									<v-icon>mdi-console</v-icon>
									<span v-if="!LeekWars.mobile">Git</span>
									<span class="count">{{ gitLogCount }}</span>
								</div>
								<div class="filler"></div>
								<div class="state">
									<div v-if="currentEditor && (currentEditor.saving || currentEditor.hovering || currentEditor.analyzing)" class="running">
										<span v-if="!LeekWars.mobile">{{ $t('analyzing') }}</span>
										<v-icon>mdi-sync</v-icon>
									</div>
								</div>
								<div v-if="currentEditor && currentEditor.editor" class="version">L {{ currentEditor.position.lineNumber + 1 }}, C {{ currentEditor.position.column }} <span v-if="currentEditor.selected">({{ currentEditor.selected.length }} Select.)</span></div>
							</div>
						</div>
					</template>
				</panel>
			</div>
		</div>

		<div class="error-tooltip"></div>

		<popup v-model="settingsDialog" :width="620" icon="mdi-cogs" :title="$t('settings')">
			<div class="settings-dialog">
				<div class="title">{{ $t('storage') }}</div>
				<div class="storage">
					<div v-if="storageUsage" class="storage-label">
						<span>{{ LeekWars.formatFileSize(storageUsage.size) }} / {{ LeekWars.formatFileSize(storageUsage.max_size) }}</span>
						<span class="storage-percent">{{ Math.floor(100 * storageUsage.size / storageUsage.max_size) }}%</span>
					</div>
					<div v-else class="storage-label">…</div>
					<div class="storage-bar">
						<div :class="storageBarClass" :style="{width: storageBarWidth}" class="storage-bar-fill"></div>
					</div>
				</div>

				<div class="title">{{ $t('display') }}</div>
				<template v-if="!LeekWars.mobile">
					<v-checkbox v-model="enlargeWindow" :label="$t('enlarge_window')" hide-details />
					<v-checkbox v-model="hideHeader" :label="$t('hide_header')" hide-details />
					<br>
				</template>
				{{ $t('font_size') }} : <input v-model="fontSize" type="number" min="6" max="30" @keyup.stop>
				<br>
				{{ $t('line_height') }} : <input v-model="lineHeight" type="number" min="10" max="50" @keyup.stop>

				<div class="title">{{ $t('theme') }}</div>

				<v-radio-group v-model="theme" hide-details class="themes">
					<v-radio label="Leek Wars" value="leek-wars" />
					<v-radio label="Monokai" value="monokai" />
					<v-radio label="VS Code clair" value="vs" />
					<v-radio label="VS Code sombre" value="vs-dark" />
					<v-radio label="High Contrast clair" value="hc-light" />
					<v-radio label="High Contrast sombre" value="hc-black" />
				</v-radio-group>
				<!-- Custom theme name
				<input v-model="theme"> -->

				<div class="title">{{ $t('settings_editor') }}</div>

				<v-checkbox v-model="autoClosing" :label="$t('auto_closing')" hide-details />
				<!-- <v-checkbox v-model="enableAnalyzer" :label="$t('analyzer')" hide-details /> -->
				<v-checkbox v-model="autocomplete" :label="$t('autocompletion')" hide-details />
				<v-checkbox v-model="popups" :label="$t('popups')" hide-details />

				<div class="title">{{ $t('settings_diff') }}</div>

				<v-checkbox v-model="diffInline" :label="$t('diff_inline')" hide-details />
				<v-checkbox v-model="diffCollapseUnchanged" :label="$t('diff_collapse_unchanged')" hide-details />

				<div class="title">{{ $t('shortcuts') }}</div>

				<ul class="shortcuts">
					<li v-html="$t('shortcut.shortcut_1')"></li>
					<li v-html="$t('shortcut.shortcut_2')"></li>
					<li v-html="$t('shortcut.shortcut_3')"></li>
					<li v-html="$t('shortcut.shortcut_4')"></li>
					<li v-html="$t('shortcut.shortcut_5')"></li>
					<li v-html="$t('shortcut.shortcut_6')"></li>
					<li v-html="$t('shortcut.shortcut_7')"></li>
					<li v-html="$t('shortcut.shortcut_8')"></li>
					<li v-html="$t('shortcut.shortcut_9')"></li>
					<li v-html="$t('shortcut.shortcut_10')"></li>
					<li v-html="$t('shortcut.shortcut_11')"></li>
					<li v-html="$t('shortcut.shortcut_12')"></li>
					<li v-html="$t('shortcut.shortcut_13')"></li>
					<li v-html="$t('shortcut.shortcut_14')"></li>
					<li v-html="$t('shortcut.shortcut_15')"></li>
				</ul>
			</div>
		</popup>

		<popup v-model="alreadyOpenedDialog" :width="500" icon="mdi-alert-outline" :title="$t('warning')">
			{{ $t('editor_already_opened') }}
		</popup>

		<popup v-model="cloneDialog" :width="480" icon="mdi-git" :title="$t('clone_repo')">
			<div class="clone-dialog">
				<v-text-field v-model="cloneUrl" :label="$t('clone_url')" :placeholder="$t('clone_url_placeholder')" variant="solo" density="compact" autofocus @input="onCloneUrlInput" @keyup.enter="doClone" @keyup.stop />
				<v-text-field v-model="cloneFolder" :label="$t('clone_folder')" variant="solo" density="compact" :error-messages="cloneFolderError ? [cloneFolderError] : []" @keyup.enter="doClone" @keyup.stop />
				<div class="clone-hint">
					<v-icon size="small">mdi-information-outline</v-icon>
					{{ $t('clone_auth_hint') }}
				</div>
				<div v-if="cloneError" class="clone-error">{{ cloneError }}</div>
			</div>
			<template #actions>
				<div @click="cloneDialog = false">{{ $t('cancel') }}</div>
				<div class="green" :class="{ disabled: !cloneUrl || !!cloneFolderError || cloning }" @click="doClone">{{ cloning ? $t('cloning') : $t('clone') }}</div>
			</template>
		</popup>

		<editor-test ref="editorTestRef" v-model="testDialog" :ais="fileSystem.ais" :leek-ais="fileSystem.leekAIs" :currentAI="currentAI" />

		<!--
		<popup v-model="newAIv2Dialog" :width="500">
			<v-icon slot="icon">mdi-plus-circle-outline</v-icon>
			<span slot="title">{{ $t('new_desc') }}</span>
			<div class="padding">
				<input ref="newAIInputv2" v-model="newAIName" :placeholder="$t('ai_name')" type="text" class="input dialog-input" @keyup.enter="newAI(true, newAIName)">
			</div>
			<template #actions>
				<div @click="newAIv2Dialog = false">{{ $t('cancel') }}</div>
				<div class="green" @click="newAI(true, newAIName)">{{ $t('main.create') }}</div>
			</div>
		</popup> -->
	</div>
</template>

<script setup lang="ts">
	import { locale } from '@/locale'
	import { AI } from '@/model/ai'
	import { fileSystem, translateFileSystemError } from '@/model/filesystem'
	import { i18n, mixins, useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import AIViewMonaco from './ai-view-monaco.vue'
	import EditorFinder from './editor-finder.vue'
	import { AIItem, Folder, Item } from './editor-item'
	import { explorer } from './explorer'
	import GitDiff from './git-diff.vue'
	import GitMerge from './git-merge.vue'
	import GitTerminal from './git-terminal.vue'
	import { gitLog } from './git-log'
	import type { EditorTab, FileTab, DiffTab } from './editor-tabs.vue'
	import './leekscript-monokai.scss'
	import { SocketMessage } from '@/model/socket'
	import { analyzer } from './analyzer'
	import { isLeekScript } from './file-types'
	import AIElement from '@/component/app/ai.vue'
	import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, useTemplateRef, watch } from 'vue'
	import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
	import { emitter } from '@/model/vue'
	import LeekscriptVersions from '../app/leekscript-versions.vue'

	const Explorer = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-explorer.${locale}.i18n`))
	const EditorTabs = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-tabs.${locale}.i18n`))
	const EditorTest = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-test.${locale}.i18n`))
	const EditorProblems = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-problems.${locale}.i18n`))
	const GitPanel = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/git-panel.${locale}.i18n`))

	const DEFAULT_FONT_SIZE = 16
	const DEFAULT_LINE_HEIGHT = 24
	const DEFAULT_THEME = () => LeekWars.darkMode ? "monokai" : "leek-wars"

	interface ExplorerInstance {
		openNewAI(folder: Folder): void
		openNewFolder(folder: Folder): void
		deleteAI(ai: AI): void
	}
	interface EditorTestInstance {
		currentTab: string | number
		allLeeks: Record<number, unknown>
		selectLeek(leek: unknown): void
	}

	defineOptions({
		name: 'editor',
		i18n: {},
		mixins: [...mixins],
		components: {
			'ai-view-monaco': AIViewMonaco,
			ai: AIElement,
		},
	})

	const t = useNamespacedT('editor')
	const route = useRoute()
	const router = useRouter()

	const activeAIs = reactive<{[key: string]: AI}>({})
	const currentAI1 = ref<string | null>(null)
	const currentAI2 = ref<string | null>(null)
	const currentSide = ref(1)
	const currentEditor = shallowRef<InstanceType<typeof AIViewMonaco> | null>(null)
	const currentType = ref<string | null>(null)
	const currentFolder = ref<Folder | null>(null)
	const infoDialog = ref(false)
	const settingsDialog = ref(false)
	const cloneDialog = ref(false)
	const cloneUrl = ref('')
	const cloneFolder = ref('')
	const cloneError = ref('')
	const cloning = ref(false)
	const cloneFolderError = computed(() => {
		const name = cloneFolder.value.trim()
		if (!name) return ''
		if (!/^[a-zA-Z0-9._-]+$/.test(name)) return t('invalid_folder_name') as string
		const exists = fileSystem.rootFolder?.items?.some(item => item instanceof Folder && item.name === name)
		if (exists) return t('folder_exists') as string
		return ''
	})
	const storageUsage = ref<{ size: number, files: number, max_size: number, max_files: number } | null>(null)
	const enlargeWindow = ref(false)
	const theme = ref<string>(DEFAULT_THEME())
	const autoClosing = ref(false)
	const autocomplete = ref(false)
	const enableAnalyzer = ref(false)
	const popups = ref(false)
	const diffInline = ref(false)
	const diffCollapseUnchanged = ref(true)
	const hideHeader = ref(false)
	const fontSize = ref(DEFAULT_FONT_SIZE)
	const lineHeight = ref(DEFAULT_LINE_HEIGHT)
	const dragging = shallowRef<Item | null>(null)
	const testDialog = ref(false)
	const panelWidth = ref(200)
	const problemsHeight = ref(200)
	const bottomPanel = ref<'problems' | 'git' | null>('problems')
	const newAIv2Dialog = ref(false)
	const fileMenu = ref(false)
	const fileMenuActivator = ref<Element | undefined>(undefined)
	const history = ref<AI[]>([])
	const alreadyOpenedDialog = ref(false)
	const leftPanelTab = ref<string>(localStorage.getItem('editor/left_panel_tab') || 'explorer')
	const tabs1 = ref<EditorTab[]>([])
	let tabs1Loaded = false
	const currentTab = ref<EditorTab | null>(null)
	const diffMounted = ref(true)
	const diffReady = ref(0)
	const editor1Width = ref(0.5)
	const editor2Width = ref(0.5)
	let editorTotalWidth = 800
	const splitted = ref(true)
	let broadcast: BroadcastChannel | null = null

	const fileButton = useTemplateRef<HTMLElement>('fileButton')
	const editor1 = useTemplateRef<InstanceType<typeof AIViewMonaco>>('editor1')
	const editor2 = useTemplateRef<InstanceType<typeof AIViewMonaco>>('editor2')
	const finder = useTemplateRef<InstanceType<typeof EditorFinder>>('finder')
	const editors = useTemplateRef<HTMLElement>('editors')
	const explorerEl = useTemplateRef<ExplorerInstance>('explorerEl')
	const editorTestRef = useTemplateRef<EditorTestInstance>('editorTestRef')

	const gitLogCount = computed(() => gitLog.entries.length)
	const problemsCount = computed(() => analyzer.error_count + analyzer.warning_count + analyzer.todo_count)

	const actions_list = computed(() => [
		{icon: 'mdi-plus', click: (e: MouseEvent) => add(e)},
		{icon: 'mdi-cogs', click: () => settings() }
	])
	const actions_content = computed(() => [
		{icon: 'mdi-content-save', click: () => save()},
		{icon: 'mdi-delete', click: () => startDelete()},
		{icon: 'mdi-play', click: () => startTest()},
	])

	const currentAI = computed(() => {
		const key = currentSide.value === 1 ? currentAI1.value : currentAI2.value
		return key ? (fileSystem.ais[key] ?? null) : null
	})
	const ai1Ready = computed(() => {
		const ai = currentAI1.value ? fileSystem.ais[currentAI1.value] : null
		return ai && ai.code !== undefined
	})
	const ai2Ready = computed(() => {
		const ai = currentAI2.value ? fileSystem.ais[currentAI2.value] : null
		return ai && ai.code !== undefined
	})
	const showDiffViewer = computed(() => currentTab.value !== null && currentTab.value.type !== 'file')
	const showMergeViewer = computed(() => currentTab.value !== null && currentTab.value.type === 'merge')
	const activeDiff = computed<DiffTab | null>(() => {
		if (!currentTab.value || currentTab.value.type === 'file') return null
		return currentTab.value as DiffTab
	})
	const activeMerge = computed<DiffTab | null>(() => {
		if (!currentTab.value || currentTab.value.type !== 'merge') return null
		return currentTab.value as DiffTab
	})
	const isDiffReady = computed(() => {
		void diffReady.value
		return activeDiff.value !== null && activeDiff.value.ready
	})
	const activeDiffModified = computed(() => {
		const diff = activeDiff.value
		if (!diff) return ''
		// Pour les diffs unstaged, utiliser le code live de l'éditeur
		if (diff.type === 'diff' && !diff.staged && diff.id) {
			const ai = fileSystem.ais[diff.id]
			if (ai) return ai.code
		}
		return diff.modified
	})
	function diffKey(tab: DiffTab): string {
		if (tab.type === 'merge') return tab.folder + ':' + tab.file + ':merge'
		return tab.folder + ':' + tab.file + ':' + (tab.hash || (tab.staged ? 's' : 'w'))
	}

	const storageBarWidth = computed(() => {
		if (!storageUsage.value) return '0%'
		return Math.min(100, Math.floor(100 * storageUsage.value.size / storageUsage.value.max_size)) + '%'
	})
	const storageBarClass = computed(() => {
		if (!storageUsage.value) return ''
		const ratio = storageUsage.value.size / storageUsage.value.max_size
		if (ratio >= 1) return 'storage-bar-full'
		if (ratio >= 0.8) return 'storage-bar-warn'
		return ''
	})

	async function init() {
		LeekWars.footer = false
		LeekWars.box = true
		if (localStorage.getItem('editor/autocomplete') === null) { localStorage.setItem('editor/autocomplete', 'true') }
		if (localStorage.getItem('editor/auto_closing') === null) { localStorage.setItem('editor/auto_closing', 'true') }
		if (localStorage.getItem('editor/popups') === null) { localStorage.setItem('editor/popups', 'true') }
		if (localStorage.getItem('editor/analyzer') === null) { localStorage.setItem('editor/analyzer', 'false') }
		LeekWars.large = enlargeWindow.value = localStorage.getItem('editor/large') === 'true'
		theme.value = localStorage.getItem('editor/theme') || DEFAULT_THEME()
		autoClosing.value = localStorage.getItem('editor/auto_closing') === 'true'
		autocomplete.value = localStorage.getItem('editor/autocomplete') === 'true'
		popups.value = localStorage.getItem('editor/popups') === 'true'
		diffInline.value = localStorage.getItem('editor/diff_inline') === 'true'
		diffCollapseUnchanged.value = localStorage.getItem('editor/diff_collapse_unchanged') !== 'false'
		hideHeader.value = localStorage.getItem('editor/hideHeader') === 'true'
		enableAnalyzer.value = false // localStorage.getItem('editor/analyzer') === 'true'
		fontSize.value = parseInt(localStorage.getItem('editor/font_size') || '', 10) || DEFAULT_FONT_SIZE
		lineHeight.value = parseInt(localStorage.getItem('editor/line_height') || '', 10) || DEFAULT_LINE_HEIGHT
		problemsHeight.value = parseInt(localStorage.getItem('editor/problems-height') || '', 10) || 200
		panelWidth.value = parseInt(localStorage.getItem('editor/panel-width') || '', 10) || 200
		splitted.value = localStorage.getItem('editor/splitted') === 'true'
		editor1Width.value = parseFloat(localStorage.getItem('editor/editor1-width') || '') || (splitted.value ? 0.5 : 1)
		editor2Width.value = parseFloat(localStorage.getItem('editor/editor2-width') || '') || 0.5
		currentAI2.value = localStorage.getItem('editor/last-code-2') || null

		LeekWars.loadEncyclopedia(locale)

		const docMessages = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)
		i18n.global.mergeLocaleMessage(locale, { doc: docMessages.default })
	}
	init()

	async function connected() {
		// Chargement de l'historique
		const histIds = JSON.parse(localStorage.getItem('editor/history') || '[]')
		for (const id of histIds) {
			if (id in fileSystem.ais) {
				history.value.push(fileSystem.ais[id])
			}
		}
		LeekWars.setTitle(t('title'), t('n_ais', [fileSystem.aiCount]))
		restoreTabs()
		await loadGitRepos()
		update()
	}

	async function loadGitRepos() {
		try {
			const data = await LeekWars.post('git/repos')
			const repos: {[path: string]: boolean} = {}
			for (const r of data.repos) { repos[r.folder] = true }
			fileSystem.gitRepos = repos
		} catch (e) {
			// Pas de repos git
		}
		if (leftPanelTab.value === 'git' && Object.keys(fileSystem.gitRepos).length === 0) {
			leftPanelTab.value = 'explorer'
		}
	}

	function openCloneDialog() {
		cloneUrl.value = ''
		cloneFolder.value = ''
		cloneError.value = ''
		cloning.value = false
		cloneDialog.value = true
	}

	function onCloneUrlInput() {
		cloneError.value = ''
		if (!cloneFolder.value) {
			const match = cloneUrl.value.match(/\/([^/]+?)(?:\.git)?\s*$/)
			if (match) cloneFolder.value = match[1]
		}
	}

	async function doClone() {
		if (!cloneUrl.value || !cloneFolder.value.trim() || cloneFolderError.value || cloning.value) return
		cloneError.value = ''
		cloning.value = true
		try {
			const data = await LeekWars.post('git/clone', { url: cloneUrl.value.trim(), folder: cloneFolder.value.trim() })
			cloneDialog.value = false
			LeekWars.toast(t('clone_success') as string)
			await loadGitRepos()
			leftPanelTab.value = 'git'
		} catch (e: unknown) {
			const err = e as { error?: string, details?: string }
			const key = err?.error
			cloneError.value = (key && t(key) !== key ? t(key) : (err?.details || err?.error || 'Error')) as string
		} finally {
			cloning.value = false
		}
	}

	function isChild(folder: Folder, parent: Folder): boolean {
		let current = folder
		while (current.id !== 0) {
			if (current.id === parent.id) { return true }
			current = fileSystem.folderById[current.parent]
		}
		return false
	}

	function toggleFileMenu(event?: Event) {
		if (LeekWars.mobile && event) {
			fileMenuActivator.value = event.target as Element
		} else {
			fileMenuActivator.value = fileButton.value ?? undefined
		}
		nextTick(() => {
			fileMenu.value = !fileMenu.value
		})
	}

	function keydown(e: KeyboardEvent) {
		// Up and down arrows while Alt + Left/right
		if (e.altKey && finder.value?.value) {
			if (e.which === 40) { finder.value.previous() }
			else if (e.which === 38) { finder.value.next() }
		}
	}

	function keyup(e: KeyboardEvent) {
		if (e.which === 18 && finder.value) {
			finder.value.go(history.value[finder.value.selected])
		}
	}

	function update() {
		const routeHash = route.params.hash as string | undefined
		const isDiffRoute = routeHash || route.path.endsWith('/diff')
		if (route.hash) {
			if (route.hash.startsWith('#leek-')) {
				const id = parseInt(route.hash.substring(6))
				testDialog.value = true
				setTimeout(() => {
					const test = editorTestRef.value
					if (!test) return
					test.currentTab = 1
					if (test.allLeeks[id]) {
						test.selectLeek(test.allLeeks[id])
					}
				}, 200)
			}
		}
		if (route.params.id) {
			const routeId = route.params.id as string
			const ai = fileSystem.getAIFromRoute(routeId)
			if (ai) {
				const key = ai.path
				fileSystem.load(ai).then(() => {
					if (currentSide.value === 1) {
						currentAI1.value = key
					} else {
						currentAI2.value = key
					}
					nextTick(() => {
						currentEditor.value = (currentSide.value === 1 ? editor1.value : editor2.value) as InstanceType<typeof AIViewMonaco>
					})
				})
				localStorage.setItem('editor/last-code-' + currentSide.value, key)
				currentType.value = 'ai'
				currentFolder.value = fileSystem.folderById[ai.folder]
				if (!(key in activeAIs)) {
					activeAIs[key] = ai
				}
				explorer.selectAI(ai)
				if (currentSide.value === 1 && !isDiffRoute) {
					const fileTab: FileTab = { type: 'file', id: key }
					if (!tabs1.value.find(tt => tt.type === 'file' && tt.id === key)) {
						tabs1.value.push(fileTab)
						saveTabs()
					}
					currentTab.value = tabs1.value.find(tt => tt.type === 'file' && tt.id === key) || fileTab
				}
				// Ajout dans l'historique
				const i = history.value.indexOf(ai)
				if (i !== -1) { history.value.splice(i, 1) }
				history.value.unshift(ai)

				LeekWars.setTitle(ai.name)

				if (isDiffRoute) {
					if (currentTab.value && currentTab.value.type !== 'file' && currentTab.value.id === key) {
						// Déjà sur le bon diff tab
					} else if (routeHash) {
						const diffTab = tabs1.value.find(tt => tt.type !== 'file' && (tt as DiffTab).hash === routeHash)
						if (diffTab) {
							currentTab.value = diffTab
							ensureDiffLoaded(diffTab as DiffTab)
						}
					} else {
						const diffTab = tabs1.value.find(tt => tt.type !== 'file' && tt.id === key)
						if (diffTab) {
							currentTab.value = diffTab
							ensureDiffLoaded(diffTab as DiffTab)
						} else {
							// Créer un onglet diff depuis l'URL
							const { folder, file } = resolveGitPath(key)
							if (folder !== null) {
								openDiff({ folder, file: file as string })
							}
						}
					}
					LeekWars.splitShowContent()
					LeekWars.setActions(actions_content.value)
				} else if ('line' in route.query) {
					jump(ai, parseInt(route.query.line as string), 0)
					router.replace('/editor/' + key).then(() => {
						LeekWars.splitShowContent()
						LeekWars.setActions(actions_content.value)
					})
				} else {
					LeekWars.splitShowContent()
					LeekWars.setActions(actions_content.value)
				}
			} else {
				currentFolder.value = fileSystem.folderById[parseInt(routeId)]
				currentType.value = 'folder'
				explorer.selectFolder(currentFolder.value)
				LeekWars.setTitle(t('title'), t('n_ais', [fileSystem.aiCount]))
				LeekWars.splitShowList()
				LeekWars.setActions(actions_list.value)
			}

		} else if (!LeekWars.mobile) {

			const lastCode = localStorage.getItem('editor/last-code-1')
			if (lastCode && lastCode in fileSystem.ais) {
				router.replace('/editor/' + lastCode)
			} else if (store.state.farmer) {
				for (const leekId in fileSystem.leekAIs) {
					const aiKey = fileSystem.leekAIs[leekId]
					if (aiKey in fileSystem.ais) {
						router.replace('/editor/' + aiKey)
						return
					}
				}
				router.replace('/editor/0')
			}
		} else {
			currentFolder.value = fileSystem.rootFolder
			currentType.value = 'folder'
			LeekWars.setTitle(t('title'), t('n_ais', [fileSystem.aiCount]))
			LeekWars.splitShowList()
			LeekWars.setActions(actions_list.value)
		}
	}
	watch(() => route.params.id, update)

	function restoreDaemonCache() {
		for (const path in fileSystem.ais) {
			const ai = fileSystem.ais[path]
			if (!ai.modified) continue
			if (!isLeekScript(ai.path)) continue
			// Récupérer le code sauvegardé sur le FS (depuis le cache localStorage)
			const savedCode = localStorage.getItem('ai/code/' + ai.path)
			if (savedCode !== null) {
				// Renvoyer le code du disque au daemon pour restaurer son cache
				LeekWars.socket.send([SocketMessage.EDITOR_ANALYZE, ai.path, savedCode])
			}
		}
	}

	onBeforeRouteLeave((_to, _from, next) => {
		let num = 0
		for (const i in fileSystem.ais) {
			if (fileSystem.ais[i].modified && !fileSystem.ais[i].path.startsWith('.trash/')) { num++ }
		}
		if (num > 0 && !window.confirm(t('n_ais_unsaved', [num]) as string)) {
			next(false)
		} else {
			// Réinitialiser le layout AVANT que Vue Router commence à patcher le DOM.
			// Si on le fait dans onBeforeUnmount, app.vue se re-rend pendant que
			// le <router-view> est en cours de swap, ce qui cause parentNode = null.
			LeekWars.large = false
			LeekWars.header = true
			LeekWars.footer = true
			LeekWars.box = false
			next()
		}
	})

	function save(aiEditor: InstanceType<typeof AIViewMonaco> | null = currentEditor.value) {
		if (!aiEditor) { return }
		if (aiEditor.saving) { return }
		aiEditor.saving = true
		aiEditor.save()
		aiEditor.serverError = false

		const content = aiEditor.editor.getValue()
		aiEditor.ai.code = content

		LeekWars.track('save-ai')

		LeekWars.post('ai/write', {path: aiEditor.ai.path, code: content}).then((data) => {
			aiEditor.saving = false
			aiEditor.ai.mtime = data.modified || Date.now()
			localStorage.setItem('ai/mtime/' + aiEditor.ai.path, '' + aiEditor.ai.mtime)
			localStorage.setItem('ai/code/' + aiEditor.ai.path, content)
			aiEditor.ai.modified = false

			if (data.result) {
				aiEditor.goods = []
				analyzer.applyAnalyzeResult(data.result, (ai) => {
					if (aiEditor.goods.length === 0) aiEditor.goods.push({ai})
				})
				analyzer.updateTodos(aiEditor.ai)
				analyzer.updateCount()
				setTimeout(() => aiEditor.goods = [], 2000)
			}

			emitter.emit('git-file-changed')
		}).error((error) => {
			aiEditor.serverError = true
			aiEditor.saving = false
			LeekWars.toast(translateFileSystemError(error))
		})
	}

	function openDiff(data: { folder: string, file: string, staged?: boolean, hash?: string }) {
		const fullPath = (data.folder ? data.folder + '/' : '') + data.file
		const ai = fileSystem.getAIByPath(fullPath)
		const tab: DiffTab = { type: data.hash ? 'commit' : 'diff', id: ai ? ai.path : fullPath, folder: data.folder, file: data.file, staged: data.staged, hash: data.hash, original: '', modified: '', ready: false }
		// Chercher si un onglet existe déjà
		const existing = tabs1.value.find(t => t.type !== 'file' && diffKey(t as DiffTab) === diffKey(tab))
		if (existing) {
			selectTab(existing)
		} else {
			tabs1.value.push(tab)
			fetchDiffContent(tab)
			selectTab(tab)
		}
	}

	function closeDiff() {
		if (currentTab.value && currentTab.value.type !== 'file') {
			closeTabByRef(currentTab.value)
		}
	}

	function openMerge(data: { folder: string, file: string }) {
		const fullPath = (data.folder ? data.folder + '/' : '') + data.file
		const ai = fileSystem.getAIByPath(fullPath)
		const tab: DiffTab = { type: 'merge', id: ai ? ai.path : fullPath, folder: data.folder, file: data.file, original: '', modified: '', ready: false }
		// Chercher si un onglet merge existe déjà pour ce fichier
		const existing = tabs1.value.find(t => t.type === 'merge' && (t as DiffTab).folder === data.folder && (t as DiffTab).file === data.file)
		if (existing) {
			selectTab(existing)
		} else {
			tabs1.value.push(tab)
			fetchMergeContent(tab)
			selectTab(tab)
		}
	}

	async function fetchMergeContent(tab: DiffTab) {
		try {
			const data = await LeekWars.post('git/read-file', { folder: tab.folder, file: tab.file })
			tab.modified = data.content || ''
			tab.ready = true
			diffReady.value++
		} catch (e) {
			tab.modified = ''
			tab.ready = true
			diffReady.value++
		}
	}

	function onMergeResolve(content: string, _remainingConflicts: number) {
		const merge = activeMerge.value
		if (!merge) return
		const fullPath = (merge.folder ? merge.folder + '/' : '') + merge.file
		const ai = fileSystem.getAIByPath(fullPath)
		if (ai) {
			ai.code = content
			ai.modified = true
		}
	}

	function selectTab(tab: EditorTab) {
		if (tab.type === 'file') {
			const ai = fileSystem.ais[tab.id]
			if (!ai) return
			currentTab.value = tab
			open(ai.path, 1)
		} else {
			ensureDiffLoaded(tab as DiffTab)
			// Si on switch entre deux diffs, démonter d'abord le composant git-diff
			const wasDiff = currentTab.value && currentTab.value.type !== 'file'
			if (wasDiff) {
				diffMounted.value = false
				currentTab.value = tab
				updateUrl()
				saveTabs()
				nextTick(() => { diffMounted.value = true })
			} else {
				currentTab.value = tab
				updateUrl()
				saveTabs()
			}
		}
	}

	function closeTabEvent(tab: EditorTab) {
		closeTabByRef(tab)
	}

	function closeTabByRef(tab: EditorTab) {
		const i = tabs1.value.indexOf(tab)
		if (i === -1) return
		tabs1.value.splice(i, 1)
		// Si c'est le tab actif, en sélectionner un autre
		if (currentTab.value === tab) {
			if (tabs1.value.length > 0) {
				const newIndex = Math.min(i, tabs1.value.length - 1)
				selectTab(tabs1.value[newIndex])
			} else {
				currentTab.value = null
			}
		}
		updateUrl()
		saveTabs()
	}

	function closeAllTabs(keepTab: EditorTab) {
		tabs1.value = [keepTab]
		currentTab.value = keepTab
		selectTab(keepTab)
		saveTabs()
	}

	function openDiffFile() {
		if (!currentTab.value || currentTab.value.type === 'file') return
		openAIFromDiffTab(currentTab.value as DiffTab)
	}

	function openDiffFileFromMenu(tab: EditorTab) {
		if (tab.type === 'file') return
		openAIFromDiffTab(tab as DiffTab)
	}

	function openAIFromDiffTab(diff: DiffTab) {
		const fullPath = (diff.folder ? diff.folder + '/' : '') + diff.file
		const ai = fileSystem.getAIByPath(fullPath)
		if (ai) {
			open(ai.path, 1)
		}
	}

	function saveTabs() {
		const serialized = tabs1.value.map(t => {
			if (t.type === 'file') return { type: 'file', id: t.id }
			return { type: t.type, id: t.id, folder: t.folder, file: t.file, staged: t.staged, hash: t.hash }
		})
		localStorage.setItem('editor/tabs1', JSON.stringify(serialized))
		if (currentTab.value) {
			if (currentTab.value.type === 'file') {
				localStorage.setItem('editor/current-tab', JSON.stringify({ type: 'file', id: currentTab.value.id }))
			} else {
				localStorage.setItem('editor/current-tab', JSON.stringify({ type: currentTab.value.type, key: diffKey(currentTab.value as DiffTab) }))
			}
		}
	}

	function restoreTabs() {
		if (tabs1Loaded) return
		tabs1Loaded = true
		try {
			type SavedTabData = { type?: string, id?: string, folder?: string, file?: string, staged?: boolean, hash?: string }
			const saved = JSON.parse(localStorage.getItem('editor/tabs1') || '[]') as SavedTabData[]
			for (const tt of saved) {
				if (tt.type === 'file') {
					if (tt.id && tt.id in fileSystem.ais) {
						tabs1.value.push({ type: 'file', id: tt.id })
					}
				} else {
					const tab: DiffTab = { type: (tt.type as DiffTab['type']) || 'diff', id: tt.id || '', folder: tt.folder || '', file: tt.file || '', staged: tt.staged, hash: tt.hash, original: '', modified: '', ready: false }
					tabs1.value.push(tab)
				}
			}
		} catch (e) {
			// Données corrompues
		}
	}

	function resolveGitPath(aiPath: string): { folder: string, file: string } | { folder: null, file: null } {
		// Trouver le repo git qui est un préfixe du path
		for (const repo of Object.keys(fileSystem.gitRepos)) {
			if (repo && aiPath.startsWith(repo + '/')) {
				return { folder: repo, file: aiPath.substring(repo.length + 1) }
			}
		}
		// Repo à la racine
		if ('' in fileSystem.gitRepos) {
			return { folder: '', file: aiPath }
		}
		return { folder: null, file: null }
	}

	function ensureDiffLoaded(tab: DiffTab) {
		if (!tab.ready && !tab.original && !tab.modified) {
			if (tab.type === 'merge') {
				fetchMergeContent(tab)
			} else {
				fetchDiffContent(tab)
			}
		}
	}

	async function fetchDiffContent(tab: DiffTab) {
		const safe = (url: string, params: Record<string, unknown>) => LeekWars.post(url, params).catch(() => ({ content: '' }))
		let original = ''
		let modified = ''
		try {
			if (tab.hash) {
				const [parentData, commitData] = await Promise.all([
					safe('git/show', { folder: tab.folder, hash: tab.hash + '^', file: tab.file }),
					safe('git/show', { folder: tab.folder, hash: tab.hash, file: tab.file }),
				])
				original = parentData.content || ''
				modified = commitData.content || ''
			} else if (tab.staged) {
				const [headData, indexData] = await Promise.all([
					safe('git/show', { folder: tab.folder, hash: 'HEAD', file: tab.file }),
					safe('git/show', { folder: tab.folder, hash: ':', file: tab.file }),
				])
				original = headData.content || ''
				modified = indexData.content || ''
			} else {
				// Unstaged : seul l'original (HEAD) est nécessaire, le modified vient du code live
				const headData = await safe('git/show', { folder: tab.folder, hash: 'HEAD', file: tab.file })
				original = headData.content || ''
			}
		} catch (e) {
			// Erreur de fetch
		}
		tab.original = original
		tab.modified = modified
		tab.ready = true
		diffReady.value++
	}

	function tabUrl(tab: EditorTab | null): string {
		if (!tab) return '/editor/' + (currentAI1.value || route.params.id || 0)
		if (tab.type === 'file') {
			return '/editor/' + tab.id
		}
		const diff = tab as DiffTab
		return '/editor/' + diff.id + (diff.hash ? '/h/' + diff.hash : '/diff')
	}

	function updateUrl() {
		const target = tabUrl(currentTab.value)
		if (route.path !== target) {
			router.push(target)
		}
	}

	function startDelete() {
		if (!explorerEl.value || !currentAI.value) return
		explorerEl.value.deleteAI(currentAI.value)
	}
	function startTest(editor = currentEditor.value) {
		if (!editor || !editor.ai) { return }
		if (editor.ai.modified) {
			save(editor)
			return
		}
		testDialog.value = true
	}
	function help() {
		infoDialog.value = true
	}
	function settings() {
		settingsDialog.value = true
		LeekWars.get('ai/get-storage-usage').then((data) => {
			storageUsage.value = data
		})
	}
	function add(event: MouseEvent) {
		fileMenuActivator.value = event.currentTarget as Element
		nextTick(() => {
			fileMenu.value = true
		})
	}

	watch(theme, () => localStorage.setItem('editor/theme', theme.value))
	watch(autocomplete, () => localStorage.setItem('editor/autocomplete', '' + autocomplete.value))
	watch(autoClosing, () => localStorage.setItem('editor/auto_closing', '' + autoClosing.value))
	watch(fontSize, () => localStorage.setItem('editor/font_size', '' + fontSize.value))
	watch(lineHeight, () => localStorage.setItem('editor/line_height', '' + lineHeight.value))
	watch(popups, () => localStorage.setItem('editor/popups', '' + popups.value))
	watch(diffInline, () => localStorage.setItem('editor/diff_inline', '' + diffInline.value))
	watch(diffCollapseUnchanged, () => localStorage.setItem('editor/diff_collapse_unchanged', '' + diffCollapseUnchanged.value))
	watch(hideHeader, () => {
		LeekWars.header = !hideHeader.value
		localStorage.setItem('editor/hideHeader', '' + hideHeader.value)
	})
	watch(problemsCount, (count, prev) => {
		if (count === 0 && prev > 0 && bottomPanel.value === 'problems') {
			bottomPanel.value = null
		}
	})
	watch(enableAnalyzer, () => {
		if (enableAnalyzer.value) {
			analyzer.init()
		}
		localStorage.setItem('editor/analyzer', '' + enableAnalyzer.value)
	})
	watch(enlargeWindow, () => {
		LeekWars.large = enlargeWindow.value
		localStorage.setItem('editor/large', '' + enlargeWindow.value)
	})
	watch(() => history.value.map(ai => ai.path).join('|'), () => {
		localStorage.setItem('editor/history', JSON.stringify(history.value.map(ai => ai.path)))
	})

	function jumpEvent(event: { ai: AI, line: number, column: number }) {
		jump(event.ai, event.line, event.column)
	}

	function jump(ai: AI, line: number, column: number) {
		if (showDiffViewer.value) {
			currentTab.value = tabs1.value.find(t => t.type === 'file') || null
			updateUrl()
		}
		if (!currentAI.value || ai.path !== currentAI.value.path) {
			router.push('/editor/' + ai.path)
		}
		nextTick(() => {
			editor1.value?.scrollToLine(ai, line, column)
		})
	}

	function load(ai: AI) {
		if (!(ai.path in activeAIs)) {
			activeAIs[ai.path] = ai
		}
	}

	function resizerMousedown(e: MouseEvent) {
		const startWidth = panelWidth.value
		const startX = e.clientX
		const mousemove = (ev: MouseEvent) => {
			let pw = Math.max(0, Math.min(400, startWidth + ev.clientX - startX))
			if (pw < 120) {
				pw = 0
			}
			panelWidth.value = pw
			editorTotalWidth = (editors.value as HTMLElement).clientWidth
			localStorage.setItem('editor/panel-width', '' + panelWidth.value)
		}
		const mouseup = (_ev: MouseEvent) => {
			document.documentElement!.removeEventListener('mousemove', mousemove)
			document.documentElement!.removeEventListener('mouseup', mouseup)
		}
		document.documentElement!.addEventListener('mousemove', mousemove, false)
		document.documentElement!.addEventListener('mouseup', mouseup, false)
		e.preventDefault()
	}

	function resizerEditorMousedown(e: MouseEvent) {
		const startX = e.clientX
		editorTotalWidth = (editors.value as HTMLElement).clientWidth
		const startWidth = editor1Width.value * editorTotalWidth
		const mousemove = (ev: MouseEvent) => {
			let pw = Math.max(300, Math.min(editorTotalWidth - 300, startWidth + ev.clientX - startX))
			editor1Width.value = pw / editorTotalWidth
			editor2Width.value = 1 - editor1Width.value
			localStorage.setItem('editor/editor1-width', '' + editor1Width.value)
			localStorage.setItem('editor/editor2-width', '' + editor2Width.value)
		}
		const mouseup = (_ev: MouseEvent) => {
			document.documentElement!.removeEventListener('mousemove', mousemove)
			document.documentElement!.removeEventListener('mouseup', mouseup)
		}
		document.documentElement!.addEventListener('mousemove', mousemove, false)
		document.documentElement!.addEventListener('mouseup', mouseup, false)
		e.preventDefault()
	}

	function problemsResizerMousedown(e: MouseEvent) {
		const startHeight = problemsHeight.value
		const startY = e.clientY
		const mousemove = (ev: MouseEvent) => {
			let ph = Math.max(0, startHeight + startY - ev.clientY)
			if (ph < 50) {
				ph = 0
			}
			problemsHeight.value = ph
			localStorage.setItem('editor/problems-height', '' + problemsHeight.value)
		}
		const mouseup = (_ev: MouseEvent) => {
			document.documentElement!.removeEventListener('mousemove', mousemove)
			document.documentElement!.removeEventListener('mouseup', mouseup)
		}
		document.documentElement!.addEventListener('mousemove', mousemove, false)
		document.documentElement!.addEventListener('mouseup', mouseup, false)
		e.preventDefault()
	}

	function toggleBottomPanel(panel: 'problems' | 'git') {
		// Si on clique sur 'problems' sans aucun problème : ferme le panel (ou rien si déjà fermé)
		if (panel === 'problems' && !analyzer.error_count && !analyzer.warning_count && !analyzer.todo_count) {
			bottomPanel.value = null
			return
		}
		if (problemsHeight.value === 0) {
			problemsHeight.value = 200
			bottomPanel.value = panel
		} else if (bottomPanel.value === panel) {
			bottomPanel.value = null
		} else {
			bottomPanel.value = panel
		}
	}

	function deleteAI(ai: AI) {
		// Remove from active AIs
		delete activeAIs[ai.path]
		// Remove from tabs
		const tab = tabs1.value.find(t => t.type === 'file' && t.id === ai.path)
		if (tab) {
			closeTabByRef(tab)
		}

		// Open a new one
		for (const path in fileSystem.ais) {
			if (!path.startsWith('.trash/') && !path.startsWith('/')) {
				router.replace('/editor/' + path)
				return
			}
		}
		router.replace('/editor')
	}

	function close(id: string) {
		history.value = history.value.filter(a => a.path !== id)
	}

	function closeAll() {
		history.value = []
	}

	function onVersionUpdate(version: number) {
		if (!currentAI.value) return
		currentAI.value.version = version
		if (!currentEditor.value) return
		rewritePragma('version', version)
		save(currentEditor.value)
		currentAI.value.analyze()
	}

	function onStrictUpdate(strict: boolean) {
		if (!currentAI.value) return
		currentAI.value.strict = strict
		if (!currentEditor.value) return
		rewritePragma('strict', strict)
		save(currentEditor.value)
		currentAI.value.analyze()
	}

	function rewritePragma(name: 'version' | 'strict', value: number | boolean) {
		if (!currentEditor.value) return
		const editor = currentEditor.value.editor
		const code = editor.getValue()
		const pragmaRe = new RegExp(`^[ \\t]*//[ \\t]*@${name}(?:[ \\t]*:[ \\t]*\\S+)?[ \\t]*\\r?\\n?`, 'm')
		const line = name === 'version' ? `// @version:${value}\n` : (value ? `// @strict\n` : '')
		const match = pragmaRe.exec(code)
		let newCode: string
		if (match) {
			newCode = code.substring(0, match.index) + line + code.substring(match.index + match[0].length)
		} else if (line) {
			if (name === 'strict') {
				// Insert right after @version if present, otherwise at the top
				const versionRe = /^[ \t]*\/\/[ \t]*@version(?:[ \t]*:[ \t]*\S+)?[ \t]*\r?\n?/m
				const versionMatch = versionRe.exec(code)
				if (versionMatch) {
					const insertAt = versionMatch.index + versionMatch[0].length
					newCode = code.substring(0, insertAt) + line + code.substring(insertAt)
				} else {
					newCode = line + code
				}
			} else {
				newCode = line + code
			}
		} else {
			return
		}
		if (newCode === code) return
		editor.setValue(newCode)
	}

	function setSplitted(splittedValue: boolean, ai: AI | null = null) {
		splitted.value = splittedValue
		editorTotalWidth = (editors.value as HTMLElement).clientWidth
		if (splitted.value) {
			editor1Width.value = 0.5
			editor2Width.value = 0.5
			fileSystem.load(ai!).then(() => {
				currentAI2.value = ai!.path
			})
			setSide(2)
			localStorage.setItem('editor/last-code-2', ai!.path)
		} else {
			editor1Width.value = editorTotalWidth
			setSide(1)
		}
		localStorage.setItem('editor/editor1-width', '' + editor1Width.value)
		localStorage.setItem('editor/editor2-width', '' + editor2Width.value)
		localStorage.setItem('editor/splitted', '' + splitted.value)
	}

	function open(ai: string, side: number) {
		// Ajouter un onglet fichier s'il n'existe pas
		const fileTab: FileTab = { type: 'file', id: ai }
		if (side === 1) {
			if (!tabs1.value.find(t => t.type === 'file' && t.id === ai)) {
				tabs1.value.push(fileTab)
			}
			currentTab.value = tabs1.value.find(t => t.type === 'file' && t.id === ai) || fileTab
			saveTabs()
		}
		setSide(side)
		const aiObj = fileSystem.ais[ai]
		if (aiObj) {
			fileSystem.load(aiObj).then(() => {
				side === 1 ? currentAI1.value = ai : currentAI2.value = ai
			})
		}
		updateUrl()
		localStorage.setItem('editor/last-code-' + side, '' + ai)
	}

	function split50_50() {
		editor1Width.value = 0.5
		editor2Width.value = 0.5
		localStorage.setItem('editor/editor1-width', '' + editor1Width.value)
		localStorage.setItem('editor/editor2-width', '' + editor2Width.value)
	}

	function setSide(side: number) {
		currentSide.value = side
		currentEditor.value = (currentSide.value === 1 ? editor1.value : editor2.value) as InstanceType<typeof AIViewMonaco>
	}

	function setLeftPanelTab(tab: string) {
		leftPanelTab.value = tab
		localStorage.setItem('editor/left_panel_tab', tab)
	}

	onMounted(() => {
		LeekWars.large = enlargeWindow.value
		LeekWars.footer = false
		LeekWars.box = true

		// Toast après retour d'installation GitHub App
		const gitAuth = route.query.git_auth as string | undefined
		if (gitAuth === 'success') {
			LeekWars.toast(t('git_auth_success') as string)
			// Rouvre le dialogue de conf pour ajouter un remote dans la foulée.
			// setTimeout pour laisser git-panel finir son mounted() (listeners prêts).
			setTimeout(() => emitter.emit('git-open-remote-dialog'), 0)
			router.replace({ query: { ...route.query, git_auth: undefined } })
		} else if (gitAuth === 'error') {
			LeekWars.toast(t('git_auth_error') as string)
			router.replace({ query: { ...route.query, git_auth: undefined } })
		}

		emitter.on('ctrlS', () => {
			save()
		})
		emitter.on('ctrlShiftS', () => {
			// TODO save all but analyze only entrypoints
		})
		emitter.on('ctrlQ', () => {
			testDialog.value = true
		})
		emitter.on('ctrlP', (event: Event) => {
			if (!finder.value) return
			finder.value.search = true
			finder.value.open()
			event.preventDefault()
		})
		emitter.on('escape', () => {
			finder.value?.close()
		})
		emitter.on('htmlclick', () => {
			finder.value?.close()
		})
		emitter.on('keydown', keydown)
		emitter.on('keyup', keyup)
		emitter.on('previous', (event: Event) => {
			if (!finder.value) return
			finder.value.search = false
			finder.value.open()
			finder.value.previous()
			event.preventDefault()
		})
		emitter.on('next', (event: Event) => {
			if (!finder.value) return
			finder.value.search = false
			finder.value.open()
			finder.value.next()
			event.preventDefault()
		})
		emitter.on('back', () => {
			router.push('/editor')
		})
		emitter.on('editor-drag', (item: Item) => {
			dragging.value = item
		})
		emitter.on('editor-drop', (folder: Folder) => {
			if (!dragging.value) { return }
			const parent = fileSystem.folderById[dragging.value.parent]
			if (parent === folder || dragging.value === folder) { return }
			if (dragging.value instanceof Folder && isChild(folder, dragging.value)) { return }
			const destPath = folder.id === 0 ? '' : fileSystem.getFolderPath(folder).replace(/\/$/, '')
			if (dragging.value.folder) {
				const srcPath = fileSystem.getFolderPath(dragging.value as Folder).replace(/\/$/, '')
				LeekWars.post('ai/move', {path: srcPath, dest: destPath})
			} else {
				const ai = (dragging.value as AIItem).ai
				const oldPath = ai.path
				LeekWars.post('ai/move', {path: oldPath, dest: destPath})
				delete fileSystem.ais[ai.path]
				ai.folder = folder.id
				ai.path = destPath ? destPath + '/' + ai.name : ai.name
				ai.folderpath = fileSystem.getFolderPath(folder)
				fileSystem.ais[ai.path] = ai
			}
			parent.items.splice(parent.items.indexOf(dragging.value), 1)
			folder.items.push(dragging.value)
			dragging.value.parent = folder.id
			fileSystem.sortFolder(folder)
			folder.expanded = true
			dragging.value = null
		})
		emitter.on('connected', connected)
		emitter.on('jump', jumpEvent)
		emitter.on('reanalyze', () => {
			editor1.value?.setAnalyzerTimeout()
		})

		emitter.on('close-diff', ({ folder, file }: { folder: string, file: string }) => {
			const tab = tabs1.value.find(t => t.type === 'diff' && (t as DiffTab).folder === folder && (t as DiffTab).file === file)
			if (tab) { closeTabByRef(tab) }
		})

		emitter.on('close-file-tab', (aiPath: string) => {
			const tab = tabs1.value.find(t => t.type === 'file' && t.id === aiPath)
			if (tab) { closeTabByRef(tab) }
		})

		emitter.on('close-merge-tabs', ({ folder }: { folder: string }) => {
			const mergeTabs = tabs1.value.filter(t => t.type === 'merge' && (t as DiffTab).folder === folder)
			for (const tab of mergeTabs) { closeTabByRef(tab) }
		})

		emitter.on('open-merge', ({ folder, file }: { folder: string, file: string }) => {
			openMerge({ folder, file })
		})

		if (store.state.farmer) {
			connected()
		}

		broadcast = new BroadcastChannel('channel')
		broadcast.onmessage = (event) => {
			if (event.data.type == 'editor-opened-ping') {
				broadcast?.postMessage({ type: 'editor-opened-pong' })
			}
			if (event.data.type == 'editor-opened-pong') {
				alreadyOpenedDialog.value = true
			}
		}
		broadcast.postMessage({ type: 'editor-opened-ping' })
	})

	onBeforeUnmount(() => {
		// Restaurer le cache du daemon pour les fichiers modifiés non sauvegardés
		// en renvoyant le code du disque (via localStorage) pour que le daemon
		// n'ait pas en cache une version non écrite sur le FS.
		restoreDaemonCache()

		emitter.off('ctrlS')
		emitter.off('ctrlShiftS')
		emitter.off('ctrlQ')
		emitter.off('ctrlP')
		emitter.off('escape')
		emitter.off('htmlclick')
		emitter.off('keydown', keydown)
		emitter.off('keyup', keyup)
		emitter.off('previous')
		emitter.off('next')
		emitter.off('back')
		emitter.off('editor-drag')
		emitter.off('editor-drop')
		emitter.off('connected', connected)
		emitter.off('jump', jumpEvent)
		emitter.off('reanalyze')
		emitter.off('close-diff')
		emitter.off('close-file-tab')
		emitter.off('close-merge-tabs')
		emitter.off('open-merge')
		if (broadcast) {
			broadcast.close()
		}
		if (LeekWars.didactitial_step === 4) {
			LeekWars.didactitial_next()
		}
	})
</script>

<style lang="scss" scoped>
	.editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		--pure-white: #fff;
		--pure-black: #000;
		--background: #f2f2f2;
		--background-secondary: #eee;
		--background-disabled: #bbb;
		--background-header: #e5e5e5;
		--border: #ddd;
		--text-color: #111;
		--text-color-secondary: #777;
		--type-color: #0000D0;
		color: var(--text-color);
	}
	.theme-monokai, .theme-vs-dark, .theme-hc-black {
		--pure-white: #000;
		--pure-black: #fff;
		--background: #1f1f1f;
		--background-secondary: #171717;
		--background-disabled: #555;
		--background-header: #2f2f2f;
		--border: #444;
		--text-color: #f7f7f7;
		--text-color-secondary: #aaa;
		--type-color: #0099d0;
		color: var(--text-color);
	}
	.page-header {
		flex-wrap: nowrap;
		position: relative;
		padding-right: 0;
	}
	.container {
		flex: 1;
		min-height: 0;
		gap: 0;
	}
	.menu {
		flex-shrink: 0;
		display: flex;
	}
	.v-list__tile__content {
		padding-left: 8px;
	}
	#app.app .panel {
		margin-bottom: 0;
	}
	.full {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	.resize-panel {
		max-height: 100%;
	}
	.left-panel-tabs {
		display: flex;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}
	.left-tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 6px 0;
		cursor: pointer;
		opacity: 0.5;
		border-bottom: 2px solid transparent;
		transition: opacity 0.15s, border-color 0.15s;
		.v-icon { font-size: 20px; }
		&:hover { opacity: 0.8; }
		&.active {
			opacity: 1;
			border-bottom-color: var(--text-color-secondary);
		}
	}
	.ai-list {
		overflow-y: auto;
		overflow-x: hidden;
		height: 100%;
	}
	.ai-stats {
		padding: 8px;
		margin: 10px;
		background-color: var(--pure-white);
		font-size: 14px;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	#app.app .ai-stats {
		display: none;
	}
	.line-count-wrapper, .char-count-wrapper {
		font-size: 13px;
	}
	.CodeMirror {
		font-size: 14px;
	}
	.editors {
		padding: 0;
		min-height: 0;
		flex: 1;
		display: flex;
		position: relative;
		z-index: 2;
	}
	.diff-loader {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
	.popup.input_popup input {
		width: 90%;
	}
	.clone-dialog {
		display: flex;
		flex-direction: column;
		gap: 4px;
		.clone-hint {
			display: flex;
			align-items: flex-start;
			gap: 6px;
			font-size: 12px;
			color: var(--text-color-secondary);
			padding: 6px 10px;
			background: rgba(0, 0, 0, 0.04);
			border-radius: 4px;
			.v-icon { flex-shrink: 0; margin-top: 1px; }
		}
		.clone-error {
			font-size: 13px;
			color: #c00;
			padding: 4px 0;
		}
	}
	body.dark .clone-dialog {
		.clone-hint { background: rgba(255, 255, 255, 0.05); }
		.clone-error { color: #f66; }
	}
	.ai-list :deep(.router-link-active > .item > .label) {
		background: #cacaca;
		color: black;
	}
	.panel.editor-panel {
		background: var(--background);
	}
	.folder-content {
		display: none;
		padding: 20px;
		text-align: center;
	}
	.folder-content img {
		width: 80px;
	}
	:deep(.CodeMirror) {
		height: 100%;
	}
	.editor-left {
		height: 100%;
		padding: 0;
		display: flex;
		flex-direction: column;
		border-top-right-radius: 0px;
		border-bottom-right-radius: 0px;
	}
	.editor-column {
		height: 100%;
		position: relative;
	}
	.editor-column .panel, .column3 .panel {
		margin-bottom: 0;
		height: 100%;
		border-radius: 0;
	}
	.column3 .panel {
		margin-right: 0;
		border-right: 1px solid #ddd;
	}
	.settings-dialog {
		h3 {
			margin-top: 15px;
			margin-bottom: 15px;
		}
		h3:first-child {
			margin-top: 0;
		}
		.title {
			color: #5fad1b;
			font-size: 18px;
			font-weight: 500;
			margin-top: 15px;
			margin-bottom: 10px;
		}
		.title:first-child {
			margin-top: 0;
		}
		.storage {
			.storage-label {
				display: flex;
				justify-content: space-between;
				margin-bottom: 6px;
				color: var(--text-color-secondary);
			}
			.storage-percent {
				font-weight: 500;
			}
			.storage-bar {
				height: 8px;
				border-radius: 4px;
				background: var(--border);
				overflow: hidden;
			}
			.storage-bar-fill {
				height: 100%;
				background: #5fad1b;
				transition: width 0.3s ease;
			}
			.storage-bar-warn {
				background: #f0a030;
			}
			.storage-bar-full {
				background: #d03030;
			}
		}
	}
	.column3 {
		position: relative;
		height: 100%;
	}
	.resizer {
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: center;
		.v-icon {
			font-size: 21px;
			color: var(--text-color-secondary);
		}
		&:hover {
			background: #0086bc;
			.v-icon {
				color: white;
			}
		}
	}
	.explorer-resizer {
		width: 10px;
		cursor: ew-resize;
		position: absolute;
		top: 0;
		bottom: 10px;
	}
	.editor-resizer {
		width: 10px;
		cursor: ew-resize;
		flex-shrink: 0;
		width: 10px;
		z-index: 5;
		margin-right: -10px;
	}
	.problems-resizer {
		height: 10px;
		cursor: ns-resize;
		position: absolute;
		left: 0;
		right: 0;
	}
	.dialog-input {
		width: calc(100% - 10px);
		padding: 5px;
	}
	.list-icon {
		margin-right: 12px;
	}
	.shortcuts {
		padding-left: 30px;
	}
	.status {
		flex: 0 0 36px;
		display: flex;
		align-items: center;
		border-top: 1px solid var(--border);
		.version {
			line-height: 36px;
			gap: 4px;
			user-select: none;
			cursor: pointer;
			padding: 0 10px;
			font-weight: 500;
			color: var(--text-color-secondary);
			display: flex;
			align-items: center;
			.v-icon {
				color: var(--text-color-secondary);
			}
		}
		.problems {
			height: 100%;
			line-height: 36px;
			padding: 0 10px;
			cursor: pointer;
			user-select: none;
			display: flex;
			gap: 8px;
			i {
				font-size: 17px;
				margin-bottom: 3px;
			}
			.no-error {
				color: #5fad1b;
				.v-icon {
					color: #5fad1b;
				}
			}
			.errors {
				color: red;
				i {
					color: red;
				}
			}
			.warnings {
				color: #ff9100;
				i {
					color: #ff9100;
				}
			}
			.todos {
				color: #0099ff;
			}
		}
		.git-terminal-toggle {
			color: var(--text-color-secondary);
			align-items: center;
			line-height: 1;
			.v-icon { color: var(--text-color-secondary); font-size: 16px; }
			.count {
				background: rgba(128, 128, 128, 0.25);
				padding: 1px 6px;
				border-radius: 8px;
				font-size: 11px;
				line-height: 14px;
			}
			&.active {
				background: rgba(128, 128, 128, 0.15);
			}
		}
		.filler {
			flex: 1;
		}
		.state {
			height: 100%;
			& > * {
				height: 100%;
				display: flex;
				align-items: center;
				i {
					margin-left: 3px;
				}
			}
			.ready {
				color: #5fad1b;
			}
			.running, .running i {
				color: #0084a8;
			}
			.running i {
				animation: rotate 0.7s linear infinite;
			}
			@keyframes rotate {
				0% {
					transform: rotate(0);
				}
				100% {
					transform: rotate(-360deg);
				}
			}
			.crashed {
				color: red;
			}
		}
	}
	.menu-title {
		padding: 5px 10px;
		padding-top: 10px;
		color: #777;
		font-size: 13px;
		display: flex;
		align-items: center;
		.v-icon {
			font-size: 16px;
			margin-right: 4px;
		}
	}
	.version-menu {
		.v-list-item__subtitle {
			white-space: initial;
			font-weight: 400;
			> ul {
				padding-left: 20px;
			}
			ul {
				margin: 4px 0;
			}
		}
		.green {
			background: #5fad1b;
			color: white;
			padding: 0 6px;
			border-radius: 20px;
			margin-left: 4px;
		}
		.link {
			padding: 5px;
			color: #5fad1b;
			font-weight: 500;
			display: block;
			i {
				font-size: 14px;
				vertical-align: top;
			}
			&:hover {
				text-decoration: underline;
			}
		}
	}
	code {
		display: inline-block;
		padding: 0;
	}
	.shortcut {
		font-size: 12px;
		color: #888;
		font-weight: 500;
		margin-left: 10px;
	}
	.themes:deep(.v-selection-control-group) {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		.v-selection-control {
			grid-area: auto;
		}
	}
</style>
