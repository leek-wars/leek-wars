import { EntityType, FightEntity } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { SHADOW_QUALITY, T, Texture } from './texture'
import { i18n } from "@/model/i18n"

class Chest extends FightEntity {

	public chestScale: number = 1

	constructor(game: Game, team: number, level: number, name: string) {
		super(game, EntityType.CHEST, team, name)
		this.baseZ = -16

		this.bodyTexFront = T.get(this.game, 'image/chest/' + this.name + '.png', true, SHADOW_QUALITY)
		this.bodyTexBack = this.bodyTexFront
		this.chestScale = 0.3 + level / 5000
		this.translatedName = i18n.t('entity.' + this.name) as string

		if (this.bodyTexFront.loaded) {
			this.baseHeight = this.bodyTexFront.texture.height * this.chestScale
			this.baseWidth = this.bodyTexFront.texture.width * this.chestScale
			this.updateGrowth()
		} else {
			this.bodyTexFront.texture.addEventListener('load', () => {
				this.baseHeight = this.bodyTexFront.texture.height * this.chestScale
				this.baseWidth = this.bodyTexFront.texture.width * this.chestScale
				this.updateGrowth()
			}, { once: true })
		}
	}

	public frameTexture(includeHat: boolean): Texture {

		const canvas = document.createElement('canvas')
		canvas.width = this.baseWidth
		canvas.height = this.baseHeight + this.baseZ
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
		textureCtx.translate(canvas.width / 2, canvas.height - this.baseZ)
		textureCtx.scale(this.scale, this.scale)
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
		const texture = this.front ? this.bodyTexFront : this.bodyTexBack
		this.drawBody(ctx, texture.texture)
	}

	public drawBody(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement) {
		if (texture == null) { return }
		ctx.save()
		if (this.flash > 0 && (Math.random() > 0.5 || this.flash < 2)) {
			ctx.globalCompositeOperation = 'lighter'
		}
		ctx.scale(this.chestScale * this.growth, this.chestScale * this.growth)
		// Body
		const width = this.bodyTexFront.texture.width
		const height = this.bodyTexFront.texture.height
		// console.log(this.growth, width, height)
		const y = height * (this.deadAnim - 1)
		ctx.drawImage(texture, 0, 0, texture.width, texture.height * (1 - this.deadAnim), -width / 2, y, width, -y)

		ctx.restore()
	}

	public drawShadow(ctx: CanvasRenderingContext2D) {
		const texture = this.front ? this.bodyTexBack : this.bodyTexFront
		ctx.save()
		ctx.globalAlpha = SHADOW_ALPHA
		ctx.scale(1, -SHADOW_SCALE)
		ctx.translate(0, - this.z)
		ctx.rotate(-Math.PI / 4)
		this.drawBody(ctx, texture.shadow!)
		ctx.restore()
	}
}

export { Chest }
