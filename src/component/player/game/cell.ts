import { Game } from './game'

class Cell {
	public x: number
	public y: number
	constructor(x: number, y: number) {
		this.x = x
		this.y = y
	}
	public getXY(game: Game) {
		return {
			x: (this.x - game.ground.realTileSizeX / 2) / (game.ground.realTileSizeX / 2),
			y: (this.y - game.ground.realTileSizeY / 2) / (game.ground.realTileSizeY / 2)
		}
	}
}
class Position {
	public x!: number
	public y!: number
}
export { Cell, Position }
