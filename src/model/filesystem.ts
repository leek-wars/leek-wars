import { AIItem, Folder } from '@/component/editor/editor-item'
import { AI } from '@/model/ai'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { emitter } from '@/model/vue'

import { Keyword } from './keyword'
import { reactive } from 'vue'

const FS_ERROR_KEYS = new Set([
	'quota_size_exceeded', 'quota_files_exceeded',
	'path_traversal', 'symlink_forbidden',
	'invalid_path', 'invalid_name', 'invalid_character',
	'ai_too_long', 'mkdir_failed', 'file_not_found', 'name_conflict'
])

function translateFileSystemError(error: unknown): string {
	const code = typeof error === 'string'
		? error
		: (error && typeof error === 'object' && 'error' in error ? String((error as {error: unknown}).error ?? '') : '')
	if (FS_ERROR_KEYS.has(code)) {
		return i18n.t('leekscript.fs_' + code) as string
	}
	return i18n.t('leekscript.fs_unknown_error', [code || 'unknown']) as string
}

class FileSystem {

	public static CONSOLE_MAGIC_KEY = '__console_CkG3VwGs3K__'

	public ais: {[key: string]: AI} = {}
	public folderById: {[key: number]: Folder} = {}
	public get aiByFullPath() { return this.ais } // alias pour compatibilité
	public aiCount: number = 0
	public rootFolder!: Folder
	public bin!: Folder
	public leekAIs: {[key: number]: string} = {} // leek_id -> ai path
	private items: {[key: string]: AI | Folder} = {}
	public symbols: { [key: string]: Keyword } = {}
	// Git: map de chemin relatif (ex: "Combat/main") -> statut git ('M', 'A', 'D', '?')
	public gitStatus: {[path: string]: string} = {}
	// Git: map des chemins de dossiers qui sont des repos git
	public gitRepos: {[path: string]: boolean} = {}
	public botAIs = [
		{id: -1, name: 'lambda', path: '/lambda', bot: true, valid: true, color: 'green', specs: [
			"basic_items", "basic_strategy", "reachable_cells", "combos"
		]},
		{id: -2, name: 'normal', path: '/normal', bot: true, valid: true, color: 'blue', specs: [
			"liberation", "antidote", "hide_and_seek", "bulbs"
		]},
		{id: -3, name: 'confirmed', path: 'confirmed', bot: true, valid: true, color: 'red', specs: [
			"advanced_items", "aoe", "inversion", "resurrection"
		]},
		{id: -4, name: 'expert', path: '/expert', bot: true, valid: true, color: 'black', specs: [
			"advanced_strategy", "teleportation", "jump", "blocking"
		]},
	]
	public consoleAI: AI | null = null

