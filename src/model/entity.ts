import { Cell } from './cell'

class Entity {
	public id!: number
	public name = ""
	public translatedName!: string
	public level = 1
	public team!: number
	public cell: Cell | null = null
}

export { Entity }