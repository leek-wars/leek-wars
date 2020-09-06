import { Game, GROUND_TEXTURE } from "@/component/player/game/game"
import { Obstacle } from '@/component/player/game/obstacle'
import { LeekWars } from '@/model/leekwars'
import { Cell } from './cell'
import { Position } from './position'
import { T, Texture } from './texture'

let GROUND_PADDING_LEFT = 210
let GROUND_PADDING_RIGHT = 20
let GROUND_PADDING_TOP = 70
let GROUND_PADDING_BOTTOM = 100

class Ground {
	public width: number = 0
	public height: number = 0
	public tileSize = 60
	public tilesX = 18
	public tilesY = 18
	public nb_cells = 0
	public startX: number = 0
	public startY: number = 0
	public texture!: HTMLCanvasElement | null
	public textureCtx!: CanvasRenderingContext2D | null
	public pumpkin!: Texture
	public obstacles: Obstacle[] = []
	public game: Game
	public gridHeight: number = 0
	public gridWidth: number = 0
	public tileSizeX: number = 0
	public tileSizeY: number = 0
	public realTileSizeX: number = 0
	public realTileSizeY: number = 0
	public realTileLength: number = 0
	public scale: number = 0
	public realGridWidth: number = 0
	public realGridHeight: number = 0
	public coord: Cell[][] = []
	public cells: Cell[] = []
	private min_x = -1
	private max_x = -1
	private min_y = -1
	private max_y = -1

	constructor(game: Game) {
		this.game = game
		this.nb_cells = (this.tilesX * 2 - 1) * this.tilesY - (this.tilesX - 1)
		for (let id = 0; id < this.nb_cells; id++) {
			const x1 = id % (this.tilesX * 2 - 1)
			const y1 = Math.floor(id / (this.tilesX * 2 - 1))
			const y = y1 - x1 % this.tilesX
			const x = (id - (this.tilesX - 1) * y) / this.tilesX
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
			this.cells.push(cell)
		}
		const sx = this.max_x - this.min_x + 1
		const sy = this.max_y - this.min_y + 1
		this.coord = Array.from(Array(sy), () => new Array(sx).fill(null))
		for (const cell of this.cells) {
			this.coord[cell.x - this.min_x][cell.y - this.min_y] = cell
		}
		if (this.game.halloween) {
			T.pumpkin.load(this.game)
		}
	}

	public addObstacle(obstacle: Obstacle) {
		this.obstacles.push(obstacle)
		obstacle.cell.obstacle = true
		if (obstacle.size === 2) {
			this.cells[obstacle.cell.id + 17].obstacle = true
			this.cells[obstacle.cell.id + 18].obstacle = true
			this.cells[obstacle.cell.id + 35].obstacle = true
		}
	}

