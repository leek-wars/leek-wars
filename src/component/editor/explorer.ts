import Vue from 'vue'
import { Folder } from './editor-item'
import { AI } from '@/model/ai'
import { fileSystem } from '@/model/filesystem'

class Explorer {

    public selectedAI!: AI
    public selectedFolder!: Folder

    public selectAI(ai: AI) {
        // console.log("select ai", ai)
        if (this.selectedAI) {
            this.selectedAI.selected = false
            this.selectedFolder.selected = false
        }
        this.selectedAI = ai
        Vue.set(ai, "selected", true)
        const folder = fileSystem.folderById[this.selectedAI.folder]
        this.selectFolder(folder)
        this.setExpanded(folder, true)
    }

    public selectFolder(folder: Folder) {
        // console.log("select folder", folder, folder.expanded)
        if (this.selectedFolder) {
            this.selectedFolder.selected = false
        }
        this.selectedFolder = folder
        this.selectedFolder.selected = true

        let current = fileSystem.folderById[this.selectedFolder.parent] as Folder | null
        while (current) {
            current.expanded = true
            current = current.id === 0 ? null : fileSystem.folderById[current.parent]
        }
    }

	public setExpanded(folder: Folder, expanded: boolean) {
        // console.log("folder", folder.name, "expanded", expanded)
        Vue.set(folder, 'expanded', expanded)
        localStorage.setItem('editor/folder/' + folder.id, '' + folder.expanded)
    }
}

const explorer = new Explorer()

export { Explorer, explorer }