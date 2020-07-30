import { Game, SHADOW_ALPHA, SHADOW_SCALE } from "@/component/player/game/game"
import { T, Texture } from '@/component/player/game/texture'
import { Cell } from '@/model/cell'

class Obstacle {
	public game: Game
	public size: number
	public type: number
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
	public cell: Cell
	public pumpkin: boolean = false

	constructor(game: Game, type: number, size: number, cell: Cell) {
		this.game = game
		if (game.halloween) {
			this.pumpkin = Math.random() > 0.7
		}
		// Caractéristiques
		this.size = size
		this.type = type
		// Position
		const pos = game.ground.field.cellToXY(cell)
		this.x = pos.x
		this.y = pos.y
		this.cell = cell
	}

	public resize() {
		// Create the cache texture
		const textureType = this.size === 2 ? this.game.map.options.largeObstacles : this.game.map.options.smallObstacles
		this.baseTexture = this.pumpkin ? T.pumpkin : textureType[this.type]

		if (this.size === 1) {
			this.cellX = ((this.x + 1) / 2) * this.game.ground.tileSizeX
			this.cellY = ((this.y + 1) / 2) * this.game.ground.tileSizeY
		} else {
			this.cellX = ((this.x + 1) / 2) * this.game.ground.tileSizeX
			this.cellY = (this.y / 2 + 1) * this.game.ground.tileSizeY
		}

		if (!this.baseTexture) { return }

		const offset = this.baseTexture.offset

		if (this.size === 1) {

			const scale = (this.game.ground.tileSizeY * 1.7 * offset) / this.baseTexture.texture.width

			this.realWidth = Math.round(this.baseTexture.texture.width * scale)
			this.realHeight = Math.round(this.baseTexture.texture.height * scale)

			this.realX = (this.x / 2) * this.game.ground.tileSizeX + (this.game.ground.tileSizeX - this.realWidth) / 2
			this.realY = (this.y / 2 + 1) * this.game.ground.tileSizeY - this.realHeight

			this.texture = this.baseTexture.getScaled(this.realWidth)

		} else if (this.size === 2) {

			const scale = (this.game.ground.tileSizeY * 3.4 * offset) / this.baseTexture.texture.width

			this.realWidth = Math.round(this.baseTexture.texture.width * scale)
			this.realHeight = Math.round(this.baseTexture.texture.height * scale)

			this.realX = ((this.x - 1) / 2) * this.game.ground.tileSizeX + (this.game.ground.tileSizeX * 2 - this.realWidth) / 2
			this.realY = (2 + this.y / 2) * this.game.ground.tileSizeY - this.realHeight

			this.texture = this.baseTexture.getScaled(this.realWidth)
		}
	}

	public draw(ctx: CanvasRenderingContext2D) {
		if (this.game.tactic || !this.baseTexture) {
			ctx.save()
			ctx.globalAlpha = 0.8
			ctx.translate(this.cellX, this.cellY)

			const H = 8 * this.game.ground.scale
			if (this.size === 1) {
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
			} else {
				ctx.fillStyle = this.game.map.tacticLargeColors[0]
				ctx.beginPath()
				ctx.moveTo(0, -H - this.game.ground.tileSizeY + 2)
				ctx.lineTo(this.game.ground.tileSizeX - 4, -H)
				ctx.lineTo(0, -H + this.game.ground.tileSizeY - 2)
				ctx.lineTo(-this.game.ground.tileSizeX + 4, -H)
				ctx.closePath()
				ctx.fill()
				ctx.fillStyle = this.game.map.tacticLargeColors[1]
				ctx.beginPath()
				ctx.moveTo(this.game.ground.tileSizeX - 4, -H)
				ctx.lineTo(this.game.ground.tileSizeX - 4, 0)
				ctx.lineTo(0, this.game.ground.tileSizeY - 2)
				ctx.lineTo(0, -H + this.game.ground.tileSizeY - 2)
				ctx.closePath()
				ctx.fill()
				ctx.fillStyle = this.game.map.tacticLargeColors[2]
				ctx.beginPath()
				ctx.moveTo(-this.game.ground.tileSizeX + 4, -H)
				ctx.lineTo(-this.game.ground.tileSizeX + 4, 0)
				ctx.lineTo(0, this.game.ground.tileSizeY - 2)
				ctx.lineTo(0, -H + this.game.ground.tileSizeY - 2)
				ctx.closePath()
				ctx.fill()
			}
			ctx.restore()
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
			ctx.translate(this.cellX, this.cellY - 0.1 * this.game.ground.realTileSizeY)
			ctx.scale(1, -SHADOW_SCALE)
			ctx.rotate(-Math.PI / 4)
			ctx.translate(0, - this.realHeight + 0.5 * this.game.ground.realTileSizeY)
			ctx.globalAlpha = SHADOW_ALPHA
			ctx.drawImage(this.baseTexture.shadow, -this.realWidth / 2, 0, this.realWidth, this.realHeight)
			ctx.restore()
		}
	}
}

export { Obstacle }