	public resize(width: number, height: number, shadows: boolean) {

		if (!this.game.initialized) { return  }

		if (LeekWars.mobile) {
			GROUND_PADDING_LEFT = 10
			GROUND_PADDING_RIGHT = 10
			GROUND_PADDING_TOP = 100
			GROUND_PADDING_BOTTOM = 20
		} else {
			GROUND_PADDING_LEFT = 210
			GROUND_PADDING_RIGHT = 20
			GROUND_PADDING_TOP = 20
			GROUND_PADDING_BOTTOM = 50
		}
		this.width = width
		this.height = height

		// Taille de la grille centrale
		this.gridHeight = Math.round(height - GROUND_PADDING_TOP - GROUND_PADDING_BOTTOM)
		this.gridWidth = Math.round(width - GROUND_PADDING_LEFT - GROUND_PADDING_RIGHT)
		if (this.gridHeight * 2 > this.gridWidth) {
			this.gridHeight = Math.round(this.gridWidth / 2)
		}
		if (this.gridWidth / 2 > this.gridHeight) {
			this.gridWidth = Math.round(this.gridHeight * 2)
		}

		// Calculate start position
		this.startX = GROUND_PADDING_LEFT + Math.round(width - GROUND_PADDING_LEFT - GROUND_PADDING_RIGHT - this.gridWidth) / 2
		this.startY = GROUND_PADDING_TOP + Math.round(height - GROUND_PADDING_BOTTOM - GROUND_PADDING_TOP - this.gridHeight) / 2

		// Taille des cases
		this.tileSizeX = this.gridWidth / this.tilesX
		this.tileSizeY = this.gridHeight / this.tilesY

		// Taille "réelle" des cases
		this.realTileSizeX = 70
		this.realTileSizeY = 35
		this.realTileLength = Math.hypot(this.realTileSizeX / 2, this.realTileSizeY / 2)

		this.scale = this.tileSizeX / this.realTileSizeX

		// Taille "réelle" de la grille
		this.realGridWidth = this.gridWidth / this.scale
		this.realGridHeight = this.gridHeight / this.scale

		// Set obstacles sizes
		for (const o in this.obstacles) {
			this.obstacles[o].resize()
		}

		// Create grid texture
		if (GROUND_TEXTURE) {

			this.texture = document.querySelector('.bg-canvas') as HTMLCanvasElement
			this.texture.width = width
			this.texture.height = height
			this.textureCtx = this.texture.getContext('2d')
			if (!this.textureCtx) { return }

			// Fill color
			this.textureCtx.fillStyle = this.game.map.groundColor
			this.textureCtx.fillRect(0, 0, width, height)

			// Translate
			this.textureCtx.save()
			this.textureCtx.translate(this.startX, this.startY)

			// Draw image
			this.textureCtx.drawImage(this.game.map.groundTexture.texture, -30, -30, this.gridWidth + 60, this.gridHeight + 60)

			// Draw map decor
			if (this.game.map.drawDecor) {
				this.textureCtx.save()
				this.textureCtx.scale(this.scale, this.scale)
				this.game.map.drawDecor(this.textureCtx)
				this.textureCtx.restore()
			}
			// Draw lines
			this.drawGrid(this.textureCtx)

			// Draw checkerboard
			if (this.game.tactic) {
				this.textureCtx.save()
				this.textureCtx.fillStyle = 'black'
				this.textureCtx.globalAlpha = 0.11

				for (const cell of this.cells) {

					if (((cell.x + cell.y) % 2) || cell.obstacle) { continue }

					this.textureCtx.save()
					const xy = this.cellToXY(cell)
					const real = this.xyToXYPixels(xy.x, xy.y)
					this.textureCtx.translate(real.x * this.scale, real.y * this.scale)

					this.textureCtx.beginPath()
					this.textureCtx.moveTo(0, -this.tileSizeY / 2.)
					this.textureCtx.lineTo(this.tileSizeX / 2., 0)
					this.textureCtx.lineTo(0, this.tileSizeY / 2.)
					this.textureCtx.lineTo(-this.tileSizeX / 2., 0)
					this.textureCtx.closePath()
					this.textureCtx.fill()

					this.textureCtx.restore()
				}
				this.textureCtx.restore()
			}

			// Obstacles shadows
			if (shadows) {
				for (const obstacle of this.obstacles) {
					obstacle.drawShadow(this.textureCtx)
				}
			}
			this.textureCtx.scale(this.scale, this.scale)
		}
	}

	public drawGrid(ctx: CanvasRenderingContext2D) {

		ctx.strokeStyle = "rgba(0, 0, 0, " + (0.12 * this.scale) + ")"
		ctx.lineWidth = 2

		for (let i = 0; i < this.tilesX; i++) {

			ctx.beginPath()
			ctx.moveTo(this.tileSizeX / 2 + i * this.tileSizeX, 0)
			ctx.lineTo(0, this.tileSizeY / 2 + i * this.tileSizeY)
			ctx.stroke()

			ctx.beginPath()
			ctx.moveTo(this.tileSizeX / 2 + i * this.tileSizeX, this.gridHeight)
			ctx.lineTo(0, this.gridHeight - this.tileSizeY / 2 - i * this.tileSizeY)
			ctx.stroke()

			ctx.beginPath()
			ctx.moveTo(this.gridWidth - this.tileSizeX / 2 - i * this.tileSizeX, 0)
			ctx.lineTo(this.gridWidth, this.tileSizeY / 2 + i * this.tileSizeY)
			ctx.stroke()

			ctx.beginPath()
			ctx.moveTo(this.gridWidth - this.tileSizeX / 2 - i * this.tileSizeX, this.gridHeight)
			ctx.lineTo(this.gridWidth, this.gridHeight - this.tileSizeY / 2 - i * this.tileSizeY)
			ctx.stroke()
		}
	}

