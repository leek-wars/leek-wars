import { Area } from './area'
import { Cell } from './cell'
import { Entity } from './entity'

class Field {
	public tilesX!: number
	public tilesY!: number
	public nb_cells = 0
	public coord: Cell[][] = []
	public cells: Cell[] = []
	private min_x = -1
	private max_x = -1
	private min_y = -1
	private max_y = -1

	constructor(tilesX: number, tilesY: number) {
		this.tilesX = tilesX
		this.tilesY = tilesY
		this.nb_cells = (this.tilesX * 2 - 1) * this.tilesY - (this.tilesX - 1)
		this.cells = new Array(this.nb_cells)

		for (let x = -tilesX + 1; x < tilesX; x++) {
			for (let y = -tilesX + 1; y < tilesX; y++) {
				if (Math.abs(x) + Math.abs(y) >= tilesX) { continue }
				const id = tilesX * (tilesX - 1) + tilesX * x + (tilesX - 1) * y
				const cell = new Cell(id, x, y)

				if (this.min_x === -1 || x < this.min_x) {
					this.min_x = x
				}
				if (this.max_x === -1 || x > this.max_x) {
					this.max_x = x
				}
				if (this.min_y === -1 || y < this.min_y) {
					this.min_y = y
				}
				if (this.max_y === -1 || y > this.max_y) {
					this.max_y = y
				}
				this.cells[id] = cell
			}
		}
		const sx = this.max_x - this.min_x + 1
		const sy = this.max_y - this.min_y + 1
		this.coord = Array.from(Array(sy), () => new Array(sx).fill(null))
		for (const cell of this.cells) {
			this.coord[cell.x - this.min_x][cell.y - this.min_y] = cell
		}
	}

	public resetCells() {
		for (const cell of this.cells) {
			cell.entity = null
		}
	}

	public getAreaCells(center: Cell, area: Area) {

		const cells = [] as Cell[]

		const add_cell = (x: number, y: number) => {
			const n = this.next_cell(center, x, y)
			if (n === null || n.obstacle) { return }
			cells.push(n)
		}

		if (area === Area.SINGLE_CELL) {
			add_cell(0, 0)
		} else if (area === Area.CIRCLE1) {
			add_cell(0, 0)
			add_cell(1, 0)
			add_cell(0, 1)
			add_cell(-1, 0)
			add_cell(0, -1)
		} else if (area === Area.CIRCLE2) {
			add_cell(0, 0)
			add_cell(1, 0)
			add_cell(0, 1)
			add_cell(-1, 0)
			add_cell(0, -1)
			add_cell(2, 0)
			add_cell(0, 2)
			add_cell(-2, 0)
			add_cell(0, -2)
			add_cell(-1, -1)
			add_cell(1, -1)
			add_cell(-1, 1)
			add_cell(1, 1)
		} else if (area === Area.CIRCLE3) {
			add_cell(0, 0)
			add_cell(1, 0)
			add_cell(0, 1)
			add_cell(-1, 0)
			add_cell(0, -1)
			add_cell(2, 0)
			add_cell(0, 2)
			add_cell(-2, 0)
			add_cell(0, -2)
			add_cell(3, 0)
			add_cell(0, 3)
			add_cell(-3, 0)
			add_cell(0, -3)
			add_cell(-1, -1)
			add_cell(1, -1)
			add_cell(-1, 1)
			add_cell(1, 1)
			add_cell(1, 2)
			add_cell(2, 1)
			add_cell(2, -1)
			add_cell(1, -2)
			add_cell(-1, -2)
			add_cell(-2, -1)
			add_cell(-2, 1)
			add_cell(-1, 2)
		} else if (area === Area.PLUS_2) {
			add_cell(0, 0)
			for (let i = 1; i <= 2; ++i) {
				add_cell(i, 0)
				add_cell(0, i)
				add_cell(-i, 0)
				add_cell(0, -i)
			}
		} else if (area === Area.PLUS_3) {
			add_cell(0, 0)
			for (let i = 1; i <= 3; ++i) {
				add_cell(i, 0)
				add_cell(0, i)
				add_cell(-i, 0)
				add_cell(0, -i)
			}
		} else if (area === Area.X_1) {
			add_cell(0, 0)
			for (let i = 1; i <= 1; ++i) {
				add_cell(i, i)
				add_cell(i, -i)
				add_cell(-i, i)
				add_cell(-i, -i)
			}
		} else if (area === Area.X_2) {
			add_cell(0, 0)
			for (let i = 1; i <= 2; ++i) {
				add_cell(i, i)
				add_cell(i, -i)
				add_cell(-i, i)
				add_cell(-i, -i)
			}
		} else if (area === Area.X_3) {
			add_cell(0, 0)
			for (let i = 1; i <= 3; ++i) {
				add_cell(i, i)
				add_cell(i, -i)
				add_cell(-i, i)
				add_cell(-i, -i)
			}
		}
		return cells
	}

	public getTargets(center: Cell, area: Area) {
		const entities: Entity[] = []
		for (const cell of this.getAreaCells(center, area)) {
			if (cell.entity) {
				entities.push(cell.entity)
			}
		}
		return entities
	}

	public getNumCells() {
		return (this.tilesX * 2 - 1) * this.tilesY - this.tilesX - 1
	}

	public xyToCell(x: number, y: number) {
		const mod = this.tilesX * 2 - 1
		if (y % 2 === 0) {
			return this.cells[(y / 2) * mod + x / 2]
		} else {
			return this.cells[((y - 1) / 2) * mod + this.tilesX + (x - 1) / 2]
		}
	}

	public cellToXY(cell: Cell) {
		const mod = this.tilesX * 2 - 1
		const pos = {
			x: (cell.id % mod) * 2,
			y: Math.floor(cell.id / mod) * 2,
		}
		if (pos.x > mod) {
			pos.x = pos.x % mod
			pos.y++
		}
		return pos
	}

	public real_distance(cell1: Cell, cell2: Cell): number {
		const xy1 = this.cellToXY(cell1)
		const xy2 = this.cellToXY(cell2)
		return Math.sqrt(Math.pow(xy1.x - xy2.x, 2) + Math.pow((xy1.y - xy2.y) / 2, 2))
	}

	public next_cell(cell: Cell | null, dx: number, dy: number) {
		if (cell === null) { return null }
		const x = cell.x + dx
		const y = cell.y + dy
		if (x < this.min_x || y < this.min_y || x > this.max_x || y > this.max_y) {
			return null
		}
		return this.coord[x - this.min_x][y - this.min_y]
	}

	public getCell(x: number, y: number) {
		return this.coord[x - this.min_x][y - this.min_y]
	}

	public getLastAvailableCell(from: Cell, target: Cell) {
		const dx = Math.sign(target.x - from.x)
		const dy = Math.sign(target.y - from.y)
		let current = from
		while (current !== target) {
			const next = this.next_cell(current, dx, dy)!
			if (next.obstacle || !!next.entity) {
				return current
			}
			current = next
		}
		return current
	}
}

export { Field }