	/**
	 * Initialise le filesystem depuis le scan FS (format path-based).
	 */
	public init(data: { files: any[], folders: string[], bin: any[], leek_ais: {[key: string]: string} }) {
		let nextId = 1

		// Root folder
		this.rootFolder = new Folder(0, '<root>', 0)
		this.rootFolder.expanded = true
		this.rootFolder.items = []
		this.folderById[0] = this.rootFolder

		// Map chemin -> Folder pour construire l'arborescence
		const folderByPath: {[path: string]: Folder} = { '': this.rootFolder }

		// Créer les dossiers (triés par profondeur pour que les parents existent d'abord)
		const sortedFolders = [...data.folders].sort((a, b) => a.split('/').length - b.split('/').length)
		for (const folderPath of sortedFolders) {
			const id = nextId++
			const name = folderPath.includes('/') ? folderPath.substring(folderPath.lastIndexOf('/') + 1) : folderPath
			const parentPath = folderPath.includes('/') ? folderPath.substring(0, folderPath.lastIndexOf('/')) : ''
			const parent = folderByPath[parentPath] || this.rootFolder

			const folder = new Folder(id, name, parent.id)
			folder.expanded = localStorage.getItem('editor/folder/' + folderPath) === 'true'
			folder.closed = localStorage.getItem('editor/folder/closed/' + folderPath) === 'true'
			folder.items = []
			parent.items.push(folder)

			this.folderById[id] = folder
			folderByPath[folderPath] = folder
		}

		// Créer les AIs depuis les fichiers
		for (const file of data.files) {
			const name = file.path.includes('/') ? file.path.substring(file.path.lastIndexOf('/') + 1) : file.path
			const folderPath = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : ''
			const folder = folderByPath[folderPath] || this.rootFolder

			const ai = new AI({
				name,
				path: file.path,
				folder: folder.id,
				mtime: file.mtime || 0,
				valid: file.valid,
				version: file.version,
				strict: file.strict,
				entrypoint: file.entrypoint,
				total_lines: file.total_lines,
				total_chars: file.total_chars,
				scenario: file.scenario,
			})
			ai.folderpath = this.getFolderPath(folder)

			this.ais[ai.path] = ai

			this.items[ai.name] = ai
			folder.items.push(new AIItem(ai, folder.id))
		}
		this.aiCount = data.files.length

		// Bot AIs
		for (const botAi of this.botAIs) {
			this.ais[botAi.path] = botAi as any
		}

		// Corbeille
		this.bin = new Folder(-1, 'recycle_bin', 0)
		this.bin.items = []
		this.folderById[-1] = this.bin
		for (const binFile of data.bin) {
			const ai = new AI({
				name: binFile.path,
				path: '.trash/' + binFile.path,
				folder: -1,
				valid: binFile.valid,
				version: binFile.version,
			})
			this.ais[ai.path] = ai
			this.bin.items.push(new AIItem(ai, -1))
		}

		// leek_ais : map leek_id -> file_path
		this.leekAIs = {}
		for (const leekId in data.leek_ais) {
			this.leekAIs[parseInt(leekId)] = data.leek_ais[leekId]
		}

		// Trier tous les dossiers
		this.sortFolder(this.rootFolder)

			}

	/**
	 * Charge le code d'une AI depuis le filesystem.
	 * Utilise le mtime du fichier pour éviter les re-fetch inutiles.
	 */
	public load(ai: AI): Promise<AI> {
		const cachedMtime = parseInt(localStorage.getItem('ai/mtime/' + ai.path) || '0', 10)
		const cached = localStorage.getItem('ai/code/' + ai.path)

		// Cache hit : le mtime local correspond au mtime serveur
		if (cached !== null && cachedMtime > 0 && cachedMtime >= ai.mtime) {
			ai.code = cached
			if (!ai.functions.length) { ai.analyze() }
			return Promise.resolve(ai)
		}

		return new Promise<AI>((resolve, reject) => {
			LeekWars.post('ai/read', { path: ai.path }).then((data: any) => {
				ai.code = data.code
				ai.mtime = data.mtime || Date.now()
				localStorage.setItem('ai/code/' + ai.path, ai.code)
				localStorage.setItem('ai/mtime/' + ai.path, '' + ai.mtime)
				ai.analyze()
				resolve(ai)
			}).error(reject)
		})
	}

	/**
	 * Retrouve une AI depuis un paramètre de route.
	 */
	public getAIFromRoute(routeId: string): AI | undefined {
		return this.ais[routeId]
	}

	/**
	 * Ajoute une nouvelle IA dans le filesystem
	 */
	public add_ai(ai: AI, folder: Folder) {
		ai.path = this.getAIFullPath(ai)
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		this.ais[ai.path] = ai
		folder.items.push(new AIItem(ai, folder.id))
		this.sortFolder(folder)

	}

	public add_folder(folder: Folder, parent: Folder) {
		this.folderById[folder.id] = folder
		parent.items.push(folder)
		this.sortFolder(parent)
	}

	public getAIByPath(path: string) {
		if (path.includes(FileSystem.CONSOLE_MAGIC_KEY)) {
			return this.consoleAI!
		}
		return this.ais[path] || this.ais['/' + path]
	}

