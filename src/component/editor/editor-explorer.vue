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

<script setup lang="ts">
	import { AI } from '@/model/ai'
	import { fileSystem, translateFileSystemError } from '@/model/filesystem'
	import { mixins, t as gt } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import EditorFolder from './editor-folder.vue'
	import { Folder } from './editor-item'
	import { explorer } from './explorer'
	import { emitter } from '@/model/vue'
	import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRouter } from 'vue-router'

	defineOptions({ name: 'editor-explorer', i18n: {}, mixins: [...mixins], components: { 'editor-folder': EditorFolder } })

	const props = defineProps<{
		currentAi: AI | undefined
		selectedFolder: Folder | null
	}>()

	const emit = defineEmits<{
		test: []
		'delete-ai': [ai: AI]
		'delete-folder': [folder: Folder]
	}>()

	const { t } = useI18n()
	const router = useRouter()
	const nameInput = useTemplateRef<HTMLElement>('nameInput')
	const newAIInput = useTemplateRef<HTMLElement>('newAIInput')
	const newFolderInput = useTemplateRef<HTMLElement>('newFolderInput')

	const aiMenu = ref(false)
	const folderMenu = ref(false)
	const binMenu = ref(false)
	const binFolderMenu = ref(false)
	const destroyFolderDialog = ref(false)
	const x = ref(0)
	const y = ref(0)
	const ai = ref<AI | null>(null)
	const folder = ref<Folder | null>(null)
	const renameDialog = ref(false)
	const newName = ref('')
	const deleteDialog = ref(false)
	const destroyDialog = ref(false)
	const emptyDialog = ref(false)
	const newAIName = ref('')
	const newAIDialog = ref(false)
	const newFolderDialog = ref(false)
	const newFolderName = ref('')
	const windowsForbiddenChars = ['\\', ':', '*', '?', '"', '<', '>', '|']
	const windowsReservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']

	onMounted(() => {
		emitter.on('editor-menu', openMenu)
		emitter.on('keyup', keyup)
	})
	onUnmounted(() => {
		emitter.off('editor-menu', openMenu)
		emitter.off('keyup', keyup)
	})

	function open() {
		router.push('/editor/' + ai.value!.path)
	}

	function openMenu(event: { item: AI | Folder, ai: boolean, e: any }) {
		const { item, ai: isAi, e } = event
		e.preventDefault()
		aiMenu.value = folderMenu.value = binMenu.value = binFolderMenu.value = false
		x.value = e.clientX
		y.value = e.clientY
		if (isAi) {
			ai.value = item as AI
			folder.value = null
			nextTick(() => aiMenu.value = true)
		} else {
			folder.value = item as Folder
			ai.value = null
			if (folder.value.id === -1) {
				nextTick(() => binMenu.value = true)
			} else if (isFolderInBin(folder.value)) {
				nextTick(() => binFolderMenu.value = true)
			} else {
				nextTick(() => folderMenu.value = true)
			}
		}
	}

	function windowsWarning(name: string): string | null {
		for (const char of windowsForbiddenChars) {
			if (name.includes(char)) return char
		}
		if (windowsReservedNames.includes(name.toUpperCase())) return name
		return null
	}

	function isWindowsReservedName(name: string): boolean {
		return windowsReservedNames.includes(name.toUpperCase())
	}

	function nameError(name: string, parentFolder?: Folder, excludeName?: string): string | null {
		if (name === '') return t('invalid_name_empty') as string
		if (name === '.' || name === '..' || name === '.trash') return t('invalid_name_reserved') as string
		if (name.includes('/')) return t('invalid_name_slash') as string
		if (parentFolder && name !== excludeName) {
			for (const item of parentFolder.items) {
				if (item.name === name) {
					return t('name_conflict') as string
				}
			}
		}
		return null
	}

	const renameError = computed(() => {
		if (ai.value) {
			const parent = fileSystem.folderById[ai.value.folder] || fileSystem.rootFolder
			return nameError(newName.value, parent, ai.value.name)
		} else if (folder.value) {
			const parent = fileSystem.folderById[folder.value.parent] || fileSystem.rootFolder
			return nameError(newName.value, parent, folder.value.name)
		}
		return null
	})

	const newAIError = computed(() => {
		if (!folder.value) return null
		return nameError(newAIName.value, folder.value)
	})

	const newFolderError = computed(() => {
		if (!folder.value) return null
		return nameError(newFolderName.value, folder.value)
	})

	function renameStart() {
		if (ai.value) {
			newName.value = ai.value.name
		} else {
			newName.value = folder.value!.name
		}
		renameDialog.value = true
		setTimeout(() => nameInput.value?.focus(), 50)
	}

	function rename() {
		if (ai.value) {
			if (newName.value !== ai.value.name) {
				LeekWars.post('ai/rename', {path: ai.value.path, new_name: newName.value}).then(() => {
					LeekWars.toast(gt('leekscript.ai_renamed', [newName.value]))
					fileSystem.renameAI(ai.value!, newName.value)
					router.replace('/editor/' + ai.value!.path)
				}).error((error: any) => {
					LeekWars.toast(translateFileSystemError(error))
				})
			}
		} else if (folder.value) {
			if (newName.value !== folder.value.name) {
				const folderPath = fileSystem.getFolderPath(folder.value).replace(/\/$/, '')
				LeekWars.post('ai-folder/rename', {path: folderPath, new_name: newName.value}).then(() => {
					LeekWars.toast(gt('leekscript.folder_renamed', [newName.value]))
					folder.value!.name = newName.value
				}).error((error: any) => {
					LeekWars.toast(translateFileSystemError(error))
				})
			}
		}
		renameDialog.value = false
	}

	const isFolderGitRepo = computed(() => {
		if (!folder.value || folder.value.id <= 0) return false
		const path = fileSystem.getFolderPath(folder.value).replace(/\/$/, '')
		return !!fileSystem.gitRepos[path]
	})

	function initGit() {
		if (!folder.value || folder.value.id <= 0) return
		const folderPath = fileSystem.getFolderPath(folder.value).replace(/\/$/, '')
		LeekWars.post('git/init', { folder: folderPath }).then(() => {
			fileSystem.gitRepos[folderPath] = true
			emitter.emit('git-repos-changed')
			LeekWars.toast('Git initialized in ' + folder.value!.name)
		}).error((error: any) => {
			LeekWars.toast(error.error)
		})
	}

	function deinitGit() {
		if (!folder.value || folder.value.id <= 0) return
		if (!confirm(t('deinit_git_confirm', [folder.value.name]) as string)) return
		const folderPath = fileSystem.getFolderPath(folder.value).replace(/\/$/, '')
		LeekWars.post('git/deinit', { folder: folderPath }).then(() => {
			delete fileSystem.gitRepos[folderPath]
			emitter.emit('git-repos-changed')
			LeekWars.toast('Git removed from ' + folder.value!.name)
		}).error((error: any) => {
			LeekWars.toast(error.error)
		})
	}

	function deleteItem() {
		if (ai.value) {
			fileSystem.deleteAI(ai.value)
			emit('delete-ai', ai.value)
			deleteDialog.value = false
		} else if (folder.value) {
			fileSystem.deleteFolder(folder.value)
			emit('delete-folder', folder.value)
			deleteDialog.value = false
		}
	}
	function deleteAI(target: AI) {
		ai.value = target
		deleteDialog.value = true
	}

	function destroyAI() {
		if (ai.value) {
			fileSystem.destroyAI(ai.value)
			destroyDialog.value = false
		}
	}

	function emptyBin() {
		fileSystem.emptyBin()
		emptyDialog.value = false
	}

	function restoreAI() {
		if (ai.value) {
			fileSystem.restore(ai.value)
		}
	}

	function restoreFolder() {
		if (folder.value) {
			fileSystem.restoreFolder(folder.value)
		}
	}

	function destroyFolderConfirm() {
		if (folder.value) {
			fileSystem.destroyFolder(folder.value)
			destroyFolderDialog.value = false
		}
	}

	const aiInBin = computed(() => ai.value !== null && fileSystem.isInBin(ai.value.folder))

	function isFolderInBin(target: Folder): boolean {
		let current = target
		while (current.parent !== 0) {
			if (current.parent === -1) return true
			current = fileSystem.folderById[current.parent]
			if (!current) return false
		}
		return false
	}

	function openNewAI(target: Folder) {
		folder.value = target
		newAIStart()
	}
	function newAIStart() {
		newAIDialog.value = true
		setTimeout(() => newAIInput.value?.focus(), 50)
	}
	function newAI(v2: boolean, name: string) {
		if (!folder.value) { return }
		const folderPath = folder.value.id === 0 ? '' : fileSystem.getFolderPath(folder.value).replace(/\/$/, '')
		LeekWars.post('ai/create', {folder: folderPath, version: LeekWars.LATEST_LEEKSCRIPT_VERSION, name}).then((data: any) => {
			const newAi = new AI({
				name,
				path: data.path,
				folder: folder.value!.id,
				valid: true,
				version: LeekWars.LATEST_LEEKSCRIPT_VERSION,
				code: data.code,
				total_chars: data.code.length,
				total_lines: data.code.split("\n").length,
			})
			fileSystem.add_ai(newAi, folder.value!)
			folder.value!.expanded = true
			router.push('/editor/' + newAi.path)
			newAIDialog.value = false
			newAIName.value = ''
		}).error((error: any) => {
			LeekWars.toast(translateFileSystemError(error))
		})
	}
	function openNewFolder(target: Folder) {
		folder.value = target
		newFolderStart()
	}
	function newFolderStart() {
		newFolderDialog.value = true
		setTimeout(() => newFolderInput.value?.focus(), 50)
	}
	function closeFolder() {
		if (folder.value) {
			explorer.setClosed(folder.value, true)
			explorer.setExpanded(folder.value, false)
		}
	}
	function openFolder() {
		if (folder.value) {
			explorer.setClosed(folder.value, false)
		}
	}
	function newFolder(name: string) {
		if (!folder.value) { return }
		const parentPath = folder.value.id === 0 ? '' : fileSystem.getFolderPath(folder.value).replace(/\/$/, '')
		const dirPath = parentPath ? parentPath + '/' + name : name
		LeekWars.post('ai-folder/create', {path: dirPath}).then(() => {
			if (folder.value) {
				let nextId = 1
				for (const id in fileSystem.folderById) { if (parseInt(id) >= nextId) nextId = parseInt(id) + 1 }
				const newF = new Folder(nextId, name, folder.value.id)
				newF.items = []
				fileSystem.add_folder(newF, folder.value)
				folder.value!.expanded = true
				newFolderDialog.value = false
				newFolderName.value = ''
			}
		})
	}

	function keyup(e: KeyboardEvent) {
		if (e.which === 46) { // Suppr
			if (props.currentAi) {
				ai.value = props.currentAi
				deleteDialog.value = true
			} else if (props.selectedFolder) {
				folder.value = props.selectedFolder
				deleteDialog.value = true
			}
		}
	}

	function downloadSimple() {
		download(ai.value!.name, "/** " + ai.value!.path + " **/\n\n" + ai.value!.code)
	}

	async function downloadIncludes() {
		if (!ai.value) { return }

		const regex = /^[ \t]*include\s*\(\s*["'](.*?)["']\s*\)[ \t]*;?.*$/gm
		const pragmaRegex = /^[ \t]*\/\/[ \t]*@[A-Za-z_][A-Za-z0-9_]*(?:[ \t]*:[ \t]*\S+)?[ \t]*\r?$/gm

		const included_ais = new Set<AI>()

		async function ensureLoaded(target: AI): Promise<void> {
			if (target.code === undefined || target.code === null) {
				await fileSystem.load(target)
			}
			if (!target.code) return
			const children: AI[] = []
			for (const match of target.code.matchAll(regex)) {
				const included = fileSystem.find(match[1], target.folder)
				if (included && !included_ais.has(included)) {
					included_ais.add(included)
					children.push(included)
				}
			}
			await Promise.all(children.map(ensureLoaded))
		}

		await ensureLoaded(ai.value)
		included_ais.clear()

		const fun = (target: AI, isRoot: boolean): string => {
			let code = target.code ?? ''
			if (!isRoot) {
				code = code.replace(pragmaRegex, '')
			}
			return "/** " + target.path + " **/\n\n" + code.replace(regex, (a, path) => {
				const included = fileSystem.find(path, target.folder)
				if (included && !included_ais.has(included)) {
					included_ais.add(included)
					return fun(included, false)
				} else {
					return ""
				}
			})
		}
		const code = fun(ai.value!, true)

		download(ai.value!.name, code)
	}

	function download(filename: string, text: string) {
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

	defineExpose({ openNewAI, openNewFolder, deleteAI })
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
