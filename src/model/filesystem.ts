import { AIItem, Folder } from '@/component/editor/editor-item'
import { AI } from '@/model/ai'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'

import { Farmer } from './farmer'
import { Keyword } from './keyword'
import { reactive } from 'vue'

class FileSystem {

	public static CONSOLE_MAGIC_KEY = '__console_CkG3VwGs3K__'

	public ais: {[key: number]: AI} = {}
	public folderById: {[key: number]: Folder} = {}
	public aiByFullPath: {[key: string]: AI} = {}
	public aiCount: number = 0
	public rootFolder!: Folder
	public bin!: Folder
	private initialized: boolean = false
	public leekAIs: {[key: number]: number} = {} // Used in test dialog
	private items: {[key: string]: AI | Folder} = {}
	private promise: Promise<void> | null = null
	public symbols: { [key: string]: Keyword } = {}
	// Git: map de chemin relatif (ex: "Combat/main") -> statut git ('M', 'A', 'D', '?')
	public gitStatus: {[path: string]: string} = {}
	// Git: map des chemins de dossiers qui sont des repos git
	public gitRepos: {[path: string]: boolean} = {}
	private botAIs = [
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

	public init(farmer: Farmer) {
		const folders: {[key: number]: any} = {}
		for (const folder of farmer.folders) {
			folders[folder.id] = folder
			this.items[folder.name] = folder
		}
		for (const id in farmer.ais) {
			farmer.ais[id] = new AI(farmer.ais[id])
		}
		this.leekAIs = farmer.leek_ais
		this.aiCount = farmer.ais.length
		const buildFolder = (id: number, parent: number): Folder => {
			const folder = new Folder(id, id in folders ? folders[id].name : '<root>', parent)
			if (id === 0) {
				folder.expanded = true
			} else {
				folder.expanded = localStorage.getItem('editor/folder/' + id) === 'true'
			}
			folder.closed = localStorage.getItem('editor/folder/closed/' + id) === 'true'
			folder.items = farmer.folders
				.filter((f: any) => f.folder === id)
				.map((f: any) => buildFolder(f.id, folder.id))
			folder.items.push(...(farmer.ais
				.filter((ai: any) => ai.folder === id)
				.map((ai: any) => new AIItem(ai, folder.id))
			))
			this.folderById[folder.id] = folder
			return folder
		}
		this.rootFolder = buildFolder(0, 0)
		for (const ai of farmer.ais) {
			ai.path = this.getAIFullPath(ai)
			ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
			this.ais['' + ai.id] = ai
			this.aiByFullPath[ai.path] = ai
			this.items[ai.name] = ai
		}
		// Add bot AIs
		for (const ai of this.botAIs) {
			this.ais['' + ai.id] = ai
		}
		this.bin = new Folder(-1, 'recycle_bin', 0)
		this.bin.items = []
		this.folderById[-1] = this.bin
		// Convertir les AIs de la corbeille en objets AI
		const binAIs: AI[] = []
		for (const id in farmer.bin) {
			farmer.bin[id] = new AI(farmer.bin[id])
			const ai = farmer.bin[id]
			binAIs.push(ai)
			this.ais['' + ai.id] = ai
			this.items[ai.name] = ai
			ai.path = this.getAIFullPath(ai)
		}
		// Construire les dossiers supprimés dans la corbeille
		if (farmer.bin_folders && farmer.bin_folders.length) {
			const binFolderData: {[key: number]: any} = {}
			for (const f of farmer.bin_folders) {
				binFolderData[f.id] = f
			}
			const buildBinFolder = (id: number, parent: number): Folder => {
				const folder = new Folder(id, binFolderData[id].name, parent)
				folder.items = farmer.bin_folders
					.filter((f: any) => f.folder === id)
					.map((f: any) => buildBinFolder(f.id, folder.id))
				folder.items.push(...binAIs
					.filter((ai: AI) => ai.folder === id)
					.map((ai: AI) => new AIItem(ai, folder.id))
				)
				this.folderById[folder.id] = folder
				return folder
			}
			for (const f of farmer.bin_folders) {
				if (f.folder === -1) {
					this.bin.items.push(buildBinFolder(f.id, this.bin.id))
				}
			}
		}
		// AIs individuellement supprimées (folder === -1, pas dans un dossier)
		for (const ai of binAIs) {
			if (ai.folder === -1) {
				this.bin.items.push(new AIItem(ai, this.bin.id))
			}
		}
		this.folderById[-1] = this.bin
		this.initialized = true
	}

	public load(ai: AI): Promise<AI> {

		const dependencies_set = new Set<number>()
		dependencies_set.add(ai.id)
		if (ai.entrypoint) {
			for (const id of ai.includes_ids) { dependencies_set.add(id) }
		}
		if (ai.entrypoints) {
			for (const entrypoint of ai.entrypoints) {
				dependencies_set.add(entrypoint)
				if (fileSystem.ais[entrypoint]) {
					for (const id of fileSystem.ais[entrypoint].includes_ids) { dependencies_set.add(id) }
				}
			}
		}
		const dependencies_timestamps = {} as {[key: number]: number}
		const new_ais = new Set<AI>()
		for (const id of dependencies_set) {
			const ai = fileSystem.ais[id]
			if (ai) {
				const timestamp = parseInt(localStorage.getItem('ai/time/' + ai.id) || '0', 10)
				if (ai.timestamp === 0 || ai.timestamp !== timestamp) {
					ai.timestamp = timestamp
					ai.code = localStorage.getItem('ai/code/' + ai.id)
					dependencies_timestamps[id] = timestamp
					new_ais.add(ai)
				}
			}
		}
		// console.log("timestamps", dependencies_timestamps)

		if (Object.keys(dependencies_timestamps).length) {

			return new Promise<AI>((resolve, reject) => {

				LeekWars.post<{id: number, modified: number, code: string}[]>('ai/sync', {ais: JSON.stringify(dependencies_timestamps)}).then(result => {

					for (const entry of result) { // Nouveaux timestamp, on met à jour
						const ai = fileSystem.ais[entry.id]
						if (ai) {
							ai.code = entry.code
							ai.timestamp = entry.modified
							localStorage.setItem('ai/time/' + ai.id, '' + entry.modified)
							localStorage.setItem('ai/code/' + ai.id, '' + entry.code)
						}
					}
					// console.time('analyze')
					for (const a of new_ais) {
						a.analyze()
					}
					// console.timeEnd('analyze')
					resolve(ai)

				}).error(reject)
			})
		} else {
			return Promise.resolve(ai)
		}
	}

	/**
	 * Ajoute une nouvelle IA dans le filesystem
	 */
	public add_ai(ai: AI, folder: Folder) {
		ai.path = this.getAIFullPath(ai)
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		this.ais[ai.id] = ai
		this.aiByFullPath[ai.path] = ai
		folder.items.push(new AIItem(ai, folder.id))
		this.sortFolder(folder)
		store.commit('add-ai', ai)
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
		return this.aiByFullPath[path] || this.aiByFullPath['/' + path]
	}

	public find(path: string, folder: number): AI | null {
		// console.log("find", path, folder)
		path = path.trim()
		if (path[0] === '/') { // From root
			const sub = path.substring(1)
			return this.find(sub, this.rootFolder.id)
		}
		if (!(folder in this.folderById)) { return null }
			const f = this.folderById[folder]
			if (path.indexOf('/') === -1) { // Find an AI
			for (const item of f.items) {
				if (!item.folder && item.name === path) {
					return (item as AIItem).ai
				}
			}
		} else { // Find another path
			const i = path.indexOf('/')
			const first = path.substring(0, i)
			const rest = path.substring(i + 1)
			// console.log("first", first, "rest", rest)
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
		const folder = this.folderById[ai.folder]
		const item = folder.items.splice(folder.items.findIndex((i) => !i.folder && (i as AIItem).ai === ai), 1)
		delete this.aiByFullPath[ai.path]
		store.commit('delete-ai', ai.id)
		ai.folder = -1
		ai.path = this.getAIFullPath(ai)
		this.bin.items.push(...item)
		this.sortFolder(this.bin)
		LeekWars.delete('ai/delete', {ai_id: ai.id}).then((data: any) => {
			if (data.name && data.name !== ai.name) {
				delete this.aiByFullPath[ai.path]
				ai.name = data.name
				item[0].name = data.name
				ai.path = this.getAIFullPath(ai)
				this.aiByFullPath[ai.path] = ai
				this.sortFolder(this.bin)
			}
		}).error(error => LeekWars.toast(error.error || error))
	}

	public destroyAI(ai: AI) {
		const folder = this.folderById[ai.folder]
		folder.items.splice(folder.items.findIndex((i) => !i.folder && (i as AIItem).ai === ai), 1)
		delete this.ais['' + ai.id]
		delete this.aiByFullPath[ai.path]
		LeekWars.delete('ai/destroy', {ai_id: ai.id}).error(error => LeekWars.toast(error))
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
				delete this.ais['' + (item as AIItem).ai.id]
				delete this.aiByFullPath[(item as AIItem).ai.path]
			}
		}
	}

