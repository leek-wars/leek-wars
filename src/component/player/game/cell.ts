class Cell {
	public x: number
	public y: number
	constructor(x: number, y: number) {
		this.x = x
		this.y = y
	}
}
class Position {
	public x!: number
	public y!: number
}
export { Cell, Position }
