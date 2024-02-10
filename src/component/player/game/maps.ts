import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { S, Sound } from '@/component/player/game/sound'
import { T, Texture } from '@/component/player/game/texture'
import { Cell } from '@/model/cell'
import { LeekWars } from '@/model/leekwars'
import { GROUNDS, GroundTexture, OBSTACLES, ObstacleInfo } from './ground'

class MapOptions {
	public sound!: Sound
	public groundTexture!: Texture
	public patternTexture!: GroundTexture
	public margin!: number
	public radius!: number
	public smallObstacles!: Array<ObstacleInfo | null>
	public largeObstacles!: Array<ObstacleInfo | null>
	public tacticSmallColor!: string
	public tacticLargeColor!: string
	public gridColor!: string
	public smoothPattern!: boolean
	public dark!: boolean
	public reachableColor!: string
	public backgroundColor!: string
	public patternColor!: string
	public backgroundTileSize!: number
	public patternTileSize!: number
	public checkerboardColor!: string
}

class RandomGenerator {
	private n = 0
	seed(s: number) {
		this.n = s
	}
	next() {
		this.n = (this.n * 1103515245 + 12345) % 2147483648
		return this.n / 2147483648
	}
}

abstract class Map {
	public game: Game
	public options: MapOptions
	public tacticSmallColors: string[]
	public tacticLargeColors: string[]
	public seed: number = 0
	public random = new RandomGenerator()

	constructor(game: Game, options: MapOptions) {
		this.game = game
		this.options = options
		this.tacticSmallColors = [
			options.tacticSmallColor,
			LeekWars.shadeColor(options.tacticSmallColor, -35),
			LeekWars.shadeColor(options.tacticSmallColor, -70),
		]
		this.tacticLargeColors = [
			options.tacticLargeColor,
			LeekWars.shadeColor(options.tacticLargeColor, -35),
			LeekWars.shadeColor(options.tacticLargeColor, -70),
		]
	}
	create() {
		this.options.sound.load(this.game)
		this.options.groundTexture.load(this.game)
		this.options.patternTexture.texture.load(this.game)
		for (const texture of this.options.smallObstacles) {
			if (texture) {
				texture.texture.load(this.game)
			}
		}
		for (const texture of this.options.largeObstacles) {
			if (texture) {
				texture.texture.load(this.game)
			}
		}
		const patterns = new Set<Texture>()
		for (const cell in this.game.data.map.pattern) {
			patterns.add(GROUNDS[this.game.data.map.pattern[cell]].texture)
		}
		patterns.forEach(p => p.load(this.game))

		const obstacles = new Set<Texture>()
		if (this.game.data.map.id) {
			for (const o in this.game.data.map.obstacles) {
				obstacles.add(OBSTACLES[this.game.data.map.obstacles[o] as unknown as number].texture)
			}
		}
		obstacles.forEach(p => p.load(this.game))

		this.update()
	}
	update() {
		this.random.seed(this.seed)
		// Set obstacles types
		for (const o in this.game.ground.obstacles) {
			this.game.ground.obstacles[o].updateType()
		}
		// Pattern
		this.random.seed(this.seed)
		this.createPattern()
	}
	createPattern() {
		// nothing by default
	}
	drawDecor(ctx: CanvasRenderingContext2D) {
		// nothing by default
	}
	drawDetails(ctx: CanvasRenderingContext2D) {
		// nothing by default
	}
	drawCellDetails(ctx: CanvasRenderingContext2D, cell: Cell) {
		// nothing by default
	}
}

class Beach extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_beach,
			groundTexture: T.beach,
			patternTexture: GROUNDS[12], // water
			margin: 10,
			radius: 10,
			smallObstacles: [OBSTACLES[29], OBSTACLES[29], OBSTACLES[30], OBSTACLES[32]],
			largeObstacles: [OBSTACLES[31], OBSTACLES[31], OBSTACLES[31]],
			tacticSmallColor: '#00bea7',
			tacticLargeColor: '#555555',
			gridColor: '#000',
			smoothPattern: true,
			dark: false,
			reachableColor: '#333',
			backgroundColor: '#f8efda',
			patternColor: '#cbedec',
			backgroundTileSize: 10,
			patternTileSize: 10,
			checkerboardColor: '#0002'
		})
		T.starfish.offset = 1.1
		T.pebble.offset = 0.85
		T.pebble_small.offset = 0.9
		T.ball.offset = 0.85
		T.beach_grass.offset = 2.2
	}

	public create() {
		super.create()
		T.starfish.load(this.game)
		T.palm.load(this.game)
	}

	public createPattern() {
		for (const cell of this.game.ground.field.cells) {
			cell.color = 0
		}
		const circles = 10 + this.game.map.random.next() * 10
		for (let c = 0; c < circles; ++c) {
			const radius = 1 + this.game.map.random.next() * (this.game.map.random.next() > 0.1 ? 2.5 : 6)
			const cx = -17 + this.game.map.random.next() * 34 | 0
			const cy = -17 + this.game.map.random.next() * 34 | 0
			if (Math.abs(cx) + Math.abs(cy) >= 17) { continue }
			for (let x = cx - radius | 0; x <= cx + radius; ++x) {
				for (let y = cy - radius | 0; y <= cy + radius; ++y) {
					if (Math.abs(x) + Math.abs(y) <= 17 && Math.round(Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2))) <= radius) {
						const cell = this.game.ground.field.getCell(x, y)
						if (cell) { cell.color = this.options.patternTexture.id }
					}
				}
			}
		}
	}

	public drawDetails(ctx: CanvasRenderingContext2D) {

		const numB = 20 + this.random.next() * 20
		const r = T.starfish.texture.height / T.starfish.texture.width

		for (let i = 0; i < numB; ++i) {
			const s = 20 + this.random.next() * 10
			const x = -100 + this.random.next() * (200 + this.game.ground.gridWidth / this.game.ground.scale)
			const y = -100 + this.random.next() * (200 + this.game.ground.gridHeight / this.game.ground.scale)
			ctx.save()
			ctx.translate(x, y)

			ctx.drawImage(T.starfish.texture, -s / 2, -s * r, s, s * r)
			ctx.restore()
		}
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {
		ctx.save()

		// Branches du haut
		let x = -100
		const top = this.game.ground.startY / this.game.ground.scale
		for (let b = 0; b < 10; ++b) {
			const brightness = 20 + this.random.next() * 40
			ctx.filter = "brightness(" + brightness  + "%)"
			const h = 100 + this.random.next() * 80
			const y = - top - Math.max(0, h - top)
			const w = h * (T.palm.texture.width / T.palm.texture.height)
			ctx.drawImage(T.palm.texture, x, y, w, h)
			x += 50 + this.random.next() * 200
		}

		// Branches du bas
		const height = this.game.ground.height / this.game.ground.scale
		const bottom = height - top
		const padding_bottom = height - top - this.game.ground.gridHeight / this.game.ground.scale
		x = -100
		for (let b = 0; b < 10; ++b) {
			const brightness = 20 + this.random.next() * 40
			ctx.filter = "brightness(" + brightness  + "%)"
			const h = 100 + this.random.next() * 80
			const y = bottom + Math.max(0, h - padding_bottom)
			const w = h * (T.palm.texture.width / T.palm.texture.height)
			ctx.save()
			ctx.translate(x, y)
			ctx.scale(1, -1)
			ctx.drawImage(T.palm.texture, 0, 0, w, h)
			x += 50 + this.random.next() * 200
			ctx.restore()
		}
		ctx.restore()
	}
}

