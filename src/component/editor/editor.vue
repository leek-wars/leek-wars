<template lang="html">
	<div class="editor" :class="'theme-' + theme">
		<div class="page-header page-bar">
			<div class="menu">
				<h1>{{ $t('title') }}</h1>
				<!-- <div v-if="currentAI" class="info">{{ currentAI.name }}</div> -->
				<div class="tabs">
					<div ref="fileButton" class="tab first action" icon="settings">
						<v-icon>mdi-file-outline</v-icon> Fichier
					</div>
					<v-menu v-model="fileMenu" :activator="LeekWars.mobile ? addMenuActivator : $refs.fileButton" offset-y>
						<v-list>
							<div v-if="currentFolder && currentFolder.id !== 0" class="menu-title">
								<v-icon>mdi-folder-outline</v-icon> {{ currentFolder.name }}
							</div>
							<v-list-item v-ripple @click="$refs.explorer.openNewAI(currentFolder)">
								<v-icon class="list-icon">mdi-file-plus-outline</v-icon>
								<v-list-item-content>
									<v-list-item-title>{{ $t('new_ai') }}</v-list-item-title>
								</v-list-item-content>
							</v-list-item>
							<!-- <v-list-item v-ripple @click="openNewAI(true)">
								<v-icon class="list-icon">mdi-file-star-outline</v-icon>
								<v-list-item-content>
									<v-list-item-title>{{ $t('new_v2') }}
										<tooltip>
											<template v-slot:activator="{ on }">
												<span class="label-beta" v-on="on">bêta <v-icon>mdi-information-outline</v-icon></span>
											</template>
											{{ $t('v2_beta_message') }}
										</tooltip>
									</v-list-item-title>
								</v-list-item-content>
							</v-list-item> -->
							<v-list-item v-ripple @click="$refs.explorer.openNewFolder(currentFolder)">
								<v-icon class="list-icon">mdi-folder-plus-outline</v-icon>
								<v-list-item-content>
									<v-list-item-title>{{ $t('new_folder') }}</v-list-item-title>
								</v-list-item-content>
							</v-list-item>
							<div v-if="currentAI" class="menu-title">
								<v-icon>mdi-file-outline</v-icon> {{ currentAI.name }}
							</div>
							<v-list-item v-if="currentAI" v-ripple @click="save">
								<v-icon class="list-icon">mdi-content-save</v-icon>
								<v-list-item-content>
									<v-list-item-title>{{ $t('save') }}</v-list-item-title>
								</v-list-item-content>
							</v-list-item>
							<v-list-item v-if="currentAI" v-ripple @click="$refs.explorer.deleteAI(currentAI)">
								<v-icon class="list-icon">mdi-delete</v-icon>
								<v-list-item-content>
									<v-list-item-title>{{ $t('delete') }}</v-list-item-title>
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
					<div ref="settingsButton" class="tab action" icon="settings" @click="settingsDialog = true">
						<v-icon>mdi-cogs</v-icon>
					</div>
					<div :title="$t('test_desc')" class="action content tab" icon="play_arrow" @click="test">
						<v-icon class="list-icon">mdi-play</v-icon><span>{{ $t('test') }}</span>
					</div>
				</div>
			</div>
			<editor-tabs v-if="!LeekWars.mobile" ref="tabs" :current="currentID" :ais="fileSystem.ais" @close="close" @close-all="closeAll" />

			<editor-finder ref="finder" :active="activeAIs" :history="history" />
		</div>

		<div class="container">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" :style="{width: LeekWars.mobile ? '100%' : panelWidth + 'px'}" class="column3">
				<panel class="editor-left first">
					<div slot="content" class="full">
						<div v-if="fileSystem.rootFolder" v-autostopscroll class="ai-list">
							<explorer ref="explorer" :current-ai="currentAI" :selected-folder="currentFolder" @test="test" @delete-ai="deleteAI" />
						</div>

						<div v-if="currentEditor && currentEditor.loaded && panelWidth" class="ai-stats">
							<div class="line-count-wrapper">{{ $tc('main.n_lines', currentEditor.lines) }}</div>
							<div class="char-count-wrapper">{{ $tc('main.n_characters', currentEditor.characters) }}</div>
							<div v-if="currentAI.included_lines !== 0" class="line-count-wrapper">{{ $tc('main.n_total_lines', currentEditor.lines + currentAI.included_lines) }}</div>
							<div v-if="currentAI.included_chars !== 0" class="char-count-wrapper">{{ $tc('main.n_total_chars', currentEditor.characters + currentAI.included_chars) }}</div>
						</div>
						<br>
						<!--
						<div id='export-button' class="button" title="{export_desc}">▼ {{ $t('export') }}</div>
						<div id='import-button' class="button" title="{import_desc}">▲ {{ $t('import') }}</div>
						-->
					</div>
				</panel>
			</div>

			<div v-show="!LeekWars.mobile || LeekWars.splitBack" :style="{width: 'calc(100% - ' + (LeekWars.mobile ? 0 : panelWidth) + 'px)'}" class="column9">
				<panel>
					<div slot="content" class="editor-left">
						<div :class="{tabs: $refs.tabs && $refs.tabs.tabs.length > 1}" class="editors">
							<ai-view v-for="ai in activeAIs" ref="editors" :key="ai.id" :ai="ai" :ais="fileSystem.ais" :editors="$refs.editors" :visible="currentAI === ai" :font-size="fontSize" :line-height="lineHeight" :popups="popups" :auto-closing="autoClosing" :autocomplete-option="autocomplete" @jump="jump" @load="load" @problems="problems" />
						</div>
						<div v-if="currentEditor" class="compilation">
							<div v-if="currentEditor.saving" class="compiling">
								<loader :size="15" /> {{ $t('saving') }}
							</div>
							<div class="results">
								<div v-for="(good, g) in goods" :key="g" class="good" v-html="'✓ ' + (good.ai !== currentAI ? currentAI.name + ' ➞ ' : '') + $t('valid_ai', [good.ai.name])"></div>
								<div v-if="currentEditor.serverError" class="error" @click="currentEditor.serverError = false">× <i>{{ $t('server_error') }}</i></div>
								<div v-for="(error, e) in errors" :key="e" class="error" @click="errors.splice(e, 1)">
									× <span v-html="$t('ai_error', [error.ai, error.line])"></span> ▶ {{ error.message }}
								</div>
							</div>
						</div>

						<div v-if="showProblemsDetails && problemsHeight && (LeekWars.analyzer.error_count || LeekWars.analyzer.warning_count || LeekWars.analyzer.todo_count)" class="problems-details" :style="{height: problemsHeight + 'px'}">
							<div class="problems-resizer" @mousedown="problemsResizerMousedown"></div>
							<div v-for="(problems, ai) in LeekWars.analyzer.problems" v-if="problems.length" :key="ai">
								<div class="file" @click="toggleProblemFile(ai)">
									<v-icon>{{ problemsCollapsed[ai] ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
									{{ ai }}
									<span v-if="fileSystem.aiByFullPath[ai].errors" class="count error">{{ fileSystem.aiByFullPath[ai].errors }}</span>
									<span v-if="fileSystem.aiByFullPath[ai].warnings" class="count warning">{{ fileSystem.aiByFullPath[ai].warnings }}</span>
									<span v-if="fileSystem.aiByFullPath[ai].todos" class="count todo">{{ fileSystem.aiByFullPath[ai].todos }}</span>
								</div>
								<div v-if="!problemsCollapsed[ai]">
									<div v-for="(problem, p) in problems" :key="p" class="problem" @click="jumpProblem(ai, problem)">
										<v-icon v-if="problem[4] === 0" class="error">mdi-close-circle-outline</v-icon>
										<v-icon v-else-if="problem[4] === 1" class="warning">mdi-alert-circle-outline</v-icon>
										<v-icon v-else class="todo">mdi-format-list-checks</v-icon>
										<!-- {{ $t('ls_error.' + problem[5], problem[6]) }} -->
										{{ problem[5] }}
										<span class="line">ligne {{ problem[0] }} [{{ problem[1] }} : {{ problem[3] }}]</span>
									</div>
								</div>
							</div>
						</div>
						<div class="status">
							<div v-ripple class="problems" @click="toggleProblems">
								<span v-if="LeekWars.analyzer.error_count + LeekWars.analyzer.warning_count + LeekWars.analyzer.todo_count === 0" class="no-error">
									<v-icon>mdi-check-circle</v-icon> Aucun problème
								</span>
								<span v-else>
									<span v-if="LeekWars.analyzer.error_count" class="errors">
										<v-icon>mdi-close-circle</v-icon> {{ LeekWars.analyzer.error_count }} erreurs
									</span>
									<span v-if="LeekWars.analyzer.warning_count" class="warnings">
										<v-icon>mdi-alert-circle</v-icon> {{ LeekWars.analyzer.warning_count }} warnings
									</span>
									<span v-if="LeekWars.analyzer.todo_count" class="todos">
										<v-icon>mdi-format-list-checks</v-icon> {{ LeekWars.analyzer.todo_count }} todos
									</span>
								</span>
							</div>
							<div class="filler"></div>
							<div v-if="enableAnalyzer" class="state">
								<div v-if="LeekWars.analyzer.running == 0" class="ready">
									Prêt
									<v-icon>mdi-check</v-icon>
								</div>
								<div v-else class="running">
									En cours d'analyse
									<v-icon>mdi-sync</v-icon>
								</div>
							</div>
						</div>
					</div>
				</panel>
			</div>
		</div>

		<div class="error-tooltip"></div>

		<popup v-model="settingsDialog" :width="620">
			<v-icon slot="icon">mdi-cogs</v-icon>
			<span slot="title">{{ $t('settings') }}</span>
			<div class="settings-dialog">
				<div class="title">{{ $t('display') }}</div>
				<template v-if="!LeekWars.mobile">
					<v-checkbox v-model="enlargeWindow" :label="$t('enlarge_window')" hide-details />
					<v-checkbox v-model="hideHeader" :label="$t('hide_header')" hide-details />
					<br>
				</template>
				{{ $t('font_size') }} : <input v-model="fontSize" type="number" min="6" max="30">
				<br>
				{{ $t('line_height') }} : <input v-model="lineHeight" type="number" min="10" max="50">

				<div class="title">Thème</div>

				<v-radio-group v-model="theme" hide-details>
					<v-radio label="Leek Wars" value="leek-wars" />
					<v-radio label="Monokai" value="monokai" />
				</v-radio-group>

				<div class="title">{{ $t('settings_editor') }}</div>

				<v-checkbox v-model="autoClosing" :label="$t('auto_closing')" hide-details />
				<v-checkbox v-model="enableAnalyzer" :label="$t('analyzer')" hide-details />
				<v-checkbox v-model="autocomplete" :label="$t('autocompletion')" hide-details />
				<v-checkbox v-model="popups" :label="$t('popups')" hide-details />

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
				</ul>
			</div>
		</popup>

		<editor-test ref="editorTest" v-model="testDialog" :ais="fileSystem.ais" :leek-ais="fileSystem.leekAIs" />

		<!--
		<popup v-model="newAIv2Dialog" :width="500">
			<v-icon slot="icon">mdi-plus-circle-outline</v-icon>
			<span slot="title">{{ $t('new_desc') }}</span>
			<div class="padding">
				<input ref="newAIInputv2" v-model="newAIName" :placeholder="$t('ai_name')" type="text" class="input dialog-input" @keyup.enter="newAI(true, newAIName)">
			</div>
			<div slot="actions">
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
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import { Route } from 'vue-router'
	import AIView from './ai-view.vue'
	import Analyzer from './analyzer'
	import EditorFinder from './editor-finder.vue'
	import { AIItem, Folder, Item } from './editor-item'
	import { explorer } from './explorer'
	const Explorer = () => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-explorer.${locale}.i18n`)
	const EditorTabs = () => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-tabs.${locale}.i18n`)
	const EditorTest = () => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-test.${locale}.i18n`)
	import { generateKeywords } from './keywords'
	import './leekscript-monokai.scss'
	import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)

	const DEFAULT_FONT_SIZE = 16
	const DEFAULT_LINE_HEIGHT = 24
	const DEFAULT_THEME = "leek-wars"

	@Component({
		name: 'editor', i18n: {},
		components: { 'ai-view': AIView, 'editor-test': EditorTest, 'editor-tabs': EditorTabs, 'explorer': Explorer, 'editor-finder': EditorFinder },
		mixins
	})
	export default class EditorPage extends Vue {
		activeAIs: {[key: number]: AI} = {}
		currentAI: AI | null = null
		currentEditor: AIView | null = null
		currentType: string | null = null
		currentFolder: Folder | null = null
		errors: any[] = []
		goods: any[] = []
		infoDialog: boolean = false
		settingsDialog: boolean = false
		addMenu: boolean = false
		addMenuActivator: any = null
		enlargeWindow: boolean = false
		theme: string = DEFAULT_THEME
		autoClosing: boolean = false
		autocomplete: boolean = false
		enableAnalyzer: boolean = true
		popups: boolean = false
		hideHeader: boolean = false
		fontSize: number = DEFAULT_FONT_SIZE
		lineHeight: number = DEFAULT_LINE_HEIGHT
		dragging: Item | null = null
		testDialog: boolean = false
		tabs: AI[] = []
		panelWidth: number = 200
		problemsHeight: number = 200
		newAIv2Dialog: boolean = false
		showProblemsDetails: boolean = true
		problemsCollapsed: {[key: string]: boolean} = {}
		fileSystem = fileSystem
		fileMenu: boolean = false
		history: AI[] = []
		actions_list = [
			{icon: 'mdi-plus', click: (e: any) => this.add(e)},
			{icon: 'mdi-cogs', click: () => this.settings() }
		]
		actions_content = [
			{icon: 'mdi-content-save', click: () => this.save()},
			{icon: 'mdi-delete', click: () => this.startDelete()},
			{icon: 'mdi-play', click: () => this.test()},
		]
		get currentID() {
			if (this.currentType === 'ai' && this.currentAI) { return this.currentAI.id }
			if (this.currentFolder) { return this.currentFolder.id }
			return 0
		}

		created() {
			if (!LeekWars.keywords.length) {
				LeekWars.keywords = generateKeywords()
			}
			if (localStorage.getItem('editor/autocomplete') === null) { localStorage.setItem('editor/autocomplete', 'true') }
			if (localStorage.getItem('editor/auto_closing') === null) { localStorage.setItem('editor/auto_closing', 'true') }
			if (localStorage.getItem('editor/popups') === null) { localStorage.setItem('editor/popups', 'true') }
			if (localStorage.getItem('editor/analyzer') === null) { localStorage.setItem('editor/analyzer', 'true') }
			this.enlargeWindow = localStorage.getItem('editor/large') === 'true'
			this.theme = localStorage.getItem('editor/theme') || DEFAULT_THEME
			this.autoClosing = localStorage.getItem('editor/auto_closing') === 'true'
			this.autocomplete = localStorage.getItem('editor/autocomplete') === 'true'
			this.popups = localStorage.getItem('editor/popups') === 'true'
			this.hideHeader = localStorage.getItem('editor/hideHeader') === 'true'
			this.enableAnalyzer = localStorage.getItem('editor/analyzer') === 'true'
			this.fontSize = parseInt(localStorage.getItem('editor/font_size') || '', 10) || DEFAULT_FONT_SIZE
			this.lineHeight = parseInt(localStorage.getItem('editor/line_height') || '', 10) || DEFAULT_LINE_HEIGHT
			this.problemsHeight = parseInt(localStorage.getItem('editor/problems-height') || '', 10) || 200
			this.panelWidth = parseInt(localStorage.getItem('editor/panel-width') || '', 10) || 200

			if (this.enableAnalyzer) {
				LeekWars.analyzer.init()
			}

			fileSystem.init().then(() => {

				// Chargement de l'historique
				const history = JSON.parse(localStorage.getItem('editor/history') || '[]')
				for (const id of history) {
					if (id in fileSystem.ais) {
						this.history.push(fileSystem.ais[id])
					}
				}

				this.update()
				LeekWars.setTitle(this.$t('title'), this.$t('n_ais', [fileSystem.aiCount]))
			})
		}

		mounted() {
			LeekWars.footer = false
			LeekWars.box = true
			this.$root.$on('ctrlS', () => {
				this.save()
			})
			this.$root.$on('ctrlQ', () => {
				this.testDialog = true
			})
			this.$root.$on('ctrlF', (event: Event) => {
				if (this.currentEditor) {
					this.currentEditor.search()
					event.preventDefault()
				}
			})
			this.$root.$on('ctrlP', (event: Event) => {
				const finder = this.$refs.finder as EditorFinder
				finder.search = true
				finder.open()
				event.preventDefault()
			})
			this.$root.$on('escape', () => {
				if (this.currentEditor) {
					this.currentEditor.closeSearch()
				}
				(this.$refs.finder as EditorFinder).close()
			})
			this.$root.$on('htmlclick', () => {
				if (this.currentEditor) {
					this.currentEditor.close()
				}
				(this.$refs.finder as EditorFinder).close()
			})
			this.$root.$on('keydown', (e: KeyboardEvent) => {
				if (this.currentEditor) {
					this.currentEditor.editorKeyDown(e)
				}
				// Up and down arrows while Alt + Left/right
				const finder = this.$refs.finder as EditorFinder
				if (e.altKey && finder.value) {
					if (e.which === 40) { finder.previous() }
					else if (e.which === 38) { finder.next() }
				}
			})
			this.$root.$on('keyup', (e: KeyboardEvent) => {
				// console.log("editor keyup", e)
				if (this.currentEditor) {
					this.currentEditor.editorKeyUp(e)
				}
				if (e.which === 18) {
					const finder = this.$refs.finder as EditorFinder
					finder.go(this.history[finder.selected])
				}
			})
			this.$root.$on('previous', (event: Event) => {
				const finder = this.$refs.finder as EditorFinder
				finder.search = false
				finder.open()
				finder.previous()
				event.preventDefault()
			})
			this.$root.$on('next', (event: Event) => {
				const finder = this.$refs.finder as EditorFinder
				finder.search = false
				finder.open()
				finder.next()
				event.preventDefault()
			})
			this.$root.$on('back', () => {
				this.$router.push('/editor')
			})
			this.$root.$on('editor-drag', (item: any) => {
				this.dragging = item
			})
			this.$root.$on('editor-drop', (folder: Folder) => {
				if (!this.dragging) { return }
				const parent = fileSystem.folderById[this.dragging.parent]
				if (parent === folder || this.dragging === folder) { return }
				if (this.dragging instanceof Folder && this.isChild(folder, this.dragging)) { return }
				parent.items.splice(parent.items.indexOf(this.dragging), 1)
				folder.items.push(this.dragging)
				this.dragging.parent = folder.id
				folder.expanded = true
				LeekWars.post(this.dragging.folder ? 'ai-folder/change-folder' : 'ai/change-folder', this.dragging.folder ? {folder_id: (this.dragging as Folder).id, dest_folder_id: folder.id} : {ai_id: (this.dragging as AIItem).ai.id, folder_id: folder.id})
				this.dragging = null
			})
		}
		isChild(folder: Folder, parent: Folder): boolean {
			let current = folder
			while (current.id !== 0) {
				if (current.id === parent.id) { return true }
				current = fileSystem.folderById[current.parent]
			}
			return false
		}

		@Watch('$route.params.id')
		update() {
			if (this.$route.params.id) {
				const id = parseInt(this.$route.params.id, 10)
				if (id in fileSystem.ais) {
					const ai = fileSystem.ais[id]
					this.currentAI = ai
					this.currentType = 'ai'
					this.currentFolder = fileSystem.folderById[ai.folder]
					localStorage.setItem('editor/last_code', '' + id)
					if (!(id in this.activeAIs)) {
						Vue.set(this.$data.activeAIs, ai.id, this.currentAI)
					}
					Vue.nextTick(() => {
						this.currentEditor = (this.$refs.editors as AIView[]).find(editor => editor.ai === ai) || null
						explorer.selectAI(this.currentAI!)
					})
					if (this.$refs.tabs) {
						(this.$refs.tabs as any).add(this.currentAI)
					}
					// Ajout dans l'historique
					const i = this.history.indexOf(this.currentAI)
					if (i !== -1) { this.history.splice(i, 1) }
					this.history.unshift(this.currentAI)

					LeekWars.setTitle(this.currentAI.name)
					LeekWars.splitShowContent()
					LeekWars.setActions(this.actions_content)
				} else {
					this.currentFolder = fileSystem.folderById[id]
					this.currentType = 'folder'
					explorer.selectFolder(this.currentFolder)
					LeekWars.splitShowList()
					LeekWars.setActions(this.actions_list)
				}

			} else if (!LeekWars.mobile) {
				const lastCode = localStorage.getItem('editor/last_code')
				if (lastCode && lastCode in fileSystem.ais) {
					this.$router.replace('/editor/' + localStorage.getItem('editor/last_code'))
				} else if (LeekWars.objectSize(fileSystem.ais) > 0) {
					this.$router.replace('/editor/' + LeekWars.firstKey(fileSystem.ais))
				} else {
					this.$router.replace('/editor/0') // Go to root folder to be able to create a new AI
				}
			} else {
				LeekWars.splitShowList()
				LeekWars.setActions(this.actions_list)
			}
		}

		destroyed() {
			this.$root.$off('ctrlS')
			this.$root.$off('ctrlQ')
			this.$root.$off('ctrlF')
			this.$root.$off('ctrlP')
			this.$root.$off('escape')
			this.$root.$off('htmlclick')
			this.$root.$off('keydown')
			this.$root.$off('keyup')
			this.$root.$off('previous')
			this.$root.$off('next')
			LeekWars.large = false
			LeekWars.header = true
			LeekWars.footer = true
			LeekWars.box = false
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

		save() {
			if (!this.currentEditor) { return }
			if (this.currentEditor.saving || !this.currentEditor.loaded) { return }
			this.currentEditor.saving = true
			this.currentEditor.ai.modified = false
			this.currentEditor.serverError = false
			this.errors = []

			const saveID = this.currentEditor.id > 0 ? this.currentEditor.id : 0
			const content = this.currentEditor.editor.getValue()

			this.currentEditor.updateIncludes()

			LeekWars.post('ai/save', {ai_id: saveID, code: content}).then(data => {
				if (this.currentEditor === null) { return }
				this.currentEditor.saving = false
				if (this.currentEditor.ai.v2) {
					//
				} else {
					if (!data.result || data.result.length === 0) {
						this.currentEditor.serverError = true
						return
					}
					this.errors = []
					this.goods = []
					LeekWars.analyzer.clearProblems()

					for (const res of data.result) {
						const code = res[0]
						const ai = fileSystem.ais[res[1]]
						const ai_name = ai ? ai.name : 'AI #' + res[1]
						const editor = this.getAiView(ai)!
						editor.removeErrors()
						if (code === 2) {
							this.goods.push({ai})
							ai.valid = true
						} else if (code === 1) {
							this.errors.push({ai: ai_name, error: res[2], line: res[3]})
							ai.valid = false
						} else if (code === 0) {
							const line = res[2]
							let info = res[4]
							if (res.length === 7) {
								info = this.$t('leekscript.' + res[5], res[6])
							} else {
								info = this.$t('leekscript.' + res[5])
							}
							info = '(' + res[4] + ') ' + info
							// this.errors.push({ai: ai_name, message: info, line})
							ai.valid = false
							// if (editor) { editor.showError(line) }

							const token = editor.editor.getTokenAt({line: line - 1, ch: res[3] - 1})
							const problems = [
								[line, token.start, line, token.end - 1, 0, info]
							]
							LeekWars.analyzer.setAIProblems(ai.path, problems)
							LeekWars.analyzer.updateCount()
							this.problems({ [ai.path]: problems })
						}
					}
					setTimeout(() => this.goods = [], 2000)
				}
				this.currentEditor.updateFunctions()
				if (this.currentEditor.needTest) {
					this.currentEditor.needTest = false
					if (this.currentEditor.ai.valid) {
						this.test()
					}
				}
			}).error(() => {
				if (this.currentEditor === null) { return }
				this.currentEditor.serverError = true
				this.currentEditor.saving = false
			})
		}
		startDelete() {
			(this.$refs.explorer as any).deleteDialog = true
		}
		test() {
			if (!this.currentAI || !this.currentEditor) { return }
			if (this.currentAI.modified) {
				this.currentEditor.needTest = true
				this.save()
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
			if (!this.addMenuActivator) {
				this.addMenu = true
				this.addMenuActivator = event.target
			}
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
		@Watch('hideHeader') hideHeaderChange() {
			LeekWars.header = !this.hideHeader
			localStorage.setItem('editor/hideHeader', '' + this.hideHeader)
		}
		@Watch('enableAnalyzer') analyzerChange() {
			if (this.enableAnalyzer) {
				LeekWars.analyzer.init()
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

		jump(ai: AI, line: number) {
			if (ai !== this.currentAI) {
				this.$router.push('/editor/' + ai.id)
			}
			Vue.nextTick(() => {
				const editor = this.getAiView(ai)
				if (editor) { editor.scrollToLine(line - 1) }
			})
		}
		jumpProblem(path: string, problem: any) {
			const ai = fileSystem.aiByFullPath[path]
			this.jump(ai, problem[0])
		}
		load(ai: AI) {
			if (!(ai.id in this.activeAIs)) {
				Vue.set(this.$data.activeAIs, ai.id, ai)
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

		toggleProblemFile(ai: string) {
			Vue.set(this.problemsCollapsed, ai, !this.problemsCollapsed[ai])
		}

		problems(problems: any) {
			for (const ai in problems) {

				const errors = problems[ai]
				const editor = this.getAiView(fileSystem.aiByFullPath[ai])
				if (!editor) { continue }

				// console.log("errors", errors)
				editor.addErrorOverlay(errors)
				// if (!errors || errors.length === 0) {
				// 	this.ai.valid = true
				// 	this.error = false
				// 	this.errors = []
				// 	return true
				// } else {
				// 	this.addErrorOverlay(errors)
				// 	return false
				// }
			}
		}

		deleteAI(ai: AI) {
			// Remove from active AIs
			Vue.delete(this.$data.activeAIs, '' + ai.id)
			// Remove from tabs
			if (this.$refs.tabs) {
				(this.$refs.tabs as any).close(ai, false)
			}
			// Clear the AI from scenarios
			(this.$refs.editorTest as any).onAIDeleted(ai.id)

			// Open a new one
			if (!LeekWars.isEmptyObj(fileSystem.ais)) {
				this.$router.replace('/editor/' + LeekWars.firstKey(fileSystem.ais))
			} else {
				this.$router.replace('/editor')
			}
		}

		close(ai: AI) {
			this.history = this.history.filter(a => a !== ai)
		}

		closeAll() {
			this.history = []
		}

		@Watch('history')
		updateHistory() {
			localStorage.setItem('editor/history', JSON.stringify(this.history.map(ai => ai.id)))
		}
	}
</script>

<style lang="scss" scoped>
	.editor {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.page-header {
		flex-wrap: nowrap;
		position: relative;
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
	.v-menu {
		display: none;
	}
	#app.app .panel {
		margin-bottom: 0;
	}
	.full {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	.ai-list {
		overflow-y: auto;
		overflow-x: hidden;
		height: 100%;
	}
	.ai-stats {
		padding: 8px;
		margin: 10px;
		background-color: white;
		font-size: 14px;
		margin-bottom: -6px;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	#app.app .ai-stats {
		display: none;
	}
	.line-count-wrapper, .char-count-wrapper {
		font-size: 13px;
	}
	.compilation {
		position: fixed;
		bottom: 150px;
		right: 50%;
		left: 50%;
		width: 500px;
		margin-left: -250px;
		text-align: center;
		z-index: 1000;
	}
	.compiling {
		padding: 5px 10px;
		border-radius: 2px;
		color: black;
		background: #f2f2f2;
		margin: 4px;
		display: inline-block;
	}
	.compiling .loader {
		display: inline-block;
		padding: 0;
		padding-right: 5px;
	}
	.results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.results .good, .results .error {
		padding: 5px 10px;
		border-radius: 2px;
		margin: 4px;
	}
	.results {
		cursor: pointer;
	}
	.results .good {
		color: white;
		background: #2cdc20;
	}
	.results .error {
		color: white;
		background: #ff0008;
	}
	.compiling img {
		vertical-align: middle;
	}
	.CodeMirror {
		font-size: 14px;
	}
	.editors {
		padding: 0;
		min-height: 0;
		flex: 1;
	}
	.popup.input_popup input {
		width: 90%;
	}
	.ai-list ::v-deep .router-link-active > .item > .label {
		background: #cacaca;
		color: black;
	}
	.theme-monokai .panel {
		background: #272822;
	}
	.theme-monokai .button {
		background: #444;
		color: #eee;
		box-shadow: 0px 3px 0px black;
	}
	.theme-monokai .ai-list ::v-deep .item > .label:not(.error):not(.warning) {
		color: #eee;
	}
	.theme-monokai .ai-list ::v-deep .router-link-active > .item > .label {
		background: #555;
	}
	.theme-monokai .ai-list ::v-deep .item.router-link-active > .label {
		background: #555;
	}
	.theme-monokai .ai-list ::v-deep .item > .label:hover {
		background: #444;
	}
	.theme-monokai .ai-list ::v-deep .folder.dragover {
		background: #333;
	}
	.theme-monokai .ai-stats {
		background: #444;
		color: #eee;
	}
	.folder-content {
		display: none;
		padding: 20px;
		text-align: center;
	}
	.folder-content img {
		width: 80px;
	}
	::v-deep .CodeMirror {
		height: 100%;
	}
	.editor-left {
		height: 100%;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.column9 {
		height: 100%;
	}
	.column9 .panel, .column3 .panel {
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
		position: absolute;
		left: -15px;
		top: 0;
		bottom: 10px;
		cursor: ew-resize;
		width: 20px;
		z-index: 5;
	}
	.dialog-input {
		width: calc(100% - 10px);
		padding: 5px;
	}
	.list-icon {
		margin-right: 8px;
	}
	.shortcuts {
		padding-left: 30px;
	}

	.problems-resizer {
		height: 8px;
		cursor: ns-resize;
		position: absolute;
		left: 0;
		right: 0;
	}

	.problems-details {
		background: white;
		border-top: 1px solid #ddd;
		overflow-y: auto;
		position: relative;
		.v-icon {
			font-size: 20px;
		}
		.file {
			display: flex;
			align-items: center;
			padding: 5px 0;
			cursor: pointer;
			user-select: none;
			&:hover {
				background: #eee;
			}
			.count {
				padding: 1px 6px;
				margin-left: 5px;
				border-radius: 10px;
				font-size: 13px;
				border-width: 1px;
				border-style: solid;
				font-weight: 500;
			}
		}
		.problem {
			display: flex;
			align-items: center;
			padding: 5px 0;
			padding-left: 20px;
			cursor: pointer;
			&:hover {
				background: #eee;
			}
			.line {
				padding-left: 6px;
				color: #999;
				user-select: none;
				flex-shrink: 0;
				padding-right: 8px;
			}
		}
		.error {
			color: red;
			margin-right: 4px;
		}
		.warning {
			color: #ff9100;
			margin-right: 4px;
		}
		.todo {
			color: #0099ff;
			margin-right: 4px;
		}
	}
	.status {
		flex: 0 0 36px;
		display: flex;
		align-items: center;
		border-top: 1px solid #ddd;
		.problems {
			height: 100%;
			line-height: 36px;
			padding: 0 10px;
			cursor: pointer;
			user-select: none;
			i {
				font-size: 17px;
				margin-bottom: 3px;
			}
			.no-error {
				color: #5fad1b;
			}
			.errors {
				color: red;
				margin-right: 5px;
			}
			.warnings {
				color: #ff9100;
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
			padding: 0 6px;
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
			.running {
				color: #0084a8;
			}
			.running i {
				animation: rotate 0.8s linear infinite;
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
		.v-icon {
			font-size: 16px;
			vertical-align: bottom;
		}
	}
</style>