	public restore(ai: AI) {
		const item = this.bin.items.splice(this.bin.items.findIndex((i) => !i.folder && (i as AIItem).ai === ai), 1)
		ai.folder = 0
		ai.path = this.getAIFullPath(ai)
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		this.ais['' + ai.id] = ai
		this.aiByFullPath[ai.path] = ai
		this.rootFolder.items.push(...item)
		this.sortFolder(this.rootFolder)
		LeekWars.post('ai/restore', {ai_id: ai.id}).error(error => LeekWars.toast(error.error || error))
	}

	public restoreFolder(folder: Folder) {
		const parent = this.folderById[folder.parent]
		if (!parent) return
		const idx = parent.items.indexOf(folder)
		if (idx === -1) return
		parent.items.splice(idx, 1)
		folder.parent = this.rootFolder.id
		this.rootFolder.items.push(folder)
		this.sortFolder(this.rootFolder)
		this.registerFolderAIs(folder)
		LeekWars.post('ai-folder/restore', {folder_id: folder.id}).error(error => LeekWars.toast(error.error || error))
	}

	private registerFolderAIs(folder: Folder) {
		for (const item of folder.items) {
			if (item.folder) {
				this.registerFolderAIs(item as Folder)
			} else {
				const ai = (item as AIItem).ai
				ai.path = this.getAIFullPath(ai)
				ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
				this.aiByFullPath[ai.path] = ai
				store.commit('add-ai', ai)
			}
		}
	}