class Desert extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_desert,
			groundTexture: T.desert,
			patternTexture: GROUNDS[6], // desert_pattern
			margin: 10,
			radius: 30,
			smallObstacles: [OBSTACLES[13], OBSTACLES[16], OBSTACLES[14]],
			largeObstacles: [OBSTACLES[14], OBSTACLES[15], OBSTACLES[17]],
			tacticSmallColor: "#007015",
			tacticLargeColor: "#888888",
			gridColor: '#000',
			smoothPattern: true,
			dark: false,
			reachableColor: '#333',
			backgroundColor: '#fbbe36',
			patternColor: '#daccba',
			backgroundTileSize: 8,
			patternTileSize: 4,
			checkerboardColor: '#0002'
		})
		T.cactus.offset = 1.6
		T.desert_grass.offset = 0.85
		T.dead_tree.offset = 0.9
	}

	public create() {
		super.create()
		T.skull.load(this.game)
		T.caillou.load(this.game)
		T.cracks.load(this.game)
	}

	public createPattern() {
		for (const cell of this.game.ground.field.cells) {
			cell.color = 0
		}
		const circles = 15 + this.game.map.random.next() * 25
		for (let c = 0; c < circles; ++c) {
			const radius = 1 + this.game.map.random.next() * 2
			const cx = -17 + this.game.map.random.next() * 34 | 0
			const cy = -17 + this.game.map.random.next() * 34 | 0
			if (Math.abs(cx) + Math.abs(cy) >= 17) { continue }
			for (let x = cx - radius | 0; x <= cx + radius; ++x) {
				for (let y = cy - radius | 0; y <= cy + radius; ++y) {
					if (Math.abs(x) + Math.abs(y) <= 17 && Math.round(Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2))) <= radius) {
						const cell = this.game.ground.field.getCell(x, y)
						if (cell) { cell.color = this.options.patternTexture.id }
					}
				}
			}
		}
	}

	public drawCellDetails(ctx: CanvasRenderingContext2D, cell: Cell) {

		const w = this.game.ground.tileSizeX * 0.8
		const h = this.game.ground.tileSizeY * 0.8

		if (!cell.color) { return }

		const tex =  T.caillou
		const count = this.random.next() * 4 | 0
		const minS = 2
		const maxS = 9

		for (let i = 0; i < count; ++i) {
			// const lum = Math.floor(90 + Math.random() * 10)
			// ctx.filter = "brightness(" + lum + "%)"
			const s = (minS + this.random.next() * maxS) * this.game.ground.scale
			const angle = this.random.next() * Math.PI * 2
			const dist = this.random.next()
			const x = Math.cos(angle) * w * dist * 0.5
			const y = Math.sin(angle) * h * dist * 0.5
			ctx.save()
			ctx.translate(x, y)

			// if (tex.shadow) {
			// 	ctx.save()
			// 	ctx.scale(1, -SHADOW_SCALE)
			// 	ctx.rotate(-Math.PI / 4)
			// 	ctx.translate(0, -s)
			// 	ctx.globalAlpha = SHADOW_ALPHA
			// 	ctx.drawImage(tex.shadow, -s / 2, 0, s, s)
			// 	ctx.restore()
			// }

			ctx.drawImage(tex.texture, -s / 2, -s, s, s)
			ctx.restore()
		}
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {
		const num = 4 + this.random.next() * 6
		for (let i = 0; i < num; i++) {
			const scale = this.random.next() + 0.5
			const x = this.random.next() * (this.game.ground.gridWidth / this.game.ground.scale)
			const y = this.random.next() * (this.game.ground.gridHeight / this.game.ground.scale)
			const angle = this.random.next() * 2 * Math.PI
			ctx.save()
			ctx.translate(x, y)
			ctx.scale(scale, scale * 0.5)
			ctx.rotate(angle)
			ctx.drawImage(T.skull.texture, 0, 0)
			ctx.restore()
		}

		const numC = 4 + this.random.next() * 6
		for (let i = 0; i < numC; i++) {
			const scale = 100 + this.random.next() * 80
			const x = this.random.next() * (this.game.ground.gridWidth / this.game.ground.scale)
			const y = this.random.next() * (this.game.ground.gridHeight / this.game.ground.scale)
			const angle = this.random.next() * 2 * Math.PI
			ctx.save()
			ctx.globalAlpha = 0.2 + this.random.next() * 0.5
			ctx.translate(x, y)
			ctx.scale(1, 0.5)
			ctx.rotate(angle)
			ctx.drawImage(T.cracks.texture, 0, 0, scale, scale)
			ctx.restore()
		}
	}
}


