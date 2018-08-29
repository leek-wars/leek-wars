import { Game, SHADOW_ALPHA, SHADOW_SCALE } from "@/component/player/game/game"
import { createScaledTexture, Texture } from '@/component/player/game/texture'

class Obstacle {
	public game: Game
	public size: number
	public type: number
	public inverse: boolean
	public x: number
	public y: number
	public offset: number
	public baseTexture: Texture
	public texture: HTMLCanvasElement | null = null
	public textureShadow: HTMLCanvasElement | null = null
	public realWidth: number = 0
	public realHeight: number = 0
	public realX: number = 0
	public cellX: number = 0
	public realY: number = 0
	public cellY: number = 0

	constructor(game: Game, type: number, size: number, cell: number) {
		this.game = game
		// Get original texture
		const textureType = size === 2 ? game.map.obstaclesBig : game.map.obstaclesSmall
		this.baseTexture = textureType[type]
		// if (Math.random() > 0.7) texture = T.pumpkin
		// Caractéristiques
		this.size = size
		this.type = type
		this.inverse = this.baseTexture.inverse && Math.random() > 0.5
		// Position
		const pos = game.ground.cellToXY(cell)
		this.x = pos.x
		this.y = pos.y
		// Offset
		this.offset = 1
		if (this.baseTexture.offset) {
			this.offset = this.baseTexture.offset
		}
	}

	public resize() {
		// Create the cache texture
		if (this.size === 1) {

			const scale = (this.game.ground.tileSizeY * 1.7 * this.offset) / this.baseTexture.texture.width

			this.realWidth = Math.round(this.baseTexture.texture.width * scale)
			this.realHeight = Math.round(this.baseTexture.texture.height * scale)

			this.realX = Math.round((this.x / 2) * this.game.ground.tileSizeX + (this.game.ground.tileSizeX - this.realWidth) / 2)
			this.realY = Math.round((this.y / 2 + 1) * this.game.ground.tileSizeY - this.realHeight + 5)

			this.cellX = ((this.x + 1) / 2) * this.game.ground.tileSizeX
			this.cellY = ((this.y + 1) / 2) * this.game.ground.tileSizeY

			this.texture = createScaledTexture(this.baseTexture.texture, this.realWidth, this.realHeight, this.inverse) as HTMLCanvasElement

		} else if (this.size === 2) {

			const scale = (this.game.ground.tileSizeY * 3.4 * this.offset) / this.baseTexture.texture.width

			this.realWidth = Math.round(this.baseTexture.texture.width * scale)
			this.realHeight = Math.round(this.baseTexture.texture.height * scale)

			this.realX = Math.round(((this.x - 1) / 2) * this.game.ground.tileSizeX + (this.game.ground.tileSizeX * 2 - this.realWidth) / 2)
			this.realY = Math.round(((this.y + 3) / 2) * this.game.ground.tileSizeY - this.realHeight + 17)

			this.cellX = ((this.x + 1) / 2) * this.game.ground.tileSizeX
			this.cellY = (this.y / 2 + 1) * this.game.ground.tileSizeY

			this.texture = createScaledTexture(this.baseTexture.texture, this.realWidth, this.realHeight, this.inverse) as HTMLCanvasElement
		}
	}

	public draw(ctx: CanvasRenderingContext2D) {
		if (this.game.tactic) {
			ctx.save()
			ctx.globalAlpha = 0.6
			ctx.fillStyle = "black"
			ctx.translate(this.cellX, this.cellY)

			ctx.beginPath()
			if (this.size === 1) {
				ctx.moveTo(0, -this.game.ground.tileSizeY / 2 + 2)
				ctx.lineTo(this.game.ground.tileSizeX / 2 - 4, 0)
				ctx.lineTo(0, this.game.ground.tileSizeY / 2 - 2)
				ctx.lineTo(-this.game.ground.tileSizeX / 2 + 4, 0)
			} else {
				ctx.moveTo(0, -this.game.ground.tileSizeY + 2)
				ctx.lineTo(this.game.ground.tileSizeX - 4, 0)
				ctx.lineTo(0, this.game.ground.tileSizeY - 2)
				ctx.lineTo(-this.game.ground.tileSizeX + 4, 0)
			}
			ctx.closePath()
			ctx.fill()
			ctx.restore()
		} else {
			if (this.texture) {
				ctx.drawImage(this.texture, this.realX, this.realY)
			}
		}
	}

	public drawShadow(ctx: CanvasRenderingContext2D) {

		if (this.game.tactic) { return  }

		if (this.baseTexture.shadow != null) {

			const offsetY = this.size * this.game.ground.tileSizeY * 1.5

			ctx.save()
			ctx.translate(this.realX, this.realY + this.realHeight)
			ctx.scale(1, -SHADOW_SCALE)
			ctx.globalAlpha = SHADOW_ALPHA

			if (this.inverse) {
				ctx.scale(-1, 1)
				ctx.drawImage(this.baseTexture.shadow, -this.realWidth, -this.realHeight + offsetY, this.realWidth, this.realHeight)
			} else {
				ctx.drawImage(this.baseTexture.shadow, 0, -this.realHeight + offsetY, this.realWidth, this.realHeight)
			}
			ctx.restore()
		}
	}
}

export { Obstacle }
