import { AI } from '@/model/ai'

class Item {
	public name!: string
	public folder: boolean = false
	public parent!: Folder
	constructor(parent: Folder) {
		this.parent = parent
	}
}
class AIItem extends Item {
	public ai!: AI
	constructor(ai: AI, parent: Folder) {
		super(parent)
		this.ai = ai
		this.name = ai.name
	}
}
class Folder extends Item {
	public id: number
	public items!: Item[]
	public expanded: boolean = false
	constructor(id: number, name: string, parent: Folder) {
		super(parent)
		this.id = id
		this.name = name
		this.folder = true
	}
}
export { Item, AIItem, Folder }