class Factory extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_factory,
			groundTexture: T.factory_metal_2,
			patternTexture: GROUNDS[4], // factory_metal
			margin: 8,
			radius: 3,
			smallObstacles: [OBSTACLES[8], OBSTACLES[6], OBSTACLES[9], OBSTACLES[5], OBSTACLES[7]],
			largeObstacles: [OBSTACLES[5], OBSTACLES[11], OBSTACLES[7], OBSTACLES[12], OBSTACLES[10]],
			tacticSmallColor: "#0f64db",
			tacticLargeColor: "#e05a00",
			gridColor: '#fff',
			smoothPattern: true,
			dark: true,
			reachableColor: '#fff',
			backgroundColor: '#555',
			patternColor: '#aaa',
			backgroundTileSize: 4,
			patternTileSize: 4,
			checkerboardColor: '#fff2'
		})
		T.barrel.offset = 0.9
		T.cone.offset = 1.15
		T.box.offset = 1.2
		T.metal_box.offset = 0.95
		T.box_new.offset = 0.9
		T.box_stack.offset = 1
		T.pipes.offset = 0.9
	}

	public create() {
		super.create()
		T.arrows.load(this.game)
		T.factory_bolt.load(this.game)
		T.factory_wrench.load(this.game)
	}

	public createPattern() {
		const threshold = this.game.map.random.next() * 0.9
		const divider = 0.5 + this.game.map.random.next() * 3
		for (const cell of this.game.ground.field.cells) {
			cell.color = Math.cos((Math.pow(cell.x, 2) + Math.pow(cell.y, 2)) / divider) > threshold ? this.options.patternTexture.id : 0
		}
	}

	public drawDetails(ctx: CanvasRenderingContext2D) {

		const num = 4 + this.random.next() * 3

		for (let i = 0; i < num; i++) {

			const texture = T.arrows.texture
			const scale = 0.3 + this.random.next() * 0.2
			const alpha = 0.9
			const x = -100 + this.random.next() * (200 + this.game.ground.gridWidth / this.game.ground.scale)
			const y = -100 + this.random.next() * (200 + this.game.ground.gridHeight / this.game.ground.scale)
			const color = Math.floor(this.random.next() * 3)
			const angle = this.random.next() > 0.5 ? -Math.PI / 4 : Math.PI / 4

			ctx.save()
			if (color === 0) {
				// rouge de base
			} else if (color === 1) { // jaune
				ctx.filter = "hue-rotate(66deg) brightness(260%)"
			} else { // blanc
				ctx.filter = "saturate(0%) brightness(400%)"
			}
			ctx.globalAlpha = alpha
			ctx.translate(x, y)
			ctx.scale(scale, scale * 0.5)
			ctx.rotate(angle)
			ctx.drawImage(texture, 0, 0)
			ctx.restore()
		}

		const numB = 40 + this.random.next() * 60
		const r = T.factory_bolt.texture.height / T.factory_bolt.texture.width

		for (let i = 0; i < numB; ++i) {
			const s = this.random.next() > 0.8 ? 18 : 12
			const x = -100 + this.random.next() * (200 + this.game.ground.gridWidth / this.game.ground.scale)
			const y = -100 + this.random.next() * (200 + this.game.ground.gridHeight / this.game.ground.scale)
			ctx.save()
			ctx.translate(x, y)

			ctx.save()
			ctx.scale(1, -SHADOW_SCALE)
			ctx.rotate(-Math.PI / 4)
			ctx.translate(0, -s * r)
			ctx.globalAlpha = SHADOW_ALPHA
			ctx.drawImage(T.factory_bolt.shadow!, -s / 2, 0, s, s * r)
			ctx.restore()

			ctx.drawImage(T.factory_bolt.texture, -s / 2, -s * r, s, s * r)
			ctx.restore()
		}

		const numW = 4 + this.random.next() * 6
		const rw = T.factory_wrench.texture.height / T.factory_wrench.texture.width

		for (let i = 0; i < numW; ++i) {
			const s = 35 + this.random.next() * 15
			const x = -100 + this.random.next() * (200 + this.game.ground.gridWidth / this.game.ground.scale)
			const y = -100 + this.random.next() * (200 + this.game.ground.gridHeight / this.game.ground.scale)
			const scale = this.random.next() > 0.5 ? -1 : 1
			ctx.save()
			ctx.translate(x, y)
			ctx.scale(scale, 1)

			ctx.drawImage(T.factory_wrench.texture, -s / 2, -s * r, s, s * rw)
			ctx.restore()
		}
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {
		ctx.save()
		const top = this.game.ground.startY / this.game.ground.scale
		// En haut
		ctx.filter = "brightness(20%)"
		for (let i = 0; i < 20; ++i) {
			const small = this.random.next() > 0.5
			const s = ((small ? 70 : 90) + this.random.next() * 50)
			const t = small ? this.options.smallObstacles[this.random.next() * this.options.smallObstacles.length | 0]! : this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
			const h = s * (t.texture.texture.height / t.texture.texture.width)
			const y = Math.min(- h, -top + 60 - h + this.random.next() * 40)
			ctx.drawImage(t.texture.texture, -150 + i * 80 + this.random.next() * 40, y, s, h)
		}
		// En bas
		const height = this.game.ground.height / this.game.ground.scale
		const bottom = height - top
		ctx.filter = "brightness(10%)"
		for (let i = 0; i < 20; ++i) {
			const s = 60 + this.random.next() * 60
			const t = this.options.smallObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
			const y = Math.max(bottom - 90 + this.random.next() * 20, this.game.ground.gridHeight / this.game.ground.scale)
			ctx.drawImage(t.texture.texture, -200 + i * 75 + this.random.next() * 60, y, s, s * (t.texture.texture.height / t.texture.texture.width))
		}
		ctx.restore()
	}
}

class Forest extends Map {
	leafs!: Texture[]

	constructor(game: Game) {
		super(game, {
			sound: S.map_forest,
			groundTexture: T.dirt,
			patternTexture: GROUNDS[8], // forest_grass
			margin: 8,
			radius: 20,
			smallObstacles: [OBSTACLES[20], OBSTACLES[22], OBSTACLES[21]],
			largeObstacles: [OBSTACLES[19], OBSTACLES[18], OBSTACLES[21]],
			tacticSmallColor: "#999999",
			tacticLargeColor: "#a8480d",
			gridColor: '#fff',
			smoothPattern: false,
			dark: true,
			reachableColor: '#fff',
			backgroundColor: '#3b221b',
			patternColor: '#3b940f',
			backgroundTileSize: 4,
			patternTileSize: 4,
			checkerboardColor: '#fff1'
		})
		T.stump.offset = 1.3
		T.fern.offset = 1.1
		T.mushroom.offset = 0.9
		T.forest_rock.offset = 0.88
	}

	public create() {
		super.create()
		T.caillou.load(this.game)
		T.little_grass.load(this.game)
		T.little_grass_2.load(this.game)
		T.branch.load(this.game)
		T.forest_branch.load(this.game)
		T.forest_branch_2.load(this.game)
	}

