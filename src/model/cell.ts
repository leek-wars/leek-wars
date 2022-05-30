import { Game } from '@/component/player/game/game'
import { Entity } from './entity'

class Cell {
	public readonly id: number
	public readonly x: number
	public readonly y: number
	public obstacle: boolean = false
	public entity: Entity | null = null
	public color: boolean = false

	constructor(id: number, x: number, y: number) {
		this.id = id
		this.x = x
		this.y = y
	}

	public setEntity(entity: Entity | null) {
		if (entity === null) {
			this.entity = null
			return
		}
		if (this.entity === entity) {
			entity.cell = this
			return
		}
		if (this.entity) {
			this.entity.cell = null
		}
		if (entity.cell) {
			entity.cell.setEntity(null)
		}
		entity.cell = this
		this.entity = entity
	}

	public angle(game: Game, cell: Cell) {
		const pos1 = game.ground.field.cellToXY(this)
		const pos2 = game.ground.field.cellToXY(cell)
		const dx = (pos1.x - pos2.x)
		const dy = (pos1.y - pos2.y)
		return Math.atan2(dy, dx)
	}
}

export { Cell }