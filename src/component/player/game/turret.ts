import { Entity, EntityType } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { LeekWars } from '@/model/leekwars'
import { Texture, SHADOW_QUALITY } from './texture'
import { env } from '@/env'

class Piece {
	t!: Texture
	z!: number
}

class Turret extends Entity {

	base: Texture
	core: Texture
	block: Texture
	spikes: Texture
	plane: Texture
	pyramid_up: Texture
	pyramid_down: Texture
	hat: Texture
	pieces: Piece[]

	constructor(game: Game, team: number, level: number) {
		super(game, EntityType.TURRET)
		const color = team === 1 ? 'blue' : 'red'
		this.base = new Texture(game, env.STATIC + 'image/turret/base_' + color + '.png', true, SHADOW_QUALITY)
		this.core = new Texture(game, env.STATIC + 'image/turret/core_' + color + '.png', true, SHADOW_QUALITY)
		this.plane = new Texture(game, env.STATIC + 'image/turret/plane_' + color + '.png', true, SHADOW_QUALITY)
		this.block = new Texture(game, env.STATIC + 'image/turret/bloc_' + color + '.png', true, SHADOW_QUALITY)
		this.spikes = new Texture(game, env.STATIC + 'image/turret/spikes_' + color + '.png', true, SHADOW_QUALITY)
		this.hat = new Texture(game, env.STATIC + 'image/turret/hat_' + color + '.png', true, SHADOW_QUALITY)
		this.pyramid_up = new Texture(game, env.STATIC + 'image/turret/pyramid_up_' + color + '.png', true, SHADOW_QUALITY)
		this.pyramid_down = new Texture(game, env.STATIC + 'image/turret/pyramid_down_' + color + '.png', true, SHADOW_QUALITY)
		this.bodyTexFront = this.base

		if (level < 10) {
			this.pieces = [{t: this.pyramid_up, z: 25}, {t: this.core, z: 48}]
		} else if (level < 20) {
			this.pieces = [{t: this.pyramid_up, z: 25}, {t: this.core, z: 48}, {t: this.plane, z: 6}]
		} else if (level < 30) {
			this.pieces = [{t: this.pyramid_down, z: 28}, {t: this.pyramid_up, z: 13}, {t: this.core, z: 48}, {t: this.plane, z: 6}]
		} else if (level < 40) {
			this.pieces = [{t: this.pyramid_down, z: 28}, {t: this.pyramid_up, z: 13}, {t: this.block, z: 16}, {t: this.core, z: 47}, {t: this.plane, z: 6}]
		} else if (level < 50) {
			this.pieces = [{t: this.pyramid_down, z: 28}, {t: this.pyramid_up, z: 13}, {t: this.block, z: 16}, {t: this.core, z: 47}, {t: this.pyramid_up, z: 13}]
		} else if (level < 60) {
			this.pieces = [{t: this.base, z: 56}, {t: this.plane, z: 10}, {t: this.core, z: 47}, {t: this.pyramid_up, z: 13}]
		} else if (level < 70) {
			this.pieces = [{t: this.base, z: 56}, {t: this.block, z: 14}, {t: this.plane, z: 12}, {t: this.core, z: 47}, {t: this.pyramid_up, z: 13}]
		} else if (level < 80) {
			this.pieces = [{t: this.base, z: 56}, {t: this.pyramid_down, z: 20}, {t: this.pyramid_up, z: 13}, {t: this.core, z: 47}, {t: this.pyramid_up, z: 13}]
		} else if (level < 90) {
			this.pieces = [{t: this.base, z: 56}, {t: this.pyramid_down, z: 20}, {t: this.pyramid_up, z: 13}, {t: this.plane, z: 12}, {t: this.core, z: 47}, {t: this.pyramid_up, z: 13}]
		} else if (level < 100) {
			this.pieces = [{t: this.base, z: 56}, {t: this.pyramid_down, z: 20}, {t: this.pyramid_up, z: 13}, {t: this.block, z: 16}, {t: this.core, z: 47}, {t: this.pyramid_up, z: 13}]
		} else {
			this.pieces = [{t: this.base, z: 56}, {t: this.pyramid_down, z: 20}, {t: this.pyramid_up, z: 13}, {t: this.block, z: 16}, {t: this.core, z: 47}, {t: this.pyramid_up, z: 13}, {t: this.plane, z: 11}]
		}
	}

	public update(dt: number) {
		super.update(dt)
	}

	public draw(ctx: CanvasRenderingContext2D) {
		super.draw(ctx)
		// Draw normal
		this.drawNormal(ctx)
		// Draw shadow
		if (this.game.shadows && !this.dead) {
			this.drawShadow(ctx)
		}
		super.endDraw(ctx)
	}

	public drawNormal(ctx: CanvasRenderingContext2D) {
		let z = 0
		for (const piece of this.pieces) {
			this.drawPiece(ctx, piece.t, z -= piece.z)
		}
	}

	public drawPiece(ctx: CanvasRenderingContext2D, texture: Texture, z: number) {
		const scale = 0.3
		ctx.drawImage(texture.texture, -texture.texture.width * scale / 2, z, texture.texture.width * scale, texture.texture.height * scale)
	}

	public drawShadow(ctx: CanvasRenderingContext2D) {
		
	}
}

export { Turret }