	public createPattern() {
		for (const cell of this.game.ground.field.cells) {
			cell.color = 0
		}
		const circles = 20 + this.game.map.random.next() * 25
		for (let c = 0; c < circles; ++c) {
			const radius = 1 + this.game.map.random.next() * (this.game.map.random.next() > 0.1 ? 2.5 : 6)
			const cx = -17 + this.game.map.random.next() * 34 | 0
			const cy = -17 + this.game.map.random.next() * 34 | 0
			if (Math.abs(cx) + Math.abs(cy) >= 17) { continue }
			for (let x = cx - radius | 0; x <= cx + radius; ++x) {
				for (let y = cy - radius | 0; y <= cy + radius; ++y) {
					if (Math.abs(x) + Math.abs(y) <= 17 && Math.round(Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2))) <= radius) {
						const cell = this.game.ground.field.getCell(x, y)
						if (cell) { cell.color = this.options.patternTexture.id }
					}
				}
			}
		}
	}

	public drawCellDetails(ctx: CanvasRenderingContext2D, cell: Cell) {

		const w = this.game.ground.tileSizeX * 0.8
		const h = this.game.ground.tileSizeY * 0.8

		if (!cell.color) { return }

		const tex = this.random.next() > 0.5 ? T.little_grass : T.little_grass_2
		const count = this.random.next() * 10
		const minS = 8
		const maxS = 16

		for (let i = 0; i < count; ++i) {
			// const lum = Math.floor(90 + Math.random() * 10)
			// ctx.filter = "brightness(" + lum + "%)"
			const s = (minS + this.random.next() * maxS) * this.game.ground.scale
			const angle = this.random.next() * Math.PI * 2
			const dist = this.random.next()
			const x = Math.cos(angle) * w * dist * 0.5
			const y = Math.sin(angle) * h * dist * 0.5
			ctx.save()
			ctx.translate(x, y)

			if (tex.shadow) {
				ctx.save()
				ctx.scale(1, -SHADOW_SCALE)
				ctx.rotate(-Math.PI / 4)
				ctx.translate(0, -s)
				ctx.globalAlpha = SHADOW_ALPHA
				ctx.drawImage(tex.shadow, -s / 2, 0, s, s)
				ctx.restore()
			}

			ctx.drawImage(tex.texture, -s / 2, -s, s, s)
			ctx.restore()
		}
	}

	public drawDetails(ctx: CanvasRenderingContext2D) {
		// return
		const num = 20 + this.random.next() * 20

		for (let i = 0; i < num; i++) {

			const texture = T.branch.texture
			const scale = 0.4 + this.random.next() * 0.5
			const x = -100 + this.random.next() * (200 + this.game.ground.gridWidth / this.game.ground.scale)
			const y = -100 + this.random.next() * (200 + this.game.ground.gridHeight / this.game.ground.scale)
			const angle = this.random.next() > 0.5 ? -Math.PI / 6 + this.random.next() * 2 * Math.PI / 6 : 5 * Math.PI / 6 + this.random.next() * 2 * Math.PI / 6

			ctx.save()
			ctx.translate(x, y)
			ctx.scale(scale, scale)
			ctx.rotate(angle)
			ctx.drawImage(texture, 0, 0)
			ctx.restore()
		}
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {
		ctx.save()
		const top = this.game.ground.startY / this.game.ground.scale
		// En haut
		for (let i = 0; i < 14; ++i) {
			const s = (120 + this.random.next() * 120)
			const t = this.options.largeObstacles[this.random.next() * (this.options.largeObstacles.length - 1) | 0]!
			const dh = s * (t.texture.texture.height / t.texture.texture.width)
			const y = Math.min(- dh, -top + 100 - dh + this.random.next() * 20)
			ctx.drawImage(t.texture.texture, -150 + i * 100 + this.random.next() * 40, y, s, dh)
		}
		// Devant
		const height = this.game.ground.height / this.game.ground.scale
		const bottom = height - top
		ctx.filter = "brightness(10%)"
		for (let i = 0; i < 12; ++i) {
			const s = 150 + this.random.next() * 130
			const t = this.options.largeObstacles[this.random.next() * (this.options.largeObstacles.length - 1) | 0]!
			const x = -200 + i * 120 + this.random.next() * 60
			const y = Math.max(bottom - 150 + this.random.next() * 20, this.game.ground.gridHeight / this.game.ground.scale)
			ctx.drawImage(t.texture.texture, x, y, s, s * (t.texture.texture.height / t.texture.texture.width))
		}
		// Côté
		for (let i = 0; i < 12; ++i) {
			ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
			const s = 150 + this.random.next() * (80 + i * 8)
			const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
			ctx.drawImage(t.texture.texture, -s - 60 + this.random.next() * 80, -80 + i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.texture.height / t.texture.texture.width))
		}
		for (let i = 0; i < 12; ++i) {
			ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
			const s = 150 + this.random.next() * (80 + i * 8)
			const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
			ctx.drawImage(t.texture.texture, this.game.ground.gridWidth / this.game.ground.scale - 20 + this.random.next() * 60, -80 + i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.texture.height / t.texture.texture.width))
		}
		// Branches
		ctx.filter = "brightness(" + 40  + "%)"
		const h1 = 200 + this.random.next() * 80
		const y1 = Math.min(-h1, -top)
		const x1 = -100 + this.random.next() * 200
		const w1 = h1 * (T.forest_branch.texture.width / T.forest_branch.texture.height)
		ctx.drawImage(T.forest_branch.texture, x1, y1, w1, h1)

		ctx.filter = "brightness(" + 60  + "%)"
		const h2 = 200 + this.random.next() * 80
		const y2 = Math.min(-h2, -top)
		const x2 = -100 + this.random.next() * 200
		const w2 = h2 * (T.forest_branch_2.texture.width / T.forest_branch_2.texture.height)
		ctx.drawImage(T.forest_branch_2.texture, x2 + this.game.ground.width / this.game.ground.scale - w2 - this.game.ground.startX / this.game.ground.scale, y2, w2, h2)

		ctx.restore()
	}
}

class Glacier extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_glacier,
			groundTexture: T.glacier_snow,
			patternTexture: GROUNDS[10], // glacier
			margin: 7,
			radius: 20,
			smallObstacles: [OBSTACLES[27], OBSTACLES[28], OBSTACLES[26], OBSTACLES[24]],
			largeObstacles: [OBSTACLES[25], OBSTACLES[23]],
			tacticSmallColor: "#777777",
			tacticLargeColor: "#333333",
			gridColor: '#000',
			smoothPattern: true,
			dark: false,
			reachableColor: '#333',
			backgroundColor: '#eee',
			patternColor: '#30f6f6',
			backgroundTileSize: 6,
			patternTileSize: 6,
			checkerboardColor: '#0002'
		})
		T.ice.offset = 0.9
		T.fir.offset = 1.1
		T.snowman.offset = 0.9
		T.snow_ball.offset = 0.75
		T.rock_snow.offset = 0.9
		T.bush_snow.offset = 1.05
	}

	public create() {
		super.create()
		T.snowflake.load(this.game)
	}

	public createPattern() {
		for (const cell of this.game.ground.field.cells) {
			cell.color = 0
		}
		const circles = 20 + this.game.map.random.next() * 25
		for (let c = 0; c < circles; ++c) {
			const radius = 1 + this.game.map.random.next() * (this.game.map.random.next() > 0.1 ? 2.5 : 6)
			const cx = -17 + this.game.map.random.next() * 34 | 0
			const cy = -17 + this.game.map.random.next() * 34 | 0
			if (Math.abs(cx) + Math.abs(cy) >= 17) { continue }
			for (let x = cx - radius | 0; x <= cx + radius; ++x) {
				for (let y = cy - radius | 0; y <= cy + radius; ++y) {
					if (Math.abs(x) + Math.abs(y) <= 17 && Math.round(Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2))) <= radius) {
						const cell = this.game.ground.field.getCell(x, y)
						if (cell) { cell.color = this.options.patternTexture.id }
					}
				}
			}
		}
	}

	public drawDetails(ctx: CanvasRenderingContext2D) {

		const numB = 50 + this.random.next() * 100
		const r = T.snowflake.texture.height / T.snowflake.texture.width

		for (let i = 0; i < numB; ++i) {
			const s = 25 + this.random.next() * 25
			const x = -100 + this.random.next() * (200 + this.game.ground.gridWidth / this.game.ground.scale)
			const y = -100 + this.random.next() * (200 + this.game.ground.gridHeight / this.game.ground.scale)
			ctx.save()
			ctx.translate(x, y)

			// ctx.save()
			// ctx.scale(1, -SHADOW_SCALE)
			// ctx.rotate(-Math.PI / 4)
			// ctx.translate(0, -s * r)
			// ctx.globalAlpha = SHADOW_ALPHA
			// ctx.drawImage(T.snowflake.shadow!, -s / 2, 0, s, s * r)
			// ctx.restore()

			ctx.drawImage(T.snowflake.texture, -s / 2, -s * r, s, s * r)
			ctx.restore()
		}
	}
}

