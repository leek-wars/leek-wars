import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { S, Sound } from '@/component/player/game/sound'
import { T, Texture } from '@/component/player/game/texture'
import { Cell } from '@/model/cell'
import { LeekWars } from '@/model/leekwars'

class MapOptions {
	public sound!: Sound
	public groundTexture!: Texture
	public patternTexture!: Texture
	public margin!: number
	public radius!: number
	public smallObstacles!: (Texture | null)[]
	public largeObstacles!: (Texture | null)[]
	public tacticSmallColor!: string
	public tacticLargeColor!: string
	public gridColor!: string
	public smoothPattern!: boolean
	public dark!: boolean
	public reachableColor!: string
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
		this.options.patternTexture.load(this.game)
		for (const texture of this.options.smallObstacles) {
			if (texture) {
				texture.load(this.game)
			}
		}
		for (const texture of this.options.largeObstacles) {
			if (texture) {
				texture.load(this.game)
			}
		}
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
			patternTexture: T.desert,
			margin: 10,
			radius: 10,
			smallObstacles: [T.starfish, T.starfish2, T.palm],
			largeObstacles: [T.pebble, T.pebble, T.pebble],
			tacticSmallColor: '#aaaaaa',
			tacticLargeColor: '#ffff00',
			gridColor: '#000',
			smoothPattern: true,
			dark: false,
			reachableColor: '#333'
		})
		T.starfish.offset = 1.2
		T.starfish2.offset = 1.2
		T.palm.offset = 4.0
	}
}

class Desert extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_desert,
			groundTexture: T.desert,
			patternTexture: T.beach,
			margin: 10,
			radius: 10,
			smallObstacles: [T.desert_rock2_small, T.desert_grass, T.cactus],
			largeObstacles: [T.desert_rock1_big, T.desert_rock2_big, T.desert_rock3_big],
			tacticSmallColor: "#ffc000",
			tacticLargeColor: "#ffc000",
			gridColor: '#000',
			smoothPattern: true,
			dark: false,
			reachableColor: '#333'
		})
		T.cactus.offset = 2.0
		T.desert_grass.offset = 2.0
	}
	public create() {
		super.create()
		T.skull.load(this.game)
	}
	public drawDecor(ctx: CanvasRenderingContext2D) {
		const num = 3 + Math.random() * 3
		for (let i = 0; i < num; i++) {
			const scale = Math.random() + 0.5
			const padding = Math.max(T.skull.texture.width * scale, T.skull.texture.height * scale) / 2
			const x = padding + Math.random() * (this.game.ground.realGridWidth - 2 * padding)
			const y = padding + Math.random() * (this.game.ground.realGridHeight - 2 * padding)
			const angle = Math.random() * 2 * Math.PI
			ctx.save()
			ctx.translate(x, y)
			ctx.scale(scale, scale)
			ctx.rotate(angle)
			ctx.drawImage(T.skull.texture, 0, 0)
			ctx.restore()
		}
	}
}