	public destroyFolder(folder: Folder) {
		// Retirer le dossier de la corbeille
		const parent = this.folderById[folder.parent]
		parent.items.splice(parent.items.indexOf(folder), 1)
		// Nettoyer les références
		this.cleanBinRefs(folder)
		delete this.folderById[folder.id]
		// Pas d'endpoint dédié : les AIs individuelles seront détruites par emptyBin
		// Pour l'instant, on vide le dossier et détruit les AIs une par une
		this.destroyFolderContents(folder)
	}

	private destroyFolderContents(folder: Folder) {
		for (const item of folder.items) {
			if (item.folder) {
				this.destroyFolderContents(item as Folder)
			} else {
				const ai = (item as AIItem).ai
				LeekWars.delete('ai/destroy', {ai_id: ai.id}).error(error => LeekWars.toast(error))
			}
		}
	}

	public deleteFolder(folder: Folder) {
		const parent = this.folderById[folder.parent]
		parent.items.splice(parent.items.indexOf(folder), 1)
		this.cleanFolderRefs(folder)
		folder.parent = this.bin.id
		this.bin.items.push(folder)
		this.sortFolder(this.bin)
		LeekWars.delete('ai-folder/delete', {folder_id: folder.id}).then((data: any) => {
			if (data.name && data.name !== folder.name) {
				folder.name = data.name
				this.sortFolder(this.bin)
			}
		}).error(error => LeekWars.toast(error.error || error))
	}

	private cleanFolderRefs(folder: Folder) {
		for (const item of folder.items) {
			if (item.folder) {
				this.cleanFolderRefs(item as Folder)
			} else {
				const ai = (item as AIItem).ai
				delete this.aiByFullPath[ai.path]
				store.commit('delete-ai', ai.id)
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
		ai.name = name
		delete this.aiByFullPath[ai.path]
		ai.path = this.getAIFullPath(ai)
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		this.aiByFullPath[ai.path] = ai
	}

	public clear() {
		this.ais = {}
		this.folderById = {}
		this.aiByFullPath = {}
		this.leekAIs = {}
		this.items = {}
		this.promise = null
		this.initialized = false
	}

	private getAIFullPath(ai: AI) {
		if (this.isInBin(ai.folder)) {
			return '.trash/' + ai.id + '/' + ai.name
		}
		if (ai.folder !== 0 && ai.folder in this.folderById) {
			return this.getFolderPath(this.folderById[ai.folder]) + ai.name
		}
		return ai.name
	}

	public getFolderPath(folder: Folder): string {
		// TODO temporary fix
		if (!folder) { return "##folder_error##" }
		if (folder.parent !== 0) {
			return this.getFolderPath(this.folderById[folder.parent]) + folder.name + '/'
		}
		return folder.name + '/'
	}
}

const fileSystem = reactive(new FileSystem())

export { fileSystem, FileSystem }