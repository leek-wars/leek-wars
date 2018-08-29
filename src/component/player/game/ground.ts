import { Game, GROUND_TEXTURE } from "@/component/player/game/game"
import { Obstacle } from '@/component/player/game/obstacle'

const GROUND_PADDING_LEFT = 210
const GROUND_PADDING_RIGHT = 20
const GROUND_PADDING_TOP = 70
const GROUND_PADDING_BOTTOM = 100

class Ground {
	public width: number = 0
	public height: number = 0
	public tileSize = 60
	public tilesX = 18
	public tilesY = 18
	public startX: number = 0
	public startY: number = 0
	public texture!: HTMLCanvasElement | null
	public textureCtx!: CanvasRenderingContext2D | null
	public shadows: boolean = true
	public fullscreen = false
	public obstacles: Obstacle[] = []
	public game: Game
	public gridHeight: number = 0
	public gridWidth: number = 0
	public tileSizeX: number = 0
	public tileSizeY: number = 0
	public realTileSizeX: number = 0
	public realTileSizeY: number = 0
	public scale: number = 0
	public realGridWidth: number = 0
	public realGridHeight: number = 0

	constructor(game: Game) {
		this.game = game
		// if ($(window).width() < 800) {
		// 	GROUND_PADDING_LEFT = 10;
		// 	GROUND_PADDING_RIGHT = 10;
		// 	GROUND_PADDING_TOP = 10;
		// 	GROUND_PADDING_BOTTOM = 20;
		// }
	}

	public resize(width: number, height: number, fullscreen: boolean, shadows: boolean) {

		if (!this.game.initialized) { return  }

		this.width = width
		this.height = height

		this.fullscreen = fullscreen
		this.shadows = shadows

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
		this.startX = Math.round(width - this.gridWidth - GROUND_PADDING_RIGHT)
		this.startY = Math.round(height - this.gridHeight - GROUND_PADDING_BOTTOM)

		// Taille des cases
		this.tileSizeX = this.gridWidth / this.tilesX
		this.tileSizeY = this.gridHeight / this.tilesY

		// Taille "réelle" des cases
		this.realTileSizeX = 70
		this.realTileSizeY = 35

		this.scale = this.tileSizeX / this.realTileSizeX

		// Taille "réelle" de la grille
		this.realGridWidth = this.gridWidth / this.scale
		this.realGridHeight = this.gridHeight / this.scale

		// Set obstacles sizes
		for (const o in this.obstacles) {
			if (this.obstacles.hasOwnProperty(o)) {
				this.obstacles[o].resize()
			}
		}

		// Create grid texture
		if (GROUND_TEXTURE) {

			this.texture = document.getElementById('bg-canvas') as HTMLCanvasElement
			this.texture.width = width
			this.texture.height = height
			this.textureCtx = this.texture.getContext('2d')
			if (!this.textureCtx) { return  }

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

			// Obstacles shadows
			for (const o in this.obstacles) {
				if (this.obstacles.hasOwnProperty(o)) {
					this.obstacles[o].drawShadow(this.textureCtx)
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

	public addObstacle(obstacle: Obstacle) {
		this.obstacles.push(obstacle)
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
		ctx.font = Math.floor(this.tileSizeX / 5) + "pt Roboto"
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

	public cellToXY(cell: number) {
		const mod = this.game.ground.tilesX * 2 - 1
		const pos = {
			x: (cell % mod) * 2,
			y: Math.floor(cell / mod) * 2,
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
			return (y / 2) * mod + x / 2
		} else {
			return ((y - 1) / 2) * mod + this.game.ground.tilesX + (x - 1) / 2
		}
	}

	public xyToXYPixels(x: number, y: number) {
		const pixels = {
			x: x * this.realTileSizeX / 2 + this.realTileSizeX / 2,
			y: y * this.realTileSizeY / 2 + this.realTileSizeY / 2,
		}
		return pixels
	}

	public getNumCells() {
		return (this.tilesX * 2 - 1) * this.tilesY - this.tilesX - 1
	}
}

export { Ground, GROUND_PADDING_BOTTOM, GROUND_PADDING_RIGHT, GROUND_PADDING_LEFT, GROUND_PADDING_TOP }
