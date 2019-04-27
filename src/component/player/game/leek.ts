import { Entity, EntityDirection, EntityType } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { SHADOW_QUALITY, Texture } from '@/component/player/game/texture'
import { WeaponAnimation, WhiteWeaponAnimation } from '@/component/player/game/weapons'
import { HatTemplate } from '@/model/hat'
import { LeekWars } from '@/model/leekwars'

const SKINS = [
	"green", // 1
	"blue", // 2
	"yellow", // 3
	"red", // 4
	"orange", // 5
	"pink", // 6
	"cyan", // 7
	"purple", // 8
	"multi", // 9
	"rasta", // 10
	"white", // 11
	"black", // 12
	"alpha", // 13
	"apple", // 14
	"gold", // 15
]
const handSize = 14
const handSize2 = handSize / 2

class Leek extends Entity {
	public bodyTexFront!: Texture
	public bodyTexBack!: Texture
	public handTex!: Texture
	public hatFront!: Texture
	public hatBack!: Texture
	public hatName!: string
	public hat!: number
	// Animations
	public handPos = 0
	// Weapon
	public weapon: WeaponAnimation | null = null
	public skin: any
	public hatTemplate!: HatTemplate
	public hatX: number = 0
	public hatWidth: number = 0
	public hatHeight: number = 0
	public hatY: number = 0
	public heightAnim: number = 0

	constructor(game: Game) {
		super(game, EntityType.LEEK)
		this.baseZ = -5
		this.z = this.baseZ
	}

	public setSkin(skin: number, appearance: number, hat: number | null = null) {

		if (typeof SKINS[skin - 1] === 'undefined') { skin = 1 }

		this.skin = skin
		this.bodyTexFront = new Texture(this.game, LeekWars.staticURL + "image/leek/leek" + appearance + "_front_" + SKINS[skin - 1] + ".png", true, SHADOW_QUALITY)
		this.bodyTexBack = new Texture(this.game, LeekWars.staticURL + "image/leek/leek" + appearance + "_back_" + SKINS[skin - 1] + ".png", true, SHADOW_QUALITY)

		if (hat) {
			this.hat = hat
			this.hatTemplate = LeekWars.hats[LeekWars.hatTemplates[hat].item]
			this.hatName = this.hatTemplate.name
			this.hatFront = new Texture(this.game, LeekWars.staticURL + "image/hat/" + this.hatName + ".png", true, SHADOW_QUALITY)
			this.hatBack = new Texture(this.game, LeekWars.staticURL + "image/hat/" +  this.hatName + "_back.png", true, SHADOW_QUALITY)
			this.hatX = 0
		}
		this.handTex = this.game.T.leek_hand
	}

	public setWeapon(weapon: WeaponAnimation) {
		this.weapon = weapon
	}

	public update(dt: number) {
		super.update(dt)
		this.handPos = Math.cos(this.frame / 17 - Math.PI / 6) * 3
		// Update weapon
		if (this.weapon != null) {
			this.weapon.update(dt)
		}
	}

	public useWeapon(cell: number, targets: Entity[]) {

		if (this.weapon != null) {

			const pos = this.game.ground.cellToXY(cell)
			const x = pos.x
			const y = pos.y

			// Angle
			const south = this.y > y
			const east = this.x > x

			this.setOrientation(south ? (east ? EntityDirection.NORTH : EntityDirection.EAST) : (east ? EntityDirection.WEST : EntityDirection.SOUTH))

			this.angle = Math.atan2(Math.abs(this.x - x), (this.y - y) / 2) - Math.PI / 2

			const cellPixels = this.game.ground.xyToXYPixels(x, y)

			this.weapon.shoot(this.ox, this.oy, this.handPos + this.z, this.angle, this.direction, cellPixels, targets)

			if (this.weapon instanceof WhiteWeaponAnimation) {
				this.jump()
			}
		}
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
		const hatTexture = this.front ? this.hatFront : this.hatBack

		if (!this.dead) {
			if (this.weapon != null) {
				// Weapon !
				if (this.front) {
					this.drawBody(ctx, texture.texture, hatTexture ? hatTexture.texture : null)
					this.drawWeapon(ctx, this.weapon.texture.texture)
				} else {
					this.drawWeapon(ctx, this.weapon.texture.texture)
					this.drawBody(ctx, texture.texture, hatTexture ? hatTexture.texture : null)
				}
			} else {
				// No weapon
				ctx.drawImage(this.handTex.texture, 12 - 5, -20 - this.handPos - 5, 10, 10) // back hand
				this.drawBody(ctx, texture.texture, hatTexture ? hatTexture.texture : null)
				ctx.drawImage(this.handTex.texture, -12 - 7, -20 - this.handPos - 7, 14, 14) // front hand
			}
		} else if (this.heightAnim > 0) {

			ctx.save()
			ctx.scale(this.direction, 1)
			const realHeight = this.getHeight()
			this.heightAnim = Math.min(1, this.deadAnim * 1.5)
			const cropHeight = realHeight * this.heightAnim
			const scaledWidth = (texture.texture.width / 1.5) * Math.max(0.5, this.deadAnim)
			ctx.drawImage(texture.texture, 0, 0, texture.texture.width, texture.texture.height * this.heightAnim, -scaledWidth / 2, -cropHeight, scaledWidth, cropHeight)
			ctx.restore()
		}
	}