class Nexus extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_nexus,
			groundTexture: T.nexus_bg,
			patternTexture: GROUNDS[1], // T.nexus_bg
			margin: 5,
			radius: 10,
			smallObstacles: [OBSTACLES[1], OBSTACLES[1], OBSTACLES[1]],
			largeObstacles: [OBSTACLES[2], OBSTACLES[2], OBSTACLES[2]],
			tacticSmallColor: "#222222",
			tacticLargeColor: "#666666",
			gridColor: '#000',
			smoothPattern: true,
			dark: false,
			reachableColor: '#333',
			backgroundColor: '#fff',
			patternColor: '#fff',
			backgroundTileSize: 8,
			patternTileSize: 8,
			checkerboardColor: '#00000018'
		})
		T.nexus_block.offset = 1.177
		T.nexus_block_small.offset = 1.18
	}
}

class DarkNexus extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_nexus,
			groundTexture: T.nexus_dark_bg,
			patternTexture: GROUNDS[2], // nexus_dark_bg
			margin: 5,
			radius: 10,
			smallObstacles: [OBSTACLES[3], OBSTACLES[3], OBSTACLES[3]],
			largeObstacles: [OBSTACLES[4], OBSTACLES[4], OBSTACLES[4]],
			tacticSmallColor: "#cccccc",
			tacticLargeColor: "#888888",
			gridColor: '#fff',
			smoothPattern: true,
			dark: true,
			reachableColor: '#fff',
			backgroundColor: '#000',
			patternColor: '#000',
			backgroundTileSize: 8,
			patternTileSize: 8,
			checkerboardColor: '#ffffff18'
		})
		T.nexus_dark_block.offset = 1.177
		T.nexus_dark_block_small.offset = 1.18
	}
}

class Arena extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_desert,
			groundTexture: T.arena,
			patternTexture: GROUNDS[14], // arena_pattern
			margin: 5,
			radius: 20,
			smallObstacles: [OBSTACLES[38], OBSTACLES[35], OBSTACLES[36]],
			largeObstacles: [OBSTACLES[34], OBSTACLES[33], OBSTACLES[37]],
			tacticSmallColor: "#a1d100",
			tacticLargeColor: "#3b362d",
			gridColor: '#000',
			smoothPattern: true,
			dark: true,
			reachableColor: '#fff',
			backgroundColor: '#9a8d6b',
			patternColor: '#66822d',
			backgroundTileSize: 4,
			patternTileSize: 4,
			checkerboardColor: '#0003'
		})
		T.grass.offset = 1.5
		T.pillar.offset = 1.1
		T.cube.offset = 1.0
		T.small_cube.offset = 0.9
		T.square.offset = 1.1
	}

	public create() {
		super.create()
		T.little_grass.load(this.game)
		T.little_grass_2.load(this.game)
	}

	public createPattern() {
		for (const cell of this.game.ground.field.cells) {
			cell.color = 0
		}
		const circles = 100 + this.game.map.random.next() * 100
		for (let c = 0; c < circles; ++c) {
			const radius = 0 + this.game.map.random.next() * 1.5
			const cx = -17 + this.game.map.random.next() * 34 | 0
			const cy = -17 + this.game.map.random.next() * 34 | 0
			if (Math.abs(cx) + Math.abs(cy) >= 17) { continue }
			for (let x = cx - radius | 0; x <= cx + radius; ++x) {
				for (let y = cy - radius | 0; y <= cy + radius; ++y) {
					if (Math.abs(x) + Math.abs(y) <= 17 && Math.round(Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2))) < radius) {
						const cell = this.game.ground.field.getCell(x, y)
						if (cell) { cell.color = this.options.patternTexture.id }
					}
				}
			}
		}
	}

	public drawCellDetails(ctx: CanvasRenderingContext2D, cell: Cell) {

		const w = this.game.ground.tileSizeX * 0.8
		const h = this.game.ground.tileSizeY * 0.8

		if (!cell.color) { return }

		const tex = this.random.next() > 0.5 ? T.little_grass : T.little_grass_2
		const count = this.random.next() * 4 | 0
		const minS = 8
		const maxS = 16

		for (let i = 0; i < count; ++i) {
			// const lum = Math.floor(90 + Math.random() * 10)
			// ctx.filter = "brightness(" + lum + "%)"
			const s = (minS + this.random.next() * maxS) * this.game.ground.scale
			const angle = this.random.next() * Math.PI * 2
			const dist = this.random.next()
			const x = Math.cos(angle) * w * dist * 0.5
			const y = Math.sin(angle) * h * dist * 0.5
			ctx.save()
			ctx.translate(x, y)

			if (tex.shadow) {
				ctx.save()
				ctx.scale(1, -SHADOW_SCALE)
				ctx.rotate(-Math.PI / 4)
				ctx.translate(0, -s)
				ctx.globalAlpha = SHADOW_ALPHA
				ctx.drawImage(tex.shadow, -s / 2, 0, s, s)
				ctx.restore()
			}

			ctx.drawImage(tex.texture, -s / 2, -s, s, s)
			ctx.restore()
		}
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {
		ctx.save()
		const top = this.game.ground.startY / this.game.ground.scale
		// En haut
		ctx.filter = "brightness(40%)"
		for (let i = 0; i < 14; ++i) {
			const s = 100 + this.random.next() * 50
			const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
			const h = s * (t.texture.texture.height / t.texture.texture.width)
			const y = Math.min(- h, -top + 20 - h + this.random.next() * 80)
			ctx.drawImage(t.texture.texture, -150 + i * 110 + this.random.next() * 40, y, s, h)
		}
		// En bas
		const height = this.game.ground.height / this.game.ground.scale
		const bottom = height - top
		ctx.filter = "brightness(20%)"
		for (let i = 0; i < 12; ++i) {
			const s = 120 + this.random.next() * 100
			const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
			const y = Math.max(bottom - 90 + this.random.next() * 20, this.game.ground.gridHeight / this.game.ground.scale)
			ctx.drawImage(t.texture.texture, -200 + i * 120 + this.random.next() * 60, y, s, s * (t.texture.texture.height / t.texture.texture.width))
		}

		ctx.restore()
	}
}

