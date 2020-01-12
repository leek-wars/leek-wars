import { Entity, EntityType } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { LeekWars } from '@/model/leekwars'

class Bulb extends Entity {
	public skin!: number
	public bulbName!: string
	public heightAnim!: number

	constructor(game: Game, team: number, level: number) {
		super(game, EntityType.BULB, team)
		this.baseZ = -6
		this.z = this.baseZ
		this.bloodTex = this.game.T.leek_blood
	}

	public setSkin(skin: number) {
		this.bulbName = LeekWars.summonTemplates[skin].name
		this.skin = skin
		if (skin === 1) {
			this.bodyTexFront = this.game.T.bulb_front
			this.bodyTexBack = this.game.T.bulb_back
		} else if (skin === 2) {
			this.bodyTexFront = this.game.T.fire_bulb_front
			this.bodyTexBack = this.game.T.fire_bulb_back
		} else if (skin === 3) {
			this.bodyTexFront = this.game.T.healer_bulb_front
			this.bodyTexBack = this.game.T.healer_bulb_back
		} else if (skin === 4) {
			this.bodyTexFront = this.game.T.rocky_bulb_front
			this.bodyTexBack = this.game.T.rocky_bulb_back
		} else if (skin === 5) {
			this.bodyTexFront = this.game.T.iced_bulb_front
			this.bodyTexBack = this.game.T.iced_bulb_back
		} else if (skin === 6) {
			this.bodyTexFront = this.game.T.lightning_bulb_front
			this.bodyTexBack = this.game.T.lightning_bulb_back
		} else if (skin === 7) {
			this.bodyTexFront = this.game.T.metallic_bulb_front
			this.bodyTexBack = this.game.T.metallic_bulb_back
		}
	}

	public update(dt: number) {
		super.update(dt)
	}

	public randomHurt() {
		const z = 20 + Math.random() * 40
		const dx = Math.random() * 30 - 15
		const dy = Math.random() * 30 - 15
		const dz = Math.random() * 30 - 15
		const x = this.ox + Math.random() * 40 - 20
		const y = this.oy + Math.random() * 40 - 20
		this.hurt(x, y, z, dx, dy, dz)
	}

	public hurt(x: number, y: number, z: number, dx: number, dy: number, dz: number) {
		// Blood
		const dir = Math.random()
		dx *= dir / 10
		dy *= dir / 10
		let bx = this.ox + dx * (40 + Math.random() * 60)
		let by = this.oy + dy *  (40 + Math.random() * 60)
		this.game.particles.addBlood(x, y, z, dx, dy, dz, this.bloodTex)
		this.game.particles.addBloodOnGround(bx, by, this.bloodTex)
		dx = -dx
		dy = -dy
		bx = this.ox + dx * (40 + Math.random() * 60)
		by = this.oy + dy * (40 + Math.random() * 60)
		this.game.particles.addBlood(x, y, z, dx, dy, dz, this.bloodTex)
		this.game.particles.addBloodOnGround(bx, by, this.bloodTex)
		this.flash = 5
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
		const texture = this.front ? this.bodyTexFront : this.bodyTexBack
		if (!this.dead) {
			this.drawBody(ctx, texture.texture)
		} else if (this.heightAnim > 0) {
			ctx.save()
			ctx.scale(this.direction, 1)
			const realHeight = this.getHeight() * 0.7
			this.heightAnim = Math.min(1, this.deadAnim * 1.5)
			const cropHeight = realHeight * this.heightAnim
			const scaledWidth = (texture.texture.width * 0.7 / 1.5) * Math.max(0.5, this.deadAnim)
			ctx.drawImage(texture.texture, 0, 0, texture.texture.width, texture.texture.height * this.heightAnim, -scaledWidth / 2, -cropHeight, scaledWidth, cropHeight)
			ctx.restore()
		}
	}

	public drawShadow(ctx: CanvasRenderingContext2D) {
		const texture = this.front ? this.bodyTexBack : this.bodyTexFront
		ctx.save()
		ctx.scale(1, -SHADOW_SCALE)
		ctx.globalAlpha = SHADOW_ALPHA
		ctx.translate(0, - this.z)
		this.drawBody(ctx, texture.shadow)
		ctx.restore()
	}

	public drawBody(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement) {
		if (texture == null) { return }
		ctx.save()
		if (this.flash > 0 && (Math.random() > 0.5 || this.flash < 2)) {
			ctx.globalCompositeOperation = 'lighter'
		}
		ctx.scale(this.direction, this.oscillation)
		// Body
		const realHeight = this.getHeight() * 0.7
		ctx.drawImage(texture, -this.bodyTexFront.texture.width * 0.7 / 1.5 / 2, -realHeight, this.bodyTexFront.texture.width * 0.7 / 1.5, realHeight)
		ctx.restore()
	}
}

export { Bulb }
