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
				<v-menu v-model="addMenu" :activator="LeekWars.mobile ? addMenuActivator : $refs.addButton" offset-y lazy>
					<v-list>
						<v-list-tile v-ripple @click="openNewAI(false)">
							<i class="material-icons">insert_drive_file</i>
							<v-list-tile-content class="language">
								<v-list-tile-title>{{ $t('new_ai') }}</v-list-tile-title>
							</v-list-tile-content>
						</v-list-tile>
						<v-list-tile v-ripple @click="openNewAI(true)">
							<i class="material-icons">insert_drive_file</i>
							<v-list-tile-content class="language">
								<v-list-tile-title>{{ $t('new_v2') }}
									<tooltip>
										<span slot="activator" class="label-beta">bêta <i class="material-icons">info</i></span>
										{{ $t('editor.v2_beta_message') }}
									</tooltip>
								</v-list-tile-title>
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
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" :style="{width: LeekWars.mobile ? '100%' : panelWidth + 'px'}" class="column3">
				<panel class="editor-left first">
					<div slot="content" class="full">
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
				</panel>
				<div class="resizer" @mousedown="resizerMousedown"></div>
			</div>
		
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" :style="{width: 'calc(100% - ' + (LeekWars.mobile ? 0 : panelWidth) + 'px)'}" class="column9">
				<panel>
					<div slot="content" class="full">
						<editor-tabs v-if="!LeekWars.mobile" ref="tabs" :current="currentID" />
						<div :class="{tabs: $refs.tabs && $refs.tabs.tabs.length > 1}" class="editors">
							<ai-view v-for="ai in activeAIs" ref="editors" :key="ai.id" :ai="ai" :ais="ais" :editors="$refs.editors" :visible="currentAI === ai" :font-size="fontSize" :line-height="lineHeight" :popups="popups" :auto-closing="autoClosing" :autocomplete-option="autocomplete" @jump="jump" @load="load" />
						</div>
						<div v-if="currentEditor" class="compilation">
							<div v-if="currentEditor.saving" class="compiling">
								<loader :size="15" /> {{ $t('saving') }}
							</div>
							<div class="results">
								<div v-show="good" class="good" v-html="'✓ ' + $t('valid_ai', [currentEditor.ai.name])"></div>
								<div v-if="currentEditor.serverError" class="error">× <i>{{ $t('server_error') }}</i></div>
								<div v-for="(error, e) in errors" :key="e" class="error" @click="errors.splice(e, 1)">
									× <span v-html="$t('ai_error', [error.ai, error.line])"></span>&nbsp; ▶ {{ error.message }}
								</div>
							</div>
						</div>
					</div>
				</panel>
			</div>
		</div>
		<div class="error-tooltip"></div>

		<popup v-model="infoDialog" :width="500">
			<span slot="title">{{ $t('shortcuts') }}</span>
			<ul>
				<li v-html="$t('shortcut_1')"></li>
				<li v-html="$t('shortcut_2')"></li>
				<li v-html="$t('shortcut_3')"></li>
				<li v-html="$t('shortcut_4')"></li>
				<li v-html="$t('shortcut_5')"></li>
				<li v-html="$t('shortcut_6')"></li>
				<li v-html="$t('shortcut_7')"></li>
			</ul>
		</popup>
		
		<popup v-model="settingsDialog" :width="620">
			<span slot="title">{{ $t('settings') }}</span>
			<div class="settings-dialog">
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
		</popup>

		<popup v-model="deleteDialog" :width="500">
			<span v-if="currentType === 'ai' && currentAI" slot="title">{{ $t('delete_ai', [currentAI.name]) }}</span>
			<span v-else-if="currentFolder" slot="title">{{ $t('delete_folder', [currentFolder.name]) }}</span>
			{{ $t('delete_warning') }}
			<div slot="actions">
				<div @click="deleteDialog = false">{{ $t('delete_cancel') }}</div>
				<div class="red" @click="deleteItem">{{ $t('delete_validate') }}</div>
			</div>
		</popup>

		<editor-test v-model="testDialog" :ais="ais" :leek-ais="leekAIs" />

		<popup v-model="newAIDialog" :width="500">
			<span slot="title">{{ $t('editor.new_desc') }}</span>
			<div class="padding">
				<input v-model="newAIName" ref="newAIInput" :placeholder="$t('editor.ai_name')" type="text" class="input dialog-input" @keyup.enter="newAI(false, newAIName)">
			</div>
			<div slot="actions">
				<div @click="newAIDialog = false">{{ $t('editor.cancel') }}</div>
				<div class="green" @click="newAI(false, newAIName)">{{ $t('main.create') }}</div>
			</div>
		</popup>

		<popup v-model="newAIv2Dialog" :width="500">
			<span slot="title">{{ $t('editor.new_desc') }}</span>
			<div class="padding">
				<input v-model="newAIName" ref="newAIInputv2" :placeholder="$t('editor.ai_name')" type="text" class="input dialog-input" @keyup.enter="newAI(true, newAIName)">
			</div>
			<div slot="actions">
				<div @click="newAIv2Dialog = false">{{ $t('editor.cancel') }}</div>
				<div class="green" @click="newAI(true, newAIName)">{{ $t('main.create') }}</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import { Route } from 'vue-router'
	import AIView from './ai-view.vue'
	import EditorFolder from './editor-folder.vue'
	import { AIItem, Folder, Item } from './editor-item'
	import EditorTabs from './editor-tabs.vue'
	import EditorTest from './editor-test.vue'
	import { generateKeywords } from './keywords'
	import './leekscript-monokai.css'
	import './leekscript.css'

	const DEFAULT_FONT_SIZE = 16
	const DEFAULT_LINE_HEIGHT = 22
	const DEFAULT_THEME = "leek-wars"

	@Component({
		name: 'editor', i18n: {},
		components: { 'editor-folder': EditorFolder, 'ai-view': AIView, 'editor-test': EditorTest, 'editor-tabs': EditorTabs }
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
		selected: any = null
		testDialog: boolean = false
		leekAIs: any = {}
		tabs: AI[] = []
		panelWidth: number = 200
		newAIDialog: boolean = false
		newAIv2Dialog: boolean = false
		newAIName: string = ''
		actions_list = [
			{icon: 'add', click: (e: any) => this.add(e)},
			{icon: 'settings', click: () => this.settings() }
		]
		actions_content = [
			{icon: 'save_alt', click: () => this.save()},
			{icon: 'delete', click: () => this.startDelete()},
			{icon: 'play_arrow', click: () => this.test()},
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
			this.enlargeWindow = localStorage.getItem('editor/large') === 'true'
			this.theme = localStorage.getItem('editor/theme') || DEFAULT_THEME
			this.autoClosing = localStorage.getItem('editor/auto_closing') === 'true'
			this.autocomplete = localStorage.getItem('editor/autocomplete') === 'true'
			this.popups = localStorage.getItem('editor/popups') === 'true'
			this.fontSize = parseInt(localStorage.getItem('editor/font_size') || '', 10) || DEFAULT_FONT_SIZE
			this.lineHeight = parseInt(localStorage.getItem('editor/line_height') || '', 10) || DEFAULT_LINE_HEIGHT
			const width = localStorage.getItem('editor/panel-width')
			if (width) {
				this.panelWidth = parseInt(width, 10)
			}
			
			LeekWars.get<{ais: AI[], folders: any[], leek_ais: {[key: number]: number}}>('ai/get-farmer-ais').then(data => {
				const folders: {[key: number]: any} = {}
				for (const folder of data.folders) {
					folders[folder.id] = folder
					this.items[folder.name] = folder
				}
				this.leekAIs = data.leek_ais
				const buildFolder = (id: number, parent: Folder): Folder => {
					const folder = new Folder(id, id in folders ? folders[id].name : '<root>', parent)
					if (id === 0) {
						folder.expanded = true
					} else {
						folder.expanded = localStorage.getItem('editor/folder/' + id) === 'true'
					}
					folder.items = data.folders
						.filter((f: any) => f.folder === id)
						.map((f: any) => buildFolder(f.id, folder))
					folder.items.push(...(data.ais
						.filter((ai: any) => ai.folder === id)
						.map((ai: any) => new AIItem(ai, folder))
					))
					this.folderById[folder.id] = folder
					return folder
				}
				this.rootFolder = buildFolder(0, this.rootFolder as Folder)
				for (const ai of data.ais) {
					ai.path = this.getAIFullPath(ai)
					Vue.set(ai, 'modified', false)
					Vue.set(this.ais, '' + ai.id, ai)
					this.items[ai.name] = ai
				}
				this.update()
				LeekWars.setTitle(this.$t('editor.title'), this.$t('editor.n_ais', [LeekWars.objectSize(data.ais)]))
			})
		}
		mounted() {
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
			this.$root.$on('escape', () => {
				if (this.currentEditor) {
					this.currentEditor.closeSearch()
				}
			})
			this.$root.$on('htmlclick', () => {
				if (this.currentEditor) {
					this.currentEditor.close()
				}
			})
			this.$root.$on('back', () => {
				this.$router.push('/editor')
			})
			this.$root.$on('editor-select', (item: any) => {
				if (this.selected) {
					this.selected.selected = false
				}
				this.selected = item
			})
			this.$root.$on('editor-drag', (item: any) => {
				this.dragging = item
			})
			this.$root.$on('editor-drop', (folder: Folder) => {
				if (!this.dragging) { return }
				if (this.dragging.parent === folder || this.dragging === folder) { return }
				if (this.dragging instanceof Folder && this.isChild(folder, this.dragging)) { return }
				this.dragging.parent.items.splice(this.dragging.parent.items.indexOf(this.dragging), 1)
				folder.items.push(this.dragging)
				this.dragging.parent = folder
				folder.expanded = true
				LeekWars.post(this.dragging.folder ? 'ai-folder/change-folder' : 'ai/change-folder', this.dragging.folder ? {folder_id: (this.dragging as Folder).id, dest_folder_id: folder.id} : {ai_id: (this.dragging as AIItem).ai.id, folder_id: folder.id})
				this.dragging = null
			})
		}
		isChild(folder: Folder, parent: Folder): boolean {
			let current = folder
			while (current.id !== 0) {
				if (current.id === parent.id) { return true }
				current = current.parent
			}
			return false
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
					if (this.$refs.tabs) {
						(this.$refs.tabs as EditorTabs).add(this.currentAI)
					}
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
				} else if (LeekWars.objectSize(this.ais) > 0) {
					this.$router.replace('/editor/' + LeekWars.firstKey(this.ais))
				} else {
					this.$router.replace('/editor/0') // Go to root folder to be able to create a new AI
				}
			} else {
				LeekWars.splitShowList()
				LeekWars.setActions(this.actions_list)
			}
		}
		getAIFullPath(ai: AI) {
			if (ai.folder > 0 && ai.folder in this.folderById) {
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
			this.$root.$off('ctrlF')
			this.$root.$off('escape')
			this.$root.$off('htmlclick')
			LeekWars.large = false
		}
		beforeRouteLeave(to: Route, from: Route, next: Function) {
			let num = 0
			for (const i in this.ais) {
				if (this.ais[i].modified) { num++ }
			}
			if (!next) { return num === 0 }
			if (num > 0 && !window.confirm(this.$i18n.t('editor.n_ais_unsaved', [num]) as string)) {
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

			LeekWars.post('ai/save', {ai_id: saveID, code: content}).then(data => {
				if (this.currentEditor === null) { return }
				this.currentEditor.saving = false
				if (this.currentEditor.ai.v2) {
					const errors = data.result
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
					if (!data.result || data.result.length === 0) {
						this.currentEditor.serverError = true
						return
					}
					this.errors = []
					for (const res of data.result) {
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
							this.errors.push({ai: ai.name, error: res[2], line: res[3]})
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
							this.errors.push({ai: ai.name, message: info, line})
							ai.valid = false
							editor.showError(line)
						}
					}
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
			})
		}
		openNewAI(v2: boolean) {
			this.newAIName = ''
			if (v2) {
				this.newAIv2Dialog = true
				Vue.nextTick(() => {
					this.$refs.newAIInputv2.focus()
				})
			} else {
				this.newAIDialog = true
				Vue.nextTick(() => {
					this.$refs.newAIInput.focus()
				})
			}
		}
		newAI(v2: boolean, name: string) {
			if (!this.currentFolder) { return }
			LeekWars.post('ai/new-name', {folder_id: this.currentFolder.id, v2, name}).then(data => {
				if (this.currentFolder) {
					const ai = data.ai
					ai.valid = true
					ai.v2 = v2
					ai.name = name
					ai.path = this.getAIFullPath(ai)
					this.currentFolder.items.push(new AIItem(ai, this.currentFolder))
					this.currentFolder.expanded = true
					Vue.set(this.ais, ai.id, ai)
					this.$store.commit('add-ai', ai)
					this.$router.push('/editor/' + ai.id)
					this.newAIDialog = false
					this.newAIv2Dialog = false
					this.newAIName = ''
				}
			})
		}
		newFolder() {
			if (!this.currentFolder) { return }
			LeekWars.post('ai-folder/new', {folder_id: this.currentFolder.id}).then(data => {
				if (this.currentFolder) {
					const folder = new Folder(data.id, this.$t('editor.new_folder') as string, this.currentFolder)
					folder.items = []
					this.folderById[folder.id] = folder
					this.currentFolder.items.push(folder)
				}
			})
		}
		startDelete() {
			this.deleteDialog = true
		}
		deleteItem() {
			const url = this.currentType === 'folder' ? 'ai-folder/delete' : 'ai/delete'
			const args = this.currentType === 'folder' ? {folder_id: this.currentID} : {ai_id: this.currentID}
			LeekWars.delete(url, args).then(data => {
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
			}).error(error => {
				LeekWars.toast(error)
			})
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
		@Watch('enlargeWindow') enlargeWindowChange() {
			LeekWars.large = this.enlargeWindow
			localStorage.setItem('editor/large', '' + this.enlargeWindow)
		}
		jump(ai: AI, line: number) {
			if (ai !== this.currentAI) {
				this.$router.push('/editor/' + ai.id)
			}
			Vue.nextTick(() => {
				const editor = (this.$refs.editors as AIView[]).find(e => e.ai === ai)
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
	.editor-left > .full {
		padding: 0;
		display: flex;
		flex-direction: column;
		height: 100%;
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
	.editors {
		height: calc(100vh - 140px);
		padding: 0;
	}
	.editors.tabs {
		height: calc(100vh - 170px);
	}
	#app.app .editors {
		height: calc(100vh - 56px);
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
	/deep/ .CodeMirror {
		height: 100%;
	}
	.editor-left {
		height: calc(100vh - 140px);
	}
	#app.app .editor-left {
		height: calc(100vh - 56px);
	}
	.column9 {
		position: relative;
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
	.column3 {
		position: relative;
	}
	.resizer {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 10px;
		cursor: ew-resize;
		width: 15px;
	}
	.dialog-input {
		width: calc(100% - 10px);
		padding: 5px;
	}
</style>