class Japan extends Map {
	leafs!: Texture[]

	constructor(game: Game) {
		super(game, {
			sound: S.map_forest,
			groundTexture: T.japan_grass,
			patternTexture: GROUNDS[15], // japan_rock
			margin: 8,
			radius: 20,
			smallObstacles: [OBSTACLES[41], OBSTACLES[40], OBSTACLES[39], OBSTACLES[42]],
			largeObstacles: [OBSTACLES[43], OBSTACLES[44], OBSTACLES[45]],
			tacticSmallColor: "#aa0000",
			tacticLargeColor: "#e3e3e3",
			gridColor: '#aaa',
			smoothPattern: false,
			dark: false,
			reachableColor: '#fff',
			backgroundColor: '#3b940f',
			patternColor: '#999999',
			backgroundTileSize: 4,
			patternTileSize: 4,
			checkerboardColor: '#fff1'
		})
		T.bonzai.offset = 1.1
		T.lantern.offset = 1.2
		T.boxwood.offset = 0.85
		T.bamboo.offset = 1.45
		T.torii_gate.offset = 3.9
		T.torii_gate.nudgeX = -1.5
		T.torii_gate.nudgeY = -0.5
		T.bamboo_strike.offset = 1.05
		T.bamboo_strike.nudgeY = 0.5
		T.lantern_large.offset = 0.8
		T.lantern_large.nudgeY = -0.5
	}

	public create() {
		super.create()
		T.caillou.load(this.game)
		T.little_grass.load(this.game)
		T.little_grass_2.load(this.game)
		T.branch.load(this.game)
		T.forest_branch.load(this.game)
		T.forest_branch_2.load(this.game)
	}

	public createPattern() {
		for (const cell in this.game.data.map.pattern) {
			this.game.ground.field.cells[cell].color = this.game.data.map.pattern[cell]
		}
	}

	public drawCellDetails(ctx: CanvasRenderingContext2D, cell: Cell) {

		const w = this.game.ground.tileSizeX * 0.8
		const h = this.game.ground.tileSizeY * 0.8

		if (cell.color === 7) {

			const tex = this.random.next() > 0.5 ? T.little_grass : T.little_grass_2
			const count = this.random.next() * 15
			const minS = 8
			const maxS = 16

			for (let i = 0; i < count; ++i) {
				const s = (minS + this.random.next() * maxS) * this.game.ground.scale
				const angle = this.random.next() * Math.PI * 2
				const dist = this.random.next()
				const x = Math.cos(angle) * w * dist * 0.5
				const y = Math.sin(angle) * h * dist * 0.5
				ctx.save()
				ctx.translate(x, y)

				if (tex.shadow) {
					ctx.save()
					ctx.scale(1, -SHADOW_SCALE)
					ctx.rotate(-Math.PI / 4)
					ctx.translate(0, -s)
					ctx.globalAlpha = SHADOW_ALPHA
					ctx.drawImage(tex.shadow, -s / 2, 0, s, s)
					ctx.restore()
				}

				ctx.drawImage(tex.texture, -s / 2, -s, s, s)
				ctx.restore()
			}
		} else if (cell.color === 6) {

			const tex = T.caillou
			const count = this.random.next() * 10 | 0
			const minS = 2
			const maxS = 9

			for (let i = 0; i < count; ++i) {
				const s = (minS + this.random.next() * maxS) * this.game.ground.scale
				const angle = this.random.next() * Math.PI * 2
				const dist = this.random.next()
				const x = Math.cos(angle) * w * dist * 0.5
				const y = Math.sin(angle) * h * dist * 0.5
				ctx.save()
				ctx.translate(x, y)
				ctx.drawImage(tex.texture, -s / 2, -s, s, s)
				ctx.restore()
			}
		}
	}

	public drawDetails(ctx: CanvasRenderingContext2D) {

		// const num = 20 + this.random.next() * 20

		// for (let i = 0; i < num; i++) {

		// 	const texture = T.branch.texture
		// 	const scale = 0.4 + this.random.next() * 0.5
		// 	const x = -100 + this.random.next() * (200 + this.game.ground.gridWidth / this.game.ground.scale)
		// 	const y = -100 + this.random.next() * (200 + this.game.ground.gridHeight / this.game.ground.scale)
		// 	const angle = this.random.next() > 0.5 ? -Math.PI / 6 + this.random.next() * 2 * Math.PI / 6 : 5 * Math.PI / 6 + this.random.next() * 2 * Math.PI / 6

		// 	ctx.save()
		// 	ctx.translate(x, y)
		// 	ctx.scale(scale, scale)
		// 	ctx.rotate(angle)
		// 	ctx.drawImage(texture, 0, 0)
		// 	ctx.restore()
		// }
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {

		// ctx.save()
		// const top = this.game.ground.startY / this.game.ground.scale
		// ctx.filter = "brightness(10%)"
		// // En haut
		// for (let i = 0; i < 14; ++i) {
		// 	const s = (120 + this.random.next() * 120)
		// 	const t = this.options.largeObstacles[this.random.next() * (this.options.largeObstacles.length - 1) | 0]!
		// 	const dh = s * (t.texture.texture.height / t.texture.texture.width)
		// 	const y = Math.min(- dh, -top + 100 - dh + this.random.next() * 20)
		// 	ctx.drawImage(t.texture.texture, -150 + i * 100 + this.random.next() * 40, y, s, dh)
		// }
		// // Devant
		// const height = this.game.ground.height / this.game.ground.scale
		// const bottom = height - top
		// for (let i = 0; i < 12; ++i) {
		// 	const s = 150 + this.random.next() * 130
		// 	const t = this.options.smallObstacles[this.random.next() * (this.options.smallObstacles.length - 1) | 0]!
		// 	const x = -200 + i * 120 + this.random.next() * 60
		// 	const y = Math.max(bottom - 150 + this.random.next() * 20, this.game.ground.gridHeight / this.game.ground.scale)
		// 	ctx.drawImage(t.texture.texture, x, y, s, s * (t.texture.texture.height / t.texture.texture.width))
		// }
		// Côté
		// for (let i = 0; i < 12; ++i) {
		// 	ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
		// 	const s = 150 + this.random.next() * (80 + i * 8)
		// 	const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
		// 	ctx.drawImage(t.texture.texture, -s - 60 + this.random.next() * 80, -80 + i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.texture.height / t.texture.texture.width))
		// }
		// for (let i = 0; i < 12; ++i) {
		// 	ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
		// 	const s = 150 + this.random.next() * (80 + i * 8)
		// 	const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
		// 	ctx.drawImage(t.texture.texture, this.game.ground.gridWidth / this.game.ground.scale - 20 + this.random.next() * 60, -80 + i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.texture.height / t.texture.texture.width))
		// }

		// ctx.restore()
	}
}


class Castle extends Map {
	leafs!: Texture[]

