import { Entity, EntityType } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { env } from '@/env'
import { TURRET_DATA } from '@/model/turret-data'
import { SHADOW_QUALITY, Texture } from './texture'

class Piece {
	t!: Texture
	z!: number
}

class Turret extends Entity {

	textures: {[key: string]: Texture} = {}
	pieces: Piece[]

	constructor(game: Game, team: number, level: number) {
		super(game, EntityType.TURRET)
		const color = team === 1 ? 'blue' : 'red'
		this.textures.base = new Texture(game, env.STATIC + 'image/turret/base_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.core = new Texture(game, env.STATIC + 'image/turret/core_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.plane = new Texture(game, env.STATIC + 'image/turret/plane_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.block = new Texture(game, env.STATIC + 'image/turret/block_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.spikes = new Texture(game, env.STATIC + 'image/turret/spikes_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.hat = new Texture(game, env.STATIC + 'image/turret/hat_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.pyramid_up = new Texture(game, env.STATIC + 'image/turret/pyramid_up_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.pyramid_down = new Texture(game, env.STATIC + 'image/turret/pyramid_down_' + color + '.png', true, SHADOW_QUALITY)
		this.bodyTexFront = this.textures.base

		this.pieces = TURRET_DATA[Math.floor(level / 10)].map(piece => ({t: this.textures[piece.t], z: piece.z}))
	}

	public update(dt: number) {
		super.update(dt)
	}

	public draw(ctx: CanvasRenderingContext2D) {
		super.draw(ctx)
		// Draw shadow
		if (this.game.shadows && !this.dead) {
			this.drawShadow(ctx)
		}
		// Draw normal
		this.drawNormal(ctx)
		super.endDraw(ctx)
	}

	public drawNormal(ctx: CanvasRenderingContext2D) {
		let z = 0
		for (const piece of this.pieces) {
			this.drawPiece(ctx, piece.t, z -= piece.z, false)
		}
	}

	public drawPiece(ctx: CanvasRenderingContext2D, texture: Texture, z: number, shadow: boolean) {
		const scale = 0.3
		ctx.drawImage(shadow ? texture.shadow : texture.texture, -texture.texture.width * scale / 2, z, texture.texture.width * scale, texture.texture.height * scale)
	}

	public drawShadow(ctx: CanvasRenderingContext2D) {
		ctx.save()
		ctx.scale(1, -SHADOW_SCALE)
		ctx.globalAlpha = SHADOW_ALPHA

		ctx.translate(0, - this.z)

		let z = 0
		for (const piece of this.pieces) {
			this.drawPiece(ctx, piece.t, z -= piece.z, true)
		}
		ctx.restore()
	}
}

export { Turret }