	public drawWeapon(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement, shadow: boolean = false) {
		if (!this.weapon) { return  }

		ctx.save()

		// Translate to center
		ctx.translate((this.weapon.cx + (this.front ? 0 : -this.weapon.ocx)) * this.direction, - this.weapon.cz - this.handPos + (this.front ? 5 : -5))

		// Inverse
		ctx.scale(this.direction * 0.6, 0.6)

		// Rotate
		if (shadow) {
			ctx.rotate(-this.angle * 1.5)
		} else {
			ctx.rotate(this.angle)
		}

		if (this.weapon instanceof WhiteWeaponAnimation) {
			this.weapon.draw(ctx, texture, this.front)
		} else {
			// Translate to the weapon texture origin
			ctx.translate(this.weapon.x - this.weapon.recoil + (this.front ? 2 : -8), this.weapon.z)
			// Draw the weapon
			ctx.drawImage(texture, 0, 0, this.weapon.texture.texture.width, this.weapon.texture.texture.height)
		}
		// Draw hands
		if (!shadow) {
			ctx.drawImage(this.handTex.texture, this.weapon.mx1 - handSize2, this.weapon.mz1 - handSize2, handSize, handSize)
			ctx.drawImage(this.handTex.texture, this.weapon.mx2 - handSize2, this.weapon.mz2 - handSize2, handSize, handSize)
		}
		ctx.restore()
	}

	public drawShadow(ctx: CanvasRenderingContext2D) {

		const texture = this.front ? this.bodyTexBack : this.bodyTexFront
		const hatTexture = this.front ? this.hatBack : this.hatFront

		ctx.save()
		ctx.scale(1, -SHADOW_SCALE)
		ctx.globalAlpha = SHADOW_ALPHA

		ctx.translate(0, - this.z)

		if (this.weapon != null) {
			this.drawBody(ctx, texture.shadow, hatTexture ? hatTexture.shadow : null)
			this.drawWeapon(ctx, this.weapon.texture.shadow, true)
		} else {
			this.drawBody(ctx, texture.shadow, hatTexture ? hatTexture.shadow : null)
		}

		ctx.restore()
	}

	public drawBody(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement, hatTexture: HTMLImageElement | HTMLCanvasElement | null) {

		if (texture == null) { return }

		ctx.save()

		if (this.flash > 0 && (Math.random() > 0.5 || this.flash < 2)) {
			ctx.globalCompositeOperation = 'lighter'
		}

		ctx.scale(this.direction, this.oscillation)

		const leekWidth = this.bodyTexFront.texture.width / 1.5

		// Body
		const realHeight = this.getHeight()
		ctx.drawImage(texture, -leekWidth / 2, -realHeight, leekWidth, realHeight)

		// Hat
		if (hatTexture) {
			if (this.hatX === 0) {
				this.hatWidth = leekWidth * this.hatTemplate.width
				this.hatHeight = this.hatWidth * (this.hatFront.texture.height / this.hatFront.texture.width)
				this.hatX = - this.hatWidth / 2 - (leekWidth / 25)
				this.hatY = -(this.getHeight() - this.getHeight() * this.hatTemplate.height + this.hatHeight)
			}
			ctx.drawImage(hatTexture, this.hatX, this.hatY, this.hatWidth, this.hatHeight)
		}
		ctx.restore()
	}
}

export { Leek }