class Factory extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_factory,
			groundTexture: T.factory_metal_2,
			patternTexture: T.factory_metal,
			margin: 8,
			radius: 3,
			smallObstacles: [T.cone, T.barrel, T.cone],
			largeObstacles: [T.cone, T.cone, T.barrel],
			tacticSmallColor: "#1072ce",
			tacticLargeColor: "#bb0000",
			gridColor: '#fff',
			smoothPattern: true,
			dark: true,
			reachableColor: '#fff'
		})
		T.barrel.offset = 0.9
		T.cone.offset = 1.15
		T.box.offset = 1.2
	}

	public create() {
		super.create()
		T.arrows.load(this.game)
		T.factory_bolt.load(this.game)
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

		const numB = 50 + this.random.next() * 100
		const r = T.factory_bolt.texture.height / T.factory_bolt.texture.width

		for (let i = 0; i < numB; ++i) {
			const s = this.random.next() > 0.8 ? 20 : 14
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
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {
		ctx.save()
		ctx.scale(this.game.ground.scale, this.game.ground.scale)
		for (let i = 0; i < 14; ++i) {
			const s = (80 + this.random.next() * 50)
			const t = this.options.smallObstacles[this.random.next() * this.options.largeObstacles.length | 0]
			if (t) {
				const h = s * (t.texture.height / t.texture.width)
				ctx.drawImage(t.texture, -150 + i * 100 + this.random.next() * 40, - 10 - h + this.random.next() * 40, s, h)
			}
		}
		ctx.filter = "brightness(10%)"
		for (let i = 0; i < 12; ++i) {
			const s = 60 + this.random.next() * 100
			const t = this.options.smallObstacles[this.random.next() * this.options.largeObstacles.length | 0]
			if (t) {
				ctx.drawImage(t.texture, -200 + i * 120 + this.random.next() * 60, (this.game.ground.gridHeight / this.game.ground.scale) + this.random.next() * 40, s, s * (t.texture.height / t.texture.width))
			}
		}
		// Côté
		// for (let i = 0; i < 12; ++i) {
		// 	ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
		// 	const s = 150 + this.random.next() * (80 + i * 8)
		// 	const t = this.random.next() > 0.4 ? T.fern : T.stump
		// 	ctx.drawImage(t.texture, 160 - s + this.random.next() * 30, i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.height / t.texture.width))
		// }
		ctx.restore()
	}
}

class Forest extends Map {
	leafs!: Texture[]

	constructor(game: Game) {
		super(game, {
			sound: S.map_forest,
			groundTexture: T.dirt,
			patternTexture: T.forest_grass,
			margin: 12,
			radius: 20,
			smallObstacles: [T.forest_rock_small, T.forest_flower, T.mushroom],
			largeObstacles: [T.forest_rock, T.stump, T.fern],
			tacticSmallColor: "#8f520b",
			tacticLargeColor: "#1c6000",
			gridColor: '#fff',
			smoothPattern: false,
			dark: true,
			reachableColor: '#fff'
		})
		T.stump.offset = 1.3
		T.fern.offset = 1.1
		T.mushroom.offset = 1
		T.forest_rock.offset = 0.88
	}

	public create() {
		super.create()
		T.little_grass.load(this.game)
		T.little_grass_2.load(this.game)
		T.branch.load(this.game)
		T.forest_branch.load(this.game)
	}

	public drawCellDetails(ctx: CanvasRenderingContext2D, cell: Cell) {

		const w = this.game.ground.tileSizeX * 0.8
		const h = this.game.ground.tileSizeY * 0.8

		const tex = cell.color ? T.caillou : (this.random.next() > 0.5 ? T.little_grass : T.little_grass_2)
		const count = cell.color ? this.random.next() * 0 : this.random.next() * 10
		const minS = cell.color ? 2 : 8
		const maxS = cell.color ? 8 : 16

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
		const num = 50 + this.random.next() * 100

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
		ctx.scale(this.game.ground.scale, this.game.ground.scale)
		for (let i = 0; i < 14; ++i) {
			const s = (120 + this.random.next() * 120)
			const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]
			if (t) {
				const dh = s * (t.texture.height / t.texture.width)
				ctx.drawImage(t.texture, -150 + i * 100 + this.random.next() * 40, - 10 - dh + this.random.next() * 20, s, dh)
			}
		}
		ctx.filter = "brightness(10%)"
		for (let i = 0; i < 12; ++i) {
			const s = 150 + this.random.next() * 130
			const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]
			if (t) {
				ctx.drawImage(t.texture, -200 + i * 120 + this.random.next() * 60, (this.game.ground.gridHeight / this.game.ground.scale) + this.random.next() * 20, s, s * (t.texture.height / t.texture.width))
			}
		}
		// Côté
		// for (let i = 0; i < 12; ++i) {
		// 	ctx.filter = "brightness(" + (100 - (i / 12) * 100) + "%)"
		// 	const s = 150 + this.random.next() * (80 + i * 8)
		// 	const t = this.random.next() > 0.4 ? T.fern : T.stump
		// 	ctx.drawImage(t.texture, 160 - s + this.random.next() * 30, i * 70 - 10 + this.random.next() * 20, s, s * (t.texture.height / t.texture.width))
		// }
		// Branches
		const brightness = 40
		ctx.filter = "brightness(" + brightness  + "%)"
		const h = this.game.ground.startY / this.game.ground.scale + Math.random() * 80
		const w = h * (T.forest_branch.texture.width / T.forest_branch.texture.height)
		ctx.drawImage(T.forest_branch.texture, 0, -h, w, h)
		ctx.restore()
	}
}

class Glacier extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_glacier,
			groundTexture: T.glacier_snow,
			patternTexture: T.glacier,
			margin: 5,
			radius: 20,
			smallObstacles: [T.ice_small, T.ice_small, T.ice_small],
			largeObstacles: [T.snowman, T.fir, T.ice],
			tacticSmallColor: "#777777",
			tacticLargeColor: "#333333",
			gridColor: '#000',
			smoothPattern: true,
			dark: false,
			reachableColor: '#333'
		})
		T.fir.offset = 1.5
		T.snowman.offset = 0.8
	}
}

class Nexus extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_nexus,
			groundTexture: T.nexus_bg,
			patternTexture: T.nexus_bg,
			margin: 5,
			radius: 10,
			smallObstacles: [T.nexus_block_small, T.nexus_block_small, T.nexus_block_small],
			largeObstacles: [T.nexus_block, T.nexus_block, T.nexus_block],
			tacticSmallColor: "#dddddd",
			tacticLargeColor: "#eeeeee",
			gridColor: '#000',
			smoothPattern: true,
			dark: false,
			reachableColor: '#333'
		})
		T.nexus_block.offset = 1.177
		T.nexus_block_small.offset = 1.18
	}
}

class Arena extends Map {
	constructor(game: Game) {
		super(game, {
			sound: S.map_desert,
			groundTexture: T.arena,
			patternTexture: T.arena,
			margin: 5,
			radius: 10,
			smallObstacles: [T.grass, T.pillar, T.small_cube],
			largeObstacles: [T.pyramid, T.cube, T.square],
			tacticSmallColor: "#aca28b",
			tacticLargeColor: "#aca28b",
			gridColor: '#000',
			smoothPattern: true,
			dark: false,
			reachableColor: '#fff'
		})
		T.grass.offset = 1.5
		T.pillar.offset = 1.3
		T.cube.offset = 1.0
		T.small_cube.offset = 0.9
		T.square.offset = 1.1
	}

	public drawDecor(ctx: CanvasRenderingContext2D) {
		ctx.save()
		ctx.scale(this.game.ground.scale, this.game.ground.scale)

		ctx.filter = "brightness(60%)"
		for (let i = 0; i < 12; ++i) {
			const s = 150 + this.random.next() * 130
			const t = this.options.largeObstacles[this.random.next() * this.options.largeObstacles.length | 0]
			if (t) {
				ctx.drawImage(t.texture, -200 + i * 120 + this.random.next() * 60, (this.game.ground.gridHeight / this.game.ground.scale) + this.random.next() * 50, s, s * (t.texture.height / t.texture.width))
			}
		}
		ctx.restore()
	}
}

export { Map, Beach, Desert, Factory, Forest, Glacier, Nexus, Arena }
