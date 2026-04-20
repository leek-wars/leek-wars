<template lang="html">
	<div class="explorer">
		<editor-folder :folder="fileSystem.rootFolder" :level="0" />

		<editor-folder :folder="fileSystem.bin" :level="1" />

		<v-menu :target="[x, y]" :model-value="aiMenu">
			<v-list class="menu">
				<v-list-subheader v-if="ai">{{ ai.name }}</v-list-subheader>
				<v-list-item v-ripple @click="open()" prepend-icon="mdi-card-plus-outline">
					<v-list-item-title>{{ $t('open') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="ai && !aiInBin" v-ripple @click="$emit('test')" prepend-icon="mdi-play">
					<v-list-item-title>{{ $t('test') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="ai && !aiInBin" v-ripple @click="renameStart" prepend-icon="mdi-pencil">
					<v-list-item-title>{{ $t('rename') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="ai && !aiInBin" v-ripple @click="deleteDialog = true" prepend-icon="mdi-delete">
					<v-list-item-title>{{ $t('delete') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="ai && aiInBin && ai.folder === -1" v-ripple @click="destroyDialog = true" prepend-icon="mdi-delete-forever">
					<v-list-item-title>{{ $t('destroy') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="ai && aiInBin && ai.folder === -1" v-ripple @click="restoreAI" prepend-icon="mdi-file-restore">
					<v-list-item-title>{{ $t('restore') }}</v-list-item-title>
				</v-list-item>
				<template v-if="ai && ai.includes && ai.includes.length">
					<v-menu submenu open-on-hover>
						<template #activator="{ props }">
							<v-list-item v-ripple v-bind="props" prepend-icon="mdi-download" append-icon="mdi-menu-right">
								<v-list-item-title>{{ $t('download') }}</v-list-item-title>
							</v-list-item>
						</template>
						<v-list class="menu" :dense="true">
							<v-list-item v-ripple @click="downloadSimple()" prepend-icon="mdi-file-outline">
								<v-list-item-title>{{ $t('download_simple') }}</v-list-item-title>
							</v-list-item>
							<v-list-item v-ripple @click="downloadIncludes()" prepend-icon="mdi-file-multiple-outline">
								<v-list-item-title>{{ $t('download_includes') }}</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
				<v-list-item v-else v-ripple @click="downloadSimple()" prepend-icon="mdi-download">
					<v-list-item-title>{{ $t('download') }}</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-menu :target="[x, y]" :model-value="folderMenu">
			<v-list class="menu" :dense="true">
				<v-list-subheader v-if="folder && folder.id !== 0">{{ folder.name }}</v-list-subheader>
				<v-list-item v-if="folder && !folder.closed" v-ripple @click="newAIStart()" prepend-icon="mdi-file-plus-outline">
					<v-list-item-title>{{ $t('new_ai') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="folder && !folder.closed" v-ripple @click="newFolderStart()" prepend-icon="mdi-folder-plus-outline">
					<v-list-item-title>{{ $t('new_folder') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="folder && !folder.closed" v-ripple @click="renameStart" prepend-icon="mdi-pencil">
					<v-list-item-title>{{ $t('rename') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="folder && folder.closed" v-ripple @click="openFolder()" prepend-icon="mdi-folder-open-outline">
					<v-list-item-title>{{ $t('open_folder') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-else v-ripple @click="closeFolder()" prepend-icon="mdi-folder-lock-outline">
					<v-list-item-title>{{ $t('close_folder') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="folder && folder.id > 0 && !folder.closed && !isFolderGitRepo" v-ripple @click="initGit()" prepend-icon="mdi-source-branch">
					<v-list-item-title>{{ $t('init_git') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="folder && folder.id > 0 && !folder.closed && isFolderGitRepo" v-ripple @click="deinitGit()" prepend-icon="mdi-source-branch-remove">
					<v-list-item-title>{{ $t('deinit_git') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-ripple @click="deleteDialog = true" prepend-icon="mdi-delete">
					<v-list-item-title>{{ $t('delete') }}</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-menu :target="[x, y]" :model-value="binMenu">
			<v-list class="menu">
				<v-list-subheader v-if="folder" class="title">{{ $t(folder.name) }}</v-list-subheader>
				<v-list-item v-ripple @click="emptyDialog = true" prepend-icon="mdi-delete-forever">
					<v-list-item-title>{{ $t('empty_bin') }}</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-menu :target="[x, y]" :model-value="binFolderMenu">
			<v-list class="menu">
				<v-list-subheader v-if="folder">{{ folder.name }}</v-list-subheader>
				<v-list-item v-ripple @click="restoreFolder" prepend-icon="mdi-folder-refresh-outline">
					<v-list-item-title>{{ $t('restore') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-ripple @click="destroyFolderDialog = true" prepend-icon="mdi-delete-forever">
					<v-list-item-title>{{ $t('destroy') }}</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>

		<popup v-model="destroyFolderDialog" :width="500" icon="mdi-delete-forever" :title="$t('destroy_folder', [folder?.name])">
			{{ $t('destroy_folder_warning') }}
			<template #actions>
				<div v-ripple @click="destroyFolderDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="red" @click="destroyFolderConfirm">{{ $t('destroy_validate') }}</div>
			</template>
		</popup>

		<popup v-model="renameDialog" :width="500" icon="mdi-pencil" :title="$t('rename')">
			<div class="padding">
				<v-text-field ref="nameInput" v-model="newName" variant="outlined" density="compact" autofocus
					:error-messages="renameError ? [renameError] : []"
					:messages="!renameError && windowsWarning(newName) ? [isWindowsReservedName(newName) ? $t('windows_warning_reserved', [newName]) : $t('windows_warning_char', [windowsWarning(newName)])] : []"
					:color="!renameError && windowsWarning(newName) ? 'warning' : undefined"
					:class="{'text-field-warning': !renameError && windowsWarning(newName)}"
					@keyup.stop @keyup.enter="!renameError && rename()" />
			</div>
			<template #actions>
				<div v-ripple @click="renameDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple :class="{green: !renameError, disabled: !!renameError}" @click="!renameError && rename()">{{ $t('rename') }}</div>
			</template>
		</popup>

		<popup v-model="deleteDialog" :width="500" icon="mdi-delete">
			<template #title>
				<span v-if="ai">{{ $t('delete_ai', [ai.name]) }}</span>
				<span v-else-if="folder">{{ $t('delete_folder', [folder.name]) }}</span>
			</template>
			{{ $t('delete_warning') }}
			<template #actions>
				<div v-ripple @click="deleteDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="red" @click="deleteItem">{{ $t('delete_validate') }}</div>
			</template>
		</popup>

		<popup v-model="destroyDialog" :width="500" icon="mdi-delete-forever" :title="$t('destroy_ai', [ai?.name])">
			<template #icon>
			<v-icon>mdi-delete-forever</v-icon>
		</template>
			{{ $t('destroy_warning') }}
			<template #actions>
				<div v-ripple @click="destroyDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="red" @click="destroyAI">{{ $t('destroy_validate') }}</div>
			</template>
		</popup>

		<popup v-model="emptyDialog" :width="500" icon="mdi-delete" :title="$t('empty_bin')">
			{{ $t('empty_warning') }}
			<template #actions>
				<div v-ripple @click="emptyDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="red" @click="emptyBin">{{ $t('empty_bin') }}</div>
			</template>
		</popup>

		<popup v-model="newAIDialog" :width="500" icon="mdi-plus-circle-outline" :title="$t('new_desc')">
			<div class="padding">
				<v-text-field ref="newAIInput" v-model="newAIName" :placeholder="$t('ai_name')" variant="outlined" density="compact" autofocus
					:error-messages="newAIError ? [newAIError] : []"
					:messages="!newAIError && windowsWarning(newAIName) ? [isWindowsReservedName(newAIName) ? $t('windows_warning_reserved', [newAIName]) : $t('windows_warning_char', [windowsWarning(newAIName)])] : []"
					:color="!newAIError && windowsWarning(newAIName) ? 'warning' : undefined"
					:class="{'text-field-warning': !newAIError && windowsWarning(newAIName)}"
					@keyup.stop @keyup.enter="!newAIError && newAI(false, newAIName)" />
			</div>
			<template #actions>
				<div v-ripple @click="newAIDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple :class="{green: !newAIError, disabled: !!newAIError}" @click="!newAIError && newAI(false, newAIName)">{{ $t('main.create') }}</div>
			</template>
		</popup>

		<popup v-model="newFolderDialog" :width="500" icon="mdi-folder-plus" :title="$t('new_folder')">
			<div class="padding">
				<v-text-field ref="newFolderInput" v-model="newFolderName" :placeholder="$t('folder_name')" variant="outlined" density="compact" autofocus
					:error-messages="newFolderError ? [newFolderError] : []"
					:messages="!newFolderError && windowsWarning(newFolderName) ? [isWindowsReservedName(newFolderName) ? $t('windows_warning_reserved', [newFolderName]) : $t('windows_warning_char', [windowsWarning(newFolderName)])] : []"
					:color="!newFolderError && windowsWarning(newFolderName) ? 'warning' : undefined"
					:class="{'text-field-warning': !newFolderError && windowsWarning(newFolderName)}"
					@keyup.stop @keyup.enter="!newFolderError && newFolder(newFolderName)" />
			</div>
			<template #actions>
				<div v-ripple @click="newFolderDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple :class="{green: !newFolderError, disabled: !!newFolderError}" @click="!newFolderError && newFolder(newFolderName)">{{ $t('main.create') }}</div>
			</template>
		</popup>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { fileSystem, translateFileSystemError } from '@/model/filesystem'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import EditorFolder from './editor-folder.vue'
	import { Folder } from './editor-item'
	import { explorer } from './explorer'
	import { emitter } from '@/model/vue'
	import { nextTick } from 'vue'

	@Options({ name: 'editor-explorer', i18n: {}, mixins: [...mixins], components: { 'editor-folder': EditorFolder } })
	export default class EditorExplorer extends Vue {
		@Prop({required: true}) currentAi!: AI
		@Prop({required: true}) selectedFolder!: Folder
		fileSystem = fileSystem
		aiMenu: boolean = false
		folderMenu: boolean = false
		binMenu: boolean = false
		binFolderMenu: boolean = false
		destroyFolderDialog: boolean = false
		x: number = 0
		y: number = 0
		ai: AI | null = null
		folder: Folder | null = null
		renameDialog: boolean = false
		newName: string = ''
		deleteDialog: boolean = false
		destroyDialog: boolean = false
		emptyDialog: boolean = false
		newAIName: string = ''
		newAIDialog: boolean = false
		newFolderDialog: boolean = false
		newFolderName: string = ''
		windowsForbiddenChars = ['\\', ':', '*', '?', '"', '<', '>', '|']
		windowsReservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']

		created() {
			emitter.on('editor-menu', this.openMenu)
			emitter.on('keyup', this.keyup)
		}
		unmounted() {
			emitter.off('editor-menu', this.openMenu)
			emitter.off('keyup', this.keyup)
		}

		open() {
			this.$router.push('/editor/' + this.ai!.path)
		}

		openMenu(event: { item: AI | Folder, ai: boolean, e: any }) {
			const { item, ai, e } = event
			e.preventDefault()
			this.aiMenu = this.folderMenu = this.binMenu = this.binFolderMenu = false
			this.x = e.clientX
			this.y = e.clientY
			if (ai) {
				this.ai = item as AI
				this.folder = null
				nextTick(() => this.aiMenu = true)
			} else {
				this.folder = item as Folder
				this.ai = null
				// console.log("folder", this.folder)
				if (this.folder.id === -1) {
					nextTick(() => this.binMenu = true)
				} else if (this.isFolderInBin(this.folder)) {
					nextTick(() => this.binFolderMenu = true)
				} else {
					nextTick(() => this.folderMenu = true)
				}
			}
			console.log("openMenu", event, this.x, this.y)
		}

		windowsWarning(name: string): string | null {
			for (const char of this.windowsForbiddenChars) {
				if (name.includes(char)) return char
			}
			if (this.windowsReservedNames.includes(name.toUpperCase())) return name
			return null
		}

		isWindowsReservedName(name: string): boolean {
			return this.windowsReservedNames.includes(name.toUpperCase())
		}

		nameError(name: string, parentFolder?: Folder, excludeName?: string): string | null {
			if (name === '') return this.$t('invalid_name_empty') as string
			if (name === '.' || name === '..' || name === '.trash') return this.$t('invalid_name_reserved') as string
			if (name.includes('/')) return this.$t('invalid_name_slash') as string
			if (parentFolder && name !== excludeName) {
				for (const item of parentFolder.items) {
					if (item.name === name) {
						return this.$t('name_conflict') as string
					}
				}
			}
			return null
		}

		get renameError(): string | null {
			if (this.ai) {
				const parent = fileSystem.folderById[this.ai.folder] || fileSystem.rootFolder
				return this.nameError(this.newName, parent, this.ai.name)
			} else if (this.folder) {
				const parent = fileSystem.folderById[this.folder.parent] || fileSystem.rootFolder
				return this.nameError(this.newName, parent, this.folder.name)
			}
			return null
		}

		get newAIError(): string | null {
			if (!this.folder) return null
			return this.nameError(this.newAIName, this.folder)
		}

		get newFolderError(): string | null {
			if (!this.folder) return null
			return this.nameError(this.newFolderName, this.folder)
		}

		renameStart() {
			if (this.ai) {
				this.newName = this.ai!.name
			} else {
				this.newName = this.folder!.name
			}
			this.renameDialog = true
			setTimeout(() => (this.$refs.nameInput as HTMLElement).focus(), 50)
		}

		rename() {
			if (this.ai) {
				if (this.newName !== this.ai.name) {
					LeekWars.post('ai/rename', {path: this.ai.path, new_name: this.newName}).then(() => {
						LeekWars.toast(i18n.t('leekscript.ai_renamed', [this.newName]) as string)
						fileSystem.renameAI(this.ai!, this.newName)
						this.$router.replace('/editor/' + this.ai!.path)
					}).error((error: any) => {
						LeekWars.toast(translateFileSystemError(error))
					})
				}
			} else if (this.folder) {
				if (this.newName !== this.folder.name) {
					const folderPath = fileSystem.getFolderPath(this.folder).replace(/\/$/, '')
					LeekWars.post('ai-folder/rename', {path: folderPath, new_name: this.newName}).then(() => {
						LeekWars.toast(i18n.t('leekscript.folder_renamed', [this.newName]) as string)
						this.folder!.name = this.newName
					}).error((error: any) => {
						LeekWars.toast(translateFileSystemError(error))
					})
				}
			}
			this.renameDialog = false
		}

		get isFolderGitRepo(): boolean {
			if (!this.folder || this.folder.id <= 0) return false
			const path = fileSystem.getFolderPath(this.folder).replace(/\/$/, '')
			return !!fileSystem.gitRepos[path]
		}

		initGit() {
			if (!this.folder || this.folder.id <= 0) return
			const folderPath = fileSystem.getFolderPath(this.folder).replace(/\/$/, '')
			LeekWars.post('git/init', { folder: folderPath }).then(() => {
				fileSystem.gitRepos[folderPath] = true
				emitter.emit('git-repos-changed')
				LeekWars.toast('Git initialized in ' + this.folder!.name)
			}).error((error: any) => {
				LeekWars.toast(error.error)
			})
		}

		deinitGit() {
			if (!this.folder || this.folder.id <= 0) return
			if (!confirm(this.$t('deinit_git_confirm', [this.folder.name]) as string)) return
			const folderPath = fileSystem.getFolderPath(this.folder).replace(/\/$/, '')
			LeekWars.post('git/deinit', { folder: folderPath }).then(() => {
				delete fileSystem.gitRepos[folderPath]
				emitter.emit('git-repos-changed')
				LeekWars.toast('Git removed from ' + this.folder!.name)
			}).error((error: any) => {
				LeekWars.toast(error.error)
			})
		}

		deleteItem() {
			if (this.ai) {
				fileSystem.deleteAI(this.ai)
				this.$emit('delete-ai', this.ai)
				this.deleteDialog = false
			} else if (this.folder) {
				fileSystem.deleteFolder(this.folder)
				this.$emit('delete-folder', this.folder)
				this.deleteDialog = false
			}
		}
		deleteAI(ai: AI) {
			this.ai = ai
			this.deleteDialog = true
		}

		destroyAI() {
			if (this.ai) {
				fileSystem.destroyAI(this.ai)
				// this.$emit('delete-ai', this.ai)
				this.destroyDialog = false
			}
		}

		emptyBin() {
			fileSystem.emptyBin()
			this.emptyDialog = false
		}

		restoreAI() {
			if (this.ai) {
				fileSystem.restore(this.ai)
			}
		}

		restoreFolder() {
			if (this.folder) {
				fileSystem.restoreFolder(this.folder)
			}
		}

		destroyFolderConfirm() {
			if (this.folder) {
				fileSystem.destroyFolder(this.folder)
				this.destroyFolderDialog = false
			}
		}

		get aiInBin(): boolean {
			return this.ai !== null && fileSystem.isInBin(this.ai.folder)
		}

		isFolderInBin(folder: Folder): boolean {
			let current = folder
			while (current.parent !== 0) {
				if (current.parent === -1) return true
				current = fileSystem.folderById[current.parent]
				if (!current) return false
			}
			return false
		}

		openNewAI(folder: Folder) {
			this.folder = folder
			this.newAIStart()
		}
		newAIStart() {
			this.newAIDialog = true
			setTimeout(() => (this.$refs.newAIInput as HTMLElement).focus(), 50)
		}
		newAI(v2: boolean, name: string) {
			if (!this.folder) { return }
			const folderPath = this.folder.id === 0 ? '' : fileSystem.getFolderPath(this.folder).replace(/\/$/, '')
			LeekWars.post('ai/create', {folder: folderPath, version: LeekWars.LATEST_LEEKSCRIPT_VERSION, name}).then((data: any) => {
				const ai = new AI({
					name,
					path: data.path,
					folder: this.folder!.id,
					valid: true,
					version: LeekWars.LATEST_LEEKSCRIPT_VERSION,
					code: data.code,
					total_chars: data.code.length,
					total_lines: data.code.split("\n").length,
				})
				fileSystem.add_ai(ai, this.folder!)
				this.folder!.expanded = true
				this.$router.push('/editor/' + ai.path)
				this.newAIDialog = false
				this.newAIName = ''
			}).error((error: any) => {
				LeekWars.toast(translateFileSystemError(error))
			})
		}
		openNewFolder(folder: Folder) {
			this.folder = folder
			this.newFolderStart()
		}
		newFolderStart() {
			this.newFolderDialog = true
			setTimeout(() => (this.$refs.newFolderInput as HTMLElement).focus(), 50)
		}
		closeFolder() {
			if (this.folder) {
				explorer.setClosed(this.folder, true)
				explorer.setExpanded(this.folder, false)
			}
		}
		openFolder() {
			if (this.folder) {
				explorer.setClosed(this.folder, false)
			}
		}
		newFolder(name: string) {
			if (!this.folder) { return }
			const parentPath = this.folder.id === 0 ? '' : fileSystem.getFolderPath(this.folder).replace(/\/$/, '')
			const dirPath = parentPath ? parentPath + '/' + name : name
			LeekWars.post('ai-folder/create', {path: dirPath}).then(() => {
				if (this.folder) {
					let nextId = 1
					for (const id in fileSystem.folderById) { if (parseInt(id) >= nextId) nextId = parseInt(id) + 1 }
					const folder = new Folder(nextId, name, this.folder.id)
					folder.items = []
					fileSystem.add_folder(folder, this.folder)
					this.folder!.expanded = true
					this.newFolderDialog = false
					this.newFolderName = ''
				}
			})
		}

		keyup(e: KeyboardEvent) {
			if (e.which === 46) { // Suppr
				if (this.currentAi) {
					this.ai = this.currentAi
					this.deleteDialog = true
				} else if (this.selectedFolder) {
					this.folder = this.selectedFolder
					this.deleteDialog = true
				}
			}
		}

		downloadSimple() {
			this.download(this.ai!.name, "/** " + this.ai!.path + " **/\n\n" + this.ai!.code)
		}

		downloadIncludes() {
			if (!this.ai) { return }

			const regex = /^[ \t]*include\s*\(\s*["'](.*?)["']\s*\)[ \t]*;?.*$/gm

			const included_ais = new Set<AI>()
			const fun = (ai: AI): string => "/** " + ai.path + " **/\n\n" + (ai.code ? ai.code.replace(regex, (a, path) => {
				const included = fileSystem.find(path, ai.folder)
				if (included && !included_ais.has(included)) {
					included_ais.add(included)
					return fun(included)
				} else {
					return ""
				}
			}) : '')
			const code = fun(this.ai!)

			this.download(this.ai!.name, code)
		}

		download(filename: string, text: string) {
			const data = "/** Exporté le " + new Date().toLocaleString() + " **/\n\n" + text
			if (!filename.endsWith(".leek")) {
				filename += ".leek"
			}
			const element = document.createElement('a')
			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data))
			element.setAttribute('download', filename)
			element.style.display = 'none'
			document.body.appendChild(element)
			element.click()
			document.body.removeChild(element)
		}
	}
</script>

<style lang="scss" scoped>
.explorer {
	height: 100%;
	display: flex;
	flex-direction: column;
}
.title {
	padding: 5px 10px;
	padding-top: 10px;
	color: #777;
	font-size: 13px;
}
.v-icon {
	margin-right: 8px;
}
.dialog-input {
	width: 100%;
	padding: 10px;
}
.disabled {
	opacity: 0.5;
	pointer-events: none;
}
.text-field-warning :deep(.v-messages__message) {
	color: #d35400;
}
</style>