	public addObstacleElement(obstacle: Obstacle) {
		this.game.addDrawableElement(obstacle, obstacle.y + obstacle.size - 1)
	}

	public drawTexture(image: HTMLImageElement, x: number, y: number, angle: number) {
		if (GROUND_TEXTURE && this.textureCtx) {
			this.textureCtx.save()
			this.textureCtx.translate(x, y)
			this.textureCtx.rotate(angle)
			this.textureCtx.drawImage(image, -image.width / 2, -image.height / 2)
			this.textureCtx.restore()
		}
	}

	public drawTextureCrop(image: HTMLImageElement, x: number, y: number, angle: number, ox: number, oy: number, w: number, h: number) {
		if (GROUND_TEXTURE && this.textureCtx) {
			this.textureCtx.save()
			this.textureCtx.translate(x, y)
			this.textureCtx.rotate(angle)
			this.textureCtx.drawImage(image, ox, oy, w, h, -w / 2, -h / 2, w, h)
			this.textureCtx.restore()
		}
	}

	public drawTextureScale(image: HTMLImageElement, x: number, y: number, angle: number, scaleX: number, scaleY: number) {
		if (GROUND_TEXTURE && this.textureCtx) {
			this.textureCtx.save()
			this.textureCtx.translate(x, y)
			this.textureCtx.scale(scaleX, scaleY)
			this.textureCtx.rotate(angle)
			this.textureCtx.drawImage(image, -image.width / 2, -image.height / 2)
			this.textureCtx.restore()
		}
	}

	public drawTextureCropScale(image: HTMLImageElement, x: number, y: number, angle: number, ox: number, oy: number, w: number, h: number, scaleX: number, scaleY: number) {
		if (GROUND_TEXTURE && this.textureCtx) {
			this.textureCtx.save()
			this.textureCtx.translate(x, y)
			this.textureCtx.scale(scaleX, scaleY)
			this.textureCtx.rotate(angle)
			this.textureCtx.drawImage(image, ox, oy, w, h, -w / 2, -h / 2, w, h)
			this.textureCtx.restore()
		}
	}

	public draw(ctx: CanvasRenderingContext2D) {

		// Clear main canvas
		ctx.canvas.width = ctx.canvas.width

		// Set origin at the start postion of the ground
		ctx.save()
		ctx.translate(this.startX, this.startY)

		// Draw cells numbers
		if (this.game.showCells) {
			this.drawCellNumbers(ctx)
		}
	}

	public drawCellNumbers(ctx: CanvasRenderingContext2D) {

		ctx.globalAlpha = 0.8
		ctx.fillStyle = 'black'
		ctx.font = Math.floor(this.tileSizeX / 6) + "pt Roboto"
		ctx.textAlign = "center"

		let cell = 0

		for (let i = 0; i < this.tilesY * 2 - 1; ++i) {

			const big = i % 2 === 0
			const num = big ? this.tilesX : this.tilesX - 1

			for (let j = 0; j < num; ++j) {
				ctx.fillText('' + cell++, j * this.tileSizeX + this.tileSizeX / 2 + ((big ? 0 : 1) * this.tileSizeX / 2), i * this.tileSizeY / 2 + this.tileSizeY / 1.5)
			}
		}
		ctx.globalAlpha = 1
	}

	public endDraw(ctx: CanvasRenderingContext2D) {
		ctx.restore()
	}

	public cellToXY(cell: Cell) {
		const mod = this.game.ground.tilesX * 2 - 1
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

	public xyToCell(x: number, y: number) {
		const mod = this.game.ground.tilesX * 2 - 1
		if (y % 2 === 0) {
			return this.cells[(y / 2) * mod + x / 2]
		} else {
			return this.cells[((y - 1) / 2) * mod + this.game.ground.tilesX + (x - 1) / 2]
		}
	}

	public xyToXYPixels(x: number, y: number) {
		return new Position(
			x * this.realTileSizeX / 2 + this.realTileSizeX / 2,
			y * this.realTileSizeY / 2 + this.realTileSizeY / 2,
		)
	}

	public getNumCells() {
		return (this.tilesX * 2 - 1) * this.tilesY - this.tilesX - 1
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
}

export { Ground, GROUND_PADDING_BOTTOM, GROUND_PADDING_RIGHT, GROUND_PADDING_LEFT, GROUND_PADDING_TOP }
