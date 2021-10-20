import { EntityDirection, EntityType, FightEntity } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { SHADOW_QUALITY, T, Texture } from '@/component/player/game/texture'
import { WeaponAnimation, WhiteWeaponAnimation } from '@/component/player/game/weapons'
import { Cell } from '@/model/cell'
import { HatTemplate } from '@/model/hat'
import { LeekWars } from '@/model/leekwars'
import { S } from './sound'

const handSize = 20
const handSize2 = handSize / 2

class Leek extends FightEntity {

	public handTex!: Texture
	public hatFront!: Texture
	public hatBack!: Texture
	public hatName!: string
	public hat!: number
	// Animations
	public handPos = 0
	// Weapon
	public weapon: WeaponAnimation | null = null
	public weapon_name: string | null = null
	public skin!: number
	public hatTemplate!: HatTemplate
	public hatX: number = 0
	public hatWidth: number = 0
	public hatHeight: number = 0
	public hatY: number = 0
	public heightAnim: number = 0
	public scale: number = 1
	public fish: boolean = false

	constructor(game: Game, team: number, level: number) {
		super(game, EntityType.LEEK, team)
		this.baseZ = -5
		this.z = this.baseZ
	}

	public setSkin(skin: number, appearance: number, hat: number | null = null) {

		if (typeof LeekWars.skins[skin] === 'undefined') { skin = 1 }

		// if (this.id === 1) { appearance = 1 }
		this.scale = 0.68 - appearance * 0.01
		// this.scale = 1
		this.skin = skin
		this.bodyTexFront = T.get(this.game, "image/leek/leek" + appearance + "_front_" + LeekWars.skins[skin] + ".png", true, SHADOW_QUALITY)
		this.bodyTexBack = T.get(this.game, "image/leek/leek" + appearance + "_back_" + LeekWars.skins[skin] + ".png", true, SHADOW_QUALITY)

		this.baseHeight = this.bodyTexFront.texture.height * this.scale
		this.updateGrowth()
		this.bodyTexFront.texture.addEventListener('load', () => {
			this.baseHeight = this.bodyTexFront.texture.height * this.scale
			this.updateGrowth()
		})

		if (hat) {
			this.hat = hat
			this.hatTemplate = LeekWars.hats[LeekWars.hatTemplates[hat].item]
			this.hatName = this.hatTemplate.name
			this.hatFront = T.get(this.game, "image/hat/" + this.hatName + ".png", true, SHADOW_QUALITY)
			this.hatBack = T.get(this.game, "image/hat/" +  this.hatName + "_back.png", true, SHADOW_QUALITY)
			this.hatX = 0
		}
		const handTex = this.skin === 15 ? T.leek_hand_gold : T.leek_hand
		this.handTex = handTex.load(this.game)
		this.bloodTex = T.leek_blood.load(this.game)
		S.move.load(this.game)
	}

	public setWeapon(weapon: WeaponAnimation): void {
		this.weapon = weapon
	}

	public update(dt: number): void {
		super.update(dt)
		this.handPos = Math.cos(this.frame / 17 - Math.PI / 6) * 2.5
		this.handPos += (this.front ? 0 : 10)
		// Update weapon
		if (this.weapon != null) {
			this.weapon.update(dt)
		}
	}

	public useWeapon(cell: Cell, targets: FightEntity[], result: number): number {

		if (this.weapon == null) {
			return 0 // Il n'y aura pas d'anim
		}

		const pos = this.game.ground.field.cellToXY(cell)
		const x = pos.x
		const y = pos.y

		// Angle
		const south = this.y > y
		const east = this.x > x

		this.setOrientation(south ? (east ? EntityDirection.NORTH : EntityDirection.EAST) : (east ? EntityDirection.WEST : EntityDirection.SOUTH))

		if (result === 2) {
			this.addCritical()
		}

		this.angle = Math.atan2(Math.abs(this.x - x), (this.y - y) / 2) - Math.PI / 2

		const position = this.game.ground.xyToXYPixels(x, y)

		return this.weapon.shoot(this.ox, this.oy - this.z, this.handPos, this.angle, this.direction, position, targets, this, cell, this.scale)
	}

