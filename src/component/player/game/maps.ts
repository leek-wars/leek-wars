import { Game } from '@/component/player/game/game'
import { S, Sound } from '@/component/player/game/sound'
import { T, Texture } from '@/component/player/game/texture'

abstract class Map {
	public game: Game
	public sound: Sound
	public groundColor: string
	public groundTexture: Texture
	public obstaclesSmall: Texture[]
	public obstaclesBig: Texture[]
	public reachableColor: string
	constructor(game: Game, sound: Sound, groundColor: string, groundTexture: Texture, obstaclesSmall: Texture[], obstaclesBig: Texture[], reachableColor: string) {
		this.game = game
		this.sound = sound
		this.groundColor = groundColor
		this.groundTexture = groundTexture
		this.obstaclesSmall = obstaclesSmall
		this.obstaclesBig = obstaclesBig
		this.reachableColor = reachableColor
	}
	create() {
		this.sound.load(this.game)
		this.groundTexture.load(this.game)
		for (const texture of this.obstaclesSmall) {
			if (texture) {
				texture.load(this.game)
			}
		}
		for (const texture of this.obstaclesBig) {
			if (texture) {
				texture.load(this.game)
			}
		}
	}
	drawDecor(ctx: CanvasRenderingContext2D) {
		// nothing by default
	}
}
class Beach extends Map {
	constructor(game: Game) {
		super(game, S.map_beach, "#ffff52", T.beach,
			[T.starfish, T.starfish2, T.palm],
			[T.pebble, T.pebble, T.pebble], "#333")
		T.starfish.offset = 1.2
		T.starfish2.offset = 1.2
		T.palm.offset = 4.0
	}
}
class Desert extends Map {
	constructor(game: Game) {
		super(game, S.map_desert, "#ffc000", T.desert,
			[T.desert_rock2_small, T.desert_grass, T.cactus],
			[T.desert_rock1_big, T.desert_rock2_big, T.desert_rock3_big], "#333")
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
		super(game, S.map_factory, "#8C8C8C", T.factory,
			[T.box, T.barrel, T.cone],
			[T.big_box, T.big_box, T.cone_big], "#fff")
		T.barrel.offset = 1.0
		T.cone.offset = 1.15
		T.box.offset = 1.2
	}
}
class Forest extends Map {
	private leafs = [T.leaf, T.leaf2, T.leaf3, T.leaf4]
	constructor(game: Game) {
		super(game, S.map_forest, "#2a6800", T.forest,
			[T.forest_rock_small, T.forest_rock_small, T.mushroom],
			[T.forest_rock, T.stump, T.stump], "#fff")
		T.stump.offset = 1.1
		T.mushroom.offset = 1.3
	}
	public create() {
		super.create()
		for (const leaf of this.leafs) {
			leaf.load(this.game)
		}
	}
	public drawDecor(ctx: CanvasRenderingContext2D) {
		const num = 500 + Math.random() * 500

		for (let i = 0; i < num; i++) {

			const texture = this.leafs[Math.floor(Math.random() * this.leafs.length)].texture
			const scale = 0.4 + Math.random() * 2.1
			const padding = Math.max(texture.width * scale, texture.height * scale) / 2

			const x = padding + Math.random() * (this.game.ground.realGridWidth - 2 * padding)
			const y = padding + Math.random() * (this.game.ground.realGridHeight - 2 * padding)
			const angle = Math.random() * 2 * Math.PI

			ctx.save()
			ctx.translate(x, y)
			ctx.scale(scale, scale)
			ctx.rotate(angle)
			ctx.drawImage(texture, 0, 0)
			ctx.restore()
		}
	}
}
class Glacier extends Map {
	constructor(game: Game) {
		super(game, S.map_glacier, "#2effff", T.glacier,
			[T.ice_small, T.ice_small, T.ice_small],
			[T.snowman, T.fir, T.ice], "#333")
		T.fir.offset = 1.5
		T.snowman.offset = 0.8
	}
}
class Nexus extends Map {
	constructor(game: Game) {
		super(game, S.map_nexus, "#f2f2f2", T.nexus_bg,
			[T.nexus_block_small, T.nexus_block_small, T.nexus_block_small],
			[T.nexus_block, T.nexus_block, T.nexus_block], "#333")
		T.nexus_block.offset = 1.177
		T.nexus_block_small.offset = 1.18
	}
}
class Arena extends Map {
	constructor(game: Game) {
		super(game, S.map_desert, "#aca28b", T.arena,
			[T.grass, T.pillar, T.small_cube],
			[T.pyramid, T.cube, T.square], "#fff")
		T.grass.offset = 1.5
		T.pillar.offset = 1.3
		T.cube.offset = 1.0
		T.small_cube.offset = 0.9
		T.square.offset = 1.1
	}
}

export { Map, Beach, Desert, Factory, Forest, Glacier, Nexus, Arena }
