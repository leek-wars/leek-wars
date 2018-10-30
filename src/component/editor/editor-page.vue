<template lang="html">
	<div :class="'theme-' + theme">
		<div class="page-header page-bar">
			<div>
				<h1>{{ $t('title') }}</h1>
				<div v-if="currentAI" class="info">{{ currentAI.name }}</div>
			</div>
			<div class="tabs">
				<div ref="addButton" :title="$t('new_desc')" class="action list tab" icon="add">
					<i class="material-icons">add</i> <span>{{ $t('new') }}</span>
				</div>
				<v-menu v-model="addMenu" :activator="LeekWars.mobile ? addMenuActivator : $refs.addButton" offset-y>
					<v-list>
						<v-list-tile v-ripple @click="newAI(false)">
							<i class="material-icons">insert_drive_file</i>
							<v-list-tile-content class="language">
								<v-list-tile-title>{{ $t('new_ai') }}</v-list-tile-title>
							</v-list-tile-content>
						</v-list-tile>
						<v-list-tile v-ripple @click="newAI(true)">
							<i class="material-icons">insert_drive_file</i>
							<v-list-tile-content class="language">
								<v-list-tile-title>{{ $t('new_v2') }} <span class="label-beta">bêta</span></v-list-tile-title>
							</v-list-tile-content>
						</v-list-tile>
						<v-list-tile v-ripple @click="newFolder">
							<i class="material-icons">folder_open</i>
							<v-list-tile-content class="language">
								<v-list-tile-title>{{ $t('new_folder') }}</v-list-tile-title>
							</v-list-tile-content>
						</v-list-tile>
					</v-list>
				</v-menu>
				<div :title="$t('save_desc')" class="action content tab" icon="save" @click="save">
					<i class="material-icons">save_alt</i> <span>{{ $t('save') }}</span>
				</div>
				<div :title="$t('delete_desc')" class="action list content tab" icon="delete" @click="deleteDialog = true">
					<i class="material-icons">delete</i> <span>{{ $t('delete') }}</span>
				</div>
				<div :title="$t('test_desc')" class="action content tab" icon="play_arrow" @click="test">
					<i class="material-icons">play_arrow</i> <span>{{ $t('test') }}</span>
				</div>
				<div class="tab action" icon="settings" @click="settingsDialog = true">
					<i class="material-icons">settings</i>
				</div>
				<div class="tab action hidden" icon="help" @click="infoDialog = true">
					<i class="material-icons">help</i>
				</div>
			</div>
		</div>

		<div class="container">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column3">
				<div class="editor-left panel">

					<div class="content">

						<loader v-if="!rootFolder" />

						<div v-autostopscroll v-if="rootFolder" class="ai-list">
							<editor-folder :folder="rootFolder" :level="0" />
						</div>
						<div v-if="currentEditor && currentEditor.loaded" class="ai-stats">
							<div class="line-count-wrapper">{{ $t('n_lines', [currentEditor.lines]) }}</div>
							<div class="char-count-wrapper">{{ $t('n_characters', [currentEditor.characters]) }}</div>
						</div>
						<br>
						<!--
						<div id='export-button' class="button" title="{export_desc}">▼ {{ $t('export') }}</div>
						<div id='import-button' class="button" title="{import_desc}">▲ {{ $t('import') }}</div>
						-->
					</div>
				</div>
			</div>
		
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column9">
				<div class="panel">
					<div class="content">
						<div class="editors">
							<ai-view v-for="ai in activeAIs" ref="editors" :key="ai.id" :ai="ai" :ais="ais" :editors="$refs.editors" :visible="currentAI === ai" :font-size="fontSize" :line-height="lineHeight" :popups="popups" :autoClosing="autoClosing" :autocompleteOption="autocomplete" @jump="jump" @load="load" />
						</div>
						<div class="search-panel">
							<img src="/image/search.png">
							<input type="text" class="query" autocomplete="off">
							<span class="results"></span>
							<img class="previous arrow" src="/image/icon/grey/collapse.png">
							<img class="next arrow" src="/image/icon/grey/expand.png">
						</div>
					</div>
				</div>

				<div v-if="currentEditor" class="compilation">
					<div v-if="currentEditor.saving" class="compiling">
						<loader :size="15" /> {{ $t('saving') }}
					</div>
					<div class="results">
						<div v-show="good" class="good" v-html="'✓ ' + $t('valid_ai', [currentEditor.ai.name])"></div>
						<div v-if="currentEditor.serverError" class="error">× <i>{{ $t('server_error') }}</i></div>
						<div v-for="(error, e) in errors" :key="e" class="error">
							× <b>{{ error.ai }}</b>&nbsp; ▶ {{ error.message }}
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="error-tooltip"></div>

		<v-dialog v-model="infoDialog" :max-width="500">
			<div class="title">{{ $t('shortcuts') }}</div>
			<div class="content">
				<ul>
					<li v-html="$t('shortcut_1')"></li>
					<li v-html="$t('shortcut_2')"></li>
					<li v-html="$t('shortcut_3')"></li>
					<li v-html="$t('shortcut_4')"></li>
					<li v-html="$t('shortcut_5')"></li>
					<li v-html="$t('shortcut_6')"></li>
					<li v-html="$t('shortcut_7')"></li>
				</ul>
			</div>
			<div class="actions">
				<div v-ripple @click="infoDialog = false">{{ $t('shortcuts_ok') }}</div>
			</div>
		</v-dialog>
		
		<v-dialog v-model="settingsDialog" :max-width="620">
			<div class="title">{{ $t('settings') }}</div>
			<div class="content settings-dialog">
				<div class="title">{{ $t('display') }}</div>
				<template v-if="!LeekWars.mobile">
					<v-switch v-model="enlargeWindow" :label="$t('enlarge_window')" hide-details />
					<br><br>
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

				<v-checkbox :label="$t('auto_closing')" v-model="autoClosing" hide-details />
				<v-checkbox :label="$t('autocompletion')" v-model="autocomplete" hide-details />
				<v-checkbox :label="$t('popups')" v-model="popups" hide-details />
			</div>
		</v-dialog>

		<v-dialog v-model="deleteDialog" :max-width="500">
			<div v-if="currentType === 'ai' && currentAI" class="title">{{ $t('delete_ai', [currentAI.name]) }}</div>
			<div v-else-if="currentFolder" class="title">{{ $t('delete_folder', [currentFolder.name]) }}</div>
			<div class="content">
				{{ $t('delete_warning') }}
			</div>
			<div class="actions">
				<div @click="deleteDialog = false">{{ $t('delete_cancel') }}</div>
				<div class="red" @click="deleteItem">{{ $t('delete_validate') }}</div>
			</div>
		</v-dialog>

		<editor-test v-model="testDialog" :ais="ais" :leek-ais="leekAIs" />
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import AIView from './ai-view.vue'
	import EditorFolder from './editor-folder.vue'
	import { AIItem, Folder, Item } from './editor-item'
	import EditorTest from './editor-test.vue'
	import { generateKeywords } from './keywords'
	import './leekscript-monokai.css'
	import './leekscript.css'

	const DEFAULT_FONT_SIZE = 16
	const DEFAULT_LINE_HEIGHT = 22
	const DEFAULT_THEME = "leek-wars"

	@Component({
		name: 'editor', i18n: {},
		components: { 'editor-folder': EditorFolder, 'ai-view': AIView, 'editor-test': EditorTest }
	})
	export default class EditorPage extends Vue {
		ais: {[key: number]: AI} = {}
		folderById: {[key: number]: Folder} = {}
		items: {[key: string]: AI | Folder} = {}
		rootFolder: Folder | null = null
		activeAIs: {[key: number]: AI} = {}
		currentAI: AI | null = null
		currentEditor: AIView | null = null
		currentType: string | null = null
		currentFolder: Folder | null = null
		errors: any[] = []
		good: boolean = false
		infoDialog: boolean = false
		settingsDialog: boolean = false
		addMenu: boolean = false
		addMenuActivator: any = null
		deleteDialog: boolean = false
		enlargeWindow: boolean = false
		theme: string = DEFAULT_THEME
		autoClosing: boolean = false
		autocomplete: boolean = false
		popups: boolean = false
		fontSize: number = DEFAULT_FONT_SIZE
		lineHeight: number = DEFAULT_LINE_HEIGHT
		dragging: Item | null = null
		testDialog: boolean = false
		leekAIs: any = {}
		actions_list = [
			{icon: 'add', click: (e: any) => this.add(e)},
			{icon: 'delete', click: () => this.deleteDialog = true},
		]
		actions_content = [
			{icon: 'save_alt', click: () => this.save()},
			{icon: 'delete', click: () => this.deleteDialog = true},
			{icon: 'play_arrow', click: () => this.test()},
			{icon: 'settings', click: () => this.settings() }
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
			this.enlargeWindow = localStorage.getItem('editor/large') === 'true'
			this.theme = localStorage.getItem('editor/theme') || DEFAULT_THEME
			this.autoClosing = localStorage.getItem('editor/auto_closing') === 'true'
			this.autocomplete = localStorage.getItem('editor/autocomplete') === 'true'
			this.popups = localStorage.getItem('editor/popups') === 'true'
			this.fontSize = parseInt(localStorage.getItem('editor/font_size') || '', 10) || DEFAULT_FONT_SIZE
			this.lineHeight = parseInt(localStorage.getItem('editor/line_height') || '', 10) || DEFAULT_LINE_HEIGHT
			
			LeekWars.get('ai/get-farmer-ais/' + this.$store.state.token).then((data: any) => {
				const folders: {[key: number]: any} = {}
				for (const folder of data.data.folders) {
					folders[folder.id] = folder
					this.items[folder.name] = folder
				}
				for (const ai of data.data.ais) {
					Vue.set(this.ais, ai.id, ai)
					Vue.set(ai, 'modified', false)
					this.items[ai.name] = ai
				}
				this.leekAIs = data.data.leek_ais
				const buildFolder = (id: number, parent: Folder): Folder => {
					const folder = new Folder(id, id in folders ? folders[id].name : '<root>', parent)
					if (id === 0) {
						folder.expanded = true
					} else {
						folder.expanded = localStorage.getItem('editor/folder/' + id) === 'true'
					}
					folder.items = data.data.folders
						.filter((f: any) => f.folder === id)
						.map((f: any) => buildFolder(f.id, folder))
					folder.items.push(...(data.data.ais
						.filter((ai: any) => ai.folder === id)
						.map((ai: any) => new AIItem(ai, folder))
					))
					this.folderById[folder.id] = folder
					return folder
				}
				this.rootFolder = buildFolder(0, this.rootFolder as Folder)
				for (const ai of data.data.ais) {
					ai.path = this.getAIFullPath(ai)
				}
				this.update()
				LeekWars.setTitle(this.$t('editor.title'), this.$t('editor.n_ais', [LeekWars.objectSize(data.data.ais)]))
			})
			// Escape
			// if (e.keyCode == 27) {
			// 	LW.pages.editor.search(false)
			// }
			// // Ctrl-F : search
			// if (e.ctrlKey && e.keyCode == 70 && !e.shiftKey) {
			// 	LW.pages.editor.search(true)
			// 	e.preventDefault()
			// }
		}
		mounted() {
			this.$root.$on('ctrlS', () => {
				this.save()
			})
			this.$root.$on('ctrlQ', () => {
				this.testDialog = true
			})
			this.$root.$on('htmlclick', () => {
				if (this.currentEditor) {
					this.currentEditor.close()
				}
			})
			this.$root.$on('back', () => {
				this.$router.push('/editor')
			})
			this.$root.$on('editor-drag', (item: any) => {
				this.dragging = item
			})
			this.$root.$on('editor-drop', (folder: Folder) => {
				if (!this.dragging) { return }
				if (this.dragging.parent === folder || this.dragging === folder) { return }
				this.dragging.parent.items.splice(this.dragging.parent.items.indexOf(this.dragging), 1)
				folder.items.push(this.dragging)
				this.dragging.parent = folder
				folder.expanded = true
				LeekWars.post(this.dragging.folder ? 'ai-folder/change-folder' : 'ai/change-folder', this.dragging.folder ? {folder_id: (this.dragging as Folder).id, dest_folder_id: folder.id} : {ai_id: (this.dragging as AIItem).ai.id, folder_id: folder.id})
				this.dragging = null
			})
		}
		@Watch('$route.params.id')
		update() {
			if (this.$route.params.id) {
				const id = parseInt(this.$route.params.id, 10)
				if (id in this.ais) {
					const ai = this.ais[id]
					this.currentAI = ai
					this.currentType = 'ai'
					this.currentFolder = this.folderById[ai.folder]
					localStorage.setItem('editor/last_code', '' + id)
					if (!(id in this.activeAIs)) {
						Vue.set(this.$data.activeAIs, ai.id, this.currentAI)
					}
					Vue.nextTick(() => {
						this.currentEditor = (this.$refs.editors as AIView[]).find(editor => editor.ai === ai) || null
					})
					LeekWars.setTitle(this.currentAI.name)
					LeekWars.splitShowContent()
					LeekWars.setActions(this.actions_content)
				} else {
					this.currentFolder = this.folderById[id]
					this.currentType = 'folder'
					LeekWars.splitShowList()
					LeekWars.setActions(this.actions_list)
				}
			} else if (!LeekWars.mobile) {
				const lastCode = localStorage.getItem('editor/last_code')
				if (lastCode && lastCode in this.ais) {
					this.$router.replace('/editor/' + localStorage.getItem('editor/last_code'))
				} else {
					this.$router.replace('/editor/' + LeekWars.firstKey(this.ais))
				}
			} else {
				LeekWars.splitShowList()
				LeekWars.setActions(this.actions_list)
			}
		}
		getAIFullPath(ai: AI) {
			if (ai.folder > 0) {
				return this.getFolderPath(this.folderById[ai.folder]) + ai.name
			}
			return ai.name
		}
		getFolderPath(folder: Folder): string {
			if (folder.parent && folder.parent.id !== 0) {
				return this.getFolderPath(folder.parent) + folder.name + '/'
			}
			return folder.name + '/'
		}
		destroyed() {
			this.$root.$off('ctrlS')
			this.$root.$off('ctrlQ')
			this.$root.$off('htmlclick')
			LeekWars.large = false
			// Unsaved AIs confirmation
			// TODO
			// var num = 0
			// for (var i in editors) {
			// 	if (editors[i].modified) {
			// 		num++
			// 	}
			// }
			// if (num > 0) {
			// 	return _.lang.get('editor', 'n_ais_unsaved', num)
			// }
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

			LeekWars.post('ai/save', {ai_id: saveID, code: content}).then((data: any) => {
				if (this.currentEditor === null) { return }
				this.currentEditor.saving = false
				if (this.currentEditor.ai.v2) {
					const errors = data.data.result
					if (this.currentEditor.overlay) {
						this.currentEditor.editor.removeOverlay(this.currentEditor.overlay)
					}
					if (!errors || errors.length === 0) {
						this.good = true
						setTimeout(() => this.good = false, 800)
						this.currentEditor.ai.valid = true
						this.currentEditor.error = false
					} else {
						this.currentEditor.addErrorOverlay(errors)
					}
				} else {
					if (!data.data.success || !data.data.result || data.data.result.length === 0) {
						this.currentEditor.serverError = true
						return
					}
					this.errors = []
					for (const res of data.data.result) {
						const code = res[0]
						const ai = this.activeAIs[res[1]]
						const editor = (this.$refs.editors as AIView[]).find(e => e.ai === ai)
						if (!ai || !editor) { continue }
						if (code === 2) {
							this.good = true
							setTimeout(() => this.good = false, 800)
							ai.valid = true
							editor.removeErrors()
						} else if (code === 1) {
							this.errors.push({ai: ai.name, error: res[2]})
							ai.valid = false
						} else if (code === 0) {
							const line = res[3]
							let info = res[5]
							if (res.length === 8) {
								info = this.$t('leekscript.' + res[6], [res[7]])
							} else {
								info = this.$t('leekscript.' + res[6])
							}
							info = '(' + res[5] + ') ' + info
							this.errors.push({ai: ai.name, message: info})
							ai.valid = false
							editor.showError(line)
						}
					}
				}
				this.currentEditor.updateFunctions()
				if (this.currentEditor.needTest) {
					this.currentEditor.needTest = false
					this.currentEditor.test()
				}
			})
		}
		newAI(v2: boolean) {
			if (!this.currentFolder) { return }
			LeekWars.post('ai/new', {folder_id: this.currentFolder.id, v2}).then((data) => {
				if (data.data.success && this.currentFolder) {
					const ai = data.data.ai
					ai.valid = true
					ai.v2 = v2
					this.currentFolder.items.push(new AIItem(ai, this.currentFolder))
					this.currentFolder.expanded = true
					this.ais[ai.id] = ai
					this.$router.push('/editor/' + ai.id)
				}
			})
		}
		newFolder() {
			if (!this.currentFolder) { return }
			LeekWars.post('ai-folder/new', {folder_id: this.currentFolder.id}).then((data) => {
				if (data.data.success && this.currentFolder) {
					const folder = new Folder(data.data.id, this.$t('editor.new_folder') as string, this.currentFolder)
					folder.items = []
					this.folderById[folder.id] = folder
					this.currentFolder.items.push(folder)
				}
			})
		}
		deleteItem() {
			const url = this.currentType === 'folder' ? 'ai-folder/delete' : 'ai/delete'
			const args = this.currentType === 'folder' ? {folder_id: this.currentID} : {ai_id: this.currentID}
			LeekWars.post(url, args).then((data) => {
				if (data.data.success) {
					let ai_deleted = false
					if (this.currentType === 'ai' && this.currentAI) {
						const folder = this.folderById[this.currentAI.folder]
						folder.items.splice(folder.items.findIndex((i) => !i.folder && (i as AIItem).ai === this.currentAI), 1)
						Vue.delete(this.$data.ais, '' + this.currentID)
						Vue.delete(this.$data.activeAIs, '' + this.currentID)
						ai_deleted = true
					} else if (this.currentFolder) {
						const folder = this.currentFolder.parent
						folder.items.splice(folder.items.indexOf(this.currentFolder), 1)
					}
					if (ai_deleted) {
						if (!LeekWars.isEmptyObj(this.ais)) {
							this.$router.replace('/editor/' + LeekWars.firstKey(this.ais))
						} else {
							this.$router.replace('/editor')
						}
					}
					this.deleteDialog = false
				} else {
					LeekWars.toast(data.data.error)
				}
			})
		}
		test() {
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
		@Watch('enlargeWindow') enlargeWindowChange() {
			LeekWars.large = this.enlargeWindow
			localStorage.setItem('editor/large', '' + this.enlargeWindow)
		}
		jump(ai: AI, line: number) {
			if (ai !== this.currentAI) {
				this.$router.push('/editor/' + ai.id)
			}
			Vue.nextTick(() => {
				const editor = (this.$refs.editors as AIView[]).find(editor => editor.ai === ai)
				if (editor) { editor.scrollToLine(line - 1) }
			})
		}
		load(ai: AI) {
			if (!(ai.id in this.activeAIs)) {
				Vue.set(this.$data.activeAIs, ai.id, ai)
			}
		}
		search(activate: boolean) {
			// if (activate) {
			// 	var query = current in editors ? editors[current].editor.getSelection() : ''
			// 	_searchEnabled = true
			// 	LW.pages.editor.resize()
			// 	$('.search-panel').css('display', 'flex')
			// 	$('.search-panel input').val(query).focus()
			// } else {
			// 	_searchEnabled = false
			// 	if (editors[current].editor.overlay) {
			// 		editors[current].editor.removeOverlay(editors[current].editor.overlay)
			// 	}
			// 	$('.search-panel').hide()
			// 	LW.pages.editor.resize()
			// }
		}

		// var searchQuery = null
		// var searchIndex = 0
		// var searchElement = null
		// var searchLines = []
		// var searchFirstLine = null

		// var search_next = function() {
		// 	searchIndex = (searchIndex + 1) % searchLines.length
		// 	searchUpdate()
		// }
		// var search_previous = function() {
		// 	searchIndex--
		// 	if (searchIndex < 0) searchIndex = searchLines.length - 1
		// 	searchUpdate()
		// }

		// $('.search-panel .query').keyup(function(e) {
		// 	if (e.keyCode == 16) return ; // ignore shift key
		// 	if (e.keyCode == 13) {
		// 		if (e.shiftKey) {
		// 			search_previous()
		// 		} else {
		// 			search_next()
		// 		}
		// 	} else {
		// 		searchQuery = $(this).val().toLowerCase()
		// 		searchIndex = 0
		// 		searchElement = null
		// 		searchFirstLine = null

		// 		if (searchQuery.length > 0) {
		// 			searchLines = []
		// 			for (var l = 0; l < editors[current].editor.lineCount(); ++l) {
		// 				var line = editors[current].editor.getLine(l)
		// 				var index = -1
		// 				while ((index = line.toLowerCase().indexOf(searchQuery, index + 1)) > -1) {
		// 					searchLines.push([l, index])
		// 				}
		// 			}
		// 			searchUpdate()
		// 		} else {
		// 			$('.search-panel .results').text("")
		// 			if (editors[current].editor.overlay) {
		// 				editors[current].editor.removeOverlay(editors[current].editor.overlay)
		// 			}
		// 		}
		// 	}
		// })
		// var searchUpdate = function() {
		// 	var overlay = {token: function(stream, state, lineNo) {
		// 		if (stream.match(searchQuery, true, true)) {
		// 			var index = -1
		// 			for (var l in searchLines) {
		// 				if (searchLines[l][0] == lineNo && searchLines[l][1] == stream.start) {
		// 					index = l
		// 					break
		// 				}
		// 			}
		// 			if (index == searchIndex) {
		// 				return "matchhighlight-green"
		// 			}
		// 			return "matchhighlight"
		// 		}
		// 		stream.next()
		// 		stream.skipTo(searchQuery.charAt(0), true) || stream.skipToEnd()
		// 	}}

		// 	if (editors[current].editor.overlay) {
		// 		editors[current].editor.removeOverlay(editors[current].editor.overlay)
		// 	}
		// 	editors[current].editor.overlay = overlay
		// 	editors[current].editor.addOverlay(overlay)

		// 	$('.search-panel .results').text((searchIndex + 1) + " / " + searchLines.length)

		// 	if (searchLines.length > 0) {

		// 		var line = searchLines[searchIndex][0]
		// 		var t = editors[current].editor.charCoords({line: line, ch: 0}, "local").top;
		// 		var middleHeight = editors[current].editor.getScrollerElement().offsetHeight / 2;

		// 		editors[current].editor.scrollTo(0, t - middleHeight - 5);
		// 	}
		// }
		// $('.search-panel .next').click(search_next)
		// $('.search-panel .previous').click(search_previous)
	}
</script>

<style lang="scss" scoped>
	.v-list__tile__content {
		padding-left: 8px;
	}
	.v-menu {
		display: none;
	}
	#app.app .panel {
		margin-bottom: 0;
	}
	.search-panel {
		display: none;
		height: 40px;
	}
	.search-panel img {
		width: 20px;
		height: 20px;
		margin: 10px;
	}
	.search-panel .arrow {
		width: 20px;
		height: 12px;
		margin: 0;
		padding: 14px 10px;
		opacity: 0.3;
		cursor: pointer;
	}
	.search-panel .arrow:hover {
		opacity: 1;
		background: rgba(127,127,127,0.5);
	}
	.search-panel input {
		width: 100%;
		height: 26px;
		margin: 7px 0;
		margin-right: 7px;
		border: none;
		background: #eee;
	}
	.search-panel .results {
		color: #777;
		margin-right: 13px;
		line-height: 40px;
		white-space: nowrap;
	}
	.panel .content {
		padding: 0;
	}
	.ai-list {
		overflow-y: auto;
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
	.editor {
		font-family: "Roboto";
		font-size: 25px;
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
	.results .good, .results .error {
		padding: 5px 10px;
		border-radius: 2px;
		display: inline-block;
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
		background: #ff6c71;
	}
	.compiling img {
		vertical-align: middle;
	}
	.CodeMirror {
		font-size: 14px;
	}
	.editor textarea {
		border: none;
		height: auto;
		font-size: 14px;
		min-height: 700px;
		padding: 5px;
	}
	.editors {
		height: 100%;
	}
	.popup.input_popup input {
		width: 90%;
	}
	.ai-list /deep/ .router-link-active > .item > .label {
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
	.theme-monokai .ai-list /deep/ .item:not(.modified) > .label {
		color: #eee;
	}
	.theme-monokai .ai-list /deep/ .router-link-active > .item > .label {
		background: #555;
	}
	.theme-monokai .ai-list /deep/ .item.router-link-active > .label {
		background: #555;
	}
	.theme-monokai .ai-list /deep/ .item > .label:hover {
		background: #444;
	}
	.theme-monokai .ai-list /deep/ .folder.dragover {
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
	.label-beta {
		background: #ff54e3;
		color: white;
		padding: 0px 4px;
		border-radius: 5px;
		font-size: 15px;
		display: inline-block;
	}
	/deep/ .CodeMirror {
		height: 100%;
	}
	.editor-left {
		height: calc(100vh - 140px);
	}
	#app.app .editor-left {
		height: calc(100vh - 56px);
	}
	.editor-left .content {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	.column9 {
		position: relative;
	}
	.column9 .content {
		height: calc(100vh - 140px);
	}
	#app.app .column9 .content {
		height: calc(100vh - 56px);
	}
	.editor-loader {
		position: absolute;
		top: calc(50% - 35px);
		left: 0;
		width: calc(100% - 40px);
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
</style>
