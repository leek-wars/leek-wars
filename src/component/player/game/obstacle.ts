import { Game, SHADOW_ALPHA, SHADOW_SCALE } from "@/component/player/game/game"
import { T, Texture } from '@/component/player/game/texture'
import { Cell } from '@/model/cell'
import { OBSTACLES, ObstacleInfo } from "./ground"

export class ObstacleGeometry {
	public id!: number
	public name!: string
	public cells!: [number, number][]

	public constructor(id: number, name: string, cells: [number, number][]) {
		this.id = id
		this.name = name
		this.cells = cells
	}
}

class Obstacle {

	public static GEOMETRY_1x1 = new ObstacleGeometry(1, '1x1', [[0, 0]])
	public static GEOMETRY_2x2 = new ObstacleGeometry(2, '2x2', [[0, 0], [1, 0], [0, 1], [1, 1]])
	public static GEOMETRY_3x3 = new ObstacleGeometry(3, '3x3', [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [-1, -1], [-1, 1], [0, -1], [1, -1]])
	public static GEOMETRY_TORII_GATE = new ObstacleGeometry(4, '4x1', [[0, 0], [-3, 0]])
	public static GEOMETRY_LIFT_BRIDGE = new ObstacleGeometry(5, '3x5', [[0, -1], [0, 0], [0, 3], [2, -1], [2, 0], [2, 3]])

	public static GEOMETRIES: {[key: number]: ObstacleGeometry} = {
		1: Obstacle.GEOMETRY_1x1,
		2: Obstacle.GEOMETRY_2x2,
		3: Obstacle.GEOMETRY_3x3,
		4: Obstacle.GEOMETRY_TORII_GATE,
		5: Obstacle.GEOMETRY_LIFT_BRIDGE,
	}

	public game: Game
	public geometry: ObstacleGeometry
	public info!: ObstacleInfo
	public x: number
	public y: number
	public baseTexture!: Texture | null
	public texture: HTMLCanvasElement | HTMLImageElement | null = null
	public textureShadow: HTMLCanvasElement | null = null
	public realWidth: number = 0
	public realHeight: number = 0
	public realX: number = 0
	public cellX: number = 0
	public realY: number = 0
	public cellY: number = 0
	public nudgeX: number = 0
	public nudgeY: number = 0;
	public cell: Cell
	public pumpkin: boolean = false
	public drawID: number | null = null

	constructor(game: Game, geometry: ObstacleGeometry, cell: Cell, info: ObstacleInfo) {
		this.game = game
		if (game.halloween) {
			this.pumpkin = Math.random() > 0.7
		}
		// Caractéristiques
		this.geometry = geometry
		this.info = info
		// console.log("obstacle", info)
		// Position
		const pos = game.ground.field.cellToXY(cell)
		this.x = pos.x
		this.y = pos.y
		this.cell = cell
	}

	public updateType() {
		// console.log("update type")
		const obstacles = this.geometry.id === 2 ? this.game.map.options.largeObstacles : this.game.map.options.smallObstacles
		this.info = obstacles[this.game.map.random.next() * obstacles.length | 0]!
	}

