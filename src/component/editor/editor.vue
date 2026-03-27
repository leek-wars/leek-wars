<template lang="html">
	<div class="page editor" :class="'theme-' + theme">
		<div class="page-header page-bar">
			<div class="menu">
				<h1>{{ $t('title') }}</h1>
				<div class="tabs">
					<div ref="fileButton" class="tab first action" icon="settings">
						<v-icon>mdi-file-outline</v-icon> {{ $t('file') }}
					</div>
					<v-menu v-model="fileMenu" :activator="LeekWars.mobile ? undefined : $refs.fileButton" :target="LeekWars.mobile ? fileMenuActivator : undefined" offset-y>
						<v-list>
							<v-list-subheader v-if="currentFolder && currentFolder.id > 0" class="menu-title">
								<v-icon>mdi-folder-outline</v-icon> {{ currentFolder.name }}
							</v-list-subheader>
							<v-list-item v-if="currentFolder && currentFolder.id !== -1" v-ripple prepend-icon="mdi-file-plus-outline" @click="$refs.explorerEl.openNewAI(currentFolder)">
								<v-list-item-title>{{ $t('new_ai') }}</v-list-item-title>
							</v-list-item>
							<v-list-item v-if="currentFolder && currentFolder.id !== -1" v-ripple prepend-icon="mdi-folder-plus-outline" @click="$refs.explorerEl.openNewFolder(currentFolder)">
								<v-list-item-title>{{ $t('new_folder') }}</v-list-item-title>
							</v-list-item>
							<v-list-subheader v-if="currentAI" class="menu-title">
								<v-icon>mdi-file-outline</v-icon> <span>{{ currentAI.name }}</span>
							</v-list-subheader>
							<v-list-item v-if="currentAI" v-ripple prepend-icon="mdi-content-save" @click="save()">
								<v-list-item-title>{{ $t('save') }} <span class="shortcut">Ctrl + S</span></v-list-item-title>
							</v-list-item>
							<v-list-item v-if="currentAI" v-ripple prepend-icon="mdi-delete" @click="$refs.explorerEl.deleteAI(currentAI)">
								<v-list-item-title>{{ $t('delete') }}</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-menu>
					<div ref="settingsButton" class="tab action" icon="settings" @click="settingsDialog = true">
						<v-icon>mdi-cogs</v-icon>
					</div>
					<div :title="$t('test_desc')" class="action content tab" icon="play_arrow" @click="startTest()">
						<v-icon class="list-icon">mdi-play</v-icon><span>{{ $t('test') }}</span>
					</div>
				</div>
			</div>

			<editor-tabs v-if="!LeekWars.mobile" ref="tabs" :ais="fileSystem.ais" :history2="history" :current="currentTab" :active="currentSide === 1" :splitted="splitted" :theme="theme" group="tabs" :all-tabs="tabs1" @select="selectTab" @close-tab="closeTabEvent" @close-all="closeAllTabs" @split="setSplitted(true, $event)" :style="{ 'width': (editor1Width * 80) + '%' }" @open-file="openDiffFileFromMenu" />

			<editor-tabs v-if="splitted && !LeekWars.mobile" ref="tabs2" :ais="fileSystem.ais" :history2="history" :current="currentAI2" :active="currentSide === 2" :splitted="splitted" :theme="theme" group="tabs2" @close="close" @close-all="closeAll" :style="{ 'width': (editor2Width * 100) + '%' }" @open="open($event, 2)" @close-panel="setSplitted(false)" />

			<editor-finder ref="finder" :active="activeAIs" :history="history" />
		</div>

		<div class="container last">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" :style="{width: LeekWars.mobile ? '100%' : panelWidth + 'px'}" class="resize-panel">
				<panel class="editor-left editor-panel first">
					<template #content>
						<div class="full">
							<div class="left-panel-tabs">
								<div :class="{active: leftPanelTab === 'explorer'}" class="left-tab" @click="leftPanelTab = 'explorer'" :title="$t('title')">
									<v-icon>mdi-file-tree</v-icon>
								</div>
								<div v-if="Object.keys(fileSystem.gitRepos).length > 0" :class="{active: leftPanelTab === 'git'}" class="left-tab" @click="leftPanelTab = 'git'" title="Git">
									<v-icon>mdi-source-branch</v-icon>
								</div>
							</div>

							<template v-if="leftPanelTab === 'explorer'">
								<div v-if="fileSystem.rootFolder" v-autostopscroll class="ai-list">
									<explorer ref="explorerEl" :current-ai="currentAI" :selected-folder="currentFolder" @test="startTest" @delete-ai="deleteAI" />
								</div>

								<div v-if="currentEditor && currentEditor.loaded && panelWidth" class="ai-stats">
									<div class="line-count-wrapper">{{ $tc('main.n_lines', currentEditor.lines) }}</div>
									<div class="char-count-wrapper">{{ $tc('main.n_characters', currentEditor.characters) }}</div>
									<div v-if="currentAI.included_lines !== 0" class="line-count-wrapper">{{ $tc('main.n_total_lines', currentEditor.lines + currentAI.included_lines) }}</div>
									<div v-if="currentAI.included_chars !== 0" class="char-count-wrapper">{{ $tc('main.n_total_chars', currentEditor.characters + currentAI.included_chars) }}</div>
								</div>
							</template>

							<git-panel v-if="leftPanelTab === 'git'" :theme="theme" @show-diff="openDiff" />
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

								<ai-view-monaco v-if="currentAI1" v-show="!showDiffViewer" ref="editor1" :ai="fileSystem.ais[currentAI1]" :theme="theme" :font-size="fontSize" :line-height="lineHeight" :popups="popups" :auto-closing="autoClosing" :autocomplete-option="autocomplete" :line-numbers="true" :t="$t" @jump="jump" @load="load" @focus="setSide(1)" :style="{ 'width': (editor1Width * 100) + '%' }" />

								<div v-if="splitted" v-show="!showDiffViewer" class="resizer editor-resizer" @dblclick="split50_50" @mousedown="resizerEditorMousedown">
									<v-icon>mdi-drag-vertical-variant</v-icon>
								</div>

								<ai-view-monaco v-if="splitted && currentAI2" v-show="!showDiffViewer" ref="editor2" :ai="fileSystem.ais[currentAI2]" :theme="theme" :font-size="fontSize" :line-height="lineHeight" :popups="popups" :auto-closing="autoClosing" :autocomplete-option="autocomplete" :line-numbers="true" :t="$t" @jump="jump" @load="load" @focus="setSide(2)" :style="{ 'width': (editor2Width * 100) + '%' }" />

								<git-diff v-if="diffMounted && activeDiff && activeDiff.ready" v-show="showDiffViewer" :original-content="activeDiff.original" :modified-content="activeDiff.modified" :file="activeDiff.file" :theme="theme" :font-size="fontSize" :line-height="lineHeight" :inline="diffInline" :collapse-unchanged="diffCollapseUnchanged" @close="closeDiff" @open-file="openDiffFile" />

							</div>

							<span v-if="LeekWars.didactitial_step === 4" class="dida-hint shaking">
								<span class="bubble" v-html="$t('main.dida_8')" v-chat-code-latex></span>
								<span class="arrow"></span>
							</span>

							<div v-if="showProblemsDetails && problemsHeight && (analyzer.error_count || analyzer.warning_count || analyzer.todo_count)" :style="{height: problemsHeight + 'px'}">
								<div class="resizer problems-resizer" @mousedown="problemsResizerMousedown">
									<v-icon>mdi-drag-horizontal-variant</v-icon>
								</div>
								<editor-problems @jump="jump" />
							</div>
							<div class="status">
								<v-menu v-if="currentAI" top :offset-y="true" :nudge-top="1" :max-width="600" :close-on-content-click="false">
									<template #activator="{ props }">
										<div v-ripple class="version" v-bind="props">
											LeekScript&nbsp;{{ currentAI.version }} <span v-if="currentAI.strict">&nbsp;({{ $t('strict') }})</span>
											<v-icon>mdi-chevron-down</v-icon>
										</div>
									</template>
									<leekscript-versions v-model:version="currentAI.version" v-model:strict="currentAI.strict" @update:version="updateVersion" @update:strict="updateStrictMode" />
								</v-menu>
								<div v-ripple class="problems" @click="toggleProblems">
									<span v-if="!analyzer.error_count && !analyzer.warning_count" class="no-error">
										<v-icon>mdi-check-circle</v-icon> <span v-if="!LeekWars.mobile">{{ $t('no_problem') }}</span>
									</span>
									<span v-if="analyzer.error_count" class="errors">
										<v-icon>mdi-close-circle</v-icon> {{ analyzer.error_count }} {{ $tc('error', analyzer.error_count).toLowerCase() }}
									</span>
									<span v-if="analyzer.warning_count" class="warnings">
										<v-icon>mdi-alert-circle</v-icon> {{ analyzer.warning_count }} {{ $tc('warning', analyzer.warning_count).toLowerCase() }}
									</span>
									<span v-if="analyzer.todo_count" class="todos">
										<v-icon>mdi-format-list-checks</v-icon> {{ analyzer.todo_count }} {{ $tc('todo', analyzer.todo_count).toLowerCase() }}
									</span>
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

		<editor-test ref="editorTest" v-model="testDialog" :ais="fileSystem.ais" :leek-ais="fileSystem.leekAIs" :currentAI="currentAI" />

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

