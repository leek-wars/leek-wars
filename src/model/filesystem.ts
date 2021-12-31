import { AIItem, Folder } from '@/component/editor/editor-item'
import { AI } from '@/model/ai'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import Vue from 'vue'
import { Farmer } from './farmer'

class FileSystem {

	public ais: {[key: number]: AI} = {}
	public folderById: {[key: number]: Folder} = {}
	public aiByFullPath: {[key: string]: AI} = {}
	public aiCount: number = 0
	public rootFolder!: Folder
	public bin!: Folder
	private initialized: boolean = false
	private leekAIs: any = {} // Used in test dialog
	private items: {[key: string]: AI | Folder} = {}
	private promise: Promise<void> | null = null
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
			folder.items = farmer.folders
				.filter((f: any) => f.folder === id)
				.map((f: any) => buildFolder(f.id, folder.id))
			folder.items.push(...(farmer.ais
				.filter((ai: any) => ai.folder === id)
				.map((ai: any) => new AIItem(ai, folder.id))
			))
			Vue.set(this.folderById, folder.id, folder)
			return folder
		}
		this.rootFolder = buildFolder(0, 0)
		for (const ai of farmer.ais) {
			ai.path = this.getAIFullPath(ai)
			ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
			Vue.set(this.ais, '' + ai.id, ai)
			Vue.set(this.aiByFullPath, ai.path, ai)
			this.items[ai.name] = ai
		}
		// Add bot AIs
		for (const ai of this.botAIs) {
			Vue.set(this.ais, '' + ai.id, ai)
		}
		this.bin = new Folder(-1, 'recycle_bin', 0)
		this.bin.items = []
		Vue.set(this.folderById, -1, this.bin)
		for (const id in farmer.bin) {
			farmer.bin[id] = new AI(farmer.bin[id])
			const ai = farmer.bin[id]
			this.bin.items.push(new AIItem(ai, this.bin.id))
			ai.path = this.getAIFullPath(ai)
			ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
			Vue.set(this.aiByFullPath, ai.path, ai)
			Vue.set(this.ais, '' + ai.id, ai)
			this.items[ai.name] = ai
		}
		Vue.set(this.folderById, -1, this.bin)
		this.initialized = true
	}

	public load(ai: AI) {

		const dependencies_set = new Set<number>()
		dependencies_set.add(ai.id)
		if (ai.entrypoint) {
			for (const id of ai.includes_ids) { dependencies_set.add(id) }
		}
		for (const entrypoint of ai.entrypoints) {
			if (fileSystem.ais[entrypoint]) {
				for (const id of fileSystem.ais[entrypoint].includes_ids) { dependencies_set.add(id) }
			}
		}
		const dependencies_timestamps = {} as {[key: number]: number}
		const new_ais = new Set<AI>()
		for (const id of dependencies_set) {
			const ai = fileSystem.ais[id]
			if (ai) {
				const timestamp = parseInt(localStorage.getItem('ai/time/' + ai.id) || '0', 10)
				if (ai.timestamp === 0 || ai.timestamp !== timestamp) {
					Vue.set(ai, 'timestamp', timestamp)
					Vue.set(ai, 'code', localStorage.getItem('ai/code/' + ai.id))
					dependencies_timestamps[id] = timestamp
					new_ais.add(ai)
				}
			}
		}
		// console.log("timestamps", dependencies_timestamps)

		if (Object.keys(dependencies_timestamps).length) {

			return new Promise<void>((resolve, reject) => {
				LeekWars.post<{id: number, modified: number, code: string}[]>('ai/sync', {ais: JSON.stringify(dependencies_timestamps)}).then(result => {

					for (const entry of result) { // Nouveaux timestamp, on met à jour
						const ai = fileSystem.ais[entry.id]
						if (ai) {
							Vue.set(ai, 'code', entry.code)
							Vue.set(ai, 'timestamp', entry.modified)
							localStorage.setItem('ai/time/' + ai.id, '' + entry.modified)
							localStorage.setItem('ai/code/' + ai.id, '' + entry.code)
						}
					}
					// console.time('analyze')
					for (const ai of new_ais) {
						ai.analyze()
					}
					// console.timeEnd('analyze')
					resolve()

				}).error(reject)
			})
		} else {
			return Promise.resolve()
		}
	}

	/**
	 * Ajoute une nouvelle IA dans le filesystem
	 */
	public add_ai(ai: AI, folder: Folder) {
		ai.path = this.getAIFullPath(ai)
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		Vue.set(this.ais, ai.id, ai)
		Vue.set(this.aiByFullPath, ai.path, ai)
		folder.items.push(new AIItem(ai, folder.id))
		store.commit('add-ai', ai)
	}

	public add_folder(folder: Folder, parent: Folder) {
		this.folderById[folder.id] = folder
		parent.items.push(folder)
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
		Vue.delete(this.aiByFullPath, ai.path)
		store.commit('delete-ai', ai.id)
		LeekWars.delete('ai/delete', {ai_id: ai.id}).error(error => LeekWars.toast(error))
		LeekWars.analyzer.delete(ai)
		// Ajout dans la corbeille
		ai.folder = -1
		this.bin.items.push(...item)
	}

	public destroyAI(ai: AI) {
		const folder = this.folderById[ai.folder]
		folder.items.splice(folder.items.findIndex((i) => !i.folder && (i as AIItem).ai === ai), 1)
		Vue.delete(this.ais, '' + ai.id)
		Vue.delete(this.aiByFullPath, ai.path)
		LeekWars.delete('ai/destroy', {ai: ai.id}).error(error => LeekWars.toast(error))
	}

	public emptyBin() {
		for (const item of this.bin.items) {
			Vue.delete(this.ais, '' + (item as AIItem).ai.id)
			Vue.delete(this.aiByFullPath, (item as AIItem).ai.path)
		}
		this.bin.items = []
		LeekWars.delete('ai/bin').error(error => LeekWars.toast(error))
	}

	public restore(ai: AI) {
		// Remove from bin
		const item = this.bin.items.splice(this.bin.items.findIndex((i) => !i.folder && (i as AIItem).ai === ai), 1)
		ai.folder = 0 // Move to root folder
		ai.path = this.getAIFullPath(ai)
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		Vue.set(this.ais, '' + ai.id, ai)
		Vue.set(this.aiByFullPath, ai.path, ai)
		this.rootFolder.items.push(...item)
		LeekWars.delete('ai/restore', {ai: ai.id}).error(error => LeekWars.toast(error))
	}

	public deleteFolder(folder: Folder) {
		const parent = this.folderById[folder.parent]
		parent.items.splice(parent.items.indexOf(folder), 1)
		this.moveToTrash(folder)
		LeekWars.delete('ai-folder/delete', {folder_id: folder.id}).error(error => LeekWars.toast(error))
	}

	public moveToTrash(folder: Folder) {
		for (const item of folder.items) {
			if (item.folder) {
				this.moveToTrash(item as Folder)
			} else {
				const ai = (item as AIItem).ai
				Vue.delete(this.aiByFullPath, ai.path)
				store.commit('delete-ai', ai.id)
				ai.folder = -1
				this.bin.items.push(item)
			}
		}
	}

	public renameAI(ai: AI, name: string) {
		ai.name = name
		Vue.delete(this.aiByFullPath, ai.path)
		ai.path = this.getAIFullPath(ai)
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		Vue.set(this.aiByFullPath, ai.path, ai)
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
		if (ai.folder !== 0 && ai.folder in this.folderById) {
			return this.getFolderPath(this.folderById[ai.folder]) + ai.name
		}
		return ai.name
	}

	private getFolderPath(folder: Folder): string {
		// TODO temporary fix
		if (!folder) { return "##folder_error##" }
		if (folder.parent !== 0) {
			return this.getFolderPath(this.folderById[folder.parent]) + folder.name + '/'
		}
		return folder.name + '/'
	}
}

const fileSystem = new FileSystem()

export { fileSystem, FileSystem }