	public draw(ctx: CanvasRenderingContext2D): void {
		super.draw(ctx)

		ctx.save()
		ctx.scale(this.scale, this.scale)

		// Draw shadow
		if (this.game.shadows && !this.dead) {
			this.drawShadow(ctx)
		}
		// Draw normal
		ctx.scale(this.direction, 1)
		this.drawNormal(ctx)

		/*
		if (this.weapon) {
			// Center (debug)
			ctx.save()
			ctx.translate(this.weapon.cx, -this.weapon.cz - this.handPos)
			ctx.fillStyle = 'red'
			ctx.beginPath();
			ctx.arc(0, 0, 7, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.fill();
			ctx.restore()
		}
		*/

		ctx.restore()

		super.endDraw(ctx)

		/*
		if (this.weapon && !(this.weapon instanceof WhiteWeaponAnimation)) {
			// Shoot point (debug)
			const coord = this.weapon.getShootPoint(this.angle, this.handPos)
			const sx = (this.ox + coord.x * this.scale * this.direction ) * this.game.ground.scale
			const sy = (this.oy - this.z + (coord.y - coord.z) * this.scale) * this.game.ground.scale
			ctx.fillStyle = 'blue'
			ctx.beginPath();
			ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.fill();
		}
		*/
	}

	public drawNormal(ctx: CanvasRenderingContext2D): void {
		const texture = this.front ? this.bodyTexFront : this.bodyTexBack
		const hatTexture = this.front ? this.hatFront : this.hatBack

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
			const front = this.front ? 1 : -1
			ctx.drawImage(this.handTex.texture, 15 * front - 7, -32 - this.handPos - 3, handSize * 0.8, handSize * 0.8) // back hand
			this.drawBody(ctx, texture.texture, hatTexture ? hatTexture.texture : null)
			ctx.drawImage(this.handTex.texture, -18 * front - 7, -32 - this.handPos + 1, handSize, handSize) // front hand
		}
	}

	public drawWeapon(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement, shadow: boolean = false): void {
		if (!this.weapon) { return  }

		ctx.save()

		if (shadow) {
			ctx.scale(this.direction, 1)
		}

		// Translate to center
		ctx.translate(this.weapon.cx, -this.weapon.cz - this.handPos)

		// Rotate
		if (shadow) {
			ctx.rotate(this.angle / 2)
		} else {
			ctx.rotate(this.angle - this.weapon.recoilAngle * (Math.PI / 100))
		}

		if (this.weapon instanceof WhiteWeaponAnimation) {
			this.weapon.draw(ctx, texture, this.front)
		} else {
			// Translate to the weapon texture origin
			ctx.translate(this.weapon.x - this.weapon.recoil, this.weapon.z)
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

	public drawShadow(ctx: CanvasRenderingContext2D): void {

		const texture = this.front ? this.bodyTexBack : this.bodyTexFront
		const hatTexture = this.front ? this.hatBack : this.hatFront

		ctx.save()
		ctx.scale(1, -SHADOW_SCALE)
		ctx.rotate(-Math.PI / 4)
		ctx.globalAlpha = SHADOW_ALPHA

		ctx.translate(0, - this.z)

		if (this.weapon != null && (this.orientation === EntityDirection.SOUTH || this.orientation === EntityDirection.NORTH)) {
			this.drawBody(ctx, texture.shadow!, hatTexture ? hatTexture.shadow : null)
			this.drawWeapon(ctx, this.weapon.texture.shadow!, true)
		} else {
			this.drawBody(ctx, texture.shadow!, hatTexture ? hatTexture.shadow : null)
		}

		ctx.restore()
	}

	public drawBody(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement, hatTexture: HTMLImageElement | HTMLCanvasElement | null): void {

		if (texture == null) { return }

		ctx.save()

		ctx.scale(this.growth, this.oscillation * this.growth)

		if (this.flash > 0 && (Math.random() > 0.5 || this.flash < 2)) {
			ctx.globalCompositeOperation = 'lighter'
		}

		const leekWidth = this.bodyTexFront.texture.width

		// Body
		const height = this.bodyTexFront.texture.height
		ctx.drawImage(texture, -leekWidth / 2, -height, leekWidth, height)

		// Hat
		if (hatTexture) {
			if (this.hatX === 0) {
				this.hatWidth = leekWidth * this.hatTemplate.width
				this.hatHeight = this.hatWidth * (this.hatFront.texture.height / this.hatFront.texture.width)
				this.hatX = - this.hatWidth / 2 - (leekWidth / 25)
				this.hatY = -height + height * this.hatTemplate.height - this.hatHeight
			}
			ctx.drawImage(hatTexture, this.hatX, this.hatY, this.hatWidth, this.hatHeight)
		}
		ctx.restore()
	}
}

export { Leek }
