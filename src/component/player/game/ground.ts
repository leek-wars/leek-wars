import { Game, GROUND_TEXTURE } from "@/component/player/game/game"
import { Obstacle } from '@/component/player/game/obstacle'
import { Field } from '@/model/field'
import { LeekWars } from '@/model/leekwars'
import { Position } from './position'
import { T, Texture } from './texture'

let GROUND_PADDING_RIGHT = 50
let GROUND_PADDING_LEFT = 50
const GROUND_PADDING_TOP = 0.10
let GROUND_PADDING_BOTTOM = 105

class Ground {

	public tileSize = 60
	public width: number = 0
	public height: number = 0
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
	public field!: Field

	constructor(game: Game) {
		this.game = game
		this.field = new Field(18, 18)

		if (this.game.halloween) {
			T.pumpkin.load(this.game)
		}
	}

	public addObstacle(obstacle: Obstacle) {
		this.obstacles.push(obstacle)
		obstacle.cell.obstacle = true
		if (obstacle.size === 2) {
			this.field.cells[obstacle.cell.id + 17].obstacle = true
			this.field.cells[obstacle.cell.id + 18].obstacle = true
			this.field.cells[obstacle.cell.id + 35].obstacle = true
		}
	}

	public updateMap() {
		this.game.map.random.seed(this.game.map.seed)
		// Set obstacles types
		for (const o in this.obstacles) {
			this.obstacles[o].updateType()
		}
	}