	public resize() {
		// Create the cache texture
		// console.log("type=", this.type)
		// const textureType = this.size === 2 ? this.game.map.options.largeObstacles : this.game.map.options.smallObstacles
		this.baseTexture = this.pumpkin ? T.pumpkin : this.info.texture

		if (this.geometry.id === 1 || this.geometry.id === 3) {
			this.cellX = ((this.x + 1) / 2) * this.game.ground.tileSizeX
			this.cellY = ((this.y + 1) / 2) * this.game.ground.tileSizeY
		} else {
			this.cellX = ((this.x + 1) / 2) * this.game.ground.tileSizeX
			this.cellY = (this.y / 2 + 1) * this.game.ground.tileSizeY
		}

		if (!this.baseTexture) { return }

		const offset = this.baseTexture.offset
		this.nudgeX = this.baseTexture.nudgeX
		this.nudgeY = this.baseTexture.nudgeY

		if (this.geometry.id === 1 || this.geometry.id === 4) {

			const scale = (this.game.ground.tileSizeY * 1.7 * offset) / this.baseTexture.texture.width

			this.realWidth = Math.round(this.baseTexture.texture.width * scale)
			this.realHeight = Math.round(this.baseTexture.texture.height * scale)

			this.realX = ((this.x + this.nudgeX) / 2) * this.game.ground.tileSizeX + (this.game.ground.tileSizeX - this.realWidth) / 2
			this.realY = ((this.y + this.nudgeY) / 2 + 1) * this.game.ground.tileSizeY - this.realHeight

			this.texture = this.baseTexture.getScaled(this.realWidth)

		} else if (this.geometry.id === 2) {

			const scale = (this.game.ground.tileSizeY * 3.4 * offset) / this.baseTexture.texture.width

			this.realWidth = Math.round(this.baseTexture.texture.width * scale)
			this.realHeight = Math.round(this.baseTexture.texture.height * scale)

			this.realX = ((this.x + 1) / 2) * this.game.ground.tileSizeX - this.realWidth / 2
			this.realY = ((this.y + this.nudgeY) / 2 + 2) * this.game.ground.tileSizeY - this.realHeight

			this.texture = this.baseTexture.getScaled(this.realWidth)

		} else if (this.geometry.id === 3 || this.geometry.id === 5) {

			const scale = (this.game.ground.tileSizeY * 5.1 * offset) / this.baseTexture.texture.width

			this.realWidth = Math.round(this.baseTexture.texture.width * scale)
			this.realHeight = Math.round(this.baseTexture.texture.height * scale)

			this.realX = ((this.x + this.nudgeX + 1) / 2) * this.game.ground.tileSizeX - this.realWidth / 2
			this.realY = ((this.y + this.nudgeY) / 2 + 2) * this.game.ground.tileSizeY - this.realHeight

			this.texture = this.baseTexture.getScaled(this.realWidth)
		}
	}

