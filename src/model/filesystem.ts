import { LeekWars } from '@/model/leekwars'
import { AI } from '@/model/ai'
import Vue from 'vue'
import { store } from '@/model/store'
import { Folder, AIItem } from '@/component/editor/editor-item'

class FileSystem {

    public ais: {[key: number]: AI} = {}
    private initialized: boolean = false
    private items: {[key: string]: AI | Folder} = {}
    public folderById: {[key: number]: Folder} = {}
    public aiByFullPath: {[key: string]: AI} = {}
    private leekAIs: any = {}
    private rootFolder!: Folder
    private promise!: Promise<void>

    public aiCount: number = 0

    public async init() {
        if (this.initialized) { return Promise.resolve() }
        if (this.promise) { return this.promise }

		return this.promise = new Promise((resolve, reject) => {
			LeekWars.get<{ais: AI[], folders: any[], leek_ais: {[key: number]: number}}>('ai/get-farmer-ais').then(data => {
				const folders: {[key: number]: any} = {}
				for (const folder of data.folders) {
					folders[folder.id] = folder
					this.items[folder.name] = folder
				}
				this.leekAIs = data.leek_ais
				this.aiCount = LeekWars.objectSize(data.ais)
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
                    Vue.set(this.aiByFullPath, ai.path, ai)
					this.items[ai.name] = ai
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
        Vue.set(this.ais, ai.id, ai)
        folder.items.push(new AIItem(ai, folder))
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
                return this.find(rest, f.parent.id)
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

    private getAIFullPath(ai: AI) {
        if (ai.folder > 0 && ai.folder in this.folderById) {
            return this.getFolderPath(this.folderById[ai.folder]) + ai.name
        }
        return ai.name
    }

    private getFolderPath(folder: Folder): string {
        if (folder.parent && folder.parent.id !== 0) {
            return this.getFolderPath(folder.parent) + folder.name + '/'
        }
        return folder.name + '/'
    }
}

const fileSystem = new FileSystem()

export { fileSystem, FileSystem }