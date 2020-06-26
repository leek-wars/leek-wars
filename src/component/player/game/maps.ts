import { Game } from '@/component/player/game/game'
import { Sound } from '@/component/player/game/sound'
import { Texture } from '@/component/player/game/texture'

abstract class Map {
	public game: Game
	public sound: Sound
	public groundColor: string
	public groundTexture: Texture
	public obstaclesSmall: Texture[]
	public obstaclesBig: Texture[]
	constructor(game: Game, sound: Sound, groundColor: string, groundTexture: Texture, obstaclesSmall: Texture[], obstaclesBig: Texture[]) {
		this.game = game
		this.sound = sound
		this.groundColor = groundColor
		this.groundTexture = groundTexture
		this.obstaclesSmall = obstaclesSmall
		this.obstaclesBig = obstaclesBig
	}
	drawDecor(ctx: CanvasRenderingContext2D) {
		// nothing by default
	}
}
class Beach extends Map {
	constructor(game: Game) {
		super(game, game.S.map_beach, "#ffff52", game.T.beach,
			[game.T.starfish, game.T.starfish2, game.T.palm],
			[game.T.pebble, game.T.pebble, game.T.pebble])
		game.T.starfish.offset = 1.2
		game.T.starfish2.offset = 1.2
		game.T.palm.offset = 4.0
	}
}
class Desert extends Map {
	constructor(game: Game) {
		super(game, game.S.map_desert, "#ffc000", game.T.desert,
			[game.T.desert_rock2_small, game.T.desert_grass, game.T.cactus],
			[game.T.desert_rock1_big, game.T.desert_rock2_big, game.T.desert_rock3_big])
		game.T.cactus.offset = 2.0
		game.T.desert_grass.offset = 2.0
	}
	public drawDecor(ctx: CanvasRenderingContext2D) {
		const num = 3 + Math.random() * 3
		for (let i = 0; i < num; i++) {
			const scale = Math.random() + 0.5
			const padding = Math.max(this.game.T.skull.texture.width * scale, this.game.T.skull.texture.height * scale) / 2
			const x = padding + Math.random() * (this.game.ground.realGridWidth - 2 * padding)
			const y = padding + Math.random() * (this.game.ground.realGridHeight - 2 * padding)
			const angle = Math.random() * 2 * Math.PI
			ctx.save()
			ctx.translate(x, y)
			ctx.scale(scale, scale)
			ctx.rotate(angle)
			ctx.drawImage(this.game.T.skull.texture, 0, 0)
			ctx.restore()
		}
	}
}
class Factory extends Map {
	constructor(game: Game) {
		super(game, game.S.map_factory, "#8C8C8C", game.T.factory,
			[game.T.box, game.T.barrel, game.T.cone],
			[game.T.big_box, game.T.big_box, game.T.cone_big])
		game.T.barrel.offset = 1.0
		game.T.cone.offset = 1.15
		game.T.box.offset = 1.2
	}
}
class Forest extends Map {
	constructor(game: Game) {
		super(game, game.S.map_forest, "#2a6800", game.T.forest,
			[game.T.forest_rock_small, game.T.forest_rock_small, game.T.mushroom],
			[game.T.forest_rock, game.T.stump, game.T.stump])
		game.T.stump.offset = 1.1
		game.T.mushroom.offset = 1.3
	}
	public drawDecor(ctx: CanvasRenderingContext2D) {
		const leafs = [this.game.T.leaf, this.game.T.leaf2, this.game.T.leaf3, this.game.T.leaf4]
		const num = 500 + Math.random() * 500

		for (let i = 0; i < num; i++) {

			const texture = leafs[Math.floor(Math.random() * leafs.length)].texture
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
		super(game, game.S.map_glacier, "#2effff", game.T.glacier,
			[game.T.ice_small, game.T.ice_small, game.T.ice_small],
			[game.T.snowman, game.T.fir, game.T.ice])
		game.T.fir.offset = 1.5
		game.T.snowman.offset = 0.8
	}
}
class Nexus extends Map {
	constructor(game: Game) {
		super(game, game.S.map_nexus, "#fff", game.T.nexus_bg,
			[game.T.nexus_block_small, game.T.nexus_block_small, game.T.nexus_block_small],
			[game.T.nexus_block, game.T.nexus_block, game.T.nexus_block])
		game.T.nexus_block.offset = 1.177
		game.T.nexus_block_small.offset = 1.18
	}
}
class Arena extends Map {
	constructor(game: Game) {
		super(game, game.S.map_desert, "#aca28b", game.T.arena,
			[game.T.grass, game.T.pillar, game.T.small_cube],
			[game.T.pyramid, game.T.cube, game.T.square])
		game.T.grass.offset = 1.5
		game.T.pillar.offset = 1.3
		game.T.cube.offset = 1.0
		game.T.small_cube.offset = 0.9
		game.T.square.offset = 1.1
	}
}

export { Map, Beach, Desert, Factory, Forest, Glacier, Nexus, Arena }