	public resize(width: number, height: number, shadows: boolean) {

		if (!this.game.initialized) { return  }

		let padding_left = GROUND_PADDING_LEFT
		if (LeekWars.mobile) {
			GROUND_PADDING_LEFT = 10
			GROUND_PADDING_RIGHT = 10
			GROUND_PADDING_BOTTOM = 5
			padding_left = GROUND_PADDING_LEFT
		} else {
			GROUND_PADDING_RIGHT = 50
			GROUND_PADDING_LEFT = 50
			if (this.game.showActions && this.game.largeActions) {
				padding_left = (this.game.actionsWidth + 20)
				GROUND_PADDING_RIGHT = 45
			}
			GROUND_PADDING_BOTTOM = 105
		}
		this.width = width
		this.height = height

		// Taille de la grille centrale
		const padding_top = (height - GROUND_PADDING_BOTTOM * window.devicePixelRatio) * GROUND_PADDING_TOP
		this.gridHeight = Math.round(height - GROUND_PADDING_BOTTOM * window.devicePixelRatio - padding_top)
		this.gridWidth = Math.round(width - padding_left * window.devicePixelRatio - GROUND_PADDING_RIGHT * window.devicePixelRatio)
		if (this.gridHeight * 2 > this.gridWidth) {
			this.gridHeight = Math.round(this.gridWidth / 2)
		}
		if (this.gridWidth / 2 > this.gridHeight) {
			this.gridWidth = Math.round(this.gridHeight * 2)
		}

		// Calculate start position
		this.startX = padding_left * window.devicePixelRatio + Math.round(width - padding_left * window.devicePixelRatio - GROUND_PADDING_RIGHT * window.devicePixelRatio - this.gridWidth) / 2
		this.startY = padding_top + (height - this.gridHeight - GROUND_PADDING_BOTTOM * window.devicePixelRatio - padding_top) / 2

		// Taille des cases
		this.tileSizeX = this.gridWidth / this.field.tilesX
		this.tileSizeY = this.gridHeight / this.field.tilesY

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

			// Translate
			this.textureCtx.save()
			this.textureCtx.translate(this.startX, this.startY)

			// Draw pattern
			this.game.map.random.seed(this.game.map.seed)
			this.game.map.createPattern()
			this.drawPattern(this.textureCtx)

			// Draw lines
			this.drawGrid(this.textureCtx)

			// Détails spécifiques à la carte
			if (!this.game.plainBackground && this.game.map.drawDetails) {
				this.textureCtx.save()
				this.textureCtx.scale(this.game.ground.scale, this.game.ground.scale)
				this.game.map.random.seed(this.game.map.seed)
				this.game.map.drawDetails(this.textureCtx)
				this.textureCtx.restore()
			}


			// Draw checkerboard
			if (this.game.tactic) {
				this.textureCtx.save()
				this.textureCtx.fillStyle = 'black'
				this.textureCtx.globalAlpha = 0.11

				for (const cell of this.field.cells) {

					if (((cell.x + cell.y) % 2) || cell.obstacle) { continue }

					this.textureCtx.save()
					const xy = this.field.cellToXY(cell)
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
			// Détails de chaque case
			if (!this.game.plainBackground) {
				this.drawCellDetails(this.textureCtx)
			}

			// Draw map decor
			if (this.game.map.drawDecor) {
				this.game.map.random.seed(this.game.map.seed)
				this.textureCtx.save()
				this.textureCtx.scale(this.game.ground.scale, this.game.ground.scale)
				this.game.map.drawDecor(this.textureCtx)
				this.textureCtx.restore()
			}

			// Obstacles shadows
			if (shadows && this.game.data.map.type !== -1) {
				for (const obstacle of this.obstacles) {
					obstacle.drawShadow(this.textureCtx)
				}
			}

			// Black stripes
			// this.textureCtx.fillStyle = '#000'
			// const topHeight = this.startY - 110 * this.scale
			// this.textureCtx.fillRect(-this.startX, -this.startY, this.width, topHeight)
			// const bottomFree = this.height - (this.startY + this.gridHeight)
			// const bottomHeight = Math.max(0, bottomFree - 110 * this.scale)
			// this.textureCtx.fillRect(-this.startX, this.gridHeight + (bottomFree - bottomHeight), this.width, bottomHeight)

			this.textureCtx.scale(this.scale, this.scale)
		}
	}

	public drawPattern(ctx: CanvasRenderingContext2D) {

		ctx.save()
		const TILE_SIZE = this.game.map.options.backgroundTileSize
		const gw = TILE_SIZE * this.tileSizeX
		const gh = TILE_SIZE * this.tileSizeY
		const d = gw / Math.sqrt(2)
		const W = this.texture!.width / gw + 2
		const H = this.texture!.height / gh + 1

		if (this.game.plainBackground) {
			ctx.fillStyle = this.game.map.options.backgroundColor
			ctx.fillRect(-this.startX, -this.startY, this.width, this.height)
		} else {
			ctx.translate(-this.startX, -this.startY - gh)
			for (let y = 0; y < H; ++y) {
				for (let x = 0; x < W; ++x) {
					ctx.save()
					ctx.translate(x * gw, y * gh)
					ctx.save()
					ctx.scale(1.01, 0.501)
					ctx.rotate(Math.PI / 4)
					ctx.drawImage(this.game.map.options.groundTexture.texture, 0, 0, d, d)
					ctx.restore()

					ctx.translate(gw / 2, gh / 2)
					ctx.scale(1.01, 0.501)
					ctx.rotate(Math.PI / 4)
					ctx.drawImage(this.game.map.options.groundTexture.texture, 0, 0, d, d)
					ctx.restore()
				}
			}
			ctx.restore()
		}


		const pattern = document.createElement("canvas")
		pattern.width = this.gridWidth
		pattern.height = this.gridHeight
		const pctx = pattern.getContext('2d')!
		const PATTERN_TILE_SIZE = this.game.map.options.patternTileSize
		const pw = PATTERN_TILE_SIZE * this.tileSizeX
		const ph = PATTERN_TILE_SIZE * this.tileSizeY
		const PW = this.texture!.width / pw + 2
		const PH = this.texture!.height / ph + 1
		const pd = pw / Math.sqrt(2)

		if (!this.game.map.options.smoothPattern) {
			ctx.imageSmoothingEnabled = false
		}
		if (this.game.plainBackground) {
			pctx.fillStyle = this.game.map.options.patternColor
			pctx.fillRect(-this.startX, -this.startY, this.width, this.height)
		} else {
			pctx.save()
			pctx.translate(0, -ph)
			for (let y = 0; y < PH; ++y) {
				for (let x = 0; x < PW; ++x) {
					pctx.save()
					pctx.translate(x * pw, y * ph)
					pctx.save()
					pctx.scale(1, 0.5)
					pctx.rotate(Math.PI / 4)
					pctx.drawImage(this.game.map.options.patternTexture.texture, 0, 0, pd, pd)
					pctx.restore()

					pctx.translate(pw / 2, ph / 2)
					pctx.scale(1, 0.5)
					pctx.rotate(Math.PI / 4)
					pctx.drawImage(this.game.map.options.patternTexture.texture, 0, 0, pd, pd)
					pctx.restore()
				}
			}
			pctx.restore()
			ctx.imageSmoothingEnabled = true
		}

		const cw = this.tileSizeX / 2 / Math.sqrt(2)

		// Coupe des bords
		pctx.globalCompositeOperation = 'destination-out'
		for (let i = 0; i < this.width; ++i) {
			pctx.save()
			pctx.translate(i * this.tileSizeX, 0)
			pctx.scale(1, 0.5)
			pctx.rotate(Math.PI / 4)
			pctx.beginPath()
			pctx.moveTo(-cw, cw)
			pctx.lineTo(cw, cw)
			pctx.lineTo(cw, -cw)
			pctx.lineTo(-cw, -cw)
			pctx.closePath()
			pctx.fill()
			pctx.restore()

			pctx.save()
			pctx.translate(i * this.tileSizeX, this.gridHeight)
			pctx.scale(1, 0.5)
			pctx.rotate(Math.PI / 4)
			pctx.beginPath()
			pctx.moveTo(-cw, cw)
			pctx.lineTo(cw, cw)
			pctx.lineTo(cw, -cw)
			pctx.lineTo(-cw, -cw)
			pctx.closePath()
			pctx.fill()
			pctx.restore()
		}
		for (let i = 0; i < this.height; ++i) {
			pctx.save()
			pctx.translate(0, i * this.tileSizeY)
			pctx.scale(1, 0.5)
			pctx.rotate(Math.PI / 4)
			pctx.beginPath()
			pctx.moveTo(-cw, cw)
			pctx.lineTo(cw, cw)
			pctx.lineTo(cw, -cw)
			pctx.lineTo(-cw, -cw)
			pctx.closePath()
			pctx.fill()
			pctx.restore()

			pctx.save()
			pctx.translate(this.gridWidth, i * this.tileSizeY)
			pctx.scale(1, 0.5)
			pctx.rotate(Math.PI / 4)
			pctx.beginPath()
			pctx.moveTo(-cw, cw)
			pctx.lineTo(cw, cw)
			pctx.lineTo(cw, -cw)
			pctx.lineTo(-cw, -cw)
			pctx.closePath()
			pctx.fill()
			pctx.restore()
		}

		pctx.save()
		pctx.globalCompositeOperation = 'destination-out'

		for (const cell of this.field.cells) {

			const xy = this.field.cellToXY(cell)
			const px = this.xyToXYPixels(xy.x, xy.y)

			pctx.save()
			pctx.translate(px.x * this.scale, px.y * this.scale)

			pctx.scale(1, 0.5)
			pctx.rotate(Math.PI / 4)

			if (!cell.color) {
				pctx.beginPath()
				pctx.moveTo(-cw, cw)
				pctx.lineTo(cw, cw)
				pctx.lineTo(cw, -cw)
				pctx.lineTo(-cw, -cw)
				pctx.closePath()
				pctx.fill()
			} else {

				const E = this.game.map.options.radius * this.scale
				const M = this.game.map.options.margin * this.scale
				const C = Math.min(M, E)

				const n1 = this.field.next_cell(cell, -1, 0)
				const n2 = this.field.next_cell(cell, 0, 1)
				const n3 = this.field.next_cell(cell, 1, 0)
				const n4 = this.field.next_cell(cell, 0, -1)
				const n5 = this.field.next_cell(cell, -1, 1)
				const n6 = this.field.next_cell(cell, 1, 1)
				const n7 = this.field.next_cell(cell, 1, -1)
				const n8 = this.field.next_cell(cell, -1, -1)

				const a1 = n1 && n1.color
				const a2 = n2 && n2.color
				const a3 = n3 && n3.color
				const a4 = n4 && n4.color
				const a5 = n5 && n5.color
				const a6 = n6 && n6.color
				const a7 = n7 && n7.color
				const a8 = n8 && n8.color

				// Côtés
				if (!a1) { pctx.fillRect(-cw, -cw + M, M, 2 * cw - 2 * M) }
				if (!a2) { pctx.fillRect(-cw + M, cw - M, 2 * cw - 2 * M, M) }
				if (!a3) { pctx.fillRect(cw - M, -cw + M, M, 2 * cw - 2 * M) }
				if (!a4) { pctx.fillRect(-cw + M, -cw, 2 * cw - 2 * M, M) }

				// Coins
				if (!a4 || !a1) { pctx.fillRect(-cw, -cw, M, M) }
				if (!a3 || !a4) { pctx.fillRect(cw - M, -cw, M, M) }
				if (!a2 || !a3) { pctx.fillRect(cw - M, cw - M, M, M) }
				if (!a1 || !a2) { pctx.fillRect(-cw, cw - M, M, M) }

				// Coins inversés
				if (a3 && a4 && !a7) {
					pctx.beginPath()
					pctx.moveTo(cw, -cw)
					pctx.lineTo(cw, -cw + M)
					pctx.lineTo(cw - M + C, -cw + M)
					pctx.quadraticCurveTo(cw - M, -cw + M, cw - M, -cw + M - C)
					pctx.lineTo(cw - M, -cw)
					pctx.closePath()
					pctx.fill()
				}
				if (a4 && a1 && !a8) {
					pctx.beginPath()
					pctx.moveTo(-cw, -cw)
					pctx.lineTo(-cw + M, -cw)
					pctx.lineTo(-cw + M, -cw + M - C)
					pctx.quadraticCurveTo(-cw + M, -cw + M, -cw + M - C, -cw + M)
					pctx.lineTo(-cw, -cw + M)
					pctx.closePath()
					pctx.fill()
				}
				if (a1 && a2 && !a5) {
					pctx.beginPath()
					pctx.moveTo(-cw, cw)
					pctx.lineTo(-cw + M, cw)
					pctx.lineTo(-cw + M, cw - M + C)
					pctx.quadraticCurveTo(-cw + M, cw - M, -cw + M - C, cw - M)
					pctx.lineTo(-cw, cw - M)
					pctx.closePath()
					pctx.fill()
				}
				if (a2 && a3 && !a6) {
					pctx.beginPath()
					pctx.moveTo(cw, cw)
					pctx.lineTo(cw - M, cw)
					pctx.lineTo(cw - M, cw - M + C)
					pctx.quadraticCurveTo(cw - M, cw - M, cw - M + C, cw - M)
					pctx.lineTo(cw, cw - M)
					pctx.closePath()
					pctx.fill()
				}

				// Coins arrondis
				if (!a1 && !a2) {
					pctx.beginPath()
					pctx.moveTo(-cw + M, cw - M - M)
					pctx.lineTo(-cw + M, cw - M)
					pctx.lineTo(-cw + M + E, cw - M)
					pctx.quadraticCurveTo(-cw + M, cw - M, -cw + M, cw - M - E)
					pctx.closePath()
					pctx.fill()
				}
				if (!a2 && !a3) {
					pctx.beginPath()
					pctx.moveTo(cw - M - E, cw - M)
					pctx.lineTo(cw - M, cw - M)
					pctx.lineTo(cw - M, cw - M - E)
					pctx.quadraticCurveTo(cw - M, cw - M, cw - M - E, cw - M)
					pctx.closePath()
					pctx.fill()
				}
				if (!a3 && !a4) {
					pctx.beginPath()
					pctx.moveTo(cw - M, -cw + M + E)
					pctx.lineTo(cw - M, -cw + M)
					pctx.lineTo(cw - M - E, -cw + M)
					pctx.quadraticCurveTo(cw - M, -cw + M, cw - M, -cw + M + E)
					pctx.closePath()
					pctx.fill()
				}
				if (!a4 && !a1) {
					pctx.beginPath()
					pctx.moveTo(-cw + M + E, -cw + M)
					pctx.lineTo(-cw + M, -cw + M)
					pctx.lineTo(-cw + M, -cw + M + E)
					pctx.quadraticCurveTo(-cw + M, -cw + M, -cw + M + E, -cw + M)
					pctx.closePath()
					pctx.fill()
				}
			}
			pctx.restore()
		}
		pctx.restore()
		pctx.globalCompositeOperation = 'source-over'

		if (!this.game.map.options.smoothPattern) {
			ctx.imageSmoothingEnabled = false
		}

		ctx.drawImage(pattern, 0, 0)
		ctx.imageSmoothingEnabled = true
	}

	public drawCellDetails(ctx: CanvasRenderingContext2D) {
		ctx.save()
		this.game.map.random.seed(this.game.map.seed)
		for (const cell of this.field.cells) {

			const xy = this.field.cellToXY(cell)
			const px = this.xyToXYPixels(xy.x, xy.y)

			ctx.save()
			ctx.translate(px.x * this.scale, px.y * this.scale)

			this.game.map.drawCellDetails(ctx, cell)

			ctx.restore()
		}
		ctx.restore()
	}

	public drawGrid(ctx: CanvasRenderingContext2D) {

		ctx.save()
		ctx.strokeStyle = this.game.map.options.gridColor
		ctx.globalAlpha = this.game.tactic ? 0.25 : 0.18
		ctx.lineWidth = 1.3 * this.scale

		for (let i = 0; i < this.field.tilesX; i++) {

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
		ctx.restore()
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
		// eslint-disable-next-line no-self-assign
		ctx.canvas.width = ctx.canvas.width

		// Set origin at the start postion of the ground
		ctx.save()
		ctx.translate(this.startX, this.startY)
	}

	public drawCellNumbers(ctx: CanvasRenderingContext2D) {

		ctx.save()
		ctx.strokeStyle = '#333'
		ctx.lineWidth = 1.5
		ctx.fillStyle = '#fff'
		const size = Math.max(6, Math.floor(8 * this.scale))
		ctx.font = "bold " + size + "pt Roboto"
		ctx.textAlign = "center"
		ctx.textBaseline = "middle"

		let cell = 0

		for (let i = 0; i < this.field.tilesY * 2 - 1; ++i) {

			const big = i % 2 === 0
			const num = big ? this.field.tilesX : this.field.tilesX - 1

			for (let j = 0; j < num; ++j) {
				ctx.strokeText('' + cell, j * this.tileSizeX + this.tileSizeX / 2 + ((big ? 0 : 1) * this.tileSizeX / 2), i * this.tileSizeY / 2 + this.tileSizeY / 2)
				ctx.fillText('' + cell, j * this.tileSizeX + this.tileSizeX / 2 + ((big ? 0 : 1) * this.tileSizeX / 2), i * this.tileSizeY / 2 + this.tileSizeY / 2)
				cell++
			}
		}
		ctx.globalAlpha = 1
		ctx.lineWidth = 1
		ctx.restore()
	}

	public endDraw(ctx: CanvasRenderingContext2D) {
		ctx.restore()
	}

	public xyToXYPixels(x: number, y: number) {
		return new Position(
			x * this.realTileSizeX / 2 + this.realTileSizeX / 2,
			y * this.realTileSizeY / 2 + this.realTileSizeY / 2,
		)
	}
}

export { Ground, GROUND_PADDING_TOP, GROUND_PADDING_BOTTOM, GROUND_PADDING_RIGHT, GROUND_PADDING_LEFT }