	public find(path: string, folder: number): AI | null {
		path = path.trim()
		if (path[0] === '/') {
			const sub = path.substring(1)
			return this.find(sub, this.rootFolder.id)
		}
		if (!(folder in this.folderById)) { return null }
			const f = this.folderById[folder]
			if (path.indexOf('/') === -1) {
			for (const item of f.items) {
				if (!item.folder && item.name === path) {
					return (item as AIItem).ai
				}
			}
		} else {
			const i = path.indexOf('/')
			const first = path.substring(0, i)
			const rest = path.substring(i + 1)
			if (first === '..') {
				return this.find(rest, f.parent)
			} else if (first === '.') {
				return this.find(rest, f.id)
			}
			for (const item of f.items) {
				if (item.folder && item.name === first) {
					return this.find(rest, (item as Folder).id)
				}
			}
		}
		return null
	}

	public deleteAI(ai: AI) {
		const oldPath = ai.path
		const folder = this.folderById[ai.folder]
		const item = folder.items.splice(folder.items.findIndex((i) => !i.folder && (i as AIItem).ai === ai), 1)
		delete this.ais[oldPath]
		ai.folder = -1
		ai.path = '.trash/' + ai.name
		this.bin.items.push(...item)
		this.sortFolder(this.bin)
		LeekWars.delete('ai/delete', {path: oldPath}).then((data: any) => {
			if (data.trash_name && data.trash_name !== ai.name) {
				delete this.ais[ai.path]
				ai.name = data.trash_name
				ai.path = '.trash/' + ai.name
				this.ais[ai.path] = ai
				item[0].name = ai.name
				this.sortFolder(this.bin)
			}
		}).error((error: any) => LeekWars.toast(translateFileSystemError(error)))
		emitter.emit('reanalyze')
	}

	public destroyAI(ai: AI) {
		const folder = this.folderById[ai.folder]
		folder.items.splice(folder.items.findIndex((i) => !i.folder && (i as AIItem).ai === ai), 1)
		delete this.ais[ai.path]
		LeekWars.delete('ai/destroy', {trash_name: ai.name}).error(error => LeekWars.toast(error))
	}

	public emptyBin() {
		this.cleanBinRefs(this.bin)
		this.bin.items = []
		LeekWars.delete('ai/bin').error(error => LeekWars.toast(error))
	}

	private cleanBinRefs(folder: Folder) {
		for (const item of folder.items) {
			if (item.folder) {
				this.cleanBinRefs(item as Folder)
				delete this.folderById[(item as Folder).id]
			} else {
				const ai = (item as AIItem).ai
				delete this.ais[ai.path]
			}
		}
	}

	public restore(ai: AI) {
		const trashName = ai.name
		const item = this.bin.items.splice(this.bin.items.findIndex((i) => !i.folder && (i as AIItem).ai === ai), 1)
		ai.folder = 0
		ai.path = ai.name
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		this.ais[ai.path] = ai
		this.rootFolder.items.push(...item)
		this.sortFolder(this.rootFolder)
		LeekWars.post('ai/restore', {trash_name: trashName}).error((error: any) => LeekWars.toast(translateFileSystemError(error)))
	}

	public restoreFolder(folder: Folder) {
		LeekWars.post('ai-folder/restore', { trash_name: folder.name }).then(() => {
			this.reload()
		}).error((error: any) => LeekWars.toast(translateFileSystemError(error)))
	}

	public destroyFolder(folder: Folder) {
		const parent = this.folderById[folder.parent]
		parent.items.splice(parent.items.indexOf(folder), 1)
		this.cleanBinRefs(folder)
		delete this.folderById[folder.id]
		this.destroyFolderContents(folder)
	}

	private destroyFolderContents(folder: Folder) {
		for (const item of folder.items) {
			if (item.folder) {
				this.destroyFolderContents(item as Folder)
			} else {
				const ai = (item as AIItem).ai
				LeekWars.delete('ai/destroy', {trash_name: ai.name}).error((error: any) => LeekWars.toast(error))
			}
		}
	}

