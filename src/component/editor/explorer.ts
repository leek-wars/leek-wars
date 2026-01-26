import { AI } from '@/model/ai'
import { fileSystem } from '@/model/filesystem'

import { Folder } from './editor-item'

class Explorer {

	public selectedAI!: AI
	public selectedFolder!: Folder

	public selectAI(ai: AI) {
		// console.log("select ai", ai)
		if (this.selectedAI) {
			this.selectedAI.selected = false
			if (this.selectedFolder) {
				this.selectedFolder.selected = false
			}
		}
		this.selectedAI = ai
		ai.selected = true
		const folder = fileSystem.folderById[this.selectedAI.folder]
		if (folder) {
			this.selectFolder(folder)
			this.setExpanded(folder, true)
		}
	}

	public selectFolder(folder: Folder) {
		// console.log("select folder", folder)
		if (this.selectedFolder) {
			this.selectedFolder.selected = false
		}
		if (folder) {
			this.selectedFolder = folder
			this.selectedFolder.selected = true

			let current = fileSystem.folderById[this.selectedFolder.parent] as Folder | null
			while (current) {
				current.expanded = true
				current = current.id === 0 ? null : fileSystem.folderById[current.parent]
			}
		}
	}

	public setExpanded(folder: Folder, expanded: boolean) {
		// console.log("folder", folder.name, "expanded", expanded)
		folder.expanded = expanded
		localStorage.setItem('editor/folder/' + folder.id, '' + folder.expanded)
	}

	public setClosed(folder: Folder, closed: boolean) {
		// console.log("folder", folder.name, "expanded", expanded)
		folder.closed = closed
		localStorage.setItem('editor/folder/closed/' + folder.id, '' + folder.closed)
	}
}

const explorer = new Explorer()

export { Explorer, explorer }