import { AI } from '@/model/ai'

class Item {
	public name!: string
	public folder: boolean = false
	public parent!: number
	constructor(parent: number) {
		this.parent = parent
	}
}

class AIItem extends Item {
	public ai!: AI
	constructor(ai: AI, parent: number) {
		super(parent)
		this.ai = ai
		this.name = ai.name
	}
}

class Folder extends Item {
	public id: number
	public items!: Item[]
	public expanded: boolean = false
	public selected: boolean = false
	public errors: number = 0
	public warnings: number = 0
	constructor(id: number, name: string, parent: number) {
		super(parent)
		this.id = id
		this.name = name
		this.folder = true
	}
}

export { Item, AIItem, Folder }
