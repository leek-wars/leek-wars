<template lang="html">
	<div class="editor" :class="'theme-' + theme">
		<div class="page-header page-bar">
			<div class="menu">
				<h1>{{ $t('title') }}</h1>
				<!-- <div v-if="currentAI" class="info">{{ currentAI.name }}</div> -->
				<div class="tabs">
					<div ref="fileButton" class="tab first action" icon="settings">
						<v-icon>mdi-file-outline</v-icon> {{ $t('file') }}
					</div>
					<v-menu v-model="fileMenu" :activator="LeekWars.mobile ? addMenuActivator : $refs.fileButton" offset-y>
						<v-list>
							<div v-if="currentFolder && currentFolder.id > 0" class="menu-title">
								<v-icon>mdi-folder-outline</v-icon> {{ currentFolder.name }}
							</div>
							<v-list-item v-if="currentFolder && currentFolder.id !== -1" v-ripple @click="$refs.explorer.openNewAI(currentFolder)">
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
							<v-list-item v-if="currentFolder && currentFolder.id !== -1" v-ripple @click="$refs.explorer.openNewFolder(currentFolder)">
								<v-icon class="list-icon">mdi-folder-plus-outline</v-icon>
								<v-list-item-content>
									<v-list-item-title>{{ $t('new_folder') }}</v-list-item-title>
								</v-list-item-content>
							</v-list-item>
							<div v-if="currentAI" class="menu-title">
								<v-icon>mdi-file-outline</v-icon> {{ currentAI.name }}
							</div>
							<v-list-item v-if="currentAI" v-ripple @click="save()">
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
					<div :title="$t('test_desc')" class="action content tab" icon="play_arrow" @click="startTest()">
						<v-icon class="list-icon">mdi-play</v-icon><span>{{ $t('test') }}</span>
					</div>
				</div>
			</div>
			<editor-tabs v-if="!LeekWars.mobile" ref="tabs" :current="currentID" :ais="fileSystem.ais" :history2="history" @close="close" @close-all="closeAll" />

			<editor-finder ref="finder" :active="activeAIs" :history="history" />
		</div>

		<div class="container">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" :style="{width: LeekWars.mobile ? '100%' : panelWidth + 'px'}">
				<panel class="editor-left first">
					<div slot="content" class="full">
						<div v-if="fileSystem.rootFolder" v-autostopscroll class="ai-list">
							<explorer ref="explorer" :current-ai="currentAI" :selected-folder="currentFolder" @test="startTest" @delete-ai="deleteAI" />
						</div>

						<div v-if="currentEditor && currentEditor.loaded && panelWidth" class="ai-stats">
							<div class="line-count-wrapper">{{ $tc('main.n_lines', currentEditor.lines) }}</div>
							<div class="char-count-wrapper">{{ $tc('main.n_characters', currentEditor.characters) }}</div>
							<div v-if="currentAI.included_lines !== 0" class="line-count-wrapper">{{ $tc('main.n_total_lines', currentEditor.lines + currentAI.included_lines) }}</div>
							<div v-if="currentAI.included_chars !== 0" class="char-count-wrapper">{{ $tc('main.n_total_chars', currentEditor.characters + currentAI.included_chars) }}</div>
						</div>
					</div>
				</panel>
			</div>

			<div v-show="!LeekWars.mobile || LeekWars.splitBack" :style="{width: 'calc(100% - ' + (LeekWars.mobile ? 0 : panelWidth) + 'px)'}" class="editor-column">
				<panel>
					<div slot="content" class="editor-left">
						<div class="resizer" @mousedown="resizerMousedown"></div>
						<div :class="{tabs: $refs.tabs && $refs.tabs.tabs.length > 1}" class="editors">
							<ai-view v-for="ai in activeAIs" ref="editors" :key="ai.id" :ai="ai" :ais="fileSystem.ais" :editors="$refs.editors" :visible="currentAI === ai" :font-size="fontSize" :line-height="lineHeight" :popups="popups" :auto-closing="autoClosing" :autocomplete-option="autocomplete" @jump="jump" @load="load" />
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

						<div v-if="showProblemsDetails && problemsHeight && (LeekWars.analyzer.error_count || LeekWars.analyzer.warning_count || LeekWars.analyzer.todo_count)" :style="{height: problemsHeight + 'px'}">
							<div class="problems-resizer" @mousedown="problemsResizerMousedown"></div>
							<editor-problems @jump="jump" />
						</div>
						<div class="status">
							<v-menu v-if="currentAI" top :offset-y="true" :nudge-top="1" :max-width="600">
								<template v-slot:activator="{ on, attrs }">
									<div v-ripple class="version" v-bind="attrs" v-on="on">
										LeekScript {{ currentAI.version }}
									</div>
								</template>
								<v-list :dense="true" class="version-menu">
									<v-list-item v-ripple @click="setVersion(4)">
										<v-icon v-if="currentAI.version === 4" class="list-icon">mdi-star</v-icon>
										<v-icon v-else class="list-icon">mdi-star-outline</v-icon>
										<v-list-item-content>
											<v-list-item-title>LeekScript 4</v-list-item-title>
											<v-list-item-subtitle>

											</v-list-item-subtitle>
										</v-list-item-content>
									</v-list-item>
									<v-list-item v-ripple @click="setVersion(3)">
										<v-icon v-if="currentAI.version === 3" class="list-icon">mdi-star</v-icon>
										<v-icon v-else class="list-icon">mdi-star-outline</v-icon>
										<v-list-item-content>
											<v-list-item-title>LeekScript 3 <span class="green">Recommandé</span></v-list-item-title>
											<v-list-item-subtitle>
												<ul>
													<li>Littéraux d'objets <code>{a: 12}</code></li>
													<li>Classes de base : Number, Integer, Boolean, Object, Array, Function etc.</li>
													<li>Nouveaux mots-clés réservés.</li>
												</ul>
												<router-link class="link" to="/encyclopedia/LeekScript_3"><v-icon>mdi-book-open-page-variant</v-icon> Toutes les informations sur le LeekScript 3</router-link>
											</v-list-item-subtitle>
										</v-list-item-content>
									</v-list-item>
									<v-list-item v-ripple @click="setVersion(2)">
										<v-icon v-if="currentAI.version === 2" class="list-icon">mdi-star</v-icon>
										<v-icon v-else class="list-icon">mdi-star-outline</v-icon>
										<v-list-item-content>
											<v-list-item-title>LeekScript 2</v-list-item-title>
											<v-list-item-subtitle>
												<ul>
													<li>Ajout des classes et objets.</li>
													<li>Passage par référence par défaut pour les valeurs non-primitives dans les fonctions, les boucles foreach et les tableaux.</li>
													<li>Corrections mineures (arrayFilter, opérateur ^=, et autres).</li>
												</ul>
												<router-link class="link" to="/encyclopedia/LeekScript_2"><v-icon>mdi-book-open-page-variant</v-icon> Toutes les informations sur le LeekScript 2</router-link>
											</v-list-item-subtitle>
										</v-list-item-content>
									</v-list-item>

									<v-list-item v-ripple @click="setVersion(1)">
										<v-icon v-if="currentAI.version === 1" class="list-icon">mdi-star</v-icon>
										<v-icon v-else class="list-icon">mdi-star-outline</v-icon>
										<v-list-item-content>
											<v-list-item-title>LeekScript 1</v-list-item-title>
											<v-list-item-subtitle>
												<ul>
													<li>Version initiale</li>
												</ul>
											</v-list-item-subtitle>
										</v-list-item-content>
									</v-list-item>
								</v-list>
							</v-menu>
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
							<div v-if="currentEditor && currentEditor.editor" class="version">L {{ currentEditor.editor.getCursor().line + 1 }}, C {{ currentEditor.editor.getCursor().ch }}</div>
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
				{{ $t('font_size') }} : <input v-model="fontSize" type="number" min="6" max="30" @keyup.stop>
				<br>
				{{ $t('line_height') }} : <input v-model="lineHeight" type="number" min="10" max="50" @keyup.stop>

				<div class="title">Thème</div>

				<v-radio-group v-model="theme" hide-details>
					<v-radio label="Leek Wars" value="leek-wars" />
					<v-radio label="Monokai" value="monokai" />
				</v-radio-group>

				<div class="title">{{ $t('settings_editor') }}</div>

				<v-checkbox v-model="autoClosing" :label="$t('auto_closing')" hide-details />
				<!-- <v-checkbox v-model="enableAnalyzer" :label="$t('analyzer')" hide-details /> -->
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
					<li v-html="$t('shortcut.shortcut_12')"></li>
					<li v-html="$t('shortcut.shortcut_13')"></li>
					<li v-html="$t('shortcut.shortcut_14')"></li>
					<li v-html="$t('shortcut.shortcut_15')"></li>
				</ul>
			</div>
		</popup>

		<popup v-model="alreadyOpenedDialog" :width="500">
			<v-icon slot="icon">mdi-alert-outline</v-icon>
			<span slot="title">Avertissement</span>

			L'éditeur est déjà ouvert dans un autre onglet !
		</popup>

		<editor-test ref="editorTest" v-model="testDialog" :ais="fileSystem.ais" :leek-ais="fileSystem.leekAIs" :currentAI="currentAI" />

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
	import { store } from '@/model/store'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import { Route } from 'vue-router'
	import AIView from './ai-view.vue'
	import Analyzer from './analyzer'
	import { Problem } from './problem'
	import EditorFinder from './editor-finder.vue'
	import { AIItem, Folder, Item } from './editor-item'
	import { explorer } from './explorer'
	const Explorer = () => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-explorer.${locale}.i18n`)
	const EditorTabs = () => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-tabs.${locale}.i18n`)
	const EditorTest = () => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-test.${locale}.i18n`)
	const EditorProblems = () => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor-problems.${locale}.i18n`)
	import { generateKeywords } from './keywords'
	import './leekscript-monokai.scss'
	import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)

	const DEFAULT_FONT_SIZE = 16
	const DEFAULT_LINE_HEIGHT = 24
	const DEFAULT_THEME = "leek-wars"

	@Component({
		name: 'editor', i18n: {},
		components: {
			'ai-view': AIView,
			'editor-test': EditorTest,
			'editor-tabs': EditorTabs,
			'explorer': Explorer,
			'editor-finder': EditorFinder,
			'editor-problems': EditorProblems
		},
		mixins: [...mixins]
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
		enableAnalyzer: boolean = false
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
		fileSystem = fileSystem
		fileMenu: boolean = false
		history: AI[] = []
		alreadyOpenedDialog: boolean = false
		actions_list = [
			{icon: 'mdi-plus', click: (e: any) => this.add(e)},
			{icon: 'mdi-cogs', click: () => this.settings() }
		]
		actions_content = [
			{icon: 'mdi-content-save', click: () => this.save()},
			{icon: 'mdi-delete', click: () => this.startDelete()},
			{icon: 'mdi-play', click: () => this.startTest()},
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
			if (localStorage.getItem('editor/analyzer') === null) { localStorage.setItem('editor/analyzer', 'false') }
			this.enlargeWindow = localStorage.getItem('editor/large') === 'true'
			this.theme = localStorage.getItem('editor/theme') || DEFAULT_THEME
			this.autoClosing = localStorage.getItem('editor/auto_closing') === 'true'
			this.autocomplete = localStorage.getItem('editor/autocomplete') === 'true'
			this.popups = localStorage.getItem('editor/popups') === 'true'
			this.hideHeader = localStorage.getItem('editor/hideHeader') === 'true'
			this.enableAnalyzer = false // localStorage.getItem('editor/analyzer') === 'true'
			this.fontSize = parseInt(localStorage.getItem('editor/font_size') || '', 10) || DEFAULT_FONT_SIZE
			this.lineHeight = parseInt(localStorage.getItem('editor/line_height') || '', 10) || DEFAULT_LINE_HEIGHT
			this.problemsHeight = parseInt(localStorage.getItem('editor/problems-height') || '', 10) || 200
			this.panelWidth = parseInt(localStorage.getItem('editor/panel-width') || '', 10) || 200
		}

		connected() {
			// Chargement de l'historique
			const history = JSON.parse(localStorage.getItem('editor/history') || '[]')
			for (const id of history) {
				if (id in fileSystem.ais) {
					this.history.push(fileSystem.ais[id])
				}
			}
			this.update()
			LeekWars.setTitle(this.$t('title'), this.$t('n_ais', [fileSystem.aiCount]))
		}

		mounted() {
			LeekWars.footer = false
			LeekWars.box = true
			this.$root.$on('ctrlS', () => {
				this.save()
			})
			this.$root.$on('ctrlShiftS', () => {
				// TODO save all but analyze only entrypoints
				// this.saveAll()
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
			this.$root.$on('keydown', this.keydown)
			this.$root.$on('keyup', this.keyup)
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
			this.$root.$on('connected', this.connected)
			if (store.state.farmer) {
				this.connected()
			}

			const broadcast = new BroadcastChannel('channel')
			broadcast.onmessage = (event) => {
				if (event.data.opened) {
					this.alreadyOpenedDialog = true
				}
				broadcast.close()
			}
			broadcast.postMessage({ type: 'editor-opened' })
		}

		isChild(folder: Folder, parent: Folder): boolean {
			let current = folder
			while (current.id !== 0) {
				if (current.id === parent.id) { return true }
				current = fileSystem.folderById[current.parent]
			}
			return false
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
			if (this.$route.params.id) {
				const id = parseInt(this.$route.params.id, 10)
				// console.log("fileSystem", Object.values(fileSystem.ais).length)
				if (id > 0 && id in fileSystem.ais) {
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
					})
					explorer.selectAI(this.currentAI!)
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
				if (lastCode && parseInt(lastCode, 10) > 0 && lastCode in fileSystem.ais) {
					this.$router.replace('/editor/' + localStorage.getItem('editor/last_code'))
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
				LeekWars.splitShowList()
				LeekWars.setActions(this.actions_list)
			}
		}

		beforeDestroy() {
			this.$root.$off('ctrlS')
			this.$root.$off('ctrlShiftS')
			this.$root.$off('ctrlQ')
			this.$root.$off('ctrlF')
			this.$root.$off('ctrlP')
			this.$root.$off('escape')
			this.$root.$off('htmlclick')
			this.$root.$off('keydown', this.keydown)
			this.$root.$off('keyup', this.keyup)
			this.$root.$off('previous')
			this.$root.$off('next')
			this.$root.$off('back')
			this.$root.$off('connected', this.connected)
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

		save(aiEditor: AIView | null = this.currentEditor) {
			if (!aiEditor) { return }
			if (aiEditor.saving || !aiEditor.loaded) { return }
			aiEditor.saving = true
			aiEditor.ai.modified = false
			aiEditor.serverError = false
			this.errors = []

			const saveID = aiEditor.id > 0 ? aiEditor.id : 0
			const content = aiEditor.editor.getValue()
			Vue.set(aiEditor.ai, 'code', content)

			LeekWars.post('ai/save', {ai_id: saveID, code: content}).then(data => {
				if (aiEditor === null) { return }
				aiEditor.saving = false
				if (!data.result || data.result.length === 0) {
					aiEditor.serverError = true
					return
				}

				Vue.set(aiEditor.ai, 'timestamp', data.modified)
				localStorage.setItem('ai/time/' + aiEditor.ai.id, '' + data.modified)
				localStorage.setItem('ai/code/' + aiEditor.ai.id, content)

				this.errors = []
				this.goods = []

				for (const entrypoint in data.result) {
					const entrypoint_id = parseInt(entrypoint, 10)
					const ai = fileSystem.ais[entrypoint_id]

					// Valid?
					let valid = true
					for (const problem of data.result[entrypoint]) {
						if (problem[0] === 0) { valid = false; break }
					}
					if (valid) {
						this.goods.push({ai})
					}
					Vue.set(ai, 'valid', valid)
					this.handleProblems(ai, data.result[entrypoint])
				}
				LeekWars.analyzer.updateCount()
				setTimeout(() => this.goods = [], 2000)

				if (aiEditor.needTest) {
					aiEditor.needTest = false
					if (aiEditor.ai.valid) {
						this.startTest()
					}
				}
			}).error(() => {
				if (aiEditor === null) { return }
				aiEditor.serverError = true
				aiEditor.saving = false
			})
		}

		saveAll() {
			for (const aiEditor of (this.$refs.editors as AIView[])) {
				this.save(aiEditor)
			}
		}

		handleProblems(entrypoint: AI, problems: any[][]) {
			// console.log("handleProblems", entrypoint, problems)

			LeekWars.analyzer.removeProblems(entrypoint)

			// Group problems by ai
			const problemsByAI = {} as {[key: number]: Problem[]}
			for (const problem of problems) {
				const level = problem[0]
				const ai_id = problem[1]
				const line = problem[2]
				let info = problem[4]
				if (problem.length === 8) {
					info = this.$t('leekscript.error_' + problem[6], problem[7])
				} else {
					info = this.$t('leekscript.error_' + problem[6])
				}
				const problemObject = new Problem(line, problem[3], line, problem[5], level, info)
				if (!problemsByAI[ai_id]) { problemsByAI[ai_id] = [] }
				problemsByAI[ai_id].push(problemObject)
			}
			for (const ai_id in problemsByAI) {
				const ai = fileSystem.ais[ai_id]
				const ai_problems = problemsByAI[ai_id]
				// console.log("ai", ai.path, "problems", ai_problems)
				LeekWars.analyzer.setProblems(entrypoint.id, ai, ai_problems)
			}
		}

		startDelete() {
			(this.$refs.explorer as any).deleteDialog = true
		}
		startTest(editor = this.currentEditor) {
			if (!editor || !editor.ai) { return }
			if (editor.ai.modified) {
				editor.needTest = true
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

		// problems(entrypoint: number, ai: AI, problems: Problem[]) {

		// 	const editor = this.getAiView(ai)
		// 	if (!editor) { return }

		// 	editor.addErrorOverlay(entrypoint, problems)
		// }

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
			for (const fai in fileSystem.ais) {
				if (parseInt(fai, 10) > 0) { // Not bot ai
					this.$router.replace('/editor/' + fai)
					return
				}
			}
			this.$router.replace('/editor')
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

		setVersion(version: number) {
			if (this.currentAI) {
				this.currentAI.version = version
				LeekWars.put('ai/version', {ai_id: this.currentAI.id, version})
				this.save(this.currentEditor)
				this.currentAI.analyze()
			}
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
		padding-right: 0;
	}
	.container {
		flex: 1;
		min-height: 0;
		gap: 0;
	}
	#app.app .container {
		margin-bottom: 0;
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
		height: 10px;
		cursor: ns-resize;
		position: absolute;
		left: 0;
		right: 0;
		z-index: 1;
	}
	.status {
		flex: 0 0 36px;
		display: flex;
		align-items: center;
		border-top: 1px solid #ddd;
		.version {
			line-height: 36px;
			user-select: none;
			cursor: pointer;
			padding: 0 10px;
			font-weight: 500;
			color: #555;
		}
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
</style>