	public draw(ctx: CanvasRenderingContext2D) {
		// console.log("obstacle draw()", this.baseTexture)
		if (this.game.tactic) {

			const H = 8 * this.game.ground.scale

			if (this.geometry.id <= 3) {
				ctx.save()
				ctx.globalAlpha = 0.8
				ctx.translate(this.cellX, this.cellY)

				const s = this.geometry.id
				ctx.fillStyle = s === 1 ? this.game.map.tacticSmallColors[0] : this.game.map.tacticLargeColors[0]
				ctx.beginPath()
				ctx.moveTo(0, -H - s * this.game.ground.tileSizeY / 2 + 2)
				ctx.lineTo(s * this.game.ground.tileSizeX / 2 - 4, -H)
				ctx.lineTo(0, -H + s * this.game.ground.tileSizeY / 2 - 2)
				ctx.lineTo(-s * this.game.ground.tileSizeX / 2 + 4, -H)
				ctx.closePath()
				ctx.fill()
				ctx.fillStyle = s === 1 ? this.game.map.tacticSmallColors[1] : this.game.map.tacticLargeColors[1]
				ctx.beginPath()
				ctx.moveTo(s * this.game.ground.tileSizeX / 2 - 4, -H)
				ctx.lineTo(s * this.game.ground.tileSizeX / 2 - 4, 0)
				ctx.lineTo(0, s * this.game.ground.tileSizeY / 2 - 2)
				ctx.lineTo(0, -H + s * this.game.ground.tileSizeY / 2 - 2)
				ctx.closePath()
				ctx.fill()
				ctx.fillStyle = s === 1 ? this.game.map.tacticSmallColors[2] : this.game.map.tacticLargeColors[2]
				ctx.beginPath()
				ctx.moveTo(-s * this.game.ground.tileSizeX / 2 + 4, -H)
				ctx.lineTo(-s * this.game.ground.tileSizeX / 2 + 4, 0)
				ctx.lineTo(0, s * this.game.ground.tileSizeY / 2 - 2)
				ctx.lineTo(0, -H + s * this.game.ground.tileSizeY / 2 - 2)
				ctx.closePath()
				ctx.fill()

				ctx.restore()
			} else {
				for (const coord of this.geometry.cells) {
					const cell = this.game.ground.field.next_cell(this.cell, coord[0], coord[1])
					if (cell) {
						ctx.save()
						ctx.globalAlpha = 0.8
						const pos = this.game.ground.field.cellToXY(cell)
						const xy = this.game.ground.xyToXYPixels(pos.x, pos.y)
						ctx.translate(xy.x * this.game.ground.scale, xy.y * this.game.ground.scale)

						ctx.fillStyle = this.game.map.tacticSmallColors[0]
						ctx.beginPath()
						ctx.moveTo(0, -H - this.game.ground.tileSizeY / 2 + 2)
						ctx.lineTo(this.game.ground.tileSizeX / 2 - 4, -H)
						ctx.lineTo(0, -H + this.game.ground.tileSizeY / 2 - 2)
						ctx.lineTo(-this.game.ground.tileSizeX / 2 + 4, -H)
						ctx.closePath()
						ctx.fill()
						ctx.fillStyle = this.game.map.tacticSmallColors[1]
						ctx.beginPath()
						ctx.moveTo(this.game.ground.tileSizeX / 2 - 4, -H)
						ctx.lineTo(this.game.ground.tileSizeX / 2 - 4, 0)
						ctx.lineTo(0, this.game.ground.tileSizeY / 2 - 2)
						ctx.lineTo(0, -H + this.game.ground.tileSizeY / 2 - 2)
						ctx.closePath()
						ctx.fill()
						ctx.fillStyle = this.game.map.tacticSmallColors[2]
						ctx.beginPath()
						ctx.moveTo(-this.game.ground.tileSizeX / 2 + 4, -H)
						ctx.lineTo(-this.game.ground.tileSizeX / 2 + 4, 0)
						ctx.lineTo(0, this.game.ground.tileSizeY / 2 - 2)
						ctx.lineTo(0, -H + this.game.ground.tileSizeY / 2 - 2)
						ctx.closePath()
						ctx.fill()
						ctx.restore()
					}
				}
			}
		} else {
			if (this.texture) {
				ctx.drawImage(this.texture, this.realX, this.realY)
			}
		}
	}

	public drawShadow(ctx: CanvasRenderingContext2D) {

		if (this.game.tactic || !this.baseTexture) { return }

		if (this.baseTexture.shadow != null) {

			ctx.save()
			ctx.translate(this.cellX + this.nudgeX * this.game.ground.tileSizeX, this.cellY - 0.1 * this.game.ground.realTileSizeY)
			ctx.scale(1, -SHADOW_SCALE)
			ctx.rotate(-Math.PI / 4)
			ctx.translate(0, - this.realHeight + 0.5 * this.game.ground.realTileSizeY)
			ctx.globalAlpha = SHADOW_ALPHA
			ctx.drawImage(this.baseTexture.shadow, -this.realWidth / 2, 0, this.realWidth, this.realHeight)
			ctx.restore()
		}
	}

	public move(cell: Cell) {
		if (cell === this.cell) { return }

		// Remove from previous cell
		for (const coord of this.geometry.cells) {
			const cell = this.game.ground.field.next_cell(this.cell, coord[0], coord[1])
			if (cell) {
				cell.obstacle = null
			}
		}

		const oldY = this.y
		const pos = this.game.ground.field.cellToXY(cell)
		this.x = pos.x
		this.y = pos.y
		this.cell = cell
		this.resize()
		if (oldY !== this.y) {
			// console.log("move obstacle", oldY, this.y)
			this.game.moveDrawableElement(this, this.drawID!, oldY, this.y)
			this.game.ground.resize(this.game.width, this.game.height, this.game.shadows)
		}

		// Add to new cell
		for (const coord of this.geometry.cells) {
			this.game.ground.field.next_cell(this.cell, coord[0], coord[1])!.obstacle = this
		}
	}
}

export { Obstacle }
