import { DamageType, EntityDirection, EntityType, FightEntity } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { SHADOW_QUALITY, T, Texture } from '@/component/player/game/texture'
import { WeaponAnimation, WhiteWeaponAnimation } from '@/component/player/game/weapons'
import { Cell } from '@/model/cell'
import { HatTemplate } from '@/model/hat'
import { LEEK_FACES } from "@/model/leek"
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
	// public weapon_name: string | null = null
	public skin!: number
	public metal!: boolean
	public face!: number
	public hatTemplate!: HatTemplate
	public heightAnim: number = 0
	public fish: boolean = false

	constructor(game: Game, team: number, level: number, name: string) {
		super(game, EntityType.LEEK, team, name)
		this.baseZ = -5
		this.z = this.baseZ
	}

	public setSkin(skin: number, appearance: number, hat: number | null = null, metal: boolean = false, face: number = 0) {

		if (typeof LeekWars.skins[skin] === 'undefined') { skin = 1 }

		this.scale = 0.68 - appearance * 0.01
		this.skin = skin
		this.metal = metal
		this.face = face
		const face_param = face === 0 ? '' : LEEK_FACES[face]
		this.bodyTexFront = T.get(this.game, "image/leek/svg/leek_" + appearance + "_front_" + LeekWars.skins[skin] + (metal ? '_metal' : '') + face_param + ".svg", true, SHADOW_QUALITY, LeekWars.SERVER)
		this.bodyTexBack = T.get(this.game, "image/leek/svg/leek_" + appearance + "_back_" + LeekWars.skins[skin] + (metal ? '_metal' : '') + face_param + ".svg", true, SHADOW_QUALITY, LeekWars.SERVER)

		if (this.bodyTexFront.loaded) {
			this.baseHeight = this.bodyTexFront.texture.height
			this.baseWidth = this.bodyTexFront.texture.width
			this.updateGrowth()
		} else {
			this.bodyTexFront.texture.addEventListener('load', () => {
				this.baseHeight = this.bodyTexFront.texture.height
				this.baseWidth = this.bodyTexFront.texture.width
				this.updateGrowth()
			}, { once: true })
		}

		if (hat) {
			this.hat = hat
			this.hatTemplate = LeekWars.hats[hat]
			this.hatName = this.hatTemplate.name
			this.hatFront = T.get(this.game, "image/hat/" + this.hatName + ".png?2", true, SHADOW_QUALITY)
			this.hatBack = T.get(this.game, "image/hat/" +  this.hatName + "_back.png?2", true, SHADOW_QUALITY)
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

	public frameTexture(includeHat: boolean): Texture {

		const canvas = document.createElement('canvas')
		canvas.width = this.baseWidth
		const hatTexture = this.front ? this.hatFront : this.hatBack
		const height = this.baseHeight + (this.hatTemplate ? ((this.bodyTexFront.texture.width * this.hatTemplate.width) * (hatTexture.texture.height / hatTexture.texture.width)) * (1 - this.hatTemplate.height) : 0)
		canvas.height = height * this.oscillation
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
		textureCtx.translate(canvas.width / 2, canvas.height)
		textureCtx.scale(this.scale * this.direction, this.scale)
		const bodyTexture = this.front ? this.bodyTexFront : this.bodyTexBack
		this.drawBody(textureCtx, bodyTexture.texture, includeHat && hatTexture ? hatTexture.texture : null)
		textureCtx.restore()

		this.scale = savedScale
		this.growth = savedGrowth

		return texture
	}

	public kill(animation: boolean, damageType: DamageType, dx: number, dy: number) {
		super.kill(animation, damageType, dx, dy)

		// console.log("kill", "dx", dx, "dy", dy)

		if (animation) {
			// Throw hat
			if (this.hat && damageType === DamageType.DEFAULT) {
				const leekWidth = this.bodyTexFront.texture.width
				const height = this.bodyTexFront.texture.height
				const hatX = -(leekWidth / 25)
				const hatTexture = this.front ? this.hatFront : this.hatBack
				const hatWidth = leekWidth * this.hatTemplate.width
				const hatHeight = hatWidth * (hatTexture.texture.height / hatTexture.texture.width)
				const hatZ = height - hatHeight * this.hatTemplate.height + hatHeight / 2
				const scale = this.scale * this.growth * leekWidth * this.hatTemplate.width / hatTexture.texture.width
				const hdx = dx * 1.5 + Math.random() * 2 - 1
				const hdy = dy * 1.5 + Math.random() * 2 - 1
				const hdz = Math.random() * 2
				// const dx = 0
				// const dy = 0
				// const dz = 0
				const rotation = Math.random() * 0.02 - 0.01
				this.game.particles.addGarbage(this.ox + hatX * this.scale * this.growth, this.oy, hatZ * this.scale * this.growth, hdx, hdy, hdz, hatTexture, this.direction, rotation, scale, 0, 70)
			}
			// Throw weapon
			if (this.weapon) {
				const wdx = dx * 1.5
				const wdy = dy * 1.5
				const dz = 2 + Math.random() * 3
				const rotation = Math.random() * 0.04 - 0.02
				const angle = this.weapon instanceof WhiteWeaponAnimation ? (this.direction === 1 ? -Math.PI / 3 : Math.PI / 3) : (this.direction === 1 ? this.angle : -this.angle)
				const cos = Math.cos(this.angle)
				const sin = Math.sin(this.angle)
				const cx = this.weapon.x + this.weapon.texture.texture.width / 2
				const cz = this.weapon.z + this.weapon.texture.texture.height / 2
				const x = (this.weapon.cx + cx * cos - cz * sin) * this.direction
				const y = this.weapon.cz - cx * sin + cz * cos
				const z = Math.max(1, this.handPos)
				this.game.particles.addGarbage(this.ox + x * this.scale, this.oy - y * this.scale, z * this.scale, wdx, wdy, dz, this.weapon.texture, this.direction, rotation, this.scale, angle, 70)
			}
		}
	}

	public draw(ctx: CanvasRenderingContext2D): void {
		super.draw(ctx)

		if (!this.dead) {

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
		}

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

		if (this.weapon != null && !this.dead) {
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
			if (!this.dead) {
				ctx.drawImage(this.handTex.texture, 15 * front - 7, -32 - this.handPos - 3, handSize * 0.8, handSize * 0.8) // back hand
			}
			this.drawBody(ctx, texture.texture, hatTexture ? hatTexture.texture : null)
			if (!this.dead) {
				ctx.drawImage(this.handTex.texture, -18 * front - 7, -32 - this.handPos + 1, handSize, handSize) // front hand
			}
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
			ctx.drawImage(texture, 0, 0, this.weapon.w, this.weapon.h)
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
			if (!this.dead) {
				this.drawWeapon(ctx, this.weapon.texture.shadow!, true)
			}
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
		const leekHeight = this.bodyTexFront.texture.height

		// Body
		const y = -leekHeight + (this.dead ? this.baseZ / this.scale : 0)
		ctx.drawImage(texture, 0, 0, texture.width, texture.height, -leekWidth / 2, y, leekWidth, leekHeight)

		// Hat
		if (hatTexture) {
			const hatWidth = leekHeight * 0.8 * this.hatTemplate.width
			const hatHeight = hatWidth * (hatTexture.height / hatTexture.width)
			ctx.drawImage(hatTexture, -hatWidth / 2, -leekHeight - hatHeight + hatHeight * this.hatTemplate.height, hatWidth, hatHeight)
		}
		ctx.restore()
	}
}

export { Leek }