	constructor(game: Game) {
		super(game, {
			sound: S.map_forest,
			groundTexture: T.castle,
			patternTexture: GROUNDS[15], // japan_rock
			margin: 8,
			radius: 20,
			smallObstacles: [OBSTACLES[41], OBSTACLES[40], OBSTACLES[39], OBSTACLES[42]],
			largeObstacles: [OBSTACLES[43], OBSTACLES[44], OBSTACLES[45]],
			tacticSmallColor: "#595959",
			tacticLargeColor: "#4661a0",
			gridColor: '#aaa',
			smoothPattern: false,
			dark: false,
			reachableColor: '#fff',
			backgroundColor: '#666666',
			patternColor: '#3b221b',
			backgroundTileSize: 4,
			patternTileSize: 4,
			checkerboardColor: '#fff1'
		})
		T.rampart_north_south.offset = 1.18
		T.rampart_west_east.offset = 1.18
		T.rampart_north_east.offset = 1.18
		T.rampart_south_east.offset = 1.18
		T.rampart_north_west.offset = 1.18
		T.rampart_south_west.offset = 1.18
		T.castle_tower.offset = 1.37
		T.castle_gate.offset = 1.8
		T.castle_gate.nudgeY = 3
		T.castle_gate.nudgeX = 0.
		T.round_table.offset = 0.9
		T.round_table.nudgeY = -1.0
	}

	public create() {
		super.create()
		T.caillou.load(this.game)
		T.little_grass.load(this.game)
		T.little_grass_2.load(this.game)
		T.branch.load(this.game)
		T.forest_branch.load(this.game)
		T.forest_branch_2.load(this.game)
	}

	public createPattern() {
		for (const cell in this.game.data.map.pattern) {
			this.game.ground.field.cells[cell].color = this.game.data.map.pattern[cell]
		}
	}

	public drawCellDetails(ctx: CanvasRenderingContext2D, cell: Cell) {

		const w = this.game.ground.tileSizeX * 0.8
		const h = this.game.ground.tileSizeY * 0.8

		if (cell.color === 7) {

			const tex = this.random.next() > 0.5 ? T.little_grass : T.little_grass_2
			const count = this.random.next() * 15
			const minS = 8
			const maxS = 16

			for (let i = 0; i < count; ++i) {
				const s = (minS + this.random.next() * maxS) * this.game.ground.scale
				const angle = this.random.next() * Math.PI * 2
				const dist = this.random.next()
				const x = Math.cos(angle) * w * dist * 0.5
				const y = Math.sin(angle) * h * dist * 0.5
				ctx.save()
				ctx.translate(x, y)

				if (tex.shadow) {
					ctx.save()
					ctx.scale(1, -SHADOW_SCALE)
					ctx.rotate(-Math.PI / 4)
					ctx.translate(0, -s)
					ctx.globalAlpha = SHADOW_ALPHA
					ctx.drawImage(tex.shadow, -s / 2, 0, s, s)
					ctx.restore()
				}

				ctx.drawImage(tex.texture, -s / 2, -s, s, s)
				ctx.restore()
			}
		} else if (cell.color === 6) {

			const tex = T.caillou
			const count = this.random.next() * 10 | 0
			const minS = 2
			const maxS = 9

			for (let i = 0; i < count; ++i) {
				const s = (minS + this.random.next() * maxS) * this.game.ground.scale
				const angle = this.random.next() * Math.PI * 2
				const dist = this.random.next()
				const x = Math.cos(angle) * w * dist * 0.5
				const y = Math.sin(angle) * h * dist * 0.5
				ctx.save()
				ctx.translate(x, y)
				ctx.drawImage(tex.texture, -s / 2, -s, s, s)
				ctx.restore()
			}
		}
	}

	public drawDetails(ctx: CanvasRenderingContext2D) {

		// const num = 20 + this.random.next() * 20

		// for (let i = 0; i < num; i++) {

		// 	const texture = T.branch.texture
		// 	const scale = 0.4 + this.random.next() * 0.5
		// 	const x = -100 + this.random.next() * (200 + this.game.ground.gridWidth / this.game.ground.scale)
		// 	const y = -100 + this.random.next() * (200 + this.game.ground.gridHeight / this.game.ground.scale)
		// 	const angle = this.random.next() > 0.5 ? -Math.PI / 6 + this.random.next() * 2 * Math.PI / 6 : 5 * Math.PI / 6 + this.random.next() * 2 * Math.PI / 6

		// 	ctx.save()
		// 	ctx.translate(x, y)
		// 	ctx.scale(scale, scale)
		// 	ctx.rotate(angle)
		// 	ctx.drawImage(texture, 0, 0)
		// 	ctx.restore()
		// }
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {

		// ctx.save()
		// const top = this.game.ground.startY / this.game.ground.scale
		// ctx.filter = "brightness(10%)"
		// // En haut
		// for (let i = 0; i < 14; ++i) {
		// 	const s = (120 + this.random.next() * 120)
		// 	const t = this.options.largeObstacles[this.random.next() * (this.options.largeObstacles.length - 1) | 0]!
		// 	const dh = s * (t.texture.texture.height / t.texture.texture.width)
		// 	const y = Math.min(- dh, -top + 100 - dh + this.random.next() * 20)
		// 	ctx.drawImage(t.texture.texture, -150 + i * 100 + this.random.next() * 40, y, s, dh)
		// }
		// // Devant
		// const height = this.game.ground.height / this.game.ground.scale
		// const bottom = height - top
		// for (let i = 0; i < 12; ++i) {
		// 	const s = 150 + this.random.next() * 130
		// 	const t = this.options.smallObstacles[this.random.next() * (this.options.smallObstacles.length - 1) | 0]!
		// 	const x = -200 + i * 120 + this.random.next() * 60
		// 	const y = Math.max(bottom - 150 + this.random.next() * 20, this.game.ground.gridHeight / this.game.ground.scale)
		// 	ctx.drawImage(t.texture.texture, x, y, s, s * (t.texture.texture.height / t.texture.texture.width))
		// }
		// Côté
		// for (let i = 0; i < 12; ++i) {
		// 	ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
		// 	const s = 150 + this.random.next() * (80 + i * 8)
		// 	const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
		// 	ctx.drawImage(t.texture.texture, -s - 60 + this.random.next() * 80, -80 + i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.texture.height / t.texture.texture.width))
		// }
		// for (let i = 0; i < 12; ++i) {
		// 	ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
		// 	const s = 150 + this.random.next() * (80 + i * 8)
		// 	const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
		// 	ctx.drawImage(t.texture.texture, this.game.ground.gridWidth / this.game.ground.scale - 20 + this.random.next() * 60, -80 + i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.texture.height / t.texture.texture.width))
		// }

		// ctx.restore()
	}
}


class Cemetery extends Map {
	leafs!: Texture[]

