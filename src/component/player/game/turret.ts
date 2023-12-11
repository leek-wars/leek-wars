import { EntityType, FightEntity } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { Cell } from "@/model/cell"
import { TURRET_DATA } from '@/model/turret-data'
import { ChipAnimation } from "./chips"
import { SHADOW_QUALITY, T, Texture } from './texture'
import { i18n } from "@/model/i18n"

class Piece {
	i!: number
	t!: Texture
	z!: number
	w!: number
}

class Turret extends FightEntity {

	private static ANIMATION_DURATION = 50
	private static SCALE = 0.3

	textures: {[key: string]: Texture} = {}
	pieces: Piece[]
	chip_animation: number = 10
	chip_animation_z: number = 0

	constructor(game: Game, team: number, level: number, name: string) {
		super(game, EntityType.TURRET, team, name)

		this.translatedName = i18n.t('entity.turret') as string

		this.baseZ = 0
		const color = team === 1 ? 'blue' : 'red'
		this.textures.base = T.get(this.game, 'image/turret/base_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.core = T.get(this.game, 'image/turret/core_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.plane = T.get(this.game, 'image/turret/plane_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.block = T.get(this.game, 'image/turret/block_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.spikes = T.get(this.game, 'image/turret/spikes_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.pyramid_up = T.get(this.game, 'image/turret/pyramid_up_' + color + '.png', true, SHADOW_QUALITY)
		this.textures.pyramid_down = T.get(this.game, 'image/turret/pyramid_down_' + color + '.png', true, SHADOW_QUALITY)
		this.bodyTexFront = this.textures.base

		this.pieces = TURRET_DATA[Math.floor(level / 10)].map((piece, i) => (
			{i, t: this.textures[piece.t], z: piece.z, w: this.textures[piece.t].texture.width }
		))

		const load_piece = (piece: Piece) => {
			this.baseWidth = Math.max(this.baseWidth, piece.t.texture.width * Turret.SCALE)
			if (piece.i === this.pieces.length - 1) {
				this.baseHeight += piece.t.texture.height * Turret.SCALE
				this.height += piece.t.texture.height * Turret.SCALE
			} else {
				this.baseHeight += (piece.t.texture.height * Turret.SCALE - piece.z)
				this.height += (piece.t.texture.height * Turret.SCALE - piece.z)
			}
		}
		for (const piece of this.pieces) {
			if (piece.t.loaded) {
				load_piece(piece)
			} else {
				piece.t.texture.addEventListener('load', () => load_piece(piece), { once: true })
			}
		}
	}

	public update(dt: number) {
		super.update(dt)

		if (this.chip_animation > 0) {
			this.chip_animation -= dt
			this.chip_animation_z = Math.sin(Math.PI * this.chip_animation / Turret.ANIMATION_DURATION) * 10
		}
	}

	public useChip(chip: ChipAnimation, cell: Cell, targets: FightEntity[], result: number) {
		super.useChip(chip, cell, targets, result)

		this.chip_animation = Turret.ANIMATION_DURATION
	}

	public frameTexture(includeHat: boolean): Texture {

		const canvas = document.createElement('canvas')
		canvas.width = this.baseWidth
		canvas.height = this.baseHeight
		const textureCtx = canvas.getContext('2d')!
		const texture = new Texture('')
		texture.texture = canvas
		texture.ctx = textureCtx

		// Debug
		// textureCtx.strokeStyle = 'red'
		// textureCtx.lineWidth = 2
		// textureCtx.strokeRect(0, 0, canvas.width, canvas.height)

		const savedScale = this.scale
		const savedGrowth = this.growth
		this.scale = 1
		this.growth = 1

		textureCtx.save()
		textureCtx.translate(canvas.width / 2, this.baseZ + canvas.height - (this.pieces[0].t.texture.height * Turret.SCALE - this.pieces[0].z))
		textureCtx.scale(this.scale * this.direction, this.scale)
		this.drawNormal(textureCtx)
		textureCtx.restore()

		this.scale = savedScale
		this.growth = savedGrowth

		return texture
	}

	public draw(ctx: CanvasRenderingContext2D) {
		super.draw(ctx)
		if (!this.dead) {
			// Draw shadow
			if (this.game.shadows && !this.dead) {
				this.drawShadow(ctx)
			}
			// Draw normal
			this.drawNormal(ctx)
		}
		super.endDraw(ctx)
	}

	public drawNormal(ctx: CanvasRenderingContext2D) {
		let z = this.baseZ
		for (const piece of this.pieces) {
			this.drawPiece(ctx, piece.t, z -= (piece.z), false)
			z -= this.chip_animation_z
		}
	}

	public drawPiece(ctx: CanvasRenderingContext2D, texture: Texture, z: number, shadow: boolean) {

		ctx.drawImage(shadow ? texture.shadow! : texture.texture, -texture.texture.width * Turret.SCALE / 2, z, texture.texture.width * Turret.SCALE, texture.texture.height * Turret.SCALE)
	}

	public drawShadow(ctx: CanvasRenderingContext2D) {
		ctx.save()
		ctx.scale(1, -SHADOW_SCALE)
		ctx.rotate(-Math.PI / 4)
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