	public deleteFolder(folder: Folder) {
		const folderPath = this.getFolderPath(folder).replace(/\/$/, '')
		const parent = this.folderById[folder.parent]
		parent.items.splice(parent.items.indexOf(folder), 1)
		this.cleanFolderRefs(folder)
		folder.parent = this.bin.id
		this.bin.items.push(folder)
		this.sortFolder(this.bin)
		LeekWars.delete('ai-folder/delete', {path: folderPath}).error((error: any) => LeekWars.toast(translateFileSystemError(error)))
		emitter.emit('reanalyze')
	}

	private cleanFolderRefs(folder: Folder) {
		for (const item of folder.items) {
			if (item.folder) {
				this.cleanFolderRefs(item as Folder)
			} else {
				const ai = (item as AIItem).ai
				delete this.ais[ai.path]
			}
		}
	}

	public sortFolder(folder: Folder) {
		folder.items.sort((a, b) => {
			if (a.folder !== b.folder) return a.folder ? -1 : 1
			return a.name.localeCompare(b.name)
		})
	}

	public isInBin(folderId: number): boolean {
		if (folderId === -1) return true
		if (folderId === 0) return false
		const folder = this.folderById[folderId]
		if (!folder) return false
		return this.isInBin(folder.parent)
	}

	public renameAI(ai: AI, name: string) {
		delete this.ais[ai.path]
		ai.name = name
		ai.path = this.getAIFullPath(ai)
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		this.ais[ai.path] = ai
	}

	public clear() {
		this.ais = {}
		this.folderById = {}
		this.leekAIs = {}
		this.items = {}
			}

	private getAIFullPath(ai: AI) {
		if (this.isInBin(ai.folder)) {
			return '.trash/' + ai.name
		}
		if (ai.folder !== 0 && ai.folder in this.folderById) {
			return this.getFolderPath(this.folderById[ai.folder]) + ai.name
		}
		return ai.name
	}

	/**
	 * Recharge tout le filesystem depuis le serveur.
	 * À utiliser après les opérations git lourdes (branch switch, pull, revert).
	 */
	public reload(): Promise<void> {
		return new Promise((resolve) => {
			LeekWars.get('ai/get-farmer-tree').then((data: any) => {
				// Préserver code + model des AI existantes pour éviter un flash vide
				const preserved: {[path: string]: { code: string, model: any, modified: boolean }} = {}
				for (const path in this.ais) {
					const ai = this.ais[path]
					if (ai.code !== undefined && ai.code !== null) {
						preserved[path] = { code: ai.code, model: ai.model, modified: ai.modified }
					}
				}
				this.clear()
				this.init(data)
				for (const path in preserved) {
					if (path in this.ais) {
						this.ais[path].code = preserved[path].code
						this.ais[path].model = preserved[path].model
						this.ais[path].modified = preserved[path].modified
					}
				}
				resolve()
			})
		})
	}

	/**
	 * Invalide le cache et recharge le code des fichiers modifiés par une opération git.
	 * @param repoFolder Dossier du repo git (ex: "ia")
	 * @param changedFiles Liste de fichiers relatifs au repo (ex: ["main.leek", "utils/move.leek"])
	 */
	public reloadChangedFiles(repoFolder: string, changedFiles: string[]): Promise<void[]> {
		const promises: Promise<void>[] = []
		for (const file of changedFiles) {
			const fullPath = (repoFolder ? repoFolder + '/' : '') + file
			const ai = this.getAIByPath(fullPath)
			if (!ai) continue
			localStorage.removeItem('ai/mtime/' + ai.path)
			localStorage.removeItem('ai/code/' + ai.path)
			promises.push(this.load(ai).then(() => {
				emitter.emit('file-reloaded', ai.path)
			}))
		}
		return Promise.all(promises)
	}

	public getFolderPath(folder: Folder): string {
		if (!folder) { return "##folder_error##" }
		if (folder.parent !== 0) {
			return this.getFolderPath(this.folderById[folder.parent]) + folder.name + '/'
		}
		return folder.name + '/'
	}
}

const fileSystem = reactive(new FileSystem())

export { fileSystem, FileSystem, translateFileSystemError }
