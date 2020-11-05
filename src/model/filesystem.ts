import { AIItem, Folder } from '@/component/editor/editor-item'
import { AI } from '@/model/ai'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import Vue from 'vue'

class FileSystem {

	public ais: {[key: number]: AI} = {}
	public folderById: {[key: number]: Folder} = {}
	public aiByFullPath: {[key: string]: AI} = {}
	public aiCount: number = 0
	private initialized: boolean = false
	private leekAIs: any = {}
	private items: {[key: string]: AI | Folder} = {}
	private rootFolder!: Folder
	private promise!: Promise<void>
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

	public init() {
		if (this.initialized) { return Promise.resolve() }
		if (this.promise) { return this.promise }

		return this.promise = new Promise((resolve, reject) => {
			LeekWars.get<{ais: AI[], folders: any[], leek_ais: {[key: number]: number}}>('ai/get-farmer-ais').then(data => {
				const folders: {[key: number]: any} = {}
				for (const folder of data.folders) {
					folders[folder.id] = folder
					this.items[folder.name] = folder
				}
				for (const id in data.ais) {
					data.ais[id] = new AI(data.ais[id])
				}
				this.leekAIs = data.leek_ais
				this.aiCount = LeekWars.objectSize(data.ais)
				const buildFolder = (id: number, parent: number): Folder => {
					const folder = new Folder(id, id in folders ? folders[id].name : '<root>', parent)
					if (id === 0) {
						folder.expanded = true
					} else {
						folder.expanded = localStorage.getItem('editor/folder/' + id) === 'true'
					}
					folder.items = data.folders
						.filter((f: any) => f.folder === id)
						.map((f: any) => buildFolder(f.id, folder.id))
					folder.items.push(...(data.ais
						.filter((ai: any) => ai.folder === id)
						.map((ai: any) => new AIItem(ai, folder.id))
					))
					Vue.set(this.folderById, folder.id, folder)
					return folder
				}
				this.rootFolder = buildFolder(0, 0)
				for (const ai of data.ais) {
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
				this.initialized = true
				resolve()
			})
		})
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
		folder.items.splice(folder.items.findIndex((i) => !i.folder && (i as AIItem).ai === ai), 1)
		Vue.delete(this.ais, '' + ai.id)
		store.commit('delete-ai', ai.id)
		LeekWars.delete('ai/delete', {ai_id: ai.id}).error(error => LeekWars.toast(error))

		LeekWars.analyzer.delete(ai)
	}

	public deleteFolder(folder: Folder) {
		const parent = this.folderById[folder.parent]
		parent.items.splice(parent.items.indexOf(folder), 1)
		LeekWars.delete('ai-folder/delete', {folder_id: folder.id}).error(error => LeekWars.toast(error))
	}

	public renameAI(ai: AI, name: string) {
		ai.name = name
		Vue.delete(this.aiByFullPath, ai.path)
		ai.path = this.getAIFullPath(ai)
		ai.folderpath = this.getFolderPath(this.folderById[ai.folder])
		Vue.set(this.aiByFullPath, ai.path, ai)
	}

	private getAIFullPath(ai: AI) {
		if (ai.folder > 0 && ai.folder in this.folderById) {
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