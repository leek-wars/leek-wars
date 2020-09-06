import { Entity } from './entity'

class Cell {
	public readonly id: number
	public readonly x: number
	public readonly y: number
	public obstacle: boolean = false
	public entity: Entity | null = null

	constructor(id: number, x: number, y: number) {
		this.id = id
		this.x = x
		this.y = y
	}
}

export { Cell }