<script lang="ts">
	import { locale } from '@/locale'
	import { AI } from '@/model/ai'
	import { fileSystem } from '@/model/filesystem'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import AIViewMonaco from './ai-view-monaco.vue'
	import EditorFinder from './editor-finder.vue'
	import { AIItem, Folder, Item } from './editor-item'
	import { explorer } from './explorer'
	const Explorer = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-explorer.${locale}.i18n`))
	const EditorTabs = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-tabs.${locale}.i18n`))
	const EditorTest = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-test.${locale}.i18n`))
	const EditorProblems = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-problems.${locale}.i18n`))
	const GitPanel = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/editor/git-panel.${locale}.i18n`))
	import GitDiff from './git-diff.vue'
	import type { EditorTab, FileTab, DiffTab } from './editor-tabs.vue'
	import './leekscript-monokai.scss'
	import { SocketMessage } from '@/model/socket'
	import { analyzer } from './analyzer'
	import AIElement from '@/component/app/ai.vue'
	import { defineAsyncComponent, nextTick } from 'vue'
	import { emitter } from '@/model/vue'
	import LeekscriptVersions from '../app/leekscript-versions.vue'

	const DEFAULT_FONT_SIZE = 16
	const DEFAULT_LINE_HEIGHT = 24
	const DEFAULT_THEME = () => LeekWars.darkMode ? "monokai" : "leek-wars"

	@Options({
		name: 'editor', i18n: {},
		components: {
			'ai-view-monaco': AIViewMonaco,
			'editor-test': EditorTest,
			'editor-tabs': EditorTabs,
			'explorer': Explorer,
			'editor-finder': EditorFinder,
			'editor-problems': EditorProblems,
			'git-panel': GitPanel,
			'git-diff': GitDiff,
			ai: AIElement,
			LeekscriptVersions,
		},
		mixins: [...mixins]
	})
	export default class EditorPage extends Vue {

		analyzer = analyzer
		activeAIs: {[key: number]: AI} = {}
		currentAI1: number | null = null
		currentAI2: number | null = null
		currentSide: number = 1
		currentEditor: AIViewMonaco | null = null
		currentType: string | null = null
		currentFolder: Folder | null = null
		infoDialog: boolean = false
		settingsDialog: boolean = false
		enlargeWindow: boolean = false
		theme: string = DEFAULT_THEME
		autoClosing: boolean = false
		autocomplete: boolean = false
		enableAnalyzer: boolean = false
		popups: boolean = false
		diffInline: boolean = false
		diffCollapseUnchanged: boolean = true
		hideHeader: boolean = false
		fontSize: number = DEFAULT_FONT_SIZE
		lineHeight: number = DEFAULT_LINE_HEIGHT
		dragging: Item | null = null
		testDialog: boolean = false
		panelWidth: number = 200
		problemsHeight: number = 200
		newAIv2Dialog: boolean = false
		showProblemsDetails: boolean = true
		fileSystem = fileSystem
		fileMenu: boolean = false
		fileMenuActivator: any = null
		history: AI[] = []
		alreadyOpenedDialog: boolean = false
		leftPanelTab: string = 'explorer'
		tabs1: EditorTab[] = []
		tabs1Loaded: boolean = false
		currentTab: EditorTab | null = null
		diffMounted: boolean = true
		broadcast: BroadcastChannel = new BroadcastChannel('channel')
		get actions_list() {
			return [
				{icon: 'mdi-plus', click: (e: any) => this.add(e)},
				{icon: 'mdi-cogs', click: () => this.settings() }
			]
		}
		get actions_content() {
			return [
				{icon: 'mdi-content-save', click: () => this.save()},
				{icon: 'mdi-delete', click: () => this.startDelete()},
				{icon: 'mdi-play', click: () => this.startTest()},
			]
		}
		editor1Width: number = 0.5
		editor2Width: number = 0.5
		editorTotalWidth: number = 800
		splitted: boolean = true

		get currentID() {
			if (this.currentType === 'ai' && this.currentAI) { return this.currentAI.id }
			if (this.currentFolder) { return this.currentFolder.id }
			return 0
		}
		get currentAI() {
			return fileSystem.ais[this.currentSide === 1 ? this.currentAI1! : this.currentAI2!]
		}
		get showDiffViewer(): boolean {
			return this.currentTab !== null && this.currentTab.type !== 'file'
		}
		get activeDiff(): DiffTab | null {
			if (!this.currentTab || this.currentTab.type === 'file') return null
			return this.currentTab as DiffTab
		}
		get diffTabs(): DiffTab[] {
			return this.tabs1.filter((t): t is DiffTab => t.type !== 'file')
		}
		get activeDiffIndex(): number {
			if (!this.currentTab || this.currentTab.type === 'file') return -1
			return this.diffTabs.findIndex(d => this.diffKey(d) === this.diffKey(this.currentTab as DiffTab))
		}
		diffKey(tab: DiffTab): string {
			return tab.folder + ':' + tab.file + ':' + (tab.hash || (tab.staged ? 's' : 'w'))
		}

		async created() {
			LeekWars.footer = false
			LeekWars.box = true
			if (localStorage.getItem('editor/autocomplete') === null) { localStorage.setItem('editor/autocomplete', 'true') }
			if (localStorage.getItem('editor/auto_closing') === null) { localStorage.setItem('editor/auto_closing', 'true') }
			if (localStorage.getItem('editor/popups') === null) { localStorage.setItem('editor/popups', 'true') }
			if (localStorage.getItem('editor/analyzer') === null) { localStorage.setItem('editor/analyzer', 'false') }
			LeekWars.large = this.enlargeWindow = localStorage.getItem('editor/large') === 'true'
			this.theme = localStorage.getItem('editor/theme') || DEFAULT_THEME()
			this.autoClosing = localStorage.getItem('editor/auto_closing') === 'true'
			this.autocomplete = localStorage.getItem('editor/autocomplete') === 'true'
			this.popups = localStorage.getItem('editor/popups') === 'true'
			this.diffInline = localStorage.getItem('editor/diff_inline') === 'true'
			this.diffCollapseUnchanged = localStorage.getItem('editor/diff_collapse_unchanged') !== 'false'
			this.hideHeader = localStorage.getItem('editor/hideHeader') === 'true'
			this.enableAnalyzer = false // localStorage.getItem('editor/analyzer') === 'true'
			this.fontSize = parseInt(localStorage.getItem('editor/font_size') || '', 10) || DEFAULT_FONT_SIZE
			this.lineHeight = parseInt(localStorage.getItem('editor/line_height') || '', 10) || DEFAULT_LINE_HEIGHT
			this.problemsHeight = parseInt(localStorage.getItem('editor/problems-height') || '', 10) || 200
			this.panelWidth = parseInt(localStorage.getItem('editor/panel-width') || '', 10) || 200
			this.splitted = localStorage.getItem('editor/splitted') === 'true'
			this.editor1Width = parseFloat(localStorage.getItem('editor/editor1-width') || '') || (this.splitted ? 0.5 : 1)
			this.editor2Width = parseFloat(localStorage.getItem('editor/editor2-width') || '') || 0.5
			this.currentAI2 = parseInt(localStorage.getItem('editor/last-code-2') || '') || null

			LeekWars.loadEncyclopedia(locale)

			const docMessages = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)
			i18n.global.mergeLocaleMessage(locale, { doc: docMessages.default })
		}

		connected() {
			// Chargement de l'historique
			const history = JSON.parse(localStorage.getItem('editor/history') || '[]')
			for (const id of history) {
				if (id in fileSystem.ais) {
					this.history.push(fileSystem.ais[id])
				}
			}
			LeekWars.setTitle(this.$t('title'), this.$t('n_ais', [fileSystem.aiCount]))
			this.restoreTabs()
			this.update()
			this.loadGitRepos()
		}

		loadGitRepos() {
			LeekWars.post('git/repos').then((data: any) => {
				const repos: {[path: string]: boolean} = {}
				for (const r of data.repos) { repos[r.folder] = true }
				fileSystem.gitRepos = repos
			})
		}

		mounted() {
			LeekWars.large = this.enlargeWindow
			LeekWars.footer = false
			LeekWars.box = true

			emitter.on('ctrlS', () => {
				this.save()
			})
			emitter.on('ctrlShiftS', () => {
				// TODO save all but analyze only entrypoints
				// this.saveAll()
			})
			emitter.on('ctrlQ', () => {
				this.testDialog = true
			})
			// emitter.on('ctrlF', (event: Event) => {
			// 	if (this.currentEditor) {
			// 		this.currentEditor.search()
			// 		event.preventDefault()
			// 	}
			// })
			emitter.on('ctrlP', (event: Event) => {
				const finder = this.$refs.finder as EditorFinder
				finder.search = true
				finder.open()
				event.preventDefault()
				// for (const editor of (this.$refs.editors as AIView[])) {
				// 	editor.ctrlUp()
				// }
			})
			emitter.on('escape', () => {
				(this.$refs.finder as EditorFinder).close()
			})
			emitter.on('htmlclick', () => {
				(this.$refs.finder as EditorFinder).close()
			})
			emitter.on('keydown', this.keydown)
			emitter.on('keyup', this.keyup)
			emitter.on('previous', (event: Event) => {
				const finder = this.$refs.finder as EditorFinder
				finder.search = false
				finder.open()
				finder.previous()
				event.preventDefault()
			})
			emitter.on('next', (event: Event) => {
				const finder = this.$refs.finder as EditorFinder
				finder.search = false
				finder.open()
				finder.next()
				event.preventDefault()
			})
			emitter.on('back', () => {
				this.$router.push('/editor')
			})
			emitter.on('editor-drag', (item: any) => {
				this.dragging = item
			})
			emitter.on('editor-drop', (folder: Folder) => {
				if (!this.dragging) { return }
				const parent = fileSystem.folderById[this.dragging.parent]
				if (parent === folder || this.dragging === folder) { return }
				if (this.dragging instanceof Folder && this.isChild(folder, this.dragging)) { return }
				parent.items.splice(parent.items.indexOf(this.dragging), 1)
				folder.items.push(this.dragging)
				this.dragging.parent = folder.id
				fileSystem.sortFolder(folder)
				folder.expanded = true
				LeekWars.post(this.dragging.folder ? 'ai-folder/change-folder' : 'ai/change-folder', this.dragging.folder ? {folder_id: (this.dragging as Folder).id, dest_folder_id: folder.id} : {ai_id: (this.dragging as AIItem).ai.id, folder_id: folder.id})
				this.dragging = null
			})
			emitter.on('connected', this.connected)
			emitter.on('jump', this.jumpEvent)

			if (store.state.farmer) {
				this.connected()
			}

			this.broadcast.onmessage = (event) => {
				if (event.data.type == 'editor-opened-ping') {
					this.broadcast.postMessage({ type: 'editor-opened-pong' })
				}
				if (event.data.type == 'editor-opened-pong') {
					this.alreadyOpenedDialog = true
				}
			}
			this.broadcast.postMessage({ type: 'editor-opened-ping' })
		}

		isChild(folder: Folder, parent: Folder): boolean {
			let current = folder
			while (current.id !== 0) {
				if (current.id === parent.id) { return true }
				current = fileSystem.folderById[current.parent]
			}
			return false
		}

		toggleFileMenu(event?: Event) {
			if (LeekWars.mobile && event) {
				this.fileMenuActivator = event.target
			} else {
				this.fileMenuActivator = this.$refs.fileButton as HTMLElement
			}
			nextTick(() => {
				this.fileMenu = !this.fileMenu
			})
		}

		keydown(e: KeyboardEvent) {
			// Up and down arrows while Alt + Left/right
			const finder = this.$refs.finder as EditorFinder
			if (e.altKey && finder.value) {
				if (e.which === 40) { finder.previous() }
				else if (e.which === 38) { finder.next() }
			}
		}

		keyup(e: KeyboardEvent) {
			if (e.which === 18) {
				const finder = this.$refs.finder as EditorFinder
				finder.go(this.history[finder.selected])
			}
		}

		@Watch('$route.params.id')
		update() {
			const routeHash = this.$route.params.hash as string | undefined
			const isDiffRoute = routeHash || this.$route.path.endsWith('/diff')
			if (this.$route.hash) {
				if (this.$route.hash.startsWith('#leek-')) {
					const id = parseInt(this.$route.hash.substring(6))
					this.testDialog = true
					setTimeout(() => {
						const test = this.$refs.editorTest as any
						test.currentTab = 1
						if (test.allLeeks[id]) {
							test.selectLeek(test.allLeeks[id])
						}
					}, 200)
				}
			}
			if (this.$route.params.id) {
				const id = parseInt(this.$route.params.id, 10)
				// console.log("fileSystem", Object.values(fileSystem.ais).length)
				if (id > 0 && id in fileSystem.ais) {
					const ai = fileSystem.ais[id]
					fileSystem.load(ai).then(() => {
						if (this.currentSide === 1) {
							this.currentAI1 = id
						} else {
							this.currentAI2 = id
						}
						nextTick(() => {
							this.currentEditor = (this.currentSide === 1 ? this.$refs.editor1 : this.$refs.editor2) as AIViewMonaco
						})
					})
					localStorage.setItem('editor/last-code-' + this.currentSide, '' + id)
					this.currentType = 'ai'
					this.currentFolder = fileSystem.folderById[ai.folder]
					if (!(id in this.activeAIs)) {
						this.activeAIs[ai.id] = ai
					}
					explorer.selectAI(ai)
					if (this.currentSide === 1 && !isDiffRoute) {
						const fileTab: FileTab = { type: 'file', id }
						if (!this.tabs1.find(t => t.type === 'file' && t.id === id)) {
							this.tabs1.push(fileTab)
							this.saveTabs()
						}
						this.currentTab = this.tabs1.find(t => t.type === 'file' && t.id === id) || fileTab
					}
					// Ajout dans l'historique
					const i = this.history.indexOf(ai)
					if (i !== -1) { this.history.splice(i, 1) }
					this.history.unshift(ai)

					LeekWars.setTitle(ai.name)

					if (isDiffRoute) {
						// Activer le diff viewer pour la route /diff ou /hash
						// Ne pas écraser currentTab si c'est déjà un diff tab avec le bon id
						if (this.currentTab && this.currentTab.type !== 'file' && this.currentTab.id === id) {
							// Déjà sur le bon diff tab, ne rien faire
						} else if (routeHash) {
							const diffTab = this.tabs1.find(t => t.type !== 'file' && (t as DiffTab).hash === routeHash)
							if (diffTab) {
								this.currentTab = diffTab
							}
						} else {
							const diffTab = this.tabs1.find(t => t.type !== 'file' && t.id === id)
							if (diffTab) {
								this.currentTab = diffTab
							}
						}
						LeekWars.splitShowContent()
						LeekWars.setActions(this.actions_content)
					} else if ('line' in this.$route.query) {
						this.jump(ai, parseInt(this.$route.query.line as string), 0)
						this.$router.replace('/editor/' + id).then(() => {
							LeekWars.splitShowContent()
							LeekWars.setActions(this.actions_content)
						})
					} else {
						LeekWars.splitShowContent()
						LeekWars.setActions(this.actions_content)
					}
				} else {
					this.currentFolder = fileSystem.folderById[id]
					this.currentType = 'folder'
					explorer.selectFolder(this.currentFolder)
					LeekWars.setTitle(this.$t('title'), this.$t('n_ais', [fileSystem.aiCount]))
					LeekWars.splitShowList()
					LeekWars.setActions(this.actions_list)
				}

			} else if (!LeekWars.mobile) {

				const lastCode = localStorage.getItem('editor/last-code-1')
				if (lastCode && parseInt(lastCode, 10) > 0 && lastCode in fileSystem.ais) {
					this.$router.replace('/editor/' + localStorage.getItem('editor/last-code-1'))
				} else if (store.state.farmer) {
					for (const ai in store.state.farmer.leek_ais) {
						if (store.state.farmer.leek_ais[ai] in fileSystem.ais) {
							this.$router.replace('/editor/' + store.state.farmer.leek_ais[ai])
							return
						}
					}
					this.$router.replace('/editor/0') // Go to root folder to be able to create a new AI
				}
			} else {
				this.currentFolder = fileSystem.rootFolder
				this.currentType = 'folder'
				LeekWars.setTitle(this.$t('title'), this.$t('n_ais', [fileSystem.aiCount]))
				LeekWars.splitShowList()
				LeekWars.setActions(this.actions_list)
			}
		}

		beforeUnmount() {
			emitter.off('ctrlS')
			emitter.off('ctrlShiftS')
			emitter.off('ctrlQ')
			emitter.off('ctrlF')
			emitter.off('ctrlP')
			emitter.off('escape')
			emitter.off('htmlclick')
			emitter.off('keydown', this.keydown)
			emitter.off('keyup', this.keyup)
			emitter.off('previous')
			emitter.off('next')
			emitter.off('back')
			emitter.off('connected', this.connected)
			emitter.off('jump', this.jumpEvent)
			LeekWars.large = false
			LeekWars.header = true
			LeekWars.footer = true
			LeekWars.box = false
			if (this.broadcast) {
				this.broadcast.close()
			}
			if (LeekWars.didactitial_step === 4) {
				LeekWars.didactitial_next()
			}
		}

		beforeRouteLeave(to: Route, from: Route, next: Function) {
			let num = 0
			for (const i in fileSystem.ais) {
				if (fileSystem.ais[i].modified) { num++ }
			}
			if (!next) { return num === 0 }
			if (num > 0 && !window.confirm(this.$i18n.t('n_ais_unsaved', [num]) as string)) {
				next(false)
			} else {
				next()
			}
		}

		save(aiEditor: AIViewMonaco | null = this.currentEditor) {
			// console.log("save", aiEditor, this.currentEditor)
			if (!aiEditor) { return }
			if (aiEditor.saving) { return }
			aiEditor.saving = true
			aiEditor.save()
			aiEditor.serverError = false

			const saveID = aiEditor.ai.id
			const content = aiEditor.editor.getValue()
			aiEditor.ai.code = content

			LeekWars.track('save-ai')

			LeekWars.post('ai/save', {ai_id: saveID, code: content}).then(data => {
				if (aiEditor === null) { return }
				aiEditor.saving = false
				if (!data.result || data.result.length === 0) {
					aiEditor.serverError = true
					return
				}

				aiEditor.ai.timestamp = data.modified
				localStorage.setItem('ai/time/' + aiEditor.ai.id, '' + data.modified)
				localStorage.setItem('ai/code/' + aiEditor.ai.id, content)

				aiEditor.goods = []

				for (const entrypoint in data.result) {
					const entrypoint_id = parseInt(entrypoint, 10)
					const ai = fileSystem.ais[entrypoint_id]

					// Valid?
					let valid = true
					for (const problem of data.result[entrypoint]) {
						if (problem[0] === 0) { valid = false; break }
					}
					if (valid && aiEditor.goods.length === 0) {
						aiEditor.goods.push({ai})
					}
					ai['valid'] = valid
					analyzer.handleProblems(ai, data.result[entrypoint])
				}
				analyzer.updateTodos(aiEditor.ai)
				analyzer.updateCount()
				setTimeout(() => aiEditor.goods = [], 2000)
				emitter.emit('git-file-changed')

				// if (aiEditor.needTest) {
				// 	aiEditor.needTest = false
				// 	if (aiEditor.ai.valid) {
				// 		this.startTest()
				// 	}
				// }
			}).error(() => {
				if (aiEditor === null) { return }
				aiEditor.serverError = true
				aiEditor.saving = false
			})
		}

		saveAll() {
			// for (const aiEditor of (this.$refs.editors as AIView[])) {
			// 	this.save(aiEditor)
			// }
		}

		openDiff(data: { folder: string, file: string, staged?: boolean, hash?: string }) {
			const fullPath = (data.folder ? data.folder + '/' : '') + data.file
			const ai = fileSystem.getAIByPath(fullPath)
			const tab: DiffTab = { type: data.hash ? 'commit' : 'diff', id: ai ? ai.id : 0, folder: data.folder, file: data.file, staged: data.staged, hash: data.hash, original: '', modified: '', ready: false }
			// Chercher si un onglet existe déjà
			const existing = this.tabs1.find(t => t.type !== 'file' && this.diffKey(t as DiffTab) === this.diffKey(tab))
			if (existing) {
				this.currentTab = existing
			} else {
				this.tabs1.push(tab)
				this.currentTab = tab
				this.fetchDiffContent(tab)
			}
			this.updateUrl()
			this.saveTabs()
		}

		closeDiff() {
			if (this.currentTab && this.currentTab.type !== 'file') {
				this.closeTabByRef(this.currentTab)
			}
		}

		selectTab(tab: EditorTab) {
			if (tab.type === 'file') {
				const ai = fileSystem.ais[tab.id]
				if (!ai) return
				this.currentTab = tab
				this.open(ai.id, 1)
			} else {
				// Si on switch entre deux diffs, démonter d'abord le composant git-diff
				const wasDiff = this.currentTab && this.currentTab.type !== 'file'
				if (wasDiff) {
					this.diffMounted = false
					this.currentTab = tab
					this.updateUrl()
					this.saveTabs()
					nextTick(() => { this.diffMounted = true })
				} else {
					this.currentTab = tab
					this.updateUrl()
					this.saveTabs()
				}
			}
		}

		closeTabEvent(tab: EditorTab) {
			this.closeTabByRef(tab)
		}

		closeTabByRef(tab: EditorTab) {
			const i = this.tabs1.indexOf(tab)
			if (i === -1) return
			this.tabs1.splice(i, 1)
			// Si c'est le tab actif, en sélectionner un autre
			if (this.currentTab === tab) {
				if (this.tabs1.length > 0) {
					const newIndex = Math.min(i, this.tabs1.length - 1)
					this.selectTab(this.tabs1[newIndex])
				} else {
					this.currentTab = null
				}
			}
			this.updateUrl()
			this.saveTabs()
		}

		closeAllTabs(keepTab: EditorTab) {
			this.tabs1 = [keepTab]
			this.currentTab = keepTab
			this.selectTab(keepTab)
			this.saveTabs()
		}

		openDiffFile() {
			if (!this.currentTab || this.currentTab.type === 'file') return
			this.openAIFromDiffTab(this.currentTab as DiffTab)
		}

		openDiffFileFromMenu(tab: EditorTab) {
			if (tab.type === 'file') return
			this.openAIFromDiffTab(tab as DiffTab)
		}

		private openAIFromDiffTab(diff: DiffTab) {
			const fullPath = (diff.folder ? diff.folder + '/' : '') + diff.file
			const ai = fileSystem.getAIByPath(fullPath)
			if (ai) {
				this.open(ai.id, 1)
			}
		}

		saveTabs() {
			const serialized = this.tabs1.map(t => {
				if (t.type === 'file') return { type: 'file', id: t.id }
				return { type: t.type, id: t.id, folder: t.folder, file: t.file, staged: t.staged, hash: t.hash }
			})
			localStorage.setItem('editor/tabs1', JSON.stringify(serialized))
			if (this.currentTab) {
				if (this.currentTab.type === 'file') {
					localStorage.setItem('editor/current-tab', JSON.stringify({ type: 'file', id: this.currentTab.id }))
				} else {
					localStorage.setItem('editor/current-tab', JSON.stringify({ type: this.currentTab.type, key: this.diffKey(this.currentTab as DiffTab) }))
				}
			}
		}

		restoreTabs() {
			if (this.tabs1Loaded) return
			this.tabs1Loaded = true
			try {
				const saved: any[] = JSON.parse(localStorage.getItem('editor/tabs1') || '[]')
				for (const t of saved) {
					if (t.type === 'file') {
						if (t.id in fileSystem.ais) {
							this.tabs1.push({ type: 'file', id: t.id })
						}
					} else {
						const tab: DiffTab = { type: t.type || 'diff', id: t.id || 0, folder: t.folder, file: t.file, staged: t.staged, hash: t.hash, original: '', modified: '', ready: false }
						this.tabs1.push(tab)
						this.fetchDiffContent(tab)
					}
				}
			} catch (e) {
				// Données corrompues
			}
		}

		async fetchDiffContent(tab: DiffTab) {
			const safe = (url: string, params: any) => LeekWars.post(url, params).catch(() => ({ content: '' }))
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
					const [headData, fileData] = await Promise.all([
						safe('git/show', { folder: tab.folder, hash: 'HEAD', file: tab.file }),
						safe('git/read-file', { folder: tab.folder, file: tab.file }),
					])
					original = headData.content || ''
					modified = fileData.content || ''
				}
			} catch (e) {
				// Erreur de fetch
			}
			tab.original = original
			tab.modified = modified
			tab.ready = true
		}

		tabUrl(tab: EditorTab | null): string {
			if (!tab) return '/editor/' + (this.currentAI1 || this.$route.params.id || 0)
			if (tab.type === 'file') {
				return '/editor/' + tab.id
			}
			const diff = tab as DiffTab
			return '/editor/' + diff.id + '/' + (diff.hash || 'diff')
		}

		updateUrl() {
			const target = this.tabUrl(this.currentTab)
			if (this.$route.path !== target) {
				this.$router.push(target)
			}
		}

		startDelete() {
			const explorer = this.$refs.explorerEl as any
			if (!explorer) return
			explorer.deleteDialog = true
		}
		startTest(editor = this.currentEditor) {
			if (!editor || !editor.ai) { return }
			if (editor.ai.modified) {
				// editor.needTest = true
				this.save(editor)
				return
			}
			this.testDialog = true
		}
		help() {
			this.infoDialog = true
		}
		settings() {
			this.settingsDialog = true
		}
		add(event: any) {
			this.fileMenuActivator = event.currentTarget
			nextTick(() => {
				this.fileMenu = true
			})
		}
		@Watch('theme') themeChange() {
			localStorage.setItem('editor/theme', this.theme)
		}
		@Watch('autocomplete') autocompleteChange() {
			localStorage.setItem('editor/autocomplete', '' + this.autocomplete)
		}
		@Watch('autoClosing') autoClosingChange() {
			localStorage.setItem('editor/auto_closing', '' + this.autoClosing)
		}
		@Watch('fontSize') fontSizeChange() {
			localStorage.setItem('editor/font_size', '' + this.fontSize)
		}
		@Watch('lineHeight') lineHeightChange() {
			localStorage.setItem('editor/line_height', '' + this.lineHeight)
		}
		@Watch('popups') popupsChange() {
			localStorage.setItem('editor/popups', '' + this.popups)
		}
		@Watch('diffInline') diffInlineChange() {
			localStorage.setItem('editor/diff_inline', '' + this.diffInline)
		}
		@Watch('diffCollapseUnchanged') diffCollapseUnchangedChange() {
			localStorage.setItem('editor/diff_collapse_unchanged', '' + this.diffCollapseUnchanged)
		}
		@Watch('hideHeader') hideHeaderChange() {
			LeekWars.header = !this.hideHeader
			localStorage.setItem('editor/hideHeader', '' + this.hideHeader)
		}
		@Watch('enableAnalyzer') analyzerChange() {
			if (this.enableAnalyzer) {
				analyzer.init()
			}
			localStorage.setItem('editor/analyzer', '' + this.enableAnalyzer)
		}
		@Watch('enlargeWindow') enlargeWindowChange() {
			LeekWars.large = this.enlargeWindow
			localStorage.setItem('editor/large', '' + this.enlargeWindow)
		}

		getAiView(ai: AI) {
			return (this.$refs.editors as AIView[]).find(e => e.ai === ai)
		}

		jumpEvent(event) {
			this.jump(event.ai, event.line, event.column)
		}

		jump(ai: AI, line: number, column: number) {
			if (this.showDiffViewer) {
				this.currentTab = this.tabs1.find(t => t.type === 'file') || null
				this.updateUrl()
			}
			if (!this.currentAI || ai.id !== this.currentAI.id) {
				this.$router.push('/editor/' + ai.id)
			}
			nextTick(() => {
				const editor = this.$refs.editor1 as AIViewMonaco
				if (editor) { editor.scrollToLine(ai, line, column) }
			})
		}

		load(ai: AI) {
			if (!(ai.id in this.activeAIs)) {
				this.activeAIs[ai.id] = ai
			}
		}

		resizerMousedown(e: MouseEvent) {
			const startWidth = this.panelWidth
			const startX = e.clientX
			const mousemove: any = (ev: MouseEvent) => {
				let panelWidth = Math.max(0, Math.min(400, startWidth + ev.clientX - startX))
				if (panelWidth < 120) {
					panelWidth = 0
				}
				this.panelWidth = panelWidth
				this.editorTotalWidth = (this.$refs.editors! as HTMLElement).clientWidth
				localStorage.setItem('editor/panel-width', '' + this.panelWidth)
			}
			const mouseup: any = (ev: MouseEvent) => {
				document.documentElement!.removeEventListener('mousemove', mousemove)
				document.documentElement!.removeEventListener('mouseup', mouseup)
			}
			document.documentElement!.addEventListener('mousemove', mousemove, false)
			document.documentElement!.addEventListener('mouseup', mouseup, false)
			e.preventDefault()
		}

		resizerEditorMousedown(e: MouseEvent) {
			const startX = e.clientX
			this.editorTotalWidth = (this.$refs.editors! as HTMLElement).clientWidth
			const startWidth = this.editor1Width * this.editorTotalWidth
			const mousemove: any = (ev: MouseEvent) => {
				let panelWidth = Math.max(300, Math.min(this.editorTotalWidth - 300, startWidth + ev.clientX - startX))
				this.editor1Width = panelWidth / this.editorTotalWidth
				this.editor2Width = 1 - this.editor1Width
				localStorage.setItem('editor/editor1-width', '' + this.editor1Width)
				localStorage.setItem('editor/editor2-width', '' + this.editor2Width)
			}
			const mouseup: any = (ev: MouseEvent) => {
				document.documentElement!.removeEventListener('mousemove', mousemove)
				document.documentElement!.removeEventListener('mouseup', mouseup)
			}
			document.documentElement!.addEventListener('mousemove', mousemove, false)
			document.documentElement!.addEventListener('mouseup', mouseup, false)
			e.preventDefault()
		}

		problemsResizerMousedown(e: MouseEvent) {
			const startHeight = this.problemsHeight
			const startY = e.clientY
			const mousemove: any = (ev: MouseEvent) => {
				let problemsHeight = Math.max(0, startHeight + startY - ev.clientY)
				if (problemsHeight < 50) {
					problemsHeight = 0
				}
				this.problemsHeight = problemsHeight
				localStorage.setItem('editor/problems-height', '' + this.problemsHeight)
			}
			const mouseup: any = (ev: MouseEvent) => {
				document.documentElement!.removeEventListener('mousemove', mousemove)
				document.documentElement!.removeEventListener('mouseup', mouseup)
			}
			document.documentElement!.addEventListener('mousemove', mousemove, false)
			document.documentElement!.addEventListener('mouseup', mouseup, false)
			e.preventDefault()
		}

		toggleProblems() {
			if (this.problemsHeight === 0) {
				this.problemsHeight = 200
			} else {
				this.showProblemsDetails = !this.showProblemsDetails
			}
		}

		// problems(entrypoint: number, ai: AI, problems: Problem[]) {

		// 	const editor = this.getAiView(ai)
		// 	if (!editor) { return }

		// 	editor.addErrorOverlay(entrypoint, problems)
		// }

		deleteAI(ai: AI) {
			// Remove from active AIs
			delete this.activeAIs[ai.id]
			// Remove from tabs
			const tab = this.tabs1.find(t => t.type === 'file' && t.id === ai.id)
			if (tab) {
				this.closeTabByRef(tab)
			}
			// Clear the AI from scenarios
			(this.$refs.editorTest as any).onAIDeleted(ai.id)

			// Open a new one
			for (const fai in fileSystem.ais) {
				if (parseInt(fai, 10) > 0) { // Not bot ai
					this.$router.replace('/editor/' + fai)
					return
				}
			}
			this.$router.replace('/editor')
		}

		close(id: number) {
			this.history = this.history.filter(a => a.id !== id)
		}

		closeAll() {
			this.history = []
		}

		@Watch('history')
		updateHistory() {
			localStorage.setItem('editor/history', JSON.stringify(this.history.map(ai => ai.id)))
		}

		updateVersion() {
			if (!this.currentEditor) return
			LeekWars.put('ai/version', {ai_id: this.currentAI.id, version: this.currentAI.version})
			this.rewritePragma('version', this.currentAI.version)
			this.save(this.currentEditor)
			this.currentAI.analyze()
		}

		updateStrictMode() {
			if (!this.currentEditor) return
			LeekWars.put('ai/strict', {ai_id: this.currentAI.id, strict: this.currentAI.strict})
			this.rewritePragma('strict', this.currentAI.strict)
			this.save(this.currentEditor)
			this.currentAI.analyze()
		}

		rewritePragma(name: 'version' | 'strict', value: number | boolean) {
			if (!this.currentEditor) return
			const editor = this.currentEditor.editor
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

		setSplitted(splitted: boolean, ai: AI | null = null) {
			this.splitted = splitted
			this.editorTotalWidth = (this.$refs.editors! as HTMLElement).clientWidth
			if (this.splitted) {
				this.editor1Width = 0.5
				this.editor2Width = 0.5
				fileSystem.load(ai!).then(() => {
					this.currentAI2 = ai!.id
				})
				this.setSide(2)
				localStorage.setItem('editor/last-code-2', '' + ai!.id)
			} else {
				this.editor1Width = this.editorTotalWidth
				this.setSide(1)
			}
			localStorage.setItem('editor/editor1-width', '' + this.editor1Width)
			localStorage.setItem('editor/editor2-width', '' + this.editor2Width)
			localStorage.setItem('editor/splitted', '' + this.splitted)
		}

		open(ai: number, side: number) {
			// Ajouter un onglet fichier s'il n'existe pas
			const fileTab: FileTab = { type: 'file', id: ai }
			if (side === 1) {
				if (!this.tabs1.find(t => t.type === 'file' && t.id === ai)) {
					this.tabs1.push(fileTab)
				}
				this.currentTab = this.tabs1.find(t => t.type === 'file' && t.id === ai) || fileTab
				this.saveTabs()
			}
			this.setSide(side)
			const aiObj = fileSystem.ais[ai]
			if (aiObj) {
				fileSystem.load(aiObj).then(() => {
					side === 1 ? this.currentAI1 = ai : this.currentAI2 = ai
				})
			}
			this.updateUrl()
			localStorage.setItem('editor/last-code-' + side, '' + ai)
		}

		split50_50() {
			this.editor1Width = 0.5
			this.editor2Width = 0.5
			localStorage.setItem('editor/editor1-width', '' + this.editor1Width)
			localStorage.setItem('editor/editor2-width', '' + this.editor2Width)
		}

		setSide(side: number) {
			this.currentSide = side
			this.currentEditor = (this.currentSide === 1 ? this.$refs.editor1 : this.$refs.editor2) as AIViewMonaco
		}
	}
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
	.popup.input_popup input {
		width: 90%;
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