	constructor(game: Game) {
		super(game, {
			sound: S.map_forest,
			groundTexture: T.cemetery,
			patternTexture: GROUNDS[15], // japan_rock
			margin: 8,
			radius: 20,
			smallObstacles: [OBSTACLES[41], OBSTACLES[40], OBSTACLES[39], OBSTACLES[42]],
			largeObstacles: [OBSTACLES[43], OBSTACLES[44], OBSTACLES[45]],
			tacticSmallColor: "#8a8a8a",
			tacticLargeColor: "#004700",
			gridColor: '#aaa',
			smoothPattern: false,
			dark: true,
			reachableColor: '#fff',
			backgroundColor: '#170800',
			patternColor: '#302c29',
			backgroundTileSize: 4,
			patternTileSize: 4,
			checkerboardColor: '#fff1'
		})
		T.cemetery_cross.offset = 1.4
		T.cemetery_cross.nudgeY = -0.5
		T.cemetery_tomb.offset = 1.2
		T.cemetery_tomb.nudgeY = 0.1
		T.cemetery_lantern.offset = 0.8
		T.cemetery_lantern.nudgeY = -0.5
	}

	public create() {
		super.create()
		T.caillou.load(this.game)
		T.little_grass.load(this.game)
		T.little_grass_2.load(this.game)
		T.branch.load(this.game)
		T.forest_branch.load(this.game)
		T.forest_branch_2.load(this.game)
	}

	public createPattern() {
		for (const cell in this.game.data.map.pattern) {
			this.game.ground.field.cells[cell].color = this.game.data.map.pattern[cell]
		}
	}

	public drawCellDetails(ctx: CanvasRenderingContext2D, cell: Cell) {

		const w = this.game.ground.tileSizeX * 0.8
		const h = this.game.ground.tileSizeY * 0.8

		if (cell.color === 7) {

			const tex = this.random.next() > 0.5 ? T.little_grass : T.little_grass_2
			const count = this.random.next() * 15
			const minS = 8
			const maxS = 16

			for (let i = 0; i < count; ++i) {
				const s = (minS + this.random.next() * maxS) * this.game.ground.scale
				const angle = this.random.next() * Math.PI * 2
				const dist = this.random.next()
				const x = Math.cos(angle) * w * dist * 0.5
				const y = Math.sin(angle) * h * dist * 0.5
				ctx.save()
				ctx.translate(x, y)

				if (tex.shadow) {
					ctx.save()
					ctx.scale(1, -SHADOW_SCALE)
					ctx.rotate(-Math.PI / 4)
					ctx.translate(0, -s)
					ctx.globalAlpha = SHADOW_ALPHA
					ctx.drawImage(tex.shadow, -s / 2, 0, s, s)
					ctx.restore()
				}

				ctx.drawImage(tex.texture, -s / 2, -s, s, s)
				ctx.restore()
			}
		} else if (cell.color === 6) {

			const tex = T.caillou
			const count = this.random.next() * 10 | 0
			const minS = 2
			const maxS = 9

			for (let i = 0; i < count; ++i) {
				const s = (minS + this.random.next() * maxS) * this.game.ground.scale
				const angle = this.random.next() * Math.PI * 2
				const dist = this.random.next()
				const x = Math.cos(angle) * w * dist * 0.5
				const y = Math.sin(angle) * h * dist * 0.5
				ctx.save()
				ctx.translate(x, y)
				ctx.drawImage(tex.texture, -s / 2, -s, s, s)
				ctx.restore()
			}
		}
	}

	public drawDetails(ctx: CanvasRenderingContext2D) {

		// const num = 20 + this.random.next() * 20

		// for (let i = 0; i < num; i++) {

		// 	const texture = T.branch.texture
		// 	const scale = 0.4 + this.random.next() * 0.5
		// 	const x = -100 + this.random.next() * (200 + this.game.ground.gridWidth / this.game.ground.scale)
		// 	const y = -100 + this.random.next() * (200 + this.game.ground.gridHeight / this.game.ground.scale)
		// 	const angle = this.random.next() > 0.5 ? -Math.PI / 6 + this.random.next() * 2 * Math.PI / 6 : 5 * Math.PI / 6 + this.random.next() * 2 * Math.PI / 6

		// 	ctx.save()
		// 	ctx.translate(x, y)
		// 	ctx.scale(scale, scale)
		// 	ctx.rotate(angle)
		// 	ctx.drawImage(texture, 0, 0)
		// 	ctx.restore()
		// }
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {

		// ctx.save()
		// const top = this.game.ground.startY / this.game.ground.scale
		// ctx.filter = "brightness(10%)"
		// // En haut
		// for (let i = 0; i < 14; ++i) {
		// 	const s = (120 + this.random.next() * 120)
		// 	const t = this.options.largeObstacles[this.random.next() * (this.options.largeObstacles.length - 1) | 0]!
		// 	const dh = s * (t.texture.texture.height / t.texture.texture.width)
		// 	const y = Math.min(- dh, -top + 100 - dh + this.random.next() * 20)
		// 	ctx.drawImage(t.texture.texture, -150 + i * 100 + this.random.next() * 40, y, s, dh)
		// }
		// // Devant
		// const height = this.game.ground.height / this.game.ground.scale
		// const bottom = height - top
		// for (let i = 0; i < 12; ++i) {
		// 	const s = 150 + this.random.next() * 130
		// 	const t = this.options.smallObstacles[this.random.next() * (this.options.smallObstacles.length - 1) | 0]!
		// 	const x = -200 + i * 120 + this.random.next() * 60
		// 	const y = Math.max(bottom - 150 + this.random.next() * 20, this.game.ground.gridHeight / this.game.ground.scale)
		// 	ctx.drawImage(t.texture.texture, x, y, s, s * (t.texture.texture.height / t.texture.texture.width))
		// }
		// Côté
		// for (let i = 0; i < 12; ++i) {
		// 	ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
		// 	const s = 150 + this.random.next() * (80 + i * 8)
		// 	const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
		// 	ctx.drawImage(t.texture.texture, -s - 60 + this.random.next() * 80, -80 + i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.texture.height / t.texture.texture.width))
		// }
		// for (let i = 0; i < 12; ++i) {
		// 	ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
		// 	const s = 150 + this.random.next() * (80 + i * 8)
		// 	const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]!
		// 	ctx.drawImage(t.texture.texture, this.game.ground.gridWidth / this.game.ground.scale - 20 + this.random.next() * 60, -80 + i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.texture.height / t.texture.texture.width))
		// }

		// ctx.restore()
	}
}

export { Cemetery, Map, Beach, Castle, Desert, Factory, Forest, Japan, Glacier, Nexus, Arena, DarkNexus }
